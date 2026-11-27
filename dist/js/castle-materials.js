import * as THREE from 'three';

// Original textures. They describe families of surviving construction, without
// assigning an archaeological date to a wall from its colour alone.
const fract=n=>n-Math.floor(n);
const rand=n=>fract(Math.sin(n*127.13+43.7)*43758.5453);
const mod=(n,m)=>(n%m+m)%m;
export const CASTLE_TEXTURE_METRES={stone:[4.8,3.2],rubble:[3.8,2.9],tapial:[5.5,3.1],ashlar:[4.8,3.2],brick:[2.6,2.0],paving:[9.2,9.2],path:[2.1,2.1],tile:[2.3,2.7],
 'gate-stone':[4.2,3.0],'gate-brick':[1.8,1.5],plaster:[3.6,3.6],wood:[1.8,3.2],
 'forum-earth':[5.4,5.4],'forum-gravel':[3.6,3.6],'forum-stone':[3.2,2.4],'worn-ashlar':[2.8,2.8],
 'east-masonry':[3.8,2.7],'east-render':[3.8,3.4],'east-rock':[4.6,3.0],'east-earth':[4.8,4.8],'east-concrete':[2.8,2.4]};

const detailedKinds=new Set(['gate-stone','gate-brick','plaster','wood','forum-earth','forum-gravel','forum-stone','worn-ashlar','east-masonry','east-render','east-rock','east-earth','east-concrete']);
function detailedTexture(kind){
 const size=512,pixels=new Uint8Array(size*size*4),masonry=kind==='gate-stone'||kind==='forum-stone'||kind==='east-masonry';
 const cols=14,rows=12,cells=[];
 if(masonry)for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const seed=row*83+col*17;
  cells.push({x:(col+.24+rand(seed)*.51)/cols,y:(row+.22+rand(seed+7)*.55)/rows,tone:.76+rand(seed+19)*.15});
 }
 const smooth=(u,v,frequency)=>{
  const x=u*frequency,y=v*frequency,i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j;
  const a=rand(mod(i,frequency)+mod(j,frequency)*71),b=rand(mod(i+1,frequency)+mod(j,frequency)*71);
  const c=rand(mod(i,frequency)+mod(j+1,frequency)*71),d=rand(mod(i+1,frequency)+mod(j+1,frequency)*71);
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,grain=rand(x+y*size),weather=smooth(u,v,8),fine=smooth(u,v,48);
  let value=.87,red=1,green=.995,blue=.98;
  if(masonry){
   const gx=Math.floor(u*cols),gy=Math.floor(v*rows);let d1=Infinity,d2=Infinity,tone=.82;
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const cell=cells[mod(gy+oy,rows)*cols+mod(gx+ox,cols)];
    const dx=Math.min(Math.abs(u-cell.x),1-Math.abs(u-cell.x)),dy=Math.min(Math.abs(v-cell.y),1-Math.abs(v-cell.y)),d=dx*dx+dy*dy*1.2;
    if(d<d1){d2=d1;d1=d;tone=cell.tone;}else if(d<d2)d2=d;
   }
   const joint=Math.max(0,1-(d2-d1)/.00019),pit=grain>.987?.09:0;
   value=tone+(fine-.5)*.095+(weather-.5)*.075+(grain-.5)*.055-pit;
   // Recessed joints with pale lime edges, rather than large coloured facets.
   value=value*(1-joint*.70)+(.72+(grain-.5)*.10)*joint*.70;
   if(joint>.2&&joint<.5)value+=.045;
   green=.99;blue=.965;
  }else if(kind==='gate-brick'){
   const row=Math.floor(v*18),xx=mod(u*7+(row%2)*.5,1),yy=mod(v*18,1),joint=xx<.038||yy<.11;
   value=(joint?.83:.77+rand(Math.floor(u*7+(row%2)*.5)+row*37)*.10)+(fine-.5)*.07+(grain-.5)*.06;
   green=joint?1:.94;blue=joint?.98:.87;
  }else if(kind==='east-rock'){
   // Original limestone grain and inclined bedding; the actual ledges are
   // geometry. This is a material study, not a geological field measurement.
   const seam=mod(v*8.5+u*1.35+(weather-.5)*.26,1),crack=seam<.04;
   value=.83+(weather-.5)*.16+(fine-.5)*.12+(grain-.5)*.07-(crack?.17:0);
   green=.995;blue=.965;
  }else if(kind==='east-render'){
   const wear=smooth(u,v,19),eroded=wear<.23,run=smooth(u*1.6,v*.24,28);
   value=.86+(wear-.5)*.10+(fine-.5)*.10+(grain-.5)*.08-(eroded?.075:0)-(run<.23?.065:0);
   green=.985;blue=.96;
  }else if(kind==='east-concrete'){
   const pit=grain>.985,aggregate=smooth(u,v,110),joint=mod(v*6+(weather-.5)*.04,1)<.012;
   value=.85+(weather-.5)*.11+(fine-.5)*.085+(aggregate-.5)*.07+(grain-.5)*.08-(pit?.14:0)-(joint?.045:0);
   green=.998;blue=.985;
  }else if(kind==='plaster'){
   const flake=weather<.24;
   value=.86+(weather-.5)*.12+(fine-.5)*.065+(grain-.5)*.05-(flake?.10:0);
   green=.985;blue=.94;
  }else if(kind==='wood'){
   const board=Math.floor(u*8),joint=mod(u*8,1)<.018,flow=u*190+Math.sin(v*18+board)*1.8;
   value=.78+rand(board*11)*.08+Math.sin(flow)*.045+Math.sin(flow*2.9+v*6)*.022+(grain-.5)*.065-(joint?.26:0);
   green=.97;blue=.91;
  }else if(kind==='worn-ashlar'){
   // Individual blocks are geometry: no false masonry courses painted on them.
   value=.86+(weather-.5)*.10+(fine-.5)*.08+(grain-.5)*.055-(grain>.992?.08:0);
   green=.999;blue=.985;
  }else{
   const gravel=kind==='forum-gravel',pebble=smooth(u,v,128),scar=weather<.18;
   value=.84+(weather-.5)*.095+(fine-.5)*.09+(grain-.5)*(gravel?.14:.10)+(pebble-.5)*(gravel?.15:.05)-(scar?.025:0);
   green=.995;blue=.97;
  }
  const offset=(y*size+x)*4;
  pixels[offset]=Math.max(0,Math.min(255,Math.round(value*red*255)));
  pixels[offset+1]=Math.max(0,Math.min(255,Math.round(value*green*255)));
  pixels[offset+2]=Math.max(0,Math.min(255,Math.round(value*blue*255)));pixels[offset+3]=255;
 }
 const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;texture.name='Castillo · textura propia · '+kind;
 texture.userData={originalProcedural:true,materialFamily:kind,repeatMetres:CASTLE_TEXTURE_METRES[kind],reference:'Material families observed in the forum and Almenara photographs; not a photographic survey'};
 return texture;
}

export function createCastleTexture(kind){
 if(detailedKinds.has(kind))return detailedTexture(kind);
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
