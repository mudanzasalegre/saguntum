import * as THREE from 'three';

// Immediate setting of the theatre, in its registered local metre frame.
// These OSM traces are a compact extract of cartography.json (2026-11-19),
// rounded to centimetres after projection. This precision is storage only.
// Tree centres are visually registered canopy centres in the supplied PNOA
// mosaic; species, heights and crown volumes remain a photographic reading.
const TAU=Math.PI*2;
const SOURCE_FRAME={center:[-.27795671425,39.67686986465],yaw:-.5027};
const PATHS=[
 {id:'180732340',kind:'steps',width:1.45,points:[[-38.35,-29.43],[-38,-12.38],[-43.48,-11.25],[-42.99,-4.25],[-42.72,-.42],[-41.88,11.03]]},
 {id:'180732347',kind:'path',width:1.4,points:[[-34.02,-44.23],[-34.37,-35.19],[-38.21,-34.84],[-38.35,-29.43]]},
 {id:'180732352',kind:'path',width:1.6,points:[[-41.88,11.03],[-46.54,11.36],[-52.45,11.56],[-59.11,14.7],[-62.24,19.03],[-63.34,22.27],[-60.95,25.67],[-51.56,30.38],[-42.15,31.76],[-33.56,34.48],[-25.15,40.25]]},
 {id:'733053998',kind:'steps',width:1.45,points:[[-17.49,47.15],[-25.15,40.25]]},
 {id:'733058698',kind:'path',width:1.4,points:[[40.43,-30.45],[47.01,-19.83],[57.54,-5.44],[62.79,5.06],[60.23,14.47],[55.09,23.72],[54.09,28.64]]}
];
const WALLS=[
 {id:'1419279909',height:.8,width:.48,points:[[22.09,-73.86],[25.73,-70.14],[27.79,-65.32],[31.9,-56.05],[35.42,-48.43],[35.5,-44.07],[35.46,-37.31],[35.27,-32.81],[36.42,-32.61],[35.83,-28.77]]},
 {id:'1419279910',height:.68,width:.42,points:[[24.41,-76.82],[28.15,-74.72],[29.9,-71.27],[30.71,-69.41],[31.94,-66.58],[33.02,-64.07],[34.45,-60.75],[38.24,-53.28],[41.08,-47.33],[44.53,-40.05],[47.37,-33.94],[50.73,-27.16],[53.95,-20.75],[55.54,-17.47],[58.32,-12.62],[64,-2.03],[65.68,10.65],[63.55,13.91],[60.88,18.12],[57.25,23.67],[55.55,24.5]]},
 {id:'1419279911',height:.58,width:.45,points:[[53.04,25.38],[41.16,29.96],[37.71,31.55],[29.48,34.91],[23.77,37.1],[22.79,36.13],[18.89,38.23],[15.31,39.93],[9.2,41.84],[1.67,42.88],[-4.56,42.79],[-11.17,41.62],[-19.13,38.73],[-24.74,35.43]]}
];
// Road centre lines are clearance constraints only: createCity retains these.
const ADJACENT_ROADS=[
 {id:'163560117',width:3.2,points:[[64.71,-3.81],[69.66,4.22],[71.01,10.03],[68.68,17.31],[66.95,20.1],[66.25,23.28],[54.09,28.64],[49.14,31.47],[35.38,36.4],[27.23,38.7],[3.9,44.36],[-3.13,45.28],[-17.26,47.12],[-18.62,47.3],[-32.39,49.32],[-28.33,51.23],[-9.72,61.12],[6.01,63.18],[34.93,66.98],[80.38,64.82]]},
 {id:'82322788',width:3.2,points:[[22.31,-76.58],[26.44,-72.51],[35.08,-52.31],[40.48,-36.91],[40.43,-30.45],[41,-3.05]]},
 {id:'163560119',width:3.4,points:[[-20.69,-35.05],[-9.41,-34.72],[.65,-35.53],[.11,-43.01]]},
 {id:'1365045238',width:3.4,points:[[.11,-43.01],[-16.53,-43.48],[-24.16,-45.33]]},
 {id:'1365045237',width:3.2,points:[[29.67,-75.59],[32.88,-69.75],[35.51,-64.26],[38.94,-56.82],[42.96,-47.19],[46.32,-40.12],[58.2,-15.18],[64.71,-3.81]]}
];
// x, z, estimated height, maximum crown radius, crown form. Canopy centres
// trace visible crowns, not an OSM inventory of individual botanical specimens.
const CANOPIES=[
 [17.8,-65.7,8.8,4.4,'pine'],[17.28,-47.44,7.3,3.5,'pine'],
 [6.43,-47.47,6.9,3.2,'pine'],[23.64,-47.81,7.1,3.5,'pine'],
 [52.87,-1.39,7.6,3.7,'pine'],[61.5,1.85,7.2,3.3,'pine'],
 [78.68,9.23,8.4,3.8,'pine'],[-20.09,47,6.8,2.9,'pine'],
 [-8.66,47.56,6.4,2.6,'pine'],[2.84,55.5,7.5,3.5,'pine'],
 [25.24,64.58,7.8,3.5,'pine'],[30.57,55.09,7.2,3.3,'pine'],
 [58.76,60.7,8.3,4.1,'pine'],[80.06,55.84,7.5,3.4,'pine'],
 [81.81,14.93,6.4,2.8,'pine'],[-66.6,42.32,8.8,4.2,'pine'],
 [-49.53,43.78,8.4,3.9,'pine'],[-38.24,49.27,7.9,3.8,'pine'],
 [-72.05,23.07,7.2,3.7,'pine'],[-42.96,28.76,6.9,3.1,'pine'],
 [-64.17,64.38,8.5,4.0,'pine'],[-20.65,58.43,8.2,.85,'cypress'],
 [-14.75,63.46,8.8,.95,'cypress'],[-6.42,67.72,8.4,.9,'cypress'],
 [1.78,71.2,9.3,1.0,'cypress']
];
// The area inspected in the orthophoto owns its vegetation placement. This
// outline is a replacement domain for generic scattering, not a mapped fence
// or botanical habitat boundary. The surrounding hillside keeps its atlas
// vegetation; only the immediate documented setting uses these canopy centres.
const VEGETATION_COVERAGE=[[-82,-10],[-52,-17],[-47,-48],[1,-80],[40,-81],[89,-57],[92,25],[88,76],[10,83],[-43,75],[-81,72]];
// Exposed limestone areas read in PNOA. Relief stays on the IGN MDT; these
// patches add shallow surface strata and fissures, never an invented platform.
const ROCK_BEDS=[
 {id:'oeste',points:[[-75,5],[-67,-5],[-55,-4],[-46,5],[-47,18],[-57,25],[-73,22]],seed:31},
 {id:'este',points:[[70,-48],[76,-52],[83,-43],[81,-25],[75,-17],[69,-25]],seed:67}
];

export const theatreEnvironsRoadIds=new Set(PATHS.map(p=>p.id));
export const theatreEnvironsSourceData={frame:SOURCE_FRAME,paths:PATHS,walls:WALLS,adjacentRoads:ADJACENT_ROADS,canopies:CANOPIES,vegetationCoverage:VEGETATION_COVERAGE,rockBeds:ROCK_BEDS};
export const theatreEnvironsSources=[
 {id:'teatro-osm',url:'https://www.openstreetmap.org/copyright',label:'Trazados de caminos y contención · OpenStreetMap',license:'ODbL 1.0',retrieved:'2026-11-19'},
 {id:'teatro-entorno-pnoa',url:'https://www.ign.es/wms-inspire/pnoa-ma',label:'Mosaico PNOA Máxima Actualidad incorporado al atlas',license:'CC BY 4.0 · IGN/PNOA',retrieved:'2026-11-19',captureDate:null},
 {id:'teatro-foto-2014',url:'https://commons.wikimedia.org/wiki/File:Teatre_Rom%C3%A0_de_Sagunt_02.jpg',label:'Mike1979 Russia · 29 julio 2014',license:'CC BY-SA 3.0',referenceOnly:true},
 {id:'teatro-fotos-turisme',url:'https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/teatro-romano',label:'Turisme Comunitat Valenciana · galería del teatro',captureDate:null,referenceOnly:true}
];

const noise=n=>{const f=Math.sin(n*127.13+43.7)*43758.5453;return f-Math.floor(f);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function inside(x,z,p){let result=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])result=!result;return result;}
function distance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],n=dx*dx+dz*dz,t=n?clamp(((x-a[0])*dx+(z-a[1])*dz)/n,0,1):0;return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
function quad(p,a,b,c,d){p.push(...a,...b,...c,...a,...c,...d);}
const circle=(x,z,r,n=16)=>Array.from({length:n},(_,i)=>[x+Math.cos(i*TAU/n)*r,z+Math.sin(i*TAU/n)*r]);
function edgePolygon(a,b,w){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*w/2,nz=dx/l*w/2;return[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];}

/**
 * Append scenery to the theatre's Batch before finish(). Components beginning
 * with entorno- are context and must be excluded from architectural fit bounds.
 *
 * Integration: union roadIds into the generic-road exclusions; pass
 * vegetationExclusions to createCity; use pathPolygons/solidPolygons as local
 * prop masks, never as blanket claims that remove neighbouring buildings.
 * After finish(), call bindGround(group, meshHeightAt)
 * for the Atlas and worker. Rebinding starts from immutable original vertices.
 */
export function appendTheatreEnvirons({batch,key,plan=()=>{},localWorld,toLocal,heightAt,base}){
 if(!batch||typeof key!=='function'||typeof localWorld!=='function'||typeof toLocal!=='function'||typeof heightAt!=='function'||!Number.isFinite(base))throw new TypeError('Theatre environs require a batch and the registered theatre frame.');
 const componentKinds={
  'entorno-accesos':'paths','entorno-contencion':'walls','entorno-roca':'natural',
  'entorno-arbolado':'vegetation','entorno-matorral':'vegetation'
 };
 const ranges=new Map(),counts=new Map(),snapshots=new WeakMap(),environsBounds=new THREE.Box3();
 const pathPolygons=[],solidPolygons=[],treeExclusions=[],vegetationExclusions=[],qa={
  sourceWayIds:PATHS.map(p=>p.id),sourceRetainingWallIds:WALLS.map(p=>p.id),
  paths:[],walls:[],trees:[],rockPatches:[],rejectedCanopies:[],
  sourceFrame:SOURCE_FRAME,sourceKeys:theatreEnvironsSources.map(s=>s.id),
  attribution:'© OpenStreetMap contributors · Obra derivada de IGN/PNOA',
  limits:['Trazados OSM; anchuras, huellas y alturas de muros interpretadas.',
   'Copas localizadas visualmente en PNOA; especies y alzados estimados, sin inventario botánico.',
   'Fecha de consulta del mosaico: 19/11/2026; fecha de toma no determinada.',
   'Roca superficial interpretada sobre el relieve IGN; no se modifica el terreno ni se crea una explanada.',
   'No se reproduce ni se sustituye arquitectura del castillo.'],
  terrainPolicy:'No terrain modification; scenery is rebound to the final rendered ground.',
  vegetationCoverage:{localOutline:VEGETATION_COVERAGE,basis:'Immediate area inspected in supplied PNOA',policy:'Replace generic scattering with registered canopies; this is not a physical boundary.'},
  rebinding:{calls:0,maximumShiftM:0}
 };
 const worldPoint=([x,z])=>{const p=localWorld(x,0,z);return{x:p.x,z:p.z};};
 const ground=(x,z)=>{const p=localWorld(x,0,z);return heightAt(p.x,p.z)-base;};
 // Clearance excludes the full current cavea and scene, including the rough
 // lateral archaeological returns. It deliberately does not level that area.
 const architectureClear=(x,z,margin=0)=>{
  if(z>=-2.8&&Math.hypot(x,z)<43.5+margin)return false;
  if(z>=-32.5-margin&&z< -2.8&&x> -39.2-margin&&x<37.8+margin)return false;
  return true;
 };
 const routeClear=(x,z,margin)=>[...PATHS,...ADJACENT_ROADS].every(r=>r.points.slice(1).every((b,i)=>distance(x,z,r.points[i],b)>r.width/2+margin));
 const worldPolygon=p=>p.map(worldPoint);
 const vegetationCoverage=[worldPolygon(VEGETATION_COVERAGE)];
 vegetationExclusions.push(...vegetationCoverage);
 function record(k,count,anchor){
  const start=counts.get(k)||0;counts.set(k,start+count);
  if(!ranges.has(k))ranges.set(k,[]);
  ranges.get(k).push({start,count,anchor:anchor?{x:anchor[0],z:anchor[1],ground:ground(...anchor)}:null});
 }
 function raw(component,period,material,p,tint=1,anchor=null){
  if(!p.length)return;const k=key(component,period,material);record(k,p.length/3,anchor);batch.raw(k,p,tint);
  for(let i=0;i<p.length;i+=3)environsBounds.expandByPoint(localWorld(p[i],p[i+1],p[i+2]));
 }
 function geometry(component,material,g,m,tint,anchor){
  const k=key(component,'interpretation',material);record(k,g.index?g.index.count:g.attributes.position.count,anchor);batch.geometry(k,g,m,tint);
  g.computeBoundingBox();const b=g.boundingBox.clone().applyMatrix4(m);for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])environsBounds.expandByPoint(localWorld(x,y,z));
 }
 const matrix=(x,y,z,sx,sy,sz,yaw=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(sx,sy,sz));

 // Rebuild the five mapped approaches that otherwise disappear within the
 // generic city's monument buffer. No line is extrapolated to a fictional gate.
 for(const route of PATHS){
  const item={id:route.id,kind:route.kind,interpretedWidthM:route.width,segments:0,treads:0,clippedSegments:0};
  for(let i=1;i<route.points.length;i++){
   const a=route.points[i-1],b=route.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   const rise=Math.abs(ground(...b)-ground(...a));
   const count=Math.max(1,Math.ceil(length/.85),route.kind==='steps'?Math.ceil(rise/.18):1);
   for(let j=0;j<count;j++){
    const p=[a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count],q=[a[0]+(b[0]-a[0])*(j+1)/count,a[1]+(b[1]-a[1])*(j+1)/count],outline=edgePolygon(p,q,route.width);
    if(!outline.every(v=>architectureClear(...v,.15))){item.clippedSegments++;continue;}
    const v=[],isStair=route.kind==='steps',level=Math.max(ground(...p),ground(...q))+.18;
    const top=outline.map(([x,z])=>[x,isStair?level:ground(x,z)+.18,z]);
    quad(v,...top);
    for(let e=0;e<4;e++){const A=top[e],B=top[(e+1)%4];quad(v,A,[A[0],ground(A[0],A[2])-.15,A[2]],[B[0],ground(B[0],B[2])-.15,B[2]],B);}
    raw('entorno-accesos','contemporary',isStair?'limestone':'paving',v,.89+(i%3)*.025,isStair?[(p[0]+q[0])/2,(p[1]+q[1])/2]:null);
    pathPolygons.push(worldPolygon(outline));item.segments++;if(isStair)item.treads++;
   }
  }
  qa.paths.push(item);plan('entorno-acceso-'+route.id,route.points,'path','contemporary',false);
 }

 // Only separately mapped external retaining lines are included. Their tops
 // follow the existing slope; all unrecorded wall dimensions are estimates.
 for(const wall of WALLS){
  const item={id:wall.id,interpretedHeightM:wall.height,interpretedWidthM:wall.width,segments:0,clippedSegments:0};
  for(let i=1;i<wall.points.length;i++){
   const a=wall.points[i-1],b=wall.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.2));
   for(let j=0;j<n;j++){
    const p=[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n],q=[a[0]+(b[0]-a[0])*(j+1)/n,a[1]+(b[1]-a[1])*(j+1)/n],outline=edgePolygon(p,q,wall.width);
    if(!outline.every(v=>architectureClear(...v,.6))){item.clippedSegments++;continue;}
    const v=[],top=outline.map(([x,z])=>[x,ground(x,z)+wall.height,z]);quad(v,...top);
    for(let e=0;e<4;e++){const A=top[e],B=top[(e+1)%4];quad(v,A,[A[0],ground(A[0],A[2])-.28,A[2]],[B[0],ground(B[0],B[2])-.28,B[2]],B);}
    raw('entorno-contencion','mixed','masonry',v,.83+noise(i*23+j)*.11);solidPolygons.push(worldPolygon(outline));item.segments++;
   }
  }
  qa.walls.push(item);plan('entorno-muro-'+wall.id,wall.points,'wall','mixed',false);
 }

 const crownGeometry=new THREE.IcosahedronGeometry(1,2),trunkGeometry=new THREE.CylinderGeometry(.68,1,1,8),cypressGeometry=new THREE.SphereGeometry(1,10,9);
 for(const [i,spec]of CANOPIES.entries()){
  const[x,z,h,r,form]=spec;
  // A crown may overhang a path, as in PNOA, but its trunk never blocks one.
  if(!architectureClear(x,z,r+.5)||!routeClear(x,z,.24)){
   qa.rejectedCanopies.push({index:i,local:[x,z],reason:'architectural or mapped-path clearance'});continue;
  }
  const y=ground(x,z),anchor=[x,z],stem=form==='cypress'?h*.34:h*.62;
  geometry('entorno-arbolado','bark',trunkGeometry,matrix(x,y+stem/2-.2,z,.17+.018*h,stem,.17+.018*h),.87+noise(i)*.12,anchor);
  if(form==='cypress')geometry('entorno-arbolado','foliage',cypressGeometry,matrix(x,y+h*.55,z,r,h*.45,r*.9),.69+noise(i)*.1,anchor);
  else{
   const clusters=[[0,.72,0,.7,.24,.64],[-.35,.64,.15,.53,.22,.55],[.37,.67,.13,.54,.23,.53],[.04,.67,-.32,.6,.23,.54],[.02,.81,-.03,.55,.19,.51]];
   for(const [n,[dx,hy,dz,sx,sy,sz]]of clusters.entries())geometry('entorno-arbolado','foliage',crownGeometry,matrix(x+dx*r,y+hy*h,z+dz*r,r*sx,h*sy,r*sz,noise(i+5)*TAU),.77+noise(i*17+n)*.25,anchor);
  }
  const p=localWorld(x,0,z);qa.trees.push({index:i,local:[x,z],world:{x:p.x,z:p.z},baseM:y+base,heightM:h,maximumCrownRadiusM:r,form,positionSource:'PNOA canopy registration',dimensions:'interpreted'});
  const exclusion=worldPolygon(circle(x,z,r+5.6));treeExclusions.push(exclusion);vegetationExclusions.push(exclusion);
 }
 crownGeometry.dispose();trunkGeometry.dispose();cypressGeometry.dispose();

 for(const bed of ROCK_BEDS){
  const minX=Math.min(...bed.points.map(p=>p[0])),maxX=Math.max(...bed.points.map(p=>p[0])),minZ=Math.min(...bed.points.map(p=>p[1])),maxZ=Math.max(...bed.points.map(p=>p[1]));let cells=0;
  for(let x=minX;x<maxX;x+=1.15)for(let z=minZ;z<maxZ;z+=1.15){
   const q=[[x,z],[x,z+1.15],[x+1.15,z+1.15],[x+1.15,z]];
   if(!q.every(p=>inside(...p,bed.points)&&architectureClear(...p,1)&&routeClear(...p,.6)))continue;
   if(qa.trees.some(t=>Math.hypot(x+.57-t.local[0],z+.57-t.local[1])<t.maximumCrownRadiusM*.7))continue;
   const lift=(xx,zz)=>.07+.11*noise(Math.floor(xx/2.3)*7+Math.floor(zz/1.15)+bed.seed);
   const v=[],top=q.map(([xx,zz])=>[xx,ground(xx,zz)+lift(xx,zz),zz]);quad(v,...top);
   raw('entorno-roca','interpretation','rock',v,.9+noise(Math.floor(x*11+z*7)+bed.seed)*.17);cells++;
  }
  qa.rockPatches.push({id:bed.id,cells,maximumSurfaceReliefM:.18,source:'Exposed rock in supplied PNOA and contemporary photographs'});
 }

 // Each geometry retains its own original positions. A second ground bind
 // replaces the prior displacement instead of adding to it (Atlas/worker).
 function bindGround(group,finalHeightAt=heightAt){
  if(typeof finalHeightAt!=='function')return api;
  let maximumShift=0;group.updateMatrixWorld(true);
  group.traverse(mesh=>{
   if(!mesh.isMesh||!componentKinds[mesh.userData.component])return;
   const k=key(mesh.userData.component,mesh.userData.period,mesh.userData.materialKind),items=ranges.get(k),attr=mesh.geometry.attributes.position;
   if(!items||!attr)return;
   let snapshot=snapshots.get(mesh.geometry);
   if(!snapshot){const originals=attr.array.slice(),oldGround=new Float64Array(attr.count);for(let i=0;i<attr.count;i++)oldGround[i]=ground(originals[i*3],originals[i*3+2]);snapshot={originals,oldGround};snapshots.set(mesh.geometry,snapshot);}
   attr.array.set(snapshot.originals);
   for(const range of items){
    let fixedShift;
    if(range.anchor){const p=localWorld(range.anchor.x,0,range.anchor.z);fixedShift=finalHeightAt(p.x,p.z)-base-range.anchor.ground;}
    for(let i=range.start;i<range.start+range.count;i++){
     const p=localWorld(snapshot.originals[i*3],0,snapshot.originals[i*3+2]),delta=range.anchor?fixedShift:finalHeightAt(p.x,p.z)-base-snapshot.oldGround[i];
     if(!Number.isFinite(delta))continue;attr.array[i*3+1]=snapshot.originals[i*3+1]+delta;maximumShift=Math.max(maximumShift,Math.abs(delta));
    }
   }
   attr.needsUpdate=true;
   // Rigid crown/trunk shifts preserve their original smooth shading.
   if(items.some(item=>!item.anchor))mesh.geometry.computeVertexNormals();
   mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
  });
  environsBounds.makeEmpty();group.traverse(mesh=>{if(mesh.isMesh&&componentKinds[mesh.userData.component])environsBounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));});
  for(const t of qa.trees)t.baseM=finalHeightAt(t.world.x,t.world.z);
  qa.rebinding.calls++;qa.rebinding.maximumShiftM=maximumShift;return api;
 }
 const api={
  qa,environsBounds,componentKinds,componentIds:Object.keys(componentKinds),vegetationComponents:['entorno-arbolado','entorno-matorral'],
  roadIds:theatreEnvironsRoadIds,vegetationExclusions,vegetationCoverage,treeExclusions,pathPolygons,solidPolygons,
  claims:[...pathPolygons,...solidPolygons],propMask:{paths:pathPolygons,solids:solidPolygons,vegetation:vegetationExclusions},
  surfaceHeight:(x,z,raw)=>raw,bindGround,sources:theatreEnvironsSources,
  architectureClear:(x,z,margin=0)=>{const p=toLocal(x,z);return architectureClear(p.x,p.z,margin);}
 };
 return api;
}
