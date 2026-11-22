import * as T from 'three';
import {insideRing} from './territory-coordinates.js';
import {baysOn,balconyBay,edgeSeed} from './territory-building-style.js';

// Cast real balcony shadows only near the viewer. The return to the flat joinery
// uses the same bay, floor and sill dimensions as the shader.
export function nearFacades(group){
  const max=6400,frame=new T.Object3D();
  const parts=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshStandardMaterial({roughness:.73}),max);
  parts.count=0;parts.frustumCulled=false;parts.receiveShadow=true;parts.castShadow=true;
  parts.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(parts);
  const lime=new T.Color('#cfc3ac'),concrete=new T.Color('#b9b8ac'),iron=new T.Color('#4a5550'),
    zinc=new T.Color('#707b79'),awning=new T.Color('#b9b394'),edge=new T.Color('#d8d1bd');
  let lastKey='',count=0;
  function piece(x,y,z,yaw,w,h,d,color,tilt=0){
    if(count>=max)return;
    frame.position.set(x,y,z);frame.rotation.set(0,yaw,0,'YXZ');frame.rotation.x=tilt;
    frame.scale.set(w,h,d);frame.updateMatrix();
    parts.setMatrixAt(count,frame.matrix);parts.setColorAt(count++,color);
  }
  return function update(x,z,range,budget,live,visible,version){
    parts.visible=range<200;
    if(!parts.visible)return;
    const key=[Math.floor(x/13),Math.floor(z/13),budget,[...live.keys()].join('/'),version].join('|');
    if(key===lastKey)return;lastKey=key;count=0;
    const reach=[32,60,92][budget],rows=[];
    for(const v of live.values())for(const r of v.rows){
      const [l,t,k,b]=r.bounds;
      if(k>=x-reach-8&&l<=x+reach+8&&b>=z-reach-8&&t<=z+reach+8)rows.push(r);
    }
    function occupied(x,z){
      return rows.some(r=>{
        const [l,t,k,b]=r.bounds;
        return l<=x&&x<=k&&t<=z&&z<=b&&insideRing(x,z,r.rings[0])&&!r.rings.slice(1).some(h=>insideRing(x,z,h));
      });
    }
    rows.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));
    for(const r of rows){
      if(!visible(r)||count>=max)continue;
      const loop=r.rings[0],sign=Math.sign(loop.reduce((s,a,i)=>{const b=loop[(i+1)%loop.length];return s+a[0]*b[1]-b[0]*a[1];},0));
      const floors=Math.round((r.eaves-r.floor)/r.storey),historic=r.style===0||r.style===4;
      const stone=historic?lime:concrete,rail=historic?iron:zinc;
      for(let i=0;i<loop.length&&count<max;i++){
        if(!r.outerEdges[i])continue;
        const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        const tx=dx/length,tz=dz/length,nx=tz*sign,nz=-tx*sign,yaw=-Math.atan2(dz,dx),seed=edgeSeed(r.seed,i);
        const along=Math.min(length,Math.max(0,(x-a[0])*tx+(z-a[1])*tz));
        if(Math.hypot(a[0]+tx*along-x,a[1]+tz*along-z)>reach)continue;
        const bays=baysOn(length,r.spacing),bayWidth=length/bays;
        const at=(cx,cy,cz,u,v,w,h,d,color,tilt)=>piece(cx+tx*u+nx*v,cy,cz+tz*u+nz*v,yaw,w,h,d,color,tilt);
        for(let j=0;j<bays&&count<max;j++){
          const px=a[0]+dx*(j+.5)/bays,pz=a[1]+dz*(j+.5)/bays;
          const distance=Math.hypot(px-x,pz-z);
          if(distance>reach||occupied(px+nx*.75,pz+nz*.75))continue;
          const width=bayWidth*(historic?.48:.62);
          // Modular eaves can stop exactly at shared cadastral parts and courtyard walls.
          at(px,r.eaves-.11,pz,0,.06,bayWidth,.12,.14,stone);
          if(r.style===3){
            if((j+seed)%5===0&&distance<45){
              at(px,r.floor+r.storey*.83,pz,0,.44,bayWidth*.77,.11,.94,zinc);
            }
            continue;
          }
          for(let level=1;level<floors&&count<max;level++){
            const balcony=balconyBay(j,level,seed);
            const y=r.floor+(level+(balcony?.112:.286))*r.storey;
            if(!balcony){
              if(distance<42)at(px,y,pz,0,.07,width,.083,.16,stone);
              continue;
            }
            const w=Math.min(bayWidth*.83,width+.30),depth=historic?.58:.83,h=historic?.83:.96;
            at(px,y,pz,0,depth*.50,w,.13,depth,stone);
            const rim=depth-.045;
            at(px,y+.12,pz,0,rim,w-.09,.04,.045,rail);
            at(px,y+h,pz,0,rim,w-.05,.055,.052,rail);
            for(const side of [-1,1]){
              at(px,y+h,pz,side*(w*.5-.06),depth*.49,.04,.052,depth-.06,rail);
            }
            const n=distance<34?(historic?9:7):4;
            for(let bar=0;bar<n;bar++){
              const offset=(w-.14)*(bar/(n-1)-.5);
              at(px,y+h*.53,pz,offset,rim,.027,h-.07,.036,rail);
            }
            if(!historic&&distance<36&&(seed+j*7+level)%11===0){
              const top=r.floor+(level+.83)*r.storey,projection=.86;
              // The canopy pitches away from the wall, with a shallow hanging valance.
              at(px,top-.14,pz,0,projection*.5,w+.12,.055,projection,awning,-sign*.28);
              at(px,top-.28,pz,0,projection,w+.12,.12,.045,edge);
            }
          }
        }
      }
    }
    parts.count=count;parts.instanceMatrix.needsUpdate=true;
    if(parts.instanceColor)parts.instanceColor.needsUpdate=true;
  };
}
