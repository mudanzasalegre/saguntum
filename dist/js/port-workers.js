import * as THREE from 'three';
import {createEconomato} from './economato.js';
import {createBarrio} from './barrio.js';
import {createSanatorio} from './sanatorio.js';

// Each company-town ensemble owns its architecture and documented visit.
// All factories use the same metric frame and final-ground binding contract.
export function createPortWorkers({heightAt,project,records,economatoContext,economatoVisit,barrioContext,barrioVisit,sanatorioContext,sanatorioVisit}){
 const all=Array.isArray(records)?records:records.sites||Object.values(records),group=new THREE.Group();
 group.name='La vida cotidiana en la ciudad factoría';
 const sites={},factories={
  economato:{create:createEconomato,context:economatoContext,visit:economatoVisit},
  'barrio-obrero':{create:createBarrio,context:barrioContext,visit:barrioVisit},
  sanatorio:{create:createSanatorio,context:sanatorioContext,visit:sanatorioVisit}
 };
 for(const record of all){
  const factory=factories[record.id];if(!factory)continue;
  const site=factory.create({record,project,heightAt,contextData:factory.context,visitData:factory.visit});
  sites[record.id]=site;group.add(site.group);
 }
 return {group,sites,stats:{places:Object.keys(sites).length,parts:Object.values(sites).reduce((n,s)=>n+s.stats.parts,0),triangles:Object.values(sites).reduce((n,s)=>n+s.stats.triangles,0)}};
}
