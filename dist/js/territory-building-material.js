import * as T from 'three';
import {addRoofPhotography} from './territory-surface-photo.js';

const dir=new URL('../assets/materials/architecture/',import.meta.url);
export function architecturalMaterial(night){
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide});
  const textures=new T.TextureLoader(),ready={value:0};
  const compact=matchMedia('(pointer: coarse)').matches||(navigator.deviceMemory||8)<=4;
  const slots={uArchSurface:{value:null},uArchRelief:{value:null},uArchBay:{value:null},uArchGlass:{value:null}};
  Promise.all(Object.entries(slots).map(async([name,slot],i)=>{
    const path=['surfaces','microrelief','joinery','glazing'][i]+(compact?'-compact':'')+'.webp';
    const tex=await textures.loadAsync(new URL(path,dir).href);
    if(name==='uArchSurface'||name==='uArchBay')tex.colorSpace=T.SRGBColorSpace;
    tex.anisotropy=4;slot.value=tex;
  })).then(()=>{ready.value=1;}).catch(e=>console.warn('Material arquitectónico',e));
  mat.defines={USE_UV:''};
  mat.customProgramCacheKey=()=>'territorial-architecture-34';
  mat.onBeforeCompile=s=>{
    Object.assign(s.uniforms,slots,{uArchReady:ready,uNight:night});
    const varyings=`
      varying vec2 vArchBay, vArchMetric, vArchXZ, vArchGrade;
      varying vec4 vArchData;
      varying float vArchRange;
    `;
    s.vertexShader='attribute vec4 archMetric; attribute vec4 archData;\n'+varyings+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
      vArchBay=uv; vArchMetric=archMetric.xy; vArchGrade=archMetric.zw; vArchData=archData; vArchXZ=position.xz; vArchRange=-mvPosition.z;`);
    const fragment=`
      uniform float uNight,uArchReady;
      uniform sampler2D uArchSurface,uArchRelief,uArchBay,uArchGlass;
      vec2 surfaceUV(vec2 metres,float index,out vec2 dx,out vec2 dy){
        float size=index<.5?1.:index<1.5?1.9:index<2.5?2.7:index<3.5?3.:index<4.5?2.:index<5.5?2.6:index<6.5?1.12:2.5;
        vec2 tile=metres/size,grid=vec2(4.,2.);
        // Packed cells have periodic gutters. Explicit unwrapped derivatives prevent seams at each repeat.
        vec2 scale=vec2(504./512.)/grid;
        dx=dFdx(tile)*scale;dy=dFdy(tile)*scale;
        return (vec2(mod(index,4.),floor(index*.25))+vec2(4./512.))/grid+fract(tile)*scale;
      }
      vec3 archNormal(vec3 n,vec3 pos,vec2 uv,vec2 perturb,float weight){
        vec3 p=dFdx(pos),q=dFdy(pos);
        vec2 a=dFdx(uv),b=dFdy(uv);
        vec3 t=cross(q,n)*a.x+cross(n,p)*b.x;
        vec3 bTan=cross(q,n)*a.y+cross(n,p)*b.y;
        float inv=inversesqrt(max(1.e-8,max(dot(t,t),dot(bTan,bTan))));
        return normalize(n+(t*perturb.x+bTan*perturb.y)*inv*weight);
      }
    `;
    s.fragmentShader=varyings+fragment+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float archDetail=(1.-smoothstep(220.,780.,vArchRange))*uArchReady;
      float archSides=step(-1.5,vArchData.y);
      float glassAmt=0.,litWindow=0.,archRough=.88,reliefWeight=0.;
      vec2 microNormal=vec2(0.);
      if(archDetail>.001){
        float index=floor(vArchData.x+.5);
        vec2 dx,dy;
        vec2 coord=surfaceUV(vArchMetric,index,dx,dy);
        vec3 scan=textureGrad(uArchSurface,coord,dx,dy).rgb;
        vec3 nr=textureGrad(uArchRelief,coord,dx,dy).rgb;
        diffuseColor.rgb*=mix(vec3(1.),clamp(scan*2.32,vec3(.25),vec3(1.95)),archDetail*(index==0.?.49:.86));
        archRough=mix(.88,nr.b,archDetail*.74);
        microNormal=nr.rg*2.-1.;
        reliefWeight=(1.-smoothstep(34.,170.,vArchRange))*(index==0.?.43:.81);
        if(archSides>.5){
          float above=vArchMetric.y,eave=vArchData.w*.1-above;
          float localHeight=above-vArchGrade.x-vArchBay.x*vArchGrade.y;
          float base=1.-smoothstep(.35,.47,localHeight);
          float coping=1.-smoothstep(.09,.17,eave);
          diffuseColor.rgb*=1.-archDetail*(.20*base+.12*(1.-smoothstep(.0,.13,abs(eave-.24))));
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.86+vec3(.125),coping*archDetail*.88);
          if(vArchData.y>=0.&&vArchData.y<2.5&&localHeight<.8){
            vec2 sx,sy;
            vec2 plinthUV=surfaceUV(vArchMetric*1.45,3.,sx,sy);
            vec3 stone=textureGrad(uArchSurface,plinthUV,sx,sy).rgb*vec3(.79,.73,.63);
            float plinth=(1.-smoothstep(.55,.59,localHeight))*archDetail;
            diffuseColor.rgb=mix(diffuseColor.rgb,stone,plinth*.78);
          }
          vec2 bay=vArchBay;
          if(bay.y<1.){
            // Each portal meets the ground at the centre of its own bay; upper
            // windows retain level sills on the steep streets below the castle.
            float threshold=vArchGrade.x+(floor(bay.x)+.5)*vArchGrade.y;
            float storey=abs(bay.y)>.0001?above/bay.y:3.05;
            bay.y=(above-threshold)/max(.65,storey-threshold);
          }
          if(vArchData.y>=0.&&bay.y>=0.){
            vec2 floorBay=floor(bay),f=fract(bay),style=floor(vArchData.yz+.5);
            float seed=mod(floorBay.x+floorBay.y+style.y,3.);
            float variant=floorBay.y<1.?(mod(floorBay.x+style.y,style.x==3.?5.:4.)<.5?2.:3.):(seed<.5?0.:1.);
            float tone=fract(sin(dot(floorBay+style.y,vec2(11.23,41.33)))*2734.453);
            variant+=tone>.64?4.:0.;
            vec2 grid=vec2(6.,8.);
            vec2 bayUV=(vec2(style.x,variant)+.006+.988*f)/grid;
            vec2 bx=dFdx(vArchBay)*.988/grid,by=dFdy(vArchBay)*.988/grid;
            vec4 trim=textureGrad(uArchBay,bayUV,bx,by);
            glassAmt=textureGrad(uArchGlass,bayUV,bx,by).r*archDetail;
            trim.rgb*=mix(vec3(.95,.94,.92),vec3(1.03,1.04,1.05),tone);
            trim.rgb*=1.-glassAmt*(.12+.35*tone);
            diffuseColor.rgb=mix(diffuseColor.rgb,trim.rgb,trim.a*archDetail);
            litWindow=glassAmt*step(.64,tone)*mix(.3,1.,tone);
            reliefWeight*=1.-trim.a;
          }
        }
      }
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(archRough,.24,glassAmt);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      if(reliefWeight>.001)normal=archNormal(normal,-vViewPosition,vArchMetric,microNormal,reliefWeight);`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float sky=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.);
      totalEmissiveRadiance+=glassAmt*(1.-uNight)*vec3(.016,.032,.045)*(1.+1.8*sky);
      totalEmissiveRadiance+=litWindow*uNight*vec3(.86,.48,.22);`);
    addRoofPhotography(s,'vArchXZ','vArchData.x>3.5 && vArchData.x<4.5 ? 0.84 : 0.0');
  };
  return mat;
}
