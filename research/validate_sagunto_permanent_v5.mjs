import fs from 'node:fs';import zlib from 'node:zlib';import * as THREE from 'three';
import {createHeightSampler,buildTerrainGeometry,terrainShape,inBounds} from '../dist/js/terrain.js';
import {createMonuments} from '../dist/js/monuments.js';import {createSacredHeritage} from '../dist/js/heritage-sacred.js';import {createCivicHeritage} from '../dist/js/heritage-civic.js';import {createUrbanSurface} from '../dist/js/urban-surface.js';import {createCity} from '../dist/js/city.js';import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerArchaeology,createArchaeology} from '../dist/js/archaeology.js';
import {createExcavationController,insideExcavation,excavationPlanes,openPermanentExcavations} from '../dist/js/excavation.js';
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>context})};
const read=x=>JSON.parse(fs.readFileSync('dist/assets/data/'+x+'.json'));
const geo=read('cartography'),elevation=read('elevation'),siteData=read('landmarks'),landmarks=Object.fromEntries(siteData.sites.map(s=>[s.id,s]));const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),rawHeight=createHeightSampler(elevation);
const scene=new THREE.Group(),times={},start=performance.now();let timer=start;
const monuments=createMonuments({heightAt:rawHeight,project,data:geo});scene.add(monuments.group);const sacred=createSacredHeritage({heightAt:rawHeight,project,landmarks});scene.add(sacred.group);const civic=createCivicHeritage({heightAt:rawHeight,project,landmarks});scene.add(civic.group);times.monumentsMs=performance.now()-timer;timer=performance.now();
const records=registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
const archaeology=createArchaeology({heightAt:rawHeight,project,records});scene.add(archaeology.group);
const points={...monuments.points,...sacred.points,...civic.points,...archaeology.points},views={...sacred.views,...civic.views,...archaeology.views};
const excludeBuildingIds=new Set(siteData.sites.flatMap(s=>s.osmIds||[]).filter(id=>id.startsWith('way/')).map(id=>id.split('/')[1]));civic.group.children.forEach(g=>(g.userData.osmContextFootprints||[]).forEach(id=>excludeBuildingIds.add(String(id))));
excludeBuildingIds.add('203140142');
const excludedRoads=new Set(['733321149','733321150','1419281599']);const urbanData={...geo,roads:geo.roads.filter(r=>!excludedRoads.has(String(r.id)))};
const patches=[...sacred.patches,...civic.patches],exclusions=[...sacred.exclusions,...civic.exclusions];
const urban=createUrbanSurface({data:urbanData,project,heightAt:(x,z)=>monuments.surfaceHeight(x,z,rawHeight(x,z)),patches,exclusions,openPassageIds:new Set([...(landmarks.juderia.osmIds||[]).map(s=>s.split('/')[1]),...(landmarks.juderia.secondaryGates||[]).map(s=>String(s.id))]),collisionPolygons:siteData.sites.filter(s=>s.id!=='juderia'&&s.footprint.length>=3).map(s=>s.footprint.map(c=>project(...c)))});times.urbanMs=performance.now()-timer;timer=performance.now();
const terrain=buildTerrainGeometry(elevation,urban.groundHeight,patches);const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));terrainMesh.name='Terrain IGN';terrainMesh.userData.orthophoto=true;scene.add(terrainMesh);times.terrainMs=performance.now()-timer;timer=performance.now();
const city=createCity({data:geo,project,heightAt:urban.groundHeight,urban,inBounds,excludeBuildingIds,exclusions});scene.add(city.group);times.cityMs=performance.now()-timer;
// Exact cutaway skin geometry uses the same border as the site terrain builder.
const sideP=[],sideC=[],sideI=[],border=terrain.border,layers=6,segments=border.length,colors=['#9b9676','#8e8768','#817b61','#777560','#657165','#536c65'];for(let band=0;band<=layers;band++)for(let i=0;i<=segments;i++){const{x,z,y:top}=border[i%segments],h=top+(-28-top)*(band/layers),c=new THREE.Color(colors[Math.min(band,5)]).multiplyScalar(.95+Math.sin(i*13.37+band)*.05);sideP.push(x,h,z);sideC.push(c.r,c.g,c.b);}for(let r=0;r<layers;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;sideI.push(a,b,a+1,a+1,b,b+1);}const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sideP,3));sg.setAttribute('color',new THREE.Float32BufferAttribute(sideC,3));sg.setIndex(sideI);sg.computeVertexNormals();const sides=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({vertexColors:true}));sides.name='Cutaway';scene.add(sides);const base=new THREE.Mesh(new THREE.CylinderGeometry(1,1,6,160),new THREE.MeshStandardMaterial({color:'#344943'}));base.scale.set(terrainShape.rx,1,terrainShape.rz);base.position.set(terrainShape.cx,-31,terrainShape.cz);base.name='Base';scene.add(base);scene.updateMatrixWorld(true);
const fp=[];for(const patch of patches){if(!patch.polygon?.length||!Number.isFinite(patch.height))continue;const top=patch.height-.04;for(let i=0;i<patch.polygon.length;i++){const a=patch.polygon[i],b=patch.polygon[(i+1)%patch.polygon.length],bottom=Math.min(top-6,urban.groundHeight(a.x,a.z)-3,urban.groundHeight(b.x,b.z)-3);fp.push(a.x,top,a.z,b.x,top,b.z,b.x,bottom,b.z,a.x,top,a.z,b.x,bottom,b.z,a.x,bottom,a.z);}}const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.computeVertexNormals();const foundation=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:'#b4a58a'}));foundation.name='Zócalos bajo las cimentaciones';scene.add(foundation);scene.updateMatrixWorld(true);

const roots=[terrainMesh,city.group,monuments.group,sacred.group,civic.group],window=archaeology.sites.circo.currentMask;
scene.updateMatrixWorld(true);
const ca=Math.cos(window.yaw),sa=Math.sin(window.yaw),worldAt=(u,v)=>({x:window.center.x+u*ca+v*sa,z:window.center.z-u*sa+v*ca});
const inner=[];for(const u of [-.98,-.6,0,.6,.98])for(const v of[-.98,-.6,0,.6,.98])inner.push({label:`inside ${u},${v}`,u:u*window.width/2,v:v*window.depth/2,...worldAt(u*window.width/2,v*window.depth/2)});
const outer=[];for(const margin of[.025,.2,1,4])for(const a of[-.8,0,.8])for(const side of[-1,1]){outer.push({label:`outside U ${side},${a},margin${margin}`,...worldAt(side*(window.width/2+margin),a*window.depth/2)});outer.push({label:`outside V ${side},${a},margin${margin}`,...worldAt(a*window.width/2,side*(window.depth/2+margin))});}
const rc=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
function rays(points,objects){return points.map(p=>{rc.set(new THREE.Vector3(p.x,500,p.z),down);rc.far=600;const hits=rc.intersectObjects(objects,true);return {...p,hit:hits[0]?{mesh:hits[0].object.name,y:hits[0].point.y,distance:hits[0].distance}:null};});}
const beforeInner=rays(inner,[terrainMesh]),beforeOuter=rays(outer,[terrainMesh]),beforeContext=rays(inner,roots),beforeMaterials=new Map(),beforeGeometry=new Map();
for(const root of roots)root.traverse(o=>{if(o.isMesh){beforeMaterials.set(o,o.material);beforeGeometry.set(o,o.geometry);}});
const t0=performance.now(),statistics=openPermanentExcavations(roots,[window]),executionMs=performance.now()-t0;
scene.updateMatrixWorld(true);
const afterInner=rays(inner,[terrainMesh]),afterOuter=rays(outer,[terrainMesh]),afterContext=rays(inner,roots);
const errors=[],checks=[];const assert=(pass,message)=>{checks.push({pass:!!pass,message});if(!pass)errors.push(message);};
assert(beforeInner.every(p=>p.hit),'all 25 interior points originally have terrain');
assert(afterInner.every(p=>!p.hit),'all 25 interior points have no terrain after permanent opening');
assert(beforeOuter.every(p=>p.hit)&&afterOuter.every(p=>p.hit),'all 48 exterior points keep terrain, including 2.5cm beyond boundary');
const exteriorErrors=afterOuter.map((p,i)=>p.hit&&beforeOuter[i].hit?Math.abs(p.hit.y-beforeOuter[i].hit.y):Infinity);assert(Math.max(...exteriorErrors)<.0001,'all exterior terrain heights unchanged within 0.1mm');
assert([...beforeMaterials].every(([m,mat])=>m.material===mat),'permanent geometry subtraction preserves every context material reference');
const changed=[...beforeGeometry].filter(([mesh,g])=>mesh.geometry!==g),meshChecks=[];
function stats(mesh,geometry,checkInterior=false){
 const p=geometry.attributes.position,idx=geometry.index,N=(idx?.count||p.count)/3,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3();let finite=true,degenerate=0,interiorOverlap=0,smallestArea=Infinity,overlapArea=0,maxOverlap=0;
 for(const attr of Object.values(geometry.attributes))for(const x of attr.array)if(!Number.isFinite(x))finite=false;
 const toLocal=v=>{const dx=v.x-window.center.x,dz=v.z-window.center.z;return new THREE.Vector3(dx*ca-dz*sa,v.y,dx*sa+dz*ca);};
 const clip=(poly,axis,limit,side)=>{const out=[];for(let i=0;i<poly.length;i++){const v=poly[i],q=poly[(i+1)%poly.length],da=side*(v[axis]-limit),db=side*(q[axis]-limit);if(da<=0)out.push(v);if((da<=0)!==(db<=0))out.push(v.clone().lerp(q,da/(da-db)));}return out;};
 for(let i=0;i<N;i++){
  a.fromBufferAttribute(p,idx?idx.getX(i*3):i*3).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(p,idx?idx.getX(i*3+1):i*3+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(p,idx?idx.getX(i*3+2):i*3+2).applyMatrix4(mesh.matrixWorld);
  const area=ab.copy(b).sub(a).cross(ac.copy(c).sub(a)).length()/2;if(area<1e-10)degenerate++;smallestArea=Math.min(smallestArea,area);
  if(!checkInterior)continue;
  let poly=[toLocal(a),toLocal(b),toLocal(c)],hu=window.width/2-.001,hv=window.depth/2-.001;
  if(poly.every(v=>v.x>=hu)||poly.every(v=>v.x<=-hu)||poly.every(v=>v.z>=hv)||poly.every(v=>v.z<=-hv))continue;
  for(const[axis,lim,side]of[['x',hu,1],['x',-hu,-1],['z',hv,1],['z',-hv,-1]]){if(poly.length<3)break;poly=clip(poly,axis,lim,side);}
  if(poly.length>=3){let ar=0;for(let j=1;j<poly.length-1;j++)ar+=ab.copy(poly[j]).sub(poly[0]).cross(ac.copy(poly[j+1]).sub(poly[0])).length()/2;if(ar>1e-8){interiorOverlap++;overlapArea+=ar;maxOverlap=Math.max(maxOverlap,ar);}}
 }
 return {triangles:N,finite,degenerate,smallestArea,interiorOverlap,overlapArea,maxOverlap};
}
for(const[mesh,old]of changed){const before=stats(mesh,old,false),after=stats(mesh,mesh.geometry,true);meshChecks.push({name:mesh.name,before,after});assert(after.finite,mesh.name+' has finite attributes');assert(after.degenerate<=before.degenerate,mesh.name+' adds no degenerate triangles');assert(after.interiorOverlap===0,mesh.name+' has no triangle area remaining 1mm inside the rectangular opening');}
assert(afterContext.every(p=>!p.hit),'all interior downward rays also clear the remaining context');
// Check the permanent geometry survives all dynamic modes, with original materials restored.
const stableGeometry=new Map([...beforeMaterials].map(([m])=>[m,m.geometry])),renderer={shadowMap:{needsUpdate:false}},controller=createExcavationController({scene,renderer,sites:archaeology.sites,contextRoots:[city.group,monuments.group,sacred.group,civic.group],terrainMeshes:[terrainMesh,foundation],heightAt:urban.groundHeight});
const restoration=[];
for(const[id,site]of Object.entries(archaeology.sites)){
 controller.select(id);
 for(const focus of site.focuses||[site]){if(site.focuses)controller.setFocus(focus.id);for(const mode of ['current',...(focus.cut?['cut']:[]),'historical']){controller.setMode(mode);if(mode==='cut'){controller.setOpening(0);controller.setOpening(.35);controller.setOpening(1);}if(mode==='historical'){controller.setHypotheses(false);controller.setHypotheses(true);controller.setRoofOpen(false);controller.setRoofOpen(true);}}}
 controller.select(null);const materialsRestored=[...beforeMaterials].every(([m,mat])=>m.material===mat),geometryUnchanged=[...stableGeometry].every(([m,g])=>m.geometry===g);restoration.push({id,materialsRestored,geometryUnchanged});assert(materialsRestored,id+' restores all context materials');assert(geometryUnchanged,id+' preserves permanent geometry');
}
city.buildings.visible=false;controller.select('domus');const lifted=controller.group.children.find(o=>o.name==='Suelo y contexto levantados');let wrongVisibility=0,liftedHiddenSources=0;for(const copy of lifted.children){let source=copy.userData.source;if(!source)continue;let visible=true;for(let o=source;o;o=o.parent)visible=visible&&o.visible;if(!visible){liftedHiddenSources++;if(copy.visible)wrongVisibility++;}}
assert(wrongVisibility===0,'new covers respect already-hidden parent city layer');controller.select(null);city.buildings.visible=true;controller.dispose();
const finalInner=rays(inner,[terrainMesh]),finalOuter=rays(outer,[terrainMesh]);assert(finalInner.every(p=>!p.hit),'permanent hole remains open after all dynamic selections and disposal');assert(finalOuter.every((p,i)=>p.hit&&Math.abs(p.hit.y-beforeOuter[i].hit.y)<.0001),'external terrain remains unchanged after all modes');
const result={pass:!errors.length,errors,checks,window,executionMs,statistics,changedMeshes:meshChecks,materialCount:beforeMaterials.size,interiorSamples:25,exteriorSamples:outer.length,maxExteriorHeightError:Math.max(...exteriorErrors),beforeInner,afterInner,beforeOuter,afterOuter,beforeContext,afterContext,restoration,layerVisibility:{liftedHiddenSources,wrongVisibility}};
fs.writeFileSync('research/qa-v5-sagunto-permanent-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,errors,checks:checks.length,executionMs,statistics,changedMeshes:meshChecks,materialCount:beforeMaterials.size,interiorSamples:25,exteriorSamples:outer.length,maxExteriorHeightError:result.maxExteriorHeightError,restoration,layerVisibility:result.layerVisibility},null,2));
if(errors.length)process.exitCode=1;
