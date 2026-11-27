// Local display levels in the eastern enclosure. These repair coarse MDT
// interpolation on paths; they are relative photographic estimates, not survey
// elevations. Outside the current courtyard/terraces the IGN slope is retained.
import {polygonDistance} from './urban-surface.js';
import {EAST_PLAN_FEATURES,EAST_ROUTE_DEFS} from './castle-east-layout.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createEastGround({project,forumLevel,gate}){
 const routes=EAST_ROUTE_DEFS.map(r=>({...r,points:r.coordinates.map(c=>project(...c))}));
 const courtyard=routes[0].points;
 const platforms=EAST_PLAN_FEATURES.platforms.map(p=>({...p,polygon:p.coordinates.map(c=>project(...c))}));
 const ruinFloors=EAST_PLAN_FEATURES.ruins.filter(r=>r.kind!=='open-deposit').map(r=>({...r,polygon:r.coordinates.map(c=>project(...c)),center:project(...r.center)}));
 const anchor=project(-.2757,39.6764),gx=gate.x,gz=gate.z,c=Math.cos(gate.yaw),s=Math.sin(gate.yaw);
 const gateWorld=gate.world;
 // A continuous, gently inclined local floor follows the different N/S levels
 // visible in PNOA. Small relief remains between routes and is modelled as rock.
 function plane(x,z){
  const normal=forumLevel+4.3+(z-anchor.z)*.062-(x-anchor.x)*.014;
  const dx=x-gx,dz=z-gz,u=dx*c-dz*s,v=dx*s+dz*c;
  // Match the already authored rear landing exactly, then blend over 23 m.
  const t=clamp((-v-gate.depth)/23,0,1),lateral=clamp((Math.abs(u)-3)/28,0,1),w=(1-t*t*(3-2*t))*(1-lateral*lateral*(3-2*lateral));
  const landing=gate.profile(Math.max(-gate.departure,v));
  return normal+(landing-normal)*w;
 }
 function segmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?clamp(((x-a.x)*dx+(z-a.z)*dz)/l,0,1):0;return Math.hypot(x-a.x-dx*t,z-a.z-dz*t);}
 const points=[...courtyard,...platforms.flatMap(p=>p.polygon)];
 const bounds={minX:Math.min(...points.map(p=>p.x))-5,maxX:Math.max(...points.map(p=>p.x))+5,minZ:Math.min(...points.map(p=>p.z))-5,maxZ:Math.max(...points.map(p=>p.z))+5};
 function grade(x,z,raw){
  if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return raw;
  const dx=x-gx,dz=z-gz,u=dx*c-dz*s,v=dx*s+dz*c;
  // v51 doorway owns its passage and the first part of the rear landing.
  if(v>-gate.depth-1&&Math.abs(u)<gate.halfWidth)return raw;
  const h=plane(x,z),insideDistance=polygonDistance(x,z,courtyard);
  if(insideDistance<3){const allowance=.18+insideDistance*2.3;raw=clamp(raw,h-allowance,h+allowance);}
  for(const p of platforms){const d=polygonDistance(x,z,p.polygon);if(d<p.blendMarginM){const allowance=.12+d*2.8;raw=clamp(raw,h-allowance,h+allowance);}}
  let nearest=Infinity;
  for(const route of routes)for(let i=1;i<route.points.length;i++)nearest=Math.min(nearest,segmentDistance(x,z,route.points[i-1],route.points[i]));
  // A 3.6 m core also supports the adjacent vertices of the 2.5 m Atlas mesh.
  if(nearest<6){const d=Math.max(0,nearest-3.6),allowance=d*1.8;raw=clamp(raw,h-allowance,h+allowance);}
  // Support neighbouring 2.5 m mesh vertices too, so a cell spanning a small
  // ruin does not interpolate uphill through its authored interior floor.
  for(const r of ruinFloors){const d=polygonDistance(x,z,r.polygon);if(d<4.2){const floor=plane(r.center.x,r.center.z),allowance=Math.max(0,d-1.8)*2.2;raw=clamp(raw,floor-allowance,floor+allowance);}}
  return raw;
 }
 const probes=routes.flatMap(r=>r.points.slice(2,-1)).concat(platforms.map(p=>p.polygon.reduce((a,q)=>({x:a.x+q.x/p.polygon.length,z:a.z+q.z/p.polygon.length}),{x:0,z:0})),ruinFloors.map(r=>r.center));
 return {bounds,courtyard,platforms,routes,plane,grade,probes,method:'Relative display levels from photographed terraces and current path plan; path corridors remove coarse MDT spikes, outer slopes retain their source relief; not an accessibility or survey model'};
}
