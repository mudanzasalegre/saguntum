// Portable coastal optics pilot, directly derived from coastalWaterFragment.
// Same physical metre scales, generated normals, and geographic shore field;
// uses the r180 node planar reflector instead of WebGL Water.onBeforeRender.
// Shadow-mask/cut parity and reflection cadence still require browser validation.
import * as G from 'three/webgpu';
import {positionWorld,cameraPosition,screenUV,reflector,uniform,texture,vec2,vec3,float,time,dot,length,normalize,sin,cos,pow,exp,abs,max,min,mix,smoothstep,clamp,fwidth,dFdx,dFdy} from 'three/tsl';
import {createShoreField,createWaveNormals} from './coast-water.js';
import {createWaterGeometry} from './coast-environment.js';

export function projectedShorelines(shorelines,project){
 const lon=-.21,lat=39.66,c=project(lon,lat),e=project(lon+.001,lat),n=project(lon,lat+.001);
 const a=(e.x-c.x)*1000,b=(n.x-c.x)*1000,d=(e.z-c.z)*1000,f=(n.z-c.z)*1000,det=a*f-b*d;
 if(!Number.isFinite(det)||Math.abs(det)<1e-8)throw Error('Proyección litoral inválida.');
 return shorelines.map(line=>line.map(([x,z])=>({x,z,lon:lon+((x-c.x)*f-(z-c.z)*b)/det,lat:lat+((z-c.z)*a-(x-c.x)*d)/det})));
}
export function createNativeCoast({mask,shorelines,project,compact=false,reduced=false}){
 const lines=projectedShorelines(shorelines,project);
 const shore=createShoreField({data:{projectedShorelines:lines},project,mask,mobile:compact});
 const waves=createWaveNormals();
 const material=new G.MeshBasicNodeMaterial({side:G.FrontSide,fog:true,toneMapped:true});
 const geometry=createWaterGeometry(mask),water=new G.Mesh(geometry,material);
 water.name='Mediterráneo · óptica litoral TSL (piloto)';
 water.rotation.x=-Math.PI/2;water.position.y=.08;
 const reflection=reflector({resolutionScale:compact?.26:.42,bounces:false,samples:0});
 water.add(reflection.target);
 const sunDirection=uniform(new G.Vector3(-180,300,-190).normalize());
 const sunColor=uniform(new G.Color('#fff5df')),waterColor=uniform(new G.Color('#195f73'));
 const shallowColor=uniform(new G.Color('#589e9c')),foamColor=uniform(new G.Color('#d5e7de'));
 const strength=uniform(1),clock=reduced?float(0):time;
 const p=positionWorld.xz,viewVector=cameraPosition.sub(positionWorld),eyeDistance=max(length(viewVector),.1),viewDirection=viewVector.div(eyeDistance);
 const origin=vec2(shore.bounds.x,shore.bounds.y),size=vec2(shore.bounds.z,shore.bounds.w);
 const shoreUV=p.sub(origin).div(size);
 const field=texture(shore.texture,clamp(shoreUV,vec2(0),vec2(1)));
 const overflow=max(max(shoreUV.negate(),shoreUV.sub(1)),vec2(0)).mul(size);
 const shoreDistance=min(224,max(0,dot(field.rg,vec2(256,1)).mul(256/257).sub(32)).add(length(overflow)));
 const character=field.b;
 function waveSample(coord){return texture(waves,coord).rg.mul(2).sub(1);}
 function swell(dx,dz,wavelength,slope,speed){
  const dir=vec2(dx,dz),cross=vec2(-dz,dx);
  const phase=dot(dir,p).mul(2*Math.PI/wavelength).sub(clock.mul(speed))
   .add(sin(dot(cross,p).mul(.017).add(clock.mul(.13))).mul(.45))
   .add(sin(p.x.mul(.008).sub(p.y.mul(.014))).mul(.22));
  return dir.mul(cos(phase)).mul(slope).mul(float(1).sub(smoothstep(.55,2.8,fwidth(phase))));
 }
 const rotated=vec2(p.y,p.x.negate());
 let slope=waveSample(p.div(241).add(vec2(clock.mul(.0004),clock.mul(.0002)))).mul(.14)
  .add(waveSample(rotated.div(79.3).add(vec2(clock.mul(-.0006),clock.mul(.0004)))).mul(.095));
 for(const [dx,dz,w,a,s] of [[.89442719,.44721360,25,.008,.72],[-.39391930,.91914503,10.5,.006,1.04],[.97014250,-.24253563,4.7,.005,1.47],[-.78801075,-.61566148,15.3,.005,.89],[.24253563,.97014250,6.8,.004,1.27]])slope=slope.add(swell(dx,dz,w,a,s));
 const rippleVisibility=float(1).sub(smoothstep(90,1100,eyeDistance));
 slope=slope.add(waveSample(p.div(19).add(vec2(clock.mul(.006),clock.mul(.003)))).mul(.105)
 .add(waveSample(rotated.div(8.1).add(vec2(clock.mul(-.004),clock.mul(.005)))).mul(.065)).mul(rippleVisibility));
 const fine=float(1).sub(smoothstep(.07,.62,max(length(dFdx(p)),length(dFdy(p)))));
 const capillary=waveSample(vec2(p.x.add(p.y.mul(.36)),p.y.sub(p.x.mul(.36))).div(2.9).add(vec2(clock.mul(.009),clock.mul(-.013))));
 slope=slope.add(capillary.mul(fine).mul(.092)).mul(mix(float(.60),float(1),smoothstep(0,20,shoreDistance)));
 const normal=normalize(vec3(slope.x.negate(),1,slope.y.negate()));
 const facing=clamp(dot(normal,viewDirection),0,1);
 const fresnel=float(.020).add(pow(float(1).sub(facing),5).mul(.980));
 const coastalMix=float(1).sub(exp(shoreDistance.div(mix(float(16),float(55),character)).negate()));
 const broad=sin(p.x.mul(.013).add(p.y.mul(.007))).mul(sin(p.y.mul(.011).sub(p.x.mul(.005)))).mul(.025);
 const scatter=mix(shallowColor,waterColor,coastalMix).mul(float(.91).add(max(dot(normal,sunDirection),0).mul(.16)).add(broad));
 const distortion=normal.xz.mul(float(.0016).add(min(.007,float(1).div(eyeDistance)).mul(.20)))
  .add(normal.xz.mul(.008).mul(float(.45).add(float(1).sub(facing).mul(.55))));
 reflection.uvNode=clamp(screenUV.flipX().add(distortion),vec2(.001),vec2(.999));
 let light=mix(scatter,reflection.rgb,fresnel);
 const halfDirection=normalize(sunDirection.add(viewDirection)),spec=max(dot(normal,halfDirection),0);
 const gust=texture(waves,p.div(511).add(vec2(clock.mul(.0001),0))).r;
 const highlight=pow(spec,140).mul(.28).add(pow(spec,38).mul(.035))
 .add(pow(spec,600).mul(mix(float(.24),float(1.45),gust)).mul(mix(float(.35),float(1),fine)));
 light=light.add(scatter.mul(gust.sub(.5)).mul(.24)).add(sunColor.mul(highlight).mul(strength));
 const pulse=sin(shoreDistance.mul(1.25).sub(clock.mul(1.15)).add(p.x.mul(.018)).add(p.y.mul(.013))).mul(.5).add(.5);
 const breakup=sin(p.x.mul(.19).sub(p.y.mul(.16)).add(sin(p.y.mul(.081)).mul(2))).mul(.48).add(.52);
 const contact=exp(shoreDistance.div(2.8).negate()).mul(float(1).sub(smoothstep(9,15,shoreDistance)));
 let foam=contact.mul(float(.20).add(pulse.mul(.22))).mul(breakup).mul(mix(float(.30),float(.75),character));
 const wash=shoreDistance.add(sin(dot(p,vec2(.035,.091))).mul(.7)).add(sin(clock.mul(.72).add(p.y.mul(.015))).mul(.55));
 const wavelet=exp(pow(wash.sub(4.5).sub(pulse.mul(2)).div(1.25),2).negate());
 foam=foam.add(wavelet.mul(breakup).mul(.23).mul(character).mul(float(.3).add(fine.mul(.7))));
 material.colorNode=mix(light,foamColor,clamp(foam,0,1));
 return {water,stats:{shoreSamples:[shore.width,shore.height],resolutionScale:compact?.26:.42,reflection:'TSL ReflectorNode',wavelengths:[25,10.5,4.7,15.3,6.8],parity:'piloto; faltan máscaras de inspección y sombra directa'},
 setLight(night){waterColor.value.set(night?'#081a25':'#195f73');shallowColor.value.set(night?'#142d36':'#589e9c');foamColor.value.set(night?'#516675':'#d5e7de');strength.value=night?0:1;},
 dispose(){reflection.dispose();material.dispose();geometry.dispose();shore.texture.dispose();waves.dispose();water.removeFromParent();}};
}
