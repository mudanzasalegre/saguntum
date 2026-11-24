import * as T from 'three';
import {insideRing} from './territory-coordinates.js';
import {localScore,viewBucket} from './territory-local-detail.js';
import {baysOn,balconyBay,edgeSeed,joineryTone,openingBounds} from './territory-building-style.js';
import {architectureScans} from './territory-building-material.js';
import {registerUrbanMaterial} from './territory-urban-material-record.js';

function detailMaterial(){
  const mat=new T.MeshStandardMaterial({roughness:.78});
  mat.onBeforeCompile=shader=>{
    const scans=architectureScans();
    Object.assign(shader.uniforms,{uSamples:scans.uArchSurface,uPores:scans.uArchRelief,uLoaded:scans.uArchReady});
    const vars='varying vec2 vPartMetres; varying float vFinish;\n';
    shader.vertexShader=vars+'attribute float facadeFinish;\n'+shader.vertexShader
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 at=(instanceMatrix*vec4(position,1.)).xyz;
        vec3 dir=normalize(mat3(instanceMatrix)*normal);
        // Horizontal surfaces use the cadastral grid. Vertical trim follows its wall.
        vPartMetres=abs(dir.y)>.5?at.xz:vec2(dot(at.xz,vec2(dir.z,-dir.x)),at.y);
        vFinish=facadeFinish;`);
    shader.fragmentShader=vars+'uniform sampler2D uSamples,uPores; uniform float uLoaded;\n'+shader.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        float scanRough=.78, metal=0.;
        if(uLoaded>.5){
          float slot=vFinish<.5?3.:vFinish<1.5?4.:2.;
          float metres=vFinish<.5?3.:vFinish<1.5?2.:2.7;
          vec2 tile=vPartMetres/metres,grid=vec2(4.,2.);
          vec2 stepUV=vec2(504./512.)/grid;
          vec2 uv=(vec2(mod(slot,4.),floor(slot/4.))+.0078125)/grid+fract(tile)*stepUV;
          vec2 dx=dFdx(tile)*stepUV,dy=dFdy(tile)*stepUV;
          vec3 albedo=textureGrad(uSamples,uv,dx,dy).rgb;
          vec3 pores=textureGrad(uPores,uv,dx,dy).rgb;
          float grain=clamp(dot(albedo,vec3(.2126,.7152,.0722))*2.6,.37,1.6);
          if(vFinish<1.5){
            diffuseColor.rgb*=mix(1.,grain,vFinish<.5?.27:.32);
            scanRough=mix(.88,pores.b,.6);
          }else if(vFinish<3.5){
            // Painted railings and exposed zinc respond differently to the sky.
            metal=vFinish<2.5?.14:.62;scanRough=mix(vFinish<2.5?.59:.40,pores.b,.26);
            diffuseColor.rgb*=mix(1.,grain,.15);
          }else{
            float slats=vPartMetres.y*32.;
            float resolved=1.-smoothstep(.08,.45,fwidth(slats));
            diffuseColor.rgb*=1.-resolved*(.04+.08*(.5+.5*cos(6.283185*slats)));
            scanRough=.94;
          }
        }`)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=scanRough;')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=metal;');
  };
  return registerUrbanMaterial(mat,'facade-details');
}

// Cast real balcony shadows only near the viewer. The return to the flat joinery
// uses the same bay, floor and sill dimensions as the shader.
export function nearFacades(group){
  const compact=matchMedia('(pointer: coarse)').matches||(navigator.deviceMemory||8)<=4;
  const max=compact?4500:11520,frame=new T.Object3D();
  const parts=new T.InstancedMesh(new T.BoxGeometry(),detailMaterial(),max);
  // A single unpadded byte is not a WebGPU vertex format. Keep the live buffer
  // shared with the tile updater on both backends.
  const finishes=new T.InstancedBufferAttribute(new Float32Array(max),1);
  finishes.setUsage(T.DynamicDrawUsage);parts.geometry.setAttribute('facadeFinish',finishes);
  parts.count=0;parts.frustumCulled=false;parts.receiveShadow=true;parts.castShadow=true;
  parts.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(parts);
  const lime=new T.Color('#cfc3ac'),concrete=new T.Color('#b9b8ac'),iron=new T.Color('#4a5550'),
    zinc=new T.Color('#707b79'),awning=new T.Color('#b9b394'),edge=new T.Color('#d8d1bd'),
    shutter=new T.Color('#526456'),louvre=new T.Color('#738170'),
    bamboo=new T.Color('#b18c5e'),blindIvory=new T.Color('#d4cdb8'),blindSlate=new T.Color('#8b9996'),
    blindHem=new T.Color('#72746a'),apron=new T.Color('#bc896e');
  let lastKey='',count=0,limit=max;
  const finishCode=new Map([[lime,0],[edge,0],[concrete,1],[apron,1],[iron,2],[shutter,2],[louvre,2],
    [zinc,3],[blindHem,3],[awning,4],[bamboo,4],[blindIvory,4],[blindSlate,4]]);
  function piece(x,y,z,yaw,w,h,d,color,tilt=0){
    if(count>=limit)return;
    frame.position.set(x,y,z);frame.rotation.set(0,yaw,0,'YXZ');frame.rotation.x=tilt;
    frame.scale.set(w,h,d);frame.updateMatrix();
    finishes.setX(count,finishCode.get(color));parts.setMatrixAt(count,frame.matrix);parts.setColorAt(count++,color);
  }
  return function update(x,z,range,budget,live,visible,version,view=null){
    parts.visible=range<200;
    if(!parts.visible)return;
    const key=[Math.floor(x/9),Math.floor(z/9),budget,range<70,viewBucket(view),[...live.keys()].join('/'),version].join('|');
    if(key===lastKey)return;lastKey=key;count=0;limit=Math.min(max,[2500,6500,11520][budget]);
    const reach=[38,72,116][budget],rows=[];
    for(const v of live.values())for(const r of v.rows){
      const [l,t,k,b]=r.bounds;
      if(k>=x-reach-8&&l<=x+reach+8&&b>=z-reach-8&&t<=z+reach+8)rows.push(r);
    }
    const cells=new Map(),cell=16;
    for(const r of rows){const [l,t,k,b]=r.bounds;
      for(let iz=Math.floor(t/cell);iz<=Math.floor(b/cell);iz++)for(let ix=Math.floor(l/cell);ix<=Math.floor(k/cell);ix++){
        const key=ix+','+iz;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(r);
      }
    }
    function occupied(x,z){
      return (cells.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]).some(r=>{
        const [l,t,k,b]=r.bounds;
        return l<=x&&x<=k&&t<=z&&z<=b&&insideRing(x,z,r.rings[0])&&!r.rings.slice(1).some(h=>insideRing(x,z,h));
      });
    }
    const dist=r=>Math.hypot(Math.max(r.bounds[0]-x,0,x-r.bounds[2]),Math.max(r.bounds[1]-z,0,z-r.bounds[3]));
    rows.sort((a,b)=>localScore(a.bounds,x,z,view)-localScore(b.bounds,x,z,view)||dist(a)-dist(b));
    for(const r of rows){
      if(!visible(r)||count>=limit)continue;
      const loop=r.rings[0],sign=Math.sign(loop.reduce((s,a,i)=>{const b=loop[(i+1)%loop.length];return s+a[0]*b[1]-b[0]*a[1];},0));
      const floors=Math.round((r.eaves-r.floor)/r.storey),historic=r.style===0||r.style===4;
      const stone=historic?lime:concrete,rail=historic?iron:zinc;
      for(let i=0;i<loop.length&&count<limit;i++){
        if(!r.outerEdges[i])continue;
        const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        const tx=dx/length,tz=dz/length,nx=tz*sign,nz=-tx*sign,yaw=-Math.atan2(dz,dx),seed=edgeSeed(r.seed,i);
        const along=Math.min(length,Math.max(0,(x-a[0])*tx+(z-a[1])*tz));
        if(Math.hypot(a[0]+tx*along-x,a[1]+tz*along-z)>reach)continue;
        const bays=baysOn(length,r.spacing),bayWidth=length/bays;
        const at=(cx,cy,cz,u,v,w,h,d,color,tilt)=>piece(cx+tx*u+nx*v,cy,cz+tz*u+nz*v,yaw,w,h,d,color,tilt);
        for(let j=0;j<bays&&count<limit;j++){
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
          for(let level=1;level<floors&&count<limit;level++){
            if(r.floor+(level+.87)*r.storey>topAtBay-.05)continue;
            const balcony=balconyBay(j,level,seed);
            const y=r.floor+(level+(balcony?.112:.286))*r.storey;
            const shadeTone=joineryTone(j,level,seed);
            if(distance<32&&shadeTone>.44&&shadeTone<.79){
              // Partly lowered esparto and roller blinds sit ahead of the
              // recessed glass. Each opening keeps its actual lintel and sill.
              const [l,u,s,b]=openingBounds(r.style,balcony?0:1),span=(u-l)*bayWidth;
              const head=r.floor+(level+b)*r.storey,length=(b-s)*r.storey*(.18+(shadeTone-.44)*1.55);
              const textile=historic?bamboo:r.year>=1990&&r.seed%3===1?blindSlate:blindIvory;
              at(px,head-length*.5,pz,0,.025,span,length,.044,textile);
              at(px,head-length+.012,pz,0,.059,span+.015,.039,.035,blindHem);
              if(distance<18)for(let sy=.11;sy<length-.05;sy+=.13)
                at(px,head-sy,pz,0,.052,span,.015,.022,historic?awning:edge);
            }
            if(distance<29&&historic){
              const mid=r.floor+(level+.58)*r.storey,head=r.floor+(level+.845)*r.storey;
              for(const side of [-1,1])at(px,mid,pz,side*(bayWidth*.213+.045),.036,.09,r.storey*.54,.092,stone);
              at(px,head,pz,0,.058,bayWidth*.46+.16,.13,.14,lime);
              if(r.seed%3===0)at(px,head+.085,pz,0,.10,bayWidth*.46+.25,.06,.21,stone);
            }
            if(!balcony){
              if(distance<42)at(px,y,pz,0,.07,width,.083,.16,stone);
              if(historic&&distance<22&&shadeTone>.64){
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
            if(y-.065-localGround<2.35)continue;
            // Verify both outer corners as well as the bay centre on angled blocks.
            if([-.5,0,.5].some(t=>occupied(px+tx*t*w+nx*depth,pz+tz*t*w+nz*depth)))continue;
            at(px,y,pz,0,depth*.50,w,.13,depth,stone);
            const rim=depth-.045;
            if(!historic&&r.seed%3===1){
              const panel=r.style===2&&r.year>=1940&&r.year<1990?apron:concrete;
              at(px,y+.33,pz,0,rim,w-.04,.57,.11,panel);
              if(distance<25)at(px,y+.62,pz,0,rim,w+.01,.045,.15,stone);
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
    parts.count=count;
    for(const attribute of [parts.instanceMatrix,parts.instanceColor,finishes]){
      if(!attribute||!count)continue;
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0,count*attribute.itemSize);
      attribute.needsUpdate=true;
    }
  };
}
