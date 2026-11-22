import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const v=Math.sin(n*127.17+48.1)*43758.5453;return v-Math.floor(v);};

function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle=kind==='soil'?'#b5ab91':kind==='asphalt'?'#858b89':'#c6bca8';ctx.fillRect(0,0,128,128);
 for(let i=0;i<3600;i++){
  const v=110+Math.floor(noise(i)*105);ctx.fillStyle=kind==='soil'?`rgba(${v},${Math.round(v*.93)},${Math.round(v*.78)},.35)`:`rgba(${v},${Math.round(v*.99)},${Math.round(v*.94)},.30)`;
  ctx.fillRect(noise(i+1)*128,noise(i+101)*128,kind==='limestone'?1.6:1,kind==='soil'?1.1:.8);
 }
 if(kind==='soil')for(let i=0;i<85;i++){ctx.fillStyle=i%2?'rgba(58,51,37,.15)':'rgba(248,240,210,.25)';ctx.beginPath();ctx.ellipse(noise(i+211)*128,noise(i+351)*128,.7+noise(i+412)*1.1,.55,noise(i)*6.28,0,Math.PI*2);ctx.fill();}
 const result=new THREE.CanvasTexture(canvas);result.colorSpace=THREE.SRGBColorSpace;result.wrapS=result.wrapT=THREE.RepeatWrapping;result.anisotropy=4;
 result.name='Necrópolis · textura procedural '+kind;return result;
}

/** Two terrain-following settings. Ancient graves/caves and their immediate
 * enclosure belong to necropolis.js. Castle and theatre keep their old owners.
 * Coordinates are global atlas metres; attach without a local transform.
 */
export function createNecropolisContext({contextData={},visitData={},project=projectDefault,heightAt=()=>0}={}){
 const group=new THREE.Group(),vegetation=new THREE.Group(),surfaces=new THREE.Group(),landscape=new THREE.Group();
 group.name='Necrópolis · caminos y laderas de dos sectores';vegetation.name='Necrópolis · vegetación de la ladera';
 surfaces.name='Necrópolis · senderos sobre el relieve';landscape.name='Necrópolis · contenciones y roca exterior';group.add(surfaces,landscape,vegetation);
 const resources={geometries:[],materials:[],textures:[]},maps={soil:texture('soil'),asphalt:texture('asphalt'),limestone:texture('limestone')};resources.textures.push(...Object.values(maps));
 const exclusions=(contextData.genericStreetExclusions||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const vegetationExclusions=(contextData.vegetationExclusions||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const excludedBuildingIds=new Set(contextData.excludedBuildingIds||[]),excludedRoadIds=new Set(contextData.excludedRoadIds||[]);
 const focuses={},bounds=new THREE.Box3(),stats={...contextData.stats,buildingParts:0,parentParcels:0,courtyards:0,preservedCastle:true,preservedTheatre:true,preservedPreviousContexts:true};
 const qa={groundSamples:[],vegetation:[],walls:[],sourceKeys:(contextData.sources||[]).map(s=>s.id),limits:[contextData.pavingNote,contextData.vegetationNote,contextData.retainingWallNote]};
 const palette=Object.fromEntries((visitData.readingLegend||[]).map(p=>[p.id,p.color]));
 let ground=heightAt,selected=null,readingMode='materials',disposed=false;
 const plan={outline:contextData.districtOutline||[],sectors:contextData.sectors||[],components:[]};
 for(const r of contextData.roads||[])plan.components.push({id:'street-'+r.id,coordinates:r.coordinates,closed:false,kind:'street',scope:r.scope,period:'contemporanea',sourceId:r.sourceId});
 for(const r of contextData.surfaces||[])plan.components.push({id:r.id,coordinates:r.coordinates,holes:r.holes||[],kind:'path',scope:r.scope,period:'contemporanea',sourceId:r.sourceId,interpretive:true});
 for(const r of contextData.retainingWalls||[])plan.components.push({id:r.id,coordinates:r.coordinates,closed:false,kind:'retaining-wall',scope:r.scope,period:'contemporanea',sourceId:r.sourceId});
 for(const r of contextData.landcover||[])plan.components.push({id:r.id,coordinates:r.coordinates,holes:r.holes||[],kind:'landcover',landcoverKind:r.kind,scope:r.scope,period:'rupestre',sourceId:r.sourceId});
 for(const r of contextData.sharedContext?.buildings||[])plan.components.push({...r,id:'shared-building-'+r.id,kind:'context-building',period:'contemporanea'});
 for(const r of contextData.sharedContext?.roads||[]){
  const centroid=r.coordinates.reduce((a,p)=>[a[0]+p[0]/r.coordinates.length,a[1]+p[1]/r.coordinates.length],[0,0]);
  const nearest=(contextData.sectors||[]).reduce((a,s)=>{const d=Math.hypot(...centroid.map((v,i)=>v-s.coordinate[i]));return !a||d<a.distance?{id:s.id,distance:d}:a;},null);
  plan.components.push({...r,id:'shared-road-'+r.id,kind:'street',closed:false,scope:nearest?.id||'cementerio',period:'contemporanea',renderedElsewhere:true});
 }
 function clear(){
  for(const r of resources.geometries)r.dispose();for(const r of resources.materials)r.dispose();resources.geometries.length=resources.materials.length=0;
  surfaces.clear();landscape.clear();vegetation.clear();qa.groundSamples.length=qa.vegetation.length=qa.walls.length=0;
 }
 function build(){
  clear();const batches=new Map();
  function add(kind,scope,component,g,tint){
   const geometry=g.index?g.toNonIndexed():g.clone();g.dispose();
   if(!geometry.attributes.normal)geometry.computeVertexNormals();
   const pos=geometry.attributes.position,c=new THREE.Color(tint),colors=[],uv=[];
   for(let i=0;i<pos.count;i++){const variation=.97+noise(i+pos.count)*.06;colors.push(c.r*variation,c.g*variation,c.b*variation);uv.push(pos.getX(i)/2,pos.getZ(i)/2);}
   geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
   const key=[kind,scope,component].join('|');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geometry);
  }
  function box(kind,scope,component,x,y,z,w,h,d,yaw,tint){const g=new THREE.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x,y,z);add(kind,scope,component,g,tint);}
  const pavement=contextData.pavementMesh;
  if(pavement){
   const lift=pavement.surfaceLiftM??.035,vertices=pavement.vertices.map(([x,z])=>[x,ground(x,z)+lift,z]);
   for(const part of pavement.groups){
    const data=[];for(const ix of part.indices)data.push(...vertices[ix]);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data,3));g.computeVertexNormals();
    const isRoad=part.component.endsWith('-road'),component=part.scope==='cementerio'?'necro-acceso':'necro-contexto';
    add(isRoad?'asphalt':'soil',part.scope,component,g,isRoad?'#99998c':'#b7ac90');
    for(let i=0;i<part.indices.length;i+=3){const p=part.indices.slice(i,i+3).map(ix=>vertices[ix]);qa.groundSamples.push({scope:part.scope,x:p.reduce((n,v)=>n+v[0]/3,0),z:p.reduce((n,v)=>n+v[2]/3,0),kind:isRoad?'road':'path'});}
   }
  }
  for(const row of contextData.retainingWalls||[]){
   const points=row.coordinates.map(p=>project(...p)),component=row.scope==='cementerio'?'necro-acceso':'necro-contexto';let length=0;
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],l=Math.hypot(b.x-a.x,b.z-a.z);if(l<.04)continue;length+=l;
    const count=Math.ceil(l/.7),yaw=-Math.atan2(b.z-a.z,b.x-a.x),dx=(b.x-a.x)/l,dz=(b.z-a.z)/l;
    for(let k=0;k<count;k++){
     const t=(k+.5)/count,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,level=ground(x,z),low=Math.min(ground(x-dz*.55,z+dx*.55),ground(x+dz*.55,z-dx*.55))-.45,top=level+(row.heightAboveGradeM||.62),height=top-low;
     const courses=Math.ceil(height/.27);for(let r=0;r<courses;r++){
      const h=height/courses-.012,w=l/count-.018;box('wallstone',row.scope,component,x,low+(r+.5)*height/courses,z,w,h,row.widthM||.42,yaw,['#a89f85','#b5a88d','#bbb298','#a99c81'][(r+k+i)%4]);
     }
     box('wallstone',row.scope,component,x,top+.035,z,l/count-.012,.09,(row.widthM||.42)+.09,yaw,'#c9c0a7');
    }
   }
   qa.walls.push({id:row.id,scope:row.scope,lengthM:length,heightAboveGradeM:row.heightAboveGradeM,interpretiveHeight:true});
  }
  for(const[i,row]of(contextData.trees||[]).entries()){
   const p=project(...row.coordinate),base=ground(p.x,p.z),h=row.heightM,r=row.crownRadiusM,component=row.scope==='cementerio'?'necro-ladera':'necro-contexto';
   const trunk=new THREE.CylinderGeometry(row.kind==='cypress'?.10:.16,row.kind==='cypress'?.16:.24,h*.77,8);trunk.translate(p.x,base+h*.385,p.z);add('wood',row.scope,component,trunk,'#75674f');
   if(row.kind==='cypress'){
    const crown=new THREE.ConeGeometry(r,h*.88,12,7),pos=crown.attributes.position;
    for(let j=0;j<pos.count;j++){const x=pos.getX(j),z=pos.getZ(j),n=.90+noise(j+i*80)*.18;pos.setXYZ(j,x*n,pos.getY(j),z*n);}crown.computeVertexNormals();crown.translate(p.x,base+h*.56,p.z);add('foliage',row.scope,component,crown,['#526344','#5d704c','#6b7954'][i%3]);
   }else{
    for(let k=0;k<5;k++){
     const a=k*2.399+i,spread=r*.38,crown=new THREE.IcosahedronGeometry(1,2);crown.scale(r*.73,h*.19,r*.75);crown.rotateY(a);crown.translate(p.x+Math.cos(a)*spread,base+h*.80+(noise(k+i)-.5)*h*.1,p.z+Math.sin(a)*spread);add('foliage',row.scope,component,crown,['#6e7b50','#7c855b','#667448','#818c62','#778457'][(i+k)%5]);
    }
   }
   qa.vegetation.push({id:row.id,scope:row.scope,baseM:base,heightM:h,coordinate:row.coordinate,interpretive:true});
  }
  for(const[i,row]of(contextData.details||[]).entries()){
   const p=project(...row.coordinate),base=ground(p.x,p.z),r=row.radiusM,h=row.heightM,component=row.scope==='cementerio'?'necro-ladera':'necro-contexto';
   const g=new THREE.IcosahedronGeometry(1,1);g.scale(r,h*.6,r*(.75+noise(i)*.5));g.rotateY(row.yawRadians);g.translate(p.x,base+h*.35-.04,p.z);
   add(row.kind==='rock'?'limestone':'foliage',row.scope,component,g,row.kind==='rock'?['#b3ab93','#c0b59d','#a99f88'][i%3]:['#84906b','#8d956d','#707d53','#969875'][i%4]);
  }
  for(const[key,parts]of batches){
   const[kind,scope,component]=key.split('|'),geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const map=maps[kind==='wallstone'?'limestone':kind]||null,material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,map,bumpMap:map,bumpScale:kind==='soil'?.018:['limestone','wallstone'].includes(kind)?.021:.004,roughness:1,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Necrópolis · entorno · '+scope+' · '+kind;mesh.castShadow=!['soil','asphalt'].includes(kind);mesh.receiveShadow=true;
   mesh.userData={necropolisContext:true,component,scope,archFocus:scope,period:['soil','asphalt','wallstone'].includes(kind)?'contemporanea':'rupestre',materialKind:kind,baseColor:material.color.clone(),baseMap:map,interpretive:true};
   (['soil','asphalt'].includes(kind)?surfaces:['wood','foliage'].includes(kind)?vegetation:landscape).add(mesh);resources.geometries.push(geometry);resources.materials.push(material);
  }
  updateFocuses();style();group.updateMatrixWorld(true);bounds.setFromObject(group);
  stats.meshes=resources.geometries.length;stats.triangles=resources.geometries.reduce((n,g)=>n+g.attributes.position.count/3,0);
 }
 function updateFocuses(){
  for(const[id,spec]of Object.entries(contextData.focusSpecs||{})){
   const coordinates=spec.targetCoordinates,p=project(...coordinates),target=new THREE.Vector3(p.x,ground(p.x,p.z)+(spec.targetHeight??1),p.z);
   const offsets=[spec.far,spec.near].map(v=>{const offset=[...v];offset[1]=Math.max(offset[1],ground(target.x+v[0],target.z+v[2])+2.5-target.y);return offset;});
   const r=spec.radius||12,box=new THREE.Box3(new THREE.Vector3(p.x-r,target.y-2,p.z-r),new THREE.Vector3(p.x+r,target.y+12,p.z+r));
   focuses[id]={id,label:spec.label,coordinate:coordinates,coordinates,target,offset:offsets[0],closeOffset:offsets[1],bounds:box,
    components:[id],archFocus:spec.scope,mapScope:spec.scope,scope:spec.scope,regionId:spec.scope,floor:0,
    recommendedMode:'current',kind:'context',fitBounds:false,fov:spec.fov||58,minDistance:2,
    readingLayer:id==='necro-ladera'?'rupestre':'contemporanea',sourceConfidence:'Mapped landscape and access; camera elevation and detailed plant positions are interpretive.'};
  }
 }
 function style(){
  group.traverse(mesh=>{if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=readingMode==='periods',map=periods?null:d.baseMap;
   if(m.map!==map||m.bumpMap!==map){m.map=m.bumpMap=map;m.needsUpdate=true;}if(m.vertexColors===periods){m.vertexColors=!periods;m.needsUpdate=true;}
   m.color.copy(d.baseColor);if(periods)m.color.set(palette[d.period]||(d.period==='rupestre'?'#b1aaa0':'#80a7ac'));
   m.emissive.set(selected===d.component?'#403923':'#000000');m.emissiveIntensity=selected===d.component?.10:0;
  });
 }
 function bindGround(fn){if(disposed||typeof fn!=='function')return api;ground=fn;build();return api;}
 function selectFocus(id){selected=id&&focuses[id]?id:null;style();return selected?focuses[selected]:null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';style();return readingMode;}
 function dispose(){if(disposed)return;disposed=true;clear();for(const t of resources.textures)t.dispose();resources.textures.length=0;group.clear();}
 const api={group,vegetation,patches:[],exclusions,vegetationExclusions,excludedBuildingIds,excludedRoadIds,focuses,bounds,plan,stats,qa,
  ownedResources:resources,bindGround,selectFocus,setReadingMode,dispose,getState:()=>({selected,readingMode})};
 group.userData={id:'necropolis-context',ownedResources:resources,coordinateSystem:'Global atlas x/z metres',stats};
 build();return api;
}
