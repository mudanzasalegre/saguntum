// CPU geometry checks against the real Atlas final terrain; no browser/server.
import fs from 'node:fs';
import path from 'node:path';
import {root,THREE,project,buildCastleScene} from './castle-scene.mjs';
const {createCastle}=await import('../../dist/js/castle.js');
const {castle,visit,guide,geo,terrain,monuments,buildMs,groundBinding}=await buildCastleScene();
const checks=[],errors=[];
const assert=(pass,label)=>{checks.push({pass:!!pass,label});if(!pass)errors.push(label);};
assert(monuments.buildCastle(terrain.meshHeightAt)===castle,'Deferred castle construction is idempotent');
assert(Object.keys(visit.focuses).length===18&&guide.stops.every(stop=>visit.focuses[stop.id]),'All 18 stable stop IDs resolve');
assert(visit.regions.length===7&&visit.regions.every(region=>!region.bounds.isEmpty()),'Seven visitor precincts have geometry');
assert(visit.stats.sourceKeys.every(id=>guide.sources.some(source=>source.id===id)),'Every model source resolves in the published guide');
assert(visit.stats.duplicateSegmentsSkipped>200,'Duplicate OSM perimeter edges are not extruded again');
assert(visit.stats.romanWallWays===24,'Identified forum foundations retain their 24 mapped ways');
assert(monuments.castleRoadIds.size===20&&monuments.castleBuildingIds.size===10,'The shared context can exclude all 20 roads and ten buildings');

let finite=true,downwardRoutes=0,routeTriangles=0;
const meshes=[],surfaceMeshes=[];
castle.traverse(mesh=>{
 if(!mesh.isMesh)return;meshes.push(mesh);
 for(const attribute of Object.values(mesh.geometry.attributes))for(const value of attribute.array)if(!Number.isFinite(value))finite=false;
 if(mesh.userData.component==='caminos'){
  const normals=mesh.geometry.attributes.normal;
  for(let i=0;i<normals.count;i+=3){routeTriangles++;if(normals.getY(i)<=0)downwardRoutes++;}
 }
 if(['caminos','foro','templo'].includes(mesh.userData.component)&&['path','paving','rubble'].includes(mesh.userData.materialKind))surfaceMeshes.push(mesh);
});
assert(finite,'Every geometry attribute is finite');
assert(routeTriangles>0&&!downwardRoutes,'Mapped route triangles consistently face upward');
assert(meshes.every(mesh=>mesh.userData.materialKind),'Surface material kinds are available to the Simulator ground mask');
const terrainComparisons={maximumVertexError:0,minimumCentroidClearance:Infinity,buriedCentroids:0,triangles:0};
for(const mesh of surfaceMeshes){
 const positions=mesh.geometry.attributes.position,normals=mesh.geometry.attributes.normal;
 for(let i=0;i<positions.count;i+=3){
  if(normals.getY(i)<.4)continue;
  const x=(positions.getX(i)+positions.getX(i+1)+positions.getX(i+2))/3,y=(positions.getY(i)+positions.getY(i+1)+positions.getY(i+2))/3,z=(positions.getZ(i)+positions.getZ(i+1)+positions.getZ(i+2))/3;
  const clearance=y-terrain.meshHeightAt(x,z);
  terrainComparisons.minimumCentroidClearance=Math.min(terrainComparisons.minimumCentroidClearance,clearance);
  terrainComparisons.triangles++;if(clearance<-.03)terrainComparisons.buriedCentroids++;
 }
}
for(const point of visit.qa.floorSamples)terrainComparisons.maximumVertexError=Math.max(terrainComparisons.maximumVertexError,Math.abs(point.y-terrain.meshHeightAt(point.x,point.z)-point.offset));
assert(terrainComparisons.maximumVertexError<.0001,'Floor vertices use the final terrain mesh rather than the raw elevation grid');
assert(!terrainComparisons.buriedCentroids,'Route and floor triangle centers remain above the final terrain');
assert(visit.qa.buildings.every(building=>building.base>=building.terrainMaximum),'Mapped buildings are supported above the highest footprint ground');
assert(visit.qa.wallBases.every(wall=>wall.bottom<=terrain.meshHeightAt(wall.x,wall.z)+.02),'Defensive walls remain anchored into local ground');

const ray=new THREE.Raycaster(),gateResults=[];
for(const gate of visit.qa.portals){
 let clear=0,total=0;const hits=[],c=Math.cos(gate.yaw),s=Math.sin(gate.yaw);
 for(const u of[-.8,0,.8])for(const y of[1.25,1.8,2.4]){
  const depth=gate.depth/2+.4,origin=new THREE.Vector3(gate.x+u*c-depth*s,gate.base+y,gate.z-u*s-depth*c),direction=new THREE.Vector3(s,0,c);
  ray.set(origin,direction);ray.far=depth*2;
  const hit=ray.intersectObject(castle,true).find(hit=>hit.object.isMesh);total++;
  if(!hit)clear++;else hits.push({u,y,mesh:hit.object.name,point:hit.point.toArray()});
 }
 let openOculi=0;
 for(const oculus of gate.oculi||[]){
  const center=new THREE.Vector3(...oculus.center),depth=gate.depth/2+.4,direction=new THREE.Vector3(s,0,c);
  ray.set(center.clone().addScaledVector(direction,-depth),direction);ray.far=depth*2;
  if(!ray.intersectObject(castle,true).find(hit=>hit.object.isMesh))openOculi++;
 }
 gateResults.push({id:gate.id,total,clear,hits,openOculi});
 assert(clear===total,gate.id+': open portals pass all nine rays across the curtain');
 if(gate.oculi)assert(openOculi===2,'Almenara retains two real trefoil oculi');
}

const tower=visit.qa.features.find(feature=>feature.id==='telegrafo'),towerMeshes=meshes.filter(mesh=>mesh.userData.component==='telegrafo'),towerPoint=project(...tower.coordinate);
const towerRays=[];
for(const [axis,level,expectedHit]of[['north-south',1.2,false],['north-south',4.03,false],['east-west',1.2,true],['east-west',4.03,true]]){
 const direction=axis==='north-south'?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0),center=new THREE.Vector3(towerPoint.x,tower.base+level,towerPoint.z);
 ray.set(center.clone().addScaledVector(direction,-4),direction);ray.far=8;
 const hit=ray.intersectObjects(towerMeshes,false)[0];towerRays.push({axis,level,hit:!!hit,expectedHit});
 assert(!!hit===expectedHit,'Optical telegraph '+axis+' faces at '+level+' m match the documented openings');
}
ray.set(new THREE.Vector3(towerPoint.x,tower.base+15,towerPoint.z),new THREE.Vector3(0,-1,0));ray.far=20;
const centerHit=ray.intersectObjects(towerMeshes,false)[0];
assert(centerHit&&centerHit.point.y<tower.base+.15,'The optical telegraph tower has no invented covering roof');
const crownMeshes=meshes.filter(mesh=>mesh.userData.component==='merlones');
let slitCount=0,clearSlits=0;
for(const merlon of visit.qa.crowns.filter(crown=>crown.slit)){
 const direction=new THREE.Vector3(Math.sin(merlon.yaw),0,Math.cos(merlon.yaw)),center=new THREE.Vector3(merlon.x,merlon.slitCenter,merlon.z);
 ray.set(center.clone().addScaledVector(direction,-.43),direction);ray.far=.86;
 slitCount++;if(!ray.intersectObjects(crownMeshes,false)[0])clearSlits++;
}
assert(slitCount>0&&slitCount===clearSlits,'Surviving merlon arrow slits are actual holes through their geometry');
// The irregular mapped museum footprints must not turn a clipped ridge into
// a roof spanning empty ground. Check the real rendered roof triangle samples.
function pointInPolygon(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;}
let roofTriangles=0,roofOutside=0,roofDownward=0;
for(const building of visit.qa.buildings.filter(building=>building.roof.type==='pitched'))for(const mesh of meshes.filter(mesh=>mesh.userData.component===building.component&&mesh.userData.materialKind==='tile')){
 const positions=mesh.geometry.attributes.position,normals=mesh.geometry.attributes.normal;
 for(let i=0;i<positions.count;i+=3){
  roofTriangles++;if(normals.getY(i)<=0)roofDownward++;
  for(const weights of[[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2],[.2,.2,.6]]){
   const x=weights.reduce((sum,weight,j)=>sum+weight*positions.getX(i+j),0),z=weights.reduce((sum,weight,j)=>sum+weight*positions.getZ(i+j),0);
   if(!pointInPolygon(x,z,building.polygon))roofOutside++;
  }
 }
}
assert(roofTriangles>0&&!roofOutside&&!roofDownward,'Pitched roof triangles face upward and stay inside their irregular mapped footprints');
assert(!visit.stats.undergroundReconstruction&&visit.qa.cistern.undergroundVisible===false,'Covered cisterns remain covered; no invented exposed colonnade');
assert(visit.qa.cistern.length===65.6&&visit.qa.cistern.width===4.14&&visit.qa.cistern.documentedCentralPiers===21,'South cistern dimensions remain separate from the northern cisterns');

const originals=new Map(meshes.map(mesh=>[mesh,{material:mesh.material,color:mesh.material.color.clone(),map:mesh.material.map}]));
for(const stop of guide.stops){assert(visit.selectFocus(stop.id)?.id===stop.id,'Visit selection '+stop.id);visit.setReadingMode('periods');}
visit.setReadingMode('materials');visit.selectFocus(null);
assert([...originals].every(([mesh,original])=>mesh.material===original.material&&mesh.material.color.equals(original.color)&&mesh.material.map===original.map),'All selections and period readings restore their complete material and texture');
const other=createCastle({project,heightAt:terrain.meshHeightAt,data:{castlePolygon:geo.castlePolygon,castleWalls:geo.castleWalls},visitData:guide});
assert(other.userData.visit.stats.mappedBuildings===10&&other.userData.visit.stats.routeSegments===visit.stats.routeSegments,'Compact regional context uses the same castle plans');
const firstMaterials=new Set(meshes.map(mesh=>mesh.material)),firstTextures=new Set(castle.userData.ownedResources.textures);
assert(other.children.filter(mesh=>mesh.isMesh).every(mesh=>!firstMaterials.has(mesh.material)),'Atlas and regional instances never share disposable materials');
assert(other.userData.ownedResources.textures.every(texture=>!firstTextures.has(texture)),'Atlas and regional instances never share disposable textures');
assert(firstTextures.size>=7&&[...firstTextures].every(texture=>texture.isDataTexture&&texture.userData.originalProcedural),'Distinct original fabric textures are self contained and have no external image dependency');

const report={pass:!errors.length,buildMs,groundBinding,stats:visit.stats,checks,errors,terrainComparisons,gateResults,towerRays,roofs:{triangles:roofTriangles,outsideSamples:roofOutside,downwardTriangles:roofDownward},crowns:{count:visit.qa.crowns.length,slitCount,clearSlits},buildings:visit.qa.buildings.map(({polygon,...building})=>building),features:visit.qa.features,
 limitations:['Footprints are mapped; curtain elevations, merlon dimensions and roof slopes remain photographic estimates.','Historical drawings document lost configurations and are not shown as the current fabric.','The model is not a photogrammetric survey and does not establish a physically accessible walking route.']};
fs.writeFileSync(path.join(root,'research/validation-v50/castle-geometry.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,checks:checks.length,errors,buildMs,triangles:visit.stats.triangles,meshes:visit.stats.meshes,terrainComparisons,gateResults,towerRays,crowns:report.crowns},null,2));
if(errors.length)process.exitCode=1;
