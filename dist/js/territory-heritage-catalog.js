// One entry per original Atlas destination. Keep anchors, evidence and visit links
// in their source records; the simulator only adds the common projected position.
const inventories=['landmarks','archaeology-public','archaeology-domestic','archaeology-necropolis','port-industrial','port-garden','port-workers','coast-pier','coast-grau','coast-archaeology','landscape-marjal','landscape-dunes','landscape-palancia'];
const cache=new Map();
export function documentData(name,retain=true){
 if(cache.has(name))return cache.get(name);
 const result=fetch(new URL('../assets/data/'+name+'.json',import.meta.url)).then(response=>{
  if(!response.ok)throw Error('No se pudo abrir '+name+' ('+response.status+')');
  return response.json();
 }).catch(error=>{cache.delete(name);throw error;});
 if(retain)cache.set(name,result);
 return result;
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
  historical:null
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
 const [lists,castle,theatrePlan,area]=await Promise.all([
  Promise.all(inventories.map(name=>documentData(name))),documentData('castle-visit'),documentData('theatre-plan'),documentData('historic-context')
 ]);
 const records=Object.fromEntries(lists.flatMap(list=>list.sites).map(record=>[record.id,record]));
 records.castle={id:'castle',name:'Castillo de Sagunto',coordinate:castle.stops.find(s=>s.id==='conjunto').coordinate,sources:castle.sources};
 records.theatre={id:'theatre',name:'Teatro Romano',coordinate:theatrePlan.center,sources:[{url:'https://manuelportaceli.com/rehabilitacion-del-teatro-romano-de-sagunto/'}]};
 return {places:Object.values(records).map(record=>metadata(record,project)),records,area};
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
