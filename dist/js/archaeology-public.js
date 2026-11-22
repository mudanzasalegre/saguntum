import * as THREE from 'three';

/**
 * Public archaeological structures of Saguntum.
 * Geometry is in the atlas' absolute metre coordinates. It is an interpretive
 * model, NOT a measured survey. The source/evidence register lives alongside
 * the catalogue in archaeology-public.json and research/archaeology-public.md.
 * In particular, the 2017 circus length revision and Diana's disputed identity
 * must remain visible in the interface. No complete Diana temple is asserted.
 */
const I=new THREE.Matrix4();
const rand=n=>{const s=Math.sin(n*91.713+27.196)*43758.5453;return s-Math.floor(s);};
const palette={ancient:'#a49480',dianaStone:'#bd9e85',cutStone:'#bdac91',limestone:'#c9baa0',rubble:'#9c927e',earth:'#8b735c',sand:'#cbb992',brick:'#ab6e50',plaster:'#c2ae94',wood:'#7f6450',iron:'#45534e',glass:'#a3c9bf',water:'#7daba6',hypothesis:'#adb7a7',rock:'#aa9680',paving:'#c4bbaa',mortar:'#7f796c',leaf:'#5a6d48'};
const matCache=new Map();
function texture(kind){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.fillStyle='#d5cbbc';x.fillRect(0,0,128,128);
  for(let i=0;i<1500;i++){const r=rand(i+17);x.fillStyle=i%3?'rgba(62,51,34,.11)':'rgba(255,250,236,.19)';x.fillRect(rand(i+100)*128,rand(i+300)*128,r>.9?2:1,r>.8?2:1);}
  if(kind==='wood'){for(let i=0;i<80;i++){x.fillStyle=`rgba(65,43,24,${.04+rand(i)*.10})`;x.fillRect(rand(i+30)*128,0,.3+rand(i+90),128);}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function material(kind){
  if(!matCache.has(kind))matCache.set(kind,new THREE.MeshStandardMaterial({color:palette[kind]||'#b8aa90',vertexColors:true,roughness:kind==='water'?.35:kind==='iron'?.63:.96,metalness:kind==='iron'?.2:0,side:THREE.DoubleSide,transparent:['glass','water','hypothesis'].includes(kind),opacity:kind==='glass'?.25:kind==='water'?.7:kind==='hypothesis'?.78:1,depthWrite:kind!=='glass',map:['iron','glass','water','hypothesis'].includes(kind)?null:texture(kind)}));
  return matCache.get(kind);
}
class Batch{
  constructor(){this.parts=new Map();this.unit=new THREE.BoxGeometry(1,1,1).toNonIndexed();this.count=0;}
  geo(k,g,m=I,tint=1){const n=g.index?g.toNonIndexed():g;if(!n.attributes.normal)n.computeVertexNormals();let b=this.parts.get(k);if(!b){b={p:[],n:[],c:[],u:[]};this.parts.set(k,b);}const p=n.attributes.position,norm=n.attributes.normal,v=new THREE.Vector3(),nn=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m),cc=typeof tint==='number'?new THREE.Color(tint,tint,tint):new THREE.Color(tint);
    for(let j=0;j<p.count;j++){v.fromBufferAttribute(p,j).applyMatrix4(m);nn.fromBufferAttribute(norm,j).applyMatrix3(nm).normalize();b.p.push(v.x,v.y,v.z);b.n.push(nn.x,nn.y,nn.z);b.c.push(cc.r,cc.g,cc.b);const ax=Math.abs(nn.x),ay=Math.abs(nn.y),az=Math.abs(nn.z);b.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/2,(ay>ax&&ay>az?v.z:v.y)/2);}this.count++;if(n!==g)n.dispose();}
  box(k,x,y,z,w,h,d,yaw=0,tint=1){if(!(w>0&&h>0&&d>0))return;this.geo(k,this.unit,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(w,h,d)),tint);}
  raw(k,p,tint=1){if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geo(k,g,I,tint);g.dispose();}
  cylinder(k,p,rt,rb,h,tint=1,segments=12){const g=new THREE.CylinderGeometry(rt,rb,h,segments);this.geo(k,g,new THREE.Matrix4().makeTranslation(...p),tint);g.dispose();}
  finish(name){const g=new THREE.Group();g.name=name;let triangles=0;for(const[k,a]of this.parts){const geom=new THREE.BufferGeometry();for(const[attr,key,size]of[['position','p',3],['normal','n',3],['color','c',3],['uv','u',2]])geom.setAttribute(attr,new THREE.Float32BufferAttribute(a[key],size));geom.computeBoundingBox();geom.computeBoundingSphere();const mesh=new THREE.Mesh(geom,material(k));mesh.name=`${name} · ${k}`;mesh.castShadow=k!=='glass'&&k!=='water';mesh.receiveShadow=true;g.add(mesh);triangles+=a.p.length/9;}this.unit.dispose();g.userData.stats={drawCalls:g.children.length,triangles,parts:this.count};return g;}
}
const quad=(out,a,b,c,d)=>out.push(...a,...b,...c,...a,...c,...d);
function frame(x,z,yaw=0){const co=Math.cos(yaw),si=Math.sin(yaw);return {yaw,p:(u,y,v)=>[x+u*co+v*si,y,z-u*si+v*co],world:(u,v)=>({x:x+u*co+v*si,z:z-u*si+v*co}),box:(b,k,u,y,v,w,h,d,turn=0,t=1)=>b.box(k,x+u*co+v*si,y,z-u*si+v*co,w,h,d,yaw+turn,t)};}
function wall(b,f,k,x1,z1,x2,z2,base,height,thick,tint=1){const len=Math.hypot(x2-x1,z2-z1);f.box(b,k,(x1+x2)/2,base+height/2,(z1+z2)/2,len,height,thick,-Math.atan2(z2-z1,x2-x1),tint);}
function polygon(b,f,k,p,y,tint=1){const tri=THREE.ShapeUtils.triangulateShape(p.map(a=>new THREE.Vector2(a[0],-a[1])),[]),out=[];for(const ids of tri){const a=ids.map(j=>f.p(p[j][0],y,p[j][1]));out.push(...a[2],...a[1],...a[0]);}b.raw(k,out,tint);}
function polygonSolid(b,f,k,p,base,top,tint=1){polygon(b,f,k,p,top,tint);const out=[];for(let i=0;i<p.length;i++){const a=p[i],q=p[(i+1)%p.length];quad(out,f.p(...[a[0],base,a[1]]),f.p(q[0],base,q[1]),f.p(q[0],top,q[1]),f.p(a[0],top,a[1]));}b.raw(k,out,tint*.88);}
// Each block has its own slightly irregular outline; course joints are geometry.
function stone(b,f,k,u,cy,v,w,h,d,seed=1,tint=1){const ch=Math.min(.065,w*.06,h*.09),n=rand(seed),pts=[[-w/2+ch,-h/2], [w/2-ch*(.8+n),-h/2], [w/2,-h/2+ch], [w/2-ch*n,h/2-ch], [w/2-ch,h/2], [-w/2+ch,h/2-ch*.3],[-w/2,h/2-ch],[-w/2,-h/2+ch]];const o=[];for(let side of[-1,1])for(let j=1;j<pts.length-1;j++){const ids=side===1?[0,j,j+1]:[0,j+1,j];for(const i of ids)o.push(...f.p(u+pts[i][0],cy+pts[i][1],v+side*d/2));}for(let i=0;i<pts.length;i++){const a=pts[i],q=pts[(i+1)%pts.length];quad(o,f.p(u+a[0],cy+a[1],v-d/2),f.p(u+q[0],cy+q[1],v-d/2),f.p(u+q[0],cy+q[1],v+d/2),f.p(u+a[0],cy+a[1],v+d/2));}b.raw(k,o,tint*(.87+rand(seed+111)*.23));}
function masonry(b,f,k,x,z,w,base,h,d,seed=1,course=.46){const rows=Math.ceil(h/course),rh=h/rows;for(let row=0;row<rows;row++){let left=x-w/2,j=0;while(left<x+w/2-.025){const remain=x+w/2-left,bw=Math.min(remain,.65+rand(seed+row*83+j*31)*.9);stone(b,f,k,left+bw/2,base+(row+.5)*rh,z,bw-.018,rh-.018,d*(.94+rand(seed+j+row)*.06),seed+row*70+j);left+=bw;j++;}}}
function scatter(b,f,base,x1,x2,z1,z2,n,seed=1,kind='rubble'){for(let i=0;i<n;i++){const x=x1+(x2-x1)*rand(seed+i*5),z=z1+(z2-z1)*rand(seed+i*5+1),r=.035+rand(seed+i*5+3)*.16,g=new THREE.IcosahedronGeometry(r,0),m=new THREE.Matrix4().compose(new THREE.Vector3(...f.p(x,base+r*.25,z)),new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(i),rand(i+2),rand(i+4))),new THREE.Vector3(1.4,.65,1));b.geo(kind,g,m,.78+rand(i+9)*.3);g.dispose();}}
function archRing(b,f,k,x,base,z,width,spring,depth,thick,segments=20){const out=[];for(let i=0;i<segments;i++){const a=i*Math.PI/segments,q=(i+1)*Math.PI/segments,r=width/2,rr=r+thick;const pt=(t,R,zz)=>f.p(x+Math.cos(t)*R,base+spring+Math.sin(t)*R,z+zz);quad(out,pt(a,r,-depth/2),pt(q,r,-depth/2),pt(q,rr,-depth/2),pt(a,rr,-depth/2));quad(out,pt(q,r,depth/2),pt(a,r,depth/2),pt(a,rr,depth/2),pt(q,rr,depth/2));quad(out,pt(a,r,-depth/2),pt(q,r,-depth/2),pt(q,r,depth/2),pt(a,r,depth/2));quad(out,pt(a,rr,depth/2),pt(q,rr,depth/2),pt(q,rr,-depth/2),pt(a,rr,-depth/2));}b.raw(k,out);}
function gate(b,f,base,historical=false){
  // Gate is lintelled today: the opening is left genuinely empty.
  const kind=historical?'cutStone':'ancient',z=0;
  for(const s of[-1,1])masonry(b,f,kind,s*1.875,z,2.55,base,2.2,2.05,33+s*13,.43);
  masonry(b,f,kind,0,z,6.2,base+2.2,1.18,2.05,201,.4);
  for(let i=0;i<6;i++)stone(b,f,kind,-2.6+i*1.04,base+3.56,z,1.02,.34,2.12,600+i);
  // Surviving high lateral base and lower remnant, seen in the published photo.
  f.box(b,kind,2.04,base+3.94,0,1.73,.46,2.07,0,.99);
  f.box(b,kind,-2.04,base+3.86,0,.95,.30,1.83,0,.95);
  f.box(b,'limestone',2.04,base+4.18,0,1.88,.1,2.17,0,.89);
  for(const s of[-1,1]){f.box(b,'mortar',s*.62,base+.12,.87,.10,.09,.12);f.box(b,'mortar',s*.62,base+2.18,.88,.08,.06,.10);}
  for(let a=0;a<2;a++)for(let j=0;j<4;j++)f.box(b,'limestone',-.32+a*.66,base+.015,-.8+j*.52,.64,.10,.5,0,.85+rand(j+a)*.15);
}
function stair(b,f,k,x,z,w,base,rise,run,steps,dir=1){for(let i=0;i<steps;i++)f.box(b,k,x,base+(i+1)*rise/steps/2,z+dir*(i+.5)*run/steps,w,(i+1)*rise/steps,run/steps+.01,0,.9+rand(i)*.08);}
function makeCircus(record,heightAt,project){
  const a=project(...record.coordinate),yaw=-.307,f=frame(a.x,a.z,yaw),street=heightAt(a.x,a.z)+.02,base=street-1.9;
  const now=new Batch(),his=new Batch(),hyp=new Batch();
  const pit={x:-2,z:-.5,w:17.4,d:8.8};
  f.box(now,'earth',pit.x,base-.24,pit.z,pit.w,.44,pit.d);
  f.box(now,'sand',pit.x,base+.015,pit.z,pit.w-.3,.08,pit.d-.3,0,.78);
  for(const side of[-1,1])wall(now,f,'earth',pit.x+side*pit.w/2,pit.z-pit.d/2,pit.x+side*pit.w/2,pit.z+pit.d/2,base,1.9,.23,.9);
  wall(now,f,'earth',pit.x-pit.w/2,pit.z-pit.d/2,pit.x+pit.w/2,pit.z-pit.d/2,base,1.9,.23,.9);
  wall(now,f,'earth',pit.x-pit.w/2,pit.z+pit.d/2,pit.x+pit.w/2,pit.z+pit.d/2,base,1.9,.23,.9);
  // Excavated longitudinal and transverse bases near the southern entrance.
  for(const v of[-3.05,2.5])masonry(now,f,'rubble',-5.8,v,7.4,base,.67,.65,11+Math.floor(v*5),.25);
  for(const u of[-8.8,-5.8]){const ff=frame(...f.p(u,0,-.3).filter((_,i)=>i!==1),yaw+Math.PI/2);masonry(now,ff,'rubble',0,0,5,base,.42,.62,20+u,.22);}
  scatter(now,f,base,-10.2,6.2,-4.2,3.8,170,303);
  gate(now,f,base);
  // Modern viewing edge and access: interpretive layout, never called Roman.
  for(const v of[-5.05,4.2]){f.box(now,'paving',-2,street+.06,v,18.3,.18,.8);for(let j=0;j<13;j++)f.box(now,'iron',-10.7+j*1.45,street+.55,v,.045,1.05,.045);f.box(now,'iron',-2,street+1.06,v,18.2,.04,.045);}
  for(const u of[-11.1,7.05]){f.box(now,'paving',u,street+.04,-.4,.75,.18,10);for(let j=0;j<8;j++)f.box(now,'iron',u,street+.56,-5+j*1.3,.045,1.05,.045);f.box(now,'iron',u,street+1.06,-.45,.045,.04,10.1);}
  for(let j=0;j<12;j++)f.box(now,'wood',-.4,street+.13,-4.7+j*.15,4.1,.09,.135,0,.8+rand(j)*.15);
  f.box(now,'glass',-.4,street+.62,-2.96,4.2,.9,.025);
  stair(now,f,'paving',5.75,-3.7,1.25,base,1.9,4.1,10,1);
  for(let j=0;j<4;j++)f.box(now,'iron',5.03,base+.6+j*.46,-3.1+j*.97,.04,1.05,.04);
  // Historically only the ancient gate and the known base line persist.
  // Centre relative to the preserved southern gate; the closure remains uncertain.
  const cc=f.world(-80,-35),cf=frame(cc.x,cc.z,yaw),L=273,R=35,west=-L/2,curve=L/2-R,inner=R-11;
  const groundY=base;
  cf.box(his,'earth',0,groundY-.55,0,299,1.06,94,0,.92);
  cf.box(his,'sand',0,groundY-.01,0,299,.10,94,0,.94);
  const outline=[[west,-R],[curve,-R]];for(let i=1;i<=48;i++){const ang=-Math.PI/2+i*Math.PI/48;outline.push([curve+R*Math.cos(ang),R*Math.sin(ang)]);}outline.push([west,R]);
  polygonSolid(his,cf,'sand',outline,groundY-.08,groundY+.02,.97);
  // Two continuous rectilinear walls and radial supports are documented in plan.
  const wallT=.78,knownWest=west+36;
  for(const s of[-1,1]){
    for(const v of[R,R-3.4,inner]){
      if(s===1){const gap=v===R?3.15:.72;wall(his,cf,'cutStone',knownWest,s*v,80-gap,s*v,groundY,v===inner?.92:1.02,wallT);wall(his,cf,'cutStone',80+gap,s*v,curve,s*v,groundY,v===inner?.92:1.02,wallT);}
      else wall(his,cf,'cutStone',knownWest,s*v,curve,s*v,groundY,v===inner?.92:1.02,wallT);
    }
    for(let u=knownWest+5;u<curve-1;u+=6){if(s===1&&Math.abs(u-80)<5)continue;wall(his,cf,'rubble',u,s*inner,u,s*R,groundY,.65,.65,.98);}
    // Repeated narrow courses make the datum legible without inventing vaults.
    for(let u=knownWest;u<curve;u+=2.25)if(!(s===1&&Math.abs(u-80)<3.7))cf.box(his,'limestone',u,groundY+1.04,s*R,2.2,.13,.9,0,.92+rand(u)*.09);
  }
  for(let i=0;i<48;i++){
    const a=-Math.PI/2+i*Math.PI/48,q=-Math.PI/2+(i+1)*Math.PI/48;
    for(const rr of[R,R-3.4,inner]){if(Math.abs(rr*Math.sin((a+q)/2))<1.6)continue;wall(his,cf,'cutStone',curve+rr*Math.cos(a),rr*Math.sin(a),curve+rr*Math.cos(q),rr*Math.sin(q),groundY,rr===inner?.92:1.02,.78);}
    if(i%5===0)wall(his,cf,'rubble',curve+inner*Math.cos(a),inner*Math.sin(a),curve+R*Math.cos(a),R*Math.sin(a),groundY,.6,.65);
  }
  gate(his,f,base,true);
  // Tribunal beside the door: low platform and stairs; its upper finish is uncertain.
  cf.box(his,'cutStone',73.7,groundY+.95,29.8,5.7,1.9,6.1);
  stair(his,cf,'limestone',73.7,23,2.05,groundY,1.9,3.75,10,1);
  for(let j=0;j<5;j++)cf.box(his,'limestone',71.3+j*1.18,groundY+1.95,29.8,1.16,.1,6.3,0,.93);
  // Low central barrier and water channel, dimensions constrained by excavation.
  const spinaStart=-93,spinaEnd=97,spinaZ=.8,ew=4.35;
  cf.box(his,'cutStone',(spinaStart+spinaEnd)/2,groundY+.48,spinaZ,190,.96,ew+.84,0,.95);
  cf.box(his,'mortar',2,groundY+.98,spinaZ,189,.04,ew,0,.84);
  cf.box(his,'water',2,groundY+1.015,spinaZ,188.9,.035,ew-.1);
  for(const s of[-1,1])cf.box(his,'limestone',2,groundY+1.14,spinaZ+s*(ew/2+.2),190.3,.3,.4,0,1);
  for(const x of[spinaStart,spinaEnd])cf.box(his,'limestone',x,groundY+1.14,spinaZ,.4,.3,ew+.8);
  for(let j=0;j<95;j++)for(const s of[-1,1])cf.box(his,'cutStone',spinaStart+j*2+.95,groundY+.65,spinaZ+s*(ew/2+.43),1.87,.54,.08,0,.88+rand(j)*.15);
  // Porta Triumphalis is documented at the eastern end; its complete elevation is not.
  const ef=frame(...cf.p(curve+R,0,0).filter((_,i)=>i!==1),yaw-Math.PI/2);
  for(const s of[-1,1])masonry(his,ef,'cutStone',s*2.15,0,1.3,groundY,1.04,1.4,13+s,.5);
  ef.box(his,'limestone',0,groundY+.025,0,3.1,.1,4.3,0,.85);
  // Hypotheses: timber cavea, upper perimeter, lost west closure and metae.
  for(const s of[-1,1]){
    for(let row=0;row<12;row++){
      const v=s*(inner+.5+row*.83),yy=groundY+1.16+row*.34;
      if(s===1){for(const[lo,hi]of[[west,78.5],[81.5,curve]])cf.box(hyp,'wood',(lo+hi)/2,yy,v,hi-lo,.14,.78,0,.88+row*.012);}else cf.box(hyp,'wood',(west+curve)/2,yy,v,curve-west,.14,.78,0,.88+row*.012);
      if(row%3===0)for(let u=west+4;u<curve-1;u+=6)cf.box(hyp,'wood',u,groundY+(yy-groundY)/2,v,.17,yy-groundY,.17,0,.83);
    }
    if(s===1){wall(hyp,cf,'hypothesis',west,s*R,76.7,s*R,groundY+1.15,4.25,.65);wall(hyp,cf,'hypothesis',83.3,s*R,curve,s*R,groundY+1.15,4.25,.65);}else wall(hyp,cf,'hypothesis',west,s*R,curve,s*R,groundY+1.15,4.25,.65);
    cf.box(hyp,'hypothesis',(west+curve)/2,groundY+5.42,s*R,curve-west,.18,.88);
    for(let u=west+16;u<curve-8;u+=25){stair(hyp,cf,'hypothesis',u,s*inner,1.28,groundY+.95,4.3,11,15,s);}
    for(let u=west+3;u<curve;u+=6)cf.box(hyp,'wood',u,groundY+4.85,s*33.4,.14,1.15,.14);
    cf.box(hyp,'wood',(west+curve)/2,groundY+5.38,s*33.4,curve-west,.10,.10);
  }
  for(let i=0;i<48;i++){
    const a=-Math.PI/2+i*Math.PI/48,q=-Math.PI/2+(i+1)*Math.PI/48;
    for(let row=0;row<12;row++){const rr=inner+.5+row*.83,oy=groundY+1.16+row*.34,o=[];if(Math.abs(rr*Math.sin((a+q)/2))<2.1)continue;quad(o,cf.p(curve+(rr-.39)*Math.cos(a),oy,(rr-.39)*Math.sin(a)),cf.p(curve+(rr+.39)*Math.cos(a),oy,(rr+.39)*Math.sin(a)),cf.p(curve+(rr+.39)*Math.cos(q),oy,(rr+.39)*Math.sin(q)),cf.p(curve+(rr-.39)*Math.cos(q),oy,(rr-.39)*Math.sin(q)));hyp.raw('wood',o,.88+row*.012);}
    if(Math.abs(R*Math.sin((a+q)/2))>1.6)wall(hyp,cf,'hypothesis',curve+R*Math.cos(a),R*Math.sin(a),curve+R*Math.cos(q),R*Math.sin(q),groundY+1.15,4.25,.65);
  }
  // West end not preserved: an intentionally restrained, optional starting facade.
  for(let j=0;j<=10;j++){const v=-31+j*6.2;cf.box(hyp,'hypothesis',west+2,groundY+2.1,v,3.6,4.2,.58);if(j<10){cf.box(hyp,'hypothesis',west+2,groundY+4.3,v+3.1,3.6,.34,5.7);for(let n=0;n<7;n++)cf.box(hyp,'wood',west+3.85,groundY+1.25,v+.6+n*.72,.10,2.5,.11);}}
  for(const s of[-1,1])cf.box(hyp,'hypothesis',west+1.8,groundY+2.95,s*33.4,5.4,5.9,3.2);
  // A possible monumental upper arch is kept outside the conserved gate layer.
  for(const s of[-1,1])f.box(hyp,'hypothesis',s*2.04,base+4.64,0,.7,1.0,1.9);
  archRing(hyp,f,'hypothesis',0,base,0,3.4,4.8,1.9,.5,20);
  for(const s of[-1,1])ef.box(hyp,'hypothesis',s*2.15,groundY+1.65,0,1.3,1.35,1.4);
  archRing(hyp,ef,'hypothesis',0,groundY,0,3,2.48-1.5,1.4,.55,20);
  for(const x of[spinaStart-2,spinaEnd+2])for(let j=0;j<3;j++)hyp.cylinder('hypothesis',cf.p(x,groundY+2.0,spinaZ+(j-1)*1.25),.08,.52,2.1,.95,14);
  for(const s of[-1,1])cf.box(hyp,'hypothesis',73.7,groundY+2.58,29.8+s*3.05,5.8,1.15,.34);
  cf.box(hyp,'hypothesis',71.0,groundY+2.58,29.8,.34,1.15,6.2);
  const remains=now.finish('circo-restos'),reconstruction=his.finish('circo-historico'),hypotheses=hyp.finish('circo-hipotesis'),group=new THREE.Group();group.name='Puerta y circo romano';group.add(remains,reconstruction,hypotheses);reconstruction.visible=hypotheses.visible=false;
  const pm=f.world(pit.x,pit.z);return {id:'circo',group,remains,reconstruction,hypotheses,point:new THREE.Vector3(a.x,street+1.35,a.z),views:{offset:[22,19,25],closeOffset:[7,5,-11]},cut:null,currentMask:{center:pm,width:pit.w+.9,depth:pit.d+1.1,yaw,floorY:base-.5},historicalMask:{center:cc,width:299,depth:94,yaw,floorY:base-.6},stats:{remains:remains.userData.stats,reconstruction:reconstruction.userData.stats,hypotheses:hypotheses.userData.stats,historicalLength:273,historicalWidth:70}};
}

// Extruded irregular polygon for the larger, carefully fitted Diana blocks.
function cyclopean(b,f,u,v,base,w,h,d,seed,kind='dianaStone'){
  const lean=(rand(seed)-.5)*.09,notch=seed%5===0?.035:0,pts=[[-w/2+.02,.015],[w/2-.02,.015],[w/2-lean,h*.42],[w/2-.02,h-.015],[-w/2+lean,h-.015],[-w/2+.02,h*.6+notch]],o=[];
  // A very shallow faceted face gives quarried relief without opening false gaps.
  for(const side of[-1,1])for(let j=0;j<pts.length;j++){
    const p=pts[j],q=pts[(j+1)%pts.length],mid=f.p(u,base+h*.51,v+side*(d/2+.018+rand(seed)*.03));
    if(side===1)o.push(...f.p(u+p[0],base+p[1],v+side*d/2),...f.p(u+q[0],base+q[1],v+side*d/2),...mid);
    else o.push(...f.p(u+q[0],base+q[1],v+side*d/2),...f.p(u+p[0],base+p[1],v+side*d/2),...mid);
  }
  for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];quad(o,f.p(u+p[0],base+p[1],v-d/2),f.p(u+q[0],base+q[1],v-d/2),f.p(u+q[0],base+q[1],v+d/2),f.p(u+p[0],base+p[1],v+d/2));}
  b.raw(kind,o,.81+rand(seed+16)*.25);
}
function dianaAncient(b,f,base,kind='dianaStone',complete=false){
  const course=[.72,.69,.66,.81,.72,.58],width=15.65;let bottom=base;
  for(let r=0;r<course.length;r++){
    const h=course[r];let x=-width/2,i=0;
    while(x<width/2-.05){let w=Math.min(width/2-x,1.15+rand(103+r*21+i*9)*1.65);const loss=!complete&&r===5&&i%3===1?.13:0;
      cyclopean(b,f,x+w/2,0,bottom,w-.025,h-.035-loss,1.06,50+r*49+i,kind);x+=w;i++;
    }bottom+=h;
  }
  // Short return is in both historic descriptions and present wall cartography.
  const p=f.world(-width/2,3.65),rf=frame(p.x,p.z,f.yaw+Math.PI/2);let y=base;
  for(let r=0;r<5;r++){masonry(b,rf,kind,0,0,7.3,y,.66,1.06,350+r,.66);y+=.66;}
}
function makeDiana(record,heightAt,project){
  const p0=project(-.2789173,39.6786198),p1=project(-.278743,39.6785668),cx=(p0.x+p1.x)/2,cz=(p0.z+p1.z)/2,yaw=-Math.atan2(p1.z-p0.z,p1.x-p0.x),f=frame(cx,cz,yaw);
  // Visible front lies on the lower side of the hillside; no invented deep crypt.
  const ground=heightAt(cx,cz),base=ground+.08;
  const now=new Batch(),his=new Batch(),hyp=new Batch();
  const bed=[[-8.9,-2.3],[8.7,-2],[9,1.7],[7.6,7.8],[-8.6,8.3],[-9,4.2]];
  polygonSolid(now,f,'rock',bed,base-.7,base-.03,.96);
  for(let i=0;i<26;i++){const gg=new THREE.IcosahedronGeometry(.42+rand(i+14)*.44,0),m=new THREE.Matrix4().compose(new THREE.Vector3(...f.p(-8+rand(i+40)*16,base-.12,-1-rand(i+70)*1.35)),new THREE.Quaternion(),new THREE.Vector3(1.8,.4,1));now.geo('rock',gg,m,.83+rand(i)*.16);gg.dispose();}
  dianaAncient(now,f,base);
  // Later rubble and brick are deliberately confined to present-day state.
  const upperBase=base+4.18;f.box(now,'mortar',0,upperBase+1.35,0,15.6,2.7,.97);
  for(let row=0;row<8;row++){let x=-7.8,j=0;while(x<7.75){const w=Math.min(7.8-x,.20+rand(row*147+j*11)*.58);const v=rand(row*14+j)>.72?'brick':'rubble';stone(now,f,v,x+w/2,upperBase+(row+.5)*.34,0,w-.018,.31,1.07,row*194+j,.94);x+=w;j++;}}
  // Two blocked historic openings and remnants of render, as visible in photos.
  for(const x of[-4.6,-.6]){f.box(now,'mortar',x,base+4.8,-.56,1.15,1.32,.07);for(const s of[-1,1])stone(now,f,'limestone',x+s*.64,base+4.8,-.6,.26,1.5,.15,2+x+s,.9);stone(now,f,'limestone',x,base+5.56,-.6,1.55,.25,.15,9+x,.9);for(let j=0;j<4;j++)masonry(now,f,'rubble',x,-.66,1.1,base+4.15+j*.32,.3,.12,22+j+x,.3);}
  f.box(now,'plaster',4.05,base+5.45,-.56,4.3,2.3,.07,0,.82);
  f.box(now,'plaster',-4.1,base+6.48,-.56,6.4,.62,.07,0,.93);
  // Irregular upper edge and reddish masonry reflect successive occupation.
  for(let row=0;row<7;row++){let x=-7.8,j=0;while(x<7.8){const w=Math.min(.46,7.8-x),edge=7.8-Math.abs(x)*.045;if(6.9+row*.16<edge)f.box(now,'brick',x+w/2,base+6.9+row*.16,0,w-.015,.13,1.01,0,.8+rand(j+row*50)*.22);x+=w;j++;}}
  for(const x of[-7.75,7.75])masonry(now,f,'limestone',x,0,.47,base+4.1,3.68,1.13,99+x,.52);
  // Present plaza and discreet rail: enough immediate context to read the wall.
  f.box(now,'paving',0,base-.13,-5.1,18.4,.2,5.2,0,.96);
  for(let i=0;i<20;i++)f.box(now,'mortar',-9+i*.95,base-.02,-5.1,.018,.015,5.2,0,.75);
  for(let j=0;j<5;j++)f.box(now,'mortar',0,base-.015,-7.5+j*1.05,18.4,.012,.018,0,.75);
  for(const x of[-9.4,9.35]){for(let j=0;j<9;j++)f.box(now,'iron',x,base+.56,-7.5+j*.62,.028,1.2,.028);f.box(now,'iron',x,base+1.15,-5.1,.04,.04,5.1);}
  for(const x of[-5.5,4.8]){f.box(now,'paving',x,base+.38,-5.7,3.2,.24,.7);for(const s of[-1,1])f.box(now,'paving',x+s*1.15,base+.15,-5.7,.28,.3,.6);}
  scatter(now,f,base-.01,-8.4,8.1,-2.4,-.65,70,801,'rock');
  // Historical state: only the identifiable old fabric, free of later additions.
  f.box(his,'earth',0,base-.55,1,22,1.0,21,0,.95);
  polygonSolid(his,f,'rock',bed,base-.3,base-.035,.96);
  dianaAncient(his,f,base,'cutStone',true);
  // A possible terrace, separately toggleable. Neither a cella nor colonnade is known.
  f.box(hyp,'hypothesis',.1,base+2.2,4.5,14.1,4.35,7.8,0,.87);
  f.box(hyp,'hypothesis',.1,base+4.41,4.5,14.1,.08,7.8,0,1);
  for(let row=0;row<2;row++)for(let j=0;j<10;j++)f.box(hyp,'hypothesis',-7.06+j*1.57,base+4.5+row*.4,0,1.53,.37,1.05);
  const remains=now.finish('diana-restos'),reconstruction=his.finish('diana-fabrica-antigua'),hypotheses=hyp.finish('diana-hipotesis-terraza'),group=new THREE.Group();group.name='Muro del llamado Templo de Diana';group.add(remains,reconstruction,hypotheses);reconstruction.visible=hypotheses.visible=false;
  return {id:'diana',group,remains,reconstruction,hypotheses,point:new THREE.Vector3(cx,base+3.5,cz),views:{offset:[15,13,-21],closeOffset:[5,5,-12]},cut:null,historicalMask:{center:f.world(0,1),width:22,depth:21,yaw,floorY:base-.6},stats:{remains:remains.userData.stats,reconstruction:reconstruction.userData.stats,hypotheses:hypotheses.userData.stats,visibleAncientHeight:4.18,ancientChronology:'disputed'}};
}
export function createPublicArchaeology({heightAt,project,records,dianaSite,excludeIds=[]}){
  const lookup=Array.isArray(records)?Object.fromEntries(records.map(s=>[s.id,s])):records,group=new THREE.Group(),sites={};group.name='Arqueología · espacios públicos';
  for(const [id,build]of[['circo',makeCircus],['diana',makeDiana]]){if(!lookup?.[id]||excludeIds.includes(id))continue;const site=id==='diana'&&dianaSite?dianaSite:build(lookup[id],heightAt,project);sites[id]=site;group.add(site.group);}return {group,sites};
}
