import * as THREE from 'three';
import {createGrauVisit} from './grau-visit.js';

// Grau Vell: Catastro / OSM footprints, UPV survey dimensions and the restored
// ensemble documented in 2020–2026. Minor elevations and surface details are interpretation.
const TAU = Math.PI * 2;
const nrand = n => { const x=Math.sin(n*123.127+78.233)*43758.5453;return x-Math.floor(x); };
const identity=new THREE.Matrix4();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const palette={stone:'#f0e6d4',trim:'#d6c4a4',lime:'#eee9d9',ochre:'#ceb68c',salmon:'#a95c48',roof:'#f2c9ae',wood:'#c9ad89',iron:'#34463e',glass:'#7f9c98',floor:'#e1d7c6',leaf:'#506d43',leaflight:'#768153',bark:'#77654f',ashlar:'#ded8c8',mortar:'#b1aa99',brickfloor:'#e8bca0',dark:'#343832',gravel:'#b8b09e',display:'#eee4ca',screen:'#486e76',brick:'#c09b7f',plaster:'#eee9df'};
// Materials and canvases belong to one model instance. Region eviction can never
// leave a second Grau Vell instance referring to a disposed global texture.
function resourcesForInstance(){
 const materials=new Map(),textures=new Map(),geometries=new Set();
 const texture=k=>{if(!textures.has(k))textures.set(k,masonryTexture(k));return textures.get(k);};
 return{materials,textures,geometries,material(k,component){const key=component+'|'+k;if(!materials.has(key)){const map=['stone','ashlar','roof','floor','brickfloor','wood','gravel','brick','plaster'].includes(k)?texture(k):null;const m=new THREE.MeshStandardMaterial({color:palette[k]||'#d8c7a9',roughness:k==='iron'?.6:k==='glass'?.25:.94,metalness:k==='iron'?.33:0,vertexColors:true,side:THREE.DoubleSide,map,bumpMap:map,bumpScale:k==='stone'?.045:k==='roof'?.055:k==='wood'?.012:.018,transparent:k==='glass',opacity:k==='glass'?.22:1,depthWrite:k!=='glass'});materials.set(key,m);}return materials.get(key);}};
}
function masonryTexture(type){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');if(!x)return null;
 x.fillStyle=type==='wood'?'#796247':type==='roof'?'#ad7457':type==='brickfloor'||type==='brick'?'#a77e62':type==='gravel'?'#bbb4a3':'#a89d88';x.fillRect(0,0,512,512);
 if(type==='stone'){
  for(let row=-1;row<9;row++)for(let col=-1;col<9;col++){const seed=row*91+col*29+917,w=58+nrand(seed)*31,h=43+nrand(seed+2)*22,px=col*70+(row%2)*33,py=row*61,r=nrand(seed+3);x.fillStyle=`rgb(${154+r*58},${142+r*58},${121+r*62})`;x.beginPath();x.moveTo(px+5,py+6);x.lineTo(px+w-6,py+2);x.lineTo(px+w,py+h*.5);x.lineTo(px+w-7,py+h-4);x.lineTo(px+7,py+h);x.lineTo(px,py+h*.42);x.closePath();x.fill();x.strokeStyle='rgba(245,231,201,.37)';x.lineWidth=1.5;x.stroke();}
 }else if(type==='wood'){
  for(let i=0;i<260;i++){const t=nrand(i+42);x.strokeStyle=`rgba(${i%2?'35,25,17':'231,203,154'},${.02+t*.16})`;x.lineWidth=.5+t*2;x.beginPath();const xx=nrand(i)*512;x.moveTo(xx,0);for(let y=0;y<=512;y+=32)x.lineTo(xx+Math.sin(y*.013+i)*4,y);x.stroke();}
 }else if(type==='roof'){
  for(let row=-1;row<8;row++)for(let col=-1;col<17;col++){const px=col*33,py=row*74,t=nrand(col*31+row*71+2);const g=x.createLinearGradient(px,0,px+31,0);g.addColorStop(0,'#735344');g.addColorStop(.38,`rgb(${161+t*51},${101+t*39},${73+t*35})`);g.addColorStop(.66,`rgb(${185+t*35},${126+t*27},${88+t*33})`);g.addColorStop(1,'#93654b');x.fillStyle=g;x.fillRect(px+1,py+2,31,72);x.fillStyle='rgba(58,37,24,.25)';x.fillRect(px+1,py+71,31,3);}
 }else if(type==='floor'||type==='plaster'){
  // Restored patio and terraces read as a continuous mineral pavement in the
  // architects' 2020 photographs, not a contrasting chequerboard of tiles.
  x.fillStyle=type==='plaster'?'#d0cbbf':'#c9c3b7';x.fillRect(0,0,512,512);
  for(let i=0;i<180;i++){const px=nrand(i+42)*512,py=nrand(i+831)*512,r=12+nrand(i+101)*72;x.fillStyle=i%2?'rgba(245,237,219,.045)':'rgba(102,92,74,.035)';x.beginPath();x.ellipse(px,py,r,r*(.45+nrand(i+309)*.45),nrand(i+53)*TAU,0,TAU);x.fill();}
 }else if(type==='gravel'){
  for(let i=0;i<8000;i++){const r=nrand(i+7);x.fillStyle=`rgba(${r>.5?'225,213,189':'85,77,61'},${.16+r*.20})`;x.beginPath();x.ellipse(nrand(i)*512,nrand(i+2000)*512,1+r*4,.8+r*2,r*6,0,TAU);x.fill();}
 }else{
  const rows=type==='brick'||type==='brickfloor'?15:7,h=512/rows,w=type==='brick'?100:type==='brickfloor'?83:115;
  for(let row=-1;row<rows+1;row++)for(let col=-1;col<7;col++){const px=col*w+(row%2)*w*.5,t=nrand(row*31+col*73+3);x.fillStyle=type==='brick'||type==='brickfloor'?`rgb(${149+t*43},${104+t*40},${79+t*32})`:`rgb(${166+t*45},${158+t*43},${137+t*46})`;x.fillRect(px+2,row*h+2,w-4,h-4);x.fillStyle='rgba(255,239,205,.2)';x.fillRect(px+3,row*h+3,w-6,1.5);}
 }
 for(let i=0;i<6500;i++){x.fillStyle=i%2?'rgba(36,30,22,.07)':'rgba(255,248,226,.09)';x.fillRect(nrand(i+4)*512,nrand(i+17003)*512,1,1);}
 const t=new THREE.CanvasTexture(c);t.name='Grau Vell · '+type;t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
class Batch {
  constructor(resources){this.resources=resources;this.parts=new Map();const box=new THREE.BoxGeometry(1,1,1);this.boxGeo=box.toNonIndexed();box.dispose();this.meta={component:'general',period:'actual',buildingId:null};}
  set(component,period='actual',extra={}){this.meta={component,period,...extra};return this;}
  geo(kind,g,m=identity,tint=1){
    const n=g.index?g.toNonIndexed():g;if(!n.attributes.normal)n.computeVertexNormals();const key=this.meta.component+'|'+kind;let o=this.parts.get(key);if(!o){o={p:[],n:[],u:[],c:[],kind,meta:{...this.meta}};this.parts.set(key,o);}
    const p=n.attributes.position,nor=n.attributes.normal,v=new THREE.Vector3(),nn=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m),c=typeof tint==='number'?new THREE.Color(tint,tint,tint):new THREE.Color(tint);
    for(let i=0;i<p.count;i++){
      v.fromBufferAttribute(p,i).applyMatrix4(m);nn.fromBufferAttribute(nor,i).applyMatrix3(nm).normalize();o.p.push(v.x,v.y,v.z);o.n.push(nn.x,nn.y,nn.z);
      const ax=Math.abs(nn.x),ay=Math.abs(nn.y),az=Math.abs(nn.z),scale=kind==='roof'?3.8:kind==='stone'?3.2:kind==='wood'?2.3:kind==='brick'?2.7:kind==='floor'?4:4.2;
      o.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/scale,(ay>ax&&ay>az?v.z:v.y)/scale);o.c.push(c.r,c.g,c.b);
    }if(n!==g)n.dispose();
  }
  box(k,x,y,z,w,h,d,yaw=0,c=1){if(w<=0||h<=0||d<=0)return;this.geo(k,this.boxGeo,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(w,h,d)),c);}
  raw(k,p,c=1){if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geo(k,g,identity,c);g.dispose();}
  cylinder(k,x,y,z,rt,rb,h,c=1,segments=12){const g=new THREE.CylinderGeometry(rt,rb,h,segments);this.geo(k,g,new THREE.Matrix4().makeTranslation(x,y,z),c);g.dispose();}
  finish(name){const group=new THREE.Group();group.name=name;for(const[key,b]of this.parts){const k=b.kind,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));pruneDegenerates(g);g.computeBoundingSphere();g.computeBoundingBox();this.resources.geometries.add(g);const mat=this.resources.material(k,b.meta.component),m=new THREE.Mesh(g,mat);m.name=`${name} · ${key}`;m.castShadow=k!=='glass';m.receiveShadow=true;m.userData={...b.meta,kind:k,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap};group.add(m);}this.boxGeo.dispose();return group;}
}
function pruneDegenerates(g){const p=g.attributes.position,keep=[];for(let i=0;i<p.count;i+=3){const ax=p.getX(i+1)-p.getX(i),ay=p.getY(i+1)-p.getY(i),az=p.getZ(i+1)-p.getZ(i),bx=p.getX(i+2)-p.getX(i),by=p.getY(i+2)-p.getY(i),bz=p.getZ(i+2)-p.getZ(i),cx=ay*bz-az*by,cy=az*bx-ax*bz,cz=ax*by-ay*bx;if(cx*cx+cy*cy+cz*cz>1e-14)keep.push(i,i+1,i+2);}if(keep.length===p.count)return;for(const [name,a]of Object.entries(g.attributes)){const out=new Float32Array(keep.length*a.itemSize);for(let i=0;i<keep.length;i++)for(let c=0;c<a.itemSize;c++)out[i*a.itemSize+c]=a.array[keep[i]*a.itemSize+c];g.setAttribute(name,new THREE.BufferAttribute(out,a.itemSize));}}
const quad=(o,a,b,c,d)=>o.push(...a,...b,...c,...a,...c,...d);
function clean(poly,project){const p=poly.map(c=>Array.isArray(c)?project(...c):{x:c.x,z:c.z});if(p.length>2&&Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<.05)p.pop();return p;}
const center=p=>({x:p.reduce((a,b)=>a+b.x,0)/p.length,z:p.reduce((a,b)=>a+b.z,0)/p.length});
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
function polygon(b,k,p,y,c=1){const a=[];const inds=THREE.ShapeUtils.triangulateShape(p.map(v=>new THREE.Vector2(v.x,-v.z)),[]);for(const t of inds){const v=t.map(i=>[p[i].x,typeof y==='function'?y(p[i].x,p[i].z):y,p[i].z]);const cross=(v[1][2]-v[0][2])*(v[2][0]-v[0][0])-(v[1][0]-v[0][0])*(v[2][2]-v[0][2]);if(cross<0)[v[1],v[2]]=[v[2],v[1]];a.push(...v.flat());}b.raw(k,a,c);}
function wall(b,k,a,c,y0,y1,thick=.3,tint=1){const len=Math.hypot(c.x-a.x,c.z-a.z);b.box(k,(a.x+c.x)/2,(y0+y1)/2,(a.z+c.z)/2,len,y1-y0,thick,-Math.atan2(c.z-a.z,c.x-a.x),tint);}
function frame(x,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return {p:(xx,yy,zz)=>[x+xx*c+zz*s,yy,z-xx*s+zz*c],box:(b,k,xx,yy,zz,w,h,d,angle=0,tint=1)=>b.box(k,x+xx*c+zz*s,yy,z-xx*s+zz*c,w,h,d,yaw+angle,tint),world:(xx,zz)=>({x:x+xx*c+zz*s,z:z-xx*s+zz*c})};}
function arch(b,f,{x=0,y=0,z=0,w=2.3,h=3.2,depth=.45,thick=.35,kind='stone',pointed=false,tint=1}={}){
  const r=w/2,spring=h-r*(pointed?1.3:1),count=20;
  f.box(b,kind,x-r-thick/2,y+spring/2,z,thick,spring,depth,0,tint);f.box(b,kind,x+r+thick/2,y+spring/2,z,thick,spring,depth,0,tint);
  const curve=(t,outer=false)=>{const a=Math.PI*t,rr=r+(outer?thick:0),xx=Math.cos(a)*rr;let yy=Math.sin(a)*rr;if(pointed)yy*=1.3;return [x+xx,y+spring+yy];};
  for(let i=0;i<count;i++){const a=curve(i/count),c=curve((i+1)/count),ao=curve(i/count,true),co=curve((i+1)/count,true),p=[];const q=(v,d)=>f.p(v[0],v[1],z+d);
    quad(p,q(a,depth/2),q(c,depth/2),q(co,depth/2),q(ao,depth/2));quad(p,q(c,-depth/2),q(a,-depth/2),q(ao,-depth/2),q(co,-depth/2));quad(p,q(a,-depth/2),q(c,-depth/2),q(c,depth/2),q(a,depth/2));quad(p,q(ao,depth/2),q(co,depth/2),q(co,-depth/2),q(ao,-depth/2));b.raw(kind,p,tint*(.89+nrand(i+13)*.17));
  }
}
function door(b,f,x,y,z,w=1.9,h=2.8,{arched=true,open=false,stone=true}={}){
  if(stone&&arched)arch(b,f,{x,y,z,w,h,depth:.36,thick:.3});
  if(!open){const r=w/2,sh=arched?h-r:h,shape=[];shape.push([x-r,y],[x+r,y],[x+r,y+sh]);if(arched)for(let i=1;i<=16;i++){const a=i*Math.PI/16;shape.push([x+Math.cos(a)*r,y+sh+Math.sin(a)*r]);}else shape.push([x-r,y+h]);const p=[];for(let i=1;i<shape.length-1;i++)p.push(...f.p(shape[0][0],shape[0][1],z-.08),...f.p(shape[i][0],shape[i][1],z-.08),...f.p(shape[i+1][0],shape[i+1][1],z-.08));b.raw('wood',p);
    for(let i=1;i<Math.floor(w/.18);i++){const xx=-w/2+i*.18,top=arched?sh+Math.sqrt(Math.max(0,r*r-xx*xx)):h;f.box(b,'iron',x+xx,y+top/2,z-.025,.018,top,.022,0,.64);}
    for(const xx of [-w*.12,w*.12]){f.box(b,'iron',x+xx,y+1.1,z+.035,.06,.19,.07);}
  }
}
function windowDetail(b,f,x,y,z,w=1,h=1.7,{balcony=false,shutters=false,bars=false}={}){
  f.box(b,'trim',x,y,z,w+.22,h+.22,.14);f.box(b,'wood',x,y,z+.08,w,h,.13);f.box(b,'glass',x,y,z+.16,w-.16,h-.15,.05);
  f.box(b,'wood',x,y,z+.20,.065,h,.05);f.box(b,'wood',x,y+.03,z+.20,w,.06,.05);f.box(b,'trim',x,y-h/2-.10,z+.12,w+.36,.15,.35);
  if(shutters)for(const s of [-1,1]){f.box(b,'wood',x+s*(w*.73),y,z+.14,w*.42,h,.10,0,.86);for(let j=0;j<Math.floor(h/.17);j++)f.box(b,'iron',x+s*w*.73,y-h/2+.11+j*.17,z+.205,w*.36,.025,.025,0,.7);}
  if(balcony){f.box(b,'trim',x,y-h/2-.16,z+.35,w+.6,.18,.88);for(let i=0;i<Math.ceil((w+.42)/.19);i++)f.box(b,'iron',x-(w+.42)/2+i*.19,y-h/2+.38,z+.78,.026,1.05,.026);f.box(b,'iron',x,y-h/2+.88,z+.78,w+.52,.045,.045);for(const s of [-1,1]){f.box(b,'iron',x+s*(w+.5)/2,y-h/2+.4,z+.4,.035,1,.73);}}
  if(bars){for(let i=0;i<=Math.floor(w/.19);i++)f.box(b,'iron',x-w/2+i*.19,y,z+.3,.028,h,.03);for(const yy of [-h*.3,h*.3])f.box(b,'iron',x,y+yy,z+.3,w,.035,.03);}
}
function lantern(b,f,x,y,z){f.box(b,'iron',x,y+.35,z-.18,.055,.55,.055);f.box(b,'iron',x,y+.62,z,.06,.06,.42);f.box(b,'trim',x,y,z+.07,.27,.42,.27,0,.95);for(const xx of [-.15,.15])for(const zz of [-.08,.22])f.box(b,'iron',x+xx,y,z+zz,.035,.5,.035);f.box(b,'iron',x,y+.26,z+.07,.38,.07,.36);f.box(b,'iron',x,y-.27,z+.07,.3,.06,.3);}
function planter(b,x,y,z,size=1){b.cylinder('iron',x,y+.45*size,z,.56*size,.49*size,.9*size,.85,12);b.cylinder('wood',x,y+1.35*size,z,.07*size,.1*size,1.2*size);for(let i=0;i<3;i++){const g=new THREE.IcosahedronGeometry(.76*size,1);const m=new THREE.Matrix4().compose(new THREE.Vector3(x+(nrand(i+4)-.5)*.4*size,y+(1.8+i*.24)*size,z+(nrand(i+7)-.5)*.4*size),new THREE.Quaternion(),new THREE.Vector3(1,1,1));b.geo('leaf',g,m,.88+nrand(i)*.18);g.dispose();}}
function tiledRoof(b,f,cx,cz,y,w,d,rise=1.2){const p=[];quad(p,f.p(cx-w/2,y,cz-d/2),f.p(cx-w/2,y,cz+d/2),f.p(cx,y+rise,cz+d/2),f.p(cx,y+rise,cz-d/2));quad(p,f.p(cx,y+rise,cz-d/2),f.p(cx,y+rise,cz+d/2),f.p(cx+w/2,y,cz+d/2),f.p(cx+w/2,y,cz-d/2));b.raw('roof',p);for(const s of [-1,1]){const g=[];g.push(...f.p(cx-w/2,y,cz+s*d/2),...f.p(cx+w/2,y,cz+s*d/2),...f.p(cx,y+rise,cz+s*d/2));b.raw('lime',g);}
  for(let z=-d/2;z<=d/2;z+=.35)f.box(b,'roof',cx,y+rise+.04,cz+z,.22,.13,.36,0,.95);for(const s of [-1,1])f.box(b,'wood',cx+s*w/2,y-.08,cz,.14,.18,d,0,.88);
}
function crest(b,f,x,y,z,w=.6){const shape=new THREE.Shape();shape.moveTo(-w/2,w*.58);shape.lineTo(w/2,w*.58);shape.lineTo(w*.43,-w*.12);shape.lineTo(0,-w*.58);shape.lineTo(-w*.43,-w*.12);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:false});const yaw=Math.atan2(f.world(0,1).x-f.world(0,0).x,f.world(0,1).z-f.world(0,0).z);const pos=f.p(x,y,z),m=new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(1,1,1));b.geo('trim',g,m);g.dispose();for(let i=-1.5;i<=1.5;i++)f.box(b,'stone',x+i*w*.16,y,z+.13,w*.07,w*.55,.045,0,.77);}

function beam(b,k,a,c,width=.08,tint=1){const v=new THREE.Vector3(...a),u=new THREE.Vector3(...c),d=u.clone().sub(v),m=new THREE.Matrix4().compose(v.add(u).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()),new THREE.Vector3(width,d.length(),width));b.geo(k,b.boxGeo,m,tint);}
function shape2D(b,k,f,poly,z,tint=1){const contour=poly.map(p=>new THREE.Vector2(...p)),out=[];for(const tri of THREE.ShapeUtils.triangulateShape(contour,[]))for(const i of tri)out.push(...f.p(poly[i][0],poly[i][1],z));b.raw(k,out,tint);}
function oriented(p){const c=center(p),es=p.map((a,i)=>({a,q:p[(i+1)%p.length],len:Math.hypot(p[(i+1)%p.length].x-a.x,p[(i+1)%p.length].z-a.z)})).sort((a,b)=>b.len-a.len),e=es[0],yaw=-Math.atan2(e.q.z-e.a.z,e.q.x-e.a.x),cc=Math.cos(yaw),ss=Math.sin(yaw),local=p.map(v=>({x:(v.x-c.x)*cc-(v.z-c.z)*ss,z:(v.x-c.x)*ss+(v.z-c.z)*cc}));const minX=Math.min(...local.map(v=>v.x)),maxX=Math.max(...local.map(v=>v.x)),minZ=Math.min(...local.map(v=>v.z)),maxZ=Math.max(...local.map(v=>v.z));const ox=(minX+maxX)/2,oz=(minZ+maxZ)/2;return {f:frame(c.x+ox*cc+oz*ss,c.z-ox*ss+oz*cc,yaw),yaw,w:maxX-minX,d:maxZ-minZ,c:{x:c.x+ox*cc+oz*ss,z:c.z-ox*ss+oz*cc}};}
function hipRoof(b,f,y,w,d,rise=2){const rr=Math.max(0,w/2-d*.35),a=f.p(-w/2,y,-d/2),c=f.p(w/2,y,-d/2),e=f.p(w/2,y,d/2),g=f.p(-w/2,y,d/2),l=f.p(-rr,y+rise,0),r=f.p(rr,y+rise,0),out=[];quad(out,a,c,r,l);quad(out,g,l,r,e);out.push(...a,...l,...g,...c,...e,...r);b.raw('roof',out);f.box(b,'roof',0,y+rise+.04,0,rr*2+.1,.15,.2);for(const z of [-d/2,d/2])f.box(b,'wood',0,y-.08,z,w+.15,.18,.16);for(const x of [-w/2,w/2])f.box(b,'wood',x,y-.08,0,.16,.18,d);for(const z of [-d/2,d/2])for(let x=-w/2+.3;x<w/2;x+=.36){beam(b,'roof',f.p(x,y+.025,z),f.p(clamp(x,-rr,rr),y+rise+.025,0),.035,.91);}}
function inside(p,x,z){let a=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i].z>z)!==(p[j].z>z)&&x<(p[j].x-p[i].x)*(z-p[i].z)/(p[j].z-p[i].z)+p[i].x)a=!a;return a;}
function distanceSegment(p,a,c){const dx=c.x-a.x,dz=c.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function pine(b,x,y,z,size=1,seed=1){b.cylinder('bark',x,y+2.6*size,z,.12*size,.25*size,5.2*size,.85,9);for(let i=0;i<3;i++){const a=i*2.1+seed,dx=Math.cos(a)*1.2*size,dz=Math.sin(a)*1.2*size;beam(b,'bark',[x,y+3.0*size,z],[x+dx,y+5.2*size,z+dz],.13*size);const g=new THREE.IcosahedronGeometry(1,1);b.geo(i%2?'leaf':'leaflight',g,new THREE.Matrix4().compose(new THREE.Vector3(x+dx,y+(5.4+i*.15)*size,z+dz),new THREE.Quaternion(),new THREE.Vector3(2.3*size,1.8*size,2.1*size)),.83+nrand(seed+i)*.18);g.dispose();}}
function palm(b,x,y,z,size=1,seed=0){
 b.cylinder('bark',x,y+3.3*size,z,.14*size,.29*size,6.6*size,.95,10);for(let h=.35;h<6.6;h+=.24)b.cylinder('wood',x,y+h*size,z,.2*size,.22*size,.045*size,.8,10);
 for(let i=0;i<11;i++){const angle=i*TAU/11+seed,dx=Math.cos(angle),dz=Math.sin(angle),p=t=>[x+dx*3.4*t*size,y+(6.55+1.55*Math.sin(Math.PI*t)-1.05*t*t)*size,z+dz*3.4*t*size];for(let j=0;j<10;j++){const t=j/10,t2=(j+1)/10,a=p(t),c=p(t2);beam(b,'leaf',a,c,.035*size);if(j===0)continue;for(const side of [-1,1]){const span=(.16+.60*Math.sin(Math.PI*t))*size,m=p(t+.04),tip=[m[0]-dz*side*span+dx*.17*size,m[1]-.13*size,m[2]+dx*side*span+dz*.17*size],arr=[];quad(arr,a,[m[0]-dz*side*span*.55,m[1]+.025*size,m[2]+dx*side*span*.55],tip,c);b.raw(i%3?'leaf':'leaflight',arr,.86+nrand(i)*.17);}}}
}
function bench(b,f,x,y,z,w=2){f.box(b,'wood',x,y+.46,z,w,.09,.53);f.box(b,'wood',x,y+.83,z-.23,w,.45,.07);for(const s of [-1,1]){f.box(b,'iron',x+s*w*.36,y+.24,z,.065,.48,.44);f.box(b,'iron',x+s*w*.36,y+.68,z-.23,.065,.89,.065);}}
function lamp(b,x,y,z,size=1){b.cylinder('iron',x,y+1.9*size,z,.04*size,.065*size,3.8*size,1,8);b.box('iron',x,y+.13*size,z,.18*size,.26*size,.18*size);b.box('trim',x,y+3.9*size,z,.29*size,.44*size,.29*size);b.box('iron',x,y+4.15*size,z,.39*size,.08*size,.39*size);}
function ribbon(b,p,width,heightAt){for(let i=1;i<p.length;i++){const a=p[i-1],c=p[i],len=Math.hypot(c.x-a.x,c.z-a.z),nx=-(c.z-a.z)/len,nz=(c.x-a.x)/len;for(let t=0;t<len;t+=2.5){const e=Math.min(len,t+2.5),at=(d,n)=>{const x=a.x+(c.x-a.x)*d/len+nx*n,z=a.z+(c.z-a.z)*d/len+nz*n;return[x,heightAt(x,z)+.095,z]};const q=[];quad(q,at(t,width/2),at(e,width/2),at(e,-width/2),at(t,-width/2));b.raw('floor',q,.94);for(const sign of [-1,1])beam(b,'stone',at(t,sign*width/2),at(e,sign*width/2),.11,.9);}}}
function stair(b,f,x,z,base,width,height,depth,steps){for(let i=0;i<steps;i++)f.box(b,'stone',x,base+height*(i+1)/(2*steps),z-depth*(i+.5)/steps,width,height*(i+1)/steps,depth/steps+.025,0,1.02);}
function rail(b,f,x,z,y,w,dir=0){const p=f.world(x,z),ff=frame(p.x,p.z,Math.atan2(f.world(0,1).x-f.world(0,0).x,f.world(0,1).z-f.world(0,0).z)+dir);ff.box(b,'iron',0,y+.98,0,w,.055,.06);ff.box(b,'iron',0,y+.2,0,w,.04,.05);for(let a=-w/2;a<=w/2;a+=.2)ff.box(b,'iron',a,y+.58,0,.025,.82,.025);}
function baseLevel(p,heightAt){return p.map(v=>heightAt(v.x,v.z)).sort((a,b)=>a-b)[Math.floor(p.length/2)]+.07;}

function pointFromFrame(f,p){const o=f.world(0,0),ex=f.world(1,0),ez=f.world(0,1);return{x:(p.x-o.x)*(ex.x-o.x)+(p.z-o.z)*(ex.z-o.z),z:(p.x-o.x)*(ez.x-o.x)+(p.z-o.z)*(ez.z-o.z)};}
function faceFrame(a,c,p){let yaw=-Math.atan2(c.z-a.z,c.x-a.x);if(area(p)>0)yaw+=Math.PI;return frame((a.x+c.x)*.5,(a.z+c.z)*.5,yaw);}
function blockPrism(b,k,p,y0,y1,tint=1){polygon(b,k,p,y1,tint);for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],q=[];quad(q,[a.x,y0,a.z],[c.x,y0,c.z],[c.x,y1,c.z],[a.x,y1,a.z]);b.raw(k,q,tint);}}
function panelWithVoids(b,k,f,length,bottom,top,thick,openings=[],tint=1){
 const lo=-length/2,hi=length/2,cut=[lo,hi];for(const o of openings){cut.push(clamp(o.x-o.w/2,lo,hi),clamp(o.x+o.w/2,lo,hi));}cut.sort((a,c)=>a-c);
 for(let i=1;i<cut.length;i++){const x=(cut[i]+cut[i-1])/2,w=cut[i]-cut[i-1];if(w<.025)continue;const holes=openings.filter(o=>x>o.x-o.w/2&&x<o.x+o.w/2&&o.y<top&&o.y+o.h>bottom).sort((a,c)=>a.y-c.y);let at=bottom;for(const o of holes){const low=Math.max(bottom,o.y),high=Math.min(top,o.y+o.h);if(low>at)f.box(b,k,x,(at+low)/2,0,w,low-at,thick,0,tint);at=Math.max(at,high);}if(at<top)f.box(b,k,x,(at+top)/2,0,w,top-at,thick,0,tint);}
}
function openingTrim(b,f,o,depth=.38){for(const sign of[-1,1])f.box(b,'trim',o.x+sign*(o.w/2+.13),o.y+o.h/2,depth,.22,o.h+.13,.18);f.box(b,'trim',o.x,o.y+o.h+.12,depth,o.w+.47,.24,.23);f.box(b,'trim',o.x,o.y-.07,depth,o.w+.35,.15,.22);}
function jointCourses(b,k,a,c,y0,y1,thickness=.045,seed=0,size=.52){
 const len=Math.hypot(c.x-a.x,c.z-a.z),yaw=-Math.atan2(c.z-a.z,c.x-a.x),f=frame((a.x+c.x)*.5,(a.z+c.z)*.5,yaw);
 for(let row=0;row*size<y1-y0;row++){const h=Math.min(size-.035,y1-y0-row*size),step=.74+nrand(seed+row)*.42,shift=(row%2)*step*.47;for(let x=-len/2+shift;x<len/2;x+=step){const l=Math.max(-len/2,x),r=Math.min(len/2,x+step-.035);if(r-l<.06)continue;f.box(b,k,(l+r)/2,y0+row*size+h/2,0,r-l,h,thickness,0,.77+nrand(seed*73+row*109+Math.floor(x*13))* .30);}}
}
function roofOverFootprint(r,b,p,y,{kind='gable',rise=1.2,seed=1}={}){
 const ob=oriented(p),f=ob.f,local=p.map(a=>pointFromFrame(f,a));
 if(kind==='terrace'){polygon(r,'floor',p,y+.05,.98);for(let i=0;i<p.length;i++)wall(b,'lime',p[i],p[(i+1)%p.length],y,y+.24,.2);return;}
 const clip=(poly,side)=>{const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],c=poly[(i+1)%poly.length],aa=a.z*side>=-1e-8,cc=c.z*side>=-1e-8;if(aa)result.push(a);if(aa!==cc){const t=-a.z/(c.z-a.z);result.push({x:a.x+(c.x-a.x)*t,z:0});}}return result;};
 const height=v=>kind==='shed'?y+rise*(v.z/ob.d+.5):y+rise*Math.max(0,1-Math.abs(v.z)/(ob.d*.5));
 for(const poly of kind==='shed'?[local]:[clip(local,-1),clip(local,1)]){if(poly.length<3)continue;const a=[];for(const tri of THREE.ShapeUtils.triangulateShape(poly.map(v=>new THREE.Vector2(v.x,v.z)),[]))for(const i of tri)a.push(...f.p(poly[i].x,height(poly[i])+.08,poly[i].z));r.raw('roof',a,.9+nrand(seed)*.15);}
 // Timber boarding is visible from inside; the external roof remains ceramic.
 if(r.meta.buildingId==='grau-almacen'||r.meta.buildingId==='grau-recepcion'){
  for(const poly of kind==='shed'?[local]:[clip(local,-1),clip(local,1)]){if(poly.length<3)continue;const under=[];for(const tri of THREE.ShapeUtils.triangulateShape(poly.map(v=>new THREE.Vector2(v.x,v.z)),[]))for(const i of tri)under.push(...f.p(poly[i].x,height(poly[i])-.025,poly[i].z));r.raw('wood',under,1.18);}
  for(const sign of[-1,1])f.box(r,'wood',0,y-.03,sign*ob.d/2,ob.w,.18,.12,0,1.08);
 }
 for(let i=0;i<local.length;i++){const a=local[i],c=local[(i+1)%local.length],edges=[a];if(kind==='gable'&&a.z*c.z<0){const t=-a.z/(c.z-a.z);edges.push({x:a.x+(c.x-a.x)*t,z:0});}edges.push(c);for(let j=1;j<edges.length;j++){const lo=edges[j-1],hi=edges[j],q=[];quad(q,f.p(lo.x,y,lo.z),f.p(hi.x,y,hi.z),f.p(hi.x,height(hi),hi.z),f.p(lo.x,height(lo),lo.z));b.raw('lime',q,.95);}}
 if(kind==='gable'){for(let x=-ob.w/2+.15;x<ob.w/2;x+=.38)f.box(r,'roof',x,y+rise+.12,0,.42,.15,.25,0,.95);}
}
function timberRoofFrame(b,p,y,rise){const ob=oriented(p),f=ob.f;for(let x=-ob.w/2+2;x<ob.w/2;x+=4.8){f.box(b,'stone',x,y-2.2,0,.58,4.4,.58);f.box(b,'trim',x,y-.05,0,.81,.25,.79);beam(b,'wood',f.p(x,y,0),f.p(x,y+rise,0),.25);for(const s of[-1,1]){beam(b,'wood',f.p(x,y-1.1,0),f.p(x,y+rise*.55,s*ob.d*.22),.19);beam(b,'wood',f.p(x,y+rise,0),f.p(x,y,s*ob.d/2),.22);}}
 f.box(b,'wood',0,y+rise,0,ob.w,.25,.25);for(let x=-ob.w/2+.24;x<ob.w/2;x+=.63)for(const s of[-1,1])beam(b,'wood',f.p(x,y+rise,0),f.p(x,y,s*(ob.d/2-.12)),.095);
}
function modernStair(b,f,x,z,base,width,height,depth,steps){for(let i=0;i<steps;i++){const yy=base+height*(i+1)/steps,zz=z-depth*(i+.5)/steps;f.box(b,'iron',x,yy,zz,width,.055,depth/steps+.025);for(const side of[-1,1])if(i%3===0)f.box(b,'iron',x+side*(width/2-.06),yy+.49,zz,.035,.95,.035);}
 for(const s of[-1,1]){beam(b,'iron',f.p(x+s*(width/2-.06),base+.98,z),f.p(x+s*(width/2-.06),base+height+.98,z-depth),.045);beam(b,'iron',f.p(x+s*width*.42,base-.08,z),f.p(x+s*width*.42,base+height-.08,z-depth),.15);}}
function halfRoundBand(b,a,c,y,r=.11){const aa=new THREE.Vector3(a.x,y,a.z),cc=new THREE.Vector3(c.x,y,c.z),v=cc.clone().sub(aa),g=new THREE.CylinderGeometry(r,r,v.length(),10);b.geo('trim',g,new THREE.Matrix4().compose(aa.clone().add(cc).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()),new THREE.Vector3(1,1,1)));g.dispose();}
function cannon(b,f,y){
 for(const x of[-.43,.43]){f.box(b,'wood',x,y+.62,0,.19,.43,1.95);for(const z of[-.63,.66]){const g=new THREE.CylinderGeometry(.43,.43,.16,18),m=new THREE.Matrix4().compose(new THREE.Vector3(...f.p(x*1.35,y+.44,z)),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.atan2(f.world(0,1).x-f.world(0,0).x,f.world(0,1).z-f.world(0,0).z),Math.PI/2)),new THREE.Vector3(1,1,1));b.geo('wood',g,m,.85);g.dispose();}}
 for(const z of[-.63,.66])beam(b,'iron',f.p(-.8,y+.44,z),f.p(.8,y+.44,z),.10);
 const start=new THREE.Vector3(...f.p(0,y+1.02,-1.15)),end=new THREE.Vector3(...f.p(0,y+1.35,1.70)),axis=end.clone().sub(start),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize()),g=new THREE.CylinderGeometry(.13,.24,axis.length(),20,1,true);b.geo('iron',g,new THREE.Matrix4().compose(start.clone().add(end).multiplyScalar(.5),q,new THREE.Vector3(1,1,1)),.72);g.dispose();
 for(const t of[.10,.28,.57,.93]){const pos=start.clone().lerp(end,t),ring=new THREE.TorusGeometry(.24-.11*t,.025,6,20);b.geo('iron',ring,new THREE.Matrix4().compose(pos,new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis.clone().normalize()),new THREE.Vector3(1,1,1)),.6);ring.dispose();}const disc=new THREE.CircleGeometry(.105,20);b.geo('dark',disc,new THREE.Matrix4().compose(end.clone().add(axis.clone().normalize().multiplyScalar(-.025)),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis.clone().normalize()),new THREE.Vector3(1,1,1)));disc.dispose();
}
function buildingBase(p,heightAt){return p.map(v=>heightAt(v.x,v.z)).sort((a,b)=>a-b)[Math.floor(p.length/2)]+.08;}
function figTree(b,x,y,z,s=1,seed=1){b.cylinder('bark',x,y+1.1*s,z,.14*s,.27*s,2.2*s,1,9);for(let i=0;i<6;i++){const a=i*TAU/6+seed,dx=Math.cos(a)*1.45*s,dz=Math.sin(a)*1.45*s;beam(b,'bark',[x,y+1.1*s,z],[x+dx,y+2.4*s,z+dz],.12*s);const g=new THREE.IcosahedronGeometry(1,1);b.geo(i%2?'leaf':'leaflight',g,new THREE.Matrix4().compose(new THREE.Vector3(x+dx,y+(2.75+nrand(seed+i)*.45)*s,z+dz),new THREE.Quaternion(),new THREE.Vector3(1.7*s,1.1*s,1.6*s)),.85+nrand(seed+i)*.15);g.dispose();}}
function museumHall(b,r,part,project,heightAt,patches,{reception=false,openingsRegistry}={}){
 const p=clean(part.polygon,project),base=buildingBase(p,heightAt),ob=oriented(p),h=reception?6.25:4.55,top=base+h,prefix=reception?'recepcion':'almacen',buildingId='grau-'+prefix;
 b.set(prefix+'-suelo','almacen',{buildingId,floor:0});polygon(b,reception?'brickfloor':'gravel',p,base+.04);
 for(let i=0;i<p.length;i++){
  const a=p[i],c=p[(i+1)%p.length],len=Math.hypot(c.x-a.x,c.z-a.z);if(len<.12)continue;
  const f=faceFrame(a,c,p),out=f.world(0,1),mid=f.world(0,0),front=(out.x-mid.x)*.81+(out.z-mid.z)*.59,openings=[];
  if(front>.68&&len>5){const n=Math.max(1,Math.floor(len/7.5));for(let j=0;j<n;j++){const x=-len/2+(j+.5)*len/n;openings.push({x,w:reception?1.15:1.65,y:base,h:2.45});if(reception)openings.push({x,w:1.05,y:base+3.2,h:2.25});else if(x+2.4<len/2-.45)openings.push({x:x+2.15,w:.50,y:base+3.1,h:.63});}}
  if(front<-.68&&len>6&&!reception)for(let x=-len/2+3.2;x<len/2-.5;x+=7)openings.push({x,w:.9,y:base+2.8,h:1.1});
  b.set(prefix+'-muros-bajos','almacen',{buildingId,floor:0});panelWithVoids(b,'stone',f,len,base-.15,base+1.12,.56,openings,1.04);
  b.set(prefix+'-muros-altos','almacen',{buildingId,floor:0,cutGroup:prefix+'-upper'});panelWithVoids(b,'stone',f,len,base+1.12,top,.56,openings,1.04);
  for(let j=0;j<openings.length;j++){
   const o=openings[j],kind=o.y<base+.5?'door':'window';b.set(prefix+'-carpinterias','restauracion',{buildingId,floor:o.y>base+3?1:0,cutGroup:prefix+'-upper'});
   if(!reception&&kind==='door')segmentalHead(b,'stone',f,o,.56,.27);else openingTrim(b,f,o,.32);
   if(kind==='door'){
    f.box(b,'wood',o.x-o.w*.51,o.y+o.h*.44,-o.w*.46,o.w*.9,o.h*.88,.10,Math.PI*.47,1.04);
    for(let k=0;k<4;k++)f.box(b,'iron',o.x-o.w*.51,o.y+.42+k*.45,-o.w*.45,.11,.035,o.w*.85,0,.8);
   }else if(o.h>2){for(let z=-o.w/2;z<=o.w/2;z+=.16)f.box(b,'iron',o.x+z,o.y+o.h/2,.52,.03,o.h,.03);f.box(b,'trim',o.x,o.y-.13,.55,o.w+.5,.19,.62);}
   else{for(const side of[-1,1]){f.box(b,'wood',o.x+side*(o.w/2-.03),o.y+o.h/2,-.16,.06,o.h,.065);f.box(b,'wood',o.x,o.y+o.h/2+side*(o.h/2-.03),-.16,o.w,.06,.065);}f.box(b,'glass',o.x,o.y+o.h/2,-.12,o.w-.09,o.h-.09,.018);}
   if(openingsRegistry)registerOpening(openingsRegistry,prefix+'-'+kind+'-'+i+'-'+j,kind,f,o,buildingId,base);
  }
 }
 const rise=reception?1.25:2.15;r.set(prefix+'-cubierta','restauracion',{buildingId,cutGroup:prefix+'-cover'});b.set(prefix+'-hastiales','almacen',{buildingId,cutGroup:prefix+'-upper'});roofOverFootprint(r,b,p,top,{rise,seed:7});
 patches.push({polygon:p,height:base-.06});return{p,base,ob,top,point:new THREE.Vector3(ob.c.x,base+2,ob.c.z),buildingId};
}
function residentialPart(b,r,part,allPolys,project,heightAt,patches,index){
 const p=clean(part.polygon,project);if(p.length<3)return;const base=buildingBase(p,heightAt),isRuin=part.roofType==='open-remains',h=part.floors===0?.55:isRuin?2.3:part.role==='south-warehouse'?5.65:part.floors>1?5.75:3.45,top=base+h;
 polygon(b,isRuin?'gravel':'floor',p,base+.015,.93);const ob=oriented(p);
 for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],len=Math.hypot(c.x-a.x,c.z-a.z);if(len<.15)continue;const f=faceFrame(a,c,p),o=f.world(0,.7),shared=allPolys.some(v=>v!==p&&inside(v,o.x,o.z));wall(b,isRuin?'stone':part.role==='south-warehouse'?'lime':'lime',a,c,base-.14,top,.26,.87+nrand(index)*.14);wall(b,'stone',a,c,base-.2,base+.38,.31,.88);
  if(shared||h<3)continue;const n=Math.min(5,Math.floor((len-.45)/3.1));for(let j=0;j<n;j++){const x=-len/2+(j+.5)*len/n;if(j===0&&len<14){door(b,f,x,base,.20,1.1,2.25,{arched:false,stone:false});f.box(b,'trim',x,base+2.34,.22,1.35,.16,.16);}else windowDetail(b,f,x,base+1.75,.20,.78,1.2,{shutters:index%3!==0,bars:index%4===0});if(h>5)windowDetail(b,f,x,base+4.5,.20,.80,1.4,{shutters:index%2===0});}wall(b,'trim',a,c,top-.12,top+.02,.35,.95);
 }
 if(isRuin){for(let i=0;i<35;i++){const q=ob.f.world((nrand(i+index*23)-.5)*ob.w,(nrand(i+741+index)-.5)*ob.d);if(inside(p,q.x,q.z))b.box('stone',q.x,base+.12,q.z,.3+nrand(i)*.5,.15+nrand(i+1)*.18,.35,nrand(i+2)*6,.73+nrand(i+3)*.25);}}
 else if(part.floors>0){roofOverFootprint(r,b,p,top,{kind:part.role==='south-warehouse'?'shed':part.roofType==='terrace'?'terrace':'gable',rise:Math.min(1.55,ob.d*.18),seed:index});if(ob.w>6&&ob.d>3&&index%4===0){const q=ob.f.world(ob.w*.24,0);b.box('lime',q.x,top+1.0,q.z,.40,1.2,.45);b.box('trim',q.x,top+1.65,q.z,.56,.15,.59);}}
 patches.push({polygon:p,height:base-.07});return{p,base,ob};
}
function chapel(b,r,part,project,heightAt,patches){
 const p=clean(part.polygon,project),base=buildingBase(p,heightAt),ob=oriented(p),top=base+4.9;polygon(b,'floor',p,base+.02);for(let i=0;i<p.length;i++){wall(b,'lime',p[i],p[(i+1)%p.length],base-.1,top,.30,1.1);wall(b,'trim',p[i],p[(i+1)%p.length],base+.05,base+.23,.34,1.03);}polygon(r,'lime',p,top+.04,1.04);
 // Direct facade reference: square lintel, stepped white parapet and one small bell.
 const f=frame(ob.c.x,ob.c.z,.95),local=p.map(q=>pointFromFrame(f,q)),maxX=Math.max(...local.map(q=>q.x)),minZ=Math.min(...local.map(q=>q.z)),maxZ=Math.max(...local.map(q=>q.z)),fw=maxZ-minZ;
 const ff=frame(...(()=>{const q=f.world(maxX,minZ+(maxZ-minZ)*.5);return[q.x,q.z];})(),.95+Math.PI/2);
 door(b,ff,0,base,.21,1.80,2.95,{arched:false,stone:false});ff.box(b,'trim',0,base+3.02,.2,1.98,.13,.17,0,1.1);
 ff.box(b,'lime',0,top+.18,.04,fw,.36,.34,0,1.1);ff.box(b,'lime',0,top+.55,.04,fw*.57,.74,.36,0,1.1);ff.box(b,'trim',0,top+.94,.06,fw*.59,.13,.40,0,1.08);
 const by=top+.55;arch(b,ff,{x:0,y:by,z:.07,w:.74,h:1.35,thick:.30,depth:.36,kind:'lime'});shape2D(b,'lime',ff,[[-.67,by+1.37],[.67,by+1.37],[0,by+1.77]],.27,1.08);ff.box(b,'iron',0,by+.76,.07,.66,.06,.07);const bell=new THREE.ConeGeometry(.125,.23,12);b.geo('iron',bell,new THREE.Matrix4().makeTranslation(...ff.p(0,by+.58,.07)),.8);bell.dispose();ff.box(b,'iron',0,by+1.89,.07,.025,.25,.025);ff.box(b,'iron',0,by+1.94,.07,.16,.025,.025);
 // A modest crucifix above the doorway; no fabricated side windows or mural imagery.
 ff.box(b,'iron',0,base+3.72,.24,.07,.74,.06);ff.box(b,'iron',0,base+3.91,.24,.46,.07,.06);patches.push({polygon:p,height:base-.06});return{point:new THREE.Vector3(ob.c.x,base+2,ob.c.z),base};
}
// Shallow segmental heads and through reveals, matching the restored warehouses.
function segmentalHead(b,kind,f,o,thickness=.56,rise=.28){
 const w=o.w/2,y=o.y+o.h,segments=18,out=[];
 for(let i=0;i<segments;i++){
  const x0=-w+o.w*i/segments,x1=-w+o.w*(i+1)/segments;
  const y0=y-rise+Math.sqrt(Math.max(0,1-x0*x0/(w*w)))*rise,y1=y-rise+Math.sqrt(Math.max(0,1-x1*x1/(w*w)))*rise;
  if(y-y0>.0001||y-y1>.0001){quad(out,f.p(o.x+x0,y0,thickness/2),f.p(o.x+x1,y1,thickness/2),f.p(o.x+x1,y,thickness/2),f.p(o.x+x0,y,thickness/2));quad(out,f.p(o.x+x1,y1,-thickness/2),f.p(o.x+x0,y0,-thickness/2),f.p(o.x+x0,y,-thickness/2),f.p(o.x+x1,y,-thickness/2));}
  quad(out,f.p(o.x+x0,y0,-thickness/2),f.p(o.x+x1,y1,-thickness/2),f.p(o.x+x1,y1,thickness/2),f.p(o.x+x0,y0,thickness/2));
 }
 b.raw(kind,out,.98);
}
function registerOpening(registry,id,kind,f,o,buildingId,base){
 const a=f.world(o.x-o.w/2,0),c=f.world(o.x+o.w/2,0),q=f.world(o.x,0),n=f.world(o.x,1);
 registry[kind==='door'?'doors':'windows'].push({id,buildingId,kind,width:o.w,height:o.h,elevation:o.y,relativeElevation:o.y-base,coordinatesWorld:[[a.x,a.z],[c.x,c.z]],normal:[n.x-q.x,n.z-q.z],point:[q.x,o.y+o.h*.5,q.z],realOpening:true,representative:false,interpretiveRegistration:true});
}
function conservedTimberFrame(b,hall){
 const {ob,top,base}=hall,f=ob.f,y=top-.12,rise=2.15;
 b.set('almacen-estructura','almacen',{buildingId:'grau-almacen',structural:true});
 for(let xx=-ob.w/2+2.8;xx<ob.w/2-1;xx+=5.1){
  f.box(b,'ashlar',xx,base+.65,0,.64,1.3,.64,0,.73);
  f.box(b,'plaster',xx,(base+1.3+y)/2,0,.57,y-base-1.3,.57,0,.97);
  f.box(b,'trim',xx,y+.05,0,.76,.22,.76);
  f.box(b,'wood',xx,y+rise*.5,0,.24,rise,.24);
  for(const sign of[-1,1]){beam(b,'wood',f.p(xx,y-.7,0),f.p(xx,y+rise*.58,sign*ob.d*.21),.21);beam(b,'wood',f.p(xx,y+rise,0),f.p(xx,y,sign*(ob.d/2-.15)),.23);}
  f.box(b,'floor',xx,base+.047,0,.32,.025,ob.d-.65,0,.95);
 }
 for(const zz of[-ob.d*.35,0,ob.d*.35])f.box(b,'wood',0,y+rise*(1-Math.abs(zz)/(ob.d/2)),zz,ob.w-.3,.24,.21);
 for(let xx=-ob.w/2+.30;xx<ob.w/2;xx+=.61)for(const sign of[-1,1])beam(b,'wood',f.p(xx,y+rise,0),f.p(xx,y,sign*(ob.d/2-.12)),.10);
 f.box(b,'floor',0,base+.045,0,ob.w-.4,.025,.34,0,.97);
}
function museumExhibition(b,hall){
 const {ob,base}=hall,f=ob.f,stationPositions=[];
 // Five deliberately freestanding interpretation points: the official thematic
 // sequence is documented, but no room layout is asserted without a 2026 plan.
 const names=['Memoria portuaria','Navegación y mercancías','El paisaje de la marjal','Defender la costa','Restaurar y recordar'];
 for(let i=0;i<5;i++){
  const x=-ob.w*.33+i*ob.w*.165,z=(i%2?1:-1)*(ob.d*.29),yaw=i%2?Math.PI:0,q=f.world(x,z),ff=frame(q.x,q.z,ob.yaw+yaw);
  b.set('museo-estacion-'+i,'museo',{buildingId:'grau-almacen',interpretive:true});
  ff.box(b,'wood',0,base+1.27,0,2.30,2.35,.20,0,1.05);ff.box(b,'display',0,base+1.44,.115,2.08,1.76,.035);ff.box(b,'screen',0,base+1.55,.14,1.83,1.14,.018,0,.92);
  // Small explanatory lines are simple graphics, not fictitious historical images.
  for(let j=0;j<5;j++)ff.box(b,'display',-.36+j*.16,base+1.26+j*.15,.154,.65+j*.07,.018,.01,0,.91);
  ff.box(b,'wood',0,base+.28,.25,2.30,.56,.70,0,.9);ff.box(b,'iron',0,base+.035,.12,2.43,.07,.88,0,.7);
  const label={name:names[i],x,z,point:new THREE.Vector3(q.x,base+1.45,q.z)};stationPositions.push(label);
 }
 // Low timber-and-glass cases echo the municipal opening photographs. Contents
 // are representative teaching replicas; their precise layout is interpretive.
 for(let i=0;i<3;i++){
  const x=-ob.w*.25+i*ob.w*.25,z=i%2?ob.d*.19:-ob.d*.19;
  b.set('museo-vitrinas','museo',{buildingId:'grau-almacen',interpretive:true});
  f.box(b,'wood',x,base+.62,z,1.75,1.1,.74,0,1.04);f.box(b,'display',x,base+1.19,z,1.62,.04,.64);
  for(const side of[-1,1]){f.box(b,'glass',x,base+1.49,z+side*.36,1.72,.57,.014);f.box(b,'glass',x+side*.86,base+1.49,z,.014,.57,.72);}
  f.box(b,'glass',x,base+1.79,z,1.72,.014,.72);
  if(i===0){for(const s of[-1,1]){const a=f.world(x+s*.37,z);amphoraReplica(b,a.x,base+1.22,a.z,.46);}}
  else if(i===1){const a=f.p(x-.6,base+1.30,z),c=f.p(x+.6,base+1.30,z);beam(b,'iron',a,c,.11);for(const side of[-1,1])beam(b,'iron',f.p(x+side*.6,base+1.30,z),f.p(x+side*.50,base+1.44,z+.16),.075);}
  else for(let j=0;j<5;j++){const q=f.world(x-.5+j*.24,z);b.cylinder('trim',q.x,base+1.245,q.z,.073,.073,.025,.83,16);}
 }
 return stationPositions;
}
function amphoraReplica(b,x,y,z,scale=1){
 const pts=[[.04,0],[.07,.08],[.18,.25],[.22,.48],[.18,.65],[.08,.77],[.075,.93],[.10,.96]].map(([r,h])=>new THREE.Vector2(r*scale,h*scale));
 const g=new THREE.LatheGeometry(pts,18);b.geo('brickfloor',g,new THREE.Matrix4().makeTranslation(x,y,z),1.12);g.dispose();
 for(const side of[-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x+side*.075*scale,y+.87*scale,z),new THREE.Vector3(x+side*.22*scale,y+.78*scale,z),new THREE.Vector3(x+side*.19*scale,y+.61*scale,z)]);const h=new THREE.TubeGeometry(curve,10,.024*scale,6,false);b.geo('brickfloor',h);h.dispose();}
}
function towerVault(b,f,{width,depth,floor,terrace,hatch}){
 const radius=width*.5,spring=terrace-.28-radius,segments=40,zs=[];for(let z=-depth/2;z<depth/2;z+=.42)zs.push(z);zs.push(depth/2);const out=[];
 for(let j=1;j<zs.length;j++)for(let i=0;i<segments;i++){
  const a=i*Math.PI/segments,c=(i+1)*Math.PI/segments,x0=Math.cos(a)*radius,x1=Math.cos(c)*radius,z0=zs[j-1],z1=zs[j],mx=(x0+x1)*.5,mz=(z0+z1)*.5;
  if(mx>hatch.x-hatch.w/2&&mx<hatch.x+hatch.w/2&&mz>hatch.z-hatch.d/2&&mz<hatch.z+hatch.d/2)continue;
  const y0=spring+Math.sin(a)*radius,y1=spring+Math.sin(c)*radius;
  quad(out,f.p(x0,y0,z0),f.p(x1,y1,z0),f.p(x1,y1,z1),f.p(x0,y0,z1));
 }
 b.set('torre-boveda','torre',{buildingId:'grau-torre',floor:1,cutGroup:'torre-cover'});b.raw('stone',out,.95);
 // Plaster/mortar intrados follows the architects' restored-room photograph;
 // brick construction is recorded in the academic description, not overpainted.
 return{spring,radius};
}
function terraceWithHatch(b,p,f,y,hatch){
 const contour=p.map(q=>new THREE.Vector2(q.x,-q.z)),h=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>f.world(hatch.x+sx*hatch.w/2,hatch.z+sz*hatch.d/2)),hole=h.map(q=>new THREE.Vector2(q.x,-q.z)),all=[...p,...h],out=[];
 for(const tri of THREE.ShapeUtils.triangulateShape(contour,[hole]))for(const i of tri)out.push(all[i].x,y,all[i].z);b.raw('floor',out);
}
function woodTowerStair(b,f,{floor,terrace,hatch}){
 const start={x:hatch.x,z:hatch.z-.93},end={x:hatch.x,z:hatch.z+.14},rise=terrace-floor;
 b.set('torre-escalera','restauracion',{buildingId:'grau-torre',floor:1});
 for(const side of[-1,1]){beam(b,'wood',f.p(start.x+side*.36,floor+.04,start.z),f.p(end.x+side*.36,terrace+.33,end.z),.12,1.27);beam(b,'iron',f.p(start.x+side*.43,floor+.92,start.z),f.p(end.x+side*.43,terrace+1.0,end.z),.027,.78);}
 for(let i=0;i<17;i++){const t=(i+1)/17,z=start.z+(end.z-start.z)*t;f.box(b,'wood',hatch.x,floor+rise*t,z,.67,.065,.21,0,1.32);}
}

function fortification(record,{heightAt,project,grauVisit,grauContextData}){
 const resources=resourcesForInstance(),b=new Batch(resources),r=new Batch(resources),context=new Batch(resources),contextRoof=new Batch(resources),patches=[],exclusions=[],parts=record.structures,byPart=Object.fromEntries(parts.map(p=>[p.id,p])),openingsRegistry={doors:[],windows:[]};
 const p=clean(byPart['6910216YJ3961S_part5'].polygon,project),tc=center(p),base=buildingBase(p,heightAt),f=frame(tc.x,tc.z,.947),local=p.map(q=>pointFromFrame(f,q)),tw=Math.max(...local.map(q=>q.x))-Math.min(...local.map(q=>q.x)),td=Math.max(...local.map(q=>q.z))-Math.min(...local.map(q=>q.z)),floor=base+4.05,terrace=base+9.25,top=base+10.70;
 // The documented lower storey is a solid stone/lime fill, not an invented room.
 b.set('torre-basamento','torre',{buildingId:'grau-torre',solidFill:true});blockPrism(b,'stone',p,base-.25,floor);
 b.set('torre-sala-suelo','torre',{buildingId:'grau-torre',floor:1});polygon(b,'floor',p,floor+.02);
 const hatch={x:tw*.27,z:td*.24,w:1.12,d:1.36},roomWidth=tw-1.56,roomDepth=td-1.52;
 b.set('torre-terraza','torre',{buildingId:'grau-torre',floor:2,cutGroup:'torre-cover'});terraceWithHatch(b,p,f,terrace,hatch);
 const towerOpenings=[];
 for(let i=0;i<p.length;i++){
  const a=p[i],c=p[(i+1)%p.length],len=Math.hypot(c.x-a.x,c.z-a.z);if(len<.35)continue;
  const ff=faceFrame(a,c,p),front=ff.world(0,1),mid=ff.world(0,0),dot=(front.x-mid.x)*.812+(front.z-mid.z)*.584;let holes=[];
  if(dot>.75)holes=[{x:len*.15,w:.88,y:floor,h:2.25},{x:-len*.22,w:.66,y:floor+.68,h:1.15}];
  else if(dot<-.75)holes=[{x:0,w:.95,y:floor,h:2.3}];else if(len>2.5)holes=[{x:0,w:.25,y:floor+1.05,h:.78}];
  b.set('torre-muros-bajos','torre',{buildingId:'grau-torre',floor:1});panelWithVoids(b,'stone',ff,len,floor,floor+.92,.85,holes,.99);
  b.set('torre-muros-altos','torre',{buildingId:'grau-torre',floor:1,cutGroup:'torre-upper'});panelWithVoids(b,'stone',ff,len,floor+.92,terrace,.85,holes,.99);
  for(let j=0;j<holes.length;j++){const o=holes[j];segmentalHead(b,'stone',ff,o,.85,.12);registerOpening(openingsRegistry,'torre-'+i+'-'+j,o.h>2?'door':'window',ff,o,'grau-torre',base);towerOpenings.push({f:ff,o,dot});}
  b.set('torre-parapetos','torre',{buildingId:'grau-torre',floor:2,cutGroup:'torre-cover'});
  const crown=dot>.75?[{x:0,w:.75,y:terrace+.55,h:top-terrace-.55}]:[];panelWithVoids(b,'stone',ff,len,terrace,top,dot<-.5?.80:.56,crown,1.02);
 }
 // Continuous quoins, rather than medieval merlons, define the tower corners.
 b.set('torre-silleria-baja','torre',{buildingId:'grau-torre'});
 for(let i=0;i<4;i++){const corner=f.world((i<2?-1:1)*tw*.47,(i%2?-1:1)*td*.47);for(let y=base+.28;y<top;y+=.54){b.set(y<floor+.92?'torre-silleria-baja':'torre-silleria-alta','torre',{buildingId:'grau-torre',...(y>=floor+.92?{cutGroup:'torre-upper'}:{})});b.box('trim',corner.x,y,corner.z,.53,.45,.53,.947,.83+nrand(i*31+y)*.2);}}
 b.set('torre-canecillos','torre',{buildingId:'grau-torre',cutGroup:'torre-cover'});
 for(const side of[-1,1]){f.box(b,'stone',side*tw*.45,base+8.9,-td*.5-.26,.48,.36,.70);f.box(b,'trim',side*tw*.45,base+9.15,-td*.5-.36,.65,.24,.80);}
 // Northwest guardhouse: the 2.30 × 3.30 m body and timber/tiles roof are recorded
 // by the 2015 survey. Door registration is interpreted, and is a real void.
 const gx=tw*.5-1.25,gz=-td*.5+1.7,guardBase=terrace,guardTop=top+.86;
 b.set('torre-gariton','torre',{buildingId:'grau-torre',floor:2,cutGroup:'torre-cover'});
 for(const side of[-1,1])f.box(b,'stone',gx+side*1.15,(guardBase+guardTop)/2,gz,.32,guardTop-guardBase,3.3);
 for(const side of[-1,1]){const q=f.world(gx,gz+side*1.65),gf=frame(q.x,q.z,.947);panelWithVoids(b,'stone',gf,2.3,guardBase,guardTop,.32,side===1?[{x:0,w:.78,y:guardBase,h:1.98}]:[]);}
 r.set('gariton-cubierta','restauracion',{buildingId:'grau-torre',floor:2,cutGroup:'torre-cover'});tiledRoof(r,f,gx,gz,guardTop,2.65,3.65,.18);
 const vault=towerVault(b,f,{width:roomWidth,depth:roomDepth,floor,terrace,hatch});woodTowerStair(b,f,{floor,terrace,hatch});
 // Two contemporary metal flights connected by a narrow walk, as photographed
 // by the restoration architects, reach the elevated landward doorway.
 b.set('acceso-escalera','restauracion',{buildingId:'grau-torre'});
 const stairZ=-td/2-.72,along=frame(...(()=>{const q=f.world(-10.7,stairZ);return[q.x,q.z];})(),.947-Math.PI/2);
 modernStair(b,along,0,0,base+.06,1.16,2.35,3.35,13);
 const walkA=f.p(-7.35,base+2.41,stairZ),walkB=f.p(-3.35,base+2.41,stairZ);beam(b,'iron',walkA,walkB,.12);f.box(b,'iron',-5.35,base+2.41,stairZ,4.05,.075,1.18);
 for(const zz of[stairZ-.54,stairZ+.54]){rail(b,f,-5.35,zz,base+2.41,4.05);for(const xx of[-7.25,-3.4])beam(b,'iron',f.p(xx,base,zz),f.p(xx,base+2.41,zz),.075);}
 const upper=frame(...(()=>{const q=f.world(-3.35,stairZ);return[q.x,q.z];})(),.947-Math.PI/2);modernStair(b,upper,0,0,base+2.41,1.16,1.64,2.9,10);
 f.box(b,'iron',.12,floor,stairZ,1.27,.085,1.38);rail(b,f,.12,stairZ-.61,floor,1.27);
 const battery=clean(record.footprints.battery,project),moat=clean(record.footprints.moat,project),bc=center(battery),moatY=base-1.30,deck=base+4.05,batteryTop=base+4.70;
 b.set('foso-fondo','bateria');polygon(b,'gravel',moat,moatY+.015,.88);patches.push({polygon:moat,height:moatY-.03});
 b.set('bateria-macizo','bateria',{solidFill:true});const inner=battery.map(q=>({x:bc.x+(q.x-bc.x)*.963,z:bc.z+(q.z-bc.z)*.963}));
 for(let i=0;i<battery.length;i++){const a=battery[i],c=battery[(i+1)%battery.length],aa=inner[i],cc=inner[(i+1)%inner.length],out=[];quad(out,[a.x,moatY,a.z],[c.x,moatY,c.z],[cc.x,deck,cc.z],[aa.x,deck,aa.z]);b.raw('ashlar',out,.92);
  if(Math.hypot(a.x-c.x,a.z-c.z)>.6)for(let yy=moatY;yy<deck;yy+=.48){const next=Math.min(deck,yy+.48),t=((yy+next)/2-moatY)/(deck-moatY),lo={x:a.x+(aa.x-a.x)*t,z:a.z+(aa.z-a.z)*t},hi={x:c.x+(cc.x-c.x)*t,z:c.z+(cc.z-c.z)*t};jointCourses(b,'ashlar',lo,hi,yy,next,.065,i+22+Math.round(yy*9),.48);}
  const m={x:(a.x+c.x)/2,z:(a.z+c.z)/2};if(!inside(p,m.x,m.z)){wall(b,'ashlar',aa,cc,deck,batteryTop,.52,.98);halfRoundBand(b,aa,cc,deck-.08,.15);}
 }
 b.set('bateria-azotea','bateria',{floor:1});polygon(b,'floor',inner,deck+.015,.96);const cf=frame(bc.x+1.6,bc.z+1.4,.947);b.set('bateria-replica','museo',{interpretive:true});cannon(b,cf,deck+.04);
 // Two drainage spouts are documented on the north and south sides.
 b.set('bateria-desagues','bateria');for(const sign of[-1,1]){const q=frame(bc.x,bc.z,.947).world(sign*4.6,3.1);b.box('trim',q.x,deck-.10,q.z,.38,.25,.82,.947);}
 // Dry ditch: outer retaining wall, upper guard rail and a precise ground-level apron.
 b.set('foso-muros','bateria');for(let i=0;i<moat.length;i++){const a=moat[i],c=moat[(i+1)%moat.length],m={x:(a.x+c.x)/2,z:(a.z+c.z)/2};if(battery.some(v=>Math.hypot(v.x-m.x,v.z-m.z)<.8))continue;wall(b,'stone',a,c,moatY,base+.04,.24,.85);const len=Math.hypot(c.x-a.x,c.z-a.z);if(i>0&&i<12){const ff=frame(m.x,m.z,-Math.atan2(c.z-a.z,c.x-a.x));rail(b,ff,0,0,base,len);}}
 b.set('bateria-escudo','bateria');const frontEdges=battery.map((a,i)=>({a,c:battery[(i+1)%battery.length]})).filter(e=>Math.hypot(e.c.x-e.a.x,e.c.z-e.a.z)>3).sort((a,c)=>((c.a.x+c.c.x)*.812+(c.a.z+c.c.z)*.584)-((a.a.x+a.c.x)*.812+(a.a.z+a.c.z)*.584));if(frontEdges.length){const e=frontEdges[0],ff=faceFrame(e.a,e.c,battery);crest(b,ff,0,base+3.2,.20,.76);}
 // The Civil War shelter is read through its modest doorway at the south side of the battery.
 b.set('refugio-acceso','refugio');const shelter=frame(...(()=>{const q=f.world(-5.5,1.4);return[q.x,q.z];})(),.947+Math.PI/2);
 for(const side of[-1,1])shelter.box(b,'stone',side*.94,base+1.4,0,.30,2.8,2.3);shelter.box(b,'stone',0,base+2.63,0,2.2,.34,2.3);shelter.box(b,'stone',0,base+1.4,-1.0,2.2,2.8,.3);
 const shf=frame(...(()=>{const q=shelter.world(0,1.0);return[q.x,q.z];})(),.947+Math.PI/2);panelWithVoids(b,'stone',shf,2.2,base,base+2.8,.3,[{x:0,w:.8,y:base,h:1.9}]);shf.box(b,'iron',0,base+.95,0,.73,1.88,.035);shf.box(b,'trim',0,base+2.12,.20,1.15,.22,.18);
 const courtyard=clean(record.footprints.courtyard,project),northCourt=clean(record.footprints.northCourt,project);b.set('patio-suelo','almacen');polygon(b,'floor',courtyard,base+.035,.99);polygon(b,'floor',northCourt,base+.035,.94);patches.push({polygon:courtyard,height:base-.035},{polygon:northCourt,height:base-.035},{polygon:p,height:base-.08});exclusions.push(courtyard,northCourt,moat,battery);
 b.set('corral-muros','almacen');for(const wid of['1418515038','1418515039']){const line=record.contextGeometry.find(q=>q.id===wid);if(!line)continue;const points=clean(line.polygon,project);for(let i=1;i<points.length;i++){const a=points[i-1],c=points[i];wall(b,'stone',a,c,base-.1,base+3.7,.66,.93);wall(b,'ochre',a,c,base+3.7,base+5.30,.48,.88);const len=Math.hypot(c.x-a.x,c.z-a.z),ff=frame((a.x+c.x)/2,(a.z+c.z)/2,-Math.atan2(c.z-a.z,c.x-a.x));for(let x=-len/2+1;x<len/2;x+=1.55)for(const yy of[2.8,4.4])ff.box(b,'dark',x,base+yy,-.35,.17,.20,.035);}}
 b.set('pozo','almacen');const wellPoly=clean(record.footprints.well,project),wc=center(wellPoly),wf=frame(wc.x,wc.z,.947);for(const sign of[-1,1]){wf.box(b,'stone',sign*.8,base+.37,0,.35,.74,1.9);wf.box(b,'stone',0,base+.37,sign*.8,1.9,.74,.35);wf.box(b,'trim',sign*.83,base+.79,0,.43,.14,2.05);wf.box(b,'trim',0,base+.79,sign*.83,2.05,.14,.43);wf.box(b,'trim',sign*.62,base+1.40,0,.25,1.22,.32);}wf.box(b,'dark',0,base+.08,0,1.2,.04,1.2);beam(b,'iron',wf.p(-.7,base+1.86,0),wf.p(.7,base+1.86,0),.07);
 b.set('patio-juntas','restauracion');const gridFrame=frame(wc.x,wc.z,.947);for(let i=-4;i<=4;i++){const a=gridFrame.world(i*4,-18),c=gridFrame.world(i*4,18);for(let n=0;n<36;n+=.65){const q=gridFrame.world(i*4,-18+n);if(inside(courtyard,q.x,q.z))gridFrame.box(b,'mortar',i*4,base+.057,-18+n,.035,.012,.65,0,.96);}}
 b.set('patio-arboles','paisaje',{vegetation:true});const treePixels=[[884,552,1.13],[845,614,.55],[869,636,.55],[897,656,.56],[924,670,.54],[1119,534,.40],[1116,558,.45],[1113,585,.42]];for(let i=0;i<treePixels.length;i++){const[x,y,s]=treePixels[i],q=project(-.2414+x/1400*.0024,39.6362-y/1970*.0026);figTree(b,q.x,base+.06,q.z,s,i);if(i===0)bench(b,gridFrame,-3.2,base,0,4.3);}
 b.set('patio-mobiliario','restauracion');for(const q of[[gridFrame.world(-8,-5),4],[gridFrame.world(6,2),4],[f.world(10,9),4.5]])lamp(b,q[0].x,base,q[0].z,q[1]/3.8);
 const hall=museumHall(b,r,byPart['6910216YJ3961S_part2'],project,heightAt,patches,{openingsRegistry}),reception=museumHall(b,r,byPart['6910203YJ3961S_part1'],project,heightAt,patches,{reception:true,openingsRegistry});conservedTimberFrame(b,hall);const exhibitStations=museumExhibition(b,hall);
 exclusions.push(hall.p,reception.p,p);
 const wing=byPart['6910216YJ3961S_part1'];b.set('corral-anexo','almacen',{buildingId:'grau-anexo'});r.set('anexo-cubierta','restauracion',{buildingId:'grau-anexo',cutGroup:'anexo-cover'});exclusions.push(clean(wing.polygon,project));residentialPart(b,r,{...wing,floors:1},[],project,heightAt,patches,31);
 // Open modern entrance between tower and the two-storey reception building.
 b.set('acceso-portada','restauracion');const ga=project(-.2397031,39.6353744),gb=project(-.2396584,39.6353873),gl=Math.hypot(gb.x-ga.x,gb.z-ga.z),gf=frame((ga.x+gb.x)/2,(ga.z+gb.z)/2,-Math.atan2(gb.z-ga.z,gb.x-ga.x));panelWithVoids(b,'lime',gf,gl,base,base+3.1,.25,[{x:0,w:1.35,y:base,h:2.45}],1.04);gf.box(b,'trim',0,base+3.13,0,gl+.15,.18,.38);
 const contextParts=grauContextData?[]:parts.filter(q=>!q.id.startsWith('6910216')&&!q.id.startsWith('6910203')),allPolys=contextParts.map(q=>clean(q.polygon,project));let chapelInfo=null;
 for(let i=0;i<contextParts.length;i++){const pp=contextParts[i];if(pp.role==='chapel'){chapelInfo=chapel(context,contextRoof,pp,project,heightAt,patches);exclusions.push(allPolys[i]);continue;}residentialPart(context,contextRoof,pp,allPolys,project,heightAt,patches,i+1);exclusions.push(allPolys[i]);}
 // A few ancillary mapped buildings absent from the cadastral parts remain restrained context.
 const mappedPolys=parts.map(q=>clean(q.polygon,project));for(const item of grauContextData?[]:record.ancillaryBuildings||[]){const q=clean(item.polygon,project);if(q.length<3)continue;residentialPart(context,contextRoof,{polygon:item.polygon,floors:1,role:'house',roofType:'gable'},mappedPolys,project,heightAt,patches,92);exclusions.push(q);}
 const plaza=clean(record.footprints.chapelSquare,project);if(!grauContextData){polygon(context,'floor',plaza,(x,z)=>heightAt(x,z)+.08,.95);exclusions.push(plaza);}const pc=center(plaza);if(chapelInfo){const ff=frame(pc.x,pc.z,.947);bench(context,ff,-3,chapelInfo.base,2,2.3);figTree(context,pc.x+3,heightAt(pc.x+3,pc.z),pc.z,.8,43);}
 const group=new THREE.Group();group.name='25 · Fortín y poblado del Grau Vell';const currentGroup=new THREE.Group();currentGroup.name='Conjunto restaurado · Sagunt i la Mar';group.add(currentGroup);
 currentGroup.add(b.finish('Fortín y centro de interpretación'),context.finish('Poblado · huellas cartográficas'),contextRoof.finish('Cubiertas del poblado'));
 const roof=r.finish('Cubiertas del Grau Vell');roof.userData.id='grau-vell';currentGroup.add(roof);
 const coreAnchors={tower:{p,tc,base,f,tw,td,floor,terrace,top,hatch,roomWidth,roomDepth,vault},battery:{p:battery,inner,bc,deck,moatY,moat},courtyard,northCourt,well:{p:wellPoly,wc},hall,reception,wing:clean(wing.polygon,project),plaza,exhibitStations,entrance:{a:ga,c:gb,point:gf.world(0,0)},shelter,openingsRegistry};
 const visit=createGrauVisit({group,roof,resources,record,project,heightAt,data:grauVisit,anchors:coreAnchors,grauContextData});
 const point=visit.focuses['grau-conjunto'].target.clone(),views={offset:visit.focuses['grau-conjunto'].offset,closeOffset:visit.focuses['grau-conjunto'].closeOffset};
 const stats={...visit.stats,catastroReferences:record.catastroBuildingIds.length,cadastralParts:parts.length,coreParts:6,contextParts:contextParts.length,contextDelegated:!!grauContextData,ancillaryOsmBuildings:grauContextData?0:(record.ancillaryBuildings||[]).length,documentedTowerHeight:10.70,batteryHeightFromDitch:6.0,replicaCannons:1,trees:treePixels.length+(chapelInfo?1:0),roofCutaway:'Didactic section of documented fabric; current museum fittings are interpreted'};
 visit.stats=stats;group.userData={id:'grau-vell',landmarkId:'grau-vell',visit,resources,ownedResources:{geometries:resources.geometries,materials:[...resources.materials.values()],textures:[...resources.textures.values()].filter(Boolean)},interpretation:true};
 const focuses={torre:{point:visit.focuses['grau-torre'].target,offset:visit.focuses['grau-torre'].offset},patio:{point:visit.focuses['grau-patio'].target,offset:visit.focuses['grau-patio'].offset},almacen:{point:visit.focuses['grau-almacen'].target,offset:visit.focuses['grau-almacen'].offset},frente:{point:visit.focuses['grau-bateria'].target,offset:visit.focuses['grau-bateria'].offset},poblado:{point:visit.focuses['grau-poblado'].target,offset:visit.focuses['grau-poblado'].offset},ermita:{point:visit.focuses['grau-ermita'].target,offset:visit.focuses['grau-ermita'].offset}};
 return{id:'grau-vell',record,group,currentGroup,roof,roofFocus:'almacen',point,views,focuses,visit,plan:visit.plan,patches,exclusions,vegetationExclusions:exclusions,excludedBuildingIds:[...(record.catastroBuildingIds||[]),...(record.osmBuildingIds||[])],setSection:visit.setSection,dispose:visit.dispose,stats};
}

export function createCoastGrau({heightAt,project,records,data,grauVisit,grauContextData}){
 const list=Array.isArray(records)?records:records?.sites||Object.values(records||{}),record=list.find(s=>s.id==='grau-vell'),group=new THREE.Group();group.name='Costa · Grau Vell';const sites={};if(record){const made=fortification(record,{heightAt,project,data,grauVisit,grauContextData});sites[made.id]=made;group.add(made.group);}return{group,sites,stats:Object.fromEntries(Object.entries(sites).map(([id,s])=>[id,s.stats]))};
}
