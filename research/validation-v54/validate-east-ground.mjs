// Inspect the actual Atlas terrain, not only the analytical grading profile.
// Slopes here describe a digital model; they are not site-accessibility claims.
import fs from 'node:fs';
import path from 'node:path';
import {root,project,buildCastleScene} from './castle-scene.mjs';
import {createCastleGround} from '../../dist/js/castle-ground.js';
import {EAST_ROUTE_DEFS} from '../../dist/js/castle-east-layout.js';

const atlas=await buildCastleScene();
const before=JSON.parse(fs.readFileSync(path.join(root,'research/validation-v54/east-before.json'),'utf8'));
const ground=createCastleGround({project,heightAt:atlas.heightAt});
const fromFinal=createCastleGround({project,heightAt:atlas.terrain.meshHeightAt});
let maxIdempotenceError=0,samples=0;
for(let x=ground.bounds.minX;x<=ground.bounds.maxX;x+=1.25)for(let z=ground.bounds.minZ;z<=ground.bounds.maxZ;z+=1.25){
 const a=ground.sample(x,z),b=ground.surfaceHeight(x,z,a);
 maxIdempotenceError=Math.max(maxIdempotenceError,Math.abs(a-b));samples++;
}
const routes=[];
for(const id of ['180732342','733215256','733215257']){
 const road=EAST_ROUTE_DEFS.find(r=>r.id===id)||atlas.geo.roads.find(r=>String(r.osmId||r.id)===id);
 if(!road)throw new Error('Missing mapped route '+id);
 const points=road.coordinates.map(c=>project(...c));
 let metres=0,rise=0,fall=0,maxGrade=0,count=0;
 const peaks=[];
 for(let k=1;k<points.length;k++){
  const a=points[k-1],b=points[k],length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(length));
  let previous=null;
  for(let i=0;i<=n;i++){
   const t=i/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=atlas.terrain.meshHeightAt(x,z);count++;
   if(previous){
    const step=Math.hypot(x-previous.x,z-previous.z),dy=y-previous.y,grade=Math.abs(dy)/step;
    metres+=step;rise+=Math.max(0,dy);fall+=Math.max(0,-dy);maxGrade=Math.max(maxGrade,grade);
    if(grade>.20)peaks.push({x,z,y,grade,segment:k});
   }
   previous={x,z,y};
  }
 }
 peaks.sort((a,b)=>b.grade-a.grade);
 const old=before.routes.find(r=>r.id===id);
 routes.push({id,metres,rise,fall,maxGrade,samples:count,beforeMaxGrade:old.maxGrade,change:maxGrade-old.maxGrade,peaks:peaks.slice(0,12)});
}
const probes=ground.east.probes.map(p=>({x:p.x,z:p.z,raw:atlas.heightAt(p.x,p.z),profile:ground.sample(p.x,p.z),mesh:atlas.terrain.meshHeightAt(p.x,p.z),secondProfile:fromFinal.sample(p.x,p.z)}));
const maxFinalRegrade=Math.max(...probes.map(p=>Math.abs(p.mesh-p.secondProfile)));
const maxEasternMeshError=Math.max(...probes.map(p=>Math.abs(p.mesh-p.profile)));
const regression=routes.find(r=>r.id==='733215257');
const report={pass:maxIdempotenceError<1e-6&&fromFinal.pregraded&&Math.abs(regression.change)<.005,
 method:'Real final Atlas terrain plus analytic raw/final-MDT createCastleGround constructors; effective eastern routes at <=1 m (local doorway adjustment, original OSM retained); whole local bounds sampled at 1.25 m',
 rawInputPregraded:ground.pregraded,finalInputPregraded:fromFinal.pregraded,maxIdempotenceError,samples,maxFinalRegrade,maxEasternMeshError,
 bounds:ground.bounds,routes,probes,
 limitations:['These model gradients are not a physical accessibility survey.','Finite terrain cells interpolate banks; only current route and terrace profiles are locally adjusted.']};
fs.writeFileSync(path.join(root,'research/validation-v54/east-ground-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,probes:probes.length,routes:routes.map(r=>({...r,peaks:r.peaks.slice(0,3)}))},null,2));
if(!report.pass)process.exitCode=1;
