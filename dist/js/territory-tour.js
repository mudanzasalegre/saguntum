// A guided visit has an arrival, a quiet observation period and an explicit end.
// The camera clock uses foreground frame time, never elapsed wall-clock time.
import {atlasArea} from './atlas-order.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const copyPose=(p,veil=0)=>({eye:[...p.eye],target:[...p.target],fov:p.fov,veil});
export const tourTiming=Object.freeze({minimumTravel:7,maximumTravel:35,peakTravelSpeed:80,transferDistance:1800,fade:.7,reducedFade:.25,dwell:14,maximumPreparation:8});
export const tourEase=t=>{const s=clamp(t,0,1);return s*s*s*(s*(s*6-15)+10);};

export function normalizeTourStops(input,heightAt=()=>0){
  const seen=new Set();
  return (Array.isArray(input)?input:[]).filter(s=>{
    if(!s||typeof s.id!=='string'||!s.id||seen.has(s.id)||!vector(s.eye)||!vector(s.target)||distance(s.eye,s.target)<1)return false;
    seen.add(s.id);return true;
  }).map(s=>{
    const eye=[...s.eye],ground=heightAt(eye[0],eye[2]);
    // Territorial stops are exterior compositions; interior frames remain in
    // the separate, authored heritage navigation.
    if(Number.isFinite(ground))eye[1]=Math.max(eye[1],ground+8);
    return {...s,name:String(s.name||s.id),region:String(s.region||''),eye,target:[...s.target],fov:clamp(Number.isFinite(s.fov)?s.fov:38,20,75),dwell:clamp(Number.isFinite(s.dwell)?s.dwell:tourTiming.dwell,8,45)};
  });
}

export function createTourTransition(from,to,heightAt=()=>0){
  const start=copyPose(from),end=copyPose(to),horizontal=Math.hypot(end.eye[0]-start.eye[0],end.eye[2]-start.eye[2]);
  const travelDistance=distance(start.eye,end.eye);
  const fromView=start.target.map((v,i)=>v-start.eye[i]),toView=end.target.map((v,i)=>v-end.eye[i]);
  const fromLength=Math.hypot(...fromView),toLength=Math.hypot(...toView);
  const fromHorizontal=Math.hypot(fromView[0],fromView[2]),toHorizontal=Math.hypot(toView[0],toView[2]);
  const viewTurn=Math.acos(clamp(fromView.reduce((dot,v,i)=>dot+v*toView[i],0)/Math.max(.0001,fromLength*toLength),-1,1));
  const headingTurn=fromHorizontal>.0001&&toHorizontal>.0001?
    Math.acos(clamp((fromView[0]*toView[0]+fromView[2]*toView[2])/(fromHorizontal*toHorizontal),-1,1)):0;
  // Opposing authored views can interpolate through a vertical lookAt pose,
  // turning the horizon abruptly even at a gentle translation speed. Use the
  // same deliberate transfer as a long journey before such a camera reversal.
  const steepView=Math.min(fromHorizontal/Math.max(.0001,fromLength),toHorizontal/Math.max(.0001,toLength))<.08;
  const orientationCut=Math.max(viewTurn,headingTurn)>100*Math.PI/180||steepView&&viewTurn>5*Math.PI/180;
  // Quintic easing peaks at 1.875 times its average speed. Account for the
  // overview arc as well as the straight displacement when setting its pace.
  const lift=horizontal<240?0:Math.min(280,(horizontal-240)*.12);
  const duration=clamp(1.875*Math.hypot(travelDistance,Math.PI*lift)/tourTiming.peakTravelSpeed,tourTiming.minimumTravel,tourTiming.maximumTravel);
  // Neighbouring landmarks stay close. A long journey opens into an overview,
  // rather than crossing a town at street height.
  const groundAt=(x,z)=>{const y=heightAt(x,z);return Number.isFinite(y)?y:0;};
  const startGround=groundAt(start.eye[0],start.eye[2]),endGround=groundAt(end.eye[0],end.eye[2]);
  // Entering from an authored subterranean frame must retain its initial pose.
  // The first part of the arc exits that frame continuously.
  return {duration,horizontal,travelDistance,orientationCut,lift,start,end,sample(progress){
    const s=tourEase(progress),eye=start.eye.map((v,i)=>mix(v,end.eye[i],s)),target=start.target.map((v,i)=>mix(v,end.target[i],s));
    eye[1]+=Math.sin(Math.PI*s)**2*lift;
    if(s>0&&s<1){
      const ground=groundAt(eye[0],eye[2]);
      // Follow any intervening ridge without amplifying a small early rise
      // into an enormous arc. Valleys keep the gentler straight elevation.
      eye[1]+=Math.max(0,ground-mix(startGround,endGround,s));
      const clearance=mix(start.eye[1]-startGround,8,tourEase(Math.min(1,s*5)));
      eye[1]=Math.max(eye[1],ground+Math.min(12,clearance));
    }
    return {eye,target,fov:mix(start.fov,end.fov,s),veil:0};
  }};
}

export function createTerritoryTour({readPose,applyPose,heightAt=()=>0,isReady=()=>true,onState=()=>{}}){
  let stops=[],index=0,stage='idle',elapsed=0,duration=0,active=false,paused=false,reason=null,transition=null,reducedMotion=false,pauseOnArrival=false,lastNotice='';
  let transferPhase=null,veil=0,transferStartVeil=0,currentArea=null,covered=false,preparationTimedOut=false;
  const pose=(value,coverage=0)=>{veil=coverage;applyPose(copyPose(value,coverage));};
  function state(){
    const stop=stops[index];
    return {active,paused,stage,transferPhase,veil,index,id:stop?.id||null,name:stop?.name||'',region:stop?.region||'',count:stops.length,elapsed,duration,progress:duration?clamp(elapsed/duration,0,1):0,remaining:Math.max(0,duration-elapsed),reason,preparationTimedOut};
  }
  function notify(force=false){
    const stamp=[stage,transferPhase,index,paused,active,Math.floor(elapsed*4),reason].join('|');
    if(force||stamp!==lastNotice){lastNotice=stamp;onState(active,state());}
  }
  function ready(){try{return isReady(stops[index])!==false;}catch{return false;}}
  function begin(next){
    index=clamp(next,0,stops.length-1);elapsed=0;reason=null;active=true;preparationTimedOut=false;
    transition=createTourTransition(readPose(),stops[index],heightAt);
    const changesArea=currentArea!==null&&currentArea!==atlasArea(stops[index]).id;
    const transfer=reducedMotion||changesArea||veil>0||transition.orientationCut||transition.travelDistance>tourTiming.transferDistance;
    transferStartVeil=veil;
    stage=transfer?'transfer':'transition';transferPhase=transfer?'out':null;covered=false;
    duration=transfer?(reducedMotion?tourTiming.reducedFade:tourTiming.fade):transition.duration;
    pose(transition.start,transferStartVeil);notify(true);
  }
  function observe(){
    stage='holding';transferPhase=null;covered=false;elapsed=0;duration=stops[index].dwell;
    pose(stops[index]);
    if(pauseOnArrival){paused=true;reason='manual';pauseOnArrival=false;}
    notify(true);
  }
  function reveal(){
    if(!covered){observe();return;}
    stage='transfer';transferPhase='in';elapsed=0;duration=reducedMotion?tourTiming.reducedFade:tourTiming.fade;notify(true);
  }
  function arrive(hide=false){
    covered=hide;transferPhase=null;currentArea=atlasArea(stops[index]).id;
    pose(stops[index],hide?1:0);
    if(ready())reveal();else{stage='preparing';elapsed=0;duration=tourTiming.maximumPreparation;notify(true);}
  }
  return {
    start(input,options={}){
      const next=normalizeTourStops(input,heightAt),pose=readPose();
      if(!next.length||!pose||!vector(pose.eye)||!vector(pose.target)||!Number.isFinite(pose.fov))return false;
      stops=next;paused=false;pauseOnArrival=false;reducedMotion=!!options.reducedMotion;currentArea=null;
      begin(Number.isInteger(options.index)?options.index:0);return true;
    },
    tick(delta){
      if(!active||paused||!Number.isFinite(delta)||delta<=0)return;
      elapsed=Math.min(duration,elapsed+Math.min(delta,.1));
      if(stage==='transition'){
        pose(transition.sample(elapsed/duration));
        if(elapsed>=duration)arrive();else notify();
      }else if(stage==='transfer'){
        const opacity=tourEase(elapsed/duration);
        pose(transferPhase==='out'?transition.start:stops[index],transferPhase==='out'?mix(transferStartVeil,1,opacity):1-opacity);
        if(elapsed>=duration){if(transferPhase==='out')arrive(true);else observe();}
        else notify(true);
      }else if(stage==='preparing'){
        const loaded=ready();
        if(loaded||elapsed>=duration){preparationTimedOut=!loaded;reveal();}else notify();
      }else if(stage==='holding'){
        if(elapsed>=duration){
          if(index<stops.length-1)begin(index+1);
          else{active=false;stage='complete';reason='complete';pose(stops[index]);notify(true);}
        }else notify();
      }
    },
    pause(why='manual'){if(!active||paused)return false;paused=true;reason=why;notify(true);return true;},
    resume(){if(!active||!paused)return false;paused=false;pauseOnArrival=false;reason=null;notify(true);return true;},
    step(delta){
      if(!stops.length||!Number.isFinite(delta)||!delta)return false;
      const next=clamp(index+Math.sign(delta),0,stops.length-1);
      if(next===index)return false;
      pauseOnArrival=paused;paused=false;begin(next);return true;
    },
    stop(why='manual'){if(!active)return false;active=false;paused=false;pauseOnArrival=false;stage='stopped';transferPhase=null;reason=why;pose(readPose());notify(true);return true;},
    get active(){return active;},get state(){return state();}
  };
}
