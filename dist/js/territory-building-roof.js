import {ShapeUtils,Vector2} from '../assets/vendor/three.core.js';

// Split each constrained roof triangle at the crest. This works for concave
// outlines and courtyards without filling a patio or extending a footprint.
export function roofFabric({rings,profile,roof,height,groundHigh,rect,style,lid,x,z,face}){
  const outer=rings[0],all=rings.flat();
  let fit=profile;
  if(!fit&&rect){
    const [a,b]=rect.corners,span=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const nx=(b[0]-a[0])/span,nz=(b[1]-a[1])/span;
    fit=[nx,nz,(.5*(a[0]+b[0])-x)*nx+(.5*(a[1]+b[1])-z)*nz,2*rect.rise/span];
  }
  const triangles=ShapeUtils.triangulateShape(rings[0].map(([x,z])=>new Vector2(x,z)),
    rings.slice(1).map(r=>r.map(([x,z])=>new Vector2(x,z))));
  const rim=!fit&&style.family!==3&&height>=4.6;
  if(!fit){
    const deck=roof-(rim?.34:0);
    for(const [a,b,c] of triangles)face([all[a],all[b],all[c]],[deck,deck,deck],4,lid);
    return {at:()=>roof,crest:null,rim,deck,surface:4};
  }
  const [nx,nz,ridge,gradient]=fit;
  const abscissa=p=>(p[0]-x)*nx+(p[1]-z)*nz;
  const slope=t=>ridge===null?t*gradient:-Math.abs(t-ridge)*gradient;
  const ends=outer.map(abscissa),lo=Math.min(...ends),hi=Math.max(...ends);
  const peak=ridge===null?Math.max(slope(lo),slope(hi)):0;
  const low=Math.min(slope(lo),slope(hi)),available=Math.max(0,roof-groundHigh-.5);
  const amplitude=Math.min(1,available/Math.max(.001,peak-low));
  const at=p=>roof+(slope(abscissa(p))-peak)*amplitude;
  const crest=ridge===null?null:p=>abscissa(p)-ridge;
  // The original aerial photograph supplies the actual hue, including neutral
  // membranes or sheet coverings; choice of a fine grain remains interpretive.
  const surface=style.family===3?6:lid.r>lid.g*1.14?5:4;
  function clipped(points,sign){
    const out=[];
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[j],b=points[i],da=crest(a)*sign,db=crest(b)*sign;
      if((da<0)!==(db<0)){
        const t=da/(da-db);
        out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
      }
      if(db>=0)out.push(b);
    }
    return out.filter((p,i,r)=>Math.hypot(p[0]-r[(i+r.length-1)%r.length][0],p[1]-r[(i+r.length-1)%r.length][1])>.0008);
  }
  for(const tri of triangles){
    const poly=tri.map(i=>all[i]);
    for(const points of crest?[clipped(poly,1),clipped(poly,-1)]:[poly]){
      if(points.length>=3)face(points,points.map(at),surface,lid);
    }
  }
  return {at,crest,rim:false,surface,deck:roof};
}

const regions=new Map();
export async function buildingFabric(key,tileUrl){
  if(typeof DecompressionStream==='undefined')return null;
  const [x,z]=key.split('_').map(Number),area=Math.floor(x/8)+'_'+Math.floor(z/8);
  if(!regions.has(area)){
    regions.set(area,(async()=>{
      const res=await fetch(new URL('../building-fabric/'+area+'.bin',tileUrl));
      if(!res.ok)throw Error(String(res.status));
      return new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).json();
    })().catch(()=>{regions.delete(area);return {}; }));
  }
  return (await regions.get(area))[key];
}
