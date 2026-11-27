// A requested stop has an identity before camera data or a 3D model loads.
const circusStops=new Set(['circo-arena','circo-spina','circo-metae','circo-graderio','circo-historica','circo-carceres']);
export const isHistoricalCircoStop=stop=>stop?.mapScope==='circus'||circusStops.has(stop?.id);
export function requestedVisitMode(place,stop,presentation){
 const mode=presentation?.mode||stop?.mode||stop?.recommendedMode;
 if(place?.id==='circo')return isHistoricalCircoStop(stop)?'historical':mode==='cut'?'cut':'current';
 return mode||'current';
}
