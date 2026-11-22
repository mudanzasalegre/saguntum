import * as THREE from 'three';
import {loadHeritageCatalog} from './territory-heritage-catalog.js';
import {buildHeritageModel,inRing,modelId,normalizeBuildingId,releaseModel} from './territory-heritage-models.js';
import {overviewModels} from './territory-heritage-overview.js';
import {heritageWorker} from './territory-heritage-loader.js';

export async function createHeritage({scene,heightAt,project,grids,mobile=false,onChange=()=>{},onError=console.warn}){
 const inventory=await loadHeritageCatalog(project);
 const {places}=inventory,byId=new Map(places.map(p=>[p.id,p]));
 const root=new THREE.Group();root.name='Patrimonio del atlas';
 const options={...inventory,heightAt,project};
 const low=overviewModels(options),loaded=new Map(),failedUntil=new Map();
 let background=null;
 for(const [id,group] of low){group.name='Silueta territorial · '+id;root.add(group);}
 scene.add(root);
 let desired=[],pending=false,disposed=false,historical=null,lastKey='',lastCheck=-Infinity;
 let status={requested:[],loaded:[],loading:false,failures:{}};
 const claimIds=new Set(),claimGrid=new Map(),cell=64;
 function indexClaims(){
  claimGrid.clear();claimIds.clear();
  const claims=[...loaded.values()].flatMap(m=>m.claims);
  for(const [id,mesh] of low)if(!loaded.has(id))claims.push({ids:[],rings:mesh.userData.claims});
  for(const claim of claims){
   for(const id of claim.ids)claimIds.add(id);
   for(const ring of claim.rings||[]){
    for(let z=Math.floor(ring.top/cell);z<=Math.floor(ring.bottom/cell);z++)for(let x=Math.floor(ring.left/cell);x<=Math.floor(ring.right/cell);x++){
     const key=x+','+z;
     if(!claimGrid.has(key))claimGrid.set(key,[]);
     claimGrid.get(key).push(ring);
    }
   }
  }
 }
 indexClaims();
 function notify(){
  indexClaims();
  status.loaded=[...loaded.keys()];status.requested=desired.slice();status.loading=pending;
  onChange();
 }
 async function schedule(){
  if(pending||disposed)return;
  pending=true;
  try{
   let id;
   while(!disposed&&(id=desired.find(k=>!loaded.has(k)&&!(failedUntil.get(k)>performance.now())))){
    // Permit the terrain/camera frame to paint before constructing the next
    // detailed site. No region-wide Three scene is ever constructed here.
    await new Promise(resolve=>setTimeout(resolve,16));
    const needed=()=>!disposed&&desired.includes(id);
    if(!needed())continue;
    try{
     if(!background&&grids)background=heritageWorker(grids);
     let item;
     if(background&&!background.closed){
      try{item=await background.load(id);}
      catch(error){if(!needed())continue;onError(new Error('Patrimonio en primer plano · '+id+' · '+error.message));}
     }
     if(!item&&needed())item=await buildHeritageModel(id,{...options,needed});
     if(!item)continue;
     if(!needed()){releaseModel(item.group);continue;}
     root.add(item.group);loaded.set(id,item);
     if(low.has(id))low.get(id).visible=false;
     item.setHistorical(historical===id);
     delete status.failures[id];notify();
    }catch(error){
     failedUntil.set(id,performance.now()+30000);
     status.failures[id]=String(error.message||error);
     onError(new Error('Patrimonio · '+id+' · '+status.failures[id]));
    }
   }
  }finally{pending=false;if(!disposed)notify();}
 }
 function remove(id){
  const item=loaded.get(id);
  if(!item)return;
  loaded.delete(id);releaseModel(item.group);
  if(low.has(id))low.get(id).visible=true;
 }
 function clear(){
  desired=[];historical=null;lastKey='';
  for(const id of [...loaded.keys()])remove(id);
  notify();
 }
 return {places,group:root,get stats(){return status;},get relief(){return root.visible?[...loaded.values()].map(item=>item.relief):[];},
  update(x,z,altitude,selectedId=null){
   if(disposed)return;
   const key=[Math.round(x/6),Math.round(z/6),Math.round(altitude/12),selectedId].join('/');
   const now=performance.now();
   if(key===lastKey&&now-lastCheck<2500)return;
   lastKey=key;lastCheck=now;
   const nearest=new Map();
   for(const place of places){
    const id=modelId(place.id),distance=Math.hypot(x-place.x,z-place.z);
    // Longer structures need a window along their full extent.
    const reach=id==='castle'?700:id==='pantalan'?950:place.region==='marjal'||place.region==='palancia'||place.region==='almarda'?430:260;
    if(distance>reach*(loaded.has(id)?1.18:1)||altitude>reach*(loaded.has(id)?1.32:1.14))continue;
    const score=distance/(loaded.has(id)?1.18:1)-(selectedId===place.id?reach:0);
    nearest.set(id,Math.min(nearest.get(id)??Infinity,score));
   }
   desired=[...nearest].sort((a,b)=>a[1]-b[1]).slice(0,mobile?1:2).map(([id])=>id);
   const expired=[...loaded.keys()].filter(id=>!desired.includes(id));
   for(const id of expired)remove(id);
   if(expired.length)notify();
   if(desired.some(id=>!loaded.has(id)))void schedule();
  },
  isReplaced(sourceId,x,z){
   if(!root.visible)return false;
   if(claimIds.has(normalizeBuildingId(sourceId)))return true;
   return claimGrid.get(Math.floor(x/cell)+','+Math.floor(z/cell))?.some(ring=>inRing(x,z,ring))||false;
  },
  setHistorical(id,enabled=true){
   const place=byId.get(id);
   if(enabled&&!place?.historical?.inWorld)return false;
   if(historical)loaded.get(historical)?.setHistorical(false);
   historical=enabled?modelId(id):null;
   if(historical)loaded.get(historical)?.setHistorical(true);
   return true;
  },
  clear,dispose(){if(disposed)return;disposed=true;background?.dispose();clear();for(const group of low.values())releaseModel(group);root.removeFromParent();}
 };
}
