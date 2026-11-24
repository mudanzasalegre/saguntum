import assert from 'node:assert/strict';
import {Group,BoxGeometry,Mesh,MeshBasicMaterial} from 'three';
import {sampleHeritageBarriers,prepareWalkingBarriers} from '../dist/js/territory-collision-heritage.js';

const group=new Group(),geometry=new BoxGeometry(3,3,6,10,10,10);
const material=new MeshBasicMaterial();
for(let i=0;i<96;i++){
  const wall=new Mesh(geometry,material);
  wall.position.set(i*6,1.5,i%5);
  group.add(wall);
}
const floor=()=>0;
const reference=sampleHeritageBarriers(group,floor);
let yielded=false;
setTimeout(()=>{yielded=true;},0);
const actual=await prepareWalkingBarriers(group,floor,()=>true);
assert.ok(reference.length>0 && yielded);
assert.deepEqual(actual,reference);
assert.equal(await prepareWalkingBarriers(group,floor,()=>false),null);
console.log('Barreras peatonales idénticas, preparación interrumpible y cancelación verificadas.');
