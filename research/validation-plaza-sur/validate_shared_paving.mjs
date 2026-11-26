// node research/validation-plaza-sur/validate_shared_paving.mjs
import fs from 'node:fs';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
const THREE=await import('three');const {pointInPolygon}=await import('../../dist/js/urban-surface.js');const {createPlazaMayorContext}=await import('../../dist/js/plaza-mayor-context.js');
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json','utf8'));const data=read('cartography'),contextData=read('plaza-mayor-context');
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),a=project(-.27910948,39.67903398),c=Math.cos(1.173),s=Math.sin(1.173),world=(x,z)=>({x:a.x+x*c+z*s,z:a.z-x*s+z*c});
const model=createPlazaMayorContext({data,contextData,project,heightAt:()=>0});model.group.updateMatrixWorld(true);
const meshes=[];model.group.traverse(m=>{if(m.isMesh&&m.userData.materialKind==='paving')meshes.push(m);});
const areas=contextData.surfaces.map(s=>({p:s.coordinates.map(q=>project(...q)),holes:(s.holes||[]).map(h=>h.map(q=>project(...q)))}));
const ray=new THREE.Raycaster();let samples=0,covered=0,overlaps=0,areaSamples=0,areaGaps=0;const examples=[];
for(let x=28.137;x<42;x+=.37)for(let z=8.083;z<34;z+=.37){const p=world(x,z);ray.set(new THREE.Vector3(p.x,3,p.z),new THREE.Vector3(0,-1,0));ray.far=4;const hits=ray.intersectObjects(meshes,false);samples++;const inArea=areas.some(a=>pointInPolygon(p.x,p.z,a.p)&&!a.holes.some(h=>pointInPolygon(p.x,p.z,h)));if(inArea){areaSamples++;if(!hits.length)areaGaps++;}if(hits.length)covered++;if(hits.length>1){overlaps++;if(examples.length<8)examples.push({local:[x,z],hits:hits.map(h=>({n:h.object.name,y:h.point.y}))});}}
const ids=['22922647','441656289','1365045248'],checks=[{pass:overlaps===0,label:'No overlapping Plaza paving at the shared Cavallers mouth'},{pass:areaGaps===0,label:'Every sampled point inside the mapped Plaza surface remains paved'},{pass:ids.every(id=>contextData.roads.some(r=>r.id===id)),label:'All three source road centre lines retained'},{pass:ids.every(id=>model.plan.components.some(c=>c.id==='street-'+id)),label:'Road plan components retained'},{pass:ids.every(id=>model.excludedRoadIds.has(id)),label:'Generic road duplicate exclusions retained'}];
const result={pass:checks.every(c=>c.pass),samples,covered,areaSamples,areaGaps,overlaps,examples,checks,observedBefore:{samples:2698,overlaps:28},scope:'Actual Plaza meshes on a flat datum to isolate footprint overlap. Santa María supplies the complementary corridor; final terrain/combined coverage is verified separately.'};fs.writeFileSync('research/validation-plaza-sur/shared-paving-qa.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
