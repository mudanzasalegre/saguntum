import * as T from 'three';
import {rendererPlan,productionNative,parityFeatures,completeParity} from './territory-backend-policy.js';
import {requestedBackend,recoveryChoice,fallbackReason,rememberFailure} from './territory-backend-session.js';
import {startingBackend} from './render-session.js';

export async function within(work,ms,label){
  let timer;
  try{return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label)),ms);})]);}
  finally{clearTimeout(timer);}
}
function profiles(mobile,textureSize,multisample,floating){
  const memory=navigator.deviceMemory,threads=navigator.hardwareConcurrency;
  const ultra=textureSize>=8192&&multisample&&floating&&(!memory||memory>=6);
  const constrained=(memory&&memory<=4)||(threads&&threads<=4)||textureSize<8192;
  const autoLimit=constrained?1:2,initial=Math.min(autoLimit,mobile||innerWidth*innerHeight*devicePixelRatio**2>5500000?1:2);
  return {ultra,initial,autoLimit};
}
export async function createTerritoryRenderer(mobile,onFailure){
  const start=performance.now(),requested=requestedBackend(),recovering=recoveryChoice();
  const info={requested,active:null,backend:null,three:T.REVISION,secure:isSecureContext,webgpuExposed:!!navigator.gpu,
    fallbackReason:recovering?(fallbackReason()||'Recuperación de WebGPU'):null,
    webgpuParity:parityFeatures.map(key=>({key,verified:productionNative.verified[key]===true}))};
  let renderer,dispose,native=null;
  if(!recovering&&requested!=='webgl2'&&(requested==='webgpu'||completeParity(productionNative))){
    const controller=new AbortController();
    let acquired=null;
    try{
      startingBackend('webgpu');
      if(!isSecureContext||!navigator.gpu)throw Error('WebGPU requiere un contexto seguro y soporte del navegador');
      const adapter=await within(navigator.gpu.requestAdapter({powerPreference:'high-performance'}),4000,'Tiempo de detección de adaptador agotado');
      if(!adapter)throw Error('No hay adaptador WebGPU disponible');
      const software=!!(adapter.info?.isFallbackAdapter||adapter.isFallbackAdapter);
      info.adapter={vendor:adapter.info?.vendor||null,architecture:adapter.info?.architecture||null,software};
      const plan=rendererPlan({request:requested,secure:true,adapter:true,software});
      if(plan.preferred!=='webgpu')throw Error(plan.reason);
      const {openDevice}=await within(import('./territory-webgpu-device.js'),8000,'Tiempo de carga del motor agotado');
      let active=false,startupError=null;
      const failed=reason=>{if(active)onFailure(reason);else startupError=Error(reason);};
      acquired=await within(openDevice(adapter,mobile,controller.signal,failed),12000,'Tiempo de inicialización o compilación agotado');
      const [materials,environment]=await within(Promise.all([import('./territory-native-materials.js'),import('./territory-node-environment.js')]),12000,'No se pudieron cargar los materiales WebGPU');
      if(startupError)throw startupError;
      native={materials:materials.nativeMaterials(acquired.renderer),environment};
      active=true;
      renderer=acquired.renderer;dispose=acquired.close;
      Object.assign(info,{backend:'WebGPU',active:'webgpu',limits:acquired.limits,format:acquired.format,probe:acquired.pixels,
        ...profiles(mobile,acquired.limits.maxTextureDimension2D,true,true)});
    }catch(error){controller.abort();acquired?.close();info.fallbackReason=String(error.message||error);rememberFailure(info.fallbackReason);}
  }
  if(!renderer){
    startingBackend('webgl2');
    if(!recovering&&requested==='auto'&&!completeParity(productionNative))info.selectionReason='WebGL 2 conserva la referencia visual del Atlas en modo automático.';
    try{renderer=new T.WebGLRenderer({antialias:!mobile,powerPreference:mobile?'default':'high-performance'});}
    catch(error){error.graphics=info;throw error;}
    const c=renderer.capabilities;
    Object.assign(info,{backend:'WebGL 2',active:'webgl2',limits:{maxTextureDimension2D:c.maxTextureSize,maxSamples:c.maxSamples},
      ...profiles(mobile,c.maxTextureSize,c.maxSamples>=4,renderer.extensions.has('EXT_color_buffer_float'))});
    dispose=()=>{renderer.dispose();renderer.forceContextLoss();};
  }
  info.initMs=Math.round(performance.now()-start);
  return {renderer,info,native,dispose};
}

export const qualityNames=['Baja','Media','Alta','Ultra'];
export function pixelRatioFor(tier,scale,mobile){
  const pixels=innerWidth*innerHeight;
  const maxPixels=(mobile?[850000,1450000,2300000,3200000]:[1500000,2600000,4400000,7200000])[tier];
  const ratio=Math.min(devicePixelRatio,[1.4,1.7,2,2.5][tier],Math.sqrt(maxPixels/pixels));
  return Math.max(.5,ratio*scale);
}
