import * as THREE from 'three';
// V18 — Vía del Pòrtic. Measured published dimensions, registered footprints,
// and an explicitly interpretive archaeological/museographic arrangement.
const PI=Math.PI,UP=new THREE.Vector3(0,1,0),ID=new THREE.Matrix4(),LON=111320*Math.cos(39.679*PI/180);
const noise=n=>{const v=Math.sin(n*127.13+34.19)*43758.5453;return v-Math.floor(v);};
const geo=p=>[-.278+p.x/LON,39.679-p.z/111320];
const projectDefault=(lon,lat)=>({x:(lon+.278)*LON,z:(39.679-lat)*111320});
export const porticPeriods=[{id:'via',label:'La calle y el agua',color:'#d7b36b'},{id:'monumental',label:'Monumentos y primeros usos',color:'#b6c593'},{id:'domestico',label:'Casas y vida cotidiana',color:'#c99bba'},{id:'tardia',label:'Transformaciones tardías',color:'#ae927c'},{id:'medieval',label:'La ocupación medieval',color:'#80aa85'},{id:'contemporanea',label:'Museo y ciudad actual',color:'#7fb7c4'}];
const DEFS={stone:{color:'#b8b09d',roughness:.98,map:'stone'},ashlar:{color:'#a5a59d',roughness:.96,map:'stone'},rubble:{color:'#b1a084',roughness:1,map:'rubble'},earth:{color:'#9c8b70',roughness:1,map:'earth'},gravel:{color:'#ddd9cb',roughness:1,map:'gravel'},sand:{color:'#c3ae88',roughness:1,map:'earth'},hydraulic:{color:'#ba9c86',roughness:.97,map:'plaster'},tile:{color:'#a5755a',roughness:.98,map:'tiles'},wood:{color:'#8b6448',roughness:.88,map:'wood'},metal:{color:'#292e31',roughness:.66,metalness:.24},black:{color:'#303639',roughness:.97,map:'plaster'},concrete:{color:'#797c79',roughness:.96,map:'plaster'},plaster:{color:'#e2d9c8',roughness:.96,map:'plaster'},brick:{color:'#ac755d',roughness:.98,map:'tiles'},shadow:{color:'#242c2e',roughness:1},glass:{color:'#a4c4c5',roughness:.20,metalness:.06,opacity:.20},steel:{color:'#9ea7a6',roughness:.56,metalness:.55},label:{color:'#c9cbbd',roughness:.96},hypothesis:{color:'#81c0c2',roughness:.86,opacity:.35},roof:{color:'#8e8d84',roughness:.97,map:'tiles'},light:{color:'#ffe6c6',roughness:.45}};
function texture(type){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=type==='gravel'?'#eeece4':type==='wood'?'#d8c2a2':'#dfdbcf';x.fillRect(0,0,256,256);
 if(type==='ashlar'){
  x.fillStyle='#aaa89c';x.fillRect(0,0,256,256);
  for(let row=0;row<8;row++){const h=32,off=row%2?28:0;for(let col=-1;col<6;col++){const left=col*57+off,w=54.5,n=noise(row*61+col+33),grey=Math.floor(192+n*42);x.fillStyle='rgb('+grey+','+(grey-3)+','+(grey-12)+')';x.fillRect(left+1,row*h+1,w,h-2.5);x.fillStyle='rgba(255,248,222,.17)';x.fillRect(left+1,row*h+1,w,1);x.fillStyle='rgba(44,39,27,.11)';x.fillRect(left+1,row*h+h-2,w,1);for(let i=0;i<16;i++){x.fillStyle='rgba(55,48,35,'+(.012+noise(i+col*11+row*81)*.025)+')';x.fillRect(left+noise(i+12)*w,row*h+noise(i+90)*h,1+noise(i)*5,.6+noise(i+6)*2);}}}
 }else if(type==='wood'){
  for(let i=0;i<110;i++){x.beginPath();x.moveTo(i*2.5,0);for(let yy=0;yy<=256;yy+=8)x.lineTo(i*2.5+Math.sin(yy*.028+i*.7)*1.4,yy);x.strokeStyle='rgba(50,27,12,'+(.035+noise(i)*.15)+')';x.lineWidth=.3+noise(i+20)*.7;x.stroke();}
  for(const yy of[64,192]){x.beginPath();x.ellipse(50+yy*.3,yy,4,15,.1,0,PI*2);x.strokeStyle='rgba(70,37,16,.17)';x.stroke();}
 }else if(type==='tiles'||type==='brick'){
  for(let row=0;row<16;row++)for(let j=-1;j<12;j++){const xx=j*26+(row%2?13:0),yy=row*16;x.fillStyle='rgba(67,39,24,'+(.03+noise(row*73+j)*.16)+')';x.fillRect(xx+.6,yy+.6,24.8,14.8);x.fillStyle='rgba(238,226,205,.27)';x.fillRect(xx,yy,26,.8);x.fillRect(xx,yy,.8,16);}
 }else if(type==='marble'){
  for(let j=0;j<18;j++){x.beginPath();x.moveTo(-20,j*17);for(let i=0;i<20;i++)x.lineTo(i*16,j*17+Math.sin(i*.7+j)*9);x.strokeStyle='rgba(76,76,71,.045)';x.lineWidth=.7;x.stroke();}
 }
 for(let i=0;i<6500;i++){const n=noise(i+9);x.fillStyle=(i%2?'rgba(49,42,30,':'rgba(255,249,231,')+(.018+n*.09)+')';x.fillRect(noise(i)*256,noise(i+411)*256,type==='stone'?1.7:.8,type==='paving'?1.5:.8);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
class Batch{
 constructor(){this.parts=new Map();const cube=new THREE.BoxGeometry(1,1,1);this.cube=cube.toNonIndexed();cube.dispose();}
 key(component,period,kind){return[component,period,kind].join('|');}
 geom(key,geo,m=ID,tint=1){const g=geo.index?geo.toNonIndexed():geo;if(!g.attributes.normal)g.computeVertexNormals();let a=this.parts.get(key);if(!a){a={p:[],n:[],u:[],c:[]};this.parts.set(key,a);}const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),nv=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m),kind=key.split('|')[2];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);nv.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();a.p.push(v.x,v.y,v.z);a.n.push(nv.x,nv.y,nv.z);const ax=Math.abs(nv.x),ay=Math.abs(nv.y),az=Math.abs(nv.z),scale=kind==='brick'?1.6:kind==='paving'?2.0:kind==='wood'||kind==='deck'?2.8:3.1;a.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/scale,(ay>ax&&ay>az?v.z:v.y)/scale);a.c.push(tint,tint,tint);}if(g!==geo)g.dispose();}
 box(k,x,y,z,w,h,d,yaw=0,tint=1){if(w<=0||h<=0||d<=0)return;this.geom(k,this.cube,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(w,h,d)),tint);}
 raw(k,p,tint=1){if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geom(k,g,ID,tint);g.dispose();}
 cylinder(k,x,y,z,rt,rb,h,n=16,tint=1){const g=new THREE.CylinderGeometry(rt,rb,h,n);this.geom(k,g,new THREE.Matrix4().makeTranslation(x,y,z),tint);g.dispose();}
 beam(k,a,c,r=.035,tint=1,n=8){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...c),v=vb.clone().sub(va);if(v.length()<.001)return;const g=new THREE.CylinderGeometry(r,r,v.length(),n),m=new THREE.Matrix4().compose(va.add(vb).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,v.normalize()),new THREE.Vector3(1,1,1));this.geom(k,g,m,tint);g.dispose();}
 finish(group,resources,textures){for(const[key,a]of this.parts){const[component,period,kind]=key.split('|'),def=DEFS[kind],mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness||0,map:def.map?textures[def.map]:null,vertexColors:true,side:THREE.DoubleSide,transparent:!!def.opacity,opacity:def.opacity??1,depthWrite:!def.opacity});if(def.map&&kind!=='paving'){mat.bumpMap=textures[def.map];mat.bumpScale=kind==='ashlar'?.045:kind==='stone'||kind==='rubble'?.028:.012;}const g=new THREE.BufferGeometry();for(const[n,arr,size]of[['position',a.p,3],['normal',a.n,3],['uv',a.u,2],['color',a.c,3]])g.setAttribute(n,new THREE.Float32BufferAttribute(arr,size));g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.name='Vía del Pòrtic · '+component+' · '+kind;mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;if(kind==='light'){mat.emissive.set('#ffe1ac');mat.emissiveIntensity=.65;}mesh.userData={porticFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap};group.add(mesh);resources.materials.push(mat);resources.geometries.push(g);}this.cube.dispose();}
}
const quad=(p,a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
const clean=(p,project)=>{const a=p.map(c=>Array.isArray(c)?project(...c):c);if(a.length>2&&Math.hypot(a[0].x-a.at(-1).x,a[0].z-a.at(-1).z)<.03)a.pop();return a;};
const center=p=>({x:p.reduce((s,p)=>s+p.x,0)/p.length,z:p.reduce((s,p)=>s+p.z,0)/p.length});
function frame(x,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,p:(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c],world:(u,v)=>({x:x+u*c+v*s,z:z-u*s+v*c}),box:(b,k,u,y,v,w,h,d,rotation=0,tint=1)=>b.box(k,x+u*c+v*s,y,z-u*s+v*c,w,h,d,yaw+rotation,tint)};}
function edgeFrame(a,c,out=1){return frame((a.x+c.x)/2,(a.z+c.z)/2,-Math.atan2(c.z-a.z,c.x-a.x)+(out<0?PI:0));}
function path(points,Class=THREE.Shape){const s=new Class();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
const rect=(w,h,x=0,y=0)=>[[x-w/2,y],[x+w/2,y],[x+w/2,y+h],[x-w/2,y+h]];
function arch(w,h,rise=w/2){const r=w/2,spring=h-rise,p=[[-r,0],[-r,spring]];for(let i=1;i<=32;i++){const a=PI-i*PI/32;p.push([Math.cos(a)*r,spring+Math.sin(a)*rise]);}p.push([r,0]);return p;}
function shape(b,k,points,f,y,z,depth=.35,holes=[]){const s=path(points);for(const h of holes)s.holes.push(path([...h].reverse(),THREE.Path));const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:24,steps:1});g.translate(0,0,-depth/2);const m=new THREE.Matrix4().makeRotationY(f.yaw);m.setPosition(...f.p(0,y,z));b.geom(k,g,m);g.dispose();}
function flat(b,k,poly,height,tint=1,holes=[]){const tri=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(p.x,-p.z)),holes.map(h=>h.map(p=>new THREE.Vector2(p.x,-p.z)))),all=[...poly,...holes.flat()],verts=[];for(const ix of tri)verts.push(...ix.flatMap(i=>[all[i].x,typeof height==='function'?height(all[i].x,all[i].z):height,all[i].z]));b.raw(k,verts,tint);}
function slab(b,k,poly,top,depth=.2,tint=1){flat(b,k,poly,top,tint);for(let i=0;i<poly.length;i++){const a=poly[i],c=poly[(i+1)%poly.length],p=[];quad(p,[a.x,top,a.z],[c.x,top,c.z],[c.x,top-depth,c.z],[a.x,top-depth,a.z]);b.raw(k,p,tint*.95);}}
function wall(b,k,a,c,bottom,top,depth=.35,tint=1){const f=edgeFrame(a,c),len=Math.hypot(c.x-a.x,c.z-a.z);f.box(b,k,0,(bottom+top)/2,0,len,top-bottom,depth,0,tint);}
// A single mitred ring avoids coincident top faces at coping corners.
function polygonBand(b,k,poly,bottom,top,width,skipEdges=[]){
 const skip=new Set(skipEdges);
 const area=poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p.x*q.z-q.x*p.z;},0),sign=area>=0?1:-1;
 const outward=poly.map((p,i)=>{const q=poly[(i+1)%poly.length],dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz);return{x:sign*dz/len,z:-sign*dx/len};});
 const offset=d=>poly.map((p,i)=>{const a=outward[(i+poly.length-1)%poly.length],c=outward[i],divisor=1+a.x*c.x+a.z*c.z;return{x:p.x+(a.x+c.x)*d/divisor,z:p.z+(a.z+c.z)*d/divisor};});
 const outer=offset(width/2),inner=offset(-width/2),verts=[];
 for(let i=0;i<poly.length;i++){if(skip.has(i))continue;const j=(i+1)%poly.length,a=outer[i],c=outer[j],d=inner[i],e=inner[j];quad(verts,[a.x,top,a.z],[c.x,top,c.z],[e.x,top,e.z],[d.x,top,d.z]);quad(verts,[d.x,bottom,d.z],[e.x,bottom,e.z],[c.x,bottom,c.z],[a.x,bottom,a.z]);quad(verts,[a.x,bottom,a.z],[c.x,bottom,c.z],[c.x,top,c.z],[a.x,top,a.z]);quad(verts,[e.x,bottom,e.z],[d.x,bottom,d.z],[d.x,top,d.z],[e.x,top,e.z]);if(skip.has((i+poly.length-1)%poly.length))quad(verts,[d.x,bottom,d.z],[a.x,bottom,a.z],[a.x,top,a.z],[d.x,top,d.z]);if(skip.has(j))quad(verts,[c.x,bottom,c.z],[e.x,bottom,e.z],[e.x,top,e.z],[c.x,top,c.z]);}
 if(area>=0)for(let i=0;i<verts.length;i+=9){const a=verts.slice(i+3,i+6);verts.splice(i+3,3,...verts.slice(i+6,i+9));verts.splice(i+6,3,...a);}
 b.raw(k,verts);
}
function ring(b,k,f,x,y,z,w,h,rise=w/2,thick=.18,depth=.3,jambs=true){const n=26,innerW=w/2,outerW=innerW+thick,spring=h-rise;for(let i=0;i<n;i++){const a=i/n*PI,c=(i+1)/n*PI,p=[],at=(ang,r,rr,zz)=>f.p(x+Math.cos(ang)*r,y+spring+Math.sin(ang)*rr,z+zz);quad(p,at(a,innerW,rise,depth/2),at(c,innerW,rise,depth/2),at(c,outerW,rise+thick,depth/2),at(a,outerW,rise+thick,depth/2));quad(p,at(c,innerW,rise,-depth/2),at(a,innerW,rise,-depth/2),at(a,outerW,rise+thick,-depth/2),at(c,outerW,rise+thick,-depth/2));quad(p,at(a,innerW,rise,-depth/2),at(c,innerW,rise,-depth/2),at(c,innerW,rise,depth/2),at(a,innerW,rise,depth/2));quad(p,at(a,outerW,rise+thick,depth/2),at(c,outerW,rise+thick,depth/2),at(c,outerW,rise+thick,-depth/2),at(a,outerW,rise+thick,-depth/2));b.raw(k,p,.89+noise(i+1)*.17);}if(jambs)for(const side of[-1,1])f.box(b,k,x+side*(w+thick)/2,y+spring/2,z,thick,spring,depth);}
function railing(b,K,a,c,y,height=1.05,{glass=false}={}){const f=edgeFrame(a,c),len=Math.hypot(c.x-a.x,c.z-a.z),n=Math.max(2,Math.ceil(len/(glass?1.7:.17)));f.box(b,K('metal'),0,y+height,0,len,.045,.045);f.box(b,K('metal'),0,y+.055,0,len,.045,.055);for(let i=0;i<=n;i++)f.box(b,K('metal'),-len/2+len*i/n,y+height/2,0,glass?.04:.025,height,glass?.04:.025);if(glass)f.box(b,K('glass'),0,y+height*.51,0,len-.05,height-.12,.025);}
function window(b,K,f,x,y,z,w,h,{balcony=false,bars=false}={}){f.box(b,K('shadow'),x,y+h/2,z,w,h,.035);for(const s of[-1,1])f.box(b,K('wood'),x+s*(w-.065)/2,y+h/2,z-.025,.065,h,.09);for(const s of[0,1])f.box(b,K('wood'),x,y+h*s,z-.025,w,.07,.09);f.box(b,K('wood'),x,y+h/2,z-.07,.055,h,.05);f.box(b,K('glass'),x,y+h/2,z+.025,w-.1,h-.09,.02);f.box(b,K('trim'),x,y-.075,z-.08,w+.23,.15,.32);if(bars)for(let i=1;i<7;i++)f.box(b,K('metal'),x-w/2+i*w/7,y+h/2,z-.13,.022,h,.026);if(balcony){f.box(b,K('stone'),x,y-.16,z-.40,w+.66,.19,.90);const a=f.world(x-w/2-.30,z-.82),c=f.world(x+w/2+.30,z-.82);railing(b,K,a,c,y-.05);for(const sx of[-1,1])railing(b,K,f.world(x+sx*(w/2+.30),z-.82),f.world(x+sx*(w/2+.30),z-.02),y-.05);}}
function ellipsoid(b,k,p,r,seed=0,detail=1){const g=new THREE.IcosahedronGeometry(1,detail+1),a=g.attributes.position;for(let i=0;i<a.count;i++){const v=new THREE.Vector3().fromBufferAttribute(a,i),s=.96+.035*Math.sin(v.x*13+seed)+.025*Math.cos(v.y*11+seed);v.multiplyScalar(s);a.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();b.geom(k,g,new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion(),new THREE.Vector3(...r)),.9+noise(seed)*.13);g.dispose();}
const XZ=(x,z)=>({x,z});
function subFrame(f,u,v,rotation=0){const p=f.world(u,v);return frame(p.x,p.z,f.yaw+rotation);}
function rectPoly(f,x,z,w,d){return[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]].map(p=>f.world(...p));}
function ellipse(w,h,cy=0,n=48){return Array.from({length:n},(_,i)=>[Math.cos(i*2*PI/n)*w/2,cy+Math.sin(i*2*PI/n)*h/2]);}
function torus(b,k,f,u,y,v,r,t=.045,rx=1,ry=1,orientation='vertical',arc=PI*2){const g=new THREE.TorusGeometry(r,t,6,Math.max(20,Math.ceil(r*28)),arc);if(orientation==='horizontal')g.rotateX(PI/2);const m=new THREE.Matrix4().compose(new THREE.Vector3(...f.p(u,y,v)),new THREE.Quaternion().setFromAxisAngle(UP,f.yaw),new THREE.Vector3(rx,ry,1));b.geom(k,g,m);g.dispose();}
function profileBeam(b,k,f,points,z,r=.06){for(let i=0;i<points.length-1;i++)b.beam(k,f.p(points[i][0],points[i][1],z),f.p(points[i+1][0],points[i+1][1],z),r,1,6);}
// Low, worn rubble is built as actual irregular solids; the published plans are
// registered proportionally. Individual joints and losses are interpretations.
function chippedBlock(b,k,f,x,y,z,w,h,d,seed=0,angle=0){const pts=[],c=Math.cos(angle),s=Math.sin(angle),outline=[[-.5,-.5],[.30,-.5],[.5,-.31],[.5,.35],[.30,.5],[-.40,.5],[-.5,.29]];const top=outline.map(([u,v],i)=>{const xx=x+(u*w)*c+(v*d)*s,zz=z-(u*w)*s+(v*d)*c;return f.p(xx,y+h*(.93+noise(seed+i)*.07),zz);}),bottom=outline.map(([u,v])=>f.p(x+(u*w)*c+(v*d)*s,y,z-(u*w)*s+(v*d)*c));for(let i=1;i<top.length-1;i++)pts.push(...top[0],...top[i],...top[i+1]);for(let i=0;i<top.length;i++)quad(pts,bottom[i],bottom[(i+1)%top.length],top[(i+1)%top.length],top[i]);b.raw(k,pts,.82+noise(seed)*.24);}
function ruinWall(b,K,f,a,c,y,h=.65,width=.5,seed=0){const len=Math.hypot(c[0]-a[0],c[1]-a[1]),ang=-Math.atan2(c[1]-a[1],c[0]-a[0]),n=Math.max(1,Math.ceil(len/.5)),rows=Math.max(1,Math.round(h/.22));f.box(b,K('earth'),(a[0]+c[0])/2,y+h*.40,(a[1]+c[1])/2,len,h*.8,width*.86,ang);for(let row=0;row<rows;row++)for(let i=0;i<n;i++){const t=(i+.5)/n,ch=h/rows*(.87+noise(seed+row*31+i)*.12);chippedBlock(b,K('rubble'),f,a[0]+(c[0]-a[0])*t,y+row*h/rows,a[1]+(c[1]-a[1])*t,len/n-.035,ch,width*(.84+noise(seed+i)*.13),seed+row*51+i,ang);}}
function stoneFloor(b,k,f,poly,y,depth=.12,seed=0){const points=poly.map(([u,v])=>f.world(u,v));slab(b,k,points,y,depth,.88+noise(seed)*.18);}
function polygonFloor(b,k,poly,y,holes=[]){flat(b,k,poly,y,1,holes);}
function localBounds(poly,local){const a=poly.map(local);return{minX:Math.min(...a.map(p=>p.x)),maxX:Math.max(...a.map(p=>p.x)),minZ:Math.min(...a.map(p=>p.z)),maxZ:Math.max(...a.map(p=>p.z))};}
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],c=poly[j];if((a.z>p.z)!==(c.z>p.z)&&p.x<(c.x-a.x)*(p.z-a.z)/(c.z-a.z)+a.x)yes=!yes;}return yes;}
function darkWindow(b,K,f,u,y,v,w,h,balcony=false){f.box(b,K('shadow'),u,y+h/2,v,w,h,.035);for(const side of[-1,1])f.box(b,K('steel'),u+side*(w-.045)/2,y+h/2,v-.035,.045,h,.06);for(const t of[0,1])f.box(b,K('steel'),u,y+h*t,v-.035,w,.045,.06);f.box(b,K('glass'),u,y+h/2,v-.05,w-.07,h-.07,.02);f.box(b,K('plaster'),u,y-.055,v-.08,w+.18,.11,.26);if(balcony){f.box(b,K('concrete'),u,y-.15,v-.43,w+.55,.18,.90);railing(b,K,f.world(u-w/2-.22,v-.83),f.world(u+w/2+.22,v-.83),y-.04,1.02);}}
function gableRoof(b,K,f,x,z,w,d,y,rise=.9){const p=[];quad(p,f.p(x-w/2,y,z-d/2),f.p(x+w/2,y,z-d/2),f.p(x+w/2,y+rise,z),f.p(x-w/2,y+rise,z));quad(p,f.p(x-w/2,y+rise,z),f.p(x+w/2,y+rise,z),f.p(x+w/2,y,z+d/2),f.p(x-w/2,y,z+d/2));b.raw(K('tile'),p);}
const FALLBACK_OUTLINE=[[-.272802,39.680009],[-.272262,39.679854],[-.272592,39.679419],[-.273002,39.679582]];
export function createPortic({record,project=projectDefault,heightAt=()=>38,visitData={},contextData={}}={}){
 const periods=porticPeriods.map(p=>({...p,...(visitData.readingLegend||[]).find(q=>q.id===p.id)})),PERIODS=Object.fromEntries(periods.map(p=>[p.id,p.color]));
 const resources={materials:[],geometries:[],textures:[]},textures={};for(const type of['stone','rubble','earth','gravel','plaster','tiles','wood']){textures[type]=texture(type);resources.textures.push(textures[type]);}
 const group=new THREE.Group();group.name='Vía del Pòrtic · yacimiento y espacio musealizado';
 const northRecord=contextData.coreOutlines?.find(q=>q.parentId?.startsWith('4059201')),rect=northRecord?.minimumRectangleXZ;
 const origin=rect?{x:(rect[0][0]+rect[2][0])/2,z:(rect[0][1]+rect[2][1])/2}:project(...(record?.coordinate||[-.27257375,39.67970795])),yaw=rect?Math.atan2(rect[1][0]-rect[0][0],rect[1][1]-rect[0][1]):-.6478,surface=heightAt(origin.x,origin.z),base=surface-3.45,ceiling=surface-.18,f=frame(origin.x,origin.z,yaw),c=Math.cos(yaw),s=Math.sin(yaw),local=p=>({x:(p.x-origin.x)*c-(p.z-origin.z)*s,z:(p.x-origin.x)*s+(p.z-origin.z)*c});
 const core=(contextData.coreBuildings||[]).map(q=>({...q,poly:clean(q.coordinates,project)}));
 const outline=clean(contextData.coreOutline||contextData.hostOutline||northRecord?.coordinates||FALLBACK_OUTLINE,project);
 const northOutline=clean(contextData.northHostOutline||northRecord?.coordinates||contextData.coreOutline||FALLBACK_OUTLINE,project);
 const bb=localBounds(northOutline,local),roadX=-9.0,bedLimits={minX:-14.3,maxX:16.5,minZ:-32.0,maxZ:32.0};
 const remains=new THREE.Group(),reconstruction=new THREE.Group(),hypotheses=new THREE.Group(),modern=new THREE.Group(),host=new THREE.Group(),ceilingGroup=new THREE.Group(),roof=new THREE.Group(),sewerCovers=new THREE.Group();
 for(const[g,n]of[[remains,'restos conservados y excavados'],[reconstruction,'interpretación del siglo II'],[hypotheses,'alzados hipotéticos'],[modern,'pasarelas y estructura actual'],[host,'edificios actuales sobre el yacimiento'],[ceilingGroup,'forjado sobre el espacio arqueológico'],[roof,'cubiertas restituidas del pórtico'],[sewerCovers,'losas desmontables de la cloaca']]){g.name='Pòrtic · '+n;}
 group.add(remains,reconstruction,hypotheses,modern,host,ceilingGroup);reconstruction.add(roof);remains.add(sewerCovers);
 const a=new Batch(),r=new Batch(),h=new Batch(),m=new Batch(),u=new Batch(),ce=new Batch(),ro=new Batch(),sc=new Batch();
 const K=(component,period='via')=>kind=>[component,period,kind].join('|');
 const box=(b,component,period,kind,x,y,z,w,hh,d,ang=0,t=1)=>f.box(b,K(component,period)(kind),x,y,z,w,hh,d,ang,t);
 // The registration follows the long western edge of the modern block. The
 // northern inflection is preserved; no perfectly straight symmetrical street.
 const roadCenter=z=>roadX+Math.max(0,-17-z)*.19;
 const eastLimit=z=>11.60+.159*z;
 const roadWidth=z=>z<-17?4.1:5.4;
 const roadPoly=[[-30,-1],[-17,-1],[30,-1],[30,1],[-17,1],[-30,1]].map(([z,side])=>f.world(roadCenter(z)+side*roadWidth(z)/2,z));
 const bedPoly=northOutline,sewerHole=[[-30,-1],[-17,-1],[30,-1],[30,1],[-17,1],[-30,1]].map(([z,side])=>f.world(roadCenter(z)+side*.35,z)),basins=[{id:'norte',x:1.5,z:-27,w:3.8,d:3.4},{id:'este',x:5.1,z:-26.5,w:3.2,d:4},{id:'sur',x:9.3,z:1.1,w:3.6,d:4.2}];
 const holes=[sewerHole,...basins.map(q=>rectPoly(f,q.x,q.z,q.w-.5,q.d-.5))];
 for(const b of[a,r]){polygonFloor(b,K('suelo-excavado','via')(b===a?'gravel':'sand'),bedPoly,base-.16,holes);polygonFloor(b,K('fondo-suelo','via')('earth'),bedPoly,base-1.48);}
 // Large irregular limestone pieces follow uneven courses, with different
 // depths and unequal widths. Shared wavering boundaries avoid a tiled grid;
 // the individual joints and find spots remain interpretative, not a survey.
 let slabCount=0,row=0;const pavingCourses=[],pavingWidths=[];
 for(const[start,end]of[[-30,-17],[-17,3],[3,9],[9,30]]){let za=start;while(za<end-.001){
  let zb=Math.min(end,za+.74+noise(8041+row*19)*1.03);if(end-zb<.46)zb=end;
  const z=(za+zb)/2,w=roadWidth(z),cols=3+(noise(9023+row*13)>.62?1:0),weights=Array.from({length:cols},(_,i)=>.60+noise(row*71+i*13+406)*1.18),sum=weights.reduce((n,q)=>n+q,0),edges=[-.5];for(const weight of weights)edges.push(edges.at(-1)+weight/sum);
  const courseEdge=(u,zz,boundary)=>zz===start||zz===end?zz:zz+.095*Math.sin((u+.5)*PI)*Math.sin((u+.5)*5.1+boundary*2.37);
  pavingCourses.push(zb-za);
  for(let col=0;col<cols;col++){
   const seed=row*91+col,ua=edges[col]+.0045,ub=edges[col+1]-.0045,du=Math.min(.025,(ub-ua)*.085),cut=.045+.055*noise(seed+13),top=base+.005+(noise(seed)-.5)*.035;
   const upper=u=>courseEdge(u,za,row)+.016,lower=u=>courseEdge(u,zb,row+1)-.016,mid=(ua+ub)/2;
   const uv=[[ua+du,upper(ua+du)],[mid,upper(mid)],[ub-du,upper(ub-du)],[ub,upper(ub)+cut],[ub,lower(ub)-cut],[ub-du,lower(ub-du)],[mid,lower(mid)],[ua+du,lower(ua+du)],[ua,lower(ua)-cut],[ua,upper(ua)+cut]],poly=uv.map(([u,zz])=>[roadCenter(zz)+u*roadWidth(zz),zz]);
   const isCover=za>=3&&zb<=9&&ua<.35/w&&ub>-.35/w,loss=(row===17&&col===0)||(row===31&&col===2)||(row===43&&col===1);
   if(!loss){stoneFloor(isCover?sc:a,K('losado','via')('ashlar'),f,poly,top,.17,seed);slabCount++;}
   stoneFloor(r,K('losado','via')('ashlar'),f,poly,base+.006,.17,seed);pavingWidths.push((ub-ua)*w);
  }za=zb;row++;
 }}
 // Hollow sewer, published clear width0.68m; its floor remains well below the
 // road. Separate covers reveal a short diagnostic segment in cut mode.
 for(const b of[a,r])for(const[za,zb]of[[-30,-17],[-17,30]]){const aa=f.world(roadCenter(za),za),bb=f.world(roadCenter(zb),zb),ef=edgeFrame(aa,bb),len=Math.hypot(bb.x-aa.x,bb.z-aa.z);ef.box(b,K('cloaca','via')('shadow'),0,base-1.295,0,len,.08,.68);for(const side of[-1,1])for(let j=0;j<6;j++)ef.box(b,K('cloaca','via')('ashlar'),0,base-1.20+j*.20,side*.54,len,.18,.40);}
 const westSpacings=[2.95,4.04,4.20,3.20,2.83,3.08,3.11,1.92],eastSpacings=[3.14,3.50,3.45,2.90];
 const accumulate=(start,spacings)=>[start,...spacings.map((_,i)=>start+spacings.slice(0,i+1).reduce((p,v)=>p+v,0))];
 const westZ=accumulate(-10.8,westSpacings),eastZ=accumulate(-7.0,eastSpacings),piers=[];
 for(const[side,zs]of[[-1,westZ],[1,eastZ]])for(let i=0;i<zs.length;i++){
  const x=roadX+side*3.20,z=zs[i],seed=200+i+side*30,baseW=.60+noise(seed)*.15,remainH=i%4===0?.25:.53+noise(seed+1)*.42;piers.push({side:side<0?'west':'east',x,z,width:baseW,retainedHeight:remainH});
  for(const b of[a,r])chippedBlock(b,K('pilares-portico','via')('ashlar'),f,x,base+.04,z,baseW,.23,baseW,seed);
  for(let row=0;row<Math.ceil(remainH/.32);row++)chippedBlock(a,K('pilares-portico','via')('stone'),f,x,base+.27+row*.32,z,.54,Math.min(.31,remainH-row*.32),.55,seed+row*3);
  for(let row=0;row<7;row++)chippedBlock(r,K('pilares-portico','via')('ashlar'),f,x,base+.27+row*.43,z,.55,.41,.56,seed+row*3);
  box(r,'capiteles-restituidos','via','stone',x,base+3.44,z,.70,.22,.70);
 }
 for(const b of[a,r])for(const side of[-1,1])box(b,'aceras','via','stone',roadX+side*3.20,base+.08,4,1.05,.16,36.4);
 // Timber and roof pitches are typological additions to the published supports.
 for(const side of[-1,1]){const x=roadX+side*3.2,outer=side<0?roadX-5.0:roadX+6.5;box(r,'vigas-portico','via','wood',x,base+3.64,3,.22,.25,30);for(let z=-11;z<19;z+=2.1)box(r,'vigas-portico','via','wood',(x+outer)/2,base+3.75,z,Math.abs(outer-x),.14,.15);const verts=[];quad(verts,f.p(x,base+3.91,-12),f.p(outer,base+4.35,-12),f.p(outer,base+4.35,18),f.p(x,base+3.91,18));ro.raw(K('techo-portico','via')('tile'),verts);}
 // Public podium: preserved western frontage and returns only; the complete
 // cella, order and roof remain a separately controlled conjectural envelope.
 const podiumWalls=[[-1.0,-23.4,-1.0,.95,1.53],[-1.0,-23.4,7.0,-23.4,1.53],[-1.0,.95,7.5,.95,1.30]];
 podiumWalls.forEach((q,i)=>ruinWall(a,K('podio','monumental'),f,q.slice(0,2),q.slice(2,4),base-.12,.60+i*.08,q[4],330+i*20));
 const excavatedPodium=[[-.25,-22.65],[6.5,-22.65],[10.6,.20],[-.25,.20]];stoneFloor(a,K('relleno-podio','monumental')('earth'),f,excavatedPodium,base-.04,.19,320);
 for(let i=0;i<8;i++)chippedBlock(a,K('sillares-podio','monumental')('ashlar'),f,-1.0,base+.16,-22.6+i*.72,1.39,.43,.68,440+i);
 stoneFloor(r,K('podio-restituido','monumental')('stone'),f,[[-1,-23.4],[7.0,-23.4],[11.0,.95],[-1,.95]],base+.78,.78,333);stoneFloor(r,K('cornisa-podio','monumental')('ashlar'),f,[[-1.12,-23.5],[7.10,-23.5],[11.12,1.05],[-1.12,1.05]],base+.98,.20,334);
 for(let i=0;i<5;i++)box(r,'acceso-podio','monumental','ashlar',-2.7+i*.38,base+.10+i*.17,-10.8,.43,.20,3.8);
 // Footings mark the proposed arch. The upper profile is not presented as
 // surviving architecture and is only visible with hypothesis enabled.
 for(const[x,w,d]of[[roadX-3.45,3,3],[roadX+3.45,2.8,3.5]]){for(const b of[a,r]){box(b,'basamentos-arco','monumental','rubble',x,base-.12,-18.8,w,.42,d);for(let j=0;j<3;j++)chippedBlock(b,K('basamentos-arco','monumental')('ashlar'),f,x+(j-1)*.68,base+.08,-18.8,.66,.28,.95,512+j);}}
 const archF=subFrame(f,roadX,-18.8);ring(h,K('arco-hipotetico','monumental')('hypothesis'),archF,0,base+.25,0,3.5,5.2,1.75,.55,1.1,true);
 for(const z of[-19,-11,-3]){const p=f.p(1.2,base+3.2,z);h.cylinder(K('edificio-hipotetico','monumental')('hypothesis'),p[0],p[1],p[2],.30,.36,4.6,14);}
 for(const[a0,c0]of[[[4.5,-21],[4.5,-1]],[[4.5,-21],[12,-21]],[[4.5,-1],[12,-1]]])wall(h,K('edificio-hipotetico','monumental')('hypothesis'),f.world(...a0),f.world(...c0),base+.98,base+5.7,.40);
 const hg=[];quad(hg,f.p(1,base+5.8,-23),f.p(13,base+5.8,-23),f.p(13,base+7,-11),f.p(1,base+7,-11));quad(hg,f.p(1,base+7,-11),f.p(13,base+7,-11),f.p(13,base+5.8,1),f.p(1,base+5.8,1));h.raw(K('cubierta-hipotetica','monumental')('hypothesis'),hg);
 // Water-related deposits are deliberately dry in the conserved scene.
 for(const q of basins){for(const b of[a,r]){box(b,'depositos','monumental','hydraulic',q.x,base-.56,q.z,q.w-.4,.12,q.d-.4);for(const side of[-1,1]){ruinWall(b,K('depositos','monumental'),f,[q.x-q.w/2,q.z+side*q.d/2],[q.x+q.w/2,q.z+side*q.d/2],base-.55,.70,.34,580);ruinWall(b,K('depositos','monumental'),f,[q.x+side*q.w/2,q.z-q.d/2],[q.x+side*q.w/2,q.z+q.d/2],base-.55,.70,.34,590);}}}
 // Later rooms include interrupted thresholds: views can genuinely see through
 // their entrances rather than facing solid invisible obstruction geometry.
 const roomWalls=[[-1,6,6.5,6],[8.0,6,15,6],[-1,6,-1,14],[-1,16,-1,29],[-1,14,3.8,14],[5.2,14,15,14],[-1,22,6.5,22],[8.0,22,15,22],[-1,29,15,29],[7.2,6,7.2,19.5],[7.2,21,7.2,29],[15,6,15,29]];
 for(const q of roomWalls){q[0]=Math.min(q[0],eastLimit(q[1])-.7);q[2]=Math.min(q[2],eastLimit(q[3])-.7);}
 roomWalls.forEach((q,i)=>ruinWall(a,K('habitaciones-romanas','domestico'),f,q.slice(0,2),q.slice(2,4),base-.14,.50+noise(i)*.32,.48,620+i*25));
 for(const[x,z]of[[-1,15],[4.5,14],[7.2,20.25]])stoneFloor(a,K('umbrales','domestico')('ashlar'),f,[[x-.7,z-.30],[x+.7,z-.30],[x+.7,z+.30],[x-.7,z+.30]],base+.03,.16,700+x);
 for(const z of[7.2,17.1]){box(a,'desagues','domestico','shadow',-4.25,base-.34,z,6.4,.10,.30);for(const side of[-1,1])box(a,'desagues','domestico','stone',-4.25,base-.13,z+side*.25,6.4,.34,.18);}
 // Latrine bench: broken slabs over a drain, not complete furniture.
 for(let i=0;i<3;i++){chippedBlock(a,K('letrinas','domestico')('ashlar'),f,-3.1+i*.61,base+.22,17.9,.58,.20,.58,750+i);box(a,'letrinas','domestico','shadow',-3.1+i*.61,base+.426,17.9,.15,.012,.23);}
 const funerary=[];for(let i=0;i<3;i++){const x=1.7+i*4.4,z=25.5,w=3.8,d=4.8;funerary.push({x,z,w,d});for(const side of[-1,1]){ruinWall(a,K('recintos-funerarios','monumental'),f,[x-w/2,z+side*d/2],[x+w/2,z+side*d/2],base-.10,.30,.37,800+i);ruinWall(a,K('recintos-funerarios','monumental'),f,[x+side*w/2,z-d/2],[x+side*w/2,z+d/2],base-.10,.30,.37,810+i);}if(i===0){box(a,'loculi','monumental','shadow',x,base-.04,z,1.84,.04,.49);for(const side of[-1,1])box(a,'loculi','monumental','tile',x,base+.01,z+side*.30,1.95,.10,.10);}else{box(a,'loculi','monumental','shadow',x,base-.04,z,.55,.04,.55);for(const side of[-1,1]){box(a,'loculi','monumental','tile',x,base+.02,z+side*.34,.79,.12,.12);box(a,'loculi','monumental','tile',x+side*.34,base+.02,z,.12,.12,.79);}}}
 // Two late funerary recesses in the disused drain, without displayed remains.
 for(const z of[4.4,7.1]){box(a,'reutilizacion-funeraria','tardia','sand',roadX,base-1.16,z,.62,.09,1.90);box(a,'reutilizacion-funeraria','tardia','tile',roadX,base-1.02,z+.99,.64,.24,.10);}
 // Medieval occupation is legible as its own low fabric, not simultaneous with
 // the completed second-century reconstruction.
 const medieval=[{a:[6,10],c:[14,11.1]},{a:[6,10],c:[5.3,18]},{a:[5.3,18],c:[13.3,19.1]},{a:[13.3,19.1],c:[14,11.1]},{a:[9.9,10.55],c:[9.2,18.55]}];
 for(const q of medieval){q.a[0]=Math.min(q.a[0],eastLimit(q.a[1])-.7);q.c[0]=Math.min(q.c[0],eastLimit(q.c[1])-.7);}
 for(let i=0;i<medieval.length;i++)ruinWall(a,K('fabricas-medievales','medieval'),f,medieval[i].a,medieval[i].c,base+.16,.40,.38,900+i*19);
 for(let i=0;i<95;i++){const x=1.0+noise(i+1001)*5.5,z=15.2+noise(i+1201)*5.0;box(a,'fragmentos-tegula','domestico','tile',x,base-.085+noise(i+1)*.05,z,.18+noise(i)*.22,.035,.15+noise(i+4)*.12,noise(i+2)*PI,.78+noise(i+8)*.35);}
 // Restrained real gravel solids soften the excavated surfaces without turning
 // every pebble into a separate draw call.
 for(let i=0;i<1300;i++){const x=bedLimits.minX+noise(i+3000)*(bedLimits.maxX-bedLimits.minX),z=-31+noise(i+4500)*62;if(!inside(f.world(x,z),northOutline)||Math.abs(x-roadCenter(z))<roadWidth(z)/2+.15||basins.some(q=>Math.abs(x-q.x)<q.w/2&&Math.abs(z-q.z)<q.d/2))continue;chippedBlock(a,K('grava','via')('gravel'),f,x,base-.155,z,.06+noise(i)*.07,.04,.06+noise(i+2)*.06,i+3000,noise(i+4)*PI);}
 // Modern musealization. Architectural supports are dark, so the original
 // masonry remains readable. The superstructure is removable independently.
 const deckY=base+.43,deckX=-4.75,deckSegments=[{x:deckX,z:4,w:1.7,d:51},{x:.1,z:-28.1,w:12.8,d:1.7},{x:7.9,z:-11,w:1.6,d:32.4,rotation:.145}];
 const deckBox=(q,component='pasarela')=>{const df=subFrame(f,q.x,q.z,q.rotation||0);df.box(m,K(component,'contemporanea')('wood'),0,deckY-.075,0,q.w,.15,q.d);for(let zz=-q.d/2;zz<q.d/2;zz+=.28)df.box(m,K('juntas-tarima','contemporanea')('shadow'),0,deckY+.003,zz,q.w,.008,.009);};
 deckSegments.forEach(q=>deckBox(q));
 for(const q of deckSegments){const df=subFrame(f,q.x,q.z,q.rotation||0);if(q.d>q.w){for(const side of[-1,1])railing(m,K('barandilla-pasarela','contemporanea'),df.world(side*q.w/2,-q.d/2),df.world(side*q.w/2,q.d/2),deckY,1.02,{glass:true});}else railing(m,K('barandilla-pasarela','contemporanea'),df.world(-q.w/2,.85),df.world(q.w/2,.85),deckY,1.02,{glass:true});}
 // Wood handrails, observed in the accessible museum arrangement.
 for(const side of[-1,1])box(m,'pasamanos-madera','contemporanea','wood',deckX+side*.85,deckY+1.055,4,.055,.055,51);
 const supports=[];for(const x of[-14.0,2.2,13.4])for(const z of[-26,-12,3.5,18,29]){const p=f.world(x,z);if(!inside(p,northOutline))continue;supports.push({x,z,w:x>10?.70:.80});box(m,'pilares-modernos','contemporanea','black',x,(base+ceiling)/2,z,x>10?.70:.80,ceiling-base,.88);}
 for(const z of[-26,-12,3.5,18,29]){const xmin=-15.9,xmax=eastLimit(z)-.6;box(ce,'vigas-modernas','contemporanea','black',(xmin+xmax)/2,ceiling-.27,z,xmax-xmin,.54,.72);}
 polygonFloor(ce,K('forjado-moderno','contemporanea')('black'),northOutline,ceiling);
 // Perimeter supports and windows coincide with the registered shell. The
 // glazing is kept translucent; actual passages are left open in the entrance.
 const signed=poly=>poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p.x*q.z-q.x*p.z;},0);
 const shellOutlines=(contextData.coreOutlines?.length?contextData.coreOutlines:[{coordinates:FALLBACK_OUTLINE,parentId:'fallback'}]).map(q=>({...q,poly:clean(q.coordinates,project)}));
 for(const shell of shellOutlines){const poly=shell.poly;polygonFloor(ce,K('forjado-moderno','contemporanea')('black'),poly,ceiling-.015);
  for(let i=0;i<poly.length;i++){const aa=poly[i],bb=poly[(i+1)%poly.length],len=Math.hypot(bb.x-aa.x,bb.z-aa.z);if(len<.40)continue;const ef=edgeFrame(aa,bb,signed(poly)>=0?1:-1),mid=local({x:(aa.x+bb.x)/2,z:(aa.z+bb.z)/2}),out=ef.world(0,-.15),isBoundary=!shellOutlines.some(other=>other!==shell&&inside(out,other.poly));if(!isBoundary)continue;const west=mid.x<-6,glazed=west&&len>3;
   if(glazed){ef.box(m,K('zócalo-moderno','contemporanea')('black'),0,base+.31,0,len,.62,.28);ef.box(m,K('cerramiento-cristal','contemporanea')('glass'),0,(base+.62+ceiling-.25)/2,0,len,ceiling-.25-base-.62,.028);ef.box(m,K('dintel-cristal','contemporanea')('black'),0,ceiling-.12,0,len,.25,.28);for(let u0=-len/2;u0<=len/2;u0+=1.35)ef.box(m,K('montantes-cristal','contemporanea')('metal'),u0,(base+.62+ceiling-.25)/2,-.035,.045,ceiling-.25-base-.62,.07);}
   else wall(m,K('cerramiento-opaco','contemporanea')('black'),aa,bb,base-.18,ceiling,.28);
  }
 }
 // Southern linked exhibition area: registered floor volume, low domestic
 // fragments and a perimeter deck. Internal measurements remain interpretive.
 const south=shellOutlines.find(q=>q.parentId?.startsWith('4059202'));let southCenter=null;
 if(south){southCenter=local(center(south.poly));polygonFloor(a,K('sector-sur','domestico')('gravel'),south.poly,base-.16);polygonFloor(a,K('fondo-sur','domestico')('earth'),south.poly,base-1.46);const sx=southCenter.x,sz=southCenter.z;
  for(let j=0;j<3;j++)for(let i=0;i<2;i++){const x=sx-7+i*7.7,z=sz-10+j*7.4;for(const[a0,c0]of[[[x-3,z-3],[x+3,z-3]],[[x-3,z-3],[x-3,z+3]],[[x+3,z-3],[x+3,z+3]]])ruinWall(a,K('sector-sur-habitaciones','domestico'),f,a0,c0,base-.1,.56,.43,1200+i+j*13);}
  const sdeck={x:sx-12,z:sz,w:1.7,d:32};deckBox(sdeck,'pasarela-sur');for(const side of[-1,1])railing(m,K('barandilla-sur','contemporanea'),f.world(sdeck.x+side*.85,sz-16),f.world(sdeck.x+side*.85,sz+16),deckY,1.02,{glass:true});
  const linkA=f.world(deckX,29.5),linkB=f.world(sdeck.x,sz-16);const ef=edgeFrame(linkA,linkB);ef.box(m,K('conexion-sectores','contemporanea')('wood'),0,deckY-.07,0,Math.hypot(linkA.x-linkB.x,linkA.z-linkB.z),.14,1.7);
  for(const x of[sx-8,sx+3,sx+12])for(const z of[sz-13,sz,sz+13])if(inside(f.world(x,z),south.poly))box(m,'pilares-sur','contemporanea','black',x,(base+ceiling)/2,z,.75,ceiling-base,.75);
 }
 // Upper residential buildings: exact footprint parts and recorded height
 // estimates. Window rhythm is a restrained typological interpretation.
 const upperRecords=core.length?core:[{id:'fallback',poly:northOutline,levels:5,surfaceHeightEstimate:18,holes:[]}];
 const hostHeights=[];for(const part of upperRecords){const poly=part.poly;if(poly.length<3)continue;const footprintCenter=center(poly),levels=Number(part.levels)||5,estimate=part.surfaceHeightEstimate,review=levels===1&&estimate>=9,raw=part.modelHeight??(review?3.05:estimate??levels*3.05),hh=Math.max(3,Math.min(28,raw)),top=surface+hh,partHoles=(part.holes||[]).map(q=>clean(q,project));hostHeights.push({id:part.id,height:hh,heightReview:review?'single-storey part uses storeys; high DSM signal may belong to neighbours':'source estimate or recorded storeys'});
  polygonFloor(u,K('azoteas-actuales','contemporanea')('roof'),poly,top,partHoles);for(let i=0;i<poly.length;i++){const aa=poly[i],bb=poly[(i+1)%poly.length],len=Math.hypot(bb.x-aa.x,bb.z-aa.z);if(len<.30)continue;const ef=edgeFrame(aa,bb,signed(poly)>=0?1:-1),probe=ef.world(0,-.10),isOuter=!core.some(q=>q!==part&&inside(probe,q.poly));wall(u,K('volumen-actual','contemporanea')('plaster'),aa,bb,surface,top,.16);if(!isOuter)continue;
   wall(u,K('cornisa-actual','contemporanea')('concrete'),aa,bb,top-.13,top+.09,.24);const floors=Math.max(1,Math.floor((hh-.65)/3.03)),cols=Math.floor(len/2.5);for(let row=0;row<floors;row++)for(let col=0;col<cols;col++){const at=-len/2+(col+.5)*len/cols,w=Math.min(1.35,len/cols-.70);darkWindow(u,K('huecos-actuales','contemporanea'),ef,at,surface+.85+row*3.03,-.09,w,1.55,(row>0&&col%3===1&&len>7));}
  }
 }
 // Recessed exhibit lighting, with a short rail and independently visible
 // luminaires. These light archaeological geometry, not made-up screens.
 const interiorLights=new THREE.Group();interiorLights.name='Pòrtic · iluminación interior';modern.add(interiorLights);
 for(const z of[-22,-7,8,23]){box(m,'carriles-luz','contemporanea','metal',-5,ceiling-.25,z,8,.035,.035);for(const x of[-8,5]){const p=f.p(x,ceiling-.35,z);m.cylinder(K('focos','contemporanea')('metal'),p[0],p[1],p[2],.085,.085,.20,10);m.cylinder(K('lentes-luz','contemporanea')('light'),p[0],p[1]-.105,p[2],.074,.074,.014,10);const light=new THREE.PointLight('#ffe8ca',55,15,2);light.position.set(...f.p(x,ceiling-.42,z));interiorLights.add(light);}}
 for(const q of[{x:deckX,z:8},{x:8,z:-10},{x:3,z:-28.1}]){box(m,'atriles','contemporanea','metal',q.x+.62,deckY+.67,q.z,.06,1.34,.06);box(m,'paneles','contemporanea','label',q.x+.62,deckY+1.30,q.z,.75,.30,.04);}
 a.finish(remains,resources,textures);r.finish(reconstruction,resources,textures);h.finish(hypotheses,resources,textures);m.finish(modern,resources,textures);u.finish(host,resources,textures);ce.finish(ceilingGroup,resources,textures);ro.finish(roof,resources,textures);sc.finish(sewerCovers,resources,textures);
 const apronGroup=new THREE.Group();apronGroup.name='Pòrtic · terreno exterior conservado';group.add(apronGroup);const apronData=contextData.surfaceApron;let apronMesh=null;
 if(apronData?.vertices?.length&&apronData?.indices?.length){const g=new THREE.BufferGeometry(),positions=apronData.vertices.flatMap(([x,z])=>[x,heightAt(x,z)+.004,z]);g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(apronData.indices.flat());g.computeVertexNormals();const mat=new THREE.MeshStandardMaterial({color:'#9b987e',roughness:1,side:THREE.DoubleSide});apronMesh=new THREE.Mesh(g,mat);apronMesh.name='Pòrtic · restitución del terreno fuera de los edificios';apronMesh.receiveShadow=true;apronMesh.userData={surfaceApron:true,porticFabric:true,component:'terreno-exterior',period:'contemporanea',baseColor:mat.color.clone(),baseMap:null,baseBumpMap:null};apronGroup.add(apronMesh);resources.geometries.push(g);resources.materials.push(mat);}
 const meshes=[];group.traverse(q=>{if(q.isMesh&&q.userData.porticFabric){q.userData.archaeologicalSite='portic';meshes.push(q);}});group.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(group),remainsBounds=new THREE.Box3().setFromObject(remains),state={selected:'portic-conjunto',readingMode:'materials',mode:'current',active:false,sectionOpen:false,hypotheses:true,roofOpen:true,coverShown:true,opening:1};
 const rotate=o=>[o[0]*c+o[2]*s,o[1],-o[0]*s+o[2]*c];
 const defs=[
 ['conjunto','Vía del Pòrtic y ciudad actual',1,0,surface+9,[42,34,-48],[32,22,-34],['volumen-actual','cerramiento-cristal'],'contemporanea',false,null,'current',47],
 ['plaza','La plaza de la Antiga Moreria',-23,6,surface+1,[15,13,-18],[8,5,-10],[],'contemporanea',false,0,'current',58],
 ['acceso','Acceder al espacio arqueológico',-12.5,21,surface-.5,[-9,3,-4],[-6,1.5,-3],['cerramiento-cristal','pasarela'],'contemporanea',false,0,'current',66],
 ['pasarela','Una pasarela sobre la ciudad antigua',deckX,4,deckY+1.55,[0,.03,8.5],[0,.03,5.5],['pasarela','barandilla-pasarela'],'contemporanea',true,-1,'current',72],
 ['calzada','Sesenta metros de calzada',roadX,0,base+.12,[5.8,2.15,12],[4.5,1.90,7],['losado','pilares-portico'],'via',true,-1,'current',72],
 ['losado','Las losas de caliza',roadX,-5,base+.10,[4.4,2.08,2.5],[3.8,1.92,1.8],['losado'],'via',true,-1,'current',67],
 ['porticos','Pilares a ambos lados de la calle',roadX+3.2,-.36,base+.6,[2.8,1.65,5.2],[2.2,1.50,3.6],['pilares-portico','aceras'],'via',true,-1,'current',67],
 ['cloaca','La cloaca bajo el pavimento',roadX,6,base-.70,[5.8,7.0,4.2],[3.6,4.6,2.3],['cloaca','losado'],'via',false,-1,'cut',61],
 ['desagues','El agua desembocaba en la calzada',-3.4,7.2,base-.12,[-1.3,2.25,3],[-1.1,2.0,2],['desagues'],'domestico',true,-1,'current',66],
 ['arco','Las cimentaciones de un posible arco',roadX,-18.8,base+.30,[10,8,5],[6,5,3],['basamentos-arco','arco-hipotetico'],'monumental',false,-1,'cut',61],
 ['podio','El gran edificio monumental',.4,-12,base+.35,[-5.2,1.8,7],[-4.8,1.75,4.3],['podio','sillares-podio'],'monumental',true,-1,'current',71],
 ['depositos','Balsas y depósitos del conjunto',1.5,-27,base-.05,[1.1,2.20,-2.0],[.2,2,-1.8],['depositos'],'monumental',true,-1,'current',67],
 ['funerario','Los recintos funerarios del siglo I',6.1,25.5,base+.1,[13,13,10],[9,8,7],['recintos-funerarios','loculi'],'monumental',false,-1,'cut',58],
 ['domestico','Viviendas sobre el espacio monumental',4.5,15.4,base+.3,[-9.4,1.85,1.8],[-9.1,1.85,.2],['habitaciones-romanas','umbrales','fragmentos-tegula'],'domestico',true,-1,'current',70],
 ['letrinas','Transformar la antigua acera',-2.5,17.9,base+.25,[-2.25,2.40,2.5],[-2.25,2.40,1.5],['letrinas','desagues'],'domestico',true,-1,'current',67],
 ['necropolis','Enterramientos después de la vía',roadX,7.1,base-1.07,[5.8,7.4,5],[3.6,4.6,2.8],['reutilizacion-funeraria','cloaca'],'tardia',false,-1,'cut',60],
 ['medieval','El barrio de las etapas medievales',9.7,14.5,base+.45,[13,12,8],[9,8,6],['fabricas-medievales'],'medieval',false,-1,'cut',58],
 ['musealizacion','Conservar bajo la ciudad habitada',1,-12,base+1.8,[-5.7,.15,10],[-5.7,.15,6],['pilares-modernos','vigas-modernas','forjado-moderno','atriles'],'contemporanea',true,-1,'current',74],
 ['historica','Una interpretación del siglo II',-3,-2,base+1.1,[24,23,29],[16,14,20],['vigas-portico','podio-restituido','pilares-portico'],'monumental',false,-1,'historical',51],
 ['entorno','La Morería dentro de Sagunto',0,11,surface+7,[55,50,58],[40,30,40],[],'contemporanea',false,0,'current',47]
 ];
 const focuses={};for(const[short,label,x,z,y,offset,closeOffset,components,period,interiorView,floor,recommendedMode,fov]of defs){const id='portic-'+short,p=f.world(x,z),target=new THREE.Vector3(p.x,y,p.z);focuses[id]={id,label,target,coordinates:geo(p),offset:rotate(offset),closeOffset:rotate(closeOffset),components,regionId:period,readingLayer:period,period,kind:short==='conjunto'?'overview':'feature',bounds:new THREE.Box3(target.clone().addScalar(-2),target.clone().addScalar(2)),fitBounds:false,interiorView,floor,recommendedMode,requiresSection:recommendedMode==='cut',minDistance:interiorView?.3:1.1,fov,closeScale:false,sourceConfidence:floor===-1?'published-plan-proportionally-registered':'registered-urban-context'};}
 focuses['portic-conjunto'].bounds=bounds.clone();focuses['portic-conjunto'].fitBounds=true;
 if(southCenter){const q=focuses['portic-medieval'],p=f.world(southCenter.x,southCenter.z);q.target.set(p.x,base+.35,p.z);q.coordinates=geo(p);q.bounds=new THREE.Box3(q.target.clone().addScalar(-10),q.target.clone().addScalar(10));}
 const getFocus=(id,mode=state.mode)=>{const q=focuses[id];if(!q)return null;if(id==='portic-conjunto'&&mode!=='current'){const t=new THREE.Vector3(origin.x,base+.5,origin.z);return{...q,target:t,bounds:remainsBounds.clone(),offset:rotate([42,42,45]),closeOffset:rotate([28,29,32]),floor:-1,fitBounds:true};}return q;};
 const planComponents=[{id:'norte',label:'Sector de la calzada',period:'contemporanea',coordinates:northOutline.map(geo),kind:'building',floors:[-1,0],interpretive:false},{id:'via',label:'Calzada conservada',period:'via',coordinates:roadPoly.map(geo),kind:'street',floors:[-1],closed:true,interpretive:true},{id:'cloaca',label:'Cloaca central',period:'via',coordinates:[f.world(roadCenter(-30),-30),f.world(roadX,-17),f.world(roadX,30)].map(geo),kind:'path',floors:[-1],interpretive:true}];
 for(const pi of piers)planComponents.push({id:'pilar-'+pi.side+'-'+pi.z,label:'Pilar del pórtico',period:'via',coordinates:rectPoly(f,pi.x,pi.z,pi.width,pi.width).map(geo),kind:'building',floors:[-1],interpretive:true});
 for(let i=0;i<podiumWalls.length;i++){const q=podiumWalls[i];planComponents.push({id:'podio-'+i,label:'Cimentación del edificio monumental',period:'monumental',coordinates:[f.world(q[0],q[1]),f.world(q[2],q[3])].map(geo),kind:'wall',floors:[-1],interpretive:true});}
 for(const q of deckSegments)planComponents.push({id:'pasarela-'+q.x+'-'+q.z,label:'Pasarela museográfica',period:'contemporanea',coordinates:rectPoly(subFrame(f,q.x,q.z,q.rotation||0),0,0,q.w,q.d).map(geo),kind:'path',closed:true,floors:[-1],interpretive:true});
 for(const q of basins)planComponents.push({id:'deposito-'+q.id,label:'Depósito documentado',period:'monumental',coordinates:rectPoly(f,q.x,q.z,q.w,q.d).map(geo),kind:'courtyard',floors:[-1],interpretive:true});
 if(south)planComponents.push({id:'sur',label:'Segundo sector musealizado',period:'contemporanea',coordinates:south.poly.map(geo),kind:'building',floors:[-1,0],interpretive:true});
 for(let i=0;i<roomWalls.length;i++){const q=roomWalls[i];planComponents.push({id:'habitacion-'+i,label:'Fábrica doméstica',period:'domestico',coordinates:[f.world(q[0],q[1]),f.world(q[2],q[3])].map(geo),kind:'wall',floors:[-1],interpretive:true});}
 const plan={id:'portic',label:'Vía del Pòrtic · calzada, espacios y ciudad',coordinate:geo(origin),outline:outline.map(geo),components:planComponents,stops:Object.values(focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,sourceConfidence:q.sourceConfidence})),floors:[{id:-1,label:'Espacio arqueológico',elevation:base},{id:0,label:'Ciudad actual',elevation:surface}],note:'Huellas actuales Catastro; disposición arqueológica interpretada proporcionalmente desde la planta publicada por Járrega2020Fig3 según Melchor2013 y las publicaciones de excavación. Dimensiones y tipos documentados, sin levantamiento georreferenciado del subsuelo ni itinerario de accesibilidad certificado.'};
 function repaint(){for(const mesh of meshes){const d=mesh.userData,mat=mesh.material;mat.color.copy(d.baseColor);mat.map=d.baseMap;mat.bumpMap=d.baseBumpMap;if(state.readingMode==='periods'){mat.color.set(PERIODS[d.period]||'#acae9c');mat.map=null;mat.bumpMap=null;}mat.emissive.set(d.materialKind==='light'?'#ffe1ac':focuses[state.selected]?.components.includes(d.component)?'#b89b65':'#000000');mat.emissiveIntensity=d.materialKind==='light'?.65:.025;mat.needsUpdate=true;}}
 function setPresentation(settings={}){for(const key of['mode','opening','coverShown','roofOpen','hypotheses'])if(settings[key]!==undefined)state[key]=settings[key];state.sectionOpen=state.mode==='cut';const historic=state.mode==='historical',opened=state.mode==='cut';remains.visible=!historic;modern.visible=!historic;host.visible=!historic&&(!opened||state.coverShown);ceilingGroup.visible=!historic&&(!opened||state.coverShown);const raw=opened?Math.max(0,Math.min(1,state.opening)):0,t=raw*raw*(3-2*raw),viewOffset=rotate([42,34,-48]),away=new THREE.Vector3(-viewOffset[0],0,-viewOffset[2]).normalize(),side=new THREE.Vector3(-away.z,0,away.x),shift=away.multiplyScalar(106*t).addScaledVector(side,14*t);shift.y=27.5*t;host.position.copy(shift);ceilingGroup.position.copy(shift);for(const upper of[host,ceilingGroup])upper.traverse(q=>{if(!q.isMesh)return;const mat=q.material,original=DEFS[q.userData.materialKind]?.opacity??1;mat.opacity=original*(1-.82*t);mat.transparent=mat.opacity<1;mat.depthWrite=t<.04&&original===1;mat.needsUpdate=true;});if(settings.selected!==undefined)state.active=!!settings.selected;apronGroup.visible=state.active;interiorLights.visible=state.active&&state.mode==='current';reconstruction.visible=historic;hypotheses.visible=historic&&!!state.hypotheses;roof.visible=!state.roofOpen;sewerCovers.visible=!opened;group.updateMatrixWorld(true);return{...state};}
 const selectFocus=id=>{state.selected=id&&focuses[id]?id:null;repaint();return getFocus(id);};
 const setReadingMode=mode=>{state.readingMode=mode==='periods'?'periods':'materials';repaint();};
 const setSection=open=>{setPresentation({mode:open?'cut':'current'});return state.sectionOpen;};
 const bindGround=finalHeightAt=>{if(typeof finalHeightAt!=='function')return;if(apronMesh){const a=apronMesh.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,finalHeightAt(a.getX(i),a.getZ(i))+.004);a.needsUpdate=true;apronMesh.geometry.computeVertexNormals();}for(const focus of Object.values(focuses)){if(focus.floor===-1)continue;for(const key of['offset','closeOffset']){const o=focus[key],y=finalHeightAt(focus.target.x+o[0],focus.target.z+o[2]);if(Number.isFinite(y)&&focus.target.y+o[1]<y+1.2)o[1]=y+1.2-focus.target.y;}}};
 const allCore=shellOutlines.flatMap(q=>q.poly),boundsLocal=localBounds(allCore,local),cutCenter=f.world((boundsLocal.minX+boundsLocal.maxX)/2,(boundsLocal.minZ+boundsLocal.maxZ)/2),cut={center:cutCenter,width:boundsLocal.maxX-boundsLocal.minX+1.4,depth:boundsLocal.maxZ-boundsLocal.minZ+1.4,yaw,floorY:base-1.5,clipContext:false,permanent:false};
 const stats={modelVersion:'v18',roadLength:60,roadWidth:[4.1,5.4],sewerClearWidth:.68,sewerClearDepth:1.25,preservedPierLocations:piers.length,westPiers:westZ.length,eastPiers:eastZ.length,slabCount,pavingCourses:pavingCourses.length,interiorLights:interiorLights.children.length,hostBuildings:core.length,sourceHostParcels:2,surfaceApronTriangles:apronData?.indices?.length?apronData.indices.flat().length/3:0,stops:defs.length,interiorViews:defs.filter(q=>q[9]).length,meshes:meshes.length,triangles:meshes.reduce((n,q)=>n+(q.geometry.index?.count||q.geometry.attributes.position.count)/3,0),phase:'Siglo II d. C.',verticalPlacement:'interpretativa',survey:false};
 const qa={baseY:base,surfaceY:surface,ceilingY:ceiling,deckY,frame:{x:origin.x,z:origin.z,yaw},coreBuildingIds:core.map(q=>q.id),apron:apronData?{triangles:apronData.indices.flat().length/3,vertices:apronData.vertices.length,source:'rectangular terrain window minus exact host exterior footprints'}:null,coreOutlines:shellOutlines.map(q=>({id:q.parentId,polygon:q.poly})),roadPoly,piers,westSpacings,eastSpacings,paving:{courseDepthRange:[Math.min(...pavingCourses),Math.max(...pavingCourses)],pieceWidthRange:[Math.min(...pavingWidths),Math.max(...pavingWidths)],interpretive:true},sewer:{width:.68,depth:1.25,probes:[f.p(roadX,base-.65,5),f.p(roadX,base-.65,8)]},supports,deckSegments,hostHeights,sectionGroups:{host:host.name,ceiling:ceilingGroup.name},sourcePlan:'Járrega2020 fig3, according to Melchor2013; ARSE39(2005) pp15–21; later strata are interpreted from excavation reports',archaeologyElevationSurvey:false};
 const visit={focuses,bounds,plan,stats,qa,periods,getFocus,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({...state}),sectionAvailable:true,metadata:{model:'documented-interpretation',interiorSurvey:false,sourcePlan:qa.sourcePlan,modern:'Two registered host parcels; dark enclosure, timber decks, glass and metal railings interpreted from musealization photographs',historical:'Second-century hypothesis, without late burial or medieval strata; complete monumental envelope separately optional',evidence:'Published widths and pillar spacing; individual slabs, wall heights, routes and minor details approximate'},renderStops:['portic-conjunto','portic-calzada','portic-pasarela','portic-podio','portic-cloaca','portic-historica']};
 group.userData.visit=visit;group.userData.resources=resources;group.userData.ownedResources=resources;group.userData.landmarkId='portic';repaint();setPresentation();
 return{id:'portic',group,remains,reconstruction,hypotheses,modern,host,apron:apronGroup,ceiling:ceilingGroup,roofs:[{object:roof}],roof,point:focuses['portic-conjunto'].target.clone(),views:{offset:focuses['portic-conjunto'].offset,closeOffset:focuses['portic-conjunto'].closeOffset},view:{target:focuses['portic-conjunto'].target.clone(),offset:focuses['portic-conjunto'].offset,closeOffset:focuses['portic-conjunto'].closeOffset},cut,currentMask:{...cut},historicalMask:{...cut},containsSubsurface:(x,z)=>shellOutlines.some(q=>inside({x,z},q.poly)),stats,visit,setPresentation,setSection,exclusions:shellOutlines.map(q=>q.poly),patches:[],excludedBuildingIds:[...new Set([...core.map(q=>q.id),'203064254'])],excludedRoadIds:[]};
}
