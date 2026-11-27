import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
const [T,{sectionWindow},{territorialWindow},{conservationGround},{groundNodeMaterial},{excavationTriangles,triangleCut}]=await Promise.all([
 import('three/webgpu'),import('../../dist/js/territory-heritage-section.js'),import('../../dist/js/territory-heritage-relief.js'),
 import('../../dist/js/territory-heritage-ground.js'),import('../../dist/js/territory-node-ground.js'),import('../../dist/js/polygon-excavation.js')]);
const data=id=>JSON.parse(fs.readFileSync(new URL('../../dist/assets/data/'+id+'.json',import.meta.url)));
const project=([lon,lat])=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const outline=data('circo-plan').historicalOutline.map(project),xs=outline.map(p=>p.x),zs=outline.map(p=>p.z);
const l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...zs),b=Math.max(...zs),identity={world:(x,z)=>({x,z})};
const packed=territorialWindow({outline,center:{x:(l+r)/2,z:(t+b)/2},width:r-l,depth:b-t},identity);
assert.equal(packed.triangles.length,49);
const forum=data('forum-plaza-context').coreOutline.map(project),other=excavationTriangles({outline:forum}).map(t=>triangleCut(t));
assert.equal(other.length,10);
const window=sectionWindow();window.set(packed);
const material=new T.MeshStandardMaterial(),group=new T.Group();
const ground=conservationGround({group,material,heightAt:()=>45,bounds:[-1000,-1000,1000,1000]});
ground.setSource({relief:[{cuts:[],triangleCuts:packed.triangles},{cuts:[],triangleCuts:other}]});
assert.equal(packed.triangles.length+other.length,59);
const centre={x:xs.reduce((s,x)=>s+x,0)/xs.length,z:zs.reduce((s,z)=>s+z,0)/zs.length};
assert(window.contains(centre.x,centre.z));assert(!window.contains(l-10,t-10));
assert.equal(ground.canStand(centre.x,centre.z),false);assert.equal(ground.canStand(centre.x,centre.z,true),true);
// Both render backends consume the same polygon, with the rectangle branch
// retained for existing visits. Compile real r180 nodes to WGSL on the CPU.
const renderer=new T.WebGPURenderer({canvas:{width:100,height:100,addEventListener(){},removeEventListener(){},setAttribute(){}}});
const source=new T.MeshStandardMaterial();window.material(source);
const shader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <clipping_planes_fragment>'};source.onBeforeCompile(shader,renderer);
assert.equal(shader.uniforms.visitTriangleCount.value,49);assert.match(shader.fragmentShader,/visitTriangleCount>0/);
const context=new T.Group(),casting=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());casting.castShadow=true;context.add(casting);
const modelGroup=new T.Group();modelGroup.add(context);window.model({group:modelGroup,contextGroup:context});
assert(casting.customDepthMaterial?.isMeshDepthMaterial,'Hidden contemporary meshes also suppress their WebGL shadows');
const shadowShader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <clipping_planes_fragment>'};casting.customDepthMaterial.onBeforeCompile(shadowShader,renderer);
assert.equal(shadowShader.uniforms.visitTriangleCount.value,49);assert.match(shadowShader.fragmentShader,/discard/);
const mesh=new T.Mesh(new T.PlaneGeometry(10,10),source);mesh.material=groundNodeMaterial(source,mesh,new T.MeshBasicNodeMaterial(),renderer);
const builder=renderer.backend.createNodeBuilder(mesh,renderer);
builder.scene=new T.Scene();builder.material=mesh.material;builder.camera=new T.PerspectiveCamera();builder.context.material=mesh.material;builder.build();
assert.match(builder.fragmentShader,/for \( var i : i32 = 0; i < i32\( object\./);assert.match(builder.fragmentShader,/discard;/);
window.set([0,0,1/5,0,0,1/3]);assert(window.contains(4,2));assert(!window.contains(6,2));
const line=new Float32Array([-10,0,0,10,0,0]);assert.deepEqual([...window.clipBarriers(line)],[-10,0,0,-5,0,0,5,0,0,10,0,0]);
window.set(null);assert.equal(window.clipBarriers(line),line);assert(!window.contains(0,0));
console.log('Circo section passed: 49+10 polygon triangles, public-floor guard, exact collision subtraction/restoration, legacy rectangle, GLSL uniforms and real r180 TSL→WGSL compilation (CPU only).');
