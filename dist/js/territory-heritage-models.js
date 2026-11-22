import * as THREE from 'three';
import {atlasProject,documentData,registerFrame} from './territory-heritage-catalog.js';
import {heritageRelief} from './territory-heritage-relief.js';

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
// At territory scale, retain the survey-based structures and sample the
// interpreted grass/pebble instances evenly across their existing positions.
function landscapeLod(site){
 const matrix=new THREE.Matrix4(),color=new THREE.Color();
 site.group.traverse(o=>{
  if(!o.isInstancedMesh)return;
  const isDecoration=site.vegetation?.getObjectById(o.id)||/cantos|grava|tornillería|guijarros|cantos rodados/i.test(o.name);
  if(!isDecoration)return;
  const triangles=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
  const step=Math.ceil(o.count*triangles/14000);
  if(step<2)return;
  let count=0;
  for(let i=0;i<o.count;i+=step){
   o.getMatrixAt(i,matrix);o.setMatrixAt(count,matrix);
   if(o.instanceColor){o.getColorAt(i,color);o.setColorAt(count,color);}
   count++;
  }
  o.count=count;o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;
  o.computeBoundingSphere();
 });
}

export function inRing(x,z,ring){
 if(x<ring.left||x>ring.right||z<ring.top||z>ring.bottom)return false;
 let inside=false;
 const p=ring.points;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  if((p[i].z>z)!==(p[j].z>z)&&x<(p[j].x-p[i].x)*(z-p[i].z)/(p[j].z-p[i].z)+p[i].x)inside=!inside;
 }
 return inside;
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
 const coastalContext=id==='grau-vell'||id==='pantalan';
 if(coastalContext)requests.push((id==='grau-vell'?import('./grau-context.js'):import('./pantalan-context.js')).then(m=>{options.makeContext=m.createGrauContext||m.createPantalanContext;}));
 if(record.landscape){
  requests.push(get(record.region+'-cartography','data'));
 }
 const [module]=await Promise.all(requests);
 if(!needed())return null;
 if(options.visitData&&id!=='castle')options.visitData.plan=await documentData(file+'-plan',false);
 if(!needed())return null;
 const made=module[func](options);
 const sites=made.sites||{[id]:made.isObject3D?{group:made}:made};
 const local=made.isObject3D?made:made.group;
 let surroundings;
 if(coastalContext){
  surroundings=options.makeContext({...options,contextData:options.grauContextData||options.contextData});
  surroundings.surfaces.visible=false; // The shared road network owns the pavement.
  local.add(surroundings.group);
 }
 if(id==='berenguer'&&made.dianaSite){
  sites.diana=made.dianaSite;
  local.attach(made.dianaSite.group);
 }
 const outer=new THREE.Group();outer.name='Atlas · '+place.name;
 outer.matrixAutoUpdate=false;
 outer.matrix.set(frame.a,0,frame.b,frame.tx,0,1,0,0,frame.c,0,frame.d,frame.tz,0,0,0,1);
 outer.add(local);outer.updateMatrixWorld(true);
 for(const [key,site] of Object.entries(sites)){
  site.setSection?.(false);
  if(site.currentGroup)site.currentGroup.visible=true;
  if(site.historicalGroup)site.historicalGroup.visible=false;
  if(site.reconstruction)site.reconstruction.visible=false;
  if(site.hypotheses)site.hypotheses.visible=false;
  if(site.remains)site.remains.visible=true;
  if(records[key].landscape)landscapeLod(site);
  site.setPresentation?.({mode:'current',selected:false,opening:0,hypotheses:false,roofOpen:false});
  site.group.userData.territoryPlace=key;
 }
 const claims=Object.entries(sites).map(([key,site])=>claimsFor(site,records[key],frame,project));
 if(surroundings)claims.push(claimsFor(surroundings,{},frame,project));
 if(id==='castle'||id==='theatre'){
  for(const ref of module[id+'BuildingIds']||[])claims[0].ids.add(String(ref).replace(/^cat-/,''));
  if(id==='theatre')claims[0].rings.push(maskRing(area.theatrePolygon.map(c=>project(...c))));
 }
 const relief=heritageRelief(id,sites,frame,place,heightAt,sample);
 return {group:outer,claims,relief,setHistorical(on){
  for(const site of Object.values(sites))if(site.currentGroup&&site.historicalGroup){
   site.currentGroup.visible=!on;site.historicalGroup.visible=on;
  }
  if(sites.diana){sites.diana.remains.visible=!on;sites.diana.reconstruction.visible=on;}
 }};
}
