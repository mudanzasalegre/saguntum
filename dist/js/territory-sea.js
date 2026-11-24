import * as THREE from 'three';
import {createWaterMask,createCoastEnvironment} from './coast-environment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {solarWater,projectedShorelines} from './territory-coast-light.js';

function offshoreHorizon(water,mask,bounds){
 // Extend only marine edges clipped by the east/south sides of the dataset.
 // Keep mask, shoreline and navigation in their original geographic extent.
 const vertices=[];
 for(const {outer} of mask.polygons){
  for(let i=0,j=outer.length-1;i<outer.length;j=i++){
   const a=outer[j],b=outer[i];
   const cut=(Math.abs(a.x-bounds[2])<.05&&Math.abs(b.x-bounds[2])<.05)||
             (Math.abs(a.z-bounds[3])<.05&&Math.abs(b.z-bounds[3])<.05);
   if(!cut)continue;
   const start={x:a.x+33000,z:a.z+25000},end={x:b.x+33000,z:b.z+25000};
   // Wind both faces upward in Water's local XY plane (local Y = -northing offset).
   const ccw=(b.x-a.x)*(a.z-start.z)-(a.z-b.z)*(start.x-a.x)>0;
   for(const p of ccw?[a,b,start,b,end,start]:[a,start,b,b,start,end])vertices.push(p.x,-p.z,0);
  }
 }
 if(!vertices.length)return;
 const extension=new THREE.BufferGeometry(),base=water.geometry.toNonIndexed();
 extension.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 extension.computeVertexNormals();
 extension.setAttribute('uv',new THREE.Float32BufferAttribute(Array.from({length:vertices.length/3*2},()=>0),2));
 const combined=mergeGeometries([base,extension]);water.geometry.dispose();base.dispose();extension.dispose();water.geometry=combined;
}

// The same v32 Water, normals, Fresnel, shoreline colour, contact foam and
// reflection scheduler render a single territorial sea mask with its islands.
export function createTerritorySea({polygons,bounds,shorelines=[],project,heightAt,mobile=false,reduced=false,nativeEnvironment=null}){
 if(!polygons?.length)throw Error('Falta el polígono marino de la cartografía.');
 const metric=(x,z)=>({x,z}),mask=createWaterMask({polygons},metric);
 if(nativeEnvironment){
   const sea=nativeEnvironment.createNativeCoast({mask,shorelines,project,compact:mobile,reduced,manualClock:true});
   if(bounds)offshoreHorizon(sea.water,mask,bounds);
   return sea;
 }
 // Geographic coordinates are needed only by the original broad beach/port
 // colour classification. Geometry retains the exact input metric vertices.
 const lines=projectedShorelines(shorelines,project);
 const data={projectedShorelines:lines,waterLevelM:.08};
 const env=createCoastEnvironment({data,project:metric,heightAt,mask,mobile,reduced});
 if(bounds)offshoreHorizon(env.water,mask,bounds);
 env.water.material.defines={...env.water.material.defines,TERRITORIAL_COAST:1};
 const u=env.water.material.uniforms;
 Object.assign(u,{inspectPort:{value:false},inspectionOrigin:{value:new THREE.Vector2()},inspectionU:{value:new THREE.Vector2()},inspectionV:{value:new THREE.Vector2()}});
 let last=-1,lastY=Infinity,interval=0,previous=-Infinity;
 const reflect=env.water.onBeforeRender;
 env.water.onBeforeRender=function(renderer,scene,camera,...rest){
   const now=performance.now();
   if(now-previous>=interval){
     previous=now;reflect.call(this,renderer,scene,camera,...rest);
   }else u.eye.value.setFromMatrixPosition(camera.matrixWorld);
 };
 return {group:env.group,water:env.water,stats:env.stats,mask,
  update(dt,tier=2,speed=0){
   // Preserve the native texture and refresh immediately after a change of light.
   interval=tier===0?95:tier===1?55:0;
   if(speed>75&&tier<3)interval=Math.max(interval,75);
   env.update(dt);
  },
  setInspection(cut){
   u.inspectPort.value=!!cut;
   if(cut){u.inspectionOrigin.value.set(cut[0],cut[1]);u.inspectionU.value.set(cut[2],cut[3]);u.inspectionV.value.set(cut[4],cut[5]);}
  },
  setAtlasLight(mode,direction){last=-1;lastY=Infinity;previous=-Infinity;env.setLight(mode);if(direction)u.sunDirection.value.copy(direction);},
  setSun(direction,daylight){
   const light=THREE.MathUtils.clamp(daylight,0,1);
   u.sunDirection.value.copy(direction).normalize();
   if(Math.abs(last-light)<.002&&Math.abs(lastY-u.sunDirection.value.y)<.002)return;
   last=light;lastY=u.sunDirection.value.y;
   solarWater(u,lastY,light);
   previous=-Infinity;env.invalidate();
  },
  dispose(){
   env.dispose();
   env.vegetation.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();o.material?.dispose();});
   env.group.removeFromParent();
  }};
}
