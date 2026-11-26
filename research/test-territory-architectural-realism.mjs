import assert from 'node:assert/strict';
import * as T from 'three';
import {WebGPURenderer} from 'three/webgpu';
import {lights} from 'three/tsl';

// Run with: node --no-warnings --experimental-loader ./research/validate_loader.mjs research/test-territory-architectural-realism.mjs
// This checks the actual r180 material hooks and TSL -> WGSL assembly. It does
// not create a GPU context or claim browser shader compilation/pixel parity.
globalThis.matchMedia=()=>({matches:false});
const originalLoad=T.TextureLoader.prototype.load;
T.TextureLoader.prototype.load=function(url,onLoad){
  const texture=new T.Texture({width:1,height:1});
  queueMicrotask(()=>onLoad?.(texture));return texture;
};

const {architecturalMaterial}=await import('../dist/js/territory-building-material.js');
const {nearFacades}=await import('../dist/js/territory-facades.js');
const {buildingNodes,detailNodes}=await import('../dist/js/territory-node-urban-architecture.js');
const {realismUniforms,setTerritoryWeather}=await import('../dist/js/territory-realism.js');
const wetness=realismUniforms.wetness,night={value:0};

const main=architecturalMaterial(night),group=new T.Group();
nearFacades(group);
const details=group.children.find(object=>object.isInstancedMesh);
details.count=1;details.setColorAt(0,new T.Color('#b9b8ac'));
function shaderHook(material){
  const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
  material.onBeforeCompile(shader);
  assert(shader.fragmentShader.includes('void main() {'));
  const expand=source=>source.replace(/#include <([^>]+)>/g,(_,key)=>{
    assert.ok(Object.hasOwn(T.ShaderChunk,key),'Missing Three shader chunk: '+key);
    return expand(T.ShaderChunk[key]);
  });
  assert.ok(expand(shader.vertexShader).length>1000);
  assert.ok(expand(shader.fragmentShader).length>1000);
  return shader;
}
const facadeShader=shaderHook(main),detailShader=shaderHook(details.material);
assert.equal(facadeShader.uniforms.uFacadeWetness,wetness);
assert.equal(detailShader.uniforms.uDetailWetness,wetness);
assert.ok(facadeShader.fragmentShader.indexOf('joineryCover=clamp(trim.a')<facadeShader.fragmentShader.indexOf('float dampWall='));
assert.ok(detailShader.fragmentShader.includes('normal=normalize(normal+(tangent*partNormal.x'));

const renderer=new WebGPURenderer({canvas:{width:128,height:128,style:{},addEventListener(){},removeEventListener(){}}});
// No GPU feature is assumed for this source-generation-only check.
renderer.hasFeature=()=>false;
const geometry=new T.BoxGeometry();
for(const [name,size] of [['archData',4],['archMetric',4],['color',3]])
  geometry.setAttribute(name,new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*size),size));
function buildWGSL(mesh){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera();scene.add(mesh);
  const builder=renderer.backend.createNodeBuilder(mesh,renderer);
  builder.scene=scene;builder.camera=camera;
  builder.lightsNode=lights([new T.HemisphereLight(0xcad8e8,0x827366,.8),new T.DirectionalLight(0xfff2de,2.2)]);
  builder.build();
  assert.ok(builder.vertexShader.includes('@vertex'));
  assert.ok(builder.fragmentShader.includes('@fragment'));
  return builder.fragmentShader;
}
const facadeNode=buildingNodes(main,{night});
const buildingWGSL=buildWGSL(new T.Mesh(geometry,facadeNode));
assert.ok(buildingWGSL.includes('fn cadastralFacade'));
assert.ok(buildingWGSL.includes('wetness:f32')||buildingWGSL.includes('wetness: f32'));
assert.ok(buildingWGSL.includes('joineryCover'));
const detailNode=detailNodes(details.material);
details.material=detailNode;
const detailWGSL=buildWGSL(details);
assert.ok(detailWGSL.includes('fn facadeDetailRelief'));

const cacheKey=main.customProgramCacheKey();
setTerritoryWeather('after-rain');
assert.equal(facadeShader.uniforms.uFacadeWetness.value,.82);
assert.equal(detailShader.uniforms.uDetailWetness.value,.82);
assert.equal(main.customProgramCacheKey(),cacheKey,'Weather must not recompile the material');
setTerritoryWeather('clear');
assert.equal(wetness.value,0);
assert.equal(realismUniforms.wetness,wetness);

T.TextureLoader.prototype.load=originalLoad;
main.dispose();geometry.dispose();details.geometry.dispose();detailNode.dispose();facadeNode.dispose();
console.log(JSON.stringify({glslHooks:2,wgslMaterials:2,buildingWGSLBytes:buildingWGSL.length,detailWGSLBytes:detailWGSL.length,liveWetness:true,gpuCompilation:false}));
