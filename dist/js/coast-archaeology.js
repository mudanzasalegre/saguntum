import * as THREE from 'three';

// Grau Vell: a cartographically anchored reading of the excavated area, not a
// substitute for the unpublished 2025 archaeological survey. Every elevation
// above the recorded remains is an explicitly interpretative reconstruction.
const Y=new THREE.Vector3(0,1,0),I=new THREE.Matrix4(),R=Math.PI/180;
const rand=n=>{const s=Math.sin(n*127.91+43.71)*43758.5453;return s-Math.floor(s);};
const palette={mortar:'#aa9c88',rodeno:'#b68063',rodenoLight:'#c59878',pebble:'#b3a58d',limestone:'#c2b9a2',gravel:'#c7bca7',earth:'#a59478',plaster:'#e6d4b3',tile:'#a9694c',tileLight:'#bb825e',wood:'#69513a',dark:'#3d4439',metal:'#586256',linen:'#cbbd94',pottery:'#bf855e',potteryDark:'#996748',marine:'#8b9b79',sand:'#a8ad92',leaf:'#738066',hypothesis:'#80b9b6'};
const materials=new Map(),stones=new Map();
function grain(){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#ded8c9';ctx.fillRect(0,0,256,256);
 for(let i=0;i<6500;i++){const v=110+Math.floor(rand(i+17)*130);ctx.fillStyle=`rgba(${v},${v},${v},${.12+rand(i+5)*.28})`;ctx.fillRect(rand(i+2)*256,rand(i+3)*256,.6+rand(i+4)*1.8,.6+rand(i+6)*1.8);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function mat(k){if(!materials.has(k))materials.set(k,new THREE.MeshStandardMaterial({color:palette[k],vertexColors:true,roughness:k==='metal'?.68:.96,metalness:k==='metal'?.18:0,side:THREE.DoubleSide,map:['gravel','plaster','sand'].includes(k)?grain():null,transparent:k==='hypothesis',opacity:k==='hypothesis'?.72:1,depthWrite:k!=='hypothesis'}));return materials.get(k);}
class Batch{
 constructor(){this.data=new Map();this.boxUnit=new THREE.BoxGeometry(1,1,1);this.count=0;}
 geo(k,g,m=I,t=1){
  let o=this.data.get(k);if(!o){o={p:[],n:[],u:[],c:[],i:[]};this.data.set(k,o);}if(!g.attributes.normal)g.computeVertexNormals();
  const p=g.attributes.position,n=g.attributes.normal,first=o.p.length/3,nm=new THREE.Matrix3().getNormalMatrix(m),v=new THREE.Vector3(),nn=new THREE.Vector3(),color=typeof t==='number'?[t,t,t]:t;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);nn.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();o.p.push(v.x,v.y,v.z);o.n.push(nn.x,nn.y,nn.z);o.u.push((Math.abs(nn.x)>.7?v.z:v.x)*1.8,(Math.abs(nn.y)>.7?v.z:v.y)*1.8);o.c.push(...color);}
  if(g.index)for(const n of g.index.array)o.i.push(first+n);else for(let j=0;j<p.count;j++)o.i.push(first+j);this.count++;
 }
 box(k,x,y,z,w,h,d,yaw=0,t=1){this.geo(k,this.boxUnit,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(Y,yaw),new THREE.Vector3(w,h,d)),t);}
 cylinder(k,x,y,z,rt,rb,h,n=10,t=1){const g=new THREE.CylinderGeometry(rt,rb,h,n);this.geo(k,g,new THREE.Matrix4().makeTranslation(x,y,z),t);g.dispose();}
 beam(k,a,b,r=.04){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),g=new THREE.CylinderGeometry(r,r,d.length(),6);this.geo(k,g,new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(Y,d.normalize()),new THREE.Vector3(1,1,1)));g.dispose();}
 raw(k,p,t=1){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geo(k,g,I,t);g.dispose();}
 finish(name){const group=new THREE.Group();group.name=name;let triangles=0,vertices=0;for(const[k,o]of this.data){const g=new THREE.BufferGeometry();for(const[name,arr,size]of [['position',o.p,3],['normal',o.n,3],['uv',o.u,2],['color',o.c,3]])g.setAttribute(name,new THREE.Float32BufferAttribute(arr,size));g.setIndex(o.i);g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat(k));mesh.name=`${group.name} · ${k}`;mesh.castShadow=k!=='hypothesis';mesh.receiveShadow=true;group.add(mesh);triangles+=o.i.length/3;vertices+=o.p.length/3;}group.userData.stats={triangles,vertices,drawCalls:group.children.length,geometricParts:this.count};this.boxUnit.dispose();return group;}
}
function frame(x,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);return {yaw,world:(u,v)=>({x:x+u*c+v*s,z:z-u*s+v*c}),p:(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c],box:(b,k,u,y,v,w,h,d,turn=0,t=1)=>{const q={x:x+u*c+v*s,z:z-u*s+v*c};b.box(k,q.x,y,q.z,w,h,d,yaw+turn,t);}};}
const quad=(p,a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
function polygon(b,k,p,y){const q=p.map(v=>new THREE.Vector2(v.x,-v.z)),ts=THREE.ShapeUtils.triangulateShape(q,[]),positions=[];for(const t of ts)positions.push(...t.flatMap(i=>[p[i].x,y,p[i].z]));b.raw(k,positions);}
function expositorySeabed(b,outline,survey,project){
 // A continuous display substrate supports the stones at their approximate
 // depths. Its smooth banks are NOT a recovered bathymetric survey.
 const fields=['gola','trencatimons','exterior'].map(key=>{const s=survey[key],p=project(...s.coordinate),a=s.yawDegrees*R;return{key,s,p,c:Math.cos(a),sn:Math.sin(a)};});
 const smooth=t=>{const q=Math.max(0,Math.min(1,t));return q*q*(3-2*q);};
 function height(x,z){let h=survey.seafloorExpository;for(const f of fields){const dx=x-f.p.x,dz=z-f.p.z,u=dx*f.c-dz*f.sn,v=dx*f.sn+dz*f.c;let top,weight;
  if(f.key==='gola'){const r=Math.hypot(Math.max(0,Math.abs(u)-4.9)/6,Math.max(0,Math.abs(v)-18.6)/8);top=-2.64;weight=1-smooth(r);}
  else{const r=Math.hypot(u/(f.s.width/2),v/(f.s.length/2));top=(f.key==='exterior'?-4.15:-3)+.06+Math.max(0,1-r*r)*(f.key==='exterior'?1.8:.72);weight=1-smooth((r-1)/.36);}
  h=Math.max(h,survey.seafloorExpository+(top-survey.seafloorExpository)*weight);
 }return h;}
 const q=outline.map(v=>new THREE.Vector2(v.x,-v.z)),ts=THREE.ShapeUtils.triangulateShape(q,[]),positions=[],indices=[],cache=new Map();
 const vertex=p=>{const key=p.x.toFixed(6)+':'+p.z.toFixed(6);if(!cache.has(key)){cache.set(key,positions.length/3);positions.push(p.x,height(p.x,p.z),p.z);}return cache.get(key);};
 const midpoint=(a,c)=>({x:(a.x+c.x)/2,z:(a.z+c.z)/2});
 function split(a,c,d,n){if(!n){indices.push(vertex(a),vertex(c),vertex(d));return;}const ac=midpoint(a,c),cd=midpoint(c,d),da=midpoint(d,a);split(a,ac,da,n-1);split(ac,c,cd,n-1);split(da,cd,d,n-1);split(ac,cd,da,n-1);}
 for(const t of ts)split(outline[t[0]],outline[t[1]],outline[t[2]],6);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();b.geo('sand',g);g.dispose();
}
function stoneGeometry(seed,round=false){
 const key=(round?'p':'s')+Math.floor(seed%13);if(stones.has(key))return stones.get(key);
 let g;if(round)g=new THREE.DodecahedronGeometry(.58,0);else{
  g=new THREE.BoxGeometry(1,1,1);const a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),id=(x>0?1:0)+(y>0?2:0)+(z>0?4:0);a.setXYZ(i,x+(rand(seed+id*5)-.5)*.12,y+(rand(seed+id*5+1)-.5)*.12,z+(rand(seed+id*5+2)-.5)*.12);}g.computeVertexNormals();
 }stones.set(key,g);return g;
}
function rock(b,k,x,y,z,w,h,d,seed,yaw=0,rounded=false,tint=1){b.geo(k,stoneGeometry(seed,rounded),new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler((rand(seed+2)-.5)*.09,yaw+(rand(seed)-.5)*.08,(rand(seed+3)-.5)*.09)),new THREE.Vector3(w,h,d)),tint);}
function masonry(b,a,c,base,height,width,seed,kind='mixed'){
 const length=Math.hypot(c.x-a.x,c.z-a.z);if(length<.06)return;const yaw=-Math.atan2(c.z-a.z,c.x-a.x),f=frame((a.x+c.x)/2,(a.z+c.z)/2,yaw),rows=Math.max(1,Math.ceil(height/.24)),rh=height/rows;
 f.box(b,'mortar',0,base+height*.47,0,length,.90*height,width*.82);
 for(let row=0;row<rows;row++)for(const side of [-1,1]){
  let u=-length/2,index=0;while(u<length/2-.05){const s=seed+row*307+index*11+(side+1)*41,w=Math.min(.34+rand(s)*.42,length/2-u),p=f.world(u+w/2,side*width*.29);if(w<.05)break;const rounded=kind==='mixed'&&rand(s+3)>.45,k=kind==='rodeno'?(rand(s+4)>.5?'rodeno':'rodenoLight'):rounded?'pebble':rand(s+4)>.65?'limestone':'rodeno';rock(b,k,p.x,base+row*rh+rh*.49,p.z,w-.02,rh*.94,width*.63,s,yaw,rounded,.86+rand(s+5)*.24);u+=w;index++;}
 }
}
function fwall(b,f,a,c,base,h,w,seed,kind='mixed'){masonry(b,f.world(...a),f.world(...c),base,h,w,seed,kind);}
function brokenPaving(b,f,cx,cz,base,w,d,seed=1){
 f.box(b,'earth',cx,base-.005,cz,w,.08,d);const rows=Math.ceil(d/.72),cols=Math.ceil(w/.77),cw=w/cols,ch=d/rows;
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const s=seed+i*41+j*7;if(rand(s)<.12)continue;const p=f.world(cx-w/2+(j+.5)*cw+(rand(s+2)-.5)*.08,cz-d/2+(i+.5)*ch);rock(b,rand(s+3)>.5?'limestone':'rodenoLight',p.x,base+.065+(rand(s+6)-.5)*.035,p.z,cw-.035,.14,ch-.03,s,f.yaw,false,.90+rand(s+4)*.19);}
}
function groundDoor(b,f,u,z,base,width,wallWidth,height,depth,kind='plaster'){
 const part=(wallWidth-width)/2;f.box(b,kind,u-wallWidth/2+part/2,base+height/2,z,part,height,depth);f.box(b,kind,u+wallWidth/2-part/2,base+height/2,z,part,height,depth);
 const dh=2.45;f.box(b,kind,u,base+(dh+height)/2,z,width,height-dh,depth);f.box(b,'wood',u,base+dh,z,width+.24,.20,depth+.08);for(const s of[-1,1])f.box(b,'wood',u+s*(width/2-.03),base+dh/2,z,.12,dh,.18);
 f.box(b,'limestone',u,base+.06,z,width+.08,.13,depth+.32);
}
function smallWindow(b,f,u,base,z,w=.68,h=.8){f.box(b,'dark',u,base,z,w,h,.05);for(const s of[-1,1])f.box(b,'wood',u+s*w/2,base,z+.035,.075,h+.08,.08);f.box(b,'wood',u,base-h/2,z+.045,w+.16,.10,.14);}
function amphora(b,f,u,base,v,seed){
 const profile=[[.035,0],[.08,.12],[.25,.44],[.30,.73],[.24,.94],[.125,1.04],[.12,1.23],[.15,1.25],[.15,1.30],[.10,1.30]],g=new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),10),p=f.world(u,v),q=new THREE.Quaternion().setFromAxisAngle(Y,rand(seed)*Math.PI*2),m=new THREE.Matrix4().compose(new THREE.Vector3(p.x,base,p.z),q,new THREE.Vector3(1,1,1));b.geo(seed%3?'pottery':'potteryDark',g,m,.91+rand(seed+6)*.15);g.dispose();
 for(const s of[-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(s*.12,1.19,0),new THREE.Vector3(s*.32,1.13,0),new THREE.Vector3(s*.34,.91,0),new THREE.Vector3(s*.24,.88,0)]),h=new THREE.TubeGeometry(curve,7,.034,4,false);b.geo('pottery',h,m);h.dispose();}
}
function tiledRoof(b,f,width,length,base){
 const half=width/2+.25,rise=1.35,end=length/2+.28,p=[];
 quad(p,f.p(-half,base,-end),f.p(-half,base,end),f.p(0,base+rise,end),f.p(0,base+rise,-end));quad(p,f.p(0,base+rise,-end),f.p(0,base+rise,end),f.p(half,base,end),f.p(half,base,-end));b.raw('tile',p);
 const gable=[];for(const s of[-1,1])gable.push(...f.p(-width/2,base,s*length/2),...f.p(width/2,base,s*length/2),...f.p(0,base+rise,s*length/2));b.raw('plaster',gable);
 // Broad tegula beds with raised imbrex joints, rather than modern slate sheets.
 for(const s of[-1,1])for(let z=-end+.15;z<end;z+=.43){const aa=f.p(s*.04,base+rise+.065,z),bb=f.p(s*(half-.03),base+.07,z);b.beam(z%2>.5?'tileLight':'tile',aa,bb,.045);}
 b.beam('tileLight',f.p(0,base+rise+.06,-end),f.p(0,base+rise+.06,end),.09);
 for(const s of[-1,1])f.box(b,'wood',s*(width/2-.03),base-.08,0,.13,.16,length+.20);
}
function dashed(b,points,y,kind='hypothesis',width=.13){for(let i=1;i<points.length;i++){const a=points[i-1],c=points[i],dx=c.x-a.x,dz=c.z-a.z,len=Math.hypot(dx,dz);for(let p=0;p<len;p+=2.1){const end=Math.min(len,p+1.2),aa=[a.x+dx*p/len,y,a.z+dz*p/len],bb=[a.x+dx*end/len,y,a.z+dz*end/len];b.beam(kind,aa,bb,width);}}}

function createSite(record,heightAt,project){
 const cp=project(...record.coordinate),base=heightAt(cp.x,cp.z)+.10,land=record.footprint.map(p=>project(...p)),survey=record.survey;
 const current=new Batch(),historical=new Batch(),roofBatch=new Batch(),marineCurrent=new Batch(),marineHistory=new Batch();
 polygon(current,'gravel',land,base+.025);polygon(historical,'earth',land,base+.025);
 for(let i=0;i<survey.walls.length;i++){const w=survey.walls[i],p=w.path.map(c=>project(...c));for(let j=1;j<p.length;j++)masonry(current,p[j-1],p[j],base,w.height,w.width,500+i*53+j*199,w.kind);}
 const tp=project(...survey.tower.coordinate),tf=frame(tp.x,tp.z,survey.tower.yawDegrees*R),tw=survey.tower.width/2,td=survey.tower.depth/2;
 // The measured tower core, with doubled landward flanks. The surviving crown
 // heights vary; the numbers below are visual estimates, not excavation levels.
 fwall(current,tf,[-tw,-td],[tw,-td],base,1.08,1.0,115,'rodeno');fwall(current,tf,[-tw,-td],[-tw,td],base,1.24,1.0,215,'rodeno');fwall(current,tf,[-tw,td],[tw,td],base,.98,1.0,315,'rodeno');
 fwall(current,tf,[tw,-td],[tw,-.65],base,.77,.84,415,'rodeno');fwall(current,tf,[tw,.85],[tw,td],base,.65,.84,515,'rodeno');
 fwall(current,tf,[-tw-1.8,-td-1.3],[tw+.1,-td-1.3],base,.67,.77,615,'rodeno');fwall(current,tf,[-tw-1.8,-td-1.3],[-tw-1.8,td+.1],base,.67,.77,715,'rodeno');
 for(let i=0;i<7;i++){const q=tf.world(-1.8+rand(i+63)*3.5,-1.6+rand(i+43)*3.2);rock(current,'rodenoLight',q.x,base+.11,q.z,.46,.21,.36,i+771,tf.yaw,false);}
 const sp=project(...survey.street.coordinate),sf=frame(sp.x,sp.z,survey.street.yawDegrees*R);brokenPaving(current,sf,0,0,base+.02,survey.street.width,survey.street.length,6101);brokenPaving(historical,sf,0,0,base+.02,survey.street.width,survey.street.length,6101);
 // Loose column fragments are visible archaeological material, not an invented
 // classical colonnade. Their precise placement is interpretative.
 const st=project(...survey.walls[4].path[0]);current.cylinder('limestone',st.x+.55,base+.50,st.z+.65,.20,.23,1,13);current.cylinder('limestone',st.x+2.7,base+.31,st.z-.5,.25,.28,.62,14);
 const markerPoints=[tf.world(7,4),tf.world(-10,16)];for(const p of markerPoints){for(const s of[-1,1])current.box('metal',p.x+s*.52,base+.53,p.z,.06,1.06,.06);current.box('dark',p.x,base+1.02,p.z,1.35,.07,.65,.10);}
 // Sparse neutral boundary and ground fragments: detailed enough for a close
 // exterior view without pretending to inventory every restored stone.
 for(let i=0;i<land.length;i++){const a=land[i],c=land[(i+1)%land.length],l=Math.hypot(c.x-a.x,c.z-a.z);if(i===5||i===6)continue;for(let t=0;t<l;t+=4.8){const x=a.x+(c.x-a.x)*t/l,z=a.z+(c.z-a.z)*t/l;current.cylinder('metal',x,base+.50,z,.018,.018,1.0,6);}for(const h of[.35,.79])current.beam('metal',[a.x,base+h,a.z],[c.x,base+h,c.z],.012);}
 for(let i=0;i<42;i++){const q=tf.world(-11+rand(i+99)*22,3+rand(i+39)*20);if(rand(i+3)>.6){const g=new THREE.CylinderGeometry(.18,.16,.05,5);current.geo('tile',g,new THREE.Matrix4().makeTranslation(q.x,base+.05,q.z));g.dispose();}}

 // A restrained, partial Imperial interpretation. Only these three warehouse
 // units are reinstated; the mixed-period peripheral ruins are not extruded.
 for(let n=0;n<survey.warehouses.length;n++){
  const w=survey.warehouses[n],p=project(...w.coordinate),f=frame(p.x,p.z,w.yawDegrees*R),hw=w.width/2,hd=w.length/2,h=5.85,floor=3.05;
  for(const[a,c]of [[[-hw,-hd],[hw,-hd]],[[-hw,-hd],[-hw,hd]],[[hw,-hd],[hw,hd]]]){
   fwall(historical,f,a,c,base,.90,.51,8000+n*100+a[0]*3,'mixed');const aa=f.world(...a),cc=f.world(...c),l=Math.hypot(aa.x-cc.x,aa.z-cc.z);historical.box('plaster',(aa.x+cc.x)/2,base+.9+(h-.9)/2,(aa.z+cc.z)/2,a[1]===c[1]?l-.47:l+.47,h-.9,.47,-Math.atan2(cc.z-aa.z,cc.x-aa.x));
  }
  groundDoor(historical,f,0,hd,base,1.70,w.width,3.02,.50);f.box(roofBatch,'plaster',0,base+floor+(h-floor)/2,hd,w.width,h-floor,.50);
  f.box(historical,'earth',0,base+.04,0,w.width-.46,.07,w.length-.45);
  for(const x of [-1.0,1.0])smallWindow(roofBatch,f,x,base+4.66,hd+.263,.59,.75);
  // Roof, upper floor and the upper front wall form one removable section.
  for(let z=-hd+.40;z<hd-.20;z+=.32)f.box(roofBatch,'wood',0,base+floor,z,w.width-.24,.12,.305);
  for(let z=-hd+.6;z<hd;z+=2.05)f.box(roofBatch,'wood',0,base+floor-.18,z,w.width-.2,.24,.16);
  tiledRoof(roofBatch,f,w.width,w.length,base+h);
  for(let z=-hd+1;z<hd-.6;z+=2.8)f.box(historical,'wood',-hw+.34,base+1.5,z,.15,3.0,.15);
  for(let i=0;i<11;i++)f.box(historical,'wood',hw-.72,base+(i+.5)*.255,-hd+.45+i*.22,.75,.255,.28);
  for(const s of[-1,1])historical.beam('wood',f.p(hw-.72+s*.36,base+.75,-hd+.35),f.p(hw-.72+s*.36,base+3.2,-hd+2.9),.035);
  let ai=0;for(let z=-hd+1.1;z<hd-1.6;z+=1.0)for(let x=-hw+.8;x<hw-.7;x+=.78){if(x>hw-1.5&&z<-hd+2.9)continue;amphora(historical,f,x,base+.10,z,240+n*71+ai++);}
  f.box(historical,'wood',-hw+.7,base+.38,hd-1.2,.82,.10,1.35);for(const x of[-hw+.35,-hw+1.03])for(const z of[hd-1.7,hd-.7])f.box(historical,'wood',x,base+.20,z,.07,.4,.07);
 }
 const th=6.5;for(const[a,c]of [[[-tw,-td],[tw,-td]],[[-tw,td],[tw,td]],[[-tw,-td],[-tw,td]],[[tw,-td],[tw,td]]])fwall(historical,tf,a,c,base,th,.80,9050+a[0]*19+a[1]*31,'rodeno');
 tf.box(historical,'earth',0,base+th-.02,0,6.0,.15,4.2);for(const s of[-1,1]){tf.box(historical,'rodenoLight',s*tw,base+th+.27,0,.82,.55,5.82);tf.box(historical,'rodenoLight',0,base+th+.27,s*td,5.98,.55,.82);}
 smallWindow(historical,tf,0,base+4.5,td+.43,.35,.85);tf.box(historical,'dark',0,base+1.4,td+.43,1.1,2.5,.03);tf.box(historical,'wood',0,base+2.65,td+.49,1.28,.13,.12);
 // No battlements, beacons or classical temple are introduced where the
 // published record gives a footprint but no defensible upper elevation.

 const m=survey.marine,marinePolygon=m.footprint.map(p=>project(...p));expositorySeabed(marineCurrent,marinePolygon,m,project);expositorySeabed(marineHistory,marinePolygon,m,project);
 const gp=project(...m.gola.coordinate),gf=frame(gp.x,gp.z,m.gola.yawDegrees*R),blocks=[];
 for(let side=0;side<2;side++)for(let i=0;i<11;i++){const index=side*11+i+1,s=1430+index*31;blocks.push({id:index,x:(side?1:-1)*(2.3+rand(s)*.65),z:-16+i*3.15+(rand(s+1)-.5)*.7,w:1.2+rand(s+2)*1.4,d:2.2+rand(s+3)*1.25,h:.8+rand(s+4)*.18,y:-2.75});}
 // The recorded pair at block 9 is large and survives higher. The three
 // exceptional standing blocks and two superpositions are made legible, while
 // individual positions remain an adaptation rather than a stone-by-stone survey.
 const nine=blocks[8];nine.w=1.60;nine.d=3.40;nine.h=1.25;nine.y=-2.75;
 for(const[upper,lower]of [[13,12],[15,14]]){blocks[upper].x=blocks[lower].x+.12;blocks[upper].z=blocks[lower].z+.05;blocks[upper].y=blocks[lower].y+blocks[lower].h*.92;}
 for(const a of blocks){const p=gf.world(a.x,a.z);rock(marineCurrent,'rodenoLight',p.x,a.y+a.h/2,p.z,a.w,a.h,a.d,2000+a.id,gf.yaw,a.id===2||a.id===3||a.id===10,.86+rand(a.id)*.20);}
 const nineP=gf.world(nine.x,nine.z);rock(marineCurrent,'rodeno',nineP.x,nine.y+nine.h+.75/2,nineP.z,.80,.75,2.35,2809,gf.yaw,false,.93);
 let scatterCount=0;for(const[key,count]of [['trencatimons',125],['exterior',112]]){
  const spec=m[key],p=project(...spec.coordinate),f=frame(p.x,p.z,spec.yawDegrees*R);for(let i=0;i<count;i++){const seed=i*7+(key==='exterior'?5500:3300),angle=rand(seed)*Math.PI*2,r=Math.sqrt(rand(seed+1)),x=Math.cos(angle)*spec.width*.48*r,z=Math.sin(angle)*spec.length*.48*r,q=f.world(x,z),baseDepth=key==='exterior'?-4.15:-3.0,rise=(1-r*r)*(key==='exterior'?1.8:.72),h=.48+rand(seed+5)*.95;
   rock(marineCurrent,rand(seed+4)>.27?'rodeno':'marine',q.x,baseDepth+rise+h/2,q.z,1.05+rand(seed+2)*1.8,h,.8+rand(seed+3)*1.9,seed,f.yaw+(rand(seed+6)-.5)*1.5,false,.83+rand(seed+7)*.20);scatterCount++;
  }
  const outline=[];for(let j=0;j<=40;j++){const a=j/40*Math.PI*2;outline.push(f.world(Math.cos(a)*spec.width/2,Math.sin(a)*spec.length/2));}dashed(marineHistory,outline,.06,'hypothesis',.095);
 }
 // Restore only the bounded Gola structure, in translucent interpretative
 // material. The supposed long connector is a dashed trace, never a solid pier.
 for(const s of[-1,1])gf.box(marineHistory,'hypothesis',s*3.1,-.95,0,.85,3.5,35);gf.box(marineHistory,'hypothesis',0,.84,0,7.0,.16,35);
 dashed(marineHistory,m.hypothesisAxis.map(p=>project(...p)),.11,'hypothesis',.15);

 const currentGroup=current.finish('Grau Vell · vestigios terrestres'),historicalGroup=historical.finish('Grau Vell · restitución romana parcial'),roof=roofBatch.finish('Sección del almacén · cubierta, forjado y frente superior'),underwater=marineCurrent.finish('Arqueología bajo el agua · bloques documentados'),marineHypothesis=marineHistory.finish('Puerto romano · límites interpretativos');
 currentGroup.add(underwater);historicalGroup.add(roof,marineHypothesis);historicalGroup.visible=false;roof.userData.isRoof=true;
 const group=new THREE.Group();group.name=record.name;group.userData.id=record.id;group.userData.region='coast';group.add(currentGroup,historicalGroup);group.traverse(o=>{if(o.isMesh)o.userData.id=record.id;});
 const mp=project(-.23446,39.63699),outside=project(...m.exterior.coordinate),wp=project(...survey.warehouses[1].coordinate),marineBounds=new THREE.Box3();
 for(const mesh of underwater.children)if(!mesh.name.endsWith(' · sand'))marineBounds.union(mesh.geometry.boundingBox);
 const stats={tracedWallLines:survey.walls.length,interpretedWarehouseUnits:survey.warehouses.length,documentedGolaBlocks:22,illustrativeRubbleBlocks:scatterCount,triangles:0,vertices:0,drawCalls:0};group.traverse(o=>{if(o.isMesh){stats.triangles+=o.geometry.index.count/3;stats.vertices+=o.geometry.attributes.position.count;stats.drawCalls++;}});
 return {id:record.id,group,currentGroup,historicalGroup,roof,roofModes:['historical'],roofLabel:'Sección del almacén',roofFocus:'almacen',historicalLabel:record.historicalLabel,point:new THREE.Vector3(cp.x,base+.7,cp.z),views:{offset:[91,102,130],closeOffset:[25,33,38]},
  focuses:{terrestre:{label:'El área excavada',point:new THREE.Vector3(cp.x,base+.6,cp.z),offset:[34,48,48]},torre:{label:'Torre y enlosado',point:new THREE.Vector3(tp.x+2,base+1,tp.z+1),offset:[19,28,26]},almacen:{label:'Dentro del almacén',modes:['historical'],note:'Abre «Sección del almacén» para retirar la cubierta, el forjado y el frente superior.',point:new THREE.Vector3(wp.x,base+1.7,wp.z),offset:[13,17,22]},marina:{label:'Arqueología marina',point:new THREE.Vector3(mp.x,-1,mp.z),offset:[70,125,130],bounds:marineBounds},gola:{label:'Espigón de la Gola',point:new THREE.Vector3(gp.x,-1.5,gp.z),offset:[24,32,37]},derrumbe:{label:'Derrumbe exterior',point:new THREE.Vector3(outside.x,-1.9,outside.z),offset:[32,41,38]}},
  patches:[{polygon:land,height:base-.04}],exclusions:[land],marine:{group:underwater,historicalGroup:marineHypothesis,footprint:marinePolygon,coordinate:mp,approximateDepth:true,depthRange:[-4.3,-2],seafloorExpository:m.seafloorExpository},stats};
}

export function createCoastArchaeology({heightAt,project,records,data}){
 const values=Array.isArray(records)?records:records.sites||Object.values(records),record=values.find(r=>r.id==='puerto-antiguo'),group=new THREE.Group();group.name='Arse–Saguntum · el puerto antiguo';
 if(!record)return {group,sites:{},stats:{places:0}};
 const site=createSite(record,heightAt,project);group.add(site.group);return {group,sites:{'puerto-antiguo':site},stats:{places:1,...site.stats}};
}
