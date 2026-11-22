// Exact production controller helpers + real Canvas maps, with a minimal DOM
// adapter. This does not claim browser layout, native focus or WebGL validation.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createMonumentVisit,castlePeriodLabel} from '../../dist/js/castle-panel.js';
import {drawPantalanMap} from '../../dist/js/pantalan-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas/index.js`);
const root=new URL('../../',import.meta.url),snapshots=new Map();
const readText=p=>{if(!snapshots.has(p))snapshots.set(p,fs.readFileSync(new URL(p,root),'utf8'));return snapshots.get(p);},read=p=>JSON.parse(readText(p));
const app=readText('dist/js/app.js'),css=readText('dist/style.css'),html=readText('dist/index.html'),coastSource=readText('dist/js/coast.js');
for(const path of ['dist/js/castle-panel.js','dist/js/pantalan-map.js','dist/js/theme.js'])readText(path);
const ids=['pantalan-paseo','pantalan-maritimo'];
const data=Object.fromEntries(ids.map(id=>[id,{...read(`dist/assets/data/${id}-visit.json`),plan:read(`dist/assets/data/${id}-plan.json`)}]));
const geography=read('dist/assets/data/coast-cartography.json'),water=read('dist/assets/data/coast-water.json');
const actualGuidedIds=vm.runInNewContext(app.match(/^const guidedIds=([^;]+);/m)[1]);
const checks=[];
async function check(label,fn){try{await fn();checks.push({pass:true,label});}catch(error){checks.push({pass:false,label,error:error.stack||String(error)});}}
function extractFunction(source,name){
 const start=source.search(new RegExp(`^(?:async )?function ${name}\\(`,'m'));assert(start>=0,`Function ${name} exists`);
 const lineEnd=source.indexOf('\n',start),first=source.slice(start,lineEnd);
 if(first.endsWith('}'))return first;
 const end=source.indexOf('\n}',start);assert(end>start);return source.slice(start,end+2);
}
const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};globalThis.requestAnimationFrame=fn=>fn();
function node(id,canvas=null){
 const listeners=new Map(),attributes={},classes=new Set(),base={id,hidden:true,innerHTML:'',textContent:'',scrollTop:0,disabled:false,style:{},listeners,attributes,dataset:{},isConnected:true,parentElement:{parentElement:{scrollTop:0}},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v),toggle(v,on){on===undefined?!classes.has(v)?classes.add(v):classes.delete(v):on?classes.add(v):classes.delete(v);}},setAttribute:(key,value)=>attributes[key]=String(value),addEventListener:(name,fn)=>listeners.set(name,fn),contains:()=>true,closest:()=>null,querySelector:()=>({focus(){}}),querySelectorAll:()=>[],focus(){},getBoundingClientRect:()=>({left:0,top:0,width:canvas?.width||360,height:canvas?.height||200}),insertAdjacentHTML(position,content){this.innerHTML+=content;}};
 if(canvas){base.getContext=(...args)=>canvas.getContext(...args);for(const key of ['width','height'])Object.defineProperty(base,key,{get:()=>canvas[key],set:v=>canvas[key]=v});}
 return base;
}
function click(element,dataset={},attributes=[],disabled=false){const button={dataset,disabled,hasAttribute:name=>attributes.includes(name)};element.listeners.get('click')({target:{closest:()=>button}});}
function key(element,key){element.listeners.get('keydown')({target:{matches:()=>true},key,preventDefault(){}});}
function fixture({ready=true,width=1440,height=900,loaded=true,models=true}={}){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,node(id,id==='minimap'?createCanvas(238,138):null));return elements.get(id);};
 const records=read('dist/assets/data/coast-pier.json').sites,byId=Object.fromEntries(records.map(record=>[record.id,{...record,coastal:true,region:'coast'}]));
 const visitStates=Object.fromEntries(ids.map(id=>[id,{guide:null,stopId:null,readingMode:'materials',sectionOpen:false,fallbackMap:null}]));
 const calls={phase:[],inspection:[],fly:[],refresh:0,loads:[],status:0};
 const modelSites=Object.fromEntries(ids.map(id=>[id,{currentGroup:{visible:true},historicalGroup:{visible:false},visit:{focuses:Object.fromEntries(data[id].stops.map(stop=>[stop.id,{modes:stop.mode?[stop.mode]:['current','historical'],requiresSection:!!stop.requiresSection}])),plan:data[id].plan,setReadingMode(){},selectFocus(){},setSection(){}}}]));
 const localModes={},body=node('body');
 const modeSource=coastSource.slice(coastSource.indexOf(' function setMode(')+1,coastSource.indexOf('\n }',coastSource.indexOf(' function setMode('))+3);
 const nativeMode=new Function('sites','modes',`return (${modeSource});`)(modelSites,localModes);
 const ctx={console,selected:'pantalan-paseo',atlasHome:false,ready,renderer:ready?{shadowMap:{}}:null,scene:null,activeRegion:'coast',closeView:false,mapFocus:null,marineInspection:false,roofOpen:false,portFocus:null,coastFocus:null,landscapeFocus:null,focusSerial:0,
  $:get,document:{getElementById:get,body,querySelectorAll:()=>[]},location:{hash:'#pantalan-paseo'},history:{replaceState(a,b,value){ctx.location.hash=value;}},innerWidth:width,innerHeight:height,
  guidedIds:ids,pantalanIds:new Set(ids),archaeologicalVisitIds:new Set(['portic','domus','circo','necropolis']),visitStates,visitDataFor:id=>data[id],pantalanPaseoData:data[ids[0]],pantalanMaritimoData:data[ids[1]],byId,
  coastModes:Object.fromEntries(ids.map(id=>[id,'current'])),coastGeo:loaded?geography:null,coastWater:water,coastHeight:()=>0,rawHeight:()=>0,portHeight:()=>0,geo:null,portGeo:null,landscapes:{},coastRecords:Object.fromEntries(records.map(r=>[r.id,r])),coastalPeriods:{},mapSites:Object.values(byId),
  coastHeritage:models?{sites:modelSites,modes:localModes,setMode(id,mode){calls.phase.push([id,mode]);nativeMode(id,mode);}}:undefined,
  coastEnvironment:models?{visible:true,setInspection(open){this.visible=!open;calls.inspection.push(open);},invalidate(){}}:undefined,portHeritage:undefined,civic:undefined,excavation:undefined,
  regionsBuilt:new Set(ready?['coast']:[]),regionOf:c=>c?.region||'sagunto',isLandscape:()=>false,regionInfo:{coast:{map:'PANTALÁN · GRAU VELL',caption:'COSTA',subtitle:'Litoral'},sagunto:{map:'SAGUNTO',caption:'SAGUNTO',subtitle:'Ciudad'}},
  getMapPalette,drawPantalanMap,castlePeriodLabel,createMonumentVisit,
  castleStopId:null,theatreStopId:null,churchStopId:null,plazaStopId:null,juderiaStopId:null,calvarioStopId:null,theatreSectionOpen:false,churchSectionOpen:false,plazaSectionOpen:false,castleFallbackMap:null,theatreFallbackMap:null,churchFallbackMap:null,plazaFallbackMap:null,juderiaFallbackMap:null,calvarioFallbackMap:null,
  fallbackCanvas:ready?null:node('fallback-scene',createCanvas(width,height)),stopTour(){},closeCatalog(){},archaeologyPanel(){},portPanel(){},landscapePanel(){},renderCatalog(){},syncRoofButton(){},applyRegionVisibility(){},setRegion(region){ctx.activeRegion=region;},resize(){},fly(name){calls.fly.push(name);},updateStatus(){calls.status++;},toast(message){throw Error(message);},dialog(){},visitMapDialog(){calls.maps=(calls.maps||0)+1;},toggleNearView(){ctx.closeView=!ctx.closeView;ctx.castlePanel();},
  async ensureRegionData(region){calls.loads.push(region);await Promise.resolve();ctx.coastGeo=geography;},async ensureRegion(){throw Error('Unexpected WebGL model build in no-WebGL test');}
 };
 vm.createContext(ctx);
 for(const name of ['guidedVisit','setVisitStop','setVisitSection','visitFallback','visitMapOptions','currentMap','castleFrame','refreshMap','castlePanel','coastPanel','applyPantalanMode','changeCoastMode','selectVisitStop','selectionFromHash','focus'])vm.runInContext(extractFunction(app,name),ctx);
 const loopStart=app.indexOf(' for(const id of Object.keys(visitStates)){const state=visitStates[id],data=visitDataFor(id);');
 assert(loopStart>=0,'Actual shared controller wiring loop exists');const loopEnd=app.indexOf('\n }',loopStart)+3;
 vm.runInContext(app.slice(loopStart,loopEnd),ctx);ctx.castlePanel();
 return{ctx,elements,get,calls,modelSites,body,phase(mode){ctx.changeCoastMode(mode);},click(id,dataset={},attributes=[]){click(get(id+'-panel'),dataset,attributes);}};
}

await check('Atlas identity, 26 guides, 31 places and six regions remain intact',()=>{
 assert.equal(actualGuidedIds.length,26);assert.equal(new Set(actualGuidedIds).size,26);assert.deepEqual(Array.from(actualGuidedIds.slice(-2)),ids);
 assert.match(html,/<title>SAGUNTUM · Sagunto y Puerto de Sagunto<\/title>/);assert.match(html,/class="place-count">31</);assert.match(app,/const regionCounts=\{sagunto:15,puerto:9,coast:4,marjal:1,almarda:1,palancia:1\}/);
 for(const id of actualGuidedIds)assert.equal((html.match(new RegExp(`id="${id}-panel"`,'g'))||[]).length,1);
});
await check('New data and exact production guide wiring provide sources, separate progress and reciprocal visits',()=>{
 const f=fixture();for(const id of ids){const d=data[id],guide=f.ctx.visitStates[id].guide;assert(guide);assert.equal(guide.getState().total,d.stops.length);assert.deepEqual(d.presentationModes.map(m=>m.id),['current','historical']);assert(d.relatedVisits.some(r=>r.id===ids.find(other=>other!==id)));const sources=new Set(d.sources.map(s=>s.id));for(const stop of d.stops){assert(stop.coordinate?.every(Number.isFinite));assert(stop.title&&stop.intro&&stop.facts.length);for(const fact of stop.facts)for(const sid of fact.sourceIds)assert(sources.has(sid));}}
 f.click(ids[0],{castleStop:'pantalan-paseo-pergolas'});assert.equal(f.ctx.visitStates[ids[0]].stopId,'pantalan-paseo-pergolas');assert.equal(f.ctx.visitStates[ids[1]].stopId,null);assert(!f.ctx.visitStates[ids[1]].guide.getState().visited.includes('pantalan-paseo-pergolas'));
});
await check('All 20 new stops are selectable and explicit stop phases switch both model halves',()=>{
 const f=fixture();for(const id of ids){f.ctx.selected=id;for(const stop of data[id].stops){f.ctx.selectVisitStop(id,stop.id);assert.equal(f.ctx.visitStates[id].stopId,stop.id);assert.equal(f.ctx.location.hash,`#${id}/${stop.id}`);if(stop.mode)for(const other of ids){assert.equal(f.ctx.coastModes[other],stop.mode);assert.equal(f.modelSites[other].historicalGroup.visible,stop.mode==='historical');assert.equal(f.modelSites[other].currentGroup.visible,stop.mode==='current');}}}
});
await check('Phase buttons clear incompatible stops, preserve shared observations and reject invalid modes',()=>{
 const f=fixture();f.ctx.selectVisitStop(ids[0],'pantalan-paseo-pergolas');f.phase('historical');assert.equal(f.ctx.visitStates[ids[0]].stopId,null);assert.equal(f.ctx.location.hash,'#'+ids[0]);
 f.ctx.selected=ids[1];f.ctx.selectVisitStop(ids[1],'pantalan-maritimo-tripodes');f.phase('current');assert.equal(f.ctx.visitStates[ids[1]].stopId,'pantalan-maritimo-tripodes');const before=JSON.stringify(f.ctx.coastModes);f.phase('future');assert.equal(JSON.stringify(f.ctx.coastModes),before);
 f.click(ids[1],{visitPresentation:'historical'});assert(ids.every(id=>f.ctx.coastModes[id]==='historical'));assert.match(f.get(ids[1]+'-panel').innerHTML,/data-visit-presentation="historical" aria-pressed="true"/);
});
await check('Direct links validate the stop, handle URI errors and preserve the atlas default',()=>{
 const f=fixture();for(const [hash,name,stop]of [['','#atlas',null],['#atlas','#atlas',null],['#pantalan-maritimo/pantalan-maritimo-cargador','#pantalan-maritimo','pantalan-maritimo-cargador'],['#pantalan-paseo/pantalan-maritimo-cargador','#pantalan-paseo',null],['#pantalan-maritimo/missing','#pantalan-maritimo',null],['#%GG','#atlas',null],['#missing','#atlas',null]]){f.ctx.location.hash=hash;const result=f.ctx.selectionFromHash();assert.equal(result.name,name.slice(1));assert.equal(result.stopId,stop);}
 f.ctx.selectVisitStop(ids[0],'missing');assert.equal(f.ctx.visitStates[ids[0]].stopId,null);
});
await check('Initial historic deep link waits for coastal data and then switches phases without WebGL',async()=>{
 const f=fixture({ready:false,loaded:false,models:false,width:390,height:844});f.ctx.location.hash='#pantalan-maritimo/pantalan-maritimo-cargador';const request=f.ctx.selectionFromHash();
 const pending=f.ctx.focus(request.name,{visitFocus:request.stopId});assert.equal(f.ctx.coastModes[ids[0]],'current');await pending;
 assert.deepEqual(f.calls.loads,['coast']);assert.equal(f.ctx.selected,ids[1]);assert.equal(f.ctx.visitStates[ids[1]].stopId,'pantalan-maritimo-cargador');assert(ids.every(id=>f.ctx.coastModes[id]==='historical'));
 assert.match(f.get(ids[1]+'-panel').innerHTML,/Las vistas de la maqueta requieren WebGL/);assert.match(f.get(ids[1]+'-panel').innerHTML,/data-visit-presentation="historical" aria-pressed="true"/);assert(f.ctx.visitStates[ids[1]].fallbackMap);
});
await check('Fallback Canvas retains every stop, cross-epoch hit targets and mobile model/panel insets',()=>{
 for(const[width,height]of[[320,568],[390,844],[700,900],[1440,900]]){const f=fixture({ready:false,width,height,models:false});f.ctx.selected=ids[1];f.ctx.castlePanel();f.ctx.refreshMap();const map=f.ctx.visitStates[ids[1]].fallbackMap;assert.equal(map.targets.length,data[ids[1]].stops.length);assert.equal(map.hitTarget(-1000,-1000),null);for(const t of map.targets){assert.equal(map.hitTarget(t.x,t.y),t.id);assert(Number.isFinite(t.x)&&Number.isFinite(t.y));}const target=map.targets.find(t=>t.id==='pantalan-maritimo-cargador');assert(!target.available);f.ctx.selectVisitStop(ids[1],map.hitTarget(target.x,target.y));assert.equal(f.ctx.coastModes[ids[1]],'historical');assert.equal(f.ctx.visitStates[ids[1]].fallbackMap.presentationMode,'historical');const frame=f.ctx.castleFrame(width,height);assert(frame.width>=80&&frame.height>=80);if(width<=700)assert(frame.bottom<=height*.5);}
});
await check('Only the maritime notebook offers the water-inspection control',()=>{
 const f=fixture();f.ctx.selectVisitStop(ids[0],'pantalan-paseo-pergolas');assert(!f.get(ids[0]+'-panel').innerHTML.includes('data-visit-section'),'Paseo must not expose a misleading control that removes sea water');
 f.ctx.selected=ids[1];f.ctx.selectVisitStop(ids[1],'pantalan-maritimo-tripodes');assert.match(f.get(ids[1]+'-panel').innerHTML,/data-visit-section/);assert.match(f.get(ids[1]+'-panel').innerHTML,/Ver los apoyos bajo el agua/);
});
await check('Inspection hides water, restores it on close, stop change, phase change and leaving the visit',async()=>{
 const f=fixture();f.ctx.selected=ids[1];f.ctx.selectVisitStop(ids[1],'pantalan-maritimo-tripodes');const inspect=()=>f.click(ids[1],{},['data-visit-section']);inspect();assert(f.ctx.marineInspection&&!f.ctx.coastEnvironment.visible&&f.ctx.visitStates[ids[1]].sectionOpen);inspect();assert(!f.ctx.marineInspection&&f.ctx.coastEnvironment.visible);
 inspect();f.ctx.selectVisitStop(ids[1],'pantalan-maritimo-pilotes');assert(!f.ctx.marineInspection&&f.ctx.coastEnvironment.visible&&!f.ctx.visitStates[ids[1]].sectionOpen);
 inspect();f.phase('historical');assert(!f.ctx.marineInspection&&f.ctx.coastEnvironment.visible&&ids.every(id=>!f.ctx.visitStates[id].sectionOpen));
 inspect();await f.ctx.focus(ids[0]);assert(!f.ctx.marineInspection&&f.ctx.coastEnvironment.visible&&ids.every(id=>!f.ctx.visitStates[id].sectionOpen));
});
await check('Without WebGL, inspection and near controls are disabled while phases, sources, tabs and maps remain usable',()=>{
 const f=fixture({ready:false,models:false});f.ctx.selected=ids[1];f.ctx.selectVisitStop(ids[1],'pantalan-maritimo-tripodes');const el=f.get(ids[1]+'-panel');assert.match(el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(el.innerHTML,/data-castle-near aria-pressed="false" disabled/);
 click(el,{},['data-visit-section'],true);assert(!f.ctx.marineInspection);f.click(ids[1],{visitPresentation:'historical'});assert.equal(f.ctx.coastModes[ids[1]],'historical');key(el,'ArrowRight');assert.equal(f.ctx.visitStates[ids[1]].guide.getState().tab,'timeline');key(el,'End');assert.equal(f.ctx.visitStates[ids[1]].guide.getState().tab,'sources');assert.match(el.innerHTML,/Leer las evidencias/);key(el,'Home');click(el,{},['data-castle-map']);assert.equal(f.calls.maps,1);
});
await check('Guided coastal panels avoid legacy coastal CSS so the mobile fallback keeps its half-screen layout',()=>{
 const f=fixture({ready:false,width:390,height:844});f.ctx.coastPanel();assert(f.get('coast-panel').hidden);assert(f.body.classList.contains('pantalan-paseo-mode'));assert(!f.body.classList.contains('coastal-mode'),'Legacy .map-mode.coastal-mode max-height must not override the guided mobile panel');
 assert.match(css,/\.visit-presentation \.coast-modes button\{[^}]*min-height:44px/);assert.match(css,/\.pantalan-paseo-mode,.pantalan-maritimo-mode\) \.editorial \{[^}]*max-height: 50dvh/);
});
await check('Sources, thematic layers, keyboard tabs and completion remain independent between both visits',()=>{
 const f=fixture();for(const id of ids){f.ctx.selected=id;const el=f.get(id+'-panel');f.ctx.castlePanel();f.click(id,{castleReading:'periods'});for(const layer of data[id].readingLegend)assert(el.innerHTML.includes(layer.label));key(el,'End');assert.equal(f.ctx.visitStates[id].guide.getState().tab,'sources');key(el,'Home');f.ctx.visitStates[id].guide.start();for(const stop of data[id].stops){assert.equal(f.ctx.visitStates[id].stopId,stop.id);f.click(id,{},['data-castle-next']);}assert(f.ctx.visitStates[id].guide.getState().complete);assert.equal(f.ctx.visitStates[id].stopId,null);assert.equal(JSON.parse(storage.get(`saguntum.${id}.visited.v1`)).length,data[id].stops.length);}
});

const inputs=['dist/js/app.js','dist/js/castle-panel.js','dist/js/coast.js','dist/js/pantalan-map.js','dist/js/theme.js','dist/assets/data/coast-pier.json','dist/style.css','dist/index.html',...ids.flatMap(id=>[`dist/assets/data/${id}-visit.json`,`dist/assets/data/${id}-plan.json`])];
const report={pass:checks.every(c=>c.pass),method:'Exact production app helper functions and production notebook wiring with minimal DOM adapters; actual Canvas map drawing; no browser layout/native-focus/WebGL claims.',generatedAt:new Date().toISOString(),checksCount:checks.length,checks,sourceHashes:Object.fromEntries(inputs.map(path=>[path,crypto.createHash('sha256').update(readText(path)).digest('hex')]))};
fs.writeFileSync(new URL('research/validation-v31/pantalan-controller-results.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:checks.length,failures:checks.filter(c=>!c.pass)},null,2));if(!report.pass)process.exitCode=1;
