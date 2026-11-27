import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createJuderiaContext} from './juderia-context.js';
import {pointInPolygon} from './urban-surface.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const s=Math.sin(n*127.1+37.4)*43758.5453;return s-Math.floor(s);};

function asphaltTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#979c9d';ctx.fillRect(0,0,128,128);
 for(let i=0;i<3300;i++){const n=Math.round(105+noise(i+400)*75);ctx.fillStyle=`rgba(${n},${n},${n},.28)`;ctx.fillRect(noise(i+1)*128,noise(i+75)*128,1.1,1.1);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}

/** Exterior streets and neighbouring cadastral fabric of Plaza del Fórum.
 * World x/z metres, independent of the park's local transform. The complete
 * mapped park, its lowered archaeology, historic facades, ramps and gardens
 * belong to forum-plaza.js. Existing detailed owners render their own parcels.
 */
export function createForumPlazaContext(options={}){
 const original=options.contextData||{},project=options.project||projectDefault;
 const reviews=new Map((original.heightReview||[]).map(r=>[String(r.id),r]));
 const renderData={...original,buildings:(original.buildings||[]).map(r=>reviews.has(String(r.id))?{...r,height:reviews.get(String(r.id)).displayHeightM}:r)};
 const occlusion=(original.facadeOcclusion||[]).map(r=>({...r,id:'facade-occlusion-'+r.id}));
 const occupancyData={...(options.data||{}),buildings:[...(options.data?.buildings||original.buildings||[]),...occlusion]};
 const context=createJuderiaContext({...options,data:occupancyData,contextData:renderData});
 const details=new THREE.Group(),vegetation=new THREE.Group();details.name='Fórum · bordillos exteriores';vegetation.name='Fórum · vegetación a cargo del modelo del parque';context.group.add(details,vegetation);context.vegetation=vegetation;
 const asphalt=asphaltTexture();context.ownedResources.textures.push(asphalt);
 const own={geometries:[],materials:[]};let ground=options.heightAt||(()=>0),mode='materials',disposed=false;
 const district=(original.districtOutline||[]).map(p=>project(...p)),blankWalls=(original.facadeOcclusion||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const readingColor=options.visitData?.readingLegend?.find(r=>r.id==='ciudad')?.color||original.readingColor||'#8d9b8b';
 for(const row of original.genericStreetExclusions||[])context.exclusions.push(row.coordinates.map(p=>project(...p)));
 context.vegetationExclusions=(original.vegetationExclusions||[]).map(r=>r.coordinates.map(p=>project(...p)));context.exclusions.push(...context.vegetationExclusions);
 context.sharedContext=original.sharedContext||{};
 for(const r of original.sharedContext?.roads||[])context.plan.components.push({id:'shared-street-'+r.owner+'-'+r.id,coordinates:r.coordinates,closed:false,kind:'shared-street',period:'contemporary',owner:r.owner,sourceId:r.sourceId,renderedElsewhere:true});
 function clearDetails(){
  for(const key of ['geometries','materials']){for(const resource of own[key]){const i=context.ownedResources[key].indexOf(resource);if(i>=0)context.ownedResources[key].splice(i,1);resource.dispose();}own[key].length=0;}
  details.clear();
 }
 function buildDetails(){
  clearDetails();const parts=[];let segments=0;
  for(const line of original.curbLines||[]){
   const pts=line.coordinates.map(p=>project(...p));
   for(let i=0;i<pts.length-1;i++){
    const a=pts[i],b=pts[i+1],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.04)continue;
    const steps=Math.max(1,Math.ceil(length/.8)),yaw=-Math.atan2(b.z-a.z,b.x-a.x);
    for(let k=0;k<steps;k++){
     const t=(k+.5)/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
     const g=new THREE.BoxGeometry(length/steps,.10,.14);g.rotateY(yaw);g.translate(x,ground(x,z)+.155,z);parts.push(g);segments++;
    }
   }
  }
  if(parts.length){
   const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const material=new THREE.MeshStandardMaterial({color:'#b9b8ae',roughness:1});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Fórum · bordillos de calles';mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={forumPlazaContext:true,component:'forum-plaza-entorno',period:'contemporary',materialKind:'stone',baseColor:material.color.clone(),baseMap:null,interpretive:true,source:'OSM streets; approximate widths'};
   details.add(mesh);own.geometries.push(geometry);own.materials.push(material);context.ownedResources.geometries.push(geometry);context.ownedResources.materials.push(material);
  }
  context.qa.publicSpaceDetails={curbSegments:segments,parkModelOwnsInterior:true};
 }
 function normalizeSurfaces(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData;
   delete d.juderiaContext;d.forumPlazaContext=true;d.period='contemporary';
   if(d.materialKind==='paving'&&!d.normalizedSurface){
    const isAsphalt=d.component==='forum-plaza-asfalto';d.surfaceKind=isAsphalt?'asphalt':'paving';d.normalizedSurface=true;
    const tint=new THREE.Color(isAsphalt?'#626b6d':'#c8c6bc'),attr=mesh.geometry.attributes.color;
    if(attr){for(let i=0;i<attr.count;i++)attr.setXYZ(i,tint.r,tint.g,tint.b);attr.needsUpdate=true;}
    if(isAsphalt)d.baseMap=asphalt;
   }
   if(d.component==='forum-plaza-medianera'&&d.materialKind==='plaster'&&!d.blankWallTintApplied){
    const attr=mesh.geometry.attributes.color,pos=mesh.geometry.attributes.position;
    if(attr){for(let i=0;i<attr.count;i++)if(blankWalls.some(p=>pointInPolygon(pos.getX(i),pos.getZ(i),p))){const c=new THREE.Color('#d0c5b3').multiplyScalar(.97+noise(i)*.045);attr.setXYZ(i,c.r,c.g,c.b);}attr.needsUpdate=true;}
    d.blankWallTintApplied=true;
   }
   if(d.component==='juderia-pavimento')d.component='forum-plaza-entorno';
  });
 }
 function style(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=mode==='periods',map=periods?null:d.baseMap||null;
   if(m.bumpMap!==map||m.map!==map){m.bumpMap=map;m.map=map;m.needsUpdate=true;}
   m.bumpScale=d.surfaceKind==='asphalt'?.007:['tile','stone','paving'].includes(d.materialKind)?.018:.008;
   const vertexColors=!periods&&!!mesh.geometry.attributes.color;if(m.vertexColors!==vertexColors){m.vertexColors=vertexColors;m.needsUpdate=true;}
   m.color.copy(d.baseColor);if(periods)m.color.set(readingColor);
  });
 }
 function normalize(){
  context.group.name='Plaza del Fórum · Huertos, Ordóñez y Remedio';context.group.userData.id='forum-plaza-context';context.group.userData.coordinateSystem='World x/z metres; attach without local transform.';
  for(const c of context.plan.components)c.period='contemporary';context.plan.contextOutline=original.districtOutline||[];context.plan.archaeologyOutline=original.coreOutline||[];
  for(const row of context.qa.buildings){const review=reviews.get(String(row.id));if(review){row.method='storeys';row.heightReview=review;}}
  Object.assign(context.stats,{sourceHeight:context.qa.buildings.filter(r=>r.method==='height').length,ignHeight:context.qa.buildings.filter(r=>r.method==='IGN').length,storeyHeight:context.qa.buildings.filter(r=>r.method==='storeys').length,fallbackHeight:context.qa.buildings.filter(r=>r.method==='estimate').length,heightConflictsReviewed:reviews.size,reusedBuildingParts:original.sharedContext?.buildings?.length||0,reusedStreetFragments:original.sharedContext?.roads?.length||0,preservedPreviousContexts:true,parkCoreAreaM2:original.pavementMesh?.coverage?.sourceParkAreaM2||0});
  context.qa.heightReview=original.heightReview||[];context.qa.ownership=original.sharedContext||{};context.qa.blankPartyWalls={renderingOcclusionOnly:true,sourceFootprintsUnchanged:true,source:'forum-municipal-2018'};
  for(const focus of Object.values(context.focuses)){
   const spec=original.focusSpecs?.[focus.id]||{};Object.assign(focus,{closeScale:false,fitBounds:false,floor:0,recommendedMode:'current',readingLayer:'ciudad',interiorView:false,regionId:'ciudad',mapScope:'park',fov:spec.fov||62,minDistance:spec.minDistance||1.3});
   if(spec.far)focus.offset=[...spec.far];if(spec.near)focus.closeOffset=[...spec.near];
   if(spec.targetCoordinates){const p=project(...spec.targetCoordinates);focus.target.set(p.x,ground(p.x,p.z)+(spec.targetHeight||1.6),p.z);focus.coordinate=[...spec.targetCoordinates];focus.coordinates=[...spec.targetCoordinates];}
   for(const [offset,eyeHeight]of [[focus.offset,spec.farEyeHeightM||2.1],[focus.closeOffset,spec.nearEyeHeightM||2.1]])if(offset)offset[1]=ground(focus.target.x+offset[0],focus.target.z+offset[2])+eyeHeight-focus.target.y;
   focus.sourceConfidence='Mapped current street; width, domestic details and viewpoint are interpretive.';
  }
  normalizeSurfaces();style();context.group.updateMatrixWorld(true);context.bounds.setFromObject(context.group);context.focusBounds=Object.fromEntries(Object.values(context.focuses).map(f=>[f.id,f.bounds]));
 }
 const bind=context.bindGround,read=context.setReadingMode,select=context.selectFocus,dispose=context.dispose;
 context.bindGround=value=>{if(disposed||typeof value!=='function')return context;ground=value;bind(value);buildDetails();normalize();return context;};
 context.setReadingMode=value=>{mode=read(value);style();return mode;};context.setMode=context.setReadingMode;
 context.selectFocus=id=>{const focus=select(id);style();return focus;};
 context.contains=(x,z)=>district.length>=3&&pointInPolygon(x,z,district);context.getElevation=(x,z)=>ground(x,z);
 context.detailBounds=district.length?{minX:Math.min(...district.map(p=>p.x)),maxX:Math.max(...district.map(p=>p.x)),minZ:Math.min(...district.map(p=>p.z)),maxZ:Math.max(...district.map(p=>p.z))}:null;
 context.dispose=()=>{if(disposed)return;disposed=true;dispose();own.geometries.length=own.materials.length=0;};
 buildDetails();normalize();return context;
}
