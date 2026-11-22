import {ShapeUtils,Vector2,Color} from '../assets/vendor/three.core.js';
import {gridSampler} from './territory-coordinates.js';

let heightAt;
function ridge(outer,building,roofColor) {
  if(outer.length!==4)return null;
  const shed=['industrial','agriculture'].includes(building.usage);
  const tile=building.roofColor&&roofColor.r>roofColor.g*1.36&&building.levels<=3;
  if(!shed&&!tile)return null;
  const lengths=outer.map((p,i)=>Math.hypot(p[0]-outer[(i+1)%4][0],p[1]-outer[(i+1)%4][1]));
  for(let i=0;i<4;i++){
    const a=outer[(i+3)%4],b=outer[i],c=outer[(i+1)%4];
    const dot=(a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]);
    if(lengths[i]<3||Math.abs(dot)>lengths[i]*lengths[(i+3)%4]*.20)return null;
  }
  const start=lengths[0]<lengths[1]?0:1;
  return {corners:[0,1,2,3].map(i=>outer[(i+start)%4]),rise:Math.min(building.height*.20,shed?2.8:1.55,lengths[start]*(shed?.075:.15))};
}
function build(buildings) {
  const positions=[],colors=[],uv=[],indices=[],rows=[];
  const materials=['#c8bca4','#d0bca3','#d1c5ac','#bbaa92','#c8b2a2','#b6b8b3'].map(v=>new Color(v));
  const roofColors=['#a98e76','#ad806b','#bbab97','#a0998a'].map(v=>new Color(v));
  for(const b of buildings) {
    const rings=b.rings.map(loop=>{
      const ring=loop.slice();
      if(ring.length>1&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
      return ring;
    }).filter(r=>r.length>=3);
    if(!rings.length)continue;
    const outer=rings[0],flat=rings.flat(),ground=outer.map(p=>heightAt(...p)).sort((a,b)=>a-b);
    const floor=ground[ground.length>>1],height=Math.max(1,b.height||5.8),roof=Math.max(floor+height,ground.at(-1)+.6);
    let hash=0;for(const char of String(b.id))hash=(Math.imul(hash,31)+char.charCodeAt(0))>>>0;
    const wall=materials[hash%materials.length],lid=b.roofColor?new Color(b.roofColor):roofColors[(hash>>>4)%roofColors.length];
    const begin=indices.length,base=positions.length/3;
    const minX=Math.min(...outer.map(p=>p[0])),maxX=Math.max(...outer.map(p=>p[0]));
    const minZ=Math.min(...outer.map(p=>p[1])),maxZ=Math.max(...outer.map(p=>p[1]));
    const vectorRings=rings.map(r=>r.map(([x,z])=>new Vector2(x,z)));
    function vertex(x,y,z,u,v,c) {
      positions.push(x,y,z);colors.push(c.r,c.g,c.b);uv.push(u,v);
    }
    const pitched=rings.length===1&&ridge(outer,b,lid);
    const eaves=pitched?roof-pitched.rise:roof;
    if(pitched){
      const [a,c,d,e]=pitched.corners;
      const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
      const left=mid(a,c),right=mid(d,e);
      const face=(points,heights,material)=>{
        const off=positions.length/3;
        points.forEach(([x,z],i)=>vertex(x,heights[i],z,-1,-1,material));
        indices.push(off,off+1,off+2);if(points.length===4)indices.push(off,off+2,off+3);
      };
      face([a,left,right,e],[eaves,roof,roof,eaves],lid);face([left,c,d,right],[roof,eaves,eaves,roof],lid);
      face([a,c,left],[eaves,eaves,roof],wall);face([d,e,right],[eaves,eaves,roof],wall);
    }else{
      for(const [x,z] of flat)vertex(x,roof,z,-1,-1,lid);
      for(const [a,b,c] of ShapeUtils.triangulateShape(vectorRings[0],vectorRings.slice(1))) indices.push(base+c,base+b,base+a);
    }
    for(const [ri,r] of rings.entries()){
      const area=r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0);
      for(let i=0;i<r.length;i++){
        const a=r[i],c=r[(i+1)%r.length],y0=heightAt(...a)-1.2,y1=heightAt(...c)-1.2;
        const industrial=['industrial','agriculture'].includes(b.usage);
        const k=positions.length/3,bays=Math.max(1,Math.round(Math.hypot(c[0]-a[0],c[1]-a[1])/(industrial?8:3.3)));
        const storey=industrial?Math.max(4,height):3;
        // Keep the base course continuous across each real facade.
        vertex(a[0],y0,a[1],0,(y0-floor)/storey,wall);vertex(c[0],y1,c[1],bays,(y1-floor)/storey,wall);
        vertex(c[0],eaves,c[1],bays,(eaves-floor)/storey,wall);vertex(a[0],eaves,a[1],0,(eaves-floor)/storey,wall);
        if((area>0)===(ri===0)) indices.push(k,k+2,k+1,k,k+3,k+2);
        else indices.push(k,k+1,k+2,k,k+2,k+3);
      }
    }
    rows.push({id:b.id,rings,usage:b.usage,floor,roof,bounds:[minX,minZ,maxX,maxZ],x:(minX+maxX)/2,z:(minZ+maxZ)/2,start:begin,end:indices.length,sector:b.sector});
  }
  return {position:new Float32Array(positions),color:new Float32Array(colors),uv:new Float32Array(uv),index:new Uint32Array(indices),rows};
}
self.onmessage=async ({data:m})=>{
  if(m.grids){
    const g=m.grids,base=gridSampler(g.base,g.base.data),d=g.detail;
    const detail=d&&gridSampler(d,d.data);
    heightAt=(x,z)=>{
      if(!d)return base(x,z);
      const [l,t,r,b]=d.bounds,k=Math.max(0,Math.min(1,Math.min(x-l,z-t,r-x,b-z)/50));
      return k===0?base(x,z):k===1?detail(x,z):base(x,z)*(1-k)+detail(x,z)*k;
    };return;
  }
  try{
    const res=await fetch(m.url);
    if(!res.ok)throw Error(String(res.status));
    const result=build((await res.json()).buildings);
    self.postMessage({key:m.key,result},[result.position.buffer,result.color.buffer,result.uv.buffer,result.index.buffer]);
  }catch(e){self.postMessage({key:m.key,error:String(e)});}
};
