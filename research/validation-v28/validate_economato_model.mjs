import fs from 'node:fs';
import * as THREE from 'three';
import {createEconomato,economatoPeriods} from '../../dist/js/economato.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const record=JSON.parse(fs.readFileSync('dist/assets/data/port-workers.json')).sites.find(q=>q.id==='economato');
const site=createEconomato({record}),v=site.visit,q=v.qa,checks=[];
const assert=(pass,label,detail)=>checks.push({pass:!!pass,label,...(!pass?{detail}:{})});
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const world=p=>new THREE.Vector3(...p).applyMatrix4(site.group.matrixWorld),ray=new THREE.Raycaster();
const cast=(a,b,{component=null,opaque=true}={})=>{const objects=[];site.group.traverse(o=>{if(o.isMesh&&visible(o)&&(!opaque||!o.material.transparent)&&(!component||o.userData.component===component))objects.push(o);});const d=b.clone().sub(a);ray.set(a,d.clone().normalize());ray.far=d.length();return ray.intersectObjects(objects,false)[0];};
const inside=(point,polygon)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++)if((polygon[i][1]>point[1])!==(polygon[j][1]>point[1])&&point[0]<(polygon[j][0]-polygon[i][0])*(point[1]-polygon[i][1])/(polygon[j][1]-polygon[i][1])+polygon[i][0])yes=!yes;return yes;};
assert(Object.keys(v.focuses).length===15,'Fifteen architectural focuses');
assert(site.stats.parts===5&&site.stats.structures===5,'Five cadastral parts, with lower annex envelopes');
assert(site.stats.naves===3&&site.stats.porticoes===2&&site.stats.octagonalPillars===4,'Three projecting gables and two porches with four octagonal pillars');
assert(v.plan.buildings[0].id==='economato-edificio','Stable main building identity');
assert(v.plan.floors.length===2&&v.plan.floors.map(f=>f.id).join(',')==='0,1','Two documented accessible storeys');
assert(q.basement.documented&&!q.basement.interiorModeled&&q.basement.exteriorVents===6,'Semibasement evidence without an invented underground route',q.basement);
assert(q.exactInteriorSurvey===false&&v.metadata.interiorSurvey===false,'Interpretation is explicitly identified');
assert(q.sourceDates.interiorPhotographs==='2026-01-20'&&v.metadata.currentState.includes('not represented as completed'),'The 2027 proposal is not shown as completed');
assert(site.stats.triangles<140000&&site.stats.meshes<180,'Bounded triangle and mesh budgets',site.stats);
assert(economatoPeriods.map(x=>x.id).join(',')==='edificio,espacios,construccion,memoria,entorno','Five documentary reading layers match the visit guide');
assert(v.plan.components.filter(c=>c.kind==='stairs').every(c=>c.segments?.length),'All stairs carry geographic tread segments');
assert(q.stairs.find(s=>s.id==='economato-escalera-interior').rise<.19,'Interpreted staircase has safe riser dimensions');
assert(q.stairs.find(s=>s.id==='economato-escalera-interior').run>=.28,'Interpreted staircase has actual supported treads');
assert(q.furniture.every(f=>f.base===q.base&&f.documentedInventory===false),'Commercial furnishings stand on the floor and are labeled typological');
assert(q.columns.filter(c=>c.kind==='round-interior-column').length===16,'Two continuous levels of round supports');
assert(q.supports.every(s=>s.top[1]>s.base[1]&&s.base[1]===(s.floor?q.upperFloor:q.base)),'All interior supports rise from an actual modeled floor');
const ceilingProbe=world(q.frame.p(-1.4,q.base+1.65,3)),ceilingFinish=cast(ceilingProbe,ceilingProbe.clone().add(new THREE.Vector3(0,4,0))),floorProbe=world(q.frame.p(-1.4,q.upperFloor+.25,3)),floorFinish=cast(floorProbe,floorProbe.clone().add(new THREE.Vector3(0,-.5,0)));
assert(ceilingFinish?.object.userData.component==='economato-intrados-forjado'&&ceilingFinish.object.userData.materialKind==='plaster','Ground-floor ceiling has its documented plain plaster soffit',ceilingFinish?.object.userData);
assert(floorFinish?.object.userData.component==='economato-forjado-primera'&&floorFinish.object.userData.materialKind==='hydraulic','First-floor hydraulic paving remains on the upper face only',floorFinish?.object.userData);
const staircase=q.stairs.find(s=>s.id==='economato-escalera-interior'),lonScale=111320*Math.cos(39.679*Math.PI/180),projectLocal=([lon,lat])=>({x:(lon+.278)*lonScale-q.origin.x,z:(39.679-lat)*111320-q.origin.z});
for(const [i,segment]of staircase.segments.entries()){
 const a=projectLocal(segment[0]),b=projectLocal(segment[1]),x=(a.x+b.x)/2+q.frame.vx*staircase.run/2,z=(a.z+b.z)/2+q.frame.vz*staircase.run/2,feet=world([x,q.base+(i+1)*staircase.rise+.04,z]),head=feet.clone().add(new THREE.Vector3(0,2,0)),hit=cast(feet,head);
 assert(!hit,'Stair climbing headroom at tread '+(i+1),hit?{name:hit.object.name,height:hit.distance}:null);
}
const lastStep=staircase.segments.at(-1),la=projectLocal(lastStep[0]),lb=projectLocal(lastStep[1]),landingPoint=world([(la.x+lb.x)/2+q.frame.vx*(staircase.run+.05),q.upperFloor+.25,(la.z+lb.z)/2+q.frame.vz*(staircase.run+.05)]),landingHit=cast(landingPoint,landingPoint.clone().add(new THREE.Vector3(0,-.5,0)),{component:'economato-forjado-primera'});
assert(!!landingHit&&Math.abs(landingHit.point.y-site.group.position.y-q.upperFloor)<.01,'Last stair tread connects continuously to the real first-floor landing',landingHit?{height:landingHit.point.y}:null);
for(const w of q.windows){const n=new THREE.Vector3(...w.normal),p=world(w.center);const hit=cast(p.clone().addScaledVector(n,-.6),p.clone().addScaledVector(n,.6),{component:w.wallComponent});assert(!hit,'Physical window '+w.id,hit?.object.name);}
for(const d of q.doors){const n=new THREE.Vector3(...d.normal),p=world(d.center);const hit=cast(p.clone().addScaledVector(n,-.6),p.clone().addScaledVector(n,.6),{component:d.wallComponent});assert(!hit,'Physical door '+d.id,hit?.object.name);}
for(const f of Object.values(v.focuses)){
 assert([f.target.x,f.target.y,f.target.z,...f.offset,...f.closeOffset].every(Number.isFinite),'Finite focus '+f.id);
 assert(f.interiorView?[0,1].includes(f.floor):(f.requiresSection?f.floor===1:f.floor===null),'Explicit floor semantics '+f.id);
 if(!f.interiorView)continue;
 assert(inside(f.coordinates,v.plan.buildings[0].coordinates),'Interior map anchor inside the actual building '+f.id);
 for(const name of['offset','closeOffset']){
  const eye=f.target.clone().add(new THREE.Vector3(...f[name])),collisions=[];
  for(const d of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const hit=cast(eye,eye.clone().add(new THREE.Vector3(...d).multiplyScalar(.32)));if(hit)collisions.push(hit.object.name);}
  assert(!collisions.length,'Interior camera clearance '+f.id+' '+name,collisions);
  const hit=cast(eye,f.target);assert(!hit||hit.distance>eye.distanceTo(f.target)-.7,'Interior line of sight '+f.id+' '+name,hit?{name:hit.object.name,distance:hit.distance,targetDistance:eye.distanceTo(f.target)}:null);
  const ceiling=cast(eye,eye.clone().add(new THREE.Vector3(0,16,0)));assert(!!ceiling,'Ceiling retained in normal view '+f.id+' '+name,ceiling?.object.name);
  const floor=cast(eye,eye.clone().add(new THREE.Vector3(0,-5,0)));assert(!!floor,'Interior eye is over a supported floor '+f.id+' '+name,floor?.object.name);
  const base=site.group.position.y+(f.floor?q.upperFloor:q.base);assert(Math.abs(eye.y-base-1.65)<.02,'Human-height interior camera '+f.id+' '+name,{height:eye.y-base});
 }
}
let finite=true,degenerate=0,owned=true;const own=site.group.userData.ownedResources;
site.group.traverse(o=>{if(!o.isMesh)return;if(!own.geometries.includes(o.geometry)||!own.materials.includes(o.material))owned=false;for(const a of Object.values(o.geometry.attributes))for(const x of a.array)if(!Number.isFinite(x))finite=false;const p=o.geometry.attributes.position,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();if(o.geometry.index){return;}for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1).sub(a);c.fromBufferAttribute(p,i+2).sub(a);if(b.cross(c).lengthSq()<1e-16)degenerate++;}});
assert(finite,'Finite geometry buffers');assert(!degenerate,'No degenerate triangles',degenerate);assert(owned,'Every geometry, material and texture has an owner');
assert(site.roof.visible,'Normal view retains roofs and flat ceilings');v.setSection(true);assert(!site.roof.visible,'Section removes only the main roof assembly');
let removed=0,retainedFloor=0,retainedAnnex=0;site.group.traverse(o=>{if(!o.isMesh||!visible(o))return;if(/^economato-tejado-|^economato-cubiertas-conexion$|^economato-techo-primera$|^economato-cumbreras$|^economato-canalones$/.test(o.userData.component))removed++;if(o.userData.component==='economato-forjado-primera')retainedFloor++;if(/^economato-anexo-\d-cubierta$/.test(o.userData.component))retainedAnnex++;});
assert(removed===0,'No roof-dependent covering remains in section',removed);assert(retainedFloor===1,'Section retains the complete first-floor slab',retainedFloor);assert(retainedAnnex===4,'All four undocumented annex roofs remain closed',retainedAnnex);assert(v.focuses['economato-seccion'].floor===1&&v.metadata.sectionFloor===1&&v.plan.sectionFloor===1,'Section and plan use the same first-floor level');v.setSection(false);
const shadows=own.materials.length,shadowFlags=[];site.group.traverse(o=>{if(o.isMesh)shadowFlags.push([o,o.castShadow]);});v.setReadingMode('periods');assert(v.getState().readingMode==='periods','Documentary reading mode');assert(shadowFlags.every(([o,value])=>o.castShadow===value),'Reading mode preserves shadow intent');v.setReadingMode('realistic');assert(v.getState().readingMode==='realistic','Original materials restored');
const before=Object.values(v.focuses).filter(f=>f.interiorView).map(f=>JSON.stringify([f.offset,f.closeOffset]));v.bindGround(()=>999);const after=Object.values(v.focuses).filter(f=>f.interiorView).map(f=>JSON.stringify([f.offset,f.closeOffset]));assert(before.every((x,i)=>x===after[i]),'Terrain binding preserves human-height interior cameras');
const allResources=Object.values(own).flat(),disposals=new Map();for(const r of allResources)r.addEventListener('dispose',()=>disposals.set(r,(disposals.get(r)||0)+1));site.dispose();site.dispose();assert(allResources.every(r=>disposals.get(r)===1),'Idempotent disposal releases every owned resource once');
const report={pass:checks.every(x=>x.pass),checks:checks.length,stats:site.stats,results:checks,limitations:['The registered envelope and documentary photographs constrain the model; there is no survey-grade interior plan.','Vertical dimensions, support spacing, staircase position and commercial furniture are interpretations.','Four service bodies remain closed exterior envelopes; the semibasement is not an invented interior tour.','The rehabilitation announced in January 2026 is not portrayed as completed.','Integrated context, terrain, occlusion and exact-mesh rendered cameras are checked separately.']};
fs.writeFileSync('research/validation-v28/economato-model-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:checks.length,stats:site.stats,failures:checks.filter(x=>!x.pass)},null,2));if(!report.pass)process.exitCode=1;
