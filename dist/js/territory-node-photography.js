import {DataTexture,TextureNode,RGBAFormat,LinearFilter,SRGBColorSpace} from 'three/webgpu';
import {Fn,If,vec2,vec3,vec4,float,int,uniform,uniformArray,nodeObject,texture,materialColor,
  floor,fract,mod,clamp,dot,mix,abs,min,max,log2,smoothstep,length,dFdx,dFdy,sRGBTransferEOTF,sRGBTransferOETF} from 'three/tsl';
import {surfaceBindings} from './territory-surface-photo.js';
import {naturalMix} from './atlas-appearance.js';

const bindings=new WeakMap(),dynamicTextures=new WeakMap(),cellAddresses=new WeakMap(),empty=new Map();
export function bound(ref,type){
  if(!bindings.has(ref))bindings.set(ref,uniform(ref.value,type).onRenderUpdate(()=>ref.value));
  return bindings.get(ref);
}

// A streaming slot can point to a different texture each frame. Its binding
// identity must remain its slot even when several slots share the blank texel.
class SlotTexture extends TextureNode {
  get value(){
    // sample(), grad() and level() clone a TextureNode. Always read the
    // root slot, including its original, immutable 1×1 fallback.
    if(this.referenceNode)return this.getBase().value;
    const active=this.binding?.value;
    return active?.isTexture?active:this.placeholder||super.value;
  }
  set value(v){super.value=v;}
  getUniformHash(){return this.getBase().uuid;}
}
export function boundTexture(ref,srgb=false){
  if(!dynamicTextures.has(ref)){
    if(!empty.has(srgb)){
      const placeholder=new DataTexture(new Uint8Array([128,128,128,0]),1,1,RGBAFormat);
      placeholder.minFilter=placeholder.magFilter=LinearFilter;
      if(srgb)placeholder.colorSpace=SRGBColorSpace;
      placeholder.needsUpdate=true;empty.set(srgb,placeholder);
    }
    const node=new SlotTexture(empty.get(srgb));
    node.placeholder=empty.get(srgb);node.binding=ref;dynamicTextures.set(ref,nodeObject(node));
  }
  return dynamicTextures.get(ref);
}

const luminance=vec3(.2126,.7152,.0722);
const {uniforms:f,grains,atlasGround,groundTint}=surfaceBindings;
export function atlasGrade(color){
  const s=sRGBTransferOETF(max(color,vec3(0)));
  const corrected=dot(s,vec3(...naturalMix.luma)).mul(vec3(...naturalMix.grey))
    .add(s.mul(vec3(...naturalMix.rgb))).add(vec3(...naturalMix.lift.map(v=>v/255))).saturate();
  return mix(color,sRGBTransferEOTF(corrected).mul(uniform(groundTint)),bound(atlasGround));
}

function tileAddress(grid,pad,cells){
  const cell=floor(grid),slot=mod(cell,vec2(2));
  const index=int(slot.x.add(slot.y.mul(2)));
  if(!cellAddresses.has(cells))cellAddresses.set(cells,uniformArray(cells.value,'vec2'));
  const resident=cellAddresses.get(cells).element(index).equal(cell).all();
  const xy=slot.add(clamp(fract(grid),pad,float(1).sub(pad))).mul(.5);
  return {uv:vec2(xy.x,float(1).sub(xy.y)),resident};
}
function regionalTile(metric,r){
  const p=vec3(metric,1),grid=vec2(dot(bound(r.uRegionalU),p),dot(bound(r.uRegionalV),p));
  const slot=tileAddress(grid,float(1.5).div(bound(r.uRegionalPixels)),r.uRegionalCells);
  const limits=bound(r.uRegionalLimits),edge=min(grid.sub(limits.xy),limits.zw.sub(grid));
  const fade=slot.resident.select(bound(r.uRegionalFade).mul(smoothstep(0,.055,min(edge.x,edge.y))),0);
  return vec4(boundTexture(r.uRegionalTiles,true).sample(slot.uv).rgb,fade);
}
function surfaceAddress(metric){
  const slot=tileAddress(metric.div(256),float(1).div(bound(f.uSurfaceTexels)),f.uSurfaceCells);
  const w=bound(f.uSurfaceWindow),edge=min(metric.sub(w),w.add(512).sub(metric));
  return {uv:slot.uv,weight:slot.resident.select(bound(f.uSurfaceGain).mul(smoothstep(0,24,min(edge.x,edge.y))),0)};
}
function surfacePixel(ref,uvNode,metric){
  const d=vec2(1/512,-1/512);
  return boundTexture(ref,true).sample(uvNode).grad(dFdx(metric).mul(d),dFdy(metric).mul(d));
}
export function photoRoofColor(color,metric,roofClass,photography,fine=true){
  let base=color;
  if(photography){
    const r=photography,bounds=bound(r.uRegionalBaseBounds),p=metric.sub(bounds.xy).div(bounds.zw.sub(bounds.xy));
    const regional=regionalTile(metric,r);
    const broad=boundTexture(r.uRegionalBase,true).sample(vec2(p.x,float(1).sub(p.y))).rgb;
    const sample=mix(broad,regional.rgb,regional.a);
    const green=sample.g.sub(max(sample.r,sample.b));
    const trusted=smoothstep(.014,.082,dot(sample,luminance)).mul(float(1).sub(smoothstep(.008,.061,green)));
    base=mix(color,sample,roofClass.mul(trusted).mul(.80));
  }
  if(!fine)return base;
  const a=surfaceAddress(metric),land=surfacePixel(f.uSurfaceLand,a.uv,metric);
  const inside=float(1).sub(smoothstep(.46,.61,land.a));
  return mix(base,surfacePixel(f.uSurfacePhoto,a.uv,metric).rgb,a.weight.mul(roofClass).mul(inside));
}
export function photoStreetColor(color,metric,paintMask){
  const a=surfaceAddress(metric),mip=log2(bound(f.uSurfaceTexels).mul(3.2/512));
  const sample=boundTexture(f.uSurfacePhoto,true).sample(a.uv).level(mip).rgb;
  const lum=dot(sample,luminance),green=sample.g.sub(max(sample.r,sample.b));
  const confidence=smoothstep(.035,.078,lum).mul(float(1).sub(smoothstep(.42,.64,lum))).mul(float(1).sub(smoothstep(.006,.037,green)));
  const tint=clamp(sample.div(max(lum,.035)),vec3(.81),vec3(1.17)).mul(clamp(lum.mul(1.21).add(.79),.86,1.19));
  return color.mul(mix(vec3(1),tint,a.weight.mul(paintMask).mul(confidence).mul(.83)));
}

export function terrainColorAndHeight(metric,photo){
  return Fn(()=>{
    const base=materialColor.rgb.toVar();
    if(photo.detail){
      const [l,t,r,b]=photo.detailBounds,p=metric.sub(vec2(l,t)).div(vec2(r-l,b-t));
      const edge=min(p,vec2(1).sub(p));
      base.assign(mix(base,texture(photo.detail,vec2(p.x,float(1).sub(p.y))).rgb,smoothstep(0,.009,min(edge.x,edge.y))));
    }
    const tile=regionalTile(metric,photo.regional).toVar();
    const atlasPlate=tile.a.mul(bound(photo.regional.uRegionalAtlas));
    base.assign(mix(base,tile.rgb,tile.a));
    const a=surfaceAddress(metric),coverage=a.weight.toVar(),dx=dFdx(metric).toVar(),dy=dFdy(metric).toVar();
    const delta=float(0).toVar(),area=max(length(dx),length(dy)).toVar();
    If(coverage.greaterThan(.001),()=>{
      const d=vec2(1/512,-1/512),gradX=dx.mul(d),gradY=dy.mul(d);
      const image=boundTexture(f.uSurfacePhoto,true),mask=boundTexture(f.uSurfaceLand,true);
      const aerial=image.sample(a.uv).grad(gradX,gradY).rgb.toVar(),land=mask.sample(a.uv).grad(gradX,gradY).toVar();
      const inside=float(1).sub(smoothstep(.45,.59,land.a)).mul(bound(grains.uSurfaceBuildingMask));
      const ground=mix(aerial,land.rgb,inside).toVar();
      const city=smoothstep(.975,.997,land.a).mul(float(1).sub(bound(atlasGround))).mul(bound(grains.uSurfaceBuildingMask));
      const oldShadow=float(1).sub(smoothstep(.055,.21,dot(aerial,luminance)));
      If(city.mul(oldShadow).greaterThan(.001).and(area.lessThan(.38)),()=>{
        const walls=float(0).toVar();
        for(const [x,z] of [[6,0],[-6,0],[0,6],[0,-6]]){
          const probe=surfaceAddress(metric.add(vec2(x,z)));
          walls.assign(max(walls,probe.weight.greaterThan(.001).select(float(1).sub(smoothstep(.445,.57,mask.sample(probe.uv).level(0).a)),0)));
        }
        const adjacent=max(mask.sample(a.uv).level(3).rgb,vec3(.21,.195,.175));
        ground.assign(mix(ground,adjacent.mul(dot(aerial,luminance).mul(1.7).add(.82)),
          walls.mul(city).mul(oldShadow).mul(float(1).sub(smoothstep(.075,.38,area)))));
      });
      const soil=smoothstep(.827,.85,land.a).mul(float(1).sub(smoothstep(.891,.92,land.a)));
      const sand=float(1).sub(smoothstep(.012,.030,abs(land.a.sub(176/255))));
      const gravel=float(1).sub(smoothstep(.012,.030,abs(land.a.sub(160/255))));
      const weights=vec3(soil,sand,gravel),confidence=max(soil,max(sand,gravel)),close=float(1).sub(smoothstep(.028,.17,area));
      If(close.mul(confidence).mul(bound(grains.uSurfaceGrainsReady)).greaterThan(.001),()=>{
        const weightsNorm=weights.div(max(.001,dot(weights,vec3(1)))),span=dot(weightsNorm,vec3(4,2,2.25));
        const scan=b=>boundTexture(b).sample(metric.div(span)).grad(dx.div(span),dy.div(span)).rgb;
        const relief=dot(scan(grains.uSurfaceGrains),weightsNorm).sub(.5),blend=close.mul(confidence).mul(float(1).sub(inside));
        delta.assign(relief.mul(dot(weightsNorm,vec3(.022,.014,.031))).mul(coverage).mul(blend));
        const local=image.sample(a.uv).level(log2(bound(f.uSurfaceTexels).mul(3/512))).rgb;
        ground.assign(mix(ground,local,dot(weightsNorm,vec3(.12,.73,.53)).mul(blend)));
        ground.mulAssign(dot(scan(grains.uGrainTone),weightsNorm).sub(.5).mul(.66).add(relief.mul(.17)).mul(blend).add(1));
      });
      base.assign(mix(base,ground,coverage.mul(float(1).sub(bound(atlasGround).mul(atlasPlate)))));
    });
    return vec4(atlasGrade(base),delta);
  })();
}
