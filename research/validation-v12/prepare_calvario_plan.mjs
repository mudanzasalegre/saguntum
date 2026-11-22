import fs from 'node:fs';
import {createCalvario} from '../../dist/js/calvario.js';
import {createCalvarioContext} from '../../dist/js/calvario-context.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256),querySelector:()=>({checked:true})};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json')),
landmarkData=read('landmarks'),landmarks=Object.fromEntries(landmarkData.sites.map(s=>[s.id,s])),record=landmarks.calvario,
project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),heightAt=createHeightSampler(read('elevation')),
visitData=fs.existsSync('dist/assets/data/calvario-visit.json')?read('calvario-visit'):null,contextData=read('calvario-context'),data=read('cartography');
const model=createCalvario({record,project,heightAt,visitData,contextData}),context=createCalvarioContext({data,landmarks,project,heightAt,contextData}),plan=model.group.userData.visit.plan;
plan.components.push(...context.plan.components);plan.contextOutline=context.plan.outline;
fs.writeFileSync('dist/assets/data/calvario-plan.json',JSON.stringify({schemaVersion:1,...plan},null,2));
fs.writeFileSync('research/validation-v12/calvario-focus-coordinates.json',JSON.stringify(Object.fromEntries(plan.stops.map(s=>[s.id,s.coordinates])),null,2));
console.log(JSON.stringify({stops:plan.stops,stats:model.group.userData.visit.stats},null,2));
