import * as T from 'three';

export function createAtmosphere(scene,renderer,sea,buildings,network) {
  const ambient=new T.HemisphereLight('#dedfd4','#96927d',1.65);
  const sun=new T.DirectionalLight('#ffebc7',2.45);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{near:1,far:1550,left:-230,right:230,top:230,bottom:-230});
  sun.shadow.bias=-.00025;sun.shadow.normalBias=.22;scene.add(ambient,sun,sun.target);
  const horizon=new T.Color(),zenith=new T.Color(),night=new T.Color('#172731'),day=new T.Color('#b5c7c2');
  scene.fog=new T.FogExp2('#b5c7c2',.000035);
  const direction=new T.Vector3(),color=new T.Color();
  const sky=new T.Mesh(new T.SphereGeometry(44000,28,12),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,fog:false,
    uniforms:{skyTop:{value:zenith},horizon:{value:horizon},sunDir:{value:direction},solar:{value:1}},
    vertexShader:'varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform vec3 skyTop,horizon,sunDir;uniform float solar;varying vec3 vSky;
    void main(){vec3 d=normalize(vSky);float h=pow(max(d.y,0.0),.55);vec3 base=mix(horizon,skyTop,h);
      float glow=pow(max(dot(d,sunDir),0.),52.)*.15+smoothstep(.99978,.99994,dot(d,sunDir))*.8;
      gl_FragColor=vec4(base+vec3(1.,.76,.45)*glow*solar,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  }));sky.renderOrder=-100;sky.frustumCulled=false;scene.add(sky);
  let light=1,lastX=Infinity,lastZ=Infinity;
  function setHour(hour){
    const angle=(hour-12)*Math.PI/12,phi=39.679*Math.PI/180;
    direction.set(-Math.sin(angle),Math.cos(phi)*Math.cos(angle),Math.sin(phi)*Math.cos(angle)).normalize();
    light=T.MathUtils.smoothstep(direction.y,-.14,.24);
    const evening=(1-T.MathUtils.smoothstep(direction.y,0,.5))*light;
    horizon.copy(night).lerp(day,light).lerp(color.set('#e5b191'),evening*.76);
    zenith.set('#091425').lerp(color.set('#759baa'),light);
    scene.background=horizon;scene.fog.color.copy(horizon);scene.fog.density=.000024+(1-light)*.000022;
    sun.color.set('#fff1d4').lerp(color.set('#ffbc80'),evening);
    sun.intensity=Math.max(0,direction.y)*2.6+.08*light;
    ambient.intensity=.21+1.24*light;ambient.color.set('#bdcfe4').lerp(color.set('#e7e9d9'),light);
    sky.material.uniforms.solar.value=light;sea.setSun(direction,light);
    buildings.night.value=1-light;network.setNight(1-light);lastX=Infinity;
  }
  function update(camera,p,range,quality){
    sky.position.copy(camera.position);
    const enabled=range<610&&quality>0&&light>.17;
    if(renderer.shadowMap.enabled!==enabled){renderer.shadowMap.enabled=enabled;renderer.shadowMap.needsUpdate=true;}
    if(Math.hypot(p.x-lastX,p.z-lastZ)>24){
      lastX=p.x;lastZ=p.z;sun.target.position.copy(p);sun.position.copy(p).addScaledVector(direction,680);renderer.shadowMap.needsUpdate=true;
    }
  }
  return {setHour,update};
}
