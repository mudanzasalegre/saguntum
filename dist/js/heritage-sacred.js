import {withoutBerenguerClaims} from './berenguer-context.js';
import * as THREE from 'three';
import {createCalvario} from './calvario.js';
import {createSangre} from './sangre.js';
import {createSangreContext} from './sangre-context.js';
import {createSalvador} from './salvador.js';
import {createSalvadorContext} from './salvador-context.js';
import {createCalvarioContext} from './calvario-context.js';
import {createSantaMaria} from './santa-maria.js';
import {createSantaMariaContext} from './santa-maria-context.js';

// Detailed monuments and their independently owned contextual geometry.
export function createSacredHeritage({heightAt,project,landmarks,data={},santaMariaVisit,santaMariaContext,calvarioVisit,calvarioContext,berenguerContext,sangreVisit,sangreContext,salvadorVisit,salvadorContext}) {
  const records=Array.isArray(landmarks)?Object.fromEntries(landmarks.map(s=>[s.id,s])):landmarks;
  const group=new THREE.Group();group.name='Patrimonio religioso del casco histórico';
  const points={},sites={},exclusions=[],patches=[],views={},excludedRoadIds=new Set(),excludedBuildingIds=new Set(),stats={sites:4,drawCalls:0,vertices:0,stations:14};
  for(const id of ['santa-maria','calvario','sangre','salvador']){
    if(!records[id])throw new Error(`Missing cartography for ${id}`);
    const site=id==='santa-maria'?createSantaMaria({record:records[id],project,heightAt,visitData:santaMariaVisit||data.santaMariaVisit}):id==='calvario'?createCalvario({record:records[id],project,heightAt,visitData:calvarioVisit||data.calvarioVisit,contextData:calvarioContext||data.calvarioContext||{}}):id==='sangre'?createSangre({record:records[id],project,heightAt,visitData:sangreVisit||data.sangreVisit,contextData:sangreContext||data.sangreContext||{}}):createSalvador({record:records[id],project,heightAt,visitData:salvadorVisit||data.salvadorVisit,contextData:salvadorContext||data.salvadorContext||{}});
    if(id==='santa-maria'){
      const context=createSantaMariaContext({data,landmarks:records,project,heightAt,churchFrame:site.frame,contextData:withoutBerenguerClaims(santaMariaContext||data.santaMariaContext||{},berenguerContext||data.berenguerContext||{})}),visit=site.group.userData.visit;
      // The context's vertices and targets are in projected world coordinates.
      // attach preserves that registration under the church's local frame.
      site.group.updateMatrixWorld(true);site.group.attach(context.group);site.group.updateMatrixWorld(true);
      Object.assign(visit.focuses,context.focuses);visit.bounds.union(context.bounds);visit.plan.components.push(...context.plan.components);visit.plan.contextOutline=context.plan.outline;
      const overview=visit.focuses['santa-maria-conjunto'];overview.bounds.copy(visit.bounds);overview.bounds.getCenter(overview.target);site.point=overview.target.clone();
      const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
      visit.selectFocus=id=>{const selected=select(id);context.selectFocus(id);return selected;};
      visit.setReadingMode=mode=>{const result=reading(mode);context.setReadingMode(mode);return result;};
      visit.bindGround=finalHeightAt=>{context.bindGround(finalHeightAt);Object.assign(visit.focuses,context.focuses);ground(finalHeightAt);return site.group;};
      visit.qa.context=context.qa;visit.stats.context=context.stats;visit.stats.contextMeshes=0;context.group.traverse(o=>{if(o.isMesh)visit.stats.contextMeshes++;});
      site.group.userData.context=context;patches.push(...context.patches);exclusions.push(...context.exclusions);
      for(const road of context.excludedRoadIds)excludedRoadIds.add(String(road));for(const building of context.excludedBuildingIds)excludedBuildingIds.add(String(building));
    }
    if(id==='calvario'){
      const context=createCalvarioContext({data,landmarks:records,project,heightAt,contextData:calvarioContext||data.calvarioContext||{}}),visit=site.group.userData.visit;
      site.group.add(context.group);site.group.updateMatrixWorld(true);
      visit.plan.components.push(...context.plan.components);visit.plan.contextOutline=context.plan.outline;
      const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
      visit.selectFocus=id=>{const value=select(id);context.selectFocus(id);return value;};
      visit.setReadingMode=mode=>{const value=reading(mode);context.setReadingMode(mode);return value;};
      visit.bindGround=finalHeightAt=>{context.bindGround(finalHeightAt);ground(finalHeightAt);return site.group;};
      visit.qa.context=context.qa;visit.stats.context=context.stats;site.group.userData.context=context;
      patches.push(...context.patches);exclusions.push(...context.exclusions);
      for(const id of context.excludedBuildingIds||[])excludedBuildingIds.add(String(id));for(const id of context.excludedRoadIds||[])excludedRoadIds.add(String(id));
      for(const id of site.excludedBuildingIds||[])excludedBuildingIds.add(String(id));for(const id of site.excludedRoadIds||[])excludedRoadIds.add(String(id));
    }
    if(id==='sangre'||id==='salvador'){
      const isSalvador=id==='salvador',visitData=isSalvador?(salvadorVisit||data.salvadorVisit):(sangreVisit||data.sangreVisit),contextData=isSalvador?(salvadorContext||data.salvadorContext):(sangreContext||data.sangreContext);
      const context=(isSalvador?createSalvadorContext:createSangreContext)({data,landmarks:records,project,heightAt,visitData,contextData:contextData||{}}),visit=site.group.userData.visit;
      site.group.updateMatrixWorld(true);site.group.attach(context.group);site.group.updateMatrixWorld(true);
      if(context.vegetation)site.group.userData.vegetation=context.vegetation;
      Object.assign(visit.focuses,context.focuses);visit.bounds.union(context.bounds);visit.plan.components.push(...context.plan.components);visit.plan.contextOutline=context.plan.outline;
      const documentaryStops=new Map(visitData?.stops?.map(stop=>[stop.id,stop])||[]);
      const syncLabels=()=>{for(const focus of Object.values(visit.focuses)){const stop=documentaryStops.get(focus.id);if(stop){focus.label=stop.title;focus.regionId=stop.regionId;}}};syncLabels();
      visit.plan.stops=Object.values(visit.focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId}));
      const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
      visit.selectFocus=id=>{const chosen=select(id);context.selectFocus(id);return chosen;};
      visit.setReadingMode=mode=>{const value=reading(mode);context.setReadingMode(mode);return value;};
      visit.bindGround=finalHeightAt=>{context.bindGround(finalHeightAt);Object.assign(visit.focuses,context.focuses);syncLabels();ground?.(finalHeightAt);return site.group;};
      visit.qa.context=context.qa;visit.stats.context=context.stats;visit.stats.stops=Object.keys(visit.focuses).length;site.group.userData.context=context;
      patches.push(...context.patches);exclusions.push(...context.exclusions);
      for(const item of context.excludedBuildingIds||[])excludedBuildingIds.add(String(item));for(const item of context.excludedRoadIds||[])excludedRoadIds.add(String(item));
    }
    for(const item of site.excludedBuildingIds||[])excludedBuildingIds.add(String(item));for(const item of site.excludedRoadIds||[])excludedRoadIds.add(String(item));
    group.add(site.group);sites[id]=site.group;points[id]=site.point;exclusions.push(...(site.exclusions||[site.exclusion]).filter(p=>p?.length>2));if(site.extraExclusion?.length>2)exclusions.push(site.extraExclusion);patches.push(...(site.patches||[site.patch]));
    const yaw=site.ctx?.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw),scale=id==='calvario'?1.7:1;
    const transform=(x,y,z)=>[x*c+z*s,y,-x*s+z*c];views[id]=site.view||site.views||{offset:transform(35*scale,32*scale,-48*scale),closeOffset:transform(9*scale,10*scale,-29*scale)};
    site.group.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(site.group);site.group.userData.bounds={min:box.min.toArray(),max:box.max.toArray()};site.group.traverse(m=>{if(m.isMesh){stats.drawCalls++;stats.vertices+=m.geometry.attributes.position.count;}});
  }
  group.userData={...stats,ownedResources:{materials:[],textures:[]},interpretation:'OSM plans, IGN terrain, published architectural studies and photographic references; most detail dimensions are interpretive.'};
  return{group,sites,points,exclusions,patches,views,stats,excludedRoadIds:[...excludedRoadIds],excludedBuildingIds:[...excludedBuildingIds],collisionPolygons:patches.map(p=>p.polygon)};
}
