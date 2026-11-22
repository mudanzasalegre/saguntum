import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {createPorticContext} from '../../dist/js/portic-context.js';
import {createHeightSampler,buildTerrainGeometry} from '../../dist/js/terrain.js';
import {pointInPolygon} from '../../dist/js/urban-surface.js';

const require=createRequire(import.meta.url),{createCanvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json','utf8'));
const data=read('cartography'),contextData=read('portic-context'),elevation=read('elevation');
const checks=[],failures=[],check=(pass,label,detail)=>{checks.push({label,pass:!!pass});if(!pass)failures.push({label,detail});};
const source=new Map(data.buildings.map(b=>[String(b.id),b])),sourceIssues=[];
for(const row of [...contextData.buildings,...contextData.coreBuildings]){
 const {contextComponent,...original}=row;if(JSON.stringify(original)!==JSON.stringify(source.get(String(row.id))))sourceIssues.push(row.id);
}
check(sourceIssues.length===0,'Source footprints, courtyards, heights and provenance are preserved verbatim',sourceIssues);
check(contextData.coreBuildings.length===27&&new Set(contextData.coreBuildings.map(b=>b.parentId)).size===2,'Both registered modern host parcels are explicitly reserved for the archaeological model');
check(contextData.buildings.every(b=>!contextData.coreOwnership.parents.includes(b.parentId)),'No host building is duplicated among the neighbouring context');
check(Object.keys(contextData.ownershipTransfers).length===0,'No ownership transfers from previous visits');
for(const owner of contextData.selectionStats.retainedOwners){
 const file='dist/assets/data/'+owner+'-context.json',old=read(owner+'-context');
 check(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===contextData.inputHashes[owner+'-context'],owner+' context remains unchanged');
 check(contextData.buildings.every(b=>!(old.excludedBuildingIds||[]).map(String).includes(String(b.id))),owner+' retains unique building ownership');
 check(contextData.excludedRoadIds.every(id=>!(old.excludedRoadIds||[]).map(String).includes(id)),owner+' retains its detailed streets');
}
check(contextData.publicSpaceAreas.every(p=>p.derived)&&contextData.trees.every(p=>p.interpretive),'Plaza and tree details are explicitly interpretive');
check(contextData.pavementMesh.coverage.pass,'Public surfaces have no overlap with buildings, hosts, private courts or previous paving',contextData.pavementMesh.coverage);
check(contextData.pavementMesh.groups.length===4,'Asphalt, footways, plaza and planting form four disjoint surface regions');
const snapshot=JSON.stringify(contextData),ground=createHeightSampler(elevation),terrain=buildTerrainGeometry(elevation,ground,[]);
const context=createPorticContext({data,heightAt:ground,contextData});context.bindGround(terrain.meshHeightAt);
check(JSON.stringify(contextData)===snapshot,'Construction and terrain binding never mutate source data');
check(context.patches.length===0,'Urban context adds no terrain flattening patch');
check(Object.keys(context.focuses).join(',')==='portic-plaza,portic-acceso,portic-entorno','All three exterior focus contracts exist');
check(Object.values(context.focuses).every(f=>f.closeScale===false&&f.fitBounds===false),'Exterior cameras keep physical world positions');
check(context.stats.fallbackHeight===0,'Every context height uses source evidence',context.stats);
check(context.stats.heightConflictsReviewed===contextData.heightReview.length,'Every height conflict is retained in the QA record');
check(context.stats.maximumRoofCorrectionM<.7,'Binding final terrain does not create false high roof corrections',context.qa.buildings.filter(b=>b.roofCorrectionM>.001));
check(context.vegetation.parent===context.group&&context.vegetation.children.every(m=>['trunk','foliage'].includes(m.userData.materialKind)),'Vegetation can be switched independently of benches and curbs');
const scale=111320*Math.cos(39.679*Math.PI/180),project=(lon,lat)=>({x:(lon+.278)*scale,z:(39.679-lat)*111320});
const obstacles=[...contextData.coreBuildings,...contextData.buildings].map(b=>({p:b.coordinates.map(p=>project(...p)),holes:(b.holes||[]).map(h=>h.map(p=>project(...p)))}));
const collisions=contextData.trees.filter(t=>{const p=project(...t.coordinate);return obstacles.some(b=>pointInPolygon(p.x,p.z,b.p)&&!b.holes.some(h=>pointInPolygon(p.x,p.z,h)));});
check(!collisions.length,'Tree trunks stand outside every registered building and host footprint',collisions);
let finite=true,meshes=0,triangles=0,samples=0,maximumDrapeError=0;
const kinds=new Set();
context.group.traverse(mesh=>{
 if(!mesh.isMesh)return;meshes++;triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;
 for(const a of Object.values(mesh.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))finite=false;
 if(mesh.userData.materialKind!=='paving')return;kinds.add(mesh.userData.surfaceKind);
 const p=mesh.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3)for(const weights of [[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]]){
  let x=0,y=0,z=0;for(let j=0;j<3;j++){x+=p.getX(i+j)*weights[j];y+=p.getY(i+j)*weights[j];z+=p.getZ(i+j)*weights[j];}
  maximumDrapeError=Math.max(maximumDrapeError,Math.abs(y-terrain.meshHeightAt(x,z)-.105));samples++;
 }
});
check(finite,'All geometry attributes are finite');
check(samples>1000&&maximumDrapeError<.001,'All public paving triangles fit the exact final terrain mesh',{samples,maximumDrapeError});
check(kinds.has('asphalt')&&kinds.has('planting')&&kinds.has('paving'),'Asphalt, planting and mineral paving have distinct material treatment');
const focusQA=Object.values(context.focuses).map(f=>{
 const eye=f.target.clone().add(new THREE.Vector3(...f.closeOffset));
 return {id:f.id,closeGroundClearanceM:eye.y-terrain.meshHeightAt(eye.x,eye.z),
  closeInsideBuilding:obstacles.some(b=>pointInPolygon(eye.x,eye.z,b.p)&&!b.holes.some(h=>pointInPolygon(eye.x,eye.z,h)))};
});
check(focusQA.every(f=>Math.abs(f.closeGroundClearanceM-2.15)<.001&&!f.closeInsideBuilding),'Close exterior eyes remain at pedestrian height outside buildings',focusQA);
const saved=context.ownedResources.materials.map(m=>({m,map:m.map,bump:m.bumpMap,color:m.color.clone(),vertexColors:m.vertexColors}));
context.setReadingMode('periods');
check(context.ownedResources.materials.every(m=>m.map===null&&m.bumpMap===null&&!m.vertexColors),'Reading mode removes all texture and bump maps');
context.setReadingMode('materials');
check(saved.every(s=>s.m.map===s.map&&s.m.bumpMap===s.bump&&s.m.color.equals(s.color)&&s.m.vertexColors===s.vertexColors),'Material mode restores every original context material');
const counts=Object.fromEntries(Object.entries(context.ownedResources).map(([k,v])=>[k,v.length]));
context.bindGround(terrain.meshHeightAt);
check(Object.entries(counts).every(([k,n])=>context.ownedResources[k].length===n),'Ground rebinding releases replaced resources without leaks');
const other=createPorticContext({data,heightAt:ground,contextData}),materials=new Set(context.ownedResources.materials),textures=new Set(context.ownedResources.textures);
check(other.ownedResources.materials.every(m=>!materials.has(m))&&other.ownedResources.textures.every(t=>!textures.has(t)),'Instances have independent materials and textures');
other.dispose();check(!other.ownedResources.geometries.length&&context.ownedResources.geometries.length>0,'Disposing one context leaves the other intact');
context.dispose();check(Object.values(context.ownedResources).every(a=>a.length===0),'Dispose releases all owned resources');
const report={pass:!failures.length,checks:checks.length,results:checks,stats:context.stats,geometry:{meshes,triangles,finite},
 pavement:{samples,maximumDrapeError},focusQA,publicSpaceDetails:context.qa.publicSpaceDetails,failures};
fs.writeFileSync('research/validation-v18/portic-context-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks,stats:report.stats,geometry:report.geometry,pavement:report.pavement,focusQA,failures},null,2));
terrain.geometry.dispose();if(failures.length)process.exitCode=1;
