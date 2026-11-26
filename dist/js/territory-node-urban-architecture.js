import {MeshLambertNodeMaterial,MeshStandardNodeMaterial} from 'three/webgpu';
import {Fn,If,wgslFn,texture,textureCubeUV,sampler,attribute,uv,vec2,vec3,float,mix,clamp,min,fract,floor,mod,cos,
  abs,dFdx,dFdy,fwidth,dot,normalize,positionWorld,positionView,normalViewGeometry,
  normalWorldGeometry,reflect,cameraPosition,smoothstep,materialEnvRotation} from 'three/tsl';
import {architectureScans} from './territory-building-material.js';
import {openingBounds} from './territory-building-style.js';
import {liveTexture,liveUniform,urbanField,applyUrbanLightNodes} from './territory-node-urban-light.js';
import {photoRoofColor} from './territory-node-photography.js';
import {realismUniforms} from './territory-realism.js';

const apertures=Array.from({length:24},(_,i)=>
  'vec4f('+openingBounds(Math.floor(i/4),i%4).map(n=>n.toFixed(6)).join(',')+')').join(',\n');

// Each result column carries a physical material input, evaluated once. The
// depth ray and the opening share the dimensions used by the balcony geometry.
const facade=wgslFn(`fn cadastralFacade(metric:vec4f,data:vec4f,bayIn:vec2f,base:vec3f,
 point:vec3f,viewPoint:vec3f,viewNormal:vec3f,refl:vec3f,ready:f32,urban:f32,night:f32,wetness:f32,
 surfaces:texture_2d<f32>,surfSampler:sampler,relief:texture_2d<f32>,relSampler:sampler,
 joinery:texture_2d<f32>,baySampler:sampler,glazing:texture_2d<f32>,glassSampler:sampler,
 heights:texture_2d<f32>,fieldSampler:sampler)->mat4x4f{
 let sizes=array<f32,8>(1.,1.9,2.7,3.,2.,2.6,1.12,2.5);
 let openings=array<vec4f,24>(${apertures});
 let index=u32(clamp(floor(data.x+.5),0.,7.)); let scale=sizes[index];
 // Match r180 TSL dFdy: the WebGPU framebuffer Y axis points down. Negate
 // raw dpdy so scanned relief keeps the same tangent basis as WebGL.
 let dxy=dpdx(metric.xy); let dyy=-dpdy(metric.xy); let dbx=dpdx(bayIn); let dby=-dpdy(bayIn);
 let dp=dpdx(viewPoint); let dq=-dpdy(viewPoint);
 let N=normalize(viewNormal); let V=normalize(-viewPoint); let range=-viewPoint.z;
 let archDetail=(1.-smoothstep(220.,780.,range))*ready;
 var color=base; var rough=.88; var metal=0.; var gl=0.; var lit=0.; var perturb=vec2f(0.); var reliefWeight=0.;
 var skyWeight=vec3f(0.);var reveal=0.;var revealNormal=vec3f(0.);var joineryCover=0.;
 if(archDetail>.001){
   let tile=metric.xy/scale; let span=vec2f(.25,.5)*(504./512.);
   let coords=(vec2f(f32(index%4u),f32(index/4u))+4./512.)*vec2f(.25,.5)+fract(tile)*span;
   let grain=textureSampleGrad(surfaces,surfSampler,coords,dxy/scale*span,dyy/scale*span).rgb;
   let nr=textureSampleGrad(relief,relSampler,coords,dxy/scale*span,dyy/scale*span).rgb;
   color*=mix(vec3f(1.),clamp(grain*2.32,vec3f(.25),vec3f(1.95)),archDetail*select(.86,.49,index==0u));
   let weather=sin(point.x*.21+sin(point.z*.12))*sin(point.z*.19+metric.y*.16);
   let broad=archDetail*(1.-smoothstep(95.,260.,range));
   color*=1.+weather*broad*select(.035,.065,index==0u);
   rough=mix(.88,nr.b,archDetail*.74);
   if(index==2u||index==6u){metal=archDetail*clamp(.72*(1.-nr.b)+.1,.1,.58);}
   perturb=nr.rg*2.-1.; reliefWeight=(1.-smoothstep(34.,170.,range))*select(.81,.43,index==0u);
   if(data.y>=-1.5){
     let above=metric.y; let eave=data.w*.1-above; let localHeight=above-metric.z-bayIn.x*metric.w;
     if(index<2u){
       let tide=.30+.08*sin(metric.x*2.1)+.035*sin(metric.x*7.3);
       let salt=(1.-smoothstep(.018,.105,abs(localHeight-tide)))*(.62+.38*nr.b);
       let damp=1.-smoothstep(.06,tide,localHeight);
       color=mix(color*(1.-.065*damp*broad),vec3f(.49,.44,.34),salt*.12*broad);
       rough=mix(rough,.95,salt*.3*broad);
     }
     color*=1.-archDetail*(.20*(1.-smoothstep(.35,.47,localHeight))+.12*(1.-smoothstep(0.,.13,abs(eave-.24))));
     color=mix(color,color*.86+.125,(1.-smoothstep(.09,.17,eave))*archDetail*.88);
     let fabric=i32(floor(data.y+.5)); let fam=u32(max(0,fabric)%6);
     if(fabric>=0&&fabric<12&&fam<3u&&localHeight<.8){
       let gravel=(vec2f(3.,0.)+4./512.)*vec2f(.25,.5)+fract(metric.xy*(1.45/3.))*span;
       let stone=textureSampleGrad(surfaces,surfSampler,gravel,dxy*(1.45/3.)*span,dyy*(1.45/3.)*span).rgb;
       color=mix(color,stone*vec3f(.79,.73,.63),(1.-smoothstep(.55,.59,localHeight))*archDetail*.78);
     }
     var bay=bayIn;
     if(bay.y<1.){
       let threshold=metric.z+(floor(bay.x)+.5)*metric.w;
       let storey=select(3.05,above/bay.y,abs(bay.y)>.0001);
       bay.y=(above-threshold)/max(.65,storey-threshold);
     }
     if(fabric>=0&&bay.y>=0.){
       let seed=i32(floor(data.z+.5))%1024; let axis=vec2i(floor(bay)); var f=fract(bay);
       let yard=fabric>=12; let col=(axis.x+seed)%4;
       let balcony=!yard&&(col==0||(seed%3==0&&col==1)||(axis.y==1&&seed%5==0&&(axis.x+seed)%2==0));
       var variant=select(1u,0u,balcony);
       if(axis.y==0){variant=select(3u,2u,fabric<6);}
       if(yard){f.x=(f.x-.5)*1.48+.5;if(axis.y==0){f.y=(f.y-.61)*1.52+.61;variant=1u;}}
       let tone=f32(((axis.x+seed*3)*17+axis.y*37+(seed%7)*axis.x*5)%97)/97.;
       let bounds=openings[fam*4u+variant]; let pane=(f-bounds.xz)/(bounds.yw-bounds.xz);
       let hand=sign(dxy.x*dyy.y-dxy.y*dyy.x);
       let t=dp*dyy.y-dq*dxy.y;let v=dq*dxy.x-dp*dyy.x;
       let viewAlong=hand*vec2f(dot(V,t)/max(length(t),.00001),dot(V,v)/max(length(v),.00001));
       var sampleAt=f;var innerPane=pane;var frameContact=1.;
       if(!yard&&axis.y>=1&&range<65.&&all(pane>=vec2f(0.))&&all(pane<=vec2f(1.))){
         let metres=clamp(sqrt(dxy*dxy+dyy*dyy)/max(sqrt(dbx*dbx+dby*dby),vec2f(.00001)),vec2f(.6),vec2f(12.));
         let near=1.-smoothstep(28.,65.,range);let depth=select(.09,.14,fam<3u)*near;
         let back=f-viewAlong*depth/(metres*max(.22,abs(dot(V,N))));
         let edge=min(back-bounds.xz,bounds.yw-back)*metres;let rim=min(edge.x,edge.y);
         let aa=abs(dxy)+abs(dyy);let pixel=clamp(max(aa.x,aa.y)*.55,.004,.042);
         reveal=(1.-smoothstep(-pixel,pixel,rim))*near;
         let jamb=t*hand*select(-1.,1.,back.x<(bounds.x+bounds.y)*.5);
         let ledge=v*hand*select(-1.,1.,back.y<(bounds.z+bounds.w)*.5);
         revealNormal=select(ledge,jamb,edge.x<edge.y);revealNormal/=max(length(revealNormal),.00001);
         sampleAt=clamp(back,bounds.xz+.0005,bounds.yw-.0005);
         innerPane=(sampleAt-bounds.xz)/(bounds.yw-bounds.xz);
         frameContact=1.-.15*near*(1.-smoothstep(0.,.065,rim));
       }
       let bayUV=(vec2f(f32(fam),f32(variant+select(0u,4u,tone>.64)))+.006+.988*sampleAt)/vec2f(6.,8.);
       let spanBay=.988/vec2f(6.,8.); let valid=select(0.,1.,all(f>=vec2f(0.))&&all(f<=vec2f(1.)));
       let trim=textureSampleGrad(joinery,baySampler,bayUV,dbx*spanBay,dby*spanBay)*valid;
       joineryCover=clamp(trim.a*archDetail*(1.-reveal),0.,1.);
       var trimColor=trim.rgb;
       gl=textureSampleGrad(glazing,glassSampler,bayUV,dbx*spanBay,dby*spanBay).r*archDetail*valid*(1.-reveal);
       if(gl>.025&&range<145.){
         let wall=clamp(abs(dot(V,N)),.055,1.);let ray=-viewAlong*vec2f(1.36,.9);
         let p=clamp(innerPane,vec2f(.002),vec2f(.998)); let exitAt=select(p,1.-p,ray>=vec2f(0.))/max(abs(ray),vec2f(.0001));
         let back=1./wall; let hit=min(back,min(exitAt.x,exitAt.y)); let side=hit<back-.002&&exitAt.x<=exitAt.y;
         var value=.78;if(hit<back-.002){value=select(select(.95,.38,ray.y<0.),.54,side);}
         var room=mix(vec3f(.23,.175,.102),vec3f(.31,.315,.25),tone)*value*
              mix(.82,.42,wall*hit)*(.81+.19*smoothstep(0.,.2,p.y+ray.y*hit));
         let edge=.06+.23*tone; let curtain=1.-smoothstep(edge-.015,edge+.015,p.x+.045*ray.x);
         room=mix(room,mix(vec3f(.42,.37,.27),vec3f(.57,.56,.48),tone)*(.68+.17*cos(p.x*112.)),curtain);
         var reflected=mix(vec3f(.155,.122,.08),vec3f(.30,.45,.54),smoothstep(-.17,.53,refl.y));
         var skyVisible=1.;
         if(urban>.5&&range<82.&&refl.y<.93){
           let direction=normalize(refl.xz+vec2f(.00001)); let slope=refl.y/max(.04,length(refl.xz)); var coverage=0.;
           for(var i=0;i<5;i++){let d=6.+3.*f32(i)+2.*f32(i*i);
             let coord=(point.xz+direction*d-vec2f(1750.,4750.))*vec2f(1./9747.4981,-1./6500.);
             if(any(coord<vec2f(0.))||any(coord>vec2f(1.))){break;}
             let field=textureSampleLevel(heights,fieldSampler,coord,0.).rgb;
             let weight=smoothstep(0.,1.8,field.r*255.-8.-point.y-d*slope)*step(.005,field.r)*(1.-coverage);
             reflected=mix(reflected,mix(vec3f(.41,.37,.31),vec3f(.105,.127,.142),field.g),weight);
             skyVisible*=1.-weight;
             coverage+=weight;if(coverage>.98){break;}
           }
         }
         let rim=min(p,1.-p);
         let fresnel=.18+.59*pow(1.-wall,2.4);let paneMix=gl*(1.-smoothstep(70.,145.,range))*.91;
         let interior=mix(room*(.72+.28*smoothstep(0.,.093,min(rim.x,rim.y))),reflected,fresnel);
         trimColor=mix(trimColor,interior,paneMix);
         skyWeight=vec3f(.56*skyVisible*fresnel*paneMix*trim.a*archDetail);
       }
       let below=max(0.,-pane.y); let spanX=smoothstep(-.08,.04,pane.x)*(1.-smoothstep(.96,1.08,pane.x));
       let sill=(1.-smoothstep(0.,.21,below))*step(pane.y,0.)*spanX;
       let runoff=(1.-smoothstep(.007,.07,min(abs(pane.x-.04),abs(.96-pane.x))))*(1.-smoothstep(.02,.54,below))*step(pane.y,0.);
       color*=1.-archDetail*(.19*sill+.09*runoff)*(.47+.53*tone);
       let tint=mix(vec3f(.95,.94,.92),vec3f(1.03,1.04,1.05),tone)*(1.-gl*(.035+.12*tone));
       trimColor*=tint*frameContact;skyWeight*=tint*frameContact*(1.-reveal);
       color=mix(color,trimColor,trim.a*archDetail*(1.-reveal));lit=gl*step(.64,tone)*mix(.3,1.,tone);reliefWeight*=1.-trim.a;
     }
     let porous=index<2u||index==3u||index==4u||index==7u;
     if(porous&&wetness>.001){
       let run=.5+.5*sin(point.x*.67+point.z*.49+sin(above*.19));
       let splash=1.-smoothstep(.16,1.05,localHeight);
       let shelter=smoothstep(.14,.70,eave);
       let dampWall=clamp(wetness,0.,1.)*archDetail*(1.-joineryCover)*(.28+.28*run+.36*splash)*shelter;
       color*=1.-.22*dampWall;
       rough=mix(rough,max(.46,rough*.71),dampWall);
       reliefWeight*=1.-.18*dampWall;
     }
   }
 }
 let tangent=cross(dq,N)*dxy.x+cross(N,dp)*dyy.x;let bitan=cross(dq,N)*dxy.y+cross(N,dp)*dyy.y;
 let inv=inverseSqrt(max(1.e-8,max(dot(tangent,tangent),dot(bitan,bitan))));
 var pn=normalize(N+(tangent*perturb.x+bitan*perturb.y)*inv*reliefWeight);
 if(reveal>.001){pn=normalize(mix(pn,revealNormal,reveal));}
 let sky=pow(1.-clamp(dot(pn,V),0.,1.),2.);
 let emission=gl*(1.-night)*vec3f(.016,.032,.045)*(1.+1.8*sky)+lit*night*vec3f(.86,.48,.22);
 let code=u32(floor((data.z+.5)/1024.));
 let blocked=f32(code%8u)/7.*mix(1.,f32(code/8u)/3.,clamp(metric.y/max(.5,data.w*.1),0.,1.));
 return mat4x4f(vec4f(color,mix(rough,.24,gl)),vec4f(pn,mix(metal,0.,gl)),vec4f(emission,blocked),vec4f(skyWeight,0.));
}`);

export function buildingNodes(source,record){
  const data=attribute('archData','vec4'),a=architectureScans(),surface=liveTexture(a.uArchSurface,true),relief=liveTexture(a.uArchRelief),
    joinery=liveTexture(a.uArchBay,true),glass=liveTexture(a.uArchGlass),field=urbanField();
  const reflection=reflect(normalize(positionWorld.sub(cameraPosition)),normalWorldGeometry);
  const result=facade(attribute('archMetric','vec4'),data,uv(),attribute('color','vec3'),positionWorld,positionView,
    normalViewGeometry,reflection,
    liveUniform(a.uArchReady),field.active,liveUniform(record.night),liveUniform(realismUniforms.wetness),
    surface,sampler(surface),relief,sampler(relief),joinery,sampler(joinery),glass,sampler(glass),field.map,sampler(field.map)).toVar('facadeFinishData');
  const node=new MeshStandardNodeMaterial({side:source.side});
  const roof=abs(data.y.add(2)).lessThan(.1).and(data.x.greaterThanEqual(3.9)).and(data.x.lessThanEqual(6.1)).select(1,0);
  const finish=Fn(({scene})=>{
    const color=result.element(0).rgb.toVar(),probe=scene.environment;
    if(probe?.isPMREMTexture){
      // Reuse the solar sky probe. Only glass with visible sky reads the
      // cubemap. This still leaves the measured opposite block in reflection.
      const weight=result.element(3).rgb;
      If(weight.r.greaterThan(.00001),()=>{
        const h=probe.image.height,mip=Math.log2(h)-2,w=3*Math.max(2**mip,112);
        const dir=materialEnvRotation.mul(vec3(reflection.x,reflection.y.negate(),reflection.z));
        const sky=textureCubeUV(texture(probe),dir,.14,1/w,1/h,mip);
        const plain=mix(vec3(.155,.122,.08),vec3(.30,.45,.54),smoothstep(-.17,.53,reflection.y));
        color.addAssign(min(sky,vec3(2.4)).sub(plain).mul(weight));
      });
    }
    return color;
  })();
  const regional=photoRoofColor(finish,positionWorld.xz,roof,record.photography,false);
  node.colorNode=photoRoofColor(regional,positionWorld.xz,roof.mul(.84),null);
  node.roughnessNode=result.element(0).a;node.normalNode=result.element(1).xyz;node.metalnessNode=result.element(1).a;
  node.emissiveNode=result.element(2).rgb;
  applyUrbanLightNodes(node,true,result.element(2).a);return node;
}

export function skylineNodes(source,record){
  const node=new MeshLambertNodeMaterial({side:source.side});
  node.colorNode=photoRoofColor(attribute('color','vec3'),positionWorld.xz,normalWorldGeometry.y.greaterThan(.85).select(1,0),record.photography,false);
  applyUrbanLightNodes(node,true);return node;
}

const detailRelief=wgslFn(`fn facadeDetailRelief(viewPoint:vec3f,n:vec3f,metres:vec2f,micro:vec2f,weight:f32)->vec3f{
  let dp=dpdx(viewPoint);let dq=-dpdy(viewPoint);
  let du=dpdx(metres);let dv=-dpdy(metres);
  let t=cross(dq,n)*du.x+cross(n,dp)*dv.x;
  let b=cross(dq,n)*du.y+cross(n,dp)*dv.y;
  let inv=inverseSqrt(max(1.e-8,max(dot(t,t),dot(b,b))));
  return normalize(n+(t*micro.x+b*micro.y)*inv*weight);
}`);

export function detailNodes(source){
  const node=new MeshStandardNodeMaterial({side:source.side}),f=attribute('facadeFinish','float');
  const a=architectureScans(),ready=liveUniform(a.uArchReady),normal=normalWorldGeometry;
  const local=abs(normal.y).greaterThan(.5).select(positionWorld.xz,vec2(dot(positionWorld.xz,vec2(normal.z,normal.x.negate())),positionWorld.y));
  const slot=f.lessThan(.5).select(3,f.lessThan(1.5).select(4,2)),size=f.lessThan(.5).select(3,f.lessThan(1.5).select(2,2.7));
  const tile=local.div(size),span=vec2(.25,.5).mul(504/512);
  const coord=vec2(mod(slot,4),floor(slot.div(4))).add(4/512).mul(vec2(.25,.5)).add(fract(tile).mul(span));
  const sample=slot=>liveTexture(slot,slot===a.uArchSurface).sample(coord).grad(dFdx(tile).mul(span),dFdy(tile).mul(span));
  const pores=sample(a.uArchRelief),grain=clamp(dot(sample(a.uArchSurface).rgb,vec3(.2126,.7152,.0722)).mul(2.6),.37,1.6),r=pores.b;
  const woven=local.y.mul(32),thread=float(1).sub(smoothstep(.08,.45,fwidth(woven))).mul(cos(woven.mul(6.283185)).mul(.04).add(.08));
  const solid=f.lessThan(3.5).select(1,0),porous=f.lessThan(1.5);
  const wet=clamp(liveUniform(realismUniforms.wetness),0,1).mul(clamp(normal.y,0,1).mul(.68).add(.32)).mul(solid).mul(ready);
  node.colorNode=vec3(mix(1,f.lessThan(3.5).select(mix(1,grain,f.lessThan(.5).select(.27,f.lessThan(1.5).select(.32,.15))),thread.oneMinus()),ready))
    .mul(wet.mul(porous.select(-.14,-.04)).add(1));
  const rough=mix(.78,porous.select(mix(.88,r,.6),f.lessThan(3.5).select(mix(f.lessThan(2.5).select(.59,.40),r,.26),.94)),ready);
  node.roughnessNode=mix(rough,porous.select(.48,.26),wet.mul(.65));
  node.metalnessNode=f.greaterThanEqual(1.5).and(f.lessThan(3.5)).select(f.lessThan(2.5).select(.14,.62),0).mul(ready);
  const reliefWeight=porous.select(.21,.065).mul(wet.mul(-.38).add(1)).mul(solid).mul(ready);
  node.normalNode=detailRelief(positionView,normalViewGeometry,local,pores.rg.mul(2).sub(1),reliefWeight);
  return node;
}
