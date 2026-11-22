import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {closeOrthophoto} from './territory-ortho.js';
import {gridSampler} from './territory-coordinates.js';
import {conservationGround} from './territory-heritage-ground.js';

export async function resource(url, type='json') {
  const response=await fetch(url);
  if(!response.ok) throw new Error(response.status+' '+url);
  return response[type]();
}
export const territoryBase='./assets/territory/';
export const networkBase='./assets/network/';
export async function loadElevation(meta) {
  const load=async grid=>({...grid, data:new Int16Array(await resource(territoryBase+grid.heights,'arrayBuffer'))});
  const base=await load(meta);
  return {base,detail:meta.detail ? await load(meta.detail) : null};
}
export function makeSampler(grids) {
  const base=gridSampler(grids.base,grids.base.data);
  if(!grids.detail) return base;
  const d=grids.detail, detail=gridSampler(d,d.data), [l,t,r,b]=d.bounds;
  return (x,z)=>{
    const margin=Math.min(x-l,r-x,z-t,b-z);
    if(margin<=0) return base(x,z);
    if(margin>=50) return detail(x,z);
    const f=margin/50;
    return base(x,z)*(1-f)+detail(x,z)*f;
  };
}
export async function buildGround(scene,grids,heightAt,renderer) {
  const loader=new T.TextureLoader(), group=new T.Group(), pieces=[];
  const [left,top,right,bottom]=grids.base.bounds;
  const maps=await Promise.all([grids.base,grids.detail].map(async g=>{
    if(!g?.texture) return null;
    const tex=await loader.loadAsync(territoryBase+g.texture);
    tex.colorSpace=T.SRGBColorSpace; tex.anisotropy=Math.min(6,renderer.capabilities.getMaxAnisotropy());return tex;
  }));
  const mat=new T.MeshStandardMaterial({map:maps[0],roughness:1,metalness:0});
  if(maps[1]){
    const [l,t,r,b]=grids.detail.bounds;
    mat.onBeforeCompile=s=>{
      s.uniforms.uDetail={value:maps[1]};
      s.vertexShader='varying vec2 vTerritory;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerritory=position.xz;');
      s.fragmentShader='varying vec2 vTerritory; uniform sampler2D uDetail;\n'+s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec2 duv=(vTerritory-vec2(${l.toFixed(2)},${t.toFixed(2)}))/vec2(${(r-l).toFixed(2)},${(b-t).toFixed(2)});
        if(all(greaterThanEqual(duv,vec2(0.0)))&&all(lessThanEqual(duv,vec2(1.0)))) {
          vec4 ortho=texture2D(uDetail,vec2(duv.x,1.0-duv.y));
          float fade=smoothstep(0.0,.009,min(min(duv.x,duv.y),min(1.0-duv.x,1.0-duv.y)));
          diffuseColor.rgb=mix(diffuseColor.rgb,ortho.rgb,fade);
        }`);
    };
  }
  const updateOrtho=maps[1]?await closeOrthophoto(mat,renderer):()=>{};
  function patch(x,z,w,h,div) {
    const pos=[],uv=[],idx=[];
    function vertex(px,pz,drop=0){
      pos.push(px,heightAt(px,pz)-drop,pz);uv.push((px-left)/(right-left),1-(pz-top)/(bottom-top));
      return pos.length/3-1;
    }
    for(let j=0;j<=div;j++) for(let i=0;i<=div;i++) vertex(x+w*i/div,z+h*j/div);
    for(let j=0;j<div;j++)for(let i=0;i<div;i++){
      const a=j*(div+1)+i,c=a+div+1;idx.push(a,c,a+1,a+1,c,c+1);
    }
    for(let i=0;i<div;i++) for(const [a,b] of [
      [i,i+1],[(div+1)*div+i+1,(div+1)*div+i],
      [(i+1)*(div+1),i*(div+1)],[i*(div+1)+div,(i+1)*(div+1)+div]
    ]){
      const aa=vertex(pos[a*3],pos[a*3+2],14),bb=vertex(pos[b*3],pos[b*3+2],14);
      idx.push(a,b,aa,b,bb,aa);
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;
  }
  // Batch the far landscape in 4.8 km blocks. A nearby patch is removed
  // from its block's index buffer while its finer mesh is visible.
  const heritageGround=conservationGround({group,material:mat,heightAt,bounds:grids.base.bounds});
  const size=1200,blocks=new Map();
  for(let z=top;z<bottom;z+=size) for(let x=left;x<right;x+=size){
    const w=Math.min(size,right-x),h=Math.min(size,bottom-z);
    const key=Math.floor((x-left)/(size*4))+','+Math.floor((z-top)/(size*4));
    if(!blocks.has(key))blocks.set(key,{parts:[],dirty:false});
    const block=blocks.get(key),piece={x,z,w,h,mesh:null,coarse:patch(x,z,w,h,12),div:12,block};
    pieces.push(piece);block.parts.push(piece);
  }
  for(const block of blocks.values()){
    const g=mergeGeometries(block.parts.map(p=>p.coarse));
    block.source=g.index.array.slice();let offset=0;
    for(const p of block.parts){p.start=offset;offset+=p.coarse.index.count;p.end=offset;p.coarse.dispose();delete p.coarse;}
    block.mesh=new T.Mesh(g,mat);block.mesh.receiveShadow=true;group.add(block.mesh);
  }
  scene.add(group);
  function update(x,z,alt){
    heritageGround.update();
    updateOrtho(x,z,alt);
    const changes=[];
    for(const p of pieces){
      const d=Math.hypot(Math.max(p.x-x,0,x-p.x-p.w),Math.max(p.z-z,0,z-p.z-p.h),alt*.55);
      const want=d<580?120:d<1900?48:12;
      if(want!==p.div)changes.push({p,want,d});
    }
    for(const {p,want} of changes.sort((a,b)=>a.d-b.d).slice(0,2)){
      if(p.mesh){p.mesh.removeFromParent();p.mesh.geometry.dispose();p.mesh=null;}
      if(want!==12){p.mesh=new T.Mesh(patch(p.x,p.z,p.w,p.h,want),mat);p.mesh.receiveShadow=true;group.add(p.mesh);}
      p.div=want;p.block.dirty=true;
    }
    for(const block of blocks.values())if(block.dirty){
      const g=block.mesh.geometry;let n=0;
      for(const p of block.parts)if(p.div===12){g.index.array.set(block.source.subarray(p.start,p.end),n);n+=p.end-p.start;}
      block.mesh.visible=n>0;g.setDrawRange(0,n);g.index.needsUpdate=true;block.dirty=false;
    }
  }
  return {group,update,texture:maps[0],setHeritage:heritageGround.setSource,grade:heritageGround.grade,canStand:heritageGround.canStand};
}
