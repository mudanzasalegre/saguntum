import assert from 'node:assert/strict';
import {registerThreeTestLoader} from './three-test-loader.mjs';

registerThreeTestLoader();
const T=await import('three');
const {createNavigation}=await import('../dist/js/territory-camera.js');

// Only DOM inputs are substituted: camera mathematics, navigation, tour state
// and the shipped OrbitControls implementation are exercised together.
class Element {
  constructor(){this.listeners=new Map();this.style={};this.dataset={};this.hidden=true;this.children=[];this.attributes=new Map();this.captured=new Set();this.clientHeight=800;this.clientWidth=1200;this.min='0';this.max='100';this.classList={contains:()=>false,toggle(){}};}
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
  emit(name,values={}){const e={type:name,target:this,preventDefault(){},...values};for(const fn of [...this.listeners.get(name)||[]])fn(e);}
  append(...items){this.children.push(...items);}
  setAttribute(key,value){this.attributes.set(key,String(value));}
  setPointerCapture(id){this.captured.add(id);}
  releasePointerCapture(id){this.captured.delete(id);}
  hasPointerCapture(id){return this.captured.has(id);}
  getRootNode(){return document;}
  focus(){}
  matches(){return false;}
  closest(){return null;}
  getBoundingClientRect(){return {left:0,top:0,width:1200,height:800};}
}
function installDOM(){
  const elements=new Map(),run=new Element();run.dataset.motion='run';
  globalThis.window=new Element();globalThis.document=new Element();
  document.body=new Element();document.pointerLockElement=null;document.hidden=false;
  document.getElementById=id=>{
    if(!elements.has(id)){const e=new Element();e.firstElementChild=new Element();elements.set(id,e);}
    return elements.get(id);
  };
  document.createElement=()=>new Element();
  document.querySelector=()=>run;
  document.querySelectorAll=selector=>selector==='[data-motion]'?[run]:[];
  globalThis.localStorage={getItem:()=>null,setItem(){}};
  globalThis.innerWidth=1200;globalThis.innerHeight=800;
}
function makeNavigation(){
  installDOM();
  const camera=new T.PerspectiveCamera(38,1.5,.1,100000),element=new Element(),states=[];
  const heightAt=(x,z)=>.01*x+.02*z;
  camera.position.set(100,120,300);camera.lookAt(0,0,0);
  const nav=createNavigation({camera,element,heightAt,walkingHeight:heightAt,bounds:[-50000,-50000,50000,50000],core:{x:0,z:0,range:6000,anchors:[{x:0,z:0}]},safe:()=>true,nearest:(x,z)=>[x,z],onMode(){},onRoute:(active,state)=>states.push({active,...state})});
  nav.frame(new T.Vector3(90,14,50),new T.Vector3(180,140,250),42,true,true);
  return {camera,element,nav,states};
}
const stops=[
  {id:'first',name:'Primera',eye:[350,160,380],target:[250,20,200],fov:38,dwell:8},
  {id:'second',name:'Segunda',eye:[780,180,720],target:[600,28,500],fov:40,dwell:8}
];
const pose=({camera,nav})=>({eye:camera.position.clone(),target:nav.controls.target.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov});
function assertPose(a,b,message,{target=true}={}){
  assert.ok(a.eye.distanceTo(b.eye)<1e-7,message+' · eye');
  if(target)assert.ok(a.target.distanceTo(b.target)<1e-7,message+' · target');
  assert.ok(a.quaternion.angleTo(b.quaternion)<1e-7,message+' · orientation');
  assert.ok(Math.abs(a.fov-b.fov)<1e-9,message+' · field of view');
}
function ticks(nav,seconds){for(let n=0;n<Math.ceil(seconds*60);n++)nav.tick(1/60);}
function waitFor(nav,predicate,label){for(let n=0;n<60000&&!predicate();n++)nav.tick(1/60);assert.ok(predicate(),label);}
function pointer(element,type,values={}){element.emit(type,{pointerId:1,pointerType:'mouse',button:0,clientX:450,clientY:350,pageX:450,pageY:350,...values});}

{
  const app=makeNavigation(),before=pose(app);
  assert.equal(app.nav.startTour(stops),true);
  assertPose(pose(app),before,'Starting from an authored orbit pose is continuous');
  app.nav.tick(0);assertPose(pose(app),before,'No camera movement before the tour clock advances');
  ticks(app.nav,.9);assert.equal(app.nav.pauseTour(),true);
  const paused=pose(app),elapsed=app.nav.tourState.elapsed;
  ticks(app.nav,4);assertPose(pose(app),paused,'Paused tour is stationary');
  assert.equal(app.nav.tourState.elapsed,elapsed);
  app.nav.resumeTour();waitFor(app.nav,()=>app.nav.tourState.stage==='holding','Tour reaches observation');
  const arrived=pose(app);app.nav.stopTour('explore');ticks(app.nav,2);
  assertPose(pose(app),arrived,'Exploring retains the held camera and target height');
}
{
  const app=makeNavigation();
  // A real drag leaves OrbitControls damping pending. Starting the guided visit
  // must consume that inertia without changing the visible opening composition.
  pointer(app.element,'pointerdown');pointer(app.element,'pointermove',{clientX:505,pageX:505});pointer(app.element,'pointerup');
  const dragged=pose(app);app.nav.startTour(stops);assertPose(pose(app),dragged,'Start retains the last visible drag frame');
  app.nav.pauseTour();ticks(app.nav,3);assertPose(pose(app),dragged,'Old drag inertia cannot leak into paused tour');
  app.nav.resumeTour();ticks(app.nav,.8);const moving=pose(app);
  pointer(app.element,'pointerdown');assert.equal(app.nav.touring,false);assert.equal(app.nav.tourState.reason,'camera');
  pointer(app.element,'pointerup');ticks(app.nav,2);
  assertPose(pose(app),moving,'Taking over the camera stops the visit without residual drift');
}
for(const mode of ['fly','walk']){
  const app=makeNavigation();app.nav.setMode(mode);ticks(app.nav,.1);
  const before=pose(app);assert.equal(app.nav.startTour(stops),true);
  assert.equal(app.nav.mode,'orbit');
  assertPose(pose(app),before,'Start from '+mode+' preserves visible camera',{target:false});
  app.nav.pauseTour();const paused=pose(app);ticks(app.nav,2);assertPose(pose(app),paused,'Start from '+mode+' can pause without drifting');
  app.nav.resumeTour();ticks(app.nav,1);app.nav.setMode('fly');assert.equal(app.nav.touring,false);
  assert.equal(app.nav.tourState.reason,'mode');
}
{
  const app=makeNavigation();
  app.nav.restore({mode:'fly',eye:[0,20,0],target:[0,0,-100],yaw:.5,pitch:.7,fov:68});
  const before=pose(app);app.nav.startTour(stops);
  assertPose(pose(app),before,'Starting while looking upwards preserves the view',{target:false});
  app.nav.tick(.05);const interrupted=pose(app);
  app.nav.stopTour('explore');ticks(app.nav,2);
  assertPose(pose(app),interrupted,'Cancelling an upward-facing approach does not clamp the polar angle');
  assert.equal(app.nav.atVisitFrame,false,'Cancelled approach is not an exact authored heritage stop');
}
{
  const app=makeNavigation();
  app.nav.frame(new T.Vector3(0,-4,0),new T.Vector3(0,-2,10),42,true,true);
  const before=pose(app);app.nav.startTour(stops);
  assertPose(pose(app),before,'Starting from an underground authored frame is continuous');
  app.nav.tick(.05);const interrupted=pose(app);
  app.nav.stopTour('explore');ticks(app.nav,2);
  assertPose(pose(app),interrupted,'Cancelling an underground departure does not jump to terrain height');
  assert.equal(app.nav.atVisitFrame,false,'Interrupted departure is freely explorable');
}
{
  const app=makeNavigation();app.nav.startTour(stops);
  waitFor(app.nav,()=>app.nav.tourState.stage==='complete','Tour completes once');
  const completed=pose(app);ticks(app.nav,5);assertPose(pose(app),completed,'Completed tour has no loop or camera snap');
}
console.log('Tour navigation passed: real Three.js/OrbitControls; orbit/fly/walk entry, pause, pending drag damping, manual takeover, mode switch, upward/underground cancellation and non-looping completion.');
