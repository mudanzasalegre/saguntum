import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {createSangreContext,withoutSangreClaims} from '../../dist/js/sangre-context.js';
import {createHeightSampler,buildTerrainGeometry} from '../../dist/js/terrain.js';

const require=createRequire(import.meta.url),{createCanvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json','utf8'));
const data=read('cartography'),contextData=read('sangre-context'),elevation=read('elevation');
const checks=[],failures=[];
const check=(pass,label,detail)=>{checks.push({pass:!!pass,label});if(!pass)failures.push({label,detail});};
const sourceById=new Map(data.buildings.map(row=>[String(row.id),row])),dataBefore=JSON.stringify(contextData);
const sourceFailures=[];
for(const row of[...contextData.buildings,...contextData.coreBuildings]){
 if(row.derivedClip)continue;
 const {contextComponent,...copy}=row;
 if(JSON.stringify(copy)!==JSON.stringify(sourceById.get(String(row.id))))sourceFailures.push(row.id);
}
check(sourceFailures.length===0,'All cadastral plants, levels, heights and provenance remain identical to source rows',sourceFailures);
check(contextData.coreBuildings.length===9&&contextData.coreExcludedBuildingIds.length===11,'Nine core cadastral parts and two OSM identities are assigned to the ermita');
check(contextData.sourceResiduals.length===1&&contextData.excludedBuildingIds.includes('733403822'),'Incomplete cadastral coverage retains the substantial OSM residual');
check(contextData.heightReview.length===4&&contextData.heightReview.every(r=>sourceById.get(r.id).surfaceHeightEstimate===r.surfaceHeightEstimate&&sourceById.get(r.id).levels===r.cadastralLevels),'Four height discrepancies preserve their source evidence');
const oldOwners=['santa-maria','plaza-mayor','juderia','calvario','berenguer'];
for(const owner of oldOwners){
 const old=read(owner+'-context'),snapshot=JSON.stringify(old),claims=contextData.ownershipTransfers[owner],updated=withoutSangreClaims(old,contextData),retired=new Set(claims.retiredBuildingPartIds);
 check(snapshot===JSON.stringify(old),owner+' source context remains immutable');
 check(updated.buildings.length===old.buildings.length-retired.size,owner+' retires only assigned source parts');
 check(updated.buildings.every(row=>!retired.has(row.id)),owner+' has no duplicate transferred part');
 check(updated.roads===old.roads&&updated.pavementMesh===old.pavementMesh,owner+' retains original streets and paving');
 check(updated.focusCoordinates===old.focusCoordinates&&updated.focusLocals===old.focusLocals,owner+' retains visit focus coordinates');
 check(contextData.buildings.every(b=>!old.buildings.some(old=>String(old.id)===String(b.id))),owner+' retains unique ownership of its buildings');
}
const ground=createHeightSampler(elevation),terrain=buildTerrainGeometry(elevation,ground,[]);
const context=createSangreContext({data,heightAt:ground,contextData});
context.bindGround(terrain.meshHeightAt);
check(context.patches.length===0,'Context does not flatten source terrain');
check(JSON.stringify(contextData)===dataBefore,'Construction and height review never mutate saved source rows');
check(context.stats.heightConflictsReviewed===4&&context.qa.buildings.filter(b=>b.heightReview).every(b=>b.heightM===b.heightReview.displayHeightM&&b.method==='storeys'),'Height conflicts use the declared cadastral floor proxy');
check(Object.keys(context.focuses).join(',')==='sangre-plaza,sangre-entorno','Both public-space focus IDs are present');
check(Object.values(context.focuses).every(f=>f.closeScale===false&&f.offset.every(Number.isFinite)&&f.closeOffset.every(Number.isFinite)),'Close public-space observations retain physical positions');
check(context.stats.fallbackHeight===0,'Every new domestic height comes from IGN or cadastral storeys',context.stats);
check(context.stats.maximumRoofCorrectionM<.6,'Domestic roof correction stays below60cm',context.qa.buildings.filter(row=>row.roofCorrectionM>.001));
let finite=true,meshes=0,triangles=0,samples=0,maximumDrapeError=0,lowestPavingOffset=Infinity;
context.group.traverse(mesh=>{
 if(!mesh.isMesh)return;
 meshes++;triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;
 for(const attribute of Object.values(mesh.geometry.attributes))for(const n of attribute.array)if(!Number.isFinite(n))finite=false;
 if(mesh.userData.materialKind!=='paving')return;
 const position=mesh.geometry.attributes.position;
 for(let i=0;i<position.count;i+=3)for(const weights of[[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]]){
  let x=0,y=0,z=0;
  for(let n=0;n<3;n++){x+=position.getX(i+n)*weights[n];y+=position.getY(i+n)*weights[n];z+=position.getZ(i+n)*weights[n];}
  const offset=y-terrain.meshHeightAt(x,z);maximumDrapeError=Math.max(maximumDrapeError,Math.abs(offset-.105));lowestPavingOffset=Math.min(lowestPavingOffset,offset);samples++;
 }
});
check(finite,'All rendered attributes are finite');
check(samples>500&&maximumDrapeError<.001,'Street faces, edges and centroids track final terrain',{samples,maximumDrapeError,lowestPavingOffset});
const snapshots=context.ownedResources.materials.map(m=>({m,map:m.map,bump:m.bumpMap,color:m.color.clone(),vertexColors:m.vertexColors}));
context.setReadingMode('periods');
check(context.ownedResources.materials.every(m=>m.bumpMap===null&&m.map===null&&!m.vertexColors),'Thematic mode suppresses colour textures and bump maps');
context.selectFocus(null);context.setReadingMode('materials');
check(snapshots.every(s=>s.m.map===s.map&&s.m.bumpMap===s.bump&&s.m.color.equals(s.color)&&s.m.vertexColors===s.vertexColors),'Material mode restores maps and original colours');
const before=Object.fromEntries(Object.entries(context.ownedResources).map(([key,values])=>[key,values.length]));
const heightsBefore=Object.fromEntries(['sourceHeight','ignHeight','storeyHeight','fallbackHeight','heightConflictsReviewed'].map(key=>[key,context.stats[key]]));
context.bindGround(terrain.meshHeightAt);
check(Object.entries(before).every(([key,count])=>context.ownedResources[key].length===count),'Rebinding terrain does not accumulate resources');
check(Object.entries(heightsBefore).every(([key,count])=>context.stats[key]===count),'Repeated terrain binding preserves the normalized height evidence counts',context.stats);
const second=createSangreContext({data,heightAt:ground,contextData});
const materials=new Set(context.ownedResources.materials),textures=new Set(context.ownedResources.textures);
check(second.ownedResources.materials.every(m=>!materials.has(m))&&second.ownedResources.textures.every(t=>!textures.has(t)),'Separate instances own independent materials and textures');
second.dispose();check(context.ownedResources.geometries.length>0&&second.ownedResources.geometries.length===0,'Disposing another instance preserves the scene');
const report={pass:!failures.length,checks:checks.length,heightReview:contextData.heightReview,sourceResiduals:contextData.sourceResiduals,stats:context.stats,geometry:{meshes,triangles,finite},paving:{samples,maximumDrapeError,lowestPavingOffset},failures};
fs.writeFileSync('research/validation-v15/sangre-context-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
context.dispose();terrain.geometry?.dispose();
if(failures.length)process.exitCode=1;
