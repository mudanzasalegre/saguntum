import {ShapeUtils,Vector2,Color} from '../assets/vendor/three.core.js';
import {gridSampler,insideRing} from './territory-coordinates.js';
import {buildingStyle,baysOn,edgeSeed} from './territory-building-style.js';
import {aerialGeometry} from './territory-building-aerial.js';

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
// Cadastral parts frequently meet halfway along an adjacent edge. Index polygons in
// metres and test the exterior of each wall, including mismatched edge subdivisions.
function occupiedIndex(buildings){
  const cells=new Map(),cellSize=48;
  for(const b of buildings){
    const ring=b.rings[0];if(!ring?.length)continue;
    let l=Infinity,t=Infinity,r=-Infinity,v=-Infinity;
    for(const [x,z] of ring){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,z);v=Math.max(v,z);}
    for(let ix=Math.floor(l/cellSize);ix<=Math.floor(r/cellSize);ix++){
      for(let iz=Math.floor(t/cellSize);iz<=Math.floor(v/cellSize);iz++){
        const key=ix+','+iz;
        if(!cells.has(key))cells.set(key,[]);
        cells.get(key).push(b);
      }
    }
  }
  return (x,z,skip)=>{
    const candidates=cells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))||[];
    return candidates.some(b=>b!==skip&&insideRing(x,z,b.rings[0])&&!b.rings.slice(1).some(h=>insideRing(x,z,h)));
  };
}
function build(buildings,overview){
  const positions=[],colors=[],uv=[],metrics=[],surfaces=[],indices=[],rows=[];
  const occupied=overview?null:occupiedIndex(buildings);
  const roofPalette=['#b6a696','#bfa795','#c7b7a8','#bbb6a7'];
  for(const b of buildings){
    const rings=b.rings.map(loop=>{
      const ring=loop.slice();
      if(ring.length>1&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
      return ring;
    }).filter(r=>r.length>=3);
    if(!rings.length)continue;
    const outer=rings[0],flat=rings.flat(),ground=outer.map(p=>heightAt(...p)).sort((a,b)=>a-b);
    const floor=ground[ground.length>>1],height=Math.max(1,b.height||5.8),roof=Math.max(floor+height,ground.at(-1)+.6);
    const minX=Math.min(...outer.map(p=>p[0])),maxX=Math.max(...outer.map(p=>p[0]));
    const minZ=Math.min(...outer.map(p=>p[1])),maxZ=Math.max(...outer.map(p=>p[1]));
    const x=(minX+maxX)/2,z=(minZ+maxZ)/2,style=buildingStyle(b,x,z,height);
    const wall=new Color(style.finish),lid=new Color(b.roofColor||roofPalette[style.seed%4]);
    const begin=indices.length,base=positions.length/3;
    const vectorRings=rings.map(r=>r.map(([x,z])=>new Vector2(x,z)));
    const pitched=rings.length===1&&ridge(outer,b,lid);
    const eaves=pitched?roof-pitched.rise:roof,outerEdges=[];
    const pitchedSurface=style.family===3?6:5;
    const wallHeight=eaves-floor,storeys=Math.max(1,Math.round(wallHeight/style.storey));
    style.storey=wallHeight/storeys;
    let axis=[1,0],longest=0;
    for(let i=0;i<outer.length;i++){
      const a=outer[i],q=outer[(i+1)%outer.length],dx=q[0]-a[0],dz=q[1]-a[1],len=Math.hypot(dx,dz);
      if(len>longest){longest=len;axis=[dx/len,dz/len];}
    }
    function vertex(px,py,pz,u,v,mx,my,c,surface,family,seed,groundStart=0,bayRise=0){
      positions.push(px,py,pz);colors.push(c.r,c.g,c.b);uv.push(u,v);
      metrics.push(mx,my,groundStart,bayRise);surfaces.push(surface,family,seed,Math.round(wallHeight*10));
    }
    const roofPoint=(p,y,surf,c)=>vertex(p[0],y,p[1],0,0,
      (p[0]-x)*axis[0]+(p[1]-z)*axis[1],-(p[0]-x)*axis[1]+(p[1]-z)*axis[0],c,surf,-2,style.seed);
    if(pitched){
      const [a,c,d,e]=pitched.corners;
      const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
      const left=mid(a,c),right=mid(d,e);
      const face=(points,heights,surface,color)=>{
        const off=positions.length/3;
        points.forEach((p,i)=>roofPoint(p,heights[i],surface,color));
        indices.push(off,off+1,off+2);if(points.length===4)indices.push(off,off+2,off+3);
      };
      face([a,left,right,e],[eaves,roof,roof,eaves],pitchedSurface,lid);
      face([left,c,d,right],[roof,eaves,eaves,roof],pitchedSurface,lid);
      face([a,c,left],[eaves,eaves,roof],style.surface,wall);face([d,e,right],[eaves,eaves,roof],style.surface,wall);
    }else{
      for(const p of flat)roofPoint(p,roof,4,lid);
      for(const [a,b,c] of ShapeUtils.triangulateShape(vectorRings[0],vectorRings.slice(1)))indices.push(base+c,base+b,base+a);
    }
    for(const [ri,r] of rings.entries()){
      const area=r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0);
      for(let i=0;i<r.length;i++){
        const a=r[i],c=r[(i+1)%r.length],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);
        const y0=heightAt(...a)-1.2,y1=heightAt(...c)-1.2,k=positions.length/3;
        const bays=baysOn(len,style.spacing),seed=edgeSeed(style.seed,i);
        const sign=Math.sign(area)*(ri===0?1:-1),nx=dz*sign/(len||1),nz=-dx*sign/(len||1);
        const shared=occupied&&[.25,.5,.75].filter(t=>occupied(a[0]+dx*t+nx*.32,a[1]+dz*t+nz*.32,b)).length>=2;
        const exposed=!shared&&len>(style.family===3?3.2:1.85)&&height>2.6;
        const family=exposed?style.family:-1,surface=shared&&style.family===2?0:style.surface;
        if(ri===0)outerEdges.push(Boolean(exposed));
        const corner=(p,y,u,m)=>vertex(p[0],y,p[1],u,(y-floor)/style.storey,m,y-floor,
          wall,surface,family,seed,y0+1.2-floor,(y1-y0)/bays);
        corner(a,y0,0,0);corner(c,y1,bays,len);corner(c,eaves,bays,len);corner(a,eaves,0,0);
        if((area>0)===(ri===0))indices.push(k,k+2,k+1,k,k+3,k+2);
        else indices.push(k,k+1,k+2,k,k+2,k+3);
      }
    }
    rows.push({id:b.id,rings,usage:b.usage,floor,roof,eaves,style:style.family,storey:style.storey,
      spacing:style.spacing,seed:style.seed,outerEdges,bounds:[minX,minZ,maxX,maxZ],x,z,start:begin,end:indices.length,sector:b.sector});
  }
  return {position:new Float32Array(positions),color:new Float32Array(colors),uv:new Float32Array(uv),
    archMetric:new Float32Array(metrics),archData:new Int16Array(surfaces),index:new Uint32Array(indices),rows};
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
    if(m.key.startsWith('aerial-')){
      const result=await aerialGeometry(res,heightAt);
      self.postMessage({key:m.key,result},result.flatMap(g=>[g.position.buffer,g.normal.buffer,g.color.buffer,g.index.buffer]));
      return;
    }
    const result=build((await res.json()).buildings,m.key==='overview');
    self.postMessage({key:m.key,result},[result.position.buffer,result.color.buffer,result.uv.buffer,result.archMetric.buffer,result.archData.buffer,result.index.buffer]);
  }catch(e){self.postMessage({key:m.key,error:String(e)});}
};
