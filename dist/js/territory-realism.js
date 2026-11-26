// Shared scene appearance. These are artistic weather presets, not live weather.
// Stable uniform objects keep GLSL and TSL in sync without rebuilding materials.
export const weatherPresets=Object.freeze({
  clear:Object.freeze({label:'Mediterráneo despejado',wetness:0,cloudiness:0,haze:.12}),
  overcast:Object.freeze({label:'Cielo cubierto',wetness:0,cloudiness:.88,haze:.38}),
  'after-rain':Object.freeze({label:'Después de la lluvia',wetness:.82,cloudiness:.62,haze:.45})
});

export const realismUniforms={
  wetness:{value:0},cloudiness:{value:0},haze:{value:.12},night:{value:0}
};

export function weatherState(preset='clear',wetness){
  const name=Object.hasOwn(weatherPresets,preset)?preset:'clear';
  const base=weatherPresets[name];
  const amount=typeof wetness==='number'&&Number.isFinite(wetness)?Math.max(0,Math.min(1,wetness)):base.wetness;
  return {preset:name,label:base.label,wetness:amount,cloudiness:base.cloudiness,haze:base.haze};
}

export function setTerritoryWeather(preset='clear',wetness){
  const state=weatherState(preset,wetness);
  for(const key of ['wetness','cloudiness','haze'])realismUniforms[key].value=state[key];
  return state;
}
