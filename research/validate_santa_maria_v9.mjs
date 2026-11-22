// node --experimental-loader ./research/validate_loader.mjs research/validate_santa_maria_v9.mjs --export
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {createSantaMaria} from '../dist/js/santa-maria.js';
import {createSacredHeritage} from '../dist/js/heritage-sacred.js';
import {createCivicHeritage} from '../dist/js/heritage-civic.js';
import {createHeightSampler,buildTerrainGeometry} from '../dist/js/terrain.js';
import {createUrbanSurface} from '../dist/js/urban-surface.js';

const context=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context}),querySelector:()=>({checked:true})};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json'));
const geo=read('cartography'),elevation=read('elevation'),visitData=read('santa-maria-visit'),contextData=read('santa-maria-context'),landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const started=performance.now(),sacred=createSacredHeritage({project,heightAt:rawHeight,landmarks,data:geo,santaMariaVisit:visitData,santaMariaContext:contextData}),church=sacred.sites['santa-maria'],visit=church.userData.visit,buildMs=performance.now()-started;
const civic=createCivicHeritage({project,heightAt:rawHeight,landmarks,data:geo});
const roads=new Set([...(sacred.excludedRoadIds||[]),'733321149','733321150','1419281599'].map(String));
const urban=createUrbanSurface({data:{...geo,roads:geo.roads.filter(r=>!roads.has(String(r.osmId||r.id)))},project,heightAt:rawHeight,patches:[...sacred.patches,...civic.patches],exclusions:[...sacred.exclusions,...civic.exclusions],openPassageIds:new Set([...(landmarks.juderia.osmIds||[]).map(s=>s.split('/')[1]),...(landmarks.juderia.secondaryGates||[]).map(s=>String(s.id))]),collisionPolygons:landmarkData.sites.filter(s=>s.id!=='juderia').map(s=>s.footprint.map(c=>project(...c)))});
const terrain=buildTerrainGeometry(elevation,urban.groundHeight,[...sacred.patches,...civic.patches]);
const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));terrainMesh.name='Terreno IGN / PNOA';terrainMesh.userData.orthophoto=true;
const scene=new THREE.Group();scene.add(terrainMesh,sacred.group,civic.group);scene.updateMatrixWorld(true);visit.bindGround(terrain.meshHeightAt);
const errors=[],checks=[],assert=(ok,label)=>{checks.push({pass:!!ok,label});if(!ok)errors.push(label);};
const vector=a=>new THREE.Vector3(...a),ray=new THREE.Raycaster(),visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
assert(visitData.stops.length===16&&Object.keys(visit.focuses).length===16&&visitData.stops.every(s=>visit.focuses[s.id]),'all 16 documentary stop IDs resolve to model targets');
assert(visit.stats.sourceKeys.every(id=>visitData.sources.some(s=>s.id===id)),'every model source key resolves to the displayed bibliography');
assert(visit.qa.documented.naves===3&&visit.qa.documented.tramos===4&&visit.qa.documented.gothicMainVaultBays===2,'three naves, four longitudinal divisions and two large Gothic vault bays follow the published plan');
assert(visit.qa.documented.apseWindows===3&&visit.qa.documented.apseButtresses===4,'three high apse windows and four external buttresses are represented');
assert(visit.qa.documented.mainVaultHeightM===24&&visit.qa.tower.overallHeight===58&&Math.abs(visit.qa.tower.top-visit.qa.tower.base-58)<1e-8,'published 24 m main vault and 58 m tower are distinguished from approximate elevations');
assert(!visit.qa.crypt.modelled,'the blocked crypt is not invented as a visitable interior');
let finite=true,meshes=0,triangles=0;church.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))finite=false;});
assert(finite,'all church geometry and attribute values are finite');
const floors=visit.qa.floorSamples.map(a=>{const p=vector(a),ground=terrain.meshHeightAt(p.x,p.z);return{point:a,ground,clearance:p.y-ground};});
assert(floors.every(f=>f.clearance>=.05),'all nave, aisle, apse and chapel floor samples stand above final triangle terrain');
const openingResults=[];
for(const opening of visit.qa.openings){
 const side=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),vector(opening.direction)).normalize();let clear=0,total=0;const hits=[];
 const offsets=opening.kind==='window'?[-.22,.22]:[-.32,0,.32];
 for(const u of offsets)for(const dy of[-.22,.22]){
  const origin=vector(opening.origin).addScaledVector(side,u);origin.y+=dy;ray.set(origin,vector(opening.direction));ray.far=opening.distance;
  // The aperture must be cut through structural masonry. Closed, recessed
  // door leaves, window glass and slender mullions remain separate objects.
  const hit=ray.intersectObject(church,true).find(h=>h.object.isMesh&&visible(h.object)&&!['glass','wood','metal','bronze'].includes(h.object.userData.materialKind)&&!(h.object.userData.materialKind==='trim'&&opening.kind==='window'));
  const ground=ray.intersectObject(terrainMesh,false)[0];total++;if(!hit&&!ground)clear++;else hits.push({u,dy,mesh:hit?.object.name,point:hit?.point.toArray(),ground:ground?.point.toArray()});
 }
 openingResults.push({id:opening.id,kind:opening.kind,total,clear,hits});assert(clear===total,opening.id+' is a genuine pierced masonry opening with ground clearance');
}
const initial=new Map();church.traverse(o=>{if(o.isMesh)initial.set(o,{material:o.material,map:o.material.map,color:o.material.color.clone(),visible:o.visible,geometry:o.geometry});});
for(const stop of visitData.stops){assert(visit.selectFocus(stop.id)?.id===stop.id,'selection resolves '+stop.id);visit.setReadingMode('periods');}
visit.selectFocus(null);visit.setReadingMode('materials');visit.setSection(true);
assert([...initial.keys()].filter(m=>['cubiertas','bovedas','boveda-abside'].includes(m.userData.component)).every(m=>!m.visible),'didactic section removes roof and vault webs');
assert([...initial.keys()].filter(m=>['pilares','arcadas','nervios','abside'].includes(m.userData.component)).every(m=>m.visible),'section retains octagonal supports, arcades, ribs and apse envelope');
assert(['santa-maria-naves','santa-maria-bovedas','santa-maria-capillas'].every(id=>visit.focuses[id].requiresSection),'interior focuses explicitly require the didactic section');
visit.setSection(false);
assert([...initial].every(([m,v])=>m.material===v.material&&m.geometry===v.geometry&&m.material.map===v.map&&m.material.color.equals(v.color)&&m.visible===v.visible),'all visit modes restore original resource identity, materials and visibility');
const other=createSantaMaria({record:landmarks['santa-maria'],project,heightAt:rawHeight,visitData}),resources=church.userData.ownedResources,otherResources=other.group.userData.ownedResources;
assert(otherResources.materials.every(m=>!resources.materials.includes(m)),'new church instances own independent disposable materials');
assert(otherResources.textures.every(t=>!resources.textures.includes(t)),'new church instances own independent disposable textures');
const sacred2=createSacredHeritage({project,heightAt:rawHeight,landmarks,data:geo,santaMariaVisit:visitData,santaMariaContext:contextData});
assert(sacred2.group.userData.ownedResources.materials.every(m=>!sacred.group.userData.ownedResources.materials.includes(m)),'regional rebuild never reuses the disposed legacy chapel palette');

function safeFrame(w,h){const phone=w<=700,short=!phone&&h<=540,left=phone?16:short?372:424,right=w-(phone?16:short?64:80),top=phone?124:short?78:108,bottom=phone?h*.5-12:h-(short?62:80);return{left,right,top,bottom,width:Math.max(80,right-left),height:Math.max(80,bottom-top),offsetX:w/2-(left+right)/2,offsetY:h/2-(top+bottom)/2};}
function destination(focus,near,w,h){
 const target=focus.target.clone(),off=vector(near?focus.closeOffset:focus.offset);if(near)return{target,position:target.clone().add(off.multiplyScalar(Math.max(1,.9/(w/h))))};
 const dir=off.normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize(),f=safeFrame(w,h),tan=Math.tan(19*Math.PI/180),tx=tan*f.width/h*.91,ty=tan*f.height/h*.90;let distance=20;
 for(const x of[focus.bounds.min.x,focus.bounds.max.x])for(const y of[focus.bounds.min.y,focus.bounds.max.y])for(const z of[focus.bounds.min.z,focus.bounds.max.z]){const rel=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,rel.dot(dir)+Math.max(Math.abs(rel.dot(right))/tx,Math.abs(rel.dot(up))/ty));}
 return{target,position:target.clone().addScaledVector(dir,distance*1.08)};
}
const cameras=[];
for(const stop of visitData.stops){const focus=visit.focuses[stop.id];visit.setSection(focus.requiresSection);for(const[w,h]of[[1363,936],[390,844],[844,390]])for(const near of[false,true]){
 const {target,position}=destination(focus,near,w,h),f=safeFrame(w,h),camera=new THREE.PerspectiveCamera(38,w/h,.12,15000);camera.position.copy(position);camera.lookAt(target);camera.setViewOffset(w,h,f.offsetX,f.offsetY,w,h);camera.updateMatrixWorld();camera.updateProjectionMatrix();
 const direction=target.clone().sub(position);ray.set(position,direction.clone().normalize());ray.far=direction.length()-.05;const terrainHit=ray.intersectObject(terrainMesh,false)[0],clearance=position.y-terrain.meshHeightAt(position.x,position.z),corners=[];
 const contextHit=ray.intersectObjects([church.userData.context.group,...(stop.id==='santa-maria-berenguer'?[]:[civic.group])],true).find(hit=>visible(hit.object)&&!(stop.id==='santa-maria-escalinata'&&hit.object.userData.component==='santa-maria-escalinata'));
 if(!near)for(const x of[focus.bounds.min.x,focus.bounds.max.x])for(const y of[focus.bounds.min.y,focus.bounds.max.y])for(const z of[focus.bounds.min.z,focus.bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera),px=(p.x*.5+.5)*w,py=(-p.y*.5+.5)*h;if(px<f.left-.01||px>f.right+.01||py<f.top-.01||py>f.bottom+.01)corners.push([px,py]);}
 const label=stop.id+'/'+w+'x'+h+'/'+(near?'near':'full');assert(clearance>=1.7,label+' camera stands above final terrain');assert(!terrainHit,label+' target is not occluded by terrain');assert(!contextHit,label+' view clears immediate context and retained civic buildings');if(!near)assert(!corners.length,label+' fit box lies inside the actual usable viewport');
 cameras.push({id:stop.id,width:w,height:h,near,clearance,terrainOcclusion:terrainHit?.point.toArray()||null,contextOcclusion:contextHit?{name:contextHit.object.name,component:contextHit.object.userData.component,point:contextHit.point.toArray(),distanceToTarget:contextHit.point.distanceTo(target)}:null,offFrameCorners:corners.length,position:position.toArray(),target:target.toArray()});
}}
visit.setSection(false);
fs.mkdirSync('research/validation-v9',{recursive:true});fs.writeFileSync('dist/assets/data/santa-maria-plan.json',JSON.stringify({schemaVersion:1,...visit.plan},null,2));
const tracked=['dist/js/santa-maria.js','dist/js/heritage-sacred.js','dist/assets/data/santa-maria-visit.json','dist/assets/data/santa-maria-plan.json','dist/js/santa-maria-context.js'].filter(p=>fs.existsSync(p)),inputHashes=Object.fromEntries(tracked.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const result={pass:!errors.length,inputHashes,buildMs,stats:visit.stats,meshCount:meshes,triangles,checks,errors,openings:openingResults,floors,cameras,limitations:['Published plans and mapped OSM envelope are registered schematically, not as survey-grade photogrammetry.','Section is didactic and does not certify physical public access.','Window tracery and mouldings are simplified; lost sculpture, historic altarpiece and crypt are not recreated.','Only vault height and overall tower height are documentary dimensions; floor, secondary roofs and mouldings are approximate.']};
fs.writeFileSync('research/validation-v9/santa-maria-geometry.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:result.pass,buildMs,stats:visit.stats,checks:checks.length,errors,failedOpenings:openingResults.filter(o=>o.clear!==o.total),floorMinimum:Math.min(...floors.map(f=>f.clearance)),cameraIssues:cameras.filter(c=>c.terrainOcclusion||c.contextOcclusion||c.offFrameCorners)},null,2));
if(process.argv.includes('--export')){
 const typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null,exportMeshes=[];
 scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.isMesh)return;const bound=new THREE.Box3().setFromObject(o);if(o!==terrainMesh&&bound.distanceToPoint(church.position)>160)return;const m=Array.isArray(o.material)?o.material[0]:o.material;exportMeshes.push({name:o.name,positions:typed(o.geometry.attributes.position.array),indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),matrix:o.matrixWorld.toArray(),material:{color:m.color.toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,kind:o.userData.materialKind||null,orthophoto:!!o.userData.orthophoto},component:o.userData.component||null,churchFabric:!!o.userData.santaMariaFabric});});
 const cam=(name,p,t,section=false)=>({name,position:church.localToWorld(vector(p)).toArray(),target:church.localToWorld(vector(t)).toArray(),section});
 const renderCameras=[cam('santa-maria-conjunto',[80,63,100],[5,15,2]),cam('santa-maria-portada-norte',[27.42,14.5,18.35],[19.42,5.5,.35]),cam('santa-maria-portada-barroca',[.9,21.3,-62.72],[-1.1,9.3,-27.72]),cam('santa-maria-campanario',[74,38,93],[16.46,24.7,11.2]),cam('santa-maria-seccion',[53,61,-64],[-1.1,10,-3],true),cam('santa-maria-abside',[-37,32,61],[-1.2,15,14])];
 fs.writeFileSync('research/validation-v9/santa-maria-geometry.json.gz',zlib.gzipSync(JSON.stringify({terrainImage:'dist/assets/data/orthophoto.jpg',meshes:exportMeshes,cameras:renderCameras,sectionRemoved:['cubiertas','bovedas','bovedas-laterales','bovedas-capillas','boveda-abside','muro-norte','muro-occidental','portada-norte','portada-principal','cupula']})));
}
if(errors.length)process.exitCode=1;
