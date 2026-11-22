import * as THREE from 'three';

// Architectural reading of the conserved / rehabilitated theatre. Metric
// proportions: Hernández et al., CAR 2 (1993); current shell: Grassi / Portaceli
// (1990–1993). Plan registration uses the supplied OSM trace and IGN PNOA.
// This is a documented interpretive model, not a new archaeological survey.
const PI=Math.PI,TAU=PI*2;
const CENTER=[-.27795671425,39.67686986465],YAW=-.5027;
const LON_SCALE=111320*Math.cos(39.679*PI/180);
const noise=n=>{const f=Math.sin(n*127.13+43.7)*43758.5453;return f-Math.floor(f);};
const PERIODS=[
 {id:'ancient',label:'Restos romanos identificables',color:'#d6bd8b'},
 {id:'contemporary',label:'Rehabilitación contemporánea',color:'#77b8c7'},
 {id:'mixed',label:'Fábrica conservada y consolidada',color:'#be98d6'},
 {id:'interpretation',label:'Esquema arqueológico interpretado',color:'#929ba0'}
];
const COLORS=Object.fromEntries(PERIODS.map(p=>[p.id,p.color]));
const COMPONENTS={
 'teatro-conjunto':[],
 'teatro-aditus-oriental':['aditus-oriental'],
 'teatro-orchestra':['orchestra','proedria'],
 'teatro-ima-cavea':['ima-cavea'],
 'teatro-media-cavea':['media-cavea'],
 'teatro-summa-cavea':['summa-cavea'],
 'teatro-vomitoria':['vomitoria'],
 'teatro-portico':['portico','segundo-anillo'],
 'teatro-tribunalia':['tribunalia'],
 'teatro-proscaenium':['proscaenium'],
 'teatro-frons-scaenae':['frons-scaenae','fragmentos'],
 'teatro-basilicas':['basilicas'],
 'teatro-hyposcaenium':['hyposcaenium','aulaeum'],
 'teatro-cloaca':['cloaca'],
 'teatro-restauracion':['cubierta','frons-scaenae'],
 'teatro-vivo':['proscaenium','orchestra']
};
// The point of interest is separate from a fit box: focused views can look at
// one side of a component without framing the full 80 m wide theatre.
const STOPS=[
 ['teatro-conjunto','El teatro en su paisaje','conjunto',0,10,8,46],
 ['teatro-aditus-oriental','Aditus oriental','cavea',29,-1,2.2,8],
 ['teatro-orchestra','Orchestra y asientos senatoriales','cavea',0,3,.7,12],
 ['teatro-ima-cavea','Ima cavea','cavea',-7,12,3.3,12],
 ['teatro-media-cavea','Media cavea','cavea',0,21,7.8,14],
 ['teatro-summa-cavea','Summa cavea','cavea',-11,27,12.5,15],
 ['teatro-vomitoria','Vomitorios y circulación','cavea',22,24,11.6,9],
 ['teatro-portico','Pórtico superior y segundo anillo','cavea',0,37,17,18],
 ['teatro-tribunalia','Tribunalia','cavea',22,1,6.2,9],
 ['teatro-proscaenium','Proscaenium','escena',0,-6.2,1.7,25],
 ['teatro-frons-scaenae','Frente escénico','escena',0,-11,9.5,28],
 ['teatro-basilicas','Basílicas laterales','escena',31,-12,7,11],
 ['teatro-hyposcaenium','Foso del escenario','subsuelo',-10,-5,-2.5,13],
 ['teatro-cloaca','Cloaca central','subsuelo',0,-4,-3.5,6],
 ['teatro-restauracion','La intervención de 1990–1993','presente',-14,-9,14,31],
 ['teatro-vivo','Un teatro vivo','presente',0,7,4,34]
];

function stoneTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#a49a84';ctx.fillRect(0,0,512,512);
 for(let row=0;row<20;row++)for(let col=-1;col<13;col++){
  const seed=row*31+col,v=noise(seed+99),x=col*43+(row%2?21:0),y=row*26;
  ctx.fillStyle='hsl(38, '+(10+v*12)+'%, '+(43+v*24)+'%)';ctx.fillRect(x+1,y+1,40,23);
  ctx.fillStyle='rgba(236,220,184,.18)';ctx.fillRect(x+1,y+1,40,2);
 }
 for(let i=0;i<4500;i++){ctx.fillStyle=i%2?'rgba(47,43,33,.07)':'rgba(245,234,206,.1)';ctx.fillRect(noise(i+14)*512,noise(i+93)*512,1+noise(i)*2,1);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
const MATERIALS={
 masonry:{color:'#b3a081',roughness:1,map:true},
 limestone:{color:'#dcd4bd',roughness:.87},
 edge:{color:'#eee6cf',roughness:.82},
 paving:{color:'#c6b99d',roughness:1},
 concrete:{color:'#b5aa94',roughness:.97},
 brick:{color:'#b59b7f',roughness:1,map:true},
 roof:{color:'#6d716b',roughness:.83,metalness:.18},
 metal:{color:'#434c48',roughness:.65,metalness:.45},
 timber:{color:'#ad9675',roughness:.91},
 archaeology:{color:'#baaa8d',roughness:1,map:true}
};
class Batch{
 constructor(){this.parts=new Map();this.boxGeo=new THREE.BoxGeometry(1,1,1).toNonIndexed();}
 key(component,period,kind){return component+'|'+period+'|'+kind;}
 geometry(key,g,transform=new THREE.Matrix4(),tint=1){
  const n=g.index?g.toNonIndexed():g;if(!n.attributes.normal)n.computeVertexNormals();
  let batch=this.parts.get(key);if(!batch){batch={p:[],n:[],u:[],c:[]};this.parts.set(key,batch);}
  const p=n.attributes.position,no=n.attributes.normal,v=new THREE.Vector3(),norm=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(transform);
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(transform);norm.fromBufferAttribute(no,i).applyMatrix3(nm).normalize();
   batch.p.push(v.x,v.y,v.z);batch.n.push(norm.x,norm.y,norm.z);
   const ax=Math.abs(norm.x),ay=Math.abs(norm.y),az=Math.abs(norm.z);
   batch.u.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/3.8,(ay>ax&&ay>az?v.z:v.y)/3.8);
   batch.c.push(tint,tint,tint);
  }
  if(n!==g)n.dispose();
 }
 box(key,x,y,z,w,h,d,yaw=0,tint=1){
  if(w<=0||h<=0||d<=0)return;
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(w,h,d));this.geometry(key,this.boxGeo,m,tint);
 }
 raw(key,p,tint=1){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geometry(key,g,new THREE.Matrix4(),tint);g.dispose();}
 finish(group){
  const texture=stoneTexture(),materials=[];
  for(const[key,b]of this.parts){
   const[component,period,kind]=key.split('|'),def=MATERIALS[kind];
   const mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness||0,map:def.map?texture:null,vertexColors:true});mat.name='Teatro · '+component+' · '+kind;
   materials.push(mat);const geo=new THREE.BufferGeometry();
   for(const[name,values,size]of[['position',b.p,3],['normal',b.n,3],['uv',b.u,2],['color',b.c,3]])geo.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
   geo.computeBoundingBox();geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,mat);mesh.name=mat.name;mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={theatreFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map};group.add(mesh);
  }
  this.boxGeo.dispose();return{materials,textures:[texture]};
 }
}
function quad(out,a,b,c,d){out.push(...a,...b,...c,...a,...c,...d);}
function arc(batch,key,r0,r1,y0,y1,a0=0,a1=PI,steps=48,tint=1){
 const p=[],at=(r,y,a)=>[Math.cos(a)*r,y,Math.sin(a)*r];
 for(let i=0;i<steps;i++){
  const a=a0+(a1-a0)*i/steps,b=a0+(a1-a0)*(i+1)/steps;
  quad(p,at(r0,y1,a),at(r0,y1,b),at(r1,y1,b),at(r1,y1,a));
  quad(p,at(r0,y0,b),at(r0,y0,a),at(r1,y0,a),at(r1,y0,b));
  quad(p,at(r0,y0,a),at(r0,y0,b),at(r0,y1,b),at(r0,y1,a));
  quad(p,at(r1,y0,b),at(r1,y0,a),at(r1,y1,a),at(r1,y1,b));
  if(i===0)quad(p,at(r1,y0,a),at(r0,y0,a),at(r0,y1,a),at(r1,y1,a));
  if(i===steps-1)quad(p,at(r0,y0,b),at(r1,y0,b),at(r1,y1,b),at(r0,y1,b));
 }
 batch.raw(key,p,tint);
}
function segmentIntervals(start,end,cuts){
 let intervals=[[start,end]];for(const[a,b]of cuts){const next=[];for(const[x,y]of intervals){if(b<=x||a>=y)next.push([x,y]);else{if(a>x)next.push([x,a]);if(b<y)next.push([b,y]);}}intervals=next;}return intervals;
}
function wallWithDoors(batch,key,{x=0,z,y0,y1,width,depth,doors}){
 let cursor=-width/2;
 for(const door of [...doors].sort((a,b)=>a.x-b.x)){
  const lo=door.x-door.width/2,hi=door.x+door.width/2;
  if(lo>cursor)batch.box(key,x+(cursor+lo)/2,(y0+y1)/2,z,lo-cursor,y1-y0,depth);
  const top=y0+door.height;if(top<y1)batch.box(key,x+door.x,(top+y1)/2,z,door.width,y1-top,depth);
  cursor=hi;
 }
 if(cursor<width/2)batch.box(key,x+(cursor+width/2)/2,(y0+y1)/2,z,width/2-cursor,y1-y0,depth);
}
// Barrel shell: its axis is local Z. No dark rectangle or end cap closes a door.
function barrel(batch,key,{x,y,z,length,width,height,thickness=.6,yaw=0}){
 const radius=width/2,spring=height-radius,out=[];
 const point=(u,v,w)=>[x+u*Math.cos(yaw)+w*Math.sin(yaw),y+v,z-u*Math.sin(yaw)+w*Math.cos(yaw)];
 const box=(u,v,w,a,b,c)=>batch.box(key,...point(u,v,w),a,b,c,yaw);
 box(-radius-thickness/2,spring/2,0,thickness,spring,length);box(radius+thickness/2,spring/2,0,thickness,spring,length);
 for(let i=0;i<24;i++){
  const a=i*PI/24,b=(i+1)*PI/24;
  const P=(r,t,d)=>point(Math.cos(t)*r,spring+Math.sin(t)*r,d);
  for(const depth of[-length/2,length/2])quad(out,P(radius,a,depth),P(radius,b,depth),P(radius+thickness,b,depth),P(radius+thickness,a,depth));
  quad(out,P(radius,a,-length/2),P(radius,b,-length/2),P(radius,b,length/2),P(radius,a,length/2));
  quad(out,P(radius+thickness,b,-length/2),P(radius+thickness,a,-length/2),P(radius+thickness,a,length/2),P(radius+thickness,b,length/2));
 }
 batch.raw(key,out);
}
function strip(batch,key,a,b,width,height){const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);batch.box(key,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,length,height,width,-Math.atan2(dz,dx));}
const ringPlan=(r0,r1,a0=0,a1=PI,steps=48)=>{const p=[];for(let i=0;i<=steps;i++){const a=a0+(a1-a0)*i/steps;p.push([Math.cos(a)*r1,Math.sin(a)*r1]);}for(let i=steps;i>=0;i--){const a=a0+(a1-a0)*i/steps;p.push([Math.cos(a)*r0,Math.sin(a)*r0]);}return p;};

export function createTheatre({heightAt=()=>0,project=(lon,lat)=>({x:(lon+.278)*LON_SCALE,z:(39.679-lat)*111320}),data={},visitData=data.theatreVisit}={}){
 const group=new THREE.Group();group.name='Teatro romano de Sagunto · estado conservado y rehabilitado';
 const center=project(...CENTER),base=heightAt(center.x,center.z)-.65,c=Math.cos(YAW),s=Math.sin(YAW);
 group.position.set(center.x,base,center.z);group.rotation.y=YAW;
 const localWorld=(x,y,z)=>new THREE.Vector3(center.x+x*c+z*s,base+y,center.z-x*s+z*c);
 const toLocal=(x,z)=>{const dx=x-center.x,dz=z-center.z;return{x:dx*c-dz*s,z:dx*s+dz*c};};
 const geographical=(x,z)=>{const p=localWorld(x,0,z);return[p.x/LON_SCALE-.278,39.679-p.z/111320];};
 const b=new Batch(),K=(component,period,kind)=>b.key(component,period,kind);
 const qa={openings:[],floorSamples:[],seating:[],documentedDimensions:{orchestra:16,withSenatorialSeating:22,imaCavea:34,mediaCavea:49,summaCavea:67,upperPortico:79,stageFront:44,stageDepth:6.4},underground:{representation:'schematic documented archaeological remains; not a surveyed interior',aulaeumCells:16,transverseWalls:17,channelWidth:1.42,ancientStageHeightKnown:false},registeredCenter:CENTER,yaw:YAW};
 const planComponents=[];
 function plan(id,coordinates,kind,period,closed=true){planComponents.push({id,coordinates:coordinates.map(([x,z])=>geographical(x,z)),kind,period,closed,interpretive:period==='interpretation'});}

 // Orchestra: clear diameter 16 m. Two broad senator seating levels occupy the
 // next 3 m of radius. The pale contemporary cover is not labelled Roman marble.
 arc(b,K('orchestra','contemporary','paving'),0,8,-.45,.08,0,PI,80);
 b.box(K('orchestra','contemporary','paving'),0,-.18,-1.5,22,.52,3);
 arc(b,K('proedria','contemporary','limestone'),8,9.35,-.3,.32,0,PI,80);
 arc(b,K('proedria','contemporary','limestone'),9.35,10.8,-.3,.72,0,PI,80);
 arc(b,K('proedria','mixed','masonry'),10.8,11.15,-.4,.85,0,PI,80,.92);
 for(const rr of[8,9.35,10.8])arc(b,K('proedria','contemporary','edge'),rr,rr+.075,.16+(rr-8)*.16,.24+(rr-8)*.16,0,PI,80,.96);
 plan('orchestra',ringPlan(0,8),'orchestra','contemporary');plan('proedria',ringPlan(8,11),'seating','mixed');

 // Three seating orders: 6 / 8 / 9 rows. Their precise profiles and superficial
 // joints remain an interpretation of the 1990s shell, not ancient surviving seats.
 const orders=[
  {id:'ima-cavea',r0:11.15,r1:17,rows:6,start:1.02,rise:.49,sectors:4},
  {id:'media-cavea',r0:18,r1:24.5,rows:8,start:4.60,rise:.51,sectors:6},
  {id:'summa-cavea',r0:25.65,r1:33.5,rows:9,start:9.38,rise:.53,sectors:10}
 ];
 const vomAngles=[PI*.18,PI*.38,PI*.62,PI*.82];
 for(const o of orders){
  const rowDepth=(o.r1-o.r0)/o.rows;
  for(let row=0;row<o.rows;row++){
   const r0=o.r0+row*rowDepth,r1=r0+rowDepth,top=o.start+(row+1)*o.rise;
   const cuts=[];for(let aisle=1;aisle<o.sectors;aisle++){const a=aisle*PI/o.sectors;cuts.push([a-.43/r0,a+.43/r0]);}
   if(o.id==='summa-cavea'&&row<6)for(const a of vomAngles)cuts.push([a-.88/r0,a+.88/r0]);
   for(const[a,z]of segmentIntervals(.012,PI-.012,cuts)){
    const steps=Math.max(2,Math.ceil((z-a)*r1/1.15));
    arc(b,K(o.id,'contemporary','limestone'),r0,r1,Math.max(-.6,top-2.1),top,a,z,steps,.95+noise(row*31+steps)*.055);
    arc(b,K(o.id,'contemporary','edge'),r0,r0+.075,top-.09,top+.015,a,z,steps,.97);
   }
   qa.seating.push({order:o.id,row,radius:r0,top});
  }
  for(let aisle=1;aisle<o.sectors;aisle++){
   const a=aisle*PI/o.sectors;
   for(let row=0;row<o.rows*2;row++){
    const radius=o.r0+(row+.5)*rowDepth/2,y=o.start+(row+1)*o.rise/2;
    if(o.id==='summa-cavea'&&row<12&&vomAngles.some(v=>Math.abs(v-a)<1.2/radius))continue;
    b.box(K(o.id,'contemporary','edge'),Math.cos(a)*radius,y-.12,Math.sin(a)*radius,.84,.24,rowDepth/2+.025,PI/2-a,.94);
   }
  }
  plan(o.id,ringPlan(o.r0,o.r1),'seating','contemporary');
 }
 // Annular praecinctiones are continuous walking ledges. Access gaps in the
 // upper order lead into genuine open-ended channels rather than painted doors.
 arc(b,K('ima-cavea','contemporary','paving'),17,18,3.85,4.55,0,PI,100,.92);
 arc(b,K('media-cavea','contemporary','paving'),24.5,25.65,8.05,9.15,0,PI,110,.91);
 arc(b,K('summa-cavea','contemporary','paving'),33.5,34.7,13.55,14.35,0,PI,120,.91);
 for(const a of vomAngles){
  const rr=27.9,y=9.15,ax=Math.cos(a),az=Math.sin(a),yaw=PI/2-a;
  b.box(K('vomitoria','mixed','masonry'),ax*rr,y+.13,az*rr,1.75,.26,5.6,yaw,.84);
  for(const side of[-1,1])b.box(K('vomitoria','mixed','masonry'),ax*rr+Math.cos(a+PI/2)*side*1.12,y+1.4,az*rr+Math.sin(a+PI/2)*side*1.12,.48,2.8,5.6,yaw,.91);
  // Short cover at the back, with a clear 2.3 m opening underneath.
  b.box(K('vomitoria','mixed','masonry'),ax*30.2,y+2.85,az*30.2,2.72,.45,1.1,yaw,.89);
  qa.openings.push({id:'vomitorium-'+qa.openings.length,kind:'vomitorium',localOrigin:[ax*25.55,y+1.8,az*25.55],localDirection:[ax,0,az],distance:5.1,width:1.5,height:2.1});
  plan('vomitorium-'+a,[[ax*25.6+az*.8,az*25.6-ax*.8],[ax*30.8+az*.8,az*30.8-ax*.8],[ax*30.8-az*.8,az*30.8+ax*.8],[ax*25.6-az*.8,az*25.6+ax*.8]],'path','mixed');
 }

 // Upper enclosure. The central interruption and two lateral wings follow the
 // current mapped silhouette. No complete conjectural ancient colonnade is added.
 arc(b,K('portico','mixed','masonry'),37.2,38.6,14.0,17.65,.025,PI-.025,130,.94);
 arc(b,K('portico','contemporary','edge'),37.1,38.7,17.65,17.90,.025,PI-.025,130,.95);
 for(const side of[-1,1]){
  const a0=side>0?.03:PI/2+.06,a1=side>0?PI/2-.06:PI-.03;
  for(let i=0;i<4;i++)arc(b,K('portico','contemporary','limestone'),34.7+i*.6,35.3+i*.6,13.6,14.65+i*.48,a0,a1,60,.95);
 }
 // Mapped second-ring flanks stop at the real central interruption. Their
 // elevation is simplified; exposed masonry is explicitly labelled mixed fabric.
 for(const[a0,a1]of[[0,.31*PI],[.69*PI,PI]]){
  arc(b,K('segundo-anillo','mixed','masonry'),40.4,42.7,-4.9,13.6,a0,a1,44,.91);
  arc(b,K('segundo-anillo','mixed','paving'),38.65,40.4,12.9,13.72,a0,a1,44,.88);
  arc(b,K('segundo-anillo','mixed','edge'),40.3,42.8,13.6,13.84,a0,a1,44,.92);
 }
 // Lower peripheral retaining fabric is modelled only below the seating shell.
 arc(b,K('soporte-cavea','mixed','masonry'),37.0,38.65,-5.4,14.15,0,PI,120,.91);
 plan('portico',ringPlan(34.7,38.6),'wall','mixed');
 for(const[a0,a1]of[[0,.31*PI],[.69*PI,PI]])plan('segundo-anillo',ringPlan(38.6,42.7,a0,a1),'wall','mixed');

 // The aditus maximi are actual barrel passages; neither endpoint is capped.
 // They lead horizontally from each flank to the orchestra, below the tribunalia.
 for(const sign of[-1,1]){
  const component=sign>0?'aditus-oriental':'aditus-occidental';
  barrel(b,K(component,'mixed','masonry'),{x:sign*24.4,y:.12,z:-.8,length:25.8,width:3.8,height:4.65,thickness:.8,yaw:PI/2});
  b.box(K(component,'contemporary','paving'),sign*24.4,-.02,-.8,25.8,.23,3.8);
  b.box(K('tribunalia','contemporary','limestone'),sign*23.3,5.48,-.8,17.8,.7,5.6);
  for(let i=0;i<3;i++)b.box(K('tribunalia','contemporary','limestone'),sign*(17.2+i*1.15),5.8+i*.38,-.8,1.12,.4,5.2,0,.95);
  for(const zz of[-3.48,1.9])b.box(K('tribunalia','mixed','masonry'),sign*24,6.05,zz,20.2,.85,.45);
  qa.openings.push({id:component,kind:'aditus',localOrigin:[sign*37.6,2,-.8],localDirection:[-sign,0,0],distance:26.7,width:3.8,height:4.65});
  plan(component,[[sign*11.5,-2.7],[sign*37.3,-2.7],[sign*37.3,1.1],[sign*11.5,1.1]],'path','mixed');
 }

 // Current scenic body. A 52.75 m external wall is a different measurement from
 // the 44 m stage front. Pier / lintel geometry leaves the three doorways open.
 const stageKey=K('proscaenium','contemporary','timber');
 b.box(stageKey,0,1.1,-6.2,44,.34,6.4);
 for(let i=0;i<88;i++)b.box(K('proscaenium','contemporary','edge'),-21.75+i*.5,1.277,-6.2,.012,.008,6.35,0,.73);
 // A solid stage edge would hide the documented curtain trench when sectioned;
 // only its shallow modern facing follows the stage in the cutaway group.
 b.box(stageKey,0,.73,-2.94,44,.8,.18);
 const doors=[{x:-15.9,width:2.5,height:4.9},{x:0,width:3.35,height:6.35},{x:15.9,width:2.5,height:4.9}];
 wallWithDoors(b,K('frons-scaenae','contemporary','brick'),{z:-11.05,y0:1.25,y1:17.0,width:52.75,depth:1.5,doors});
 for(const d of doors){
  for(const sign of[-1,1])b.box(K('frons-scaenae','contemporary','limestone'),d.x+sign*(d.width/2+.18),1.25+d.height/2,-10.19,.36,d.height,.26);
  b.box(K('frons-scaenae','contemporary','limestone'),d.x,1.25+d.height+.15,-10.18,d.width+.72,.3,.28);
  qa.openings.push({id:'scene-door-'+d.x,kind:'scenic-door',localOrigin:[d.x,3,-9.9],localDirection:[0,0,-1],distance:2.7,width:d.width,height:d.height});
 }
 // Lower foundation remnants retain an irregular top edge. This fragmentary
 // strip never grows into a conjectural three-storey Roman scenic facade.
 for(let i=0;i<24;i++){
  const x=-25.6+i*2.2;if(doors.some(d=>Math.abs(x-d.x)<d.width/2+1))continue;
  const h=.65+noise(i+33)*1.15;b.box(K('frons-scaenae','ancient','masonry'),x,1.2+h/2,-10.04,2.08,h,.42,0,.89+noise(i)*.08);
 }
 b.box(K('frons-scaenae','contemporary','limestone'),0,17.18,-11.05,53.5,.36,2.0);
 // Rear service passage remains open above its low parapet. It is not an
 // invented porticus post scaenam, for which the archaeological study has no proof.
 b.box(K('escena-posterior','contemporary','paving'),0,-1.6,-18,52.75,.38,9.7);
 wallWithDoors(b,K('escena-posterior','mixed','masonry'),{z:-22.7,y0:-7.2,y1:1.8,width:53.95,depth:1.7,doors:[{x:0,width:2.6,height:4.3}]});
 b.box(K('escena-posterior','contemporary','edge'),0,2,-22.7,54.2,.4,1.85);

 // The two present-day end masses follow the asymmetric mapped outline; flat
 // roofs and technical apertures belong to the contemporary intervention.
 for(const spec of[{x:-31.9,z:-23.3,w:10.3,d:12.4,h:18.7},{x:25.05,z:-16.7,w:4.0,d:12.6,h:18.0}]){
  const{x,z,w,d,h}=spec,k=K('basilicas','contemporary','brick');
  wallWithDoors(b,k,{x,z:z+d/2,y0:-4,y1:h,width:w,depth:.85,doors:[{x:0,width:Math.min(2.2,w-1.1),height:7.4}]});
  b.box(k,x,(-4+h)/2,z-d/2,w,h+4,.8);
  for(const sign of[-1,1])b.box(k,x+sign*(w/2-.42),(-4+h)/2,z,.85,h+4,d);
  b.box(K('basilicas','contemporary','limestone'),x,h+.22,z,w+.3,.45,d+.3);
  b.box(K('basilicas','mixed','masonry'),x,-5.8,z,w,3.6,d);
  plan('basilicas',[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]],'wall','contemporary');
 }
 // East side surviving foundation terrace: expressed at low level, not as a
 // fabricated mirror-image tower beyond the surveyed footprint.
 b.box(K('basilicas','mixed','masonry'),31,-7,-13,8.5,3,15);
 // Sparse reused fragments describe the antiquarium without asserting that an
 // entire decorative order survived. These are intentionally generic fragments.
 for(const spec of[[-20.1,2.3],[-9.7,1.8],[9.9,2.15],[20,1.6]]){
  const[x,h]=spec;const g=new THREE.CylinderGeometry(.24,.29,h,12),m=new THREE.Matrix4().makeTranslation(x,1.35+h/2,-9.88);b.geometry(K('fragmentos','interpretation','limestone'),g,m,.91);g.dispose();
  b.box(K('fragmentos','interpretation','limestone'),x,1.3,-9.88,.72,.18,.72);
 }
 const roofGeo=new THREE.BoxGeometry(54.2,.32,13.05),roofMatrix=new THREE.Matrix4().compose(new THREE.Vector3(0,18.1,-16.05),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.115,0,0)),new THREE.Vector3(1,1,1));
 b.geometry(K('cubierta','contemporary','roof'),roofGeo,roofMatrix);roofGeo.dispose();
 for(let x=-25.5;x<=25.6;x+=5.1)b.box(K('cubierta','contemporary','metal'),x,17.5,-16.1,.18,.52,12.5);
 for(const z of[-10.2,-16.1,-22.0])b.box(K('cubierta','contemporary','metal'),0,17.7+(z+16.1)*.11,z,53.6,.2,.18);
 plan('proscaenium',[[-22,-3],[22,-3],[22,-9.4],[-22,-9.4]],'stage','contemporary');
 plan('frons-scaenae',[[-26.375,-10.3],[26.375,-10.3],[26.375,-11.8],[-26.375,-11.8]],'wall','contemporary');
 plan('cubierta',[[-27.1,-9.5],[27.1,-9.5],[27.1,-22.6],[-27.1,-22.6]],'stage','contemporary');

 // Archaeological cutaway, schematically constrained by the documented 1.42 m
 // trench and 17 transverse walls / 16 wells. Variable individual well widths
 // and foundation heights are interpretive, never labelled a measured survey.
 const archK=K('hyposcaenium','interpretation','archaeology');
 b.box(archK,0,-6.4,-6.4,44,.45,6.6);
 for(const z of[-3.24,-5.31])wallWithDoors(b,K('aulaeum','interpretation','archaeology'),{z,y0:-5.275,y1:-1.725,width:43.5,depth:.65,doors:[{x:0,width:2.25,height:1.7}]});
 const widths=Array.from({length:16},(_,i)=>i%2?1.15:.52);widths[7]=.52;widths[8]=1.15;
 const total=widths.reduce((a,v)=>a+v,0)+17*.65;let xx=-total/2-.4;
 for(let i=0;i<17;i++){const crossesDrain=Math.abs(xx+.325)<1.45;const bottom=crossesDrain?-3.575:-5.275,top=-1.725;b.box(K('aulaeum','interpretation','archaeology'),xx+.325,(bottom+top)/2,-4.275,.65,top-bottom,1.42);xx+=.65+(widths[i]||0);}
 for(const x of[-6.7,7.3])b.box(archK,x,-4,-7.48,.72,4.5,3.7);
 b.box(K('hyposcaenium','contemporary','metal'),0,-1.25,-8.8,43.2,.15,.72);
 for(const z of[-9.16,-8.44]){
  b.box(K('hyposcaenium','contemporary','metal'),0,-.36,z,43.2,.055,.055);
  for(let x=-21;x<=21;x+=2.1)b.box(K('hyposcaenium','contemporary','metal'),x,-.8,z,.045,.92,.045);
 }
 barrel(b,K('cloaca','interpretation','archaeology'),{x:0,y:-5.8,z:-10,length:25.8,width:1.3,height:1.7,thickness:.32});
 b.box(K('cloaca','interpretation','paving'),0,-5.86,-10,1.3,.13,25.8);
 // Open cut in the transverse walls where the central drain crosses; these
 // walls sit above the drain crown, as documented, instead of intersecting it.
 plan('hyposcaenium',[[-22,-3],[22,-3],[22,-9.4],[-22,-9.4]],'stage','interpretation');
 plan('cloaca',[[-.65,2.9],[.65,2.9],[.65,-22.9],[-.65,-22.9]],'path','interpretation');

 const resources=b.finish(group);group.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(group,true);
 const meshes=group.children.filter(o=>o.isMesh);
 const focuses={},sources=new Map((visitData?.stops||[]).map(stop=>[stop.id,stop]));
 for(const[id,label,regionId,x,z,y,radius]of STOPS){
  const source=sources.get(id),target=localWorld(x,y,z);
  let box=new THREE.Box3();
  if(id==='teatro-conjunto')box.copy(bounds);
  else{
   const localBox=new THREE.Box3(new THREE.Vector3(x-radius,Math.max(-7.3,y-6),z-radius*.65),new THREE.Vector3(x+radius,y+7,z+radius*.65));
   box.copy(localBox).applyMatrix4(group.matrixWorld);
   if(['teatro-proscaenium','teatro-frons-scaenae','teatro-restauracion'].includes(id)){
    box.makeEmpty();for(const mesh of meshes)if(COMPONENTS[id].includes(mesh.userData.component))box.union(mesh.geometry.boundingBox.clone().applyMatrix4(group.matrixWorld));
   }
  }
  if(id==='teatro-conjunto')box.getCenter(target);
  // Views enter from the open cavea side. Close views remain above architecture
  // and terrain; subsurface stops require the explicit didactic section control.
  let localOffset=id==='teatro-conjunto'?[95,91,112]:[radius*.36,Math.max(18,radius*1.15),Math.max(24,radius*1.7)];
  if(id==='teatro-aditus-oriental')localOffset=[24,12,9];
  if(id==='teatro-basilicas')localOffset=[27,28,-24];
  if(id==='teatro-vomitoria')localOffset=[14,23,-5];
  if(['teatro-hyposcaenium','teatro-cloaca'].includes(id))localOffset=[9,30,16];
  const rotate=v=>[v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c];
  const offset=rotate(localOffset),closeOffset=rotate(localOffset.map((n,i)=>n*(i===1?.76:.70)));
  for(const v of[offset,closeOffset])v[1]=Math.max(v[1],heightAt(target.x+v[0],target.z+v[2])+3-target.y);
  focuses[id]={id,label:source?.title||source?.label||label,regionId,coordinates:geographical(x,z),target,offset,closeOffset,bounds:box,components:COMPONENTS[id],kind:id==='teatro-conjunto'?'overview':'feature',requiresSection:['teatro-hyposcaenium','teatro-cloaca'].includes(id),sourceConfidence:'documented architectural sector, metric schematic registered to OSM and PNOA'};
 }
 // Lower MDT only under the documented theatre envelope. An inner clearance
 // band prevents 2.5 m terrain triangles from poking through the terraced shell.
 function surfaceHeight(x,z,raw){
  const p=toLocal(x,z),r=Math.hypot(p.x,p.z);
  if(p.z>=-2.8&&p.z<2.8&&Math.abs(p.x)<38.4)return Math.min(raw,base-.40);
  if(p.z>=0&&r<40.0){
   const shell=r<11.3?-.45:r<18?Math.max(-.45,(r-11.15)*.49/.975-.6):r<25.65?4+(r-18)*.51/.8125:8.5+(r-25.65)*.53/.8722;
   return Math.min(raw,base+shell-1.7);
  }
  if(p.z< -2.8&&p.z> -24.4&&Math.abs(p.x)<28.5)return Math.min(raw,base-7.4);
  if(p.x< -26&&p.x> -38.5&&p.z< -3.3&&p.z> -30.6)return Math.min(raw,base-7.4);
  if(p.x>27&&p.x<36.5&&p.z< -3.3&&p.z> -21)return Math.min(raw,base-8.1);
  return raw;
 }
 let selected=null,readingMode='materials',sectionOpen=false,ground=heightAt;
 const selectionGeo=new THREE.BufferGeometry(),selectionMat=new THREE.LineBasicMaterial({color:'#85d5c8',transparent:true,opacity:.9});
 const marker=new THREE.LineLoop(selectionGeo,selectionMat);marker.name='Parada seleccionada del teatro';marker.visible=false;marker.userData.selectionHelper=true;group.add(marker);resources.materials.push(selectionMat);
 function applyMaterials(){
  const focus=selected?focuses[selected]:null;
  for(const mesh of meshes){
   const d=mesh.userData,m=mesh.material,nextMap=readingMode==='periods'?null:d.baseMap;
   if(m.map!==nextMap){m.map=nextMap;m.needsUpdate=true;}m.color.copy(d.baseColor);
   if(readingMode==='periods')m.color.set(COLORS[d.period]);
   const match=focus&&(focus.kind==='overview'||focus.components.includes(d.component));
   m.emissive.set(match?'#397b6f':'#000000');m.emissiveIntensity=match?.17:0;
  }
 }
 function selectFocus(id){
  selected=id&&focuses[id]?id:null;applyMaterials();marker.visible=!!selected&&selected!=='teatro-conjunto';
  if(marker.visible){const focus=focuses[selected],p=group.worldToLocal(focus.target.clone()),positions=[],r=selected==='teatro-orchestra'?7.6:2.15;
   for(let i=0;i<64;i++){const a=i*TAU/64;positions.push(p.x+Math.cos(a)*r,p.y+.18,p.z+Math.sin(a)*r);}selectionGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));selectionGeo.computeBoundingSphere();
  }
  return selected?focuses[selected]:null;
 }
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';applyMaterials();return readingMode;}
 function setSection(value){
  sectionOpen=!!value;
  for(const mesh of meshes)if(['cubierta','proscaenium'].includes(mesh.userData.component))mesh.visible=!sectionOpen;
  return sectionOpen;
 }
 function bindGround(finalHeightAt){
  ground=finalHeightAt||heightAt;
  for(const focus of Object.values(focuses))for(const v of[focus.offset,focus.closeOffset])v[1]=Math.max(v[1],ground(focus.target.x+v[0],focus.target.z+v[2])+3-focus.target.y);
  return group;
 }
 qa.drainOpening={id:'cloaca-esquema',localOrigin:[0,-4.85,-3.5],localDirection:[0,0,-1],distance:19,width:1.3,height:1.7};
 for(const opening of [...qa.openings,qa.drainOpening]){opening.origin=localWorld(...opening.localOrigin).toArray();const[x,y,z]=opening.localDirection;opening.direction=[x*c+z*s,y,-x*s+z*c];}
 const stats={stops:Object.keys(focuses).length,components:new Set(meshes.map(m=>m.userData.component)).size,meshes:meshes.length,triangles:meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count/3,0),seatingRows:23,senatorialRows:2,upperRestitutedRows:4,trueOpenPassages:qa.openings.length,cartographicOutline:true,undergroundReconstruction:'schematic',sourceKeys:['teatro-arqueologia-1993','teatro-estructura-1986','teatro-portaceli-1993','teatro-proyecto-1993','teatro-osm'],periods:PERIODS.map(p=>p.id)};
 const footprint=data.theatrePolygon?.length?data.theatrePolygon: [...ringPlan(0,42.7),[-27,-23],[27,-23]].map(([x,z])=>geographical(x,z));
 group.userData={id:'theatre',label:'Teatro Romano de Sagunto',interpretation:true,cartographicOutline:true,ownedResources:resources,layout:{center:CENTER,worldCenter:center,base,yaw:YAW},surfaceHeight,visit:{focuses,bounds,stats,periods:PERIODS,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({selected,readingMode,sectionOpen}),qa,plan:{outline:footprint,components:planComponents,center:CENTER,yaw:YAW},metadata:{state:'Conserved and rehabilitated state; elevations are approximate',section:'Didactic removal of the contemporary canopy and stage deck. Archaeological substructures are schematic, not a surveyed or accessible interior.',ancientScenicFacade:'Not reconstructed as a complete Roman elevation.',registration:'Circle fit to 20 OSM cavea points and stage orientation checked against PNOA; this is not survey-grade georeferencing.'}}};
 return group;
}

export const theatreRegistration={center:CENTER,yaw:YAW};

// Internal OSM circulation is rebuilt with the architecture; do not extrude it
// a second time as roads over the seats. External approach streets remain mapped.
export const theatreRoadIds=new Set(['733413579','733413580','733413581',...Array.from({length:23},(_,i)=>String(733418145+i)),'1499124508']);
export const theatreBuildingIds=new Set(['203140142','cat-3556901YJ3935N_part1-0','cat-3556901YJ3935N_part2-0']);
