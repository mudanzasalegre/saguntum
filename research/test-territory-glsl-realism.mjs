import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as T from 'three';

// Offline GLSL compiler check. No browser, application screenshot or GPU
// performance claim. Use the vendored r180 WebGLProgram verbatim to assemble
// prefixes, light-count substitutions, includes and unrolled shader loops.
// Run with the same validate_loader.mjs as the architectural realism test.
globalThis.matchMedia=()=>({matches:false});
T.TextureLoader.prototype.load=function(url,onLoad){
  const texture=new T.Texture({width:1,height:1});queueMicrotask(()=>onLoad?.(texture));return texture;
};
const {architecturalMaterial}=await import('../dist/js/territory-building-material.js');
const {nearFacades}=await import('../dist/js/territory-facades.js');
const {streetMaterial}=await import('../dist/js/territory-street-surfaces.js');
const {territorySky}=await import('../dist/js/territory-sky.js');
const {contactRenderer}=await import('../dist/js/territory-contact.js');

const threeSource=readFileSync(new URL('../dist/assets/vendor/three.module.js',import.meta.url),'utf8');
const first=threeSource.indexOf('function WebGLShader( '),last=threeSource.indexOf('\nlet _id = 0;',first);
assert(first>=0&&last>first,'Expected r180 WebGLProgram source layout');
const WebGLProgram=new Function(...Object.keys(T),threeSource.slice(first,last)+'\nreturn WebGLProgram;')(...Object.values(T));
const base={precision:'highp',shaderType:'MeshStandardMaterial',shaderName:'TerritoryOfflineCheck',
  defines:{},isRawShaderMaterial:false,flatShading:false,doubleSided:true,opaque:true,
  useFog:true,fog:true,fogExp2:true,envMap:true,envMapMode:T.CubeUVReflectionMapping,envMapCubeUVHeight:256,
  combine:T.MultiplyOperation,shadowMapEnabled:true,shadowMapType:T.PCFSoftShadowMap,
  outputColorSpace:T.SRGBColorSpace,toneMapping:T.ACESFilmicToneMapping,
  numDirLights:1,numSpotLights:6,numHemiLights:1,numPointLights:0,numRectAreaLights:0,
  numDirLightShadows:1,numSpotLightShadows:0,numSpotLightMaps:0,numSpotLightShadowsWithMaps:0,numPointLightShadows:0,
  numClippingPlanes:0,numClipIntersection:0,rendererExtensionParallelShaderCompile:false};
function expand(material,options={}){
  const original=material.isShaderMaterial?material:T.ShaderLib.standard;
  const shader={uniforms:{},vertexShader:original.vertexShader,fragmentShader:original.fragmentShader};
  if(!material.isShaderMaterial)material.onBeforeCompile(shader);
  const gl={VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,createProgram:()=>({}),createShader:type=>({type}),
    shaderSource(shader,source){shader.source=source;},compileShader(){},attachShader(){},linkProgram(){},bindAttribLocation(){}};
  const program=new WebGLProgram({getContext:()=>gl},'',{...base,...options,...shader,defines:material.defines||{}},{});
  return {vertex:program.vertexShader.source,fragment:program.fragmentShader.source};
}

const group=new T.Group();nearFacades(group);
const facade=group.children.find(object=>object.isInstancedMesh).material;
const architecture=architecturalMaterial({value:0}),street=streetMaterial();
const variants=[];
for(const [name,material,options] of [
  ['architecture',architecture,{vertexColors:true}],
  ['facade-detail',facade,{instancing:true,instancingColor:true}],
  ['street',street,{}]
]){
  variants.push({name:name+'-lit-shadow-fog-pmrem',...expand(material,options)});
  variants.push({name:name+'-contact-linear-target',...expand(material,{...options,toneMapping:T.NoToneMapping,outputColorSpace:T.LinearSRGBColorSpace})});
}
const scene=new T.Scene();
const sky=territorySky({extensions:{has:()=>false}},scene,new T.Vector3(1,1,0).normalize(),new T.Color('#9caac3'),new T.Color('#527d99'));
const skyMaterial=scene.children.find(object=>object.material?.isShaderMaterial).material;
variants.push({name:'weather-sky-aces-srgb',...expand(skyMaterial,{envMap:false,envMapCubeUVHeight:null,fog:false,shadowMapEnabled:false,shaderType:'ShaderMaterial'})});
variants.push({name:'weather-sky-linear-pmrem-probe',...expand(skyMaterial,{envMap:false,envMapCubeUVHeight:null,fog:false,shadowMapEnabled:false,shaderType:'ShaderMaterial',toneMapping:T.NoToneMapping,outputColorSpace:T.LinearSRGBColorSpace})});

let target=null,contactMaterial;
const capture={extensions:{has:()=>true},capabilities:{maxSamples:4},getDrawingBufferSize:v=>v.set(128,128),
  getRenderTarget:()=>target,setRenderTarget:value=>{target=value;},render(scene){
    contactMaterial=scene.children.find(o=>o.material?.isShaderMaterial)?.material||contactMaterial;
  }};
const contact=contactRenderer(capture);
contact(new T.Scene(),new T.PerspectiveCamera(),true,1);
assert(contactMaterial,'Expected real postprocess ShaderMaterial');
variants.push({name:'contact-final-aces-srgb',...expand(contactMaterial,{envMap:false,envMapCubeUVHeight:null,fog:false,shadowMapEnabled:false,shaderType:'ShaderMaterial'})});
const checker=fileURLToPath(new URL('./compile-territory-glsl-egl.py',import.meta.url));
const result=spawnSync('python',[checker],{input:JSON.stringify(variants),encoding:'utf8',maxBuffer:1024*1024});
if(result.error)throw result.error;
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
assert.equal(result.status,0,'Offline GLSL driver compilation/linking failed');
contact.dispose();sky.dispose();architecture.dispose();facade.dispose();street.dispose();
