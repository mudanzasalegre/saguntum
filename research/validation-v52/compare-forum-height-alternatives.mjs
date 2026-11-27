// Reproduce the boundary-height diagnosis without editing application geometry.
// All three candidates share the shipped DEM, road selection and archaeology
// patches. They differ only in the analytical height used before mesh creation.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildForumScene,project,root} from './forum-scene.mjs';
import {createForumPlazaGround} from '../../dist/js/forum-plaza-ground.js';
const {buildTerrainGeometry}=await import('../../dist/js/terrain.js');
const {createUrbanSurface}=await import('../../dist/js/urban-surface.js');

const b=await buildForumScene({withCity:false});
const g=createForumPlazaGround({project,heightAt:b.rawHeight});
const roads=[...new Set(b.urban.segments.map(segment=>segment.road))];
const patches=b.archaeology.patches||[];
const modes={
 displayLevels:(x,z)=>g.surfaceHeight(x,z,b.rawHeight(x,z)),
 rawOnly:(x,z)=>b.rawHeight(x,z),
 streetLid:(x,z)=>g.contains(x,z)?g.streetY:b.rawHeight(x,z)
};
const built={};
for(const [id,heightAt]of Object.entries(modes)){
 const urban=createUrbanSurface({data:{...b.geo,roads},project,heightAt,patches});
 built[id]={urban,terrain:buildTerrainGeometry(b.elevation,urban.groundHeight,patches)};
}
const definitions=[['Nwest',0,-.3],['N10',10,-.3],['Nmiddle',22,-.3],['NE',44.2,-.3],
 ['Wnearstairs',-1.8,7.8],['Wstreet',-3,7],['WstairTop',-.7,7.8],['WstairMiddle',.8,10.5],['WstairBottom',2.3,13.1],
 ['Wgalleryoutside',-3.5,17.5],['Eoutside10',44.5,10],['Eoutside20',44,20],['Eoutside30',43.5,30],['South',30,44.5]];
const points=definitions.map(([name,u,v])=>{
 const p=g.world(u,v);
 return {name,local:[u,v],inside:g.contains(p.x,p.z),rawDEM:b.rawHeight(p.x,p.z),publicWalkingHeight:g.sampleWalkingHeight(p.x,p.z),
  ...Object.fromEntries(Object.entries(built).map(([id,result])=>[id,result.terrain.meshHeightAt(p.x,p.z)])),
  shippedFinalTerrain:b.heightAt(p.x,p.z)};
});
const edge=[];
for(const [a,z]of [[[0,0],[44.437,0]],[[0,0],[-2.904,18.822]],[[44.437,0],[42.054,43.906]]]){
 const dx=z[0]-a[0],dz=z[1]-a[1],n=Math.ceil(Math.hypot(dx,dz));
 for(let i=0;i<=n;i++){
  const u=a[0]+dx*i/n,v=a[1]+dz*i/n,p=g.world(u,v);
  edge.push({local:[u,v],...Object.fromEntries(Object.entries(built).map(([id,result])=>[id,result.terrain.meshHeightAt(p.x,p.z)-g.streetY]))});
 }
}
const edgeDifferenceFromStreet=Object.fromEntries(Object.keys(built).map(id=>{
 const vals=edge.map(q=>q[id]);return [id,{minM:Math.min(...vals),maxM:Math.max(...vals),rmsM:Math.sqrt(vals.reduce((s,v)=>s+v*v,0)/vals.length)}];
}));
const sourceFiles=['dist/js/forum-plaza-ground.js','dist/js/forum-plaza-surfaces.js','dist/js/terrain.js','dist/js/urban-surface.js','dist/assets/data/elevation.json','dist/assets/data/forum-plaza-context.json','dist/assets/data/circo-context.json'];
const report={
 researchDate:'2026-11-27',streetY:g.streetY,archaeologicalBaseY:g.baseY,
 recommendation:'Use streetLid only for preparing terrain/urban interpolation. Permanently subtract the exact park before rendering. Keep display surface levels and public walking decks for geometry, vegetation, camera clearance and walking.',
 method:{
  scene:'buildForumScene({withCity:false}) supplies the shipped raw DEM, actual selected street records, source frame and archaeological patches.',
  alternatives:{displayLevels:'Before-fix behaviour: public park display levels feed the terrain sampler.',rawOnly:'Original DEM at every point.',streetLid:'streetY inside the exact concave park; raw DEM outside. This temporary filling is removed by the exact permanent excavation.'},
  mesh:'Existing buildTerrainGeometry defaults: 10m north of world z=-180; 2.5m south within the central region. Heights sampled before permanent clipping remain available numerically, even where no terrain triangle will remain.',
  boundary:'North, west and east polygon edges sampled at intervals no longer than1m; signed residual relative to constant display street datum. This is a rendering diagnosis, not a survey accuracy statistic.',
  scope:'Local comparison rebuilds urban grading with the actual road selection and archaeology patches. Distant sacred/civic foundation caps do not meet the sampled park edge; the final shipped scene is also reported point by point.',
  sourcesUnchanged:true,applicationFilesChangedByThisScript:false
 },
 findings:[
  'The source DEM already contains the archaeological depression. Reverting to rawOnly partly fixes the west edge but worsens the north-middle join.',
  'The streetLid avoids interpolation from the archaeological floor into neighbouring street cells while preserving the original DEM data.',
  'After clipping, meshHeightAt still mathematically returns the removed lid inside the park. Camera and pedestrian queries must prioritize actual display/walking surfaces there.',
  'The earlier model drew stair treads/risers without full lateral closure; those black openings are a separate geometry problem, subsequently addressed by the model owner.',
  'Ray checks before the correction found only the park model and its earth base at north/east interior and west stair samples: no previous context paving covering the interior.'
 ],
 sourceHashes:Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')])),
 points,edgeDifferenceFromStreet,edgeSamples:edge
};
const destination=root+'research/validation-v52/forum-height-alternatives.json';
fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({destination,streetY:g.streetY,edgeDifferenceFromStreet,west:points.filter(p=>['Wnearstairs','WstairTop','WstairBottom'].includes(p.name)),north:points.find(p=>p.name==='Nmiddle')},null,2));
