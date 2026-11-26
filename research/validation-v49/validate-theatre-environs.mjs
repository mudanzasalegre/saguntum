// Verify OSM registration, architectural clearance and non-accumulating terrain binding.
import fs from 'node:fs';
import {THREE,root} from './theatre-scene.mjs';
const {appendTheatreEnvirons,theatreEnvironsSourceData}=await import('../../dist/js/theatre-environs.js');
const {createHeightSampler}=await import('../../dist/js/terrain.js');
const dir=root+'dist/assets/data/';
const cartography=JSON.parse(fs.readFileSync(dir+'cartography.json'));
const heightAt=createHeightSampler(JSON.parse(fs.readFileSync(dir+'elevation.json')));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const frame=theatreEnvironsSourceData.frame,origin=project(...frame.center),base=heightAt(origin.x,origin.z)-.65,c=Math.cos(frame.yaw),s=Math.sin(frame.yaw);
const world=(x,y,z)=>new THREE.Vector3(origin.x+x*c+z*s,base+y,origin.z-x*s+z*c);
const local=(x,z)=>({x:(x-origin.x)*c-(z-origin.z)*s,z:(x-origin.x)*s+(z-origin.z)*c});
class CaptureBatch{
 constructor(){this.parts=new Map();}
 raw(k,p){this.append(k,p);}
 geometry(k,g,m){const source=g.index?g.toNonIndexed():g,p=source.attributes.position,out=[],v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);out.push(v.x,v.y,v.z);}this.append(k,out);if(source!==g)source.dispose();}
 append(k,p){if(!this.parts.has(k))this.parts.set(k,[]);this.parts.get(k).push(...p);}
 finish(){const group=new THREE.Group();group.position.set(origin.x,base,origin.z);group.rotation.y=frame.yaw;for(const[k,p]of this.parts){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.computeVertexNormals();geometry.computeBoundingBox();const mesh=new THREE.Mesh(geometry),[component,period,materialKind]=k.split('|');mesh.userData={component,period,materialKind};group.add(mesh);}group.updateMatrixWorld(true);return group;}
}
const batch=new CaptureBatch(),key=(...p)=>p.join('|'),plans=[];
const helper=appendTheatreEnvirons({batch,key,plan:(...p)=>plans.push(p),localWorld:world,toLocal:local,heightAt,base});
const group=batch.finish(),checks=[];
const assert=(ok,label)=>{checks.push({pass:!!ok,label});if(!ok)throw new Error(label);};
assert([...batch.parts.values()].every(p=>p.every(Number.isFinite)),'All environment positions are finite');
assert([...batch.parts.values()].every(p=>p.length%9===0),'All geometry comprises complete triangles');
let maxSourceError=0;
for(const record of [...theatreEnvironsSourceData.paths,...theatreEnvironsSourceData.walls]){
 const source=[...cartography.roads,...cartography.retainingWalls].find(r=>r.id===record.id);
 assert(source&&source.coordinates.length===record.points.length,'Original OSM way exists with matching node count: '+record.id);
 source.coordinates.forEach((point,i)=>{const p=project(...point),q=local(p.x,p.z);maxSourceError=Math.max(maxSourceError,Math.hypot(record.points[i][0]-q.x,record.points[i][1]-q.z));});
}
assert(maxSourceError<.008,'Projected OSM coordinates preserved within centimetre rounding');
assert(helper.treeExclusions.length===helper.qa.trees.length,'Every rendered tree owns a generic-vegetation exclusion');
assert(helper.vegetationCoverage.length===1&&helper.vegetationExclusions.length===helper.qa.trees.length+1,'The inspected PNOA setting replaces generic scattering across one continuous area');
assert(helper.pathPolygons.length>100&&helper.solidPolygons.length>100,'Paths and retaining walls expose world-coordinate Simulator claims');
const buildingSafe=[];
for(const mesh of group.children){if(!['entorno-accesos','entorno-contencion','entorno-roca'].includes(mesh.userData.component))continue;const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const w=world(p.getX(i),0,p.getZ(i));if(!helper.architectureClear(w.x,w.z))buildingSafe.push([p.getX(i),p.getZ(i)]);}}
assert(buildingSafe.length===0,'Ground scenery does not intrude into the conservative theatre envelope');
const original=new Map(group.children.map(m=>[m,m.geometry.attributes.position.array.slice()]));
const finalGround=(x,z)=>heightAt(x,z)+.32+.0017*(x-origin.x);
helper.bindGround(group,finalGround);
const once=new Map(group.children.map(m=>[m,m.geometry.attributes.position.array.slice()]));
helper.bindGround(group,finalGround);
assert(group.children.every(m=>m.geometry.attributes.position.array.every((v,i)=>v===once.get(m)[i])),'Binding twice to the same terrain does not accumulate displacement');
helper.bindGround(group,heightAt);
assert(group.children.every(m=>m.geometry.attributes.position.array.every((v,i)=>Math.abs(v-original.get(m)[i])<.00001)),'Rebinding to the source ground restores original geometry');
assert(helper.surfaceHeight(1,2,36.4)===36.4,'The helper leaves the terrain height unchanged');
const result={pass:true,checks,stats:{meshes:group.children.length,triangles:[...batch.parts.values()].reduce((s,p)=>s+p.length/9,0),trees:helper.qa.trees.length,rejectedTrees:helper.qa.rejectedCanopies.length,pathSegments:helper.pathPolygons.length,wallSegments:helper.solidPolygons.length,rockCells:helper.qa.rockPatches.reduce((s,p)=>s+p.cells,0),maximumOsmNodeDifferenceM:maxSourceError,componentIds:helper.componentIds},qa:helper.qa,bounds:{min:helper.environsBounds.min.toArray(),max:helper.environsBounds.max.toArray()}};
fs.writeFileSync(root+'research/validation-v49/theatre-environs-qa.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:result.pass,checks:checks.length,stats:result.stats},null,2));
