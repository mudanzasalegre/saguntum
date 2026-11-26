// Reproduce the editorial, spatial and catalogue checks for the V49 theatre.
// Run from any directory: node research/validation-v49/validate-theatre-guide.mjs
// This reads the shipped model and local assets. It does not render a GPU view.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {root,THREE,project,buildTheatreScene} from './theatre-scene.mjs';
import {atlasPlaceIds,atlasArea} from '../../dist/js/atlas-order.js';
import {loadHeritageCatalog} from '../../dist/js/territory-heritage-catalog.js';

// Frozen identifiers were read from the pre-V49 checkout, not regenerated from
// the edited guide. They keep this regression check useful in a source archive
// that does not carry that Git object. When it exists, its hashes are checked.
const baseline={
 commit:'1c7be8a5fafba5118e7b4b22e3c5ba0d372574cf',
 guideSha256:'992f8775a34e36f3bfa4c445c12ad65c84e05f2780a5ffbb913dd77bb4f27837',
 orderSha256:'c2efaee8424cc6cc62a238a32002f372b75b175a19ff211dfb9d035d05a4ff06',
 otherVisitIndexSha256:'00bed45f79f2e8940603b7635d357b6b362352844682ae54cdae3751bb931b33',
 stopIds:[
  'teatro-conjunto','teatro-aditus-oriental','teatro-orchestra','teatro-ima-cavea',
  'teatro-media-cavea','teatro-summa-cavea','teatro-vomitoria','teatro-portico',
  'teatro-tribunalia','teatro-proscaenium','teatro-frons-scaenae','teatro-basilicas',
  'teatro-hyposcaenium','teatro-cloaca','teatro-restauracion','teatro-vivo'
 ],
 atlasIds:[
  'santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre','salvador','museo',
  'portic','domus','circo','diana','necropolis','theatre','castle','glorieta',
  'horno','talleres','museo-industrial','gerencia','casino','begona','economato','barrio-obrero','sanatorio',
  'pantalan-paseo','pantalan-maritimo','grau-vell','puerto-antiguo','marjal-moros','dunas-almarda','rio-palancia'
 ]
};
const checks=[],errors=[];
const assert=(pass,label)=>{checks.push({pass:!!pass,label});if(!pass)errors.push(label);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sha=text=>createHash('sha256').update(text).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const semanticHash=value=>sha(JSON.stringify(canonical(value)));
let baseObject={available:false,method:'frozen identifiers and source hashes from the pre-V49 checkout'};
try{
 const guide=execFileSync('git',['show',baseline.commit+':dist/assets/data/theatre-visit.json'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const order=execFileSync('git',['show',baseline.commit+':dist/js/atlas-order.js'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 baseObject={available:true,method:'git show of the fixed pre-V49 commit',guideSha256:sha(guide),orderSha256:sha(order)};
 assert(baseObject.guideSha256===baseline.guideSha256&&baseObject.orderSha256===baseline.orderSha256,'frozen baseline hashes match the original Git objects');
 assert(equal(JSON.parse(guide).stops.map(stop=>stop.id),baseline.stopIds),'frozen stop order matches the original guide');
 const index=JSON.parse(execFileSync('git',['show',baseline.commit+':dist/assets/territory/visit-stops.json'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
 baseObject.otherVisitIndexSha256=semanticHash(Object.fromEntries(Object.entries(index).filter(([id])=>id!=='theatre')));
 assert(baseObject.otherVisitIndexSha256===baseline.otherVisitIndexSha256,'frozen semantic hash matches the other 31 visits in the original index');
}catch(error){baseObject.note='Git baseline is unavailable; the independently frozen identifiers remain the comparison fixture.';}

const {theatre,visit,guide,groundBinding}=await buildTheatreScene();
const stopIds=guide.stops.map(stop=>stop.id),sources=new Set(guide.sources.map(source=>source.id));
assert(stopIds.length===16&&new Set(stopIds).size===16,'exactly 16 unique theatre stop IDs');
assert(equal(stopIds,baseline.stopIds),'all 16 stop IDs and their order are unchanged from the pre-V49 guide');
assert(equal(Object.keys(visit.focuses),baseline.stopIds),'the shipped model exposes the same 16 ordered focuses');
assert(guide.stops.every((stop,index)=>stop.order===index+1),'editorial stop numbers remain 1 through 16');
assert(guide.stops.every(stop=>stop.intro===stop.narrative),'intro and narrative aliases remain synchronized');
assert(sources.size===guide.sources.length,'the bibliography has no duplicate source identifiers');

const references=[];
function scan(value,location='$'){
 if(Array.isArray(value)){value.forEach((item,index)=>scan(item,`${location}[${index}]`));return;}
 if(!value||typeof value!=='object')return;
 for(const [key,item]of Object.entries(value)){
  if(['sourceIds','coordinateSourceIds'].includes(key)){
   assert(Array.isArray(item),location+'.'+key+' is a reference array');
   if(Array.isArray(item))item.forEach((id,index)=>references.push({id,path:`${location}.${key}[${index}]`}));
  }else scan(item,location+'.'+key);
 }
}
scan(guide);
const unresolved=references.filter(reference=>!sources.has(reference.id));
assert(guide.stops.every(stop=>stop.sourceIds?.length&&stop.facts.every(fact=>fact.sourceIds?.length)),'every stop and factual claim retains explicit source references');
assert(unresolved.length===0,'every editorial and coordinate reference resolves to the displayed bibliography');
assert(visit.stats.sourceKeys.every(id=>sources.has(id)),'all model source keys resolve to the same bibliography');

const memberships=guide.regions.flatMap(region=>region.stopIds.map(id=>({id,region:region.id})));
assert(memberships.length===16&&new Set(memberships.map(item=>item.id)).size===16,'the five regions contain each stop exactly once');
assert(memberships.every(item=>guide.stops.some(stop=>stop.id===item.id&&stop.regionId===item.region)),'region memberships and stop region IDs agree');
assert(guide.regions.every(region=>equal(region.coordinate,guide.stops.find(stop=>stop.id===region.stopIds[0])?.coordinate)),'each region anchor follows its first documented stop');

const interiorIds=new Set(['teatro-aditus-oriental','teatro-vomitoria']);
const sectionIds=new Set(['teatro-hyposcaenium','teatro-cloaca']);
const coordinateToleranceM=.002,coordinateChecks=[];
for(const stop of guide.stops){
 const focus=visit.focuses[stop.id],coordinate=stop.coordinate;
 const valid=Array.isArray(coordinate)&&coordinate.length===2&&coordinate.every(Number.isFinite)&&
  coordinate[0]>-.280&&coordinate[0]<-.276&&coordinate[1]>39.675&&coordinate[1]<39.679;
 assert(valid,stop.id+' has a finite WGS84 coordinate in the theatre frame');
 assert(equal(stop.coordinate,stop.coordinates),stop.id+' coordinate aliases are identical');
 const p=valid?project(...coordinate):{x:NaN,z:NaN};
 const local=stop.modelLocal;
 const localFinite=!!local&&Number.isFinite(local.x)&&Number.isFinite(local.z);
 const registered=localFinite?theatre.localToWorld(new THREE.Vector3(local.x,0,local.z)):new THREE.Vector3(NaN,NaN,NaN);
 const modelCoordinate=focus?.coordinates?project(...focus.coordinates):{x:NaN,z:NaN};
 const localFrameErrorM=Math.hypot(p.x-registered.x,p.z-registered.z);
 const focusCoordinateErrorM=Math.hypot(p.x-modelCoordinate.x,p.z-modelCoordinate.z);
 assert(localFinite&&localFrameErrorM<coordinateToleranceM,stop.id+' geographic anchor matches its registered modelLocal position');
 assert(focusCoordinateErrorM<coordinateToleranceM,stop.id+' geographic anchor matches the actual model focus coordinate');
 assert(focus?.regionId===stop.regionId,stop.id+' region agrees with the model focus');
 const targetLocal=focus?theatre.worldToLocal(focus.target.clone()).toArray():[NaN,NaN,NaN];
 const expectedTarget=stop.id==='teatro-conjunto'?[0,8,5]:null;
 const targetErrorM=expectedTarget?Math.hypot(...targetLocal.map((value,index)=>value-expectedTarget[index])):
  Math.hypot(targetLocal[0]-local?.x,targetLocal[2]-local?.z);
 assert(targetErrorM<1e-6,stop.id+' uses the intended target (overview composition may differ from the map pin)');
 assert(stop.fitBounds===(stop.id==='teatro-conjunto')&&focus?.fitBounds===stop.fitBounds,stop.id+' overview/detail fitBounds flags agree');
 assert(!!stop.requiresSection===sectionIds.has(stop.id)&&!!focus?.requiresSection===!!stop.requiresSection,stop.id+' cutaway requirement agrees with the model');
 assert(!!stop.interiorView===interiorIds.has(stop.id)&&!!focus?.interiorView===!!stop.interiorView,stop.id+' interior camera flag agrees with the model');
 if(interiorIds.has(stop.id)){
  assert(stop.fov===58&&focus.fov===stop.fov&&stop.closeScale===false&&focus.closeScale===false&&
   stop.minDistance===.45&&focus.minDistance===stop.minDistance,stop.id+' interior FOV, close behaviour and minimum distance are synchronized');
 }
 coordinateChecks.push({id:stop.id,order:stop.order,coordinate,modelLocal:local,targetLocal,localFrameErrorM,focusCoordinateErrorM,
  fitBounds:stop.fitBounds,requiresSection:!!stop.requiresSection,interiorView:!!stop.interiorView,
  ...(interiorIds.has(stop.id)?{fov:stop.fov,closeScale:stop.closeScale,minDistance:stop.minDistance}:{}),
  href:'#theatre/'+stop.id});
}

// Load the real shared catalogue, replacing only network fetch with reads of
// repository JSON. This checks all 32 destinations, including later inventories.
const previousFetch=globalThis.fetch;
let catalog;
try{
 globalThis.fetch=async input=>{
  const url=new URL(String(input));
  if(url.protocol!=='file:')throw new Error('Guide QA only reads local repository assets');
  const file=fileURLToPath(url),assetRoot=path.join(root,'dist/assets')+path.sep;
  if(!file.startsWith(assetRoot))throw new Error('Guide QA asset escaped the repository asset directory');
  return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});
 };
 catalog=await loadHeritageCatalog(project);
}finally{globalThis.fetch=previousFetch;}
const numbered=catalog.places.map(place=>({id:place.id,number:place.number,area:atlasArea(place).id,href:place.href}));
assert(equal([...atlasPlaceIds],baseline.atlasIds),'the global Atlas ordering remains unchanged from the 32-place baseline');
assert(sha(fs.readFileSync(path.join(root,'dist/js/atlas-order.js'),'utf8'))===baseline.orderSha256,'the shared numbering implementation is byte-identical to the pre-V49 baseline');
assert(catalog.issues.length===0,'the actual shared catalogue loads without registry issues');
assert(numbered.length===32&&new Set(numbered.map(place=>place.id)).size===32,'the actual shared catalogue contains 32 unique visits');
assert(equal(numbered.map(place=>place.id),baseline.atlasIds),'the loaded catalogue keeps all 32 baseline IDs in the same order');
assert(numbered.every((place,index)=>place.number===index+1),'global visit numbers remain 1 through 32 without renumbering');
assert(numbered.find(place=>place.id==='theatre')?.number===14,'Teatro Romano retains global visit number 14');
assert(numbered.every((place,index)=>place.area===(index<16?'sagunto':index<25?'puerto':'resto')),'Sagunto, Puerto and coast/landscapes retain their 16 / 9 / 7 grouping');
assert(numbered.every(place=>place.href==='#'+place.id),'all existing monument deep-link anchors remain stable');

const visitIndex=JSON.parse(fs.readFileSync(path.join(root,'dist/assets/territory/visit-stops.json'),'utf8'));
const otherVisitEntries=Object.fromEntries(Object.entries(visitIndex).filter(([id])=>id!=='theatre'));
const otherVisitIndexSha256=semanticHash(otherVisitEntries);
assert(Object.keys(otherVisitEntries).length===31&&otherVisitIndexSha256===baseline.otherVisitIndexSha256,
 'all other 31 visits retain exactly the baseline semantic content in the generated territory index');
assert(equal(Object.keys(visitIndex).sort(),[...baseline.atlasIds].sort()),'the generated visit index retains the same 32 places');
const indexedTheatre=visitIndex.theatre;
assert(equal(indexedTheatre?.regions,guide.regions.map(({id,name})=>({id,name}))),'the generated theatre regions match the current guide');
assert(equal(indexedTheatre?.stops.map(stop=>stop.id),stopIds),'the generated theatre index contains the current 16 stops in order');
const indexFields=['id','title','coordinate','regionId','intro','period','mode','recommendedMode'];
const staleIndexFields=[];
for(const [index,stop]of guide.stops.entries()){
 const indexed=indexedTheatre?.stops[index];
 for(const field of indexFields){
  const expected=stop[field]||undefined;
  if(!equal(indexed?.[field],expected))staleIndexFields.push({id:stop.id,field,expected,actual:indexed?.[field]});
 }
}
assert(staleIndexFields.length===0,'every indexed theatre title, coordinate, region, introduction, period and mode reflects the current guide');

const report={
 pass:errors.length===0,method:'Frozen pre-V49 identifier fixtures + shipped buildTheatreScene and loadHeritageCatalog; CPU and local JSON only',
 baseline:{...baseline,gitObject:baseObject},checks,errors,
 editorial:{stopCount:stopIds.length,facts:guide.stops.reduce((count,stop)=>count+stop.facts.length,0),timelineEntries:guide.timeline.length,
  sourceCount:sources.size,referenceOccurrences:references.length,unresolvedReferences:unresolved,regions:guide.regions.length},
 spatial:{coordinateToleranceM,maxCoordinateErrorM:Math.max(...coordinateChecks.flatMap(item=>[item.localFrameErrorM,item.focusCoordinateErrorM])),
  overviewFitCount:coordinateChecks.filter(item=>item.fitBounds).length,interiorCount:coordinateChecks.filter(item=>item.interiorView).length,
  sectionCount:coordinateChecks.filter(item=>item.requiresSection).length,stops:coordinateChecks,groundBinding},
 globalCatalog:{count:numbered.length,issues:catalog.issues,visits:numbered},
 territoryIndex:{placeCount:Object.keys(visitIndex).length,stopCount:Object.values(visitIndex).reduce((count,entry)=>count+entry.stops.length,0),
  otherPlacesUnchanged:otherVisitIndexSha256===baseline.otherVisitIndexSha256,otherVisitIndexSha256,theatreStopCount:indexedTheatre?.stops.length,staleTheatreFields:staleIndexFields},
 limitations:['This verifies references resolve within the bibliography; it does not revalidate every remote URL or historical assertion.',
  'Coordinate consistency verifies the authored cartographic frame, not survey accuracy.',
  'GPU rendering and screen framing are covered separately, not claimed by this guide check.']
};
const output=path.join(root,'research/validation-v49/theatre-guide-qa.json');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:checks.length,errors,editorial:report.editorial,
 spatial:{maxCoordinateErrorM:report.spatial.maxCoordinateErrorM,overviewFitCount:report.spatial.overviewFitCount,interiorCount:report.spatial.interiorCount,sectionCount:report.spatial.sectionCount},
 globalCatalog:report.globalCatalog.count,territoryIndex:report.territoryIndex,output},null,2));
if(errors.length)process.exitCode=1;
