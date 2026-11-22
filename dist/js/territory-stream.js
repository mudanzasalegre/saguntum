import * as T from 'three';
import {insideRing} from './territory-coordinates.js';
import {territoryBase} from './territory-ground.js';
import {nearFacades} from './territory-facades.js';

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
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide});
  mat.onBeforeCompile=s=>{
    s.uniforms.uNight=night;
    s.vertexShader='varying vec2 vFacade; varying float vRange;\n'+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvFacade=uv;vRange=-mvPosition.z;');
    s.fragmentShader='uniform float uNight; varying vec2 vFacade; varying float vRange;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float detail=1.0-smoothstep(140.0,410.0,vRange);
      vec2 pane=fract(vFacade);
      float win=step(.26,pane.x)*step(pane.x,.72)*step(.31,pane.y)*step(pane.y,.78)*step(0.0,vFacade.x)*step(.01,vFacade.y);
      float shutter=step(.52,fract(floor(vFacade.x)*.618+floor(vFacade.y)*.37));
      diffuseColor.rgb*=1.0-detail*win*mix(.56,.32,shutter);
      float door=step(.08,vFacade.x)*step(vFacade.x,.47)*step(0.0,vFacade.y)*step(vFacade.y,.70);
      float ledge=step(.18,pane.x)*step(pane.x,.80)*step(.27,pane.y)*step(pane.y,.31)*step(.9,vFacade.y);
      diffuseColor.rgb*=1.0-detail*(door*.45+ledge*.19);
      diffuseColor.rgb+=vec3(.035)*detail*win*shutter*step(.50,fract(vFacade.y*24.));
      float lit=step(.53,fract(sin(dot(floor(vFacade),vec2(3.17,4.71)))*136.49))*win;
    `).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.0,.58,.22)*lit*uNight*detail*.85;');
  };
  mat.defines={USE_UV:''};
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
    for(const [name,n] of [['position',3],['color',3],['uv',2]])g.setAttribute(name,new T.BufferAttribute(data[name],n));
    g.setIndex(new T.BufferAttribute(data.index.slice(),1));g.computeVertexNormals();g.computeBoundingSphere();
    const m=new T.Mesh(g,mat);m.receiveShadow=true;m.castShadow=true;group.add(m);
    return {id,mesh:m,rows:data.rows,indices:data.index,mask:null};
  }
  let overview=null;
  const stream=new SectorStream(world.sectors,async s=>mesh(await read(s.id,s.url),s.id),v=>{
    group.remove(v.mesh);v.mesh.geometry.dispose();
  },2);
  let maskStamp=0, visibleKey='';
  function mask(v,far=false){
    if(!v)return;
    const stamp=String(maskStamp)+(far?visibleKey:'');
    if(stamp===v.mask)return;
    const attr=v.mesh.geometry.index,idx=attr.array;let count=0;
    for(const r of v.rows){
      if((far&&stream.live.has(r.sector))||heritage.isReplaced(r.id,r.x,r.z))continue;
      idx.set(v.indices.subarray(r.start,r.end),count);count+=r.end-r.start;
    }
    v.mesh.geometry.setDrawRange(0,count);attr.needsUpdate=true;v.mask=stamp;
  }
  const ready=world.overview ? read('overview',world.overview).then(d=>{overview=mesh(d,'overview');overview.mesh.castShadow=false;}) : Promise.resolve();
  const facades=nearFacades(group);
  scene.add(group);
  return {group,stream,ready,night,changed(){maskStamp++;},
    update(x,z,alt,budget){
      const radius=alt>2200?0:(budget===0?650:budget===1?1000:1450);
      stream.update(x,z,radius,alt>2200?0:[12,24,42][budget]);
      visibleKey=Array.from(stream.live.keys()).join(',');
      mask(overview,true);for(const v of stream.live.values())mask(v);
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
