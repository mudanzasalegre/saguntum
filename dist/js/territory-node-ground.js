import {Fn,If,bool,float,vec2,vec4,uniform,uniformArray,positionLocal,positionView,positionWorld,
  normalWorld,normalWorldGeometry,materialColor,materialNormal,materialRoughness,abs,max,dot,cross,dFdx,dFdy,
  sign,normalize,smoothstep,fract,clamp} from 'three/tsl';
import {groundEffectsOf} from './territory-ground-effects.js';
import {bound,boundTexture,atlasGrade,terrainColorAndHeight} from './territory-node-photography.js';
import {applyUrbanLightNodes} from './territory-node-urban-light.js';

// The sun is the single shadow-casting directional light in the territory.
// The planner adjusts its normal bias whenever the shadow footprint changes.
const sunNormalBias=uniform(0).onRenderUpdate(({scene})=>
  scene?.children.find(light=>light.isDirectionalLight&&light.castShadow)?.shadow.normalBias??0);

function excavationInside(p,rect,across){
  const delta=p.sub(rect.xy);
  return abs(dot(delta,rect.zw)).lessThanEqual(1).and(abs(dot(delta,across)).lessThanEqual(1));
}
function visibleSurface(effects){
  return Fn(()=>{
    const keep=bool(true).toVar(),p=positionLocal.xz;
    if(effects.excavation){
      const {rectangles,cuts,cross,nCuts,coarse}=effects.excavation;
      if(coarse){
        const boxes=uniformArray(rectangles,'vec4');
        for(let i=0;i<rectangles.length;i++){
          const r=boxes.element(i);
          keep.assign(keep.and(p.greaterThanEqual(r.xy).all().and(p.lessThanEqual(r.zw).all()).not()));
        }
      }
      const spans=uniformArray(cuts,'vec4'),axes=uniformArray(cross,'vec2');
      for(let i=0;i<cuts.length;i++){
        const cut=bound(nCuts).greaterThan(i).and(excavationInside(p,spans.element(i),axes.element(i)));
        keep.assign(keep.and(cut.not()));
      }
    }
    if(effects.paving){
      const {ground,uniforms,names,packedMask}=effects.paving,pack=packedMask();
      const image=boundTexture(pack.map),rects=uniformArray(pack.rects,'vec4');
      for(let i=0;i<names.length;i++){
        const r=bound(uniforms[names[i]+'Box']),t=p.sub(r.xy).mul(r.zw);
        const inside=t.greaterThanEqual(vec2(0)).all().and(t.lessThan(vec2(1)).all());
        If(inside.and(bound(uniforms.atlasMaskCount).greaterThan(i)),()=>{
          const addr=rects.element(i),mask=image.sample(addr.xy.add(t.mul(addr.zw))).level(0);
          keep.assign(keep.and(mask.r.lessThanEqual(ground?.98:.1)));
        });
      }
    }
    if(effects.section){
      const {rect,across,enabled,participates}=effects.section;
      const open=bound(enabled).mul(bound(participates)).greaterThan(.5);
      keep.assign(keep.and(open.and(excavationInside(positionWorld.xz,bound(rect),bound(across))).not()));
    }
    return keep;
  })();
}

function scannedHeritage(material,grain){
  const p=positionWorld,dX=dFdx(p),dY=dFdy(p),axes=abs(cross(dX,dY));
  const metric=axes.y.greaterThanEqual(max(axes.x,axes.z)).select(p.xz,axes.x.greaterThan(axes.z).select(p.zy,p.xy));
  const coord=metric.div(.84),tile=vec2(grain.index%2,1-Math.floor(grain.index/2));
  const tex=boundTexture(grain.uniforms.heritageGrain);
  const uv=tile.add(fract(coord).mul(504/512).add(4/512)).mul(.5);
  const fine=tex.sample(uv).grad(dFdx(coord).mul(.4921875),dFdy(coord).mul(.4921875)).rgb.sub(.5)
    .mul(bound(grain.uniforms.grainReady)).mul(float(1).sub(smoothstep(9,36,positionView.z.negate())));
  const n=material.normalNode||materialNormal,sx=dFdx(positionView),sy=dFdy(positionView);
  const rx=cross(sy,n),ry=cross(n,sx),det=dot(sx,rx);
  const slope=rx.mul(dot(fine.xy,dFdx(metric))).add(ry.mul(dot(fine.xy,dFdy(metric))));
  material.normalNode=normalize(n.sub(slope.mul(sign(det).mul(.45).div(max(abs(det),1e-7)))));
  material.roughnessNode=clamp((material.roughnessNode||materialRoughness).add(fine.b.mul(.28)),.055,1);
}

// Apply after the object's original nodal family so that a road marking,
// a roof or a material in a temporary historical phase keeps its own shading.
export function groundNodeMaterial(source,object,base,renderer){
  const effects=groundEffectsOf(source);
  if(!effects)return base||null;
  const material=base||renderer.library.fromMaterial(source);
  if(!material)return null;
  if(effects.photo){
    const sample=terrainColorAndHeight(positionLocal.xz,effects.photo);
    material.colorNode=sample.rgb;
    const n=materialNormal,sx=dFdx(positionView),sy=dFdy(positionView),rx=cross(sy,n),ry=cross(n,sx),area=dot(sx,rx);
    const grad=rx.mul(dFdx(sample.a)).add(ry.mul(dFdy(sample.a)));
    material.normalNode=abs(area).greaterThan(1e-8).select(normalize(n.mul(abs(area)).sub(grad.mul(sign(area)))),n);
    applyUrbanLightNodes(material);
  }else if(effects.horizon){
    material.colorNode=atlasGrade(materialColor.rgb);
  }
  if(effects.grain)scannedHeritage(material,effects.grain);
  if(effects.roofLighting){
    // The Atlas shadow uses a different receiver bias on downward-wound roof
    // plates. Apply the difference in world metres on the same angular ramp.
    const adjust=bound(effects.roofLighting).mul(smoothstep(.9962,.9994,normalWorldGeometry.y.negate()));
    const delta=normalWorldGeometry.mul(.22).sub(normalWorld.mul(sunNormalBias));
    material.receivedShadowPositionNode=positionWorld.add(delta.mul(adjust));
  }
  if(effects.excavation||effects.paving||effects.section){
    const visible=visibleSurface(effects);
    material.maskNode=material.maskNode?material.maskNode.and(visible):visible;
    // r180's shadow override propagates castShadowNode but not maskNode.
    const shadow=material.castShadowNode||vec4(0,0,0,1);
    material.castShadowNode=Fn(()=>{visible.not().discard();return shadow;})();
  }
  return material;
}
