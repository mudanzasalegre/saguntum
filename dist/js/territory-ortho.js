import * as T from 'three';
import {project} from './territory-coordinates.js';
import {addSurfaceGround,openSurfacePhotography,isAtlasTerrain} from './territory-surface-photo.js';

const dir='./assets/territory/landscape/';
const missing=-99999;
const sampleCode=`
 uniform sampler2D uRegionalBase,uRegionalTiles;
 uniform vec4 uRegionalBaseBounds,uRegionalLimits;
 uniform vec3 uRegionalU,uRegionalV;
 uniform vec2 uRegionalCells[4];
 uniform float uRegionalFade,uRegionalPixels,uRegionalAtlas;
 vec4 landscapeTile(vec2 world){
   if(uRegionalFade<=0.)return vec4(0.);
   vec3 p=vec3(world,1.);
   vec2 uv=vec2(dot(uRegionalU,p),dot(uRegionalV,p));
   vec2 c=floor(uv),slot=mod(c,2.);
   int index=int(slot.x+2.*slot.y);
   if(any(notEqual(c,uRegionalCells[index])))return vec4(0.);
   vec2 edge=min(uv-uRegionalLimits.xy,uRegionalLimits.zw-uv);
   float fade=smoothstep(.0,.055,min(edge.x,edge.y))*uRegionalFade;
   vec2 tc=(slot+clamp(fract(uv),vec2(1.5/uRegionalPixels),vec2(1.-1.5/uRegionalPixels)))*.5;
   return vec4(texture2D(uRegionalTiles,vec2(tc.x,1.-tc.y)).rgb,fade);
 }
 vec4 regionalPhotoAt(vec2 world){
   vec2 uv=(world-uRegionalBaseBounds.xy)/(uRegionalBaseBounds.zw-uRegionalBaseBounds.xy);
   vec3 base=texture2D(uRegionalBase,vec2(uv.x,1.-uv.y)).rgb;
   vec4 tile=landscapeTile(world);
   return vec4(mix(base,tile.rgb,tile.a),1.);
 }
`;

// Shared bindings, including the streaming window. Adding a photographic roof
// to another batch does not create another texture or initiate another request.
export function addRegionalRoofPhotography(shader,photography){
  if(!photography)throw Error('Falta la fotografía regional del terreno');
  Object.assign(shader.uniforms,photography);
  shader.fragmentShader=sampleCode+shader.fragmentShader;
}

export async function closeOrthophoto(material,renderer,baseTexture,baseBounds,catalog){
  const fine=openSurfacePhotography(renderer);
  const data='./assets/data/';
  const sheets=await Promise.all(Object.keys(catalog.atlasSheets).map(async prefix=>{
    const response=await fetch(data+prefix+'orthophoto.json');
    if(!response.ok)throw Error('Registro '+prefix);
    const {geographicBounds:b,width,height}=await response.json();
    const nw=project(b.west,b.north),ne=project(b.east,b.north),sw=project(b.west,b.south);
    const ax=ne.x-nw.x,az=ne.z-nw.z,bx=sw.x-nw.x,bz=sw.z-nw.z,det=ax*bz-az*bx;
    const ux=bz/det*width/1024,uz=-bx/det*width/1024,vx=-az/det*height/1024,vz=ax/det*height/1024;
    return {prefix,width:width/1024,height:height/1024,spacing:Math.hypot(ax,az)/width,
      u:new T.Vector3(ux,uz,-nw.x*ux-nw.z*uz),v:new T.Vector3(vx,vz,-nw.x*vx-nw.z*vz)};
  }).map(p=>p.catch(()=>null)));
  const ordered=sheets.filter(Boolean).sort((a,b)=>a.spacing-b.spacing);
  const photo={u:new T.Vector3(1/1024,0,0),v:new T.Vector3(0,1/1024,0)};
  const medium={u:new T.Vector3(1/2048,0,0),v:new T.Vector3(0,1/2048,0)};
  const blocks=new Set(catalog.pnoaBlocks.map(pair=>pair.join('_')));
  const updateFine=await fine;
  const small=matchMedia('(pointer:coarse), (max-width:760px)').matches||renderer.capabilities.maxTextureSize<2048;
  const pixels=small?512:1024;
  const uniforms={uRegionalBase:{value:baseTexture},uRegionalTiles:{value:null},
    uRegionalBaseBounds:{value:new T.Vector4(...baseBounds)},uRegionalLimits:{value:new T.Vector4()},
    uRegionalU:{value:new T.Vector3()},uRegionalV:{value:new T.Vector3()},uRegionalAtlas:{value:0},
    uRegionalCells:{value:Array.from({length:4},()=>new T.Vector2(missing,missing))},
    uRegionalFade:{value:0},uRegionalPixels:{value:pixels}};
  const previous=material.onBeforeCompile;
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);addRegionalRoofPhotography(shader,uniforms);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
      vec4 regional=landscapeTile(vTerritory);
      float atlasPlate=regional.a*uRegionalAtlas;
      diffuseColor.rgb=mix(diffuseColor.rgb,regional.rgb,regional.a);
      #include <color_fragment>`);
    addSurfaceGround(shader);
  };
  let active=null,ctx=null;
  const wanted=new Map(),requests=new Map(),q=new T.Vector3(),errors=new Map();
  function release(){
    for(const req of requests.values())req.abort();
    requests.clear();wanted.clear();active=null;uniforms.uRegionalFade.value=0;
    uniforms.uRegionalCells.value.forEach(cell=>cell.set(missing,missing));
    if(ctx){
      uniforms.uRegionalTiles.value.dispose();uniforms.uRegionalTiles.value=null;
      ctx.canvas.width=ctx.canvas.height=1;ctx=null;
    }
  }
  function allocate(){
    if(ctx)return;
    const c=document.createElement('canvas');c.width=c.height=pixels*2;
    ctx=c.getContext('2d',{alpha:false});
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    texture.anisotropy=Math.min(6,renderer.capabilities.getMaxAnisotropy());
    uniforms.uRegionalTiles.value=texture;
  }
  async function load(file,cx,cz,slot,signal){
    const response=await fetch(dir+file,{signal});if(!response.ok)throw Error(response.status);
    const blob=await response.blob(),src=URL.createObjectURL(blob);
    let bitmap;
    try{
      if(typeof createImageBitmap==='function'){
        try{bitmap=await createImageBitmap(blob);}catch{/* Some WebKit versions only decode via Image. */}
      }
      if(!bitmap){bitmap=new Image();bitmap.src=src;await bitmap.decode();}
      if(signal.aborted||!ctx||!wanted.has(file))return;
      const dx=(slot%2)*pixels,dy=(slot>>1)*pixels;
      ctx.clearRect(dx,dy,pixels,pixels);
      ctx.drawImage(bitmap,dx,dy,pixels*bitmap.width/1024,pixels*bitmap.height/1024);
      uniforms.uRegionalCells.value[slot].set(cx,cz);uniforms.uRegionalTiles.value.needsUpdate=true;
    }finally{URL.revokeObjectURL(src);bitmap?.close?.();}
  }
  function pump(){
    for(const [file,[cx,cz,slot]] of wanted){
      if(requests.size>=2)break;
      const cached=uniforms.uRegionalCells.value[slot];
      if(cached.x===cx&&cached.y===cz||requests.has(file)||performance.now()-(errors.get(file)??-Infinity)<30000)continue;
      const controller=new AbortController();requests.set(file,controller);
      load(file,cx,cz,slot,controller.signal).catch(()=>{if(!controller.signal.aborted)errors.set(file,performance.now());})
        .finally(()=>{if(requests.get(file)===controller)requests.delete(file);pump();});
    }
  }
  window.addEventListener('pagehide',e=>{if(!e.persisted)release();});
  function update(x,z,range){
    const hasFine=updateFine(x,z,range);
    const inCorridor=blocks.has(Math.floor(x/4096)+'_'+Math.floor(z/4096));
    q.set(x,z,1);
    const sheet=range<1100&&(isAtlasTerrain()||!inCorridor&&!hasFine)&&ordered.find(s=>{
      const a=q.dot(s.u),b=q.dot(s.v);return a>=0&&a<s.width&&b>=0&&b<s.height;
    });
    const frame=sheet||(range>1250?medium:photo),perBlock=frame===medium?2:4;
    if(range>=4500){if(active)release();return;}
    if(active!==frame){release();active=frame;uniforms.uRegionalU.value.copy(frame.u);uniforms.uRegionalV.value.copy(frame.v);}
    const px=q.dot(frame.u),pz=q.dot(frame.v),left=Math.round(px)-1,top=Math.round(pz)-1;
    wanted.clear();
    const targets=[];
    for(let cz=top;cz<top+2;cz++)for(let cx=left;cx<left+2;cx++){
      if(sheet?(cx<0||cz<0||cx>=sheet.width||cz>=sheet.height):!blocks.has(Math.floor(cx/perBlock)+'_'+Math.floor(cz/perBlock)))continue;
      const file=(sheet?'atlas-'+sheet.prefix:frame===medium?'m':'p')+cx+'_'+cz+'.webp';
      targets.push({file,cx,cz,slot:T.MathUtils.euclideanModulo(cx,2)+2*T.MathUtils.euclideanModulo(cz,2),distance:(cx+.5-px)**2+(cz+.5-pz)**2});
    }
    for(const t of targets.sort((a,b)=>a.distance-b.distance))wanted.set(t.file,[t.cx,t.cz,t.slot]);
    for(const [key,req] of requests)if(!wanted.has(key)){req.abort();requests.delete(key);}
    if(!wanted.size){release();return;}
    allocate();uniforms.uRegionalAtlas.value=sheet?1:0;
    uniforms.uRegionalFade.value=sheet?1:1-T.MathUtils.smoothstep(range,3300,4500);
    uniforms.uRegionalLimits.value.set(sheet?Math.max(left,0):left,sheet?Math.max(top,0):top,
      sheet?Math.min(left+2,sheet.width):left+2,sheet?Math.min(top+2,sheet.height):top+2);
    pump();
  }
  return {update,photography:uniforms};
}
