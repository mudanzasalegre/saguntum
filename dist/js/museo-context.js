import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createJuderiaContext} from './juderia-context.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const v=Math.sin(n*127.1+37.4)*43758.5453;return v-Math.floor(v);};

// Source plans and previously rendered streets keep their original owner.
// This context owns only the free cadastral parts and pavement fragments in
// museo-context.json; the museum-side arch remains the Judería mesh.
export function createMuseoContext(options={}){
 const original=options.contextData||{},reviews=new Map((original.heightReview||[]).map(row=>[String(row.id),row]));
 const renderData={...original,buildings:(original.buildings||[]).map(row=>{
  const review=reviews.get(String(row.id));return review?{...row,height:review.displayHeightM}:row;
 })};
 const context=createJuderiaContext({...options,contextData:renderData}),project=options.project||projectDefault;
 const detail=new THREE.Group(),vegetation=new THREE.Group();detail.name='Museo · jardineras del frente';vegetation.name='Museo · vegetación interpretativa de las jardineras';context.group.add(detail,vegetation);context.vegetation=vegetation;
 const own={geometries:[],materials:[]};let ground=options.heightAt||(()=>0),mode='materials',disposed=false;
 const readingColor=options.visitData?.readingLegend?.find(row=>row.id==='barrio')?.color||original.readingColor||'#83948a';
 for(const mask of original.genericStreetExclusions||[])context.exclusions.push(mask.coordinates.map(p=>project(...p)));
 context.sharedContext=original.sharedContext||{};
 for(const road of original.sharedContext?.roads||[])context.plan.components.push({
  id:'shared-street-'+road.owner+'-'+road.id,coordinates:road.coordinates,closed:false,
  kind:'shared-street',period:'barrio',owner:road.owner,sourceId:road.sourceId,interpretive:false,renderedElsewhere:true
 });
 const sharedArc=original.sharedContext?.protectedArc;
 if(sharedArc)context.plan.components.push({id:'museo-shared-arc',coordinates:sharedArc.coordinates,
  kind:'shared-arc',period:'barrio',owner:'juderia',sourceId:sharedArc.sourceId,interpretive:false,renderedElsewhere:true});

 function clearDetails(){
  for(const key of['geometries','materials']){
   for(const resource of own[key]){
    const index=context.ownedResources[key].indexOf(resource);if(index>=0)context.ownedResources[key].splice(index,1);
    resource.dispose();
   }
   own[key].length=0;
  }
  detail.clear();vegetation.clear();
 }
 function buildDetails(){
  clearDetails();const batches=new Map(),qa=[];
  const add=(kind,geometry,color)=>{
   let g=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();
   if(!g.attributes.normal)g.computeVertexNormals();const c=new THREE.Color(color),values=[];
   for(let i=0;i<g.attributes.position.count;i++)values.push(c.r,c.g,c.b);
   g.setAttribute('color',new THREE.Float32BufferAttribute(values,3));
   g.deleteAttribute('uv');if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push(g);
  };
  for(const[index,item]of(original.furniture||[]).entries()){
   const p=project(...item.coordinate),r=item.radiusM||.4,h=item.heightM||.5;
   const samples=Array.from({length:8},(_,i)=>ground(p.x+Math.cos(i*Math.PI/4)*r,p.z+Math.sin(i*Math.PI/4)*r));
   const base=Math.max(...samples)+.12;
   // The photograph documents cylindrical planters, not exact dimensions or
   // a tree inventory. Narrow feet bridge the small slope beneath each pot.
   const profile=[[r*.78,0],[r*.93,.04],[r,h*.86],[r*1.03,h*.9],[r*1.03,h],[r*.91,h],[r*.88,h*.86]];
   const pot=new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),24);pot.translate(p.x,base,p.z);add('planter',pot,'#685a4d');
   const soil=new THREE.CylinderGeometry(r*.88,r*.88,.04,20);soil.translate(p.x,base+h-.08,p.z);add('soil',soil,'#514337');
   const treeHeight=item.treeHeightM||1.9,trunkHeight=treeHeight*.63;
   const trunk=new THREE.CylinderGeometry(.035,.055,trunkHeight,8);trunk.translate(p.x,base+h+trunkHeight/2-.06,p.z);add('wood',trunk,'#6d6250');
   for(let k=0;k<8;k++){
    const a=k*2.399,spread=k?.3:0,leaf=new THREE.IcosahedronGeometry(1,2);
    leaf.scale(.36+noise(index*9+k)*.09,.38+noise(k+81)*.09,.36+noise(k+21)*.08);
    leaf.rotateY(a);leaf.translate(p.x+Math.cos(a)*spread,base+h+treeHeight*.78+(noise(k+4)-.5)*.18,p.z+Math.sin(a)*spread);
    add('foliage',leaf,['#6e7a42','#65763d','#7a854b','#536d3a'][k%4]);
   }
   qa.push({id:item.id,coordinate:item.coordinate,baseM:base,heightM:h,treeHeightM:treeHeight,
    maximumGroundGapM:base-Math.min(...samples),source:item.source,interpretive:true});
  }
  for(const[kind,parts]of batches){
   const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,
    roughness:kind==='planter'?.87:1,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Museo · '+kind;
   mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={museoContext:true,component:'museo-plaza',period:'barrio',materialKind:kind,
    baseColor:material.color.clone(),baseMap:null,interpretive:true,source:'museo-context-restoration'};
   (['foliage','wood'].includes(kind)?vegetation:detail).add(mesh);own.geometries.push(geometry);own.materials.push(material);
   context.ownedResources.geometries.push(geometry);context.ownedResources.materials.push(material);
  }
  context.qa.publicSpaceDetails={planters:qa,stairs:[],note:original.furnitureNote};
 }
 function style(){
  context.group.traverse(mesh=>{
   if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material;
   delete d.juderiaContext;d.museoContext=true;d.period='barrio';
   const periods=mode==='periods',map=periods?null:d.baseMap||null;
   if(m.bumpMap!==map){m.bumpMap=map;m.needsUpdate=true;}
   m.bumpScale=['tile','stone','paving'].includes(d.materialKind)?.018:.008;
   m.map=map;m.vertexColors=!periods;m.color.copy(d.baseColor);if(periods)m.color.set(readingColor);
  });
 }
 function normalize(){
  context.group.name='Museo Arqueológico · replaza, Dolors y conexión con la Judería';
  context.group.userData.id='museo-context';context.group.userData.sharedContext=context.sharedContext;
  context.group.userData.coordinateSystem='World x/z metres; attach without applying museum local transform.';
  for(const row of context.qa.buildings){
   const review=reviews.get(String(row.id));if(review){row.method='storeys';row.heightReview=review;}
  }
  Object.assign(context.stats,{
   sourceHeight:context.qa.buildings.filter(r=>r.method==='height').length,
   ignHeight:context.qa.buildings.filter(r=>r.method==='IGN').length,
   storeyHeight:context.qa.buildings.filter(r=>r.method==='storeys').length,
   fallbackHeight:context.qa.buildings.filter(r=>r.method==='estimate').length,
   heightConflictsReviewed:reviews.size,interpretivePlanters:original.furniture?.length||0,
   reusedBuildingParts:original.sharedContext?.buildings?.length||0,
   reusedStreetFragments:original.sharedContext?.roads?.length||0,protectedArcOwner:'juderia',
   preservedJuderia:true,preservedCalvario:true,preservedBerenguer:true,preservedSangre:true,preservedSalvador:true
  });
  context.qa.heightReview=original.heightReview||[];context.qa.ownership=original.sharedContext||{};
  for(const focus of Object.values(context.focuses)){
   const spec=original.focusSpecs?.[focus.id]||{};
   focus.closeScale=false;focus.fitBounds=false;focus.fov=spec.fov||58;
   focus.offset=[...spec.far];focus.closeOffset=[...spec.near];focus.minDistance=spec.minDistance||2;
   if(spec.targetCoordinates){const p=project(...spec.targetCoordinates);focus.target.set(p.x,ground(p.x,p.z)+(spec.targetHeight||2),p.z);}
   focus.offset[1]=Math.max(focus.offset[1],ground(focus.target.x+focus.offset[0],focus.target.z+focus.offset[2])+2.5-focus.target.y);
   if(Number.isFinite(spec.nearEyeHeightM))focus.closeOffset[1]=ground(focus.target.x+focus.closeOffset[0],focus.target.z+focus.closeOffset[2])+spec.nearEyeHeightM-focus.target.y;
   else focus.closeOffset[1]=Math.max(focus.closeOffset[1],ground(focus.target.x+focus.closeOffset[0],focus.target.z+focus.closeOffset[2])+2.5-focus.target.y);
   focus.sourceConfidence=focus.id==='museo-arco'?'Shared existing Judería arch OSM1303697035; no duplicated geometry.':'Source-registered public-space focus; plaza outline and camera height are interpretive.';
  }
  context.group.traverse(mesh=>{if(mesh.userData.component==='juderia-pavimento')mesh.userData.component='museo-entorno';});
  context.group.updateMatrixWorld(true);context.bounds.setFromObject(context.group);style();
 }
 const bind=context.bindGround,read=context.setReadingMode,select=context.selectFocus,dispose=context.dispose;
 context.bindGround=value=>{if(disposed||typeof value!=='function')return context;ground=value;bind(value);buildDetails();normalize();return context;};
 context.setReadingMode=value=>{mode=read(value);style();return mode;};context.setMode=context.setReadingMode;
 context.selectFocus=id=>{const focus=select(id);style();return focus;};
 context.dispose=()=>{if(disposed)return;disposed=true;dispose();own.geometries.length=own.materials.length=0;};
 buildDetails();normalize();return context;
}
