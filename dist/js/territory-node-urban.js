import {MeshBasicNodeMaterial,MeshStandardNodeMaterial,InstancedInterleavedBuffer} from 'three/webgpu';
import {Fn,attribute,uv,texture,mat3,mat4,float,vec2,vec3,vec4,mix,clamp,floor,fract,mod,abs,dot,length,max,
  sin,cos,asin,atan,sign,normalize,smoothstep,sqrt,positionGeometry,cameraPosition,modelWorldMatrix,
  cameraViewMatrix,normalViewGeometry,vertexColor,varying,varyingProperty,diffuseColor,instancedBufferAttribute} from 'three/tsl';
import {urbanMaterialRecord} from './territory-urban-material-record.js';
import {buildingNodes,skylineNodes,detailNodes} from './territory-node-urban-architecture.js';
import {streetNodes} from './territory-node-urban-street.js';
import {liveUniform} from './territory-node-urban-light.js';

// Billboards and articulated limbs need the original per-instance basis before
// the regular NodeMaterial transform. All draws of a tile share these columns.
const basisCache=new WeakMap();
const basis=Fn(({object})=>{
  const a=object.instanceMatrix;
  if(!a)return mat4();
  let value=basisCache.get(a);
  if(!value){
    const buffer=new InstancedInterleavedBuffer(a.array,16,1);
    Object.defineProperty(buffer,'version',{get:()=>a.version});
    value=mat4(...[0,4,8,12].map(offset=>instancedBufferAttribute(buffer,'vec4',16,offset)));
    basisCache.set(a,value);
  }
  return value;
});

function planting(source,record){
  const view=record.kind==='tree-view',node=new MeshStandardNodeMaterial({side:source.side,
    roughness:.94,alphaTest:source.alphaTest,alphaToCoverage:source.alphaToCoverage,map:source.map});
  const matrix=basis(),tree=modelWorldMatrix.mul(matrix),center=vec3(0,2.27,0),p=positionGeometry;
  const X=normalize(tree.element(0).xyz),Y=normalize(tree.element(1).xyz),Z=normalize(tree.element(2).xyz);
  if(view){
    const eye=normalize(cameraPosition.sub(tree.mul(vec4(center,1)).xyz));
    const az=atan(dot(eye,X),dot(eye,Z)),el=asin(clamp(dot(eye,Y),-1,1));
    const around=mod(floor(az.mul(4/Math.PI).add(.5)).add(8),8);
    const elevation=clamp(floor(el.mul(5/Math.PI).add(.5)),0,2),slot=elevation.mul(8).add(around);
    const st=varying(vec2(mod(slot,4),float(5).sub(floor(slot.div(4)))).add(uv()).div(vec2(4,6)));
    const right=vec3(cos(az),0,sin(az).negate()),up=vec3(sin(az).negate().mul(sin(el)),cos(el),cos(az).negate().mul(sin(el)));
    node.positionNode=matrix.mul(vec4(center.add(right.mul(p.x)).add(up.mul(p.y)),1)).xyz;
    node.colorNode=texture(source.map,st);
    const disk=clamp(uv().sub(vec2(.5,.55)).mul(2.25),vec2(-1),vec2(1));
    const outward=sqrt(max(0,float(1).sub(dot(disk,disk))));
    const billboardNormal=varying(normalize(mat3(tree).mul(right))).mul(disk.x)
      .add(varying(normalize(mat3(tree).mul(up))).mul(disk.y)).add(varying(eye).mul(outward)).add(vec3(0,1.65,0));
    node.normalNode=normalize(mat3(cameraViewMatrix).mul(billboardNormal));
  }else{
    const wind=liveUniform(record.wind),eye=normalize(cameraPosition.sub(tree.mul(vec4(p,1)).xyz));
    const phase=dot(matrix.element(3).xz,vec2(.031,.019));
    const sway=sin(phase.add(wind.x).add(p.y.mul(.28))).add(sin(phase.mul(1.83).add(wind.x.mul(2.1))).mul(.36));
    const bend=sway.mul(smoothstep(1.3,4.4,p.y)).mul(wind.y);
    node.positionNode=matrix.mul(vec4(p.add(vec3(bend.mul(.012),0,bend.mul(.008))),1)).xyz;
    const direction=abs(vec3(dot(eye,X),dot(eye,Y),dot(eye,Z)));
    const keep=varying(dot(direction,attribute('leafAxis','vec3')).sub(max(direction.x,max(direction.y,direction.z)).mul(.85)));
    node.maskNode=keep.greaterThanEqual(0);
    // Every cutout has the outward normal of the entire crown, on both sides.
    node.normalNode=normalViewGeometry;
    node.castShadowNode=Fn(()=>{
      const alpha=texture(source.map).a;
      node.maskNode.not().or(alpha.lessThan(source.alphaTest)).discard();
      return vec4(0,0,0,1);
    })();
  }
  return node;
}

function prop(source,{dynamic,night}){
  const node=new MeshStandardNodeMaterial({roughness:source.roughness,vertexColors:true,side:source.side});
  const part=attribute('part','vec3'),visible=vertexColor().rgb;
  if(dynamic){
    const p=positionGeometry,k=part.y,joint=abs(k).greaterThan(1.5).select(1.31,.88);
    const angle=sign(k).mul(sin(attribute('stride','float'))).mul(abs(k).greaterThan(1.5).select(.29,.39));
    const y=p.y.sub(joint);
    const limb=vec3(p.x,cos(angle).mul(y).sub(sin(angle).mul(p.z)).add(joint),sin(angle).mul(y).add(cos(angle).mul(p.z)));
    node.positionNode=basis().mul(vec4(abs(k).greaterThan(.5).select(limb,p),1)).xyz;
  }
  const setup=node.setupDiffuseColor.bind(node);
  node.setupDiffuseColor=builder=>{
    setup(builder);
    if(builder.object.instanceColor){
      diffuseColor.rgb.assign(visible.mul(mix(vec3(1),varyingProperty('vec3','vInstanceColor'),part.x)));
    }
  };
  node.emissiveNode=diffuseColor.rgb.mul(part.z).mul(liveUniform(night)).mul(2.4);
  return node;
}

export function urbanNodeMaterial(source,object,renderer){
  const record=urbanMaterialRecord(source);
  if(!record)return null;
  switch(record.kind){
    case 'architecture':return buildingNodes(source,record);
    case 'skyline':return skylineNodes(source,record);
    case 'facade-details':return detailNodes(source);
    case 'street':return streetNodes(source,record);
    case 'crown':case 'crown-depth':case 'tree-view':return planting(source,record);
    case 'street-prop':return prop(source,record);
    case 'tree-contact':{
      const node=new MeshBasicNodeMaterial({color:source.color,transparent:true,depthWrite:false,
        polygonOffset:true,polygonOffsetFactor:source.polygonOffsetFactor});
      node.opacityNode=smoothstep(.03,.98,length(uv().mul(2).sub(1))).oneMinus().mul(source.opacity);
      return node;
    }
    case 'tree-pit':{
      const node=new MeshStandardNodeMaterial({roughness:1,polygonOffset:true,polygonOffsetFactor:source.polygonOffsetFactor});
      const r=length(uv().sub(.5)).mul(2),fleck=fract(sin(dot(floor(uv().mul(185)),vec2(12.77,35.89))).mul(43758.54));
      node.maskNode=r.lessThanEqual(.98);
      node.colorNode=mix(vec3(source.color.r,source.color.g,source.color.b).mul(fleck.mul(.37).add(.80)),
        vec3(.116,.122,.115),smoothstep(.88,.9,r));return node;
    }
    default:return null;
  }
}
