// Deterministic local-detail planning. Viewing direction only prioritizes
// existing surveyed footprints; it never modifies their positions or heights.
import {boundsDistance,closeFabricBudget} from './territory-stream-policy.js';
export const mib=1048576;
export function viewBucket(view){
 if(!view||Math.hypot(view.dx,view.dz)<.15)return '-';
 return String(Math.round(Math.atan2(view.dz,view.dx)*8/Math.PI));
}
export function localScore(bounds,x,z,view){
 const d=boundsDistance(x,z,bounds);
 if(d<18||!view)return d;
 const vx=(bounds[0]+bounds[2])*.5-view.x,vz=(bounds[1]+bounds[3])*.5-view.z;
 const n=Math.hypot(vx,vz)*Math.hypot(view.dx,view.dz);
 if(n<.001)return d;
 const dot=Math.max(-1,Math.min(1,(vx*view.dx+vz*view.dz)/n));
 return d*(1+Math.min(1,(d-18)/55)*(.32-.48*dot));
}
export function facadeChunks(sector,rows){
 const cells=new Map();
 for(const r of rows){
  if(!r.outerEdges?.includes(true)||!r.bounds?.every(Number.isFinite))continue;
  const x=(r.bounds[0]+r.bounds[2])*.5,z=(r.bounds[1]+r.bounds[3])*.5;
  const key=Math.floor(x/24)+','+Math.floor(z/24);
  if(!cells.has(key))cells.set(key,[]);
  cells.get(key).push(r);
 }
 const groups=[];
 for(const [cell,members] of cells){
  members.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  for(let i=0;i<members.length;i+=6){
   const batch=members.slice(i,i+6),ids=batch.map(r=>r.id);
   const bounds=[Infinity,Infinity,-Infinity,-Infinity];
   let work=0;
   for(const r of batch){
    bounds[0]=Math.min(bounds[0],r.bounds[0]);bounds[1]=Math.min(bounds[1],r.bounds[1]);
    bounds[2]=Math.max(bounds[2],r.bounds[2]);bounds[3]=Math.max(bounds[3],r.bounds[3]);
    work+=Math.max(1,Math.min(220,Math.ceil(Math.max(1,r.eaves-r.floor)/Math.max(1,r.storey))*r.outerEdges.filter(Boolean).length*2));
   }
   groups.push({key:sector+'/'+cell+'/'+(i/6),sector,ids,bounds,work});
  }
 }
 return groups;
}
export function detailLimits(budget,range,compact=false){
 const local=closeFabricBudget(budget,range);
 return {...local,chunks:Math.min(compact?9:18,[7,12,18][budget]),
  bytes:(compact?[5,9,15]:[9,18,32])[budget]*mib};
}
export function planChunks(groups,x,z,range,budget,compact,view,active){
 const limit=detailLimits(budget,range,compact);
 if(range>=125)return [];
 const candidates=[];
 for(const g of groups){
  const retained=active.has(g.key),d=boundsDistance(x,z,g.bounds);
  if(d>limit.reach*(retained?1.15:1))continue;
  candidates.push({g,d,score:localScore(g.bounds,x,z,view)*(retained?.86:1)});
 }
 candidates.sort((a,b)=>a.score-b.score||a.d-b.d||a.g.key.localeCompare(b.g.key));
 const out=[];let work=0,count=0;
 for(const {g} of candidates){
  if(out.length>=limit.chunks)break;
  if(count+g.ids.length>limit.count||work+g.work>limit.work)continue;
  out.push(g);count+=g.ids.length;work+=g.work;
 }
 return out;
}
// Count owned typed arrays including generated normals and the duplicate index
// used for masking. This is not total browser or GPU memory.
export function detailBytes(data){
 let bytes=0;
 for(const key of ['position','color','uv','archMetric','archData','index'])bytes+=data[key]?.byteLength||0;
 return bytes+(data.index?.byteLength||0)+(data.position?.byteLength||0);
}
export function qualityStep(state,{median,p95,target,pending,maxTier}){
 let {tier,scale,penalty,slow}=state;
 const overloaded=median>target*1.45||(p95>target*2.5&&median>target*1.2);
 const comfortable=median<target*1.08&&!pending;
 slow=overloaded?Math.max(0,slow)+1:comfortable?Math.min(0,slow)-1:0;
 if(slow>=3){
  if(scale>.681)scale=Math.max(.68,scale-.10);
  else if(penalty<2)penalty++;
  else if(tier>0&&(!pending||slow>=6||median>target*2.1))tier--;
  else return {...state,slow};
  slow=0;
 }else if(slow<=-12){
  if(scale<.999)scale=Math.min(1,scale+.10);
  else if(tier<maxTier)tier++;
  else if(penalty>0)penalty--;
  else return {...state,slow:0};
  slow=0;
 }
 return {tier,scale,penalty,slow};
}
