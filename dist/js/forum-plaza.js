import * as THREE from 'three';
import {createForumPlazaGround} from './forum-plaza-ground.js';

// V52 · Plaça del Fòrum, in the lower city. The parcel and present display
// follow PNOA and municipal photographs. Walls are surviving low remains;
// uncertain ancient elevations are deliberately left unbuilt. This is a
// documented interpretation, not a georeferenced archaeological survey.
const PI = Math.PI;
const UP = new THREE.Vector3(0, 1, 0);
const IDENTITY = new THREE.Matrix4();
const LON = 111320 * Math.cos(39.679 * PI / 180);
const projectDefault = (lon, lat) => ({x:(lon + .278) * LON, z:(39.679 - lat) * 111320});
const geo = p => [-.278 + p.x / LON, 39.679 - p.z / 111320];
const noise = n => { const v = Math.sin(n * 127.13 + 34.19) * 43758.5453; return v - Math.floor(v); };

const MATERIALS = {
  pinkConcrete:{color:'#c7a798',roughness:.97,texture:'concrete'},
  paving:{color:'#b8b9b2',roughness:.94,texture:'concrete'},
  plaster:{color:'#d6c6b5',roughness:1,texture:'limestone'},
  plasterLight:{color:'#d3c3aa',roughness:1,texture:'limestone'},
  plasterPatch:{color:'#c7b7a4',roughness:1,texture:'earth'},
  brick:{color:'#b49e88',roughness:1,texture:'rubble'},
  infillJoint:{color:'#bbab99',roughness:1},
  retaining:{color:'#c5c0b0',roughness:.96,texture:'concrete'},
  blackSteel:{color:'#303936',roughness:.72,metalness:.3},
  panel:{color:'#295447',roughness:.84},
  rubber:{color:'#929c7d',roughness:1},
  redRubber:{color:'#a36259',roughness:1},
  blue:{color:'#3993af',roughness:.72},
  yellow:{color:'#dbb85b',roughness:.77},
  plantSoil:{color:'#66634c',roughness:1,texture:'earth'},
  leaf:{color:'#5c7849',roughness:1},
  leafLight:{color:'#7a8c52',roughness:1},
  leafDark:{color:'#365743',roughness:1},
  leafRed:{color:'#796953',roughness:1},
  interpretive:{color:'#64a3a3',roughness:.85,opacity:.68},

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
      const mesh=new THREE.Mesh(g,mat);mesh.name='Plaza del Fórum · '+component+' · '+kind;mesh.castShadow=!['glass','hypothesis','water'].includes(kind);mesh.receiveShadow=true;
      mesh.userData={forumPlazaFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap,baseOpacity:mat.opacity};
      mesh.userData.publicWalkingSurface=component==='caminos';group.add(mesh);resources.materials.push(mat);resources.geometries.push(g);
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
  wf.box(b,K('mortar'),0,y+height*.33,0,length,height*.66,width*.82);
  if(footing) {
    const points=[],at=(x,yy,z)=>wf.p(x,yy,z),lower=.50,upper=width/2;
    quad(points,at(-length/2,y-.28,-lower),at(length/2,y-.28,-lower),at(length/2,y+.12,-upper),at(-length/2,y+.12,-upper));
    quad(points,at(length/2,y-.28,lower),at(-length/2,y-.28,lower),at(-length/2,y+.12,upper),at(length/2,y+.12,upper));b.raw(K('mortar'),points,.94);
    for(let i=0;i<Math.ceil(length/.24);i++)for(const side of[-1,1])pebble(b,K('cobble'),wf.p(-length/2+(i+.5)*length/Math.ceil(length/.24),y-.03+noise(seed+i)*.09,side*.39),[.12,.10,.11],seed+i);
  }
  for(let row=0;row<rows;row++){
   const weights=Array.from({length:n},(_,i)=>.5+noise(seed+row*97+i*3)*1.05),sum=weights.reduce((v,w)=>v+w,0);let cursor=-length/2;
   for(let i=0;i<n;i++){
    const w=length*weights[i]/sum,h=height/rows*(.72+noise(seed+row*37+i)*.35),x=cursor+w/2;cursor+=w;
    if(row===rows-1&&i%9===3)continue;
    block(b,K('rubble'),wf,x,y+row*height/rows,noise(seed+i)*.035,w-.026,h,width*(.81+noise(seed+11+i)*.15),seed+row*53+i,noise(seed+i)*.06-.03,.075);
   }
  }
}
function glassRail(b,K,a,c,y,height=1.04) {
  const length=Math.hypot(c.x-a.x,c.z-a.z),f=frame((a.x+c.x)/2,(a.z+c.z)/2,-Math.atan2(c.z-a.z,c.x-a.x)),n=Math.max(1,Math.ceil(length/1.45));
  f.box(b,K('steel'),0,y+height,0,length,.033,.042);
  for(let i=0;i<=n;i++){f.box(b,K('steel'),-length/2+i*length/n,y+height/2,0,.037,height,.047);f.box(b,K('steel'),-length/2+i*length/n,y+.04,0,.13,.08,.13);}
  for(let i=0;i<n;i++)f.box(b,K('glass'),-length/2+(i+.5)*length/n,y+height*.50,0,length/n-.065,height-.15,.018);
}

const boundsFrom=(poly,bottom,top)=>new THREE.Box3().setFromPoints(poly.flatMap(p=>[new THREE.Vector3(p.x,bottom,p.z),new THREE.Vector3(p.x,top,p.z)]));
function surface(b,k,outline,holes,f,y,depth=.12,triangles=null){
 const p=outline.map(q=>f.world(...q)),hs=holes.map(h=>h.map(q=>f.world(...q)));
 if(triangles){const top=[];for(const triangle of triangles){const[a,c,d]=triangle,area=(c[0]-a[0])*(d[1]-a[1])-(c[1]-a[1])*(d[0]-a[0]);for(const q of area>0?[a,d,c]:triangle)top.push(...f.p(q[0],y,q[1]));}b.raw(k,top);}
 else flat(b,k,p,y,1,hs);const sides=[];
 for(const ring of[p,...hs])for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length];quad(sides,[a.x,y,a.z],[c.x,y,c.z],[c.x,y-depth,c.z],[a.x,y-depth,a.z]);}
 b.raw(k,sides,.94);
}
function cableRail(b,K,f,a,c,y,height=.62){
 const length=Math.hypot(c[0]-a[0],c[1]-a[1]),n=Math.ceil(length/1.65);
 for(let i=0;i<=n;i++){const t=i/n,p=f.p(a[0]+(c[0]-a[0])*t,y,a[1]+(c[1]-a[1])*t);b.beam(K('steel'),p,[p[0],y+height,p[2]],.018,6);}
 for(const h of[.24,height])b.beam(K('steel'),f.p(a[0],y+h,a[1]),f.p(c[0],y+h,c[1]),.006,4);
}
function blackRail(b,K,f,a,c,ya,yc=ya,height=1.03){
 const length=Math.hypot(c[0]-a[0],c[1]-a[1]),n=Math.ceil(length/1.75),bars=Math.ceil(length/.15);
 for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(c[0]-a[0])*t,z=a[1]+(c[1]-a[1])*t,y=ya+(yc-ya)*t;b.beam(K('blackSteel'),f.p(x,y,z),f.p(x,y+height,z),.023,6);}
 for(const h of[.14,height])b.beam(K('blackSteel'),f.p(a[0],ya+h,a[1]),f.p(c[0],yc+h,c[1]),.018,6);
 for(let i=1;i<bars;i++){const t=i/bars,x=a[0]+(c[0]-a[0])*t,z=a[1]+(c[1]-a[1])*t,y=ya+(yc-ya)*t;b.beam(K('blackSteel'),f.p(x,y+.14,z),f.p(x,y+height,z),.009,5);}
}
function tree(b,f,u,v,y,seed=1,height=5.8,radius=1.8){
 const K=key('jardin','parque'),p=f.p(u,y+height*.22,v);
 b.cylinder(K('woodDark'),p,.085,.16,height*.44,8);
 for(let j=0;j<4;j++){const a=j*PI*.5+.25;b.beam(K('woodDark'),f.p(u,y+height*.30,v),f.p(u+Math.cos(a)*radius*.58,y+height*.70,v+Math.sin(a)*radius*.58),.045,6);}
 for(let j=0;j<9;j++){const a=j*2.3999+noise(seed)*PI,r=j===0?0:radius*(.35+noise(seed+j)*.35),yy=y+height*.68+(noise(seed+j*3)-.5)*height*.21;
  const g=new THREE.IcosahedronGeometry(1,1);g.scale(radius*(.60+noise(seed+j+31)*.19),height*.22,radius*(.52+noise(seed+j+8)*.22));g.rotateY(a);
  b.geom(K(j%3===0?'leafDark':j%3===1?'leaf':'leafLight'),g,new THREE.Matrix4().makeTranslation(...f.p(u+Math.cos(a)*r,yy,v+Math.sin(a)*r)),.88+noise(seed+j)*.23);g.dispose();}
}
function bench(b,f,u,v,y,angle=0){
 const p=f.world(u,v),bf=frame(p.x,p.z,f.yaw+angle),K=key('mobiliario','parque');
 for(const x of[-.68,.68]){bf.box(b,K('blackSteel'),x,y+.24,0,.065,.48,.52);bf.box(b,K('blackSteel'),x,y+.65,.24,.06,.65,.06);}
 for(let j=0;j<4;j++)bf.box(b,K('wood'),0,y+.46,-.22+j*.13,1.85,.045,.105);
 for(let j=0;j<3;j++)bf.box(b,K('wood'),0,y+.64+j*.13,.27,1.85,.10,.045);
}
function panel(b,f,u,v,y,angle=0){
 const p=f.world(u,v),pf=frame(p.x,p.z,f.yaw+angle),K=key('museografia','parque');
 for(const x of[-.47,.47])pf.box(b,K('blackSteel'),x,y+.48,0,.035,.96,.035);
 const top=new THREE.BoxGeometry(1.22,.035,.62);top.rotateX(-.24);b.geom(K('panel'),top,new THREE.Matrix4().compose(new THREE.Vector3(...pf.p(0,y+.99,0)),new THREE.Quaternion().setFromAxisAngle(UP,pf.yaw),new THREE.Vector3(1,1,1)));top.dispose();
 for(let j=0;j<4;j++)pf.box(b,K('label'),-.19,y+1.016+j*.012,-.18+j*.075,.48,.008,.025);
 pf.box(b,K('label'),.36,y+1.02,-.02,.22,.012,.30);
}
function archedInfill(b,f,u,v,y,w,h,angle=0,seed=0,arched=true){
 const p=f.world(u,v),af=frame(p.x,p.z,f.yaw+angle),K=key('medianeras','huellas');
 af.box(b,K('plasterPatch'),0,y+h*.46,0,w,h*.92,.025);
 const radius=w/2,base=y+h-radius,steps=14,points=[];
 if(arched)for(let i=0;i<steps;i++){if((i+Math.floor(seed))%9===0)continue;const a=i*PI/steps,c=(i+1)*PI/steps;
  quad(points,af.p(Math.cos(a)*radius,base+Math.sin(a)*radius,-.019),af.p(Math.cos(c)*radius,base+Math.sin(c)*radius,-.019),af.p(Math.cos(c)*(radius+.09),base+Math.sin(c)*(radius+.09),-.019),af.p(Math.cos(a)*(radius+.09),base+Math.sin(a)*(radius+.09),-.019));}
 else af.box(b,K('brick'),0,y+h,-.017,w+.12,.07,.028);
 b.raw(K('brick'),points);
 for(const side of[-1,1])for(let j=0;j<Math.floor((h-(arched?radius:0))/.27);j++){if((j+Math.floor(seed))%5===0)continue;af.box(b,K('brick'),side*(radius+.045),y+j*.27+.13,-.019,.09,.23,.025,0,.95+noise(seed+j)*.1);}
 for(let j=0;j<Math.floor(h/.55);j++)af.box(b,K('infillJoint'),0,y+j*.55+.12,-.015,w*.8,.006,.003);
}
function plantedWall(b,f,a,c,base,height,seed){
 const K=key('jardin-vertical','parque'),length=Math.hypot(c[0]-a[0],c[1]-a[1]),angle=-Math.atan2(c[1]-a[1],c[0]-a[0]),p=f.world((a[0]+c[0])/2,(a[1]+c[1])/2),wf=frame(p.x,p.z,f.yaw+angle);
 wf.box(b,K('blackSteel'),0,base+height/2,0,length,height,.12);
 const cols=Math.ceil(length/.48),rows=Math.ceil(height/.46);
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
  const u=-length/2+(i+.5)*length/cols,h=(j+.5)*height/rows,edge=j>rows-4&&(i<2||i>cols-4)?j>rows-3:false;
  if(edge)continue;
  const patch=(Math.floor(i/4)+Math.floor(j/3)*2+seed)%5,kind=(i+j*3+seed)%17===0?'leafRed':patch===0?'leafLight':patch===1?'leafDark':'leaf';
  wf.box(b,K(kind),u,base+h,.13,length/cols*.98,height/rows*.94,.22,0,.85+noise(seed+i*3+j)*.26);
  for(let k=0;k<2;k++){const n=seed+i*13+j*47+k*5,g=new THREE.IcosahedronGeometry(1,0);g.scale(.13+noise(n)*.19,.16+noise(n+2)*.25,.12+noise(n+9)*.16);g.rotateZ(noise(n+3)*1.2);b.geom(K(kind),g,new THREE.Matrix4().makeTranslation(...wf.p(u+(k-.5)*.22+(noise(n+6)-.5)*.17,base+h+(noise(n+1)-.5)*.31,.24+noise(n+4)*.15)),.88+noise(n+9)*.2);g.dispose();}
 }
 for(let j=0;j<=rows;j+=3)wf.box(b,K('blackSteel'),0,base+j*height/rows,.25,length,.012,.012);
}

export function createForumPlaza({record,project=projectDefault,heightAt=()=>24,visitData={},contextData={}}={}){
 const ground=createForumPlazaGround({project,heightAt,contextData}),{origin,yaw,streetY,baseY,outline}=ground,
  f=frame(origin.x,origin.z,yaw),layout=contextData.layout||{},features=Object.fromEntries((layout.features||[]).map(q=>[q.id,q])),
  F=(id,fallback)=>features[id]?.local||fallback,rotate=o=>[o[0]*Math.cos(yaw)+o[2]*Math.sin(yaw),o[1],-o[0]*Math.sin(yaw)+o[2]*Math.cos(yaw)];
 const resources={materials:[],geometries:[],textures:[]},textures={};
 for(const type of new Set(Object.values(MATERIALS).map(q=>q.texture).filter(Boolean))){textures[type]=makeTexture(type);resources.textures.push(textures[type]);}
 const group=new THREE.Group(),remains=new THREE.Group(),modern=new THREE.Group(),interpretation=new THREE.Group();
 group.name='Plaza del Fórum · parque arqueológico y ciudad baja';remains.name='Fórum · restos y medianeras';modern.name='Fórum · parque contemporáneo';interpretation.name='Fórum · orientación esquemática de la cloaca';group.add(remains,modern,interpretation);
 const a=new Batch(),m=new Batch(),h=new Batch(),planComponents=[];
 const K=(id,period)=>key(id,period);
 // A real concave floor, 2.50 m below the sampled street. The circular deposit
 // is an opening in the gravel, not a black decal on an unbroken surface.
 slab(a,K('recinto','huellas')('earth'),outline,baseY-.32,.45);
 for(const row of ground.spec.surfaces){
  const component=row.publicWalkingSurface?'caminos':row.component, b=row.period==='romana'?a:m;
  surface(b,K(component,row.period)(row.material),row.outline,row.holes,f,streetY+row.level,.14,row.triangles);
  planComponents.push({id:row.id,label:row.id.startsWith('restos')?'Área arqueológica conservada':row.id.startsWith('jardin')?'Plantación del parque':row.id==='juegos'?'Zona de juegos':'Recorrido público',period:row.period,
   coordinates:row.outline.map(p=>geo(f.world(...p))),holes:row.holes.map(h=>h.map(p=>geo(f.world(...p)))),kind:row.material==='plantSoil'?'garden':row.publicWalkingSurface?'path':'room',closed:true,stopId:row.period==='romana'?'forum-plaza-conjunto':row.publicWalkingSurface?'forum-plaza-accesos':'forum-plaza-jardin',interpretive:true});
 }
 // Retaining faces only where the planted/upper terraces actually descend.
 for(const row of ground.spec.surfaces.filter(q=>q.level>-.4)){
  for(const ring of[row.outline,...row.holes])for(let i=0;i<ring.length;i++){
   const p=ring[i],q=ring[(i+1)%ring.length],length=Math.hypot(q[0]-p[0],q[1]-p[1]);if(length<.12)continue;
   const u=(p[0]+q[0])/2,v=(p[1]+q[1])/2,dx=(q[1]-p[1])/length*.08,dz=-(q[0]-p[0])/length*.08,
    sides=[[u+dx,v+dz],[u-dx,v-dz]].map(t=>{const w=ground.world(...t);return ground.surfaceHeight(w.x,w.z);}),lo=Math.min(...sides),top=streetY+row.level;
   if(top-lo>.23)wall(m,K('contencion','parque')('retaining'),f.world(...p),f.world(...q),lo-.1,top,.16);
  }
 }
 // Close the street-side excavation where the lower promenade meets the
 // outer parcel. The terrain cutter removes the full polygon; pavement
 // skirts alone would otherwise leave an open void below the two streets.
 // These modern retaining faces finish just below the street/entry decks.
 const boundaryAtV=(a,c,v)=>{const t=(v-a[1])/(c[1]-a[1]);return[a[0]+(c[0]-a[0])*t,v];};
 for(const[i,j,v0,v1]of[[3,4,11.25,ground.spec.core[4][1]],[1,0,11.25,ground.spec.core[0][1]]]){
  const p=boundaryAtV(ground.spec.core[i],ground.spec.core[j],v0),q=boundaryAtV(ground.spec.core[i],ground.spec.core[j],v1);
  wall(m,K('contencion','parque')('retaining'),f.world(...p),f.world(...q),baseY-.4,streetY-.03,.18);
 }
 wall(m,K('contencion','parque')('retaining'),f.world(...ground.spec.core[4]),f.world(...ground.spec.core[5]),baseY-.4,streetY-.03,.18);
 // Segmented, continuous ramps and discrete stair treads. Public top faces
 // feed the same walking decks used by the simulator.
 const routeQA=[];
 for(const route of ground.routes){
  const positions=[],sideFaces=[],total=route.length,N=route.stairs?route.stepCount:Math.ceil(total/.65),sample=t=>{
   const d=Math.min(total-.000001,Math.max(0,t*total)),seg=route.segments.find(s=>d<=s.start+s.d+.00001)||route.segments.at(-1),r=(d-seg.start)/seg.d,
    y=streetY+route.start+(route.end-route.start)*(route.stairs?Math.floor(t*route.stepCount+.00001)/route.stepCount:t);
   return {u:seg.a[0]+(seg.b[0]-seg.a[0])*r,v:seg.a[1]+(seg.b[1]-seg.a[1])*r,y,dx:(seg.b[0]-seg.a[0])/seg.d,dz:(seg.b[1]-seg.a[1])/seg.d};
  };
  // Build per original segment for exact mitered joins, or one tread per step.
  if(!route.stairs){
   const verts=route.points.map((p,i)=>{
    const before=route.segments[Math.max(0,i-1)],after=route.segments[Math.min(route.segments.length-1,i)],n1=[-((before.b[1]-before.a[1])/before.d),(before.b[0]-before.a[0])/before.d],n2=[-((after.b[1]-after.a[1])/after.d),(after.b[0]-after.a[0])/after.d],nx=n1[0]+n2[0],nz=n1[1]+n2[1],norm=Math.hypot(nx,nz),ux=nx/norm,uz=nz/norm,dot=ux*n2[0]+uz*n2[1],w=route.width/2/Math.max(.65,dot),distance=i===route.points.length-1?total:route.segments[i].start;
    return{left:[p[0]+ux*w,p[1]+uz*w],right:[p[0]-ux*w,p[1]-uz*w],y:streetY+route.start+(route.end-route.start)*distance/total};
   });
   for(let i=1;i<verts.length;i++){const p=verts[i-1],q=verts[i];quad(positions,f.p(...[p.left[0],p.y,p.left[1]]),f.p(q.left[0],q.y,q.left[1]),f.p(q.right[0],q.y,q.right[1]),f.p(p.right[0],p.y,p.right[1]));
    for(const side of['left','right']){quad(sideFaces,f.p(p[side][0],p.y,p[side][1]),f.p(q[side][0],q.y,q[side][1]),f.p(q[side][0],baseY-.10,q[side][1]),f.p(p[side][0],baseY-.10,p[side][1]));blackRail(m,K('accesos','parque'),f,p[side],q[side],p.y,q.y);}
   }
  }else for(let i=0;i<N;i++){
   const p=sample(i/N),q=sample((i+1)/N),left=[-p.dz*route.width/2,p.dx*route.width/2],y=p.y;
   quad(positions,f.p(p.u+left[0],y,p.v+left[1]),f.p(q.u+left[0],y,q.v+left[1]),f.p(q.u-left[0],y,q.v-left[1]),f.p(p.u-left[0],y,p.v-left[1]));
   quad(positions,f.p(q.u+left[0],y,q.v+left[1]),f.p(q.u+left[0],q.y,q.v+left[1]),f.p(q.u-left[0],q.y,q.v-left[1]),f.p(q.u-left[0],y,q.v-left[1]));
   for(const side of[-1,1])quad(sideFaces,f.p(p.u+left[0]*side,y,p.v+left[1]*side),f.p(q.u+left[0]*side,y,q.v+left[1]*side),f.p(q.u+left[0]*side,baseY-.10,q.v+left[1]*side),f.p(p.u+left[0]*side,baseY-.10,p.v+left[1]*side));
   if(i===0)quad(sideFaces,f.p(p.u+left[0],y,p.v+left[1]),f.p(p.u-left[0],y,p.v-left[1]),f.p(p.u-left[0],baseY-.10,p.v-left[1]),f.p(p.u+left[0],baseY-.10,p.v+left[1]));
   if(i===N-1)quad(sideFaces,f.p(q.u+left[0],q.y,q.v+left[1]),f.p(q.u-left[0],q.y,q.v-left[1]),f.p(q.u-left[0],baseY-.10,q.v-left[1]),f.p(q.u+left[0],baseY-.10,q.v+left[1]));
  }
  m.raw(K('caminos','parque')('paving'),positions);
  m.raw(K('contencion','parque')('retaining'),sideFaces);
  if(route.stairs){const p=sample(0),q=sample(1),normal=[-p.dz*route.width/2,p.dx*route.width/2];for(const side of[-1,1])blackRail(m,K('accesos','parque'),f,[p.u+normal[0]*side,p.v+normal[1]*side],[q.u+normal[0]*side,q.v+normal[1]*side],p.y,q.y);}
  routeQA.push({id:route.id,length:total,width:route.width,startLevel:route.start,endLevel:route.end,steps:route.stepCount,profile:'estimated from documented endpoints and imagery'});
  planComponents.push({id:route.id,label:route.stairs?'Escalera entre niveles':'Rampa de Ordóñez',coordinates:route.points.map(p=>geo(f.world(...p))),kind:'path',period:'parque',stopId:'forum-plaza-accesos',interpretive:true});
 }
 // Surviving masonry: modest elevations, stone-by-stone irregular surfaces.
 const wallDefs=[
  {id:'portico',a:[1.1,16.1],b:[8.8,16.18],h:.65,w:.66},
  {id:'portico',a:[12,16.21],b:[22,16.31],h:.48,w:.64},
  {id:'portico',a:[22,16.31],b:[30.6,16.4],h:.78,w:.67},
  {id:'portico',a:[34.5,18.5],b:[34.5,25.8],h:.52,w:.58},
  {id:'trinidad',a:[8.9,19.2],b:[8.9,26.8],h:.30,w:.48},
  {id:'trinidad',a:[9.3,27.5],b:[25.3,29],h:.28,w:.48},
  {id:'aljibes',a:[2,13.6],b:[12.7,13.9],h:.24,w:.44},
  {id:'aljibes',a:[12.7,13.9],b:[13.1,16.6],h:.26,w:.42}
 ];
 wallDefs.forEach((w,i)=>{const period=w.id==='portico'?'romana':'huellas';rubbleWall(a,K(w.id,period),f,w.a,w.b,baseY+.04,w.h,w.w,120+i*41,false);planComponents.push({id:'resto-'+i,label:period==='romana'?'Muro conservado':'Fábrica y reutilización',period,coordinates:[w.a,w.b].map(p=>geo(f.world(...p))),kind:'wall',stopId:'forum-plaza-'+w.id,interpretive:true});});
 const bases=F('portico-bases',[[12.14,21.47],[15.46,22.08],[18.42,22.14],[21.32,22.22]]);
 for(let i=0;i<bases.length;i++){const[x,z]=bases[i];block(a,K('portico','romana')('limestoneWarm'),f,x,baseY+.025,z,1.08,.16,1.02,i+31,0,.055);block(a,K('portico','romana')('limestone'),f,x+.04,baseY+.18,z-.02,.80,.13,.78,i+53,0,.035);
  planComponents.push({id:'base-'+i,label:'Base conservada del pórtico',coordinates:rect(f,x,z,1.08,1.02).map(geo),kind:'room',closed:true,period:'romana',stopId:'forum-plaza-portico',interpretive:true});}
 // The existence of the threshold and two bases is documented; registration
 // is approximate and does not imply their exact excavation coordinates.
 for(let i=0;i<4;i++)block(a,K('umbral','romana')('limestone'),f,9.2+i*.77,baseY+.06,17.05,.74,.18,1.12,310+i,0,.018);
 for(const x of[8.72,12.05]){block(a,K('umbral','romana')('limestoneWarm'),f,x,baseY+.05,16.96,1.0,.26,1.02,x*10);block(a,K('umbral','romana')('limestone'),f,x,baseY+.31,16.96,.78,.16,.80,x*20);}
 // Visible circular deposit with contemporary protective steel grille.
 const deposit={u:27.45,v:21.03,radius:1.25,openingRadius:1.07},dk=K('aljibes','huellas');
 a.cylinder(dk('dark'),f.p(deposit.u,baseY-.29,deposit.v),1.06,1.06,.045,48);
 for(let row=0;row<2;row++)for(let i=0;i<24;i++){const angle=i*2*PI/24+row*.055,u=deposit.u+Math.cos(angle)*1.19,v=deposit.v+Math.sin(angle)*1.19;block(a,dk('rubble'),f,u,baseY-.04+row*.15,v,.34,.15,.29,600+row*24+i,-angle+PI/2,.035);}
 const grille=K('proteccion','parque');
 for(let d=-.96;d<=.97;d+=.16){const chord=Math.sqrt(1.07**2-d*d);m.beam(grille('blackSteel'),f.p(deposit.u-chord,baseY+.28,deposit.v+d),f.p(deposit.u+chord,baseY+.28,deposit.v+d),.012,5);}
 for(let d=-.8;d<=.81;d+=.4){const chord=Math.sqrt(1.07**2-d*d);m.beam(grille('blackSteel'),f.p(deposit.u+d,baseY+.29,deposit.v-chord),f.p(deposit.u+d,baseY+.29,deposit.v+chord),.014,5);}
 // Party walls follow the real parcel indentation, leaving the buildings in
 // place. Photographic blocked openings are shown as infill, never as doors.
 const medianeraSegments=[{a:[-2.87,18.87],b:[6.1,19.4],top:9.9},
  {a:[6.13,19.5],b:[5.45,31.35],top:7.4},
  {a:[5.45,31.35],b:[11.56,31.75],top:4.3},
  {a:[11.76,29.59],b:[17.0,29.72],top:6.8},
  {a:[17.0,29.72],b:[23.76,29.88],top:4.45},
  {a:[23.78,30],b:[23.38,42.6],top:5.1},
  {a:[23.5,42.72],b:[31.6,43.12],top:7.2}];
 medianeraSegments.forEach((w,i)=>{
  wall(a,K('medianeras','huellas')('plaster'),f.world(...w.a),f.world(...w.b),baseY+.05,streetY+w.top,.25,1);
  rubbleWall(a,K('medianeras','huellas'),f,w.a,w.b,baseY+.03,1.05,.31,720+i*91,false);
 });
 // Stepped bare historic facade opposite the lower promenade.
 for(const[x,y,w,hh]of[[14.3,1.8,1.0,2.1],[14.1,5.1,1.15,2.2],[19.2,1.7,.85,1.8],[21.5,1.6,.8,1.5]])archedInfill(a,f,x,29.54,baseY+y,w,hh,0,810+x,y<2);
 for(const[v,y,w,hh]of[[22.5,.15,2.8,2.0],[24.6,2.9,2.2,2.1],[27.1,5.1,1.1,2.0]])archedInfill(a,f,6.22-(v-19.5)*.056,v,baseY+y,w,hh,-PI/2,831+v,y<3);
 for(const rise of[.6,3.3])a.beam(K('medianeras','huellas')('brick'),f.p(6.28,streetY+rise+3.0,20.6),f.p(5.95,streetY+rise,26.5),.075,6);
 for(let i=0;i<8;i++)f.box(a,K('medianeras','huellas')('plasterPatch'),12.2+i*1.4,streetY+.4+noise(i)*2.9,29.52,.35+noise(i+2)*.7,.6+noise(i+3)*1.2,.035);
 // Two green medianeras are documented; module extents and vegetation are
 // interpreted. The third historic wall remains bare and legible.
 plantedWall(m,f,[1.85,19.08],[-2.58,18.82],streetY-.13,9.35,52);
 plantedWall(m,f,[31.55,43.03],[23.65,42.64],streetY-.12,7.05,73);
 // The steel gallery is visible in the completed park photographs. It hugs
 // the NORTH return of the western medianera, then turns briefly to the east
 // face; it is distinct from the sunken salmon concrete promenade.
 const gallery=ground.gallery,deckY=streetY+gallery.level;
 surface(m,K('caminos','parque')('blackSteel'),gallery.outline,[],f,deckY,.12);
 for(let i=0;i<4;i++){const p=gallery.outline[i],q=gallery.outline[i+1];blackRail(m,K('accesos','parque'),f,p,q,deckY);}
 for(const[u,v]of[[-2,17.6],[1.3,17.8],[4.8,18.1],[7.3,19.5],[7.25,21.3]])f.box(m,K('accesos','parque')('blackSteel'),u,(baseY+deckY)/2,v,.09,deckY-baseY,.09);
 for(let u=-2.2;u<5.7;u+=.10)m.beam(K('accesos','parque')('steel'),f.p(u,deckY+.014,17.43+(u+2.4)*.061),f.p(u,deckY+.014,18.47+(u+2.4)*.061),.004,3);
 panel(m,f,6.95,21.1,deckY,-PI/2);
 archedInfill(a,f,3.8,18.83,baseY+.04,2.3,2.16,0,936);
 planComponents.push({id:'galeria-medianera',label:'Pasarela elevada junto a la medianera',coordinates:gallery.outline.map(p=>geo(f.world(...p))),kind:'path',closed:true,period:'parque',stopId:'forum-plaza-medianeras',interpretive:true});
 // Perimeter protections and the lower archaeological visitor cable.
 const bed=F('archaeology-bed',[[.8,15.5],[31.5,15.8],[34.7,18.2],[34.5,22],[29.2,27.5],[27.5,32],[25.3,29],[9.3,27.5],[8.8,19.1],[1.1,17.8]]);
 for(let i=0;i<bed.length;i++){const p=bed[i],q=bed[(i+1)%bed.length];if(i===6||i===7)continue;cableRail(m,K('proteccion','parque'),f,p,q,baseY+.05);}
 for(const[a0,b0]of[[[1,.15],[18,.15]],[[24,.15],[39,.15]],[[43.8,.5],[43.2,21]],[[42.9,28],[42.1,40.7]],[[1,11.2],[18.6,11.2]],[[23.0,11.2],[30,11.2]]])blackRail(m,K('accesos','parque'),f,a0,b0,streetY);
 for(const[u,v,angle]of[[17,14.3,0],[28.7,22.7,-PI/2],[10.5,26.7,0]])panel(m,f,u,v,baseY+.07,angle);
 // Trees are registered to crowns in PNOA, with species and height approximate.
 const trees=F('trees',[[2,3],[9.7,2.9],[2.7,8.1],[16.6,5.8],[20.7,7.5],[22.4,10.4],[27.2,11.9],[31.3,13.5],[36.4,15.1],[38,25],[36.3,33],[35.4,38.4]]);
 trees.forEach(([u,v],i)=>{const p=f.world(u,v),y=ground.surfaceHeight(p.x,p.z);tree(m,f,u,v,y,900+i*13,4.8+noise(i+12)*1.4,1.35+noise(i+7)*.55);});
 // Ground planting is deliberately varied; it does not conceal the ruins.
 for(const row of ground.spec.surfaces.filter(s=>s.material==='plantSoil')){
  const xs=row.outline.map(p=>p[0]),zs=row.outline.map(p=>p[1]);let seed=0;
  for(let u=Math.min(...xs)+.5;u<Math.max(...xs);u+=1.3)for(let v=Math.min(...zs)+.5;v<Math.max(...zs);v+=1.2){seed++;const p=f.world(u,v),gp=row.outline.map(q=>f.world(...q));if(!inside(p,gp)||row.holes.some(h=>inside(p,h.map(q=>f.world(...q)))))continue;
   pebble(m,K('jardin','parque')(seed%4===0?'leafLight':'leaf'),f.p(u,streetY+row.level+.21,v),[.38+noise(seed)*.2,.24+noise(seed+9)*.17,.32+noise(seed+6)*.2],seed);
  }
 }
 for(const[u,v,angle]of[[10,5.85,0],[26.1,4.7,0],[34.5,5.6,0],[37.8,22.5,-PI/2],[31.2,40.9,0]]){const p=f.world(u,v);bench(m,f,u,v,ground.surfaceHeight(p.x,p.z),angle);}
 // Furniture shown in the official 2018 completion photographs: a small
 // slide, one swing and a spring rider, on green/red safety surfacing.
 const pk=K('juegos','parque'),playY=streetY+.015;
 for(const[u,v,r]of[[34.4,8.2,1.2],[37.6,8.7,1.65],[33.4,10.5,.9]])m.cylinder(pk('redRubber'),f.p(u,playY+.015,v),r,r,.025,28);
 const swingCenter=[37.5,8.4];
 for(const u of[36.4,38.6]){m.beam(pk('wood'),f.p(u,playY,7.6),f.p(u,playY+2.15,8.4),.065,7);m.beam(pk('wood'),f.p(u,playY,9.2),f.p(u,playY+2.15,8.4),.065,7);}
 m.beam(pk('wood'),f.p(36.25,playY+2.15,8.4),f.p(38.75,playY+2.15,8.4),.075,8);
 for(const u of[37.25,37.75])m.beam(pk('steel'),f.p(u,playY+2.08,8.4),f.p(u,playY+.48,8.4),.009,5);
 f.box(m,pk('blue'),37.5,playY+.47,8.4,.65,.12,.42);f.box(m,pk('yellow'),37.5,playY+.73,8.58,.65,.16,.06);
 const slide=[];quad(slide,f.p(34.1,playY+1.15,7.4),f.p(34.7,playY+1.15,7.4),f.p(34.7,playY+.12,9.3),f.p(34.1,playY+.12,9.3));m.raw(pk('blue'),slide);
 for(const u of[34.06,34.74]){m.beam(pk('yellow'),f.p(u,playY+1.29,7.35),f.p(u,playY+.26,9.33),.055,8);m.beam(pk('steel'),f.p(u,playY,6.75),f.p(u,playY+1.2,7.4),.028,6);}
 for(let j=0;j<4;j++)m.beam(pk('steel'),f.p(34.06,playY+.25+j*.24,6.82+j*.15),f.p(34.74,playY+.25+j*.24,6.82+j*.15),.025,6);
 for(let j=0;j<5;j++){const g=new THREE.TorusGeometry(.13,.025,5,12);g.rotateX(PI/2);m.geom(pk('blue'),g,new THREE.Matrix4().makeTranslation(...f.p(33.4,playY+.11+j*.07,10.5)));g.dispose();}
 m.cylinder(pk('yellow'),f.p(33.4,playY+.50,10.5),.35,.35,.09,16);
 for(const[u,v]of[[6.8,11.8],[25.5,12.5],[35.4,24.7],[28.3,36.2]]){const p=f.world(u,v),y=ground.surfaceHeight(p.x,p.z);m.cylinder(K('mobiliario','parque')('blackSteel'),f.p(u,y+2.5,v),.035,.07,5,8);const g=new THREE.TorusGeometry(.25,.034,6,18);g.rotateX(PI/2);m.geom(K('mobiliario','parque')('blackSteel'),g,new THREE.Matrix4().makeTranslation(...f.p(u,y+4.9,v)));g.dispose();f.box(m,K('mobiliario','parque')('label'),u,y+4.94,v,.24,.035,.20);}
 // Cloaca orientation is an explicit reading aid. It appears only when its
 // stop or period reading is selected, and never masquerades as exposed fabric.
 const drain=F('cloaca-axis',[[15,25],[20,20],[25,15],[30,10],[35,5]]);
 for(let i=1;i<drain.length;i++){const p=drain[i-1],q=drain[i],len=Math.hypot(q[0]-p[0],q[1]-p[1]);for(let d=0;d<len;d+=1.25){const t=d/len,t2=Math.min(1,(d+.65)/len),aa=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t],cc=[p[0]+(q[0]-p[0])*t2,p[1]+(q[1]-p[1])*t2],w=f.world(...aa),yy=ground.surfaceHeight(w.x,w.z)+.045;wall(h,K('cloaca','romana')('interpretive'),f.world(...aa),f.world(...cc),yy,yy+.025,.16);}}
 planComponents.push({id:'cloaca-esquema',label:'Cloaca · orientación documentada, trazado esquemático',coordinates:drain.map(p=>geo(f.world(...p))),kind:'path',period:'romana',stopId:'forum-plaza-cloaca',interpretive:true});
 a.finish(remains,resources,textures);m.finish(modern,resources,textures);h.finish(interpretation,resources,textures);
 const meshes=[];group.traverse(q=>{if(q.isMesh){q.userData.archaeologicalSite='forum-plaza';meshes.push(q);}});
 const bounds=boundsFrom(outline,baseY-.4,streetY+8.2),state={selected:'forum-plaza-conjunto',readingMode:'materials',mode:'current',active:false},focuses={};
 const defs=[
  ['conjunto',24,19,streetY+1,[37,53,-57],[24,34,-37],['recinto','portico','medianeras'],'ciudad',53],
  ['umbral',10.4,17,baseY+.35,[4.8,6.6,-7.5],[3.2,4.4,-5],['umbral'],'romana',54],
  ['portico',17,22,baseY+.3,[7,9,-11],[4.6,6,-7.5],['portico'],'romana',55],
  ['cloaca',24,15,baseY+.7,[15,21,-16],[10,14,-11],['cloaca'],'romana',54],
  ['trinidad',10,28,streetY+1.7,[14,10,-17],[9,7,-11],['trinidad','medianeras'],'huellas',54],
  ['medianeras',16,29,streetY+2.2,[7,9,-16],[4.5,6,-11],['medianeras'],'huellas',52],
  ['aljibes',27.45,21.03,baseY+.26,[4.5,5.6,-6.2],[2.8,3.6,-4.1],['aljibes','proteccion'],'huellas',53],
  ['jardin',28,42,streetY+3,[15,9,-10],[10,6,-7],['jardin','jardin-vertical','juegos'],'parque',55],
  ['accesos',39,18,streetY-.6,[10,12,-16],[7,8,-11],['caminos','accesos','contencion'],'parque',56],
  ['ciudad-baja',21,2,streetY+1.5,[35,47,-48],[23,31,-32],['recinto','caminos'],'ciudad',53]
 ];
 for(const[id,u,v,y,offset,closeOffset,components,period,fov]of defs){const target=new THREE.Vector3(...f.p(u,y,v)),full='forum-plaza-'+id,stop=visitData.stops?.find(q=>q.id===full);focuses[full]={id:full,label:stop?.title||stop?.label||id,target,coordinates:geo(f.world(u,v)),offset:rotate(offset),closeOffset:rotate(closeOffset),components,regionId:period,readingLayer:period,period,kind:id==='conjunto'?'overview':'feature',bounds:id==='conjunto'?bounds.clone():new THREE.Box3(target.clone().addScalar(-2.5),target.clone().addScalar(2.5)),fitBounds:id==='conjunto',interiorView:false,floor:y<streetY?-1:0,recommendedMode:'current',requiresSection:false,minDistance:.65,fov,closeScale:false,sourceConfidence:'photographic-registration-not-a-survey'};}
 const periods=visitData.readingLegend||[{id:'romana',color:'#d5b77d'},{id:'huellas',color:'#b8a1bf'},{id:'parque',color:'#87aa8d'},{id:'ciudad',color:'#7db9ba'}],colors=Object.fromEntries(periods.map(p=>[p.id,p.color]));
 function repaint(){for(const mesh of meshes){const d=mesh.userData,mat=mesh.material;mat.color.copy(d.baseColor);mat.map=d.baseMap;mat.bumpMap=d.baseBumpMap;
  if(state.readingMode==='periods'){mat.color.set(colors[d.period]||'#aeb29f');mat.map=null;mat.bumpMap=null;}
  mat.emissive.set(focuses[state.selected]?.components.includes(d.component)?'#a48a53':'#000000');mat.emissiveIntensity=.035;mat.needsUpdate=true;
 }interpretation.visible=state.selected==='forum-plaza-cloaca'||state.readingMode==='periods';}
 const selectFocus=id=>{state.selected=id&&focuses[id]?id:null;repaint();return focuses[id]||null;},setReadingMode=mode=>{state.readingMode=mode==='periods'?'periods':'materials';repaint();},
  setPresentation=settings=>{if(settings?.selected!==undefined)state.active=!!settings.selected;return{...state};};
 const plan={id:'forum-plaza',label:'Plaza del Fórum · parque arqueológico',coordinate:geo(f.world(24,19)),outline:outline.map(geo),archaeologyOutline:bed.map(p=>geo(f.world(...p))),components:planComponents,
  stops:Object.values(focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,sourceConfidence:q.sourceConfidence})),floors:[{id:-1,label:'Nivel arqueológico',elevation:baseY},{id:0,label:'Parque y calles',elevation:streetY}],note:'Registro aproximado sobre ortofoto IGN/PNOA y fotografías municipales. Desnivel −2,50 m documentado; perfiles, alzados y detalles interpretados. La identificación del edificio romano como segundo foro es una hipótesis.'};
 const stats={modelVersion:'v52',stops:defs.length,archaeologicalDepthM:2.5,parcelAreaApproxM2:1532.5,publishedProjectAreaM2:1608.44,conservedNorthFrontM:29.5,conservedEastFrontM:21.37,completeAncientBuilding:false,publicRoutes:ground.routes.length,verticalGardens:2,circularDeposits:1,trees:trees.length,
  meshes:meshes.length,triangles:meshes.reduce((n,q)=>n+(q.geometry.index?.count||q.geometry.attributes.position.count)/3,0),survey:false};
 const qa={frame:{...origin,yaw},streetY,baseY,outline,routeQA,deposit,porticoBases:bases,medianeraSegments,source:'Municipal photographs2018; archaeology2015–2017; PNOA; Catastro source context',registration:'approximate manual image registration',ancientForumAttribution:'hypothesis',cloacaGeometry:'schematic direction only',publicFloorCount:meshes.filter(q=>q.userData.publicWalkingSurface).length};
 const bindGround=finalHeightAt=>{if(typeof finalHeightAt!=='function')return;for(const focus of Object.values(focuses))for(const name of['offset','closeOffset']){const off=focus[name],x=focus.target.x+off[0],z=focus.target.z+off[2],h=ground.surfaceHeight(x,z,finalHeightAt(x,z));if(Number.isFinite(h)&&focus.target.y+off[1]<h+1.5)off[1]=h+1.5-focus.target.y;}};
 const visit={focuses,bounds,plan,stats,qa,periods,getFocus:id=>focuses[id]||null,selectFocus,setReadingMode,bindGround,getState:()=>({...state}),sectionAvailable:false,
  metadata:{model:'documented-interpretation',interiorSurvey:false,sourcePlan:qa.source,modern:'Park completed2018, with two vertical gardens, sunken archaeology, public terraces, ramp and stairs; display reconstruction from photos and orthophoto',evidence:'Roman threshold and portico, later fabric and conserved party walls; original Roman elevations deliberately unresolved'},renderStops:defs.map(q=>'forum-plaza-'+q[0])};
 const currentMask={polygon:outline,outline,center:f.world(22,22),width:46,depth:46,yaw,floorY:baseY-.5,clipContext:false,clipTerrain:false,permanent:true};
 group.userData.visit=visit;group.userData.ground=ground;group.userData.resources=resources;group.userData.ownedResources=resources;group.userData.landmarkId='forum-plaza';group.updateMatrixWorld(true);repaint();
 return{id:'forum-plaza',group,remains,modern,interpretation,point:focuses['forum-plaza-conjunto'].target.clone(),views:{offset:focuses['forum-plaza-conjunto'].offset,closeOffset:focuses['forum-plaza-conjunto'].closeOffset},visit,currentMask,stats,setPresentation,containsSubsurface:ground.contains,surfaceHeight:ground.terrainHeight,patches:[],exclusions:[outline],vegetationExclusions:[outline],excludedBuildingIds:[],excludedRoadIds:[]};
}
