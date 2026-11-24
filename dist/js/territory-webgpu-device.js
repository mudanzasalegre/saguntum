import * as G from 'three/webgpu';
import {vec3} from 'three/tsl';

export async function probePixels(renderer){
  const target=new G.RenderTarget(2,2,{depthBuffer:false,type:G.UnsignedByteType});
  const scene=new G.Scene(),camera=new G.OrthographicCamera(-1,1,1,-1,.1,10);
  const geometry=new G.PlaneGeometry(2,2),material=new G.MeshBasicNodeMaterial({toneMapped:false});
  material.colorNode=vec3(.15,.65,.25);scene.add(new G.Mesh(geometry,material));camera.position.z=2;
  const previous=renderer.getRenderTarget();
  try{
    renderer.setRenderTarget(target);
    renderer.render(scene,camera);
    const pixels=await renderer.readRenderTargetPixelsAsync(target,0,0,2,2);
    if(!pixels||pixels[1]<pixels[0]+12||pixels[1]<pixels[2]+12)throw Error('La prueba de color TSL no produjo el resultado esperado ('+Array.from(pixels?.slice(0,4)||[]).join(',')+').');
    return Array.from(pixels.slice(0,4));
  }finally{renderer.setRenderTarget(previous);target.dispose();geometry.dispose();material.dispose();}
}
export async function openDevice(adapter,mobile,signal,onFailure){
  let device,renderer,closed=false;
  const close=()=>{
    if(closed)return;closed=true;
    if(renderer){renderer.onDeviceLost=()=>{};try{renderer.dispose();}catch{}}
    device?.destroy();
  };
  signal.addEventListener('abort',close,{once:true});
  try{
    const features=['float32-filterable','rg11b10ufloat-renderable','texture-compression-bc','texture-compression-etc2','texture-compression-astc','indirect-first-instance','shader-f16','bgra8unorm-storage'].filter(k=>adapter.features.has(k));
    device=await adapter.requestDevice({requiredFeatures:features});
    if(closed||signal.aborted){device.destroy();throw Error('Inicialización de WebGPU cancelada');}
    const limits=device.limits;
    if(limits.maxTextureDimension2D<2048||limits.maxColorAttachments<2)throw Error('Límites insuficientes para las capas territoriales');
    const canvas=document.createElement('canvas'),context=canvas.getContext('webgpu');
    if(!context)throw Error('No se obtuvo contexto WebGPU');
    renderer=new G.WebGPURenderer({canvas,context,device,antialias:!mobile,alpha:true});
    renderer.onDeviceLost=info=>{if(!closed)onFailure(info.message||'Dispositivo WebGPU perdido');};
    await renderer.init();
    if(!renderer.backend.isWebGPUBackend)throw Error('El renderizador no inicializó WebGPU nativo');
    renderer.setSize(4,4,false);
    device.pushErrorScope('validation');
    let pixels;
    try{pixels=await probePixels(renderer);}finally{const error=await device.popErrorScope();if(error)throw Error(error.message);}
    if(closed||signal.aborted)throw Error('Prueba de WebGPU interrumpida');
    device.addEventListener('uncapturederror',event=>{
      if(closed)return;event.preventDefault();onFailure(event.error?.message||'Error en un material WebGPU');
    });
    return {renderer,close,pixels,limits:{maxTextureDimension2D:limits.maxTextureDimension2D,maxBufferSize:limits.maxBufferSize,maxStorageBufferBindingSize:limits.maxStorageBufferBindingSize,maxColorAttachments:limits.maxColorAttachments},format:navigator.gpu.getPreferredCanvasFormat()};
  }catch(error){close();throw error;}
}
