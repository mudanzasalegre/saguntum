import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {pointInPolygon} from './urban-surface.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const v=Math.sin(n*127.17+48.1)*43758.5453;return v-Math.floor(v);};
const lerp=(a,b,t)=>a+(b-a)*t;
const planRing=(ring,project)=>{const p=ring.map(c=>project(...c));if(p.length>1&&Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<.0001)p.pop();return p;};
const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
function texture(kind){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
 ctx.fillStyle=kind==='asphalt'?'#d0d2cc':kind==='gravel'?'#d4cbb6':kind==='roof'?'#d4c7b8':'#dfdcd0';ctx.fillRect(0,0,128,128);
 for(let i=0;i<3000;i++){const v=95+Math.floor(noise(i)*145);ctx.fillStyle=`rgba(${v},${Math.round(v*.99)},${Math.round(v*.94)},${kind==='gravel'?.33:.20})`;ctx.fillRect(noise(i+12)*128,noise(i+109)*128,kind==='gravel'?1.5:.9,kind==='gravel'?1.4:.9);}
 if(kind==='paving'){ctx.strokeStyle='rgba(91,91,83,.22)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(128,0);ctx.moveTo(0,0);ctx.lineTo(0,128);ctx.stroke();}
 if(kind==='concrete'){for(let i=0;i<12;i++){ctx.fillStyle=`rgba(100,98,90,${.035+noise(i)*.035})`;ctx.beginPath();ctx.ellipse(noise(i+50)*128,noise(i+90)*128,5+noise(i)*17,2+noise(i+30)*7,noise(i+5)*3,0,Math.PI*2);ctx.fill();}}
 if(kind==='roof'){ctx.strokeStyle='rgba(80,67,54,.15)';ctx.lineWidth=.8;for(let x=0;x<128;x+=8){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,128);ctx.stroke();}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.name='Talleres · textura procedural '+kind;return t;
}

/** Photo-traced open industrial setting in global atlas coordinates.
 * The four naves and their annexes belong to talleres.js. This module owns only
 * the surrounding ground, observed planting and four mapped residential parcels.
 * Its southwest extent stops before the independently owned Alto Horno setting.
 */
export function createTalleresContext({contextData={},visitData={},project=projectDefault,heightAt=()=>0}={}){
 const coordinate=contextData.coordinate||[-.2182925,39.65632195],anchor=project(...coordinate),baseY=heightAt(anchor.x,anchor.z),yaw=contextData.yaw??Math.PI/3;
 const group=new THREE.Group(),surfaces=new THREE.Group(),architecture=new THREE.Group(),details=new THREE.Group(),vegetation=new THREE.Group();
 group.name='Talleres Generales · explanadas y ciudad próxima';surfaces.name='Talleres · viales, rotondas y espacios abiertos';architecture.name='Talleres · viviendas cartografiadas del frente norte';details.name='Talleres · bordillos y mobiliario';vegetation.name='Talleres · arbolado observado en PNOA';group.add(surfaces,architecture,details,vegetation);
 const resources={geometries:[],materials:[],textures:[]},maps={asphalt:texture('asphalt'),paving:texture('paving'),gravel:texture('gravel'),concrete:texture('concrete'),roof:texture('roof')};resources.textures.push(...Object.values(maps));
 const exclusions=(contextData.genericStreetExclusions||[]).map(r=>r.coordinates.map(p=>project(...p))),vegetationExclusions=(contextData.vegetationExclusions||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const excludedBuildingIds=new Set(contextData.excludedBuildingIds||[]),excludedRoadIds=new Set(contextData.excludedRoadIds||[]),collisionPolygons=(contextData.collisionPolygons||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const patches=(contextData.foundationPatches||[]).map(r=>({id:r.id,polygon:r.coordinates.map(p=>project(...p)),height:baseY+(r.heightOffsetM||0),margin:r.marginM??.8}));
 const focuses={},bounds=new THREE.Box3(),stats={...contextData.stats},qa={sourceKeys:(contextData.sources||[]).map(s=>s.id),buildingParts:[],groundSamples:[],trees:[],crossings:[],skippedTinyTriangles:0};
 const palette=Object.fromEntries((visitData.readingLegend||[]).map(r=>[r.id,r.color])),plan={outline:contextData.districtOutline||[],components:[]};
 for(const r of contextData.surfaces||[])plan.components.push({...r,kind:r.component==='talleres-road'?'street':'public-square',period:'conjunto',component:'talleres-entorno'});
 for(const r of contextData.buildings||[])plan.components.push({id:r.id,coordinates:r.coordinates,holes:r.holes||[],kind:'context-building',period:'conjunto',component:'talleres-entorno',sourceId:r.id});
 for(const r of contextData.sharedContext?.buildings||[])plan.components.push({...r,id:'shared-'+r.id,kind:'context-building',period:'conjunto',component:'talleres-entorno'});
 let ground=heightAt,selected=null,readingMode='materials',disposed=false;
 function clear(){for(const r of resources.geometries)r.dispose();for(const r of resources.materials)r.dispose();resources.geometries.length=resources.materials.length=0;surfaces.clear();architecture.clear();details.clear();vegetation.clear();for(const k of ['buildingParts','groundSamples','trees','crossings'])qa[k].length=0;qa.skippedTinyTriangles=0;}
 function build(){
  clear();const batches=new Map();
  const add=(kind,g,color)=>{
   let geometry=g.index?g.toNonIndexed():g.clone();g.dispose();
   // Metre-scale atlas coordinates are stored in Float32 GPU attributes. Tiny
   // slivers from source/grid clipping may collapse after that conversion.
   const p=geometry.attributes.position,keep=[];let dropped=0;
   for(let i=0;i<p.count;i+=3){const ax=p.getX(i),ay=p.getY(i),az=p.getZ(i),bx=p.getX(i+1)-ax,by=p.getY(i+1)-ay,bz=p.getZ(i+1)-az,cx=p.getX(i+2)-ax,cy=p.getY(i+2)-ay,cz=p.getZ(i+2)-az,area2=(by*cz-bz*cy)**2+(bz*cx-bx*cz)**2+(bx*cy-by*cx)**2;if(area2<1e-13){dropped++;continue;}for(let j=0;j<3;j++)keep.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));}
   if(dropped){geometry.dispose();geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(keep,3));qa.skippedTinyTriangles+=dropped;}
   if(!geometry.attributes.position.count){geometry.dispose();return;}
   geometry.computeVertexNormals();const position=geometry.attributes.position,c=new THREE.Color(color),colors=[],uv=[];
   for(let i=0;i<position.count;i++){const v=.986+noise(i+position.count)*.028;colors.push(c.r*v,c.g*v,c.b*v);uv.push(position.getX(i)/2,position.getZ(i)/2);}
   geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push(geometry);
  };
  const box=(kind,x,y,z,w,h,d,angle,color)=>{if(w<=0||h<=0||d<=0)return;const g=new THREE.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);add(kind,g,color);};
  const beam=(kind,a,b,w,d,color)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),delta=B.clone().sub(A),l=delta.length();if(l<.001)return;const g=new THREE.BoxGeometry(w,l,d);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());add(kind,g,color);};
  const cylinder=(kind,x,y,z,r1,r2,h,color,n=10)=>{const g=new THREE.CylinderGeometry(r1,r2,h,n);g.translate(x,y,z);add(kind,g,color);};
  const face=(kind,points,color)=>{const a=[];for(let i=1;i<points.length-1;i++)a.push(...points[0],...points[i],...points[i+1]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));add(kind,g,color);};
  const flat=(kind,outer,holes,y,color)=>{const rings=[outer,...holes],verts=rings.flat(),ix=THREE.ShapeUtils.triangulateShape(outer.map(v=>new THREE.Vector2(v.x,v.z)),holes.map(r=>r.map(v=>new THREE.Vector2(v.x,v.z)))),a=[];for(const t of ix)for(const i of t)a.push(verts[i].x,y,verts[i].z);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));add(kind,g,color);};
  const linePoints=r=>r.coordinates.map(p=>project(...p));
  const walk=(points,spacing,fn)=>{let next=0,travel=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<.001)continue;for(;next<travel+l;next+=spacing){const t=(next-travel)/l;if(t>=0)fn({x:a.x+dx*t,z:a.z+dz*t},{x:dx/l,z:dz/l},next);}travel+=l;}return travel;};
  const pavement=contextData.pavementMesh;
  if(pavement){const lift=pavement.surfaceLiftM??.035,vertices=pavement.vertices.map(([x,z])=>[x,ground(x,z)+lift,z]);for(const part of pavement.groups){const a=[];for(const ix of part.indices)a.push(...vertices[ix]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));const kind=part.component==='talleres-road'?'asphalt':part.component==='talleres-gravel'?'gravel':part.component==='talleres-yard'?'concrete':'paving',color=kind==='asphalt'?'#858a84':kind==='gravel'?'#b9ad91':kind==='concrete'?'#b7b4a7':part.component==='talleres-island'?'#aeb6a4':'#c9c3b3';add(kind,g,color);for(let i=0;i<part.indices.length;i+=3){const p=part.indices.slice(i,i+3).map(ix=>vertices[ix]);qa.groundSamples.push({kind:part.component,x:p.reduce((s,v)=>s+v[0]/3,0),z:p.reduce((s,v)=>s+v[2]/3,0)});}}}
  const sourcePolygons=(contextData.surfaces||[]).map(r=>({component:r.component,outer:linePoints(r),holes:(r.holes||[]).map(p=>p.map(q=>project(...q)))}));
  const contains=(kind,x,z)=>sourcePolygons.some(r=>r.component===kind&&pointInPolygon(x,z,r.outer)&&!r.holes.some(h=>pointInPolygon(x,z,h)));
  const paint=(a,b,width,color,kind='road-paint')=>{const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<.001)return;const nx=-dz/l*width/2,nz=dx/l*width/2,points=[{x:a.x+nx,z:a.z+nz},{x:b.x+nx,z:b.z+nz},{x:b.x-nx,z:b.z-nz},{x:a.x-nx,z:a.z-nz}];face(kind,points.map(p=>[p.x,ground(p.x,p.z)+.054,p.z]),color);};
  for(const road of contextData.roads||[]){if(!road.paintCenterLine)continue;walk(linePoints(road),7,(p,d)=>{const a={x:p.x-d.x*1.15,z:p.z-d.z*1.15},b={x:p.x+d.x*1.15,z:p.z+d.z*1.15};if(contains('talleres-road',a.x,a.z)&&contains('talleres-road',b.x,b.z))paint(a,b,.10,'#dfded1');});}
  for(const row of contextData.crossings||[]){let stripes=0;walk(linePoints(row),.85,(p,d)=>{const n={x:-d.z,z:d.x},a={x:p.x-n.x*1.55,z:p.z-n.z*1.55},b={x:p.x+n.x*1.55,z:p.z+n.z*1.55};if(contains('talleres-road',a.x,a.z)&&contains('talleres-road',b.x,b.z)){paint(a,b,.45,'#e1dfd0');stripes++;}});qa.crossings.push({id:row.id,stripes,photoPosition:true});}
  for(const row of contextData.pavingJoints||[]){const p=linePoints(row);for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)));for(let j=0;j<steps;j++)paint({x:lerp(a.x,b.x,j/steps),z:lerp(a.z,b.z,j/steps)},{x:lerp(a.x,b.x,(j+1)/steps),z:lerp(a.z,b.z,(j+1)/steps)},.065,'#96998d','court-joint');}}
  for(const row of contextData.curbLines||[])walk(linePoints(row),.8,(p,d)=>box('kerb',p.x,ground(p.x,p.z)+.10,p.z,.77,row.heightM||.13,row.widthM||.16,-Math.atan2(d.z,d.x),'#c1beae'));

  // Exact parcel outlines and courtyard holes; facade rhythms, sills and small
  // roof detailing are visual context, never asserted as a measured survey.
  const footprintRows=[...(contextData.buildings||[]),...(contextData.sharedContext?.buildings||[])].map(r=>({outer:planRing(r.coordinates,project),holes:(r.holes||[]).map(h=>planRing(h,project))}));
  const insideBuilding=(x,z)=>footprintRows.some(r=>pointInPolygon(x,z,r.outer)&&!r.holes.some(h=>pointInPolygon(x,z,h)));
  for(const row of contextData.buildings||[]){
   const outer=planRing(row.coordinates,project),holes=(row.holes||[]).map(h=>planRing(h,project)),n=outer.length,centroid=outer.reduce((p,v)=>({x:p.x+v.x/n,z:p.z+v.z/n}),{x:0,z:0}),floor=ground(centroid.x,centroid.z),h=row.displayHeightM||9,roofY=Math.max(floor+h,...outer.map(p=>ground(p.x,p.z)+.8)),facade=row.facadeColor||'#d0ba9c';
   flat('residential-roof',outer,holes,roofY,row.roofColor||'#ac9c88');
   let windows=0,exposed=0;
   for(const ring of [outer,...holes]){const sign=(signedArea(ring)>0?1:-1)*(ring===outer?1:-1);for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<.01)continue;const normal={x:dz/l*sign,z:-dx/l*sign},bottom=Math.min(ground(a.x,a.z),ground(b.x,b.z),floor)-.2;face('residential-wall',[[a.x,bottom,a.z],[b.x,bottom,b.z],[b.x,roofY,b.z],[a.x,roofY,a.z]],facade);
    const mid={x:(a.x+b.x)/2+normal.x*.55,z:(a.z+b.z)/2+normal.z*.55},isExposed=!insideBuilding(mid.x,mid.z);
    if(!isExposed)continue;exposed++;beam('residential-trim',[a.x,roofY+.08,a.z],[b.x,roofY+.08,b.z],.18,.18,'#dfd2bc');
    if(ring!==outer||l<4.2||h<5)continue;
    const angle=-Math.atan2(dz,dx),bays=Math.min(18,Math.max(1,Math.floor(l/3.7))),floors=Math.min(5,Math.max(1,Math.min(Number(row.levels)||Math.floor(h/3),Math.floor(h/2.7)))),spacing=(h-.7)/floors;
    for(let f=0;f<floors;f++)for(let j=0;j<bays;j++){const t=(j+.5)/bays,p={x:lerp(a.x,b.x,t)+normal.x*.035,z:lerp(a.z,b.z,t)+normal.z*.035},y=floor+.9+f*spacing,ww=Math.min(1.35,l/bays*.47),wh=Math.min(1.65,spacing*.58);if(y+wh>roofY-.35)continue;box('residential-window',p.x,y+wh/2,p.z,ww,wh,.055,angle,'#66746d');box('residential-trim',p.x+normal.x*.025,y-.045,p.z+normal.z*.025,ww+.18,.1,.16,angle,'#d8cdb8');beam('residential-frame',[p.x,y,p.z],[p.x,y+wh,p.z],.045,.08,'#c6c2ac');windows++;}
    beam('residential-plinth',[a.x,floor+.18,a.z],[b.x,floor+.18,b.z],.22,.14,'#b4a48b');
   }}
   qa.buildingParts.push({id:row.id,parentId:row.parentId,heightM:h,sourceFootprintPreserved:true,courtyardHoles:holes.length,interpretedFacade:true,exposedEdges:exposed,windows});
  }

  for(const[i,row]of(contextData.trees||[]).entries()){
   const p=project(...row.coordinate),base=ground(p.x,p.z),h=row.heightM,r=row.crownRadiusM;
   if(row.kind==='palm'){cylinder('wood',p.x,base+h*.43,p.z,.16,.24,h*.86,'#93816a');for(let k=0;k<12;k++){const a=k*Math.PI*2/12+i*.4,rad=r*(.85+noise(i+k)*.2),start=[p.x,base+h*.86,p.z],middle=[p.x+Math.cos(a)*rad*.58,base+h*.98,p.z+Math.sin(a)*rad*.58],tip=[p.x+Math.cos(a)*rad,base+h*.76,p.z+Math.sin(a)*rad],side=.30;beam('wood',start,middle,.035,.035,'#848160');face('foliage',[start,[middle[0]-Math.sin(a)*side,middle[1],middle[2]+Math.cos(a)*side],tip,[middle[0]+Math.sin(a)*side,middle[1],middle[2]-Math.cos(a)*side]],['#74875d','#809065','#687e52'][k%3]);}}
   else{cylinder('wood',p.x,base+h*.34,p.z,.14,.25,h*.68,'#8b7b64',9);for(let k=0;k<3;k++){const a=k*2.399+i,g=new THREE.IcosahedronGeometry(1,2);g.scale(r*.76,h*.24,r*.76);g.rotateY(a);g.translate(p.x+Math.cos(a)*r*.3,base+h*.73+(noise(i+k)-.5)*h*.09,p.z+Math.sin(a)*r*.3);add('foliage',g,['#77865e','#829065','#6c8054'][(i+k)%3]);}}
   qa.trees.push({id:row.id,coordinate:row.coordinate,baseM:base,heightM:h,photoPosition:true,dimensionsInterpretive:true});
  }
  for(const row of contextData.lamps||[]){const p=project(...row.coordinate),y=ground(p.x,p.z),h=row.heightM||5.3;cylinder('street-steel',p.x,y+h/2,p.z,.035,.075,h,'#788273',8);beam('street-steel',[p.x,y+h,p.z],[p.x+.55,y+h+.08,p.z],.045,.045,'#788273');box('lamp',p.x+.6,y+h+.08,p.z,.44,.075,.2,0,'#dcdec8');}
  for(const[kind,parts]of batches){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();const map=maps[kind]||(kind==='residential-roof'?maps.roof:kind==='residential-wall'||kind==='kerb'?maps.concrete:null),metal=['street-steel','residential-frame'].includes(kind),material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,map,bumpMap:map,bumpScale:kind==='gravel'?.022:kind==='concrete'?.015:.005,roughness:kind==='residential-window'?.65:metal?.75:1,metalness:metal?.22:0,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry,material);mesh.name='Talleres · entorno · '+kind;mesh.castShadow=!['asphalt','paving','gravel','concrete','road-paint','court-joint'].includes(kind);mesh.receiveShadow=true;mesh.userData={talleresContext:true,component:'talleres-entorno',period:'conjunto',readingLayer:'conjunto',materialKind:kind,baseColor:material.color.clone(),baseMap:map,interpretive:true};(['asphalt','paving','gravel','concrete','road-paint','court-joint'].includes(kind)?surfaces:['wood','foliage'].includes(kind)?vegetation:kind.startsWith('residential')?architecture:details).add(mesh);resources.geometries.push(geometry);resources.materials.push(material);}
  updateFocuses();style();group.updateMatrixWorld(true);bounds.setFromObject(group);stats.meshes=resources.geometries.length;stats.triangles=resources.geometries.reduce((s,g)=>s+g.attributes.position.count/3,0);stats.fixedNaveDatumM=baseY;stats.skippedTinyTriangles=qa.skippedTinyTriangles;
 }
 function updateFocuses(){for(const[id,row]of Object.entries(contextData.focusSpecs||{})){const p=project(...row.targetCoordinates),target=new THREE.Vector3(p.x,baseY+(row.targetHeight||1),p.z),offsets=[row.far,row.near].map(v=>[v[0],Math.max(v[1],ground(p.x+v[0],p.z+v[2])+2.5-target.y),v[2]]),radius=row.radius||190;focuses[id]={id,label:row.label,coordinate:row.targetCoordinates,coordinates:row.targetCoordinates,target,offset:offsets[0],closeOffset:offsets[1],bounds:new THREE.Box3(new THREE.Vector3(p.x-radius,baseY-1,p.z-radius),new THREE.Vector3(p.x+radius,baseY+35,p.z+radius)),components:[id],elevation:row.targetHeight||1,localTarget:[(p.x-anchor.x)*Math.cos(yaw)-(p.z-anchor.z)*Math.sin(yaw),row.targetHeight||1,(p.x-anchor.x)*Math.sin(yaw)+(p.z-anchor.z)*Math.cos(yaw)],floor:0,readingLayer:'conjunto',kind:'context',fitBounds:false,fov:row.fov||56,minDistance:5,sourceConfidence:'Mapped current setting; PNOA ground tracing, with interpreted heights and minor details.'};}}
 function style(){group.traverse(mesh=>{if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=readingMode==='periods',map=periods?null:d.baseMap;if(m.map!==map||m.bumpMap!==map){m.map=m.bumpMap=map;m.needsUpdate=true;}if(m.vertexColors===periods){m.vertexColors=!periods;m.needsUpdate=true;}m.color.copy(d.baseColor);if(periods)m.color.set(palette.conjunto||'#8ebbc2');const active=selected===d.component;m.emissive.set(active?'#344936':'#000000');m.emissiveIntensity=active?.08:0;});}
 function bindGround(fn){if(disposed||typeof fn!=='function')return api;ground=fn;build();return api;}
 function selectFocus(id){selected=id||null;style();return focuses[id]||null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';style();return readingMode;}
 function dispose(){if(disposed)return;disposed=true;clear();for(const t of resources.textures)t.dispose();resources.textures.length=0;group.clear();}
 const api={group,vegetation,patches,exclusions,vegetationExclusions,excludedBuildingIds,excludedRoadIds,collisionPolygons,focuses,bounds,plan,stats,qa,ownedResources:resources,bindGround,selectFocus,setReadingMode,dispose,getState:()=>({selected,readingMode,datumM:baseY})};group.userData={id:'talleres-context',coordinateSystem:'Global atlas x/z metres',ownedResources:resources,stats};build();return api;
}
