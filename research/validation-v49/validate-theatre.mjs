import fs from 'node:fs';
import {THREE,buildTheatreScene} from './theatre-scene.mjs';
const {theatreRoadIds,theatreBuildingIds}=await import('../../dist/js/monuments.js');

const {scene,theatre,visit,guide:theatreData,geo,elevation,heightAt:rawHeight,terrain,terrainMesh,monuments,buildMs,groundBinding}=await buildTheatreScene();
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const errors=[],checks=[],assert=(condition,label)=>{checks.push({pass:!!condition,label});if(!condition)errors.push(label);};
const vector=a=>new THREE.Vector3(...a),ray=new THREE.Raycaster();
assert(Object.keys(visit.focuses).length===16&&theatreData.stops.every(s=>visit.focuses[s.id]),'all 16 documented stop IDs resolve to model focuses');
assert(visit.stats.sourceKeys.every(id=>theatreData.sources.some(s=>s.id===id)),'model references resolve to the displayed bibliography');
assert(visit.qa.documentedDimensions.orchestra===16&&visit.qa.documentedDimensions.upperPortico===79,'orchestra and principal cavea dimensions match archaeological measurements');
assert(visit.qa.seating.length===23&&visit.qa.seating.filter(r=>r.order==='ima-cavea').length===6&&visit.qa.seating.filter(r=>r.order==='media-cavea').length===8&&visit.qa.seating.filter(r=>r.order==='summa-cavea').length===9,'the documented 6 / 8 / 9 seating orders are represented');
assert(visit.qa.underground.aulaeumCells===16&&visit.qa.underground.transverseWalls===17&&visit.qa.underground.channelWidth===1.42,'the didactic curtain trench preserves documented structural counts and width');
assert(!visit.qa.underground.ancientStageHeightKnown,'ancient stage elevation is not passed off as measured');
assert(theatreBuildingIds.has('cat-3556901YJ3935N_part1-0')&&theatreBuildingIds.has('cat-3556901YJ3935N_part2-0'),'both cadastral theatre duplicates are excluded from context');
assert(['733413579','733413580','733413581','1499124508'].every(id=>theatreRoadIds.has(id)),'internal mapped paths remain replaced by architectural circulation');
let finite=true,meshCount=0,topTriangles=0,buried=0,minClearance=Infinity;const buriedSamples=[];
const surfaceComponents=new Set(['orchestra','proedria','ima-cavea','media-cavea','summa-cavea','proscaenium','hyposcaenium']);
theatre.traverse(o=>{
 if(!o.isMesh)return;meshCount++;
 for(const a of Object.values(o.geometry.attributes))for(const value of a.array)if(!Number.isFinite(value))finite=false;
 if(!surfaceComponents.has(o.userData.component))return;
 const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;
 for(let i=0;i<p.count;i+=3){
  if(n.getY(i)<.8)continue;
  const point=new THREE.Vector3((p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3).applyMatrix4(o.matrixWorld);
  const ground=terrain.meshHeightAt(point.x,point.z),clearance=point.y-ground;topTriangles++;minClearance=Math.min(minClearance,clearance);
  if(clearance<-.06){buried++;if(buriedSamples.length<20)buriedSamples.push({mesh:o.name,point:point.toArray(),ground,clearance});}
 }
});
assert(finite,'all geometry attributes are finite');assert(buried===0,'top surfaces remain above the final interpolated terrain');
const openings=[];
for(const opening of [...visit.qa.openings,visit.qa.drainOpening]){
 const origin=vector(opening.origin),direction=vector(opening.direction),side=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();let clear=0,total=0;const hits=[];
 for(const u of[-.40,0,.40])for(const height of[-.25,0,.25]){
  const point=origin.clone().addScaledVector(side,u);point.y+=height;ray.set(point,direction);ray.far=opening.distance;
  const meshHit=ray.intersectObject(theatre,true).find(h=>h.object.isMesh&&h.object.visible),terrainHit=ray.intersectObject(terrainMesh,false)[0];total++;
  if(!meshHit&&!terrainHit)clear++;else hits.push({u,height,mesh:meshHit?.object.name,meshPoint:meshHit?.point.toArray(),terrainPoint:terrainHit?.point.toArray()});
 }
 openings.push({id:opening.id,total,clear,hits});assert(clear===total,opening.id+' has an open 3D passage and terrain clearance');
}

// Independent regression fixtures for the gaps found during the V49 visual
// review. They query the effective meshes, not the model's QA declarations.
// The rear floor level is an authored interpretation; this test preserves
// continuous flooring at that level without presenting it as Roman evidence.
const scenicFloorFixtures=[
 {id:'central-exedra-floor',local:[0,1.2,-12]},
 {id:'western-exedra-floor',local:[-14.05,1.2,-12]},
 {id:'eastern-exedra-floor',local:[14.05,1.2,-12]},
 {id:'western-rear-circulation-floor',local:[-5,2.15,-16.8]},
 {id:'eastern-rear-circulation-floor',local:[5,2.15,-16.8]}
];
const scenicFloors=[];
for(const fixture of scenicFloorFixtures){
 const [x,expectedY,z]=fixture.local,origin=theatre.localToWorld(vector([x,expectedY+.8,z]));
 ray.set(origin,new THREE.Vector3(0,-1,0));ray.far=2;
 const hit=ray.intersectObject(theatre,true).find(h=>h.object.isMesh&&h.object.visible),localHit=hit?theatre.worldToLocal(hit.point.clone()).toArray():null;
 const pass=!!hit&&hit.object.userData.component==='proscaenium'&&hit.object.userData.period==='contemporary'&&Math.abs(localHit[1]-expectedY)<.025;
 scenicFloors.push({id:fixture.id,expectedLocal:fixture.local,rayOrigin:origin.toArray(),rayDistance:2,hitMesh:hit?.object.name||null,hitLocal:localHit,pass});
 assert(pass,fixture.id+' has a contemporary floor at the expected level, rather than a void to the substructures');
}

const openVolumeFixtures=[
 {id:'air-above-low-exedras',origins:[[4,7.2,-5]],direction:[0,0,-1],distance:10.1},
 // Three heights test the full central interruption, including the height of
 // the previous continuous wall. A ray above that wall alone would miss it.
 {id:'central-upper-crown-interruption',origins:[[0,15.6,36.5],[0,17.5,36.5],[0,19,36.5]],direction:[0,0,1],distance:2.5}
];
const openVolumes=[];
for(const fixture of openVolumeFixtures){
 const samples=fixture.origins.map(localOrigin=>{
  const origin=theatre.localToWorld(vector(localOrigin)),direction=vector(fixture.direction).transformDirection(theatre.matrixWorld);
  ray.set(origin,direction);ray.far=fixture.distance;
  const hit=ray.intersectObject(theatre,true).find(h=>h.object.isMesh&&h.object.visible);
  return{localOrigin,origin:origin.toArray(),direction:direction.toArray(),distance:fixture.distance,clear:!hit,hitMesh:hit?.object.name||null,hitLocal:hit?theatre.worldToLocal(hit.point.clone()).toArray():null};
 });
 const pass=samples.every(sample=>sample.clear);openVolumes.push({id:fixture.id,samples,pass});
 assert(pass,fixture.id+' remains geometrically open instead of being closed by a full-height wall');
}

// The projecting landings originally overlaid an unbroken walkway plate at
// exactly +1.20. Cast inside that former overlap, off triangle diagonals, and
// keep all intersections: deduplicating equal hit positions would hide the
// double surface and its resulting z-fighting.
const rearWalkway=[];
const walkwayProbe=(x,z)=>{
 const origin=theatre.localToWorld(vector([x,2,z]));ray.set(origin,new THREE.Vector3(0,-1,0));ray.far=1.05;
 const hits=ray.intersectObject(theatre,true).filter(h=>h.object.isMesh&&h.object.visible);
 const topHits=hits.filter(h=>h.face.normal.y>.95&&Math.abs(theatre.worldToLocal(h.point.clone()).y-1.2)<.005);
 return{local:[x,1.2,z],rayOrigin:origin.toArray(),upperSurfaceCount:topHits.length,hits:topHits.map(h=>({mesh:h.object.name,faceIndex:h.faceIndex,local:theatre.worldToLocal(h.point.clone()).toArray()})),pass:topHits.length===1&&topHits[0].object.userData.component==='escena-posterior'&&topHits[0].object.userData.materialKind==='metal'};
};
for(const x of[-14.05,0,14.05]){
 const sample=walkwayProbe(x+.23,-23.72),id='rear-walkway-landing-'+x;
 rearWalkway.push({id,samples:[sample],pass:sample.pass});
 assert(sample.pass,id+' has exactly one effective upper surface at +1.20 inside the former overlap');
}
// Independent coordinates sample both sides of every landing joint as well
// as the connecting spans. They avoid shared edges where a single continuous
// triangulated surface can legitimately return two triangle intersections.
const walkwayContinuityXs=[-21.7,-15.635,-15.565,-12.535,-12.465,-8,-1.985,-1.915,1.915,1.985,8,12.465,12.535,15.565,15.635,21.7];
const walkwayContinuity=walkwayContinuityXs.map(x=>walkwayProbe(x,-23.72));
const walkwayContinuous=walkwayContinuity.every(sample=>sample.pass);
rearWalkway.push({id:'rear-walkway-continuity',samples:walkwayContinuity,pass:walkwayContinuous});
assert(walkwayContinuous,'rear metal walkway remains continuous and single-faced across its six landing joints and connecting spans');

// V49 roof regression: the scenic walls, coping and basilica lids previously
// produced up to four coincident faces at +20.20, while four .425 m edge bands
// had no roof. These fixed probes are independent of the cap partition code.
// Retain all triangle hits; a coincident second face must fail the check.
const roofCrownFixtures=[
 ['west-front-wall-junction',-24.2,-18.3],['east-front-wall-junction',24.3,-18.3],
 ['west-rear-wall-junction',-24.2,-22.7],['east-rear-wall-junction',24.3,-22.85],
 ['west-end-wall-junction',-26.23,-20.35],['east-end-wall-junction',26.23,-20.35],
 ['west-triple-junction',-26.23,-22.75],['east-triple-junction',26.23,-22.75],
 ['rear-coping-centre',.23,-22.75],['west-front-corner',-35.6,-7.3],
 ['west-front-edge-gap',-30,-7.65],['west-rear-edge-gap',-30,-23.62],
 ['east-front-edge-gap',30,-7.85],['east-rear-edge-gap',30,-22.42],
 ['west-roof-control',-30,-15],['east-roof-control',30,-15]
];
const roofCrownJoins=[];
for(const[id,x,z]of roofCrownFixtures){
 const origin=theatre.localToWorld(vector([x,21.2,z]));ray.set(origin,new THREE.Vector3(0,-1,0));ray.far=2;
 const hits=ray.intersectObject(theatre,true).filter(h=>h.object.isMesh&&h.object.visible&&h.face.normal.y>.95&&Math.abs(theatre.worldToLocal(h.point.clone()).y-20.2)<.0001);
 const pass=hits.length===1&&['basilicas','escena-posterior'].includes(hits[0].object.userData.component);
 roofCrownJoins.push({id,local:[x,20.2,z],rayOrigin:origin.toArray(),rayDistance:2,upperSurfaceCount:hits.length,hits:hits.map(h=>({mesh:h.object.name,faceIndex:h.faceIndex,local:theatre.worldToLocal(h.point.clone()).toArray()})),pass});
 assert(pass,id+' has exactly one effective crown face at +20.20, without a roof gap or coplanar overlap');
}

const initial=new Map();theatre.traverse(o=>{if(o.isMesh)initial.set(o,{material:o.material,color:o.material.color.clone(),map:o.material.map,visible:o.visible});});
for(const stop of theatreData.stops){assert(visit.selectFocus(stop.id)?.id===stop.id,'focus selection '+stop.id);visit.setReadingMode('periods');}
visit.selectFocus(null);visit.setReadingMode('materials');visit.setSection(true);
assert([...initial.keys()].filter(m=>['cubierta','proscaenium'].includes(m.userData.component)).every(m=>!m.visible),'section removes the contemporary roof and stage deck');
assert([...initial.keys()].filter(m=>['hyposcaenium','aulaeum','cloaca'].includes(m.userData.component)).every(m=>m.visible),'documented schematic substructures remain present in section');
visit.setSection(false);
assert([...initial].every(([mesh,v])=>mesh.material===v.material&&mesh.material.color.equals(v.color)&&mesh.material.map===v.map&&mesh.visible===v.visible),'selection, period reading and cutaway restore original resources and visibility');
const {theatre:other}=await buildTheatreScene(),firstMaterials=new Set(theatre.userData.ownedResources.materials);
assert(other.userData.ownedResources.materials.every(m=>!firstMaterials.has(m)),'theatre instances never share disposable material caches');
assert(other.userData.ownedResources.textures.every(t=>!theatre.userData.ownedResources.textures.includes(t)),'theatre instances never share disposable textures');
const cameraResults=[],accessSightlines=[],accessFocusIds=new Set(['teatro-aditus-oriental','teatro-vomitoria']);
for(const stop of theatreData.stops){const focus=visit.focuses[stop.id];
 for(const near of[false,true]){const offset=vector(near?focus.closeOffset:focus.offset),position=focus.target.clone().add(offset),direction=focus.target.clone().sub(position),clearance=position.y-terrain.meshHeightAt(position.x,position.z);ray.set(position,direction.clone().normalize());ray.far=direction.length()-.05;const hit=ray.intersectObject(terrainMesh,false)[0];
  cameraResults.push({id:stop.id,near,clearance,terrainHit:hit?hit.point.toArray():null});assert(clearance>=1.55,stop.id+' '+(near?'near':'full')+' camera stays above rendered terrain');assert(!hit,stop.id+' '+(near?'near':'full')+' camera target is not hidden by terrain');
  if(accessFocusIds.has(stop.id)){
   // Read the actual bound camera positions, then test architecture as well as
   // terrain. The prior elevated / oblique eyes passed terrain-only checks but
   // looked into a vault or a seating sector instead of through the opening.
   const meshHit=ray.intersectObject(theatre,true).find(h=>h.object.isMesh&&h.object.visible),pass=!meshHit&&!hit;
   accessSightlines.push({id:stop.id,near,eye:position.toArray(),target:focus.target.toArray(),eyeLocal:theatre.worldToLocal(position.clone()).toArray(),targetLocal:theatre.worldToLocal(focus.target.clone()).toArray(),rayDistance:ray.far,architectureHit:meshHit?{mesh:meshHit.object.name,point:meshHit.point.toArray(),local:theatre.worldToLocal(meshHit.point.clone()).toArray(),distance:meshHit.distance}:null,terrainHit:hit?hit.point.toArray():null,pass});
   assert(pass,stop.id+' '+(near?'near':'full')+' camera sees its access through actual architecture and final terrain');
  }
 }
}
fs.mkdirSync('research/validation-v49',{recursive:true});
fs.writeFileSync('dist/assets/data/theatre-plan.json',JSON.stringify({schemaVersion:1,...visit.plan},null,2));
const regressions={scenicFloors,openVolumes,accessSightlines,rearWalkway,roofCrownJoins};
const result={pass:!errors.length,buildMs,groundBinding,stats:visit.stats,rehabilitation:visit.qa.rehabilitation,checks,errors,openings,regressions,terrain:{topTriangles,buried,minClearance,buriedSamples},cameras:cameraResults,limitations:['Metric schematic architecture registered to supplied OSM / PNOA, not photogrammetry.','Conserved and rehabilitated state; no fictitious fully restored Roman scaenae frons.','Cutaway removes contemporary roof and deck, exposing interpretive archaeological substructures.','Physical access and pedestrian collision are not certified by camera tours.']};
fs.writeFileSync('research/validation-v49/theatre-geometry.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:result.pass,buildMs,stats:visit.stats,checks:checks.length,errors,openings:openings.filter(o=>o.clear!==o.total),regressions:Object.fromEntries(Object.entries(regressions).map(([name,items])=>[name,{cases:items.length,passed:items.filter(item=>item.pass).length,failures:items.filter(item=>!item.pass)}])),terrain:result.terrain,cameraIssues:cameraResults.filter(c=>c.terrainHit)},null,2));
if(errors.length)process.exitCode=1;
