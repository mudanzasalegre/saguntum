// One metric-scale finish for both renderers. It changes the existing mapped
// surfaces; it does not add puddle meshes, water planes, textures or roads.
// x = dry mineral variation, y = dampness, z = pooled water, w = wet roughness.
export const streetWeatherGLSL=`
vec4 streetWeather(vec2 p,float kind,float mode,float up,float wet,float distanceToEye,float halfWidth,float lateral){
  float mineral=sin(p.x*.19+sin(p.y*.113)*1.9)*sin(p.y*.157-p.x*.071);
  float fine=sin(p.x*1.37+p.y*.43+sin(p.y*.71)*1.3);
  float close=1.-smoothstep(110.,360.,distanceToEye);
  float variation=1.+(.046*mineral+.012*fine)*close;
  bool sealed=kind==0.||kind==1.||kind==3.||kind==4.;
  float allowed=sealed&&mode!=2.?1.:0.;
  float damp=clamp(wet,0.,1.)*allowed*smoothstep(.65,.94,abs(up));
  float basin=.5+.24*sin(p.x*.47+sin(p.y*.21)*1.6)+.18*sin(p.y*.51-p.x*.13)+.08*sin((p.x+p.y)*1.37);
  bool carriageway=kind==0.&&(mode==1.||mode==8.||mode==9.);
  float gutter=carriageway?smoothstep(halfWidth-.65,halfWidth-.12,abs(lateral))*.085:0.;
  float puddle=smoothstep(.57,.76,basin+gutter)*smoothstep(.40,.88,wet)*damp;
  puddle*=smoothstep(.992,.9997,abs(up))*close*(mode==4.?0.:1.);
  float wetRoughness=kind==0.?.28:.36;
  return vec4(variation,damp,puddle,wetRoughness);
}`;

export const streetWeatherWGSL=`
fn streetWeather(p:vec2f,kind:f32,mode:f32,up:f32,wet:f32,distanceToEye:f32,halfWidth:f32,lateral:f32)->vec4f{
  let mineral=sin(p.x*.19+sin(p.y*.113)*1.9)*sin(p.y*.157-p.x*.071);
  let fine=sin(p.x*1.37+p.y*.43+sin(p.y*.71)*1.3);
  let close=1.-smoothstep(110.,360.,distanceToEye);
  let variation=1.+(.046*mineral+.012*fine)*close;
  let sealed=kind==0.||kind==1.||kind==3.||kind==4.;
  let allowed=select(0.,1.,sealed&&mode!=2.);
  let damp=clamp(wet,0.,1.)*allowed*smoothstep(.65,.94,abs(up));
  let basin=.5+.24*sin(p.x*.47+sin(p.y*.21)*1.6)+.18*sin(p.y*.51-p.x*.13)+.08*sin((p.x+p.y)*1.37);
  let carriageway=kind==0.&&(mode==1.||mode==8.||mode==9.);
  let gutter=select(0.,smoothstep(halfWidth-.65,halfWidth-.12,abs(lateral))*.085,carriageway);
  var puddle=smoothstep(.57,.76,basin+gutter)*smoothstep(.40,.88,wet)*damp;
  puddle*=smoothstep(.992,.9997,abs(up))*close*select(1.,0.,mode==4.);
  let wetRoughness=select(.36,.28,kind==0.);
  return vec4f(variation,damp,puddle,wetRoughness);
}`;
