import fs from 'node:fs';
import * as THREE from 'three';
import {createCasino} from '../../dist/js/casino.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const record=JSON.parse(fs.readFileSync('dist/assets/data/port-garden.json')).sites.find(q=>q.id==='casino');
const contextPath='dist/assets/data/casino-context.json',contextData=fs.existsSync(contextPath)?JSON.parse(fs.readFileSync(contextPath)):{};
const site=createCasino({record,contextData}),v=site.visit,q=v.qa,checks=[];
const assert=(pass,label,detail)=>checks.push({pass:!!pass,label,...(!pass?{detail}:{})});
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const world=p=>new THREE.Vector3(...p).applyMatrix4(site.group.matrixWorld),ray=new THREE.Raycaster();
const cast=(a,b,{walls=false,opaque=true}={})=>{const objects=[];site.group.traverse(o=>{if(o.isMesh&&visible(o)&&(!opaque||!o.material.transparent)&&(!walls||o.userData.component.endsWith('-muros')||o.userData.component.endsWith('-zocalo')))objects.push(o);});const d=b.clone().sub(a);ray.set(a,d.clone().normalize());ray.far=d.length();return ray.intersectObjects(objects,false)[0];};
assert(Object.keys(v.focuses).length===13,'Thirteen architectural focuses');
assert(site.stats.structures===1&&site.stats.storeys===2,'One building with two documented storeys');
assert(v.plan.buildings[0].id==='casino-main','Stable building identity');
assert(v.plan.floors.length===2&&v.plan.floors.every(f=>f.buildingId==='casino-main'),'Floor selector uses actual building identity');
assert(v.plan.components.filter(c=>c.kind==='stairs').every(c=>c.segments?.length),'Both stairs carry their own geographic tread segments');
assert(site.stats.triangles<150000,'Bounded triangle budget',site.stats.triangles);
for(const w of q.windows){const n=new THREE.Vector3(...w.normal),p=world(w.center);const hit=cast(p.clone().addScaledVector(n,-.6),p.clone().addScaledVector(n,.6),{walls:true});assert(!hit,'Physical window '+w.id,hit?.object.name);}
for(const d of q.doors){const n=new THREE.Vector3(...d.normal),p=world(d.center);const hit=cast(p.clone().addScaledVector(n,-.6),p.clone().addScaledVector(n,.6),{walls:true});assert(!hit,'Physical door '+d.id,hit?.object.name);}
for(const f of Object.values(v.focuses)){
 assert([f.target.x,f.target.y,f.target.z,...f.offset,...f.closeOffset].every(Number.isFinite),'Finite focus '+f.id);
 assert(f.interiorView?[0,1].includes(f.floor):f.floor===null,'Explicit floor semantics '+f.id);
 if(!f.interiorView)continue;
 for(const name of['offset','closeOffset']){
  const eye=f.target.clone().add(new THREE.Vector3(...f[name])),collisions=[];
  for(const d of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const hit=cast(eye,eye.clone().add(new THREE.Vector3(...d).multiplyScalar(.32)));if(hit)collisions.push(hit.object.name);}
  assert(!collisions.length,'Interior camera clearance '+f.id+' '+name,collisions);
  const hit=cast(eye,f.target);assert(!hit||hit.distance>eye.distanceTo(f.target)-.7,'Interior line of sight '+f.id+' '+name,hit?{name:hit.object.name,distance:hit.distance,targetDistance:eye.distanceTo(f.target)}:null);
  if(!f.openToSky){const ceiling=cast(eye,eye.clone().add(new THREE.Vector3(0,20,0)));assert(!!ceiling,'Ceiling retained in normal view '+f.id+' '+name,ceiling?.object.name);}
 }
}
const patio=v.focuses['casino-patio'];assert(!cast(patio.target,patio.target.clone().add(new THREE.Vector3(0,25,0))),'Courtyard deliberately open to the sky');
const terraceMeshes=[];site.group.traverse(o=>{if(o.isMesh&&['terraza-pavimento','terraza-basamento','casino-main-suelo'].includes(o.userData.component))terraceMeshes.push(o);});
for(const[x,z]of[[16.41,-13.94],[17.58,-13.29],[5.21,-15.71],[19.11,2.37],[19.31,-16.04],[15.91,13.73]]){
 const eye=world(q.frame.p(x,q.base+.06,z));ray.set(eye,new THREE.Vector3(0,-1,0));ray.far=.12;const hits=ray.intersectObjects(terraceMeshes,false);
 assert(hits.length===1,'Single terrace surface at local '+x+','+z,hits.map(h=>({mesh:h.object.name,distance:h.distance})));
}
const profile=q.segmentalArchProfile,half=profile.width/2,radius=(half*half+profile.rise*profile.rise)/(2*profile.rise),cy=profile.height-radius;
assert(profile.points.slice(2).every(([x,y])=>Math.abs(Math.hypot(x,y-cy)-radius)<1e-9),'Segmental window heads follow one circular arc');
const patioEye=patio.target.clone().add(new THREE.Vector3(...patio.offset));assert(Math.abs(patioEye.y-(q.origin.y+q.base+1.9))<1e-8&&patio.target.y>patioEye.y,'Patio camera reads both levels from human eye height');
let finite=true,degenerate=0,owned=true;const own=site.group.userData.ownedResources;
site.group.traverse(o=>{if(!o.isMesh)return;if(!own.geometries.includes(o.geometry)||!own.materials.includes(o.material))owned=false;for(const a of Object.values(o.geometry.attributes))for(const x of a.array)if(!Number.isFinite(x))finite=false;const p=o.geometry.attributes.position,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1).sub(a);c.fromBufferAttribute(p,i+2).sub(a);if(b.cross(c).lengthSq()<1e-16)degenerate++;}});
assert(finite,'Finite geometry buffers');assert(!degenerate,'No degenerate triangles',degenerate);assert(owned,'All geometry and materials have an owner');
assert(site.roof.visible,'Normal view has its roofs');v.setSection(true);assert(!site.roof.visible,'Section hides roofs');
let depends=0,retained=0;site.group.traverse(o=>{if(!o.isMesh||!visible(o))return;if(['casino-main-forjado','escalera-peldanos','salas-altas-mesa','galeria-muros'].includes(o.userData.component))depends++;if(['patio-muros','escalinata-concentrica','casino-main-suelo'].includes(o.userData.component))retained++;});
assert(depends===0,'Section hides upper slabs, arcades, stairs and furniture together',depends);assert(retained>=3,'Section retains lower courtyard, floor and outdoor steps');v.setSection(false);
v.setReadingMode('periods');assert(v.getState().readingMode==='periods','Interpretive reading mode');v.setReadingMode('realistic');assert(v.getState().readingMode==='realistic','Original materials restored');
const before=Object.values(v.focuses).filter(f=>f.interiorView).map(f=>JSON.stringify([f.offset,f.closeOffset]));v.bindGround(()=>999);const after=Object.values(v.focuses).filter(f=>f.interiorView).map(f=>JSON.stringify([f.offset,f.closeOffset]));assert(before.every((x,i)=>x===after[i]),'Ground binding preserves interior cameras');
const allResources=Object.values(own).flat(),disposals=new Map();for(const r of allResources)r.addEventListener('dispose',()=>disposals.set(r,(disposals.get(r)||0)+1));site.dispose();site.dispose();assert(allResources.every(r=>disposals.get(r)===1),'Idempotent disposal releases every owned resource once');
const report={pass:checks.every(x=>x.pass),checks:checks.length,stats:site.stats,results:checks,limitations:['Dimensions of partitions, stair and furniture are proportional interpretations.','Open courtyard is a deliberate reading mode, not a claim of completed rehabilitation.','Current public access and a completed glass roof are not asserted.','Integrated context, terrain and final rendered camera checks are separate.']};
fs.writeFileSync('research/validation-v26/casino-model-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:checks.length,stats:site.stats,failures:checks.filter(x=>!x.pass)},null,2));
if(!report.pass)process.exitCode=1;
