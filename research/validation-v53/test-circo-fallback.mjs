// Execute the actual Simulator selection, route and fallback functions with
// no renderer, no native model and an empty visit-camera index.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {project} from '../../dist/js/territory-coordinates.js';
import {requestedVisitMode} from '../../dist/js/visit-presentation.js';
import {visitMap} from '../../dist/js/territory-visit-map.js';
const read=file=>fs.readFileSync(new URL('../../'+file,import.meta.url),'utf8');
const source=read('dist/js/territory.js'),index=JSON.parse(read('dist/assets/territory/visit-stops.json')).circo;
const record=JSON.parse(read('dist/assets/data/archaeology-public.json')).sites.find(p=>p.id==='circo');
function block(from,to){const start=source.indexOf(from),end=source.indexOf(to,start+from.length);assert(start>=0&&end>start);return source.slice(start,end);}
const functions=[
 block('  function writeLink(', '\n  function clear('),block('  function clear(', '\n  function placePose('),
 block('  function framePlace(', '\n  function select('),block('  function select(', '\n  function chooseStop('),
 block('  function chooseStop(', "\n  $('stop').onchange"),block('  function openLinkedPlace(', "\n  window.addEventListener('hashchange'"),
 block('  function fallback(', '\n  let lost='),
 block("  $('circo-current').onclick=", "\n  for(const [key,label] of Object.entries(regions))")
].join('\n');
const oldFetch=globalThis.fetch;
globalThis.fetch=async input=>new Response(String(input).endsWith('circo-plan.json')?read('dist/assets/data/circo-plan.json'):JSON.stringify({pnoaBlocks:[]}));
class Element{
 constructor(){this.attributes={};this.children=[];this.options=[];this.hidden=false;this.disabled=false;this.textContent='';}
 setAttribute(k,v){this.attributes[k]=String(v);}
 append(...children){this.children.push(...children);this.options.push(...children);}
 replaceChildren(...children){this.children=[...children];this.options=[...children];}
 set href(value){this._href=new URL(value,'https://saguntum.test/').href;}
 get href(){return this._href;}
 get hash(){return new URL(this._href).hash;}
}
const checks=[];
try{
 for(const legacy of [false,true]){
  const stops=index.stops.map((stop,i)=>{const s={...stop,...project(...stop.coordinate),number:i+1};if(legacy)delete s.mapScope;return s;});
  const place={...record,...project(...record.coordinate),href:'#circo',region:'sagunto',guide:{...index,stops},historical:{period:record.period,href:'#circo/circo-historica',inWorld:false}};
  const elements=new Map(),$=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const local=visitMap(()=>{}),context={requestedVisitMode,selected:null,activeStop:null,cameras:{},frames:{},nav:undefined,renderer:undefined,heritage:undefined,
   historical:false,exterior:false,focus2D:null,flags:{heritage:true},presentationReady:false,status:{},tourPanel:undefined,regions:{sagunto:'Sagunto histórico'},
   $,Option:class{constructor(label,value){this.label=label;this.value=value;}},document:{createElement:()=>new Element(),body:{classList:{add(){}}}},
   window:{addEventListener(){}},map:{close(){},draw(){},setVisit:(p,s)=>local.set(p,s)},panel(){},update2D(){},applyPresentation(){},readVisit:()=>null,savedStop:()=>undefined,
   byId:new Map([['circo',place]]),location:new URL('https://saguntum.test/?vista=plano#simulador/circo/circo-historica'),innerWidth:390,innerHeight:844,URL};
  context.history={pushState(_s,_t,url){context.location=new URL(url);},replaceState(_s,_t,url){context.location=new URL(url);}};
  vm.createContext(context);vm.runInContext(functions,context);
  $('expand').disabled=true;context.fallback('Mapa 2D');await new Promise(resolve=>setTimeout(resolve,0));
  const check=historical=>{
   assert.equal(context.status.presentationMode,historical?'historical':'current');
   assert.equal($('circo-current').attributes['aria-pressed'],String(!historical));
   assert.equal($('circo-historical').attributes['aria-pressed'],String(historical));
   assert.equal($('history').hidden,historical);assert.equal($('expand').disabled,false);
   assert.equal($('stop').value,historical?'circo-historica':'circo-conjunto');
   assert.equal(context.location.hash,historical?'#simulador/circo/circo-historica':'#simulador/circo/circo-conjunto');
   const width=local.bounds[2]-local.bounds[0];assert(historical?width>200:width<100);
  };
  check(true);assert.equal(context.status.stopIndex,17);
  $('circo-current').onclick();check(false);
  $('circo-historical').onclick();check(true);
  $('circo-current').onclick();$('history').onclick();check(true);
  for(const stop of stops.filter(s=>['circo-arena','circo-spina','circo-metae','circo-graderio','circo-historica','circo-carceres'].includes(s.id))){context.chooseStop(stop.id);assert.equal(context.status.presentationMode,'historical');assert.equal($('circo-historical').attributes['aria-pressed'],'true');}
  checks.push({index:legacy?'legacy without mapScope':'current with mapScope',cameraIndexEmpty:true,nativeModelAbsent:true,initialStop:17,roundTrips:2,historicalStops:6});
 }
 assert.equal(requestedVisitMode({id:'circo'},{id:'circo-historica'},{mode:'current'}),'historical');
 assert.equal(requestedVisitMode({id:'circo'},{id:'circo-vano'},{mode:'cut'}),'cut');
 // The fallback map header switches local plan/territory instead of remaining
 // a disabled expansion control over an already expanded map.
 const mapSource=read('dist/js/territory-map.js'),start=mapSource.indexOf("  document.getElementById('sim-expand').onclick="),end=mapSource.indexOf("  document.getElementById('sim-extent').onclick",start);
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 const mapContext={visitPlace:{id:'circo'},useLocal:true,municipal:false,wide:false,redraw(){},document:{getElementById:node,body:{classList:{contains:()=>true}}}};
 vm.createContext(mapContext);vm.runInContext(mapSource.slice(start,end),mapContext);
 node('sim-expand').onclick({});assert.equal(mapContext.useLocal,false);assert.equal(node('sim-expand').textContent,'Ver plano de paradas');
 node('sim-expand').onclick({});assert.equal(mapContext.useLocal,true);assert.equal(node('sim-expand').textContent,'Ver territorio');
 console.log(JSON.stringify({fallback:checks,localMapControl:'enabled and switches local/territory'},null,2));
}finally{globalThis.fetch=oldFetch;}
