import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {createWaterMask,createCoastEnvironment,createWaterGeometry} from '../../dist/js/coast-environment.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const out='research/validation-v31',read=n=>JSON.parse(fs.readFileSync(`dist/assets/data/${n}.json`));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const data=read('coast-water'),heightAt=createHeightSampler(read('coast-elevation')),mask=createWaterMask(data,project);
const checks=[],errors=[],check=(pass,label,detail)=>{checks.push({pass:!!pass,label,...(detail===undefined?{}:{detail})});if(!pass)errors.push(label);};
const started=performance.now(),env=createCoastEnvironment({data,project,heightAt,mask}),elapsed=performance.now()-started;
const water=env.water,u=water.material.uniforms,shore=env.shore;
check(env.shore.width*env.shore.height<=800000&&env.shore.segments<500,'Desktop field has bounded allocations and shoreline inputs',{samples:env.shore.width*env.shore.height,segments:env.shore.segments,observedInitialisationMs:Math.round(elapsed)});
const oldGeometry=createWaterGeometry(mask);
check(water.geometry.getAttribute('position').count===oldGeometry.getAttribute('position').count&&water.geometry.index.count===oldGeometry.index.count,'Mapped shoreline and water triangulation preserved');oldGeometry.dispose();
check(water.receiveShadow===true,'Piers and quay structures can cast shadows on the water');
check(!water.material.transparent&&u.alpha.value===1,'Illustrative display seabed is not exposed through an alpha fade');
const nearest=(x,z)=>{
 let d=Infinity;for(let i=1;i<data.coastline.length;i++){const a=project(...data.coastline[i-1]),b=project(...data.coastline[i]),dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/Math.max(l,.00001)));d=Math.min(d,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));}return d;
};
let maxDistanceError=0,near=0,deep=0,outerRim=0;
for(let z=2600;z<5900;z+=85)for(let x=3200;x<7800;x+=85)if(mask.isWater(x,z)){
 const sample=shore.sample(x,z),real=nearest(x,z);maxDistanceError=Math.max(maxDistanceError,Math.abs(sample.distance-Math.min(224,real)));
 if(real<12)near++;if(real>180)deep++;
 if(((x-5325)/2500)**2+((z-4225)/1750)**2>.94&&real>160){outerRim++;check(sample.distance>160,'No artificial foam at the atlas cropping rim',{x,z});}
}
check(maxDistanceError<.0001&&near>0&&deep>0,'Spatial field agrees with exact shoreline distance and spans near/deep water',{maxDistanceError,near,deep,outerRim});
const oldTime=u.time.value;env.update(.016);check(u.time.value>oldTime,'Water animation advances');env.update(100);check(u.time.value-oldTime<.12,'Background-tab time jump is clamped');
env.setInspection(true);const pausedTime=u.time.value;env.update(.05);check(!water.visible&&u.time.value===pausedTime,'Inspection hides water and pauses its surface animation');env.setInspection(false);check(water.visible,'Leaving inspection restores water');
env.setLight('day');const dayColor=u.waterColor.value.clone();env.setLight('golden');check(!dayColor.equals(u.waterColor.value)&&u.sunStrength.value>1,'Daylight and golden light adjust surface palette and sun highlight');env.setLight('day');

const scene=new THREE.Scene();scene.add(env.group);scene.updateMatrixWorld(true);
const camera=new THREE.PerspectiveCamera(38,1,.1,20000);camera.position.set(6500,150,3400);camera.lookAt(6600,0,3200);camera.updateMatrixWorld(true);
let target={name:'main'},renders=0,failed=false;const main=target,renderTargets=new Set();
const setTarget=function(t){if(t?.texture===u.mirrorSampler.value)renderTargets.add(t);target=t;};
const renderer={getRenderTarget:()=>target,setRenderTarget:setTarget,xr:{enabled:true},shadowMap:{autoUpdate:true},state:{buffers:{depth:{setMask(){}}}},autoClear:true,render(){renders++;if(failed)throw Error('reflection test failure');}};
// Use a controlled frame clock: concurrent geometry/raster jobs can suspend this
// process, which must not turn a throttling unit check into a machine-load test.
let frameMs=1000;Object.defineProperty(performance,'now',{value:()=>frameMs,configurable:true});
water.onBeforeRender(renderer,scene,camera);check(renders===1&&renderTargets.size===1,'Native reflected scene renders into the owned target');
check(target===main&&renderer.xr.enabled&&renderer.shadowMap.autoUpdate&&water.visible&&renderer.setRenderTarget===setTarget,'Native reflection restores renderer and visibility state');
water.onBeforeRender(renderer,scene,camera);check(renders===1,'Stationary camera reuses the latest reflection during its frame budget');
camera.position.x+=4;camera.updateMatrixWorld(true);frameMs+=38;water.onBeforeRender(renderer,scene,camera);check(renders===2,'Moving camera refreshes its reflection before the slower idle interval');
check(u.eye.value.distanceTo(camera.position)<.00001,'Eye-dependent Fresnel uses the current camera');
failed=true;env.invalidate();let caught=false;try{water.onBeforeRender(renderer,scene,camera);}catch(e){caught=e.message==='reflection test failure';}
check(caught&&target===main&&renderer.xr.enabled&&renderer.shadowMap.autoUpdate&&water.visible,'Reflection failure safely restores target, XR, shadows and water visibility');failed=false;
delete performance.now;

const expand=source=>source.replace(/^[ \t]*#include +<([\w\d_]+)>/gm,(_,name)=>{if(!THREE.ShaderChunk[name])throw Error(`Missing shader chunk ${name}`);return expand(THREE.ShaderChunk[name]);});
const defines=`#version 300 es\nprecision highp float;\nprecision highp int;\n#define NUM_DIR_LIGHTS 0\n#define NUM_POINT_LIGHTS 0\n#define NUM_SPOT_LIGHTS 0\n#define NUM_RECT_AREA_LIGHTS 0\n#define NUM_HEMI_LIGHTS 0\n#define NUM_DIR_LIGHT_SHADOWS 0\n#define NUM_POINT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_MAPS 0\n#define NUM_SPOT_LIGHT_COORDS 0\n#define NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS 0\n#define USE_FOG\n#define FOG_EXP2\n`;
const fragmentPrefix=defines+`#define varying in\n#define texture2D texture\n#define textureCube texture\nlayout(location = 0) out highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform mat4 viewMatrix;\nuniform vec3 cameraPosition;\nuniform bool isOrthographic;\n#define TONE_MAPPING\n`+THREE.ShaderChunk.tonemapping_pars_fragment+`\nvec3 toneMapping(vec3 color){return ACESFilmicToneMapping(color);}\n`+THREE.ShaderChunk.colorspace_pars_fragment+`\nvec4 linearToOutputTexel(vec4 value){return sRGBTransferOETF(value);}\n`;
const vertexPrefix=defines+`#define attribute in\n#define varying out\n#define texture2D texture\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\nuniform vec3 cameraPosition;\nuniform bool isOrthographic;\nin vec3 position;\nin vec3 normal;\n`;
fs.writeFileSync(`${out}/water-fragment.glsl`,fragmentPrefix+expand(water.material.fragmentShader));
fs.writeFileSync(`${out}/water-vertex.glsl`,vertexPrefix+expand(water.material.vertexShader));
fs.writeFileSync(`${out}/water-normals.rgba`,u.normalSampler.value.image.data);
fs.writeFileSync(`${out}/water-shore.rgba`,shore.texture.image.data);
const worldWater=water.geometry.clone().applyMatrix4(water.matrixWorld).toNonIndexed();
fs.writeFileSync(`${out}/water-mesh.f32`,new Uint8Array(worldWater.getAttribute('position').array.buffer));worldWater.dispose();
fs.writeFileSync(`${out}/water-shader-input.json`,JSON.stringify({normalSize:[128,128],shoreSize:[shore.width,shore.height],shoreBounds:shore.bounds.toArray(),stats:env.stats,uniforms:Object.fromEntries(['waterColor','shallowColor','foamColor','sunColor','sunDirection'].map(k=>[k,u[k].value.toArray()])),sourceHashes:Object.fromEntries(['dist/js/coast-environment.js','dist/js/coast-water.js','dist/assets/vendor/Water.js','dist/assets/data/coast-water.json'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))},null,2));
const disposeCounts={target:0,shore:0,normal:0,material:0,geometry:0};
for(const t of renderTargets)t.addEventListener('dispose',()=>disposeCounts.target++);
shore.texture.addEventListener('dispose',()=>disposeCounts.shore++);u.normalSampler.value.addEventListener('dispose',()=>disposeCounts.normal++);water.material.addEventListener('dispose',()=>disposeCounts.material++);water.geometry.addEventListener('dispose',()=>disposeCounts.geometry++);
env.dispose();env.dispose();check(Object.values(disposeCounts).every(n=>n===1),'Reflection target, shore texture, normals, material and geometry disposed once',disposeCounts);check(!env.group.children.includes(water),'Disposed water removed before generic region resource traversal');
const mobileStarted=performance.now(),mobile=createCoastEnvironment({data,project,heightAt,mask,mobile:true,reduced:true});const mobileTime=mobile.water.material.uniforms.time.value;mobile.update(.1);check(mobile.water.material.uniforms.time.value===mobileTime,'Reduced-motion preference keeps the surface still');check(mobile.stats.reflectionSize<env.stats.reflectionSize&&mobile.shore.width<shore.width,'Mobile reflection and distance-field allocations are bounded');const mobileMs=performance.now()-mobileStarted;mobile.dispose();
const result={pass:errors.length===0,browserVerified:false,checks,errors,desktopInitialisationMs:elapsed,mobileInitialisationMs:mobileMs,stats:env.stats};
fs.writeFileSync(`${out}/water-checks.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,checks:checks.length,errors,desktopMs:Math.round(elapsed),mobileMs:Math.round(mobileMs),stats:env.stats},null,2));if(errors.length)process.exitCode=1;
