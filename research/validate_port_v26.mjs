// V26: exercise the exact production Puerto builder and observation cameras.
// Node replaces only the terrain texture loader; geometry, cartography and source materials are real.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {createCity} from '../dist/js/city.js';
import {createUrbanSurface} from '../dist/js/urban-surface.js';
import {createHeightSampler,buildTerrainGeometry} from '../dist/js/terrain.js';
import {catalog,byId,tourOrder} from '../dist/js/catalog.js';
import {registerArchaeology} from '../dist/js/archaeology.js';
import {registerCoastHeritage} from '../dist/js/coast.js';
import {registerLandscapes} from '../dist/js/landscapes.js';
import {registerPortHeritage,createPortHeritage,portShape,portMeshOptions,inPortBounds} from '../dist/js/port.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256),querySelector:()=>({checked:true})};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const out='research/validation-v26/';fs.mkdirSync(out,{recursive:true});
const portGeo=read('port-cartography'),portElevation=read('port-elevation'),hornoData=read('horno-visit'),hornoContextData=read('horno-context'),talleresData=read('talleres-visit'),talleresContextData=read('talleres-context'),museoIndustrialData=read('museo-industrial-visit'),museoIndustrialContextData=read('museo-industrial-context');hornoData.plan=read('horno-plan');talleresData.plan=read('talleres-plan');museoIndustrialData.plan=read('museo-industrial-plan');
const gerenciaData=read('gerencia-visit'),gerenciaContextData=read('gerencia-context');gerenciaData.plan=read('gerencia-plan');
const casinoData=read('casino-visit'),casinoContextData=read('casino-context');casinoData.plan=read('casino-plan');
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const portHeight=createHeightSampler(portElevation),heightAt=portHeight;
registerArchaeology(['archaeology-domestic','archaeology-public','archaeology-necropolis'].map(read),catalog,byId,tourOrder);
const portRecords=registerPortHeritage(['port-industrial','port-garden','port-workers'].map(read),catalog,byId,tourOrder);
registerCoastHeritage(['coast-pier','coast-grau','coast-archaeology'].map(read),catalog,byId,tourOrder);
registerLandscapes(['landscape-marjal','landscape-dunes','landscape-palancia'].map(read),catalog,byId,tourOrder);
const scene=new THREE.Group(),renderer={shadowMap:{needsUpdate:false}},regionsBuilt=new Set(),regionRoots=new Map(),regionUsed=new Map(),points={},views={},modelBounds={};
let portHeritage,portTerrain,portCity,portUrban,portFocus=null,activeRegion='puerto',selected='casino',innerWidth=1363,innerHeight=936;
const pause=()=>Promise.resolve(),$=()=>({textContent:'',classList:{contains:()=>false}}),isLandscape=()=>false,landscapes={};
const regionTerrain=()=>portTerrain,regionOf=c=>c?.region||'sagunto',updateStatus=()=>{},applyRegionVisibility=()=>{for(const root of scene.children)root.visible=true;};
const mobile=()=>innerWidth<=700,guidedIds=['casino'],visitState={stopId:null,sectionOpen:false},casinoVisit=()=>portHeritage?.sites?.casino?.visit;
const guidedVisit=(name=selected)=>name==='casino'?{model:casinoVisit(),data:casinoData,stopId:visitState.stopId,sectionOpen:visitState.sectionOpen,overviewId:'casino-conjunto'}:null;
const excavation=null,coastFocus=null,landscapeFocus=null,coastModes={};
async function createTerrain({data,heightAt,patches,meshOptions}){
 const built=buildTerrainGeometry(data,heightAt,patches,meshOptions),group=new THREE.Group(),mesh=new THREE.Mesh(built.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));
 mesh.name='Terrain IGN Puerto';mesh.userData.orthophoto=true;group.add(mesh);
 const fp=[];for(const patch of patches){if(!patch.polygon?.length||!Number.isFinite(patch.height))continue;const top=patch.height-.04;for(let i=0;i<patch.polygon.length;i++){const a=patch.polygon[i],b=patch.polygon[(i+1)%patch.polygon.length],bottom=Math.min(top-6,heightAt(a.x,a.z)-3,heightAt(b.x,b.z)-3);fp.push(a.x,top,a.z,b.x,top,b.z,b.x,bottom,b.z,a.x,top,a.z,b.x,bottom,b.z,a.x,bottom,a.z);}}
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.computeVertexNormals();const foundation=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:'#b4a58a'}));foundation.name='Zócalos bajo las cimentaciones';group.add(foundation);
 return{...built,mesh,group,foundation,setMode(mode){this.mode=mode;}};
}
const app=fs.readFileSync('dist/js/app.js','utf8');
const buildRegion=eval('('+app.slice(app.indexOf('async function buildRegion('),app.indexOf('function updateStatus(')).trim()+')');
const castleFrame=eval('('+app.slice(app.indexOf('function castleFrame('),app.indexOf('function preset(')).trim()+')');
const preset=eval('('+app.slice(app.indexOf('function preset('),app.indexOf('function setShadowFraming(')).trim()+')');
const tracked=['dist/js/app.js','dist/js/port.js','dist/js/port-industrial.js','dist/js/horno.js','dist/js/horno-context.js','dist/js/horno-map.js','dist/js/talleres.js','dist/js/talleres-context.js','dist/js/talleres-map.js','dist/assets/data/talleres-visit.json','dist/assets/data/talleres-context.json','dist/assets/data/talleres-plan.json','dist/assets/data/horno-visit.json','dist/assets/data/horno-context.json','dist/assets/data/horno-plan.json','dist/js/museo-industrial.js','dist/js/museo-industrial-context.js','dist/js/museo-industrial-map.js','dist/assets/data/museo-industrial-visit.json','dist/assets/data/museo-industrial-plan.json','dist/assets/data/museo-industrial-context.json','dist/assets/data/port-industrial.json','dist/js/port-garden.js','dist/assets/data/port-garden.json','dist/js/gerencia.js','dist/js/gerencia-context.js','dist/js/gerencia-map.js','dist/assets/data/gerencia-visit.json','dist/assets/data/gerencia-plan.json','dist/assets/data/gerencia-context.json','dist/js/casino.js','dist/js/casino-context.js','dist/js/casino-map.js','dist/assets/data/casino-visit.json','dist/assets/data/casino-plan.json','dist/assets/data/casino-context.json'];
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),inputHashes=Object.fromEntries(tracked.map(f=>[f,hash(f)]));
const started=performance.now();await buildRegion('puerto');scene.updateMatrixWorld(true);const buildMs=performance.now()-started;
const site=portHeritage.sites.casino,visit=site.visit,terrainMesh=portTerrain.mesh,foundation=portTerrain.foundation,checks=[],errors=[],cameras=[];
const assert=(ok,label,detail=null)=>{checks.push({label,pass:!!ok});if(!ok)errors.push({label,detail});};
assert(catalog.length===31&&new Set(catalog.map(c=>c.id)).size===31,'31 unique atlas places');
assert(Object.keys(portHeritage.sites).length===9,'Nine industrial heritage places preserved');
assert(casinoData.stops.length===20&&new Set(casinoData.stops.map(s=>s.id)).size===20,'20 unique Casino visit stops');
assert(casinoData.stops.every(s=>visit.focuses[s.id]),'Every documented stop has a physical focus');
assert(regionsBuilt.has('puerto')&&scene.children.every(g=>g.visible),'Production region marked ready and its roots made visible');
assert(portHeritage.sites.talleres.visit&&portHeritage.sites.horno.visit&&portHeritage.sites['museo-industrial'].visit&&portHeritage.sites.gerencia.visit,'Previous detailed industrial and Gerencia visits retained');
for(const b of portGeo.buildings.filter(b=>String(b.id).includes('8338801YJ3983N')))assert(portHeritage.excludedIds.has(String(b.id)),'Cadastral Gerencia duplicate excluded: '+b.id);
const visible=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;};
let nonfinite=0,triangles=0,meshes=0;scene.traverse(o=>{if(!o.isMesh)return;meshes++;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;if(o.instanceMatrix)for(const v of o.instanceMatrix.array)if(!Number.isFinite(v))nonfinite++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});
assert(nonfinite===0,'All integrated vertices, attributes and instances are finite');
const ray=new THREE.Raycaster();
function firstHit(roots,position,target,margin=.2){const delta=target.clone().sub(position);ray.set(position,delta.clone().normalize());ray.near=.03;ray.far=Math.max(.03,delta.length()-margin);return ray.intersectObjects(roots,true).find(h=>visible(h.object)&&h.object.material?.opacity!==0);}
const cases=casinoData.stops.map(s=>({id:s.id,section:!!visit.focuses[s.id].requiresSection}));cases.push({id:'casino-conjunto',section:true});
for(const test of cases){visitState.stopId=test.id;visitState.sectionOpen=test.section;visit.selectFocus?.(test.id);visit.setSection?.(test.section);scene.updateMatrixWorld(true);const f=visit.getFocus?.(test.id)||visit.focuses[test.id];
 for(const[w,h]of[[1363,936],[390,844],[844,390]])for(const near of[false,true]){
  innerWidth=w;innerHeight=h;const dest=preset('casino',near),frame=castleFrame(w,h),camera=new THREE.PerspectiveCamera(dest.fov||38,w/h,.12,15000);camera.position.copy(dest.position);camera.lookAt(dest.target);camera.setViewOffset(w,h,frame.offsetX,frame.offsetY,w,h);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const label=test.id+'/'+(test.section?'cut':'current')+'/'+w+'x'+h+'/'+(near?'near':'full');
  const clearance=dest.position.y-portTerrain.meshHeightAt(dest.position.x,dest.position.z),ground=firstHit([terrainMesh,foundation],dest.position,dest.target),context=firstHit([portCity.buildings,...[portHeritage.hornoContext,portHeritage.talleresContext,portHeritage.museoIndustrialContext,portHeritage.gerenciaContext,portHeritage.casinoContext].map(c=>c.group),...Object.entries(portHeritage.sites).filter(([id])=>id!=='casino').map(([,s])=>s.group)],dest.position,dest.target);
  const corners=[];if(!near&&f.fitBounds!==false&&f.bounds)for(const x of[f.bounds.min.x,f.bounds.max.x])for(const y of[f.bounds.min.y,f.bounds.max.y])for(const z of[f.bounds.min.z,f.bounds.max.z]){const q=new THREE.Vector3(x,y,z).project(camera),px=(q.x*.5+.5)*w,py=(-q.y*.5+.5)*h;if(px<frame.left-.03||px>frame.right+.03||py<frame.top-.03||py>frame.bottom+.03)corners.push([px,py]);}
  assert([...dest.position.toArray(),...dest.target.toArray()].every(Number.isFinite),label+' finite camera');
  assert(clearance>=1.5,label+' camera clears final terrain',clearance);assert(!ground,label+' sightline clears terrain',ground?{name:ground.object.name,point:ground.point.toArray()}:null);assert(!corners.length,label+' feature fits the available viewport',corners);
  const immediate=[];if(f.interiorView)for(const sx of[-.18,0,.18])for(const sy of[-.15,0,.15]){const px=(frame.left+frame.right)/2+sx*frame.width,py=(frame.top+frame.bottom)/2+sy*frame.height;ray.setFromCamera(new THREE.Vector2(px/w*2-1,1-py/h*2),camera);ray.near=.02;ray.far=.20;const hit=ray.intersectObject(site.group,true).find(q=>visible(q.object));if(hit)immediate.push(hit.object.name);}
  assert(!immediate.length,label+' interior camera is outside near-field solid geometry',immediate);
  if(!['casino-jardin','casino-pista','casino-escenario','casino-arbolado','casino-taquilla','casino-entorno','casino-memoria','casino-conjunto'].includes(test.id))assert(!context||context.point.distanceTo(dest.target)<2,label+' surrounding buildings do not obstruct the feature',context?{name:context.object.name,distanceToTarget:context.point.distanceTo(dest.target)}:null);
  cameras.push({id:test.id,section:test.section,width:w,height:h,near,fov:dest.fov||38,position:dest.position.toArray(),target:dest.target.toArray(),clearance,interiorView:!!f.interiorView,offFrameCorners:corners.length,immediate,ground:ground?.object.name||null,context:context?{name:context.object.name,distanceToTarget:context.point.distanceTo(dest.target)}:null});
 }
}
visitState.stopId=null;visit.setSection?.(false);visit.selectFocus?.(null);scene.updateMatrixWorld(true);
for(const[id,s]of Object.entries(portHeritage.sites)){assert(!modelBounds[id].isEmpty(),id+' retains nonempty metric geometry');if(s.roof){s.roof.visible=false;assert(s.group.children.some(o=>o!==s.roof&&o.visible),id+' roof control leaves permanent architecture');s.roof.visible=true;}}
// Exercise the actual layer handler: detailed vegetation must follow the same
// user control as generic vegetation, without hiding the Casino or previous architecture.
{
 const monuments=null,sacred=null,civic=null,archaeology=null,terrain=null,city=null,coastTerrain=null,coastHeritage=null,coastCity=null,coastEnvironment=null,archaeologicalVisitIds=new Set();
 const applyActualVisibility=eval('('+app.slice(app.indexOf('function applyRegionVisibility('),app.indexOf('function setRegion(')).trim()+')');
 let vegetationEnabled=false;const originalQuery=document.querySelector;
 document.querySelector=selector=>({checked:selector.includes('vegetation')?vegetationEnabled:true});
 applyActualVisibility();const contexts=[portHeritage.hornoContext,portHeritage.talleresContext,portHeritage.museoIndustrialContext,portHeritage.gerenciaContext,portHeritage.casinoContext];assert(contexts.every(c=>!c.vegetation.visible)&&!portCity.vegetation.visible,'Vegetation layer hides all five detailed contexts and generic city trees');
 assert(site.group.visible&&portHeritage.group.visible,'Vegetation switch preserves the Casino architecture');
 vegetationEnabled=true;applyActualVisibility();assert(contexts.every(c=>c.vegetation.visible)&&portCity.vegetation.visible,'Vegetation layer restores all six vegetation groups');
 document.querySelector=originalQuery;
}
assert(tracked.every(f=>hash(f)===inputHashes[f]),'No integration inputs changed during validation');
const report={pass:!errors.length,generatedAt:new Date().toISOString(),checks:checks.length,buildMs,meshes,triangles,stats:visit.stats,context:portHeritage.casinoContext.stats,errors,cameras,inputHashes,limitations:['CPU geometry and camera checks do not measure browser GPU performance.','Interior geometry and unmeasured details remain a documented interpretation.']};
fs.writeFileSync(out+'integrated-scene-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks,cameras:cameras.length,buildMs,meshes,triangles,errors},null,2));
if(process.argv.includes('--export')&&!errors.length){
 const typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null,maps=new Map();fs.mkdirSync(out+'textures',{recursive:true});
 const texPath=t=>{if(!t?.image?.toBuffer)return null;if(!maps.has(t)){const bytes=t.image.toBuffer('image/png'),digest=createHash('sha256').update(bytes).digest('hex').slice(0,20),path=out+'textures/material-'+digest+'.png';fs.writeFileSync(path,bytes);maps.set(t,path);}return maps.get(t);};
 function compact(source,matrix,centre,radius){const pos=source.attributes.position,ix=source.index,attrs=Object.entries(source.attributes),indices=[],remap=new Map(),arrays=Object.fromEntries(attrs.map(([n])=>[n,[]])),ps=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];for(let t=0;t<(ix?.count||pos.count);t+=3){const ids=[0,1,2].map(k=>ix?ix.getX(t+k):t+k);for(let k=0;k<3;k++)ps[k].fromBufferAttribute(pos,ids[k]).applyMatrix4(matrix);if(ps.every(p=>p.x<centre.x-radius)||ps.every(p=>p.x>centre.x+radius)||ps.every(p=>p.z<centre.z-radius)||ps.every(p=>p.z>centre.z+radius))continue;for(const id of ids){if(!remap.has(id)){remap.set(id,remap.size);for(const[n,a]of attrs)for(let k=0;k<a.itemSize;k++)arrays[n].push(a.array[id*a.itemSize+k]);}indices.push(remap.get(id));}}if(!indices.length)return null;const g=new THREE.BufferGeometry();for(const[n,a]of attrs)g.setAttribute(n,new THREE.BufferAttribute(new a.array.constructor(arrays[n]),a.itemSize,a.normalized));g.setIndex(indices);return g;}
 const requested=process.env.CASINO_RENDER_STOPS?.split(',')||['casino-conjunto','casino-fachada','casino-patio','casino-galeria','casino-biblioteca','casino-jardin','casino-seccion'];
 for(const name of requested){console.error('Exporting geometry: '+name);const id=name,f=visit.focuses[id],section=!!f.requiresSection;visitState.stopId=id;visit.selectFocus?.(id);visit.setSection?.(section);scene.updateMatrixWorld(true);const centre=f.target.clone(),renderRadius=id==='casino-conjunto'||id==='casino-seccion'?220:160;
  const meshData=[];function append(o,matrix,color){const bound=new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(matrix);if(o!==terrainMesh&&bound.distanceToPoint(centre)>renderRadius)return;const g=compact(o.geometry,matrix,centre,renderRadius+20);if(!g)return;const m=Array.isArray(o.material)?o.material[0]:o.material;meshData.push({name:o.name,positions:typed(g.attributes.position.array),normals:typed(g.attributes.normal?.array),indices:typed(g.index?.array),uv:typed(g.attributes.uv?.array),colors:typed(g.attributes.color?.array),matrix:matrix.toArray(),component:o.userData.component||null,material:{color:(color?m.color.clone().multiply(color):m.color).toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,emissive:m.emissive?.toArray(),emissiveIntensity:m.emissiveIntensity??0,orthophoto:!!o.userData.orthophoto,map:texPath(m.map),bumpMap:texPath(m.bumpMap),bumpScale:m.bumpScale??0}});g.dispose();}
  scene.traverse(o=>{if(!o.isMesh||!visible(o))return;if(o.isInstancedMesh){const instance=new THREE.Matrix4(),matrix=new THREE.Matrix4(),color=new THREE.Color();for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);if(o.instanceColor)o.getColorAt(i,color);append(o,matrix,o.instanceColor?color:null);}}else append(o,o.matrixWorld);});
  const lights=[];site.group.traverse(o=>{if(o.isPointLight&&visible(o))lights.push({name:o.name,position:o.getWorldPosition(new THREE.Vector3()).toArray(),color:o.color.toArray(),intensity:o.intensity,distance:o.distance,decay:o.decay});});
  const offset=new THREE.Vector3(...(f.renderOffset||f.offset));let position=f.target.clone().add(offset),fov=f.fov||48;
  if(f.fitBounds!==false&&f.bounds){const box=f.bounds,dir=offset.clone().normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize(),tan=Math.tan(THREE.MathUtils.degToRad(fov/2));let distance=offset.length();for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const rel=new THREE.Vector3(x,y,z).sub(f.target);distance=Math.max(distance,rel.dot(dir)+Math.max(Math.abs(rel.dot(right))/(tan*4/3*.85),Math.abs(rel.dot(up))/(tan*.85)));}position=f.target.clone().addScaledVector(dir,distance);}
  fs.writeFileSync(out+name+'-geometry.json.gz',zlib.gzipSync(JSON.stringify({terrainImage:'dist/assets/data/port-orthophoto.jpg',interiorView:!!f.interiorView,lights,meshes:meshData,cameras:[{name,position:position.toArray(),target:f.target.toArray(),fov}],sectionRemoved:[]})));
 }
}
if(errors.length)process.exitCode=1;
