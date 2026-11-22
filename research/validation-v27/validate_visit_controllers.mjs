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
  if(data.sectionInstructions&&!['portic','domus','circo','necropolis'].includes(id))config.onSection=value=>{sectionOpen=value;guide.setState(state(guide.getState().selected));};
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
datasets.domus=read('domus');labels.domus='DOMUS DELS PEIXOS';
datasets.circo=read('circo');labels.circo='PUERTA DEL CIRCO ROMANO';
datasets.necropolis=read('necropolis');labels.necropolis='NECRÓPOLIS JUDÍA E HIPOGEOS';
storage.set('saguntum.necropolis.visited.v1',JSON.stringify(['necro-fosas','circo-puerta','removed-necro-stop']));
datasets.horno={...read('horno'),sectionOnOverview:true};labels.horno='ALTO HORNO N.º 2';
storage.set('saguntum.horno.visited.v1',JSON.stringify(['horno-interior','necro-camara','removed-horno-stop']));
datasets.talleres={...read('talleres'),sectionOnOverview:true};labels.talleres='NAVE DE TALLERES GENERALES';
storage.set('saguntum.talleres.visited.v1',JSON.stringify(['talleres-interior','horno-interior','removed-talleres-stop']));
datasets['museo-industrial']={...read('museo-industrial'),sectionOnOverview:true};labels['museo-industrial']='MUSEO INDUSTRIAL Y DE LA MEMORIA OBRERA';
storage.set('saguntum.museo-industrial.visited.v1',JSON.stringify(['museo-industrial-via','museo-coleccion','removed-museum-stop']));
datasets.gerencia={...read('gerencia'),sectionOnOverview:true};labels.gerencia='GERENCIA Y CIUDAD JARDÍN';
storage.set('saguntum.gerencia.visited.v1',JSON.stringify(['gerencia-vestibulo','museo-industrial-via','removed-gerencia-stop']));
datasets.casino={...read('casino'),sectionOnOverview:true};labels.casino='CASINO RECREATIVO Y CULTURAL';
storage.set('saguntum.casino.visited.v1',JSON.stringify(['casino-patio','gerencia-vestibulo','removed-casino-stop']));
datasets.begona={...read('begona'),sectionOnOverview:true};labels.begona='NUESTRA SEÑORA DE BEGOÑA Y LA ALAMEDA';
storage.set('saguntum.begona.visited.v1',JSON.stringify(['begona-nave','casino-patio','removed-begona-stop']));
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
  const data=datasets.portic,f=fixtures.portic,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>!['portic','domus','circo','necropolis'].includes(id)).map(([id,v])=>[id,v.guide.getState()]));
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

check('Domus museum, disputed room, sources and progress stay independent of other visits',()=>{
  const data=datasets.domus,f=fixtures.domus,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='domus').map(([id,v])=>[id,v.guide.getState()]));
  assert.equal(data.stops.length,20);assert.equal(data.readingLegend.length,5);
  click(f.el,{castleStop:'domus-balneum'});assert.equal(f.guide.getState().selected,'domus-balneum');
  assert.match(f.el.innerHTML,/En discusión|En debate|depósito/);assert(!f.el.innerHTML.includes('data-visit-section'));
  click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
  click(f.el,{castleTab:'timeline'});assert.equal(f.guide.getState().tab,'timeline');assert(f.el.innerHTML.includes(data.timeline[0].title));
  key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');assert(f.el.innerHTML.includes(data.sources[0].title));
  f.setReady(false);click(f.el,{castleStop:'domus-impluvium'});assert.equal(f.guide.getState().selected,'domus-impluvium');assert.match(f.el.innerHTML,/requieren WebGL/);
  click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);f.setReady(true);
  for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
});

check('Circo uses its own plan, evidence, chronology and progress without a duplicate section control',()=>{
 const data=datasets.circo,f=fixtures.circo,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='circo').map(([id,v])=>[id,v.guide.getState()]));
 assert.equal(data.stops.length,20);assert.equal(data.readingLegend.length,5);assert(!f.el.innerHTML.includes('data-visit-section'));
 click(f.el,{castleStop:'circo-puerta'});assert.equal(f.guide.getState().selected,'circo-puerta');
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/PUERTA DEL CIRCO ROMANO/);
 key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');
 f.setReady(false);click(f.el,{castleStop:'circo-carceres'});assert.equal(f.guide.getState().selected,'circo-carceres');assert.match(f.el.innerHTML,/requieren WebGL/);
 click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);f.setReady(true);
 for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
});


check('Necrópolis preserves both sectors, its evidence and independent progress without duplicate section controls',()=>{
 const data=datasets.necropolis,f=fixtures.necropolis,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='necropolis').map(([id,v])=>[id,v.guide.getState()]));
 assert.equal(Object.keys(fixtures).length,21);assert.equal(data.stops.length,20);assert.equal(data.readingLegend.length,5);
 assert.deepEqual(f.guide.getState().visited,['necro-fosas']);assert(!f.el.innerHTML.includes('data-visit-section'));
 assert.deepEqual(data.sectorOverviews,{cementerio:'necro-conjunto',hipogeos:'necro-hipogeos'});
 assert.deepEqual(data.historicalStops,{cementerio:'necro-historica',hipogeos:'necro-transformaciones'});
 for(const sector of ['cementerio','hipogeos']){
  const list=data.stops.filter(s=>s.archFocus===sector);assert.equal(list.length,10);assert(list.every(s=>s.mapScope===sector));
  click(f.el,{castleStop:data.sectorOverviews[sector]});assert.equal(f.guide.getState().selected,data.sectorOverviews[sector]);
  assert(!f.el.innerHTML.includes('data-visit-section'));
 }
 click(f.el,{castleStop:'necro-hornacina'});assert.match(f.el.innerHTML,/En discusión|En debate/);
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/NECRÓPOLIS JUDÍA E HIPOGEOS/);
 click(f.el,{castleTab:'timeline'});assert.equal(f.guide.getState().tab,'timeline');assert(f.el.innerHTML.includes(data.timeline[0].title));
 key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');assert(f.el.innerHTML.includes(data.sources[0].title));key(f.el,'Home');
 f.setReady(false);click(f.el,{castleStop:'necro-camara'});assert.equal(f.guide.getState().selected,'necro-camara');assert.match(f.el.innerHTML,/requieren WebGL/);assert(!f.el.innerHTML.includes('data-visit-section'));
 click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);f.setReady(true);
 for(const [id,state] of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
 const progress=JSON.parse(storage.get('saguntum.necropolis.visited.v1'));assert(progress.includes('necro-conjunto')&&progress.includes('necro-hipogeos'));assert(!progress.includes('circo-puerta'));
});

check('Horno has independent progress, working section, source identity and all three tabs',()=>{
 const f=fixtures.horno,data=datasets.horno,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='horno').map(([id,g])=>[id,g.guide.getState()]));
 assert.deepEqual(f.guide.getState().visited,['horno-interior']);assert.equal(data.stops.length,20);
 assert.match(f.el.innerHTML,/data-visit-section/);click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);
 click(f.el,{castleStop:'horno-interior'});assert.equal(f.guide.getState().selected,'horno-interior');
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/ALTO HORNO/);
 key(f.el,'ArrowRight');assert.equal(f.guide.getState().tab,'timeline');assert(f.el.innerHTML.includes(data.timeline[0].date));key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');
 click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);f.setReady(false);assert.match(f.el.innerHTML,/requieren WebGL/);click(f.el,{castleStop:'horno-skip'});assert.equal(f.guide.getState().selected,'horno-skip');f.setReady(true);
 for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
});
check('Talleres retains independent progress, roof controls, sources, reading layers and tabs',()=>{
 const f=fixtures.talleres,data=datasets.talleres,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='talleres').map(([id,g])=>[id,g.guide.getState()]));
 assert.deepEqual(f.guide.getState().visited,['talleres-interior']);assert.equal(data.stops.length,20);
 assert.match(f.el.innerHTML,/Abrir cubiertas/);click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);assert.match(f.el.innerHTML,/Cerrar cubiertas/);
 click(f.el,{castleStop:'talleres-interior'});assert.equal(f.guide.getState().selected,'talleres-interior');
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/TALLERES GENERALES/);
 key(f.el,'ArrowRight');assert.equal(f.guide.getState().tab,'timeline');assert(f.el.innerHTML.includes(data.timeline[0].date));key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');
 click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);f.setReady(false);assert.match(f.el.innerHTML,/requieren WebGL/);click(f.el,{castleStop:'talleres-cerchas'});assert.equal(f.guide.getState().selected,'talleres-cerchas');f.setReady(true);
 for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
});
check('Puerto guided visits use the selected region for readiness, maps, section and geometry',()=>{
 const app=fs.readFileSync(root+'dist/js/app.js','utf8');
 assert(app.includes("regionsBuilt.has(regionOf(byId[id]))"));assert(app.includes("const v=guidedVisit();"));assert(app.includes("regionOf(byId[monumentId])==='puerto'?portGeo:geo"));
 assert(app.includes('hornoVisit:hornoData,hornoContext:hornoContextData'));assert(app.includes('portHeritage.bindGround?.(portTerrain.meshHeightAt)'));
});

check('Industrial museum has its own progress, floors, section and sources, separate from the archaeological museum',()=>{
 const f=fixtures['museo-industrial'],data=datasets['museo-industrial'],originalState=fixtures.museo.guide.getState();
 assert.equal(data.stops.length,20);assert.deepEqual(f.guide.getState().visited,['museo-industrial-via']);
 assert.equal(f.guide.getState().selected,null);assert.match(f.el.innerHTML,/data-visit-section/);
 click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);click(f.el,{},['data-visit-section']);assert(!f.guide.getState().sectionOpen);
 for(const id of['museo-industrial-nave-central','museo-industrial-planta-primera','museo-industrial-planta-segunda']){click(f.el,{castleStop:id});assert.equal(f.guide.getState().selected,id);}
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/MUSEO INDUSTRIAL/);
 key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);
 assert.deepEqual(fixtures.museo.guide.getState(),originalState);
});

check('Gerencia integrates office interiors, gardens, section and independent progress',()=>{
 const f=fixtures.gerencia,data=datasets.gerencia,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='gerencia').map(([id,v])=>[id,v.guide.getState()]));
 assert.equal(data.stops.length,20);assert.deepEqual(f.guide.getState().visited,['gerencia-vestibulo']);assert.equal(data.readingLegend.length,5);
 assert.equal(f.guide.getState().selected,null);assert.match(f.el.innerHTML,/data-visit-section/);
 click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);click(f.el,{},['data-visit-section']);assert(!f.guide.getState().sectionOpen);
 for(const id of['gerencia-vestibulo','gerencia-escalera','gerencia-salas','gerencia-jardin-oriental','gerencia-adosadas']){click(f.el,{castleStop:id});assert.equal(f.guide.getState().selected,id);}
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/GERENCIA/);
 key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);
 for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
});

check('Casino documents source-backed interiors, exterior floors and the unfinished intervention',()=>{
 const data=datasets.casino,sourceIds=new Set(data.sources.map(s=>s.id)),stopIds=new Set(data.stops.map(s=>s.id));
 const regions=new Map(data.regions.map(r=>[r.id,r]));
 assert.equal(data.stops.length,20);assert.equal(stopIds.size,20);assert.equal(data.stops.reduce((n,s)=>n+s.facts.length,0),40);
 assert.equal(sourceIds.size,data.sources.length);assert(data.sources.length>=12);assert.equal(data.readingLegend.length,5);assert.equal(data.regions.length,5);
 const refs=ids=>{assert(ids?.length);for(const id of ids)assert(sourceIds.has(id),'Unresolved Casino source '+id);};
 for(const stop of data.stops){
  assert(stop.title&&stop.intro&&stop.modelNote&&stop.lookFor);assert(regions.has(stop.regionId));
  assert(data.readingLegend.some(l=>l.id===stop.readingLayer));refs(stop.sourceIds);refs(stop.coordinateSourceIds);
  assert.deepEqual(stop.coordinate,stop.coordinates);assert.equal(stop.coordinate.length,2);assert(stop.coordinate.every(Number.isFinite));
  assert(stop.coordinate[0]>-.226&&stop.coordinate[0]<-.219&&stop.coordinate[1]>39.656&&stop.coordinate[1]<39.662);
  if(stop.interiorView)assert([0,1].includes(stop.floor));else assert.equal(stop.floor,null);
  for(const fact of stop.facts){assert(fact.text);refs(fact.sourceIds);assert(['documented','interpretive','disputed'].includes(fact.confidence));}
 }
 assert.equal(data.stops.filter(s=>s.interiorView).length,7);
 assert.deepEqual(data.stops.filter(s=>s.interiorView&&s.floor===1).map(s=>s.id),['casino-galeria','casino-planta-alta']);
 for(const region of data.regions){refs(region.sourceIds);for(const id of region.stopIds){assert(stopIds.has(id));assert.equal(data.stops.find(s=>s.id===id).regionId,region.id);}}
 assert.equal(data.regions.reduce((n,r)=>n+r.stopIds.length,0),20);
 for(const event of data.timeline){assert(event.date&&event.text);assert(stopIds.has(event.stopId));refs(event.sourceIds);}
 assert(data.timeline.some(t=>t.confidence==='disputed'&&t.date.includes('1968')));
 assert.match(data.visitNote,/2026/);assert.match(data.visitNote,/obras en curso/);assert.match(data.visitNote,/Casino Playa/);
 assert(data.stops.find(s=>s.id==='casino-terraza').facts.some(f=>f.confidence==='disputed'));
 assert.equal(data.modelRegistration.provisionalCoordinates,false,'Casino focuses must be registered before final validation');
});
check('Casino keeps independent progress, two interior levels, sources, section and fallback',()=>{
 const f=fixtures.casino,data=datasets.casino,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='casino').map(([id,v])=>[id,v.guide.getState()]));
 assert.deepEqual(f.guide.getState().visited,['casino-patio']);assert.equal(f.guide.getState().selected,null);
 assert(f.el.innerHTML.includes('Esta visita interpreta espacios históricos'));assert(f.el.innerHTML.includes('octubre de 2026'));
 assert.match(f.el.innerHTML,/data-visit-section/);click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);
 assert(f.el.innerHTML.includes(data.sectionNote));click(f.el,{},['data-visit-section']);assert(!f.guide.getState().sectionOpen);
 for(const id of ['casino-vestibulo','casino-patio','casino-galeria','casino-biblioteca','casino-planta-alta','casino-jardin','casino-memoria']){
  click(f.el,{castleStop:id});assert.equal(f.guide.getState().selected,id);
 }
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/CASINO RECREATIVO Y CULTURAL/);
 key(f.el,'ArrowRight');assert.equal(f.guide.getState().tab,'timeline');assert(f.el.innerHTML.includes('1968–1969'));
 key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');
 click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);
 f.setReady(false);assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(f.el.innerHTML,/requieren WebGL/);
 click(f.el,{castleStop:'casino-escalera'});assert.equal(f.guide.getState().selected,'casino-escalera');f.setReady(true);
 for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
 assert(!JSON.parse(storage.get('saguntum.casino.visited.v1')).includes('gerencia-vestibulo'));
});

check('Begoña has independent progress, church and choir levels, sources, section and fallback',()=>{
 const f=fixtures.begona,data=datasets.begona,before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='begona').map(([id,v])=>[id,v.guide.getState()]));
 assert.deepEqual(f.guide.getState().visited,['begona-nave']);assert.equal(f.guide.getState().selected,null);
 assert(f.el.innerHTML.includes(data.introduction));
 assert.match(f.el.innerHTML,/data-visit-section/);click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);
 assert(f.el.innerHTML.includes(data.sectionNote));click(f.el,{},['data-visit-section']);assert(!f.guide.getState().sectionOpen);
 for(const id of ['begona-nave','begona-coro','begona-presbiterio','begona-alameda','begona-ciudad-factoria']){
  click(f.el,{castleStop:id});assert.equal(f.guide.getState().selected,id);
 }
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/BEGOÑA/);
 key(f.el,'ArrowRight');assert.equal(f.guide.getState().tab,'timeline');
 key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');
 click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);
 f.setReady(false);assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(f.el.innerHTML,/requieren WebGL/);
 click(f.el,{castleStop:'begona-portada'});assert.equal(f.guide.getState().selected,'begona-portada');f.setReady(true);
 for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
 assert(!JSON.parse(storage.get('saguntum.begona.visited.v1')).includes('casino-patio'));
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

const report={generatedAt:new Date().toISOString(),pass:checks.every(c=>c.pass),checksCount:checks.length,method:'Data invariants and state/render contracts with a minimal element adapter; no WebGL, layout or real browser-focus assertions.',data:{visits:Object.keys(datasets).length,begonaStops:datasets.begona.stops.length,begonaFacts:datasets.begona.stops.reduce((n,s)=>n+s.facts.length,0),begonaSources:datasets.begona.sources.length,begonaTimeline:datasets.begona.timeline.length,casinoStops:datasets.casino.stops.length,casinoFacts:datasets.casino.stops.reduce((n,s)=>n+s.facts.length,0),casinoSources:datasets.casino.sources.length,casinoTimeline:datasets.casino.timeline.length,gerenciaStops:datasets.gerencia.stops.length,gerenciaSources:datasets.gerencia.sources.length,museoIndustrialStops:datasets['museo-industrial'].stops.length,museoIndustrialSources:datasets['museo-industrial'].sources.length,talleresStops:datasets.talleres.stops.length,talleresSources:datasets.talleres.sources.length,hornoStops:datasets.horno.stops.length,hornoSources:datasets.horno.sources.length,necropolisStops:datasets.necropolis.stops.length,necropolisFacts:datasets.necropolis.stops.reduce((n,s)=>n+s.facts.length,0),necropolisSources:datasets.necropolis.sources.length,necropolisTimeline:datasets.necropolis.timeline.length,circoStops:datasets.circo.stops.length,circoFacts:datasets.circo.stops.reduce((n,s)=>n+s.facts.length,0),circoSources:datasets.circo.sources.length,circoTimeline:datasets.circo.timeline.length,domusStops:datasets.domus.stops.length,domusFacts:datasets.domus.stops.reduce((n,s)=>n+s.facts.length,0),domusSources:datasets.domus.sources.length,domusTimeline:datasets.domus.timeline.length,porticStops:datasets.portic.stops.length,porticFacts:datasets.portic.stops.reduce((n,s)=>n+s.facts.length,0),porticSources:datasets.portic.sources.length,porticTimeline:datasets.portic.timeline.length,museoStops:museo.stops.length,museoFacts:museo.stops.reduce((n,s)=>n+s.facts.length,0),museoSources:museo.sources.length,museoTimeline:museo.timeline.length,salvadorStops:salvador.stops.length,salvadorFacts:salvador.stops.reduce((n,s)=>n+s.facts.length,0),salvadorSources:salvador.sources.length,salvadorTimeline:salvador.timeline.length,sangreStops:sangre.stops.length,sangreFacts:sangre.stops.reduce((n,s)=>n+s.facts.length,0),sangreSources:sangre.sources.length,sangreTimeline:sangre.timeline.length,stops:berenguer.stops.length,wallStops:diana.stops.length,facts:berenguer.stops.reduce((n,s)=>n+s.facts.length,0),sources:berenguer.sources.length,timeline:berenguer.timeline.length,wallTimeline:diana.timeline.length},checks};
fs.mkdirSync(root+'research/validation-v27',{recursive:true});
fs.writeFileSync(root+'research/validation-v27/visit-controller-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checksCount,visits:report.data.visits,failures:report.checks.filter(c=>!c.pass)},null,2));
if(!report.pass)process.exitCode=1;
