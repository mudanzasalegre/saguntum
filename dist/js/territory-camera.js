import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const clamp=T.MathUtils.clamp;
const modes=['orbit','fly','walk'];
export function createNavigation({camera,element,heightAt,walkingHeight,bounds,core,safe,nearest,route,onMode,onRoute}){
  const controls=new OrbitControls(camera,element);
  Object.assign(controls,{enableDamping:true,dampingFactor:.10,minDistance:4,maxDistance:29000,maxPolarAngle:Math.PI*.493,screenSpacePanning:false,zoomSpeed:.9});
  const keys=new Set(),v=new T.Vector3(),move=new T.Vector3(),aim=new T.Vector3(),joystick={x:0,z:0};
  const up=new T.Vector3(0,1,0),side=new T.Vector3(),euler=new T.Euler(0,0,0,'YXZ');
  let mode='orbit',yaw=0,pitch=0,tween=null,lookId=null,lastX,lastY,ascend=0,walkingStart=false;
  let targetLift=0;
  let touring=false,travel=0,routeIndex=1,routeSpeed=100;
  const distances=[0];for(let i=1;i<route.length;i++)distances.push(distances[i-1]+Math.hypot(route[i][0]-route[i-1][0],route[i][1]-route[i-1][1]));
  function stop(){if(touring){touring=false;onRoute(false);}}
  controls.addEventListener('start',()=>{stop();if(tween)targetLift=controls.target.y-heightAt(controls.target.x,controls.target.z);tween=null;});
  function orientation(){camera.quaternion.setFromEuler(euler.set(pitch,yaw,0,'YXZ'));}
  function setMode(next,reset=true){
    if(!modes.includes(next))return;
    if(next===mode){onMode(mode);return;}
    stop();tween=null;
    const focus=controls.target.clone(),p=camera.position;
    if(next==='orbit'&&mode!=='orbit'){
      targetLift=0;
      camera.getWorldDirection(v);controls.target.copy(p).addScaledVector(v,60);controls.target.y=heightAt(controls.target.x,controls.target.z);
      p.y=Math.max(p.y,controls.target.y+32);controls.update();
    }else if(next!=='orbit'){
      euler.setFromQuaternion(camera.quaternion,'YXZ');yaw=euler.y;pitch=clamp(euler.x,-1.35,1.25);
      if(next==='walk'&&reset){
        if(mode==='orbit')p.set(focus.x,0,focus.z);
        const near=nearest(p.x,p.z);if(near)p.set(near[0],0,near[1]);
        walkingStart=true;p.y=heightAt(p.x,p.z)+1.7;pitch=-.035;
      }
      orientation();
    }
    controls.enabled=next==='orbit';mode=next;keys.clear();joystick.x=joystick.z=ascend=0;onMode(mode);
  }
  function frame(end,dest,fov,instant=false){
    stop();setMode('orbit');targetLift=end.y-heightAt(end.x,end.z);
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
  function key(e,down){
    if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)&&e.key!=='Escape')return;
    if(e.key==='Escape'){stop();if(mode!=='orbit')setMode('orbit');return;}
    const k=e.key.toLowerCase();
    if(mode==='orbit'||!['w','a','s','d','q','e','shift','arrowleft','arrowright','arrowup','arrowdown'].includes(k))return;
    e.preventDefault();if(down)keys.add(k);else keys.delete(k);
  }
  window.addEventListener('keydown',e=>key(e,true));window.addEventListener('keyup',e=>key(e,false));
  window.addEventListener('blur',()=>{keys.clear();joystick.x=joystick.z=ascend=0;});
  element.addEventListener('pointerdown',e=>{if(mode==='orbit'||lookId!==null)return;lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;element.setPointerCapture(e.pointerId);element.focus({preventScroll:true});});
  element.addEventListener('pointermove',e=>{
    if(mode==='orbit'||lookId!==e.pointerId)return;
    yaw-=(e.clientX-lastX)*.004;pitch=clamp(pitch-(e.clientY-lastY)*.004,-1.47,1.47);
    lastX=e.clientX;lastY=e.clientY;orientation();
  });
  element.addEventListener('lostpointercapture',()=>lookId=null);
  const pad=document.getElementById('sim-stick'),nub=pad.firstElementChild;
  function padMove(e){
    const r=pad.getBoundingClientRect(),x=clamp((e.clientX-r.left-r.width/2)/(r.width*.39),-1,1),y=clamp((e.clientY-r.top-r.height/2)/(r.height*.39),-1,1);
    joystick.x=x;joystick.z=-y;nub.style.transform='translate('+x*19+'px,'+y*19+'px)';
  }
  pad.onpointerdown=e=>{pad.setPointerCapture(e.pointerId);padMove(e);};
  pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId))padMove(e);};
  pad.onlostpointercapture=()=>{joystick.x=joystick.z=0;nub.style.transform='';};
  document.querySelectorAll('[data-rise]').forEach(b=>{b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);ascend=Number(b.dataset.rise);};b.onlostpointercapture=()=>ascend=0;});
  function startTour(){
    if(touring){stop();return;}
    if(route.length<2)return;
    setMode('orbit');tween=null;targetLift=0;camera.fov=38;touring=true;travel=0;routeIndex=1;onRoute(true);
    const [x,z]=route[0];controls.target.set(x,heightAt(x,z),z);camera.position.set(x+65,controls.target.y+150,z+155);
  }
  function tick(dt) {
    const p=camera.position;
    if(touring){
      travel+=dt*routeSpeed;while(routeIndex<route.length-1&&travel>distances[routeIndex])routeIndex++;
      const a=route[routeIndex-1],b=route[routeIndex],d=distances[routeIndex]-distances[routeIndex-1]||1,f=clamp((travel-distances[routeIndex-1])/d,0,1);
      const x=T.MathUtils.lerp(a[0],b[0],f),z=T.MathUtils.lerp(a[1],b[1],f);
      controls.target.set(x,heightAt(x,z),z);
      aim.set(x+65,controls.target.y+150,z+155);p.lerp(aim,1-Math.exp(-dt*2.5));if(travel>=distances.at(-1))stop();
    }
    if(tween){
      tween.t=Math.min(1,tween.t+dt*.9);const t=tween.t*tween.t*(3-2*tween.t);
      controls.target.lerpVectors(tween.target,tween.end,t);p.lerpVectors(tween.eye,tween.dest,t);
      camera.fov=T.MathUtils.lerp(tween.fromFov,tween.fov,t);if(tween.t===1)tween=null;
    }
    if(mode==='orbit'){
      controls.target.x=clamp(controls.target.x,bounds[0],bounds[2]);controls.target.z=clamp(controls.target.z,bounds[1],bounds[3]);
      if(!tween&&!touring)controls.target.y=heightAt(controls.target.x,controls.target.z)+targetLift;
      p.y=Math.max(p.y,heightAt(p.x,p.z)+1.7);controls.update();return;
    }
    if(walkingStart){
      const near=nearest(p.x,p.z);if(near&&safe(...near)){p.x=near[0];p.z=near[1];walkingStart=false;}
    }
    const f=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)+joystick.z;
    const s=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joystick.x;
    camera.getWorldDirection(v);if(mode==='walk'){v.y=0;v.normalize();}side.crossVectors(v,up).normalize();
    move.copy(v).multiplyScalar(f).addScaledVector(side,s);
    if(move.lengthSq()>1)move.normalize();
    const speed=mode==='walk'?(keys.has('shift')?4.1:1.8):clamp((p.y-heightAt(p.x,p.z))*.42+16,16,1300)*(keys.has('shift')?2.5:1);
    move.multiplyScalar(speed*dt);
    // A panoramic orbit can place the eye offshore beyond the terrain extent.
    // Permit continuous inward flight from there without snapping to the edge.
    const x=clamp(p.x+move.x,Math.min(p.x,bounds[0]),Math.max(p.x,bounds[2]));
    const z=clamp(p.z+move.z,Math.min(p.z,bounds[1]),Math.max(p.z,bounds[3]));
    if(move.x&&(mode==='fly'||safe(x,p.z)))p.x=x;if(move.z&&(mode==='fly'||safe(p.x,z)))p.z=z;
    p.y=mode==='walk'?walkingHeight(p.x,p.z)+1.7:Math.max(heightAt(p.x,p.z)+1.7,p.y+move.y+dt*speed*((keys.has('e')?1:0)-(keys.has('q')?1:0)+ascend));
  }
  function snapshot(){return {mode,eye:camera.position.toArray(),target:controls.target.toArray(),yaw,pitch,fov:camera.fov,targetLift};}
  function restore(s){
    if(!s||!modes.includes(s.mode)||![s.eye,s.target].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite)))return false;
    setMode(s.mode,false);camera.position.fromArray(s.eye);controls.target.fromArray(s.target);
    targetLift=Number.isFinite(s.targetLift)?s.targetLift:0;
    if(Number.isFinite(s.fov)){camera.fov=clamp(s.fov,18,85);camera.updateProjectionMatrix();}
    if(mode==='orbit')controls.update();else {yaw=s.yaw||0;pitch=s.pitch||0;orientation();}return true;
  }
  return {controls,setMode,flyTo,frame,panorama,tick,startTour,snapshot,restore,get mode(){return mode;},get touring(){return touring;},
    focusPoint(){return mode==='orbit'?controls.target:camera.position;},get range(){return mode==='orbit'?camera.position.distanceTo(controls.target):Math.max(0,camera.position.y-heightAt(camera.position.x,camera.position.z));}};
}
