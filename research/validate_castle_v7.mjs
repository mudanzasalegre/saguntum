import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {createHeightSampler,buildTerrainGeometry} from '../dist/js/terrain.js';
import {createMonuments} from '../dist/js/monuments.js';
import {createCastle} from '../dist/js/castle.js';
import {createSacredHeritage} from '../dist/js/heritage-sacred.js';
import {createCivicHeritage} from '../dist/js/heritage-civic.js';
import {createUrbanSurface} from '../dist/js/urban-surface.js';

// Real MDT, mapped plans and final urban/terrain sampler. Only browser canvas
// texture I/O is replaced; the castle itself does not need the DOM.
const context=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context}),querySelector:()=>({checked:true})};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json'));
const geo=read('cartography'),elevation=read('elevation'),castleData=read('castle-visit'),landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const monuments=createMonuments({project,heightAt:rawHeight,data:geo,castleVisit:castleData,deferCastle:true});
const sacred=createSacredHeritage({project,heightAt:rawHeight,landmarks}),civic=createCivicHeritage({project,heightAt:rawHeight,landmarks,data:geo});
const excludedRoads=new Set(['733321149','733321150','1419281599',...monuments.castleRoadIds].map(String));
const urban=createUrbanSurface({data:{...geo,roads:geo.roads.filter(r=>!excludedRoads.has(String(r.id)))},project,heightAt:(x,z)=>monuments.surfaceHeight(x,z,rawHeight(x,z)),patches:[...sacred.patches,...civic.patches],exclusions:[...sacred.exclusions,...civic.exclusions],openPassageIds:new Set([...(landmarks.juderia.osmIds||[]).map(s=>s.split('/')[1]),...(landmarks.juderia.secondaryGates||[]).map(s=>String(s.id))]),collisionPolygons:landmarkData.sites.filter(s=>s.id!=='juderia'&&s.footprint.length>=3).map(s=>s.footprint.map(c=>project(...c)))});
const terrain=buildTerrainGeometry(elevation,urban.groundHeight,[...sacred.patches,...civic.patches]),terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));terrainMesh.name='Terreno IGN y PNOA';terrainMesh.userData.orthophoto=true;
const pointRef=monuments.points.castle,before=performance.now(),castle=monuments.buildCastle(terrain.meshHeightAt),buildMs=performance.now()-before,visit=castle.userData.visit;
const scene=new THREE.Group();scene.add(terrainMesh,monuments.group);scene.updateMatrixWorld(true);
const errors=[],checks=[],assert=(pass,label)=>{checks.push({pass:!!pass,label});if(!pass)errors.push(label);};
assert(pointRef===monuments.points.castle,'deferred construction preserves the point reference');
assert(monuments.buildCastle(terrain.meshHeightAt)===castle,'deferred builder is idempotent');
assert(Object.keys(visit.focuses).length===18&&castleData.stops.every(s=>visit.focuses[s.id]),'all 18 documented stops have model focuses');
assert(visit.regions.length===7&&visit.regions.every(r=>!r.bounds.isEmpty()),'seven precincts have non-empty geometry bounds');
assert(visit.stats.sourceKeys.every(id=>castleData.sources.some(s=>s.id===id)),'model source identifiers resolve to published bibliography');
assert(visit.stats.duplicateSegmentsSkipped>200,'mapped perimeter is not extruded twice');
assert(visit.stats.romanWallWays===24,'24 individually identified forum wall traces');
assert(monuments.castleRoadIds.size===20&&monuments.castleBuildingIds.size===10,'all castle roads and building footprints can be excluded from context');
let finite=true,upwardRouteTriangles=0,downwardRouteTriangles=0,undergroundElements=0;
const surfaces=[];
castle.traverse(o=>{if(!o.isMesh)return;for(const attr of Object.values(o.geometry.attributes))for(const value of attr.array)if(!Number.isFinite(value))finite=false;
 if(o.userData.component==='caminos'){const n=o.geometry.attributes.normal;for(let i=0;i<n.count;i+=3)n.getY(i)>0?upwardRouteTriangles++:downwardRouteTriangles++;}
 if(['caminos','foro','templo'].includes(o.userData.component)&&['path','paving','rubble'].some(k=>o.name.endsWith(' · '+k)))surfaces.push(o);
 if(/reconstruction|underground|pilares-21/i.test(o.name))undergroundElements++;
});
assert(finite,'all geometry attributes are finite');assert(upwardRouteTriangles>0&&downwardRouteTriangles===0,'all mapped walking surfaces face upward');
assert(!visit.stats.undergroundReconstruction&&!undergroundElements,'covered cisterns are not portrayed as excavated underground interiors');
assert(visit.qa.cistern.length===65.6&&visit.qa.cistern.width===4.14&&visit.qa.cistern.documentedCentralPiers===21,'south cistern measurements are kept separate from northern cistern');
assert(visit.focuses['cisterna-norte'].target.distanceTo(visit.focuses['cisterna-foro'].target)>80,'northern and southern cistern focus locations remain distinct');
const terrainComparisons={maximumVertexError:0,minimumCentroidClearance:Infinity,buriedCentroids:0,triangles:0};
for(const o of surfaces){const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(let i=0;i<p.count;i+=3){if(n.getY(i)<.4)continue;const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,clearance=y-terrain.meshHeightAt(x,z);terrainComparisons.minimumCentroidClearance=Math.min(terrainComparisons.minimumCentroidClearance,clearance);terrainComparisons.triangles++;if(clearance<-.03)terrainComparisons.buriedCentroids++;}}
for(const p of visit.qa.floorSamples)terrainComparisons.maximumVertexError=Math.max(terrainComparisons.maximumVertexError,Math.abs(p.y-terrain.meshHeightAt(p.x,p.z)-p.offset));
assert(terrainComparisons.maximumVertexError<.0001,'forum/temple floor vertices follow final terrain sampler');
assert(terrainComparisons.buriedCentroids===0,'floor and route triangle centers remain above rendered terrain');
assert(visit.qa.buildings.every(b=>b.base>=b.terrainMaximum),'mapped present roofs are supported above their maximum footprint ground');
const ray=new THREE.Raycaster(),gateResults=[];
for(const gate of visit.qa.portals){let clear=0,total=0,hits=[];const c=Math.cos(gate.yaw),s=Math.sin(gate.yaw);
 for(const u of[-.8,0,.8])for(const y of[1.25,1.8,2.4]){const depth=gate.depth/2+.4,origin=new THREE.Vector3(gate.x+u*c-depth*s,gate.base+y,gate.z-u*s-depth*c),direction=new THREE.Vector3(s,0,c);ray.set(origin,direction);ray.far=depth*2;const hit=ray.intersectObject(castle,true).find(h=>h.object.isMesh);total++;if(!hit)clear++;else hits.push({u,y,mesh:hit.object.name,point:hit.point.toArray()});}
 let openOculi=0;for(const o of gate.oculi||[]){const center=new THREE.Vector3(...o.center),depth=gate.depth/2+.4;ray.set(center.clone().addScaledVector(new THREE.Vector3(s,0,c),-depth),new THREE.Vector3(s,0,c));ray.far=depth*2;if(!ray.intersectObject(castle,true).find(h=>h.object.isMesh))openOculi++;}
 gateResults.push({id:gate.id,total,clear,hits,openOculi});assert(clear===total,gate.id+' open portal rays cross the full wall depth');
 if(gate.oculi)assert(openOculi===2,'Almenara preserves two open trefoil oculi through the full wall depth');
}
const originals=new Map();castle.traverse(o=>{if(o.isMesh)originals.set(o,{material:o.material,color:o.material.color.clone(),map:o.material.map});});
for(const s of castleData.stops){assert(visit.selectFocus(s.id)?.id===s.id,'select focus '+s.id);visit.setReadingMode('periods');}
visit.setReadingMode('materials');visit.selectFocus(null);
assert([...originals].every(([mesh,o])=>mesh.material===o.material&&mesh.material.color.equals(o.color)&&mesh.material.map===o.map),'all 18 selections and period readings restore original materials');
const other=createCastle({project,heightAt:terrain.meshHeightAt,data:{castlePolygon:geo.castlePolygon,castleWalls:geo.castleWalls},visitData:castleData});
assert(other.userData.visit.stats.mappedBuildings===10&&other.userData.visit.stats.routeSegments===visit.stats.routeSegments,'Palancia context retains compact castle road/building plans');
const firstMaterials=new Set([...originals].map(([mesh])=>mesh.material));
assert(other.children.filter(m=>m.isMesh).every(m=>!firstMaterials.has(m.material)),'castle instances never share disposable materials');
assert(other.userData.ownedResources.textures[0]!==castle.userData.ownedResources.textures[0],'castle instances never share disposable texture cache');
let oldSource='';try{oldSource=execFileSync('git',['show','HEAD:dist/js/monuments.js'],{encoding:'utf8'});}catch{}
const newSource=fs.readFileSync('dist/js/monuments.js','utf8'),theatreBody=s=>s.slice(s.indexOf('export function createTheatre()'),s.indexOf('function wallStrip('));
assert(oldSource&&theatreBody(oldSource)===theatreBody(newSource),'Roman theatre function remains byte-for-byte unchanged');

// Use the application's actual responsive fitting and UI offsets, not another
// independent camera formula that could pass while the user-facing frame fails.
let innerWidth=1363,innerHeight=936,castleStopId=null;const castleVisit=()=>visit,points=monuments.points,mobile=()=>innerWidth<=700;
const appSource=fs.readFileSync('dist/js/app.js','utf8');
const castleFrame=eval('('+appSource.slice(appSource.indexOf('function castleFrame('),appSource.indexOf('function preset(')).trim()+')');
const preset=eval('('+appSource.slice(appSource.indexOf('function preset('),appSource.indexOf('function setShadowFraming(')).trim()+')');
const cameras=[];
for(const [w,h]of[[1363,936],[390,844],[844,390]])for(const id of[null,...castleData.stops.map(s=>s.id)])for(const near of[false,true]){
 innerWidth=w;innerHeight=h;castleStopId=id;const dest=preset('castle',near),frame=castleFrame(),camera=new THREE.PerspectiveCamera(38,w/h,.12,25000);
 camera.position.copy(dest.position);camera.position.y=Math.max(camera.position.y,terrain.meshHeightAt(camera.position.x,camera.position.z)+1.55);camera.lookAt(dest.target);camera.setViewOffset(w,h,frame.offsetX,frame.offsetY,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const focus=id?visit.focuses[id]:null,box=focus?.bounds||visit.bounds;let escaped=0,behind=0;
 for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera),sx=(p.x+1)*w/2,sy=(1-p.y)*h/2;if(sx<frame.left||sx>frame.right||sy<frame.top||sy>frame.bottom)escaped++;if(p.z>1||p.z< -1)behind++;}
 const toTarget=dest.target.clone().sub(camera.position);ray.set(camera.position,toTarget.clone().normalize());ray.far=toTarget.length()-.3;
 const hit=ray.intersectObject(terrainMesh,false)[0];
 cameras.push({id:id||'overview',near,width:w,height:h,escapedCorners:escaped,behind,terrainOcclusion:hit?{distance:hit.distance,point:hit.point.toArray()}:null,position:camera.position.toArray(),target:dest.target.toArray(),frame});
 assert([...camera.position.toArray(),...dest.target.toArray()].every(Number.isFinite),`${id||'overview'} ${w} ${near?'near':'full'} camera finite`);
 if(!near)assert(!escaped&&!behind,`${id||'overview'} ${w} full view fits available UI frame`);
 assert(!hit,`${id||'overview'} ${w} ${near?'near':'full'} target is not hidden by terrain`);
}
const result={pass:!errors.length,buildMs,stats:visit.stats,errors,checks,gateResults,terrainComparisons,cameras,limitations:['Architecture elevations are interpreted, not a photogrammetric survey.','Virtual camera jumps do not certify pedestrian circulation or physical access.','Northern cistern and inscription markers identify their documented sector; no exact new footprint is claimed.']};
fs.mkdirSync('research/validation-v7',{recursive:true});fs.writeFileSync('research/validation-v7/castle-geometry.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:result.pass,buildMs,stats:visit.stats,checks:checks.length,errors,gateResults,terrainComparisons,cameraIssues:cameras.filter(c=>(!c.near&&c.escapedCorners)||c.terrainOcclusion)},null,2));
if(process.argv.includes('--export')){
 const typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null;
 const meshes=[];scene.traverse(o=>{if(!o.isMesh)return;meshes.push({name:o.name,positions:typed(o.geometry.attributes.position.array),indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),matrix:o.matrixWorld.toArray(),material:{color:o.material.color.toArray(),roughness:o.material.roughness,metalness:o.material.metalness,orthophoto:!!o.userData.orthophoto},region:o.userData.regionId||null,component:o.userData.component||null});});
 fs.writeFileSync('research/validation-v7/castle-geometry.json.gz',zlib.gzipSync(JSON.stringify({terrainImage:'dist/assets/data/orthophoto.jpg',meshes,cameras})));
}
if(errors.length)process.exitCode=1;
