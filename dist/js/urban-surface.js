// Shared metric ground and obstacle queries. Orbit views use this now; a future
// pedestrian controller can use the same heights instead of a second terrain.
export function pointInPolygon(x,z,p) {
  let inside=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++) if((p[i].z>z)!==(p[j].z>z) && x<(p[j].x-p[i].x)*(z-p[i].z)/(p[j].z-p[i].z)+p[i].x) inside=!inside;
  return inside;
}
export function segmentDistance(x,z,a,b) {
  const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;
  const t=l?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l)):0;
  return {distance:Math.hypot(x-a.x-t*dx,z-a.z-t*dz),t};
}
export function polygonDistance(x,z,p) {
  if(pointInPolygon(x,z,p))return 0;
  let d=Infinity;for(let i=0;i<p.length;i++)d=Math.min(d,segmentDistance(x,z,p[i],p[(i+1)%p.length]).distance);return d;
}
export class MetricGrid {
  constructor(size=20){this.size=size;this.cells=new Map();}
  insert(box,item,pad=0){for(let x=Math.floor((box.minX-pad)/this.size);x<=Math.floor((box.maxX+pad)/this.size);x++)for(let z=Math.floor((box.minZ-pad)/this.size);z<=Math.floor((box.maxZ+pad)/this.size);z++){const key=`${x},${z}`;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(item);}}
  at(x,z){return this.cells.get(`${Math.floor(x/this.size)},${Math.floor(z/this.size)}`)||[];}
}
const bounds=p=>({minX:Math.min(...p.map(v=>v.x)),maxX:Math.max(...p.map(v=>v.x)),minZ:Math.min(...p.map(v=>v.z)),maxZ:Math.max(...p.map(v=>v.z))});
const defaults={trunk:9,primary:8,secondary:7,tertiary:5.8,residential:4.5,unclassified:4.5,living_street:3.4,service:3.2,pedestrian:3.1,track:2.4,cycleway:1.9,footway:1.6,path:1.4,steps:1.4};
export function roadWidth(road){const explicit=parseFloat(road.width);return Number.isFinite(explicit)&&explicit>0?Math.min(18,Math.max(.7,explicit)):defaults[road.kind]||2;}
export function createUrbanSurface({data,project,heightAt,patches=[],exclusions=[],collisionPolygons=[],openPassageIds=new Set(),roadSampleStep=2.5}) {
  const roadIndex=new MetricGrid(16),patchIndex=new MetricGrid(20),obstacles=new MetricGrid(20),segments=[];
  let taggedWidths=0;
  for(const road of data.roads||[]){
    if(road.kind==='elevator'||road.bridge==='yes'||road.tunnel==='yes')continue;
    const coords=road.coordinates.map(c=>project(...c)),width=roadWidth(road);
    if(Number.isFinite(parseFloat(road.width)))taggedWidths++;
    for(let i=1;i<coords.length;i++){
      let a=coords[i-1],b=coords[i];
      // Clip the source segment to the region before sampling. Long OSM ways
      // extend well beyond their download box; their extra kilometres must not
      // allocate road and obstacle grids for unrelated parts of the territory.
      if(data.bounds){const box=data.bounds;let enter=0,exit=1;for(const[o,d,min,max]of[[a.x,b.x-a.x,box.minX-30,box.maxX+30],[a.z,b.z-a.z,box.minZ-30,box.maxZ+30]]){if(Math.abs(d)<1e-9){if(o<min||o>max)exit=-1;}else{const u=(min-o)/d,v=(max-o)/d;enter=Math.max(enter,Math.min(u,v));exit=Math.min(exit,Math.max(u,v));}}if(enter>exit)continue;const dx=b.x-a.x,dz=b.z-a.z,start=a;a={x:start.x+dx*enter,z:start.z+dz*enter};b={x:start.x+dx*exit,z:start.z+dz*exit};}
      const length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.05)continue;
      const count=Math.ceil(length/roadSampleStep);
      for(let j=0;j<count;j++){
        const p={x:a.x+(b.x-a.x)*j/count,z:a.z+(b.z-a.z)*j/count},q={x:a.x+(b.x-a.x)*(j+1)/count,z:a.z+(b.z-a.z)*(j+1)/count};
        const segment={a:p,b:q,y0:heightAt(p.x,p.z),y1:heightAt(q.x,q.z),width,road};
        segments.push(segment);roadIndex.insert(bounds([p,q]),segment,width*.5+1.2);
      }
    }
  }
  for(const patch of patches){if(patch.polygon?.length>=3&&Number.isFinite(patch.height))patchIndex.insert(bounds(patch.polygon),patch,patch.margin??1.5);}
  for(const b of data.buildings||[]){
    if(openPassageIds.has(String(b.id)))continue;
    const p=b.coordinates.map(c=>project(...c));if(p.length<3)continue;
    const mid=p.reduce((s,v)=>({x:s.x+v.x/p.length,z:s.z+v.z/p.length}),{x:0,z:0});
    // Original building footprints remain in the future obstacle index even
    // when a custom detailed model replaces their generic rendering.
    const holes=(b.holes||[]).map(r=>r.map(c=>project(...c))).filter(r=>r.length>=3);
    obstacles.insert(bounds(p),{outline:p,holes},.5);
  }
  for(const p of collisionPolygons)if(p.length>=3)obstacles.insert(bounds(p),p,.5);
  function groundHeight(x,z){
    let y=heightAt(x,z),closest=null,min=Infinity;
    for(const s of roadIndex.at(x,z)){
      const d=segmentDistance(x,z,s.a,s.b),ratio=d.distance/(s.width*.5+1.1);
      if(ratio<1&&ratio<min){min=ratio;closest={s,...d};}
    }
    if(closest){
      const {s,t,distance}=closest,center=s.y0+(s.y1-s.y0)*t;
      const falloff=Math.max(0,Math.min(1,(s.width*.5+1.1-distance)/1.1));
      // Modest transverse grading for a continuous road bed. Longitudinal
      // levels still follow the DEM, not an invented city-wide flat plane.
      const grade=Math.max(y-1.2,Math.min(y+1.2,center));
      y+=(grade-y)*falloff*falloff*(3-2*falloff);
    }
    let weight=0,level=0,chosen=null;
    for(const patch of patchIndex.at(x,z)){
      const d=polygonDistance(x,z,patch.polygon),margin=patch.margin??1.5;
      if(d>margin)continue;
      const w=d===0?1:1-d/Math.max(.01,margin);
      // Named access surfaces can share a boundary with a raised monument.
      // Resolve those ties explicitly so the two scene assemblers agree even
      // when they load the church and its street context in opposite orders.
      const tied=Math.abs(w-weight)<1e-9,priority=patch.priority??0,previous=chosen?.priority??0;
      const namedTie=tied&&priority===previous&&patch.id&&chosen?.id&&(patch.priority!==undefined||chosen.priority!==undefined)&&patch.id<chosen.id;
      if(w>weight+1e-9||(tied&&priority>previous)||namedTie){weight=w;chosen=patch;level=patch.height;}
    }
    // Santa María already has a solid masonry foundation down to the street.
    // Cutting excess ground is useful; raising the adjoining MDT to the high
    // church floor would invent a four-metre earth bank beside Cavallers.
    if(chosen?.mode==='lower-only')level=Math.min(y,level);
    return y+(level-y)*weight*weight*(3-2*weight);
  }
  return {groundHeight,segments,canStand(x,z,radius=.3){return !obstacles.at(x,z).some(item=>{const p=item.outline||item;if(polygonDistance(x,z,p)>=radius)return false;return !(item.holes||[]).some(h=>pointInPolygon(x,z,h)&&h.every((a,i)=>segmentDistance(x,z,a,h[(i+1)%h.length]).distance>=radius));});},slopeAt(x,z){return Math.hypot(groundHeight(x+.5,z)-groundHeight(x-.5,z),groundHeight(x,z+.5)-groundHeight(x,z-.5));},stats:{segments:segments.length,taggedWidths,foundationPatches:patches.length,description:'OSM street centerlines; widths, street camber and foundation transitions interpreted where unmeasured.'}};
}
