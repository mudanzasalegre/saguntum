import * as T from 'three';
import {naturalMix,terrainTint} from './atlas-appearance.js';

// A four-slot photographic atlas in local ETRS89 metres. A second, smaller
// atlas carries ground colour under buildings (RGB) and mapped land use (A).
// Roofs and terrain share the very same decoded image and GPU uniforms.
const origin='./assets/territory/surface-photo/';
const cell=256;
const absent=-100000;
const uniforms={
  uSurfacePhoto:{value:null},uSurfaceLand:{value:null},uSurfaceGain:{value:0},
  uSurfaceWindow:{value:new T.Vector2()},uSurfaceTexels:{value:2048},
  uSurfaceCells:{value:Array.from({length:4},()=>new T.Vector2(absent,absent))}
};
const grains={uSurfaceGrains:{value:null},uGrainTone:{value:null},uSurfaceGrainsReady:{value:0},uSurfaceBuildingMask:{value:1}};
let residentSheets=0,atlasUploads=0,visibleCount=0,sourceSpacings=[];
export function setSurfaceBuildings(visible){grains.uSurfaceBuildingMask.value=visible?1:0;}
const atlasGround={value:1},groundTint=new T.Color(terrainTint);
export function setTerrainAppearance(natural){atlasGround.value=natural?1:0;}
export const isAtlasTerrain=()=>atlasGround.value===1;
export function surfacePhotoMetrics(){
  const w=uniforms.uSurfaceWindow.value,weight=uniforms.uSurfaceGain.value;
  const cells=weight>0?uniforms.uSurfaceCells.value.filter(c=>c.x*cell>=w.x&&c.x*cell<w.x+512&&c.y*cell>=w.y&&c.y*cell<w.y+512):[];
  return {cells:cells.map(c=>c.toArray()),requestedCells:visibleCount,sheetCount:residentSheets,
    sampleMetres:uniforms.uSurfacePhoto.value?512/uniforms.uSurfaceTexels.value:null,
    sourceMetres:weight>0?sourceSpacings:[],photographedCoverage:weight,grains:!!grains.uSurfaceGrainsReady.value,atlasUploads};
}
const sampling=`
uniform sampler2D uSurfacePhoto,uSurfaceLand;
uniform float uSurfaceGain,uSurfaceTexels;
uniform vec2 uSurfaceWindow,uSurfaceCells[4];
float surfaceAddress(vec2 p,out vec2 uv){
  vec2 grid=floor(p/256.);
  vec2 slot=mod(grid,2.);
  int i=int(slot.x+2.*slot.y);
  vec2 local=fract(p/256.);
  vec2 within=clamp(local,vec2(1./uSurfaceTexels),vec2(1.-1./uSurfaceTexels));
  uv=(slot+within)*.5;
  uv.y=1.-uv.y;
  if(uSurfaceGain<.001||any(notEqual(grid,uSurfaceCells[i])))return 0.;
  vec2 edge=min(p-uSurfaceWindow,uSurfaceWindow+512.-p);
  return uSurfaceGain*smoothstep(0.,24.,min(edge.x,edge.y));
}
vec4 surfacePixel(sampler2D raster,vec2 uv,vec2 dx,vec2 dy){
  return textureGrad(raster,uv,dx*vec2(1.,-1.)/512.,dy*vec2(1.,-1.)/512.);
}
`;
function attach(shader){
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader=sampling+shader.fragmentShader;
}

export function addRoofPhotography(shader,xzExpression,strengthExpression){
  attach(shader);
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
    vec2 roofXY=${xzExpression};
    vec2 roofDx=dFdx(roofXY),roofDy=dFdy(roofXY);
    float roofClass=(${strengthExpression});
    vec2 roofUV;float photoMix=surfaceAddress(roofXY,roofUV)*roofClass;
    if(photoMix>.001){
      vec3 photographed=surfacePixel(uSurfacePhoto,roofUV,roofDx,roofDy).rgb;
      float land=surfacePixel(uSurfaceLand,roofUV,roofDx,roofDy).a;
      // The eroded feather avoids projecting a neighbouring street across
      // a parapet where roof edges and cadastral parts do not coincide.
      float inside=1.-smoothstep(.46,.61,land);
      diffuseColor.rgb=mix(diffuseColor.rgb,photographed,inside*photoMix);
    }
    #include <alphatest_fragment>`);
}

export function addSurfaceGround(shader){
  attach(shader);
  Object.assign(shader.uniforms,grains,{uAtlasGround:atlasGround,uNaturalTint:{value:groundTint}});
  shader.fragmentShader='uniform float uAtlasGround;uniform vec3 uNaturalTint;\n'+shader.fragmentShader;
  shader.fragmentShader='uniform sampler2D uSurfaceGrains,uGrainTone; uniform float uSurfaceGrainsReady,uSurfaceBuildingMask;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
    vec2 groundDx=dFdx(vTerritory),groundDy=dFdy(vTerritory),groundUV;
    float coverage=surfaceAddress(vTerritory,groundUV);
    float surfaceDeltaHeight=0.;
    if(coverage>.001){
      vec3 aerial=surfacePixel(uSurfacePhoto,groundUV,groundDx,groundDy).rgb;
      vec4 land=surfacePixel(uSurfaceLand,groundUV,groundDx,groundDy);
      float inside=(1.-smoothstep(.45,.59,land.a))*uSurfaceBuildingMask;
      vec3 groundColour=mix(aerial,land.rgb,inside);
      // Sand, alluvial gravel and dry soil use the actual sample dimensions.
      // The local image still supplies the colour of each metre of terrain.
      float soil=smoothstep(.827,.85,land.a)*(1.-smoothstep(.891,.92,land.a));
      float sand=1.-smoothstep(.012,.030,abs(land.a-176./255.));
      float gravel=1.-smoothstep(.012,.030,abs(land.a-160./255.));
      vec3 materialWeight=vec3(soil,sand,gravel);
      float confidence=max(soil,max(sand,gravel));
      float close=1.-smoothstep(.028,.17,max(length(groundDx),length(groundDy)));
      if(close*confidence*uSurfaceGrainsReady>.001){
        vec3 selection=materialWeight/max(.001,dot(materialWeight,vec3(1.)));
        float span=dot(selection,vec3(4.,2.,2.25));
        vec3 scanned=textureGrad(uSurfaceGrains,vTerritory/span,groundDx/span,groundDy/span).rgb;
        vec3 scannedTone=textureGrad(uGrainTone,vTerritory/span,groundDx/span,groundDy/span).rgb;
        float relief=dot(scanned,selection)-.5;
        float blend=close*confidence*(1.-inside);
        surfaceDeltaHeight=relief*dot(selection,vec3(.022,.014,.031))*coverage*blend;
        // Inside an affirmative mapped natural surface, retain the local hue
        // over a 3 m neighbourhood and use the measured grain for close detail.
        vec3 localTone=textureLod(uSurfacePhoto,groundUV,log2(3.*uSurfaceTexels/512.)).rgb;
        groundColour=mix(groundColour,localTone,dot(selection,vec3(.12,.73,.53))*blend);
        groundColour*=1.+((dot(scannedTone,selection)-.5)*.66+relief*.17)*blend;
      }
      diffuseColor.rgb=mix(diffuseColor.rgb,groundColour,coverage*(1.-uAtlasGround*atlasPlate));
    }
    if(uAtlasGround>.5){
      vec3 s=sRGBTransferOETF(vec4(max(diffuseColor.rgb,vec3(0.)),1.)).rgb;
      float luminance=dot(s,vec3(${naturalMix.luma.join(',')}));
      vec3 graded=clamp(luminance*vec3(${naturalMix.grey.join(',')})+s*vec3(${naturalMix.rgb.join(',')})+vec3(${naturalMix.lift.map(v=>(v/255).toFixed(7)).join(',')}),0.,1.);
      diffuseColor.rgb=sRGBTransferEOTF(vec4(graded,1.)).rgb*uNaturalTint;
    }
    #include <alphatest_fragment>`).replace('#include <normal_fragment_maps>',`
    #include <normal_fragment_maps>
    vec3 pDx=dFdx(-vViewPosition),pDy=dFdy(-vViewPosition);
    vec3 axisX=cross(pDy,normal),axisY=cross(normal,pDx);
    float area=dot(pDx,axisX);
    vec3 gradient=dFdx(surfaceDeltaHeight)*axisX+dFdy(surfaceDeltaHeight)*axisY;
    if(abs(area)>.00000001)normal=normalize(abs(area)*normal-sign(area)*gradient);`);
}

function canvasTexture(side,alpha,anisotropy){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=side;
  const ctx=canvas.getContext('2d',{alpha});
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=anisotropy;
  return {ctx,texture};
}

async function bitmap(url,maxSize,signal){
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error(response.status+' '+url);
  const blob=await response.blob();
  if(typeof createImageBitmap==='function'){
    try{
      return await createImageBitmap(blob,{resizeWidth:maxSize,resizeHeight:maxSize,resizeQuality:'high'});
    }catch(error){if(signal.aborted)throw error;}
  }
  const objectURL=URL.createObjectURL(blob);
  try{
    const image=new Image();image.src=objectURL;await image.decode();return image;
  }finally{URL.revokeObjectURL(objectURL);}
}

export async function openSurfacePhotography(renderer){
  let catalog,mobileSuffix;
  try{
    const response=await fetch(origin+'index.json');
    if(!response.ok)return ()=>false;
    const index=await response.json();catalog=index.sheets;mobileSuffix=index.mobileNativeSuffix;
  }catch{return ()=>false;}
  const mobile=matchMedia('(max-width:760px), (pointer:coarse)').matches;
  const slotPx=mobile||renderer.capabilities.maxTextureSize<2048?512:1024;
  const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const sheets=new Map();
  let photo,land,wanted=new Map(),visible=[],idleSince=0,generation=0;
  function close(entry){
    entry.controller?.abort();
    entry.photo?.close?.();entry.land?.close?.();
  }
  function allocate(){
    if(photo)return;
    const issued=++generation;
    photo=canvasTexture(slotPx*2,false,anisotropy);
    land=canvasTexture(256,true,Math.min(anisotropy,4));
    uniforms.uSurfacePhoto.value=photo.texture;
    uniforms.uSurfaceLand.value=land.texture;
    uniforms.uSurfaceTexels.value=slotPx*2;
    const loader=new T.TextureLoader();
    for(const [file,uniform] of [['grains.png',grains.uSurfaceGrains],['grain-tone.png',grains.uGrainTone]]){
      loader.load(origin+file,texture=>{
        if(issued!==generation){texture.dispose();return;}
        texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=anisotropy;
        uniform.value=texture;
        grains.uSurfaceGrainsReady.value=grains.uSurfaceGrains.value&&grains.uGrainTone.value?1:0;
      },undefined,()=>{});
    }
  }
  function paint(){
    let dirty=false;
    for(const c of visible){
      const image=sheets.get(c.key);
      if(!image?.photo)continue;
      const sx=T.MathUtils.euclideanModulo(c.x,2),sz=T.MathUtils.euclideanModulo(c.z,2);
      const slot=uniforms.uSurfaceCells.value[sx+2*sz];
      if(slot.x===c.x&&slot.y===c.z)continue;
      for(const [atlas,src,size] of [[photo,image.photo,slotPx],[land,image.land,128]]){
        const half=src.width/2;
        atlas.ctx.clearRect(sx*size,sz*size,size,size);
        atlas.ctx.drawImage(src,sx*half,sz*half,half,half,sx*size,sz*size,size,size);
      }
      slot.set(c.x,c.z);dirty=true;
    }
    if(dirty){photo.texture.needsUpdate=true;land.texture.needsUpdate=true;atlasUploads++;}
    const ready=Array.from(sheets.entries()).filter(([,entry])=>entry.photo);
    residentSheets=ready.length;
    sourceSpacings=Array.from(new Set(ready.map(([key])=>catalog[key]))).sort();
  }
  function pump(){
    let active=0;
    for(const entry of sheets.values())if(entry.pending)active++;
    for(const [key,spacing] of wanted){
      if(active>=2)return;
      const prior=sheets.get(key);
      if(prior&&(prior.photo||prior.pending||performance.now()-prior.failed<60000))continue;
      const entry={controller:new AbortController(),pending:true};
      sheets.set(key,entry);active++;
      // Never enlarge a 50 cm file before decoding. A narrow display also
      // subsamples the native 25 cm sheet before it enters the canvas.
      const decoded=Math.min(slotPx*2,Math.round(512/spacing));
      const suffix=slotPx===512&&spacing<.5&&mobileSuffix?mobileSuffix:'.webp';
      const work=[bitmap(origin+key+suffix,decoded,entry.controller.signal),
                  bitmap(origin+key+'-land.webp',256,entry.controller.signal)];
      Promise.allSettled(work).then(results=>{
        entry.pending=false;
        if(sheets.get(key)!==entry||results.some(r=>r.status==='rejected')){
          for(const r of results)if(r.status==='fulfilled')r.value.close?.();
          entry.failed=performance.now();
        }else{
          entry.photo=results[0].value;entry.land=results[1].value;paint();
        }
        pump();
      });
    }
  }
  function clear(){
    wanted.clear();visible=[];
    for(const entry of sheets.values())close(entry);
    sheets.clear();residentSheets=0;visibleCount=0;sourceSpacings=[];uniforms.uSurfaceGain.value=0;
  }
  function releaseAtlas(){
    generation++;
    for(const atlas of [photo,land])if(atlas){
      atlas.texture.dispose();atlas.ctx.canvas.width=atlas.ctx.canvas.height=1;
    }
    for(const key of ['uSurfaceGrains','uGrainTone']){
      grains[key].value?.dispose();grains[key].value=null;
    }
    grains.uSurfaceGrainsReady.value=0;
    uniforms.uSurfacePhoto.value=uniforms.uSurfaceLand.value=null;
    for(const slot of uniforms.uSurfaceCells.value)slot.set(absent,absent);
    photo=land=null;
  }
  function idle(){
    if(!photo)return;
    if(!idleSince)idleSince=performance.now();
    if(performance.now()-idleSince>12000)releaseAtlas();
  }
  window.addEventListener('pagehide',e=>{
    if(e.persisted)return;
    clear();releaseAtlas();
  });
  return function update(x,z,range){
    if(range>1250){if(wanted.size)clear();idle();return false;}
    const gx=Math.round(x/cell)-1,gz=Math.round(z/cell)-1;
    visible=[];wanted=new Map();
    for(let iz=gz;iz<=gz+1;iz++)for(let ix=gx;ix<=gx+1;ix++){
      const key=Math.floor(ix/2)+'_'+Math.floor(iz/2),spacing=catalog[key];
      if(!spacing)continue;
      visible.push({key,x:ix,z:iz,dist:Math.hypot((ix+.5)*cell-x,(iz+.5)*cell-z)});
    }
    visible.sort((a,b)=>a.dist-b.dist);
    visibleCount=visible.length;
    for(const c of visible)wanted.set(c.key,catalog[c.key]);
    for(const [key,entry] of sheets)if(!wanted.has(key)){close(entry);sheets.delete(key);}
    if(!visible.length){residentSheets=0;sourceSpacings=[];uniforms.uSurfaceGain.value=0;idle();return false;}
    idleSince=0;
    allocate();
    uniforms.uSurfaceWindow.value.set(gx*cell,gz*cell);
    uniforms.uSurfaceGain.value=1-T.MathUtils.smoothstep(range,850,1250);
    paint();pump();
    const center=Math.floor(x/512)+'_'+Math.floor(z/512);
    return !!catalog[center]&&!sheets.get(center)?.failed;
  };
}
