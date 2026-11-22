import * as THREE from 'three';
import {createPortIndustrial} from './port-industrial.js';
import {createHornoContext} from './horno-context.js';
import {createTalleresContext} from './talleres-context.js';
import {createMuseoIndustrialContext} from './museo-industrial-context.js';
import {createGerenciaContext} from './gerencia-context.js';
import {createCasinoContext} from './casino-context.js';
import {createBegonaContext} from './begona-context.js';
import {createEconomatoContext} from './economato-context.js';
import {createBarrioContext} from './barrio-context.js';
import {createSanatorioContext} from './sanatorio-context.js';
import {createPortGarden} from './port-garden.js';
import {createPortWorkers} from './port-workers.js';

export const portShape={cx:5350,cz:2250,rx:1700,rz:1700};
export const portMeshOptions={shape:portShape,core:{minX:4100,maxX:5500,minZ:1450,maxZ:2900},coreStep:5,outerStep:12.5};
export const inPortBounds=(x,z,margin=0)=>((x-portShape.cx)/(portShape.rx-margin))**2+((z-portShape.cz)/(portShape.rz-margin))**2<1;

export function registerPortHeritage(datasets,catalog,byId,tourOrder){
 const status={
  'museo-industrial':'Museo abierto desde el 15 de octubre de 2026. La nave conserva la memoria de la siderurgia y de sus trabajadores.',
  casino:'Rehabilitación en curso según la noticia municipal del 6 de octubre de 2026. El modelo mantiene el patio abierto.',
  economato:'Rehabilitación documentada en 2026 y finalización prevista en 2027. La visita interpreta la arquitectura de la cooperativa; el nuevo centro no se representa como terminado.',
  gerencia:'Conjunto histórico y jardines. Las intervenciones paisajísticas de 2026 se explican en la documentación.'
 };
 const records=Object.fromEntries(datasets.flatMap(data=>data.sites||[]).sort((a,b)=>a.number-b.number).map(s=>[s.id,s]));
 const entries=Object.values(records).map(s=>{
  const sourceDetails=(s.sources||[]).map(v=>typeof v==='string'?{label:'Documentación patrimonial',url:v}:v);
  return {...s,currentState:s.currentState||status[s.id],region:'puerto',industrial:true,sourceDetails,sources:sourceDetails.map(v=>v.url),angle:s.angle||[90,85,-120],radius:s.radius||70};
 });
 const insert=catalog.findIndex(c=>c.id==='theatre');catalog.splice(insert<0?catalog.length:insert,0,...entries);
 for(const entry of entries)byId[entry.id]=entry;
 tourOrder.push(...entries.map(c=>c.id));return records;
}

export function createPortHeritage(options){
 const group=new THREE.Group();group.name='Puerto de Sagunto · patrimonio industrial 14–22';
 const sites={};
 for(const factory of [createPortIndustrial,createPortGarden,createPortWorkers]){
  const result=factory(options);group.add(result.group);Object.assign(sites,result.sites);
 }
 const contexts={
  sanatorio:createSanatorioContext({contextData:options.sanatorioContext||{},visitData:options.sanatorioVisit||{},project:options.project,heightAt:options.heightAt}),
  'barrio-obrero':createBarrioContext({contextData:options.barrioContext||{},visitData:options.barrioVisit||{},project:options.project,heightAt:options.heightAt}),
  economato:createEconomatoContext({contextData:options.economatoContext||{},visitData:options.economatoVisit||{},project:options.project,heightAt:options.heightAt}),
  begona:createBegonaContext({contextData:options.begonaContext||{},visitData:options.begonaVisit||{},project:options.project,heightAt:options.heightAt}),
  casino:createCasinoContext({contextData:options.casinoContext||{},visitData:options.casinoVisit||{},project:options.project,heightAt:options.heightAt}),
  horno:createHornoContext({contextData:options.hornoContext||{},visitData:options.hornoVisit||{},project:options.project,heightAt:options.heightAt}),
  talleres:createTalleresContext({contextData:options.talleresContext||{},visitData:options.talleresVisit||{},project:options.project,heightAt:options.heightAt}),
  gerencia:createGerenciaContext({contextData:options.gerenciaContext||{},visitData:options.gerenciaVisit||{},project:options.project,heightAt:options.heightAt}),
  'museo-industrial':createMuseoIndustrialContext({contextData:options.museoIndustrialContext||{},visitData:options.museoIndustrialVisit||{},project:options.project,heightAt:options.heightAt})
 };
 const visitData={horno:options.hornoVisit,talleres:options.talleresVisit,'museo-industrial':options.museoIndustrialVisit,gerencia:options.gerenciaVisit,casino:options.casinoVisit,begona:options.begonaVisit,economato:options.economatoVisit,'barrio-obrero':options.barrioVisit,sanatorio:options.sanatorioVisit};
 function registerContext(id){
  const context=contexts[id],visit=sites[id]?.visit,data=visitData[id];if(!visit)return;
  for(const[focusId,focus]of Object.entries(context.focuses||{}))visit.focuses[focusId]=focus;
  for(const stop of data?.stops||[]){const focus=visit.focuses[stop.id];if(focus){focus.label=stop.title;focus.regionId=stop.regionId;focus.readingLayer=stop.readingLayer||focus.readingLayer;}}
  if(visit.plan)visit.plan.stops=(data?.stops||visit.plan.stops||[]).map(stop=>{const f=visit.focuses[stop.id];return f?{id:stop.id,label:f.label,coordinates:f.coordinates,localTarget:f.localTarget,elevation:f.elevation,regionId:f.regionId,readingLayer:f.readingLayer,floor:f.floor,buildingId:f.buildingId,interiorView:!!f.interiorView,requiresSection:!!f.requiresSection}:stop;});
  if(visit.stats)visit.stats.context=context.stats;
 }
 for(const [id,context]of Object.entries(contexts)){
  group.add(context.group);registerContext(id);const visit=sites[id]?.visit;
  if(visit){
   const select=visit.selectFocus?.bind(visit),read=visit.setReadingMode?.bind(visit);
   visit.selectFocus=focus=>{const result=select?.(focus);context.selectFocus?.(focus);return result;};
   visit.setReadingMode=mode=>{const result=read?.(mode);context.setReadingMode?.(mode);return result;};
   if(visit.plan){visit.plan.components=[...(visit.plan.components||[]),...(context.plan?.components||[])];visit.plan.contextOutline=context.plan?.outline;}
   sites[id].collisionPolygons=[...(sites[id].collisionPolygons||[]),...(context.collisionPolygons||[])];
  }
 }
 const contextValues=Object.values(contexts),points={},views={},bounds={},patches=contextValues.flatMap(c=>c.patches||[]),exclusions=contextValues.flatMap(c=>c.exclusions||[]),vegetationExclusions=contextValues.flatMap(c=>c.vegetationExclusions||[]),excludedIds=new Set(contextValues.flatMap(c=>Array.from(c.excludedBuildingIds||[],String))),excludedRoadIds=new Set(contextValues.flatMap(c=>Array.from(c.excludedRoadIds||[],String)));
 for(const [id,s] of Object.entries(sites)){
  s.id=id;s.group.userData.id=id;s.group.updateMatrixWorld(true);
  points[id]=s.point;views[id]=s.views;bounds[id]=new THREE.Box3().setFromObject(s.group);
  patches.push(...(s.patches||[]));exclusions.push(...(s.exclusions||[]));
  for(const v of options.records[id]?.osmBuildingIds||[])excludedIds.add(String(v).replace(/^way\//,''));
  for(const v of s.group.userData.osmContextFootprints||[])excludedIds.add(String(v));
  for(const v of s.excludedBuildingIds||[])excludedIds.add(String(v));
  for(const v of s.excludedRoadIds||[])excludedRoadIds.add(String(v));
  vegetationExclusions.push(...(s.vegetationExclusions||[]));
 }
 const stats=Object.fromEntries(Object.entries(sites).map(([id,site])=>[id,site.stats]));
 return {group,sites,points,views,bounds,patches,exclusions,vegetationExclusions,excludedIds,excludedRoadIds,hornoContext:contexts.horno,talleresContext:contexts.talleres,museoIndustrialContext:contexts['museo-industrial'],gerenciaContext:contexts.gerencia,casinoContext:contexts.casino,begonaContext:contexts.begona,economatoContext:contexts.economato,barrioContext:contexts['barrio-obrero'],sanatorioContext:contexts.sanatorio,stats,
  bindGround(sample){for(const[id,context]of Object.entries(contexts)){sites[id]?.visit?.bindGround?.(sample);context.bindGround?.(sample);registerContext(id);}group.updateMatrixWorld(true);for(const[id,site]of Object.entries(sites)){bounds[id].setFromObject(site.group);points[id].copy(site.point);} }
 };
}

const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function industrialEvidence(entry){
 const reviewedDate=/^\d{4}-\d{2}-\d{2}$/.test(entry.stateAsOf||'')?new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(entry.stateAsOf+'T12:00:00Z')):'19 de noviembre de 2026';
 const evidence=(entry.evidence||[]).map(item=>typeof item==='string'?{element:'Modelo',basis:item}:item);
 const levels={cartographic:'Base cartográfica',documented:'Documentado',interpretative:'Interpretación arquitectónica',interpretive:'Interpretación arquitectónica',interpreted:'Interpretación arquitectónica',inferred:'Estimado',current:'Estado contrastado',historical:'Documentación histórica'};
 const rows=evidence.map(item=>`<tr><th>${html(item.element||item.part||item.title||item.label||'Elemento')}</th><td>${html(item.basis||item.description||item.documented||item.evidence||item.note||item.detail||'Documentación en la ficha')}<br><strong>${html(levels[item.level]||item.confidence||item.status||item.level||'')}</strong></td></tr>`).join('');
 return `<p class="eyebrow">PUERTO DE SAGUNTO · LUGAR ${entry.number}</p><h2>${html(entry.name)}</h2><p>${html(entry.history)}</p><div class="fact-banner"><p>${html(entry.look)}</p></div><h3>En esta maqueta</h3><ul>${entry.features.map(f=>`<li>${html(f)}</li>`).join('')}</ul>${entry.currentState||entry.statusNote?`<h3>Estado documentado</h3><p>${html(entry.currentState||entry.statusNote)}</p>`:''}<p class="model-note">${html(entry.modelNote||'Reproducción arquitectónica interpretativa. Las plantas se apoyan en cartografía y ortofoto; las alturas y los detalles sin levantamiento se estiman.')}<br>Documentación revisada el ${html(reviewedDate)}.</p>${rows?`<h3>Qué sabemos de sus formas</h3><table class="evidence-table"><thead><tr><th>Elemento</th><th>Base del modelo</th></tr></thead><tbody>${rows}</tbody></table>`:''}<div class="sources-list">${entry.sourceDetails.map(source=>`<a href="${html(source.url)}" target="_blank" rel="noopener noreferrer">${html(source.label||'Fuente patrimonial')}<small>${html(new URL(source.url).hostname)}</small></a>`).join('')}</div>`;
}
