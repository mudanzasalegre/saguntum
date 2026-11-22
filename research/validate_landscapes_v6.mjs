import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerArchaeology} from '../dist/js/archaeology.js';
import {registerPortHeritage} from '../dist/js/port.js';
import {registerCoastHeritage} from '../dist/js/coast.js';
import {registerLandscapes,landscapeRegions,landscapeRoadExclusions,createLandscapeHeritage,inLandscapeBounds} from '../dist/js/landscapes.js';
import {createHeightSampler,buildTerrainGeometry} from '../dist/js/terrain.js';
import {createUrbanSurface,pointInPolygon} from '../dist/js/urban-surface.js';
import {createLandscapeWaterMask,createLandscapeEnvironment,createLandscapeWaterGeometry} from '../dist/js/landscape-environment.js';

const inputHashes={};const read=name=>{const file='dist/assets/data/'+name+'.json',bytes=fs.readFileSync(file);inputHashes[file]=createHash('sha256').update(bytes).digest('hex');return JSON.parse(bytes);};
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const checks=[],errors=[],warnings=[],check=(pass,label)=>{checks.push({pass:!!pass,label});if(!pass)errors.push(label);};
const encode=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null;
const exportIndex=process.argv.indexOf('--export'),exportDir=exportIndex>=0?path.resolve(process.argv[exportIndex+1]||'/tmp/saguntum-landscapes-v6'):null;
if(exportDir)fs.mkdirSync(exportDir,{recursive:true});
registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
registerPortHeritage(['port-industrial','port-garden','port-workers'].map(read),catalog,byId,tourOrder);
registerCoastHeritage(['coast-pier','coast-grau','coast-archaeology'].map(read),catalog,byId,tourOrder);
const records=registerLandscapes(['landscape-marjal','landscape-dunes','landscape-palancia'].map(read),catalog,byId,tourOrder),configs=read('landscape-regions');
check(catalog.length===31&&new Set(catalog.map(c=>c.id)).size===31,'31 unique catalogue places');
check(tourOrder.length===31&&new Set(tourOrder).size===31&&tourOrder.every(id=>byId[id]),'31 valid and unique full-tour stops');
check(landscapeRegions.length===3&&Object.keys(records).length===3,'Three natural landscape regions');
check(Object.values(records).map(r=>r.number).join(',')==='27,28,29','Landscape numbering 27–29');
const app=fs.readFileSync('dist/js/app.js','utf8');
check(app.includes('heightAt:land.terrain.meshHeightAt,project,records:landscapeRecords'),'Application models use the visible terrain mesh sampler');
check(app.includes('!excludedRoads.has(String(r.osmId||r.id))'),'Application excludes detailed boardwalk/bridge roads before terrain construction');
const results=[];let focusCount=0;
function visible(object){for(let p=object;p;p=p.parent)if(!p.visible)return false;return true;}
function geometryAudit(group){
 const report={meshes:0,triangles:0,nonfinite:0,invalidIndices:0,degenerateBaseTriangles:0,attributeBytes:0};const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3();
 group.traverse(object=>{if(!object.isMesh)return;report.meshes++;const g=object.geometry,p=g.attributes.position,ix=g.index?.array,n=ix?.length||p.count;report.triangles+=n/3*(object.isInstancedMesh?object.count:1);
  for(const attribute of Object.values(g.attributes)){report.attributeBytes+=attribute.array.byteLength;for(const x of attribute.array)if(!Number.isFinite(x))report.nonfinite++;}
  if(object.instanceMatrix){report.attributeBytes+=object.instanceMatrix.array.byteLength;for(const x of object.instanceMatrix.array)if(!Number.isFinite(x))report.nonfinite++;}
  if(object.instanceColor)for(const x of object.instanceColor.array)if(!Number.isFinite(x))report.nonfinite++;
  if(ix)for(const x of ix)if(x>=p.count)report.invalidIndices++;
  for(let i=0;i<n;i+=3){a.fromBufferAttribute(p,ix?ix[i]:i);b.fromBufferAttribute(p,ix?ix[i+1]:i+1);c.fromBufferAttribute(p,ix?ix[i+2]:i+2);if(u.subVectors(b,a).cross(v.subVectors(c,a)).lengthSq()<1e-18)report.degenerateBaseTriangles++;}
 });return report;
}
function addBase(group,terrain,shape){
 const vertices=[],indices=[],colors=[],color=new THREE.Color('#7d8265');
 for(const b of terrain.border){vertices.push(b.x,b.y,b.z,b.x,-28,b.z);colors.push(color.r,color.g,color.b,color.r*.64,color.g*.64,color.b*.64);}
 for(let i=0;i<terrain.border.length;i++){const a=i*2,b=((i+1)%terrain.border.length)*2;indices.push(a,a+1,b,a+1,b+1,b);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const side=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide}));side.name='Decorative terrain cut · no geological claim';group.add(side);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1,1,6,160),new THREE.MeshStandardMaterial({color:'#344943',roughness:1}));base.scale.set(shape.rx,1,shape.rz);base.position.set(shape.cx,-31,shape.cz);base.name='Elliptical exhibition plinth';group.add(base);
}
function reflectionAudit(region,environment,scene,water,project,mask){
 const camera=new THREE.PerspectiveCamera(38,1,.1,20000);camera.position.set(2500,5000,7000);camera.lookAt(2500,0,5000);camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
 const mirrors=environment.waters.filter(w=>w.isWater),initialTarget={name:'main render target'};let currentTarget=initialTarget,calls=0,nested=0;
 const setTarget=function(target){currentTarget=target;},renderer={getRenderTarget:()=>currentTarget,setRenderTarget:setTarget,xr:{enabled:true},shadowMap:{autoUpdate:true},state:{buffers:{depth:{setMask(){}}}},autoClear:true,render(){calls++;scene.traverse(o=>{if(o.isWater&&o.visible)nested++;});for(const mirror of mirrors)mirror.onBeforeRender(renderer,scene,camera);}};
 environment.invalidate();for(const mirror of mirrors)mirror.onBeforeRender(renderer,scene,camera);
 check(calls===mirrors.length&&nested===0,region+' reflection pass hides other Water meshes and rejects recursion');
 check(renderer.setRenderTarget===setTarget&&currentTarget===initialTarget&&renderer.xr.enabled&&renderer.shadowMap.autoUpdate&&mirrors.every(m=>m.visible),region+' reflection restores renderer and mesh state');
 if(mirrors.length){const before=calls;mirrors[0].onBeforeRender(renderer,scene,camera);check(calls===before,region+' reflections are throttled');
  const previousRender=renderer.render;renderer.render=()=>{throw Error('simulated render failure');};environment.invalidate();let caught=false;try{mirrors[0].onBeforeRender(renderer,scene,camera);}catch(e){caught=e.message==='simulated render failure';}
  check(caught&&renderer.setRenderTarget===setTarget&&currentTarget===initialTarget&&renderer.xr.enabled&&renderer.shadowMap.autoUpdate&&mirrors.every(m=>m.visible),region+' failed reflection restores renderer state');renderer.render=previousRender;mirrors[0].onBeforeRender(renderer,scene,camera);
  environment.update(.016);check(mirrors[0].material.uniforms.time.value>0,region+' enabled water animation advances');
 }
 const reduced=createLandscapeEnvironment({data:water,project,mask,mobile:true,reduced:true});reduced.update(10);check(reduced.waters.filter(w=>w.isWater).every(w=>w.material.uniforms.time.value===0)&&reduced.waters.filter(w=>w.material.normalMap).every(w=>w.material.normalMap.offset.length()===0),region+' reduced motion freezes waves and normal-map scrolling');reduced.dispose();reduced.dispose();environment.setLight('golden');
 return{passes:calls,nestedReflectors:nested,reducedMotion:true,restoredAfterError:true};
}
function exportScene(region,scene,cameras){
 const meshes=[];scene.updateMatrixWorld(true);
 scene.traverse(object=>{if(!object.isMesh||!visible(object))return;const g=object.geometry,m=Array.isArray(object.material)?object.material[0]:object.material,water=!!object.userData.landscapeWater,color=m.color||m.uniforms?.waterColor?.value||new THREE.Color('#7f8768');
  meshes.push({name:object.name,positions:encode(g.attributes.position.array),indices:encode(g.index?.array),colors:encode(g.attributes.color?.array),colorSize:g.attributes.color?.itemSize||3,uv:encode(g.attributes.uv?.array),matrix:object.matrixWorld.toArray(),instances:object.isInstancedMesh?encode(object.instanceMatrix.array):null,instanceColors:encode(object.instanceColor?.array),material:{color:color.toArray(),roughness:water?.16:m.roughness??1,metalness:m.metalness||0,orthophoto:!!object.userData.orthophoto,water,opacity:m.opacity??1,transparent:m.transparent||false}});
 });
 const payload={region,meshes,cameras,terrainImage:path.resolve('dist/assets/data/'+region+'-orthophoto.jpg'),note:'CPU geometry QA: real display terrain + natural-landscape model + water polygons. Context city is validated separately. Water material uses Blender reflection for inspection, not the application WebGL shader.'};
 fs.writeFileSync(path.join(exportDir,region+'-geometry.json.gz'),zlib.gzipSync(JSON.stringify(payload),{level:4}));
}
for(const region of landscapeRegions){
 const start=performance.now(),geo=read(region+'-cartography'),elevation=read(region+'-elevation'),water=read(region+'-water'),config=configs[region],record=Object.values(records).find(r=>r.region===region),rawHeight=createHeightSampler(elevation),mask=createLandscapeWaterMask(water,project),ground=mask.groundHeight(rawHeight),excluded=landscapeRoadExclusions(record),cityData={...geo,roads:geo.roads.filter(r=>!excluded.has(String(r.osmId||r.id)))};
 const times={};let t=performance.now();const urban=createUrbanSurface({data:cityData,project,heightAt:ground,roadSampleStep:5});times.urbanMs=performance.now()-t;t=performance.now();
 const terrain=buildTerrainGeometry(elevation,urban.groundHeight,[],{shape:config.shape,core:config.core,coreStep:config.coreStep,outerStep:config.outerStep});times.terrainMs=performance.now()-t;t=performance.now();
 const heritage=createLandscapeHeritage(region,{heightAt:terrain.meshHeightAt,project,records,data:geo});times.heritageMs=performance.now()-t;t=performance.now();
 const environment=createLandscapeEnvironment({data:water,project,mask});environment.setLight('golden');times.environmentMs=performance.now()-t;
 const scene=new THREE.Group(),terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce',roughness:1}));terrainMesh.name='Actual display mesh · '+region;terrainMesh.userData.orthophoto=true;scene.add(terrainMesh,heritage.group,environment.group);addBase(scene,terrain,config.shape);scene.updateMatrixWorld(true);
 const site=heritage.sites[record.id],inBounds=inLandscapeBounds(config.shape),focuses=[],cameras=[],low=[],ray=new THREE.Raycaster(),mapped=new Map((record.observationPoints||[]).map(o=>[o.id,o]));
 check(Object.keys(site.focuses).length===mapped.size,region+' 2D observation points match 3D focuses');
 check(cityData.roads.every(r=>!excluded.has(String(r.osmId||r.id))),region+' avoids duplicate roads under detailed walking structures');
 for(const [id,f]of Object.entries(site.focuses)){
  focusCount++;const vectors=[f.point,...(f.position?[f.position]:[]),...(f.target?[f.target]:[])];check(vectors.every(v=>v.isVector3&&v.toArray().every(Number.isFinite)),region+'/'+id+' finite vectors');check(vectors.every(v=>inBounds(v.x,v.z)),region+'/'+id+' points are inside the landscape ellipse');check(mapped.has(id),region+'/'+id+' available in 2D');
  const position=f.position?.clone()||f.point.clone().add(new THREE.Vector3(...f.offset)),target=f.target?.clone()||f.point.clone();cameras.push({id,position:position.toArray(),target:target.toArray()});focuses.push({id,point:f.point.toArray(),position:position.toArray(),target:target.toArray()});
  if(f.position){
   const meshLevel=terrain.meshHeightAt(position.x,position.z);ray.set(position,new THREE.Vector3(0,-1,0));ray.far=10;const hit=ray.intersectObject(site.currentGroup,true).find(h=>visible(h.object));const floor=Math.max(meshLevel,hit?.point.y??-Infinity),height=position.y-floor,meshHeight=position.y-meshLevel;
   low.push({id,heightAboveDisplayMesh:meshHeight,heightAboveVisibleFloor:height,floorMesh:hit?.object.name||'terrain',distanceToTarget:position.distanceTo(target),insideWater:mask.isWater(position.x,position.z)});
   check(height>=1.5&&height<=1.9,region+'/'+id+' pedestrian eye height between 1.5 and 1.9 m');check(position.distanceTo(target)>=4,region+'/'+id+' camera distance respects OrbitControls minimum 4 m');check(!mask.isWater(position.x,position.z),region+'/'+id+' low viewpoint is outside open water');
   if(region==='marjal'||region==='palancia')check(Math.abs(height-1.65)<.035,region+'/'+id+' eye height 1.65 m above visible floor');
  }
 }
 const firstPlant=(()=>{let result;site.vegetation.traverse(o=>{if(!result&&o.isMesh)result=o;});return result;})();
 check(site.vegetation.parent===site.group,region+' vegetation reparented independently of monument visibility');
 site.currentGroup.visible=false;check(visible(firstPlant),region+' disabling structures retains vegetation');site.currentGroup.visible=true;site.vegetation.visible=false;check(visible(site.currentGroup),region+' disabling vegetation retains structures');site.vegetation.visible=true;
 const holes=[];for(const surface of mask.surfaces)for(const hole of surface.holes){let point=null;const candidate=hole.reduce((q,p)=>({x:q.x+p.x/hole.length,z:q.z+p.z/hole.length}),{x:0,z:0});if(pointInPolygon(candidate.x,candidate.z,hole))point=candidate;else for(let i=1;i<hole.length-1&&!point;i++){const p={x:(hole[0].x+hole[i].x+hole[i+1].x)/3,z:(hole[0].z+hole[i].z+hole[i+1].z)/3};if(pointInPolygon(p.x,p.z,hole))point=p;}
  if(point){ray.set(new THREE.Vector3(point.x,surface.levelM+100,point.z),new THREE.Vector3(0,-1,0));ray.far=200;const hits=ray.intersectObject(environment.group,true);check(hits.length===0,region+' water hole remains unfilled in '+surface.id);check(ground(point.x,point.z)===rawHeight(point.x,point.z),region+' water hole retains source terrain');holes.push({surface:surface.id,point,rayHits:hits.length});}
 }
 const waterClearance=[];let maxAreaError=0;for(const surface of mask.surfaces){const g=createLandscapeWaterGeometry([surface]),p=g.attributes.position,ix=g.index.array;let area=0,occludedArea=0,maxGroundAboveWater=0;for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2];const triangleArea=Math.abs((p.getX(b)-p.getX(a))*(p.getY(c)-p.getY(a))-(p.getY(b)-p.getY(a))*(p.getX(c)-p.getX(a)))*.5;area+=triangleArea;const x=(p.getX(a)+p.getX(b)+p.getX(c))/3,z=-(p.getY(a)+p.getY(b)+p.getY(c))/3,clearance=terrain.meshHeightAt(x,z)-surface.levelM;if(clearance>.03)occludedArea+=triangleArea;maxGroundAboveWater=Math.max(maxGroundAboveWater,clearance);}maxAreaError=Math.max(maxAreaError,Math.abs(area-surface.areaM2)/surface.areaM2);waterClearance.push({id:surface.id,areaM2:surface.areaM2,centroidEstimatedOccludedPercent:100*occludedArea/area,maxGroundAboveWaterM:maxGroundAboveWater});g.dispose();}check(maxAreaError<.001,region+' triangulated water respects polygon and hole areas');check(environment.stats.planarReflections<=2,region+' has at most two planar reflections');
 const dryChecks=[];if(region==='palancia')for(const id of ['urbano','puentes','aluvial','canet']){const p=site.focuses[id].point,wet=mask.isWater(p.x,p.z);dryChecks.push({id,wet});check(!wet,'Palancia '+id+' remains a dry channel');}
 if(region==='marjal')check(mask.surfaces.every(s=>!String(s.id).includes('14371582')),'Marjal intermittent relation 14371582 has no permanent water sheet');
 const reflections=reflectionAudit(region,environment,scene,water,project,mask);const geometry=geometryAudit(scene),heritageGeometry=geometryAudit(heritage.group);check(geometry.nonfinite===0&&geometry.invalidIndices===0,region+' all geometry and instance data are finite and indexed correctly');check(heritageGeometry.degenerateBaseTriangles===0,region+' landscape model has no degenerate base triangles');if(geometry.degenerateBaseTriangles>heritageGeometry.degenerateBaseTriangles)warnings.push(region+' has '+(geometry.degenerateBaseTriangles-heritageGeometry.degenerateBaseTriangles)+' degenerate triangles outside the landscape model.');
 const shape=config.shape,overviewTarget=new THREE.Vector3(shape.cx,5,shape.cz),r=Math.max(shape.rx,shape.rz);cameras.push({id:'overview',position:overviewTarget.clone().add(new THREE.Vector3(r*.75,r*1.45,r*1.2)).toArray(),target:overviewTarget.toArray()});
 if(exportDir)exportScene(region,scene,cameras);
 results.push({region,id:record.id,times,totalMs:performance.now()-start,terrain:terrain.geometry.userData,sourceSamples:elevation.width*elevation.height,terrainVertices:terrain.geometry.attributes.position.count,terrainTriangles:terrain.geometry.index.count/3,geometry,heritage:site.stats,water:environment.stats,waterAreaMaximumRelativeError:maxAreaError,waterClearance,reflections,holes,dryChecks,focuses,low,excludedRoadIds:[...excluded],vegetationIndependent:true});
 environment.dispose();console.log(region+': '+Object.keys(site.focuses).length+' focuses, '+geometry.triangles+' integrated triangles, '+Math.round(performance.now()-start)+' ms');
}
check(focusCount===21,'21 total natural-landscape observation focuses');
for(const file of ['landscape-marjal','landscape-dunes','landscape-palancia','landscape-environment','landscapes','terrain','urban-surface']){const filename='dist/js/'+file+'.js';inputHashes[filename]=createHash('sha256').update(fs.readFileSync(filename)).digest('hex');}
const result={inputHashes,pass:errors.length===0,created:new Date().toISOString(),catalog:catalog.length,tourStops:tourOrder.length,landscapeRegions,focusCount,checks,errors,warnings,regions:results,exportDirectory:exportDir,scope:'Geometry, camera, terrain, water and vegetation integration. Context city checked separately; Blender previews inspect geometry rather than compile the WebGL shader.'};
fs.writeFileSync('research/qa-v6-landscapes.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,checks:checks.length,errors,warnings,focusCount,regions:results.map(r=>({region:r.region,low:r.low,water:r.water.surfaces,triangles:r.geometry.triangles}))},null,2));if(errors.length)process.exitCode=1;
