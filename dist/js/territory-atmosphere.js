import * as T from 'three';
import {territorySky} from './territory-sky.js';
import {atlasLights,atlasRim,applyAtlasLighting} from './atlas-appearance.js';

export function createAtmosphere(scene,renderer,sea,buildings,network,registration) {
  const ambient=new T.HemisphereLight('#bfd8f1','#827366',1);
  const sun=new T.DirectionalLight('#fff2de',2.2);
  sun.castShadow=true;
  Object.assign(sun.shadow.camera,{near:2,far:1250});
  sun.shadow.mapSize.setScalar(1024);
  // The Atlas lights use its east/south plotting grid. Rotate both vectors into UTM.
  function atlasDirection([x,y,z],out){
    return out.set(registration.a*x+registration.b*z,y,registration.c*x+registration.d*z).normalize();
  }
  const rim=new T.DirectionalLight(atlasRim.color,atlasRim.intensity);
  atlasDirection(atlasRim.direction,rim.position);
  scene.add(ambient,sun,sun.target,rim);
  const horizon=new T.Color(),zenith=new T.Color(),direction=new T.Vector3(),tint=new T.Color();
  const sky=territorySky(renderer,scene,direction,horizon,zenith);
  scene.fog=new T.FogExp2('#ced9df',.000035);
  const right=new T.Vector3(),upPlane=new T.Vector3(),worldUp=new T.Vector3(0,1,0);
  const snapped=new T.Vector3();
  let light=1,span=0,lastPopulation=-1,lastRefresh=0,invalid=true,atlasMode=false;
  function atlas(mode){
    atlasMode=true;
    scene.background=horizon;applyAtlasLighting(mode,scene,renderer,sun,ambient);
    atlasDirection(atlasLights[mode].direction,direction);rim.visible=true;
    sky.show(false);sea.setAtlasLight(mode);
    buildings.night.value=0;network.setNight(0);invalid=true;
  }
  function setHour(hour){
    atlasMode=false;rim.visible=false;sky.show(true);renderer.toneMappingExposure=1.05;
    // Equinox and local solar time, N = -Z and E = +X in the territorial CRS.
    const angle=(hour-12)*Math.PI/12,phi=39.679*Math.PI/180;
    direction.set(-Math.sin(angle),Math.cos(phi)*Math.cos(angle),Math.sin(phi)*Math.cos(angle));
    light=T.MathUtils.smoothstep(direction.y,-.17,.21);
    const warmth=1-T.MathUtils.smoothstep(direction.y,-.01,.44);
    const dusk=warmth*T.MathUtils.smoothstep(direction.y,-.18,.015);
    horizon.set('#152031').lerp(tint.set('#b8cfdf'),light).lerp(tint.set('#f3bea4'),dusk*.72);
    zenith.set('#071224').lerp(tint.set('#427fae'),light);
    scene.background=horizon;scene.fog.color.copy(horizon);
    scene.fog.density=.000032+(1-light)*.000021;
    sun.color.set('#fff1db').lerp(tint.set('#ffac72'),warmth);
    sun.intensity=2.85*Math.pow(Math.max(0,direction.y),.52);
    ambient.color.set('#799acb').lerp(tint.set('#d1e1f4'),light);
    ambient.groundColor.set('#39384b').lerp(tint.set('#88755f'),light);
    ambient.intensity=.28+.50*light;scene.environmentIntensity=.52+.29*light;
    sky.setLight(light,dusk);sea.setSun(direction,light);
    buildings.night.value=1-T.MathUtils.smoothstep(direction.y,-.16,.10);
    network.setNight(buildings.night.value);invalid=true;
  }
  function update(camera,p,range,quality){
    sky.update(camera,quality);
    if(atlasMode)scene.fog.density=T.MathUtils.lerp(.000115,.000022,T.MathUtils.smoothstep(range,350,4900));
    const enabled=(atlasMode||(range<900&&quality>0))&&direction.y>.035;
    if(renderer.shadowMap.enabled!==enabled){renderer.shadowMap.enabled=enabled;invalid=true;}
    const desiredSize=quality===2?2048:quality===1?1536:1024;
    if(enabled&&sun.shadow.mapSize.x!==desiredSize){
      sun.shadow.mapSize.setScalar(desiredSize);sun.shadow.map?.dispose();sun.shadow.map=null;invalid=true;
    }
    // Quantize the shadow footprint and snap its centre to whole shadow texels.
    // The smallest footprint resolves window reveals and pavilion columns.
    const extent=range<26?44:range<70?85:range<140?145:range<300?225:range<650?400:
      range<1400?820:range<3000?1500:range<6000?3000:5500;
    const distance=580+extent*1.55;
    if(span!==extent){
      span=extent;Object.assign(sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span,far:distance+extent*1.7+320});
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.normalBias=Math.max(.025,span/desiredSize*.8);
      sun.shadow.bias=-.00009;invalid=true;
    }
    const texel=2*extent/desiredSize;
    right.crossVectors(worldUp,direction).normalize();upPlane.crossVectors(direction,right);
    snapped.copy(p).addScaledVector(right,Math.round(p.dot(right)/texel)*texel-p.dot(right))
      .addScaledVector(upPlane,Math.round(p.dot(upPlane)/texel)*texel-p.dot(upPlane));
    const now=performance.now(),population=buildings.stream.live.size+network.stream.live.size+(buildings.aerialStats?.parts||0);
    if(invalid||snapped.distanceToSquared(sun.target.position)>Math.max(texel,1)**2||
       (enabled&&(population!==lastPopulation||(range<500&&now-lastRefresh>850)))){
      sun.target.position.copy(snapped);sun.position.copy(snapped).addScaledVector(direction,distance);
      renderer.shadowMap.needsUpdate=true;lastPopulation=population;lastRefresh=now;invalid=false;
    }
  }
  return {atlas,setHour,update};
}
