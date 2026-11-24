import {Color,MathUtils} from 'three';

const water=['#195f73','#205b69','#081a25'].map(c=>new Color(c));
const shore=['#589e9c','#75a396','#142d36'].map(c=>new Color(c));
const foam=['#d5e7de','#e3dcca','#516675'].map(c=>new Color(c));
const sun=['#fff5df','#ffdfa4'].map(c=>new Color(c));

export function solarWater(u,sunHeight,daylight){
 const sunset=1-MathUtils.smoothstep(sunHeight,.1,.7),dark=1-daylight;
 u.waterColor.value.copy(water[0]).lerp(water[1],sunset).lerp(water[2],dark);
 u.shallowColor.value.copy(shore[0]).lerp(shore[1],sunset).lerp(shore[2],dark);
 u.foamColor.value.copy(foam[0]).lerp(foam[1],sunset).lerp(foam[2],dark);
 u.sunColor.value.copy(sun[0]).lerp(sun[1],sunset);
 u.sunStrength.value=(1+.2*sunset)*daylight;
}

export function projectedShorelines(shorelines,project){
 const lon=-.21,lat=39.66,c=project(lon,lat),e=project(lon+.001,lat),n=project(lon,lat+.001);
 const a=(e.x-c.x)*1000,b=(n.x-c.x)*1000,d=(e.z-c.z)*1000,f=(n.z-c.z)*1000,det=a*f-b*d;
 if(!Number.isFinite(det)||Math.abs(det)<1e-8)throw Error('Proyección litoral inválida.');
 return shorelines.map(line=>line.map(([x,z])=>({x,z,lon:lon+((x-c.x)*f-(z-c.z)*b)/det,lat:lat+((z-c.z)*a-(x-c.x)*d)/det})));
}
