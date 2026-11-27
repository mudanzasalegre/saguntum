// Export the actual application buffers, instances and procedural textures.
// CPU inspection: no reconstruction or replacement geometry is introduced here.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {THREE,root,buildForumScene} from './forum-scene.mjs';
const output=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out'))throw new Error('--out <file.json.gz> is required');
const {createCanvas,ImageData}=createRequire((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||root+'node_modules')+'/package.json')('@napi-rs/canvas');
const {scene,site,visit}=await buildForumScene({withCity:true,rasterTextures:true});
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
const neighborhood=visit.bounds.clone().expandByScalar(65);
scene.traverseVisible(o=>{
 if(!o.isMesh)return;
 if(!o.userData.orthophoto&&!new THREE.Box3().setFromObject(o).intersectsBox(neighborhood))return;
 const m=Array.isArray(o.material)?o.material[0]:o.material;
 meshes.push({name:o.name,positions:typed(o.geometry.attributes.position.array),normals:typed(o.geometry.attributes.normal?.array),
  indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),
  matrix:o.matrixWorld.toArray(),instances:o.isInstancedMesh?typed(o.instanceMatrix.array.subarray(0,o.count*16)):null,
  material:{color:m.color.toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,
   kind:o.userData.materialKind||null,map:textureId(m.map),orthophoto:!!o.userData.orthophoto},
  component:o.userData.component||null,forumPlazaFabric:!!o.userData.forumPlazaFabric});
});
const camera=(name,position,target,fov=45)=>({name,position,target,fov});
const center=visit.bounds.getCenter(new THREE.Vector3());
const focus=(id,offset,targetOffset=[0,0,0])=>{
 const target=visit.focuses[id].target.clone().add(new THREE.Vector3(...targetOffset));
 return [target.clone().add(new THREE.Vector3(...offset)).toArray(),target.toArray()];
};
const localCamera=(name,u,v,y,tu,tv,ty,fov=54)=>{
 const g=site.group.userData.ground,p=g.world(u,v),t=g.world(tu,tv);
 return camera(name,[p.x,g.streetY+y,p.z],[t.x,g.streetY+ty,t.z],fov);
};
const cameras=[
 localCamera('forum-conjunto',55,-31,59,21,22,0,54),
 localCamera('forum-restos',33,8,7,20,23,-1.4,58),
 localCamera('forum-medianeras',20,10,6,4,20,3,58),
 localCamera('forum-jardin',39,25,6,27,42,3,58),
 localCamera('forum-rampa',39,-1,6,37,21,-.2,56)
];
const sourceFiles=['dist/js/forum-plaza.js','dist/js/forum-plaza-ground.js','dist/js/forum-plaza-surfaces.js','dist/js/forum-plaza-context.js','dist/js/archaeology.js','dist/js/excavation.js','dist/assets/data/forum-plaza-context.json','dist/assets/data/forum-plaza-visit.json','dist/assets/data/circo-context.json'];
const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')]));
fs.writeFileSync(output,zlib.gzipSync(JSON.stringify({root,sourceHashes,terrainImage:'dist/assets/data/orthophoto.jpg',meshes,textures,cameras,sectionRemoved:[],method:'Shipped Three.js buffers; CPU inspection, not WebGL'})));
console.log(JSON.stringify({output,meshes:meshes.length,textures:textures.length,cameras:cameras.length,stats:visit.stats}));
