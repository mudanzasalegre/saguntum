// Register both real model sectors and their observation points in the documentary plan.
import fs from 'node:fs';
import {createNecropolis} from '../../dist/js/necropolis.js';
import {createNecropolisContext} from '../../dist/js/necropolis-context.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visitData=read('necropolis-visit'),contextData=read('necropolis-context'),record=read('archaeology-necropolis').sites.find(s=>s.id==='necropolis'),heightAt=createHeightSampler(read('elevation'));
const model=createNecropolis({record,heightAt,contextData,visitData});
const context=createNecropolisContext({contextData,visitData,heightAt});
Object.assign(model.visit.focuses,context.focuses||{});
model.visit.plan.components.push(...context.plan?.components||[]);
for(const stop of visitData.stops){
 const focus=model.visit.focuses[stop.id];if(!focus)throw new Error('Missing physical focus: '+stop.id);
 focus.label=stop.title;focus.regionId=stop.regionId;focus.readingLayer=stop.readingLayer||focus.readingLayer;
 focus.mapScope=focus.mapScope||focus.archFocus||stop.mapScope;focus.archFocus=focus.archFocus||stop.archFocus;
 stop.coordinate=focus.coordinates.map(n=>Number(n.toFixed(8)));stop.coordinates=[...stop.coordinate];stop.floor=focus.floor;stop.mapScope=focus.mapScope;stop.archFocus=focus.archFocus;stop.recommendedMode=focus.recommendedMode||'current';
}
visitData.modelRegistration={...visitData.modelRegistration,precision:'approximate',coordinates:'Registered from the two implemented sectors; chamber and grave layout is interpretive.',provisionalCoordinates:false};
model.visit.plan.stops=Object.values(model.visit.focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,mapScope:q.mapScope,archFocus:q.archFocus,sourceConfidence:q.sourceConfidence}));
model.visit.stats.context=context.stats;model.visit.stats.stops=Object.keys(model.visit.focuses).length;
fs.writeFileSync('dist/assets/data/necropolis-visit.json',JSON.stringify(visitData,null,2)+'\n');
fs.writeFileSync('dist/assets/data/necropolis-plan.json',JSON.stringify(model.visit.plan,null,2)+'\n');
fs.writeFileSync('research/validation-v21/necropolis-geometry-metadata.json',JSON.stringify({stats:model.visit.stats,qa:model.visit.qa,focuses:Object.fromEntries(Object.entries(model.visit.focuses).map(([id,q])=>[id,{...q,target:q.target.toArray(),bounds:{min:q.bounds.min.toArray(),max:q.bounds.max.toArray()}}]))},null,2)+'\n');
console.log(JSON.stringify(model.visit.stats));
