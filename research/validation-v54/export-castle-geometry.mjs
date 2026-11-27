// Export the actual application buffers, instances and procedural textures.
// CPU inspection: no reconstruction or replacement geometry is introduced here.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {THREE,root,buildCastleScene} from './castle-scene.mjs';
const output=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out'))throw new Error('--out <file.json.gz> is required');
const {createCanvas,ImageData}=createRequire((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||root+'node_modules')+'/package.json')('@napi-rs/canvas');
const sourceFiles=[...fs.readdirSync(root+'dist/js').filter(file=>/^castle.*\.js$/.test(file)).map(file=>'dist/js/'+file),'dist/js/monuments.js','dist/assets/data/castle-visit.json',
 'dist/js/terrain.js','dist/js/urban-surface.js','dist/js/excavation.js','dist/js/city.js','dist/assets/data/elevation.json','dist/assets/data/cartography.json','dist/assets/data/orthophoto.jpg'];
const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')]));
const {scene,castle,visit,terrain,groundBinding,easternExcavation}=await buildCastleScene({context:true,rasterTextures:true});
const typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null;
const textures=[],textureIds=new Map(),meshes=[];
function textureId(t){
 if(!t?.image)return null;
 if(textureIds.has(t))return textureIds.get(t);
 let bitmap=t.image;
 if(ArrayBuffer.isView(bitmap.data)){
  const {width,height,data}=bitmap,channels=data.length/(width*height);
  if(![3,4].includes(channels))throw new Error('Unsupported texture channels: '+channels);
  const pixels=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<width*height;i++)for(let c=0;c<4;c++)pixels[i*4+c]=c===3&&channels===3?255:data[i*channels+c];
  bitmap=createCanvas(width,height);bitmap.getContext('2d').putImageData(new ImageData(pixels,width,height),0,0);
 }
 if(!bitmap.toBuffer)return null;
 // A DataTexture's first row corresponds to v=0; PNG and Blender use an
 // opposite image-row convention. Normalize pixels, preserving the real UVs.
 if(t.flipY===false){
  const flipped=createCanvas(bitmap.width,bitmap.height),ctx=flipped.getContext('2d');
  ctx.translate(0,bitmap.height);ctx.scale(1,-1);ctx.drawImage(bitmap,0,0);bitmap=flipped;
 }
 const id=textures.length;textureIds.set(t,id);
 textures.push({id,png:bitmap.toBuffer('image/png').toString('base64'),repeat:t.repeat.toArray(),
  offset:t.offset.toArray(),rotation:t.rotation,sourceFlipY:t.flipY,pngOrientation:'Blender UV'});
 return id;
}
scene.updateMatrixWorld(true);
const neighborhood=visit.bounds.clone().expandByScalar(170);
scene.traverseVisible(o=>{
 if(!o.isMesh)return;
 if(!o.userData.orthophoto&&!new THREE.Box3().setFromObject(o).intersectsBox(neighborhood))return;
 const m=Array.isArray(o.material)?o.material[0]:o.material;
 meshes.push({name:o.name,positions:typed(o.geometry.attributes.position.array),normals:typed(o.geometry.attributes.normal?.array),
  indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),
  matrix:o.matrixWorld.toArray(),instances:o.isInstancedMesh?typed(o.instanceMatrix.array.subarray(0,o.count*16)):null,
  material:{color:m.color.toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,
   kind:o.userData.materialKind||null,map:textureId(m.map),orthophoto:!!o.userData.orthophoto},
  component:o.userData.component||null,castleFabric:!!o.userData.castleFabric});
});
const camera=(name,position,target,fov=45)=>({name,position,target,fov});
const center=visit.bounds.getCenter(new THREE.Vector3());
const focus=(id,offset,targetOffset=[0,0,0])=>{
 const target=visit.focuses[id].target.clone().add(new THREE.Vector3(...targetOffset));
 return [target.clone().add(new THREE.Vector3(...offset)).toArray(),target.toArray()];
};
// V54 inspection eyes are derived from the shipped visitor focuses.
// These camera choices do not add, move or replace any source geometry.
const cameras=[
 camera('castillo-oriente-general',...focus('almenara',[102,84,105],[22,-1,-2]),50),
 {...camera('castillo-oriente-aljibes',...focus('almenara-aljibes',visit.focuses['almenara-aljibes'].closeOffset),visit.focuses['almenara-aljibes'].fov||58),authoredVisitCamera:true,focusId:'almenara-aljibes'},
 camera('castillo-oriente-dependencias',...focus('almenara-dependencias',[-12,7,-14],[0,-1.6,0]),56)
];
const batteryTarget=visit.focuses['almenara-bateria'].target.clone();
const batteryEye=batteryTarget.clone().add(new THREE.Vector3(-15,0,24));
batteryEye.y=terrain.meshHeightAt(batteryEye.x,batteryEye.z)+1.9;
cameras.splice(1,0,camera('castillo-oriente-bateria',batteryEye.toArray(),batteryTarget.toArray(),58));
const gate=visit.qa.almenara;
if(gate?.frontCenter&&gate.walkCenterline?.length){
 const front=new THREE.Vector3(...(gate.frontFloorPoint||gate.thresholdOrigin||[gate.frontCenter[0],gate.walkCenterline[0][1],gate.frontCenter[2]]));
 const portal=visit.qa.portals.find(p=>p.id==='puerta-almenara'),axis=gate.oculi?.[0]?.axis;
 const normal=axis?new THREE.Vector3(...axis).normalize():new THREE.Vector3(Math.sin(portal.yaw),0,Math.cos(portal.yaw));
 const side=new THREE.Vector3(normal.z,0,-normal.x);
 cameras.push(camera('castillo-almenara-frente',front.clone().addScaledVector(normal,20).addScaledVector(side,3).add(new THREE.Vector3(0,4.9,0)).toArray(),front.clone().add(new THREE.Vector3(0,4.2,0)).toArray(),52));
}
for(const id of ['almenara','almenara-bateria','almenara-aljibes','almenara-baluarte','almenara-dependencias']){
 const f=visit.focuses[id];
 cameras.push({name:'visita-'+id,position:f.target.clone().add(new THREE.Vector3(...f.offset)).toArray(),target:f.target.toArray(),fov:f.fov||38,authoredVisitCamera:true});
 cameras.push({name:'visita-'+id+'-detalle',position:f.target.clone().add(new THREE.Vector3(...f.closeOffset)).toArray(),target:f.target.toArray(),fov:f.fov||38,authoredVisitCamera:true});
}
const changedSources=sourceFiles.filter(file=>createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')!==sourceHashes[file]);
if(changedSources.length)throw new Error('Source changed during export; retry after edits finish: '+changedSources.join(', '));
fs.writeFileSync(output,zlib.gzipSync(JSON.stringify({root,sourceHashes,terrainImage:'dist/assets/data/orthophoto.jpg',meshes,textures,cameras,
 groundBinding,easternExcavation,sectionRemoved:[],method:'Shipped Three.js buffers, instances, CanvasTextures and DataTextures; CPU inspection, not WebGL'})));
console.log(JSON.stringify({output,meshes:meshes.length,textures:textures.length,cameras:cameras.length,stats:visit.stats,inspectionCameras:cameras.map(c=>({name:c.name,position:c.position,target:c.target}))}));
