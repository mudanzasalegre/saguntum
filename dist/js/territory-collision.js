import {insideRing} from './territory-coordinates.js';
import {MetricGrid} from './urban-surface.js';

// Bounds are in the same local UTM metres as the cadastral rings and road graph.
export function indexBounds(grid, item, [minX,minZ,maxX,maxZ], pad=0) {
  grid.insert({minX,minZ,maxX,maxZ},item,pad);
}

export function nearCell(grid,x,z,radius,visit) {
  const left=Math.floor((x-radius)/grid.size),right=Math.floor((x+radius)/grid.size);
  const top=Math.floor((z-radius)/grid.size),bottom=Math.floor((z+radius)/grid.size);
  for(let i=left;i<=right;i++)for(let j=top;j<=bottom;j++){
    const items=grid.cells.get(i+','+j);
    if(items?.some(visit))return true;
  }
  return false;
}

export function segmentFraction(x,z,ax,az,bx,bz) {
  const dx=bx-ax,dz=bz-az;
  return Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));
}

export function touchesSegment(x,z,radius,a,b) {
  const f=segmentFraction(x,z,a[0],a[1],b[0],b[1]);
  const dx=x-a[0]-(b[0]-a[0])*f,dz=z-a[1]-(b[1]-a[1])*f;
  return dx*dx+dz*dz<=radius*radius;
}

export function touchesFootprint(x,z,radius,rings) {
  if(insideRing(x,z,rings[0])&&!rings.slice(1).some(h=>insideRing(x,z,h)))return true;
  for(const ring of rings){
    for(let i=0,j=ring.length-1;i<ring.length;j=i++)if(touchesSegment(x,z,radius,ring[i],ring[j]))return true;
  }
  return false;
}

export function footprintGrid(rows) {
  const grid=new MetricGrid(16);
  for(const row of rows)indexBounds(grid,row,row.bounds);
  return grid;
}
