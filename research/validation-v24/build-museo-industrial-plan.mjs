// Register the documentary museum plan with the exact implementation's observation points.
import fs from 'node:fs';
import {createMuseoIndustrial} from '../../dist/js/museo-industrial.js';
import {createMuseoIndustrialContext} from '../../dist/js/museo-industrial-context.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visitData=read('museo-industrial-visit'),contextData=read('museo-industrial-context'),record=read('port-industrial').sites.find(s=>s.id==='museo-industrial'),heightAt=createHeightSampler(read('port-elevation'));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const model=createMuseoIndustrial({record,heightAt,project,contextData,visitData}),context=createMuseoIndustrialContext({contextData,visitData,project,heightAt});
if(context.focuses?.['museo-industrial-entorno'])model.visit.focuses['museo-industrial-entorno']=context.focuses['museo-industrial-entorno'];
const plan=model.visit.plan;plan.components=[...(plan.components||[]),...(context.plan?.components||[])];plan.contextOutline=context.plan?.outline;plan.coordinate=record.coordinate;
const worldToGeo=q=>[-.278+q.x/(111320*Math.cos(39.679*Math.PI/180)),39.679-q.z/111320];
for(const stop of visitData.stops){
 const focus=model.visit.focuses[stop.id];if(!focus)throw new Error('Missing physical focus: '+stop.id);
 focus.label=stop.title;focus.regionId=stop.regionId;focus.readingLayer=stop.readingLayer||focus.readingLayer;
 stop.coordinate=(focus.coordinates||worldToGeo(focus.target)).map(n=>Number(n.toFixed(8)));stop.coordinates=[...stop.coordinate];
 stop.elevation=focus.elevation??focus.target.y-heightAt(project(...record.coordinate).x,project(...record.coordinate).z);
 stop.localTarget=focus.localTarget?.isVector3?focus.localTarget.toArray():focus.localTarget;
 stop.requiresSection=!!focus.requiresSection;
 stop.floor=focus.floor===undefined?(stop.floor??null):focus.floor;
 stop.interiorView=!!focus.interiorView;
 stop.coordinateMethod='Foco registrado con el modelo tridimensional del edificio y la cartografía de contexto. Posición de observación y cotas no levantadas interpretativas.';
}
visitData.modelRegistration={...visitData.modelRegistration,status:'registered',note:'Focos registrados a partir de la geometría final y de la cartografía; las cotas no levantadas son interpretativas.',precision:'approximate',coordinates:'Registered from the implemented industrial model and contemporary cartography; component positions and unmeasured heights are interpretive.',provisionalCoordinates:false};
plan.stops=visitData.stops.map(s=>({id:s.id,label:s.title,coordinates:s.coordinate,regionId:s.regionId,readingLayer:s.readingLayer,elevation:s.elevation,localTarget:s.localTarget,floor:s.floor,interiorView:s.interiorView,requiresSection:s.requiresSection,sourceConfidence:s.coordinateConfidence}));
fs.writeFileSync('dist/assets/data/museo-industrial-visit.json',JSON.stringify(visitData,null,2)+'\n');fs.writeFileSync('dist/assets/data/museo-industrial-plan.json',JSON.stringify(plan,null,2)+'\n');
fs.writeFileSync('research/validation-v24/museo-industrial-geometry-metadata.json',JSON.stringify({stats:model.visit.stats,qa:model.visit.qa,focuses:Object.fromEntries(Object.entries(model.visit.focuses).map(([id,f])=>[id,{...f,target:f.target.toArray(),bounds:f.bounds?{min:f.bounds.min.toArray(),max:f.bounds.max.toArray()}:null}]))},null,2)+'\n');
console.log(JSON.stringify({stops:visitData.stops.length,components:plan.components.length,naves:plan.naves?.length,crossSection:plan.crossSection}));
