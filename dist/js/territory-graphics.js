import * as T from 'three';

// Water.onBeforeRender uses the WebGL render target API. The buildings, ground
// and original Atlas materials also depend on GLSL chunks and onBeforeCompile.
// Check these requirements before creating a canvas context or a scene.
const requirements=[
  {name:'reflexión costera Water',backends:['webgl2']},
  {name:'materiales GLSL del Atlas',backends:['webgl2']},
  {name:'cortes de terreno y ortofoto',backends:['webgl2']}
];
export function createTerritoryRenderer(mobile){
  const backend=['webgpu','webgl2'].find(id=>
    (id!=='webgpu'||navigator.gpu)&&requirements.every(effect=>effect.backends.includes(id)));
  if(backend!=='webgl2')throw Error('El motor disponible no cubre los materiales del territorio.');
  const renderer=new T.WebGLRenderer({antialias:!mobile,powerPreference:mobile?'default':'high-performance'});
  const caps=renderer.capabilities;
  const memory=navigator.deviceMemory,threads=navigator.hardwareConcurrency;
  const floating=renderer.extensions.has('EXT_color_buffer_float');
  const ultra=caps.maxTextureSize>=8192&&caps.maxSamples>=4&&floating&&(!memory||memory>=6);
  const constrained=(memory&&memory<=4)||(threads&&threads<=4)||caps.maxTextureSize<8192;
  const autoLimit=constrained?1:2;
  const initial=Math.min(autoLimit,mobile||innerWidth*innerHeight*devicePixelRatio**2>5500000?1:2);
  const info={backend:'WebGL 2',three:T.REVISION,webgpuExposed:!!navigator.gpu,
    webgpuIncompatible:requirements.filter(r=>!r.backends.includes('webgpu')).map(r=>r.name),ultra,autoLimit,initial};
  return {renderer,info};
}

export const qualityNames=['Baja','Media','Alta','Ultra'];
export function pixelRatioFor(tier,scale,mobile){
  const pixels=innerWidth*innerHeight;
  const maxPixels=(mobile?[850000,1450000,2300000,3200000]:[1500000,2600000,4400000,7200000])[tier];
  const ratio=Math.min(devicePixelRatio,[1.4,1.7,2,2.5][tier],Math.sqrt(maxPixels/pixels));
  return Math.max(.5,ratio*scale);
}
