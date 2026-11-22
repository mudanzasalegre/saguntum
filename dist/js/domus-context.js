import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createJuderiaContext} from './juderia-context.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const s=Math.sin(n*127.1+37.4)*43758.5453;return s-Math.floor(s);};

function asphaltTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#969b9c';ctx.fillRect(0,0,128,128);
 for(let i=0;i<4200;i++){
  const n=Math.round(110+noise(i+400)*75);ctx.fillStyle=`rgba(${n},${n},${n},.3)`;
  ctx.fillRect(noise(i+1)*128,noise(i+75)*128,1.1,1.1);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}

/** Registered surroundings in world metres. The archaeological model owns the
 * modern host. Existing Salvador and other contexts retain their geometry.
 * Street widths and domestic facade details are explicitly interpretive.
 */
export function createDomusContext(options={}){
 const original=options.contextData||{},reviews=new Map((original.heightReview||[]).map(row=>[String(row.id),row]));
 const renderData={...original,buildings:(original.buildings||[]).map(row=>{
  const review=reviews.get(String(row.id));return review?{...row,height:review.displayHeightM}:row;
 })};
 const context=createJuderiaContext({...options,contextData:renderData}),project=options.project||projectDefault;
 const details=new THREE.Group();details.name='Domus · bordillos de València y Josefa Daroqui';context.group.add(details);
 const asphalt=asphaltTexture();context.ownedResources.textures.push(asphalt);
 const own={geometries:[],materials:[]};let ground=options.heightAt||(()=>0),mode='materials',disposed=false;
 const readingColor=options.visitData?.readingLegend?.find(r=>r.id==='contemporanea')?.color||original.readingColor||'#8d9b8b';
 for(const mask of original.genericStreetExclusions||[])context.exclusions.push(mask.coordinates.map(p=>project(...p)));
 context.sharedContext=original.sharedContext||{};
 for(const road of original.sharedContext?.roads||[])context.plan.components.push({
  id:'shared-street-'+road.owner+'-'+road.id,coordinates:road.coordinates,closed:false,
  kind:'shared-street',period:'contemporary',owner:road.owner,sourceId:road.sourceId,renderedElsewhere:true
 });

 function clearDetails(){
  for(const key of ['geometries','materials']){
   for(const resource of own[key]){
    const index=context.ownedResources[key].indexOf(resource);if(index>=0)context.ownedResources[key].splice(index,1);
    resource.dispose();
   }
   own[key].length=0;
  }
  details.clear();
 }
 function buildDetails(){
  clearDetails();const parts=[],samples=[];let count=0;
  for(const line of original.curbLines||[]){
   const points=line.coordinates.map(p=>project(...p));
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.04)continue;
    const steps=Math.max(1,Math.ceil(length/.8)),yaw=-Math.atan2(b.z-a.z,b.x-a.x);
    for(let k=0;k<steps;k++){
     const t=(k+.5)/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=ground(x,z)+.15;
     const geometry=new THREE.BoxGeometry(length/steps,.10,.14);geometry.rotateY(yaw);geometry.translate(x,y,z);
     const mesh=geometry.toNonIndexed();geometry.dispose();parts.push(mesh);count++;
     samples.push({x,z,y,sourceId:line.sourceId,interpretive:true});
    }
   }
  }
  if(parts.length){
   const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const material=new THREE.MeshStandardMaterial({color:'#bab9ae',roughness:1});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Domus · límites de acera aproximados';mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={domusContext:true,component:'domus-entorno',period:'contemporary',materialKind:'curb',
    baseColor:material.color.clone(),baseMap:null,interpretive:true,source:'domus-context-osm'};
   details.add(mesh);own.geometries.push(geometry);own.materials.push(material);
   context.ownedResources.geometries.push(geometry);context.ownedResources.materials.push(material);
  }
  context.qa.publicSpaceDetails={curbSegments:count,groundSamples:samples,
   note:'Bordillos derivados de límites aproximados de calzada y acera; no son un levantamiento municipal.'};
 }
 function normalizeSurfaces(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData;
   if(!d.domusContext){delete d.juderiaContext;d.domusContext=true;d.period='contemporary';}
   if(d.materialKind==='paving'&&!d.normalizedSurface){
    const road=d.component==='domus-asfalto';d.surfaceKind=road?'asphalt':'paving';d.normalizedSurface=true;
    const tint=new THREE.Color(road?'#626b6d':'#cac7bb'),colors=mesh.geometry.attributes.color;
    for(let i=0;i<colors.count;i++)colors.setXYZ(i,tint.r,tint.g,tint.b);colors.needsUpdate=true;
    if(road)d.baseMap=asphalt;
   }
   if(d.component==='juderia-pavimento')d.component='domus-entorno';
  });
 }
 function style(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=mode==='periods',map=periods?null:d.baseMap||null;
   if(m.bumpMap!==map||m.map!==map){m.bumpMap=map;m.map=map;m.needsUpdate=true;}
   m.bumpScale=d.surfaceKind==='asphalt'?.007:['tile','stone','paving'].includes(d.materialKind)?.018:.008;
   const vertexColors=!periods&&!!mesh.geometry.attributes.color;
   if(m.vertexColors!==vertexColors){m.vertexColors=vertexColors;m.needsUpdate=true;}
   m.color.copy(d.baseColor);if(periods)m.color.set(readingColor);
  });
 }
 function normalize(){
  context.group.name='Domus dels Peixos · València y Josefa Daroqui';context.group.userData.id='domus-context';
  context.group.userData.coordinateSystem='World x/z metres; attach without a monument-local transform.';
  for(const component of context.plan.components)component.period='contemporary';
  for(const row of context.qa.buildings){const review=reviews.get(String(row.id));if(review){row.method='storeys';row.heightReview=review;}}
  Object.assign(context.stats,{
   sourceHeight:context.qa.buildings.filter(r=>r.method==='height').length,
   ignHeight:context.qa.buildings.filter(r=>r.method==='IGN').length,
   storeyHeight:context.qa.buildings.filter(r=>r.method==='storeys').length,
   fallbackHeight:context.qa.buildings.filter(r=>r.method==='estimate').length,
   heightConflictsReviewed:reviews.size,hostBuildingPartsExcluded:original.coreBuildings?.length||0,
   reusedBuildingParts:original.sharedContext?.buildings?.length||0,
   reusedStreetFragments:original.sharedContext?.roads?.length||0,preservedPreviousContexts:true
  });
  context.qa.heightReview=original.heightReview||[];context.qa.ownership=original.sharedContext||{};
  for(const focus of Object.values(context.focuses)){
   const spec=original.focusSpecs?.[focus.id]||{};focus.closeScale=false;focus.fitBounds=false;
   Object.assign(focus,{floor:0,recommendedMode:'current',readingLayer:'contemporanea',interiorView:false,regionId:'contemporanea'});
   focus.fov=spec.fov||60;focus.offset=[...spec.far];focus.closeOffset=[...spec.near];focus.minDistance=spec.minDistance||1.8;
   if(spec.targetCoordinates){const p=project(...spec.targetCoordinates);focus.target.set(p.x,ground(p.x,p.z)+(spec.targetHeight||1.7),p.z);}
   const farGround=ground(focus.target.x+focus.offset[0],focus.target.z+focus.offset[2]);
   focus.offset[1]=Number.isFinite(spec.farEyeHeightM)?farGround+spec.farEyeHeightM-focus.target.y:
    Math.max(focus.offset[1],farGround+2.5-focus.target.y);
   focus.closeOffset[1]=ground(focus.target.x+focus.closeOffset[0],focus.target.z+focus.closeOffset[2])+(spec.nearEyeHeightM||2.15)-focus.target.y;
   focus.sourceConfidence='Cadastral and OSM street registration; facade openings, footway widths and viewpoints are interpretive.';
  }
  normalizeSurfaces();style();context.group.updateMatrixWorld(true);context.bounds.setFromObject(context.group);
 }
 const bind=context.bindGround,read=context.setReadingMode,select=context.selectFocus,dispose=context.dispose;
 context.bindGround=value=>{if(disposed||typeof value!=='function')return context;ground=value;bind(value);buildDetails();normalize();return context;};
 context.setReadingMode=value=>{mode=read(value);style();return mode;};context.setMode=context.setReadingMode;
 context.selectFocus=id=>{const focus=select(id);style();return focus;};
 context.dispose=()=>{if(disposed)return;disposed=true;dispose();own.geometries.length=own.materials.length=0;};
 buildDetails();normalize();return context;
}
