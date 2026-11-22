import * as T from 'three';
import {insideRing} from './territory-coordinates.js';

// Only decorate exposed walls of mapped residential footprints. Sills and
// projecting balconies are a typological reading, not a facade survey.
export function nearFacades(group){
  const max=3800,box=new T.BoxGeometry(),frame=new T.Object3D();
  const parts=new T.InstancedMesh(box,new T.MeshStandardMaterial({roughness:.78}),max);
  parts.count=0;parts.frustumCulled=false;parts.receiveShadow=true;group.add(parts);
  const stone=new T.Color('#bcaf98'),iron=new T.Color('#49544d'),glass=new T.Color('#617a79');
  let lastKey='',count=0;
  function piece(x,y,z,yaw,w,h,d,color){
    if(count>=max)return;
    frame.position.set(x,y,z);frame.rotation.y=yaw;frame.scale.set(w,h,d);frame.updateMatrix();
    parts.setMatrixAt(count,frame.matrix);parts.setColorAt(count++,color);
  }
  return function update(x,z,range,budget,live,visible,version){
    parts.visible=range<250;
    if(!parts.visible)return;
    const key=[Math.floor(x/20),Math.floor(z/20),budget,[...live.keys()].join('/'),version].join('|');
    if(key===lastKey)return;lastKey=key;count=0;
    const reach=[42,80,115][budget];
    const rows=[];
    for(const v of live.values())for(const r of v.rows){
      const [l,t,k,b]=r.bounds;
      if(k<x-reach-10||l>x+reach+10||b<z-reach-10||t>z+reach+10)continue;
      rows.push(r);
    }
    function occupied(x,z){
      return rows.some(r=>{
        const [l,t,k,b]=r.bounds;
        return l<=x&&x<=k&&t<=z&&z<=b&&insideRing(x,z,r.rings[0])&&!r.rings.slice(1).some(h=>insideRing(x,z,h));
      });
    }
    rows.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));
    for(const r of rows){
      if(r.usage!=='residential'||!visible(r)||count>=max)continue;
      const loop=r.rings[0],sign=Math.sign(loop.reduce((s,a,i)=>{const b=loop[(i+1)%loop.length];return s+a[0]*b[1]-b[0]*a[1];},0));
      for(let i=0;i<loop.length&&count<max;i++){
        const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        if(length<4.5||Math.hypot((a[0]+b[0])/2-x,(a[1]+b[1])/2-z)>reach)continue;
        const tx=dx/length,tz=dz/length,nx=tz*sign,nz=-tx*sign,yaw=-Math.atan2(dz,dx),bays=Math.max(1,Math.round(length/3.3));
        for(let j=0;j<bays&&count<max;j++){
          const px=a[0]+dx*(j+.49)/bays,pz=a[1]+dz*(j+.49)/bays;
          if(occupied(px+nx*.65,pz+nz*.65))continue;
          const floors=Math.min(12,Math.floor((r.roof-r.floor)/3));
          for(let floor=1;floor<floors&&count<max;floor++){
            const y=r.floor+floor*3+.87;
            const balcony=(floor+j+i)%3===0,depth=balcony?.6:.14,cx=px+nx*depth/2,cz=pz+nz*depth/2;
            piece(cx,y,cz,yaw,balcony?1.94:1.6,.105,depth,stone);
            if(balcony){
              const xx=px+nx*.57,zz=pz+nz*.57;
              piece(xx,y+.56,zz,yaw,1.86,.052,.05,iron);
              for(const offset of [-.85,-.29,.29,.85])piece(xx+tx*offset,y+.29,zz+tz*offset,yaw,.035,.54,.045,iron);
            }else if((j+i)%3===1){
              piece(px+nx*.025,y+.72,pz+nz*.025,yaw,1.17,1.28,.045,glass);
            }
          }
        }
      }
    }
    parts.count=count;parts.instanceMatrix.needsUpdate=true;if(parts.instanceColor)parts.instanceColor.needsUpdate=true;
  };
}
