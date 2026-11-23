// Bundle this entry with research/build-territory-heritage.mjs. Three's
// mathematical core is an external ES module shared with the application.
import {project} from './territory-coordinates.js';
import {makeSampler} from './territory-ground.js';
import {loadHeritageCatalog} from './territory-heritage-catalog.js';
import {buildHeritageModel,releaseModel} from './territory-heritage-models.js';

self.document={createElement(type){
 if(type==='canvas')return new OffscreenCanvas(1,1);
 throw Error('Elemento no disponible en el trabajador: '+type);
}};
let inventory,heightAt;
const props=['name','metalness','roughness','envMapIntensity','clearcoat','clearcoatRoughness','ior','normalMapType','emissiveIntensity','bumpScale','opacity','transparent','alphaTest','side','vertexColors','flatShading','depthTest','depthWrite','polygonOffset','polygonOffsetFactor','polygonOffsetUnits','toneMapped','colorWrite','blending','fog'];
async function pack(model){
 const geometries=[],materials=[],textures=[],objects=[],lights=[],transfer=new Set();
 const geometryIds=new Map(),materialIds=new Map(),textureIds=new Map();
 function attribute(a){
  if(a.isInterleavedBufferAttribute)throw Error('Buffer intercalado de patrimonio no compatible');
  transfer.add(a.array.buffer);
  return {array:a.array,size:a.itemSize,normalized:a.normalized};
 }
 function geometry(g){
  if(geometryIds.has(g))return geometryIds.get(g);
  const i=geometries.length;geometryIds.set(g,i);
  geometries.push({attributes:Object.fromEntries(Object.entries(g.attributes).map(([k,v])=>[k,attribute(v)])),index:g.index&&attribute(g.index),groups:g.groups});
  return i;
 }
 async function texture(t){
  if(textureIds.has(t))return textureIds.get(t);
  const i=textures.length;textureIds.set(t,i);
  const entry={name:t.name,channel:t.channel,center:t.center.toArray(),colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,magFilter:t.magFilter,minFilter:t.minFilter,repeat:t.repeat.toArray(),offset:t.offset.toArray(),rotation:t.rotation,anisotropy:t.anisotropy,generateMipmaps:t.generateMipmaps};
  if(t.isDataTexture){
   Object.assign(entry,t.image,{type:t.type,format:t.format,flipY:t.flipY});
   transfer.add(entry.data.buffer);
  }else{
   entry.bitmap=await createImageBitmap(t.image,{imageOrientation:t.flipY?'flipY':'from-image',premultiplyAlpha:'none',colorSpaceConversion:'none'});
   transfer.add(entry.bitmap);
  }
  textures.push(entry);
  return i;
 }
 async function material(m){
  if(materialIds.has(m))return materialIds.get(m);
  const i=materials.length;materialIds.set(m,i);
  const data={type:m.type,options:Object.fromEntries(props.filter(k=>m[k]!==undefined).map(k=>[k,m[k]])),color:m.color?.toArray(),emissive:m.emissive?.toArray()};
  data.normalScale=m.normalScale?.toArray();
  for(const key of ['map','bumpMap','normalMap','roughnessMap','alphaMap','metalnessMap','emissiveMap','aoMap'])if(m[key])data[key]=await texture(m[key]);
  materials.push(data);return i;
 }
 // Carry both supported historical phases, including their authored lighting.
 const visible=new Map();
 for(const [flag,historical] of [[1,false],[2,true]]){
  model.setHistorical(historical);
  model.group.updateMatrixWorld(true);
  model.group.traverseVisible(o=>{if(o.isMesh||o.isPointLight)visible.set(o,(visible.get(o)||0)|flag);});
 }
 for(const [o,visibility] of visible){
  if(o.isPointLight){
   lights.push({name:o.name,visibility,matrix:o.matrixWorld.toArray(),color:o.color.toArray(),intensity:o.intensity,distance:o.distance,decay:o.decay});
   continue;
  }
  const ids=[];
  for(const m of Array.isArray(o.material)?o.material:[o.material])ids.push(await material(m));
  const item={name:o.name,materialKind:o.userData.materialKind,visibility,geometry:geometry(o.geometry),materials:ids,matrix:o.matrixWorld.toArray(),cast:o.castShadow,receive:o.receiveShadow,order:o.renderOrder};
  if(o.isInstancedMesh){
   item.count=o.count;item.instances=attribute(o.instanceMatrix);
   item.territoryInstances=o.userData.territoryInstances;
   if(o.instanceColor)item.instanceColor=attribute(o.instanceColor);
  }
  objects.push(item);
 }
 if(model.relief.delta)transfer.add(model.relief.delta.buffer);
 if(model.pavement)transfer.add(model.pavement.heights.buffer);
 if(model.walkBarriers)transfer.add(model.walkBarriers.buffer);
 if(model.publicDeck)transfer.add(model.publicDeck.heights.buffer);
 return {payload:{name:model.group.name,objects,geometries,materials,textures,lights,claims:model.claims,relief:model.relief,pavement:model.pavement,publicDeck:model.publicDeck,walkBarriers:model.walkBarriers,contextStats:model.contextStats},transfer:[...transfer]};
}

self.onmessage=async({data})=>{
 try{
  if(data.grids){heightAt=makeSampler(data.grids);return;}
  if(!inventory)inventory=loadHeritageCatalog(project);
  const model=await buildHeritageModel(data.id,{...await inventory,project,heightAt,needed:()=>true});
  try{const result=await pack(model);self.postMessage({id:data.id,...result.payload},result.transfer);}
  finally{releaseModel(model.group);}
 }catch(error){self.postMessage({id:data.id,error:String(error.message||error)});}
};
