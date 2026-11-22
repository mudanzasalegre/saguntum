import * as THREE from 'three';
import {Water} from '../assets/vendor/Water.js';
import {createShoreField,createWaveNormals,installCoastalWaterShader} from './coast-water.js';

function inside(x,z,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++)if((ring[i].z>z)!==(ring[j].z>z)&&x<(ring[j].x-ring[i].x)*(z-ring[i].z)/(ring[j].z-ring[i].z)+ring[i].x)yes=!yes;return yes;}
export function createWaterMask(data,project){
 const polygons=data.polygons.map(p=>{const outer=p.outer.map(c=>project(...c)),holes=(p.holes||[]).map(h=>h.map(c=>project(...c)));return{outer,holes,minX:Math.min(...outer.map(p=>p.x)),maxX:Math.max(...outer.map(p=>p.x)),minZ:Math.min(...outer.map(p=>p.z)),maxZ:Math.max(...outer.map(p=>p.z))};});
 const isWater=(x,z)=>polygons.some(p=>x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ&&inside(x,z,p.outer)&&!p.holes.some(h=>inside(x,z,h)));
 return{polygons,isWater,groundHeight:(heightAt)=>(x,z)=>isWater(x,z)?-8.5:heightAt(x,z)};
}
export function createWaterGeometry(mask){
 const shapes=mask.polygons.map(p=>{const shape=new THREE.Shape(p.outer.map(v=>new THREE.Vector2(v.x,-v.z)));for(const h of p.holes)shape.holes.push(new THREE.Path(h.map(v=>new THREE.Vector2(v.x,-v.z))));return shape;});
 return new THREE.ShapeGeometry(shapes);
}
export function createCoastEnvironment({data,project,heightAt,mask,mobile=false,reduced=false}){
 const group=new THREE.Group();group.name='Mar y litoral';
 const shore=createShoreField({data,project,mask,mobile});
 const water=new Water(createWaterGeometry(mask),{textureWidth:mobile?384:768,textureHeight:mobile?384:768,waterNormals:createWaveNormals(),sunDirection:new THREE.Vector3(-1,.7,.1).normalize(),sunColor:0xffdfa4,waterColor:0x195f73,alpha:1,fog:true});
 installCoastalWaterShader(water,shore);
 water.name='Mediterráneo · superficie costera';water.rotation.x=-Math.PI/2;water.position.y=data.waterLevelM??.08;water.userData.water=true;water.userData.bathymetry='Surface colour varies by distance from the mapped shore, not measured depth. Display seabed remains illustrative.';group.add(water);
 const nativeRender=water.onBeforeRender,reflectionTargets=new Set(),lastCamera=new THREE.Matrix4(),lastProjection=new THREE.Matrix4();let lastReflection=-Infinity,force=true,disposed=false;
 water.onBeforeRender=function(renderer,scene,camera){
  if(disposed)return;const now=performance.now();water.material.uniforms.eye.value.setFromMatrixPosition(camera.matrixWorld);
  const moving=!lastCamera.equals(camera.matrixWorld)||!lastProjection.equals(camera.projectionMatrix);
  if(force||now-lastReflection>(moving?(mobile?50:33):(mobile?220:160))){
   const setTarget=renderer.setRenderTarget,previous=renderer.getRenderTarget(),xr=renderer.xr.enabled,shadows=renderer.shadowMap.autoUpdate,visible=water.visible;
   renderer.setRenderTarget=function(target,...rest){if(target?.texture===water.material.uniforms.mirrorSampler.value)reflectionTargets.add(target);return setTarget.call(this,target,...rest);};
   try{nativeRender.call(this,renderer,scene,camera);force=false;lastReflection=now;lastCamera.copy(camera.matrixWorld);lastProjection.copy(camera.projectionMatrix);}finally{renderer.setRenderTarget=setTarget;setTarget.call(renderer,previous);renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadows;water.visible=visible;}
  }
 };
 // Low vegetation uses a restricted shoreline band, never a fabricated wetland.
 const vegetation=new THREE.Group();vegetation.name='Matorral litoral interpretativo';const positions=[];
 const coast=data.coastline.map(c=>({coordinate:c,...project(...c)}));
 let seed=27026;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=1;i<coast.length;i++){
  const a=coast[i-1],b=coast[i];if(a.coordinate[1]<39.632||a.coordinate[1]>39.641||a.coordinate[0]>-.228)continue;
  const length=Math.hypot(b.x-a.x,b.z-a.z);if(length>150)continue;
  for(let d=4;d<length;d+=7+random()*5){const t=d/length,nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length,side=3+random()*5;let x=a.x+(b.x-a.x)*t+nx*side,z=a.z+(b.z-a.z)*t+nz*side;if(mask.isWater(x,z)){x-=nx*side*2;z-=nz*side*2;}const y=heightAt(x,z);if(mask.isWater(x,z)||y<.25||y>5)continue;positions.push({x,y,z,scale:.45+random()*.6});}
 }
 const scrub=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#8c9868',roughness:1}),positions.length),m=new THREE.Matrix4(),q=new THREE.Quaternion();scrub.name='Matices de vegetación litoral';
 positions.forEach((p,i)=>{m.compose(new THREE.Vector3(p.x,p.y+.15,p.z),q,new THREE.Vector3(p.scale,p.scale*.38,p.scale*.7));scrub.setMatrixAt(i,m);scrub.setColorAt(i,new THREE.Color().setHSL(.19+random()*.04,.18,.35+random()*.12));});scrub.castShadow=true;scrub.receiveShadow=true;vegetation.add(scrub);group.add(vegetation);
 return{group,water,vegetation,shore,stats:{reflectionSize:mobile?384:768,reflectionIntervalMovingMs:mobile?50:33,reflectionIntervalRestingMs:mobile?220:160,shoreField:[shore.width,shore.height],shoreSamplesMetres:[shore.bounds.z/shore.width,shore.bounds.w/shore.height],normalIncidenceReflectance:.020,wavelengthsMetres:[25,15.3,10.5,6.8,4.7],vegetationClumps:positions.length,seabed:'Expository −8.5 m; original MDT retained',surface:'Mapped shore gradient, filtered multi-scale waves and camera-aware planar reflection'},dispose(){if(disposed)return;disposed=true;water.onBeforeRender=()=>{};const captured=new Set();for(const target of reflectionTargets){captured.add(target.texture);target.dispose();}if(!captured.has(water.material.uniforms.mirrorSampler.value))water.material.uniforms.mirrorSampler.value.dispose();water.material.uniforms.normalSampler.value.dispose();shore.texture.dispose();water.geometry.dispose();water.material.dispose();group.remove(water);},update(delta){if(!disposed&&!reduced&&water.visible)water.material.uniforms.time.value+=Math.max(0,Math.min(.1,delta));},invalidate(){force=true;},setInspection(value){water.visible=!value;force=true;},setLight(mode){const day=mode==='day',u=water.material.uniforms;u.sunColor.value.set(day?'#fff5df':'#ffdfa4');u.sunDirection.value.set(...(day?[-650,1600,-700]:[-1000,700,100])).normalize();u.waterColor.value.set(day?'#195f73':'#205b69');u.shallowColor.value.set(day?'#589e9c':'#75a396');u.foamColor.value.set(day?'#d5e7de':'#e3dcca');u.sunStrength.value=day?1:1.2;force=true;}};
}
