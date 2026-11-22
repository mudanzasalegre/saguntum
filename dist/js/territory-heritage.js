import * as THREE from 'three';
import {loadHeritageCatalog} from './territory-heritage-catalog.js';
import {buildHeritageModel,inRing,modelId,normalizeBuildingId,releaseModel} from './territory-heritage-models.js';
import {overviewModels} from './territory-heritage-overview.js';
import {heritageWorker} from './territory-heritage-loader.js';
import {dressHeritageSurfaces} from './territory-heritage-surface.js';
import {heightOnPavement} from './territory-heritage-paving.js';
import {atlasRoadMasks,maxLocalHeritage} from './territory-heritage-roadmask.js';

export async function createHeritage({scene,heightAt,project,grids,mobile=false,onChange=()=>{},onError=console.warn}){
 const inventory=await loadHeritageCatalog(project);
 const {places}=inventory,byId=new Map(places.map(p=>[p.id,p]));
 const root=new THREE.Group();root.name='Patrimonio del atlas';
 const atlasLighting={value:1};
 const options={...inventory,heightAt,project};
 const low=overviewModels(options),loaded=new Map(),failedUntil=new Map();
 let background=null;
 for(const [id,group] of low){group.name='Silueta territorial · '+id;root.add(group);}
 scene.add(root);
 let desired=[],pending=false,disposed=false,historical=null,lastKey='',lastCheck=-Infinity;
 let lastAltitude=0,lastQuality=0,focusX=0,focusZ=0;
 let status={requested:[],loaded:[],loading:false,failures:{}};
 const claimIds=new Set(),claimGrid=new Map(),propGrid=new Map(),greenGrid=new Map(),cell=64;
 const roadMasks=atlasRoadMasks();
 function index(grid,value,left,top,right,bottom){
  for(let z=Math.floor(top/cell);z<=Math.floor(bottom/cell);z++)for(let x=Math.floor(left/cell);x<=Math.floor(right/cell);x++){
   const key=x+','+z;
   if(!grid.has(key))grid.set(key,[]);
   grid.get(key).push(value);
  }
 }
 function nearby(grid,x,z){return grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];}
 // Local exhibit lamps have finite authored ranges. Bound their simultaneous
 // GPU cost while retaining the original lights at the occupied building.
 function chooseLights(){
  const near=[];
  for(const item of loaded.values())for(const light of item.lamps){
   light.layers.disable(0);
   if(lastAltitude>440)continue;
   const e=light.matrixWorld.elements;
   const distance=Math.hypot(e[12]-focusX,e[14]-focusZ);
   if(distance>light.distance+Math.min(90,20+lastAltitude*.6))continue;
   let parent=light;while(parent?.visible)parent=parent.parent;
   if(!parent)near.push({light,distance});
  }
  near.sort((a,b)=>a.distance-b.distance);
  const enabled=near.slice(0,lastQuality>=2?8:lastQuality===1?4:2);
  for(const {light} of enabled)light.layers.enable(0);
  status.lights=enabled.length;
 }
 function indexClaims(){
  claimGrid.clear();claimIds.clear();propGrid.clear();greenGrid.clear();
  const claims=[...loaded.values()].flatMap(m=>m.claims);
  for(const [id,mesh] of low)if(!loaded.has(id))claims.push({ids:[],rings:mesh.userData.claims});
  for(const claim of claims){
   for(const id of claim.ids)claimIds.add(id);
   for(const ring of claim.rings||[])index(claimGrid,ring,ring.left,ring.top,ring.right,ring.bottom);
   for(const ring of claim.green||[])index(greenGrid,ring,ring.left,ring.top,ring.right,ring.bottom);
   for(const pt of claim.props||[])index(propGrid,pt,pt[0]-pt[2],pt[1]-pt[2],pt[0]+pt[2],pt[1]+pt[2]);
  }
  roadMasks.update(root.visible?[...loaded.values()]:[]);
 }
 indexClaims();
 function notify(){
  indexClaims();
  status.loaded=[...loaded.keys()];status.requested=desired.slice();status.loading=pending;
  status.contexts=[...loaded.values()].map(m=>m.contextStats).filter(Boolean);
  status.landscapes=Object.fromEntries([...loaded].filter(([,m])=>m.density.total).map(([id,m])=>[id,m.density]));
  chooseLights();
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
     dressHeritageSurfaces(item.group,atlasLighting);
     root.add(item.group);loaded.set(id,item);
     item.group.updateWorldMatrix(true,true);item.lamps=[];
     item.group.traverse(o=>{if(o.isPointLight)item.lamps.push(o);});
     item.density=item.setDensity(lastAltitude,lastQuality);
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
  maskRoadMaterial:roadMasks.apply,
  setAtlasLighting(enabled){atlasLighting.value=enabled?1:0;},
  walkSurface(x,z){
   let height=null;
   if(root.visible)for(const {pavement} of loaded.values()){
    const h=heightOnPavement(pavement,x,z);if(h!==null&&(height===null||h>height))height=h;
   }
   return height;
  },
  ownsVegetation(x,z){return root.visible&&(nearby(greenGrid,x,z).some(r=>inRing(x,z,r))||
   nearby(propGrid,x,z).some(([px,pz,r])=>r>2&&Math.hypot(px-x,pz-z)<r));},
  ownsFurniture(x,z){return root.visible&&(this.walkSurface(x,z)!==null||
   nearby(propGrid,x,z).some(([px,pz,r])=>r<=2&&Math.hypot(px-x,pz-z)<r));},
  update(x,z,altitude,selectedId=null,quality=2){
   if(disposed)return;
   lastAltitude=altitude;lastQuality=quality;focusX=x;focusZ=z;
   const key=[Math.round(x/6),Math.round(z/6),Math.round(altitude/12),selectedId,quality].join('/');
   const now=performance.now();
   if(key===lastKey&&now-lastCheck<2500)return;
   lastKey=key;lastCheck=now;
   for(const item of loaded.values())item.setDensity(altitude,quality);
   chooseLights();
   const nearest=new Map();
   for(const place of places){
    const id=modelId(place.id),distance=Math.hypot(x-place.x,z-place.z);
    // Longer structures need a window along their full extent.
    const reach=id==='castle'?700:id==='pantalan'?950:place.region==='marjal'||place.region==='palancia'||place.region==='almarda'?430:260;
    const selected=place.id===selectedId;
    const inVisitView=selected&&distance<reach*1.65&&altitude<Math.max(1600,reach*5);
    if(!inVisitView&&(distance>reach*(loaded.has(id)?1.18:1)||altitude>reach*(loaded.has(id)?1.32:1.14)))continue;
    const score=distance/(loaded.has(id)?1.18:1)-(selectedId===place.id?reach:0);
    nearest.set(id,Math.min(nearest.get(id)??Infinity,score));
   }
   const limit=mobile?1:quality===2?maxLocalHeritage:2;
   desired=[...nearest].sort((a,b)=>a[1]-b[1]).slice(0,limit).map(([id])=>id);
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
   chooseLights();
   return true;
  },
  clear,dispose(){if(disposed)return;disposed=true;background?.dispose();clear();roadMasks.dispose();for(const group of low.values())releaseModel(group);root.removeFromParent();}
 };
}
