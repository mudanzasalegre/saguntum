import fs from 'node:fs';
import * as THREE from 'three';
import {createCivicHeritage} from '../../dist/js/heritage-civic.js';
import {createSacredHeritage} from '../../dist/js/heritage-sacred.js';
import {createHeightSampler,buildTerrainGeometry} from '../../dist/js/terrain.js';
import {createUrbanSurface,polygonDistance} from '../../dist/js/urban-surface.js';
import {createCity} from '../../dist/js/city.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('cartography'),allLandmarks=read('landmarks'),landmarks=Object.fromEntries(allLandmarks.sites.map(s=>[s.id,s]));
const elevation=read('elevation'),heightAt=createHeightSampler(elevation);
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const sacred=createSacredHeritage({data,landmarks,project,heightAt,
 santaMariaVisit:read('santa-maria-visit'),santaMariaContext:read('santa-maria-context'),
 calvarioVisit:read('calvario-visit'),calvarioContext:read('calvario-context'),berenguerContext:read('berenguer-context'),
 sangreVisit:read('sangre-visit'),sangreContext:read('sangre-context'),salvadorVisit:read('salvador-visit'),salvadorContext:read('salvador-context')});
const civic=createCivicHeritage({data,landmarks,project,heightAt,
 plazaVisit:read('plaza-mayor-visit'),plazaContext:read('plaza-mayor-context'),
 juderiaVisit:read('juderia-visit'),juderiaContext:read('juderia-context'),
 berenguerVisit:read('berenguer-visit'),berenguerContext:read('berenguer-context'),
 museoVisit:read('museo-visit'),museoContext:read('museo-context')});
const patches=[...sacred.patches,...civic.patches],exclusions=[...sacred.exclusions,...civic.exclusions];
const excludedRoads=new Set([...sacred.excludedRoadIds,...civic.excludedRoadIds].map(String));
const urbanData={...data,roads:data.roads.filter(r=>!excludedRoads.has(String(r.osmId||r.id)))};
const openPassageIds=new Set([...(landmarks.juderia.osmIds||[]).map(s=>s.split('/')[1]),...(landmarks.juderia.secondaryGates||[]).map(s=>String(s.id))]);
const urban=createUrbanSurface({data:urbanData,project,heightAt,patches,exclusions,openPassageIds,
 collisionPolygons:allLandmarks.sites.filter(s=>s.id!=='juderia'&&s.footprint.length>=3).map(s=>s.footprint.map(p=>project(...p)))});
const terrain=buildTerrainGeometry(elevation,urban.groundHeight,patches);
for(const group of[...sacred.group.children,...civic.group.children])group.userData.visit?.bindGround?.(terrain.meshHeightAt);
const excludeBuildingIds=new Set([...allLandmarks.sites.flatMap(s=>s.osmIds||[]).filter(s=>s.startsWith('way/')).map(s=>s.split('/')[1]),...sacred.excludedBuildingIds,...civic.excludedBuildingIds]);
const city=createCity({data,project,heightAt:urban.groundHeight,urban,terrainHeightAt:terrain.meshHeightAt,excludeBuildingIds,exclusions,
 inBounds:(x,z)=>Math.hypot(x-10,z-55)<180,treeLimit:0});
const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
const scene=new THREE.Group();scene.add(civic.group,sacred.group,city.group,terrainMesh);scene.updateMatrixWorld(true);
const context=civic.sites.museo.userData.context,visit=civic.sites.museo.userData.visit;
visit.setSection(false);scene.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),shots=[];
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const opaque=h=>visible(h.object)&&h.object.userData.materialKind!=='glass'&&h.object.material?.opacity!==0;
for(const focus of Object.values(context.focuses))for(const kind of['offset','closeOffset']){
 const position=focus.target.clone().add(new THREE.Vector3(...focus[kind])),delta=focus.target.clone().sub(position);
 ray.set(position,delta.clone().normalize());ray.near=.05;ray.far=delta.length()-1;
 const hit=ray.intersectObjects(scene.children,true).find(opaque);
 ray.set(position.clone().add(new THREE.Vector3(0,30,0)),down);ray.near=0;ray.far=60;
 const downHits=ray.intersectObjects([civic.group,sacred.group,city.buildings],true).filter(opaque);
 const roofBelow=downHits.filter(h=>h.point.y<position.y-.1).sort((a,b)=>b.point.y-a.point.y)[0];
 const roofAbove=downHits.find(h=>h.point.y>=position.y-.1&&h.point.y<position.y+25);
 const surfaceClearance=roofBelow?position.y-roofBelow.point.y:null;
 const groundClearance=position.y-terrain.meshHeightAt(position.x,position.z);
 const insideDomestic=kind==='closeOffset'&&roofAbove&&roofAbove.object.userData.materialKind!=='foliage';
 shots.push({id:focus.id,kind,position:position.toArray(),target:focus.target.toArray(),
  groundClearanceM:groundClearance,surfaceClearanceM:surfaceClearance,insideDomestic:!!insideDomestic,
  standingOnRoof:kind==='closeOffset'&&roofBelow&&roofBelow.point.y-terrain.meshHeightAt(position.x,position.z)>1.5,
  occlusion:hit?{name:hit.object.name,component:hit.object.userData.component,point:hit.point.toArray(),distance:hit.distance}:null});
}
const report={pass:shots.every(s=>!s.occlusion&&!s.insideDomestic&&!s.standingOnRoof&&s.groundClearanceM>=1.7),shots,
 scope:'Museum, all seven previous detailed contexts and their monument cores, generic city, protected Judería arches, final street grading and terrain. Separate complete-region QA covers castle/theatre and archaeological cutouts.'};
fs.writeFileSync('research/validation-v17/museo-context-cameras-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--suggest')){
 const proposals=[['museo-fachada','far',-6,60,5.5],['museo-fachada','near',-5,56,2.15],
  ['museo-balcones','far',-6,59,6.5],['museo-balcones','near',-6.5,55,2.15],
  ['museo-dolors','far',3,40,4.0],['museo-dolors','near',6,42,2.15]];
 const suggestions=proposals.map(([id,kind,x,z,eye])=>{
  const target=visit.focuses[id].target,position=new THREE.Vector3(x,terrain.meshHeightAt(x,z)+eye,z),delta=target.clone().sub(position);
  ray.set(position,delta.clone().normalize());ray.near=.05;ray.far=delta.length()-1;
  const hit=ray.intersectObjects(scene.children,true).find(opaque);
  return{id,kind,position:position.toArray(),target:target.toArray(),offset:position.clone().sub(target).toArray(),groundClearanceM:eye,
   occlusion:hit?{name:hit.object.name,component:hit.object.userData.component,point:hit.point.toArray(),distanceToTarget:delta.length()-hit.distance}:null};
 });
 fs.writeFileSync('research/validation-v17/museo-model-exterior-camera-suggestions.json',JSON.stringify(suggestions,null,2)+'\n');
 console.log(JSON.stringify({suggestions},null,2));
}
if(!report.pass)process.exitCode=1;
