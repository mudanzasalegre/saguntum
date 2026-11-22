// State and rendered-contract check with a minimal element adapter.
// Browser layout, actual DOM focus and pointer integration are checked separately.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createCastleVisit,createMonumentVisit,castlePeriodLabel,visitPeriodLabel} from '../../dist/js/castle-panel.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(root+'dist/assets/data/'+name+'.json','utf8'));
const castle=read('castle-visit'),theatre=read('theatre-visit'),church=read('santa-maria-visit'),plaza=read('plaza-mayor-visit'),checks=[];
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
globalThis.requestAnimationFrame=callback=>callback();
function element(){
  const listeners=new Map();return {hidden:true,innerHTML:'',listeners,parentElement:{parentElement:{scrollTop:0}},addEventListener:(name,fn)=>listeners.set(name,fn),contains:()=>true,closest:()=>null,querySelector:()=>({focus(){}})};
}
function click(el,dataset={},attributes=[],disabled=false){
  const button={dataset,disabled,hasAttribute:name=>attributes.includes(name)};
  el.listeners.get('click')({target:{closest:()=>button}});
}
function key(el,value){el.listeners.get('keydown')({target:{matches:()=>true},key:value,preventDefault(){}});}
function check(label,fn){fn();checks.push({label,pass:true});}
function fixture(data,id){
  const el=element();let guide,near=false,sectionOpen=false,readingMode='materials',source=null,maps=0,ready=true;
  const state=stopId=>({active:true,stopId,ready,near,sectionOpen,readingMode});
  const config={element:el,data,monumentId:id,monumentLabel:id==='castle'?'CASTILLO DE SAGUNTO':id==='santa-maria'?'SANTA MARÍA DE SAGUNTO':id==='plaza-mayor'?'PLAÇA MAJOR Y PUERTA DEL ALMUDÍN':'TEATRO ROMANO',onSelect:stopId=>guide.setState(state(stopId)),onNear:()=>{near=!near;guide.setState(state(guide.getState().selected));},onMap:()=>{maps++;},onReading:mode=>{readingMode=mode;guide.setState(state(guide.getState().selected));},onSource:value=>{source=value;},onSection:value=>{sectionOpen=value;guide.setState(state(guide.getState().selected));}};
  if(id==='plaza-mayor'&&!data.sectionInstructions)delete config.onSection;
  guide=id==='castle'?createCastleVisit(config):createMonumentVisit(config);guide.setState(state(null));
  return {el,guide,state,setReady(value){ready=value;guide.setState(state(guide.getState().selected));},get maps(){return maps;},get source(){return source;}};
}
storage.set('saguntum.castle.visited.v1',JSON.stringify([castle.stops[1].id,'removed-stop']));
storage.set('saguntum.theatre.visited.v1',JSON.stringify([theatre.stops[2].id]));
const c=fixture(castle,'castle'),t=fixture(theatre,'theatre'),s=fixture(church,'santa-maria'),p=fixture(plaza,'plaza-mayor');
check('Castle wrapper retains the 18-stop notebook and existing storage',()=>{assert.equal(c.guide.getState().total,18);assert.deepEqual(c.guide.getState().visited,[castle.stops[1].id]);});
check('Theatre has 16 stops and independent existing progress',()=>{assert.equal(t.guide.getState().total,16);assert.deepEqual(t.guide.getState().visited,[theatre.stops[2].id]);});
check('Tab IDs and aria-controls remain disjoint',()=>{
  const ids=html=>[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);const a=ids(c.el.innerHTML),b=ids(t.el.innerHTML);
  assert(a.length>=4&&b.length>=4);assert(a.every(id=>id.startsWith('castle-')));assert(b.every(id=>id.startsWith('theatre-')));assert(!a.some(id=>b.includes(id)));
  assert.match(t.el.innerHTML,/aria-controls="theatre-tab-content"/);assert.match(t.el.innerHTML,/aria-labelledby="theatre-tab-visit"/);
});
check('Shared period export preserves Castle compatibility',()=>{assert.equal(castlePeriodLabel,visitPeriodLabel);assert.equal(visitPeriodLabel('roman'),'Época romana');});
check('Dynamic overview reports each monument’s regions and stops',()=>{assert(c.el.innerHTML.includes('<strong>'+castle.regions.length+'</strong><span>recintos'));assert(t.el.innerHTML.includes('<strong>'+theatre.regions.length+'</strong><span>ámbitos'));assert.match(t.el.innerHTML,/<strong>16<\/strong><span>paradas/);});
check('Section control is available in documented section monuments and reflects actual state',()=>{assert(!c.el.innerHTML.includes('data-visit-section'));assert(!t.el.innerHTML.includes('data-visit-section'));t.guide.start();assert.match(t.el.innerHTML,/data-visit-section aria-pressed="false"/);click(t.el,{},['data-visit-section']);assert(t.guide.getState().sectionOpen);assert.match(t.el.innerHTML,/Cerrar sección/);assert.match(t.el.innerHTML,/role="status"/);click(t.el,{},['data-visit-section']);assert(!t.guide.getState().sectionOpen);});
check('WebGL-independent notebook disables section and near controls',()=>{t.guide.start();t.setReady(false);assert.match(t.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(t.el.innerHTML,/data-castle-near aria-pressed="false" disabled/);assert.match(t.el.innerHTML,/Estás explorando la documentación y el plano/);t.setReady(true);});
check('Selecting Theatre does not modify Castle progress or selected stop',()=>{const before=c.guide.getState();click(t.el,{castleStop:theatre.stops[5].id});assert.equal(t.guide.getState().selected,theatre.stops[5].id);assert.deepEqual(c.guide.getState(),before);assert(JSON.parse(storage.get('saguntum.theatre.visited.v1')).includes(theatre.stops[5].id));assert.deepEqual(JSON.parse(storage.get('saguntum.castle.visited.v1')),[castle.stops[1].id,'removed-stop']);});
check('Theatre layer legend follows the supplied dataset',()=>{click(t.el,{castleReading:'periods'});assert.match(t.el.innerHTML,/Leer las capas/);for(const item of theatre.readingLegend){assert(t.el.innerHTML.includes('data-period="'+item.id+'"'));assert(t.el.innerHTML.includes(item.label));}});
check('Arrow, Home and End keys switch and label the correct tab',()=>{key(t.el,'ArrowRight');assert.equal(t.guide.getState().tab,'timeline');assert(!t.el.innerHTML.includes('data-visit-section'));assert.match(t.el.innerHTML,/aria-labelledby="theatre-tab-timeline"/);key(t.el,'End');assert.equal(t.guide.getState().tab,'sources');assert(!t.el.innerHTML.includes('data-visit-section'));assert.match(t.el.innerHTML,/aria-labelledby="theatre-tab-sources"/);key(t.el,'Home');assert.equal(t.guide.getState().tab,'visit');});
check('Map and source actions remain isolated and correctly named',()=>{click(t.el,{},['data-castle-map']);assert.equal(t.maps,1);assert.equal(c.maps,0);click(t.el,{castleSource:theatre.sources[0].id});assert.equal(t.source.id,theatre.sources[0].id);assert.match(t.guide.sourceContent(t.source),/CUADERNO · TEATRO ROMANO/);assert.match(c.guide.sourceContent(castle.sources[0]),/CUADERNO DEL CASTILLO/);});
check('Source content escapes text and refuses non-HTTP URLs',()=>{const html=t.guide.sourceContent({title:'<script>x</script>',url:'javascript:alert(1)',note:'A & B'});assert(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);assert.match(html,/href="#"/);assert.match(html,/A &amp; B/);});
for(const [label,fixture,data] of [['Castle',c,castle],['Theatre',t,theatre],['Santa María',s,church],['Plaça Major',p,plaza]])check(label+' can traverse every stop and finish without losing progress',()=>{
  fixture.guide.start();for(let i=0;i<data.stops.length;i++){assert.equal(fixture.guide.getState().selected,data.stops[i].id);assert(fixture.el.innerHTML.includes('Parada '+(i+1)+' de '+data.stops.length));click(fixture.el,{},['data-castle-next']);}
  assert.equal(fixture.guide.getState().selected,null);assert.equal(fixture.guide.getState().visited.length,data.stops.length);assert(fixture.guide.getState().complete);assert.match(fixture.el.innerHTML,/Has llegado al final/);
});
check('Each monument retains its own persisted completion after both tours',()=>{assert.equal(JSON.parse(storage.get('saguntum.castle.visited.v1')).length,18);assert.equal(JSON.parse(storage.get('saguntum.theatre.visited.v1')).length,16);});
check('HTML contains both independent accessible visit sections',()=>{const html=fs.readFileSync(root+'dist/index.html','utf8');assert.match(html,/id="castle-panel" hidden aria-label="Visita al Castillo/);assert.match(html,/id="theatre-panel" hidden aria-label="Visita al Teatro/);});
check('Santa María uses its own labels, cut instructions and isolated state',()=>{s.guide.start();assert.match(s.el.innerHTML,/aria-controls="santa-maria-tab-content"/);assert(s.el.innerHTML.includes(church.sectionInstructions));assert(!s.el.innerHTML.includes('subsuelo escénico'));click(s.el,{},['data-visit-section']);assert(s.guide.getState().sectionOpen);assert.match(s.el.innerHTML,/Cerrar sección/);assert(s.el.innerHTML.includes(church.sectionNote));click(s.el,{castleReading:'periods'});for(const item of church.readingLegend)assert(s.el.innerHTML.includes(item.label));assert.match(s.guide.sourceContent(church.sources[0]),/SANTA MARÍA DE SAGUNTO/);assert(JSON.parse(storage.get('saguntum.santa-maria.visited.v1')).length===church.stops.length);});
check('Santa María is present as a third accessible panel',()=>{assert.match(fs.readFileSync(root+'dist/index.html','utf8'),/id="santa-maria-panel"[\s\S]{0,50}aria-label="Visita a Santa María/);});
check('Plaça Major exposes its own notebook, plan and reading legend',()=>{p.guide.start();assert.match(p.el.innerHTML,/aria-controls="plaza-mayor-tab-content"/);assert(p.el.innerHTML.includes(plaza.stops[0].title));click(p.el,{castleReading:'periods'});for(const item of plaza.readingLegend)assert(p.el.innerHTML.includes(item.label));click(p.el,{},['data-castle-map']);assert.equal(p.maps,1);assert.match(p.guide.sourceContent(plaza.sources[0]),/PLAÇA MAJOR Y PUERTA DEL ALMUDÍN/);});
check('Plaça Major offers a section only when its documented visit defines one',()=>{p.guide.start();assert.equal(p.el.innerHTML.includes('data-visit-section'),!!plaza.sectionInstructions);if(plaza.sectionInstructions){assert(p.el.innerHTML.includes(plaza.sectionInstructions));click(p.el,{},['data-visit-section']);assert(p.guide.getState().sectionOpen);}else assert(!p.el.innerHTML.includes('subsuelo escénico'));});
check('All four visits preserve disjoint progress and panel identities',()=>{const before=[c.guide.getState(),t.guide.getState(),s.guide.getState()];click(p.el,{castleStop:plaza.stops.at(-1).id});assert.deepEqual([c.guide.getState(),t.guide.getState(),s.guide.getState()],before);assert.equal(JSON.parse(storage.get('saguntum.plaza-mayor.visited.v1')).length,plaza.stops.length);const html=fs.readFileSync(root+'dist/index.html','utf8');for(const id of ['castle','theatre','santa-maria','plaza-mayor'])assert.equal((html.match(new RegExp('id="'+id+'-panel"','g'))||[]).length,1);});
check('Every plaza fact and chronology entry references a declared source and valid stop',()=>{const ids=new Set(plaza.sources.map(s=>s.id)),stops=new Set(plaza.stops.map(s=>s.id));assert.equal(ids.size,plaza.sources.length);assert.equal(stops.size,plaza.stops.length);for(const stop of plaza.stops)for(const fact of stop.facts||[]){assert(fact.text);assert(fact.sourceIds?.length);assert(fact.sourceIds.every(id=>ids.has(id)));}for(const event of plaza.timeline){assert(stops.has(event.stopId));assert(event.sourceIds?.length&&event.sourceIds.every(id=>ids.has(id)));}for(const source of plaza.sources)assert(/^https?:\/\//.test(source.url));});
const report={generatedAt:new Date().toISOString(),pass:true,checksCount:checks.length,method:'Controller with minimal element adapter. Actual focus and browser layout are separate checks.',checks};
fs.writeFileSync(root+'research/validation-v10/visit-controller-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
