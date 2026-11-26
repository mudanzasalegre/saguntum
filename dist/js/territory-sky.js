import * as T from 'three';

// Photograph-derived opacity and luminance of the upper hemisphere. The
// geographic sun, sky colour and radiance are evaluated at the selected hour.
export function territorySky(renderer,scene,direction,horizon,zenith,nativeEnvironment=null) {
  const uniforms={
    horizon:{value:horizon},zenith:{value:zenith},sunDir:{value:direction},
    daylight:{value:1},warmth:{value:0},cloudiness:{value:0},haze:{value:0},
    cloudMap:{value:null},hasClouds:{value:0},probe:{value:0}
  };
  const native=nativeEnvironment?.createSkyMaterial(uniforms);
  const material=native?.material||new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,fog:false,uniforms,
    vertexShader:'varying vec3 skyDir; void main(){skyDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`
      uniform vec3 horizon,zenith,sunDir;
      uniform float daylight,warmth,probe,hasClouds,cloudiness,haze;
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
        float photoCover=smoothstep(.06,.88,clouds.r)*hasClouds;
        // A sparse clear sky and a continuous high overcast use the same
        // photographed cloud field. Missing photography still gives a safe
        // uniform overcast instead of a black sampler or an invented storm.
        float cover=mix(photoCover*.44,.78+.22*photoCover,cloudiness);
        float bright=mix(clouds.g*clouds.g,.31+.37*clouds.g,cloudiness*.72);
        float facing=clamp(dot(d,sunDir),0.,1.);
        vec3 air=mix(horizon,zenith,pow(h,.48));
        air=mix(air,horizon,haze*.22*(1.-pow(h,.35)));
        air+=vec3(.32,.20,.10)*pow(facing,10.)*daylight*(.3+warmth)*smoothstep(-.03,.09,d.y)*(1.-.86*cloudiness);
        vec3 cloud=mix(vec3(.30,.35,.41),vec3(1.45,1.44,1.39),smoothstep(.13,.82,bright));
        cloud=mix(cloud,cloud*vec3(1.24,.80,.63),warmth*(.35+.65*facing)*(1.-.65*cloudiness));
        cloud=mix(vec3(.017,.023,.038),cloud,daylight);
        float aboveHorizon=smoothstep(-.012,.105,d.y);
        vec3 sky=mix(air,cloud,cover*aboveHorizon);
        float disc=smoothstep(.99991,.999988,facing);
        float halo=.10*pow(facing,32.)+.26*pow(facing,340.)+2.7*disc;
        sky+=vec3(1.,.83,.63)*halo*daylight*(1.-.93*cover)*(1.-.86*cloudiness)*aboveHorizon;
        if(daylight<.20 && d.y>.06){
          vec2 st=vec2(azimuth/(2.*pi),elevation/pi)*vec2(920.,730.);
          vec2 cell=floor(st);
          float star=step(.992,hash(cell))*exp(-18.*dot(fract(st)-.5,fract(st)-.5));
          // The broad cloud deck also hides stars between the photographic
          // cloud patches. An overcast night should not remain star-filled.
          float starVisibility=(1.-cover)*(1.-cover)*(1.-cloudiness);
          sky+=vec3(.33,.38,.45)*star*(1.-daylight*5.)*starVisibility*smoothstep(.06,.42,h);
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
  const probesSupported=!!nativeEnvironment||renderer.extensions.has('EXT_color_buffer_float');
  let generator;
  let target=null,dirty=true,lastProbe=-Infinity,probeSize=0,disposed=false,photoTexture=null;
  new T.TextureLoader().load('./assets/materials/sky/clouds.webp',photo=>{
    if(disposed){photo.dispose();return;}
    photoTexture=photo;photo.wrapS=T.RepeatWrapping;uniforms.cloudMap.value=photo;uniforms.hasClouds.value=1;dirty=true;
  },undefined,()=>{ /* The solar sky remains available without the cloud image. */ });
  return {
    show(visible){
      dome.visible=visible;
      scene.environment=visible&&target?target.texture:null;
    },
    setLight(daylight,warmth){
      uniforms.daylight.value=daylight;uniforms.warmth.value=warmth;dirty=true;
    },
    setWeather(cloudiness,haze){
      const clouds=T.MathUtils.clamp(cloudiness,0,1),mist=T.MathUtils.clamp(haze,0,1);
      if(uniforms.cloudiness.value===clouds&&uniforms.haze.value===mist)return;
      uniforms.cloudiness.value=clouds;uniforms.haze.value=mist;dirty=true;
    },
    update(camera,quality){
      if(!dome.visible)return;
      dome.position.copy(camera.position);
      const size=[32,64,64,128][quality];
      if(!probesSupported||(!dirty&&probeSize===size)||performance.now()-lastProbe<220)return;
      generator??=nativeEnvironment?nativeEnvironment.createProbe(renderer):new T.PMREMGenerator(renderer);
      const previous=target;
      uniforms.probe.value=1;
      try{target=generator.fromScene(probeScene,0,.1,25,{size,renderTarget:probeSize===size?target:null});}
      finally{uniforms.probe.value=0;}
      scene.environment=target.texture;if(previous!==target)previous?.dispose();
      lastProbe=performance.now();dirty=false;probeSize=size;
    },
    dispose(){
      disposed=true;scene.environment=null;dome.removeFromParent();probeDome.removeFromParent();
      photoTexture?.dispose();target?.dispose();generator?.dispose();sphere.dispose();material.dispose();native?.dispose();
    }
  };
}
