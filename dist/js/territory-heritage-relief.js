import {createUrbanSurface} from './urban-surface.js';
import {excavationOutline,excavationTriangles,triangleCut} from './polygon-excavation.js';

export function territorialCut(cut,frame){
 const {x,z}=cut.center,c=Math.cos(cut.yaw||0),s=Math.sin(cut.yaw||0),p=frame.world(x,z);
 const u=frame.world(x+c*cut.width/2,z-s*cut.width/2),v=frame.world(x+s*cut.depth/2,z+c*cut.depth/2);
 const ux=u.x-p.x,uz=u.z-p.z,vx=v.x-p.x,vz=v.z-p.z,det=ux*vz-uz*vx;
 return [p.x,p.z,vz/det,-vx/det,-uz/det,ux/det];
}

export function territorialWindow(cut,frame){
 const rect=territorialCut(cut,frame),outline=excavationOutline(cut);
 if(!outline.length)return rect;
 return {rect,outline:outline.map(p=>frame.world(p.x,p.z)),
  triangles:excavationTriangles(cut).map(t=>triangleCut(t,p=>frame.world(p.x,p.z))).filter(Boolean)};
}

export function reliefDelta(p,x,z){
 if(!p.bounds)return 0;
 const [l,t,r,b]=p.bounds;
 if(x<l||x>r||z<t||z>b)return 0;
 const u=(x-l)*(p.width-1)/(r-l),v=(z-t)*(p.height-1)/(b-t);
 const i=Math.min(p.width-2,Math.floor(u)),j=Math.min(p.height-2,Math.floor(v)),k=j*p.width+i;
 const dx=u-i,dz=v-j,a=p.delta[k],c=p.delta[k+1],d=p.delta[k+p.width],e=p.delta[k+p.width+1];
 return dx+dz<=1?a+(c-a)*dx+(d-a)*dz:e+(c-e)*(1-dz)+(d-e)*(1-dx);
}

// Sample the v32 foundation grading in the metric world, retaining the
// height *difference* from MDT. A border supplies the unchanged terrain.
export function heritageRelief(id,sites,frame,place,heightAt,sample){
 const patches=[],cuts=[],triangleCuts=[];
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 function expand(point,pad){
  left=Math.min(left,point.x-pad);right=Math.max(right,point.x+pad);
  top=Math.min(top,point.z-pad);bottom=Math.max(bottom,point.z+pad);
 }
 for(const site of Object.values(sites)){
  for(const p of site.patches||[site.patch]){
   if(!p?.polygon?.length||!Number.isFinite(p.height))continue;
   patches.push(p);for(const a of p.polygon)expand(frame.world(a.x,a.z),(p.margin??1.5)+3);
  }
  for(const cut of site.currentMasks||[site.currentMask]){
   if(!cut||cut.permanent===false)continue;
   if(cut.outline){
    for(const triangle of excavationTriangles(cut)){
     const packed=triangleCut(triangle,p=>frame.world(p.x,p.z));
     if(packed)triangleCuts.push(packed);
    }
   }else cuts.push(territorialCut(cut,frame));
  }
 }
 const theatre=sites.theatre?.group?.userData.surfaceHeight;
 if(theatre)expand(place,58);
 const castle=sites.castle?.group?.userData.ground;
 if(castle){
  const b=castle.bounds;
  for(const x of [b.minX,b.maxX])for(const z of [b.minZ,b.maxZ])expand(frame.world(x,z),3);
 }
 // The Forum's exact polygon removes the generic ground beneath the park.
 // Its preparatory street-height cap prevents coarse edge interpolation from
 // dragging neighbouring streets into the pit; visible levels are separate.
 const forumSurface=sites['forum-plaza']?.surfaceHeight;
 if(forumSurface)for(const p of sites['forum-plaza'].group.userData.ground.outline)expand(frame.world(p.x,p.z),3);
 if(!Number.isFinite(left))return {cuts,triangleCuts};
 const bounds=[Math.floor(left/10)*10,Math.floor(top/10)*10,Math.ceil(right/10)*10,Math.ceil(bottom/10)*10];
 const width=Math.min(193,Math.ceil((bounds[2]-bounds[0])/1.25)+1),height=Math.min(193,Math.ceil((bounds[3]-bounds[1])/1.25)+1);
 const adjust=createUrbanSurface({data:{},heightAt:sample,patches}).groundHeight;
 const delta=new Float32Array(width*height),det=frame.a*frame.d-frame.b*frame.c;
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  const x=bounds[0]+(bounds[2]-bounds[0])*i/(width-1),z=bounds[1]+(bounds[3]-bounds[1])*j/(height-1);
  const raw=heightAt(x,z),lx=((x-frame.tx)*frame.d-(z-frame.tz)*frame.b)/det,lz=((z-frame.tz)*frame.a-(x-frame.tx)*frame.c)/det;
  const ground=theatre?theatre(lx,lz,raw):adjust(lx,lz);
  delta[j*width+i]=(castle?castle.surfaceHeight(lx,lz,ground):forumSurface?forumSurface(lx,lz,ground):ground)-raw;
 }
 return {cuts,triangleCuts,bounds,width,height,delta};
}
