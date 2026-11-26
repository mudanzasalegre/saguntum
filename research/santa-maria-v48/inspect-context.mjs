import fs from 'node:fs';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
const {createHeightSampler}=await import('../../dist/js/terrain.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('santa-maria-context'),record=read('landmarks').sites.find(s=>s.id==='santa-maria'),height=createHeightSampler(read('elevation'));
const yaw=1.173,co=Math.cos(yaw),si=Math.sin(yaw),project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),center=project(...record.coordinate);
const world=(x,z)=>({x:center.x+x*co+z*si,z:center.z-x*si+z*co});
const local=c=>{const p=project(...c),x=p.x-center.x,z=p.z-center.z;return{x:x*co-z*si,z:x*si+z*co,y:height(p.x,p.z)};};
const footprint=record.footprint.slice(0,-1).map(local),h=footprint.map(p=>p.y).sort((a,b)=>a-b),sp=world(-21.55,.35),base=Math.max(h[Math.floor(h.length/2)]+.12,height(sp.x,sp.z)+.14);
const samples=[];for(let z=-48;z<=35;z+=1)for(let x=-43;x<=33;x+=1){const p=world(x,z);samples.push({x,z,y:height(p.x,p.z)});}
const result={base,footprint,roads:data.roads.map(r=>({...r,local:r.coordinates.map(local)})),buildings:data.buildings.map(b=>({id:b.id,local:b.coordinates.map(local)})),samples,anchors:[[-1.1,-28.2],[-1.1,-31],[-1.1,-35],[-1.1,-40],[-21.99,.35],[-24,.35],[-27,.35],[-30,.35]].map(([x,z])=>{const p=world(x,z);return{x,z,y:height(p.x,p.z)};})};
const out=process.argv[2]||'/workspace/scratch/3a1b60c196d6/santa-context-v48.json';fs.writeFileSync(out,JSON.stringify(result));console.log(JSON.stringify({output:out,base,anchors:result.anchors,roads:result.roads.map(r=>({id:r.id,kind:r.kind,local:r.local}))}));
