// Focused regression for the orbit flicker observed in the supplied v47 video.
// Checks the actual Three projection for both depth conventions, without a GPU.
// Run: node research/test-camera-depth.mjs [--json report.json]
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {registerThreeTestLoader} from './three-test-loader.mjs';
registerThreeTestLoader();
const {PerspectiveCamera,Vector3,WebGLCoordinateSystem,WebGPUCoordinateSystem}=await import('three');
const {cameraNearPlane}=await import('../dist/js/camera-depth.js');
const results=[],checks=[];
function test(name,run){run();checks.push({name,pass:true});}
const units=2**24-1;
function camera(near,far,coordinateSystem){const c=new PerspectiveCamera(38,1.4,near,far);c.coordinateSystem=coordinateSystem;c.updateProjectionMatrix();return c;}
function depth(c,d){const z=new Vector3(0,0,-d).applyMatrix4(c.projectionMatrix).z;return c.coordinateSystem===WebGLCoordinateSystem?z*.5+.5:z;}
function unresolved(c,start,end,gap){let count=0,samples=0;for(let d=start;d<=end;d+=.017){samples++;if(Math.round(depth(c,d)*units)===Math.round(depth(c,d-gap)*units))count++;}return {count,samples,fraction:count/samples};}
test('Close, interior and pedestrian views retain 12 cm, including a distant pivot',()=>{
 for(const range of [0,4,12,32,140,350,6500]){
  assert.equal(cameraNearPlane({range,interior:true}),.12);
  assert.equal(cameraNearPlane({range,pedestrian:true}),.12);
  assert.equal(cameraNearPlane({range,clearance:1.55}),.12);
  assert.equal(cameraNearPlane({range,clearance:8}),.12);
  if(range<=32)assert.equal(cameraNearPlane({range}),.12);
 }
});
test('Orbit depth changes continuously across the former 450/2600 m bands',()=>{
 for(const range of [32,140,450,517,2600])assert.ok(Math.abs(cameraNearPlane({range:range+.001})-cameraNearPlane({range:range-.001}))<=.0000161);
});
test('Low views constrain the near plane and malformed readings fail close',()=>{
 assert.ok(cameraNearPlane({range:6500,clearance:10})<.33);
 assert.equal(cameraNearPlane({range:6500,clearance:NaN}),.12);
 assert.equal(cameraNearPlane({range:NaN}),.12);
 for(const range of [-10,0,32,350,6500,1e6])for(const clearance of [-3,1.55,8,15,100,Infinity]){
  const n=cameraNearPlane({range,clearance});assert.ok(n>=.12&&n<=4&&Number.isFinite(n));
 }
});
for(const [backend,convention,far]of [['Atlas WebGL',WebGLCoordinateSystem,25000],['Simulator WebGL',WebGLCoordinateSystem,65000],['Simulator WebGPU',WebGPUCoordinateSystem,65000]]){
 test(`${backend}: projected framing, close surfaces and far horizon remain valid`,()=>{
  const before=camera(.12,far,convention),after=camera(cameraNearPlane({range:350,clearance:120}),far,convention);
  for(const p of [[2,3,-20],[30,100,-350],[1500,700,-9000]]){
   const a=new Vector3(...p).applyMatrix4(before.projectionMatrix),b=new Vector3(...p).applyMatrix4(after.projectionMatrix);
   assert.ok(Math.abs(a.x-b.x)<1e-12&&Math.abs(a.y-b.y)<1e-12);
  }
  assert.ok(depth(before,.13)>0&&depth(before,.13)<1);
  assert.ok(depth(after,far*.95)>0&&depth(after,far*.95)<1);
  assert.ok(depth(after,after.near*.99)<0);
  assert.equal(after.far,far);
 });
 test(`${backend}: 4.5 cm facade separation and 1 cm roof relief remain resolvable at city scale`,()=>{
  for(const range of [140,200,350,500]){
   const before=camera(.12,far,convention),near=cameraNearPlane({range,clearance:120}),after=camera(near,far,convention);
   for(const gap of [.045,.01]){
    const old=unresolved(before,range*.98,range*1.02,gap),now=unresolved(after,range*.98,range*1.02,gap);
    assert.equal(now.count,0,`${backend}, ${range} m, ${gap} m gap`);
    results.push({backend,range,gap,near,oldUnresolved:old,newUnresolved:now});
   }
  }
 });
}
const report={pass:true,checks:checks.length,results:checks,precision:{method:'Quantization of the shipped Three perspective matrix to normalized 24-bit depth; analytical bound, not browser performance or a claim about the user GPU.',samples:results}};
const i=process.argv.indexOf('--json');if(i>=0){assert.ok(process.argv[i+1]);fs.writeFileSync(process.argv[i+1],JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({pass:true,checks:checks.length,depthCases:results.length,oldUnresolved:results.reduce((sum,r)=>sum+r.oldUnresolved.count,0),newUnresolved:results.reduce((sum,r)=>sum+r.newUnresolved.count,0)}));
