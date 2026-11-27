import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { roadWidth } from './urban-surface.js';
import {EAST_CONTEXT_PATH_ANCHOR,eastContextPathWeight,drapeEastContextTriangle} from './castle-east-paths.js';

// Context uses OSM / transformed Catastro plan geometry. Unobserved heights,
// roofs, windows and planting are deterministic visual interpretations.
const TAU = Math.PI * 2;
function random(seed = 1807) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function hash(text) { let s = 2166136261; for (const c of String(text)) s = Math.imul(s ^ c.charCodeAt(0), 16777619); return s >>> 0; }
function area(poly) { let a = 0; for(let i=0,j=poly.length-1;i<poly.length;j=i++) a += poly[j].x*poly[i].z-poly[i].x*poly[j].z; return a/2; }
function inPoly(x,z,p) { let inside=false; for(let i=0,j=p.length-1;i<p.length;j=i++) if(((p[i].z>z)!==(p[j].z>z))&&(x<(p[j].x-p[i].x)*(z-p[i].z)/(p[j].z-p[i].z)+p[i].x)) inside=!inside; return inside; }
function distanceSegment(x,z,a,b) { const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz; const t=l ? Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l)) : 0; return Math.hypot(x-a.x-t*dx,z-a.z-t*dz); }
function nearPoly(x,z,p,margin) { if(inPoly(x,z,p)) return true; if(margin<=0)return false; for(let i=0;i<p.length;i++) if(distanceSegment(x,z,p[i],p[(i+1)%p.length])<margin) return true; return false; }
function polygonsOverlap(a,b,tolerance=.15){
  const deep=(p,ring)=>inPoly(p.x,p.z,ring)&&ring.every((v,i)=>distanceSegment(p.x,p.z,v,ring[(i+1)%ring.length])>tolerance);
  if(a.some(p=>deep(p,b))||b.some(p=>deep(p,a)))return true;
  const cross=(p,q,r)=>(q.x-p.x)*(r.z-p.z)-(q.z-p.z)*(r.x-p.x);
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
    const p=a[i],q=a[(i+1)%a.length],r=b[j],t=b[(j+1)%b.length],u=cross(p,q,r),v=cross(p,q,t),w=cross(r,t,p),x=cross(r,t,q);
    if(u*v< -1e-6&&w*x< -1e-6)return true;
  }
  return false;
}
function cleanPolygon(coords,project) {
  const p=(coords||[]).map(c=>project(c[0],c[1])).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z));
  if(p.length>1&&Math.hypot(p[0].x-p.at(-1).x,p[0].z-p.at(-1).z)<0.02)p.pop();
  return p;
}
function bounds(p) { return {minX:Math.min(...p.map(a=>a.x)),maxX:Math.max(...p.map(a=>a.x)),minZ:Math.min(...p.map(a=>a.z)),maxZ:Math.max(...p.map(a=>a.z))}; }
class SpatialGrid {
  constructor(size=28) { this.size=size;this.cells=new Map(); }
  key(x,z) { return `${Math.floor(x/this.size)},${Math.floor(z/this.size)}`; }
  add(b,item,margin=0) { for(let ix=Math.floor((b.minX-margin)/this.size);ix<=Math.floor((b.maxX+margin)/this.size);ix++) for(let iz=Math.floor((b.minZ-margin)/this.size);iz<=Math.floor((b.maxZ+margin)/this.size);iz++){const key=`${ix},${iz}`;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(item);} }
  get(x,z) { return this.cells.get(this.key(x,z))||[]; }
}
class FloatStream {
  constructor(){this.chunks=[];this.length=0;}
  push(...values){
    for(const value of values){
      const slot=this.length%65536;
      if(slot===0)this.chunks.push(new Float32Array(65536));
      this.chunks[this.chunks.length-1][slot]=value;this.length++;
    }
  }
  array(){
    const out=new Float32Array(this.length);let offset=0;
    for(const chunk of this.chunks){const size=Math.min(chunk.length,this.length-offset);out.set(chunk.subarray(0,size),offset);offset+=size;}
    return out;
  }
  clear(){this.chunks.length=0;this.length=0;}
}
function buffers() { return {p:new FloatStream(),c:new FloatStream(),uv:new FloatStream(),faces:[],indexCount:0}; }
function tri(b,a,c,d,color,uvs) {
  // Geographic coordinates can collapse a tiny roof face at GPU precision.
  const p=a.map(Math.fround),q=c.map(Math.fround),r=d.map(Math.fround),u=q.map((v,i)=>v-p[i]),v=r.map((n,i)=>n-p[i]);
  const nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0];
  if(nx*nx+ny*ny+nz*nz<1e-12)return;
  b.p.push(...a,...c,...d);
  b.faces.push(3);b.indexCount+=3;
  for(let i=0;i<3;i++)b.c.push(color.r,color.g,color.b);
  b.uv.push(...(uvs||[a[0]*.3,a[2]*.3,c[0]*.3,c[2]*.3,d[0]*.3,d[2]*.3]));
}
function quad(b,a,c,d,e,col,uvs) {
  const ux=c[0]-a[0],uy=c[1]-a[1],uz=c[2]-a[2];
  const vx=d[0]-a[0],vy=d[1]-a[1],vz=d[2]-a[2];
  const wx=e[0]-a[0],wy=e[1]-a[1],wz=e[2]-a[2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  const normalLength=Math.hypot(nx,ny,nz);
  const sx=vy*wz-vz*wy,sy=vz*wx-vx*wz,sz=vx*wy-vy*wx;
  const secondLength=Math.hypot(sx,sy,sz);
  // Share vertices only within a planar face. Terrain-draped quads keep
  // separate triangle vertices so their original flat normals are preserved.
  if(normalLength<1e-10||secondLength<1e-10||Math.abs(nx*wx+ny*wy+nz*wz)>normalLength*1e-6||nx*sx+ny*sy+nz*sz<normalLength*secondLength*.999999999){
    tri(b,a,c,d,col,uvs?[...uvs.slice(0,2),...uvs.slice(2,4),...uvs.slice(4,6)]:null);
    tri(b,a,d,e,col,uvs?[...uvs.slice(0,2),...uvs.slice(4,6),...uvs.slice(6,8)]:null);
    return;
  }
  b.p.push(...a,...c,...d,...e);
  b.faces.push(4);b.indexCount+=6;
  for(let i=0;i<4;i++)b.c.push(col.r,col.g,col.b);
  b.uv.push(...(uvs||[a[0]*.3,a[2]*.3,c[0]*.3,c[2]*.3,d[0]*.3,d[2]*.3,e[0]*.3,e[2]*.3]));
}
function meshFrom(b,material,name) {
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(b.p.array(),3));
  g.setAttribute('color',new THREE.BufferAttribute(b.c.array(),3));
  g.setAttribute('uv',new THREE.BufferAttribute(b.uv.array(),2));
  // A face-size record uses one small integer per quad rather than six JS
  // indices. Allocate the final GPU index buffer once, without a large copy.
  const indices=g.attributes.position.count>65535?new Uint32Array(b.indexCount):new Uint16Array(b.indexCount);
  let cursor=0,vertex=0;
  for(const size of b.faces){
    indices[cursor++]=vertex;indices[cursor++]=vertex+1;indices[cursor++]=vertex+2;
    if(size===4){indices[cursor++]=vertex;indices[cursor++]=vertex+2;indices[cursor++]=vertex+3;}
    vertex+=size;
  }
  g.setIndex(new THREE.BufferAttribute(indices,1));
  b.p.clear();b.c.clear();b.uv.clear();b.faces.length=0;
  g.computeVertexNormals();g.computeBoundingSphere();
  const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=true;m.receiveShadow=true;return m;
}
function tileTexture() {
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle='#e6d1bb';ctx.fillRect(0,0,256,256);const rand=random(8409);
  for(let y=0;y<256;y+=32)for(let x=0;x<256;x+=16){
    const s=182+Math.floor(rand()*40);ctx.fillStyle=`rgb(${s+18},${s+9},${s})`;ctx.fillRect(x,y,16,32);
    ctx.fillStyle='rgba(255,255,255,.27)';ctx.fillRect(x+3,y+1,4,30);
    ctx.fillStyle='rgba(67,36,16,.19)';ctx.fillRect(x+13,y+1,3,31);ctx.fillRect(x,y+30,16,2);
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function color(hex) { return new THREE.Color(hex); }
// Small repeated facade bays give the wider city a readable human scale without
// allocating one mesh per window. Their layout is interpretive, never a survey.
function contextFacadeTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#f1efdf';ctx.fillRect(0,0,512,512);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const x=col*128+43,y=row*128+31;ctx.fillStyle='#faf5e5';ctx.fillRect(x-5,y-5,52,67);ctx.fillStyle=['#637574','#536a70','#687a79','#5e6e70'][(row*3+col)%4];ctx.fillRect(x,y,42,54);ctx.fillStyle='#b3c0b8';ctx.fillRect(x+20,y,2,54);ctx.fillRect(x,y+25,42,2);ctx.fillStyle='#d7d5c2';ctx.fillRect(x-7,y+56,56,5);ctx.fillStyle='#d5d2c0';ctx.fillRect(col*128,row*128+119,128,2);
 }
 const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

export function createCity({data,project,heightAt,urban,terrainHeightAt=null,excludeBuildingIds=new Set(),exclusions=[],vegetationExclusions=[],inBounds=(x,z)=>Math.hypot(x,z)<1100,detailBounds={minX:-330,maxX:570,minZ:-160,maxZ:330},treeLimit=580}) {
  const group=new THREE.Group();group.name=data.title||'Sagunto · cartografía urbana';
  const crop=data.bounds||{minX:-950,maxX:1100,minZ:-850,maxZ:1100};
  const detailAreas=Array.isArray(detailBounds)?detailBounds:[detailBounds];
  const detailed=(x,z)=>detailAreas.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);
  const buildings=new THREE.Group(),roads=new THREE.Group(),vegetation=new THREE.Group();
  buildings.name='Edificios · plantas cartográficas y alturas estimadas';roads.name='Calles · trazado OSM';vegetation.name='Vegetación mediterránea interpretativa';
  group.add(buildings,roads,vegetation);
  const castle=cleanPolygon(data.castlePolygon,project),theatre=cleanPolygon(data.theatrePolygon,project);
  const indexPolygons=(polygons,padding)=>{
    const grid=new SpatialGrid(60);
    for(const p of polygons)if(p.length)grid.add(bounds(p),p,padding);
    return grid;
  };
  const monumentIndex=indexPolygons([castle,theatre],15),heritageIndex=indexPolygons(exclusions,5);
  const monument=(x,z,margin=10)=>monumentIndex.get(x,z).some(p=>nearPoly(x,z,p,margin));
  const heritage=(x,z,margin=.2)=>heritageIndex.get(x,z).some(p=>nearPoly(x,z,p,margin));
  const heritagePolygons=exclusions.filter(p=>p.length>=3).map(p=>({p,box:bounds(p)}));
  const overlapsHeritage=(p,b)=>heritagePolygons.some(h=>b.minX<h.box.maxX&&b.maxX>h.box.minX&&b.minZ<h.box.maxZ&&b.maxZ>h.box.minZ&&polygonsOverlap(p,h.p));
  const plantedIndex=indexPolygons(vegetationExclusions,0);
  const plantedLandscape=(x,z)=>plantedIndex.get(x,z).some(p=>inPoly(x,z,p));
  const buildingGrid=new SpatialGrid(),roadGrid=new SpatialGrid();
  const wallBuffer=buffers(),contextWallBuffer=buffers(),roofBuffer=buffers(),flatRoofBuffer=buffers(),windowBuffer=buffers(),trimBuffer=buffers();
  const facadeColors=['#ddc7a3','#f0dfc4','#d5b789','#ede0c9','#cdb894','#e0c6a6','#e8d2b0','#d0c4b2'];
  const roofColors=['#a65c43','#ad654a','#b77455','#bc7050','#95604b','#c37c58','#af5b40'];
  let buildingCount=0,measuredHeights=0,levelHeights=0,cadastralLevelHeights=0,surfaceHeights=0,sampledRoofs=0,contextFacades=0,terrainRoofCorrections=0,maximumRoofCorrectionM=0;
  for(const b of data.buildings||[]) {
    const p=cleanPolygon(b.coordinates,project);if(p.length<3)continue;
    const holes=(b.holes||[]).map(c=>cleanPolygon(c,project)).filter(p=>p.length>=3),rings=[p,...holes];
    const box=bounds(p),cx=p.reduce((s,v)=>s+v.x,0)/p.length,cz=p.reduce((s,v)=>s+v.z,0)/p.length;
    if(!inBounds(cx,cz)||p.some(v=>!inBounds(v.x,v.z))||monument(cx,cz,13)||p.some(v=>monument(v.x,v.z,4))||excludeBuildingIds.has(String(b.id))||heritage(cx,cz,0)||overlapsHeritage(p,box))continue;
    const surface=Math.abs(area(p))-holes.reduce((sum,h)=>sum+Math.abs(area(h)),0);if(surface<4||surface>(data.title?100000:22000))continue;
    const ground=p.map(v=>heightAt(v.x,v.z)).sort((a,b)=>a-b);
    const parentId=String(b.id).startsWith('cat-')?String(b.id).split('_part')[0]:b.id;
    const rand=random(hash(parentId)),base=ground[Math.floor(ground.length*.6)],sign=area(p)>0?1:-1;
    let h=parseFloat(b.height);
    let hasRoofHeight=Number.isFinite(h)&&h>0;
    if(!Number.isFinite(h)||h<=0){const surfaceHeight=parseFloat(b.surfaceHeightEstimate),levels=parseFloat(b.levels);if(Number.isFinite(surfaceHeight)&&surfaceHeight>=2.5){h=surfaceHeight;surfaceHeights++;hasRoofHeight=true;}else{h=Number.isFinite(levels)&&levels>0?levels*3:5+rand()*6;if(Number.isFinite(levels)&&levels>0){if(String(b.id).startsWith('cat-'))cadastralLevelHeights++;else levelHeights++;}}}
    else measuredHeights++;
    h=Math.min(data.title?75:42,Math.max(2.5,h));
    if(b.kind==='ruins')h=2.5;
    const facade=color(facadeColors[Math.floor(rand()*facadeColors.length)]),roof=color(b.roofColor||roofColors[Math.floor(rand()*roofColors.length)]);if(b.roofColor)sampledRoofs++;
    const roofRed=b.roofColor&&parseInt(b.roofColor.slice(1,3),16)>parseInt(b.roofColor.slice(3,5),16)*1.16;
    const gabled=!holes.length&&p.length===4&&surface<650&&surface>22&&b.roofShape!=='flat'&&(b.roofShape==='gabled'||(b.roofColor?roofRed:rand()>.24));
    const textureFacade=!detailed(cx,cz)&&surface<3000&&h>=5&&!['industrial','warehouse','shed','garage','garages','ruins'].includes(b.kind);if(textureFacade)contextFacades++;
    const roofRise=gabled?Math.min(2.8,Math.min(Math.hypot(p[1].x-p[0].x,p[1].z-p[0].z),Math.hypot(p[2].x-p[1].x,p[2].z-p[1].z))*.2):0;
    const estimatedRoofY=base+Math.max(2.5,h-(hasRoofHeight?roofRise:0)),visibleGround=terrainHeightAt?p.map(v=>terrainHeightAt(v.x,v.z)):ground;
    const roofY=Math.max(estimatedRoofY,Math.max(...visibleGround)+.45);if(roofY>estimatedRoofY+.001){terrainRoofCorrections++;maximumRoofCorrectionM=Math.max(maximumRoofCorrectionM,roofY-estimatedRoofY);}
    buildingGrid.add(box,{p},7);buildingCount++;
    for(const ring of rings)for(let i=0;i<ring.length;i++) {
      const a=ring[i],c=ring[(i+1)%ring.length],l=Math.hypot(c.x-a.x,c.z-a.z);if(l<.05)continue;
      const bottomA=heightAt(a.x,a.z)-1.3,bottomC=heightAt(c.x,c.z)-1.3;
      const wallColor=facade.clone().multiplyScalar(.94+rand()*.10);
      quad(textureFacade?contextWallBuffer:wallBuffer,[a.x,bottomA,a.z],[c.x,bottomC,c.z],[c.x,roofY,c.z],[a.x,roofY,a.z],wallColor,textureFacade?[0,(bottomA-base)/12,l/12,(bottomC-base)/12,l/12,(roofY-base)/12,0,(roofY-base)/12]:[0,0,l/3,0,l/3,h/3,0,h/3]);
      // Small, deep window openings add scale without separate meshes.
      if(detailed(cx,cz)&&surface<3000&&l>4&&l<90&&h>=5) {
        const count=Math.min(12,Math.floor(l/3.9)),floors=Math.min(5,Math.max(1,Math.floor(h/3)));
        const ringSign=(area(ring)>0?1:-1)*(ring===p?1:-1),dx=(c.x-a.x)/l,dz=(c.z-a.z)/l,nx=dz*ringSign,nz=-dx*ringSign;
        for(let n=0;n<count;n++)for(let f=0;f<floors;f++) {
          const t=(n+1)/(count+1),wx=a.x+(c.x-a.x)*t+nx*.045,wz=a.z+(c.z-a.z)*t+nz*.045;
          const y=roofY-1.25-f*3.05;if(y-1.3<heightAt(wx,wz)+.5)continue;
          const half=.43,wh=1.25;
          const opening=color(rand()>.88?'#87765c':'#455250');
          quad(windowBuffer,[wx-dx*half,y-wh,wz-dz*half],[wx+dx*half,y-wh,wz+dz*half],[wx+dx*half,y,wz+dz*half],[wx-dx*half,y,wz-dz*half],opening);
          const tc=facade.clone().multiplyScalar(1.09);
          quad(trimBuffer,[wx-dx*.55+nx*.07,y-wh-.14,wz-dz*.55+nz*.07],[wx+dx*.55+nx*.07,y-wh-.14,wz+dz*.55+nz*.07],[wx+dx*.55+nx*.07,y-wh-.02,wz+dz*.55+nz*.07],[wx-dx*.55+nx*.07,y-wh-.02,wz-dz*.55+nz*.07],tc);
          // Recess frames and shutters are concentrated around the old town.
          if(detailed(cx,cz)){
            for(const side of [-1,1]){const xx=wx+dx*side*.51,zz=wz+dz*side*.51;quad(trimBuffer,[xx-dx*.065,y-wh,zz-dz*.065],[xx+dx*.065,y-wh,zz+dz*.065],[xx+dx*.065,y+.07,zz+dz*.065],[xx-dx*.065,y+.07,zz-dz*.065],tc);}
            if(rand()>.66){const sc=color(rand()>.5?'#637769':'#84674b');for(const side of [-1,1]){const xx=wx+dx*side*.72,zz=wz+dz*side*.72;quad(windowBuffer,[xx-dx*.17,y-wh,zz-dz*.17],[xx+dx*.17,y-wh,zz+dz*.17],[xx+dx*.17,y,zz+dz*.17],[xx-dx*.17,y,zz-dz*.17],sc);}}
          }
        }
        if(detailed(cx,cz)){
          const t=.5,wx=a.x+(c.x-a.x)*t+nx*.07,wz=a.z+(c.z-a.z)*t+nz*.07,gy=heightAt(wx,wz)+.15,door=color('#4b4940');
          quad(windowBuffer,[wx-dx*.65,gy,wz-dz*.65],[wx+dx*.65,gy,wz+dz*.65],[wx+dx*.65,gy+2.35,wz+dz*.65],[wx-dx*.65,gy+2.35,wz-dz*.65],door);
          quad(trimBuffer,[wx-dx*.76,gy+2.35,wz-dz*.76],[wx+dx*.76,gy+2.35,wz+dz*.76],[wx+dx*.76,gy+2.5,wz+dz*.76],[wx-dx*.76,gy+2.5,wz-dz*.76],facade.clone().multiplyScalar(1.12));
        }
      }
    }
    if(gabled) {
      // The ridge follows the footprint's longer edge; original OSM corners stay unchanged.
      let q=p;
      if(Math.hypot(p[1].x-p[0].x,p[1].z-p[0].z)<Math.hypot(p[2].x-p[1].x,p[2].z-p[1].z))q=[p[1],p[2],p[3],p[0]];
      const a=q[0],b=q[1],c=q[2],d=q[3];
      const rise=roofRise;
      const ra=[(a.x+d.x)/2,roofY+rise,(a.z+d.z)/2],rb=[(b.x+c.x)/2,roofY+rise,(b.z+c.z)/2];
      quad(roofBuffer,[a.x,roofY,a.z],[b.x,roofY,b.z],rb,ra,roof);
      quad(roofBuffer,ra,rb,[c.x,roofY,c.z],[d.x,roofY,d.z],roof.clone().multiplyScalar(.92));
      tri(wallBuffer,[a.x,roofY,a.z],ra,[d.x,roofY,d.z],facade);
      tri(wallBuffer,[b.x,roofY,b.z],[c.x,roofY,c.z],rb,facade);
    } else {
      const triangles=THREE.ShapeUtils.triangulateShape(p.map(v=>new THREE.Vector2(v.x,-v.z)),holes.map(r=>r.map(v=>new THREE.Vector2(v.x,-v.z)))),allPoints=rings.flat();
      const isTile=surface<900&&(b.roofColor?roofRed:rand()>.55), buffer=isTile?roofBuffer:flatRoofBuffer;
      const rc=b.roofColor?roof:isTile?roof:facade.clone().multiplyScalar(.84+rand()*.10);
      for(const t of triangles)tri(buffer,...t.map(i=>[allPoints[i].x,roofY+.08,allPoints[i].z]),rc);
      // A low stone parapet turns flat footprints into Mediterranean roof terraces.
      if(!isTile&&surface<1800)for(const ring of rings)for(let i=0;i<ring.length;i++){
        const a=ring[i],b=ring[(i+1)%ring.length];quad(trimBuffer,[a.x,roofY,a.z],[b.x,roofY,b.z],[b.x,roofY+.4,b.z],[a.x,roofY+.4,a.z],facade.clone().multiplyScalar(1.03));
      }
    }
  }
  const wallMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,side:THREE.DoubleSide});
  const contextWallMat=new THREE.MeshStandardMaterial({vertexColors:true,map:contextFacadeTexture(),roughness:.92,side:THREE.DoubleSide});
  const tileMat=new THREE.MeshStandardMaterial({vertexColors:true,map:tileTexture(),roughness:.98,side:THREE.DoubleSide});
  const windowMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.66,side:THREE.DoubleSide});
  for(const [b,m,n] of [[wallBuffer,wallMat,'Fachadas'],[contextWallBuffer,contextWallMat,'Fachadas de contexto · vanos interpretativos'],[roofBuffer,tileMat,'Tejados de terracota'],[flatRoofBuffer,wallMat,'Azoteas'],[windowBuffer,windowMat,'Ventanas'],[trimBuffer,wallMat,'Cornisas']])if(b.p.length)buildings.add(meshFrom(b,m,n));
  buildings.userData={footprintCount:buildingCount,empiricalHeightCount:measuredHeights,ignSurfaceHeightCount:surfaceHeights,osmLevelCount:levelHeights,cadastralLevelCount:cadastralLevelHeights,estimatedHeightCount:buildingCount-measuredHeights-surfaceHeights-levelHeights-cadastralLevelHeights,sampledRoofColorCount:sampledRoofs,contextFacadeCount:contextFacades,terrainRoofCorrections,maximumRoofCorrectionM,terrainRoofNote:"Display roof raised only where source terrain would intersect it; original height estimates are retained in data.",otherHeights:'OSM height > IGN normalized surface estimate > attributed OSM / DGC storeys × 3 m > deterministic visual estimate.',facades:'Generic repeated facade bays outside detailed areas; not surveyed window positions. Roof colours sampled from PNOA where available.'};

  const paved=buffers(),paths=buffers(),easternPaths=buffers(),curbs=buffers(),stepsBuffer=buffers(),supports=buffers();
  const easternPathAnchor=project(...EAST_CONTEXT_PATH_ANCHOR),easternPathIds=new Set();let easternPathTriangles=0;
  const visibleWays=new Set();let stairTreads=0,supportCount=0;
  const supportColor=color('#96968a');
  // Foundation accommodation can lower the rendered mesh outside a model's floor.
  // Close exposed pavement sides and segment ends without moving a road or its top.
  function supportEdge(a,b){
    const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])));
    let previous=a,ground0=terrainHeightAt(a[0],a[2]);
    for(let j=1;j<=count;j++){
      const t=j/count,next=a.map((v,i)=>v+(b[i]-v)*t),ground1=terrainHeightAt(next[0],next[2]),groundMid=terrainHeightAt((previous[0]+next[0])/2,(previous[2]+next[2])/2);
      if([ground0,ground1,groundMid].every(Number.isFinite)&&Math.max(previous[1]-ground0,next[1]-ground1,(previous[1]+next[1])/2-groundMid)>.3){
        const bottom=Math.min(ground0,ground1,groundMid,previous[1],next[1])-.15;
        quad(supports,previous,next,[next[0],bottom,next[2]],[previous[0],bottom,previous[2]],supportColor);supportCount++;
      }
      previous=next;ground0=ground1;
    }
  }
  const segments=urban?.segments||[];
  for(const seg of segments){
    const {a,b,road,width:w}=seg,len=Math.hypot(b.x-a.x,b.z-a.z),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
    if(!inBounds(a.x,a.z)||!inBounds(b.x,b.z)||monument(mx,mz,2)||heritage(mx,mz,0))continue;
    const nx=-(b.z-a.z)/len,nz=(b.x-a.x)/len,oldTown=!data.title&&mx>-340&&mx<600&&mz>-180&&mz<380;
    const natural=['path','track'].includes(road.kind)||(!oldTown&&['footway'].includes(road.kind));
    const col=color(natural?'#baa986':oldTown?'#c4b7a2':'#a3a5a0');
    const top=(x,z)=>heightAt(x,z)+.12;
    const q=[[a.x+nx*w/2,a.z+nz*w/2],[a.x-nx*w/2,a.z-nz*w/2],[b.x-nx*w/2,b.z-nz*w/2],[b.x+nx*w/2,b.z+nz*w/2]];
    if(road.kind==='steps'){
      const h0=top(a.x,a.z),h1=top(b.x,b.z),n=Math.max(1,Math.ceil(Math.abs(h1-h0)/.18));
      for(let j=0;j<n;j++){
        const t0=j/n,t1=(j+1)/n,x0=a.x+(b.x-a.x)*t0,z0=a.z+(b.z-a.z)*t0,x1=a.x+(b.x-a.x)*t1,z1=a.z+(b.z-a.z)*t1,y=h0+(h1-h0)*(h1>h0?t1:t0),yLow=y-Math.abs(h1-h0)/n-.035;
        const A=[x0+nx*w/2,y,z0+nz*w/2],B=[x0-nx*w/2,y,z0-nz*w/2],C=[x1-nx*w/2,y,z1-nz*w/2],D=[x1+nx*w/2,y,z1+nz*w/2];
        quad(stepsBuffer,A,B,C,D,color('#d0c3ac'));
        const L=h1>h0?[A,B]:[C,D];quad(stepsBuffer,L[0],L[1],[L[1][0],yLow,L[1][2]],[L[0][0],yLow,L[0][2]],color('#a89a80'));stairTreads++;
      }
    }else{
      const pavement=q.map(([x,z])=>[x,top(x,z),z]);
      const repair=terrainHeightAt&&natural&&q.some(([x,z])=>eastContextPathWeight(road,x,z,easternPathAnchor)>0);
      if(repair){
        const weight=(x,z)=>eastContextPathWeight(road,x,z,easternPathAnchor),emit=(a,b,c)=>{tri(easternPaths,a,b,c,col);easternPathTriangles++;};
        drapeEastContextTriangle([pavement[0],pavement[1],pavement[2]],terrainHeightAt,weight,emit);
        drapeEastContextTriangle([pavement[0],pavement[2],pavement[3]],terrainHeightAt,weight,emit);
        easternPathIds.add(String(road.osmId||road.id));
      }else{
        quad(natural?paths:paved,...pavement,col);
        if(terrainHeightAt)for(let i=0;i<4;i++)supportEdge(pavement[i],pavement[(i+1)%4]);
      }
    }
    if((oldTown||data.title)&&!natural&&road.kind!=='steps'&&w>2){
      for(const side of [-1,1]){
        const oa={x:a.x+nx*w*.5*side,z:a.z+nz*w*.5*side},ob={x:b.x+nx*w*.5*side,z:b.z+nz*w*.5*side},ia={x:oa.x-nx*.14*side,z:oa.z-nz*.14*side},ib={x:ob.x-nx*.14*side,z:ob.z-nz*.14*side};
        quad(curbs,[oa.x,top(oa.x,oa.z)+.08,oa.z],[ob.x,top(ob.x,ob.z)+.08,ob.z],[ib.x,top(ib.x,ib.z)+.08,ib.z],[ia.x,top(ia.x,ia.z)+.08,ia.z],color('#d7cdbb'));
      }
    }
    visibleWays.add(road.id);roadGrid.add({minX:Math.min(a.x,b.x),maxX:Math.max(a.x,b.x),minZ:Math.min(a.z,b.z),maxZ:Math.max(a.z,b.z)},{a,b,margin:w/2+3.2},w/2+4);
  }
  const stoneCanvas=document.createElement('canvas');stoneCanvas.width=stoneCanvas.height=256;const pctx=stoneCanvas.getContext('2d'),stoneRand=random(2302);pctx.fillStyle='#a69e91';pctx.fillRect(0,0,256,256);
  for(let row=0;row<16;row++)for(let col=-1;col<9;col++){const c=205+Math.floor(stoneRand()*30);pctx.fillStyle=`rgb(${c},${c-3},${c-9})`;pctx.fillRect(col*32+(row%2)*16+1,row*16+1,30,14);}
  const stoneTexture=new THREE.CanvasTexture(stoneCanvas);stoneTexture.colorSpace=THREE.SRGBColorSpace;stoneTexture.wrapS=stoneTexture.wrapT=THREE.RepeatWrapping;stoneTexture.anisotropy=4;
  const roadMat=new THREE.MeshStandardMaterial({vertexColors:true,map:data.title?null:stoneTexture,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const simpleMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
  for(const [buffer,mat,name] of [[paved,roadMat,'Pavimentos sobre trazado OSM'],[paths,simpleMat,'Sendas sobre el relieve'],[easternPaths,simpleMat,'Sendas orientales ajustadas al terreno'],[stepsBuffer,roadMat,'Escalinatas con huellas y contrahuellas'],[curbs,simpleMat,'Bordes de piedra'],[supports,simpleMat,'Faldones bajo los pavimentos']])if(buffer.p.length){const mesh=meshFrom(buffer,mat,name);mesh.castShadow=false;if(buffer===easternPaths)mesh.userData={component:'east-context-paths',sourceIds:[...easternPathIds]};roads.add(mesh);}
  roads.userData={wayCount:visibleWays.size,stairTreads,supportCount,taggedWidths:urban?.stats.taggedWidths||0,easternGroundContact:{sourceIds:[...easternPathIds],triangles:easternPathTriangles,radiusM:60,liftM:.025},profile:'Longitudinal DEM samples; pavement widths, treads and transverse grading are interpreted.'};

  const naturalPolys=(data.landcover||[]).filter(l=>['wood','forest','scrub','park','garden','orchard','grass'].includes(l.kind)).map(l=>({kind:l.kind,p:cleanPolygon(l.coordinates,project)})).filter(l=>l.p.length>2);
  const natureGrid=new SpatialGrid(80);
  for(const p of naturalPolys){const b=bounds(p.p);if(b.maxX<crop.minX||b.minX>crop.maxX||b.maxZ<crop.minZ||b.minZ>crop.maxZ)continue;natureGrid.add({minX:Math.max(crop.minX,b.minX),maxX:Math.min(crop.maxX,b.maxX),minZ:Math.max(crop.minZ,b.minZ),maxZ:Math.min(crop.maxZ,b.maxZ)},p);}
  const planted=new SpatialGrid(14),trees=[],rocks=[],rand=random(482019);
  for(const item of data.trees||[]){const {x,z}=project(...item.coordinate);if(!inBounds(x,z)||heritage(x,z,5)||plantedLandscape(x,z)||buildingGrid.get(x,z).some(b=>nearPoly(x,z,b.p,2)))continue;const h=heightAt(x,z);if(!Number.isFinite(h))continue;const t={x,z,y:h,type:0,s:Math.max(.5,Math.min(1.5,(item.height||9)/10)),rot:rand()*TAU,tint:.9+rand()*.16,mapped:true};trees.push(t);planted.add({minX:x,maxX:x,minZ:z,maxZ:z},t,10);}
  const mappedTreeCount=trees.length;
  for(let n=0;n<40000&&trees.length<treeLimit;n++) {
    const x=crop.minX+rand()*(crop.maxX-crop.minX),z=crop.minZ+rand()*(crop.maxZ-crop.minZ);if(!inBounds(x,z)||monument(x,z,15)||heritage(x,z,5)||plantedLandscape(x,z))continue;
    const h=heightAt(x,z);if(!Number.isFinite(h)||h<(data.title ? .5 : 4))continue;
    let habitat=null;for(const q of natureGrid.get(x,z))if(inPoly(x,z,q.p)){habitat=q.kind;break;}
    // Sparse fallback planting only on the higher nonurban southern slope.
    if(!habitat&&(data.title||!(z>230&&h>66)))continue;
    const density={wood:.94,forest:.94,orchard:.65,park:.5,garden:.4,scrub:.22,grass:.15}[habitat]??.10;
    if(rand()>density)continue;
    if(buildingGrid.get(x,z).some(b=>nearPoly(x,z,b.p,7)))continue;
    if(roadGrid.get(x,z).some(r=>distanceSegment(x,z,r.a,r.b)<r.margin))continue;
    if(planted.get(x,z).some(p=>Math.hypot(x-p.x,z-p.z)<9))continue;
    const slope=Math.max(Math.abs(heightAt(x+5,z)-heightAt(x-5,z)),Math.abs(heightAt(x,z+5)-heightAt(x,z-5)))/10;
    if(slope>1.5)continue;
    const type=habitat==='orchard'?1:rand()<.18?2:rand()<.26?1:0;
    const t={x,z,y:h,type,s:.75+rand()*.55,rot:rand()*TAU,tint:.88+rand()*.22};trees.push(t);
    planted.add({minX:x,maxX:x,minZ:z,maxZ:z},t,10);
  }
  // Smooth irregular umbrella crowns are assembled once, then instanced.
  const pineParts=[];
  for(const [x,y,z,sx,sy,sz] of [[0,10.8,0,4.7,2.6,4.3],[-2.6,9.5,.6,2.7,2.0,3.0],[2.8,10.0,1,2.9,2.1,2.9],[.4,10.0,-2.5,3.2,2.1,2.7]]){
    const g=new THREE.IcosahedronGeometry(1,1);g.scale(sx,sy,sz);g.translate(x,y,z);pineParts.push(g);
  }
  const pineGeo=mergeGeometries(pineParts);pineParts.forEach(g=>g.dispose());
  const oliveParts=[];
  for(const [x,y,z,sx,sy,sz] of [[0,6.4,0,3.6,2.8,3.5],[-2.1,5.6,.6,2.2,2.0,2.1],[2.0,6,-.4,2.3,2.2,2.3]]){const g=new THREE.IcosahedronGeometry(1,1);g.scale(sx,sy,sz);g.translate(x,y,z);oliveParts.push(g);}
  const oliveGeo=mergeGeometries(oliveParts);oliveParts.forEach(g=>g.dispose());
  const cypressGeo=new THREE.SphereGeometry(1,7,6);cypressGeo.scale(1.8,6.8,1.8);cypressGeo.translate(0,8.5,0);
  const trunkGeo=new THREE.CylinderGeometry(.37,.61,8.2,6);trunkGeo.translate(0,4.1,0);
  const trunkMat=new THREE.MeshStandardMaterial({color:'#66503a',roughness:1});
  const canopyColors=['#405b35','#6f7c49','#354b30'];
  const trunk=new THREE.InstancedMesh(trunkGeo,trunkMat,trees.length);trunk.name='Troncos';
  const matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),scale=new THREE.Vector3(),quat=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
  function place(mesh,index,t,ys=1) {pos.set(t.x,t.y-.3,t.z);scale.set(t.s,t.s*ys,t.s);quat.setFromAxisAngle(up,t.rot);matrix.compose(pos,quat,scale);mesh.setMatrixAt(index,matrix);}
  trees.forEach((t,i)=>place(trunk,i,t,t.type===1?.57:t.type===2?.8:1));trunk.castShadow=true;trunk.receiveShadow=true;trunk.instanceMatrix.needsUpdate=true;vegetation.add(trunk);
  [pineGeo,oliveGeo,cypressGeo].forEach((geometry,type)=>{
    const list=trees.filter(t=>t.type===type);if(!list.length)return;
    const material=new THREE.MeshStandardMaterial({color:canopyColors[type],roughness:1,flatShading:false});
    const canopy=new THREE.InstancedMesh(geometry,material,list.length);canopy.name=['Pinos mediterráneos','Olivos','Cipreses'][type];
    list.forEach((t,i)=>{place(canopy,i,t);canopy.setColorAt(i,new THREE.Color().setScalar(t.tint));});
    canopy.castShadow=true;canopy.receiveShadow=true;canopy.instanceMatrix.needsUpdate=true;vegetation.add(canopy);
  });
  vegetation.userData={treeCount:trees.length,mappedPositions:mappedTreeCount,interpretive:true};
  group.userData={source:data.buildingFootprintProvenance?'Edificación derivada de Dirección General del Catastro · calles © OpenStreetMap contributors':'© OpenStreetMap contributors · ODbL',description:'Plantas y trazados cartográficos; cubiertas, alturas no registradas y vegetación interpretativas.'};
  return {group,buildings,roads,vegetation};
}
