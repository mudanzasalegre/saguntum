import * as T from 'three';
import {insideRing} from './territory-coordinates.js';
import {territoryBase} from './territory-ground.js';
import {nearFacades} from './territory-facades.js';
import {architecturalMaterial} from './territory-building-material.js';

export const distanceTo=(x,z,[l,t,r,b])=>Math.hypot(Math.max(l-x,0,x-r),Math.max(t-z,0,z-b));
export class SectorStream {
  constructor(index,load,drop,limit=3){
    this.index=index;this.load=load;this.drop=drop;this.limit=limit;
    this.live=new Map();this.pending=new Set();this.retry=new Map();this.wanted=new Set();
  }
  update(x,z,radius,max){
    const candidates=this.index.map(s=>[s,distanceTo(x,z,s.geometryBounds||s.bounds)])
      .filter(([,d])=>d<=radius).sort((a,b)=>a[1]-b[1]).slice(0,max);
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
export function createBuildings({scene,world,grids,heritage}) {
  const group=new T.Group(), requests=new Map();
  const night={value:0};
  let mat;
  const aerialMat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  const worker=new Worker(new URL('./territory-building-worker.js',import.meta.url),{type:'module'});
  worker.postMessage({grids});
  worker.onmessage=({data})=>{
    const waiter=requests.get(data.key);if(!waiter)return;
    requests.delete(data.key);if(data.error)waiter.reject(Error(data.error));else waiter.resolve(data.result);
  };
  worker.onerror=e=>{for(const waiter of requests.values())waiter.reject(Error(e.message));requests.clear();};
  function read(key,url) {
    return new Promise((resolve,reject)=>{
      requests.set(key,{resolve,reject});worker.postMessage({key,url:new URL(territoryBase+url,document.baseURI).href});
    });
  }
  function mesh(data,id) {
    const g=new T.BufferGeometry();
    const far=Boolean(data.normal);
    const attributes=far?[['position',3],['color',3],['normal',3]]:[['position',3],['color',3],['uv',2],['archMetric',4],['archData',4]];
    for(const [name,n] of attributes)g.setAttribute(name,new T.BufferAttribute(data[name],n,far&&name!=='position'));
    g.setIndex(new T.BufferAttribute(data.index.slice(),1));
    if(!far)g.computeVertexNormals();
    g.computeBoundingSphere();
    const m=new T.Mesh(g,far?aerialMat:(mat??=architecturalMaterial(night)));
    m.receiveShadow=true;m.castShadow=true;group.add(m);
    return {id,mesh:m,rows:data.rows,indices:data.index,mask:null,
      sectors:far||id==='overview'?[...new Set(data.rows.map(r=>r.sector))]:null};
  }
  const overview=[];
  const aerialStats={parts:0,chunks:0,packages:[],complete:false,fallback:false,failures:[]};
  const stream=new SectorStream(world.sectors,async s=>mesh(await read(s.id,s.url),s.id),v=>{
    group.remove(v.mesh);v.mesh.geometry.dispose();
  },2);
  let maskStamp=0,shell=null,shellIds=new Set(),shellRevision=0,shellSelection='',shellWanted='',shellBusy=false,openings=0;
  function mask(v,far=false){
    if(!v)return;
    const stamp=String(maskStamp)+'|'+(far?v.sectors.filter(id=>stream.live.has(id)).join(','):shellRevision);
    if(stamp===v.mask)return;
    const attr=v.mesh.geometry.index,idx=attr.array;let count=0;
    for(const r of v.rows){
      if((far&&stream.live.has(r.sector))||(!far&&v!==shell&&shellIds.has(r.id))||heritage.isReplaced(r.id,r.x,r.z))continue;
      idx.set(v.indices.subarray(r.start,r.end),count);count+=r.end-r.start;
    }
    v.mesh.geometry.setDrawRange(0,count);
    if(count!==v.indices.length||v.mask!==null)attr.needsUpdate=true;
    v.mask=stamp;
  }
  function removeShell(){
    if(!shell)return;
    group.remove(shell.mesh);shell.mesh.geometry.dispose();shell=null;shellIds=new Set();openings=0;shellRevision++;
  }
  function updateShell(x,z,alt,budget){
    const reach=[19,32,49][budget],movingKey=[Math.floor(x/7),Math.floor(z/7),budget,alt>125,[...stream.live.keys()].join(','),maskStamp].join('/');
    if(movingKey===shellSelection&&!shellBusy)return;
    shellSelection=movingKey;
    const candidates=[];
    if(alt<125)for(const [sector,tile] of stream.live)for(const r of tile.rows){
      const d=distanceTo(x,z,r.bounds);
      if(d<=reach&&r.outerEdges.includes(true)&&!heritage.isReplaced(r.id,r.x,r.z))candidates.push({d,id:r.id,sector});
    }
    candidates.sort((a,b)=>a.d-b.d||a.id.localeCompare(b.id));
    const selection=candidates.slice(0,[28,49,72][budget]),key=selection.map(r=>r.id).sort().join('/');
    shellWanted=key;
    if(!key){removeShell();return;}
    if(shell&&!selection.some(r=>shellIds.has(r.id)))removeShell();
    if(shellBusy||shell?.id===key)return;
    const bySector=new Map();
    for(const row of selection){
      if(!bySector.has(row.sector))bySector.set(row.sector,[]);
      bySector.get(row.sector).push(row.id);
    }
    shellBusy=true;
    const request='close-elevations';
    new Promise((resolve,reject)=>{
      requests.set(request,{resolve,reject});
      worker.postMessage({key:request,selected:[...bySector]});
    }).then(data=>{
      if(shellWanted!==key)return;
      removeShell();
      if(!data.rows.length)return;
      shell=mesh(data,key);shellIds=new Set(data.rows.map(r=>r.id));openings=data.openings;shellRevision++;
      mask(shell);for(const tile of stream.live.values())mask(tile);
    }).catch(error=>console.warn('Detalle de fachadas',error)).finally(()=>{
      shellBusy=false;if(shellWanted!==key)shellSelection='';
    });
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
  return {group,stream,ready,night,get aerialStats(){return aerialStats;},get fabricStats(){return {buildings:shellIds.size,openings};},changed(){maskStamp++;},
    update(x,z,alt,budget){
      const radius=alt>2200?0:(budget===0?650:budget===1?1000:1450);
      stream.update(x,z,radius,alt>2200?0:[12,24,42][budget]);
      updateShell(x,z,alt,budget);
      if(shell)mask(shell);
      for(const v of overview)mask(v,true);
      for(const v of stream.live.values())mask(v);
      facades(x,z,alt,budget,stream.live,r=>!heritage.isReplaced(r.id,r.x,r.z),maskStamp);
    },
    safeToWalk(x,z){
      // An unloaded footprint sector cannot certify a clear pedestrian step.
      if(world.sectors.some(s=>distanceTo(x,z,s.geometryBounds||s.bounds)===0&&!stream.live.has(s.id)))return false;
      for(const tile of stream.live.values())for(const r of tile.rows){
        const [l,t,k,b]=r.bounds;if(x<l||x>k||z<t||z>b)continue;
        if(insideRing(x,z,r.rings[0])&&!r.rings.slice(1).some(h=>insideRing(x,z,h)))return false;
      }
      return true;
    }
  };
}
