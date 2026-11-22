import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {pointInPolygon} from './urban-surface.js';

const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const noise=n=>{const x=Math.sin(n*127.17+61.4)*43758.5453;return x-Math.floor(x);};
const lerp=(a,b,t)=>a+(b-a)*t;
const ring=(coords,project)=>{const p=coords.map(q=>project(...q));if(p.length>1&&Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<1e-4)p.pop();return p;};
const distanceToSegment=(x,z,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l)):0;return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);};
function texture(kind){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
 x.fillStyle=kind==='grass'?'#a3b18b':kind==='gravel'?'#d5cbb8':kind==='tile'?'#d9d3c5':'#e2d9c5';x.fillRect(0,0,128,128);
 for(let i=0;i<3200;i++){const v=Math.round(100+noise(i)*135);x.fillStyle=`rgba(${v},${v},${Math.round(v*.92)},${kind==='grass'?.24:.17})`;x.fillRect(noise(i+30)*128,noise(i+70)*128,kind==='grass'?.7:1.1,kind==='grass'?2:.9);}
 if(kind==='tile'){x.strokeStyle='rgba(108,103,87,.24)';x.lineWidth=.6;for(let k=0;k<=128;k+=32){x.beginPath();x.moveTo(k,0);x.lineTo(k,128);x.moveTo(0,k);x.lineTo(128,k);x.stroke();}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.name='Casino · material procedural '+kind;return t;
}

/** Formal garden documented by UV and historic Casino photographs, registered
 * on the retained PNOA. Neighbouring architecture and streets remain with their
 * existing owners. Global coordinates allow exact terrain and map alignment.
 */
export function createCasinoContext({contextData={},visitData={},project=projectDefault,heightAt=()=>0}={}){
 const coordinate=contextData.coordinate||[-.22260667,39.65925],anchor=project(...coordinate),datum=heightAt(anchor.x,anchor.z),yaw=contextData.yaw||0;
 const group=new THREE.Group(),surfaces=new THREE.Group(),details=new THREE.Group(),vegetation=new THREE.Group();
 group.name='Casino · jardín histórico y contexto';surfaces.name='Casino · islas y pista';details.name='Casino · pérgola, cierre y mobiliario';vegetation.name='Casino · palmeras y arbolado';group.add(surfaces,details,vegetation);
 const resources={geometries:[],materials:[],textures:[]},maps={grass:texture('grass'),gravel:texture('gravel'),tile:texture('tile'),stone:texture('stone')};resources.textures.push(...Object.values(maps));
 const exclusions=(contextData.genericStreetExclusions||[]).map(p=>p.coordinates.map(q=>project(...q))),vegetationExclusions=(contextData.vegetationExclusions||[]).map(p=>p.coordinates.map(q=>project(...q))),excludedBuildingIds=new Set(contextData.excludedBuildingIds||[]),excludedRoadIds=new Set(contextData.excludedRoadIds||[]),collisionPolygons=(contextData.collisionPolygons||[]).map(p=>p.coordinates.map(q=>project(...q))),patches=[];
 const palette=Object.fromEntries((visitData.readingLegend||[]).map(p=>[p.id,p.color])),focuses={},bounds=new THREE.Box3(),stats={...contextData.stats},qa={groundSamples:[],trees:[],walls:[],stages:[],skippedTinyTriangles:0,sourceKeys:(contextData.sources||[]).map(s=>s.id)};
 const plan={outline:contextData.districtOutline||[],components:[]};
 for(const p of contextData.surfaces||[])plan.components.push({...p,kind:p.component==='casino-dancefloor'?'floor':p.component==='casino-lawn'||p.component==='casino-peripheral-planting'?'garden':'path',component:p.component==='casino-dancefloor'?'casino-pista':'casino-jardin',period:'jardines',floor:null});
 for(const p of contextData.paths||[])plan.components.push({...p,kind:'path',geometryType:'LineString',width:p.widthM,period:'jardines',component:'casino-jardin',floor:null});
 for(const p of contextData.walls||[])plan.components.push({...p,kind:'boundary',geometryType:'LineString',width:p.thicknessM,period:p.component==='casino-taquilla'?'memoria':'jardines',component:p.component,floor:null});
 for(const p of contextData.trees||[])plan.components.push({id:p.id,kind:'tree',coordinate:p.coordinate,coordinates:[p.coordinate],treeKind:p.kind,radius:p.crownRadiusM,period:'jardines',component:'casino-arbolado',floor:null});
 for(const p of contextData.benches||[])plan.components.push({id:p.id,kind:'furniture',coordinate:p.coordinate,coordinates:[p.coordinate],radius:1,period:'jardines',component:'casino-jardin',floor:null});
 if(contextData.stage)plan.components.push({...contextData.stage,kind:'stage',period:'jardines',component:'casino-escenario',floor:null});
 if(contextData.ticketWindow)plan.components.push({...contextData.ticketWindow,coordinates:[contextData.ticketWindow.coordinate],kind:'ticket-window',period:'memoria',component:'casino-taquilla',floor:null});
 for(const p of contextData.sharedContext?.buildings||[])plan.components.push({...p,id:'casino-shared-'+p.id,kind:'context-building',period:'memoria',component:'casino-entorno',floor:null});
 let ground=heightAt,selected=null,readingMode='materials',disposed=false;
 const architecture=(contextData.sharedContext?.architectureEnvelopes||contextData.architectureExclusions||[]).map(p=>({outer:ring(p.coordinates,project),holes:(p.holes||[]).map(h=>ring(h,project))}));
 const insideBuilding=(x,z)=>architecture.some(p=>pointInPolygon(x,z,p.outer)&&!p.holes.some(h=>pointInPolygon(x,z,h)));
 const clearance=(x,z)=>insideBuilding(x,z)?0:architecture.reduce((best,p)=>[p.outer,...p.holes].reduce((best,r)=>r.reduce((d,a,i)=>Math.min(d,distanceToSegment(x,z,a,r[(i+1)%r.length])),best),best),Infinity);
 const cameraReserves=(contextData.cameraReserves||[]).map(p=>ring(p.coordinates,project));
 const cameraClearance=(x,z)=>cameraReserves.reduce((best,p)=>pointInPolygon(x,z,p)?0:p.reduce((d,a,i)=>Math.min(d,distanceToSegment(x,z,a,p[(i+1)%p.length])),best),Infinity);
 function clear(){for(const g of resources.geometries)g.dispose();for(const m of resources.materials)m.dispose();resources.geometries.length=resources.materials.length=0;surfaces.clear();details.clear();vegetation.clear();for(const key of ['groundSamples','trees','walls','stages'])qa[key].length=0;qa.skippedTinyTriangles=0;}
 function build(){
  clear();const batches=new Map();
  const add=(kind,g,color,component='casino-jardin',period='jardines')=>{
   let geometry=g.index?g.toNonIndexed():g.clone();g.dispose();const p=geometry.attributes.position,keep=[];let dropped=0;
   // Atlas positions use Float32 attributes; discard source/grid slivers which
   // collapse at that precision before normals are calculated.
   for(let i=0;i<p.count;i+=3){const ax=p.getX(i),ay=p.getY(i),az=p.getZ(i),bx=p.getX(i+1)-ax,by=p.getY(i+1)-ay,bz=p.getZ(i+1)-az,cx=p.getX(i+2)-ax,cy=p.getY(i+2)-ay,cz=p.getZ(i+2)-az;if((by*cz-bz*cy)**2+(bz*cx-bx*cz)**2+(bx*cy-by*cx)**2<1e-13){dropped++;continue;}for(let j=0;j<3;j++)keep.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));}
   if(dropped){geometry.dispose();geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(keep,3));qa.skippedTinyTriangles+=dropped;}
   if(!geometry.attributes.position.count){geometry.dispose();return;}
   geometry.computeVertexNormals();const c=new THREE.Color(color),colors=[],uv=[],pos=geometry.attributes.position;
   for(let i=0;i<pos.count;i++){const v=.985+noise(i+pos.count)*.03;colors.push(c.r*v,c.g*v,c.b*v);uv.push(pos.getX(i)/2,pos.getZ(i)/2);}
   geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const key=[kind,component,period].join('|');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geometry);
  };
  const box=(kind,x,y,z,w,h,d,angle,color,component='casino-jardin',period='jardines')=>{if(w<=0||h<=0||d<=0)return;const g=new THREE.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);add(kind,g,color,component,period);};
  const beam=(kind,a,b,w,d,color,component='casino-jardin',period='jardines')=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A),length=v.length();if(length<.002)return;const g=new THREE.BoxGeometry(w,length,d);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());add(kind,g,color,component,period);};
  const cylinder=(kind,p,h,r1,r2,height,color,n=12,component='casino-jardin',period='jardines')=>{const g=new THREE.CylinderGeometry(r1,r2,height,n);g.translate(p.x,h,p.z);add(kind,g,color,component,period);};
  const face=(kind,p,color,component='casino-jardin',period='jardines')=>{const a=[];for(let i=1;i<p.length-1;i++)a.push(...p[0],...p[i],...p[i+1]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));add(kind,g,color,component,period);};
  const flat=(kind,outer,holes,y,color,component='casino-jardin',period='jardines')=>{const all=[outer,...holes].flat(),idx=THREE.ShapeUtils.triangulateShape(outer.map(p=>new THREE.Vector2(p.x,p.z)),holes.map(r=>r.map(p=>new THREE.Vector2(p.x,p.z)))),a=[];for(const t of idx)for(const i of t)a.push(all[i].x,y,all[i].z);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));add(kind,g,color,component,period);};
  const walk=(points,spacing,fn)=>{let next=0,travel=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.002)continue;for(;next<travel+length;next+=spacing){const t=(next-travel)/length;if(t>=0)fn({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)},{x:dx/length,z:dz/length},next);}travel+=length;}return travel;};
  const mesh=contextData.pavementMesh;
  if(mesh){const lift=mesh.surfaceLiftM??.041,verts=mesh.vertices.map(([x,z])=>[x,ground(x,z)+lift,z]);for(const part of mesh.groups){const a=[];for(const i of part.indices)a.push(...verts[i]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));const lawn=part.component==='casino-lawn',dance=part.component==='casino-dancefloor',peripheral=part.component==='casino-peripheral-planting';add(lawn?'grass':dance?'tile':'gravel',g,lawn?'#81936b':dance?'#d2c6ad':peripheral?'#a49a7c':'#c1b299',dance?'casino-pista':'casino-jardin');for(let i=0;i<part.indices.length;i+=3){const points=part.indices.slice(i,i+3).map(k=>verts[k]);qa.groundSamples.push({kind:part.component,x:points.reduce((v,p)=>v+p[0]/3,0),z:points.reduce((v,p)=>v+p[2]/3,0)});}}}
  // Ocre low edging is visible in the institution's historic garden photos.
  for(const island of contextData.islands||[]){const p=ring(island.coordinates,project);p.push(p[0]);walk(p,.6,(p,d)=>box('curb',p.x,ground(p.x,p.z)+.11,p.z,.58,.18,.17,-Math.atan2(d.z,d.x),'#d0b784'));}
  // Restrained inset paving pattern read in the orthophoto, clipped against the
  // actual dance-floor polygons and their openings.
  const danceRows=(contextData.surfaces||[]).filter(p=>p.component==='casino-dancefloor').map(p=>({outer:ring(p.coordinates,project),holes:(p.holes||[]).map(h=>ring(h,project))}));
  const onDance=(x,z)=>danceRows.some(p=>pointInPolygon(x,z,p.outer)&&!p.holes.some(h=>pointInPolygon(x,z,h)));
  if(danceRows.length){const pts=danceRows.flatMap(p=>p.outer),xs=pts.map(p=>p.x),zs=pts.map(p=>p.z),c=Math.cos(yaw),s=Math.sin(yaw);for(let x=Math.floor(Math.min(...xs)/2.8)*2.8;x<Math.max(...xs);x+=2.8)for(let z=Math.floor(Math.min(...zs)/2.8)*2.8;z<Math.max(...zs);z+=2.8){const corners=[[-.23,-.23],[.23,-.23],[.23,.23],[-.23,.23]].map(([a,b])=>({x:x+a*c+b*s,z:z-a*s+b*c}));if(corners.every(p=>onDance(p.x,p.z)))face('paving-inset',corners.map(p=>[p.x,ground(p.x,p.z)+.051,p.z]),'#a7a599','casino-pista');}}
  // Permeable historical street wall, with an actual opening for the ticket
  // window. The source confirms the feature but not its surveyed position.
  const ticket=contextData.ticketWindow?project(...contextData.ticketWindow.coordinate):null;
  for(const row of contextData.walls||[]){const points=ring(row.coordinates,project);let openings=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),direction={x:dx/length,z:dz/length},angle=-Math.atan2(dz,dx),period=row.component==='casino-taquilla'?'memoria':'jardines';let at=null;if(ticket&&row.component==='casino-taquilla'&&distanceToSegment(ticket.x,ticket.z,a,b)<.1)at=((ticket.x-a.x)*dx+(ticket.z-a.z)*dz)/length;
    const span=(from,to,bottom,height,kind,color)=>{if(to-from<.01||height<=0)return;const x=a.x+direction.x*(from+to)/2,z=a.z+direction.z*(from+to)/2;box(kind,x,ground(x,z)+bottom+height/2,z,to-from,height,row.thicknessM||.24,angle,color,row.component,period);};
    const h=row.heightM||1.9,half=(contextData.ticketWindow?.widthM||.85)/2;
    if(at!==null&&at>half&&at<length-half){openings++;const sill=contextData.ticketWindow.sillM,openH=contextData.ticketWindow.openingHeightM;span(0,at-half,0,h,'wall','#ded4bf');span(at+half,length,0,h,'wall','#ded4bf');span(at-half,at+half,0,sill,'wall','#ded4bf');span(at-half,at+half,sill+openH,h-sill-openH,'wall','#ded4bf');const tx=a.x+direction.x*at,tz=a.z+direction.z*at,ty=ground(tx,tz);box('stone',tx,ty+sill-.025,tz,half*2+.18,.1,.45,angle,'#b9aa90',row.component,period);for(const sign of [-1,1])box('stone',tx+direction.x*sign*(half+.055),ty+sill+openH/2,tz+direction.z*sign*(half+.055),.11,openH+.2,.32,angle,'#baa58a',row.component,period);box('stone',tx,ty+sill+openH+.055,tz,half*2+.22,.11,.32,angle,'#baa58a',row.component,period);for(let k=-1;k<=1;k++)box('metal',tx+direction.x*k*.2,ty+sill+openH/2,tz+direction.z*k*.2,.022,openH,.035,angle,'#56615b',row.component,period);}
    else span(0,length,0,h,'wall','#ded4bf');
    span(0,length,0,Math.min(.46,h),'wall-dado','#ad7962');span(0,length,h,.09,'stone','#e3d8c0');
   }qa.walls.push({id:row.id,openingCount:openings,groundConforming:true});}
  if(contextData.stage){
   let stageFront={};
   const row=contextData.stage,p=ring(row.coordinates,project),center=p.reduce((s,v)=>({x:s.x+v.x/p.length,z:s.z+v.z/p.length}),{x:0,z:0}),base=ground(center.x,center.z),deck=base+(row.heightM||.62),roof=base+(row.roofHeightM||3.8),component='casino-escenario';
   flat('stage-deck',p,[],deck,'#c8bca4',component);
   for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];face('stage-wall',[[a.x,ground(a.x,a.z),a.z],[b.x,ground(b.x,b.z),b.z],[b.x,deck,b.z],[a.x,deck,a.z]],'#ddd3bc',component);beam('stone',[a.x,deck+.035,a.z],[b.x,deck+.035,b.z],.12,.18,'#e2d9c1',component);}
   if(p.length===4){const target=project(...(contextData.focusSpecs?.['casino-pista']?.targetCoordinates||contextData.coordinate));
    const frontIndex=p.reduce((best,a,i)=>{const b=p[(i+1)%p.length],distance=Math.hypot((a.x+b.x)/2-target.x,(a.z+b.z)/2-target.z);return distance<best.distance?{index:i,distance}:best;},{index:0,distance:Infinity}).index;
    const ordered=p.slice(frontIndex).concat(p.slice(0,frontIndex));
    const [a,b,c,d]=ordered,frontVec={x:b.x-a.x,z:b.z-a.z},width=Math.hypot(frontVec.x,frontVec.z),nx=frontVec.x/width,nz=frontVec.z/width,frontMid={x:(a.x+b.x)/2,z:(a.z+b.z)/2},normal={x:frontMid.x-center.x,z:frontMid.z-center.z},nl=Math.hypot(normal.x,normal.z);normal.x/=nl;normal.z/=nl;
    const pos=(u,v,h)=>{const front={x:lerp(a.x,b.x,u),z:lerp(a.z,b.z,u)},back={x:lerp(d.x,c.x,u),z:lerp(d.z,c.z,u)};return [lerp(front.x,back.x,v),h,lerp(front.z,back.z,v)];};
    for(const u of [0,.5,1])for(const v of [0,1]){beam('stage-metal',pos(u,v,deck),pos(u,v,roof),.065,.065,'#c0c5bb',component);const P=pos(u,v,deck);box('stone',P[0],deck+.06,P[2],.19,.13,.19,0,'#d3cbb9',component);}
    for(const v of [0,1]){beam('stage-metal',pos(0,v,roof),pos(1,v,roof),.095,.10,'#bac3b9',component);beam('stage-metal',pos(0,v,roof-.35),pos(1,v,roof-.35),.05,.05,'#bac3b9',component);for(let k=0;k<8;k++){beam('stage-metal',pos(k/8,v,roof-.35),pos((k+1)/8,v,roof),.028,.028,'#c6ccc0',component);}}
    for(let k=0;k<=9;k++)beam('stage-metal',pos(k/9,0,roof+.03),pos(k/9,1,roof+.03),.055,.055,'#bec5bb',component);
    // Slim shade strips leave the pergola visibly light and open from above.
    for(let k=0;k<7;k++){const u=k/7,uu=(k+.68)/7;face('pergola-shade',[pos(u,0,roof+.07),pos(uu,0,roof+.07),pos(uu,1,roof+.07),pos(u,1,roof+.07)],'#dddccc',component);}
    for(let j=1;j<=4;j++){const u=j/5,mid=pos(u,0,base+.32),x=mid[0]+normal.x*.012,z=mid[2]+normal.z*.012;const star=[];for(let k=0;k<8;k++){const t=k*Math.PI/4,r=k%2?.075:.21;star.push([x+nx*Math.cos(t)*r,base+.32+Math.sin(t)*r,z+nz*Math.cos(t)*r]);}face('stage-blue',star,'#52738b',component);}
    // Place the small access stair at the left of the actual stage front,
    // descending toward the uncovered dance floor, independent of ring order.
    const edge={x:lerp(a.x,b.x,.18),z:lerp(a.z,b.z,.18)},turn=-Math.atan2(nz,nx);
    for(let k=0;k<4;k++){const step=4-k,x=edge.x+normal.x*(k*.24+.16),z=edge.z+normal.z*(k*.24+.16),h=step*.155;box('stone',x,base+h/2,z,1.35,h,.26,turn,'#cfc3aa',component);}
    stageFront={sourceEdgeIndex:frontIndex,edgeMidpoint:[frontMid.x,frontMid.z],outwardNormal:[normal.x,normal.z],target:[target.x,target.z],facingDancefloor:normal.x*(target.x-center.x)+normal.z*(target.z-center.z)>0,stairExit:[edge.x+normal.x*.88,edge.z+normal.z*.88],stairDescendsTowardDancefloor:normal.x*(target.x-center.x)+normal.z*(target.z-center.z)>0};
   }
   qa.stages.push({id:row.id,baseM:base,deckM:deck,roofM:roof,sourceFootprintPreserved:true,southernPlacement:true,dimensionsInterpretive:true,...stageFront});
  }
  for(const row of contextData.benches||[]){const p=project(...row.coordinate),y=ground(p.x,p.z),c=Math.cos(row.yaw),s=Math.sin(row.yaw),at=(x,h,z)=>[p.x+x*c+z*s,y+h,p.z-x*s+z*c];for(const x of [-.68,.68]){box('metal',...at(x,.26,0),.065,.52,.47,row.yaw,'#46687e');box('metal',...at(x,.7,-.22),.06,.75,.06,row.yaw,'#46687e');}for(let k=0;k<4;k++)box('bench-blue',...at(0,.50,-.18+k*.12),row.lengthM||1.9,.055,.10,row.yaw,'#4a7088');for(let k=0;k<3;k++)box('bench-blue',...at(0,.73+k*.12,-.23),row.lengthM||1.9,.09,.045,row.yaw,'#4a7088');}
  // The ornamental urn is visible in the oval planted island in the Casino's
  // own photos. Its dimensions and position within the island are interpreted.
  const oval=(contextData.islands||[]).find(p=>p.id.includes('oval'));
  if(oval){const p=ring(oval.coordinates,project),c=p.reduce((s,q)=>({x:s.x+q.x/p.length,z:s.z+q.z/p.length}),{x:0,z:0}),y=ground(c.x,c.z);cylinder('stone',c,y+.09,.34,.42,.18,'#c9c1a7',16);cylinder('stone',c,y+.36,.16,.28,.40,'#c9c1a7',16);const bowl=new THREE.SphereGeometry(.48,16,8,0,Math.PI*2,0,Math.PI*.70);bowl.scale(1,.8,1);bowl.translate(c.x,y+.75,c.z);add('stone',bowl,'#c9c1a7');for(let k=0;k<9;k++){const a=k*Math.PI*2/9;face('foliage',[[c.x,y+.97,c.z],[c.x+Math.cos(a)*.23,y+1.55,c.z+Math.sin(a)*.23],[c.x+Math.cos(a+.2)*.05,y+1.04,c.z+Math.sin(a+.2)*.05]],'#896f59');}}
  let adjusted=0,suppressed=0;
  for(const[i,row]of(contextData.trees||[]).entries()){
   const p=project(...row.coordinate),base=ground(p.x,p.z),h=row.heightM,buildingDistance=clearance(p.x,p.z),cameraDistance=cameraClearance(p.x,p.z),gap=.45,sourceR=row.crownRadiusM,r=Math.min(sourceR,Math.max(0,(buildingDistance-gap-.35)/1.25)),envelope=1.25*r+.35,planTree=plan.components.find(p=>p.id===row.id);
   if(planTree){planTree.sourceRadius=sourceR;planTree.radius=r>0?envelope:0;planTree.crownConstrainedByArchitecture=r<sourceR;}
   if(buildingDistance===0||r<.12){suppressed++;qa.trees.push({id:row.id,rendered:false,coordinate:row.coordinate,nearestBuildingDistanceM:buildingDistance});continue;}
   if(r<sourceR)adjusted++;const component='casino-arbolado';
   if(row.kind==='palm'){
    const tall=h>5.5,stem=h*.81,radius=tall?.20:.29;cylinder('trunk',p,base+stem/2,radius*.78,radius*1.15,stem,'#87745b',14,component);
    for(let k=0;k<Math.floor(stem/.28);k++){const g=new THREE.TorusGeometry(radius*(1.03-k*.004),.025,4,12);g.rotateX(Math.PI/2);g.translate(p.x,base+.25+k*.28,p.z);add('trunk-ring',g,'#a49476',component);}
    const centre=[p.x,base+stem,p.z];
    for(let k=0;k<17;k++){const a=k*Math.PI*2/17+i*.41,rad=r*(.84+noise(i*31+k)*.16),segments=[];for(let j=0;j<=6;j++){const t=j/6,reach=rad*t,y=base+stem+Math.sin(t*Math.PI)*h*.14-t*t*h*.17;segments.push([p.x+Math.cos(a)*reach,y,p.z+Math.sin(a)*reach]);}for(let j=1;j<segments.length;j++){beam('frond-stem',segments[j-1],segments[j],.027,.027,'#73805a',component);const t=j/6,leaf=Math.sin(t*Math.PI)*rad*.25+.055,A=segments[j-1],B=segments[j],normal=[-Math.sin(a),Math.cos(a)];for(const sign of [-1,1]){const tip=[A[0]+normal[0]*leaf*sign-Math.cos(a)*rad*.08,A[1]-.10,A[2]+normal[1]*leaf*sign-Math.sin(a)*rad*.08];face('foliage',[A,tip,B],['#6b8053','#809365','#71885a'][k%3],component);}}}
    cylinder('foliage',p,base+stem+.12,r*.11,r*.15,.55,'#697e4f',9,component);
   }else if(row.kind==='columnar'){
    cylinder('trunk',p,base+h*.32,.09,.18,h*.64,'#887b64',8,component);
    for(let k=0;k<4;k++){const g=new THREE.IcosahedronGeometry(1,2),radius=r*(.98-k*.12);g.scale(radius,h*.23,radius);g.rotateY(i+k*.62);g.translate(p.x,base+h*(.40+k*.15),p.z);add('foliage',g,['#566d48','#637a50','#5a7148'][k%3],component);}
   }else{
    cylinder('trunk',p,base+h*.31,.14,.25,h*.62,'#8e7d62',10,component);for(let k=0;k<4;k++){const a=k*2.399+i,dx=Math.cos(a)*r*.35,dz=Math.sin(a)*r*.35;beam('trunk',[p.x,base+h*.4,p.z],[p.x+dx,base+h*.70,p.z+dz],.085,.085,'#82745c',component);const g=new THREE.IcosahedronGeometry(1,2);g.scale(r*.77,h*.22,r*.77);g.rotateY(a);g.translate(p.x+dx,base+h*.73+(noise(i+k)-.5)*h*.08,p.z+dz);add('foliage',g,['#6c8057','#7b8d62','#657c52'][k%3],component);}}
   qa.trees.push({id:row.id,coordinate:row.coordinate,rendered:true,kind:row.kind,baseM:base,heightM:h,sourceCrownRadiusM:sourceR,displayCrownParameterM:r,maximumHorizontalRadiusM:envelope,nearestBuildingDistanceM:buildingDistance,cameraClearanceM:cameraDistance,requiredFacadeGapM:gap,photoPosition:true,dimensionsInterpretive:true});
  }
  stats.treeCrownsAdjusted=adjusted;stats.treeTrunksSuppressed=suppressed;
  for(const[key,parts]of batches){const[kind,component,period]=key.split('|'),geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();const map=kind==='grass'?maps.grass:kind==='gravel'?maps.gravel:['tile','stage-deck'].includes(kind)?maps.tile:['wall','curb','stone','stage-wall'].includes(kind)?maps.stone:null,metal=['metal','stage-metal','bench-blue'].includes(kind),material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,map,bumpMap:map,bumpScale:kind==='grass'?.008:kind==='gravel'?.018:.004,roughness:metal?.70:.96,metalness:metal?.18:0,side:THREE.DoubleSide}),m=new THREE.Mesh(geometry,material);m.name='Casino · contexto · '+kind+' · '+component;m.castShadow=!['grass','gravel','tile','paving-inset'].includes(kind);m.receiveShadow=true;m.userData={casinoContext:true,component,period,readingLayer:period,materialKind:kind,baseColor:material.color.clone(),baseMap:map,interpretive:true};(['grass','gravel','tile','paving-inset'].includes(kind)?surfaces:['trunk','trunk-ring','foliage','frond-stem'].includes(kind)?vegetation:details).add(m);resources.geometries.push(geometry);resources.materials.push(material);}
  updateFocuses();style();group.updateMatrixWorld(true);bounds.setFromObject(group);stats.meshes=resources.geometries.length;stats.triangles=resources.geometries.reduce((s,g)=>s+g.attributes.position.count/3,0);stats.skippedTinyTriangles=qa.skippedTinyTriangles;
 }
 function updateFocuses(){for(const[id,row]of Object.entries(contextData.focusSpecs||{})){const p=project(...row.targetCoordinates),target=new THREE.Vector3(p.x,ground(p.x,p.z)+(row.targetHeight||1),p.z),offsets=[row.far,row.near].map(v=>{let y=Math.max(v[1],ground(p.x+v[0],p.z+v[2])+2.5-target.y);for(const tree of qa.trees){if(!tree.rendered)continue;const t=project(...tree.coordinate);if(Math.hypot(p.x+v[0]-t.x,p.z+v[2]-t.z)<tree.maximumHorizontalRadiusM+.8)y=Math.max(y,tree.baseM+tree.heightM+1.2-target.y);}return[v[0],y,v[2]];}),radius=row.radius||50;focuses[id]={id,label:row.label,coordinate:row.targetCoordinates,coordinates:row.targetCoordinates,target,offset:offsets[0],closeOffset:offsets[1],bounds:new THREE.Box3(new THREE.Vector3(p.x-radius,datum-1,p.z-radius),new THREE.Vector3(p.x+radius,datum+35,p.z+radius)),components:[id],elevation:target.y-datum,localTarget:[(p.x-anchor.x)*Math.cos(yaw)-(p.z-anchor.z)*Math.sin(yaw),target.y-datum,(p.x-anchor.x)*Math.sin(yaw)+(p.z-anchor.z)*Math.cos(yaw)],floor:null,regionId:row.regionId||'jardines',readingLayer:row.regionId||'jardines',kind:'context',fitBounds:false,fov:row.fov||54,minDistance:4,sourceConfidence:'Historic Casino garden documented in primary sources; registered PNOA positions with interpreted dimensions and no assertion of completed 2026 works.'};}}
 function style(){group.traverse(m=>{if(!m.isMesh)return;const d=m.userData,mat=m.material,periods=readingMode==='periods',map=periods?null:d.baseMap;if(mat.map!==map||mat.bumpMap!==map){mat.map=mat.bumpMap=map;mat.needsUpdate=true;}if(mat.vertexColors===periods){mat.vertexColors=!periods;mat.needsUpdate=true;}mat.color.copy(d.baseColor);if(periods)mat.color.set(palette[d.period]||(d.period==='memoria'?'#d2a37f':'#95ae78'));const active=selected===d.component||(focuses[selected]&&focuses[selected].regionId===d.period);mat.emissive.set(active?'#3a4933':'#000000');mat.emissiveIntensity=active?.07:0;});}
 function bindGround(fn){if(disposed||typeof fn!=='function')return api;ground=fn;build();return api;}
 function selectFocus(id){selected=id||null;style();return focuses[id]||null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';style();return readingMode;}
 function dispose(){if(disposed)return;disposed=true;clear();for(const t of resources.textures)t.dispose();resources.textures.length=0;group.clear();}
 const api={group,vegetation,patches,exclusions,vegetationExclusions,excludedBuildingIds,excludedRoadIds,collisionPolygons,focuses,bounds,plan,stats,qa,ownedResources:resources,bindGround,selectFocus,setReadingMode,dispose,getState:()=>({selected,readingMode,datumM:datum})};group.userData={id:'casino-context',coordinateSystem:'Global atlas x/z metres',stats,ownedResources:resources};build();return api;
}
