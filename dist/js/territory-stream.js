import * as T from 'three';
import {MetricGrid} from './urban-surface.js';
import {footprintGrid,indexBounds,nearCell,touchesFootprint} from './territory-collision.js';
import {territoryBase} from './territory-ground.js';
import {nearFacades} from './territory-facades.js';
import {architecturalMaterial,skylineMaterial} from './territory-building-material.js';
import {selectSectors} from './territory-stream-policy.js';
import {facadeChunks,planChunks,detailLimits,detailBytes} from './territory-local-detail.js';

export const distanceTo=(x,z,[l,t,r,b])=>Math.hypot(Math.max(l-x,0,x-r),Math.max(t-z,0,z-b));
export class SectorStream {
  constructor(index,load,drop,limit=3){
    this.index=index;this.load=load;this.drop=drop;this.limit=limit;
    this.live=new Map();this.pending=new Set();this.retry=new Map();this.wanted=new Set();
  }
  dispose(){
    this.wanted.clear();
    for(const v of this.live.values())this.drop(v);
    this.live.clear();this.retry.clear();
  }
  update(x,z,radius,max,hint=null){
    const candidates=selectSectors(this.index,x,z,radius,max,this.live,hint);
    this.wanted=new Set(candidates.map(([s])=>s.id));
    for(const [id,v] of this.live)if(!this.wanted.has(id)){this.drop(v);this.live.delete(id);}
    for(const [s] of candidates){
      if(this.pending.size>=this.limit)break;
      if(this.live.has(s.id)||this.pending.has(s.id)||performance.now()<(this.retry.get(s.id)||0))continue;
      this.pending.add(s.id);
      Promise.resolve().then(()=>this.load(s)).then(v=>{
        if(this.wanted.has(s.id))this.live.set(s.id,v);else this.drop(v);
        this.retry.delete(s.id);
      }).catch(e=>{console.warn('Sector',s.id,e);this.retry.set(s.id,performance.now()+12000);})
        .finally(()=>this.pending.delete(s.id));
    }
  }
}
export function createBuildings({scene,world,grids,heritage,photography}) {
  const group=new T.Group(), requests=new Map();
  let closed=false;
  const compact=matchMedia('(pointer: coarse)').matches||(navigator.deviceMemory||8)<=4;
  const night={value:0};
  let mat,shadowRevision=0;
  const aerialMat=skylineMaterial(photography);
  const worker=new Worker(new URL('./territory-building-worker.js',import.meta.url),{type:'module'});
  worker.postMessage({grids});
  worker.onmessage=({data})=>{
    const waiter=requests.get(data.key);if(!waiter)return;
    requests.delete(data.key);if(data.error)waiter.reject(Error(data.error));else waiter.resolve(data.result);
  };
  worker.onerror=e=>{for(const waiter of requests.values())waiter.reject(Error(e.message));requests.clear();};
  function read(key,url) {
    if(closed)return Promise.reject(Error('Sesión territorial cerrada'));
    return new Promise((resolve,reject)=>{
      requests.set(key,{resolve,reject});worker.postMessage({key,url:new URL(territoryBase+url,document.baseURI).href});
    });
  }
  function mesh(data,id,visible=true) {
    const g=new T.BufferGeometry();
    const far=Boolean(data.normal);
    const attributes=far?[['position',3],['color',3],['normal',3]]:[['position',3],['color',3],['uv',2],['archMetric',4],['archData',4]];
    for(const [name,n] of attributes)g.setAttribute(name,new T.BufferAttribute(data[name],n,far&&name!=='position'));
    g.setIndex(new T.BufferAttribute(data.index.slice(),1));
    if(!far)g.computeVertexNormals();
    g.computeBoundingSphere();
    const m=new T.Mesh(g,far?aerialMat:(mat??=architecturalMaterial(night,photography)));
    m.receiveShadow=true;m.castShadow=true;m.visible=visible;group.add(m);
    return {id,mesh:m,rows:data.rows,indices:data.index,mask:null,
      sectors:far||id==='overview'?[...new Set(data.rows.map(r=>r.sector))]:null};
  }
  const overview=[];
  const aerialStats={parts:0,chunks:0,packages:[],complete:false,fallback:false,failures:[]};
  const sectorGrid=new MetricGrid(500);
  for(const sector of world.sectors)indexBounds(sectorGrid,sector,sector.geometryBounds||sector.bounds);
  const stream=new SectorStream(world.sectors,async s=>{
    const tile=mesh(await read(s.id,s.url),s.id,false);
    tile.footprints=footprintGrid(tile.rows);tile.detailChunks=facadeChunks(s.id,tile.rows);
    return tile;
  },v=>{
    group.remove(v.mesh);v.mesh.geometry.dispose();shadowRevision++;
  },2);
  let maskStamp=0,detailRevision=0,detailIds=new Set(),active=new Set(),desired=new Map(),busy=false,incoming=null;
  let cacheBytes=0,byteLimit=9*1048576,sourceKey='',hits=0,builds=0,evictions=0,refused=0,peakBytes=0;
  const cache=new Map(),retryDetail=new Map();
  function mask(v,far=false){
    if(!v)return;
    const stamp=String(maskStamp)+'|'+(far?v.sectors.filter(id=>stream.live.has(id)).join(','):v.detail?'detail':detailRevision);
    if(stamp===v.mask)return;
    const attr=v.mesh.geometry.index,idx=attr.array;let count=0;
    for(const r of v.rows){
      if((far&&stream.live.has(r.sector))||(!far&&!v.detail&&detailIds.has(r.id))||heritage.isReplaced(r.id,r.x,r.z,r.rings))continue;
      idx.set(v.indices.subarray(r.start,r.end),count);count+=r.end-r.start;
    }
    v.mesh.geometry.setDrawRange(0,count);
    if(count!==v.indices.length||v.mask!==null)attr.needsUpdate=true;
    v.mask=stamp;
  }
  function evict(key){
    const item=cache.get(key);if(!item)return;
    cache.delete(key);cacheBytes-=item.bytes;group.remove(item.tile.mesh);item.tile.mesh.geometry.dispose();evictions++;
  }
  function trim(reserve=0){
    const candidates=[...cache.entries()].filter(([k])=>!desired.has(k)).sort((a,b)=>a[1].used-b[1].used);
    for(const [key] of candidates){if(cacheBytes+reserve<=byteLimit&&cache.size<48)break;evict(key);}
    return cacheBytes+reserve<=byteLimit&&cache.size<48;
  }
  function publishDetails(){
    const ids=new Set(),next=new Set();
    for(const [key,g] of desired){
      const item=cache.get(key);
      if(!item||!stream.live.has(g.sector))continue;
      item.used=performance.now();item.shown=true;next.add(key);
      for(const r of item.tile.rows)ids.add(r.id);
    }
    for(const [key,item] of cache){
      item.tile.mesh.visible=next.has(key);
      if(next.has(key))mask(item.tile);
    }
    const changed=next.size!==active.size||[...next].some(k=>!active.has(k));
    active=next;detailIds=ids;if(changed){detailRevision++;shadowRevision++;}
  }
  function updateDetail(x,z,range,budget,view){
    byteLimit=detailLimits(budget,range,compact).bytes;
    const groups=[];
    for(const tile of stream.live.values())groups.push(...tile.detailChunks);
    for(const [key,item] of cache)if(!stream.live.has(item.sector))evict(key);
    const selected=planChunks(groups,x,z,range,budget,compact,view,active);
    desired=new Map(selected.map(g=>[g.key,g]));
    trim();
    if(cacheBytes>byteLimit)for(const g of [...selected].reverse()){
      if(cacheBytes<=byteLimit)break;evict(g.key);
    }
    const now=performance.now();
    // Commit worker replies only during this update, together with the base
    // mesh masks. Higher-priority desired detail may evict a lower-priority
    // batch without a rendered frame in which neither representation exists.
    if(incoming){
      const {chunk,data,bytes}=incoming;incoming=null;
      if(stream.live.has(chunk.sector)){
        let fits=bytes<=byteLimit&&trim(bytes);
        const rank=selected.findIndex(g=>g.key===chunk.key);
        if(!fits&&bytes<=byteLimit&&rank>=0){
          for(const lower of selected.slice(rank+1).reverse()){
            evict(lower.key);if(trim(bytes)){fits=true;break;}
          }
        }
        if(fits){
          const tile=mesh(data,chunk.key,false);tile.detail=true;
          cache.set(chunk.key,{tile,sector:chunk.sector,bytes,used:now,openings:data.openings||0,shown:false});
          cacheBytes+=bytes;peakBytes=Math.max(peakBytes,cacheBytes);builds++;
        }else if(rank>=0){refused++;retryDetail.set(chunk.key,now+12000);}
      }
    }
    for(const [key,until] of retryDetail)if(until<=now||!stream.live.has(key.split('/')[0]))retryDetail.delete(key);
    for(const [key] of desired)if(cache.get(key)?.shown&&!active.has(key))hits++;
    publishDetails();
    if(busy||incoming)return;
    const next=selected.find(g=>!cache.has(g.key)&&!(retryDetail.get(g.key)>now));
    if(!next)return;
    busy=true;
    const request='close-elevations';
    new Promise((resolve,reject)=>{
      requests.set(request,{resolve,reject});
      worker.postMessage({key:request,selected:[[next.sector,next.ids]]});
    }).then(data=>{
      // Keep useful replies across turns, but never publish over an unloaded
      // source tile or exceed the local typed-array budget.
      if(!stream.live.has(next.sector))return;
      if(!data.rows.length){retryDetail.set(next.key,performance.now()+45000);return;}
      const bytes=detailBytes(data);
      if(bytes>byteLimit){refused++;retryDetail.set(next.key,performance.now()+12000);return;}
      incoming={chunk:next,data,bytes};
    }).catch(error=>{
      retryDetail.set(next.key,performance.now()+12000);
      console.warn('Detalle de fachadas',error);
    }).finally(()=>{busy=false;});
  }
  async function aerial(name){
    const chunks=await read('aerial-'+name,'aerial-buildings/'+name+'.bin');
    for(const data of chunks){
      const layer=mesh(data,'aerial-'+name);
      mask(layer,true);overview.push(layer);
      aerialStats.parts+=data.rows.length;
    }
    aerialStats.chunks+=chunks.length;aerialStats.packages.push(name);
  }
  async function startAerial(){
    if(typeof DecompressionStream!=='undefined'){
      try{
        await aerial('skyline');
        // The first frame only waits for the compact city-wide skyline. Load the
        // remaining town silhouettes between frames, before far facade detail.
        void (async()=>{
          for(const name of ['sagunto','puerto','municipio']){
            await new Promise(resolve=>setTimeout(resolve,100));
            try{await aerial(name);}catch(error){aerialStats.failures.push(name);console.warn('Silueta territorial',name,error);}
          }
          aerialStats.complete=aerialStats.failures.length===0;
        })();
        return;
      }catch(error){console.warn('Silueta territorial',error);}
    }
    if(world.overview){
      const legacy=mesh(await read('overview',world.overview),'overview');
      overview.push(legacy);
      aerialStats.parts=legacy.rows.length;aerialStats.chunks=1;aerialStats.fallback=true;
      aerialStats.packages.push('overview');aerialStats.complete=true;
    }
  }
  const ready=startAerial();
  const facades=nearFacades(group);
  scene.add(group);
  return {group,stream,ready,night,get aerialStats(){return aerialStats;},get shadowRevision(){return shadowRevision;},get fabricStats(){return {buildings:detailIds.size,openings:[...active].reduce((n,k)=>n+(cache.get(k)?.openings||0),0),loading:busy||!!incoming,stagedBytes:incoming?.bytes||0,chunks:active.size,cached:cache.size,bytes:cacheBytes,byteLimit,peakBytes,hits,builds,evictions,refused};},changed(){maskStamp++;shadowRevision++;},
    get workerStats(){return {active:!closed,pending:requests.size};},
    dispose(){
      if(closed)return;
      closed=true;worker.terminate();
      for(const item of requests.values())item.reject(Error('Sesión territorial cerrada'));
      requests.clear();stream.dispose();
      for(const key of [...cache.keys()])evict(key);
      incoming=null;
      const materials=new Set();
      group.traverse(o=>{o.geometry?.dispose();if(o.isInstancedMesh)o.dispose();if(o.material)materials.add(o.material);});
      for(const material of materials)material.dispose();
      group.removeFromParent();
    },
    update(x,z,alt,budget,hint=null,view=null,peripheral=budget){
      const radius=alt>2200?0:(peripheral===0?650:peripheral===1?1050:1500);
      stream.update(x,z,radius,alt>2200?0:[12,24,42][peripheral],hint);
      const retained=[...new Set([...stream.live.keys(),...stream.pending])].sort(),key=retained.join('/');
      if(key!==sourceKey){sourceKey=key;worker.postMessage({retain:retained});}
      updateDetail(x,z,alt,budget,view);
      for(const v of overview)mask(v,true);
      for(const v of stream.live.values()){mask(v);if(!v.mesh.visible){v.mesh.visible=true;shadowRevision++;}}
      facades(x,z,alt,budget,stream.live,r=>!heritage.isReplaced(r.id,r.x,r.z,r.rings),maskStamp,view);
    },
    safeToWalk(x,z,radius=.32){
      return !nearCell(sectorGrid,x,z,radius,sector=>{
        if(distanceTo(x,z,sector.geometryBounds||sector.bounds)>radius)return false;
        const tile=stream.live.get(sector.id);
        // Surveyed footprints may straddle the tile edge. Wait for every
        // overlapping sector before certifying the pedestrian's full width.
        return !tile||nearCell(tile.footprints,x,z,radius,row=>
          distanceTo(x,z,row.bounds)<=radius&&touchesFootprint(x,z,radius,row.rings)&&
          !heritage.isReplaced(row.id,row.x,row.z,row.rings));
      });
    }
  };
}
