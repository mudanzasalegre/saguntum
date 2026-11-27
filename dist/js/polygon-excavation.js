import {ShapeUtils,Vector2} from 'three';

// Permanent open sites can follow a concave surveyed/OSM boundary. Keep this
// separate from the rectangular section windows used by the older visits.
export function excavationOutline(cut){
 const ring=(cut?.outline||[]).map(p=>({x:p.x??p[0],z:p.z??p[1]}));
 if(ring.length>1&&ring[0].x===ring.at(-1).x&&ring[0].z===ring.at(-1).z)ring.pop();
 return ring.length>=3&&ring.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z))?ring:[];
}

export function excavationTriangles(cut){
 const ring=excavationOutline(cut);
 if(!ring.length)return [];
 return ShapeUtils.triangulateShape(ring.map(p=>new Vector2(p.x,p.z)),[])
  .map(face=>face.map(i=>ring[i]));
}

// Inverse basis for a triangle, packed like the existing rectangle cuts.
// The point is inside when its barycentric u and v are both non-negative
// and their sum is at most one. This works with either polygon winding.
export function triangleCut(triangle,project=p=>p){
 const [p,u,v]=triangle.map(project),ux=u.x-p.x,uz=u.z-p.z,vx=v.x-p.x,vz=v.z-p.z,det=ux*vz-uz*vx;
 if(Math.abs(det)<1e-10)return null;
 return [p.x,p.z,vz/det,-vx/det,-uz/det,ux/det];
}

export function insideTriangleCut(cut,x,z,epsilon=1e-7){
 const [cx,cz,a,b,c,d]=cut,dx=x-cx,dz=z-cz,u=dx*a+dz*b,v=dx*c+dz*d;
 return u>=-epsilon&&v>=-epsilon&&u+v<=1+epsilon;
}
