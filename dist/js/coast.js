import * as THREE from 'three';
import {createCoastPier} from './coast-pier.js';
import {createCoastGrau} from './coast-grau.js';
import {createCoastArchaeology} from './coast-archaeology.js';
import {createPantalanContext} from './pantalan-context.js';
import {createGrauContext} from './grau-context.js';
import {industrialEvidence} from './port.js';

export const coastShape={cx:5325,cz:4225,rx:2500,rz:1750};
export const coastMeshOptions={shape:coastShape,core:{minX:3200,maxX:6400,minZ:2700,maxZ:5050},coreStep:5,outerStep:12.5};
export const inCoastBounds=(x,z,margin=0)=>((x-coastShape.cx)/(coastShape.rx-margin))**2+((z-coastShape.cz)/(coastShape.rz-margin))**2<1;
export const coastalPeriods={
 'pantalan-paseo':{current:'Paseo actual · abierto en julio de 2024',historical:'Instalación industrial · hacia 1984–1987'},
 'pantalan-maritimo':{current:'Estructuras conservadas · documentación de 2025–2026',historical:'Instalación industrial · hacia 1984–1987'},
 'grau-vell':{current:'Conjunto restaurado · Sagunt i la Mar, 2026'},
 'puerto-antiguo':{current:'Restos consolidados · intervención de 2025',historical:'Puerto romano · siglos I–II d.C.'}
};

export function registerCoastHeritage(datasets,catalog,byId,tourOrder){
 const records=Object.fromEntries(datasets.flatMap(d=>d.sites||[]).sort((a,b)=>a.number-b.number).map(s=>[s.id,s]));
 const entries=Object.values(records).map(s=>{
  const sourceDetails=(s.sources||[]).map(v=>typeof v==='string'?{label:'Documentación patrimonial',url:v}:v);
  return{...s,coastal:true,archaeological:false,industrial:false,region:'coast',subCategory:s.category,category:'Costa',sourceDetails,sources:sourceDetails.map(v=>v.url),angle:s.angle||[130,105,130],radius:s.radius||100};
 });
 const insert=catalog.findIndex(c=>c.id==='theatre');catalog.splice(insert<0?catalog.length:insert,0,...entries);
 for(const entry of entries)byId[entry.id]=entry;
 tourOrder.push(...entries.map(c=>c.id));return records;
}

// Each state is scoped to a monument. Both halves of the same industrial
// installation share one state, so a historical bridge cannot meet a modern one.
export function createCoastHeritage(options){
 const group=new THREE.Group();group.name='Costa · lugares 23–26';const sites={};
 for(const factory of [createCoastPier,createCoastGrau,createCoastArchaeology]){const r=factory(options);group.add(r.group);Object.assign(sites,r.sites);}
 const pantalanContext=options.pantalanContextData?createPantalanContext({contextData:options.pantalanContextData,project:options.project,heightAt:options.heightAt}):null;
 const grauContext=options.grauContextData?createGrauContext({contextData:options.grauContextData,project:options.project,heightAt:options.heightAt}):null;
 for(const context of [pantalanContext,grauContext])if(context)group.add(context.group);
 const points={},views={},bounds={},patches=[],exclusions=[],excludedIds=new Set(),modes={};
 for(const[id,s]of Object.entries(sites)){
  s.id=id;s.group.userData.id=id;s.group.updateMatrixWorld(true);points[id]=s.point;views[id]=s.views;
  bounds[id]=new THREE.Box3().setFromObject(s.group);patches.push(...s.patches||[]);exclusions.push(...s.exclusions||[]);modes[id]='current';
  for(const v of options.records[id]?.osmBuildingIds||[])excludedIds.add(String(v).replace(/^way\//,''));
  for(const v of s.group.userData.osmContextFootprints||[])excludedIds.add(String(v));
  if(s.currentGroup)s.currentGroup.visible=true;if(s.historicalGroup)s.historicalGroup.visible=false;
 }
 for(const context of [pantalanContext,grauContext])if(context){for(const id of context.excludedBuildingIds||[])excludedIds.add(String(id));exclusions.push(...context.exclusions||[]);}
 function setMode(id,mode){
  const keys=id.startsWith('pantalan-')?['pantalan-paseo','pantalan-maritimo']:[id];
  for(const key of keys){const s=sites[key];if(!s)continue;const next=mode==='historical'&&s.historicalGroup?'historical':'current';modes[key]=next;if(s.currentGroup)s.currentGroup.visible=next==='current';if(s.historicalGroup)s.historicalGroup.visible=next==='historical';if(s.roof)s.roof.visible=true;}
 }
 function visibleBounds(id){
  const s=sites[id];if(!s)return null;const b=new THREE.Box3();s.group.updateMatrixWorld(true);
  s.group.traverseVisible(o=>{if(!o.isMesh)return;if(s.marine){for(let ancestor=o;ancestor;ancestor=ancestor.parent)if(ancestor===s.marine.group||ancestor===s.marine.historicalGroup)return;}const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();if(o.isInstancedMesh){if(!o.boundingBox)o.computeBoundingBox();b.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));}else b.union(g.boundingBox.clone().applyMatrix4(o.matrixWorld));});
  if(id.startsWith('pantalan-')&&!b.isEmpty())b.min.y=Math.max(.08,b.min.y);
  return b.isEmpty()?bounds[id]:b;
 }
 return{group,sites,points,views,bounds,patches,exclusions,excludedIds,modes,setMode,visibleBounds,pantalanContext,grauContext,vegetationExclusions:[...pantalanContext?.vegetationExclusions||[],...grauContext?.vegetationExclusions||[]],bindGround(heightAt){for(const context of [pantalanContext,grauContext])context?.bindGround?.(heightAt);for(const site of Object.values(sites))site.bindGround?.(heightAt);},get stats(){return{...Object.fromEntries(Object.entries(sites).map(([id,s])=>[id,s.stats])),...(pantalanContext?{context:pantalanContext.stats}:{}),...(grauContext?{grauContext:grauContext.stats}:{})};}};
}

// Replace only the road portions owned by the detailed approach. In particular,
// the rest of the long port service road retains its original metadata and path.
export function applyCoastContextRoads(data,contextData){
 const replacements=new Map((contextData?.roadReplacements||[]).map(item=>[String(item.sourceId),item.segments||[]]));
 return{...data,roads:(data.roads||[]).flatMap(road=>{const key=String(road.osmId||road.id);if(!replacements.has(key))return[road];return replacements.get(key).filter(points=>points.length>1).map((coordinates,index)=>({...road,id:road.id+'-outside-'+(contextData?.id==='grau-vell-context'?'grau-vell':'pantalan')+'-'+index,coordinates,contextRemainder:true}));})};
}

export function coastEvidence(entry){
 return industrialEvidence(entry).replace('PUERTO DE SAGUNTO · LUGAR','COSTA DE SAGUNTO · LUGAR');
}
