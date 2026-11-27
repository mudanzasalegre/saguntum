// Validate the published registration, actual Atlas camera function and
// reversible city cut against the application meshes, without a GPU.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {THREE,root,data,project,buildCircoScene} from './circo-scene.mjs';
const {createExcavationController,insideExcavation,excavationPlanes}=await import('../../dist/js/excavation.js');
const {excavationTriangles}=await import('../../dist/js/polygon-excavation.js');
const {editorialSceneFrame}=await import('../../dist/js/editorial-visibility.js');
const {scene,site,visit,guide,city,archaeology,terrainMesh,urban}=await buildCircoScene({withCity:true});
const registration=JSON.parse(fs.readFileSync(root+'research/validation-v53/circo-registration.json'));
const checks=[],check=(name,fn)=>{fn();checks.push(name);};
const c=visit.qa.circus,frame=c.frame,world=(u,v)=>({x:frame.x+u*Math.cos(frame.yaw)+v*Math.sin(frame.yaw),z:frame.z-u*Math.sin(frame.yaw)+v*Math.cos(frame.yaw)});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
check('The surviving south gate remains the fixed anchor',()=>{
 const p=world(c.gateU,35),expected=registration.preserveCurrentGateRegistration.gateWorldXZ;
 assert(distance(p,{x:expected[0],z:expected[1]})<1e-7);
 assert.equal(visit.qa.frame.yaw,-.307);assert.equal(frame.yaw,-.305);
});
check('Eastern head and spina agree with the digitised primary plan within the declared tolerance',()=>{
 const apex=world(136.5,0),observed=project(...registration.digitisedFigureFeatures.eastApex.coordinate);
 assert(distance(apex,observed)<registration.uncertaintyMeters);
 for(const[end,key]of[[-1,'spinaWestFig16'],[1,'spinaEastFig16']]){
  const actual=world(c.spina.x+end*c.spina.length/2,c.spina.z),source=project(...registration.digitisedFigureFeatures[key].coordinate);
  assert(distance(actual,source)<registration.uncertaintyMeters);
 }
 assert.equal(c.dimensions.length,273);assert.equal(c.dimensions.width,70);assert.equal(c.headDepth,22);
 assert.equal(c.spina.length,151);assert.equal(c.westClosureKnown,false);
 assert.deepEqual(c.dimensions.uncertainLength,[270,290]);assert.equal(c.conservedFoundationLength,237);
});
check('All existing stops and both map scopes remain linked',()=>{
 assert.equal(guide.stops.length,20);assert.equal(new Set(guide.stops.map(s=>s.id)).size,20);
 assert.equal(guide.stops.filter(s=>s.mapScope==='circus').length,6);
 assert.equal(guide.stops.filter(s=>s.mapScope==='gate').length,14);
 const plan=data('circo-plan');assert.equal(plan.historicalEvidence.spinaLength,151);
 assert.equal(plan.historicalOutline.length,51);
 for(const stop of guide.stops){
  assert(visit.focuses[stop.id]);assert(plan.stops.some(s=>s.id===stop.id));
  assert(distance(project(...stop.coordinate),project(...visit.focuses[stop.id].coordinates))<.002);
 }
});
const contextRoots=[city.group,...Object.values(archaeology.sites).filter(s=>s!==site).map(s=>s.group)];
const originals=new Map();scene.traverse(o=>{if(o.isMesh)originals.set(o,{material:o.material,geometry:o.geometry,position:o.position.toArray()});});
const excavation=createExcavationController({scene,renderer:{shadowMap:{}},sites:archaeology.sites,contextRoots,terrainMeshes:[terrainMesh],heightAt:urban.groundHeight});
check('Current view shows remains and contemporary fittings',()=>{
 excavation.select('circo',{mode:'current'});
 assert(site.remains.visible&&site.modern.visible);assert(!site.reconstruction.visible&&!site.hypotheses.visible);
});
excavation.select('circo',{mode:'historical'});
const cut=site.historicalMask,planes=excavationPlanes(cut);
check('The historical layer clears the complete convex footprint and keeps its ground',()=>{
 assert.equal(planes.length,51);assert.equal(excavationTriangles(cut).length,49);
 assert(excavationTriangles(cut).length+excavationTriangles(archaeology.sites['forum-plaza'].currentMask).length<=64);
 assert(site.remains.visible&&site.reconstruction.visible&&site.hypotheses.visible&&!site.modern.visible);
 for(const[u,v]of[[-140,0],[-100,-20],[0,-15],[40,15],[120,0]]){
  const p=world(u,v);assert(insideExcavation(cut,p.x,p.z));assert(planes.every(q=>q.distanceToPoint(new THREE.Vector3(p.x,0,p.z))<=1e-6));
  assert(Number.isFinite(site.sampleWalkingHeight(p.x,p.z)));
 }
 assert(!insideExcavation(cut,world(0,50).x,world(0,50).z));
 assert(terrainMesh.material.clippingPlanes.length===51);
 assert(city.group.children.some(o=>o.isMesh&&o.material.clippingPlanes?.length===51)||[...originals.keys()].some(o=>o.material.clippingPlanes?.length===51));
});
check('Optional elevated hypotheses can be hidden without losing the documented anchor',()=>{
 excavation.setHypotheses(false);assert(!site.hypotheses.visible);assert(site.remains.visible&&site.reconstruction.visible);
 excavation.setHypotheses(true);assert(site.hypotheses.visible);
});
const app=fs.readFileSync(root+'dist/js/app.js','utf8'),start=app.indexOf('function preset('),end=app.indexOf('\nfunction ',start+1),presetSource=app.slice(start,end);
assert(start>=0&&end>start);
const cameras=[];
for(const[width,height]of[[1365,936],[1536,1152],[390,844],[844,390]])for(const collapsed of[false,true]){
 const frameView=editorialSceneFrame(width,height,{collapsed,place:'circo'}),focus=visit.focuses['circo-historica'];
 const args={THREE,innerWidth:width,innerHeight:height,guidedIds:['circo'],guidedVisit:()=>({model:visit,stopId:'circo-historica',overviewId:'circo-conjunto'}),
  points:{circo:site.point},pantalanIds:new Set(),coastModes:{},excavation,selected:'circo',castleFrame:()=>frameView,mobile:()=>width<=700};
 const preset=new Function(...Object.keys(args),'return ('+presetSource+');')(...Object.values(args));
 const cameraSpec=preset('circo'),camera=new THREE.PerspectiveCamera(cameraSpec.fov,width/height,.1,8000);
 camera.position.copy(cameraSpec.position);camera.lookAt(cameraSpec.target);camera.setViewOffset(width,height,frameView.offsetX,frameView.offsetY,width,height);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 let outside=0;
 for(const p of focus.framePoints){const q=p.clone().project(camera),x=(q.x+1)*width/2,y=(1-q.y)*height/2;
  if(x<frameView.left-.01||x>frameView.right+.01||y<frameView.top-.01||y>frameView.bottom+.01||q.z>=1||q.z<=-1)outside++;
 }
 check(`Full circus and uncertain west fit ${width}×${height}, information ${collapsed?'hidden':'shown'}`,()=>assert.equal(outside,0));
 cameras.push({width,height,collapsed,frame:frameView,position:cameraSpec.position.toArray(),target:cameraSpec.target.toArray(),fov:cameraSpec.fov,outside});
}
check('Returning to the current city restores every temporary material and leaves geometry untouched',()=>{
 excavation.select(null);
 for(const[o,before]of originals){assert.equal(o.material,before.material,o.name+' material restored');assert.equal(o.geometry,before.geometry,o.name+' geometry unchanged');assert.deepEqual(o.position.toArray(),before.position);}
 assert(site.modern.visible&&site.remains.visible&&!site.reconstruction.visible&&!site.hypotheses.visible);
});
const sources=['dist/js/circo.js','dist/js/excavation.js','dist/js/app.js','dist/assets/data/circo-plan.json','dist/assets/data/circo-visit.json','dist/assets/data/circo-context.json'];
const report={passed:true,checks,cameras,registration:{gateU:c.gateU,yaw:frame.yaw,headDepth:c.headDepth,spina:c.spina,uncertaintyMeters:registration.uncertaintyMeters},
 sourceHashes:Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(fs.readFileSync(root+p)).digest('hex')])),
 limitation:'CPU checks of application geometry, controller and camera projections. These do not measure browser GPU performance.'};
fs.writeFileSync(root+'research/validation-v53/circo-layer-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:checks.length,cameras:cameras.length}));
