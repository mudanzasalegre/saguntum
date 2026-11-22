import {createJuderiaContext} from './juderia-context.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Transfer only explicitly listed source parts. Retained source datasets are
// immutable, and their paving, focus coordinates and terrain patches stay put.
export function withoutSalvadorClaims(contextData={},salvadorContextData={}){
 const owner=String(contextData.id||'').replace(/-context$/,'');
 const claims=salvadorContextData.ownershipTransfers?.[owner];
 if(!claims)return contextData;
 const buildings=new Set((claims.retiredBuildingPartIds||[]).map(String));
 const roads=new Set((claims.retiredRoadIds||[]).map(String));
 if(!buildings.size&&!roads.size)return contextData;
 const retained={...contextData,retiredSourceClaims:{owner:'salvador-core',buildingPartIds:[...buildings],roadIds:[...roads]}};
 for(const key of['buildings','coreBuildings'])if(contextData[key])retained[key]=contextData[key].filter(row=>!buildings.has(String(row.id)));
 for(const key of['excludedBuildingIds','coreExcludedBuildingIds'])if(contextData[key])retained[key]=contextData[key].filter(id=>!buildings.has(String(id)));
 if(roads.size){
  if(contextData.roads)retained.roads=contextData.roads.filter(row=>!roads.has(String(row.id)));
  if(contextData.excludedRoadIds)retained.excludedRoadIds=contextData.excludedRoadIds.filter(id=>!roads.has(String(id)));
 }
 return retained;
}

const UP=new THREE.Vector3(0,1,0);
const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const a=Math.sin(n*127.17+78.71)*43758.5453;return a-Math.floor(a);};
const roadWidth=r=>Math.max(.7,Math.min(18,Number.parseFloat(r.width)||({living_street:3.4,pedestrian:3.1,footway:1.6,path:1.4,steps:1.4}[r.kind]||4.5)));

// OSM 733188295 records concrete plates. Joints and weathering are visual
// approximations; the mapped perimeter is preserved by the prepared mesh.
function concretePlateTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#aaa79e';ctx.fillRect(0,0,256,256);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const shade=193+Math.floor(noise(row*17+col+8)*14);ctx.fillStyle=`rgb(${shade+3},${shade+2},${shade-2})`;ctx.fillRect(col*64+1,row*64+1,62,62);
  ctx.fillStyle='rgba(242,239,227,.28)';ctx.fillRect(col*64+2,row*64+2,60,1);
 }
 for(let n=0;n<4200;n++){ctx.fillStyle=n%2?'rgba(70,64,52,.055)':'rgba(254,251,239,.12)';ctx.fillRect(noise(n+22)*256,noise(n+142)*256,1.3,.9);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}

// Batched, source-located public-space details. Planting is an interpretation
// contained within the mapped park; it is not an inventory of individual trees.
class DetailBatch{
 constructor(){this.groups=new Map();}
 add(kind,geometry,color='#ffffff',matrix=null,component='salvador-entorno'){
  let g=geometry.index?geometry.toNonIndexed():geometry.clone();
  if(matrix)g.applyMatrix4(matrix);if(!g.attributes.normal)g.computeVertexNormals();
  const p=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(color),colors=[],uv=[];
  for(let i=0;i<p.count;i++){
   colors.push(c.r,c.g,c.b);const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
   uv.push((ay>ax&&ay>az?p.getX(i):ax>az?p.getZ(i):p.getX(i))/2.5,(ay>ax&&ay>az?p.getZ(i):p.getY(i))/2.5);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const key=component+'|'+kind;if(!this.groups.has(key))this.groups.set(key,[]);this.groups.get(key).push(g);geometry.dispose();
 }
 box(kind,x,y,z,w,h,d,yaw=0,color='#ffffff',component='salvador-entorno'){
  const g=new THREE.BoxGeometry(w,h,d),m=new THREE.Matrix4().makeRotationY(yaw);m.setPosition(x,y,z);this.add(kind,g,color,m,component);
 }
 beam(kind,a,b,r,color,component='salvador-entorno'){
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va),length=delta.length();if(length<1e-5)return;
  const g=new THREE.CylinderGeometry(r,r,length,8),m=new THREE.Matrix4().compose(va.add(vb).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,delta.normalize()),new THREE.Vector3(1,1,1));this.add(kind,g,color,m,component);
 }
 finish(parent,vegetation,resources,own,stoneMap){
  for(const[key,parts]of this.groups){
   const[component,kind]=key.split('|'),geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const map=['stone','stairs'].includes(kind)?stoneMap:null;
   const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,map,roughness:kind==='iron'?.58:.98,metalness:kind==='iron'?.25:0,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Salvador · '+kind+' · '+component;mesh.castShadow=kind!=='garden';mesh.receiveShadow=true;
   mesh.userData={salvadorContext:true,component,period:'context',materialKind:kind,baseColor:material.color.clone(),baseMap:map,sourceConfidence:kind==='stairs'?'Mapped axis and recorded step count; dimensions interpreted against terrain':'Mapped garden boundary; interpretive public-space details'};
   (['foliage','wood'].includes(kind)?vegetation:parent).add(mesh);resources.geometries.push(geometry);resources.materials.push(material);own.geometries.push(geometry);own.materials.push(material);
  }
 }
}

function lineSampler(coordinates,project){
 const points=coordinates.map(p=>project(...p)),segments=[],distance=[0];let total=0;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<1e-8)continue;segments.push({a,b,start:total,length});total+=length;distance.push(total);}
 return {length:total,at:t=>{const d=Math.max(0,Math.min(1,t))*total,s=segments.find(s=>d<=s.start+s.length)||segments.at(-1),f=(d-s.start)/s.length;return {x:s.a.x+(s.b.x-s.a.x)*f,z:s.a.z+(s.b.z-s.a.z)*f,nx:-(s.b.z-s.a.z)/s.length,nz:(s.b.x-s.a.x)/s.length};}};
}

export function createSalvadorContext(options={}){
 const originalData=options.contextData||{},heightReview=originalData.heightReview||[],reviewById=new Map(heightReview.map(row=>[String(row.id),row]));
 const renderData={...originalData,buildings:(originalData.buildings||[]).map(row=>{const review=reviewById.get(String(row.id));return review?{...row,height:review.displayHeightM}:row;})};
 const context=createJuderiaContext({...options,contextData:renderData}),project=options.project||projectDefault,plateTexture=concretePlateTexture();context.ownedResources.textures.push(plateTexture);
 let currentGround=options.heightAt||(()=>0),mode='materials',disposed=false;
 const own={geometries:[],materials:[]},detail=new THREE.Group(),vegetation=new THREE.Group();detail.name='Salvador · jardín y accesos';vegetation.name='Salvador · vegetación interpretativa';context.group.add(detail,vegetation);context.vegetation=vegetation;
 for(const mask of originalData.genericStreetExclusions||[])context.exclusions.push(mask.coordinates.map(p=>project(...p)));
 for(const garden of originalData.gardens||[]){
  context.exclusions.push(garden.coordinates.map(p=>project(...p)));
  context.plan.components.push({id:'garden-'+garden.id,coordinates:garden.coordinates,kind:'garden',period:'context',sourceId:garden.id,interpretive:false});
 }
 const contextColor=options.visitData?.readingLegend?.find(layer=>layer.id==='context')?.color||originalData.readingColor||'#83a799';
 function clearDetails(){
  for(const key of['geometries','materials']){for(const item of own[key]){const i=context.ownedResources[key].indexOf(item);if(i>=0)context.ownedResources[key].splice(i,1);item.dispose();}own[key].length=0;}
  detail.clear();vegetation.clear();
 }
 function buildDetails(){
  clearDetails();const b=new DetailBatch(),qa={stairs:[],planting:[],gardenVertices:0},ground=currentGround;
  const garden=originalData.gardenMesh;
  if(garden){
   const positions=[];for(const index of garden.indices){const[x,z]=garden.vertices[index];positions.push(x,ground(x,z)+.045,z);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();b.add('garden',g,'#7b8260');qa.gardenVertices=positions.length/3;
  }
  for(const garden of originalData.gardens||[]){
   const points=garden.coordinates.map(p=>project(...p));
   for(let i=1;i<points.length;i++){
    const a=points[i-1],c=points[i],length=Math.hypot(c.x-a.x,c.z-a.z),n=Math.max(1,Math.ceil(length/1.3));
    for(let j=0;j<n;j++){const t=(j+.5)/n,x=a.x+(c.x-a.x)*t,z=a.z+(c.z-a.z)*t,y=ground(x,z);b.box('stone',x,y+.18,z,length/n+.005,.3,.22,-Math.atan2(c.z-a.z,c.x-a.x),'#aaa896');}
   }
  }
  for(const [index,tree]of (originalData.plantedPositions||[]).entries()){
   const p=project(...tree.coordinate),base=ground(p.x,p.z),height=tree.heightM,seed=index*31+4;
   const trunkTop=tree.type==='palm'?height*.78:tree.type==='cypress'?height*.5:height*.53;
   const trunk=new THREE.CylinderGeometry(tree.type==='palm'?.18:.12,tree.type==='palm'?.23:.21,trunkTop,8);trunk.translate(p.x,base+trunkTop/2,p.z);b.add('wood',trunk,'#73634d');
   if(tree.type==='cypress'){
    for(let k=0;k<4;k++){const g=new THREE.IcosahedronGeometry(1,2);g.scale(.83-k*.12,height*.25-k*.12,.78-k*.11);g.translate(p.x+(noise(seed+k)-.5)*.16,base+height*(.43+k*.13),p.z);b.add('foliage',g,['#455e3a','#4e663e','#536b42','#405735'][k]);}
   }else if(tree.type==='palm'){
    for(let k=0;k<10;k++){
     const angle=k*Math.PI/5,length=height*.4,tip=[p.x+Math.cos(angle)*length,base+height*.74,p.z+Math.sin(angle)*length],root=[p.x,base+height*.88,p.z];
     const side=.42,mid=[p.x+Math.cos(angle)*length*.5,base+height*.98,p.z+Math.sin(angle)*length*.5],normal=[-Math.sin(angle)*side,0,Math.cos(angle)*side];
     const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...root,mid[0]+normal[0],mid[1],mid[2]+normal[2],...tip,...root,...tip,mid[0]-normal[0],mid[1],mid[2]-normal[2]],3));g.computeVertexNormals();b.add('foliage',g,k%2?'#587141':'#647e4b');
    }
   }else{
    for(let k=0;k<7;k++){
     const a=k*2.399,spread=k?1.25:0,px=p.x+Math.cos(a)*spread,pz=p.z+Math.sin(a)*spread,py=base+height*(.64+noise(seed+k)*.13);b.beam('wood',[p.x,base+trunkTop*.7,p.z],[px,py,pz],.075,'#73634d');
     const g=new THREE.IcosahedronGeometry(1,2);g.scale(1.35+noise(seed+k)*.35,1.45,1.3+noise(seed+k+10)*.35);g.translate(px,py,pz);b.add('foliage',g,['#637746','#748451','#586e43'][k%3]);
    }
   }
   qa.planting.push({coordinate:tree.coordinate,type:tree.type,baseM:base,heightM:height,interpretive:true});
  }
  for(const road of originalData.stairways||[]){
   const sample=lineSampler(road.coordinates,project),source=lineSampler(road.sourceCoordinates||road.coordinates,project),recorded=Number.parseInt(road.stepCount)||0;
   const start=sample.at(0),end=sample.at(1),difference=ground(end.x,end.z)-ground(start.x,start.z),count=recorded?Math.max(1,Math.round(recorded*sample.length/source.length)):Math.max(1,Math.ceil(Math.abs(difference)/.18)),width=roadWidth(road),component=String(road.sourceId)==='733188296'?'salvador-plaza':'salvador-entorno';
   let maxGroundGap=0;const treads=[];
   for(let k=0;k<count;k++){
    const a=sample.at(k/count),c=sample.at((k+1)/count),mx=(a.x+c.x)/2,mz=(a.z+c.z)/2,length=Math.hypot(c.x-a.x,c.z-a.z),heights=[];
    for(const p of[a,c])for(const side of[-1,0,1])heights.push(ground(p.x+p.nx*width*.5*side,p.z+p.nz*width*.5*side));
    const top=Math.max(...heights)+.105,bottom=Math.min(...heights)-.12;maxGroundGap=Math.max(maxGroundGap,top-Math.min(...heights));
    b.box('stairs',mx,(top+bottom)/2,mz,width,top-bottom,length+.004,Math.atan2(c.x-a.x,c.z-a.z),'#c1bbaa',component);treads.push({x:mx,z:mz,y:top});
   }
   if(road.handrail==='yes')for(const side of[-1,1]){
    let last=null;const posts=Math.max(2,Math.ceil(sample.length/1.45));
    for(let i=0;i<=posts;i++){const p=sample.at(i/posts),x=p.x+p.nx*width*.47*side,z=p.z+p.nz*width*.47*side,y=ground(x,z)+.105,top=[x,y+.9,z];b.beam('iron',[x,y,z],top,.024,'#58625b',component);if(last)b.beam('iron',last,top,.025,'#58625b',component);last=top;}
   }
   qa.stairs.push({id:road.id,sourceId:road.sourceId,recordedWholeWaySteps:recorded||null,modeledSteps:count,wholeWay:road.replacesWholeSource,lengthM:sample.length,widthM:width,maxGroundGapM:maxGroundGap,treads});
  }
  b.finish(detail,vegetation,context.ownedResources,own,context.ownedResources.textures[0]);context.qa.publicSpaceDetails=qa;context.stats.gardenAreaM2=originalData.gardenMesh?.areaM2||0;context.stats.interpretiveTrees=qa.planting.length;context.stats.stairTreads=qa.stairs.reduce((n,s)=>n+s.modeledSteps,0);
 }
 function style(){context.group.traverse(object=>{
  if(!object.isMesh)return;const data=object.userData,material=object.material;delete data.juderiaContext;data.salvadorContext=true;data.period='context';data.baseBumpMap=data.baseMap||null;
  const map=mode==='periods'?null:data.baseBumpMap;if(material.bumpMap!==map){material.bumpMap=map;material.needsUpdate=true;}material.bumpScale=['tile','stone','stairs'].includes(data.materialKind)?.02:.01;
  material.vertexColors=mode!=='periods';material.map=mode==='periods'?null:data.baseMap||null;material.color.copy(data.baseColor);if(mode==='periods')material.color.set(contextColor);
 });}
 function normalize(){
  context.group.name='Iglesia del Salvador · plazas, jardín y caserío';context.group.userData.id='salvador-context';
  Object.assign(context.stats,{preservedSantaMaria:true,preservedPlazaMayor:true,preservedJuderia:true,preservedCalvario:true,preservedBerenguer:true,preservedSangre:true});
  const reviewed=context.qa.buildings.filter(row=>reviewById.has(String(row.id)));for(const row of reviewed){row.method='storeys';row.heightReview=reviewById.get(String(row.id));}
  context.stats.sourceHeight=context.qa.buildings.filter(row=>row.method==='height').length;context.stats.ignHeight=context.qa.buildings.filter(row=>row.method==='IGN').length;context.stats.storeyHeight=context.qa.buildings.filter(row=>row.method==='storeys').length;context.stats.fallbackHeight=context.qa.buildings.filter(row=>row.method==='estimate').length;context.stats.heightConflictsReviewed=reviewed.length;context.qa.heightReview=heightReview;
  for(const focus of Object.values(context.focuses)){
   const spec=originalData.focusSpecs?.[focus.id]||{};focus.closeScale=false;focus.fitBounds=false;focus.fov=spec.fov||54;focus.offset=[...spec.far];focus.closeOffset=[...spec.near];
   if(spec.targetCoordinates){const p=project(...spec.targetCoordinates);focus.target.set(p.x,currentGround(p.x,p.z)+(spec.targetHeight||2),p.z);}
   for(const offset of[focus.offset,focus.closeOffset])offset[1]=Math.max(offset[1],currentGround(focus.target.x+offset[0],focus.target.z+offset[2])+2.5-focus.target.y);
   focus.sourceConfidence='Mapped public-space point; camera aims at the church. Southwest pedestrian platform and northwest garden are distinct.';
  }
  context.group.traverse(object=>{
   if(object.userData.component==='juderia-pavimento')object.userData.component='salvador-entorno';
   if(object.isMesh&&object.userData.component==='salvador-plaza'&&object.userData.materialKind==='paving'){
    object.userData.baseMap=plateTexture;object.userData.sourceSurface='OSM 733188295: concrete:plates';object.material.roughness=.98;
   }
  });context.group.updateMatrixWorld(true);context.bounds.setFromObject(context.group);style();
 }
 const bind=context.bindGround,read=context.setReadingMode,select=context.selectFocus;
 context.bindGround=ground=>{if(disposed)return context;currentGround=ground;bind(ground);buildDetails();normalize();return context;};
 context.setReadingMode=value=>{mode=read(value);style();return mode;};context.selectFocus=id=>{const chosen=select(id);style();return chosen;};
 const dispose=context.dispose;context.dispose=()=>{if(disposed)return;disposed=true;dispose();own.geometries.length=own.materials.length=0;};
 buildDetails();normalize();return context;
}

