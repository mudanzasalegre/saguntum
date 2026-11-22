// Documentary and data/plan contract audit. This does not certify surveying,
// historical attribution, browser interaction or current public accessibility.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(root+'dist/assets/data/'+name+'.json','utf8'));
const data=read('sangre-visit'),plan=read('sangre-plan'),context=read('sangre-context');
const expected=['conjunto','plaza','escalinata','portada','espadana','nave','capillas','crucero','cupula','pechinas','presbiterio','veracruz','sacristia','museo','conservacion','entorno'].map(id=>'sangre-'+id);
const sources=new Map(data.sources.map(s=>[s.id,s])),stops=new Map(data.stops.map(s=>[s.id,s]));
const checks=[];
function check(label,fn){try{fn();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:error.stack||String(error)});}}
const sourceCheck=ids=>{assert(ids?.length);for(const id of ids)assert(sources.has(id),'Missing source '+id);};
const words=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
const summaries=Object.fromEntries(data.sources.map(s=>[s.id,0]));
for(const item of [...data.stops.flatMap(s=>s.facts),...data.timeline])for(const id of item.sourceIds)summaries[id]+=words(item.text);

check('Sixteen stable stops and ordered route',()=>{
  assert.deepEqual(data.stops.map(s=>s.id),expected);assert.equal(stops.size,16);
  assert.deepEqual(data.stops.map(s=>s.order),Array.from({length:16},(_,i)=>i+1));
  assert.equal(data.regions.length,5);assert.equal(data.readingLegend.length,5);
  assert.equal(data.stops.reduce((n,s)=>n+s.facts.length,0),39);assert.equal(data.sources.length,22);assert.equal(data.timeline.length,17);
});
check('Every fact and chronology item resolves to documentary evidence',()=>{
  assert.equal(sources.size,data.sources.length);
  for(const source of data.sources){assert(/^https?:\/\//.test(source.url));assert(source.author&&source.title&&source.locator&&source.note);assert.equal(source.accessed,data.researchDate);}
  for(const stop of data.stops){
    sourceCheck(stop.sourceIds);sourceCheck(stop.coordinateSourceIds);
    assert(stop.title&&stop.intro&&stop.lookFor&&stop.modelNote&&stop.facts.length>=2);
    for(const fact of stop.facts){assert(fact.text);sourceCheck(fact.sourceIds);assert(['documented','interpretive','disputed'].includes(fact.confidence));for(const id of fact.sourceIds)assert(stop.sourceIds.includes(id));}
  }
  const timelineIds=new Set();
  for(const event of data.timeline){assert(!timelineIds.has(event.id));timelineIds.add(event.id);assert(stops.has(event.stopId));assert(event.date&&event.text);sourceCheck(event.sourceIds);}
});
check('All five regions partition the route and thematic layers remain explicit',()=>{
  const covered=[];const layers=new Set(data.readingLegend.map(x=>x.id));
  assert.deepEqual([...layers],['exterior','architecture','art','memory','context']);
  for(const layer of data.readingLegend)assert(/^#[0-9a-f]{6}$/i.test(layer.color));
  for(const region of data.regions){sourceCheck(region.sourceIds);for(const id of region.stopIds){assert(stops.has(id));assert.equal(stops.get(id).regionId,region.id);covered.push(id);}}
  assert.equal(new Set(covered).size,16);assert.equal(covered.length,16);for(const stop of data.stops)assert(layers.has(stop.readingLayer));
});
check('Coordinates resolve to the same focus as the exported model plan',()=>{
  const planStops=new Map(plan.stops.map(s=>[s.id,s]));
  assert.deepEqual([...planStops.keys()].sort(),[...stops.keys()].sort());
  for(const stop of data.stops){
    const c=stop.coordinate,p=planStops.get(stop.id).coordinates;
    assert.deepEqual(c,stop.coordinates);assert.equal(c.length,2);assert(c.every(Number.isFinite));
    assert(c[0]>-.278&&c[0]<-.2768&&c[1]>39.6778&&c[1]<39.6788);assert.equal(stop.coordinateConfidence,'approximate');
    const distance=Math.hypot((c[0]-p[0])*111320*Math.cos(c[1]*Math.PI/180),(c[1]-p[1])*111320);
    assert(distance<.05,stop.id+' differs by '+distance+' m');
    assert.equal(planStops.get(stop.id).regionId,stop.regionId);
  }
  assert(new Set(data.stops.map(s=>s.coordinate.join(','))).size>=12,'Stops must not collapse to one generic landmark coordinate');
});
check('Plaza and street focus coordinates match the contextual scene',()=>{
  for(const id of ['sangre-plaza','sangre-entorno']){
    const c=context.focusCoordinates[id];assert(c,'Missing context focus '+id);
    assert.deepEqual(stops.get(id).coordinate,c);
  }
});
check('Evidence qualifiers prevent false certainty about paintings and the synagogue',()=>{
  const attribution=stops.get('sangre-pechinas').facts.find(f=>f.text.includes('Vergara'));
  assert.equal(attribution.confidence,'interpretive');assert.match(attribution.text,/atribuyen/);assert.match(attribution.text,/XVIII/);
  const synagogue=stops.get('sangre-entorno').facts.find(f=>f.text.includes('sinagoga'));
  assert.equal(synagogue.confidence,'disputed');assert.match(synagogue.text,/no se ha probado/);
  assert.match(stops.get('sangre-entorno').modelNote,/no es el Portalet/i);assert.match(stops.get('sangre-entorno').modelNote,/No se representa una sinagoga bajo/);
});
check('Presbytery painting and restored dome key are separate spatial and dated claims',()=>{
  const presbytery=stops.get('sangre-presbiterio'),dome=stops.get('sangre-cupula');
  assert(presbytery.facts.some(f=>/presbiterio.*1973/.test(f.text)));
  assert(dome.facts.some(f=>/2024.*clave/.test(f.text)));
  assert.match(dome.modelNote,/no se añade la lámpara/);
  assert(sources.has('sg-corresa2025')&&sources.has('sg-foto2024'));
  assert.equal(data.timeline.find(t=>t.id==='sg-t-boveda').stopId,'sangre-presbiterio');
  assert.equal(data.timeline.find(t=>t.id==='sg-t-restauracion').stopId,'sangre-cupula');
});
check('Cutaway and collections identify the limits of the virtual visit',()=>{
  assert(data.sectionOnOverview);assert.match(data.sectionNote,/Sección didáctica/);assert.match(data.sectionNote,/no es un levantamiento actualizado/);
  assert.match(stops.get('sangre-museo').modelNote,/no se reproducen como una museografía medida/);
  assert.match(stops.get('sangre-sacristia').modelNote,/No se reconstruye como exacto el inventario/);
  assert(stops.get('sangre-conservacion').facts.some(f=>/reproducción del Santo Cáliz/.test(f.text)));
  assert(stops.get('sangre-veracruz').facts.some(f=>/tradición religiosa/.test(f.text)));
});
check('Concise fact and timeline summaries remain below 200 words per source',()=>{
  for(const[id,count]of Object.entries(summaries))assert(count<=200,id+': '+count+' words');
});
const report={generatedAt:new Date().toISOString(),pass:checks.every(c=>c.pass),checksCount:checks.length,scope:'Documentary data integrity, qualified claims, concise factual summaries and shared geographical focuses. Source counts exclude bibliographic metadata and original explanatory interface copy. Physical accuracy and browser behavior are verified separately.',data:{stops:data.stops.length,regions:data.regions.length,layers:data.readingLegend.length,facts:data.stops.reduce((n,s)=>n+s.facts.length,0),sources:data.sources.length,timeline:data.timeline.length},factAndTimelineWordsBySource:summaries,checks};
fs.writeFileSync(root+'research/validation-v15/sangre-visit-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
