// Native Canvas, final rendered terrain and per-instance resource checks.
// Run with research/validate_loader.mjs from the repository root.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {createJuderiaContext} from '../../dist/js/juderia-context.js';
import {createCivicHeritage} from '../../dist/js/heritage-civic.js';
import {createSacredHeritage} from '../../dist/js/heritage-sacred.js';
import {drawJuderiaMap} from '../../dist/js/juderia-map.js';
import {createHeightSampler,buildTerrainGeometry} from '../../dist/js/terrain.js';
import {createUrbanSurface} from '../../dist/js/urban-surface.js';
import {getMapPalette} from '../../dist/js/theme.js';
const require=createRequire(import.meta.url),{createCanvas,GlobalFonts}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(256,256)};
GlobalFonts.registerFromPath('dist/assets/fonts/manrope.ttf','Manrope');GlobalFonts.registerFromPath('dist/assets/fonts/manrope-semibold.ttf','Manrope');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json')),data=read('cartography'),elevation=read('elevation'),landmarks=Object.fromEntries(read('landmarks').sites.map(s=>[s.id,s])),contextData=read('juderia-context'),churchContext=read('santa-maria-context'),heightAt=createHeightSampler(elevation),project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const hasVisit=fs.existsSync('dist/assets/data/juderia-visit.json'),sourceVisit=hasVisit?read('juderia-visit'):null;
const sacred=createSacredHeritage({data,landmarks,project,heightAt,santaMariaVisit:read('santa-maria-visit'),santaMariaContext:churchContext}),civic=createCivicHeritage({data,landmarks,project,heightAt,plazaContext:read('plaza-mayor-context'),plazaVisit:read('plaza-mayor-visit'),juderiaContext:contextData,juderiaVisit:sourceVisit});
const plaza=civic.sites['juderia'],visit=plaza.userData.visit,context=plaza.userData.context,excludedRoads=new Set([...sacred.excludedRoadIds,...civic.excludedRoadIds].map(String));
const patches=[...sacred.patches,...civic.patches],urban=createUrbanSurface({data:{...data,roads:data.roads.filter(r=>!excludedRoads.has(String(r.id)))},project,heightAt,patches,exclusions:[...sacred.exclusions,...civic.exclusions]}),terrain=buildTerrainGeometry(elevation,urban.groundHeight,patches);
sacred.sites['santa-maria'].userData.visit.bindGround(terrain.meshHeightAt);civic.sites['plaza-mayor'].userData.visit.bindGround(terrain.meshHeightAt);visit.bindGround(terrain.meshHeightAt);civic.sites['plaza-mayor'].userData.visit.bindGround(terrain.meshHeightAt);
const visitData=sourceVisit||{stops:visit.plan.stops.map(s=>({...s,coordinate:s.coordinates,period:'mixed'})),readingLegend:visit.periods},plan=visit.plan;
const checks=[],failures=[],check=(value,label,detail)=>{checks.push({pass:!!value,label});if(!value)failures.push({label,detail});};
check(context.stats.buildingParts===344&&context.stats.parentParcels===146,'344 source building parts in 146 neighbourhood parcels');
check(context.stats.sourceHeight+context.stats.ignHeight+context.stats.storeyHeight===344&&context.stats.fallbackHeight===0,'every context height has source or storey derivation',context.stats);
check(sacred.sites['santa-maria'].userData.context.stats.buildingParts===44,'44 Santa Maria parts remain present in the assembled scene');
let finite=true,meshes=0,triangles=0,pavingSamples=0,buriedPaving=0,floatingPaving=0,minClearance=Infinity,maxClearance=-Infinity;const buriedDetails=[],floatingDetails=[];
context.group.updateMatrixWorld(true);
context.group.traverse(o=>{
 if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
 for(const a of Object.values(o.geometry.attributes))for(const n of a.array)if(!Number.isFinite(n))finite=false;
 if(o.userData.materialKind!=='paving')return;
 const p=o.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,clearance=y-terrain.meshHeightAt(x,z);pavingSamples++;minClearance=Math.min(minClearance,clearance);maxClearance=Math.max(maxClearance,clearance);if(clearance<.025){buriedPaving++;if(buriedDetails.length<20)buriedDetails.push({mesh:o.name,x,z,y,clearance});}if(clearance>.35){floatingPaving++;if(floatingDetails.length<20)floatingDetails.push({mesh:o.name,x,z,y,clearance});}}
});
check(finite,'all context geometry attributes are finite');check(buriedPaving===0,'pavement triangles clear the final rendered terrain',{pavingSamples,buriedPaving,minClearance,buriedDetails});check(floatingPaving===0,'pavement triangles closely follow the final terrain',{floatingPaving,maxClearance,floatingDetails});
// Neighbouring pavement faces must agree at the same x/z. Centroid clearance
// alone cannot detect cracks introduced by independent triangle-local lifts.
const coincident=new Map();let coincidentCount=0,maximumSharedHeightMismatch=0;
context.group.traverse(o=>{if(!o.isMesh||o.userData.materialKind!=='paving')return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),key=x.toFixed(4)+','+z.toFixed(4);if(coincident.has(key)){coincidentCount++;maximumSharedHeightMismatch=Math.max(maximumSharedHeightMismatch,Math.abs(y-coincident.get(key)));}else coincident.set(key,y);}});
check(coincidentCount>100&&maximumSharedHeightMismatch<.001,'shared pavement vertices have a common height',{coincidentCount,maximumSharedHeightMismatch});
// Shared vertex equality alone misses T-junctions. The new polygon mesh is
// cut on the terrain's exact diagonals, so every face and all edge midpoints
// must remain at the same 10.5 cm offset from the rendered terrain plane.
let pavementEdgeSamples=0,maximumPavementDrapeError=0;
const pavingMeshes=[];
context.group.traverse(o=>{
 if(!o.isMesh||o.userData.materialKind!=='paving')return;pavingMeshes.push(o);
 const p=o.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3)for(const weights of[[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]]){
  let x=0,y=0,z=0;for(let k=0;k<3;k++){x+=p.getX(i+k)*weights[k];y+=p.getY(i+k)*weights[k];z+=p.getZ(i+k)*weights[k];}
  maximumPavementDrapeError=Math.max(maximumPavementDrapeError,Math.abs(y-terrain.meshHeightAt(x,z)-.105));pavementEdgeSamples++;
 }
});
check(pavementEdgeSamples>1000&&maximumPavementDrapeError<.001,'pavement faces and T-junction edge positions conform to the actual terrain triangles',{pavementEdgeSamples,maximumPavementDrapeError});
const knownVisibleGaps=contextData.pavementMesh.coverage.knownVisibleGaps,coverageRay=new THREE.Raycaster();
for(const sample of knownVisibleGaps){const[x,z]=sample.point;coverageRay.set(new THREE.Vector3(x,terrain.meshHeightAt(x,z)+1,z),new THREE.Vector3(0,-1,0));coverageRay.far=2;const hit=coverageRay.intersectObjects(pavingMeshes,false)[0];check(!!hit,'continuous pavement covers previously visible '+sample.id,{sample,hit:hit?.point?.toArray()});}
check(contextData.pavementMesh.coverage.uncoveredAreaM2<.001&&Math.abs(contextData.pavementMesh.coverage.triangleOverlapM2)<.001,'polygon union has complete single coverage after cadastral clipping',contextData.pavementMesh.coverage);
const infill=contextData.pavementMesh.coverage.visualFacadeInfill;
check(infill.sourceId==='1365045242'&&infill.axisLengthM<25&&infill.areaM2<20&&infill.courtyardOverlapM2<.001,'facade-side infill is restricted to the first Sang Vella lane and excludes courtyards',infill);
// The close street view must retain its surveyed slope, without flat domestic
// foundation caps bleeding across a passage narrower than the 2.5 m terrain grid.
let maximumLaneGroundDeviation=0,maximumLaneSlope=0,laneSamples=0;
for(const road of contextData.roads.filter(r=>['1365045242','163560122'].includes(r.sourceId))){const p=road.coordinates.map(ll=>project(...ll));for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],length=Math.hypot(b.x-a.x,b.z-a.z),count=Math.ceil(length/.25);let previous=null;for(let n=0;n<=count;n++){const t=n/count,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=terrain.meshHeightAt(x,z);maximumLaneGroundDeviation=Math.max(maximumLaneGroundDeviation,Math.abs(y-heightAt(x,z)));if(previous)maximumLaneSlope=Math.max(maximumLaneSlope,Math.abs(y-previous.y)/(length/count));previous={y};laneSamples++;}}}
check(laneSamples>100&&maximumLaneGroundDeviation<.15,'Sang Vella stays within 15 cm of the source terrain profile',{laneSamples,maximumLaneGroundDeviation,maximumLaneSlope});
const expectedIds=Object.keys(contextData.focusCoordinates);check(expectedIds.every(id=>context.focuses[id]?.target?.isVector3),'all nine context visit focuses resolve');
check(expectedIds.every(id=>{const q=project(...contextData.focusCoordinates[id]),t=context.focuses[id].target;return Math.hypot(q.x-t.x,q.z-t.z)<.001;}),'context focuses retain their source geographic positions');
// The chosen street views must approach through open space, rather than
// looking through the retained caserío or the Santa Maria Sagrari roofs.
const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})),raycaster=new THREE.Raycaster(),cameraChecks=[];
civic.group.updateMatrixWorld(true);sacred.group.updateMatrixWorld(true);terrainMesh.updateMatrixWorld(true);
for(const id of expectedIds)for(const near of[false,true])for(const factor of[1,1.95,3.6]){
 const f=context.focuses[id],offset=new THREE.Vector3(...(near?f.closeOffset:f.offset)).multiplyScalar(factor),position=f.target.clone().add(offset),direction=f.target.clone().sub(position);raycaster.set(position,direction.clone().normalize());raycaster.far=direction.length()-.3;
 const hit=raycaster.intersectObjects([civic.group,sacred.group,terrainMesh],true)[0];
 cameraChecks.push({id,near,factor,position:position.toArray(),target:f.target.toArray(),hit:hit?{name:hit.object.name,component:hit.object.userData.component,point:hit.point.toArray()}:null});
 check(!hit,id+'/'+(near?'near':'full')+'/'+factor+' sightline clears retained geometry',cameraChecks.at(-1));
}
const second=createJuderiaContext({data,landmarks,project,heightAt,contextData}),firstMaterials=new Set(context.ownedResources.materials),firstTextures=new Set(context.ownedResources.textures);
check(second.ownedResources.materials.every(m=>!firstMaterials.has(m))&&second.ownedResources.textures.every(t=>!firstTextures.has(t)),'instances share no disposable materials or textures');
const original=context.ownedResources.materials.map(m=>({m,c:m.color.clone(),map:m.map,vertexColors:m.vertexColors}));context.selectFocus('juderia-rams');context.setReadingMode('periods');context.selectFocus(null);context.setReadingMode('materials');check(original.every(({m,c,map,vertexColors})=>m.color.equals(c)&&m.map===map&&m.vertexColors===vertexColors),'period and focus changes restore every original material');second.dispose();check(second.ownedResources.materials.length===0&&context.ownedResources.materials.length>0,'disposing another instance preserves this context');
const preRebind={geometries:context.ownedResources.geometries.length,materials:context.ownedResources.materials.length,textures:context.ownedResources.textures.length};context.bindGround(terrain.meshHeightAt);check(Object.entries(preRebind).every(([key,n])=>context.ownedResources[key].length===n),'rebinding terrain replaces and disposes owned geometry without resource growth');

const scenarios=[],surfaces=[{id:'desktop-minimap',width:460,height:240,large:false,selected:null},{id:'desktop-plan',width:1100,height:700,large:true,selected:'juderia-portalet'},{id:'mobile-plan',width:300,height:320,large:true,selected:'juderia-rams'}];
const malformed=[{id:'bad-point',coordinates:[-.279,39.679]},{id:'bad-nan',coordinates:[[NaN,0],[0,0],[1,1]]}];
const luminance=hex=>{const c=hex.slice(1).match(/.{2}/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const surface of surfaces)for(const theme of['dark','light']){
 const canvas=createCanvas(surface.width,surface.height),ctx=canvas.getContext('2d'),texts=[],fills=[];let arc=null;
 const proxy=new Proxy(ctx,{get(t,k){const value=Reflect.get(t,k,t);if(typeof value!=='function')return value;return(...args)=>{if(k==='beginPath')arc=null;if(k==='arc')arc={x:args[0],y:args[1],r:args[2]};if(k==='fill'&&arc)fills.push({...arc,color:t.fillStyle});if(k==='fillText')texts.push({text:String(args[0]),x:args[1],y:args[2],color:t.fillStyle});return value.apply(t,args);};},set(t,k,v){return Reflect.set(t,k,v,t);}});canvas.getContext=()=>proxy;
 const result=drawJuderiaMap(canvas,data,visitData,{...surface,heightAt:terrain.meshHeightAt,palette:getMapPalette(theme),readingMode:'periods',modelGeometry:{...plan,components:[...plan.components,...malformed]}}),scenario=surface.id+'/'+theme;
 check(!!result,scenario+' returns a map');if(!result)continue;
 check(result.targets.length===16&&new Set(result.targets.map(t=>t.id)).size===16,scenario+' contains all 16 unique stops');
 check(result.components===plan.components.length&&result.outlineSource==='juderia-plan',scenario+' uses real core/context geometry and ignores malformed components');
 let minimumDistance=Infinity,minimumContrast=Infinity;
 for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++)minimumDistance=Math.min(minimumDistance,Math.hypot(result.targets[i].x-result.targets[j].x,result.targets[i].y-result.targets[j].y));
 check(minimumDistance>=(surface.large?32:17)-.0001,scenario+' markers have readable separation',minimumDistance);
 check(plan.components.every(c=>c.coordinates.every(ll=>{const p=project(...ll);return p.x>=result.bounds.minX&&p.x<=result.bounds.maxX&&p.z>=result.bounds.minZ&&p.z<=result.bounds.maxZ;})),scenario+' bounds include every surrounding parcel and approach');
 for(const target of result.targets){check(result.hitTarget(target.x,target.y)===target.id,scenario+' hit '+target.id);check([target.x,target.y,target.real.x,target.real.y].every(Number.isFinite),scenario+' finite '+target.id);const label=texts.find(t=>t.text===String(target.index)),fill=fills.findLast(f=>Math.abs(f.x-target.x)<.0001&&Math.abs(f.y-target.y)<.0001&&f.r===(surface.large?13:7));if(label&&fill)minimumContrast=Math.min(minimumContrast,contrast(label.color,fill.color));}
 check(minimumContrast>=4.5,scenario+' marker text meets 4.5:1 contrast',minimumContrast);
 if(surface.selected){const target=result.targets.find(t=>t.id===surface.selected);check(target&&Math.hypot(target.x-target.real.x,target.y-target.real.y)<.001,scenario+' selected marker retains geographic position');}
 check(!texts.some(t=>/TEATRO|SANTA MARÍA/.test(t.text)),scenario+' has the quarter-specific heading');
 scenarios.push({id:scenario,targets:result.targets.length,components:result.components,minimumDistance,minimumContrast,shadeCells:result.shadeCells});
 fs.writeFileSync('research/validation-v11/juderia-map-'+surface.id+'-'+theme+'.png',canvas.toBuffer('image/png'));
}
const tracked=['dist/js/juderia.js','dist/js/heritage-civic.js','dist/js/juderia-context.js','dist/js/juderia-map.js','dist/assets/data/juderia-context.json',...(hasVisit?['dist/assets/data/juderia-visit.json']:[])];
const result={pass:failures.length===0,visitSource:hasVisit?'juderia-visit.json':'temporary model plan fixture',stats:context.stats,geometry:{meshes,triangles,pavingSamples,buriedPaving,floatingPaving,minClearance,maxClearance,coincidentCount,maximumSharedHeightMismatch,pavementEdgeSamples,maximumPavementDrapeError,knownVisibleGaps,laneSamples,maximumLaneGroundDeviation,maximumLaneSlope},scenarios,cameraChecks,checks,failures,limitations:context.qa.limitations,inputHashes:Object.fromEntries(tracked.map(f=>[f,createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};
fs.writeFileSync('research/validation-v11/juderia-context-qa.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:result.pass,visitSource:result.visitSource,stats:result.stats,geometry:result.geometry,scenarios:scenarios.length,checks:checks.length,failures},null,2));
if(failures.length)process.exitCode=1;
