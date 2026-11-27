// Probe actual exterior/interior wall toes, including their half-width and the
// linear bottom edge between vertices. A centreline sample cannot find a gap
// under a thick wall on sloping terrain.
import fs from 'node:fs';
import path from 'node:path';
import {root,buildCastleScene} from './castle-scene.mjs';

const atlas=await buildCastleScene(),ruin=atlas.visit.qa.east.ruins.find(r=>r.id==='ruin-733215260');
if(!ruin)throw new Error('Missing current southern dependency geometry');
const samples=[],edges=new Map();
atlas.castle.traverse(mesh=>{
 if(!mesh.isMesh||mesh.userData.component!==ruin.id||mesh.userData.materialKind!=='east-masonry')return;
 const p=mesh.geometry.attributes.position,ids=mesh.geometry.index,end=ids?.count??p.count;
 for(let i=0;i<end;i+=3){
  const vertices=[0,1,2].map(j=>new atlas.THREE.Vector3().fromBufferAttribute(p,ids?ids.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
  const low=vertices.filter(v=>v.y<ruin.floorY-.05);if(low.length!==2)continue;
  const key=low.map(v=>v.toArray().map(n=>n.toFixed(5)).join(',')).sort().join('|');edges.set(key,low);
 }
});
let edge=0;
for(const [a,b] of edges.values()){
 for(const t of[0,.25,.5,.75,1]){
  const p=a.clone().lerp(b,t),ground=atlas.terrain.meshHeightAt(p.x,p.z);
  samples.push({edge,x:p.x,z:p.z,foot:p.y,ground,gap:p.y-ground});
 }
 edge++;
}
if(!samples.length)throw new Error('No actual wall toe edges found');
samples.sort((a,b)=>b.gap-a.gap);
const report={pass:samples[0].gap<=.025,method:'Actual Float32 triangle bottom edges of the dependency masonry, including both wall toes, bottom flare and interpolated edge samples against the real Atlas mesh',edges:edges.size,samples:samples.length,maxGapM:samples[0].gap,positiveGaps:samples.filter(s=>s.gap>.025).length,worst:samples.slice(0,30),openDeposits:atlas.visit.qa.east.openDeposits};
fs.writeFileSync(path.join(root,'research/validation-v54/east-wall-contact-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,worst:report.worst.slice(0,8)},null,2));
if(!report.pass)process.exitCode=1;
