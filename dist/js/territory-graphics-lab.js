// A separate, bounded real-data preview. It never changes the production
// simulator's backend or loads a second renderer alongside its canvas.
import * as G from 'three/webgpu';
import {vec3} from 'three/tsl';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {rendererPlan,inspectAdapter} from './territory-backend-policy.js';
import {labMaterials} from './territory-webgpu-materials.js';
import {resource,territoryBase,networkBase,loadElevation,makeSampler} from './territory-ground.js';
import {loadHeritageCatalog} from './territory-heritage-catalog.js';
import {project} from './territory-coordinates.js';
import {streetGeometry,streetAreas} from './territory-street-surfaces.js';
import {loadStreetFronts} from './territory-street-fronts.js';
import {boundsDistance} from './territory-stream-policy.js';
import {createWaterMask} from './coast-environment.js';
import {createNativeCoast} from './territory-webgpu-coast.js';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search),requested=['auto','webgpu','webgl2'].includes(params.get('engine'))?params.get('engine'):'auto';
const zones={'sagunto':'plaza-mayor','puerto':'horno','grau':'grau-vell'},zone=Object.hasOwn(zones,params.get('zone'))?params.get('zone'):'sagunto';
const compact=matchMedia('(pointer:coarse)').matches||(navigator.deviceMemory||8)<=4;
const labStatus={ready:false,scope:'pilot',requested,zone};window.saguntumGraphicsLab=labStatus;
const say=s=>{$('lab-status').textContent=s;};
const back=params.get('return')||'#simulador';
$('lab-back').href='./'+(/^#simulador(?:\/[a-z0-9-]+)*$/.test(back)?back:'#simulador');
$('lab-zone').value=zone;$('lab-engine').value=requested;
function reopen(engine,selected,reason=''){
 const u=new URL(location.href);u.searchParams.set('engine',engine);u.searchParams.set('zone',selected);
 if(reason)u.searchParams.set('recovered','1');else u.searchParams.delete('recovered');
 location.replace(u.href);
}
$('lab-engine').onchange=e=>reopen(e.target.value,zone);
$('lab-zone').onchange=e=>reopen(requested,e.target.value);
let renderer,worker,materials,controls,scene,coast,closed=false,attemptNative=false;
async function within(promise,ms,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label)),ms);})]);}finally{clearTimeout(timer);}}
const ownTextures=[],ownGeometries=[],ownMaterials=[];
function failure(error){
 if(closed)return;
 closed=true;labStatus.ready=false;try{renderer?.setAnimationLoop(null);}catch{}
 console.error('Laboratorio SAGUNTUM',error);labStatus.error=String(error?.message||error);
 if(attemptNative&&requested!=='webgl2'&&params.get('recovered')!=='1'){reopen('webgl2',zone,'fallback');return;}
 say('No se pudo iniciar la prueba: '+labStatus.error+'. Puedes regresar al Simulador o elegir otro motor.');
}
async function smokeTest(r){
 const rt=new G.RenderTarget(2,2,{depthBuffer:false,type:G.UnsignedByteType});
 const s=new G.Scene(),c=new G.OrthographicCamera(-1,1,1,-1,.1,10);c.position.z=2;
 const geo=new G.PlaneGeometry(2,2),mat=new G.MeshBasicNodeMaterial({toneMapped:false});mat.colorNode=vec3(.15,.65,.25);
 s.add(new G.Mesh(geo,mat));const previous=r.getRenderTarget();
 try{
  r.setRenderTarget(rt);r.render(s,c);
  const pixels=await r.readRenderTargetPixelsAsync(rt,0,0,2,2);
  if(!pixels||pixels.length<4||!(pixels[1]>pixels[0]+12&&pixels[1]>pixels[2]+12))throw Error('La prueba TSL no produjo los píxeles esperados.');
  return Array.from(pixels.slice(0,4));
 }finally{r.setRenderTarget(previous);geo.dispose();mat.dispose();rt.dispose();}
}
function readWorker(grids){
 worker=new Worker(new URL('./territory-building-worker.js',import.meta.url),{type:'module'});
 worker.postMessage({grids});
 return (key,url)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{worker.terminate();reject(Error('Tiempo de geometría agotado'));},45000);
  worker.onmessage=({data})=>{if(data.key!==key)return;clearTimeout(timer);if(data.error)reject(Error(data.error));else resolve(data.result);};
  worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message||'Worker de edificios'));};
  worker.postMessage({key,url:new URL(territoryBase+url,document.baseURI).href});
 });
}
function geometry(data){
 const g=new G.BufferGeometry();
 for(const [key,size] of [['position',3],['color',3],['uv',2],['archMetric',4],['archData',4]]){
  // Float vertex attributes also work on WebGPU without integer-layout ambiguities.
  const value=data[key] instanceof Float32Array?data[key]:new Float32Array(data[key]);
  g.setAttribute(key,new G.BufferAttribute(value,size));
 }
 g.setIndex(new G.BufferAttribute(data.index,1));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function addMesh(geo,mat,shadow=true){
 if(!geo.attributes.position?.count||geo.index&&geo.index.count===0){geo.dispose();return null;}
 ownGeometries.push(geo);const mesh=new G.Mesh(geo,mat);mesh.castShadow=shadow;mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function terrainMesh(bounds,heightAt,textureBounds){
 const [l,t,r,b]=bounds,[tl,tt,tr,tb]=textureBounds;
 const nx=Math.ceil((r-l)/(compact?8:5)),nz=Math.ceil((b-t)/(compact?8:5)),pos=[],uvs=[],indices=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=l+(r-l)*i/nx,z=t+(b-t)*j/nz;
  pos.push(x,heightAt(x,z),z);uvs.push((x-tl)/(tr-tl),1-(z-tt)/(tb-tt));
 }
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,c=a+nx+1;indices.push(a,c,a+1,a+1,c,c+1);}
 const g=new G.BufferGeometry();g.setAttribute('position',new G.Float32BufferAttribute(pos,3));g.setAttribute('uv',new G.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
async function start(){
 say('Comprobando la capacidad gráfica…');
 const adapter=requested==='webgl2'?{available:false,secure:isSecureContext}:await inspectAdapter();
 const plan=rendererPlan({request:requested,scope:'lab',secure:adapter.secure,adapter:adapter.available,software:adapter.software});
 labStatus.adapter=adapter;labStatus.plan=plan;attemptNative=plan.preferred==='webgpu';
 renderer=new G.WebGPURenderer({forceWebGL:!attemptNative,antialias:!compact,alpha:false,powerPreference:compact?'default':'high-performance'});
 await within(renderer.init(),12000,'Tiempo de inicialización gráfica agotado');
 const native=renderer.backend?.isWebGPUBackend===true;
 attemptNative=native||attemptNative;
 labStatus.backend=native?'WebGPU nativo':'WebGL 2 · renderer TSL';
 if(renderer.backend?.isWebGPUBackend!==true&&renderer.backend?.isWebGLBackend!==true)throw Error('Backend gráfico no identificado.');
 renderer.onDeviceLost=info=>{if(!closed&&info.reason!=='destroyed')failure(Error(info.message||'Dispositivo gráfico perdido'));};
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();failure(Error('Contexto WebGL 2 perdido'));});
 renderer.outputColorSpace=G.SRGBColorSpace;renderer.toneMapping=G.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const device=native?renderer.backend?.device:null;
 device?.pushErrorScope?.('validation');
 try{labStatus.smoke=await within(smokeTest(renderer),10000,'Tiempo de prueba TSL agotado');}
 finally{if(device?.popErrorScope){const error=await within(device.popErrorScope(),5000,'Validación WebGPU agotada');if(error)throw Error(error.message);}}
 device?.addEventListener?.('uncapturederror',e=>{e.preventDefault?.();failure(Error(e.error?.message||'Error de validación WebGPU'));});
 if(closed)return;
 $('lab-active').textContent=labStatus.backend+' · Three.js r'+G.REVISION+' · prueba TSL de píxeles superada';
 say('Preparando cartografía y materiales de la zona…');
 scene=new G.Scene();scene.background=new G.Color('#b9cbd8');scene.fog=new G.FogExp2('#b9cbd8',.0007);
 const camera=new G.PerspectiveCamera(45,1,.15,5000),host=$('lab-world');
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Prueba tridimensional de cartografía real de Sagunto');
 const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,compact?1.2:1.65));renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
 resize();window.addEventListener('resize',resize);
 const [world,network,inventory]=await Promise.all([resource(territoryBase+'world.json'),resource(networkBase+'index.json'),loadHeritageCatalog(project)]);
 const anchor=inventory.places.find(p=>p.id===zones[zone]);if(!anchor)throw Error('Zona no localizada en el registro.');
 const grids=await loadElevation(world.terrain),heightAt=makeSampler(grids);
 const nearby=items=>[...items].sort((a,b)=>boundsDistance(anchor.x,anchor.z,a.geometryBounds||a.bounds)-boundsDistance(anchor.x,anchor.z,b.geometryBounds||b.bounds));
 const roadSector=nearby(network.tiles)[0];if(!roadSector)throw Error('No hay red viaria local.');
 const [l,t,r,b]=roadSector.bounds;
 const tiles=nearby(world.sectors.filter(s=>{const [a,c,d,e]=s.bounds;return a<r&&d>l&&c<b&&e>t;})).slice(0,compact?2:4);
 if(!tiles.length)throw Error('No hay sectores de edificios.');
 const bounds=[Math.min(l,...tiles.map(s=>s.bounds[0])),Math.min(t,...tiles.map(s=>s.bounds[1])),Math.max(r,...tiles.map(s=>s.bounds[2])),Math.max(b,...tiles.map(s=>s.bounds[3]))];
 const mask=createWaterMask({polygons:world.water},(x,z)=>({x,z}));
 const {detail,base}=grids;
 const useCore=detail&&bounds[0]>=detail.bounds[0]&&bounds[1]>=detail.bounds[1]&&bounds[2]<=detail.bounds[2]&&bounds[3]<=detail.bounds[3];
 const textureBounds=(useCore?detail:base).bounds;
 const map=await new G.TextureLoader().loadAsync(territoryBase+'landscape/'+(useCore?'core':'territory')+(compact?'-mobile':'')+'.jpg');
 ownTextures.push(map);map.colorSpace=G.SRGBColorSpace;map.anisotropy=compact?4:8;
 const groundMat=new G.MeshStandardNodeMaterial({map,roughness:1});ownMaterials.push(groundMat);
 addMesh(terrainMesh(bounds,mask.groundHeight(heightAt),textureBounds),groundMat,false);
 materials=await labMaterials(compact);
 const read=readWorker(grids);
 let buildings=0;
 try{for(const tile of tiles){const data=await read(tile.id,tile.url);buildings+=data.rows.length;addMesh(geometry(data),materials.building);}}
 finally{worker?.terminate();worker=null;}
 const [roads,fronts]=await Promise.all([resource(networkBase+roadSector.url),loadStreetFronts(roadSector)]);
 addMesh(streetGeometry(roads,heightAt,fronts),materials.street,false);addMesh(streetAreas(roads.areas||[],heightAt),materials.street,false);
 if(world.water?.length&&zone!=='sagunto'){
  coast=createNativeCoast({mask,shorelines:world.shorelines,project,compact,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches});
  scene.add(coast.water);labStatus.water=coast.stats;
 }
 const y=heightAt(anchor.x,anchor.z);
 const ambient=new G.HemisphereLight('#c9dced','#8b7964',1.6),sun=new G.DirectionalLight('#fff0d6',3);
 sun.position.set(anchor.x-180,y+300,anchor.z-190);sun.target.position.set(anchor.x,y,anchor.z);sun.castShadow=true;
 sun.shadow.mapSize.setScalar(compact?1024:2048);
 Object.assign(sun.shadow.camera,{left:-420,right:420,top:420,bottom:-420,near:1,far:1300});sun.shadow.normalBias=.075;
 scene.add(ambient,sun,sun.target);renderer.shadowMap.enabled=true;
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxDistance=1200;controls.minDistance=8;controls.maxPolarAngle=Math.PI*.495;
 controls.target.set(anchor.x,y,anchor.z);camera.position.set(anchor.x+170,y+125,anchor.z+190);controls.update();
 $('lab-night').onchange=e=>{
  const night=e.target.checked;materials.night.value=night?1:0;sun.intensity=night?.25:3;ambient.intensity=night?.48:1.6;
  scene.background.set(night?'#18283f':'#b9cbd8');scene.fog.color.copy(scene.background);coast?.setLight(night);
 };
 labStatus.buildings=buildings;labStatus.sectors=tiles.length;labStatus.streetWays=roads.roads.length;
 say(buildings+' partes catastrales · '+roads.roads.length+' tramos viarios · '+tiles.length+' sectores. '+(materials.warnings.join(' ')||'Materiales TSL preparados.'));
 let last=0,frames=[],stamp=performance.now();
 renderer.setAnimationLoop(now=>{
  if(closed||document.hidden){last=0;return;}
  try{
   if(last&&now-last<1000)frames.push(now-last);last=now;controls.update();renderer.render(scene,camera);labStatus.ready=true;
   if(now-stamp>1000&&frames.length){
    frames.sort((a,b)=>a-b);labStatus.frameMs=frames[Math.floor(frames.length*.5)];labStatus.frameP95Ms=frames[Math.floor(frames.length*.95)];
    $('lab-stats').textContent=labStatus.frameMs.toFixed(1)+' ms/fotograma · p95 '+labStatus.frameP95Ms.toFixed(1)+' ms · prueba local';frames=[];stamp=now;
   }
  }catch(error){failure(error);}
 });
}
window.addEventListener('pagehide',()=>{
 closed=true;worker?.terminate();controls?.dispose();
 try{renderer?.setAnimationLoop(null);}catch{}
 for(const g of ownGeometries)g.dispose();for(const m of ownMaterials)m.dispose();for(const t of ownTextures)t.dispose();
 materials?.dispose();coast?.dispose();try{renderer?.dispose();}catch{}
},{once:true});
start().catch(failure);
