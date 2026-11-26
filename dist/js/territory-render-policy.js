// Preserve close geometry; change only bounded raster/lighting costs here.
const bands=[{end:26,extent:44},{end:70,extent:85},{end:140,extent:145},{end:300,extent:225},{end:650,extent:400},{end:1400,extent:820},{end:3000,extent:1500},{end:6000,extent:3000},{end:Infinity,extent:5500}];
export function shadowPlan({range,quality,atlasMode=false,aboveHorizon=true,previousExtent=0,maxTextureSize=4096}){
 const q=Math.max(0,Math.min(3,quality|0)),r=Math.max(0,range);
 const horizon=[85,950,1800,2400][q];
 const enabled=aboveHorizon&&r<(atlasMode?Math.max(horizon,900):horizon);
 let i=bands.findIndex(b=>r<b.end),old=bands.findIndex(b=>b.extent===previousExtent);
 if(old>=0){
  const low=old?bands[old-1].end:0,high=bands[old].end;
  if(r>=low*.88&&r<high*1.12)i=old;
 }
 const extent=bands[i<0?bands.length-1:i].extent;
 const size=Math.max(128,Math.min(maxTextureSize,[atlasMode?1024:512,1536,2048,4096][q]));
 return {enabled,extent,size,texel:2*extent/size,normalBias:Math.max(.025,extent/size*.8)};
}
export function contactPlan({enabled,pixels,maxSamples=4,tier=2}){
 if(!enabled)return {enabled:false,samples:0,strength:0};
 const samples=pixels>4000000?0:pixels>2000000?Math.min(2,maxSamples):Math.min(4,maxSamples);
 return {enabled:true,samples:Math.max(0,samples),strength:tier>=3?.93:.78};
}
// Device-agnostic allocation estimate, not a measurement of GPU memory.
export function estimateTargetBytes(width,height,samples){
 const pixels=width*height;return pixels*(8+4)*(1+(samples>0?samples:0));
}

// One photometric/weather response for both renderers. Values are visual
// presentation controls, not a live weather measurement or a forecast.
export function weatherLightPlan({elevation=0,cloudiness=0,haze=0}={}){
 const unit=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
 const smooth=(a,b,value)=>{const t=unit((value-a)/(b-a));return t*t*(3-2*t);};
 const y=Math.max(-1,Math.min(1,Number.isFinite(elevation)?elevation:0));
 const clouds=unit(cloudiness),mist=unit(haze);
 const daylight=smooth(-.17,.21,y),warmth=1-smooth(-.01,.44,y);
 const sunVisibility=1-.86*clouds;
 return {
  cloudiness:clouds,haze:mist,daylight,warmth,
  dusk:warmth*smooth(-.18,.015,y)*(1-.58*clouds),
  sunIntensity:3.10*Math.pow(Math.max(0,y),.56)*sunVisibility,
  // Keep the sky contribution distinct from the sun so shaded elevations
  // retain relief. Diffuse cloud light opens the shadows without bleaching.
  ambientIntensity:.22+daylight*(.30+.18*clouds),
  environmentIntensity:.38+daylight*(.36+.12*clouds),
  exposure:1.08+.12*(1-daylight)+.06*clouds*daylight,
  fogDensity:.000033+.000115*mist+.000013*clouds+.000012*(1-daylight),
  sunVisibility,shadowOpacity:1-.74*clouds,
  night:1-smooth(-.16,.10,y)
 };
}
