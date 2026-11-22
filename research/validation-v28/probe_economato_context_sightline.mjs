// Narrow follow-up to the integration finding: preserve all trees and move only
// the Almacenes observation line into the gap between the mapped rear crowns.
import fs from 'node:fs';
import * as THREE from 'three';
import {createEconomatoContext} from '../../dist/js/economato-context.js';
import {createGerenciaContext} from '../../dist/js/gerencia-context.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(128,128)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
// The new tree QA records all eight bases at exactly 5 m after the real atlas
// terrain bind. This local probe uses that already-tested ground datum only;
// it does not substitute for the parent's complete terrain/city validation.
const ec=createEconomatoContext({contextData:read('economato-context'),visitData:read('economato-visit'),project,heightAt:()=>5});
const ge=createGerenciaContext({contextData:read('gerencia-context'),visitData:read('gerencia-visit'),project,heightAt:()=>5});
const stop=read('economato-visit').stops.find(s=>s.id==='economato-almacenes');
const record=read('port-workers').sites.find(s=>s.id==='economato'),anchor=project(...record.coordinate),p=project(...stop.coordinate),sourceHeight=createHeightSampler(read('port-elevation'));
const target=new THREE.Vector3(p.x,sourceHeight(anchor.x,anchor.z)+stop.elevation,p.z);
const a=project(-.2219421,39.6591272),b=project(-.2214437,39.6588575),length=Math.hypot(b.x-a.x,b.z-a.z),ux=(b.x-a.x)/length,uz=(b.z-a.z)/length;
const rotate=([x,y,z])=>new THREE.Vector3(x*ux-z*uz,y,x*uz+z*ux);
const ray=new THREE.Raycaster(),checks=[];
for(const [name,offset]of [['full',[0,9,18]],['near',[0,5,12]]]){
    const eye=target.clone().add(rotate(offset));
    for(const owner of [ec,ge]){
        owner.group.updateMatrixWorld(true);const dir=target.clone().sub(eye);
        ray.set(eye,dir.clone().normalize());ray.near=.03;ray.far=dir.length()-.2;
        const hits=ray.intersectObject(owner.group,true);
        checks.push({label:name+' line clears '+owner.group.name,pass:hits.length===0,localOffset:offset,position:eye.toArray(),target:target.toArray(),hits:hits.slice(0,3).map(h=>({name:h.object.name,distanceToTarget:h.point.distanceTo(target)}))});
    }
}
const result={pass:checks.every(c=>c.pass),checks,limitation:'Focused context ray check using previously verified 5 m local ground. Parent runs the complete production scene and cameras.'};
fs.writeFileSync('research/validation-v28/economato-context-sightline-qa.json',JSON.stringify(result,null,2)+'\n');
ec.dispose();ge.dispose();console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
