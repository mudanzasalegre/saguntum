import fs from 'node:fs';
import * as THREE from 'three';
import {createSalvador} from '../../dist/js/salvador.js';
import {createSalvadorContext} from '../../dist/js/salvador-context.js';
import {createHeightSampler,buildTerrainGeometry} from '../../dist/js/terrain.js';
import {createUrbanSurface,polygonDistance} from '../../dist/js/urban-surface.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('cartography'),contextData=read('salvador-context'),visitData=read('salvador-visit'),record=read('landmarks').sites.find(r=>r.id==='salvador'),elevation=read('elevation'),heightAt=createHeightSampler(elevation);
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const model=createSalvador({record,heightAt,visitData,contextData}),urban=createUrbanSurface({data,project,heightAt,patches:model.patches});
const terrain=buildTerrainGeometry(elevation,urban.groundHeight,model.patches),context=createSalvadorContext({data,heightAt,contextData,visitData});context.bindGround(terrain.meshHeightAt);
const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
const scene=new THREE.Group();scene.add(model.group,context.group,terrainMesh);scene.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),shots=[];
for(const focus of Object.values(context.focuses))for(const kind of['offset','closeOffset']){
 const position=focus.target.clone().add(new THREE.Vector3(...focus[kind])),delta=focus.target.clone().sub(position);ray.set(position,delta.clone().normalize());ray.far=delta.length()-.8;
 const hit=ray.intersectObjects([model.group,context.group,terrainMesh],true).find(h=>h.object.userData.materialKind!=='glass');
 const wallClearance=Math.min(...[...contextData.buildings,...contextData.coreBuildings].map(b=>polygonDistance(position.x,position.z,b.coordinates.map(q=>project(...q)))));
 shots.push({id:focus.id,kind,position:position.toArray(),target:focus.target.toArray(),horizontalClearanceM:wallClearance,groundClearanceM:position.y-terrain.meshHeightAt(position.x,position.z),occlusion:hit?{name:hit.object.name,component:hit.object.userData.component,point:hit.point.toArray(),distance:hit.distance}:null});
}
const report={pass:shots.every(s=>!s.occlusion&&s.horizontalClearanceM>=2&&s.groundClearanceM>=2.5),shots,scope:'Church, detailed context, source street grading and six core foundation patches. The complete application scene remains a separate integration gate.'};
fs.writeFileSync('research/validation-v16/salvador-context-cameras-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
context.dispose();terrain.geometry.dispose();terrainMesh.material.dispose();if(!report.pass)process.exitCode=1;
