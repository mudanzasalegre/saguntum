// Refresh only fallback plans affected by a scoped Alameda ground-ownership transfer.
// Existing guide facts, dates, observation coordinates and V24/V25 evidence remain intact.
import fs from 'node:fs';
import {createGerencia} from '../../dist/js/gerencia.js';
import {createGerenciaContext} from '../../dist/js/gerencia-context.js';
import {createMuseoIndustrial} from '../../dist/js/museo-industrial.js';
import {createMuseoIndustrialContext} from '../../dist/js/museo-industrial-context.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const heightAt=createHeightSampler(read('port-elevation')),project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const constructors={gerencia:[createGerencia,createGerenciaContext,'port-garden'],'museo-industrial':[createMuseoIndustrial,createMuseoIndustrialContext,'port-industrial']};
const ids=process.argv.slice(2).length?process.argv.slice(2):Object.keys(constructors);
const results=[];
for(const id of ids){
 if(!constructors[id])throw new Error('Unsupported neighboring plan: '+id);
 const [factory,contextFactory,catalog]=constructors[id],visitData=read(id+'-visit'),contextData=read(id+'-context'),previousPlan=read(id+'-plan'),record=read(catalog).sites.find(s=>s.id===id);
 const model=factory({record,site:record,heightAt,project,contextData,visitData}),context=contextFactory({contextData,visitData,project,heightAt});
 Object.assign(model.visit.focuses,context.focuses||{});
 const plan=model.visit.plan;plan.components=[...(plan.components||[]),...(context.plan?.components||[])];plan.contextOutline=context.plan?.outline;plan.coordinate=record.coordinate;
 for(const stop of previousPlan.stops){const focus=model.visit.focuses[stop.id];if(!focus)throw new Error('Missing retained focus: '+stop.id);if(focus.coordinates&&focus.coordinates.some((value,i)=>Math.abs(value-stop.coordinates[i])>1e-7))throw new Error('A retained stop moved: '+stop.id);}
 plan.stops=previousPlan.stops;
 fs.writeFileSync('dist/assets/data/'+id+'-plan.json',JSON.stringify(plan,null,2)+'\n');
 results.push({id,stops:plan.stops.length,components:plan.components.length,stopMetadataPreserved:true,contextStats:context.stats});
 model.visit.dispose?.();context.dispose?.();
}
fs.writeFileSync('research/validation-v27/neighbor-plan-refresh.json',JSON.stringify({results},null,2)+'\n');console.log(JSON.stringify(results));
