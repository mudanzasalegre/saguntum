// Run in the exported checkout with Node 22 and Chrome/Chromium installed.
// CHROME_PATH can select a compatible binary. Results are JSON Lines on stdout.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const chrome=[process.env.CHROME_PATH,process.env.ProgramFiles&&path.join(process.env.ProgramFiles,'Google/Chrome/Application/chrome.exe'),
 '/usr/bin/chromium','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Configura CHROME_PATH con la ruta a Chromium o Chrome.');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'saguntum-heritage-'));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const server=http.createServer((req,res)=>{
 if(req.url==='/check'){
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end('<!doctype html><script type="importmap">{"imports":{"three":"/assets/vendor/three.module.js","three/addons/utils/BufferGeometryUtils.js":"/assets/vendor/BufferGeometryUtils.js"}}</script>');return;
 }
 const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!filename.startsWith(root)||!fs.statSync(filename,{throwIfNoEntry:false})?.isFile()){res.writeHead(404);res.end();return;}
 const mime={'.js':'text/javascript','.json':'application/json','.jpg':'image/jpeg'}[path.extname(filename)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime});fs.createReadStream(filename).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const page='http://127.0.0.1:'+server.address().port+'/check';
const browser=spawn(chrome,['--headless=new','--disable-extensions','--disable-background-networking','--enable-unsafe-swiftshader','--use-angle=swiftshader',
 '--remote-debugging-port=0','--user-data-dir='+profile,page],{stdio:'ignore',windowsHide:true});
let socket;
try{
 let target;
 for(let i=0;i<150&&!target;i++){
  await pause(100);
  try{
   const debug=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0].trim();
   target=(await (await fetch('http://127.0.0.1:'+debug+'/json')).json()).find(t=>t.url===page);
  }catch{}
 }
 if(!target)throw Error('Chrome no abrió la página de comprobación.');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let seq=0;const pending=new Map();
 socket.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){pending.get(d.id)?.(d);pending.delete(d.id);}};
 async function evaluate(expression){
  const d=await new Promise(resolve=>{
   const id=++seq;pending.set(id,resolve);
   socket.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));
  });
  if(d.result?.exceptionDetails)throw Error(d.result.exceptionDetails.exception?.description||'Error en Chromium');
  return d.result.result.value;
 }
 const run=(fn,arg)=>evaluate('('+fn.toString()+')('+JSON.stringify(arg??null)+')');
 for(let i=0;i<100;i++){
  if(await evaluate('location.href==='+JSON.stringify(page)+'&&document.readyState==="complete"'))break;
  await pause(100);
 }
 const ids=await run(async()=>{
  const T=window.T=await import('/assets/vendor/three.module.js');
  const ground=await import('/js/territory-ground.js');
  const {project}=await import('/js/territory-coordinates.js');
  const {modelId,releaseModel}=await import('/js/territory-heritage-models.js');
  const {createTerritorySea}=await import('/js/territory-sea.js');
  window.meta=await(await fetch('/assets/territory/world.json')).json();
  window.inventory=await(await import('/js/territory-heritage-catalog.js')).loadHeritageCatalog(project);
  window.gl=new T.WebGLRenderer({antialias:false});gl.setSize(360,220);gl.debug.onShaderError=()=>{throw Error('Fallo de compilación GLSL');};
  window.scene=new T.Scene();scene.background=new T.Color(0x829cb0);scene.add(new T.HemisphereLight());
  window.camera=new T.PerspectiveCamera(48,360/220,.2,30000);
  const grids=await ground.loadElevation(meta.terrain),heightAt=ground.makeSampler(grids);
  window.loader=(await import('/js/territory-heritage-loader.js')).heritageWorker(grids);
  window.sea=createTerritorySea({polygons:meta.water,shorelines:meta.shorelines,project,heightAt,mobile:true});
  window.terrain=await ground.buildGround(scene,grids,sea.mask.groundHeight(heightAt),gl);
  window.masks=(await import('/js/territory-heritage-roadmask.js')).atlasRoadMasks();
  window.source={relief:[],maskRoadMaterial:masks.apply};terrain.setHeritage(source);
  const {hasAtlasContext}=await import('/js/territory-heritage-contexts.js');
  window.code={modelId,releaseModel,heightAt,project,hasAtlasContext};
  return [...new Set(inventory.places.map(p=>modelId(p.id)))];
 });
 for(const id of ids){
  const stats=await run(async id=>{
   const place=inventory.places.find(p=>code.modelId(p.id)===id),{x,z}=place,start=performance.now();
   const m=await loader.load(id);masks.update([m]);source.relief=[m.relief];terrain.update(x,z,80);
   const lite={...m.setDensity(3000,0)},close={...m.setDensity(10,2)};
   if(close.total&&(close.instances!==close.total||lite.instances>=close.instances))throw Error(id+' densidad de paisaje incorrecta');
   const base=code.heightAt(x,z);
   camera.position.set(x+72,base+75,z+70);camera.lookAt(x,base+8,z);
   scene.add(m.group);gl.render(scene,camera);
   const draws=gl.info.render.calls,tris=gl.info.render.triangles,glError=gl.getContext().getError();
   if(!draws||!tris||glError)throw Error(id+' fallo en WebGL');
   if(code.hasAtlasContext(id)&&(!m.contextStats?.meshes||!m.contextStats?.triangles))throw Error(id+' entorno original ausente');
   const lamps=[];m.group.traverseVisible(o=>{if(o.isPointLight)lamps.push([o.intensity,o.distance,o.decay]);});
   if(id==='horno'&&JSON.stringify(lamps)!==JSON.stringify([[8,14,1.7],[10,14,1.7]]))throw Error('Falta la iluminación interior del Horno');
   if(['plaza-mayor','horno','barrio-obrero','grau-vell'].includes(id)&&!(m.pavement?.coverage>0))throw Error(id+' pavimento sin registrar');
   for(const [cx,cz] of m.relief.cuts)if(terrain.canStand(cx,cz))throw Error(id+' corte abierto transitable');
   let deltaMin=0;for(const delta of m.relief.delta||[])deltaMin=Math.min(deltaMin,delta);
   if(id==='theatre'&&deltaMin>-.5)throw Error('Falta el rebaje del Teatro Romano');
   if(id==='circo'&&m.relief.cuts.length!==1)throw Error('Falta la ventana del circo');
   if(id==='necropolis'&&m.relief.cuts.length!==2)throw Error('Faltan los hipogeos o el cementerio');
   const visible=()=>{let n=0;m.group.traverseVisible(o=>{if(o.isMesh)n++;});return n;};
   const present=visible();m.setHistorical(true);const historic=visible();
   if(['pantalan','puerto-antiguo','berenguer'].includes(id)&&present===historic)throw Error(id+' falta la fase alternativa');
   code.releaseModel(m.group);gl.renderLists.dispose();
   return {id,ms:Math.round(performance.now()-start),draws,tris,glError,context:m.contextStats,lamps:lamps.length,landscape:close.total?{original:close.total,close:close.instances,far:lite.instances}:null,
    cuts:m.relief.cuts.length,deltaMin:Math.round(100*deltaMin)/100};
  },id);
  console.log(JSON.stringify(stats));
 }
 const water=await run(async()=>{
  masks.update([]);source.relief=[];terrain.update(0,0,3500);
  const {coastalWaterFragment}=await import('/js/coast-water.js');
  const p=inventory.places.find(p=>p.id==='pantalan-maritimo');
  scene.add(sea.group);sea.setSun(new T.Vector3(-.5,1,-.2),.95);sea.update(.05);
  camera.position.set(p.x,80,p.z-120);camera.lookAt(p.x,0,p.z);
  gl.render(scene,camera);
  const u=sea.water.material.uniforms,error=gl.getContext().getError();
  if(sea.water.material.fragmentShader!==coastalWaterFragment||!u.mirrorSampler.value||!u.normalSampler.value||!u.shoreSampler.value||u.time.value<=0||error)throw Error('Regresión del Mediterráneo.');
  const code=await import('/js/territory-heritage.js'),h=await code.createHeritage({scene,heightAt:window.code.heightAt,project:window.code.project});
  const q=h.places.find(p=>p.id==='horno');
  if(!h.isReplaced('cat-8532501YJ3983S_part4-0',q.x,q.z))throw Error('Horno duplicado en el panorama');
  h.group.visible=false;
  if(h.isReplaced('cat-8532501YJ3983S_part4-0',q.x,q.z))throw Error('La capa genérica no vuelve al apagar el patrimonio');
  h.dispose();loader.dispose();
  return {places:inventory.places.length,shader:'coastalWaterFragment',waterTriangles:sea.water.geometry.index.count/3,glError:error};
 });
 console.log(JSON.stringify({constructors:ids.length,...water}));
}finally{
 socket?.close();browser.kill();server.closeAllConnections();server.close();
 // Chrome may still be releasing file handles on Windows.
 for(let i=0;i<10;i++){try{fs.rmSync(profile,{recursive:true,force:true});break;}catch{await pause(100);}}
}
