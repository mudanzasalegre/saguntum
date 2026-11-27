// Local display levels for Plaça del Fòrum, Huertos / Ordóñez / Remei.
// The published −2.50 m depth is relative to the street, not an absolute survey.
import {FORUM_PLAZA_SURFACES as spec} from './forum-plaza-surfaces.js';

const inside=(x,z,p)=>{let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
 const a=p[i],c=p[j];if((a[1]>z)!==(c[1]>z)&&x<(c[0]-a[0])*(z-a[1])/(c[1]-a[1])+a[0])b=!b;
}return b;};
const inSurface=(u,v,s)=>inside(u,v,s.outline)&&!s.holes.some(h=>inside(u,v,h));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function createForumPlazaGround({project,heightAt,contextData={}}){
 const origin=project(...spec.origin),yaw=spec.yaw,c=Math.cos(yaw),s=Math.sin(yaw);
 const world=(u,v)=>({x:origin.x+u*c+v*s,z:origin.z-u*s+v*c});
 const local=(x,z)=>[(x-origin.x)*c-(z-origin.z)*s,(x-origin.x)*s+(z-origin.z)*c];
 // Every anchor is OUTSIDE the excavated parcel. Reusing a final Atlas ground
 // sampler therefore cannot subtract the excavation depth for a second time.
 const anchors=[[7,-3],[22,-3],[39,-3]].map(p=>world(...p));
 const samples=anchors.map(p=>heightAt(p.x,p.z)).filter(Number.isFinite).sort((a,b)=>a-b);
 const streetY=samples.length?samples[Math.floor(samples.length/2)]:24,baseY=streetY-2.5;
 const outline=spec.core.map(p=>world(...p));
 const gallery={outline:[[-2.4,17.4],[6.55,17.95],[7.7,19.3],[7.7,21.6],[6.3,21.6],[6.3,19.8],[5.85,19],[-2.6,18.5]],level:0};
 const routes=spec.routes.map(row=>{let length=0;const segments=[];
  for(let i=1;i<row.points.length;i++){const a=row.points[i-1],b=row.points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);segments.push({a,b,d,start:length});length+=d;}
  return {...row,length,segments,stepCount:row.stairs?Math.ceil(Math.abs(row.end-row.start)/.162):0};
 });
 function routeSample(u,v,r){let best=null;
  for(const seg of r.segments){const dx=seg.b[0]-seg.a[0],dz=seg.b[1]-seg.a[1],t=clamp(((u-seg.a[0])*dx+(v-seg.a[1])*dz)/(seg.d*seg.d),0,1),
   distance=Math.hypot(u-seg.a[0]-dx*t,v-seg.a[1]-dz*t),fraction=(seg.start+seg.d*t)/r.length;
   if(!best||distance<best.distance)best={distance,fraction};}
  if(!best||best.distance>r.width/2+.035)return null;
  let t=best.fraction;
  if(r.stairs)t=clamp(Math.floor(t*r.stepCount+.00001)/r.stepCount,0,1);
  return streetY+r.start+(r.end-r.start)*t;
 }
 function displayLevel(u,v,walkingOnly=false){
  if(walkingOnly&&inside(u,v,gallery.outline))return streetY+gallery.level;
  for(const r of routes){const y=routeSample(u,v,r);if(y!==null)return y;}
  for(const surf of spec.surfaces)if((!walkingOnly||surf.publicWalkingSurface)&&inSurface(u,v,surf))return streetY+surf.level;
  return walkingOnly?null:baseY;
 }
 const contains=(x,z)=>{const p=local(x,z);return inside(p[0],p[1],spec.core);};
 const surfaceHeight=(x,z,raw=heightAt(x,z))=>contains(x,z)?displayLevel(...local(x,z)):raw;
 // The coarse terrain grid must meet the surrounding street before the
 // exact polygon is removed. Feeding the −2.50 m floors into that grid would
 // pull adjacent street triangles down by up to 2 m. This temporary cap is
 // entirely removed by the permanent excavation; the visible floors and
 // walking decks remain the independently authored surfaces above.
 const terrainHeight=(x,z,raw=heightAt(x,z))=>contains(x,z)?streetY:raw;
 const sampleWalkingHeight=(x,z)=>contains(x,z)?displayLevel(...local(x,z),true):null;
 return {spec,origin,yaw,world,local,outline,streetY,baseY,routes,routeSample,gallery,
  contains,surfaceHeight,terrainHeight,sampleWalkingHeight,sample:(x,z)=>surfaceHeight(x,z),
  method:'Concave parcel; documented relative archaeology level; image-registered terrace, ramp and stair profiles; no new survey'};
}
