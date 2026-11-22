import * as THREE from 'three';

// V24 · Nave de Efectos y Repuestos / Museo Industrial y de la Memoria Obrera.
// Current architecture follows official photographs and the museum project.
// The 70 × 18 m documentary envelope differs from registered cadastral dimensions;
// the latter controls the atlas position. Minor details remain interpretative.
const PI=Math.PI,TAU=2*PI,UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,1),ID=new THREE.Matrix4();
const LON=111320*Math.cos(39.679*PI/180);
const projectDefault=(lon,lat)=>({x:(lon+.278)*LON,z:(39.679-lat)*111320});
const geo=p=>[-.278+p.x/LON,39.679-p.z/111320];
const noise=v=>{const x=Math.sin(v*127.17+43.31)*43758.5453;return x-Math.floor(x);};
export const MUSEO_INDUSTRIAL_FRAME={coordinate:[-.2216385,39.65754705],yaw:1.0446};
export const MUSEO_INDUSTRIAL_METRICS={nominalLength:70,nominalWidth:18,nominalArea:1260,bays:3,platformRise:1,southPublishedSlabHeight:6,southPublishedDatum:'unspecified',southPortfolioPlatformHeight:5,northHistoricClearHeight:2.2,northAnnexNominalLength:34,construction:1927,source:'Fundació Patrimoni Industrial Port de Sagunt; proyecto de musealización; Ayuntamiento de Sagunto',survey:false};
export const museoIndustrialPeriods=[
{id:'conjunto',label:'La nave y sus accesos',color:'#8ebbc2'},
{id:'estructura',label:'Estructura y luz',color:'#d4ac79'},
{id:'envolvente',label:'Luz y envolvente',color:'#93b18f'},
{id:'oficios',label:'Vía, andenes y almacén',color:'#c29272'},
{id:'memoria',label:'Museo, rehabilitación y ciudad',color:'#b59ac7'}
];
const COLORS=Object.fromEntries(museoIndustrialPeriods.map(p=>[p.id,p.color]));
const MAT={
 masonry:{color:'#eee9db',roughness:.95,metalness:0,map:'plaster',bump:.008},
 plinth:{color:'#9e9b8e',roughness:1,metalness:0,map:'stone',bump:.055},
 brick:{color:'#a46d54',roughness:.95,metalness:0,map:'brick',bump:.025},
 trim:{color:'#d9d4c2',roughness:.92,metalness:0,map:'stone',bump:.015},
 concrete:{color:'#e4e0d2',roughness:.97,metalness:0,map:'concrete',bump:.023},
 floor:{color:'#a3aaa8',roughness:.9,metalness:.03,map:'floor',bump:.015},
 steel:{color:'#687779',roughness:.71,metalness:.46,map:'paint',bump:.008},
 dark:{color:'#445557',roughness:.72,metalness:.48,map:'paint',bump:.007},
 rail:{color:'#777e78',roughness:.62,metalness:.7,map:'steel',bump:.006},
 roof:{color:'#959f9b',roughness:.7,metalness:.38,map:'roof',bump:.022},
 ballast:{color:'#a6a998',roughness:1,metalness:0,map:'stone',bump:.10},
 wood:{color:'#9b6d44',roughness:.92,metalness:0,map:'paint',bump:.017},
 display:{color:'#d8d9cd',roughness:.90,metalness:.02},
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
 c.fillStyle=kind==='plaster'?'#f1eee7':kind==='brick'?'#c8bca2':kind==='masonry'?'#c5c2b1':kind==='stone'?'#d0cfbe':'#deded3';c.fillRect(0,0,256,256);
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
 finish(group,resources,textures){for(const [k,data]of this.parts){const[component,period,kind]=k.split('|'),def=MAT[kind],mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness,vertexColors:true,side:THREE.DoubleSide,map:def.map?textures[def.map]:null,transparent:def.opacity!==undefined,opacity:def.opacity??1,depthWrite:def.opacity===undefined});if(def.map){mat.bumpMap=textures[def.map];mat.bumpScale=def.bump||.01;}const g=new THREE.BufferGeometry();for(const[name,values,size]of[['position',data.p,3],['normal',data.n,3],['uv',data.u,2],['color',data.c,3]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,size));g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.name='Museo Industrial · '+component+' · '+kind;mesh.castShadow=def.opacity===undefined;mesh.receiveShadow=true;mesh.userData={museoIndustrialFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map,baseBumpMap:mat.bumpMap};group.add(mesh);resources.geometries.push(g);resources.materials.push(mat);}this.cube.dispose();}
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

export function createMuseoIndustrial({record,site,project=projectDefault,heightAt=()=>4,visitData={},contextData={}}={}){
 record=record||site||{};const coordinate=record.coordinate||MUSEO_INDUSTRIAL_FRAME.coordinate,origin=project(...coordinate),base=heightAt(origin.x,origin.z),yaw=record.dimensions?.rotationY??MUSEO_INDUSTRIAL_FRAME.yaw,c=Math.cos(yaw),s=Math.sin(yaw),width=record.dimensions?.mappedWidth??20.22,length=record.dimensions?.mappedLength??60.67,x0=-width/2,x1=width/2,z0=-length/2,z1=length/2,trackY=-.82,floorY=.18,northX=3.2,southX=-3.2,eave=10.7,rise=2.5;
 const world=(x,z)=>({x:origin.x+x*c+z*s,z:origin.z-x*s+z*c}),world3=(x,y,z)=>{const p=world(x,z);return[p.x,base+y,p.z];},rotate=a=>[a[0]*c+a[2]*s,a[1],-a[0]*s+a[2]*c],poly=(xx0,zz0,xx1,zz1)=>[{x:xx0,z:zz0},{x:xx1,z:zz0},{x:xx1,z:zz1},{x:xx0,z:zz1}],geoPoly=p=>p.map(q=>geo(world(q.x,q.z)));
 const group=new THREE.Group();group.name='Museo Industrial · nave, vía y galerías';group.position.set(origin.x,base,origin.z);group.rotation.y=yaw;
 const permanent=new THREE.Group(),roof=new THREE.Group(),upper=new THREE.Group();permanent.name='Museo Industrial · fábrica y almacén';roof.name='Museo Industrial · cubierta desmontable';upper.name='Museo Industrial · forjados y contenido superior';group.add(permanent,roof,upper);
 const b=new Batch(),rb=new Batch(),ub=new Batch(),resources={geometries:[],materials:[],textures:[]},textures={};for(const kind of new Set(Object.values(MAT).map(m=>m.map).filter(Boolean))){textures[kind]=texture(kind);resources.textures.push(textures[kind]);}
 const n=12,step=length/n,frameZ=Array.from({length:n+1},(_,i)=>z0+i*step),columns=[],trusses=[],portals=[],windows=[],gallerySlabs=[],stairs=[],shelves=[];
 const outline=record.footprint||geoPoly(poly(x0,z0,x1,z1));
 // The rail channel lies a metre below the historic loading platforms. Its
 // walkable glass cover is level with today's visitor circulation surface.
 b.box(key('balasto','oficios','ballast'),0,trackY-.13,0,6.3,.24,length-.6);
 for(const x of[-6.6,6.6])b.box(key('andenes','oficios','concrete'),x,(trackY+floorY)/2,0,6.8,floorY-trackY,length-.65);
 for(const x of[-6.6,6.6])b.box(key('solera-andenes','oficios','floor'),x,floorY-.035,0,6.8,.07,length-.65);
 // Retained rails are represented beneath the floor, with two gauges sharing
 // one rail: widths are documentary railway types, exact surviving alignment
 // is a proportional interpretation of the source photograph.
 const railXs=[-.835,.835,.165];
 for(const x of railXs){b.box(key('carriles','oficios','rail'),x,trackY+.12,0,.09,.14,length-1);b.box(key('cabezas-carril','oficios','rail'),x,trackY+.20,0,.13,.05,length-1);}
 for(let z=z0+.8;z<z1-.4;z+=.78)b.box(key('traviesas','oficios','wood'),0,trackY+.035,z,2.6,.15,.22,0,.86+noise(z)*.18);
 for(let z=z0+.4;z<z1-.4;z+=2.2){const d=Math.min(2.18,z1-.35-z);b.box(key('suelo-vidrio','oficios','glass'),0,floorY+.02,z+d/2,6.32,.09,d);b.box(key('bastidores-vidrio','oficios','dark'),0,floorY-.01,z,6.34,.11,.055);}
 for(const x of[-3.18,3.18])b.box(key('bastidores-vidrio','oficios','dark'),x,floorY-.01,0,.07,.11,length-.65);
 // Both gables: two tall arched windows, a central round-headed door and a
 // small lunette. All openings are real voids through a 48 cm wall.
 for(const end of[-1,1]){const z=end<0?z0:z1,t=new THREE.Matrix4().makeTranslation(0,0,z-.24),door={cx:0,bottom:floorY-.025,width:3.6,height:4.2},gables=[{cx:-6.1,bottom:2.25,width:2.55,height:6.25},{cx:6.1,bottom:2.25,width:2.55,height:6.25}],lunette={cx:0,bottom:9.2,width:2.5,height:1.35};
  wall(b,key('testeros','conjunto','masonry'),[[x0,trackY],[x1,trackY],[x1,eave],[0,eave+rise],[x0,eave]],[arch(door.cx,door.bottom,door.width,door.height),...gables.map(q=>arch(q.cx,q.bottom,q.width,q.height)),arch(lunette.cx,lunette.bottom,lunette.width,lunette.height)],.48,t);
  for(const x of[x0+.24,x1-.24])b.box(key('pilastras-ladrillo','conjunto','brick'),x,eave/2,z+end*.29,.62,eave,.14);
  for(const x of[-5.95,5.95])b.box(key('zocalos','conjunto','plinth'),x,.50,z+end*.29,8.3,1.36,.13);
  for(const x of[-5.95,5.95])b.box(key('impostas','conjunto','trim'),x,2.13,z+end*.30,8.3,.21,.18);
  const trim=new THREE.Matrix4().makeTranslation(0,0,z+end*.27-(end<0?.13:0));archTrim(b,key('portones','conjunto','trim'),0,door.bottom,door.width,door.height,.23,.13,trim);portals.push({id:`portal-${end<0?'noroeste':'sureste'}`,center:[0,floorY+1.8,z],bottom:floorY,width:3.6,height:4.2,localNormal:[0,0,end],physicalVoid:true});
  // Timber door leaves are folded beside the jambs to keep the virtual entry open.
  for(const sign of[-1,1]){b.box(key('hojas-puerta','conjunto','wood'),sign*1.95,1.85,z-end*.65,.13,3.34,1.28);for(let y=.8;y<3.4;y+=.8)b.box(key('herrajes-puerta','conjunto','dark'),sign*1.87,y,z-end*.65,.045,.06,1.12);}
  for(const q of[...gables,lunette]){archTrim(b,key('arcos-ladrillo','estructura','brick'),q.cx,q.bottom,q.width,q.height,.23,.13,trim);glazing(b,'ventanas-testero',arch(q.cx,q.bottom,q.width,q.height),new THREE.Matrix4().makeTranslation(0,0,z),{archWindow:q,period:'estructura'});windows.push({...q,type:'gable',z,physicalVoid:true});}
  for(const sign of[-1,1])b.beam(key('remates-testero','conjunto','trim'),[sign*(width/2+.12),eave+.05,z+end*.3],[0,eave+rise+.05,z+end*.3],.22,.3);
  const sphere=new THREE.SphereGeometry(.23,12,8);sphere.translate(0,eave+rise+.36,z);b.geom(key('remates-testero','conjunto','trim'),sphere);sphere.dispose();
 }
 // The official museum project records 16 large windows: twelve along the
 // south facade and two on each gable. North is the attached service side.
 const southT=new THREE.Matrix4().makeRotationY(PI/2);southT.setPosition(x0-.24,0,0);const sideWindows=Array.from({length:n},(_,i)=>({cx:-(z0+(i+.5)*step),bottom:2.1,width:2.35,height:6.85}));
 wall(b,key('muro-sur','conjunto','masonry'),rectangle(-z1,trackY,-z0,eave),sideWindows.map(q=>arch(q.cx,q.bottom,q.width,q.height)),.48,southT);
 const northT=new THREE.Matrix4().makeRotationY(PI/2);northT.setPosition(x1-.24,0,0);const annexOpenings=[-22,0,22].map(z=>({cx:-z,bottom:floorY-.025,width:2.1,height:2.4}));
 wall(b,key('muro-norte','conjunto','masonry'),rectangle(-z1,trackY,-z0,eave),annexOpenings.map(q=>rectangle(q.cx-q.width/2,q.bottom,q.cx+q.width/2,q.bottom+q.height)),.48,northT);
 for(const side of[-1,1]){const x=side<0?x0:x1;const segments=side<0?[[z0,z1]]:[[z0,-23.05],[-20.95,-1.05],[1.05,20.95],[23.05,z1]];for(const[a,bb]of segments){b.box(key('zocalos','conjunto','plinth'),x+side*.27,.52,(a+bb)/2,.11,1.4,bb-a);b.box(key('impostas','conjunto','trim'),x+side*.29,2.01,(a+bb)/2,.16,.18,bb-a);}b.box(key('cornisas','conjunto','trim'),x+side*.30,eave,0,.22,.22,length+.3);for(const z of frameZ)b.box(key('pilastras-ladrillo','conjunto','brick'),x+side*.27,6.34,z,.14,8.6,.48);}
 for(const q of sideWindows){const t=new THREE.Matrix4().makeRotationY(PI/2);t.setPosition(x0-.35,0,0);archTrim(b,key('arcos-ladrillo','estructura','brick'),q.cx,q.bottom,q.width,q.height,.23,.11,t);const g=new THREE.Matrix4().makeRotationY(PI/2);g.setPosition(x0,0,0);glazing(b,'ventanales-sur',arch(q.cx,q.bottom,q.width,q.height),g,{archWindow:q,period:'estructura'});windows.push({...q,type:'south',x:x0,z:-q.cx,physicalVoid:true});}
 // Rehabilitated white concrete skeleton and retained longitudinal galleries.
 const northFloors=[floorY,2.62,5.06],northCeiling=7.50,southFloor=5.18;
 for(const x of[southX,northX])for(const z of frameZ.slice(1,-1)){b.box(key('pilares','estructura','concrete'),x,5.25,z,.46,10.5,.52);b.box(key('basas-pilares','estructura','plinth'),x,1.02,z,.49,1.7,.55);columns.push({x,z,height:10.5});}
 const rail=(bb,x,y,a,zz1,component='barandillas')=>{bb.box(key(component,'memoria','steel'),x,y+1.05,(a+zz1)/2,.06,.06,zz1-a);for(let z=a;z<=zz1;z+=1.18)bb.box(key(component,'memoria','steel'),x,y+.54,z,.045,1.06,.045);for(let z=a;z<=zz1;z+=.19)bb.box(key(component,'memoria','steel'),x,y+.52,z,.015,.95,.015);};
 for(const y of[2.62,5.06,7.50]){const slabOutline=rectangle(northX+.13,-z1+.30,x1-.13,-z0-.30),slabHoles=y<7?[rectangle(x1-2.65,-(z1-6)-2.35,x1-.35,-(z1-6)+2.35)]:[],slab=new THREE.ExtrudeGeometry(shapeOf(slabOutline,slabHoles),{depth:.24,bevelEnabled:false});slab.rotateX(-PI/2);slab.translate(0,y-.24,0);ub.geom(key('forjados-norte','estructura','concrete'),slab);slab.dispose();gallerySlabs.push({side:'north',y,range:[northX,x1],floor:y===2.62?1:y===5.06?2:3});for(const z of frameZ.slice(1,-1)){const end=y<7&&Math.abs(z-(z1-6))<2.58?x1-2.65:x1;ub.box(key('vigas-galerias','estructura','concrete'),(northX+end)/2,y-.32,z,end-northX,.40,.46);}if(y<7)rail(ub,northX+.04,y,z0+.8,z1-.8);}
 ub.box(key('forjado-sur','estructura','concrete'),(southX+x0)/2,southFloor-.12,0,southX-x0-.26,.24,length-.6);gallerySlabs.push({side:'south',y:southFloor,range:[x0,southX],floor:2});rail(ub,southX-.03,southFloor,z0+.8,z1-.8);for(const z of frameZ.slice(1,-1))ub.box(key('vigas-galerias','estructura','concrete'),(southX+x0)/2,southFloor-.32,z,southX-x0,.40,.46);
 for(const x of[southX,northX])b.box(key('vigas-altas','estructura','concrete'),x,10.35,0,.54,.46,length-.5);
 // Metal roof: open triangles with alternating diagonals, not opaque wedges.
 for(const z of frameZ){const k=key('cerchas','estructura','steel');b.beam(k,[x0+.25,10.48,z],[x1-.25,10.48,z],.13,.15);b.beam(k,[x0+.25,eave,z],[0,eave+rise-.08,z],.15,.14);b.beam(k,[0,eave+rise-.08,z],[x1-.25,eave,z],.15,.14);for(let j=0;j<8;j++){const a=x0+.25+j*(width-.5)/8,aa=x0+.25+(j+1)*(width-.5)/8,yy=x=>eave+(rise-.08)*(1-Math.abs(x)/(width/2-.25));b.beam(k,[a,10.48,z],[aa,yy(aa),z],.065,.065);b.beam(k,[aa,10.48,z],[aa,yy(aa),z],.055,.055);}trusses.push({z,x0,x1,eave,rise});}
 for(const side of[-1,1]){const a=[side*(width/2+.22),eave, z0-.32],bb=[side*(width/2+.22),eave,z1+.32],cc=[0,eave+rise,z1+.32],d=[0,eave+rise,z0-.32],p=[];quad(p,a,bb,cc,d);rb.raw(key('cubierta','estructura','roof'),p);for(let x=.4;x<width/2;x+=1.8)b.box(key('correas','estructura','steel'),side*x,eave+rise*(1-x/(width/2))-.08,0,.08,.12,length);}
 rb.box(key('cumbrera','estructura','roof'),0,eave+rise+.04,0,.14,.13,length+.7);
 // A 34 m low north annex and two contemporary concrete stair/lift towers are
 // photo-visible. Their interior circulation is interpretative, not surveyed.
 const annex={x0:10.05,x1:14.36,z0:-19.10,z1:19.40,height:3.45},towerZ=[-24.0,24.0];
 b.box(key('anexo','memoria','floor'),(annex.x0+annex.x1)/2,floorY-.06,.15,annex.x1-annex.x0,.12,annex.z1-annex.z0);
 for(const z of[annex.z0,annex.z1])b.box(key('anexo','memoria','masonry'),(annex.x0+annex.x1)/2,1.7,z,annex.x1-annex.x0,3.4,.25);
 const annexT=new THREE.Matrix4().makeRotationY(PI/2);annexT.setPosition(annex.x1-.13,0,0);const annexHoles=Array.from({length:6},(_,i)=>rectangle(-14+i*5,1.0,-11.4+i*5,2.7));wall(b,key('anexo','memoria','masonry'),rectangle(-annex.z1,0,-annex.z0,3.4),annexHoles,.26,annexT);for(const q of annexHoles)pane(b,key('ventanas-anexo','memoria','glass'),q,annexT);rb.box(key('cubierta-anexo','memoria','roof'),(annex.x0+annex.x1)/2,3.48,.15,annex.x1-annex.x0+.35,.16,annex.z1-annex.z0+.35);
 for(const cz of towerZ){const cx=x1+2.5,w=4.7,d=4.7,h=11.5;for(const xx of[cx-w/2,cx+w/2])b.box(key('torres-acceso','memoria','concrete'),xx,h/2,cz,.24,h,d);for(const zz of[cz-d/2,cz+d/2])b.box(key('torres-acceso','memoria','concrete'),cx,h/2,zz,w,h,.24);rb.box(key('cubiertas-torres','memoria','roof'),cx,h+.08,cz,w+.18,.16,d+.18);for(let y=1.9;y<h;y+=2.2)for(const zz of[cz-d/2-.13,cz+d/2+.13])b.box(key('juntas-torres','memoria','joint'),cx,y,zz,w,.026,.012);}
 // Readable stair in the north side, adjacent to the service side. Slabs are
 // cut around its footprint so every landing has an actual clear opening.
 const stairX=x1-1.5,stairZ=z1-6,stairWidth=2.2,run=4.7;
 for(let level=0;level<2;level++){const y0=northFloors[level],y1=northFloors[level+1],steps=14;for(let j=0;j<steps;j++){const y=y0+(j+1)*(y1-y0)/steps,z=level===0?stairZ-run/2+(j+.5)*run/steps:stairZ+run/2-(j+.5)*run/steps;ub.box(key('escalera','memoria','steel'),stairX,y-.055,z,stairWidth,.11,run/steps+.015);}for(const dx of[-stairWidth/2,stairWidth/2])ub.beam(key('pasamanos','memoria','steel'),[stairX+dx,y0+1.05,stairZ+(level===0?-1:1)*run/2],[stairX+dx,y1+1.05,stairZ+(level===0?1:-1)*run/2],.045,.045);stairs.push({floor:level,x:stairX,z:stairZ,from:y0,to:y1,width:stairWidth,run,interpretivePosition:true});}
 // Existing storage shelves are shown as original-type shelving, not an
 // invented inventory. Museum display cases are schematic furniture only.
 for(const z of[-19,-9,1,11]){const x=x0+1.05,k=key('estanterias','oficios','dark');for(const dx of[-.42,.42])for(const dz of[-1.8,1.8])b.box(k,x+dx,2.15,z+dz,.055,3.8,.055);for(let y=.4;y<4.1;y+=.78)b.box(key('baldas','oficios','wood'),x,y,z,.95,.06,3.7);shelves.push({x,z,width:.95,length:3.7,originalType:true,locationInterpretive:true});}
 const exhibits=[];
 for(const [floor,y]of northFloors.entries())for(const z of[-20,-7,6,17]){const bb=floor===0?b:ub,x=6.55;bb.box(key('soportes-expositivos','memoria','display'),x,y+.54,z,1.25,1.08,2.45);bb.box(key('vitrinas','memoria','glass'),x,y+1.11,z,1.28,.1,2.48);exhibits.push({floor,x,z,furnitureOnly:true,interpretiveLayout:true});}
 for(const z of[-15,4,18]){b.box(key('paneles-memoria','memoria','display'),-6.65,1.5,z,1.9,2.6,.13);b.box(key('paneles-memoria','memoria','steel'),-6.65,.28,z,2.1,.18,.48);}
 for(const z of frameZ.slice(1,-1)){b.cylinder(key('luminarias','memoria','lamp'),0,10.12,z,.12,.22,.20,12);b.beam(key('suspensiones','memoria','cable'),[0,10.3,z],[0,12.65,z],.012,.012);}
 for(const z of[-19,0,19]){const light=new THREE.PointLight('#e4ebe6',12,24,1.6);light.position.set(0,8,z);light.name='Museo Industrial · luz de lectura del espacio';group.add(light);}
 b.finish(permanent,resources,textures);rb.finish(roof,resources,textures);ub.finish(upper,resources,textures);group.updateMatrixWorld(true);
 const meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});const bounds=new THREE.Box3().setFromObject(group),state={sectionOpen:false,readingMode:'realistic',selected:null};
 const definitions=[
 ['conjunto','La nave de Efectos y Repuestos',[0,5,0],[-52,48,68],[-37,34,49],['testeros','muro-sur','cubierta'],'conjunto',false,false,null,48],
 ['fachada','El testero y el acceso',[0,6,z1],[-19,12,38],[-14,8.5,27],['testeros','portones','arcos-ladrillo','remates-testero'],'envolvente',false,false,null,55],
 ['acceso','Del almacén al museo',[0,2.6,z1],[-1,1.1,14],[-.6,.7,9],['portones','hojas-puerta','testeros'],'conjunto',false,false,null,62],
 ['nave-central','La nave central a toda altura',[0,4.9,-1],[0,-3.05,23],[.4,-3.05,17],['pilares','cerchas','suelo-vidrio','vigas-altas'],'conjunto',false,true,0,71],
 ['via','Los carriles bajo el vidrio',[0,trackY+.2,2],[.6,3.0,7],[.4,2.8,4.8],['carriles','traviesas','balasto','suelo-vidrio'],'oficios',false,true,0,64],
 ['andenes','Los andenes de carga',[southX,.45,-7],[2.4,1.5,8],[2.0,1.2,5.5],['andenes','solera-andenes','bastidores-vidrio'],'oficios',false,true,0,62],
 ['cerchas','La cubierta sobre el vacío',[0,11.6,-8],[0,-8.1,13],[.5,-7.9,9],['cerchas','correas','vigas-altas'],'estructura',false,true,0,68],
 ['pilares','Los pórticos de hormigón',[northX,4.4,-10],[-2.3,-2.55,8],[-2.1,-2.55,5.6],['pilares','basas-pilares','vigas-galerias'],'estructura',false,true,0,62],
 ['cubierta','La gran cubierta a dos aguas',[0,11.5,0],[-39,29,44],[-28,21,32],['cubierta','cumbrera','cerchas'],'envolvente',false,false,null,50],
 ['ventanas','La luz en la fachada sur',[x0,5.8,-3],[-8.5,3.5,5],[-6.3,2.0,3.5],['ventanales-sur','arcos-ladrillo','muro-sur'],'envolvente',false,false,null,58],
 ['estanterias','El almacén de repuestos',[x0+1.05,2.1,-9],[3.1,-.2,6],[2.6,-.2,4],['estanterias','baldas'],'oficios',false,true,0,62],
 ['planta-primera','Primera galería norte',[6.4,3.9,-5],[0,.35,9],[0,.35,6.2],['forjados-norte','barandillas','soportes-expositivos'],'memoria',false,true,1,65],
 ['planta-segunda','Segunda galería norte',[6.4,6.4,-4],[0,.35,8],[0,.35,6.2],['forjados-norte','barandillas','soportes-expositivos'],'memoria',false,true,2,65],
 ['escalera','La circulación entre niveles',[stairX,3.4,stairZ],[-.6,-1.55,-7],[-.4,-1.55,-5.8],['escalera','pasamanos','forjados-norte'],'estructura',false,true,0,65],
 ['memoria','Un espacio para la memoria obrera',[-6.3,2.0,4],[1.0,0,8],[.5,0,5.5],['paneles-memoria','pilares','solera-andenes'],'memoria',false,true,0,65],
 ['siderurgia','La historia de la ciudad factoría',[6.4,1.6,6],[1.0,.25,7],[.7,.25,4.8],['soportes-expositivos','vitrinas','pilares'],'memoria',false,true,0,65],
 ['ferroviario','El ferrocarril atravesaba el almacén',[0,2.5,-16],[0,-.65,13],[.3,-.65,9],['carriles','suelo-vidrio','andenes'],'oficios',false,true,0,69],
 ['rehabilitacion','El cuerpo de servicios y los nuevos accesos',[x1+2.4,4,0],[29,18,29],[21,13,21],['anexo','torres-acceso','cubiertas-torres'],'memoria',false,false,null,53],
 ['seccion','Una sección para leer el almacén',[0,4,0],[-42,53,49],[-31,39,36],['andenes','pilares','cerchas','carriles'],'estructura',true,false,null,51],
 ['entorno','Museo, Gerencia y ciudad',[0,4,0],[-78,60,80],[-56,43,58],['testeros','anexo','cubierta'],'conjunto',false,false,null,50]
 ];
 const focuses={};for(const[short,label,targetLocal,offset,closeOffset,components,period,requiresSection,interiorView,floor,fov]of definitions){const id='museo-industrial-'+short,target=new THREE.Vector3(...world3(...targetLocal));focuses[id]={id,label,target,localTarget:targetLocal.slice(),elevation:targetLocal[1],coordinates:geo({x:target.x,z:target.z}),offset:rotate(offset),closeOffset:rotate(closeOffset),components,regionId:period,readingLayer:period,period,requiresSection,interiorView,floor,fov,kind:short==='conjunto'?'overview':'feature',bounds:new THREE.Box3(target.clone().addScalar(-2),target.clone().addScalar(2)),fitBounds:false,minDistance:interiorView?.3:.7,closeScale:false,sourceConfidence:'documented-structure-photographic-proportions'};}
 focuses['museo-industrial-conjunto'].bounds=bounds.clone();focuses['museo-industrial-conjunto'].fitBounds=true;
 const component=(id,label,period,p,kind,extra={})=>({id,label,period,readingLayer:period,coordinates:geoPoly(p),kind,interpretive:true,...extra});
 const plan={id:'museo-industrial',label:'Museo Industrial · plantas y sección',coordinate,outline,frame:{coordinate,x:origin.x,z:origin.z,yaw,baseY:base},documentedMetrics:MUSEO_INDUSTRIAL_METRICS,floors:[{id:0,label:'Planta baja',elevation:base+floorY},{id:1,label:'Primera galería norte',elevation:base+northFloors[1]},{id:2,label:'Segunda galería norte',elevation:base+northFloors[2]}],crossSection:{label:'Sección transversal interpretativa',width,height:eave+rise,eave,ridge:eave+rise,x0,x1,floorY,trackY,galleries:[{x0,x1:southX,levels:[floorY,southFloor]},{x0:northX,x1,levels:[...northFloors,northCeiling]}],heightSurvey:false},components:[component('hall','Nave central','conjunto',poly(southX,z0,northX,z1),'hall',{floor:0}),component('anden-sur','Andén sur','oficios',poly(x0,z0,southX,z1),'platform',{floor:0}),component('anden-norte','Andén norte','oficios',poly(northX,z0,x1,z1),'platform',{floor:0}),...northFloors.slice(1).map((y,i)=>component('galeria-norte-'+(i+1),'Galería norte '+(i+1),'memoria',poly(northX,z0,x1,z1),'gallery',{floor:i+1,elevation:base+y,hiddenWhenSection:true})),component('galeria-sur','Plataforma sur','memoria',poly(x0,z0,southX,z1),'gallery',{floor:2,elevation:base+southFloor,hiddenWhenSection:true}),component('cubierta','Cubierta metálica','envolvente',poly(x0,z0,x1,z1),'roof',{hiddenWhenSection:true}),component('anexo','Anexo norte','memoria',poly(annex.x0,annex.z0,annex.x1,annex.z1),'annex',{floor:0}),...railXs.map((x,i)=>component('rail-'+i,'Carril conservado','oficios',[{x,z:z0+.5},{x,z:z1-.5}],'rail',{floor:0})),...shelves.map((q,i)=>component('shelf-'+i,'Estantería tipológica','oficios',poly(q.x-q.width/2,q.z-q.length/2,q.x+q.width/2,q.z+q.length/2),'shelving',{floor:0})),component('stairs','Escalera · posición interpretativa','estructura',poly(stairX-stairWidth/2,stairZ-run/2,stairX+stairWidth/2,stairZ+run/2),'stairs',{floors:[0,1,2]}),...exhibits.map((q,i)=>component('display-'+i,'Soporte expositivo interpretativo','memoria',poly(q.x-.625,q.z-1.225,q.x+.625,q.z+1.225),'display',{floor:q.floor,hiddenWhenSection:q.floor>0}))],columns:columns.map(q=>({...q,coordinates:geo(world(q.x,q.z))})),openings:{portals,windows},stops:Object.values(focuses).map(q=>({id:q.id,label:q.label,coordinates:q.coordinates,localTarget:q.localTarget,elevation:q.elevation,regionId:q.regionId,readingLayer:q.readingLayer,floor:q.floor,requiresSection:q.requiresSection,interiorView:q.interiorView})),note:'La planta sigue la huella catastral, aproximadamente 60,7 × 20,2 m, distinta de los 70 × 18 m publicados. Tres vanos, vía bajo vidrio, andenes y alturas relativas documentados. Huecos, perfilería, escaleras y mobiliario tienen registro proporcional, no son un levantamiento; vitrinas sin inventario. La sección retira cubiertas y forjados superiores para explicar el almacén.'};
 function repaint(){for(const m of meshes){const d=m.userData,mat=m.material;mat.color.copy(d.baseColor);mat.map=d.baseMap;mat.bumpMap=d.baseBumpMap;if(state.readingMode==='periods'){mat.color.set(COLORS[d.period]||'#b3b4a7');mat.map=null;mat.bumpMap=null;}mat.emissive.set(focuses[state.selected]?.components.includes(d.component)?'#b49a72':'#000000');mat.emissiveIntensity=.045;mat.needsUpdate=true;}}
 const setSection=open=>{state.sectionOpen=!!open;roof.visible=!state.sectionOpen;upper.visible=!state.sectionOpen;return state.sectionOpen;},selectFocus=id=>{state.selected=id&&focuses[id]?id:null;repaint();return focuses[state.selected]||null;},setReadingMode=mode=>{state.readingMode=mode==='periods'?'periods':'realistic';repaint();return state.readingMode;};
 const bindGround=sample=>{if(typeof sample!=='function')return;for(const q of Object.values(focuses)){if(q.interiorView)continue;for(const field of['offset','closeOffset']){const o=q[field],h=sample(q.target.x+o[0],q.target.z+o[2]);if(Number.isFinite(h)&&q.target.y+o[1]<h+1.7)o[1]=h+1.7-q.target.y;}}};
 const stats={modelVersion:'v24',meshes:meshes.length,triangles:meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count/3,0),bays:3,stops:20,portals:portals.length,largeWindowVoids:16,allWindowVoids:windows.length,openTrusses:trusses.length,columns:columns.length,northVisitorFloors:3,resourcesOwned:true,interpretiveGeometry:true,mappedEnvelopeMetres:[width,length],documentedEnvelopeMetres:[18,70]};
 const qa={baseY:base,frame:{x:origin.x,z:origin.z,yaw},width,length,floorY,trackY,portals,windows,columns,trusses,gallerySlabs,stairs,shelves,railXs,northFloors,southFloor,annex,towerZ,documentedMetrics:MUSEO_INDUSTRIAL_METRICS,heightSurvey:false,exhibitionInventoryReconstructed:false,section:{removes:'roofs, upper gallery slabs, gallery rails, stair and upper furniture',retains:'ground floor, rail channel, original-type shelving, masonry, concrete piers and open roof trusses'}};
 const visit={focuses,bounds,plan,stats,qa,periods:museoIndustrialPeriods,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({...state}),sectionAvailable:true,metadata:{model:'documented-interpretation',sourcePlan:'Catastro8335601YJ3983S and PNOA; Fundació museum/portfolio; official2022 and2026 interior photos',current:'Three-bay warehouse with preserved railway under glass, asymmetric galleries and contemporary access bodies.',section:'Digital inspection removes roof and upper floors together with their furniture. It preserves structure and the ground floor, without floating display cases.',dimensions:'70×18m nominal dimensions conflict with the60.7×20.2m cadastral envelope. The one-metre historic platforms are documented. Published south-platform heights differ between5m and6m without a verified common datum; this model places its slab5m above the current visitor floor as an interpretation. The current visitor floor is raised over the railway.',interiorSurvey:false,collection:'Only original-type storage and unlabelled schematic museum furniture; no claim to current inventory or display placement.',terrain:'Rail channel model excavated only beneath its existing building footprint.'},renderStops:['museo-industrial-conjunto','museo-industrial-fachada','museo-industrial-nave-central','museo-industrial-via','museo-industrial-planta-segunda','museo-industrial-seccion']};
 group.userData={id:'museo-industrial',landmarkId:'museo-industrial',visit,resources,ownedResources:resources,interpretation:true};setSection(false);repaint();const point=focuses['museo-industrial-conjunto'].target.clone(),views={offset:focuses['museo-industrial-conjunto'].offset,closeOffset:focuses['museo-industrial-conjunto'].closeOffset};
 return{id:'museo-industrial',group,point,views,view:{target:point.clone(),...views},visit,roof,setSection,stats,patches:[{polygon:outline.map(p=>project(...p)),height:base-1.04}],exclusions:[outline.map(p=>project(...p)),poly(annex.x0,annex.z0,annex.x1,annex.z1).map(p=>world(p.x,p.z)),...towerZ.map(z=>poly(x1+.15,z-2.35,x1+4.85,z+2.35).map(p=>world(p.x,p.z)))],excludedBuildingIds:[],excludedRoadIds:[]};
}
