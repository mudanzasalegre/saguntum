// Existing fabric outside Almenara, v55. This is shared by Atlas and Simulator.
// OSM/PNOA establish the horizontal traces; photographs establish the character
// of the surviving masonry. Relative heights and small details are estimates.
import {EAST_EXTERIOR_FEATURES} from './castle-east-exterior-layout.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const v=Math.sin(n*91.37+51.2)*43758.5453;return v-Math.floor(v);};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const quad=(out,a,b,c,d)=>out.push(...a,...b,...c,...a,...c,...d);

export function buildEastExterior({THREE,batch,keyFor,project,heightAt,ground,qa,stats,detail='full'}){
 const byId=Object.fromEntries(EAST_EXTERIOR_FEATURES.map(f=>[f.id,f]));
 const record={features:EAST_EXTERIOR_FEATURES.map(f=>({...f})),walls:[],wallBases:[],openings:[],towers:[],bunkers:[],
  method:'Current exterior traces from OSM checked on IGN PNOA; northern round projection and recessed arch from Ricsol 26; stepped standing eastern wall from Ricsol 5–7; machine-gun remains from municipal plan 02B (2020) and Balanzà field sketch (2022), reproduced in CASVA 7 p.10. Heights and small profiles are interpretive. Source terrain is retained.'};
 const masks=[],vegetationExclusions=[];
 const key=(id,kind='east-masonry')=>keyFor('almenara',id,byId[id]?.period||'unknown',kind);
 const from=f=>f.coordinates.map(c=>project(...c));
 const clean=ps=>ps.length>2&&Math.hypot(ps[0].x-ps.at(-1).x,ps[0].z-ps.at(-1).z)<.001?ps.slice(0,-1):ps;
 const center=ps=>ps.reduce((s,p)=>({x:s.x+p.x/ps.length,z:s.z+p.z/ps.length}),{x:0,z:0});
 const shift=(p,n,d)=>({x:p.x+n.x*d,z:p.z+n.z*d});
 function axes(a,b){const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);return{l,u:{x:dx/l,z:dz/l},n:{x:-dz/l,z:dx/l},yaw:-Math.atan2(dz,dx)};}
 function floor(poly,y,id,kind='east-masonry',tint=1){
  const tris=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(p.x,p.z)),[]),out=[];
  for(const ids of tris){const [a,b,c]=ids.map(i=>poly[i]),cross=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);for(const p of cross>0?[a,c,b]:[a,b,c])out.push(p.x,y,p.z);}
  batch.raw(key(id,kind),out,tint);
 }
 function section(a,b,{id,top,thickness=.75,bottom,kind='east-masonry',broken=false,tint=1,seed=1,contact=true}={}){
  const {l,n}=axes(a,b);if(l<.01)return;
  const count=Math.max(1,Math.ceil(l/.8));
  const foot=p=>typeof bottom==='function'?bottom(p):Number.isFinite(bottom)?bottom:Math.min(heightAt(p.x,p.z),heightAt(p.x+n.x*(thickness*.55+.15),p.z+n.z*(thickness*.55+.15)),heightAt(p.x-n.x*(thickness*.55+.15),p.z-n.z*(thickness*.55+.15)))-.38;
  const crown=(p,t)=>{const y=typeof top==='function'?top(p):top;return y+(broken?Math.sin(t*13+seed)*.045+noise(Math.round(t*count)+seed)*.065:0);};
  for(let j=0;j<count;j++){
   const p=mix(a,b,j/count),q=mix(a,b,(j+1)/count),lo=[foot(p),foot(q)],hi=[crown(p,j/count),crown(q,(j+1)/count)];
   // A source terrain triangle can dip between end stations at a cliff edge.
   // The buried toe follows the lowest sampled ground across each short bay;
   // this changes foundations only, never the visible crown or the terrain.
   if(contact&&bottom===undefined){
    const buried=Math.min(...[0,.25,.5,.75,1].map(t=>foot(mix(p,q,t))));lo[0]=buried;lo[1]=buried;
   }
   for(let k=0;k<2;k++)hi[k]=Math.max(lo[k]+.055,hi[k]);
   const v=[],c=(p,y,s,base=false)=>[p.x+n.x*s*thickness*(base?.55:.5),y,p.z+n.z*s*thickness*(base?.55:.5)];
   quad(v,c(p,lo[0],1,true),c(q,lo[1],1,true),c(q,hi[1],1),c(p,hi[0],1));
   quad(v,c(q,lo[1],-1,true),c(p,lo[0],-1,true),c(p,hi[0],-1),c(q,hi[1],-1));
   quad(v,c(p,hi[0],-1),c(p,hi[0],1),c(q,hi[1],1),c(q,hi[1],-1));
   if(j===0)quad(v,c(p,lo[0],-1,true),c(p,lo[0],1,true),c(p,hi[0],1),c(p,hi[0],-1));
   if(j===count-1)quad(v,c(q,lo[1],1,true),c(q,lo[1],-1,true),c(q,hi[1],-1),c(q,hi[1],1));
   batch.raw(key(id,kind),v,tint*(.95+noise(seed*31+j)*.07));
   if(contact)record.wallBases.push({id,x:p.x,z:p.z,baseY:lo[0],terrainY:heightAt(p.x,p.z),topY:hi[0]});
   if(contact&&j===count-1)record.wallBases.push({id,x:q.x,z:q.z,baseY:lo[1],terrainY:heightAt(q.x,q.z),topY:hi[1]});
  }
 }
 function merlons(a,b,top,{id,width=.75,height=.95,spacing=1.8,thickness=.67,perforated=false}={}){
  const {l,u,yaw}=axes(a,b),count=Math.floor(l/spacing);if(count<1)return 0;
  for(let j=0;j<count;j++){
   const p=mix(a,b,(j+.5)/count),w=Math.min(width,l/count*.7),base=top-.025;
   if(perforated){
    const slit=.14,side=(w-slit)/2;
    for(const sign of[-1,1])batch.box(key(id,'east-render'),p.x+u.x*sign*(slit+side)/2,base+height/2,p.z+u.z*sign*(slit+side)/2,side,height,thickness,yaw,.96);
    batch.box(key(id,'east-render'),p.x,base+.18,p.z,slit,.36,thickness,yaw,.97);
    batch.box(key(id,'east-render'),p.x,base+height-.17,p.z,slit,.34,thickness,yaw,.97);
   }else batch.box(key(id,'east-render'),p.x,base+height/2,p.z,w,height,thickness,yaw,.92+noise(j+top)*.07);
   batch.box(key(id,'worn-ashlar'),p.x,base+height+.02,p.z,w+.025,.04,thickness+.02,yaw,.88);
  }
  return count;
 }

 // Continuous mapped junction: no radial exclusion or isolated half-cylinder.
 // A closed masonry projection follows the mapped curve and returns to both
 // adjoining curtains; the top is surviving masonry, not an invented roof.
 {
  const f=byId['north-round-tower'],control=clean(from(f)),poly=[];
  for(let i=0;i<control.length-1;i++){
   const p0=control[Math.max(0,i-1)],p1=control[i],p2=control[i+1],p3=control[Math.min(control.length-1,i+2)];
   const count=i===0?3:5;
   for(let j=0;j<count;j++){
    const t=j/count,t2=t*t,t3=t2*t;
    const cat=k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
    poly.push({x:cat('x'),z:cat('z')});
   }
  }
  poly.push(control.at(-1));
  const p=center(control),top=ground.east.plane(p.x,p.z)+f.heightAboveEasternPlaneM;
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],v=[],loA=heightAt(a.x,a.z)-.65,loB=heightAt(b.x,b.z)-.65;
   // The footprint is counterclockwise in x,z, so the right face is exterior.
   const area=poly.reduce((s,q,k)=>s+q.x*poly[(k+1)%poly.length].z-poly[(k+1)%poly.length].x*q.z,0);
   if(area>0)quad(v,[b.x,loB,b.z],[a.x,loA,a.z],[a.x,top,a.z],[b.x,top,b.z]);
   else quad(v,[a.x,loA,a.z],[b.x,loB,b.z],[b.x,top,b.z],[a.x,top,a.z]);
   batch.raw(key(f.id),v,.96);
   record.wallBases.push({id:f.id,x:a.x,z:a.z,baseY:loA,terrainY:heightAt(a.x,a.z),topY:top});
  }
  floor(poly,top,f.id,'east-masonry',.88);
  record.towers.push({id:f.id,polygon:poly,topY:top,joinedEnds:[control[0],control.at(-1)],closedMass:true,roof:false,heightEstimateM:f.heightAboveEasternPlaneM});
  vegetationExclusions.push(poly);
 }
 {
  const f=byId['north-tower-joining-curtain'],ps=from(f),a=ps[0],b=ps.at(-1),ax=axes(a,b),{u,n,l,yaw}=ax,
   def=byId['north-arched-recess'],c0=project(...def.coordinates[0]),t=clamp(((c0.x-a.x)*u.x+(c0.z-a.z)*u.z)/l,0,1),c=mix(a,b,t),
   half=def.widthM/2,thick=1.25,jamb=.18,left={x:c.x-u.x*(half+jamb),z:c.z-u.z*(half+jamb)},right={x:c.x+u.x*(half+jamb),z:c.z+u.z*(half+jamb)},
   top=ground.east.plane(c.x,c.z)+f.parapetAboveEasternPlaneM,
   exterior=shift(c,n,thick*.5+.34),sill=heightAt(exterior.x,exterior.z)+.065,
   spring=sill+def.springHeightM,front=thick*.5,back=front-def.depthM;
  section(a,left,{id:f.id,top,thickness:thick,seed:51});section(right,b,{id:f.id,top,thickness:thick,seed:52});
  // Closed rear of the recess. No fictional entrance through the fortification.
  const o1={x:c.x-u.x*(half+jamb),z:c.z-u.z*(half+jamb)},o2={x:c.x+u.x*(half+jamb),z:c.z+u.z*(half+jamb)},
   backThickness=thick-def.depthM;
  section(shift(o1,n,-def.depthM/2),shift(o2,n,-def.depthM/2),{id:f.id,top,thickness:backThickness,seed:53});
  const p=(s,y,v)=>[c.x+u.x*s+n.x*v,y,c.z+u.z*s+n.z*v],curve=s=>spring+def.riseM*Math.sqrt(Math.max(0,1-(s/half)**2)),head=[],dark=[],rim=[];
  const pieces=20;
  for(let j=0;j<pieces;j++){
   const s0=-half+def.widthM*j/pieces,s1=-half+def.widthM*(j+1)/pieces,h0=curve(s0),h1=curve(s1);
   quad(head,p(s0,h0+.18,front),p(s1,h1+.18,front),p(s1,top,front),p(s0,top,front));
   quad(head,p(s1,h1+.18,back),p(s0,h0+.18,back),p(s0,top,back),p(s1,top,back));
   quad(head,p(s0,h0+.18,back),p(s1,h1+.18,back),p(s1,h1+.18,front),p(s0,h0+.18,front));
   quad(dark,p(s0,sill,back+.012),p(s1,sill,back+.012),p(s1,h1,back+.012),p(s0,h0,back+.012));
   quad(rim,p(s0,h0,front+.018),p(s1,h1,front+.018),p(s1,h1+.18,front+.018),p(s0,h0+.18,front+.018));
   quad(rim,p(s0,h0,back),p(s1,h1,back),p(s1,h1,front+.018),p(s0,h0,front+.018));
  }
  batch.raw(key(f.id),head,.98);batch.raw(key(def.id,'east-recess'),dark,.90);batch.raw(key(def.id,'gate-brick'),rim,.9);
  // Individual jamb courses and thin radial joints retain the small arch scale.
  for(const sign of[-1,1]){
   const s=sign*(half+jamb/2),q=shift({x:c.x+u.x*s,z:c.z+u.z*s},n,front-def.depthM/2);
   const h=def.springHeightM+def.riseM+.18;
   batch.box(key(def.id,'gate-brick'),q.x,sill+h/2,q.z,jamb,h,def.depthM+.02,yaw,.93);
   const ja={x:q.x-u.x*jamb/2,z:q.z-u.z*jamb/2},jb={x:q.x+u.x*jamb/2,z:q.z+u.z*jamb/2};
   section(ja,jb,{id:f.id,top,bottom:sill+h,thickness:def.depthM,contact:false,seed:55+sign});
   if(detail==='full')for(let j=1;j<8;j++){
    const v=shift({x:c.x+u.x*s,z:c.z+u.z*s},n,front+.029);
    batch.box(key(def.id,'mortar'),v.x,sill+j*h/8,v.z,jamb+.01,.012,.012,yaw,.75);
   }
  }
  // Masonry below the shallow threshold joins the natural exterior footing.
  section(o1,o2,{id:f.id,top:sill-.015,thickness:thick,seed:54});
  const sillCenter=shift(c,n,front-def.depthM*.5);batch.box(key(def.id,'worn-ashlar'),sillCenter.x,sill-.035,sillCenter.z,def.widthM+.08,.08,def.depthM+.05,yaw,.88);
  merlons(a,b,top,{id:f.id,width:1.06,height:f.merlonHeightM,spacing:1.85,thickness:.68,perforated:true});
  record.openings.push({id:def.id,center:c,normal:n,width:def.widthM,sillY:sill,springY:spring,crownY:spring+def.riseM,depth:def.depthM,blocked:true,walkable:false,backMaterialCertain:false});
  record.walls.push({id:f.id,path:ps,topY:top,thickness:thick,joined:true});
 }

 // Small roofless concrete chamber. Its hollow interior cannot turn into the
 // previous eleven-metre generic city block. The long sketched access is not
 // extended into unregistered terrain; the chamber retains a short rear gap.
 {
  const f=byId['daoiz-machine-gun-remains'],poly=clean(from(f)),p=center(poly),ys=poly.map(q=>heightAt(q.x,q.z)).sort((a,b)=>a-b),
   floorY=ys[Math.floor(ys.length/2)]-.42,top=floorY+f.estimatedWallHeightM;
  const area=poly.reduce((s,q,i)=>s+q.x*poly[(i+1)%poly.length].z-poly[(i+1)%poly.length].x*q.z,0),sign=Math.sign(area);
  const edges=poly.map((a,i)=>{const b=poly[(i+1)%poly.length],ax=axes(a,b);return{...ax,p:shift(a,ax.n,sign*f.wallThicknessM*.52)};});
  const inner=edges.map((b,i)=>{const a=edges[(i+edges.length-1)%edges.length],det=a.u.x*b.u.z-a.u.z*b.u.x;if(Math.abs(det)<1e-6)return b.p;const t=((b.p.x-a.p.x)*b.u.z-(b.p.z-a.p.z)*b.u.x)/det;return{x:a.p.x+a.u.x*t,z:a.p.z+a.u.z*t};});
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],ai=inner[i],bi=inner[(i+1)%poly.length],{l}=axes(a,b),gap=f.entryWidthM/l,
    spans=i===f.entryEdge?[[0,.5-gap/2],[.5+gap/2,1]]:[[0,1]];
   for(const[lo,hi]of spans){
    const count=Math.max(1,Math.ceil(l*(hi-lo)/.32));
    for(let j=0;j<count;j++){
     const t0=lo+(hi-lo)*j/count,t1=lo+(hi-lo)*(j+1)/count,oa=mix(a,b,t0),ob=mix(a,b,t1),ia=mix(ai,bi,t0),ib=mix(ai,bi,t1),
      h0=top-.12*noise(i*17+Math.round(t0*41)),h1=top-.12*noise(i*17+Math.round(t1*41)),
      foundation=Math.min(floorY-.25,...[0,.5,1].map(t=>{const q=mix(oa,ob,t);return heightAt(q.x,q.z)-.55;})),baseA=foundation,baseB=foundation,v=[];
     const outerFace=[[oa.x,baseA,oa.z],[ob.x,baseB,ob.z],[ob.x,h1,ob.z],[oa.x,h0,oa.z]],
      innerFace=[[ib.x,floorY,ib.z],[ia.x,floorY,ia.z],[ia.x,h0-.04,ia.z],[ib.x,h1-.04,ib.z]];
     if(sign>0){outerFace.reverse();innerFace.reverse();}
     quad(v,...outerFace);quad(v,...innerFace);
     const cap=[[oa.x,h0,oa.z],[ia.x,h0-.04,ia.z],[ib.x,h1-.04,ib.z],[ob.x,h1,ob.z]];if(sign<0)cap.reverse();quad(v,...cap);
     if(j===0){const end=[[ia.x,floorY,ia.z],[oa.x,baseA,oa.z],[oa.x,h0,oa.z],[ia.x,h0-.04,ia.z]];if(sign>0)end.reverse();quad(v,...end);}
     if(j===count-1){const end=[[ob.x,baseB,ob.z],[ib.x,floorY,ib.z],[ib.x,h1-.04,ib.z],[ob.x,h1,ob.z]];if(sign>0)end.reverse();quad(v,...end);}
     batch.raw(key(f.id,'east-concrete'),v,.90+noise(j+i*13)*.1);
     for(const[q,baseY]of[[oa,baseA],[ob,baseB]])record.wallBases.push({id:f.id,x:q.x,z:q.z,baseY,terrainY:heightAt(q.x,q.z),topY:top});
    }
   }
  }
  floor(inner,floorY+.02,f.id,'east-earth',.79);
  // Join the small rear opening to the exterior earth. The terrain subtraction
  // includes only this doorway strip; a short sloping soil face closes the cut
  // edge, so looking through the gap cannot reveal the underside of the map.
  const entryIndex=f.entryEdge,entryA=poly[entryIndex],entryB=poly[(entryIndex+1)%poly.length],entryLength=axes(entryA,entryB).l,
   entryT0=.5-f.entryWidthM/(2*entryLength),entryT1=.5+f.entryWidthM/(2*entryLength),
   ia=mix(inner[entryIndex],inner[(entryIndex+1)%inner.length],entryT0),ib=mix(inner[entryIndex],inner[(entryIndex+1)%inner.length],entryT1),
   oa=mix(entryA,entryB,entryT0),ob=mix(entryA,entryB,entryT1),
   entrySurface=[[ia.x,floorY+.022,ia.z],[ib.x,floorY+.022,ib.z],[ob.x,heightAt(ob.x,ob.z)+.025,ob.z],[oa.x,heightAt(oa.x,oa.z)+.025,oa.z]],entryOut=[];
  const surfaceArea=entrySurface.reduce((s,v,i)=>s+v[0]*entrySurface[(i+1)%4][2]-entrySurface[(i+1)%4][0]*v[2],0);
  quad(entryOut,...(surfaceArea>0?[...entrySurface].reverse():entrySurface));batch.raw(key(f.id,'east-earth'),entryOut,.82);
  const cut=[];
  for(let i=0;i<inner.length;i++){cut.push(inner[i]);if(i===entryIndex)cut.push(ia,oa,ob,ib);}
  masks.push({id:f.id,outline:cut,polygon:cut,center:p,width:5,depth:5,floorY,permanent:true,clipContext:false});
  const margin=2.4,x0=Math.min(...poly.map(q=>q.x))-margin,x1=Math.max(...poly.map(q=>q.x))+margin,z0=Math.min(...poly.map(q=>q.z))-margin,z1=Math.max(...poly.map(q=>q.z))+margin;
  vegetationExclusions.push([{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}]);
  record.bunkers.push({id:f.id,osmId:f.osmId,polygon:poly,interior:inner,floorY,topY:top,wallHeightM:f.estimatedWallHeightM,roof:false,weapons:false,entryEdge:f.entryEdge,entryWidthM:f.entryWidthM,entrySurface,orientationConfidence:'entry approximate; OSM footprint retained',longAccessReconstructed:false});
 }

 // Source traces are standing exterior walls, not the neighbouring hiking
 // paths. Crown bays are horizontal and stepped; lower continuations retain
 // plain broken crowns. The two mapped path gaps remain fully open.
 for(const id of['tres-castellets-upper-link','tres-castellets-descending-wall','tres-castellets-lower-wall']){
  const f=byId[id],path=from(f),stepped=f.kind==='current-stepped-curtain',upper=f.kind==='current-outer-wall-remnant';
  let length=0,bays=0,merlonCount=0;
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],ax=axes(a,b);length+=ax.l;
   // Suppress only procedural large trees whose trunks/crowns would intersect
   // current standing fabric. This is not a surveyed clearance or a new path.
   const ea={x:a.x-ax.u.x*.6,z:a.z-ax.u.z*.6},eb={x:b.x+ax.u.x*.6,z:b.z+ax.u.z*.6},clearance=3.8;
   vegetationExclusions.push([shift(ea,ax.n,clearance),shift(eb,ax.n,clearance),shift(eb,ax.n,-clearance),shift(ea,ax.n,-clearance)]);
   const count=Math.max(1,Math.ceil(ax.l/(f.bayLengthM||3.2)));
   for(let j=0;j<count;j++){
    const p=mix(a,b,j/count),q=mix(a,b,(j+1)/count),mid=mix(p,q,.5),n=ax.n,
     inner=(r)=>Math.max(heightAt(r.x+n.x*.65,r.z+n.z*.65),heightAt(r.x-n.x*.65,r.z-n.z*.65),heightAt(r.x,r.z)),
     reference=Math.max(inner(p),inner(q),inner(mid)),
     top=upper?null:Math.round((reference+f.innerParapetHeightM)*4)/4;
    if(upper)section(p,q,{id,top:r=>heightAt(r.x,r.z)+.68+.15*noise(i*37+j),thickness:f.widthM,broken:true,seed:i*11+j});
    else{
     const bodyTop=top-.62;
     section(p,q,{id,top:bodyTop,thickness:f.widthM,broken:!stepped,seed:i*11+j});
     section(p,q,{id,top,bottom:bodyTop-.02,thickness:f.widthM*.93,kind:'east-render',broken:!stepped,seed:i*19+j,contact:false});
     const {l,yaw}=axes(p,q);
     batch.box(key(id,'worn-ashlar'),mid.x,bodyTop+.025,mid.z,l,.05,f.widthM*.98,yaw,.83);
     if(stepped)merlonCount+=merlons(p,q,top,{id,width:.74,height:f.merlonHeightM,spacing:1.75,thickness:f.widthM*.88});
     if(detail==='full'&&l>2){
      // A sparse run of photographed putlog sockets; shallow dark marks only.
      for(let k=1;k<Math.floor(l/2);k++){
       const r=mix(p,q,k/Math.floor(l/2));
       for(const side of[-1,1]){
        const s=shift(r,n,side*f.widthM*.515);
        batch.box(key(id,'mortar'),s.x,bodyTop-.35,s.z,.13,.13,.025,yaw,.58);
       }
      }
     }
    }
    record.walls.push({id,a:p,b:q,topY:top,terrainFollowing:upper,thickness:f.widthM,stepped,sourceSegment:i-1});bays++;
   }
  }
  record.features.find(v=>v.id===id).lengthM=length;
  record.features.find(v=>v.id===id).builtBays=bays;
  record.features.find(v=>v.id===id).merlons=merlonCount;
 }
 for(const f of EAST_EXTERIOR_FEATURES.filter(f=>f.kind==='current-path-opening')){
  const ps=from(f),c=center(ps),width=Math.hypot(ps[0].x-ps[1].x,ps[0].z-ps[1].z);
  record.openings.push({id:f.id,center:c,path:ps,width,blocked:false,walkable:true,terrainY:heightAt(c.x,c.z),fabricAdded:false});
 }
 record.baseContact={samples:record.wallBases.length,maxBaseAboveGroundM:Math.max(0,...record.wallBases.map(p=>p.baseY-p.terrainY))};
 if(qa)qa.exterior=record;
 if(stats){stats.easternExteriorFeatures=EAST_EXTERIOR_FEATURES.length;stats.easternExteriorWallLengthM=record.features.reduce((s,f)=>s+(f.lengthM||0),0);}
 return {qa:record,currentMasks:masks,vegetationExclusions};
}
