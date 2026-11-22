import * as THREE from 'three';
import {atlasProject,documentData,registerFrame} from './territory-heritage-catalog.js';
import {heritageRelief,reliefDelta} from './territory-heritage-relief.js';
import {sampleAtlasPavement} from './territory-heritage-paving.js';

// Each table entry addresses the original geometry constructor, including
// sectional interiors and original texture generation. Only one site is built
// at a time, after the previously requested place has yielded to the browser.
const definitions={
 castle:['castle','createCastle',()=>import('./castle.js')],theatre:['theatre','createTheatre',()=>import('./theatre.js')],
 'santa-maria':['santa-maria','createSantaMaria',()=>import('./santa-maria.js')],'plaza-mayor':['plaza-mayor','createPlazaMayor',()=>import('./plaza-mayor.js')],
 juderia:['juderia','createJuderia',()=>import('./juderia.js')],calvario:['calvario','createCalvario',()=>import('./calvario.js')],berenguer:['berenguer','createBerenguer',()=>import('./berenguer.js')],
 sangre:['sangre','createSangre',()=>import('./sangre.js')],salvador:['salvador','createSalvador',()=>import('./salvador.js')],museo:['museo','createMuseo',()=>import('./museo.js')],
 portic:['portic','createPortic',()=>import('./portic.js')],domus:['domus','createDomus',()=>import('./domus.js')],circo:['circo','createCirco',()=>import('./circo.js')],necropolis:['necropolis','createNecropolis',()=>import('./necropolis.js')],
 horno:['horno','createHorno',()=>import('./horno.js')],talleres:['talleres','createTalleres',()=>import('./talleres.js')],'museo-industrial':['museo-industrial','createMuseoIndustrial',()=>import('./museo-industrial.js')],
 gerencia:['gerencia','createGerencia',()=>import('./gerencia.js')],casino:['casino','createCasino',()=>import('./casino.js')],begona:['begona','createBegona',()=>import('./begona.js')],
 economato:['economato','createEconomato',()=>import('./economato.js')],'barrio-obrero':['barrio','createBarrio',()=>import('./barrio.js')],sanatorio:['sanatorio','createSanatorio',()=>import('./sanatorio.js')],
 'grau-vell':['coast-grau','createCoastGrau',()=>import('./coast-grau.js')],'pantalan':['coast-pier','createCoastPier',()=>import('./coast-pier.js')],'puerto-antiguo':['coast-archaeology','createCoastArchaeology',()=>import('./coast-archaeology.js')],
 'marjal-moros':['landscape-marjal','createMarshLandscape',()=>import('./landscape-marjal.js')],'dunas-almarda':['landscape-dunes','createDunesLandscape',()=>import('./landscape-dunes.js')],'rio-palancia':['landscape-palancia','createPalanciaLandscape',()=>import('./landscape-palancia.js')]
};
const archiveOnly=new Set(['pantalan','grau-vell','puerto-antiguo','marjal-moros','dunas-almarda','rio-palancia']);
export const modelId=id=>id==='diana'?'berenguer':id.startsWith('pantalan-')?'pantalan':id;

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
 const density={instances:0,total:0};
 for(const o of meshes)density.total+=o.userData.territoryInstances[0];
 let previousCap;
 return (altitude,quality)=>{
  const cap=quality>=2&&altitude<200?Infinity:quality>=1&&altitude<550?160000:14000;
  if(previousCap===cap)return density;
  previousCap=cap;density.instances=0;
  for(const o of meshes){
   const [count,cost]=o.userData.territoryInstances;
   o.count=Math.min(count,Math.max(1,Math.floor(cap/cost)));
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
 for(const m of materials){for(const t of Object.values(m))if(t?.isTexture)textures.add(t);m.dispose();}
 for(const g of geometries)g.dispose();
 for(const t of textures)t.dispose();
 group.removeFromParent();
}

export async function buildHeritageModel(id,{places,records,area,heightAt,project,needed}){
 const primary=id==='pantalan'?'pantalan-paseo':id,place=places.find(p=>p.id===primary);
 const [file,func,loadFactory]=definitions[id],frame=registerFrame(place,project);
 const sample=(x,z)=>{const p=frame.world(x,z);return heightAt(p.x,p.z);};
 const record=records[primary];
 const options={heightAt:sample,project:atlasProject,records,data:area,record,site:record};
 const get=async(name,key)=>{options[key]=await documentData(name,false);};
 const requests=[loadFactory()];
 if(!archiveOnly.has(id)){
  requests.push(get(file+'-visit','visitData'));
  if(id!=='castle'&&id!=='theatre')requests.push(get(file+'-context','contextData'));
 }
 if(id==='grau-vell')requests.push(get('grau-visit','grauVisit'),get('grau-context','grauContextData'));
 if(id==='pantalan')requests.push(get('pantalan-paseo-visit','pantalanPaseoVisit'),get('pantalan-maritimo-visit','pantalanMaritimoVisit'),get('pantalan-context','contextData'));
 if(record.landscape){
  requests.push(get(record.region+'-cartography','data'));
 }
 const [module]=await Promise.all(requests);
 if(!needed())return null;
 const {hasAtlasContext,originalSurroundings,settleSourceClaims}=await import('./territory-heritage-contexts.js');
 await settleSourceClaims(id,options);
 if(options.visitData&&id!=='castle')options.visitData.plan=await documentData(file+'-plan',false);
 if(!needed())return null;
 const made=module[func](options);
 const sites=made.sites||{[id]:made.isObject3D?{group:made}:made};
 const local=made.isObject3D?made:made.group;
 if(id==='berenguer'&&made.dianaSite){
  sites.diana=made.dianaSite;
  local.attach(made.dianaSite.group);
 }
 const outer=new THREE.Group();outer.name='Atlas · '+place.name;
 outer.matrixAutoUpdate=false;
 outer.matrix.set(frame.a,0,frame.b,frame.tx,0,1,0,0,frame.c,0,frame.d,frame.tz,0,0,0,1);
 outer.add(local);
 // Every context factory draws in the Atlas metre grid, including those whose
 // monument constructor has a rotated or translated local frame of its own.
 const surroundings=hasAtlasContext(id)?originalSurroundings(id,options,sites):null;
 if(surroundings)outer.add(surroundings.context.group);
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
 const claims=Object.entries(sites).map(([key,site])=>claimsFor(site,records[key],frame,project));
 let pavement=null,contextStats=null;
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
 return {group:outer,claims,relief,pavement,contextStats,setDensity:landscapeDetail(outer),setHistorical(on){
  for(const site of Object.values(sites))if(site.currentGroup&&site.historicalGroup){
   site.currentGroup.visible=!on;site.historicalGroup.visible=on;
  }
  if(sites.diana){sites.diana.remains.visible=!on;sites.diana.reconstruction.visible=on;}
 }};
}
