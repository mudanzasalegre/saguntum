// Local display grading for the excavated forum and the Almenara passage.
// The coarse IGN grid samples walls and steep outer slopes, not the floors of
// individual archaeological rooms. Relative levels below are photographic
// estimates, anchored to the existing south/east edge of the central forum.
// They are not excavation survey elevations and do not modify the source MDT.
import {polygonDistance} from './urban-surface.js';
import {FORUM_SURFACE_DEFS} from './castle-forum.js';
import {ALMENARA_SPEC} from './castle-almenara.js';
import {createEastGround} from './castle-east-ground.js';

export const castleForumCoordinates=FORUM_SURFACE_DEFS.find(p=>p.id==='foro').coordinates;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const levels={foro:0,basilica:-1.4,templo:-2,curia:0,tabernae:-.2};

export function createCastleGround({project,heightAt}){
 const polygon=castleForumCoordinates.map(c=>project(...c));
 const anchors=polygon.slice(1).map(p=>heightAt(p.x,p.z)).sort((a,b)=>a-b);
 const level=Math.round(anchors[1]*2)/2,margin=4;
 const sectors=FORUM_SURFACE_DEFS.map(def=>({id:def.id,polygon:def.coordinates.map(c=>project(...c)),height:level+levels[def.id],relativeLevel:levels[def.id]}));
 const gp=project(...ALMENARA_SPEC.coordinate),yaw=ALMENARA_SPEC.yaw,c=Math.cos(yaw),s=Math.sin(yaw);
 const gateWorld=(u,v)=>({x:gp.x+u*c+v*s,z:gp.z-u*s+v*c});
 const frontLevel=level+2.20,depth=ALMENARA_SPEC.depth,rearRise=ALMENARA_SPEC.floorRise;
 // The rendered terrain has 2.5 m cells. Keep their shared corners on the
 // approach plane too, so interpolation cannot lift a narrow passage floor.
 const approach=12,departure=18,gateHalf=ALMENARA_SPEC.frontWidth/2+1.8,gateMargin=3.5;
 const rearAnchor=gateWorld(0,-departure),rearLevel=heightAt(rearAnchor.x,rearAnchor.z);
 function gateProfile(v){
  if(v>=0)return frontLevel+(level-frontLevel)*clamp(v/approach,0,1);
  if(v>=-depth)return frontLevel+rearRise*(-v/depth);
  return frontLevel+rearRise+(rearLevel-frontLevel-rearRise)*clamp((-v-depth)/(departure-depth),0,1);
 }
 const allPoints=sectors.flatMap(p=>p.polygon);
 for(const u of[-gateHalf-gateMargin,gateHalf+gateMargin])for(const v of[-departure-gateMargin,approach+gateMargin])allPoints.push(gateWorld(u,v));
 const east=createEastGround({project,forumLevel:level,gate:{...gp,yaw,depth,departure,halfWidth:gateHalf,margin:gateMargin,world:gateWorld,profile:gateProfile}});
 for(const x of[east.bounds.minX,east.bounds.maxX])for(const z of[east.bounds.minZ,east.bounds.maxZ])allPoints.push({x,z});
 const bounds={minX:Math.min(...allPoints.map(p=>p.x))-margin,maxX:Math.max(...allPoints.map(p=>p.x))+margin,
  minZ:Math.min(...allPoints.map(p=>p.z))-margin,maxZ:Math.max(...allPoints.map(p=>p.z))+margin};
 function forumTarget(x,z){
  let sum=0,total=0,distance=Infinity;
  for(const sector of sectors){
   const d=polygonDistance(x,z,sector.polygon);distance=Math.min(distance,d);
   const w=d===0?1:Math.max(0,1-d/margin)**2;
   sum+=sector.height*w;total+=w;
  }
  return {height:total?sum/total:level,distance};
 }
 function grade(x,z,raw){
  if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return raw;
  raw=east.grade(x,z,raw);
  const forum=forumTarget(x,z);
  // An interval cap is idempotent. Adjacent levels blend across their shared
  // excavation banks; the unmodified hillside is recovered outside the margin.
  if(forum.distance<margin){const allowance=forum.distance*5;raw=clamp(raw,forum.height-allowance,forum.height+allowance);}
  // Protect the central walking terrace all the way to its mapped edge. A
  // shallow collar also supports neighbouring terrain vertices: otherwise a
  // 2.5 m triangle pulls the edge down into the western excavation.
  const plazaDistance=polygonDistance(x,z,polygon);
  if(plazaDistance<4.5)raw=Math.max(raw,level-plazaDistance*.45);
  const dx=x-gp.x,dz=z-gp.z,u=dx*c-dz*s,v=dx*s+dz*c;
  const du=Math.max(0,Math.abs(u)-gateHalf),dv=Math.max(0,v-approach,-departure-v),distance=Math.hypot(du,dv);
  if(distance<gateMargin){const allowance=distance*1.8,h=gateProfile(v);raw=clamp(raw,h-allowance,h+allowance);}
  return raw;
 }
 // The simulator can receive the Atlas's final mesh. Do not re-grade its
 // triangulated banks. Probe all sectors, not just the previously flat plaza.
 const probes=sectors.flatMap(sector=>{
  const center=sector.polygon.reduce((a,p)=>({x:a.x+p.x/sector.polygon.length,z:a.z+p.z/sector.polygon.length}),{x:0,z:0});
  return [center,...sector.polygon.map(p=>({x:center.x+(p.x-center.x)*.35,z:center.z+(p.z-center.z)*.35}))];
 });
 probes.push(gateWorld(0,-depth/2));
 // Edge samples next to the excavated curia lie on interpolated banks, not a
 // walking plane. Keep the existing forum probes and use eastern interior
 // points to recognise a final mesh without re-grading those banks.
 probes.push(...east.probes.filter(p=>sectors.every(sector=>polygonDistance(p.x,p.z,sector.polygon)>margin+2)));
 const pregraded=probes.every(p=>Math.abs(heightAt(p.x,p.z)-grade(p.x,p.z,heightAt(p.x,p.z)))<.16);
 const surfaceHeight=(x,z,raw=heightAt(x,z))=>pregraded?raw:grade(x,z,raw);
 const sample=(x,z)=>surfaceHeight(x,z,heightAt(x,z));
 return {polygon,bounds,level,margin,sectors,pregraded,surfaceHeight,sample,east,
  almenara:{...gp,yaw,frontLevel,rearRise,depth,approach,departure,halfWidth:gateHalf,profile:gateProfile,world:gateWorld},
  method:'Forum and archaeological floors: local relative levels from photographed remains, anchored to the existing IGN south/east edge; curia platform built separately; Almenara passage and eastern paths graded continuously; eastern courtyards retain small relief and outer slopes retain source MDT; elevations are interpretive, not a new archaeological survey'};
}
