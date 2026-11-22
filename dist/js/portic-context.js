import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createJuderiaContext} from './juderia-context.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const s=Math.sin(n*127.1+37.4)*43758.5453;return s-Math.floor(s);};

function granularTexture(grass=false){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle=grass?'#939981':'#999b9c';ctx.fillRect(0,0,128,128);
 for(let i=0;i<3600;i++){
  const v=noise(i+400),n=Math.round(115+v*60);ctx.fillStyle=grass?`rgba(${Math.round(n*.89)},${n},${Math.round(n*.62)},.38)`:`rgba(${n},${n},${n},.3)`;
  ctx.fillRect(noise(i+1)*128,noise(i+75)*128,grass?.7:1.1,grass?2:1);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}

/** Current urban context in world metres. Host buildings belong to portic.js.
 * Source polygons are never moved and the context never flattens the terrain.
 */
export function createPorticContext(options={}){
 const original=options.contextData||{},reviews=new Map((original.heightReview||[]).map(row=>[String(row.id),row]));
 const renderData={...original,buildings:(original.buildings||[]).map(row=>{
  const review=reviews.get(String(row.id));return review?{...row,height:review.displayHeightM}:row;
 })};
 const context=createJuderiaContext({...options,contextData:renderData}),project=options.project||projectDefault;
 const details=new THREE.Group(),vegetation=new THREE.Group();details.name='Antiga Moreria · bordillos y bancos';
 vegetation.name='Antiga Moreria · arbolado interpretado de PNOA';context.group.add(details,vegetation);context.vegetation=vegetation;
 const maps={asphalt:granularTexture(false),planting:granularTexture(true)};
 context.ownedResources.textures.push(...Object.values(maps));
 const own={geometries:[],materials:[]};let ground=options.heightAt||(()=>0),mode='materials',disposed=false;
 const readingColor=options.visitData?.readingLegend?.find(r=>r.id==='contemporanea')?.color||original.readingColor||'#8d9b8b';
 for(const mask of original.genericStreetExclusions||[])context.exclusions.push(mask.coordinates.map(p=>project(...p)));
 context.sharedContext=original.sharedContext||{};
 for(const area of original.plantingAreas||[])context.plan.components.push({id:area.id,coordinates:area.coordinates,
  holes:area.holes||[],kind:'garden',period:'contemporary',sourceId:area.sourceId,interpretive:true});
 for(const road of original.sharedContext?.roads||[])context.plan.components.push({id:'shared-street-'+road.owner+'-'+road.id,
  coordinates:road.coordinates,closed:false,kind:'shared-street',period:'contemporary',owner:road.owner,sourceId:road.sourceId,renderedElsewhere:true});

 function clearDetails(){
  for(const key of ['geometries','materials']){
   for(const resource of own[key]){const index=context.ownedResources[key].indexOf(resource);if(index>=0)context.ownedResources[key].splice(index,1);resource.dispose();}
   own[key].length=0;
  }
  details.clear();vegetation.clear();
 }
 function buildDetails(){
  clearDetails();const batches=new Map(),treeQA=[],benchQA=[];
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
   const trunk=new THREE.CylinderGeometry(.12,.24,h*.65,9);trunk.translate(p.x,base+h*.325,p.z);add('trunk',trunk,'#7e7560');
   for(let k=0;k<5;k++){
    const a=k*2.399+index,spread=r*.38,branch=new THREE.CylinderGeometry(.045,.11,h*.28,7);
    branch.rotateZ(.46);branch.rotateY(a);branch.translate(p.x+Math.cos(a)*r*.18,base+h*.52,p.z+Math.sin(a)*r*.18);add('trunk',branch,'#827765');
    const leaf=new THREE.IcosahedronGeometry(1,2);leaf.scale(r*(.62+noise(k+index)*.14),h*(.23+noise(k+81)*.04),r*(.61+noise(k+21)*.12));
    leaf.rotateY(a);leaf.translate(p.x+Math.cos(a)*spread,base+h*.73+(noise(k+index+4)-.5)*h*.1,p.z+Math.sin(a)*spread);
    add('foliage',leaf,['#6f7f53','#7a8760','#8b9468','#657d50','#75905c'][(index+k)%5]);
   }
   treeQA.push({id:item.id,coordinate:item.coordinate,baseM:base,heightM:h,canopyRadiusM:r,interpretive:true});
  }
  for(const[index,item]of(original.benches||[]).entries()){
   const p=project(...item.coordinate),yaw=item.yawRadians||0,c=Math.cos(yaw),s=Math.sin(yaw),base=ground(p.x,p.z)+.105;
   const at=(x,z)=>({x:p.x+x*c+z*s,z:p.z-x*s+z*c});
   for(const side of[-1,1]){const q=at(side*.63,0);box('furniture-metal',q.x,base+.23,q.z,.08,.46,.42,yaw,'#4b5550');}
   for(let k=0;k<4;k++){const q=at(0,(k-1.5)*.115);box('furniture-wood',q.x,base+.47,q.z,1.75,.065,.09,yaw,'#8e785a');}
   for(let k=0;k<3;k++){const q=at(0,.22);box('furniture-wood',q.x,base+.66+k*.105,q.z,1.75,.075,.065,yaw,'#927d60');}
   benchQA.push({id:item.id,coordinate:item.coordinate,baseM:base,interpretive:true});
  }
  // Narrow edges follow sampled ground, never span the site with a level slab.
  let curbSegments=0;
  for(const patch of original.plantingAreas||[])for(const ring of[patch.coordinates,...(patch.holes||[])]){
   const points=ring.map(p=>project(...p));
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(length/.7));
    for(let k=0;k<steps;k++){
     const t=(k+.5)/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=ground(x,z)+.17;
     box('curb',x,y,z,length/steps,.18,.18,-Math.atan2(b.z-a.z,b.x-a.x),'#b4b4a8');curbSegments++;
    }
   }
  }
  for(const[kind,parts]of batches){
   const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:kind==='furniture-metal'?.72:1,
    metalness:kind==='furniture-metal'?.18:0,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Antiga Moreria · '+kind;mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={porticContext:true,component:'portic-plaza',period:'contemporary',materialKind:kind,
    baseColor:material.color.clone(),baseMap:null,interpretive:true,source:'portic-context-pnoa'};
   (['trunk','foliage'].includes(kind)?vegetation:details).add(mesh);
   own.geometries.push(geometry);own.materials.push(material);context.ownedResources.geometries.push(geometry);context.ownedResources.materials.push(material);
  }
  context.qa.publicSpaceDetails={trees:treeQA,benches:benchQA,curbSegments,note:original.furnitureNote};
 }
 function normalizeSurfaces(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData;
   if(!d.porticContext){delete d.juderiaContext;d.porticContext=true;d.period='contemporary';}
   if(d.materialKind==='paving'&&!d.normalizedSurface){
    const kind=d.component==='portic-asfalto'?'asphalt':d.component==='portic-parterres'?'planting':'paving';
    d.surfaceKind=kind;d.normalizedSurface=true;
    const tint=new THREE.Color(kind==='asphalt'?'#626b6d':kind==='planting'?'#6d7951':d.component==='portic-aceras'?'#cac7bb':'#d2cbb8');
    const attr=mesh.geometry.attributes.color;for(let i=0;i<attr.count;i++)attr.setXYZ(i,tint.r,tint.g,tint.b);attr.needsUpdate=true;
    if(kind!=='paving')d.baseMap=maps[kind];
   }
   if(d.component==='juderia-pavimento')d.component='portic-entorno';
  });
 }
 function style(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=mode==='periods',map=periods?null:d.baseMap||null;
   if(m.bumpMap!==map){m.bumpMap=map;m.needsUpdate=true;}
   m.bumpScale=d.surfaceKind==='asphalt'?.007:d.surfaceKind==='planting'?.018:['tile','stone','paving'].includes(d.materialKind)?.018:.008;
   m.map=map;m.vertexColors=!periods;m.color.copy(d.baseColor);if(periods)m.color.set(readingColor);
  });
 }
 function normalize(){
  context.group.name='Vía del Pòrtic · plaza de la Morería y contexto actual';context.group.userData.id='portic-context';
  context.group.userData.coordinateSystem='World x/z metres; attach without applying a monument-local transform.';
  for(const row of context.qa.buildings){const review=reviews.get(String(row.id));if(review){row.method='storeys';row.heightReview=review;}}
  Object.assign(context.stats,{
   sourceHeight:context.qa.buildings.filter(r=>r.method==='height').length,ignHeight:context.qa.buildings.filter(r=>r.method==='IGN').length,
   storeyHeight:context.qa.buildings.filter(r=>r.method==='storeys').length,fallbackHeight:context.qa.buildings.filter(r=>r.method==='estimate').length,
   heightConflictsReviewed:reviews.size,interpretiveTrees:original.trees?.length||0,interpretiveBenches:original.benches?.length||0,
   hostBuildingPartsExcluded:original.coreBuildings?.length||0,reusedBuildingParts:original.sharedContext?.buildings?.length||0,
   reusedStreetFragments:original.sharedContext?.roads?.length||0,preservedPreviousContexts:true
  });
  context.qa.heightReview=original.heightReview||[];context.qa.ownership=original.sharedContext||{};
  for(const focus of Object.values(context.focuses)){
   const spec=original.focusSpecs?.[focus.id]||{};focus.closeScale=false;focus.fitBounds=false;
   Object.assign(focus,{floor:0,recommendedMode:'current',readingLayer:'contemporanea',interiorView:false,regionId:'contemporanea'});
   focus.fov=spec.fov||58;focus.offset=[...spec.far];focus.closeOffset=[...spec.near];focus.minDistance=spec.minDistance||2;
   if(spec.targetCoordinates){const p=project(...spec.targetCoordinates);focus.target.set(p.x,ground(p.x,p.z)+(spec.targetHeight||2),p.z);}
   focus.offset[1]=Math.max(focus.offset[1],ground(focus.target.x+focus.offset[0],focus.target.z+focus.offset[2])+2.5-focus.target.y);
   focus.closeOffset[1]=ground(focus.target.x+focus.closeOffset[0],focus.target.z+focus.closeOffset[2])+(spec.nearEyeHeightM||2.15)-focus.target.y;
   focus.sourceConfidence='Street and cadastral registration; public-space borders, vegetation, furniture and viewpoints remain interpretive.';
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
