import {Vector4,Vector2,MeshDepthMaterial,RGBADepthPacking} from 'three';
import {describeGroundEffect} from './territory-ground-effects.js';
import {insideTriangleCut} from './polygon-excavation.js';

// The historical circus extends beneath modern streets and buildings. Keep
// neighbouring streets visible right up to the documented section boundary.
export function sectionWindow(){
 const rect={value:new Vector4()},across={value:new Vector2()},enabled={value:0};
 const maxTriangles=64,triangles=Array.from({length:maxTriangles},()=>new Vector4()),triangleCross=Array.from({length:maxTriangles},()=>new Vector2()),nTriangles={value:0};
 let current=null,packed=[],ring=null,planes=[],barriers=new WeakMap();
 function set(cut){
  if(cut===current)return;current=cut;barriers=new WeakMap();
  enabled.value=cut?1:0;
  packed=cut?.triangles||[];nTriangles.value=packed.length;ring=null;planes=[];
  if(packed.length>maxTriangles)throw new Error('El contorno histórico supera el límite de triángulos');
  if(cut){
   const row=cut.rect||cut;rect.value.fromArray(row);across.value.fromArray(row,4);
   packed.forEach((q,i)=>{triangles[i].fromArray(q);triangleCross[i].fromArray(q,4);});
   const [cx,cz,a,b,c,d]=row,det=a*d-b*c;
   const points=cut.outline||[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>({x:cx+(u*d-v*b)/det,z:cz+(v*a-u*c)/det}));
   const xs=points.map(p=>p.x),zs=points.map(p=>p.z),mx=xs.reduce((s,x)=>s+x,0)/xs.length,mz=zs.reduce((s,z)=>s+z,0)/zs.length;
   ring={points,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...zs),bottom:Math.max(...zs)};
   planes=points.map((p,i)=>{const q=points[(i+1)%points.length],nx=q.z-p.z,nz=p.x-q.x,k=-nx*p.x-nz*p.z,sign=nx*mx+nz*mz+k>0?-1:1;return[nx*sign,nz*sign,k*sign];});
  }
 }
 function contains(x,z){
  if(!enabled.value)return false;
  if(packed.length)return packed.some(cut=>insideTriangleCut(cut,x,z));
  const {value:r}=rect,{value:v}=across;
  const dx=x-r.x,dz=z-r.y;
  return Math.abs(dx*r.z+dz*r.w)<=1&&Math.abs(dx*v.x+dz*v.y)<=1;
 }
 function material(m,participates={value:1}){
  if(!m||m.isShaderMaterial)return;
  describeGroundEffect(m,{section:{rect,across,enabled,participates,triangles,triangleCross,nTriangles}});
  const previous=m.onBeforeCompile.bind(m),key=m.customProgramCacheKey();
  m.customProgramCacheKey=()=>key+'-territorial-excavation';
  m.onBeforeCompile=(shader,renderer)=>{
   previous(shader,renderer);
   Object.assign(shader.uniforms,{visitWindow:rect,visitAcross:across,visitExcavating:enabled,visitOccluder:participates,visitTriangles:{value:triangles},visitTriangleCross:{value:triangleCross},visitTriangleCount:nTriangles});
   shader.vertexShader='varying vec2 vVisitMetric;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    vec4 visitPosition=vec4(transformed,1.);
    #ifdef USE_INSTANCING
     visitPosition=instanceMatrix*visitPosition;
    #endif
    vVisitMetric=(modelMatrix*visitPosition).xz;`);
   shader.fragmentShader=`varying vec2 vVisitMetric; uniform vec4 visitWindow,visitTriangles[${maxTriangles}]; uniform vec2 visitAcross,visitTriangleCross[${maxTriangles}]; uniform float visitExcavating,visitOccluder; uniform int visitTriangleCount;\n`+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    if(visitExcavating*visitOccluder>.5){
     if(visitTriangleCount>0){for(int i=0;i<${maxTriangles};i++){if(i>=visitTriangleCount)break;vec2 q=vVisitMetric-visitTriangles[i].xy;float u=dot(q,visitTriangles[i].zw),v=dot(q,visitTriangleCross[i]);if(u>=0.&&v>=0.&&u+v<=1.)discard;}}
     else{vec2 q=vVisitMetric-visitWindow.xy;if(abs(dot(q,visitWindow.zw))<=1.&&abs(dot(q,visitAcross))<=1.)discard;}}`);
  };
  m.needsUpdate=true;
 }
 function model(item){
  const enabled={value:1},seen=new Set(),objects=new Set(),depths=new Map(),owned=[];
  function hook(root,state){
   root?.traverse(o=>{
    if(!o.isMesh||objects.has(o))return;objects.add(o);
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(!seen.has(m)){seen.add(m);material(m,state);}
    if(o.castShadow){
     if(!depths.has(state))depths.set(state,new Map());const cache=depths.get(state),original=o.customDepthMaterial||null;
     if(!cache.has(original)){const depth=original?original.clone():new MeshDepthMaterial({depthPacking:RGBADepthPacking});material(depth,state);cache.set(original,depth);owned.push(depth);}
     o.customDepthMaterial=cache.get(original);
    }
   });
  }
  // Context shares the section with the city and its own archaeological
  // exhibit remains visible inside the window.
  hook(item.contextGroup,{value:1});hook(item.group,enabled);
  const resources=item.group.userData.ownedResources||={};resources.materials=[...resources.materials||[],...owned];
  return enabled;
 }
 // A hidden wall must not remain an invisible pedestrian obstacle. Subtract
 // the same convex window from its metric collision segments, retaining the
 // exterior portions and the exact source array when the window is closed.
 function clipBarriers(lines){
  if(!enabled.value||!lines?.length)return lines;
  if(barriers.has(lines))return barriers.get(lines);
  const result=[];
  for(let i=0;i<lines.length;i+=6){
   const x=lines[i],z=lines[i+1],y=lines[i+2],dx=lines[i+3]-x,dz=lines[i+4]-z,dy=lines[i+5]-y;
   let enter=0,leave=1,intersects=true;
   for(const [nx,nz,k]of planes){
    const a=nx*x+nz*z+k,b=nx*(x+dx)+nz*(z+dz)+k;
    if(a>0&&b>0){intersects=false;break;}
    if(a<=0&&b<=0)continue;
    const t=a/(a-b);if(a>0)enter=Math.max(enter,t);else leave=Math.min(leave,t);
    if(enter>=leave){intersects=false;break;}
   }
   const add=(a,b)=>{if(b-a>1e-7)result.push(x+dx*a,z+dz*a,y+dy*a,x+dx*b,z+dz*b,y+dy*b);};
   if(!intersects)add(0,1);else{add(0,enter);add(leave,1);}
  }
  const clipped=new Float32Array(result);barriers.set(lines,clipped);return clipped;
 }
 return {set,contains,material,model,clipBarriers,get ring(){return ring;}};
}
