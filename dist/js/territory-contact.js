import * as T from 'three';
import {contactPlan,estimateTargetBytes} from './territory-render-policy.js';

// Contact shading from the visible depth buffer, in view-space metres.
// No second draw of the town or heritage models is required.
export function contactRenderer(renderer) {
  const supported=renderer.extensions.has('EXT_color_buffer_float');
  let target,lastUsed=-Infinity,failed=false;
  const stats={active:false,samples:0,estimatedTargetBytes:0,failed:false};
  const size=new T.Vector2();
  const uniforms={image:{value:null},depthMap:{value:null},clip:{value:new T.Vector2()},
    projectionScale:{value:new T.Vector2()},strength:{value:.78}};
  const material=new T.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      uniform sampler2D image,depthMap;
      uniform vec2 clip,projectionScale;
      uniform float strength;
      varying vec2 vUv;
      vec3 positionAt(vec2 uv){
        float depth=texture2D(depthMap,uv).r;
        float z=clip.x*clip.y/((clip.y-clip.x)*depth-clip.y);
        return vec3((uv*2.-1.)*(-z)/projectionScale,z);
      }
      void main(){
        vec3 rgb=texture2D(image,vUv).rgb;
        vec3 p=positionAt(vUv);
        vec3 normalRaw=cross(dFdx(p),dFdy(p));
        float normalLength=length(normalRaw);
        vec3 normal=normalRaw/max(normalLength,1.e-8);
        float validDepth=texture2D(depthMap,vUv).r;
        if(validDepth<.999999&&normalLength>1.e-8&&-p.z<165.&&-p.z>clip.x){
          vec2 dir=vec2(.737,.676);
          float shade=0.;
          for(int i=0;i<12;i++){
            float r=(float(i)+.8)/12.;
            // Spiral of samples spanning a reveal, a sill and a wall base.
            vec2 offset=dir*(.12+2.8*r*r)*projectionScale/max(.3,-2.*p.z);
            dir=mat2(-.737,.676,-.676,-.737)*dir;
            vec2 uv=vUv+offset;
            if(all(greaterThan(uv,vec2(0.)))&&all(lessThan(uv,vec2(1.)))){
              float depth=texture2D(depthMap,uv).r;
              vec3 delta=positionAt(uv)-p;
              float d=length(delta);
              // Suppress background/foreground halos across depth jumps.
              float depthAgreement=1.-smoothstep(.65,2.8,abs(delta.z));
              if(depth<.999999&&d>.015)shade+=max(0.,dot(normal,delta)/max(.01,d)-.12)*(1.-smoothstep(.14,2.85,d))*depthAgreement;
            }
          }
          rgb*=1.-min(.27,shade*.073)*strength*(1.-smoothstep(90.,165.,-p.z));
        }
        gl_FragColor=vec4(rgb,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const triangle=new T.BufferGeometry();
  triangle.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  const pass=new T.Mesh(triangle,material);pass.frustumCulled=false;
  const screen=new T.Scene(),screenCamera=new T.Camera();screen.add(pass);
  function render(scene,camera,enabled,tier=2){
    stats.active=false;
    if(!enabled||!supported||failed){
      // A short burst of movement should not repeatedly allocate a full-size
      // multisampled depth target. Release it after sustained inactivity.
      if(target&&performance.now()-lastUsed>3500){target.dispose();target=null;stats.estimatedTargetBytes=0;}
      renderer.render(scene,camera);return;
    }
    lastUsed=performance.now();renderer.getDrawingBufferSize(size);
    const plan=contactPlan({enabled:true,pixels:size.x*size.y,maxSamples:renderer.capabilities.maxSamples,tier});
    if(target&&target.samples!==plan.samples){target.dispose();target=null;}
    if(!target){
      target=new T.WebGLRenderTarget(size.x,size.y,{type:T.HalfFloatType,samples:plan.samples,depthBuffer:true});
      target.depthTexture=new T.DepthTexture(size.x,size.y,T.UnsignedIntType);
    }else if(target.width!==size.x||target.height!==size.y){target.setSize(size.x,size.y);}
    uniforms.strength.value=plan.strength;stats.samples=plan.samples;stats.estimatedTargetBytes=estimateTargetBytes(size.x,size.y,plan.samples);
    uniforms.image.value=target.texture;uniforms.depthMap.value=target.depthTexture;
    uniforms.clip.value.set(camera.near,camera.far);
    uniforms.projectionScale.value.set(camera.projectionMatrix.elements[0],camera.projectionMatrix.elements[5]);
    const previous=renderer.getRenderTarget();
    try{
      renderer.setRenderTarget(target);renderer.render(scene,camera);
      renderer.setRenderTarget(previous);renderer.render(screen,screenCamera);stats.active=true;
    }catch(error){
      failed=true;stats.failed=true;console.warn('Oclusión de contacto desactivada',error);
      renderer.setRenderTarget(previous);target?.dispose();target=null;stats.estimatedTargetBytes=0;
      renderer.render(scene,camera);
    }finally{renderer.setRenderTarget(previous);}
  }
  render.stats=stats;
  render.dispose=()=>{target?.dispose();target=null;triangle.dispose();material.dispose();};
  return render;
}
