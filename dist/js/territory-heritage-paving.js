import {Box3,Vector3} from 'three';

// Sample the actual top faces of the locally drawn Atlas paving. The same cells
// both hide underlying road fragments and support the visitor on stairs/paths.
export const noSurface=-32768;
function pavement(mesh,context){
 if(!mesh.isMesh||mesh.isInstancedMesh)return false;
 if(context.surfaces?.getObjectById(mesh.id))return true;
 const group=mesh.parent?.name||'';
 const kind=mesh.userData.materialKind||'';
 if(/^(Pavimento|Plaça de Cervantes|Escalinata norte)/i.test(group))
  return !['wood','metal','glass','foliage','wall','joints'].includes(kind);
 return ['asphalt','paving','gravel','garden','earth','grass','road-paint','planting','paving-inset'].includes(kind)||
        kind==='concrete'&&/aceras y suelo exterior|rotonda, plaza|pavimentos/i.test(group);
}
export function sampleAtlasPavement(context,arcade){
 const bounds=new Box3(),surfaces=[];
 function add(mesh){
  mesh.geometry.computeBoundingBox();bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));surfaces.push(mesh);
 }
 context.group.traverseVisible(mesh=>{if(pavement(mesh,context))add(mesh);});
 arcade?.traverseVisible(mesh=>{if(mesh.isMesh&&mesh.userData.materialKind==='paving')add(mesh);});
 if(!surfaces.length||bounds.isEmpty())return null;
 const left=Math.floor(bounds.min.x)-1,top=Math.floor(bounds.min.z)-1;
 const w=Math.ceil(bounds.max.x)-left+1,h=Math.ceil(bounds.max.z)-top+1;
 const metres=Math.max(.32,Math.max(w,h)/896);
 const width=Math.ceil(w/metres),height=Math.ceil(h/metres);
 const heights=new Int16Array(width*height);heights.fill(noSurface);
 const a=new Vector3(),b=new Vector3(),c=new Vector3();
 let coverage=0,triangles=0;
 for(const mesh of surfaces){
  const pos=mesh.geometry.attributes.position,index=mesh.geometry.index,step=index?.count??pos.count;
  for(let i=0;i<step;i+=3){
   a.fromBufferAttribute(pos,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);
   b.fromBufferAttribute(pos,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);
   c.fromBufferAttribute(pos,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
   const ux=b.x-a.x,uz=b.z-a.z,uy=b.y-a.y,vx=c.x-a.x,vz=c.z-a.z,vy=c.y-a.y;
   const det=ux*vz-uz*vx;
   if(Math.abs(det)<1e-8)continue;
   const gx=(uy*vz-vy*uz)/det,gz=(ux*vy-vx*uy)/det;
   if(gx*gx+gz*gz>1.5)continue;
   triangles++;
   const x0=Math.max(0,Math.ceil((Math.min(a.x,b.x,c.x)-left)/metres-.5));
   const x1=Math.min(width-1,Math.floor((Math.max(a.x,b.x,c.x)-left)/metres-.5));
   const z0=Math.max(0,Math.ceil((Math.min(a.z,b.z,c.z)-top)/metres-.5));
   const z1=Math.min(height-1,Math.floor((Math.max(a.z,b.z,c.z)-top)/metres-.5));
   for(let iz=z0;iz<=z1;iz++){
    const dz=top+(iz+.5)*metres-a.z;
    for(let ix=x0;ix<=x1;ix++){
     const dx=left+(ix+.5)*metres-a.x;
     const s=(dx*vz-dz*vx)/det,t=(ux*dz-uz*dx)/det;
     if(s<0||t<0||s+t>1)continue;
     const cell=iz*width+ix,elevation=Math.round((a.y+gx*dx+gz*dz)*100);
     if(heights[cell]===noSurface)coverage++;
     if(elevation>heights[cell])heights[cell]=elevation;
    }
   }
  }
 }
 return coverage?{left,top,width,height,metres,heights,coverage,triangles}:null;
}
export function heightOnPavement(grid,x,z){
 if(!grid)return null;
 const col=Math.floor((x-grid.left)/grid.metres),row=Math.floor((z-grid.top)/grid.metres);
 if(col<0||row<0||col>=grid.width||row>=grid.height)return null;
 const cm=grid.heights[row*grid.width+col];
 return cm===noSurface?null:cm*.01;
}
