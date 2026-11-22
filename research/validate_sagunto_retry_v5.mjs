import fs from 'node:fs';import zlib from 'node:zlib';import * as THREE from 'three';
import {createHeightSampler,buildTerrainGeometry,terrainShape,inBounds} from '../dist/js/terrain.js';
import {createMonuments} from '../dist/js/monuments.js';import {createSacredHeritage} from '../dist/js/heritage-sacred.js';import {createCivicHeritage} from '../dist/js/heritage-civic.js';import {createUrbanSurface} from '../dist/js/urban-surface.js';import {createCity} from '../dist/js/city.js';import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerArchaeology,createArchaeology} from '../dist/js/archaeology.js';
import {createExcavationController,insideExcavation,excavationPlanes,openPermanentExcavations} from '../dist/js/excavation.js';
import {registerPortHeritage} from '../dist/js/port.js';import {registerCoastHeritage} from '../dist/js/coast.js';
// V5 regression: use the real deferred builder and camera preset, with only texture I/O replaced for Node.
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context}),querySelector:()=>({checked:true})};
const read=x=>JSON.parse(fs.readFileSync('dist/assets/data/'+x+'.json'));
const geo=read('cartography'),elevation=read('elevation'),landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const archaeologyRecords=registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
registerPortHeritage(['port-industrial','port-garden','port-workers'].map(read),catalog,byId,tourOrder);registerCoastHeritage(['coast-pier','coast-grau','coast-archaeology'].map(read),catalog,byId,tourOrder);
let monuments,sacred,civic,archaeology,urban,terrain,city,excavation,portTerrain,coastTerrain,portHeritage,coastHeritage,portCity,coastCity,coastEnvironment;
let activeRegion='coast',portFocus=null,coastFocus=null;const points={},views={},modelBounds={},regionsBuilt=new Set(),regionLoads=new Map();
const scene=new THREE.Group(),renderer={shadowMap:{needsUpdate:false}},pause=()=>Promise.resolve(),updates=[],$=id=>({textContent:'',classList:{contains:()=>false}});
const appSource=fs.readFileSync('dist/js/app.js','utf8');
const regionOf=c=>c?.region==='coast'?'coast':c?.region==='puerto'?'puerto':'sagunto';
const applyRegionVisibility=eval('('+appSource.slice(appSource.indexOf('function applyRegionVisibility('),appSource.indexOf('function setRegion(')).trim()+')');
function updateStatus(){updates.push([...regionsBuilt]);}
let rejectNextTexture=true,terrainAttempts=0,failedGroups=[],failedGeometries=new Set(),disposedGeometries=new Set(),hiddenBeforeFailure=false;
async function createTerrain({data,heightAt,patches}){
 terrainAttempts++;
 if(rejectNextTexture){rejectNextTexture=false;failedGroups=scene.children.filter(g=>g!==foreignGroup);hiddenBeforeFailure=failedGroups.length===4&&failedGroups.every(g=>!g.visible);for(const g of failedGroups)g.traverse(o=>{if(o.isMesh)failedGeometries.add(o.geometry);});for(const geo of failedGeometries)geo.addEventListener('dispose',()=>disposedGeometries.add(geo));await Promise.resolve();throw new Error('QA simulated orthophoto texture rejection');}
 const built=buildTerrainGeometry(data,heightAt,patches),mesh=new THREE.Mesh(built.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'})),group=new THREE.Group();mesh.name='Terrain IGN';mesh.userData.orthophoto=true;group.add(mesh);
 const fp=[];for(const patch of patches){if(!patch.polygon?.length||!Number.isFinite(patch.height))continue;const top=patch.height-.04;for(let i=0;i<patch.polygon.length;i++){const a=patch.polygon[i],b=patch.polygon[(i+1)%patch.polygon.length],bottom=Math.min(top-6,heightAt(a.x,a.z)-3,heightAt(b.x,b.z)-3);fp.push(a.x,top,a.z,b.x,top,b.z,b.x,bottom,b.z,a.x,top,a.z,b.x,bottom,b.z,a.x,bottom,a.z);}}
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.computeVertexNormals();const foundation=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:'#b4a58a'}));foundation.name='Zócalos bajo las cimentaciones';group.add(foundation);
 return{...built,group,mesh,setMode(mode){this.mode=mode;}};
}
const ensureRegion=eval('('+appSource.slice(appSource.indexOf('async function ensureRegion('),appSource.indexOf('function updateStatus(')).trim()+')');
const foreignGroup=new THREE.Group();foreignGroup.name='QA existing coast';const foreignGeometry=new THREE.BoxGeometry(1,1,1);let foreignDisposed=false;foreignGeometry.addEventListener('dispose',()=>{foreignDisposed=true;});foreignGroup.add(new THREE.Mesh(foreignGeometry,new THREE.MeshStandardMaterial()));scene.add(foreignGroup);coastHeritage={group:foreignGroup};regionsBuilt.add('coast');
const foreignRefs={};for(const id of['grau-vell','horno']){foreignRefs[id]={point:new THREE.Vector3(1,2,3),view:{offset:[4,5,6]},bounds:new THREE.Box3(new THREE.Vector3(),new THREE.Vector3(1,1,1))};points[id]=foreignRefs[id].point;views[id]=foreignRefs[id].view;modelBounds[id]=foreignRefs[id].bounds;}
const failed=await Promise.allSettled([ensureRegion('sagunto'),ensureRegion('sagunto')]);
const localIds=catalog.filter(c=>regionOf(c)==='sagunto').map(c=>c.id).concat('forum');
const retryChecks={bothInitialRequestsReject:failed.every(r=>r.status==='rejected'&&r.reason.message==='QA simulated orthophoto texture rejection'),partialGroupsHidden:hiddenBeforeFailure,noPartialScene:scene.children.length===1&&scene.children[0]===foreignGroup&&failedGroups.every(g=>!g.parent),ownedGeometriesDisposed:failedGeometries.size>0&&disposedGeometries.size===failedGeometries.size,foreignGeometryPreserved:!foreignDisposed,regionalVariablesCleared:[monuments,sacred,civic,archaeology,terrain,city,urban,excavation].every(v=>v===undefined),regionalMapsCleared:localIds.every(id=>!(id in points)&&!(id in views)&&!(id in modelBounds)),foreignReferencesPreserved:Object.entries(foreignRefs).every(([id,r])=>points[id]===r.point&&views[id]===r.view&&modelBounds[id]===r.bounds),failedRegionNotReady:!regionsBuilt.has('sagunto')&&regionsBuilt.has('coast'),rejectedPromiseCleared:!regionLoads.has('sagunto')};
const completionsBeforeRetry=updates.length;
const lazyStarted=performance.now();await Promise.all([ensureRegion('sagunto'),ensureRegion('sagunto')]);
const loadedChildren=scene.children.slice(),loadedTerrain=terrain,loadedController=excavation;await ensureRegion('sagunto');
const lazyChecks={singleBuild:scene.children.length===loadedChildren.length&&scene.children.every((o,i)=>o===loadedChildren[i])&&terrain===loadedTerrain&&excavation===loadedController,oneCompletion:updates.length-completionsBeforeRetry===1,cacheCompleted:regionsBuilt.has('sagunto')&&regionLoads.size===0,hiddenWhileCoast:[monuments,sacred,civic,archaeology,terrain,city].every(o=>!o.group.visible)&&!excavation.group.visible};
retryChecks.exactlyOneSuccessfulTerrain=terrainAttempts===2;retryChecks.singleRegionCopy=scene.children.length===8&&[monuments,sacred,civic,archaeology,terrain,city,excavation].every(v=>scene.children.filter(g=>g===v.group).length===1);retryChecks.noFailedGroupsReused=failedGroups.every(g=>!scene.children.includes(g));
activeRegion='sagunto';applyRegionVisibility();lazyChecks.visibleAfterSwitch=[monuments,sacred,civic,archaeology,terrain,city].every(o=>o.group.visible)&&excavation.group.visible;
scene.updateMatrixWorld(true);const terrainMesh=terrain.mesh,foundation=terrain.group.children.find(o=>o.name==='Zócalos bajo las cimentaciones');
const lazyMs=performance.now()-lazyStarted;
function checkPermanentOpening(){
 const w=archaeology.sites.circo.currentMask,ca=Math.cos(w.yaw),sa=Math.sin(w.yaw),rc=new THREE.Raycaster();let clear=0;
 for(const u of[-.98,-.6,0,.6,.98])for(const v of[-.98,-.6,0,.6,.98]){const x=w.center.x+u*w.width*.5*ca+v*w.depth*.5*sa,z=w.center.z-u*w.width*.5*sa+v*w.depth*.5*ca;rc.set(new THREE.Vector3(x,500,z),new THREE.Vector3(0,-1,0));rc.far=600;if(!rc.intersectObjects([terrain.mesh,city.group,monuments.group,sacred.group,civic.group],true).length)clear++;}
 return clear;
}
const permanentBefore=checkPermanentOpening();

const errors=[],checks=[],cameras=[];const assert=(ok,message)=>{checks.push({message,pass:!!ok});if(!ok)errors.push(message);};
assert(catalog.length===28&&new Set(catalog.map(c=>c.id)).size===28,'28 unique total catalogue places');assert(tourOrder.length===28&&new Set(tourOrder).size===28,'28 unique full tour stops');assert(catalog.filter(c=>c.region!=='puerto'&&c.region!=='coast').length===15,'15 original Sagunto places remain registered');for(const[k,v]of Object.entries(lazyChecks))assert(v,'lazy Sagunto '+k);for(const[k,v]of Object.entries(retryChecks))assert(v,'texture failure retry '+k);
const originals=new Map();scene.traverse(o=>{if(o.isMesh)originals.set(o,o.material);});
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
let innerWidth=1363,innerHeight=936;const mobile=()=>innerWidth<=700;const preset=eval('('+appSource.slice(appSource.indexOf('function preset('),appSource.indexOf('function setShadowFraming(')).trim()+')');
for(const c of catalog.filter(c=>c.region!=='puerto'&&c.region!=='coast')){assert(points[c.id]?.isVector3&&points[c.id].toArray().every(Number.isFinite),c.id+' retains a finite world point after deferred creation');for(const [w,h]of [[1363,936],[390,844]]){innerWidth=w;innerHeight=h;for(const near of [false,true]){const p=preset(c.id,near);assert([...p.target.toArray(),...p.position.toArray()].every(Number.isFinite),c.id+'/'+w+'/'+near+' camera remains finite');}}}
const allVertices=(root)=>{const out=[],v=new THREE.Vector3();root.traverse(o=>{if(!o.isMesh||!visible(o))return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);out.push(v.clone());}});return out;};
const raycaster=new THREE.Raycaster();
function clipped(point,material){const planes=material.clippingPlanes;if(!planes?.length)return false;return material.clipIntersection?planes.every(p=>p.distanceToPoint(point)<-1e-5):planes.some(p=>p.distanceToPoint(point)<-1e-5);}
function visibleHit(objects,origin,target){const direction=target.clone().sub(origin);raycaster.set(origin,direction.clone().normalize());raycaster.far=direction.length()-.25;return raycaster.intersectObjects(objects,true).filter(h=>visible(h.object)&&!clipped(h.point,h.object.material))[0];}
for(const [id,site]of Object.entries(archaeology.sites)){
 let finite=true;site.group.traverse(o=>{if(o.isMesh)for(const attr of Object.values(o.geometry.attributes))for(const value of attr.array)if(!Number.isFinite(value))finite=false;});assert(finite,id+' geometry finite');
 excavation.select(id);for(const f of site.focuses||[site]){if(site.focuses)excavation.setFocus(f.id);
  for(const mode of ['current',...(f.cut?['cut']:[]),'historical']){
   excavation.setMode(mode);scene.updateMatrixWorld(true);const state=excavation.state;
   assert(site.remains.visible===(mode!=='historical'||!!site.focuses),id+'/'+f.id+'/'+mode+' correct phase');assert(site.reconstruction.visible===(mode==='historical'),id+'/'+f.id+'/'+mode+' no mixed phases');
   if(state.cut){const planes=excavationPlanes(state.cut),center=new THREE.Vector3(state.cut.center.x,0,state.cut.center.z);assert(planes.every(p=>p.distanceToPoint(center)<0),id+'/'+f.id+'/'+mode+' clipping window interior');assert(insideExcavation(state.cut,center.x,center.z),id+'/'+f.id+'/'+mode+' ground window');}
   if(mode==='cut'){
    excavation.setOpening(0);const lift=excavation.group.children.find(g=>g.name==='Suelo y contexto levantados');assert(lift.position.length()===0,id+'/'+f.id+' closed cover aligns');
    excavation.setOpening(1);assert(lift.position.y>10,id+'/'+f.id+' cover lifts');
    for(const entry of f.cutObjects||[]){assert(Math.abs(entry.object.position.y-entry.rise)<.001,id+'/'+f.id+' rock or tomb lid lifts');}
   }
   if(mode==='historical'){excavation.setHypotheses(false);assert(!site.hypotheses.visible,id+'/'+f.id+' hypotheses removable');excavation.setHypotheses(true);excavation.setRoofOpen(false);excavation.setRoofOpen(true);}
   for(const[w,h]of [[1363,936],[390,844]]){innerWidth=w;innerHeight=h;for(const near of[false,true]){
    const dest=preset(id,near),camera=new THREE.PerspectiveCamera(38,w/h,.12,15000);camera.position.copy(dest.position);if(inBounds(camera.position.x,camera.position.z))camera.position.y=Math.max(camera.position.y,excavation.groundAt(camera.position.x,camera.position.z,urban.groundHeight(camera.position.x,camera.position.z))+1.75);camera.lookAt(dest.target);camera.setViewOffset(w,h,mobile()?0:-Math.min(180,w*.12),mobile()?-h*.21:0,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
    const object=mode==='historical'?(f.reconstruction||site.reconstruction):(f.remains||site.remains),vertices=allVertices(object);let offscreen=0;
    for(const point of vertices){const p=point.clone().project(camera);if(Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1||p.z< -1)offscreen++;}
    const hit=visibleHit([city.buildings,terrainMesh,foundation],camera.position,dest.target);
    cameras.push({id,focus:f.id,mode,near,width:w,offscreenPercent:vertices.length?100*offscreen/vertices.length:0,contextOcclusion:hit?{name:hit.object.name,distance:hit.distance,point:hit.point.toArray()}:null,camera:camera.position.toArray(),target:dest.target.toArray()});
   }}
  }
 }
 excavation.select(null);assert([...originals].every(([mesh,material])=>mesh.material===material),id+' all original materials restored');
}
// Changing terrain material while a section is active preserves the new mode.
excavation.select('domus');const photo=new THREE.MeshStandardMaterial({color:'white'});excavation.updateContext(()=>terrainMesh.material=photo);excavation.select(null);assert(terrainMesh.material===photo,'terrain mode survives cutaway');terrainMesh.material=originals.get(terrainMesh);
assert(renderer.localClippingEnabled,'local clipping enabled');
const permanentAfter=checkPermanentOpening();assert(permanentBefore===25,'all 25 permanent excavation rays clear after region load');assert(permanentAfter===25,'all 25 permanent excavation rays remain clear after dynamic modes');
const result={pass:errors.length===0,retryChecks,disposedGeometryCount:disposedGeometries.size,lazyChecks,lazyMs,permanentBefore,permanentAfter,errors,checks,cameras,archaeology:archaeology.stats,buildings:city.buildings.userData,sourceMeshCounts:{terrain:terrain.geometry.attributes.position.count}};
fs.writeFileSync('research/qa-v5-sagunto-retry-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,checks:checks.length,retryChecks,disposedGeometryCount:disposedGeometries.size,lazyChecks,lazyMs,errors,cameraIssues:cameras.filter(c=>(!c.near&&c.offscreenPercent>1)||c.contextOcclusion),archaeology:archaeology.stats},null,2));
if(errors.length)process.exitCode=1;
