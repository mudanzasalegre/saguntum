// The coarse IGN height grid folds the excavated north-west edge into the
// forum's central platform. Accommodate only that mapped open rectangle.
// Its level is anchored to the higher surviving south/east edge, not claimed
// as a surveyed archaeological altitude. Temple and basilica pits are outside.
import {polygonDistance} from './urban-surface.js';

export const castleForumCoordinates=[
 [-.276737,39.676246],[-.276350,39.676304],
 [-.276270,39.675924],[-.276657,39.675867]
];

export function createCastleGround({project,heightAt}){
 const polygon=castleForumCoordinates.map(c=>project(...c));
 const anchors=polygon.slice(1).map(p=>heightAt(p.x,p.z)).sort((a,b)=>a-b);
 const level=Math.round(anchors[1]*2)/2,margin=4;
 const center=polygon.reduce((sum,p)=>({x:sum.x+p.x/4,z:sum.z+p.z/4}),{x:0,z:0});
 // A streamed region can already supply this final terrace. Preserve that
 // rendered sampler, including its triangulated shoulders, instead of grading
 // it again. Interior probes avoid mistaking a naturally flat single pixel.
 const pregraded=polygon.every(p=>Math.abs(heightAt(center.x+(p.x-center.x)*.6,center.z+(p.z-center.z)*.6)-level)<.035);
 const bounds={minX:Math.min(...polygon.map(p=>p.x))-margin,maxX:Math.max(...polygon.map(p=>p.x))+margin,
  minZ:Math.min(...polygon.map(p=>p.z))-margin,maxZ:Math.max(...polygon.map(p=>p.z))+margin};
 function surfaceHeight(x,z,raw=heightAt(x,z)){
  if(pregraded)return raw;
  if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return raw;
  const distance=polygonDistance(x,z,polygon);
  if(distance>=margin)return raw;
  // Restrict only a narrow excavation shoulder. Clamping is idempotent, unlike
  // adding a height delta or repeatedly blending a ground already graded.
  const allowance=distance*3;
  return Math.max(level-allowance,Math.min(level+allowance,raw));
 }
 return {polygon,bounds,level,margin,pregraded,surfaceHeight,
  sample:(x,z)=>surfaceHeight(x,z,heightAt(x,z)),
  method:'Local forum terrace; level estimated from the south/east IGN edge; excavations outside the footprint retained'};
}
