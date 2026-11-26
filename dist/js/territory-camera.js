import * as T from 'three';
import {simulatorInput} from './territory-input.js';
import {locomotion} from './territory-locomotion.js';
import {createTerritoryTour} from './territory-tour.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const clamp=T.MathUtils.clamp;
const modes=['orbit','fly','walk'];
export function createNavigation({camera,element,heightAt,walkingHeight,bounds,core,safe,nearest,onMode,onRoute=()=>{},tourReady=()=>true,onCommand=()=>{}}){
  const controls=new OrbitControls(camera,element);
  Object.assign(controls,{enableDamping:true,dampingFactor:.10,minDistance:4,maxDistance:29000,maxPolarAngle:Math.PI*.493,screenSpacePanning:false,zoomSpeed:.9});
  const v=new T.Vector3(),joystick={x:0,z:0};
  const up=new T.Vector3(0,1,0),euler=new T.Euler(0,0,0,'YXZ');
  let mode='orbit',yaw=0,pitch=0,tween=null,ascend=0,targetYaw=0,targetPitch=0;
  const motion=locomotion({camera,heightAt,walkingHeight,bounds,safe,nearest,spawn:core.anchors[0]});
  const input=simulatorInput(element,{mode:()=>mode,look(dx,dy){
    const factor=.0024*input.prefs.sensitivity;
    targetYaw-=dx*factor;targetPitch=clamp(targetPitch-dy*factor*(input.prefs.invert?-1:1),-1.48,1.48);
    if(!input.prefs.smoothing&&!input.prefs.cinema){yaw=targetYaw;pitch=targetPitch;orientation();}
  },settingsChanged(){
    if(mode!=='orbit'){camera.fov=input.prefs.fov;camera.updateProjectionMatrix();}
  },command(action){
    if(action==='up'&&mode==='walk')motion.jump();
    if(action==='reset'&&mode==='walk')motion.respawn();
    if(action==='view')setMode(mode==='walk'?'orbit':'walk');
    onCommand(action);
  }});
  let targetLift=0,visitPose=false,authoredTarget=null,untouched=false;
  function setVisitPose(enabled,eye,target){
    visitPose=enabled;
    authoredTarget=enabled?target.clone():null;
    untouched=enabled;
    controls.minDistance=enabled?1:4;
    controls.maxPolarAngle=enabled?Math.max(Math.PI*.493,eye.clone().sub(target).angleTo(up)+.001):Math.PI*.493;
  }
  function readTourPose(){return {eye:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov};}
  function applyTourPose(pose){
    camera.position.fromArray(pose.eye);controls.target.fromArray(pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();camera.lookAt(controls.target);
    targetLift=controls.target.y-heightAt(controls.target.x,controls.target.z);
  }
  function flushOrbitMotion(){
    // Consume any previous drag's damping delta, then restore the visible pose.
    // No private OrbitControls fields or extra synthetic input are required.
    const pose=readTourPose(),damping=controls.enableDamping,min=controls.minDistance,max=controls.maxPolarAngle;
    controls.enableDamping=false;controls.minDistance=0;controls.maxPolarAngle=Math.PI;
    controls.update();applyTourPose(pose);controls.update();
    controls.enableDamping=damping;controls.minDistance=min;controls.maxPolarAngle=max;
  }
  const tour=createTerritoryTour({readPose:readTourPose,applyPose:applyTourPose,heightAt,isReady:tourReady,onState(active,state){
    if(!active){
      // Cancellation can happen while leaving an interior or looking upwards
      // from free flight. Keep that visible pose when OrbitControls takes over;
      // its normal ground/polar limits would otherwise produce a camera jump.
      setVisitPose(true,camera.position,controls.target);untouched=false;
      targetLift=controls.target.y-heightAt(controls.target.x,controls.target.z);flushOrbitMotion();
    }
    onRoute(active,state);
  }});
  function stop(reason='manual'){return tour.stop(reason);}
  controls.addEventListener('start',()=>{stop('camera');untouched=false;if(tween){targetLift=controls.target.y-heightAt(controls.target.x,controls.target.z);if(visitPose)authoredTarget=controls.target.clone();}tween=null;});
  function orientation(){camera.quaternion.setFromEuler(euler.set(pitch,yaw,0,'YXZ'));}
  function setMode(next,reset=true){
    if(!modes.includes(next))return;
    stop('mode');
    if(next===mode){onMode(mode);return;}
    const initialOverview=mode==='orbit'&&camera.position.distanceTo(controls.target)>2500;
    setVisitPose(false);input.release();motion.stop();
    stop();tween=null;
    const focus=controls.target.clone(),p=camera.position;
    if(next==='orbit'&&mode!=='orbit'){
      targetLift=0;camera.fov=38;camera.updateProjectionMatrix();
      camera.getWorldDirection(v);controls.target.copy(p).addScaledVector(v,60);controls.target.y=heightAt(controls.target.x,controls.target.z);
      p.y=Math.max(p.y,controls.target.y+32);controls.update();
    }else if(next!=='orbit'){
      euler.setFromQuaternion(camera.quaternion,'YXZ');yaw=euler.y;pitch=clamp(euler.x,-1.35,1.25);
      if(next==='walk'&&reset){
        const where=initialOverview?core.anchors[0]:mode==='orbit'?focus:p;
        motion.requestLanding(where.x,where.z);pitch=-.035;
      }
      targetYaw=yaw;targetPitch=pitch;camera.fov=input.prefs.fov;camera.updateProjectionMatrix();
      orientation();
    }
    controls.enabled=next==='orbit';mode=next;joystick.x=joystick.z=ascend=0;onMode(mode);
  }
  function frame(end,dest,fov,instant=false,authored=false){
    stop();setMode('orbit');targetLift=end.y-heightAt(end.x,end.z);
    setVisitPose(authored,dest,end);
    if(instant){controls.target.copy(end);camera.position.copy(dest);camera.fov=fov;camera.updateProjectionMatrix();controls.update();tween=null;return;}
    tween={eye:camera.position.clone(),target:controls.target.clone(),end,dest,t:0,fov,fromFov:camera.fov};
  }
  function flyTo(x,z,range=200,instant=false){
    const end=new T.Vector3(x,heightAt(x,z),z);
    frame(end,end.clone().add(new T.Vector3(range*.22,range*.72,range*.84)),38,instant);
  }
  function panorama(instant=false){
    // Fit the actual three anchors to the available horizontal field of view.
    // Portrait screens need more stand-off than a fixed mobile multiplier.
    const preview=camera.clone(),center=new T.Vector3(core.x,heightAt(core.x,core.z),core.z);
    let range=core.range;preview.clearViewOffset();preview.fov=38;preview.aspect=innerWidth/innerHeight;preview.updateProjectionMatrix();
    for(let i=0;i<20;i++){
      preview.position.copy(center).add(new T.Vector3(.22*range,.72*range,.84*range));preview.lookAt(center);preview.updateMatrixWorld();
      if(core.anchors.every(p=>{const v=new T.Vector3(p.x,heightAt(p.x,p.z)+80,p.z).project(preview);
        return Math.abs(v.x)<(innerWidth<700?.62:.85)&&Math.abs(v.y)<.72;}))break;
      range*=1.1;
    }
    flyTo(core.x,core.z,range,instant);
  }
  const pad=document.getElementById('sim-stick'),nub=pad.firstElementChild;
  function padMove(e){
    const r=pad.getBoundingClientRect(),x=clamp((e.clientX-r.left-r.width/2)/(r.width*.39),-1,1),y=clamp((e.clientY-r.top-r.height/2)/(r.height*.39),-1,1);
    joystick.x=x;joystick.z=-y;nub.style.transform='translate('+x*19+'px,'+y*19+'px)';
  }
  pad.onpointerdown=e=>{pad.setPointerCapture(e.pointerId);padMove(e);};
  pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId))padMove(e);};
  pad.onlostpointercapture=()=>{joystick.x=joystick.z=0;nub.style.transform='';};
  document.querySelectorAll('[data-rise]').forEach(b=>{b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);ascend=Number(b.dataset.rise);};b.onlostpointercapture=()=>ascend=0;});
  window.addEventListener('blur',()=>{joystick.x=joystick.z=ascend=0;motion.stop();});
  function startTour(stops,options={}){
    if(!Array.isArray(stops)||!stops.length)return false;
    const visiblePose=readTourPose();
    if(mode!=='orbit'){
      camera.getWorldDirection(v);visiblePose.target=camera.position.clone().addScaledVector(v,60).toArray();
    }
    setMode('orbit');setVisitPose(false);tween=null;input.release();motion.stop();
    applyTourPose(visiblePose);flushOrbitMotion();
    return tour.start(stops,options);
  }
  function tick(dt) {
    const p=camera.position;
    if(tour.active){
      // Authoritative pose while moving or paused; OrbitControls remains able
      // to receive a gesture, whose start event ends the guided visit.
      tour.tick(dt);return;
    }
    if(tween){
      tween.t=Math.min(1,tween.t+dt*.9);const t=tween.t*tween.t*(3-2*tween.t);
      controls.target.lerpVectors(tween.target,tween.end,t);p.lerpVectors(tween.eye,tween.dest,t);
      camera.fov=T.MathUtils.lerp(tween.fromFov,tween.fov,t);if(tween.t===1)tween=null;
    }
    if(mode==='orbit'){
      controls.target.x=clamp(controls.target.x,bounds[0],bounds[2]);controls.target.z=clamp(controls.target.z,bounds[1],bounds[3]);
      if(!tween&&!tour.active){
        const offset=authoredTarget?Math.hypot(controls.target.x-authoredTarget.x,controls.target.z-authoredTarget.z):Infinity;
        if(visitPose&&offset>80){setVisitPose(false);targetLift=0;}
        controls.target.y=visitPose&&offset<.02?authoredTarget.y:heightAt(controls.target.x,controls.target.z)+targetLift;
      }
      if(!visitPose)p.y=Math.max(p.y,heightAt(p.x,p.z)+1.7);
      controls.update();return;
    }
    const smooth=input.prefs.cinema?Math.max(.3,input.prefs.smoothing):input.prefs.smoothing;
    const weight=smooth?1-Math.exp(-dt*10/smooth):1;
    yaw+=(targetYaw-yaw)*weight;pitch+=(targetPitch-pitch)*weight;orientation();
    motion.tick(dt,mode,input,joystick,ascend);
  }
  function north(){
    if(mode!=='orbit')return;
    const offset=camera.position.clone().sub(controls.target);
    const destination=controls.target.clone().add(new T.Vector3(0,offset.y,Math.hypot(offset.x,offset.z)));
    frame(controls.target.clone(),destination,camera.fov);
  }
  function relocate(x,z){
    if(mode==='walk'){motion.requestLanding(x,z);return;}
    if(mode==='fly'){const h=Math.max(input.prefs.clearance,camera.position.y-heightAt(camera.position.x,camera.position.z));motion.stop();camera.position.set(x,heightAt(x,z)+h,z);return;}
    flyTo(x,z,300);
  }
  function snapshot(){
    const target=controls.target;
    // During an approach the destination and the visible pivot have different
    // ground heights. Resume at the pivot actually on screen.
    const lift=mode==='orbit'?target.y-heightAt(target.x,target.z):targetLift;
    return {mode,eye:camera.position.toArray(),target:target.toArray(),yaw,pitch,fov:camera.fov,targetLift:lift,visitPose,untouched,...(mode==='walk'?{walk:motion.snapshot()}:{})};
  }
  function restore(s){
    if(!s||!modes.includes(s.mode)||![s.eye,s.target].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite)))return false;
    setMode(s.mode,false);camera.position.fromArray(s.eye);controls.target.fromArray(s.target);
    setVisitPose(!!s.visitPose&&s.mode==='orbit',camera.position,controls.target);
    if(s.untouched===false)untouched=false;
    targetLift=Number.isFinite(s.targetLift)?s.targetLift:0;
    if(Number.isFinite(s.fov)){camera.fov=clamp(s.fov,10,115);camera.updateProjectionMatrix();}
    if(mode==='orbit')controls.update();else {yaw=targetYaw=s.yaw||0;pitch=targetPitch=s.pitch||0;orientation();if(mode==='walk')motion.restore(s.walk);}return true;
  }
  return {controls,input,north,relocate,get speed(){return motion.speed;},get landing(){return mode==='walk'&&motion.landing;},setMode,flyTo,frame,panorama,tick,startTour,pauseTour:reason=>tour.pause(reason),resumeTour:()=>tour.resume(),stepTour:delta=>tour.step(delta),stopTour:stop,get tourState(){return tour.state;},snapshot,restore,get mode(){return mode;},get atVisitFrame(){return untouched;},leaveVisit(){if(visitPose){setVisitPose(false);targetLift=0;}},get touring(){return tour.active;},
    focusPoint(){return mode==='orbit'?controls.target:camera.position;},get range(){return mode==='orbit'?camera.position.distanceTo(controls.target):Math.max(0,camera.position.y-heightAt(camera.position.x,camera.position.z));}};
}
