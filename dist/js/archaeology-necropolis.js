import * as THREE from 'three';

// Evidence and limits are part of the site record, not hidden in the rendering.
// Real geographic anchors: OSM cemetery polygon and GeoSefarad's hypogeum point.
// Tomb arrangement / chamber dimensions are explicitly typological, NOT a survey.
const TAU=Math.PI*2,IDENTITY=new THREE.Matrix4(),UP=new THREE.Vector3(0,1,0);
const rand=n=>{const v=Math.sin(n*127.17+78.71)*43758.5453;return v-Math.floor(v);};
let palette;
function texture(kind){
 const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');
 q.fillStyle=kind==='earth'?'#9c8264':kind==='wood'?'#73624b':'#aaa28e';q.fillRect(0,0,512,512);
 if(kind==='rock')for(let r=0;r<43;r++){
  const y=r*12+rand(r)*5;q.fillStyle=`rgba(${120+rand(r+21)*55},${111+rand(r+11)*50},${91+rand(r+81)*43},.45)`;q.fillRect(0,y,512,3+rand(r+12)*4);
  q.strokeStyle='rgba(52,51,43,.18)';q.lineWidth=.6+rand(r+93)*1.4;q.beginPath();q.moveTo(0,y);for(let x=0;x<=512;x+=32)q.lineTo(x,y+Math.sin(x*.03+r)*2);q.stroke();
 }
 if(kind==='wood')for(let x=0;x<512;x+=13){q.fillStyle='rgba(29,24,17,.18)';q.fillRect(x,0,1+rand(x)*2,512);}
 for(let i=0;i<8500;i++){const v=rand(i+17);q.fillStyle=v>.55?'rgba(248,235,205,.08)':'rgba(32,31,25,.12)';q.fillRect(rand(i+81)*512,rand(i+921)*512,1+rand(i+221)*3,.7+rand(i)*2);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function materials(){
 if(palette)return palette;const stone=texture('rock'),earth=texture('earth'),wood=texture('wood');
 const defs={rock:['#b8b19f',stone],stone:['#d4c6a9',stone],earth:['#ad8965',earth],old:['#aa9c7b',earth],dark:['#59564a',stone],wood:['#83715a',wood],iron:['#68564b',null],leaf:['#5d7054',null]};
 palette={};for(const[k,[color,map]]of Object.entries(defs))palette[k]=new THREE.MeshStandardMaterial({color,map,roughness:k==='iron'?.73:.99,vertexColors:true,side:THREE.DoubleSide,bumpMap:map,bumpScale:k==='rock'?.09:.035});return palette;
}
class Batch{
 constructor(){this.parts=new Map();this.cube=new THREE.BoxGeometry(1,1,1);}
 geom(kind,geometry,matrix=IDENTITY,tint=1){
  const g=geometry.index?geometry.toNonIndexed():geometry;if(!g.attributes.normal)g.computeVertexNormals();
  let out=this.parts.get(kind);if(!out){out={p:[],n:[],uv:[],c:[]};this.parts.set(kind,out);}
  const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),nv=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(matrix),col=Array.isArray(tint)?tint:[tint,tint,tint];
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);nv.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();out.p.push(v.x,v.y,v.z);out.n.push(nv.x,nv.y,nv.z);out.c.push(...col);const ax=Math.abs(nv.x),ay=Math.abs(nv.y),az=Math.abs(nv.z);out.uv.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/2.8,(ay>ax&&ay>az?v.z:v.y)/2.8);}
  if(g!==geometry)g.dispose();
 }
 raw(kind,p,tint=1){if(!p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();this.geom(kind,g,IDENTITY,tint);g.dispose();}
 box(kind,x,y,z,w,h,d,yaw=0,tint=1){const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw,0)),new THREE.Vector3(w,h,d));this.geom(kind,this.cube,m,tint);}
 beam(kind,a,b,r=.025,tint=1){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va),g=new THREE.CylinderGeometry(r,r,d.length(),6),m=new THREE.Matrix4().compose(va.add(vb).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,d.normalize()),new THREE.Vector3(1,1,1));this.geom(kind,g,m,tint);g.dispose();}
 finish(name){const group=new THREE.Group();group.name=name;for(const[k,b]of this.parts){const g=new THREE.BufferGeometry();for(const[a,array,size]of[['position',b.p,3],['normal',b.n,3],['uv',b.uv,2],['color',b.c,3]])g.setAttribute(a,new THREE.Float32BufferAttribute(array,size));g.computeBoundingBox();g.computeBoundingSphere();const mesh=new THREE.Mesh(g,materials()[k]);mesh.name=`${name} · ${k}`;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}this.cube.dispose();return group;}
}
function quad(p,a,b,c,d){p.push(...a,...b,...c,...a,...c,...d);}
function inside(x,z,poly){let b=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>z)!==(poly[j][1]>z)&&x<(poly[j][0]-poly[i][0])*(z-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])b=!b;return b;}
function surface(batch,kind,outline,holes,y,tint=1){
 const outer=outline.map(p=>new THREE.Vector2(...p)),inners=holes.map(h=>h.map(p=>new THREE.Vector2(...p))),vertices=[...outline,...holes.flat()],triangles=THREE.ShapeUtils.triangulateShape(outer,inners),p=[];
 function emit(a,b,c,level=0){const edges=[[a,b,c],[b,c,a],[c,a,b]].map(e=>({e,length:Math.hypot(e[0][0]-e[1][0],e[0][1]-e[1][1])})).sort((u,v)=>v.length-u.length);if(typeof y==='function'&&edges[0].length>.70&&level<18){const[u,v,w]=edges[0].e,m=[(u[0]+v[0])/2,(u[1]+v[1])/2];emit(u,m,w,level+1);emit(m,v,w,level+1);return;}for(const[x,z]of[a,b,c])p.push(x,typeof y==='function'?y(x,z):y,z);}
 for(const tri of triangles)emit(...tri.map(i=>vertices[i]));batch.raw(kind,p,tint);
}
function skirt(batch,poly,top,bottom,kind='earth',tint=1){const p=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ay=typeof top==='function'?top(...a):top,by=typeof top==='function'?top(...b):top,ab=typeof bottom==='function'?bottom(...a):bottom,bb=typeof bottom==='function'?bottom(...b):bottom;quad(p,[a[0],ay,a[1]],[b[0],by,b[1]],[b[0],bb,b[1]],[a[0],ab,a[1]]);}batch.raw(kind,p,tint);}
function stone(batch,x,y,z,w,h,d,seed,kind='stone',yaw=0){
 // Beveled, individually chipped stone, not a dark line painted on a solid box.
 const points=[[-.5,-.34],[-.34,-.5],[.34,-.5],[.5,-.34],[.5,.34],[.34,.5],[-.34,.5],[-.5,.34]].map(([a,b],i)=>[a*w*(.84+rand(seed+i)*.30),b*d*(.84+rand(seed+i+40)*.30)]),lo=[],hi=[];
 for(let i=0;i<8;i++){const[a,b]=points[i],co=Math.cos(yaw),si=Math.sin(yaw);lo.push([x+a*co+b*si,y-h/2,z-a*si+b*co]);hi.push([x+a*.89*co+b*.89*si,y+h/2+(rand(seed+i+80)-.5)*h*.2,z-a*.89*si+b*.89*co]);}
 const p=[];for(let i=1;i<7;i++){p.push(...lo[0],...lo[i+1],...lo[i],...hi[0],...hi[i],...hi[i+1]);}for(let i=0;i<8;i++)quad(p,lo[i],lo[(i+1)%8],hi[(i+1)%8],hi[i]);batch.raw(kind,p,.77+rand(seed+420)*.25);
}
function pitPolygon(x,z,w,length){return[[x-w*.39,z-length*.5],[x+w*.39,z-length*.5],[x+w*.53,z+length*.44],[x+w*.34,z+length*.5],[x-w*.34,z+length*.5],[x-w*.53,z+length*.44]];}
function tomb(body,lids,t,{buried=false}={}){
 const{x,z,w,length,y,seed}=t,poly=pitPolygon(x,z,w,length),floor=y-.77;
 surface(body,'dark',poly,[],floor,.82);skirt(body,poly,y+.08,floor,'old',.75);
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),count=Math.max(1,Math.ceil(len/.42)),yaw=Math.atan2(-dz,dx);
  for(let r=0;r<3;r++)for(let j=0;j<count;j++){const f=(j+.5)/count;stone(body,a[0]+dx*f,floor+.14+r*.255,a[1]+dz*f,len/count*.98,.245,.24,seed+r*100+i*11+j,'stone',yaw);}
 }
 // No bones: the architectural cavity remains readable with the cover lifted.
 if(buried)return;
 const count=3+seed%2;for(let j=0;j<count;j++){const zz=z-length/2+(j+.5)*length/count,ww=w*(.83+.22*j/(count-1));stone(lids,x+(rand(seed+j+81)-.5)*.08,y+.20+(rand(seed+j+29)-.5)*.055,zz,ww+.26,.27,length/count*.98,seed+600+j,'stone',(rand(seed+j+9)-.5)*.07);}
}
function railing(batch,points,ground){for(let i=0;i<points.length;i++){const[x,z]=points[i],y=ground(x,z);batch.beam('iron',[x,y,z],[x,y+.83,z],.025);if(i){const[a,c]=points[i-1],ay=ground(a,c);batch.beam('iron',[a,ay+.79,c],[x,y+.79,z],.022);batch.beam('iron',[a,ay+.39,c],[x,y+.39,z],.016);}}}
function scatter(batch,poly,ground,seed,count){const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]),x0=Math.min(...xs),z0=Math.min(...zs),w=Math.max(...xs)-x0,d=Math.max(...zs)-z0;for(let i=0;i<count;i++){const x=x0+rand(i+seed)*w,z=z0+rand(i+seed+171)*d;if(!inside(x,z,poly))continue;const y=ground(x,z);if(i%7===0){const p=[];for(let n=0;n<3;n++){const a=n*Math.PI/3+.3,r=.08+rand(i)*.11,h=.13+rand(i+21)*.15;p.push(x-Math.cos(a)*r,y,z-Math.sin(a)*r,x+Math.cos(a)*r,y,z+Math.sin(a)*r,x,y+h,z);}batch.raw('leaf',p,.85+rand(i)*.15);}else stone(batch,x,y+.025,z,.035+rand(i+2)*.07,.04,.045+rand(i)*.09,i+seed,'rock');}}
function surfacePatch(batch,rect,ground,holes=[],kind='earth'){
 const{center:{x,z},width,depth}=rect,outline=[[x-width/2,z-depth/2],[x+width/2,z-depth/2],[x+width/2,z+depth/2],[x-width/2,z+depth/2]];
 surface(batch,kind,outline,holes,ground);return outline;
}
function cemetery(point,heightAt,footprint){
 const{x,z}=point,flatZones=[],top=(a,b)=>{let y=heightAt(a,b)+.075;for(const t of flatZones){const dx=Math.max(0,Math.abs(a-t.x)-t.w*.57),dz=Math.max(0,Math.abs(b-t.z)-t.length*.53),dist=Math.hypot(dx,dz);if(dist<.45){const f=1-dist/.45;y=y*(1-f)+t.y*f;}}return y;},cut={center:{x,z},width:25,depth:17,yaw:0,floorY:Math.min(...[[-12.5,-8.5],[12.5,-8.5],[12.5,8.5],[-12.5,8.5]].map(([dx,dz])=>heightAt(x+dx,z+dz)))-2};
 const remain=new Batch(),restored=new Batch(),cover=new Batch(),historicCover=new Batch();
 const positions=[[-8,2.45,1.02,2.18],[-5.3,2.35,.91,2.10],[-2.6,2.20,1.00,2.20],[.1,2.0,.84,1.85],[2.8,.15,.98,2.12],[5.6,-1.45,.90,2.03],[8.2,-3.15,.81,1.84],[-7.1,-.05,.68,1.45],[-4.2,-.10,.91,2.00],[-1.3,-.12,.82,1.87],[2.0,-2.70,.90,2.03],[5.1,-4.05,.75,1.62]];
 const tombs=positions.map(([dx,dz,w,length],i)=>({x:x+dx,z:z+dz,w,length,y:top(x+dx,z+dz),seed:1000+i*121}));
 flatZones.push(...tombs);
 const holes=tombs.map(t=>pitPolygon(t.x,t.z,t.w,t.length));
 const outline=surfacePatch(remain,cut,top,holes);surfacePatch(restored,cut,top,holes);
 for(let layer=0;layer<4;layer++){const a=(xx,zz)=>top(xx,zz)-layer*.40,b=(xx,zz)=>top(xx,zz)-(layer+1)*.4;skirt(remain,outline,a,b,layer<2?'earth':'old',.91-layer*.08);skirt(restored,outline,a,b,layer<2?'earth':'old',.91-layer*.08);}
 skirt(remain,outline,(xx,zz)=>top(xx,zz)-1.6,cut.floorY,'rock',.78);skirt(restored,outline,(xx,zz)=>top(xx,zz)-1.6,cut.floorY,'rock',.78);
 for(const t of tombs){tomb(remain,cover,t);tomb(restored,historicCover,t);}
 // A small exposed section of the older level illustrates the published sequence.
 // Its position and thickness are illustrative, not an excavator's measured section.
 for(let i=0;i<3;i++){const xx=x-7+i*3.25,zz=z-7.45,yy=top(xx,zz)-1.1;stone(remain,xx,yy,zz,2.4,.20,.40,9001+i);stone(restored,xx,yy,zz,2.4,.20,.40,9001+i);for(let r=0;r<2;r++){stone(remain,xx-1.05,yy-.30-r*.26,zz,.3,.23,.35,9021+i+r);stone(remain,xx+1.05,yy-.30-r*.26,zz,.3,.23,.35,9041+i+r);stone(restored,xx-1.05,yy-.30-r*.26,zz,.3,.23,.35,9021+i+r);stone(restored,xx+1.05,yy-.30-r*.26,zz,.3,.23,.35,9041+i+r);}}
 const path=[[x-11.7,z+5.8],[x-7,z+6.1],[x-2,z+6.2],[x+3,z+3.8],[x+7,z+.7],[x+10.5,z-2],[x+10.8,z-6.6]],rail=[];
 for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],dx=b[0]-a[0],dz=b[1]-a[1],n=Math.ceil(Math.hypot(dx,dz)/1.2),nx=-dz/Math.hypot(dx,dz)*.6,nz=dx/Math.hypot(dx,dz)*.6;for(let j=0;j<n;j++){const f=j/n,g=(j+1)/n,poly=[[a[0]+dx*f-nx,a[1]+dz*f-nz],[a[0]+dx*g-nx,a[1]+dz*g-nz],[a[0]+dx*g+nx,a[1]+dz*g+nz],[a[0]+dx*f+nx,a[1]+dz*f+nz]];surface(remain,'old',poly,[],(xx,zz)=>top(xx,zz)+.045,.98);rail.push([a[0]+dx*f+nx,a[1]+dz*f+nz]);}}
 railing(remain,rail,top);scatter(remain,outline,top,1700,170);scatter(restored,outline,top,1700,90);
 const remains=remain.finish('Cementerio · vestigios y acondicionamiento actual'),reconstruction=restored.finish('Cementerio · restitución tipológica XIV–XV'),currentLids=cover.finish('Cementerio · losas conservadas'),historicalLids=historicCover.finish('Cementerio · cubiertas restituidas');remains.add(currentLids);reconstruction.add(historicalLids);
 remains.userData.evidence='Fosas y material documentados; distribución y dimensiones aproximadas.';reconstruction.userData.period='Siglos XIV–XV';
 const focus={id:'cementerio',label:'Cementerio · fosas y losas',point:new THREE.Vector3(x,top(x,z)+.45,z),cut,views:{offset:[-23,28,-31],closeOffset:[-12,17,-18]},remains,reconstruction,cutObjects:[{object:currentLids,rise:3.1,fade:.80},{object:historicalLids,rise:3.1,fade:.80}],interpretation:'El corte muestra una muestra tipológica y dos niveles. Las posiciones individuales y el espesor de relleno son aproximados.'};
 return {focus,tombCount:tombs.length,footprint};
}
function chamber(batch,{x,z,width,depth,floor,seed,niche=false}){
 const doorway=1.0,doorHeight=1.70,top=floor+2.15,west=x-depth/2,east=x+depth/2,north=z-width/2,south=z+width/2;
 const outline=[[west,north],[east,north],[east,south],[west,south]];surface(batch,'rock',outline,[],floor,.75);
 function panel(a,b,base,cap,localSeed){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),cols=Math.max(2,Math.ceil(len/.30)),rows=6,p=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const make=(u,v)=>{const f=u/cols,t=v/rows,n=(v===0||v===rows)?0:(rand(localSeed+u+v*33)-.5)*.07;return[a[0]+(b[0]-a[0])*f,base+(cap-base)*t+n,a[1]+(b[1]-a[1])*f];};quad(p,make(c,r),make(c+1,r),make(c+1,r+1),make(c,r+1));}batch.raw('rock',p,.79+rand(localSeed)*.13);}
 panel([west,north],[west,z-doorway/2],floor,top,seed);panel([west,z+doorway/2],[west,south],floor,top,seed+1);panel([west,z-doorway/2],[west,z+doorway/2],floor+doorHeight,top,seed+2);
 panel([west,north],[east,north],floor,top,seed+3);panel([west,south],[east,south],floor,top,seed+4);
 if(niche){const nw=.95,nh=.8,ny=floor+.55;panel([east,north],[east,z-nw/2],floor,top,seed+5);panel([east,z+nw/2],[east,south],floor,top,seed+6);panel([east,z-nw/2],[east,z+nw/2],floor,ny,seed+7);panel([east,z-nw/2],[east,z+nw/2],ny+nh,top,seed+8);const recess=east+.42,p=[];quad(p,[east,ny,z-nw/2],[recess,ny,z-nw/2],[recess,ny+nh,z-nw/2],[east,ny+nh,z-nw/2]);quad(p,[east,ny,z+nw/2],[recess,ny,z+nw/2],[recess,ny+nh,z+nw/2],[east,ny+nh,z+nw/2]);quad(p,[east,ny,z-nw/2],[east,ny,z+nw/2],[recess,ny,z+nw/2],[recess,ny,z-nw/2]);quad(p,[east,ny+nh,z-nw/2],[east,ny+nh,z+nw/2],[recess,ny+nh,z+nw/2],[recess,ny+nh,z-nw/2]);quad(p,[recess,ny,z-nw/2],[recess,ny,z+nw/2],[recess,ny+nh,z+nw/2],[recess,ny+nh,z-nw/2]);batch.raw('dark',p,.83);}
 else panel([east,north],[east,south],floor,top,seed+5);
 // Entrances are genuinely open tunnels through the cliff face.
 const hall=[[west-1.1,z-doorway/2],[west,z-doorway/2],[west,z+doorway/2],[west-1.1,z+doorway/2]];surface(batch,'rock',hall,[],floor,.86);panel(hall[0],hall[1],floor,floor+doorHeight,seed+18);panel(hall[3],hall[2],floor,floor+doorHeight,seed+19);
 return {outline,west,top,doorway,doorHeight};
}
function facade(batch,x,zmin,zmax,bottom,top,doors){
 const outer=[[zmin,bottom],[zmax,bottom],[zmax,top-.15],[zmax-1,top+.22],[zmin+1,top+.1],[zmin,top-.14]],holes=doors.map(({z,w,h,floor})=>[[z-w/2,floor],[z-w/2-.05,floor+h*.70],[z-w*.38,floor+h],[z+w*.34,floor+h+.04],[z+w/2+.04,floor+h*.76],[z+w/2,floor]]),v=[...outer,...holes.flat()],tri=THREE.ShapeUtils.triangulateShape(outer.map(p=>new THREE.Vector2(...p)),holes.map(h=>h.map(p=>new THREE.Vector2(...p)))),p=[];
 function rough(zz,yy){const nearDoor=doors.some(d=>Math.abs(zz-d.z)<d.w*.70&&yy<d.floor+d.h+.15);return x+(nearDoor?0:-.06-.12*Math.sin(zz*2.5+yy*.7)-.055*Math.sin(yy*18+zz*.4));}
 function emit(a,b,c,level=0){const edges=[[a,b,c],[b,c,a],[c,a,b]].map(e=>({e,length:Math.hypot(e[0][0]-e[1][0],e[0][1]-e[1][1])})).sort((u,v)=>v.length-u.length);if(edges[0].length>.22&&level<16){const[u,w,t]=edges[0].e,m=[(u[0]+w[0])/2,(u[1]+w[1])/2];emit(u,m,t,level+1);emit(m,w,t,level+1);return;}for(const[zz,yy]of[a,b,c])p.push(rough(zz,yy),yy,zz);}
 for(const t of tri)emit(...t.map(i=>v[i]));batch.raw('rock',p,.91);
 for(const h of holes)for(let j=0;j<h.length;j++){const a=h[j],b=h[(j+1)%h.length],q=[];quad(q,[x,a[1],a[0]],[x+.44,a[1],a[0]],[x+.44,b[1],b[0]],[x,b[1],b[0]]);batch.raw('rock',q,.81);}
}
function rockLid(batch,poly,bottom,top,seed){
 const t=(x,z)=>Math.max(bottom+.45,top(x,z));surface(batch,'rock',poly,[],t,.95);skirt(batch,poly,t,bottom,'rock',.86);surface(batch,'rock',poly,[],bottom,.77);
 // Fine strata on the exposed section remain visible as the whole roof rises.
 for(let band=1;band<=4;band++){const line=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ya=bottom+(t(...a)-bottom)*band/5,yb=bottom+(t(...b)-bottom)*band/5;quad(line,[a[0],ya,a[1]],[b[0],yb,b[1]],[b[0],yb+.025,b[1]],[a[0],ya+.025,a[1]]);}batch.raw('dark',line,.95);}
}
function hypogea(point,heightAt){
 const{x,z}=point,ground=heightAt(x,z),floor=ground-1.6,cliffX=x-4.65,cut={center:{x:x+.2,z},width:15.8,depth:12.4,yaw:0,floorY:floor-1.2};
 const remain=new Batch(),restored=new Batch(),cover=new Batch(),hCover=new Batch(),spec=new Batch();
 const sections=[{x:x-1.55,z:z-3.35,width:2.5,depth:3.9,floor,seed:400,niche:false},{x:x-1.65,z:z-.05,width:2.25,depth:3.7,floor:floor+.12,seed:500,niche:true},{x:x-2.65,z:z+3.1,width:2.4,depth:1.7,floor:floor+.06,seed:600,niche:false}];
 const holes=[],doors=[];
 for(const s of sections){const d=chamber(remain,s);chamber(restored,s);holes.push(d.outline);doors.push({z:s.z,w:d.doorway,h:d.doorHeight,floor:s.floor});rockLid(cover,d.outline,d.top,(xx,zz)=>heightAt(xx,zz)+.18,s.seed);rockLid(hCover,d.outline,d.top,(xx,zz)=>Math.max(d.top+.40,heightAt(xx,zz)+.08),s.seed);stone(remain,d.west-.65,s.floor+.05,s.z,1.2,.12,1.1,s.seed+82,'rock');stone(restored,d.west-.65,s.floor+.05,s.z,1.2,.12,1.1,s.seed+82,'rock');}
 const outer=[[cliffX,z-5.35],[x+4.5,z-5.35],[x+5.6,z-4.3],[x+5.6,z+5.4],[cliffX,z+5.4]],roofTop=(xx,zz)=>Math.max(floor+2.55,heightAt(xx,zz)+.13)+Math.sin(xx*3.7+zz*1.2)*.055+Math.sin(zz*5.2)*.025;
 // The connective rock web has the same holes as the removable chamber roofs.
 surface(remain,'rock',outer,holes,roofTop,.91);surface(restored,'rock',outer,holes,roofTop,.91);
 const floorOutline=[[x-7.5,z-5.7],[x+5.6,z-5.7],[x+5.6,z+5.7],[x-7.5,z+5.7]];
 surface(remain,'old',floorOutline,[],floor-.08,.92);surface(restored,'old',floorOutline,[],floor-.08,.92);skirt(remain,floorOutline,floor-.08,cut.floorY,'rock',.82);skirt(restored,floorOutline,floor-.08,cut.floorY,'rock',.82);
 facade(remain,cliffX,z-5.35,z+5.4,floor-.06,floor+2.58,doors);facade(restored,cliffX,z-5.35,z+5.4,floor-.06,floor+2.58,doors);
 for(const b of[remain,restored]){const p=[];quad(p,[x+5.6,floor-.07,z-5.35],[x+5.6,roofTop(x+5.6,z-5.35),z-5.35],[x+5.6,roofTop(x+5.6,z+5.4),z+5.4],[x+5.6,floor-.07,z+5.4]);quad(p,[cliffX,floor-.07,z-5.35],[cliffX,roofTop(cliffX,z-5.35),z-5.35],[x+5.6,roofTop(x+5.6,z-5.35),z-5.35],[x+5.6,floor-.07,z-5.35]);quad(p,[cliffX,floor-.07,z+5.4],[cliffX,roofTop(cliffX,z+5.4),z+5.4],[x+5.6,roofTop(x+5.6,z+5.4),z+5.4],[x+5.6,floor-.07,z+5.4]);b.raw('rock',p,.90);}
 // Exposed bedding is continuous rock; never imply a medieval masonry façade.
 for(let r=0;r<20;r++){const line=[];for(let j=0;j<65;j++){const zz=z-5.22+j*.16,yy=floor+.10+r*.12+Math.sin(zz*2+r)*.025;if(doors.some(d=>Math.abs(zz-d.z)<d.w*.70&&yy<d.floor+d.h+.13))continue;const xx=cliffX-.065-.12*Math.sin(zz*2.5+yy*.7)-.055*Math.sin(yy*18+zz*.4);quad(line,[xx,yy,zz],[xx,yy+.012,zz],[xx,yy+.014,zz+.15],[xx,yy+.002,zz+.15]);}remain.raw('dark',line,.82);restored.raw('dark',line,.82);}
 for(let j=0;j<4;j++){const xx=x-6.85+j*.43,yy=floor-.05-(3-j)*.21;for(const b of[remain,restored])stone(b,xx,yy-.08,z+.1,.45,.25,1.45,6200+j,'rock');}
 const walkway=[[x-7.1,z-5.4],[x-7.1,z-2.8],[x-7.1,z],[x-7.1,z+2.8],[x-7.1,z+5.4]];railing(remain,walkway,()=>floor+.02);
 scatter(remain,outer,roofTop,8700,100);scatter(restored,outer,roofTop,8700,70);
 // One modest blocking slab is hypothetical: the source does not fix closures.
 stone(spec,cliffX-.18,floor+.65,z-3.35,.22,1.22,.96,9201,'stone');
 const remains=remain.finish('Hipogeos · roca y cámaras interpretativas'),reconstruction=restored.finish('Hipogeos · posible uso funerario'),lids=cover.finish('Hipogeos · techos de roca desmontables'),historicalLids=hCover.finish('Hipogeos · techos históricos interpretados'),hypotheses=spec.finish('Hipogeo · cierre hipotético sin inscripción');remains.add(lids);reconstruction.add(historicalLids);hypotheses.visible=false;
 remains.userData.evidence='Entradas según imagen municipal; cámaras, hornacina y cotas son un esquema de interpretación.';reconstruction.userData.period='Hipótesis de uso funerario; datación de cada cavidad no establecida.';
 const focus={id:'hipogeos',label:'Hipogeos · interior interpretativo',point:new THREE.Vector3(x-1.8,floor+1.2,z),cut,views:{offset:[-21,19,-21],closeOffset:[-13,12,-12]},remains,reconstruction,hypotheses,cutObjects:[{object:lids,rise:4.5,fade:.82},{object:historicalLids,rise:4.5,fade:.82}],interpretation:'Emplazamiento de visita aproximado. El interior representa tipologías descritas; no corresponde a una planta arqueológica levantada.'};
 return {focus,chambers:3};
}
export function createNecropolisArchaeology({heightAt,project,records={}}){
 const record=Array.isArray(records)?records.find(r=>r.id==='necropolis'):records.necropolis||{},cem=project(...(record.coordinate||[-.2794151,39.67643805])),hyp=project(...(record.secondaryLocations?.[0]?.coordinate||[-.2771781,39.6766811]));
 const a=cemetery(cem,heightAt,record.footprint||[]),b=hypogea(hyp,heightAt),group=new THREE.Group(),remains=new THREE.Group(),reconstruction=new THREE.Group(),hypotheses=new THREE.Group();group.name='Arqueología · necrópolis y cavidades';group.userData.id='necropolis';remains.name='Necrópolis · estado conservado';reconstruction.name='Necrópolis · vista histórica';hypotheses.name='Necrópolis · hipótesis explícitas';
 for(const f of[a.focus,b.focus]){remains.add(f.remains);reconstruction.add(f.reconstruction);if(f.hypotheses){f.hypotheses.visible=true;hypotheses.add(f.hypotheses);}}
 reconstruction.visible=false;hypotheses.visible=false;group.add(remains,reconstruction,hypotheses);
 for(const f of[a.focus,b.focus])for(const entry of f.cutObjects){entry.object.userData.baseY=entry.object.position.y;entry.object.userData.cutRise=entry.rise;entry.object.userData.cutFade=entry.fade;entry.object.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.transparent=true;}});}
 let meshes=0,triangles=0;group.traverse(m=>{if(m.isMesh){meshes++;triangles+=m.geometry.attributes.position.count/3;}});
 const site={id:'necropolis',group,remains,reconstruction,hypotheses,point:a.focus.point,views:a.focus.views,cut:a.focus.cut,historicalMask:a.focus.cut,focuses:[a.focus,b.focus],cutObjects:[...a.focus.cutObjects,...b.focus.cutObjects],stats:{meshes,triangles,surfaceTombs:a.tombCount,representativeChambers:b.chambers,geographicFocuses:2,interpretiveGeometry:true,minimumFloorY:Math.min(a.focus.cut.floorY,b.focus.cut.floorY)}};
 return {group,sites:{necropolis:site}};
}
