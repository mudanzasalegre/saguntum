import assert from 'node:assert/strict';
import {Group,PointLight,Scene,Vector3} from 'three';
import {heritageLights} from '../dist/js/territory-heritage-lights.js';

// Compare the attributes Three uses for standard point-light attenuation.
// The sources remain in transformed heritage scenes throughout the test.
const scene=new Scene(),building=new Group();
building.position.set(9842,14,2047);building.rotation.y=.73;scene.add(building);
const visits=Array.from({length:8},(_,i)=>{
  const light=new PointLight(0xffdab1,22+i,18+i,1.7+i*.04);
  light.position.set(i*2-3,4+i,-10+i);building.add(light);
  return {light,distance:i};
});
scene.updateMatrixWorld(true);
const lights=heritageLights(scene),group=scene.getObjectByName('Iluminación patrimonial');
const initial=group.children.map(light=>light.uuid);
for(const count of [0,2,1,4,8,3,1,0]){
  lights.select(visits.slice(0,count));
  const drawn=group.children.filter(light=>light.visible);
  assert.equal(drawn.length,count>4?8:count>2?4:2);
  assert.deepEqual(drawn.slice(0,2).map(light=>light.uuid),initial);
  for(let i=0;i<drawn.length;i++){
    const slot=drawn[i];
    if(i>=count){assert.equal(slot.intensity,0);continue;}
    const source=visits[i].light;
    assert.deepEqual(slot.position,source.getWorldPosition(new Vector3()));
    assert.deepEqual(slot.color,source.color);
    assert.equal(slot.intensity,source.intensity);
    assert.equal(slot.distance,source.distance);
    assert.equal(slot.decay,source.decay);
  }
}
lights.dispose();assert.ok(!scene.getObjectByName('Iluminación patrimonial'));
console.log('Luminarias patrimoniales verificadas en grupos de 2, 4 y 8.');
