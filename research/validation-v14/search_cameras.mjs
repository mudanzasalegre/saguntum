// Run: node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v14.mjs --export
import fs from 'node:fs';import zlib from 'node:zlib';import {createHash} from 'node:crypto';import * as THREE from 'three';
import {createHeightSampler,buildTerrainGeometry,terrainShape,inBounds} from '../../dist/js/terrain.js';
import {createMonuments as realCreateMonuments,theatreRoadIds,theatreBuildingIds} from '../../dist/js/monuments.js';import {createSacredHeritage as realCreateSacredHeritage} from '../../dist/js/heritage-sacred.js';import {createCivicHeritage as realCreateCivicHeritage} from '../../dist/js/heritage-civic.js';import {createUrbanSurface as realCreateUrbanSurface} from '../../dist/js/urban-surface.js';import {createCity as realCreateCity} from '../../dist/js/city.js';import {catalog,byId,tourOrder} from '../../dist/js/catalog.js';
import {registerArchaeology,createArchaeology} from '../../dist/js/archaeology.js';
import {createExcavationController,insideExcavation,excavationPlanes,openPermanentExcavations} from '../../dist/js/excavation.js';
import {registerPortHeritage} from '../../dist/js/port.js';import {registerCoastHeritage} from '../../dist/js/coast.js';
// V12 Sagunto regression: use the real deferred builder and camera preset, with only texture I/O replaced for Node.
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256),querySelector:()=>({checked:true})};
const read=x=>JSON.parse(fs.readFileSync('dist/assets/data/'+x+'.json'));
const geo=read('cartography'),elevation=read('elevation'),castleData=read('castle-visit'),theatreData=read('theatre-visit'),churchData=read('santa-maria-visit'),churchContextData=read('santa-maria-context'),plazaData=read('plaza-mayor-visit'),plazaContextData=read('plaza-mayor-context'),juderiaData=read('juderia-visit'),juderiaContextData=read('juderia-context'),calvarioData=read('calvario-visit'),calvarioContextData=read('calvario-context'),berenguerData=read('berenguer-visit'),berenguerContextData=read('berenguer-context'),landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s]));
theatreData.plan=read('theatre-plan');churchData.plan=read('santa-maria-plan');plazaData.plan=read('plaza-mayor-plan');juderiaData.plan=read('juderia-plan');calvarioData.plan=read('calvario-plan');berenguerData.plan=read('berenguer-plan');
const buildCalls={monuments:[],urban:[],city:[],sacred:[],civic:[]};
function createCivicHeritage(options){const result=realCreateCivicHeritage(options);buildCalls.civic.push({options,result});return result;}
function createSacredHeritage(options){const result=realCreateSacredHeritage(options);buildCalls.sacred.push({options,result});return result;}
function createMonuments(options){const result=realCreateMonuments(options);buildCalls.monuments.push({options,result});return result;}
function createUrbanSurface(options){const result=realCreateUrbanSurface(options);buildCalls.urban.push({options,result});return result;}
function createCity(options){const result=realCreateCity(options);buildCalls.city.push({options,result});return result;}
const trackedFiles=['app','castle-panel','theatre','monuments','castle','terrain','city','urban-surface','santa-maria','santa-maria-context','heritage-sacred','heritage-civic','plaza-mayor','plaza-mayor-context','juderia','juderia-context','calvario','calvario-context','berenguer','berenguer-context','berenguer-map','berenguer-visit','archaeology-public','excavation'].map(name=>'dist/js/'+name+'.js').concat(['plaza-mayor-visit','plaza-mayor-plan','plaza-mayor-context','juderia-visit','juderia-plan','juderia-context','calvario-visit','calvario-plan','calvario-context','berenguer-visit','berenguer-plan','berenguer-context'].map(name=>'dist/assets/data/'+name+'.json'));
const hashFile=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),inputHashes=Object.fromEntries(trackedFiles.map(file=>[file,hashFile(file)]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const archaeologyRecords=registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
registerPortHeritage(['port-industrial','port-garden','port-workers'].map(read),catalog,byId,tourOrder);registerCoastHeritage(['coast-pier','coast-grau','coast-archaeology'].map(read),catalog,byId,tourOrder);
let monuments,sacred,civic,archaeology,urban,terrain,city,excavation,portTerrain,coastTerrain,portHeritage,coastHeritage,portCity,coastCity,coastEnvironment;
let activeRegion='sagunto',portFocus=null,coastFocus=null,castleStopId=null,theatreStopId=null,churchStopId=null,plazaStopId=null,juderiaStopId=null,calvarioStopId=null;const pairedVisits={berenguer:{stopId:null,sectionOpen:false},diana:{stopId:null}};const guidedIds=['castle','theatre','santa-maria','plaza-mayor','juderia','calvario','berenguer','diana'];const berenguerVisit=()=>civic?.sites?.berenguer?.userData?.visit;const calvarioVisit=()=>sacred?.sites?.calvario?.userData?.visit;const juderiaVisit=()=>civic?.sites?.juderia?.userData?.visit;const plazaVisit=()=>civic?.sites?.['plaza-mayor']?.userData?.visit;const churchVisit=()=>sacred?.sites?.['santa-maria']?.userData?.visit;const theatreVisit=()=>monuments?.theatre?.userData?.visit;const guidedVisit=id=>pairedVisits[id]?{model:berenguerVisit(),stopId:pairedVisits[id].stopId,overviewId:id==='diana'?'diana-conjunto':'berenguer-conjunto'}:id==='castle'?{model:castleVisit(),stopId:castleStopId}:id==='theatre'?{model:theatreVisit(),stopId:theatreStopId}:id==='santa-maria'?{model:churchVisit(),stopId:churchStopId}:id==='plaza-mayor'?{model:plazaVisit(),stopId:plazaStopId}:id==='juderia'?{model:juderiaVisit(),stopId:juderiaStopId}:id==='calvario'?{model:calvarioVisit(),stopId:calvarioStopId}:null;const castleVisit=()=>monuments?.castle?.userData?.visit;const points={},views={},modelBounds={},regionsBuilt=new Set(),regionLoads=new Map(),regionRoots=new Map(),regionUsed=new Map(),landscapes={};let buildQueue=Promise.resolve();const isLandscape=()=>false;const regionTerrain=r=>r==='coast'?coastTerrain:r==='puerto'?portTerrain:terrain;const mobile=()=>false;
const scene=new THREE.Group(),renderer={shadowMap:{needsUpdate:false}},pause=()=>Promise.resolve(),updates=[],$=id=>({textContent:'',classList:{contains:()=>false}});
const appSource=fs.readFileSync('dist/js/app.js','utf8');
const regionOf=c=>c?.region==='coast'?'coast':c?.region==='puerto'?'puerto':'sagunto';
const applyRegionVisibility=eval('('+appSource.slice(appSource.indexOf('function applyRegionVisibility('),appSource.indexOf('function setRegion(')).trim()+')');
function updateStatus(){updates.push([...regionsBuilt]);}
let rejectNextTexture=false,terrainAttempts=0,castleDeferredAtTerrain=true,failedGroups=[],failedGeometries=new Set(),disposedGeometries=new Set(),hiddenBeforeFailure=false;
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
const lazyStarted=performance.now();await ensureRegion('sagunto');
activeRegion='sagunto';applyRegionVisibility();
scene.updateMatrixWorld(true);const terrainMesh=terrain.mesh,foundation=terrain.group.children.find(o=>o.name==='Zócalos bajo las cimentaciones');
const lazyMs=performance.now()-lazyStarted;
// Camera research only: immutable production geometry and source footprints.
const visit=berenguerVisit();visit.setSection(false);visit.selectFocus(null);excavation.select(null);scene.updateMatrixWorld(true);
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const localMeshes=[];
// Partition only the raycast index, without moving, simplifying or replacing a
// source vertex. Large merged city/terrain meshes otherwise scan every triangle
// for each camera candidate. Chunk bounds include every referenced vertex.
function addRayMesh(m,box){
 const g=m.geometry,pos=g.attributes.position,index=g.index,total=index?.count||pos.count;
 if(m.isInstancedMesh||Array.isArray(m.material)||total<18000){localMeshes.push({mesh:m,source:m,box});return;}
 const chunks=new Map(),e=m.matrixWorld.elements,p=new THREE.Vector3(),v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 for(let i=0;i<total;i+=3){const ii=[0,1,2].map(k=>index?index.getX(i+k):i+k);for(let k=0;k<3;k++)v[k].fromBufferAttribute(pos,ii[k]).applyMatrix4(m.matrixWorld);const key=[0,1,2].map(k=>Math.floor((v[0].getComponent(k)+v[1].getComponent(k)+v[2].getComponent(k))/36)).join(':');let ch=chunks.get(key);if(!ch){ch={indices:[],worldBox:new THREE.Box3(),localBox:new THREE.Box3()};chunks.set(key,ch);}ch.indices.push(...ii);for(let k=0;k<3;k++){ch.worldBox.expandByPoint(v[k]);ch.localBox.expandByPoint(p.fromBufferAttribute(pos,ii[k]));}}
 for(const ch of chunks.values()){if(ch.worldBox.distanceToPoint(new THREE.Vector3(-87,65,35))>500)continue;const cg=new THREE.BufferGeometry();for(const[name,a]of Object.entries(g.attributes))cg.setAttribute(name,a);cg.setIndex(ch.indices);cg.boundingBox=ch.localBox;cg.boundingSphere=ch.localBox.getBoundingSphere(new THREE.Sphere());const proxy=new THREE.Mesh(cg,m.material);proxy.name=m.name;proxy.userData=m.userData;proxy.matrixAutoUpdate=false;proxy.matrix.copy(m.matrixWorld);proxy.matrixWorld.copy(m.matrixWorld);localMeshes.push({mesh:proxy,source:m,box:ch.worldBox});}
}
for(const root of[terrain.group,city.group,sacred.group,civic.group,archaeology.group,monuments.group])root.traverse(m=>{
 if(!m.isMesh||!visible(m)||m.userData.materialKind==='glass')return;
 m.geometry.computeBoundingBox();const box=m.isInstancedMesh?new THREE.Box3().setFromObject(m):m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
 if(box.distanceToPoint(new THREE.Vector3(-87,65,35))>500)return;
 addRayMesh(m,box);
});
const ray=new THREE.Raycaster(),intersectionPoint=new THREE.Vector3();
function clipped(point,material){const planes=material.clippingPlanes;if(!planes?.length)return false;return material.clipIntersection?planes.every(p=>p.distanceToPoint(point)<-1e-5):planes.some(p=>p.distanceToPoint(point)<-1e-5);}
function firstHit(origin,target,margin=.35){const dir=target.clone().sub(origin),distance=dir.length();ray.set(origin,dir.normalize());ray.near=0;ray.far=Math.max(0,distance-margin);const candidates=[];for(const {mesh,source,box}of localMeshes){if(!visible(source))continue;const p=ray.ray.intersectBox(box,intersectionPoint);if(box.containsPoint(origin)||(p&&p.distanceTo(origin)<=distance+.01))candidates.push(mesh);}let best=null;for(const m of candidates){const hits=ray.intersectObject(m,false);for(const h of hits){if(clipped(h.point,Array.isArray(m.material)?m.material[0]:m.material))continue;if(!best||h.distance<best.distance)best=h;break;}}return best;}
let innerWidth=1363,innerHeight=936;
const castleFrame=eval('('+appSource.slice(appSource.indexOf('function castleFrame('),appSource.indexOf('function preset(')).trim()+')');
function cameraFor(target,bounds,dir,w,h,minDistance=2.4){innerWidth=w;innerHeight=h;const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(19));const frame=castleFrame(w,h),tx=tan*(frame.width/h)*.91,ty=tan*(frame.height/h)*.90;let distance=minDistance;for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const rel=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,rel.dot(dir)+Math.max(Math.abs(rel.dot(right))/tx,Math.abs(rel.dot(up))/ty));}return target.clone().addScaledVector(dir,distance*1.08);}
function clearance(p){return p.y-excavation.groundAt(p.x,p.z,terrain.meshHeightAt(p.x,p.z));}
const round=a=>Array.isArray(a)?a.map(x=>Math.round(x*10000)/10000):Math.round(a*10000)/10000;
const core=berenguerContextData.coreBuildings.find(b=>b.id.includes('3558202YJ3935G_part3'));
const [a,b]=[core.coordinates[1],core.coordinates[2]].map(c=>project(...c));const yaw=-Math.atan2(b.z-a.z,b.x-a.x),fc={x:(a.x+b.x)/2,z:(a.z+b.z)/2},c=Math.cos(yaw),s=Math.sin(yaw);
const frontBase=visit.qa.portal.center[1]-2.7,at=(u,y,v)=>new THREE.Vector3(fc.x+u*c+v*s,y,fc.z-u*s+v*c);
function frontBox(left,right,bottom,top){const box=new THREE.Box3();for(const u of[left,right])for(const y of[bottom,top])for(const v of[-.9,.08])box.expandByPoint(at(u,y,v));return box;}
const annexBox=new THREE.Box3();civic.sites.berenguer.traverse(m=>{if(m.isMesh&&m.userData.component==='arcos-anexo')annexBox.union(new THREE.Box3().setFromObject(m));});
const annexTarget=annexBox.getCenter(new THREE.Vector3());annexTarget.z-=.34;
const defs=[
 {id:'berenguer-portada',target:at(-2.52,frontBase+2.1,-.60),bounds:frontBox(-4.7,-.34,frontBase-.10,frontBase+4.3),nearRadius:[3.3,4.2,5.7,7]},
 {id:'berenguer-escudo',target:at(-2.52,frontBase+3.91,-.62),bounds:frontBox(-3.07,-1.97,frontBase+3.40,frontBase+4.35),nearRadius:[2.6,3.4,4.1,5]},
 {id:'berenguer-sorolla',target:at(0,frontBase+7,-.32),bounds:frontBox(-7.6,7.6,frontBase-.1,frontBase+14.1),nearRadius:[10,13,16,20]},
 {id:'berenguer-desvan',target:at(0,frontBase+12.3,-.32),bounds:frontBox(-6.15,6.28,frontBase+11.5,frontBase+13.05),nearRadius:[8,10,13,16]},
 {id:'berenguer-anexo',target:annexTarget,bounds:annexBox.clone().expandByScalar(.13),nearRadius:[4,5.5,7.5,10]}
];
const aspects=[[1363,936],[390,844],[844,390]],report={generatedAt:new Date().toISOString(),buildMs:lazyMs,sourceHashes:inputHashes,scope:'Raycast search over final production terrain, city and all heritage objects. Proposed targets are on exterior surfaces; source footprints unchanged.',focuses:[]};
console.log(JSON.stringify({buildMs:lazyMs,meshes:localMeshes.length,frontBase,frontCenter:fc,focuses:defs.map(d=>({id:d.id,target:round(d.target.toArray()),bounds:[round(d.bounds.min.toArray()),round(d.bounds.max.toArray())]}))}));
if(!process.argv.includes('--verify'))for(const def of defs){const full=[],near=[],rejects={};let attempts=0;
 const azimuths=def.id==='berenguer-anexo'?Array.from({length:24},(_,i)=>i*15):Array.from({length:15},(_,i)=>-105+i*15);
 for(const az of azimuths)for(const el of[5,15,25,35,45,55,65,75,83]){const azr=az*Math.PI/180,er=el*Math.PI/180,dir=new THREE.Vector3(Math.sin(azr)*Math.cos(er),Math.sin(er),-Math.cos(azr)*Math.cos(er));if(def.id!=='berenguer-anexo'&&Math.cos(azr)<.05)continue;
  const trials=[];let ok=true;for(const[w,h]of aspects){const p=cameraFor(def.target,def.bounds,dir,w,h),clear=clearance(p);if(clear<1.72){ok=false;rejects.ground=(rejects.ground||0)+1;break;}const hit=firstHit(p,def.target);attempts++;if(hit){ok=false;const key=hit.object.userData.component||hit.object.name;rejects[key]=(rejects[key]||0)+1;break;}trials.push({width:w,height:h,position:round(p.toArray()),clearance:round(clear)});}
  if(ok)full.push({azimuth:az,elevation:el,offset:round(dir.clone().multiplyScalar(16).toArray()),maxDistance:round(Math.max(...trials.map(t=>new THREE.Vector3(...t.position).distanceTo(def.target)))),score:el*.6+Math.abs(az)*.16,trials});
 }
 for(const az of azimuths)for(const el of[0,8,18,28,40,55,70])for(const r of def.nearRadius){const azr=az*Math.PI/180,er=el*Math.PI/180,dir=new THREE.Vector3(Math.sin(azr)*Math.cos(er),Math.sin(er),-Math.cos(azr)*Math.cos(er));if(def.id!=='berenguer-anexo'&&Math.cos(azr)<.05)continue;const p=def.target.clone().addScaledVector(dir,r),clear=clearance(p);if(clear<1.72)continue;const hit=firstHit(p,def.target);attempts++;if(!hit)near.push({azimuth:az,elevation:el,closeOffset:round(dir.clone().multiplyScalar(r).toArray()),position:round(p.toArray()),clearance:round(clear),closeScale:false,score:el*.6+Math.abs(az)*.16+Math.abs(r-def.nearRadius[1])*.4});}
 full.sort((a,b)=>a.score-b.score);near.sort((a,b)=>a.score-b.score);const out={id:def.id,target:round(def.target.toArray()),bounds:[round(def.bounds.min.toArray()),round(def.bounds.max.toArray())],fullCandidates:full.slice(0,12),nearCandidates:near.slice(0,10),fullClearCount:full.length,nearClearCount:near.length,attempts,rejects};report.focuses.push(out);fs.writeFileSync('research/validation-v14/search_cameras.json',JSON.stringify(report,null,2));console.log(JSON.stringify({id:def.id,full:full[0]||null,near:near[0]||null,fullClearCount:full.length,nearClearCount:near.length,rejects}));
}
if(process.argv.includes('--verify')){
 const previous=JSON.parse(fs.readFileSync('research/validation-v14/search_cameras.json'));
 const verified={generatedAt:new Date().toISOString(),scope:'Nine rays across each front-facing architectural surface, for each of three real viewport proportions. Own facade/door/window surfaces count as the subject. Context occluders do not.',focuses:[]};
 const allowed={
  'berenguer-portada':['portada','acceso','escudo','fachada'],
  'berenguer-escudo':['escudo','portada','fachada'],
  'berenguer-sorolla':['fachada','portada','balcones','desvan','cornisa','tejado-fachada'],
  'berenguer-desvan':['desvan','fachada','cornisa','tejado-fachada'],
  'berenguer-anexo':['anexo','arcos-anexo']
 };
 for(const def of defs){const saved=previous.focuses.find(f=>f.id===def.id),candidates=[...saved.fullCandidates],samples=[];
  for(const u of[.15,.5,.85])for(const v of[.15,.5,.85]){const x=THREE.MathUtils.lerp(def.bounds.min.x,def.bounds.max.x,u),y=THREE.MathUtils.lerp(def.bounds.min.y,def.bounds.max.y,v),z=def.id==='berenguer-anexo'?36.36+(x+96.425)*1.2/5.65:def.target.z-(x-def.target.x)*Math.tan(yaw);samples.push(new THREE.Vector3(x,y,z));}
  for(const az of[-45,-30,-15,0,15,30,45,60])for(const el of[35,45,55,65,75,83]){const ar=az*Math.PI/180,er=el*Math.PI/180,dir=new THREE.Vector3(Math.sin(ar)*Math.cos(er),Math.sin(er),-Math.cos(ar)*Math.cos(er));candidates.push({azimuth:az,elevation:el,offset:dir.multiplyScalar(16).toArray(),score:el*.6+Math.abs(az)*.16});}
  const checked=[];for(const candidate of candidates){const dir=new THREE.Vector3(...candidate.offset).normalize(),trials=[];let clearCount=0,total=0,good=true;
   for(const[w,h]of aspects){const position=cameraFor(def.target,def.bounds,dir,w,h),blocked=[];if(clearance(position)<1.72){good=false;break;}const centerHit=firstHit(position,def.target);if(centerHit){good=false;break;}for(const p of samples){const hit=firstHit(position,p,.18);total++;if(!hit||(allowed[def.id].includes(hit.object.userData.component)&&hit.point.distanceTo(p)<2.5))clearCount++;else blocked.push({name:hit.object.name,component:hit.object.userData.component,point:round(hit.point.toArray()),sample:round(p.toArray())});}trials.push({width:w,height:h,position:round(position.toArray()),blocked});}
   if(good)checked.push({...candidate,sampleClear:clearCount,sampleCount:total,ratio:clearCount/total,trials});
  }
  checked.sort((a,b)=>b.ratio-a.ratio||a.score-b.score);const result={id:def.id,target:saved.target,bounds:saved.bounds,best:checked[0]||null,alternatives:checked.slice(1,5),totalCandidatesChecked:checked.length};verified.focuses.push(result);fs.writeFileSync('research/validation-v14/search_cameras_visibility.json',JSON.stringify(verified,null,2));console.log(JSON.stringify({id:def.id,best:result.best}));
 }
}
