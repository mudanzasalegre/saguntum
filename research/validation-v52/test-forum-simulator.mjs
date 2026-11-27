import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {THREE,root,data,canvasRuntime} from './forum-scene.mjs';
const [{createHeightSampler},{project},{atlasProject,registerFrame,loadHeritageCatalog},
 {buildHeritageModel,releaseModel},{bindHeritageVisit},{heightOnPavement},{conservationGround},{insideTriangleCut},{createHeritageCollision}]=await Promise.all([
 import('../../dist/js/terrain.js'),import('../../dist/js/territory-coordinates.js'),import('../../dist/js/territory-heritage-catalog.js'),
 import('../../dist/js/territory-heritage-models.js'),import('../../dist/js/territory-heritage-visit.js'),
 import('../../dist/js/territory-heritage-paving.js'),import('../../dist/js/territory-heritage-ground.js'),import('../../dist/js/polygon-excavation.js'),import('../../dist/js/territory-collision-heritage.js')]);
const previousFetch=globalThis.fetch,previousDocument=globalThis.document;
const dataRoot=new URL('../../dist/assets/data/',import.meta.url),canvas=canvasRuntime();
globalThis.document={createElement:()=>canvas.createCanvas(512,512)};
globalThis.fetch=async input=>{
 const url=new URL(input);assert(url.href.startsWith(dataRoot.href)&&url.protocol==='file:');
 return new Response(await fs.readFile(url),{headers:{'Content-Type':'application/json'}});
};
let model;
try{
 const catalog=await loadHeritageCatalog(project),place=catalog.places.find(p=>p.id==='forum-plaza'),frame=registerFrame(place,project);
 assert.equal(place.number,12);
 const raw=createHeightSampler(data('elevation')),det=frame.a*frame.d-frame.b*frame.c;
 const inverse=(x,z)=>({x:((x-frame.tx)*frame.d-(z-frame.tz)*frame.b)/det,z:((z-frame.tz)*frame.a-(x-frame.tx)*frame.c)/det});
 const heightAt=(x,z)=>{const q=inverse(x,z);return raw(q.x,q.z);};
 let sites;
 model=await buildHeritageModel('forum-plaza',{...catalog,project,heightAt,needed:()=>true,
  bindVisit:options=>{sites=options.sites;bindHeritageVisit(options);},renderer:{localClippingEnabled:false,shadowMap:{needsUpdate:false}}});
 assert(model&&sites['forum-plaza']);
 const site=sites['forum-plaza'],ground=site.group.userData.ground,visit=site.visit;
 assert.equal(model.relief.cuts.length,0,'No rectangular replacement for the irregular park');
 assert.equal(model.relief.triangleCuts.length,ground.outline.length-2);
 assert(model.relief.delta.length>0&&model.relief.delta.every(Number.isFinite));
 assert(model.pavement?.coverage>0&&model.publicDeck?.coverage>0);
 assert(model.walkBarriers?.length>0);
 const guard=conservationGround({group:new THREE.Group(),material:new THREE.MeshStandardMaterial(),heightAt,bounds:[-20000,-20000,20000,20000]});
 guard.setSource({relief:[model.relief]});
 const collision=createHeritageCollision({walkBarriers:[model.walkBarriers]});
 const routeSamples=[];
 for(const route of ground.routes)for(const fraction of [.15,.45,.75]){
  const distance=fraction*route.length,segment=route.segments.find(s=>distance<=s.start+s.d)||route.segments.at(-1),t=(distance-segment.start)/segment.d;
  const local=ground.world(segment.a[0]+(segment.b[0]-segment.a[0])*t,segment.a[1]+(segment.b[1]-segment.a[1])*t),world=frame.world(local.x,local.z);
  const expected=ground.sampleWalkingHeight(local.x,local.z),actual=heightOnPavement(model.publicDeck,world.x,world.z);
  assert(Number.isFinite(expected)&&Number.isFinite(actual),'Every main route has an explicit public floor: '+route.id);
  if(Math.abs(actual-expected)>=.35){
   const ray=new THREE.Raycaster(new THREE.Vector3(world.x,200,world.z),new THREE.Vector3(0,-1,0));
   console.log('Walking mismatch',route.id,fraction,ground.local(local.x,local.z),ray.intersectObject(model.group,true).filter(hit=>hit.object.userData.publicWalkingSurface).slice(0,4).map(hit=>{
    const p=hit.object.geometry.attributes.position,index=hit.object.geometry.index;
    return {mesh:hit.object.name,height:hit.point.y,triangle:[0,1,2].map(j=>{const v=new THREE.Vector3().fromBufferAttribute(p,index?index.getX(hit.faceIndex*3+j):hit.faceIndex*3+j).applyMatrix4(hit.object.matrixWorld),q=inverse(v.x,v.z);return[...ground.local(q.x,q.z),v.y];})};
   }));
  }
  assert(Math.abs(actual-expected)<.35,'Ramp/stair walking level '+route.id+' '+fraction+' '+actual+' '+expected);
  assert.equal(guard.canStand(world.x,world.z,actual!==null),true);
  assert.equal(collision.safeToWalk(world.x,world.z,.32,actual),true,'Route centreline remains clear of side walls: '+route.id+' '+fraction);
  routeSamples.push({route:route.id,fraction,expectedM:expected,actualM:actual,errorM:Math.abs(actual-expected)});
 }
 for(const [u,v,inside]of[[17,22,true],[2,2,true],[10,35,false],[-4,16,false]]){
  const p=ground.world(u,v),q=frame.world(p.x,p.z);
  assert.equal(ground.contains(p.x,p.z),inside);
  assert.equal(model.relief.triangleCuts.some(cut=>insideTriangleCut(cut,q.x,q.z)),inside,'World-mask registration preserves the building notch');
 }
 const gallerySamples=[];
 for(const [u,v]of[[-1.5,17.98],[0,18.15],[3,18.32],[5.5,18.45],[6.9,19.6],[7,20.6]]){
  const local=ground.world(u,v),world=frame.world(local.x,local.z),height=heightOnPavement(model.publicDeck,world.x,world.z);
  assert(Number.isFinite(height),'The elevated gallery has a public deck');
  assert(Math.abs(height-ground.sampleWalkingHeight(local.x,local.z))<.02,'Gallery floor agrees with its walking profile');
  assert.equal(guard.canStand(world.x,world.z,true),true);
  assert.equal(collision.safeToWalk(world.x,world.z,.32,height),true,'Gallery centreline remains clear of walls/railings at '+u+','+v);
  gallerySamples.push({u,v,heightM:height,clearRadiusM:.32});
 }
 const originalRelief=model.relief;
 for(const stop of data('forum-plaza-visit').stops){
  assert(visit.focuses[stop.id]);
  const state=model.setVisitStop('forum-plaza',stop.id);
  assert.equal(state.stop,stop.id);assert.equal(state.mode,'current');assert.equal(state.section,false);
  assert.equal(model.relief,originalRelief,'Changing a stop keeps the permanent polygon mask');
 }
 model.setVisitStop('forum-plaza',null);
 assert.equal(model.relief,originalRelief);
 assert.equal(visit.focuses['forum-plaza-ciudad-baja'].regionId,'ciudad');
 const report={place:'forum-plaza',publicNumber:place.number,polygonTriangles:model.relief.triangleCuts.length,
  gradeCells:model.relief.delta.length,publicDeckCells:model.publicDeck.coverage,pavementCells:model.pavement.coverage,
  walkingBarrierValues:model.walkBarriers.length,routeSamples,gallerySamples,context:model.contextStats};
 await fs.writeFile(path.join(root,'research/validation-v52/forum-simulator-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({place:report.place,publicNumber:report.publicNumber,polygonTriangles:report.polygonTriangles,publicDeckCells:report.publicDeckCells,
  routeSamples:routeSamples.length,maxWalkingErrorM:Math.max(...routeSamples.map(s=>s.errorM)),gallerySamples:gallerySamples.length,stops:10,groundMasksStable:true},null,2));
}finally{
 model?.disposeVisit?.();if(model)releaseModel(model.group);
 globalThis.fetch=previousFetch;
 if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
}
