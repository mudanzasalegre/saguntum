import fs from 'node:fs';
import * as THREE from 'three';
import {createSanatorioContext} from '../../dist/js/sanatorio-context.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(128,128)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('sanatorio-context'),context=createSanatorioContext({contextData:data,visitData:fs.existsSync('dist/assets/data/sanatorio-visit.json')?read('sanatorio-visit'):{},heightAt:createHeightSampler(read('port-elevation'))});
context.group.updateMatrixWorld(true);const ray=new THREE.Raycaster(),results=[];
for(const[id,f]of Object.entries(context.focuses))for(const kind of ['offset','closeOffset']){const eye=f.target.clone().add(new THREE.Vector3(...f[kind])),d=f.target.clone().sub(eye);ray.set(eye,d.clone().normalize());ray.near=.1;ray.far=d.length()-.35;const hits=ray.intersectObject(context.group,true);results.push({id,kind,eye:eye.toArray(),target:f.target.toArray(),clear:!hits.length,hits:hits.slice(0,4).map(h=>({name:h.object.name,distanceToTarget:h.point.distanceTo(f.target)}))});}
fs.writeFileSync('research/validation-v30/sanatorio-context-camera-rays.json',JSON.stringify({scope:'Actual context meshes only; parent checks combined production scene and core model',results},null,2)+'\n');console.log(JSON.stringify(results,null,2));context.dispose();
