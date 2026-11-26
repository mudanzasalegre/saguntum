// Focused geometry checks for the street/raised-church boundary and shared
// building ownership. Uses the application's shipped Three.js and source MDT.
import fs from 'node:fs';
import {registerThreeTestLoader} from './three-test-loader.mjs';
registerThreeTestLoader();
const [{createSantaMaria},{createSantaMariaContext},{createHeightSampler,buildTerrainGeometry},{createUrbanSurface}]=await Promise.all([
 import('../dist/js/santa-maria.js'),import('../dist/js/santa-maria-context.js'),
 import('../dist/js/terrain.js'),import('../dist/js/urban-surface.js')
]);
const {Raycaster,Vector3}=await import('three');
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};
const read=name=>JSON.parse(fs.readFileSync(`dist/assets/data/${name}.json`));
const data=read('cartography'),elevation=read('elevation'),contextData=read('santa-maria-context'),visitData=read('santa-maria-visit'),landmarks=Object.fromEntries(read('landmarks').sites.map(s=>[s.id,s]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),heightAt=createHeightSampler(elevation);
const church=createSantaMaria({record:landmarks['santa-maria'],project,heightAt,visitData}),options={data,landmarks,project,heightAt,churchFrame:church.frame,contextData};
const complete=createSantaMariaContext(options),replacedContextBuildingIds=['3558301YJ3935G','3558302YJ3935N'].flatMap(parcel=>[1,2,3,4].map(part=>`cat-${parcel}_part${part}-0`)),shared=createSantaMariaContext({...options,replacedContextBuildingIds});
const checks=[],check=(condition,label,details)=>checks.push({pass:!!condition,label,...(details?{details}:{})});
check(complete.stats.buildingParts===contextData.buildings.length,'An isolated church retains every source context building');
check(shared.stats.replacedBuildingParts===8&&shared.stats.buildingParts===complete.stats.buildingParts-8,'Eight detailed Plaza Mayor bodies replace eight generic context bodies');
check(replacedContextBuildingIds.every(id=>shared.excludedBuildingIds.has(id)&&!shared.qa.buildings.some(b=>b.id===id)),'Replaced bodies stay excluded from generic world geometry');
check(shared.qa.sourcePreservation.every(b=>contextData.buildings.some(source=>source.id===b.id&&source.coordinates.length===b.vertices&&source.holes.length===b.holes)),'Every retained cadastral footprint and courtyard is preserved');
const focuses={...church.group.userData.visit.focuses,...shared.focuses};
check(visitData.stops.length===16&&visitData.stops.every(stop=>focuses[stop.id]),'All sixteen Santa María visit IDs resolve');
const patches=[...church.patches,...shared.patches],ids=patches.map(p=>p.id);
check(ids.every(Boolean)&&new Set(ids).size===ids.length,'Every church/context patch has a unique stable identifier');
check(church.patch.mode==='lower-only'&&church.patch.priority===10&&shared.patches.every(p=>p.priority===20),'Raised church foundation and street subgrades declare their distinct policies');
const groundOptions={data:{buildings:[],roads:[]},project,heightAt,exclusions:[]};
const forward=createUrbanSurface({...groundOptions,patches}).groundHeight,reverse=createUrbanSurface({...groundOptions,patches:[...patches].reverse()}).groundHeight;
let maximumOrderDifference=0,maximumExteriorLift=-Infinity;
for(let z=-29.5;z<=16.5;z+=.25)for(let x=19.5;x<=29;x+=.5){const p=church.frame.toWorld(x,z),a=forward(p.x,p.z),b=reverse(p.x,p.z);maximumOrderDifference=Math.max(maximumOrderDifference,Math.abs(a-b));maximumExteriorLift=Math.max(maximumExteriorLift,a-heightAt(p.x,p.z));}
check(maximumOrderDifference<1e-9,'Patch order cannot change Cavallers in Atlas versus Simulator',{maximumOrderDifference});
check(maximumExteriorLift<.001,'No patch builds an artificial earth bank above the exterior MDT',{maximumExteriorLift});
const terrain=buildTerrainGeometry(elevation,forward,patches),probes=[];
for(const [x,z]of [[19.7,-28],[19.7,-27.5],[19.7,-24],[19.7,-9],[19.7,11],[19.7,13.5],[20,15]]){const p=church.frame.toWorld(x,z);probes.push({local:[x,z],raw:heightAt(p.x,p.z),surface:forward(p.x,p.z),mesh:terrain.meshHeightAt(p.x,p.z)});}
check(probes.every(p=>p.mesh-p.raw<.4),'Triangulated street edges stay within 0.4 m above the source MDT',probes);
check(probes.every(p=>p.raw-p.mesh<.5),'Triangulated access edges do not excavate a trench more than 0.5 m below the MDT',probes);
shared.bindGround(terrain.meshHeightAt);
let finite=true,triangleCount=0;
for(const group of [church.group,shared.group])group.traverse(o=>{if(!o.isMesh)return;triangleCount+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const attribute of Object.values(o.geometry.attributes))for(const value of attribute.array)if(!Number.isFinite(value))finite=false;});
check(finite,'All geometry attributes remain finite');
const flights=['west','east'].map(flight=>shared.qa.stairSurfaces.filter(p=>p.flight===flight));
check(flights.every(flight=>flight.length>0&&flight.every((p,i)=>i===0||p.y>flight[i-1].y)),'Both stair flights rise monotonically to their central landing');
check(flights.every(flight=>Math.abs(flight.at(-1).y-shared.qa.northStair.top)<1e-6),'Both flights meet the unchanged church threshold');
const treadClearances=[];
for(const tread of shared.qa.stairSurfaces){const p=church.frame.toLocal(tread.x,tread.z);for(const dx of [-1.65,0,1.65])for(const dz of [-tread.run*.44,0,tread.run*.44]){const q=church.frame.toWorld(p.x+dx,p.z+dz);treadClearances.push(tread.y-terrain.meshHeightAt(q.x,q.z));}}
check(Math.min(...treadClearances)>=.04,'Every tread surface stays above triangulated ground across its full usable width',{minimumClearanceM:Math.min(...treadClearances),samples:treadClearances.length});
const ray=new Raycaster(),thresholdRays=[];
for(const x of [19.3,19.6,19.9,20.2,20.5,20.58])for(const z of [-1.0,.35,1.7]){const p=church.frame.toWorld(x,z);ray.set(new Vector3(p.x,shared.qa.northStair.top+.5,p.z),new Vector3(0,-1,0));ray.far=.65;const hits=ray.intersectObjects([church.group,shared.group],true),hit=hits[0],coplanarPortal=hits.some(h=>h.object.userData.component==='portada-norte'&&h.object.userData.materialKind==='trim'&&h.face?.normal.y>.99&&Math.abs(h.point.y-shared.qa.northStair.top)<.0001);thresholdRays.push({local:[x,z],hit:hit?.object.name??null,y:hit?.point.y??null,coplanarPortal});}
check(thresholdRays.every(r=>r.hit&&Math.abs(r.y-shared.qa.northStair.top)<.06),'Continuous stone connects the landing to the recessed north doorway',thresholdRays);
check(thresholdRays.every(r=>!r.coplanarPortal),'Doorway archivolts have no bottom bar coplanar with the walking surface');
check(shared.qa.northApron.spans.length===2&&shared.qa.northApron.spans[0].from<-27.82&&shared.qa.northApron.spans[1].to>=14.78,'Pavement covers both complete ends of the mapped north wall');
check(shared.qa.northStair.plaqueDimensionsM[0][0]===1.67&&shared.qa.northStair.plaqueDimensionsM[1][0]===1.23,'Published inscription block dimensions are retained');
const result={pass:checks.every(c=>c.pass),date:'2026-11-26',checks,triangleCount,context:shared.stats,northStair:shared.qa.northStair,northApron:shared.qa.northApron,limitations:['MDT and the registered church floor are not a new measured street survey.','Piers, crest moulding and stone finishes are simplified from photographic evidence.','This checks exact Three.js geometry and terrain, not a browser screenshot.']};
fs.mkdirSync('research/validation-v47',{recursive:true});
fs.writeFileSync('research/validation-v47/santa-maria-public-realm.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:result.pass,checks:checks.length,failed:checks.filter(c=>!c.pass),triangleCount,context:shared.stats,terrainProbes:probes},null,2));
complete.dispose();shared.dispose();terrain.geometry.dispose();
if(!result.pass)process.exitCode=1;
