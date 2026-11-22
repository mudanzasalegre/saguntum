import {wantsPlan,markRendered,goToPlan,retry3D} from './render-session.js';
import * as T from 'three';
import {project} from './territory-coordinates.js';
import {resource,territoryBase,networkBase,loadElevation,makeSampler,buildGround} from './territory-ground.js';
import {createHeritage} from './territory-heritage.js';
import {loadHeritageCatalog,registerFrame} from './territory-heritage-catalog.js';
import {createTerritorySea} from './territory-sea.js';
import {createBuildings} from './territory-stream.js';
import {createNetwork} from './territory-network.js';
import {createNavigation} from './territory-camera.js';
import {createAtmosphere} from './territory-atmosphere.js';
import {contactRenderer} from './territory-contact.js';
import {surfacePhotoMetrics,setTerrainAppearance} from './territory-surface-photo.js';
import {terrainMap} from './territory-map.js';
import {createCanopy} from './territory-canopy.js';

const $=id=>document.getElementById('sim-'+id);
const mobile=matchMedia('(max-width:760px), (pointer:coarse)').matches;
const regions={sagunto:'Sagunto histórico',puerto:'Puerto de Sagunto',coast:'Grau Vell y litoral',palancia:'Río Palancia',marjal:'Marjal dels Moros',almarda:'Dunas de Almardà'};
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const sessionKey='saguntum-territorial-visit';
function readVisit(){try{return JSON.parse(sessionStorage.getItem(sessionKey));}catch{return null;}}
function imageAt(url){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});}
export async function openSimulator(){
  const start=performance.now(),brand=document.querySelector('.brand').cloneNode(true);
  const fragment=await resource('./simulator.html','text');
  document.body.innerHTML=fragment;$('brand').append(brand);
  const [world,index,mapImage,inventory,frames]=await Promise.all([resource(territoryBase+'world.json'),resource(networkBase+'index.json'),imageAt(territoryBase+'map.jpg'),loadHeritageCatalog(project),resource(territoryBase+'atlas-frames.json').catch(()=>({}))]);
  const {places}=inventory,byId=new Map(places.map(p=>[p.id,p]));
  const [sag,port,grau]=['plaza-mayor','horno','grau-vell'].map(id=>byId.get(id));
  const zones=[{...sag,name:'Sagunto histórico',short:'Sagunto'},{...port,name:'Puerto de Sagunto',short:'Puerto'},{...grau,name:'Grau Vell',short:'Grau Vell'}].map(p=>({...p,zone:true}));
  const core={x:(sag.x+port.x)/2,z:(sag.z+grau.z)/2,anchors:zones,range:Math.max(6100,Math.hypot(port.x-sag.x,grau.z-sag.z)*.94)};
  let nav,buildings,network,heritage,atmosphere,renderer,canopy,selected=null,historical=false;
  let focus2D={...core},budget=mobile?0:2,lastBudget=-1,hour=15,markerButtons=[];
  let pixelScale=1;
  let lighting='solar',lightPreference='auto',terrainPreference='auto',exterior=false;
  let presentationReady=false;
  const flags={buildings:true,heritage:true,streets:true,land:true,labels:true,cars:true,people:true};
  const status={ready:false,mode:'cargando',places:places.length,buildings:world.counts.buildingGeometries,routeMetres:index.routeLengthM};
  window.territoryStatus=status;
  const map=terrainMap({world,network:index,zones,places,image:mapImage,onPoint(x,z,p){
    if(p)select(p);else{clear();nav?.flyTo(x,z,300);focus2D={x,z};}
    if(!renderer)syncMapLink();
    map.close();update2D();
  }});
  const credits=document.createElement('span');credits.className='sim-attribution';
  credits.innerHTML='<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> · <a href="https://www.ign.es/" target="_blank" rel="noopener">PNOA / IGN</a> · <a href="https://www.catastro.hacienda.gob.es/webinspire/" target="_blank" rel="noopener">Catastro</a> · <a href="https://icv.gva.es/" target="_blank" rel="noopener">ICV</a> · <a href="https://polyhaven.com/license" target="_blank" rel="noopener">Materiales CC0</a>';
  document.querySelector('.sim-foot').prepend(credits);
  $('credits').textContent='Huellas de Catastro INSPIRE, MDT y ortofoto PNOA del IGN, límite municipal del ICV y red viaria de OpenStreetMap (ODbL). Las alturas derivan de LiDAR, plantas o estimación. Las fachadas y la actividad urbana son interpretativas.';
  function panel(id,open){
    for(const name of ['places','settings']){
      const visible=name===id&&open;$(name).hidden=!visible;
      $(name==='places'?'search-open':'settings-open').setAttribute('aria-expanded',String(visible));
    }
    if(id==='places'&&open)$('query').focus();
  }
  $('search-open').onclick=()=>panel('places',$('places').hidden);
  $('settings-open').onclick=()=>panel('settings',$('settings').hidden);
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>panel(null,false));
  function save(){
    const previous=readVisit()||{};
    const state=nav?{camera:nav.snapshot(),flags,quality:$('quality').value,hour,lighting,lightPreference,terrain:terrainPreference,jets:$('jets').checked}:previous;
    if(!nav&&previous.selected!==selected?.id)delete state.camera;
    try{sessionStorage.setItem(sessionKey,JSON.stringify({...state,selected:selected?.id,exterior}));}catch{}
  }
  function syncMapLink(){
    const url=new URL(location.href);
    url.hash=selected?'simulador/'+$('visit').hash.slice(1):'simulador';
    history.replaceState(history.state,'',url);
  }
  function clear(refresh=true){
    if(historical)heritage?.setHistorical(selected.id,false);selected=null;historical=false;
    $('location').hidden=true;status.selected=null;if(refresh&&presentationReady)applyPresentation();
  }
  function framePlace(p,move){
    const views=frames[p.id],which=exterior?views?.exterior:views;
    const sample=which?.[innerWidth/innerHeight<.85?'portrait':'wide'];
    $('frame').hidden=!nav||!views?.exterior;
    $('frame').textContent=exterior?'Vista del conjunto':(views?.exterior?.label||'Vista cercana');
    $('visit').href=exterior&&views?.exterior?p.href+'/'+views.exterior.stop:p.href;
    if(!move||!nav)return;
    if(!sample){nav.flyTo(p.x,p.z,100);return;}
    const local=registerFrame(p,project);
    const target=local.world(sample.target[0],sample.target[2]);
    const dy=heightAt(target.x,target.z)-sample.ground;
    const vector=([x,y,z])=>{const v=local.world(x,z);return new T.Vector3(v.x,y+dy,v.z);};
    nav.frame(vector(sample.target),vector(sample.eye),sample.fov);
  }
  function select(p,move=true,detail=false){
    clear(false);panel(null,false);map.close();focus2D={x:p.x,z:p.z};
    exterior=detail;
    if(move&&p.zone)nav?.flyTo(p.x,p.z,680);
    if(!p.zone){
      selected=p;status.selected=p.id;$('title').textContent=p.name;$('zone').textContent=regions[p.region]||p.region;
      framePlace(p,move);$('history').hidden=!p.historical;$('history').textContent='Reconstrucción histórica';$('era').hidden=true;$('location').hidden=false;
    }
    if(presentationReady)applyPresentation();update2D();
  }
  function openLinkedPlace(restored){
    const [,id,stop]=location.hash.split('/');
    if(!byId.has(id))return false;
    const detail=!!stop&&frames[id]?.exterior?.stop===stop;
    const sameView=restored?.camera&&restored.selected===id&&!!restored.exterior===detail;
    select(byId.get(id),!sameView,detail);
    return true;
  }
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#simulador/'))openLinkedPlace();});
  $('visit').onclick=save;$('clear').onclick=()=>{clear();if(!renderer)syncMapLink();};
  $('frame').onclick=()=>{if(selected){exterior=!exterior;framePlace(selected,true);}};
  $('history').onclick=()=>{
    const h=selected?.historical;if(!h)return;
    if(!heritage||!h.inWorld){save();location.hash=h.href;return;}
    historical=!historical;heritage.setHistorical(selected.id,historical);
    $('era').hidden=!historical;$('era').textContent=[h.period,h.confidence].filter(Boolean).join(' · ');
    if(h.sources?.[0]?.url){const a=document.createElement('a');a.textContent=' Fuente';a.href=h.sources[0].url;a.target='_blank';a.rel='noopener';$('era').append(a);}
    $('history').textContent=historical?'Territorio actual':'Reconstrucción histórica';
  };
  for(const [key,label] of Object.entries(regions))$('region').append(new Option(label,key));
  function results(){
    const q=normalize($('query').value.trim()),reg=$('region').value;
    const items=[...zones,...places].filter(p=>(!reg||reg===p.region)&&normalize(p.name).includes(q));
    const nodes=items.map(p=>{const b=document.createElement('button');b.textContent=p.name;b.onclick=()=>{select(p);if(!renderer)syncMapLink();};return b;});
    $('results').replaceChildren(...nodes);if(!nodes.length)$('results').textContent='Ningún lugar coincide con la búsqueda.';
  }
  $('query').oninput=results;$('region').onchange=results;results();
  function update2D(){if(!renderer)map.draw(focus2D,focus2D,{x:0,z:-1});}
  function fallback(message){
    document.body.classList.add('map-only');$('status').textContent=message;status.ready=true;status.mode='mapa 2D';
    $('retry').hidden=false;$('retry').onclick=()=>{save();retry3D();};
    $('markers').hidden=true;$('stick').hidden=true;$('altitude').hidden=true;
    const previous=readVisit();if(previous?.selected&&byId.has(previous.selected))select(byId.get(previous.selected),false,!!previous.exterior);
    openLinkedPlace();map.draw(focus2D,focus2D,{x:0,z:-1});window.addEventListener('resize',()=>map.draw(focus2D,focus2D,{x:0,z:-1}));
  }
  if(wantsPlan()){fallback('Mapa 2D · Exploración en plano');return;}
  try{renderer=new T.WebGLRenderer({antialias:!mobile,powerPreference:mobile?'default':'high-performance'});}
  catch{fallback('Mapa 2D · WebGL no disponible');return;}
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,innerWidth/innerHeight,.2,65000);
  renderer.info.autoReset=false;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Escena tridimensional de Sagunto');$('world').append(renderer.domElement);
  let lost=false;renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;save();goToPlan();});
  $('status').textContent='Preparando relieve, costa y edificios…';
  const grids=await loadElevation(world.terrain),heightAt=makeSampler(grids);
  const sea=createTerritorySea({polygons:world.water,bounds:world.bounds,shorelines:world.shorelines,project,heightAt,mobile,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches});
  scene.add(sea.group);
  const underSea=sea.mask.groundHeight(heightAt);
  const [ground,heritageResult]=await Promise.all([buildGround(scene,grids,underSea,renderer),createHeritage({scene,project,heightAt,grids,mobile,onChange:()=>{buildings?.changed();canopy?.changed();if(renderer)renderer.shadowMap.needsUpdate=true;}})]);
  heritage=heritageResult;ground.setHeritage(heritage);buildings=createBuildings({scene,world,grids,heritage,photography:ground.photography});network=createNetwork({scene,index,heightAt,heritage});
  atmosphere=createAtmosphere(scene,renderer,sea,buildings,network,registerFrame(sag,project));
  canopy=createCanopy(scene,heightAt,heritage);
  const render=contactRenderer(renderer);
  function setLight(h){
    hour=Number(h);$('time').value=hour;$('hour').textContent=String(Math.floor(hour)).padStart(2,'0')+':'+String(Math.round((hour%1)*60)).padStart(2,'0');
    if(lighting==='solar')atmosphere.setHour(hour);else atmosphere.atlas(lighting);
    heritage.setAtlasLighting(lighting!=='solar');
    $('light').value=lightPreference;status.lighting=lighting;status.hour=hour;
  }
  function applyPresentation(){
    lighting=lightPreference==='auto'?(selected?'golden':'solar'):lightPreference;
    setLight(hour);
    const terrain=terrainPreference==='auto'?(selected?'natural':'photo'):terrainPreference;
    setTerrainAppearance(terrain==='natural');status.terrain=terrain;$('terrain').value=terrainPreference;
  }
  function onMode(mode){
    document.body.dataset.camera=mode;status.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    $('stick').hidden=mode==='orbit';$('altitude').hidden=mode!=='fly';
    $('help').textContent={orbit:'Arrastra para girar · Rueda o pellizco para acercar',fly:'WASD para volar · Arrastra para mirar · E / Q para subir y bajar',walk:'WASD para caminar · Arrastra para mirar'}[mode];
  }
  const walkingHeight=(x,z)=>heritage.walkSurface(x,z)??(ground.grade(x,z)+network.walkingHeight(x,z)-heightAt(x,z));
  nav=createNavigation({camera,element:renderer.domElement,heightAt:ground.grade,walkingHeight,bounds:world.bounds,core,route:index.route,
    safe:(x,z)=>!sea.mask.isWater(x,z)&&ground.canStand(x,z)&&buildings.safeToWalk(x,z),nearest:network.nearestPublic,onMode,onRoute:active=>{
      $('tour').setAttribute('aria-pressed',String(active));$('tour').textContent=active?'Detener recorrido':'Recorrido territorial';status.touring=active;
    }});
  function applyFlags(){
    ground.showBuildings?.(flags.buildings);
    if(heritage.group.visible!==flags.heritage)buildings.changed();
    buildings.group.visible=flags.buildings;heritage.group.visible=flags.heritage;$('markers').hidden=!flags.labels;
    if(!flags.heritage){heritage.clear();if(historical)clear();}
    document.querySelectorAll('[data-flag]').forEach(b=>b.checked=flags[b.dataset.flag]);
  }
  function resize(){
    if(!renderer)return;
    const cap=mobile?Math.min([1.65,2,2.25][budget],Math.sqrt([850000,1450000,2300000][budget]/(innerWidth*innerHeight))):[1,1.5,2][budget];
    renderer.setPixelRatio(Math.min(devicePixelRatio,Math.max(mobile?.68:1,cap*pixelScale)));renderer.setSize(innerWidth,innerHeight);
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  }
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{nav.setMode(b.dataset.mode);renderer.domElement.focus({preventScroll:true});});
  document.querySelectorAll('[data-flag]').forEach(b=>b.onchange=()=>{flags[b.dataset.flag]=b.checked;applyFlags();});
  $('time').oninput=e=>{lightPreference='solar';hour=Number(e.target.value);applyPresentation();};
  $('light').onchange=e=>{lightPreference=e.target.value;applyPresentation();};
  $('terrain').onchange=e=>{terrainPreference=e.target.value;applyPresentation();};
  $('quality').onchange=e=>{budget=e.target.value==='auto'?(mobile?0:2):Number(e.target.value);pixelScale=1;resize();};
  $('home').onclick=()=>{clear();nav.panorama();};$('tour').onclick=()=>{clear();nav.startTour();};
  window.addEventListener('resize',resize);
  for(const p of [...zones,...places]){
    const b=document.createElement('button');b.className='sim-marker'+(p.zone?' zone':'');b.textContent=p.zone?p.name:p.name;b.hidden=true;b.onclick=()=>select(p);
    $('markers').append(b);markerButtons.push({p,b});
  }
  function markers(range){
    const used=[];
    for(const {p,b} of markerButtons){
      if((range>1550)!==!!p.zone||!flags.labels){b.hidden=true;continue;}
      const v=new T.Vector3(p.x,heightAt(p.x,p.z)+(p.zone?80:14),p.z);
      if(!p.zone&&camera.position.distanceTo(v)>Math.max(520,range*1.8)){b.hidden=true;continue;}
      v.project(camera);const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2;
      const blocked=used.some(pt=>Math.abs(pt[0]-x)<(mobile?90:155)&&Math.abs(pt[1]-y)<29);
      b.hidden=v.z<0||v.z>1||x<38||x>innerWidth-38||y<84||y>innerHeight-96||blocked;
      if(!b.hidden){b.style.left=x+'px';b.style.top=y+'px';used.push([x,y]);}
    }
  }
  const state=readVisit();try{sessionStorage.removeItem(sessionKey);}catch{}
  if(state){
    Object.assign(flags,state.flags);
    const quality=String(state.quality);
    $('quality').value=['0','1','2'].includes(quality)?quality:'auto';
    if($('quality').value!=='auto')budget=Number(quality);
  }
  const oldLight=state?.lightPreference??state?.lighting;
  lightPreference=['golden','day','solar','auto'].includes(oldLight)?oldLight:(state?.hour!=null&&state.hour!==16?'solar':'auto');
  terrainPreference=['natural','photo','auto'].includes(state?.terrain)?state.terrain:'auto';
  hour=Number.isFinite(state?.hour)?state.hour:15;
  $('jets').checked=state?.jets!==false;
  applyFlags();resize();nav.panorama(true);
  if(state?.camera)nav.restore(state.camera);
  if(byId.has(state?.selected))select(byId.get(state.selected),!state.camera,!!state.exterior);
  openLinkedPlace(state);presentationReady=true;applyPresentation();onMode(nav.mode);
  const direction=new T.Vector3(),foreground=new T.Vector3();
  // A low, near-horizontal orbit may look kilometres beyond a monument directly
  // under the camera. Stream the visible foreground instead of the distant pivot.
  function detailView(p,range){
    const eye=camera.position,above=Math.max(0,eye.y-heightAt(eye.x,eye.z));
    const horizontal=Math.hypot(p.x-eye.x,p.z-eye.z);
    const weight=nav.mode==='orbit'&&horizontal>1?T.MathUtils.smoothstep(range,450,850)*
      T.MathUtils.smoothstep(horizontal/(above+10),1.6,3.4)*(1-T.MathUtils.smoothstep(above,380,900)):0;
    if(!weight)return {point:p,range};
    const lead=Math.min(horizontal,Math.max(75,above*1.6));
    foreground.copy(eye).lerp(p,lead/horizontal).lerp(p,1-weight);
    foreground.y=heightAt(foreground.x,foreground.z);
    return {point:foreground,range:T.MathUtils.lerp(range,Math.max(130,Math.hypot(lead,above)),weight)};
  }
  let last=performance.now(),lastUpdate=-Infinity,prevStats=last,samples=[],slow=0;
  await buildings.ready;status.ready=true;status.loadMs=Math.round(performance.now()-start);
  function frame(now){
    if(lost)return;requestAnimationFrame(frame);
    if(document.hidden){last=now;return;}
    const ms=now-last,dt=Math.max(0,Math.min(.1,ms/1000));last=now;nav.tick(dt);
    const p=nav.focusPoint(),range=nav.range,detail=detailView(p,range),near=detail.point;
    if(now-lastUpdate>180){
      ground.update(near.x,near.z,detail.range);
      if(flags.heritage)heritage.update(near.x,near.z,detail.range,selected?.id,budget);
      buildings.update(near.x,near.z,detail.range,budget);network.update(near.x,near.z,detail.range,budget,flags);
      canopy.update(near,detail.range,budget,flags.land);
      map.draw(camera.position,p,camera.getWorldDirection(direction));markers(range);lastUpdate=now;
    }
    heritage.animateGlorieta(now/1000,$('jets').checked,lighting==='solar'&&(hour<7||hour>=20));atmosphere.update(camera,near,detail.range,budget);sea.update(dt);network.animate(dt,flags);
    camera.near=range>2600?3:range>450?.7:.12;camera.updateProjectionMatrix();
    renderer.info.reset();render(scene,camera,lighting==='solar'&&budget===2&&!mobile&&detail.range<520);
    markRendered();if(ms>0)samples.push(ms);
    if(now-prevStats>900){
      const sorted=samples.sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)]||16;
      const pending=buildings.stream.pending.size+network.stream.pending.size;
      Object.assign(status,{mode:nav.mode,range:Math.round(range),detailRange:Math.round(detail.range),camera:nav.snapshot(),sectors:buildings.stream.live.size,networkSectors:network.stream.live.size,
        traffic:network.traffic,photo:surfacePhotoMetrics(),aerial:buildings.aerialStats,fabric:buildings.fabricStats,canopy:canopy.stats,localTerrain:grids.regional.length,quality:budget,pixelRatio:renderer.getPixelRatio(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
        geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,frameMs:Math.round(median*10)/10,
        frameP95Ms:Math.round((sorted[Math.floor(sorted.length*.95)]||median)*10)/10,
        heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null,heritage:heritage.stats,pending});
      $('stats').textContent=status.frameMs+' ms/fotograma · '+status.drawCalls+' llamadas · '+status.triangles.toLocaleString('es-ES')+' triángulos · '+status.geometries+' geometrías · '+status.textures+' texturas'+(status.heapMiB?' · JS '+status.heapMiB+' MiB':'')+' · carga inicial '+(status.loadMs/1000).toFixed(1)+' s';
      $('status').textContent=(pending?'Cargando sectores':historical?'Reconstrucción local':'Territorio actual')+' · '+(nav.mode==='orbit'?Math.round(camera.position.y-heightAt(camera.position.x,camera.position.z)).toLocaleString('es-ES')+' m sobre terreno':nav.mode==='walk'?'A pie':'Vuelo libre');
      if($('quality').value==='auto'){
        slow=median>(mobile?36:29)?slow+1:median<18?Math.min(-1,slow-1):0;
        if(slow>=3&&budget>0){budget--;slow=0;}
        else if(slow>=3&&mobile&&renderer.getPixelRatio()>.69){pixelScale=Math.max(.45,pixelScale-.15);resize();slow=0;}
        else if(slow < -12&&pixelScale<1){pixelScale=Math.min(1,pixelScale+.1);resize();slow=0;}
        else if(slow < -12&&budget<(mobile?1:2)){budget++;slow=0;}
        if(lastBudget!==budget){resize();lastBudget=budget;}
      }
      samples=[];prevStats=now;
    }
  }
  requestAnimationFrame(frame);
}
