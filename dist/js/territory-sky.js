import * as T from 'three';

// Photograph-derived opacity and luminance of the upper hemisphere. The
// geographic sun, sky colour and radiance are evaluated at the selected hour.
export function territorySky(renderer,scene,direction,horizon,zenith) {
  const uniforms={
    horizon:{value:horizon},zenith:{value:zenith},sunDir:{value:direction},
    daylight:{value:1},warmth:{value:0},cloudMap:{value:null},hasClouds:{value:0},probe:{value:0}
  };
  const material=new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,fog:false,uniforms,
    vertexShader:'varying vec3 skyDir; void main(){skyDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`
      uniform vec3 horizon,zenith,sunDir;
      uniform float daylight,warmth,probe,hasClouds;
      uniform sampler2D cloudMap;
      varying vec3 skyDir;
      const float pi=3.14159265359;
      float hash(vec2 s){return fract(sin(dot(s,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec3 d=normalize(skyDir);
        float h=max(0.,d.y), elevation=asin(h);
        float azimuth=atan(d.z,d.x),sunAz=atan(sunDir.z,sunDir.x);
        float u=fract((azimuth-sunAz)/(2.*pi)+.595);
        vec2 clouds=texture2D(cloudMap,vec2(u,clamp(elevation/(.5*pi),.001,.999))).rg;
        float cover=smoothstep(.06,.88,clouds.r)*hasClouds;
        float bright=clouds.g*clouds.g;
        float facing=clamp(dot(d,sunDir),0.,1.);
        vec3 air=mix(horizon,zenith,pow(h,.48));
        air+=vec3(.32,.20,.10)*pow(facing,10.)*daylight*(.3+warmth)*smoothstep(-.03,.09,d.y);
        vec3 cloud=mix(vec3(.29,.36,.46),vec3(1.64,1.63,1.55),smoothstep(.13,.82,bright));
        cloud=mix(cloud,cloud*vec3(1.30,.74,.53),warmth*(.35+.65*facing));
        cloud=mix(vec3(.017,.023,.038),cloud,daylight);
        float aboveHorizon=smoothstep(-.012,.105,d.y);
        vec3 sky=mix(air,cloud,cover*aboveHorizon);
        float disc=smoothstep(.99991,.999988,facing);
        float halo=.10*pow(facing,32.)+.26*pow(facing,340.)+2.7*disc;
        sky+=vec3(1.,.83,.63)*halo*daylight*(1.-.72*cover)*aboveHorizon;
        if(daylight<.20 && d.y>.06){
          vec2 st=vec2(azimuth/(2.*pi),elevation/pi)*vec2(920.,730.);
          vec2 cell=floor(st);
          float star=step(.992,hash(cell))*exp(-18.*dot(fract(st)-.5,fract(st)-.5));
          sky+=vec3(.33,.38,.45)*star*(1.-daylight*5.)*(1.-cover)*smoothstep(.06,.42,h);
        }
        if(d.y<0. && probe>.5){
          vec3 ground=mix(vec3(.005,.007,.011),vec3(.16,.14,.115),daylight);
          sky=mix(horizon,ground,smoothstep(0.,.25,-d.y));
        }
        gl_FragColor=vec4(sky,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const sphere=new T.SphereGeometry(1,48,24),dome=new T.Mesh(sphere,material);
  dome.scale.setScalar(44000);dome.renderOrder=-100;dome.frustumCulled=false;scene.add(dome);
  const probeScene=new T.Scene(),probeDome=new T.Mesh(sphere,material);
  probeDome.scale.setScalar(10);probeScene.add(probeDome);
  const generator=new T.PMREMGenerator(renderer);
  let target=null,dirty=true,lastProbe=-Infinity;
  new T.TextureLoader().load('./assets/materials/sky/clouds.webp',photo=>{
    photo.wrapS=T.RepeatWrapping;uniforms.cloudMap.value=photo;uniforms.hasClouds.value=1;dirty=true;
  },undefined,()=>{ /* The solar sky remains available without the cloud image. */ });
  return {
    setLight(daylight,warmth){
      uniforms.daylight.value=daylight;uniforms.warmth.value=warmth;dirty=true;
    },
    update(camera,quality){
      dome.position.copy(camera.position);
      if(!dirty||performance.now()-lastProbe<220)return;
      const previous=target;
      uniforms.probe.value=1;
      try{target=generator.fromScene(probeScene,0,.1,25,{size:quality===0?32:64});}
      finally{uniforms.probe.value=0;}
      scene.environment=target.texture;previous?.dispose();
      lastProbe=performance.now();dirty=false;
    }
  };
}
