// Actual Atlas city surfaces and actual Simulator network geometry on their
// rendered-ground samplers. Scope: three OSM paths within 60 m of the post.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {root,THREE,buildCastleScene,project as atlasProject} from './castle-scene.mjs';
import {EAST_CONTEXT_PATH_IDS,EAST_CONTEXT_PATH_ANCHOR,eastContextPathWeight} from '../../dist/js/castle-east-paths.js';
const [{streetGeometry},{loadElevation,makeSampler},{project}]=await Promise.all([
 import('../../dist/js/territory-street-surfaces.js'),import('../../dist/js/territory-ground.js'),import('../../dist/js/territory-coordinates.js')]);
const atlas=await buildCastleScene({context:true});
const ctx=atlas.city.roads.children.find(m=>m.userData.component==='east-context-paths');
if(!ctx)throw new Error('The actual Atlas city does not contain the corrected path batch');
const oldFetch=globalThis.fetch;
globalThis.fetch=async input=>{
 const file=fileURLToPath(new URL(String(input),new URL('../../dist/',import.meta.url)));
 if(!file.startsWith(path.join(root,'dist/assets/')))throw new Error('Only repository terrain assets are allowed');
 return new Response(fs.readFileSync(file));
};
let grids;
try{grids=await loadElevation(JSON.parse(fs.readFileSync(root+'dist/assets/territory/world.json','utf8')).terrain);}
finally{globalThis.fetch=oldFetch;}
const nativeHeight=makeSampler(grids),tile=JSON.parse(fs.readFileSync(root+'dist/assets/network/3_-1.json','utf8'));
const roads=tile.roads.filter(r=>EAST_CONTEXT_PATH_IDS.has(String(r.osm))),nativeGeometry=streetGeometry({roads,rail:[]},nativeHeight);
function measure(name,geometry,sampler,anchor){
 const positions=geometry.attributes.position,index=geometry.index,results={name,triangles:0,samples:0,maxAboveM:-Infinity,maxBelowM:Infinity,maxContactErrorM:0,worst:null};
 const vertex=i=>[positions.getX(i),positions.getY(i),positions.getZ(i)];
 for(let i=0;i<index.count;i+=3){
  const pts=[vertex(index.getX(i)),vertex(index.getX(i+1)),vertex(index.getX(i+2))];
  if(pts.some(p=>Math.hypot(p[0]-anchor.x,p[2]-anchor.z)>49.5))continue;
  results.triangles++;
  for(const weights of [[1/3,1/3,1/3],[.5,.5,0],[0,.5,.5],[.5,0,.5]]){
   const p=[0,1,2].map(j=>pts.reduce((s,q,k)=>s+q[j]*weights[k],0)),above=p[1]-sampler(p[0],p[2]),error=Math.abs(above-.025);
   results.samples++;results.maxAboveM=Math.max(results.maxAboveM,above);results.maxBelowM=Math.min(results.maxBelowM,above);
   if(error>results.maxContactErrorM){results.maxContactErrorM=error;results.worst={x:p[0],z:p[2],y:p[1],ground:sampler(p[0],p[2]),above};}
  }
 }
 results.pass=results.samples>500&&results.maxContactErrorM<.10;
 return results;
}
const observations=[measure('Atlas actual city mesh',ctx.geometry,atlas.terrain.meshHeightAt,atlasProject(...EAST_CONTEXT_PATH_ANCHOR)),
 measure('Simulator actual streetGeometry / production terrain grids',nativeGeometry,nativeHeight,project(...EAST_CONTEXT_PATH_ANCHOR))];
const excludedIds=['180732342','733215256','733215257'],anchor=atlasProject(...EAST_CONTEXT_PATH_ANCHOR);
const scope={sourceIds:[...EAST_CONTEXT_PATH_IDS],radiusM:60,fullyConformingRadiusM:50,
 onlyTheseAtlasIds:ctx.userData.sourceIds.length===3&&ctx.userData.sourceIds.every(id=>EAST_CONTEXT_PATH_IDS.has(id)),
 interiorRoutesUnchanged:excludedIds.every(id=>eastContextPathWeight({id},anchor.x,anchor.z,anchor)===0),
 outsideRadiusUnchanged:[...EAST_CONTEXT_PATH_IDS].every(id=>eastContextPathWeight({id},anchor.x+60.01,anchor.z,anchor)===0),
 nativeMappedSegments:roads.length,nativeAccessTagsPreserved:roads.every(r=>r.car===false),
 terrainFilesModified:false};
const files=['dist/js/city.js','dist/js/territory-street-surfaces.js','dist/js/castle-east-paths.js','dist/assets/network/3_-1.json','dist/assets/data/cartography.json','dist/assets/data/elevation.json'];
const hashes=Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync(root+f)).digest('hex')]));
const report={pass:observations.every(o=>o.pass)&&scope.onlyTheseAtlasIds&&scope.interiorRoutesUnchanged&&scope.outsideRadiusUnchanged,
 method:'Indexed triangles from createCity and streetGeometry; centre and edge rays/probes against final Atlas terrain and loaded production Simulator grids',observations,scope,sourceHashes:hashes,
 limitations:['CPU mesh contact check, not WebGL.','The existing access tags are preserved; this change does not designate a new public walking itinerary.']};
fs.writeFileSync(root+'research/validation-v55/exterior-paths-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
