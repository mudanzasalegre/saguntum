// Exercise the application's actual queue/disposal routines, without a GPU.
import fs from 'node:fs';import * as THREE from 'three';
const source=fs.readFileSync('dist/js/app.js','utf8');
const catalog=[{id:'theatre',region:'sagunto'},{id:'marjal-moros',region:'marjal'},{id:'dunas-almarda',region:'almarda'}],regionOf=c=>c.region;
const scene=new THREE.Scene(),regionsBuilt=new Set(),regionLoads=new Map(),regionRoots=new Map(),regionUsed=new Map(),landscapes={marjal:{},almarda:{}},points={},views={},modelBounds={};
let terrain,city,urban,monuments,sacred,civic,archaeology,excavation,portHeritage,portTerrain,portCity,portUrban,coastHeritage,coastTerrain,coastCity,coastUrban,coastEnvironment;
let activeRegion='marjal',buildQueue=Promise.resolve(),small=false,fail=null,constructionCount=0,concurrent=0,peak=0;const mobile=()=>small;
const regionTerrain=r=>r==='sagunto'?terrain:landscapes[r]?.terrain;
const disposed={geometries:0,materials:0,textures:0,environments:0,instanceMeshes:0};
const extract=(a,b)=>eval('('+source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a))).trim()+')');
const disposeRegion=extract('function disposeRegion(','function trimRegionCache(');
async function buildRegion(region){
 constructionCount++;concurrent++;peak=Math.max(peak,concurrent);await new Promise(r=>setTimeout(r,2));
 if(region===fail){concurrent--;fail=null;throw new Error('synthetic source load failure');}
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial(),photo=new THREE.Texture(),natural=new THREE.Texture();material.map=natural;
 geometry.addEventListener('dispose',()=>disposed.geometries++);material.addEventListener('dispose',()=>disposed.materials++);for(const t of[photo,natural])t.addEventListener('dispose',()=>disposed.textures++);
 const root=new THREE.Group();root.add(new THREE.Mesh(geometry,material));const instanced=new THREE.InstancedMesh(geometry,material,1);instanced.addEventListener('dispose',()=>disposed.instanceMeshes++);root.add(instanced);scene.add(root);const surface={group:root,photo,natural};
 if(region==='sagunto')terrain=surface;else{landscapes[region].terrain=surface;landscapes[region].environment={dispose(){disposed.environments++;}};}
 const id=catalog.find(c=>c.region===region).id;points[id]=new THREE.Vector3();views[id]={};modelBounds[id]=new THREE.Box3();
 regionsBuilt.add(region);regionRoots.set(region,[root]);regionUsed.set(region,performance.now());concurrent--;
}
const trimRegionCache=extract('function trimRegionCache(','async function ensureRegion(');
const ensureRegion=extract('async function ensureRegion(','async function buildRegion(');
const checks=[],assert=(ok,message)=>{checks.push({pass:!!ok,message});if(!ok)throw new Error(message);};
await Promise.all([ensureRegion('marjal'),ensureRegion('marjal')]);assert(constructionCount===1&&scene.children.length===1,'Concurrent requests share a single model construction');
activeRegion='almarda';await ensureRegion('almarda');assert(regionsBuilt.size===2,'Desktop retains at most two built regions');
activeRegion='sagunto';await ensureRegion('sagunto');assert(regionsBuilt.size===2&&!regionsBuilt.has('marjal'),'Oldest inactive region is evicted before new construction');assert(!points['marjal-moros']&&points['dunas-almarda'],'Only the evicted region loses points and references');assert(disposed.geometries===1&&disposed.materials===1&&disposed.textures===2&&disposed.environments===1&&disposed.instanceMeshes===1,'Eviction releases geometry, materials, both terrain textures, instance buffers and water environment');
small=true;await ensureRegion('sagunto');assert(regionsBuilt.size===1&&regionsBuilt.has('sagunto'),'Cached-region access applies the reduced mobile capacity');small=false;activeRegion='almarda';await ensureRegion('almarda');small=true;trimRegionCache();assert(regionsBuilt.size===1&&regionsBuilt.has('almarda'),'Viewport resize releases the inactive region immediately');activeRegion='marjal';await ensureRegion('marjal');assert(regionsBuilt.size===1&&regionsBuilt.has('marjal')&&scene.children.length===1,'Mobile keeps one region and no orphan roots');
activeRegion='almarda';fail='almarda';let failure=false;try{await ensureRegion('almarda');}catch{failure=true;}assert(failure&&!regionLoads.size,'Failed queued load clears its pending promise');await ensureRegion('almarda');assert(regionsBuilt.has('almarda'),'Queue recovers after failed load');
const before=constructionCount;activeRegion='sagunto';const stale=ensureRegion('sagunto');activeRegion='marjal';const latest=ensureRegion('marjal');await Promise.all([stale,latest]);assert(constructionCount===before+1&&regionsBuilt.has('marjal'),'Superseded navigation skips an obsolete queued scene');assert(peak===1,'Heavy model construction is serialized');
const result={pass:true,checks,constructions:constructionCount,disposed,finalRegions:[...regionsBuilt]};fs.writeFileSync('research/validation-v6/region-cache.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
