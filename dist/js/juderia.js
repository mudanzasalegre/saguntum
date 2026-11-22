import * as THREE from 'three';

// Conserved Jewish quarter of Sagunt. OSM/Catastro define footprints;
// institutional photographs define the Portalet's visible fabric. Heights and
// domestic details are documented visual estimates. No former synagogue or
// proposed ritual bath interior is invented, and no house is labelled Jewish
// solely from its present-day appearance.
const PI=Math.PI,TAU=PI*2,UP=new THREE.Vector3(0,1,0),ID=new THREE.Matrix4();
const LON=111320*Math.cos(39.679*PI/180),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const v=Math.sin(n*127.13+34.19)*43758.5453;return v-Math.floor(v);};
export const juderiaPeriods=[
 {id:'medieval',label:'Elementos medievales documentados',color:'#d6bd8b'},
 {id:'modern',label:'Transformaciones de época moderna',color:'#d4a578'},
 {id:'contemporary',label:'Edificación y conservación contemporáneas',color:'#77b8c7'},
 {id:'mixed',label:'Fábrica conservada de distintas épocas',color:'#be98d6'},
 {id:'interpretation',label:'Localización y dimensiones interpretativas',color:'#929ba0'}
];
const PERIODS=Object.fromEntries(juderiaPeriods.map(p=>[p.id,p.color]));
const DEFS={
 stone:{color:'#b5a18a',roughness:.96,map:'stone'},trim:{color:'#d9ceba',roughness:.94},
 plaster:{color:'#eae9e2',roughness:.98,map:'plaster'},ochre:{color:'#d9bb7d',roughness:.98,map:'plaster'},
 rose:{color:'#dca797',roughness:.98,map:'plaster'},orange:{color:'#b95736',roughness:.98,map:'plaster'},
 grey:{color:'#c2beb0',roughness:.98,map:'plaster'},terrace:{color:'#bfb3a2',roughness:.99},
 tiles:{color:'#b88d72',roughness:.96,map:'tiles'},wood:{color:'#74513c',roughness:.91,map:'wood'},
 darkWood:{color:'#453b30',roughness:.93,map:'wood'},metal:{color:'#333e38',roughness:.57,metalness:.52},
 glass:{color:'#314b4b',roughness:.32,metalness:.12},shadow:{color:'#5b554a',roughness:1},
 paving:{color:'#a79d8c',roughness:.98,map:'paving'},plate:{color:'#e8e4d4',roughness:.9,map:'plate'}
};

function texture(type){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 if(type==='plate'){x.fillStyle='#e6e4d8';x.fillRect(0,0,256,256);x.fillStyle='#34342c';x.font='bold 190px Georgia';x.textAlign='center';x.textBaseline='middle';x.font='bold 44px Georgia';x.fillText('PORTALET',128,73);x.fillText('DE LA',128,128);x.fillText('SANG',128,183);}
 else{
  x.fillStyle='#c5b9a1';x.fillRect(0,0,256,256);
  if(type==='wood'){
   for(let i=0;i<36;i++){const n=noise(i+21);x.fillStyle=`rgba(${i%3?'70,45,26':'225,191,139'},${.10+n*.22})`;x.fillRect(i*8,0,1+n*3,256);}
   for(let i=0;i<170;i++){x.fillStyle=i%3?'rgba(28,37,28,.16)':'rgba(226,177,106,.19)';x.fillRect(noise(i+22)*256,noise(i+66)*256,.5+noise(i)*3,5+noise(i+1)*26);}
  }else if(type!=='plaster'){
   const cols=type==='tiles'?18:type==='paving'?12:5,rows=type==='tiles'?18:type==='paving'?12:9;
   for(let r=0;r<rows;r++)for(let col=-1;col<=cols;col++){const n=noise(r*39+col+83),w=256/cols,h=256/rows,px=col*w+(r%2?w/2:0);x.fillStyle=`hsl(${34+n*8},${9+n*10}%,${64+n*19}%)`;x.fillRect(px+.5,r*h+.5,w-1.2,h-1.1);x.fillStyle='rgba(45,35,26,.13)';x.fillRect(px+w-1,r*h+.5,.8,h-1);}
  }
  for(let i=0;i<1900;i++){x.fillStyle=i%2?'rgba(46,37,28,.07)':'rgba(255,247,219,.13)';x.fillRect(noise(i+73)*256,noise(i+333)*256,1.2,1.2);}
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
class Batch{
 constructor(){this.parts=new Map();this.boxGeo=new THREE.BoxGeometry(1,1,1).toNonIndexed();}
 key(c,period='mixed',kind='stone'){return[c,period,kind].join('|');}
 geom(key,geo,m=ID,tint=1){
  const g=geo.index?geo.toNonIndexed():geo;if(!g.attributes.normal)g.computeVertexNormals();let a=this.parts.get(key);if(!a){a={p:[],n:[],u:[],c:[]};this.parts.set(key,a);}
  const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),nv=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m),kind=key.split('|')[2];
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(m);nv.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();a.p.push(v.x,v.y,v.z);a.n.push(nv.x,nv.y,nv.z);
   const ax=Math.abs(nv.x),ay=Math.abs(nv.y),az=Math.abs(nv.z),scale=kind==='tiles'?2.8:kind==='wood'||kind==='darkWood'?1.4:kind==='paving'?2.6:4;
   a.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/scale,(ay>ax&&ay>az?v.z:v.y)/scale);a.c.push(tint,tint,tint);
  }if(g!==geo)g.dispose();
 }
 box(k,x,y,z,w,h,d,yaw=0,tint=1){if(w<=0||h<=0||d<=0)return;this.geom(k,this.boxGeo,new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(w,h,d)),tint);}
 raw(k,p,tint=1){if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geom(k,g,ID,tint);g.dispose();}
 cylinder(k,x,y,z,r1,r2,h,n=12,tint=1){const g=new THREE.CylinderGeometry(r1,r2,h,n);this.geom(k,g,new THREE.Matrix4().makeTranslation(x,y,z),tint);g.dispose();}
 beam(k,a,c,r=.035,tint=1,n=7){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...c),v=vb.clone().sub(va);if(v.length()<.001)return;const g=new THREE.CylinderGeometry(r,r,v.length(),n),m=new THREE.Matrix4().compose(va.add(vb).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,v.normalize()),new THREE.Vector3(1,1,1));this.geom(k,g,m,tint);g.dispose();}
 finish(group,resources,textures){
  for(const[key,a]of this.parts){const[component,period,kind]=key.split('|'),def=DEFS[kind],m=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness||0,map:def.map?textures[def.map]:null,vertexColors:true,side:THREE.DoubleSide});
   const g=new THREE.BufferGeometry();for(const[n,arr,size]of[['position',a.p,3],['normal',a.n,3],['uv',a.u,2],['color',a.c,3]])g.setAttribute(n,new THREE.Float32BufferAttribute(arr,size));g.computeBoundingBox();g.computeBoundingSphere();
   const mesh=new THREE.Mesh(g,m);mesh.name=`Judería · ${component} · ${kind}`;mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;mesh.userData={juderiaFabric:true,component,period,materialKind:kind,baseColor:m.color.clone(),baseMap:m.map,sourceKeys:['jd-xiuxiueig','jd-rutas','jd-placas'],dimensionStatus:'Visual estimate registered to OSM / Catastro; not a measured survey'};
   group.add(mesh);resources.materials.push(m);resources.geometries.push(g);
  }this.boxGeo.dispose();
 }
}
const quad=(p,a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
const centroid=p=>({x:p.reduce((s,v)=>s+v.x,0)/p.length,z:p.reduce((s,v)=>s+v.z,0)/p.length});
const clean=(p,project)=>{const a=p.map(c=>Array.isArray(c)?project(...c):c);if(a.length>2&&Math.hypot(a[0].x-a.at(-1).x,a[0].z-a.at(-1).z)<.03)a.pop();return a;};
function frame(x,z,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,p:(u,y,v)=>[x+u*c+v*s,y,z-u*s+v*c],world:(u,v)=>({x:x+u*c+v*s,z:z-u*s+v*c}),local:p=>({x:(p.x-x)*c-(p.z-z)*s,z:(p.x-x)*s+(p.z-z)*c}),box:(b,k,u,y,v,w,h,d,rotation=0,tint=1)=>{const p=[x+u*c+v*s,z-u*s+v*c];b.box(k,p[0],y,p[1],w,h,d,yaw+rotation,tint);}};}
function face(poly,side,plaza){
 const sign=signedArea(poly)>0?1:-1;let chosen=null;
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],len=Math.hypot(b.x-a.x,b.z-a.z);if(len<.7)continue;const nx=(b.z-a.z)/len*sign,nz=-(b.x-a.x)/len*sign,mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,desired=side==='west'?nx:-nx,dist=Math.hypot(plaza.x-mx,plaza.z-mz);const score=desired*2+(side==='west'?mx:-mx)*.35+len*.012-dist*.001;if(!chosen||score>chosen.score)chosen={i,len,nx,nz,mx,mz,score};}
 return{...chosen,f:frame(chosen.mx,chosen.mz,Math.atan2(chosen.nx,chosen.nz))};
}
function path(points,Class=THREE.Shape){const s=new Class();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
const rect=(w,h,x=0,y=0)=>[[x-w/2,y],[x+w/2,y],[x+w/2,y+h],[x-w/2,y+h]];
function arch(w,h,type='lowered'){
 const r=w/2,rise=type==='pointed'?w*.70:type==='round'?r:w*.27,spring=h-rise,pts=[[-r,0],[-r,spring]];
 if(type==='pointed'){
  for(let i=1;i<=20;i++){const t=i/20,xx=-r+r*t;pts.push([xx,spring+rise*Math.sqrt(Math.max(0,1-((xx-r)/(2*r))**2))/(Math.sqrt(3)/2)]);}
  for(let i=1;i<=20;i++){const t=i/20,xx=r*t;pts.push([xx,spring+rise*Math.sqrt(Math.max(0,1-((xx+r)/(2*r))**2))/(Math.sqrt(3)/2)]);}
 }else for(let i=1;i<=32;i++){const a=PI-i*PI/32;pts.push([Math.cos(a)*r,spring+Math.sin(a)*rise]);}
 pts.push([r,0]);return pts;
}
function shape(b,key,points,f,y,z,depth=.35,holes=[]){const s=path(points);for(const h of holes)s.holes.push(path([...h].reverse(),THREE.Path));const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:20,steps:1});g.translate(0,0,-depth/2);const m=new THREE.Matrix4().makeRotationY(f.yaw);m.setPosition(...f.p(0,y,z));b.geom(key,g,m);g.dispose();}
function planePolygon(b,key,poly,y,tint=1){const p=[],tri=THREE.ShapeUtils.triangulateShape(poly.map(v=>new THREE.Vector2(v.x,-v.z)),[]);for(const ix of tri){const a=ix.map(i=>[poly[i].x,typeof y==='function'?y(poly[i]):y,poly[i].z]);p.push(...a.flat());}b.raw(key,p,tint);}
function wallSegment(b,k,a,c,y0,y1,thick=.4,tint=1){const len=Math.hypot(c.x-a.x,c.z-a.z);if(len<.02||y1<=y0)return;b.box(k,(a.x+c.x)/2,(y0+y1)/2,(a.z+c.z)/2,len,y1-y0,thick,-Math.atan2(c.z-a.z,c.x-a.x),tint);}
function clip(poly,axis,value,positive){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],aa=axis(a)-value,bb=axis(b)-value,ina=positive?aa>=-.0001:aa<=.0001,inb=positive?bb>=-.0001:bb<=.0001;if(ina)out.push(a);if(ina!==inb){const t=aa/(aa-bb);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return out;}
function railing(b,K,f,x,y,z,w,depth=.55){
 f.box(b,K('metal'),x,y+.95,z,w,.045,.045);f.box(b,K('metal'),x,y+.12,z,w,.035,.035);const n=Math.max(3,Math.round(w/.15));for(let i=0;i<=n;i++)f.box(b,K('metal'),x-w/2+i*w/n,y+.53,z,.023,.85,.026);
 for(const s of[-1,1]){f.box(b,K('metal'),x+s*w/2,y+.95,z-depth/2,.04,.04,depth);for(let i=0;i<=3;i++)f.box(b,K('metal'),x+s*w/2,y+.53,z-depth+i*depth/3,.024,.85,.024);}
}
function windowDetail(b,K,f,{x,y,w=1.05,h=1.65,balcony=false,shutters=false,arched=false,continuous=false}){
 const holes=arched?arch(w,h,'lowered'):rect(w,h);shape(b,K('glass'),holes.map(([u,v])=>[u+x,v+y]),f,0,-.20,.025);
 f.box(b,K('darkWood'),x-w/2+.055,y+h/2,-.08,.09,h,.16);f.box(b,K('darkWood'),x+w/2-.055,y+h/2,-.08,.09,h,.16);f.box(b,K('darkWood'),x,y+.055,-.08,w,.11,.16);f.box(b,K('darkWood'),x,y+h-.055,-.08,w,.11,.16);f.box(b,K('darkWood'),x,y+h/2,-.015,.047,h,.045);f.box(b,K('darkWood'),x,y+h*.52,-.015,w,.04,.045);
 f.box(b,K('trim'),x,y-.09,.12,w+.30,.15,.42);for(const s of[-1,1])f.box(b,K('trim'),x+s*(w/2+.065),y+h/2,.10,.13,h+.12,.15);
 if(!arched)f.box(b,K('trim'),x,y+h+.07,.10,w+.26,.14,.15);
 if(shutters)for(const side of[-1,1]){f.box(b,K('darkWood'),x+side*(w*.73),y+h/2,.08,w*.4,h,.10);for(let j=0;j<h/.16;j++)f.box(b,K('wood'),x+side*w*.73,y+.08+j*.16,.14,w*.35,.045,.025,0,.85);}
 if(balcony&&!continuous){f.box(b,K('trim'),x,y-.17,.40,w+.58,.18,.92);railing(b,K,f,x,y-.05,.84,w+.45,.68);}
}
function lantern(b,K,f,x,y,z){f.box(b,K('metal'),x,y+.36,z-.14,.045,.54,.045);f.box(b,K('metal'),x,y+.57,z,.045,.045,.38);f.box(b,K('trim'),x,y,z+.05,.22,.34,.22);for(const a of[-.13,.13])for(const c of[-.08,.18])f.box(b,K('metal'),x+a,y,z+c,.025,.42,.025);f.box(b,K('metal'),x,y+.23,z+.05,.32,.065,.29);f.box(b,K('metal'),x,y-.23,z+.05,.28,.04,.25);}
function crossArch(b,component,f,x,y,depth,galleryH,type,qa){
 const c=f.world(x,-depth/2),cross=frame(c.x,c.z,f.yaw+PI/2),w=depth-.32,h=galleryH-.12,k=b.key(component,type==='pointed'?'medieval':'mixed','stone'),wallK=b.key(component,'mixed','plaster');
 shape(b,wallK,rect(depth+.14,galleryH),cross,y,0,.32,[arch(w,h,type)]);
 const outer=arch(w+.42,h+.24,type);shape(b,k,outer,cross,y-.02,0,.39,[arch(w,h,type)]);
 const origin=cross.p(0,y+1.5,.65),direction=[-Math.sin(cross.yaw),0,-Math.cos(cross.yaw)];qa.openings.push({id:component,kind:'gallery-cross-arch',origin,direction,distance:1.3,width:w});
}
function roof(b,component,poly,faceInfo,top,style,holes=[]){
 const K=kind=>b.key(component,'contemporary',kind),f=faceInfo.f,axis=p=>-f.local(p).z,ds=poly.map(axis),min=Math.min(...ds),max=Math.max(...ds),mid=(min+max)/2;
 if(style==='flat'){
  planePolygonHoles(b,K('terrace'),poly,holes,top+.07);for(let i=0;i<poly.length;i++)wallSegment(b,K('plaster'),poly[i],poly[(i+1)%poly.length],top,top+.56,.18);
  return;
 }
 const rise=Math.min(1.45,(max-min)*.12),y=p=>top+rise*Math.max(0,1-Math.abs(axis(p)-mid)/Math.max(.01,(max-min)/2));
 // Split each source triangle at the ridge. Clipping a whole concave
 // footprint can join disjoint pieces and leave triangular holes in a roof.
 const roofPoints=[poly,...holes].flat(),triangles=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(p.x,-p.z)),holes.map(h=>h.map(p=>new THREE.Vector2(p.x,-p.z))));
 for(const ids of triangles)for(const positive of[false,true]){const part=clip(ids.map(i=>roofPoints[i]),axis,mid,positive);if(part.length>2)planePolygon(b,K('tiles'),part,y);}
 for(let i=0;i<poly.length;i++){
  const a=poly[i],c=poly[(i+1)%poly.length],edge=[a],da=axis(a)-mid,dc=axis(c)-mid;
  // The gable has the same ridge split as the roof. A single endpoint quad
  // would miss its triangular top where both eaves lie below the ridge.
  if(da*dc<0){const t=da/(da-dc);edge.push({x:a.x+(c.x-a.x)*t,z:a.z+(c.z-a.z)*t});}edge.push(c);
  const p=[];for(let j=1;j<edge.length;j++){const u=edge[j-1],v=edge[j];quad(p,[u.x,top,u.z],[v.x,top,v.z],[v.x,y(v),v.z],[u.x,y(u),u.z]);}b.raw(K('plaster'),p);wallSegment(b,K('wood'),a,c,top-.11,top+.01,.24,.82);
 }
 // Thin tile channels follow the actual clipped roof polygon, not a bounding box.
 const us=poly.map(p=>f.local(p).x),lo=Math.min(...us),hi=Math.max(...us);
 for(let u=lo+.15;u<=hi;u+=.40){const hits=[];for(let i=0;i<poly.length;i++){const a=f.local(poly[i]),c=f.local(poly[(i+1)%poly.length]);if((a.x<=u&&c.x>u)||(c.x<=u&&a.x>u)){const t=(u-a.x)/(c.x-a.x);hits.push(a.z+(c.z-a.z)*t);}}hits.sort((a,c)=>a-c);for(let j=0;j+1<hits.length;j+=2){let previous;for(let v=hits[j];v<hits[j+1]+.05;v+=.43){const vv=Math.min(v,hits[j+1]),p=f.world(u,vv),pt=[p.x,y(p)+.035,p.z];if(previous)b.beam(K('tiles'),previous,pt,.032,.91+noise(u*13+v)*.15,5);previous=pt;}}}
}


const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.z>p.z)!==(b.z>p.z))&&(p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x))yes=!yes;}return yes;};
function planePolygonHoles(b,key,poly,holes,y,tint=1){const all=[poly,...holes].flat(),p=[],tri=THREE.ShapeUtils.triangulateShape(poly.map(v=>new THREE.Vector2(v.x,-v.z)),holes.map(h=>h.map(v=>new THREE.Vector2(v.x,-v.z))));for(const ix of tri){const a=ix.map(i=>[all[i].x,typeof y==='function'?y(all[i]):y,all[i].z]);p.push(...a.flat());}b.raw(key,p,tint);}
const geographical=p=>[p.x/LON-.278,39.679-p.z/111320];
const hash=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,9);
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)]||0;

export function createJuderia({record,project,heightAt=()=>0,visitData,contextData={}}={}){
 const group=new THREE.Group();group.name='Judería · Portalet y trama documentada';
 const centre=project(...(record?.coordinate||[-.2780013,39.67818318])),resources={materials:[],textures:[],geometries:[]},textures=Object.fromEntries(['stone','plaster','tiles','wood','paving','plate'].map(k=>[k,texture(k)]));resources.textures.push(...Object.values(textures));
 const exclusions=[],patches=[],bindings=[],planComponents=[],buildings=[],gates=[],qa={openings:[],floorSamples:[],facades:[],gates:[],portal:null,documented:{gateId:'733421700',gateShape:'semicircular arch / medio punto',licenseYear:1321,licenseIsExactFabricDate:false,synagogueInteriorModelled:false,ritualBathModelled:false,mezuzahHouseIdentified:false},section:{available:false,reason:'No undocumented synagogue, private house or proposed ritual bath interior is reconstructed.'}};
 const rows=contextData.coreBuildings||[],parts=rows.flatMap(row=>(row.cadastralParts?.length?row.cadastralParts:[row]).map(part=>({row,part,p:clean(part.coordinates,project),holes:(part.holes||[]).map(h=>clean(h,project))}))),surroundings=[...parts,...(contextData.buildings||[]).map(part=>({part,p:clean(part.coordinates,project),holes:(part.holes||[]).map(h=>clean(h,project))}))];
 const occupied=(x,z,ignore)=>surroundings.some(o=>o.part.id!==ignore&&inside({x,z},o.p)&&!o.holes.some(h=>inside({x,z},h)));
 const visibleFace=(a,c,sign,id)=>{const len=Math.hypot(c.x-a.x,c.z-a.z),nx=(c.z-a.z)/len*sign,nz=-(c.x-a.x)/len*sign,mx=(a.x+c.x)/2,mz=(a.z+c.z)/2;return{len,nx,nz,mx,mz,exposed:len>1.3&&![.3,.7].every(d=>occupied(mx+nx*d,mz+nz*d,id)),f:frame(mx,mz,Math.atan2(nx,nz))};};
 function buildHouse(item,index){
  const {row,part,p,holes}=item;if(p.length<3)return;const parent=row.parentId||row.id,seed=hash(parent),minGround=Math.min(...p.map(v=>heightAt(v.x,v.z))),base=median(p.map(v=>heightAt(v.x,v.z))),sourceHeight=Number(part.height)||Number(part.surfaceHeightEstimate)||Number(part.levels)*3.05||7.5,height=clamp(sourceHeight,2.6,18),roofY=Math.max(base+height,Math.max(...p.map(v=>heightAt(v.x,v.z)))+2.4),colour=parent==='3557907YJ3935H'||parent==='3558805YJ3935H'?'plaster':['plaster','plaster','grey','plaster','rose','ochre'][seed%6],building=new THREE.Group();building.name='Judería · parcela '+parent+' · '+part.id;building.position.y=base;
  const b=new Batch(),id='casa-'+part.id,K=kind=>b.key(id,'mixed',kind),faces=p.map((a,i)=>visibleFace(a,p[(i+1)%p.length],signedArea(p)>0?1:-1,part.id)),exposed=faces.filter(f=>f.exposed),front=exposed.sort((a,b)=>b.len-a.len)[0]||faces[0],top=roofY-base;
  for(const ring of[p,...holes])for(let i=0;i<ring.length;i++){
   const a=ring[i],c=ring[(i+1)%ring.length],info=visibleFace(a,c,(signedArea(ring)>0?1:-1)*(ring===p?1:-1),part.id),f=info.f,len=info.len;if(len<.05)continue;
   const lower=Math.min(heightAt(a.x,a.z),heightAt(c.x,c.z))-base-.6,apertures=[],windows=[],floorCount=Math.max(1,Math.min(4,Math.round(height/3.05))),levelHeight=height/floorCount;
   if(info.exposed&&ring===p&&len>2.0){
    const count=Math.max(1,Math.min(5,Math.floor(len/2.7)));
    for(let level=1;level<floorCount;level++)for(let n=0;n<count;n++){
     const x=-len/2+(n+.5)*len/count,y=top-(floorCount-level)*levelHeight+.30,w=Math.min(.95,len/count-.55),h=Math.min(level===1?1.8:1.4,levelHeight-.65);if(y<heightAt(info.mx,info.mz)-base+1.2||y+h>top-.20)continue;
     apertures.push(rect(w,h,x,y-lower));windows.push({x,y,w,h,balcony:level===1&&len>3.6&&n%2===0,shutters:level>1||seed%4===1});
    }
    const localGround=heightAt(info.mx,info.mz)-base,doorWidth=Math.min(.98,len*.30),doorX=len>4?-len*.21:0;
    if(top-localGround>2.6){apertures.push(rect(doorWidth,2.20,doorX,localGround-lower));shape(b,K('darkWood'),rect(doorWidth-.035,2.17,doorX,localGround+.02),f,0,-.18,.08);for(let u=-doorWidth/2+.12;u<doorWidth/2;u+=.15)f.box(b,K('wood'),u+doorX,localGround+1.10,-.125,.015,2.12,.018);f.box(b,K('metal'),doorX+doorWidth*.30,localGround+1.02,-.07,.035,.16,.05);f.box(b,K('stone'),doorX,localGround-.02,.13,doorWidth+.18,.12,.40);}
    if(len>4.2&&top-localGround>2.5){const wx=len*.25,w=.63,h=1.05,y=localGround+.85;apertures.push(rect(w,h,wx,y-lower));f.box(b,K('glass'),wx,y+h/2,-.21,w,h,.04);for(let u=-w/2;u<=w/2+.01;u+=.14)f.box(b,K('metal'),wx+u,y+h/2,.12,.022,h+.10,.025);for(const yy of[y-.04,y+h+.04])f.box(b,K('metal'),wx,yy,.12,w+.08,.03,.03);}
   }
   shape(b,K(colour),rect(len,top-lower),f,lower,0,.28,apertures);for(const w of windows)windowDetail(b,K,f,w);
   if(info.exposed&&ring===p){const groundA=heightAt(a.x,a.z)-base,groundC=heightAt(c.x,c.z)-base,q=[];quad(q,[a.x+info.nx*.16,groundA-.12,a.z+info.nz*.16],[c.x+info.nx*.16,groundC-.12,c.z+info.nz*.16],[c.x+info.nx*.16,groundC+.45,c.z+info.nz*.16],[a.x+info.nx*.16,groundA+.45,a.z+info.nz*.16]);b.raw(K(parent==='3558805YJ3935H'?'grey':'stone'),q,.94);
    f.box(b,K('trim'),0,top-.10,.08,len+.12,.18,.38);if(len>3.2){f.box(b,K('metal'),-len/2+.17,(lower+top)/2,.20,.075,top-lower,.075,0,.9);f.box(b,K('metal'),0,top+.05,.16,len,.08,.10,0,.82);}
   }
  }
  const area=Math.abs(signedArea(p)),rc=new THREE.Color(part.roofColor||'#c6b7a3'),tiled=!holes.length&&area>11&&part.roofShape!=='flat'&&(rc.r>rc.g*1.04||parent==='3558805YJ3935H'),style=tiled?'tiles':'flat';roof(b,'cubierta-'+part.id,p,{f:front.f},top,style,holes);planePolygonHoles(b,K('shadow'),p,holes,minGround-base+.02);
  b.finish(building,resources,textures);group.add(building);exclusions.push(p);/* Exterior houses keep the surveyed slope: flat foundation caps would lower adjoining 2.5 m DEM cells across these narrow lanes. */bindings.push({group:building,base,polygon:p});
  buildings.push({row,part,polygon:p,holes,base,top:roofY,style,front});qa.facades.push({id:part.id,parentId:parent,baseM:base,heightM:top,sourceHeightM:sourceHeight,heightMethod:part.height?'source':part.surfaceHeightEstimate?'IGN':'storeys',roof:style,roofAxis:{midpoint:[front.mx,front.mz],normal:[front.nx,front.nz]},footprint:part.coordinates,holes:part.holes||[],levels:part.levels,streetFaces:faces.filter(f=>f.exposed).length,elevationStatus:'Cartographic parts and height estimates; facade openings and finishes are interpretative.'});planComponents.push({id,label:'Edificación de '+parent,kind:'building',period:'mixed',coordinates:part.coordinates,holes:part.holes||[],sourceId:'jd-catastro',interpretive:true});
 }
 parts.forEach(buildHouse);
 function buildGate(gate,id,authentic){
  const p=clean(gate.footprint,project),c=centroid(p),edges=p.map((a,i)=>{const z=p[(i+1)%p.length];return{a,c:z,length:Math.hypot(z.x-a.x,z.z-a.z)}}).sort((a,b)=>b.length-a.length),edge=edges[0],dx=(edge.c.x-edge.a.x)/edge.length,dz=(edge.c.z-edge.a.z)/edge.length;let nx=dz,nz=-dx;if(nx<0){nx=-nx;nz=-nz;}const f=frame(c.x,c.z,Math.atan2(nx,nz)),locals=p.map(f.local),lo=Math.min(...locals.map(v=>v.x)),hi=Math.max(...locals.map(v=>v.x)),width=hi-lo,mid=(lo+hi)/2,depth=clamp(Math.max(...locals.map(v=>v.z))-Math.min(...locals.map(v=>v.z)),.52,.85),base=heightAt(c.x,c.z)+.07,b=new Batch(),wall=new THREE.Group();wall.name=authentic?'Portalet de la Sang · acceso conservado':id==='arco-museo'?'Arco frente al Museo · acceso actual':'Portillo meridional · camino hacia el castillo';wall.position.y=base;
  const openingW=authentic?Math.min(2.48,width-1.2):Math.min(2.60,width-.72),openingH=authentic?3.55:3.25,openingX=mid+(authentic?.26:0),top=authentic?4.03:3.82,archType=id==='arco-museo'?'pointed':'round',period=authentic?'mixed':'interpretation',S=kind=>b.key(id,period,kind),archPts=arch(openingW,openingH,archType).map(([x,y])=>[x+openingX,y]);
  // The surviving gate is a thin plastered wall joining two houses. A real
  // semicircular hole, exposed jambs and voussoirs replace the legacy free arch.
  // The opening reaches the underside of the wall. A closed hole beginning at
  // y=0 would leave a flat sill across this sloping passage; its coplanar stone
  // cap also produced a black triangular overlap in the inspection render.
  const openCut=archPts.map(([x,y],i)=>[x,i===0||i===archPts.length-1?-.30:y]).reverse();
  shape(b,S(authentic?'plaster':'stone'),[[lo,-.30],[lo,top],[hi,top],[hi,-.30],...openCut],f,0,0,depth);
  const radius=openingW/2,spring=openingH-(archType==='pointed'?openingW*.70:radius),stoneThickness=authentic?.30:.34,outer=arch(openingW+stoneThickness*2,openingH+stoneThickness,archType).map(([x,y])=>[x+openingX,y]);
  shape(b,S('stone'),[...outer,...[...archPts].reverse()],f,0,.035,depth+.08);
  for(const side of[-1,1])for(let n=0;n<Math.ceil(spring/.38);n++){const h=Math.min(.36,spring-n*.38);if(h<=0)continue;const sw=stoneThickness+(authentic?noise(n+side*7)*.07:0);f.box(b,S(n%3?'stone':'trim'),openingX+side*(radius+sw/2),n*.38+h/2,depth/2+.055,sw-.01,h,.065,0,.81+noise(n+30+side)*.21);}
  for(let n=0;archType!=='pointed'&&n<15;n++){
   const a=PI*n/15+.006,z=PI*(n+1)/15-.006,q=[],v=(ang,outer,zz)=>f.p(openingX+Math.cos(ang)*(radius+(outer?stoneThickness:0)),spring+Math.sin(ang)*(radius+(outer?stoneThickness:0)),zz);
   quad(q,v(a,false,depth/2+.105),v(z,false,depth/2+.105),v(z,true,depth/2+.105),v(a,true,depth/2+.105));quad(q,v(z,false,-depth/2-.08),v(a,false,-depth/2-.08),v(a,true,-depth/2-.08),v(z,true,-depth/2-.08));b.raw(S('trim'),q,.72+noise(n+14)*.30);
  }
  if(archType==='pointed'){
   const inner=arch(openingW,openingH,'pointed').slice(1,-1),outerCurve=arch(openingW+stoneThickness*2,openingH+stoneThickness,'pointed').slice(1,-1);
   for(let n=0;n<inner.length-1;n+=3){const j=Math.min(n+3,inner.length-1),q=[],v=(points,k)=>f.p(points[k][0]+openingX,points[k][1],depth/2+.105);quad(q,v(inner,n),v(inner,j),v(outerCurve,j),v(outerCurve,n));b.raw(S('trim'),q,.79+noise(n+8)*.20);}
   for(let u=lo;u<hi;u+=.26)f.box(b,S('tiles'),u,top+.11,0,.24,.10,depth+.15);
  }
  for(const side of[-1,1]){const xx=side<0?lo+.16:hi-.16;for(let n=0;n<Math.ceil(top/.45);n++)f.box(b,S('stone'),xx,n*.45+.22,depth/2+.025,.30,.42,.08,0,.80+noise(n+side)*.25);}
  f.box(b,S('trim'),mid,top+.035,0,width+.10,.10,depth+.09,0,.90);
  if(authentic){
   // Three contemporary ceramic panels are visible in the institutional
   // photographs. Only the legible street name is transcribed, no invented text.
   f.box(b,b.key('portalet-placas','contemporary','trim'),hi-.27,top-.85,depth/2+.10,.29,.39,.045);
   const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.24,.33),new THREE.MeshStandardMaterial({color:'#e8e6d8',map:textures.plate,roughness:.9}));plaque.name='Portalet · placa de calle';plaque.position.set(...f.p(hi-.27,top-.85,depth/2+.128));plaque.rotation.y=f.yaw;plaque.userData={juderiaFabric:true,component:'portalet-placas',period:'contemporary',materialKind:'plate',baseColor:plaque.material.color.clone(),baseMap:plaque.material.map};wall.add(plaque);resources.materials.push(plaque.material);resources.geometries.push(plaque.geometry);
   const tileX=lo+.68;f.box(b,b.key('portalet-placas','contemporary','trim'),tileX,.72,depth/2+.07,.49,.65,.045);for(let row=0;row<4;row++)for(let col=0;col<3;col++){const x=tileX-.21+col*.14,y=.44+row*.14,pts=[...f.p(x,y,depth/2+.102),...f.p(x+.13,y,depth/2+.102),...f.p(x+.13,y+.13,depth/2+.102)];b.raw(b.key('portalet-placas','contemporary','metal'),pts,.81);}
   f.box(b,b.key('portalet-placas','contemporary','stone'),tileX,3.18,depth/2+.09,.44,.29,.04);f.box(b,b.key('portalet-placas','contemporary','orange'),tileX,3.18,depth/2+.117,.37,.23,.018,.0,.8);
   // A narrow drain follows the threshold; it is not an artificial step.
   f.box(b,b.key('portalet-umbral','contemporary','metal'),openingX,.045,depth/2+.16,openingW,.045,.18);for(let u=-openingW/2;u<openingW/2;u+=.10)f.box(b,b.key('portalet-umbral','contemporary','shadow'),openingX+u,.072,depth/2+.16,.025,.012,.15);
   f.box(b,b.key('portalet-placas','contemporary','metal'),mid,top-.10,depth/2+.13,width,.028,.035);
  }
  b.finish(wall,resources,textures);group.add(wall);exclusions.push(p);
  const target=f.p(openingX,base+1.85,depth/2+.13),archTarget=f.p(openingX,base+openingH-.20,depth/2+.13),entry={id,authentic,group:wall,polygon:p,base,f,normal:[nx,0,nz],target,archTarget,openingW,openingH,openingX,width,depth,top};gates.push(entry);qa.gates.push({id,authentic,osmId:authentic?'733421700':gate.id,widthM:width,depthM:depth,openingWidthM:openingW,openingHeightM:openingH,archType,heightM:top,baseM:base,target,archTarget,normal:[nx,0,nz],status:authentic?'Documented conserved Portalet; small dimensions visually estimated':'Current mapped arch; medieval fabric not asserted'});
  if(authentic)qa.portal=qa.gates.at(-1);
  qa.openings.push({id,kind:'gate',origin:f.p(openingX,base+1.70,depth/2+.50),direction:[-nx,0,-nz],distance:depth+1,width:openingW});
  planComponents.push({id,label:wall.name,kind:'gate',period,coordinates:gate.footprint,sourceId:'jd-osm',interpretive:false});
 }
 if(record?.footprint?.length)buildGate(record,'portalet',true);
 for(const gate of record?.secondaryGates||[])if(['1303697035','733421698'].includes(String(gate.id)))buildGate(gate,String(gate.id)==='1303697035'?'arco-museo':'portillo-sur',false);
 group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group),focuses={},stops=new Map((visitData?.stops||[]).map(s=>[s.id,s]));
 function focus(id,label,p,y,radius,offset,closeOffset,components,regionId){const target=new THREE.Vector3(p.x,y,p.z),box=new THREE.Box3(target.clone().add(new THREE.Vector3(-radius,-Math.min(radius,Math.max(0,y-heightAt(p.x,p.z))),-radius)),target.clone().addScalar(radius));return focuses[id]={id,label:stops.get(id)?.title||label,coordinates:geographical(p),target,bounds:box,offset,closeOffset,components:components||[],regionId:stops.get(id)?.regionId||regionId||'barrio',kind:id==='juderia-conjunto'?'overview':'feature',requiresSection:false,sourceConfidence:'Cartographic exterior; dimensions and viewing point approximate'};}
 const overview=project(-.27855,39.67835);focus('juderia-conjunto','La judería y su entorno',overview,heightAt(overview.x,overview.z)+9,38,[65,72,-72],[31,40,-32],[],'conjunto');
 const portal=gates.find(g=>g.authentic);if(portal){const p={x:portal.target[0],z:portal.target[2]},n=portal.normal;focus('juderia-portalet','El Portalet de la Sang',p,portal.target[1],2.0,[4.226,2.2,9.063],[3.857,.65,4.596],['portalet','portalet-placas'],'accesos').minDistance=8;focus('juderia-dovelas','Piedra, dovelas y transformaciones',p,portal.archTarget[1],.75,[3.857,1.0,4.596],[3.277,.5,2.294],['portalet'],'accesos').minDistance=6;}
 const lane=project(-.278218,39.678207);focus('juderia-sang-vella','Sang Vella, la calle del barrio',lane,heightAt(lane.x,lane.z)+1.8,6,[9.397,5,3.420],[5.638,.5,2.052],parts.filter(o=>['3557906YJ3935H','3558805YJ3935H'].includes(o.row.parentId)).map(o=>'casa-'+o.part.id),'calles');
 const houses=project(-.278155,39.678195);focus('juderia-casas','Casas, puertas y vida cotidiana',houses,heightAt(houses.x,houses.z)+3,5.2,[7,18,12],[4,7,7],parts.filter(o=>o.row.parentId==='3558805YJ3935H').map(o=>'casa-'+o.part.id),'vida');
 for(const [gateId,stopId,label]of[['arco-museo','juderia-arco-museo','El arco frente al Museo'],['portillo-sur','juderia-refugio','Hacia la protección del castillo']]){const g=gates.find(g=>g.id===gateId);if(g){const p={x:g.target[0],z:g.target[2]},n=g.normal;focus(stopId,label,p,g.target[1],2.4,gateId==='arco-museo'?[8.192,1,-5.736]:[n[0]*11,5,n[2]*11],gateId==='arco-museo'?[5.638,.5,-2.052]:[n[0]*6,1.5,n[2]*6],[gateId],'accesos').minDistance=9;}}
 let selected=null,readingMode='materials',ground=heightAt;const meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const drainMeshes=meshes.filter(m=>m.userData.component==='portalet-umbral').map(mesh=>({mesh,source:mesh.geometry.attributes.position.array.slice()}));
 function apply(){const selectedFocus=focuses[selected];for(const mesh of meshes){const m=mesh.material,d=mesh.userData;if(!d.baseColor)continue;const map=readingMode==='periods'?null:d.baseMap;if(m.map!==map){m.map=map;m.needsUpdate=true;}m.color.copy(readingMode==='periods'?new THREE.Color(PERIODS[d.period]||PERIODS.interpretation):d.baseColor);m.emissive?.set(selectedFocus?.components.includes(d.component)?'#60431e':'#000000');if(m.emissive)m.emissiveIntensity=.18;}}
 function selectFocus(id){selected=id&&focuses[id]?id:null;apply();return selected?focuses[selected]:null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';apply();return readingMode;}
 function bindGround(finalHeightAt){ground=finalHeightAt||heightAt;
  // The metal drain follows the same sloping surface as the street. Its top
  // stays flush with the paving rather than forming a level, floating sill.
  for(const{mesh,source}of drainMeshes){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,source[i*3+1]+ground(source[i*3],source[i*3+2])+.105-mesh.parent.position.y-.0675);p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
  for(const f of Object.values(focuses))for(const offset of[f.offset,f.closeOffset])offset[1]=Math.max(offset[1],ground(f.target.x+offset[0],f.target.z+offset[2])+2.1-f.target.y);return group;}
 const stats={stops:Object.keys(focuses).length,coreBuildings:rows.length,buildingBodies:buildings.length,documentedFacades:0,interpretedFacades:qa.facades.length,meshes:meshes.length,triangles:meshes.reduce((s,m)=>s+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),trueApertures:qa.openings.length,sourceKeys:['jd-xiuxiueig','jd-rutas','jd-placas','jd-osm','jd-catastro'],conservedGateId:'733421700',secondaryGatesInterpreted:true,historicalInteriorInvented:false,periods:juderiaPeriods.map(p=>p.id)};
 const plan={id:'juderia',label:'Judería y Portalet de la Sang',coordinate:record?.coordinate||[-.2780013,39.67818318],outline:contextData.districtOutline||record?.districtBoundary||[],components:planComponents,stops:Object.values(focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId})),note:'Parcelas y cuerpos cartográficos; detalles domésticos interpretativos. El Portalet conservado se diferencia de los otros arcos y no se reconstruyen interiores de la sinagoga ni del posible baño ritual.'};
 const visit={focuses,bounds,stats,periods:juderiaPeriods,plan,selectFocus,setReadingMode,setSection:()=>false,bindGround,getState:()=>({selected,readingMode,sectionOpen:false}),qa,metadata:{state:'Conserved Portalet and contemporary historic-quarter exteriors, not a frozen medieval streetscape',metricStatus:'Source footprints and building-part heights; openings, finishes, roof slopes and gate dimensions are visual estimates',gate:'Documented authentic Portalet joins Castell with Sang Vella. 1321 dates the licence for enclosure, not every surviving stone.',interiors:'No undocumented synagogue, proposed ritual bath or private domestic interior is reconstructed.'}};
 group.userData={id:'juderia',label:'Judería y Portalet de la Sang',interpretation:true,cartographicOutline:true,visit,ownedResources:resources,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
 return{group,point:focuses['juderia-conjunto'].target.clone(),view:{offset:[65,72,-72],closeOffset:[31,40,-32]},exclusions,patches,excludedBuildingIds:[...(contextData.coreExcludedBuildingIds||[]),...(record?.osmIds||[]).map(id=>id.split('/')[1]),...(record?.secondaryGates||[]).map(g=>String(g.id))],excludedRoadIds:[],bindings};
}
