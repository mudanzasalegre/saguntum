import * as THREE from 'three';
import { createPlazaMayor } from './plaza-mayor.js';
import { createPlazaMayorContext } from './plaza-mayor-context.js';
import { createJuderia } from './juderia.js';
import { createJuderiaContext } from './juderia-context.js';
import { createBerenguer } from './berenguer.js';
import { createBerenguerContext, withoutBerenguerClaims } from './berenguer-context.js';
import { createMuseo } from './museo.js';
import { createMuseoContext } from './museo-context.js';

// Detailed civil monuments keep independent geometry, materials and context ownership.
export function createCivicHeritage({heightAt,project,landmarks,data={},plazaVisit,plazaContext,juderiaVisit,juderiaContext,berenguerVisit,berenguerContext,museoVisit,museoContext}) {
  const records=Array.isArray(landmarks)?Object.fromEntries(landmarks.map(s=>[s.id,s])):landmarks;
  const group=new THREE.Group();group.name='Patrimonio civil del casco histórico';
  const points={},sites={},exclusions=[],patches=[],views={},roofs=[],stats={},excludedBuildingIds=new Set(),excludedRoadIds=new Set();
  let dianaSite=null;
  const selectedBerenguerContext=berenguerContext||data.berenguerContext||{};
  plazaContext=withoutBerenguerClaims(plazaContext||data.plazaContext||{},selectedBerenguerContext);
  juderiaContext=withoutBerenguerClaims(juderiaContext||data.juderiaContext||{},selectedBerenguerContext);
  const factories={'plaza-mayor':null,juderia:null,berenguer:createBerenguer,museo:createMuseo};
  for(const[id,create]of Object.entries(factories)){
    const site=records?.[id];if(!site)continue;
    const model=id==='plaza-mayor'?createPlazaMayor({heightAt,project,record:site,visitData:plazaVisit||data.plazaVisit,contextData:plazaContext||data.plazaContext||{}}):id==='juderia'?createJuderia({heightAt,project,record:site,visitData:juderiaVisit||data.juderiaVisit,contextData:juderiaContext||data.juderiaContext||{}}):id==='berenguer'?createBerenguer({heightAt,project,record:site,visitData:berenguerVisit||data.berenguerVisit,contextData:selectedBerenguerContext}):create({heightAt,project,record:site,visitData:museoVisit||data.museoVisit,contextData:museoContext||data.museoContext||{}});
    if(id==='plaza-mayor'){
      const context=createPlazaMayorContext({data,landmarks:records,project,heightAt,contextData:plazaContext||data.plazaContext||{}}),visit=model.group.userData.visit;
      model.group.add(context.group);model.group.updateMatrixWorld(true);
      Object.assign(visit.focuses,context.focuses);visit.bounds.union(context.bounds);visit.plan.components.push(...context.plan.components);visit.plan.contextOutline=context.plan.outline;
      visit.plan.stops=Object.values(visit.focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId}));
      const overview=visit.focuses['plaza-conjunto'];
      // The square and the retained church define the overview, while the
      // farther context remains a backdrop rather than making the plaza tiny.
      const overviewBounds=new THREE.Box3();
      for(const child of model.group.children)if(child!==context.group)overviewBounds.expandByObject(child);
      const church=records['santa-maria'];if(church){for(const ll of church.footprint||[]){const p=project(...ll),y=heightAt(p.x,p.z);overviewBounds.expandByPoint(new THREE.Vector3(p.x,y,p.z));overviewBounds.expandByPoint(new THREE.Vector3(p.x,y+27,p.z));}}
      if(!overviewBounds.isEmpty()){overview.bounds.copy(overviewBounds);overview.bounds.getCenter(overview.target);model.point=overview.target.clone();}
      const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
      visit.selectFocus=id=>{const selected=select(id);context.selectFocus(id);return selected;};
      visit.setReadingMode=mode=>{const result=reading(mode);context.setReadingMode(mode);return result;};
      visit.bindGround=finalHeightAt=>{context.bindGround(finalHeightAt);Object.assign(visit.focuses,context.focuses);ground(finalHeightAt);return model.group;};
      visit.qa.context=context.qa;visit.stats.context=context.stats;visit.stats.stops=Object.keys(visit.focuses).length;
      model.group.userData.context=context;
      patches.push(...context.patches);exclusions.push(...context.exclusions);
      for(const v of context.excludedBuildingIds||[])excludedBuildingIds.add(String(v));for(const v of context.excludedRoadIds||[])excludedRoadIds.add(String(v));
    }
    if(id==='juderia'){
      const context=createJuderiaContext({data,landmarks:records,project,heightAt,contextData:juderiaContext||data.juderiaContext||{}}),visit=model.group.userData.visit;
      model.group.add(context.group);model.group.updateMatrixWorld(true);
      Object.assign(visit.focuses,context.focuses);const documentaryStops=new Map((juderiaVisit||data.juderiaVisit)?.stops?.map(s=>[s.id,s])||[]),syncLabels=()=>{for(const f of Object.values(visit.focuses)){const s=documentaryStops.get(f.id);if(s){f.label=s.title;f.regionId=s.regionId;}}};syncLabels();visit.bounds.union(context.bounds);visit.plan.components.push(...context.plan.components);visit.plan.contextOutline=context.plan.outline;
      visit.plan.stops=Object.values(visit.focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId}));
      const overview=visit.focuses['juderia-conjunto'],overviewBounds=new THREE.Box3();
      for(const child of model.group.children)if(child!==context.group)overviewBounds.expandByObject(child);
      // The historic district defines the panorama; the outer neighbourhood
      // remains background and does not force a city-wide camera position.
      for(const ll of site.districtBoundary||[]){const p=project(...ll),y=heightAt(p.x,p.z);overviewBounds.expandByPoint(new THREE.Vector3(p.x,y,p.z));overviewBounds.expandByPoint(new THREE.Vector3(p.x,y+11,p.z));}
      if(!overviewBounds.isEmpty()){overview.bounds.copy(overviewBounds);overview.bounds.getCenter(overview.target);overview.target.y+=12;model.point=overview.target.clone();}
      const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
      visit.selectFocus=id=>{const selected=select(id);context.selectFocus(id);return selected;};
      visit.setReadingMode=mode=>{const result=reading(mode);context.setReadingMode(mode);return result;};
      visit.bindGround=finalHeightAt=>{context.bindGround(finalHeightAt);Object.assign(visit.focuses,context.focuses);syncLabels();ground(finalHeightAt);return model.group;};
      visit.qa.context=context.qa;visit.stats.context=context.stats;visit.stats.stops=Object.keys(visit.focuses).length;
      model.group.userData.context=context;
      patches.push(...context.patches);exclusions.push(...context.exclusions);
      for(const v of context.excludedBuildingIds||[])excludedBuildingIds.add(String(v));for(const v of context.excludedRoadIds||[])excludedRoadIds.add(String(v));
    }
    if(id==='berenguer'){
      const context=createBerenguerContext({data,landmarks:records,project,heightAt,visitData:berenguerVisit||data.berenguerVisit,contextData:selectedBerenguerContext}),visit=model.group.userData.visit;
      model.group.add(context.group);model.group.updateMatrixWorld(true);
      Object.assign(visit.focuses,context.focuses);visit.bounds.union(context.bounds);visit.plan.components.push(...context.plan.components);visit.plan.contextOutline=context.plan.outline;
      const documentaryStops=new Map((berenguerVisit||data.berenguerVisit)?.stops?.map(s=>[s.id,s])||[]);
      const syncLabels=()=>{for(const f of Object.values(visit.focuses)){const stop=documentaryStops.get(f.id);if(stop){f.label=stop.title;f.regionId=stop.regionId;}}};syncLabels();
      visit.plan.stops=Object.values(visit.focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId}));
      const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
      visit.selectFocus=id=>{const selected=select(id);context.selectFocus(id);return selected;};
      visit.setReadingMode=mode=>{const result=reading(mode);context.setReadingMode(mode);return result;};
      visit.bindGround=finalHeightAt=>{context.bindGround(finalHeightAt);Object.assign(visit.focuses,context.focuses);syncLabels();ground?.(finalHeightAt);return model.group;};
      visit.qa.context=context.qa;visit.stats.context=context.stats;visit.stats.stops=Object.keys(visit.focuses).length;
      model.group.userData.context=context;dianaSite=model.dianaSite;
      patches.push(...context.patches);exclusions.push(...context.exclusions);
      for(const v of context.excludedBuildingIds||[])excludedBuildingIds.add(String(v));for(const v of context.excludedRoadIds||[])excludedRoadIds.add(String(v));
    }
    if(id==='museo'){
      const context=createMuseoContext({data,landmarks:records,project,heightAt,visitData:museoVisit||data.museoVisit,contextData:museoContext||data.museoContext||{}}),visit=model.group.userData.visit;
      model.group.updateMatrixWorld(true);model.group.attach(context.group);model.group.updateMatrixWorld(true);
      if(context.vegetation)model.group.userData.vegetation=context.vegetation;
      Object.assign(visit.focuses,context.focuses);visit.bounds.union(context.bounds);visit.plan.components.push(...context.plan.components);visit.plan.contextOutline=context.plan.outline;
      const documentaryStops=new Map((museoVisit||data.museoVisit)?.stops?.map(stop=>[stop.id,stop])||[]);
      const syncLabels=()=>{for(const focus of Object.values(visit.focuses)){const stop=documentaryStops.get(focus.id);if(stop){focus.label=stop.title;focus.regionId=stop.regionId;}}};syncLabels();
      visit.plan.stops=Object.values(visit.focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId,floor:f.floor}));
      const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
      visit.selectFocus=id=>{const chosen=select(id);context.selectFocus(id);return chosen;};
      visit.setReadingMode=mode=>{const value=reading(mode);context.setReadingMode(mode);return value;};
      visit.bindGround=finalHeightAt=>{context.bindGround(finalHeightAt);Object.assign(visit.focuses,context.focuses);syncLabels();ground?.(finalHeightAt);return model.group;};
      visit.qa.context=context.qa;visit.stats.context=context.stats;visit.stats.stops=Object.keys(visit.focuses).length;model.group.userData.context=context;
      // The nearby arch remains a single physical object owned by the Judería.
      visit.sharedSites={juderia:sites.juderia};
      patches.push(...context.patches);exclusions.push(...context.exclusions);
      for(const item of context.excludedBuildingIds||[])excludedBuildingIds.add(String(item));for(const item of context.excludedRoadIds||[])excludedRoadIds.add(String(item));
    }
    for(const v of model.excludedBuildingIds||[])excludedBuildingIds.add(String(v));for(const v of model.excludedRoadIds||[])excludedRoadIds.add(String(v));
    model.group.userData.id=id;model.group.userData.label=site.name;group.add(model.group);sites[id]=model.group;points[id]=model.point;exclusions.push(...model.exclusions);patches.push(...model.patches);views[id]=model.view;if(model.roof)roofs.push({id,object:model.roof});
    model.group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model.group);model.group.userData.bounds={min:bounds.min.toArray(),max:bounds.max.toArray()};let triangles=0,meshes=0;model.group.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.userData.siteId=id;}});stats[id]={triangles,meshes,footprints:model.exclusions.length};
  }
  group.userData.ownedResources={materials:[],textures:[],geometries:[]};
  return{group,sites,points,exclusions,patches,views,roofs,stats,dianaSite,excludedBuildingIds:[...excludedBuildingIds],excludedRoadIds:[...excludedRoadIds]};
}
