import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import * as THREE from 'three';
import {createCity} from '../dist/js/city.js';
import {createUrbanSurface,pointInPolygon,MetricGrid} from '../dist/js/urban-surface.js';
import {createHeightSampler,buildTerrainGeometry,terrainShape} from '../dist/js/terrain.js';
import {createMonuments} from '../dist/js/monuments.js';
import {createSacredHeritage} from '../dist/js/heritage-sacred.js';
import {createCivicHeritage} from '../dist/js/heritage-civic.js';
import {createArchaeology} from '../dist/js/archaeology.js';
import {openPermanentExcavations} from '../dist/js/excavation.js';
import {createPortHeritage,portShape,portMeshOptions} from '../dist/js/port.js';
import {createCoastHeritage,coastShape,coastMeshOptions} from '../dist/js/coast.js';
import {createWaterMask} from '../dist/js/coast-environment.js';
import {createLandscapeWaterMask} from '../dist/js/landscape-environment.js';
import {createLandscapeHeritage,landscapeRoadExclusions} from '../dist/js/landscapes.js';
import {createMarshLandscape} from '../dist/js/landscape-marjal.js';
import {createDunesLandscape} from '../dist/js/landscape-dunes.js';
import {createPalanciaLandscape} from '../dist/js/landscape-palancia.js';

// Node validates the real CPU geometry. Canvas painting is replaced only for
// texture I/O; browser/GPU appearance and frame rate are separate checks.
const canvasContext=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>canvasContext}),querySelector:()=>({checked:true})};
const region=process.argv.find(v=>v.startsWith('--region='))?.split('=')[1]||'sagunto';
if(!['sagunto','puerto','coast','marjal','almarda','palancia'].includes(region))throw new Error('Unknown region: '+region);
const root=path.resolve('.'),out=path.join(root,'research/validation-v6');fs.mkdirSync(out,{recursive:true});
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'dist/assets/data',n+'.json'))),records=names=>Object.fromEntries(names.flatMap(n=>read(n).sites).map(s=>[s.id,s]));
const prefix={sagunto:'',puerto:'port-',coast:'coast-',marjal:'marjal-',almarda:'almarda-',palancia:'palancia-'}[region];
const data=read(prefix+'cartography'),elev=read(prefix+'elevation'),raw=createHeightSampler(elev);
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const bb=p=>({minX:Math.min(...p.map(q=>q.x)),maxX:Math.max(...p.map(q=>q.x)),minZ:Math.min(...p.map(q=>q.z)),maxZ:Math.max(...p.map(q=>q.z))});
const clean=coords=>{const p=(coords||[]).map(c=>project(...c));if(p.length>1&&Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<.02)p.pop();return p;};
const checks=[],errors=[],warnings=[],times={},start=performance.now();
const assert=(ok,label)=>{checks.push({label,pass:!!ok});if(!ok)errors.push(label);};
const scene=new THREE.Group(),heritageGroups=[];let shape,options={},patches=[],exclusions=[],vegetationExclusions=[],excludedIds=new Set(),excludedRoads=new Set(),base=raw,waterMask=null,siteRecords={},heritage=null,archaeology=null,urban,terrain,city,ground,detailBounds,treeLimit=580;
const insideCrop=(x,z)=>((x-shape.cx)/shape.rx)**2+((z-shape.cz)/shape.rz)**2<1;
const parentsToExclude=()=>{const parents=new Set(Object.values(siteRecords).flatMap(s=>s.catastroBuildingIds||[]));for(const b of data.buildings||[])if(String(b.id).startsWith('cat-')&&parents.has(String(b.id).slice(4).split('_part')[0]))excludedIds.add(String(b.id));};
let checkpoint=performance.now();
if(region==='sagunto'){
 shape=terrainShape;siteRecords=records(['landmarks']);
 const monuments=createMonuments({data,project,heightAt:raw}),sacred=createSacredHeritage({heightAt:raw,project,landmarks:siteRecords}),civic=createCivicHeritage({heightAt:raw,project,landmarks:siteRecords});
 archaeology=createArchaeology({heightAt:raw,project,records:records(['archaeology-domestic','archaeology-public','archaeology-necropolis']),data});
 heritageGroups.push(monuments.group,sacred.group,civic.group,archaeology.group);patches=[...sacred.patches,...civic.patches];exclusions=[...sacred.exclusions,...civic.exclusions];
 excludedIds=new Set(Object.values(siteRecords).flatMap(s=>s.osmIds||[]).filter(v=>v.startsWith('way/')).map(v=>v.split('/')[1]));
 for(const g of civic.group.children)for(const id of g.userData.osmContextFootprints||[])excludedIds.add(String(id));excludedIds.add('203140142');parentsToExclude();
 excludedRoads=new Set(['733321149','733321150','1419281599']);base=(x,z)=>monuments.surfaceHeight(x,z,raw(x,z));
 options={shape,core:{minX:-360,maxX:620,minZ:-180,maxZ:550},coreStep:2.5,outerStep:10};detailBounds={minX:-330,maxX:570,minZ:-160,maxZ:330};
}else if(region==='puerto'||region==='coast'){
 const coast=region==='coast';siteRecords=records(coast?['coast-pier','coast-grau','coast-archaeology']:['port-industrial','port-garden','port-workers']);
 shape=coast?coastShape:portShape;options=coast?coastMeshOptions:portMeshOptions;heritage=(coast?createCoastHeritage:createPortHeritage)({heightAt:raw,project,records:siteRecords,data});
 heritageGroups.push(heritage.group);patches=heritage.patches;exclusions=heritage.exclusions;excludedIds=heritage.excludedIds;parentsToExclude();
 excludedRoads=new Set(coast?Object.values(heritage.sites).flatMap(s=>s.excludedRoadIds||[]).map(String):['447370841']);
 if(coast){waterMask=createWaterMask(read('coast-water'),project);base=waterMask.groundHeight(raw);}detailBounds=coast?{minX:3150,maxX:4100,minZ:4450,maxZ:5100}:portMeshOptions.core;treeLimit=coast?320:720;
}else{
 const regionSpec=read('landscape-regions')[region];shape=regionSpec.shape;options={shape,core:regionSpec.core,coreStep:regionSpec.coreStep,outerStep:regionSpec.outerStep};detailBounds=region==='marjal'?{minX:850,maxX:1110,minZ:5090,maxZ:5320}:region==='almarda'?{minX:6650,maxX:7200,minZ:-3500,maxZ:-2700}:{minX:-300,maxX:600,minZ:-800,maxZ:200};treeLimit=region==='palancia'?850:240;
 waterMask=createLandscapeWaterMask(read(region+'-water'),project);base=waterMask.groundHeight(raw);
 siteRecords=records([region==='marjal'?'landscape-marjal':region==='almarda'?'landscape-dunes':'landscape-palancia']);excludedRoads=landscapeRoadExclusions(Object.values(siteRecords)[0]);

}
times.heritage=performance.now()-checkpoint;checkpoint=performance.now();
const saguntoPolys=region==='palancia'?read('cartography'):null;const filteredData={...data,...(saguntoPolys?{castlePolygon:saguntoPolys.castlePolygon,theatrePolygon:saguntoPolys.theatrePolygon}:{}),roads:(data.roads||[]).filter(r=>!excludedRoads.has(String(r.osmId||r.id))&&!(region==='coast'&&r.coordinates.some(c=>{const p=project(...c);return waterMask.isWater(p.x,p.z);}))) };
urban=createUrbanSurface({data:filteredData,project,heightAt:base,patches,roadSampleStep:region==='sagunto'?2.5:5});times.urban=performance.now()-checkpoint;checkpoint=performance.now();
terrain=buildTerrainGeometry(elev,urban.groundHeight,patches,options);const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));terrainMesh.name='IGN terrain '+region;terrainMesh.userData.orthophoto=true;scene.add(terrainMesh);times.terrain=performance.now()-checkpoint;checkpoint=performance.now();
ground=urban.groundHeight;
if(['marjal','almarda','palancia'].includes(region)){
 heritage=createLandscapeHeritage(region,{heightAt:terrain.meshHeightAt,project,records:siteRecords,data});heritageGroups.push(heritage.group);
 vegetationExclusions=heritage.vegetationExclusions;exclusions=heritage.exclusions;excludedIds=heritage.excludedIds;
 if(region==='palancia')heritageGroups.push(createMonuments({heightAt:terrain.meshHeightAt,project,data:saguntoPolys}).group);

}
for(const g of heritageGroups)scene.add(g);
city=createCity({data:filteredData,project,heightAt:ground,terrainHeightAt:terrain.meshHeightAt,urban,excludeBuildingIds:excludedIds,exclusions,vegetationExclusions,inBounds:(x,z)=>insideCrop(x,z)&&!(waterMask?.isWater(x,z)),detailBounds,treeLimit});scene.add(city.group);times.city=performance.now()-checkpoint;checkpoint=performance.now();
if(archaeology)openPermanentExcavations([terrainMesh,city.group,...heritageGroups.filter(g=>g!==archaeology.group)],Object.values(archaeology.sites).map(s=>s.currentMask).filter(Boolean));
scene.updateMatrixWorld(true);

function geometryStats(group){const stats={meshes:0,vertices:0,triangles:0,attributeBytes:0,indexBytes:0,instanceBytes:0,nonfinite:0,indicesOutside:0,degenerate:0,degenerateExamples:[],zeroNormals:0,minY:Infinity,maxY:-Infinity};const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cross=new THREE.Vector3();group.traverse(o=>{if(!o.isMesh)return;stats.meshes++;const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,ix=g.index,count=ix?.count||p.count;stats.vertices+=p.count;stats.triangles+=count/3*(o.isInstancedMesh?o.count:1);for(const attr of Object.values(g.attributes)){stats.attributeBytes+=attr.array.byteLength;for(const v of attr.array)if(!Number.isFinite(v))stats.nonfinite++;}if(ix)stats.indexBytes+=ix.array.byteLength;for(const attr of[o.instanceMatrix,o.instanceColor])if(attr){stats.instanceBytes+=attr.array.byteLength;for(const v of attr.array)if(!Number.isFinite(v))stats.nonfinite++;}for(let i=0;i<p.count;i++){stats.minY=Math.min(stats.minY,p.getY(i));stats.maxY=Math.max(stats.maxY,p.getY(i));if(n&&n.getX(i)**2+n.getY(i)**2+n.getZ(i)**2<.1)stats.zeroNormals++;}for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>ix?ix.getX(i+k):i+k);if(ids.some(v=>v<0||v>=p.count)){stats.indicesOutside++;continue;}a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]).sub(a);c.fromBufferAttribute(p,ids[2]).sub(a);cross.crossVectors(b,c);if(cross.lengthSq()<1e-16){stats.degenerate++;if(stats.degenerateExamples.length<10)stats.degenerateExamples.push({mesh:o.name,triangle:i/3,vertices:[a.toArray(),b.clone().add(a).toArray(),c.clone().add(a).toArray()]});}}});return stats;}
const geometry={buildings:geometryStats(city.buildings),roads:geometryStats(city.roads),vegetation:geometryStats(city.vegetation),terrain:geometryStats(terrainMesh)};
for(const[name,s]of Object.entries(geometry)){assert(s.nonfinite===0,name+': finite attributes and instances');assert(s.indicesOutside===0,name+': valid indices');if(name==='buildings'){assert(s.zeroNormals===0,'Building normals are nonzero');assert(s.degenerate===0,'No degenerate building triangles');}}
assert(city.buildings.userData.footprintCount>0,'Region has rendered cartographic building parts');
const bm=city.buildings.userData;assert(['empiricalHeightCount','ignSurfaceHeightCount','osmLevelCount','cadastralLevelCount','estimatedHeightCount'].reduce((s,k)=>s+bm[k],0)===bm.footprintCount,'Height provenance sums to rendered parts');assert(bm.estimatedHeightCount>=0,'Estimated building-part count is nonnegative');
const badSourceHeights=(data.buildings||[]).filter(b=>['height','surfaceHeightEstimate','levels'].some(k=>b[k]!==undefined&&b[k]!==null&&b[k]!==''&&!Number.isFinite(parseFloat(b[k])))).map(b=>b.id);assert(badSourceHeights.length===0,'All provided source heights and storeys are numeric');
const auditPolys=exclusions.map((p,i)=>({p,box:bb(p),id:'custom-'+i}));for(const[key,label]of[['castlePolygon','castle'],['theatrePolygon','theatre']]){const p=clean(filteredData[key]);if(p.length>=3)auditPolys.push({p,box:bb(p),id:label});}
const auditIndex=new MetricGrid(50);for(const p of auditPolys)auditIndex.insert(p.box,p);
const nature=(data.landcover||[]).filter(l=>['wetland','marsh','beach','sand','dune','reedbed','water'].includes(l.kind)).map(l=>({id:l.id,kind:l.kind,p:clean(l.coordinates),holes:(l.holes||[]).map(clean)})).filter(l=>l.p.length>2),natureIndex=new MetricGrid(100);for(const p of nature){p.box=bb(p.p);const b={minX:Math.max(p.box.minX,data.bounds?.minX??-1e5),maxX:Math.min(p.box.maxX,data.bounds?.maxX??1e5),minZ:Math.max(p.box.minZ,data.bounds?.minZ??-1e5),maxZ:Math.min(p.box.maxZ,data.bounds?.maxZ??1e5)};if(b.minX<b.maxX&&b.minZ<b.maxZ)natureIndex.insert(b,p);}
const roofAudit={roofTriangles:0,waterTriangles:0,waterAreaM2:0,heritageTriangles:0,heritageAreaM2:0,natureTriangles:0,natureAreaM2:0,submergedRoofVertices:0,belowTerrainPoints:[],minimumRoofClearanceM:Infinity,maximumRoofClearanceM:-Infinity,examples:[]};
const roofKeys=new Map(),v=new THREE.Vector3();
for(const mesh of city.buildings.children.filter(o=>['Tejados de terracota','Azoteas'].includes(o.name))){const p=mesh.geometry.attributes.position,ix=mesh.geometry.index,count=ix?.count||p.count;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=y-terrain.meshHeightAt(x,z);roofAudit.minimumRoofClearanceM=Math.min(roofAudit.minimumRoofClearanceM,d);roofAudit.maximumRoofClearanceM=Math.max(roofAudit.maximumRoofClearanceM,d);if(d<-.3){roofAudit.submergedRoofVertices++;if(roofAudit.belowTerrainPoints.length<60&&!roofAudit.belowTerrainPoints.some(q=>Math.hypot(x-q.x,z-q.z)<.01&&Math.abs(y-q.y)<.01))roofAudit.belowTerrainPoints.push({x,y,z,ground:terrain.meshHeightAt(x,z),clearanceM:d});}const key=Math.round(x*100)+','+Math.round(z*100);if(!roofKeys.has(key))roofKeys.set(key,[]);roofKeys.get(key).push(y);}
 for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>ix?ix.getX(i+k):i+k),vs=ids.map(j=>({x:p.getX(j),y:p.getY(j),z:p.getZ(j)})),x=vs.reduce((s,p)=>s+p.x,0)/3,z=vs.reduce((s,p)=>s+p.z,0)/3,area=Math.abs((vs[1].x-vs[0].x)*(vs[2].z-vs[0].z)-(vs[1].z-vs[0].z)*(vs[2].x-vs[0].x))*.5;roofAudit.roofTriangles++;if(area<.01)continue;
  const w=waterMask?.isWater(x,z),h=auditIndex.at(x,z).find(q=>pointInPolygon(x,z,q.p)),n=natureIndex.at(x,z).find(q=>pointInPolygon(x,z,q.p)&&!q.holes.some(h=>pointInPolygon(x,z,h)));if(w){roofAudit.waterTriangles++;roofAudit.waterAreaM2+=area;}if(h){roofAudit.heritageTriangles++;roofAudit.heritageAreaM2+=area;}if(n){roofAudit.natureTriangles++;roofAudit.natureAreaM2+=area;}if((w||h||n)&&roofAudit.examples.length<50)roofAudit.examples.push({x,z,areaM2:area,water:!!w,heritage:h?.id,nature:n?.kind,natureId:n?.id});
 }}
assert(roofAudit.waterTriangles===0,'No emitted roof triangle centres in mapped open water');assert(roofAudit.heritageAreaM2<.1,'No emitted roofs inside custom monument footprints');
if(roofAudit.submergedRoofVertices)warnings.push('Some roof vertices fall below the terrain: inspect roofAudit and source parts before interpreting as a defect.');
if(roofAudit.natureTriangles)warnings.push('Mapped building roofs intersect a broad natural-landcover polygon. These may be documented facilities or adjacent parcels; review flagged parts, do not erase real cartography automatically.');
const matchesRoof=p=>p.every(v=>{const x=Math.round(v.x*100),z=Math.round(v.z*100);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(roofKeys.has((x+a)+','+(z+b)))return true;return false;});
const suspectParts=[];for(const b of data.buildings||[]){const p=clean(b.coordinates);if(p.length<3||!matchesRoof(p))continue;const x=p.reduce((s,v)=>s+v.x,0)/p.length,z=p.reduce((s,v)=>s+v.z,0)/p.length,targets=auditIndex.at(x,z).filter(q=>pointInPolygon(x,z,q.p)),nat=natureIndex.at(x,z).filter(q=>pointInPolygon(x,z,q.p)&&!q.holes.some(h=>pointInPolygon(x,z,h))),wet=!!waterMask?.isWater(x,z);if(targets.length||nat.length||wet)suspectParts.push({id:b.id,kind:b.kind,coordinate:[x/(111320*Math.cos(39.679*Math.PI/180))-.278,39.679-z/111320],water:wet,heritage:targets.map(t=>t.id),nature:nat.map(n=>({kind:n.kind,id:n.id})),height:b.height,surfaceHeightEstimate:b.surfaceHeightEstimate,levels:b.levels});}
for(const q of roofAudit.belowTerrainPoints){q.sourceCandidates=[];for(const b of data.buildings||[])if(clean(b.coordinates).some(v=>Math.hypot(q.x-v.x,q.z-v.z)<.03))q.sourceCandidates.push({id:b.id,levels:b.levels,height:b.height,surfaceHeightEstimate:b.surfaceHeightEstimate,kind:b.kind});}
let treesInWater=0,treesInLandscape=0;const trunk=city.vegetation.children.find(o=>o.name==='Troncos');if(trunk)for(let i=0;i<trunk.count;i++){const m=new THREE.Matrix4();trunk.getMatrixAt(i,m);v.setFromMatrixPosition(m);if(waterMask?.isWater(v.x,v.z))treesInWater++;if(vegetationExclusions.some(p=>pointInPolygon(v.x,v.z,p)))treesInLandscape++;}assert(treesInWater===0,'No context tree centres in open water');assert(treesInLandscape===0,'No context trees duplicate custom landscape plant areas');
times.audit=performance.now()-checkpoint;
const result={region,pass:errors.length===0,checks,errors,warnings,source:{buildingParts:data.buildings?.length||0,roads:data.roads?.length||0,landcover:data.landcover?.length||0,shape,terrainBounds:elev.bounds,terrainSize:[elev.width,elev.height]},buildings:bm,roads:city.roads.userData,vegetation:city.vegetation.userData,excludedContextIds:excludedIds.size,customExclusionPolygons:exclusions.length,landscapeVegetationExclusions:vegetationExclusions.length,geometry,roofAudit,suspectParts,treesInWater,treesInLandscape,times,totalMs:performance.now()-start,memoryMb:process.memoryUsage().rss/1048576,scope:'Actual createCity geometry with current cartography, terrain and heritage exclusions. Counts are building parts, not necessarily distinct buildings. CPU checks do not validate GPU performance or texture appearance.'};
fs.writeFileSync(path.join(out,'city-'+region+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({region,pass:result.pass,parts:bm.footprintCount,geometry:geometry.buildings,roofAudit:{...roofAudit,examples:roofAudit.examples.slice(0,3)},errors,warnings,times,totalMs:result.totalMs,memoryMb:result.memoryMb},null,2));
if(process.argv.includes('--export')){
 const enc=a=>({type:a.constructor.name,count:a.length,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}),meshes=[];scene.traverseVisible(o=>{if(!o.isMesh)return;const g=o.geometry,m=Array.isArray(o.material)?o.material[0]:o.material;meshes.push({name:o.name,positions:enc(g.attributes.position.array),indices:g.index?enc(g.index.array):null,uv:g.attributes.uv?enc(g.attributes.uv.array):null,colors:g.attributes.color?enc(g.attributes.color.array):null,colorSize:g.attributes.color?.itemSize||3,matrix:o.matrixWorld.toArray(),instances:o.isInstancedMesh?enc(o.instanceMatrix.array):null,instanceColors:o.instanceColor?enc(o.instanceColor.array):null,material:{color:m.color?.toArray()||[.2,.35,.3],roughness:m.roughness??1,metalness:m.metalness||0,transparent:!!m.transparent,orthophoto:!!o.userData.orthophoto}});});
 const target=region==='sagunto'?[0,45,-130]:region==='puerto'?[4850,8,2200]:[shape.cx,10,shape.cz],position=region==='sagunto'?[600,460,700]:region==='puerto'?[5700,650,3200]:[shape.cx+700,800,shape.cz+900];fs.writeFileSync(path.join(root,'research/qa-city-'+region+'-geometry.json.gz'),zlib.gzipSync(JSON.stringify({meshes,cameras:[{id:region,position,target}],terrainImage:path.join(root,'dist/assets/data',prefix+'orthophoto.jpg')}),{level:4}));
}
if(errors.length)process.exitCode=1;
