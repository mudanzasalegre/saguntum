import * as THREE from 'three';

// V23 · Nave de Talleres Generales. The four halls, openings and longitudinal
// structural system follow the heritage inventory and published photographs.
// Only the 120 × 80 m envelope and four-hall arrangement are documentary metrics;
// the finer heights, sections and registration are explicitly interpretative.
const PI=Math.PI,TAU=2*PI,UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,1),ID=new THREE.Matrix4();
const LON=111320*Math.cos(39.679*PI/180);
const projectDefault=(lon,lat)=>({x:(lon+.278)*LON,z:(39.679-lat)*111320});
const geo=p=>[-.278+p.x/LON,39.679-p.z/111320];
const noise=v=>{const x=Math.sin(v*127.17+43.31)*43758.5453;return x-Math.floor(x);};
export const TALLERES_FRAME={coordinate:[-.2182925,39.65632195],yaw:PI/3};
export const TALLERES_METRICS={nominalLength:120,nominalWidth:80,nominalArea:9600,halls:4,reportedClearWidths:[15,22.5,22.5,15],portalRhythm:[1,3,3,1],construction:[1919,1930],source:'BOE-A-2024-9526; Universitat de València, ficha Talleres Generales; CONTRAST, itinerario didáctico',survey:false};
export const talleresPeriods=[
 {id:'conjunto',label:'Las cuatro naves',color:'#8ebbc2'},
 {id:'estructura',label:'Pilares, cerchas y cubierta',color:'#d4ac79'},
 {id:'envolvente',label:'Luz y materiales',color:'#93b18f'},
 {id:'oficios',label:'Los oficios de la siderurgia',color:'#c29272'},
 {id:'memoria',label:'Transformación y conservación',color:'#b59ac7'}
];
const COLORS=Object.fromEntries(talleresPeriods.map(p=>[p.id,p.color]));
const MAT={
 masonry:{color:'#b1aa97',roughness:1,metalness:0,map:'masonry',bump:.04},
 plinth:{color:'#9e9b8e',roughness:1,metalness:0,map:'stone',bump:.055},
 brick:{color:'#a46d54',roughness:.95,metalness:0,map:'brick',bump:.025},
 trim:{color:'#d9d4c2',roughness:.92,metalness:0,map:'stone',bump:.015},
 concrete:{color:'#b4b1a0',roughness:.97,metalness:0,map:'concrete',bump:.023},
 floor:{color:'#a7a79b',roughness:.9,metalness:.03,map:'floor',bump:.015},
 steel:{color:'#667a7b',roughness:.71,metalness:.46,map:'paint',bump:.008},
 dark:{color:'#445557',roughness:.72,metalness:.48,map:'paint',bump:.007},
 rail:{color:'#777e78',roughness:.62,metalness:.7,map:'steel',bump:.006},
 roof:{color:'#959f9b',roughness:.7,metalness:.38,map:'roof',bump:.022},
 lining:{color:'#dedac6',roughness:.87,metalness:.10},
 rust:{color:'#8d7359',roughness:.88,metalness:.3,map:'paint',bump:.011},
 glass:{color:'#a0b5b1',roughness:.29,metalness:.08,opacity:.25},
 vent:{color:'#aebdb6',roughness:.4,metalness:.04,opacity:.30},
 joint:{color:'#727970',roughness:.98,metalness:0},
 lamp:{color:'#d7d5bc',roughness:.45,metalness:.3},
 cable:{color:'#414949',roughness:.7,metalness:.5}
};
function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle=kind==='brick'?'#c8bca2':kind==='masonry'?'#c5c2b1':kind==='stone'?'#d0cfbe':'#deded3';c.fillRect(0,0,256,256);
 if(kind==='brick')for(let row=0;row<18;row++)for(let col=-1;col<9;col++){const x=col*35+(row%2)*17.5,y=row*14.25,g=161+noise(row*31+col)*69;c.fillStyle=`rgb(${g},${g-9},${g-19})`;c.fillRect(x+1,y+.8,33,12.6);c.fillStyle='rgba(249,239,209,.16)';c.fillRect(x+1.5,y+1.1,31,.7);}
 if(kind==='masonry'||kind==='stone')for(let row=0;row<9;row++)for(let col=-1;col<9;col++){const x=col*35+(row%2)*17,y=row*29,g=155+noise(row*37+col)*79;c.fillStyle=`rgb(${g},${g+2},${g-7})`;c.beginPath();c.moveTo(x+1,y+2);c.lineTo(x+31,y+1+noise(col)*3);c.lineTo(x+34,y+25);c.lineTo(x+2,y+28);c.closePath();c.fill();}
 if(kind==='masonry')for(let i=0;i<75;i++){c.fillStyle=`rgba(228,223,205,${.11+noise(i)*.31})`;c.beginPath();c.ellipse(noise(i+1)*256,noise(i+54)*256,8+noise(i+9)*23,4+noise(i+21)*12,noise(i+10)*PI,0,TAU);c.fill();}
 if(kind==='roof')for(let x=0;x<256;x++){const g=180+28*Math.cos(x*TAU/21.3);c.fillStyle=`rgb(${g},${g+3},${g-1})`;c.fillRect(x,0,1,256);} 
 if(kind==='paint'||kind==='steel')for(let i=0;i<110;i++){c.fillStyle=`rgba(63,71,64,${.015+noise(i)*.08})`;c.fillRect(noise(i+31)*256,noise(i+92)*256,.5+noise(i)*1.5,3+noise(i+9)*41);}
 if(kind==='floor')for(let i=0;i<38;i++){c.fillStyle=`rgba(109,109,92,${.018+noise(i)*.05})`;c.beginPath();c.ellipse(noise(i+6)*256,noise(i+80)*256,4+noise(i+20)*30,2+noise(i+22)*18,noise(i+43)*PI,0,TAU);c.fill();}
 for(let i=0;i<6200;i++){c.fillStyle=(i%2?'rgba(44,40,31,':'rgba(255,251,231,')+(.018+noise(i)*.065)+')';c.fillRect(noise(i+100)*256,noise(i+590)*256,.5+noise(i+10)*1.6,.5+noise(i+18)*1.5);}
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
 finish(group,resources,textures){for(const [k,data]of this.parts){const[component,period,kind]=k.split('|'),def=MAT[kind],mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness,vertexColors:true,side:THREE.DoubleSide,map:def.map?textures[def.map]:null,transparent:def.opacity!==undefined,opacity:def.opacity??1,depthWrite:def.opacity===undefined});if(def.map){mat.bumpMap=textures[def.map];mat.bumpScale=def.bump||.01;}const g=new THREE.BufferGeometry();for(const[name,values,size]of[['position',data.p,3],['normal',data.n,3],['uv',data.u,2],['color',data.c,3]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,size));g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.name='Talleres · '+component+' · '+kind;mesh.castShadow=def.opacity===undefined;mesh.receiveShadow=true;mesh.userData={talleresFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap};group.add(mesh);resources.geometries.push(g);resources.materials.push(mat);}this.cube.dispose();}
}
const quad=(p,a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
const rectangle=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
function arch(cx,bottom,width,height,segments=20){const r=width/2,spring=bottom+height-r,p=[[cx-r,bottom],[cx+r,bottom],[cx+r,spring]];for(let i=1;i<=segments;i++){const a=i*PI/segments;p.push([cx+Math.cos(a)*r,spring+Math.sin(a)*r]);}return p;}
function capsule(cx,bottom,width,height,segments=12){const r=width/2,p=[];for(let i=0;i<=segments;i++){const a=PI+i*PI/segments;p.push([cx+Math.cos(a)*r,bottom+r+Math.sin(a)*r]);}for(let i=0;i<=segments;i++){const a=i*PI/segments;p.push([cx+Math.cos(a)*r,bottom+height-r+Math.sin(a)*r]);}return p;}
function shapeOf(outline,holes=[]){const shape=new THREE.Shape();for(const [i,p]of outline.entries())i?shape.lineTo(...p):shape.moveTo(...p);shape.closePath();for(const points of holes){const path=new THREE.Path();for(const [i,p]of [...points].reverse().entries())i?path.lineTo(...p):path.moveTo(...p);path.closePath();shape.holes.push(path);}return shape;}
function wall(b,k,outline,holes,thickness,transform=ID,tint=1){const g=new THREE.ExtrudeGeometry(shapeOf(outline,holes),{depth:thickness,steps:1,bevelEnabled:false,curveSegments:12});b.geom(k,g,transform,tint);g.dispose();}
function pane(b,k,outline,transform=ID,tint=1){const g=new THREE.ShapeGeometry(shapeOf(outline));b.geom(k,g,transform,tint);g.dispose();}
function iBeam(b,k,a,c,width=.22,depth=.30,web=.035,tint=1){const av=new THREE.Vector3(...a),cv=new THREE.Vector3(...c),v=cv.clone().sub(av),length=v.length();if(length<.001)return;const x=width/2,y=depth/2,f=web,pts=[[-x,-y],[x,-y],[x,-y+f],[f/2,-y+f],[f/2,y-f],[x,y-f],[x,y],[-x,y],[-x,y-f],[-f/2,y-f],[-f/2,-y+f],[-x,-y+f]],g=new THREE.ExtrudeGeometry(shapeOf(pts),{depth:length,bevelEnabled:false,steps:1});b.geom(k,g,new THREE.Matrix4().compose(av,new THREE.Quaternion().setFromUnitVectors(FORWARD,v.normalize()),new THREE.Vector3(1,1,1)),tint);g.dispose();}
function archTrim(b,k,cx,bottom,width,height,t,depth,transform){const outer=arch(cx,bottom-t,width+2*t,height+2*t),inner=arch(cx,bottom,width,height);wall(b,k,outer,[inner],depth,transform);}
function glazing(b,component,outline,transform,{archWindow=null,glass='glass',period='envolvente',bars=true}={}){
 pane(b,key(component,period,glass),outline,transform);
 if(!bars||!archWindow)return;
 const{cx,bottom,width,height}=archWindow,r=width/2,spring=bottom+height-r,frame=key(component+'-carpinteria',period,'dark'),at=(x,y,z=0)=>new THREE.Vector3(x,y,z).applyMatrix4(transform).toArray();
 for(const x of[cx-width/2,cx-width/6,cx+width/6,cx+width/2]){const top=x===cx-width/2||x===cx+width/2?spring:spring+Math.sqrt(Math.max(0,r*r-(x-cx)**2));b.beam(frame,at(x,bottom),at(x,top),.045,.05);}
 for(let y=bottom+.95;y<spring;y+=.95)b.beam(frame,at(cx-r,y),at(cx+r,y),.042,.05);
 for(let i=0;i<20;i++){const a=i*PI/20,c=(i+1)*PI/20;b.beam(frame,at(cx+Math.cos(a)*r,spring+Math.sin(a)*r),at(cx+Math.cos(c)*r,spring+Math.sin(c)*r),.045,.05);}
 b.beam(frame,at(cx-r,bottom),at(cx+r,bottom),.045,.05);
}

export function createTalleres({record,site,project=projectDefault,heightAt=()=>3.83,visitData={},contextData={}}={}){
 record=record||site||{};const origin=project(...(record.coordinate||TALLERES_FRAME.coordinate)),base=heightAt(origin.x,origin.z),yaw=TALLERES_FRAME.yaw,c=Math.cos(yaw),s=Math.sin(yaw);
 const world=(x,z)=>({x:origin.x+x*c+z*s,z:origin.z-x*s+z*c}),world3=(x,y,z)=>{const p=world(x,z);return[p.x,base+y,p.z];},rotate=a=>[a[0]*c+a[2]*s,a[1],-a[0]*s+a[2]*c];
 const group=new THREE.Group();group.name='Talleres Generales · cuatro naves y estructura abierta';group.position.set(origin.x,base,origin.z);group.rotation.y=yaw;
 const permanent=new THREE.Group(),roofs=new THREE.Group();permanent.name='Talleres · fábrica y estructura conservada';roofs.name='Talleres · piel de las cubiertas';group.add(permanent,roofs);
 const b=new Batch(),rb=new Batch(),resources={geometries:[],materials:[],textures:[]},textures={};for(const kind of new Set(Object.values(MAT).map(m=>m.map).filter(Boolean))){textures[kind]=texture(kind);resources.textures.push(textures[kind]);}
 const x0=-40.65,x1=39.2,z0=-60.05,z1=60.60,depth=z1-z0,axis=[x0,-25.05,-.725,23.6,x1],frameSpacing=depth/16,frameZ=Array.from({length:17},(_,i)=>z0+i*frameSpacing),floorY=.18;
 const naves=Array.from({length:4},(_,i)=>{const central=i===1||i===2,width=axis[i+1]-axis[i],centerX=(axis[i]+axis[i+1])/2;return{id:'nave-'+(i+1),label:['Nave lateral sur','Nave central sur','Nave central norte','Nave lateral norte'][i],x0:axis[i],x1:axis[i+1],z0,z1,width,centerX,eave:central?14.1:10.25,rise:central?3.8:2.7,lantern:{width:central?4.0:2.8,height:1.22,length:depth-6.4},reportedClearWidth:central?22.5:15,interpretiveRegistration:true};});
 const outlineLocal=[{x:x0,z:z0},{x:x1,z:z0},{x:x1,z:z1},{x:-37.8,z:z1},{x:-37.8,z:45.45},{x:-41.7,z:45.45},{x:-41.7,z:3.8},{x:-48.0,z:3.8},{x:-47.65,z:-24.9},{x:-40.9,z:-24.9}],outline=record.footprint||outlineLocal.map(p=>geo(world(p.x,p.z)));
 const floorOutline=[[x0,-z0],[x1,-z0],[x1,-z1],[x0,-z1]],floorShape=shapeOf(floorOutline),floorGeo=new THREE.ExtrudeGeometry(floorShape,{depth:.22,bevelEnabled:false});floorGeo.rotateX(-PI/2);floorGeo.translate(0,floorY-.22,0);b.geom(key('solera','conjunto','floor'),floorGeo);floorGeo.dispose();
 for(const z of frameZ.slice(1,-1))b.box(key('juntas-solera','conjunto','joint'),(x0+x1)/2,floorY+.002,z,x1-x0,.004,.026);
 for(const x of axis.slice(1,-1))b.box(key('juntas-solera','conjunto','joint'),x,floorY+.002,(z0+z1)/2,.026,.004,depth);
 const portals=[],windows=[],clerestories=[],trusses=[],columns=[],craneRunways=[];
 // Both gables are thick shells with genuine voids, not rectangles painted black.
 for(const end of[-1,1]){const z=end<0?z0:z1,transform=new THREE.Matrix4().makeTranslation(0,0,z-.31);
  for(const [ni,nave]of naves.entries()){
   const{centerX:cx,width,eave,rise}=nave,central=ni===1||ni===2,doorCount=central?3:1,doorWidth=central?3.8:3.75,doorHeight=central?4.18:3.85,doorXs=Array.from({length:doorCount},(_,i)=>cx+(i-(doorCount-1)/2)*(width/3.25)),topXs=[cx-width*.28,cx,cx+width*.28],sill=central?5.35:4.48,windowWidth=central?2.95:2.22,windowHeight=central?6.95:4.3;
   const doorHoles=doorXs.map(x=>arch(x,floorY-.02,doorWidth,doorHeight)),windowHoles=topXs.map(x=>arch(x,sill,windowWidth,windowHeight)),panel=[[nave.x0,-.04],[nave.x1,-.04],[nave.x1,eave],[cx,eave+rise],[nave.x0,eave]];
   wall(b,key('testeros','conjunto','masonry'),panel,[...doorHoles,...windowHoles],.62,transform,.97+noise(ni+end)*.06);
   let from=nave.x0;for(const x of[...doorXs,nave.x1+doorWidth/2]){const to=x-doorWidth/2;if(to>from+.02)b.box(key('zocalo-testero','envolvente','plinth'),(from+to)/2,1.19,z+end*.34,to-from,2.42,.11);from=x+doorWidth/2;}
   for(const dx of[nave.x0+.27,nave.x1-.27]){b.box(key('pilastras-ladrillo','envolvente','brick'),dx,eave/2,z+end*.35,.52,eave,.17);b.box(key('basas-testero','envolvente','trim'),dx,.24,z+end*.39,.73,.47,.24);}
   for(const x of doorXs){const t=new THREE.Matrix4().makeTranslation(0,0,z+end*.34-(end<0?.13:0));archTrim(b,key('portones','conjunto','trim'),x,floorY-.02,doorWidth,doorHeight,.21,.13,t);const spring=floorY-.02+doorHeight-doorWidth/2,at=(xx,yy)=>[xx,yy,z+end*.03];for(let j=0;j<=6;j++){const a=j*PI/6;b.beam(key('abanicos-portones','envolvente','dark'),at(x,spring),at(x+Math.cos(a)*doorWidth/2,spring+Math.sin(a)*doorWidth/2),.037,.045);}b.beam(key('abanicos-portones','envolvente','dark'),at(x-doorWidth/2,spring),at(x+doorWidth/2,spring),.05,.06);portals.push({id:`porton-${end<0?'oeste':'este'}-${ni+1}-${portals.length+1}`,nave:nave.id,center:[x,floorY+1.65,z],bottom:floorY,width:doorWidth,height:doorHeight,localNormal:[0,0,end],clearHeight:spring-floorY,physicalVoid:true});}
   for(const x of topXs){const t=new THREE.Matrix4().makeTranslation(0,0,z+end*.34-(end<0?.10:0));archTrim(b,key('arcos-ventanas','envolvente','brick'),x,sill,windowWidth,windowHeight,.24,.1,t);const glazingTransform=new THREE.Matrix4().makeTranslation(0,0,z);glazing(b,'ventanales-testero',arch(x,sill,windowWidth,windowHeight),glazingTransform,{archWindow:{cx:x,bottom:sill,width:windowWidth,height:windowHeight}});b.box(key('alféizares','envolvente','trim'),x,sill-.075,z+end*.4,windowWidth+.45,.15,.30);windows.push({type:'gable',nave:nave.id,cx:x,bottom:sill,width:windowWidth,height:windowHeight,z,physicalVoid:true});}
   for(const [a,cx2]of[[[nave.x0-.18,eave+.08,z+end*.39],[cx,eave+rise+.08,z+end*.39]],[[cx,eave+rise+.08,z+end*.39],[nave.x1+.18,eave+.08,z+end*.39]]])b.beam(key('cornisas','envolvente','trim'),a,cx2,.24,.27);
   b.box(key('remates','envolvente','trim'),cx,eave+rise+.23,z+end*.39,.48,.31,.46);const ball=new THREE.SphereGeometry(.23,12,8);ball.translate(cx,eave+rise+.55,z+end*.39);b.geom(key('remates','envolvente','trim'),ball);ball.dispose();
  }
 }
 // Paired round-headed windows run along both long walls. The pane sits within
 // a real 55 cm opening and its steel subdivisions remain visible from inside.
 for(const side of[-1,1]){const x=side<0?x0:x1,transform=new THREE.Matrix4().makeRotationY(PI/2);transform.setPosition(x-.285,0,0);const holes=[],descs=[];
  for(let bay=0;bay<16;bay++){const cz=z0+(bay+.5)*frameSpacing;for(const shift of[-1.18,1.18]){const zz=cz+shift,width=1.88,bottom=2.72,height=6.45;holes.push(arch(-zz,bottom,width,height));descs.push({zz,width,bottom,height});}}
  wall(b,key('muros-laterales','envolvente','masonry'),rectangle(-z1,-.04,-z0,10.25),holes,.57,transform);
  b.box(key('zocalo-lateral','envolvente','plinth'),x+side*.32,1.24,(z0+z1)/2,.12,2.52,depth);
  b.box(key('imposta-lateral','envolvente','trim'),x+side*.38,2.59,(z0+z1)/2,.21,.16,depth+.1);
  b.box(key('cornisas-laterales','envolvente','trim'),x+side*.38,10.25,(z0+z1)/2,.24,.25,depth+.4);
  for(const z of frameZ)b.box(key('pilastras-laterales','envolvente','brick'),x+side*.34,6.46,z,.17,7.45,.48);
  for(const q of descs){const t=new THREE.Matrix4().makeRotationY(PI/2);t.setPosition(x+side*.32-(side<0?.12:0),0,0);archTrim(b,key('arcos-laterales','envolvente','brick'),-q.zz,q.bottom,q.width,q.height,.22,.12,t);const g=new THREE.Matrix4().makeRotationY(PI/2);g.setPosition(x,0,0);glazing(b,'ventanales-laterales',arch(-q.zz,q.bottom,q.width,q.height),g,{archWindow:{cx:-q.zz,bottom:q.bottom,width:q.width,height:q.height}});b.box(key('alféizares-laterales','envolvente','trim'),x+side*.38,q.bottom-.075,q.zz,.29,.15,q.width+.4);windows.push({type:'lateral',x,z:q.zz,bottom:q.bottom,width:q.width,height:q.height,physicalVoid:true});}
 }
 // Three internal division lines preserve the visual continuity of four halls.
 // Photographs show concrete-jacketed piers and steel lattice uprights. Their
 // exact construction-date boundary has not been treated as a surveyed fact.
 for(const [row,x]of axis.slice(1,-1).entries())for(const [j,z]of frameZ.slice(1,-1).entries()){
  const concrete=j<10,period='estructura',height=13.92;
  b.box(key('zapatas','estructura','concrete'),x,.34,z,1.38,.68,1.55);
  if(concrete){const k=key('pilares-hormigon',period,'concrete');for(const dx of[-.38,.38])b.box(k,x+dx,6.91,z,.30,13.18,.66,0,.94+noise(j*7+row)*.08);b.box(k,x,1.05,z,1.06,1.44,.66);b.box(k,x,8.83,z,1.06,1.14,.66);b.box(k,x,13.25,z,1.06,1.34,.66);b.box(key('placas-pilares','estructura','dark'),x,9.18,z,1.17,.18,.81);}
  else{const k=key('pilares-acero',period,'steel');for(const dx of[-.40,.40])iBeam(b,k,[x+dx,.63,z],[x+dx,height,z],.17,.28,.027);for(let y=.75;y<13.4;y+=1.72){const top=Math.min(height,y+1.72);b.beam(k,[x-.40,y,z-.10],[x+.40,top,z-.10],.085,.055);b.beam(k,[x+.40,y,z+.10],[x-.40,top,z+.10],.085,.055);b.box(key('nudos-pilares','estructura','dark'),x,y,z,.97,.15,.38);}}
  for(const sign of[-1,1]){const craneY=row===1?8.95:sign===(row===0?1:-1)?8.95:7.25;iBeam(b,key('mensulas-carrileras','oficios','steel'),[x,craneY-1.15,z],[x+sign*.87,craneY-.15,z],.17,.25,.03);b.box(key('mensulas-carrileras','oficios','dark'),x+sign*.42,craneY-.10,z,1.15,.20,.62);}
  columns.push({id:`pilar-${row+1}-${j+1}`,x,z,height,type:concrete?'concrete-jacket':'steel-lattice',positionInterpretive:true});
 }
 // Longitudinal crane rails survive as an architectural reading of the hall.
 // No locomotive, foundry machinery or alleged original travelling crane is invented.
 for(const [row,x]of axis.slice(1,-1).entries())for(const sign of[-1,1]){const cy=row===1?8.95:sign===(row===0?1:-1)?8.95:7.25,rx=x+sign*.78,holes=[];for(let z=z0+2.4;z<z1-1;z+=2.35){const p=[];for(let q=0;q<18;q++){const a=q*TAU/18;p.push([-z+Math.cos(a)*.20,cy-.50+Math.sin(a)*.20]);}holes.push(p);}const t=new THREE.Matrix4().makeRotationY(PI/2);t.setPosition(rx-.07,0,0);wall(b,key('vigas-carrileras','oficios','steel'),rectangle(-z1+.7,cy-1.02,-z0-.7,cy+.06),holes,.14,t);for(const y of[cy-1.02,cy+.06])b.box(key('alas-carrileras','oficios','dark'),rx,y,(z0+z1)/2,.43,.09,depth-1.3);b.box(key('carriles-grua','oficios','rail'),rx,cy+.16,(z0+z1)/2,.095,.12,depth-1.35);craneRunways.push({x:rx,y:cy+.22,z0:z0+.7,z1:z1-.7,hollowWeb:true,retainedSystem:true});}
 // Rounded clerestory openings at the change of height: the characteristic
 // high row visible in the municipal Film Office interior photograph.
 for(const x of[axis[1],axis[3]]){const t=new THREE.Matrix4().makeRotationY(PI/2);t.setPosition(x-.09,0,0);const holes=[],desc=[];for(let z=z0+1.60;z<z1-1;z+=2.18){const points=capsule(-z,10.73,1.30,2.60);holes.push(points);desc.push({z,points});}wall(b,key('clerestorios','envolvente','concrete'),rectangle(-z1+.35,10.25,-z0-.35,13.68),holes,.18,t,.87);for(const q of desc){const glassTransform=new THREE.Matrix4().makeRotationY(PI/2);glassTransform.setPosition(x,0,0);pane(b,key('cristales-altos','envolvente','vent'),q.points,glassTransform);const outer=capsule(-q.z,10.66,1.44,2.74);wall(b,key('marcos-altos','envolvente','dark'),outer,[q.points],.075,t);clerestories.push({x,z:q.z,bottom:10.73,width:1.30,height:2.60,physicalVoid:true});}b.box(key('cornisa-alta','envolvente','dark'),x,13.76,(z0+z1)/2,.30,.16,depth-.65);}
 // Fine riveted trusses, visibly separate purlins, and true monitor roof voids.
 for(const [ni,nave]of naves.entries()){
  const{centerX:cx,width,eave,rise,lantern}=nave,peak=eave+rise,topAt=x=>eave+rise*(1-Math.abs(x-cx)/(width/2));
  for(const [j,z]of frameZ.entries()){
   const low=eave-.30,k=key('cerchas','estructura','dark');b.beam(k,[nave.x0,low,z],[nave.x1,low,z],.09,.13);
   for(let panel=0;panel<8;panel++){const xa=nave.x0+width*panel/8,xb=nave.x0+width*(panel+1)/8,ya=topAt(xa)-.12,yb=topAt(xb)-.12;b.beam(k,[xa,ya,z],[xb,yb,z],.095,.135);if(panel>0)b.beam(k,[xa,low,z],[xa,ya,z],.055,.075);const a=panel<4?[xa,low,z]:[xa,ya,z],d=panel<4?[xb,yb,z]:[xb,low,z];b.beam(k,a,d,.06,.08);b.box(key('cartelas-cerchas','estructura','steel'),xa,low,z,.22,.22,.027);}
   b.box(key('cartelas-cerchas','estructura','steel'),cx,peak-.15,z,.28,.27,.03);trusses.push({nave:nave.id,z,width,eave,peak,bottomChord:low,physicalOpen:true});
  }
  for(let col=0;col<=10;col++){const x=nave.x0+width*col/10,y=topAt(x)-.04;b.box(key('correas','estructura','steel'),x,y,(z0+z1)/2,.095,.14,depth-.3);}
  const ml=cx-lantern.width/2,mr=cx+lantern.width/2,roofZ0=z0-.45,roofZ1=z1+.45;
  for(const [xa,xb]of[[nave.x0-.28,ml],[mr,nave.x1+.28]]){const ya=topAt(xa)+.10,yb=topAt(xb)+.10,p=[];quad(p,[xa,ya,roofZ0],[xb,yb,roofZ0],[xb,yb,roofZ1],[xa,ya,roofZ1]);quad(p,[xb,yb-.12,roofZ0],[xa,ya-.12,roofZ0],[xa,ya-.12,roofZ1],[xb,yb-.12,roofZ1]);for(const z of[roofZ0,roofZ1])quad(p,[xa,ya,z],[xb,yb,z],[xb,yb-.12,z],[xa,ya-.12,z]);rb.raw(key('cubiertas','envolvente','roof'),p,1+noise(ni)*.055);}
  // At the short monitor ends the pitched roof remains solid.
  for(const [za,zb]of[[roofZ0,z0+3.2],[z1-3.2,roofZ1]]){const p=[];quad(p,[ml,topAt(ml)+.1,za],[cx,peak+.1,za],[cx,peak+.1,zb],[ml,topAt(ml)+.1,zb]);quad(p,[cx,peak+.1,za],[mr,topAt(mr)+.1,za],[mr,topAt(mr)+.1,zb],[cx,peak+.1,zb]);rb.raw(key('cubiertas','envolvente','roof'),p);}
  const lz0=z0+3.2,lz1=z1-3.2,monitorEave=peak+.70,monitorPeak=peak+lantern.height;
  for(const sign of[-1,1]){const x=cx+sign*lantern.width/2,bottom=topAt(x)+.10,p=[];quad(p,[x,bottom,lz0],[x,bottom,lz1],[x,monitorEave,lz1],[x,monitorEave,lz0]);rb.raw(key('lucernarios','envolvente','vent'),p);b.box(key('bastidores-lucernarios','estructura','dark'),x,bottom,(lz0+lz1)/2,.075,.10,lz1-lz0);b.box(key('bastidores-lucernarios','estructura','dark'),x,monitorEave,(lz0+lz1)/2,.075,.10,lz1-lz0);for(let z=lz0;z<=lz1;z+=3.75)b.box(key('bastidores-lucernarios','estructura','dark'),x,(bottom+monitorEave)/2,z,.065,monitorEave-bottom,.065);}
  // The published interior shows a light grey/beige underside and bright
  // lateral apertures. Keep the cap opaque: a white band is not evidence of
  // a glass or polycarbonate roof. The two faces carry independent finishes.
  for(const [xa,ya,xb,yb]of[[ml-.2,monitorEave+.08,cx,monitorPeak],[cx,monitorPeak,mr+.2,monitorEave+.08]]){const p=[],q=[];quad(p,[xa,ya,lz0-.28],[xb,yb,lz0-.28],[xb,yb,lz1+.28],[xa,ya,lz1+.28]);quad(q,[xb,yb-.08,lz0-.28],[xa,ya-.08,lz0-.28],[xa,ya-.08,lz1+.28],[xb,yb-.08,lz1+.28]);rb.raw(key('sobrecubiertas','envolvente','roof'),p,.98);rb.raw(key('intradós-sobrecubiertas','envolvente','lining'),q);}
  for(const z of[lz0,lz1]){const p=[];quad(p,[ml,topAt(ml)+.12,z],[mr,topAt(mr)+.12,z],[mr,monitorEave,z],[ml,monitorEave,z]);rb.raw(key('testeros-lucernario','envolvente','dark'),p);b.beam(key('bastidores-lucernarios','estructura','dark'),[ml,monitorEave,z],[cx,monitorPeak,z],.065,.08);b.beam(key('bastidores-lucernarios','estructura','dark'),[cx,monitorPeak,z],[mr,monitorEave,z],.065,.08);}
  for(const x of[nave.x0,nave.x1])b.box(key('canalones','envolvente','dark'),x,eave+.02,(z0+z1)/2,.26,.18,depth+.60);
  nave.lantern={...lantern,bottom:topAt(ml)+.10,eave:monitorEave,peak:monitorPeak,z0:lz0,z1:lz1};
 }
 for(const side of[-1,1])for(let j=0;j<=8;j++){const x=side<0?x0-.43:x1+.43,z=z0+j*depth/8;b.cylinder(key('bajantes','envolvente','dark'),x,5.08,z,.065,.065,9.76,10);b.beam(key('bajantes','envolvente','dark'),[x,9.92,z],[x-side*.25,10.18,z],.11,.11);}
 // A modest adjoining service volume is registered to the south-west outline.
 // Its unrecorded internal partitions and current uses are intentionally absent.
 const annex={x0:-47.85,x1:-40.70,z0:-24.9,z1:3.8,height:5.45},ax=(annex.x0+annex.x1)/2,az=(annex.z0+annex.z1)/2;
 b.box(key('anexo-solera','memoria','floor'),ax,.07,az,annex.x1-annex.x0,.22,annex.z1-annex.z0);
 for(const z of[annex.z0,annex.z1])b.box(key('anexo','memoria','masonry'),ax,annex.height/2,z,annex.x1-annex.x0,annex.height,.36);
 const at=new THREE.Matrix4().makeRotationY(PI/2);at.setPosition(annex.x0-.18,0,0);const annexWindows=Array.from({length:6},(_,i)=>rectangle(-annex.z0-2.1-i*4.3,3.2,-annex.z0-.7-i*4.3,4.25));wall(b,key('anexo','memoria','masonry'),rectangle(-annex.z1,0,-annex.z0,annex.height),annexWindows,.36,at);
 for(const points of annexWindows)pane(b,key('ventanas-anexo','memoria','glass'),points,at);
 rb.box(key('cubierta-anexo','memoria','roof'),ax,annex.height+.1,az,annex.x1-annex.x0+.45,.18,annex.z1-annex.z0+.45);
 // Pendant lamps are present in the published interior. Supplemental scene
 // illumination is a legibility aid, not a record of installed lighting levels.
 for(const nave of naves.slice(1,3))for(let z=z0+10;z<z1-5;z+=15){const x=nave.centerX,roofY=nave.eave+nave.rise-.1,ly=nave.eave-.8;b.beam(key('cables-lamparas','memoria','cable'),[x,ly,z],[x,roofY,z],.012,.012);b.cylinder(key('lamparas','memoria','dark'),x,ly,z,.15,.38,.24,14);b.cylinder(key('lamparas','memoria','lamp'),x,ly-.13,z,.32,.32,.025,14);}
 for(const x of[naves[1].centerX,naves[2].centerX])for(const z of[-28,28]){const light=new THREE.PointLight('#e9e1c7',23,50,1.7);light.position.set(x,11,z);light.name='Talleres · luz de lectura del espacio';group.add(light);}
 b.finish(permanent,resources,textures);rb.finish(roofs,resources,textures);group.updateMatrixWorld(true);
 const meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});const bounds=new THREE.Box3().setFromObject(group),state={sectionOpen:false,readingMode:'realistic',selected:null};
 const definitions=[
  ['conjunto','Cuatro naves, un único espacio',[-.7,6.8,0],[-104,76,-133],[-76,52,-98],['testeros','cerchas','cubiertas'],'conjunto',false,false,46],
  ['fachada','El ritmo de los testeros',[-.7,7.5,z0],[-38,19,-66],[-26,13,-46],['testeros','portones','ventanales-testero','remates'],'conjunto',false,false,52],
  ['acceso','Portones para el trabajo',[naves[1].centerX,2.8,z0],[0,2.2,-15],[0,1.0,-8],['portones','abanicos-portones','zocalo-testero'],'conjunto',false,false,60],
  ['interior','La profundidad de la nave',[naves[1].centerX,6.3,-5],[0,-4.45,-43],[0,-4.45,-32],['solera','pilares-hormigon','cerchas','clerestorios'],'conjunto',false,true,72],
  ['naves','Cuatro cubiertas comunicadas',[-.7,5.8,3],[-75,66,-83],[-55,48,-62],['solera','cerchas','pilares-hormigon','pilares-acero'],'conjunto',true,false,50],
  ['cerchas','Cerchas metálicas abiertas',[naves[1].centerX,15.1,-14],[-2.0,-10.3,-17],[-1.3,-9.5,-12],['cerchas','cartelas-cerchas','correas'],'estructura',false,true,66],
  ['pilares-hormigon','Pilares y revestimientos de hormigón',[axis[1],6.4,frameZ[4]],[7.0,-3.4,-8.5],[5.0,-3.1,-6.2],['pilares-hormigon','zapatas','placas-pilares'],'estructura',false,true,63],
  ['pilares-acero','Montantes de celosía',[axis[1],6.5,frameZ[13]],[7.6,-3.7,-9.0],[5.5,-3.5,-6.4],['pilares-acero','nudos-pilares','zapatas'],'estructura',false,true,63],
  ['cubiertas','Cuatro cubiertas y sus respiraderos',[-.7,15.2,1],[-62,46,-71],[-44,33,-51],['cubiertas','sobrecubiertas','lucernarios','canalones'],'envolvente',false,false,49],
  ['lucernarios','Luz por encima de las naves',[naves[1].centerX,17.7,10],[1.8,-13.0,-13],[1.2,-12.4,-9.0],['lucernarios','intradós-sobrecubiertas','clerestorios','cristales-altos','bastidores-lucernarios'],'envolvente',false,true,68],
  ['ventanas','Un muro atravesado por la luz',[x0,6.1,-39],[-13,1.6,-8.2],[-9,1.1,-5.7],['arcos-laterales','ventanales-laterales','alféizares-laterales'],'envolvente',false,false,56],
  ['ladrillo','Piedra, ladrillo y revoco',[naves[0].centerX,5.6,z0],[-8,3.2,-18],[-5.8,2.1,-12],['pilastras-ladrillo','arcos-ventanas','zocalo-testero','cornisas'],'envolvente',false,false,54],
  ['ferrocarril','Por aquí entraba el ferrocarril',[naves[2].centerX,2.3,z0],[1.8,1.0,-17],[1.2,.6,-11],['portones','solera'],'oficios',false,false,59],
  ['gruas','El sistema de los puentes grúa',[axis[1]+.78,8.9,-9],[7.0,-5.8,-12],[5.0,-5.7,-8.6],['vigas-carrileras','alas-carrileras','carriles-grua','mensulas-carrileras'],'oficios',false,true,65],
  ['oficios','Calderería, fundición y ajuste',[naves[2].centerX,4.3,12],[0,-2.45,-36],[-2.0,-2.45,-25],['solera','vigas-carrileras','pilares-hormigon'],'oficios',false,true,72],
  ['ampliacion','La prolongación hacia el mar',[-.7,7.5,z1],[-46,28,57],[-32,19.6,40],['testeros','pilares-acero','cubiertas'],'memoria',false,false,53],
  ['restauracion','Conservar una arquitectura industrial',[x0,5.2,-11],[-38,23,-31],[-27,16,-22],['anexo','muros-laterales','cubierta-anexo','lucernarios'],'memoria',false,false,54],
  ['seccion','Leer el espacio bajo la cubierta',[-.7,5.9,0],[-66,68,-79],[-49,50,-59],['cerchas','pilares-hormigon','pilares-acero','solera','clerestorios'],'estructura',true,false,52],
  ['memoria','Un continente para la memoria',[naves[2].centerX,5.5,31],[-3,-3.65,-39],[-2,-3.65,-28],['solera','cerchas','lamparas','vigas-carrileras'],'memoria',false,true,71],
  ['entorno','La nave y la ciudad',[0,5.5,0],[-136,85,-138],[-99,62,-100],['testeros','cubiertas','anexo'],'conjunto',false,false,49]
 ];
 const focuses={};for(const[short,label,targetLocal,offset,closeOffset,components,period,requiresSection,interiorView,fov]of definitions){const id='talleres-'+short,target=new THREE.Vector3(...world3(...targetLocal));focuses[id]={id,label,target,localTarget:targetLocal.slice(),elevation:targetLocal[1],coordinates:geo({x:target.x,z:target.z}),offset:rotate(offset),closeOffset:rotate(closeOffset),components,regionId:period,readingLayer:period,period,requiresSection,interiorView,floor:interiorView?1:0,fov,kind:short==='conjunto'?'overview':'feature',bounds:new THREE.Box3(target.clone().addScalar(-3),target.clone().addScalar(3)),fitBounds:false,minDistance:interiorView?.35:.8,closeScale:false,sourceConfidence:'documented-envelope-and-proportional-photographic-registration'};}
 focuses['talleres-conjunto'].bounds=bounds.clone();focuses['talleres-conjunto'].fitBounds=true;
 const polygon=(xx0,zz0,xx1,zz1)=>[{x:xx0,z:zz0},{x:xx1,z:zz0},{x:xx1,z:zz1},{x:xx0,z:zz1}],component=(id,label,period,poly,kind,extra={})=>({id,label,period,readingLayer:period,coordinates:poly.map(p=>geo(world(p.x,p.z))),kind,interpretive:true,...extra});
 const planNaves=naves.map(q=>({...q,coordinates:polygon(q.x0,q.z0,q.x1,q.z1).map(p=>geo(world(p.x,p.z)))}));
 const plan={id:'talleres',label:'Talleres Generales · planta y sección',coordinate:record.coordinate||TALLERES_FRAME.coordinate,outline,frame:{coordinate:record.coordinate||TALLERES_FRAME.coordinate,x:origin.x,z:origin.z,yaw,baseY:base},documentedMetrics:TALLERES_METRICS,naves:planNaves,bays:planNaves,crossSection:{label:'Sección transversal interpretativa',datum:'Suelo del modelo',floorY,x0,x1,naves:planNaves.map(({id,label,x0,x1,centerX,width,eave,rise,lantern})=>({id,label,x0,x1,centerX,width,eave,rise,lantern})),columnRows:axis.slice(1,-1),craneRails:craneRunways.map(({x,y})=>({x,y})),heightSurvey:false},components:[...naves.map(q=>component(q.id,q.label,'conjunto',polygon(q.x0,z0,q.x1,z1),'hall',{layer:'floor'})),...naves.map(q=>component('roof-'+q.id,'Cubierta · '+q.label,'envolvente',polygon(q.x0,z0,q.x1,z1),'roof',{layer:'roof',hiddenWhenSection:true,sectionOpen:false})),...naves.map(q=>component('monitor-'+q.id,'Sobrecubierta · '+q.label,'envolvente',polygon(q.centerX-q.lantern.width/2,q.lantern.z0,q.centerX+q.lantern.width/2,q.lantern.z1),'roof',{layer:'roof',hiddenWhenSection:true})),component('anexo','Volumen adosado suroeste','memoria',polygon(annex.x0,annex.z0,annex.x1,annex.z1),'annex',{layer:'building'})],columnRows:axis.slice(1,-1),columns:columns.map(q=>({...q,coordinates:geo(world(q.x,q.z))})),trusses:trusses.map(q=>({...q})),openings:{portals:portals.map(q=>({...q,coordinates:geo(world(q.center[0],q.center[2]))})),windows,clerestories},annex,stops:Object.values(focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,localTarget:q.localTarget,elevation:q.elevation,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,requiresSection:q.requiresSection,interiorView:q.interiorView})),floors:[{id:0,label:'Recinto exterior',elevation:base},{id:1,label:'Interior de las naves',elevation:base+floorY}],note:'Envolvente nominal 120 × 80 m y cuatro naves documentadas. La modulación, alturas, perfiles, espesores, anexo y colocación de los detalles son proporcionales a fotografías y cartografía, no un levantamiento. Las diferencias de pilares no se asignan a una fase histórica exacta. El corte retira sólo la piel de cubierta; las cerchas siguen presentes. No representa un proyecto cultural futuro ni inventaría la distribución actual de instalaciones temporales.'};
 function repaint(){for(const m of meshes){const d=m.userData,mat=m.material;mat.color.copy(d.baseColor);mat.map=d.baseMap;mat.bumpMap=d.baseBumpMap;if(state.readingMode==='periods'){mat.color.set(COLORS[d.period]||'#b3b4a7');mat.map=null;mat.bumpMap=null;}mat.emissive.set(focuses[state.selected]?.components.includes(d.component)?'#b49a72':'#000000');mat.emissiveIntensity=.045;mat.needsUpdate=true;}}
 const setSection=open=>{state.sectionOpen=!!open;roofs.visible=!state.sectionOpen;return state.sectionOpen;},selectFocus=id=>{state.selected=id&&focuses[id]?id:null;repaint();return focuses[state.selected]||null;},setReadingMode=mode=>{state.readingMode=mode==='periods'?'periods':'realistic';repaint();return state.readingMode;};
 const bindGround=sample=>{if(typeof sample!=='function')return;for(const q of Object.values(focuses)){if(q.interiorView)continue;for(const field of['offset','closeOffset']){const o=q[field],h=sample(q.target.x+o[0],q.target.z+o[2]);if(Number.isFinite(h)&&q.target.y+o[1]<h+1.7)o[1]=h+1.7-q.target.y;}}};
 const stats={modelVersion:'v23',meshes:meshes.length,triangles:meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count/3,0),naves:4,stops:20,portals:portals.length,realWindowVoids:windows.length,clerestoryVoids:clerestories.length,openTrusses:trusses.length,internalColumnRows:3,columns:columns.length,documentedNominalFootprintMetres:[120,80],registeredEnvelopeMetres:[x1-x0,depth],resourcesOwned:true,interpretiveGeometry:true};
 const qa={baseY:base,frame:{x:origin.x,z:origin.z,yaw},floorY,naves:planNaves,portals,windows,clerestories,columns,trusses,craneRunways,frameZ,columnRows:axis.slice(1,-1),annex,registeredEnvelope:{x0,x1,z0,z1},section:{removes:'opaque roof sheets and monitor skins',retains:'masonry, piers, open trusses and purlins'},documentedMetrics:TALLERES_METRICS,heightSurvey:false,railwayTracksInvented:false,travellingCraneMachineryInvented:false};
 const visit={focuses,bounds,plan,stats,qa,periods:talleresPeriods,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({...state}),sectionAvailable:true,metadata:{model:'documented-interpretation',sourcePlan:'OSM 154001633 and IGN PNOA footprint; BOE-A-2024-9526; Universitat de València heritage inventory; CONTRAST and Sagunto Film Office photographs',current:'Four connected surviving halls, paired wall windows, high rounded clerestories, metal trusses, mixed pier treatments, roof ventilators and an adjoining service volume. Temporary contents and unverified machinery are omitted.',section:'Removes the roof and monitor skins while keeping the real structural reading: trusses, purlins, columns and masonry. A digital inspection, not a historical roof-loss state.',dimensions:'120 × 80 m nominal envelope and 1+3+3+1 gable portal rhythm are documented. The reported 15/22.5/22.5/15 m clear hall widths do not sum to the outer envelope. Roof heights, structural spacing and detail positions remain proportional interpretations.',interiorSurvey:false,terrain:'The continuous hall floor is part of the model; there is no temporary terrain mask.',safety:'Virtual views do not describe current public opening or access.'},renderStops:['talleres-conjunto','talleres-fachada','talleres-acceso','talleres-interior','talleres-pilares-acero','talleres-seccion','talleres-lucernarios']};
 group.userData={id:'talleres',landmarkId:'talleres',visit,resources,ownedResources:resources,interpretation:true};setSection(false);repaint();
 const point=focuses['talleres-conjunto'].target.clone(),views={offset:focuses['talleres-conjunto'].offset,closeOffset:focuses['talleres-conjunto'].closeOffset};return{id:'talleres',group,point,views,view:{target:point.clone(),...views},visit,roof:roofs,setSection,stats,patches:[{polygon:outlineLocal.map(p=>world(p.x,p.z)),height:base-.06}],exclusions:[outlineLocal.map(p=>world(p.x,p.z))],excludedBuildingIds:['154001633'],excludedRoadIds:[]};
}
