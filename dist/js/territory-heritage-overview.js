import * as THREE from 'three';
import {HORNO_FRAME,HORNO_SECTION_PROFILE} from './horno.js';
import {atlasProject,registerFrame} from './territory-heritage-catalog.js';
import {maskRing} from './territory-heritage-models.js';

// Small distant silhouettes use the same mapped walls, furnace section and
// jetty stationing as the visit. Ordinary urban buildings use their cadastral LOD.
export function overviewModels({places,records,area,project,heightAt}){
 const groups=new Map();
 function material(color){return new THREE.MeshStandardMaterial({color,roughness:.88});}
 function boxes(items,color){
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material(color),items.length);
  const transform=new THREE.Object3D();
  for(const [i,p] of items.entries()){
   transform.position.set(p.x,p.y,p.z);transform.rotation.set(0,p.yaw||0,0);transform.scale.set(p.w,p.h,p.d);
   transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
  }
  mesh.computeBoundingSphere();return mesh;
 }
 function footprints(boxes){
  return boxes.map(p=>{
   const c=Math.cos(p.yaw||0),s=Math.sin(p.yaw||0);
   return maskRing([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>({
    x:p.x+c*u*p.w/2+s*v*p.d/2,z:p.z-s*u*p.w/2+c*v*p.d/2
   })));
  });
 }
 const wall=[];
 function follow(coordinates,height,width){
  for(let i=1;i<coordinates.length;i++){
   const a=project(...coordinates[i-1]),b=project(...coordinates[i]);
   const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
   if(length<.1)continue;
   const n=Math.ceil(length/10);
   for(let j=0;j<n;j++){
    const t=(j+.5)/n,x=a.x+t*dx,z=a.z+t*dz;
    wall.push({x,z,y:heightAt(x,z)+height*.45,w:length/n+.12,d:width,h:height*1.1,yaw:-Math.atan2(dz,dx)});
   }
  }
 }
 follow(area.castlePolygon,5,2.45);
 for(const w of area.castleWalls)follow(w.coordinates,Number(w.height)||2.1,1.6);
 groups.set('castle',boxes(wall,0xc2a981));
 groups.get('castle').userData.claims=footprints(wall);
 const place=places.find(p=>p.id==='horno'),furnace=new THREE.Group(),centre=material(0x665951);
 furnace.add(new THREE.Mesh(new THREE.LatheGeometry(HORNO_SECTION_PROFILE.map(p=>new THREE.Vector2(p.outerRadius,p.y)),10),centre));
 const beams=[];
 for(const x of [-4.75,4.75])for(const z of [-3.85,3.85])beams.push({x,z,y:26.4,w:.59,h:50.8,d:.59});
 for(const y of [28.4,32.8,38.8,42,47.7,51]){
  for(const z of [-3.85,3.85])beams.push({x:0,z,y,w:10.1,h:.57,d:.44});
  for(const x of [-4.75,4.75])beams.push({x,z:0,y,w:.44,h:.57,d:8.1});
 }
 furnace.add(boxes(beams,0x624b3e));furnace.position.set(place.x,heightAt(place.x,place.z),place.z);
 furnace.rotation.y=HORNO_FRAME.yaw;
 groups.set('horno',furnace);
 furnace.userData.claims=[maskRing(Array.from({length:16},(_,i)=>({x:place.x+8.8*Math.cos(i*Math.PI/8),z:place.z+8.8*Math.sin(i*Math.PI/8)})))];
 const pier=records['pantalan-maritimo'].survey;
 if(pier?.axis){
  const p=places.find(p=>p.id==='pantalan-paseo'),frame=registerFrame(p,project);
  const a=atlasProject(...pier.axis.origin),[ux,uz]=pier.axis.unit;
  const decks=[];
  function deck(start,end,offset,width,level,thickness){
   const mid=(start+end)/2,point=frame.world(a.x+ux*mid-uz*offset,a.z+uz*mid+ux*offset);
   const direction=frame.world(a.x+ux*(mid+1)-uz*offset,a.z+uz*(mid+1)+ux*offset);
   decks.push({x:point.x,z:point.z,y:level-thickness/2,w:end-start,h:thickness,d:width,yaw:-Math.atan2(direction.z-point.z,direction.x-point.x)});
  }
  for(let start=-125;start<467.29;start+=12){
   const end=Math.min(467.29,start+12),mid=(start+end)/2;
   const level=mid< -30?1.8+(mid+125)*3.8/95:mid<367.29?5.6:5.6+(mid-367.29)*3.2/100;
   deck(start,end,mid< -25?-1.5:-6,mid< -25?5.7:15.35,level,1.25);
  }
  deck(1320,1592,1.4,20,5.78,1.5);
  for(const support of pier.preservedSupports){
   const q=project(...support.coordinate);
   decks.push({x:q.x,z:q.z,y:2.1,w:3,h:4.5,d:5.7});
  }
  groups.set('pantalan',boxes(decks,0xa59789));
  groups.get('pantalan').userData.claims=footprints(decks);
 }
 return groups;
}
