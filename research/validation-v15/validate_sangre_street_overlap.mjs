import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {createCity} from '../../dist/js/city.js';
import {createUrbanSurface,pointInPolygon} from '../../dist/js/urban-surface.js';

const require=createRequire(import.meta.url),{createCanvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json','utf8'));
const source=read('cartography'),context=read('sangre-context');
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const ids=new Set(context.roads.filter(r=>!r.replacesWholeSource).map(r=>String(r.sourceId)));
const data={roads:source.roads.filter(r=>ids.has(String(r.id))),buildings:[],trees:[],landcover:[],castlePolygon:[],theatrePolygon:[]};
const masks=context.genericStreetExclusions.map(row=>row.coordinates.map(p=>project(...p)));
// XY geometry, segment sampling and city construction are the production paths.
// A flat height function isolates duplicate street ownership from terrain QA.
const flat=()=>0,urban=createUrbanSurface({data,project,heightAt:flat});
const make=exclusions=>createCity({data,project,heightAt:flat,urban,terrainHeightAt:flat,exclusions,inBounds:()=>true,treeLimit:0});
const before=make([]),after=make(masks);before.group.updateMatrixWorld(true);after.group.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
const hits=(city,x,z)=>{ray.set(new THREE.Vector3(x,10,z),down);ray.far=11;return ray.intersectObjects(city.roads.children,false).map(h=>h.object.name);};
const samples=[[44.8728046681,83.9392223638],[45.3989589959,82.8556475447],[49.1412179964,79.7913641082],[47.1477262076,79.8029760765],[52.8119981992,79.8738061186]];
const removed=samples.map(([x,z])=>({point:[x,z],before:hits(before,x,z),after:hits(after,x,z)}));
const exterior=[];
for(const id of ids){
 const segment=urban.segments.find(s=>String(s.road.id)===id&&!masks.some(p=>pointInPolygon(s.a.x,s.a.z,p)||pointInPolygon(s.b.x,s.b.z,p)||pointInPolygon((s.a.x+s.b.x)/2,(s.a.z+s.b.z)/2,p)));
 if(!segment)continue;
 const x=(segment.a.x+segment.b.x)/2,z=(segment.a.z+segment.b.z)/2;
 exterior.push({sourceId:id,point:[x,z],before:hits(before,x,z),after:hits(after,x,z)});
}
const checks={
 sourceSliversReproduced:removed.every(s=>s.before.includes('Bordes de piedra')),
 duplicateCurbsAndCalzadaRemoved:removed.every(s=>s.after.length===0),
 allPartialSourceWaysSampled:exterior.length===ids.size,
 exteriorContinuationsPreserved:exterior.every(s=>s.before.includes('Pavimentos sobre trazado OSM')&&s.after.includes('Pavimentos sobre trazado OSM')),
 sourceAxesPreserved:urban.segments.length>0&&data.roads.length===ids.size,
};
const report={pass:Object.values(checks).every(Boolean),checks,masks:masks.length,partialSourceWays:ids.size,removed,exterior,scope:'Generic road duplication regression; integrated final-terrain camera checks remain in validate_sagunto_v15.mjs.'};
fs.writeFileSync('research/validation-v15/sangre-street-overlap-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
for(const city of[before,after]){
 const resources=new Set();
 city.group.traverse(o=>{
  if(!o.isMesh)return;
  resources.add(o.geometry);
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   resources.add(m);
   for(const name of['map','bumpMap'])if(m[name])resources.add(m[name]);
  }
 });
 for(const resource of resources)resource.dispose();
}
if(!report.pass)process.exitCode=1;
