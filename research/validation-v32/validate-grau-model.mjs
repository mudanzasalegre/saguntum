import fs from 'node:fs';
import * as THREE from 'three';
import {createRequire} from 'node:module';
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
import {createCoastGrau} from '../../dist/js/coast-grau.js';
import {createHeightSampler} from '../../dist/js/terrain.js';

globalThis.document={createElement:tag=>{if(tag!=='canvas')throw Error('Unexpected element '+tag);return createCanvas(512,512);}};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json','utf8'));
const records=read('coast-grau').sites,heightAt=createHeightSampler(read('coast-elevation')),project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const make=()=>createCoastGrau({heightAt,project,records,grauVisit:read('grau-visit'),grauContextData:{enabled:true}}),made=make(),site=made.sites['grau-vell'],visit=site.visit;
const checks=[],errors=[],assert=(value,message,detail)=>{checks.push({pass:!!value,message,...(detail?{detail}:{})});if(!value)errors.push(message);};
let vertices=0,triangles=0,nonfinite=0,zeroNormals=0,degenerate=0,meshes=0;
site.group.traverse(m=>{if(!m.isMesh)return;meshes++;const g=m.geometry,p=g.attributes.position,n=g.attributes.normal;vertices+=p.count;triangles+=p.count/3;for(const a of Object.values(g.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;for(let i=0;i<n.count;i++)if(n.getX(i)**2+n.getY(i)**2+n.getZ(i)**2<.1)zeroNormals++;for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-14)degenerate++;}});
assert(nonfinite===0,'All attributes are finite',{nonfinite});assert(zeroNormals===0,'All normals have usable length',{zeroNormals});assert(degenerate===0,'No zero-area triangles survive batching',{degenerate});
assert(Object.keys(visit.focuses).length===20,'Twenty registered focuses');assert(visit.stats.solidTowerBasement&&visit.stats.modelledTowerRooms===1,'Only the documented upper tower room is modelled');assert(site.stats.contextDelegated&&site.stats.contextParts===0,'Village geometry is delegated without duplicates');assert(visit.plan.openings.doors.every(o=>o.realOpening),'Doors are registered physical openings');
const worldMeshes=[];site.group.traverse(m=>{if(m.isMesh)worldMeshes.push(m);});site.group.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),openingChecks=[];
for(const o of visit.qa.openings.doors){
 const [x,y,z]=o.point,[nx,nz]=o.normal;ray.set(new THREE.Vector3(x+nx*.9,y,z+nz*.9),new THREE.Vector3(-nx,0,-nz));ray.far=1.8;
 const hits=ray.intersectObjects(worldMeshes).filter(q=>q.object.userData.component?.includes('muros'));openingChecks.push({id:o.id,wallObstruction:hits.length});
}
assert(openingChecks.every(o=>o.wallObstruction===0),'Door centers pass through their structural walls',openingChecks);
const snapshots=[];
for(const selected of ['grau-conjunto','grau-almacen','grau-cerchas','grau-sala-torre','grau-boveda','grau-terraza'])for(const open of[false,true]){
 visit.selectFocus(selected);visit.setSection(open);const hidden=worldMeshes.filter(m=>!m.visible).map(m=>m.userData.component),focus=visit.getFocus(selected),finite=[...focus.target.toArray(),...focus.offset,...focus.closeOffset,...focus.bounds.min.toArray(),...focus.bounds.max.toArray()].every(Number.isFinite);assert(finite,selected+' focus is finite');snapshots.push({selected,open,hiddenComponents:[...new Set(hidden)]});
 if(focus.interiorView)assert(worldMeshes.filter(m=>m.userData.component==='torre-boveda').every(m=>m.visible),selected+' retains a visible ceiling for indoor camera');
}
visit.selectFocus('grau-conjunto');visit.setSection(false);assert(worldMeshes.every(m=>m.visible),'Closing section restores all components');
const colors=worldMeshes.map(m=>m.material.color.getHex());visit.setReadingMode('periods');assert(worldMeshes.some((m,i)=>m.material.color.getHex()!==colors[i]),'Reading colors change the materials');visit.setReadingMode('realistic');assert(worldMeshes.every((m,i)=>m.material.color.getHex()===colors[i]),'Realistic materials are restored exactly');
visit.selectFocus('grau-sala-torre');const lowWall=worldMeshes.find(m=>m.userData.component==='torre-muros-bajos'),highWall=worldMeshes.find(m=>m.userData.component==='torre-muros-altos');assert(lowWall.material.emissive.equals(highWall.material.emissive)&&lowWall.material.emissiveIntensity===highWall.material.emissiveIntensity,'Room-wall highlighting stays continuous across the didactic section boundary');visit.selectFocus('grau-conjunto');
const other=make(),otherVisit=other.sites['grau-vell'].visit,ours=visit.qa.resourcesOwned,theirs=otherVisit.qa.resourcesOwned;assert([...ours.materials.values()].every(m=>![...theirs.materials.values()].includes(m)),'Instances do not share materials');assert([...ours.textures.values()].every(m=>![...theirs.textures.values()].includes(m)),'Instances do not share textures');let materialDisposals=0;for(const m of ours.materials.values())m.addEventListener('dispose',()=>materialDisposals++);visit.dispose();visit.dispose();assert(materialDisposals===ours.materials.size,'Disposal is idempotent and covers every owned material');otherVisit.dispose();
fs.writeFileSync('dist/assets/data/grau-plan.json',JSON.stringify(visit.plan,null,2)+'\n');
const exportedFocuses=Object.fromEntries(Object.entries(visit.focuses).map(([id,q])=>[id,{...q,target:q.target.toArray(),point:q.target.toArray(),bounds:{min:q.bounds.min.toArray(),max:q.bounds.max.toArray()}}]));
fs.writeFileSync('research/validation-v32/grau-focus-registration.json',JSON.stringify(exportedFocuses,null,2)+'\n');
const result={pass:errors.length===0,checks,errors,geometry:{meshes,vertices,triangles,nonfinite,zeroNormals,degenerate},stats:site.stats,sectionSnapshots:snapshots};fs.writeFileSync('research/validation-v32/grau-model-qa.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pass:result.pass,checks:checks.length,errors,geometry:result.geometry,stats:site.stats},null,2));if(errors.length)process.exitCode=1;
