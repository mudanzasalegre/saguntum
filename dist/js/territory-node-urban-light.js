import {Fn,If,float,vec2,positionWorld,normalWorldGeometry,smoothstep,max,length,normalize} from 'three/tsl';
import {urbanLightBindings} from './territory-urban-sky.js';
import {bound as liveUniform,boundTexture as liveTexture} from './territory-node-photography.js';
export {liveUniform,liveTexture};

let field;
export function urbanField(){
  if(!field){
    const slots=urbanLightBindings();
    field={map:liveTexture(slots.heightField),active:liveUniform(slots.ready).mul(liveUniform(slots.enabled)),
      sun:liveUniform(slots.sun),shadow:liveUniform(slots.shadow)};
  }
  return field;
}
export const urbanUV=p=>p.sub(vec2(1750,4750)).mul(vec2(1/9747.4981,-1/6500));

// The IGN sky view factor changes indirect light. The elevation ray changes only
// the diffuse solar term outside the shadow camera, before the lighting sum.
export function applyUrbanLightNodes(material,roofOnly=false,facadeExposure=null){
  const field=urbanField(),point=positionWorld,coord=urbanUV(point.xz);
  const inside=coord.greaterThan(vec2(0)).all().and(coord.lessThan(vec2(1)).all());
  const active=field.active.mul(inside.select(1,0)).mul(roofOnly?normalWorldGeometry.y.greaterThan(.54).select(1,0):1);
  const cell=field.map.sample(coord).level(0);
  const obstruction=active.mul(roofOnly?cell.b:cell.g);
  const spread=field.shadow.z;
  const outside=spread.lessThanEqual(0).select(1,smoothstep(spread.mul(.79),spread.mul(1.22),length(point.xz.sub(field.shadow.xy))));
  const ray=normalize(field.sun.xz.add(.00001)),slope=field.sun.y.div(max(length(field.sun.xz),.02));
  const direct=Fn(()=>{
    const light=float(1).toVar();
    If(outside.greaterThan(.001).and(field.sun.y.greaterThan(.07)).and(obstruction.greaterThan(.018)),()=>{
      let blocked=float(0);
      for(let i=0;i<5;i++){
        const d=6+3*i+1.7*i*i;
        const top=field.map.sample(urbanUV(point.xz.add(ray.mul(d)))).level(0).r.mul(255).sub(8);
        blocked=max(blocked,smoothstep(.9,4.4,top.sub(point.y).sub(slope.mul(d))));
      }
      light.assign(blocked.mul(outside).mul(-.64).add(1));
    });
    return light;
  })();
  const original=material.setupLightingModel.bind(material);
  material.setupLightingModel=builder=>{
    const model=original(builder),start=model.start.bind(model);
    model.start=b=>{
      start(b);
      b.context.reflectedLight.indirectDiffuse.mulAssign(obstruction.mul(-.77).add(1));
      b.context.reflectedLight.directDiffuse.mulAssign(direct);
      if(facadeExposure){
        b.context.reflectedLight.indirectDiffuse.mulAssign(facadeExposure.mul(-.53).add(1));
        b.context.reflectedLight.indirectSpecular.mulAssign(facadeExposure.mul(-.34).add(1));
      }
    };
    return model;
  };
}
