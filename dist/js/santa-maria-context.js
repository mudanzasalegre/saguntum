import * as THREE from 'three';
import {pointInPolygon,segmentDistance,roadWidth} from './urban-surface.js';
import {createPavingTessellator} from './conforming-paving.js';
import {createSantaMariaPublicRealm} from './santa-maria-public-realm.js';

// Compact, source-registered surroundings of Santa María. The ordinary houses
// are deliberately schematic: source footprints, patios, storeys and roof-height
// estimates are retained; individual domestic facades have not been surveyed.
const DEFAULT_COORDINATE=[-.27910948,39.67903398],YAW=1.173;
const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const geographical=(x,z)=>[-.278+x/(111320*Math.cos(39.679*Math.PI/180)),39.679-z/111320];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const x=Math.sin(n*127.17+31.7)*43758.5453;return x-Math.floor(x);};
const hash=s=>[...String(s)].reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,5381);
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)]||0;
const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
const mid=p=>({x:p.reduce((s,a)=>s+a.x,0)/p.length,z:p.reduce((s,a)=>s+a.z,0)/p.length});
const clean=(coordinates,project)=>{const out=(coordinates||[]).map(c=>project(...c)).filter(p=>Number.isFinite(p.x+p.z));if(out.length>1&&Math.hypot(out[0].x-out.at(-1).x,out[0].z-out.at(-1).z)<.02)out.pop();return out;};
const color=c=>c?.isColor?c:new THREE.Color(c);
const scaleColor=(c,n)=>color(c).clone().multiplyScalar(n);
const rect=(x0,z0,x1,z1)=>[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:x0,z:z1}];
const PERIOD_COLORS={medieval:'#d6bd8b',modern:'#d4a578',contemporary:'#77b8c7',mixed:'#be98d6',interpretation:'#929ba0'};

function makeTexture(kind){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle=kind==='tile'?'#b8a58f':kind==='paving'?'#c3bbae':'#d6d0c3';ctx.fillRect(0,0,256,256);
 const rows=kind==='tile'?22:kind==='paving'?15:7,cols=kind==='tile'?16:kind==='paving'?8:4;
 const dx=256/cols,dy=256/rows;
 for(let r=0;r<rows;r++)for(let k=-1;k<cols;k++){
  const v=noise(r*47+k+128),x=k*dx+(r%2?dx/2:0),y=r*dy;
  ctx.fillStyle=kind==='tile'?`hsl(${29+v*5},${16+v*10}%,${66+v*12}%)`:`hsl(${34+v*5},${7+v*8}%,${75+v*12}%)`;ctx.fillRect(x+1,y+1,dx-1.8,dy-1.6);
  if(kind==='tile'){ctx.fillStyle='rgba(255,248,222,.18)';ctx.fillRect(x+dx*.22,y+1,dx*.18,dy-2);}
 }
 for(let n=0;n<950;n++){ctx.fillStyle=n%2?'rgba(30,25,19,.045)':'rgba(255,253,238,.08)';ctx.fillRect(noise(n+12)*256,noise(n+49)*256,1.6,.9);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}

class Batch{
 constructor(){this.parts=new Map();}
 triangle(kind,a,b,c,tint='#ffffff'){
  const col=color(tint);let d=this.parts.get(kind);if(!d){d={p:[],u:[],c:[]};this.parts.set(kind,d);}
  const n=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c),new THREE.Vector3(...a)));
  const horizontal=Math.abs(n.y)>=Math.max(Math.abs(n.x),Math.abs(n.z)),alongX=Math.abs(n.z)>=Math.abs(n.x),repeat=kind==='paving'?2.4:kind==='tile'?3:4;
  for(const v of[a,b,c]){d.p.push(...v);d.c.push(col.r,col.g,col.b);d.u.push((horizontal?v[0]:alongX?v[0]:v[2])/repeat,(horizontal?v[2]:v[1])/repeat);}
 }
 quad(kind,a,b,c,d,tint){this.triangle(kind,a,b,c,tint);this.triangle(kind,a,c,d,tint);}
 box(kind,x,y,z,w,h,d,yaw=0,tint='#ffffff'){
  const co=Math.cos(yaw),si=Math.sin(yaw),p=[];
  for(const dy of[-h/2,h/2])for(const dz of[-d/2,d/2])for(const dx of[-w/2,w/2])p.push([x+dx*co+dz*si,y+dy,z-dx*si+dz*co]);
  for(const q of[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])this.quad(kind,...q.map(i=>p[i]),tint);
 }
 finish(name,component,period,resources,textures){
  const group=new THREE.Group();group.name=name;group.userData={component,period};
  for(const[k,d]of this.parts){
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(d.p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(d.u,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(d.c,3));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
   if(k==='paving'){
    // This is one continuous street surface. Share normals at coincident
    // vertices instead of exposing each tessellation triangle as a stone slab.
    const normals=geo.attributes.normal,positions=geo.attributes.position,sums=new Map(),keys=[];
    for(let i=0;i<positions.count;i++){const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>v.toFixed(4)).join(',');keys.push(key);if(!sums.has(key))sums.set(key,new THREE.Vector3());sums.get(key).add(new THREE.Vector3(normals.getX(i),normals.getY(i),normals.getZ(i)));}
    for(const v of sums.values())v.normalize();for(let i=0;i<positions.count;i++){const v=sums.get(keys[i]);normals.setXYZ(i,v.x,v.y,v.z);}
   }
   const map=k==='tile'?textures.tile:['paving','stone'].includes(k)?textures[k]:null;
   const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,map,roughness:k==='iron'?.62:k==='glass'?.73:.95,metalness:k==='iron'?.38:0,side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geo,material);mesh.name=name+' · '+k;mesh.castShadow=!['paving','joints'].includes(k);mesh.receiveShadow=true;
   mesh.userData={santaMariaContext:true,component,period,materialKind:k,baseColor:material.color.clone(),baseMap:map,schematicFacade:component!=='santa-maria-escalinata'};
   resources.geometries.push(geo);resources.materials.push(material);group.add(mesh);
  }
  return group;
 }
}

function triangles(outline,holes=[]){const all=[outline,...holes].flat(),ix=THREE.ShapeUtils.triangulateShape(outline.map(p=>new THREE.Vector2(p.x,-p.z)),holes.map(r=>r.map(p=>new THREE.Vector2(p.x,-p.z))));return ix.map(t=>t.map(i=>all[i]));}
function subdivide(a,b,c,callback,maxEdge=2.5,depth=0){
 const lengths=[Math.hypot(a.x-b.x,a.z-b.z),Math.hypot(b.x-c.x,b.z-c.z),Math.hypot(c.x-a.x,c.z-a.z)],long=Math.max(...lengths);
 if(long<=maxEdge||depth>8){callback(a,b,c);return;}
 const i=lengths.indexOf(long),v=[a,b,c],u=v[i],w=v[(i+1)%3],opposite=v[(i+2)%3],m={x:(u.x+w.x)/2,z:(u.z+w.z)/2};subdivide(u,m,opposite,callback,maxEdge,depth+1);subdivide(m,w,opposite,callback,maxEdge,depth+1);
}
export function createSantaMariaContext({data={},landmarks={},project=projectDefault,heightAt=()=>0,churchFrame=null,contextData={},replacedContextBuildingIds=[]}={}){
 const record=landmarks['santa-maria']||{},coordinate=record.coordinate||contextData.coordinate||DEFAULT_COORDINATE,center=churchFrame?.center||project(...coordinate),yaw=churchFrame?.yaw??YAW,co=Math.cos(yaw),si=Math.sin(yaw);
 const outline=record.footprint||churchFrame?.outline||[],worldOutline=clean(outline,project),base=churchFrame?.base??median(worldOutline.map(p=>heightAt(p.x,p.z)))+.12;
 const world=(x,z)=>({x:center.x+x*co+z*si,z:center.z-x*si+z*co}),local=(x,z)=>({x:(x-center.x)*co-(z-center.z)*si,z:(x-center.x)*si+(z-center.z)*co});
 const point=(x,y,z)=>{const p=world(x,z);return[p.x,base+y,p.z];};
 const localPolygon=p=>p.map(v=>world(v.x,v.z));
 // A detailed adjoining monument may own a source building that also occurs
 // in this immediate-context dataset. Retain the source records and generic
 // exclusions, but build each parcel only once when its replacement is present.
 const sourceBuildings=contextData.buildings||[],replacementIds=new Set([...replacedContextBuildingIds].map(String)),renderBuildings=sourceBuildings.filter(b=>!replacementIds.has(String(b.id))),sourceRoads=contextData.roads||(data.roads||[]).filter(r=>['87554148','1365045257','1204891837','733321159','22922651','1419209850','1419209851','1419209852','1419209853'].includes(String(r.id)));
 const sourceSurfaces=contextData.surfaces||sourceRoads.filter(r=>r.area==='yes').map(r=>({id:'santa-maria-cervantes',coordinates:r.coordinates,sourceId:r.id}));
 const corridorSurfaces=contextData.corridorSurfaces||[],corridorRoadIds=new Set((contextData.corridorRoadIds||[]).map(String));
 const resources={geometries:[],materials:[],textures:[]},textures={stone:makeTexture('stone'),paving:makeTexture('paving'),tile:makeTexture('tile')};resources.textures.push(...Object.values(textures));
 const group=new THREE.Group(),fixed=new THREE.Group(),grounded=new THREE.Group();group.name='Santa María · calles, plaza y caserío inmediato';fixed.name='Acceso norte y pretil documentado';grounded.name='Contexto adaptado al terreno final';group.add(fixed,grounded);
 const exclusions=[],patches=[],excludedBuildingIds=new Set((contextData.excludedBuildingIds||sourceBuildings.map(b=>b.id)).map(String)),excludedRoadIds=new Set((contextData.excludedRoadIds||sourceRoads.map(r=>r.id)).map(String)),components=[];
 const stats={buildingParts:renderBuildings.length,parentParcels:new Set(renderBuildings.map(b=>b.parentId||b.id)).size,sourceBuildingParts:sourceBuildings.length,replacedBuildingParts:sourceBuildings.length-renderBuildings.length,footprintsPreserved:true,courtyards:renderBuildings.reduce((s,b)=>s+(b.holes?.length||0),0),sourceHeight:0,ignHeight:0,storeyHeight:0,fallbackHeight:0,northStairTreads:0,northApronSegments:0,corridorSurfaces:corridorSurfaces.length,corridorAreaM2:corridorSurfaces.reduce((sum,s)=>sum+(s.areaM2||0),0),streetSamples:0,roofCorrections:0,maximumRoofCorrectionM:0,inscriptionPanels:2};
 const qa={buildings:[],stairSurfaces:[],groundSamples:[],sourcePreservation:[],sourceKeys:(contextData.sources||[]).map(s=>s.id),limitations:[contextData.facadeNote,contextData.roofNote,contextData.stairNote,contextData.streetNote].filter(Boolean)};
 const publicRealm=createSantaMariaPublicRealm({frame:{base,yaw,toWorld:world,toLocal:local,footprintLocal:worldOutline.map(p=>local(p.x,p.z))},sourceSurfaces,project,heightAt});
 patches.push(...publicRealm.patches);exclusions.push(...publicRealm.exclusions);components.push(...publicRealm.components);qa.publicRealm=publicRealm.qa;qa.limitations.push(...publicRealm.qa.limitations);
 stats.westernTerraces=sourceSurfaces.length?publicRealm.qa.westernSquare.terraces:0;stats.southStoneEnclosure=true;
 let selected=null,readingMode='materials',currentGround=heightAt,disposed=false;
 const sourcePolygons=renderBuildings.map(b=>({record:b,p:clean(b.coordinates,project),holes:(b.holes||[]).map(r=>clean(r,project))})).filter(b=>b.p.length>=3);
 qa.replacedBuildingIds=sourceBuildings.filter(b=>replacementIds.has(String(b.id))).map(b=>String(b.id));
 for(const b of sourcePolygons){exclusions.push(b.p);components.push({id:'context-'+b.record.id,coordinates:b.record.coordinates,kind:'context-building',period:'mixed',sourceId:b.record.id,interpretive:false});qa.sourcePreservation.push({id:b.record.id,vertices:b.record.coordinates.length,holes:b.record.holes?.length||0});}
 const nearby=(data.buildings||sourceBuildings).filter(b=>{const p=b.coordinates?.[0]&&project(...b.coordinates[0]);return p&&Math.hypot(p.x-center.x,p.z-center.z)<125;}).map(b=>({id:String(b.id),p:clean(b.coordinates,project),holes:(b.holes||[]).map(r=>clean(r,project))})).filter(b=>b.p.length>=3);
 const occupied=(x,z,ignore=null)=>nearby.some(b=>b.id!==ignore&&pointInPolygon(x,z,b.p)&&!b.holes.some(h=>pointInPolygon(x,z,h)));
 const buildFixed=()=>{
  const b=new Batch(),x0=19.7,x1=23.2,z0=-8.05,z1=10.4,landing0=-1.75,landing1=2.45,top=base+.12;
  const start0=world((x0+x1)/2,z0),start1=world((x0+x1)/2,z1),y0=Math.min(top-.18,heightAt(start0.x,start0.z)+.12),y1=Math.min(top-.18,heightAt(start1.x,start1.z)+.12),bottom=Math.min(y0,y1)-.38;
  const stairOutline=localPolygon(rect(x0-.12,z0-.18,x1+.55,z1+.18));exclusions.push(stairOutline);
  const lp=(x,y,z)=>{const a=world(x,z);return[a.x,y,a.z];};
  const lbox=(kind,x,y,z,w,h,d,tint)=>{const a=world(x,z);b.box(kind,a.x,y,a.z,w,h,d,yaw,tint);};
  const addFlight=(from,to,ground)=>{
   const count=Math.max(1,Math.ceil((top-ground)/.19)),rise=(top-ground)/count,run=Math.abs(to-from)/count,dir=Math.sign(to-from);stats.northStairTreads+=count;
   for(let n=0;n<count;n++){const z=from+dir*(n+.5)*run,y=ground+(n+1)*rise,flight=from<0?'west':'east';lbox('stone',(x0+x1)/2,(bottom+y)/2,z,x1-x0,y-bottom,run+.015,n%2?'#c0b29a':'#cbbca2');lbox('stone',(x0+x1)/2,y+.025,z-dir*run*.43,x1-x0+.05,.055,.13,'#d9ceb8');qa.stairSurfaces.push({x:world((x0+x1)/2,z).x,z:world((x0+x1)/2,z).z,y,flight,run});
    // Each solid tread caps its own ground intrusion. A single cap at the
    // deepest foundation bottom excavated a false trench beside the high end.
    patches.push({id:`santa-maria-north-stair-${flight}-${n}`,polygon:localPolygon(rect(x0-.12,z-run/2,x1+.55,z+run/2)),height:y-.08,margin:.06,mode:'lower-only',priority:20});
   }
  };
  addFlight(z0,landing0,y0);addFlight(z1,landing1,y1);
  // The landing reaches the recessed portal threshold. Stopping at x=20.35
  // left an open black slot between the door and the otherwise solid stair.
  const landingInner=19.24;
  lbox('stone',(landingInner+x1)/2,(bottom+top)/2,(landing0+landing1)/2,x1-landingInner,top-bottom,landing1-landing0,'#cfbea3');
  lbox('stone',(landingInner+20.35)/2,top+.012,(landing0+landing1)/2,20.35-landingInner,.026,landing1-landing0,'#d3c5ad');
  patches.push({id:'santa-maria-north-stair-landing',polygon:localPolygon(rect(x0-.12,landing0,x1+.55,landing1)),height:top-.08,margin:.06,mode:'lower-only',priority:20});
  // The outer barrier is solid masonry. Published current photographs do not
  // show an open row of balusters, and disappeared statues are not reinstated.
  const profile=z=>z<landing0?y0+(top-y0)*(z-z0)/(landing0-z0):z>landing1?top+(y1-top)*(z-landing1)/(z1-landing1):top;
  for(let z=z0;z<z1;z+=.54){const end=Math.min(z1,z+.54),a=profile(z)+.86,c=profile(end)+.86,lo=bottom-.1,x=x1+.26;
   b.quad('stone',lp(x-.2,lo,z),lp(x-.2,lo,end),lp(x-.2,c,end),lp(x-.2,a,z),'#c4b49a');b.quad('stone',lp(x+.2,lo,end),lp(x+.2,lo,z),lp(x+.2,a,z),lp(x+.2,c,end),'#bdad95');b.quad('stone',lp(x-.25,a+.035,z),lp(x+.25,a+.035,z),lp(x+.25,c+.035,end),lp(x-.25,c+.035,end),'#ded2b9');
   b.quad('stone',lp(x-.25,a-.12,z),lp(x+.25,a-.12,z),lp(x+.25,a+.035,z),lp(x-.25,a+.035,z),'#d0c0a5');
  }
  for(const z of[z0,z1]){const y=profile(z)+.86;b.quad('stone',lp(x1+.06,bottom-.1,z),lp(x1+.46,bottom-.1,z),lp(x1+.46,y,z),lp(x1+.06,y,z),'#c4b49a');}
  // The current photographic elevation has a raised rounded centre, short
  // shoulders and curved returns. It is not a single sinusoidal hump. Keep the
  // moulding continuous through those changes of profile (ARSE 58, p. 75).
  const crestZ=.35,crestHalf=2.05,crestBase=top+.85,halfProfile=[[0,.74],[.22,.72],[.48,.61],[.7,.44],[.86,.26],[1.16,.26],[1.43,.09],[1.8,0],[crestHalf,0]],crestProfile=[...halfProfile.slice(1).reverse().map(([z,y])=>[-z,y]),...halfProfile];
  for(let n=1;n<crestProfile.length;n++){const[za0,ya0]=crestProfile[n-1],[zb0,yb0]=crestProfile[n],za=crestZ+za0,zb=crestZ+zb0,ya=crestBase+ya0,yb=crestBase+yb0;
   for(const x of[x1+.06,x1+.46])b.quad('stone',lp(x,crestBase-.04,za),lp(x,crestBase-.04,zb),lp(x,yb,zb),lp(x,ya,za),'#c7b79d');b.quad('stone',lp(x1+.02,ya,za),lp(x1+.50,ya,za),lp(x1+.50,yb,zb),lp(x1+.02,yb,zb),'#ddd0b6');
   b.quad('stone',lp(x1+.51,ya-.075,za),lp(x1+.51,yb-.075,zb),lp(x1+.51,yb,zb),lp(x1+.51,ya,za),'#d7c9b0');
  }
  // Shoulder piers and a low street plinth make the parapet read as masonry
  // against the lane. Their detail is simplified; exact mouldings are unsurveyed.
  for(const z of[crestZ-crestHalf-.36,crestZ+crestHalf+.36]){
   const cap=profile(z)+1.03;lbox('stone',x1+.48,cap-.69,z,.31,1.38,.49,'#bcae97');lbox('stone',x1+.48,cap+.01,z,.43,.15,.62,'#d8cbb4');
   lbox('stone',x1+.645,cap-.64,z,.018,.84,.29,'#a49b88');lbox('stone',x1+.66,cap-.66,z,.022,.69,.20,'#c3b59d');
  }
  for(let z=z0;z<z1;z+=.9){const end=Math.min(z1,z+.9),a=world(x1+.49,z),c=world(x1+.49,end),ya=heightAt(a.x,a.z),yc=heightAt(c.x,c.z);b.quad('stone',lp(x1+.56,ya-.08,z),lp(x1+.56,yc-.08,end),lp(x1+.56,yc+.27,end),lp(x1+.56,ya+.27,z),'#b9ab91');b.quad('stone',lp(x1+.43,ya+.27,z),lp(x1+.56,ya+.27,z),lp(x1+.56,yc+.27,end),lp(x1+.43,yc+.27,end),'#cfc0a4');}
  const external=world(x1+.48,crestZ),inscriptionGround=heightAt(external.x,external.z);
  for(const[width,height,y]of[[1.67,.59,inscriptionGround+1.73],[1.23,.63,inscriptionGround+1.02]]){
   lbox('stone',x1+.49,y,crestZ,.085,height,width,'#aeaa97');lbox('plaster',x1+.54,y,crestZ,.018,height-.11,width-.13,'#bcb7a4');
   for(const s of[-1,1]){lbox('stone',x1+.55,y+s*(height-.06)/2,crestZ,.045,.055,width,'#d0c8b4');lbox('stone',x1+.55,y,crestZ+s*(width-.06)/2,.045,height,.055,'#ccc2ac');}
  }
  // Only the weathered date tablet is retained at the centre; missing portal
  // statuary and lost ornaments in the 1923 photograph remain absent.
  lbox('stone',x1+.26,crestBase+.80,crestZ,.31,.18,.27,'#c8baa3');
  fixed.add(b.finish('Escalinata norte · doble tramo y pretil macizo','santa-maria-escalinata','mixed',resources,textures));
  components.push({id:'escalinata-norte',coordinates:stairOutline.map(p=>geographical(p.x,p.z)),kind:'stairs',period:'mixed',interpretive:true,sourceId:'733321159'});
  components.push({id:'pretil-1799',coordinates:localPolygon(rect(x1+.03,z0,x1+.5,z1)).map(p=>geographical(p.x,p.z)),kind:'wall',period:'modern',interpretive:true});
  qa.northStair={sourceWay:'733321159',top,startWest:y0,startEast:y1,westRise:top-y0,eastRise:top-y1,landing:[landing0,landing1],landingInnerX:landingInner,thresholdConnected:true,pretil:'solid masonry with shoulder piers, moulded crest and street plinth',crestProfile,plaqueDimensionsM:[[1.67,.59],[1.23,.63]],footprint:stairOutline};
 };
 buildFixed();
 // A continuous paved street meets the vertical church base, rather than an
 // earth bank. Cover both exposed ends of the north wall: the former apron
 // stopped short of the west corner and omitted the return beyond the stair.
 // These cells cap only local crests beneath paving following raw MDT. Using
 // the minimum across the sloping street would instead excavate a trough.
 // They have an explicit
 // priority so Atlas and territorial assembly cannot change their effect.
 const northApron=[],cavallers=sourceRoads.find(r=>String(r.id)==='1365045257'),cavallersLocal=(cavallers?.coordinates||[]).map(c=>{const p=project(...c);return local(p.x,p.z);});
 const streetX=z=>{for(let i=1;i<cavallersLocal.length;i++){const a=cavallersLocal[i-1],b=cavallersLocal[i];if(z>=Math.min(a.z,b.z)&&z<=Math.max(a.z,b.z)&&Math.abs(a.z-b.z)>.01)return a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);}return 25.2;};
 if(cavallersLocal.length){
  const spans=[{id:'west',from:-28.15,to:-8.23},{id:'east',from:10.58,to:15.0}];
  for(const span of spans){
   const {from:minZ,to:maxZ}=span,count=Math.ceil((maxZ-minZ)/1.2);
   for(let i=0;i<count;i++){const a=minZ+(maxZ-minZ)*i/count,b=minZ+(maxZ-minZ)*(i+1)/count,p=localPolygon([{x:19.24,z:a},{x:streetX(a)-.35,z:a},{x:streetX(b)-.35,z:b},{x:19.24,z:b}]),samples=[...p,mid(p)],level=Math.max(...samples.map(q=>heightAt(q.x,q.z)))-.12;northApron.push(p);patches.push({id:`santa-maria-cavallers-${span.id}-${i}`,polygon:p,height:level,margin:.12,mode:'lower-only',priority:20});exclusions.push(p);}
   const p=localPolygon([{x:19.24,z:minZ},{x:streetX(minZ)-.35,z:minZ},{x:streetX(maxZ)-.35,z:maxZ},{x:19.24,z:maxZ}]);components.push({id:span.id==='west'?'cavallers-foundation-transition':'cavallers-east-return',coordinates:p.map(q=>geographical(q.x,q.z)),kind:'street',period:'interpretation',interpretive:true,sourceId:'1365045257'});
  }
  stats.northApronSegments=northApron.length;qa.northApron={sourceWay:'1365045257',cells:northApron.length,localExtent:[19.24,-28.15,streetX(15)-.35,15],spans,maximumCellLengthM:1.2,heightPolicy:'Street subgrade caps derive from the MDT; one continuous paving envelope follows the final presentation terrain along Cavallers and its Sagrari return. The church foundation remains vertical. Width, finish and exact elevation remain interpretive.'};
 }
 const disposeLayer=layer=>{layer.traverse(o=>{if(!o.isMesh)return;const g=resources.geometries.indexOf(o.geometry);if(g>=0)resources.geometries.splice(g,1);o.geometry.dispose();const m=resources.materials.indexOf(o.material);if(m>=0)resources.materials.splice(m,1);o.material.dispose();});layer.clear();};
 const streetBatches=new Map(),batchFor=id=>{if(!streetBatches.has(id))streetBatches.set(id,new Batch());return streetBatches.get(id);};
 function buildBuildings(ground){
  const batches=new Map();qa.buildings.length=0;stats.sourceHeight=stats.ignHeight=stats.storeyHeight=stats.fallbackHeight=stats.roofCorrections=stats.maximumRoofCorrectionM=0;
  for(const item of sourcePolygons){
   const {record:r,p,holes}=item,id=r.contextComponent||'santa-maria-sagrario';if(!batches.has(id))batches.set(id,new Batch());const b=batches.get(id),seed=hash(r.parentId||r.id),area=Math.abs(signedArea(p))-holes.reduce((s,h)=>s+Math.abs(signedArea(h)),0),groundSamples=p.map(q=>ground(q.x,q.z)),reference=median(p.map(q=>heightAt(q.x,q.z)));
   let h=Number.parseFloat(r.height),method='height';if(!(h>0)){h=Number.parseFloat(r.surfaceHeightEstimate);method='IGN';}if(!(h>0)){h=Number.parseFloat(r.levels)*3;method='storeys';}if(!(h>0)){h=8;method='estimate';}h=clamp(h,2.5,28);stats[{height:'sourceHeight',IGN:'ignHeight',storeys:'storeyHeight',estimate:'fallbackHeight'}[method]]++;
   const roofColor=r.roofColor||'#b49d81',rc=color(roofColor),red=rc.r>rc.g*1.08,roofRise=!holes.length&&area>45&&r.roofShape!=='flat'&&(red||r.roofShape==='gabled')?clamp(Math.sqrt(area)*.085,.65,1.65):0;
   const sourceRoof=reference+h,roofTop=Math.max(sourceRoof,Math.max(...groundSamples)+.7),eave=roofTop-roofRise;
   if(roofTop>sourceRoof+.001){stats.roofCorrections++;stats.maximumRoofCorrectionM=Math.max(stats.maximumRoofCorrectionM,roofTop-sourceRoof);}
   const facade=['#d7c4a7','#e8ddc6','#c8b49a','#d9c5ad','#e2cfaf','#d3bea5'][seed%6],rings=[p,...holes],sgn=signedArea(p)>0?1:-1;
   for(const ring of rings)for(let i=0;i<ring.length;i++){
    const a=ring[i],c=ring[(i+1)%ring.length],length=Math.hypot(c.x-a.x,c.z-a.z);if(length<.12)continue;
    const dx=(c.x-a.x)/length,dz=(c.z-a.z)/length,sign=(signedArea(ring)>0?1:-1)*(ring===p?1:-1),nx=dz*sign,nz=-dx*sign,ya=ground(a.x,a.z)-.75,yc=ground(c.x,c.z)-.75;
    b.quad('plaster',[a.x,ya,a.z],[c.x,yc,c.z],[c.x,eave,c.z],[a.x,eave,a.z],scaleColor(facade,.96+noise(seed+i)*.08));
    const mx=(a.x+c.x)/2,mz=(a.z+c.z)/2,exposed=!occupied(mx+nx*.6,mz+nz*.6,String(r.id));
    if(!exposed||length<2.1||ring!==p)continue;
    b.quad('stone',[a.x+nx*.025,ya,a.z+nz*.025],[c.x+nx*.025,yc,c.z+nz*.025],[c.x+nx*.025,Math.min(eave,ground(c.x,c.z)+.65),c.z+nz*.025],[a.x+nx*.025,Math.min(eave,ground(a.x,a.z)+.65),a.z+nz*.025],'#b2a58d');
    const angle=-Math.atan2(dz,dx);b.box('stone',mx+nx*.09,eave-.15,mz+nz*.09,length,.18,.24,angle,scaleColor(facade,1.03));
    const columns=Math.max(1,Math.min(8,Math.floor(length/3.25))),floors=Math.min(5,Math.max(1,Math.floor((eave-Math.min(...groundSamples))/3.05)));
    for(let f=0;f<floors;f++)for(let n=0;n<columns;n++){
     const t=(n+1)/(columns+1),x=a.x+(c.x-a.x)*t,z=a.z+(c.z-a.z)*t,y=eave-1.05-f*3.05,low=y-1.45,gy=ground(x,z);if(low<gy+1.9)continue;
     const half=.48,at=(u,v,offset)=>[x+dx*u+nx*offset,v,z+dz*u+nz*offset];
     b.quad('glass',at(-half,low,.042),at(half,low,.042),at(half,y,.042),at(-half,y,.042),'#3c4947');
     for(const side of[-1,1]){const u=side*(half+.05);b.quad('plaster',at(u-.055,low-.07,.08),at(u+.055,low-.07,.08),at(u+.055,y+.09,.08),at(u-.055,y+.09,.08),scaleColor(facade,1.08));}
     b.box('stone',x+nx*.12,low-.07,z+nz*.12,1.18,.12,.3,angle,'#c9bfa9');b.box('wood',x+nx*.06,(low+y)/2,z+nz*.06,.055,1.45,.05,angle,'#82765f');
     if(f===floors-1&&columns<=4&&length>5){
      b.box('stone',x+nx*.4,low-.18,z+nz*.4,1.35,.12,.7,angle,'#c2b8a4');b.box('iron',x+nx*.73,low+.64,z+nz*.73,1.34,.045,.045,angle,'#4d5650');
      for(let k=0;k<8;k++){const u=(k/7-.5)*1.22;b.box('iron',x+dx*u+nx*.73,low+.22,z+dz*u+nz*.73,.035,.83,.035,angle,'#4c554f');}
     }
    }
    if(length>3.5&&length<25){const gy=ground(mx,mz),at=(u,v)=>[mx+dx*u+nx*.07,v,mz+dz*u+nz*.07];b.quad('wood',at(-.58,gy+.04),at(.58,gy+.04),at(.58,Math.min(eave-.2,gy+2.28)),at(-.58,Math.min(eave-.2,gy+2.28)),'#71624f');b.box('stone',mx+nx*.08,gy+2.35,mz+nz*.08,1.37,.13,.19,angle,'#c6bba5');}
   }
   const distance=(x,z)=>Math.min(...rings.flatMap(ring=>ring.map((a,i)=>segmentDistance(x,z,a,ring[(i+1)%ring.length]).distance)));
   for(const triangle of triangles(p,holes))subdivide(...triangle,(a,c,d)=>{const yy=q=>eave+Math.min(roofRise,distance(q.x,q.z)*.38)+.035;b.triangle(roofRise?'tile':'plaster',[a.x,yy(a),a.z],[c.x,yy(c),c.z],[d.x,yy(d),d.z],roofRise?roofColor:scaleColor(roofColor,1.05));},roofRise?2.3:7);
   if(!roofRise&&area>25)for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length];b.quad('plaster',[a.x,eave,a.z],[c.x,eave,c.z],[c.x,eave+.22,c.z],[a.x,eave+.22,a.z],scaleColor(facade,.95));}
   qa.buildings.push({id:r.id,parentId:r.parentId,method,heightM:h,referenceBaseM:reference,roofSourceM:sourceRoof,roofDisplayM:roofTop,roofCorrectionM:roofTop-sourceRoof,courtyardCount:holes.length,areaM2:area});
  }
  for(const[id,b]of batches)grounded.add(b.finish('Caserío · '+id.replace('santa-maria-',''),id,'mixed',resources,textures));
 }
 function buildSurfaces(ground){
  streetBatches.clear();qa.groundSamples.length=0;stats.streetSamples=0;
  const paving=createPavingTessellator(ground),pave=(s,id,tint)=>{const p=clean(s.coordinates,project),holes=(s.holes||[]).map(r=>clean(r,project)),b=batchFor(id);paving.triangulate(p,holes,(a,c,d)=>{for(const [u,v,w]of publicRealm.clipPaving(a,c,d)){b.triangle('paving',u,v,w,tint);qa.groundSamples.push({x:(u[0]+v[0]+w[0])/3,z:(u[2]+v[2]+w[2])/3,y:(u[1]+v[1]+w[1])/3});}});};
  for(const s of sourceSurfaces)if(!publicRealm.replacedSurfaceIds.has(s.id))pave(s,s.id||'santa-maria-cervantes','#d2c6ae');
  for(const s of corridorSurfaces)pave(s,s.component||'santa-maria-cavallers','#c3baa7');
  // Legacy data can still build the narrow apron. With the documented public
  // envelope, its paving and the three centre-line ribbons have a single owner.
  if(!corridorSurfaces.length)for(const p of northApron){const b=batchFor('santa-maria-cavallers');paving.triangulate(p,[],(a,c,d)=>b.triangle('paving',a,c,d,'#c3baa7'));}
  qa.pavingTessellation={...paving.stats,gridStepM:.5,offsetM:.105,heightPolicy:'Shared grid vertex heights and shared cell planes; no independent per-face lift.'};
  const hard=(x,z)=>pointInPolygon(x,z,worldOutline)||occupied(x,z)||pointInPolygon(x,z,qa.northStair.footprint);
  for(const road of sourceRoads){
   if(road.area==='yes'||String(road.id)==='733321159'||publicRealm.replacedRoadIds.has(String(road.id))||(corridorSurfaces.length&&corridorRoadIds.has(String(road.id))))continue;
   const component=String(road.id)==='87554148'?'santa-maria-sagrario':String(road.id).startsWith('141920985')?'santa-maria-cervantes':'santa-maria-cavallers',b=batchFor(component),p=clean(road.coordinates,project),width=roadWidth(road);
   for(let i=1;i<p.length;i++){const a=p[i-1],c=p[i],length=Math.hypot(c.x-a.x,c.z-a.z);if(length<.04)continue;const nx=-(c.z-a.z)/length,nz=(c.x-a.x)/length,count=Math.ceil(length/1.2);
    const cross=t=>{const x=a.x+(c.x-a.x)*t,z=a.z+(c.z-a.z)*t,halves=[];for(const side of[-1,1]){let distance=width/2;for(let d=.18;d<width/2;d+=.18)if(hard(x+nx*d*side,z+nz*d*side)){distance=Math.max(.08,d-.12);break;}halves.push(distance);}return[{x:x-nx*halves[0],z:z-nz*halves[0]},{x:x+nx*halves[1],z:z+nz*halves[1]}];};
    for(let n=0;n<count;n++){const q0=cross(n/count),q1=cross((n+1)/count),q=[q0[0],q0[1],q1[1],q1[0]],yy=q.map(v=>ground(v.x,v.z)+.11);stats.streetSamples++;
     if(road.kind==='steps'){
      const lo=Math.min(...yy),hi=Math.max(...yy),treads=Math.max(1,Math.ceil((hi-lo)/.18));for(let step=0;step<treads;step++){const f0=step/treads,f1=(step+1)/treads,blend=(u,v,t)=>({x:u.x+(v.x-u.x)*t,z:u.z+(v.z-u.z)*t}),verts=[blend(q[0],q[3],f0),blend(q[1],q[2],f0),blend(q[1],q[2],f1),blend(q[0],q[3],f1)],y=lo+(hi-lo)*(step+1)/treads;b.quad('stone',...verts.map(v=>[v.x,y,v.z]),'#c9bca2');}
     }else{b.quad('paving',...q.map((v,j)=>[v.x,yy[j],v.z]),road.surface==='sett'?'#b7b3a5':'#c3baa7');}
     for(const[j,k]of[[0,3],[1,2]]){const v=q[j],u=q[k];b.quad('stone',[v.x,yy[j],v.z],[u.x,yy[k],u.z],[u.x,ground(u.x,u.z)-.32,u.z],[v.x,ground(v.x,v.z)-.32,v.z],'#aa9f88');}
     const qmid=mid(q);qa.groundSamples.push({x:qmid.x,z:qmid.z,y:yy.reduce((s,v)=>s+v,0)/4});
    }
   }
  }
  for(const[id,b]of streetBatches)grounded.add(b.finish(id==='santa-maria-cervantes'?'Plaça de Cervantes · planta OSM':'Pavimento y bordes · '+id.replace('santa-maria-',''),id,'mixed',resources,textures));
 }
 const focuses={},focusLocals=contextData.focusLocals||{'santa-maria-escalinata':[23.2,.35],'santa-maria-plaza-mayor':[56.556444,20.794145],'santa-maria-cavallers':[25.4,-16],'santa-maria-sagrario':[1.62,23.6],'santa-maria-berenguer':[-29.320773,19.929806]};
 const focusSpecs={
  'santa-maria-escalinata':{label:'Escalinata y lápidas romanas',height:()=>base+.5,far:[9,24,29],near:[4.7,8,14.5]},
  'santa-maria-plaza-mayor':{label:'Plaça Major y Almudín',height:(x,z)=>currentGround(x,z)+2.5,far:[18,29,30],near:[7,15,10]},
  'santa-maria-cavallers':{label:'Carrer dels Cavallers',height:(x,z)=>currentGround(x,z)+2,far:[4,24,25],near:[0,7.5,10]},
  'santa-maria-sagrario':{label:'Carrer del Sagrari',height:(x,z)=>currentGround(x,z)+2,far:[-15,28,4],near:[-12,14,3]},
  'santa-maria-berenguer':{label:'Casa dels Berenguer y su plaza',height:(x,z)=>currentGround(x,z)+5,far:[-30,32,25],near:[-10,19,6]}
 };
 const offset=a=>[a[0]*co+a[2]*si,a[1],-a[0]*si+a[2]*co];
 function updateFocuses(){for(const[id,coords]of Object.entries(focusLocals)){const spec=focusSpecs[id];if(!spec)continue;const p=world(...coords),target=new THREE.Vector3(p.x,spec.height(p.x,p.z),p.z),far=offset(spec.far),near=offset(spec.near);for(const v of[far,near])v[1]=Math.max(v[1],currentGround(target.x+v[0],target.z+v[2])+2.5-target.y);const bounds=new THREE.Box3(new THREE.Vector3(p.x-7,target.y-3,p.z-7),new THREE.Vector3(p.x+7,target.y+9,p.z+7));focuses[id]={id,label:spec.label,regionId:'sagunto',coordinate:geographical(p.x,p.z),coordinates:geographical(p.x,p.z),modelLocal:coords,target,offset:far,closeOffset:near,bounds,components:[id],kind:'context',sourceConfidence:'Source position; architectural detail and camera framing are interpretive.'};}}
 function applyMaterials(){group.traverse(mesh=>{if(!mesh.isMesh)return;const d=mesh.userData,m=mesh.material,periods=readingMode==='periods',vertexColors=!periods;if(m.vertexColors!==vertexColors){m.vertexColors=vertexColors;m.needsUpdate=true;}const map=periods?null:d.baseMap;if(m.map!==map){m.map=map;m.needsUpdate=true;}m.color.copy(d.baseColor);if(periods)m.color.set(PERIOD_COLORS[d.period]||PERIOD_COLORS.mixed);m.emissive.set(selected===d.component?'#4a3517':'#000000');m.emissiveIntensity=selected===d.component?.16:0;});}
 function bindGround(ground){if(disposed||typeof ground!=='function')return;currentGround=ground;disposeLayer(grounded);buildBuildings(ground);buildSurfaces(ground);publicRealm.build({Batch,resources,textures,ground,add:part=>grounded.add(part)});updateFocuses();applyMaterials();group.updateMatrixWorld(true);return api;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';applyMaterials();return readingMode;}
 function selectFocus(id){selected=publicRealm.selectionAliases[id]||(id&&focuses[id]?id:null);applyMaterials();return focuses[selected]||null;}
 function dispose(){if(disposed)return;disposed=true;for(const g of resources.geometries)g.dispose();for(const m of resources.materials)m.dispose();for(const t of resources.textures)t.dispose();resources.geometries.length=resources.materials.length=resources.textures.length=0;group.clear();}
 for(const s of sourceSurfaces)components.push({id:s.id||'santa-maria-cervantes',coordinates:s.coordinates,kind:'plaza',period:'mixed',interpretive:publicRealm.replacedSurfaceIds.has(s.id),sourceId:s.sourceId});
 for(const s of corridorSurfaces)components.push({id:s.id,coordinates:s.coordinates,holes:s.holes||[],kind:'street',closed:true,period:'mixed',interpretive:true,sourceIds:s.sourceIds});
 for(const r of sourceRoads)if(r.area!=='yes'&&String(r.id)!=='733321159')components.push({id:'street-'+r.id,coordinates:r.coordinates,kind:r.kind==='steps'?'stairs':'street',closed:false,period:'mixed',interpretive:false,sourceId:r.id});
 const plan={outline,components,center:coordinate,yaw},bounds=new THREE.Box3();
 const api={group,patches,exclusions,excludedBuildingIds,excludedRoadIds,focuses,bounds,plan,stats,qa,bindGround,setReadingMode,selectFocus,dispose,frame:{center,coordinate,base,yaw,toWorld:world,toLocal:local},ownedResources:resources,getState:()=>({selected,readingMode})};
 group.userData={id:'santa-maria-context',ownedResources:resources,stats,sourceKeys:qa.sourceKeys,interpretation:contextData.facadeNote||'Source footprints and terrain; schematic facades and roofs.'};
 bindGround(heightAt);bounds.setFromObject(group);return api;
}
