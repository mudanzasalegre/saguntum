import * as T from 'three';
import {insideRing} from './territory-coordinates.js';
import {baysOn,balconyBay,edgeSeed,joineryTone,openingBounds} from './territory-building-style.js';

// Cast real balcony shadows only near the viewer. The return to the flat joinery
// uses the same bay, floor and sill dimensions as the shader.
export function nearFacades(group){
  const max=11520,frame=new T.Object3D();
  const parts=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshStandardMaterial({roughness:.73}),max);
  parts.count=0;parts.frustumCulled=false;parts.receiveShadow=true;parts.castShadow=true;
  parts.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(parts);
  const lime=new T.Color('#cfc3ac'),concrete=new T.Color('#b9b8ac'),iron=new T.Color('#4a5550'),
    zinc=new T.Color('#707b79'),awning=new T.Color('#b9b394'),edge=new T.Color('#d8d1bd'),
    shutter=new T.Color('#526456'),louvre=new T.Color('#738170');
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
          const kind=r.edgeKinds?.[i]?.[j];
          if((kind&&kind!=='f'&&kind!=='p')||distance>reach||occupied(px+nx*.75,pz+nz*.75))continue;
          const width=bayWidth*(historic?.48:.62);
          // Modular eaves can stop exactly at shared cadastral parts and courtyard walls.
          // The roof skin supplies the physical rim; a band at a nominal eave
          // would cut across sloping roofs and party-wall steps.
          const topAtBay=r.outerHeights?Math.min(r.outerHeights[i],r.outerHeights[(i+1)%loop.length]):r.eaves;
          const localGround=r.outerGround?T.MathUtils.lerp(r.outerGround[i],r.outerGround[(i+1)%loop.length],(j+.5)/bays):r.floor;
          const flatEave=!r.outerHeights||Math.abs(r.outerHeights[i]-r.outerHeights[(i+1)%loop.length])<.18;
          if(kind==='p'&&distance<30&&r.style!==3){
            const [l,u,s,b]=openingBounds(r.style,2),span=r.floor+r.storey-localGround,groundSill=localGround+s*span;
            const width=(u-l)*bayWidth,top=localGround+b*span;
            if(span>1.55&&top<topAtBay-.1){
              const mid=(groundSill+top)*.5,thick=historic?.125:.073;
              for(const side of [-1,1])at(px,mid,pz,side*(width*.5+thick*.68),.055,thick,top-groundSill+.10,.13,stone);
              at(px,top+.07,pz,0,.065,width+thick*2.4,.14,.16,stone);
              at(px,groundSill-.035,pz,0,.06,width+.10,.07,.15,concrete);
            }
          }
          if(flatEave&&historic&&r.storey>1.9){
            at(px,topAtBay-.24,pz,0,.065,bayWidth,.12,.14,stone);
            at(px,topAtBay-.13,pz,0,.12,bayWidth,.10,.25,lime);
          }
          if(floors>=2&&!historic&&r.style!==3&&distance<44&&(r.seed%3===0||r.style===5)){
            at(px,r.floor+r.storey-.07,pz,0,.085,bayWidth,.18,.18,concrete);
            if(r.style===5)at(px,r.floor+r.storey-.20,pz,0,.07,bayWidth,.055,.17,zinc);
          }
          if(distance<31&&j===0&&r.style!==3&&floors>=2){
            const shift=-bayWidth*.5+.16;
            at(px,r.floor+(topAtBay-r.floor)*.46,pz,shift,.07,.065,(topAtBay-r.floor)*.90,.08,zinc);
          }
          if(r.style===3){
            if((j+seed)%5===0&&distance<45){
              at(px,r.floor+r.storey*.83,pz,0,.44,bayWidth*.77,.11,.94,zinc);
            }
            continue;
          }
          for(let level=1;level<floors&&count<max;level++){
            if(r.floor+(level+.87)*r.storey>topAtBay-.05)continue;
            const balcony=balconyBay(j,level,seed);
            const y=r.floor+(level+(balcony?.112:.286))*r.storey;
            if(distance<29&&historic){
              const mid=r.floor+(level+.58)*r.storey,head=r.floor+(level+.845)*r.storey;
              for(const side of [-1,1])at(px,mid,pz,side*(bayWidth*.213+.045),.036,.09,r.storey*.54,.092,stone);
              at(px,head,pz,0,.058,bayWidth*.46+.16,.13,.14,lime);
              if(r.seed%3===0)at(px,head+.085,pz,0,.10,bayWidth*.46+.25,.06,.21,stone);
            }
            if(!balcony){
              if(distance<42)at(px,y,pz,0,.07,width,.083,.16,stone);
              if(historic&&distance<22&&joineryTone(j,level,seed)>.64){
                const shutterWidth=bayWidth*.195,sy=r.floor+(level+.565)*r.storey,sh=r.storey*.536;
                for(const side of [-1,1]){
                  const sx=side*bayWidth*.339;
                  at(px,sy,pz,sx,.045,shutterWidth,sh,.083,shutter);
                  if(distance<16)for(let slat=1;slat<=8;slat++)
                    at(px,sy-sh*.5+sh*slat/9,pz,sx,.092,shutterWidth*.84,.035,.032,louvre);
                }
              }
              continue;
            }
            const w=Math.min(bayWidth*.83,width+.30),depth=historic?.58:.83,h=historic?.83:.96;
            at(px,y,pz,0,depth*.50,w,.13,depth,stone);
            const rim=depth-.045;
            if(!historic&&r.seed%3===1){
              at(px,y+.33,pz,0,rim,w-.04,.57,.11,concrete);
            }
            at(px,y+.12,pz,0,rim,w-.09,.04,.045,rail);
            at(px,y+h,pz,0,rim,w-.05,.055,.052,rail);
            for(const side of [-1,1]){
              at(px,y+h,pz,side*(w*.5-.06),depth*.49,.04,.052,depth-.06,rail);
            }
            const n=distance<34?(historic?9:7):4;
            for(let bar=0;bar<n;bar++){
              const offset=(w-.14)*(bar/(n-1)-.5);
              const baseRail=!historic&&r.seed%3===1?.6:.0;
              at(px,y+(h+baseRail)*.51,pz,offset,rim,.027,h-baseRail-.05,.036,rail);
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
