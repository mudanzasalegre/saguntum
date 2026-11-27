import * as THREE from 'three';
import {createPublicArchaeology} from './archaeology-public.js';
import {createPortic} from './portic.js';
import {createPorticContext} from './portic-context.js';
import {createDomus} from './domus.js';
import {createDomusContext} from './domus-context.js';
import {createCirco} from './circo.js';
import {createCircoContext} from './circo-context.js';
import {createForumPlaza} from './forum-plaza.js';
import {createForumPlazaContext} from './forum-plaza-context.js';
import {createNecropolis} from './necropolis.js';
import {createNecropolisContext} from './necropolis-context.js';

const presentation={
  portic:{short:'Vía del Pòrtic',title:'La Vía<br>del <em>Pòrtic.</em>',facts:[['60 m','tramo de calzada'],['5,40 m','ancho documentado']],radius:65,angle:[65,78,-94]},
  domus:{short:'Domus dels Peixos',title:'La casa<br>de los <em>peces.</em>',facts:[['7,31 m','longitud del atrio'],['Pintura','peces en el impluvio']],radius:28,angle:[24,35,-32]},
  circo:{short:'Puerta del circo',title:'El umbral<br>del <em>circo.</em>',facts:[['1,20 m','luz de la puerta'],['S. II','circo romano']],radius:35,angle:[24,22,30]},
  'forum-plaza':{short:'Plaza del Fórum',title:'Plaza<br>del <em>Fórum.</em>',facts:[['1.608 m²','parque arqueológico'],['2018','plaza pública']],radius:48,angle:[44,48,55]},
  diana:{short:'Muro de Diana',title:'Un muro,<br>muchas <em>lecturas.</em>',facts:[['15 × 4 m','paramento antiguo'],['En estudio','función y cronología']],radius:35,angle:[24,22,-32]},
  necropolis:{short:'Necrópolis e hipogeos',title:'La memoria<br>bajo la <em>roca.</em>',facts:[['XIV–XV','fase medieval mostrada'],['2 ámbitos','necrópolis e hipogeos']],radius:40,angle:[30,40,-45]}
};
export function registerArchaeology(datasets,catalog,byId,tourOrder){
  const records=Object.fromEntries(datasets.flatMap(data=>data.sites||[]).map(site=>[site.id,site]));
  const additions=Object.values(records).sort((a,b)=>a.number-b.number).map(record=>({...record,...presentation[record.id],archaeological:true}));
  const insert=catalog.findIndex(c=>c.id==='theatre');catalog.splice(insert<0?catalog.length:insert,0,...additions);
  for(const entry of additions)byId[entry.id]=entry;
  tourOrder.push(...additions.map(c=>c.id));return records;
}
export function createArchaeology(options){
  const group=new THREE.Group();group.name='Arqueología de Sagunto · yacimientos y ciudad';const sites={};
  const detailed=[];
  for(const [id,factory,contextFactory,visitData,contextData] of [
    ['portic',createPortic,createPorticContext,options.porticVisit,options.porticContext],
    ['domus',createDomus,createDomusContext,options.domusVisit,options.domusContext],
    ['circo',createCirco,createCircoContext,options.circoVisit,options.circoContext],
    ['forum-plaza',createForumPlaza,createForumPlazaContext,options.forumPlazaVisit,options.forumPlazaContext],
    ['necropolis',createNecropolis,createNecropolisContext,options.necropolisVisit,options.necropolisContext]
  ]){
   if(id==='forum-plaza'&&!options.records?.[id])continue;
   const site=factory({...options,record:options.records?.[id],visitData:visitData||{},contextData:contextData||{}});
   const context=contextFactory({...options,visitData:visitData||{},contextData:contextData||{}});
   site.group.updateMatrixWorld(true);site.group.attach(context.group);site.group.updateMatrixWorld(true);
   const visit=site.visit||site.group.userData.visit;
   if(visit){
    site.visit=visit;site.group.userData.visit=visit;
    Object.assign(visit.focuses,context.focuses||{});
    if(context.bounds)visit.bounds.union(context.bounds);
    if(context.plan?.components)visit.plan.components.push(...context.plan.components);
    if(context.plan?.outline)visit.plan.contextOutline=context.plan.outline;
    const labels=new Map((visitData?.stops||[]).map(s=>[s.id,s]));
    const syncLabels=()=>{for(const focus of Object.values(visit.focuses)){const s=labels.get(focus.id);if(s){focus.label=s.title;focus.regionId=s.regionId;focus.readingLayer=s.readingLayer||focus.readingLayer;}}};syncLabels();
    visit.plan.stops=Object.values(visit.focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId,readingLayer:f.readingLayer,floor:f.floor,mapScope:f.mapScope,archFocus:f.archFocus}));
    const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
    visit.selectFocus=id=>{const result=select?.(id);context.selectFocus?.(id);return result;};
    visit.setReadingMode=mode=>{const result=reading?.(mode);context.setReadingMode?.(mode);return result;};
    visit.bindGround=heightAt=>{context.bindGround?.(heightAt);Object.assign(visit.focuses,context.focuses||{});syncLabels();ground?.(heightAt);return site.group;};
    visit.stats.context=context.stats;visit.stats.stops=Object.keys(visit.focuses).length;
   }
   site.group.userData.context=context;if(id==='circo'&&site.historicalMask)site.historicalMask.includeSiteContext=true;
   if(id==='forum-plaza'){
    const planting=[];
    site.group.traverse(mesh=>{const d=mesh.userData;if(mesh.isMesh&&['jardin','jardin-vertical'].includes(d.component)&&['woodDark','leaf','leafLight','leafDark','leafRed'].includes(d.materialKind))planting.push(mesh);});
    site.group.userData.vegetationLayers=[site.group.userData.vegetation,context.vegetation,...planting].filter(Boolean);
   }
   else if(context.vegetation)site.group.userData.vegetation=context.vegetation;
   group.add(site.group);sites[id]=site;detailed.push(site,context);
  }
  for(const factory of [createPublicArchaeology]){const result=factory({...options,excludeIds:['circo']});group.add(result.group);Object.assign(sites,result.sites);}
  const points=Object.fromEntries(Object.values(sites).map(site=>{const point=site.point.clone();point.y=Math.max(point.y,options.heightAt(point.x,point.z)+2);return[site.id,point];}));
  return{group,sites,points,views:Object.fromEntries(Object.values(sites).map(s=>[s.id,s.views])),stats:Object.fromEntries(Object.values(sites).map(s=>[s.id,s.stats])),patches:detailed.flatMap(s=>s.patches||[]),exclusions:detailed.flatMap(s=>s.exclusions||[]),vegetationExclusions:detailed.flatMap(s=>s.vegetationExclusions||[]),excludedBuildingIds:[...new Set(detailed.flatMap(s=>s.excludedBuildingIds||[]).map(String))],excludedRoadIds:[...new Set(detailed.flatMap(s=>s.excludedRoadIds||[]).map(String))]};
}
