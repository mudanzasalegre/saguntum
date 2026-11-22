// Local plan: documented positions, contemporary OSM walls and IGN terrain.
// Labels are displaced only for readability; leader lines retain the real point.
const project = (lon, lat) => ({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const fallback = {background:'#102b31',surface:'#193a40',text:'#f4f4ec',muted:'#abc3c1',accent:'#dec18a',accentInk:'#173038',border:'#42666b',water:'#2c6b7c',vegetation:'#35564d',building:'#60736a',road:'#a4ae94',ancient:'#e2ad78',medieval:'#74bcb4',modern:'#aaa5d4',unknown:'#8c9c98'};
const finite = p => Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite);
const mix = (a,b,t) => {
  const rgb = s => s.replace('#','').match(/.{2}/g).map(v=>parseInt(v,16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';
};

export function drawCastleMap(canvas, cartography, visit, {selected=null,heightAt,palette={},large=false,readingMode='materials',showLabels=true,regionGeometry=[],insets={}}={}) {
  const ctx=canvas.getContext('2d');if(!ctx||!cartography||!visit)return null;
  const p={...fallback,...palette}, w=canvas.width,h=canvas.height, pad=large?42:18;
  const outline=(cartography.castlePolygon||[]).filter(finite),stops=(visit.stops||[]).filter(s=>finite(s.coordinate||s.coordinates));
  if(!outline.length)return null;
  const world=outline.map(c=>project(...c)),box={minX:Math.min(...world.map(p=>p.x))-65,maxX:Math.max(...world.map(p=>p.x))+65,minZ:Math.min(...world.map(p=>p.z))-75,maxZ:Math.max(...world.map(p=>p.z))+65};
  for(const stop of stops){const a=project(...(stop.coordinate||stop.coordinates));box.minX=Math.min(box.minX,a.x-35);box.maxX=Math.max(box.maxX,a.x+35);box.minZ=Math.min(box.minZ,a.z-35);box.maxZ=Math.max(box.maxZ,a.z+35);}
  const frame={left:insets.left||0,right:insets.right||0,top:insets.top||0,bottom:insets.bottom||0};
  const availableW=Math.max(80,w-frame.left-frame.right-pad*2),availableH=Math.max(80,h-frame.top-frame.bottom-pad*2);
  const scale=Math.min(availableW/(box.maxX-box.minX),availableH/(box.maxZ-box.minZ));
  const ox=frame.left+pad+(availableW-(box.maxX-box.minX)*scale)/2,oy=frame.top+pad+(availableH-(box.maxZ-box.minZ)*scale)/2;
  const map=a=>({x:ox+(a.x-box.minX)*scale,y:oy+(a.z-box.minZ)*scale});
  const bounds={x:ox,y:oy,width:(box.maxX-box.minX)*scale,height:(box.maxZ-box.minZ)*scale};
  ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.beginPath();ctx.rect(ox,oy,bounds.width,bounds.height);ctx.clip();
  let shadeCells=0;
  if(heightAt){
    const px=large?5:7,step=px/scale;
    for(let z=box.minZ;z<box.maxZ;z+=step)for(let x=box.minX;x<box.maxX;x+=step){
      const y=heightAt(x,z),right=heightAt(x+step,z),top=heightAt(x,z-step),a=map({x,z});
      const slope=Number.isFinite(right+top+y)?Math.max(-.15,Math.min(.15,(top-right)/(step*9))):0;
      const t=Math.max(0,Math.min(1,(Number.isFinite(y)?y:70)/200));
      ctx.fillStyle=mix(p.terrainLow||p.background,p.terrainHigh||p.vegetation,Math.max(0,Math.min(1,t+slope)));ctx.fillRect(a.x,a.y,px+1,px+1);shadeCells++;
    }
  }
  function path(coords,close=false){if(!coords?.length)return false;ctx.beginPath();coords.forEach((c,i)=>{const a=map(Array.isArray(c)?project(...c):c);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y);});if(close)ctx.closePath();return true;}
  const inView=coords=>coords?.some(c=>{const a=project(...c);return a.x>=box.minX&&a.x<=box.maxX&&a.z>=box.minZ&&a.z<=box.maxZ;});
  for(const building of cartography.buildings||[])if(inView(building.coordinates)&&path(building.coordinates,true)){ctx.fillStyle=p.building;ctx.globalAlpha=.55;ctx.fill();}
  ctx.globalAlpha=1;
  for(const road of cartography.roads||[])if(inView(road.coordinates)&&path(road.coordinates)){ctx.strokeStyle=p.road;ctx.globalAlpha=.55;ctx.lineWidth=large?1.3:.65;ctx.stroke();}
  ctx.globalAlpha=1;path(outline,true);ctx.fillStyle=mix(p.accent,p.background,.72);ctx.globalAlpha=.33;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=p.accent;ctx.lineWidth=large?3:1.5;ctx.stroke();
  if(readingMode==='periods')for(const region of regionGeometry){
    const coords=region.polygon||region.coordinates;if(!Array.isArray(coords)||coords.length<3||!coords.every(finite)||!path(coords,true))continue;
    ctx.globalAlpha=.15;ctx.fillStyle=p[region.period]||p.unknown;ctx.fill();ctx.globalAlpha=1;
  }
  for(const wall of cartography.castleWalls||[])if(path(wall.coordinates||wall.geometry?.coordinates)){ctx.strokeStyle=p.accent;ctx.globalAlpha=.75;ctx.lineWidth=large?1.7:.8;ctx.stroke();}
  ctx.globalAlpha=1;ctx.restore();
  const targets=[],placed=[];
  const size=large?13:7,separation=large?32:17;
  // Selected stop is placed first, so its actual position is never displaced.
  const ordered=[...stops].sort((a,b)=>(b.id===selected)-(a.id===selected));
  for(const stop of ordered){
    const real=map(project(...(stop.coordinate||stop.coordinates))),index=stops.indexOf(stop)+1;
    let draw={...real};
    for(let n=0;n<80&&placed.some(q=>Math.hypot(q.x-draw.x,q.y-draw.y)<separation);n++){
      const radius=(large?15:9)+n*(large?1.5:.85);
      draw={x:Math.max(frame.left+pad+size,Math.min(w-frame.right-pad-size,real.x+Math.cos(n*2.399963)*radius)),y:Math.max(frame.top+pad+size,Math.min(h-frame.bottom-pad-size,real.y+Math.sin(n*2.399963)*radius))};
    }
    const active=stop.id===selected,periodKey=({iberian:'ancient',roman:'ancient',andalusi:'medieval',medieval:'medieval',modern:'modern'}[stop.period]||'unknown'),ink=readingMode==='periods'?p[periodKey]:p.muted;placed.push(draw);
    if(Math.hypot(draw.x-real.x,draw.y-real.y)>3){ctx.beginPath();ctx.moveTo(real.x,real.y);ctx.lineTo(draw.x,draw.y);ctx.strokeStyle=p.muted;ctx.lineWidth=large?1:.6;ctx.stroke();}
    if(active){ctx.beginPath();ctx.arc(draw.x,draw.y,size+(large?6:4),0,Math.PI*2);ctx.strokeStyle=p.accent;ctx.lineWidth=large?2:1;ctx.stroke();}
    ctx.beginPath();ctx.arc(draw.x,draw.y,size,0,Math.PI*2);ctx.fillStyle=active?p.accent:p.surface;ctx.fill();ctx.strokeStyle=active?p.accent:ink;ctx.lineWidth=large?2:1.4;ctx.stroke();
    ctx.fillStyle=active?p.accentInk:readingMode==='periods'?ink:p.text;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 '+(large?13:9)+'px Manrope,sans-serif';ctx.fillText(String(index),draw.x,draw.y+.4);
    targets.push({id:stop.id,x:draw.x,y:draw.y,r:large?20:13,real,index});
  }
  const right=w-frame.right-pad,top=frame.top+pad,bottom=h-frame.bottom-pad;
  ctx.fillStyle=p.text;ctx.font=(large?14:10)+'px Manrope,sans-serif';ctx.textAlign='right';ctx.textBaseline='top';ctx.fillText('N',right,top);
  ctx.beginPath();ctx.moveTo(right-5,top+36);ctx.lineTo(right-5,top+20);ctx.strokeStyle=p.text;ctx.lineWidth=1.4;ctx.stroke();
  const metres=100,bar=metres*scale;ctx.beginPath();ctx.moveTo(right-bar,bottom-5);ctx.lineTo(right,bottom-5);ctx.strokeStyle=p.text;ctx.stroke();ctx.font=(large?12:9)+'px Manrope,sans-serif';ctx.fillText('100 m',right,bottom-23);
  if(large&&showLabels){
    ctx.textAlign='left';ctx.font='600 14px Manrope,sans-serif';ctx.fillStyle=p.text;ctx.fillText('CASTILLO DE SAGUNTO',frame.left+pad,top);
    ctx.font='12px Manrope,sans-serif';ctx.fillStyle=p.muted;ctx.fillText('Planta cartografiada · posiciones de la visita',frame.left+pad,top+24);
  }
  return {targets,bounds:box,shadeCells,hitTarget(x,y){let result=null,closest=Infinity;for(const t of targets){const d=Math.hypot(t.x-x,t.y-y);if(d<t.r&&d<closest){result=t.id;closest=d;}}return result;}};
}
