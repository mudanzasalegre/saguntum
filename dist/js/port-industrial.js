import * as THREE from 'three';
import {createHorno} from './horno.js';
import {createTalleres} from './talleres.js';
import {createMuseoIndustrial} from './museo-industrial.js';

// Each preserved industrial building owns its documented geometry and visit.
// A common factory keeps all three places in the same Puerto terrain and atlas.
export function createPortIndustrial({heightAt,project,records,hornoVisit,hornoContext,talleresVisit,talleresContext,museoIndustrialVisit,museoIndustrialContext}){
 const group=new THREE.Group();group.name='Puerto · Máquinas y naves';const sites={};
 const definitions=[['horno',createHorno,hornoVisit,hornoContext],['talleres',createTalleres,talleresVisit,talleresContext],['museo-industrial',createMuseoIndustrial,museoIndustrialVisit,museoIndustrialContext]];
 for(const[id,make,visitData,contextData]of definitions){
  const site=records[id]??records.sites?.find(s=>s.id===id);if(!site)continue;
  const made=make({heightAt,project,site,record:site,visitData,contextData});sites[id]=made;group.add(made.group);
 }
 return {group,sites,stats:Object.fromEntries(Object.entries(sites).map(([id,site])=>[id,site.stats]))};
}
