import * as THREE from 'three';
import {pointInPolygon,segmentDistance,roadWidth} from './urban-surface.js';
import {createPavingTessellator} from './conforming-paving.js';

// Source-registered surroundings of Plaça Major. The ordinary houses
// are deliberately schematic: source footprints, patios, storeys and roof-height
// estimates are retained; individual domestic facades have not been surveyed.
const DEFAULT_COORDINATE=[-.27863,39.67943];
const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const geographical=(x,z)=>[-.278+x/(111320*Math.cos(39.679*Math.PI/180)),39.679-z/111320];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const x=Math.sin(n*127.17+31.7)*43758.5453;return x-Math.floor(x);};
const hash=s=>[...String(s)].reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,5381);
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)]||0;
const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
const mid=p=>({x:p.reduce((s,a)=>s+a.x,0)/p.length,z:p.reduce((s,a)=>s+a.z,0)/p.length});
const clean=(coordinates,project)=>{const out=(coordinates||[]).map(c=>project(...c)).filter(p=>Number.isFinite(p.x+p.z));if(out.length>1&&Math.hypot(out[0].x-out.at(-1).x,out[0].z-out.at(-1).z)<.02)out.pop();return out;};
const color=c=>c?.isColor?c:new THREE.Color(c);
const scaleColor=(c,n)=>color(c).clone().multiplyScalar(n);
const rect=(x0,z0,x1,z1)=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}];
const PERIOD_COLORS={medieval:'#d6bd8b',modern:'#d4a578',contemporary:'#77b8c7',mixed:'#be98d6',interpretation:'#929ba0'};

function makeTexture(kind){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle=kind==='tile'?'#b8a58f':kind==='paving'?'#c3bbae':'#d6d0c3';ctx.fillRect(0,0,256,256);
 const rows=kind==='tile'?22:kind==='paving'?15:7,cols=kind==='tile'?16:kind==='paving'?8:4;
 const dx=256/cols,dy=256/rows;
 for(let r=0;r<rows;r++)for(let k=-1;k<cols;k++){
  const v=noise(r*47+k+128),x=k*dx+(r%2?dx/2:0),y=r*dy;
  ctx.fillStyle=kind==='tile'?`hsl(${29+v*5},${16+v*10}%,${66+v*12}%)`:`hsl(${34+v*5},${7+v*8}%,${75+v*12}%)`;ctx.fillRect(x+1,y+1,dx-1.8,dy-1.6);
  if(kind==='tile'){ctx.fillStyle='rgba(255,248,222,.18)';ctx.fillRect(x+dx*.22,y+1,dx*.18,dy-2);}
 }
 for(let n=0;n<950;n++){ctx.fillStyle=n%2?'rgba(30,25,19,.045)':'rgba(255,253,238,.08)';ctx.fillRect(noise(n+12)*256,noise(n+49)*256,1.6,.9);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}

class Batch{
 constructor(){this.parts=new Map();}
 triangle(kind,a,b,c,tint='#ffffff'){
  const col=color(tint);let d=this.parts.get(kind);if(!d){d={p:[],u:[],c:[]};this.parts.set(kind,d);}
  const n=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c),new THREE.Vector3(...a)));
  const horizontal=Math.abs(n.y)>=Math.max(Math.abs(n.x),Math.abs(n.z)),alongX=Math.abs(n.z)>=Math.abs(n.x),repeat=kind==='paving'?2.4:kind==='tile'?3:4;
  for(const v of[a,b,c]){d.p.push(...v);d.c.push(col.r,col.g,col.b);d.u.push((horizontal?v[0]:alongX?v[0]:v[2])/repeat,(horizontal?v[2]:v[1])/repeat);}
 }
 quad(kind,a,b,c,d,tint){this.triangle(kind,a,b,c,tint);this.triangle(kind,a,c,d,tint);}
 box(kind,x,y,z,w,h,d,yaw=0,tint='#ffffff'){
  const co=Math.cos(yaw),si=Math.sin(yaw),p=[];
  for(const dy of[-h/2,h/2])for(const dz of[-d/2,d/2])for(const dx of[-w/2,w/2])p.push([x+dx*co+dz*si,y+dy,z-dx*si+dz*co]);
  for(const q of[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])this.quad(kind,...q.map(i=>p[i]),tint);
 }
 finish(name,component,period,resources,textures){
  const group=new THREE.Group();group.name=name;group.userData={component,period};
  for(const[k,d]of this.parts){
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(d.p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(d.u,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(d.c,3));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
   const map=k==='tile'?textures.tile:['paving','stone'].includes(k)?textures[k]:null;
   const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,map,roughness:k==='iron'?.62:k==='glass'?.73:.95,metalness:k==='iron'?.38:0,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geo,material);mesh.name=name+' · '+k;mesh.castShadow=!['paving','joints'].includes(k);mesh.receiveShadow=true;
   mesh.userData={plazaMayorContext:true,component,period,materialKind:k,baseColor:material.color.clone(),baseMap:map,schematicFacade:true};
   resources.geometries.push(geo);resources.materials.push(material);group.add(mesh);
  }
  return group;
 }
}

function triangles(outline,holes=[]){const all=[outline,...holes].flat(),ix=THREE.ShapeUtils.triangulateShape(outline.map(p=>new THREE.Vector2(p.x,-p.z)),holes.map(r=>r.map(p=>new THREE.Vector2(p.x,-p.z))));return ix.map(t=>t.map(i=>all[i]));}
function subdivide(a,b,c,callback,maxEdge=2.5,depth=0){
 const lengths=[Math.hypot(a.x-b.x,a.z-b.z),Math.hypot(b.x-c.x,b.z-c.z),Math.hypot(c.x-a.x,c.z-a.z)],long=Math.max(...lengths);
 if(long<=maxEdge||depth>8){callback(a,b,c);return;}
 const i=lengths.indexOf(long),v=[a,b,c],u=v[i],w=v[(i+1)%3],opposite=v[(i+2)%3],m={x:(u.x+w.x)/2,z:(u.z+w.z)/2};subdivide(u,m,opposite,callback,maxEdge,depth+1);subdivide(m,w,opposite,callback,maxEdge,depth+1);
}
// Subtract a convex area triangle from a road cell. Testing only the cell's
// centre left overlapping strips (and skipped wedges) at the Cavallers mouth.
const polygonBounds=p=>({x0:Math.min(...p.map(v=>v.x)),x1:Math.max(...p.map(v=>v.x)),z0:Math.min(...p.map(v=>v.z)),z1:Math.max(...p.map(v=>v.z))});
function halfPlane(poly,a,b,sign,inside){
 const out=[],distance=p=>((b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x))*sign;
 for(let i=0;i<poly.length;i++){
  const u=poly[i],v=poly[(i+1)%poly.length],du=distance(u),dv=distance(v),iu=inside?du>=-1e-8:du<=1e-8,iv=inside?dv>=-1e-8:dv<=1e-8;
  if(iu)out.push(u);if(iu!==iv){const t=du/(du-dv);out.push({x:u.x+(v.x-u.x)*t,z:u.z+(v.z-u.z)*t});}
 }
 return out;
}
function uncoveredRoadCell(cell,masks){
 let pieces=[cell];
 for(const mask of masks){
  const next=[];
  for(const piece of pieces){
   const b=polygonBounds(piece);if(b.x1<mask.bounds.x0||b.x0>mask.bounds.x1||b.z1<mask.bounds.z0||b.z0>mask.bounds.z1){next.push(piece);continue;}
   let remainder=piece;const sign=signedArea(mask.p)>0?1:-1;
   for(let i=0;i<mask.p.length&&remainder.length>=3;i++){
    const a=mask.p[i],c=mask.p[(i+1)%mask.p.length],outside=halfPlane(remainder,a,c,sign,false);
    if(outside.length>=3&&Math.abs(signedArea(outside))>1e-7)next.push(outside);
    remainder=halfPlane(remainder,a,c,sign,true);
   }
  }
  pieces=next;if(!pieces.length)break;
 }
 return pieces;
}

export function createPlazaMayorContext({data={},landmarks={},project=projectDefault,heightAt=()=>0,contextData={}}={}){
 const coordinate=contextData.coordinate||DEFAULT_COORDINATE,center=project(...coordinate),outline=contextData.plazaOutline||[];
 const sourceBuildings=contextData.buildings||[],sourceRoads=contextData.roads||[],sourceSurfaces=contextData.surfaces||[],areaPavedRoadIds=new Set((contextData.areaPavedRoadIds||[]).map(String));
 const resources={geometries:[],materials:[],textures:[]},textures={stone:makeTexture('stone'),paving:makeTexture('paving'),tile:makeTexture('tile')};resources.textures.push(...Object.values(textures));
 const group=new THREE.Group(),grounded=new THREE.Group();group.name='Plaça Major · trama urbana y accesos';grounded.name='Contexto adaptado al terreno final';group.add(grounded);
 const exclusions=[],patches=[],excludedBuildingIds=new Set((contextData.excludedBuildingIds||sourceBuildings.map(b=>b.id)).map(String)),excludedRoadIds=new Set((contextData.excludedRoadIds||[]).map(String)),components=[];
 const stats={buildingParts:sourceBuildings.length,parentParcels:new Set(sourceBuildings.map(b=>b.parentId||b.id)).size,footprintsPreserved:true,courtyards:sourceBuildings.reduce((s,b)=>s+(b.holes?.length||0),0),sourceHeight:0,ignHeight:0,storeyHeight:0,fallbackHeight:0,streetSamples:0,roofCorrections:0,maximumRoofCorrectionM:0,preservedSantaMaria:true};
 const qa={buildings:[],groundSamples:[],sourcePreservation:[],sourceKeys:(contextData.sources||[]).map(s=>s.id),limitations:[contextData.facadeNote,contextData.roofNote,contextData.pavingNote].filter(Boolean)};
 let selected=null,readingMode='materials',currentGround=heightAt,disposed=false;
 const sourcePolygons=sourceBuildings.map(b=>({record:b,p:clean(b.coordinates,project),holes:(b.holes||[]).map(r=>clean(r,project))})).filter(b=>b.p.length>=3);
 for(const b of sourcePolygons){exclusions.push(b.p);components.push({id:'context-'+b.record.id,coordinates:b.record.coordinates,holes:b.record.holes||[],kind:'context-building',period:'mixed',sourceId:b.record.id,interpretive:false});qa.sourcePreservation.push({id:b.record.id,vertices:b.record.coordinates.length,holes:b.record.holes?.length||0});}
 const nearby=(data.buildings||sourceBuildings).filter(b=>{const p=b.coordinates?.[0]&&project(...b.coordinates[0]);return p&&Math.hypot(p.x-center.x,p.z-center.z)<165;}).map(b=>({id:String(b.id),p:clean(b.coordinates,project),holes:(b.holes||[]).map(r=>clean(r,project))})).filter(b=>b.p.length>=3);
 for(const b of contextData.coreBuildings||[])for(const fp of[b,...(b.secondaryFootprints||[])])nearby.push({id:String(b.id),p:clean(fp.coordinates,project),holes:(fp.holes||[]).map(r=>clean(r,project))});
 const occupied=(x,z,ignore=null)=>nearby.some(b=>b.id!==ignore&&pointInPolygon(x,z,b.p)&&!b.holes.some(h=>pointInPolygon(x,z,h)));
 const disposeLayer=layer=>{layer.traverse(o=>{if(!o.isMesh)return;const g=resources.geometries.indexOf(o.geometry);if(g>=0)resources.geometries.splice(g,1);o.geometry.dispose();const m=resources.materials.indexOf(o.material);if(m>=0)resources.materials.splice(m,1);o.material.dispose();});layer.clear();};
 const streetBatches=new Map(),batchFor=id=>{if(!streetBatches.has(id))streetBatches.set(id,new Batch());return streetBatches.get(id);};
 function buildBuildings(ground){
  const batches=new Map();qa.buildings.length=0;stats.sourceHeight=stats.ignHeight=stats.storeyHeight=stats.fallbackHeight=stats.roofCorrections=stats.maximumRoofCorrectionM=0;
  for(const item of sourcePolygons){
   const {record:r,p,holes}=item,id=r.contextComponent||'plaza-caserio-este';if(!batches.has(id))batches.set(id,new Batch());const b=batches.get(id),seed=hash(r.parentId||r.id),area=Math.abs(signedArea(p))-holes.reduce((s,h)=>s+Math.abs(signedArea(h)),0),groundSamples=p.map(q=>ground(q.x,q.z)),reference=median(p.map(q=>heightAt(q.x,q.z)));
   let h=Number.parseFloat(r.height),method='height';if(!(h>0)){h=Number.parseFloat(r.surfaceHeightEstimate);method='IGN';}if(!(h>0)){h=Number.parseFloat(r.levels)*3;method='storeys';}if(!(h>0)){h=8;method='estimate';}h=clamp(h,2.5,28);stats[{height:'sourceHeight',IGN:'ignHeight',storeys:'storeyHeight',estimate:'fallbackHeight'}[method]]++;
   const roofColor=r.roofColor||'#b49d81',rc=color(roofColor),red=rc.r>rc.g*1.08,roofRise=!holes.length&&area>45&&r.roofShape!=='flat'&&(red||r.roofShape==='gabled')?clamp(Math.sqrt(area)*.085,.65,1.65):0;
   const sourceRoof=reference+h,roofTop=Math.max(sourceRoof,Math.max(...groundSamples)+.7),eave=roofTop-roofRise;
   if(roofTop>sourceRoof+.001){stats.roofCorrections++;stats.maximumRoofCorrectionM=Math.max(stats.maximumRoofCorrectionM,roofTop-sourceRoof);}
   const facade=['#d7c4a7','#e8ddc6','#c8b49a','#d9c5ad','#e2cfaf','#d3bea5'][seed%6],rings=[p,...holes],sgn=signedArea(p)>0?1:-1;
   for(const ring of rings)for(let i=0;i<ring.length;i++){
    const a=ring[i],c=ring[(i+1)%ring.length],length=Math.hypot(c.x-a.x,c.z-a.z);if(length<.12)continue;
    const dx=(c.x-a.x)/length,dz=(c.z-a.z)/length,sign=(signedArea(ring)>0?1:-1)*(ring===p?1:-1),nx=dz*sign,nz=-dx*sign,ya=ground(a.x,a.z)-.75,yc=ground(c.x,c.z)-.75;
    b.quad('plaster',[a.x,ya,a.z],[c.x,yc,c.z],[c.x,eave,c.z],[a.x,eave,a.z],scaleColor(facade,.96+noise(seed+i)*.08));
    const mx=(a.x+c.x)/2,mz=(a.z+c.z)/2,exposed=!occupied(mx+nx*.6,mz+nz*.6,String(r.id));
    if(!exposed||length<2.1||ring!==p)continue;
    b.quad('stone',[a.x+nx*.025,ya,a.z+nz*.025],[c.x+nx*.025,yc,c.z+nz*.025],[c.x+nx*.025,Math.min(eave,ground(c.x,c.z)+.65),c.z+nz*.025],[a.x+nx*.025,Math.min(eave,ground(a.x,a.z)+.65),a.z+nz*.025],'#b2a58d');
    const angle=-Math.atan2(dz,dx);b.box('stone',mx+nx*.09,eave-.15,mz+nz*.09,length,.18,.24,angle,scaleColor(facade,1.03));
    const columns=Math.max(1,Math.min(8,Math.floor(length/3.25))),floors=Math.min(5,Math.max(1,Math.floor((eave-Math.min(...groundSamples))/3.05)));
    for(let f=0;f<floors;f++)for(let n=0;n<columns;n++){
     const t=(n+1)/(columns+1),x=a.x+(c.x-a.x)*t,z=a.z+(c.z-a.z)*t,y=eave-1.05-f*3.05,low=y-1.45,gy=ground(x,z);if(low<gy+1.9)continue;
     const half=.48,at=(u,v,offset)=>[x+dx*u+nx*offset,v,z+dz*u+nz*offset];
     b.quad('glass',at(-half,low,.042),at(half,low,.042),at(half,y,.042),at(-half,y,.042),'#3c4947');
     for(const side of[-1,1]){const u=side*(half+.05);b.quad('plaster',at(u-.055,low-.07,.08),at(u+.055,low-.07,.08),at(u+.055,y+.09,.08),at(u-.055,y+.09,.08),scaleColor(facade,1.08));}
     b.box('stone',x+nx*.12,low-.07,z+nz*.12,1.18,.12,.3,angle,'#c9bfa9');b.box('wood',x+nx*.06,(low+y)/2,z+nz*.06,.055,1.45,.05,angle,'#82765f');
     if(f===floors-1&&columns<=4&&length>5){
      b.box('stone',x+nx*.4,low-.18,z+nz*.4,1.35,.12,.7,angle,'#c2b8a4');b.box('iron',x+nx*.73,low+.64,z+nz*.73,1.34,.045,.045,angle,'#4d5650');
      for(let k=0;k<8;k++){const u=(k/7-.5)*1.22;b.box('iron',x+dx*u+nx*.73,low+.22,z+dz*u+nz*.73,.035,.83,.035,angle,'#4c554f');}
     }
    }
    if(length>3.5&&length<25){const gy=ground(mx,mz),at=(u,v)=>[mx+dx*u+nx*.07,v,mz+dz*u+nz*.07];b.quad('wood',at(-.58,gy+.04),at(.58,gy+.04),at(.58,Math.min(eave-.2,gy+2.28)),at(-.58,Math.min(eave-.2,gy+2.28)),'#71624f');b.box('stone',mx+nx*.08,gy+2.35,mz+nz*.08,1.37,.13,.19,angle,'#c6bba5');}
   }
   const distance=(x,z)=>Math.min(...rings.flatMap(ring=>ring.map((a,i)=>segmentDistance(x,z,a,ring[(i+1)%ring.length]).distance)));
   for(const triangle of triangles(p,holes))subdivide(...triangle,(a,c,d)=>{const yy=q=>eave+Math.min(roofRise,distance(q.x,q.z)*.38)+.035;b.triangle(roofRise?'tile':'plaster',[a.x,yy(a),a.z],[c.x,yy(c),c.z],[d.x,yy(d),d.z],roofRise?roofColor:scaleColor(roofColor,1.05));},roofRise?2.3:7);
   if(!roofRise&&area>25)for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length];b.quad('plaster',[a.x,eave,a.z],[c.x,eave,c.z],[c.x,eave+.22,c.z],[a.x,eave+.22,a.z],scaleColor(facade,.95));}
   qa.buildings.push({id:r.id,parentId:r.parentId,method,heightM:h,referenceBaseM:reference,roofSourceM:sourceRoof,roofDisplayM:roofTop,roofCorrectionM:roofTop-sourceRoof,courtyardCount:holes.length,areaM2:area});
  }
  for(const[id,b]of batches)grounded.add(b.finish('Caserío · '+id.replace('plaza-',''),id,'mixed',resources,textures));
 }
 function buildSurfaces(ground){
  streetBatches.clear();qa.groundSamples.length=0;stats.streetSamples=0;
  const paving=createPavingTessellator(ground);
  for(const s of sourceSurfaces){
   const p=clean(s.coordinates,project),holes=(s.holes||[]).map(r=>clean(r,project)),b=batchFor(s.component||'plaza-pavimento');
   paving.triangulate(p,holes,(a,c,d)=>{b.triangle('paving',a,c,d,s.component==='plaza-peixateria'?'#c2b9a6':'#cfc2ac');qa.groundSamples.push({x:(a[0]+c[0]+d[0])/3,z:(a[2]+c[2]+d[2])/3,y:(a[1]+c[1]+d[1])/3,kind:'area'});});
   for(const ring of[p,...holes])for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length];b.quad('stone',[a.x,ground(a.x,a.z)+.105,a.z],[c.x,ground(c.x,c.z)+.105,c.z],[c.x,ground(c.x,c.z)-.30,c.z],[a.x,ground(a.x,a.z)-.30,a.z],'#b2a58e');}
  }
  const areaMasks=sourceSurfaces.flatMap(s=>triangles(clean(s.coordinates,project),(s.holes||[]).map(r=>clean(r,project)))).map(p=>({p,bounds:polygonBounds(p)}));
  for(const road of sourceRoads){
   // These mapped centre lines retain their navigation/plan semantics. Their
   // visible paving belongs to the square area and the adjoining church
   // corridor, so a second residual ribbon must not cross the shared border.
   if(road.area==='yes'||areaPavedRoadIds.has(String(road.id)))continue;
   const id=road.contextComponent||'plaza-pavimento',b=batchFor(id),p=clean(road.coordinates,project),width=roadWidth(road);
   for(let i=1;i<p.length;i++){
    const a=p[i-1],c=p[i],length=Math.hypot(c.x-a.x,c.z-a.z);if(length<.04)continue;const nx=-(c.z-a.z)/length,nz=(c.x-a.x)/length,count=Math.ceil(length/1.05);
    const cross=t=>{const x=a.x+(c.x-a.x)*t,z=a.z+(c.z-a.z)*t,halves=[];for(const side of[-1,1]){let distance=width/2;for(let d=.16;d<width/2;d+=.16)if(occupied(x+nx*d*side,z+nz*d*side)){distance=Math.max(.08,d-.12);break;}halves.push(distance);}return[{x:x-nx*halves[0],z:z-nz*halves[0]},{x:x+nx*halves[1],z:z+nz*halves[1]}];};
    for(let n=0;n<count;n++){
     const q0=cross(n/count),q1=cross((n+1)/count),q=[q0[0],q0[1],q1[1],q1[0]],pieces=uncoveredRoadCell(q,areaMasks);if(!pieces.length)continue;
     stats.streetSamples++;
     for(const piece of pieces){
      paving.triangulate(piece,[],(a,c,d)=>{b.triangle('paving',a,c,d,'#bdb7a8');qa.groundSamples.push({x:(a[0]+c[0]+d[0])/3,z:(a[2]+c[2]+d[2])/3,y:(a[1]+c[1]+d[1])/3,kind:'street',sourceId:String(road.id)});});
      // Keep only the exposed original road edges. The clipping boundary
      // against an adjoining paved area is a flush joint, not a kerb.
      for(let e=0;e<piece.length;e++){const v=piece[e],u=piece[(e+1)%piece.length];if(![[0,3],[1,2]].some(([j,k])=>segmentDistance(v.x,v.z,q[j],q[k]).distance<1e-6&&segmentDistance(u.x,u.z,q[j],q[k]).distance<1e-6))continue;b.quad('stone',[v.x,ground(v.x,v.z)+.105,v.z],[u.x,ground(u.x,u.z)+.105,u.z],[u.x,ground(u.x,u.z)-.3,u.z],[v.x,ground(v.x,v.z)-.3,v.z],'#afa58f');}
     }
    }
   }
  }
  for(const[id,b]of streetBatches)grounded.add(b.finish('Pavimento · '+id.replace('plaza-',''),id,'mixed',resources,textures));
 }
 const focuses={},focusCoordinates=contextData.focusCoordinates||{};
 const focusSpecs={
  'plaza-peixateria':{label:'Plaça de la Peixateria',far:[-25,25,-14],near:[-13,11,-4],radius:9},
  'plaza-cavallers':{label:'Carrer dels Cavallers',far:[24,24,-14],near:[14,11,-7],radius:8},
  'plaza-carrer-major':{label:'Carrer Major',far:[-28,26,5],near:[-15,12,4],radius:8},
  'plaza-carrer-castell':{label:'Carrer del Castell',far:[-24,28,-16],near:[-12,14,-6],radius:8}
 };
 function updateFocuses(){for(const[id,coordinates]of Object.entries(focusCoordinates)){const spec=focusSpecs[id];if(!spec)continue;const p=project(...coordinates),target=new THREE.Vector3(p.x,currentGround(p.x,p.z)+2,p.z),far=[...spec.far],near=[...spec.near];for(const v of[far,near])v[1]=Math.max(v[1],currentGround(target.x+v[0],target.z+v[2])+2.5-target.y);const r=spec.radius,bounds=new THREE.Box3(new THREE.Vector3(p.x-r,target.y-2,p.z-r),new THREE.Vector3(p.x+r,target.y+10,p.z+r));focuses[id]={id,label:spec.label,regionId:'sagunto',coordinate:coordinates,coordinates,target,offset:far,closeOffset:near,bounds,components:[id],kind:'context',sourceConfidence:'Mapped street/public-space focus. No exact vanished-building footprint is implied.'};}}
 function applyMaterials(){group.traverse(mesh=>{if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=readingMode==='periods',vertexColors=!periods;if(m.vertexColors!==vertexColors){m.vertexColors=vertexColors;m.needsUpdate=true;}const map=periods?null:d.baseMap;if(m.map!==map){m.map=map;m.needsUpdate=true;}m.color.copy(d.baseColor);if(periods)m.color.set(PERIOD_COLORS[d.period]||PERIOD_COLORS.mixed);m.emissive.set(selected===d.component?'#4a3517':'#000000');m.emissiveIntensity=selected===d.component?.16:0;});}
 function bindGround(ground){if(disposed||typeof ground!=='function')return;currentGround=ground;disposeLayer(grounded);buildBuildings(ground);buildSurfaces(ground);updateFocuses();applyMaterials();group.updateMatrixWorld(true);bounds.setFromObject(group);return api;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';applyMaterials();return readingMode;}
 function selectFocus(id){selected=id&&focuses[id]?id:null;applyMaterials();return selected?focuses[selected]:null;}
 function dispose(){if(disposed)return;disposed=true;for(const g of resources.geometries)g.dispose();for(const m of resources.materials)m.dispose();for(const t of resources.textures)t.dispose();resources.geometries.length=resources.materials.length=resources.textures.length=0;group.clear();}
 for(const s of sourceSurfaces)components.push({id:s.id,coordinates:s.coordinates,holes:s.holes||[],kind:'plaza',period:'mixed',interpretive:!!s.derived,sourceId:s.sourceId});
 for(const r of sourceRoads)components.push({id:'street-'+r.id,coordinates:r.coordinates,kind:r.kind==='steps'?'stairs':'street',closed:false,period:'mixed',interpretive:false,sourceId:r.sourceId||r.id});
 const plan={outline,components,center:coordinate},bounds=new THREE.Box3();
 const api={group,patches,exclusions,excludedBuildingIds,excludedRoadIds,focuses,bounds,plan,stats,qa,bindGround,setReadingMode,selectFocus,dispose,ownedResources:resources,getState:()=>({selected,readingMode})};
 group.userData={id:'plaza-mayor-context',ownedResources:resources,stats,sourceKeys:qa.sourceKeys,interpretation:contextData.facadeNote||'Source footprints and terrain; interpretive secondary façades and roofs.'};
 bindGround(heightAt);return api;
}
