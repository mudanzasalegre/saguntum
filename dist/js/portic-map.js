// Vía del Pòrtic plan with floor-aware interior layers. Coordinates come
// from the registered footprints and attributed cartography; interior positions
// marked interpretive are never presented as a measured archaeological survey.
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const finite=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
const fallback={background:'#102c34',surface:'#142e35',text:'#f4f1e9',muted:'#b8c8c5',accent:'#e1c18b',accentInk:'#153038',border:'#48636a',terrainLow:'#18383d',terrainHigh:'#4e6957',vegetation:'#446751',building:'#718076',road:'#b4b79d',ancient:'#e2ad78',modern:'#aaa5d4',unknown:'#8c9c98'};
const validColor=c=>/^#[0-9a-f]{6}$/i.test(c||'');
const luminance=hex=>{const c=hex.slice(1).match(/.{2}/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const inkFor=color=>{if(!validColor(color))return '#ffffff';const l=luminance(color),dark=luminance('#15333b');return (Math.max(l,dark)+.05)/(Math.min(l,dark)+.05)>=1.05/(l+.05)?'#15333b':'#ffffff';};
const mix=(a,b,t)=>{if(!validColor(a)||!validColor(b))return a;const rgb=s=>s.slice(1).match(/.{2}/g).map(v=>parseInt(v,16)),x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';};

export function drawPorticMap(canvas,cartography,visit,{selected=null,heightAt,palette={},large=false,readingMode='materials',showLabels=true,modelGeometry=null,insets={},presentationMode='current'}={}){
 const ctx=canvas?.getContext('2d');if(!ctx||!cartography||!visit)return null;
 const p={...fallback,...palette},w=canvas.width,h=canvas.height,plan=modelGeometry||visit.plan||{};
 const outline=(plan.outline||cartography.porticPolygon||[]).filter(finite);
 if(outline.length<3)return null;
 const selectedPlan=(plan.stops||[]).find(s=>s.id===selected),selectedVisit=(visit.stops||[]).find(s=>s.id===selected),floor=(!selected||selected==='portic-conjunto')&&presentationMode!=='current'?-1:selectedPlan?.floor??selectedVisit?.floor??null;
 const components=(Array.isArray(plan)?plan:plan.components||[]).filter(c=>floor===null||!c.floors||c.floors.includes(floor)).filter(c=>Array.isArray(c.coordinates)&&c.coordinates.length>=(['station','gate'].includes(c.kind)?1:2)&&c.coordinates.every(finite));
 const allStops=(visit.stops||[]).filter(s=>finite(s.coordinate||s.coordinates));
 const stops=allStops.filter(s=>floor===null||(s.floor??(plan.stops||[]).find(p=>p.id===s.id)?.floor)===floor||s.id===selected);
 const periodColors={ancient:p.ancient,roman:p.ancient,medieval:'#d6bd8b',modern:'#d4a578',contemporary:'#77b8c7',mixed:'#be98d6',interpretation:'#929ba0',unknown:p.unknown};
 for(const item of visit.readingLegend||[])if(validColor(item.color))periodColors[item.id]=item.color;
 const periodColor=value=>periodColors[value]||p.unknown;
 const points=outline.map(c=>project(...c));
 const box={minX:Math.min(...points.map(a=>a.x))-6,maxX:Math.max(...points.map(a=>a.x))+6,minZ:Math.min(...points.map(a=>a.z))-6,maxZ:Math.max(...points.map(a=>a.z))+6};
 // Frame the museum and its immediate public space. Long street lines remain
 // in the cartography but must not reduce the two-floor plan to a tiny mark.
 const coreCenter={x:(box.minX+box.maxX)/2,z:(box.minZ+box.maxZ)/2};
 for(const stop of stops){const a=project(...(stop.coordinate||stop.coordinates));if(Math.hypot(a.x-coreCenter.x,a.z-coreCenter.z)<=110||stop.id===selected){box.minX=Math.min(box.minX,a.x-5);box.maxX=Math.max(box.maxX,a.x+5);box.minZ=Math.min(box.minZ,a.z-5);box.maxZ=Math.max(box.maxZ,a.z+5);}}
 box.minX-=3;box.maxX+=3;box.minZ-=3;box.maxZ+=3;
 const frame={left:0,right:0,top:0,bottom:0,...insets},pad=large?22:13;
 const usableW=Math.max(80,w-frame.left-frame.right),usableH=Math.max(80,h-frame.top-frame.bottom),header=large&&showLabels?(usableW>450?42:22):0;
 const availableW=Math.max(40,usableW-pad*2),availableH=Math.max(40,usableH-pad*2-header);
 const scale=Math.min(availableW/(box.maxX-box.minX),availableH/(box.maxZ-box.minZ));
 const ox=frame.left+pad+(availableW-(box.maxX-box.minX)*scale)/2,oy=frame.top+pad+header+(availableH-(box.maxZ-box.minZ)*scale)/2;
 const map=a=>({x:ox+(a.x-box.minX)*scale,y:oy+(a.z-box.minZ)*scale});
 const screenBox={x:ox,y:oy,width:(box.maxX-box.minX)*scale,height:(box.maxZ-box.minZ)*scale};
 const path=(coordinates,close=false)=>{if(!coordinates?.length||!coordinates.every(finite))return false;ctx.beginPath();coordinates.forEach((c,i)=>{const a=map(project(...c));i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y);});if(close)ctx.closePath();return true;};
 const inView=coordinates=>coordinates?.some(c=>{if(!finite(c))return false;const a=project(...c);return a.x>=box.minX&&a.x<=box.maxX&&a.z>=box.minZ&&a.z<=box.maxZ;});
 ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.beginPath();ctx.rect(screenBox.x,screenBox.y,screenBox.width,screenBox.height);ctx.clip();
 let shadeCells=0,contourSegments=0;
 if(typeof heightAt==='function'){
  const px=large?6:7,step=px/scale;
  for(let z=box.minZ;z<box.maxZ;z+=step)for(let x=box.minX;x<box.maxX;x+=step){const y=heightAt(x,z),east=heightAt(x+step,z),north=heightAt(x,z-step),a=map({x,z}),slope=Number.isFinite(east+north+y)?Math.max(-.13,Math.min(.13,(north-east)/(step*9))):0,level=Math.max(0,Math.min(1,(Number.isFinite(y)?y:60)/200+slope));ctx.fillStyle=mix(p.terrainLow,p.terrainHigh,level);ctx.fillRect(a.x,a.y,px+1,px+1);shadeCells++;}
  // Five-metre contours expose the real slope without modifying the DEM.
  // Intersect small terrain triangles rather than connecting ambiguous
  // four-edge marching-square cases across the courtyards and streets.
  if(large){
   const interval=5,grid=8;
   ctx.strokeStyle=p.muted;ctx.globalAlpha=.22;ctx.lineWidth=.65;
   for(let z=box.minZ;z<box.maxZ;z+=grid)for(let x=box.minX;x<box.maxX;x+=grid){
    const q=[[x,z],[Math.min(x+grid,box.maxX),z],[Math.min(x+grid,box.maxX),Math.min(z+grid,box.maxZ)],[x,Math.min(z+grid,box.maxZ)]].map(([x,z])=>({x,z,h:heightAt(x,z)}));
    if(!q.every(v=>Number.isFinite(v.h)))continue;
    for(const ids of[[0,1,2],[0,2,3]]){
     const tri=ids.map(i=>q[i]),lo=Math.ceil(Math.min(...tri.map(v=>v.h))/interval)*interval,hi=Math.max(...tri.map(v=>v.h));
     for(let level=lo;level<=hi;level+=interval){const crossings=[];
      for(let i=0;i<3;i++){const a=tri[i],b=tri[(i+1)%3];if((a.h<level&&b.h>=level)||(b.h<level&&a.h>=level)){const t=(level-a.h)/(b.h-a.h);crossings.push(map({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}));}}
      if(crossings.length===2){ctx.beginPath();ctx.moveTo(crossings[0].x,crossings[0].y);ctx.lineTo(crossings[1].x,crossings[1].y);ctx.stroke();contourSegments++;}
     }
    }
   }
   ctx.globalAlpha=1;
  }
 }
 for(const b of cartography.buildings||[])if(inView(b.coordinates)&&path(b.coordinates,true)){ctx.globalAlpha=.4;ctx.fillStyle=p.building;ctx.fill();for(const hole of b.holes||[])if(path(hole,true)){ctx.globalAlpha=.7;ctx.fillStyle=p.terrainLow;ctx.fill();}}
 for(const road of cartography.roads||[])if(inView(road.coordinates)&&path(road.coordinates,road.area==='yes')){ctx.globalAlpha=.6;ctx.strokeStyle=p.road;ctx.lineWidth=large?1.6:.8;ctx.stroke();if(road.area==='yes'){ctx.globalAlpha=.16;ctx.fillStyle=p.road;ctx.fill();}}
 ctx.globalAlpha=1;path(outline,true);ctx.fillStyle=mix(p.accent,p.background,.77);ctx.fill();
 for(const component of components){
  if(component.coordinates.length===1){
   const at=map(project(...component.coordinates[0])),size=component.kind==='gate'?(large?4:2.5):(large?3:1.8);
   // Small unnumbered squares denote interpreted roadside structures; the
   // numbered circles below always identify the20 thematic visit stops.
   ctx.beginPath();ctx.rect(at.x-size,at.y-size,size*2,size*2);ctx.fillStyle=readingMode==='periods'?periodColor(component.period):p.accent;ctx.globalAlpha=.42;ctx.fill();ctx.strokeStyle=p.accent;ctx.globalAlpha=.85;ctx.lineWidth=large?1:.6;ctx.stroke();ctx.globalAlpha=1;continue;
  }
  const linear=['path','wall','street'].includes(component.kind),closed=component.closed===true||(!linear&&component.closed!==false&&component.coordinates.length>=3);if(!path(component.coordinates,closed))continue;
  const context=component.kind==='context-building',route=component.kind==='path',wall=component.kind==='wall',surface=['plaza','street','stairs','forecourt'].includes(component.kind);
  // Surrounding parcels and approach streets provide geographic context;
  // they have no specific historical dating and retain neutral map colours.
  const color=context?p.building:component.kind==='street'?p.road:readingMode==='periods'?periodColor(component.period):route?p.accent:wall?p.muted:surface?p.road:p.accent;
  if(closed){ctx.globalAlpha=context?.16:readingMode==='periods'?.32:.24;ctx.fillStyle=color;ctx.fill();for(const hole of component.holes||[])if(path(hole,true)){ctx.fillStyle=p.terrainLow;ctx.fill();}path(component.coordinates,true);}
  ctx.globalAlpha=context?.48:wall?.58:.9;ctx.strokeStyle=color;ctx.lineWidth=context?(large?.9:.5):route?(large?2.6:1.4):wall?(large?1:.6):(large?1.5:.8);ctx.setLineDash(component.interpretive?[large?5:3,large?3:2]:[]);ctx.stroke();ctx.setLineDash([]);
 }
 ctx.globalAlpha=1;path(outline,true);ctx.strokeStyle=p.accent;ctx.lineWidth=large?2.4:1.3;ctx.stroke();ctx.restore();

 const size=large?13:7,separation=large?32:17,targets=[],placed=[];
 const limits={left:frame.left+pad+size,right:w-frame.right-pad-size,top:frame.top+pad+header+size,bottom:h-frame.bottom-pad-size};
 const clamp=a=>({x:Math.max(limits.left,Math.min(limits.right,a.x)),y:Math.max(limits.top,Math.min(limits.bottom,a.y))});
 const free=a=>placed.every(b=>Math.hypot(a.x-b.x,a.y-b.y)>=separation);
 const ordered=[...stops].sort((a,b)=>(b.id===selected)-(a.id===selected));
 for(const stop of ordered){
  const real=map(project(...(stop.coordinate||stop.coordinates))),index=allStops.indexOf(stop)+1;let draw={...real};
  if(!free(draw)){
   let found=false;
   for(let n=0;n<700;n++){const radius=separation*.6+Math.sqrt(n)*separation*.48,candidate=clamp({x:real.x+Math.cos(n*2.399963)*radius,y:real.y+Math.sin(n*2.399963)*radius});if(free(candidate)){draw=candidate;found=true;break;}}
   if(!found){let best=null,distance=Infinity;for(let y=limits.top;y<=limits.bottom;y+=separation)for(let x=limits.left;x<=limits.right;x+=separation){const candidate={x,y},d=Math.hypot(x-real.x,y-real.y);if(d<distance&&free(candidate)){best=candidate;distance=d;}}if(best)draw=best;}
  }
  placed.push(draw);targets.push({id:stop.id,x:draw.x,y:draw.y,r:large?20:13,real,index,period:stop.period,readingLayer:stop.readingLayer||stop.period,coordinate:[...(stop.coordinate||stop.coordinates)]});
 }
 // Draw every leader below every marker so lines never cross a stop number.
 for(const target of targets){
  if(Math.hypot(target.x-target.real.x,target.y-target.real.y)>3){ctx.beginPath();ctx.moveTo(target.real.x,target.real.y);ctx.lineTo(target.x,target.y);ctx.strokeStyle=p.muted;ctx.lineWidth=large?1:.6;ctx.stroke();ctx.beginPath();ctx.arc(target.real.x,target.real.y,large?2:1.2,0,Math.PI*2);ctx.fillStyle=p.muted;ctx.fill();}
 }
 for(const target of [...targets].sort((a,b)=>(a.id===selected)-(b.id===selected))){
  const active=target.id===selected,layers=readingMode==='periods',color=periodColor(target.readingLayer);
  if(active){ctx.beginPath();ctx.arc(target.x,target.y,size+(large?6:4),0,Math.PI*2);ctx.strokeStyle=p.accent;ctx.lineWidth=large?2:1;ctx.stroke();}
  const fill=layers?color:active?p.accent:p.surface;ctx.beginPath();ctx.arc(target.x,target.y,size,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=active?p.accent:layers?p.border:p.muted;ctx.lineWidth=large?2:1.4;ctx.stroke();ctx.fillStyle=layers?inkFor(fill):active?p.accentInk:p.text;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 '+(large?13:9)+'px Manrope,sans-serif';ctx.fillText(String(target.index),target.x,target.y+.4);
 }
 const right=w-frame.right-pad,top=frame.top+pad,bottom=h-frame.bottom-pad;
 ctx.fillStyle=p.text;ctx.font=(large?14:10)+'px Manrope,sans-serif';ctx.textAlign='right';ctx.textBaseline='top';ctx.fillText('N',right,top);ctx.beginPath();ctx.moveTo(right-5,top+36);ctx.lineTo(right-5,top+20);ctx.strokeStyle=p.text;ctx.lineWidth=1.4;ctx.stroke();
 const metres=scale*20>usableW*.35?10:20,bar=metres*scale;ctx.beginPath();ctx.moveTo(right-bar,bottom-5);ctx.lineTo(right,bottom-5);ctx.stroke();ctx.font=(large?12:9)+'px Manrope,sans-serif';ctx.fillText(metres+' m',right,bottom-23);
 if(large&&showLabels){ctx.textAlign='left';ctx.font='600 '+(usableW>450?14:12)+'px Manrope,sans-serif';ctx.fillStyle=p.text;ctx.fillText(usableW>450?'VÍA DEL PÒRTIC':'VÍA DEL PÒRTIC',frame.left+pad,top);if(usableW>450){ctx.font='12px Manrope,sans-serif';ctx.fillStyle=p.muted;ctx.fillText(floor===-1?'Espacio arqueológico · calzada, agua y ocupaciones':floor===0?'Ciudad actual · acceso y plaza':'Calzada, espacios arqueológicos y ciudad actual',frame.left+pad,top+23);}}
 return{targets,totalStops:allStops.length,visibleStops:stops.length,floor,floorLabel:floor===-1?'Espacio arqueológico':floor===0?'Ciudad actual':'Conjunto',bounds:box,shadeCells,contourSegments,components:components.length,scaleMetres:metres,outlineSource:'portic-plan',hitTarget(x,y){let result=null,closest=Infinity;for(const target of targets){const d=Math.hypot(target.x-x,target.y-y);if(d<target.r&&d<closest){result=target.id;closest=d;}}return result;}};
}
