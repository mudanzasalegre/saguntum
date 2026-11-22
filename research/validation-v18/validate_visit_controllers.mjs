// Validate source-backed data and visitor-controller contracts without WebGL.
// Browser layout, camera framing and actual DOM focus are verified separately.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createCastleVisit,createMonumentVisit,castlePeriodLabel,visitPeriodLabel} from '../../dist/js/castle-panel.js';
import {createDianaVisit} from '../../dist/js/berenguer-visit.js';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(root+'dist/assets/data/'+name+'-visit.json','utf8'));
const legacyIds=['castle','theatre','santa-maria','plaza-mayor','juderia','calvario'];
const datasets=Object.fromEntries(legacyIds.map(id=>[id,read(id)]));
const original=read('berenguer'),originalSnapshot=JSON.stringify(original);
const berenguer={...original,sectionOnOverview:true,relatedVisits:[{id:'diana',label:'Explorar el muro de Diana'}]};
const diana=createDianaVisit(berenguer);
const sangre={...read('sangre'),sectionOnOverview:true},salvador={...read('salvador'),sectionOnOverview:true};const museo={...read('museo'),sectionOnOverview:true,relatedVisits:[{id:'juderia',label:'Recorrer la Judería'}]};Object.assign(datasets,{berenguer,diana,sangre,salvador,museo});
const checks=[];
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
globalThis.requestAnimationFrame=callback=>callback();
const labels={'castle':'CASTILLO DE SAGUNTO','theatre':'TEATRO ROMANO','santa-maria':'SANTA MARÍA DE SAGUNTO','plaza-mayor':'PLAÇA MAJOR Y PUERTA DEL ALMUDÍN','juderia':'JUDERÍA Y PORTALET DE LA SANG','calvario':'CALVARIO Y ERMITA DE LA SOLEDAD','berenguer':'CASA DELS BERENGUER','diana':'MURO DE DIANA','sangre':'ERMITA DE LA SANGRE','salvador':'IGLESIA DEL SALVADOR','museo':'CASA DEL MESTRE PENYA · MUSEO ARQUEOLÓGICO'};

function check(label,fn){try{fn();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:error.stack||String(error)});}}
function element(){const listeners=new Map();return {hidden:true,innerHTML:'',listeners,parentElement:{parentElement:{scrollTop:0}},addEventListener:(name,fn)=>listeners.set(name,fn),contains:()=>true,closest:()=>null,querySelector:()=>({focus(){}})};}
function click(el,dataset={},attributes=[],disabled=false){const button={dataset,disabled,hasAttribute:name=>attributes.includes(name)};el.listeners.get('click')({target:{closest:()=>button}});}
function key(el,value){el.listeners.get('keydown')({target:{matches:()=>true},key:value,preventDefault(){}});}
function fixture(id,data){
  const el=element();let guide,near=false,sectionOpen=false,readingMode='materials',source=null,maps=0,ready=true;
  const state=stopId=>({active:true,stopId,ready,near,sectionOpen,readingMode});
  const config={element:el,data,monumentId:id,monumentLabel:labels[id],onSelect:stopId=>guide.setState(state(stopId)),onNear:()=>{near=!near;guide.setState(state(guide.getState().selected));},onMap:()=>maps++,onReading:mode=>{readingMode=mode;guide.setState(state(guide.getState().selected));},onSource:value=>{source=value;}};
  if(data.sectionInstructions&&id!=='portic')config.onSection=value=>{sectionOpen=value;guide.setState(state(guide.getState().selected));};
  guide=id==='castle'?createCastleVisit(config):createMonumentVisit(config);guide.setState(state(null));
  return {el,guide,state,setReady(value){ready=value;guide.setState(state(guide.getState().selected));},get maps(){return maps;},get source(){return source;}};
}

check('Casa has 18 stops, 5 regions, 5 thematic layers, 47 facts, 24 sources and 15 events',()=>{
  assert.equal(original.stops.length,18);assert.equal(original.regions.length,5);assert.equal(original.readingLegend.length,5);
  assert.equal(original.stops.reduce((n,s)=>n+s.facts.length,0),47);assert.equal(original.sources.length,24);assert.equal(original.timeline.length,15);
  assert.deepEqual(original.readingLegend.map(x=>x.id),['house','courtyards','water','wall','context']);
  for(const layer of original.readingLegend)assert(/^#[0-9a-f]{6}$/i.test(layer.color));
  assert(original.sectionInstructions&&original.sectionNote);assert.match(original.sectionNote,/posible baño ritual/);
});
for(const [id,data] of Object.entries({berenguer:original,diana,sangre,salvador,museo}))check(id+': all facts, coordinates, regions and chronology resolve',()=>{
  const sourceIds=new Set(data.sources.map(s=>s.id)),stopIds=new Set(data.stops.map(s=>s.id)),regions=new Map(data.regions.map(r=>[r.id,r])),layers=new Set(data.readingLegend.map(l=>l.id));
  assert.equal(sourceIds.size,data.sources.length);assert.equal(stopIds.size,data.stops.length);
  const checkSources=ids=>{assert(ids?.length);for(const sourceId of ids)assert(sourceIds.has(sourceId),'Unknown source '+sourceId);};
  for(const stop of data.stops){
    assert(stop.title&&stop.intro&&stop.lookFor&&stop.modelNote);assert(regions.has(stop.regionId));assert(layers.has(stop.readingLayer));
    assert.deepEqual(stop.coordinate,stop.coordinates);assert.equal(stop.coordinate.length,2);assert(stop.coordinate.every(Number.isFinite));
    assert(stop.coordinate[0]>-.283&&stop.coordinate[0]<-.267&&stop.coordinate[1]>39.674&&stop.coordinate[1]<39.682);
    assert.equal(stop.coordinateConfidence,'approximate');checkSources(stop.sourceIds);checkSources(stop.coordinateSourceIds);
    assert(stop.facts.length>=2);for(const fact of stop.facts){assert(fact.text);checkSources(fact.sourceIds);assert(['documented','interpretive','disputed'].includes(fact.confidence));}
  }
  for(const region of data.regions){for(const stopId of region.stopIds){assert(stopIds.has(stopId));assert.equal(data.stops.find(s=>s.id===stopId).regionId,region.id);}checkSources(region.sourceIds);}
  assert.equal(data.regions.reduce((n,r)=>n+r.stopIds.length,0),data.stops.length);
  for(const event of data.timeline){assert(event.date&&event.text);assert(stopIds.has(event.stopId));checkSources(event.sourceIds);}
  for(const source of data.sources)assert(/^https?:\/\//.test(source.url));
});
check('Diana derives exactly its five stops and wall timeline without changing Casa data',()=>{
  assert.equal(diana.id,'diana');assert.equal(diana.stops.length,5);assert(diana.stops.every(s=>s.id.startsWith('diana-')));
  assert.deepEqual(diana.stops.map(s=>s.id),['diana-conjunto','diana-aparejo','diana-retorno','diana-fabricas','diana-interpretaciones']);
  assert.equal(diana.regions.length,1);assert.equal(diana.regions[0].id,'muro');
  assert(diana.timeline.length>0);assert(diana.timeline.every(t=>diana.stops.some(s=>s.id===t.stopId)));
  assert(diana.timeline.some(t=>t.id==='bg-t-conservar'));assert(!diana.sectionInstructions&&!diana.sectionOnOverview);
  assert.equal(JSON.stringify(original),originalSnapshot);
});

storage.set('saguntum.berenguer.visited.v1',JSON.stringify(['berenguer-portada','diana-conjunto','removed-stop']));
storage.set('saguntum.diana.visited.v1',JSON.stringify(['diana-retorno','berenguer-portada']));
storage.set('saguntum.castle.visited.v1',JSON.stringify([datasets.castle.stops[1].id]));
datasets.portic=read('portic');labels.portic='VÍA DEL PÒRTIC';
const fixtures=Object.fromEntries(Object.entries(datasets).map(([id,data])=>[id,fixture(id,data)]));
const b=fixtures.berenguer,w=fixtures.diana;
check('Independent Casa and Diana progress filters stale and out-of-scope stops',()=>{
  assert.deepEqual(b.guide.getState().visited,['berenguer-portada','diana-conjunto']);assert.deepEqual(w.guide.getState().visited,['diana-retorno']);
  assert.equal(b.guide.getState().total,18);assert.equal(w.guide.getState().total,5);
});
check('Casa exposes its documented section on the overview; Diana exposes none',()=>{
  assert.equal(b.guide.getState().selected,null);assert.match(b.el.innerHTML,/data-visit-section aria-pressed="false"/);assert(b.el.innerHTML.includes(berenguer.sectionInstructions));
  click(b.el,{},['data-visit-section']);assert(b.guide.getState().sectionOpen);assert.match(b.el.innerHTML,/Cerrar sección/);assert(b.el.innerHTML.includes(berenguer.sectionNote));
  click(b.el,{},['data-visit-section']);assert(!b.guide.getState().sectionOpen);
  assert(!w.el.innerHTML.includes('data-visit-section'));w.guide.start();assert(!w.el.innerHTML.includes('data-visit-section'));assert(!w.el.innerHTML.includes('subsuelo escénico'));
});
check('Related links connect the house and wall while retaining separate panel IDs',()=>{
  assert.match(b.el.innerHTML,/class="related-visits"/);assert.match(b.el.innerHTML,/href="#diana"/);assert.match(w.el.innerHTML,/href="#berenguer"/);
  assert.match(b.el.innerHTML,/aria-controls="berenguer-tab-content"/);assert.match(w.el.innerHTML,/aria-controls="diana-tab-content"/);
  const ids=html=>[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert(!ids(b.el.innerHTML).some(id=>ids(w.el.innerHTML).includes(id)));
});
check('Casa selection, section and sources leave Diana and six prior visits unchanged',()=>{
  const before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='berenguer').map(([id,f])=>[id,f.guide.getState()]));
  click(b.el,{castleStop:'berenguer-aljibe'});click(b.el,{},['data-visit-section']);click(b.el,{castleSource:'bg-sefarad2020'});
  assert.equal(b.guide.getState().selected,'berenguer-aljibe');assert(b.guide.getState().sectionOpen);assert.equal(b.source.id,'bg-sefarad2020');
  for(const [id,state] of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
  assert(!JSON.parse(storage.get('saguntum.diana.visited.v1')).includes('berenguer-aljibe'));
});
check('Diana selection leaves Casa progress and section state unchanged',()=>{
  const before=b.guide.getState(),persisted=storage.get('saguntum.berenguer.visited.v1');click(w.el,{castleStop:'diana-interpretaciones'});
  assert.deepEqual(b.guide.getState(),before);assert.equal(storage.get('saguntum.berenguer.visited.v1'),persisted);assert.equal(w.guide.getState().selected,'diana-interpretaciones');
});
check('Casa notebook remains usable without WebGL while section and detail are disabled',()=>{
  click(b.el,{},['data-visit-section']);b.setReady(false);assert.match(b.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(b.el.innerHTML,/data-castle-near aria-pressed="false" disabled/);
  assert.match(b.el.innerHTML,/Estás explorando la documentación y el plano/);click(b.el,{castleStop:'berenguer-boveda'});assert.equal(b.guide.getState().selected,'berenguer-boveda');b.setReady(true);
});
check('Casa tabs, source details, timeline and layer legend use the correct data',()=>{
  click(b.el,{castleReading:'periods'});for(const layer of berenguer.readingLegend){assert(b.el.innerHTML.includes(layer.label));assert(b.el.innerHTML.includes('data-period="'+layer.id+'"'));}
  key(b.el,'ArrowRight');assert.equal(b.guide.getState().tab,'timeline');assert(!b.el.innerHTML.includes('data-visit-section'));assert.match(b.el.innerHTML,/aria-labelledby="berenguer-tab-timeline"/);
  key(b.el,'End');assert.equal(b.guide.getState().tab,'sources');assert(!b.el.innerHTML.includes('data-visit-section'));assert(b.el.innerHTML.includes('1083935Q'));
  key(b.el,'Home');assert.equal(b.guide.getState().tab,'visit');assert.match(b.guide.sourceContent(berenguer.sources[0]),/CASA DELS BERENGUER/);
  assert.match(w.guide.sourceContent(diana.sources[0]),/MURO DE DIANA/);
});
check('Map callbacks are independent for both new visits',()=>{click(b.el,{},['data-castle-map']);assert.equal(b.maps,1);assert.equal(w.maps,0);click(w.el,{},['data-castle-map']);assert.equal(w.maps,1);});

check('Sangre section, sources and thematic palette are independent of all previous visits',()=>{
  const f=fixtures.sangre,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='sangre').map(([id,v])=>[id,v.guide.getState()]));
  assert.equal(sangre.stops.length,16);assert.equal(sangre.readingLegend.length,5);
  assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false"/);
  click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);assert(f.el.innerHTML.includes(sangre.sectionNote));
  click(f.el,{castleStop:sangre.stops[4].id});assert.equal(f.guide.getState().selected,sangre.stops[4].id);
  click(f.el,{castleReading:'periods'});for(const layer of sangre.readingLegend)assert(f.el.innerHTML.includes(layer.label));
  click(f.el,{castleSource:sangre.sources[0].id});assert.equal(f.source.id,sangre.sources[0].id);
  key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');assert.equal(f.guide.getState().tab,'visit');
  for(const [id,state] of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
  click(f.el,{},['data-visit-section']);f.setReady(false);assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(f.el.innerHTML,/Estás explorando la documentación y el plano/);f.setReady(true);
});
check('Salvador section, sources and thematic palette are independent of all previous visits',()=>{
  const f=fixtures.salvador,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='salvador').map(([id,v])=>[id,v.guide.getState()]));
  assert(salvador.stops.length>=10);assert(salvador.readingLegend.length>=3);
  assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false"/);
  click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);assert(f.el.innerHTML.includes(salvador.sectionNote));
  click(f.el,{castleStop:salvador.stops[4].id});assert.equal(f.guide.getState().selected,salvador.stops[4].id);
  click(f.el,{castleReading:'periods'});for(const layer of salvador.readingLegend)assert(f.el.innerHTML.includes(layer.label));
  click(f.el,{castleSource:salvador.sources[0].id});assert.equal(f.source.id,salvador.sources[0].id);
  key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');assert.equal(f.guide.getState().tab,'visit');
  for(const [id,state] of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
  click(f.el,{},['data-visit-section']);f.setReady(false);assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(f.el.innerHTML,/Estás explorando la documentación y el plano/);f.setReady(true);
});
check('Museo section, sources and thematic palette are independent of all previous visits',()=>{
  const f=fixtures.museo,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='museo').map(([id,v])=>[id,v.guide.getState()]));
  assert.equal(museo.stops.length,20);assert.match(f.el.innerHTML,/href="#juderia"/);assert(museo.readingLegend.length>=3);
  assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false"/);
  click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);assert(f.el.innerHTML.includes(museo.sectionNote));
  click(f.el,{castleStop:museo.stops[4].id});assert.equal(f.guide.getState().selected,museo.stops[4].id);
  click(f.el,{castleReading:'periods'});for(const layer of museo.readingLegend)assert(f.el.innerHTML.includes(layer.label));
  click(f.el,{castleSource:museo.sources[0].id});assert.equal(f.source.id,museo.sources[0].id);
  key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');assert.equal(f.guide.getState().tab,'visit');
  for(const [id,state] of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
  click(f.el,{},['data-visit-section']);f.setReady(false);assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(f.el.innerHTML,/Estás explorando la documentación y el plano/);f.setReady(true);
});

check('Pòrtic uses independent sources, layers, progress and a single archaeological mode control',()=>{
  const data=datasets.portic,f=fixtures.portic,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='portic').map(([id,v])=>[id,v.guide.getState()]));
  assert.equal(data.stops.length,20);assert.equal(data.readingLegend.length,6);assert.equal(data.stops.reduce((n,s)=>n+s.facts.length,0),40);
  assert(!f.el.innerHTML.includes('data-visit-section'));
  click(f.el,{castleStop:'portic-cloaca'});assert.equal(f.guide.getState().selected,'portic-cloaca');
  click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
  click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/VÍA DEL PÒRTIC/);
  click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);
  key(f.el,'ArrowRight');assert.equal(f.guide.getState().tab,'timeline');assert(f.el.innerHTML.includes(data.timeline[0].date));
  key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');
  f.setReady(false);assert.match(f.el.innerHTML,/Estás explorando la documentación y el plano/);assert.match(f.el.innerHTML,/data-castle-near aria-pressed="false" disabled/);
  assert(!f.el.innerHTML.includes('data-visit-section'));click(f.el,{castleStop:'portic-medieval'});assert.equal(f.guide.getState().selected,'portic-medieval');f.setReady(true);
  for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
});

for(const [id,data] of Object.entries(datasets))check(id+': every stop is reachable and completion persists independently',()=>{
  const f=fixtures[id];f.guide.start();
  for(let i=0;i<data.stops.length;i++){assert.equal(f.guide.getState().selected,data.stops[i].id);assert(f.el.innerHTML.includes('Parada '+(i+1)+' de '+data.stops.length));assert(f.el.innerHTML.includes(data.stops[i].title));click(f.el,{},['data-castle-next']);}
  assert.equal(f.guide.getState().selected,null);assert.equal(f.guide.getState().visited.length,data.stops.length);assert(f.guide.getState().complete);assert.match(f.el.innerHTML,/Has llegado al final/);
  assert.equal(JSON.parse(storage.get('saguntum.'+id+'.visited.v1')).length,data.stops.length);
});
check('All six earlier notebooks retain layers, source identity, maps and conditional sections',()=>{
  assert.equal(castlePeriodLabel,visitPeriodLabel);assert.equal(visitPeriodLabel('roman'),'Época romana');
  for(const id of legacyIds){const f=fixtures[id],data=datasets[id];f.guide.start();click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend||[])assert(f.el.innerHTML.includes(layer.label));click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);assert.equal(f.el.innerHTML.includes('data-visit-section'),id!=='castle'&&!!data.sectionInstructions);assert.match(f.guide.sourceContent(data.sources[0]),new RegExp(id==='castle'?'CUADERNO DEL CASTILLO':labels[id]));}
});
check('Application integrates both panels, retains stable atlas branding and enables Casa overview section',()=>{
  const html=fs.readFileSync(root+'dist/index.html','utf8'),app=fs.readFileSync(root+'dist/js/app.js','utf8');
  for(const id of Object.keys(datasets))assert.equal((html.match(new RegExp('id="'+id+'-panel"','g'))||[]).length,1);
  assert.match(html,/<title>SAGUNTUM · Sagunto y Puerto de Sagunto<\/title>/);assert(app.includes('berenguerData.sectionOnOverview=true'));assert(app.includes('createDianaVisit(berenguerData)'));
});

const report={generatedAt:new Date().toISOString(),pass:checks.every(c=>c.pass),checksCount:checks.length,method:'Data invariants and state/render contracts with a minimal element adapter; no WebGL, layout or real browser-focus assertions.',data:{porticStops:datasets.portic.stops.length,porticFacts:datasets.portic.stops.reduce((n,s)=>n+s.facts.length,0),porticSources:datasets.portic.sources.length,porticTimeline:datasets.portic.timeline.length,museoStops:museo.stops.length,museoFacts:museo.stops.reduce((n,s)=>n+s.facts.length,0),museoSources:museo.sources.length,museoTimeline:museo.timeline.length,salvadorStops:salvador.stops.length,salvadorFacts:salvador.stops.reduce((n,s)=>n+s.facts.length,0),salvadorSources:salvador.sources.length,salvadorTimeline:salvador.timeline.length,sangreStops:sangre.stops.length,sangreFacts:sangre.stops.reduce((n,s)=>n+s.facts.length,0),sangreSources:sangre.sources.length,sangreTimeline:sangre.timeline.length,stops:berenguer.stops.length,wallStops:diana.stops.length,facts:berenguer.stops.reduce((n,s)=>n+s.facts.length,0),sources:berenguer.sources.length,timeline:berenguer.timeline.length,wallTimeline:diana.timeline.length},checks};
fs.mkdirSync(root+'research/validation-v18',{recursive:true});
fs.writeFileSync(root+'research/validation-v18/visit-controller-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
