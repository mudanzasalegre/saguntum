// Inspection views address the user's five coloured marks. They use current
// geometry and terrain; no mesh or material is changed to improve a render.
import fs from 'node:fs';
import vm from 'node:vm';
import {EAST_EXTERIOR_FEATURES} from '../../dist/js/castle-east-exterior-layout.js';
import {editorialSceneFrame} from '../../dist/js/editorial-visibility.js';
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
export function createInspectionCameras({THREE,castle,visit,terrain,monuments,root}){
 const cameras=[],registered=JSON.parse(fs.readFileSync(new URL('./screenshot-registration.json',import.meta.url),'utf8'));
 cameras.push({...registered.camera,name:'castillo-captura-usuario-v55',resolution:[1279,817],inspection:'Approximate registered screenshot angle; RMS '+registered.rmsPx+' px; not a browser capture'});
 const boxFor=ids=>{
  const box=new THREE.Box3();let meshes=0;
  castle.traverse(o=>{if(o.isMesh&&ids.some(id=>String(o.userData.component||'')===id||String(o.userData.component||'').startsWith(id+'-'))){box.union(new THREE.Box3().setFromObject(o));meshes++;}});
  if(!meshes)throw new Error('No geometry for inspection component(s): '+ids.join(', '));
  return box;
 };
 function detail(name,ids,offset,fov=52,{targetRise=0,targetCoordinate=null,centerComponent=null}={}){
  const box=boxFor(ids),target=(centerComponent?boxFor([centerComponent]):box).getCenter(new THREE.Vector3());
  if(targetCoordinate){const p=project(...targetCoordinate);target.set(p.x,terrain.meshHeightAt(p.x,p.z)+targetRise,p.z);}else target.y+=targetRise;
  const eye=target.clone().add(new THREE.Vector3(...offset));
  eye.y=Math.max(eye.y,terrain.meshHeightAt(eye.x,eye.z)+2.4);
  cameras.push({name,position:eye.toArray(),target:target.toArray(),fov,components:ids,inspection:'CPU source geometry detail; camera can be elevated for inspection'});
 }
 detail('rojo-norte-estancias-y-escalera',['battery-n'],[-8,11,32],52,{centerComponent:'battery-n-floor',targetRise:1.1});
 detail('rojo-oriente-crujia-abierta',['battery-e'],[-34,10,5],52,{centerComponent:'battery-e-floor',targetRise:1.1});
 detail('azul-ruinas-261-262',['ruin-733215261','ruin-733215262'],[12,13,22],55);
 detail('azul-ruina-260',['ruin-733215260'],[17,11,-17],54);
 detail('lima-torre-y-cortina',['north-round-tower','north-tower-joining-curtain','north-arched-recess'],[19,11,-20],52);
 const bunker=EAST_EXTERIOR_FEATURES.find(f=>f.id==='daoiz-machine-gun-remains');
 const points=bunker.coordinates.slice(0,-1),coordinate=points.reduce((s,p)=>[s[0]+p[0]/points.length,s[1]+p[1]/points.length],[0,0]);
 detail('naranja-puesto-defensivo',['daoiz-machine-gun-remains'],[7.5,6.5,9],54,{targetCoordinate:coordinate,targetRise:.55});
 detail('amarillo-muralla-en-ladera',['tres-castellets-upper-link','tres-castellets-descending-wall'],[62,48,35],50);
 detail('amarillo-paso-superior',['tres-castellets-upper-link'],[15,9,-12],52,{targetCoordinate:[-.27465,39.6766924],targetRise:1});
 const app=fs.readFileSync(root+'dist/js/app.js','utf8'),start=app.indexOf('function preset(name,near=false){'),end=app.indexOf('\nfunction setShadowFraming()',start);
 if(start<0||end<start)throw new Error('Locate the actual app preset for visit inspection cameras');
 const preset=new vm.Script('('+app.slice(start,end)+')(' + JSON.stringify('castle')+',__near)');
 for(const id of ['almenara','almenara-bateria','almenara-aljibes','almenara-baluarte','almenara-dependencias']){
  for(const [suffix,near]of [['',false],['-detalle',true]]){
   const pose=preset.runInNewContext({THREE,selected:'castle',innerWidth:1280,innerHeight:960,__near:near,mobile:()=>false,
    guidedIds:['castle'],guidedVisit:()=>({id:'castle',stopId:id,overviewId:'conjunto',model:visit}),
    points:monuments.points,pantalanIds:new Set(),excavation:null,castleFrame:()=>editorialSceneFrame(1280,960,{collapsed:false,place:'castle'})},{timeout:1000});
   cameras.push({name:'visita-'+id+suffix,position:pose.position.toArray(),target:pose.target.toArray(),fov:pose.fov,
    authoredVisitCamera:near,presetVisitCamera:true,focusId:id,presetViewport:[1280,960],
    projection:'Unshifted full canvas for geometry inspection; app UI panel/view offset is not rendered'});
  }
 }
 return cameras;
}
