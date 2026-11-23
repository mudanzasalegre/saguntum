import * as T from 'three';
import {addRoofPhotography} from './territory-surface-photo.js';
import {addRegionalRoofPhotography} from './territory-ortho.js';
import {openingBounds} from './territory-building-style.js';
import {urbanLighting} from './territory-urban-sky.js';

const dir=new URL('../assets/materials/architecture/',import.meta.url);
const apertures=Array.from({length:24},(_,i)=>
  'vec4('+openingBounds(Math.floor(i/4),i%4).map(v=>v.toFixed(6)).join(',')+')').join(',');
function broadRoofPhoto(shader,photography,coord,eligible){
  if(!photography)return;
  addRegionalRoofPhotography(shader,photography);
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`
    #include <alphamap_fragment>
    if(${eligible}){
      vec3 raster=regionalPhotoAt(${coord}).rgb;
      // At the edge of a roof the oblique capture can see trees or deep
      // street shadows. Retain the footprint's sampled roof colour there.
      float green=raster.g-max(raster.r,raster.b);
      float trusted=(1.-smoothstep(.008,.061,green))*smoothstep(.014,.082,dot(raster,vec3(.2126,.7152,.0722)));
      diffuseColor.rgb=mix(diffuseColor.rgb,raster,.80*trusted);
    }`);
}

export function skylineMaterial(photography){
  const material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  if(photography){
    material.onBeforeCompile=s=>{
      const vary='varying vec2 vAerialRoofXZ; varying float vAerialRoofNormal;\n';
      s.vertexShader=vary+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vAerialRoofXZ=position.xz;vAerialRoofNormal=normal.y;`);
      s.fragmentShader=vary+s.fragmentShader;
      broadRoofPhoto(s,photography,'vAerialRoofXZ','vAerialRoofNormal>.85');
      urbanLighting(s,true);
    };
    material.customProgramCacheKey=()=>'territorial-skyline-38';
  }
  return material;
}

let loadedScans;
export function architectureScans(){
  if(loadedScans)return loadedScans;
  const textures=new T.TextureLoader(),ready={value:0};
  const compact=matchMedia('(pointer: coarse)').matches||(navigator.deviceMemory||8)<=4;
  const slots={uArchSurface:{value:null},uArchRelief:{value:null},uArchBay:{value:null},uArchGlass:{value:null}};
  Promise.all(Object.entries(slots).map(async([name,slot],i)=>{
    const path=['surfaces','microrelief','joinery','glazing'][i]+(compact?'-compact':'')+'.webp';
    const tex=await textures.loadAsync(new URL(path,dir).href);
    if(name==='uArchSurface'||name==='uArchBay')tex.colorSpace=T.SRGBColorSpace;
    tex.anisotropy=4;slot.value=tex;
  })).then(()=>{ready.value=1;}).catch(e=>console.warn('Material arquitectónico',e));
  return loadedScans={...slots,uArchReady:ready};
}

export function architecturalMaterial(night,photography){
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide});
  mat.defines={USE_UV:''};
  mat.customProgramCacheKey=()=>'territorial-architecture-38';
  mat.onBeforeCompile=s=>{
    Object.assign(s.uniforms,architectureScans(),{uNight:night});
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
      // Box-projected glazing. Only exposed glass participates. The three
      // room planes, drape and street reflection move with the viewer.
      const vec4 apertures[24]=vec4[24](${apertures});
      vec3 behindGlass(vec2 pane,float tone,vec3 viewRay,vec3 reflection){
        pane=clamp(pane,.002,.998);
        float wall=clamp(viewRay.z,.055,1.);
        vec3 path=vec3(-viewRay.xy,wall);
        // Positive depth points into the room, xy spans the whole far wall.
        vec2 stepXY=path.xy*vec2(1.36,.9);
        vec2 extent=mix(pane,1.-pane,step(vec2(0.),stepXY));
        vec2 exitAt=extent/max(abs(stepXY),vec2(.0001));
        float back=1./wall;
        float hit=min(back,min(exitAt.x,exitAt.y));
        vec3 roomHit=vec3(pane+stepXY*hit,wall*hit);
        bool side=hit<back-.002&&exitAt.x<=exitAt.y;
        bool floorHit=hit<back-.002&&!side&&path.y<0.;
        vec3 plaster=mix(vec3(.23,.175,.102),vec3(.31,.315,.25),tone);
        vec3 room=plaster*(side?.54:floorHit?.38:hit<back-.002?.95:.78);
        // Indirect light is strongest close to the opening, and diminishes inside.
        room*=mix(.82,.42,roomHit.z)*(.81+.19*smoothstep(0.,.2,roomHit.y));
        float drapeEdge=.06+.23*tone;
        float curtain=1.-smoothstep(drapeEdge-.015,drapeEdge+.015,pane.x+.045*stepXY.x);
        vec3 fabric=mix(vec3(.42,.37,.27),vec3(.57,.56,.48),tone);
        room=mix(room,fabric*(.68+.17*cos(pane.x*112.)),curtain);
        vec3 reflected=mix(vec3(.155,.122,.08),vec3(.30,.45,.54),smoothstep(-.17,.53,reflection.y));
        #if defined(USE_ENVMAP) && defined(ENVMAP_TYPE_CUBE_UV)
          // The probe is the same sky and clouds as those above this street.
          vec3 skyRadiance=textureCubeUV(envMap,envMapRotation*reflection,.14).rgb;
          reflected=mix(reflected,min(skyRadiance,vec3(2.4)),.56);
        #endif
        // Reflect the measured street enclosure at the pane. A ray leaving
        // the roof line sees sky; one meeting the opposite block sees render.
        if(uUrbanReady*uUrbanEnabled>.5&&vArchRange<82.&&reflection.y<.93){
          vec2 direction=normalize(reflection.xz+vec2(.00001));
          float slope=reflection.y/max(.04,length(reflection.xz));
          float coverage=0.;
          for(int stepIndex=0;stepIndex<5;stepIndex++){
            float distance=6.+3.*float(stepIndex)+2.*float(stepIndex*stepIndex);
            vec2 hit=urbanUv(vUrbanPoint.xz+direction*distance);
            if(any(lessThan(hit,vec2(0.)))||any(greaterThan(hit,vec2(1.))))break;
            vec3 field=textureLod(uUrbanField,hit,0.).rgb;
            float top=field.r*255.-8.,rayY=vUrbanPoint.y+distance*slope;
            float intercept=smoothstep(.0,1.8,top-rayY)*step(.005,field.r);
            // The reflected tone follows sky exposure and daylight. It
            // deliberately carries no fabricated signs or shop displays.
            vec3 opposite=mix(vec3(.41,.37,.31),vec3(.105,.127,.142),field.g);
            float weight=intercept*(1.-coverage);
            reflected=mix(reflected,opposite,weight);coverage+=weight;
            if(coverage>.98)break;
          }
        }
        float fresnel=.18+.59*pow(1.-wall,2.4);
        vec2 rim=min(pane,1.-pane);
        float ambient=.72+.28*smoothstep(.0,.093,min(rim.x,rim.y));
        return mix(room*ambient,reflected,fresnel);
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
    s.fragmentShader=varyings+s.fragmentShader.replace('void main() {',fragment+'\nvoid main() {');
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float archDetail=(1.-smoothstep(220.,780.,vArchRange))*uArchReady;
      float archSides=step(-1.5,vArchData.y);
      float glassAmt=0.,litWindow=0.,archRough=.88,archMetal=0.,reliefWeight=0.;
      vec2 microNormal=vec2(0.);
      if(archDetail>.001){
        float index=floor(vArchData.x+.5);
        vec2 dx,dy;
        vec2 coord=surfaceUV(vArchMetric,index,dx,dy);
        vec3 scan=textureGrad(uArchSurface,coord,dx,dy).rgb;
        vec3 nr=textureGrad(uArchRelief,coord,dx,dy).rgb;
        diffuseColor.rgb*=mix(vec3(1.),clamp(scan*2.32,vec3(.25),vec3(1.95)),archDetail*(index==0.?.49:.86));
        archRough=mix(.88,nr.b,archDetail*.74);
        if(index==2.||index==6.)archMetal=archDetail*clamp(.72*(1.-nr.b)+.10,.1,.58);
        microNormal=nr.rg*2.-1.;
        reliefWeight=(1.-smoothstep(34.,170.,vArchRange))*(index==0.?.43:.81);
        if(archSides>.5){
          float above=vArchMetric.y,eave=vArchData.w*.1-above;
          float localHeight=above-vArchGrade.x-vArchBay.x*vArchGrade.y;
          float base=1.-smoothstep(.35,.47,localHeight);
          float coping=1.-smoothstep(.09,.17,eave);
          diffuseColor.rgb*=1.-archDetail*(.20*base+.12*(1.-smoothstep(.0,.13,abs(eave-.24))));
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.86+vec3(.125),coping*archDetail*.88);
          float fabricClass=floor(vArchData.y+.5),family=mod(fabricClass,6.);
          if(fabricClass>=0.&&fabricClass<12.&&family<2.5&&localHeight<.8){
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
          if(fabricClass>=0.&&bay.y>=0.){
            vec2 floorBay=floor(bay),f=fract(bay),style=vec2(family,mod(floor(vArchData.z+.5),1024.));
            bool yard=fabricClass>=12.;
            float col=mod(floorBay.x+style.y,4.);
            bool balcony=!yard&&(col<.5 || (mod(style.y,3.)<.5&&col<1.5) ||
                         (floorBay.y==1.&&mod(style.y,5.)<.5&&mod(floorBay.x+style.y,2.)<.5));
            float variant=floorBay.y<1.?(fabricClass<6.?2.:3.):(balcony?0.:1.);
            // Court openings are narrower and fitted above the working plinth.
            if(yard){
              f.x=(f.x-.5)*1.48+.5;
              if(floorBay.y<1.){f.y=(f.y-.61)*1.52+.61;variant=1.;}
            }
            float tone=mod((floorBay.x+style.y*3.)*17.+floorBay.y*37.+mod(style.y,7.)*floorBay.x*5.,97.)/97.;
            float openingVariant=variant;
            vec4 opening=apertures[int(family)*4+int(openingVariant)];
            vec2 pane=(f-opening.xz)/(opening.yw-opening.xz);
            variant+=tone>.64?4.:0.;
            vec2 grid=vec2(6.,8.);
            vec2 bayUV=(vec2(style.x,variant)+.006+.988*f)/grid;
            vec2 bx=dFdx(vArchBay)*.988/grid,by=dFdy(vArchBay)*.988/grid;
            float inBay=step(0.,min(f.x,f.y))*step(max(f.x,f.y),1.);
            vec4 trim=textureGrad(uArchBay,bayUV,bx,by)*inBay;
            glassAmt=textureGrad(uArchGlass,bayUV,bx,by).r*archDetail*inBay;
            vec3 V=normalize(vViewPosition),N=normalize(vNormal);
            vec3 dp=dFdx(-vViewPosition),dq=dFdy(-vViewPosition);
            vec2 du=dFdx(vArchMetric),dv=dFdy(vArchMetric);
            float handed=sign(du.x*dv.y-du.y*dv.x);
            vec3 tangent=dp*dv.y-dq*du.y,vertical=dq*du.x-dp*dv.x;
            vec3 ray=vec3(handed*dot(V,tangent)/max(length(tangent),.00001),
                          handed*dot(V,vertical)/max(length(vertical),.00001),abs(dot(V,N)));
            if(glassAmt>.025&&vArchRange<145.){
              vec3 refl=inverseTransformDirection(reflect(-V,N),viewMatrix);
              vec3 interior=behindGlass(pane,tone,ray,refl);
              trim.rgb=mix(trim.rgb,interior,glassAmt*(1.-smoothstep(70.,145.,vArchRange))*.91);
            }
            // Gentle contact at a projecting sill and water marks at its two
            // drip edges. Distances are fractions of the same physical opening.
            float below=max(0.,-pane.y),frameSpan=smoothstep(-.08,.04,pane.x)*(1.-smoothstep(.96,1.08,pane.x));
            float sillShade=(1.-smoothstep(0.,.21,below))*step(pane.y,0.)*frameSpan;
            float shoulders=min(abs(pane.x-.04),abs(1.-pane.x-.04));
            float runoff=(1.-smoothstep(.007,.07,shoulders))*(1.-smoothstep(.02,.54,below))*step(pane.y,0.);
            diffuseColor.rgb*=1.-archDetail*(.19*sillShade+.09*runoff)*(.47+.53*tone);
            trim.rgb*=mix(vec3(.95,.94,.92),vec3(1.03,1.04,1.05),tone);
            trim.rgb*=1.-glassAmt*(.035+.12*tone);
            diffuseColor.rgb=mix(diffuseColor.rgb,trim.rgb,trim.a*archDetail);
            litWindow=glassAmt*step(.64,tone)*mix(.3,1.,tone);
            reliefWeight*=1.-trim.a;
          }
        }
      }
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(archRough,.24,glassAmt);`)
      .replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
      metalnessFactor=mix(archMetal,0.,glassAmt);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      if(reliefWeight>.001)normal=archNormal(normal,-vViewPosition,vArchMetric,microNormal,reliefWeight);`)
      .replace('#include <aomap_fragment>',`#include <aomap_fragment>
      float exposureCode=floor((vArchData.z+.5)/1024.);
      if(exposureCode>.5){
        float heightFraction=clamp(vArchMetric.y/max(.5,vArchData.w*.1),0.,1.);
        float blocked=mod(exposureCode,8.)/7.*mix(1.,floor(exposureCode/8.)/3.,heightFraction);
        reflectedLight.indirectDiffuse*=1.-.53*blocked;
        reflectedLight.indirectSpecular*=1.-.34*blocked;
      }`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float sky=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.);
      totalEmissiveRadiance+=glassAmt*(1.-uNight)*vec3(.016,.032,.045)*(1.+1.8*sky);
      totalEmissiveRadiance+=litWindow*uNight*vec3(.86,.48,.22);`);
    const isRoof='abs(vArchData.y+2.)<.1 && vArchData.x>=3.9 && vArchData.x<=6.1';
    broadRoofPhoto(s,photography,'vArchXZ',isRoof);
    addRoofPhotography(s,'vArchXZ',isRoof+' ? 0.84 : 0.0');
    urbanLighting(s,true);
  };
  return mat;
}
