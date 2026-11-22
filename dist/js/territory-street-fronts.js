import * as T from 'three';

const directory=new URL('../assets/territory/street-fronts/',import.meta.url);
let catalogue;

export async function loadStreetFronts(sector){
  if(typeof DecompressionStream==='undefined')return null;
  try{
    catalogue??=fetch(new URL('index.json',directory)).then(async response=>{
      if(!response.ok)throw Error('Parcelario '+response.status);
      return new Set((await response.json()).tiles);
    }).catch(error=>{catalogue=null;throw error;});
    if(!(await catalogue).has(sector.id))return null;
    const response=await fetch(new URL(sector.id+'.bin',directory));
    if(!response.ok)throw Error('Margen viario '+response.status);
    const bytes=await response.arrayBuffer(),head=new Uint8Array(bytes,0,2);
    const text=head[0]===31&&head[1]===139
      ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
      : new TextDecoder().decode(bytes);
    return {origin:sector.bounds.slice(0,2),bands:JSON.parse(text)};
  }catch(error){console.warn('Parcelario viario',error);return null;}
}

// Vertices are in decimetres relative to the network sector. Both the verge
// and carriageway follow the same terrain sampler, material and heritage mask.
export function appendStreetFronts(front,heightAt,pos,uv,profiles,indices){
  if(!front)return;
  const [ox,oz]=front.origin;
  const unpack=ring=>{
    const points=[];
    for(let i=0;i<ring.length;i+=2)points.push(new T.Vector2(ox+ring[i]*.1,oz+ring[i+1]*.1));
    return points;
  };
  const vertex=(p,y,slot,mode,u,v)=>{
    pos.push(p.x,heightAt(p.x,p.y)+y,p.y);uv.push(u,v);
    profiles.push(slot,slot===0?4.04:2.24,0,mode);return pos.length/3-1;
  };
  const [footways,margins,kerbs]=front.bands;
  for(const [polygons,sidewalk] of [[footways,true],[margins,false]]){
    const level=sidewalk?.32:.19,slot=sidewalk?1:0;
    for(const polygon of polygons){
      const rings=polygon.map(unpack),faces=T.ShapeUtils.triangulateShape(rings[0],rings.slice(1)),points=rings.flat();
      // Keep the joints parallel to the longest straight plot edge.
      let ux=1,uz=0,longest=0;
      for(let i=0;i<rings[0].length;i++){
        const a=rings[0][i],b=rings[0][(i+1)%rings[0].length],dx=b.x-a.x,dz=b.y-a.y,d=Math.hypot(dx,dz);
        if(d>longest){ux=dx/d;uz=dz/d;longest=d;}
      }
      const point=p=>vertex(p,level,slot,sidewalk?5:6,p.x*ux+p.y*uz,p.y*ux-p.x*uz);
      const pointIndices=points.map(point);
      let lowest=Infinity,highest=-Infinity;
      for(const index of pointIndices){const y=pos[index*3+1];lowest=Math.min(lowest,y);highest=Math.max(highest,y);}
      const span=highest-lowest<.5?42:16;
      // Subdivide long slivers along both edges. Steep streets below the
      // castle can otherwise sink into a 30–60 metre triangle.
      function triangle(a,b,c,ia,ib,ic,depth){
        const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);
        if(Math.max(ab,bc,ca)<span*span||depth>11){indices.push(ia,ic,ib);return;}
        if(bc>ab&&bc>=ca){triangle(b,c,a,ib,ic,ia,depth);return;}
        if(ca>ab){triangle(c,a,b,ic,ia,ib,depth);return;}
        const mid=a.clone().lerp(b,.5),im=point(mid);
        triangle(a,mid,c,ia,im,ic,depth+1);triangle(mid,b,c,im,ib,ic,depth+1);
      }
      for(const [a,b,c] of faces)triangle(points[a],points[b],points[c],pointIndices[a],pointIndices[b],pointIndices[c],0);
    }
  }
  for(const ring of kerbs){
    const line=unpack(ring);
    let length=0;
    for(let i=1;i<line.length;i++){
      const a=line[i-1],b=line[i],len=a.distanceTo(b),parts=Math.ceil(len/8);
      for(let k=0;k<=parts;k++){
        const f=k/parts,p=a.clone().lerp(b,f),u=length+f*len;
        const v=vertex(p,.15,1,7,u,0);
        vertex(p,.32,1,7,u,.17);
        if(k)indices.push(v-2,v-1,v,v,v-1,v+1);
      }
      length+=len;
    }
  }
}
