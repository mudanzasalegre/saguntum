import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {addHorizon} from './territory-horizon.js';
import {closeOrthophoto} from './territory-ortho.js';
import {terrainSampler} from './territory-coordinates.js';
import {conservationGround} from './territory-heritage-ground.js';
import {setSurfaceBuildings,terrainTextureLimits} from './territory-surface-photo.js';
import {describeGroundEffect} from './territory-ground-effects.js';

export async function resource(url, type='json') {
  const response=await fetch(url);
  if(!response.ok) throw new Error(response.status+' '+url);
  return response[type]();
}
export const territoryBase='./assets/territory/';
export const networkBase='./assets/network/';
export async function loadElevation(meta) {
  const load=async grid=>({...grid, data:new Int16Array(await resource(territoryBase+grid.heights,'arrayBuffer'))});
  async function regional(){
    if(typeof DecompressionStream==='undefined')return [];
    const index=await resource(territoryBase+'atlas-relief/index.json');
    return Promise.all(index.map(async g=>{
      const bytes=await resource(territoryBase+g.file,'arrayBuffer');
      const head=new Uint8Array(bytes,0,2);
      const raw=head[0]===31&&head[1]===139?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():bytes;
      const data=new Int16Array(raw);
      if(data.length!==g.width*g.height)throw Error('Dimensiones del relieve '+g.region);
      for(let j=0;j<g.height;j++)for(let k=j*g.width+1,end=(j+1)*g.width;k<end;k++)data[k]+=data[k-1];
      return {...g,data};
    }));
  }
  const [base,detail,local]=await Promise.all([load(meta),meta.detail?load(meta.detail):null,
    regional().catch(e=>{console.warn('Relieve regional del Atlas',e);return [];})]);
  return {base,detail,regional:local};
}
export const makeSampler=terrainSampler;
export async function buildGround(scene,grids,heightAt,renderer) {
  const loader=new T.TextureLoader(), group=new T.Group(), pieces=[];
  const [left,top,right,bottom]=grids.base.bounds;
  const small=matchMedia('(pointer:coarse), (max-width:760px)').matches;
  const file=name=>territoryBase+'landscape/'+name+(small?'-mobile':'')+'.jpg';
  const {anisotropy}=terrainTextureLimits(renderer);
  const manifestWork=resource(territoryBase+'landscape/index.json');
  const maps=await Promise.all([grids.base,grids.detail].map(async (g,i)=>{
    if(!g?.texture) return null;
    const tex=await loader.loadAsync(file(i?'core':'territory'));
    tex.colorSpace=T.SRGBColorSpace; tex.anisotropy=Math.min(6,anisotropy);return tex;
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
  const manifest=await manifestWork;
  const {update:updateOrtho,photography}=await closeOrthophoto(mat,renderer,maps[0],grids.base.bounds,manifest);
  describeGroundEffect(mat,{photo:{detail:maps[1],detailBounds:grids.detail?.bounds,regional:photography}});
  addHorizon(group,manifest,grids.base.bounds,heightAt,small).catch(error=>console.warn('Horizonte MDT25',error));
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
  const size=600,coarseDiv=6,blocks=new Map();
  for(let z=top;z<bottom;z+=size) for(let x=left;x<right;x+=size){
    const w=Math.min(size,right-x),h=Math.min(size,bottom-z);
    const key=Math.floor((x-left)/(size*8))+','+Math.floor((z-top)/(size*8));
    if(!blocks.has(key))blocks.set(key,{parts:[],dirty:false});
    const block=blocks.get(key),piece={x,z,w,h,mesh:null,coarse:patch(x,z,w,h,coarseDiv),div:coarseDiv,block};
    piece.regional=grids.regional.some(({bounds:[l,t,r,b]})=>x+w>l&&x<r&&z+h>t&&z<b);
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
      // Resolve the original 2â€“5 m relief around the observer. Each outer level
      // keeps the previous 10/25/100 m spacing and shares the same samples at its edge.
      const want=p.regional&&d<155?150:d<580?60:d<1900?24:coarseDiv;
      if(want!==p.div)changes.push({p,want,d});
    }
    for(const {p,want} of changes.sort((a,b)=>a.d-b.d).slice(0,2)){
      if(p.mesh){p.mesh.removeFromParent();p.mesh.geometry.dispose();p.mesh=null;}
      if(want!==coarseDiv){
        p.mesh=new T.Mesh(patch(p.x,p.z,p.w,p.h,want),mat);p.mesh.receiveShadow=true;
        // Cast the measured hills close to the camera. The depth pass observes
        // the same excavation and pavement masks as the visible ground.
        p.mesh.castShadow=want>=60;p.mesh.customDepthMaterial=heritageGround.depth;group.add(p.mesh);
      }
      p.div=want;p.block.dirty=true;
    }
    if(changes.length)renderer.shadowMap.needsUpdate=true;
    for(const block of blocks.values())if(block.dirty){
      const g=block.mesh.geometry;let n=0;
      for(const p of block.parts)if(p.div===coarseDiv){g.index.array.set(block.source.subarray(p.start,p.end),n);n+=p.end-p.start;}
      block.mesh.visible=n>0;g.setDrawRange(0,n);g.index.needsUpdate=true;block.dirty=false;
    }
  }
  return {group,update,photography,texture:maps[0],setHeritage:heritageGround.setSource,
    showBuildings:setSurfaceBuildings,grade:heritageGround.grade,canStand:heritageGround.canStand};
}
