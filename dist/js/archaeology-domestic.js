import * as THREE from 'three';

/*
 * Saguntum — two excavations, with independently switchable evidence layers.
 * Coordinates/metres are world-space (east, absolute elevation, south).
 * The authored geometry is a measured literary/plan reconstruction, NOT a scan.
 * Source dimensions and every completion assumption: archaeology-domestic.json.
 */
const Y = new THREE.Vector3(0, 1, 0);
const I = new THREE.Matrix4();
const rnd = n => { const s = Math.sin(n * 129.47 + 17.93) * 43758.5453; return s - Math.floor(s); };
const mats = {};
const colors = { stone:'#b7ad96', ashlar:'#a9aaa1', earth:'#8b775b', gravel:'#ae9770', plaster:'#e5d4b3', tile:'#a45e43', wood:'#674936', dark:'#403c34', red:'#934738', green:'#61745b', ochre:'#bd9555', hypothesis:'#74b7b8', water:'#619e9f', fish:'#e0c99b' };
function texture(type) {
  const c=document.createElement('canvas');c.width=512;c.height=type==='fish'?128:512;const x=c.getContext('2d');
  x.fillStyle=type==='fish'?'#d7bd8c':type==='tile'?'#d69b77':type==='stone'?'#d5cebb':'#ded2b9';x.fillRect(0,0,c.width,c.height);
  if(type==='fish') {
    // A new, interpretative drawing of the documented marine motif; no source photo is copied.
    x.strokeStyle='#7e5544';x.lineWidth=2;
    for(let i=0;i<5;i++) {const px=45+i*103,py=48+(i%2)*28; x.save();x.translate(px,py);x.scale(i%2?-1:1,1);x.fillStyle=i%2?'#8a6e50':'#705b48';x.beginPath();x.ellipse(0,0,24,9,0,0,Math.PI*2);x.fill();x.beginPath();x.moveTo(-21,0);x.lineTo(-37,-10);x.lineTo(-35,10);x.closePath();x.fill();x.fillStyle='#e2cba5';x.beginPath();x.arc(15,-2,2,0,Math.PI*2);x.fill();x.strokeStyle='#c2a47b';x.beginPath();x.moveTo(1,-8);x.lineTo(0,8);x.stroke();x.restore();}
    x.strokeStyle='#7e654b';for(let j=0;j<4;j++){const px=80+j*120;x.beginPath();x.arc(px,100,8,Math.PI,Math.PI*2);x.stroke();for(let k=-2;k<=2;k++){x.beginPath();x.moveTo(px,101);x.lineTo(px+k*3,92);x.stroke();}}
  } else {
    const h=type==='tile'?32:53,w=type==='tile'?42:90;
    for(let r=0;r<Math.ceil(c.height/h);r++)for(let k=-1;k<Math.ceil(c.width/w);k++){x.fillStyle=`rgba(${rnd(r*19+k)>0.5?'255,252,232':'56,43,32'},${.05+rnd(r*31+k)*.11})`;x.fillRect(k*w+(r%2)*w/2+2,r*h+2,w-4,h-4);}
  }
  for(let i=0;i<5000;i++){const a=rnd(i+3);x.fillStyle=i%2?`rgba(58,43,24,${.04+a*.10})`:`rgba(255,247,220,${.06+a*.18})`;x.fillRect(rnd(i)*c.width,rnd(i+8000)*c.height,1+a*3,1+a*3);}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(type!=='fish')t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
function material(k) {
  if(!mats[k])mats[k]=new THREE.MeshStandardMaterial({color:colors[k]||colors.stone,roughness:k==='water'?.25:.95,metalness:0,vertexColors:true,side:THREE.DoubleSide,transparent:k==='water'||k==='hypothesis',opacity:k==='water'?.45:k==='hypothesis'?.68:1,depthWrite:k!=='water',map:['stone','tile','plaster','fish'].includes(k)?texture(k):null});
  return mats[k];
}
class Batch {
  constructor(f) {this.f=f;this.parts=new Map();this.unit=new THREE.BoxGeometry(1,1,1).toNonIndexed();}
  geo(k,g,m=I,tint=1,ownUV=false) {
    const n=g.index?g.toNonIndexed():g;if(!n.attributes.normal)n.computeVertexNormals();let a=this.parts.get(k);if(!a){a={p:[],n:[],u:[],c:[]};this.parts.set(k,a);}
    const world=this.f.matrix.clone().multiply(m),nm=new THREE.Matrix3().getNormalMatrix(world),v=new THREE.Vector3(),normal=new THREE.Vector3(),color=typeof tint==='number'?new THREE.Color(tint,tint,tint):new THREE.Color(tint);const p=n.attributes.position,no=n.attributes.normal,uv=n.attributes.uv;
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(world);normal.fromBufferAttribute(no,i).applyMatrix3(nm).normalize();a.p.push(v.x,v.y,v.z);a.n.push(normal.x,normal.y,normal.z);if(ownUV&&uv)a.u.push(uv.getX(i),uv.getY(i));else {const ax=Math.abs(normal.x),ay=Math.abs(normal.y),az=Math.abs(normal.z),s=k==='tile'?2:3;a.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/s,(ay>ax&&ay>az?v.z:v.y)/s);}a.c.push(color.r,color.g,color.b);}
    if(n!==g)n.dispose();
  }
  box(k,x,y,z,w,h,d,yaw=0,tint=1) {if(Math.min(w,h,d)<=0)return;this.geo(k,this.unit,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(Y,yaw),new THREE.Vector3(w,h,d)),tint);}
  raw(k,p,tint=1) {if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geo(k,g,I,tint);g.dispose();}
  cylinder(k,x,y,z,rt,rb,h,tint=1,segments=14) {const g=new THREE.CylinderGeometry(rt,rb,h,segments);this.geo(k,g,new THREE.Matrix4().makeTranslation(x,y,z),tint);g.dispose();}
  wall(k,x1,z1,x2,z2,y,h,t=.45,tint=1) {const l=Math.hypot(x2-x1,z2-z1);this.box(k,(x1+x2)/2,y+h/2,(z1+z2)/2,l,h,t,-Math.atan2(z2-z1,x2-x1),tint);}
  finish(name) {const g=new THREE.Group();g.name=name;for(const[k,a]of this.parts){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(a.p,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(a.n,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(a.u,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(a.c,3));geo.computeBoundingBox();geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,material(k));mesh.name=`${name}-${k}`;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}this.unit.dispose();return g;}
}
function frame(center,y,yaw) {const matrix=new THREE.Matrix4().compose(new THREE.Vector3(center.x,y,center.z),new THREE.Quaternion().setFromAxisAngle(Y,yaw),new THREE.Vector3(1,1,1));return {matrix,point:(x=0,yy=0,z=0)=>new THREE.Vector3(x,yy,z).applyMatrix4(matrix)};}
const quad=(a,p,q,r,s)=>a.push(...p,...q,...r,...p,...r,...s);
function slab(b,k,p,y,h=.15,tint=1) {const v=[];for(let i=1;i<p.length-1;i++)v.push(p[0][0],y,p[0][1],p[i][0],y,p[i][1],p[i+1][0],y,p[i+1][1]);for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length];quad(v,[a[0],y,a[1]],[a[0],y-h,a[1]],[c[0],y-h,c[1]],[c[0],y,c[1]]);}b.raw(k,v,tint);}
function roughWall(b,x1,z1,x2,z2,y,h=.65,t=.5,seed=1,kind='stone') {
  const l=Math.hypot(x2-x1,z2-z1),yaw=-Math.atan2(z2-z1,x2-x1);if(l<.01)return;
  b.wall('earth',x1,z1,x2,z2,y,h*.88,t*.85,.88);
  const rows=Math.max(1,Math.round(h/.23)),rh=h/rows;
  for(let r=0;r<rows;r++){const count=Math.ceil(l/(r%2?.44:.53));for(let i=0;i<count;i++){const t0=i/count,t1=(i+1)/count,u=(t0+t1)/2,hh=rh*(.83+rnd(seed+r*97+i)*.17);b.box(kind,x1+(x2-x1)*u,y+r*rh+hh/2,z1+(z2-z1)*u,l/count-.035,hh,t*(.86+rnd(seed+i*3+r)*.17),yaw,.82+rnd(seed+r*71+i)*.28);}}
}
function doorWall(b,k,x1,z1,x2,z2,y,h,t,opening,offset=0) {const len=Math.hypot(x2-x1,z2-z1),ux=(x2-x1)/len,uz=(z2-z1)/len,mid=len/2+offset,a=mid-opening/2,c=mid+opening/2;for(const[p,q]of [[0,a],[c,len]])if(q>p)b.wall(k,x1+ux*p,z1+uz*p,x1+ux*q,z1+uz*q,y,h,t);b.wall(k,x1+ux*a,z1+uz*a,x1+ux*c,z1+uz*c,y+2.1,Math.max(.12,h-2.1),t);}
function pool(b,x,z,w,d,insideW,insideD,y,h=.75) {
  const rr=(shape,x,y,w,h,r)=>{shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);};
  const s=new THREE.Shape();rr(s,-w/2,-d/2,w,d,.14);const hole=new THREE.Path();rr(hole,-insideW/2,-insideD/2,insideW,insideD,.13);s.holes.push(hole);const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:4});const m=new THREE.Matrix4().makeTranslation(x,y,z).multiply(new THREE.Matrix4().makeRotationX(-Math.PI/2));b.geo('plaster',geo,m);geo.dispose();b.box('plaster',x,y+.04,z,insideW,.08,insideD);
  // The surviving painted decoration is on the exterior, not a mosaic in the water.
  for(const side of [-1,1]){const g=new THREE.PlaneGeometry(w-.2,h*.68);const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y+h*.49,z+side*(d/2+.009)),new THREE.Quaternion().setFromAxisAngle(Y,side>0?0:Math.PI),new THREE.Vector3(1,1,1));b.geo('fish',g,matrix,1,true);g.dispose();}
}
function column(b,x,z,y,h=3.2,kind='plaster',paint=false) {b.box('ashlar',x,y+.06,z,.47,.12,.47);b.cylinder(kind,x,y+.17,z,.23,.23,.12);b.cylinder(kind,x,y+.29,z,.17,.22,.12);b.cylinder(kind,x,y+.36+(h-.75)/2,z,.13,.15,h-.75);b.cylinder(kind,x,y+h-.30,z,.19,.15,.18);b.box(kind,x,y+h-.13,z,.43,.16,.43);if(paint){b.cylinder('red',x,y+.72,z,.153,.153,.58);b.cylinder('green',x,y+h-.32,z,.195,.195,.09);}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;b.box(kind,x+Math.cos(a)*.15,y+h-.37,z+Math.sin(a)*.15,.055,.24,.09,-a,.93);}}
function groundWithHoles(b,y,holes) {
  const outer=[[-17.9,-33.9],[17.9,-33.9],[17.9,33.9],[-17.9,33.9]].map(([x,z])=>new THREE.Vector2(x,-z));
  const rings=holes.map(([x,z,w,d])=>[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]].map(([xx,zz])=>new THREE.Vector2(xx,-zz)));
  const all=[...outer,...rings.flat()],arr=[];for(const t of THREE.ShapeUtils.triangulateShape(outer,rings))for(const i of t)arr.push(all[i].x,y,-all[i].y);b.raw('gravel',arr);
}
function roofPlane(b,p,k='tile') {const arr=[];quad(arr,...p);b.raw(k,arr);}
function gable(b,x,z,w,d,y,rise,k='tile') {roofPlane(b,[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+rise,z],[x-w/2,y+rise,z]],k);roofPlane(b,[[x-w/2,y+rise,z],[x+w/2,y+rise,z],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2]],k);for(let xx=x-w/2;xx<x+w/2;xx+=.36)b.box(k,xx,y+rise+.035,z,.37,.12,.2);for(const side of[-1,1])b.raw(k==='tile'?'plaster':k,[x+side*w/2,y,z-d/2,x+side*w/2,y,z+d/2,x+side*w/2,y+rise,z]);}
function arch(b,x,z,y,w,h,k='hypothesis') {const r=w/2,spring=h-r,t=.56,d=.85;b.box(k,x-r-t/2,y+spring/2,z,t,spring,d);b.box(k,x+r+t/2,y+spring/2,z,t,spring,d);for(let i=0;i<16;i++){const a=i*Math.PI/16,c=(i+1)*Math.PI/16,arr=[],p=(angle,radius,zz)=>[x+Math.cos(angle)*radius,y+spring+Math.sin(angle)*radius,z+zz];quad(arr,p(a,r,-d/2),p(c,r,-d/2),p(c,r+t,-d/2),p(a,r+t,-d/2));quad(arr,p(c,r,d/2),p(a,r,d/2),p(a,r+t,d/2),p(c,r+t,d/2));quad(arr,p(a,r,-d/2),p(a,r,d/2),p(c,r,d/2),p(c,r,-d/2));quad(arr,p(a,r+t,d/2),p(a,r+t,-d/2),p(c,r+t,-d/2),p(c,r+t,d/2));b.raw(k,arr);}}
function vessel(b,x,z,y,size=.45,k='hypothesis') {const pts=[[.07,0],[.12,.08],[.25,.35],[.22,.55],[.09,.68],[.085,.8],[.14,.83]].map(([r,h])=>new THREE.Vector2(r*size,h*size));const g=new THREE.LatheGeometry(pts,14);b.geo(k,g,new THREE.Matrix4().makeTranslation(x,y,z));g.dispose();}
function finishSite(id,f,remains,reconstruction,hypotheses,roof,cut,views,metrics) {const group=new THREE.Group();group.name=`archaeology-${id}`;remains.name=`${id}-conserved-and-excavated`;reconstruction.name=`${id}-historical-phase`;hypotheses.name=`${id}-conjectural-completions`;reconstruction.visible=false;hypotheses.visible=false;roof.name=`${id}-historical-roofs`;roof.userData.isRoof=true;reconstruction.add(roof);group.add(remains,reconstruction,hypotheses);const stats={...metrics,meshes:0,triangles:0};group.traverse(o=>{if(o.isMesh){stats.meshes++;stats.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;o.userData.archaeologicalSite=id;}});return {id,group,remains,reconstruction,hypotheses,roofs:[{object:roof}],roof,point:f.point(0,.25,0),views,cut,historicalMask:{...cut},stats};}

function createDomus({heightAt,project,record}) {
  const center=project(...(record?.coordinate||[-.27243885,39.67744781])),yaw=-Math.PI/4,surface=heightAt(center.x,center.z),base=surface-1.15,f=frame(center,base,yaw),a=new Batch(f),r=new Batch(f),h=new Batch(f),roof=new Batch(f);
  // Metric plan follows Antoni et al.2002 fig8; unexcavated N/S extensions stop at limits.
  const atrium={x:0,z:0,w:7.31,d:3.50},tablinum={x:7.15,z:0,w:4.26,d:5.50},kitchen={x:-1.5,z:-4.28,w:3.44,d:3.70},bath={x:-2.25,z:-2.36,w:1.94,d:1.36},taberna={x:-6.1,z:-4.28,w:4.3,d:3.70};
  for(const b of [a,r]){b.box('earth',0,-.6,0,22.8,.14,14.7);b.box('gravel',0,-.34,-.6,21.2,.32,12.4);b.box('plaster',0,-.035,0,7.31,.12,3.50);for(const room of [kitchen,taberna])b.box(room===kitchen?'plaster':'earth',room.x,.015,room.z,room.w,.08,room.d);b.box('plaster',tablinum.x,.16,0,tablinum.w,.20,tablinum.d);b.box('plaster',-5.5,.025,.2,3.65,.10,3.5);b.box('plaster',4.3,.04,0,1.25,.1,5.5);pool(b,0,0,4.22,2.46,3.06,1.56,.04,.75);}
  const walls=[[-8.5,-6.38,-3.96,-6.38],[-8.5,-6.38,-8.5,-2.2],[-8.5,-2.2,-3.96,-2.2],[-3.96,-6.38,-3.96,-2.2],[-3.96,-6.38,.47,-6.38],[.47,-6.38,.47,-2.2],[-3.96,-2.2,-3.22,-2.2],[-1.28,-2.2,.47,-2.2],[-3.22,-3.25,-3.22,-1.65],[-1.28,-3.25,-1.28,-1.65],[-3.22,-3.25,-1.28,-3.25],[-3.65,-1.75,3.65,-1.75],[-3.65,1.75,3.65,1.75],[-3.65,-1.75,-3.65,-.75],[-3.65,.75,-3.65,1.75],[3.65,-1.75,3.65,-1.05],[3.65,1.05,3.65,1.75],[5.02,-2.75,9.28,-2.75],[9.28,-2.75,9.28,2.75],[5.02,2.75,9.28,2.75],[5.02,-2.75,5.02,-1.12],[5.02,1.12,5.02,2.75],[.65,-6.38,4.55,-6.38],[4.55,-6.38,4.55,-3.1],[.65,-3.1,4.55,-3.1]];
  walls.forEach((w,i)=>roughWall(a,...w,0,.38+rnd(700+i)*.37,i<11?.50:.46,700+i));
  // Broken rubble at wall heads prevents regular masonry from reading as intact new walls.
  for(let i=0;i<47;i++){const x=-8.25+rnd(2400+i)*12.5,z=-6.37+(rnd(2450+i)-.5)*.22;a.box('stone',x,.52+rnd(2500+i)*.14,z,.14+rnd(i)*.16,.12+rnd(2600+i)*.10,.19,rnd(2700+i)*.6,.86+rnd(2800+i)*.17);}
  // Documented0.58×1.12m bench, door threshold and low hydraulic bath; no hypocaust.
  for(const b of[a,r]){b.box('stone',-7.92,.25,-4.65,.58,.50,1.12);b.box('ashlar',5.02,.24,0,.48,.16,2.24);for(const z of[-.93,.93])b.box('dark',5.02,.325,z,.10,.012,.14);b.box('plaster',bath.x,.03,bath.z,bath.w,.10,bath.d);for(const side of[-1,1])b.box('plaster',bath.x,.18,bath.z+side*bath.d/2,bath.w,.26,.16);b.box('plaster',bath.x+bath.w/2,.18,bath.z,.16,.26,bath.d);b.box('ashlar',-4.35,.10,.10,.48,.18,1.56);}
  // Opus spicatum is a small surviving patch, not an invented whole-house mosaic.
  for(const b of[a,r])for(let i=0;i<10;i++)for(let j=0;j<6;j++)b.box('tile',-2.92+i*.075,.056,.58+j*.075,.105,.016,.040,(i+j)%2?Math.PI/4:-Math.PI/4,.78+rnd(i*19+j)*.3);
  const columns=[[-3.28,-1.50],[-3.28,1.50],[.12,1.50],[3.28,.10]];
  columns.forEach(([x,z],i)=>{a.box('ashlar',x,.10,z,.44,.20,.47);if(i===2)a.cylinder('plaster',x,.52,z,.15,.15,.64);else a.cylinder('dark',x,.208,z,.15,.15,.012);column(r,x,z,.06,3.15,'plaster',i===2);});
  // A fifth documented architectural element is the fallen painted shaft/capital.
  const fallen=new THREE.CylinderGeometry(.15,.15,1.20,16),matrix=new THREE.Matrix4().compose(new THREE.Vector3(2.15,.24,1.10),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2),new THREE.Vector3(1,1,1));a.geo('plaster',fallen,matrix);fallen.dispose();a.box('red',2.3,.38,1.10,.45,.035,.20);a.box('green',1.6,.40,1.10,.16,.035,.19);
  // Lower paint survives; the extension to full wall height is reconstructed.
  function paintedTablinum(b,high) {const top=high?2.9:.56;for(const z of[-2.51,2.51]){b.wall('plaster',5.25,z,9.05,z,.18,Math.min(.65,top),.025);if(high)for(let i=0;i<3;i++){const x=5.9+i*1.05;b.box('green',x,1.70,z,0.88,1.68,.035);for(const zz of[-.43,.43])b.box('ochre',x+zz,1.70,z+(z>0?-.022:.022),.018,1.5,.015);b.box('red',x+.50,1.70,z,.12,1.70,.038);}for(let i=0;i<18;i++){const x=5.35+i*.20;b.box(i%3?'ochre':'red',x,.42,z+(z>0?-.02:.02),.012,.32,.015,0,.7+rnd(i)*.3);}}b.box('plaster',9.03,.47,0,.035,.58,5.02);if(high){b.box('green',9.02,1.73,0,.04,1.7,4.9);for(const z of[-1.65,0,1.65])b.box('red',8.99,1.73,z,.025,1.7,.14);}}
  paintedTablinum(a,false);
  // Phase chosen after the private bath was inserted, before late subdivisions.
  for(const w of[[-8.5,-6.38,4.55,-6.38],[4.55,-6.38,4.55,-3.1],[-8.5,-6.38,-8.5,-2.2],[-8.5,-2.2,-3.96,-2.2],[5.02,-2.75,9.28,-2.75],[9.28,-2.75,9.28,2.75],[5.02,2.75,9.28,2.75]]){r.wall('stone',...w,0,.55,.49);r.wall('plaster',...w,.55,2.55,.46);}
  doorWall(r,'plaster',-3.96,-6.38,-3.96,-2.2,0,3.0,.5,.9,-.6);doorWall(r,'plaster',.47,-6.38,.47,-2.2,0,3.0,.5,.9,.3);doorWall(r,'plaster',5.02,-2.75,5.02,2.75,.18,3.15,.48,2.24);
  for(const w of[[-3.65,-1.75,3.65,-1.75],[-3.65,1.75,3.65,1.75]])r.wall('plaster',...w,0,.6,.28);
  paintedTablinum(r,true);
  for(const z of[-6.1,-2.47])for(let i=0;i<3;i++){r.box('red',-2.8+i*1.1,1.45,z,.83,1.5,.028);r.box('ochre',-2.8+i*1.1,2.24,z,.88,.055,.035);}
  // Completed tiled roofs are separate so the house can be inspected roofless.
  gable(roof,7.15,0,4.86,6.10,3.46,1.10);gable(roof,-3.9,-4.28,9.7,4.5,3.10,.85);
  // Compluvium: four genuine sloped surfaces with an empty aperture over the pool.
  const outer=[[-4.05,-2.30],[4.05,-2.30],[4.05,2.30],[-4.05,2.30]],inner=[[-2.18,-1.26],[2.18,-1.26],[2.18,1.26],[-2.18,1.26]];
  for(let i=0;i<4;i++){const j=(i+1)%4;roofPlane(roof,[[...outer[i].slice(0,1),3.62,outer[i][1]],[outer[j][0],3.62,outer[j][1]],[inner[j][0],3.24,inner[j][1]],[inner[i][0],3.24,inner[i][1]]]);roof.wall('wood',inner[i][0],inner[i][1],inner[j][0],inner[j][1],3.08,.18,.15);}
  // Whole atrium roof support beyond the four in-situ marks remains conjectural.
  column(h,3.28,-1.50,.06,3.15,'hypothesis');column(h,.12,-1.50,.06,3.15,'hypothesis');
  // Missing entrance/frontage, southern ala, furnishing and water are optional hypotheses.
  doorWall(h,'hypothesis',-8.65,-1.9,-8.65,2.55,.0,3.1,.35,1.40,.1);h.wall('hypothesis',-8.65,2.55,5.0,2.55,0,3.1,.35);gable(h,-6.1,.2,5.4,4.9,3.18,.70,'hypothesis');h.box('water',0,.54,0,3.00,.025,1.50);
  for(let i=0;i<7;i++)vessel(h,-7.8+(i%3)*.47,-5.8+Math.floor(i/3)*.47,.06,.9);vessel(h,-2.75,-5.55,.06,1.7);h.box('hypothesis',7.8,.65,.0,1.4,.14,.75);for(const x of[7.25,8.35])for(const z of[-.25,.25])h.box('hypothesis',x,.34,z,.08,.65,.08);h.box('hypothesis',-1.45,.50,-5.6,1.0,.9,.58);
  const cut={center:{x:center.x,z:center.z},width:23,depth:15,yaw,floorY:base-.65};
  return finishSite('domus',f,a.finish('domus-remains'),r.finish('domus-reconstruction'),h.finish('domus-hypotheses'),roof.finish('domus-roofs'),cut,{offset:[25,24,28],closeOffset:[9,9,12]},{phase:'Siglos II–III d. C. · reforma con balneum',atrium:[7.31,3.5],impluviumOuter:[4.22,2.46],impluviumInner:[3.06,1.56],tablinum:[4.26,5.5],balneum:[1.94,1.36],paint:'Pintura sobre enlucido; no mosaico figurado',verticalPlacement:'aproximación de cota publicada'});
}

export function createDomesticArchaeology({heightAt,project,records={}}) {
  const group=new THREE.Group();group.name='domestic-archaeology';const domus=createDomus({heightAt,project,record:records.domus});group.add(domus.group);return {group,sites:{domus}};
}
