import {naturalPixels,terrainTint} from './atlas-appearance.js';
import * as THREE from 'three';
export function createHeightSampler(data){
 const {width,height,elevations,bounds}=data;
 return function(x,z){
  let fx=Math.max(0,Math.min(width-1,(x-bounds.minX)/(bounds.maxX-bounds.minX)*(width-1))),fz=Math.max(0,Math.min(height-1,(z-bounds.minZ)/(bounds.maxZ-bounds.minZ)*(height-1)));
  const ix=Math.floor(fx),iz=Math.floor(fz),nx=Math.min(ix+1,width-1),nz=Math.min(iz+1,height-1);fx-=ix;fz-=iz;
  const a=elevations[iz*width+ix],b=elevations[iz*width+nx],c=elevations[nz*width+ix],d=elevations[nz*width+nx];
  return (a+(b-a)*fx)*(1-fz)+(c+(d-c)*fx)*fz;
 };
}
export const terrainShape={cx:50,cz:170,rx:990,rz:800};
export function inBounds(x,z,margin=0){const s=terrainShape;return ((x-s.cx)/(s.rx-margin))**2+((z-s.cz)/(s.rz-margin))**2<1;}
// Keep only compact grid lookup tables and the geometry's own Float32 positions.
// The diagonal matches the fan used below; clipped ellipse cells use the source query.
function createMeshHeightSampler(xs,zs,vertices,positions,fallback){
 const width=xs.length;
 function cellAt(axis,v){let lo=0,hi=axis.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(axis[mid]<=v)lo=mid;else hi=mid;}return lo;}
 return function(x,z){
  if(x<xs[0]||x>xs[xs.length-1]||z<zs[0]||z>zs[zs.length-1])return fallback(x,z);
  const col=cellAt(xs,x),row=cellAt(zs,z),i=row*width+col;
  const a=vertices[i],b=vertices[i+width],c=vertices[i+width+1],d=vertices[i+1];
  if(a<0||b<0||c<0||d<0)return fallback(x,z);
  const u=(x-xs[col])/(xs[col+1]-xs[col]),v=(z-zs[row])/(zs[row+1]-zs[row]);
  const ya=positions[a*3+1],yb=positions[b*3+1],yc=positions[c*3+1],yd=positions[d*3+1];
  return v>=u?ya+(yc-yb)*u+(yb-ya)*v:ya+(yd-ya)*u+(yc-yd)*v;
 };
}
// A denser, regular mesh through the historic centre avoids the very long
// triangles of a radial fan. This is display tessellation, not survey accuracy.
export function buildTerrainGeometry(data,sample,patches=[],options={}){
 const {bounds}=data,s=options.shape||terrainShape,core=options.core||{minX:-360,maxX:620,minZ:-180,maxZ:550},coreStep=options.coreStep||2.5,outerStep=options.outerStep||10;
 function axis(min,max,lo,hi){const a=[min];for(let v=min;v<max;){const step=v>=lo&&v<hi?coreStep:outerStep;v=Math.min(max,v+step);a.push(v);}return a;}
 const xs=axis(s.cx-s.rx,s.cx+s.rx,core.minX,core.maxX),zs=axis(s.cz-s.rz,s.cz+s.rz,core.minZ,core.maxZ),positions=[],originalHeights=[],uvs=[],indices=[],edge=[],cache=new Map();
 const gridVertices=new Int32Array(xs.length*zs.length).fill(-1);
 // A triangle spanning a foundation edge can interpolate above its flat floor
 // even when all sample queries honor that floor. Lower only the shared vertices
 // of cells that actually intersect a foundation; leave the survey data intact.
 const foundationCaps=new Map(),clearance=.03;
 const validPatches=patches.filter(p=>p.polygon?.length>=3&&Number.isFinite(p.height)&&p.polygon.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.z)));
 function cellAt(a,v){let lo=0,hi=a.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(a[mid]<=v)lo=mid;else hi=mid;}return Math.max(0,Math.min(a.length-2,lo));}
 function polygonContains(x,z,p){let within=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i].z>z)!==(p[j].z>z)&&x<(p[j].x-p[i].x)*(z-p[i].z)/(p[j].z-p[i].z)+p[i].x)within=!within;return within;}
 function segmentMeetsCell(a,b,x0,x1,z0,z1){
  let enter=0,exit=1;
  for(const [origin,delta,min,max]of[[a.x,b.x-a.x,x0,x1],[a.z,b.z-a.z,z0,z1]]){
   if(Math.abs(delta)<1e-12){if(origin<min-1e-8||origin>max+1e-8)return false;continue;}
   const u=(min-origin)/delta,v=(max-origin)/delta;enter=Math.max(enter,Math.min(u,v));exit=Math.min(exit,Math.max(u,v));if(enter>exit+1e-10)return false;
  }
  return true;
 }
 function cellMeetsPolygon(x0,x1,z0,z1,p){
  if(p.some(v=>v.x>=x0&&v.x<=x1&&v.z>=z0&&v.z<=z1))return true;
  if([[x0,z0],[x0,z1],[x1,z1],[x1,z0]].some(([x,z])=>polygonContains(x,z,p)))return true;
  for(let i=0;i<p.length;i++)if(segmentMeetsCell(p[i],p[(i+1)%p.length],x0,x1,z0,z1))return true;
  return false;
 }
 for(const patch of validPatches){
  const px=patch.polygon.map(v=>v.x),pz=patch.polygon.map(v=>v.z),x0=Math.min(...px),x1=Math.max(...px),z0=Math.min(...pz),z1=Math.max(...pz);
  if(x1<xs[0]||x0>xs.at(-1)||z1<zs[0]||z0>zs.at(-1))continue;
  for(let row=cellAt(zs,z0-1e-8);row<=cellAt(zs,z1+1e-8);row++)for(let col=cellAt(xs,x0-1e-8);col<=cellAt(xs,x1+1e-8);col++){
   if(!cellMeetsPolygon(xs[col],xs[col+1],zs[row],zs[row+1],patch.polygon))continue;
   const key=row*(xs.length-1)+col,cap=patch.height-clearance;foundationCaps.set(key,Math.min(foundationCaps.get(key)??Infinity,cap));
  }
 }
 const inside=p=>((p.x-s.cx)/s.rx)**2+((p.z-s.cz)/s.rz)**2<=1.000000001;
 function add(p){const key=`${p.x.toFixed(4)},${p.z.toFixed(4)}`;if(cache.has(key))return cache.get(key);const i=positions.length/3,y=sample(p.x,p.z);positions.push(p.x,y,p.z);originalHeights.push(y);uvs.push((p.x-bounds.minX)/(bounds.maxX-bounds.minX),1-(p.z-bounds.minZ)/(bounds.maxZ-bounds.minZ));cache.set(key,i);return i;}
 function crossing(a,b){const dx=(b.x-a.x)/s.rx,dz=(b.z-a.z)/s.rz,ax=(a.x-s.cx)/s.rx,az=(a.z-s.cz)/s.rz,A=dx*dx+dz*dz,B=2*(ax*dx+az*dz),C=ax*ax+az*az-1,D=B*B-4*A*C;if(D<0)return[];return[(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)].filter(t=>t>1e-7&&t<1-1e-7).map(t=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}));}
 for(let row=0;row<zs.length-1;row++)for(let col=0;col<xs.length-1;col++){
   const q=[{x:xs[col],z:zs[row]},{x:xs[col],z:zs[row+1]},{x:xs[col+1],z:zs[row+1]},{x:xs[col+1],z:zs[row]}],p=[];
   for(let i=0;i<4;i++){if(inside(q[i])){p.push(q[i]);if(Math.abs(((q[i].x-s.cx)/s.rx)**2+((q[i].z-s.cz)/s.rz)**2-1)<1e-9)edge.push(q[i]);}for(const c of crossing(q[i],q[(i+1)%4])){p.push(c);edge.push(c);}}
   if(p.length<3)continue;
   const id=[...new Set(p.map(add))],cap=foundationCaps.get(row*(xs.length-1)+col);
   if(id.length===4&&q.every(inside)){const i=row*xs.length+col;gridVertices[i]=id[0];gridVertices[i+xs.length]=id[1];gridVertices[i+xs.length+1]=id[2];gridVertices[i+1]=id[3];}
   if(cap!==undefined)for(const i of id)positions[i*3+1]=Math.min(positions[i*3+1],cap);
   for(let i=1;i<id.length-1;i++)if(id[0]!==id[i]&&id[i]!==id[i+1]&&id[0]!==id[i+1])indices.push(id[0],id[i],id[i+1]);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const border=[...new Map(edge.map(p=>[`${p.x.toFixed(4)},${p.z.toFixed(4)}`,p])).values()].map(p=>({...p,y:positions[cache.get(`${p.x.toFixed(4)},${p.z.toFixed(4)}`)*3+1]})).sort((a,b)=>Math.atan2(a.z-s.cz,a.x-s.cx)-Math.atan2(b.z-s.cz,b.x-s.cx));
 let adjustedVertices=0,maximumLowering=0;for(let i=0;i<originalHeights.length;i++){const lowering=originalHeights[i]-positions[i*3+1];if(lowering>1e-8){adjustedVertices++;maximumLowering=Math.max(maximumLowering,lowering);}}
 geo.userData={coreMeshSpacingM:coreStep,outerMeshSpacingM:outerStep,sourceSampleCount:data.width*data.height,foundationAdjustment:{method:'Downward caps on shared vertices of cells intersecting a model foundation polygon; visual accommodation, not altered survey measurements.',patchCount:validPatches.length,intersectingCells:foundationCaps.size,adjustedVertices,maximumLoweringM:maximumLowering,clearanceM:clearance,groundQueryNote:'Analytical ground queries retain foundation levels. Future pedestrian collision must account for this rendered mesh accommodation and floor meshes.'}};
 const meshHeightAt=createMeshHeightSampler(Float32Array.from(xs),Float32Array.from(zs),gridVertices,geo.attributes.position.array,sample);
 return {geometry:geo,border,meshHeightAt};
}
export async function createTerrain({data,heightAt,surfaceHeight,renderer,patches=[],shape=terrainShape,photoUrl='./assets/data/orthophoto.jpg',meshOptions={}}){
 const group=new THREE.Group();group.name='relieve-IGN';const {bounds}=data,s=shape;
 const sample=(x,z)=>surfaceHeight?surfaceHeight(x,z,heightAt(x,z)):heightAt(x,z);
 // A geographic crop as a sculpted landscape. Elliptical border is presentation only.
 const {geometry:geo,border,meshHeightAt}=buildTerrainGeometry(data,sample,patches,{...meshOptions,shape}),segments=border.length;
 let photo;try{photo=await new THREE.TextureLoader().loadAsync(photoUrl);}catch(error){geo.dispose();throw error;}photo.colorSpace=THREE.SRGBColorSpace;photo.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const c=document.createElement('canvas');c.width=photo.image.width;c.height=photo.image.height;const ctx=c.getContext('2d');ctx.drawImage(photo.image,0,0,c.width,c.height);
 const pixels=ctx.getImageData(0,0,c.width,c.height);naturalPixels(pixels.data);
 ctx.putImageData(pixels,0,0);const natural=new THREE.CanvasTexture(c);natural.colorSpace=THREE.SRGBColorSpace;natural.anisotropy=photo.anisotropy;
 const mat=new THREE.MeshStandardMaterial({map:natural,roughness:1,color:terrainTint});const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;group.add(mesh);
 // Below-floor skirts connect foundations to the tiny mesh accommodations.
 // They stop below thresholds and never close an arcade or a courtyard above ground.
 const foundationPositions=[];
 for(const patch of patches){if(!patch.polygon?.length||!Number.isFinite(patch.height))continue;const top=patch.height-.04;
   for(let i=0;i<patch.polygon.length;i++){const a=patch.polygon[i],b=patch.polygon[(i+1)%patch.polygon.length],bottom=Math.min(top-6,sample(a.x,a.z)-3,sample(b.x,b.z)-3);foundationPositions.push(a.x,top,a.z,b.x,top,b.z,b.x,bottom,b.z,a.x,top,a.z,b.x,bottom,b.z,a.x,bottom,a.z);}
 }
 if(foundationPositions.length){const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(foundationPositions,3));fg.computeVertexNormals();const foundations=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:'#b4a58a',roughness:1,side:THREE.DoubleSide}));foundations.name='Zócalos bajo las cimentaciones';foundations.receiveShadow=true;group.add(foundations);}
 // Cutaway soil face. Decorative strata; not a geological reconstruction.
 const sideP=[],sideC=[],sideI=[],bottom=-28,layers=6;const palette=['#9b9676','#8e8768','#817b61','#777560','#657165','#536c65'];
 for(let band=0;band<=layers;band++)for(let i=0;i<=segments;i++){
  const {x,z,y:top}=border[i%segments],h=top+(bottom-top)*(band/layers);
  sideP.push(x,h,z);const color=new THREE.Color(palette[Math.min(band,palette.length-1)]);const grain=.95+Math.sin(i*13.37+band)*.05;color.multiplyScalar(grain);sideC.push(color.r,color.g,color.b);
 }
 for(let r=0;r<layers;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;sideI.push(a,b,a+1,a+1,b,b+1);}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sideP,3));sg.setAttribute('color',new THREE.Float32BufferAttribute(sideC,3));sg.setIndex(sideI);sg.computeVertexNormals();const sides=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));sides.castShadow=true;sides.receiveShadow=true;group.add(sides);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1,1,6,160),new THREE.MeshStandardMaterial({color:'#344943',roughness:1}));base.scale.set(s.rx,1,s.rz);base.position.set(s.cx,-31,s.cz);base.receiveShadow=true;base.castShadow=true;group.add(base);
 return{group,mesh,photo,natural,meshHeightAt,setMode(mode){mat.map=mode==='photo'?photo:natural;mat.color.set(mode==='photo'?'#ffffff':terrainTint);mat.needsUpdate=true;}};
}
