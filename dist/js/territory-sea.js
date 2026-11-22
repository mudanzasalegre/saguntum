import * as THREE from 'three';
import {createWaterMask,createCoastEnvironment} from './coast-environment.js';

// The same v32 Water, normals, Fresnel, shoreline colour, contact foam and
// reflection scheduler render a single territorial sea mask with its islands.
export function createTerritorySea({polygons,shorelines=[],project,heightAt,mobile=false,reduced=false}){
 if(!polygons?.length)throw Error('Falta el polígono marino de la cartografía.');
 const metric=(x,z)=>({x,z}),mask=createWaterMask({polygons},metric);
 // Geographic coordinates are needed only by the original broad beach/port
 // colour classification. Geometry retains the exact input metric vertices.
 const lon=-.21,lat=39.66,c=project(lon,lat),e=project(lon+.001,lat),n=project(lon,lat+.001);
 const a=(e.x-c.x)*1000,b=(n.x-c.x)*1000,d=(e.z-c.z)*1000,f=(n.z-c.z)*1000,det=a*f-b*d;
 const lines=shorelines.map(line=>line.map(([x,z])=>({x,z,lon:lon+((x-c.x)*f-(z-c.z)*b)/det,lat:lat+((z-c.z)*a-(x-c.x)*d)/det})));
 const data={projectedShorelines:lines,waterLevelM:.08};
 const env=createCoastEnvironment({data,project:metric,heightAt,mask,mobile,reduced});
 const u=env.water.material.uniforms;
 const palette=['#195f73','#205b69','#081a25','#589e9c','#75a396','#142d36','#d5e7de','#e3dcca','#516675','#fff5df','#ffdfa4'].map(c=>new THREE.Color(c));
 let last=-1,lastY=Infinity;
 return {group:env.group,water:env.water,stats:env.stats,mask,update:env.update,
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
