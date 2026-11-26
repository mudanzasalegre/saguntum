import {orderAtlasPlaces} from './atlas-order.js';

// One entry per original Atlas destination. Keep anchors, evidence and visit links
// in their source records; the simulator only adds the common projected position.
const cache=new Map(),warm=new Map(),pending=new Map();
function requestDocument(name){
 if(pending.has(name))return pending.get(name);
 const result=fetch(new URL('../assets/data/'+name+'.json',import.meta.url)).then(response=>{
  if(!response.ok)throw Error('No se pudo abrir '+name+' ('+response.status+')');
  return response.json();
 }).catch(error=>{if(cache.get(name)===result)cache.delete(name);if(warm.get(name)===result)warm.delete(name);throw error;})
 .finally(()=>pending.delete(name));
 pending.set(name,result);
 return result;
}
// Simulator-only speculative data. The Atlas' persistent editorial cache is
// unchanged. Bound the warm cache and consume it on the actual constructor.
export function prewarmDocument(name){
 if(cache.has(name))return cache.get(name);
 if(warm.has(name))return warm.get(name);
 const result=requestDocument(name);warm.set(name,result);
 while(warm.size>20)warm.delete(warm.keys().next().value);
 return result;
}
export function documentData(name,retain=true){
 if(cache.has(name))return cache.get(name);
 const result=warm.get(name)||requestDocument(name);warm.delete(name);
 if(retain)cache.set(name,result);
 return result;
}

// The same static manifest is read by both entry points. Each new document
// contains the editorial record, visit stops and a reference to its scene.
export async function loadAtlasVisitRegistry(){
 const {version,inventories,visits}=await documentData('atlas-visits');
 if(version!==1)throw Error('Versión del registro de visitas desconocida');
 const results=await Promise.allSettled(visits.map(async name=>{
  const record=await documentData(name);
  if(!/^[a-z0-9][a-z0-9-]*$/.test(record.id)||!record.name||record.coordinate?.length!==2||
     !record.coordinate.every(Number.isFinite)||!record.scene?.module)throw Error('Ficha de visita incompleta · '+name);
  const guide=typeof record.guide==='string'?await documentData(record.guide):record.guide;
  if(record.scene.backends&&(!Array.isArray(record.scene.backends)||!record.scene.backends.length||
    record.scene.backends.some(id=>!['webgpu','webgl2'].includes(id))))throw Error('Motores incompatibles · '+name);
  for(const stop of guide?.stops||[])if(stop.coordinate?.length!==2||!stop.coordinate.every(Number.isFinite))
   throw Error('Parada sin coordenadas · '+record.id+'/'+stop.id);
  return {...record,guide};
 }));
 const entries=[],issues=[];
 for(const result of results){
  if(result.status==='fulfilled')entries.push(result.value);
  else issues.push(result.reason.message);
 }
 for(const issue of issues)console.warn(issue);
 return {inventories,entries,issues};
}

const historicStops={
 portic:'portic-historica',domus:'domus-historica',circo:'circo-historica',necropolis:'necro-historica',
 'pantalan-paseo':'pantalan-paseo-cinta','pantalan-maritimo':'pantalan-maritimo-cargador',
 'puerto-antiguo':null,diana:'diana-conjunto'
};
function metadata(record,project){
 const [lon,lat]=record.coordinate;
 const sources=(record.sources||[]).map(source=>typeof source==='string'?{url:source}:source).filter(source=>source.url);
 const href='#'+record.id;
 const info={
  id:record.id,name:record.name,lon,lat,...project(lon,lat),href,region:record.region||'sagunto',
  period:record.stateAsOf||'Estado conservado descrito en el atlas',sources,
  precision:'Anclaje cartográfico del atlas. Alzados, materiales y detalles interpretativos.',
  category:record.category,guide:record.guide,scene:record.scene,historical:record.historical||null
 };
 if(Object.hasOwn(historicStops,record.id)){
  const stop=historicStops[record.id];
  info.historical={period:record.historicalDate||record.period||record.historicalLabel,
   confidence:'Restitución interpretativa. La ficha original distingue las evidencias de cada elemento.',
   sources,href:href+(stop?'/'+stop:''),inWorld:record.id.startsWith('pantalan-')||record.id==='puerto-antiguo'||record.id==='diana'};
 }
 return info;
}
export async function loadHeritageCatalog(project){
 const {inventories,entries,issues}=await loadAtlasVisitRegistry();
 const [lists,castle,theatrePlan,area,theatreGuide]=await Promise.all([
  Promise.all(Object.values(inventories).flat().map(name=>documentData(name))),documentData('castle-visit'),documentData('theatre-plan'),documentData('historic-context'),documentData('theatre-visit')
 ]);
 const records=Object.fromEntries(lists.flatMap(list=>list.sites).map(record=>[record.id,record]));
 records.castle={id:'castle',name:'Castillo de Sagunto',coordinate:castle.stops.find(s=>s.id==='conjunto').coordinate,sources:castle.sources};
 records.theatre={id:'theatre',name:'Teatro Romano',coordinate:theatrePlan.center,sources:theatreGuide.sources};
 for(const entry of entries){
  if(records[entry.id]){issues.push('Identificador de visita duplicado · '+entry.id);continue;}
  records[entry.id]=entry;
 }
 return {places:orderAtlasPlaces(Object.values(records).map(record=>metadata(record,project))),records,area,issues};
}

// The v32 constructors contain both geographic coordinates and architectural
// drawings in a shared equirectangular metre grid. Register each drawing by its
// local Jacobian instead of feeding UTM numbers into hard-coded drawing frames.
const lonScale=111320*Math.cos(39.679*Math.PI/180);
export const atlasProject=(lon,lat)=>({x:(lon+.278)*lonScale,z:(39.679-lat)*111320});
export function registerFrame(place,project){
 const p=atlasProject(place.lon,place.lat);
 const e=project(place.lon+1/lonScale,place.lat),s=project(place.lon,place.lat-1/111320);
 const a=e.x-place.x,b=s.x-place.x,c=e.z-place.z,d=s.z-place.z;
 const tx=place.x-a*p.x-b*p.z,tz=place.z-c*p.x-d*p.z;
 return {a,b,c,d,tx,tz,world:(x,z)=>({x:a*x+b*z+tx,z:c*x+d*z+tz})};
}
