import fs from 'node:fs';
import {createBerenguer} from '../../dist/js/berenguer.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json')),record=read('landmarks').sites.find(s=>s.id==='berenguer');
const model=createBerenguer({heightAt:createHeightSampler(read('elevation')),record,visitData:read('berenguer-visit'),contextData:read('berenguer-context')});
fs.writeFileSync('dist/assets/data/berenguer-plan.json',JSON.stringify({schemaVersion:1,...model.visit.plan},null,2));
console.log(JSON.stringify({stats:model.visit.stats,mask:model.visit.sectionMask,exclusions:model.excludedBuildingIds}));
