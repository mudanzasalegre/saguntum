import {EAST_STOPS} from './castle-east-layout.js';

// Detail eyes follow the current cartographic visitor paths. These are digital
// observation points, not a declaration of physical accessibility at the site.
export const EAST_CAMERA_EYES=[
 {id:'almenara',eyeCoordinates:[-.2761072,39.6762588],eyeHeight:1.9,horizontalDistance:105,overviewRise:78},
 ...EAST_STOPS.map(stop=>({...stop,
  // The north return stands above eye level. Observe the roofless southern
  // dependency over its surviving low wall from the mapped southwest path.
  eyeCoordinates:stop.id==='almenara-dependencias'?[-.275996,39.675992]:stop.id==='almenara-aljibes'?[-.2756723,39.6764813]:stop.eyeCoordinates,
  eyeHeight:stop.id==='almenara-aljibes'?2:1.9,
  horizontalDistance:stop.id==='almenara-aljibes'?12:stop.id==='almenara-baluarte'?40:30,
  overviewRise:stop.id==='almenara-aljibes'?28:stop.id==='almenara-baluarte'?32:24}))
];

/** Call after generic camera clamping so the authored pedestrian eye survives. */
export function applyEastCamera({id,target,offset,closeOffset,heightAt,project,eastQA}){
 const spec=EAST_CAMERA_EYES.find(value=>value.id===id);if(!spec)return {};
 if(id==='almenara-aljibes'){
  const deposit=eastQA?.openDeposits?.find(feature=>feature.id==='ruin-733215263');
  target.y=Number.isFinite(deposit?.floorY)?deposit.floorY+.25:heightAt(target.x,target.z)+.1;
 }
 const point=project(...spec.eyeCoordinates),dx=point.x-target.x,dz=point.z-target.z;
 const length=Math.hypot(dx,dz)||1,scale=spec.horizontalDistance/length;
 offset.splice(0,3,dx*scale,spec.overviewRise,dz*scale);
 offset[1]=Math.max(offset[1],heightAt(target.x+offset[0],target.z+offset[2])+4-target.y);
 closeOffset.splice(0,3,dx,heightAt(point.x,point.z)+spec.eyeHeight-target.y,dz);
 return {closeScale:false,fov:id==='almenara-aljibes'?58:52,closeEyeCoordinates:spec.eyeCoordinates,closeEyeHeight:spec.eyeHeight};
}
