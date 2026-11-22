// Georeferenced theatre plan. The outline is the contemporary OSM footprint;
// component polygons are supplied by the documented model, never invented here.
// Displaced labels retain a leader and the unmodified geographic anchor.
const project = (lon, lat) => ({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const finite = point => Array.isArray(point) && point.length >= 2 && point.slice(0,2).every(Number.isFinite);
const fallback = {background:'#102c34',surface:'#142e35',text:'#f4f1e9',muted:'#b8c8c5',accent:'#e1c18b',accentInk:'#153038',border:'#48636a',terrainLow:'#18383d',terrainHigh:'#4e6957',vegetation:'#446751',building:'#718076',road:'#b4b79d',ancient:'#e2ad78',modern:'#aaa5d4',unknown:'#8c9c98'};
const periodKey = value => ({roman:'ancient',ancient:'ancient',contemporary:'modern',modern:'modern',mixed:'unknown',interpretation:'interpretation',unknown:'unknown'}[value] || 'unknown');
const contrastInk = color => {
  const luminance = hex => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return .5;
    const rgb=hex.slice(1).match(/.{2}/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  };
  const level=luminance(color),dark=luminance('#15333b');
  return (Math.max(level,dark)+.05)/(Math.min(level,dark)+.05) >= 1.05/(level+.05) ? '#15333b' : '#ffffff';
};
const mix = (a,b,t) => {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const rgb = s => s.slice(1).match(/.{2}/g).map(v=>parseInt(v,16));
  const x=rgb(a),y=rgb(b); return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';
};

export function drawTheatreMap(canvas, cartography, visit, {selected=null,heightAt,palette={},large=false,readingMode='materials',showLabels=true,modelGeometry=null,insets={}}={}) {
  const ctx=canvas?.getContext('2d'); if(!ctx || !cartography || !visit) return null;
  const p={...fallback,...palette}, w=canvas.width,h=canvas.height;
  const periodColors={ancient:p.ancient,modern:p.modern,unknown:p.unknown,interpretation:p.unknown};
  for(const item of visit.readingLegend||[])if(/^#[0-9a-f]{6}$/i.test(item.color||''))periodColors[periodKey(item.id)]=item.color;
  const periodColor=value=>periodColors[periodKey(value)];
  const plan=modelGeometry || visit.plan || {};
  const outline=(cartography.theatrePolygon || plan.outline || []).filter(finite);
  const components=(Array.isArray(plan)?plan:plan.components||[]).filter(c=>Array.isArray(c.coordinates)&&c.coordinates.length>=2&&c.coordinates.every(finite));
  const stops=(visit.stops||[]).filter(stop=>finite(stop.coordinate||stop.coordinates));
  if(outline.length<3) return null;
  const world=outline.map(c=>project(...c));
  const box={minX:Math.min(...world.map(a=>a.x))-16,maxX:Math.max(...world.map(a=>a.x))+16,minZ:Math.min(...world.map(a=>a.z))-16,maxZ:Math.max(...world.map(a=>a.z))+16};
  for(const stop of stops) {
    const a=project(...(stop.coordinate||stop.coordinates));
    box.minX=Math.min(box.minX,a.x-12);box.maxX=Math.max(box.maxX,a.x+12);box.minZ=Math.min(box.minZ,a.z-12);box.maxZ=Math.max(box.maxZ,a.z+12);
  }
  const frame={left:0,right:0,top:0,bottom:0,...insets},pad=large?24:14;
  const usableW=Math.max(80,w-frame.left-frame.right),usableH=Math.max(80,h-frame.top-frame.bottom);
  const header=large&&showLabels?(usableW>450?40:22):0;
  const availableW=Math.max(40,usableW-pad*2),availableH=Math.max(40,usableH-pad*2-header);
  const scale=Math.min(availableW/(box.maxX-box.minX),availableH/(box.maxZ-box.minZ));
  const ox=frame.left+pad+(availableW-(box.maxX-box.minX)*scale)/2,oy=frame.top+pad+header+(availableH-(box.maxZ-box.minZ)*scale)/2;
  const map=a=>({x:ox+(a.x-box.minX)*scale,y:oy+(a.z-box.minZ)*scale});
  const screenBox={x:ox,y:oy,width:(box.maxX-box.minX)*scale,height:(box.maxZ-box.minZ)*scale};
  const path=(coordinates,close=false)=>{
    if(!coordinates?.length||!coordinates.every(finite))return false;
    ctx.beginPath();coordinates.forEach((c,i)=>{const a=map(project(...c));i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y);});
    if(close)ctx.closePath();return true;
  };
  const inView=coordinates=>coordinates?.some(c=>{if(!finite(c))return false;const a=project(...c);return a.x>=box.minX&&a.x<=box.maxX&&a.z>=box.minZ&&a.z<=box.maxZ;});
  ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.beginPath();ctx.rect(screenBox.x,screenBox.y,screenBox.width,screenBox.height);ctx.clip();
  let shadeCells=0;
  if(heightAt) {
    const px=large?5:7,step=px/scale;
    for(let z=box.minZ;z<box.maxZ;z+=step)for(let x=box.minX;x<box.maxX;x+=step){
      const y=heightAt(x,z),east=heightAt(x+step,z),north=heightAt(x,z-step),a=map({x,z});
      const slope=Number.isFinite(east+north+y)?Math.max(-.13,Math.min(.13,(north-east)/(step*9))):0;
      const level=Math.max(0,Math.min(1,(Number.isFinite(y)?y:80)/200+slope));
      ctx.fillStyle=mix(p.terrainLow,p.terrainHigh,level);ctx.fillRect(a.x,a.y,px+1,px+1);shadeCells++;
    }
  }
  for(const building of cartography.buildings||[])if(inView(building.coordinates)&&path(building.coordinates,true)){ctx.globalAlpha=.38;ctx.fillStyle=p.building;ctx.fill();}
  for(const road of cartography.roads||[])if(inView(road.coordinates)&&path(road.coordinates)){ctx.globalAlpha=.55;ctx.strokeStyle=p.road;ctx.lineWidth=large?1.3:.7;ctx.stroke();}
  ctx.globalAlpha=1;
  path(outline,true);ctx.fillStyle=mix(p.accent,p.background,.78);ctx.fill();
  for(const component of components){
    if(!path(component.coordinates,component.closed!==false&&component.coordinates.length>=3))continue;
    const color=readingMode==='periods'?periodColor(component.period):component.kind==='orchestra'?p.road:component.kind==='stage'?p.accent:p.building;
    const closed=component.closed!==false&&component.coordinates.length>=3;
    if(closed){ctx.globalAlpha=readingMode==='periods'?.4:.32;ctx.fillStyle=color;ctx.fill();}
    ctx.globalAlpha=readingMode==='periods'?.92:.75;ctx.strokeStyle=color;ctx.lineWidth=large?1.6:.8;
    ctx.setLineDash(component.interpretive?[large?5:3,large?4:2]:[]);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.globalAlpha=1;path(outline,true);ctx.strokeStyle=p.accent;ctx.lineWidth=large?2.4:1.3;ctx.stroke();ctx.restore();

  const size=large?13:7,separation=large?32:17,targets=[],placed=[];
  const limits={left:frame.left+pad+size,right:w-frame.right-pad-size,top:frame.top+pad+header+size,bottom:h-frame.bottom-pad-size};
  const clamp=a=>({x:Math.max(limits.left,Math.min(limits.right,a.x)),y:Math.max(limits.top,Math.min(limits.bottom,a.y))});
  const free=a=>placed.every(b=>Math.hypot(a.x-b.x,a.y-b.y)>=separation);
  const ordered=[...stops].sort((a,b)=>(b.id===selected)-(a.id===selected));
  for(const stop of ordered){
    const real=map(project(...(stop.coordinate||stop.coordinates))),index=stops.indexOf(stop)+1;
    let draw={...real};
    if(!free(draw)) {
      let found=false;
      for(let n=0;n<700;n++){
        const radius=separation*.6+Math.sqrt(n)*separation*.48;
        const candidate=clamp({x:real.x+Math.cos(n*2.399963)*radius,y:real.y+Math.sin(n*2.399963)*radius});
        if(free(candidate)){draw=candidate;found=true;break;}
      }
      if(!found){
        // Deterministic nearest free grid fallback for tightly clustered stops.
        let best=null,distance=Infinity;
        for(let y=limits.top;y<=limits.bottom;y+=separation)for(let x=limits.left;x<=limits.right;x+=separation){
          const candidate={x,y},d=Math.hypot(x-real.x,y-real.y);
          if(d<distance&&free(candidate)){best=candidate;distance=d;}
        }
        if(best)draw=best;
      }
    }
    placed.push(draw);
    targets.push({id:stop.id,x:draw.x,y:draw.y,r:large?20:13,real,index,period:stop.period});
  }
  // Paint the selected marker last, preserving the actual point and its halo.
  for(const target of [...targets].sort((a,b)=>(a.id===selected)-(b.id===selected))){
    const active=target.id===selected,layerMode=readingMode==='periods',ink=periodColor(target.period);
    if(Math.hypot(target.x-target.real.x,target.y-target.real.y)>3){
      ctx.beginPath();ctx.moveTo(target.real.x,target.real.y);ctx.lineTo(target.x,target.y);ctx.strokeStyle=p.muted;ctx.lineWidth=large?1:.6;ctx.stroke();
      ctx.beginPath();ctx.arc(target.real.x,target.real.y,large?2:1.2,0,Math.PI*2);ctx.fillStyle=p.muted;ctx.fill();
    }
    if(active){ctx.beginPath();ctx.arc(target.x,target.y,size+(large?6:4),0,Math.PI*2);ctx.strokeStyle=p.accent;ctx.lineWidth=large?2:1;ctx.stroke();}
    ctx.beginPath();ctx.arc(target.x,target.y,size,0,Math.PI*2);ctx.fillStyle=active?p.accent:layerMode?ink:p.surface;ctx.fill();ctx.strokeStyle=active?p.accent:layerMode?p.border:p.muted;ctx.lineWidth=large?2:1.4;ctx.stroke();
    ctx.fillStyle=active?p.accentInk:layerMode?contrastInk(ink):p.text;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 '+(large?13:9)+'px Manrope,sans-serif';ctx.fillText(String(target.index),target.x,target.y+.4);
  }
  const right=w-frame.right-pad,top=frame.top+pad,bottom=h-frame.bottom-pad;
  ctx.fillStyle=p.text;ctx.font=(large?14:10)+'px Manrope,sans-serif';ctx.textAlign='right';ctx.textBaseline='top';ctx.fillText('N',right,top);
  ctx.beginPath();ctx.moveTo(right-5,top+36);ctx.lineTo(right-5,top+20);ctx.strokeStyle=p.text;ctx.lineWidth=1.4;ctx.stroke();
  const metres=scale*20>usableW*.35?10:20,bar=metres*scale;
  ctx.beginPath();ctx.moveTo(right-bar,bottom-5);ctx.lineTo(right,bottom-5);ctx.stroke();ctx.font=(large?12:9)+'px Manrope,sans-serif';ctx.fillText(metres+' m',right,bottom-23);
  if(large&&showLabels){
    ctx.textAlign='left';ctx.font='600 14px Manrope,sans-serif';ctx.fillStyle=p.text;ctx.fillText('TEATRO ROMANO',frame.left+pad,top);
    if(usableW>450){ctx.font='12px Manrope,sans-serif';ctx.fillStyle=p.muted;ctx.fillText(components.length?'Huella cartográfica · lectura del modelo':'Huella cartográfica · posiciones de la visita',frame.left+pad,top+23);}
  }
  return {targets,bounds:box,shadeCells,components:components.length,scaleMetres:metres,hitTarget(x,y){
    let result=null,closest=Infinity;
    for(const target of targets){const d=Math.hypot(target.x-x,target.y-y);if(d<target.r&&d<closest){result=target.id;closest=d;}}
    return result;
  }};
}
