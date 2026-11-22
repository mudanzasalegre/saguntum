// Documentary and shared-focus contract audit. This does not certify a survey,
// physical accessibility, current condition, historical attribution or rendering.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(root+'dist/assets/data/'+name+'.json','utf8'));
const data=read('salvador-visit'),plan=read('salvador-plan'),context=read('salvador-context');
const expected=['conjunto','plaza','portada','torre','campanas','nave','arcos','techumbre','abside','cruceria','bautismo','comunion','cupula','sacristia','arqueologia','artesonado','conservacion','entorno'].map(id=>'salvador-'+id);
const sources=new Map(data.sources.map(s=>[s.id,s]));
const stops=new Map(data.stops.map(s=>[s.id,s]));
const planStops=new Map(plan.stops.map(s=>[s.id,s]));
const confidenceIds=new Set(data.confidenceLegend.map(c=>c.id));
const checks=[];
function check(label,fn){try{fn();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:error.stack||String(error)});}}
const sourceCheck=ids=>{assert(ids?.length);for(const id of ids)assert(sources.has(id),'Missing source '+id);};
const words=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
const summaries=Object.fromEntries(data.sources.map(s=>[s.id,0]));
for(const item of [...data.stops.flatMap(s=>s.facts),...data.timeline])for(const id of item.sourceIds)summaries[id]+=words(item.text);

check('Eighteen stable stops and coherent route totals',()=>{
  assert.deepEqual(data.stops.map(s=>s.id),expected);
  assert.equal(stops.size,18);
  assert.deepEqual(data.stops.map(s=>s.order),Array.from({length:18},(_,i)=>i+1));
  assert.equal(data.regions.length,5);assert.equal(data.readingLegend.length,5);
  assert.equal(data.stops.reduce((n,s)=>n+s.facts.length,0),40);
  assert.equal(data.timeline.length,19);assert.equal(data.sources.length,19);
});
check('Every fact and chronology item resolves to evidence with stated confidence',()=>{
  assert.equal(sources.size,data.sources.length);
  for(const source of data.sources){
    assert(/^https:\/\//.test(source.url));
    assert(source.author&&source.title&&source.locator&&source.note);
    assert.equal(source.accessed,data.researchDate);
  }
  for(const stop of data.stops){
    sourceCheck(stop.sourceIds);sourceCheck(stop.coordinateSourceIds);
    assert(stop.title&&stop.intro&&stop.lookFor&&stop.modelNote&&stop.facts.length>=2);
    assert.equal(stop.narrative,stop.intro);
    assert(confidenceIds.has(stop.confidence));
    for(const fact of stop.facts){
      assert(fact.text);sourceCheck(fact.sourceIds);assert(confidenceIds.has(fact.confidence));
      for(const id of fact.sourceIds)assert(stop.sourceIds.includes(id));
    }
  }
  const eventIds=new Set();
  for(const event of data.timeline){
    assert(!eventIds.has(event.id));eventIds.add(event.id);
    assert(stops.has(event.stopId));assert(event.date&&event.title&&event.text);
    sourceCheck(event.sourceIds);assert(confidenceIds.has(event.confidence));
  }
});
check('Five regions partition the route and match thematic model layers',()=>{
  const covered=[];const layers=new Set(data.readingLegend.map(x=>x.id));
  assert.deepEqual([...layers],['exterior','architecture','chapels','memory','context']);
  for(const layer of data.readingLegend)assert(/^#[0-9a-f]{6}$/i.test(layer.color));
  for(const region of data.regions){
    sourceCheck(region.sourceIds);assert(region.name&&region.summary&&region.coordinate.length===2);
    for(const id of region.stopIds){assert(stops.has(id));assert.equal(stops.get(id).regionId,region.id);covered.push(id);}
  }
  assert.equal(covered.length,18);assert.equal(new Set(covered).size,18);
  for(const stop of data.stops){
    assert(layers.has(stop.readingLayer));assert.equal(planStops.get(stop.id).readingLayer,stop.readingLayer);
    assert.equal(planStops.get(stop.id).regionId,stop.regionId);
  }
});
check('Geographical focuses and registration match the exported model plan',()=>{
  assert.deepEqual([...planStops.keys()].sort(),[...stops.keys()].sort());
  assert.deepEqual(data.modelRegistration.anchor,plan.modelRegistration.anchor);
  assert.equal(data.modelRegistration.yawRadians,plan.modelRegistration.yawRadians);
  assert.equal(data.modelRegistration.precision,'approximate');
  for(const stop of data.stops){
    const c=stop.coordinate,p=planStops.get(stop.id).coordinates;
    assert.deepEqual(c,stop.coordinates);assert.equal(c.length,2);assert(c.every(Number.isFinite));
    assert(c[0]>-.2733&&c[0]<-.2718&&c[1]>39.6762&&c[1]<39.6774);
    assert.equal(stop.coordinateConfidence,'approximate');
    const distance=Math.hypot((c[0]-p[0])*111320*Math.cos(c[1]*Math.PI/180),(c[1]-p[1])*111320);
    assert(distance<.05,stop.id+' differs by '+distance+' m');
  }
  assert(new Set(data.stops.map(s=>s.coordinate.join(','))).size>=12,'Stops must not collapse to a generic landmark point');
});
check('Two public spaces retain distinct shared context coordinates',()=>{
  for(const id of ['salvador-plaza','salvador-entorno']){
    assert(context.focusCoordinates[id]);assert.deepEqual(stops.get(id).coordinate,context.focusCoordinates[id]);
  }
  assert.notDeepEqual(stops.get('salvador-plaza').coordinate,stops.get('salvador-entorno').coordinate);
  assert.match(stops.get('salvador-plaza').modelNote,/no se asigna esa intervención a una huella/i);
  assert(stops.get('salvador-entorno').sourceIds.includes('sv-valencia2015'));
});
check('1248 and the Cid association remain qualified claims',()=>{
  const early=stops.get('salvador-conjunto').facts.find(f=>f.text.includes('1248'));
  assert.equal(early.confidence,'disputed');assert.match(early.text,/no prueba/i);
  const cid=stops.get('salvador-arqueologia').facts.find(f=>f.text.includes('Cid'));
  assert.equal(cid.confidence,'disputed');assert.match(cid.text,/hipótesis/);
  assert.equal(data.timeline.find(e=>e.id==='sv-t-arrabal').confidence,'disputed');
  assert.equal(data.timeline.find(e=>e.id==='sv-t-guerra').confidence,'disputed');
});
check('Visible roof and dispersed painted ceiling are separate interpretive subjects',()=>{
  const roof=stops.get('salvador-techumbre'),ceiling=stops.get('salvador-artesonado');
  assert.match(roof.modelNote,/No se presenta esta cubierta como el artesonado/);
  assert(roof.facts.some(f=>f.text.includes('1923')));
  assert(ceiling.facts.some(f=>f.text.includes('2024')&&f.text.includes('colección privada')));
  assert.match(ceiling.modelNote,/no se inventa un techo completo/i);
  assert.match(data.timeline.find(e=>e.id==='sv-t-caseton').text,/no fue la restitución/i);
});
check('Architecture section does not imply a crypt, full buried church or access to excavations',()=>{
  assert(data.sectionOnOverview);
  assert.match(data.sectionNote,/Sección didáctica/);
  assert.match(data.sectionNote,/suelo permanece cerrado/);
  assert.match(stops.get('salvador-arqueologia').modelNote,/No se reconstruyen una iglesia cidiana, una cripta intacta/);
  assert.match(stops.get('salvador-entorno').modelNote,/no se abren zanjas/);
});
check('Chapel, sacristy, font and lost retable limits remain explicit',()=>{
  assert.match(stops.get('salvador-comunion').modelNote,/dimensiones menores, molduras y mobiliario son aproximados/);
  assert.match(stops.get('salvador-cupula').modelNote,/color y el despiece.*aproximados/);
  assert.match(stops.get('salvador-sacristia').modelNote,/No se reconstruyen como exactos/);
  assert.match(stops.get('salvador-bautismo').modelNote,/No reproduce como conservada/);
  assert.match(stops.get('salvador-abside').modelNote,/retablo desaparecido no se repone/);
  assert.match(sources.get('sv-gva').note,/no indican fecha de toma/i);
});
check('Bell evidence uses recent wooden yokes and qualifies the small bell',()=>{
  const bells=stops.get('salvador-campanas');
  assert(bells.facts.some(f=>/yugos nuevos de madera en 2023/.test(f.text)));
  assert(bells.facts.some(f=>/inciertas/.test(f.text)&&f.text.includes('pequeña')));
  assert.match(sources.get('sv-campanar').locator,/2025/);
  assert.match(sources.get('sv-trinitat').url,/campana1\.php/);
  assert.match(sources.get('sv-remei').url,/campana1\.php/);
});
check('Concise facts and timeline summaries stay within 200 words per source',()=>{
  for(const[id,count]of Object.entries(summaries))assert(count<=200,id+': '+count+' words');
});

const report={generatedAt:new Date().toISOString(),pass:checks.every(c=>c.pass),checksCount:checks.length,scope:'Documentary integrity, qualified claims, concise factual summaries and shared geographical focuses. Bibliographic metadata and original explanatory copy are excluded from summary word counts. Geometry, renders and browser behavior are verified separately.',data:{stops:data.stops.length,regions:data.regions.length,layers:data.readingLegend.length,facts:data.stops.reduce((n,s)=>n+s.facts.length,0),timeline:data.timeline.length,sources:data.sources.length},factAndTimelineWordsBySource:summaries,checks};
fs.writeFileSync(root+'research/validation-v16/salvador-visit-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
