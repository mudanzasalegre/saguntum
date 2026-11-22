import * as THREE from 'three';

// V20 · Puerta meridional del circo de Saguntum.
// The surviving gate and excavated remains follow the published measurements
// and photographs. Registration within the present enclosure is approximate.
// The whole circus is a separate, explicitly interpretive archaeological view:
// its west closure, timber seating, elevations and turning posts are uncertain.
const PI = Math.PI;
const UP = new THREE.Vector3(0, 1, 0);
const IDENTITY = new THREE.Matrix4();
const LON = 111320 * Math.cos(39.679 * PI / 180);
const projectDefault = (lon, lat) => ({x:(lon + .278) * LON, z:(39.679 - lat) * 111320});
const geo = p => [-.278 + p.x / LON, 39.679 - p.z / 111320];
const noise = n => { const v = Math.sin(n * 127.13 + 34.19) * 43758.5453; return v - Math.floor(v); };

export const circoPeriods = [
  {id:'fabrica', label:'La puerta conservada', color:'#d5b77d'},
  {id:'excavacion', label:'Estructuras y estratos', color:'#b8a1bf'},
  {id:'espectaculo', label:'El edificio de espectáculos', color:'#ad685d'},
  {id:'interpretacion', label:'Restitución e hipótesis', color:'#7db9ba'},
  {id:'contemporanea', label:'Recinto y ciudad actual', color:'#86a7b1'}
];

const MATERIALS = {
  limestone:{color:'#b6b1a1', roughness:.98, texture:'limestone'},
  limestoneWarm:{color:'#b9ab91', roughness:1, texture:'limestone'},
  mortar:{color:'#918675', roughness:1, texture:'earth'},
  rubble:{color:'#b7a68d', roughness:1, texture:'rubble'},
  cobble:{color:'#a49f8e', roughness:1, texture:'rubble'},
  earth:{color:'#9d8667', roughness:1, texture:'earth'},
  clay:{color:'#aa9576', roughness:1, texture:'earth'},
  silt:{color:'#c3b59a', roughness:1, texture:'earth'},
  gravel:{color:'#bdad8c', roughness:1, texture:'gravel'},
  sand:{color:'#c8b894', roughness:1, texture:'sand'},
  concrete:{color:'#b7b7a9', roughness:.98, texture:'concrete'},
  coping:{color:'#c9c6b7', roughness:.94, texture:'concrete'},
  wood:{color:'#88725b', roughness:.91, texture:'wood'},
  woodDark:{color:'#514b40', roughness:.94, texture:'wood'},
  steel:{color:'#8b9697', roughness:.59, metalness:.5},
  blueMetal:{color:'#315d74', roughness:.64, metalness:.35},
  glass:{color:'#b8d5d5', roughness:.12, metalness:.08, opacity:.14},
  dark:{color:'#393c35', roughness:1},
  label:{color:'#dbd1b6', roughness:.92},
  hypothesis:{color:'#7bb8b9', roughness:.8, opacity:.34},
  water:{color:'#7eaaa7', roughness:.22, metalness:.08, opacity:.48}
};

function makeTexture(kind) {
  if (typeof document === 'undefined') {
    const t = new THREE.DataTexture(new Uint8Array([222,219,209,255]),1,1);
    t.needsUpdate = true; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = kind === 'wood' ? '#d7c4a8' : '#e1dcd1'; ctx.fillRect(0,0,256,256);
  if (kind === 'wood') {
    for (let i=0;i<100;i++) {
      ctx.beginPath(); ctx.moveTo(i*2.7,0);
      for (let y=0;y<=256;y+=8) ctx.lineTo(i*2.7+Math.sin(y*.032+i*.76)*1.6,y);
      ctx.strokeStyle = 'rgba(62,40,21,'+(.035+noise(i)*.19)+')'; ctx.lineWidth=.3+noise(i+20)*.9; ctx.stroke();
    }
  }
  for (let i=0;i<7000;i++) {
    const n=noise(i+9), light=i%3===0;
    ctx.fillStyle=(light?'rgba(255,251,235,':'rgba(50,43,28,')+(.015+n*(kind==='limestone'?.09:.13))+')';
    const r=(kind==='gravel'||kind==='rubble'?1.1:kind==='sand'?.35:.6)+noise(i+21)*1.45;
    ctx.fillRect(noise(i)*256,noise(i+411)*256,r,r*.73);
  }
  if (kind==='limestone') for(let i=0;i<24;i++) {
    ctx.beginPath(); const x=noise(i+7)*256,y=noise(i+80)*256;ctx.moveTo(x,y);ctx.lineTo(x+7+noise(i)*18,y-3+noise(i+1)*7);
    ctx.strokeStyle='rgba(65,62,47,.09)';ctx.lineWidth=.45;ctx.stroke();
  }
  if(kind==='rubble'||kind==='gravel') for(let i=0;i<180;i++) {
    const x=noise(i+1)*256,y=noise(i+6)*256,r=1+noise(i+10)*5;
    ctx.beginPath();ctx.ellipse(x,y,r,r*.7,noise(i)*PI,0,PI*2);ctx.fillStyle=i%2?'rgba(250,242,220,.15)':'rgba(62,55,40,.11)';ctx.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

class Batch {
  constructor() { this.parts=new Map(); const g=new THREE.BoxGeometry(1,1,1); this.cube=g.toNonIndexed();g.dispose(); }
  geom(key,geometry,matrix=IDENTITY,tint=1) {
    const g=geometry.index?geometry.toNonIndexed():geometry;if(!g.attributes.normal)g.computeVertexNormals();
    let a=this.parts.get(key);if(!a){a={p:[],n:[],u:[],c:[]};this.parts.set(key,a);}
    const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),nv=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(matrix),kind=key.split('|')[2],scale=kind==='wood'||kind==='woodDark'?2.2:kind==='limestone'?1.7:3.0;
    for(let i=0;i<p.count;i++) {
      v.fromBufferAttribute(p,i).applyMatrix4(matrix);nv.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();
      a.p.push(v.x,v.y,v.z);a.n.push(nv.x,nv.y,nv.z);
      const ax=Math.abs(nv.x),ay=Math.abs(nv.y),az=Math.abs(nv.z);
      a.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/scale,(ay>ax&&ay>az?v.z:v.y)/scale);a.c.push(tint,tint,tint);
    }
    if(g!==geometry)g.dispose();
  }
  box(key,x,y,z,w,h,d,yaw=0,tint=1) {
    if(w<=0||h<=0||d<=0)return;
    this.geom(key,this.cube,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(w,h,d)),tint);
  }
  raw(key,points,tint=1) {if(!points.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();this.geom(key,g,IDENTITY,tint);g.dispose();}
  cylinder(key,p,rt,rb,h,n=12,tint=1) {const g=new THREE.CylinderGeometry(rt,rb,h,n);this.geom(key,g,new THREE.Matrix4().makeTranslation(...p),tint);g.dispose();}
  beam(key,a,b,r=.025,n=6) {const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);if(v.length()<.001)return;const g=new THREE.CylinderGeometry(r,r,v.length(),n);this.geom(key,g,new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,v.normalize()),new THREE.Vector3(1,1,1)));g.dispose();}
  finish(group,resources,textures) {
    for(const[key,a]of this.parts) {
      const[component,period,kind]=key.split('|'),def=MATERIALS[kind];
      const mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness||0,map:def.texture?textures[def.texture]:null,vertexColors:true,side:THREE.DoubleSide,transparent:def.opacity!==undefined,opacity:def.opacity??1,depthWrite:def.opacity===undefined});
      if(def.texture){mat.bumpMap=textures[def.texture];mat.bumpScale=kind==='limestone'?.025:kind==='rubble'?.032:.012;}
      const g=new THREE.BufferGeometry();for(const[name,values,size]of[['position',a.p,3],['normal',a.n,3],['uv',a.u,2],['color',a.c,3]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,size));g.computeBoundingBox();g.computeBoundingSphere();
      const mesh=new THREE.Mesh(g,mat);mesh.name='Circo · '+component+' · '+kind;mesh.castShadow=!['glass','hypothesis','water'].includes(kind);mesh.receiveShadow=true;
      mesh.userData={circoFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap,baseOpacity:mat.opacity};
      group.add(mesh);resources.materials.push(mat);resources.geometries.push(g);
    }
    this.cube.dispose();
  }
}

function frame(x,z,yaw=0) {
  const c=Math.cos(yaw),s=Math.sin(yaw);
  return {x,z,yaw,p:(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c],world:(u,v)=>({x:x+u*c+v*s,z:z-u*s+v*c}),box:(b,k,u,y,v,w,h,d,angle=0,tint=1)=>b.box(k,x+u*c+v*s,y,z-u*s+v*c,w,h,d,yaw+angle,tint)};
}
const key=(component,period='fabrica')=>kind=>[component,period,kind].join('|');
const quad=(p,a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
const rect=(f,x,z,w,d)=>[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]].map(p=>f.world(...p));
function clean(points,project) {const a=points.map(p=>Array.isArray(p)?project(...p):p);if(a.length>2&&Math.hypot(a[0].x-a.at(-1).x,a[0].z-a.at(-1).z)<.03)a.pop();return a;}
function flat(b,k,poly,y,tint=1,holes=[]) {
  const triangles=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(p.x,-p.z)),holes.map(h=>h.map(p=>new THREE.Vector2(p.x,-p.z)))),all=[...poly,...holes.flat()],v=[];
  for(const t of triangles)v.push(...t.flatMap(i=>[all[i].x,y,all[i].z]));b.raw(k,v,tint);
}
function slab(b,k,poly,top,depth=.2,tint=1) {flat(b,k,poly,top,tint);const v=[];for(let i=0;i<poly.length;i++){const a=poly[i],c=poly[(i+1)%poly.length];quad(v,[a.x,top,a.z],[c.x,top,c.z],[c.x,top-depth,c.z],[a.x,top-depth,a.z]);}b.raw(k,v,tint*.96);}
function wall(b,k,a,c,base,top,width=.3,tint=1) {const dx=c.x-a.x,dz=c.z-a.z;b.box(k,(a.x+c.x)/2,(base+top)/2,(a.z+c.z)/2,Math.hypot(dx,dz),top-base,width,-Math.atan2(dz,dx),tint);}
function inside(p,poly) {let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes;}return yes;}
function block(b,k,f,x,y,z,w,h,d,seed=0,rotation=0,rough=.025) {
  const c=Math.cos(rotation),s=Math.sin(rotation),cut=Math.min(.07,Math.min(w,d)*.16),outline=[[-w/2+cut,-d/2],[w/2-cut*.7,-d/2],[w/2,-d/2+cut],[w/2,d/2-cut*.8],[w/2-cut,d/2],[-w/2+cut*.8,d/2],[-w/2,d/2-cut],[-w/2,-d/2+cut]],p=[];
  const at=(q,yy)=>f.p(x+q[0]*c+q[1]*s,yy,z-q[0]*s+q[1]*c),bottom=outline.map(q=>at(q,y)),top=outline.map((q,i)=>at(q,y+h-noise(seed+i)*rough));
  for(let i=1;i<top.length-1;i++)p.push(...top[0],...top[i],...top[i+1]);for(let i=0;i<top.length;i++)quad(p,bottom[i],bottom[(i+1)%top.length],top[(i+1)%top.length],top[i]);b.raw(k,p,.89+noise(seed)*.18);
}
function pebble(b,k,p,r,seed=0) {const g=new THREE.IcosahedronGeometry(1,0);g.scale(r[0],r[1],r[2]);g.rotateY(noise(seed)*PI);b.geom(k,g,new THREE.Matrix4().makeTranslation(...p),.86+noise(seed+8)*.23);g.dispose();}
function rubbleWall(b,K,f,a,c,y,height,width=.6,seed=0,footing=true) {
  const dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),p=f.world((a[0]+c[0])/2,(a[1]+c[1])/2),wf=frame(p.x,p.z,f.yaw+angle),rows=Math.max(2,Math.ceil(height/.24)),n=Math.ceil(length/.55);
  wf.box(b,K('mortar'),0,y+height*.43,0,length,height*.86,width*.86);
  if(footing) {
    const points=[],at=(x,yy,z)=>wf.p(x,yy,z),lower=.50,upper=width/2;
    quad(points,at(-length/2,y-.28,-lower),at(length/2,y-.28,-lower),at(length/2,y+.12,-upper),at(-length/2,y+.12,-upper));
    quad(points,at(length/2,y-.28,lower),at(-length/2,y-.28,lower),at(-length/2,y+.12,upper),at(length/2,y+.12,upper));b.raw(K('mortar'),points,.94);
    for(let i=0;i<Math.ceil(length/.24);i++)for(const side of[-1,1])pebble(b,K('cobble'),wf.p(-length/2+(i+.5)*length/Math.ceil(length/.24),y-.03+noise(seed+i)*.09,side*.39),[.12,.10,.11],seed+i);
  }
  for(let row=0;row<rows;row++)for(let i=0;i<n;i++) {
    const h=height/rows*(.84+noise(seed+row*37+i)*.17),x=-length/2+(i+.5)*length/n;
    block(b,K('rubble'),wf,x,y+row*height/rows,0,length/n-.025,h,width*(.91+noise(seed+11+i)*.06),seed+row*53+i,0,.045);
  }
}
function glassRail(b,K,a,c,y,height=1.04) {
  const length=Math.hypot(c.x-a.x,c.z-a.z),f=frame((a.x+c.x)/2,(a.z+c.z)/2,-Math.atan2(c.z-a.z,c.x-a.x)),n=Math.max(1,Math.ceil(length/1.45));
  f.box(b,K('steel'),0,y+height,0,length,.033,.042);
  for(let i=0;i<=n;i++){f.box(b,K('steel'),-length/2+i*length/n,y+height/2,0,.037,height,.047);f.box(b,K('steel'),-length/2+i*length/n,y+.04,0,.13,.08,.13);}
  for(let i=0;i<n;i++)f.box(b,K('glass'),-length/2+(i+.5)*length/n,y+height*.50,0,length/n-.065,height-.15,.018);
}
function meshFence(b,K,a,c,y,height=1.72) {
  const length=Math.hypot(c.x-a.x,c.z-a.z),f=frame((a.x+c.x)/2,(a.z+c.z)/2,-Math.atan2(c.z-a.z,c.x-a.x)),n=Math.max(1,Math.ceil(length/1.68));
  for(let i=0;i<=n;i++)f.box(b,K('blueMetal'),-length/2+i*length/n,y+height/2,0,.047,height+.06,.047);
  for(const h of[.06,height-.025])f.box(b,K('blueMetal'),0,y+h,0,length,.035,.035);
  for(let i=1;i<Math.ceil(length/.16);i++)f.box(b,K('blueMetal'),-length/2+i*.16,y+height/2,0,.008,height-.07,.008);
  for(let h=.22;h<height-.05;h+=.23)f.box(b,K('blueMetal'),0,y+h,0,length,.008,.008);
}
function stadium(f,left,arc,radius,segments=48) {const p=[f.world(left,-radius),f.world(arc,-radius)];for(let i=1;i<=segments;i++){const a=-PI/2+i*PI/segments;p.push(f.world(arc+Math.cos(a)*radius,Math.sin(a)*radius));}p.push(f.world(left,radius));return p;}
function arcWall(b,K,f,arc,radius,y,h,width,start=-PI/2,end=PI/2,n=40) {for(let i=0;i<n;i++){const a=start+(end-start)*i/n,c=start+(end-start)*(i+1)/n;wall(b,K,f.world(arc+Math.cos(a)*radius,Math.sin(a)*radius),f.world(arc+Math.cos(c)*radius,Math.sin(c)*radius),y,y+h,width,.95+noise(i)*.09);}}
function boundsFrom(poly,bottom,top) {return new THREE.Box3().setFromPoints(poly.flatMap(p=>[new THREE.Vector3(p.x,bottom,p.z),new THREE.Vector3(p.x,top,p.z)]));}

export function createCirco({record,project=projectDefault,heightAt=()=>30,visitData={},contextData={}}={}) {
  const registration=contextData.registration||{},coordinate=registration.modelCoordinate||registration.coordinate||registration.anchor||record?.coordinate||[-.275518,39.681049];
  const origin=project(...coordinate),yaw=registration.modelYaw??registration.yawRadians??registration.yaw??-.307,surface=heightAt(origin.x,origin.z),base=surface-(registration.baseDepthM??registration.baseDepth??2.25),deckY=base+.48,f=frame(origin.x,origin.z,yaw),cs=Math.cos(yaw),sn=Math.sin(yaw),rotate=o=>[o[0]*cs+o[2]*sn,o[1],-o[0]*sn+o[2]*cs];
  const local=p=>({x:(p.x-origin.x)*cs-(p.z-origin.z)*sn,z:(p.x-origin.x)*sn+(p.z-origin.z)*cs});
  const resources={materials:[],geometries:[],textures:[]},textures={};for(const type of new Set(Object.values(MATERIALS).map(q=>q.texture).filter(Boolean))){textures[type]=makeTexture(type);resources.textures.push(textures[type]);}
  const group=new THREE.Group(),remains=new THREE.Group(),reconstruction=new THREE.Group(),hypotheses=new THREE.Group(),modern=new THREE.Group(),retention=new THREE.Group(),protection=new THREE.Group(),sectionEvidence=new THREE.Group();
  group.name='Circo romano · puerta, recinto y trazado';remains.name='Circo · restos conservados';reconstruction.name='Circo · lectura histórica del edificio';hypotheses.name='Circo · restituciones opcionales';modern.name='Circo · acondicionamiento contemporáneo';retention.name='Circo · contención actual';protection.name='Circo · tarima y protección';sectionEvidence.name='Circo · lectura de estratos';group.add(remains,reconstruction,hypotheses,modern,sectionEvidence);modern.add(retention,protection);
  const a=new Batch(),r=new Batch(),h=new Batch(),m=new Batch(),ret=new Batch(),sec=new Batch();
  const fallbackLocal=[[-8.288,-4.286],[-8.253,2.885],[-1.810,2.851],[-1.806,3.714],[7.328,3.668],[7.289,-4.366]],outline=contextData.coreOutline?clean(contextData.coreOutline,project):fallbackLocal.map(p=>f.world(...p));
  const gatePosition=registration.gateCenterLocalXZ||registration.gateLocal||[-4.25,1.3],gx=gatePosition[0],gz=gatePosition[1],gateWidth=6.21,gateDepth=2.07,gateHeight=4.10,openingX=gx-.11,openingWidth=1.20,thresholdY=base+.25,openingTop=thresholdY+2.20;

  // Excavated ground is bounded by the actual irregular urban enclosure.
  slab(a,key('recinto','excavacion')('earth'),outline,base-.17,.34);
  flat(a,key('recinto','excavacion')('sand'),outline,base-.045,.98);
  const gateBounds=rect(f,gx,gz,gateWidth,gateDepth);

  // Quarried limestone courses. Left and right bonds intentionally differ,
  // matching the recorded construction asymmetry, not a regular modern grid.
  const sides=[{x0:gx-gateWidth/2,x1:openingX-openingWidth/2,levels:[.03,.47,.89,1.34,1.79,2.25,2.45],seed:83},{x0:openingX+openingWidth/2,x1:gx+gateWidth/2,levels:[.02,.57,1.03,1.46,1.91,2.45],seed:211}];
  function stoneCourse(x0,x1,bottom,top,seed,component='puerta',depth=gateDepth,z=gz) {
    const length=x1-x0,n=Math.max(1,Math.round(length/(.83+noise(seed)*.30))),weights=Array.from({length:n},(_,i)=>.7+noise(seed+i)*.65),sum=weights.reduce((s,n)=>s+n,0);let x=x0;
    for(let i=0;i<n;i++){const width=length*weights[i]/sum;block(a,key(component)('limestone'),f,x+width/2,base+bottom,z+(noise(seed+i+43)-.5)*.034,width-.017,top-bottom-.016,depth+(noise(seed+i+40)-.5)*.05,seed+i,0,.018);x+=width;}
  }
  for(const q of sides)for(let i=0;i<q.levels.length-1;i++)stoneCourse(q.x0,q.x1,q.levels[i],q.levels[i+1],q.seed+i*23);
  // A real rectangular passage remains open through the full 2.07 m depth.
  // The broad lower lintel and irregular adjoining blocks are not an arch.
  stoneCourse(gx-gateWidth/2,openingX-.84,2.45,2.88,310,'vano');
  block(a,key('vano')('limestone'),f,openingX,openingTop,gz,1.69,.415,gateDepth+.05,378,0,.012);
  stoneCourse(openingX+.86,gx+gateWidth/2,2.45,2.88,347,'vano');
  stoneCourse(gx-gateWidth/2,gx+gateWidth/2,2.88,3.28,401);
  stoneCourse(gx-gateWidth/2+.05,gx+gateWidth/2,3.28,3.64,456,'coronacion');
  stoneCourse(gx-gateWidth/2+.25,gx-gateWidth/2+1.29,3.64,4.04,499,'coronacion',gateDepth-.14);
  stoneCourse(gx+1.07,gx+gateWidth/2-.17,3.64,4.10,540,'coronacion',gateDepth-.12);
  // Surviving ledge fragments have interrupted lengths; missing mouldings
  // and the complete upper elevation are deliberately not filled in.
  for(const[x,w,yy,depth]of[[gx+2.13,1.84,3.37,2.30],[gx-2.45,1.06,3.61,2.18],[gx+2.01,1.65,3.64,2.19]])block(a,key('coronacion')('limestone'),f,x,base+yy,gz,w,.12,depth,600+Math.round(yy*20),0,.012);
  // White limestone floor slabs through the gate. The documented pivot socket
  // belongs to the separate podium threshold below, not to this opening.
  // Wheel ruts belong to the lost eastern triumphal access, a different gate.
  block(a,key('umbral')('limestone'),f,openingX,base+.02,gz,1.16,.23,gateDepth+.13,721,0,.018);
  for(let i=0;i<3;i++)block(a,key('umbral')('limestoneWarm'),f,openingX,base+.03,gz-gateDepth/2-.35-i*.43,1.15,.13,.40,751+i,0,.025);

  // Excavation: perimeter wall, interrupted inner wall, a filled department
  // interpreted as tribunal support, and the BOX of the stair (no Roman steps).
  const podiumZ=gz-3.60,passLeft=openingX-.60,passRight=openingX+.60,tribuneX0=passRight+.14,tribuneX1=tribuneX0+4.00,tribuneZ0=podiumZ+.30,tribuneZ1=gz-gateDepth/2;
  const wallSegments=[
    {id:'muros',a:[-7.78,podiumZ],b:[passLeft,podiumZ],height:1.04,width:.60},
    {id:'muros',a:[passRight,podiumZ],b:[tribuneX1+.30,podiumZ],height:1.28,width:.60},
    {id:'tribuna',a:[tribuneX1+.30,podiumZ],b:[tribuneX1+.30,gz],height:1.02,width:.60},
    {id:'tribuna',a:[gx+gateWidth/2,gz],b:[tribuneX1+.30,gz],height:.86,width:.58},
    {id:'tribuna',a:[tribuneX0-.18,podiumZ+.35],b:[tribuneX0-.18,gz-gateDepth/2],height:.91,width:.34},
    {id:'muros',a:[tribuneX1+.56,gz],b:[6.65,gz],height:.58,width:.63},
    {id:'fases',a:[4.40,gz-.1],b:[4.40,-1.25],height:.44,width:.43},
    {id:'fases',a:[4.40,-1.25],b:[6.48,-1.25],height:.35,width:.43}
  ];
  for(let i=0;i<wallSegments.length;i++){const w=wallSegments[i];rubbleWall(a,key(w.id,'excavacion'),f,w.a,w.b,base+.03,w.height,w.width,900+i*71,w.id!=='fases');}
  const tribunePoly=rect(f,(tribuneX0+tribuneX1)/2,(tribuneZ0+tribuneZ1)/2,tribuneX1-tribuneX0,tribuneZ1-tribuneZ0);
  slab(a,key('tribuna','excavacion')('earth'),tribunePoly,base+.89,.92,.93);
  for(let i=0;i<18;i++)pebble(a,key('tribuna','excavacion')('rubble'),f.p(tribuneX0+.2+noise(i+20)*(tribuneX1-tribuneX0-.4),base+.91,tribuneZ0+.14+noise(i+23)*(tribuneZ1-tribuneZ0-.3)),[.07+noise(i)*.06,.04,.07],1400+i);
  const stairBox={x:tribuneX1+1.21,z:-.18,w:1.18,d:2.12};
  for(const x of[stairBox.x-stairBox.w/2,stairBox.x+stairBox.w/2])rubbleWall(a,key('escaleras','excavacion'),f,[x,stairBox.z-stairBox.d/2],[x,stairBox.z+stairBox.d/2],base+.025,.43,.27,1800+Math.round(x*30),false);
  rubbleWall(a,key('escaleras','excavacion'),f,[stairBox.x-stairBox.w/2,stairBox.z-stairBox.d/2],[stairBox.x+stairBox.w/2,stairBox.z-stairBox.d/2],base+.025,.40,.27,1860,false);
  // The second passage turns west; its one-metre width is recorded.
  slab(a,key('interior','excavacion')('sand'),rect(f,openingX-.70,podiumZ+.64,2.25,1.00),base+.035,.08);
  block(a,key('umbral')('limestone'),f,openingX,base+.05,podiumZ,1.18,.20,.63,1920);
  a.cylinder(key('umbral')('dark'),f.p(openingX+.41,base+.255,podiumZ-.18),.06,.06,.008,14);
  // The protected older paving patch is 1.10 × 0.80 m. It is only revealed in
  // the analytical cut, not shown as an exposed pavement in today's enclosure.
  const oldPaving={x:5.73,z:-2.18,w:1.10,d:.80};
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)block(sec,key('estratos','excavacion')('limestoneWarm'),f,oldPaving.x+(i-.5)*.55,base-.01,oldPaving.z+(j-.5)*.40,.53,.11,.38,2050+i*17+j,.012,.025);
  for(let i=0;i<38;i++){const x=-7.6+noise(i+18)*14.1,z=-2.8+noise(i+71)*5.6;if(!inside(f.world(x,z),outline)||Math.abs(x-openingX)<.8||inside(f.world(x,z),gateBounds)||inside(f.world(x,z),tribunePoly)||Math.abs(x-stairBox.x)<.95)continue;pebble(a,key('recinto','excavacion')('cobble'),f.p(x,base+.025,z),[.04+noise(i)*.10,.035,.04+noise(i+5)*.08],2200+i);}

  // Current enclosure: pale retaining concrete, blue permeable fence, timber
  // visitor deck, glass panels and a contemporary stair on its west end.
  const localOutline=outline.map(local);
  for(let i=0;i<outline.length;i++){
    const p=outline[i],q=outline[(i+1)%outline.length],south=(localOutline[i].z+localOutline[(i+1)%outline.length].z)/2>2.5;
    wall(ret,key('contencion','contemporanea')('concrete'),p,q,base-.20,surface-.08,.30,south?.94:1);
    wall(ret,key('contencion','contemporanea')('coping'),p,q,surface-.08,surface+.06,.36);
    // No rail is invented along the west party wall; entry is at its north end.
    if(i!==0)meshFence(m,key('cerramiento','contemporanea'),p,q,surface+.07,1.72);
  }
  const deck={x:.80,z:-3.58,w:11.8,d:1.12};
  const deckPoly=rect(f,deck.x,deck.z,deck.w,deck.d);slab(m,key('pasarela','contemporanea')('woodDark'),deckPoly,deckY-.075,.11);
  for(let i=0;i<Math.ceil(deck.w/.17);i++){const xx=deck.x-deck.w/2+(i+.5)*deck.w/Math.ceil(deck.w/.17);f.box(m,key('pasarela','contemporanea')('wood'),xx,deckY-.025,deck.z,deck.w/Math.ceil(deck.w/.17)-.011,.055,deck.d,0,.87+noise(i+20)*.20);}
  for(let x=-4.8;x<6.6;x+=1.8)for(const z of[deck.z-.40,deck.z+.40])f.box(m,key('pasarela','contemporanea')('steel'),x,(base+deckY)/2,z,.045,deckY-base,.055);
  glassRail(m,key('pasarela','contemporanea'),f.world(-5.10,deck.z+.57),f.world(6.70,deck.z+.57),deckY);
  glassRail(m,key('pasarela','contemporanea'),f.world(6.70,deck.z-.53),f.world(6.70,deck.z+.57),deckY);
  const stair={x0:-5.12,x1:-7.66,z:deck.z,width:1.02,steps:10},rise=(surface-deckY)/stair.steps,run=(stair.x0-stair.x1)/stair.steps;
  for(let i=0;i<stair.steps;i++){const x=stair.x0-(i+.5)*run,top=deckY+(i+1)*rise;f.box(m,key('acceso','contemporanea')('wood'),x,top-.033,stair.z,run-.012,.066,stair.width,0,.90+noise(i)*.14);}
  for(const z of[stair.z-stair.width/2,stair.z+stair.width/2]){
    m.beam(key('acceso','contemporanea')('steel'),f.p(stair.x0,deckY-.10,z),f.p(stair.x1,surface-.10,z),.045,8);
    m.beam(key('acceso','contemporanea')('steel'),f.p(stair.x0,deckY+1.00,z),f.p(stair.x1,surface+1.00,z),.025,8);
    for(let i=0;i<=5;i++){const t=i/5,x=stair.x0+(stair.x1-stair.x0)*t,y=deckY+(surface-deckY)*t;f.box(m,key('acceso','contemporanea')('steel'),x,y+.48,z,.034,1.04,.034);}
  }
  for(const x of[-3.7,4.8]){f.box(m,key('pasarela','contemporanea')('steel'),x,deckY+.53,deck.z+.39,.035,1.06,.035);f.box(m,key('pasarela','contemporanea')('label'),x,deckY+1.06,deck.z+.39,.52,.25,.028);}

  // An analytical section is only shown in the cut mode. These strata are a
  // diagram of the reported alluvial sequence, not a presently exposed wall.
  const profileX=7.105,profileZ=.06,profileLength=5.15,profileBands=[[-.16,.22,'gravel'],[.22,.66,'clay'],[.66,1.02,'silt'],[1.02,1.75,'earth'],[1.75,2.16,'clay']];
  for(let i=0;i<profileBands.length;i++){const[lo,hi,material]=profileBands[i];f.box(sec,key('estratos','excavacion')(material),profileX,base+(lo+hi)/2,profileZ,.12,hi-lo,profileLength,0,.94+noise(i)*.10);}
  for(let i=0;i<32;i++)pebble(sec,key('estratos','excavacion')('cobble'),f.p(profileX-.075,base+.02+noise(i+5)*.17,profileZ-profileLength/2+noise(i+6)*profileLength),[.06,.06,.10],2600+i);

  // Whole-circus interpretation. The gate fixes the southern alignment; the
  // 273 × 70 m outline follows the 2017 working hypothesis (270–290 × 68–70 m).
  const dimensions={length:273,width:70,uncertainLength:[270,290],uncertainWidth:[68,70]},R=35,left=-136.5,curve=101.5,innerR=24,gateU=80,centre=f.world(gx-gateU,gz-R),cf=frame(centre.x,centre.z,yaw),groundY=base+.02;
  const circusOutline=stadium(cf,left,curve,R),arenaOutline=stadium(cf,left+9,curve,innerR);
  slab(r,key('trazado','interpretacion')('earth'),stadium(cf,left-2.4,curve,R+2.4),groundY-.055,.28);
  flat(r,key('arena','espectaculo')('sand'),arenaOutline,groundY+.007);
  const outerK=key('graderio','espectaculo');
  for(const side of[-1,1]){
    const z=side*R,segments=side>0?[[left,gateU-gateWidth/2],[gateU+gateWidth/2,curve]]:[[left,curve]];
    for(const[x0,x1]of segments)wall(r,outerK('rubble'),cf.world(x0,z),cf.world(x1,z),groundY,groundY+1.55,.62);
    // Low foundations are defensible; a complete masonry amphitheatre is not.
    wall(r,outerK('mortar'),cf.world(left+4,side*(R-3.5)),cf.world(curve,side*(R-3.5)),groundY,groundY+.62,.60);
    const innerSegments=side>0?[[left+9,gateU-5.0],[gateU+7.3,curve]]:[[left+9,curve]];
    for(const[x0,x1]of innerSegments)wall(r,outerK('rubble'),cf.world(x0,side*innerR),cf.world(x1,side*innerR),groundY,groundY+1.25,.60);
    for(let x=left+7;x<curve;x+=5.4){if(side>0&&x>gateU-6&&x<gateU+8)continue;wall(r,outerK('mortar'),cf.world(x,side*(innerR+.5)),cf.world(x,side*(R-.5)),groundY,groundY+.58,.52);}
  }
  arcWall(r,outerK('rubble'),cf,curve,R,groundY,1.55,.62);arcWall(r,outerK('rubble'),cf,curve,innerR,groundY,1.25,.60);
  for(let i=0;i<=18;i++){const angle=-PI/2+i*PI/18;wall(r,outerK('mortar'),cf.world(curve+Math.cos(angle)*(innerR+.5),Math.sin(angle)*(innerR+.5)),cf.world(curve+Math.cos(angle)*(R-.4),Math.sin(angle)*(R-.4)),groundY,groundY+.58,.50);}
  // The local passage is kept open across the putative seating footprint.
  slab(r,key('interior','excavacion')('sand'),rect(cf,gateU,28.8,2.05,12.4),groundY+.025,.10);
  // Central euripus: published 190 m long and 4.35 m wide. The water is optional.
  const spina={x:2,z:.8,length:190,width:4.35};
  slab(r,key('spina','espectaculo')('limestoneWarm'),rect(cf,spina.x,spina.z,spina.length,spina.width),groundY+.45,.46);
  flat(r,key('spina','espectaculo')('mortar'),rect(cf,spina.x,spina.z,spina.length-.75,spina.width-.75),groundY+.46,.92);
  for(const side of[-1,1]){
    cf.box(r,key('spina','espectaculo')('limestone'),spina.x,groundY+.74,spina.z+side*(spina.width/2-.17),spina.length,.58,.34);
    for(let x=spina.x-spina.length/2+.95;x<spina.x+spina.length/2;x+=1.9)cf.box(r,key('spina','espectaculo')('mortar'),x,groundY+.74,spina.z+side*(spina.width/2+.004),.016,.55,.012);
  }
  for(const x of[spina.x-spina.length/2+.17,spina.x+spina.length/2-.17])cf.box(r,key('spina','espectaculo')('limestone'),x,groundY+.74,spina.z,.34,.58,spina.width);
  cf.box(h,key('spina','interpretacion')('water'),spina.x,groundY+.82,spina.z,spina.length-.72,.012,spina.width-.72);
  // Timber seating: a legible optional hypothesis, with sparse supports and
  // narrow boards. Rows stop at the conserved gate rather than burying it.
  const rows=9;
  for(const side of[-1,1])for(let row=0;row<rows;row++){
    const rad=innerR+.85+row*.92,y=groundY+1.35+row*.30;
    for(const[x0,x1]of(side>0?[[left+6,gateU-4.4],[gateU+6.6,curve]]:[[left+6,curve]]))cf.box(h,key('graderio','interpretacion')('wood'),(x0+x1)/2,y,side*rad,x1-x0,.10,.62,0,.88+noise(row)*.15);
    for(let i=0;i<38;i++){const a0=-PI/2+i*PI/38,a1=-PI/2+(i+1)*PI/38;wall(h,key('graderio','interpretacion')('wood'),cf.world(curve+Math.cos(a0)*rad,Math.sin(a0)*rad),cf.world(curve+Math.cos(a1)*rad,Math.sin(a1)*rad),y-.05,y+.05,.62,.9+noise(row+i)*.14);}
  }
  for(const side of[-1,1])for(let x=left+9;x<curve;x+=7.4){if(side>0&&x>gateU-6&&x<gateU+8)continue;for(const radial of[innerR+1.2,R-2.0]){const y=groundY+1.4+(radial-innerR)*.30;cf.box(h,key('graderio','interpretacion')('woodDark'),x,groundY+(y-groundY)/2,side*radial,.14,y-groundY,.16);}h.beam(key('graderio','interpretacion')('woodDark'),cf.p(x,groundY+1.2,side*(innerR+.8)),cf.p(x,groundY+4.0,side*(R-1.3)),.065,6);}
  // Three turning posts at each end are comparative, not finds from this plot.
  for(const x of[spina.x-spina.length/2-2,spina.x+spina.length/2+2]){
    cf.box(h,key('metae','interpretacion')('hypothesis'),x,groundY+.30,spina.z,2.0,.60,4.5);
    for(let j=0;j<3;j++)h.cylinder(key('metae','interpretacion')('hypothesis'),cf.p(x,groundY+1.63,spina.z+(j-1)*1.30),.07,.44,2.05,16);
  }
  // Lost western starting line: a translucent schematic line with openings,
  // without towers, roof or unsupported imperial decorative architecture.
  const carceresX=left+1.2;
  for(let i=0;i<=8;i++)cf.box(h,key('carceres','interpretacion')('hypothesis'),carceresX,groundY+1.35,-24+i*6,.80,2.70,.45);
  cf.box(h,key('carceres','interpretacion')('hypothesis'),carceresX,groundY+2.80,0,.80,.20,48.8);
  for(let z=-33;z<34;z+=2.2)cf.box(h,key('carceres','interpretacion')('hypothesis'),left,groundY+.04,z,.22,.08,1.15);
  // Tribunal is only a schematic platform above the excavated support; its
  // elevation and timber balustrade can be toggled with the other hypotheses.
  slab(h,key('tribuna','interpretacion')('hypothesis'),tribunePoly,groundY+1.9,.18);

  a.finish(remains,resources,textures);r.finish(reconstruction,resources,textures);h.finish(hypotheses,resources,textures);m.finish(protection,resources,textures);ret.finish(retention,resources,textures);sec.finish(sectionEvidence,resources,textures);
  const meshes=[];group.traverse(q=>{if(q.isMesh&&q.userData.circoFabric){q.userData.archaeologicalSite='circo';meshes.push(q);}});group.updateMatrixWorld(true);
  const currentBounds=boundsFrom(outline,base-.18,surface+1.85),historicalBounds=boundsFrom(circusOutline,groundY-.2,groundY+5.2),state={selected:'circo-conjunto',readingMode:'materials',mode:'current',active:false,sectionOpen:false,hypotheses:true,roofOpen:true,coverShown:true,opening:1};
  currentBounds.expandByPoint(new THREE.Vector3(...f.p(gx,base+gateHeight,gz)));
  const definitions=[
    ['conjunto','La puerta dentro de la ciudad',-.48,-.33,base+1.15,[8,28,-13],[11,12,-14],['puerta','recinto'],'contemporanea','current','gate',false,0,52],
    ['acceso','Acceso y pasarela actuales',-6.4,deck.z,surface+.18,[8.0,6.2,-8.5],[4.8,3.8,-5.5],['acceso','pasarela','cerramiento'],'contemporanea','current','gate',false,0,60],
    ['puerta','La puerta meridional conservada',gx,gz,base+2.0,[5.0,5.0,-9.0],[3.1,2.9,-6.4],['puerta','vano','coronacion'],'fabrica','current','gate',false,-1,55],
    ['vano','Un vano realmente abierto',openingX,gz,base+1.42,[.15,.40,-4.0],[.06,.12,-2.65],['vano','puerta','umbral'],'fabrica','cut','gate',true,-1,58],
    ['sillares','Sillares y juntas desiguales',gx+1.55,gz-gateDepth/2,base+1.72,[1.1,1.2,-3.1],[.55,.65,-2.0],['puerta'],'fabrica','cut','gate',true,-1,53],
    ['umbral','El umbral y el gozne',openingX,podiumZ,base+.24,[1.3,2.8,-1.1],[.7,1.65,-1.45],['umbral','interior'],'fabrica','cut','gate',true,-1,55],
    ['coronacion','Una coronación incompleta',gx+.9,gz,base+3.57,[3.3,2.8,-4.2],[2.1,1.65,-2.7],['coronacion','vano'],'fabrica','cut','gate',true,-1,53],
    ['interior','El paso hacia la arena',openingX,gz-1.72,base+.72,[.1,3.0,-2.7],[.07,1.2,-3.0],['interior','umbral','muros'],'excavacion','cut','gate',true,-1,60],
    ['muros','Muros y cimentación',-6.30,podiumZ,base+.65,[2.0,3.4,-1.2],[1.2,2.1,-.8],['muros'],'excavacion','cut','gate',false,-1,56],
    ['tribuna','El departamento de la tribuna',(tribuneX0+tribuneX1)/2,(tribuneZ0+tribuneZ1)/2,base+.70,[5.0,7.0,-5.7],[3.2,4.5,-3.7],['tribuna','muros'],'excavacion','cut','gate',false,-1,57],
    ['escaleras','La caja de la escalera',stairBox.x,stairBox.z,base+.30,[2.7,4.0,-3.4],[1.8,2.8,-2.3],['escaleras','tribuna'],'excavacion','cut','gate',false,-1,57],
    ['estratos','El suelo anterior al circo',5.9,-1.25,base+.65,[-4.5,3.8,-3.4],[-2.9,2.45,-2.2],['estratos','fases'],'excavacion','cut','gate',true,-1,60],
    ['arena','La pista de las carreras',25,-10,groundY+.25,[42,30,-43],[27,20,-29],['arena','interior'],'espectaculo','historical','circus',false,-1,54],
    ['spina','El euripus de la spina',spina.x,spina.z,groundY+.8,[31,36,-43],[20,23,-28],['spina'],'espectaculo','historical','circus',false,-1,56],
    ['metae','Girar en torno a las metas',99.5,spina.z,groundY+1.15,[-13,12,-17],[-8,7.8,-11],['metae','spina'],'interpretacion','historical','circus',false,-1,57],
    ['graderio','Graderío y estructuras de apoyo',-16,-29.5,groundY+1.8,[14,15,18],[9,10,12],['graderio'],'espectaculo','historical','circus',false,-1,57],
    ['historica','El trazado que la ciudad oculta',0,0,groundY+.75,[30,280,-45],[21,196,-31.5],['trazado','arena','spina'],'interpretacion','historical','circus',false,-1,48],
    ['carceres','El cierre occidental perdido',carceresX,0,groundY+1.0,[35,26,-37],[23,17,-24],['carceres'],'interpretacion','historical','circus',false,-1,56],
    ['fases','Abandono, reutilización y excavación',4.55,.3,base+.45,[-4.0,5.0,-4.5],[-2.6,3.3,-3.0],['fases','estratos'],'excavacion','cut','gate',false,-1,58],
    ['entorno','Huertos, Remei y la ciudad',-.5,-.4,surface+2.0,[31,28,-36],[21,19,-25],['cerramiento','contencion'],'contemporanea','current','gate',false,0,51]
  ];
  const focuses={};for(const[short,label,x,z,y,offset,closeOffset,components,period,mode,mapScope,interiorView,floor,fov]of definitions){const ff=mapScope==='circus'?cf:f,p=ff.world(x,z),target=new THREE.Vector3(p.x,y,p.z),id='circo-'+short;focuses[id]={id,label,target,coordinates:geo(p),offset:rotate(offset),closeOffset:rotate(closeOffset),components,regionId:period,readingLayer:period,period,kind:short==='conjunto'?'overview':'feature',bounds:new THREE.Box3(target.clone().addScalar(-2),target.clone().addScalar(2)),fitBounds:false,interiorView,floor,recommendedMode:mode,requiresSection:mode==='cut',minDistance:interiorView?.25:.8,fov,closeScale:false,mapScope,sourceConfidence:mapScope==='circus'?'published-working-hypothesis':'published-measurements-and-photographic-registration'};}
  focuses['circo-conjunto'].bounds=currentBounds.clone();focuses['circo-conjunto'].fitBounds=true;
  focuses['circo-historica'].bounds=historicalBounds.clone();focuses['circo-historica'].fitBounds=true;
  focuses['circo-puerta'].bounds=boundsFrom(gateBounds,base,base+gateHeight);
  const getFocus=(id,mode=state.mode)=>{const q=focuses[id];if(!q)return null;if(id==='circo-conjunto'&&mode==='historical')return{...focuses['circo-historica'],id,label:q.label,kind:'overview'};if(id==='circo-conjunto'&&mode==='cut')return{...q,offset:rotate([2.5,21,-7]),closeOffset:rotate([1.7,15,-5]),target:new THREE.Vector3(...f.p(-.48,base+.65,-.33)),floor:-1};return q;};
  const components=[
    {id:'recinto',label:'Recinto excavado',period:'contemporanea',coordinates:outline.map(geo),kind:'room',stopId:'circo-conjunto',scope:'gate',floors:[-1,0],closed:true,interpretive:false},
    {id:'puerta',label:'Cuerpo de la puerta · 6,21 × 2,07 m',period:'fabrica',coordinates:gateBounds.map(geo),kind:'building',stopId:'circo-puerta',scope:'gate',floors:[-1,0],closed:true,interpretive:false},
    {id:'vano',label:'Vano · 1,20 m',period:'fabrica',coordinates:rect(f,openingX,gz,openingWidth,gateDepth+.24).map(geo),kind:'path',stopId:'circo-vano',scope:'gate',floors:[-1],closed:true,interpretive:false},
    {id:'tribuna',label:'Soporte interpretado de la tribuna',period:'excavacion',coordinates:tribunePoly.map(geo),kind:'room',stopId:'circo-tribuna',scope:'gate',floors:[-1],closed:true,interpretive:true},
    {id:'escaleras',label:'Caja de la escalera conservada',period:'excavacion',coordinates:rect(f,stairBox.x,stairBox.z,stairBox.w,stairBox.d).map(geo),kind:'room',stopId:'circo-escaleras',scope:'gate',floors:[-1],closed:true,interpretive:true},
    {id:'pasarela',label:'Pasarela contemporánea',period:'contemporanea',coordinates:deckPoly.map(geo),kind:'path',stopId:'circo-acceso',scope:'gate',floors:[-1,0],closed:true,interpretive:true},
    {id:'estratos',label:'Enlosado anterior · UC 211',period:'excavacion',coordinates:rect(f,oldPaving.x,oldPaving.z,oldPaving.w,oldPaving.d).map(geo),kind:'room',stopId:'circo-estratos',scope:'gate',floors:[-1],closed:true,interpretive:true},
    {id:'trazado',label:'Perímetro interpretativo · ca. 273 × 70 m',period:'interpretacion',coordinates:circusOutline.map(geo),kind:'room',stopId:'circo-historica',scope:'circus',floors:[-1],closed:true,interpretive:true},
    {id:'arena',label:'Arena del circo',period:'espectaculo',coordinates:arenaOutline.map(geo),kind:'room',stopId:'circo-arena',scope:'circus',floors:[-1],closed:true,interpretive:true},
    {id:'spina',label:'Euripus y spina · 190 × 4,35 m',period:'espectaculo',coordinates:rect(cf,spina.x,spina.z,spina.length,spina.width).map(geo),kind:'room',stopId:'circo-spina',scope:'circus',floors:[-1],closed:true,interpretive:true},
    {id:'carceres',label:'Cierre occidental · posición incierta',period:'interpretacion',coordinates:rect(cf,carceresX,0,2.8,56).map(geo),kind:'room',stopId:'circo-carceres',scope:'circus',floors:[-1],closed:true,interpretive:true},
    {id:'graderio',label:'Graderío · restitución volumétrica',period:'interpretacion',coordinates:rect(cf,-16,-29.5,44,10.0).map(geo),kind:'room',stopId:'circo-graderio',scope:'circus',floors:[-1],closed:true,interpretive:true}
  ];
  for(let i=0;i<wallSegments.length;i++){const q=wallSegments[i];components.push({id:'muro-'+i,label:q.id==='fases'?'Reutilización y compartimentación':'Estructura conservada',period:'excavacion',coordinates:[f.world(...q.a),f.world(...q.b)].map(geo),kind:'wall',stopId:'circo-'+q.id,scope:'gate',floors:[-1],interpretive:true});}
  for(const[side,x]of[['occidental',spina.x-spina.length/2-2],['oriental',spina.x+spina.length/2+2]])components.push({id:'meta-'+side,label:'Meta '+side+' · hipótesis',period:'interpretacion',coordinates:rect(cf,x,spina.z,2.5,5.0).map(geo),kind:'room',stopId:'circo-metae',scope:'circus',floors:[-1],closed:true,interpretive:true});
  const plan={id:'circo',label:'Puerta del Circo Romano · restos y trazado',coordinate:geo(origin),outline:outline.map(geo),archaeologyOutline:outline.map(geo),circusOutline:circusOutline.map(geo),components,stops:Object.values(focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,mapScope:q.mapScope,sourceConfidence:q.sourceConfidence})),floors:[{id:-1,label:'Puerta y nivel arqueológico',elevation:base},{id:0,label:'Ciudad actual',elevation:surface}],note:'Puerta y restos según Bru i Vidal y la intervención de López, Sañudo y Verdasco (2017). Registro proporcional dentro del recinto OSM, no levantamiento del subsuelo. Trazado global: hipótesis de Melchor et al. (2017), 270–290 × 68–70 m, cierre occidental desconocido. La anchura de la cavea y el acceso local proceden de lecturas arqueológicas distintas.'};
  const periods=visitData.readingLegend?.length?visitData.readingLegend:circoPeriods,colors=Object.fromEntries(periods.map(q=>[q.id,q.color]));
  function repaint(){for(const mesh of meshes){const d=mesh.userData,mat=mesh.material;mat.color.copy(d.baseColor);mat.map=d.baseMap;mat.bumpMap=d.baseBumpMap;if(state.readingMode==='periods'){mat.color.set(colors[d.period]||'#acae9c');mat.map=null;mat.bumpMap=null;}mat.emissive.set(focuses[state.selected]?.components.includes(d.component)?'#ac925f':'#000000');mat.emissiveIntensity=.042;mat.needsUpdate=true;}}
  function setPresentation(settings={}) {
    for(const name of['mode','opening','coverShown','roofOpen','hypotheses'])if(settings[name]!==undefined)state[name]=settings[name];if(settings.selected!==undefined)state.active=!!settings.selected;
    const historical=state.mode==='historical',cut=state.mode==='cut';state.sectionOpen=cut;
    remains.visible=true;modern.visible=!historical;reconstruction.visible=historical;hypotheses.visible=historical&&!!state.hypotheses;sectionEvidence.visible=cut;
    // Section mode makes present visitor fittings translucent, without
    // inventing a roof or removing the surviving ancient masonry.
    const amount=cut?Math.max(0,Math.min(1,state.opening)):0;
    protection.visible=!cut||state.coverShown;
    protection.traverse(q=>{if(!q.isMesh)return;const mat=q.material,opacity=q.userData.baseOpacity;mat.opacity=opacity*(1-.92*amount);mat.transparent=mat.opacity<1;mat.depthWrite=amount<.03&&opacity===1;mat.needsUpdate=true;});
    group.updateMatrixWorld(true);return{...state};
  }
  const selectFocus=id=>{state.selected=id&&focuses[id]?id:null;repaint();return getFocus(id);};
  const setReadingMode=mode=>{state.readingMode=mode==='periods'?'periods':'materials';repaint();};
  const setSection=open=>{setPresentation({mode:open?'cut':'current'});return state.sectionOpen;};
  const bindGround=finalHeightAt=>{if(typeof finalHeightAt!=='function')return;for(const focus of Object.values(focuses)){if(focus.floor===-1)continue;for(const k of['offset','closeOffset']){const o=focus[k],y=finalHeightAt(focus.target.x+o[0],focus.target.z+o[2]);if(Number.isFinite(y)&&focus.target.y+o[1]<y+1.15)o[1]=y+1.15-focus.target.y;}}};
  const cutSpec=contextData.surfaceApron?.cut||contextData.cut||registration.currentMask||{},maskCentre=f.world(...(cutSpec.centerLocalXZ||[-.48,-.33])),currentMask={center:cutSpec.center||maskCentre,width:cutSpec.width??cutSpec.widthM??16.4,depth:cutSpec.depth??cutSpec.depthM??8.9,yaw:cutSpec.yaw??yaw,floorY:base-.38,clipContext:false,clipTerrain:false,permanent:true};
  const cut={...currentMask,permanent:false},historicalMask={center:{x:centre.x,z:centre.z},width:dimensions.length+5.4,depth:dimensions.width+5.4,yaw,floorY:base-.38,clipContext:true,clipTerrain:true,permanent:false,includeSiteContext:true};
  const stats={modelVersion:'v20',gate:[gateWidth,gateDepth,gateHeight],opening:[openingWidth,2.20],tribuneAreaPublished:9,podiumWidth:.60,podiumHeightMaximumPublished:1.50,stairBoxOnly:true,circusWorkingHypothesis:[273,70],circusLengthRange:[270,290],circusWidthRange:[68,70],euripus:[190,4.35],stops:definitions.length,gateStops:14,circusStops:6,meshes:meshes.length,triangles:meshes.reduce((sum,q)=>sum+(q.geometry.index?.count||q.geometry.attributes.position.count)/3,0),hypotheses:['timber seating','turning posts','west closure','water','tribunal elevation'],verticalPlacement:'interpretative',survey:false};
  const qa={baseY:base,surfaceY:surface,deckY,frame:{x:origin.x,z:origin.z,yaw},modelRegistration:{coordinate:geo(origin),yaw,baseDepth:surface-base,gateLocal:[gx,gz],method:'Approximate photographic registration inside the OSM enclosure, with published gate dimensions; no archaeological survey coordinates'},coreOutline:outline,gate:{x:gx,z:gz,width:gateWidth,depth:gateDepth,height:gateHeight,openingX,openingWidth,openingHeight:2.20,thresholdY,courseAsymmetry:true,completeArch:false},podiumThreshold:{x:openingX,z:podiumZ,y:base+.25,pivotSockets:1},wallSegments,tribune:{polygon:tribunePoly,areaPublished:9,registration:'proportional, not a measured plan'},stairBox,deck,stair,oldPaving,analyticalSection:{onlyMode:'cut',reportedUnits:['206','207','208','210','211'],schematic:true},circus:{frame:{x:centre.x,z:centre.z,yaw},dimensions,gateU,outerRadius:R,innerRadius:innerR,westClosureKnown:false,outline:circusOutline},sourcePlan:'López, Sañudo y Verdasco (2017), pp.103–123; Civera (2017), pp.74–75 after Bru; Melchor et al. (2017), fig.17 and pp.43–44',archaeologyElevationSurvey:false};
  const visit={focuses,bounds:currentBounds,plan,stats,qa,periods,getFocus,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({...state}),sectionAvailable:true,metadata:{model:'documented-interpretation',interiorSurvey:false,sourcePlan:qa.sourcePlan,modern:'Open enclosure, blue mesh fence, retaining concrete, wood deck and glass rails interpreted from site photography',historical:'Working hypothesis of the full circus, separate from the preserved gate. Seating, west closure, turning posts, water and tribunal elevation are optional interpretations.',evidence:'Published gate dimensions and passage; preserved stair box, filled compartment and opus caementicium walls. The analytical profile represents a reported alluvial sequence, not the current exposed retaining wall.'},renderStops:['circo-conjunto','circo-puerta','circo-vano','circo-tribuna','circo-estratos','circo-historica']};
  group.userData.visit=visit;group.userData.resources=resources;group.userData.ownedResources=resources;group.userData.landmarkId='circo';repaint();setPresentation();
  return {id:'circo',group,remains,reconstruction,hypotheses,modern,retention,protection,sectionEvidence,point:focuses['circo-conjunto'].target.clone(),views:{offset:focuses['circo-conjunto'].offset,closeOffset:focuses['circo-conjunto'].closeOffset},view:{target:focuses['circo-conjunto'].target.clone(),offset:focuses['circo-conjunto'].offset,closeOffset:focuses['circo-conjunto'].closeOffset},cut,currentMask,historicalMask,containsSubsurface:(x,z)=>state.mode==='historical'?inside({x,z},stadium(cf,left-2.4,curve,R+2.4)):inside({x,z},outline),stats,visit,setPresentation,setSection,exclusions:[],patches:[],excludedBuildingIds:[],excludedRoadIds:[]};
}
