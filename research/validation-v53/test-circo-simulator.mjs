// Exercise the authored model, temporary cut, local context and walking floor.
// This is a CPU test; it does not claim that a GPU scene has rendered.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {THREE,root,data,canvasRuntime} from './circo-scene.mjs';
const [{createHeightSampler},{project},{registerFrame,loadHeritageCatalog},{buildHeritageModel,releaseModel},
 {bindHeritageVisit},{sectionWindow},{sampleHeritageBarriers,createHeritageCollision},
 {heightOnPavement},{insideExcavation,excavationPlanes,createExcavationController},{conservationGround}]=await Promise.all([
 import('../../dist/js/terrain.js'),import('../../dist/js/territory-coordinates.js'),import('../../dist/js/territory-heritage-catalog.js'),
 import('../../dist/js/territory-heritage-models.js'),import('../../dist/js/territory-heritage-visit.js'),
 import('../../dist/js/territory-heritage-section.js'),import('../../dist/js/territory-collision-heritage.js'),
 import('../../dist/js/territory-heritage-paving.js'),import('../../dist/js/excavation.js'),import('../../dist/js/territory-heritage-ground.js')]);
const previousFetch=globalThis.fetch,previousDocument=globalThis.document,canvas=canvasRuntime();
const dataRoot=new URL('../../dist/assets/data/',import.meta.url);
globalThis.document={createElement:()=>canvas.createCanvas(512,512)};
globalThis.fetch=async input=>{const url=new URL(input);assert(url.protocol==='file:'&&url.href.startsWith(dataRoot.href));return new Response(await fs.readFile(url),{headers:{'Content-Type':'application/json'}});};
let model;
try{
 const catalog=await loadHeritageCatalog(project),place=catalog.places.find(p=>p.id==='circo'),frame=registerFrame(place,project);
 assert.equal(place.number,11);assert.equal(catalog.places.length,33);
 const raw=createHeightSampler(data('elevation')),det=frame.a*frame.d-frame.b*frame.c;
 const inverse=(x,z)=>({x:((x-frame.tx)*frame.d-(z-frame.tz)*frame.b)/det,z:((z-frame.tz)*frame.a-(x-frame.tx)*frame.c)/det});
 const heightAt=(x,z)=>{const q=inverse(x,z);return raw(q.x,q.z);};
 let sites;
 model=await buildHeritageModel('circo',{...catalog,project,heightAt,needed:()=>true,
  bindVisit:options=>{sites=options.sites;bindHeritageVisit(options);},renderer:{localClippingEnabled:false,shadowMap:{needsUpdate:false}}});
 const site=sites.circo,visit=site.visit,guide=data('circo-visit'),permanent=model.relief;
 assert.equal(guide.stops.length,20);assert.equal(site.historicalMask.outline.length,51);
 assert.equal(excavationPlanes(site.historicalMask).length,51);
 const modes=[];
 for(const stop of guide.stops){
  const state=model.setVisitStop('circo',stop.id),focus=visit.focuses[stop.id];
  assert(focus);assert.equal(state.mode,focus.recommendedMode||'current');
  assert.equal(site.reconstruction.visible,state.mode==='historical');
  assert.equal(site.modern.visible,state.mode!=='historical');
  if(state.mode==='historical')assert.equal(model.relief.triangleCuts.length,49);
  else assert.equal(model.relief,permanent);
  modes.push({stop:stop.id,mode:state.mode});
 }
 assert.equal(modes.filter(s=>s.mode==='historical').length,6);
 const state=model.setVisitStop('circo','circo-historica'),window=sectionWindow(),participation=window.model(model);
 participation.value=0;window.set(state.contextCut);
 assert.equal(state.contextCut.triangles.length,49);assert(model.historicalPublicDeck?.coverage>0);
 const guard=conservationGround({group:new THREE.Group(),material:new THREE.MeshStandardMaterial(),heightAt,bounds:[-20000,-20000,20000,20000]});
 guard.setSource({relief:[model.relief]});
 const floor=(x,z)=>heightOnPavement(model.historicalPublicDeck,x,z)??heightAt(x,z);
 const contextMeshes=new Set();model.contextGroup.traverse(mesh=>contextMeshes.add(mesh));
 const ancient=sampleHeritageBarriers(model.group,floor,mesh=>!contextMeshes.has(mesh));
 const city=sampleHeritageBarriers(model.contextGroup,heightAt),clipped=window.clipBarriers(city);
 assert(clipped.length<city.length,'Modern physical barriers are removed inside the historical window');
 const collision=createHeritageCollision({walkBarriers:[ancient,clipped]});
 const origin=visit.qa.circus.frame,c=Math.cos(origin.yaw),s=Math.sin(origin.yaw),walking=[];
 for(const u of [-105,-65,-20,25,65,95])for(const v of [-15,16]){
  const local={x:origin.x+u*c+v*s,z:origin.z-u*s+v*c},world=frame.world(local.x,local.z);
  assert(insideExcavation(site.historicalMask,local.x,local.z));assert(window.contains(world.x,world.z));
  const expected=site.sampleWalkingHeight(local.x,local.z),actual=heightOnPavement(model.historicalPublicDeck,world.x,world.z);
  assert(Number.isFinite(expected)&&Number.isFinite(actual));
  assert(Math.abs(expected-actual)<.03,'Historical public floor agrees with the mesh at '+u+','+v);
  assert(guard.canStand(world.x,world.z,true));
  assert(collision.safeToWalk(world.x,world.z,.32,actual),'Historical lane remains clear at '+u+','+v);
  walking.push({u,v,expectedM:expected,actualM:actual});
 }
 // A long modern wall crossing the window keeps precisely its exterior ends.
 const left={x:origin.x-190*c,z:origin.z+190*s},right={x:origin.x+180*c,z:origin.z-180*s};
 const a=frame.world(left.x,left.z),b=frame.world(right.x,right.z),crossing=new Float32Array([a.x,a.z,50,b.x,b.z,50]);
 assert.equal(window.clipBarriers(crossing).length,12);
 window.set(null);assert.equal(window.clipBarriers(city),city);assert.equal(window.contains(a.x,a.z),false);
 model.setVisitStop('circo','circo-conjunto');assert.equal(model.relief,permanent);assert.equal(site.modern.visible,true);
 model.setVisitStop(null,null);assert.equal(site.reconstruction.visible,false);

 // The Atlas controller restores each original material and layer visibility.
 const scene=new THREE.Scene(),context=new THREE.Group(),material=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(new THREE.BoxGeometry(4,4,4),material);
 const p=site.historicalMask.center;mesh.position.set(p.x,45,p.z);context.add(mesh);context.visible=false;scene.add(site.group,context);
 const ctl=createExcavationController({scene,renderer:{shadowMap:{}},sites:{circo:site},contextRoots:[context],terrainMeshes:[],heightAt:raw});
 for(let i=0;i<3;i++){
  ctl.select('circo',{mode:'historical'});assert.notEqual(mesh.material,material);assert.equal(mesh.material.clippingPlanes.length,51);assert.equal(context.visible,false);
  ctl.setMode('current');assert.equal(mesh.material,material);assert.equal(context.visible,false);
 }
 ctl.select(null);assert.equal(mesh.material,material);ctl.dispose();
 const report={place:'circo',publicNumber:place.number,visits:catalog.places.length,stops:modes,maskVertices:51,maskTriangles:49,
  historicalFloorCells:model.historicalPublicDeck.coverage,walking,ancientBarrierSegments:ancient.length/6,modernBarrierSegments:city.length/6,
  remainingModernBarrierSegments:clipped.length/6,materialRestoreCycles:3,notes:'CPU constructors, registration, clipping, public floors and collision. No GPU rendering claimed.'};
 await fs.writeFile(path.join(root,'research/validation-v53/circo-simulator-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({place:'circo',stops:modes.length,historicalStops:6,maskTriangles:49,walkingSamples:walking.length,
  historicalFloorCells:report.historicalFloorCells,modernSegmentsRemoved:(city.length-clipped.length)/6,restorationCycles:3},null,2));
}finally{
 model?.disposeVisit?.();if(model)releaseModel(model.group);globalThis.fetch=previousFetch;
 if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
}
