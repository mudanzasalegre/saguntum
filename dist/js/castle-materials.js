import * as THREE from 'three';

// Original textures. They describe families of surviving construction, without
// assigning an archaeological date to a wall from its colour alone.
const fract=n=>n-Math.floor(n);
const rand=n=>fract(Math.sin(n*127.13+43.7)*43758.5453);
const mod=(n,m)=>(n%m+m)%m;
export const CASTLE_TEXTURE_METRES={stone:[4.8,3.2],rubble:[3.8,2.9],tapial:[5.5,3.1],ashlar:[4.8,3.2],brick:[2.6,2.0],paving:[9.2,9.2],path:[2.1,2.1],tile:[2.3,2.7]};

export function createCastleTexture(kind){
 const width=256,height=256,data=new Uint8Array(width*height*4);
 const rubble=kind==='stone'||kind==='rubble';
 // A wrapped, jittered field gives small irregular stones and uneven courses.
 // Unlike a rectangular brick bitmap it does not turn every curtain into ashlar.
 const cells=[];
 // Sparse worn limestone fragments in an earth/gravel matrix. This is the
 // visible excavation surface, not a reinstated Roman paving grid.
 const fragments=kind==='paving'?Array.from({length:7},(_,i)=>({x:rand(i*31+2),y:rand(i*47+9),a:.028+rand(i*17+4)*.035,b:.022+rand(i*23+8)*.023,angle:rand(i+3)*Math.PI})):[];
 if(rubble)for(let row=0;row<8;row++)for(let col=0;col<9;col++){
  const seed=row*91+col*17;
  cells.push({x:(col+.16+rand(seed)*.65+(row%2)*.46)/9,y:(row+.16+rand(seed+7)*.65)/8,v:.70+rand(seed+19)*.27});
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,grain=rand(x+y*width)*.075;
  let value=.88,red=1,green=.99,blue=.96;
  if(rubble){
   let d1=Infinity,d2=Infinity,stone=.82;
   for(const cell of cells){const dx=Math.min(Math.abs(u-cell.x),1-Math.abs(u-cell.x)),dy=Math.min(Math.abs(v-cell.y),1-Math.abs(v-cell.y)),d=dx*dx+dy*dy*1.3;if(d<d1){d2=d1;d1=d;stone=cell.v;}else if(d<d2)d2=d;}
   const seam=Math.max(0,1-(d2-d1)/.00058);
   value=stone+grain-seam*.24;
   // Light lime pointing, occasional darker siliceous fragments and weathering.
   const weather=(Math.sin(x*.051+y*.023)+Math.sin(x*.017-y*.071))*.025;
   value+=weather;green=.97;blue=.91;
  }else if(kind==='tapial'){
   const course=Math.floor(v*7),horizontal=mod(v*7,1),lift=horizontal<.025;
   const holes=mod(u*10+(course%2)*.5,1)<.055&&Math.abs(horizontal-.51)<.032;
   value=.82+rand(course*29)*.07+grain+(Math.sin(x*.032+y*.07)*.027)-(lift?.055:0)-(holes?.22:0);green=.97;blue=.88;
  }else if(kind==='paving'){
   const field=Math.sin(u*Math.PI*2+Math.sin(v*Math.PI*4)*.6)*.022+Math.sin(v*Math.PI*2-u*Math.PI*4)*.018;
   value=.80+grain*1.65+field+(rand(Math.floor(x/2)+Math.floor(y/2)*131)-.5)*.09;
   green=.99;blue=.95;
   for(const fragment of fragments){
    let dx=u-fragment.x,dy=v-fragment.y;dx-=Math.round(dx);dy-=Math.round(dy);
    const c=Math.cos(fragment.angle),s=Math.sin(fragment.angle),fx=(dx*c+dy*s)/fragment.a,fy=(-dx*s+dy*c)/fragment.b;
    const edge=Math.pow(Math.abs(fx),3)+Math.pow(Math.abs(fy),3),worn=1+.13*Math.sin(fx*9+fy*7);
    if(edge<worn){value=.84+grain*.55+(edge>.76?-.035:0);green=1;blue=.985;}
   }
  }else if(kind==='ashlar'||kind==='brick'){
   const rows=kind==='brick'?12:6,cols=kind==='brick'?6:5;
   const row=Math.floor(v*rows),xx=mod(u*cols+(row%2)*.48,1),yy=mod(v*rows,1),joint=xx<.025||yy<.025;
   value=(joint?.64:.80+rand(Math.floor(u*cols+(row%2)*.48)+row*13)*.16)+grain;
   if(kind==='brick'){green=.90;blue=.78;}
  }else if(kind==='tile'){
   const channel=mod(u*12,1),overlap=mod(v*8,1),curve=Math.sin(channel*Math.PI);
   value=.65+.29*curve+grain-(overlap<.075?.16:0);green=.93;blue=.82;
  }else if(kind==='path'){
   value=.78+grain*1.9+(rand(Math.floor(x/3)+Math.floor(y/3)*83)-.5)*.17;green=.99;blue=.95;
  }
  const i=(y*width+x)*4;data[i]=Math.min(255,Math.max(0,Math.round(value*red*255)));data[i+1]=Math.min(255,Math.max(0,Math.round(value*green*255)));data[i+2]=Math.min(255,Math.max(0,Math.round(value*blue*255)));data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;texture.name='Castillo · textura propia · '+kind;
 texture.userData={originalProcedural:true,materialFamily:kind,repeatMetres:CASTLE_TEXTURE_METRES[kind]};
 return texture;
}
