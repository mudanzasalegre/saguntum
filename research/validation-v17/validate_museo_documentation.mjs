// Documentary provenance and shared-focus audit. This verifies the representation
// contract; it does not certify measured accuracy, physical access or current works.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(root+'dist/assets/data/'+name+'.json','utf8'));
const data=read('museo-visit'),plan=read('museo-plan'),context=read('museo-context');
const expected=['conjunto','plaza','fachada','acceso','balcones','cubierta','planta-baja','arcos','canteria','epigrafia','escultura','planta-alta','comercio','vida-privada','dolors','patio','rehabilitacion','arco','juderia','entorno'].map(id=>'museo-'+id);
const sources=new Map(data.sources.map(s=>[s.id,s])),stops=new Map(data.stops.map(s=>[s.id,s])),planStops=new Map(plan.stops.map(s=>[s.id,s]));
const confidenceIds=new Set(data.confidenceLegend.map(x=>x.id)),checks=[];
const sourceCheck=ids=>{assert(ids?.length);for(const id of ids)assert(sources.has(id),'Unknown source '+id);};
function check(label,fn){try{fn();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:error.stack||String(error)});}}
const words=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
const summaries=Object.fromEntries(data.sources.map(s=>[s.id,0]));
for(const item of [...data.stops.flatMap(s=>s.facts),...data.timeline])for(const id of item.sourceIds)summaries[id]=(summaries[id]||0)+words(item.text);

check('Twenty stable stops form one coherent visit with five themes',()=>{
 assert.equal(data.id,'museo');assert.equal(data.schemaVersion,1);
 assert.deepEqual(data.stops.map(s=>s.id),expected);assert.equal(stops.size,20);
 assert.deepEqual(data.stops.map(s=>s.order),Array.from({length:20},(_,i)=>i+1));
 assert.equal(data.regions.length,5);assert.equal(data.readingLegend.length,5);
 assert.equal(data.stops.reduce((n,s)=>n+s.facts.length,0),40);
 assert.equal(data.timeline.length,19);assert.equal(data.sources.length,20);
});
check('All claims, chronology and positions resolve to dated source records',()=>{
 assert.equal(sources.size,data.sources.length);
 for(const source of data.sources){assert(/^https:\/\//.test(source.url));assert(source.title&&source.author&&source.locator&&source.note);assert.equal(source.accessed,data.researchDate);}
 for(const stop of data.stops){
  sourceCheck(stop.sourceIds);sourceCheck(stop.coordinateSourceIds);
  assert(stop.title&&stop.label&&stop.intro&&stop.lookFor&&stop.modelNote&&stop.facts.length>=2);
  assert.equal(stop.narrative,stop.intro);assert(confidenceIds.has(stop.confidence));
  for(const fact of stop.facts){assert(fact.text);sourceCheck(fact.sourceIds);assert(confidenceIds.has(fact.confidence));for(const id of fact.sourceIds)assert(stop.sourceIds.includes(id));}
 }
 const ids=new Set();
 for(const event of data.timeline){assert(!ids.has(event.id));ids.add(event.id);assert(stops.has(event.stopId));assert(event.date&&event.title&&event.text);sourceCheck(event.sourceIds);assert(confidenceIds.has(event.confidence));}
});
check('Regions partition the route and thematic layers match the model plan',()=>{
 const layers=new Set(data.readingLegend.map(x=>x.id)),covered=[];
 assert.deepEqual([...layers],['casa','estructura','coleccion','rehabilitacion','barrio']);
 for(const layer of data.readingLegend)assert(/^#[0-9a-f]{6}$/i.test(layer.color));
 for(const region of data.regions){
  assert(region.name&&region.summary&&region.coordinate?.length===2);sourceCheck(region.sourceIds);
  for(const id of region.stopIds){assert(stops.has(id));assert.equal(stops.get(id).regionId,region.id);covered.push(id);}
 }
 assert.equal(covered.length,20);assert.equal(new Set(covered).size,20);
 for(const stop of data.stops){const p=planStops.get(stop.id);assert(layers.has(stop.readingLayer));assert.equal(stop.regionId,p.regionId,stop.id+' region');assert.equal(stop.readingLayer,p.readingLayer,stop.id+' layer');}
});
check('Coordinates, floors and registration are shared with the exported model',()=>{
 assert.deepEqual([...planStops.keys()].sort(),[...stops.keys()].sort());
 assert.deepEqual(data.modelRegistration.anchor,plan.modelRegistration.anchor);assert.equal(data.modelRegistration.yawRadians,plan.modelRegistration.yawRadians);
 assert.equal(data.modelRegistration.precision,'approximate');assert(data.modelRegistration.axisX&&data.modelRegistration.axisZ&&data.modelRegistration.method);
 for(const stop of data.stops){
  const c=stop.coordinate,p=planStops.get(stop.id);assert.deepEqual(c,stop.coordinates);assert(c.length===2&&c.every(Number.isFinite));
  assert(c[0]>-.279&&c[0]<-.2769&&c[1]>39.6779&&c[1]<39.6793);assert.equal(stop.coordinateConfidence,'approximate');
  const metres=Math.hypot((c[0]-p.coordinates[0])*111320*Math.cos(c[1]*Math.PI/180),(c[1]-p.coordinates[1])*111320);assert(metres<.05,stop.id+' focus mismatch');
  assert.equal(stop.floor,p.floor,stop.id+' floor');assert([null,0,1].includes(stop.floor));
 }
 assert(new Set(data.stops.map(s=>s.coordinate.join(','))).size>=18);
 assert.equal(stops.get('museo-planta-baja').floor,0);assert.equal(stops.get('museo-planta-alta').floor,1);
 assert.equal(stops.get('museo-comercio').floor,1);assert.equal(stops.get('museo-vida-privada').floor,1);
});
check('Four public-space focuses retain shared context coordinates',()=>{
 for(const id of ['museo-plaza','museo-arco','museo-juderia','museo-entorno']){
  assert(context.focusCoordinates[id]);assert.deepEqual(stops.get(id).coordinate,context.focusCoordinates[id]);assert.equal(stops.get(id).readingLayer,'barrio');
 }
 assert.notDeepEqual(stops.get('museo-arco').coordinate,stops.get('museo-juderia').coordinate);
});
check('Bajomedieval date and historical uses stay qualified',()=>{
 const dateFact=stops.get('museo-balcones').facts.find(f=>f.text.includes('siglo XIV'));
 assert(dateFact);assert.equal(dateFact.confidence,'disputed');assert(dateFact.sourceIds.includes('mu-proyecto2025'));assert(dateFact.sourceIds.includes('mu-man2017'));
 assert.equal(data.timeline.find(e=>e.id==='mu-t-medieval').confidence,'disputed');
 const use=stops.get('museo-fachada').facts.find(f=>/lonja|carnicería/.test(f.text));assert.equal(use.confidence,'interpretive');assert.match(use.text,/no.*definitivamente/);
 assert(stops.get('museo-dolors').facts.some(f=>f.confidence==='interpretive'&&/posible/.test(f.text)));
});
check('Museum institution, current seat and earlier buildings remain distinct',()=>{
 assert.match(data.timeline.find(e=>e.id==='mu-t-museo').text,/sede anterior/);
 assert.match(data.timeline.find(e=>e.id==='mu-t-proteccion').text,/Museo Saguntino y.*Museo del Teatro Romano/);
 assert.equal(data.timeline.find(e=>e.id==='mu-t-historico').date,'Julio de 2006');
 assert.equal(data.timeline.find(e=>e.id==='mu-t-apertura').date,'Mayo de 2007');
 assert.match(sources.get('mu-boe2006').note,/No certifica.*ubicación actual/i);
 assert.match(data.timeline.find(e=>e.id==='mu-t-pedres').date,/Finales del siglo XVIII/);
});
check('Published plan keeps the Dolors strip inside the museum parcel',()=>{
 const note=stops.get('museo-dolors').modelNote;assert.match(note,/3558701/);assert.match(note,/3558702.*contexto/);
 assert.match(sources.get('mu-catastro').locator,/3558701/);
 assert.match(sources.get('mu-proyecto2025').locator,/9–11/);
 assert(stops.get('museo-arcos').facts.some(f=>/cuatro crujías/.test(f.text)));
});
check('A teaching section does not invent an excavated basement or crypt',()=>{
 assert.equal(data.sectionOnOverview,true);assert.match(data.sectionNote,/Sección didáctica/);assert.match(data.sectionNote,/suelo permanece cerrado/);
 assert.match(stops.get('museo-patio').modelNote,/No se sitúan tumbas/);
 assert.match(stops.get('museo-planta-baja').modelNote,/no se convierte en una excavación visitable/i);
});
check('Typological objects avoid fabricated inscriptions and exact display claims',()=>{
 assert.match(stops.get('museo-epigrafia').modelNote,/No se graban textos antiguos inventados/);
 assert.match(stops.get('museo-escultura').modelNote,/no reproducciones mediante escáner/);
 assert(stops.get('museo-escultura').facts.some(f=>/atribuida a Diana/.test(f.text)));
 assert.match(stops.get('museo-vida-privada').modelNote,/No reproduce el Castigo de Dirce completo/);
 assert.match(stops.get('museo-comercio').modelNote,/no se presentan como una copia exacta/);
 assert.match(stops.get('museo-planta-alta').modelNote,/no se atribuye.*montaje exacto de 2026/);
});
check('2025 diagnosis, 2026 announcement and deserted tender are separate events',()=>{
 assert(data.timeline.find(e=>e.id==='mu-t-diagnostico').sourceIds.includes('mu-proyecto2025'));
 assert(data.timeline.find(e=>e.id==='mu-t-anuncio').sourceIds.includes('mu-ayto2026'));
 const e=data.timeline.find(e=>e.id==='mu-t-desierto');assert(e.sourceIds.includes('mu-desierto2026'));assert.match(e.text,/no recibe ofertas/);assert.match(e.text,/no acredita.*ejecución/);
 assert.match(stops.get('museo-rehabilitacion').modelNote,/no equivalen a obras terminadas/);
 assert.match(sources.get('mu-desierto2026').locator,/3 de julio de 2026/);
});
check('The museum arch is distinct from the Portalet and receives no borrowed 1321 date',()=>{
 const a=stops.get('museo-arco'),j=stops.get('museo-juderia');assert(a.osmIds.includes('way/1303697035'));assert(j.osmIds.includes('way/733421700'));
 assert.match(a.modelNote,/No se le traslada la licencia de 1321/);
 assert(j.facts.some(f=>/1321/.test(f.text)&&/Portalet de la Sang/.test(f.text)));
 assert.match(j.modelNote,/No demuestra la función de cada sala/i);
});
check('Concise fact and timeline summaries remain within the per-source limit',()=>{
 for(const[id,count]of Object.entries(summaries))assert(count<=200,id+': '+count+' words');
});
const report={generatedAt:new Date().toISOString(),pass:checks.every(c=>c.pass),checksCount:checks.length,scope:'Documentary provenance, qualified dates and uses, model/guide focus and floor agreement, separate arch identities, and limits of collection/repair representation. Bibliographic metadata and original explanatory copy are excluded from fact/timeline summary counts. Geometry, rendering, physical accessibility and present maintenance condition are outside this audit.',data:{stops:stops.size,regions:data.regions.length,layers:data.readingLegend.length,facts:data.stops.reduce((n,s)=>n+s.facts.length,0),timeline:data.timeline.length,sources:sources.size},factAndTimelineWordsBySource:summaries,checks};
fs.writeFileSync(root+'research/validation-v17/museo-visit-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
