// Local apparent solar hour in Sagunto. NOAA's fractional-year declination.
const latitude=39.679*Math.PI/180;
export function solarDateInSagunto(){
  return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
export function validSolarDate(date){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const time=Date.parse(date+'T12:00:00Z');
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===date;
}
function declination(date){
  const year=Number(date.slice(0,4)),start=Date.UTC(year,0,1);
  const elapsed=Date.parse(date+'T00:00:00Z')-start;
  const a=2*Math.PI*elapsed/(Date.UTC(year+1,0,1)-start);
  return .006918-.399912*Math.cos(a)+.070257*Math.sin(a)-.006758*Math.cos(2*a)
    +.000907*Math.sin(2*a)-.002697*Math.cos(3*a)+.00148*Math.sin(3*a);
}
export function solarDirection(hour,date){
  const d=declination(date),angle=(hour-12)*Math.PI/12;
  const transit=Math.cos(d)*Math.cos(angle);
  return [-Math.cos(d)*Math.sin(angle),Math.sin(latitude)*Math.sin(d)+Math.cos(latitude)*transit,
    Math.sin(latitude)*transit-Math.cos(latitude)*Math.sin(d)];
}
export function solarPreset(name,date){
  if(name==='noon')return 12;
  if(name==='night')return 23;
  const halfDay=12/Math.PI*Math.acos(-Math.tan(latitude)*Math.tan(declination(date)));
  // These presets show the sun just above the horizon at quarter-hour precision.
  return Math.round((12+(name==='sunrise'?-1:1)*(halfDay-.35))*4)/4;
}
