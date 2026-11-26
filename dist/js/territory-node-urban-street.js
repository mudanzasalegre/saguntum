import {MeshStandardNodeMaterial} from 'three/webgpu';
import {wgslFn,attribute,texture,sampler,uv,positionWorld,positionView,normalViewGeometry,normalWorldGeometry} from 'three/tsl';
import {applyUrbanLightNodes,liveUniform} from './territory-node-urban-light.js';
import {photoStreetColor} from './territory-node-photography.js';
import {realismUniforms} from './territory-realism.js';
import {streetWeatherWGSL} from './territory-street-weather.js';

const band=wgslFn(`fn streetBand(d:f32,w:f32,aa:f32)->f32{return 1.-smoothstep(w-aa,w+aa,d);}`);
const weather=wgslFn(streetWeatherWGSL);
const pavement=wgslFn(`fn streetPavement(profile:vec4f,ribbon:vec2f,metricXZ:vec2f,viewPoint:vec3f,N:vec3f,up:f32,wet:f32,
 diffuse:texture_2d<f32>,ds:sampler,relief:texture_2d<f32>,rs:sampler)->mat3x3f{
 let kind=profile.x;let mode=profile.w;let halfW=profile.z;
 let oriented=kind==1.||kind==3.||kind==4.||kind==6.||mode==2.;
 let metric=select(metricXZ,ribbon,oriented)/profile.y;
 let atlas=vec2f(kind-4.*floor(kind*.25),1.-floor(kind*.25));let grid=vec2f(.25,.5);
 let span=grid*(496./512.);let dx=dpdx(metric);let dy=dpdy(metric);
 let footprint=496.*max(length(dx),length(dy));let detail=1.-smoothstep(44.,140.,footprint);
 let guard=grid*(clamp(footprint*.42,8.,48.)/512.);let st=atlas*grid+guard+fract(metric)*(grid-2.*guard);
 let broad=textureSampleLevel(diffuse,ds,(atlas+.5)*grid,8.).rgb;
 let grain=textureSampleGrad(diffuse,ds,st,dx*span,dy*span).rgb;
 let micro=textureSampleGrad(relief,rs,st,dx*span,dy*span).rgb;
 var bed=mix(broad,grain,detail);
 let lateral=ribbon.x;let along=ribbon.y;let ax=abs(lateral);
 let acrossPixel=fwidth(lateral);let aa=max(.012,acrossPixel*.58);let alongAA=max(.015,fwidth(along)*.58);
 var paint=0.;var steel=0.;var polish=0.;
 let finish=streetWeather(metricXZ,kind,mode,up,wet,length(viewPoint),halfW,lateral);
 bed*=mix(1.,finish.x,detail);
 if(kind==0.&&(mode==1.||mode==8.||mode==9.)){
   let lane=select(halfW*.5,0.,mode==8.||halfW<2.35);
   polish=(1.-smoothstep(.15,.52,abs(abs(ax-lane)-.76)))*(1.-smoothstep(.15,.76,aa));
   let gutter=smoothstep(halfW-.49,halfW-.16,ax);
   bed*=1.-.12*polish-(.065+.055*(.5+.5*sin(along*.19+sin(along*.071))))*gutter;
 }
 if(mode==1.){
   let dash=streetBand(abs(fract(along/8.)*8.-2.),1.9,alongAA);
   paint=streetBand(ax,.062,aa)*dash*(1.-smoothstep(.1,.63,aa));
   bed=mix(bed,vec3f(.59,.57,.49),paint*clamp(.69+grain.g*1.3,0.,.94));
 }else if(mode==2.){
   let sleepers=streetBand(abs(fract(along/.60)-.5)*.60,.105,alongAA)*streetBand(ax,1.23,aa)*(1.-smoothstep(.15,.42,alongAA));
   bed=mix(mix(vec3f(dot(bed,vec3f(.3,.57,.13))),bed,.38)*.75,vec3f(.145,.13,.103),sleepers*.9);
   steel=streetBand(abs(ax-.78),.038,aa)*(1.-smoothstep(.07,.32,aa));bed=mix(bed,vec3f(.36,.38,.38),steel);
 }else if(mode==3.){
   let edge=streetBand(abs(lateral+halfW),.15,aa);bed=mix(bed,mix(vec3f(.34,.32,.28),grain,.26),edge);
   bed*=1.-streetBand(abs(fract(along/.84)-.5)*.84,.008,alongAA)*edge*.26*(1.-smoothstep(.025,.1,alongAA));
   let bedding=streetBand(abs(lateral+halfW-.15),.005,max(.002,acrossPixel*.55));
   bed*=1.-.31*bedding*(1.-smoothstep(.015,.06,aa));
 }else if(mode==4.){
   bed*=1.-.23*streetBand(abs(fract(along/.33)-.5)*.33,.018,alongAA)*(1.-smoothstep(.06,.16,alongAA));
 }else if(mode==5.){bed=mix(bed,vec3f(dot(bed,vec3f(.22,.70,.08)))*vec3f(1.10,1.035,.92),.63);}
 else if(mode==6.){bed*=vec3f(1.03,.99,.93)*.83;}
 else if(mode==7.){bed=mix(vec3f(.32,.30,.263),grain,.20)*(1.-streetBand(abs(fract(lateral/.96)-.5)*.96,.009,aa)*.37);}
 let tx=cross(dpdy(viewPoint),N)*dx.x+cross(N,dpdx(viewPoint))*dy.x;
 let ty=cross(dpdy(viewPoint),N)*dx.y+cross(N,dpdx(viewPoint))*dy.y;
 let inv=inverseSqrt(max(max(dot(tx,tx),dot(ty,ty)),1.e-10));
 let xy=(micro.rg*2.-1.)*.56*detail*(1.-steel)*(1.-finish.z*.94)*(1.-finish.y*.18);
 let normal=normalize(N*sqrt(max(1.-dot(xy,xy),.05))+(tx*xy.x+ty*xy.y)*inv);
 var rough=mix(mix(.93,clamp(micro.b,.48,1.),detail)-polish*.09,.35,steel);
 rough=mix(rough,finish.w,finish.y*.72);
 rough=clamp(mix(rough,.105+.025*micro.b,finish.z),.105,1.);
 bed*=1.-finish.y*select(.19,.29,kind==0.)-finish.z*.055;
 return mat3x3f(bed,normal,vec3f(rough,select(0.,1.,kind==0.&&mode!=2.&&paint<.05),0.));
}`,[band,weather]);

export function streetNodes(source,record){
  const node=new MeshStandardNodeMaterial({side:source.side,polygonOffset:source.polygonOffset,
    polygonOffsetFactor:source.polygonOffsetFactor,polygonOffsetUnits:source.polygonOffsetUnits});
  const albedo=texture(record.diffuse),relief=texture(record.detail);
  const p=pavement(attribute('streetProfile','vec4'),uv(),positionWorld.xz,positionView,normalViewGeometry,normalWorldGeometry.y,liveUniform(realismUniforms.wetness),
    albedo,sampler(albedo),relief,sampler(relief)).toVar('pavingResult');
  node.colorNode=photoStreetColor(p.element(0),positionWorld.xz,p.element(2).y);
  node.normalNode=p.element(1);node.roughnessNode=p.element(2).x;
  applyUrbanLightNodes(node);return node;
}
