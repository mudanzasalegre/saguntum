import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {createCoastGrau} from '../../dist/js/coast-grau.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(512,512)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json','utf8')),project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),heightAt=createHeightSampler(read('coast-elevation'));
const site=createCoastGrau({heightAt,project,records:read('coast-grau').sites,grauVisit:read('grau-visit'),grauContextData:{enabled:true}}).sites['grau-vell'],v=site.visit;site.group.updateMatrixWorld(true);const meshes=[];site.group.traverse(m=>{if(m.isMesh)meshes.push(m);});const results=[],ray=new THREE.Raycaster();
for(const q of Object.values(v.focuses).filter(f=>f.interiorView))for(const close of[false,true]){
 v.selectFocus(q.id);v.setSection(true);const offset=close?q.closeOffset:q.offset,position=q.target.clone().add(new THREE.Vector3(...offset)),d=q.target.clone().sub(position);ray.set(position,d.clone().normalize());ray.far=d.length()-.25;const hits=ray.intersectObjects(meshes.filter(m=>m.visible&&m.material.opacity>.5));
 // A tiny spherical volume around the camera must be clear of opaque geometry.
 const clearance=[];for(const axis of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){ray.set(position,new THREE.Vector3(...axis));ray.far=.12;clearance.push(...ray.intersectObjects(meshes.filter(m=>m.visible&&m.material.opacity>.5)));}
 results.push({id:q.id,close,position:position.toArray(),target:q.target.toArray(),lineOfSightBlocked:hits.map(h=>({component:h.object.userData.component,distance:h.distance})),cameraInsideMesh:clearance.map(h=>({component:h.object.userData.component,distance:h.distance}))});
}
const errors=results.filter(r=>r.lineOfSightBlocked.length||r.cameraInsideMesh.length);fs.writeFileSync('research/validation-v32/grau-interior-camera-qa.json',JSON.stringify({pass:errors.length===0,cases:results.length,errors,results},null,2)+'\n');console.log(JSON.stringify({pass:errors.length===0,cases:results.length,errors},null,2));site.dispose();if(errors.length)process.exitCode=1;
