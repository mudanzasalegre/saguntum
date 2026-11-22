import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {portrait,dedication,limestone} from './glorieta-romeu-patina.js';

function surface(source,tint){
 const bits=atob(source.grey),rgba=new Uint8Array(bits.length*4);
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
  const k=y*source.width+x,n=((source.height-1-y)*source.width+x)*4,c=bits.charCodeAt(k);
  for(let i=0;i<3;i++)rgba[n+i]=Math.min(255,Math.round(c*tint[i]));
  rgba[n+3]=255;
 }
 const tex=new T.DataTexture(rgba,source.width,source.height,T.RGBAFormat);
 tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;
 tex.generateMipmaps=true;tex.needsUpdate=true;return tex;
}

// Reconstruct cross sections from the frontal photograph. Coordinates in the
// tracings are pixels in the uncropped original; the depth is an estimate.
const profiles=[
 ['botas y pantalón izquierdo',[[226,167,210,28,-1],[254,166,214,26,-3],[294,164,211,22,-5],[325,167,208,18,-6],[362,167,205,16,-6],[407,162,204,17,-4],[422,161,210,21,0],[430,161,211,21,0]]],
 ['pierna avanzada',[[226,212,257,24,5],[265,214,260,25,6],[308,218,263,22,8],[346,226,266,19,9],[392,232,271,16,12],[414,240,277,17,13],[423,239,299,23,19],[430,239,300,23,19]]],
 ['capa y hombros',[[103,186,235,14,-9],[112,174,247,19,-8],[122,156,254,30,-9],[148,150,264,30,-10],[181,145,273,30,-11],[211,137,278,29,-13],[244,141,279,26,-14],[275,151,278,24,-16],[312,164,277,22,-19],[353,164,277,19,-20],[397,162,274,17,-21],[425,161,271,10,-20]]],
 ['uniforme',[[112,189,234,19,0],[132,171,246,31,1],[155,171,248,34,2],[188,179,243,29,3],[217,173,244,30,5],[238,173,242,31,5],[255,183,230,27,4]]],
 ['brazo caído',[[151,155,180,13,1],[174,151,176,15,4],[208,140,176,15,6],[224,141,170,13,8],[245,148,170,11,9],[268,151,168,10,10],[280,154,165,6,9]]],
 ['brazo sobre la empuñadura',[[145,239,260,15,0],[166,239,271,16,1],[189,237,277,15,5],[203,222,272,14,10],[209,218,253,11,20],[221,223,249,10,21],[231,226,240,7,20]]],
 ['cuello',[[88,193,220,11,2],[106,191,228,15,0],[119,185,236,16,-1]]],
 ['rostro y cabello',[[52,202,214,5,0],[56,196,219,11,1],[63,189,223,15,2],[75,187,225,17,2],[88,188,225,17,3],[99,192,223,14,5],[105,199,216,8,6]]]
];

function castProfile(outline,face){
 const rows=[];
 // Subdivide long sections to give the facial bones and folds an actual profile.
 for(let i=0;i<outline.length-1;i++){
  const a=outline[i],b=outline[i+1],n=Math.ceil((b[0]-a[0])/(face?2:11));
  for(let j=0;j<n;j++)rows.push(a.map((v,k)=>v+(b[k]-v)*j/n));
 }
 rows.push(outline.at(-1));
 const positions=[],uv=[],indices=[],segments=32,scale=2.18/378;
 for(const [py,left,right,depth,shift] of rows){
  for(let j=0;j<=segments;j++){
   const a=(j/segments*2-1)*Math.PI,px=(left+right)/2+(right-left)/2*Math.sin(a);
   const bump=(cx,cy,rx,ry)=>Math.exp(-(((px-cx)/rx)**2+((py-cy)/ry)**2));
   const facial=face&&Math.cos(a)>0?6*bump(208,83,4,9)+3*bump(207,89,4,3)+1.6*bump(205,96,7,2)+1.5*bump(199,73,5,2)+1.4*bump(218,72,5,2):0;
   const fold=Math.cos(a)<0?Math.sin(7*a)*depth*.10:0;
   positions.push((px-216)*scale,(430-py)*scale,(Math.cos(a)*depth+shift+fold+facial)*scale);
   uv.push(T.MathUtils.clamp((px-135)/169,.002,.998),T.MathUtils.clamp(1-(py-48)/385,.002,.998));
  }
 }
 const g=new T.BufferGeometry();
 for(let side=0;side<2;side++){
  const first=indices.length;
  for(let i=0;i<rows.length-1;i++)for(let j=0;j<segments;j++){
   if((j>=8&&j<24)!==(side===0))continue;
   const a=i*(segments+1)+j,b=a+1,c=a+segments+1,d=c+1;
   indices.push(a,c,b,b,c,d);
  }
  g.addGroup(first,indices.length-first,side);
 }
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(indices);g.computeVertexNormals();return g;
}

export function buildRomeu(){
 const group=new T.Group();group.name='Monumento a José Romeu · 1976';
 const stone=new T.MeshStandardMaterial({map:surface(limestone,[1,.985,.945]),roughness:.86});
 const darkStone=new T.MeshStandardMaterial({color:'#a6a59b',roughness:.88});
 const bronze=new T.MeshStandardMaterial({color:'#656e65',metalness:.32,roughness:.68});
 const portraitMat=new T.MeshStandardMaterial({map:surface(portrait,[.94,1.01,.93]),metalness:.20,roughness:.72,side:T.DoubleSide});
 const textMat=new T.MeshStandardMaterial({map:surface(dedication,[.95,.93,.88]),roughness:.85});
 const lots=new Map();
 function add(g,m,x,y,z,rotation){
  if(rotation)g.applyQuaternion(rotation);g.translate(x,y,z);
  if(!lots.has(m))lots.set(m,[]);lots.get(m).push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();
 }
 function box(w,h,d,x,y,z,m){add(new T.BoxGeometry(w,h,d),m,x,y,z);}
 function ellipsoid(x,y,z,rx,ry,rz){
  const g=new T.SphereGeometry(1,14,12);g.scale(rx,ry,rz);add(g,bronze,x,y,z);
 }
 function bar(a,b,r0,r1,m=bronze){
  const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A);
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());
  const mid=A.lerp(B,.5);add(new T.CylinderGeometry(r1,r0,v.length(),12),m,mid.x,mid.y,mid.z,q);
 }
 box(3.75,.43,2.65,0,.215,0,darkStone);box(3.62,.11,2.55,0,.485,0,stone);
 // The dressed stone shaft tapers on both axes. A narrow recessed joint separates courses.
 const base=.54,shaft=5.92;
 function size(t){return [3.02-1.5*t,1.64-.58*t];}
 for(let course=0;course<7;course++){
  const low=course/7,high=(course+1)/7,[w0,d0]=size(low),[w1,d1]=size(high);
  const splits=course%2?[0,.31,.71,1]:[0,.54,1];
  for(let part=0;part<splits.length-1;part++){
  const g=new T.BoxGeometry(1,1,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   const top=p.getY(i)>0;
   const tx=p.getX(i)<0?splits[part]+.0003:splits[part+1]-.0003;
   p.setXYZ(i,(tx-.5)*(top?w1:w0),top?base+shaft*high-.006:base+shaft*low,p.getZ(i)*(top?d1:d0)-.25);
  }
  g.computeVertexNormals();add(g,stone,0,0,0);
  }
 }
 box(1.16,1.72,.76,0,1.40,.72,stone);
 box(1.20,.085,.79,0,2.30,.72,stone);
 add(new T.PlaneGeometry(.97,.53),textMat,0,1.77,1.102);
 box(.90,.080,.58,0,2.382,.74,bronze);
 for(const [name,rings] of profiles){
  const mesh=new T.Mesh(castProfile(rings,name==='rostro y cabello'),[portraitMat,bronze]);
  mesh.name=name;mesh.position.set(0,2.42,.73);mesh.receiveShadow=mesh.castShadow=true;group.add(mesh);
 }
 bar([.16,3.62,.83],[.62,2.70,.62],.013,.008);
 // Raised elbow and hand behind the head are visible in Zurita's fig. 7.
 const top=base+shaft;
 ellipsoid(0,top+.55,-.25,.25,.49,.16);
 ellipsoid(.02,top+1.08,-.23,.117,.157,.122);
 bar([-.18,top+.80,-.24],[-.49,top+1.27,-.26],.092,.068);
 bar([-.49,top+1.27,-.26],[-.10,top+1.12,-.30],.066,.045);
 ellipsoid(-.09,top+1.11,-.29,.060,.066,.05);
 bar([.18,top+.81,-.25],[.25,top+.42,-.28],.087,.055);
 bar([.25,top+.42,-.28],[.20,top+.10,-.27],.054,.043);
 bar([0,top+.03,-.25],[0,top+.47,-.25],.30,.19);
 // The side photograph shows the crest sweeping back, with parallel fluting.
 for(const side of [-1,1])for(let i=0;i<6;i++){
  const q=i/5;
  bar([side*(.12+.08*q),top+.83-.10*q,-.36],
      [side*(.21+.06*q),top+.02+.20*q,-.95+.18*q],.07,.026);
 }
 const wreath=new T.TorusGeometry(.115,.020,9,24);
 add(wreath,bronze,-.28,top+1.24,-.27);
 // Side tablets are kept schematic where the photograph does not resolve the carving.
 for(const side of [-1,1]){
  box(.30,2.12,1.14,side*1.28,1.62,-.25,stone);
  box(.12,1.93,.99,side*1.40,1.62,-.25,bronze);
 }
 for(const [mat,items] of lots){
  const surface=new T.Mesh(mergeGeometries(items),mat);
  surface.castShadow=surface.receiveShadow=true;group.add(surface);items.forEach(g=>g.dispose());
 }
 group.rotation.y=-17*Math.PI/180;
 return group;
}
