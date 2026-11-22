import * as THREE from 'three';

// A distance field of the mapped shoreline, not the circular edge of the atlas.
// Distances control surface colour and contact foam only. They are not soundings.
export function createShoreField({data,project,mask,mobile=false}){
 const lines=data.projectedShorelines??[data.coastline.map(c=>({...project(...c),lon:c[0],lat:c[1]}))];
 const minX=Math.min(...mask.polygons.map(p=>p.minX)),maxX=Math.max(...mask.polygons.map(p=>p.maxX));
 const minZ=Math.min(...mask.polygons.map(p=>p.minZ)),maxZ=Math.max(...mask.polygons.map(p=>p.maxZ));
 const pixelWidth=mobile?768:1024,aspect=(maxZ-minZ)/(maxX-minX);
 const width=data.projectedShorelines?Math.min(pixelWidth,Math.max(1,Math.floor(2048/aspect))):pixelWidth,height=Math.ceil(width*aspect);
 const cell=160,range=224,buckets=new Map(),segments=[];
 const key=(x,z)=>`${x},${z}`;
 for(const points of lines)for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz;
  if(len2<.0001)continue;
  // Broad shoreline character comes from the existing mapped beach/coast sectors;
  // no wave forecast, historic coastline or measured water depth is implied.
  const lat=(a.lat+b.lat)/2,lon=(a.lon+b.lon)/2;
  const natural=(lat>=39.6522&&lon<-.204)||(lat>=39.628&&lat<=39.639&&lon<-.2303)?1:.18;
  const s={ax:a.x,az:a.z,dx,dz,len2,natural};segments.push(s);
  for(let z=Math.floor((Math.min(a.z,b.z)-range)/cell);z<=Math.floor((Math.max(a.z,b.z)+range)/cell);z++){
   for(let x=Math.floor((Math.min(a.x,b.x)-range)/cell);x<=Math.floor((Math.max(a.x,b.x)+range)/cell);x++){
    if((x+1)*cell<minX||x*cell>maxX||(z+1)*cell<minZ||z*cell>maxZ)continue;
    const k=key(x,z);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(s);
   }
  }
 }
 const sample=(x,z)=>{
  let distance2=range*range,natural=0;
  for(const s of buckets.get(key(Math.floor(x/cell),Math.floor(z/cell)))||[]){
   const t=Math.max(0,Math.min(1,((x-s.ax)*s.dx+(z-s.az)*s.dz)/s.len2));
   const d=(x-s.ax-s.dx*t)**2+(z-s.az-s.dz*t)**2;
   if(d<distance2){distance2=d;natural=s.natural;}
  }
  let distance=Math.sqrt(distance2);
  // Signed samples within one shoreline texel neighbourhood keep the zero
  // contour sharp under bilinear filtering. Geometry remains the exact mask.
  if(distance<24&&!mask.isWater(x,z))distance=-distance;
  return{distance,natural};
 };
 const values=new Uint8Array(width*height*4);
 for(let z=0;z<height;z++)for(let x=0;x<width;x++){
  const s=sample(minX+(x+.5)/width*(maxX-minX),minZ+(z+.5)/height*(maxZ-minZ));
  const encoded=Math.round(THREE.MathUtils.clamp((s.distance+32)/256,0,1)*65535),i=(z*width+x)*4;
  values[i]=encoded>>8;values[i+1]=encoded&255;values[i+2]=Math.round(s.natural*255);values[i+3]=255;
 }
 const texture=new THREE.DataTexture(values,width,height,THREE.RGBAFormat);
 texture.name='Distancia a la costa cartográfica · no batimetría';
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return{texture,bounds:new THREE.Vector4(minX,minZ,maxX-minX,maxZ-minZ),width,height,sample,segments:segments.length,range};
}

export function createWaveNormals(){
 const size=128,values=new Uint8Array(size*size*4);
 // Periodic, directionally mixed slopes. Coarse swell is evaluated analytically
 // in metres in the shader; this texture supplies only the small surface ripples.
 let seed=311976;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const spectrum=Array.from({length:32},()=>{
  const kx=Math.round((random()-.5)*40),ky=Math.round((random()-.5)*40),length=Math.max(1,Math.hypot(kx,ky));
  return{kx,ky,phase:random()*Math.PI*2,sx:kx/length,sy:ky/length,amplitude:.15*(1-length/40)};
 });
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size*Math.PI*2,v=y/size*Math.PI*2;
  let sx=0,sy=0;
  for(const wave of spectrum){const slope=Math.cos(wave.kx*u+wave.ky*v+wave.phase)*wave.amplitude;sx+=wave.sx*slope;sy+=wave.sy*slope;}
  const inv=1/Math.sqrt(1+sx*sx+sy*sy),i=(y*size+x)*4;
  values[i]=Math.round((sx*inv*.5+.5)*255);values[i+1]=Math.round((sy*inv*.5+.5)*255);
  values[i+2]=Math.round((inv*.5+.5)*255);values[i+3]=255;
 }
 const texture=new THREE.DataTexture(values,size,size,THREE.RGBAFormat);
 texture.name='Ondulación fina del Mediterráneo';texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

// Uses the native Three Water reflection camera and shadow vertex shader. Only
// surface optics are replaced: low normal-incidence Fresnel, filtered waves,
// coastal colour and a quiet, narrow contact band at real shores.
export const coastalWaterFragment=/* glsl */`
uniform sampler2D mirrorSampler;
uniform sampler2D normalSampler;
uniform sampler2D shoreSampler;
uniform vec4 shoreBounds;
uniform float time;
uniform float alpha;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform vec3 eye;
uniform vec3 waterColor;
uniform vec3 shallowColor;
uniform vec3 foamColor;
uniform float sunStrength;
varying vec4 mirrorCoord;
varying vec4 worldPosition;

#include <common>
#include <packing>
#include <bsdfs>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

vec2 swell(vec2 p,vec2 direction,float wavelength,float slope,float speed){
 float phase=dot(direction,p)*(6.28318530718/wavelength)-time*speed;
 phase+=.45*sin(dot(vec2(-direction.y,direction.x),p)*.017+time*.13)+.22*sin(p.x*.008-p.y*.014);
 float screenFilter=1.0-smoothstep(.55,2.8,fwidth(phase));
 return direction*cos(phase)*slope*screenFilter;
}

void main(){
 #include <logdepthbuf_fragment>
 vec2 p=worldPosition.xz;
 vec3 viewVector=eye-worldPosition.xyz;
 float eyeDistance=max(length(viewVector),.1);
 vec3 viewDirection=viewVector/eyeDistance;
 vec2 uv=(p-shoreBounds.xy)/shoreBounds.zw;
 vec4 shore=texture2D(shoreSampler,clamp(uv,vec2(0.0),vec2(1.0)));
 float shoreDistance=max(0.0,dot(shore.rg,vec2(256.0,1.0))*(256.0/257.0)-32.0);
 float shoreCharacter=shore.b;

 vec2 coarseA=texture2D(normalSampler,p/241.0+vec2(time*.0004,time*.0002)).rg*2.0-1.0;
 vec2 coarseB=texture2D(normalSampler,vec2(p.y,-p.x)/79.3+vec2(-time*.0006,time*.0004)).rg*2.0-1.0;
 vec2 slope=coarseA*.14+coarseB*.095;
 slope+=swell(p,vec2(.89442719,.44721360),25.0,.008,.72);
 slope+=swell(p,vec2(-.39391930,.91914503),10.5,.006,1.04);
 slope+=swell(p,vec2(.97014250,-.24253563),4.7,.005,1.47);
 slope+=swell(p,vec2(-.78801075,-.61566148),15.3,.005,.89);
 slope+=swell(p,vec2(.24253563,.97014250),6.8,.004,1.27);
 float rippleVisibility=1.0-smoothstep(90.0,1100.0,eyeDistance);
 vec2 rippleA=texture2D(normalSampler,p/19.0+vec2(time*.006,time*.003)).rg*2.0-1.0;
 vec2 rippleB=texture2D(normalSampler,vec2(p.y,-p.x)/8.1+vec2(-time*.004,time*.005)).rg*2.0-1.0;
 slope+=(rippleA*.105+rippleB*.065)*rippleVisibility;
 slope*=mix(.60,1.0,smoothstep(0.0,20.0,shoreDistance));
 vec3 surfaceNormal=normalize(vec3(-slope.x,1.0,-slope.y));
 float facing=clamp(dot(surfaceNormal,viewDirection),0.0,1.0);
 float fresnel=.020+.980*pow(1.0-facing,5.0);

 // Surface distance is a visual transition, never a hydrographic depth claim.
 float coastalMix=1.0-exp(-shoreDistance/mix(16.0,55.0,shoreCharacter));
 vec3 scatter=mix(shallowColor,waterColor,coastalMix);
 float broadVariation=sin(p.x*.013+p.y*.007)*sin(p.y*.011-p.x*.005)*.025;
 float shadow=mix(.58,1.0,getShadowMask());
 scatter*=(.91+.16*max(dot(surfaceNormal,sunDirection),0.0)+broadVariation)*shadow;

 vec2 distortion=surfaceNormal.xz*(.0016+min(.007,1.0/eyeDistance)*.20);
 vec2 reflectionUV=mirrorCoord.xy/max(mirrorCoord.w,.0001)+distortion;
 vec3 reflection=texture2D(mirrorSampler,clamp(reflectionUV,vec2(.001),vec2(.999))).rgb;
 vec3 light=mix(scatter,reflection,fresnel);
 vec3 halfDirection=normalize(sunDirection+viewDirection);
 float specAngle=max(dot(surfaceNormal,halfDirection),0.0);
 float highlight=pow(specAngle,140.0)*.28+pow(specAngle,38.0)*.035;
 light+=sunColor*highlight*sunStrength*shadow;

 // Broken, soft contact foam follows only the mapped coast; never the atlas rim.
 float shorePulse=.5+.5*sin(shoreDistance*1.25-time*1.15+p.x*.018+p.y*.013);
 float breakup=.52+.48*sin(p.x*.19-p.y*.16+sin(p.y*.081)*2.0);
 float contact=exp(-shoreDistance/2.8)*(1.0-smoothstep(9.0,15.0,shoreDistance));
 float foam=contact*(.20+.22*shorePulse)*breakup*mix(.30,.75,shoreCharacter);
 light=mix(light,foamColor,foam);
 gl_FragColor=vec4(light,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
}`;

export function installCoastalWaterShader(water,shore){
 const material=water.material;
 Object.assign(material.uniforms,{
  shoreSampler:{value:shore.texture},shoreBounds:{value:shore.bounds},
  shallowColor:{value:new THREE.Color('#589e9c')},foamColor:{value:new THREE.Color('#d5e7de')},
  sunStrength:{value:1}
 });
 material.name='Mediterráneo · ondas, costa y reflejo';material.fragmentShader=coastalWaterFragment;
 material.needsUpdate=true;
 water.receiveShadow=true;
 return material;
}
