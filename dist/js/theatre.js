import * as THREE from 'three';
import {appendTheatreEnvirons,theatreEnvironsRoadIds} from './theatre-environs.js';

// Architectural reading of the conserved / rehabilitated theatre. Metric
// proportions: Hernández et al., CAR 2 (1993); current shell: Grassi / Portaceli
// (1990–1993), checked against the authors' plans / sections held by La Casa
// de la Arquitectura and Almagro's 1979 photogrammetric drawings (RABASF).
// Plan registration uses the supplied OSM trace and IGN PNOA.
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
 'teatro-frons-scaenae':['frons-scaenae','fragmentos','escena-posterior'],
 'teatro-basilicas':['basilicas'],
 'teatro-hyposcaenium':['hyposcaenium','aulaeum'],
 'teatro-cloaca':['cloaca'],
 'teatro-restauracion':['cubierta','frons-scaenae','escena-posterior','portico'],
 'teatro-vivo':['proscaenium','orchestra']
};
// The point of interest is separate from a fit box: focused views can look at
// one side of a component without framing the full 80 m wide theatre.
const STOPS=[
 ['teatro-conjunto','El teatro en su paisaje','conjunto',0,8,8,46],
 ['teatro-aditus-oriental','Aditus oriental','cavea',24,-.8,2.2,8],
 ['teatro-orchestra','Orchestra y asientos senatoriales','cavea',0,3,.7,12],
 ['teatro-ima-cavea','Ima cavea','cavea',-7,12,3.3,12],
 ['teatro-media-cavea','Media cavea','cavea',0,21,7.8,14],
 ['teatro-summa-cavea','Summa cavea','cavea',-11,27,12.5,15],
 ['teatro-vomitoria','Vomitorios y circulación','cavea',9.571238,24.174189,10.95,9],
 ['teatro-portico','Pórtico superior y segundo anillo','cavea',0,36.4,17.2,15],
 ['teatro-tribunalia','Tribunalia','cavea',22,1,6.2,9],
 ['teatro-proscaenium','Proscaenium','escena',0,-6.2,1.7,25],
 ['teatro-frons-scaenae','Frente escénico','escena',0,-11.8,7.5,25],
 ['teatro-basilicas','Basílicas laterales','escena',28.5,-14,8,11],
 ['teatro-hyposcaenium','Foso del escenario','subsuelo',-10,-5,-2.5,13],
 ['teatro-cloaca','Cloaca central','subsuelo',0,-4,-3.5,6],
 ['teatro-restauracion','La intervención de 1990–1993','presente',0,-12,13,29],
 ['teatro-vivo','Un teatro vivo','presente',0,7,4,34]
];

function stoneTexture(kind='masonry'){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d'),brick=kind==='brick',rows=brick?35:19,dy=512/rows,dx=brick?60:43;
 ctx.fillStyle=brick?'#cfbea0':'#aaa18c';ctx.fillRect(0,0,512,512);
 for(let row=0;row<rows;row++)for(let col=-1;col<14;col++){
  const seed=row*31+col,v=noise(seed+99),x=col*dx+(row%2?dx/2:0),y=row*dy;
  ctx.fillStyle='hsl('+(brick?38:36)+', '+(brick?18+v*7:8+v*12)+'%, '+(brick?72+v*12:58+v*24)+'%)';
  if(brick)ctx.fillRect(x+.5,y+.6,dx-1,dy-1.3);
  else{
   ctx.beginPath();ctx.moveTo(x+2,y+1+v*2);ctx.lineTo(x+dx-4,y+2);ctx.lineTo(x+dx-1,y+dy-4-v*2);ctx.lineTo(x+3,y+dy-2);ctx.closePath();ctx.fill();
  }
  ctx.fillStyle='rgba(247,238,214,.14)';ctx.fillRect(x+2,y+2,dx-5,1);
 }
 for(let i=0;i<4500;i++){ctx.fillStyle=i%2?'rgba(47,43,33,.07)':'rgba(245,234,206,.1)';ctx.fillRect(noise(i+14)*512,noise(i+93)*512,1+noise(i)*2,1);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}
const MATERIALS={
 masonry:{color:'#c8bca5',roughness:1,map:'masonry'},
 limestone:{color:'#dcd4bd',roughness:.87},
 edge:{color:'#eee6cf',roughness:.82},
 paving:{color:'#c6b99d',roughness:1},
 concrete:{color:'#b5aa94',roughness:.97},
 brick:{color:'#e0ceb0',roughness:.94,map:'brick'},
 roof:{color:'#b6b9b1',roughness:.72,metalness:.23},
 metal:{color:'#434c48',roughness:.65,metalness:.45},
 timber:{color:'#a17d52',roughness:.91},
 archaeology:{color:'#c5b69b',roughness:1,map:'masonry'},
 rail:{color:'#d5d6c8',roughness:.7,metalness:.27},
 rock:{color:'#a8a294',roughness:1},
 bark:{color:'#70614d',roughness:1},
 foliage:{color:'#627449',roughness:1},
 scrub:{color:'#82815d',roughness:1}
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
  const textures={masonry:stoneTexture('masonry'),brick:stoneTexture('brick')},materials=[];
  for(const[key,b]of this.parts){
   const[component,period,kind]=key.split('|'),def=MATERIALS[kind];
   const texture=def.map?textures[def.map]:null;
   const mat=new THREE.MeshStandardMaterial({color:def.color,roughness:def.roughness,metalness:def.metalness||0,map:texture,bumpMap:texture,bumpScale:kind==='brick'?.018:.075,vertexColors:true});mat.name='Teatro · '+component+' · '+kind;
   materials.push(mat);const geo=new THREE.BufferGeometry();
   for(const[name,values,size]of[['position',b.p,3],['normal',b.n,3],['uv',b.u,2],['color',b.c,3]])geo.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
   geo.computeBoundingBox();geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,mat);mesh.name=mat.name;mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={theatreFabric:true,component,period,materialKind:kind,baseColor:mat.color.clone(),baseMap:mat.map};group.add(mesh);
  }
  this.boxGeo.dispose();return{materials,textures:Object.values(textures)};
 }
}
function quad(out,a,b,c,d){out.push(...a,...b,...c,...a,...c,...d);}
function arc(batch,key,r0,r1,y0,y1,a0=0,a1=PI,steps=48,tint=1,origin=[0,0]){
 const p=[],at=(r,y,a)=>[origin[0]+Math.cos(a)*r,y,origin[1]+Math.sin(a)*r];
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
// Broken seating fabric retains a legible radial profile but has an irregular
// silhouette, granular joints and a different material from the inserted shell.
// These chips are a visual approximation; they are not individual surveyed stones.
function rubbleArc(batch,key,r0,r1,y0,y1,a0,a1,seed=0){
 const n=Math.max(1,Math.ceil((a1-a0)*r1/.95)),at=(r,y,a)=>[Math.cos(a)*r,y,Math.sin(a)*r];
 for(let i=0;i<n;i++){
  const a=a0+(a1-a0)*i/n+.004/r0,z=a0+(a1-a0)*(i+1)/n-.004/r0;
  const v=noise(seed+i*13),w=noise(seed+i*13+7),ri=r0+.03+v*.08,ro=r1-.025-w*.055,ya=y1-.045-v*.09,yz=y1-.03-w*.12,p=[];
  const A=at(ri,ya,a),B=at(ri,yz,z),C=at(ro,yz,z),D=at(ro,ya,a),E=at(ri,y0,a),F=at(ri,y0,z),G=at(ro,y0,z),H=at(ro,y0,a);
  quad(p,A,B,C,D);quad(p,F,E,H,G);quad(p,E,F,B,A);quad(p,G,H,D,C);quad(p,H,E,A,D);quad(p,F,G,C,B);
  batch.raw(key,p,.81+v*.19);
 }
}
function beam3(batch,key,a,z,width=.1,depth=width,tint=1){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...z),axis=B.clone().sub(A),length=axis.length();if(length<.001)return;
 const transform=new THREE.Matrix4().compose(A.add(B).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize()),new THREE.Vector3(width,length,depth));batch.geometry(key,batch.boxGeo,transform,tint);
}
function railArc(batch,key,r,y,a0,a1){
 arc(batch,key,r-.027,r+.027,y+.93,y+.98,a0,a1,Math.max(4,Math.ceil((a1-a0)*r/1.8)));
 const count=Math.ceil((a1-a0)*r/.85);for(let i=0;i<=count;i++){const a=a0+(a1-a0)*i/count;batch.box(key,Math.cos(a)*r,y+.47,Math.sin(a)*r,.032,.94,.032);}
}
// A cell decomposition cuts real doors and windows out of one wall. The result
// remains open through its full thickness; no dark pane stands in for a void.
function perforatedWall(batch,key,{x=0,z,y0,y1,width,depth,openings=[],yaw=0}){
 const xs=[-width/2,width/2,...openings.flatMap(o=>[Math.max(-width/2,o.x-o.width/2),Math.min(width/2,o.x+o.width/2)])].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
 for(let i=0;i<xs.length-1;i++){
  const lo=xs[i],hi=xs[i+1],mid=(lo+hi)/2;if(hi-lo<.001)continue;
  const holes=openings.filter(o=>mid>o.x-o.width/2&&mid<o.x+o.width/2).map(o=>[o.bottom,o.bottom+o.height]);
  for(const[bottom,top]of segmentIntervals(y0,y1,holes)){const u=mid;batch.box(key,x+u*Math.cos(yaw),(bottom+top)/2,z-u*Math.sin(yaw),hi-lo,top-bottom,depth,yaw);}
 }
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
 const qa={openings:[],floorSamples:[],seating:[],documentedDimensions:{orchestra:16,withSenatorialSeating:22,imaCavea:34,mediaCavea:49,summaCavea:67,upperPortico:79,stageFront:44,stageDepth:6.4,postscaenium1993:57.25},underground:{representation:'schematic documented archaeological remains; not a surveyed interior',aulaeumCells:16,transverseWalls:17,channelWidth:1.42,ancientStageHeightKnown:false},registeredCenter:CENTER,yaw:YAW};
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

 // The 6 / 8 / 9 archaeological orders set the radial structure. The current
 // pale shell is deliberately narrower in each higher order, as shown in the
 // authors' +16.40 plan. Exposed flanks retain mixed, uneven masonry.
 const orders=[
  {id:'ima-cavea',r0:11.15,r1:17,rows:6,start:1.02,rise:.49,sectors:4,pale:[PI/6,PI*5/6]},
  {id:'media-cavea',r0:18,r1:24.5,rows:8,start:4.60,rise:.51,sectors:6,pale:[PI*.25,PI*.75]},
  {id:'summa-cavea',r0:25.65,r1:33.5,rows:9,start:9.38,rise:.53,sectors:10,pale:[PI*.30,PI*.70]}
 ];
 const vomAngles=[PI*.18,PI*.38,PI*.62,PI*.82];
 qa.rehabilitation={source:'teatro-casa-arquitectura',datum:'project-relative orchestra datum, not elevation above sea level',stageDeck:1.20,scenicCrown:20.20,upperCaveaCrown:20.20,galleryLevels:[5.6,8.3],exedraCount:3,mainPiers:2,paleSeatingSectors:orders.map(o=>({order:o.id,angles:o.pale.slice()})),upperCentralInterruption:true,roughFabric:'visual approximation of conserved and consolidated fabric, not individually surveyed fragments',roof:'light metal single slope with visible timber underside',sectionDrawings:['Seccion Transversal','Secciones Longitudinales','Planta +16,4','Planta +2,9']};
 qa.rehabilitation.fabricSamples=orders.flatMap(o=>{const row=Math.floor(o.rows/2),radius=o.r0+(row+.5)*(o.r1-o.r0)/o.rows,y=o.start+(row+1)*o.rise;return[[PI*.45,'contemporary'],[PI*.09,'mixed']].map(([a,period])=>({component:o.id,period,localOrigin:[Math.cos(a)*radius,y+1.5,Math.sin(a)*radius],localDirection:[0,-1,0],distance:2}));});
 qa.rehabilitation.openSpaceChecks=[{id:'space-above-low-exedras',localOrigin:[4,7.2,-5],localDirection:[0,0,-1],distance:10.1},{id:'interrupted-crown',localOrigin:[0,19,37.5],localDirection:[0,0,1],distance:2.5}];
 for(const o of orders){
  const rowDepth=(o.r1-o.r0)/o.rows;
  for(let row=0;row<o.rows;row++){
   const r0=o.r0+row*rowDepth,r1=r0+rowDepth,top=o.start+(row+1)*o.rise;
   const cuts=[];for(let aisle=1;aisle<o.sectors;aisle++){const a=aisle*PI/o.sectors;cuts.push([a-.43/r0,a+.43/r0]);}
   if(o.id==='summa-cavea')for(const a of vomAngles)cuts.push([a-.91/r0,a+.91/r0]);
   for(const[lo,hi,modern]of[[.012,o.pale[0],false],[...o.pale,true],[o.pale[1],PI-.012,false]]){
    for(const[a,z]of segmentIntervals(lo,hi,cuts)){
     const steps=Math.max(2,Math.ceil((z-a)*r1/.9)),bottom=Math.max(-.6,top-1.5);
     if(modern){
      arc(b,K(o.id,'contemporary','limestone'),r0,r1,bottom,top,a,z,steps,.96+noise(row*31+steps)*.035);
      arc(b,K(o.id,'contemporary','edge'),r0,r0+.075,top-.085,top+.012,a,z,steps,.98);
     }else rubbleArc(b,K(o.id,'mixed','masonry'),r0,r1,bottom,top,a,z,row*31+o.rows*97);
    }
   }
   // The final rows bridge the vaulted access passages. No hidden solid fills
   // the clear headroom beneath the bridge.
   if(o.id==='summa-cavea'&&row>=6)for(const a of vomAngles){
    const modern=a>o.pale[0]&&a<o.pale[1];
    arc(b,K(o.id,modern?'contemporary':'mixed',modern?'limestone':'masonry'),r0,r1,12.32,top,a-.94/r0,a+.94/r0,4,.93);
   }
   qa.seating.push({order:o.id,row,radius:r0,top});
  }
  for(let aisle=1;aisle<o.sectors;aisle++){
   const a=aisle*PI/o.sectors,modern=a>o.pale[0]&&a<o.pale[1];
   for(let row=0;row<o.rows*2;row++){
    const radius=o.r0+(row+.5)*rowDepth/2,y=o.start+(row+1)*o.rise/2;
    if(o.id==='summa-cavea'&&vomAngles.some(v=>Math.abs(v-a)<1.35/radius))continue;
    b.box(K(o.id,modern?'contemporary':'mixed',modern?'edge':'masonry'),Math.cos(a)*radius,y-.12,Math.sin(a)*radius,.84,.24,rowDepth/2+.025,PI/2-a,modern?.96:.87);
   }
  }
  // Slender present-day balustrades mark the limits of the inserted seating.
  for(const a of o.pale){
   for(let row=0;row<o.rows;row++){
    const r=o.r0+(row+.5)*rowDepth,y=o.start+(row+1)*o.rise;
    b.box(K(o.id,'contemporary','rail'),Math.cos(a)*r,y+.45,Math.sin(a)*r,.035,.9,.035);
    const rn=r+rowDepth,yn=Math.min(o.start+o.rows*o.rise,y+o.rise);
    if(row<o.rows-1)beam3(b,K(o.id,'contemporary','rail'),[Math.cos(a)*r,y+.92,Math.sin(a)*r],[Math.cos(a)*rn,yn+.92,Math.sin(a)*rn],.045);
   }
  }
  plan(o.id,ringPlan(o.r0,o.r1,o.pale[0],o.pale[1]),'seating','contemporary');
  for(const[a,z]of[[.012,o.pale[0]],[o.pale[1],PI-.012]])plan(o.id+'-fabrica',ringPlan(o.r0,o.r1,a,z),'seating','mixed');
 }
 // Walking ledges retain the same radial spacing as the seating; they are not
 // abstract decorative stripes around an otherwise solid bowl.
 for(const[o,r0,r1,y0,y1]of[[orders[0],17,18,3.85,4.55],[orders[1],24.5,25.65,8.05,9.15],[orders[2],33.5,34.7,13.55,14.35]]){
  for(const[a,z,modern]of[[.012,o.pale[0],false],[...o.pale,true],[o.pale[1],PI-.012,false]])arc(b,K(o.id,modern?'contemporary':'mixed',modern?'paving':'masonry'),r0,r1,y0,y1,a,z,Math.ceil((z-a)*r1),modern?.96:.87);
  railArc(b,K(o.id,'contemporary','rail'),r0+.08,y1,o.pale[0],o.pale[1]);
 }
 for(const a of vomAngles){
  const rr=28.05,y=9.15,ax=Math.cos(a),az=Math.sin(a),yaw=PI/2-a;
  b.box(K('vomitoria','mixed','masonry'),ax*30.1,y-.1,az*30.1,1.78,.2,9.2,yaw,.88);
  for(const side of[-1,1])b.box(K('vomitoria','mixed','masonry'),ax*rr+Math.cos(a+PI/2)*side*1.14,y+1.25,az*rr+Math.sin(a+PI/2)*side*1.14,.46,2.5,5.0,yaw,.91);
  barrel(b,K('vomitoria','mixed','masonry'),{x:ax*32.5,y,z:az*32.5,length:5.0,width:1.78,height:2.65,thickness:.38,yaw});
  qa.openings.push({id:'vomitorium-'+qa.openings.length,kind:'vomitorium',localOrigin:[ax*25.55,y+1.8,az*25.55],localDirection:[ax,0,az],distance:9.2,width:1.5,height:2.1});
  plan('vomitorium-'+a,[[ax*25.6+az*.8,az*25.6-ax*.8],[ax*35+az*.8,az*35-ax*.8],[ax*35-az*.8,az*35+ax*.8],[ax*25.6-az*.8,az*25.6+ax*.8]],'path','mixed');
 }

 // The upper portico is an interrupted construction, not a continuous crown.
 // Its front has real lintelled openings and a central break. Only the central
 // reinstated seating climbs to the +20.20 project datum.
 const porticoSpans=[[PI*.15,PI*.486],[PI*.514,PI*.85]],upperModern=[[PI*.36,PI*.486],[PI*.514,PI*.64]],porticoDoors=[PI*.28,PI*.42,PI*.58,PI*.72];
 for(const[a0,a1]of porticoSpans){
  arc(b,K('portico','mixed','paving'),34.55,38.65,13.9,14.28,a0,a1,55,.9);
  const holes=porticoDoors.map(a=>[a-.62/34.7,a+.62/34.7]);
  for(const[a,z]of segmentIntervals(a0,a1,holes))arc(b,K('portico','mixed','masonry'),34.55,35.25,14.28,17.15,a,z,Math.max(2,Math.ceil((z-a)*35)),.92);
  for(const a of porticoDoors.filter(a=>a>a0&&a<a1)){
   arc(b,K('portico','mixed','masonry'),34.55,35.25,16.66,17.15,a-.62/34.7,a+.62/34.7,3,.95);
   qa.openings.push({id:'portico-door-'+a.toFixed(2),kind:'upper-portico',localOrigin:[Math.cos(a)*34.2,15.45,Math.sin(a)*34.2],localDirection:[Math.cos(a),0,Math.sin(a)],distance:3.4,width:1.24,height:2.38});
  }
  arc(b,K('portico','mixed','masonry'),38.05,38.65,14.0,17.15,a0,a1,60,.91);
  for(const[a,z]of segmentIntervals(a0,a1,upperModern))rubbleArc(b,K('portico','mixed','masonry'),35.22,38.64,16.8,17.2,a,z,881);
  plan('portico',ringPlan(34.55,38.65,a0,a1),'wall','mixed');
 }
 for(const[a0,a1]of upperModern){
  for(let row=0;row<4;row++){
   const ri=34.7+row*.975,ro=row===3?38.08:ri+.975,top=17.8+row*.8;
   arc(b,K('portico','contemporary','limestone'),ri,ro,17.10,top,a0,a1,28,.97);
   arc(b,K('portico','contemporary','edge'),ri,ri+.065,top-.08,top+.012,a0,a1,28);
  }
  arc(b,K('portico','contemporary','limestone'),38.08,38.65,17.0,20.2,a0,a1,26,.94);
  railArc(b,K('portico','contemporary','rail'),34.75,17.80,a0,a1);
  plan('portico-gradas-actuales',ringPlan(34.7,38.65,a0,a1),'seating','contemporary');
 }
 // The extra seats beside the portico remain exposed masonry, rather than a
 // fictitious complete upper colonnade. The angular limits follow the drawings.
 for(const[a0,a1]of[[.012,PI*.15],[PI*.85,PI-.012]])for(let row=0;row<5;row++)rubbleArc(b,K('summa-cavea','mixed','masonry'),34.7+row*.68,35.38+row*.68,13.6+row*.48,14.8+row*.48,a0,a1,330+row*19);
 // Second-ring circulation is open above a low perimeter parapet. Its flanks
 // end before the crown, matching the cartographic outline.
 for(const[a0,a1]of[[0,.31*PI],[.69*PI,PI]]){
  arc(b,K('segundo-anillo','mixed','masonry'),40.4,42.7,-4.9,13.1,a0,a1,44,.91);
  arc(b,K('segundo-anillo','mixed','paving'),38.65,42.05,12.9,13.72,a0,a1,44,.89);
  arc(b,K('segundo-anillo','mixed','masonry'),42.05,42.7,13.72,14.58,a0,a1,44,.95);
  plan('segundo-anillo',ringPlan(38.65,42.7,a0,a1),'wall','mixed');
 }
 for(const[a0,a1]of[[0,PI*.486],[PI*.514,PI]])arc(b,K('soporte-cavea','mixed','masonry'),37,38.65,-5.4,13.9,a0,a1,64,.91);

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

 // Current stage: +1.20 in the authors' section. This relative project level
 // is independent of the unknown height of the ancient timber stage.
 const stageKey=K('proscaenium','contemporary','timber');
 b.box(stageKey,0,1.03,-6.2,44,.34,6.4);
 for(let i=0;i<88;i++)b.box(stageKey,-21.75+i*.5,1.204,-6.2,.014,.008,6.35,0,.74);
 b.box(K('proscaenium','contemporary','limestone'),0,.57,-2.94,44,1.1,.22);
 for(let x=-21.6;x<22;x+=1.18)b.box(K('proscaenium','contemporary','limestone'),x,.62,-2.78,.19,1.14,.24,0,.94);

 // The real scaenae frons is a low, three-exedra construction. The tall plane
 // belongs to the rear service body, with two freestanding piers and galleries
 // in front of it; a full-height flat wall here would hide that architecture.
 const exedras=[{x:-14.05,r:4.7,width:2.5},{x:0,r:7.1,width:3.35},{x:14.05,r:4.7,width:2.5}];
 qa.rehabilitation.exedras=exedras.map(e=>({center:[e.x,-9.4],radius:e.r,doorWidth:e.width,wallTop:5.75,geometry:'plan and photograph informed approximation'}));
 for(const e of exedras){
  const gap=Math.asin((e.width/2+.10)/e.r),intervals=[[PI,PI*1.5-gap],[PI*1.5+gap,TAU]],origin=[e.x,-9.4];
  // The timber surface follows the concavities of the current low facade.
  // Leaving the deck as a rectangle would expose a false deep void here.
  arc(b,stageKey,0,e.r-.50,.88,1.20,PI,TAU,48,1,origin);
  for(let dx=-e.r+.65;dx<e.r-.60;dx+=.5){const reach=Math.sqrt((e.r-.50)**2-dx**2);b.box(stageKey,e.x+dx,1.204,-9.4-reach/2,.014,.008,reach,0,.74);}
  for(const[a,z]of intervals){
   arc(b,K('frons-scaenae','contemporary','brick'),e.r-.50,e.r+.15,1.2,5.75,a,z,32,1,origin);
   arc(b,K('frons-scaenae','contemporary','brick'),e.r-.64,e.r+.36,1.2,2.1,a,z,32,.96,origin);
   arc(b,K('frons-scaenae','contemporary','concrete'),e.r-.67,e.r+.39,2.1,2.23,a,z,32,1,origin);
   arc(b,K('frons-scaenae','contemporary','concrete'),e.r-.52,e.r+.17,5.75,5.84,a,z,32,1,origin);
   const poly=[];for(let i=0;i<=24;i++){const t=a+(z-a)*i/24;poly.push([e.x+Math.cos(t)*(e.r+.15),-9.4+Math.sin(t)*(e.r+.15)]);}for(let i=24;i>=0;i--){const t=a+(z-a)*i/24;poly.push([e.x+Math.cos(t)*(e.r-.5),-9.4+Math.sin(t)*(e.r-.5)]);}plan('frons-scaenae',poly,'wall','contemporary');
  }
  const doorZ=-9.4-e.r;
  b.box(K('frons-scaenae','contemporary','paving'),e.x,2.04,doorZ-.62,e.width, .22,1.5);
  for(let step=0;step<4;step++)b.box(K('frons-scaenae','contemporary','limestone'),e.x,1.2+(step+.5)*.23,doorZ+1.3-step*.32,e.width,.23,.34);
  qa.openings.push({id:'scene-door-'+e.x,kind:'scenic-door',localOrigin:[e.x,3.1,-8.95],localDirection:[0,0,-1],distance:14.4,width:e.width,height:3.5});
 }
 // The rear circulation has a continuous pale floor behind the curved wall,
 // joining its raised door landings. Its profile is interpreted from the plans
 // and photographs; +2.15 is not claimed as an excavated Roman level.
 const floorFront=x=>{for(const e of exedras)if(Math.abs(x-e.x)<=e.r)return-9.4-Math.sqrt(Math.max(0,e.r*e.r-(x-e.x)**2));return-9.4;};
 const floorBreaks=[-22,22,...exedras.flatMap(e=>[e.x-e.r,e.x,e.x+e.r]),...Array.from({length:147},(_,i)=>-21.9+i*.3)].filter(x=>x>=-22&&x<=22).sort((a,z)=>a-z),floorPoints=[];
 for(let i=0;i<floorBreaks.length-1;i++){
  const a=floorBreaks[i],z=floorBreaks[i+1];if(z-a<.001)continue;
  const fa=floorFront(a),fz=floorFront(z),back=-18.35;
  quad(floorPoints,[a,2.15,fa],[z,2.15,fz],[z,2.15,back],[a,2.15,back]);
  quad(floorPoints,[a,1.87,fa],[a,1.87,back],[z,1.87,back],[z,1.87,fz]);
  quad(floorPoints,[a,1.87,fa],[z,1.87,fz],[z,2.15,fz],[a,2.15,fa]);
 }
 b.raw(K('proscaenium','contemporary','paving'),floorPoints);
 qa.rehabilitation.scenicFloors={timberConcavities:1.20,rearServiceFloor:2.15,rearLevelInterpretive:true,sectionComponent:'proscaenium',samples:[[0,1.2,-12],[-14.05,1.2,-12],[14.05,1.2,-12],[-5,2.15,-16.8],[5,2.15,-16.8]]};
 for(const[x0,x1]of[[-22,-18.75],[-9.35,-7.1],[7.1,9.35],[18.75,22]]){
  b.box(K('frons-scaenae','contemporary','brick'),(x0+x1)/2,3.475,-9.4,x1-x0,4.55,.65);
  b.box(K('frons-scaenae','contemporary','concrete'),(x0+x1)/2,5.795,-9.4,x1-x0,.09,.72);
 }
 for(const x of[-8.22,8.22])b.box(K('frons-scaenae','contemporary','brick'),x,10.35,-10.45,1.55,18.3,1.65);
 // Small, uneven remains stay distinct from the contemporary curved shell.
 for(const x of[-20.1,10.65,19.9])for(let i=0;i<5;i++){const xx=x+(i-2)*.39,h=.42+noise(i+x)*.52;b.box(K('frons-scaenae','ancient','masonry'),xx,1.2+h/2,-9.02, .37,h,.70,0,.85+noise(xx)*.1);}

 const sceneKey=K('escena-posterior','contemporary','brick'),rearDoorXs=[-14.05,0,14.05];
 // All adjoining wall / roof caps end at +20.20. Partition their footprints
 // instead of stacking coincident top faces where the scenic body enters the
 // basilicas. The thin cap course preserves the original outline and height.
 const crownTop=20.2,crownBase=20.04,crownCoverage=[];
 const crownCap=(key,{x=0,z,width,depth},bottom=crownBase)=>{
  const rect=[x-width/2,x+width/2,z-depth/2,z+depth/2];let cells=[rect];
  for(const cut of crownCoverage){const next=[];for(const cell of cells){
   const [x0,x1,z0,z1]=cell,loX=Math.max(x0,cut[0]),hiX=Math.min(x1,cut[1]),loZ=Math.max(z0,cut[2]),hiZ=Math.min(z1,cut[3]);
   if(loX>=hiX||loZ>=hiZ){next.push(cell);continue;}
   if(x0<loX)next.push([x0,loX,z0,z1]);if(hiX<x1)next.push([hiX,x1,z0,z1]);
   if(z0<loZ)next.push([loX,hiX,z0,loZ]);if(hiZ<z1)next.push([loX,hiX,hiZ,z1]);
  }cells=next;}
  for(const[x0,x1,z0,z1]of cells)if(x1-x0>1e-7&&z1-z0>1e-7)b.box(key,(x0+x1)/2,(bottom+crownTop)/2,(z0+z1)/2,x1-x0,crownTop-bottom,z1-z0);
  crownCoverage.push(rect);
 };
 crownCap(K('escena-posterior','contemporary','limestone'),{z:-22.75,width:53.9,depth:1.05});
 const sharedWindows=[...Array.from({length:9},(_,i)=>({x:(i-4)*4.85,width:1.55,bottom:14.15,height:1.8})),...Array.from({length:15},(_,i)=>({x:(i-7)*2.95,width:.9,bottom:17.35,height:.85}))];
 const groundDoors=rearDoorXs.map(x=>({x,width:x===0?3.35:2.5,bottom:1.2,height:x===0?6.65:3.6}));
 const galleryDoors=Array.from({length:9},(_,i)=>({x:(i-4)*4.85,width:1.30,bottom:8.3,height:2.25}));
 perforatedWall(b,sceneKey,{z:-18.35,y0:1.2,y1:crownBase,width:52.75,depth:.72,openings:[...groundDoors,...galleryDoors,...sharedWindows]});
 crownCap(sceneKey,{z:-18.35,width:52.75,depth:.72});
 perforatedWall(b,sceneKey,{z:-22.75,y0:1.2,y1:crownBase,width:53.6,depth:.85,openings:[...groundDoors,...sharedWindows,...[-14.55,-4.85,4.85,14.55].map(x=>({x,width:1.35,bottom:8.3,height:2.5}))]});
 for(const x of[-26.2,26.2]){b.box(sceneKey,x,(1.2+crownBase)/2,-20.55,.75,crownBase-1.2,4.6);crownCap(sceneKey,{x,z:-20.55,width:.75,depth:4.6});}
 for(const y of[1.2,8.3,13.7,16.4])b.box(K('escena-posterior','contemporary','concrete'),0,y-.13,-20.55,52.1,.26,4.4);
 // The consolidated stone podium is perforated, as shown in the author's
 // north elevation and the 2015 rear photograph. Small openings are grouped
 // toward the north elevation's left (= positive local X when viewed outside).
 // These minor sizes and levels are visual approximations, not surveyed data.
 const podiumKey=K('escena-posterior','mixed','masonry');
 const podiumWindows=rearDoorXs.map(x=>({id:'rear-podium-window-'+x,x,width:1.65,bottom:-3.85,height:2.25}));
 const podiumSmallWindows=[...[-.95,-3.85].flatMap(bottom=>[17.25,19.65,21.85].map(x=>({x,width:.48,bottom,height:.76}))),{x:-21.85,width:.48,bottom:-3.85,height:.76}];
 const podiumAccess={x:-4.3,width:1.75,bottom:-3.85,height:3.8};
 const podiumArches=[{x:0,width:1.55,bottom:-7.2,height:3.0},{x:21.35,width:1.15,bottom:-6.7,height:2.6}];
 const podiumOpenings=[...podiumWindows,...podiumSmallWindows,podiumAccess,...podiumArches,{x:-21.45,width:1.25,bottom:-6.9,height:2.25}];
 perforatedWall(b,podiumKey,{z:-22.75,y0:-7.2,y1:1.2,width:53.95,depth:1.7,openings:podiumOpenings});
 for(const o of podiumArches)barrel(b,podiumKey,{x:o.x,y:o.bottom,z:-22.75,length:1.7,width:o.width,height:o.height,thickness:.16});
 for(const o of [...podiumWindows,{...podiumAccess,id:'rear-podium-raised-access'}])qa.openings.push({id:o.id,kind:'rear-podium-window',localOrigin:[o.x,o.bottom+o.height/2,-24.8],localDirection:[0,0,1],distance:3.25,width:o.width,height:o.height});

 // Narrow metal walk at the stone / brick transition, with the three visibly
 // projecting door landings and diagonal brackets. No railing seals a door.
 const exteriorMetal=K('escena-posterior','contemporary','metal'),walkY=1.2,walkZ=-24.15,walkEnds=[-22.15,22.15];
 const metalRail=(a,z,y)=>{
  beam3(b,exteriorMetal,[a[0],y+1.04,a[1]],[z[0],y+1.04,z[1]],.035);
  const length=Math.hypot(z[0]-a[0],z[1]-a[1]),count=Math.max(1,Math.ceil(length/.24));
  for(let i=0;i<=count;i++)b.box(exteriorMetal,a[0]+(z[0]-a[0])*i/count,y+.51,a[1]+(z[1]-a[1])*i/count,.025,1.02,.025);
 };
 const landingWidths=rearDoorXs.map(x=>({x,width:x===0?3.9:3.1}));
 for(const[a,z]of segmentIntervals(walkEnds[0],walkEnds[1],landingWidths.map(o=>[o.x-o.width/2,o.x+o.width/2]))){
  b.box(exteriorMetal,(a+z)/2,walkY-.04,-23.63,z-a,.08,1.04);metalRail([a,walkZ],[z,walkZ],walkY);
 }
 for(const o of landingWidths){
  const lo=o.x-o.width/2,hi=o.x+o.width/2,outer=-25.16;
  b.box(exteriorMetal,o.x,walkY-.045,-24.075,o.width,.09,2.17);
  metalRail([lo,outer],[hi,outer],walkY);metalRail([lo,outer],[lo,walkZ],walkY);metalRail([hi,walkZ],[hi,outer],walkY);
  for(const x of[lo+.25,hi-.25])beam3(b,exteriorMetal,[x,-.95,-23.61],[x,walkY-.09,outer+.08],.075);
 }
 b.box(exteriorMetal,podiumAccess.x,podiumAccess.bottom-.045,-24.05,2.15,.09,1.35);
 for(const x of[podiumAccess.x-.78,podiumAccess.x+.78])beam3(b,exteriorMetal,[x,-5.15,-23.61],[x,podiumAccess.bottom-.09,-24.7],.065);
 qa.rehabilitation.rearPodium={sources:['teatro-casa-arquitectura','teatro-foto-2015'],geometry:'Physical openings and narrow metal walkway; small dimensions and placement approximated from the north elevation and photograph, not a measured survey.',openings:podiumOpenings.map(o=>({...o})),walkway:{level:walkY,span:44.3,width:1.04,outerZ:walkZ,railHeight:1.04,projectingLandings:3},approximateMinorDimensions:true};
 plan('escena-posterior-pasarela',[[walkEnds[0],-23.11],[walkEnds[1],-23.11],[walkEnds[1],walkZ],[walkEnds[0],walkZ]],'path','contemporary');
 // The balconies are thin platforms with open metal rails; daylight passes
 // through the upper windows and the lower circulation stays visible.
 const galleryRail=(x0,x1,y,z)=>{b.box(K('escena-posterior','contemporary','rail'),(x0+x1)/2,y+.93,z,x1-x0,.045,.045);for(let x=x0;x<=x1+.01;x+=.42)b.box(K('escena-posterior','contemporary','rail'),x,y+.46,z,.028,.92,.028);};
 b.box(K('escena-posterior','contemporary','concrete'),0,8.17,-16.95,44.4,.26,2.3);galleryRail(-22,22,8.3,-15.80);
 for(const sign of[-1,1]){
  b.box(K('escena-posterior','contemporary','concrete'),sign*12.1,5.49,-17.05,19.8,.22,2.15);galleryRail(sign<0?-22:2.2,sign<0?-2.2:22,5.6,-15.98);
  for(let step=0;step<20;step++){const top=1.2+(step+1)*.22;b.box(K('escena-posterior','contemporary','concrete'),sign*20.85,top-.11,-10.3-step*.28,1.32,.22,.30);}
  for(let step=0;step<12;step++){const top=5.6+(step+1)*.225;b.box(K('escena-posterior','contemporary','concrete'),sign*(21.15-step*.36),top-.115,-16.68,.38,.23,1.25);}
 }
 for(const x of[-19.4,19.4])qa.openings.push({id:'scenic-upper-window-'+x,kind:'scenic-window',localOrigin:[x,15,-17.8],localDirection:[0,0,-1],distance:5.6,width:1.55,height:1.8});
 plan('escena-posterior',[[-26.8,-18],[26.8,-18],[26.8,-23.2],[-26.8,-23.2]],'wall','contemporary');

 // Lateral scenic masses are full-height volumes. Their slight asymmetry and
 // stepped contacts follow the registered plan; their openings are physical.
 for(const spec of[{x:-29.2,z:-15.65,w:13.7,d:17.2},{x:29.1,z:-15.15,w:13.3,d:15.8}]){
  const{x,z,w,d}=spec,k=K('basilicas','contemporary','brick'),sign=Math.sign(x);
  perforatedWall(b,k,{x,z:z+d/2,y0:1.2,y1:crownBase,width:w,depth:.85,openings:[{x:-sign*3.0,width:2.1,bottom:1.2,height:3.7},{x:-sign*3.0,width:1.5,bottom:10.7,height:1.65},{x:-sign*3.0,width:.9,bottom:16.4,height:.95}]});
  crownCap(k,{x,z:z+d/2,width:w,depth:.85});
  perforatedWall(b,k,{x,z:z-d/2,y0:1.2,y1:crownBase,width:w,depth:.85,openings:[{x:0,width:1.1,bottom:10.6,height:1.7}]});
  crownCap(k,{x,z:z-d/2,width:w,depth:.85});
  for(const side of[-1,1]){
   const sideX=x+side*(w/2-.42);
   perforatedWall(b,k,{x:sideX,z,y0:1.2,y1:crownBase,width:d,depth:.85,yaw:PI/2,openings:side===-sign?[{x:0,width:2,bottom:1.2,height:3.5},{x:0,width:1.35,bottom:8.3,height:2.1},{x:0,width:1.05,bottom:14.7,height:1.5}]:[{x:-d*.22,width:.85,bottom:9.8,height:1.2},{x:d*.2,width:.75,bottom:15.8,height:.85}]});
   crownCap(k,{x:sideX,z,width:.85,depth:d});
  }
  for(const y of[1.2,8.3,13.7])b.box(K('basilicas','contemporary','limestone'),x,y-.15,z,w-1.7,.3,d-1.7);
  // The end walls are centred on z +/- d/2: their inner faces are only .425
  // inside, whereas the side-wall inner faces are .845 inside in X. Use those
  // exact faces to close the roof edge, then subtract occupied crown caps.
  crownCap(K('basilicas','contemporary','limestone'),{x,z,width:w-1.69,depth:d-.85},19.9);
  b.box(K('basilicas','mixed','masonry'),x,-3.175,z,w,8.45,d);
  b.box(K('basilicas','contemporary','limestone'),x-sign*3,1.05,z+d/2-.35,2.1,.3,1.1);
  // Exterior steps join the aditus level to the side stage door.
  for(let i=0;i<17;i++)b.box(K('basilicas','contemporary','limestone'),sign*(23.4+i*.49),.22+i*.31,-5.65,.51,.32,1.55,0,.96);
  plan('basilicas',[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]],'wall','contemporary');
 }
 // Two displayed column fragments recall the photographed antiquarium. Their
 // simplified profile and placement do not claim a recovered complete order.
 for(const spec of[{x:9.48,z:-8.98,h:10.8},{x:-20.1,z:-10.0,h:6.2}]){
  const{x,z,h}=spec,k=K('fragmentos','interpretation','limestone');
  b.box(k,x,1.48,z,1,.56,1);
  let y=1.76;for(const fraction of[.38,.23,.39]){const hh=(h-1)*fraction,g=new THREE.CylinderGeometry(.27,.33,hh,16),m=new THREE.Matrix4().makeTranslation(x,y+hh/2,z);b.geometry(k,g,m,.94);g.dispose();y+=hh;b.box(k,x,y,z,.72,.20,.72);y+=.20;}
  b.box(k,x,y+.08,z,.78,.24,.78);
 }
 // Four restrained groups of wall-mounted antiquarium pieces follow the
 // author's frontal photograph. Their plain, irregular silhouettes indicate
 // display fragments; there are no invented inscriptions or copied reliefs.
 const displayGroups=[
  {x:-19.3,y:10.95,pieces:[[-2.1,.22,1.05,.63],[-.8,.52,.77,.87],[.3,.10,1.15,.58],[1.7,.36,.88,.72],[-1.4,1.48,.58,.62]]},
  {x:-7.2,y:10.95,pieces:[[-1.55,.12,.86,.61],[-.25,.25,.68,.82],[1.15,.06,1.0,.56]]},
  {x:5.5,y:10.9,pieces:[[-1.5,.20,.82,.68],[-.25,.12,1.05,.57],[1.15,.34,.74,.88]]},
  {x:17.5,y:11.1,pieces:[[-2.55,.17,1.1,.72],[-1.15,.20,1.22,.66],[.35,.06,1.35,.62],[1.95,.40,1.05,.84],[-2.0,1.22,.64,.63],[.1,1.18,1.1,.54]]}
 ];
 const fragmentKey=K('fragmentos','interpretation','limestone');let fragmentIndex=0;
 for(const g of displayGroups)for(const[dx,dy,w,h]of g.pieces){
  const x=g.x+dx,y=g.y+dy,seed=fragmentIndex++,back=-17.97,front=back+.16+noise(seed)*.12,p=[];
  const shape=[[-w*.5,-h*.42],[w*.42,-h*.5],[w*.5,h*.32],[w*.29,h*.5],[-w*.45,h*.44]];
  for(let i=0;i<shape.length;i++){
   const a=shape[i],z=shape[(i+1)%shape.length];
   p.push(x,y,front,x+a[0],y+a[1],front,x+z[0],y+z[1],front);
   quad(p,[x+a[0],y+a[1],back],[x+z[0],y+z[1],back],[x+z[0],y+z[1],front],[x+a[0],y+a[1],front]);
  }
  b.raw(fragmentKey,p,.84+noise(seed+57)*.13);
 }
 qa.rehabilitation.antiquarium={source:'teatro-casa-arquitectura',wallGroups:displayGroups.map(g=>({center:[g.x,g.y,-17.97],pieces:g.pieces.length})),wallPieces:fragmentIndex,columns:2,representation:'Generic plain fragment silhouettes and display groupings observed in the author photograph; minor positions and dimensions approximate, no reconstructed inscriptions or ornament.'};
 // A broad, pale, shallowly inclined canopy shelters the timber stage. The
 // underside is modelled independently so interior views read the wood and
 // sparse truss structure instead of the roof's exterior metal colour.
 const roofFront=-3.5,roofBack=-23,slope=.075,roofTop=z=>20.2+(z-roofFront)*slope,roofCenter=(roofFront+roofBack)/2,roofAngle=-Math.atan(slope);
 const roofGeo=new THREE.BoxGeometry(52.1,.24,(roofFront-roofBack)/Math.cos(roofAngle)),roofMatrix=new THREE.Matrix4().compose(new THREE.Vector3(0,roofTop(roofCenter)-.12,roofCenter),new THREE.Quaternion().setFromEuler(new THREE.Euler(roofAngle,0,0)),new THREE.Vector3(1,1,1));
 b.geometry(K('cubierta','contemporary','roof'),roofGeo,roofMatrix);roofGeo.dispose();
 for(let z=roofBack+.15;z<roofFront;z+=.49)b.box(K('cubierta','contemporary','timber'),0,roofTop(z)-.31,z,51.6,.18,.17);
 for(let x=-25.5;x<=25.6;x+=4.25){
  beam3(b,K('cubierta','contemporary','timber'),[x,roofTop(roofBack)-.43,roofBack],[x,roofTop(roofFront)-.43,roofFront],.17,.23);
  beam3(b,K('cubierta','contemporary','roof'),[x,roofTop(roofBack)+.025,roofBack],[x,roofTop(roofFront)+.025,roofFront],.025,.04);
 }
 for(const x of[-24.8,-8.22,8.22,24.8]){
  const pz=[-22.3,-18.4,-14.5,-10.6,-6.7,-3.8];
  for(let i=0;i<pz.length-1;i++){
   const a=pz[i],z=pz[i+1],ya=roofTop(a)-.58,yz=roofTop(z)-.58;
   beam3(b,K('cubierta','contemporary','metal'),[x,ya,a],[x,yz,z],.13);
   beam3(b,K('cubierta','contemporary','metal'),[x,ya-.7,a],[x,yz-.7,z],.13);
   beam3(b,K('cubierta','contemporary','metal'),[x,ya-.7,a],[x,yz,z],.09);
  }
 }
 qa.rehabilitation.roof={front:roofFront,back:roofBack,width:52.1,frontTop:20.2,rearTop:roofTop(roofBack),slopeInterpretive:true};
 plan('proscaenium',[[-22,-3],[22,-3],[22,-9.4],[-22,-9.4]],'stage','contemporary');
 plan('cubierta',[[-26.05,roofFront],[26.05,roofFront],[26.05,roofBack],[-26.05,roofBack]],'stage','contemporary');

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

 const environs=appendTheatreEnvirons({batch:b,key:K,plan,localWorld,toLocal,heightAt,base});qa.environs=environs.qa;
 const resources=b.finish(group);group.updateMatrixWorld(true);
 const meshes=group.children.filter(o=>o.isMesh),bounds=new THREE.Box3();
 for(const mesh of meshes)if(!mesh.userData.component.startsWith('entorno-'))bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
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
  if(id==='teatro-conjunto')target.copy(localWorld(0,8,5));
  // Views enter from the open cavea side. Close views remain above architecture
  // and terrain; subsurface stops require the explicit didactic section control.
  let localOffset=id==='teatro-conjunto'?[77,72,92]:[radius*.36,Math.max(18,radius*1.0),Math.max(24,radius*1.45)];
  if(id==='teatro-aditus-oriental')localOffset=[9-x,2.6-y,-.8-z];
  if(id==='teatro-basilicas')localOffset=[29,24,19];
  if(id==='teatro-vomitoria')localOffset=[Math.cos(PI*.38)*21.5-x,10.85-y,Math.sin(PI*.38)*21.5-z];
  if(id==='teatro-portico')localOffset=[17,21,-29];
  if(id==='teatro-summa-cavea')localOffset=[15,18,-23];
  if(id==='teatro-frons-scaenae')localOffset=[8,15,37];
  if(id==='teatro-restauracion')localOffset=[31,27,48];
  if(['teatro-hyposcaenium','teatro-cloaca'].includes(id))localOffset=[9,30,16];
  const rotate=v=>[v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c];
  let localClose=localOffset.map((n,i)=>n*(i===1?.76:.70));
  if(id==='teatro-aditus-oriental')localClose=[12-x,2.5-y,-.8-z];
  if(id==='teatro-vomitoria')localClose=[Math.cos(PI*.38)*23.5-x,10.85-y,Math.sin(PI*.38)*23.5-z];
  const offset=rotate(localOffset),closeOffset=rotate(localClose),interiorView=['teatro-aditus-oriental','teatro-vomitoria'].includes(id);
  if(!interiorView)for(const v of[offset,closeOffset])v[1]=Math.max(v[1],heightAt(target.x+v[0],target.z+v[2])+3-target.y);
  focuses[id]={id,label:source?.title||source?.label||label,regionId,coordinates:geographical(x,z),target,offset,closeOffset,bounds:box,fitBounds:id==='teatro-conjunto',...(interiorView?{interiorView:true,closeScale:false,minDistance:.45,fov:58,localTarget:[x,y,z],eyeLocal:[x+localOffset[0],y+localOffset[1],z+localOffset[2]],nearEyeLocal:[x+localClose[0],y+localClose[1],z+localClose[2]]}:{}),components:COMPONENTS[id],kind:id==='teatro-conjunto'?'overview':'feature',requiresSection:['teatro-hyposcaenium','teatro-cloaca'].includes(id),sourceConfidence:'documented architectural sector; current plans, photographs and archaeological dimensions; registered to OSM and PNOA'};
 }
 // Lower MDT only under the documented theatre envelope. An inner clearance
 // band prevents 2.5 m terrain triangles from poking through the terraced shell.
 function surfaceHeight(x,z,raw){
  const p=toLocal(x,z),r=Math.hypot(p.x,p.z);
  if(p.z>=-2.8&&p.z<2.8&&Math.abs(p.x)<38.4)return Math.min(raw,base-.40);
  if(p.z>=0&&r>24.3&&r<36.1&&vomAngles.some(a=>Math.abs(Math.atan2(p.z,p.x)-a)<2.2/r))return Math.min(raw,base+7.8);
  if(p.z>=0&&r>=33.5&&r<40)return Math.min(raw,base+13.1);
  if(p.z>=0&&r<40.0){
   const shell=r<11.3?-.45:r<18?Math.max(-.45,(r-11.15)*.49/.975-.6):r<25.65?4+(r-18)*.51/.8125:8.5+(r-25.65)*.53/.8722;
   return Math.min(raw,base+shell-1.7);
  }
  if(p.z< -2.8&&p.z> -25.5&&Math.abs(p.x)<37.5)return Math.min(raw,base-7.4);
  return raw;
 }
 let selected=null,readingMode='materials',sectionOpen=false,ground=heightAt;
 const selectionGeo=new THREE.BufferGeometry(),selectionMat=new THREE.LineBasicMaterial({color:'#85d5c8',transparent:true,opacity:.9});
 const marker=new THREE.Line(selectionGeo,selectionMat);marker.name='Parada seleccionada del teatro';marker.visible=false;marker.userData.selectionHelper=true;group.add(marker);resources.materials.push(selectionMat);
 function applyMaterials(){
  const focus=selected?focuses[selected]:null;
  for(const mesh of meshes){
   const d=mesh.userData,m=mesh.material;if(d.component.startsWith('entorno-'))continue;
   const nextMap=readingMode==='periods'?null:d.baseMap;
   if(m.map!==nextMap){m.map=nextMap;m.needsUpdate=true;}m.color.copy(d.baseColor);
   if(readingMode==='periods')m.color.set(COLORS[d.period]);
   const match=focus&&(focus.kind==='overview'||focus.components.includes(d.component));
   m.emissive.set(match?'#397b6f':'#000000');m.emissiveIntensity=match?.17:0;
  }
 }
 function selectFocus(id){
  selected=id&&focuses[id]?id:null;applyMaterials();marker.visible=!!selected&&selected!=='teatro-conjunto';
  if(marker.visible){const focus=focuses[selected],p=group.worldToLocal(focus.target.clone()),positions=[],r=selected==='teatro-orchestra'?7.6:2.15;
   for(let i=0;i<=64;i++){const a=i*TAU/64;positions.push(p.x+Math.cos(a)*r,p.y+.18,p.z+Math.sin(a)*r);}selectionGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));selectionGeo.computeBoundingSphere();
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
  environs.bindGround(group,ground);
  for(const focus of Object.values(focuses)){if(focus.interiorView)continue;for(const v of[focus.offset,focus.closeOffset])v[1]=Math.max(v[1],ground(focus.target.x+v[0],focus.target.z+v[2])+3-focus.target.y);}
  return group;
 }
 qa.drainOpening={id:'cloaca-esquema',localOrigin:[0,-4.85,-3.5],localDirection:[0,0,-1],distance:19,width:1.3,height:1.7};
 for(const opening of [...qa.openings,qa.drainOpening]){opening.origin=localWorld(...opening.localOrigin).toArray();const[x,y,z]=opening.localDirection;opening.direction=[x*c+z*s,y,-x*s+z*c];}
 const stats={stops:Object.keys(focuses).length,components:new Set(meshes.map(m=>m.userData.component)).size,meshes:meshes.length,triangles:meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count/3,0),seatingRows:23,senatorialRows:2,upperRestitutedRows:4,trueOpenPassages:qa.openings.filter(o=>!o.kind.includes('window')).length,checkedOpenings:qa.openings.length,cartographicOutline:true,undergroundReconstruction:'schematic',sourceKeys:[...new Set(['teatro-arqueologia-1993','teatro-estructura-1986','teatro-portaceli-1993','teatro-proyecto-1993','teatro-casa-arquitectura','teatro-foto-2015','teatro-almagro-1979','teatro-osm',...environs.qa.sourceKeys])],periods:PERIODS.map(p=>p.id)};
 const footprint=data.theatrePolygon?.length?data.theatrePolygon: [...ringPlan(0,42.7),[-27,-23],[27,-23]].map(([x,z])=>geographical(x,z));
 group.userData={id:'theatre',label:'Teatro Romano de Sagunto',interpretation:true,cartographicOutline:true,ownedResources:resources,layout:{center:CENTER,worldCenter:center,base,yaw:YAW},surfaceHeight,environs,vegetationExclusions:environs.vegetationExclusions,visit:{focuses,bounds,stats,periods:PERIODS,selectFocus,setReadingMode,setSection,bindGround,getState:()=>({selected,readingMode,sectionOpen}),qa,plan:{outline:footprint,components:planComponents,center:CENTER,yaw:YAW},metadata:{state:'Conserved and rehabilitated state informed by the authors\' drawings and post-intervention photographs; this is not a new measured survey.',elevations:'Project-relative +1.20 stage and +20.20 crowns; terrain registration and smaller profiles remain approximate.',fabric:'The pale central seating shell is distinguished from exposed, consolidated masonry; irregular fragments are not individually surveyed.',section:'Didactic removal of the contemporary canopy and stage deck. Archaeological substructures are schematic, not a surveyed or accessible interior.',ancientScenicFacade:'Not reconstructed as a complete Roman elevation.',historicalReference:'Almagro 1979 records the pre-intervention fabric; it is a reference for interpretation, not a complete ancient reconstruction.',registration:'Circle fit to 20 OSM cavea points and stage orientation checked against PNOA; this is not survey-grade georeferencing.'}}};
 return group;
}

export const theatreRegistration={center:CENTER,yaw:YAW};

// Internal OSM circulation is rebuilt with the architecture; do not extrude it
// a second time as roads over the seats. External approach streets remain mapped.
export const theatreRoadIds=new Set(['733413579','733413580','733413581',...Array.from({length:23},(_,i)=>String(733418145+i)),'1499124508',...theatreEnvironsRoadIds]);
export const theatreBuildingIds=new Set(['203140142','cat-3556901YJ3935N_part1-0','cat-3556901YJ3935N_part2-0']);
