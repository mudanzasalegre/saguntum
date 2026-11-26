// Source identity and real aperture regression for the previously opaque south front.
// node research/validation-plaza-sur/validate_southern_porticoes.mjs
import fs from 'node:fs';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
const THREE=await import('three');
const {createPlazaMayor}=await import('../../dist/js/plaza-mayor.js');
const {createHeightSampler}=await import('../../dist/js/terrain.js');
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json','utf8'));
const contextData=read('plaza-mayor-context'),churchContext=read('santa-maria-context'),visitData=read('plaza-mayor-visit');
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const model=createPlazaMayor({project,heightAt:createHeightSampler(read('elevation')),contextData,visitData}),visit=model.group.userData.visit;
model.group.updateMatrixWorld(true);
const checks=[],assert=(pass,label,detail)=>checks.push({pass:!!pass,label,...(detail?{detail}:{})});
assert(visit.qa.facades.length===15,'13 established frontages plus 7–8 and 9');
assert(visitData.stops.length===16,'all 16 existing visit records retained');
const ids=contextData.replacedSantaMariaBuildingIds;
assert(ids.length===8&&new Set(ids).size===8,'eight explicit source-body replacements');
for(const shared of contextData.sharedFrontages){
 const row=contextData.coreBuildings.find(r=>r.id===shared.id),bodies=[row,...row.secondaryFootprints];
 assert(bodies.length===4,shared.id+' retains all four original body polygons');
 for(const id of shared.replacedBuildingIds){
  const source=churchContext.buildings.find(b=>b.id===id),body=id===shared.frontPartId?row:bodies.find(b=>b.id===id);
  assert(!!source&&!!body&&JSON.stringify(source.coordinates)===JSON.stringify(body.coordinates),id+' source coordinates unchanged');
  assert(contextData.coreExcludedBuildingIds.includes(id),id+' is excluded from generic replacement geometry');
 }
 const facade=visit.qa.facades.find(f=>f.id===shared.id),mid=facade.front.midpoint,n=facade.front.normal,centre=project(...contextData.coordinate);
 assert(facade.front.sourceEdgeIndex===2&&n[0]*(centre.x-mid[0])+n[1]*(centre.z-mid[1])>0,shared.id+' gallery faces the square on the recorded edge');
 assert(facade.upperStoreys===2&&facade.support==='moulded-pier',shared.id+' has documented two upper floors and square piers');
 assert(facade.front.galleryDepth>=3.25,shared.id+' has usable recessed gallery depth');
 assert(shared.sourceIds.every(id=>visitData.sources.some(s=>s.id===id)),shared.id+' references visible source entries');
}
const southern=visit.qa.documented.southernFrontages;
assert(southern.levelDifferenceM===0,'the short-side galleries meet at one level datum');
const ray=new THREE.Raycaster(),blocked=[];
for(const opening of visit.qa.openings.filter(o=>/soportal-(7-8|9)-|soportales-cierre-sur/.test(o.id))){
 const direction=new THREE.Vector3(...opening.direction),side=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
 for(const lateral of[-.30,0,.30])for(const dy of[-.40,0,.40]){
  const origin=new THREE.Vector3(...opening.origin).addScaledVector(side,lateral);origin.y+=dy;ray.set(origin,direction);ray.far=opening.distance;
  const hit=ray.intersectObject(model.group,true).find(h=>h.object.isMesh&&!['glass','wood','darkWood','metal','plate'].includes(h.object.userData.materialKind));
  if(hit)blocked.push({id:opening.id,lateral,dy,component:hit.object.userData.component,point:hit.point.toArray()});
 }
}
assert(!blocked.length,'all 45 frontal and cross-gallery rays pass through actual open geometry',blocked);
const floorSupport=visit.qa.openings.filter(o=>/^soportal-(7-8|9)-/.test(o.id)).map(opening=>{
 const number=opening.id.startsWith('soportal-7-8-')?'7-8':9,facade=visit.qa.facades.find(f=>f.address===number),origin=new THREE.Vector3(...opening.origin);origin.y=facade.front.baseM-.12;
 ray.set(origin,new THREE.Vector3(...opening.direction));ray.far=1.2;
 const supported=ray.intersectObject(model.group,true).some(h=>h.object.userData.component==='soportal-'+number&&h.object.userData.materialKind==='paving');
 return {opening:opening.id,foundationHeightM:origin.y,supported};
});
assert(floorSupport.every(r=>r.supported),'all four south portico floors reach their foundation plane without a floating underside',floorSupport);
let finite=true;model.group.traverse(m=>{if(m.isMesh)for(const a of Object.values(m.geometry.attributes))for(const n of a.array)if(!Number.isFinite(n))finite=false;});
assert(finite,'all emitted geometry is finite');
assert(visit.stats.sourceKeys.every(id=>visitData.sources.some(s=>s.id===id)),'all geometry bibliography IDs resolve');
const result={pass:checks.every(c=>c.pass),date:'2026-11-26',checks,facades:visit.qa.facades.filter(f=>[9,'7-8'].includes(f.address)),sources:visitData.sources.filter(s=>s.id.startsWith('pm-front-sur')||s.id==='pm-photo-2019'),limitations:['Photographs document January 2019 and an undated institutional exterior; they do not constitute a November 2026 inspection.','Front dimensions, support sections and rear roof heights are interpretive. Source-body footprints are preserved.','This test verifies geometry. Final combined terrain, Atlas and Simulation assembly are verified separately.']};
fs.writeFileSync('research/validation-plaza-sur/southern-porticoes-qa.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:result.pass,checks:checks.length,failed:checks.filter(c=>!c.pass)},null,2));
if(!result.pass)process.exitCode=1;
