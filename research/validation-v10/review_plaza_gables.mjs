// Independent geometric regression: horizontal rays through the former gable gaps.
// Run with research/validate_loader.mjs from the repository root.
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {createPlazaMayor} from '../../dist/js/plaza-mayor.js';
const root=process.cwd();
const original=fs.readFileSync(root+'/dist/js/plaza-mayor.js','utf8');
const contextData=JSON.parse(fs.readFileSync(root+'/dist/assets/data/plaza-mayor-context.json','utf8'));
const ctx=new Proxy({}, {get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};
const LON=111320*Math.cos(39.679*Math.PI/180),project=(lon,lat)=>({x:(lon+.278)*LON,z:(39.679-lat)*111320});
const model=createPlazaMayor({contextData,project,heightAt:()=>0});
model.group.updateMatrixWorld(true);
const qa=model.group.userData.visit.qa;
const rows=new Map(contextData.coreBuildings.map(r=>[r.id,r]));
const probes=[];
for (const f of qa.facades){
 if(f.roof!=='tiles')continue;
 const p=rows.get(f.id).coordinates.map(c=>project(...c));
 if(Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<.03)p.pop();
 const yaw=f.front.yaw,[mx,mz]=f.front.midpoint;
 const axis=v=>-((v.x-mx)*Math.sin(yaw)+(v.z-mz)*Math.cos(yaw));
 const ds=p.map(axis),lo=Math.min(...ds),hi=Math.max(...ds),mid=(lo+hi)/2,rise=Math.min(1.45,(hi-lo)*.12),top=f.heightM+f.front.baseM;
 const y=v=>top+rise*Math.max(0,1-Math.abs(axis(v)-mid)/Math.max(.01,(hi-lo)/2));
 const meshes=[];model.group.traverse(o=>{if(o.isMesh&&o.userData.component===`cubierta-${f.address}`&&o.userData.materialKind==='plaster')meshes.push(o)});
 for(let i=0;i<p.length;i++){
  const a=p[i],c=p[(i+1)%p.length],aa=axis(a)-mid,cc=axis(c)-mid;if(aa*cc>=0)continue;
  const crossing=-aa/(cc-aa),len=Math.hypot(c.x-a.x,c.z-a.z),normal=new THREE.Vector3((c.z-a.z)/len,0,-(c.x-a.x)/len);
  for(const shift of[-.075,0,.075]){
   const t=Math.max(.03,Math.min(.97,crossing+shift)),point={x:a.x+t*(c.x-a.x),z:a.z+t*(c.z-a.z)},oldY=y(a)*(1-t)+y(c)*t,newY=y(point);
   if(newY-oldY<.02)continue;
   const origin=new THREE.Vector3(point.x,(oldY+newY)/2,point.z).addScaledVector(normal,.4),ray=new THREE.Raycaster(origin,normal.clone().negate(),.001,.8),hits=ray.intersectObjects(meshes,false);
   probes.push({address:f.address,edge:i,t,oldMissingHeight:newY-oldY,hit:hits.length>0,distance:hits[0]?.distance??null});
  }
 }
}
const report={sourceHash:crypto.createHash('sha256').update(original).digest('hex'),buildings:qa.facades.length,gableProbes:probes.length,missing:probes.filter(p=>!p.hit),probes};
fs.writeFileSync(root+'/research/validation-v10/plaza-gables-independent-review.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({sourceHash:report.sourceHash,buildings:report.buildings,gableProbes:report.gableProbes,missing:report.missing},null,2));
