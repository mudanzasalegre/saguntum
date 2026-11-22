import {Color} from '../assets/vendor/three.core.js';
import {terrainSampler,insideRing} from './territory-coordinates.js';
import {buildingStyle,baysOn,edgeSeed} from './territory-building-style.js';
import {aerialGeometry} from './territory-building-aerial.js';
import {buildingFabric,roofFabric} from './territory-building-roof.js';
import {recessedBay} from './territory-building-openings.js';

let heightAt;
const sourceTiles=new Map();
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
function build(buildings,overview,profiles,fine=false){
  const positions=[],colors=[],uv=[],metrics=[],surfaces=[],indices=[],rows=[];
  const occupied=overview||profiles?null:occupiedIndex(buildings);
  let openings=0;
  const roofPalette=['#b6a696','#bfa795','#c7b7a8','#bbb6a7'];
  for(const [ordinal,b] of buildings.entries()){
    const record=profiles?.[ordinal];
    const fabric=record?.[0]===b.id?record:null;
    const fronts=fabric?.[1].split('/');
    const rings=b.rings.map(loop=>{
      const ring=loop.slice();
      if(ring.length>1&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
      return ring;
    }).filter(r=>r.length>=3);
    if(!rings.length)continue;
    const outer=rings[0],ground=outer.map(p=>heightAt(...p)).sort((a,b)=>a-b);
    const floor=ground[ground.length>>1],height=Math.max(1,b.height||5.8),roof=Math.max(floor+height,ground.at(-1)+.6);
    const minX=Math.min(...outer.map(p=>p[0])),maxX=Math.max(...outer.map(p=>p[0]));
    const minZ=Math.min(...outer.map(p=>p[1])),maxZ=Math.max(...outer.map(p=>p[1]));
    const x=(minX+maxX)/2,z=(minZ+maxZ)/2,style=buildingStyle(b,x,z,height);
    const wall=new Color(style.finish),lid=new Color(b.roofColor||roofPalette[style.seed%4]);
    const begin=indices.length;
    const pitched=rings.length===1&&ridge(outer,b,lid);
    const eaves=!fabric?.[3]&&pitched?roof-pitched.rise:roof,outerEdges=[],edgeKinds=[];
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
    const roofPoint=(p,y,surf,c,family)=>vertex(p[0],y,p[1],0,0,
      (p[0]-x)*axis[0]+(p[1]-z)*axis[1],-(p[0]-x)*axis[1]+(p[1]-z)*axis[0],c,surf,family,style.seed);
    const face=(points,heights,surface,color,family=-2)=>{
      const start=positions.length/3;
      points.forEach((p,i)=>roofPoint(p,heights[i],surface,color,family));
      for(let j=1;j<points.length-1;j++)indices.push(start,start+j+1,start+j);
    };
    const cover=roofFabric({rings,profile:fabric?.[3],roof,height,groundHigh:ground.at(-1),rect:pitched,style,lid,x,z,face});
    for(const [ri,r] of rings.entries()){
      const area=r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0);
      for(let i=0;i<r.length;i++){
        const a=r[i],c=r[(i+1)%r.length],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);
        const y0=heightAt(...a)-1.2,y1=heightAt(...c)-1.2;
        const bays=baysOn(len,style.spacing),seed=edgeSeed(style.seed,i);
        const sign=Math.sign(area)*(ri===0?1:-1),nx=dz*sign/(len||1),nz=-dx*sign/(len||1);
        let classes=ri===0?fronts?.[i]:'c';
        if(!classes){
          const shared=occupied&&[.25,.5,.75].filter(t=>occupied(a[0]+dx*t+nx*.32,a[1]+dz*t+nz*.32,b)).length>=2;
          classes=shared?'s':'f';
        }
        const entrance=fabric?(ri===0&&fabric[2]?.[0]===i?Math.min(bays-1,Math.floor(fabric[2][1]*bays)):-1):seed%bays;
        let modes='';
        for(let j=0;j<bays;j++){
          const kind=classes[Math.min(classes.length-1,Math.floor((j+.5)/bays*classes.length))];
          modes+=len<(style.family===3?3.2:1.85)||height<2.6?'s':kind==='f'&&j===entrance?'p':kind;
        }
        if(ri===0){outerEdges.push(modes.includes('f')||modes.includes('p'));edgeKinds.push(modes);}
        const point=t=>[a[0]+dx*t,a[1]+dz*t];
        const cuts=[0];
        for(let j=1;j<bays;j++)if(modes[j]!==modes[j-1]||fine&&modes[j]!=='s')cuts.push(j/bays);
        if(cover.crest){const da=cover.crest(a),dc=cover.crest(c);if(da*dc<0)cuts.push(da/(da-dc));}
        cuts.push(1);cuts.sort((left,right)=>left-right);
        for(let j=1;j<cuts.length;j++){
          const lo=cuts[j-1],hi=cuts[j];if((hi-lo)*len<.003)continue;
          const p=point(lo),q=point(hi),start=positions.length/3;
          const kind=modes[Math.min(bays-1,Math.floor((lo+hi)*.5*bays))];
          const family=kind==='s'?-1:style.family+(kind==='p'?0:kind==='f'?6:12);
          const surface=kind==='s'&&style.family===2?0:style.surface;
          const corner=(v,y,t)=>vertex(v[0],y,v[1],t*bays,(y-floor)/style.storey,t*len,y-floor,
            wall,surface,family,seed,y0+1.2-floor,(y1-y0)/bays);
          const quad=(corners,reveal)=>{
            const off=positions.length/3;
            for(const [t,y,inset=0] of corners){
              vertex(a[0]+dx*t-nx*inset,y,a[1]+dz*t-nz*inset,t*bays,(y-floor)/style.storey,t*len,y-floor,
                wall,surface,reveal?-1:family,seed,y0+1.2-floor,(y1-y0)/bays);
            }
            if((area>0)===(ri===0))indices.push(off,off+2,off+1,off,off+3,off+2);
            else indices.push(off,off+1,off+2,off,off+2,off+3);
          };
          const recessed=fine&&(kind==='f'||kind==='p')&&Math.abs((hi-lo)*bays-1)<.00001&&recessedBay({
            bay:Math.round(lo*bays),family:style.family,portal:kind==='p',seed,left:lo,right:hi,
            groundLeft:y0+1.2+(y1-y0)*lo,groundRight:y0+1.2+(y1-y0)*hi,
            floor,storey:style.storey,topLeft:cover.at(p),topRight:cover.at(q),quad});
          if(recessed)openings+=recessed;
          else {
            corner(p,y0+(y1-y0)*lo,lo);corner(q,y0+(y1-y0)*hi,hi);corner(q,cover.at(q),hi);corner(p,cover.at(p),lo);
            if((area>0)===(ri===0))indices.push(start,start+2,start+1,start,start+3,start+2);
            else indices.push(start,start+1,start+2,start,start+2,start+3);
          }
          if(cover.rim&&kind!=='s'){
            const thickness=.16,innerP=[p[0]-nx*thickness,p[1]-nz*thickness],innerQ=[q[0]-nx*thickness,q[1]-nz*thickness];
            face([p,q,innerQ,innerP],[roof,roof,roof,roof],4,wall,-3);
            face([innerQ,innerP,innerP,innerQ],[roof,roof,cover.deck,cover.deck],0,wall,-3);
          }
        }
      }
    }
    rows.push({id:b.id,rings,usage:b.usage,floor,roof,eaves,style:style.family,storey:style.storey,
      spacing:style.spacing,seed:style.seed,outerEdges,edgeKinds,outerHeights:outer.map(cover.at),outerGround:outer.map(p=>heightAt(...p)),
      bounds:[minX,minZ,maxX,maxZ],x,z,start:begin,end:indices.length,sector:b.sector});
  }
  return {position:new Float32Array(positions),color:new Float32Array(colors),uv:new Float32Array(uv),
    archMetric:new Float32Array(metrics),archData:new Int16Array(surfaces),index:new Uint32Array(indices),rows,openings};
}
function postGeometry(key,result){
  self.postMessage({key,result},[result.position.buffer,result.color.buffer,result.uv.buffer,result.archMetric.buffer,result.archData.buffer,result.index.buffer]);
}
self.onmessage=async ({data:m})=>{
  if(m.grids){
    heightAt=terrainSampler(m.grids);return;
  }
  try{
    if(m.selected){
      const buildings=[],profiles=[];
      for(const [sector,ids] of m.selected){
        const available=sourceTiles.get(sector);if(!available)continue;
        for(const id of ids){
          const source=available.get(id);if(source?.profile){buildings.push(source.b);profiles.push(source.profile);}
        }
      }
      postGeometry(m.key,build(buildings,false,profiles,true));return;
    }
    const res=await fetch(m.url);
    if(!res.ok)throw Error(String(res.status));
    if(m.key.startsWith('aerial-')){
      const result=await aerialGeometry(res,heightAt);
      self.postMessage({key:m.key,result},result.flatMap(g=>[g.position.buffer,g.normal.buffer,g.color.buffer,g.index.buffer]));
      return;
    }
    const [tile,profiles]=await Promise.all([res.json(),m.key==='overview'?null:buildingFabric(m.key,m.url)]);
    if(m.key!=='overview'){
      sourceTiles.set(m.key,new Map(tile.buildings.map((b,i)=>[b.id,{b,profile:profiles?.[i]}])));
      if(sourceTiles.size>58)sourceTiles.delete(sourceTiles.keys().next().value);
    }
    const result=build(tile.buildings,m.key==='overview',profiles);
    postGeometry(m.key,result);
  }catch(e){self.postMessage({key:m.key,error:String(e)});}
};
