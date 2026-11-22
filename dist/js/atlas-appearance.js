// Presentation calibrated in the original Atlas. Both renderers use these values.
export const atlasLights={
  golden:{sun:'#ffdfa4',power:3.8,sky:'#c5d2cc',ground:'#72654b',fill:1.8,background:'#7e9086',exposure:1.10,direction:[-1000,700,100]},
  day:{sun:'#fff5df',power:3.1,sky:'#c2dbe0',ground:'#776b51',fill:2.25,background:'#809a99',exposure:1.08,direction:[-650,1600,-700]}
};
export const atlasRim={color:'#b9d5dd',intensity:.55,direction:[500,400,-800]};
export function applyAtlasLighting(mode,scene,renderer,sun,ambient){
  const p=atlasLights[mode];
  sun.color.set(p.sun);sun.intensity=p.power;
  ambient.color.set(p.sky);ambient.groundColor.set(p.ground);ambient.intensity=p.fill;
  scene.background.set(p.background);scene.fog.color.copy(scene.background);
  renderer.toneMappingExposure=p.exposure;
}
// The Atlas processes a photograph in sRGB before applying this material tint.
export const terrainTint='#f2e7ce';
export const naturalMix={luma:[.30,.52,.18],grey:[.26,.26,.22],rgb:[.61,.60,.59],lift:[32,34,20]};
export function naturalPixels(data){
  const {luma,grey,rgb,lift}=naturalMix;
  for(let i=0;i<data.length;i+=4){
    const l=data[i]*luma[0]+data[i+1]*luma[1]+data[i+2]*luma[2];
    for(let c=0;c<3;c++)data[i+c]=Math.min(255,l*grey[c]+data[i+c]*rgb[c]+lift[c]);
  }
}
