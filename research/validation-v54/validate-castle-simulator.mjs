// Exercise the real Simulator constructor with the Atlas' final rendered ground.
// CPU registration and surface-mask checks; no GPU rendering is asserted.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {root,data,THREE,project as sourceProject,buildCastleScene} from './castle-scene.mjs';
import {createCastleGround} from '../../dist/js/castle-ground.js';
const {heritageRelief,reliefDelta}=await import('../../dist/js/territory-heritage-relief.js');
const {excavationTriangles,insideTriangleCut}=await import('../../dist/js/polygon-excavation.js');
const {insideExcavation}=await import('../../dist/js/excavation.js');
const outputDirectory=path.resolve(process.env.SAGUNTUM_CASTLE_QA_DIRECTORY||path.join(root,'research/validation-v54'));
fs.mkdirSync(outputDirectory,{recursive:true});
const output=name=>path.join(outputDirectory,name);
const preservedStopIds=Number(process.env.SAGUNTUM_CASTLE_PRESERVED_STOPS||18),addedEasternStops=22-preservedStopIds;
const checks=[],errors=[];
function check(pass,label,detail){checks.push({pass:!!pass,label,...(detail?{detail}:{})});if(!pass){errors.push(label);fs.writeFileSync(output('simulator-failure-checkpoint.json'),JSON.stringify({pass:false,checks,errors},null,2)+'\n');}}
const atlas=await buildCastleScene({context:process.env.SAGUNTUM_CASTLE_QA_CONTEXT==='1'});
const [{buildHeritageModel,releaseModel},{registerFrame},{project},{heightOnPavement},{createHeritageCollision}]=await Promise.all([
 import('../../dist/js/territory-heritage-models.js'),import('../../dist/js/territory-heritage-catalog.js'),
 import('../../dist/js/territory-coordinates.js'),import('../../dist/js/territory-heritage-paving.js'),import('../../dist/js/territory-collision-heritage.js')]);
const [lon,lat]=[-.279179,39.67591];
const place={id:'castle',name:'Castillo de Sagunto',lon,lat,...project(lon,lat)};
const frame=registerFrame(place,project),det=frame.a*frame.d-frame.b*frame.c;
const inverse=(x,z)=>({x:((x-frame.tx)*frame.d-(z-frame.tz)*frame.b)/det,
 z:(frame.a*(z-frame.tz)-frame.c*(x-frame.tx))/det});
const heightAt=(x,z)=>{const p=inverse(x,z);return atlas.terrain.meshHeightAt(p.x,p.z);};
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
async function constructSimulator(sampler){
 const oldFetch=globalThis.fetch,oldDocument=globalThis.document;
 globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
 globalThis.fetch=async input=>{
  const url=new URL(String(input)),file=fileURLToPath(url);
  assert(file.startsWith(path.join(root,'dist/assets/')),'Read only repository source assets');
  return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});
 };
 try{return await buildHeritageModel('castle',{places:[place],records:{castle:{id:'castle',coordinate:[lon,lat]}},
  area:data('historic-context'),heightAt:sampler,project,needed:()=>true});
 }finally{
  globalThis.fetch=oldFetch;
  if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
 }
}
const model=await constructSimulator(heightAt);
assert(model,'The real Simulator builder returns the castle');
const meshKey=o=>[o.userData.regionId,o.userData.component,o.userData.materialKind].join('|');
const atlasMeshes=new Map();
atlas.castle.traverse(o=>{if(o.isMesh){const key=meshKey(o);assert(!atlasMeshes.has(key),'Unique source batch: '+key);atlasMeshes.set(key,o);}});
let matched=0,maxRegistrationError=0,maxBufferError=0;
model.group.updateMatrixWorld(true);
const details=[];
model.group.traverse(o=>{
 if(!o.isMesh)return;
 const key=meshKey(o),original=atlasMeshes.get(key);assert(original,'Simulator batch exists in the Atlas: '+key);
 assert.equal(!!o.userData.publicWalkingSurface,!!original.userData.publicWalkingSurface,'Public walking metadata is retained: '+key);
 let maximum=0;const attributes={};
 for(const name of ['position','normal','uv','color']){
  const actual=o.geometry.attributes[name].array,expected=original.geometry.attributes[name].array;
  assert.equal(actual.length,expected.length,'Same '+name+' length: '+key);
  let attributeMaximum=0,worst=-1;
  for(let i=0;i<actual.length;i++){const difference=Math.abs(actual[i]-expected[i]);if(difference>attributeMaximum){attributeMaximum=difference;worst=i;}}
  attributes[name]={maximum:attributeMaximum,...(worst>=0?{index:worst,actual:actual[worst],expected:expected[worst]}:{})};
  maximum=Math.max(maximum,attributeMaximum);
 }
 // World coordinates are baked into this model. Inverting UTM can move a
 // Float32 coordinate by one ULP; compare geometrically rather than hashing.
 check(maximum<.0001,'Same geometry within Float32 registration: '+key,{maximum,attributes});
 maxBufferError=Math.max(maxBufferError,maximum);
 for(const vertex of [0,Math.floor(o.geometry.attributes.position.count/2),o.geometry.attributes.position.count-1]){
  const a=new THREE.Vector3().fromBufferAttribute(original.geometry.attributes.position,vertex).applyMatrix4(original.matrixWorld);
  const actual=new THREE.Vector3().fromBufferAttribute(o.geometry.attributes.position,vertex).applyMatrix4(o.matrixWorld),p=frame.world(a.x,a.z);
  const error=actual.distanceTo(new THREE.Vector3(p.x,a.y,p.z));
  check(error<.0001,'Metric registration: '+key,{error,vertex});maxRegistrationError=Math.max(maxRegistrationError,error);
 }
 details.push({batch:key,maximumBufferDifference:maximum,attributes});matched++;
});
assert.equal(matched,atlasMeshes.size,'Every architecture and path batch is present in the Simulator');
assert.equal(Object.keys(atlas.visit.focuses).length,22);
assert(model.pavement?.coverage>0,'Castle paths have a ground/road mask in the Simulator');
assert.equal(model.contextStats.paths,20,'All 20 mapped routes retain their source IDs');
assert(model.walkBarriers?.length>0,'The Simulator has collision sections for the castle');
for(const id of atlas.monuments.castleBuildingIds)assert(model.claims[0].ids.has(String(id).replace(/^cat-/,'')),'Mapped building is claimed: '+id);
let occupiedCells=0,emptyCells=0;
const paving=model.pavement;
for(let i=0;i<paving.heights.length;i++){
 const x=paving.left+(i%paving.width+.5)*paving.metres,z=paving.top+(Math.floor(i/paving.width)+.5)*paving.metres;
 const sampled=heightOnPavement(paving,x,z);
 if(paving.heights[i]===-32768){assert.equal(sampled,null);emptyCells++;}
 else{assert(Number.isFinite(sampled));occupiedCells++;}
}
assert.equal(occupiedCells,paving.coverage,'The actual paved footprint matches the sampling mask');
assert(emptyCells>occupiedCells,'Pavement mask leaves surrounding archaeological/natural ground unclaimed');
assert.equal(heightOnPavement(paving,paving.left-2,paving.top-2),null,'Outside the real paths remains unmasked');
// The passage's rendered deck is used by the real pedestrian collision query.
// Do not infer walkability from a mesh aperture or from the ground mask alone.
assert(model.publicDeck?.coverage>0,'The Simulator retains the explicit public walking deck');
const gate=atlas.visit.qa.almenara;
assert(gate?.walkCenterline?.length>=2,'The Almenara passage publishes its floor centreline');
const walking=createHeritageCollision({walkBarriers:[model.walkBarriers]}),floorMeshes=[];
atlas.castle.traverse(m=>{if(m.isMesh&&m.userData.component==='almenara-suelo')floorMeshes.push(m);});
assert(floorMeshes.length,'The actual Almenara floor is present in the source model');
const floorRay=new THREE.Raycaster(),passageSamples=[];
let maxDeckError=0,missingDeck=0,blocked=0,missingMask=0;
const c=Math.cos(gate.yaw),s=Math.sin(gate.yaw),line=gate.walkCenterline,lane=Math.max(0,gate.walkWidth/2-.30);
for(let k=0;k<line.length-1;k++){
 const a=new THREE.Vector3(...line[k]),b=new THREE.Vector3(...line[k+1]),delta=b.clone().sub(a),length=Math.hypot(delta.x,delta.z),count=Math.max(1,Math.ceil(length/.45));
 const side=new THREE.Vector3(-delta.z/length,0,delta.x/length);
 for(let i=0;i<=count;i++)for(const lateral of[-lane,0,lane]){
  const p=a.clone().lerp(b,i/count).addScaledVector(side,lateral),dx=p.x-gate.x,dz=p.z-gate.z,v=dx*s+dz*c;
  if(v>-.15||v<-(gate.passageDepth-.15))continue;
  floorRay.set(p.clone().add(new THREE.Vector3(0,1,0)),new THREE.Vector3(0,-1,0));floorRay.near=0;floorRay.far=2;
  const hit=floorRay.intersectObjects(floorMeshes,false)[0];assert(hit,'Atlas passage has a floor beneath each walker sample');
  const w=frame.world(p.x,p.z),deck=heightOnPavement(model.publicDeck,w.x,w.z),mask=heightOnPavement(paving,w.x,w.z);
  if(deck===null)missingDeck++;else maxDeckError=Math.max(maxDeckError,Math.abs(deck-hit.point.y));
  if(mask===null)missingMask++;
  const safe=walking.safeToWalk(w.x,w.z,.30,deck??hit.point.y);if(!safe)blocked++;
  passageSamples.push({segment:k,lateral,v,x:p.x,z:p.z,atlasFloor:hit.point.y,simulatorDeck:deck,mask,safe});
 }
}
const passage={samples:passageSamples.length,missingDeck,missingMask,blocked,checks:passageSamples};
if(missingDeck||missingMask||blocked||maxDeckError>=.13){
 fs.writeFileSync(output('castle-simulator-qa.json'),JSON.stringify({pass:false,
  method:'Actual buildHeritageModel(castle), final Atlas terrain and publicDeck, actual pedestrian collision query',
  passage,maxDeckError},null,2)+'\n');
}
assert(passageSamples.length>30,'The complete gate passage receives longitudinal and lateral samples');
assert.equal(missingDeck,0,'The walking deck covers the full gate passage');
assert.equal(missingMask,0,'The ground mask suppresses generic roads throughout the passage');
assert(maxDeckError<.13,'The sampled Simulator deck follows the Atlas passage floor');
assert.equal(blocked,0,'Actual Simulator heritage collision permits the walking corridor');
// Verify the ungraded streaming input as well as the final-terrain registration
// above. The new correction must produce distinct archaeological levels and
// leave the rest of the hill untouched.
const ground=createCastleGround({project:sourceProject,heightAt:atlas.heightAt});
assert.equal(ground.pregraded,false,'Raw IGN input requires the local forum accommodation');
const rawTerritoryHeight=(x,z)=>{const p=inverse(x,z);return atlas.heightAt(p.x,p.z);};
const relief=heritageRelief('castle',{castle:{group:{userData:{ground}}}},frame,place,rawTerritoryHeight,atlas.heightAt);
assert(relief.delta.some(value=>value>1),'Simulator relief raises the DEM fold under the central forum');
let maxTerraceError=0,maxReliefError=0;const sectorLevels=[];
for(const sector of ground.sectors){
 const n=sector.polygon.length,center=sector.polygon.reduce((s,p)=>({x:s.x+p.x/n,z:s.z+p.z/n}),{x:0,z:0});
 const points=[center,...sector.polygon.map(p=>({x:center.x+(p.x-center.x)*.25,z:center.z+(p.z-center.z)*.25}))];
 let atlasError=0,simulatorError=0,maxNominalDeviation=0;const samples=[];
 for(const p of points){
  const h=atlas.terrain.meshHeightAt(p.x,p.z),w=frame.world(p.x,p.z),profile=ground.sample(p.x,p.z);
  const simulator=rawTerritoryHeight(w.x,w.z)+reliefDelta(relief,w.x,w.z);
  atlasError=Math.max(atlasError,Math.abs(h-profile));
  simulatorError=Math.max(simulatorError,Math.abs(simulator-profile));
  maxNominalDeviation=Math.max(maxNominalDeviation,Math.abs(h-sector.height));
  samples.push({...p,nominal:sector.height,profile,atlas:h,simulator,atlasError:h-profile,simulatorError:simulator-profile});
  assert(Math.abs(ground.surfaceHeight(p.x,p.z,ground.sample(p.x,p.z))-ground.sample(p.x,p.z))<1e-6,'Grading is idempotent: '+sector.id);
 }
 sectorLevels.push({id:sector.id,height:sector.height,atlasError,simulatorError,maxNominalDeviation,samples});
 maxTerraceError=Math.max(maxTerraceError,atlasError);maxReliefError=Math.max(maxReliefError,simulatorError);
 // Both meshes interpolate their finite grids at excavation banks. The
 // plateau centres must retain their profile level; intermediate bank probes
 // are reported as discretisation differences rather than fictitious stairs.
 check(Math.abs(samples[0].atlasError)<.13,'The final Atlas mesh preserves the central ground profile: '+sector.id,
  {centerError:samples[0].atlasError,maxBankDeviation:atlasError,maxNominalDeviation});
 check(Math.abs(samples[0].simulatorError)<.16,'The Simulator relief preserves the central ground profile: '+sector.id,
  {centerError:samples[0].simulatorError,maxBankDeviation:simulatorError});
}
const centerOf=id=>sectorLevels.find(s=>s.id===id).samples[0];
check(centerOf('foro').atlas-centerOf('templo').atlas>.8,'The temple excavation retains a distinct lower level than the forum',
 {forum:centerOf('foro').atlas,temple:centerOf('templo').atlas});
for(const id of ['ciudadela','dos-mayo','antiquarium']){
 const p=atlas.visit.focuses[id].target,w=frame.world(p.x,p.z);
 assert.equal(ground.sample(p.x,p.z),atlas.heightAt(p.x,p.z),'Retain the original excavation/hill: '+id);
 assert.equal(reliefDelta(relief,w.x,w.z),0,'No simulator relief outside the focused archaeological area: '+id);
}
assert(createCastleGround({project:sourceProject,heightAt:atlas.terrain.meshHeightAt}).pregraded,'Detect and preserve already rendered forum sectors and gate approach');

// Production's worker starts from ungraded MDT, not the final Atlas mesh.
// Exercise that actual constructor separately. Its buffers may legitimately
// differ at the banks; the visitor must still stand on continuous rendered
// floors and pass the real collision query across both approaches.
const rawModel=await constructSimulator(rawTerritoryHeight);
assert(rawModel,'The production-style raw-MDT constructor returns the castle');
rawModel.group.updateMatrixWorld(true);
let rawGate,rawEast,rawVisit;
const rawFloors=[];
rawModel.group.traverse(m=>{
 if(m.userData.visit?.qa?.almenara)rawGate=m.userData.visit.qa.almenara;
 if(m.userData.visit?.qa?.east){rawEast=m.userData.visit.qa.east;rawVisit=m.userData.visit;}
 if(m.isMesh&&(m.userData.publicWalkingSurface===true||m.userData.component==='caminos'&&m.userData.materialKind==='path'))rawFloors.push(m);
});
assert(rawGate?.walkCenterline?.length>=2,'Raw-MDT model retains the passage contract');
const rawWalking=createHeritageCollision({walkBarriers:[rawModel.walkBarriers]}),rawRay=new THREE.Raycaster();
// Architecture stores independently triangulated floors in Float32 buffers.
// A ray exactly on a shared edge can miss both faces by a few micrometres after
// metric registration. Recheck only such misses within 0.1 mm; retain the same
// support-height threshold and record every fallback instead of treating the
// coarser terrain below an edge as the walking surface.
const edgeProbeToleranceM=.0001;
const rawPassage={samples:[],missingDeck:0,missingMask:0,blocked:0,headBlocked:0,maxSupportError:0,maxFootJump:0,buriedFloors:0,edgeProbeToleranceM,edgeProbeFallbacks:0};
const rawLane=Math.max(0,rawGate.walkWidth/2-.30),rc=Math.cos(rawGate.yaw),rs=Math.sin(rawGate.yaw);
for(let k=0;k<rawGate.walkCenterline.length-1;k++){
 const a=new THREE.Vector3(...rawGate.walkCenterline[k]),b=new THREE.Vector3(...rawGate.walkCenterline[k+1]),delta=b.clone().sub(a),length=Math.hypot(delta.x,delta.z);
 if(length<.05)continue;
 const side=new THREE.Vector3(-delta.z/length,0,delta.x/length),count=Math.max(1,Math.ceil(length/.25));
 for(const lateral of[-rawLane,0,rawLane]){let previous=null;
  for(let i=0;i<=count;i++){
   const p=a.clone().lerp(b,i/count).addScaledVector(side,lateral),w=frame.world(p.x,p.z);
   const dx=p.x-rawGate.x,dz=p.z-rawGate.z,v=dx*rs+dz*rc,inside=v<-.15&&v>-(rawGate.passageDepth-.15);
   const deck=heightOnPavement(rawModel.publicDeck,w.x,w.z),mask=heightOnPavement(rawModel.pavement,w.x,w.z);
   const terrain=rawTerritoryHeight(w.x,w.z)+reliefDelta(rawModel.relief,w.x,w.z),feet=deck??mask??terrain;
   rawRay.set(new THREE.Vector3(w.x,p.y+.65,w.z),new THREE.Vector3(0,-1,0));rawRay.near=0;rawRay.far=2;
   let floor=rawRay.intersectObjects(rawFloors,false)[0],edgeProbeFallback=false;
   if(!floor){
    const edgeHits=[];
    for(const [dx,dz]of [[edgeProbeToleranceM,0],[-edgeProbeToleranceM,0],[0,edgeProbeToleranceM],[0,-edgeProbeToleranceM]]){
     rawRay.set(new THREE.Vector3(w.x+dx,p.y+.65,w.z+dz),new THREE.Vector3(0,-1,0));
     const hit=rawRay.intersectObjects(rawFloors,false)[0];if(hit)edgeHits.push(hit);
    }
    if(edgeHits.length){floor=edgeHits.sort((a,b)=>b.point.y-a.point.y)[0];edgeProbeFallback=true;rawPassage.edgeProbeFallbacks++;}
   }
   const rendered=Math.max(terrain,floor?.point.y??-Infinity),supportError=Math.abs(feet-rendered);
   const safe=rawWalking.safeToWalk(w.x,w.z,.30,feet);
   rawRay.set(new THREE.Vector3(w.x,feet+.035,w.z),new THREE.Vector3(0,1,0));rawRay.near=0;rawRay.far=1.82;
   const head=rawRay.intersectObject(rawModel.group,true)[0];
   if(inside&&deck===null)rawPassage.missingDeck++;
   if(inside&&mask===null)rawPassage.missingMask++;
   if(!safe)rawPassage.blocked++;
   if(head)rawPassage.headBlocked++;
   if(inside&&floor&&floor.point.y<terrain-.04)rawPassage.buriedFloors++;
   rawPassage.maxSupportError=Math.max(rawPassage.maxSupportError,supportError);
   if(previous!==null)rawPassage.maxFootJump=Math.max(rawPassage.maxFootJump,Math.abs(feet-previous));
   rawPassage.samples.push({segment:k,lateral,v,x:p.x,z:p.z,inside,deck,mask,terrain,rendered,feet,supportError,safe,headClear:!head,...(head?{headHit:head.object.name}:{}),...(edgeProbeFallback?{edgeProbeFallback:true}:{})});
   previous=feet;
  }
 }
}
check(rawModel.publicDeck?.coverage>0&&rawPassage.samples.length>150,'Raw-MDT constructor publishes and samples its full walking corridor');
check(rawPassage.missingDeck===0&&rawPassage.missingMask===0,'Raw-MDT passage has both a walking deck and a ground mask',rawPassage);
check(rawPassage.maxSupportError<.13&&!rawPassage.buriedFloors,'Raw-MDT pedestrian feet follow the actual rendered floor',
 {maxSupportError:rawPassage.maxSupportError,buriedFloors:rawPassage.buriedFloors});
check(!rawPassage.blocked&&!rawPassage.headBlocked,'Raw-MDT terrain, architecture and collision allow the complete walking corridor',
 {blocked:rawPassage.blocked,headBlocked:rawPassage.headBlocked});
check(rawPassage.maxFootJump<=.245,'Raw-MDT passage and both approaches have no accidental stair-height jump',
 {maxFootJump:rawPassage.maxFootJump,sampleStep:.25});

// Permanent deposits remain physically open in the Atlas and registered as
// polygon cuts in the Simulator. Their floors do not become public decks.
const deposits=[],depositRay=new THREE.Raycaster(),masks=atlas.castle.userData.currentMasks||[];
check(masks.length>0&&atlas.easternExcavation.removedTriangles>0,'The eastern open deposit subtracts real Atlas terrain triangles');
function expectedCutFloor(cut,p){
 const entry=atlas.visit.qa.east.exterior?.bunkers?.find(b=>b.id===cut.id)?.entrySurface;
 if(!entry)return cut.floorY;
 const area=entry.reduce((s,v,i)=>s+v[0]*entry[(i+1)%entry.length][2]-entry[(i+1)%entry.length][0]*v[2],0),vertices=area>0?[...entry].reverse():entry;
 for(const ids of [[0,1,2],[0,2,3]]){
  const [a,b,c]=ids.map(i=>vertices[i]),den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
  if(Math.abs(den)<1e-10)continue;
  const u=((b[2]-c[2])*(p.x-c[0])+(c[0]-b[0])*(p.z-c[2]))/den,v=((c[2]-a[2])*(p.x-c[0])+(a[0]-c[0])*(p.z-c[2]))/den,w=1-u-v;
  if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7)return a[1]*u+b[1]*v+c[1]*w;
 }
 return cut.floorY;
}
for(const cut of masks){
 const probes=excavationTriangles(cut).map(t=>t.reduce((p,v)=>({x:p.x+v.x/3,z:p.z+v.z/3}),{x:0,z:0}));
 const result={id:cut.id,probes:probes.length,atlasTerrainHits:0,missingFloor:0,maxFloorError:0,missingFinalNativeCuts:0,missingRawNativeCuts:0};
 for(const p of probes){
  depositRay.set(new THREE.Vector3(p.x,cut.floorY+12,p.z),new THREE.Vector3(0,-1,0));depositRay.near=0;depositRay.far=20;
  if(depositRay.intersectObject(atlas.terrainMesh,false).length)result.atlasTerrainHits++;
  const expectedFloor=expectedCutFloor(cut,p),floor=depositRay.intersectObject(atlas.castle,true).find(hit=>hit.object.isMesh&&Math.abs(hit.point.y-expectedFloor)<.10);
  if(!floor)result.missingFloor++;else result.maxFloorError=Math.max(result.maxFloorError,Math.abs(floor.point.y-expectedFloor));
  const w=frame.world(p.x,p.z);
  if(!model.relief.triangleCuts.some(t=>insideTriangleCut(t,w.x,w.z)))result.missingFinalNativeCuts++;
  if(!rawModel.relief.triangleCuts.some(t=>insideTriangleCut(t,w.x,w.z)))result.missingRawNativeCuts++;
 }
 check(!result.atlasTerrainHits&&!result.missingFloor&&!result.missingFinalNativeCuts&&!result.missingRawNativeCuts,'Open deposit has a visible floor and matching native polygon cuts: '+cut.id,result);
 deposits.push(result);
}

function validateEastPaths(native,sourceEast,sourceVisit,sampler,label){
 assert(sourceEast?.walkingRoutes?.length===2,'Two mapped eastern routes: '+label);
 const collision=createHeritageCollision({walkBarriers:[native.walkBarriers]}),routes=[];
 const floors=[],solid=[],probeRay=new THREE.Raycaster();
 native.group.traverse(m=>{if(m.isMesh){const item={mesh:m,box:new THREE.Box3().setFromObject(m)};
  if(m.userData.publicWalkingSurface===true||m.userData.component==='caminos'&&m.userData.materialKind==='path')floors.push(item);else solid.push(item);
 }});
 function floorAt(x,z,y){
  const candidates=floors.filter(o=>x>=o.box.min.x-.0001&&x<=o.box.max.x+.0001&&z>=o.box.min.z-.0001&&z<=o.box.max.z+.0001).map(o=>o.mesh);
  probeRay.set(new THREE.Vector3(x,y+5,z),new THREE.Vector3(0,-1,0));probeRay.near=0;probeRay.far=12;
  return probeRay.intersectObjects(candidates,false)[0]?.point.y??null;
 }
 function nearbyBlockers(x,z,feet){
  const candidates=solid.filter(o=>x>=o.box.min.x-.5&&x<=o.box.max.x+.5&&z>=o.box.min.z-.5&&z<=o.box.max.z+.5).map(o=>o.mesh),found=new Set();
  for(const y of[feet+.55,feet+1.35])for(let i=0;i<8;i++){
   const angle=i*Math.PI/4,dx=Math.cos(angle),dz=Math.sin(angle);
   probeRay.set(new THREE.Vector3(x+dx,y,z+dz),new THREE.Vector3(-dx,0,-dz));probeRay.near=0;probeRay.far=1.5;
   for(const hit of probeRay.intersectObjects(candidates,false))if(Math.hypot(hit.point.x-x,hit.point.z-z)<.45)found.add(hit.object.userData.component+'|'+hit.object.userData.materialKind);
  }
  return [...found];
 }
 for(const route of sourceEast.walkingRoutes){
  const result={id:route.id,samples:0,unmaskedCornerSamples:0,blocked:0,inDeposit:0,maxSupportError:0,maxTerrainAboveFloor:0,failures:[]};
  for(const [x,y,z] of route.points){
   const w=frame.world(x,z),deck=heightOnPavement(native.publicDeck,w.x,w.z),mask=heightOnPavement(native.pavement,w.x,w.z),terrain=sampler(w.x,w.z)+reliefDelta(native.relief,w.x,w.z),feet=deck??mask??terrain;
   const renderedFloor=floorAt(w.x,w.z,y),rendered=Math.max(terrain,renderedFloor??-Infinity),supportError=Math.abs(feet-rendered),safe=collision.safeToWalk(w.x,w.z,.30,feet),inDeposit=masks.some(cut=>insideExcavation(cut,x,z));
   result.samples++;result.maxSupportError=Math.max(result.maxSupportError,supportError);result.maxTerrainAboveFloor=Math.max(result.maxTerrainAboveFloor,terrain-(renderedFloor??terrain));
   // A mask cell at a sharp route vertex can be empty. Natural terrain is
   // still valid support; measure the real rendered floor discrepancy below.
   if(deck===null&&mask===null)result.unmaskedCornerSamples++;
   if(!safe)result.blocked++;
   if(inDeposit)result.inDeposit++;
   if(!safe||inDeposit||supportError>.16)result.failures.push({x,z,authoredPath:y,renderedFloor,feet,terrain,deck,mask,safe,inDeposit,supportError,...(!safe?{blockers:nearbyBlockers(w.x,w.z,feet)}:{})});
  }
  check(!result.blocked&&!result.inDeposit&&result.maxSupportError<.16,'Eastern route supports a visitor and clears walls: '+label+'/'+route.id,result);
  routes.push(result);
 }
 const eyes=[];
 for(const id of ['almenara','almenara-bateria','almenara-aljibes','almenara-baluarte','almenara-dependencias']){
  const focus=sourceVisit.focuses[id],eye=focus.target.clone().add(new THREE.Vector3(...focus.closeOffset)),w=frame.world(eye.x,eye.z);
  const deck=heightOnPavement(native.publicDeck,w.x,w.z),mask=heightOnPavement(native.pavement,w.x,w.z),terrain=sampler(w.x,w.z)+reliefDelta(native.relief,w.x,w.z),feet=deck??mask??terrain;
  const clearance=eye.y-feet,safe=collision.safeToWalk(w.x,w.z,.30,feet),inDeposit=masks.some(cut=>insideExcavation(cut,eye.x,eye.z));
  const sample={id,x:eye.x,z:eye.z,feet,eyeY:eye.y,clearance,safe,inDeposit};
  check(safe&&!inDeposit&&clearance>=1.65&&clearance<=2.35,'Eastern authored eye remains usable in the actual Simulator: '+label+'/'+id,sample);eyes.push(sample);
 }
 return {routes,eyes};
}
const easternWalking={finalTerrain:validateEastPaths(model,atlas.visit.qa.east,atlas.visit,heightAt,'final-terrain'),rawTerrain:validateEastPaths(rawModel,rawEast,rawVisit,rawTerritoryHeight,'raw-MDT')};
const sourceFiles=fs.readdirSync(path.join(root,'dist/js')).filter(f=>/^castle.*\.js$/.test(f)).map(f=>'dist/js/'+f);
sourceFiles.push('dist/js/monuments.js','dist/js/territory-heritage-models.js','dist/js/territory-heritage-relief.js','dist/js/territory-heritage-paving.js','dist/js/territory-collision-heritage.js');
const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const report={pass:errors.length===0,method:'Actual buildHeritageModel(castle), local source assets, final Atlas terrain, CPU geometry comparison',checks,errors,
 sourceHashes,architecturalMeshes:matched,maxBufferError,maxRegistrationErrorM:maxRegistrationError,
 preservedStopIds,addedEasternStops,mappedPaths:model.contextStats.paths,mappedBuildings:model.contextStats.mappedBuildings,
 pavement:{coverageCells:paving.coverage,cellSizeM:paving.metres,emptyCells},
 publicDeck:{coverageCells:model.publicDeck.coverage,cellSizeM:model.publicDeck.metres,maxPassageErrorM:maxDeckError},
 passage,
 rawInputPassage:{...rawPassage,publicDeckCells:rawModel.publicDeck?.coverage,walkBarrierValues:rawModel.walkBarriers.length},
 easternWalking,openDeposits:{atlasTriangleSubtraction:atlas.easternExcavation,finalNativeTriangles:model.relief.triangleCuts.length,rawNativeTriangles:rawModel.relief.triangleCuts.length,deposits},
 forumTerrace:{levelM:ground.level,interpretiveAltitude:true,maxFinalMeshErrorM:maxTerraceError,maxSimulatorReliefErrorM:maxReliefError,
  sectorLevels,profileComparison:'Strict plateau-centre checks; finite-grid bank deviations recorded separately; physical walking continuity checked on both constructors',excavatedLevelsDifferentiated:true,otherHillSectorsUnchanged:true,pregradedInputPreserved:true},
 collisionValues:model.walkBarriers.length,batches:details,
 limitations:['No WebGL/WebGPU rendering performed by this CPU check.','Camera vertical-offset registration is checked separately.',
  'The 2.5 m Atlas terrain and approximately 1.25 m Simulator relief interpolate archaeological banks; pointwise deviations from the analytical profile are reported and are not surveyed elevations.']};
fs.writeFileSync(output('castle-simulator-qa.json'),JSON.stringify(report,null,2)+'\n');
if(!errors.length)fs.rmSync(output('simulator-failure-checkpoint.json'),{force:true});
if(process.env.SAGUNTUM_CASTLE_QA_RETAIN_MODELS!=='1'){releaseModel(model.group);releaseModel(rawModel.group);}
console.log(JSON.stringify({pass:report.pass,checks:checks.length,errors,architecturalMeshes:matched,maxBufferError,maxRegistrationErrorM:maxRegistrationError,
 preservedStopIds,addedEasternStops,mappedPaths:model.contextStats.paths,publicDeck:report.publicDeck,
 rawInputPassage:{...rawPassage,samples:rawPassage.samples.length},
 output:output('castle-simulator-qa.json')},null,2));
if(errors.length)process.exitCode=1;
export {atlas,model,rawModel,frame,report,releaseModel,THREE,sourceProject,heightAt,rawTerritoryHeight,createHeritageCollision,reliefDelta,heightOnPavement};
