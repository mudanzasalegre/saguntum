import {Vector3,MathUtils} from 'three';

// Distances and speeds use metres and seconds in the local UTM frame.
export function locomotion({camera,heightAt,walkingHeight,safe,nearest,bounds,spawn}){
  const velocity=new Vector3(),wish=new Vector3(),forward=new Vector3(),right=new Vector3(),up=new Vector3(0,1,0);
  let vertical=0,feet=0,eye=1.7,grounded=false,landing=false,retry=0,landingTime=0,stepPhase=0,lastSafe=null,speed=0;
  let restoredFloor=null;
  function stop(){velocity.set(0,0,0);vertical=0;speed=0;}
  function arrive(x,z){
    stop();feet=walkingHeight(x,z);eye=1.7;camera.position.set(x,feet+eye,z);
    lastSafe={x,z};grounded=true;landing=false;stepPhase=0;
  }
  function requestLanding(x,z){
    stop();grounded=false;landing=true;retry=0;landingTime=0;restoredFloor=null;
    camera.position.set(x,heightAt(x,z)+1.7,z);
  }
  function land(dt){
    landingTime+=dt;
    if((retry-=dt)>0)return;
    retry=.2;
    const {x,z}=camera.position;
    const clear=(a,b)=>safe(a,b,.32,walkingHeight(a,b));
    const road=nearest(x,z,clear);
    if(road&&Math.hypot(road[0]-x,road[1]-z)<180&&clear(...road)){arrive(...road);return;}
    if(clear(x,z)){arrive(x,z);return;}
    // A point chosen on the map may be inside a courtyard, a block or water.
    for(const radius of [2,5,12,24,45,90])for(let i=0;i<12;i++){
      const angle=i*Math.PI/6,a=x+Math.cos(angle)*radius,b=z+Math.sin(angle)*radius;
      if(clear(a,b)){arrive(a,b);return;}
    }
    if(landingTime>4){
      const refuge=lastSafe||spawn;
      if(Math.hypot(refuge.x-x,refuge.z-z)>1)requestLanding(refuge.x,refuge.z);
    }
  }
  function respawn(){const p=lastSafe||spawn;requestLanding(p.x,p.z);}
  function jump(){if(grounded&&!landing){vertical=3.45;grounded=false;restoredFloor=null;}}
  function restore(s){
    stop();const p=camera.position,g=walkingHeight(p.x,p.z);
    eye=MathUtils.clamp(s?.eyeHeight??1.7,1.05,1.7);
    feet=Number.isFinite(s?.feet)?s.feet:p.y-eye;
    vertical=Number.isFinite(s?.vertical)?s.vertical:0;
    grounded=s?.grounded??Math.abs(feet-g)<.08;landing=false;
    // Keep the saved pavement under a stationary visitor while sectors stream back.
    restoredFloor=grounded?feet:null;
    if(s?.lastSafe&&Number.isFinite(s.lastSafe.x)&&Number.isFinite(s.lastSafe.z))lastSafe={...s.lastSafe};
  }
  function tick(dt,mode,input,pad,ascend){
    const p=camera.position,prefs=input.prefs,held=input.held,walking=mode==='walk';
    if(walking&&landing){land(dt);return;}
    const f=+held('forward')-+held('back')+pad.z,s=+held('right')-+held('left')+pad.x;
    camera.getWorldDirection(forward);
    if(walking){forward.y=0;forward.normalize();}
    right.crossVectors(forward,up).normalize();
    wish.copy(forward).multiplyScalar(f).addScaledVector(right,s);
    if(!walking)wish.y+=+held('up')-+held('down')+ascend;
    if(wish.lengthSq()>1)wish.normalize();
    const crouch=walking&&held('down'),height=p.y-heightAt(p.x,p.z);
    const targetSpeed=walking?(crouch?.85:held('run')?3.05:1.36)*prefs.pace:input.flightSpeed(height)*(held('run')?3:1);
    wish.multiplyScalar(targetSpeed);
    velocity.lerp(wish,1-Math.exp(-dt*(walking?13:prefs.cinema?2.1:5)));
    if(velocity.lengthSq()<.0001)velocity.set(0,0,0);
    speed=velocity.length();
    if(!walking){
      p.x=MathUtils.clamp(p.x+velocity.x*dt,Math.min(bounds[0],p.x),Math.max(bounds[2],p.x));
      p.z=MathUtils.clamp(p.z+velocity.z*dt,Math.min(bounds[1],p.z),Math.max(bounds[3],p.z));
      p.y=Math.max(heightAt(p.x,p.z)+prefs.clearance,p.y+velocity.y*dt);return;
    }
    // Resolve each axis so the capsule can slide beside a façade. Short steps
    // also keep a dropped frame from carrying the walker through a thin wall.
    const steps=Math.max(1,Math.ceil(dt/.016)),h=dt/steps;
    const startX=p.x,startZ=p.z;
    for(let i=0;i<steps;i++){
      for(const axis of ['x','z']){
        if(!velocity[axis])continue;
        const nx=p.x+(axis==='x'?velocity.x*h:0),nz=p.z+(axis==='z'?velocity.z*h:0);
        if(nx<bounds[0]||nx>bounds[2]||nz<bounds[1]||nz>bounds[3])continue;
        const before=walkingHeight(p.x,p.z),after=walkingHeight(nx,nz),rise=after-before;
        // Distinguish a kerb or stair tread from a sustained steep bank.
        const dx=nx-p.x,dz=nz-p.z,distance=Math.abs(dx)+Math.abs(dz);
        let steep=false;
        if(distance&&Math.abs(rise)>distance){
          const probe=.45/distance;
          steep=Math.abs(walkingHeight(nx+dx*probe,nz+dz*probe)-walkingHeight(p.x-dx*probe,p.z-dz*probe))>.9+distance;
        }
        if(steep||rise>.31||rise<-.85||!safe(nx,nz,.32,feet)){velocity[axis]=0;continue;}
        p[axis]=axis==='x'?nx:nz;
      }
      if(p.x!==startX||p.z!==startZ)restoredFloor=null;
      const floor=restoredFloor??walkingHeight(p.x,p.z);
      if(grounded){feet=floor;vertical=0;}
      else{
        vertical-=9.81*h;feet+=vertical*h;
        if(feet<=floor&&vertical<=0){feet=floor;vertical=0;grounded=true;}
      }
    }
    speed=Math.hypot(p.x-startX,p.z-startZ)/Math.max(dt,.001);
    if(grounded&&speed>.05){lastSafe={x:p.x,z:p.z};stepPhase+=speed*dt*4.5;}
    eye=MathUtils.lerp(eye,crouch?1.08:1.7,1-Math.exp(-dt*12));
    p.y=feet+eye+(prefs.bob&&grounded?Math.sin(stepPhase)*.016*Math.min(1,speed):0);
    if(!Number.isFinite(p.y))respawn();
  }
  return {stop,requestLanding,respawn,jump,restore,tick,get speed(){return speed;},get landing(){return landing;},
    snapshot:()=>({feet,vertical,grounded,eyeHeight:eye,lastSafe})};
}
