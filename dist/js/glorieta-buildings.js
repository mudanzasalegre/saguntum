import * as T from 'three';

const sx=111320*Math.cos(39.679*Math.PI/180);
const project=([lon,lat])=>[(lon+.278)*sx,(39.679-lat)*111320];
const median=a=>a.sort((u,v)=>u-v)[Math.floor(a.length/2)];
const colours={ayuntamiento:'#e2dac5',auditorio:'#cbbfb2',mercado:'#d7c7a5',biblioteca:'#d6c3a7',cazadores:'#a96058',bancaja:'#c28b6e'};
const homes=['#c58c70','#d9b297','#ded4b9','#d3af88','#ab7866','#c9c6bb','#d8c2a4'];
const hash=id=>Array.from(id).reduce((h,k)=>(31*h+k.charCodeAt(0))>>>0,7);

class Batch {
 constructor(){this.positions=[];this.colours=[];}
 triangle(a,b,c,color){
  this.positions.push(...a,...b,...c);
  for(let i=0;i<3;i++)this.colours.push(color.r,color.g,color.b);
 }
 quad(a,b,c,d,tint){this.triangle(a,b,c,tint);this.triangle(a,c,d,tint);}
 mesh(name,kind){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(this.colours,3));g.computeVertexNormals();g.computeBoundingSphere();
  const m=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:kind==='glass'?.30:kind==='metal'?.57:.88,metalness:kind==='metal'?.24:0});
  m.name=kind;const mesh=new T.Mesh(g,m);mesh.name=name+' · '+kind;mesh.userData.materialKind=kind;
  mesh.receiveShadow=true;mesh.castShadow=kind!=='asphalt'&&kind!=='paving';return mesh;
 }
}

function triangulate(outer,holes=[]){
 const rings=[outer,...holes].map(r=>r.length>2&&r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1]?r.slice(0,-1):r);
 const xy=r=>r.map(([x,z])=>new T.Vector2(x,z));const pts=rings.flat();
 return T.ShapeUtils.triangulateShape(xy(rings[0]),rings.slice(1).map(xy)).map(t=>t.map(i=>pts[i]));
}

function wallTools(surface,face,ground){
 const [x,z]=face.a,dx=face.b[0]-x,dz=face.b[1]-z,L=Math.hypot(dx,dz),[nx,nz]=face.n;
 const p=(u,y,v)=>[x+u*dx/L+v*nx,ground+y,z+u*dz/L+v*nz];
 function plate(u,y,w,h,offset,tint,kind='stone'){
  surface(kind).quad(p(u-w/2,y,offset),p(u+w/2,y,offset),p(u+w/2,y+h,offset),p(u-w/2,y+h,offset),new T.Color(tint));
 }
 function box(u,y,w,h,back,front,tint,kind='stone'){
  const left=u-w/2,right=u+w/2,top=y+h,b=surface(kind),c=new T.Color(tint);
  plate(u,y,w,h,front,tint,kind);
  for(const t of [left,right])b.quad(p(t,y,back),p(t,y,front),p(t,top,front),p(t,top,back),c);
  for(const t of [top,y])b.quad(p(left,t,back),p(right,t,back),p(right,t,front),p(left,t,front),c);
 }
 function sash(u,y,w,h,{trim='#bdb2a2',pane='#535f5b',sill=true,offset=.08}={}){
  const bar=.09;
  plate(u,y,w,h,offset,pane,'glass');
  for(const sign of [-1,1])box(u+sign*(w/2+.045),y-.05,.11,h+.1,offset,offset+.13,trim);
  box(u,y+h-.015,w+.23,.13,offset,offset+.14,trim);
  if(sill)box(u,y-.08,w+.26,.13,offset,offset+.24,trim);
  box(u,y,bar,h,offset,offset+.035,'#6b685d','metal');
 }
 function rail(u,y,w,depth){
  box(u,y-.12,w+.20,.19,0,depth+.05,'#c8bcaa');
  box(u,y+.85,w,.065,depth-.045,depth+.025,'#494940','metal');
  for(let k=0,n=Math.max(3,Math.floor(w/.22));k<=n;k++)box(u+w*(k/n-.5),y,.034,.86,depth-.04,depth,'#4c4a43','metal');
  for(const sign of [-1,1])box(u+sign*w/2,y+.84,.05,.07,.02,depth,'#4c4a43','metal');
 }
 return {p,L,plate,box,sash,rail,surface};
}

function palace(w,isPrincipal){
 const {p,L,plate,box,sash,rail,surface}=w,body='#e5ddc9',stone='#c6bdab',wood='#564537';
 const count=L>23?5:3,bay=L/count;
 // Monolithic front and deep arched reveals meet on the same curve.
 const arch=(u,r,spring)=>{
  const b=surface('stone'),c=new T.Color(body),edge=new T.Color(stone),dark=new T.Color('#493e31');
  const q=(ang,rad,off)=>p(u+rad*Math.cos(ang),spring+rad*Math.sin(ang),off);
  const x0=u-r,x1=u+r;
  b.quad(p(x0,-.6,-.32),p(x1,-.6,-.32),p(x1,spring,-.32),p(x0,spring,-.32),dark);
  for(let j=0;j<18;j++){
   const a=j*Math.PI/18,d=(j+1)*Math.PI/18;
   b.quad(q(a,r,.04),q(d,r,.04),p(u+r*Math.cos(d),6.35,.04),p(u+r*Math.cos(a),6.35,.04),c);
   b.quad(q(a,r,.04),q(d,r,.04),q(d,r,-.32),q(a,r,-.32),edge);
   b.triangle(p(u,spring,-.32),q(a,r,-.32),q(d,r,-.32),dark);
   b.quad(q(a,r,.12),q(d,r,.12),q(d,r+.19,.12),q(a,r+.19,.12),edge);
  }
  for(const sign of [-1,1])box(u+sign*(r+.09),-.6,.18,spring+.62,-.33,.14,stone);
  for(let k=-2;k<=2;k++)box(u+k*r*.32,.14,.055,spring+.55,-.31,-.25,wood,'metal');
  box(u,1.9,r*2,.06,-.31,-.24,wood,'metal');
 };
 for(let i=0;i<count;i++){
  const u=(i+.5)*bay,wide=isPrincipal,r=bay*.30;
  if(wide){
   for(const sign of [-1,1])box(u+sign*(bay/2+r)/2,-.6,bay/2-r+.012,6.95,-.7,.04,body);
   arch(u,r,3.48);
  }else{
   plate(u,-.7,bay,7.1,.01,body);
   sash(u,1.0,1.25,2.8,{pane:wood});sash(u,4.12,1.05,1.54,{pane:wood});
  }
  plate(u,6.30,bay,9.3,.035,body);
  sash(u,6.94,1.67,3.24,{trim:stone,pane:wood});
  box(u,10.32,2.15,.17,.08,.36,stone);
  if(!wide||i===0||i===count-1)rail(u,6.92,1.93,.5);
  const ne=isPrincipal?2:1;
  for(let k=0;k<ne;k++)sash(u+(k-(ne-1)/2)*.96,12.6,.61,1.06,{trim:stone,pane:'#635347',sill:false});
  if(i===0||i===count-1)for(let course=0;course<13;course++)box(i===0?.30:L-.30,course*1.1,.54,1.04,.03,.14,'#dbd3c0');
 }
 if(isPrincipal)rail(L/2,6.86,bay*2+2.42,.9);
 for(const [y,h,depth] of [[6.29,.27,.26],[11.0,.25,.22],[14.63,.34,.38],[15.07,.2,.47],[15.31,.45,.20]])box(L/2,y,L+.10,h,.02,depth,stone);
 for(let i=0;i<=count;i++){
  const u=Math.min(L-.12,Math.max(.12,i*bay));box(u,15.72,.34,.45,0,.3,stone);box(u,16.17,.18,.36,.05,.23,stone);
 }
 if(isPrincipal){
  const b=surface('stone'),cx=L/2,cy=15.55;
  for(let i=0;i<28;i++){
   const ring=(t,r,off)=>p(cx+r*Math.cos(t),cy+r*Math.sin(t),off);
   const a=i*Math.PI/14,d=(i+1)*Math.PI/14;
   b.triangle(p(cx,cy,.28),ring(a,1.32,.28),ring(d,1.32,.28),new T.Color(body));
   b.triangle(p(cx,cy,.32),ring(a,.72,.32),ring(d,.72,.32),new T.Color('#eee8d8'));
   b.quad(ring(a,.73,.35),ring(d,.73,.35),ring(d,.81,.35),ring(a,.81,.35),new T.Color('#746f62'));
  }
  for(let i=0;i<12;i++){const a=i*Math.PI/6;box(cx+.59*Math.sin(a),cy+.59*Math.cos(a)-.04,.045,.09,.33,.38,'#494a43');}
  box(cx,cy,.045,.44,.35,.39,'#484840');box(cx+.12,cy,.26,.05,.35,.39,'#484840');
  for(let k=0;k<3;k++){const u=cx+(k-1)*1.12;surface('metal').quad(p(u,8.31,.85),p(u+.53,7.65,1.2),p(u+.51,6.73,1.1),p(u,7.45,.84),new T.Color(['#ae4d35','#c9ae62','#af653d'][k]));}
 }
}

function streetFront(w,role,height,levels,seed,front){
 const {L,plate,box,sash,rail}=w;
 const cols=Math.max(1,Math.floor(L/3.65)),bay=L/cols;
 if(role==='auditorio'&&front){
  // The pale west elevation has tall glazed bays, horizontal rails and a pierced attic.
  const h=height,top=h*.84;
  for(let i=0;i<4;i++){
   const u=(i+.5)*L/4;
   sash(u,1.08,L/4*.65,top*.56,{pane:'#536b6d',trim:'#aba5a0',offset:.13});
   for(let j=1;j<=4;j++)box(u,1.08+j*top*.11,L/4*.65,.11,.13,.28,'#a4aaa6','metal');
   for(let j=0;j<2;j++)sash(u+(j-.5)*L*.036,top*.70,L*.029,top*.21,{pane:'#586668',sill:false});
   sash(u,top*1.045,L*.101,h*.087,{pane:'#4b5250',trim:'#bcb3a7',sill:false});
  }
  box(L*.52,3.07,L*.87,.27,.09,1.01,'#bcb4a7');
  return;
 }
 if(role==='mercado'){
  const bays=Math.max(2,Math.round(L/3.7));
  for(let i=0;i<bays;i++){
   const u=(i+.5)*L/bays;
   sash(u,Math.max(2.3,height-2.25),L/bays*.79,1.14,{trim:'#9e8c76',pane:'#47504b',sill:false});
   if(front&&Math.abs(i-Math.floor(bays/2))<=1){sash(u,.10,L/bays*.81,2.26,{trim:'#c8b79c',pane:'#4b4940'});}
   else box(u,0,.45,Math.max(2,height-.3),.03,.30,'#b4a086');
  }
  box(L/2,height-.26,L+.12,.22,.0,.40,'#948778');
  if(front)box(L/2,2.72,Math.min(7.2,L*.30),.55,.10,.30,'#5c9a9c');
  return;
 }
 const floors=Math.max(1,Math.min(11,levels||Math.round(height/3.05))),step=(height-2.9)/Math.max(floors-1,1);
 for(let i=0;i<cols;i++){
  const u=(i+.5)*bay;
  if(role==='biblioteca'&&front){
   sash(u,.19,bay*.84,2.5,{pane:'#60706c',trim:'#b9aa93'});
   box(u,2.81,bay*1.01,.28,.02,.36,'#8b735d');
  }else if(role==='cazadores'&&front){
   sash(u,.23,bay*.55,2.6,{pane:'#514845',trim:'#e3d5bd'});box(u,3.04,bay*.68,.23,.04,.31,'#d9c9af');
  }else if(role==='auditorio'&&floors<=3){
   sash(u,.12,bay*.70,2.74,{pane:'#565b59',trim:'#ada49b'});
  }else{
   sash(u,.08,bay*(i===0?.43:.72),Math.min(2.62,height-.44),{pane:i===0?'#675b4f':'#6a7370',trim:'#c6baa7'});
   if((i+seed)%5===0)box(u,2.55,bay*.82,.18,.07,.51,'#91836a');
  }
  for(let floor=1;floor<floors;floor++){
   const y=2.98+(floor-1)*step+.24,h=Math.min(2.13,step*.62);
   if(y+h>height-.27)continue;
   const ornate=role==='cazadores'&&front;
   const width=ornate?bay*.43:bay*(seed%3===0?.71:.54);
   sash(u,y,width,h,{pane:'#5f6865',trim:ornate?'#e9d9bf':'#c6beb0'});
   if((seed+i+floor)%4===0)plate(u,y+h*.57,width,h*.42,.129,'#9f998b');
   if(seed%3===1||ornate)rail(u,y,width+.32,ornate?.39:.60);
   if(ornate){
    box(u,y+h+.15,width+.48,.15,.03,.3,'#e5d3b8');
    box(u,y+h+.35,.31,.16,.06,.33,'#d9c7a9');
   }
  }
 }
 box(L/2,height-.22,L,.19,.0,.23,'#c3b7a2');
}

// Contemporary public-facing names. Lettering is redrawn rather than copied from a logo.
function nameplate(text,width,face,heightAt,role){
 const c=document.createElement('canvas');c.width=512;c.height=64;
 const ctx=c.getContext('2d');ctx.fillStyle=role==='mercado'?'#e6e3d7':'#746e61';ctx.fillRect(0,0,c.width,c.height);
 ctx.fillStyle=role==='mercado'?'#5b9c9f':'#eee9d9';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font=role==='mercado'?'bold 42px sans-serif':'28px sans-serif';ctx.fillText(text,256,34,480);
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
 const m=new T.MeshStandardMaterial({map:texture,roughness:.81,side:T.DoubleSide});
 const sign=new T.Mesh(new T.PlaneGeometry(width,width/8),m),[nx,nz]=face.n;
 const x=(face.a[0]+face.b[0])/2,z=(face.a[1]+face.b[1])/2;
 sign.position.set(x+nx*.34,heightAt(x,z)+3.05,z+nz*.34);sign.rotation.y=Math.atan2(nx,nz);
 sign.name='Glorieta · rótulo · '+text;sign.userData.component='glorieta-'+role;return sign;
}

function roofPhotography(photo){
 if(!photo)return null;
 const cells=atob(photo.index),rgba=new Uint8Array(cells.length*4);
 for(let i=0;i<cells.length;i++){
  const k=cells.charCodeAt(i)*3;
  rgba.set([photo.palette[k],photo.palette[k+1],photo.palette[k+2],255],i*4);
 }
 const t=new T.DataTexture(rgba,photo.width,photo.height,T.RGBAFormat);
 t.name='Glorieta · ortofoto PNOA de cubiertas';t.colorSpace=T.SRGBColorSpace;
 t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
 return t;
}

export function buildGlorietaBuildings(data,heightAt){
 const group=new T.Group();group.name='Glorieta · fachadas, manzanas y calles';
 const layers=new Map();
 function surface(role,kind){
  const key=role+'/'+kind;if(!layers.has(key))layers.set(key,new Batch());return layers.get(key);
 }
 const register=new Map();
 for(const building of data.buildings){
  const {id,role}=building,seed=hash(building.parentId||id),ring=building.coordinates.map(project),holes=(building.holes||[]).map(r=>r.map(project));
  const gy=median(ring.map(([x,z])=>heightAt(x,z)));
  const h=Math.max(2.5,building.height||building.surfaceHeightEstimate||(building.levels?building.levels*3.03:8.5));
  register.set(id,{gy,h,role,levels:building.levels,seed});
  if(role==='ayuntamiento')continue;
  const wall=surface(role,'plaster'),roof=surface(role,'roof'),tint=new T.Color(colours[role]||homes[seed%homes.length]);
  const roofColor=new T.Color(building.roofColor||'#b9b0a0');
  for(const loop of [ring,...holes]){
   for(let i=0;i<loop.length-1;i++){
    const [x,z]=loop[i],[xx,zz]=loop[i+1];
    wall.quad([x,heightAt(x,z)-.57,z],[xx,heightAt(xx,zz)-.57,zz],[xx,gy+h,zz],[x,gy+h,z],tint);
   }
  }
  for(const tri of triangulate(ring,holes)){
   const [a,b,c]=tri.map(([x,z])=>[x,gy+h,z]);roof.triangle(a,c,b,roofColor);
  }
 }
 const palaceOutline=data.outlines.ayuntamiento;
 const palaceGround=median(palaceOutline.map(([x,z])=>heightAt(x,z)));
 const roof=surface('ayuntamiento','roof'),roofCenter=palaceOutline.reduce(([x,z],p)=>[x+p[0]/palaceOutline.length,z+p[1]/palaceOutline.length],[0,0]);
 for(let i=0;i<palaceOutline.length;i++){
  const a=palaceOutline[i],b=palaceOutline[(i+1)%palaceOutline.length];
  roof.triangle([a[0],palaceGround+15.51,a[1]],[roofCenter[0],palaceGround+17.08,roofCenter[1]],[b[0],palaceGround+15.51,b[1]],new T.Color('#b99877'));
 }
 for(const faces of Object.values(data.frontages)){
  for(const face of faces){
   const rec=register.get(face.part);if(!rec)continue;
   const {gy,h,role,levels,seed}=rec;
   const ground=role==='ayuntamiento'?palaceGround:gy;
   const w=wallTools(kind=>surface(role,kind),face,ground);
   if(role==='ayuntamiento'){palace(w,face.n[0]>.7);continue;}
   const east=role==='biblioteca'||role==='cazadores'||role==='bancaja';
   streetFront(w,role,h,levels,seed,east?face.n[0]>.65:face.n[0]<-.65);
  }
 }
 for(const [key,kind,dy,tint] of [['roads','asphalt',.077,'#88867f'],['pavements','paving',.154,'#c4bba9']]){
  const batch=surface('calles',kind),color=new T.Color(tint);
  function drape(a,b,c,depth){
   const sides=[[a,b,c],[b,c,a],[c,a,b]];
   const [u,v,w]=sides.sort((e,f)=>Math.hypot(f[0][0]-f[1][0],f[0][1]-f[1][1])-Math.hypot(e[0][0]-e[1][0],e[0][1]-e[1][1]))[0];
   if(depth<8&&Math.hypot(v[0]-u[0],v[1]-u[1])>4.2){
    const mid=[(u[0]+v[0])*.5,(u[1]+v[1])*.5];drape(u,mid,w,depth+1);drape(mid,v,w,depth+1);return;
   }
   const vertex=([x,z])=>[x,heightAt(x,z)+dy,z];batch.triangle(vertex(a),vertex(c),vertex(b),color);
  }
  for(const item of data[key]||[]){
   for(const [a,b,c] of triangulate(item.outer,item.holes))drape(a,b,c,0);
   if(kind==='paving')for(const ring of [item.outer,...item.holes])for(let i=1;i<ring.length;i++){
    const [x,z]=ring[i-1],[xx,zz]=ring[i];let y=heightAt(x,z),yy=heightAt(xx,zz);
    batch.quad([x,y+.04,z],[xx,yy+.04,zz],[xx,yy+dy,zz],[x,y+dy,z],new T.Color('#998f80'));
   }
  }
 }
 for(const [role,text,width] of [['mercado','MERCAT SAGUNT',5.1],['biblioteca','BIBLIOTECA CRONISTA CHABRET',5.4]]){
  const faces=data.frontages[data.refs[role]],sign=role==='mercado'?-1:1;
  const front=faces.filter(f=>f.n[0]*sign>.82).sort((a,b)=>Math.hypot(b.b[0]-b.a[0],b.b[1]-b.a[1])-Math.hypot(a.b[0]-a.a[0],a.b[1]-a.a[1]))[0];
  if(front)group.add(nameplate(text,width,front,heightAt,role));
 }
 const roofMap=roofPhotography(data.roofPhoto);
 for(const [key,b] of layers){
  if(!b.positions.length)continue;
  const [role,kind]=key.split('/'),m=b.mesh('Glorieta · '+role,kind);
  if(kind==='roof'&&roofMap){
   const [left,top,right,bottom]=data.roofPhoto.bounds,p=m.geometry.attributes.position,uv=[];
   for(let i=0;i<p.count;i++)uv.push((p.getX(i)-left)/(right-left),(p.getZ(i)-top)/(bottom-top));
   m.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));m.material.map=roofMap;m.material.vertexColors=false;
  }
  m.userData.component='glorieta-'+role;group.add(m);
 }
 return group;
}
