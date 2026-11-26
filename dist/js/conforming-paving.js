import * as THREE from 'three';

// A shared piecewise-linear height field makes clipped paving faces meet even
// when a source contour introduces a T-junction. The 0.5 m grid divides Atlas'
// 2.5 m terrain cells, with the same (x0,z0) to (x1,z1) diagonal. Heights
// belong to grid vertices, never to independently lifted output triangles.
export function createPavingTessellator(ground,{step=.5,offset=.105}={}){
 const heights=new Map(),epsilon=1e-10,stats={triangles:0,gridVertices:0};
 const height=(i,j)=>{const key=i+','+j;if(!heights.has(key)){heights.set(key,ground(i*step,j*step)+offset);stats.gridVertices++;}return heights.get(key);};
 const area=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 function clip(poly,a,b){
  const side=p=>-area(a,b,p),out=[];
  for(let i=0;i<poly.length;i++){
   const p=poly[i],q=poly[(i+1)%poly.length],dp=side(p),dq=side(q),insideP=dp>=-epsilon,insideQ=dq>=-epsilon;
   if(insideP)out.push(p);
   if(insideP!==insideQ){const t=dp/(dp-dq);out.push({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t});}
  }
  return out.filter((p,i)=>!i||Math.hypot(p.x-out[i-1].x,p.z-out[i-1].z)>1e-8);
 }
 function triangulate(outline,holes=[],emit){
  const points=[outline,...holes].flat(),indices=THREE.ShapeUtils.triangulateShape(outline.map(p=>new THREE.Vector2(p.x,-p.z)),holes.map(r=>r.map(p=>new THREE.Vector2(p.x,-p.z))));
  for(const ix of indices){
   const source=ix.map(i=>points[i]),minX=Math.min(...source.map(p=>p.x)),maxX=Math.max(...source.map(p=>p.x)),minZ=Math.min(...source.map(p=>p.z)),maxZ=Math.max(...source.map(p=>p.z));
   for(let j=Math.floor(minZ/step);j<=Math.floor((maxZ-epsilon)/step);j++)for(let i=Math.floor(minX/step);i<=Math.floor((maxX-epsilon)/step);i++){
    const x=i*step,z=j*step,a={x,z},b={x,z:z+step},c={x:x+step,z:z+step},d={x:x+step,z};
    for(const [half,cell]of [[0,[a,b,c]],[1,[a,c,d]]]){
     let polygon=source;for(let edge=0;edge<3&&polygon.length>=3;edge++)polygon=clip(polygon,cell[edge],cell[(edge+1)%3]);
     if(polygon.length<3)continue;
     const ya=height(i,j),yb=height(i,j+1),yc=height(i+1,j+1),yd=height(i+1,j);
     const vertex=p=>{const u=(p.x-x)/step,v=(p.z-z)/step,y=half===0?ya+(yc-yb)*u+(yb-ya)*v:ya+(yd-ya)*u+(yc-yd)*v;return[p.x,y,p.z];};
     for(let n=1;n<polygon.length-1;n++)if(Math.abs(area(polygon[0],polygon[n],polygon[n+1]))>1e-9){emit(vertex(polygon[0]),vertex(polygon[n]),vertex(polygon[n+1]));stats.triangles++;}
    }
   }
  }
 }
 return {triangulate,stats};
}
