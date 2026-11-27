import {loadAtlasContext,originalSurroundings,settleSourceClaims} from './territory-heritage-contexts.js';
import * as THREE from 'three';
import {atlasProject,documentData,prewarmDocument,registerFrame} from './territory-heritage-catalog.js';
import {heritageRelief,reliefDelta} from './territory-heritage-relief.js';
import {heightOnPavement,sampleAtlasPavement,samplePublicDeck} from './territory-heritage-paving.js';
import {prepareWalkingBarriers,sampleHeritageBarriers} from './territory-collision-heritage.js';
import {instantiateAtlasVisit,preloadAtlasVisit} from './territory-heritage-registry.js';
import {createCastleGround} from './castle-ground.js';

// Each table entry addresses the original geometry constructor, including
// sectional interiors and original texture generation. Only one site is built
// at a time, after the previously requested place has yielded to the browser.
const definitions={
 glorieta:['glorieta','createGlorieta',()=>import('./glorieta.js')],
 castle:['castle','createCastle',()=>import('./castle.js')],theatre:['theatre','createTheatre',()=>import('./theatre.js')],
 'santa-maria':['santa-maria','createSantaMaria',()=>import('./santa-maria.js')],'plaza-mayor':['plaza-mayor','createPlazaSantaMaria',()=>import('./plaza-santa-maria-ensemble.js')],
 juderia:['juderia','createJuderia',()=>import('./juderia.js')],calvario:['calvario','createCalvario',()=>import('./calvario.js')],berenguer:['berenguer','createBerenguer',()=>import('./berenguer.js')],
 sangre:['sangre','createSangre',()=>import('./sangre.js')],salvador:['salvador','createSalvador',()=>import('./salvador.js')],museo:['museo','createMuseo',()=>import('./museo.js')],
 portic:['portic','createPortic',()=>import('./portic.js')],domus:['domus','createDomus',()=>import('./domus.js')],circo:['circo','createCirco',()=>import('./circo.js')],'forum-plaza':['forum-plaza','createForumPlaza',()=>import('./forum-plaza.js')],necropolis:['necropolis','createNecropolis',()=>import('./necropolis.js')],
 horno:['horno','createHorno',()=>import('./horno.js')],talleres:['talleres','createTalleres',()=>import('./talleres.js')],'museo-industrial':['museo-industrial','createMuseoIndustrial',()=>import('./museo-industrial.js')],
 gerencia:['gerencia','createGerencia',()=>import('./gerencia.js')],casino:['casino','createCasino',()=>import('./casino.js')],begona:['begona','createBegona',()=>import('./begona.js')],
 economato:['economato','createEconomato',()=>import('./economato.js')],'barrio-obrero':['barrio','createBarrio',()=>import('./barrio.js')],sanatorio:['sanatorio','createSanatorio',()=>import('./sanatorio.js')],
 'grau-vell':['coast-grau','createCoastGrau',()=>import('./coast-grau.js')],'pantalan':['coast-pier','createCoastPier',()=>import('./coast-pier.js')],'puerto-antiguo':['coast-archaeology','createCoastArchaeology',()=>import('./coast-archaeology.js')],
 'marjal-moros':['landscape-marjal','createMarshLandscape',()=>import('./landscape-marjal.js')],'dunas-almarda':['landscape-dunes','createDunesLandscape',()=>import('./landscape-dunes.js')],'rio-palancia':['landscape-palancia','createPalanciaLandscape',()=>import('./landscape-palancia.js')]
};
const archiveOnly=new Set(['glorieta','pantalan','grau-vell','puerto-antiguo','marjal-moros','dunas-almarda','rio-palancia']);
const sharedModels={'diana':'berenguer','santa-maria':'plaza-mayor','pantalan-maritimo':'pantalan','pantalan-paseo':'pantalan'};
export const modelId=id=>sharedModels[id]||id;
// Prepare the original module and its authored data, without creating meshes,
// textures, pavement rasters or collision structures on the rendering thread.
export async function warmHeritageModel(id,records){
 const record=records[id];
 if(record?.scene){
  const results=await Promise.allSettled([preloadAtlasVisit(record),...Object.values(record.scene.resources||{}).map(prewarmDocument)]);
  return results.every(result=>result.status==='fulfilled');
 }
 const definition=definitions[id];if(!definition)return false;
 const [file,,factory]=definition,names=[];
 if(!archiveOnly.has(id)){
  names.push(file+'-visit');if(id!=='castle'&&id!=='theatre')names.push(file+'-context');
  if(id!=='castle')names.push(file+'-plan');
 }
 if(id==='grau-vell')names.push('grau-visit','grau-context');
 if(id==='plaza-mayor')names.push('santa-maria-visit','santa-maria-context','santa-maria-plan');
 if(id==='pantalan')names.push('pantalan-paseo-visit','pantalan-maritimo-visit','pantalan-context');
 if(id==='glorieta')names.push('glorieta-layout','glorieta-buildings','glorieta-visit');
 if(record?.landscape)names.push(record.region+'-cartography');
 const sector=id==='glorieta'?import('./territory-heritage-glorieta.js').then(m=>m.prewarmGlorietaSurroundings()):null;
 const results=await Promise.allSettled([factory(),loadAtlasContext(id),sector,...names.map(prewarmDocument)]);
 return results.every(result=>result.status==='fulfilled');
}

export function maskRing(points){
 if(!points||points.length<3)return null;
 const xs=points.map(p=>p.x),zs=points.map(p=>p.z);
 return {points,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...zs),bottom:Math.max(...zs)};
}
export const normalizeBuildingId=id=>String(id).replace(/^(?:way\/|osm-|cat-)/,'');
// Keep every original plant and pebble. Interleave their existing transforms so
// a shortened draw on a distant/limited view still covers the whole footprint.
function prepareLandscape(site){
 site.group.traverse(o=>{
  if(!o.isInstancedMesh)return;
  const decoration=site.vegetation?.getObjectById(o.id)||/cantos|grava|tornillería|guijarros/i.test(o.name);
  if(!decoration||o.count<2)return;
  const cost=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
  if(cost*o.count<=14000)return;
  let seed=38197;
  for(let i=o.count-1;i>0;i--){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const j=Math.floor(seed/4294967296*(i+1));
   for(const attr of [o.instanceMatrix,o.instanceColor]){
    if(!attr)continue;
    const a=attr.array,n=attr.itemSize;
    for(let k=0;k<n;k++){
     const from=i*n+k,to=j*n+k,old=a[from];a[from]=a[to];a[to]=old;
    }
   }
  }
  o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;
  o.userData.territoryInstances=[o.count,cost];o.computeBoundingSphere();
 });
}
export function landscapeDetail(root){
 const meshes=[];
 root.traverse(o=>{if(o.userData.territoryInstances)meshes.push(o);});
 const density={instances:0,total:0,nearby:0};
 for(const o of meshes)density.total+=o.userData.territoryInstances[0];
 const sources=new Map();
 function original(mesh){
  if(sources.has(mesh))return sources.get(mesh);
  mesh.updateWorldMatrix(true,false);
  const matrices=mesh.instanceMatrix.array.slice(),colors=mesh.instanceColor?.array.slice();
  const centres=new Float32Array(matrices.length/8),m=mesh.matrixWorld.elements;
  for(let i=0,j=0;i<matrices.length;i+=16,j+=2){
   const x=matrices[i+12],y=matrices[i+13],z=matrices[i+14];
   centres[j]=m[0]*x+m[4]*y+m[8]*z+m[12];
   centres[j+1]=m[2]*x+m[6]*y+m[10]*z+m[14];
  }
  const data={matrices,colors,centres};
  sources.set(mesh,data);return data;
 }
 let previous;
 return (altitude,quality,x,z)=>{
  if(!meshes.length)return density;
  const cap=quality>=2&&altitude<200?Infinity:quality>=1&&altitude<550?160000:14000;
  // Keep every original tuft and stone in the visitor's immediate surroundings
  // on all devices. The landscape constructors span up to nine kilometres.
  const local=Number.isFinite(x)&&Number.isFinite(z)&&altitude<700;
  const cx=local?Math.round(x/40)*40:0,cz=local?Math.round(z/40)*40:0;
  const key=[local,cap,cx,cz,quality].join('/');
  if(previous===key)return density;
  previous=key;density.instances=0;density.nearby=0;
  for(const o of meshes){
   const [count,cost]=o.userData.territoryInstances;
   if(local){
    const {matrices,colors,centres}=original(o);
    const farCount=Math.min(count,Math.max(1,Math.floor((quality>=2?70000:quality===1?38000:14000)/cost)));
    let used=0;
    for(let i=0;i<count;i++){
     const dx=centres[i*2]-cx,dz=centres[i*2+1]-cz,r2=dx*dx+dz*dz;
     if(r2<200**2)density.nearby++;
     else if(i>=farCount&&(r2>430**2||i%3))continue;
     for(let k=0;k<16;k++)o.instanceMatrix.array[used*16+k]=matrices[i*16+k];
     if(colors)for(let k=0;k<3;k++)o.instanceColor.array[used*3+k]=colors[i*3+k];
     used++;
    }
    o.count=used;o.instanceMatrix.needsUpdate=true;if(colors)o.instanceColor.needsUpdate=true;
   }else{
    const source=sources.get(o);
    if(source){
     o.instanceMatrix.array.set(source.matrices);o.instanceMatrix.needsUpdate=true;
     if(source.colors){o.instanceColor.array.set(source.colors);o.instanceColor.needsUpdate=true;}
     sources.delete(o);
    }
    o.count=Math.min(count,Math.max(1,Math.floor(cap/cost)));
   }
   density.instances+=o.count;
  }
  return density;
 };
}

export function inRing(x,z,ring){
 if(x<ring.left||x>ring.right||z<ring.top||z>ring.bottom)return false;
 let inside=false;
 const p=ring.points;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  if((p[i].z>z)!==(p[j].z>z)&&x<(p[j].x-p[i].x)*(z-p[i].z)/(p[j].z-p[i].z)+p[i].x)inside=!inside;
 }
 return inside&&!ring.holes?.some(hole=>inRing(x,z,hole));
}
// Replacement requires overlapping interiors. Neighbours sharing only a
// cadastral edge and buildings situated in an open courtyard stay visible.
export function overlapsRegisteredFootprint(rings,claim){
 const polygon=rings.map(r=>maskRing(r.map(([x,z])=>({x,z})))).filter(Boolean);
 const outer=polygon[0];if(!outer)return false;outer.holes=polygon.slice(1);
 if(outer.right<=claim.left||outer.left>=claim.right||outer.bottom<=claim.top||outer.top>=claim.bottom)return false;
 const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 function strictlyInside(p,ring){
  if(!inRing(p.x,p.z,ring))return false;
  return [ring,...ring.holes||[]].every(({points})=>points.every((a,i)=>{
   const b=points[(i+1)%points.length];
   return Math.abs(cross(a,b,p))>1e-7||p.x<Math.min(a.x,b.x)||p.x>Math.max(a.x,b.x)||p.z<Math.min(a.z,b.z)||p.z>Math.max(a.z,b.z);
  }));
 }
 if(outer.points.some(p=>strictlyInside(p,claim))||claim.points.some(p=>strictlyInside(p,outer)))return true;
 for(const r of [claim,...claim.holes||[]])for(let i=0;i<r.points.length;i++){
  const a=r.points[i],b=r.points[(i+1)%r.points.length];
  for(const s of polygon)for(let j=0;j<s.points.length;j++){
   const c=s.points[j],d=s.points[(j+1)%s.points.length];
   if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return true;
  }
 }
 // Coincident edges can delimit a genuine overlap, even with no interior
 // vertex. Probe the inward side of each edge, excluding courtyards.
 for(const [ring,other] of [[claim,outer],[outer,claim]])for(let i=0;i<ring.points.length;i++){
  const a=ring.points[i],b=ring.points[(i+1)%ring.points.length],dx=b.x-a.x,dz=b.z-a.z;
  const length=Math.hypot(dx,dz);if(!length)continue;
  for(const sign of [-1,1]){
   const p={x:(a.x+b.x)/2+sign*dz/length*.0001,z:(a.z+b.z)/2-sign*dx/length*.0001};
   if(strictlyInside(p,ring)&&strictlyInside(p,other))return true;
  }
 }
 return false;
}
function claimsFor(model,record,frame,project) {
 const ids=new Set(),rings=[];
 const add=id=>ids.add(normalizeBuildingId(id));
 for(const id of [...model.excludedBuildingIds||[],...(record.id==='horno'?[]:record.osmBuildingIds||[]),...record.osmIds||[]])add(id);
 for(const p of record.parts||[])if(p.id)add(p.id);
 const addRing=points=>{const ring=maskRing(points);if(ring)rings.push(ring);};
 if(record.footprint?.length)addRing(record.footprint.map(ll=>project(...ll)));
 for(const polygon of model.exclusions||[model.exclusion]){
  if(polygon?.[0]?.x!==undefined)addRing(polygon.map(p=>frame.world(p.x,p.z)));
 }
 for(const id of model.group.userData.osmContextFootprints||[])add(id);
 return {ids,rings};
}

function contextClaims(model,data,project){
 const ids=new Set(Array.from(model.excludedBuildingIds||[],normalizeBuildingId)),rings=[];
 for(const row of data.buildings||[]){
  for(const shape of [row,...row.secondaryFootprints||[]]){
   if(!shape.coordinates?.length)continue;
   const ring=maskRing(shape.coordinates.map(c=>project(...c)));
   if(!ring)continue;
   ring.holes=(shape.holes||[]).map(h=>maskRing(h.map(c=>project(...c)))).filter(Boolean);
   rings.push(ring);
  }
 }
 const props=[];
 for(const type of ['trees','lamps','benches']){
  for(const obj of data[type]||[]){
   if(obj.coordinate){const {x,z}=project(...obj.coordinate);props.push([x,z,type==='trees'?3.5:2]);}
  }
 }
 const green=(data.vegetationExclusions||data.vegetationExclusionPolygons||[]).map(row=>{
  const coords=row.coordinates||row;
  if(!Array.isArray(coords[0]))return null;
  const ring=maskRing(coords.map(c=>project(...c)));if(!ring)return null;
  ring.holes=(row.holes||[]).map(h=>maskRing(h.map(c=>project(...c)))).filter(Boolean);return ring;
 }).filter(Boolean);
 return {ids,rings,props,green};
}

export function releaseModel(group){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 group.traverse(o=>{
  for(const t of o.userData.ownedResources?.textures||[])textures.add(t);
  for(const m of o.userData.ownedResources?.materials||[])materials.add(m);
  if(o.geometry)geometries.add(o.geometry);
  for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);
  if(o.isInstancedMesh)o.dispose();
 });
 for(const m of materials){
  for(const t of Object.values(m))if(t?.isTexture)textures.add(t);
  for(const u of Object.values(m.uniforms||{}))if(u.value?.isTexture)textures.add(u.value);
  m.dispose();
 }
 for(const g of geometries)g.dispose();
 for(const t of textures)t.dispose();
 group.removeFromParent();
}

export async function buildHeritageModel(id,{places,records,area,heightAt,project,needed,bindVisit,renderer}){
 if(records[id]?.scene){
  const record=records[id],created=await instantiateAtlasVisit(record,{project,heightAt,renderer,needed});
  if(!created)return null;
  const {group,site}=created;
  const toMask=ring=>maskRing(ring.map(ll=>project(...ll)));
  const rings=(record.footprints||[record.footprint].filter(Boolean)).map(polygon=>{
   const ring=toMask(polygon.coordinates||polygon);
   if(ring){ring.holes=(polygon.holes||[]).map(toMask).filter(Boolean);ring.registered=true;}
   return ring;
  }).filter(Boolean);
  const ids=(record.buildingIds||[]).map(normalizeBuildingId);
  const model={group,claims:[{ids,rings}],relief:{cuts:[]},pavement:null,setDensity:landscapeDetail(group),
   setHistorical(on){site.setHistorical?.(on);},
   setVisitStop(place,stop,presentation={}){
    const data=record.guide?.stops?.find(s=>s.id===stop);
    const mode=presentation.mode||data?.mode||'current',section=!!(presentation.requiresSection||data?.requiresSection||mode==='cut');
    site.setHistorical?.(mode==='historical');
    site.setSection?.(section);site.selectFocus?.(stop||null);
    return stop?{place,stop,mode,section,interior:!!data?.interiorView}:null;
   },disposeVisit(){site.dispose?.();}};
  model.publicDeck=samplePublicDeck(group);
  const floorAt=(x,z)=>heightOnPavement(model.publicDeck,x,z)??heightAt(x,z);
  model.walkBarriers=bindVisit?await prepareWalkingBarriers(group,floorAt,needed):sampleHeritageBarriers(group,floorAt);
  if(!model.walkBarriers){model.disposeVisit();releaseModel(group);return null;}
  return model;
 }
 const primary=id==='pantalan'?'pantalan-paseo':id,place=places.find(p=>p.id===primary);
 const [file,func,loadFactory]=definitions[id],frame=registerFrame(place,project);
 const sample=(x,z)=>{const p=frame.world(x,z);return heightAt(p.x,p.z);};
 const record=records[primary];
 const options={heightAt:sample,project:atlasProject,records,data:area,record,site:record};
 const castleGround=id==='castle'?createCastleGround({heightAt:sample,project:atlasProject}):null;
 if(castleGround)options.heightAt=castleGround.sample;
 const get=async(name,key)=>{options[key]=await documentData(name,false);};
 const requests=[loadFactory(),loadAtlasContext(id)];
 if(!archiveOnly.has(id)){
  requests.push(get(file+'-visit','visitData'));
  if(id!=='castle'&&id!=='theatre')requests.push(get(file+'-context','contextData'));
 }
 if(id==='grau-vell')requests.push(get('grau-visit','grauVisit'),get('grau-context','grauContextData'));
 if(id==='plaza-mayor')requests.push(get('santa-maria-visit','santaMariaVisit'),get('santa-maria-context','santaMariaContext'),get('santa-maria-plan','santaMariaPlan'));
 if(id==='pantalan')requests.push(get('pantalan-paseo-visit','pantalanPaseoVisit'),get('pantalan-maritimo-visit','pantalanMaritimoVisit'),get('pantalan-context','contextData'));
 if(record.landscape){
  requests.push(get(record.region+'-cartography','data'));
 }
 if(id==='glorieta')requests.push(get('glorieta-layout','layout'),get('glorieta-buildings','buildings'),get('glorieta-visit','guide'));
 let sector=null;
 if(id==='glorieta')requests.push(import('./territory-heritage-glorieta.js').then(async m=>{
  sector={data:await m.loadGlorietaSurroundings(),build:m.createGlorietaSurroundings,resolve:m.resolveFrontageShells};
 }));
 const [module,contextFactory]=await Promise.all(requests);
 if(!needed())return null;
 await settleSourceClaims(id,options);
 if(options.visitData&&id!=='castle')options.visitData.plan=await documentData(file+'-plan',false);
 if(options.santaMariaVisit)options.santaMariaVisit.plan=options.santaMariaPlan;
 if(!needed())return null;
 if(sector)options.buildings=sector.resolve(options.buildings,sector.data.frontageCorrections);
 const made=module[func](options);
 const sites=made.sites||{[id]:made.isObject3D?{group:made}:made};
 const local=made.isObject3D?made:made.group;
 if(castleGround){
  local.userData.ground=castleGround;
  sites.castle.currentMasks=local.userData.currentMasks||[];
 }
 if(id==='berenguer'&&made.dianaSite){
  sites.diana=made.dianaSite;
  local.attach(made.dianaSite.group);
 }
 const outer=new THREE.Group();outer.name='Atlas · '+place.name;
 outer.matrixAutoUpdate=false;
 outer.matrix.set(frame.a,0,frame.b,frame.tx,0,1,0,0,frame.c,0,frame.d,frame.tz,0,0,0,1);
 outer.add(local);
 // Let navigation and streaming paint between the independent Atlas builders.
 async function continueBuilding(){
  if(bindVisit)await new Promise(resolve=>setTimeout(resolve,0));
  if(needed())return true;
  releaseModel(outer);return false;
 }
 if(!await continueBuilding())return null;
 // Every context factory draws in the Atlas metre grid, including those whose
 // monument constructor has a rotated or translated local frame of its own.
 const surroundings=made.surroundings||(contextFactory?originalSurroundings(contextFactory,id,options,sites):null);
 if(surroundings)outer.add(surroundings.context.group);
 const streets=sector?.build(sector.data,options);
 if(streets)outer.add(streets.group);
 if(!await continueBuilding())return null;
 outer.updateMatrixWorld(true);
 for(const [key,site] of Object.entries(sites)){
  site.setSection?.(false);
  if(site.currentGroup)site.currentGroup.visible=true;
  if(site.historicalGroup)site.historicalGroup.visible=false;
  if(site.reconstruction)site.reconstruction.visible=false;
  if(site.hypotheses)site.hypotheses.visible=false;
  if(site.remains)site.remains.visible=true;
  if(records[key].landscape)prepareLandscape(site);
  site.setPresentation?.({mode:'current',selected:false,opening:0,hypotheses:false,roofOpen:false});
  site.group.userData.territoryPlace=key;
 }
 const relief=heritageRelief(id,surroundings?{...sites,context:surroundings.context}:sites,frame,place,heightAt,sample);
 const adjusted=(x,z)=>{const p=frame.world(x,z);return heightAt(p.x,p.z)+reliefDelta(relief,p.x,p.z);};
 if(relief.bounds){
  // Atlas calls bindGround after grading the excavations and foundations.
  // Rebind in Atlas coordinates before freezing the worker's world matrices.
  surroundings?.context.bindGround?.(adjusted);
  for(const site of Object.values(sites)){
   const visit=site.visit||site.group.userData.visit;
   visit?.bindGround?.(adjusted);
  }
  outer.updateMatrixWorld(true);
 }
 if(id==='forum-plaza'&&surroundings){
  // Match the Atlas guide's shared park/street focuses after the context has
  // rebound to the final ground; the author's getFocus uses this same object.
  const visit=sites[id].visit||sites[id].group.userData.visit,context=surroundings.context;
  Object.assign(visit.focuses,context.focuses||{});
  for(const focus of Object.values(visit.focuses)){
   const stop=options.visitData.stops.find(s=>s.id===focus.id);
   if(stop)Object.assign(focus,{label:stop.title,regionId:stop.regionId,readingLayer:stop.readingLayer||focus.readingLayer});
  }
  if(context.bounds)visit.bounds.union(context.bounds);
  if(context.plan?.components)visit.plan.components.push(...context.plan.components);
  const select=visit.selectFocus,reading=visit.setReadingMode;
  visit.selectFocus=focusId=>{const result=select?.(focusId);context.selectFocus?.(focusId);return result;};
  visit.setReadingMode=mode=>{const result=reading?.(mode);context.setReadingMode?.(mode);return result;};
 }
 if(!await continueBuilding())return null;
 const claims=Object.entries(sites).map(([key,site])=>claimsFor(site,records[key],frame,project));
 let pavement=null,contextStats=null;
 if(id==='glorieta'){
  pavement=sampleAtlasPavement({group:outer,surfaces:streets.roads});
  const adjacent=contextClaims({excludedBuildingIds:sector.data.buildings.map(b=>b.id)},sector.data,project);
  for(const id of sector.data.aliases)adjacent.ids.add(normalizeBuildingId(id));
  claims.push(adjacent);
  contextStats={id,buildings:options.buildings.buildings.length+streets.buildings.userData.footprintCount,
   detailedFrontages:Object.keys(options.buildings.frontages).length,adjacentParts:streets.buildings.userData.footprintCount,
   reconciledParts:Object.keys(sector.data.frontageCorrections).length,
   streetWays:streets.roads.userData.wayCount,pavingAreaM2:Math.round((pavement?.coverage||0)*(pavement?.metres||0)**2)};
  const layout=options.layout;
  const props=[...layout.trees.map(t=>[t.point,Math.max(2.1,t.radius)]),
   ...[...layout.lamps,...layout.benches].map(ll=>[ll,2])].map(([ll,r])=>{
    const p=project(...ll);return [p.x,p.z,r];
   });
  claims.push({ids:[],rings:[],props,green:[maskRing(layout.perimeter.map(ll=>project(...ll)))]});
 }
 if(surroundings){
  const {context,data}=surroundings;
  claims.push(contextClaims(context,data,project));
  pavement=sampleAtlasPavement(context,sites['plaza-mayor']?.group);
  let meshes=0,triangles=0;
  context.group.traverseVisible(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  contextStats={id,meshes,triangles,buildings:data.buildings?.length||0,pavingAreaM2:Math.round((pavement?.coverage||0)*(pavement?.metres||0)**2)};
 }
 if(id==='castle'||id==='theatre'){
  for(const ref of module[id+'BuildingIds']||[])claims[0].ids.add(String(ref).replace(/^cat-/,''));
  if(id==='theatre')claims[0].rings.push(maskRing(area.theatrePolygon.map(c=>project(...c))));
 }
 if(id==='castle'){
  // Use the castle's actual path and step faces to suppress only overlapping
  // generic road fragments and to keep the visitor on the same walking level.
  // The archaeological and natural ground outside these paths remains intact.
  const routeSurface=mesh=>mesh.isMesh&&
   (mesh.userData.publicWalkingSurface===true||mesh.userData.component==='caminos'&&mesh.userData.materialKind==='path'||
    mesh.userData.component==='escalones'&&mesh.userData.materialKind==='ashlar');
  pavement=sampleAtlasPavement({group:outer},null,routeSurface);
  const visit=sites.castle.group.userData.visit;
  contextStats={id,paths:module.castleRoadIds?.size||0,mappedBuildings:visit.stats.mappedBuildings,
   pavingAreaM2:Math.round((pavement?.coverage||0)*(pavement?.metres||0)**2)};
 }
 if(id==='forum-plaza'){
  // Public paths share one mask and walking sampler, including the lower park
  // deck. Context streets keep their own footprints outside the irregular pit.
  const context=surroundings?.context;
  pavement=sampleAtlasPavement({group:outer},null,mesh=>mesh.isMesh&&
   (mesh.userData.publicWalkingSurface===true||!!context?.surfaces?.getObjectById(mesh.id)));
  const green=(sites[id].vegetationExclusions||[]).map(ring=>maskRing(ring.map(p=>frame.world(p.x,p.z)))).filter(Boolean);
  claims.push({ids:[],rings:[],green});
  contextStats={...contextStats,id,park:sites[id].visit?.stats||sites[id].group.userData.visit?.stats,
   pavingAreaM2:Math.round((pavement?.coverage||0)*(pavement?.metres||0)**2)};
 }
 if(id==='theatre'&&sites.theatre.group.userData.environs){
  const environs=sites.theatre.group.userData.environs;
  // Register the same planted area used by the Atlas. It suppresses generic
  // trees only; approach paths must not erase neighbouring cadastral buildings.
  const green=environs.vegetationExclusions.map(polygon=>maskRing(polygon.map(p=>frame.world(p.x,p.z)))).filter(Boolean);
  claims.push({ids:[],rings:[],green});
  // The actual top faces mask only the new paved footprints, preserving the
  // rest of each OSM street and supporting the visitor on the rebuilt steps.
  pavement=sampleAtlasPavement({group:outer},null,mesh=>mesh.isMesh&&mesh.userData.component==='entorno-accesos');
  let meshes=0,triangles=0;
  outer.traverseVisible(mesh=>{if(mesh.isMesh&&mesh.userData.component?.startsWith('entorno-')){
   meshes++;triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;
  }});
  contextStats={id,meshes,triangles,trees:environs.qa.trees.length,paths:environs.qa.sourceWayIds.length,
   pavingAreaM2:Math.round((pavement?.coverage||0)*(pavement?.metres||0)**2)};
 }
 const model={group:outer,claims,relief,pavement,contextStats,contextGroup:surroundings?.context.group,animate:made.animate,setDensity:landscapeDetail(outer),setHistorical(on){
  for(const site of Object.values(sites))if(site.currentGroup&&site.historicalGroup){
   site.currentGroup.visible=!on;site.historicalGroup.visible=on;
  }
  if(sites.diana){sites.diana.remains.visible=!on;sites.diana.reconstruction.visible=on;}
 }};
 model.publicDeck=samplePublicDeck(outer);
 const floorAt=(x,z)=>heightOnPavement(model.publicDeck,x,z)??heightOnPavement(pavement,x,z)??(heightAt(x,z)+reliefDelta(relief,x,z));
 model.walkBarriers=bindVisit?await prepareWalkingBarriers(outer,floorAt,needed):sampleHeritageBarriers(outer,floorAt);
 if(!model.walkBarriers){releaseModel(outer);return null;}
 bindVisit?.({model,sites,options,frame,heightAt:adjusted,renderer});
 return model;
}
