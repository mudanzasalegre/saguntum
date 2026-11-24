import {createCity} from './city.js';
import {createUrbanSurface} from './urban-surface.js';

// First ring beyond the individually drawn façades. The preparation script
// clips the Atlas sector against those façades and other native visits.
let prepared=null;
export function prewarmGlorietaSurroundings(){
 if(!prepared){
  const request=fetchSurroundings().catch(error=>{if(prepared===request)prepared=null;throw error;});
  prepared=request;
 }
 return prepared;
}
export function loadGlorietaSurroundings(){
 const result=prewarmGlorietaSurroundings();
 prepared=null;
 return result;
}
async function fetchSurroundings(){
 const url=new URL('../assets/territory/glorieta-surroundings.json',import.meta.url);
 const response=await fetch(url);
 if(!response.ok)throw Error('No se pudo abrir el sector urbano de la Glorieta');
 return response.json();
}
export function createGlorietaSurroundings(data,{project,heightAt}){
 const urban=createUrbanSurface({data,project,heightAt});
 return createCity({data,urban,project,heightAt:urban.groundHeight,terrainHeightAt:heightAt,
  inBounds:()=>true,detailBounds:[],treeLimit:0});
}

export function resolveFrontageShells(buildings,corrections){
 const parts=buildings.buildings.flatMap(row=>{
  if(!Object.hasOwn(corrections,row.id))return [row];
  return corrections[row.id].map((polygon,i)=>({...row,...polygon,id:row.id+'-exterior-'+i,parentId:row.id}));
 });
 return {...buildings,buildings:parts};
}
