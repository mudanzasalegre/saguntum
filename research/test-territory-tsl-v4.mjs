// Run with: node --experimental-loader ./research/validate_loader.mjs research/test-territory-tsl-v4.mjs
// Builds the real Three.js r180 node graphs. No browser/GPU is used here.
import assert from 'node:assert/strict';
import * as G from 'three/webgpu';
import {labMaterials} from '../dist/js/territory-webgpu-materials.js';
import {createNativeCoast,projectedShorelines} from '../dist/js/territory-webgpu-coast.js';
const original=G.TextureLoader.prototype.loadAsync;
G.TextureLoader.prototype.loadAsync=async()=>{
 const map=new G.DataTexture(new Uint8Array([127,128,200,255]),1,1,G.RGBAFormat);map.needsUpdate=true;return map;
};
try{
 assert.equal(G.REVISION,'180');
 const material=await labMaterials(false);
 assert.equal(material.warnings.length,0);
 for(const n of [material.building.colorNode,material.building.roughnessNode,material.building.emissiveNode,material.street.colorNode,material.street.roughnessNode])assert.equal(n.isNode,true);
 material.dispose();
 const project=(lon,lat)=>({x:lon*100000,z:-lat*100000});
 const lines=projectedShorelines([[[0,0],[0,20]]],project);
 assert.ok(lines[0].every(p=>Number.isFinite(p.lon)&&Number.isFinite(p.lat)));
 const mask={polygons:[{minX:0,maxX:20,minZ:0,maxZ:20,outer:[{x:0,z:0},{x:20,z:0},{x:20,z:20},{x:0,z:20}],holes:[]}],isWater:()=>true};
 const coast=createNativeCoast({mask,shorelines:[[[0,0],[0,20]]],project,compact:true});
 assert.equal(coast.water.material.colorNode.isNode,true);
 assert.ok(coast.water.geometry.attributes.position.count>0);
 assert.equal(coast.stats.reflection,'TSL ReflectorNode');
 coast.setLight(true);coast.setLight(false);coast.dispose();
 console.log('OK: real r180 TSL material construction, not shader compilation');
}finally{G.TextureLoader.prototype.loadAsync=original;}
