// This module is imported only after the native Three r180 backend is active.
import * as G from 'three/webgpu';
import {Fn,If,asin,atan,clamp,cross,dFdx,dFdy,dot,exp,float,floor,fract,length,max,min,mix,
  normalize,positionLocal,pow,screenUV,sin,smoothstep,step,texture,textureLoad,uniform,vec2,vec3,vec4} from 'three/tsl';
import {contactPlan,estimateTargetBytes} from './territory-render-policy.js';
export {createNativeCoast} from './territory-webgpu-coast.js';
export {atlasDistanceFog} from './territory-node-fog.js';

export const createProbe=renderer=>new G.PMREMGenerator(renderer);

// WebGL clears a solid Atlas backdrop directly in display colour. The native
// renderer tone maps its entire HDR framebuffer, including the clear colour.
// Invert r180's ACES fit for just that solid background, preserving exposure
// on the buildings, the water, and the fog colour used by the original visit.
const inverseInput=new G.Matrix3().set(.59719,.35458,.04823,.076,.90834,.01566,.02840,.13383,.83777).invert();
const inverseOutput=new G.Matrix3().set(1.60475,-.53108,-.07367,-.10208,1.10813,-.00605,-.00327,-.07276,1.07602).invert();
export function atlasBackdrop(colour,exposure){
  const v=new G.Vector3(colour.r,colour.g,colour.b).applyMatrix3(inverseOutput);
  for(const channel of ['x','y','z']){
    const y=v[channel],a=1-.983729*y,b=.0245786-.983729*.432951*y,c=-.000090537-.238081*y;
    v[channel]=(Math.sqrt(b*b-4*a*c)-b)/(2*a);
  }
  v.applyMatrix3(inverseInput).multiplyScalar(.6/exposure);
  return new G.Color(v.x,v.y,v.z);
}

export function createSkyMaterial(uniforms){
  const material=new G.MeshBasicNodeMaterial({side:G.BackSide,depthWrite:false,fog:false});
  material.name='Cielo solar de Sagunto';
  const empty=new G.DataTexture(new Uint8Array([0,0,0,255]),1,1,G.RGBAFormat);
  empty.needsUpdate=true;
  // Use the same mutable uniforms as the WebGL controller, including the
  // ground hemisphere switch made while rendering the radiance probe.
  for(const key of ['horizon','zenith','sunDir','daylight','warmth','cloudiness','haze','hasClouds','probe']){
    uniforms[key]=uniform(uniforms[key].value);
  }
  const {horizon,zenith,sunDir,daylight,warmth,cloudiness,haze,hasClouds,probe}=uniforms;
  const d=normalize(positionLocal),h=max(0,d.y),angle=asin(clamp(h,0,1));
  const azimuth=atan(d.z,d.x),sunAzimuth=atan(sunDir.z,sunDir.x);
  const coordinates=vec2(fract(azimuth.sub(sunAzimuth).div(2*Math.PI).add(.595)),clamp(angle.div(.5*Math.PI),.001,.999));
  const clouds=texture(empty,coordinates);
  uniforms.cloudMap=clouds;
  const photoCover=smoothstep(.06,.88,clouds.r).mul(hasClouds);
  const cover=mix(photoCover.mul(.44),photoCover.mul(.22).add(.78),cloudiness);
  const bright=mix(clouds.g.mul(clouds.g),clouds.g.mul(.37).add(.31),cloudiness.mul(.72));
  const facing=clamp(dot(d,sunDir),0,1),above=smoothstep(-.012,.105,d.y);
  const clearAir=mix(horizon,zenith,pow(h,.48));
  const air=mix(clearAir,horizon,haze.mul(.22).mul(pow(h,.35).oneMinus()))
    .add(vec3(.32,.20,.10).mul(pow(facing,10)).mul(daylight).mul(warmth.add(.3))
      .mul(smoothstep(-.03,.09,d.y)).mul(cloudiness.mul(.86).oneMinus()));
  const litCloud=mix(vec3(.30,.35,.41),vec3(1.45,1.44,1.39),smoothstep(.13,.82,bright));
  const cloud=mix(vec3(.017,.023,.038),mix(litCloud,litCloud.mul(vec3(1.24,.80,.63)),
    warmth.mul(facing.mul(.65).add(.35)).mul(cloudiness.mul(.65).oneMinus())),daylight);
  const halo=pow(facing,32).mul(.10).add(pow(facing,340).mul(.26)).add(smoothstep(.99991,.999988,facing).mul(2.7));
  let sky=mix(air,cloud,cover.mul(above)).add(vec3(1,.83,.63).mul(halo).mul(daylight)
    .mul(cover.mul(.93).oneMinus()).mul(cloudiness.mul(.86).oneMinus()).mul(above));
  const st=vec2(azimuth.div(2*Math.PI),angle.div(Math.PI)).mul(vec2(920,730));
  const fraction=fract(st).sub(.5),hash=fract(sin(dot(floor(st),vec2(127.1,311.7))).mul(43758.5453));
  const stars=step(.992,hash).mul(exp(dot(fraction,fraction).mul(-18)));
  const starVisibility=cover.oneMinus().pow(2).mul(cloudiness.oneMinus());
  sky=sky.add(vec3(.33,.38,.45).mul(stars).mul(max(0,daylight.mul(5).oneMinus())).mul(starVisibility).mul(smoothstep(.06,.42,h)));
  const ground=mix(vec3(.005,.007,.011),vec3(.16,.14,.115),daylight);
  material.colorNode=d.y.lessThan(0).and(probe.greaterThan(.5)).select(mix(horizon,ground,smoothstep(0,.25,d.y.negate())),sky);
  return {material,dispose(){empty.dispose();}};
}

// Resolve contact shading once from linear colour and the visible depth
// attachment. The reflected scene and the main town share their geometry.
export function contactRenderer(renderer){
  const stats={active:false,samples:0,estimatedTargetBytes:0,failed:false};
  const size=new G.Vector2(),dimensions=uniform(new G.Vector2()),clip=uniform(new G.Vector2());
  const projectionScale=uniform(new G.Vector2()),strength=uniform(.78);
  let target=null,quad=null,lastUsed=-Infinity;
  function release(){
    quad?.material.dispose();target?.dispose();quad=null;target=null;stats.estimatedTargetBytes=0;
  }
  function allocate(){
    // Native r180 does not resolve multisampled depth to a sampleable depth
    // texture. A single-sample target supplies consistent depth at each tap.
    target=new G.RenderTarget(size.x,size.y,{type:G.HalfFloatType,depthBuffer:true,samples:0});
    target.texture.name='Color de la vista urbana';target.depthTexture=new G.DepthTexture(size.x,size.y,G.UnsignedIntType);
    target.depthTexture.name='Profundidad de la vista urbana';
    const rgb=texture(target.texture,screenUV).rgb;
    const depthAt=uv=>textureLoad(target.depthTexture,clamp(floor(uv.mul(dimensions)),vec2(0),dimensions.sub(1))).r;
    function viewPosition(uv,depth){
      const z=clip.x.mul(clip.y).div(clip.y.sub(clip.x).mul(depth).sub(clip.y));
      return vec3(vec2(uv.x.mul(2).sub(1),uv.y.mul(-2).add(1)).mul(z.negate()).div(projectionScale),z);
    }
    const composed=Fn(()=>{
      const depth=depthAt(screenUV).toVar(),p=viewPosition(screenUV,depth).toVar();
      // Native framebuffer coordinates run from top to bottom.
      const raw=cross(dFdy(p),dFdx(p)).toVar(),normalLength=length(raw).toVar(),normal=raw.div(max(normalLength,1.e-8));
      const shade=float(0).toVar();
      If(depth.lessThan(.999999).and(normalLength.greaterThan(1.e-8)).and(p.z.greaterThan(-165)).and(p.z.lessThan(clip.x.negate())),()=>{
        let dx=.737,dy=.676;
        for(let i=0;i<12;i++){
          const r=(i+.8)/12;
          const offset=vec2(dx,-dy).mul(.12+2.8*r*r).mul(projectionScale).div(max(.3,p.z.mul(-2)));
          [dx,dy]=[-.737*dx-.676*dy,.676*dx-.737*dy];
          const uv=screenUV.add(offset).toVar(),sample=depthAt(uv).toVar();
          const delta=viewPosition(uv,sample).sub(p).toVar(),d=length(delta).toVar();
          const valid=uv.greaterThan(vec2(0)).all().and(uv.lessThan(vec2(1)).all()).and(sample.lessThan(.999999)).and(d.greaterThan(.015));
          const weight=smoothstep(.65,2.8,delta.z.abs()).oneMinus().mul(smoothstep(.14,2.85,d).oneMinus());
          shade.addAssign(valid.select(max(0,dot(normal,delta).div(max(.01,d)).sub(.12)).mul(weight),0));
        }
      });
      const occlusion=min(.27,shade.mul(.073)).mul(strength).mul(smoothstep(90,165,p.z.negate()).oneMinus());
      return vec4(rgb.mul(occlusion.oneMinus()),1);
    })();
    const material=new G.MeshBasicNodeMaterial({depthTest:false,depthWrite:false,fog:false});
    material.colorNode=composed;quad=new G.QuadMesh(material);
  }
  function render(scene,camera,enabled,tier=2){
    stats.active=false;
    if(!enabled||stats.failed){
      if(target&&performance.now()-lastUsed>3500)release();
      renderer.render(scene,camera);return;
    }
    lastUsed=performance.now();renderer.getDrawingBufferSize(size);
    const previous=renderer.getRenderTarget();
    try{
      if(!target)allocate();else if(target.width!==size.x||target.height!==size.y)target.setSize(size.x,size.y);
      dimensions.value.copy(size);clip.value.set(camera.near,camera.far);
      projectionScale.value.set(camera.projectionMatrix.elements[0],camera.projectionMatrix.elements[5]);
      strength.value=contactPlan({enabled:true,pixels:size.x*size.y,maxSamples:0,tier}).strength;
      renderer.setRenderTarget(target);renderer.render(scene,camera);
      renderer.setRenderTarget(previous);quad.render(renderer);
      stats.active=true;stats.estimatedTargetBytes=estimateTargetBytes(size.x,size.y,0);
    }catch(error){
      renderer.setRenderTarget(previous);release();stats.failed=true;
      console.warn('Oclusión de contacto desactivada',error);renderer.render(scene,camera);
    }finally{renderer.setRenderTarget(previous);}
  }
  render.stats=stats;render.dispose=release;return render;
}
