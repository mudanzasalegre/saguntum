import fs from 'node:fs';
import {buildCastleScene,THREE,project} from './castle-scene.mjs';
import {EAST_PLAN_FEATURES} from '../../dist/js/castle-east-layout.js';
import {isEastPerimeterSegment} from '../../dist/js/castle-east.js';
import {isEastExteriorPerimeterSegment} from '../../dist/js/castle-east-exterior-layout.js';
import {polygonDistance} from '../../dist/js/urban-surface.js';
const a=await buildCastleScene(),height=a.terrain.meshHeightAt,outline=a.geo.castlePolygon,stations=[],platforms=EAST_PLAN_FEATURES.platforms.map(f=>({...f,poly:f.coordinates.map(c=>project(...c))}));
for(let i=0;i<outline.length-1;i++){
 if(!isEastPerimeterSegment(outline[i],outline[i+1])||isEastExteriorPerimeterSegment(outline[i],outline[i+1]))continue;
 const p=project(...outline[i]),q=project(...outline[i+1]),l=Math.hypot(q.x-p.x,q.z-p.z),nx=-(q.z-p.z)/l,nz=(q.x-p.x)/l,mid={x:(p.x+q.x)/2,z:(p.z+q.z)/2};
 const near=platforms.map(f=>({f,d:polygonDistance(mid.x,mid.z,f.poly)})).sort((x,y)=>x.d-y.d)[0],defensive=near.d<3.4,bastion=defensive&&near.f.id==='bastion-ne',northern=outline[i][1]>39.67671&&!bastion,thickness=bastion?1.35:northern?1.25:1.55,n=Math.ceil(l/1.05);
 const id=bastion?'bastion-ne':northern?'battery-n':defensive?near.f.id:'east-south-curtain';
 const at=t=>({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t});
 const foot=r=>Math.min(height(r.x+nx*thickness*.6,r.z+nz*thickness*.6),height(r.x-nx*thickness*.6,r.z-nz*thickness*.6))-.35;
 for(let j=0;j<n;j++){
  const u=at(j/n),v=at((j+1)/n),lo=[foot(u),foot(v)];let drop=0;
  for(const t of[0,.25,.5,.75,1])for(const side of[-1,1]){const x=u.x+(v.x-u.x)*t+nx*side*thickness*.55,z=u.z+(v.z-u.z)*t+nz*side*thickness*.55;drop=Math.max(drop,lo[0]+(lo[1]-lo[0])*t-height(x,z)+.38);}
  for(const [r,y]of[[u,lo[0]-drop],[v,lo[1]-drop]])stations.push({i,id,...r,y,r:thickness*.55+.01});
 }
}
const edges=new Map();a.castle.traverse(m=>{
 if(!m.isMesh||m.userData.materialKind!=='east-masonry')return;
 const ps=stations.filter(s=>s.id===m.userData.component);if(!ps.length)return;
 const p=m.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3){const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,i+j).applyMatrix4(m.matrixWorld)),base=v.filter(q=>ps.some(s=>Math.abs(s.y-q.y)<.002&&Math.hypot(q.x-s.x,q.z-s.z)<s.r));
 if(base.length!==2||base[0].distanceTo(base[1])<.02)continue;const k=base.map(v=>v.toArray().join(',')).sort().join('|');edges.set(k,{id:m.userData.component,base});}
});
const samples=[];for(const e of edges.values())for(const t of[0,.25,.5,.75,1]){const p=e.base[0].clone().lerp(e.base[1],t),ground=height(p.x,p.z);samples.push({id:e.id,point:p.toArray(),ground,gap:p.y-ground});}
samples.sort((x,y)=>y.gap-x.gap);const report={date:new Date().toISOString(),pass:samples.length>100&&samples[0].gap<=.025,edges:edges.size,samples:samples.length,maxGapM:samples[0]?.gap,worst:samples.slice(0,12),method:'Actual triangle footing edges matched to the shared perimeter section endpoints, sampled against the final rendered terrain; no centreline-only assumption.'};fs.writeFileSync(new URL('./perimeter-contact-qa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
