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
 'santa-maria-naves':['pilares','arcadas','pavimento','bancos'],
 'santa-maria-bovedas':['nervios','bovedas','boveda-abside','revestimiento-bovedas'],
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
 plaster:{color:'#dfdcd0',roughness:.97},paving:{color:'#bcb8ab',roughness:.98,map:'floor'},
 wood:{color:'#73523e',roughness:.9},metal:{color:'#4c4a42',roughness:.63,metalness:.5},
 bronze:{color:'#928268',roughness:.72,metalness:.55},brass:{color:'#b1a16b',roughness:.70,metalness:.46},gold:{color:'#b59b62',roughness:.76,metalness:.20},blue:{color:'#527785',roughness:.5},
 glass:{color:'#c4ae79',roughness:.4,transparent:true,opacity:.47},dark:{color:'#5a5851',roughness:.97}
};
function texture(type){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 if(type==='floor'){
  ctx.fillStyle='#c4c2b9';ctx.fillRect(0,0,256,256);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){const value=192+Math.floor(noise(row*7+col)*9);ctx.fillStyle=`rgb(${value},${value},${value-5})`;ctx.fillRect(col*64+1,row*64+1,62,62);}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
 }
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
  const textures={stone:texture('stone'),brick:texture('brick'),tiles:texture('tiles'),floor:texture('floor')},materials=[],geometries=[];
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
function shapeMesh(b,k,s,x,y,z,depth=.7,yaw=0,tint=1,openFloorY=null){
 let g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:18,steps:1});g.translate(0,0,-depth/2);
 // Door reveals meet an independently owned floor/threshold. Their extruded
 // bottom caps otherwise coincide with that walkable surface and self-occlude.
 if(openFloorY!==null){
  const keep=[],p=g.attributes.position;for(let i=0;i<p.count;i+=3)if(![0,1,2].every(j=>Math.abs(p.getY(i+j)-openFloorY)<1e-5))keep.push(i,i+1,i+2);
  const trimmed=new THREE.BufferGeometry();for(const[name,a]of Object.entries(g.attributes)){const out=[];for(const i of keep)for(let j=0;j<a.itemSize;j++)out.push(a.array[i*a.itemSize+j]);trimmed.setAttribute(name,new THREE.Float32BufferAttribute(out,a.itemSize));}g.dispose();g=trimmed;
 }
 const m=new THREE.Matrix4().makeRotationY(yaw);m.setPosition(x,y,z);b.geom(k,g,m,tint);g.dispose();
}
function arch(w,h,pointed=true){
 const r=w/2,spring=pointed?h-w*.78:h-r,p=[[-r,0],[-r,spring]];
 if(pointed){for(let i=1;i<=18;i++){const a=PI-i*PI/54;p.push([r+2*r*Math.cos(a),spring+(h-spring)*Math.sin(a)/(Math.sqrt(3)/2)]);}for(let i=1;i<=18;i++){const a=PI/3-i*PI/54;p.push([-r+2*r*Math.cos(a),spring+(h-spring)*Math.sin(a)/(Math.sqrt(3)/2)]);}}
 else for(let i=1;i<=36;i++){const a=PI-i*PI/36;p.push([r*Math.cos(a),spring+r*Math.sin(a)]);}
 p.push([r,0]);return p;
}
const rect=(w,h)=>[[-w/2,0],[w/2,0],[w/2,h],[-w/2,h]];
function wall(b,k,{x,y=0,z,w,h,d=.85,yaw=0,holes=[]}){
 const s=path(rect(w,h));for(const a of holes){const points=(a.rect?rect(a.w,a.h):arch(a.w,a.h,a.pointed!==false)).map(([u,v])=>[u+(a.u||0),v+(a.y||0)]);s.holes.push(path(points.reverse(),THREE.Path));}shapeMesh(b,k,s,x,y,z,d,yaw,1,holes.find(a=>a.walkThrough)?.y??null);
}
function ring(b,k,{x,y,z,w,h,t=.22,d=.18,yaw=0,pointed=true,openBase=false}){
 const outer=arch(w+t*2,h+t,pointed).map(([u,v])=>[u,v-t*.3]),inner=arch(w,h,pointed).reverse();
 // A doorway archivolt is a U-shaped surround, not a closed frame across the
 // walking surface. The old bottom strip coincided with the stair landing and
 // produced a black self-occluding line even though downward rays hit stone.
 const s=openBase?path([...outer,...inner]):path(outer);if(!openBase)s.holes.push(path(inner,THREE.Path));shapeMesh(b,k,s,x,y,z,d,yaw);
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
function doorLeaves(b,K,{id,x,z,y=.12,yaw,w,h,finish='wood'}){
 const leaf=K(id,'mixed',finish),detail=K(id,'mixed',finish==='wood'?'metal':'brass');
 b.box(leaf,x,y+h/2,z,w,h,.14,yaw);
 // The photographs show two metal-clad leaves, divided into four panels.
 // Relief, studs and borders convey their scale; no figurative image is invented.
 for(const side of[-1,1]){
  const u=side*w*.25,pw=w*.46;
  for(const f of[.25,.75]){
   const cy=y+h*f,ph=h*.46;
   for(const edge of[-1,1]){const[qx,qz]=onFace(x,z,yaw,u+edge*pw/2,.091);b.box(detail,qx,cy,qz,.045,ph,.035,yaw,.86);}
   for(const edge of[-1,1]){const[qx,qz]=onFace(x,z,yaw,u,.091);b.box(detail,qx,cy+edge*ph/2,qz,pw,.045,.035,yaw,.86);}
   for(let j=1;j<6;j++){const[qx,qz]=onFace(x,z,yaw,u-pw/2+j*pw/6,.115);b.box(detail,qx,cy+ph*.42,qz,.035,.035,.025,yaw,.72);b.box(detail,qx,cy-ph*.42,qz,.035,.035,.025,yaw,.72);}
  }
 }
 const[xx,zz]=onFace(x,z,yaw,0,.086);b.box(detail,xx,y+h/2,zz,.038,h,.025,yaw,.65);
}
function portal(b,K,{id,x,z,y=.12,yaw,w=3.5,h=4.8,archH=7.4,rings=4,period='medieval',finish='wood'}){
 const k=K(id,period,'trim'),outerW=w+1.0;
 // The opening reaches the ground: use one open-bottom contour. A rectangular
 // hole touching the outer contour made ExtrudeGeometry retain a downward
 // face across the threshold, causing a black band against the paving.
 const tympanum=path([...arch(outerW,archH),[w/2,0],[w/2,h],[-w/2,h],[-w/2,0]]);shapeMesh(b,K(id,period,'stone'),tympanum,x,y,z,.48,yaw);
 for(let n=0;n<rings;n++){const[xx,zz]=onFace(x,z,yaw,0,.16+n*.13);ring(b,k,{x:xx,y,z:zz,w:outerW+n*.43,h:archH+n*.29,t:.105,d:.16,yaw,openBase:true});}
 for(const side of[-1,1])for(let n=0;n<rings;n++){
  const[xx,zz]=onFace(x,z,yaw,side*(outerW/2+.19+n*.21),.13+n*.12);b.cylinder(k,xx,y+1.9,zz,.12,.12,3.8,8);b.box(k,xx,y+.15,zz,.30,.30,.30);b.box(k,xx,y+3.8,zz,.33,.23,.33);
 }
 for(const side of[-1,1]){const[xx,zz]=onFace(x,z,yaw,side*(outerW/2+.94),.32);b.box(k,xx,y+3.75,zz,.42,.48,.5);}
 const[dX,dZ]=onFace(x,z,yaw,0,-.30);doorLeaves(b,K,{id,x:dX,z:dZ,y,yaw,w:w-.08,h,finish});
}
function roof(b,k,{x0,x1,z0,z1,y0,y1}){
 const p=[];quad(p,[x0,y0,z0],[x1,y1,z0],[x1,y1,z1],[x0,y0,z1]);b.raw(k,p);
 // Tile rows belong to the material. The former cylinders every .55 m were
 // almost tangent to the roof and shimmered when the camera moved away.
}
function vault(b,K,{id='bovedas',x0,x1,z0,z1,spring,top,crossTop=null,period='mixed',web=true,decorated=false,omitStartRib=false}){
 const cx=(x0+x1)/2,cz=(z0+z1)/2,a=(x1-x0)/2,d=(z1-z0)/2,k=K(id,period,'plaster'),rib=K('nervios',period,'trim');
 // Four intersecting webs; exact stereotomy and deformation are not surveyed.
 const crownAt=x=>crossTop?crossTop[0]+(crossTop[1]-crossTop[0])*(x-x0)/(x1-x0):top;
 const yAt=(x,z)=>spring+(crownAt(x)-spring)*Math.sqrt(Math.max(0,1-Math.min(((x-cx)/a)**2,((z-cz)/d)**2))),centerHeight=yAt(cx,cz);
 if(web){const p=[],N=14;for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=x0+(x1-x0)*i/N,xx=x0+(x1-x0)*(i+1)/N,z=z0+(z1-z0)*j/N,zz=z0+(z1-z0)*(j+1)/N;quad(p,[x,yAt(x,z),z],[xx,yAt(xx,z),z],[xx,yAt(xx,zz),zz],[x,yAt(x,zz),zz]);}b.raw(k,p,.98);}
 const ribPairs=[[[x0,z0],[x1,z1]],[[x1,z0],[x0,z1]],...(!omitStartRib?[[[x0,z0],[x1,z0]]]:[]),[[x0,z1],[x1,z1]],[[x0,z0],[x0,z1]],[[x1,z0],[x1,z1]]];
 for(const pair of ribPairs){
  let prev;for(let i=0;i<=24;i++){const t=i/24,x=pair[0][0]+(pair[1][0]-pair[0][0])*t,z=pair[0][1]+(pair[1][1]-pair[0][1])*t,y=yAt(x,z),p=[x,y-.14,z];if(prev)b.beam(rib,prev,p,.13,1,6);prev=p;}
 }
 b.cylinder(rib,cx,centerHeight-.18,cz,.29,.25,.26,12);
 if(decorated){
  // Shallow Baroque stucco bands visible in the dated interior photographs.
  // They are a finish over simple rib vaulting, not a claim of extra stone ribs.
  const moulding=K('revestimiento-bovedas','modern','plaster'),gilt=K('revestimiento-bovedas','modern','gold');
  const ribbon=(points,width,drop,key)=>{const p=[];for(let q=0;q<points.length-1;q++){const A=points[q],B=points[q+1],dx=B[0]-A[0],dz=B[1]-A[1],len=Math.hypot(dx,dz),nx=-dz/len*width/2,nz=dx/len*width/2;for(let j=0;j<18;j++){const P=t=>[A[0]+dx*t,A[1]+dz*t],a=P(j/18),d=P((j+1)/18),V=(v,sg)=>[v[0]+sg*nx,yAt(v[0]+sg*nx,v[1]+sg*nz)-drop,v[1]+sg*nz];quad(p,V(a,-1),V(d,-1),V(d,1),V(a,1));}}b.raw(key,p);};
  for(const side of[-1,1])for(const end of[-1,1]){
   const points=[[cx+side*a*.94,cz+end*d*.94],[cx+side*a*.36,cz+end*d*.18],[cx,cz]];
   ribbon(points,.32,.075,moulding);ribbon(points,.040,.105,gilt);
  }
  b.cylinder(gilt,cx,centerHeight-.27,cz,.52,.59,.12,24);
  const tor=new THREE.TorusGeometry(.65,.045,6,36);tor.rotateX(PI/2);tor.translate(cx,centerHeight-.32,cz);b.geom(gilt,tor);tor.dispose();
 }
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
 const frame={center,coordinate:record.coordinate,base,yaw:YAW,toWorld,toLocal,localWorld,geographical,footprintLocal,worldOutline,outline:record.footprint,westThreshold:{x:-1.1,z:-28.1,y:base+.12,width:3.85},southThreshold:{x:-22.0,z:.35,y:base+.12,width:3.35}};
 const group=new THREE.Group();group.name='Santa María · iglesia conservada';group.position.set(center.x,base,center.z);group.rotation.y=YAW;
 const b=new Batch(),K=(...a)=>b.key(...a),planComponents=[];
 const plan=(id,points,kind,period,closed=true)=>planComponents.push({id,coordinates:points.map(([x,z])=>geographical(x,z)),kind,period,closed,interpretive:period==='interpretation'});
 const qa={openings:[],floorSamples:[],registeredCenter:record.coordinate,yaw:YAW,documented:{naves:3,tramos:4,gothicMainVaultBays:2,apseWindows:3,apseButtresses:4,mainVaultHeightM:24,towerOverallHeightM:58},floorRegistration:{base,method:'Approximate church floor accommodates the high southern threshold in IGN MDT; no measured pavement level is claimed.'},crypt:{modelled:false,reason:'The cited description records a blocked crypt; no reliable interior geometry is available.'},doorLeaves:'Timber or metal-clad leaves occupy the actual pierced reveals; QA distinguishes leaves and glazing from structural blockage.',windowTracery:'Simplified five- and eight-point patterns, not a sculptural facsimile.'};
 const recordOpening=(id,x,y,z,yaw,width,height,distance=2,kind='window')=>{const o=localWorld(x,y,z),direction=[-Math.sin(yaw),0,-Math.cos(yaw)];qa.openings.push({id,kind,width,height,distance,localOrigin:[x,y,z],localDirection:direction,origin:o.toArray(),direction:[direction[0]*c+direction[2]*s,0,-direction[0]*s+direction[2]*c]});};

 // A thin occupied floor and subgrade foundation replace the old solid block.
 flatSolid(b,K('cimiento','interpretation','stone'),footprintLocal.map(p=>[p.x,p.z]),-5.6,5.52,.87);
 flatSolid(b,K('pavimento','mixed','paving'),footprintLocal.map(p=>[p.x,p.z]),-.08,.20);
 // Paving joints are in the material; raised strips 8 mm above this surface
 // caused unnecessary depth competition in regional and interior views.
 for(const[x,z]of[[-1,-22],[-1,-9],[-1,4],[-1,13],[10,-9],[-12,-9],[16,-6]])qa.floorSamples.push(localWorld(x,.12,z).toArray());
 plan('nave-central',[[-8.2,-27.4],[5.8,-27.4],[5.8,14.85],[-8.2,14.85]],'nave','mixed');
 plan('nave-norte',[[5.8,-27.4],[14.1,-27.4],[14.1,14.85],[5.8,14.85]],'nave','mixed');
 plan('nave-sur',[[-16.2,-27.4],[-8.2,-27.4],[-8.2,14.85],[-16.2,14.85]],'nave','mixed');

 // Outer chapel walls: four narrow medieval windows and a later western bay.
 const northHoles=[{u:-.35,w:4.5,h:7.45,y:.12,walkThrough:true},...[11.2,5.55,-5.75,-11.85].map(z=>({u:-z,w:.92,h:7.1,y:4.45})),{u:20.8,w:1.2,h:2.2,y:5.0,rect:true}];
 wall(b,K('muro-norte','mixed','stone'),{x:19.42,z:-6.35,w:42.2,h:13.45,yaw:PI/2,holes:northHoles.map(o=>({...o,u:o.u-6.35}))});
 const southHoles=[{u:.35+6.35,w:4.4,h:7.2,y:.12,walkThrough:true},{u:5.7+6.35,w:1.25,h:6.6,y:4.4},{u:-10.5+6.35,w:1.25,h:2.4,y:5.4,rect:true},{u:-20.7+6.35,w:1.0,h:2.5,y:5.3,rect:true}];
 wall(b,K('muro-sur','mixed','stone'),{x:-21.55,z:-6.35,w:42.2,h:13.45,yaw:-PI/2,holes:southHoles});
 portal(b,K,{id:'portada-norte',x:19.86,z:.35,yaw:PI/2,w:3.45,h:4.7,archH:7.45,rings:4});
 portal(b,K,{id:'portada-sur',x:-21.99,z:.35,yaw:-PI/2,w:3.35,h:4.65,archH:7.2,rings:3,finish:'brass'});
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
  // The apse owns the two lateral walls of the short eastern bay. Emitting
  // both here and below produced coincident faces over an entire arcade.
  if(i!==3)wall(b,K('arcadas',period,'stone'),{x,z,w,h:24.9,d:.72,yaw:PI/2,holes});
  const outside=x>0?PI/2:-PI/2;recordOpening('arcada-'+x+'-'+i,x+Math.sin(outside)*1.1,6,z,outside,Math.min(3,w-2),8,2.2,'arcade');
  ring(b,K('arcadas',period,'trim'),{x:x+.02,y:.12,z,w:w-1.55,h:openH,t:.25,d:.88,yaw:PI/2,pointed,openBase:true});
  if(i===1||i===2){for(const sign of[-1,1]){const xx=x+sign*.42;ring(b,K('claristorio','mixed','trim'),{x:xx,y:19.75,z,w:2.7,h:4.4,t:.16,d:.13,yaw:sign*PI/2});b.box(K('claristorio','mixed','trim'),xx,22.25,z,.15,2.18,.095);}}
 }
 for(const x of[-16.2,14.1])for(let i=0;i<chapelEnds.length-1;i++){
  const z0=chapelEnds[i],z1=chapelEnds[i+1],w=z1-z0,z=(z0+z1)/2,medieval=i>=2;
  wall(b,K('capillas',medieval?'medieval':'modern','stone'),{x,z,w,h:16.45,d:.66,yaw:PI/2,holes:[{w:w-1.12,h:10.8,y:.12,pointed:medieval}]});
  ring(b,K('capillas',medieval?'medieval':'modern','trim'),{x,y:.12,z,w:w-1.12,h:10.8,t:.20,d:.80,yaw:PI/2,pointed:medieval,openBase:true});
  for(const zz of[z0,z1])b.box(K('pilares-capillas',medieval?'medieval':'modern','stone'),x,6.8,zz,1.15,13.6,.9);
  const outer=x>0?19.42:-21.55;for(const zz of[z0,z1])b.box(K('capillas',medieval?'medieval':'modern','stone'),(x+outer)/2,5.6,zz,Math.abs(outer-x),11.2,.7);
  vault(b,K,{id:'bovedas-capillas',x0:Math.min(x,outer)+.4,x1:Math.max(x,outer)-.4,z0:z0+.4,z1:z1-.4,spring:7.7,top:11.65,period:medieval?'medieval':'modern'});
  plan('capilla-'+(x>0?'n':'s')+'-'+i,[[x,z0],[outer,z0],[outer,z1],[x,z1]],'chapel',medieval?'medieval':'modern');
 }
 for(let i=0;i<3;i++){
  vault(b,K,{x0:-8.2,x1:5.8,z0:bayEnds[i],z1:bayEnds[i+1],spring:16.25,top:24,period:i===0?'modern':'mixed',decorated:true,omitStartRib:i>0});
  // The lateral envelope must meet both arcade walls and remain below the
  // pitched roof. Its secondary transverse rise is an interpretive fit; the
  // same function positions webs, ribs and keys, so no detail floats above it.
  for(const[x0,x1]of[[-16.15,-8.25],[5.85,14.05]])vault(b,K,{id:'bovedas-laterales',x0,x1,z0:bayEnds[i],z1:bayEnds[i+1],spring:11.85,top:18.75,crossTop:x0<0?[16.2,18.75]:[18.75,16.2],period:i===0?'modern':'mixed',omitStartRib:i>0});
 }
 for(const[x0,x1]of[[-16.15,-8.25],[5.85,14.05]])vault(b,K,{id:'bovedas-laterales',x0,x1,z0:8.8,z1:14.85,spring:11.85,top:18.75,crossTop:x0<0?[16.2,18.75]:[18.75,16.2],period:'medieval',omitStartRib:true});

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
 const apRoof=[],peak=[-1.2,27.7,14.85],ridgeStart=[-1.2,27.7,8.8];for(let i=0;i<apse.length-1;i++){const a=apse[i],d=apse[i+1];if(i===0)quad(apRoof,[a[0],25.2,a[1]],[d[0],25.2,d[1]],peak,ridgeStart);else if(i===4)quad(apRoof,peak,[a[0],25.2,a[1]],[d[0],25.2,d[1]],ridgeStart);else apRoof.push(a[0],25.2,a[1],d[0],25.2,d[1],...peak);if(i>0)b.beam(K('remates-cubierta','mixed','tiles'),[a[0],25.35,a[1]],[-1.2,27.85,14.85],.10);}
 b.raw(K('cubiertas','mixed','tiles'),apRoof);plan('abside',apse,'apse','medieval');
 // Radial ribs of the apse remain readable when its didactic web is removed.
 for(const[x,z]of apse){let prev;for(let i=0;i<=24;i++){const t=i/24,p=[x+(-1.2-x)*t,16.25+7.75*Math.sin(t*PI/2),z+(12.0-z)*t];if(prev)b.beam(K('nervios','medieval','trim'),prev,p,.14);prev=p;}}
 // The web rises in lunettes above each high window. A flat spring line
 // around every facet would cut off the glass and leave the west wedge open.
 const apWeb=[],edgeAt=(i,u)=>16.25+((i===apse.length-1?24:22.7)-16.25)*Math.sqrt(Math.max(0,1-(2*u-1)**2));
 for(let i=0;i<apse.length;i++){
  const A=apse[i],B=apse[(i+1)%apse.length],P=(u,t)=>{const x=A[0]+(B[0]-A[0])*u,z=A[1]+(B[1]-A[1])*u,y=edgeAt(i,u);return[x+(-1.2-x)*t,y+(24-y)*Math.sin(t*PI/2),z+(12-z)*t];};
  for(let j=0;j<18;j++)for(let k=0;k<14;k++)quad(apWeb,P(j/18,k/14),P((j+1)/18,k/14),P((j+1)/18,(k+1)/14),P(j/18,(k+1)/14));
  if(i<apse.length-1){let prev;for(let j=0;j<=32;j++){const p=P(j/32,0);p[1]-=.13;if(prev)b.beam(K('nervios','mixed','trim'),prev,p,.12);prev=p;}}
 }
 b.raw(K('boveda-abside','mixed','plaster'),apWeb);
 for(const[x,z]of apse.slice(1,-1)){const dx=-1.2-x,dz=12-z,len=Math.hypot(dx,dz),px=x+dx/len*.50,pz=z+dz/len*.50;b.cylinder(K('pilares-abside','medieval','stone'),px,8.12,pz,.34,.38,16.24,8);b.cylinder(K('pilares-abside','mixed','trim'),px,16.13,pz,.45,.37,.32,8);}
 qa.vaultEnvelope={mainHeight:24,mainBays:3,shortHead:true,continuousBays:true,apseFacetsClosed:6,windowLunettes:true,decoratedWebs:true,lateralRise:{arcadeSide:18.75,chapelSide:16.2,metricStatus:'Interpretive transverse fit below the existing roof, not a surveyed vault profile.'},sourceKeys:['sm-cabrera-1987','sm-zaragoza-2000','sm-interior-photo-vaults']};
 b.box(K('presbiterio','interpretation','paving'),-1.2,.24,13.3,11.4,.24,5.6);b.box(K('presbiterio','interpretation','stone'),-1.2,1.04,14.0,2.2,.24,1.15);b.box(K('presbiterio','interpretation','stone'),-1.2,.64,14.0,.70,.75,.65);
 // Reversible furnishing only establishes human scale and a central aisle.
 // Its count/layout is schematic; it is not an inventory of movable heritage.
 let pewCount=0;for(let z=-21.5;z<7.0;z+=1.8){if(Math.abs(z-.35)<2.0)continue;for(const x of[-4.75,2.35]){const wood=K('bancos','interpretation','wood');b.box(wood,x,.60,z,4.45,.11,.52);b.box(wood,x,.91,z-.26,4.45,.57,.105);for(const dx of[-1.65,1.65])b.box(wood,x+dx,.35,z,.11,.48,.46);pewCount++;}}
 qa.furnishings={pewCount,interpretive:true,centralAisleWidthM:2.65,crossAisleAtLocalZ:.35,sourceKeys:['sm-interior-photo-east','sm-interior-photo-west'],note:'Schematic seating for scale; no claim to the current number or movable-heritage inventory.'};

 // Three height levels, tiled roofs and round drainage bridges. These bridges
 // are not presented as correctly calculated Gothic flying buttresses.
 for(const[x0,x1,y0,y1,central]of[[-8.2,-1.2,25.2,27.7,true],[-1.2,5.8,27.7,25.2,true],[-16.5,-8.55,16.9,22.5,false],[6.15,14.4,22.5,16.9,false],[-21.9,-16.5,13.7,16.0,false],[14.4,19.8,16.0,13.7,false]])roof(b,K('cubiertas','mixed','tiles'),{x0,x1,z0:-27.25,z1:central?8.8:14.9,y0,y1});
 b.beam(K('remates-cubierta','mixed','tiles'),[-1.2,27.85,-27.25],[-1.2,27.85,14.85],.10);
 for(const side of[-1,1])for(const z of[-15.65,-3.45,8.8]){
  const inner=side>0?6.1:-8.5,outer=side>0?14.2:-16.4,w=Math.abs(outer-inner),cx=(inner+outer)/2,points=side>0?[[-w/2,16.45],[w/2,16.45],[w/2,18.1],[-w/2,24.15]]:[[-w/2,16.45],[w/2,16.45],[w/2,24.15],[-w/2,18.1]];
  const sh=path([points[1],points[2],points[3],points[0],...arch(w-1.05,(w-1.05)/2,false).map(([u,v])=>[u,v+16.45])]);shapeMesh(b,K('puentes-agua','mixed','stone'),sh,cx,0,z,.72,0);
  b.box(K('contrafuertes','mixed','stone'),outer,9.3,z,1.35,18.6,1.1);b.box(K('contrafuertes','modern','trim'),outer,18.78,z,1.6,.35,1.35);b.cylinder(K('contrafuertes','modern','trim'),outer,19.3,z,.14,.3,.7,6);
  b.beam(K('puentes-agua','mixed','trim'),[inner,24.3,z],[outer,18.4,z],.12);b.box(K('gargolas','mixed','stone'),outer+side*.65,17.95,z,1.1,.25,.32,0,.8);
 }
 // The north-west chapel's documented blue-tiled octagonal dome. Decoration
 // and imagery are omitted; the dome is an approximate external envelope.
 const domeX=10.2,domeZ=-21.2; b.cylinder(K('cupula','modern','stone'),domeX,19.6,domeZ,3.2,3.2,1.25,8);
 const dome=[],r=3.24;for(let i=0;i<32;i++)for(let j=0;j<12;j++){const a=i*TAU/32,aa=(i+1)*TAU/32,t=j*PI/24,tt=(j+1)*PI/24,P=(u,v)=>[domeX+r*Math.cos(v)*Math.cos(u),20.2+3.4*Math.sin(v),domeZ+r*Math.cos(v)*Math.sin(u)];quad(dome,P(a,t),P(aa,t),P(aa,tt),P(a,tt));}b.raw(K('cupula','modern','blue'),dome);
 for(let i=0;i<16;i++){const a=i*TAU/16;let prev;for(let j=0;j<=16;j++){const t=j*PI/32,p=[domeX+r*Math.cos(t)*Math.cos(a),20.25+3.4*Math.sin(t),domeZ+r*Math.cos(t)*Math.sin(a)];if(prev)b.beam(K('cupula','modern','trim'),prev,p,.045,.74);prev=p;}}
 b.cylinder(K('cupula','modern','trim'),domeX,24.1,domeZ,.44,.55,1.0,8);b.cylinder(K('cupula','modern','blue'),domeX,24.85,domeZ,0,.65,.65,8);

 // West front: the photographs show a tall, flat-topped central screen and
 // stepped lateral wings. Its outline does not follow the six roof pitches.
 // The niches and mouldings are visual approximations, registered to the same
 // door/ground anchors; the public terraces and stairs belong to context.
 const westSilhouette=[[-21.55,0],[19.42,0],[19.42,13.85],[14.4,13.85],[14.4,17.35],[6.15,17.35],[6.15,28.1],[-8.55,28.1],[-8.55,20.4],[-16.5,20.4],[-16.5,13.85],[-21.55,13.85]];
 const westProfile=path(westSilhouette.map(([x,y])=>[-(x+1.1),y])),nicheY=8.35,nicheH=3.65,nicheW=2.35;
 westProfile.holes.push(path(rect(3.85,5.25).map(([u,v])=>[u,v+.12]).reverse(),THREE.Path));
 westProfile.holes.push(path(arch(nicheW,nicheH,false).map(([u,v])=>[u,v+nicheY]).reverse(),THREE.Path));
 shapeMesh(b,K('muro-occidental','modern','stone'),westProfile,-1.1,0,-27.68,.85,PI,1,.12);
 const west=K('portada-principal','modern','trim'),faceZ=-28.18;
 // Lower order: paired pilasters, pedestals and an acodado door surround.
 for(const side of[-1,1])for(const spread of[2.85,4.15]){const x=-1.1+side*spread;b.box(west,x,3.90,faceZ,.43,7.50,.54);b.box(west,x,1.0,faceZ,.76,1.76,.75);b.box(west,x,1.92,faceZ,.87,.18,.83);b.box(west,x,7.21,faceZ,.79,.42,.76);}
 for(const side of[-1,1])b.box(west,-1.1+side*2.16,2.86,faceZ-.06,.37,5.50,.46);
 const lintel=[[-3.45,5.72],[-2.08,5.72],[-2.08,6.15],[-.95,6.15],[-.95,5.85],[.95,5.85],[.95,6.15],[2.08,6.15],[2.08,5.72],[3.45,5.72]];
 for(let i=0;i<lintel.length-1;i++){const A=lintel[i],B=lintel[i+1];b.beam(west,[-1.1+A[0],A[1],faceZ-.18],[-1.1+B[0],B[1],faceZ-.18],.14,1,8);}
 for(const[y,w]of[[7.55,10.1],[7.88,10.6],[12.25,7.9]]){b.box(west,-1.1,y,faceZ,w,.27,.80);b.box(west,-1.1,y+.20,faceZ,w+.20,.15,.95);}
 // Empty, physically recessed shell niche. A dark plate over an uncut wall
 // cannot describe its concavity and used to read as a painted black opening.
 ring(b,west,{x:-1.1,y:nicheY,z:faceZ,w:nicheW,h:nicheH,t:.20,d:.38,yaw:PI,pointed:false});
 const niche=[],nicheRadius=nicheW/2,depth=.70,front=-28.11,spring=nicheY+nicheH-nicheRadius;
 for(let i=0;i<32;i++){const t0=-PI/2+i*PI/32,t1=-PI/2+(i+1)*PI/32,P=(t,y)=>[-1.1+nicheRadius*Math.sin(t),y,front+depth*Math.cos(t)];quad(niche,P(t0,nicheY),P(t1,nicheY),P(t1,spring),P(t0,spring));}
 const shell=(t,phi)=>[-1.1+nicheRadius*Math.cos(phi)*Math.sin(t),spring+nicheRadius*Math.sin(phi),front+depth*Math.cos(phi)*Math.cos(t)];
 for(let i=0;i<32;i++)for(let j=0;j<12;j++)quad(niche,shell(-PI/2+i*PI/32,j*PI/24),shell(-PI/2+(i+1)*PI/32,j*PI/24),shell(-PI/2+(i+1)*PI/32,(j+1)*PI/24),shell(-PI/2+i*PI/32,(j+1)*PI/24));
 b.raw(K('portada-principal','modern','stone'),niche,.92);
 b.box(west,-1.1,nicheY+.02,front+.35,nicheW,.16,.74);
 for(let i=1;i<12;i++){const theta=-PI/2+i*PI/12;let prev;for(let j=0;j<=18;j++){const p=shell(theta,j*PI/36);p[2]-=.035;if(prev)b.beam(west,prev,p,.025,.88,6);prev=p;}}
 for(const spread of[-3.2,-2.0,2.0,3.2]){const x=-1.1+spread;b.box(west,x,10.23,faceZ,.40,3.76,.54);b.box(west,x,8.46,faceZ,.68,.34,.70);b.box(west,x,11.99,faceZ,.70,.35,.72);}
 // The shallow paired scrolls and urns indicate the surviving silhouette,
 // without substituting new statues or invented carved iconography.
 for(const side of[-1,1]){const x=-1.1+side*4.08;for(let j=0;j<2;j++){let prev;for(let k=0;k<=22;k++){const angle=k*TAU/22,rr=.28*(1-k/29),p=[x+side*Math.cos(angle)*rr,8.95+j*.9+Math.sin(angle)*rr,faceZ-.24];if(prev)b.beam(west,prev,p,.060,.93,7);prev=p;}}b.cylinder(west,x,10.9,faceZ,.27,.42,.45,10);b.cylinder(west,x,11.30,faceZ,0,.24,.50,8);}
 // Broken segmental pediment with a central finial and small side pinnacles.
 for(const side of[-1,1]){let prev;for(let i=0;i<=20;i++){const a=(side<0?PI*.54:PI*.05)+i*PI*.41/20,p=[-1.1+2.80*Math.cos(a),12.37+1.45*Math.sin(a),faceZ-.12];if(prev)b.beam(west,prev,p,.16);prev=p;}}
 for(const x of[-4.5,2.3]){b.box(west,x,12.81,faceZ,.46,.42,.48);b.cylinder(west,x,13.32,faceZ,0,.27,.64,4);}
 b.cylinder(west,-1.1,14.19,faceZ,.22,.47,.65,10);b.cylinder(west,-1.1,14.68,faceZ,0,.20,.40,8);
 const oval=new THREE.TorusGeometry(.58,.10,8,40);oval.scale(1.34,1,1);oval.translate(-1.1,6.44,faceZ-.30);b.geom(west,oval);oval.dispose();
 const cartouche=new THREE.CircleGeometry(.57,36);cartouche.scale(1.34,1,1);cartouche.rotateY(PI);cartouche.translate(-1.1,6.44,faceZ-.23);b.geom(west,cartouche);cartouche.dispose();
 // Upper blind window and the horizontal parapet shown in every supplied view.
 const upper=K('muro-occidental','modern','trim');b.box(K('muro-occidental','mixed','plaster'),-1.1,23.0,-28.14,2.65,3.50,.08);
 for(const side of[-1,1])b.box(upper,-1.1+side*1.49,23.0,-28.24,.24,3.88,.31);
 for(const y of[21.10,24.90])b.box(upper,-1.1,y,-28.24,3.21,.24,.34);
 b.box(upper,-1.1,25.12,-28.30,3.65,.23,.47);
 const tops=[[-21.55,-16.5,13.85],[-16.5,-8.55,20.4],[-8.55,6.15,28.1],[6.15,14.4,17.35],[14.4,19.42,13.85]];
 for(const[x0,x1,y]of tops){b.box(upper,(x0+x1)/2,y+.08,-27.88,x1-x0+.14,.26,1.02);b.box(K('muro-occidental','modern','stone'),(x0+x1)/2,y+.43,-27.67,x1-x0,.46,.72);}
 // The horizontal screens conceal most of the roofs, but the steeper inner
 // parts still need a recessed gable end. Close only the exposed triangles;
 // the shared roof edge has no second coplanar roof cap or invented new pitch.
 const gableEnds=[];for(const[x0,x1,y0,y1,screen]of[[-16.5,-8.55,16.9,22.5,20.4],[6.15,14.4,22.5,16.9,17.35],[-21.9,-16.5,13.7,16.0,13.85],[14.4,19.8,16.0,13.7,13.85]]){
  const bottom=screen+.40,cross=x0+(bottom-y0)*(x1-x0)/(y1-y0),p=y1>y0?[[cross,bottom,-27.25],[x1,bottom,-27.25],[x1,y1,-27.25]]:[[x0,bottom,-27.25],[cross,bottom,-27.25],[x0,y0,-27.25]];
  gableEnds.push(...p.flat());
 }
 b.raw(K('cierres-cubierta','interpretation','stone'),gableEnds,.93);
 for(const x of[-8.55,-4.88,-1.2,2.48,6.15]){b.box(upper,x,28.83,-27.67,.47,.30,.50);b.cylinder(upper,x,29.22,-27.67,.15,.28,.48,8);}
 for(const[x,y]of[[-21.55,13.85],[-16.5,20.4],[14.4,17.35],[19.42,13.85]])b.cylinder(upper,x,y+.99,-27.67,0,.26,.72,4);
 doorLeaves(b,K,{id:'portada-principal',x:-1.1,z:-27.66,y:.12,yaw:PI,w:3.71,h:5.16,finish:'brass'});
 recordOpening('portada-principal',-1.1,2.4,-29.0,PI,3.6,4.8,2.5,'door');plan('portada-principal',[[-6,-28.3],[4,-28.3],[4,-27.4],[-6,-27.4]],'portal','modern');
 qa.westFacade={silhouette:westSilhouette,centralParapetY:28.1,doorAnchor:frame.westThreshold,niche:{centerX:-1.1,baseY:nicheY,width:nicheW,height:nicheH,depth,empty:true},stairsOwnedBy:'santa-maria-context',sourceKeys:['sm-cabrera-1987','sm-west-photo'],metricStatus:'Silhouette and composition from photographs; secondary dimensions approximate.'};

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
   box.makeEmpty();const selectedComponents=id==='santa-maria-portada-principal'?['portada-principal','muro-occidental']:COMPONENTS[id];
   for(const mesh of meshes)if(selectedComponents.includes(mesh.userData.component))box.union(mesh.geometry.boundingBox.clone().applyMatrix4(group.matrixWorld));
  }
  const offset=rotate(localOffset),closeOffset=rotate(localOffset.map((v,i)=>v*(i===1?.88:.82)));for(const off of[offset,closeOffset])off[1]=Math.max(off[1],heightAt(target.x+off[0],target.z+off[2])+3.5-target.y);
  if(id==='santa-maria-conjunto')box.getCenter(target);
  focuses[id]={id,label:sourceStops.get(id)?.title||label,regionId,coordinates:geographical(x,z),target,offset,closeOffset,bounds:box,components:COMPONENTS[id],kind:id==='santa-maria-conjunto'?'overview':'feature',requiresSection:false,sourceConfidence:'Architectural sector documented; metric placement approximate',modelLocal:{x,z}};
 }
 // Human-scale viewpoints remain inside the nave/aisle free space. Roof
 // opening is optional; responsive framing must never push an eye through a wall.
 const interiorViews={
  'santa-maria-naves':{target:[-1.1,7.2,-3.4],eye:[-1.1,1.95,-24.7],nearEye:[-1.1,1.95,-17.8],fov:70},
  'santa-maria-bovedas':{target:[-1.1,22.2,2.6],eye:[-1.1,2.1,-7.5],nearEye:[-1.1,2.1,-3.0],fov:72},
  'santa-maria-capillas':{target:[16.1,4.1,-6.2],eye:[10.65,1.95,-6.8],nearEye:[12.45,1.95,-6.55],fov:67}
 };
 for(const[id,view]of Object.entries(interiorViews)){const focus=focuses[id],target=localWorld(...view.target),offset=rotate(view.eye.map((v,i)=>v-view.target[i])),closeOffset=rotate(view.nearEye.map((v,i)=>v-view.target[i]));Object.assign(focus,{target,offset,closeOffset,interiorView:true,fitBounds:false,closeScale:false,minDistance:.5,fov:view.fov,requiresSection:false,eyeLocal:view.eye,nearEyeLocal:view.nearEye,localTarget:view.target});}
 const westFocus=focuses['santa-maria-portada-principal'];
 // Normal framing includes the stepped forecourt; the close view reads the portal.
 for(const x of[-24,20])for(const z of[-44,-28])westFocus.bounds.expandByPoint(localWorld(x,-2,z));
 westFocus.offset=rotate([3,15,-42]);westFocus.closeOffset=rotate([2,-4.5,-25]);westFocus.fov=48;
 focuses['santa-maria-portada-sur'].closeOffset=rotate([-16,1.8,-6]);
 qa.interiorCameras=Object.entries(interiorViews).map(([id,view])=>({id,...view,sectionRequired:false,metricStatus:'Authored within modelled free space; not a surveyed visitor route.'}));
 let selected=null,readingMode='materials',sectionOpen=false,ground=heightAt;
 const markerGeo=new THREE.BufferGeometry(),markerMat=new THREE.LineBasicMaterial({color:'#85d5c8',transparent:true,opacity:.9}),marker=new THREE.Line(markerGeo,markerMat);marker.name='Parada seleccionada de Santa María';marker.visible=false;marker.userData.selectionHelper=true;group.add(marker);resources.materials.push(markerMat);resources.geometries.push(markerGeo);
 const sectionRemoved=new Set(['cubiertas','remates-cubierta','cierres-cubierta','bovedas','bovedas-laterales','bovedas-capillas','boveda-abside','revestimiento-bovedas','muro-norte','muro-occidental','portada-norte','portada-principal','cupula']);
 function applyMaterials(){
  const focus=selected?focuses[selected]:null;
  for(const mesh of meshes){const d=mesh.userData,m=mesh.material,nextMap=readingMode==='periods'?null:d.baseMap;if(m.map!==nextMap){m.map=nextMap;m.needsUpdate=true;}m.color.copy(d.baseColor);if(readingMode==='periods')m.color.set(PERIOD_COLORS[d.period]);const match=focus&&(focus.kind==='overview'||focus.components.includes(d.component));m.emissive.set(match?'#397b6f':'#000000');m.emissiveIntensity=match?.18:0;}
 }
 function selectFocus(id){selected=id&&focuses[id]?id:null;applyMaterials();marker.visible=!!selected&&selected!=='santa-maria-conjunto';if(marker.visible){const p=group.worldToLocal(focuses[selected].target.clone()),pos=[];for(let i=0;i<=64;i++){const a=i*TAU/64;pos.push(p.x+Math.cos(a)*1.9,p.y+.16,p.z+Math.sin(a)*1.9);}markerGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));markerGeo.computeBoundingSphere();}return selected?focuses[selected]:null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';applyMaterials();return readingMode;}
 function setSection(open){sectionOpen=!!open;for(const mesh of meshes)mesh.visible=!(sectionOpen&&sectionRemoved.has(mesh.userData.component));return sectionOpen;}
 function bindGround(finalHeightAt){ground=finalHeightAt||heightAt;for(const focus of Object.values(focuses)){if(focus.interiorView)continue;for(const off of[focus.offset,focus.closeOffset])off[1]=Math.max(off[1],ground(focus.target.x+off[0],focus.target.z+off[2])+3.5-focus.target.y);}return group;}
 const stats={stops:Object.keys(focuses).length,components:new Set(meshes.map(m=>m.userData.component)).size,meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),trueApertures:qa.openings.length,interiorViews:Object.keys(interiorViews).length,naves:3,mainVaultBays:4,gothicMainVaultBays:2,apseWindows:3,apseButtresses:4,towerHeightM:58,cartographicOutline:true,sourceKeys:['sm-cabrera-1987','sm-zaragoza-2000','sm-perales-2023','sm-turismo','sm-campaners','sm-osm','sm-west-photo','sm-interior-photo-east','sm-interior-photo-west','sm-interior-photo-vaults'],periods:santaMariaPeriods.map(p=>p.id)};
 const planData={outline:record.footprint,components:planComponents,center:record.coordinate,yaw:YAW,registration:'OSM perimeter with schematic published-plan alignment; not a measured new survey',floorHeight:base};
 const visit={focuses,bounds,stats,periods:santaMariaPeriods,plan:planData,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({selected,readingMode,sectionOpen}),qa,metadata:{state:'Conserved church with medieval, early-modern and contemporary fabric',section:'Didactic removal of roofs, vault webs and north/west enclosure; octagonal supports, arcade and vault ribs remain. Not a reconstruction of the blocked crypt.',decoration:'Lost portal sculpture and the lost historical altarpiece are not reinstated. Seating and small altar are abstract scale aids, not an inventory of current furnishings. Vault finishes follow dated interior photographs without copying their figurative iconography.',metricStatus:'Main vault 24 m and tower 58 m documented; most remaining elevations and mouldings are visual estimates registered to cartography.'}};
 group.userData={id:'santa-maria',label:'Iglesia de Santa María',interpretation:true,cartographicOutline:true,ownedResources:resources,layout:frame,groundY:base,visit,towerHeightM:58,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
 // The masonry foundation already carries the raised church floor. Cap only
 // terrain that intrudes into it: raising surrounding street ground to this
 // datum would invent an earth bank along Cavallers and its two corners.
 const patch={id:'santa-maria-foundation',polygon:worldOutline,height:base-.13,margin:1.25,mode:'lower-only',priority:10},thresholdPatches=[];
 return{group,point:localWorld(-1.2,18,-3),patch,patches:[patch,...thresholdPatches],exclusion:worldOutline,ctx:frame,frame,views:{offset:rotate([80,62,75]),closeOffset:rotate([49,39,49])},stats,thresholdPatches};
}

export const santaMariaRegistration={yaw:YAW,coordinate:[-.27910948,39.67903398]};
