import * as THREE from 'three';

// Conserved Plaça Major. Footprints are OSM / Catastro; the municipal PEP
// catalogue supplies individual elevations and identifies Plaça Major 17 as
// the Almudín doorway. Small dimensions and finishes remain visual estimates.
// No former warehouse, council chamber or private domestic interior is invented.
const PI=Math.PI,TAU=PI*2,UP=new THREE.Vector3(0,1,0),ID=new THREE.Matrix4();
const LON=111320*Math.cos(39.679*PI/180),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const v=Math.sin(n*127.13+34.19)*43758.5453;return v-Math.floor(v);};
export const plazaMayorPeriods=[
 {id:'medieval',label:'Elementos medievales documentados',color:'#d6bd8b'},
 {id:'modern',label:'Transformaciones de época moderna',color:'#d4a578'},
 {id:'contemporary',label:'Edificación y conservación contemporáneas',color:'#77b8c7'},
 {id:'mixed',label:'Fábrica conservada de distintas épocas',color:'#be98d6'},
 {id:'interpretation',label:'Localización y dimensiones interpretativas',color:'#929ba0'}
];
const PERIODS=Object.fromEntries(plazaMayorPeriods.map(p=>[p.id,p.color]));
const DEFS={
 stone:{color:'#b5a18a',roughness:.96,map:'stone'},trim:{color:'#d9ceba',roughness:.94},
 plaster:{color:'#e5decc',roughness:.98,map:'plaster'},ochre:{color:'#d9bb7d',roughness:.98,map:'plaster'},
 rose:{color:'#dca797',roughness:.98,map:'plaster'},orange:{color:'#b95736',roughness:.98,map:'plaster'},
 grey:{color:'#c2beb0',roughness:.98,map:'plaster'},terrace:{color:'#bfb3a2',roughness:.99},
 tiles:{color:'#b88d72',roughness:.96,map:'tiles'},wood:{color:'#74513c',roughness:.91,map:'wood'},
 darkWood:{color:'#453b30',roughness:.93,map:'wood'},metal:{color:'#333e38',roughness:.57,metalness:.52},
 glass:{color:'#314b4b',roughness:.32,metalness:.12},shadow:{color:'#5b554a',roughness:1},
 paving:{color:'#a79d8c',roughness:.98,map:'paving'},plate:{color:'#e8e4d4',roughness:.9,map:'plate'}
};

// Address numbers are present-day numbers in the municipal PEP catalogue,
// not the different numbering quoted by Chabret in 1888.
const FACADES={
 '844866514':{number:10,page:140,colour:'plaster',h:12.25,storeys:2,cols:3,support:'pilaster',bays:2,roof:'flat',balcony:'separate',cornice:'classical',period:'contemporary'},
 '844866515':{number:11,page:139,colour:'plaster',h:12.65,storeys:3,cols:3,support:'stone',bays:2,roof:'flat',balcony:'continuous',asymmetry:true,period:'contemporary'},
 '844866516':{number:12,page:138,colour:'ochre',h:10.65,storeys:3,cols:1,support:'pilaster',bays:1,roof:'tiles',balcony:'separate',period:'mixed'},
 '844866517':{number:13,page:137,colour:'plaster',h:10.65,storeys:2,cols:2,support:'pilaster',bays:1,roof:'tiles',balcony:'separate',attic:4,period:'mixed'},
 '844866518':{number:14,page:136,colour:'plaster',h:9.15,storeys:2,cols:2,support:'stone',bays:1,roof:'tiles',balcony:'continuous',attic:3,period:'mixed'},
 '844866519':{number:15,page:135,colour:'grey',h:15.25,storeys:4,cols:3,support:'pilaster',bays:2,roof:'flat',balcony:'modern',crossArch:'pointed',period:'contemporary'},
 'core-3459612YJ3935G':{number:16,page:134,colour:'plaster',h:10.85,storeys:3,cols:1,support:'stone',bays:1,roof:'tiles',balcony:'separate',crossArch:'pointed',period:'mixed'},
 'core-3459611YJ3935H':{number:17,page:133,colour:'orange',upperColour:'orange',h:11.05,storeys:3,cols:1,support:'stone',bays:1,roof:'tiles',balcony:'separate',almudin:true,crossArch:'lowered',period:'mixed'},
 '844866524':{number:5,page:179,colour:'ochre',h:9.85,storeys:2,cols:2,support:'doric',bays:2,roof:'tiles',balcony:'separate',attic:3,period:'mixed'},
 '844866522':{number:3,page:180,colour:'plaster',h:9.85,storeys:2,cols:3,support:'doric',bays:2,roof:'tiles',balcony:'separate',attic:3,period:'mixed'},
 '844866521':{number:2,page:181,colour:'rose',h:10.55,storeys:2,cols:2,support:'iron',bays:2,roof:'flat',balcony:'separate',archedWindows:true,cornice:'classical',period:'mixed'},
 '844866520':{number:1,page:182,colour:'plaster',h:12.85,storeys:3,cols:3,support:'iron',bays:2,roof:'flat',balcony:'separate',cornice:'classical',period:'mixed'},
 '844866523':{number:4,page:183,colour:'ochre',h:10.4,storeys:2,cols:2,support:'pilaster',bays:2,roof:'tiles',balcony:'separate',attic:3,period:'mixed'}
};

function texture(type){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 if(type==='plate'){x.fillStyle='#e6e4d8';x.fillRect(0,0,256,256);x.fillStyle='#34342c';x.font='bold 190px Georgia';x.textAlign='center';x.textBaseline='middle';x.fillText('17',128,136);}
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
   const mesh=new THREE.Mesh(g,m);mesh.name=`Plaça Major · ${component} · ${kind}`;mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;mesh.userData={plazaMayorFabric:true,component,period,materialKind:kind,baseColor:m.color.clone(),baseMap:m.map,sourceKeys:['pm-pep','pm-rutas'],dimensionStatus:'Visual estimate registered to OSM / Catastro; not a measured survey'};
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
function roof(b,component,poly,faceInfo,top,style){
 const K=kind=>b.key(component,'contemporary',kind),f=faceInfo.f,axis=p=>-f.local(p).z,ds=poly.map(axis),min=Math.min(...ds),max=Math.max(...ds),mid=(min+max)/2;
 if(style==='flat'){
  planePolygon(b,K('terrace'),poly,top+.07);for(let i=0;i<poly.length;i++)wallSegment(b,K('plaster'),poly[i],poly[(i+1)%poly.length],top,top+.56,.18);
  return;
 }
 const rise=Math.min(1.45,(max-min)*.12),y=p=>top+rise*Math.max(0,1-Math.abs(axis(p)-mid)/Math.max(.01,(max-min)/2));
 // Split each source triangle at the ridge. Clipping a whole concave
 // footprint can join disjoint pieces and leave triangular holes in a roof.
 const triangles=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(p.x,-p.z)),[]);
 for(const ids of triangles)for(const positive of[false,true]){const part=clip(ids.map(i=>poly[i]),axis,mid,positive);if(part.length>2)planePolygon(b,K('tiles'),part,y);}
 for(let i=0;i<poly.length;i++){
  const a=poly[i],c=poly[(i+1)%poly.length],edge=[a],da=axis(a)-mid,dc=axis(c)-mid;
  // The gable has the same ridge split as the roof. A single endpoint quad
  // would miss its triangular top where both eaves lie below the ridge.
  if(da*dc<0){const t=da/(da-dc);edge.push({x:a.x+(c.x-a.x)*t,z:a.z+(c.z-a.z)*t});}edge.push(c);
  const p=[];for(let j=1;j<edge.length;j++){const u=edge[j-1],v=edge[j];quad(p,[u.x,top,u.z],[v.x,top,v.z],[v.x,y(v),v.z],[u.x,y(u),u.z]);}b.raw(K('plaster'),p);wallSegment(b,K('wood'),a,c,top-.11,top+.01,.24,.82);
 }
 // Thin tile channels follow the actual clipped roof polygon, not a bounding box.
 const us=poly.map(p=>f.local(p).x),lo=Math.min(...us),hi=Math.max(...us);
 for(let u=lo+.15;u<=hi;u+=.31){const hits=[];for(let i=0;i<poly.length;i++){const a=f.local(poly[i]),c=f.local(poly[(i+1)%poly.length]);if((a.x<=u&&c.x>u)||(c.x<=u&&a.x>u)){const t=(u-a.x)/(c.x-a.x);hits.push(a.z+(c.z-a.z)*t);}}hits.sort((a,c)=>a-c);for(let j=0;j+1<hits.length;j+=2){let previous;for(let v=hits[j];v<hits[j+1]+.05;v+=.43){const vv=Math.min(v,hits[j+1]),p=f.world(u,vv),pt=[p.x,y(p)+.035,p.z];if(previous)b.beam(K('tiles'),previous,pt,.032,.91+noise(u*13+v)*.15,5);previous=pt;}}}
}

export function createPlazaMayor({record,project,heightAt=()=>0,visitData,contextData}={}){
 const group=new THREE.Group();group.name='Plaça Major · conjunto documentado';
 const centre=project(...(record?.coordinate||[-.27863,39.67946])),resources={materials:[],textures:[],geometries:[]},textures=Object.fromEntries(['stone','plaster','tiles','wood','paving','plate'].map(k=>[k,texture(k)]));resources.textures.push(...Object.values(textures));
 const exclusions=[],patches=[],buildings=[],bindings=[],planComponents=[],qa={openings:[],floorSamples:[],facades:[],portal:null,documented:{cataloguePages:[133,134,135,136,137,138,139,140,179,180,181,182,183],almudinAddress:17,almudinParcel:'3459611YJ3935H',almudinArch:'carpanel / rebajado',historicInteriorModelled:false},section:{available:false,reason:'Domestic interiors and former warehouse plans are not established for this portal.'}};
 const rows=contextData?.coreBuildings||[];
 function addBuilding(row,secondary=false,partIndex=0){
  const spec=FACADES[row.id]||{number:'',colour:'plaster',h:row.surfaceHeightEstimate||10,storeys:2,cols:2,support:'pilaster',bays:1,roof:'tiles',period:'mixed'},poly=clean(secondary?row.secondaryFootprints[partIndex].coordinates:row.coordinates,project);if(poly.length<3)return;
  const info=face(poly,row.coreSide||'west',centre),f=info.f,base=heightAt(info.mx,info.mz)+.12,building=new THREE.Group();building.name=`Plaça Major ${spec.number}${secondary?' · cuerpo posterior':''}`;building.position.y=base;
  const b=new Batch(),id=`fachada-${spec.number}${secondary?'-posterior':''}`,gallery=`soportal-${spec.number}`,upper=spec.upperColour||spec.colour,top=secondary?Math.min(spec.h,8.7):spec.h,gh=secondary?0:spec.almudin?3.70:3.45,depth=secondary?0:Math.min(spec.almudin?2.70:2.85,Math.max(2.2,Math.max(...poly.map(v=>-f.local(v).z))-.55)),len=info.len,K=kind=>b.key(id,spec.period,kind),G=kind=>b.key(gallery,'mixed',kind);
  const floor=.12;
  const columns=spec.cols,upperH=top-gh,storey=upperH/(spec.storeys+(spec.attic?.4:0));
  for(let i=0;i<poly.length;i++){
   const a=poly[i],c=poly[(i+1)%poly.length],la=f.local(a),lc=f.local(c),isFront=i===info.i;
   if(isFront&&!secondary){
    const holes=[],windows=[];
    for(let level=0;level<spec.storeys;level++)for(let n=0;n<columns;n++){
     const wide=spec.balcony==='modern',w=wide?Math.min(1.8,len/columns-.42):Math.min(1.03,len/columns-.56),h=wide?Math.min(1.65,storey-.45):Math.min(level===0?1.85:1.6,storey-.56),x=-len/2+(n+.5)*len/columns,y=gh+level*storey+.55;
     if(y+h>top-.25)continue;const arched=spec.archedWindows&&level===1;
     holes.push((arched?arch(w,h,'lowered'):rect(w,h)).map(([u,v])=>[u+x,v+y-gh]));windows.push({x,y,w,h,arched,balcony:level<2,continuous:spec.balcony==='modern'||spec.balcony==='continuous',shutters:spec.number===2||spec.number===5});
    }
    if(spec.attic){const y=top-.68;for(let n=0;n<spec.attic;n++){const x=-len/2+(n+.5)*len/spec.attic;holes.push(rect(.32,.29,x,y-gh));f.box(b,K('shadow'),x,y+.145,-.22,.32,.29,.035);}}
    shape(b,K(upper),rect(len,top-gh),f,gh,0,.42,holes);for(const win of windows)windowDetail(b,K,f,win);
    if(['continuous','modern'].includes(spec.balcony))for(let level=0;level<Math.min(spec.storeys,spec.balcony==='modern'?4:2);level++){const y=gh+level*storey+.48,w=len-.45;f.box(b,K('trim'),0,y-.12,.42,w,.18,.94);railing(b,K,f,0,y,.91,w-.08,.72);}
    f.box(b,K('trim'),0,gh+.06,.12,len+.10,.24,.58);
   }else{
    wallSegment(b,K(upper),a,c,secondary?-.95:gh,top,.40);
    if(secondary||Math.max(-la.z,-lc.z)>=depth-.01){let start=a,end=c;if(!secondary&&(-la.z<depth||-lc.z<depth)){const t=(-depth-la.z)/(lc.z-la.z),cut={x:a.x+(c.x-a.x)*t,z:a.z+(c.z-a.z)*t};if(-la.z<depth)start=cut;else end=cut;}wallSegment(b,K(spec.colour),start,end,-.95,secondary?top:gh,.40);}
   }
   wallSegment(b,K('trim'),a,c,top-.12,top+.05,.54,.93);
  }
  if(!secondary){
   // The gallery is an actual open volume: independent columns, soffit and
   // recessed domestic wall; no opaque ground-storey cuboid behind the facade.
   const back=f.world(0,-depth),bf=frame(back.x,back.z,f.yaw),backH=gh-.08,doorW=spec.almudin?2.12:Math.min(1.05,len*.22),doorX=spec.almudin?0:-len*.20,doorH=spec.almudin?2.76:2.35,holes=[(spec.almudin?arch(doorW,doorH,'lowered'):rect(doorW,doorH)).map(([u,v])=>[u+doorX,v+floor])];
   const hasBackWindow=len>4.4,backWindowX=len*.25;if(hasBackWindow)holes.push(rect(Math.min(.9,len*.16),1.0,backWindowX,1.35));
   shape(b,G(spec.colour),rect(len,backH),bf,-.05,0,.34,holes);
   shape(b,b.key(spec.almudin?'almudin-hojas':gallery,'mixed',spec.almudin?'wood':'darkWood'),(spec.almudin?arch(doorW-.04,doorH-.04,'lowered'):rect(doorW-.04,doorH-.04)).map(([u,v])=>[u+doorX,v+floor]),bf,0,-.17,.10);
   for(let u=-doorW/2+.13;u<doorW/2;u+=.15){const max=spec.almudin?doorH-doorW*.27+doorW*.27*Math.sqrt(Math.max(0,1-(u/(doorW/2))**2)):doorH;bf.box(b,b.key(spec.almudin?'almudin-hojas':gallery,'mixed','darkWood'),doorX+u,floor+max/2,-.10,.014,max,.018,0,.76+noise(u)*.16);}
   for(const u of[-doorW*.12,doorW*.12])bf.box(b,G('metal'),u+doorX,1.2,-.065,.045,.15,.065);
   if(hasBackWindow){const w=Math.min(.9,len*.16);bf.box(b,G('glass'),backWindowX,1.85,-.18,w,1,.035);for(let x=backWindowX-w/2;x<=backWindowX+w/2+.01;x+=.16)bf.box(b,G('metal'),x,1.85,.12,.028,1.10,.03);for(const y of[1.32,2.36])bf.box(b,G('metal'),backWindowX,y,.12,w+.10,.035,.035);}
   // Taller pilasters, reused stone shafts, Doric supports and cast iron are
   // kept distinct as recorded in the individual municipal catalogue entries.
   for(let n=0;n<=spec.bays;n++){
    const x=-len/2+n*len/spec.bays,p=f.world(x,0),edge=n===0||n===spec.bays,support=edge&&spec.support==='doric'?'pilaster':spec.support;
    if(support==='iron'&&!edge){b.cylinder(G('metal'),p.x,gh/2,p.z,.085,.115,gh,16);b.cylinder(G('metal'),p.x,.20,p.z,.17,.20,.4,16);b.cylinder(G('metal'),p.x,gh-.15,p.z,.22,.11,.24,16);f.box(b,G('metal'),x,gh-.025,0,.45,.12,.45);}
    else if((support==='doric'||support==='stone')&&!edge){b.cylinder(G('stone'),p.x,gh/2,p.z,.20,.25,gh-.25,20,.98);b.cylinder(G('trim'),p.x,.12,p.z,.32,.32,.24,20);b.cylinder(G('trim'),p.x,gh-.20,p.z,.34,.22,.22,20);f.box(b,G('trim'),x,gh-.045,0,.62,.14,.62);}
    else{f.box(b,G(support==='iron'?'metal':'stone'),x,gh/2,0,support==='iron'?.13:.40,gh,support==='iron'?.18:.46);if(support!=='iron')for(let y=.48;y<gh;y+=.48)f.box(b,G('trim'),x,y,.236,.41,.018,.018,0,.72);}
   }
   f.box(b,G('plaster'),0,gh-.10,-depth/2,len,.22,depth+.15);
   if(spec.number>=16||spec.support==='iron')for(let x=-len/2+.15;x<len/2;x+=.48)f.box(b,G('darkWood'),x,gh-.26,-depth/2,.10,.15,depth+.05,0,.9);
   f.box(b,G('paving'),0,floor-.05,-depth/2,len,.10,depth+.10);
   for(let x=-len/2+.15;x<len/2;x+=.41)f.box(b,G('stone'),x,floor+.009,-depth/2,.014,.014,depth,0,.72);
   if(!spec.almudin)lantern(b,G,f,0,gh-.73,-depth*.52);
   if(spec.number>=13&&spec.number<=17){crossArch(b,`arco-transversal-${spec.number}`,f,-len/2,0,depth,gh,spec.crossArch||'lowered',qa);qa.openings.at(-1).origin[1]+=base;}
   const outward=[Math.sin(f.yaw),0,Math.cos(f.yaw)];for(let n=0;n<spec.bays;n++){const x=-len/2+(n+.5)*len/spec.bays;qa.openings.push({id:`soportal-${spec.number}-${n}`,kind:'portico',origin:f.p(x,base+1.65,.85),direction:outward.map(v=>-v),distance:depth-.25,width:len/spec.bays-.45});}
   for(const x of[-len*.30,0,len*.30])qa.floorSamples.push({point:f.p(x,base+floor,-depth*.48),building:spec.number});
   if(spec.almudin){
    const P=kind=>b.key('almudin-portada','mixed',kind),shield=kind=>b.key('almudin-escudo','mixed',kind),outerW=doorW+.82,outerH=3.35;
    shape(b,P('stone'),rect(outerW,outerH),bf,floor,.10,.29,[arch(doorW,doorH,'lowered')]);
    // Individual radial voussoirs follow the visibly lowered arch. The royal
    // shield is carved in the central keystone, not floating above the portal.
    const r=doorW/2,ri=doorW*.27,spring=floor+doorH-ri;for(let n=0;n<11;n++){const a=PI*n/11+.010,c=PI*(n+1)/11-.010,p=[];const v=(ang,outer,z)=>bf.p(Math.cos(ang)*(r+(outer?.34:0)),spring+Math.sin(ang)*(ri+(outer?.38:0)),z);quad(p,v(a,false,.285),v(c,false,.285),v(c,true,.285),v(a,true,.285));b.raw(P('trim'),p,.78+noise(n+2)*.20);}
    for(const s of[-1,1])for(let n=0;n<5;n++)bf.box(b,P('trim'),s*(doorW/2+.20),floor+(n+.5)*.43,.27,.38,.41,.065,0,.79+noise(n+8*s)*.2);
    const sy=3.04,sw=.43,sp=[[-sw/2,sw*.55],[sw/2,sw*.55],[sw*.40,-sw*.13],[0,-sw*.47],[-sw*.40,-sw*.13]];shape(b,shield('stone'),sp.map(([u,v])=>[u,v+sy]),bf,0,.326,.055);
    for(let n=0;n<4;n++){const x=-sw*.28+n*sw*.185;bf.box(b,shield('trim'),x,sy+.015,.366,.027,.27,.016,0,.80);}
    const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.19,.26),new THREE.MeshStandardMaterial({color:'#eee9d9',map:textures.plate,roughness:.9}));plaque.name='Almudín · número actual 17';plaque.position.set(...bf.p(doorW/2+.36,2.43,.31));plaque.rotation.y=f.yaw;plaque.userData={plazaMayorFabric:true,component:'almudin-portada',period:'contemporary',materialKind:'plate',baseColor:plaque.material.color.clone(),baseMap:plaque.material.map};building.add(plaque);resources.materials.push(plaque.material);resources.geometries.push(plaque.geometry);
    const target=bf.p(0,base+1.7,.34),shieldTarget=bf.p(0,base+sy,.38);qa.portal={address:17,parcel:'3459611YJ3935H',coordinate:[target[0]/LON-.278,39.679-target[2]/111320],target,shieldTarget,widthM:doorW,heightM:doorH,shieldWidthM:sw,shieldHeightM:sw*1.02,galleryHeightM:gh,stoneTopM:base+floor+outerH,shieldTopM:base+sy+sw*.55,beamBottomM:base+gh-.335,soffitM:base+gh-.21,arch:'lowered elliptical approximation of documented carpanel',normal:outward};
    qa.openings.push({id:'almudin-doorway',kind:'door',origin:bf.p(0,base+1.6,.8),direction:outward.map(v=>-v),distance:1.15,width:doorW});
   }
   planComponents.push({id:gallery,label:`Soportal de Plaça Major ${spec.number}`,kind:'gallery',period:'mixed',coordinates:[f.world(-len/2,0),f.world(len/2,0),f.world(len/2,-depth),f.world(-len/2,-depth)].map(p=>[p.x/LON-.278,39.679-p.z/111320]),interpretive:true,sourceId:'pm-pep',cataloguePage:spec.page});
  }
  planePolygon(b,K('shadow'),poly,.02);
  roof(b,`cubierta-${spec.number}${secondary?'-posterior':''}`,poly,info,top,spec.roof);
  if(spec.cornice==='classical'&&!secondary){for(const [y,d]of[[top-.45,.42],[top-.23,.54],[top+.04,.64]])f.box(b,K('trim'),0,y,.12,len+.12,.13,d);for(let x=-len/2+.3;x<len/2;x+=.35)f.box(b,K('trim'),x,top-.32,.34,.11,.14,.16);}
  b.finish(building,resources,textures);group.add(building);exclusions.push(poly);patches.push({polygon:poly,height:base-.12,margin:.30});bindings.push({group:building,base,front:info,depth,floor,number:spec.number});
  const entry={row,spec,group:building,polygon:poly,face:info,base,top:base+top,depth};buildings.push(entry);
  planComponents.push({id,label:`Plaça Major ${spec.number}${secondary?' · cuerpo posterior':''}`,kind:'building',period:spec.period,coordinates:poly.map(p=>[p.x/LON-.278,39.679-p.z/111320]),sourceId:'pm-pep',cataloguePage:spec.page,interpretive:true});
  if(!secondary)qa.facades.push({id:row.id,address:spec.number,cataloguePage:spec.page,frontWidthM:len,front:{midpoint:[info.mx,info.mz],normal:[info.nx,info.nz],yaw:f.yaw,galleryDepth:depth,baseM:base},heightM:top,upperStoreys:spec.storeys,support:spec.support,roof:spec.roof,cadastralParentIds:row.cadastralParentIds||[],cadastralParts:(row.cadastralParts||[]).map(p=>({id:p.id,levels:p.levels,height:p.surfaceHeightEstimate||null})),footprintSource:row.source||'OpenStreetMap',elevationStatus:'Visual estimate from municipal PEP photograph, institutional exterior photographs and IGN surface heights'});
 }
 for(const row of rows){addBuilding(row);for(let i=0;i<(row.secondaryFootprints||[]).length;i++)addBuilding(row,true,i);}
 group.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(group),focuses={},stops=new Map((visitData?.stops||[]).map(s=>[s.id,s])),geographical=p=>[p.x/LON-.278,39.679-p.z/111320];
 const byNumber=n=>buildings.find(b=>b.spec.number===n&&!b.group.name.includes('posterior'));
 const p17=byNumber(17),p16=byNumber(16),p15=byNumber(15),p5=byNumber(5),p10=byNumber(10);
 function addFocus(id,label,coordinate,y,radius,offset,closeOffset,components=[],regionId='plaza'){
  const p=Array.isArray(coordinate)?project(...coordinate):coordinate,target=new THREE.Vector3(p.x,y,p.z),box=new THREE.Box3(target.clone().add(new THREE.Vector3(-radius,-Math.min(radius,y-heightAt(p.x,p.z)), -radius)),target.clone().add(new THREE.Vector3(radius,radius,radius)));
  focuses[id]={id,label:stops.get(id)?.title||label,regionId:stops.get(id)?.regionId||regionId,coordinates:geographical(p),target,offset:[...offset],closeOffset:[...closeOffset],bounds:box,components,kind:id==='plaza-conjunto'?'overview':'feature',requiresSection:false,sourceConfidence:'Municipal catalogue and cartography; dimensions and precise viewing point approximate'};return focuses[id];
 }
 const squareHeight=heightAt(centre.x,centre.z);
 addFocus('plaza-conjunto','La Plaça Major y su entorno',centre,squareHeight+6,27,[55,53,-65],[25,27,-36],[], 'conjunto');
 addFocus('plaza-mercado','La plaza del mercado',[-.278628,39.679427],heightAt(...Object.values(project(-.278628,39.679427)))+1.0,14,[21,28,-30],[10,12,-17],[], 'memoria');
 if(p16){const p=p16.face.f.world(0,-1.25),n=[p16.face.nx,p16.face.nz];addFocus('plaza-soportales','Recorrer los soportales',p,p16.base+1.5,3.0,[n[0]*12,9,n[1]*12],[n[0]*5,1.3,n[1]*5],['soportal-16','arco-transversal-16','soportal-17','arco-transversal-17'],'soportales');}
 if(p5){const p=p5.face.f.world(0,.20),n=[p5.face.nx,p5.face.nz];addFocus('plaza-columnas','Columnas, pilastras y fundición',p,p5.base+1.8,3.0,[n[0]*12,5,n[1]*12],[n[0]*6,1.9,n[1]*6],['soportal-5'],'soportales');}
 // These coordinates register the preserved V9 stair and church. This module
 // does not duplicate their fabric or fabricate new epigraphic inscriptions.
 const churchAnchor=project(-.27910948,39.67903398),syaw=1.173,churchPoint=(x,z)=>({x:churchAnchor.x+x*Math.cos(syaw)+z*Math.sin(syaw),z:churchAnchor.z-x*Math.sin(syaw)+z*Math.cos(syaw)}),stairs=churchPoint(23.2,.35);
 addFocus('plaza-epigrafia','Las lápidas romanas junto a Santa María',stairs,heightAt(stairs.x,stairs.z)+1.8,4.0,[19,15,-2],[10,6,-1],['santa-maria-escalinata'],'memoria');
 if(qa.portal){const portal=qa.portal,p={x:portal.target[0],z:portal.target[2]},n=portal.normal;addFocus('plaza-almudin','La puerta conservada del Almudín',p,portal.target[1],1.65,[n[0]*8,1.4,n[2]*8],[n[0]*5.2,.7,n[2]*5.2],['almudin-portada','almudin-hojas','soportal-17'],'almudin');addFocus('plaza-escudo','El escudo de las cuatro barras',p,portal.shieldTarget[1],.45,[n[0]*6,0,n[2]*6],[n[0]*3.0,0,n[2]*3.0],['almudin-escudo'],'almudin');}
 const north=project(-.278617,39.679603);
 addFocus('plaza-abasto','El abasto y los dos almudines',north,heightAt(north.x,north.z)+1.8,6.5,[5,25,18],[3,14,10],['soportal-16','soportal-17'],'memoria');
 addFocus('plaza-forn','El horno en la memoria de la plaza',[-.278609,39.679346],squareHeight+1.8,6,[18,21,-18],[10,11,-11],[],'memoria');
 addFocus('plaza-mustassaf','El control del mercado',[-.278609,39.679474],squareHeight+1.5,7,[21,22,-16],[10,10,-9],[],'memoria');
 addFocus('plaza-vila','La Puerta de la Vila y el gobierno municipal',[-.278609,39.67956],squareHeight+2,7,[20,24,-13],[11,11,-7],[],'memoria');
 const churchEnd=churchPoint(23,.35);
 addFocus('plaza-santa-maria','La plaza y Santa María',churchEnd,heightAt(churchEnd.x,churchEnd.z)+15,22,[32,30,-42],[22,24,-25],['santa-maria-escalinata'],'entorno');
 if(focuses['plaza-escudo'])focuses['plaza-escudo'].minDistance=6;
 if(focuses['plaza-almudin'])focuses['plaza-almudin'].minDistance=8;
 let selected=null,readingMode='materials',sectionOpen=false,ground=heightAt;
 const markerGeo=new THREE.BufferGeometry(),markerMat=new THREE.LineBasicMaterial({color:'#d5a15f',transparent:true,opacity:.78,depthTest:false}),marker=new THREE.LineLoop(markerGeo,markerMat);marker.name='Plaça Major · foco de visita';marker.visible=false;marker.renderOrder=50;group.add(marker);resources.geometries.push(markerGeo);resources.materials.push(markerMat);
 const meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});
 function apply(){const focus=selected?focuses[selected]:null;for(const mesh of meshes){const m=mesh.material,d=mesh.userData;if(!d.baseColor)continue;const map=readingMode==='periods'?null:d.baseMap;if(m.map!==map){m.map=map;m.needsUpdate=true;}m.color.copy(readingMode==='periods'?new THREE.Color(PERIODS[d.period]||PERIODS.interpretation):d.baseColor);m.emissive?.set(focus?.components?.includes(d.component)?'#60431e':'#000000');if(m.emissive)m.emissiveIntensity=.19;}}
 function selectFocus(id){selected=id&&focuses[id]?id:null;apply();marker.visible=!!selected&&selected!=='plaza-conjunto';if(marker.visible){const t=focuses[selected].target,a=[];for(let i=0;i<64;i++){const ang=i*TAU/64;a.push(t.x+Math.cos(ang)*.65,t.y+.05,t.z+Math.sin(ang)*.65);}markerGeo.setAttribute('position',new THREE.Float32BufferAttribute(a,3));markerGeo.computeBoundingSphere();}return selected?focuses[selected]:null;}
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';apply();return readingMode;}
 function setSection(){sectionOpen=false;return false;}
 function bindGround(finalHeightAt){ground=finalHeightAt||heightAt;for(const focus of Object.values(focuses))for(const offset of[focus.offset,focus.closeOffset])offset[1]=Math.max(offset[1],ground(focus.target.x+offset[0],focus.target.z+offset[2])+2.1-focus.target.y);return group;}
 const stats={stops:Object.keys(focuses).length,coreBuildings:rows.length,buildingBodies:buildings.length,documentedFacades:qa.facades.length,meshes:meshes.length,triangles:meshes.reduce((s,m)=>s+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),trueApertures:qa.openings.length,sourceKeys:['pm-pep','pm-rutas'],portalAddress:17,sourceBasedPortalPlacement:true,historicalInteriorInvented:false,periods:plazaMayorPeriods.map(p=>p.id)};
 const plan={id:'plaza-mayor',label:'Plaça Major y Puerta del Almudín',coordinate:record?.coordinate||[-.27863,39.67946],outline:contextData?.plazaOutline||[],components:planComponents,stops:Object.values(focuses).map(f=>({id:f.id,label:f.label,coordinates:f.coordinates,regionId:f.regionId})),note:'Cartografía OSM/Catastro; alzados interpretados a partir del PEP y fotografías institucionales. Las funciones desaparecidas se localizan como sectores, sin edificios ficticios.'};
 const visit={focuses,bounds,stats,periods:plazaMayorPeriods,plan,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({selected,readingMode,sectionOpen}),qa,metadata:{state:'Conserved square with individually documented frontages and open porticoes',metricStatus:'Footprints cartographic; heights, roof slopes, apertures and decoration visually estimated, not photogrammetry',almudin:'Portal at present-day Plaça Major 17, cadastral 3459611. Carpanel opening and carved four-bar shield documented in municipal PEP p133 and institutional photographs.',interiors:'No reconstruction of the different eighteenth-century Almudín in Carrer Abril, no invented former council hall, oven or private interiors.'}};
 group.userData={id:'plaza-mayor',label:'Plaça Major y Puerta del Almudín',interpretation:true,cartographicOutline:true,visit,ownedResources:resources,groundY:squareHeight,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
 return{group,point:new THREE.Vector3(centre.x,squareHeight+5,centre.z),view:{offset:[55,53,-65],closeOffset:[25,27,-36]},exclusions,patches,excludedBuildingIds:contextData?.coreExcludedBuildingIds||[],excludedRoadIds:[],bindings};
}
