// Run from the repository root:
// node --experimental-loader ./research/validate_loader.mjs research/validate_palancia_v8.mjs
// Scope: the app's Palancia builder and its Theatre/Castle context. The dedicated
// V6 landscape suite already covers water, vegetation and river observations.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {createMonuments as realCreateMonuments,theatreRoadIds,theatreBuildingIds} from '../dist/js/monuments.js';
import {createHeightSampler,buildTerrainGeometry,terrainShape} from '../dist/js/terrain.js';
import {createUrbanSurface as realCreateUrbanSurface} from '../dist/js/urban-surface.js';
import {createCity as realCreateCity} from '../dist/js/city.js';
import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerLandscapes,isLandscape,inLandscapeBounds,landscapeRoadExclusions,createLandscapeHeritage} from '../dist/js/landscapes.js';
import {createLandscapeWaterMask,createLandscapeEnvironment} from '../dist/js/landscape-environment.js';

const canvasContext=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const layers={monuments:true,city:true,vegetation:true};
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>canvasContext}),querySelector:selector=>({checked:layers[selector.match(/data-layer=["']?(\w+)/)?.[1]]??true})};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json'));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const landscapeConfig=read('landscape-regions'),historicContext=read('historic-context'),castleData=read('castle-visit'),theatreData=read('theatre-visit');
theatreData.plan=read('theatre-plan');
const landscapeRecords=registerLandscapes(['landscape-marjal','landscape-dunes','landscape-palancia'].map(read),catalog,byId,tourOrder);
const landGeo=read('palancia-cartography'),landElevation=read('palancia-elevation'),landWater=read('palancia-water');
const landscapes={palancia:{geo:landGeo,elevation:landElevation,water:landWater,height:createHeightSampler(landElevation)}};
const scene=new THREE.Group(),renderer={shadowMap:{needsUpdate:false}},points={},views={},modelBounds={};
const regionsBuilt=new Set(),regionLoads=new Map(),regionRoots=new Map(),regionUsed=new Map();
let activeRegion='palancia',buildQueue=Promise.resolve(),lightMode='golden';const mobile=()=>false,reduced=false,pause=()=>Promise.resolve();
let terrain,city,urban,monuments,sacred,civic,archaeology,excavation,portHeritage,portTerrain,portCity,portUrban,coastHeritage,coastTerrain,coastCity,coastUrban,coastEnvironment;
const regionOf=c=>c?.region||'sagunto',regionTerrain=r=>r==='sagunto'?terrain:r==='coast'?coastTerrain:r==='puerto'?portTerrain:landscapes[r]?.terrain;
const $=()=>({textContent:'',classList:{contains:()=>false}}),updates=[];
function updateStatus(){updates.push([...regionsBuilt]);}
async function ensureLandscapeData(region){if(!landscapes[region])throw Error('Unexpected region '+region);return landscapes[region];}
const buildCalls={monuments:[],urban:[],city:[],terrain:[]};
function createMonuments(options){const result=realCreateMonuments(options);buildCalls.monuments.push({options,result});return result;}
function createUrbanSurface(options){const result=realCreateUrbanSurface(options);buildCalls.urban.push({options,result});return result;}
function createCity(options){const result=realCreateCity(options);buildCalls.city.push({options,result});return result;}
async function createTerrain({data,heightAt,surfaceHeight,patches=[],shape=terrainShape,meshOptions={}}){
 const context=landscapes.palancia.context;
 buildCalls.terrain.push({contextPresent:!!context,castleDeferred:context?.castle===null,heightAt,shape,meshOptions});
 const sample=(x,z)=>surfaceHeight?surfaceHeight(x,z,heightAt(x,z)):heightAt(x,z);
 const built=buildTerrainGeometry(data,sample,patches,{...meshOptions,shape}),group=new THREE.Group();group.name='Palancia final terrain';
 const photo=new THREE.Texture(),natural=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:natural,color:'#f2e7ce'}),mesh=new THREE.Mesh(built.geometry,material);mesh.name='Palancia terrain surface';group.add(mesh);
 const positions=[];for(const patch of patches){if(!patch.polygon?.length||!Number.isFinite(patch.height))continue;const top=patch.height-.04;for(let i=0;i<patch.polygon.length;i++){const a=patch.polygon[i],b=patch.polygon[(i+1)%patch.polygon.length],bottom=Math.min(top-6,sample(a.x,a.z)-3,sample(b.x,b.z)-3);positions.push(a.x,top,a.z,b.x,top,b.z,b.x,bottom,b.z,a.x,top,a.z,b.x,bottom,b.z,a.x,bottom,a.z);}}
 if(positions.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();const skirt=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#b4a58a',side:THREE.DoubleSide}));skirt.name='Zócalos bajo las cimentaciones';group.add(skirt);}
 return{...built,group,mesh,photo,natural,setMode(mode){material.map=mode==='photo'?photo:natural;}};
}
const trackedFiles=['app','theatre','monuments','castle','terrain','city','urban-surface','landscapes','landscape-palancia','landscape-environment'].map(name=>'dist/js/'+name+'.js');
const hashFile=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),inputHashes=Object.fromEntries(trackedFiles.map(file=>[file,hashFile(file)]));
const appSource=fs.readFileSync('dist/js/app.js','utf8'),extract=(a,b)=>eval('('+appSource.slice(appSource.indexOf(a),appSource.indexOf(b,appSource.indexOf(a))).trim()+')');
const applyRegionVisibility=extract('function applyRegionVisibility(','function setRegion('),disposeRegion=extract('function disposeRegion(','function trimRegionCache('),trimRegionCache=extract('function trimRegionCache(','async function ensureRegion('),ensureRegion=extract('async function ensureRegion(','async function buildRegion('),buildRegion=extract('async function buildRegion(','function updateStatus(');
const checks=[],errors=[],assert=(condition,message)=>{checks.push({pass:!!condition,message});if(!condition)errors.push(message);};
// Keep a genuinely independent Sagunto theatre resident: Palancia construction
// and disposal must never replace its points or dispose its private resources.
const saguntoHeight=createHeightSampler(read('elevation'));
monuments=realCreateMonuments({heightAt:saguntoHeight,project,data:historicContext,theatreVisit:theatreData,deferCastle:true});
const foreignRoot=monuments.group,foreignTheatre=monuments.theatre,foreignPoint=monuments.points.theatre;scene.add(foreignRoot);points.theatre=foreignPoint;
regionsBuilt.add('sagunto');regionRoots.set('sagunto',[foreignRoot]);regionUsed.set('sagunto',0);
const foreignResources=new Set([...foreignTheatre.userData.ownedResources.materials,...foreignTheatre.userData.ownedResources.textures]);let foreignDisposals=0;for(const resource of foreignResources)resource.addEventListener('dispose',()=>foreignDisposals++);
const started=performance.now();await Promise.all([ensureRegion('palancia'),ensureRegion('palancia')]);const buildMs=performance.now()-started;
const land=landscapes.palancia,context=land.context,theatre=context.theatre,visit=theatre.userData.visit,castle=context.castle,castleVisit=castle.userData.visit;
scene.updateMatrixWorld(true);
assert(buildCalls.monuments.length===1&&buildCalls.terrain.length===1&&updates.length===1,'concurrent Palancia requests construct one real region');
assert(buildCalls.terrain[0].contextPresent&&buildCalls.terrain[0].castleDeferred,'Palancia creates theatre accommodation before terrain and defers castle');
assert(buildCalls.monuments[0].options.data===historicContext&&buildCalls.monuments[0].options.theatreVisit===theatreData&&buildCalls.monuments[0].options.castleVisit===castleData,'Palancia context receives shared geographic and documented visit data');
assert(context.group.children.includes(castle)&&Object.keys(castleVisit.focuses).length===castleData.stops.length,'Palancia builds the complete castle after terrain');
assert(visit.stats.stops===16&&theatreData.stops.every(stop=>visit.focuses[stop.id]),'Palancia context retains all 16 theatre focuses');
assert(buildCalls.city[0].options.terrainHeightAt===land.terrain.meshHeightAt,'Palancia city receives final rendered ground');
assert([...theatreBuildingIds,...context.castleBuildingIds].every(id=>buildCalls.city[0].options.excludeBuildingIds.has(String(id))),'Palancia city excludes theatre and castle duplicate buildings');
assert(buildCalls.urban[0].options.data.theatrePolygon===historicContext.theatrePolygon&&buildCalls.city[0].options.data.castlePolygon===historicContext.castlePolygon,'Palancia context exclusion uses the actual theatre and castle polygons');
assert(land.urban.segments.every(segment=>!theatreRoadIds.has(String(segment.road.osmId||segment.road.id))&&!context.castleRoadIds.has(String(segment.road.osmId||segment.road.id))),'Palancia street mesh omits internal theatre and castle paths');
assert(context.group.visible&&land.terrain.group.visible&&land.city.group.visible,'Palancia context and terrain are visible in their active region');
assert(points.theatre===foreignPoint&&monuments.theatre===foreignTheatre,'building Palancia preserves Sagunto catalogue references');
const ground=land.mask.groundHeight(land.height),center=theatre.userData.layout.worldCenter;
const farField=[[center.x+100,center.z],[center.x-100,center.z],[center.x,center.z-100],[2500,0],[5000,400]];
assert(farField.every(([x,z])=>context.surfaceHeight(x,z,ground(x,z))===ground(x,z)),'theatre accommodation leaves distant river terrain unchanged');

// Final mesh clearance catches coarse Palancia triangles crossing a lowered
// theatre envelope even when the analytical height function is correct.
const theatreSurface={samples:0,buried:0,minimumClearance:Infinity,issues:[]};
const floorComponents=new Set(['orchestra','proedria','ima-cavea','media-cavea','summa-cavea','proscaenium','hyposcaenium']);
theatre.traverse(mesh=>{
 if(!mesh.isMesh||!floorComponents.has(mesh.userData.component))return;
 const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
 for(let i=0;i<p.count;i+=3){
  if(n.getY(i)<.8)continue;
  const point=new THREE.Vector3((p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3).applyMatrix4(mesh.matrixWorld),groundY=land.terrain.meshHeightAt(point.x,point.z),clearance=point.y-groundY;
  theatreSurface.samples++;theatreSurface.minimumClearance=Math.min(theatreSurface.minimumClearance,clearance);
  if(clearance<-.06){theatreSurface.buried++;if(theatreSurface.issues.length<24)theatreSurface.issues.push({component:mesh.userData.component,point:point.toArray(),groundY,clearance});}
 }
});
assert(theatreSurface.samples>0&&theatreSurface.buried===0,'Palancia rendered mesh does not bury theatre floors, seating or exposed subsoil');
const castleFloors=castleVisit.qa.floorSamples;
const castleGround={samples:castleFloors.length,maximumSamplerError:Math.max(...castleFloors.map(sample=>Math.abs(sample.y-(land.terrain.meshHeightAt(sample.x,sample.z)+sample.offset))))};
assert(castleGround.samples>0&&castleGround.maximumSamplerError<.002,'Palancia castle floor samples use the final terrain mesh sampler');
const ray=new THREE.Raycaster(),contextRays=[];
const visible=object=>{for(let o=object;o;o=o.parent)if(!o.visible)return false;return true;};
for(const x of[-20,-10,0,10,20])for(const z of[-18,-6,6,18,30]){
 const point=theatre.localToWorld(new THREE.Vector3(x,0,z));ray.set(new THREE.Vector3(point.x,300,point.z),new THREE.Vector3(0,-1,0));ray.far=300-(point.y-12);
 const hit=ray.intersectObjects([land.city.buildings,land.city.roads],true).find(hit=>visible(hit.object));contextRays.push({local:[x,z],hit:hit?{name:hit.object.name,point:hit.point.toArray()}:null});
}
assert(contextRays.every(sample=>!sample.hit),'Palancia theatre has no overlapping contextual building or road in 25 sampled rays');
const cameraChecks=[];
for(const stop of theatreData.stops){const focus=visit.focuses[stop.id];for(const near of[false,true]){
 const position=focus.target.clone().add(new THREE.Vector3(...(near?focus.closeOffset:focus.offset))),clearance=position.y-land.terrain.meshHeightAt(position.x,position.z);
 cameraChecks.push({id:stop.id,near,clearance});assert(Number.isFinite(clearance)&&clearance>=1.55,stop.id+'/'+near+' Palancia context camera is rebound to final ground');
}}
layers.monuments=false;applyRegionVisibility();assert(!context.group.visible&&land.terrain.group.visible&&land.city.group.visible,'Palancia monument layer hides context without hiding terrain or city');layers.monuments=true;applyRegionVisibility();
const contextResources=new Set([...castle.userData.ownedResources.materials,...castle.userData.ownedResources.textures,...theatre.userData.ownedResources.materials,...theatre.userData.ownedResources.textures]);
assert([...contextResources].every(resource=>!foreignResources.has(resource)),'Palancia and Sagunto monument instances own separate disposable resources');
const disposed=new Map([...contextResources].map(resource=>[resource,0]));for(const resource of contextResources)resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1));
visit.setReadingMode('periods');castleVisit.setReadingMode('periods');visit.setSection(true);
assert([...castle.userData.ownedResources.materials,...theatre.userData.ownedResources.materials].every(material=>material.map===null),'Palancia period reading detaches all monument texture maps');
const builtSummary={theatre:visit.stats,castle:castleVisit.stats,buildings:land.city.buildings.userData,roads:land.city.roads.userData,terrain:land.terrain.geometry.userData};
const loadedRoots=[...regionRoots.get('palancia')];disposeRegion('palancia');
assert([...disposed.values()].every(count=>count===1),'disposing Palancia frees detached theatre and castle resources exactly once');
assert(!foreignDisposals&&foreignRoot.parent===scene&&points.theatre===foreignPoint,'Palancia disposal preserves Sagunto resources, roots and points');
assert(loadedRoots.every(root=>!root.parent)&&!regionsBuilt.has('palancia')&&!regionRoots.has('palancia')&&!regionUsed.has('palancia'),'Palancia disposal removes its roots and readiness');
assert(['context','terrain','city','urban','heritage','environment'].every(key=>land[key]===undefined),'Palancia disposal clears all regional object references');
assert(Object.entries(inputHashes).every(([file,hash])=>hashFile(file)===hash),'validated application and model files stayed unchanged during this run');
const result={pass:errors.length===0,inputHashes,scope:'Actual Palancia app builder; Theatre/Castle context, final terrain, exclusion, rebinding and regional disposal. Orthophoto texture I/O is replaced for Node.',buildMs,checks,errors,theatreSurface,castleGround,contextRays,cameraChecks,resourceCounts:{palancia:contextResources.size,sagunto:foreignResources.size,foreignDisposals},...builtSummary};
fs.mkdirSync('research/validation-v8',{recursive:true});fs.writeFileSync('research/validation-v8/palancia-context.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:result.pass,checks:checks.length,buildMs,errors,theatreSurface,castleGround,contextIssues:contextRays.filter(sample=>sample.hit),cameraIssues:cameraChecks.filter(sample=>sample.clearance<1.55),resourceCounts:result.resourceCounts},null,2));
if(errors.length)process.exitCode=1;
