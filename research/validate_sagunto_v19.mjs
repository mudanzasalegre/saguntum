// Run: node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v19.mjs --export
import fs from 'node:fs';import zlib from 'node:zlib';import {createHash} from 'node:crypto';import * as THREE from 'three';
import {createHeightSampler,buildTerrainGeometry,terrainShape,inBounds} from '../dist/js/terrain.js';
import {createMonuments as realCreateMonuments,theatreRoadIds,theatreBuildingIds} from '../dist/js/monuments.js';import {createSacredHeritage as realCreateSacredHeritage} from '../dist/js/heritage-sacred.js';import {createCivicHeritage as realCreateCivicHeritage} from '../dist/js/heritage-civic.js';import {createUrbanSurface as realCreateUrbanSurface} from '../dist/js/urban-surface.js';import {createCity as realCreateCity} from '../dist/js/city.js';import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerArchaeology,createArchaeology} from '../dist/js/archaeology.js';
import {createExcavationController,insideExcavation,excavationPlanes,openPermanentExcavations} from '../dist/js/excavation.js';
import {registerPortHeritage} from '../dist/js/port.js';import {registerCoastHeritage} from '../dist/js/coast.js';
// V19 Sagunto regression: use the real deferred builder and camera preset, with only texture I/O replaced for Node.
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256),querySelector:()=>({checked:true})};
const read=x=>JSON.parse(fs.readFileSync('dist/assets/data/'+x+'.json'));
const geo=read('cartography'),elevation=read('elevation'),castleData=read('castle-visit'),theatreData=read('theatre-visit'),churchData=read('santa-maria-visit'),churchContextData=read('santa-maria-context'),plazaData=read('plaza-mayor-visit'),plazaContextData=read('plaza-mayor-context'),juderiaData=read('juderia-visit'),juderiaContextData=read('juderia-context'),calvarioData=read('calvario-visit'),calvarioContextData=read('calvario-context'),berenguerData=read('berenguer-visit'),berenguerContextData=read('berenguer-context'),museoData=read('museo-visit'),museoContextData=read('museo-context'),landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s]));
theatreData.plan=read('theatre-plan');churchData.plan=read('santa-maria-plan');plazaData.plan=read('plaza-mayor-plan');juderiaData.plan=read('juderia-plan');calvarioData.plan=read('calvario-plan');berenguerData.plan=read('berenguer-plan');museoData.plan=read('museo-plan');
const domusData=read('domus-visit'),domusContextData=read('domus-context');domusData.plan=read('domus-plan');const domusVisit=()=>archaeology?.sites?.domus?.visit;
const archaeologicalVisitIds=new Set(['portic','domus']);
const porticData=read('portic-visit'),porticContextData=read('portic-context');porticData.plan=read('portic-plan');const porticVisit=()=>archaeology?.sites?.portic?.visit;
const salvadorData=read('salvador-visit'),salvadorContextData=read('salvador-context');salvadorData.plan=read('salvador-plan');const salvadorVisit=()=>sacred?.sites?.salvador?.userData?.visit;
const sangreData=read('sangre-visit'),sangreContextData=read('sangre-context');sangreData.plan=read('sangre-plan');
const sangreVisit=()=>sacred?.sites?.sangre?.userData?.visit;
const buildCalls={monuments:[],urban:[],city:[],sacred:[],civic:[]};
function createCivicHeritage(options){const result=realCreateCivicHeritage(options);buildCalls.civic.push({options,result});return result;}
function createSacredHeritage(options){const result=realCreateSacredHeritage(options);buildCalls.sacred.push({options,result});return result;}
function createMonuments(options){const result=realCreateMonuments(options);buildCalls.monuments.push({options,result});return result;}
function createUrbanSurface(options){const result=realCreateUrbanSurface(options);buildCalls.urban.push({options,result});return result;}
function createCity(options){const result=realCreateCity(options);buildCalls.city.push({options,result});return result;}
const trackedFiles=['app','castle-panel','theatre','monuments','castle','terrain','city','urban-surface','santa-maria','santa-maria-context','heritage-sacred','heritage-civic','plaza-mayor','plaza-mayor-context','juderia','juderia-context','calvario','calvario-context','berenguer','berenguer-context','berenguer-map','berenguer-visit','sangre','sangre-context','sangre-map','museo','museo-context','museo-map','salvador','salvador-context','salvador-map','archaeology-public','archaeology','archaeology-domestic','portic','portic-map','portic-context','excavation','archaeology-panel'].map(name=>'dist/js/'+name+'.js').concat(['plaza-mayor-visit','plaza-mayor-plan','plaza-mayor-context','juderia-visit','juderia-plan','juderia-context','calvario-visit','calvario-plan','calvario-context','berenguer-visit','berenguer-plan','berenguer-context','sangre-visit','sangre-plan','sangre-context','museo-visit','museo-plan','museo-context','portic-visit','portic-plan','portic-context','archaeology-domestic','salvador-visit','salvador-plan','salvador-context'].map(name=>'dist/assets/data/'+name+'.json'));
trackedFiles.push(...['domus','domus-map','domus-context'].map(n=>'dist/js/'+n+'.js'),...['domus-visit','domus-plan','domus-context'].map(n=>'dist/assets/data/'+n+'.json'));
const hashFile=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),inputHashes=Object.fromEntries(trackedFiles.map(file=>[file,hashFile(file)]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const archaeologyRecords=registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
registerPortHeritage(['port-industrial','port-garden','port-workers'].map(read),catalog,byId,tourOrder);registerCoastHeritage(['coast-pier','coast-grau','coast-archaeology'].map(read),catalog,byId,tourOrder);
let monuments,sacred,civic,archaeology,urban,terrain,city,excavation,portTerrain,coastTerrain,portHeritage,coastHeritage,portCity,coastCity,coastEnvironment;
let activeRegion='sagunto',portFocus=null,coastFocus=null,castleStopId=null,theatreStopId=null,churchStopId=null,plazaStopId=null,juderiaStopId=null,calvarioStopId=null;const visitStates={berenguer:{stopId:null,sectionOpen:false},diana:{stopId:null},sangre:{stopId:null,sectionOpen:false},salvador:{stopId:null,sectionOpen:false},museo:{stopId:null,sectionOpen:false},portic:{stopId:null,sectionOpen:false},domus:{stopId:null,sectionOpen:false}};const guidedIds=['castle','theatre','santa-maria','plaza-mayor','juderia','calvario','berenguer','diana','sangre','salvador','museo','portic','domus'];const museoVisit=()=>civic?.sites?.museo?.userData?.visit;const berenguerVisit=()=>civic?.sites?.berenguer?.userData?.visit;const calvarioVisit=()=>sacred?.sites?.calvario?.userData?.visit;const juderiaVisit=()=>civic?.sites?.juderia?.userData?.visit;const plazaVisit=()=>civic?.sites?.['plaza-mayor']?.userData?.visit;const churchVisit=()=>sacred?.sites?.['santa-maria']?.userData?.visit;const theatreVisit=()=>monuments?.theatre?.userData?.visit;const guidedVisit=(id='domus')=>id==='domus'?{model:domusVisit(),stopId:visitStates.domus.stopId,overviewId:'domus-conjunto'}:id==='portic'?{model:porticVisit(),stopId:visitStates.portic.stopId,overviewId:'portic-conjunto'}:id==='salvador'?{model:salvadorVisit(),stopId:visitStates.salvador.stopId,overviewId:'salvador-conjunto'}:id==='sangre'?{model:sangreVisit(),stopId:visitStates.sangre.stopId,overviewId:'sangre-conjunto'}:id==='museo'?{model:museoVisit(),stopId:visitStates.museo.stopId,overviewId:'museo-conjunto'}:visitStates[id]?{model:berenguerVisit(),stopId:visitStates[id].stopId,overviewId:id==='diana'?'diana-conjunto':'berenguer-conjunto'}:id==='castle'?{model:castleVisit(),stopId:castleStopId}:id==='theatre'?{model:theatreVisit(),stopId:theatreStopId}:id==='santa-maria'?{model:churchVisit(),stopId:churchStopId}:id==='plaza-mayor'?{model:plazaVisit(),stopId:plazaStopId}:id==='juderia'?{model:juderiaVisit(),stopId:juderiaStopId}:id==='calvario'?{model:calvarioVisit(),stopId:calvarioStopId}:null;const castleVisit=()=>monuments?.castle?.userData?.visit;const points={},views={},modelBounds={},regionsBuilt=new Set(),regionLoads=new Map(),regionRoots=new Map(),regionUsed=new Map(),landscapes={};let buildQueue=Promise.resolve();const isLandscape=()=>false;const regionTerrain=r=>r==='coast'?coastTerrain:r==='puerto'?portTerrain:terrain;const mobile=()=>false;
const scene=new THREE.Group(),renderer={shadowMap:{needsUpdate:false}},pause=()=>Promise.resolve(),updates=[],$=id=>({textContent:'',setAttribute(){},classList:{contains:()=>false}});
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
// V19: validate the actual production builder, controls and cameras together.
const out='research/validation-v19/';fs.mkdirSync(out,{recursive:true});
const errors=[],checks=[],cameras=[],assert=(ok,label,detail=null)=>{checks.push({label,pass:!!ok});if(!ok)errors.push({label,detail});};
for(const[k,v]of Object.entries(lazyChecks))assert(v,'Deferred loading: '+k);
for(const[k,v]of Object.entries(retryChecks))assert(v,'Failed texture recovery: '+k);
const site=archaeology.sites.domus,visit=domusVisit(),context=site.group.userData.context;
assert(domusData.stops.length===20&&Object.keys(visit.focuses).length===20,'Twenty documentary stops resolve to twenty physical focuses');
assert(domusData.stops.every(s=>visit.focuses[s.id]),'Every stop resolves without using the Berenguer fallback');
assert(catalog.length===28&&new Set(catalog.map(s=>s.id)).size===28,'28 heritage places retained before the three landscape registrations');
assert(museoData.stops.every(s=>museoVisit().focuses[s.id]),'Previous museum visit retains every focus');
assert(salvadorData.stops.every(s=>salvadorVisit().focuses[s.id])&&sangreData.stops.every(s=>sangreVisit().focuses[s.id]),'Salvador and Sangre visits retain their focuses');
assert(site.currentMask?.permanent===false&&site.currentMask?.clipContext===false,'Basement opens temporarily without clipping neighbouring buildings');
assert((archaeology.excludedBuildingIds||[]).length>0,'Detailed archaeological surroundings replace their generic buildings');
assert(site.group.parent===archaeology.group&&scene.getObjectById(site.group.id)===site.group,'Detailed Domus exists once in its archaeological owner');
const names=[];scene.traverse(o=>{if(o.name==='archaeology-domus')names.push(o);});assert(names.length<=1,'Obsolete generic Domus is absent');
let finite=true,meshes=0,triangles=0;site.group.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const a of Object.values(o.geometry.attributes))for(const x of a.array)if(!Number.isFinite(x))finite=false;});
assert(finite,'All new architecture and context vertices are finite');
assert(visit.plan?.stops.length===20,'Serialized model plan has all twenty stops');
const coordSame=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a.every((x,i)=>Math.abs(x-b[i])<1e-7);
assert(domusData.stops.every(s=>coordSame(s.coordinate||s.coordinates,visit.focuses[s.id]?.coordinates)),'Every documentary stop matches the final integrated model and surrounding-context focus');
assert(domusData.plan.stops.every(s=>coordSame(s.coordinates,visit.focuses[s.id]?.coordinates)),'Serialized map matches all integrated model coordinates');
const original=new Map();scene.traverse(o=>{if(o.isMesh)original.set(o,{material:o.material,geometry:o.geometry,visible:o.visible,position:o.position.clone()});});
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;},ray=new THREE.Raycaster();
function clipped(point,material){const planes=material.clippingPlanes;if(!planes?.length)return false;return material.clipIntersection?planes.every(p=>p.distanceToPoint(point)<-1e-5):planes.some(p=>p.distanceToPoint(point)<-1e-5);}
function materialFor(hit){return Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex||0]:hit.object.material;}
function hittable(hit){const mat=materialFor(hit);return visible(hit.object)&&mat?.visible!==false&&!clipped(hit.point,mat)&&!(mat.transparent&&mat.opacity<.55)&&!['glass','vidrio'].includes(hit.object.userData.materialKind);}
function firstHit(roots,origin,target,margin=.35){const dir=target.clone().sub(origin);ray.set(origin,dir.clone().normalize());ray.far=Math.max(0,dir.length()-margin);return ray.intersectObjects(roots,true).find(hittable);}
const groundOriginal=terrainMesh.material;
excavation.select('domus',{mode:'current'});scene.updateMatrixWorld(true);
assert(excavation.state.selected==='domus'&&excavation.state.mode==='current','Current presentation selects the basement window');
assert(terrainMesh.material!==groundOriginal,'Current basement clips the terrain while the site is selected');
const apron=domusContextData.surfaceApron;const apronProbes=[];for(let i=0;i<(apron?.indices.length||0);i+=3){const tri=apron.indices.slice(i,i+3).map(k=>apron.vertices[k]);apronProbes.push({x:tri.reduce((n,p)=>n+p[0],0)/3,z:tri.reduce((n,p)=>n+p[1],0)/3});}
assert(apronProbes.length>0&&apronProbes.every(p=>Math.abs(excavation.groundAt(p.x,p.z,terrain.meshHeightAt(p.x,p.z))-terrain.meshHeightAt(p.x,p.z))<1e-8),'Public-space apron retains its real walking elevation throughout the cut rectangle');
assert(excavation.groundAt(visit.focuses['domus-atrio'].target.x,visit.focuses['domus-atrio'].target.z,100)===site.cut.floorY,'Ground query still admits the archaeological interior');
assert([...original].filter(([mesh])=>mesh!==terrainMesh&&mesh!==foundation).every(([mesh,state])=>mesh.material===state.material),'Domus window does not replace neighbouring material instances');
for(const mode of['cut','historical','current']){excavation.setMode(mode);excavation.setOpening(.35);excavation.setOpening(1);excavation.setCoverShown(false);excavation.setHypotheses(false);scene.updateMatrixWorld(true);assert(excavation.state.mode===mode,'Presentation switches to '+mode);if(mode==='historical')assert(site.reconstruction.visible&&!site.hypotheses.visible,'Historical interpretation and optional conjectures remain independent');}
excavation.select(null);visit.selectFocus(null);visit.setReadingMode('materials');scene.updateMatrixWorld(true);
assert([...original].every(([mesh,state])=>mesh.material===state.material&&mesh.geometry===state.geometry&&mesh.position.equals(state.position)),'Leaving archaeology restores original scene materials, geometry and positions');
assert(!site.reconstruction.visible&&!site.hypotheses.visible,'Leaving the site clears all historical layers');
const legend=new Map(domusData.readingLegend.map(x=>[x.id,new THREE.Color(x.color)]));let coreColors=true,contextColors=true;
visit.setReadingMode('periods');site.group.traverse(o=>{if(o.isMesh&&o.userData.domusFabric&&legend.has(o.userData.period))coreColors=coreColors&&o.material.color.equals(legend.get(o.userData.period));});context.group.traverse(o=>{if(o.isMesh)contextColors=contextColors&&o.material.color.equals(legend.get('contemporanea'));});
assert(coreColors&&contextColors,'Reading colours match the guide and map for both archaeology and current surroundings');visit.setReadingMode('materials');
const modeSource=appSource.slice(appSource.indexOf('function archaeologyMode('),appSource.indexOf('function buildPlaceUI('));
const modeEvents=[],modeStates={domus:{stopId:null,sectionOpen:false}},modeProxy={setMode:mode=>modeEvents.push(['mode',mode])};
const modeHandler=new Function('excavation','selected','visitStates','archaeologicalVisitIds','guidedVisit','selectVisitStop','$','castlePanel','archaeologyPanel','fly','refreshMap','updateStatus','let closeView=false;return ('+modeSource+');')(modeProxy,'domus',modeStates,archaeologicalVisitIds,()=>({model:visit}),(...args)=>modeEvents.push(['stop',...args]),$,...Array(5).fill(()=>{}));
for(const f of Object.values(visit.focuses)){modeEvents.length=0;modeStates.domus.stopId=f.id;modeHandler('current');const needsOverview=f.requiresSection||['cut','historical'].includes(f.recommendedMode);assert(needsOverview?modeEvents.some(e=>e[0]==='stop'&&e[1]==='domus'&&e[2]===null):modeEvents.some(e=>e[0]==='mode'&&e[1]==='current'),'Actual mode returns safely from '+f.id);}
modeEvents.length=0;modeHandler('historical');assert(modeEvents.some(e=>e[0]==='stop'&&e[2]==='domus-historica'),'Historical mode selects its own prepared observation');

// Existing archaeological switching must still work after a basement visit.
const diana=archaeology.sites.diana;excavation.select('diana',{mode:'historical'});assert(diana.reconstruction.visible&&!diana.remains.visible,'Diana historical view remains independent');excavation.select('portic',{mode:'cut'});assert(excavation.state.selected==='portic'&&excavation.state.cut,'Pòrtic retains its own cutaway');excavation.select(null);

let innerWidth=1363,innerHeight=936;const cameraMobile=()=>innerWidth<=700;
const castleFrame=eval('('+appSource.slice(appSource.indexOf('function castleFrame('),appSource.indexOf('function preset(')).trim()+')');
const preset=eval('('+appSource.slice(appSource.indexOf('function preset('),appSource.indexOf('function setShadowFraming(')).replaceAll('mobile()','cameraMobile()').trim()+')');
const cameraCases=domusData.stops.map(s=>({place:'domus',id:s.id,mode:visit.focuses[s.id].recommendedMode||'current'}));
for(const mode of['cut','historical'])cameraCases.push({place:'domus',id:'domus-conjunto',mode});
for(const id of['museo-conjunto','museo-planta-baja','museo-planta-alta','museo-arco'])cameraCases.push({place:'museo',id,mode:'current'});
for(const test of cameraCases){
 const model=test.place==='domus'?visit:museoVisit();visitStates[test.place].stopId=test.id;model.selectFocus(test.id);
 excavation.select(test.place==='domus'?'domus':null,{mode:test.mode});excavation.setCoverShown(false);excavation.setOpening(1);excavation.setHypotheses(true);
 if(test.id==='domus-compluvium')excavation.setRoofOpen(false);
 scene.updateMatrixWorld(true);const f=model.getFocus?.(test.id,test.mode)||model.focuses[test.id];
 for(const[w,h]of[[1363,936],[390,844],[844,390]])for(const near of[false,true]){
  innerWidth=w;innerHeight=h;const dest=preset(test.place,near),frame=castleFrame(w,h),camera=new THREE.PerspectiveCamera(dest.fov||38,w/h,.12,15000);camera.position.copy(dest.position);camera.lookAt(dest.target);camera.setViewOffset(w,h,frame.offsetX,frame.offsetY,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const corners=[];if(!near&&f.fitBounds!==false)for(const x of[f.bounds.min.x,f.bounds.max.x])for(const y of[f.bounds.min.y,f.bounds.max.y])for(const z of[f.bounds.min.z,f.bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera),px=(p.x*.5+.5)*w,py=(-p.y*.5+.5)*h;if(px<frame.left-.01||px>frame.right+.01||py<frame.top-.01||py>frame.bottom+.01)corners.push([px,py]);}
  const ground=firstHit([terrainMesh,foundation],dest.position,dest.target),hit=firstHit([civic.group,sacred.group,monuments.group,archaeology.group,city.group],dest.position,dest.target),clearance=dest.position.y-excavation.groundAt(dest.position.x,dest.position.z,terrain.meshHeightAt(dest.position.x,dest.position.z));
  const label=test.id+'/'+test.mode+'/'+w+'x'+h+'/'+(near?'near':'full');
  assert([...dest.target.toArray(),...dest.position.toArray()].every(Number.isFinite),label+' finite camera');
  assert(clearance>=1.50,label+' camera clears its final walking surface',clearance);
  assert(!ground,label+' sightline clears terrain',ground?{name:ground.object.name,point:ground.point.toArray()}:null);
  assert(!corners.length,label+' focus fits the available viewport',corners);
  const immediate=[];if(f.interiorView){for(const sx of[-.22,0,.22])for(const sy of[-.18,0,.18]){const px=(frame.left+frame.right)/2+sx*frame.width,py=(frame.top+frame.bottom)/2+sy*frame.height;ray.setFromCamera(new THREE.Vector2(px/w*2-1,1-py/h*2),camera);ray.far=.6;const obstruction=ray.intersectObjects([test.place==='domus'?site.group:civic.sites.museo],true).find(hittable);if(obstruction)immediate.push({name:obstruction.object.name,distance:obstruction.distance});}}
  const own=test.place==='domus'?!!site.group.getObjectById(hit?.object.id):!!civic.sites.museo.getObjectById(hit?.object.id);
  const intended=!!hit&&own&&(test.id==='domus-conjunto'||test.id==='museo-conjunto'||hit.point.distanceTo(dest.target)<1.9||f.allowedTargetComponents?.includes(hit.object.userData.component));
  assert(!hit||intended,label+' sightline reaches the focus',hit&&!intended?{name:hit.object.name,component:hit.object.userData.component,distanceToTarget:hit.point.distanceTo(dest.target),point:hit.point.toArray()}:null);
  assert(!immediate.length,label+' interior near field is clear',immediate);
  if(test.place==='domus'&&!near&&(test.id==='domus-historica'||test.id==='domus-conjunto'&&test.mode==='cut')){
   const blockedRooms=[],qa=visit.qa,c=Math.cos(qa.frame.yaw),s=Math.sin(qa.frame.yaw);
   for(const room of qa.rooms){const target=new THREE.Vector3(qa.frame.x+room.x*c+room.z*s,qa.baseY+.25,qa.frame.z-room.x*s+room.z*c),blocker=firstHit([civic.group,sacred.group,monuments.group,archaeology.group,city.group],dest.position,target);if(blocker&&blocker.object.userData.archaeologicalSite!=='domus')blockedRooms.push({room:room.id,occluder:blocker.object.name});}
   assert(!blockedRooms.length,label+' neighbouring buildings leave every room centre visible',blockedRooms);
  }
  cameras.push({...test,width:w,height:h,near,fov:camera.fov,interiorView:!!f.interiorView,position:dest.position.toArray(),target:dest.target.toArray(),clearance,offFrameCorners:corners.length,immediate,ground:ground?ground.object.name:null,occlusion:hit?{name:hit.object.name,intended,point:hit.point.toArray(),distanceToTarget:hit.point.distanceTo(dest.target)}:null});
 }
}
visitStates.domus.stopId=null;visitStates.museo.stopId=null;visit.selectFocus(null);museoVisit().selectFocus(null);excavation.select(null);scene.updateMatrixWorld(true);
assert(trackedFiles.every(file=>hashFile(file)===inputHashes[file]),'No scene input changed during validation');
const report={pass:!errors.length,generatedAt:new Date().toISOString(),checks:checks.length,buildMs:lazyMs,meshes,triangles,stats:visit.stats,errors,cameras,inputHashes,limitations:['Geometry and camera validation does not measure browser GPU performance.','Terrain cut is explanatory; excavation heights and unmeasured details are approximate.']};
fs.writeFileSync(out+'integrated-scene-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:checks.length,cameras:cameras.length,meshes,triangles,errors},null,2));

if(process.argv.includes('--export')){
 const typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null,maps=new Map();fs.mkdirSync(out+'textures',{recursive:true});
 const texPath=t=>{if(!t?.image?.toBuffer)return null;if(!maps.has(t)){const path=out+'textures/material-'+String(maps.size).padStart(2,'0')+'.png';fs.writeFileSync(path,t.image.toBuffer('image/png'));maps.set(t,path);}return maps.get(t);};
 function compact(source,matrix,centre,radius){const pos=source.attributes.position,ix=source.index,attrs=Object.entries(source.attributes),indices=[],remap=new Map(),arrays=Object.fromEntries(attrs.map(([n])=>[n,[]])),ps=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];for(let t=0;t<(ix?.count||pos.count);t+=3){const ids=[0,1,2].map(k=>ix?ix.getX(t+k):t+k);for(let k=0;k<3;k++)ps[k].fromBufferAttribute(pos,ids[k]).applyMatrix4(matrix);if(ps.every(p=>p.x<centre.x-radius)||ps.every(p=>p.x>centre.x+radius)||ps.every(p=>p.z<centre.z-radius)||ps.every(p=>p.z>centre.z+radius))continue;for(const id of ids){if(!remap.has(id)){remap.set(id,remap.size);for(const[n,a]of attrs)for(let k=0;k<a.itemSize;k++)arrays[n].push(a.array[id*a.itemSize+k]);}indices.push(remap.get(id));}}if(!indices.length)return null;const g=new THREE.BufferGeometry();for(const[n,a]of attrs)g.setAttribute(n,new THREE.BufferAttribute(new a.array.constructor(arrays[n]),a.itemSize,a.normalized));g.setIndex(indices);return g;}
 const requested=process.env.DOMUS_RENDER_STOPS?.split(',')||['domus-conjunto','domus-corte','domus-museo','domus-impluvium','domus-historica','domus-compluvium'];
 for(const name of requested){const id=name==='domus-corte'?'domus-conjunto':name,mode=name==='domus-corte'?'cut':visit.focuses[id].recommendedMode||'current';visitStates.domus.stopId=id;visit.selectFocus(id);excavation.select('domus',{mode});excavation.setCoverShown(false);excavation.setOpening(1);excavation.setHypotheses(true);if(id==='domus-compluvium')excavation.setRoofOpen(false);scene.updateMatrixWorld(true);const f=visit.getFocus?.(id,mode)||visit.focuses[id],centre=f.target.clone();
  const exportGroup=new THREE.Group(),clippedMeshes=[];function append(o,matrix,color){const bound=new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(matrix);if(o!==terrainMesh&&bound.distanceToPoint(centre)>160)return;const g=compact(o.geometry,matrix,centre,180);if(!g)return;const m=new THREE.Mesh(g,o.material);m.name=o.name;m.userData={...o.userData,...(color?{renderInstanceColor:color.toArray()}:{})};m.matrixAutoUpdate=false;m.matrix.copy(matrix);exportGroup.add(m);if((Array.isArray(o.material)?o.material[0]:o.material).clippingPlanes?.length)clippedMeshes.push(m);}
  scene.traverse(o=>{if(!o.isMesh||!visible(o))return;if(o.isInstancedMesh){const instance=new THREE.Matrix4(),matrix=new THREE.Matrix4(),color=new THREE.Color();for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);if(o.instanceColor)o.getColorAt(i,color);append(o,matrix,o.instanceColor?color:null);}}else append(o,o.matrixWorld);});exportGroup.updateMatrixWorld(true);if(excavation.state.cut)openPermanentExcavations(clippedMeshes,[excavation.state.cut]);
  const meshData=[];exportGroup.traverse(o=>{if(!o.isMesh)return;const m=Array.isArray(o.material)?o.material[0]:o.material;meshData.push({name:o.name,positions:typed(o.geometry.attributes.position.array),normals:typed(o.geometry.attributes.normal?.array),indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),matrix:o.matrixWorld.toArray(),material:{color:(o.userData.renderInstanceColor?m.color.clone().multiply(new THREE.Color().fromArray(o.userData.renderInstanceColor)):m.color).toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,emissive:m.emissive?.toArray(),emissiveIntensity:m.emissiveIntensity??0,kind:o.userData.materialKind||null,orthophoto:!!o.userData.orthophoto,map:texPath(m.map),bumpMap:texPath(m.bumpMap),bumpScale:m.bumpScale??0},component:o.userData.component||null});});
  const lights=[];site.group.traverse(o=>{if(o.isPointLight&&visible(o))lights.push({name:o.name,position:o.getWorldPosition(new THREE.Vector3()).toArray(),color:o.color.toArray(),intensity:o.intensity,distance:o.distance,decay:o.decay});});
  const offset=new THREE.Vector3(...(f.renderOffset||f.offset)),position=f.target.clone().add(offset);
  fs.writeFileSync(out+name+'-geometry.json.gz',zlib.gzipSync(JSON.stringify({terrainImage:'dist/assets/data/orthophoto.jpg',interiorView:!!f.interiorView,lights,meshes:meshData,cameras:[{name,position:position.toArray(),target:f.target.toArray(),fov:f.fov||48}],sectionRemoved:[]})));
  exportGroup.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
 }
 excavation.select(null);visit.selectFocus(null);
}
if(errors.length)process.exitCode=1;
