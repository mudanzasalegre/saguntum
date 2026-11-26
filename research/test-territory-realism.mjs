// Actual scene objects and policy tests; this file does not claim GPU rendering.
// node --no-warnings --loader ./research/validate_loader.mjs research/test-territory-realism.mjs
import assert from 'node:assert/strict';
import {Scene} from 'three';
import {weatherPresets,weatherState,realismUniforms,setTerritoryWeather} from '../dist/js/territory-realism.js';
import {selectStreetLights,territoryStreetLights} from '../dist/js/territory-light-pool.js';
import {solarPreset,solarDirection} from '../dist/js/territory-solar.js';

const originalUniforms={...realismUniforms};
for(const date of ['2026-03-21','2026-06-21','2026-09-21','2026-12-21']){
  const blue=solarPreset('blue',date);
  assert.ok(blue>solarPreset('sunset',date));
  assert.ok(solarDirection(blue,date)[1]<0);
  assert.ok(blue>=0&&blue<=23.75);
}
for(const key of Object.keys(weatherPresets)){
  const state=setTerritoryWeather(key);
  assert.equal(state.preset,key);
  for(const name of ['wetness','cloudiness','haze']){
    assert.equal(realismUniforms[name],originalUniforms[name]);
    assert.equal(realismUniforms[name].value,state[name]);
    assert.ok(state[name]>=0&&state[name]<=1);
  }
}
assert.equal(weatherState('__proto__').preset,'clear');
assert.equal(weatherState('invalid').preset,'clear');
assert.equal(weatherState('after-rain',NaN).wetness,.82);
assert.equal(weatherState('after-rain',null).wetness,.82);
assert.equal(weatherState('after-rain',-.5).wetness,0);
assert.equal(weatherState('after-rain',5).wetness,1);
const sky=[realismUniforms.cloudiness.value,realismUniforms.haze.value];
setTerritoryWeather('after-rain',.30);
assert.deepEqual([realismUniforms.cloudiness.value,realismUniforms.haze.value],sky);

const lamps=Array.from({length:9},(_,i)=>({key:String(i),x:i*8,z:0,y:15.125,ground:10,baseX:i*8-.66,baseZ:0}));
const options={x:0,z:0,range:8,budget:2,night:1};
assert.equal(selectStreetLights(lamps,options).length,4);
assert.equal(selectStreetLights(lamps,{...options,compact:true}).length,2);
assert.equal(selectStreetLights(lamps,{...options,budget:0}).length,1);
for(const extra of [{night:0},{enabled:false},{range:126},{x:NaN}])assert.deepEqual(selectStreetLights(lamps,{...options,...extra}),[]);
assert.deepEqual(selectStreetLights(lamps,{...options,blocked:()=>true}),[]);
assert.equal(selectStreetLights([lamps[0],lamps[0],{x:NaN,y:3,z:0}],options).length,1);
assert.ok(selectStreetLights(lamps,{...options,x:75}).every(row=>row.distance<76&&row.weight>0&&row.weight<=1));
assert.equal(selectStreetLights(lamps,{...options,x:13,retained:new Set(['2'])})[0].key,'2');
const visible=selectStreetLights(lamps,{...options,blocked:(x,z)=>x<20});
assert.ok(visible.every(row=>row.baseX>=20));

for(const compact of [false,true]){
  const scene=new Scene(),pool=territoryStreetLights(scene,{compact});
  const group=scene.getObjectByName('Luz de las farolas próximas');
  const slots=group.children.filter(o=>o.isSpotLight),ids=slots.map(o=>o.uuid);
  assert.equal(slots.length,compact?2:4);
  assert.ok(slots.every(light=>!light.castShadow&&light.intensity===0&&light.visible));
  pool.update(lamps,options);pool.animate(.1);
  assert.equal(pool.stats.active,compact?2:4);
  assert.ok(slots.every(light=>Number.isFinite(light.intensity)&&light.intensity>=0&&light.intensity<=260));
  const first=slots.find(light=>light.position.x===0);
  assert.equal(first.position.y,15.125);assert.equal(first.target.position.y,10);
  const oldPositions=slots.map(light=>light.position.clone());
  pool.update(lamps,{...options,x:4});pool.animate(.1);
  assert.deepEqual(slots.map(light=>light.uuid),ids);
  assert.deepEqual(slots.map(light=>light.position),oldPositions);
  pool.update(lamps,{...options,enabled:false});
  for(let i=0;i<20;i++)pool.animate(.1);
  assert.equal(pool.stats.active,0);
  assert.ok(slots.every(light=>light.intensity===0));
  assert.equal(group.children.filter(o=>o.isSpotLight).length,slots.length);
  pool.dispose();pool.dispose();assert.equal(scene.children.length,0);
}
setTerritoryWeather('clear');
console.log('OK: weather persistence values/uniform identity, mapped-lamp selection, budgets, stable light slots, fades and disposal');
