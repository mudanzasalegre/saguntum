// Visitor numbers describe the Atlas itinerary, never a source record or mesh.
// Keep this order shared by the Atlas and the territorial simulator.
export const atlasPlaceIds=Object.freeze([
  'santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre','salvador','museo',
  'portic','domus','circo','forum-plaza','diana','necropolis','theatre','castle','glorieta',
  'horno','talleres','museo-industrial','gerencia','casino','begona','economato','barrio-obrero','sanatorio',
  'pantalan-paseo','pantalan-maritimo','grau-vell','puerto-antiguo',
  'marjal-moros','dunas-almarda','rio-palancia'
]);
const areas=Object.freeze([
  Object.freeze({id:'sagunto',label:'Sagunto'}),
  Object.freeze({id:'puerto',label:'Puerto de Sagunto'}),
  Object.freeze({id:'resto',label:'Costa y paisajes'})
]);
const order=new Map(atlasPlaceIds.map((id,index)=>[id,index]));
// Area membership is explicit, so inserting a Sagunto visit cannot accidentally
// reclassify an existing Puerto destination when public numbers are recomputed.
const puertoIds=new Set(['horno','talleres','museo-industrial','gerencia','casino','begona','economato','barrio-obrero','sanatorio']);
const restIds=new Set(['pantalan-paseo','pantalan-maritimo','grau-vell','puerto-antiguo','marjal-moros','dunas-almarda','rio-palancia']);
const knownArea=new Map(atlasPlaceIds.map(id=>[id,puertoIds.has(id)?1:restIds.has(id)?2:0]));
const regionArea=new Map([['sagunto',0],['puerto',1],['coast',2],['marjal',2],['almarda',2],['palancia',2]]);
const collator=new Intl.Collator('es',{numeric:true,sensitivity:'base'});
function areaIndex(place){
  return knownArea.get(place.id)??regionArea.get(place.region)??0;
}
export function atlasArea(place){return areas[areaIndex(place)];}
export function compareAtlasPlaces(a,b){
  return areaIndex(a)-areaIndex(b)||
    (order.get(a.id)??Number.MAX_SAFE_INTEGER)-(order.get(b.id)??Number.MAX_SAFE_INTEGER)||
    collator.compare(a.name||a.id,b.name||b.id)||String(a.id).localeCompare(String(b.id));
}
export function orderAtlasPlaces(places){
  places.sort(compareAtlasPlaces);
  places.forEach((place,index)=>{place.number=index+1;});
  return places;
}
