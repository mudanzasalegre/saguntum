import * as THREE from 'three';
import {createWaterMask,createCoastEnvironment} from './coast-environment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

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
export function createTerritorySea({polygons,bounds,shorelines=[],project,heightAt,mobile=false,reduced=false}){
 if(!polygons?.length)throw Error('Falta el polígono marino de la cartografía.');
 const metric=(x,z)=>({x,z}),mask=createWaterMask({polygons},metric);
 // Geographic coordinates are needed only by the original broad beach/port
 // colour classification. Geometry retains the exact input metric vertices.
 const lon=-.21,lat=39.66,c=project(lon,lat),e=project(lon+.001,lat),n=project(lon,lat+.001);
 const a=(e.x-c.x)*1000,b=(n.x-c.x)*1000,d=(e.z-c.z)*1000,f=(n.z-c.z)*1000,det=a*f-b*d;
 const lines=shorelines.map(line=>line.map(([x,z])=>({x,z,lon:lon+((x-c.x)*f-(z-c.z)*b)/det,lat:lat+((z-c.z)*a-(x-c.x)*d)/det})));
 const data={projectedShorelines:lines,waterLevelM:.08};
 const env=createCoastEnvironment({data,project:metric,heightAt,mask,mobile,reduced});
 if(bounds)offshoreHorizon(env.water,mask,bounds);
 env.water.material.defines={...env.water.material.defines,TERRITORIAL_COAST:1};
 const u=env.water.material.uniforms;
 Object.assign(u,{inspectPort:{value:false},inspectionOrigin:{value:new THREE.Vector2()},inspectionU:{value:new THREE.Vector2()},inspectionV:{value:new THREE.Vector2()}});
 const palette=['#195f73','#205b69','#081a25','#589e9c','#75a396','#142d36','#d5e7de','#e3dcca','#516675','#fff5df','#ffdfa4'].map(c=>new THREE.Color(c));
 let last=-1,lastY=Infinity;
 return {group:env.group,water:env.water,stats:env.stats,mask,update:env.update,
  setInspection(cut){
   u.inspectPort.value=!!cut;
   if(cut){u.inspectionOrigin.value.set(cut[0],cut[1]);u.inspectionU.value.set(cut[2],cut[3]);u.inspectionV.value.set(cut[4],cut[5]);}
  },
  setAtlasLight(mode){last=-1;lastY=Infinity;env.setLight(mode);},
  setSun(direction,daylight){
   const light=THREE.MathUtils.clamp(daylight,0,1);
   u.sunDirection.value.copy(direction).normalize();
   if(Math.abs(last-light)<.002&&Math.abs(lastY-u.sunDirection.value.y)<.002)return;
   last=light;lastY=u.sunDirection.value.y;
   const sunset=1-THREE.MathUtils.smoothstep(lastY,.1,.7);
   u.waterColor.value.copy(palette[0]).lerp(palette[1],sunset).lerp(palette[2],1-light);
   u.shallowColor.value.copy(palette[3]).lerp(palette[4],sunset).lerp(palette[5],1-light);
   u.foamColor.value.copy(palette[6]).lerp(palette[7],sunset).lerp(palette[8],1-light);
   u.sunColor.value.copy(palette[9]).lerp(palette[10],sunset);
   u.sunStrength.value=(1+.2*sunset)*light;
   env.invalidate();
  },
  dispose(){
   env.dispose();
   env.vegetation.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();o.material?.dispose();});
   env.group.removeFromParent();
  }};
}
