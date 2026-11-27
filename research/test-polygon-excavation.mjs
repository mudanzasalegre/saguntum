import assert from 'node:assert/strict';
import {registerThreeTestLoader} from './three-test-loader.mjs';
registerThreeTestLoader();
const [THREE,{openPermanentExcavations,insideExcavation},{excavationTriangles,triangleCut,insideTriangleCut},{conservationGround}]=await Promise.all([
 import('three'),import('../dist/js/excavation.js'),import('../dist/js/polygon-excavation.js'),import('../dist/js/territory-heritage-ground.js')
]);

// A concave park with a narrow, sloping west edge and an occupied notch.
// The original mesh deliberately uses just two triangles spanning the pit.
const outline=[[-4,-4],[3,-4],[3,-1],[0,-1],[0,4],[-3,4]].map(([x,z])=>({x,z}));
const area=ring=>Math.abs(ring.reduce((sum,a,i)=>{const b=ring[(i+1)%ring.length];return sum+a.x*b.z-b.x*a.z;},0))/2;
function scene(){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-10,2,-10,-10,2,10,10,2,10,10,2,-10],3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,1,1,0],2));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,0,1,0],3));
 geometry.setIndex([0,1,2,0,2,3]);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 const root=new THREE.Group();root.position.set(19,0,-13);root.rotation.y=.37;root.add(mesh);root.updateMatrixWorld(true);
 const world=p=>{const v=new THREE.Vector3(p.x,0,p.z).applyMatrix4(mesh.matrixWorld);return{x:v.x,z:v.z};};
 return {root,mesh,world};
}
function retainedArea(mesh){
 const p=mesh.geometry.attributes.position,index=mesh.geometry.index;let total=0;
 for(let i=0;i<index.count;i+=3)total+=area([0,1,2].map(j=>({x:p.getX(index.getX(i+j)),z:p.getZ(index.getX(i+j))})));
 return total;
}
for(const reverse of [false,true]){
 const {root,mesh,world}=scene(),ring=(reverse?[...outline].reverse():outline).map(world),window={outline:[...ring,ring[0]],permanent:true};
 const triangles=excavationTriangles(window),packed=triangles.map(t=>triangleCut(t));
 assert.equal(triangles.length,outline.length-2);
 assert(Math.abs(triangles.reduce((sum,t)=>sum+area(t),0)-area(outline))<1e-9,'Triangulation preserves concave footprint area');
 const before=mesh.geometry,stats=openPermanentExcavations([root],[window]);
 assert.notEqual(mesh.geometry,before,'One-time subtraction produces independent geometry');
 assert(stats.removedTriangles>0);
 assert(Math.abs(retainedArea(mesh)-(400-area(outline)))<1e-5,'Exact removed area matches the irregular polygon');
 const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,n=mesh.geometry.attributes.normal;
 for(let i=0;i<p.count;i++){
  assert(Math.abs(uv.getX(i)-(p.getX(i)+10)/20)<2e-6,'Clipped vertices preserve orthophoto U');
  assert(Math.abs(uv.getY(i)-(p.getZ(i)+10)/20)<2e-6,'Clipped vertices preserve orthophoto V');
  assert.equal(n.getY(i),1);
 }
 const ray=new THREE.Raycaster();root.updateMatrixWorld(true);
 for(const [x,z,inPit]of[[-2,1,true],[1,-2,true],[1,2,false],[-5,0,false],[4,0,false]]){
  const q=world({x,z});
  assert.equal(insideExcavation(window,q.x,q.z),inPit,'CPU mask preserves the occupied notch');
  assert.equal(packed.some(t=>insideTriangleCut(t,q.x,q.z)),inPit,'Simulator triangles match the Atlas polygon');
  ray.set(new THREE.Vector3(q.x,20,q.z),new THREE.Vector3(0,-1,0));
  assert.equal(ray.intersectObject(mesh).length===0,inPit,'Rendered triangles and mask agree');
 }
}
// The pre-existing rectangle path retains its footprint and orientation.
{
 const {root,mesh}=scene(),window={center:{x:19,z:-13},width:6,depth:4,yaw:.37};
 openPermanentExcavations([root],[window]);
 assert(Math.abs(retainedArea(mesh)-376)<1e-5);
}
// A lower public park deck supports walking; an unmodelled hole does not.
// Rectangular archaeological sections keep their original blocked behaviour.
{
 const group=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 const ground=conservationGround({group,material,heightAt:()=>8,bounds:[-20,-20,20,20]});
 const source={relief:[{cuts:[[12,12,.5,0,0,.5]],triangleCuts:excavationTriangles({outline}).map(t=>triangleCut(t))}]};
 ground.setSource(source);
 assert.equal(ground.canStand(-2,1),false);
 assert.equal(ground.canStand(-2,1,true),true);
 assert.equal(ground.canStand(1,2),true);
 assert.equal(ground.canStand(12,12,true),false);
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <clipping_planes_fragment>'};
 material.onBeforeCompile(shader,{});
 assert.equal(shader.uniforms.uExcTriangleCount.value,outline.length-2);
 assert.equal(shader.uniforms.uExcCount.value,1);
 source.relief=[];ground.update();
 assert.equal(ground.canStand(-2,1),true);
 assert.equal(shader.uniforms.uExcTriangleCount.value,0,'Evicted park clears its shader mask');
}
// Build the actual WebGPU node graph into WGSL, without claiming a GPU draw.
// This catches unsupported TSL loop/index operations in the shipped r180 build.
{
 const [T,{groundNodeMaterial}]=await Promise.all([import('three/webgpu'),import('../dist/js/territory-node-ground.js')]);
 const renderer=new T.WebGPURenderer({canvas:{width:100,height:100,addEventListener(){},removeEventListener(){},setAttribute(){}}});
 const source=new T.MeshStandardMaterial(),group=new T.Group();
 const ground=conservationGround({group,material:source,heightAt:()=>0,bounds:[-10,-10,10,10]});
 ground.setSource({relief:[{cuts:[],triangleCuts:[[0,0,1,0,0,1]]}]});
 const mesh=new T.Mesh(new T.PlaneGeometry(10,10),source);
 mesh.material=groundNodeMaterial(source,mesh,new T.MeshBasicNodeMaterial(),renderer);
 const builder=renderer.backend.createNodeBuilder(mesh,renderer);
 builder.scene=new T.Scene();builder.material=mesh.material;builder.camera=new T.PerspectiveCamera();builder.context.material=mesh.material;
 builder.build();
 assert.match(builder.fragmentShader,/for \( var i : i32 = 0; i < i32\( object\./,'Active triangle count controls the WGSL loop');
 assert.match(builder.fragmentShader,/discard;/);
 mesh.geometry.dispose();mesh.material.dispose();source.dispose();
}
console.log('Polygon excavation passed: exact concave area, preserved occupied notch, both windings, transformed mesh, UV interpolation, rectangle regression, Simulator walking, mask eviction, and real r180 TSL-to-WGSL generation (CPU only).');
