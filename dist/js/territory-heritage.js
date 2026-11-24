import * as THREE from 'three';
import {loadHeritageCatalog} from './territory-heritage-catalog.js';
import {buildHeritageModel,inRing,maskRing,modelId,normalizeBuildingId,overlapsRegisteredFootprint,releaseModel,warmHeritageModel} from './territory-heritage-models.js';
import {overviewModels} from './territory-heritage-overview.js';
import {heritageWorker} from './territory-heritage-loader.js';
import {dressHeritageSurfaces} from './territory-heritage-surface.js';
import {heightOnPavement} from './territory-heritage-paving.js';
import {atlasRoadMasks,maxLocalHeritage} from './territory-heritage-roadmask.js';
import {bindHeritageVisit} from './territory-heritage-visit.js';
import {sectionWindow} from './territory-heritage-section.js';
import {heritageWindow} from './territory-stream-policy.js';
import {sampleHeritageBarriers} from './territory-collision-heritage.js';
import {reliefDelta} from './territory-heritage-relief.js';

export async function createHeritage({scene,renderer,heightAt,project,grids,mobile=false,onChange=()=>{},onError=console.warn}){
 const inventory=await loadHeritageCatalog(project);
 const {places}=inventory,byId=new Map(places.map(p=>[p.id,p]));
 const root=new THREE.Group();root.name='Patrimonio del atlas';
 const atlasLighting={value:1};
 const options={...inventory,heightAt,project};
 const low=overviewModels(options),loaded=new Map(),failedUntil=new Map();
 const extents=new Map();
 for(const place of places){
  const record=inventory.records[place.id],id=modelId(place.id);
  const footprints=Array.isArray(record.footprints)?record.footprints:[record.footprint].filter(Boolean);
  const rings=footprints.map(p=>maskRing((p.coordinates||p).map(ll=>project(...ll)))).filter(Boolean);
  if(!extents.has(id))extents.set(id,[...low.get(id)?.userData.claims||[]]);
  extents.get(id).push(...rings);
 }
 function distanceToSite(id,x,z,anchorDistance){
  let best=anchorDistance;
  for(const ring of extents.get(id)){
   if(x<ring.left-best||x>ring.right+best||z<ring.top-best||z>ring.bottom+best)continue;
   if(inRing(x,z,ring))return 0;
   for(let i=0,j=ring.points.length-1;i<ring.points.length;j=i++){
    const a=ring.points[j],b=ring.points[i],dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
    best=Math.min(best,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
   }
  }
  return best;
 }
 let background=null,workerRequest=null;
 for(const [id,group] of low){group.name='Silueta territorial · '+id;root.add(group);}
 scene.add(root);
 let desired=[],pending=false,disposed=false,historical=null,lastKey='',lastCheck=-Infinity;
 let requestedStop=null,nearNative=new Set();
 const prefetched=new Map();let warming=0;
 let lastAltitude=0,lastQuality=0,focusX=0,focusZ=0;
 let status={requested:[],loaded:[],loading:false,failures:{}};
 const claimIds=new Set(),claimGrid=new Map(),registeredGrid=new Map(),propGrid=new Map(),greenGrid=new Map(),cell=64;
 const roadMasks=atlasRoadMasks();
 const excavation=sectionWindow();
 let activeBarriers=null;
 const emptyBarriers=[];
 function walkingBarriers(){
  if(!root.visible)return emptyBarriers;
  if(activeBarriers)return activeBarriers;
  activeBarriers=[];
  for(const [id,item] of loaded){
   const phase=historical===id?'historic':requestedStop?.model===id&&item.setVisitStop?requestedStop.stop:null;
   if(!phase){if(item.walkBarriers?.length)activeBarriers.push(item.walkBarriers);continue;}
   // Only a walker entering this presentation incurs the extra section pass.
   if(item.barrierPhase!==phase){
    const deck=id===historical?null:item.publicDeck;
    item.otherBarriers=sampleHeritageBarriers(item.group,(x,z)=>heightOnPavement(deck,x,z)??heightOnPavement(item.pavement,x,z)??(heightAt(x,z)+reliefDelta(item.relief,x,z)));
    item.barrierPhase=phase;
   }
   if(item.otherBarriers.length)activeBarriers.push(item.otherBarriers);
  }
  return activeBarriers;
 }
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
  claimGrid.clear();registeredGrid.clear();claimIds.clear();propGrid.clear();greenGrid.clear();
  const claims=[...loaded.values()].flatMap(m=>m.claims);
  for(const [id,mesh] of low)if(!loaded.has(id))claims.push({ids:[],rings:mesh.userData.claims});
  for(const claim of claims){
   for(const id of claim.ids)claimIds.add(id);
   for(const ring of claim.rings||[]){
    index(claimGrid,ring,ring.left,ring.top,ring.right,ring.bottom);
    if(ring.registered)index(registeredGrid,ring,ring.left,ring.top,ring.right,ring.bottom);
   }
   for(const ring of claim.green||[])index(greenGrid,ring,ring.left,ring.top,ring.right,ring.bottom);
   for(const pt of claim.props||[])index(propGrid,pt,pt[0]-pt[2],pt[1]-pt[2],pt[0]+pt[2],pt[1]+pt[2]);
  }
  roadMasks.update(root.visible?[...loaded.values()]:[]);
 }
 indexClaims();
 function notify(){
  activeBarriers=null;
  excavation.set(status.visit?.contextCut);
  for(const [id,item] of loaded)item.sectionOccluder.value=requestedStop?.model===id?0:1;
  indexClaims();
  status.loaded=[...loaded.keys()];status.requested=desired.slice();status.loading=pending;
  status.levels=Object.fromEntries([...loaded].map(([id,item])=>[id,item.setVisitStop?'patrimonial':'urbano']));
  status.contexts=[...loaded.values()].map(m=>m.contextStats).filter(Boolean);
  status.landscapes=Object.fromEntries([...loaded].filter(([,m])=>m.density.total).map(([id,m])=>[id,m.density]));
  chooseLights();
  onChange();
 }
 function needsNative(id){return requestedStop?.model===id||nearNative.has(id)||!!inventory.records[id]?.scene;}
 function missing(id){return !loaded.has(id)||(needsNative(id)&&!loaded.get(id).setVisitStop);}
 function showStop(id,item){
  if(requestedStop?.model===id){
   const {place,stop,presentation}=requestedStop;
   if(item.setVisitStop)status.visit=item.setVisitStop(place,stop,presentation);
   else item.setHistorical(historical===id);
  }else item.setHistorical(historical===id);
 }
 async function schedule(){
  if(pending||disposed)return;
  pending=true;status.loading=true;status.requested=desired.slice();
  try{
   let id;
   while(!disposed&&(id=desired.find(k=>missing(k)&&!(failedUntil.get(k)>performance.now())))){
    // Permit the terrain/camera frame to paint before constructing the next
    // detailed site. No region-wide Three scene is ever constructed here.
    await new Promise(resolve=>setTimeout(resolve,16));
    const needed=()=>!disposed&&desired.includes(id);
    if(!needed())continue;
    let item;
    try{
     if(id!=='glorieta'&&!needsNative(id)&&!background&&grids)background=heritageWorker(grids);
     if(id!=='glorieta'&&!needsNative(id)&&background&&!background.closed){
      const worker=background;workerRequest=id;
      try{item=await worker.load(id);}
      catch(error){
       if(!needed()||worker!==background&&!needsNative(id))continue;
       if(worker===background)onError(new Error('Patrimonio en primer plano · '+id+' · '+error.message));
      }finally{workerRequest=null;}
     }
     // A completed worker model is a useful bridge while the source
     // constructor prepares the interactive version. Swap atomically below;
     // missing(id) will request the native model on the next pass.
     if(!item&&needed())item=await buildHeritageModel(id,{...options,needed,renderer,bindVisit:bindHeritageVisit});
     if(!item)continue;
     if(!needed()){item.disposeVisit?.();releaseModel(item.group);continue;}
     dressHeritageSurfaces(item.group,atlasLighting);
     item.sectionOccluder=excavation.model(item);
     item.group.updateWorldMatrix(true,true);item.lamps=[];
     item.group.traverse(o=>{if(o.isPointLight)item.lamps.push(o);});
     item.density=item.setDensity(lastAltitude,lastQuality,focusX,focusZ);
     showStop(id,item);
     const visit=status.visit;
     // Keep the current representation and its parcel masks until the new
     // model and materials are ready, then swap them in the same frame.
     remove(id);
     root.add(item.group);loaded.set(id,item);
     if(low.has(id))low.get(id).visible=false;
     status.visit=visit;
     delete status.failures[id];notify();
    }catch(error){
     if(item&&loaded.get(id)!==item){item.disposeVisit?.();releaseModel(item.group);}
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
  if(requestedStop?.model===id)status.visit=null;
  loaded.delete(id);item.disposeVisit?.();releaseModel(item.group);
  if(low.has(id))low.get(id).visible=true;
 }
 function clear(){
  desired=[];nearNative.clear();historical=null;requestedStop=null;status.visit=null;lastKey='';
  for(const id of [...loaded.keys()])remove(id);
  notify();
 }
 return {places,group:root,get stats(){return status;},get relief(){return root.visible?[...loaded.values()].map(item=>item.relief):[];},
  get walkBarriers(){return walkingBarriers();},
  animateGlorieta(time,water,night){loaded.get('glorieta')?.animate?.(time,water,night);},
  maskRoadMaterial(material,ground=false){roadMasks.apply(material,ground);if(!ground)excavation.material(material);},
  setAtlasLighting(enabled){atlasLighting.value=enabled?1:0;},
  setVisitStop(place,stop,anchor,presentation={}){
   const record=byId.get(place);
   if(requestedStop?.place===place&&requestedStop.stop===stop)return;
   const previous=requestedStop?.model;
   requestedStop=record&&stop?{place,stop,model:modelId(place),anchor:anchor||record,presentation}:null;
   status.visit=null;lastKey='';
   if(previous)loaded.get(previous)?.setVisitStop?.(null,null);
   if(historical)loaded.get(historical)?.setHistorical(false);
   historical=null;
   const id=requestedStop?.model;
   if(id){
    if(workerRequest&&!loaded.get(id)?.setVisitStop){
     background?.dispose();background=null;
    }
    const item=loaded.get(id);
    if(item?.setVisitStop)showStop(id,item);
    else failedUntil.delete(id);
   }
   notify();
   if(id&&desired.includes(id)&&missing(id))void schedule();
  },
  publicDeckAt(x,z){
   let height=null;
   if(root.visible)for(const [id,item] of loaded)if(id!==historical){
    const h=heightOnPavement(item.publicDeck,x,z);if(h!==null&&(height===null||h>height))height=h;
   }
   return height;
  },
  walkSurface(x,z){
   let height=this.publicDeckAt(x,z);
   if(root.visible)for(const {pavement} of loaded.values()){
    const h=heightOnPavement(pavement,x,z);if(h!==null&&(height===null||h>height))height=h;
   }
   return height;
  },
  ownsVegetation(x,z){return root.visible&&(nearby(greenGrid,x,z).some(r=>inRing(x,z,r))||
   nearby(propGrid,x,z).some(([px,pz,r])=>r>2&&Math.hypot(px-x,pz-z)<r));},
  ownsFurniture(x,z){return root.visible&&(this.walkSurface(x,z)!==null||
   nearby(propGrid,x,z).some(([px,pz,r])=>r<=2&&Math.hypot(px-x,pz-z)<r));},
  update(x,z,altitude,selectedId=null,quality=2,hint=null){
   if(disposed)return;
   lastAltitude=altitude;lastQuality=quality;focusX=x;focusZ=z;
   const key=[Math.round(x/6),Math.round(z/6),Math.round(altitude/12),selectedId,quality,hint?Math.round(hint.x/45):'',hint?Math.round(hint.z/45):''].join('/');
   const now=performance.now();
   if(key===lastKey&&now-lastCheck<2500)return;
   lastKey=key;lastCheck=now;
   for(const item of loaded.values())item.setDensity(altitude,quality,x,z);
   chooseLights();
   const nearest=new Map(),native=new Set(),warmQueue=new Map();
   for(const place of places){
    const id=modelId(place.id),distance=distanceToSite(id,x,z,Math.hypot(x-place.x,z-place.z));
    // Longer structures need a window along their full extent.
    const reach=place.scene?.preloadDistance??(id==='castle'?700:id==='pantalan'?950:place.region==='marjal'||place.region==='palancia'||place.region==='almarda'?430:260);
    const selected=place.id===selectedId;
    const anchor=requestedStop?.anchor;
    const stopDistance=requestedStop?.model===id&&anchor?Math.hypot(x-anchor.x,z-anchor.z):Infinity;
    const stopInView=stopDistance<Math.max(350,reach*1.65,altitude*.9)&&altitude<Math.max(4200,reach*7);
    const ahead=hint?distanceToSite(id,hint.x,hint.z,Math.hypot(hint.x-place.x,hint.z-place.z)):Infinity;
    const policy=heritageWindow({distance,ahead,range:altitude,reach,close:place.scene?.nativeDistance??100,loaded:loaded.has(id),native:nearNative.has(id),selected,stop:stopInView,quality,mobile});
    if(policy.warm&&!loaded.has(id)&&!(prefetched.get(id)>now))warmQueue.set(id,Math.min(warmQueue.get(id)??Infinity,policy.score));
    if(!policy.visible)continue;
    if(policy.full)native.add(id);
    if(place.scene&&!policy.full&&!loaded.has(id))continue;
    nearest.set(id,Math.min(nearest.get(id)??Infinity,policy.score));
   }
   // Bound speculative I/O independently from live mesh slots. The actual
   // requested visit remains first in the construction queue.
   for(const [id] of [...warmQueue].sort((a,b)=>a[1]-b[1])){
    if(warming>=(mobile?1:2))break;
    prefetched.set(id,now+45000);warming++;
    void warmHeritageModel(id,inventory.records).catch(()=>prefetched.delete(id)).finally(()=>warming--);
   }
   status.warming=warming;
   nearNative=native;
   const limit=mobile?1:quality===2?maxLocalHeritage:2;
   desired=[...nearest].sort((a,b)=>a[1]-b[1]).slice(0,limit).map(([id])=>id);
   const expired=[...loaded.keys()].filter(id=>!desired.includes(id));
   for(const id of expired)remove(id);
   if(expired.length)notify();
   if(desired.some(missing))void schedule();
  },
  isReplaced(sourceId,x,z,rings){
   if(!root.visible)return false;
   if(excavation.contains(x,z))return true;
   if(claimIds.has(normalizeBuildingId(sourceId)))return true;
   if(nearby(claimGrid,x,z).some(ring=>(!ring.registered||!rings?.length)&&inRing(x,z,ring)))return true;
   if(!registeredGrid.size||!rings?.[0]?.length)return false;
   const xs=rings[0].map(p=>p[0]),zs=rings[0].map(p=>p[1]),candidates=new Set();
   for(let iz=Math.floor(Math.min(...zs)/cell);iz<=Math.floor(Math.max(...zs)/cell);iz++){
    for(let ix=Math.floor(Math.min(...xs)/cell);ix<=Math.floor(Math.max(...xs)/cell);ix++)
     for(const ring of registeredGrid.get(ix+','+iz)||[])candidates.add(ring);
   }
   return [...candidates].some(claim=>overlapsRegisteredFootprint(rings,claim));
  },
  setHistorical(id,enabled=true){
   const place=byId.get(id);
   if(enabled&&!place?.historical?.inWorld)return false;
   if(historical)loaded.get(historical)?.setHistorical(false);
   historical=enabled?modelId(id):null;
   if(historical)loaded.get(historical)?.setHistorical(true);
   activeBarriers=null;
   chooseLights();
   return true;
  },
  clear,dispose(){if(disposed)return;disposed=true;background?.dispose();clear();roadMasks.dispose();for(const group of low.values())releaseModel(group);root.removeFromParent();}
 };
}
