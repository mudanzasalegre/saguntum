// A metric elevation and geographic plan of the same registered furnace model.
// Component heights without a survey remain explicitly interpretive in the visit.
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const finite=p=>Array.isArray(p)&&p.length>=2&&p.every(Number.isFinite);
const fallback={background:'#102c34',surface:'#17363c',text:'#f4f1e9',muted:'#b8c8c5',accent:'#e1c18b',accentInk:'#153038',border:'#48636a',terrainLow:'#213e40',building:'#718076',road:'#b4b79d'};
const validColor=c=>/^#[0-9a-f]{6}$/i.test(c||'');
const rgb=s=>s.slice(1).match(/.{2}/g).map(v=>parseInt(v,16));
const mix=(a,b,t)=>{if(!validColor(a)||!validColor(b))return a;const x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';};
const ink=c=>{if(!validColor(c))return '#ffffff';return rgb(c).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0)>155?'#15333b':'#ffffff';};

export function drawHornoMap(canvas,cartography,visit,{selected=null,palette={},large=false,readingMode='materials',sectionOpen=false,showLabels=true,modelGeometry=null,insets={}}={}){
 const ctx=canvas?.getContext('2d');if(!ctx||!visit||!cartography)return null;
 const p={...fallback,...palette},w=canvas.width,h=canvas.height,plan=modelGeometry||visit.plan||{};
 const frame={left:0,right:0,top:0,bottom:0,...insets},pad=large?20:10;
 const area={x:frame.left+pad,y:frame.top+pad,w:Math.max(80,w-frame.left-frame.right-pad*2),h:Math.max(70,h-frame.top-frame.bottom-pad*2)};
 const split=large&&area.w>=630,header=showLabels&&large?36:4,footer=large&&showLabels?26:8;
 const plant={x:area.x,y:area.y+header,w:split?area.w*.36:0,h:area.h-header-footer};
 const elev={x:area.x+(split?area.w*.39:0),y:area.y+header,w:area.w*(split?.61:1),h:area.h-header-footer};
 const scale=Math.min(elev.h/70,elev.w/66),cx=elev.x+elev.w*.56,base=elev.y+elev.h-3*scale;
 const at=(x,y)=>({x:cx+x*scale,y:base-y*scale});
 const line=(points,color=p.muted,width=1,dash=[])=>{if(!points.length)return;ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
 const poly=(points,fill,stroke=p.accent,width=1)=>{if(points.length<3)return;ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();};
 const rect=(x,y,width,height,fill,stroke=p.muted)=>poly([at(x,y),at(x+width,y),at(x+width,y+height),at(x,y+height)],fill,stroke,.8);
 const layers=Object.fromEntries((visit.readingLegend||[]).map(q=>[q.id,q.color]));
 const color=id=>readingMode==='periods'?(layers[id]||p.accent):p.accent;
 ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.beginPath();ctx.rect(elev.x,elev.y,elev.w,elev.h);ctx.clip();
 // Datum and dimension lines are independent of the interpreted profiles.
 line([at(-36,0),at(26,0)],p.muted,.8);
 const metrics=plan.documentedMetrics||{},total=metrics.totalHeight||metrics.exteriorHeight||metrics.height||64.2;
 for(const level of [42,51,total]){
  ctx.globalAlpha=.22;line([at(-11,level),at(22,level)],p.muted,.7,[3,4]);ctx.globalAlpha=1;
  if(large){const q=at(22,level);ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='11px Manrope,sans-serif';ctx.fillText(String(level).replace('.',',')+' m',q.x+3,q.y);}
 }
 const dimension=at(26,total),dimension0=at(26,0);line([dimension,dimension0],p.muted,.8);
 for(const q of [dimension,dimension0])line([{x:q.x-3,y:q.y},{x:q.x+3,y:q.y}],p.muted,1);
 // Visible foundation steps: the total foundation includes buried concrete.
 const foundation=plan.foundationProfile||[{bottom:-3.95,top:-2.7,radius:15.5},{bottom:-2.7,top:-1.2,radius:12.5},{bottom:-1.2,top:0,radius:10},{bottom:0,top:1.65,radius:6.4}];
 for(const q of foundation){ctx.globalAlpha=q.top<=0?.4:1;rect(-q.radius,q.bottom,q.radius*2,q.top-q.bottom,mix(p.building,p.background,.5),p.building);}ctx.globalAlpha=1;
 // Read both the current model's normalized points and legacy object profiles.
 const raw=plan.profile?.points||plan.profile?.outer||plan.profile||[];
 const points=(Array.isArray(raw)?raw:[]).map(q=>Array.isArray(q)?{y:q[0],outerRadius:q[1],innerRadius:q[2]}:q).filter(q=>Number.isFinite(q.y)&&Number.isFinite(q.outerRadius??q.outer??q.radius??q.r));
 const radius=q=>q.outerRadius??q.outer??q.radius??q.r;
 if(points.length){
  const silhouette=[...points.map(q=>at(-radius(q),q.y)),...points.slice().reverse().map(q=>at(radius(q),q.y))];
  poly(silhouette,mix(color('proceso'),p.background,.67),color('proceso'),large?1.6:.9);
  if(sectionOpen||large){
   const inside=points.filter(q=>Number.isFinite(q.innerRadius??q.inner));
   if(inside.length){const cavity=[...inside.map(q=>at(-(q.innerRadius??q.inner),q.y)),...inside.slice().reverse().map(q=>at((q.innerRadius??q.inner),q.y))];poly(cavity,p.background,mix(color('interior'),p.background,.25),large?1.2:.6);}
  }
 }
 const platforms=plan.maintenancePlatforms||[10.4,13.3,16.4,19.5,22.2,24.9,28.4].map(y=>({y,outerRadius:5.65}));
 for(const q of platforms){
  line([at(-q.outerRadius,q.y),at(q.outerRadius,q.y)],color('estructura'),large?1.8:.8);
  line([at(-q.outerRadius,q.y+1.04),at(q.outerRadius,q.y+1.04)],p.muted,.5);
 }
 rect(-7.55,5.28,15.1,.42,mix(p.building,p.background,.15),p.muted);
 // Reconstructed loading plane and its open structural truss.
 const skip=plan.skipProfile||{start:[-24.65,.25,0],end:[-1.55,32.8,0],topChordOffset:2.05};
 const bottom=skip.start,top=skip.end,chord=skip.topChordOffset||2.05;
 for(const dy of [0,chord])line([at(bottom[0],bottom[1]+dy),at(top[0],top[1]+dy)],color('estructura'),large?1.7:1);
 for(let j=0;j<11;j++){const t=j/11,u=(j+1)/11,x=bottom[0]+(top[0]-bottom[0])*t,y=bottom[1]+(top[1]-bottom[1])*t,xx=bottom[0]+(top[0]-bottom[0])*u,yy=bottom[1]+(top[1]-bottom[1])*u;line([at(x,y),at(xx,yy+chord),at(xx,yy)],p.muted,.6);}
 // Asymmetric crane decks and their bracketed supports.
 for(const x of [-4.75,4.75])line([at(x,25.5),at(x,51.1)],color('estructura'),large?2.2:1.2);
 const tower=plan.towerLevels||[28.4,32.8,38.8,42,47.7,51];
 for(let i=1;i<tower.length;i++){const a=tower[i-1],b=tower[i];line([at(-4.75,a),at(4.75,b),at(4.75,a),at(-4.75,b)],p.muted,.8);line([at(-4.75,b),at(4.75,b)],color('estructura'),1.2);}
 for(const [i,q]of (plan.bridgeProfiles||[{elevation:42,extents:[-5.2,16.45,8.1]},{elevation:51,extents:[-5.2,11.1,8.1]}]).entries()){const y=q.elevation,[a,b]=q.extents;rect(a,y-.23,b-a,.4,mix(color('estructura'),p.background,.35),color('estructura'));line([at(4.75,y-(i?6:9)),at(b,y)],color('estructura'),1.2);line([at(a,y+1.08),at(b,y+1.08)],p.muted,.6);}
 // A slight oblique offset separates the two actual purge pipes without changing heights.
 for(const q of plan.gasPaths||[]){const pts=q.points.map(v=>at(v[0]+v[2]*.7,v[1]));line(pts,color('proceso'),Math.max(1,scale*q.radius*1.6));if(q.role==='bleeder'){const x=q.points.at(-1)[0]+q.points.at(-1)[2]*.7;line([at(x,61.65),at(x,64.1)],p.muted,.8);line([at(x-1.86,64.1),at(x+1.86,64.1)],color('proceso'),1);}}
 poly([at(-2.78,26.15),at(-2.23,28.6),at(-1.45,31.8),at(1.45,31.8),at(2.23,28.6),at(2.78,26.15)],mix(p.accent,p.background,.45),p.accent);
 if(sectionOpen){for(const [y,r]of[[27.45,1.53],[30.1,1.16]])poly([at(-r,y-.5),at(0,y+.5),at(r,y-.5)],mix(color('interior'),p.background,.5),color('interior'),1);}
 ctx.globalAlpha=.7;line([at(-6.8,9.2),at(6.8,9.2)],color('proceso'),Math.max(1,scale*.55));ctx.globalAlpha=1;
 // The 21 published cooling rows and open stair flights.
 if(scale>2.4)for(let j=0;j<21;j++){const y=9.25+j*.755;for(const x of[-2.7,-1.35,0,1.35,2.7])rect(x-.14,y,.28,.12,mix(p.accent,p.background,.3),p.accent);}
 for(let y=1.8;y<28.4;y+=.7)line([at(6.38,y),at(7.5,y+.45)],p.muted,.5);
 ctx.restore();

 // Geographic context uses the registered model footprints and actual roads.
 const origin=project(...(plan.coordinate||plan.anchor||visit.coordinate||[-.2203074,39.6542918]));
 const planSpan=plan.contextSpan||170,planScale=split?Math.min(plant.w,plant.h)/planSpan:0;
 const map=c=>{const q=project(...c);return {x:plant.x+plant.w/2+(q.x-origin.x)*planScale,y:plant.y+plant.h*.58+(q.z-origin.z)*planScale};};
 const contextStops=new Set(['horno-conjunto','horno-entorno','horno-memoria']);
 if(split){
  ctx.save();ctx.beginPath();ctx.rect(plant.x,plant.y,plant.w,plant.h);ctx.clip();ctx.fillStyle=mix(p.terrainLow,p.background,.2);ctx.fillRect(plant.x,plant.y,plant.w,plant.h);
  const path=(coords,closed)=>{if(!coords?.length||!coords.every(finite))return false;ctx.beginPath();coords.forEach((c,i)=>{const q=map(c);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});if(closed)ctx.closePath();return true;};
  const near=coords=>coords?.some(c=>finite(c)&&Math.hypot(project(...c).x-origin.x,project(...c).z-origin.z)<planSpan*.8);
  for(const b of cartography.buildings||[])if(near(b.coordinates)&&path(b.coordinates,true)){ctx.fillStyle=mix(p.building,p.background,.62);ctx.fill();ctx.strokeStyle=mix(p.building,p.background,.25);ctx.lineWidth=.7;ctx.stroke();}
  for(const r of cartography.roads||[])if(near(r.coordinates)&&path(r.coordinates,r.area==='yes')){ctx.strokeStyle=p.road;ctx.lineWidth=Math.max(1,(r.width||4)*planScale*.42);ctx.globalAlpha=.48;ctx.stroke();ctx.globalAlpha=1;}
  for(const c of plan.components||[])if(c.coordinates?.length>1&&near(c.coordinates)&&path(c.coordinates,c.closed!==false&&!['path','rail','street','wall'].includes(c.kind))){ctx.strokeStyle=c.kind==='context-building'?p.building:p.accent;ctx.lineWidth=c.kind==='rail'?.8:1;ctx.globalAlpha=.65;if(!['path','rail','street','wall'].includes(c.kind)){ctx.fillStyle=mix(p.accent,p.background,.77);ctx.fill();}ctx.stroke();ctx.globalAlpha=1;}
  const q=map(plan.coordinate||plan.anchor||[-.2203074,39.6542918]);ctx.beginPath();ctx.arc(q.x,q.y,6.4*planScale,0,Math.PI*2);ctx.fillStyle=mix(p.accent,p.background,.5);ctx.fill();ctx.strokeStyle=p.accent;ctx.stroke();
  ctx.restore();ctx.fillStyle=p.muted;ctx.textAlign='right';ctx.font='11px Manrope,sans-serif';ctx.fillText('N ↑',plant.x+plant.w-8,plant.y+16);
  const qx=plant.x+14,qy=plant.y+plant.h-15;line([{x:qx,y:qy},{x:qx+20*planScale,y:qy}],p.muted,1.5);ctx.textAlign='left';ctx.fillText('20 m',qx,qy-8);
 }
 const allStops=visit.stops||[],planStops=new Map((plan.stops||[]).map(s=>[s.id,s]));
 const size=large?12:6.5,separation=large?29:16,targets=[],placed=[];
 const bounds={left:area.x+size,right:area.x+area.w-size,top:area.y+header+size,bottom:area.y+area.h-footer-size};
 const clamp=q=>({x:Math.max(bounds.left,Math.min(bounds.right,q.x)),y:Math.max(bounds.top,Math.min(bounds.bottom,q.y))});
 const free=q=>placed.every(b=>Math.hypot(q.x-b.x,q.y-b.y)>=separation);
 for(const stop of [...allStops].sort((a,b)=>(b.id===selected)-(a.id===selected))){
  const registered=planStops.get(stop.id)||stop,local=registered.localTarget||stop.localTarget;
  const level=registered.elevation??stop.elevation??(Array.isArray(local)?local[1]:local?.y)??0;
  const horizontal=Array.isArray(local)?local[0]+(local[2]||0)*.7:(local?.x??0)+(local?.z??0)*.7;
  const coordinate=stop.coordinate||stop.coordinates||registered.coordinates;
  const context=split&&contextStops.has(stop.id)&&finite(coordinate),real=context?map(coordinate):at(horizontal,level);
  let draw=clamp(real);
  if(!free(draw)){let best=null,distance=Infinity;for(let n=0;n<900;n++){const r=separation*.55+Math.sqrt(n)*separation*.42,q=clamp({x:real.x+Math.cos(n*2.399963)*r,y:real.y+Math.sin(n*2.399963)*r});if(free(q)){const d=Math.hypot(q.x-real.x,q.y-real.y);if(d<distance){best=q;distance=d;}if(n>100&&best)break;}}if(best)draw=best;}
  placed.push(draw);targets.push({id:stop.id,index:allStops.indexOf(stop)+1,...draw,r:large?19:12,real,elevation:level,readingLayer:stop.readingLayer,context});
 }
 for(const t of targets){ctx.globalAlpha=t.id===selected?.9:.5;line([t.real,{x:t.x,y:t.y}],t.id===selected?p.accent:p.muted,t.id===selected?1.3:.7);ctx.globalAlpha=1;}
 for(const t of [...targets].sort((a,b)=>(a.id===selected)-(b.id===selected))){
  const active=t.id===selected,fill=readingMode==='periods'?(layers[t.readingLayer]||p.accent):active?p.accent:p.surface;
  if(active){ctx.beginPath();ctx.arc(t.x,t.y,size+(large?5:3),0,Math.PI*2);ctx.strokeStyle=p.accent;ctx.lineWidth=1.6;ctx.stroke();}
  ctx.beginPath();ctx.arc(t.x,t.y,size,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=active?p.accent:p.muted;ctx.lineWidth=large?1.5:1;ctx.stroke();ctx.fillStyle=readingMode==='periods'?ink(fill):active?p.accentInk:p.text;ctx.font='600 '+(large?12:8.5)+'px Manrope,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(t.index),t.x,t.y+.4);
 }
 if(showLabels&&large){ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle=p.text;ctx.font='600 12px Manrope,sans-serif';ctx.fillText(split?'RECINTO · PLANTA':'ALTO HORNO N.º 2',area.x,area.y);if(split)ctx.fillText('MÁQUINA · ALZADO',elev.x,area.y);ctx.font='11px Manrope,sans-serif';ctx.fillStyle=p.muted;ctx.fillText(sectionOpen?(split?'Sección didáctica · perfil interior aproximado':'Sección didáctica · perfil aproximado'):(split?'Alzado interpretativo · cotas principales documentadas':'Alzado interpretativo · cotas publicadas'),elev.x,area.y+area.h-14);}
 return {targets,totalStops:allStops.length,visibleStops:allStops.length,floorLabel:split?'Alzado y recinto':'Alzado del horno',scaleMetres:10,components:(plan.components||[]).length,profilePoints:points.length,elevation:true,split,hitTarget(x,y){let result=null,closest=Infinity;for(const t of targets){const d=Math.hypot(t.x-x,t.y-y);if(d<t.r&&d<closest){result=t.id;closest=d;}}return result;}};
}
