import * as T from 'three';
import {noSurface} from './territory-heritage-paving.js';
import {describeGroundEffect} from './territory-ground-effects.js';

export const maxLocalHeritage=4;
// Each image covers exactly one active surveyed pavement, including its gaps.
// An evicted place yields its sampler immediately. No whole OSM way is removed.
export function atlasRoadMasks(){
 function texture(data,w,h){
  const t=new T.DataTexture(data,w,h,T.RedFormat);t.minFilter=t.magFilter=T.NearestFilter;t.needsUpdate=true;return t;
 }
 const blank=texture(new Uint8Array(1),1,1),cache=new Map(),uniforms={atlasMaskCount:{value:0}};
 const names=Array.from({length:maxLocalHeritage},(_,i)=>'atlasPaving'+i);
 for(const n of names){uniforms[n]={value:blank};uniforms[n+'Box']={value:new T.Vector4()};}
 // WebGPU's guaranteed sample count is shared with the solar shadow and PBR
 // maps. Put the same mask texels in one nearest-sampled image on that path.
 let packed=null,packedSlots=[];
 function updatePacked(){
  if(!packed)return;
  const slots=names.slice(0,uniforms.atlasMaskCount.value).map(n=>uniforms[n].value);
  if(slots.length===packedSlots.length&&slots.every((v,i)=>v===packedSlots[i]))return;
  packedSlots=slots;
  const old=packed.map.value;
  const w=Math.max(1,...slots.map(t=>t.image.width)),h=Math.max(1,...slots.map(t=>t.image.height));
  const width=2*w,height=2*h;
  if(slots.length){
   const bytes=new Uint8Array(width*height);
   slots.forEach((t,i)=>{
    const img=t.image,x=(i%2)*w,y=Math.floor(i/2)*h;
    for(let j=0;j<img.height;j++)bytes.set(img.data.subarray(j*img.width,(j+1)*img.width),(j+y)*width+x);
    packed.rects[i].set(x/width,y/height,img.width/width,img.height/height);
   });
   packed.map.value=texture(bytes,width,height);
  }else packed.map.value=blank;
  if(old!==blank)old.dispose();
 }
 function packedMask(){
  if(!packed){packed={map:{value:blank},rects:names.map(()=>new T.Vector4())};updatePacked();}
  return packed;
 }
 function update(items){
  const grids=items.map(i=>i.pavement).filter(Boolean);
  for(const [grid,tx] of cache)if(!grids.includes(grid)){tx.dispose();cache.delete(grid);}
  for(const [i,n] of names.entries()){
   const grid=grids[i];if(!grid){uniforms[n].value=blank;continue;}
   if(!cache.has(grid)){
    const {heights,width,height}=grid,mask=new Uint8Array(heights.length);
    for(let row=0;row<height;row++)for(let col=0;col<width;col++){
     const j=row*width+col;if(heights[j]===noSurface)continue;
     // Keep the photographic terrain beneath the outer texel of every edge.
     // A raster edge can protrude up to half a cell beyond the true triangle.
     mask[j]=row&&col&&row<height-1&&col<width-1&&
       heights[j-1]!==noSurface&&heights[j+1]!==noSurface&&
       heights[j-width]!==noSurface&&heights[j+width]!==noSurface?255:128;
    }
    cache.set(grid,texture(mask,width,height));
   }
   uniforms[n].value=cache.get(grid);
   uniforms[n+'Box'].value.set(grid.left,grid.top,1/(grid.width*grid.metres),1/(grid.height*grid.metres));
  }
  uniforms.atlasMaskCount.value=grids.length;
  updatePacked();
 }
 function apply(material,ground=false){
  describeGroundEffect(material,{paving:{uniforms,names,ground,packedMask}});
  const previous=material.onBeforeCompile.bind(material),cacheKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>cacheKey+(ground?'-atlas-ground-mask':'-atlas-road-mask');
  material.onBeforeCompile=(shader,renderer)=>{
   previous(shader,renderer);Object.assign(shader.uniforms,uniforms);
   const declarations=names.map(n=>'uniform sampler2D '+n+'; uniform vec4 '+n+'Box;').join('\n');
   const masks=names.map((n,i)=>'if(atlasMaskCount>'+i+'){vec2 uv=(vAtlasStreet-'+n+'Box.xy)*'+n+'Box.zw;if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThan(uv,vec2(1.)))&&texture2D('+n+',uv).r>'+(ground?'.98':'.1')+')discard;}').join('\n');
   shader.vertexShader='varying vec2 vAtlasStreet;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAtlasStreet=position.xz;');
   shader.fragmentShader=declarations+'\nuniform int atlasMaskCount; varying vec2 vAtlasStreet;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+masks);
  };
 }
 return {apply,update,dispose(){update([]);blank.dispose();}};
}
