// Add/update only Plaza del Fórum's Atlas/Simulator frames and stop index.
// Camera fitting executes app.js's actual preset(), including its panel space.
// node research/validation-v52/export-forum-cameras.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {THREE,root,project,canvasRuntime,buildForumScene} from './forum-scene.mjs';

const id='forum-plaza',overviewId='forum-plaza-conjunto',exteriorId='forum-plaza-accesos';
const checkOnly=process.argv.includes('--check');
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const round=(n,places=4)=>Number(n.toFixed(places));
const vec=(v,places=4)=>v.toArray().map(n=>round(n,places));
const sizes={wide:{width:1440,height:900},portrait:{width:390,height:844}};
const built=await buildForumScene(),{visit,guide,heightAt,rawHeight,site}=built;
const [{editorialSceneFrame},{stopCamera},{registerFrame},{project:territoryProject},{drawForumPlazaMap}]=await Promise.all([
 import('../../dist/js/editorial-visibility.js'),import('../../dist/js/territory-visit-frames.js'),
 import('../../dist/js/territory-heritage-catalog.js'),import('../../dist/js/territory-coordinates.js'),import('../../dist/js/forum-plaza-map.js')]);
assert(guide.stops.length>=10);
for(const stop of guide.stops)assert(visit.focuses[stop.id],'Authored camera exists: '+stop.id);
const sourceIds=new Set(guide.sources.map(source=>source.id));
for(const stop of guide.stops)for(const fact of stop.facts||[])for(const sourceId of fact.sourceIds||[])assert(sourceIds.has(sourceId),'Valid source reference '+sourceId);

const app=read('dist/js/app.js'),start=app.indexOf('function preset(name,near=false){'),end=app.indexOf('\nfunction setShadowFraming()',start);
assert(start>=0&&end>start);
const preset=new vm.Script('('+app.slice(start,end)+')('+JSON.stringify(id)+',false)',{filename:'app.js:preset'});
function pose(stopId,{width,height}){
 const environment={THREE,selected:id,innerWidth:width,innerHeight:height,mobile:()=>width<=700,
  guidedIds:[id],guidedVisit:()=>({id,stopId,overviewId,model:visit}),points:{[id]:site.point},
  pantalanIds:new Set(),excavation:null,castleFrame:()=>editorialSceneFrame(width,height,{collapsed:false,place:id})};
 const result=preset.runInNewContext(environment,{timeout:1000});
 assert([...result.target.toArray(),...result.position.toArray(),result.fov].every(Number.isFinite));
 return result;
}
const flagKeys=['interiorView','requiresSection','roofOpen','mode','archFocus'];
const flags=focus=>Object.fromEntries(flagKeys.filter(key=>focus[key]!==undefined).map(key=>[key,focus[key]]));
function stopFrame(stopId){
 const wide=pose(stopId,sizes.wide),portrait=pose(stopId,sizes.portrait);
 assert(wide.target.equals(portrait.target));
 const frame={target:vec(wide.target),ground:round(rawHeight(wide.target.x,wide.target.z)),wide:{eye:vec(wide.position),fov:wide.fov},portrait:{eye:vec(portrait.position),fov:portrait.fov}};
 const presentation=flags(visit.focuses[stopId]);
 if(Object.keys(presentation).length)frame.presentation=presentation;
 return frame;
}
function overviewFrame(stopId,size){
 const p=pose(stopId,size);
 return {eye:vec(p.position,3),target:vec(p.target,3),fov:p.fov,ground:round(rawHeight(p.target.x,p.target.z),3)};
}
const cameras=Object.fromEntries(guide.stops.map(stop=>[stop.id,stopFrame(stop.id)]));
const atlas={wide:overviewFrame(null,sizes.wide),portrait:overviewFrame(null,sizes.portrait),
 exterior:{stop:exteriorId,label:'Accesos del parque',wide:overviewFrame(exteriorId,sizes.wide),portrait:overviewFrame(exteriorId,sizes.portrait)}};
const stops={regions:guide.regions.map(({id,name})=>({id,name})),stops:guide.stops.map(stop=>Object.fromEntries(
 ['id','title','coordinate','regionId','intro','period','mode','recommendedMode'].filter(key=>stop[key]).map(key=>[key,stop[key]])))};

// Preserve byte-for-byte every pre-existing top-level visit and its assets.
function updateSite(relative,value){
 const source=read(relative),parsed=JSON.parse(source),needle=JSON.stringify(id)+':';
 let from=source.indexOf(needle),to;
 const others=o=>Object.fromEntries(Object.entries(o).filter(([key])=>key!==id));
 let result;
 if(from<0){
  const end=source.lastIndexOf('}');assert(end>=0);
  result=source.slice(0,end)+(Object.keys(parsed).length?',':'')+needle+JSON.stringify(value)+source.slice(end);
 }else{
  assert(source.indexOf(needle,from+needle.length)<0);
  from+=needle.length;while(/\s/.test(source[from]))from++;
  assert.equal(source[from],'{');let depth=0,inString=false,escaped=false;to=from;
  for(;to<source.length;to++){
   const ch=source[to];
   if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;continue;}
   if(ch==='"'){inString=true;continue;}
   if(ch==='{')depth++;
   if(ch==='}'&&--depth===0){to++;break;}
  }
  assert(depth===0&&to>from);
  result=source.slice(0,from)+JSON.stringify(value)+source.slice(to);
 }
 assert.deepEqual(others(JSON.parse(result)),others(parsed),'Other visits unchanged in '+relative);
 if(checkOnly)assert.deepEqual(parsed[id],value,'Export is current: '+relative);
 else if(result!==source)fs.writeFileSync(path.join(root,relative),result);
 return {file:relative,otherVisits:Object.keys(others(parsed)).length,otherVisitsSha256:hash(JSON.stringify(others(parsed)))};
}

const samples=[],{lon,lat}=(()=>{const [lon,lat]=built.records[id].coordinate;return {lon,lat};})();
const place={id,lon,lat,...territoryProject(lon,lat)},basis=registerFrame(place,territoryProject),det=basis.a*basis.d-basis.b*basis.c;
const inverse=(x,z)=>({x:((x-basis.tx)*basis.d-(z-basis.tz)*basis.b)/det,z:((z-basis.tz)*basis.a-(x-basis.tx)*basis.c)/det});
const shiftedGround=(x,z)=>{const q=inverse(x,z);return rawHeight(q.x,q.z)+7.25;};
for(const stopId of [null,...guide.stops.map(stop=>stop.id)])for(const [sizeName,size]of Object.entries(sizes)){
 const p=pose(stopId,size),focus=visit.focuses[stopId||overviewId],frame=editorialSceneFrame(size.width,size.height,{collapsed:false,place:id});
 const camera=new THREE.PerspectiveCamera(p.fov,size.width/size.height,.12,25000);
 camera.position.copy(p.position);camera.lookAt(p.target);camera.setViewOffset(size.width,size.height,frame.offsetX,frame.offsetY,size.width,size.height);camera.updateMatrixWorld(true);
 let fittedPoints=0;
 if(focus.fitBounds!==false){
  const box=focus.bounds||visit.bounds,points=[...focus.framePoints||[]];
  if(!points.length)for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z));
  for(const point of points){
   const ndc=point.clone().project(camera),x=(ndc.x+1)*size.width/2,y=(1-ndc.y)*size.height/2;
   assert(x>=frame.left-.05&&x<=frame.right+.05&&y>=frame.top-.05&&y<=frame.bottom+.05,'Visible camera bounds: '+stopId+'/'+sizeName);
   fittedPoints++;
  }
 }
 const clearance=p.position.y-site.group.userData.ground.surfaceHeight(p.position.x,p.position.z,heightAt(p.position.x,p.position.z));
 assert(clearance>.15,'Camera remains above the terrain: '+stopId+'/'+sizeName+' '+clearance);
 let adapterError=0;
 if(stopId){
  const f=cameras[stopId],actual=stopCamera({id:stopId},place,{heightAt:shiftedGround,project:territoryProject,aspect:size.width/size.height,frame:f});
  const target=basis.world(f.target[0],f.target[2]),dy=shiftedGround(target.x,target.z)-f.ground;
  const transform=([x,y,z])=>{const q=basis.world(x,z);return[q.x,y+dy,q.z];};
  for(const [have,want]of[[actual.eye.toArray(),transform(f[sizeName].eye)],[actual.target.toArray(),transform(f.target)]])
   adapterError=Math.max(adapterError,...have.map((v,i)=>Math.abs(v-want[i])));
  assert(adapterError<1e-8,'Simulator camera registration');
  assert(Math.abs(actual.fov-f[sizeName].fov)<1e-10);
 }
 samples.push({stop:stopId||'overview',size:sizeName,fittedPoints,clearanceM:round(clearance),adapterErrorM:adapterError});
}

const mapChecks=[],canvas=canvasRuntime();
for(const [name,width,height,readingMode]of[['desktop',840,700,'materials'],['phone',300,280,'materials'],['epochs',840,700,'periods']]){
 const image=canvas.createCanvas(width,height),map=drawForumPlazaMap(image,built.geo,guide,{large:width>400,readingMode,heightAt:built.rawHeight,modelGeometry:visit.plan,selected:'forum-plaza-cloaca'});
 assert(map&&map.totalStops===guide.stops.length&&map.visibleStops===guide.stops.length);
 assert.equal(new Set(map.targets.map(t=>t.id)).size,guide.stops.length);
 for(const target of map.targets){assert.equal(map.hitTarget(target.x,target.y),target.id);assert(target.x>=0&&target.x<=width&&target.y>=0&&target.y<=height);}
 if(!checkOnly)fs.writeFileSync(path.join(root,'research/validation-v52/forum-map-'+name+'.png'),image.toBuffer('image/png'));
 mapChecks.push({name,visibleStops:map.visibleStops,components:map.components,scaleMetres:map.scaleMetres});
}
const updated=[updateSite('dist/assets/territory/visit-cameras.json',cameras),updateSite('dist/assets/territory/atlas-frames.json',atlas),updateSite('dist/assets/territory/visit-stops.json',stops)];
const exportedPlan=JSON.parse(JSON.stringify(visit.plan)),planPath=path.join(root,'dist/assets/data/forum-plaza-plan.json');
if(checkOnly)assert.deepEqual(JSON.parse(fs.readFileSync(planPath,'utf8')),exportedPlan,'Fallback plan matches the current 3D geometry');
else fs.writeFileSync(planPath,JSON.stringify(exportedPlan,null,2)+'\n');
const report={place:id,stops:guide.stops.length,ground:built.groundBinding,geometry:visit.stats,updated,cameras:samples,maps:mapChecks};
if(!checkOnly)fs.writeFileSync(path.join(root,'research/validation-v52/forum-integration-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checked:checkOnly,stops:guide.stops.length,cameraFrames:samples.length,minCameraClearanceM:Math.min(...samples.map(s=>s.clearanceM)),maps:mapChecks,updated},null,2));
