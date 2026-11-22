import * as THREE from 'three';
// V26. Casino: registered footprint, photographed elevations and documented spatial uses.
// A historical spatial interpretation, not a survey or a claim of completed rehabilitation.
const PI=Math.PI,TAU=2*PI,UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,1),ID=new THREE.Matrix4();
const LON=111320*Math.cos(39.679*PI/180),projectDefault=(lon,lat)=>({x:(lon+.278)*LON,z:(39.679-lat)*111320});
const geo=p=>[-.278+p.x/LON,39.679-p.z/111320];
const noise=v=>{const n=Math.sin(v*127.17+43.31)*43758.5453;return n-Math.floor(n);};
export const casinoPeriods=[{id:'edificio',label:'Casa Gerencia y arquitectura',color:'#d4ac79'},{id:'patio',label:'Patio y galerías',color:'#88b4bc'},{id:'vida-social',label:'El Casino y la vida social',color:'#c88f7d'},{id:'jardines',label:'Jardín, baile y encuentro',color:'#93b18f'},{id:'memoria',label:'Memoria y recuperación',color:'#b59ac7'}];
const COLORS=Object.fromEntries(casinoPeriods.map(x=>[x.id,x.color]));
const MAT={plaster:{color:'#e9e4d8',roughness:.96,metalness:0,map:'plaster',bump:.01},ashlar:{color:'#e0d4b8',roughness:.95,metalness:0,map:'ashlar',bump:.01},brick:{color:'#a34532',roughness:.95,metalness:0,map:'brick',bump:.022},stone:{color:'#9e9b8f',roughness:.97,metalness:0,map:'stone',bump:.035},trim:{color:'#c9bea3',roughness:.92,metalness:0,map:'plaster',bump:.015},green:{color:'#465f4d',roughness:.83,metalness:.05,map:'wood',bump:.008},wood:{color:'#72513b',roughness:.8,metalness:0,map:'wood',bump:.008},roof:{color:'#9b6247',roughness:.94,metalness:0,map:'tile',bump:.035},floor:{color:'#b8afa0',roughness:.87,metalness:0,map:'floor',bump:.01},marble:{color:'#d8d5bd',roughness:.42,metalness:.04,map:'marble',bump:.005},marbleGreen:{color:'#456458',roughness:.4,metalness:.07,map:'marble',bump:.006},iron:{color:'#394641',roughness:.64,metalness:.5,map:'wood',bump:.005},glass:{color:'#a1b4b6',roughness:.25,metalness:.04,opacity:.27},ceramic:{color:'#e7e0c9',roughness:.46,metalness:.02,map:'ceramic',bump:.008},blue:{color:'#314f75',roughness:.48,metalness:.03},burgundy:{color:'#873c47',roughness:.8,metalness:0},paper:{color:'#e6dfc9',roughness:.96,metalness:0},dark:{color:'#575448',roughness:.92,metalness:0},ochre:{color:'#b6a079',roughness:.8,metalness:.02,map:'marble',bump:.008}};
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
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
const key=(component,period,material)=>[component,period,material].join('|');
class Batch{
 constructor(){this.parts=new Map();const cube=new THREE.BoxGeometry(1,1,1);this.cube=cube.toNonIndexed();cube.dispose();}
 geom(k,geometry,matrix=ID,tint=1){const g=geometry.index?geometry.toNonIndexed():geometry;if(!g.attributes.normal)g.computeVertexNormals();let out=this.parts.get(k);if(!out){out={p:[],n:[],u:[],c:[]};this.parts.set(k,out);}const p=g.attributes.position,no=g.attributes.normal,uv=g.attributes.uv,v=new THREE.Vector3(),nn=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(matrix);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);nn.fromBufferAttribute(no,i).applyMatrix3(nm).normalize();out.p.push(v.x,v.y,v.z);out.n.push(nn.x,nn.y,nn.z);if(g.userData.keepUV&&uv)out.u.push(uv.getX(i),uv.getY(i));else{const a=Math.abs(nn.x),b=Math.abs(nn.y),c=Math.abs(nn.z);out.u.push((b>a&&b>c?v.x:a>c?v.z:v.x)/2.8,(b>a&&b>c?v.z:v.y)/2.8);}out.c.push(tint,tint,tint);}if(g!==geometry)g.dispose();}
 raw(k,positions,tint=1){const p=[];for(let i=0;i<positions.length;i+=9){const a=new THREE.Vector3(positions[i+3]-positions[i],positions[i+4]-positions[i+1],positions[i+5]-positions[i+2]),b=new THREE.Vector3(positions[i+6]-positions[i],positions[i+7]-positions[i+1],positions[i+8]-positions[i+2]);if(a.cross(b).lengthSq()>1e-16)p.push(...positions.slice(i,i+9));}if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geom(k,g,ID,tint);g.dispose();}
 box(k,x,y,z,w,h,d,yaw=0,tint=1){if(Math.min(w,h,d)<=0)return;this.geom(k,this.cube,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(w,h,d)),tint);}
 beam(k,a,b,w=.08,d=w,tint=1){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);if(delta.length()<1e-6)return;this.geom(k,this.cube,new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,delta.clone().normalize()),new THREE.Vector3(w,delta.length(),d)),tint);}
 cylinder(k,x,y,z,rt,rb,h,segments=16,tint=1){const g=new THREE.CylinderGeometry(rt,rb,h,segments);this.geom(k,g,new THREE.Matrix4().makeTranslation(x,y,z),tint);g.dispose();}
 finish(group,resources,textures){for(const [k,data]of this.parts){const[component,period,kind]=k.split('|'),def=MAT[kind],mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness,vertexColors:true,side:THREE.DoubleSide,map:def.map?textures[def.map]:null,transparent:def.opacity!==undefined,opacity:def.opacity??1,depthWrite:def.opacity===undefined});if(def.map){mat.bumpMap=textures[def.map];mat.bumpScale=def.bump||.01;}const g=new THREE.BufferGeometry();for(const[name,values,size]of[['position',data.p,3],['normal',data.n,3],['uv',data.u,2],['color',data.c,3]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,size));pruneGeometry(g);g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.name='Casino · '+component+' · '+kind;mesh.castShadow=def.opacity===undefined;mesh.receiveShadow=true;mesh.userData={casinoFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap};group.add(mesh);resources.geometries.push(g);resources.materials.push(mat);}this.cube.dispose();}
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
function slab(b,k,p,y,holes=[]){const shape=new THREE.Shape(p.map(q=>new THREE.Vector2(q.x,-q.z)));for(const h of holes){const path=new THREE.Path(h.map(q=>new THREE.Vector2(q.x,-q.z)).reverse());shape.holes.push(path);}const g=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false,steps:1}),m=new THREE.Matrix4().makeRotationX(-PI/2);m.setPosition(0,y-.16,0);b.geom(k,g,m);g.dispose();}
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

export function createCasino({record,site,project=projectDefault,heightAt=()=>4,visitData={},contextData={}}={}){
 record=record||site||{};
 if(!record.footprint?.length||!record.courtyard?.length)throw new Error('Casino requires its registered footprint and courtyard');
 const origin=project(...record.coordinate),originY=heightAt(origin.x,origin.z),loc=p=>({x:p.x-origin.x,z:p.z-origin.z}),ll=p=>geo({x:p.x+origin.x,z:p.z+origin.z}),sample=(x,z)=>heightAt(x+origin.x,z+origin.z)-originY;
 const p=clean(record.footprint.map(c=>loc(project(...c)))),court=clean(record.courtyard.map(c=>loc(project(...c)))),rp=clean((record.structures?.[0]?.roofComponents?.[0]||record.footprint).map(c=>loc(project(...c)))),f=frameFor(rp),buildingId='casino-main';
 const ground=p.reduce((s,q)=>s+sample(q.x,q.z),0)/p.length,F=ground+1.15,U=F+4.25,T=F+8.7;
 const group=new THREE.Group();group.name='Casino · Casa Gerencia, patio y vida social';group.position.set(origin.x,originY,origin.z);
 const permanent=new THREE.Group(),roof=new THREE.Group(),upper=new THREE.Group();permanent.name='Casino · planta principal y fábrica';roof.name='Casino · cubiertas y cielos';upper.name='Casino · forjado, escalera y planta alta';group.add(permanent,roof,upper);
 const b=new Batch(),rb=new Batch(),ub=new Batch(),resources={geometries:[],materials:[],textures:[]},textures={};
 for(const kind of new Set(Object.values(MAT).map(x=>x.map).filter(Boolean))){textures[kind]=texture(kind);resources.textures.push(textures[kind]);}
 const components=[],partitions=[],stairData=[],windows=[],doors=[],roofInfo=[],patches=[],exclusionPolygons=[p],terracePolygons=[];
 const at=(x,y,z)=>f.p(x,y,z),pt=(x,z)=>{const q=at(x,0,z);return{x:q[0],z:q[2]};},boxF=(batch,k,x,y,z,w,h,d,tint=1)=>{const q=at(x,y,z);batch.box(k,...q,w,h,d,f.yaw,tint);};
 const addComponent=(id,label,period,poly,kind,extra={})=>components.push({id,label,period,readingLayer:period,coordinates:poly.map(ll),kind,buildingId,interpretive:true,...extra});
 const solid=(batch,k,poly,top,bottom)=>{const shape=new THREE.Shape(poly.map(q=>new THREE.Vector2(q.x,-q.z))),g=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.01,top-bottom),bevelEnabled:false,steps:1}),m=new THREE.Matrix4().makeRotationX(-PI/2);m.setPosition(0,bottom,0);batch.geom(k,g,m);g.dispose();};
 const openingRecord=(kind,id,fw,cx,y,w,h,extra={})=>{const q={id,buildingId,center:new THREE.Vector3(cx,y+h*.45,.16).applyMatrix4(fw.m).toArray(),normal:[-fw.uz,0,fw.ux],width:w,height:h,physicalVoid:true,...extra};(kind==='window'?windows:doors).push(q);return q;};
 const dado=(batch,component,period,fw,y,h,holes=[],offset=-.035)=>{
  let spans=[[-fw.l/2,fw.l/2]];
  for(const hole of holes){const lo=Math.min(...hole.map(p=>p[0])),hi=Math.max(...hole.map(p=>p[0]));spans=spans.flatMap(([l,r])=>hi<=l||lo>=r?[[l,r]]:[[l,Math.min(r,lo)],[Math.max(l,hi),r]].filter(([a,c])=>c-a>.015));}
  const m=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,offset));
  for(const[l,r]of spans){wall(batch,key(component,period,'ceramic'),rectangle(l,y,r,y+h),[],.025,m);wall(batch,key(component+'-remate',period,'blue'),rectangle(l,y+h,r,y+h+.045),[],.03,m);}
 };
 const trimOpening=(batch,fw,cx,y,w,h,{round=true,rise=.28,material='trim',component='casino-main-marcos',period='edificio',outside=-1,depth=.12}={})=>{
  const inner=round?lowArch(cx,y,w,h,rise):rectangle(cx-w/2,y,cx+w/2,y+h),outer=round?lowArch(cx,y-.14,w+.28,h+.28,rise+.05):rectangle(cx-w/2-.14,y-.14,cx+w/2+.14,y+h+.14),m=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,outside<0?-.13:.34));
  wall(batch,key(component,period,material),outer,[inner],depth,m);
 };
 const glazedWindow=(batch,fw,cx,y,w,h,{outside=-1,period='edificio'}={})=>{
  const hole=lowArch(cx,y,w,h,.28),gm=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,.16));
  pane(batch,key('casino-main-vidrios',period,'glass'),hole,gm);
  const inner=lowArch(cx,y+.055,w-.11,h-.11,.25),wm=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,.1));
  wall(batch,key('casino-main-carpinteria',period,'green'),hole,[inner],.09,wm);
  const v=(x,yy)=>new THREE.Vector3(x,yy,.14).applyMatrix4(fw.m).toArray(),k=key('casino-main-carpinteria',period,'green');
  batch.beam(k,v(cx,y+.05),v(cx,y+h-.32),.055,.075);
  for(const yy of[y+h*.40,y+h-.50])batch.beam(k,v(cx-w/2+.05,yy),v(cx+w/2-.05,yy),.06,.075);
  trimOpening(batch,fw,cx,y,w,h,{outside,period});
 };

 // The exterior and courtyard follow the supplied cadastral polygons. Heights are proportional.
 const stairHole=rectPoly(f,-12.05,-12.1,-7.8,-6.3);
 slab(b,key('casino-main-suelo','edificio','floor'),p,F);
 slab(ub,key('casino-main-forjado','edificio','floor'),p,U,[court,stairHole]);
 slab(rb,key('casino-main-cielo','edificio','plaster'),p,T-.12,[court]);
 patches.push({polygon:p.map(q=>({x:q.x+origin.x,z:q.z+origin.z})),height:originY+ground-.04});
 addComponent('casino-main-planta','Casa Gerencia · dos niveles','edificio',p,'casino',{floors:[0,1],baseY:originY+F,holes:[court.map(ll)]});
 addComponent('casino-main-forjado','Forjado de la planta alta','edificio',p,'slab',{floors:[1],hiddenWhenSection:true,holes:[court.map(ll),stairHole.map(ll)]});
 addComponent('casino-main-cubiertas','Anillo de cubiertas de teja','edificio',rp,'roof',{hiddenWhenSection:true,holes:[court.map(ll)]});
 const sign=Math.sign(area(p))||1;
 for(let edge=0;edge<p.length;edge++){
  const a=p[edge],c=p[(edge+1)%p.length],fw=frameMatrix(a,c,.36),mid=f.local({x:(a.x+c.x)/2,z:(a.z+c.z)/2}),outside=-sign,holes=[],items=[];
  const isNorth=mid.z<-11&&fw.l>12,isEast=mid.x>13&&fw.l>7,isSouth=mid.z>11&&fw.l>15;
  const doorCandidate=isNorth||isEast||isSouth,entryCx=isNorth?1.0:isSouth?fw.l*.22:0;
  if(doorCandidate){const w=isNorth?2.3:1.85,h=3.1;holes.push(lowArch(entryCx,F-.025,w,h,.35));items.push({door:true,cx:entryCx,y:F-.025,w,h});openingRecord('door','casino-puerta-'+edge,fw,entryCx,F-.025,w,h,{floor:0,external:true});}
  const count=fw.l>5?Math.max(1,Math.round((fw.l-1)/3.8)):0;
  for(let j=0;j<count;j++)for(let level=0;level<2;level++){
   const cx=-fw.l/2+(j+.5)*fw.l/count,w=1.58,h=2.55,y=(level?U:F)+.68;
   if(Math.abs(cx)+w/2>fw.l/2-.42||(!level&&doorCandidate&&Math.abs(cx-entryCx)<2.2))continue;
   holes.push(lowArch(cx,y,w,h,.28));items.push({door:false,cx,y,w,h,level});openingRecord('window','casino-ventana-'+edge+'-'+j+'-'+level,fw,cx,y,w,h,{floor:level,external:true});
  }
  wall(b,key('casino-main-muros','edificio','plaster'),rectangle(-fw.l/2,ground-.22,fw.l/2,T),holes,.36,fw.m,.97+noise(edge+100)*.05);
  const plinth=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,outside<0?-.12:.36));
  wall(b,key('casino-main-zocalo','edificio','stone'),rectangle(-fw.l/2,ground-.2,fw.l/2,F-.07),[],.12,plinth,.93);
  for(const y of[F-.045,U-.04,T-.04]){
   const q=new THREE.Vector3(0,y,outside<0?-.16:.45).applyMatrix4(fw.m);b.box(key('casino-main-cornisas','edificio','trim'),q.x,q.y,q.z,fw.l+.10,y===T-.04?.24:.14,.22,-Math.atan2(fw.uz,fw.ux));
  }
  // Fine scored plaster joints are clipped to masonry by short intervals between real openings.
  for(let y=F+.35;y<T-.22;y+=.43){let spans=[[-fw.l/2+.03,fw.l/2-.03]];for(const item of items){if(y<item.y-.16||y>item.y+item.h+.16)continue;const lo=item.cx-item.w/2-.17,hi=item.cx+item.w/2+.17;spans=spans.flatMap(([l,r])=>hi<=l||lo>=r?[[l,r]]:[[l,Math.min(r,lo)],[Math.max(l,hi),r]].filter(([a,c])=>c-a>.05));}for(const[l,r]of spans){const q=new THREE.Vector3((l+r)/2,y,outside<0?-.009:.369).applyMatrix4(fw.m);b.box(key('casino-main-juntas','edificio','trim'),q.x,q.y,q.z,r-l,.012,.009,-Math.atan2(fw.uz,fw.ux),.94);}}
  for(const item of items){if(item.door){trimOpening(b,fw,item.cx,item.y,item.w,item.h,{outside,rise:.35});const k=key('casino-main-puertas','edificio','green');for(const s of[-1,1]){const dm=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(item.cx+s*(item.w/2-.05),item.y+1.38,.48)).multiply(new THREE.Matrix4().makeRotationY(s*PI/2.2));b.geom(k,b.cube,dm.multiply(new THREE.Matrix4().makeScale(item.w*.43,2.72,.065)));}}else glazedWindow(b,fw,item.cx,item.y,item.w,item.h,{outside});}
 }
 // Red brick corner strips and restrained stone balls are visible in the Casino's own photographs.
 const outerCorners=[[-12.98,-13.05],[14.38,-12.60],[13.82,13.40],[-13.25,13.1]];
 for(const[x,z]of outerCorners){boxF(b,key('casino-main-machones','edificio','brick'),x,F+4.3,z,.80,8.6,.80);boxF(b,key('casino-main-remates','edificio','trim'),x,T+.07,z,.96,.21,.96);const g=new THREE.SphereGeometry(.26,12,8),q=at(x,T+.45,z);rb.geom(key('casino-main-bolas','edificio','trim'),g,new THREE.Matrix4().makeTranslation(...q));g.dispose();}

 // Courtyard: documented asymmetry below, arcaded galleries on all four sides above.
 const nearest=(x,z)=>court.reduce((best,q)=>Math.hypot(f.local(q).x-x,f.local(q).z-z)<Math.hypot(f.local(best).x-x,f.local(best).z-z)?q:best,court[0]);
 const cp=[nearest(-5,-5),nearest(5,-5),nearest(5,5),nearest(-5,5)];
 const galleryOuter=rectPoly(f,-7.35,-7.4,7.45,7.25),courtPeriod='patio';
 for(let side=0;side<4;side++){
  const a=cp[side],c=cp[(side+1)%4],fw=frameMatrix(a,c,.34),holes=[],north=side===0,east=side===1,n=north?1:3,w=north?3.05:(fw.l-1.8)/3,h=north?3.85:east?3.55:3.55;
  for(let j=0;j<n;j++){
   const cx=(j-(n-1)/2)*(fw.l/n),hole=north||east?arch(cx,F-.025,w,h,20):rectangle(cx-w/2,F-.025,cx+w/2,F+h);
   holes.push(hole);openingRecord('door','casino-patio-paso-'+side+'-'+j,fw,cx,F-.025,w,h,{floor:0,external:false,courtyard:true});
   if(north||east){const tm=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,-.10));wall(b,key('patio-arcos','patio','trim'),arch(cx,F-.16,w+.30,h+.30,24),[hole],.12,tm);}else trimOpening(b,fw,cx,F-.025,w,h,{round:false,period:'patio',component:'patio-dinteles',depth:.13});
  }
  wall(b,key('patio-muros','patio','plaster'),rectangle(-fw.l/2,F-.10,fw.l/2,U-.12),holes,.34,fw.m);
  // Ceramic dado stops at the apertures; it never fills an actual doorway.
  dado(b,'patio-azulejos','patio',fw,F,1.10,holes);
  const uppers=[],upperCount=4,uw=(fw.l-1.8)/upperCount;
  for(let j=0;j<upperCount;j++){
   const cx=(j-(upperCount-1)/2)*fw.l/upperCount,y=U+1.0,hh=2.35,outline=lowArch(cx,y,uw,hh,.52);
   uppers.push(outline);openingRecord('window','casino-galeria-hueco-'+side+'-'+j,fw,cx,y,uw,hh,{floor:1,external:false,courtyard:true,unglazed:true});
   trimOpening(ub,fw,cx,y,uw,hh,{rise:.52,period:'patio',component:'galeria-arcos',material:'trim'});
   const spring=y+hh-.52;for(const x of[cx-uw/2-.07,cx+uw/2+.07]){const q=new THREE.Vector3(x,spring,-.075).applyMatrix4(fw.m);ub.box(key('galeria-impostas','patio','trim'),q.x,q.y,q.z,.26,.13,.51,-Math.atan2(fw.uz,fw.ux));}
  }
  wall(ub,key('galeria-muros','patio','plaster'),rectangle(-fw.l/2,U-.05,fw.l/2,T-.06),uppers,.34,fw.m);
  const ledge=new THREE.Vector3(0,U+.98,-.035).applyMatrix4(fw.m);ub.box(key('galeria-antepechos','patio','trim'),ledge.x,ledge.y,ledge.z,fw.l,.13,.48,-Math.atan2(fw.uz,fw.ux));
  const cornice=new THREE.Vector3(0,U-.08,-.08).applyMatrix4(fw.m);b.box(key('patio-impostas','patio','trim'),cornice.x,cornice.y,cornice.z,fw.l+.06,.20,.51,-Math.atan2(fw.uz,fw.ux));
 }
 addComponent('patio-central','Patio central · lectura a cielo abierto','patio',court,'courtyard',{floors:[0,1],openToSky:true,roofInterpretation:'The roof is deliberately omitted to read the courtyard; no completed 2026 glass roof is claimed.'});
 addComponent('patio-galerias','Galerías del patio','patio',galleryOuter,'gallery',{floors:[0,1],holes:[court.map(ll)],hiddenWhenSection:false});
 // Geometric paving and borders reference the documented ceramic and tiled interiors.
 const carpet=rectPoly(f,-4.65,-4.65,4.62,4.53);slab(b,key('patio-pavimento','patio','floor'),carpet,F+.012);
 for(const s of[-1,1]){boxF(b,key('patio-cenefas','patio','blue'),s*4.37,F+.018,-.06,.09,.025,8.91);boxF(b,key('patio-cenefas','patio','blue'),-.01,F+.018,s*4.37,8.85,.025,.09);}
 for(const s of[-1,1])for(const t of[-1,1])boxF(b,key('patio-rosetas','patio','ceramic'),s*3.8,F+.031,t*3.8,.55,.035,.55);

 // Room bands follow the documented functions, without claiming a surveyed partition layout.
 function partition(id,label,x0,z0,x1,z1,level,{openings=[0],width=1.25,period='vida-social',dado=true}={}){
  const fw=frameMatrix(pt(x0,z0),pt(x1,z1),.20),y=level?U:F,top=level?T-.15:U-.17,batch=level?ub:b,holes=openings.map(cx=>rectangle(cx-width/2,y-.035,cx+width/2,y+2.75));
  wall(batch,key(id+'-muros',period,'plaster'),rectangle(-fw.l/2,y-.045,fw.l/2,top),holes,.20,fw.m);
  if(dado){let spans=[[-fw.l/2,fw.l/2]];for(const cx of openings)spans=spans.flatMap(([l,r])=>cx+width/2<=l||cx-width/2>=r?[[l,r]]:[[l,Math.min(r,cx-width/2)],[Math.max(l,cx+width/2),r]].filter(([a,c])=>c-a>.015));for(const[l,r]of spans)for(const offset of[-.035,.205]){const m=fw.m.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,offset));wall(batch,key(id+'-azulejos',period,'ceramic'),rectangle(l,y,r,y+1.15),[],.025,m);wall(batch,key(id+'-cenefa',period,'blue'),rectangle(l,y+1.15,r,y+1.20),[],.03,m);}}
  for(const cx of openings){openingRecord('door',id+'-paso-'+cx+'-'+level,fw,cx,y-.035,width,2.75,{floor:level,external:false});trimOpening(batch,fw,cx,y-.035,width,2.75,{round:false,period,component:id+'-jambas',material:'wood'});}
  const coordinates=[pt(x0,z0),pt(x1,z1)].map(ll);partitions.push({id,label,buildingId,floor:level,floors:[level],coordinates,interpretive:true});return fw;
 }
 partition('salon','Salón y bar del ala este',7.45,-7.4,7.45,7.25,0,{openings:[-3.1,3.0],width:1.55});
 partition('biblioteca','Biblioteca y lectura del ala oeste',-7.35,7.25,-7.35,-7.4,0,{openings:[0],width:1.5});
 partition('servicio','Barra y dependencias del ala sur',-7.35,7.25,7.45,7.25,0,{openings:[-3.5,3.4],width:1.45});
 partition('cocina','Área de servicio',5.25,7.25,5.25,13.15,0,{openings:[0],width:1.25});
 for(const item of[
  ['salas-este','Dependencias del ala este',8.1,-12.4,8.1,12.8,[-8,-1,5]],
  ['salas-oeste','Dependencias del ala oeste',-7.35,12.6,-7.35,-6.2,[-7,1,7]],
  ['salas-norte','Dependencias del ala norte',-7.3,-7.4,7.45,-7.4,[-3.8,3.4]],
  ['salas-sur','Dependencias del ala sur',-7.35,7.25,7.45,7.25,[-3.6,3.4]]
 ])partition(item[0],item[1],item[2],item[3],item[4],item[5],1,{openings:item[6],dado:false,period:'edificio'});
 partition('cuarto-alto-este','Partición esquemática superior',7.45,-6.7,14.1,-6.7,1,{openings:[],dado:false,period:'edificio'});
 const rooms=[['vestibulo','Vestíbulo y acceso','edificio',[-6.8,-12.45,7.4,-5.25],[0]],['salon','Salón y bar · ala este','vida-social',[7.55,-7.2,13.9,7.1],[0]],['biblioteca','Biblioteca y lectura · ala oeste','vida-social',[-12.65,-6.8,-7.5,7.0],[0]],['barra','Barra y servicio · ala sur','vida-social',[-7.2,7.4,13.1,12.6],[0]],['salas-altas','Dependencias superiores','edificio',[7.6,-12.3,13.9,-6.9],[1]]];
 for(const[id,label,period,r,floors]of rooms)addComponent(id,label,period,rectPoly(f,...r),'room',{floors,hiddenWhenSection:floors[0]===1});

 // Representative furniture is subordinate to the architecture and explicitly interpretive.
 function cafeTable(x,z,{upperLevel=false}={}){const batch=upperLevel?ub:b,y=upperLevel?U:F,k=key('salon-mesas','vida-social','trim');boxF(batch,k,x,y+.76,z,.86,.065,.86);boxF(batch,key('salon-mesas','vida-social','iron'),x,y+.37,z,.10,.74,.10);for(const a of[-1,1])for(const c of[-1,1])batch.beam(key('salon-mesas','vida-social','iron'),at(x,y+.12,z),at(x+a*.31,y+.025,z+c*.31),.045,.045);}
 function chair(x,z,yaw=0,{batch=b,y=F,id='salon-sillas'}={}){
  const ca=Math.cos(yaw),sa=Math.sin(yaw),q=(a,yy,c)=>at(x+a*ca-c*sa,yy,z+a*sa+c*ca),k=key(id,'vida-social','burgundy'),ik=key(id,'vida-social','iron');
  const m=new THREE.Matrix4().compose(new THREE.Vector3(...q(0,y+.47,0)),new THREE.Quaternion().setFromAxisAngle(UP,f.yaw-yaw),new THREE.Vector3(.46,.07,.45));batch.geom(k,batch.cube,m);
  batch.beam(k,q(-.22,y+.52,.20),q(-.22,y+.92,.23),.055,.055);batch.beam(k,q(.22,y+.52,.20),q(.22,y+.92,.23),.055,.055);batch.beam(k,q(-.22,y+.79,.23),q(.22,y+.79,.23),.20,.055);
  for(const a of[-1,1])for(const c of[-1,1])batch.beam(ik,q(a*.18,y+.45,c*.17),q(a*.22,y+.025,c*.22),.035,.035);
 }
 for(const z of[-5.1,1.7,5.3]){cafeTable(12.35,z);chair(12.35,z-.82,PI);chair(12.35,z+.82,0);}cafeTable(9.05,5.3);chair(9.05,6.1,0);
 // The bar's blue-white-ochre dado and carved timber screen are visible in the association's photographs.
 boxF(b,key('barra-cuerpo','vida-social','wood'),.5,F+.55,10.8,5.0,1.1,.83);boxF(b,key('barra-encimera','vida-social','marble'),.5,F+1.13,10.8,5.25,.10,1.0);
 for(const x of[-1.6,-.2,1.2,2.6])boxF(b,key('barra-paneles','vida-social','green'),x,F+.58,10.36,1.1,.72,.035);
 for(const z of[-6.65,6.65]){
  boxF(b,key('salon-celosia','vida-social','wood'),10.65,F+3.45,z,6.20,.58,.13);
  for(let i=0;i<18;i++){const x=7.75+i*.34;b.beam(key('salon-celosia','vida-social','trim'),at(x,F+3.24,z-.08),at(x+.22,F+3.55,z-.08),.023,.025);b.beam(key('salon-celosia','vida-social','trim'),at(x+.22,F+3.24,z-.08),at(x,F+3.55,z-.08),.023,.025);}
 }
 for(const z of[-4.6,-1.1,2.4]){
  boxF(b,key('biblioteca-estanterias','vida-social','wood'),-12.42,F+1.2,z,.43,2.4,2.65);
  for(let shelf=0;shelf<5;shelf++){const sy=F+.23+shelf*.44;boxF(b,key('biblioteca-estantes','vida-social','wood'),-12.15,sy,z,.45,.055,2.55);for(let j=0;j<13;j++){const tint=.72+noise(j+31*shelf+z)*.28;boxF(b,key('biblioteca-libros','vida-social',j%3===0?'ochre':j%3===1?'green':'burgundy'),-12.08,sy+.20,z-1.15+j*.18,.27,.29+noise(j+z)*.08,.11, tint);}}
 }
 boxF(b,key('biblioteca-mesa','vida-social','wood'),-10.05,F+.77,-3.5,1.75,.09,2.5);for(const x of[-10.75,-9.35])for(const z of[-4.5,-2.5])boxF(b,key('biblioteca-mesa','vida-social','wood'),x,F+.38,z,.07,.76,.07);
 chair(-8.75,-3.2,PI/2,{id:'biblioteca-sillas'});chair(-11.4,-3.2,-PI/2,{id:'biblioteca-sillas'});
 boxF(b,key('biblioteca-lectura','vida-social','paper'),-10,F+.83,-3.6,.48,.035,.36);
 boxF(ub,key('salas-altas-mesa','edificio','wood'),10.6,U+.76,-11.3,1.8,.09,.8);for(const x of[9.85,11.35])for(const z of[-11.6,-11.0])boxF(ub,key('salas-altas-mesa','edificio','wood'),x,U+.37,z,.065,.74,.065);
 chair(10.6,-10.4,0,{batch:ub,y:U,id:'salas-altas-silla'});
 // Ceiling beams under the gallery and rooms; the closed view retains an actual ceiling.
 for(let z=-11.5;z<=12;z+=1.8){boxF(ub,key('casino-main-viguetas','edificio','trim'),10.7,U-.23,z,6.4,.12,.09);boxF(ub,key('casino-main-viguetas','edificio','trim'),-10.1,U-.23,z,5.6,.12,.09);}

 // Proportional two-flight stair in the documented entrance/stair wing, with a real slab opening.
 const stairs=[],stepCount=12,rise=(U-F)/2/stepCount,run=3.7/stepCount;
 for(let flight=0;flight<2;flight++)for(let i=0;i<stepCount;i++){
  const x=flight?-8.85:-11.05,z=flight?-7.8-(i+.5)*run:-11.5+(i+.5)*run,y=F+(flight*stepCount+i+1)*rise;
  boxF(ub,key('escalera-peldanos','edificio','stone'),x,y-.085,z,1.50,.17,run+.012);
  const a=pt(x-.75,z+run/2),c=pt(x+.75,z+run/2);stairs.push([ll(a),ll(c)]);
 }
 solid(ub,key('escalera-descansillo','edificio','stone'),rectPoly(f,-11.8,-7.8,-8.1,-6.55),F+(U-F)/2,F+(U-F)/2-.18);
 solid(ub,key('escalera-llegada','edificio','stone'),rectPoly(f,-9.6,-12.10,-8.1,-11.5),U,U-.18);
 for(const flight of[0,1])for(const side of[-1,1]){
  const x=(flight?-8.85:-11.05)+side*.74,z0=flight?-7.8:-11.5,z1=flight?-11.5:-7.8,y0=F+flight*(U-F)/2,y1=y0+(U-F)/2;
  // Stair and all dependent rails belong to the removable upper group.
  ub.beam(key('escalera-pasamanos','edificio','wood'),at(x,y0+1.0,z0),at(x,y1+1.0,z1),.075,.075);
  for(let j=0;j<=12;j++){const t=j/12,q=at(x,y0+t*(y1-y0),z0+t*(z1-z0));ub.box(key('escalera-barandillas','edificio','wood'),q[0],q[1]+.46,q[2],.055,.92,.055);}
  for(const t of[0,1]){const q=at(x,y0+t*(y1-y0),z0+t*(z1-z0));ub.box(key('escalera-postes','edificio','wood'),q[0],q[1]+.53,q[2],.13,1.06,.13);}
 }
 boxF(b,key('escalera-zocalo','edificio','burgundy'),-12.65,F+.48,-9.25,.035,.96,5.9);
 rail(ub,f,-11.8,-6.55,-8.1,-6.55,F+(U-F)/2,'edificio','escalera');
 addComponent('escalera','Escalera de comunicación entre niveles','edificio',stairHole,'stairs',{floors:[0,1],segments:stairs,hiddenWhenSection:true,interiorSurvey:false});
 stairData.push({id:'escalera',buildingId,footprint:stairHole.map(ll),floors:[0,1],baseY:originY+F,upperY:originY+U,steps:24,segments:stairs,interpretive:true});

 // Four tiled roof wings drain toward the court and the exterior; the centre stays open.
 const outer=[pt(-f.w/2,-f.d/2),pt(f.w/2,-f.d/2),pt(f.w/2,f.d/2),pt(-f.w/2,f.d/2)],ridge=outer.map((q,i)=>({x:(q.x+cp[i].x)/2,z:(q.z+cp[i].z)/2})),roofY=T+.11,ridgeY=T+1.42;
 const pv=(q,y)=>[q.x,y,q.z];
 for(let i=0;i<4;i++){
  const j=(i+1)%4,k=key('casino-main-tejas','edificio','roof'),pos=[];
  quad(pos,pv(outer[i],roofY),pv(outer[j],roofY),pv(ridge[j],ridgeY),pv(ridge[i],ridgeY));quad(pos,pv(ridge[i],ridgeY),pv(ridge[j],ridgeY),pv(cp[j],roofY),pv(cp[i],roofY));rb.raw(k,pos,.95+noise(i)*.08);
  rb.beam(key('casino-main-cumbreras','edificio','roof'),pv(ridge[i],ridgeY+.08),pv(ridge[j],ridgeY+.08),.18,.18);
  for(const end of[outer[i],cp[i]])rb.beam(key('casino-main-limatesas','edificio','roof'),pv(end,roofY+.06),pv(ridge[i],ridgeY+.06),.14,.14);
  roofInfo.push({id:'ala-cubierta-'+i,coordinates:[outer[i],outer[j],cp[j],cp[i]].map(ll),eaves:originY+roofY,ridge:originY+ridgeY});
 }
 // Small cadastral side projection: restrained low-pitched cover, separately legible.
 const ap=[p[0],p[1],p[2],p[3]],apg=[];quad(apg,pv(ap[0],T+.10),pv(ap[1],T-.30),pv(ap[2],T-.30),pv(ap[3],T+.10));rb.raw(key('casino-anexo-cubierta','edificio','roof'),apg);
 for(const[x,z]of[[-9.8,8.9],[10.4,9.5]]){boxF(rb,key('casino-main-chimeneas','edificio','brick'),x,T+1.35,z,.65,1.4,.65);boxF(rb,key('casino-main-chimeneas','edificio','trim'),x,T+2.06,z,.82,.16,.82);}

 // Terrace and concentric corner stair: 1968 in the Casino's history, 1969 in CONTRAST.
 const sector=(ri,ro)=>{const out=[];for(let i=0;i<=24;i++){const a=-PI/2+i*PI/48;out.push(pt(18.5+Math.cos(a)*ro,-14.7+Math.sin(a)*ro));}if(ri){for(let i=24;i>=0;i--){const a=-PI/2+i*PI/48;out.push(pt(18.5+Math.cos(a)*ri,-14.7+Math.sin(a)*ri));}}else out.push(pt(18.5,-14.7));return out;};
 // One continuous L-shaped contour: outer terrace edge + exact return along the
 // cadastral facade. No overlapping rectangles or superposed coplanar paving.
 const terraceContour=[p[6],pt(-13.25,f.local(p[6]).z),pt(-13.25,-17.2),...sector(0,2.5).slice(0,-1),pt(21,14),pt(13.8,14),p[4],p[3],p[2],p[1],p[0],p[8],p[7]];
 solid(b,key('terraza-basamento','vida-social','stone'),terraceContour,F-.16,ground-.10);
 slab(b,key('terraza-pavimento','vida-social','floor'),terraceContour,F);
 terracePolygons.push(terraceContour);
 const outdoorStairs=[];
 for(let i=1;i<=7;i++){
  const ri=2.5+(7-i)*.34,ro=ri+.34,poly=sector(ri,ro),top=ground+i*(F-ground)/7;solid(b,key('escalinata-concentrica','vida-social','stone'),poly,top,ground-.05);
  const curve=[];for(let j=0;j<=24;j++){const a=-PI/2+j*PI/48;curve.push(ll(pt(18.5+Math.cos(a)*ro,-14.7+Math.sin(a)*ro)));}outdoorStairs.push(curve);
 }
 const stairOutline=sector(2.5,4.88);terracePolygons.push(stairOutline);exclusionPolygons.push(...terracePolygons);
 for(const[x0,z0,x1,z1]of[[-13.25,-17.2,18.5,-17.2],[21,-14.7,21,14],[-13.25,-17.2,-13.25,-13.15]]){
  const dx=Math.abs(x1-x0),dz=Math.abs(z1-z0);boxF(b,key('terraza-pretil','vida-social','plaster'),(x0+x1)/2,F+.43,(z0+z1)/2,dx||.25,.85,dz||.25);boxF(b,key('terraza-albardilla','vida-social','trim'),(x0+x1)/2,F+.88,(z0+z1)/2,dx||.34,.11,dz||.34);
 }
 for(const[x,z]of[[18.5,-17.2],[21,-14.7]]){boxF(b,key('terraza-pilastras','vida-social','plaster'),x,F+.48,z,.45,.96,.45);boxF(b,key('terraza-albardilla','vida-social','trim'),x,F+1.0,z,.53,.12,.53);}
 for(const a of[-PI/2,0]){
  const x0=18.5+Math.cos(a)*2.7,z0=-14.7+Math.sin(a)*2.7,x1=18.5+Math.cos(a)*4.8,z1=-14.7+Math.sin(a)*4.8;
  b.beam(key('escalinata-pasamanos','vida-social','iron'),at(x0,F+.85,z0),at(x1,ground+1.0,z1),.055,.055);for(let i=0;i<6;i++){const t=i/5,q=at(x0+(x1-x0)*t,F+(ground-F)*t+.02,z0+(z1-z0)*t);b.box(key('escalinata-pasamanos','vida-social','iron'),q[0],q[1]+.45,q[2],.035,.9,.035);}
 }
 const terraceDate={constructionYear:1968,constructionYearSource:'Casino Recreativo y Cultural · historia de la entidad',alternativeYear:1969,alternativeYearSource:'CONTRAST · Casa Gerencia / Casino'};
 for(const[i,poly]of terracePolygons.slice(0,-1).entries())addComponent(i?'terraza-'+i:'terraza','Terraza elevada · ampliación de 1968–1969','vida-social',poly,'terrace',{floors:[0],exterior:true,...terraceDate});
 addComponent('escalinata','Escalinata concéntrica · 1968–1969','vida-social',stairOutline,'stairs',{floors:[0],exterior:true,segments:outdoorStairs,...terraceDate});
 stairData.push({id:'escalinata',buildingId,footprint:stairOutline.map(ll),floors:[0],steps:7,segments:outdoorStairs,external:true,...terraceDate,interpretive:true});
 for(const poly of terracePolygons)patches.push({polygon:poly.map(q=>({x:q.x+origin.x,z:q.z+origin.z})),height:originY+ground-.05});

 b.finish(permanent,resources,textures);rb.finish(roof,resources,textures);ub.finish(upper,resources,textures);group.updateMatrixWorld(true);
 const meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});const bounds=new THREE.Box3().setFromObject(group),focuses={},state={sectionOpen:false,readingMode:'realistic',selected:null};
 for(const coordinate of contextData.districtOutline||contextData.gardenOutline||[]){const q=project(...coordinate);bounds.expandByPoint(new THREE.Vector3(q.x,heightAt(q.x,q.z)+7,q.z));}
 function focus(id,label,targetLocal,offset,closeOffset,period,{interiorView=false,floor=null,requiresSection=false,fitBounds=false,components:cs=[],fov=46,openToSky=false}={}){
  const lp=at(...targetLocal),target=new THREE.Vector3(lp[0]+origin.x,lp[1]+originY,lp[2]+origin.z),rotate=q=>[q[0]*f.ux+q[2]*f.vx,q[1],q[0]*f.uz+q[2]*f.vz],full='casino-'+id;
  focuses[full]={id:full,label,target,localTarget:lp,coordinates:geo({x:target.x,z:target.z}),elevation:lp[1],offset:rotate(offset),closeOffset:rotate(closeOffset),regionId:period,readingLayer:period,period,components:cs,interiorView,floor,buildingId,requiresSection,fitBounds,openToSky,bounds:fitBounds?bounds.clone():new THREE.Box3(target.clone().addScalar(-2.2),target.clone().addScalar(2.2)),kind:id==='conjunto'?'overview':'feature',minDistance:interiorView?.3:.7,closeScale:false,fov,sourceConfidence:'cartographic-footprint-photographed-fabric-interpreted-proportions'};
 }
 focus('conjunto','Casino Recreativo y Cultural',[12,F+3,2],[64,58,-62],[44,37,-44],'edificio',{fitBounds:true});
 focus('fachada','La Casa Gerencia de 1921',[4,F+4,-12.9],[13,7,-25],[7,4.5,-17],'edificio',{components:['casino-main-machones','casino-main-marcos']});
 focus('terraza','La terraza de 1968–1969',[18.9,F+1.1,0],[15,5,-8],[10,3.6,-5],'edificio',{components:['terraza-basamento','terraza-pretil']});
 focus('escalinata','Escalinata y acceso desde el jardín',[20.1,F-.25,-16.7],[8,3.5,-10],[6,2.8,-8],'edificio',{components:['escalinata-concentrica']});
 focus('vestibulo','El vestíbulo y el acceso al patio',[0,F+1.55,-8.7],[1.4,.1,-2.6],[.65,.05,-1.9],'edificio',{interiorView:true,floor:0,fov:62,components:['patio-arcos']});
 focus('patio','El patio y sus dos niveles',[0,F+3.5,0],[3.5,-1.6,3.45],[2.3,-1.6,2.6],'patio',{interiorView:true,floor:0,openToSky:true,fov:66,components:['patio-arcos','galeria-arcos','patio-pavimento']});
 focus('galeria','Arcos y circulación de la planta alta',[-1.3,U+1.65,-6.12],[3.9,0,0],[2.6,.02,.10],'patio',{interiorView:true,floor:1,fov:62,components:['galeria-arcos','galeria-antepechos']});
 focus('salon','El salón y el bar del ala este',[10.45,F+1.45,1.3],[0,.2,-3.8],[.6,.2,-2.3],'vida-social',{interiorView:true,floor:0,fov:61,components:['salon-azulejos','salon-celosia','salon-mesas']});
 focus('biblioteca','Biblioteca y lectura',[ -12.0,F+1.35,1.8],[2.2,.3,2.3],[1.5,.25,1.4],'vida-social',{interiorView:true,floor:0,fov:58,components:['biblioteca-estantes','biblioteca-libros']});
 focus('escalera','La comunicación entre plantas',[-11.05,F+1.45,-9.7],[3.65,.35,-2.2],[2.95,.4,-2.0],'patio',{interiorView:true,floor:0,fov:58,components:['escalera-peldanos','escalera-pasamanos']});
 focus('planta-alta','Las dependencias de la planta alta',[10.15,U+1.5,-10.35],[1.4,.15,2.5],[.8,.1,1.9],'vida-social',{interiorView:true,floor:1,fov:57,components:['salas-altas-mesa']});
 focus('cubiertas','Teja, chimeneas y patio',[0,T+.45,0],[25,28,-27],[17,21,-20],'edificio',{components:['casino-main-tejas','casino-main-cumbreras']});
 focus('seccion','Las cuatro alas en sección',[0,F+1.5,0],[27,45,-34],[18,34,-24],'edificio',{requiresSection:true,fov:48});
 function repaint(){for(const m of meshes){const d=m.userData,mat=m.material;mat.color.copy(d.baseColor);mat.map=d.baseMap;mat.bumpMap=d.baseBumpMap;if(state.readingMode==='periods'){mat.color.set(COLORS[d.period]||'#abae9e');mat.map=null;mat.bumpMap=null;}mat.emissive.set((focuses[state.selected]?.components||[]).includes(d.component)?'#a58d61':'#000000');mat.emissiveIntensity=.055;mat.needsUpdate=true;}}
 const setSection=open=>{state.sectionOpen=!!open;roof.visible=!state.sectionOpen;upper.visible=!state.sectionOpen;return state.sectionOpen;},selectFocus=id=>{state.selected=focuses[id]?id:null;repaint();return focuses[state.selected]||null;},setReadingMode=mode=>{state.readingMode=mode==='periods'?'periods':'realistic';repaint();return state.readingMode;};
 const bindGround=sampleWorld=>{if(typeof sampleWorld!=='function')return;for(const q of Object.values(focuses)){if(q.interiorView)continue;for(const field of['offset','closeOffset']){const o=q[field],h=sampleWorld(q.target.x+o[0],q.target.z+o[2]);if(Number.isFinite(h)&&q.target.y+o[1]<h+1.7)o[1]=h+1.7-q.target.y;}}};
 let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;for(const list of Object.values(resources))for(const r of list)r.dispose();};
 const buildings=[{id:buildingId,name:'Casino · Casa Gerencia de 1921',coordinates:p.map(ll),kind:'casino',baseY:originY+F,levels:2,footprintSource:'Catastro INSPIRE',interiorSurvey:false,semibasement:'Documented; represented by the raised stone plinth without an invented interior visit.'}];
 const plan={id:'casino',label:'Casino · patio y cuatro alas',coordinate:record.coordinate,outline:record.footprint,buildings,components,partitions,stairs:stairData,stairSegments:stairs,floors:[{id:0,label:'Planta principal',buildingId,elevation:originY+F},{id:1,label:'Planta alta',buildingId,elevation:originY+U}],openings:{doors,windows},stops:Object.values(focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,localTarget:q.localTarget,elevation:q.elevation,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,buildingId:q.buildingId,interiorView:q.interiorView,requiresSection:q.requiresSection,openToSky:q.openToSky})),note:'Huella y patio catastrales; fachada, arcadas, materiales y funciones contrastados con fotografías y documentación. Tabiques, escalera y mobiliario proporcionales. El patio se presenta abierto para leer su arquitectura: no reproduce una cubierta histórica concreta ni da por ejecutado el vidrio proyectado. Terraza y escalinata: 1968 según la entidad y 1969 según CONTRAST. Último estado municipal consultado: obras en octubre de 2026.'};
 const stats={modelVersion:'v26',meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),structures:1,storeys:2,architecturalFocuses:13,interiorFocuses:Object.values(focuses).filter(q=>q.interiorView).length,physicalWindows:windows.length,physicalDoors:doors.length,terraceYear:1968,terraceYearSource:'Casino · historia de la entidad',terraceAlternativeYear:1969,terraceAlternativeSource:'CONTRAST',courtyardOpen:true,resourcesOwned:true,interpretiveGeometry:true};
 const qa={origin:{...origin,y:originY},frame:f,buildingId,base:F,upperFloor:U,top:T,footprint:p.map(ll),courtyard:court.map(ll),stairHole:stairHole.map(ll),windows,doors,stairs:stairData,roofs:roofInfo,terraces:terracePolygons.map(p=>p.map(ll)),segmentalArchProfile:{width:1.58,height:2.55,rise:.28,points:lowArch(0,0,1.58,2.55,.28)},exactInteriorSurvey:false,section:{removes:'roofs, ceiling skins, upper slab, upper arcades, upper partitions, internal stair and upper furniture',retains:'ground floors, exterior masonry, lower courtyard, ground partitions, terrace and external stairs'},sourceDates:{building:1921,casinoAssociation:1941,terraceAndStair:'1968 (Casino); 1969 (CONTRAST)',works:'2026-10-06'}};
 const visit={focuses,bounds,plan,stats,qa,periods:casinoPeriods,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({...state}),sectionAvailable:true,dispose,metadata:{model:'historical-spatial-interpretation',interiorSurvey:false,interior:'Four wings and uses documented by UV/CONTRAST; elevations, arcade asymmetry, ceramic dado and window shape checked against municipal and association photographs. Partition/stair dimensions and furniture are schematic.',courtyard:'Open for spatial reading. Historic coverings existed and October 2026 photographs show works on a new roof; no completed glazing is claimed.',current:'Not a portrayal of a reopened or completely rehabilitated building. The latest dated municipal evidence used reports works on 6 October 2026.',terrace:'Terrace and concentric external stair dated to summer 1968 by the association history and to 1969 by CONTRAST; the discrepancy remains explicit.'},renderStops:['casino-conjunto','casino-fachada','casino-terraza','casino-patio','casino-galeria','casino-salon','casino-seccion']};
 group.userData={id:'casino',landmarkId:'casino',visit,resources,ownedResources:resources,interpretation:true};setSection(false);repaint();const point=focuses['casino-conjunto'].target.clone(),views={offset:focuses['casino-conjunto'].offset,closeOffset:focuses['casino-conjunto'].closeOffset};
 return{id:'casino',record,group,point,views,view:{target:point.clone(),...views},visit,roof,setSection,dispose,stats,patches,exclusions:exclusionPolygons.map(p=>p.map(q=>({x:q.x+origin.x,z:q.z+origin.z}))),vegetationExclusions:exclusionPolygons.map(p=>p.map(q=>({x:q.x+origin.x,z:q.z+origin.z}))),excludedBuildingIds:[],excludedRoadIds:[]};
}

