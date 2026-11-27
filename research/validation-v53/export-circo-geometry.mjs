// Export the actual application buffers, instances and procedural textures.
// CPU inspection: no reconstruction or replacement geometry is introduced here.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {THREE,root,buildCircoScene} from './circo-scene.mjs';
const output=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out'))throw new Error('--out <file.json.gz> is required');
const {createCanvas,ImageData}=createRequire((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||root+'node_modules')+'/package.json')('@napi-rs/canvas');
const mode=process.argv.includes('--mode')?process.argv[process.argv.indexOf('--mode')+1]:'historical';
const {scene,site,visit,city,archaeology,terrainMesh,urban}=await buildCircoScene({withCity:true,rasterTextures:true});
const {createExcavationController}=await import('../../dist/js/excavation.js');
const controller=createExcavationController({scene,renderer:{shadowMap:{}},sites:archaeology.sites,
 contextRoots:[city.group,...Object.values(archaeology.sites).filter(s=>s!==site).map(s=>s.group)],terrainMeshes:[terrainMesh],heightAt:urban.groundHeight});
controller.select('circo',{mode});visit.selectFocus(mode==='historical'?'circo-historica':'circo-conjunto');
scene.updateMatrixWorld(true);
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
// CPU applies the exact active clipping planes carried by the shipped meshes.
// This is only an export operation; no source geometry or scene is changed.
const neighborhood=(mode==='historical'?visit.focuses['circo-historica'].bounds:visit.bounds).clone().expandByScalar(mode==='historical'?60:45);
const clipping=[];
function exportGeometry(o,matrix){
 const source=o.geometry,material=Array.isArray(o.material)?o.material[0]:o.material;
 const planes=material.clippingPlanes?.length&&material.clipIntersection?material.clippingPlanes:[];
 const attrs=Object.entries(source.attributes).filter(([name])=>['position','normal','uv','color'].includes(name)),ix=source.index,p=source.attributes.position;
 const arrays=Object.fromEntries(attrs.map(([name])=>[name,[]]));let triangles=0;
 const world=new THREE.Vector3();
 const vertex=i=>{world.fromBufferAttribute(p,i).applyMatrix4(matrix);return {world:world.clone(),values:Object.fromEntries(attrs.map(([name,a])=>[name,Array.from(a.array.subarray(i*a.itemSize,(i+1)*a.itemSize))]))};};
 const blend=(a,b,t)=>({world:a.world.clone().lerp(b.world,t),values:Object.fromEntries(attrs.map(([name])=>[name,a.values[name].map((value,i)=>THREE.MathUtils.lerp(value,b.values[name][i],t))]))});
 const append=poly=>{for(let j=1;j<poly.length-1;j++){triangles++;for(const v of[poly[0],poly[j],poly[j+1]])for(const[name]of attrs)arrays[name].push(...v.values[name]);}};
 for(let t=0;t<(ix?.count||p.count);t+=3){
  const poly=[0,1,2].map(k=>vertex(ix?ix.getX(t+k):t+k));
  if(poly.every(v=>v.world.x<neighborhood.min.x)||poly.every(v=>v.world.x>neighborhood.max.x)||poly.every(v=>v.world.z<neighborhood.min.z)||poly.every(v=>v.world.z>neighborhood.max.z))continue;
  if(!planes.length||planes.some(plane=>poly.every(v=>plane.distanceToPoint(v.world)>=-1e-7))){append(poly);continue;}
  let remain=poly;
  for(const plane of planes){
   if(remain.length<3)break;
   const outside=[],inside=[];
   for(let j=0;j<remain.length;j++){
    const a=remain[j],b=remain[(j+1)%remain.length],da=plane.distanceToPoint(a.world),db=plane.distanceToPoint(b.world);
    (da>=0?outside:inside).push(a);
    if((da>=0)!==(db>=0)){const v=blend(a,b,da/(da-db));outside.push(v);inside.push(v);}
   }
   append(outside);remain=inside;
  }
 }
 if(!triangles)return null;
 if(planes.length)clipping.push({name:o.name,planes:planes.length,triangles});
 return Object.fromEntries(attrs.map(([name,a])=>[name,typed(new Float32Array(arrays[name]))]));
}
scene.traverseVisible(o=>{
 if(!o.isMesh)return;
 const m=Array.isArray(o.material)?o.material[0]:o.material,matrices=[];
 if(o.isInstancedMesh){const instance=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);matrices.push(o.matrixWorld.clone().multiply(instance));}}
 else matrices.push(o.matrixWorld);
 for(const matrix of matrices){
  if(!new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(matrix).intersectsBox(neighborhood))continue;
  const g=exportGeometry(o,matrix);if(!g)continue;
  meshes.push({name:o.name,positions:g.position,normals:g.normal,indices:null,uv:g.uv,colors:g.color,matrix:matrix.toArray(),instances:null,
   material:{color:m.color.toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,
    kind:o.userData.materialKind||null,map:textureId(m.map),orthophoto:!!o.userData.orthophoto},component:o.userData.component||null});
 }
});
const camera=(name,position,target,fov=45)=>({name,position,target,fov});
const f=visit.focuses[mode==='historical'?'circo-historica':'circo-conjunto'];
const c=visit.qa.circus.frame,point=(u,y,v)=>[c.x+u*Math.cos(c.yaw)+v*Math.sin(c.yaw),y,c.z-u*Math.sin(c.yaw)+v*Math.cos(c.yaw)];
const base=visit.qa.baseY;
const cameras=mode==='historical'?[
 camera('circo-completo',point(65,base+230,-145),point(-6,base+1,0),52),
 camera('circo-puerta-en-conjunto',point(visit.qa.circus.gateU-18,base+18,10),point(visit.qa.circus.gateU,base+1.8,34),55),
 camera('circo-spina',point(20,base+8,19),point(67,base+1,0),60)
]:[camera('circo-puerta-actual',f.target.clone().add(new THREE.Vector3(...f.offset)).toArray(),f.target.toArray(),52)];
const sourceFiles=['dist/js/circo.js','dist/js/circo-context.js','dist/js/circo-map.js','dist/js/excavation.js','dist/js/archaeology.js','dist/assets/data/circo-context.json','dist/assets/data/circo-visit.json'];
const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')]));
fs.writeFileSync(output,zlib.gzipSync(JSON.stringify({root,sourceHashes,mode,clipping,terrainImage:'dist/assets/data/orthophoto.jpg',meshes,textures,cameras,sectionRemoved:[],method:'Shipped Three.js buffers; CPU inspection, not WebGL'})));
console.log(JSON.stringify({output,meshes:meshes.length,textures:textures.length,cameras:cameras.length,stats:visit.stats}));
