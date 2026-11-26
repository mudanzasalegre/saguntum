// A folded notebook must release its scene area without moving the camera.
// These use the shipped Three.js camera rather than a simulated DOM/renderer.
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from '../dist/assets/vendor/three.module.js';
import {editorialSceneFrame} from '../dist/js/editorial-visibility.js';

const cases=[
  {name:'desktop',w:1280,h:900},
  {name:'compact desktop',w:1024,h:600},
  {name:'phone portrait',w:375,h:812},
  {name:'small phone portrait',w:320,h:568},
  {name:'phone landscape',w:812,h:375},
  {name:'tablet square visit',w:768,h:1024,place:'glorieta'}
];
const results=[];
for(const sample of cases){
  const {w,h,place}=sample;
  const opened=editorialSceneFrame(w,h,{place}),closed=editorialSceneFrame(w,h,{place,collapsed:true});
  assert(closed.width*closed.height>opened.width*opened.height,sample.name+': folding must increase the visible scene area');
  assert(closed.left>=0&&closed.right<=w&&closed.top>=0&&closed.bottom<=h&&closed.right>closed.left&&closed.bottom>closed.top,sample.name+': scene remains inside the viewport');
  const camera=new PerspectiveCamera(38,w/h,.12,25000),target=new Vector3(0,0,0);
  camera.position.set(0,0,10);camera.lookAt(target);camera.updateMatrixWorld(true);
  const position=camera.position.toArray(),orientation=camera.quaternion.toArray(),distance=camera.position.distanceTo(target);
  for(const frame of [opened,closed,opened]){
    camera.setViewOffset(w,h,frame.offsetX,frame.offsetY,w,h);camera.updateProjectionMatrix();
    const p=target.clone().project(camera),screenX=(p.x+1)*w/2,screenY=(1-p.y)*h/2;
    assert(Math.abs(screenX-(frame.left+frame.right)/2)<1e-8&&Math.abs(screenY-(frame.top+frame.bottom)/2)<1e-8,sample.name+': the same target stays centred in the usable scene');
    assert.deepEqual(camera.position.toArray(),position,sample.name+': camera position unchanged');
    assert.deepEqual(camera.quaternion.toArray(),orientation,sample.name+': camera orientation unchanged');
    assert.equal(camera.position.distanceTo(target),distance,sample.name+': viewing distance unchanged');
  }
  results.push({viewport:sample.name,size:[w,h],openedArea:opened.width*opened.height,foldedArea:closed.width*closed.height,cameraPosePreserved:true});
}
console.log(JSON.stringify({pass:true,cases:results},null,2));
