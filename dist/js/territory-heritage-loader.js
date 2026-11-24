import * as THREE from 'three';
import {landscapeDetail} from './territory-heritage-models.js';

function unpack(data){
 const textures=data.textures.map(r=>{
  const t=r.data?new THREE.DataTexture(r.data,r.width,r.height,r.format,r.type):new THREE.Texture(r.bitmap);
  t.flipY=r.flipY??false;t.colorSpace=r.colorSpace;t.wrapS=r.wrapS;t.wrapT=r.wrapT;t.anisotropy=r.anisotropy;t.generateMipmaps=r.generateMipmaps;
  t.minFilter=r.minFilter;t.magFilter=r.magFilter;t.rotation=r.rotation;t.repeat.fromArray(r.repeat);t.offset.fromArray(r.offset);
  t.name=r.name||'';t.channel=r.channel??0;if(r.center)t.center.fromArray(r.center);
  t.needsUpdate=true;if(r.bitmap)t.addEventListener('dispose',()=>r.bitmap.close());return t;
 });
 const materials=data.materials.map(r=>{
  const m=new (THREE[r.type]||THREE.MeshStandardMaterial)(r.options);
  if(r.color)m.color.fromArray(r.color);if(r.emissive)m.emissive.fromArray(r.emissive);
  if(r.normalScale)m.normalScale.fromArray(r.normalScale);
  for(const key of ['map','bumpMap','normalMap','roughnessMap','alphaMap','metalnessMap','emissiveMap','aoMap'])if(r[key]!==undefined)m[key]=textures[r[key]];
  return m;
 });
 const attribute=a=>new THREE.BufferAttribute(a.array,a.size,a.normalized);
 const geometries=data.geometries.map(r=>{
  const g=new THREE.BufferGeometry();
  for(const [k,a] of Object.entries(r.attributes))g.setAttribute(k,attribute(a));
  if(r.index)g.setIndex(attribute(r.index));for(const span of r.groups)g.addGroup(span.start,span.count,span.materialIndex);
  return g;
 });
 const group=new THREE.Group(),modern=[],historical=[];group.name=data.name;
 function registerPhase(node,phase){
  if(phase===1)modern.push(node);if(phase===2){historical.push(node);node.visible=false;}
 }
 for(const o of data.lights||[]){
  const light=new THREE.PointLight(new THREE.Color().fromArray(o.color),o.intensity,o.distance,o.decay);
  light.name=o.name;light.matrixAutoUpdate=false;light.matrix.fromArray(o.matrix);
  group.add(light);registerPhase(light,o.visibility);
 }
 for(const o of data.objects){
  const mat=o.materials.length===1?materials[o.materials[0]]:o.materials.map(i=>materials[i]);
  const geometry=geometries[o.geometry];
  const m=o.instances?new THREE.InstancedMesh(geometry,mat,0):new THREE.Mesh(geometry,mat);
  if(o.instances){
   m.instanceMatrix=new THREE.InstancedBufferAttribute(o.instances.array,16);m.count=o.count;
   if(o.territoryInstances){m.userData.territoryInstances=o.territoryInstances;m.computeBoundingSphere();}
   if(o.instanceColor)m.instanceColor=new THREE.InstancedBufferAttribute(o.instanceColor.array,3);
  }
  m.name=o.name;m.matrixAutoUpdate=false;m.matrix.fromArray(o.matrix);
  if(o.materialKind)m.userData.materialKind=o.materialKind;
  m.castShadow=o.cast;m.receiveShadow=o.receive;m.renderOrder=o.order;group.add(m);
  registerPhase(m,o.visibility);
 }
 return {group,claims:data.claims,relief:data.relief,pavement:data.pavement,publicDeck:data.publicDeck,walkBarriers:data.walkBarriers,contextStats:data.contextStats,setDensity:landscapeDetail(group),setHistorical(on){for(const m of modern)m.visible=!on;for(const m of historical)m.visible=on;}};
}

// A browser without worker canvas support can still use the source constructors.
export function heritageWorker(grids){
 if(!grids||typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined')return null;
 let worker,request=null,closed=false,timer=null;
 function stop(error){
  closed=true;clearTimeout(timer);worker?.terminate();if(request){request.reject(error);request=null;}
 }
 try{
  worker=new Worker(new URL('./territory-heritage-worker.js',import.meta.url),{type:'module'});
  worker.postMessage({grids});
 }catch{return null;}
 worker.onerror=e=>{e.preventDefault();stop(Error(e.message||'No se pudo iniciar el trabajador de patrimonio'));};
 worker.onmessage=({data})=>{
  if(!request||data.id!==request.id)return;
  clearTimeout(timer);const {resolve,reject}=request;request=null;
  if(data.error){reject(Error(data.error));return;}
  try{resolve(unpack(data));}catch(error){reject(error);}
 };
 return {get closed(){return closed;},load:id=>new Promise((resolve,reject)=>{
  if(closed||request){reject(Error('Trabajador patrimonial no disponible'));return;}
  request={resolve,reject,id};timer=setTimeout(()=>stop(Error('Tiempo de preparación patrimonial agotado')),45000);
  try{worker.postMessage({id});}catch(error){stop(error);}
 }),dispose:()=>stop(Error('Vista patrimonial cerrada'))};
}
