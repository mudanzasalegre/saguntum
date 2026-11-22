import {Vector3,MathUtils} from 'three';
import {registerFrame} from './territory-heritage-catalog.js';

// Measurements at the two reference openings of the Atlas. Interpolate in
// inverse aspect, since the horizontal fit of a perspective camera scales
// with viewport height/width. Keep the measured endpoints on wider screens.
const wide=1440/900,portrait=390/844;
export function stopCamera(stop,place,{heightAt,project,aspect,frame}){
  if(!stop||!frame)return null;
  const basis=registerFrame(place,project);
  const [x,y,z]=frame.target;
  const here=basis.world(x,z),dy=heightAt(here.x,here.z)-frame.ground;
  const target=new Vector3(here.x,y+dy,here.z);
  const t=MathUtils.clamp((1/aspect-1/wide)/(1/portrait-1/wide),0,1);
  const sourceEye=new Vector3().fromArray(frame.wide.eye).lerp(new Vector3().fromArray(frame.portrait.eye),t);
  const position=basis.world(sourceEye.x,sourceEye.z);
  const eye=new Vector3(position.x,sourceEye.y+dy,position.z);
  const aperture=f=>Math.tan(MathUtils.degToRad(f*.5));
  const fov=2*MathUtils.radToDeg(Math.atan(MathUtils.lerp(aperture(frame.wide.fov),aperture(frame.portrait.fov),t)));
  return {target,eye,fov};
}
