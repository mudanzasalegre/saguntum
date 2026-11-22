import {Color,ShapeUtils,Vector2} from '../assets/vendor/three.core.js';

// Exact half-metre XY, encoded per 500 m sector. At long distance normals and
// two vertex colours suffice. All triangulation and elevation sampling is off-thread.
export async function aerialGeometry(response,heightAt){
  const inflated=response.body.pipeThrough(new DecompressionStream('gzip'));
  const parcels=await new Response(inflated).json(),groups=new Map();
  const wall=new Color(),roof=new Color();
  for(const [sector,records] of Object.entries(parcels)){
    const [sx,sz]=sector.split('_').map(Number);
    const key=Math.floor(sx/8)+','+Math.floor(sz/8);
    if(!groups.has(key))groups.set(key,{position:[],normal:[],color:[],index:[],rows:[]});
    const g=groups.get(key);
    function vertex(x,y,z,nx,ny,nz,c){
      g.position.push(x,y,z);g.normal.push(Math.round(nx*127),Math.round(ny*127),Math.round(nz*127));
      g.color.push(Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255));
    }
    for(const [raw,h,tint,usage,loops] of records){
      const rings=loops.map(flat=>{
        const loop=[];
        for(let i=0;i<flat.length;i+=2)loop.push(new Vector2(flat[i]*.5+sx*500,flat[i+1]*.5+sz*500));
        return loop;
      });
      const outer=rings[0],ground=outer.map(p=>heightAt(p.x,p.y)).sort((a,b)=>a-b);
      const top=Math.max(ground[ground.length>>1]+h*.1,ground.at(-1)+.6);
      const shade=raw.charCodeAt(3)%4,brick=usage===0?['#cdbfac','#ccb59c','#dfd7c2','#d0bdac'][shade]:'#b6b7ab';
      wall.set(brick);roof.setHex(tint>=0?tint:usage===1?0xa6a9a2:[0xbda48f,0xbca998,0xb0a292,0xc0b4a0][shade]);
      const base=g.position.length/3,begin=g.index.length;
      let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
      for(const loop of rings)for(const {x,y:z} of loop){
        vertex(x,top,z,0,1,0,roof);
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
      }
      for(const [a,b,c] of ShapeUtils.triangulateShape(outer,rings.slice(1)))g.index.push(base+c,base+b,base+a);
      for(const [ri,loop] of rings.entries()){
        const sign=(ShapeUtils.isClockWise(loop)?-1:1)*(ri===0?1:-1);
        for(let i=0;i<loop.length;i++){
          const a=loop[i],b=loop[(i+1)%loop.length],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);
          if(len<.01)continue;
          const nx=sign*dz/len,nz=-sign*dx/len,k=g.position.length/3;
          vertex(a.x,heightAt(a.x,a.y)-1.2,a.y,nx,0,nz,wall);vertex(b.x,heightAt(b.x,b.y)-1.2,b.y,nx,0,nz,wall);
          vertex(b.x,top,b.y,nx,0,nz,wall);vertex(a.x,top,a.y,nx,0,nz,wall);
          if(sign>0)g.index.push(k,k+2,k+1,k,k+3,k+2);else g.index.push(k,k+1,k+2,k,k+2,k+3);
        }
      }
      g.rows.push({id:raw[0]===':'?raw.slice(1):'cat-'+raw,sector,x:(minX+maxX)/2,z:(minZ+maxZ)/2,start:begin,end:g.index.length});
    }
  }
  return [...groups.values()].map(g=>({rows:g.rows,position:new Float32Array(g.position),normal:new Int8Array(g.normal),
    color:new Uint8Array(g.color),index:g.position.length/3<65536?new Uint16Array(g.index):new Uint32Array(g.index)}));
}
