// v55 adds targeted checks to the shared real-constructor regressions. The
// same assembled Atlas, final-terrain Simulator and raw-MDT Simulator are
// retained; no second model or substitute geometry is built for these checks.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EAST_EXTERIOR_FEATURES} from '../../dist/js/castle-east-exterior-layout.js';
const directory=fileURLToPath(new URL('./',import.meta.url));
process.env.SAGUNTUM_CASTLE_QA_DIRECTORY=directory;
process.env.SAGUNTUM_CASTLE_PRESERVED_STOPS='22';
process.env.SAGUNTUM_CASTLE_QA_CONTEXT='1';
process.env.SAGUNTUM_CASTLE_QA_RETAIN_MODELS='1';
const output=path.join(directory,'castle-v55-qa.json');
fs.writeFileSync(output,JSON.stringify({pass:false,status:'validating-current-source',started:new Date().toISOString()},null,2)+'\n');
const base=await import('../validation-v54/validate-castle-simulator.mjs');
const {atlas,model,rawModel,frame,report:regression,releaseModel,THREE,sourceProject,createHeritageCollision,reliefDelta,heightOnPavement,heightAt,rawTerritoryHeight}=base;
const {insideExcavation}=await import('../../dist/js/excavation.js');
const {normalizeBuildingId}=await import('../../dist/js/territory-heritage-models.js');
const checks=[];
const check=(pass,label,detail)=>checks.push({pass:!!pass,label,...(detail?{detail}:{})});
const meshes=[];
atlas.castle.traverse(o=>{if(o.isMesh)meshes.push(o);});
const component=id=>meshes.filter(m=>m.userData.component===id||String(m.userData.component||'').startsWith(id+'-'));
const box=objects=>objects.reduce((b,m)=>b.union(new THREE.Box3().setFromObject(m)),new THREE.Box3());
const ray=new THREE.Raycaster();
const east=atlas.visit.qa.east;

// The two red marks must now have exposed rooms, not a full upper deck. Cast
// rays through the actual cut interiors and count floor-visible samples.
const rooms=[];
for(const id of ['battery-n','battery-e']){
 const record=east.barracks?.find(b=>b.id===id),cut=atlas.castle.userData.currentMasks.find(m=>m.id===id+'-rooms');
 check(record?.roof===false&&record.openCourtyard===true&&!!cut,'Mapped barrack has an open interior and a real terrain cut: '+id);
 if(!cut)continue;
 const outline=cut.outline||cut.polygon,xs=outline.map(p=>p.x),zs=outline.map(p=>p.z);
 let samples=0,visibleFloor=0;const hits={};
 for(let ix=1;ix<15;ix++)for(let iz=1;iz<15;iz++){
  const x=Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))*ix/15,z=Math.min(...zs)+(Math.max(...zs)-Math.min(...zs))*iz/15;
  if(!insideExcavation(cut,x,z))continue;
  ray.set(new THREE.Vector3(x,cut.floorY+20,z),new THREE.Vector3(0,-1,0));ray.near=0;ray.far=25;
  const first=ray.intersectObject(atlas.castle,true)[0];samples++;
  if(first&&Math.abs(first.point.y-cut.floorY)<.13)visibleFloor++;
  else if(first)hits[first.object.userData.component]=(hits[first.object.userData.component]||0)+1;
 }
 const result={id,samples,visibleFloor,floorVisibleFraction:visibleFloor/Math.max(1,samples),floorY:cut.floorY,occludingComponents:hits};
 check(samples>=12&&result.floorVisibleFraction>.40,'Roofless rooms expose their excavated floor from above: '+id,result);
 rooms.push(result);
}
check(!component('north-round-projection').length,'The detached v54 tower geometry is removed');
for(const id of ['north-round-tower','north-tower-joining-curtain','north-arched-recess','daoiz-machine-gun-remains','tres-castellets-upper-link','tres-castellets-descending-wall','tres-castellets-lower-wall'])
 check(component(id).length>0,'The mapped exterior has actual geometry: '+id);
const towerBox=box(component('north-round-tower')),curtainBox=box(component('north-tower-joining-curtain'));
check(!towerBox.isEmpty()&&!curtainBox.isEmpty()&&towerBox.clone().expandByScalar(.03).intersectsBox(curtainBox),'Tower and joining curtain share a contact envelope');

// Bunker exclusion is checked in both real constructors and the actual Atlas
// city context. The generic building cannot survive beneath the new model.
const bunkerId='1419384279',bunker=EAST_EXTERIOR_FEATURES.find(f=>f.osmId===bunkerId),points=bunker.coordinates.slice(0,-1).map(c=>sourceProject(...c));
const center=points.reduce((p,q)=>({x:p.x+q.x/points.length,z:p.z+q.z/points.length}),{x:0,z:0});
check(atlas.monuments.castleBuildingIds.has(bunkerId),'Atlas excludes the generic bunker by its shared building ID');
for(const [label,native]of [['final-terrain',model],['raw-MDT',rawModel]]){
 const claims=new Set(native.claims.flatMap(c=>[...c.ids]));
 check(claims.has(normalizeBuildingId(bunkerId)),'Simulator claims the bunker source ID: '+label);
 const transferred=structuredClone(native.claims),workerClaims=new Set(transferred.flatMap(c=>[...c.ids]));
 check(workerClaims.has(normalizeBuildingId(bunkerId)),'Structured worker transfer retains the bunker claim: '+label);
}
const cityMeshes=[];atlas.city.group.traverse(m=>{if(m.isMesh&&['Fachadas','Azoteas','Cornisas'].includes(m.name))cityMeshes.push(m);});
const genericHits=[];
for(const p of [center,...points.map(p=>({x:center.x+(p.x-center.x)*.5,z:center.z+(p.z-center.z)*.5}))]){
 ray.set(new THREE.Vector3(p.x,170,p.z),new THREE.Vector3(0,-1,0));ray.near=0;ray.far=100;
 for(const hit of ray.intersectObjects(cityMeshes,false))genericHits.push({x:p.x,z:p.z,y:hit.point.y,name:hit.object.name});
}
check(cityMeshes.length>0&&!genericHits.length,'Actual Atlas city buffers contain no facade, roof or cornice in the bunker footprint',{testedContextBatches:cityMeshes.length,probes:points.length+1,hits:genericHits});
let maxBunkerHeight=-Infinity;
for(const m of component('daoiz-machine-gun-remains')){
 const a=m.geometry.attributes.position;
 for(let i=0;i<a.count;i++){
  const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld);
  maxBunkerHeight=Math.max(maxBunkerHeight,p.y-atlas.terrain.meshHeightAt(p.x,p.z));
 }
}
check(Number.isFinite(maxBunkerHeight)&&maxBunkerHeight<2.5,'The new bunker remains a low surviving structure',{maxHeightAboveTerrainM:maxBunkerHeight,formerGenericFacadeSpanM:11.32612});

// Existing gaps are not closed by replacement wall geometry. These are wall
// collision checks at the current ground, not claims of accessible hill routes.
const gaps=[];
for(const feature of EAST_EXTERIOR_FEATURES.filter(f=>f.kind==='current-path-opening')){
 const a=sourceProject(...feature.coordinates[0]),b=sourceProject(...feature.coordinates[1]);
 for(const [label,native,sampler]of [['final-terrain',model,heightAt],['raw-MDT',rawModel,rawTerritoryHeight]]){
  const collision=createHeritageCollision({walkBarriers:[native.walkBarriers]}),samples=[];
  for(const t of [.35,.5,.65]){
   const p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},w=frame.world(p.x,p.z),terrain=sampler(w.x,w.z)+reliefDelta(native.relief,w.x,w.z),
    feet=heightOnPavement(native.publicDeck,w.x,w.z)??heightOnPavement(native.pavement,w.x,w.z)??terrain;
   samples.push({...p,feet,clear:collision.safeToWalk(w.x,w.z,.30,feet)});
  }
  check(samples.every(s=>s.clear),'Replacement exterior wall retains the existing gap: '+feature.id+'/'+label,{samples});
  gaps.push({id:feature.id,constructor:label,samples});
 }
}
const result={pass:regression.pass&&checks.every(c=>c.pass),method:'Shared real-constructor regressions plus v55 source geometry/roofless room rays, actual generic-city buffers, native claims and extant gap collisions',
 sourceHashes:regression.sourceHashes,regressionFile:'castle-simulator-qa.json',preservedStops:22,addedStops:0,
 rooms,gaps,checks,errors:checks.filter(c=>!c.pass).map(c=>c.label),maxBunkerHeightAboveTerrainM:maxBunkerHeight,
 limitations:['CPU geometry and collision checks; no browser or WebGL session.','The contact envelope check is supplemented by the exterior builder contact probes and visual inspection.','Existing hill gaps are not asserted to form an accessible visitor route.']};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
releaseModel(model.group);releaseModel(rawModel.group);
console.log(JSON.stringify({pass:result.pass,checks:checks.length,errors:result.errors,output},null,2));
if(!result.pass)process.exitCode=1;
