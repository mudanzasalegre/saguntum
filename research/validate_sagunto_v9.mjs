// Run: node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v9.mjs
import fs from 'node:fs';import {createHash} from 'node:crypto';import * as THREE from 'three';
import {createHeightSampler,buildTerrainGeometry,terrainShape,inBounds} from '../dist/js/terrain.js';
import {createMonuments as realCreateMonuments,theatreRoadIds,theatreBuildingIds} from '../dist/js/monuments.js';import {createSacredHeritage as realCreateSacredHeritage} from '../dist/js/heritage-sacred.js';import {createCivicHeritage} from '../dist/js/heritage-civic.js';import {createUrbanSurface as realCreateUrbanSurface} from '../dist/js/urban-surface.js';import {createCity as realCreateCity} from '../dist/js/city.js';import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerArchaeology,createArchaeology} from '../dist/js/archaeology.js';
import {createExcavationController,insideExcavation,excavationPlanes,openPermanentExcavations} from '../dist/js/excavation.js';
import {registerPortHeritage} from '../dist/js/port.js';import {registerCoastHeritage} from '../dist/js/coast.js';
// V9 Sagunto regression: use the real deferred builder and camera preset, with only texture I/O replaced for Node.
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context}),querySelector:()=>({checked:true})};
const read=x=>JSON.parse(fs.readFileSync('dist/assets/data/'+x+'.json'));
const geo=read('cartography'),elevation=read('elevation'),castleData=read('castle-visit'),theatreData=read('theatre-visit'),churchData=read('santa-maria-visit'),churchContextData=read('santa-maria-context'),landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s]));
theatreData.plan=read('theatre-plan');churchData.plan=read('santa-maria-plan');
const buildCalls={monuments:[],urban:[],city:[],sacred:[]};
function createSacredHeritage(options){const result=realCreateSacredHeritage(options);buildCalls.sacred.push({options,result});return result;}
function createMonuments(options){const result=realCreateMonuments(options);buildCalls.monuments.push({options,result});return result;}
function createUrbanSurface(options){const result=realCreateUrbanSurface(options);buildCalls.urban.push({options,result});return result;}
function createCity(options){const result=realCreateCity(options);buildCalls.city.push({options,result});return result;}
const trackedFiles=['app','theatre','monuments','castle','terrain','city','urban-surface','santa-maria','santa-maria-context','heritage-sacred'].map(name=>'dist/js/'+name+'.js');
const hashFile=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),inputHashes=Object.fromEntries(trackedFiles.map(file=>[file,hashFile(file)]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const archaeologyRecords=registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
registerPortHeritage(['port-industrial','port-garden','port-workers'].map(read),catalog,byId,tourOrder);registerCoastHeritage(['coast-pier','coast-grau','coast-archaeology'].map(read),catalog,byId,tourOrder);
let monuments,sacred,civic,archaeology,urban,terrain,city,excavation,portTerrain,coastTerrain,portHeritage,coastHeritage,portCity,coastCity,coastEnvironment;
let activeRegion='sagunto',portFocus=null,coastFocus=null,castleStopId=null,theatreStopId=null,churchStopId=null;const guidedIds=['castle','theatre','santa-maria'];const churchVisit=()=>sacred?.sites?.['santa-maria']?.userData?.visit;const theatreVisit=()=>monuments?.theatre?.userData?.visit;const guidedVisit=id=>id==='castle'?{model:castleVisit(),stopId:castleStopId}:id==='theatre'?{model:theatreVisit(),stopId:theatreStopId}:id==='santa-maria'?{model:churchVisit(),stopId:churchStopId}:null;const castleVisit=()=>monuments?.castle?.userData?.visit;const points={},views={},modelBounds={},regionsBuilt=new Set(),regionLoads=new Map(),regionRoots=new Map(),regionUsed=new Map(),landscapes={};let buildQueue=Promise.resolve();const isLandscape=()=>false;const regionTerrain=r=>r==='coast'?coastTerrain:r==='puerto'?portTerrain:terrain;const mobile=()=>false;
const scene=new THREE.Group(),renderer={shadowMap:{needsUpdate:false}},pause=()=>Promise.resolve(),updates=[],$=id=>({textContent:'',classList:{contains:()=>false}});
const appSource=fs.readFileSync('dist/js/app.js','utf8');
const regionOf=c=>c?.region==='coast'?'coast':c?.region==='puerto'?'puerto':'sagunto';
const applyRegionVisibility=eval('('+appSource.slice(appSource.indexOf('function applyRegionVisibility('),appSource.indexOf('function setRegion(')).trim()+')');
function updateStatus(){updates.push([...regionsBuilt]);}
let rejectNextTexture=true,terrainAttempts=0,castleDeferredAtTerrain=true,failedGroups=[],failedGeometries=new Set(),disposedGeometries=new Set(),hiddenBeforeFailure=false;
async function createTerrain({data,heightAt,patches}){
 terrainAttempts++;castleDeferredAtTerrain=castleDeferredAtTerrain&&monuments?.castle===null;
 if(rejectNextTexture){rejectNextTexture=false;failedGroups=scene.children.filter(g=>g!==foreignGroup);hiddenBeforeFailure=failedGroups.length===4&&failedGroups.every(g=>!g.visible);for(const g of failedGroups)g.traverse(o=>{if(o.isMesh)failedGeometries.add(o.geometry);});for(const geo of failedGeometries)geo.addEventListener('dispose',()=>disposedGeometries.add(geo));await Promise.resolve();throw new Error('QA simulated orthophoto texture rejection');}
 const built=buildTerrainGeometry(data,heightAt,patches),mesh=new THREE.Mesh(built.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'})),group=new THREE.Group();mesh.name='Terrain IGN';mesh.userData.orthophoto=true;group.add(mesh);
 const fp=[];for(const patch of patches){if(!patch.polygon?.length||!Number.isFinite(patch.height))continue;const top=patch.height-.04;for(let i=0;i<patch.polygon.length;i++){const a=patch.polygon[i],b=patch.polygon[(i+1)%patch.polygon.length],bottom=Math.min(top-6,heightAt(a.x,a.z)-3,heightAt(b.x,b.z)-3);fp.push(a.x,top,a.z,b.x,top,b.z,b.x,bottom,b.z,a.x,top,a.z,b.x,bottom,b.z,a.x,bottom,a.z);}}
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.computeVertexNormals();const foundation=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:'#b4a58a'}));foundation.name='Zócalos bajo las cimentaciones';group.add(foundation);
 return{...built,group,mesh,setMode(mode){this.mode=mode;}};
}
const disposeRegion=eval('('+appSource.slice(appSource.indexOf('function disposeRegion('),appSource.indexOf('function trimRegionCache(')).trim()+')');
const buildRegion=eval('('+appSource.slice(appSource.indexOf('async function buildRegion('),appSource.indexOf('function updateStatus(')).trim()+')');
const trimRegionCache=eval('('+appSource.slice(appSource.indexOf('function trimRegionCache('),appSource.indexOf('async function ensureRegion(')).trim()+')');
const ensureRegion=eval('('+appSource.slice(appSource.indexOf('async function ensureRegion('),appSource.indexOf('async function buildRegion(')).trim()+')');
const foreignGroup=new THREE.Group();foreignGroup.name='QA existing coast';const foreignGeometry=new THREE.BoxGeometry(1,1,1);let foreignDisposed=false;foreignGeometry.addEventListener('dispose',()=>{foreignDisposed=true;});foreignGroup.add(new THREE.Mesh(foreignGeometry,new THREE.MeshStandardMaterial()));scene.add(foreignGroup);coastHeritage={group:foreignGroup};regionsBuilt.add('coast');
const foreignRefs={};for(const id of['grau-vell','horno']){foreignRefs[id]={point:new THREE.Vector3(1,2,3),view:{offset:[4,5,6]},bounds:new THREE.Box3(new THREE.Vector3(),new THREE.Vector3(1,1,1))};points[id]=foreignRefs[id].point;views[id]=foreignRefs[id].view;modelBounds[id]=foreignRefs[id].bounds;}
const failed=await Promise.allSettled([ensureRegion('sagunto'),ensureRegion('sagunto')]);
const localIds=catalog.filter(c=>regionOf(c)==='sagunto').map(c=>c.id).concat('forum');
const retryChecks={bothInitialRequestsReject:failed.every(r=>r.status==='rejected'&&r.reason.message==='QA simulated orthophoto texture rejection'),partialGroupsHidden:hiddenBeforeFailure,noPartialScene:scene.children.length===1&&scene.children[0]===foreignGroup&&failedGroups.every(g=>!g.parent),ownedGeometriesDisposed:failedGeometries.size>0&&disposedGeometries.size===failedGeometries.size,foreignGeometryPreserved:!foreignDisposed,regionalVariablesCleared:[monuments,sacred,civic,archaeology,terrain,city,urban,excavation].every(v=>v===undefined),regionalMapsCleared:localIds.every(id=>!(id in points)&&!(id in views)&&!(id in modelBounds)),foreignReferencesPreserved:Object.entries(foreignRefs).every(([id,r])=>points[id]===r.point&&views[id]===r.view&&modelBounds[id]===r.bounds),failedRegionNotReady:!regionsBuilt.has('sagunto')&&regionsBuilt.has('coast'),rejectedPromiseCleared:!regionLoads.has('sagunto')};
const completionsBeforeRetry=updates.length;
const lazyStarted=performance.now();await Promise.all([ensureRegion('sagunto'),ensureRegion('sagunto')]);
const loadedChildren=scene.children.slice(),loadedTerrain=terrain,loadedController=excavation;await ensureRegion('sagunto');
const lazyChecks={singleBuild:scene.children.length===loadedChildren.length&&scene.children.every((o,i)=>o===loadedChildren[i])&&terrain===loadedTerrain&&excavation===loadedController,oneCompletion:updates.length-completionsBeforeRetry===1,cacheCompleted:regionsBuilt.has('sagunto')&&regionLoads.size===0,visibleInActiveRegion:[monuments,sacred,civic,archaeology,terrain,city].every(o=>o.group.visible)&&excavation.group.visible};
retryChecks.exactlyOneSuccessfulTerrain=terrainAttempts===2;retryChecks.castleDeferredUntilTerrain=castleDeferredAtTerrain;retryChecks.castleBuiltAfterTerrain=!!castleVisit()&&monuments.group.children.includes(monuments.castle);retryChecks.singleRegionCopy=scene.children.length===8&&[monuments,sacred,civic,archaeology,terrain,city,excavation].every(v=>scene.children.filter(g=>g===v.group).length===1);retryChecks.noFailedGroupsReused=failedGroups.every(g=>!scene.children.includes(g));
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
assert(catalog.length===28&&new Set(catalog.map(c=>c.id)).size===28,'28 preserved heritage catalogue places');assert(tourOrder.length===28&&new Set(tourOrder).size===28,'28 preserved heritage tour stops');assert(catalog.filter(c=>c.region!=='puerto'&&c.region!=='coast').length===15,'15 original Sagunto places remain registered');for(const[k,v]of Object.entries(lazyChecks))assert(v,'lazy Sagunto '+k);for(const[k,v]of Object.entries(retryChecks))assert(v,'texture failure retry '+k);
const originals=new Map();scene.traverse(o=>{if(o.isMesh)originals.set(o,o.material);});
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
let innerWidth=1363,innerHeight=936;const cameraMobile=()=>innerWidth<=700;const castleFrame=eval('('+appSource.slice(appSource.indexOf('function castleFrame('),appSource.indexOf('function preset(')).trim()+')');const preset=eval('('+appSource.slice(appSource.indexOf('function preset('),appSource.indexOf('function setShadowFraming(')).replaceAll('mobile()','cameraMobile()').trim()+')');
for(const c of catalog.filter(c=>c.region!=='puerto'&&c.region!=='coast')){assert(points[c.id]?.isVector3&&points[c.id].toArray().every(Number.isFinite),c.id+' retains a finite world point after deferred creation');for(const [w,h]of [[1363,936],[390,844]]){innerWidth=w;innerHeight=h;for(const near of [false,true]){const p=preset(c.id,near);assert([...p.target.toArray(),...p.position.toArray()].every(Number.isFinite),c.id+'/'+w+'/'+near+' camera remains finite');}}}
const allVertices=(root)=>{const out=[],v=new THREE.Vector3();root.traverse(o=>{if(!o.isMesh||!visible(o))return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);out.push(v.clone());}});return out;};
const raycaster=new THREE.Raycaster();
function clipped(point,material){const planes=material.clippingPlanes;if(!planes?.length)return false;return material.clipIntersection?planes.every(p=>p.distanceToPoint(point)<-1e-5):planes.some(p=>p.distanceToPoint(point)<-1e-5);}
function visibleHit(objects,origin,target,ignore=()=>false){const direction=target.clone().sub(origin);raycaster.set(origin,direction.clone().normalize());raycaster.far=direction.length()-.25;return raycaster.intersectObjects(objects,true).filter(h=>visible(h.object)&&!ignore(h.object)&&!clipped(h.point,h.object.material))[0];}
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
    const dest=preset(id,near),camera=new THREE.PerspectiveCamera(38,w/h,.12,15000);camera.position.copy(dest.position);if(inBounds(camera.position.x,camera.position.z))camera.position.y=Math.max(camera.position.y,excavation.groundAt(camera.position.x,camera.position.z,urban.groundHeight(camera.position.x,camera.position.z))+1.75);camera.lookAt(dest.target);camera.setViewOffset(w,h,cameraMobile()?0:-Math.min(180,w*.12),cameraMobile()?-h*.21:0,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
    const object=mode==='historical'?(f.reconstruction||site.reconstruction):(f.remains||site.remains),vertices=allVertices(object);let offscreen=0;
    for(const point of vertices){const p=point.clone().project(camera);if(Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1||p.z< -1)offscreen++;}
    const hit=visibleHit([city.buildings,terrainMesh,foundation],camera.position,dest.target);
    if(mode==='cut'||mode==='historical')assert(!hit,id+'/'+f.id+'/'+mode+'/'+w+'/'+(near?'near':'overview')+' context leaves archaeological view clear');
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
// V8 integration: use the instances, terrain, city and presets produced by the
// actual app.js builder. The model's own mesh/archaeology tests live separately.
const theatreModel=monuments.theatre,theatreVisitModel=theatreVisit();
const actualMonumentsCall=buildCalls.monuments.at(-1),actualUrbanCall=buildCalls.urban.at(-1),actualCityCall=buildCalls.city.at(-1);
const theatreCameras=[],theatreContext={floorSamples:[],contextRays:[],sections:[]};
assert(actualMonumentsCall.options.deferCastle===true&&actualMonumentsCall.options.theatreVisit===theatreData,'actual Sagunto builder supplies documented theatre data and defers castle');
assert(actualCityCall.options.terrainHeightAt===terrain.meshHeightAt,'actual context buildings receive final rendered terrain');
assert([...theatreBuildingIds].every(id=>actualCityCall.options.excludeBuildingIds.has(String(id))),'actual Sagunto builder excludes all theatre cadastral and OSM duplicates');
assert([...monuments.castleBuildingIds].every(id=>actualCityCall.options.excludeBuildingIds.has(String(id))),'actual Sagunto builder retains castle building exclusions');
assert(actualUrbanCall.options.data.roads.every(road=>!theatreRoadIds.has(String(road.osmId||road.id))),'actual urban input excludes theatre circulation paths');
assert(urban.segments.every(segment=>!theatreRoadIds.has(String(segment.road.osmId||segment.road.id))),'rendered street segments contain no theatre circulation duplicates');
assert(theatreData.stops.length===16&&Object.keys(theatreVisitModel.focuses).length===16&&theatreData.stops.every(stop=>theatreVisitModel.focuses[stop.id]),'actual deferred region exposes all 16 documented theatre focuses');
assert(points.theatre===monuments.points.theatre&&points.theatre.distanceTo(theatreVisitModel.focuses['teatro-conjunto'].target)<1e-6,'theatre catalogue point follows its built overview focus');
assert(!theatreVisitModel.bounds.isEmpty()&&theatreVisitModel.bounds.min.toArray().concat(theatreVisitModel.bounds.max.toArray()).every(Number.isFinite),'actual theatre overview bounds are finite');
const localWorld=(x,y,z)=>theatreModel.localToWorld(new THREE.Vector3(x,y,z));
for(const stop of theatreData.stops){
 const focus=theatreVisitModel.focuses[stop.id],coordinate=project(...focus.coordinates);
 if(focus.kind==='overview')assert(focus.target.distanceTo(focus.bounds.getCenter(new THREE.Vector3()))<.02&&coordinate.x>=focus.bounds.min.x&&coordinate.x<=focus.bounds.max.x&&coordinate.z>=focus.bounds.min.z&&coordinate.z<=focus.bounds.max.z,stop.id+' overview marker and fitted camera address the same monument bounds');
 else assert(Math.hypot(coordinate.x-focus.target.x,coordinate.z-focus.target.z)<.02,stop.id+' 2D model focus matches world-space camera target');
}
// A permanent scene floor must remain readable after the app's urban grading
// and the terrain interpolation, not only after the theatre's analytical cap.
const theatreFloorMeshes=[];theatreModel.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.component==='hyposcaenium'&&mesh.userData.period==='interpretation')theatreFloorMeshes.push(mesh);});
for(const mesh of theatreFloorMeshes){
 const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
 for(let i=0;i<p.count;i+=3){
  if(n.getY(i)<.8)continue;
  const point=new THREE.Vector3((p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3).applyMatrix4(mesh.matrixWorld);
  theatreContext.floorSamples.push({point:point.toArray(),clearance:point.y-terrain.meshHeightAt(point.x,point.z)});
 }
}
assert(theatreContext.floorSamples.length>0&&theatreContext.floorSamples.every(sample=>sample.clearance>=.03),'actual Sagunto terrain leaves the exposed archaeological floor above ground');
// Sample the inside of the theatre envelope against the real batched context
// meshes. This catches duplicate roofs or road ribbons even if IDs were passed.
for(const x of[-20,-10,0,10,20])for(const z of[-18,-6,6,18,30]){
 const point=localWorld(x,0,z);raycaster.set(new THREE.Vector3(point.x,300,point.z),new THREE.Vector3(0,-1,0));raycaster.far=300-(point.y-12);
 const hit=raycaster.intersectObjects([city.buildings,city.roads],true).find(hit=>visible(hit.object)&&!clipped(hit.point,hit.object.material));
 theatreContext.contextRays.push({local:[x,z],hit:hit?{name:hit.object.name,point:hit.point.toArray()}:null});
}
assert(theatreContext.contextRays.every(sample=>!sample.hit),'25 real context rays leave the theatre footprint free of duplicate buildings and streets');
const theatreInitial=new Map();theatreModel.traverse(mesh=>{if(mesh.isMesh)theatreInitial.set(mesh,{visible:mesh.visible,material:mesh.material,geometry:mesh.geometry});});
const contextGeometry=terrain.mesh.geometry,contextMaterials=new Map();city.group.traverse(mesh=>{if(mesh.isMesh)contextMaterials.set(mesh,mesh.material);});
theatreVisitModel.setSection(true);scene.updateMatrixWorld(true);
assert([...theatreInitial.keys()].filter(mesh=>['cubierta','proscaenium'].includes(mesh.userData.component)).every(mesh=>!mesh.visible),'integrated section removes modern canopy and stage deck');
assert([...theatreInitial.keys()].filter(mesh=>['hyposcaenium','aulaeum','cloaca'].includes(mesh.userData.component)).every(mesh=>visible(mesh)),'integrated section retains archaeological substructures');
assert(terrain.mesh.geometry===contextGeometry&&[...contextMaterials].every(([mesh,material])=>mesh.material===material),'theatre section preserves the surrounding city and terrain resources');
const fittingCorners=box=>{const out=[];for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])out.push(new THREE.Vector3(x,y,z));return out;};
for(const id of[null,...theatreData.stops.map(stop=>stop.id)]){
 theatreStopId=id;const part=id?theatreVisitModel.focuses[id]:null;theatreVisitModel.selectFocus(id);theatreVisitModel.setSection(!!part?.requiresSection);
 for(const[w,h]of[[1363,936],[390,844],[844,390]])for(const near of[false,true]){
  innerWidth=w;innerHeight=h;const dest=preset('theatre',near),frame=castleFrame(w,h),camera=new THREE.PerspectiveCamera(38,w/h,.12,15000);
  camera.position.copy(dest.position);const rawClearance=camera.position.y-terrain.meshHeightAt(camera.position.x,camera.position.z);
  if(inBounds(camera.position.x,camera.position.z))camera.position.y=Math.max(camera.position.y,excavation.groundAt(camera.position.x,camera.position.z,terrain.meshHeightAt(camera.position.x,camera.position.z))+1.55);
  camera.lookAt(dest.target);camera.setViewOffset(w,h,frame.offsetX,frame.offsetY,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  const projected=dest.target.clone().project(camera),targetPixel=[(projected.x*.5+.5)*w,(-projected.y*.5+.5)*h],bounds=part?.bounds||theatreVisitModel.bounds;
  const outside=fittingCorners(bounds).filter(point=>{const q=point.clone().project(camera),x=(q.x*.5+.5)*w,y=(-q.y*.5+.5)*h;return q.z< -1||q.z>1||x<frame.left-1||x>frame.right+1||y<frame.top-1||y>frame.bottom+1;});
  const hit=visibleHit([city.buildings,city.roads,terrain.mesh,foundation],camera.position,dest.target),clearance=camera.position.y-terrain.meshHeightAt(camera.position.x,camera.position.z),label=(id||'theatre-overview')+'/'+w+'x'+h+'/'+(near?'near':'full');
  assert(camera.position.toArray().concat(dest.target.toArray()).every(Number.isFinite),label+' real app preset stays finite');
  assert(clearance>=1.54,label+' camera stays above final rendered ground');
  assert(!hit,label+' target is unobstructed by terrain and context');
  assert(targetPixel[0]>=frame.left&&targetPixel[0]<=frame.right&&targetPixel[1]>=frame.top&&targetPixel[1]<=frame.bottom,label+' target remains inside the available UI frame');
  if(!near)assert(outside.length===0,label+' complete focus bounds fit the available UI frame');
  theatreCameras.push({id,near,width:w,height:h,sectionOpen:theatreVisitModel.getState().sectionOpen,rawClearance,clearance,offFrameCorners:outside.length,targetPixel,frame,contextOcclusion:hit?{name:hit.object.name,point:hit.point.toArray()}:null,camera:camera.position.toArray(),target:dest.target.toArray()});
 }
}
theatreStopId=null;theatreVisitModel.selectFocus(null);theatreVisitModel.setSection(false);innerWidth=1363;innerHeight=936;
assert([...theatreInitial].every(([mesh,initial])=>mesh.visible===initial.visible&&mesh.material===initial.material&&mesh.geometry===initial.geometry),'all integrated theatre views restore original visibility and resources');
// Santa María is tested inside the real deferred Sagunto region with its urban terrain.
const churchModel=sacred.sites['santa-maria'],churchVisitModel=churchVisit(),churchCameras=[];
const actualSacredCall=buildCalls.sacred.at(-1);
assert(actualSacredCall.options.santaMariaVisit===churchData&&actualSacredCall.options.santaMariaContext===churchContextData,'actual Sagunto builder passes church visit and urban context data');
assert(churchData.stops.length===16&&Object.keys(churchVisitModel.focuses).length===16&&churchData.stops.every(stop=>churchVisitModel.focuses[stop.id]),'actual Sagunto region exposes all 16 church and surroundings focuses');
assert(!churchVisitModel.bounds.isEmpty()&&churchVisitModel.bounds.min.toArray().concat(churchVisitModel.bounds.max.toArray()).every(Number.isFinite),'church and immediate context have finite overview bounds');
assert((sacred.excludedBuildingIds||[]).length>0&&(sacred.excludedBuildingIds||[]).every(id=>actualCityCall.options.excludeBuildingIds.has(String(id))),'actual city input excludes detailed Santa María context duplicates');
assert(actualUrbanCall.options.data.roads.every(road=>!(sacred.excludedRoadIds||[]).map(String).includes(String(road.osmId||road.id))),'actual urban input excludes rebuilt church approaches');
let churchFinite=true;churchModel.traverse(mesh=>{if(mesh.isMesh)for(const attr of Object.values(mesh.geometry.attributes))for(const value of attr.array)if(!Number.isFinite(value))churchFinite=false;});assert(churchFinite,'all integrated Santa María geometry is finite');
const churchInitial=new Map();churchModel.traverse(mesh=>{if(mesh.isMesh)churchInitial.set(mesh,{visible:mesh.visible,material:mesh.material,geometry:mesh.geometry});});
churchVisitModel.setSection(true);scene.updateMatrixWorld(true);
assert([...churchInitial].some(([mesh,initial])=>visible(mesh)!==initial.visible),'church cutaway visibly removes architectural components');
assert([...churchInitial].every(([mesh,initial])=>mesh.geometry===initial.geometry),'church cutaway reuses the source geometry');
assert(terrain.mesh.geometry===contextGeometry&&[...contextMaterials].every(([mesh,material])=>mesh.material===material),'church cutaway preserves terrain and context resources');
churchVisitModel.setSection(false);
for(const id of[null,...churchData.stops.map(stop=>stop.id)]){
 churchStopId=id;const part=id?churchVisitModel.focuses[id]:null;churchVisitModel.selectFocus(id);churchVisitModel.setSection(!!part?.requiresSection);
 for(const[w,h]of[[1363,936],[390,844],[844,390]])for(const near of[false,true]){
  innerWidth=w;innerHeight=h;const dest=preset('santa-maria',near),frame=castleFrame(w,h),camera=new THREE.PerspectiveCamera(38,w/h,.12,15000);
  camera.position.copy(dest.position);const rawClearance=camera.position.y-terrain.meshHeightAt(camera.position.x,camera.position.z);
  if(inBounds(camera.position.x,camera.position.z))camera.position.y=Math.max(camera.position.y,terrain.meshHeightAt(camera.position.x,camera.position.z)+1.55);
  camera.lookAt(dest.target);camera.setViewOffset(w,h,frame.offsetX,frame.offsetY,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  const projected=dest.target.clone().project(camera),targetPixel=[(projected.x*.5+.5)*w,(-projected.y*.5+.5)*h],bounds=part?.bounds||churchVisitModel.bounds;
  const outside=fittingCorners(bounds).filter(point=>{const q=point.clone().project(camera),x=(q.x*.5+.5)*w,y=(-q.y*.5+.5)*h;return q.z< -1||q.z>1||x<frame.left-1||x>frame.right+1||y<frame.top-1||y>frame.bottom+1;});
  const obstacles=[city.buildings,city.roads,terrain.mesh,foundation,churchModel.userData.context.group,...(id==='santa-maria-berenguer'?[]:[civic.group])];
  // The stair's solid parapet is part of the selected object, not an unrelated
  // contextual obstruction. Retain every surrounding roof, road and terrain.
  const hit=visibleHit(obstacles,camera.position,dest.target,mesh=>id==='santa-maria-escalinata'&&mesh.userData.component===id),clearance=camera.position.y-terrain.meshHeightAt(camera.position.x,camera.position.z),label=(id||'santa-maria-overview')+'/'+w+'x'+h+'/'+(near?'near':'full');
  assert(camera.position.toArray().concat(dest.target.toArray()).every(Number.isFinite),label+' actual app camera is finite');
  assert(clearance>=1.54,label+' camera remains above rendered terrain');
  assert(!hit,label+' target is unobstructed by detailed surrounding buildings and terrain');
  assert(targetPixel[0]>=frame.left&&targetPixel[0]<=frame.right&&targetPixel[1]>=frame.top&&targetPixel[1]<=frame.bottom,label+' target is clear of the UI panels');
  if(!near)assert(outside.length===0,label+' full bounds fit the available UI frame');
  churchCameras.push({id,near,width:w,height:h,sectionOpen:churchVisitModel.getState().sectionOpen,rawClearance,clearance,offFrameCorners:outside.length,targetPixel,contextOcclusion:hit?{name:hit.object.name,point:hit.point.toArray()}:null,camera:camera.position.toArray(),target:dest.target.toArray()});
 }
}
churchStopId=null;churchVisitModel.selectFocus(null);churchVisitModel.setSection(false);innerWidth=1363;innerHeight=936;
assert([...churchInitial].every(([mesh,initial])=>mesh.visible===initial.visible&&mesh.material===initial.material&&mesh.geometry===initial.geometry),'all church visits restore original visibility and resources');

const castleOwned=monuments.castle.userData.ownedResources,theatreOwned=theatreModel.userData.ownedResources;
assert(theatreOwned.textures.every(texture=>!castleOwned.textures.includes(texture))&&theatreOwned.materials.every(material=>!castleOwned.materials.includes(material)),'castle and theatre own independent disposable materials and textures');
// The periods reading intentionally detaches the procedural stone texture from
// every material.map. Region disposal must still free it through ownedResources.
const builtSummary={santaMaria:churchVisit()?.stats,archaeology:archaeology.stats,buildings:city.buildings.userData,sourceMeshCounts:{terrain:terrain.geometry.attributes.position.count},castle:castleVisit().stats,theatre:theatreVisit().stats};
const castle=monuments.castle,visit=castleVisit(),theatre=monuments.theatre,owned={textures:[...castle.userData.ownedResources.textures,...theatre.userData.ownedResources.textures,...(sacred.sites['santa-maria'].userData.ownedResources?.textures||[])],materials:[...castle.userData.ownedResources.materials,...theatre.userData.ownedResources.materials,...(sacred.sites['santa-maria'].userData.ownedResources?.materials||[])]};
sacred.sites['santa-maria'].traverse(o=>{if(o!==sacred.sites['santa-maria']&&o.userData?.ownedResources){owned.textures.push(...(o.userData.ownedResources.textures||[]));owned.materials.push(...(o.userData.ownedResources.materials||[]));}});
const ownedTextures=new Set(owned.textures),ownedMaterials=new Set(owned.materials);
const originallyMapped=[...ownedMaterials].filter(material=>ownedTextures.has(material.map));
const textureDisposals=new Map([...ownedTextures].map(texture=>[texture,0]));
const materialDisposals=new Map([...ownedMaterials].map(material=>[material,0]));
for(const texture of ownedTextures)texture.addEventListener('dispose',()=>textureDisposals.set(texture,textureDisposals.get(texture)+1));
for(const material of ownedMaterials)material.addEventListener('dispose',()=>materialDisposals.set(material,materialDisposals.get(material)+1));
visit.setReadingMode('periods');theatreVisit().setReadingMode('periods');churchVisit().setReadingMode('periods');
const disposeChecks={ownedTexturesRegistered:ownedTextures.size>0,stoneTextureOriginallyMapped:originallyMapped.length>0,periodsDetachesAllMaps:[...ownedMaterials].every(material=>material.map===null),noPrematureTextureDisposal:[...textureDisposals.values()].every(count=>count===0)};
const loadedRoots=[...regionRoots.get('sagunto')];
disposeRegion('sagunto');
Object.assign(disposeChecks,{detachedOwnedTexturesDisposedExactlyOnce:[...textureDisposals.values()].every(count=>count===1),ownedMaterialsDisposedExactlyOnce:[...materialDisposals.values()].every(count=>count===1),regionalRootsRemoved:loadedRoots.every(root=>!root.parent)&&!regionRoots.has('sagunto'),regionReadinessCleared:!regionsBuilt.has('sagunto')&&!regionUsed.has('sagunto'),regionalVariablesCleared:[monuments,sacred,civic,archaeology,terrain,city,urban,excavation].every(value=>value===undefined),foreignRegionPreserved:foreignGroup.parent===scene&&!foreignDisposed&&regionsBuilt.has('coast'),foreignReferencesPreserved:Object.entries(foreignRefs).every(([id,r])=>points[id]===r.point&&views[id]===r.view&&modelBounds[id]===r.bounds)});
for(const[key,value]of Object.entries(disposeChecks))assert(value,'period-reading disposeRegion '+key);
const disposal={checks:disposeChecks,ownedTextureCount:ownedTextures.size,mappedMaterialCountBefore:originallyMapped.length,ownedMaterialCount:ownedMaterials.size,textureDisposalCounts:[...textureDisposals].map(([texture,count])=>({name:texture.name,count})),materialDisposalCounts:[...materialDisposals].map(([material,count])=>({name:material.name,count}))};
assert(Object.entries(inputHashes).every(([file,hash])=>hashFile(file)===hash),'validated application and model files stayed unchanged during this run');
const result={pass:errors.length===0,inputHashes,retryChecks,disposedGeometryCount:disposedGeometries.size,lazyChecks,lazyMs,permanentBefore,permanentAfter,disposal,errors,checks,cameras,theatreCameras,theatreContext,churchCameras,...builtSummary};
fs.mkdirSync('research/validation-v9',{recursive:true});fs.writeFileSync('research/validation-v9/sagunto-regression.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,checks:checks.length,retryChecks,disposedGeometryCount:disposedGeometries.size,lazyChecks,lazyMs,disposeChecks,errors,cameraIssues:cameras.filter(c=>(!c.near&&c.offscreenPercent>1)||c.contextOcclusion),churchCameras:churchCameras.length,churchCameraIssues:churchCameras.filter(c=>(!c.near&&c.offFrameCorners)||c.contextOcclusion),theatreCameras:theatreCameras.length,theatreCameraIssues:theatreCameras.filter(c=>(!c.near&&c.offFrameCorners)||c.contextOcclusion),theatreGroundMinimumClearance:Math.min(...theatreContext.floorSamples.map(s=>s.clearance)),archaeology:builtSummary.archaeology},null,2));
if(errors.length)process.exitCode=1;
