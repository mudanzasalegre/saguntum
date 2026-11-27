// Regenerate ONLY Castillo de Sagunto's simulator frames from the current shipped model.
// Run from any directory: node research/validation-v54/export-castle-cameras.mjs
// Verification without modifying the assets: append --check.
// No browser, renderer, WebGL, Playwright, or alternate Three.js build is used.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {THREE, data, root, buildCastleScene} from './castle-scene.mjs';

const id='castle',exteriorId='acceso';
const checkOnly=process.argv.includes('--check');
const dryRun=process.argv.includes('--dry-run');
assert(process.argv.slice(2).every(arg=>['--check','--dry-run'].includes(arg)),'Only --check and --dry-run are supported');
assert(!(checkOnly&&dryRun),'Choose verification or a dry run');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const json=relative=>JSON.parse(read(relative));
const hash=value=>createHash('sha256').update(value).digest('hex');
const round=(n,places=4)=>Number(n.toFixed(places));
const vec=(v,places=4)=>v.toArray().map(n=>round(n,places));
const sizes={wide:{width:1440,height:900},portrait:{width:390,height:844}};
fs.writeFileSync(path.join(root,'research/validation-v54/castle-cameras-qa.json'),JSON.stringify({pass:false,status:'validating-current-source',started:new Date().toISOString()},null,2)+'\n');

const {visit, guide, heightAt, terrain, terrainMesh, castle, monuments, groundBinding}=await buildCastleScene();
const [{editorialSceneFrame},{stopCamera},{registerFrame},{project:territoryProject},{insideExcavation},{sampleHeritageBarriers,createHeritageCollision}]=await Promise.all([
 import('../../dist/js/editorial-visibility.js'),import('../../dist/js/territory-visit-frames.js'),
 import('../../dist/js/territory-heritage-catalog.js'),import('../../dist/js/territory-coordinates.js'),
 import('../../dist/js/excavation.js'),import('../../dist/js/territory-collision-heritage.js')]);
assert.equal(guide.stops.length,22);
assert.deepEqual(Object.keys(visit.focuses).sort(),guide.stops.map(stop=>stop.id).sort());

// Execute the exact current preset() function, isolated from app startup/DOM.
// This deliberately avoids maintaining a second copy of its fitting formula.
// The entrance now shares the authored conjunto viewpoint with its first stop.
const app=read('dist/js/app.js');
const start=app.indexOf('function preset(name,near=false){');
const end=app.indexOf('\nfunction setShadowFraming()',start);
assert(start>=0&&end>start,'Locate the current app.js preset() without guessing its body');
const presetSource=app.slice(start,end);
const presetScript=new vm.Script('('+presetSource+')('+JSON.stringify(id)+',__near)',{filename:'app.js:preset'});
function atlasPose(stopId,size,near=false){
 const {width,height}=size;
 const environment={THREE,selected:id,innerWidth:width,innerHeight:height,
  __near:near,mobile:()=>width<=700,guidedIds:[id],guidedVisit:()=>({id,stopId,overviewId:'conjunto',model:visit}),
  points:monuments.points,pantalanIds:new Set(),excavation:null,
  castleFrame:()=>editorialSceneFrame(width,height,{collapsed:false,place:id})};
 const pose=presetScript.runInNewContext(environment,{timeout:1000});
 assert(pose.target.isVector3&&pose.position.isVector3&&Number.isFinite(pose.fov),'Finite Three.js camera pose');
 return pose;
}
const presentationKeys=['interiorView','requiresSection','roofOpen','mode','archFocus'];
function presentation(focus){
 return Object.fromEntries(presentationKeys.filter(key=>focus[key]!==undefined).map(key=>[key,focus[key]]));
}
function stopFrame(stopId){
 const focus=visit.focuses[stopId],wide=atlasPose(stopId,sizes.wide),portrait=atlasPose(stopId,sizes.portrait);
 assert(wide.target.equals(portrait.target),'Aspect does not change the authored target: '+stopId);
 const entry={target:vec(wide.target),ground:round(heightAt(wide.target.x,wide.target.z)),
  wide:{eye:vec(wide.position),fov:wide.fov}};
 const flags=presentation(focus);
 if(Object.keys(flags).length)entry.presentation=flags;
 entry.portrait={eye:vec(portrait.position),fov:portrait.fov};
 return entry;
}
function overviewFrame(stopId,size){
 const pose=atlasPose(stopId,size);
 return {eye:vec(pose.position,3),target:vec(pose.target,3),fov:pose.fov,
  ground:round(heightAt(pose.target.x,pose.target.z),3)};
}
const camerasPath='dist/assets/territory/visit-cameras.json';
const atlasPath='dist/assets/territory/atlas-frames.json';
const oldCameras=json(camerasPath),oldAtlas=json(atlasPath);
assert(oldCameras[id]&&oldAtlas[id]?.exterior?.stop===exteriorId,'Keep the existing Castillo de Sagunto asset shapes');
const nextCameras=Object.fromEntries(guide.stops.map(stop=>[stop.id,stopFrame(stop.id)]));
const nextAtlas={...oldAtlas[id],wide:overviewFrame(null,sizes.wide),
 exterior:{...oldAtlas[id].exterior,stop:exteriorId,wide:overviewFrame(exteriorId,sizes.wide),portrait:overviewFrame(exteriorId,sizes.portrait)},
 portrait:overviewFrame(null,sizes.portrait)};
const nextStops={regions:guide.regions.map(({id,name})=>({id,name})),stops:guide.stops.map(({id,title,coordinate,coordinates,regionId,intro,period})=>({id,title,coordinate:coordinate||coordinates,regionId,intro,period}))};

// Preserve every byte outside this one top-level value, including any other
// monument's formatting. Assert semantic equality as an additional guard.
function replaceSite(relative,replacement){
 const source=read(relative),parsed=JSON.parse(source),needle=JSON.stringify(id)+':';
 let from=source.indexOf(needle);
 assert(from>=0&&source.indexOf(needle,from+needle.length)<0,'One Castillo de Sagunto top-level key in '+relative);
 from+=needle.length;while(/\s/.test(source[from]))from++;
 assert.equal(source[from],'{');
 let depth=0,inString=false,escaped=false,to=from;
 for(;to<source.length;to++){
  const ch=source[to];
  if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;continue;}
  if(ch==='"'){inString=true;continue;}
  if(ch==='{')depth++;
  if(ch==='}'&&--depth===0){to++;break;}
 }
 assert(depth===0&&to>from,'Find the complete Castillo de Sagunto value');
 const result=source.slice(0,from)+JSON.stringify(replacement)+source.slice(to);
 const others=value=>Object.fromEntries(Object.entries(value).filter(([key])=>key!==id));
 assert.deepEqual(others(JSON.parse(result)),others(parsed),'No other monument changes: '+relative);
 if(checkOnly)assert.deepEqual(parsed[id],replacement,'Stored cameras are current: '+relative);
 else if(!dryRun&&result!==source)fs.writeFileSync(path.join(root,relative),result);
 return {file:relative,otherMonuments:Object.keys(parsed).length-1,
  unchangedOutsideCastle:true,outsideValueSha256:hash(source.slice(0,from)+source.slice(to)),
  otherMonumentsSha256:hash(JSON.stringify(others(parsed)))};
}

// Independent checks cover authored interior eyes, geometric fit and the
// actual simulator adapter, not just equality with this export's own numbers.
const errors=[],samples=[];
const terrainRay=new THREE.Raycaster();
let maxPoseErrorM=0,maxAdapterErrorM=0,maxFovErrorDeg=0;
const coordinateError=(a,b)=>Math.max(...a.map((value,i)=>Math.abs(value-b[i])));
function close(label,actual,expected,tolerance){
 const delta=coordinateError(actual,expected);assert(delta<=tolerance,label+' error '+delta);
 maxPoseErrorM=Math.max(maxPoseErrorM,delta);return delta;
}
const [lon,lat]=[-.279179,39.67591];
const place={id,lon,lat,...territoryProject(lon,lat)},basis=registerFrame(place,territoryProject);
const determinant=basis.a*basis.d-basis.b*basis.c;
const inverse=(x,z)=>({x:((x-basis.tx)*basis.d-(z-basis.tz)*basis.b)/determinant,
 z:(basis.a*(z-basis.tz)-basis.c*(x-basis.tx))/determinant});
// A known, nonzero vertical registration tests that target and eye receive the
// same correction. Horizontal registration is the real simulator UTM adapter.
const elevationShift=7.25;
const simulatorHeightAt=(x,z)=>{const p=inverse(x,z);return heightAt(p.x,p.z)+elevationShift;};
function adapterCheck(stopId,frame,size){
 const actual=stopCamera({id:stopId},place,{heightAt:simulatorHeightAt,project:territoryProject,
  aspect:size.width/size.height,frame});
 const key=size===sizes.wide?'wide':'portrait',p=basis.world(frame.target[0],frame.target[2]);
 const dy=simulatorHeightAt(p.x,p.z)-frame.ground;
 const transform=([x,y,z])=>{const q=basis.world(x,z);return[q.x,y+dy,q.z];};
 const eyeError=coordinateError(actual.eye.toArray(),transform(frame[key].eye));
 const targetError=coordinateError(actual.target.toArray(),transform(frame.target));
 const fovError=Math.abs(actual.fov-frame[key].fov);
 assert(eyeError<1e-8&&targetError<1e-8&&fovError<1e-10,'Simulator frame registration: '+stopId+'/'+key);
 maxAdapterErrorM=Math.max(maxAdapterErrorM,eyeError,targetError);maxFovErrorDeg=Math.max(maxFovErrorDeg,fovError);
 return{eyeErrorM:eyeError,targetErrorM:targetError,fovErrorDeg:fovError};
}
function fitCheck(stopId,size,pose){
 const focus=visit.focuses[stopId||'conjunto'];
 if(focus?.fitBounds===false)return {authoredEye:true};
 const box=focus?.bounds||visit.bounds,points=[...(focus?.framePoints||[])];
 if(!points.length)for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z));
 const {width,height}=size,frame=editorialSceneFrame(width,height,{collapsed:false,place:id});
 const camera=new THREE.PerspectiveCamera(pose.fov,width/height,.12,25000);
 camera.position.copy(pose.position);camera.lookAt(pose.target);camera.setViewOffset(width,height,frame.offsetX,frame.offsetY,width,height);camera.updateMatrixWorld(true);
 for(const point of points){const p=point.clone().project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;
  assert(x>=frame.left-.01&&x<=frame.right+.01&&y>=frame.top-.01&&y<=frame.bottom+.01,
   'Model framing lies in the usable scene: '+(stopId||'overview')+'/'+width+'x'+height);}
 return{fittedPoints:points.length,allWithinOpenPanelFrame:true};
}
for(const stop of guide.stops){
 const frame=nextCameras[stop.id],focus=visit.focuses[stop.id];
 assert.deepEqual(frame.presentation||{},presentation(focus),'Presentation comes from current focus: '+stop.id);
 if(focus.interiorView){
  assert.equal(focus.fitBounds,false);assert.equal(frame.presentation.interiorView,true);assert.equal(frame.presentation.requiresSection,false);
  assert.deepEqual(frame.wide,frame.portrait,'Interior eye/fov cannot scale with aspect: '+stop.id);
  const eye=focus.target.clone().add(new THREE.Vector3(...focus.offset));
  close('Authored interior eye '+stop.id,frame.wide.eye,eye.toArray(),.000051);
  assert.equal(frame.wide.fov,focus.fov);
 }
 for(const [view,size]of Object.entries(sizes)){
  const pose=atlasPose(stop.id,size);
  const direction=pose.target.clone().sub(pose.position);
  terrainRay.set(pose.position,direction.clone().normalize());terrainRay.far=direction.length()-.3;
  assert.equal(terrainRay.intersectObject(terrainMesh,false).length,0,'Camera target is visible above the final terrain: '+stop.id+'/'+view);
  assert(pose.position.y>terrain.meshHeightAt(pose.position.x,pose.position.z)+1.3,'Camera eye clears terrain: '+stop.id+'/'+view);
  const targetError=close(stop.id+' target '+view,frame.target,pose.target.toArray(),.000051);
  const eyeError=close(stop.id+' eye '+view,frame[view].eye,pose.position.toArray(),.000051);
  assert.equal(frame[view].fov,pose.fov);
  assert(Math.abs(frame.ground-heightAt(pose.target.x,pose.target.z))<=.000051,'Ground reference: '+stop.id);
  samples.push({kind:'stop',id:stop.id,view,eyeErrorM:eyeError,targetErrorM:targetError,
   ...fitCheck(stop.id,size,pose),adapter:adapterCheck(stop.id,frame,size)});
 }
}
const interiorIds=guide.stops.map(stop=>stop.id).filter(stopId=>visit.focuses[stopId].interiorView);
for(const [name,stopId,views]of [['overview',null,nextAtlas],['exterior',exteriorId,nextAtlas.exterior]]){
 for(const [view,size]of Object.entries(sizes)){
  const stored=views[view],pose=atlasPose(stopId,size);
  const eyeError=close(name+' eye '+view,stored.eye,pose.position.toArray(),.000501);
  const targetError=close(name+' target '+view,stored.target,pose.target.toArray(),.000501);
  assert.equal(stored.fov,pose.fov);assert(Math.abs(stored.ground-heightAt(pose.target.x,pose.target.z))<=.000501);
  const frame={target:stored.target,ground:stored.ground,wide:{eye:views.wide.eye,fov:views.wide.fov},portrait:{eye:views.portrait.eye,fov:views.portrait.fov}};
  samples.push({kind:name,id:stopId||id,view,eyeErrorM:eyeError,targetErrorM:targetError,
   ...fitCheck(stopId,size,pose),adapter:adapterCheck(stopId||id,frame,size)});
 }
}
assert.equal(samples.length,48,'22 stop cameras + overview + exterior, each in both aspects');
const easternDetails=[];
const easternWalking=createHeritageCollision({walkBarriers:[sampleHeritageBarriers(castle,terrain.meshHeightAt)]});
for(const stopId of ['almenara','almenara-bateria','almenara-aljibes','almenara-baluarte','almenara-dependencias']){
 const focus=visit.focuses[stopId];assert.equal(focus.closeScale,false,'Preserve authored pedestrian eye on mobile: '+stopId);
 let reference;
 for(const [view,size]of Object.entries(sizes)){
  const pose=atlasPose(stopId,size,true),ground=terrain.meshHeightAt(pose.position.x,pose.position.z),clearance=pose.position.y-ground;
  assert(clearance>=1.7&&clearance<=2.3,'Visitor eye above final path terrain: '+stopId+'/'+view+' ('+clearance+')');
  const inDeposit=(castle.userData.currentMasks||[]).some(cut=>insideExcavation(cut,pose.position.x,pose.position.z));
  assert(!inDeposit,'Visitor eye is outside every permanent open deposit: '+stopId+'/'+view);
  assert(easternWalking.safeToWalk(pose.position.x,pose.position.z,.30,ground),'Visitor body clears the actual architectural wall sections: '+stopId+'/'+view);
  const direction=pose.target.clone().sub(pose.position);terrainRay.set(pose.position,direction.clone().normalize());terrainRay.near=0;terrainRay.far=Math.max(0,direction.length()-.3);
  assert.equal(terrainRay.intersectObject(terrainMesh,false).length,0,'Eastern detail sightline clears real terrain: '+stopId+'/'+view);
  const structure=terrainRay.intersectObject(castle,true).find(hit=>hit.object.isMesh);
  assert(!structure,'Eastern detail target is not hidden behind a structure: '+stopId+'/'+view+(structure?' ('+structure.object.userData.component+')':''));
  if(reference)assert(reference.distanceTo(pose.position)<1e-8,'Detail eye stays stationary across aspect ratios: '+stopId);
  reference=pose.position.clone();
  easternDetails.push({id:stopId,view,eye:pose.position.toArray(),target:pose.target.toArray(),clearanceM:clearance,stationaryAcrossAspects:true,terrainLineOfSight:true,outsideDeposits:true,bodyCollisionClear:true,
   nearestStructureOnSightline:structure?{component:structure.object.userData.component,materialKind:structure.object.userData.materialKind,eyeDistance:structure.distance,targetDistance:direction.length()-structure.distance}:null});
 }
}
// Endpoint correctness alone would miss a broken responsive blend. Check an
// intermediate aspect and both clamped extremes through the actual adapter.
const blendSamples=[];
for(const aspect of[.3,.85,2.4])for(const stopId of interiorIds){
 const frame=nextCameras[stopId],pose=stopCamera({id:stopId},place,{heightAt:simulatorHeightAt,project:territoryProject,aspect,frame});
 const reference=stopCamera({id:stopId},place,{heightAt:simulatorHeightAt,project:territoryProject,aspect:1440/900,frame});
 assert(pose.eye.distanceTo(reference.eye)<1e-8&&pose.target.distanceTo(reference.target)<1e-8&&Math.abs(pose.fov-reference.fov)<1e-10,
  'Interior remains stationary across all simulator aspects: '+stopId+'/'+aspect);
 blendSamples.push({id:stopId,aspect,stationary:true});
}
const unchanged=[replaceSite(camerasPath,nextCameras),replaceSite(atlasPath,nextAtlas),replaceSite('dist/assets/territory/visit-stops.json',nextStops)];
const report={pass:true,method:'CPU final terrain binding + exact app.js preset() + shipped Three.js + actual stopCamera()',
 viewports:sizes,panel:'open',counts:{stops:22,atlasFrames:2,aspects:2,poses:samples.length,interiors:interiorIds.length,easternDetailPoses:easternDetails.length},
 inputs:{presetSha256:hash(presetSource),editorialSceneFrameSha256:hash(read('dist/js/editorial-visibility.js')),
  castleSha256:hash(read('dist/js/castle.js')),materialsSha256:hash(read('dist/js/castle-materials.js')),castleGroundSha256:hash(read('dist/js/castle-ground.js')),
  castleSourceHashes:Object.fromEntries(fs.readdirSync(path.join(root,'dist/js')).filter(file=>/^castle.*\.js$/.test(file)).map(file=>['dist/js/'+file,hash(read('dist/js/'+file))])),
  terrainSha256:hash(read('dist/js/terrain.js')),urbanSurfaceSha256:hash(read('dist/js/urban-surface.js'))},
 groundBinding,
 overviewNote:'Unselected entrance and conjunto stop share the authored castle overview.',
 interiorIds,maxPoseErrorM,maxAdapterErrorM,maxFovErrorDeg,simulatorRegistration:{projection:'ETRS89 / UTM 30N',verticalOffsetM:elevationShift},
 unchanged,samples,easternDetails,interiorAspectChecks:blendSamples,errors};
fs.writeFileSync(path.join(root,'research/validation-v54/castle-cameras-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checkOnly,dryRun,counts:report.counts,interiorIds,maxPoseErrorM,maxAdapterErrorM,
 otherMonumentsUnchanged:unchanged.every(item=>item.unchangedOutsideCastle)},null,2));
