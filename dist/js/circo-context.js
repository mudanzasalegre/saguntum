import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createJuderiaContext} from './juderia-context.js';
import {pointInPolygon} from './urban-surface.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const s=Math.sin(n*127.1+37.4)*43758.5453;return s-Math.floor(s);};

function granularTexture(soil=false){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle=soil?'#8b7f66':'#969b9c';ctx.fillRect(0,0,128,128);
 for(let i=0;i<3600;i++){
  const n=Math.round(105+noise(i+400)*75);
  ctx.fillStyle=soil?`rgba(${n},${Math.round(n*.88)},${Math.round(n*.67)},.36)`:`rgba(${n},${n},${n},.30)`;
  ctx.fillRect(noise(i+1)*128,noise(i+75)*128,soil?1.3:1.1,soil?.8:1.1);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}

/** Current open-air surroundings, registered in atlas world metres.
 * The archaeological model owns the excavation and retaining enclosure.
 * This module owns the intact surface apron, plaza, streets and neighbours.
 * Context visibility is controlled externally only for the historical mode.
 */
export function createCircoContext(options={}){
 const original=options.contextData||{},project=options.project||projectDefault;
 const reviews=new Map((original.heightReview||[]).map(row=>[String(row.id),row]));
 const renderData={...original,buildings:(original.buildings||[]).map(row=>{
  const review=reviews.get(String(row.id));return review?{...row,height:review.displayHeightM}:row;
 })};
 // A rendering-only occupancy strip suppresses automatic windows on the blank
 // western party wall visible in the public photographs. It is never rendered
 // or exported as a cadastral building, exclusion, or archaeological structure.
 const occlusion=(original.facadeOcclusion||[]).map(row=>({...row,id:'facade-occlusion-'+row.id}));
 const occupancyData={...(options.data||{}),buildings:[...(options.data?.buildings||original.buildings||[]),...occlusion]};
 const context=createJuderiaContext({...options,data:occupancyData,contextData:renderData});
 const details=new THREE.Group(),vegetation=new THREE.Group();
 details.name='Circo · bordillos, bolardos y espejo vial';vegetation.name='Circo · plaza arbolada al norte';
 context.group.add(details,vegetation);context.vegetation=vegetation;
 const maps={asphalt:granularTexture(false),planting:granularTexture(true)};
 context.ownedResources.textures.push(...Object.values(maps));
 const own={geometries:[],materials:[]};let ground=options.heightAt||(()=>0),mode='materials',disposed=false;
 const readingColor=options.visitData?.readingLegend?.find(r=>r.id==='contemporanea')?.color||original.readingColor||'#8d9b8b';
 const district=(original.districtOutline||[]).map(p=>project(...p));
 const blankWalls=(original.facadeOcclusion||[]).map(r=>r.coordinates.map(p=>project(...p)));
 for(const mask of original.genericStreetExclusions||[])context.exclusions.push(mask.coordinates.map(p=>project(...p)));
 context.vegetationExclusions=(original.vegetationExclusions||[]).map(row=>row.coordinates.map(p=>project(...p)));
 context.exclusions.push(...context.vegetationExclusions);
 context.sharedContext=original.sharedContext||{};
 for(const road of original.sharedContext?.roads||[])context.plan.components.push({
  id:'shared-street-'+road.owner+'-'+road.id,coordinates:road.coordinates,closed:false,
  kind:'shared-street',period:'contemporary',owner:road.owner,sourceId:road.sourceId,renderedElsewhere:true
 });
 for(const row of original.publicSpaceAreas||[])context.plan.components.push({
  id:row.id,coordinates:row.coordinates,holes:row.holes||[],kind:'public-square',period:'contemporary',sourceId:row.sourceId,interpretive:false
 });

 function clearDetails(){
  for(const key of ['geometries','materials']){
   for(const resource of own[key]){
    const index=context.ownedResources[key].indexOf(resource);if(index>=0)context.ownedResources[key].splice(index,1);
    resource.dispose();
   }
   own[key].length=0;
  }
  details.clear();vegetation.clear();
 }
 function buildDetails(){
  clearDetails();const batches=new Map(),treeQA=[],bollardQA=[];
  const add=(kind,geometry,color)=>{
   const g=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();
   if(!g.attributes.normal)g.computeVertexNormals();const c=new THREE.Color(color),colors=[];
   for(let i=0;i<g.attributes.position.count;i++)colors.push(c.r,c.g,c.b);
   g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.deleteAttribute('uv');
   if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push(g);
  };
  const box=(kind,x,y,z,w,h,d,yaw,color)=>{const g=new THREE.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x,y,z);add(kind,g,color);};
  for(const[index,item]of(original.trees||[]).entries()){
   const p=project(...item.coordinate),base=ground(p.x,p.z)+.11,h=item.heightM,r=item.crownRadiusM;
   const trunk=new THREE.CylinderGeometry(.14,.25,h*.68,9);trunk.translate(p.x,base+h*.34,p.z);add('trunk',trunk,'#817666');
   for(let k=0;k<6;k++){
    const a=k*2.399+index,spread=r*.40,branch=new THREE.CylinderGeometry(.045,.11,h*.27,7);
    branch.rotateZ(.46);branch.rotateY(a);branch.translate(p.x+Math.cos(a)*r*.18,base+h*.54,p.z+Math.sin(a)*r*.18);add('trunk',branch,'#827765');
    const leaf=new THREE.IcosahedronGeometry(1,2);leaf.scale(r*(.60+noise(k+index)*.14),h*(.22+noise(k+81)*.04),r*(.61+noise(k+21)*.12));
    leaf.rotateY(a);leaf.translate(p.x+Math.cos(a)*spread,base+h*.74+(noise(k+index+4)-.5)*h*.10,p.z+Math.sin(a)*spread);
    add('foliage',leaf,['#6d8054','#78885b','#8b9566','#627c50','#78935b','#70834c'][(index+k)%6]);
   }
   treeQA.push({id:item.id,coordinate:item.coordinate,baseM:base,heightM:h,canopyRadiusM:r,interpretive:true});
  }
  let curbSegments=0;
  for(const line of original.curbLines||[]){
   const points=line.coordinates.map(p=>project(...p));
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.04)continue;
    const steps=Math.max(1,Math.ceil(length/.8)),yaw=-Math.atan2(b.z-a.z,b.x-a.x);
    for(let k=0;k<steps;k++){
     const t=(k+.5)/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
     box('curb',x,ground(x,z)+.16,z,length/steps,.11,.15,yaw,'#b8b7ab');curbSegments++;
    }
   }
  }
  for(const item of original.bollards||[]){
   const p=project(...item.coordinate),base=ground(p.x,p.z)+.105,h=item.heightM||.85;
   const pole=new THREE.CylinderGeometry(.045,.055,h,9);pole.translate(p.x,base+h/2,p.z);add('street-metal',pole,'#777b71');
   const cap=new THREE.SphereGeometry(.052,9,5);cap.scale(1,.45,1);cap.translate(p.x,base+h,p.z);add('street-metal',cap,'#8b8b76');
   bollardQA.push({id:item.id,coordinate:item.coordinate,baseM:base,interpretive:true});
  }
  const mirror=original.trafficMirror;
  if(mirror){
   const p=project(...mirror.coordinate),base=ground(p.x,p.z)+.105,h=mirror.poleHeightM||2.8,r=mirror.radiusM||.34,yaw=mirror.yawRadians||0;
   const pole=new THREE.CylinderGeometry(.036,.043,h+.05,9);pole.translate(p.x,base+h/2,p.z);add('street-metal',pole,'#a6a494');
   const disc=new THREE.CylinderGeometry(r,r,.045,24);disc.rotateX(Math.PI/2);disc.rotateY(yaw);disc.translate(p.x,base+h,p.z);add('mirror',disc,'#a8b6b4');
   const rim=new THREE.TorusGeometry(r,.021,7,24);rim.rotateY(yaw);rim.translate(p.x,base+h,p.z);add('street-metal',rim,'#6c7268');
  }
  for(const[kind,parts]of batches){
   const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:kind==='mirror'?.24:kind==='street-metal'?.67:1,
    metalness:kind==='mirror'?.6:kind==='street-metal'?.25:0,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Circo · '+kind;mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={circoContext:true,component:['trunk','foliage'].includes(kind)?'circo-acceso':'circo-entorno',
    period:'contemporary',materialKind:kind,baseColor:material.color.clone(),baseMap:null,interpretive:true,source:'circo-context-photo'};
   (['trunk','foliage'].includes(kind)?vegetation:details).add(mesh);
   own.geometries.push(geometry);own.materials.push(material);
   context.ownedResources.geometries.push(geometry);context.ownedResources.materials.push(material);
  }
  context.qa.publicSpaceDetails={trees:treeQA,bollards:bollardQA,curbSegments,trafficMirror:!!mirror,note:original.furnitureNote};
 }
 function normalizeSurfaces(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData;
   if(!d.circoContext){delete d.juderiaContext;d.circoContext=true;d.period='contemporary';}
   if(d.materialKind==='paving'&&!d.normalizedSurface){
    const kind=d.component==='circo-asfalto'?'asphalt':d.component==='circo-parterres'?'planting':'paving';
    d.surfaceKind=kind;d.normalizedSurface=true;
    const tint=new THREE.Color(kind==='asphalt'?'#626b6d':kind==='planting'?'#8f8065':d.component==='circo-aceras'?'#c6c3b7':'#d1cbbd');
    const attr=mesh.geometry.attributes.color;for(let i=0;i<attr.count;i++)attr.setXYZ(i,tint.r,tint.g,tint.b);attr.needsUpdate=true;
    if(kind!=='paving')d.baseMap=maps[kind];
   }
   if(d.component==='circo-medianera'&&d.materialKind==='plaster'&&!d.blankWallTintApplied){
    const attr=mesh.geometry.attributes.color,pos=mesh.geometry.attributes.position;
    for(let i=0;i<attr.count;i++)if(blankWalls.some(p=>pointInPolygon(pos.getX(i),pos.getZ(i),p))){
     const c=new THREE.Color('#c6bca7').multiplyScalar(.97+noise(i)*.045);attr.setXYZ(i,c.r,c.g,c.b);
    }
    attr.needsUpdate=true;d.blankWallTintApplied=true;
   }
   if(d.component==='juderia-pavimento')d.component='circo-entorno';
  });
 }
 function style(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=mode==='periods',map=periods?null:d.baseMap||null;
   if(m.bumpMap!==map||m.map!==map){m.bumpMap=map;m.map=map;m.needsUpdate=true;}
   m.bumpScale=d.surfaceKind==='asphalt'?.007:d.surfaceKind==='planting'?.014:['tile','stone','paving'].includes(d.materialKind)?.018:.008;
   const vertexColors=!periods&&!!mesh.geometry.attributes.color;
   if(m.vertexColors!==vertexColors){m.vertexColors=vertexColors;m.needsUpdate=true;}
   m.color.copy(d.baseColor);if(periods)m.color.set(readingColor);
  });
 }
 function normalize(){
  context.group.name='Puerta del Circo · Huertos, Remedio y plaza arbolada';context.group.userData.id='circo-context';
  context.group.userData.coordinateSystem='World x/z metres; attach without a monument-local transform.';
  for(const component of context.plan.components)component.period='contemporary';
  context.plan.contextOutline=original.districtOutline||[];
  context.plan.archaeologyOutline=original.coreOutline||[];
  for(const row of context.qa.buildings){const review=reviews.get(String(row.id));if(review){row.method='storeys';row.heightReview=review;}}
  Object.assign(context.stats,{
   sourceHeight:context.qa.buildings.filter(r=>r.method==='height').length,
   ignHeight:context.qa.buildings.filter(r=>r.method==='IGN').length,
   storeyHeight:context.qa.buildings.filter(r=>r.method==='storeys').length,
   fallbackHeight:context.qa.buildings.filter(r=>r.method==='estimate').length,
   heightConflictsReviewed:reviews.size,interpretiveTrees:original.trees?.length||0,
   sourcePlazaAreaM2:original.pavementMesh?.coverage?.sourcePlazaAreaM2||0,
   surfaceApronAreaM2:original.surfaceApron?.areaM2||0,
   reusedBuildingParts:original.sharedContext?.buildings?.length||0,
   reusedStreetFragments:original.sharedContext?.roads?.length||0,preservedPreviousContexts:true
  });
  context.qa.heightReview=original.heightReview||[];context.qa.ownership=original.sharedContext||{};
  context.qa.blankPartyWall={source:'circo-context-photo',renderingOcclusionOnly:true,sourceFootprintsUnchanged:true};
  for(const focus of Object.values(context.focuses)){
   const spec=original.focusSpecs?.[focus.id]||{};focus.closeScale=false;focus.fitBounds=false;
   Object.assign(focus,{floor:0,recommendedMode:'current',readingLayer:'contemporanea',interiorView:false,regionId:'contemporanea',mapScope:'gate'});
   focus.fov=spec.fov||62;focus.offset=[...spec.far];focus.closeOffset=[...spec.near];focus.minDistance=spec.minDistance||1.3;
   if(spec.targetCoordinates){const p=project(...spec.targetCoordinates);focus.target.set(p.x,ground(p.x,p.z)+(spec.targetHeight||1.7),p.z);focus.coordinate=[...spec.targetCoordinates];focus.coordinates=[...spec.targetCoordinates];}
   for(const [offset,eyeHeight]of [[focus.offset,spec.farEyeHeightM||2.15],[focus.closeOffset,spec.nearEyeHeightM||2.15]])
    offset[1]=ground(focus.target.x+offset[0],focus.target.z+offset[2])+eyeHeight-focus.target.y;
   focus.sourceConfidence=spec.sourceConfidence||'Source street registration; width, facade details and viewpoints are interpretive.';
  }
  normalizeSurfaces();style();context.group.updateMatrixWorld(true);context.bounds.setFromObject(context.group);
  context.focusBounds=Object.fromEntries(Object.values(context.focuses).map(f=>[f.id,f.bounds]));
 }
 const bind=context.bindGround,read=context.setReadingMode,select=context.selectFocus,dispose=context.dispose;
 context.bindGround=value=>{if(disposed||typeof value!=='function')return context;ground=value;bind(value);buildDetails();normalize();return context;};
 context.setReadingMode=value=>{mode=read(value);style();return mode;};context.setMode=context.setReadingMode;
 context.selectFocus=id=>{const focus=select(id);style();return focus;};
 context.contains=(x,z)=>district.length>=3&&pointInPolygon(x,z,district);
 context.getElevation=(x,z)=>ground(x,z);
 context.detailBounds=district.length?{minX:Math.min(...district.map(p=>p.x)),maxX:Math.max(...district.map(p=>p.x)),minZ:Math.min(...district.map(p=>p.z)),maxZ:Math.max(...district.map(p=>p.z))}:null;
 context.dispose=()=>{if(disposed)return;disposed=true;dispose();own.geometries.length=own.materials.length=0;};
 buildDetails();normalize();return context;
}
