import fs from 'node:fs';
import zlib from 'node:zlib';
import * as THREE from 'three';
import {createMonuments,theatreRoadIds,theatreBuildingIds} from '../dist/js/monuments.js';
import {createTheatre} from '../dist/js/theatre.js';
import {createHeightSampler,buildTerrainGeometry} from '../dist/js/terrain.js';
import {createSacredHeritage} from '../dist/js/heritage-sacred.js';
import {createCivicHeritage} from '../dist/js/heritage-civic.js';
import {createUrbanSurface} from '../dist/js/urban-surface.js';

const context=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context}),querySelector:()=>({checked:true})};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json'));
const geo=read('cartography'),elevation=read('elevation'),theatreData=read('theatre-visit'),castleData=read('castle-visit'),landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const started=performance.now(),monuments=createMonuments({heightAt:rawHeight,project,data:geo,castleVisit:castleData,theatreVisit:theatreData,deferCastle:true});
const theatre=monuments.theatre,visit=theatre.userData.visit,buildMs=performance.now()-started;
const sacred=createSacredHeritage({project,heightAt:rawHeight,landmarks}),civic=createCivicHeritage({project,heightAt:rawHeight,landmarks,data:geo});
const excludedRoads=new Set(['733321149','733321150','1419281599',...monuments.castleRoadIds,...theatreRoadIds].map(String));
const urban=createUrbanSurface({data:{...geo,roads:geo.roads.filter(r=>!excludedRoads.has(String(r.id)))},project,heightAt:(x,z)=>monuments.surfaceHeight(x,z,rawHeight(x,z)),patches:[...sacred.patches,...civic.patches],exclusions:[...sacred.exclusions,...civic.exclusions],openPassageIds:new Set([...(landmarks.juderia.osmIds||[]).map(s=>s.split('/')[1]),...(landmarks.juderia.secondaryGates||[]).map(s=>String(s.id))]),collisionPolygons:landmarkData.sites.filter(s=>s.id!=='juderia'&&s.footprint.length>=3).map(s=>s.footprint.map(c=>project(...c)))});
const terrain=buildTerrainGeometry(elevation,urban.groundHeight,[...sacred.patches,...civic.patches]);
const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));terrainMesh.name='Terreno IGN / PNOA';terrainMesh.userData.orthophoto=true;
const scene=new THREE.Group();scene.add(terrainMesh,monuments.group);scene.updateMatrixWorld(true);visit.bindGround(terrain.meshHeightAt);
const errors=[],checks=[],assert=(condition,label)=>{checks.push({pass:!!condition,label});if(!condition)errors.push(label);};
const vector=a=>new THREE.Vector3(...a),ray=new THREE.Raycaster();
assert(Object.keys(visit.focuses).length===16&&theatreData.stops.every(s=>visit.focuses[s.id]),'all 16 documented stop IDs resolve to model focuses');
assert(visit.stats.sourceKeys.every(id=>theatreData.sources.some(s=>s.id===id)),'model references resolve to the displayed bibliography');
assert(visit.qa.documentedDimensions.orchestra===16&&visit.qa.documentedDimensions.upperPortico===79,'orchestra and principal cavea dimensions match archaeological measurements');
assert(visit.qa.seating.length===23&&visit.qa.seating.filter(r=>r.order==='ima-cavea').length===6&&visit.qa.seating.filter(r=>r.order==='media-cavea').length===8&&visit.qa.seating.filter(r=>r.order==='summa-cavea').length===9,'the documented 6 / 8 / 9 seating orders are represented');
assert(visit.qa.underground.aulaeumCells===16&&visit.qa.underground.transverseWalls===17&&visit.qa.underground.channelWidth===1.42,'the didactic curtain trench preserves documented structural counts and width');
assert(!visit.qa.underground.ancientStageHeightKnown,'ancient stage elevation is not passed off as measured');
assert(theatreBuildingIds.has('cat-3556901YJ3935N_part1-0')&&theatreBuildingIds.has('cat-3556901YJ3935N_part2-0'),'both cadastral theatre duplicates are excluded from context');
assert(theatreRoadIds.size===27,'27 internal mapped paths are replaced by architectural circulation');
let finite=true,meshCount=0,topTriangles=0,buried=0,minClearance=Infinity;const buriedSamples=[];
const surfaceComponents=new Set(['orchestra','proedria','ima-cavea','media-cavea','summa-cavea','proscaenium','hyposcaenium']);
theatre.traverse(o=>{
 if(!o.isMesh)return;meshCount++;
 for(const a of Object.values(o.geometry.attributes))for(const value of a.array)if(!Number.isFinite(value))finite=false;
 if(!surfaceComponents.has(o.userData.component))return;
 const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;
 for(let i=0;i<p.count;i+=3){
  if(n.getY(i)<.8)continue;
  const point=new THREE.Vector3((p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3).applyMatrix4(o.matrixWorld);
  const ground=terrain.meshHeightAt(point.x,point.z),clearance=point.y-ground;topTriangles++;minClearance=Math.min(minClearance,clearance);
  if(clearance<-.06){buried++;if(buriedSamples.length<20)buriedSamples.push({mesh:o.name,point:point.toArray(),ground,clearance});}
 }
});
assert(finite,'all geometry attributes are finite');assert(buried===0,'top surfaces remain above the final interpolated terrain');
const openings=[];
for(const opening of [...visit.qa.openings,visit.qa.drainOpening]){
 const origin=vector(opening.origin),direction=vector(opening.direction),side=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();let clear=0,total=0;const hits=[];
 for(const u of[-.40,0,.40])for(const height of[-.25,0,.25]){
  const point=origin.clone().addScaledVector(side,u);point.y+=height;ray.set(point,direction);ray.far=opening.distance;
  const meshHit=ray.intersectObject(theatre,true).find(h=>h.object.isMesh&&h.object.visible),terrainHit=ray.intersectObject(terrainMesh,false)[0];total++;
  if(!meshHit&&!terrainHit)clear++;else hits.push({u,height,mesh:meshHit?.object.name,meshPoint:meshHit?.point.toArray(),terrainPoint:terrainHit?.point.toArray()});
 }
 openings.push({id:opening.id,total,clear,hits});assert(clear===total,opening.id+' has an open 3D passage and terrain clearance');
}
const initial=new Map();theatre.traverse(o=>{if(o.isMesh)initial.set(o,{material:o.material,color:o.material.color.clone(),map:o.material.map,visible:o.visible});});
for(const stop of theatreData.stops){assert(visit.selectFocus(stop.id)?.id===stop.id,'focus selection '+stop.id);visit.setReadingMode('periods');}
visit.selectFocus(null);visit.setReadingMode('materials');visit.setSection(true);
assert([...initial.keys()].filter(m=>['cubierta','proscaenium'].includes(m.userData.component)).every(m=>!m.visible),'section removes the contemporary roof and stage deck');
assert([...initial.keys()].filter(m=>['hyposcaenium','aulaeum','cloaca'].includes(m.userData.component)).every(m=>m.visible),'documented schematic substructures remain present in section');
visit.setSection(false);
assert([...initial].every(([mesh,v])=>mesh.material===v.material&&mesh.material.color.equals(v.color)&&mesh.material.map===v.map&&mesh.visible===v.visible),'selection, period reading and cutaway restore original resources and visibility');
const other=createTheatre({heightAt:rawHeight,project,data:geo,visitData:theatreData}),firstMaterials=new Set(theatre.userData.ownedResources.materials);
assert(other.userData.ownedResources.materials.every(m=>!firstMaterials.has(m)),'theatre instances never share disposable material caches');
assert(other.userData.ownedResources.textures.every(t=>!theatre.userData.ownedResources.textures.includes(t)),'theatre instances never share disposable textures');
const cameraResults=[];
for(const stop of theatreData.stops){const focus=visit.focuses[stop.id];
 for(const near of[false,true]){const offset=vector(near?focus.closeOffset:focus.offset),position=focus.target.clone().add(offset),direction=focus.target.clone().sub(position),clearance=position.y-terrain.meshHeightAt(position.x,position.z);ray.set(position,direction.clone().normalize());ray.far=direction.length()-.05;const hit=ray.intersectObject(terrainMesh,false)[0];
  cameraResults.push({id:stop.id,near,clearance,terrainHit:hit?hit.point.toArray():null});assert(clearance>=1.55,stop.id+' '+(near?'near':'full')+' camera stays above rendered terrain');assert(!hit,stop.id+' '+(near?'near':'full')+' camera target is not hidden by terrain');
 }
}
fs.mkdirSync('research/validation-v8',{recursive:true});
fs.writeFileSync('dist/assets/data/theatre-plan.json',JSON.stringify({schemaVersion:1,...visit.plan},null,2));
const result={pass:!errors.length,buildMs,stats:visit.stats,checks,errors,openings,terrain:{topTriangles,buried,minClearance,buriedSamples},cameras:cameraResults,limitations:['Metric schematic architecture registered to supplied OSM / PNOA, not photogrammetry.','Conserved and rehabilitated state; no fictitious fully restored Roman scaenae frons.','Cutaway removes contemporary roof and deck, exposing interpretive archaeological substructures.','Physical access and pedestrian collision are not certified by camera tours.']};
fs.writeFileSync('research/validation-v8/theatre-geometry.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:result.pass,buildMs,stats:visit.stats,checks:checks.length,errors,openings:openings.filter(o=>o.clear!==o.total),terrain:result.terrain,cameraIssues:cameraResults.filter(c=>c.terrainHit)},null,2));
if(process.argv.includes('--export')){
 const typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null;
 const meshes=[];scene.traverse(o=>{if(!o.isMesh)return;meshes.push({name:o.name,positions:typed(o.geometry.attributes.position.array),indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),matrix:o.matrixWorld.toArray(),material:{color:o.material.color.toArray(),roughness:o.material.roughness,metalness:o.material.metalness,orthophoto:!!o.userData.orthophoto},region:o.userData.regionId||null,component:o.userData.component||null});});
 const cam=(name,p,t,section=false)=>({name,position:theatre.localToWorld(vector(p)).toArray(),target:theatre.localToWorld(vector(t)).toArray(),section});
 const cameras=[cam('teatro-conjunto',[75,77,116],[0,7,7]),cam('teatro-orchestra',[1,23,31],[0,7,-8]),cam('teatro-corte',[23,51,18],[-3,-2,-5.5],true),cam('teatro-aditus',[59,12,-5],[27,2,-.8]),cam('teatro-planta',[0,135,.1],[0,0,0])];
 fs.writeFileSync('research/validation-v8/theatre-geometry.json.gz',zlib.gzipSync(JSON.stringify({terrainImage:'dist/assets/data/orthophoto.jpg',meshes,cameras})));
}
if(errors.length)process.exitCode=1;
