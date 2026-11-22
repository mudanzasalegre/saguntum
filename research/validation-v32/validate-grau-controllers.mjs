// Exact production controller helpers + real Canvas maps, with a minimal DOM
// adapter. This does not claim browser layout, native focus or WebGL validation.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createMonumentVisit,castlePeriodLabel} from '../../dist/js/castle-panel.js';
import {drawPantalanMap} from '../../dist/js/pantalan-map.js';
import {drawGrauMap} from '../../dist/js/grau-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas/index.js`);
const root=new URL('../../',import.meta.url),snapshots=new Map();
const readText=p=>{if(!snapshots.has(p))snapshots.set(p,fs.readFileSync(new URL(p,root),'utf8'));return snapshots.get(p);},read=p=>JSON.parse(readText(p));
const app=readText('dist/js/app.js'),css=readText('dist/style.css'),html=readText('dist/index.html'),coastSource=readText('dist/js/coast.js');
for(const path of ['dist/js/castle-panel.js','dist/js/pantalan-map.js','dist/js/theme.js','dist/js/grau-map.js'])readText(path);
const ids=['grau-vell','pantalan-paseo','pantalan-maritimo'];
const data=Object.fromEntries(ids.map(id=>[id,{...read(`dist/assets/data/${id==='grau-vell'?'grau':id}-visit.json`),plan:read(`dist/assets/data/${id==='grau-vell'?'grau':id}-plan.json`)}]));
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
 const records=[...read('dist/assets/data/coast-pier.json').sites,...read('dist/assets/data/coast-grau.json').sites],byId=Object.fromEntries(records.map(record=>[record.id,{...record,coastal:true,region:'coast'}]));
 const visitStates=Object.fromEntries(ids.map(id=>[id,{guide:null,stopId:null,readingMode:'materials',sectionOpen:false,fallbackMap:null}]));
 const calls={sections:[],phase:[],inspection:[],fly:[],refresh:0,loads:[],status:0};
 const modelSites=Object.fromEntries(ids.map(id=>[id,{currentGroup:{visible:true},historicalGroup:{visible:false},visit:{focuses:Object.fromEntries(data[id].stops.map(stop=>[stop.id,{modes:stop.mode?[stop.mode]:['current','historical'],requiresSection:!!stop.requiresSection,interiorView:!!stop.interiorView,buildingId:stop.buildingId}])),plan:data[id].plan,setReadingMode(){},selectFocus(){},setSection(open){calls.sections.push([id,open]);}}}]));
 const localModes={},body=node('body');
 const modeSource=coastSource.slice(coastSource.indexOf(' function setMode(')+1,coastSource.indexOf('\n }',coastSource.indexOf(' function setMode('))+3);
 const nativeMode=new Function('sites','modes',`return (${modeSource});`)(modelSites,localModes);
 const ctx={console,selected:'grau-vell',atlasHome:false,ready,renderer:ready?{shadowMap:{}}:null,scene:null,activeRegion:'coast',closeView:false,mapFocus:null,marineInspection:false,roofOpen:false,portFocus:null,coastFocus:null,landscapeFocus:null,focusSerial:0,
  $:get,document:{getElementById:get,body,querySelectorAll:()=>[]},location:{hash:'#grau-vell'},history:{replaceState(a,b,value){ctx.location.hash=value;}},innerWidth:width,innerHeight:height,
  guidedIds:ids,pantalanIds:new Set(['pantalan-paseo','pantalan-maritimo']),archaeologicalVisitIds:new Set(['portic','domus','circo','necropolis']),visitStates,visitDataFor:id=>data[id],grauData:data['grau-vell'],pantalanPaseoData:data['pantalan-paseo'],pantalanMaritimoData:data['pantalan-maritimo'],byId,
  coastModes:Object.fromEntries(ids.map(id=>[id,'current'])),coastGeo:loaded?geography:null,coastWater:water,coastHeight:()=>0,rawHeight:()=>0,portHeight:()=>0,geo:null,portGeo:null,landscapes:{},coastRecords:Object.fromEntries(records.map(r=>[r.id,r])),coastalPeriods:{},mapSites:Object.values(byId),
  coastHeritage:models?{sites:modelSites,modes:localModes,setMode(id,mode){calls.phase.push([id,mode]);nativeMode(id,mode);}}:undefined,
  coastEnvironment:models?{visible:true,setInspection(open){this.visible=!open;calls.inspection.push(open);},invalidate(){}}:undefined,portHeritage:undefined,civic:undefined,excavation:undefined,
  regionsBuilt:new Set(ready?['coast']:[]),regionOf:c=>c?.region||'sagunto',isLandscape:()=>false,regionInfo:{coast:{map:'PANTALÁN · GRAU VELL',caption:'COSTA',subtitle:'Litoral'},sagunto:{map:'SAGUNTO',caption:'SAGUNTO',subtitle:'Ciudad'}},
  getMapPalette,drawPantalanMap,drawGrauMap,castlePeriodLabel,createMonumentVisit,
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


const grau='grau-vell',d=data[grau];
await check('New guide belongs to the same atlas and exposes exactly twenty registered stops',()=>{
 assert.equal(actualGuidedIds.length,27);assert(actualGuidedIds.includes(grau));assert.equal(d.stops.length,20);assert.equal(new Set(d.stops.map(s=>s.id)).size,20);assert.equal(d.modelRegistration.status,'registered');
 assert.match(html,/<title>SAGUNTUM · Sagunto y Puerto de Sagunto<\/title>/);assert.match(html,/class="place-count">31</);
 const sourceIds=new Set(d.sources.map(s=>s.id));for(const stop of d.stops){assert(stop.coordinate?.every(Number.isFinite));assert(stop.title&&stop.intro&&stop.facts.length);for(const fact of stop.facts)for(const id of fact.sourceIds)assert(sourceIds.has(id));}
 const f=fixture();assert.equal(f.ctx.visitStates[grau].guide.getState().total,20);assert(f.ctx.guidedVisit().model);assert.equal(f.ctx.guidedVisit().drawMap,drawGrauMap);
});
await check('Every stop selects its own camera and URL without modifying another notebook',()=>{
 const f=fixture(),before=ids.slice(1).map(id=>f.ctx.visitStates[id].guide.getState());
 for(const stop of d.stops){f.ctx.selectVisitStop(grau,stop.id);assert.equal(f.ctx.visitStates[grau].stopId,stop.id);assert.equal(f.ctx.location.hash,`#${grau}/${stop.id}`);assert.equal(f.ctx.visitStates[grau].sectionOpen,!!stop.requiresSection);assert.equal(f.calls.fly.at(-1),grau);}
 for(const[id,index]of ids.slice(1).map((id,index)=>[id,index]))assert.deepEqual(f.ctx.visitStates[id].guide.getState(),before[index]);
 assert(f.ctx.coastEnvironment.visible);assert(!f.ctx.marineInspection);assert.equal(f.calls.inspection.length,0);
});
await check('Section opens from overview or reframes an indoor visit as a visible cut without changing water',()=>{
 const f=fixture(),el=f.get(grau+'-panel');assert.match(el.innerHTML,/data-visit-section/);
 const toggle=()=>f.click(grau,{},['data-visit-section']);toggle();assert(f.ctx.visitStates[grau].sectionOpen);assert.equal(f.ctx.visitStates[grau].stopId,null);assert.equal(f.calls.fly.at(-1),grau);
 toggle();assert(!f.ctx.visitStates[grau].sectionOpen);f.ctx.selectVisitStop(grau,'grau-sala-torre');toggle();assert(f.ctx.visitStates[grau].sectionOpen);assert.equal(f.ctx.visitStates[grau].stopId,'grau-torre');assert.equal(f.ctx.location.hash,'#grau-vell/grau-torre');toggle();assert(!f.ctx.visitStates[grau].sectionOpen);f.ctx.selectVisitStop(grau,'grau-memoria-portuaria');toggle();assert.equal(f.ctx.visitStates[grau].stopId,'grau-cerchas');assert(f.ctx.visitStates[grau].sectionOpen);toggle();assert(!f.ctx.visitStates[grau].sectionOpen);assert.equal(f.ctx.visitStates[grau].stopId,null);
 assert(f.ctx.coastEnvironment.visible&&!f.ctx.marineInspection);assert.equal(f.calls.inspection.length,0);
});
await check('Valid and invalid deep links resolve safely, including the initial no-WebGL path',async()=>{
 const f=fixture({ready:false,loaded:false,models:false,width:390,height:844});
 for(const[hash,name,stop]of [['','#atlas',null],['#grau-vell/grau-sala-torre','#grau-vell','grau-sala-torre'],['#grau-vell/grau-missing','#grau-vell',null],['#grau-vell/pantalan-paseo-mirador','#grau-vell',null],['#%GG','#atlas',null]]){f.ctx.location.hash=hash;const result=f.ctx.selectionFromHash();assert.equal(result.name,name.slice(1));assert.equal(result.stopId,stop);}
 f.ctx.location.hash='#grau-vell/grau-sala-torre';const request=f.ctx.selectionFromHash();await f.ctx.focus(request.name,{visitFocus:request.stopId});assert.deepEqual(f.calls.loads,['coast']);assert.equal(f.ctx.visitStates[grau].stopId,'grau-sala-torre');const map=f.ctx.visitStates[grau].fallbackMap;assert(map.interior);assert.equal(map.floor,1);assert.equal(map.buildingId,'grau-torre');assert(map.targets.some(t=>t.id==='grau-sala-torre'));assert.match(f.get(grau+'-panel').innerHTML,/requieren WebGL/);
});
await check('Canvas fallback retains reachable targets on mobile and desktop, including each interior floor',()=>{
 for(const[width,height]of[[320,568],[390,844],[844,390],[1440,900]]){const f=fixture({ready:false,width,height,models:false});f.ctx.castlePanel();f.ctx.refreshMap();const map=f.ctx.visitStates[grau].fallbackMap;assert.equal(map.targets.length,20);assert.equal(map.hitTarget(-1000,-1000),null);for(const t of map.targets){assert.equal(map.hitTarget(t.x,t.y),t.id);assert(Number.isFinite(t.x)&&Number.isFinite(t.y));}
 for(const stop of d.stops.filter(s=>s.interiorView)){f.ctx.selectVisitStop(grau,stop.id);const interior=f.ctx.visitStates[grau].fallbackMap;assert(interior.interior);assert.equal(interior.floor,stop.floor);assert.equal(interior.buildingId,stop.buildingId);assert(interior.targets.some(t=>t.id===stop.id));for(const t of interior.targets)assert.equal(interior.hitTarget(t.x,t.y),t.id);}
 const frame=f.ctx.castleFrame(width,height);assert(frame.width>=80&&frame.height>=80);if(width<=700)assert(frame.bottom<=height*.5);
 }
});
await check('Sources, thematic reading, keyboard tabs, map action and progress use the actual notebook wiring',()=>{
 const f=fixture(),el=f.get(grau+'-panel');f.click(grau,{castleReading:'periods'});assert.equal(f.ctx.visitStates[grau].readingMode,'periods');for(const layer of d.readingLegend)assert(el.innerHTML.includes(layer.label));
 key(el,'ArrowRight');assert.equal(f.ctx.visitStates[grau].guide.getState().tab,'timeline');key(el,'End');assert.equal(f.ctx.visitStates[grau].guide.getState().tab,'sources');assert.match(el.innerHTML,/Leer las evidencias/);assert.match(f.ctx.visitStates[grau].guide.sourceContent(d.sources[0]),/GRAU VELL/);key(el,'Home');f.click(grau,{},['data-castle-map']);assert.equal(f.calls.maps,1);
 f.ctx.visitStates[grau].guide.start();for(const stop of d.stops){assert.equal(f.ctx.visitStates[grau].stopId,stop.id);f.click(grau,{},['data-castle-next']);}assert(f.ctx.visitStates[grau].guide.getState().complete);assert.equal(f.ctx.visitStates[grau].stopId,null);assert.equal(JSON.parse(storage.get('saguntum.grau-vell.visited.v1')).length,20);
});
await check('Mobile guide uses shared half-screen layout and controls remain honest without WebGL',()=>{
 const f=fixture({ready:false,models:false,width:390,height:844});f.ctx.coastPanel();assert(f.get('coast-panel').hidden);assert(f.body.classList.contains('grau-vell-mode'));assert(!f.body.classList.contains('coastal-mode'));const el=f.get(grau+'-panel');assert.match(el.innerHTML,/data-visit-section aria-pressed="false" disabled/);f.ctx.selectVisitStop(grau,'grau-sala-torre');assert.match(el.innerHTML,/data-castle-near aria-pressed="false" disabled/);click(el,{},['data-visit-section'],true);assert(!f.ctx.visitStates[grau].sectionOpen);assert.match(css,/\.grau-vell-mode\) \.editorial \{[^}]*max-height: 50dvh/);
});
await check('Leaving Grau restores its cut state and does not affect sea visibility',async()=>{
 const f=fixture();f.click(grau,{},['data-visit-section']);assert(f.ctx.visitStates[grau].sectionOpen);await f.ctx.focus('pantalan-paseo');assert(!f.ctx.marineInspection);assert(f.ctx.coastEnvironment.visible);assert(f.calls.sections.some(([id,open])=>id===grau&&!open));
});
const inputs=['dist/js/app.js','dist/js/castle-panel.js','dist/js/coast.js','dist/js/grau-map.js','dist/js/theme.js','dist/assets/data/coast-grau.json','dist/style.css','dist/index.html','dist/assets/data/grau-visit.json','dist/assets/data/grau-plan.json'];
const report={pass:checks.every(c=>c.pass),method:'Exact production controller helpers and notebook wiring; actual Canvas maps and input targets with minimal DOM adapters. Does not claim browser layout, native focus or WebGL validation.',generatedAt:new Date().toISOString(),checksCount:checks.length,checks,sourceHashes:Object.fromEntries(inputs.map(path=>[path,crypto.createHash('sha256').update(readText(path)).digest('hex')]))};
fs.writeFileSync(new URL('research/validation-v32/grau-controller-results.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:checks.length,failures:checks.filter(c=>!c.pass)},null,2));if(!report.pass)process.exitCode=1;
