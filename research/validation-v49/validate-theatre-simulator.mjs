// Exercise the real simulator constructor in CPU, with local document reads.
// This verifies geometry registration and environment masks; it is not a GPU test.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {root,data,THREE,buildTheatreScene} from './theatre-scene.mjs';
const atlas=await buildTheatreScene();
const [{buildHeritageModel,releaseModel},{registerFrame},{project}]=await Promise.all([
 import('../../dist/js/territory-heritage-models.js'),import('../../dist/js/territory-heritage-catalog.js'),
 import('../../dist/js/territory-coordinates.js')]);
const [lon,lat]=atlas.theatre.userData.layout.center;
const place={id:'theatre',name:'Teatro Romano',lon,lat,...project(lon,lat)};
const frame=registerFrame(place,project),det=frame.a*frame.d-frame.b*frame.c;
const inverse=(x,z)=>({x:((x-frame.tx)*frame.d-(z-frame.tz)*frame.b)/det,
 z:(frame.a*(z-frame.tz)-frame.c*(x-frame.tx))/det});
const shift=7.25;
const heightAt=(x,z)=>{const p=inverse(x,z);return atlas.heightAt(p.x,p.z)+shift;};
const oldFetch=globalThis.fetch,oldDocument=globalThis.document;
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
globalThis.fetch=async input=>{
 const url=new URL(String(input)),file=fileURLToPath(url);
 assert(file.startsWith(path.join(root,'dist/assets/')),'Simulator test reads only repository assets');
 return new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}});
};
let model;
try{
 model=await buildHeritageModel('theatre',{places:[place],records:{theatre:{id:'theatre',coordinate:[lon,lat]}},
  area:data('historic-context'),heightAt,project,needed:()=>true});
}finally{
 globalThis.fetch=oldFetch;
 if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
}
assert(model,'The real simulator builder returns the theatre');
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const atlasMeshes=new Map();
atlas.theatre.traverse(o=>{if(o.isMesh&&!o.userData.component?.startsWith('entorno-'))atlasMeshes.set(o.name,o);});
let matched=0,maxRegistrationError=0;
model.group.updateMatrixWorld(true);
model.group.traverse(o=>{
 if(!o.isMesh||o.userData.component?.startsWith('entorno-'))return;
 const original=atlasMeshes.get(o.name);assert(original,'Simulator mesh exists in the Atlas: '+o.name);
 for(const name of ['position','normal','uv','color'])assert.equal(hash(o.geometry.attributes[name].array),hash(original.geometry.attributes[name].array),'Same '+name+' buffer: '+o.name);
 const local=new THREE.Vector3().fromBufferAttribute(o.geometry.attributes.position,0);
 const a=local.clone().applyMatrix4(original.matrixWorld),actual=local.clone().applyMatrix4(o.matrixWorld),p=frame.world(a.x,a.z);
 const error=actual.distanceTo(new THREE.Vector3(p.x,a.y+shift,p.z));
 assert(error<1e-5,'Metric/vertical simulator registration: '+o.name);maxRegistrationError=Math.max(error,maxRegistrationError);matched++;
});
assert.equal(matched,atlasMeshes.size,'Every architectural mesh is present in the Simulator');
assert(model.relief.delta.some(value=>value<-.5),'The Simulator excavates terrain below the theatre shell');
assert(model.pavement?.coverage>0,'New approach paths have a ground/road mask in the Simulator');
assert(model.claims.some(claim=>claim.green?.length>0),'New planting masks duplicate generic vegetation');
assert(model.walkBarriers?.length>0,'The Simulator has collision sections for the theatre');
let environmentMeshes=0;model.group.traverse(o=>{if(o.isMesh&&o.userData.component?.startsWith('entorno-'))environmentMeshes++;});
assert(environmentMeshes>0,'The same environment is present in the Simulator');
const report={pass:true,method:'Actual buildHeritageModel(theatre), local source assets, CPU geometry comparison',
 architecturalMeshes:matched,environmentMeshes,maxRegistrationErrorM:maxRegistrationError,verticalTestShiftM:shift,
 pavementCoverageCells:model.pavement.coverage,vegetationMaskCount:model.claims.reduce((n,c)=>n+(c.green?.length||0),0),
 collisionValues:model.walkBarriers.length,reliefMinimumM:Math.min(...model.relief.delta),limitations:['No WebGL/WebGPU rendering performed by this CPU check.']};
fs.writeFileSync(path.join(root,'research/validation-v49/theatre-simulator-qa.json'),JSON.stringify(report,null,2)+'\n');
releaseModel(model.group);
console.log(JSON.stringify(report,null,2));
