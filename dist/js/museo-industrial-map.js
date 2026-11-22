// Source-registered industrial museum plan. Selecting an interior stop reveals
// its level; the overview keeps all stops. Geometry remains interpretive.
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const finite=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
const defaults={background:'#102c34',surface:'#17363c',text:'#f4f1e9',muted:'#b8c8c5',accent:'#e1c18b',accentInk:'#153038',border:'#48636a',terrainLow:'#213e40',terrainHigh:'#4e6957',building:'#718076',road:'#b4b79d'};
const validColor=s=>/^#[0-9a-f]{6}$/i.test(s||'');
const rgb=s=>s.slice(1).match(/.{2}/g).map(v=>parseInt(v,16));
const mix=(a,b,t)=>{if(!validColor(a)||!validColor(b))return a;const x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';};
const ink=c=>validColor(c)&&rgb(c).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)>150?'#15333b':'#ffffff';

export function drawMuseoIndustrialMap(canvas,cartography,visit,{selected=null,palette={},large=false,readingMode='materials',sectionOpen=false,showLabels=true,modelGeometry=null,insets={},heightAt}={}){
 const ctx=canvas?.getContext('2d');if(!ctx||!cartography||!visit)return null;
 const p={...defaults,...palette},plan=modelGeometry||visit.plan||{},outline=(plan.outline||plan.footprint||[]).filter(finite);
 if(outline.length<3)return null;
 const registered=new Map((plan.stops||[]).map(s=>[s.id,s]));
 const allStops=(visit.stops||[]).map((s,index)=>({...s,...registered.get(s.id),index:index+1,coordinate:registered.get(s.id)?.coordinates||s.coordinate||s.coordinates})).filter(s=>finite(s.coordinate));
 const selectedStop=allStops.find(s=>s.id===selected),floor=Number.isInteger(selectedStop?.floor)&&selectedStop?.floor>=0?selectedStop.floor:null;
 const floorLabel=floor===2?'Segunda planta':floor===1?'Primera planta':floor===0?'Planta baja':'Nave y tres plantas';
 const stops=allStops.filter(s=>floor===null||s.floor===floor||s.id===selected);
 const naves=[],components=(plan.components||[]).filter(c=>c.coordinates?.length&&c.coordinates.every(finite)).filter(c=>floor===null||(!c.floors&&c.floor==null)||(c.floors||[c.floor]).includes(floor));
 const layers=Object.fromEntries((visit.readingLegend||[]).map(s=>[s.id,s.color]));
 const color=id=>readingMode==='periods'?(layers[id]||p.accent):p.accent;
 const w=canvas.width,h=canvas.height,frame={left:0,right:0,top:0,bottom:0,...insets},pad=large?20:10;
 const area={x:frame.left+pad,y:frame.top+pad,w:Math.max(80,w-frame.left-frame.right-pad*2),h:Math.max(80,h-frame.top-frame.bottom-pad*2)};
 const header=large&&showLabels?34:0,sectionShown=large&&showLabels&&area.w>=620&&area.h>=350&&!!plan.crossSection;
 const sectionHeight=sectionShown?Math.min(122,area.h*.24):0,footer=showLabels?24:9;
 const plant={x:area.x,y:area.y+header,w:area.w,h:area.h-header-footer-sectionHeight};
 const points=outline.map(c=>project(...c));
 const box={minX:Math.min(...points.map(q=>q.x))-12,maxX:Math.max(...points.map(q=>q.x))+12,minZ:Math.min(...points.map(q=>q.z))-12,maxZ:Math.max(...points.map(q=>q.z))+12};
 for(const stop of stops){const q=project(...stop.coordinate);box.minX=Math.min(box.minX,q.x-12);box.maxX=Math.max(box.maxX,q.x+12);box.minZ=Math.min(box.minZ,q.z-12);box.maxZ=Math.max(box.maxZ,q.z+12);}
 const scale=Math.min(plant.w/(box.maxX-box.minX),plant.h/(box.maxZ-box.minZ));
 const offsetX=plant.x+(plant.w-(box.maxX-box.minX)*scale)/2,offsetY=plant.y+(plant.h-(box.maxZ-box.minZ)*scale)/2;
 const at=q=>({x:offsetX+(q.x-box.minX)*scale,y:offsetY+(q.z-box.minZ)*scale}),map=c=>at(project(...c));
 const path=(coordinates,closed=false)=>{if(!coordinates?.length||!coordinates.every(finite))return false;ctx.beginPath();coordinates.forEach((c,i)=>{const q=map(c);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});if(closed)ctx.closePath();return true;};
 const nearby=coordinates=>coordinates?.some(c=>{if(!finite(c))return false;const q=project(...c);return q.x>=box.minX&&q.x<=box.maxX&&q.z>=box.minZ&&q.z<=box.maxZ;});
 const line=(points,stroke=p.muted,width=1)=>{if(!points.length)return;ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();};
 ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.beginPath();ctx.rect(plant.x,plant.y,plant.w,plant.h);ctx.clip();ctx.fillStyle=mix(p.terrainLow,p.background,.25);ctx.fillRect(plant.x,plant.y,plant.w,plant.h);
 let shadeCells=0;
 if(typeof heightAt==='function')for(let y=plant.y;y<plant.y+plant.h;y+=9)for(let x=plant.x;x<plant.x+plant.w;x+=9){const gx=box.minX+(x-offsetX)/scale,gz=box.minZ+(y-offsetY)/scale,z=heightAt(gx,gz);if(!Number.isFinite(z))continue;ctx.fillStyle=mix(p.terrainLow,p.terrainHigh,Math.max(0,Math.min(.18,z/160)));ctx.fillRect(x,y,10,10);shadeCells++;}
 for(const b of cartography.buildings||[])if(nearby(b.coordinates)&&path(b.coordinates,true)){ctx.fillStyle=mix(p.building,p.background,.7);ctx.fill();ctx.strokeStyle=mix(p.building,p.background,.3);ctx.lineWidth=.7;ctx.stroke();}
 for(const r of cartography.roads||[])if(nearby(r.coordinates)&&path(r.coordinates,r.area==='yes')){ctx.globalAlpha=.45;ctx.strokeStyle=p.road;ctx.lineWidth=Math.max(.8,(Number(r.width)||4)*scale*.4);ctx.stroke();ctx.globalAlpha=1;}
 path(outline,true);ctx.fillStyle=mix(p.accent,p.background,.88);ctx.fill();
 for(const nave of naves)if(nave.coordinates?.every(finite)&&path(nave.coordinates,true)){ctx.fillStyle=mix(color('estructura'),p.background,sectionOpen?.8:.66);ctx.fill();ctx.strokeStyle=color('estructura');ctx.lineWidth=large?1.4:.8;ctx.stroke();}
 // Draw only physical map features. Nearby building detail has neutral colours.
 const order={forecourt:0,plaza:0,'public-square':0,paving:0,street:0,'context-building':1,annex:1,floor:2,hall:2,platform:2,gallery:3,roof:4,wall:5,structure:6,shelving:6,rail:7,path:7,stairs:8,display:9};
 for(const c of [...components].sort((a,b)=>(order[a.kind]??5)-(order[b.kind]??5))){
  if(c.kind==='roof'&&(sectionOpen||floor!==null)||c.hiddenWhenSection&&sectionOpen||c.requiresSection&&!sectionOpen)continue;
  if(floor!==null&&c.kind==='floor'&&c.floor==null&&c.floors==null)continue;
  if(!nearby(c.coordinates))continue;
  if(c.coordinates.length===1){const q=map(c.coordinates[0]);ctx.fillStyle=color(c.readingLayer||'estructura');ctx.fillRect(q.x-1.5,q.y-1.5,3,3);continue;}
  const linear=['wall','rail','path','ridge','truss','structure','street'].includes(c.kind),closed=c.closed===true||!linear&&c.closed!==false&&c.coordinates.length>=3;
  if(!path(c.coordinates,closed))continue;
  const context=c.kind==='context-building',surface=['forecourt','plaza','public-square','street','paving'].includes(c.kind);
  const stroke=context?p.building:surface?p.road:color(c.readingLayer||c.period||'estructura');
  if(closed){ctx.fillStyle=mix(stroke,p.background,context?.8:c.kind==='roof'?.71:.84);for(const hole of c.holes||[]){if(!hole.every(finite))continue;hole.forEach((coordinate,i)=>{const q=map(coordinate);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();}ctx.fill('evenodd');path(c.coordinates,true);}
  ctx.strokeStyle=stroke;ctx.lineWidth=context?.7:c.kind==='rail'?(large?1.2:.6):large?1.15:.65;ctx.globalAlpha=context?.6:c.kind==='roof'?.55:.85;ctx.setLineDash(c.interpretive?[large?5:3,large?3:2]:[]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 }
 const origin=plan.frame||{},co=Math.cos(origin.yaw||0),si=Math.sin(origin.yaw||0);
 const local=(x,z)=>at({x:origin.x+x*co+z*si,z:origin.z-x*si+z*co});
 if(Number.isFinite(origin.x+origin.z)){
  if(sectionOpen){
   ctx.globalAlpha=.45;for(const t of plan.trusses||[]){const n=naves.find(n=>n.id===t.nave);if(n)line([local(n.x0,t.z),local(n.x1,t.z)],color('estructura'),large?.7:.4);}ctx.globalAlpha=1;
   for(const c of plan.columns||[]){const q=finite(c.coordinates)?map(c.coordinates):local(c.x,c.z),size=Math.max(1.2,Math.min(3.5,.45*scale));ctx.fillStyle=color('estructura');ctx.fillRect(q.x-size,q.y-size,size*2,size*2);}
  }else{for(const n of naves){ctx.globalAlpha=.65;line([local(n.centerX,n.z0),local(n.centerX,n.z1)],color('envolvente'),large?1.2:.7);ctx.globalAlpha=1;}}
 }
 path(outline,true);ctx.strokeStyle=p.accent;ctx.lineWidth=large?2:1.1;ctx.stroke();ctx.restore();

 const size=large?12:6.5,separation=large?29:16,targets=[],placed=[];
 const limits={left:plant.x+size,right:plant.x+plant.w-size,top:plant.y+size,bottom:plant.y+plant.h-size};
 const clamp=q=>({x:Math.max(limits.left,Math.min(limits.right,q.x)),y:Math.max(limits.top,Math.min(limits.bottom,q.y))});
 const free=q=>placed.every(b=>Math.hypot(q.x-b.x,q.y-b.y)>=separation);
 for(const stop of [...stops].sort((a,b)=>(b.id===selected)-(a.id===selected))){
  const real=map(stop.coordinate);let draw=clamp(real);
  if(!free(draw)){let best=null,distance=Infinity;for(let n=0;n<900;n++){const r=separation*.55+Math.sqrt(n)*separation*.42,q=clamp({x:real.x+Math.cos(n*2.399963)*r,y:real.y+Math.sin(n*2.399963)*r});if(free(q)){const d=Math.hypot(q.x-real.x,q.y-real.y);if(d<distance){best=q;distance=d;}if(n>110&&best)break;}}if(best)draw=best;}
  placed.push(draw);targets.push({id:stop.id,index:stop.index,...draw,real,r:large?19:12,readingLayer:stop.readingLayer,coordinate:stop.coordinate,elevation:stop.elevation??0});
 }
 for(const t of targets){if(Math.hypot(t.x-t.real.x,t.y-t.real.y)>3){ctx.globalAlpha=.6;line([t.real,t],p.muted,.7);ctx.globalAlpha=1;}}
 for(const t of [...targets].sort((a,b)=>(a.id===selected)-(b.id===selected))){const active=t.id===selected,fill=readingMode==='periods'?(layers[t.readingLayer]||p.accent):active?p.accent:p.surface;
  if(active){ctx.beginPath();ctx.arc(t.x,t.y,size+(large?5:3),0,Math.PI*2);ctx.strokeStyle=p.accent;ctx.lineWidth=1.7;ctx.stroke();}
  ctx.beginPath();ctx.arc(t.x,t.y,size,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=active?p.accent:p.muted;ctx.lineWidth=large?1.5:1;ctx.stroke();ctx.fillStyle=readingMode==='periods'?ink(fill):active?p.accentInk:p.text;ctx.font='600 '+(large?12:8.5)+'px Manrope,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(t.index),t.x,t.y+.4);
 }
 if(sectionShown){
  const section=plan.crossSection,W=section.width||20.22,H=section.height||section.ridge||13.2,eave=section.eave||10.7;
  const base=area.y+area.h-footer-7,ss=Math.min((area.w-80)/W,(sectionHeight-29)/H),left=area.x+(area.w-W*ss)/2;
  const q=(x,y)=>({x:left+(x+W/2)*ss,y:base-y*ss});
  line([q(-W/2,0),q(W/2,0)],p.muted,1);
  line([q(-W/2,0),q(-W/2,eave),q(0,H),q(W/2,eave),q(W/2,0)],color('estructura'),1.4);
  const galleries=section.galleries||[],south=galleries.find(g=>g.x0<0),north=galleries.find(g=>g.x1>0&&g.x0>=0),side=W/6;
  const innerSouth=south?.x1??-side,innerNorth=north?.x0??side;
  for(const x of[innerSouth,innerNorth])line([q(x,section.floorY??1),q(x,eave)],color('estructura'),1);
  for(const gallery of section.galleries||[]){const xa=gallery.x0,xb=gallery.x1;if(!Number.isFinite(xa+xb))continue;for(const y of gallery.levels||[]){line([q(xa,y),q(xb,y)],color('oficios'),1.3);}}
  line([q(-W/2,section.floorY??1),q(innerSouth,section.floorY??1)],p.muted,1.8);line([q(innerNorth,section.floorY??1),q(W/2,section.floorY??1)],p.muted,1.8);
  ctx.textAlign='left';ctx.textBaseline='top';ctx.font='10px Manrope,sans-serif';ctx.fillStyle=p.muted;ctx.fillText('SECCIÓN · vía, andenes y galerías · proporciones interpretadas',area.x,plant.y+plant.h+8);
 }
 const scaleMetres=20,bar=scaleMetres*scale,right=area.x+area.w;
 line([{x:right-bar,y:area.y+area.h-3},{x:right,y:area.y+area.h-3}],p.muted,1.5);ctx.fillStyle=p.muted;ctx.font=(large?11:9)+'px Manrope,sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText('20 m',right,area.y+area.h-8);
 ctx.textAlign='right';ctx.textBaseline='top';ctx.fillStyle=p.text;ctx.fillText('N ↑',right,area.y);
 if(large&&showLabels){ctx.textAlign='left';ctx.font='600 '+(area.w>500?13:11)+'px Manrope,sans-serif';ctx.fillText(area.w>500?'MUSEO INDUSTRIAL · NAVE DE EFECTOS Y REPUESTOS':'MUSEO INDUSTRIAL',area.x,area.y);ctx.font='11px Manrope,sans-serif';ctx.fillStyle=p.muted;ctx.fillText(floorLabel+(sectionOpen?' · sección abierta':' · arquitectura y museo'),area.x,area.y+area.h-14);}
 return {targets,totalStops:allStops.length,visibleStops:stops.length,naves:naves.length,components:components.length,sectionShown,sectionOpen,floor,floorLabel,bounds:box,shadeCells,scaleMetres,outlineSource:'museo-industrial-plan',hitTarget(x,y){let id=null,distance=Infinity;for(const t of targets){const d=Math.hypot(t.x-x,t.y-y);if(d<t.r&&d<distance){id=t.id;distance=d;}}return id;}};
}
