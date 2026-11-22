import * as T from 'three';

const families=[
  new Set(['stone','ashlar','limestone','masonry','sandstone','rubble']),
  new Set(['plaster','stucco','lime','concrete','render','mortar']),
  new Set(['rust','rusted','corroded','liningbox']),
  new Set(['brick','brickfloor','terracotta','refractory'])
];
const uniforms={heritageGrain:{value:null},grainReady:{value:0}};
let loading=false;

export function dressHeritageSurfaces(group){
  const seen=new Set();
  group.traverse(object=>{
    if(!object.isMesh)return;
    for(const m of Array.isArray(object.material)?object.material:[object.material]){
      if(!m.isMeshStandardMaterial||m.transparent||seen.has(m))continue;
      const labels=[object.userData.materialKind,m.map?.name,m.name];
      const names=labels.filter(label=>typeof label==='string'&&label).map(label=>label.trim().toLowerCase().split(/[ ·|]+/).at(-1));
      const index=families.findIndex(family=>names.some(name=>family.has(name)));
      if(index<0)continue;
      seen.add(m);
      if(!loading){
        loading=true;
        new T.TextureLoader().load('./assets/materials/heritage/grain.webp',tex=>{
          tex.anisotropy=4;uniforms.heritageGrain.value=tex;uniforms.grainReady.value=1;
        },undefined,()=>{loading=false;});
      }
      const previous=m.onBeforeCompile.bind(m),previousKey=m.customProgramCacheKey();
      m.customProgramCacheKey=()=>previousKey+'-heritage-grain';
      m.onBeforeCompile=(shader,renderer)=>{
        previous(shader,renderer);
        Object.assign(shader.uniforms,uniforms,{grainTile:{value:new T.Vector2(index%2,1-Math.floor(index/2))}});
        shader.vertexShader='varying vec3 vFabricWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
          vec4 detailVertex=vec4(transformed,1.);
          #ifdef USE_INSTANCING
            detailVertex=instanceMatrix*detailVertex;
          #endif
          vFabricWorld=(modelMatrix*detailVertex).xyz;`);
        shader.fragmentShader='varying vec3 vFabricWorld;uniform sampler2D heritageGrain;uniform vec2 grainTile;uniform float grainReady;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          vec3 dx=dFdx(vFabricWorld),dy=dFdy(vFabricWorld),axes=abs(cross(dx,dy));
          vec2 metric=axes.y>=max(axes.x,axes.z)?vFabricWorld.xz:axes.x>axes.z?vFabricWorld.zy:vFabricWorld.xy;
          vec2 uvGrain=metric/.84;
          vec3 grain=vec3(0.);
          float nearGrain=grainReady*(1.-smoothstep(9.,36.,vViewPosition.z));
          if(nearGrain>.001){
            vec2 tileUV=(grainTile+(fract(uvGrain)*504.+4.)/512.)*.5;
            grain=(textureGrad(heritageGrain,tileUV,dFdx(uvGrain)*.4921875,dFdy(uvGrain)*.4921875).rgb-.5)*nearGrain;
            roughnessFactor=clamp(roughnessFactor+grain.b*.28,.055,1.);
          }`);
        shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
          if(nearGrain>.001){
            vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition);
            vec3 r1=cross(sy,normal),r2=cross(normal,sx);
            float det=dot(sx,r1);
            vec2 grad=vec2(dot(grain.rg,dFdx(metric)),dot(grain.rg,dFdy(metric)));
            normal=normalize(normal-sign(det)*(grad.x*r1+grad.y*r2)*.45/max(abs(det),.0000001));
          }`);
      };
      m.needsUpdate=true;
    }
  });
}
