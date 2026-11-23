import {segmentFraction} from './territory-collision.js';

const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const classSpeed={motorway:80,trunk:65,primary:45,secondary:40,tertiary:35,residential:25,living_street:12,unclassified:28};
export function drivingSpeed(road,factor=1){
  const nominal=classSpeed[road.kind.replace(/_link$/,'')]||24;
  const value=String(road.maxspeed||'').trim();
  const limit=/^\d+(?:\.\d+)?(?:\s*(?:km\/h|mph))?$/i.test(value)?parseFloat(value)*(/mph/i.test(value)?1.609344:1):Infinity;
  return Math.min(limit,nominal*(road.kind.endsWith('_link')?.65:1))*factor/3.6;
}

export function routePose(edge,station,car,heightAt){
  const {path,dist,road,deck}=edge;
  let i=1;
  while(i<dist.length-1&&dist[i]<station)i++;
  const p=path[i-1],q=path[i],length=dist[i]-dist[i-1]||1;
  let dx=(q[0]-p[0])/length,dz=(q[1]-p[1])/length;
  const f=clamp((station-dist[i-1])/length,0,1);
  const px=p[0]+(q[0]-p[0])*f,pz=p[1]+(q[1]-p[1])*f;
  // Blend the heading at vertices without rounding the road into neighbouring lots.
  const blend=Math.min(2,length*.45);
  const start=station-dist[i-1],end=dist[i]-station;
  let ux=dx,uz=dz,t=0;
  if(start<blend&&i>1){
    const previous=path[i-2],span=dist[i-1]-dist[i-2]||1;
    ux=(p[0]-previous[0])/span;uz=(p[1]-previous[1])/span;t=.5*(1-start/blend);
  }else if(end<blend&&i+1<path.length){
    const next=path[i+1],span=dist[i+1]-dist[i]||1;
    ux=(next[0]-q[0])/span;uz=(next[1]-q[1])/span;t=.5*(1-end/blend);
  }
  dx=dx*(1-t)+ux*t;dz=dz*(1-t)+uz*t;
  const norm=Math.hypot(dx,dz)||1;dx/=norm;dz/=norm;
  const width=road.width||5;
  const lane=car?(road.oneway?0:Math.max(0,Math.min(1.65,width*.25,width*.5-.98))):
    (road.car?Math.max(0,width*.5-.4):0);
  const offset=lane*clamp(Math.min(station,edge.len-station)/4,0,1);
  const x=px-dz*offset,z=pz+dx*offset;
  const y=(deck?deck[i-1]+(deck[i]-deck[i-1])*f:heightAt(x,z))+.20;
  const rise=car?(deck?deck[i]-deck[i-1]:heightAt(q[0],q[1])-heightAt(p[0],p[1])):0;
  return {x,y,z,dx,dz,pitch:-Math.atan2(rise,length)};
}

const halfLength=1.96,halfWidth=.94;
export function touchesCar(pose,x,z,radius,feetY){
  if(Number.isFinite(feetY)&&(feetY>pose.y+1.49||feetY+1.7<pose.y))return false;
  const dx=x-pose.x,dz=z-pose.z;
  const side=Math.max(0,Math.abs(dx*pose.dz-dz*pose.dx)-halfWidth);
  const front=Math.max(0,Math.abs(dx*pose.dx+dz*pose.dz)-halfLength);
  return side*side+front*front<=radius*radius;
}

export function carsOverlap(a,b,gap=.35){
  if(Math.abs(a.y-b.y)>1.65||Math.abs(a.x-b.x)>5.1+gap||Math.abs(a.z-b.z)>5.1+gap)return false;
  const dx=b.x-a.x,dz=b.z-a.z;
  const along=Math.abs(a.dx*b.dx+a.dz*b.dz),across=Math.abs(a.dx*b.dz-a.dz*b.dx);
  const length=halfLength*(1+along)+halfWidth*across+gap,width=halfWidth*(1+along)+halfLength*across+gap;
  return Math.abs(dx*a.dx+dz*a.dz)<length&&Math.abs(dx*a.dz-dz*a.dx)<width&&
    Math.abs(dx*b.dx+dz*b.dz)<length&&Math.abs(dx*b.dz-dz*b.dx)<width;
}

export function turnChoices(edge,exits,turns,car){
  const next=exits.get(edge.end)||[];
  const rules=car?(turns[edge.end]||[]).filter(rule=>rule.from===edge.road.osm):[];
  const allowed=next.filter(out=>(car?out.car:out.foot)&&
    !rules.some(rule=>rule.only?out.road.osm!==rule.to:out.road.osm===rule.to));
  const forward=allowed.filter(out=>out.road.id!==edge.road.id);
  return forward.length?forward:allowed;
}

export function nearestOnPaths(x,z,segments,allowed,range=85){
  let best=null,bestSq=range*range;
  for(const {a,b} of segments){
    const dx=b[0]-a[0],dz=b[1]-a[1],span=Math.hypot(dx,dz);
    if(span<.01)continue;
    const f=segmentFraction(x,z,a[0],a[1],b[0],b[1]);
    const nearSq=(x-a[0]-f*dx)**2+(z-a[1]-f*dz)**2;
    if(nearSq>bestSq)continue;
    for(const offset of [0,-1.6,1.6,-3.8,3.8,-8,8]){
      const at=clamp(f+offset/span,0,1),xx=a[0]+dx*at,zz=a[1]+dz*at,dd=(xx-x)**2+(zz-z)**2;
      if(dd<=bestSq&&(!allowed||allowed(xx,zz))){best=[xx,zz];bestSq=dd;if(!offset)break;}
    }
  }
  return best;
}
