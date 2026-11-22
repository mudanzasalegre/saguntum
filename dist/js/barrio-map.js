// A north-up neighbourhood plan, with separate documented housing types and floors.
// Components come from the same geometry as the 3D scene; inferred details retain their labels.
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const finite=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
const defaults={background:'#102c34',surface:'#17363c',text:'#f4f1e9',muted:'#b8c8c5',accent:'#e1c18b',accentInk:'#153038',border:'#48636a',terrainLow:'#213e40',terrainHigh:'#4e6957',building:'#718076',road:'#b4b79d'};
const validColor=s=>/^#[0-9a-f]{6}$/i.test(s||'');
const rgb=s=>s.slice(1).match(/.{2}/g).map(v=>parseInt(v,16));
const mix=(a,b,t)=>{if(!validColor(a)||!validColor(b))return a;const x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';};
const ink=c=>validColor(c)&&rgb(c).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)>150?'#15333b':'#ffffff';

export function drawBarrioMap(canvas,cartography,visit,{selected=null,palette={},large=false,readingMode='materials',sectionOpen=false,showLabels=true,modelGeometry=null,insets={},heightAt}={}){
 const ctx=canvas?.getContext('2d');if(!ctx||!cartography||!visit)return null;
 const p={...defaults,...palette},plan=modelGeometry||visit.plan||{},outline=(plan.outline||plan.footprint||[]).filter(finite);
 if(outline.length<3)return null;
 const registered=new Map((plan.stops||[]).map(s=>[s.id,s]));
 const allStops=(visit.stops||[]).map((s,index)=>({...s,...registered.get(s.id),index:index+1,coordinate:registered.get(s.id)?.coordinates||s.coordinate||s.coordinates})).filter(s=>finite(s.coordinate));
 const selectedStop=allStops.find(s=>s.id===selected),floor=Number.isInteger(selectedStop?.floor)&&selectedStop.floor>=0?selectedStop.floor:null;
 const buildingId=floor!==null?selectedStop?.buildingId:null,interior=floor!==null&&!!buildingId;
 const level=(plan.floors||[]).find(f=>f.id===floor&&(!f.buildingId||f.buildingId===buildingId));
 const building=(plan.buildings||[]).find(b=>b.id===buildingId);
 const floorName=(level?.label||(floor===0?'Planta baja':'Planta primera')).replace(/^Tipo [IVX]+\s*·\s*/i,'');
 const floorLabel=interior?(building?.label||building?.name||'Vivienda de referencia')+' · '+floorName.toLowerCase()+' · tipo histórico':'Siete manzanas y entorno';
 const stops=interior?allStops.filter(s=>s.buildingId===buildingId&&s.floor===floor):allStops;
 const allComponents=[...(plan.components||[]),...(plan.partitions||[]).map((c,index)=>({...c,id:'partition-'+index,kind:'wall',requiresSection:true}))].map(c=>({...c,kind:c.kind||c.type||'building'})).filter(c=>c.coordinates?.length&&c.coordinates.every(finite));
 const groundKinds=new Set(['garden','lawn','tree','planting','shrub','courtyard','paving','path','fence','hedge']);
 const components=allComponents.filter(c=>!interior||c.buildingId===buildingId&&(!c.floors&&c.floor==null||(c.floors||[c.floor]).includes(floor))&&!(floor>0&&(groundKinds.has(c.kind)||c.levels&&c.levels<=floor)));
 const buildingOutline=building?.coordinates||building?.footprint;
 const frameCoordinates=interior?(buildingOutline?.filter(finite)||components.flatMap(c=>c.coordinates)):outline;
 const sourcePoints=(frameCoordinates.length?frameCoordinates:[selectedStop.coordinate]).map(c=>project(...c));
 const margin=interior?1.8:12,box={minX:Math.min(...sourcePoints.map(q=>q.x))-margin,maxX:Math.max(...sourcePoints.map(q=>q.x))+margin,minZ:Math.min(...sourcePoints.map(q=>q.z))-margin,maxZ:Math.max(...sourcePoints.map(q=>q.z))+margin};
 for(const stop of stops){const q=project(...stop.coordinate);box.minX=Math.min(box.minX,q.x-margin);box.maxX=Math.max(box.maxX,q.x+margin);box.minZ=Math.min(box.minZ,q.z-margin);box.maxZ=Math.max(box.maxZ,q.z+margin);}
 const w=canvas.width,h=canvas.height,frame={left:0,right:0,top:0,bottom:0,...insets},pad=large?20:9;
 const area={x:frame.left+pad,y:frame.top+pad,w:Math.max(80,w-frame.left-frame.right-pad*2),h:Math.max(70,h-frame.top-frame.bottom-pad*2)};
 const header=large&&showLabels?32:0,footer=showLabels?25:9,plant={x:area.x,y:area.y+header,w:area.w,h:Math.max(40,area.h-header-footer)};
 const scale=Math.min(plant.w/(box.maxX-box.minX),plant.h/(box.maxZ-box.minZ));
 const offsetX=plant.x+(plant.w-(box.maxX-box.minX)*scale)/2,offsetY=plant.y+(plant.h-(box.maxZ-box.minZ)*scale)/2;
 const at=q=>({x:offsetX+(q.x-box.minX)*scale,y:offsetY+(q.z-box.minZ)*scale}),map=c=>at(project(...c));
 const path=(coordinates,closed=false)=>{if(!coordinates?.length||!coordinates.every(finite))return false;ctx.beginPath();coordinates.forEach((c,i)=>{const q=map(c);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});if(closed)ctx.closePath();return true;};
 const nearby=coordinates=>coordinates?.some(c=>{if(!finite(c))return false;const q=project(...c);return q.x>=box.minX&&q.x<=box.maxX&&q.z>=box.minZ&&q.z<=box.maxZ;});
 const line=(points,stroke=p.muted,width=1)=>{if(!points.length)return;ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();};
 const layers=Object.fromEntries((visit.readingLegend||[]).map(s=>[s.id,s.color]));
 const color=(id,fallback=p.accent)=>readingMode==='periods'?(layers[id]||fallback):fallback;
 ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.beginPath();ctx.rect(plant.x,plant.y,plant.w,plant.h);ctx.clip();ctx.fillStyle=mix(p.terrainLow,p.background,.15);ctx.fillRect(plant.x,plant.y,plant.w,plant.h);
 let shadeCells=0;
 if(typeof heightAt==='function'&&!interior)for(let y=plant.y;y<plant.y+plant.h;y+=10)for(let x=plant.x;x<plant.x+plant.w;x+=10){const gx=box.minX+(x-offsetX)/scale,gz=box.minZ+(y-offsetY)/scale,z=heightAt(gx,gz);if(!Number.isFinite(z))continue;ctx.fillStyle=mix(p.terrainLow,p.terrainHigh,Math.max(0,Math.min(.22,z/80)));ctx.fillRect(x,y,11,11);shadeCells++;}
 if(!interior){
  path(outline,true);ctx.fillStyle=mix(p.terrainHigh,p.background,.55);ctx.globalAlpha=.20;ctx.fill();ctx.globalAlpha=1;
  for(const b of cartography.buildings||[])if(nearby(b.coordinates)&&path(b.coordinates,true)){ctx.fillStyle=mix(p.building,p.background,.75);ctx.fill();ctx.strokeStyle=mix(p.building,p.background,.3);ctx.lineWidth=.6;ctx.stroke();}
  for(const r of cartography.roads||[])if(nearby(r.coordinates)&&path(r.coordinates,r.area==='yes')){ctx.globalAlpha=.5;ctx.strokeStyle=p.road;ctx.lineWidth=Math.max(.7,(Number(r.width)||4)*scale*.5);ctx.stroke();ctx.globalAlpha=1;}
 }
 const order={garden:0,lawn:0,plaza:0,paving:0,forecourt:0,street:1,path:2,'context-building':3,building:4,body:4,office:4,villa:4,house:4,dwelling:4,block:0,courtyard:2,floor:5,room:6,interior:6,porch:7,terrace:7,roof:8,wall:9,stairs:10,window:10,door:10,opening:10,ridge:11,tree:12};
 for(const component of [...components].sort((a,b)=>(order[a.kind]??6)-(order[b.kind]??6))){
  const c=interior&&component.kind==='office'&&buildingOutline?{...component,coordinates:buildingOutline}:component;
  if(c.kind==='roof'&&(sectionOpen||interior)||c.hiddenWhenSection&&sectionOpen||c.requiresSection&&!sectionOpen&&!interior)continue;
  if(!nearby(c.coordinates))continue;
  const garden=['garden','lawn','tree','planting','shrub'].includes(c.kind),surface=['plaza','paving','forecourt','street','path','courtyard'].includes(c.kind),context=c.kind==='context-building';
  const stroke=color(c.readingLayer||c.regionId||c.period,garden?p.terrainHigh:surface?p.road:context?p.building:p.accent);
  if(c.coordinates.length===1){const q=map(c.coordinates[0]),radius=Math.max(1,Math.min(large?8:3,(c.radius||c.crownRadius||2.5)*scale));ctx.beginPath();ctx.arc(q.x,q.y,radius,0,Math.PI*2);ctx.fillStyle=mix(stroke,p.background,.22);ctx.fill();continue;}
  const linear=c.geometryType==='LineString'||['wall','fence','ridge','rail','hedge'].includes(c.kind),closed=c.closed===true||!linear&&c.closed!==false&&c.coordinates.length>=3;
  if(!path(c.coordinates,closed))continue;
  if(closed){ctx.fillStyle=mix(stroke,p.background,garden?.35:context?.8:c.kind==='roof'?.55:interior?(c.kind==='interior'?.65:.9):surface?.47:.74);for(const hole of c.holes||[]){if(!hole.every(finite))continue;hole.forEach((coordinate,i)=>{const q=map(coordinate);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();}ctx.fill('evenodd');path(c.coordinates,true);}
  ctx.strokeStyle=stroke;ctx.lineWidth=c.kind==='path'&&linear?Math.max(large?1.3:.9,(c.width||2)*scale):c.kind==='wall'?Math.max(large?1.7:.85,(c.thickness||.25)*scale):surface||context?.65:large?1.1:.65;
  ctx.globalAlpha=context?.6:c.kind==='roof'?.78:surface?.65:.9;ctx.setLineDash(c.interpretive&&!surface&&!garden?[large?5:3,large?3:2]:[]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  if(interior&&c.kind==='stairs'){
   const treads=c.treadLines||c.segments;
   if(treads?.length){for(const tread of treads)if(tread?.every(finite))line(tread.map(map),p.muted,.65);}
   else if(c.coordinates.length===4){
    const q=c.coordinates.map(map),steps=Math.max(3,Math.min(30,c.steps||c.stepCount||12));
    for(let i=1;i<steps;i++){const t=i/steps;line([{x:q[0].x+(q[3].x-q[0].x)*t,y:q[0].y+(q[3].y-q[0].y)*t},{x:q[1].x+(q[2].x-q[1].x)*t,y:q[1].y+(q[2].y-q[1].y)*t}],p.muted,.65);}
   }
  }
 }
 path(interior&&buildingOutline?buildingOutline:outline,true);ctx.strokeStyle=p.accent;ctx.lineWidth=large?1.7:1;ctx.stroke();
 // Use the model's true openings so the floor plan shows connected rooms.
 // Width and wall normal are metric; no invented door swings are required.
 const visibleOpenings=[];
 if(interior)for(const [kind,items]of Object.entries(plan.openings||{}))for(const opening of items||[]){
  if(opening.buildingId!==buildingId||opening.floor!==floor||!opening.representative||!opening.realOpening||!finite(opening.coordinates)||!opening.normal||!(opening.width>0))continue;
  const q=project(...opening.coordinates),normal={x:opening.normal[0],z:opening.normal[2]},tangent={x:-normal.z,z:normal.x},half=opening.width/2;
  const ends=[-half,half].map(d=>at({x:q.x+tangent.x*d,z:q.z+tangent.z*d}));
  const thickness=opening.wallComponent?.endsWith('-interior')?.13:.3;
  line(ends,mix(color('espacios'),p.background,.9),Math.max(3,(thickness+.11)*scale));
  if(kind==='windows'){
   for(const d of [-thickness*.23,thickness*.23])line([-half,half].map(t=>at({x:q.x+tangent.x*t+normal.x*d,z:q.z+tangent.z*t+normal.z*d})),color('espacios',p.muted),Math.max(.6,large?.9:.6));
  }else line(ends,mix(p.muted,p.background,.65),.5);
  visibleOpenings.push(opening.id);
 }
 if(interior)for(const stair of plan.stairs||[]){
  if(stair.buildingId!==buildingId||!stair.axis?.every(finite)||stair.axis.length<2)continue;
  const a=map(stair.axis[0]),b=map(stair.axis.at(-1)),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<10)continue;
  const ux=dx/length,uy=dy/length,start={x:a.x+ux*length*.18,y:a.y+uy*length*.18},end={x:b.x-ux*length*.14,y:b.y-uy*length*.14},head=large?6:4;
  line([start,end],p.text,large?1.2:.8);line([{x:end.x-ux*head-uy*head*.55,y:end.y-uy*head+ux*head*.55},end,{x:end.x-ux*head+uy*head*.55,y:end.y-uy*head-ux*head*.55}],p.text,large?1.2:.8);
 }
 ctx.restore();
 const size=large?13:7.5,separation=large?30:18,targets=[],placed=[];
 const limits={left:plant.x+size,right:plant.x+plant.w-size,top:plant.y+size,bottom:plant.y+plant.h-size};
 const clamp=q=>({x:Math.max(limits.left,Math.min(limits.right,q.x)),y:Math.max(limits.top,Math.min(limits.bottom,q.y))});
 const free=q=>placed.every(b=>Math.hypot(q.x-b.x,q.y-b.y)>=separation);
 for(const stop of [...stops].sort((a,b)=>(b.id===selected)-(a.id===selected))){
  const real=map(stop.coordinate);let draw=clamp(real);
  if(!free(draw)){let best=null,distance=Infinity;for(let n=0;n<900;n++){const r=separation*.55+Math.sqrt(n)*separation*.42,q=clamp({x:real.x+Math.cos(n*2.399963)*r,y:real.y+Math.sin(n*2.399963)*r});if(free(q)){const d=Math.hypot(q.x-real.x,q.y-real.y);if(d<distance){best=q;distance=d;}if(n>110&&best)break;}}if(best)draw=best;}
  placed.push(draw);targets.push({id:stop.id,index:stop.index,...draw,real,r:large?19:12,readingLayer:stop.readingLayer,coordinate:stop.coordinate,elevation:stop.elevation??0});
 }
 for(const t of targets)if(Math.hypot(t.x-t.real.x,t.y-t.real.y)>3){ctx.globalAlpha=.6;line([t.real,t],p.muted,.7);ctx.globalAlpha=1;}
 for(const t of [...targets].sort((a,b)=>(a.id===selected)-(b.id===selected))){const active=t.id===selected,fill=readingMode==='periods'?(layers[t.readingLayer]||p.accent):active?p.accent:p.surface;
  if(active){ctx.beginPath();ctx.arc(t.x,t.y,size+(large?5:3),0,Math.PI*2);ctx.strokeStyle=p.accent;ctx.lineWidth=1.7;ctx.stroke();}
  ctx.beginPath();ctx.arc(t.x,t.y,size,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=active?p.accent:p.muted;ctx.lineWidth=large?1.5:1;ctx.stroke();ctx.fillStyle=readingMode==='periods'?ink(fill):active?p.accentInk:p.text;ctx.font='600 '+(large?13:9.5)+'px Manrope,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(t.index),t.x,t.y+.4);
 }
 const scaleMetres=interior?5:50,bar=scaleMetres*scale,right=area.x+area.w;
 line([{x:right-bar,y:area.y+area.h-3},{x:right,y:area.y+area.h-3}],p.muted,1.5);ctx.fillStyle=p.muted;ctx.font=(large?11:9)+'px Manrope,sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText(scaleMetres+' m',right,area.y+area.h-8);
 ctx.textAlign='right';ctx.textBaseline='top';ctx.fillStyle=p.text;ctx.fillText('N ↑',right,area.y);
 if(large&&showLabels){ctx.textAlign='left';ctx.font='600 '+(area.w>500?13:11)+'px Manrope,sans-serif';ctx.fillText(area.w>500?'BARRIO OBRERO · CASAS Y CALLES':'BARRIO OBRERO',area.x,area.y);ctx.font='11px Manrope,sans-serif';ctx.fillStyle=p.muted;let label=floorLabel+(sectionOpen?' · sección abierta':'');const available=Math.max(80,area.w-bar-18);if(ctx.measureText(label).width>available){while(label.length&&ctx.measureText(label+'…').width>available)label=label.slice(0,-1);label+='…';}ctx.fillText(label,area.x,area.y+area.h-14);}
 return{targets,totalStops:allStops.length,visibleStops:stops.length,components:components.length,visibleOpenings,sectionShown:false,sectionOpen,floor,buildingId,interior,floorLabel,bounds:box,shadeCells,scaleMetres,outlineSource:'barrio-plan',hitTarget(x,y){let id=null,distance=Infinity;for(const t of targets){const d=Math.hypot(t.x-x,t.y-y);if(d<t.r&&d<distance){id=t.id;distance=d;}}return id;}};
}
