import fs from 'node:fs';
import {createDomus} from '../../dist/js/domus.js';
import {createDomusContext} from '../../dist/js/domus-context.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visitData=fs.existsSync('dist/assets/data/domus-visit.json')?read('domus-visit'):{};
const model=createDomus({record:read('archaeology-domestic').sites.find(s=>s.id==='domus'),heightAt:createHeightSampler(read('elevation')),contextData:read('domus-context'),visitData});
const context=createDomusContext({contextData:read('domus-context'),visitData,heightAt:createHeightSampler(read('elevation'))});
Object.assign(model.visit.focuses,context.focuses);model.visit.plan.components.push(...context.plan.components);model.visit.plan.contextOutline=context.plan.outline;model.visit.plan.stops=Object.values(model.visit.focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,sourceConfidence:q.sourceConfidence}));
for(const stop of visitData.stops||[]){
 const focus=model.visit.focuses[stop.id];if(!focus)throw new Error('Missing physical focus: '+stop.id);
 focus.label=stop.title;focus.regionId=stop.regionId;focus.readingLayer=stop.readingLayer||focus.readingLayer;
 stop.coordinate=focus.coordinates.map(n=>Number(n.toFixed(8)));stop.coordinates=[...stop.coordinate];stop.floor=focus.floor;
}
const qa=model.visit.qa;
visitData.modelRegistration={...visitData.modelRegistration,anchor:qa.modelRegistration.coordinate,yawRadians:qa.frame.yaw,baseY:qa.baseY,surfaceY:qa.surfaceY,ceilingY:qa.ceilingY,deckY:qa.deckY};
model.visit.plan.stops=Object.values(model.visit.focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,sourceConfidence:q.sourceConfidence}));
fs.writeFileSync('dist/assets/data/domus-visit.json',JSON.stringify(visitData,null,2)+'\n');
const archaeologyData=read('archaeology-domestic'),entry=archaeologyData.sites.find(s=>s.id==='domus');
entry.coordinate=[...qa.modelRegistration.coordinate];entry.model.yawRadians=qa.frame.yaw;
fs.writeFileSync('dist/assets/data/archaeology-domestic.json',JSON.stringify(archaeologyData,null,2)+'\n');
fs.writeFileSync('dist/assets/data/domus-plan.json',JSON.stringify(model.visit.plan,null,2));
fs.writeFileSync('research/validation-v19/domus-geometry-metadata.json',JSON.stringify({stats:model.stats,qa:model.visit.qa,focuses:Object.fromEntries(Object.entries(model.visit.focuses).map(([id,q])=>[id,{...q,target:q.target.toArray(),bounds:{min:q.bounds.min.toArray(),max:q.bounds.max.toArray()}}]))},null,2));
console.log(JSON.stringify(model.stats));
