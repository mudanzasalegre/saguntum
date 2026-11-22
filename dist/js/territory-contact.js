import * as T from 'three';

// Contact shading from the visible depth buffer, in view-space metres.
// No second draw of the town or heritage models is required.
export function contactRenderer(renderer) {
  const supported=renderer.extensions.has('EXT_color_buffer_float');
  let target;
  const size=new T.Vector2();
  const uniforms={image:{value:null},depthMap:{value:null},clip:{value:new T.Vector2()},
    projectionScale:{value:new T.Vector2()}};
  const material=new T.ShaderMaterial({
    uniforms,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      uniform sampler2D image,depthMap;
      uniform vec2 clip,projectionScale;
      varying vec2 vUv;
      vec3 positionAt(vec2 uv){
        float depth=texture2D(depthMap,uv).r;
        float z=clip.x*clip.y/((clip.y-clip.x)*depth-clip.y);
        return vec3((uv*2.-1.)*(-z)/projectionScale,z);
      }
      void main(){
        vec3 rgb=texture2D(image,vUv).rgb;
        vec3 p=positionAt(vUv);
        vec3 normal=normalize(cross(dFdx(p),dFdy(p)));
        if(-p.z<165.){
          vec2 dir=vec2(.737,.676);
          float shade=0.;
          for(int i=0;i<12;i++){
            float r=(float(i)+.8)/12.;
            // Spiral of samples spanning a reveal, a sill and a wall base.
            vec2 offset=dir*(.12+2.8*r*r)*projectionScale/max(.3,-2.*p.z);
            dir=mat2(-.737,.676,-.676,-.737)*dir;
            vec2 uv=vUv+offset;
            if(all(greaterThan(uv,vec2(0.)))&&all(lessThan(uv,vec2(1.)))){
              vec3 delta=positionAt(uv)-p;
              float d=length(delta);
              shade+=max(0.,dot(normal,delta)/max(.01,d)-.12)*(1.-smoothstep(.14,2.85,d));
            }
          }
          rgb*=1.-min(.30,shade*.073)*(1.-smoothstep(90.,165.,-p.z));
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
  return function render(scene,camera,enabled){
    if(!enabled||!supported){
      if(target){target.dispose();target=null;}
      renderer.render(scene,camera);return;
    }
    renderer.getDrawingBufferSize(size);
    if(!target){
      target=new T.WebGLRenderTarget(size.x,size.y,{type:T.HalfFloatType,
        samples:Math.min(4,renderer.capabilities.maxSamples),depthBuffer:true});
      target.depthTexture=new T.DepthTexture(size.x,size.y,T.UnsignedIntType);
    }else if(target.width!==size.x||target.height!==size.y){target.setSize(size.x,size.y);}
    uniforms.image.value=target.texture;uniforms.depthMap.value=target.depthTexture;
    uniforms.clip.value.set(camera.near,camera.far);
    uniforms.projectionScale.value.set(camera.projectionMatrix.elements[0],camera.projectionMatrix.elements[5]);
    renderer.setRenderTarget(target);renderer.render(scene,camera);
    renderer.setRenderTarget(null);renderer.render(screen,screenCamera);
  };
}
