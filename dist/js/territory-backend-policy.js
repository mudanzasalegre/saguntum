// The presence of navigator.gpu alone is not evidence of a working renderer.
export const parityFeatures=Object.freeze([
 'terrain-orthophoto','building-pbr','street-pbr','heritage-originals',
 'heritage-masks-sections','water-planar-reflection','coastal-foam','sky-probe',
 'vegetation-instances','contact-occlusion','lighting-night','resource-lifecycle','distance-atmosphere','mobile-native'
]);
// Promotion requires per-feature browser evidence plus a complete native entry.
// Browser evidence and comparison cameras are in research/render-v4 and dual-v4.
// Keep automatic promotion closed until native mobile and extended use are validated.
export const productionNative=Object.freeze({entry:true,verified:Object.freeze({
 'terrain-orthophoto':true,'building-pbr':true,'street-pbr':true,
 'heritage-masks-sections':true,'water-planar-reflection':true,'coastal-foam':true,
 'sky-probe':true,'vegetation-instances':true,'contact-occlusion':true,'lighting-night':true
})});
export function completeParity(candidate){
 return candidate?.entry===true&&parityFeatures.every(key=>candidate.verified?.[key]===true);
}
export function rendererPlan({request='auto',secure=false,adapter=false,software=false,scope='production',candidate=productionNative}={}){
 const capable=secure&&adapter&&!software;
 const parity=scope==='lab'||completeParity(candidate);
 const selected=request==='webgpu'&&candidate.entry===true;
 const native=capable&&(parity||selected)&&request!=='webgl2';
 const reason=request==='webgl2'?'WebGL 2 seleccionado':!secure?'Se requiere HTTPS o localhost':!adapter?'Adaptador WebGPU no comprobado':software?'Adaptador de respaldo por software':!parity&&!selected?'Selección automática en WebGL 2 hasta validar la paridad visual':'WebGPU candidato';
 return {preferred:native?'webgpu':'webgl2',candidates:native?['webgpu','webgl2']:['webgl2'],reason,parity,capable};
}
// Only inspect the adapter in the full simulator. Do not allocate a second
// GPU device next to the production WebGL context.
export async function inspectAdapter(gpu=globalThis.navigator?.gpu,secure=globalThis.isSecureContext,timeout=4000){
 if(!secure||!gpu)return {available:false,secure:!!secure,exposed:!!gpu,reason:!secure?'Contexto no seguro':'API no expuesta'};
 let timer;
 try{
  const adapter=await Promise.race([gpu.requestAdapter({powerPreference:'high-performance'}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Tiempo de detección agotado')),timeout);})]);
  if(!adapter)return {available:false,secure:true,exposed:true,reason:'Sin adaptador'};
  const software=adapter.info?.isFallbackAdapter===true||adapter.isFallbackAdapter===true;
  return {available:true,secure:true,exposed:true,software,limits:{maxTextureDimension2D:adapter.limits?.maxTextureDimension2D??null,maxBufferSize:adapter.limits?.maxBufferSize??null},reason:software?'Adaptador de respaldo':'Adaptador disponible; falta probar el render'};
 }catch(error){return {available:false,secure:true,exposed:true,reason:String(error.message||error)};}finally{clearTimeout(timer);}
}
