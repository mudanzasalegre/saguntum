// Audit of the documentary contract between the guide, archaeological plan,
// contextual cartography and model export. This is not a survey certification.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=path=>JSON.parse(fs.readFileSync(root+path,'utf8'));
const data=read('dist/assets/data/portic-visit.json');
const plan=read('dist/assets/data/portic-plan.json');
const context=read('dist/assets/data/portic-context.json');
const geometry=read('research/validation-v18/portic-geometry-metadata.json');
const expected=['conjunto','plaza','acceso','pasarela','calzada','losado','porticos','cloaca','desagues','arco','podio','depositos','funerario','domestico','letrinas','necropolis','medieval','musealizacion','historica','entorno'].map(id=>'portic-'+id);
const sources=new Map(data.sources.map(s=>[s.id,s]));
const stops=new Map(data.stops.map(s=>[s.id,s]));
const planStops=new Map(plan.stops.map(s=>[s.id,s]));
const confidenceIds=new Set(data.confidenceLegend.map(c=>c.id));
const checks=[];
const check=(label,run)=>{try{run();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:error.stack||String(error)});}};
const sourceCheck=ids=>{assert(ids?.length,'Missing provenance');for(const id of ids)assert(sources.has(id),'Unknown source '+id);};
const metres=(a,b)=>Math.hypot((a[0]-b[0])*111320*Math.cos(a[1]*Math.PI/180),(a[1]-b[1])*111320);
const words=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
const summaries=Object.fromEntries(data.sources.map(s=>[s.id,0]));
for(const item of [...data.stops.flatMap(s=>s.facts),...data.timeline])for(const id of item.sourceIds)summaries[id]=(summaries[id]||0)+words(item.text);

check('The route retains twenty stable stops and six documentary themes',()=>{
 assert.equal(data.schemaVersion,1);assert.equal(data.id,'portic');
 assert.deepEqual(data.stops.map(s=>s.id),expected);assert.equal(stops.size,20);
 assert.deepEqual(data.stops.map(s=>s.order),Array.from({length:20},(_,i)=>i+1));
 assert.equal(data.regions.length,6);assert.equal(data.readingLegend.length,6);
 assert.equal(data.stops.reduce((sum,s)=>sum+s.facts.length,0),40);
 assert.equal(data.timeline.length,18);assert.equal(sources.size,data.sources.length);
});

check('All factual claims, chronology and positions resolve to source records',()=>{
 for(const source of sources.values()){
  assert(/^https:\/\//.test(source.url));
  assert(source.title&&source.author&&source.locator&&source.note);
  assert.equal(source.accessed,data.researchDate);
 }
 for(const stop of stops.values()){
  assert(stop.title&&stop.label&&stop.intro&&stop.lookFor&&stop.modelNote);
  assert.equal(stop.narrative,stop.intro);assert.equal(stop.facts.length,2);
  assert(confidenceIds.has(stop.confidence));sourceCheck(stop.sourceIds);sourceCheck(stop.coordinateSourceIds);
  for(const fact of stop.facts){
   assert(fact.text);sourceCheck(fact.sourceIds);assert(confidenceIds.has(fact.confidence));
   for(const id of fact.sourceIds)assert(stop.sourceIds.includes(id),stop.id+' omits fact source '+id);
  }
 }
 const eventIds=new Set();
 for(const event of data.timeline){
  assert(!eventIds.has(event.id));eventIds.add(event.id);
  assert(stops.has(event.stopId));assert(event.date&&event.title&&event.text);
  sourceCheck(event.sourceIds);assert(confidenceIds.has(event.confidence));
 }
});

check('Regions partition the route and layers agree with the model',()=>{
 const layers=new Set(data.readingLegend.map(l=>l.id));
 assert.deepEqual([...layers],['via','monumental','domestico','tardia','medieval','contemporanea']);
 const covered=[];
 for(const layer of data.readingLegend)assert(/^#[0-9a-f]{6}$/i.test(layer.color));
 for(const region of data.regions){
  assert(region.name&&region.summary&&region.coordinate?.length===2);sourceCheck(region.sourceIds);
  for(const id of region.stopIds){assert(stops.has(id));assert.equal(stops.get(id).regionId,region.id);covered.push(id);}
 }
 assert.equal(covered.length,20);assert.equal(new Set(covered).size,20);
 for(const stop of stops.values()){
  const p=planStops.get(stop.id);assert(p);assert(layers.has(stop.readingLayer));
  assert.equal(stop.regionId,p.regionId,stop.id+' region');assert.equal(stop.readingLayer,p.readingLayer,stop.id+' layer');
 }
 assert.match(data.readingModeNote,/no representan una única/);
});

check('Coordinates, floors and model registration share the same export',()=>{
 assert.deepEqual([...planStops.keys()].sort(),[...stops.keys()].sort());
 assert.deepEqual(data.modelRegistration.anchor,plan.coordinate);
 assert.equal(data.modelRegistration.yawRadians,geometry.qa.frame.yaw);
 assert.equal(data.modelRegistration.baseY,geometry.qa.baseY);
 assert.equal(data.modelRegistration.surfaceY,geometry.qa.surfaceY);
 assert.equal(data.modelRegistration.precision,'approximate');
 assert(data.modelRegistration.axisX&&data.modelRegistration.axisZ&&data.modelRegistration.method);
 for(const stop of stops.values()){
  const c=stop.coordinate,p=planStops.get(stop.id);
  assert.deepEqual(c,stop.coordinates);assert(c.length===2&&c.every(Number.isFinite));
  assert(c[0]>-.274&&c[0]<-.2715&&c[1]>39.6786&&c[1]<39.6805,stop.id+' out of site district');
  assert.equal(stop.coordinateConfidence,'approximate');assert.match(stop.coordinateMethod,/No es una medición/);
  assert(metres(c,p.coordinates)<.05,stop.id+' guide/plan mismatch');
  assert.equal(stop.floor,p.floor,stop.id+' floor');assert([null,-1,0].includes(stop.floor));
 }
 assert.equal(new Set(data.stops.map(s=>s.coordinate.join(','))).size,20);
 assert.equal(stops.get('portic-conjunto').floor,null);
 for(const id of ['calzada','cloaca','necropolis','medieval'])assert.equal(stops.get('portic-'+id).floor,-1);
});

check('Plaza, entrance and surroundings use the shared contextual focus positions',()=>{
 for(const id of ['portic-plaza','portic-acceso','portic-entorno']){
  assert(context.focusCoordinates[id]);
  assert(metres(stops.get(id).coordinate,context.focusCoordinates[id])<.05,id+' context disagreement');
  assert.equal(stops.get(id).floor,0);assert.equal(stops.get(id).readingLayer,'contemporanea');
 }
});

check('Published road and drainage dimensions agree with the rendered model contract',()=>{
 assert.equal(geometry.stats.roadLength,60);
 assert.deepEqual(geometry.stats.roadWidth,[4.1,5.4]);
 assert.equal(geometry.stats.sewerClearWidth,.68);assert(geometry.stats.sewerClearDepth>1.2);
 assert(stops.get('portic-losado').facts.some(f=>/4,10/.test(f.text)&&/5,40/.test(f.text)));
 assert(stops.get('portic-cloaca').facts.some(f=>/0,68/.test(f.text)&&/1,20/.test(f.text)));
 assert.match(stops.get('portic-cloaca').modelNote,/No se añade una bóveda/);
 assert(stops.get('portic-calzada').facts.some(f=>/kardo maximus/.test(f.text)&&/decumanus minor/.test(f.text)));
 assert.equal(stops.get('portic-calzada').facts.find(f=>/Augusta/.test(f.text)).confidence,'interpretive');
});

check('The explicit pier inventory and later disagreement are preserved',()=>{
 assert.equal(geometry.stats.preservedPierLocations,14);assert.equal(geometry.stats.westPiers,9);assert.equal(geometry.stats.eastPiers,5);
 const p=stops.get('portic-porticos');
 assert(p.facts.some(f=>/nueve pilares al oeste y cinco al este/.test(f.text)&&f.sourceIds.includes('po-excavacion2005')));
 assert(p.facts.some(f=>/dieciséis/.test(f.text)&&f.confidence==='disputed'&&f.sourceIds.includes('po-vias2015')));
 assert.match(p.modelNote,/alturas completas y cubiertas.*propuestas/);
});

check('Arches and cult architecture retain uncertain elevation and identification',()=>{
 const a=stops.get('portic-arco'),p=stops.get('portic-podio');
 assert.equal(a.confidence,'disputed');
 const opening=a.facts.find(f=>/2,50 m/.test(f.text)&&/3,50 m/.test(f.text));
 assert(opening);assert.equal(opening.confidence,'disputed');
 assert(opening.sourceIds.includes('po-vias2015')&&opening.sourceIds.includes('po-casas2022'));
 assert.match(a.modelNote,/Altura, remate y decoración son desconocidos/);
 assert.match(a.modelNote,/inscripciones inventadas/);
 assert(p.facts.some(f=>f.confidence==='interpretive'&&/culto/.test(f.text)));
 assert.match(p.modelNote,/otro posible templo.*tampoco equivale a una confirmación/);
 assert.match(data.timeline.find(e=>e.id==='po-t-sondeo').text,/no equivale a un hallazgo confirmado/);
});

check('Cremations and later burials remain different phases without invented identities',()=>{
 const early=stops.get('portic-funerario'),late=stops.get('portic-necropolis');
 assert.equal(early.regionId,'monumental');assert.equal(late.regionId,'tardia');
 assert(early.facts.every(f=>f.sourceIds.includes('po-cremaciones2005')));
 assert(late.facts.every(f=>f.sourceIds.includes('po-cloaca2005')));
 assert(late.facts.some(f=>/cuatro individuos/.test(f.text)&&/siglos V–VI/.test(f.text)));
 assert.match(late.modelNote,/Se separa esta fase del saneamiento en uso/);
 assert.match(late.modelNote,/No se representa una familia identificada/);
 assert.equal(data.timeline.find(e=>e.id==='po-t-enterramientos').date,'Siglos V–VI');
});

check('The second block and current museum do not acquire unsupported archaeological precision',()=>{
 assert.equal(geometry.stats.sourceHostParcels,2);assert.equal(geometry.stats.survey,false);
 assert.match(stops.get('portic-domestico').modelNote,/segundo bloque.*tipológicos/);
 assert.match(stops.get('portic-medieval').modelNote,/no se dispone de una planta completa georreferenciada/i);
 assert.match(stops.get('portic-medieval').modelNote,/No se dibuja una tenería demostrada/);
 assert.match(data.methodology.join(' '),/1.700 m².*no se equipara/);
 assert.match(stops.get('portic-pasarela').modelNote,/vigas y pilares contemporáneos no se confunden/);
 assert.match(sources.get('po-global2013').note,/no se han recibido ni reutilizado/);
});

check('The cutaway is explicitly didactic and the virtual route is not a measured physical itinerary',()=>{
 assert.equal(data.sectionOnOverview,true);assert(data.sectionInstructions);
 assert.match(data.sectionNote,/Sección didáctica/);assert.match(data.sectionNote,/aproximados/);
 assert.match(data.sectionNote,/no es un levantamiento topográfico integral/);
 assert.match(stops.get('portic-acceso').modelNote,/no acreditan un recorrido físico autorizado/);
 assert.match(stops.get('portic-entorno').modelNote,/no se afirma un inventario exacto/);
});

check('Executed accessibility works and the 2026 design commission remain distinct',()=>{
 assert.match(data.timeline.find(e=>e.id==='po-t-accesibilidad').text,/Se inauguran/);
 const e=data.timeline.find(e=>e.id==='po-t-inmersivo');
 assert(e.sourceIds.includes('po-proyecto2026'));assert.match(e.text,/redacción/);assert.match(e.text,/no se acredita.*ejecución/);
 assert.match(stops.get('portic-musealizacion').modelNote,/No se incorpora como terminada/);
 assert.match(sources.get('po-proyecto2026').type,/redacción de proyecto/);
});

check('Concise fact and chronology summaries respect per-source budgets',()=>{
 for(const [id,count] of Object.entries(summaries))assert(count<=200,id+': '+count+' words');
});

const report={
 generatedAt:new Date().toISOString(),pass:checks.every(c=>c.pass),checksCount:checks.length,
 scope:'Source integrity; guide/plan/context focus and floor agreement; basic archaeological dimensions; qualified reconstruction; separate funerary phases; second-block limitations; distinction between completed works and design announcements. This does not certify surveyed accuracy, present opening or accessibility, or rendering quality.',
 data:{stops:stops.size,regions:data.regions.length,layers:data.readingLegend.length,facts:data.stops.reduce((sum,s)=>sum+s.facts.length,0),timeline:data.timeline.length,sources:sources.size},
 factAndTimelineWordsBySource:summaries,
 wordCountScope:'Facts and timeline summaries. Bibliographic labels, original navigation copy and implementation decisions are excluded.',
 checks
};
fs.writeFileSync(root+'research/validation-v18/portic-visit-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
