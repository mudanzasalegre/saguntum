import * as T from 'three';

// IGN MDSnE 2.5 m and the simulation DTM; shared by roofs, ground and streets.
// A single lookup returns two sky-view measurements at the same UTM location.
const enabled={value:1},ready={value:0},heightField={value:null};
const sun={value:new T.Vector3()},shadow={value:new T.Vector3()};
let started=false;
export function urbanBuildingsVisible(value){enabled.value=value?1:0;}
export function urbanLightBindings(){load();return {enabled,ready,heightField,sun,shadow};}
export function urbanSun(direction,target,span){
  sun.value.copy(direction);shadow.value.set(target.x,target.z,span);
}
function load(){
  if(started)return;
  started=true;
  const compact=matchMedia('(pointer:coarse), (max-width:760px)').matches||(navigator.deviceMemory||8)<=4;
  const name='urban-sky'+(compact?'-compact':'')+'.webp';
  new T.TextureLoader().load(new URL('../assets/territory/landscape/'+name,import.meta.url).href,tex=>{
    // A height is a measurement. Prevent coarse averaged mip levels from
    // turning a narrow roof into a whole block at the panorama scale.
    tex.generateMipmaps=false;tex.minFilter=T.LinearFilter;
    heightField.value=tex;ready.value=1;
  },undefined,error=>console.warn('Cielo urbano IGN',error));
}

export function urbanLighting(shader,isRoof=false){
  load();
  Object.assign(shader.uniforms,{uUrbanField:heightField,uUrbanReady:ready,uUrbanEnabled:enabled,
    uUrbanSun:sun,uUrbanShadow:shadow});
  const varying='varying vec3 vUrbanPoint;\n';
  shader.vertexShader=varying+shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nvUrbanPoint=position;');
  shader.fragmentShader=varying+`
    uniform sampler2D uUrbanField;
    uniform float uUrbanReady,uUrbanEnabled;
    uniform vec3 uUrbanSun,uUrbanShadow;
    const vec2 urbanScale=vec2(1./9747.4981,-1./6500.);
    vec2 urbanUv(vec2 p){return (p-vec2(1750.,4750.))*urbanScale;}
  `+shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
    vec2 urbanXY=vUrbanPoint.xz,uvUrban=urbanUv(urbanXY);
    if(uUrbanReady*uUrbanEnabled>.5 && all(greaterThan(uvUrban,vec2(0.)))&&all(lessThan(uvUrban,vec2(1.)))
      ${isRoof?'&&vUrbanTop>.54':''}){
      vec3 cell=texture2D(uUrbanField,uvUrban).rgb;
      float obstruction=cell.${isRoof?'b':'g'};
      // Only indirect diffuse light is lost when the sky is hidden.
      reflectedLight.indirectDiffuse*=1.-.77*obstruction;
      // In a panorama or outside the camera shadow frustum the original
      // roofs still cast sun-facing shadows from the measured height field.
      float edge=length(urbanXY-uUrbanShadow.xy);
      float outside=uUrbanShadow.z<=0.?1.:smoothstep(uUrbanShadow.z*.79,uUrbanShadow.z*1.22,edge);
      if(outside>.001&&uUrbanSun.y>.07&&obstruction>.018){
        vec2 ray=normalize(uUrbanSun.xz+vec2(.00001));
        float slope=uUrbanSun.y/max(length(uUrbanSun.xz),.02),blocked=0.;
        for(int i=0;i<5;i++){
          float dist=6.+3.*float(i)+1.7*float(i*i);
          float top=textureLod(uUrbanField,uvUrban+ray*dist*urbanScale,0.).r*255.-8.;
          blocked=max(blocked,smoothstep(.9,4.4,top-vUrbanPoint.y-dist*slope));
        }
        reflectedLight.directDiffuse*=1.-blocked*outside*.64;
      }
    }`);
  if(isRoof){
    shader.vertexShader='varying float vUrbanTop;\n'+shader.vertexShader.replace('vUrbanPoint=position;','vUrbanPoint=position;vUrbanTop=normal.y;');
    shader.fragmentShader='varying float vUrbanTop;\n'+shader.fragmentShader;
  }
}
