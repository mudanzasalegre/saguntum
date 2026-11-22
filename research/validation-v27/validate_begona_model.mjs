import fs from 'node:fs';
import * as THREE from 'three';
import {createBegona} from '../../dist/js/begona.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const record=JSON.parse(fs.readFileSync('dist/assets/data/port-garden.json')).sites.find(q=>q.id==='begona');
const contextPath='dist/assets/data/begona-context.json',contextData=fs.existsSync(contextPath)?JSON.parse(fs.readFileSync(contextPath)):{};
const site=createBegona({record,contextData}),v=site.visit,q=v.qa,checks=[];
const assert=(pass,label,detail)=>checks.push({pass:!!pass,label,...(!pass?{detail}:{})});
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const world=p=>new THREE.Vector3(...p).applyMatrix4(site.group.matrixWorld),ray=new THREE.Raycaster();
const cast=(a,b,{walls=false,opaque=true}={})=>{const objects=[];site.group.traverse(o=>{if(o.isMesh&&visible(o)&&(!opaque||!o.material.transparent)&&(!walls||/muros$|muros-altos$|fachada-alas$/.test(o.userData.component)))objects.push(o);});const d=b.clone().sub(a);ray.set(a,d.clone().normalize());ray.far=d.length();return ray.intersectObjects(objects,false)[0];};
assert(Object.keys(v.focuses).length===15,'Fifteen architectural focuses');
assert(site.stats.structures===3&&site.stats.naves===3,'Three naves, Casa Abadía and restrained parish annex');
assert(q.diaphragms.length===5&&q.diaphragms.every(x=>x.vault===false),'Five documented diaphragm arches without a barrel vault');
assert(v.plan.buildings[0].id==='begona-templo','Stable building identity');
assert(v.plan.floors.length===2&&v.plan.floors.every(f=>f.buildingId==='begona-templo'),'Two accessible model levels: nave and choir');
assert(v.plan.components.filter(c=>c.kind==='stairs').every(c=>c.segments?.length),'Entrance steps carry geographic tread segments');
assert(site.stats.triangles<140000,'Bounded triangle budget',site.stats.triangles);
const inside=(point,polygon)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++)if((polygon[i][1]>point[1])!==(polygon[j][1]>point[1])&&point[0]<(polygon[j][0]-polygon[i][0])*(point[1]-polygon[i][1])/(polygon[j][1]-polygon[i][1])+polygon[i][0])yes=!yes;return yes;};
const choirPlan=v.plan.components.find(c=>c.id==='templo-coro');
assert(choirPlan?.kind==='choir'&&inside(v.focuses['begona-coro'].coordinates,choirPlan.coordinates),'Choir map anchor lies on its actual raised slab');
assert(v.plan.components.filter(c=>c.kind==='column').length===q.columns.length&&v.plan.components.some(c=>c.id==='templo-barandilla-coro'&&c.floors.includes(1)),'Plan carries the modeled Tuscan pillars and choir rail');

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
  const ceiling=cast(eye,eye.clone().add(new THREE.Vector3(0,26,0)));assert(!!ceiling,'Ceiling retained in normal view '+f.id+' '+name,ceiling?.object.name);
 }
}
let finite=true,degenerate=0,owned=true;const own=site.group.userData.ownedResources;
site.group.traverse(o=>{if(!o.isMesh)return;if(!own.geometries.includes(o.geometry)||!own.materials.includes(o.material))owned=false;for(const a of Object.values(o.geometry.attributes))for(const x of a.array)if(!Number.isFinite(x))finite=false;const p=o.geometry.attributes.position,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1).sub(a);c.fromBufferAttribute(p,i+2).sub(a);if(b.cross(c).lengthSq()<1e-16)degenerate++;}});
assert(finite,'Finite geometry buffers');assert(!degenerate,'No degenerate triangles',degenerate);assert(owned,'All geometry and materials have an owner');
assert(site.roof.visible,'Normal view has roofs');v.setSection(true);assert(!site.roof.visible,'Section hides roofs');
let depends=0,retained=0;site.group.traverse(o=>{if(!o.isMesh||!visible(o))return;if(['coro-forjado','coro-barandilla','organo-tubos','diafragmas-arcos','nave-paneles-hormigon','lamparas-cadenas','lamparas-cuerpo','lamparas-brazos','lamparas-vidrio'].includes(o.userData.component))depends++;if(['arcadas-arcos','columnas-fustes','templo-pavimento','retablo-coronacion'].includes(o.userData.component))retained++;});
assert(depends===0,'Section hides choir, organ, suspended lamps and roof-dependent components together',depends);let closedAnnexParts=0;site.group.traverse(o=>{if(o.isMesh&&visible(o)&&['abadia-cubierta','abadia-cubierta-hastiales','abadia-entramado','salon-cubierta'].includes(o.userData.component))closedAnnexParts++;});assert(closedAnnexParts>=4,'Undocumented Casa Abadía and parish interiors remain covered in section',closedAnnexParts);assert(retained>=4,'Section retains arcades, nave and liturgical ground floor',retained);v.setSection(false);
v.setReadingMode('periods');assert(v.getState().readingMode==='periods','Documentary reading mode');v.setReadingMode('realistic');assert(v.getState().readingMode==='realistic','Original materials restored');
const before=Object.values(v.focuses).filter(f=>f.interiorView).map(f=>JSON.stringify([f.offset,f.closeOffset]));v.bindGround(()=>999);const after=Object.values(v.focuses).filter(f=>f.interiorView).map(f=>JSON.stringify([f.offset,f.closeOffset]));assert(before.every((x,i)=>x===after[i]),'Terrain binding preserves interior eye height');
const allResources=Object.values(own).flat(),disposals=new Map();for(const r of allResources)r.addEventListener('dispose',()=>disposals.set(r,(disposals.get(r)||0)+1));site.dispose();site.dispose();assert(allResources.every(r=>disposals.get(r)===1),'Idempotent disposal releases every owned resource once');
const report={pass:checks.every(x=>x.pass),checks:checks.length,stats:site.stats,results:checks,limitations:['Vertical dimensions and furnishings are proportional interpretations.','The organ follows the 1990 OESA photograph; its current working condition is unverified.','Casa Abadía and parish annex are exterior envelopes only.','Integrated context, terrain and final rendered cameras are checked separately.']};
fs.writeFileSync('research/validation-v27/begona-model-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:checks.length,stats:site.stats,failures:checks.filter(x=>!x.pass)},null,2));if(!report.pass)process.exitCode=1;
