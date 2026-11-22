import * as THREE from 'three';

function unpack(data){
 const textures=data.textures.map(r=>{
  const t=r.data?new THREE.DataTexture(r.data,r.width,r.height,r.format,r.type):new THREE.Texture(r.bitmap);
  t.flipY=r.flipY??false;t.colorSpace=r.colorSpace;t.wrapS=r.wrapS;t.wrapT=r.wrapT;t.anisotropy=r.anisotropy;t.generateMipmaps=r.generateMipmaps;
  t.minFilter=r.minFilter;t.magFilter=r.magFilter;t.rotation=r.rotation;t.repeat.fromArray(r.repeat);t.offset.fromArray(r.offset);
  t.needsUpdate=true;if(r.bitmap)t.addEventListener('dispose',()=>r.bitmap.close());return t;
 });
 const materials=data.materials.map(r=>{
  const m=new (THREE[r.type]||THREE.MeshStandardMaterial)(r.options);
  if(r.color)m.color.fromArray(r.color);if(r.emissive)m.emissive.fromArray(r.emissive);
  for(const key of ['map','bumpMap','normalMap','roughnessMap','alphaMap'])if(r[key]!==undefined)m[key]=textures[r[key]];
  return m;
 });
 const attribute=a=>new THREE.BufferAttribute(a.array,a.size,a.normalized);
 const geometries=data.geometries.map(r=>{
  const g=new THREE.BufferGeometry();
  for(const [k,a] of Object.entries(r.attributes))g.setAttribute(k,attribute(a));
  if(r.index)g.setIndex(attribute(r.index));for(const span of r.groups)g.addGroup(span.start,span.count,span.materialIndex);
  return g;
 });
 const group=new THREE.Group(),modern=[],historical=[];
 for(const o of data.objects){
  const mat=o.materials.length===1?materials[o.materials[0]]:o.materials.map(i=>materials[i]);
  const geometry=geometries[o.geometry];
  const m=o.instances?new THREE.InstancedMesh(geometry,mat,0):new THREE.Mesh(geometry,mat);
  if(o.instances){
   m.instanceMatrix=new THREE.InstancedBufferAttribute(o.instances.array,16);m.count=o.count;
   if(o.instanceColor)m.instanceColor=new THREE.InstancedBufferAttribute(o.instanceColor.array,3);
  }
  m.name=o.name;m.matrixAutoUpdate=false;m.matrix.fromArray(o.matrix);
  m.castShadow=o.cast;m.receiveShadow=o.receive;m.renderOrder=o.order;group.add(m);
  if(o.visibility===1)modern.push(m);if(o.visibility===2){historical.push(m);m.visible=false;}
 }
 return {group,claims:data.claims,relief:data.relief,setHistorical(on){for(const m of modern)m.visible=!on;for(const m of historical)m.visible=on;}};
}

// A browser without worker canvas support can still use the source constructors.
export function heritageWorker(grids){
 if(!grids||typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined')return null;
 let worker,request=null,closed=false;
 function stop(error){
  closed=true;worker?.terminate();if(request){request.reject(error);request=null;}
 }
 try{
  worker=new Worker(new URL('./territory-heritage-worker.js',import.meta.url),{type:'module'});
  worker.postMessage({grids});
 }catch{return null;}
 worker.onerror=e=>{e.preventDefault();stop(Error(e.message||'No se pudo iniciar el trabajador de patrimonio'));};
 worker.onmessage=({data})=>{
  if(!request)return;
  const {resolve,reject}=request;request=null;
  if(data.error){reject(Error(data.error));return;}
  try{resolve(unpack(data));}catch(error){reject(error);}
 };
 return {get closed(){return closed;},load:id=>new Promise((resolve,reject)=>{
  request={resolve,reject};worker.postMessage({id});
 }),dispose:()=>stop(Error('Vista patrimonial cerrada'))};
}
