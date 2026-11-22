import fs from 'node:fs';
import * as THREE from 'three';
import { createCoastPier } from '../../dist/js/coast-pier.js';
const data=JSON.parse(fs.readFileSync('dist/assets/data/coast-pier.json','utf8'));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const model=createCoastPier({heightAt:()=>1.5,project,records:Object.fromEntries(data.sites.map(s=>[s.id,s])),data});
for(const[id,site]of Object.entries(model.sites)){
 fs.writeFileSync(`dist/assets/data/${id}-plan.json`,JSON.stringify(site.plan,null,2)+'\n');
 console.log(id,JSON.stringify({stats:site.stats,focuses:Object.values(site.visit.focuses).map(q=>({id:q.id,target:q.target.toArray(),offset:q.offset,coordinates:q.coordinates,localTarget:q.localTarget,elevation:q.elevation}))}));
}
model.dispose();
