// Eastern enclosure: surviving fabric, hand-registered to current OSM/PNOA.
// Vertical sections, material weathering and minor fragments are interpretive.
// No roofs, palace or lost historical buildings are restituted here.
import {EAST_PLAN_FEATURES,EAST_ROUTE_DEFS} from './castle-east-layout.js';
import {polygonDistance} from './urban-surface.js';
import {buildEastRock} from './castle-east-rock.js';

const rand=n=>{const v=Math.sin(n*127.13+43.7)*43758.5453;return v-Math.floor(v);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const quad=(out,a,b,c,d)=>out.push(...a,...b,...c,...a,...c,...d);
export const EAST_REPLACED_BUILDING_IDS=new Set(['733215260','733215261','733215262','733215263']);
export function isEastPerimeterSegment(a,b){const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;return x>-.27606&&z>39.67587&&z<39.67689;}

export function buildCastleEast({THREE,batch,keyFor,project,heightAt,ground,outline,qa,stats,detail='full'}){
 const features=Object.values(EAST_PLAN_FEATURES).flat().map(f=>({...f,period:'unknown',component:f.id,
  closed:['platform','standing-ruin','open-deposit','rock-patch','rock-slope'].includes(f.kind),interpretive:true}));
 const record={features,walkingRoutes:[],walkSamples:[],platforms:[],ruins:[],openDeposits:[],stairs:[],perimeterSegments:0,
  method:'Current OSM footprints and PNOA hand-tracing, checked against Ricsol photographs, Civera and Plan Director. Relative heights are estimated; roofless remains and ambiguous traces retain their current condition.'};
 const masks=[],key=(id,kind='east-masonry',period='unknown')=>keyFor('almenara',id,period,kind);
 const from=coords=>coords.map(c=>project(...c));
 const clean=poly=>poly.length>2&&Math.hypot(poly[0].x-poly.at(-1).x,poly[0].z-poly.at(-1).z)<.01?poly.slice(0,-1):poly;
 const center=poly=>poly.reduce((a,p)=>({x:a.x+p.x/poly.length,z:a.z+p.z/poly.length}),{x:0,z:0});
 const point=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
 function flatFloor(poly,y,id,kind='east-earth',tint=1){
  const triangles=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(p.x,p.z)),[]),out=[];
  for(const t of triangles){const a=poly[t[0]],b=poly[t[1]],c=poly[t[2]],cross=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);for(const p of cross>0?[a,c,b]:[a,b,c])out.push(p.x,y,p.z);}
  batch.raw(key(id,kind),out,tint);
 }
 function section(a,b,{id,top,bottom,thickness=.7,kind='east-masonry',broken=false,seed=1,tint=1}={}){
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<.02)return;
  const nx=-dz/l,nz=dx/l,n=Math.ceil(l/1.05);
  const base=p=>typeof bottom==='function'?bottom(p):Number.isFinite(bottom)?bottom:Math.min(heightAt(p.x+nx*thickness*.6,p.z+nz*thickness*.6),heightAt(p.x-nx*thickness*.6,p.z-nz*thickness*.6))-.35;
  const crown=(p,t)=>{const h=typeof top==='function'?top(p):top;return h+(broken?(Math.sin(t*9+seed)*.06+rand(Math.round(t*31)+seed)*.11):0);};
  for(let i=0;i<n;i++){
   const p=point(a,b,i/n),q=point(a,b,(i+1)/n),lo=[base(p),base(q)],hi=[Math.max(lo[0]+.08,crown(p,i/n)),Math.max(lo[1]+.08,crown(q,(i+1)/n))],v=[];
   const c=(r,y,side,atTop)=>[r.x+nx*side*thickness*(atTop?.5:.55),y,r.z+nz*side*thickness*(atTop?.5:.55)];
   quad(v,c(p,lo[0],1,false),c(q,lo[1],1,false),c(q,hi[1],1,true),c(p,hi[0],1,true));
   quad(v,c(q,lo[1],-1,false),c(p,lo[0],-1,false),c(p,hi[0],-1,true),c(q,hi[1],-1,true));
   quad(v,c(p,hi[0],-1,true),c(p,hi[0],1,true),c(q,hi[1],1,true),c(q,hi[1],-1,true));
   if(i===0)quad(v,c(p,lo[0],-1,false),c(p,lo[0],1,false),c(p,hi[0],1,true),c(p,hi[0],-1,true));
   if(i===n-1)quad(v,c(q,lo[1],1,false),c(q,lo[1],-1,false),c(q,hi[1],-1,true),c(q,hi[1],1,true));
   batch.raw(key(id,kind),v,tint*(.94+rand(i*13+seed)*.08));
  }
 }
 function inset(poly,d){
  const area=poly.reduce((s,p,i)=>s+p.x*poly[(i+1)%poly.length].z-poly[(i+1)%poly.length].x*p.z,0),sign=Math.sign(area);
  const edges=poly.map((p,i)=>{const q=poly[(i+1)%poly.length],dx=q.x-p.x,dz=q.z-p.z,l=Math.hypot(dx,dz);return{p:{x:p.x-sign*dz/l*d,z:p.z+sign*dx/l*d},dx,dz};});
  return edges.map((b,i)=>{const a=edges[(i+edges.length-1)%edges.length],det=a.dx*b.dz-a.dz*b.dx;if(Math.abs(det)<1e-8)return b.p;const t=((b.p.x-a.p.x)*b.dz-(b.p.z-a.p.z)*b.dx)/det;return{x:a.p.x+a.dx*t,z:a.p.z+a.dz*t};});
 }
 const platforms=EAST_PLAN_FEATURES.platforms.map(f=>{const polygon=from(f.coordinates),p=center(polygon),rise=f.id==='bastion-ne'?.20:f.id==='battery-e'?1.75:2.10;
  const base=ground.east.plane(p.x,p.z)+rise,deck=f.id==='bastion-ne'?Math.max(base,...polygon.map(q=>heightAt(q.x,q.z)+.16)):base;
  return{...f,polygon,center:p,deck};});
 // Raised present military terraces; their interior retaining faces, unroofed
 // decks and stairs are separate from the natural slope below the curtains.
 for(const f of platforms){
  for(let i=0;i<f.polygon.length;i++)section(f.polygon[i],f.polygon[(i+1)%f.polygon.length],{id:f.id,top:f.deck,thickness:.65,seed:440+i,kind:'east-masonry'});
  flatFloor(f.polygon,f.deck+.035,f.id+'-floor','east-earth',.97);
  record.platforms.push({id:f.id,polygon:f.polygon,deck:f.deck,roof:false,heightConfidence:'photographic-relative-estimate'});
  // Inner face mortar scars and short returns are visible on current photos.
  if(f.id!=='bastion-ne'){
   let ai=f.id==='battery-n'?3:0,bi=f.id==='battery-n'?0:1;
   if(f.id==='battery-e'){ai=1;bi=2;}
   const a=f.polygon[ai],b=f.polygon[bi],length=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/length,dz=(b.z-a.z)/length;
   const mid=point(a,b,.5),toward={x:mid.x-f.center.x,z:mid.z-f.center.z},d=Math.hypot(toward.x,toward.z),nx=toward.x/d,nz=toward.z/d;
   for(let j=1;j<Math.floor(length/3.8);j++){
    const p=point(a,b,j/Math.floor(length/3.8)),base=heightAt(p.x+nx*.9,p.z+nz*.9);
    if(detail==='full'){
     const y=Math.max(base+.5,f.deck-1.05),yaw=-Math.atan2(dz,dx);
     batch.box(key(f.id,'east-render'),p.x+nx*.36,y,p.z+nz*.36,1.45,.7,.035,yaw,.93);
     // Putlog sockets are shallow recesses in mixed fabric, not false windows.
     batch.box(key(f.id,'mortar'),p.x+nx*.39,f.deck-.54,p.z+nz*.39,.16,.17,.055,yaw,.61);
    }
   }
   if(f.id==='battery-nw'||f.id==='battery-n'){
    const start=point(a,b,f.id==='battery-nw'?.12:.86),run=4.2,width=1.2,n=12,
     foot={x:start.x+nx*run,z:start.z+nz*run},floor=heightAt(foot.x,foot.z)+.08;
    for(let j=0;j<n;j++){
     const t=(j+.5)/n,x=foot.x-nx*run*t,z=foot.z-nz*run*t,top=floor+(f.deck+.04-floor)*(j+1)/n,base=Math.min(floor,heightAt(x,z))-.15;
     batch.box(key('east-stairs','worn-ashlar'),x,(top+base)/2,z,width,top-base,run/n+.025,-Math.atan2(dz,dx),.9+rand(j)*.06);
    }
    // Low side cheek remains; no invented visitor railing on ancient fabric.
    const side={x:-nz*width*.6,z:nx*width*.6};
    section({x:foot.x+side.x,z:foot.z+side.z},{x:start.x+side.x,z:start.z+side.z},{id:f.id,top:p=>floor+(f.deck-floor)*clamp(1-Math.hypot(p.x-start.x,p.z-start.z)/run,0,1)+.28,thickness:.25,kind:'east-render'});
    record.stairs.push({platform:f.id,from:[foot.x,floor,foot.z],to:[start.x,f.deck+.04,start.z],steps:n,width,estimated:true});
   }
  }
 }
 function nearestPlatform(p){let found=null,d=Infinity;for(const f of platforms){const v=polygonDistance(p.x,p.z,f.polygon);if(v<d){d=v;found=f;}}return{feature:found,distance:d};}
 const tower=EAST_PLAN_FEATURES.points[0],tp=project(...tower.coordinates);
 // Preserve the exact mapped perimeter. Its section changes with the current
 // batteries: a plain broken southern crown, perforated merlons on the north,
 // and broad gun embrasures at the northeastern bastion.
 for(let i=0;i<outline.length-1;i++){
  if(!isEastPerimeterSegment(outline[i],outline[i+1]))continue;
  const a=project(...outline[i]),b=project(...outline[i+1]),mid=point(a,b,.5),l=Math.hypot(b.x-a.x,b.z-a.z);
  if(Math.hypot(mid.x-tp.x,mid.z-tp.z)<2.4)continue;
  const near=nearestPlatform(mid),f=near.feature,defensive=near.distance<3.4,
   bastion=defensive&&f.id==='bastion-ne',northern=outline[i][1]>39.67671&&!bastion,
   deck=defensive?f.deck:ground.east.plane(mid.x,mid.z)+(northern?2.10:.85),
   top=deck+(bastion?.48:northern?.47:.30),id=bastion?'bastion-ne':northern?'battery-n':defensive?f.id:'east-south-curtain';
  section(a,b,{id,top,thickness:bastion?1.35:northern?1.25:1.55,broken:!bastion&&!northern,seed:900+i});
  record.perimeterSegments++;
  // Splayed corners are reinforced by irregular pale ashlar blocks.
  if(detail==='full'&&i%3===0){const base=heightAt(a.x,a.z),rows=Math.max(1,Math.min(8,Math.floor((top-base)/.5)));for(let r=0;r<rows;r++)batch.box(key(id,'worn-ashlar'),a.x,base+.24+r*.5,a.z,.72+(r%2)*.14,.43,.72,-Math.atan2(b.z-a.z,b.x-a.x),.89+rand(r+i)*.08);}
  if(northern||bastion){
   const spacing=bastion?4.0:1.85,width=bastion?2.5:1.06,height=bastion?.88:1.10,thickness=bastion?1.05:.68,yaw=-Math.atan2(b.z-a.z,b.x-a.x),dx=(b.x-a.x)/l,dz=(b.z-a.z)/l;
   const count=Math.max(0,Math.floor(l/spacing));
   for(let j=0;j<count;j++){
    const p=point(a,b,(j+.5)/count),base=top-.025;
    if(bastion)batch.box(key(id),p.x,base+height/2,p.z,width,height,thickness,yaw,.96);
    else{
     const slit=.145,w=(width-slit)/2;
     for(const sign of[-1,1])batch.box(key(id,'east-render'),p.x+dx*sign*(slit+w)/2,base+height/2,p.z+dz*sign*(slit+w)/2,w,height,thickness,yaw,.97);
     batch.box(key(id,'east-render'),p.x,base+.20,p.z,slit,.40,thickness,yaw,.98);
     batch.box(key(id,'east-render'),p.x,base+height-.18,p.z,slit,.36,thickness,yaw,.98);
    }
    batch.box(key(id,'worn-ashlar'),p.x,base+height+.025,p.z,width+.045,.05,thickness+.045,yaw,.9);
   }
  }
 }
 // Small outward semicircular projection, attached to the northern curtain.
 // Unlike a generic complete tower, only its visible outward half is built.
 {
  const r=tower.radiusM,axis=-1.85,top=ground.east.plane(tp.x,tp.z)+3.35,out=[],segments=22;
  const arc=[];for(let j=0;j<=segments;j++){const angle=axis-Math.PI/2+j*Math.PI/segments;arc.push({x:tp.x+Math.cos(angle)*r,z:tp.z+Math.sin(angle)*r});}
  for(let j=1;j<arc.length;j++){
   const a=arc[j-1],b=arc[j],ya=heightAt(a.x,a.z)-.45,yb=heightAt(b.x,b.z)-.45;
   quad(out,[b.x,yb,b.z],[a.x,ya,a.z],[a.x,top,a.z],[b.x,top,b.z]);
  }
  batch.raw(key(tower.id),out,.97);flatFloor(arc,top,tower.id,'east-masonry',.95);
 }
 // Roofless mapped ruins: differing crowns, surviving returns and real floors.
 for(const f of EAST_PLAN_FEATURES.ruins){
  const poly=clean(from(f.coordinates)),p=center(poly),inner=inset(poly,f.kind==='open-deposit'?.34:.44),small=f.kind==='open-deposit';
  if(small){
   const rim=Math.max(...poly.map(q=>heightAt(q.x,q.z)))+.18,bottom=rim-1.55;
   for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],ai=inner[i],bi=inner[(i+1)%poly.length],n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.45);
    for(let j=0;j<n;j++){
     const crown=t=>rim+.12*(rand(i*31)*(1-t)+rand(((i+1)%poly.length)*31)*t)+Math.sin(Math.PI*t)*.065*rand(i*31+Math.round(t*n));
     const u=j/n,v=(j+1)/n,oa=point(a,b,u),ob=point(a,b,v),ia=point(ai,bi,u),ib=point(ai,bi,v),ha=crown(u),hb=crown(v),outer=[],lining=[],cap=[];
     quad(outer,[ob.x,heightAt(ob.x,ob.z)-.18,ob.z],[oa.x,heightAt(oa.x,oa.z)-.18,oa.z],[oa.x,ha,oa.z],[ob.x,hb,ob.z]);
     quad(lining,[ia.x,bottom,ia.z],[ib.x,bottom,ib.z],[ib.x,hb-.09,ib.z],[ia.x,ha-.09,ia.z]);
     quad(cap,[oa.x,ha,oa.z],[ia.x,ha-.09,ia.z],[ib.x,hb-.09,ib.z],[ob.x,hb,ob.z]);
     batch.raw(key(f.id),outer,.94);batch.raw(key(f.id,'east-render'),lining,.91);batch.raw(key(f.id,'worn-ashlar'),cap,.92);
    }
   }
   flatFloor(inner,bottom+.025,f.id,'east-earth',.82);
   masks.push({id:f.id,outline:inner,polygon:inner,center:p,width:6,depth:5,floorY:bottom,permanent:true,clipContext:false});
   record.openDeposits.push({id:f.id,polygon:poly,interior:inner,rimY:rim,floorY:bottom,roof:false,depthConfidence:'visual-estimate; not identified as a measured Civera tank'});
  }else{
   const floor=ground.east.plane(p.x,p.z)+.11;
   flatFloor(inner,floor,f.id+'-floor','east-earth',.96);
   const large=f.osmId==='733215260';
   for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],mid=point(a,b,.5),high=large?(mid.z<p.z?2.35:.72):.48+rand(i+Number(f.osmId))*1.03;
    section(a,b,{id:f.id,top:q=>floor+high+.15*Math.sin(q.x*.8+q.z*.7),bottom:q=>Math.min(floor-.25,heightAt(q.x,q.z)-.22),thickness:large?.72:.57,broken:true,seed:i+443});
    if(large&&mid.z<p.z){
     const ia=inner[i],ib=inner[(i+1)%poly.length];
     section(ia,ib,{id:f.id,top:floor+high-.2,bottom:floor+.06,thickness:.025,kind:'east-render',broken:true,tint:.95});
    }
   }
   record.ruins.push({id:f.id,polygon:poly,floorY:floor,roof:false,functionAssigned:false});
  }
 }
 for(const f of EAST_PLAN_FEATURES.traces.filter(f=>f.kind!=='exposed-rock-and-low-remains')){
  const poly=from(f.coordinates);for(let i=1;i<poly.length;i++)section(poly[i-1],poly[i],{id:f.id,top:p=>heightAt(p.x,p.z)+f.reliefRangeM[0]+(f.reliefRangeM[1]-f.reliefRangeM[0])*(.25+.65*rand(i+poly[i].x)),thickness:f.widthM,broken:true,seed:220+i});
 }
 // Fine earth/gravel is a current surface, not an archaeological paving. A
 // dense drape replaces blurred aerial shadows on the open visitor courtyard.
 // Keep the deposit as a real hole; surrounding rock remains separate geometry.
 {
  const outer=clean(ground.east.courtyard),holes=masks.map(m=>m.outline),contours=[outer,...holes],vertices=contours.flat(),positions=[];
  const triangles=THREE.ShapeUtils.triangulateShape(outer.map(p=>new THREE.Vector2(p.x,p.z)),holes.map(h=>h.map(p=>new THREE.Vector2(p.x,p.z))));
  function face(a,b,c,depth=0){
   const ab=Math.hypot(a.x-b.x,a.z-b.z),ac=Math.hypot(a.x-c.x,a.z-c.z),bc=Math.hypot(b.x-c.x,b.z-c.z),longest=Math.max(ab,ac,bc);
   if(depth<18&&longest>1.35){
    if(longest===ab){const m=point(a,b,.5);face(a,m,c,depth+1);face(m,b,c,depth+1);}
    else if(longest===ac){const m=point(a,c,.5);face(a,b,m,depth+1);face(m,b,c,depth+1);}
    else{const m=point(b,c,.5);face(a,b,m,depth+1);face(a,m,c,depth+1);}return;
   }
   const area=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x),tri=area>0?[a,c,b]:[a,b,c];
   for(const p of tri)positions.push(p.x,heightAt(p.x,p.z)+.018,p.z);
  }
  for(const t of triangles)face(...t.map(i=>vertices[i]));
  batch.raw(key('east-courtyard','east-earth'),positions,.98);
 }
 record.rocks=buildEastRock({THREE,batch,keyFor,project,heightAt,detail,qa,features:EAST_PLAN_FEATURES});
 for(const route of EAST_ROUTE_DEFS){
  const path=from(route.coordinates),points=[];
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/2);for(let j=0;j<n;j++){const p=point(a,b,j/n);points.push([p.x,heightAt(p.x,p.z)+.095,p.z]);}}
  record.walkingRoutes.push({id:route.id,points,width:route.widthM});
 }
 record.walkSamples=record.walkingRoutes.flatMap(r=>r.points.map((p,i)=>({id:r.id+'-'+i,x:p[0],z:p[2]})));
 qa.east=record;stats.easternFeatures=features.length;stats.easternPlatforms=platforms.length;stats.mappedBuildings+=EAST_PLAN_FEATURES.ruins.length;
 return {qa:record,currentMasks:masks,vegetationExclusions:[ground.east.courtyard]};
}
