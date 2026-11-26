// Sample the real authored views and terrain without GPU rendering.
// Run: node research/check-territory-tour-frames.mjs
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {registerThreeTestLoader} from './three-test-loader.mjs';
registerThreeTestLoader();
const T=await import('three');
const root=new URL('../',import.meta.url);
const {project,terrainSampler}=await import(new URL('dist/js/territory-coordinates.js',root));
const {loadHeritageCatalog,registerFrame}=await import(new URL('dist/js/territory-heritage-catalog.js',root));
const {createTerritoryTour,normalizeTourStops}=await import(new URL('dist/js/territory-tour.js',root));
const base=new URL('dist/assets/territory/',root);
const json=async path=>JSON.parse(await readFile(new URL(path,base),'utf8'));
const world=await json('world.json'),frames=await json('atlas-frames.json');
const decode=bytes=>new Int16Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const grid=async meta=>({...meta,data:decode(await readFile(new URL(meta.heights,base)))});
const regional=await Promise.all((await json('atlas-relief/index.json')).map(async meta=>{
 let bytes=await readFile(new URL(meta.file,base));if(bytes[0]===31&&bytes[1]===139)bytes=gunzipSync(bytes);
 const data=decode(bytes);for(let j=0;j<meta.height;j++)for(let k=j*meta.width+1;k<(j+1)*meta.width;k++)data[k]+=data[k-1];
 return {...meta,data};
}));
const grids={base:await grid(world.terrain),detail:await grid(world.terrain.detail),regional},heightAt=terrainSampler(grids);
const priorFetch=globalThis.fetch;globalThis.fetch=async url=>new Response(await readFile(url));
const {places}=await loadHeritageCatalog(project);globalThis.fetch=priorFetch;
const byId=new Map(places.map(p=>[p.id,p]));
const [sag,port,grau]=['plaza-mayor','horno','grau-vell'].map(id=>byId.get(id));
const core={x:(sag.x+port.x)/2,z:(sag.z+grau.z)/2,anchors:[sag,port,grau],range:Math.max(6100,Math.hypot(port.x-sag.x,grau.z-sag.z)*.94)};
function stop(p,size){const sample=frames[p.id]?.[size];if(!sample)throw Error('No frame '+p.id+' '+size);const local=registerFrame(p,project),target=local.world(sample.target[0],sample.target[2]);const dy=heightAt(target.x,target.z)-sample.ground;const vec=([x,y,z])=>{const v=local.world(x,z);return [v.x,y+dy,v.z];};return {id:p.id,name:p.name,region:p.region,number:p.number,eye:vec(sample.eye),target:vec(sample.target),fov:sample.fov,dwell:14};}
for(const size of ['wide','portrait']){
 const aspect=size==='wide'?1.5:.5625,cam=new T.PerspectiveCamera(38,aspect,.1,100000),center=new T.Vector3(core.x,heightAt(core.x,core.z),core.z);let range=core.range;
 for(let i=0;i<20;i++){
  cam.position.copy(center).add(new T.Vector3(.22*range,.72*range,.84*range));cam.lookAt(center);cam.updateMatrixWorld();
  if(core.anchors.every(p=>{const v=new T.Vector3(p.x,heightAt(p.x,p.z)+80,p.z).project(cam);return Math.abs(v.x)<(size==='portrait'?.62:.85)&&Math.abs(v.y)<.72;}))break;range*=1.1;
 }
 let current={eye:cam.position.toArray(),target:center.toArray(),fov:38,veil:0};
 const starts=[],problems=[];let minSeparation=Infinity,minClearance=Infinity,maxRotation=0,maxVisibleStep=0,peakSpeed=0,peakRotationPlace=null;
 let previous=structuredClone(current),prevQuat=cam.quaternion.clone(),lastIndex=-1;
 const tour=createTerritoryTour({heightAt,readPose:()=>current,isReady:()=>true,applyPose(next){
  current=next;cam.position.fromArray(next.eye);cam.lookAt(new T.Vector3(...next.target));
  const separation=Math.hypot(...next.eye.map((v,i)=>v-next.target[i]));minSeparation=Math.min(minSeparation,separation);
  const clearance=next.eye[1]-heightAt(next.eye[0],next.eye[2]);minClearance=Math.min(minClearance,clearance);
  if(separation<1||clearance<0||![...next.eye,...next.target,next.fov].every(Number.isFinite))problems.push({id:tour.state.id,separation,clearance});
  const step=Math.hypot(...next.eye.map((v,i)=>v-previous.eye[i]));
  const angle=cam.quaternion.angleTo(prevQuat)*180/Math.PI;
  if(next.veil<.99&&previous.veil<.99){
   maxVisibleStep=Math.max(maxVisibleStep,step);peakSpeed=Math.max(peakSpeed,step*60);
   if(angle*60>maxRotation){maxRotation=angle*60;peakRotationPlace=tour.state.id;}
  }
  previous=structuredClone(next);prevQuat.copy(cam.quaternion);
 },onState(active,s){if(s.index!==lastIndex){lastIndex=s.index;starts.push({id:s.id,stage:s.stage,duration:s.duration});}}});
 tour.start(normalizeTourStops(places.map(p=>stop(p,size)),heightAt));
 let ticks=0;while(tour.active&&ticks<150000){tour.tick(1/60);ticks++;}
 const transit=starts.filter(s=>s.stage==='transition'),transfers=starts.filter(s=>s.stage==='transfer');
 console.log(JSON.stringify({size,stops:starts.length,complete:tour.state.stage==='complete',seconds:ticks/60,localTransitions:transit.length,coveredTransfers:transfers.length,transferDestinations:transfers.map(s=>s.id),localDurationMin:Math.min(...transit.map(s=>s.duration)),localDurationMax:Math.max(...transit.map(s=>s.duration)),minEyeTargetM:minSeparation,minEyeGroundM:minClearance,peakVisibleSpeedMps:peakSpeed,maxVisibleFrameStepM:maxVisibleStep,peakVisibleAngularSpeedDegPerSec:maxRotation,peakRotationPlace,problems},null,2));
}
