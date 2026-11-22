import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {pointInPolygon} from './urban-surface.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const v=Math.sin(n*127.17+48.1)*43758.5453;return v-Math.floor(v);};
const lerp=(a,b,t)=>a+(b-a)*t;
const planRing=(ring,project)=>{const p=ring.map(c=>project(...c));if(p.length>1&&Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<.0001)p.pop();return p;};
function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
 ctx.fillStyle=kind==='asphalt'?'#d4d5d0':kind==='gravel'?'#d5cebd':'#e3e1d6';ctx.fillRect(0,0,128,128);
 for(let i=0;i<2800;i++){const v=95+Math.floor(noise(i)*145);ctx.fillStyle=`rgba(${v},${Math.round(v*.99)},${Math.round(v*.94)},${kind==='gravel'?.3:.18})`;ctx.fillRect(noise(i+12)*128,noise(i+109)*128,kind==='gravel'?1.6:.8,kind==='gravel'?1.3:.8);}
 if(kind==='paving'){ctx.strokeStyle='rgba(91,91,83,.23)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(128,0);ctx.moveTo(0,0);ctx.lineTo(0,128);ctx.stroke();}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.name='Horno · textura procedural '+kind;return t;
}

/** Current industrial surroundings, in global atlas metres.
 * Furnace/skip/foundations belong to horno.js. This owns the inclined reception,
 * covered visitor ramp, photo-traced yard, streets and five mapped low industrial
 * building parts. Other monuments and unselected buildings retain their owners.
 */
export function createHornoContext({contextData={},visitData={},project=projectDefault,heightAt=()=>0}={}){
 const coordinate=contextData.coordinate||[-.2203074,39.6542918],anchor=project(...coordinate),baseY=heightAt(anchor.x,anchor.z);
 const group=new THREE.Group(),surfaces=new THREE.Group(),architecture=new THREE.Group(),details=new THREE.Group(),vegetation=new THREE.Group();
 group.name='Alto Horno nº 2 · recepción y entorno industrial';surfaces.name='Horno · rotonda, plaza y recinto excavado';
 architecture.name='Horno · pabellón inclinado y edificios próximos';details.name='Horno · traviesas, cerramiento y vía perimetral';vegetation.name='Horno · vegetación observada en PNOA';
 group.add(surfaces,architecture,details,vegetation);
 const resources={geometries:[],materials:[],textures:[]},maps={asphalt:texture('asphalt'),paving:texture('paving'),gravel:texture('gravel'),concrete:texture('concrete')};resources.textures.push(...Object.values(maps));
 const exclusions=(contextData.genericStreetExclusions||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const vegetationExclusions=(contextData.vegetationExclusions||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const excludedBuildingIds=new Set(contextData.excludedBuildingIds||[]),excludedRoadIds=new Set(contextData.excludedRoadIds||[]);
 const collisionPolygons=(contextData.collisionPolygons||[]).map(r=>r.coordinates.map(p=>project(...p)));
 const patches=(contextData.foundationPatches||[]).map(r=>({id:r.id,polygon:r.coordinates.map(p=>project(...p)),height:baseY+(r.heightOffsetM||0),margin:r.marginM??.8}));
 const focuses={},bounds=new THREE.Box3(),stats={...contextData.stats},qa={sourceKeys:(contextData.sources||[]).map(s=>s.id),buildingParts:[],groundSamples:[],trees:[],ramps:[],fences:[],railways:[]};
 const palette=Object.fromEntries((visitData.readingLegend||[]).map(r=>[r.id,r.color]));
 const plan={outline:contextData.districtOutline||[],components:[]};
 for(const r of contextData.surfaces||[])plan.components.push({...r,id:r.id,kind:r.component==='horno-road'?'street':'public-square',period:'conjunto',component:'horno-entorno'});
 for(const r of contextData.buildings||[])plan.components.push({id:r.id,coordinates:r.coordinates,holes:r.holes||[],kind:'context-building',period:'conjunto',component:'horno-entorno',sourceId:r.id});
 for(const r of contextData.sharedContext?.buildings||[])plan.components.push({...r,id:'shared-'+r.id,kind:'context-building',period:'conjunto',component:'horno-entorno'});
 if(contextData.pavilion){plan.components.push({id:'horno-recepcion',coordinates:contextData.pavilion.coordinates,kind:'reception',period:'conjunto',component:'horno-entorno'});plan.components.push({id:'horno-rampa',coordinates:contextData.pavilion.corridorCoordinates,kind:'visitor-ramp',period:'conjunto',component:'horno-acceso'});}
 for(const r of contextData.railAlignments||[])plan.components.push({...r,kind:'railway',closed:false,period:'conjunto',component:'horno-entorno'});
 for(const r of contextData.fences||[])plan.components.push({...r,kind:'fence',closed:false,period:'conjunto',component:'horno-entorno'});
 let ground=heightAt,selected=null,readingMode='materials',disposed=false;
 function clear(){for(const r of resources.geometries)r.dispose();for(const r of resources.materials)r.dispose();resources.geometries.length=resources.materials.length=0;surfaces.clear();architecture.clear();details.clear();vegetation.clear();for(const key of ['buildingParts','groundSamples','trees','ramps','fences','railways'])qa[key].length=0;}
 function build(){
  clear();const batches=new Map();
  const add=(kind,component,g,color)=>{
   const geometry=g.index?g.toNonIndexed():g.clone();g.dispose();if(!geometry.attributes.normal)geometry.computeVertexNormals();
   const p=geometry.attributes.position,c=new THREE.Color(color),colors=[],uv=[];
   for(let i=0;i<p.count;i++){const v=.985+noise(i+p.count)*.03;colors.push(c.r*v,c.g*v,c.b*v);uv.push(p.getX(i)/2,p.getZ(i)/2);}
   geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
   const key=kind+'|'+component;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geometry);
  };
  const box=(kind,component,x,y,z,w,h,d,yaw,color)=>{const g=new THREE.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x,y,z);add(kind,component,g,color);};
  const beam=(kind,component,a,b,w,d,color)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),delta=B.clone().sub(A),length=delta.length();if(length<1e-5)return;const g=new THREE.BoxGeometry(w,length,d);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());add(kind,component,g,color);};
  const cylinder=(kind,component,x,y,z,r1,r2,h,color,n=10)=>{const g=new THREE.CylinderGeometry(r1,r2,h,n);g.translate(x,y,z);add(kind,component,g,color);};
  const face=(kind,component,points,color)=>{const a=[];for(let i=1;i<points.length-1;i++)a.push(...points[0],...points[i],...points[i+1]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();add(kind,component,g,color);};
  const flat=(kind,component,ring,y,color)=>{const p=ring.map(v=>new THREE.Vector2(v.x,v.z)),ix=THREE.ShapeUtils.triangulateShape(p,[]);for(const t of ix)face(kind,component,t.map(i=>[p[i].x,y,p[i].y]),color);};
  const linePoints=(row)=>row.coordinates.map(p=>project(...p));
  function walk(points,spacing,fn){let next=0,travel=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<.001)continue;for(;next<travel+l;next+=spacing){const t=(next-travel)/l;if(t<0)continue;fn({x:a.x+dx*t,z:a.z+dz*t},{x:dx/l,z:dz/l},next);}travel+=l;}return travel;}

  const pavement=contextData.pavementMesh;
  if(pavement){const lift=pavement.surfaceLiftM??.035,vertices=pavement.vertices.map(([x,z])=>[x,ground(x,z)+lift,z]);for(const part of pavement.groups){const array=[];for(const ix of part.indices)array.push(...vertices[ix]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(array,3));g.computeVertexNormals();const road=part.component==='horno-road',yard=part.component==='horno-yard';add(road?'asphalt':yard?'gravel':'paving','horno-entorno',g,road?'#828680':yard?'#b8ac93':'#c9c2af');for(let i=0;i<part.indices.length;i+=3){const p=part.indices.slice(i,i+3).map(ix=>vertices[ix]);qa.groundSamples.push({kind:part.component,x:p.reduce((s,v)=>s+v[0]/3,0),z:p.reduce((s,v)=>s+v[2]/3,0)});}}}
  const roadPolygons=(contextData.surfaces||[]).filter(r=>r.component==='horno-road').map(r=>({outer:linePoints(r),holes:(r.holes||[]).map(p=>p.map(q=>project(...q)))}));
  const isRoad=(x,z)=>roadPolygons.some(r=>pointInPolygon(x,z,r.outer)&&!r.holes.some(h=>pointInPolygon(x,z,h)));
  // Inferred lane paint stays inside the source-aligned carriageways.
  for(const road of contextData.roads||[]){if(road.kind!=='residential')continue;walk(linePoints(road),7,(p,d)=>{if(!isRoad(p.x,p.z))return;const n={x:-d.z*.055,z:d.x*.055},a={x:p.x-d.x*1.05,z:p.z-d.z*1.05},b={x:p.x+d.x*1.05,z:p.z+d.z*1.05};if(!isRoad(a.x,a.z)||!isRoad(b.x,b.z))return;face('road-paint','horno-entorno',[[a.x+n.x,ground(a.x+n.x,a.z+n.z)+.052,a.z+n.z],[b.x+n.x,ground(b.x+n.x,b.z+n.z)+.052,b.z+n.z],[b.x-n.x,ground(b.x-n.x,b.z-n.z)+.052,b.z-n.z],[a.x-n.x,ground(a.x-n.x,a.z-n.z)+.052,a.z-n.z]],'#deddd0');});}
  for(const row of contextData.curbLines||[]){const p=linePoints(row);walk(p,.75,(q,d)=>box('concrete','horno-entorno',q.x,ground(q.x,q.z)+.11,q.z,.72,row.heightM||.14,row.widthM||.16,-Math.atan2(d.z,d.x),'#bab9a9'));}

  for(const row of contextData.retainingWalls||[]){const points=linePoints(row);let count=0;walk(points,.72,(p,d)=>{const top=baseY+1.12,bottom=Math.min(ground(p.x,p.z)-.08,baseY-.08),h=Math.max(.32,top-bottom),courses=Math.ceil(h/.29);for(let i=0;i<courses;i++){box('concrete','horno-entorno',p.x,lerp(bottom,top,(i+.5)/courses),p.z,.68,h/courses-.018,row.widthM||.42,-Math.atan2(d.z,d.x),['#aaa795','#b8b29e','#c3bca8'][i%3]);}count++;});qa.retainingWall={segments:count,datumM:baseY,note:'Photo-guided recovered-sleeper retaining edge; visual, not surveyed, height.'};}
  for(const row of contextData.fences||[]){const points=linePoints(row);let posts=0;const length=walk(points,row.postSpacingM||.2,(p,d)=>{const foot=Math.max(ground(p.x,p.z),baseY+1.1),h=row.heightM||1.36;box('rust-steel','horno-entorno',p.x,foot+h/2,p.z,.075,h,.115,-Math.atan2(d.z,d.x),'#625748');posts++;});qa.fences.push({id:row.id,posts,lengthM:length,openEnds:true});}
  for(const row of contextData.railAlignments||[]){const points=linePoints(row),gauge=row.gaugeM||1.668;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],l=Math.hypot(b.x-a.x,b.z-a.z),dx=(b.x-a.x)/l,dz=(b.z-a.z)/l,steps=Math.ceil(l/1.1);if(!Number.isFinite(dx))continue;for(const side of [-1,1])for(let j=0;j<steps;j++){const A={x:lerp(a.x,b.x,j/steps)-dz*gauge*.5*side,z:lerp(a.z,b.z,j/steps)+dx*gauge*.5*side},B={x:lerp(a.x,b.x,(j+1)/steps)-dz*gauge*.5*side,z:lerp(a.z,b.z,(j+1)/steps)+dx*gauge*.5*side};beam('track','horno-entorno',[A.x,ground(A.x,A.z)+.115,A.z],[B.x,ground(B.x,B.z)+.115,B.z],.07,.065,'#63675d');}}
   const length=walk(points,.66,(p,d)=>box('sleepers','horno-entorno',p.x,ground(p.x,p.z)+.06,p.z,.16,.09,gauge+.36,-Math.atan2(d.z,d.x),'#827967'));qa.railways.push({id:row.id,lengthM:length,gaugeM:gauge,dimensionsInterpretive:true});}

  // Five surrounding industrial parts follow Catastro exactly. Their roofs use
  // the existing MDSnE estimates or the documented one-storey fallback.
  for(const row of contextData.buildings||[]){const p=planRing(row.coordinates,project),n=p.length,centroid=p.reduce((a,v)=>({x:a.x+v.x/n,z:a.z+v.z/n}),{x:0,z:0}),floor=ground(centroid.x,centroid.z),h=row.displayHeightM||3,roofY=floor+h;
   flat('industrial-concrete','horno-entorno',p,floor+.06,'#b7afa0');
   for(let i=0;i<n;i++){const a=p[i],b=p[(i+1)%n],l=Math.hypot(b.x-a.x,b.z-a.z),low=Math.min(ground(a.x,a.z),ground(b.x,b.z),floor)-.25;face('industrial-concrete','horno-entorno',[[a.x,low,a.z],[b.x,low,b.z],[b.x,roofY,b.z],[a.x,roofY,a.z]],'#c7c2b0');beam('industrial-trim','horno-entorno',[a.x,roofY+.04,a.z],[b.x,roofY+.04,b.z],.14,.14,'#aeb4a7');if(l>7){const yaw=-Math.atan2(b.z-a.z,b.x-a.x),mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2},normal={x:(b.z-a.z)/l,z:-(b.x-a.x)/l},gateW=Math.min(l*.3,4.3),gateH=Math.min(h-.6,3.4);box('industrial-door','horno-entorno',mid.x+normal.x*.025,floor+gateH/2+.07,mid.z+normal.z*.025,gateW,gateH,.055,yaw,'#909a91');for(let k=1;k<Math.ceil(gateH/.28);k++)beam('industrial-trim','horno-entorno',[mid.x-gateW*.49*Math.cos(yaw)+normal.x*.06,floor+k*.28,mid.z+gateW*.49*Math.sin(yaw)+normal.z*.06],[mid.x+gateW*.49*Math.cos(yaw)+normal.x*.06,floor+k*.28,mid.z-gateW*.49*Math.sin(yaw)+normal.z*.06],.016,.016,'#6b766d');}}
   if(row.roofForm==='shallow-pitched'&&n===4){const a=p[0],b=p[1],c=p[2],d=p[3],r1={x:(a.x+d.x)/2,z:(a.z+d.z)/2},r2={x:(b.x+c.x)/2,z:(b.z+c.z)/2},rise=1.15;face('industrial-roof','horno-entorno',[[a.x,roofY,a.z],[b.x,roofY,b.z],[r2.x,roofY+rise,r2.z],[r1.x,roofY+rise,r1.z]],row.roofColor||'#b4b8ad');face('industrial-roof','horno-entorno',[[r1.x,roofY+rise,r1.z],[r2.x,roofY+rise,r2.z],[c.x,roofY,c.z],[d.x,roofY,d.z]],row.roofColor||'#b4b8ad');face('industrial-concrete','horno-entorno',[[a.x,roofY,a.z],[r1.x,roofY+rise,r1.z],[d.x,roofY,d.z]],'#c7c2b0');face('industrial-concrete','horno-entorno',[[b.x,roofY,b.z],[c.x,roofY,c.z],[r2.x,roofY+rise,r2.z]],'#c7c2b0');const length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.ceil(length/1.1);for(let k=0;k<=steps;k++){const t=k/steps,A={x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)},B={x:lerp(d.x,c.x,t),z:lerp(d.z,c.z,t)},R={x:(A.x+B.x)/2,z:(A.z+B.z)/2};beam('industrial-trim','horno-entorno',[A.x,roofY+.025,A.z],[R.x,roofY+rise+.025,R.z],.025,.025,'#b6baaf');beam('industrial-trim','horno-entorno',[R.x,roofY+rise+.025,R.z],[B.x,roofY+.025,B.z],.025,.025,'#b6baaf');}}
   else flat('industrial-roof','horno-entorno',p,roofY+.05,row.roofColor||'#bec0b3');
   qa.buildingParts.push({id:row.id,parentId:row.parentId,heightM:h,sourceFootprintPreserved:true,interpretedFacade:true});
  }

  const pavilion=contextData.pavilion;
  if(pavilion){
   const main=planRing(pavilion.mainCoordinates,project),northMid={x:(main[0].x+main[1].x)/2,z:(main[0].z+main[1].z)/2},southMid={x:(main[2].x+main[3].x)/2,z:(main[2].z+main[3].z)/2},length=Math.hypot(southMid.x-northMid.x,southMid.z-northMid.z),axis={x:(southMid.x-northMid.x)/length,z:(southMid.z-northMid.z)/length};
   const mainT=p=>Math.max(0,Math.min(1,((p.x-northMid.x)*axis.x+(p.z-northMid.z)*axis.z)/length));
   const floorAt=p=>baseY+lerp(pavilion.mainFloorNorthM,pavilion.mainFloorSouthM,mainT(p)),roofAt=p=>baseY+lerp(pavilion.mainRoofNorthM,pavilion.mainRoofSouthM,mainT(p));
   // Modular ventilated grey skin. Real gaps and dark diagonal seams make the
   // inclined envelope legible without photographs masquerading as geometry.
   function panelWall(a,b,lowA,lowB,highA,highB,component,opening=null){const l=Math.hypot(b.x-a.x,b.z-a.z),cols=Math.max(1,Math.ceil(l/1.6)),rows=Math.max(1,Math.ceil(Math.max(highA-lowA,highB-lowB)/.85));for(let x=0;x<cols;x++)for(let y=0;y<rows;y++){const t0=(x+.012)/cols,t1=(x+.988)/cols,v0=(y+.018)/rows,v1=(y+.982)/rows,P=(t,v)=>[lerp(a.x,b.x,t),lerp(lerp(lowA,lowB,t),lerp(highA,highB,t),v),lerp(a.z,b.z,t)],m=P((t0+t1)/2,(v0+v1)/2);if(opening&&opening((t0+t1)/2,m[1]))continue;const q=[P(t0,v0),P(t1,v0),P(t1,v1),P(t0,v1)];face('pavilion-panel',component,q,['#b8bcb6','#c3c5bd','#b4b9b1','#c8c9bf'][(x+y)%4]);beam('panel-seam',component,q[0],q[2],.011,.011,'#6e756b');for(const point of [q[0],q[2]]){const g=new THREE.IcosahedronGeometry(.028,0);g.translate(point[0],point[1],point[2]);add('panel-bolts',component,g,'#747c72');}}}
   for(let i=0;i<4;i++){const a=main[i],b=main[(i+1)%4];panelWall(a,b,floorAt(a),floorAt(b),roofAt(a),roofAt(b),'horno-entorno',i===3?(t,y)=>t>.24&&t<.47&&y>baseY+2.8&&y<baseY+5.6:null);beam('pavilion-frame','horno-entorno',[a.x,floorAt(a),a.z],[b.x,floorAt(b),b.z],.18,.18,'#7e8b80');}
   face('pavilion-panel','horno-entorno',main.map(p=>[p.x,roofAt(p),p.z]),'#c4c7bd');face('pavilion-floor','horno-entorno',main.map(p=>[p.x,floorAt(p),p.z]),'#9fa99d');
   for(let i=1;i<15;i++){const t=i/15,A={x:lerp(main[0].x,main[3].x,t),z:lerp(main[0].z,main[3].z,t)},B={x:lerp(main[1].x,main[2].x,t),z:lerp(main[1].z,main[2].z,t)};beam('panel-seam','horno-entorno',[A.x,roofAt(A)+.015,A.z],[B.x,roofAt(B)+.015,B.z],.014,.014,'#7e857a');}
   // Visible supports preserve the cantilever, rather than filling it with an
   // invented massive building down to the ground.
   for(const t of [.62,.86])for(const side of [.18,.82]){const left={x:lerp(main[0].x,main[3].x,t),z:lerp(main[0].z,main[3].z,t)},right={x:lerp(main[1].x,main[2].x,t),z:lerp(main[1].z,main[2].z,t)},p={x:lerp(left.x,right.x,side),z:lerp(left.z,right.z,side)},low=ground(p.x,p.z)-.12,top=floorAt(p);box('pavilion-frame','horno-entorno',p.x,(top+low)/2,p.z,.24,Math.max(.3,top-low),.24,0,'#7f8b7f');}
   const corridor=planRing(pavilion.corridorCoordinates,project),start={x:(corridor[1].x+corridor[2].x)/2,z:(corridor[1].z+corridor[2].z)/2},end={x:anchor.x+7.4,z:anchor.z-3.2},dx=end.x-start.x,dz=end.z-start.z,L=Math.hypot(dx,dz),dir={x:dx/L,z:dz/L},side={x:dir.z,z:-dir.x},width=Math.hypot(corridor[2].x-corridor[1].x,corridor[2].z-corridor[1].z);
   const point=(t,u)=>({x:lerp(start.x,end.x,t)+side.x*u,z:lerp(start.z,end.z,t)+side.z*u}),rampY=t=>baseY+lerp(pavilion.corridorFloorNorthM,pavilion.corridorFloorSouthM,t),head=pavilion.corridorHeadroomM||2.4;
   const a=point(0,-1.3),b=point(0,1.3),c=point(1,1.3),d=point(1,-1.3),metalDeckLift=.03;face('pavilion-floor','horno-acceso',[[a.x,rampY(0)+metalDeckLift,a.z],[b.x,rampY(0)+metalDeckLift,b.z],[c.x,rampY(1)+metalDeckLift,c.z],[d.x,rampY(1)+metalDeckLift,d.z]],'#98a398');
   for(const u of [-1.3,1.3]){const A=point(0,u),B=point(1,u);face('pavilion-floor','horno-acceso',[[A.x,rampY(0),A.z],[B.x,rampY(1),B.z],[B.x,rampY(1)+.72,B.z],[A.x,rampY(0)+.72,A.z]],'#87968a');beam('pavilion-frame','horno-acceso',[A.x,rampY(0)+1.02,A.z],[B.x,rampY(1)+1.02,B.z],.055,.055,'#637c70');}
   const ribs=Math.ceil(L/1.65);for(let i=0;i<=ribs;i++){const t=i/ribs,A=point(t,-width/2),B=point(t,width/2),y=rampY(t),top=y+head;beam('pavilion-frame','horno-acceso',[A.x,y-.14,A.z],[A.x,top,A.z],.095,.095,'#9aa69b');beam('pavilion-frame','horno-acceso',[B.x,y-.14,B.z],[B.x,top,B.z],.095,.095,'#9aa69b');beam('pavilion-frame','horno-acceso',[A.x,top,A.z],[B.x,top,B.z],.095,.095,'#9aa69b');if(i<ribs){const t1=(i+.96)/ribs,C=point(t1,width/2),D=point(t1,-width/2);face('pavilion-panel','horno-acceso',[[A.x,top+.015,A.z],[B.x,top+.015,B.z],[C.x,rampY(t1)+head+.015,C.z],[D.x,rampY(t1)+head+.015,D.z]],'#bec5b9');}}
   for(const u of [-width/2,width/2]){const A=point(0,u),B=point(1,u);panelWall(A,B,rampY(0)+.22,rampY(1)+.22,rampY(0)+head,rampY(1)+head,'horno-acceso');}
   // Open end and real bridge connection to the raised visitor platform.
   const portal={x:anchor.x+pavilion.portalWorldOffset[0],z:anchor.z+pavilion.portalWorldOffset[1]},vx=portal.x-end.x,vz=portal.z-end.z,vl=Math.hypot(vx,vz),nx=-vz/vl,nz=vx/vl,py=baseY+pavilion.portalFloorM;
   face('pavilion-floor','horno-acceso',[[end.x+nx,py+metalDeckLift,end.z+nz],[portal.x+nx,py+metalDeckLift,portal.z+nz],[portal.x-nx,py+metalDeckLift,portal.z-nz],[end.x-nx,py+metalDeckLift,end.z-nz]],'#94a296');for(const s of [-1,1]){beam('pavilion-frame','horno-acceso',[end.x+nx*s,py+1.02,end.z+nz*s],[portal.x+nx*s,py+1.02,portal.z+nz*s],.055,.055,'#6b8276');for(let j=0;j<=4;j++){const t=j/4,x=lerp(end.x,portal.x,t)+nx*s,z=lerp(end.z,portal.z,t)+nz*s;beam('pavilion-frame','horno-acceso',[x,py,z],[x,py+1.02,z],.045,.045,'#6b8276');}}
   const original=pavilion.coordinates.map(p=>project(...p)),link=[original[4],original[5],original[10],original[11]],linkY=baseY+3.0;flat('pavilion-floor','horno-entorno',link,linkY,'#9ba79b');flat('pavilion-panel','horno-entorno',link,linkY+2.4,'#c2c8bc');
   qa.ramps.push({id:'horno-reception-covered-ramp',start:[start.x,rampY(0)+metalDeckLift,start.z],end:[end.x,rampY(1)+metalDeckLift,end.z],surfaceLiftM:metalDeckLift,openEnds:true,roofHeadroomM:head,sourceFootprint:'cat-8532501YJ3983S_part2-0'});
   qa.ramps.push({id:'horno-crisol-connection',start:[end.x,py+metalDeckLift,end.z],end:[portal.x,py+metalDeckLift,portal.z],widthM:2,floorOffsetM:pavilion.portalFloorM,surfaceLiftM:metalDeckLift,openPortal:true});
   qa.pavilion={mappedMainOutline:pavilion.mainCoordinates,mappedCorridorOutline:pavilion.corridorCoordinates,maximumRoofAboveFurnaceDatumM:Math.max(pavilion.mainRoofNorthM,pavilion.mainRoofSouthM,pavilion.corridorFloorSouthM+head),inclinedVolumes:2,cantileverPreserved:true,dimensionsInterpretive:true};
  }

  for(const[i,row]of(contextData.trees||[]).entries()){
   const p=project(...row.coordinate),base=ground(p.x,p.z),h=row.heightM,r=row.crownRadiusM;
   if(row.kind==='palm'){cylinder('wood','horno-entorno',p.x,base+h*.43,p.z,.15,.22,h*.86,'#92816a',10);for(let k=0;k<11;k++){const a=k*Math.PI*2/11+i*.4,rad=r*(.85+noise(i+k)*.2),start=[p.x,base+h*.87,p.z],middle=[p.x+Math.cos(a)*rad*.58,base+h*.97,p.z+Math.sin(a)*rad*.58],tip=[p.x+Math.cos(a)*rad,base+h*.76,p.z+Math.sin(a)*rad],side=.32;beam('wood','horno-entorno',start,middle,.045,.045,'#858263');face('foliage','horno-entorno',[start,[middle[0]-Math.sin(a)*side,middle[1],middle[2]+Math.cos(a)*side],tip,[middle[0]+Math.sin(a)*side,middle[1],middle[2]-Math.cos(a)*side]],['#74875d','#7e8c60','#657d51'][k%3]);}}
   else{cylinder('wood','horno-entorno',p.x,base+h*.34,p.z,.14,.24,h*.68,'#8b7b64',9);for(let k=0;k<5;k++){const a=k*2.399+i,spread=r*.37,g=new THREE.IcosahedronGeometry(1,2);g.scale(r*.72,h*.22,r*.72);g.rotateY(a);g.translate(p.x+Math.cos(a)*spread,base+h*.76+(noise(i+k)-.5)*h*.09,p.z+Math.sin(a)*spread);add('foliage','horno-entorno',g,['#75855b','#7d8d60','#8a9668','#697f50','#819060'][(i+k)%5]);}}
   qa.trees.push({id:row.id,coordinate:row.coordinate,baseM:base,heightM:h,photoPosition:true,dimensionsInterpretive:true});
  }
  for(const row of contextData.lamps||[]){const p=project(...row.coordinate),y=ground(p.x,p.z),h=row.heightM||5.1;cylinder('street-steel','horno-entorno',p.x,y+h/2,p.z,.035,.07,h,'#7a8377',8);beam('street-steel','horno-entorno',[p.x,y+h,p.z],[p.x+.55,y+h+.08,p.z],.05,.05,'#7a8377');box('lamp','horno-entorno',p.x+.58,y+h+.08,p.z,.42,.075,.18,0,'#d6d8bf');}
  for(const row of contextData.displayArtifacts||[]){const p=project(...row.coordinate),y=ground(p.x,p.z);box('concrete','horno-entorno',p.x,y+.12,p.z,4,.18,2.2,.12,'#bfb5a1');const g=new THREE.CylinderGeometry(.74,.9,1.85,16);g.rotateZ(Math.PI/2);g.rotateY(-.3);g.translate(p.x,y+.98,p.z);add('rust-steel','horno-entorno',g,'#94724e');beam('rust-steel','horno-entorno',[p.x+.1,y+1.2,p.z],[p.x+.6,y+2.2,p.z+.25],.22,.25,'#94724e');const wheel=new THREE.TorusGeometry(.62,.11,8,24);wheel.rotateY(.6);wheel.translate(p.x+1.4,y+.82,p.z-.3);add('rust-steel','horno-entorno',wheel,'#92714e');}

  for(const[key,parts]of batches){const[kind,component]=key.split('|'),geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const map=maps[kind]||(['industrial-concrete','pavilion-panel'].includes(kind)?maps.concrete:null),metal=['pavilion-frame','track','panel-seam','panel-bolts','street-steel','industrial-trim','industrial-door','rust-steel'].includes(kind),material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,map,bumpMap:map,bumpScale:['gravel','concrete'].includes(kind)?.018:.005,roughness:metal?.73:1,metalness:metal?.25:0,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);mesh.name='Horno · entorno · '+kind+' · '+component;mesh.castShadow=!['asphalt','paving','gravel','road-paint'].includes(kind);mesh.receiveShadow=true;
   mesh.userData={hornoContext:true,component,period:'conjunto',readingLayer:'conjunto',materialKind:kind,baseColor:material.color.clone(),baseMap:map,interpretive:true};
   (['asphalt','paving','gravel','road-paint'].includes(kind)?surfaces:['wood','foliage'].includes(kind)?vegetation:kind.startsWith('industrial')||kind.startsWith('pavilion')||kind.startsWith('panel')?architecture:details).add(mesh);resources.geometries.push(geometry);resources.materials.push(material);
  }
  updateFocuses();style();group.updateMatrixWorld(true);bounds.setFromObject(group);stats.meshes=resources.geometries.length;stats.triangles=resources.geometries.reduce((s,g)=>s+g.attributes.position.count/3,0);stats.fixedFurnaceDatumM=baseY;
 }
 function updateFocuses(){for(const[id,row]of Object.entries(contextData.focusSpecs||{})){const p=project(...row.targetCoordinates),target=new THREE.Vector3(p.x,baseY+(row.targetHeight||1),p.z),offsets=[row.far,row.near].map(v=>[v[0],Math.max(v[1],ground(p.x+v[0],p.z+v[2])+2.5-target.y),v[2]]),radius=row.radius||35;focuses[id]={id,label:row.label,coordinate:row.targetCoordinates,coordinates:row.targetCoordinates,target,offset:offsets[0],closeOffset:offsets[1],bounds:new THREE.Box3(new THREE.Vector3(p.x-radius,baseY-1,p.z-radius),new THREE.Vector3(p.x+radius,baseY+65,p.z+radius)),components:[id,'horno-recepcion'],elevation:row.targetHeight||1,localTarget:[(p.x-anchor.x)*Math.cos(Math.PI*5/6)-(p.z-anchor.z)*Math.sin(Math.PI*5/6),row.targetHeight||1,(p.x-anchor.x)*Math.sin(Math.PI*5/6)+(p.z-anchor.z)*Math.cos(Math.PI*5/6)],floor:0,readingLayer:'conjunto',kind:'context',fitBounds:false,fov:row.fov||56,minDistance:5,sourceConfidence:'Current mapped industrial surroundings; unmeasured details are interpreted.'};}}
 function style(){group.traverse(mesh=>{if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=readingMode==='periods',map=periods?null:d.baseMap;if(m.map!==map||m.bumpMap!==map){m.map=m.bumpMap=map;m.needsUpdate=true;}if(m.vertexColors===periods){m.vertexColors=!periods;m.needsUpdate=true;}m.color.copy(d.baseColor);if(periods)m.color.set(palette.conjunto||'#8ebbc2');const active=selected===d.component||(selected==='horno-entorno'&&d.component==='horno-recepcion');m.emissive.set(active?'#344936':'#000000');m.emissiveIntensity=active?.09:0;});}
 function bindGround(fn){if(disposed||typeof fn!=='function')return api;ground=fn;build();return api;}
 function selectFocus(id){selected=id||null;style();return focuses[id]||null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';style();return readingMode;}
 function dispose(){if(disposed)return;disposed=true;clear();for(const t of resources.textures)t.dispose();resources.textures.length=0;group.clear();}
 const api={group,vegetation,patches,exclusions,vegetationExclusions,excludedBuildingIds,excludedRoadIds,collisionPolygons,focuses,bounds,plan,stats,qa,ownedResources:resources,bindGround,selectFocus,setReadingMode,dispose,getState:()=>({selected,readingMode,datumM:baseY})};
 group.userData={id:'horno-context',coordinateSystem:'Global atlas x/z metres',ownedResources:resources,stats};build();return api;
}
