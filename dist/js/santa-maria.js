import * as THREE from 'three';

// Santa María: an architectural reading of the conserved church. The OSM
// perimeter is registered to the published plans of Cabrera (1987) / Gomis,
// reproduced and discussed by Zaragozá (2000). It is not a measured survey.
// The absent portal sculpture, lost altarpiece and blocked crypt are not rebuilt.
const PI=Math.PI,TAU=PI*2,YAW=1.173;
const LON_SCALE=111320*Math.cos(39.679*PI/180);
const ID=new THREE.Matrix4(),UP=new THREE.Vector3(0,1,0);
const noise=n=>{const x=Math.sin(n*127.13+31.7)*43758.5453;return x-Math.floor(x);};
export const santaMariaPeriods=[
 {id:'medieval',label:'Fábrica medieval identificable',color:'#d6bd8b'},
 {id:'modern',label:'Ampliaciones de los siglos XVI–XVIII',color:'#d4a578'},
 {id:'contemporary',label:'Campanario y conservación contemporánea',color:'#77b8c7'},
 {id:'mixed',label:'Fábrica conservada con transformaciones',color:'#be98d6'},
 {id:'interpretation',label:'Geometría didáctica aproximada',color:'#929ba0'}
];
const PERIOD_COLORS=Object.fromEntries(santaMariaPeriods.map(p=>[p.id,p.color]));
const COMPONENTS={
 'santa-maria-conjunto':[],
 'santa-maria-portada-norte':['portada-norte','muro-norte'],
 'santa-maria-escalinata':['santa-maria-escalinata'],
 'santa-maria-portada-sur':['portada-sur','muro-sur'],
 'santa-maria-portada-principal':['portada-principal','muro-occidental'],
 'santa-maria-naves':['pilares','arcadas','pavimento'],
 'santa-maria-bovedas':['nervios','bovedas','boveda-abside'],
 'santa-maria-capillas':['capillas','pilares-capillas','cupula'],
 'santa-maria-abside':['abside','traceria-abside','contrafuertes-abside'],
 'santa-maria-contrafuertes':['puentes-agua','contrafuertes','gargolas'],
 'santa-maria-campanario':['campanario-base','campanario','campanas','corona-hierro'],
 'santa-maria-reloj':['reloj','campanario'],
 'santa-maria-plaza-mayor':['santa-maria-plaza-mayor'],
 'santa-maria-cavallers':['santa-maria-cavallers'],
 'santa-maria-sagrario':['santa-maria-sagrario'],
 'santa-maria-berenguer':['santa-maria-berenguer']
};
const STOPS=[
 ['santa-maria-conjunto','Santa María en su entorno','conjunto',-1,-3,18,32,[80,62,75]],
 ['santa-maria-portada-norte','La portada gótica del norte','exterior',19.42,.35,5.5,5.6,[8,9,18]],
 ['santa-maria-escalinata','La escalinata y sus inscripciones','entorno',23.2,.35,0.4,9,[27,15,2]],
 ['santa-maria-portada-sur','La portada del sur','exterior',-21.55,.35,5.4,5.4,[-24,9,-1]],
 ['santa-maria-portada-principal','La portada barroca','exterior',-1.1,-27.72,9.3,10,[2,12,-35]],
 ['santa-maria-naves','Tres naves y pilares octogonales','interior',-1.1,-3.4,9,17,[32,34,-32]],
 ['santa-maria-bovedas','Bóvedas y nervios','interior',-1.1,2.6,18,12,[26,28,-24]],
 ['santa-maria-capillas','Capillas entre contrafuertes','interior',16.1,-6.2,5.8,8,[24,28,-15]],
 ['santa-maria-abside','El ábside y sus tracerías','exterior',-1.1,17,13.5,12,[-24,18,32]],
 ['santa-maria-contrafuertes','Contrafuertes y puentes de agua','exterior',-12,-3.4,20,12,[-32,20,6]],
 ['santa-maria-campanario','El Campanar de la Vila','campanario',16.46,11.2,28,26,[34,16,35]],
 ['santa-maria-reloj','El reloj público','campanario',19.5,11.2,24,5,[22,5,10]],
 ['santa-maria-plaza-mayor','La Plaça Major','entorno',56.556444,20.794145,-2,21,[21,30,31]],
 ['santa-maria-cavallers','Carrer dels Cavallers','entorno',25.4,-16,-2,13,[25,24,-12]],
 ['santa-maria-sagrario','Sagrario y los restos antiguos','entorno',1.62,23.6,1.5,12,[-12,24,27]],
 ['santa-maria-berenguer','Casa dels Berenguer','entorno',-29.320773,19.929806,6,12,[-27,26,25]]
];
const MATERIALS={
 stone:{color:'#bdb4a0',roughness:.96,map:'stone'},trim:{color:'#d5cdb8',roughness:.9},
 brick:{color:'#b47461',roughness:.97,map:'brick'},tiles:{color:'#b78d63',roughness:.95,map:'tiles'},
 plaster:{color:'#d3c6ad',roughness:.97},paving:{color:'#aaa18e',roughness:.98},
 wood:{color:'#73523e',roughness:.9},metal:{color:'#4c4a42',roughness:.63,metalness:.5},
 bronze:{color:'#928268',roughness:.72,metalness:.55},blue:{color:'#527785',roughness:.5},
 glass:{color:'#afbfc1',roughness:.24,transparent:true,opacity:.24},dark:{color:'#5a5851',roughness:.97}
};
function texture(type){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle=type==='brick'?'#947066':type==='tiles'?'#9d7a59':'#a9a392';ctx.fillRect(0,0,256,256);
 const rows=type==='tiles'?19:type==='brick'?23:15,cols=type==='brick'?10:type==='tiles'?14:6;
 for(let r=0;r<rows;r++)for(let col=-1;col<=cols;col++){
  const n=noise(r*39+col+99),w=256/cols,h=256/rows,x=col*w+(r%2?w/2:0),y=r*h;
  ctx.fillStyle=type==='brick'?`hsl(${12+n*6},${20+n*15}%,${41+n*17}%)`:type==='tiles'?`hsl(${22+n*9},${27+n*17}%,${40+n*16}%)`:`hsl(${37+n*8},${9+n*8}%,${53+n*15}%)`;
  ctx.fillRect(x+.6,y+.6,w-1.2,h-1.1);ctx.fillStyle='rgba(255,245,220,.13)';ctx.fillRect(x+1,y+1,w-2,.7);
 }
 for(let i=0;i<2200;i++){ctx.fillStyle=i%2?'rgba(40,38,31,.08)':'rgba(245,235,210,.09)';ctx.fillRect(noise(i+71)*256,noise(i+14)*256,1.3,.8);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
class Batch{
 constructor(){this.parts=new Map();this.boxGeo=new THREE.BoxGeometry(1,1,1).toNonIndexed();}
 key(component,period='mixed',kind='stone'){return component+'|'+period+'|'+kind;}
 geom(key,geo,m=ID,tint=1){
  const g=geo.index?geo.toNonIndexed():geo;if(!g.attributes.normal)g.computeVertexNormals();
  let out=this.parts.get(key);if(!out){out={p:[],n:[],u:[],c:[]};this.parts.set(key,out);}
  const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),nv=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m);
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(m);nv.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();out.p.push(v.x,v.y,v.z);out.n.push(nv.x,nv.y,nv.z);
   const ax=Math.abs(nv.x),ay=Math.abs(nv.y),az=Math.abs(nv.z),scale=key.endsWith('|brick')?2.8:3.4;
   out.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/scale,(ay>ax&&ay>az?v.z:v.y)/scale);out.c.push(tint,tint,tint);
  }
  if(g!==geo)g.dispose();
 }
 box(k,x,y,z,w,h,d,yaw=0,tint=1){if(w<=0||h<=0||d<=0)return;this.geom(k,this.boxGeo,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(w,h,d)),tint);}
 raw(k,p,tint=1){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geom(k,g,ID,tint);g.dispose();}
 cylinder(k,x,y,z,rTop,rBottom,h,n=12,tint=1){const g=new THREE.CylinderGeometry(rTop,rBottom,h,n);this.geom(k,g,new THREE.Matrix4().makeTranslation(x,y,z),tint);g.dispose();}
 beam(k,a,b,r=.07,tint=1,n=7){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),v=vb.clone().sub(va),h=v.length();if(h<1e-5)return;const g=new THREE.CylinderGeometry(r,r,h,n),m=new THREE.Matrix4().compose(va.add(vb).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,v.normalize()),new THREE.Vector3(1,1,1));this.geom(k,g,m,tint);g.dispose();}
 finish(group){
  const textures={stone:texture('stone'),brick:texture('brick'),tiles:texture('tiles')},materials=[],geometries=[];
  for(const[key,arr]of this.parts){
   const[component,period,kind]=key.split('|'),def=MATERIALS[kind],m=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness||0,map:def.map?textures[def.map]:null,transparent:!!def.transparent,opacity:def.opacity??1,vertexColors:true,side:THREE.DoubleSide});
   const g=new THREE.BufferGeometry();for(const[name,a,size]of[['position',arr.p,3],['normal',arr.n,3],['uv',arr.u,2],['color',arr.c,3]])g.setAttribute(name,new THREE.Float32BufferAttribute(a,size));g.computeBoundingBox();g.computeBoundingSphere();
   const mesh=new THREE.Mesh(g,m);mesh.name='Santa María · '+component+' · '+kind;mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;
   mesh.userData={santaMariaFabric:true,component,period,materialKind:kind,baseColor:m.color.clone(),baseMap:m.map,sourceKeys:['sm-cabrera-1987','sm-zaragoza-2000','sm-turismo'],dimensionStatus:'Approximate visual / plan registration; not a measured elevation'};
   group.add(mesh);materials.push(m);geometries.push(g);
  }
  this.boxGeo.dispose();return{materials,textures:Object.values(textures),geometries};
 }
}
function quad(out,a,b,c,d){out.push(...a,...b,...c,...a,...c,...d);}
function path(points,Class=THREE.Shape){const s=new Class();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
function shapeMesh(b,k,s,x,y,z,depth=.7,yaw=0,tint=1){const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:18,steps:1});g.translate(0,0,-depth/2);const m=new THREE.Matrix4().makeRotationY(yaw);m.setPosition(x,y,z);b.geom(k,g,m,tint);g.dispose();}
function arch(w,h,pointed=true){
 const r=w/2,spring=pointed?h-w*.78:h-r,p=[[-r,0],[-r,spring]];
 if(pointed){for(let i=1;i<=18;i++){const a=PI-i*PI/54;p.push([r+2*r*Math.cos(a),spring+(h-spring)*Math.sin(a)/(Math.sqrt(3)/2)]);}for(let i=1;i<=18;i++){const a=PI/3-i*PI/54;p.push([-r+2*r*Math.cos(a),spring+(h-spring)*Math.sin(a)/(Math.sqrt(3)/2)]);}}
 else for(let i=1;i<=36;i++){const a=PI-i*PI/36;p.push([r*Math.cos(a),spring+r*Math.sin(a)]);}
 p.push([r,0]);return p;
}
const rect=(w,h)=>[[-w/2,0],[w/2,0],[w/2,h],[-w/2,h]];
function wall(b,k,{x,y=0,z,w,h,d=.85,yaw=0,holes=[]}){
 const s=path(rect(w,h));for(const a of holes){const points=(a.rect?rect(a.w,a.h):arch(a.w,a.h,a.pointed!==false)).map(([u,v])=>[u+(a.u||0),v+(a.y||0)]);s.holes.push(path(points.reverse(),THREE.Path));}shapeMesh(b,k,s,x,y,z,d,yaw);
}
function ring(b,k,{x,y,z,w,h,t=.22,d=.18,yaw=0,pointed=true}){
 const s=path(arch(w+t*2,h+t,pointed).map(([u,v])=>[u,v-t*.3]));s.holes.push(path(arch(w,h,pointed).reverse(),THREE.Path));shapeMesh(b,k,s,x,y,z,d,yaw);
}
function onFace(x,z,yaw,u,v=0){return[x+u*Math.cos(yaw)+v*Math.sin(yaw),z-u*Math.sin(yaw)+v*Math.cos(yaw)];}
function star(b,k,x,y,z,r,points=5,yaw=0){
 const coords=[];for(let i=0;i<points;i++){const a=TAU*i/points;coords.push([Math.sin(a)*r,Math.cos(a)*r]);}
 const step=points===8?3:2;for(let i=0;i<points;i++){const a=coords[i],c=coords[(i+step)%points],[ax,az]=onFace(x,z,yaw,a[0]),[cx,cz]=onFace(x,z,yaw,c[0]);b.beam(k,[ax,y+a[1],az],[cx,y+c[1],cz],.048,.96,6);}
}
function traceriedWindow(b,k,{x,y,z,w,h,yaw=0,starPoints=0,mullions=1,glazed=true}){
 ring(b,k,{x,y,z,w,h,t:.18,d:.20,yaw});const inner=b.key(k.split('|')[0],k.split('|')[1],'trim');
 const split=h-w*.8;for(let i=1;i<=mullions;i++){const u=-w/2+i*w/(mullions+1),[xx,zz]=onFace(x,z,yaw,u,.02);b.box(inner,xx,y+split/2,zz,.085,split,.14,yaw);}
 if(starPoints){const[xx,zz]=onFace(x,z,yaw,0,.04),cy=y+h-w*.55,r=w*.29,g=new THREE.TorusGeometry(r,.055,6,28),m=new THREE.Matrix4().makeRotationY(yaw);m.setPosition(xx,cy,zz);b.geom(inner,g,m);g.dispose();star(b,inner,xx,cy,zz,r*.84,starPoints,yaw);}
 else {const lobes=mullions+1;for(let j=0;j<lobes;j++){const u=-w/2+(j+.5)*w/lobes,[xx,zz]=onFace(x,z,yaw,u,.04);ring(b,inner,{x:xx,y:y+split-.15,z:zz,w:w/lobes*.88,h:w/lobes*.9,t:.065,d:.12,yaw});}}
 if(glazed)shapeMesh(b,b.key(k.split('|')[0],k.split('|')[1],'glass'),path(arch(w-.08,h-.08)),x,y+.04,z,.018,yaw);
}
function flatSolid(b,k,poly,y,h,tint=1){const shape=path(poly.map(([x,z])=>[x,-z])),g=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});g.rotateX(-PI/2);g.translate(0,y,0);b.geom(k,g,ID,tint);g.dispose();}
function portal(b,K,{id,x,z,y=.12,yaw,w=3.5,h=4.8,archH=7.4,rings=4,period='medieval'}){
 const k=K(id,period,'trim'),outerW=w+1.0;
 // Stone tympanum over the actual rectangular, recessed timber opening.
 const tympanum=path(arch(outerW,archH));tympanum.holes.push(path(rect(w,h).reverse(),THREE.Path));shapeMesh(b,K(id,period,'stone'),tympanum,x,y,z,.48,yaw);
 for(let n=0;n<rings;n++){const[xx,zz]=onFace(x,z,yaw,0,.16+n*.13);ring(b,k,{x:xx,y,z:zz,w:outerW+n*.43,h:archH+n*.29,t:.105,d:.16,yaw});}
 for(const side of[-1,1])for(let n=0;n<rings;n++){
  const[xx,zz]=onFace(x,z,yaw,side*(outerW/2+.19+n*.21),.13+n*.12);b.cylinder(k,xx,y+1.9,zz,.12,.12,3.8,8);b.box(k,xx,y+.15,zz,.30,.30,.30);b.box(k,xx,y+3.8,zz,.33,.23,.33);
 }
 for(const side of[-1,1]){const[xx,zz]=onFace(x,z,yaw,side*(outerW/2+.94),.32);b.box(k,xx,y+3.75,zz,.42,.48,.5);}
 const[dX,dZ]=onFace(x,z,yaw,0,-.30);b.box(K(id,'mixed','wood'),dX,y+h/2,dZ,w-.08,h,.12,yaw);
 for(let n=-4;n<=4;n++){const[xx,zz]=onFace(x,z,yaw,n*w/10,-.22);b.box(K(id,'mixed','wood'),xx,y+h/2,zz,.022,h-.10,.035,yaw,.72);}
 for(const yy of[.8,2.0,3.4])for(const side of[-1,1]){const[xx,zz]=onFace(x,z,yaw,side*w*.25,-.19);b.box(K(id,'mixed','metal'),xx,y+yy,zz,w*.42,.055,.04,yaw);}
}
function roof(b,k,{x0,x1,z0,z1,y0,y1,ridges=true}){
 const p=[];quad(p,[x0,y0,z0],[x1,y1,z0],[x1,y1,z1],[x0,y0,z1]);b.raw(k,p);
 if(ridges)for(let i=0;i<=Math.ceil((z1-z0)/.55);i++){const z=z0+(z1-z0)*i/Math.ceil((z1-z0)/.55);b.beam(k,[x0,y0+.055,z],[x1,y1+.055,z],.052,.82+noise(i+x0)*.18,5);}
}
function vault(b,K,{id='bovedas',x0,x1,z0,z1,spring,top,period='mixed',web=true}){
 const cx=(x0+x1)/2,cz=(z0+z1)/2,a=(x1-x0)/2,d=(z1-z0)/2,k=K(id,period,'plaster'),rib=K('nervios',period,'trim');
 // Four intersecting webs; exact stereotomy and deformation are not surveyed.
 const yAt=(x,z)=>spring+(top-spring)*Math.sqrt(Math.max(0,1-Math.min(((x-cx)/a)**2,((z-cz)/d)**2)));
 if(web){const p=[],N=14;for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=x0+(x1-x0)*i/N,xx=x0+(x1-x0)*(i+1)/N,z=z0+(z1-z0)*j/N,zz=z0+(z1-z0)*(j+1)/N;quad(p,[x,yAt(x,z),z],[xx,yAt(xx,z),z],[xx,yAt(xx,zz),zz],[x,yAt(x,zz),zz]);}b.raw(k,p,.98);}
 for(const pair of[[[x0,z0],[x1,z1]],[[x1,z0],[x0,z1]],[[x0,z0],[x1,z0]],[[x0,z1],[x1,z1]],[[x0,z0],[x0,z1]],[[x1,z0],[x1,z1]]]){
  let prev;for(let i=0;i<=24;i++){const t=i/24,x=pair[0][0]+(pair[1][0]-pair[0][0])*t,z=pair[0][1]+(pair[1][1]-pair[0][1])*t,y=yAt(x,z),p=[x,y-.14,z];if(prev)b.beam(rib,prev,p,.13,1,6);prev=p;}
 }
 b.cylinder(rib,cx,top-.18,cz,.29,.25,.26,12);
}
function cornice(b,k,x,z,w,d,y){b.box(k,x,y,z,w+.23,.23,d+.23);b.box(k,x,y+.22,z,w+.48,.16,d+.48);}
function bell(b,k,x,y,z,s=1){const p=[[.08,.65],[.16,.56],[.22,.32],[.30,.03],[.46,-.18],[.48,-.27],[.36,-.29]].reverse().map(([r,h])=>new THREE.Vector2(r*s,h*s)),g=new THREE.LatheGeometry(p,18);g.translate(x,y,z);b.geom(k,g);g.dispose();b.cylinder(k,x,y-.28*s,z,.06*s,.07*s,.6*s,8);}
function clock(b,K,x,y,z,yaw=0,r=1.0){
 const k=K('reloj','contemporary','trim'),metal=K('reloj','contemporary','metal'),g=new THREE.CircleGeometry(r,48),m=new THREE.Matrix4().makeRotationY(yaw);m.setPosition(x,y,z);b.geom(k,g,m);g.dispose();
 const tor=new THREE.TorusGeometry(r,.075,7,48);b.geom(k,tor,m);tor.dispose();
 for(let i=0;i<12;i++){const a=TAU*i/12,u=Math.sin(a)*r*.76,yy=Math.cos(a)*r*.76,[xx,zz]=onFace(x,z,yaw,u,.04);b.beam(metal,[xx,yy+y-.065,zz],[xx,yy+y+.065,zz],.025);}
 const point=(u,v)=>{const[xx,zz]=onFace(x,z,yaw,u,.055);return[xx,y+v,zz];};b.beam(metal,point(0,0),point(-r*.24,r*.43),.035);b.beam(metal,point(0,0),point(r*.60,r*.13),.025);
}

export function createSantaMaria({record,project,heightAt=()=>0,visitData}={}){
 if(!record?.footprint?.length)throw new Error('Santa María requires its mapped footprint');
 const center=project(...record.coordinate),c=Math.cos(YAW),s=Math.sin(YAW),worldOutline=record.footprint.slice(0,-1).map(p=>project(...p));
 const toWorld=(x,z)=>({x:center.x+x*c+z*s,z:center.z-x*s+z*c});
 const toLocal=(x,z)=>{const dx=x-center.x,dz=z-center.z;return{x:dx*c-dz*s,z:dx*s+dz*c};};
 const footprintLocal=worldOutline.map(p=>toLocal(p.x,p.z));
 const heights=worldOutline.map(p=>heightAt(p.x,p.z)).sort((a,b)=>a-b),south=toWorld(-21.55,.35);
 const base=Math.max(heights[Math.floor(heights.length/2)]+.12,heightAt(south.x,south.z)+.14);
 const localWorld=(x,y,z)=>{const p=toWorld(x,z);return new THREE.Vector3(p.x,base+y,p.z);};
 const geographical=(x,z)=>{const p=toWorld(x,z);return[p.x/LON_SCALE-.278,39.679-p.z/111320];};
 const frame={center,coordinate:record.coordinate,base,yaw:YAW,toWorld,toLocal,localWorld,geographical,footprintLocal,worldOutline,outline:record.footprint};
 const group=new THREE.Group();group.name='Santa María · iglesia conservada';group.position.set(center.x,base,center.z);group.rotation.y=YAW;
 const b=new Batch(),K=(...a)=>b.key(...a),planComponents=[];
 const plan=(id,points,kind,period,closed=true)=>planComponents.push({id,coordinates:points.map(([x,z])=>geographical(x,z)),kind,period,closed,interpretive:period==='interpretation'});
 const qa={openings:[],floorSamples:[],registeredCenter:record.coordinate,yaw:YAW,documented:{naves:3,tramos:4,gothicMainVaultBays:2,apseWindows:3,apseButtresses:4,mainVaultHeightM:24,towerOverallHeightM:58},floorRegistration:{base,method:'Approximate church floor accommodates the high southern threshold in IGN MDT; no measured pavement level is claimed.'},crypt:{modelled:false,reason:'The cited description records a blocked crypt; no reliable interior geometry is available.'},doorLeaves:'Timber leaves occupy the actual pierced reveals; QA distinguishes leaves and glazing from structural blockage.',windowTracery:'Simplified five- and eight-point patterns, not a sculptural facsimile.'};
 const recordOpening=(id,x,y,z,yaw,width,height,distance=2,kind='window')=>{const o=localWorld(x,y,z),direction=[-Math.sin(yaw),0,-Math.cos(yaw)];qa.openings.push({id,kind,width,height,distance,localOrigin:[x,y,z],localDirection:direction,origin:o.toArray(),direction:[direction[0]*c+direction[2]*s,0,-direction[0]*s+direction[2]*c]});};

 // A thin occupied floor and subgrade foundation replace the old solid block.
 flatSolid(b,K('cimiento','interpretation','stone'),footprintLocal.map(p=>[p.x,p.z]),-5.6,5.52,.87);
 flatSolid(b,K('pavimento','mixed','paving'),footprintLocal.map(p=>[p.x,p.z]),-.08,.20);
 for(let x=-20;x<19;x+=2.3)b.box(K('pavimento','mixed','trim'),x,.125,-6,.025,.006,41.6,0,.8);
 for(let z=-26;z<14;z+=2.3)b.box(K('pavimento','mixed','trim'),-1.0,.125,z,39.3,.006,.025,0,.8);
 for(const[x,z]of[[-1,-22],[-1,-9],[-1,4],[-1,13],[10,-9],[-12,-9],[16,-6]])qa.floorSamples.push(localWorld(x,.12,z).toArray());
 plan('nave-central',[[-8.2,-27.4],[5.8,-27.4],[5.8,14.85],[-8.2,14.85]],'nave','mixed');
 plan('nave-norte',[[5.8,-27.4],[14.1,-27.4],[14.1,14.85],[5.8,14.85]],'nave','mixed');
 plan('nave-sur',[[-16.2,-27.4],[-8.2,-27.4],[-8.2,14.85],[-16.2,14.85]],'nave','mixed');

 // Outer chapel walls: four narrow medieval windows and a later western bay.
 const northHoles=[{u:-.35,w:4.5,h:7.45,y:.12},...[11.2,5.55,-5.75,-11.85].map(z=>({u:-z,w:.92,h:7.1,y:4.45})),{u:20.8,w:1.2,h:2.2,y:5.0,rect:true}];
 wall(b,K('muro-norte','mixed','stone'),{x:19.42,z:-6.35,w:42.2,h:13.45,yaw:PI/2,holes:northHoles.map(o=>({...o,u:o.u-6.35}))});
 const southHoles=[{u:.35+6.35,w:4.4,h:7.2,y:.12},{u:5.7+6.35,w:1.25,h:6.6,y:4.4},{u:-10.5+6.35,w:1.25,h:2.4,y:5.4,rect:true},{u:-20.7+6.35,w:1.0,h:2.5,y:5.3,rect:true}];
 wall(b,K('muro-sur','mixed','stone'),{x:-21.55,z:-6.35,w:42.2,h:13.45,yaw:-PI/2,holes:southHoles});
 portal(b,K,{id:'portada-norte',x:19.86,z:.35,yaw:PI/2,w:3.45,h:4.7,archH:7.45,rings:5});
 portal(b,K,{id:'portada-sur',x:-21.99,z:.35,yaw:-PI/2,w:3.35,h:4.65,archH:7.2,rings:3});
 for(const z of[5.55,-5.75,-11.85]){traceriedWindow(b,K('muro-norte','medieval','trim'),{x:19.87,y:4.45,z,w:.92,h:7.1,yaw:PI/2});recordOpening('capilla-norte-'+z,20.4,7,z,PI/2,.6,3,2.1);}
 traceriedWindow(b,K('muro-sur','medieval','trim'),{x:-22.0,y:4.4,z:5.7,w:1.25,h:6.6,yaw:-PI/2});recordOpening('capilla-sur',-22.6,7,5.7,-PI/2,.8,3,2.1);
 // The aisle heads flank the polygonal apse; the southern outer compartment
 // is a sacristy, not an additional invented continuation of the central nave.
 for(const[x,w]of[[-12.2,8.0],[9.95,8.3]]){
  const head=path([[-w/2,0],[w/2,0],[w/2,x<0?22.5:16.9],[-w/2,x<0?16.9:22.5]]);
  head.holes.push(path(arch(2.35,11.7).map(([u,v])=>[u,v+3.2]).reverse(),THREE.Path));shapeMesh(b,K('cabecera-lateral','mixed','stone'),head,x,0,14.85,.85);
  traceriedWindow(b,K('cabecera-lateral','medieval','trim'),{x,y:3.2,z:15.3,w:2.35,h:11.7,starPoints:5,mullions:1});recordOpening('ventanal-cabecera-'+x,x,8,16,0,2.0,8,2.4);
 }
 wall(b,K('sacristia','mixed','stone'),{x:-18.88,z:14.85,w:5.35,h:13.45,holes:[{w:.65,h:1.5,y:3.4,pointed:false},{w:.65,h:1.5,y:8.2,pointed:false}]});
 shapeMesh(b,K('sacristia','mixed','stone'),path([[-2.675,13.45],[2.675,13.45],[2.675,16.1],[-2.675,13.85]]),-18.88,0,14.85,.85);
 for(const y of[3.4,8.2])traceriedWindow(b,K('sacristia','mixed','trim'),{x:-18.88,y,z:15.3,w:.65,h:1.5,mullions:0});
 for(const side of[-1,1]){const x=side===1?19.42:-21.55;b.box(K('cornisas','mixed','trim'),x,13.48,-6.35,1.16,.30,42.4);}
 for(const[id,x,yaw]of[['norte',19.42,PI/2],['sur',-21.55,-PI/2]])recordOpening('portada-'+id,x+Math.sin(yaw)*1.25,2.25,.35,yaw,3.2,4.3,2.6,'door');
 b.box(K('umbrales','mixed','stone'),19.85,.025,.35,1.0,.19,4.2);b.box(K('umbrales','mixed','stone'),-22.0,.025,.35,1.0,.19,4.2);
 plan('portada-norte',[[19.4,-2],[20.4,-2],[20.4,2.7],[19.4,2.7]],'portal','medieval');
 plan('portada-sur',[[-22.3,-2],[-21.5,-2],[-21.5,2.7],[-22.3,2.7]],'portal','medieval');

 // Octagonal supports, open longitudinal arcades and chapel arches. Two large
 // medieval rib-vault bays survive between the short head and later west bay.
 const bayEnds=[-27.35,-15.65,-3.45,8.8,14.85],chapelEnds=[-27.35,-21.55,-15.65,-9.55,-3.45,2.65,8.8,14.85];
 for(const x of[-8.2,5.8])for(const z of bayEnds.slice(0,-1)){
  const zz=z===bayEnds[0]?z+.92:z; // west supports remain inside the later facade
  b.cylinder(K('pilares','medieval','stone'),x,7.9,zz,.89,.96,15.8,8);b.cylinder(K('pilares','medieval','trim'),x,.31,zz,1.12,1.19,.62,8);b.cylinder(K('pilares','mixed','trim'),x,15.72,zz,1.02,.92,.36,8);
 }
 for(const x of[-8.2,5.8])for(let i=0;i<bayEnds.length-1;i++){
  const z0=bayEnds[i],z1=bayEnds[i+1],z=(z0+z1)/2,w=z1-z0,pointed=i===3,openH=pointed?16.8:18.65,period=i===0?'modern':'mixed',holes=[{u:0,w:w-1.55,h:openH,y:.12,pointed}];
  if(i===1||i===2)holes.push({u:0,w:1.30,h:2.10,y:21.2,rect:true});
  wall(b,K('arcadas',period,'stone'),{x,z,w,h:24.9,d:.72,yaw:PI/2,holes});
  const outside=x>0?PI/2:-PI/2;recordOpening('arcada-'+x+'-'+i,x+Math.sin(outside)*1.1,6,z,outside,Math.min(3,w-2),8,2.2,'arcade');
  ring(b,K('arcadas',period,'trim'),{x:x+.02,y:.12,z,w:w-1.55,h:openH,t:.25,d:.88,yaw:PI/2,pointed});
  if(i===1||i===2){for(const sign of[-1,1]){const xx=x+sign*.42;ring(b,K('claristorio','mixed','trim'),{x:xx,y:19.75,z,w:2.7,h:4.4,t:.16,d:.13,yaw:sign*PI/2});b.box(K('claristorio','mixed','trim'),xx,22.25,z,.15,2.18,.095);}}
 }
 for(const x of[-16.2,14.1])for(let i=0;i<chapelEnds.length-1;i++){
  const z0=chapelEnds[i],z1=chapelEnds[i+1],w=z1-z0,z=(z0+z1)/2,medieval=i>=2;
  wall(b,K('capillas',medieval?'medieval':'modern','stone'),{x,z,w,h:16.45,d:.66,yaw:PI/2,holes:[{w:w-1.12,h:10.8,y:.12,pointed:medieval}]});
  ring(b,K('capillas',medieval?'medieval':'modern','trim'),{x,y:.12,z,w:w-1.12,h:10.8,t:.20,d:.80,yaw:PI/2,pointed:medieval});
  for(const zz of[z0,z1])b.box(K('pilares-capillas',medieval?'medieval':'modern','stone'),x,6.8,zz,1.15,13.6,.9);
  const outer=x>0?19.42:-21.55;for(const zz of[z0,z1])b.box(K('capillas',medieval?'medieval':'modern','stone'),(x+outer)/2,5.6,zz,Math.abs(outer-x),11.2,.7);
  vault(b,K,{id:'bovedas-capillas',x0:Math.min(x,outer)+.4,x1:Math.max(x,outer)-.4,z0:z0+.4,z1:z1-.4,spring:7.7,top:11.65,period:medieval?'medieval':'modern'});
  plan('capilla-'+(x>0?'n':'s')+'-'+i,[[x,z0],[outer,z0],[outer,z1],[x,z1]],'chapel',medieval?'medieval':'modern');
 }
 for(let i=0;i<3;i++){
  vault(b,K,{x0:-8.15,x1:5.75,z0:bayEnds[i]+.4,z1:bayEnds[i+1]-.4,spring:16.25,top:24,period:i===0?'modern':'mixed'});
  for(const[x0,x1]of[[-16.15,-8.25],[5.85,14.05]])vault(b,K,{id:'bovedas-laterales',x0,x1,z0:bayEnds[i]+.4,z1:bayEnds[i+1]-.4,spring:11.85,top:18.75,period:i===0?'modern':'mixed'});
 }
 for(const[x0,x1]of[[-16.15,-8.25],[5.85,14.05]])vault(b,K,{id:'bovedas-laterales',x0,x1,z0:9.2,z1:14.45,spring:11.85,top:18.0,period:'medieval'});

 // Five-sided head: three genuinely pierced, high traceried facets. Four
 // external buttresses align with the mapped projections of the perimeter.
 const apse=[[-8.2,8.8],[-8.2,14.85],[-4.9,18.15],[2.5,18.9],[5.8,14.85],[5.8,8.8]],facetWindows=[1,2,3];
 for(let i=0;i<apse.length-1;i++){
  const a=apse[i],d=apse[i+1],dx=d[0]-a[0],dz=d[1]-a[1],w=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx),x=(a[0]+d[0])/2,z=(a[1]+d[1])/2,has=facetWindows.includes(i),ww=i===2?2.8:2.35;
  wall(b,K('abside','medieval','stone'),{x,z,w,h:25,d:.95,yaw,holes:has?[{w:ww,h:17.3,y:3.35}]:[{w:w-1.55,h:16.8,y:.12}]});
  if(has){const nx=Math.sin(yaw),nz=Math.cos(yaw);traceriedWindow(b,K('traceria-abside','medieval','trim'),{x:x+nx*.49,y:3.35,z:z+nz*.49,w:ww,h:17.3,yaw,starPoints:i===2?5:8,mullions:1});recordOpening('ventanal-abside-'+i,x+nx*1.2,10,z+nz*1.2,yaw,ww-.3,10,2.6);}
  b.box(K('abside','mixed','trim'),x,25.02,z,w+.12,.28,1.12,yaw);
 }
 for(const[x,z]of[[-8.2,14.85],[-4.9,18.15],[2.5,18.9],[5.8,14.85]]){
  const yaw=Math.atan2(x+1.2,z-11.7),nx=Math.sin(yaw),nz=Math.cos(yaw);b.box(K('contrafuertes-abside','medieval','stone'),x+nx*.55,12.4,z+nz*.55,1.14,24.8,1.8,yaw);b.box(K('contrafuertes-abside','mixed','trim'),x+nx*.55,25,z+nz*.55,1.32,.32,2.0,yaw);
 }
 for(const[x,z]of[[-8.7,14.9],[6.15,14.85]]){b.cylinder(K('torretas','medieval','stone'),x,24.8,z,.85,.85,3.3,8);b.cylinder(K('torretas','mixed','tiles'),x,26.95,z,0,1.08,1.15,8);}
 const apRoof=[],peak=[-1.2,27.7,14.85];for(let i=0;i<apse.length-1;i++){const a=apse[i],d=apse[i+1];apRoof.push(a[0],25.2,a[1],d[0],25.2,d[1],...peak);b.beam(K('cubiertas','mixed','tiles'),[a[0],25.25,a[1]],peak,.10);}
 b.raw(K('cubiertas','mixed','tiles'),apRoof);plan('abside',apse,'apse','medieval');
 // Radial ribs of the apse remain readable when its didactic web is removed.
 for(const[x,z]of apse){let prev;for(let i=0;i<=24;i++){const t=i/24,p=[x+(-1.2-x)*t,16.25+7.75*Math.sin(t*PI/2),z+(12.0-z)*t];if(prev)b.beam(K('nervios','medieval','trim'),prev,p,.14);prev=p;}}
 const apWeb=[];for(let i=0;i<apse.length-1;i++)for(let j=0;j<16;j++){const t0=j/16,t1=(j+1)/16,P=(a,t)=>[a[0]+(-1.2-a[0])*t,16.25+7.75*Math.sin(t*PI/2),a[1]+(12-a[1])*t];quad(apWeb,P(apse[i],t0),P(apse[i+1],t0),P(apse[i+1],t1),P(apse[i],t1));}b.raw(K('boveda-abside','mixed','plaster'),apWeb);
 b.box(K('presbiterio','interpretation','paving'),-1.2,.24,13.3,11.4,.24,5.6);b.box(K('presbiterio','interpretation','stone'),-1.2,1.04,14.0,2.2,.24,1.15);b.box(K('presbiterio','interpretation','stone'),-1.2,.64,14.0,.70,.75,.65);

 // Three height levels, tiled roofs and round drainage bridges. These bridges
 // are not presented as correctly calculated Gothic flying buttresses.
 for(const[x0,x1,y0,y1]of[[-8.55,-1.2,25.2,27.7],[-1.2,6.15,27.7,25.2],[-16.5,-8.55,16.9,22.5],[6.15,14.4,22.5,16.9],[-21.9,-16.5,13.7,16.0],[14.4,19.8,16.0,13.7]])roof(b,K('cubiertas','mixed','tiles'),{x0,x1,z0:-27.8,z1:14.9,y0,y1});
 for(const side of[-1,1])for(const z of[-15.65,-3.45,8.8]){
  const inner=side>0?6.1:-8.5,outer=side>0?14.2:-16.4,w=Math.abs(outer-inner),cx=(inner+outer)/2,points=side>0?[[-w/2,16.45],[w/2,16.45],[w/2,18.1],[-w/2,24.15]]:[[-w/2,16.45],[w/2,16.45],[w/2,24.15],[-w/2,18.1]],sh=path(points);
  sh.holes.push(path(arch(w-1.05,(w-1.05)/2,false).map(([u,v])=>[u,v+16.45]).reverse(),THREE.Path));shapeMesh(b,K('puentes-agua','mixed','stone'),sh,cx,0,z,.72,0);
  b.box(K('contrafuertes','mixed','stone'),outer,9.3,z,1.35,18.6,1.1);b.box(K('contrafuertes','modern','trim'),outer,18.78,z,1.6,.35,1.35);b.cylinder(K('contrafuertes','modern','trim'),outer,19.3,z,.14,.3,.7,6);
  b.beam(K('puentes-agua','mixed','trim'),[inner,24.3,z],[outer,18.4,z],.12);b.box(K('gargolas','mixed','stone'),outer+side*.65,17.95,z,1.1,.25,.32,0,.8);
 }
 // The north-west chapel's documented blue-tiled octagonal dome. Decoration
 // and imagery are omitted; the dome is an approximate external envelope.
 const domeX=10.2,domeZ=-21.2; b.cylinder(K('cupula','modern','stone'),domeX,19.6,domeZ,3.2,3.2,1.25,8);
 const dome=[],r=3.24;for(let i=0;i<32;i++)for(let j=0;j<12;j++){const a=i*TAU/32,aa=(i+1)*TAU/32,t=j*PI/24,tt=(j+1)*PI/24,P=(u,v)=>[domeX+r*Math.cos(v)*Math.cos(u),20.2+3.4*Math.sin(v),domeZ+r*Math.cos(v)*Math.sin(u)];quad(dome,P(a,t),P(aa,t),P(aa,tt),P(a,tt));}b.raw(K('cupula','modern','blue'),dome);
 for(let i=0;i<16;i++){const a=i*TAU/16;let prev;for(let j=0;j<=16;j++){const t=j*PI/32,p=[domeX+r*Math.cos(t)*Math.cos(a),20.25+3.4*Math.sin(t),domeZ+r*Math.cos(t)*Math.sin(a)];if(prev)b.beam(K('cupula','modern','trim'),prev,p,.045,.74);prev=p;}}
 b.cylinder(K('cupula','modern','trim'),domeX,24.1,domeZ,.44,.55,1.0,8);b.cylinder(K('cupula','modern','blue'),domeX,24.85,domeZ,0,.65,.65,8);

 // West front: a rectangular Baroque doorway, two orders of four pilasters,
 // empty shell niche and broken segmental pediment, never a fictitious Gothic
 // west portal. No statue is reinstated in the documented empty niche.
 const westProfile=path([[-21.55,0],[19.42,0],[19.42,13.85],[14.4,16.0],[14.4,16.9],[6.15,22.5],[6.15,25.2],[-1.2,27.7],[-8.55,25.2],[-8.55,22.5],[-16.5,16.9],[-16.5,16.0],[-21.55,13.85]].map(([x,y])=>[-(x+1.1),y]));
 westProfile.holes.push(path(rect(3.85,5.25).map(([u,v])=>[u,v+.12]).reverse(),THREE.Path));shapeMesh(b,K('muro-occidental','modern','stone'),westProfile,-1.1,0,-27.68,.85,PI);
 const west=K('portada-principal','modern','trim'),faceZ=-28.18;
 for(const[y,h,ww]of[[.12,5.25,3.85],[9.9,4.35,2.2]]){
  if(y<1){b.box(west,-1.1,y+h+.18,faceZ,ww+.65,.40,.42);for(const side of[-1,1])b.box(west,-1.1+side*(ww/2+.22),y+h/2,faceZ,.38,h,.42);}
  else{ring(b,west,{x:-1.1,y,z:faceZ,w:ww,h,t:.22,d:.38,yaw:PI,pointed:false});shapeMesh(b,K('portada-principal','modern','dark'),path(arch(ww,h,false)),-1.1,y,faceZ+.15,.04,PI);for(let i=0;i<9;i++){const a=PI*i/8;b.beam(west,[-1.1,12.8,faceZ-.1],[-1.1+Math.cos(a)*.88,12.8+Math.sin(a)*.95,faceZ-.1],.035);}}
 }
 for(const level of[{y:.15,h:7.9,spread:[-4.15,-2.85,2.85,4.15]},{y:9.6,h:5.5,spread:[-3.2,-2.0,2.0,3.2]}])for(const xx of level.spread){const x=-1.1+xx;b.box(west,x,level.y+level.h/2,faceZ,.43,level.h,.54);b.box(west,x,level.y+.32,faceZ,.75,.64,.75);b.box(west,x,level.y+level.h-.22,faceZ,.78,.42,.76);}
 for(const[y,w]of[[8.2,10.1],[8.65,10.6],[15.35,8.0]]){b.box(west,-1.1,y,faceZ,w,.30,.80);b.box(west,-1.1,y+.23,faceZ,w+.2,.17,.95);}
 // Broken circular pediment with a clear central interval.
 for(const side of[-1,1]){let prev;for(let i=0;i<=20;i++){const a=(side<0?PI*.54:PI*.05)+i*PI*.41/20,p=[-1.1+4.05*Math.cos(a),15.36+2.1*Math.sin(a),faceZ-.12];if(prev)b.beam(west,prev,p,.18);prev=p;}}
 for(const x of[-9.8,-7.4,-5.0,2.8,5.2,7.6]){b.cylinder(west,x,18.2,faceZ,.14,.21,.9,7);b.cylinder(west,x,18.85,faceZ,.24,.24,.25,10);}
 b.box(west,-1.1,17.6,faceZ,19.3,.28,.65);b.box(west,-1.1,18.7,faceZ,19.3,.17,.46);b.box(west,-1.1,21.3,faceZ,2.7,3.5,.18);b.box(K('portada-principal','modern','stone'),-1.1,21.3,faceZ-.11,2.2,3.0,.07);
 b.box(K('portada-principal','mixed','wood'),-1.1,2.72,-27.66,3.71,5.12,.16);for(const yy of[.8,2.0,3.4,4.5])for(const xx of[-2.05,-.15])b.box(K('portada-principal','mixed','metal'),xx,yy,-27.81,1.60,.06,.05);
 const oval=new THREE.TorusGeometry(.6,.07,7,30);oval.scale(1.5,1,1);oval.translate(-1.1,6.4,faceZ-.3);b.geom(west,oval);oval.dispose();
 recordOpening('portada-principal',-1.1,2.4,-29.0,PI,3.6,4.8,2.5,'door');plan('portada-principal',[[-6,-28.3],[4,-28.3],[4,-27.4],[-6,-27.4]],'portal','modern');
 // West stairs meet the lower street rather than burying the actual portal.
 const westFoot=toWorld(-1.1,-32.0),westLow=heightAt(westFoot.x,westFoot.z)-base,westRise=Math.max(.3,-westLow+.12),westN=Math.max(3,Math.ceil(westRise/.18));
 for(let i=0;i<westN;i++){const y=westLow+(i+1)*westRise/westN,z=-32.2+(i+.5)*4.35/westN;b.box(K('umbrales','interpretation','stone'),-1.1,y-.10,z,6.2,.2,4.35/westN+.02);}

 // The tower rises from the lower plaza, independently of the church floor.
 const tw=project(...record.towerCoordinate),tp=toLocal(tw.x,tw.z),tx=tp.x,tz=tp.z,towerStreet=heightAt(tw.x,tw.z),towerBottom=towerStreet-base,towerTop=towerBottom+58;
 const towerPoly=record.towerFootprint.slice(0,-1).map(p=>{const q=project(...p);return toLocal(q.x,q.z);}),tminX=Math.min(...towerPoly.map(p=>p.x)),tmaxX=Math.max(...towerPoly.map(p=>p.x)),tminZ=Math.min(...towerPoly.map(p=>p.z)),tmaxZ=Math.max(...towerPoly.map(p=>p.z)),twid=tmaxX-tminX,tdepth=tmaxZ-tminZ;
 // Hollow masonry base, with the medieval chapel window still within it.
 wall(b,K('campanario-base','modern','stone'),{x:tmaxX,z:tz,w:tdepth,h:17.25-towerBottom,y:towerBottom,yaw:PI/2,holes:[{u:0,w:.88,h:7.2,y:5.0-towerBottom}]});
 for(const[x,z,w,yaw]of[[tminX,tz,tdepth,-PI/2],[tx,tminZ,twid,PI],[tx,tmaxZ,twid,0]])wall(b,K('campanario-base','modern','stone'),{x,z,w,h:17.25-towerBottom,y:towerBottom,yaw});
 traceriedWindow(b,K('campanario-base','mixed','trim'),{x:tmaxX+.47,y:5,z:tz,w:.88,h:7.2,yaw:PI/2});recordOpening('ventana-base-torre',tmaxX+1.15,8,tz,PI/2,.6,4,2.6);
 const shaftTop=31.15,belfryTop=40.7,shaftBase=17.25;
 // Shift the documented 58 m silhouette down by the street/floor difference.
 const ty=y=>y+towerBottom;
 // Upper stages reference the tower's own ground; first stage begins at the
 // church roofline through a slightly taller conserved ashlar lower body.
 const brickStart=ty(20.2),clockY=ty(29),belfryBase=ty(32.1),roofY=ty(41.3);
 for(const[y0,y1]of[[brickStart,belfryBase]]){
  wall(b,K('campanario','contemporary','brick'),{x:tx,z:tz+tdepth/2,w:twid,h:y1-y0,y:y0,d:.65});
  wall(b,K('campanario','contemporary','brick'),{x:tx,z:tz-tdepth/2,w:twid,h:y1-y0,y:y0,d:.65,yaw:PI});
  for(const side of[-1,1])wall(b,K('campanario','contemporary','brick'),{x:tx+side*twid/2,z:tz,w:tdepth,h:y1-y0,y:y0,d:.65,yaw:side*PI/2});
 }
 for(const x of[tx-twid/2,tx+twid/2])for(const z of[tz-tdepth/2,tz+tdepth/2]){b.box(K('campanario','contemporary','trim'),x,(brickStart+roofY)/2,z,.58,roofY-brickStart,.58);for(let y=brickStart+.3;y<belfryBase-5;y+=.55){b.box(K('campanario','contemporary','trim'),x,y,z,.92,.24,.82,0,.92);}}
 for(const y of[brickStart,ty(25.8),belfryBase,roofY])cornice(b,K('campanario','contemporary','trim'),tx,tz,twid+.12,tdepth+.12,y);
 clock(b,K,tx,clockY,tz+tdepth/2+.36,0,1.02);clock(b,K,tx+twid/2+.36,clockY,tz,PI/2,1.02);
 for(let side=0;side<4;side++){
  const a=side*PI/2,x=tx+Math.sin(a)*twid/2,z=tz+Math.cos(a)*tdepth/2,w=side%2?tdepth:twid,openW=2.6;
  wall(b,K('campanario','contemporary','brick'),{x,z,w,h:roofY-belfryBase-.1,y:belfryBase,d:.58,yaw:a,holes:[{w:openW,h:7.15,y:.65}]});ring(b,K('campanario','contemporary','trim'),{x:x+Math.sin(a)*.32,y:belfryBase+.65,z:z+Math.cos(a)*.32,w:openW,h:7.15,t:.23,d:.20,yaw:a});
  const bx=tx+Math.sin(a)*1.65,bz=tz+Math.cos(a)*2.15;bell(b,K('campanas','contemporary','bronze'),bx,belfryBase+3.35,bz,1.25);b.box(K('campanas','contemporary','wood'),bx,belfryBase+4.35,bz,1.30,.28,.40,a);
  recordOpening('vano-campanario-'+side,x+Math.sin(a)*1.2,belfryBase+6.0,z+Math.cos(a)*1.2,a,2.2,2.4,2.0,'belfry');
 }
 b.box(K('campanario','contemporary','stone'),tx,roofY+.42,tz,twid+.48,.25,tdepth+.48);
 for(const x of[tx-twid/2,tx+twid/2])for(const z of[tz-tdepth/2,tz+tdepth/2]){b.box(K('campanario','contemporary','trim'),x,roofY+1.05,z,.53,1.5,.53);b.cylinder(K('campanario','contemporary','trim'),x,roofY+2.2,z,0,.32,.95,4);}
 const iron=K('corona-hierro','contemporary','metal'),crown0=roofY+.65,crown1=ty(50.0),crown2=ty(54.8);
 for(let i=0;i<8;i++){
  const a=i*TAU/8;let prev;for(let j=0;j<=22;j++){const t=j/22,r=.95+2.1*(1-t)**2.6,p=[tx+Math.cos(a)*r,crown0+(crown1-crown0)*t,tz+Math.sin(a)*r];if(prev)b.beam(iron,prev,p,.063,.84);if(j>0&&j%2===0){const aa=a+TAU/8;b.beam(iron,p,[tx+Math.cos(aa)*(r+.10),p[1]-.45,tz+Math.sin(aa)*(r+.10)],.027);}prev=p;}
  b.beam(iron,[tx+Math.cos(a)*.95,crown1,tz+Math.sin(a)*.95],[tx+Math.cos(a)*.72,crown2,tz+Math.sin(a)*.72],.055);b.beam(iron,[tx+Math.cos(a)*.72,crown2,tz+Math.sin(a)*.72],[tx,ty(56.5),tz],.047);
 }
 for(const[y,r]of[[crown0,3],[ty(46.8),1.28],[crown1,.97],[ty(53.7),.78]])for(let i=0;i<8;i++){const a=i*TAU/8,aa=(i+1)*TAU/8;b.beam(iron,[tx+Math.cos(a)*r,y,tz+Math.sin(a)*r],[tx+Math.cos(aa)*r,y,tz+Math.sin(aa)*r],.05);}
 bell(b,K('campanas','contemporary','bronze'),tx,ty(51.6),tz,.52);b.beam(iron,[tx,ty(56.35),tz],[tx,towerTop,tz],.035);b.beam(iron,[tx-.62,ty(57.35),tz],[tx+.70,ty(57.35),tz],.025);b.beam(iron,[tx,ty(56.95),tz-.25],[tx,ty(56.95),tz+.25],.025);
 qa.tower={base:towerStreet,top:base+towerTop,overallHeight:58,masonryTop:41.3,groundSource:'IGN MDT at mapped tower coordinate',thinCrownNote:'The documented total includes the thin iron crown; LiDAR surfaces near 40 m do not measure its summit.'};
 plan('campanario',towerPoly.map(p=>[p.x,p.z]),'tower','contemporary');

 const resources=b.finish(group);group.updateMatrixWorld(true);const meshes=group.children.filter(o=>o.isMesh),bounds=new THREE.Box3().setFromObject(group,true),focuses={},sourceStops=new Map((visitData?.stops||[]).map(s=>[s.id,s]));
 const rotate=v=>[v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c];
 for(const[id,label,regionId,x,z,yy,r,localOffset]of STOPS){
  let y=yy;if(id==='santa-maria-campanario')y=towerBottom+29;if(id==='santa-maria-reloj')y=clockY;
  const target=localWorld(x,y,z),box=id==='santa-maria-conjunto'?bounds.clone():new THREE.Box3(new THREE.Vector3(x-r,Math.max(-5.5,y-r*.6),z-r*.62),new THREE.Vector3(x+r,y+r*.7,z+r*.62)).applyMatrix4(group.matrixWorld);
  if(['santa-maria-campanario','santa-maria-portada-principal','santa-maria-abside'].includes(id)){
   box.makeEmpty();const selectedComponents=id==='santa-maria-portada-principal'?['portada-principal']:COMPONENTS[id];
   for(const mesh of meshes)if(selectedComponents.includes(mesh.userData.component))box.union(mesh.geometry.boundingBox.clone().applyMatrix4(group.matrixWorld));
  }
  const offset=rotate(localOffset),closeOffset=rotate(localOffset.map((v,i)=>v*(i===1?.88:.82)));for(const off of[offset,closeOffset])off[1]=Math.max(off[1],heightAt(target.x+off[0],target.z+off[2])+3.5-target.y);
  if(id==='santa-maria-conjunto')box.getCenter(target);
  focuses[id]={id,label:sourceStops.get(id)?.title||label,regionId,coordinates:geographical(x,z),target,offset,closeOffset,bounds:box,components:COMPONENTS[id],kind:id==='santa-maria-conjunto'?'overview':'feature',requiresSection:['santa-maria-naves','santa-maria-bovedas','santa-maria-capillas'].includes(id),sourceConfidence:'Architectural sector documented; metric placement approximate',modelLocal:{x,z}};
 }
 let selected=null,readingMode='materials',sectionOpen=false,ground=heightAt;
 const markerGeo=new THREE.BufferGeometry(),markerMat=new THREE.LineBasicMaterial({color:'#85d5c8',transparent:true,opacity:.9}),marker=new THREE.Line(markerGeo,markerMat);marker.name='Parada seleccionada de Santa María';marker.visible=false;marker.userData.selectionHelper=true;group.add(marker);resources.materials.push(markerMat);resources.geometries.push(markerGeo);
 const sectionRemoved=new Set(['cubiertas','bovedas','bovedas-laterales','bovedas-capillas','boveda-abside','muro-norte','muro-occidental','portada-norte','portada-principal','cupula']);
 function applyMaterials(){
  const focus=selected?focuses[selected]:null;
  for(const mesh of meshes){const d=mesh.userData,m=mesh.material,nextMap=readingMode==='periods'?null:d.baseMap;if(m.map!==nextMap){m.map=nextMap;m.needsUpdate=true;}m.color.copy(d.baseColor);if(readingMode==='periods')m.color.set(PERIOD_COLORS[d.period]);const match=focus&&(focus.kind==='overview'||focus.components.includes(d.component));m.emissive.set(match?'#397b6f':'#000000');m.emissiveIntensity=match?.18:0;}
 }
 function selectFocus(id){selected=id&&focuses[id]?id:null;applyMaterials();marker.visible=!!selected&&selected!=='santa-maria-conjunto';if(marker.visible){const p=group.worldToLocal(focuses[selected].target.clone()),pos=[];for(let i=0;i<=64;i++){const a=i*TAU/64;pos.push(p.x+Math.cos(a)*1.9,p.y+.16,p.z+Math.sin(a)*1.9);}markerGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));markerGeo.computeBoundingSphere();}return selected?focuses[selected]:null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';applyMaterials();return readingMode;}
 function setSection(open){sectionOpen=!!open;for(const mesh of meshes)mesh.visible=!(sectionOpen&&sectionRemoved.has(mesh.userData.component));return sectionOpen;}
 function bindGround(finalHeightAt){ground=finalHeightAt||heightAt;for(const focus of Object.values(focuses))for(const off of[focus.offset,focus.closeOffset])off[1]=Math.max(off[1],ground(focus.target.x+off[0],focus.target.z+off[2])+3.5-focus.target.y);return group;}
 const stats={stops:Object.keys(focuses).length,components:new Set(meshes.map(m=>m.userData.component)).size,meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),trueApertures:qa.openings.length,naves:3,mainVaultBays:4,gothicMainVaultBays:2,apseWindows:3,apseButtresses:4,towerHeightM:58,cartographicOutline:true,sourceKeys:['sm-cabrera-1987','sm-zaragoza-2000','sm-perales-2023','sm-turismo','sm-campaners','sm-osm'],periods:santaMariaPeriods.map(p=>p.id)};
 const planData={outline:record.footprint,components:planComponents,center:record.coordinate,yaw:YAW,registration:'OSM perimeter with schematic published-plan alignment; not a measured new survey',floorHeight:base};
 const visit={focuses,bounds,stats,periods:santaMariaPeriods,plan:planData,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({selected,readingMode,sectionOpen}),qa,metadata:{state:'Conserved church with medieval, early-modern and contemporary fabric',section:'Didactic removal of roofs, vault webs and north/west enclosure; octagonal supports, arcade and vault ribs remain. Not a reconstruction of the blocked crypt.',decoration:'Lost portal sculpture and the lost historical altarpiece are not reinstated. Small altar and surface finishes are abstract aids, not an inventory of current furnishings.',metricStatus:'Main vault 24 m and tower 58 m documented; most remaining elevations and mouldings are visual estimates registered to cartography.'}};
 group.userData={id:'santa-maria',label:'Iglesia de Santa María',interpretation:true,cartographicOutline:true,ownedResources:resources,layout:frame,groundY:base,visit,towerHeightM:58,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
 const patch={polygon:worldOutline,height:base-.13,margin:1.25},thresholdPatches=[{polygon:[[-4.3,-32.5],[2.1,-32.5],[2.1,-27.4],[-4.3,-27.4]].map(p=>toWorld(...p)),height:base+westLow-.14,margin:.15}];
 return{group,point:localWorld(-1.2,18,-3),patch,patches:[patch,...thresholdPatches],exclusion:worldOutline,ctx:frame,frame,views:{offset:rotate([80,62,75]),closeOffset:rotate([49,39,49])},stats,thresholdPatches};
}

export const santaMariaRegistration={yaw:YAW,coordinate:[-.27910948,39.67903398]};
