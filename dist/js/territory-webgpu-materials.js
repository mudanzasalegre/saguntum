// First native TSL port of the ordinary urban material families. This is a
// pilot, not an equivalent port of all the Atlas GLSL, masks or coastal Water.
import * as G from 'three/webgpu';
import {attribute,uv,positionWorld,cameraPosition,texture,uniform,float,vec2,vec3,fract,floor,mod,mix,smoothstep,step,clamp,abs,sin,max,distance,time} from 'three/tsl';
const assets=new URL('../assets/materials/',import.meta.url);
async function readTexture(name,srgb,compact=false){
 const loader=new G.TextureLoader();
 const path=small=>new URL(name+(small?'-compact':'')+'.webp',assets).href;
 let map;
 try{map=await loader.loadAsync(path(compact));}
 catch(error){if(!compact)map=await loader.loadAsync(path(true));else throw error;}
 map.colorSpace=srgb?G.SRGBColorSpace:G.NoColorSpace;
 map.anisotropy=compact?4:8;
 return map;
}
async function readStreet(name,srgb,compact){
 const t=await new G.TextureLoader().loadAsync(new URL('streets/'+name+'.webp',assets).href);
 t.colorSpace=srgb?G.SRGBColorSpace:G.NoColorSpace;t.anisotropy=compact?4:8;return t;
}
function atlasUV(metric,slot,metres,grid,gutter){
 const cell=vec2(mod(slot,grid[0]),floor(slot.div(grid[0])));
 return cell.add(vec2(gutter)).add(fract(metric.div(metres)).mul(1-2*gutter)).div(vec2(...grid));
}
export async function labMaterials(compact){
 const night=uniform(0),warnings=[],maps=[];
 const track=promise=>promise.then(t=>(maps.push(t),t));
 const building=new G.MeshStandardNodeMaterial({vertexColors:true,roughness:.86,side:G.DoubleSide});
 const street=new G.MeshStandardNodeMaterial({color:0x918c80,roughness:.92,side:G.DoubleSide});
 const architecture=await Promise.allSettled([
  track(readTexture('architecture/surfaces',true,compact)),
  track(readTexture('architecture/microrelief',false,compact)),
  track(readTexture('architecture/joinery',true,compact)),
  track(readTexture('architecture/glazing',false,compact))
 ]);
 if(architecture.every(r=>r.status==='fulfilled')){
  const [surface,relief,joinery,glazing]=architecture.map(r=>r.value);
  const arch=attribute('archData','vec4'),metric=attribute('archMetric','vec4').xy,bay=uv();
  const index=clamp(floor(arch.x.add(.5)),0,7),family=mod(max(floor(arch.y.add(.5)),0),6);
  const coords=atlasUV(metric,index,float(2.25),[4,2],4/512);
  const grain=texture(surface,coords).rgb,rough=texture(relief,coords).b;
  const base=attribute('color','vec3').mul(clamp(grain.mul(2.32),vec3(.25),vec3(1.95)));
  const seed=mod(floor(arch.z.add(.5)),1024),column=floor(bay.x),level=floor(bay.y);
  const balcony=step(mod(column.add(seed),4),.49);
  const upper=mix(float(1),float(0),balcony);
  const lower=mix(float(2),float(3),step(6,arch.y));
  const variant=mix(lower,upper,step(1,level));
  const tone=mod(column.add(seed.mul(3)).mul(17).add(level.mul(37)),97).div(97);
  const opening=variant.add(step(.64,tone).mul(4));
  const trimUV=vec2(family,opening).add(vec2(.006)).add(fract(bay).mul(.988)).div(vec2(6,8));
  const trim=texture(joinery,trimUV),glass=texture(glazing,trimUV).r;
  const near=float(1).sub(smoothstep(120,650,distance(positionWorld,cameraPosition)));
  const visibleOpening=step(0,arch.y).mul(step(0,bay.y)).mul(near);
  const weather=sin(positionWorld.x.mul(.21)).mul(sin(positionWorld.z.mul(.19))).mul(.025);
  building.vertexColors=false;
  building.colorNode=mix(base.mul(weather.add(1)),trim.rgb,trim.a.mul(visibleOpening));
  building.roughnessNode=mix(clamp(rough,.42,.98),float(.24),glass.mul(visibleOpening));
  building.emissiveNode=vec3(.86,.48,.22).mul(glass).mul(visibleOpening).mul(step(.64,tone)).mul(night);
 }else warnings.push('Faltan texturas arquitectónicas; material de respaldo sin TSL de fachada.');
 const pavement=await Promise.allSettled([track(readStreet('pavements',true,compact)),track(readStreet('pavements-detail',false,compact))]);
 if(pavement.every(r=>r.status==='fulfilled')){
  const [photo,detail]=pavement.map(r=>r.value),profile=attribute('streetProfile','vec4'),kind=clamp(floor(profile.x.add(.5)),0,7),ribbon=uv();
  const grid=vec2(4,2),slot=vec2(mod(kind,4),float(1).sub(floor(kind.div(4))));
  const paving=step(.5,kind).mul(float(1).sub(step(5.5,kind)));
  const metric=mix(positionWorld.xz,ribbon,paving).div(max(profile.y,.1));
  const texUV=slot.add(vec2(8/512)).add(fract(metric).mul(496/512)).div(grid);
  const grain=texture(photo,texUV).rgb,pores=texture(detail,texUV).b;
  const mode=profile.w,mark=step(abs(mode.sub(1)),.1).mul(float(1).sub(smoothstep(.04,.08,abs(ribbon.x)))).mul(step(mod(ribbon.y,8),3.8));
  const weather=sin(positionWorld.x.mul(.39)).mul(sin(positionWorld.z.mul(.31))).mul(.035).add(1);
  street.colorNode=mix(grain.mul(weather),vec3(.59,.57,.49),mark.mul(.7));
  street.roughnessNode=clamp(pores,.55,.98);
 }else warnings.push('Faltan texturas de pavimento; material de respaldo.');
 return {building,street,night,warnings,dispose(){for(const t of maps)t.dispose();for(const m of [building,street])m.dispose();}};
}
