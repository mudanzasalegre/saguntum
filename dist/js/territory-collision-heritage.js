import {MetricGrid} from './urban-surface.js';
import {indexBounds,nearCell,segmentFraction} from './territory-collision.js';

// Sample wall cross-sections at calf, chest and jump height. A solid bounding
// box around a whole church or gate would also block its courtyards and doors.
// The source mesh is only read when the model loads; walking uses these lines.
const levels=[.55,1.35,2.2];
const decoration=/foliage|leaves|grass|planting|flower|canopy-leaf|copa|hojas|matorral|guijarros|tornillería/i;
export function sampleHeritageBarriers(group,heightAt) {
  const result=[],a=group.position.clone(),b=a.clone(),c=a.clone(),p=a.clone(),q=a.clone();
  const local=group.matrix.clone(),matrix=local.clone(),terrain=new Map();
  function ground(x,z){
    // A shared metre sample also prevents cracks between two coplanar faces.
    const i=Math.round(x),j=Math.round(z);
    let column=terrain.get(i);
    if(!column){column=new Map();terrain.set(i,column);}
    let height=column.get(j);
    if(height===undefined){height=heightAt(i,j);column.set(j,height);}
    return height;
  }
  function section(geometry,transform){
    const pos=geometry.attributes.position,ids=geometry.index,box=geometry.boundingBox;
    if(!pos||pos.count<3)return;
    const min=box.min,max=box.max;
    let low=Infinity,high=-Infinity,left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    let base=Infinity,crown=-Infinity;
    for(const xx of [min.x,max.x])for(const yy of [min.y,max.y])for(const zz of [min.z,max.z]){
      p.set(xx,yy,zz).applyMatrix4(transform);
      const above=p.y-ground(p.x,p.z);
      low=Math.min(low,above);high=Math.max(high,above);
      left=Math.min(left,p.x);right=Math.max(right,p.x);
      top=Math.min(top,p.z);bottom=Math.max(bottom,p.z);
      base=Math.min(base,p.y);crown=Math.max(crown,p.y);
    }
    // The terrain varies across a long wall. Only cull compact components
    // here; their corner samples safely bound furnishings and roof details.
    if(crown-base<.20||Math.hypot(right-left,bottom-top)<.08)return;
    if(right-left<18&&bottom-top<18&&(low>4.2||high<-.8))return;
    const end=ids?.count??pos.count;
    for(let i=0;i+2<end;i+=3){
      a.fromBufferAttribute(pos,ids?ids.getX(i):i).applyMatrix4(transform);
      b.fromBufferAttribute(pos,ids?ids.getX(i+1):i+1).applyMatrix4(transform);
      c.fromBufferAttribute(pos,ids?ids.getX(i+2):i+2).applyMatrix4(transform);
      if(Math.max(a.y,b.y,c.y)-Math.min(a.y,b.y,c.y)<.20)continue;
      const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
      const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
      if(ny*ny>.25*(nx*nx+nz*nz))continue; // floors, roofs, ramps and stair treads
      const h1=a.y-ground(a.x,a.z),h2=b.y-ground(b.x,b.z),h3=c.y-ground(c.x,c.z);
      for(const level of levels){
        const ab=(h1<level)!==(h2<level),bc=(h2<level)!==(h3<level);
        if(!ab&&!bc)continue;
        if(ab)p.lerpVectors(a,b,(level-h1)/(h2-h1));
        else p.lerpVectors(c,a,(level-h3)/(h1-h3));
        if(bc)q.lerpVectors(b,c,(level-h2)/(h3-h2));
        else q.lerpVectors(c,a,(level-h3)/(h1-h3));
        if((p.x-q.x)**2+(p.z-q.z)**2<.08*.08)continue;
        result.push(p.x,p.z,p.y,q.x,q.z,q.y);
      }
    }
  }
  group.updateWorldMatrix(true,true);
  group.traverseVisible(mesh=>{
    if(!mesh.isMesh||mesh.userData.territoryInstances||decoration.test(mesh.userData.materialKind||mesh.name))return;
    const geometry=mesh.geometry;
    if(!geometry.boundingBox)geometry.computeBoundingBox();
    if(geometry.boundingBox.isEmpty())return;
    if(!mesh.isInstancedMesh){section(geometry,mesh.matrixWorld);return;}
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,local);matrix.multiplyMatrices(mesh.matrixWorld,local);section(geometry,matrix);
    }
  });
  return new Float32Array(result);
}

export function createHeritageCollision(heritage){
  const indices=new WeakMap();
  function gridFor(lines){
    let grid=indices.get(lines);
    if(grid)return grid;
    grid=new MetricGrid(8);
    for(let i=0;i<lines.length;i+=6){
      const ax=lines[i],az=lines[i+1],bx=lines[i+3],bz=lines[i+4];
      indexBounds(grid,i,[Math.min(ax,bx),Math.min(az,bz),Math.max(ax,bx),Math.max(az,bz)]);
    }
    indices.set(lines,grid);return grid;
  }
  return {safeToWalk(x,z,radius=.32,feetY){
    for(const lines of heritage.walkBarriers){
      if(nearCell(gridFor(lines),x,z,radius,i=>{
        const ax=lines[i],az=lines[i+1],bx=lines[i+3],bz=lines[i+4],f=segmentFraction(x,z,ax,az,bx,bz);
        const dx=x-ax-(bx-ax)*f,dz=z-az-(bz-az)*f;
        if(dx*dx+dz*dz>radius*radius)return false;
        const y=lines[i+2]+(lines[i+5]-lines[i+2])*f;
        return !Number.isFinite(feetY)||(y>feetY+.12&&y<feetY+1.73);
      }))return false;
    }
    return true;
  }};
}
