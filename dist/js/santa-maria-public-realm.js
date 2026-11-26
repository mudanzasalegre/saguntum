import * as THREE from 'three';
import {pointInPolygon} from './urban-surface.js';
import {createPavingTessellator} from './conforming-paving.js';

// The cadastral/OSM outlines remain the source geometry. Photographs describe
// the terrace sequence and the south portal's enclosure, not surveyed levels.
// These small architectural surfaces are separate from the unmodified IGN MDT.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
const rect=(x0,z0,x1,z1)=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}];
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
function clip(poly,axis,value,greater){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-value)*(greater?1:-1),db=(b[axis]-value)*(greater?1:-1);
  if(da>=-1e-9)out.push(a);
  if((da>=0)!==(db>=0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}
 }
 return out;
}
const strip=(p,a,b)=>clip(clip(p,'x',a,true),'x',b,false);

// Subtract convex architectural footprints from already tessellated paving.
// Interpolating all three coordinates preserves the common paving height field.
function halfPlane(poly,a,b,inside){
 const sign=inside?1:-1,side=p=>sign*((b.x-a.x)*(p[2]-a.z)-(b.z-a.z)*(p[0]-a.x)),out=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],dp=side(p),dq=side(q);
  if(dp>=-1e-9)out.push(p);
  if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);out.push(p.map((v,n)=>v+(q[n]-v)*t));}
 }
 return out;
}
function subtract(poly,outline){
 let remainder=poly;const result=[];
 for(let i=0;i<outline.length&&remainder.length>=3;i++){
  const a=outline[i],b=outline[(i+1)%outline.length],outside=halfPlane(remainder,a,b,false);
  if(outside.length>=3)result.push(outside);
  remainder=halfPlane(remainder,a,b,true);
 }
 return result;
}
function without(triangle,cuts){
 let polygons=[triangle];
 for(const cut of cuts)polygons=polygons.flatMap(p=>subtract(p,cut));
 const out=[];for(const p of polygons)for(let n=1;n<p.length-1;n++){
  const a=p[0],b=p[n],c=p[n+1];
  if(Math.abs((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]))>1e-9)out.push([a,b,c]);
 }
 return out;
}

export function createSantaMariaPublicRealm({frame,sourceSurfaces=[],project,heightAt}){
 const {base,yaw,toWorld:world,toLocal:local}=frame;
 const source=sourceSurfaces.find(s=>s.id==='santa-maria-cervantes'||String(s.sourceId)==='22922651');
 const plaza=(source?.coordinates||[]).map(c=>{const p=project(...c);return local(p.x,p.z);});
 if(plaza.length>1&&Math.hypot(plaza[0].x-plaza.at(-1).x,plaza[0].z-plaza.at(-1).z)<.01)plaza.pop();
 const worldPoly=p=>{const q=p.map(v=>world(v.x,v.z));return area(q)<0?q.reverse():q;};
 const geo=p=>{const q=world(p.x,p.z);return[-.278+q.x/(111320*Math.cos(39.679*Math.PI/180)),39.679-q.z/111320];};
 const threshold=base+.12,court=threshold-.60;
 // Cross-square stairs follow the four OSM access axes. Wide flights, landings,
 // their exact rises and the transition to the outer street are interpretive.
 const bands=[],flights=[];
 const terrace=(id,x0,x1,y)=>bands.push({id,x0,x1,y,kind:'terrace'});
 const flight=(id,x0,x1,left,right,count,sourceId)=>{
  const run=(x1-x0)/count;flights.push({id,x0,x1,left,right,count,run,sourceId});
  for(let i=0;i<count;i++)bands.push({id:id+'-'+i,x0:x0+i*run,x1:x0+(i+1)*run,y:left+(right-left)*(i+.5)/count,kind:'tread'});
 };
 terrace('cervantes-south-upper',-40,-23.49,threshold+.58);
 flight('cervantes-south-access',-23.49,-19.49,threshold+.58,threshold+.12,3,'1419209851');
 terrace('cervantes-south-terrace',-19.49,-9.54,threshold+.12);
 flight('cervantes-south-flight',-9.54,-8,threshold+.12,court,4,'1419209852');
 terrace('cervantes-central-court',-8,5.4,court);
 flight('cervantes-north-flight',5.4,7.30,court,court-1.08,6,'1419209853');
 terrace('cervantes-north-terrace',7.3,12,court-1.08);
 const northToe=world(14.14,-30.29),northLevel=Math.min(court-1.26,heightAt(northToe.x,northToe.z)+.105);
 flight('cervantes-north-access',12,14.14,court-1.08,northLevel,Math.max(1,Math.ceil((court-1.08-northLevel)/.19)),'1419209850');
 terrace('cervantes-street-return',14.14,40,northLevel);
 const connector=rect(11.72,-31.65,14.18,-28.88),connectorWorld=worldPoly(connector);
 const south=[{x:-21.96,z:-3.05},{x:-23.50,z:-3.05},{x:-24.8,z:-2.4},{x:-25.25,z:-1.15},{x:-25.25,z:1.85},{x:-24.8,z:3.1},{x:-23.5,z:3.75},{x:-21.96,z:3.75}],southWorld=worldPoly(south);
 const cuts=[southWorld,...(plaza.length?[connectorWorld]:[])],patches=[],exclusions=[southWorld],components=[];
 const appendPatch=(id,p,y)=>{if(p.length>=3&&Math.abs(area(p))>.001)patches.push({id,polygon:worldPoly(p),height:y-.12,margin:.06,mode:'lower-only',priority:20});};
 if(plaza.length){
  for(const band of bands){const p=strip(plaza,band.x0,band.x1);appendPatch('santa-maria-'+band.id,p,band.y);}
  for(const band of bands){const p=strip(connector,band.x0,band.x1);appendPatch('santa-maria-connector-'+band.id,p,band.y);}
  exclusions.push(connectorWorld);
  for(const f of flights)components.push({id:f.id,coordinates:rect(f.x0,-36.8,f.x1,-28.15).map(geo),kind:'stairs',period:'contemporary',interpretive:true,sourceId:f.sourceId});
  components.push({id:'cervantes-west-threshold',coordinates:rect(-4.2,-30.4,2,-27.62).map(geo),kind:'stairs',period:'interpretation',interpretive:true});
 }
 appendPatch('santa-maria-mediodia-platform',south,threshold);
 components.push({id:'mediodia-stone-enclosure',coordinates:south.map(geo),kind:'platform',period:'mixed',interpretive:true});
 components.push({id:'mediodia-cross',coordinates:rect(-25.18,.01,-24.50,.69).map(geo),kind:'cross',period:'mixed',interpretive:true});
 const qa={
  westernSquare:{sourceWay:'22922651',sourceOutlinePreserved:true,terraces:4,flights:flights.map(f=>({...f,rise:Math.abs(f.left-f.right)})),threshold,centralCourt: court,thresholdTreads:4,levelPolicy:'Door threshold shared with the church; relative terraces and step dimensions interpreted from photographs and OSM stair axes. Outer paving returns to the rendered ground; no new survey elevations are claimed.'},
  southEnclosure:{threshold,footprint:southWorld,crossLocal:[-24.84,.35],crossHeightM:2.43,benchHeightAboveThresholdM:.46,entryGaps:2,source:'User photographs; Joanbanjo, Creu i portada sud, 2011',interpretiveDimensions:true},
  pavingOwnership:'Source square replaced once; the connector and south enclosure are subtracted from adjoining paving before rendering.',
  limitations:['Las cotas, anchuras de los tramos, mobiliario y proporciones de los elementos menores se interpretan a partir de las fotografías; no constituyen un levantamiento topográfico.']
 };
 function build({Batch,resources,textures,ground,add}){
  const wp=(x,y,z)=>{const p=world(x,z);return[p.x,y,p.z];};
  const box=(b,k,x,y,z,w,h,d,tint,angle=0)=>{const p=world(x,z);b.box(k,p.x,y,p.z,w,h,d,yaw+angle,tint);};
  const beam=(b,k,a,c,width,depth,tint)=>{
   const A=new THREE.Vector3(...wp(...a)),C=new THREE.Vector3(...wp(...c)),v=C.clone().sub(A),length=v.length();
   if(length<1e-5)return;
   const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()),middle=A.add(C).multiplyScalar(.5),points=[];
   for(const y of[-length/2,length/2])for(const z of[-depth/2,depth/2])for(const x of[-width/2,width/2])points.push(new THREE.Vector3(x,y,z).applyQuaternion(q).add(middle).toArray());
   for(const face of[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])b.quad(k,...face.map(i=>points[i]),tint);
  };
  const polygonFloor=(b,p,y,bottom,tint,topCuts=[])=>{
   const ix=THREE.ShapeUtils.triangulateShape(p.map(v=>new THREE.Vector2(v.x,-v.z)),[]);
   for(const t of ix)for(const triangle of without(t.map(i=>wp(p[i].x,y,p[i].z)),topCuts))b.triangle('stone',...triangle,tint);
   for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length];b.quad('stone',wp(a.x,bottom,a.z),wp(c.x,bottom,c.z),wp(c.x,y,c.z),wp(a.x,y,a.z),tint);}
  };
  // The temple already owns the small doorway threshold. Subtract it from
  // the forecourt's top face, instead of stacking two coplanar stone floors.
  const southBatch=new Batch();polygonFloor(southBatch,south,threshold,base-.85,'#c2bba9',[worldPoly(rect(-22.5,-1.75,-21.5,2.45))]);
  // An open-backed, faceted stone seat surrounds the forecourt. The two side
  // gaps give access to the threshold; this is not a solid obstruction at the door.
  const bench=[{x:-22.83,z:-3.05},...south.slice(1,7),{x:-22.83,z:3.75}];
  const offsetBench=width=>bench.map((p,i)=>{
   const a=bench[Math.max(0,i-1)],c=bench[Math.min(bench.length-1,i+1)],normal=(a,b)=>{const l=Math.hypot(b.x-a.x,b.z-a.z);return{x:-(b.z-a.z)/l,z:(b.x-a.x)/l};};
   const n0=normal(i?a:p,i?p:c),n1=normal(i<bench.length-1?p:a,i<bench.length-1?c:p),nx=n0.x+n1.x,nz=n0.z+n1.z,f=width/(nx*n1.x+nz*n1.z);
   return{x:p.x+nx*f,z:p.z+nz*f};
  });
  const ribbon=(width,y0,y1,tint)=>{
   const outer=offsetBench(width/2),inner=offsetBench(-width/2);
   for(let i=1;i<bench.length;i++){
    const a=outer[i-1],c=outer[i],d=inner[i],e=inner[i-1];
    southBatch.quad('stone',wp(a.x,y1,a.z),wp(c.x,y1,c.z),wp(d.x,y1,d.z),wp(e.x,y1,e.z),tint);
    for(const [u,v]of[[a,c],[d,e]])southBatch.quad('stone',wp(u.x,y0,u.z),wp(v.x,y0,v.z),wp(v.x,y1,v.z),wp(u.x,y1,u.z),tint);
   }
   for(const i of[0,bench.length-1]){const a=outer[i],c=inner[i];southBatch.quad('stone',wp(a.x,y0,a.z),wp(c.x,y0,c.z),wp(c.x,y1,c.z),wp(a.x,y1,a.z),tint);}
  };
  ribbon(.47,threshold-.05,threshold+.37,'#b3aa95');ribbon(.57,threshold+.37,threshold+.46,'#d2c9b7');
  const cx=-24.84,cz=.35;
  box(southBatch,'stone',cx,threshold+.10,cz,.84,.20,.84,'#a8a798');
  box(southBatch,'stone',cx,threshold+.245,cz,.66,.09,.66,'#c1c1b5');
  const shaft=[{y:threshold+.29,r:.29},{y:threshold+.48,r:.23},{y:threshold+1.51,r:.18},{y:threshold+1.57,r:.28},{y:threshold+1.68,r:.30}];
  for(let j=1;j<shaft.length;j++)for(let i=0;i<8;i++){
   const a=i*Math.PI/4+Math.PI/8,c=(i+1)*Math.PI/4+Math.PI/8,lo=shaft[j-1],hi=shaft[j];
   southBatch.quad('stone',wp(cx+Math.cos(a)*lo.r,lo.y,cz+Math.sin(a)*lo.r),wp(cx+Math.cos(c)*lo.r,lo.y,cz+Math.sin(c)*lo.r),wp(cx+Math.cos(c)*hi.r,hi.y,cz+Math.sin(c)*hi.r),wp(cx+Math.cos(a)*hi.r,hi.y,cz+Math.sin(a)*hi.r),i%2?'#b9bcb4':'#c6c9c1');
  }
  box(southBatch,'stone',cx,threshold+1.69,cz,.62,.10,.62,'#c2c6bf');
  box(southBatch,'stone',cx,threshold+2.08,cz,.19,.70,.19,'#ced2cc');
  box(southBatch,'stone',cx,threshold+2.16,cz,.19,.19,.72,'#ced2cc');
  for(const [x,z]of[[-22.7,-3.75],[-25.1,-3.15],[-26.0,-1.55],[-26,2.25],[-25.1,3.85],[-22.7,4.45]]){
   const p=world(x,z),y=ground(p.x,p.z)+.105;box(southBatch,'iron',x,y+.42,z,.085,.84,.085,'#3b4442');box(southBatch,'iron',x,y+.85,z,.11,.045,.11,'#4d5552');
  }
  add(southBatch.finish('Portada del Mediodía · recinto de piedra y cruz','santa-maria-atrio-sur','mixed',resources,textures));
  if(!plaza.length)return;
  const b=new Batch(),furniture=new Batch(),weight=z=>smooth((z+43)/9.5),functions=new Map();
  for(const band of bands)functions.set(band.id,(x,z)=>{const p=local(x,z),g=ground(x,z)+.105;return g+(band.y-g)*weight(p.z);});
  const sample=(fn,p)=>{
   const x0=Math.floor(p.x*2)/2,z0=Math.floor(p.z*2)/2,u=(p.x-x0)*2,v=(p.z-z0)*2,a=fn(x0,z0),c=fn(x0+.5,z0+.5);
   return v>=u?a+(c-fn(x0,z0+.5))*u+(fn(x0,z0+.5)-a)*v:a+(fn(x0+.5,z0)-a)*u+(c-fn(x0+.5,z0))*v;
  };
  const bandAt=x=>bands.find(v=>x>=v.x0-1e-8&&x<=v.x1+1e-8)||bands[0];
  const plazaHeight=(x,z)=>sample(functions.get(bandAt(x).id),world(x,z));
  const emitSurface=(poly,band,cutConnector)=>{
   if(poly.length<3||Math.abs(area(poly))<.00001)return;
   const tessellator=createPavingTessellator(functions.get(band.id),{offset:0});
   tessellator.triangulate(worldPoly(poly),[],(a,c,d)=>{
    for(const triangle of cutConnector?without([a,c,d],[connectorWorld]):[[a,c,d]])b.triangle('paving',...triangle,band.kind==='tread'?'#c8bfad':'#bfb8a7');
   });
  };
  for(const band of bands){emitSurface(strip(plaza,band.x0,band.x1),band,true);emitSurface(strip(connector,band.x0,band.x1),band,false);}
  // Split riser edges at the paving grid and its diagonals, so they meet the
  // real clipped top faces without a per-triangle lift or a hidden crack.
  const edgeSamples=(a,c)=>{
   const A=world(a.x,a.z),C=world(c.x,c.z),ts=[0,1];
   for(const [v,w]of[[A.x,C.x],[A.z,C.z],[A.x-A.z,C.x-C.z]])if(Math.abs(w-v)>1e-9)for(let n=Math.floor(Math.min(v,w)*2)+1;n<Math.max(v,w)*2;n++){const t=(n/2-v)/(w-v);if(t>1e-8&&t<1-1e-8)ts.push(t);}
   if(Math.abs(c.x-a.x)>1e-9)for(const band of bands)for(const x of[band.x0,band.x1]){const t=(x-a.x)/(c.x-a.x);if(t>1e-8&&t<1-1e-8)ts.push(t);}
   for(const poly of[plaza,connector])for(let i=0;i<poly.length;i++){
    const p=poly[i],q=poly[(i+1)%poly.length],dx=c.x-a.x,dz=c.z-a.z,ex=q.x-p.x,ez=q.z-p.z,den=dx*ez-dz*ex;if(Math.abs(den)<1e-10)continue;
    const t=((p.x-a.x)*ez-(p.z-a.z)*ex)/den,u=((p.x-a.x)*dz-(p.z-a.z)*dx)/den;
    if(t>1e-8&&t<1-1e-8&&u>=-1e-8&&u<=1+1e-8)ts.push(t);
   }
   return [...new Set(ts.map(t=>+t.toFixed(10)))].sort((x,y)=>x-y).map(t=>({x:a.x+(c.x-a.x)*t,z:a.z+(c.z-a.z)*t}));
  };
  for(let i=1;i<bands.length;i++){
   const left=bands[i-1],right=bands[i],x=right.x0;
   const spans=[];
   for(const poly of[plaza,connector]){
    const zs=[];for(let j=0;j<poly.length;j++){const a=poly[j],c=poly[(j+1)%poly.length];if((a.x<=x&&c.x>x)||(c.x<=x&&a.x>x))zs.push(a.z+(c.z-a.z)*(x-a.x)/(c.x-a.x));}
    zs.sort((a,c)=>a-c);for(let j=0;j+1<zs.length;j+=2)spans.push([zs[j],zs[j+1]]);
   }
   const merged=[];for(const span of spans.sort((a,c)=>a[0]-c[0])){const previous=merged.at(-1);if(previous&&span[0]<=previous[1]+1e-8)previous[1]=Math.max(previous[1],span[1]);else merged.push([...span]);}
   for(const [z0,z1]of merged){const ps=edgeSamples({x,z:z0},{x,z:z1});for(let j=1;j<ps.length;j++){
    const a=ps[j-1],c=ps[j];
    const pa=world(a.x,a.z),pc=world(c.x,c.z),lf=functions.get(left.id),rf=functions.get(right.id);
    b.quad('stone',wp(x,sample(lf,pa),a.z),wp(x,sample(lf,pc),c.z),wp(x,sample(rf,pc),c.z),wp(x,sample(rf,pa),a.z),'#b1a78f');
   }}
  }
  // Close exposed perimeter faces; the square does not float over the MDT.
  for(const [index,poly]of [plaza,connector].entries())for(let i=0;i<poly.length;i++){
   const ps=edgeSamples(poly[i],poly[(i+1)%poly.length]);for(let j=1;j<ps.length;j++){
    const a=ps[j-1],c=ps[j],middle={x:(a.x+c.x)/2,z:(a.z+c.z)/2};if(pointInPolygon(middle.x,middle.z,index?plaza:connector))continue;
    const p=world(a.x,a.z),q=world(c.x,c.z),fn=functions.get(bandAt(middle.x).id),y0=sample(fn,p),y1=sample(fn,q);
    b.quad('stone',wp(a.x,Math.min(y0-.22,ground(p.x,p.z)-.4),a.z),wp(c.x,Math.min(y1-.22,ground(q.x,q.z)-.4),c.z),wp(c.x,y1,c.z),wp(a.x,y0,a.z),'#afa58d');
   }
  }
  // Four shallow threshold risers, independently recognisable from the plaza's
  // transverse flights, as in the supplied photographs and Cabrera's plan.
  for(let i=0;i<4;i++){
   const y=court+(threshold-court)*(i+1)/4,z=-30.4+i*.36;
   box(b,'stone',-1.1,(base-1+y)/2,z+.18,6.2, y-(base-1),.36,'#c6bba5');
  }
  const churchFootprint=frame.footprintLocal||[],floorTriangles=THREE.ShapeUtils.triangulateShape(churchFootprint.map(p=>new THREE.Vector2(p.x,-p.z)),[]).map(t=>worldPoly(t.map(i=>churchFootprint[i])));
  polygonFloor(b,rect(-4.2,-28.96,2,-27.62),threshold,base-1,'#cdc2ad',floorTriangles);
  const rail=(a,c)=>{
   const count=Math.max(1,Math.ceil(Math.hypot(c.x-a.x,c.z-a.z)/1.5)),tops=[];
   for(let i=0;i<=count;i++){const t=i/count,x=a.x+(c.x-a.x)*t,z=a.z+(c.z-a.z)*t,y=plazaHeight(x,z);box(furniture,'iron',x,y+.46,z,.045,.92,.045,'#3b4644');tops.push([x,y+.94,z]);}
   for(let i=1;i<tops.length;i++)beam(furniture,'iron',tops[i-1],tops[i],.05,.05,'#3b4644');
  };
  rail({x:-9.78,z:-28.45},{x:-9.78,z:-36.4});rail({x:7.52,z:-28.45},{x:7.52,z:-35.5});
  function benchAt(x,z){const y=plazaHeight(x,z);
   for(const dx of[-.74,.74]){box(furniture,'iron',x+dx,y+.25,z,.07,.50,.48,'#424b47');box(furniture,'iron',x+dx,y+.68,z+.20,.06,.68,.06,'#424b47');}
   for(let j=0;j<4;j++)box(furniture,'wood',x,y+.48,z-.21+j*.14,1.95,.065,.11,'#81705a');
   for(let j=0;j<3;j++)box(furniture,'wood',x,y+.68+j*.14,z+.24,1.95,.11,.065,'#81705a');
  }
  benchAt(9.45,-29.15);benchAt(-15.1,-28.85);benchAt(-17.4,-35.4);
  add(b.finish('Plaça dels Tarongers · terrazas y escaleras de Cervantes','santa-maria-cervantes','mixed',resources,textures));
  add(furniture.finish('Plaza occidental · bancos y pasamanos','santa-maria-cervantes','contemporary',resources,textures));
 }
 return {patches,exclusions,components,qa,build,clipPaving:(a,b,c)=>without([a,b,c],cuts),replacedSurfaceIds:new Set(source?[source.id]:[]),replacedRoadIds:new Set(plaza.length?flights.map(f=>f.sourceId):[]),selectionAliases:{'santa-maria-portada-principal':'santa-maria-cervantes','santa-maria-portada-sur':'santa-maria-atrio-sur'}};
}
