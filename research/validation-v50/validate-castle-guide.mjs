// V50 guide, geographic focus and shared catalogue regression checks.
// Run: node research/validation-v50/validate-castle-guide.mjs
// The scene uses shipped Three.js modules and the final terrain; no GPU render.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {root,project,buildCastleScene} from './castle-scene.mjs';
import {atlasPlaceIds,atlasArea} from '../../dist/js/atlas-order.js';
import {loadHeritageCatalog} from '../../dist/js/territory-heritage-catalog.js';

// Frozen from the independent V49 source commit before this revision. The
// hashes also make the fixture verifiable when the original Git object exists.
const baseline={
 commit:'7e677cfe861991e2740bc16e536e0c7867f6787c',
 guideSha256:'291ebf4ea589d99103ecd711fccd27c4fd5948e70cb8d64068c479341636b031',
 orderSha256:'c2efaee8424cc6cc62a238a32002f372b75b175a19ff211dfb9d035d05a4ff06',
 otherVisitIndexSha256:'9a31f5558ddfbdda3270690c24d8716b3dee10e0ed9d50a79d75c89b98086d58',
 stopIds:['conjunto','acceso','foro','templo','curia','basilica','cisterna-foro','cisterna-norte','inscripcion',
  'puerta-almenara','almenara','conejera','puerta-san-fernando','san-fernando','antiquarium','estudiantes','ciudadela','dos-mayo'],
 regionIds:['armas','almenara','conejera','san-fernando','estudiantes','ciudadela','dos-mayo'],
 atlasIds:['santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre','salvador','museo',
  'portic','domus','circo','diana','necropolis','theatre','castle','glorieta',
  'horno','talleres','museo-industrial','gerencia','casino','begona','economato','barrio-obrero','sanatorio',
  'pantalan-paseo','pantalan-maritimo','grau-vell','puerto-antiguo','marjal-moros','dunas-almarda','rio-palancia']
};
const checks=[],errors=[];
const assert=(pass,label)=>{checks.push({pass:!!pass,label});if(!pass)errors.push(label);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sha=text=>createHash('sha256').update(text).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const semanticHash=value=>sha(JSON.stringify(canonical(value)));
let gitBaseline={available:false,method:'frozen source hashes and independent pre-V50 identifiers'};
try{
 const gitFile=file=>execFileSync('git',['show',baseline.commit+':'+file],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const original=gitFile('dist/assets/data/castle-visit.json'),order=gitFile('dist/js/atlas-order.js');
 const index=JSON.parse(gitFile('dist/assets/territory/visit-stops.json'));
 gitBaseline={available:true,method:'git show of the fixed V49 source',guideSha256:sha(original),orderSha256:sha(order),
  otherVisitIndexSha256:semanticHash(Object.fromEntries(Object.entries(index).filter(([id])=>id!=='castle')))};
 assert(gitBaseline.guideSha256===baseline.guideSha256&&gitBaseline.orderSha256===baseline.orderSha256&&
  gitBaseline.otherVisitIndexSha256===baseline.otherVisitIndexSha256,'frozen fixtures match the original source objects');
 assert(equal(JSON.parse(original).stops.map(stop=>stop.id),baseline.stopIds),'frozen stop order matches the original guide');
}catch(error){gitBaseline.note='Original Git object unavailable; frozen identifiers and hashes remain the regression fixture.';}

const {visit,guide,groundBinding}=await buildCastleScene();
const ids=guide.stops.map(stop=>stop.id),sourceIds=guide.sources.map(source=>source.id),sources=new Set(sourceIds);
assert(ids.length===18&&new Set(ids).size===18&&equal(ids,baseline.stopIds),'18 unique stop IDs retain their original order');
assert(equal(Object.keys(visit.focuses),baseline.stopIds),'the shipped scene exposes the same 18 ordered focuses');
assert(guide.stops.every((stop,index)=>stop.order===index+1&&stop.intro===stop.narrative),'stop numbers and introduction aliases remain synchronized');
assert(equal(guide.regions.map(region=>region.id),baseline.regionIds)&&equal(visit.regions.map(region=>region.id),baseline.regionIds),
 'the guide and shipped scene retain all seven precincts in order');
assert(sources.size===sourceIds.length,'bibliographic source identifiers are unique');

const references=[],malformed=[];
function scan(value,location='$'){
 if(Array.isArray(value)){value.forEach((item,index)=>scan(item,`${location}[${index}]`));return;}
 if(!value||typeof value!=='object')return;
 for(const [key,item]of Object.entries(value)){
  if(['sourceIds','coordinateSourceIds'].includes(key)){
   if(!Array.isArray(item)){malformed.push(location+'.'+key);continue;}
   item.forEach((id,index)=>references.push({id,path:`${location}.${key}[${index}]`}));
  }else scan(item,location+'.'+key);
 }
}
scan(guide);
const unresolved=references.filter(reference=>!sources.has(reference.id));
assert(malformed.length===0&&unresolved.length===0,'all guide references resolve to the displayed bibliography');
assert(guide.stops.every(stop=>stop.sourceIds?.length&&stop.facts.every(fact=>fact.sourceIds?.length&&fact.text?.trim())),
 'every stop and factual claim retains named sources');
assert(visit.stats.sourceKeys.every(id=>sources.has(id)),'all geometric source keys resolve to the guide bibliography');
const memberships=guide.regions.flatMap(region=>region.stopIds.map(id=>({id,region:region.id})));
assert(memberships.length===17&&new Set(memberships.map(item=>item.id)).size===17&&
 memberships.every(item=>guide.stops.some(stop=>stop.id===item.id&&stop.regionId===item.region))&&
 guide.stops.filter(stop=>stop.regionId==='all').map(stop=>stop.id).join()==='conjunto',
 '17 regional stops occur exactly once, with the overview kept outside the seven precinct lists');

const coordinateToleranceM=.002,spatial=[];
for(const stop of guide.stops){
 const focus=visit.focuses[stop.id],coordinate=stop.coordinate;
 const valid=Array.isArray(coordinate)&&coordinate.length===2&&coordinate.every(Number.isFinite)&&
  coordinate[0]>-.285&&coordinate[0]<-.274&&coordinate[1]>39.674&&coordinate[1]<39.678;
 const projected=valid?project(...coordinate):{x:NaN,z:NaN};
 const model=focus?.coordinates?project(...focus.coordinates):{x:NaN,z:NaN};
 const coordinateErrorM=Math.hypot(projected.x-model.x,projected.z-model.z);
 const targetErrorM=stop.id==='conjunto'?0:Math.hypot(projected.x-focus?.target.x,projected.z-focus?.target.z);
 assert(valid&&equal(stop.coordinate,stop.coordinates)&&coordinateErrorM<coordinateToleranceM&&targetErrorM<coordinateToleranceM,
  stop.id+' geographic aliases and the scene focus agree');
 assert(focus?.regionId===stop.regionId&&focus.target.toArray().every(Number.isFinite)&&!focus.bounds.isEmpty(),
  stop.id+' has the intended region and a usable finite target/bounds');
 spatial.push({id:stop.id,order:stop.order,coordinate,modelCoordinate:focus?.coordinates,coordinateErrorM,targetErrorM,
  regionId:stop.regionId,kind:focus?.kind,href:'#castle/'+stop.id});
}

// The real shared catalogue is loaded with a narrowly scoped local-JSON fetch.
const previousFetch=globalThis.fetch;let catalog;
try{
 globalThis.fetch=async input=>{
  const url=new URL(String(input));
  if(url.protocol!=='file:')throw new Error('Guide QA reads local assets only');
  const file=fileURLToPath(url),assetRoot=path.join(root,'dist/assets')+path.sep;
  if(!file.startsWith(assetRoot))throw new Error('Guide QA asset escaped the repository asset directory');
  return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});
 };
 catalog=await loadHeritageCatalog(project);
}finally{globalThis.fetch=previousFetch;}
const numbered=catalog.places.map(place=>({id:place.id,number:place.number,area:atlasArea(place).id,href:place.href}));
assert(equal([...atlasPlaceIds],baseline.atlasIds)&&sha(fs.readFileSync(path.join(root,'dist/js/atlas-order.js'),'utf8'))===baseline.orderSha256,
 'the shared Atlas order and numbering implementation are unchanged');
assert(catalog.issues.length===0&&numbered.length===32&&new Set(numbered.map(place=>place.id)).size===32&&
 equal(numbered.map(place=>place.id),baseline.atlasIds),'the real shared catalogue loads all 32 original visits without registry issues');
assert(numbered.every((place,index)=>place.number===index+1&&place.area===(index<16?'sagunto':index<25?'puerto':'resto')&&place.href==='#'+place.id)&&
 numbered.find(place=>place.id==='castle')?.number===15,'all 32 numbers, 16/9/7 territorial groups and monument anchors remain stable; Castillo is visit 15');

const index=JSON.parse(fs.readFileSync(path.join(root,'dist/assets/territory/visit-stops.json'),'utf8'));
const other=Object.fromEntries(Object.entries(index).filter(([id])=>id!=='castle'));
const otherHash=semanticHash(other),indexed=index.castle,stale=[];
assert(Object.keys(other).length===31&&otherHash===baseline.otherVisitIndexSha256,'all other 31 visits retain their original semantic index content');
assert(equal(Object.keys(index).sort(),[...baseline.atlasIds].sort())&&equal(indexed?.stops.map(stop=>stop.id),ids)&&
 equal(indexed?.regions,guide.regions.map(({id,name})=>({id,name}))),'the territorial index contains the current seven precincts, 18 stops and 32 destinations');
for(const [i,stop]of guide.stops.entries())for(const field of ['id','title','coordinate','regionId','intro','period','mode','recommendedMode']){
 const expected=stop[field]||undefined;
 if(!equal(indexed?.stops[i]?.[field],expected))stale.push({id:stop.id,field,expected,actual:indexed?.stops[i]?.[field]});
}
assert(stale.length===0,'the generated territorial guide reflects every edited title, coordinate, region, introduction, period and mode');

const report={pass:errors.length===0,method:'Frozen V49 fixtures; shipped buildCastleScene and shared catalogue; CPU/local JSON validation',
 baseline:{...baseline,gitObject:gitBaseline},checks,errors,
 editorial:{stops:ids.length,facts:guide.stops.reduce((n,stop)=>n+stop.facts.length,0),timeline:guide.timeline.length,
  sources:sources.size,regions:guide.regions.length,referenceOccurrences:references.length,malformedReferences:malformed,unresolvedReferences:unresolved},
 spatial:{coordinateToleranceM,maxCoordinateErrorM:Math.max(...spatial.map(item=>item.coordinateErrorM)),stops:spatial,groundBinding},
 globalCatalog:{count:numbered.length,issues:catalog.issues,visits:numbered},
 territoryIndex:{places:Object.keys(index).length,castleStops:indexed?.stops.length,otherPlacesUnchanged:otherHash===baseline.otherVisitIndexSha256,
  otherVisitIndexSha256:otherHash,staleCastleFields:stale},
 limitations:['Reference integrity does not independently revalidate each historical claim or remote URL.',
  'Coordinate consistency verifies the authored navigation frame, not archaeological survey accuracy.',
  'Screen framing, GPU rendering, materials and geometric fidelity are checked separately.']};
const output=path.join(root,'research/validation-v50/castle-guide-qa.json');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:checks.length,errors,editorial:report.editorial,
 spatial:{maxCoordinateErrorM:report.spatial.maxCoordinateErrorM},globalCatalog:numbered.length,
 territoryIndex:report.territoryIndex,output},null,2));
if(errors.length)process.exitCode=1;
