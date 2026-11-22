import fs from 'node:fs';import zlib from 'node:zlib';import * as THREE from 'three';
import {createCity} from '../dist/js/city.js';
import {createUrbanSurface} from '../dist/js/urban-surface.js';
import {createHeightSampler,buildTerrainGeometry} from '../dist/js/terrain.js';
import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerArchaeology} from '../dist/js/archaeology.js';
import {registerPortHeritage} from '../dist/js/port.js';
import {registerCoastHeritage,createCoastHeritage,coastShape,coastMeshOptions,inCoastBounds} from '../dist/js/coast.js';
import {createWaterMask,createCoastEnvironment} from '../dist/js/coast-environment.js';

const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const geo=read('coast-cartography'),elevation=read('coast-elevation'),water=read('coast-water');
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),heightAt=createHeightSampler(elevation),rawHeight=heightAt;
registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
registerPortHeritage(['port-industrial','port-garden','port-workers'].map(read),catalog,byId,tourOrder);
const records=registerCoastHeritage(['coast-pier','coast-grau','coast-archaeology'].map(read),catalog,byId,tourOrder);
const checks=[],errors=[];const assert=(test,message)=>{checks.push({message,pass:!!test});if(!test)errors.push(message);};
assert(catalog.length===28&&new Set(catalog.map(c=>c.id)).size===28,'28 unique catalogue places');
assert(tourOrder.length===28&&new Set(tourOrder).size===28,'28 unique full-tour stops');
assert(Object.values(records).map(s=>s.number).join(',')==='23,24,25,26','Coast numbering 23–26');
assert(catalog.filter(c=>c.region==='coast').length===4&&catalog.filter(c=>c.region==='puerto').length===9,'Four coastal and nine industrial places retain separate regions');
const mask=createWaterMask(water,project),waterCheck=c=>{const p=project(...c);return mask.isWater(p.x,p.z);};
assert(waterCheck([-.2058085,39.6520808]),'Sea below first mapped maritime tripod, not solid land');
assert(waterCheck([-.1950,39.64705]),'Sea below terminal platform, not an artificial peninsula');
assert(!waterCheck(records['grau-vell'].coordinate),'Grau Vell tower remains on mapped land');
assert(!waterCheck(records['puerto-antiguo'].coordinate),'Excavated ancient port remains on mapped land');
assert(water.excludedWaterWays.includes('1418515037'),'Dry fort moat is excluded from blue water');
const start=performance.now(),times={};let now=start;
const coastHeritage=createCoastHeritage({heightAt,project,records,data:geo});times.models=performance.now()-now;now=performance.now();
const scene=new THREE.Group();scene.add(coastHeritage.group);const points=coastHeritage.points,views=coastHeritage.views,modelBounds=coastHeritage.bounds;
const parents=new Set(Object.values(records).flatMap(s=>s.catastroBuildingIds||[]));for(const b of geo.buildings)if(String(b.id).startsWith('cat-')&&parents.has(String(b.id).slice(4).split('_part')[0]))coastHeritage.excludedIds.add(String(b.id));
const roadIds=new Set(Object.values(coastHeritage.sites).flatMap(s=>s.excludedRoadIds||[]).map(String));
const data={...geo,roads:geo.roads.filter(r=>!roadIds.has(String(r.osmId||r.id))&&!r.coordinates.some(c=>{const p=project(...c);return mask.isWater(p.x,p.z);}))};
const urban=createUrbanSurface({data,project,heightAt:mask.groundHeight(heightAt),patches:coastHeritage.patches,collisionPolygons:Object.values(coastHeritage.sites).flatMap(s=>s.collisionPolygons||[])});times.urban=performance.now()-now;now=performance.now();
const terrain=buildTerrainGeometry(elevation,urban.groundHeight,coastHeritage.patches,coastMeshOptions),terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));terrainMesh.name='Costa · terreno IGN';terrainMesh.userData.orthophoto=true;scene.add(terrainMesh);times.terrain=performance.now()-now;now=performance.now();
const city=createCity({data,project,heightAt:urban.groundHeight,terrainHeightAt:terrain.meshHeightAt,urban,inBounds:(x,z,m=0)=>inCoastBounds(x,z,m)&&!mask.isWater(x,z),excludeBuildingIds:coastHeritage.excludedIds,exclusions:coastHeritage.exclusions,detailBounds:{minX:3150,maxX:4100,minZ:4450,maxZ:5100},treeLimit:320});scene.add(city.group);times.city=performance.now()-now;
const environment=createCoastEnvironment({data:water,project,heightAt,mask});scene.add(environment.group);
const fp=[];for(const p of coastHeritage.patches){const top=p.height-.04;for(let i=0;i<p.polygon.length;i++){const a=p.polygon[i],b=p.polygon[(i+1)%p.polygon.length],bottom=Math.min(top-6,urban.groundHeight(a.x,a.z)-3,urban.groundHeight(b.x,b.z)-3);fp.push(a.x,top,a.z,b.x,top,b.z,b.x,bottom,b.z,a.x,top,a.z,b.x,bottom,b.z,a.x,bottom,a.z);}}
const fgeo=new THREE.BufferGeometry();fgeo.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fgeo.computeVertexNormals();const foundation=new THREE.Mesh(fgeo,new THREE.MeshStandardMaterial({color:'#b4a58a',side:THREE.DoubleSide}));foundation.name='Model foundations';scene.add(foundation);
const bp=[],bi=[],bc=[],color=new THREE.Color('#758371');for(const e of terrain.border){bp.push(e.x,e.y,e.z,e.x,-28,e.z);bc.push(color.r,color.g,color.b,color.r*.64,color.g*.64,color.b*.64);}for(let n=0;n<terrain.border.length;n++){const a=n*2,b=((n+1)%terrain.border.length)*2;bi.push(a,a+1,b,a+1,b+1,b);}const sides=new THREE.BufferGeometry();sides.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));sides.setAttribute('color',new THREE.Float32BufferAttribute(bc,3));sides.setIndex(bi);sides.computeVertexNormals();scene.add(new THREE.Mesh(sides,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide})));
scene.updateMatrixWorld(true);
let nonfinite=0,meshes=0,triangles=0,bytes=0;scene.traverse(o=>{if(!o.isMesh)return;meshes++;const g=o.geometry,count=o.isInstancedMesh?o.count:1;triangles+=(g.index?.count||g.attributes.position.count)/3*count;for(const a of Object.values(g.attributes)){bytes+=a.array.byteLength;for(const v of a.array)if(!Number.isFinite(v))nonfinite++;}if(o.instanceMatrix)for(const v of o.instanceMatrix.array)if(!Number.isFinite(v))nonfinite++;});assert(nonfinite===0,'All integrated geometry and instance matrices are finite');
coastHeritage.setMode('pantalan-paseo','historical');assert(coastHeritage.modes['pantalan-paseo']==='historical'&&coastHeritage.modes['pantalan-maritimo']==='historical','Historical mode synchronizes both halves of the pier');
for(const id of ['pantalan-paseo','pantalan-maritimo'])assert(!coastHeritage.sites[id].currentGroup.visible&&coastHeritage.sites[id].historicalGroup.visible,id+' switches current and historical geometry exclusively');
coastHeritage.setMode('pantalan-maritimo','current');assert(Object.keys(coastHeritage.modes).filter(id=>id.startsWith('pantalan-')).every(id=>coastHeritage.modes[id]==='current'),'Returning to current synchronizes both halves');
const ancient=coastHeritage.sites['puerto-antiguo'];assert(ancient.roof&&ancient.roofModes?.join(',')==='historical','Ancient warehouse section exists only in the historical phase');
for(const key of ['gola','trencatimons','exterior']){const spec=records['puerto-antiguo'].survey.marine[key],p=project(...spec.coordinate);assert(mask.isWater(p.x,p.z),key+' marine remains lie in the current sea mask');assert(terrain.meshHeightAt(p.x,p.z)<-4.8,key+' seabed stays below the interpreted underwater structures');}
const app=fs.readFileSync('dist/js/app.js','utf8');let innerWidth=1363,innerHeight=936,activeRegion='coast',coastFocus=null,portFocus=null;const isLandscape=()=>false;const mobile=()=>innerWidth<=700,excavation=null,portHeritage=null,landmarks={};
const preset=eval('('+app.slice(app.indexOf('function preset('),app.indexOf('function setShadowFraming(')).trim()+')');
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};const cameras=[],ray=new THREE.Raycaster();
for(const[id,site]of Object.entries(coastHeritage.sites)){
 const q=project(...records[id].coordinate);assert(inCoastBounds(q.x,q.z),id+' documented coordinate lies inside the coastal terrain');assert(Math.hypot(site.point.x-q.x,site.point.z-q.z)<250,id+' focus matches its documented complex');assert(!modelBounds[id].isEmpty(),id+' has non-empty 3D geometry');
 for(const mode of site.historicalGroup?['current','historical']:['current']){
  coastHeritage.setMode(id,mode);
  const states=[null,...Object.keys(site.focuses||{}).filter(f=>f!=='conjunto'&&(!site.focuses[f].modes||site.focuses[f].modes.includes(mode)))];
  for(const[w,h]of[[1363,936],[390,844]])for(const f of states){
   innerWidth=w;innerHeight=h;coastFocus=f;const dest=preset(id,false);assert([...dest.position.toArray(),...dest.target.toArray()].every(Number.isFinite),id+' '+mode+' '+(f||'general')+' '+w+' finite camera');
   const camera=new THREE.PerspectiveCamera(38,w/h,.12,15000);camera.position.copy(dest.position);if(inCoastBounds(camera.position.x,camera.position.z))camera.position.y=Math.max(camera.position.y,Math.max(0,urban.groundHeight(camera.position.x,camera.position.z))+1.75);camera.lookAt(dest.target);camera.setViewOffset(w,h,mobile()?0:-Math.min(180,w*.12),mobile()?-h*.21:0,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
   let out=0,total=0;if(!f){const box=coastHeritage.visibleBounds(id);for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);total++;if(Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1||p.z< -1)out++;}assert(out===0,id+' '+mode+' '+w+' overview fits viewport');}
   const d=dest.target.clone().sub(camera.position);ray.set(camera.position,d.clone().normalize());ray.far=d.length()-.3;const hit=ray.intersectObjects([city.buildings,terrainMesh,foundation],true).find(h=>visible(h.object));
   cameras.push({id,mode,focus:f,viewport:[w,h],offscreenPercent:total?100*out/total:0,contextOcclusion:hit?{name:hit.object.name,point:hit.point.toArray(),distance:hit.distance}:null,position:camera.position.toArray(),target:dest.target.toArray()});
   if(f&&site.focuses[f].position){assert(camera.position.y-dest.position.y<.01,id+' '+f+' remains at its intended low camera height');}
  }
 }
 if(site.roof){const prior=site.roof.visible;site.roof.visible=false;assert(site.currentGroup?.children.some(o=>o!==site.roof)||site.historicalGroup?.children.some(o=>o!==site.roof),id+' section retains permanent structural geometry');site.roof.visible=prior;}
 coastHeritage.setMode(id,'current');
}
coastFocus=null;innerWidth=1363;innerHeight=936;
const result={pass:errors.length===0,checks,errors,times,geometry:{meshes,triangles,bytes,nonfinite},buildings:city.buildings.userData,roads:city.roads.userData,heritage:coastHeritage.stats,terrain:terrain.geometry.userData,water:environment.stats,excludedContextParts:coastHeritage.excludedIds.size,cameras,memoryMb:process.memoryUsage().rss/1048576};
fs.writeFileSync('research/validation-v6/coast-regression.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,checks:checks.length,cameras:cameras.filter(c=>c.offscreenPercent||c.contextOcclusion)},null,2));
if(process.argv.includes('--export')){
 const enc=a=>({type:a.constructor.name,count:a.length,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}),exported=[];
 scene.traverse(o=>{if(!o.isMesh)return;let siteId=null,phase=null,isRoof=false;for(const[id,s]of Object.entries(coastHeritage.sites))for(let ancestor=o;ancestor;ancestor=ancestor.parent){if(ancestor===s.group)siteId=id;if(ancestor===s.currentGroup)phase='current';if(ancestor===s.historicalGroup)phase='historical';if(ancestor===s.roof)isRoof=true;}
  const g=o.geometry,m=Array.isArray(o.material)?o.material[0]:o.material;exported.push({name:o.name,siteId,phase,isRoof,water:!!o.userData.water,castShadow:o.castShadow,receiveShadow:o.receiveShadow,positions:enc(g.attributes.position.array),indices:g.index?enc(g.index.array):null,uv:g.attributes.uv?enc(g.attributes.uv.array):null,colors:g.attributes.color?enc(g.attributes.color.array):null,matrix:o.matrixWorld.toArray(),instances:o.isInstancedMesh?enc(o.instanceMatrix.array):null,instanceColors:o.instanceColor?enc(o.instanceColor.array):null,material:{color:m.color?.toArray()||new THREE.Color('#28636a').toArray(),roughness:o.userData.water?.18:m.roughness??1,metalness:m.metalness||0,opacity:m.opacity??1,orthophoto:!!o.userData.orthophoto}});
 });
 const dest=preset('overview');fs.writeFileSync('research/qa-v5-geometry.json.gz',zlib.gzipSync(JSON.stringify({meshes:exported,cameras,overview:{position:dest.position.toArray(),target:dest.target.toArray()},terrainImage:'dist/assets/data/coast-orthophoto.jpg'}),{level:4}));console.log('Exported real Three.js coastal geometry for independent CPU visual inspection.');
}
if(errors.length)process.exitCode=1;
