import * as T from 'three';
import {createGlorietaSquare} from './glorieta-square.js';
import {buildGlorietaBuildings} from './glorieta-buildings.js';
import {buildRomeu} from './glorieta-romeu.js';

// The Atlas and the territorial registry both pass the native Atlas metre grid.
export function createGlorieta({heightAt,project,layout,buildings,visitData,guide,visitOnly=false}){
 const group=new T.Group(),detail=new T.Group();group.name='Glorieta · plaza del Cronista Chabret';
 const centre=project(...layout.anchors.general),footprint=ring=>ring.map(ll=>project(...ll));
 const focuses={};
 for(const stop of (visitData||guide).stops){
  const p=project(...stop.coordinate),target=new T.Vector3(p.x,heightAt(p.x,p.z)+stop.rise,p.z);
  focuses[stop.id]={target,offset:stop.offset,fitBounds:false,closeOffset:stop.offset.map(c=>c*.76)};
 }
 const bounds=new T.Box3(),framePoints=[];
 for(const q of footprint(layout.perimeter)){
  const foot=new T.Vector3(q.x,heightAt(q.x,q.z),q.z);
  bounds.expandByPoint(foot);framePoints.push(foot,foot.clone().add(new T.Vector3(0,11,0)));
 }
 bounds.max.y+=11;
 for(const key of ['glorieta-conjunto','glorieta-despedida','glorieta-comparar'])Object.assign(focuses[key],{bounds,framePoints,fitBounds:true});
 const exclusions=[footprint(layout.perimeter),...buildings.protectedFootprints.map(f=>footprint(f.coordinates))];
 let square,near=null,nightState,showVegetation=true;
 const lamps=[],windows=[];
 const leafBatches=[];
 const distantCrown=new T.IcosahedronGeometry(.83,0);
 group.add(detail);
 function build(){
  if(square)return;
  square=createGlorietaSquare({layout,heightAt,project});
  const romeu=buildRomeu(),p=project(...layout.anchors.romeu);
  romeu.position.set(p.x,heightAt(p.x,p.z)+.14,p.z);romeu.name='Monumento a José Romeu · 1976';
  const street=buildGlorietaBuildings(buildings,heightAt);
  street.traverse(o=>{if(o.userData.materialKind==='glass')windows.push(o.material);});
  for(let i=0;i<layout.lamps.length;i+=Math.ceil(layout.lamps.length/4)){
   const q=project(...layout.lamps[i]),lamp=new T.PointLight('#ffd9a8',0,20,2);
   lamp.position.set(q.x+.89,heightAt(q.x,q.z)+5.7,q.z);square.group.add(lamp);lamps.push(lamp);
  }
  for(const mesh of square.vegetation.children){
   if(mesh.isInstancedMesh&&/ · (leaves|needles)$/.test(mesh.name))leafBatches.push([mesh,mesh.geometry]);
  }
  square.vegetation.visible=showVegetation;
  detail.add(square.group,street,romeu);group.updateMatrixWorld(true);
 }
 build();
 function animate(seconds,water,night,camera){
  const close=visitOnly||!camera||Math.hypot(camera.position.x-centre.x,camera.position.z-centre.z,camera.position.y-heightAt(centre.x,centre.z))<580;
  if(close!==near){
   for(const [mesh,foliage] of leafBatches)mesh.geometry=close?foliage:distantCrown;
   near=close;
  }
  square.setWater(water&&near);if(near)square.update(seconds);
  if(night!==nightState){nightState=night;square.setNight(night);
   for(const lamp of lamps){lamp.visible=night;lamp.intensity=night?65:0;}
   for(const glass of windows){glass.emissive.setHex(0xa68857);glass.emissiveIntensity=night?.32:0;}}
 }
 const visit={focuses,selectFocus(){},setReadingMode(){}};
 return {group,visit,exclusions,excludedBuildingIds:buildings.excludedBuildingIds,animate,
  setVegetation(show){showVegetation=show;if(square)square.vegetation.visible=show;}};
}
