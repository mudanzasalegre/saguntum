import * as THREE from 'three';
import {createGerencia} from './gerencia.js';
import {createCasino} from './casino.js';
import {createBegona} from './begona.js';

// Each place owns its documented architecture; its surroundings are joined by port.js.
export function createPortGarden({heightAt,project,records,gerenciaVisit,gerenciaContext,casinoVisit,casinoContext,begonaVisit,begonaContext}){
 const entries=Array.isArray(records)?records:records.sites||Object.values(records),group=new THREE.Group(),sites={};group.name='La ciudad factoría · Gerencia, Casino y Begoña';
 const factories={gerencia:createGerencia,casino:createCasino,begona:createBegona};
 const visits={gerencia:gerenciaVisit,casino:casinoVisit,begona:begonaVisit},contexts={gerencia:gerenciaContext,casino:casinoContext,begona:begonaContext};
 for(const site of entries){const factory=factories[site.id];if(!factory)continue;const item=factory({heightAt,project,site,visitData:visits[site.id],contextData:contexts[site.id]});sites[site.id]=item;group.add(item.group);}
 let meshes=0,triangles=0;group.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 return{group,sites,stats:{sites:Object.keys(sites).length,meshes,triangles,...Object.fromEntries(Object.entries(sites).map(([id,s])=>[id,s.stats]))}};
}
