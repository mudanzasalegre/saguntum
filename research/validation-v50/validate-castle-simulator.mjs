// Exercise the real Simulator constructor with the Atlas' final rendered ground.
// CPU registration and surface-mask checks; no GPU rendering is asserted.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {root,data,THREE,project as sourceProject,buildCastleScene} from './castle-scene.mjs';
import {createCastleGround} from '../../dist/js/castle-ground.js';
import {heritageRelief,reliefDelta} from '../../dist/js/territory-heritage-relief.js';
const atlas=await buildCastleScene();
const [{buildHeritageModel,releaseModel},{registerFrame},{project},{heightOnPavement}]=await Promise.all([
 import('../../dist/js/territory-heritage-models.js'),import('../../dist/js/territory-heritage-catalog.js'),
 import('../../dist/js/territory-coordinates.js'),import('../../dist/js/territory-heritage-paving.js')]);
const [lon,lat]=[-.279179,39.67591];
const place={id:'castle',name:'Castillo de Sagunto',lon,lat,...project(lon,lat)};
const frame=registerFrame(place,project),det=frame.a*frame.d-frame.b*frame.c;
const inverse=(x,z)=>({x:((x-frame.tx)*frame.d-(z-frame.tz)*frame.b)/det,
 z:(frame.a*(z-frame.tz)-frame.c*(x-frame.tx))/det});
const heightAt=(x,z)=>{const p=inverse(x,z);return atlas.terrain.meshHeightAt(p.x,p.z);};
const oldFetch=globalThis.fetch,oldDocument=globalThis.document;
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
globalThis.fetch=async input=>{
 const url=new URL(String(input)),file=fileURLToPath(url);
 assert(file.startsWith(path.join(root,'dist/assets/')),'Read only repository source assets');
 return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});
};
let model;
try{
 model=await buildHeritageModel('castle',{places:[place],records:{castle:{id:'castle',coordinate:[lon,lat]}},
  area:data('historic-context'),heightAt,project,needed:()=>true});
}finally{
 globalThis.fetch=oldFetch;
 if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
}
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
 let maximum=0;
 for(const name of ['position','normal','uv','color']){
  const actual=o.geometry.attributes[name].array,expected=original.geometry.attributes[name].array;
  assert.equal(actual.length,expected.length,'Same '+name+' length: '+key);
  for(let i=0;i<actual.length;i++)maximum=Math.max(maximum,Math.abs(actual[i]-expected[i]));
 }
 // World coordinates are baked into this model. Inverting UTM can move a
 // Float32 coordinate by one ULP; compare geometrically rather than hashing.
 assert(maximum<.0001,'Same geometry within Float32 registration: '+key+' ('+maximum+')');
 maxBufferError=Math.max(maxBufferError,maximum);
 for(const vertex of [0,Math.floor(o.geometry.attributes.position.count/2),o.geometry.attributes.position.count-1]){
  const a=new THREE.Vector3().fromBufferAttribute(original.geometry.attributes.position,vertex).applyMatrix4(original.matrixWorld);
  const actual=new THREE.Vector3().fromBufferAttribute(o.geometry.attributes.position,vertex).applyMatrix4(o.matrixWorld),p=frame.world(a.x,a.z);
  const error=actual.distanceTo(new THREE.Vector3(p.x,a.y,p.z));
  assert(error<.0001,'Metric registration: '+key);maxRegistrationError=Math.max(maxRegistrationError,error);
 }
 details.push({batch:key,maximumBufferDifference:maximum});matched++;
});
assert.equal(matched,atlasMeshes.size,'Every architecture and path batch is present in the Simulator');
assert.equal(Object.keys(atlas.visit.focuses).length,18);
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
// Verify the ungraded streaming input as well as the final-terrain registration
// above. The new correction must produce a terrace, retain excavations, and
// leave the rest of the hill untouched.
const ground=createCastleGround({project:sourceProject,heightAt:atlas.heightAt});
assert.equal(ground.pregraded,false,'Raw IGN input requires the local forum accommodation');
const rawTerritoryHeight=(x,z)=>{const p=inverse(x,z);return atlas.heightAt(p.x,p.z);};
const relief=heritageRelief('castle',{castle:{group:{userData:{ground}}}},frame,place,rawTerritoryHeight,atlas.heightAt);
assert(relief.delta.some(value=>value>1),'Simulator relief raises the DEM fold under the central forum');
const center=ground.polygon.reduce((s,p)=>({x:s.x+p.x/4,z:s.z+p.z/4}),{x:0,z:0});
const terraceSamples=ground.polygon.map(p=>({x:center.x+(p.x-center.x)*.6,z:center.z+(p.z-center.z)*.6}));
let maxTerraceError=0,maxReliefError=0;
for(const p of terraceSamples){
 const h=atlas.terrain.meshHeightAt(p.x,p.z),w=frame.world(p.x,p.z);
 maxTerraceError=Math.max(maxTerraceError,Math.abs(h-ground.level));
 maxReliefError=Math.max(maxReliefError,Math.abs(rawTerritoryHeight(w.x,w.z)+reliefDelta(relief,w.x,w.z)-ground.level));
 assert.equal(ground.surfaceHeight(p.x,p.z,ground.sample(p.x,p.z)),ground.sample(p.x,p.z),'Grading is idempotent');
}
assert(maxTerraceError<.035,'The actual final Atlas mesh has a level central forum');
assert(maxReliefError<.06,'Simulator relief preserves the same terrace level');
for(const id of ['templo','basilica','ciudadela','dos-mayo']){
 const p=atlas.visit.focuses[id].target,w=frame.world(p.x,p.z);
 assert.equal(ground.sample(p.x,p.z),atlas.heightAt(p.x,p.z),'Retain the original excavation/hill: '+id);
 assert.equal(reliefDelta(relief,w.x,w.z),0,'No simulator relief outside the forum: '+id);
}
assert(createCastleGround({project:sourceProject,heightAt:atlas.terrain.meshHeightAt}).pregraded,'Detect and preserve an already rendered terrace');
const report={pass:true,method:'Actual buildHeritageModel(castle), local source assets, final Atlas terrain, CPU geometry comparison',
 architecturalMeshes:matched,maxBufferError,maxRegistrationErrorM:maxRegistrationError,
 preservedStopIds:18,mappedPaths:model.contextStats.paths,mappedBuildings:model.contextStats.mappedBuildings,
 pavement:{coverageCells:paving.coverage,cellSizeM:paving.metres,emptyCells},
 forumTerrace:{levelM:ground.level,interpretiveAltitude:true,maxFinalMeshErrorM:maxTerraceError,maxSimulatorReliefErrorM:maxReliefError,
  templeAndBasilicaRetained:true,otherHillSectorsUnchanged:true,pregradedInputPreserved:true},
 collisionValues:model.walkBarriers.length,batches:details,
 limitations:['No WebGL/WebGPU rendering performed by this CPU check.','Camera vertical-offset registration is checked separately.']};
fs.writeFileSync(path.join(root,'research/validation-v50/castle-simulator-qa.json'),JSON.stringify(report,null,2)+'\n');
releaseModel(model.group);
console.log(JSON.stringify({...report,batches:undefined},null,2));
