import * as THREE from 'three';
import {createMarshLandscape} from './landscape-marjal.js';
import {createDunesLandscape} from './landscape-dunes.js';
import {createPalanciaLandscape} from './landscape-palancia.js';
import {industrialEvidence} from './port.js';

export const landscapeRegions=['marjal','almarda','palancia'];
export const isLandscape=region=>landscapeRegions.includes(region);
const factories={marjal:createMarshLandscape,almarda:createDunesLandscape,palancia:createPalanciaLandscape};
const titles={'marjal-moros':'Donde el agua<br>se vuelve<br><em>refugio.</em>','dunas-almarda':'La arena dibuja<br><em>otro horizonte.</em>','rio-palancia':'Un río que une<br><em>el territorio.</em>'};
export function registerLandscapes(datasets,catalog,byId,tourOrder){
 const records=Object.fromEntries(datasets.flatMap(d=>d.sites||[]).map(s=>[s.id,s]));
 for(const s of Object.values(records).sort((a,b)=>a.number-b.number)){
  const sourceDetails=(s.sources||[]).map(v=>typeof v==='string'?{label:'Documentación del paisaje',url:v}:v);
  const entry={...s,title:titles[s.id]||s.title,landscape:true,category:'Paisajes',sourceDetails,sources:sourceDetails.map(v=>v.url)};
  catalog.push(entry);byId[s.id]=entry;tourOrder.push(s.id);
 }
 return records;
}
export const inLandscapeBounds=shape=>(x,z,margin=0)=>((x-shape.cx)/Math.max(1,shape.rx-margin))**2+((z-shape.cz)/Math.max(1,shape.rz-margin))**2<1;
export function landscapeRoadExclusions(record){return new Set([...(record.survey.boardwalks||[]),...(record.survey.bridges||[])].map(r=>String(r.id)));}
export function createLandscapeHeritage(region,options){
 const result=factories[region](options),points={},views={},bounds={},exclusions=[],vegetationExclusions=[],excludedIds=new Set();
 for(const[id,site]of Object.entries(result.sites)){
  site.group.userData.id=id;
  if(site.vegetation&&site.vegetation.parent!==site.group)site.group.attach(site.vegetation);
  site.group.updateMatrixWorld(true);points[id]=site.point;views[id]=site.views;bounds[id]=new THREE.Box3().setFromObject(site.group);
  exclusions.push(...(site.exclusions||[]));vegetationExclusions.push(...(site.vegetationExclusions||[]));
  for(const buildingId of options.records[id]?.osmBuildingIds||[])excludedIds.add(String(buildingId).replace(/^way\//,''));
 }
 return{...result,points,views,bounds,exclusions,vegetationExclusions,excludedIds,stats:Object.fromEntries(Object.entries(result.sites).map(([id,s])=>[id,s.stats]))};
}
export function landscapeEvidence(entry){return industrialEvidence(entry).replace('PUERTO DE SAGUNTO · LUGAR','PAISAJES DEL TERRITORIO · LUGAR').replaceAll('Interpretación arquitectónica','Interpretación del paisaje');}
