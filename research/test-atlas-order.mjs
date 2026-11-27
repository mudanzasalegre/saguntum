import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {registerThreeTestLoader} from './three-test-loader.mjs';
import {catalog as baseCatalog} from '../dist/js/catalog.js';
import {atlasPlaceIds,atlasArea,compareAtlasPlaces,orderAtlasPlaces} from '../dist/js/atlas-order.js';

registerThreeTestLoader();
const [{registerArchaeology},{registerPortHeritage},{registerCoastHeritage},{registerLandscapes},{registerAtlasEntries}]=await Promise.all([
 import('../dist/js/archaeology.js'),import('../dist/js/port.js'),import('../dist/js/coast.js'),
 import('../dist/js/landscapes.js'),import('../dist/js/territory-heritage-registry.js')
]);

const read=name=>readFile(new URL('../dist/assets/data/'+name+'.json',import.meta.url),'utf8').then(JSON.parse);
const manifest=await read('atlas-visits');
const source=Object.fromEntries(await Promise.all(Object.values(manifest.inventories).flat().map(async name=>[name,await read(name)])));
const original=JSON.stringify(source),catalog=structuredClone(baseCatalog),byId=Object.fromEntries(catalog.map(c=>[c.id,c])),tour=[];
const glorieta={...source[manifest.inventories.glorieta].sites[0]};catalog.push(glorieta);byId.glorieta=glorieta;
for(const [key,register]of [['archaeology',registerArchaeology],['port',registerPortHeritage],['coast',registerCoastHeritage],['landscapes',registerLandscapes]])register(manifest.inventories[key].map(name=>source[name]),catalog,byId,tour);
registerArchaeology([source[manifest.inventories.forumPlaza]],catalog,byId,tour);
const extras=await Promise.all(manifest.visits.map(read));registerAtlasEntries(extras,catalog,byId,tour);
const identities=new Map(catalog.map(c=>[c.id,c])),geometry=new Map(catalog.map(c=>[c.id,{coordinate:c.coordinate,angle:c.angle,observationPoints:c.observationPoints,secondaryLocations:c.secondaryLocations}]));
orderAtlasPlaces(catalog);
assert.equal(catalog.length,33);
assert.deepEqual(catalog.map(c=>c.id),[...atlasPlaceIds]);
assert.deepEqual(catalog.map(c=>c.number),Array.from({length:33},(_,i)=>i+1));
assert.equal(new Set(catalog.map(c=>c.id)).size,catalog.length);
assert.deepEqual(catalog.filter(c=>atlasArea(c).id==='sagunto').map(c=>c.number),Array.from({length:17},(_,i)=>i+1));
assert.deepEqual(catalog.filter(c=>atlasArea(c).id==='puerto').map(c=>c.number),Array.from({length:9},(_,i)=>i+18));
assert.deepEqual(catalog.filter(c=>atlasArea(c).id==='resto').map(c=>c.number),Array.from({length:7},(_,i)=>i+27));
assert.equal(byId['forum-plaza'].number,12);assert.equal(byId.theatre.number,15);assert.equal(byId.castle.number,16);assert.equal(byId.glorieta.number,17);
assert.equal(JSON.stringify(source),original,'original inventories and their geometry/stop numbering remain unchanged');
for(const place of catalog){
  assert.equal(place,byId[place.id]);assert.equal(place,identities.get(place.id));
  for(const[key,value]of Object.entries(geometry.get(place.id)))assert.equal(place[key],value);
}
const once=catalog.map(c=>[c.id,c.number]);orderAtlasPlaces(catalog);assert.deepEqual(catalog.map(c=>[c.id,c.number]),once);
const reversed=[...catalog].reverse().sort(compareAtlasPlaces);assert.deepEqual(reversed.map(c=>c.id),catalog.map(c=>c.id));

// Exercise the simulator's independent inventory-loading path too. Otherwise
// either entry point could accidentally display a different public number.
const previousFetch=globalThis.fetch,dataRoot=new URL('../dist/assets/data/',import.meta.url);
try{
 globalThis.fetch=async input=>{
  const url=new URL(input);
  assert.equal(url.protocol,'file:','catalogue fixture requests must stay local');
  assert.ok(url.href.startsWith(dataRoot.href)&&url.pathname.endsWith('.json'),'catalogue fixture requests must stay inside assets/data');
  return new Response(await readFile(url),{headers:{'Content-Type':'application/json'}});
 };
 const {loadHeritageCatalog}=await import('../dist/js/territory-heritage-catalog.js');
 const simulator=await loadHeritageCatalog((x,z)=>({x,z}));
 assert.deepEqual(simulator.issues,[]);
 assert.deepEqual(simulator.places.map(p=>[p.id,p.number]),once,'Atlas and Simulator must share every visit number');
 assert.deepEqual(simulator.places.map(p=>atlasArea(p).id),catalog.map(p=>atlasArea(p).id));
 for(const place of simulator.places)assert.equal(place.href,'#'+place.id,'links retain their stable monument IDs');
}finally{
 globalThis.fetch=previousFetch;
}

// Newly registered visits are inserted within their area, never appended behind landscapes.
const future=structuredClone(catalog),lookup=Object.fromEntries(future.map(c=>[c.id,c]));
registerAtlasEntries([{id:'future-port',name:'Nueva visita del Puerto',region:'puerto',coordinate:[-.22,39.66],scene:{module:'example.js'}},{id:'future-sagunto',name:'Nueva visita de Sagunto',region:'sagunto',coordinate:[-.28,39.68],scene:{module:'example.js'}}],future,lookup,[]);
orderAtlasPlaces(future);
assert.equal(future[17].id,'future-sagunto');assert.equal(future[27].id,'future-port');
assert.equal(future[28].id,'pantalan-paseo');
assert.deepEqual(future.map(c=>c.number),Array.from({length:35},(_,i)=>i+1));
assert.equal(atlasArea({id:'unknown',region:'__proto__'}).id,'sagunto');
console.log('Atlas order passed: 33 real registrations, 17/9/7 area groups, unique 1–33 numbers, matching Simulator catalogue and links, stable IDs/maps/geometry/inner stops, deterministic future registration.');
