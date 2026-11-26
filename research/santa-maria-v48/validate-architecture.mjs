// Exact shipped geometry, no production writes.
// node --experimental-loader ./research/validate_loader.mjs research/santa-maria-v48/validate-architecture.mjs
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {createSantaMaria} from '../../dist/js/santa-maria.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const context=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visitData=read('santa-maria-visit'),record=read('landmarks').sites.find(s=>s.id==='santa-maria'),project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const model=createSantaMaria({record,project,heightAt:createHeightSampler(read('elevation')),visitData}),group=model.group,visit=group.userData.visit,f=model.frame;
group.updateMatrixWorld(true);
const checks=[],errors=[],assert=(pass,label,detail)=>{checks.push({pass:!!pass,label,...(detail?{detail}:{})});if(!pass)errors.push(label);},ray=new THREE.Raycaster();
const point=(x,y,z)=>f.localWorld(x,y,z),visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const rayLocal=(a,b,max=100)=>{const p=point(...a),d=point(...b).sub(p).normalize();ray.set(p,d);ray.far=max;return ray.intersectObject(group,true).filter(h=>h.object.isMesh&&visible(h.object));};
const sourceIds=new Set(visitData.sources.map(s=>s.id));
assert(visitData.stops.length===16&&Object.keys(visit.focuses).length===16&&visitData.stops.every(s=>visit.focuses[s.id]),'All sixteen existing stop IDs resolve');
assert(visit.stats.sourceKeys.every(id=>sourceIds.has(id))&&visitData.stops.every(s=>s.sourceIds.every(id=>sourceIds.has(id))),'Model and narrative source IDs resolve');
assert(model.patch.mode==='lower-only'&&model.thresholdPatches.length===0,'Church foundation does not raise streets; west stairs owned only by context');
assert(f.westThreshold.x===-1.1&&f.westThreshold.z===-28.1&&Math.abs(f.westThreshold.y-f.base-.12)<1e-9,'Western door datum is unchanged');
let finite=true;group.traverse(o=>{if(o.isMesh)for(const a of Object.values(o.geometry.attributes))for(const n of a.array)if(!Number.isFinite(n))finite=false;});assert(finite,'Every geometry attribute is finite');
const openingResults=[];
for(const o of visit.qa.openings){
 const direction=new THREE.Vector3(...o.direction),side=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),bad=[];
 for(const u of[-.2,0,.2])for(const dy of[-.2,.2]){const p=new THREE.Vector3(...o.origin).addScaledVector(side,u);p.y+=dy;ray.set(p,direction);ray.far=o.distance;const hit=ray.intersectObject(group,true).find(h=>h.object.isMesh&&visible(h.object)&&!['glass','wood','metal','bronze','brass'].includes(h.object.userData.materialKind)&&!(o.kind==='window'&&h.object.userData.materialKind==='trim'));if(hit)bad.push({u,dy,name:hit.object.name,position:hit.point.toArray()});}
 openingResults.push({id:o.id,bad});assert(!bad.length,'Pierced masonry opening '+o.id,bad.length?bad:undefined);
}
const nicheSamples=[-1.1,-2.1,-.1].map(x=>{const h=rayLocal([x,10,-29.2],[x,10,-27.0],3)[0];return{x,mesh:h?.object.name,localHit:h?f.toLocal(h.point.x,h.point.z):null};});
assert(nicheSamples.every(s=>s.localHit)&&nicheSamples[0].localHit.z>nicheSamples[1].localHit.z+.20&&nicheSamples[0].localHit.z>nicheSamples[2].localHit.z+.20,'Niche is physically concave, deeper in the centre than at its jambs',nicheSamples);
for(const[id,xs]of[['portada-sur',[-22.1,-21.99]],['portada-norte',[19.95,20.05]]]){
 const blocked=[];for(const x of xs)for(const z of[-.7,.35,1.4]){const hit=rayLocal([x,.35,z],[x,-.2,z],.7).find(h=>h.object.userData.component===id&&['stone','trim'].includes(h.object.userData.materialKind));if(hit)blocked.push({x,z,mesh:hit.object.name,normal:hit.face.normal.toArray()});}
 assert(!blocked.length,id+' has no extruded bottom face across its threshold',blocked.length?blocked:undefined);
}
for(const[id,points]of[
 ['muro-occidental',[[-2,-28.05],[-1.1,-27.8],[0,-27.5]]],
 ['muro-norte',[[19.42,-.7],[19.6,.35],[19.8,1.4]]],
 ['muro-sur',[[-21.55,-.7],[-21.75,.35],[-21.9,1.4]]]
]){const duplicate=points.flatMap(([x,z])=>rayLocal([x,.35,z],[x,-.2,z],.7).filter(h=>h.object.userData.component===id&&Math.abs(h.point.y-f.base-.12)<1e-5));assert(!duplicate.length,id+' delegates its threshold plane to the actual floor, without a coincident cap');}
const roofResults=[];
for(const z of[-22,-10,5,10,15,16.5]){const hits=rayLocal([-3,45,z],[-3,0,z]).filter(h=>h.object.userData.component==='cubiertas'),levels=[];for(const h of hits)if(!levels.some(y=>Math.abs(y-h.point.y)<1e-4))levels.push(h.point.y);roofResults.push({z,levels});assert(levels.length===1,'Single external central/apse roof surface at z='+z,levels);}
for(const[x,y]of[[-10,21.3],[8,20.5],[-18,15.1],[16,15.0]]){const hit=rayLocal([x,y,-29],[x,y,-26],3.5)[0];assert(hit?.object.userData.component==='cierres-cubierta','West roof end is closed behind stepped screen at x='+x,{component:hit?.object.userData.component});}
const ceilingResults=[];
for(const z of[-24.7,-15.65,-3.45,8.8,9.8,12,16]){const hits=rayLocal([-1.1,2,z],[-1.1,35,z]),web=hits.find(h=>['bovedas','boveda-abside'].includes(h.object.userData.component));ceilingResults.push({z,web:web?.object.userData.component,height:web?web.point.y-f.base:null});assert(web&&web.point.y-f.base<=24.02,'Continuous visible vault envelope at z='+z,ceilingResults.at(-1));}
const lateralResults=[];
for(const[side,xs]of[['south',[-15.7,-12.2,-8.9]],['north',[6.5,10.1,13.6]]]){
 const samples=[];for(const x of xs)for(const z of[-22,-15.65,-9.55,-3.45,2.6,8.8,11]){const hits=rayLocal([x,2,z],[x,35,z]),web=hits.find(h=>h.object.userData.component==='bovedas-laterales'),roof=hits.find(h=>h.object.userData.component==='cubiertas');samples.push({x,z,webY:web?.point.y,roofY:roof?.point.y,clearance:web&&roof?roof.point.y-web.point.y:null});}
 lateralResults.push({side,samples});assert(samples.every(s=>s.clearance!==null&&s.clearance>.35),'All sampled '+side+' aisle vaults remain below the external roof',samples);
}
for(const[side,xs]of[['south',[-14,-12.2,-10.3]],['north',[8,10.1,12]]]){const hiddenCaps=xs.flatMap(x=>rayLocal([x,16.55,-3.45],[x,16.35,-3.45],.3).filter(h=>h.object.userData.component==='puentes-agua'&&Math.abs(h.point.y-f.base-16.45)<1e-4));assert(!hiddenCaps.length,'Drainage arches have no false horizontal bottom inside the '+side+' aisle');}
const cameraResults=[];
for(const id of['santa-maria-naves','santa-maria-bovedas','santa-maria-capillas']){
 const focus=visit.focuses[id],dataStop=visitData.stops.find(s=>s.id===id);assert(dataStop?.requiresSection===false&&dataStop.interiorView===true&&dataStop.fitBounds===false,'Narrative and runtime agree for '+id);assert(focus.interiorView&&focus.fitBounds===false&&focus.closeScale===false&&!focus.requiresSection,id+' uses a stable covered interior view');
 const before=JSON.stringify([focus.offset,focus.closeOffset]);visit.bindGround(()=>f.base+200);assert(JSON.stringify([focus.offset,focus.closeOffset])===before,id+' eye is not displaced by terrain binding');
 for(const field of['offset','closeOffset']){const eye=focus.target.clone().add(new THREE.Vector3(...focus[field])),dir=focus.target.clone().sub(eye),distance=dir.length();ray.set(eye,dir.normalize());ray.far=distance-.15;const obstruction=ray.intersectObject(group,true).find(h=>h.object.isMesh&&visible(h.object));const result={id,field,eye:eye.toArray(),target:focus.target.toArray(),obstruction:obstruction?.object.name||null};cameraResults.push(result);assert(!obstruction,id+'/'+field+' sees its target through open interior space',result);const local=f.toLocal(eye.x,eye.z);assert(eye.y-f.base>=1.8&&eye.y-f.base<=2.2,id+'/'+field+' remains at a human-scale eye height');}
}
visit.setSection(true);const roofComponents=['cubiertas','remates-cubierta','cierres-cubierta','bovedas','bovedas-laterales','bovedas-capillas','boveda-abside','revestimiento-bovedas'];assert(group.children.filter(o=>o.isMesh&&roofComponents.includes(o.userData.component)).every(o=>!o.visible),'Optional section removes both vault shells and their finish');assert(group.children.filter(o=>o.isMesh&&['pilares','arcadas','nervios'].includes(o.userData.component)).every(o=>o.visible),'Optional section retains supports and structural ribs');visit.setSection(false);assert(group.children.filter(o=>o.isMesh).every(o=>o.visible),'Closing section restores all church fabric');
const files=['dist/js/santa-maria.js','dist/assets/data/santa-maria-visit.json'],report={pass:!errors.length,checks,errors,stats:visit.stats,sourceHashes:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),openings:openingResults,roofResults,ceilingResults,lateralResults,cameras:cameraResults,limitations:['Photographic proportions remain approximate; no new metric survey.','Interior photography is dated 2011, not evidence of an exact 2026 inventory.','Furnishing and decorative relief are schematic.']};
fs.mkdirSync('research/santa-maria-v48',{recursive:true});fs.writeFileSync('research/santa-maria-v48/architecture-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:checks.length,errors,stats:visit.stats},null,2));if(errors.length)process.exitCode=1;
