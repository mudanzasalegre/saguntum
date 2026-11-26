// Node only: numeric parity of the production shader kernels, real Three r180
// material assembly and WGSL argument contracts. This is not a GPU draw test.
// node --experimental-loader ./research/validate_loader.mjs research/test-territory-street-weather.mjs
import assert from 'node:assert/strict';
import * as T from 'three';
import * as G from 'three/webgpu';
import {streetWeatherGLSL,streetWeatherWGSL} from '../dist/js/territory-street-weather.js';
import {streetMaterial,streetGeometry} from '../dist/js/territory-street-surfaces.js';
import {streetNodes} from '../dist/js/territory-node-urban-street.js';
import {urbanMaterialRecord} from '../dist/js/territory-urban-material-record.js';
import {realismUniforms} from '../dist/js/territory-realism.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function kernel(source,wgsl){
  let body=source.slice(source.indexOf('{')+1,source.lastIndexOf('}'));
  body=body.replace(/\b(float|bool)\s+(\w+)\s*=/g,'let $2=');
  body=body.replace(/return vec4f?\(([^;]+)\);/,'return [$1];');
  const evaluate=new Function('p','kind','mode','up','wet','distanceToEye','halfWidth','lateral','sin','abs','smoothstep','clamp','select',body);
  return (...args)=>evaluate(...args,Math.sin,Math.abs,smoothstep,clamp,(a,b,condition)=>condition?b:a);
}
const gl=kernel(streetWeatherGLSL),gpu=kernel(streetWeatherWGSL,true);
let cases=0,puddles=0;
for(const kind of [0,1,2,3,4,5,6,7])for(const mode of [0,1,2,3,4,5,7,8,9]){
  for(const wet of [0,.42,.82,1])for(const up of [0,.75,.98,.9999,1])for(const d of [6,160,400]){
    const p={x:1847.3+kind*17.1,z:0,y:-2431.7+mode*13.3};
    const a=gl(p,kind,mode,up,wet,d,4,3.6),b=gpu(p,kind,mode,up,wet,d,4,3.6);
    assert.deepEqual(a,b,'GLSL and WGSL finish equations agree');
    assert.ok(a.every(Number.isFinite));
    assert.ok(a[0]>=.942&&a[0]<=1.058);
    assert.ok(a[1]>=0&&a[1]<=1&&a[2]>=0&&a[2]<=a[1]);
    if(wet===0||up===0||![0,1,3,4].includes(kind)||mode===2){assert.equal(a[1],0);assert.equal(a[2],0);}
    if(up<=.992||mode===4||d>=360)assert.equal(a[2],0,'No water pooling on a slope, step or distant geometry');
    if(d>=360)assert.equal(a[0],1,'Distant mineral breakup is filtered out');
    const darken=1-a[1]*(kind===0?.29:.19)-a[2]*.055;
    assert.ok(darken>=.65&&darken<=1,'No negative color or excessive wet darkening');
    cases++;
  }
}
for(let x=0;x<80;x+=.7){const s=gl({x,y:8.13},0,9,1,.82,8,4,3.7);if(s[2]>.3)puddles++;}
assert.ok(puddles>5&&puddles<95,'Wet roads retain both pooled and unpooled areas');

const original=T.TextureLoader.prototype.load,previousMatch=globalThis.matchMedia;
globalThis.matchMedia=()=>({matches:false});
const maps=[];
T.TextureLoader.prototype.load=function(_url,onLoad){
  const map=new T.DataTexture(new Uint8Array([128,128,128,255]),1,1);maps.push(map);onLoad?.(map);return map;
};
try{
  const source=streetMaterial();
  const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};
  source.onBeforeCompile(shader);
  assert.strictEqual(shader.uniforms.streetWetness,realismUniforms.wetness,'Uniform identity survives scene/weather switches');
  assert.ok(shader.vertexShader.includes('vStreetUp=normalize(mat3(modelMatrix)*normal).y'));
  assert.equal((shader.fragmentShader.match(/vec4 streetWeather\(/g)||[]).length,1);
  assert.ok(shader.fragmentShader.indexOf('vec4 finish=')<shader.fragmentShader.indexOf('finish.w'));
  assert.ok(shader.fragmentShader.includes('#include <tonemapping_fragment>'));
  const nodes=streetNodes(source,urbanMaterialRecord(source));
  for(const output of [nodes.colorNode,nodes.normalNode,nodes.roughnessNode])assert.ok(output.isNode);
  const renderer=new G.WebGPURenderer({canvas:{width:16,height:16,style:{},addEventListener(){},setAttribute(){}}});
  const builder=renderer.backend.createNodeBuilder(null,renderer);builder.setShaderStage('fragment');
  const checked=new Set();
  nodes.colorNode.traverse(node=>{
    if(node.constructor.name!=='FunctionCallNode'||checked.has(node))return;
    checked.add(node);
    const parsed=builder.parser.parseFunction(node.functionNode.code);
    assert.equal(parsed.inputs.length,node.parameters.length,'Every WGSL argument is supplied');
    for(const [i,input] of parsed.inputs.entries()){
      if(input.type==='texture')assert.ok(node.parameters[i].isTextureNode);
      else assert.equal(node.parameters[i].getNodeType(builder),input.type,input.name+' retains its declared shader type');
    }
    for(const dependency of node.functionNode.includes){
      const fn=builder.parser.parseFunction(dependency.code);
      assert.ok(fn.name&&fn.type,'All WGSL helper signatures parse');
    }
  });
  assert.ok(checked.size>=1);
  const mesh=streetGeometry({roads:[{kind:'residential',width:8,car:true,sidewalk:'both',points:[[0,0],[25,0]]}],rail:[]},()=>0);
  const a=mesh.attributes;
  for(let i=0;i<a.position.count;i++)assert.ok(Number.isFinite(a.normal.getY(i)));
  assert.ok([...a.streetProfile.array].some(v=>v===3),'Existing sidewalk material profiles remain present');
  mesh.dispose();nodes.dispose();source.dispose();
}finally{
  T.TextureLoader.prototype.load=original;
  if(previousMatch===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=previousMatch;
  for(const map of maps)map.dispose();
}
console.log(`Street weather: ${cases} numeric parity cases; dry, slope, step, sand/rail exclusions; real GLSL assembly and TSL/WGSL argument contracts passed. GPU appearance remains unverified.`);
