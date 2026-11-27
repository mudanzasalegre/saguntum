// Narrow v55 contact repair for the three extant paths around the Daoiz post.
// Positions, widths, access tags and the natural terrain remain unchanged.
export const EAST_CONTEXT_PATH_IDS=new Set(['1419384280','1419384293','1419384294']);
export const EAST_CONTEXT_PATH_ANCHOR=[-.27487063,39.67690956];
export const EAST_CONTEXT_PATH_RADIUS=60;
export const EAST_CONTEXT_PATH_LIFT=.025;
export function eastContextPathWeight(road,x,z,anchor){
 const id=String(road.osm??road.osmId??road.id??road).replace(/^way\//,'').split(':')[0];
 if(!EAST_CONTEXT_PATH_IDS.has(id))return 0;
 const distance=Math.hypot(x-anchor.x,z-anchor.z),t=Math.max(0,Math.min(1,(EAST_CONTEXT_PATH_RADIUS-distance)/10));
 return t*t*(3-2*t);
}

// Preserve the source triangle in plan and its winding. Fine subdivisions use
// the actual rendered-ground sampler, blending only across the outer 10 m.
export function drapeEastContextTriangle(vertices,heightAt,weight,emit){
 const surface=p=>{const w=weight(p[0],p[2]),ground=heightAt(p[0],p[2])+EAST_CONTEXT_PATH_LIFT;return[p[0],p[1]+(ground-p[1])*w,p[2]];};
 function face(a,b,c,depth=0){
  const lengths=[Math.hypot(a[0]-b[0],a[2]-b[2]),Math.hypot(b[0]-c[0],b[2]-c[2]),Math.hypot(c[0]-a[0],c[2]-a[2])];
  const longest=Math.max(...lengths),mid=(p,q)=>p.map((v,i)=>(v+q[i])*.5),corners=[a,b,c].map(surface);
  const residual=Math.max(...[[0,1],[1,2],[2,0]].map(([i,j])=>Math.abs(surface(mid([a,b,c][i],[a,b,c][j]))[1]-(corners[i][1]+corners[j][1])*.5)),
   Math.abs(surface(a.map((v,i)=>(v+b[i]+c[i])/3))[1]-(corners[0][1]+corners[1][1]+corners[2][1])/3));
  // The final Atlas terrain can bend sharply across a grid diagonal. Refine
  // only those creases until centre/edge error is below 1.8 cm.
  if(depth<20&&(longest>.45||residual>.018)){
   if(longest===lengths[0]){const m=mid(a,b);face(a,m,c,depth+1);face(m,b,c,depth+1);}
   else if(longest===lengths[1]){const m=mid(b,c);face(a,b,m,depth+1);face(a,m,c,depth+1);}
   else{const m=mid(c,a);face(a,b,m,depth+1);face(m,b,c,depth+1);}return;
  }
  emit(...corners);
 }
 face(...vertices);
}
