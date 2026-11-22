import * as THREE from 'three';
// V29. Barrio Obrero: 95 registered references / 287 current parts; municipal types III and IV.
// Historic typological interpretation, not a survey of any current private dwelling.
const PI=Math.PI,TAU=2*PI,UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,1),ID=new THREE.Matrix4();
const LON=111320*Math.cos(39.679*PI/180),projectDefault=(lon,lat)=>({x:(lon+.278)*LON,z:(39.679-lat)*111320});
const geo=p=>[-.278+p.x/LON,39.679-p.z/111320];
const noise=v=>{const n=Math.sin(v*127.17+43.31)*43758.5453;return n-Math.floor(n);};
export const barrioPeriods=[{id:'edificio',label:'Hileras y viviendas',color:'#d4b17c'},{id:'espacios',label:'Espacios y circulación',color:'#95bfc5'},{id:'construccion',label:'Estructura y materiales',color:'#c79379'},{id:'memoria',label:'Vida doméstica y memoria obrera',color:'#b7a1ca'},{id:'entorno',label:'Jardines, corrales y entorno',color:'#91ae87'}];
const COLORS=Object.fromEntries(barrioPeriods.map(x=>[x.id,x.color]));
const MAT={earth:{color:'#8b8068',roughness:1,metalness:0,map:'stone',bump:.012},foliage:{color:'#6d805a',roughness:.96,metalness:0},plaster:{color:'#e2d7bd',roughness:.95,metalness:0,map:'plaster',bump:.012},trim:{color:'#eee4ce',roughness:.93,metalness:0,map:'plaster',bump:.007},stone:{color:'#8f8b7c',roughness:.96,metalness:0,map:'stone',bump:.022},brick:{color:'#aa6d51',roughness:.95,metalness:0,map:'brick',bump:.018},roof:{color:'#9b7054',roughness:.93,metalness:0,map:'tile',bump:.027},floor:{color:'#bdb199',roughness:.85,metalness:0,map:'floor',bump:.007},hydraulic:{color:'#c6bba4',roughness:.79,metalness:0,map:'hydraulic',bump:.004},concrete:{color:'#b8b5a5',roughness:.94,metalness:0,map:'plaster',bump:.006},green:{color:'#435b50',roughness:.76,metalness:.16,map:'wood',bump:.004},iron:{color:'#3a4844',roughness:.58,metalness:.5},wood:{color:'#796044',roughness:.86,metalness:0,map:'wood',bump:.009},counter:{color:'#586754',roughness:.85,metalness:0,map:'wood',bump:.006},glass:{color:'#9eb9b1',roughness:.22,metalness:.03,opacity:.22},dark:{color:'#57564c',roughness:.95,metalness:0},paper:{color:'#d9cfb0',roughness:.96,metalness:0},ceramic:{color:'#ded9c9',roughness:.45,metalness:0,map:'floor',bump:.003},bronze:{color:'#8f7951',roughness:.47,metalness:.42}};
function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle=kind==='wood'?'#c9c8b9':'#e8e4d9';c.fillRect(0,0,256,256);
 if(['brick','ashlar','stone'].includes(kind)){const h=kind==='brick'?12:kind==='stone'?35:29,w=kind==='brick'?37:kind==='stone'?42:70;for(let y=0,row=0;y<256;y+=h,row++)for(let x=-w;x<256;x+=w){const t=noise(y+x+99);c.fillStyle=`rgba(${t>.5?'255,251,231':'63,54,41'},${kind==='ashlar'?.035:.08+t*.16})`;c.fillRect(x+(row%2)*w/2+1,y+1,w-2,h-2);}}
 if(kind==='tile'){for(let y=0;y<256;y+=24)for(let x=-1;x<256;x+=13){const t=noise(x+y);c.fillStyle=`rgba(62,37,25,${.1+t*.2})`;c.fillRect(x,y,11,22);c.fillStyle='rgba(255,235,198,.23)';c.fillRect(x+2,y+1,2,21);}}
 if(kind==='wood')for(let i=0;i<90;i++){c.strokeStyle=`rgba(42,35,26,${.02+noise(i)*.12})`;c.beginPath();c.moveTo(noise(i)*256,0);c.lineTo(noise(i)*256+noise(i+1)*7,256);c.stroke();}
 if(kind==='marble')for(let i=0;i<45;i++){c.strokeStyle='rgba(83,92,77,.1)';c.lineWidth=.3+noise(i)*1.8;c.beginPath();c.moveTo(-10,noise(i)*256);c.bezierCurveTo(66,noise(i+5)*256,170,noise(i+9)*256,266,noise(i+3)*256);c.stroke();}
 if(kind==='floor'){c.strokeStyle='rgba(90,85,72,.18)';for(let i=0;i<256;i+=64){c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.moveTo(0,i);c.lineTo(256,i);c.stroke();}}
 if(kind==='ceramic'){
  c.fillStyle='#d9d1b5';c.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=64){c.fillStyle='#f1ead7';c.fillRect(x+2,y+2,60,60);c.strokeStyle='#2d4e78';c.lineWidth=4;c.strokeRect(x+6,y+6,52,52);c.fillStyle='#38577e';c.beginPath();for(let j=0;j<8;j++){const a=j*Math.PI/4-Math.PI/2,r=j%2?11:24;const px=x+32+Math.cos(a)*r,py=y+32+Math.sin(a)*r;j?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();c.fillStyle='#ba9a5c';c.beginPath();c.arc(x+32,y+32,7,0,Math.PI*2);c.fill();}
 }else for(let i=0;i<4500;i++){c.fillStyle=(i%2?'rgba(38,39,30,':'rgba(255,250,228,')+(.015+noise(i)*.045)+')';c.fillRect(noise(i+70)*256,noise(i+20)*256,1,1);}
 if(kind==='hydraulic'){c.fillStyle='#e5e1d2';c.fillRect(0,0,256,256);for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=64){c.strokeStyle='#9c9b8b';c.lineWidth=1.3;c.strokeRect(x,y,64,64);c.fillStyle=((x+y)/64)%2?'#c9cfbf':'#bdbba9';c.fillRect(x+4,y+4,56,56);c.strokeStyle='rgba(245,239,218,.55)';c.lineWidth=2;c.strokeRect(x+10,y+10,44,44);}}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
const key=(component,period,material)=>[component,period,material].join('|');
class Batch{
 constructor(){this.parts=new Map();this.domesticOwner=-1;const cube=new THREE.BoxGeometry(1,1,1);this.cube=cube.toNonIndexed();cube.dispose();}
 geom(k,geometry,matrix=ID,tint=1){const g=geometry.index?geometry.toNonIndexed():geometry;if(!g.attributes.normal)g.computeVertexNormals();let out=this.parts.get(k);if(!out){out={p:[],n:[],u:[],c:[],o:[]};this.parts.set(k,out);}const p=g.attributes.position,no=g.attributes.normal,uv=g.attributes.uv,v=new THREE.Vector3(),nn=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(matrix);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);nn.fromBufferAttribute(no,i).applyMatrix3(nm).normalize();out.p.push(v.x,v.y,v.z);out.o.push(this.domesticOwner);out.n.push(nn.x,nn.y,nn.z);if(g.userData.keepUV&&uv)out.u.push(uv.getX(i),uv.getY(i));else{const a=Math.abs(nn.x),b=Math.abs(nn.y),c=Math.abs(nn.z);out.u.push((b>a&&b>c?v.x:a>c?v.z:v.x)/2.8,(b>a&&b>c?v.z:v.y)/2.8);}if(Array.isArray(tint))out.c.push(...tint);else out.c.push(tint,tint,tint);}if(g!==geometry)g.dispose();}
 raw(k,positions,tint=1){const p=[];for(let i=0;i<positions.length;i+=9){const a=new THREE.Vector3(positions[i+3]-positions[i],positions[i+4]-positions[i+1],positions[i+5]-positions[i+2]),b=new THREE.Vector3(positions[i+6]-positions[i],positions[i+7]-positions[i+1],positions[i+8]-positions[i+2]);if(a.cross(b).lengthSq()>1e-16)p.push(...positions.slice(i,i+9));}if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geom(k,g,ID,tint);g.dispose();}
 box(k,x,y,z,w,h,d,yaw=0,tint=1){if(Math.min(w,h,d)<=0)return;this.geom(k,this.cube,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(w,h,d)),tint);}
 beam(k,a,b,w=.08,d=w,tint=1){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);if(delta.length()<1e-6)return;this.geom(k,this.cube,new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,delta.clone().normalize()),new THREE.Vector3(w,delta.length(),d)),tint);}
 cylinder(k,x,y,z,rt,rb,h,segments=16,tint=1){const g=new THREE.CylinderGeometry(rt,rb,h,segments);this.geom(k,g,new THREE.Matrix4().makeTranslation(x,y,z),tint);g.dispose();}
 finish(group,resources,textures){for(const [k,data]of this.parts){const[component,period,kind]=k.split('|'),def=MAT[kind],mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness,vertexColors:true,side:THREE.DoubleSide,map:def.map?textures[def.map]:null,transparent:def.opacity!==undefined,opacity:def.opacity??1,depthWrite:def.opacity===undefined});if(def.map){mat.bumpMap=textures[def.map];mat.bumpScale=def.bump||.01;}const g=new THREE.BufferGeometry();for(const[name,values,size]of[['position',data.p,3],['normal',data.n,3],['uv',data.u,2],['color',data.c,3],['domesticOwner',data.o,1]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,size));pruneGeometry(g);g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.name='Barrio Obrero · '+component+' · '+kind;mesh.castShadow=def.opacity===undefined;mesh.receiveShadow=true;mesh.userData={barrioFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap};group.add(mesh);resources.geometries.push(g);resources.materials.push(mat);}this.cube.dispose();}
}
function pruneGeometry(g){const p=g.attributes.position,keep=[];for(let i=0;i<p.count;i+=3){const ax=p.getX(i+1)-p.getX(i),ay=p.getY(i+1)-p.getY(i),az=p.getZ(i+1)-p.getZ(i),bx=p.getX(i+2)-p.getX(i),by=p.getY(i+2)-p.getY(i),bz=p.getZ(i+2)-p.getZ(i),cx=ay*bz-az*by,cy=az*bx-ax*bz,cz=ax*by-ay*bx;if(cx*cx+cy*cy+cz*cz>1e-16)keep.push(i,i+1,i+2);}if(keep.length===p.count)return;for(const[name,a]of Object.entries(g.attributes)){const out=new Float32Array(keep.length*a.itemSize);for(let i=0;i<keep.length;i++)for(let j=0;j<a.itemSize;j++)out[i*a.itemSize+j]=a.array[keep[i]*a.itemSize+j];g.setAttribute(name,new THREE.BufferAttribute(out,a.itemSize));}}
const quad=(p,a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
const rectangle=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
function arch(cx,bottom,width,height,segments=20){const r=width/2,spring=bottom+height-r,p=[[cx-r,bottom],[cx+r,bottom],[cx+r,spring]];for(let i=1;i<=segments;i++){const a=i*PI/segments;p.push([cx+Math.cos(a)*r,spring+Math.sin(a)*r]);}return p;}
function capsule(cx,bottom,width,height,segments=12){const r=width/2,p=[];for(let i=0;i<=segments;i++){const a=PI+i*PI/segments;p.push([cx+Math.cos(a)*r,bottom+r+Math.sin(a)*r]);}for(let i=0;i<=segments;i++){const a=i*PI/segments;p.push([cx+Math.cos(a)*r,bottom+height-r+Math.sin(a)*r]);}return p;}
function shapeOf(outline,holes=[]){const shape=new THREE.Shape();for(const [i,p]of outline.entries())i?shape.lineTo(...p):shape.moveTo(...p);shape.closePath();for(const points of holes){const path=new THREE.Path();for(const [i,p]of [...points].reverse().entries())i?path.lineTo(...p):path.moveTo(...p);path.closePath();shape.holes.push(path);}return shape;}
function wall(b,k,outline,holes,thickness,transform=ID,tint=1){const g=new THREE.ExtrudeGeometry(shapeOf(outline,holes),{depth:thickness,steps:1,bevelEnabled:false,curveSegments:12});b.geom(k,g,transform,tint);g.dispose();}
function pane(b,k,outline,transform=ID,tint=1){const g=new THREE.ShapeGeometry(shapeOf(outline));b.geom(k,g,transform,tint);g.dispose();}
function iBeam(b,k,a,c,width=.22,depth=.30,web=.035,tint=1){const av=new THREE.Vector3(...a),cv=new THREE.Vector3(...c),v=cv.clone().sub(av),length=v.length();if(length<.001)return;const x=width/2,y=depth/2,f=web,pts=[[-x,-y],[x,-y],[x,-y+f],[f/2,-y+f],[f/2,y-f],[x,y-f],[x,y],[-x,y],[-x,y-f],[-f/2,y-f],[-f/2,-y+f],[-x,-y+f]],g=new THREE.ExtrudeGeometry(shapeOf(pts),{depth:length,bevelEnabled:false,steps:1});b.geom(k,g,new THREE.Matrix4().compose(av,new THREE.Quaternion().setFromUnitVectors(FORWARD,v.normalize()),new THREE.Vector3(1,1,1)),tint);g.dispose();}
function archTrim(b,k,cx,bottom,width,height,t,depth,transform){const outer=arch(cx,bottom-t,width+2*t,height+2*t),inner=arch(cx,bottom,width,height);wall(b,k,outer,[inner],depth,transform);}
const area=p=>p.reduce((v,a,i)=>{const c=p[(i+1)%p.length];return v+a.x*c.z-c.x*a.z;},0)/2;
const clean=p=>p.length>2&&Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<.02?p.slice(0,-1):p;
function frameFor(p){
 const edges=p.map((a,i)=>{const q=p[(i+1)%p.length];return{a,q,len:Math.hypot(q.x-a.x,q.z-a.z)};}).sort((a,b)=>b.len-a.len),e=edges[0];let ux=(e.q.x-e.a.x)/e.len,uz=(e.q.z-e.a.z)/e.len;if(ux<0){ux=-ux;uz=-uz;}const vx=-uz,vz=ux;
 const xs=p.map(q=>q.x*ux+q.z*uz),zs=p.map(q=>q.x*vx+q.z*vz),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2,x=cx*ux+cz*vx,z=cx*uz+cz*vz;
 return{x,z,ux,uz,vx,vz,yaw:-Math.atan2(uz,ux),w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),p:(a,y,b)=>[x+a*ux+b*vx,y,z+a*uz+b*vz],local:q=>({x:(q.x-x)*ux+(q.z-z)*uz,z:(q.x-x)*vx+(q.z-z)*vz})};
}
function slab(b,k,p,y,holes=[],depth=.16){const shape=new THREE.Shape(p.map(q=>new THREE.Vector2(q.x,-q.z)));for(const h of holes){const path=new THREE.Path(h.map(q=>new THREE.Vector2(q.x,-q.z)).reverse());shape.holes.push(path);}const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1}),m=new THREE.Matrix4().makeRotationX(-PI/2);m.setPosition(0,y-depth,0);b.geom(k,g,m);g.dispose();}
function lowArch(cx,y,w,h,rise=.26){
 // A true circular segment (escarzano), with horizontal tangent at its crown.
 const half=w/2,sag=Math.max(.001,Math.min(rise,half)),radius=(half*half+sag*sag)/(2*sag),cy=y+h-radius,p=[[cx-half,y],[cx+half,y],[cx+half,y+h-sag]];
 for(let i=1;i<=32;i++){const x=half-i*w/32;p.push([cx+x,cy+Math.sqrt(Math.max(0,radius*radius-x*x))]);}
 return p;
}
const rectPoly=(f,x0,z0,x1,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(([x,z])=>{const q=f.p(x,0,z);return{x:q[0],z:q[2]};});
function frameMatrix(a,b,thickness=.32){const l=Math.hypot(b.x-a.x,b.z-a.z),ux=(b.x-a.x)/l,uz=(b.z-a.z)/l,m=new THREE.Matrix4().makeBasis(new THREE.Vector3(ux,0,uz),UP,new THREE.Vector3(-uz,0,ux));m.setPosition((a.x+b.x)/2+uz*thickness/2,0,(a.z+b.z)/2-ux*thickness/2);return{m,l,ux,uz};}
function makeWindow(b,{matrix,cx,y,w,h,round=false,outside=-1,material='trim',buildingId,period='viviendas',shutters=false,seed=1}){
 const inner=round?lowArch(cx,y,w,h):rectangle(cx-w/2,y,cx+w/2,y+h),outer=round?lowArch(cx,y-.14,w+.28,h+.28,.30):rectangle(cx-w/2-.14,y-.14,cx+w/2+.14,y+h+.14),tm=matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,outside<0?-.13:.34));
 wall(b,key(buildingId+'-marcos',period,material),outer,[inner],.13,tm);
 const gm=matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,.12));pane(b,key(buildingId+'-vidrios',period,'glass'),inner,gm);
 const at=(x,yy,z=.10)=>new THREE.Vector3(x,yy,z).applyMatrix4(matrix).toArray(),k=key(buildingId+'-carpinteria',period,'green');
 for(const x of[cx-w/2+.05,cx,cx+w/2-.05])b.beam(k,at(x,y+.04),at(x,y+h-(round?.24:.04)),.055,.065);
 for(const yy of[y+.06,y+h*.44,y+h-.06])b.beam(k,at(cx-w/2,yy),at(cx+w/2,yy),.055,.065);
 if(shutters){for(const s of[-1,1]){const sm=matrix.clone().multiply(new THREE.Matrix4().makeTranslation(cx+s*w*.77,y+h/2,outside<0?-.22:.55));b.geom(k,b.cube,sm.multiply(new THREE.Matrix4().makeScale(w*.42,h,.095)),.82+noise(seed)*.15);}}
}
function roofGable(b,f,y,w,d,rise,k,axis='x'){
 const p=[];if(axis==='x'){quad(p,f.p(-w/2,y,-d/2),f.p(w/2,y,-d/2),f.p(w/2,y+rise,0),f.p(-w/2,y+rise,0));quad(p,f.p(-w/2,y+rise,0),f.p(w/2,y+rise,0),f.p(w/2,y,d/2),f.p(-w/2,y,d/2));b.beam(k,f.p(-w/2,y+rise+.06,0),f.p(w/2,y+rise+.06,0),.18,.2);}else{quad(p,f.p(-w/2,y,-d/2),f.p(0,y+rise,-d/2),f.p(0,y+rise,d/2),f.p(-w/2,y,d/2));quad(p,f.p(0,y+rise,-d/2),f.p(w/2,y,-d/2),f.p(w/2,y,d/2),f.p(0,y+rise,d/2));b.beam(k,f.p(0,y+rise+.06,-d/2),f.p(0,y+rise+.06,d/2),.18,.2);}b.raw(k,p);const parts=k.split('|'),gk=key(parts[0]+'-hastiales',parts[1],'plaster'),gp=[];for(const side of[-1,1]){if(axis==='x')gp.push(...f.p(side*w/2,y,-d/2),...f.p(side*w/2,y,d/2),...f.p(side*w/2,y+rise,0));else gp.push(...f.p(-w/2,y,side*d/2),...f.p(w/2,y,side*d/2),...f.p(0,y+rise,side*d/2));}b.raw(gk,gp);
}
function hipRoof(b,f,y,w,d,rise,k){const ridge=Math.max(.3,w/2-d*.42),a=f.p(-w/2,y,-d/2),c=f.p(w/2,y,-d/2),e=f.p(w/2,y,d/2),g=f.p(-w/2,y,d/2),l=f.p(-ridge,y+rise,0),r=f.p(ridge,y+rise,0),p=[];quad(p,a,c,r,l);quad(p,g,l,r,e);p.push(...a,...l,...g,...c,...e,...r);b.raw(k,p);b.beam(k,l,r,.2,.2);}
function turnedBaluster(b,k,p,h=.85){const profile=[[.07,0],[.065,.1],[.035,.17],[.08,.28],[.04,.4],[.075,.55],[.034,.69],[.055,.78],[.055,.85]].map(([r,y])=>new THREE.Vector2(r,y*h/.85)),g=new THREE.LatheGeometry(profile,8);b.geom(k,g,new THREE.Matrix4().makeTranslation(...p));g.dispose();}
function rail(b,f,x0,z0,x1,z1,y,period,buildingId,{turned=false}={}){const k=key(buildingId+'-barandillas',period,turned?'wood':'green'),len=Math.hypot(x1-x0,z1-z0),n=Math.ceil(len/.32);for(let i=0;i<=n;i++){const t=i/n,q=f.p(x0+(x1-x0)*t,y,z0+(z1-z0)*t);if(turned)turnedBaluster(b,k,q,.9);else b.box(k,q[0],q[1]+.45,q[2],.055,.9,.055);}b.beam(k,f.p(x0,y+.94,z0),f.p(x1,y+.94,z1),.10,.10);b.beam(k,f.p(x0,y+.1,z0),f.p(x1,y+.1,z1),.07,.07);}

// Dense outdoor slabs follow the final terrain between source mesh edges; no hidden per-cell walls.
function gardenSlab(b,k,f,x0,z0,x1,z1,y,depth=.035){
 const nx=Math.max(1,Math.ceil((x1-x0)/.40)),nz=Math.max(1,Math.ceil((z1-z0)/.40)),p=[];
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=x0+(x1-x0)*i/nx,c=x0+(x1-x0)*(i+1)/nx,u=z0+(z1-z0)*j/nz,v=z0+(z1-z0)*(j+1)/nz;quad(p,f.p(a,y,u),f.p(a,y,v),f.p(c,y,v),f.p(c,y,u));quad(p,f.p(a,y-depth,u),f.p(c,y-depth,u),f.p(c,y-depth,v),f.p(a,y-depth,v));if(i===0)quad(p,f.p(a,y,u),f.p(a,y-depth,u),f.p(a,y-depth,v),f.p(a,y,v));if(i===nx-1)quad(p,f.p(c,y,u),f.p(c,y,v),f.p(c,y-depth,v),f.p(c,y-depth,u));if(j===0)quad(p,f.p(a,y,u),f.p(c,y,u),f.p(c,y-depth,u),f.p(a,y-depth,u));if(j===nz-1)quad(p,f.p(a,y,v),f.p(a,y-depth,v),f.p(c,y-depth,v),f.p(c,y,v));}
 b.raw(k,p);
}
const inside=(q,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],c=p[j];if((a.z>q.z)!==(c.z>q.z)&&q.x<(c.x-a.x)*(q.z-a.z)/(c.z-a.z)+a.x)yes=!yes;}return yes;};
function districtFrame(x=0,z=0,w=0,d=0){const a=34.5*PI/180,ux=Math.cos(a),uz=Math.sin(a),vx=-uz,vz=ux;return{x,z,ux,uz,vx,vz,yaw:-a,w,d,p:(a,y,b)=>[x+a*ux+b*vx,y,z+a*uz+b*vz],local:q=>({x:(q.x-x)*ux+(q.z-z)*uz,z:(q.x-x)*vx+(q.z-z)*vz})};}
function rowFrame(p){const f=districtFrame(),qs=p.map(f.local),xs=qs.map(q=>q.x),zs=qs.map(q=>q.z),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),c=f.p((x0+x1)/2,0,(z0+z1)/2);return districtFrame(c[0],c[2],x1-x0,z1-z0);}
function halfPlane(p,z,lower){const out=[];for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],ia=lower?a.z<=z+1e-7:a.z>=z-1e-7,ic=lower?c.z<=z+1e-7:c.z>=z-1e-7;if(ia)out.push(a);if(ia!==ic){const t=(z-a.z)/(c.z-a.z);out.push({x:a.x+(c.x-a.x)*t,z});}}return out;}
function registeredRoof(b,part,f,eave,rise,k){
 const local=part.polygon.map(f.local),height=z=>eave+rise*Math.max(0,1-Math.abs(z)/(f.d/2));
 for(const lower of[true,false]){const p=halfPlane(local,0,lower);if(p.length<3)continue;const g=new THREE.ShapeGeometry(new THREE.Shape(p.map(q=>new THREE.Vector2(q.x,-q.z)))),pos=g.attributes.position,raw=[];const ix=g.index?g.index.array:Array.from({length:pos.count},(_,i)=>i);for(const i of ix){const x=pos.getX(i),z=-pos.getY(i);raw.push(...f.p(x,height(z)+.035,z));}b.raw(k,raw);g.dispose();}
 b.beam(k,f.p(-f.w/2,eave+rise+.08,0),f.p(f.w/2,eave+rise+.08,0),.17,.20);
 const [component,period]=k.split('|');for(let i=0;i<local.length;i++){const a=local[i],c=local[(i+1)%local.length],points=[a];if(a.z*c.z<-.000001){const t=-a.z/(c.z-a.z);points.push({x:a.x+(c.x-a.x)*t,z:0});}points.push(c);for(let j=1;j<points.length;j++){const u=points[j-1],v=points[j],hu=height(u.z),hv=height(v.z);if(Math.max(hu,hv)<=eave+.03)continue;const raw=[];quad(raw,f.p(u.x,eave,u.z),f.p(v.x,eave,v.z),f.p(v.x,hv,v.z),f.p(u.x,hu,u.z));b.raw(key(component+'-hastiales',period,'plaster'),raw);}}
}

export function createBarrio({record,site,project=projectDefault,heightAt=()=>4,contextData={},visitData={}}={}){
 record=record||site||{};if(!record.parts?.length)throw new Error('Barrio Obrero requires its registered cadastral parts');
 const origin=project(...(record.coordinate||[-.2254082,39.661704])),originY=heightAt(origin.x,origin.z),loc=p=>({x:p.x-origin.x,z:p.z-origin.z}),ll=p=>geo({x:p.x+origin.x,z:p.z+origin.z}),world=p=>({x:p.x+origin.x,z:p.z+origin.z});
 const district=districtFrame(),letters=['A','B','G','C','D','E','F'],blocks=(record.blocks||[]).map((p,i)=>({id:'barrio-bloque-'+letters[i],letter:letters[i],polygon:clean(p.map(c=>loc(project(...c))))})),parents=new Map((record.parents||[]).map(p=>[p.id,p]));
 const registered=record.parts.map(part=>{let polygon=clean(part.footprint.map(c=>loc(project(...c))));if(area(polygon)<0)polygon=polygon.reverse();const frame=rowFrame(polygon),center={x:frame.x,z:frame.z},block=blocks.find(q=>inside(center,q.polygon))||blocks.reduce((best,q)=>{const f=rowFrame(q.polygon),d=Math.hypot(f.x-frame.x,f.z-frame.z);return !best||d<best.distance?{...q,distance:d}:best;},null);return{...part,polygon,frame,area:Math.abs(area(polygon)),block:block?.letter||'G'};});
 const byParent=new Map();for(const p of registered){if(!byParent.has(p.parent))byParent.set(p.parent,[]);byParent.get(p.parent).push(p);}
 const representativeRefs={low:'8140503YJ3984A',high:'8140507YJ3984A'},selectedParts={low:registered.find(p=>p.id==='cat-8140503YJ3984A_part2-0'),high:registered.find(p=>p.id==='cat-8140507YJ3984A_part5-0')};
 if(!selectedParts.low||!selectedParts.high)throw new Error('Barrio representative footprints are missing');
 const buildingIds=new Map([...byParent.keys()].map(ref=>[ref,ref===representativeRefs.low?'barrio-casa-baja':ref===representativeRefs.high?'barrio-casa-alta':'barrio-ref-'+ref]));
 const group=new THREE.Group();group.name='Barrio Obrero · siete manzanas, casas y patios';group.position.set(origin.x,originY,origin.z);
 const permanent=new THREE.Group(),roof=new THREE.Group();permanent.name='Barrio · estado actual y tipologías domésticas';roof.name='Barrio · cubiertas desmontables de dos tipos históricos';group.add(permanent,roof);
 const b=new Batch(),rb=new Batch(),resources={geometries:[],materials:[],textures:[]},textures={};for(const kind of new Set(Object.values(MAT).map(m=>m.map).filter(Boolean))){textures[kind]=texture(kind);resources.textures.push(textures[kind]);}
 const components=[],partitions=[],doors=[],windows=[],stairData=[],roofs=[],floors=[],buildings=[],gardens=[],corrals=[],furniture=[],patches=[],exclusions=[],supports=[],ceilingData=[],wallData=[],thresholds=[],selected={},roofRecords=[],historicParts=[];
 const component=(id,label,period,p,kind,extra={})=>components.push({id,label,period,readingLayer:period,coordinates:p.map(ll),kind,interpretive:true,...extra});
 const boxAt=(ba,k,f,x,y,z,w,h,d,t=1)=>ba.box(k,...f.p(x,y,z),w,h,d,f.yaw,t);
 const isOccupied=(q,except)=>registered.some(p=>p!==except&&inside(q,p.polygon));
 const sourceNote='Catálogo municipal, pp. 82, 86, 89, 91–95; envolventes de Catastro. Ajuste tipológico, no levantamiento interior actual.';
 function doorRecord({id,matrix,x,y,w,h,buildingId,componentId,floor=0,open=false,round=false,period='edificio',recordQA=false}){
  // Bury the opening's lower return below the finish so it cannot self-shadow the walking surface.
  const hole=round?lowArch(x,y-.01,w,h+.01,.15):rectangle(x-w/2,y-.01,x+w/2,y+h),outer=round?lowArch(x,y-.10,w+.22,h+.20,.17):rectangle(x-w/2-.11,y-.07,x+w/2+.11,y+h+.11),tm=matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,-.11));wall(b,key(componentId+'-molduras',period,'trim'),outer,[hole],.10,tm);
  const k=key(componentId+'-puertas',period,'green'),leafWidth=w/2-.035,leafHeight=h-.13;
  for(const s of[-1,1]){const leaf=matrix.clone().multiply(new THREE.Matrix4().makeTranslation(x+s*w/2,y+.02,.08)).multiply(new THREE.Matrix4().makeRotationY(open?s*1.43:0)).multiply(new THREE.Matrix4().makeTranslation(-s*w/4,leafHeight/2,0));b.geom(k,b.cube,leaf.clone().multiply(new THREE.Matrix4().makeScale(leafWidth,leafHeight,.065)),.90);for(const py of[-leafHeight*.25,leafHeight*.18])b.geom(key(componentId+'-puerta-tableros',period,'wood'),b.cube,leaf.clone().multiply(new THREE.Matrix4().makeTranslation(0,py,-.037)).multiply(new THREE.Matrix4().makeScale(leafWidth*.72,leafHeight*.33,.025)),.88);}
  if(floor===0&&!componentId.endsWith('-interior')){const top=y+.006,tm=matrix.clone().multiply(new THREE.Matrix4().makeTranslation(x,top-.08,.12)).multiply(new THREE.Matrix4().makeScale(w+.04,.16,.50));b.geom(key(componentId+'-umbrales',period,'stone'),b.cube,tm);const centerFloor=new THREE.Vector3(x,top,.12).applyMatrix4(matrix);thresholds.push({id:id+'-umbral',buildingId,width:w+.04,depth:.50,top,center:centerFloor.toArray(),interpretive:true});}
  const center=new THREE.Vector3(x,y+h/2,.16).applyMatrix4(matrix),normal=new THREE.Vector3(0,0,1).transformDirection(matrix);doors.push({id,center:center.toArray(),normal:normal.toArray(),coordinates:ll(center),width:w,height:h,bottom:y,floor,buildingId,wallComponent:componentId,open,realOpening:true,round,representative:recordQA,interpretive:true});return hole;
 }
 function windowRecord({id,matrix,x,y,w,h,buildingId,componentId,floor=0,round=false,shutters=false,period='edificio',recordQA=false}){
  makeWindow(b,{matrix,cx:x,y,w,h,round,material:'trim',buildingId:componentId,period,shutters,seed:windows.length});
  const center=new THREE.Vector3(x,y+h/2,.16).applyMatrix4(matrix),normal=new THREE.Vector3(0,0,1).transformDirection(matrix);windows.push({id,center:center.toArray(),normal:normal.toArray(),coordinates:ll(center),width:w,height:h,bottom:y,floor,buildingId,wallComponent:componentId,realOpening:true,representative:recordQA,interpretive:true});
 }
 function addPerimeter(part,{base,F,eave,levels,componentId,buildingId,historic,representative=false,high=false}){
  const p=part.polygon,f=part.frame,front=-f.d/2,rear=f.d/2;
  for(let i=0;i<p.length;i++){
   const a=p[i],c=p[(i+1)%p.length],fm=frameMatrix(a,c,.30),al=f.local(a),cl=f.local(c),mx=(a.x+c.x)/2,mz=(a.z+c.z)/2,outside={x:mx+fm.uz*.55,z:mz-fm.ux*.55},exposed=!isOccupied(outside,part),frontEdge=Math.abs(al.z-front)<.35&&Math.abs(cl.z-front)<.35,rearEdge=Math.abs(al.z-rear)<.35&&Math.abs(cl.z-rear)<.35,holes=[],items=[];
   const blindGable=historic&&levels===2&&!frontEdge&&!rearEdge&&exposed;
   if(blindGable&&fm.l>2.8){for(const x of[-fm.l*.18,fm.l*.18]){const y=eave-.50,r=.14,circle=(rr)=>Array.from({length:20},(_,i)=>[x+Math.cos(i*TAU/20)*rr,y+Math.sin(i*TAU/20)*rr]),hole=circle(r);holes.push(hole);const vm=fm.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,-.08));wall(b,key(componentId+'-oculos','edificio','trim'),circle(r+.06),[hole],.07,vm);pane(b,key(componentId+'-oculos-cristal','edificio','glass'),hole,fm.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,.12)));const center=new THREE.Vector3(x,y,.16).applyMatrix4(fm.m),normal=new THREE.Vector3(0,0,1).transformDirection(fm.m);windows.push({id:part.id+'-oculo-'+i+'-'+x,center:center.toArray(),normal:normal.toArray(),coordinates:ll(center),width:r*2,height:r*2,bottom:y-r,floor:1,buildingId,wallComponent:componentId,realOpening:true,representative,circular:true,interpretive:true});}}
   if(exposed&&fm.l>2.1&&!blindGable){
    const count=representative?(high?7:3):Math.max(1,Math.floor(fm.l/(historic?3.2:3.4)));
    for(let fl=0;fl<levels;fl++){
     const fy=F+fl*(historic?3.6:3.05),usable=Math.min(2.45,eave-fy-.45);if(usable<1.0)continue;
     for(let j=0;j<count;j++){
      let x=-fm.l/2+(j+.5)*fm.l/count;const door=fl===0&&(frontEdge||rearEdge)&&(representative?(high?j===1||j===3||j===5:j===1):j===Math.floor(count/2));let w=door?Math.min(1.16,fm.l/count-.55):Math.min(1.06,fm.l/count-.72);const yy=door?fy:fy+.87,h=door?Math.min(2.5,usable):Math.min(1.65,usable-.45);if(w<.52||h<.70)continue;
      if(representative&&!high&&door){const desired=f.p(.92,0,frontEdge?front:rear),local=new THREE.Vector3(...desired).applyMatrix4(fm.m.clone().invert());x=local.x;}
      // Registered rear service annexes occupy the ends of this wall. Keep the
      // interpreted domestic windows in the clear courtyard interval, never
      // behind a coincident annex wall where only a false slit would remain.
      if(representative&&!high&&rearEdge&&!door){const current=new THREE.Vector3(x,0,.15).applyMatrix4(fm.m),rightRoom=f.local(current).x>1.5,desired=f.p(rightRoom?2.18:-.92,0,rear),local=new THREE.Vector3(...desired).applyMatrix4(fm.m.clone().invert());x=local.x;if(rightRoom)w=.78;}
      const bottom=yy-(door?.01:0),hole=historic?lowArch(x,bottom,w,h+(door?.01:0),.15):rectangle(x-w/2,bottom,x+w/2,yy+h);holes.push(hole);items.push({x,y:yy,w,h,floor:fl,door,round:historic});
     }
    }
   }
   const tint=historic?[[1.0,.98,.92],[.95,.95,.91],[1,.91,.82],[.93,.95,.91],[1,.96,.87]][Math.abs(Number(part.parent.slice(4,7)))%5]:[.91,.92,.92];
   wall(b,key(componentId+'-muros','edificio','plaster'),rectangle(-fm.l/2,base-.10,fm.l/2,eave),holes,.30,fm.m,tint);
   // Plinths have the same door cuts, so neither a continuous base nor a black decal closes the entrance.
   const plinthHoles=items.filter(q=>q.door).map(q=>rectangle(q.x-q.w/2,q.y-.02,q.x+q.w/2,base+.52));wall(b,key(componentId+'-zocalos','edificio','stone'),rectangle(-fm.l/2,base-.04,fm.l/2,base+.52),plinthHoles,.035,fm.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,-.035)),.94);
   if(exposed){for(const band of[{y:eave-.11,h:.15,d:.17},...(levels===2&&historic?[{y:F+3.52,h:.11,d:.08}]:[])]){const p0=new THREE.Vector3(-fm.l/2,band.y,-.07).applyMatrix4(fm.m).toArray(),p1=new THREE.Vector3(fm.l/2,band.y,-.07).applyMatrix4(fm.m).toArray();b.beam(key(componentId+'-cornisas','edificio','trim'),p0,p1,band.h,band.d);}}
   for(const [j,q]of items.entries()){const id=part.id+'-hueco-'+i+'-'+j,args={...q,id,matrix:fm.m,buildingId,componentId,recordQA:representative};if(q.door)doorRecord({...args,open:representative});else windowRecord({...args,shutters:historic&&exposed&&noise(j+Number(part.parent.slice(4,7)))>.62});}
   if(representative){const id=buildingId+'-cerramiento-'+i;partitions.push({id,buildingId,coordinates:[ll(a),ll(c)],floors:Array.from({length:levels},(_,i)=>i),thickness:.30,kind:'perimeter-wall',openingIds:items.map((_,j)=>part.id+'-hueco-'+i+'-'+j)});wallData.push({id,buildingId,a:[a.x,base,a.z],c:[c.x,base,c.z],bottom:base,top:eave,thickness:.30,openings:items.map(q=>({...q})),matrix:fm.m.toArray(),length:fm.l});}
  }
 }
 function primaryProfile(main){
  const q=district.local({x:main.frame.x,z:main.frame.z}),w=main.frame.w,d=main.frame.d,rectangular=main.area/(w*d)>.82,levels=Math.max(1,main.levels||1);let historic=false,type='transformacion';
  // Assignment follows the municipal block/type diagram and the surviving shape, not cadastral dates.
  if(['C','D','E','F'].includes(main.block)&&rectangular&&w>7.5&&w<12.3&&d>6.3&&d<10.4&&levels===1){historic=true;type='III';}
  if(['D','F'].includes(main.block)&&q.x>65&&q.x<94&&rectangular&&w>18&&w<24&&d>6.5&&d<8.5&&levels===2){historic=true;type='IV';}
  if(['A','B'].includes(main.block)&&q.z>-31&&q.z<-16&&w>7&&w<11.6&&d>7.4&&d<10.5&&levels===1){historic=true;type=main.block==='A'?'I':'II';}
  if(main.block==='G'&&q.x<164&&levels===2&&w>7.2&&d>6.2&&d<14.5&&main.area>44){historic=true;type='V';}
  return{historic,type,levels};
 }
 const parcelDatums=new Map();
 for(const [ref,parts]of byParent){
  const main=[...parts].sort((a,b)=>b.area-a.area)[0],profile=primaryProfile(main),meta=parents.get(ref)||{},id=buildingIds.get(ref),blockFrame=rowFrame(blocks.find(q=>q.letter===main.block).polygon),frontSide=blockFrame.local({x:main.frame.x,z:main.frame.z}).z<0?-1:1,frontPoint=main.frame.p(0,0,frontSide*(main.frame.d/2+2.85)),ground=heightAt(frontPoint[0]+origin.x,frontPoint[2]+origin.z)-originY,F=ground+.18,representative=ref===representativeRefs.low?'low':ref===representativeRefs.high?'high':null;
  parcelDatums.set(ref,{ground,frontPoint,frontSide});
  buildings.push({id,name:representative==='low'?'Tipo III · casa de una planta':representative==='high'?'Tipo IV · pareja de dos plantas':'Vivienda y dependencias · manzana '+main.block,coordinates:main.polygon.map(ll),levels:profile.levels,baseY:originY+F,reference:ref,registeredParts:parts.map(p=>p.id),block:main.block,typology:representative==='low'?'III':representative==='high'?'IV':profile.type,interiorSurvey:false,typologicalInterior:!!representative,sourceConfidence:representative?'municipal-historic-type-adapted-to-current-envelope':'registered-current-envelope',cadastralYear:meta.year||null,classificationUsesCadastralYear:false,datumMethod:'public-frontage-terrain-sample',datumCoordinate:ll({x:frontPoint[0],z:frontPoint[2]})});
  for(const part of parts){
   const isMain=part===main,rep=representative&&part===selectedParts[representative],f=part.frame,levels=Math.max(1,Math.min(12,part.levels||1)),historic=isMain&&profile.historic,partComponent=rep?id:'barrio-bloque-'+part.block,base=ground,partF=F,eave=ground+(historic?(profile.type==='V'?7.0:levels===2?7.3:3.7):levels*3.05+.20),roofBatch=rep?rb:b;
   addPerimeter(part,{base,F:partF,eave,levels,componentId:partComponent,buildingId:id,historic,representative:!!rep,high:representative==='high'});
   slab(b,key(partComponent+'-pavimentos','espacios',rep?'hydraulic':'floor'),part.polygon,partF,(part.holes||[]).map(h=>clean(h.map(c=>loc(project(...c))))),.16);
   exclusions.push(part.polygon);patches.push({polygon:part.polygon.map(world),height:originY+ground-.04});
   const gable=historic&&part.area>35,rise=gable?Math.min(1.5,f.d*.165):0;if(gable){registeredRoof(roofBatch,part,f,eave,rise,key(partComponent+'-tejados','construccion','roof'));historicParts.push(part.id);
    for(const s of[-1,1])b.beam(key(partComponent+'-canalones','construccion','iron'),f.p(-f.w/2,eave-.06,s*f.d/2),f.p(f.w/2,eave-.06,s*f.d/2),.075,.085);
    const cx=-f.w*.29,cz=f.d*.24,cy=eave+rise*.52;boxAt(roofBatch,key(partComponent+'-chimeneas','construccion','brick'),f,cx,cy+.50,cz,.38,1.03,.43);boxAt(roofBatch,key(partComponent+'-chimeneas-tapa','construccion','trim'),f,cx,cy+1.07,cz,.55,.12,.58);
   }else{slab(roofBatch,key(partComponent+'-azoteas','construccion','concrete'),part.polygon,eave+.08,(part.holes||[]).map(h=>clean(h.map(c=>loc(project(...c))))),.16);if(isMain&&levels>1)for(let i=0;i<part.polygon.length;i++){const a=part.polygon[i],c=part.polygon[(i+1)%part.polygon.length];b.beam(key(partComponent+'-pretiles','edificio','plaster'),[a.x,eave+.32,a.z],[c.x,eave+.32,c.z],.40,.16);}}
   const rr={id:part.id+'-cubierta',buildingId:id,registeredPart:part.id,coordinates:part.polygon.map(ll),eaves:eave,ridge:eave+rise,hiddenInSection:!!rep,documentedType:historic,interiorSurvey:false,kind:gable?'gable':'flat',typology:isMain?profile.type:'annex'};roofs.push(rr);roofRecords.push(rr);
   component(part.id,'Huella catastral conservada','edificio',part.polygon,'building',{buildingId:id,registeredPart:part.id,levels,floor:null,block:part.block,typology:isMain?profile.type:'annex',interiorSurvey:false,sourceConfidence:'registered-footprint'});
   if(rep){selected[representative]={part,f,base,F,U:F+3.6,E:eave,id,levels,rise};}
  }
 }
 function addPartition(s,id,a,c,y,top,{opening=0,openings=null,width=.86,floor=0}={}){
  const pa=s.f.p(a[0],0,a[1]),pc=s.f.p(c[0],0,c[1]),fm=frameMatrix({x:pa[0],z:pa[2]},{x:pc[0],z:pc[2]},.14),doorPositions=openings||(opening===null?[]:[opening]),holes=doorPositions.map(x=>rectangle(x-width/2,y-.01,x+width/2,y+2.22));
  wall(b,key(s.id+'-tabiques','espacios','plaster'),rectangle(-fm.l/2,y-.06,fm.l/2,top),holes,.14,fm.m);for(const [j,x]of doorPositions.entries())doorRecord({id:id+'-puerta-'+j,matrix:fm.m,x,y,w:width,h:2.22,buildingId:s.id,componentId:s.id+'-interior',floor,open:true,period:'espacios',recordQA:true});
  partitions.push({id,buildingId:s.id,coordinates:[ll({x:pa[0],z:pa[2]}),ll({x:pc[0],z:pc[2]})],floors:[floor],thickness:.14,kind:'partition',openingIds:doorPositions.map((_,j)=>id+'-puerta-'+j),typological:true});wallData.push({id,buildingId:s.id,a:pa,c:pc,bottom:y-.06,top,thickness:.14,openings:doorPositions.map(x=>({x,y,w:width,h:2.22,door:true})),matrix:fm.m.toArray(),length:fm.l});
 }
 function room(s,id,label,x0,z0,x1,z1,floor=0){const p=rectPoly(s.f,x0,z0,x1,z1);component(id,label,'espacios',p,'room',{buildingId:s.id,floor,elevation:originY+(floor?s.U:s.F),interpretiveUse:true,documentedLayout:'municipal-typology',currentPrivateInterior:false});return p;}
 function furnBox(s,id,type,x,z,w,d,h,{floor=0,material='wood',topMaterial=null}={}){const F=floor?s.U:s.F,p=rectPoly(s.f,x-w/2,z-d/2,x+w/2,z+d/2);boxAt(b,key(s.id+'-mobiliario','memoria',material),s.f,x,F+h/2,z,w,h,d);if(topMaterial)boxAt(b,key(s.id+'-mobiliario-tableros','memoria',topMaterial),s.f,x,F+h+.025,z,w+.05,.05,d+.04);furniture.push({id,buildingId:s.id,floor,type,base:F,top:F+h+.05,footprint:p.map(ll),localFootprint:p,documentedInventory:false});}
 // Type III: central passage with rooms at both sides. Room uses are an interpretive domestic reading.
 {
  const s=selected.low,{f,F,E,id}=s,hw=f.w/2,hd=f.d/2,corridor=.92,cw=1.13,left=corridor-cw/2,right=corridor+cw/2,ceiling=E-.20;
  s.corridor={x:corridor,width:cw};s.ceiling=ceiling;
  for(const x of[left,right])addPartition(s,id+'-paso-'+x,[x,-hd+.18],[x,hd-.18],F,ceiling,{openings:[-1.55,1.55],width:.88});
  // Horizontal transverse partitions have communicating apertures, as in the municipal plan.
  addPartition(s,id+'-tabique-izquierda',[-hw+.18,0],[left,0],F,ceiling,{opening:0,width:.92});
  addPartition(s,id+'-tabique-derecha',[right,0],[hw-.18,0],F,ceiling,{opening:0,width:.86});
  room(s,'barrio-sala-room','Estancia delantera · uso doméstico interpretado',-hw+.18,-hd+.18,left-.08,-.08);
  room(s,'barrio-dormitorios-room','Estancia posterior · descanso interpretado',-hw+.18,.08,left-.08,hd-.18);
  room(s,'barrio-cocina-room','Estancia posterior · cocina interpretada',right+.08,.08,hw-.18,hd-.18);
  room(s,id+'-estancia-frontal','Estancia frontal',right+.08,-hd+.18,hw-.18,-.08);
  room(s,id+'-paso','Paso longitudinal',left+.08,-hd+.18,right-.08,hd-.18);
  slab(rb,key(id+'-techo-liso','construccion','plaster'),s.part.polygon,ceiling+.035,[],.055);ceilingData.push({buildingId:id,floor:0,top:ceiling+.035,bottom:ceiling-.02,kind:'horizontal-gypsum-reed',material:'plaster',hiddenInSection:true});
  for(const x of[-hw+.38,hw-.38])boxAt(rb,key(id+'-durmientes','construccion','wood'),f,x,ceiling+.16,0,.18,.22,f.d-.25);
  const tableX=-2.0,tableZ=-1.5;furnBox(s,id+'-mesa','table',tableX,tableZ,1.10,.73,.71,{topMaterial:'wood'});for(const x of[tableX-.65,tableX+.65])furnBox(s,id+'-banco','stool',x,tableZ,.32,.32,.43);
  furnBox(s,id+'-cama','bed',-1.8,hd-1.22,1.40,1.92,.42,{material:'wood',topMaterial:'paper'});furnBox(s,id+'-armario','wardrobe',-hw+.55,hd-1.0,.60,1.35,1.98);
  furnBox(s,id+'-cocina-banco','cooking-bench',hw-1.15,hd-.48,1.65,.60,.87,{material:'plaster',topMaterial:'stone'});furnBox(s,id+'-alacena','cupboard',hw-.48,1.15,.60,.85,1.72,{material:'green'});
  for(const x of[hw-1.58,hw-.98]){const q=f.p(x,F+.94,hd-.48);b.cylinder(key(id+'-cocina-hogar','memoria','dark'),q[0],q[1],q[2],.14,.14,.018,16);}
  floors.push({id:0,buildingId:id,label:'Tipo III · planta baja',elevation:originY+F,ceiling:originY+ceiling,coordinates:s.part.polygon.map(ll),typological:true});
 }
 // Type IV: two dwellings flanking a common straight stair, represented on both documented storeys.
 {
  const s=selected.high,{f,F,U,E,id}=s,hw=f.w/2,hd=f.d/2,stairWidth=1.30,well=.78,start=-hd+.62,steps=20,run=(f.d-1.82)/steps,rise=(U-F)/steps,end=start+steps*run,ceiling=E-.20;
  s.ceiling=ceiling;s.stair={width:stairWidth,start,end,steps,run,rise};
  const hole=rectPoly(f,-well,start-.10,well,end+.10);slab(b,key(id+'-forjado-alto','construccion','hydraulic'),s.part.polygon,U,[hole],.22);slab(b,key(id+'-intradós-liso','construccion','plaster'),s.part.polygon,U-.22,[hole],.012);slab(rb,key(id+'-techo-liso','construccion','plaster'),s.part.polygon,ceiling+.035,[],.055);
  ceilingData.push({buildingId:id,floor:0,top:U-.22,bottom:U-.232,kind:'timber-brick-floor-plastered',material:'plaster',hiddenInSection:false,holes:[hole]},{buildingId:id,floor:1,top:ceiling+.035,bottom:ceiling-.02,kind:'horizontal-gypsum-reed',material:'plaster',hiddenInSection:true});
  for(let fl=0;fl<2;fl++){
   const floorY=fl?U:F,top=fl?ceiling:U-.23;
   for(const side of[-1,1]){const lx=side<0?-hw+.18:well+.12,rx=side<0?-well-.12:hw-.18,cx=(lx+rx)/2,pass=cx+.40;
    addPartition(s,id+'-medianera-'+fl+'-'+side,[side*well,-hd+.18],[side*well,hd-.18],floorY,top,{opening:fl?(hd-.72):null,width:.88,floor:fl});
    for(const x of[pass-.55,pass+.55])addPartition(s,id+'-paso-'+fl+'-'+side+'-'+x,[x,-hd+.18],[x,hd-.18],floorY,top,{openings:[-1.5,1.5],width:.88,floor:fl});
    addPartition(s,id+'-transversal-'+fl+'-'+side,[lx,0],[pass-.55,0],floorY,top,{opening:0,width:.88,floor:fl});
    addPartition(s,id+'-transversal-2-'+fl+'-'+side,[pass+.55,0],[rx,0],floorY,top,{opening:0,width:.82,floor:fl});
    room(s,id+'-estancia-'+fl+'-'+side,'Tipo IV · estancia de vivienda',lx,-hd+.18,pass-.63,-.08,fl);room(s,id+'-posterior-'+fl+'-'+side,'Tipo IV · estancia posterior',lx,.08,pass-.63,hd-.18,fl);room(s,id+'-paso-'+fl+'-'+side,'Tipo IV · paso longitudinal',pass-.47,-hd+.18,pass+.47,hd-.18,fl);
    // The shared landing and dwelling access remain free of interpretive furniture.
   }
   floors.push({id:fl,buildingId:id,label:fl?'Tipo IV · primera planta':'Tipo IV · planta baja',elevation:originY+floorY,ceiling:originY+(fl?ceiling:U-.232),coordinates:s.part.polygon.map(ll),holes:fl?[hole.map(ll)]:[],typological:true});
  }
  // The main slab already supports the rear landing beyond end+.10; fill only the gap at the stair head.
  // Stacking a second full landing slab here causes coplanar self-shadow and a black walking surface.
  const landing=rectPoly(f,-well,end,well,hd-.18),landingInfill=rectPoly(f,-well,end,well,end+.10);slab(b,key(id+'-desembarco','construccion','hydraulic'),landingInfill,U,[],.22);slab(b,key(id+'-desembarco-intrados','construccion','plaster'),landingInfill,U-.22,[],.012);
  const segments=[],treads=[],axis=[];
  for(let j=0;j<steps;j++){const z=start+j*run,y=F+(j+1)*rise;boxAt(b,key(id+'-escalera','construccion','plaster'),f,0,(F+y)/2,z+run/2,stairWidth,y-F,run+.003);boxAt(b,key(id+'-peldaños','construccion','stone'),f,0,y+.008,z+run/2,stairWidth+.025,.016,run+.012);const p0=f.p(-stairWidth/2,y,z),p1=f.p(stairWidth/2,y,z);segments.push([ll({x:p0[0],z:p0[2]}),ll({x:p1[0],z:p1[2]})]);treads.push({index:j,base:F,top:y,polygon:rectPoly(f,-stairWidth/2,z,stairWidth/2,z+run),center:f.p(0,y,z+run/2)});axis.push(f.p(0,y,z+run/2));}
  for(const side of[-1,1]){b.beam(key(id+'-escalera-pasamanos','construccion','wood'),f.p(side*.70,F+.95,start),f.p(side*.70,U+.95,end),.06,.06);for(let j=0;j<=5;j++){const t=j/5;b.beam(key(id+'-escalera-barrotes','construccion','green'),f.p(side*.70,F+t*(U-F),start+t*(end-start)),f.p(side*.70,F+t*(U-F)+.92,start+t*(end-start)),.035,.035);}}
  for(const x of[-well,well]){boxAt(b,key(id+'-brochal','construccion','wood'),f,x,U-.15,(start+end)/2,.18,.30,end-start+.20);supports.push({id:id+'-brochal-'+x,buildingId:id,kind:'timber-stair-trimmer',base:f.p(x,F,start),top:f.p(x,U-.30,start),supportedBy:'masonry-stairwell-wall'});}
  component('barrio-escalera-comun','Escalera común · tipo IV','construccion',hole,'stairs',{buildingId:id,floors:[0,1],segments,typological:true});stairData.push({id:'barrio-escalera-comun',buildingId:id,footprint:hole.map(ll),localFootprint:hole,landing:landing.map(ll),localLanding:landing,segments,steps,fromFloor:0,toFloor:1,rise,run,width:stairWidth,headroomMinimum:ceiling-U,axis,treads,hole:hole.map(ll),typological:true,documentedArrangement:true,interpretedDimensions:true});
 }
 // Domestic gardens and rear yards follow the seven blocks; contemporary extensions remain in place.
 const courtyardCandidate=(f,x0,z0,x1,z1,block,part)=>{let p=rectPoly(f,x0,z0,x1,z1);if(p.some(q=>!inside(q,block.polygon)))return null;const samples=[...p,{x:p.reduce((s,q)=>s+q.x,0)/4,z:p.reduce((s,q)=>s+q.z,0)/4}];if(samples.some(q=>isOccupied(q,part)))return null;return p;};
 const addFence=(f,x0,z0,x1,z1,y,id,gate=false,height=.65)=>{
  const a=f.p(x0,y,z0),c=f.p(x1,y,z1),len=Math.hypot(x1-x0,z1-z0),dx=(x1-x0)/len,dz=(z1-z0)/len,gateW=Math.min(1.20,len*.28),pieces=gate?[[0,(len-gateW)/2],[(len+gateW)/2,len]]:[[0,len]],yaw=-Math.atan2(c[2]-a[2],c[0]-a[0]);
  for(const [lo,hi]of pieces){const t=(lo+hi)/2/len,x=a[0]+(c[0]-a[0])*t,z=a[2]+(c[2]-a[2])*t;b.box(key('barrio-jardines-muros','entorno','plaster'),x,y+height/2,z,hi-lo,height,.13,yaw);b.box(key('barrio-jardines-coronaciones','entorno','trim'),x,y+height+.04,z,hi-lo,.07,.20,yaw);}
  if(gate){const midx=(x0+x1)/2,midz=(z0+z1)/2;rail(b,f,midx-dx*gateW/2,midz-dz*gateW/2,midx+dx*gateW/2,midz+dz*gateW/2,y,'entorno','barrio-verjas');doors.push({id,buildingId:null,coordinates:ll({x:(a[0]+c[0])/2,z:(a[2]+c[2])/2}),width:gateW,height:.98,bottomY:originY+y,floor:null,kind:'garden-gate',gardenIndex:b.domesticOwner,realOpening:true,interpretive:true});}
 };
 for(const [ref,parts]of byParent){
  const main=[...parts].sort((a,c)=>c.area-a.area)[0],profile=primaryProfile(main);if(!profile.historic)continue;const f=main.frame,block=blocks.find(q=>q.letter===main.block),bf=rowFrame(block.polygon),cc=bf.local({x:f.x,z:f.z}),side=cc.z<0?-1:1,F=parcelDatums.get(ref).ground+.03,hw=f.w/2-.14,edge=side*f.d/2,rep=ref===representativeRefs.low?'low':ref===representativeRefs.high?'high':null;
  // The Avenida 9 d'Octubre frontage has documented losses of gardens; do not restore them indiscriminately.
  if(!(['E','F'].includes(main.block)&&side>0)){
   let chosen=null;for(const depth of[2.7,2.2,1.6,1.0]){const z1=edge+side*.16,z2=edge+side*depth,p=courtyardCandidate(f,-hw,Math.min(z1,z2),hw,Math.max(z1,z2),block,main);if(p){chosen={p,z1,z2,depth};break;}}
   if(chosen){b.domesticOwner=gardens.length;const{id:buildingId}=buildings.find(q=>q.reference===ref),p=chosen.p;gardenSlab(b,key('barrio-jardines-suelo','entorno','earth'),f,-hw,Math.min(chosen.z1,chosen.z2),hw,Math.max(chosen.z1,chosen.z2),F,.035);const path=rectPoly(f,-.54,Math.min(chosen.z1,chosen.z2),.54,Math.max(chosen.z1,chosen.z2));gardenSlab(b,key('barrio-jardines-caminos','entorno','floor'),f,-.54,Math.min(chosen.z1,chosen.z2),.54,Math.max(chosen.z1,chosen.z2),F+.02,.025);addFence(f,-hw,chosen.z2,hw,chosen.z2,F,ref+'-cancela',true);for(const x of[-hw,hw])addFence(f,x,chosen.z1,x,chosen.z2,F,ref+'-lateral',false,.56);gardens.push({id:ref+'-jardin',buildingId,polygon:p,coordinates:p.map(ll),depth:chosen.depth,originalF:F,groundY:originY+F,frontGroundY:originY+F,frontZ:chosen.z2,backZ:chosen.z1,frame:{x:f.x,z:f.z,ux:f.ux,uz:f.uz,vx:f.vx,vz:f.vz},currentExtentInterpretive:true});component(ref+'-jardin','Jardín delantero','entorno',p,'garden',{buildingId,floor:null});exclusions.push(p); // No garden foundation curtain: final ground controls its public edge.
    const x=-hw*.60,z=(chosen.z1+chosen.z2)/2,q=f.p(x,F,z);if(chosen.depth>1.5){b.cylinder(key('barrio-jardines-troncos','entorno','wood'),q[0],F+.55,q[2],.065,.09,1.1,6);const g=new THREE.IcosahedronGeometry(.72,1);b.geom(key('barrio-jardines-copas','entorno','foliage'),g,new THREE.Matrix4().compose(new THREE.Vector3(q[0],F+1.4,q[2]),new THREE.Quaternion(),new THREE.Vector3(1,.85,1)),.86+noise(gardens.length)*.18);g.dispose();}
    if(rep)selected[rep].garden={...chosen,F};b.domesticOwner=-1;
   }
  }
  const inward=-side,back=-side*f.d/2;let yard=null;for(const depth of[2.25,1.7,1.1]){const z1=back+inward*.20,z2=back+inward*depth,p=courtyardCandidate(f,-hw,Math.min(z1,z2),hw,Math.max(z1,z2),block,main);if(p){yard={p,z1,z2,depth,x0:-hw,x1:hw};break;}const step=.32,free=[];for(let x=-hw;x<hw-.5;x+=step){const end=Math.min(hw,x+step),cell=courtyardCandidate(f,x,Math.min(z1,z2),end,Math.max(z1,z2),block,main);if(cell)free.push(x);}let best=null,lo=null,prev=null;for(const x of [...free,Infinity]){if(lo!==null&&x>prev+step*1.1){const width=prev+step-lo;if(width>1.15&&(!best||width>best.width))best={x0:lo+.03,x1:prev+step-.03,width};lo=null;}if(Number.isFinite(x)&&lo===null)lo=x;prev=x;}if(best){yard={p:rectPoly(f,best.x0,Math.min(z1,z2),best.x1,Math.max(z1,z2)),z1,z2,depth,x0:best.x0,x1:best.x1};break;}}
  if(yard){const buildingId=buildingIds.get(ref);slab(b,key('barrio-corrales-suelo','entorno','floor'),yard.p,F+.01,[],.045);addFence(f,yard.x0,yard.z2,yard.x1,yard.z2,F,ref+'-corral',false,1.35);for(const x of[yard.x0,yard.x1])addFence(f,x,yard.z1,x,yard.z2,F,ref+'-corral-tabique',false,1.35);corrals.push({id:ref+'-corral',buildingId,polygon:yard.p,coordinates:yard.p.map(ll),typological:true});component(ref+'-corral','Corral trasero y tapias','espacios',yard.p,'courtyard',{buildingId,floor:null});exclusions.push(yard.p);if(rep)selected[rep].corral={...yard,F};}
 }
 // Existing registered rear annexes are retained; no invented service block is overlaid on them.
 for(const block of blocks)component(block.id,'Manzana '+block.letter,'edificio',block.polygon,'block',{floor:null,buildingId:null,sourceConfidence:'municipal-block-plan'});
 b.finish(permanent,resources,textures);rb.finish(roof,resources,textures);const vegetation=new THREE.Group();vegetation.name='Barrio · vegetación doméstica';for(const m of [...permanent.children])if(['barrio-jardines-copas','barrio-jardines-troncos'].includes(m.userData.component))vegetation.add(m);permanent.add(vegetation);group.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(group),meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});const state={sectionOpen:false,readingMode:'realistic',selected:null},focuses={};
 function focus(id,label,f,xyz,offset,closeOffset,period,{interiorView=false,floor=null,buildingId=null,requiresSection=false,fitBounds=false,components:cs=[],fov=55}={}){const p=f.p(...xyz),target=new THREE.Vector3(p[0]+origin.x,p[1]+originY,p[2]+origin.z),rotate=q=>[q[0]*f.ux+q[2]*f.vx,q[1],q[0]*f.uz+q[2]*f.vz],full='barrio-'+id;focuses[full]={id:full,label,target,localTarget:p,coordinates:geo(target),elevation:p[1],offset:rotate(offset),closeOffset:rotate(closeOffset),regionId:period,readingLayer:period,period,components:cs,interiorView,floor,buildingId,requiresSection,fitBounds,bounds:fitBounds?bounds.clone():new THREE.Box3(target.clone().addScalar(-2),target.clone().addScalar(2)),kind:id==='conjunto'?'overview':'feature',minDistance:interiorView?.28:.7,closeScale:false,fov,sourceConfidence:interiorView?'documented-historic-typology-interpreted-use':'registered-envelope-municipal-documentation'};}
 const low=selected.low,high=selected.high,{f:lf,F:LF,id:lid}=low,{f:hf,F:HF,U:HU,id:hid}=high;
 focus('conjunto','Las siete manzanas del Barrio Obrero',district,[40,3,3],[-95,190,155],[-75,140,110],'edificio',{fitBounds:true,fov:49});
 focus('trazado','Calles, hileras y patios',district,[15,2,3],[-30,75,60],[-18,52,42],'edificio',{fov:55,components:blocks.map(q=>q.id)});
 focus('hileras','La casa baja repetida',lf,[-4,LF+1.7,-lf.d/2],[-10,5,-17],[-7,2,-12],'edificio',{components:['barrio-bloque-D-muros'],fov:60});
 focus('vivienda-baja','Tipo III · vivienda de una planta',lf,[0,LF+1.65,-lf.d/2],[0,4.8,-12],[0,2.3,-9],'edificio',{buildingId:lid,components:[lid+'-muros'],fov:57});
 focus('vivienda-esquina','Tipo IV · el extremo de dos alturas',hf,[0,HF+3.5,0],[13,9,-20],[9,5.5,-15],'edificio',{buildingId:hid,components:[hid+'-muros'],fov:57});
 const gardenZ=low.garden?(low.garden.z1+low.garden.z2)/2:-lf.d/2-1.0;focus('jardin','Jardín delantero y cancela',lf,[0,LF+.5,gardenZ],[-5,4,-6],[-3,2,-4.5],'entorno',{buildingId:lid,components:['barrio-jardines-muros','barrio-jardines-copas'],fov:58});
 focus('sala','Estancia delantera · vida doméstica',lf,[-1.4,LF+1.60,-.9],[-2.0,.03,-1.65],[-1.65,.03,-1.4],'espacios',{interiorView:true,floor:0,buildingId:lid,components:[lid+'-mobiliario'],fov:67});
 focus('cocina','Cocina · interpretación de uso',lf,[2.65,LF+1.35,2.60],[1.25,.28,-1.95],[1.10,.28,-1.65],'espacios',{interiorView:true,floor:0,buildingId:lid,components:[lid+'-cocina-hogar'],fov:74});
 focus('dormitorios','Descanso · interpretación de uso',lf,[-1.3,LF+1.60,2.45],[-2.0,.03,-1.35],[-1.6,.03,-1.05],'espacios',{interiorView:true,floor:0,buildingId:lid,components:[lid+'-mobiliario'],fov:67});
 const yardZ=low.corral?(low.corral.z1+low.corral.z2)/2:lf.d/2+1;focus('corral','El corral entre las dos hileras',lf,[low.corral?(low.corral.x0+low.corral.x1)/2:0,LF+.8,yardZ],[0,8,8],[0,5.5,5],'espacios',{buildingId:lid,components:['barrio-corrales-suelo'],fov:57});
 focus('planta-alta','Primera planta y escalera común',hf,[0,HU-.70,.60],[0,2.33,hf.d/2-.50-.60],[.12,2.33,hf.d/2-.66-.60],'espacios',{interiorView:true,floor:1,buildingId:hid,components:[hid+'-forjado-alto',hid+'-escalera'],fov:76});
 focus('cubiertas','Teja árabe, aleros y chimeneas',lf,[0,low.E+.6,0],[-10,10,10],[-7,7,7],'construccion',{buildingId:lid,components:[lid+'-tejados',lid+'-chimeneas'],fov:52});
 focus('carpinterias','Huecos, molduras y madera',lf,[0,LF+1.7,-lf.d/2],[3,.7,-5],[2,.15,-3.7],'construccion',{buildingId:lid,components:[lid+'-carpinteria',lid+'-molduras'],fov:56});
 const transformed=registered.find(q=>q.parent==='8041716YJ3984A'&&q.levels===8)||registered.find(q=>q.levels>=5);if(transformed)focus('transformaciones','Las transformaciones del barrio',transformed.frame,[0,8,0],[-27,22,-30],[-18,15,-22],'memoria',{components:['barrio-bloque-C-muros'],fov:59});
 focus('seccion','Leer la casa baja por dentro',lf,[0,LF+.9,0],[-8,16,10],[-6,12,7],'espacios',{floor:0,buildingId:lid,requiresSection:true,interiorView:false,components:[lid+'-tabiques',lid+'-pavimentos'],fov:50});
 const plan={id:'barrio',label:'Barrio Obrero · siete manzanas y dos tipos de vivienda',coordinate:record.coordinate,outline:(record.footprint||[]),blocks:blocks.map(q=>({id:q.id,letter:q.letter,coordinates:q.polygon.map(ll)})),buildings,components,partitions,floors,stairs:stairData.map(({treads,axis,localFootprint,...s})=>({...s,axis:axis?.map(p=>ll({x:p[0],z:p[2]}))})),openings:{doors,windows},registeredParts:registered.map(p=>({id:p.id,parent:p.parent,buildingId:buildingIds.get(p.parent),coordinates:p.polygon.map(ll),holes:p.holes||[],levels:p.levels,block:p.block})),stops:Object.values(focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,localTarget:f.localTarget,elevation:f.elevation,regionId:f.regionId,readingLayer:f.readingLayer,floor:f.floor,buildingId:f.buildingId,interiorView:f.interiorView,requiresSection:f.requiresSection})),sectionFloor:0,sectionBuildingId:lid,note:sourceNote};
 function repaint(){for(const mesh of meshes){const m=mesh.material,q=mesh.userData;if(!q.barrioFabric)continue;m.color.copy(q.baseColor);m.map=q.baseMap;m.bumpMap=q.baseBumpMap;m.emissive.set('#000000');if(state.readingMode==='periods'){m.color.set(COLORS[q.period]||'#c5bd9f');m.map=null;m.bumpMap=null;}const s=state.selected?focuses[state.selected]:null;if(s?.components?.some(c=>q.component===c||q.component.startsWith(c+'-')))m.emissive.set(state.readingMode==='periods'?'#252219':'#090805');m.needsUpdate=true;}}
 const setSection=value=>{state.sectionOpen=!!value;roof.visible=!state.sectionOpen;return state.sectionOpen;};
 const setReadingMode=mode=>{state.readingMode=mode==='periods'?'periods':'realistic';repaint();return state.readingMode;};
 const selectFocus=id=>{state.selected=focuses[id]?id:null;repaint();return state.selected?focuses[state.selected]:null;};
 const bindGround=sample=>{
  if(typeof sample!=='function')return;
  for(const garden of gardens){const q=garden.frame,x=q.x+garden.frontZ*q.vx+origin.x,z=q.z+garden.frontZ*q.vz+origin.z;garden.frontGroundY=sample(x,z)+.041;garden.groundY=garden.frontGroundY;garden.datumMethod='graded-to-final-public-surface';}
  for(const door of doors.filter(q=>q.kind==='garden-gate')){const p=project(...door.coordinates);door.bottomY=sample(p.x,p.z)+.041;}
  for(const mesh of meshes){const owners=mesh.geometry.attributes.domesticOwner;if(!owners||!owners.array.some(v=>v>=0))continue;const p=mesh.geometry.attributes.position,base=mesh.userData.ungroundedPositions||(mesh.userData.ungroundedPositions=new Float32Array(p.array));for(let i=0;i<p.count;i++){const owner=Math.round(owners.getX(i));if(owner<0)continue;const garden=gardens[owner],f=garden.frame,x=base[i*3],z=base[i*3+2],localX=(x-f.x)*f.ux+(z-f.z)*f.uz,localZ=(x-f.x)*f.vx+(z-f.z)*f.vz,t=Math.max(0,Math.min(1,(localZ-garden.frontZ)/(garden.backZ-garden.frontZ))),frontX=f.x+localX*f.ux+garden.frontZ*f.vx+origin.x,frontZ=f.z+localX*f.uz+garden.frontZ*f.vz+origin.z,frontY=sample(frontX,frontZ)+.041,innerY=originY+garden.originalF,interpolatedBase=frontY*(1-t)+innerY*t,surface=['barrio-jardines-suelo','barrio-jardines-caminos'].includes(mesh.userData.component),newBase=surface?Math.max(interpolatedBase,sample(x+origin.x,z+origin.z)+.041):interpolatedBase;p.setY(i,base[i*3+1]+newBase-innerY);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
  group.updateMatrixWorld(true);
  for(const f of Object.values(focuses)){if(f.interiorView||f.requiresSection)continue;for(const field of['offset','closeOffset']){const q=f[field],y=sample(f.target.x+q[0],f.target.z+q[2]);if(Number.isFinite(y)&&f.target.y+q[1]<y+1.7)q[1]=y+1.7-f.target.y;}}
 };

 let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;for(const r of resources.geometries)r.dispose();for(const r of resources.materials)r.dispose();for(const r of resources.textures)r.dispose();};
 const stats={modelVersion:'v29',buildings:buildings.length,cadastralReferences:byParent.size,parts:registered.length,blocks:blocks.length,meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),architecturalFocuses:Object.keys(focuses).length,interiorFocuses:Object.values(focuses).filter(q=>q.interiorView).length,representativeBuildings:2,historicGabledParts:historicParts.length,realDoors:doors.filter(q=>q.kind!=='garden-gate').length,realWindows:windows.length,gardens:gardens.length,corrals:corrals.length,currentPrivateInteriorsSurveyed:0};
 const qa={origin:{x:origin.x,y:originY,z:origin.z},registered:registered.map(p=>({id:p.id,parent:p.parent,polygon:p.polygon,levels:p.levels})),buildings,parts:registered.length,blocks:blocks.length,walls:wallData,doors,windows,thresholds,stairs:stairData,ceilings:ceilingData,roofs:roofRecords,furniture,supports,representatives:Object.fromEntries(Object.entries(selected).map(([kind,s])=>[kind,{buildingId:s.id,reference:s.part.parent,part:s.part.id,polygon:s.part.polygon,frame:{x:s.f.x,z:s.f.z,w:s.f.w,d:s.f.d,ux:s.f.ux,uz:s.f.uz,vx:s.f.vx,vz:s.f.vz},floor:s.F,upperFloor:kind==='high'?s.U:null,eaves:s.E,ceiling:s.ceiling,sectionOnlyRoof:true}])),gardens,corrals,classificationUsesCadastralYear:false};
 const metadata={label:'Barrio Obrero',modelVersion:'v29',sourceNote,typologicalInteriors:true,currentPrivateInteriorSurvey:false,documentedTypes:['III','IV'],documentedEaves:{singleStorey:3.7,twoStorey:7.3,typeV:7.0,page:82},interpretiveDetails:['ajuste de tabiques a la huella actual','usos de habitaciones sin rótulo original','mobiliario doméstico','colores actuales no muestreados','cotas interiores y peldañeado'],sectionMeaning:'Se retiran solamente las cubiertas y el falso techo superior de las dos tipologías seleccionadas; se conserva el forjado intermedio.',confidence:'registered-geometry-municipal-types-interpreted-interiors'};
 const visit={id:'barrio',siteId:'barrio-obrero',group,focuses,bounds,plan,stats,qa,metadata,periods:barrioPeriods,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({...state}),sectionAvailable:true,dispose,renderStops:visitData.stops||[]};group.userData={id:'barrio-obrero',landmarkId:'barrio-obrero',visit,resources,ownedResources:resources,interpretation:true};
 setSection(false);repaint();const point=focuses['barrio-conjunto'].target.clone(),views={offset:focuses['barrio-conjunto'].offset,closeOffset:focuses['barrio-conjunto'].closeOffset},worldExclusions=exclusions.map(p=>p.map(world));return{id:'barrio-obrero',record,group,point,views,view:{target:point.clone(),...views},visit,roof,vegetation,setSection,dispose,stats,patches,exclusions:worldExclusions,vegetationExclusions:worldExclusions,excludedBuildingIds:[...(record.catastroBuildingIds||[]),...(record.osmBuildingIds||[])],excludedRoadIds:[]};
}

