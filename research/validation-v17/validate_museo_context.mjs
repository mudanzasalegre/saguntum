import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {createMuseoContext} from '../../dist/js/museo-context.js';
import {createHeightSampler,buildTerrainGeometry} from '../../dist/js/terrain.js';

const require=createRequire(import.meta.url),{createCanvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json','utf8'));
const data=read('cartography'),contextData=read('museo-context'),elevation=read('elevation');
const checks=[],failures=[],check=(pass,label,detail)=>{checks.push({label,pass:!!pass});if(!pass)failures.push({label,detail});};
const rows=new Map(data.buildings.map(b=>[String(b.id),b])),sourceIssues=[];
for(const row of[...contextData.coreBuildings,...contextData.buildings]){
 const {contextComponent,...source}=row;if(JSON.stringify(source)!==JSON.stringify(rows.get(String(row.id))))sourceIssues.push(row.id);
}
check(sourceIssues.length===0,'All core and context source polygons, levels, surface heights and provenance remain identical',sourceIssues);
check(contextData.coreBuildings.length===2&&contextData.coreBuildings.every(b=>b.parentId==='3558701YJ3935H'),'Museum core contains only the two parts of3558701');
check(contextData.buildings.filter(b=>b.parentId==='3558702YJ3935H').length===2,'Adjacent3558702 remains a neighbouring context building');
check(Object.keys(contextData.ownershipTransfers).length===0,'No previous building or street ownership transfers');
check(!contextData.excludedBuildingIds.includes('1303697035')&&contextData.sharedContext.protectedArc.owner==='juderia','Existing Judería arch is shared, not duplicated or excluded by this context');
const protectedIds=new Set(),oldOwners=contextData.selectionStats.retainedOwners;
for(const owner of oldOwners){
 const filename='dist/assets/data/'+owner+'-context.json',hash=crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex'),old=read(owner+'-context');
 check(hash===contextData.inputHashes[owner+'-context'],owner+' source context file is unchanged');
 for(const id of old.excludedBuildingIds||[])protectedIds.add(String(id));
 check(contextData.buildings.every(row=>!(old.excludedBuildingIds||[]).map(String).includes(String(row.id))),owner+' retains unique building ownership');
 check(contextData.excludedRoadIds.every(id=>!(old.excludedRoadIds||[]).map(String).includes(id)),owner+' streets remain owned by their previous visit');
}
check(contextData.roads.every(r=>!r.replacesWholeSource)&&contextData.excludedRoadIds.length===0,'All new street records are clipped fragments with source continuations preserved');
check(contextData.sharedContext.buildings.length>150&&contextData.sharedContext.roads.length>=10,'Existing visual context reuse is explicitly documented');
check(contextData.publicSpaceAreas.every(row=>row.derived)&&contextData.coreOwnership.plazaOutlineDerived,'Public void is explicitly inferred, not claimed as a surveyed plaza polygon');
check(contextData.pavementMesh.coverage.pass&&contextData.pavementMesh.coverage.previousPavingOverlapM2<.001,'New pavement has no overlap with retained streets or cadastral/private surfaces');
const snapshot=JSON.stringify(contextData),ground=createHeightSampler(elevation),terrain=buildTerrainGeometry(elevation,ground,[]);
const context=createMuseoContext({data,heightAt:ground,contextData});context.bindGround(terrain.meshHeightAt);
check(JSON.stringify(contextData)===snapshot,'Context construction and terrain binding do not mutate source data');
check(context.patches.length===0,'Neighbourhood context never flattens the relief');
check(Object.keys(context.focuses).join(',')==='museo-plaza,museo-arco,museo-juderia,museo-entorno','All four public-space focus contracts are present');
check(Object.values(context.focuses).every(f=>f.closeScale===false&&f.fitBounds===false&&f.offset.every(Number.isFinite)&&f.closeOffset.every(Number.isFinite)),'Focus cameras retain physical world positions and finite targets');
check(context.stats.fallbackHeight===0,'Every context height has IGN or cadastral floor evidence',context.stats);
check(context.stats.maximumRoofCorrectionM<.6,'Terrain binding does not spuriously raise domestic roofs above source heights',context.qa.buildings.filter(b=>b.roofCorrectionM>.001));
check(context.stats.interpretivePlanters===4&&context.qa.publicSpaceDetails.stairs.length===0&&context.vegetation.parent===context.group&&context.vegetation.children.every(m=>['wood','foliage'].includes(m.userData.materialKind)),'Only source-observed planter typology is added, with independently switchable vegetation; no invented stairway');
let finite=true,meshes=0,triangles=0,samples=0,maximumDrapeError=0,lowestPavingOffset=Infinity;
context.group.traverse(mesh=>{
 if(!mesh.isMesh)return;meshes++;triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;
 for(const attribute of Object.values(mesh.geometry.attributes))for(const number of attribute.array)if(!Number.isFinite(number))finite=false;
 if(mesh.userData.materialKind!=='paving')return;const pos=mesh.geometry.attributes.position;
 for(let i=0;i<pos.count;i+=3)for(const weights of[[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]]){
  let x=0,y=0,z=0;for(let k=0;k<3;k++){x+=pos.getX(i+k)*weights[k];y+=pos.getY(i+k)*weights[k];z+=pos.getZ(i+k)*weights[k];}
  const offset=y-terrain.meshHeightAt(x,z);maximumDrapeError=Math.max(maximumDrapeError,Math.abs(offset-.105));lowestPavingOffset=Math.min(lowestPavingOffset,offset);samples++;
 }
});
check(finite,'All geometry attributes are finite');
check(samples>1000&&maximumDrapeError<.001,'Every pavement edge and centroid follows the exact final terrain mesh',{samples,maximumDrapeError,lowestPavingOffset});
const materialSnapshot=context.ownedResources.materials.map(m=>({m,map:m.map,bump:m.bumpMap,color:m.color.clone(),vertexColors:m.vertexColors}));
context.setReadingMode('periods');
check(context.ownedResources.materials.every(m=>m.map===null&&m.bumpMap===null&&!m.vertexColors),'Reading mode suppresses textures and bump maps');
context.selectFocus(null);context.setMode('materials');
check(materialSnapshot.every(s=>s.m.map===s.map&&s.m.bumpMap===s.bump&&s.m.color.equals(s.color)&&s.m.vertexColors===s.vertexColors),'Material mode exactly restores all owned materials');
const resourceCounts=Object.fromEntries(Object.entries(context.ownedResources).map(([k,v])=>[k,v.length]));
context.bindGround(terrain.meshHeightAt);
check(Object.entries(resourceCounts).every(([k,n])=>context.ownedResources[k].length===n),'Rebinding terrain releases old detail and building resources');
const second=createMuseoContext({data,heightAt:ground,contextData}),firstMaterials=new Set(context.ownedResources.materials),firstTextures=new Set(context.ownedResources.textures);
check(second.ownedResources.materials.every(v=>!firstMaterials.has(v))&&second.ownedResources.textures.every(v=>!firstTextures.has(v)),'Instances own independent materials and textures');
second.dispose();check(second.ownedResources.geometries.length===0&&context.ownedResources.geometries.length>0,'Disposing one instance preserves the other');
context.dispose();check(context.ownedResources.geometries.length===0&&context.ownedResources.materials.length===0&&context.ownedResources.textures.length===0,'Dispose releases every owned resource');
const report={pass:!failures.length,checks:checks.length,results:checks,stats:context.stats,geometry:{meshes,triangles,finite},
 pavement:{samples,maximumDrapeError,lowestPavingOffset},publicSpaceDetails:context.qa.publicSpaceDetails,failures};
fs.writeFileSync('research/validation-v17/museo-context-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks,stats:report.stats,geometry:report.geometry,pavement:report.pavement,failures},null,2));
terrain.geometry.dispose();if(failures.length)process.exitCode=1;
