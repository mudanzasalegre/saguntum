import {Vector4,Vector2} from 'three';

// The historical circus extends beneath modern streets and buildings. Keep
// neighbouring streets visible right up to the documented section boundary.
export function sectionWindow(){
 const rect={value:new Vector4()},across={value:new Vector2()},enabled={value:0};
 function set(cut){
  enabled.value=cut?1:0;
  if(cut){rect.value.fromArray(cut);across.value.fromArray(cut,4);}
 }
 function contains(x,z){
  if(!enabled.value)return false;
  const {value:r}=rect,{value:v}=across;
  const dx=x-r.x,dz=z-r.y;
  return Math.abs(dx*r.z+dz*r.w)<=1&&Math.abs(dx*v.x+dz*v.y)<=1;
 }
 function material(m,participates={value:1}){
  if(!m||m.isShaderMaterial)return;
  const previous=m.onBeforeCompile.bind(m),key=m.customProgramCacheKey();
  m.customProgramCacheKey=()=>key+'-territorial-excavation';
  m.onBeforeCompile=(shader,renderer)=>{
   previous(shader,renderer);
   Object.assign(shader.uniforms,{visitWindow:rect,visitAcross:across,visitExcavating:enabled,visitOccluder:participates});
   shader.vertexShader='varying vec2 vVisitMetric;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    vec4 visitPosition=vec4(transformed,1.);
    #ifdef USE_INSTANCING
     visitPosition=instanceMatrix*visitPosition;
    #endif
    vVisitMetric=(modelMatrix*visitPosition).xz;`);
   shader.fragmentShader='varying vec2 vVisitMetric; uniform vec4 visitWindow; uniform vec2 visitAcross; uniform float visitExcavating,visitOccluder;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    if(visitExcavating*visitOccluder>.5){vec2 q=vVisitMetric-visitWindow.xy;
     if(abs(dot(q,visitWindow.zw))<=1.&&abs(dot(q,visitAcross))<=1.)discard;}`);
  };
  m.needsUpdate=true;
 }
 function model(item){
  const enabled={value:1},seen=new Set();
  function hook(root,state){
   root?.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(!seen.has(m)){seen.add(m);material(m,state);}
   }});
  }
  // Context shares the section with the city and its own archaeological
  // exhibit remains visible inside the window.
  hook(item.contextGroup,{value:1});hook(item.group,enabled);
  return enabled;
 }
 return {set,contains,material,model};
}
