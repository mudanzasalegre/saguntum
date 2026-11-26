// Export the actual application buffers, instances and procedural textures.
// node research/validation-v49/export-theatre-geometry.mjs --out /tmp/theatre.json.gz
// Renders produced from this export are CPU mesh inspections, not WebGL captures.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {THREE,root,buildTheatreScene} from './theatre-scene.mjs';
const output=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out'))throw new Error('--out <file.json.gz> is required');
const {scene,theatre,visit}=await buildTheatreScene({context:true,rasterTextures:true});
const typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null;
const textures=[],textureIds=new Map(),meshes=[];
const textureId=t=>{
 if(!t?.image?.toBuffer)return null;
 if(textureIds.has(t))return textureIds.get(t);
 const id=textures.length;textureIds.set(t,id);
 textures.push({id,png:t.image.toBuffer('image/png').toString('base64'),repeat:t.repeat.toArray(),offset:t.offset.toArray(),rotation:t.rotation,flipY:t.flipY});
 return id;
};
scene.updateMatrixWorld(true);
scene.traverseVisible(o=>{
 if(!o.isMesh)return;
 const bound=new THREE.Box3().setFromObject(o),centre=theatre.userData.visit.focuses['teatro-conjunto'].target;
 if(!o.userData.orthophoto&&bound.distanceToPoint(centre)>220)return;
 const m=Array.isArray(o.material)?o.material[0]:o.material;
 meshes.push({name:o.name,positions:typed(o.geometry.attributes.position.array),normals:typed(o.geometry.attributes.normal?.array),
  indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),
  matrix:o.matrixWorld.toArray(),instances:o.isInstancedMesh?typed(o.instanceMatrix.array.subarray(0,o.count*16)):null,
  material:{color:m.color.toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,
   kind:o.userData.materialKind||null,map:textureId(m.map),orthophoto:!!o.userData.orthophoto},
  component:o.userData.component||null,theatreFabric:!!o.userData.theatreFabric});
});
const camera=(name,p,t,fov=45,section=false)=>({name,position:theatre.localToWorld(new THREE.Vector3(...p)).toArray(),
 target:theatre.localToWorld(new THREE.Vector3(...t)).toArray(),fov,section});
const cameras=[
 camera('teatro-conjunto',[65,66,83],[0,7,6],45),
 camera('teatro-escena',[.6,12.5,28],[0,8,-13],62),
 camera('teatro-cavea',[1,6,-7],[0,9,24],70),
 camera('teatro-exterior',[60,42,-62],[0,8,-10],50),
 camera('teatro-corona',[-39,40,64],[0,15,28],50),
 camera('teatro-corte',[15,32,10],[0,-1,-6],60,true)
];
for(const id of ['teatro-conjunto','teatro-frons-scaenae','teatro-aditus-oriental','teatro-portico']){
 const f=visit.focuses[id];cameras.push({name:'visita-'+id,position:f.target.clone().add(new THREE.Vector3(...f.offset)).toArray(),target:f.target.toArray(),fov:f.fov||38});
}
const sourceHashes=Object.fromEntries(['dist/js/theatre.js','dist/js/theatre-environs.js','dist/assets/data/theatre-visit.json',
 'dist/assets/data/necropolis-context.json','dist/js/terrain.js','dist/js/urban-surface.js','dist/assets/data/elevation.json',
 'dist/assets/data/cartography.json'].map(file=>[file,createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')]));
fs.writeFileSync(output,zlib.gzipSync(JSON.stringify({root,sourceHashes,terrainImage:'dist/assets/data/orthophoto.jpg',meshes,textures,cameras,
 sectionRemoved:['cubierta','proscaenium'],method:'Shipped Three.js buffers with actual generated CanvasTextures; CPU inspection, not WebGL'})));
console.log(JSON.stringify({output,meshes:meshes.length,textures:textures.length,cameras:cameras.length,stats:visit.stats}));
