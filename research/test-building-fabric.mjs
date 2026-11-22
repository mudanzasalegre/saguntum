import assert from 'node:assert/strict';
import {recessedBay} from '../dist/js/territory-building-openings.js';
import {roofFabric} from '../dist/js/territory-building-roof.js';

// Terrain slopes along the frontage; the eave also rises towards the ridge.
const faces=[];
const apertures=recessedBay({bay:0,family:0,portal:true,seed:8,left:0,right:1,groundLeft:3.8,groundRight:4.4,
  floor:4.1,storey:3.1,topLeft:14.1,topRight:14.9,quad:(q,reveal)=>faces.push({q,reveal})});
assert.equal(apertures,3);
const back=faces.filter(({q,reveal})=>!reveal&&q.every(p=>p[2]>0));
assert.equal(back.length,apertures);
assert(Math.abs(back[0].q[0][2]-.27)<.001);
assert.equal(faces.filter(f=>f.reveal).length,4*apertures);
for(const {q} of faces)for(const [x,y,inset=0] of q){
  assert(x>=0&&x<=1);assert(y>=3.8-1.2-.001&&y<=14.9);assert(inset>=0&&inset<=.27);
}
const rings=[[[0,0],[28,0],[28,10],[20,10],[20,18],[0,18]],[[4,4],[4,9],[10,9],[10,4]]];
let horizontalArea=0,triangleCount=0;
const roof=roofFabric({rings,profile:[1,0,0,.22],roof:15,height:11,groundHigh:4,style:{family:1},lid:{r:.5,g:.6},x:14,z:9,
  face:(p,h)=>{
    p.forEach(([x,z],i)=>{assert(h[i]<=15+.001&&h[i]>=4.5);assert(Math.abs(h[i]-(15-Math.abs(x-14)*.22))<.001);});
    for(let j=1;j<p.length-1;j++){
      const [a,b,c]=[p[0],p[j],p[j+1]],area=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*.5;
      assert(area>0);horizontalArea+=area;triangleCount++;
    }
  }});
assert(Math.abs(horizontalArea-(28*10+20*8-6*5))<.001);
assert.equal(roof.at([14,10]),15);
console.log(JSON.stringify({apertures,realReveals:faces.filter(f=>f.reveal).length,retainedFootprintAreaM2:horizontalArea,trianglesAroundCourtyard:triangleCount}));
