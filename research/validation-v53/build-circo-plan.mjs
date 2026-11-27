// Serialize the real registered 3D model and its public-space context into the selectable plan.
import fs from 'node:fs';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
const {createCirco}=await import('../../dist/js/circo.js');
const {createCircoContext}=await import('../../dist/js/circo-context.js');
const {createHeightSampler}=await import('../../dist/js/terrain.js');
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visitData=read('circo-visit'),contextData=read('circo-context'),record=read('archaeology-public').sites.find(s=>s.id==='circo'),heightAt=createHeightSampler(read('elevation'));
const model=createCirco({record,heightAt,contextData,visitData});
const context=createCircoContext({contextData,visitData,heightAt});
Object.assign(model.visit.focuses,context.focuses);
model.visit.plan.components.push(...context.plan.components);model.visit.plan.contextOutline=context.plan.outline;
const scopes=new Set(['circo-arena','circo-spina','circo-metae','circo-graderio','circo-historica','circo-carceres']);
for(const stop of visitData.stops){
 const focus=model.visit.focuses[stop.id];if(!focus)throw new Error('Missing physical focus: '+stop.id);
 focus.label=stop.title;focus.regionId=stop.regionId;focus.readingLayer=stop.readingLayer||focus.readingLayer;
 focus.mapScope=focus.mapScope||stop.mapScope||(scopes.has(stop.id)?'circus':'gate');
 stop.coordinate=focus.coordinates.map(n=>Number(n.toFixed(8)));stop.coordinates=[...stop.coordinate];stop.floor=focus.floor;stop.mapScope=focus.mapScope;
}
const qa=model.visit.qa;
visitData.modelRegistration={...visitData.modelRegistration,anchor:qa.modelRegistration?.coordinate||record.coordinate,yawRadians:qa.frame?.yaw??contextData.registration?.yawRadians,baseY:qa.baseY,surfaceY:qa.surfaceY};
model.visit.plan.stops=Object.values(model.visit.focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,mapScope:q.mapScope,sourceConfidence:q.sourceConfidence}));
model.visit.stats.context=context.stats;model.visit.stats.stops=Object.keys(model.visit.focuses).length;
fs.writeFileSync('dist/assets/data/circo-visit.json',JSON.stringify(visitData)+'\n');
fs.writeFileSync('dist/assets/data/circo-plan.json',JSON.stringify(model.visit.plan)+'\n');
fs.writeFileSync('research/validation-v53/circo-geometry-metadata.json',JSON.stringify({stats:model.visit.stats,qa,focuses:Object.fromEntries(Object.entries(model.visit.focuses).map(([id,q])=>[id,{...q,target:q.target.toArray(),bounds:{min:q.bounds.min.toArray(),max:q.bounds.max.toArray()}}]))},null,2)+'\n');
console.log(JSON.stringify(model.visit.stats));
