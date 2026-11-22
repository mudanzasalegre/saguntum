import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {createCity} from '../../dist/js/city.js';
import {createUrbanSurface,pointInPolygon,polygonDistance} from '../../dist/js/urban-surface.js';

const require=createRequire(import.meta.url),{createCanvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json','utf8'));
const source=read('cartography'),context=read('salvador-context');
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const ids=new Set(context.roads.filter(r=>!r.replacesWholeSource).map(r=>String(r.sourceId)));
const data={roads:source.roads.filter(r=>ids.has(String(r.id))),buildings:[],trees:[],landcover:[],castlePolygon:[],theatrePolygon:[]};
const masks=context.genericStreetExclusions.map(row=>row.coordinates.map(p=>project(...p)));
const flat=()=>0,urban=createUrbanSurface({data,project,heightAt:flat});
const make=exclusions=>createCity({data,project,heightAt:flat,urban,terrainHeightAt:flat,exclusions,inBounds:()=>true,treeLimit:0});
const before=make([]),after=make(masks);before.group.updateMatrixWorld(true);after.group.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
const hits=(city,x,z)=>{ray.set(new THREE.Vector3(x,10,z),down);ray.far=11;return [...new Set(ray.intersectObjects(city.roads.children,false).map(h=>h.object.name))];};
const inside=(x,z)=>masks.some(p=>pointInPolygon(x,z,p));
const interior=[],exterior=[];
for(const id of ids){
 const segments=urban.segments.filter(s=>String(s.road.id)===id);
 const interiorSegment=segments.find(s=>{
  const x=(s.a.x+s.b.x)/2,z=(s.a.z+s.b.z)/2,len=Math.hypot(s.b.x-s.a.x,s.b.z-s.a.z),nx=-(s.b.z-s.a.z)/len,nz=(s.b.x-s.a.x)/len;
  return [s.a,s.b,{x,z},{x:x+nx*s.width*.485,z:z+nz*s.width*.485},{x:x-nx*s.width*.485,z:z-nz*s.width*.485}].every(p=>inside(p.x,p.z));
 });
 if(interiorSegment){
  const s=interiorSegment,x=(s.a.x+s.b.x)/2,z=(s.a.z+s.b.z)/2,len=Math.hypot(s.b.x-s.a.x,s.b.z-s.a.z),nx=-(s.b.z-s.a.z)/len,nz=(s.b.x-s.a.x)/len;
  for(const side of[-1,0,1]){const px=x+nx*s.width*.485*side,pz=z+nz*s.width*.485*side;interior.push({sourceId:id,kind:s.road.kind,point:[px,pz],before:hits(before,px,pz),after:hits(after,px,pz)});}
 }
 // Retain a source segment safely beyond the local render replacement. This
 // includes the unmodeled continuation of the 38-step Ben Montel source way.
 const externalSegment=segments.find(s=>[s.a,s.b,{x:(s.a.x+s.b.x)/2,z:(s.a.z+s.b.z)/2}].every(q=>masks.every(p=>polygonDistance(q.x,q.z,p)>s.width+3)));
 if(externalSegment){const s=externalSegment,x=(s.a.x+s.b.x)/2,z=(s.a.z+s.b.z)/2;exterior.push({sourceId:id,kind:s.road.kind,point:[x,z],before:hits(before,x,z),after:hits(after,x,z)});}
}
const expectedName=kind=>kind==='steps'?'Escalinatas con huellas y contrahuellas':'Pavimentos sobre trazado OSM';
const checks={
 allSixPartialSourceWaysHaveInteriorSamples:new Set(interior.map(s=>s.sourceId)).size===ids.size&&ids.size===6,
 duplicateCurbsAndSurfacesRemoved:interior.length>0&&interior.every(s=>s.before.length>0&&s.after.length===0),
 partialStaircaseTested:interior.some(s=>s.sourceId==='163609172'&&s.before.includes(expectedName('steps'))),
 allPartialSourceWaysHaveExteriorSamples:exterior.length===ids.size,
 exteriorContinuationsPreserved:exterior.every(s=>s.before.includes(expectedName(s.kind))&&s.after.includes(expectedName(s.kind))),
 sourceAxesPreserved:urban.segments.length>0&&data.roads.length===ids.size,
 noFullWayRemovalForPartialSources:[...ids].every(id=>!context.excludedRoadIds.includes(id)),
};
const report={pass:Object.values(checks).every(Boolean),checks,masks:masks.length,partialSourceWays:ids.size,interior,exterior,scope:'Production city rendering against source-contained replacement masks on flat ground; final terrain is checked separately. Samples do not assert exact polygon clipping of renderer road-segment seams.'};
fs.writeFileSync('research/validation-v16/salvador-street-overlap-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
for(const city of[before,after]){
 const resources=new Set();city.group.traverse(o=>{if(!o.isMesh)return;resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const name of['map','bumpMap'])if(m[name])resources.add(m[name]);}});for(const resource of resources)resource.dispose();
}
if(!report.pass)process.exitCode=1;
