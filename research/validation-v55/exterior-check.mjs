// Actual shipped castle geometry against the final Atlas terrain. This checks
// the user's concrete defects: disconnected tower, solid/tall bunker, absent
// wall and filled path gaps. It is not a browser or screenshot surrogate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildCastleScene,THREE,project} from '../validation-v54/castle-scene.mjs';
import {EAST_EXTERIOR_FEATURES,isEastExteriorPerimeterSegment} from '../../dist/js/castle-east-exterior-layout.js';

const atlas=await buildCastleScene(),qa=atlas.visit.qa.east.exterior;
assert(qa,'Shared castle constructor must include exterior geometry');
const meshes=[],components={};let triangles=0,nonFinite=0,degenerate=0;
const names=new Set(EAST_EXTERIOR_FEATURES.map(f=>f.id));
atlas.castle.traverse(o=>{
 if(!o.isMesh||!names.has(o.userData.component))return;
 meshes.push(o);const id=o.userData.component,p=o.geometry.attributes.position,n=o.geometry.attributes.normal;
 components[id]=(components[id]||0)+p.count/3;triangles+=p.count/3;
 for(const a of[p.array,n.array])for(const value of a)if(!Number.isFinite(value))nonFinite++;
 for(let i=0;i<p.count;i+=3){
  const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
  if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-14)degenerate++;
 }
});
assert(meshes.length>0);assert.equal(nonFinite,0);assert.equal(degenerate,0,'No degenerate faces');
assert(qa.baseContact.maxBaseAboveGroundM<=.025,'Exterior footings must reach terrain');
// Real triangle toes include wall thickness, flare and interpolation between
// stations. The centreline alone cannot detect a gap on the steep hillside.
const toeEdges=new Map(),baseStations=new Map();
for(const p of qa.wallBases){const a=baseStations.get(p.id)||[];a.push(p);baseStations.set(p.id,a);}
for(const mesh of meshes){
 if(!['east-masonry','east-concrete'].includes(mesh.userData.materialKind))continue;
 const stations=baseStations.get(mesh.userData.component);if(!stations)continue;
 const pos=mesh.geometry.attributes.position;
 for(let i=0;i<pos.count;i+=3){
  const vs=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(pos,i+j).applyMatrix4(mesh.matrixWorld));
  const foot=vs.filter(v=>stations.some(p=>Math.abs(p.baseY-v.y)<.002&&Math.hypot(p.x-v.x,p.z-v.z)<.85));
  if(foot.length!==2||Math.hypot(foot[0].x-foot[1].x,foot[0].z-foot[1].z)<.02)continue;
  const k=foot.map(v=>v.toArray().map(n=>n.toFixed(4)).join(',')).sort().join('|');toeEdges.set(k,{id:mesh.userData.component,points:foot});
 }
}
const toeSamples=[];
for(const{id,points:[a,b]}of toeEdges.values())for(const t of[0,.25,.5,.75,1]){
 const p=a.clone().lerp(b,t),terrain=atlas.terrain.meshHeightAt(p.x,p.z);toeSamples.push({id,x:p.x,z:p.z,footY:p.y,terrainY:terrain,gap:p.y-terrain});
}
assert(toeSamples.length>100,'Real exterior wall toe edges must be sampled');toeSamples.sort((a,b)=>b.gap-a.gap);
if(toeSamples[0].gap>.025)console.log(JSON.stringify({failure:'toe-contact',worst:toeSamples.slice(0,12)},null,2));
assert(toeSamples[0].gap<=.025,'Flared outer/inner wall toes must not float above the final terrain');
let oldTower=0;atlas.castle.traverse(o=>{if(o.isMesh&&o.userData.component==='north-round-projection')oldTower++;});
assert.equal(oldTower,0,'Old unjoined half tower must be removed');

const source=atlas.geo.castlePolygon,replaced=[];
for(let i=0;i<source.length-1;i++)if(isEastExteriorPerimeterSegment(source[i],source[i+1]))replaced.push(i);
assert.deepEqual(replaced,[202,203,204,205,206,207,208,209,210],'Only registered tower/arch span is replaced');
const tower=qa.towers[0];
for(const[k,vertex]of[[0,204],[1,211]]){
 const p=project(...source[vertex]);assert(Math.hypot(p.x-tower.joinedEnds[k].x,p.z-tower.joinedEnds[k].z)<1e-6,'Tower joining endpoint must retain OSM');
}
const closedArch=qa.openings.find(o=>o.id==='north-arched-recess');assert(closedArch.blocked&&!closedArch.walkable);

const ray=new THREE.Raycaster();
const portalResults=[];
for(const gap of qa.openings.filter(o=>o.fabricAdded===false)){
 const a=gap.path[0],b=gap.path[1],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),normal=new THREE.Vector3(-dz/l,0,dx/l);
 const observations=[];
 for(const t of[.35,.5,.65]){
  const x=a.x+dx*t,z=a.z+dz*t,y=atlas.terrain.meshHeightAt(x,z)+.85;
  const c=new THREE.Vector3(x,y,z),start=c.clone().addScaledVector(normal,2);
  ray.set(start,normal.clone().negate());ray.far=4;
  const hits=ray.intersectObjects(meshes,false).filter(h=>h.distance<4-.001);
  observations.push({t,hits:hits.map(h=>({id:h.object.userData.component,distance:h.distance}))});
 }
 assert(observations.every(p=>p.hits.length===0),'Mapped exterior path gap remains open: '+gap.id);
 portalResults.push({id:gap.id,widthM:gap.width,observations});
}
const bunker=qa.bunkers[0],center=bunker.interior.reduce((s,p)=>({x:s.x+p.x/bunker.interior.length,z:s.z+p.z/bunker.interior.length}),{x:0,z:0});
ray.set(new THREE.Vector3(center.x,bunker.topY+4,center.z),new THREE.Vector3(0,-1,0));ray.far=10;
const bunkerHits=ray.intersectObjects(meshes.filter(m=>m.userData.component===bunker.id),false);
assert(bunkerHits.length,'Bunker has an actual interior floor visible from above');
assert(Math.abs(bunkerHits[0].point.y-(bunker.floorY+.02))<.015,'No fictitious roof or solid monolith above bunker floor');
assert(bunker.wallHeightM<2,'Low surviving bunker remains');
const entryMid=bunker.entrySurface.reduce((s,p)=>s.add(new THREE.Vector3(...p)),new THREE.Vector3()).multiplyScalar(.25);
ray.set(entryMid.clone().add(new THREE.Vector3(0,5,0)),new THREE.Vector3(0,-1,0));ray.far=10;
const entryHits=ray.intersectObjects(meshes.filter(m=>m.userData.component===bunker.id),false);
assert(entryHits.length&&Math.abs(entryHits[0].point.y-entryMid.y)<.06,'Bunker entrance has continuous soil above the terrain cut');
const concreteToeSamples=toeSamples.filter(p=>p.id===bunker.id);assert(concreteToeSamples.length>20,'Concrete outer feet included');
assert(concreteToeSamples[0].gap<=.025,'Concrete chamber cannot float');

const report={pass:true,date:new Date().toISOString(),triangles,meshes:meshes.length,components,nonFinite,degenerate,
 sourcePerimeterReplacementIndices:replaced,tower,closedArch,portals:portalResults,bunker:{...bunker,verticalRayFirstHitY:bunkerHits[0].point.y},
 baseContact:qa.baseContact,wallLengthM:qa.features.reduce((s,f)=>s+(f.lengthM||0),0),
 actualTriangleToes:{edges:toeEdges.size,samples:toeSamples.length,maxGapM:toeSamples[0].gap,worst:toeSamples.slice(0,12)},
 bunkerEntrance:{expectedY:entryMid.y,firstHitY:entryHits[0].point.y,concreteToeSamples:concreteToeSamples.length,maximumConcreteGapM:Math.max(...concreteToeSamples.map(p=>p.gap))},
 method:'Actual shared castle meshes and rendered terrain; Float32 finite triangles; exact OSM joining endpoints; raycasts through both mapped gaps; downward ray into open bunker; old isolated tower absent. Visual verification is separate.'};
fs.writeFileSync(new URL('./exterior-qa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,triangles,meshes:meshes.length,components,wallLengthM:report.wallLengthM,baseContact:report.baseContact,portals:portalResults.map(p=>({id:p.id,widthM:p.widthM})),bunkerWallHeightM:bunker.wallHeightM},null,2));
