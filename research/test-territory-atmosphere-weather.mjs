// Run with: node --loader ./research/validate_loader.mjs research/test-territory-atmosphere-weather.mjs
// Controller/material-graph checks against the shipped Three r180 modules.
// This harness does not create a GPU or claim GLSL/WGSL driver validation.
import assert from 'node:assert/strict';
import * as T from 'three';
import * as nativeEnvironment from '../dist/js/territory-node-environment.js';
import {createAtmosphere} from '../dist/js/territory-atmosphere.js';
import {weatherLightPlan} from '../dist/js/territory-render-policy.js';
import {realismUniforms,setTerritoryWeather,weatherPresets} from '../dist/js/territory-realism.js';

for(let elevation=-1;elevation<=1;elevation+=.025){
 for(const weather of Object.values(weatherPresets)){
  const plan=weatherLightPlan({elevation,...weather});
  assert.ok(Object.values(plan).every(Number.isFinite));
  assert.ok(plan.night>=0&&plan.night<=1&&plan.daylight>=0&&plan.daylight<=1);
  assert.ok(plan.sunIntensity>=0&&plan.fogDensity>0&&plan.fogDensity<.0003);
  if(elevation<0)assert.equal(plan.sunIntensity,0);
 }
}
const invalid=weatherLightPlan({elevation:NaN,cloudiness:Infinity,haze:-3});
assert.ok(Object.values(invalid).every(Number.isFinite));
const clear=weatherLightPlan({elevation:.7,...weatherPresets.clear});
const overcast=weatherLightPlan({elevation:.7,...weatherPresets.overcast});
assert.ok(overcast.sunIntensity<clear.sunIntensity*.3);
assert.ok(overcast.ambientIntensity>clear.ambientIntensity);
assert.ok(overcast.fogDensity>clear.fogDensity);
assert.ok(overcast.shadowOpacity<clear.shadowOpacity);
assert.equal(weatherLightPlan({elevation:-.7}).night,1);
assert.equal(weatherLightPlan({elevation:.7}).night,0);

const originalLoad=T.TextureLoader.prototype.load;
const originalPerformance=globalThis.performance;
let clock=1000;
Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>clock}});
T.TextureLoader.prototype.load=function(url,onLoad){
 const texture=new T.Texture();queueMicrotask(()=>onLoad?.(texture));return texture;
};
try{
 for(const native of [false,true]){
  let probes=0,freedProbes=0,skyUniforms=null;
  const environment=native?{...nativeEnvironment,
   createSkyMaterial(uniforms){skyUniforms=uniforms;return nativeEnvironment.createSkyMaterial(uniforms);},
   createProbe(){return {fromScene(){probes++;return {texture:new T.Texture(),dispose(){freedProbes++;}};},dispose(){}};}
  }:null;
  const renderer={shadowMap:{},capabilities:{maxTextureSize:4096},extensions:{has:()=>false},toneMappingExposure:1};
  const sea={visibility:1,light:null,atlas:null,setReflectionSky(){},
   setSun(direction,light){this.light=light;this.direction=direction.clone();},
   setSunVisibility(value){this.visibility=value;},setAtlasLight(value){this.atlas=value;}};
  const buildings={night:{value:0},shadowRevision:0},network={night:0,shadowRevision:0,setNight(value){this.night=value;}};
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,1.6,.15,60000);
  camera.position.set(50,15,50);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const savedCamera=camera.matrixWorld.toArray(),focus=new T.Vector3();
  const atmosphere=createAtmosphere(scene,renderer,sea,buildings,network,{a:1,b:0,c:0,d:1},environment);
  const sun=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);
  setTerritoryWeather('clear');atmosphere.setHour(12,'2026-06-21');
  await Promise.resolve();clock+=300;atmosphere.update(camera,focus,35,2);
  const sunBefore=sun.intensity,fogBefore=scene.fog.density;
  assert.ok(sunBefore>0&&scene.environmentIntensity>0);
  assert.equal(network.night,realismUniforms.night.value);
  if(native){
   assert.equal(probes,1);assert.ok(skyUniforms.cloudiness.isUniformNode);
   assert.ok(scene.environment?.isTexture);
  }
  setTerritoryWeather('overcast');atmosphere.refreshWeather();
  clock+=300;atmosphere.update(camera,focus,35,2);
  assert.ok(sun.intensity<sunBefore*.3);
  assert.ok(scene.fog.density>fogBefore);
  assert.ok(sea.visibility<.3&&sea.visibility>0);
  assert.ok(sun.shadow.intensity>0&&sun.shadow.intensity<.5);
  assert.deepEqual(camera.matrixWorld.toArray(),savedCamera);
  if(native){
   assert.equal(skyUniforms.cloudiness.value,weatherPresets.overcast.cloudiness);
   assert.equal(skyUniforms.haze.value,weatherPresets.overcast.haze);
   assert.equal(probes,2);assert.equal(freedProbes,1);
   for(let i=0;i<30;i++){clock+=16;atmosphere.update(camera,focus,35,2);}
   assert.equal(probes,2,'Stable weather must not rebuild radiance every frame');
  }
  atmosphere.setHour(23,'2026-06-21');
  assert.equal(sun.intensity,0);assert.equal(network.night,1);assert.equal(realismUniforms.night.value,1);
  setTerritoryWeather('after-rain');atmosphere.refreshWeather();
  assert.equal(network.night,1,'Changing weather must preserve the current solar hour');
  atmosphere.atlas('golden');
  const atlasIntensity=sun.intensity,atlasExposure=renderer.toneMappingExposure;
  assert.equal(network.night,0);assert.equal(sea.visibility,1);assert.equal(scene.environment,null);
  setTerritoryWeather('clear');atmosphere.refreshWeather();
  assert.equal(sun.intensity,atlasIntensity);assert.equal(renderer.toneMappingExposure,atlasExposure);
  assert.equal(sea.atlas,'golden');
  atmosphere.dispose();
  if(native)assert.equal(freedProbes,probes);
 }
}finally{
 T.TextureLoader.prototype.load=originalLoad;
 Object.defineProperty(globalThis,'performance',{configurable:true,value:originalPerformance});
 setTerritoryWeather('clear');realismUniforms.night.value=0;
}
console.log('OK: weather bounds, solar/night continuity, Atlas preservation, native sky uniform graph and bounded radiance refresh (no GPU).');
