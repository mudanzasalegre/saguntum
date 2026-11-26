import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTerritoryTour,createTourTransition,normalizeTourStops,tourTiming} from '../dist/js/territory-tour.js';

const initial={eye:[0,30,60],target:[0,0,0],fov:38};
const stop=(id,x=100,region='sagunto')=>({id,name:id,region,eye:[x,40,60],target:[x,0,0],fov:38});
const visible=p=>({eye:p.eye,target:p.target,fov:p.fov});
function rig({start=initial,heightAt=()=>0,isReady=()=>true}={}){
  let pose=structuredClone(start);
  const poses=[],states=[];
  const tour=createTerritoryTour({heightAt,isReady,readPose:()=>pose,
    applyPose(next){pose=structuredClone(next);poses.push(pose);},
    onState(_active,next){states.push({...next});}});
  return {tour,poses,states,get pose(){return pose;}};
}
function advance(tour,seconds,delta=.05){
  for(let i=0;i<Math.floor(seconds/delta);i++)tour.tick(delta);
}
function until(tour,predicate,budget=70){
  for(let i=0;i<budget*20;i++){
    if(predicate(tour.state))return;
    tour.tick(.05);
  }
  assert.fail('El recorrido no alcanzó el estado esperado: '+JSON.stringify(tour.state));
}

test('an invalid itinerary does not move the camera; normalization preserves input',()=>{
  const r=rig(),a=stop('a'),input=[a,{...a},stop('b'),{id:'broken',eye:[NaN,0,0],target:[0,0,0]}];
  const before=structuredClone(input),normalized=normalizeTourStops(input,()=>100);
  assert.deepEqual(input,before);
  assert.deepEqual(normalized.map(p=>p.id),['a','b']);
  assert(normalized.every(p=>p.eye[1]>=108));
  assert.equal(r.tour.start([{id:'bad'}]),false);
  assert.deepEqual(r.pose,initial);
});

test('a local approach starts without a camera jump and ends at its authored view',()=>{
  const r=rig(),destination=stop('a',300);
  assert(r.tour.start([destination]));
  assert.deepEqual(visible(r.pose),initial);
  assert.equal(r.tour.state.stage,'transition');
  until(r.tour,s=>s.stage==='holding');
  assert.deepEqual(visible(r.pose),visible(destination));
  assert(r.poses.every(p=>p.veil===0));
  for(const p of r.poses){
    assert(p.eye.every(Number.isFinite)&&p.target.every(Number.isFinite));
    assert(Math.hypot(...p.eye.map((v,i)=>v-p.target[i]))>1);
  }
});

test('nearby flight pace is bounded and intervening relief stays below the camera',()=>{
  const from={eye:[0,25,0],target:[0,0,-60],fov:38};
  const to={eye:[1100,35,0],target:[1100,0,-60],fov:38};
  const heightAt=x=>90*Math.sin(Math.PI*Math.max(0,Math.min(1,x/1100)))**2;
  const path=createTourTransition(from,to,heightAt);
  let last=path.sample(0),peak=0;
  assert.deepEqual(visible(last),from);
  for(let i=1;i<=1200;i++){
    const next=path.sample(i/1200);
    assert(next.eye[1]>=heightAt(next.eye[0])+7.99);
    peak=Math.max(peak,Math.hypot(...next.eye.map((v,j)=>v-last.eye[j]))/(path.duration/1200));
    last=next;
  }
  assert(peak<100,'El acercamiento no debe volver al sobrevuelo acelerado');
  assert.deepEqual(visible(last),to);
});

test('loading time does not consume the fourteen-second observation period',()=>{
  let ready=false;const r=rig({isReady:()=>ready});
  r.tour.start([stop('a'),stop('b',400)]);
  until(r.tour,s=>s.stage==='preparing');
  advance(r.tour,7);
  assert.equal(r.tour.state.stage,'preparing');
  ready=true;r.tour.tick(.05);
  assert.equal(r.tour.state.stage,'holding');
  assert.equal(r.tour.state.elapsed,0);
  advance(r.tour,13.9);
  assert.equal(r.tour.state.index,0);
  until(r.tour,s=>s.index===1);
});

test('a cross-territory transfer changes the camera only under an opaque veil',()=>{
  let ready=false;const r=rig({isReady:()=>ready}),destination=stop('far',6500,'puerto');
  r.tour.start([destination]);
  assert.equal(r.tour.state.stage,'transfer');
  assert.deepEqual(visible(r.pose),initial);
  until(r.tour,s=>s.stage==='preparing');
  assert.equal(r.pose.veil,1);
  assert.deepEqual(visible(r.pose),visible(destination));
  for(let i=1;i<r.poses.length;i++){
    if(JSON.stringify(visible(r.poses[i]))!==JSON.stringify(visible(r.poses[i-1])))assert.equal(r.poses[i].veil,1);
  }
  advance(r.tour,3);
  assert.equal(r.pose.veil,1);
  ready=true;r.tour.tick(.05);
  assert.equal(r.tour.state.transferPhase,'in');
  until(r.tour,s=>s.stage==='holding');
  assert.equal(r.pose.veil,0);
  assert.equal(r.tour.state.elapsed,0);
  assert.equal(r.tour.state.duration,14);
});

test('a change of area uses a deliberate transfer even when anchors are near',()=>{
  const r=rig();
  r.tour.start([stop('a',100,'sagunto'),stop('b',300,'puerto')]);
  until(r.tour,s=>s.stage==='holding');
  r.tour.step(1);
  assert.equal(r.tour.state.stage,'transfer');
  assert.equal(r.tour.state.transferPhase,'out');
});

test('opposing nearby views use a covered cut instead of flipping through a vertical gaze',()=>{
  const start={eye:[-80,50,0],target:[0,0,0],fov:38};
  const destination={id:'opposite',region:'sagunto',eye:[80,50,0],target:[0,0,0],fov:38};
  const path=createTourTransition(start,destination);
  assert(path.travelDistance<tourTiming.transferDistance);
  assert.equal(path.orientationCut,true);
  const r=rig({start});r.tour.start([destination]);
  assert.equal(r.tour.state.stage,'transfer');
  until(r.tour,s=>s.stage==='holding');
  for(let i=1;i<r.poses.length;i++){
    if(JSON.stringify(visible(r.poses[i]))!==JSON.stringify(visible(r.poses[i-1])))assert.equal(r.poses[i].veil,1);
  }
  const sameSide={...destination,eye:[-50,50,50]};
  assert.equal(createTourTransition(start,sameSide).orientationCut,false);
});

test('an upward-to-downward reversal is covered even with the same horizontal heading',()=>{
  const start={eye:[0,20,0],target:[0,100,-20],fov:38};
  const destination={id:'below',region:'sagunto',eye:[0,20,0],target:[0,-60,-20],fov:38};
  const r=rig({start});r.tour.start([destination]);
  assert.equal(r.tour.state.stage,'transfer');
  until(r.tour,s=>s.stage==='holding');
  assert.deepEqual(visible(r.pose),visible(destination));
});

test('pause freezes movement and time, including background suspension',()=>{
  const r=rig();r.tour.start([stop('far',7000)]);r.tour.tick(.1);
  assert(r.tour.pause('hidden'));
  const before=structuredClone(r.pose),state=r.tour.state;
  for(const delta of [.05,30,Infinity,NaN,-1])r.tour.tick(delta);
  assert.deepEqual(r.pose,before);
  assert.deepEqual(r.tour.state,state);
  assert(r.tour.resume());
  r.tour.tick(120);
  assert(r.tour.state.elapsed-state.elapsed<=.1000001,'La pestaña no recupera tiempo oculto a gran velocidad');
});

test('previous and next preserve an intentional pause after arrival',()=>{
  const r=rig();r.tour.start([stop('a'),stop('b',500),stop('c',700)]);
  assert.equal(r.tour.step(-1),false);
  until(r.tour,s=>s.stage==='holding');r.tour.pause();
  assert(r.tour.step(1));
  assert.equal(r.tour.state.paused,false);
  until(r.tour,s=>s.paused);
  assert.equal(r.tour.state.index,1);
  assert.equal(r.tour.state.stage,'holding');
  assert(r.tour.step(-1));until(r.tour,s=>s.paused);
  assert.equal(r.tour.state.index,0);
});

test('failed loading is bounded and leaves a usable visible destination',()=>{
  const r=rig({isReady:()=>false});r.tour.start([stop('far',5000)]);
  until(r.tour,s=>s.stage==='preparing');
  advance(r.tour,tourTiming.maximumPreparation+.1);
  until(r.tour,s=>s.stage==='holding');
  assert.equal(r.tour.state.preparationTimedOut,true);
  assert.equal(r.pose.veil,0);
  assert.equal(r.tour.state.elapsed,0);
});

test('reduced motion avoids a moving flight while retaining arrival and observation',()=>{
  const r=rig(),destination=stop('near',120);
  r.tour.start([destination],{reducedMotion:true});
  until(r.tour,s=>s.stage==='holding');
  for(const p of r.poses)assert([JSON.stringify(initial),JSON.stringify(visible(destination))].includes(JSON.stringify(visible(p))));
  assert.equal(r.pose.veil,0);
  assert.equal(r.tour.state.duration,14);
});

test('completion holds the final view and cancellation clears a transfer veil',()=>{
  const r=rig(),destination=stop('a');r.tour.start([destination]);
  until(r.tour,s=>s.stage==='complete');
  assert.equal(r.tour.active,false);
  assert.deepEqual(visible(r.pose),visible(destination));
  const count=r.poses.length;advance(r.tour,120);
  assert.equal(r.poses.length,count,'El último lugar no reinicia un bucle');
  r.tour.start([stop('far',9000)]);r.tour.tick(.1);
  assert(r.pose.veil>0);const before=visible(r.pose);
  r.tour.stop('camera');
  assert.equal(r.tour.active,false);assert.equal(r.pose.veil,0);
  assert.deepEqual(visible(r.pose),before);
});

test('an initial underground or upward-looking view is not snapped before departure',()=>{
  const start={eye:[0,-5,0],target:[0,12,-20],fov:68};
  const r=rig({start});r.tour.start([stop('a',100)]);
  assert.deepEqual(visible(r.pose),start);
  r.tour.tick(.001);
  assert(Math.hypot(...r.pose.eye.map((v,i)=>v-start.eye[i]))<.01);
  until(r.tour,s=>s.stage==='holding');
  assert(r.pose.eye[1]>=8);
});
