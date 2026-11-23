import assert from 'node:assert/strict';
import {BoxGeometry,Group,Mesh} from '../dist/assets/vendor/three.core.js';
import {footprintGrid,nearCell,touchesFootprint} from '../dist/js/territory-collision.js';
import {sampleHeritageBarriers,createHeritageCollision} from '../dist/js/territory-collision-heritage.js';
import {carsOverlap,drivingSpeed,nearestOnPaths,routePose,touchesCar,turnChoices} from '../dist/js/territory-traffic.js';

const rings=[[[0,0],[12,0],[12,12],[0,12]],[[3,3],[3,9],[9,9],[9,3]]];
assert(touchesFootprint(-.2,6,.32,rings));  // capsule reaches the façade from the street
assert(!touchesFootprint(-.34,6,.32,rings));
assert(touchesFootprint(3.1,6,.32,rings)); // inside the courtyard but too close to its wall
assert(!touchesFootprint(6,6,.32,rings));
const grid=footprintGrid([{bounds:[16,0,19,9]}]);
assert(nearCell(grid,15.8,5,.32,()=>true)); // footprint indexed in the adjoining bucket

const group=new Group();
// Two jambs, one lintel, an overhead beam and one wide stair tread.
for(const [x,y,z,w,h,d] of [[-1.5,1,0,1,2,.6],[1.5,1,0,1,2,.6],[0,2.5,0,4,1,.6],[0,5,3,8,.4,1],[0,.09,5,4,.18,2]]){
  const mesh=new Mesh(new BoxGeometry(w,h,d));mesh.position.set(x,y,z);group.add(mesh);
}
group.position.set(32,3,-8);group.rotation.y=Math.PI/2;
const barriers=sampleHeritageBarriers(group,()=>3);
assert(barriers.length>0);
const collision=createHeritageCollision({walkBarriers:[barriers]});
assert(collision.safeToWalk(32,-8,.32,3)); // original gate opening
assert(!collision.safeToWalk(32.42,-6.5,.32,3)); // jamb
assert(!collision.safeToWalk(32,-8,.32,4)); // jumping into the lintel
assert(collision.safeToWalk(35,-8,.32,3)); // bridge overhead
assert(collision.safeToWalk(37,-8,.32,3)); // manageable stair

const paths=[{a:[0,0],b:[18,0]},{a:[100,100],b:[120,100]}];
assert.deepEqual(nearestOnPaths(2,2,paths),[2,0]);
assert.deepEqual(nearestOnPaths(2,2,paths,(x)=>x>3),[3.6,0]);
assert.equal(nearestOnPaths(400,400,paths),null);
assert.equal(drivingSpeed({kind:'primary',maxspeed:'20'},1)*3.6,20);
assert(drivingSpeed({kind:'primary'})>drivingSpeed({kind:'living_street'}));
const road={id:'1',osm:1,width:6,kind:'residential'};
const edge={id:'1/1',road,path:[[0,0],[0,-10],[10,-10]],dist:[0,10,20],len:20,end:'b'};
const before=routePose(edge,9.99,true,()=>0),after=routePose(edge,10.01,true,()=>0);
assert(before.dx>.65&&after.dz<-.65);
assert(Math.hypot(before.x-after.x,before.z-after.z)<.05);
const car={x:0,z:0,y:0,dx:0,dz:-1};
assert(carsOverlap(car,{...car,z:-3.8}));
assert(!carsOverlap(car,{...car,z:-5}));
assert(!carsOverlap(car,{...car,y:5}));
assert(touchesCar(car,1.16,0,.32,0));
assert(!touchesCar(car,1.3,0,.32,0));
assert(!touchesCar(car,0,0,.32,2));
const footOnly={road:{id:'2',osm:2},car:false,foot:true};
const noTurn={road:{id:'3',osm:3},car:true,foot:false};
const straight={road:{id:'4',osm:4},car:true,foot:false};
const exits=new Map([['b',[footOnly,noTurn,straight]]]),rules={b:[{from:1,to:3,only:false}]};
assert.deepEqual(turnChoices(edge,exits,rules,true),[straight]);
assert.deepEqual(turnChoices(edge,exits,rules,false),[footOnly]);
console.log('Passed courtyard, cross-cell clearance, registered arch and lintel, tread, local spawn, street speeds, curvature, headway, vehicle height and restricted turns.');
