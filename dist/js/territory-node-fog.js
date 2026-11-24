import {Matrix3} from 'three';
import {Fn,If,acesFilmicToneMapping,densityFogFactor,float,max,mix,output,reference,
  sRGBTransferEOTF,sRGBTransferOETF,sqrt,uniform,vec4} from 'three/tsl';

// The Atlas' GLSL applies distance haze in display space, after ACES/sRGB.
// r180 WebGPU applies its final display transform after drawing the whole scene.
// Return equivalent scene-linear radiance so the horizon retains its contrast.
const inverseInput=uniform(new Matrix3().set(.59719,.35458,.04823,.076,.90834,.01566,.02840,.13383,.83777).invert());
const inverseOutput=uniform(new Matrix3().set(1.60475,-.53108,-.07367,-.10208,1.10813,-.00605,-.00327,-.07276,1.07602).invert());
export function atlasDistanceFog(scene,renderer){
  const exposure=reference('toneMappingExposure','float',renderer);
  const colour=reference('color','color',scene.fog),density=reference('density','float',scene.fog);
  return Fn(()=>{
    const result=output.rgb.toVar(),factor=densityFogFactor(density).toVar();
    If(factor.greaterThan(.001),()=>{
      const original=sRGBTransferOETF(acesFilmicToneMapping(output.rgb,exposure));
      const display=mix(original,sRGBTransferOETF(colour),factor);
      const y=inverseOutput.mul(sRGBTransferEOTF(display)).clamp(0,.9999).toVar();
      const a=float(1).sub(y.mul(.983729)),b=float(.0245786).sub(y.mul(.983729*.432951));
      const c=float(-.000090537).sub(y.mul(.238081));
      const light=sqrt(max(b.mul(b).sub(a.mul(c).mul(4)),0)).sub(b).div(a.mul(2));
      result.assign(inverseInput.mul(light).mul(float(.6).div(exposure)));
    });
    return vec4(result,output.a);
  })();
}
