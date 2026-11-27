// Current Almenara remains, retaining their mapped footprints. Civera (ARSE
// 41, 2007, pp.174–175), PNOA and dated photographs constrain the reading.
// Height profiles and the association of OSM features with historical names
// are interpretive; no intact medieval tower or new tiled roof is restored.
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const length=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const clamp=v=>Math.max(0,Math.min(1,v));
const quad=(out,a,b,c,d)=>out.push(...a,...b,...c,...a,...c,...d);

export function buildEastStandingRemains({THREE,batch,key,features,project,heightAt,ground,section,flatFloor,inset,record,detail}){
 const clean=poly=>length(poly[0],poly.at(-1))<.01?poly.slice(0,-1):poly;
 const center=poly=>poly.reduce((s,p)=>({x:s.x+p.x/poly.length,z:s.z+p.z/poly.length}),{x:0,z:0});
 function pierced(a,b,{id,floor,crown,thickness=.68,openings=[]}){
  const l=length(a,b),shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(l,0);
  const count=Math.ceil(l/.42);
  for(let i=count;i>=0;i--){const t=i/count;shape.lineTo(l*t,typeof crown==='function'?crown(t):crown);}
  shape.closePath();
  for(const h of openings){
   const path=new THREE.Path(),x=h.at*l,r=h.width/2,bottom=h.sill||.02,spring=h.spring;
   path.moveTo(x-r,bottom);path.lineTo(x+r,bottom);path.lineTo(x+r,spring);
   for(let i=1;i<=24;i++){const angle=i*Math.PI/24;path.lineTo(x+Math.cos(angle)*r,spring+Math.sin(angle)*(h.rise||r)+Math.sin(angle*7)*.027);}
   path.lineTo(x-r,bottom);path.closePath();shape.holes.push(path);
   record.openings.push({building:id,kind:'interpretive-internal-arch',center:[a.x+(b.x-a.x)*h.at,floor+(spring+(h.rise||r)+bottom)/2,a.z+(b.z-a.z)*h.at],width:h.width,height:spring+(h.rise||r)-bottom,physical:true,photographicEstimate:false,interpretive:true,source:'Civera 2007, approximate association with the mapped shell'});
  }
  const dx=(b.x-a.x)/l,dz=(b.z-a.z)/l,nx=-dz,nz=dx,
   matrix=new THREE.Matrix4().set(dx,0,nx,a.x-nx*thickness/2,0,1,0,floor-.10,dz,0,nz,a.z-nz*thickness/2,0,0,0,1),
   g=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,curveSegments:24,steps:1});
  batch.geometry(key(id,'east-masonry'),g,matrix,.93);g.dispose();

 }
 for(const f of features.filter(f=>f.kind!=='open-deposit')){
  const poly=clean(f.coordinates.map(c=>project(...c))),p=center(poly),floor=ground.east.plane(p.x,p.z)+.11,inner=inset(poly,.48);
  flatFloor(inner,floor,f.id+'-floor','east-earth',.95);
  if(f.osmId==='733215260'){
   // Long northern retaining face and lower L-shaped southern returns are
   // legible in the current orthophoto. Function remains deliberately unnamed.
   for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],high=i===1?2.20:i===2?1.15:i===0?1.45:.62;
    const crown=q=>floor+high+Math.sin(length(a,q)*1.1+.4)*.12;
    if(i===3){
     section(a,mix(a,b,.40),{id:f.id,top:crown,bottom:floor-.25,thickness:.69,broken:true,seed:203});
     section(mix(a,b,.50),b,{id:f.id,top:crown,bottom:floor-.25,thickness:.69,broken:true,seed:204});
    }else section(a,b,{id:f.id,top:crown,bottom:q=>Math.min(floor-.25,heightAt(q.x,q.z)-.18),thickness:i===1?.88:.67,broken:true,seed:60+i});
    if(i===1)section(inner[i],inner[(i+1)%inner.length],{id:f.id,top:floor+high-.22,bottom:floor+.04,thickness:.025,kind:'east-render',broken:true,tint:.91});
   }
   record.ruins.push({id:f.id,polygon:poly,floorY:floor,roof:false,functionAssigned:false,profile:'high northern face, low L-shaped returns and interrupted front',source:'mapped current footprint and PNOA; elevations interpretive'});
  }else if(f.osmId==='733215261'){
   // Later openings in a reused cistern are described by Civera, but their
   // exact correspondence to this mapped shell is not established. Retain
   // interrupted walls rather than borrowing windows from the SE curtain.
   const a=poly[3],b=poly[2],left=mix(a,b,.42),right=mix(a,b,.58);
   section(a,left,{id:f.id,bottom:floor-.20,top:q=>floor+1.60+.12*Math.sin(length(a,q)*1.7),thickness:.77,broken:true,seed:811});
   section(right,b,{id:f.id,bottom:floor-.20,top:q=>floor+1.30+.16*Math.sin(length(a,q)*1.3),thickness:.77,broken:true,seed:812});
   section(left,right,{id:f.id,bottom:floor-.20,top:floor+.16,thickness:.74,broken:true,seed:813});
   section(poly[1],poly[0],{id:f.id,bottom:floor-.20,top:q=>floor+1.92+.12*Math.sin(length(poly[1],q)*.9),thickness:.80,broken:true,seed:814});
   for(const [i,j,high]of [[0,3,1.42],[2,1,.94]])
    section(poly[i],poly[j],{id:f.id,bottom:floor-.2,top:q=>floor+high+.15*Math.sin(q.x*.8),thickness:.72,broken:true,seed:i+633});
   const liningA=inner[1],liningB=inner[0];
   section(liningA,liningB,{id:f.id,bottom:floor+.05,top:floor+1.56,thickness:.025,kind:'east-render',broken:true,tint:.91});
   record.ruins.push({id:f.id,polygon:poly,floorY:floor,roof:false,functionAssigned:false,probableAssociation:'cistern beneath Torre Quadrada / Colomer, Civera no.8; identification not established',profile:'unequal masonry returns, broken front and interior lining; no copied pair of SE-curtain windows',source:'current mapped footprint; comparative Civera description, elevations approximate'});
  }else if(f.osmId==='733215262'){
   // Adjoining two-body ruin, without copying the high SE curtain profile
   // into this footprint. The documented lost covering is not reinstated.
   section(poly[0],poly[1],{id:f.id,bottom:floor-.22,top:q=>floor+1.64+.18*Math.sin(length(poly[0],q)*1.2),thickness:.77,broken:true,seed:831});
   section(poly[1],poly[2],{id:f.id,bottom:floor-.22,top:q=>floor+1.77+.17*Math.sin(length(poly[1],q)*.8),thickness:.73,broken:true,seed:732});
   section(poly[2],poly[3],{id:f.id,bottom:floor-.22,top:floor+1.10,thickness:.66,broken:true,seed:832});
   for(let i=3;i<poly.length;i++)section(poly[i],poly[(i+1)%poly.length],{id:f.id,bottom:floor-.22,top:floor+(i===4?.72:1.42),thickness:.68,broken:true,seed:752+i});
   const a=mix(poly[1],poly[2],.64),b=mix(poly[0],poly[4],.64);
   pierced(a,b,{id:f.id,floor,crown:t=>1.91+.14*Math.sin(t*9),thickness:.56,
    openings:[{at:.52,width:1.35,sill:.02,spring:.91,rise:.58}]});
   record.ruins.push({id:f.id,polygon:poly,floorY:floor,roof:false,functionAssigned:false,probableAssociation:'adjoining cistern described by Civera no.9, northwest of the tower; current footprint association approximate',profile:'two unequal open bodies and a modest interpretive internal arch; no gable or restored roof',source:'Civera 2007 p174, approximate association with mapped shell; not a photogrammetric reconstruction'});
  }
 }
}
