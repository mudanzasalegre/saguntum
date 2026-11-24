import * as T from 'three';
import {appendStreetFronts} from './territory-street-fronts.js';
import {urbanLighting} from './territory-urban-sky.js';
import {addStreetPhotography} from './territory-surface-photo.js';

const folder=new URL('../assets/materials/streets/',import.meta.url);
const metres=[4.04,2.24,2,1.8,2.5,2.25,2,2.48];
const surfaces={asphalt:0,paved:0,paving_stones:3,concrete:3,'concrete:plates':1,sett:4,
  unhewn_cobblestone:4,cobblestone:4,dirt:2,earth:2,ground:2,unpaved:2,compacted:2,
  gravel:5,fine_gravel:5,pebblestone:5,rock:5,wood:6,sand:7};

function profile(f){
  if(f.kind==='rail')return [5,2];
  if(f.kind==='riverbed')return [7,0];
  if(f.offset)return [3,3];
  if(f.kind==='steps')return [surfaces[f.surface]??3,4];
  const alternative=['footway','pedestrian','square'].includes(f.kind)?3:['path','track'].includes(f.kind)?2:0;
  const marking=f.car&&!f.oneway&&f.width>=6&&['primary','secondary','tertiary','trunk'].includes(f.kind);
  return [surfaces[f.surface]??alternative,marking?1:f.car?(f.oneway?8:9):0];
}

export function streetMaterial(){
  const loader=new T.TextureLoader();
  const diffuse=loader.load(new URL('pavements.webp',folder).href);
  diffuse.colorSpace=T.SRGBColorSpace;
  const detail=loader.load(new URL('pavements-detail.webp',folder).href);
  const compact=matchMedia('(pointer: coarse)').matches||(navigator.deviceMemory||8)<=4;
  diffuse.anisotropy=detail.anisotropy=compact?4:8;
  const mat=new T.MeshStandardMaterial({roughness:.93,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  mat.onBeforeCompile=s=>{
    s.uniforms.streetPhoto={value:diffuse};s.uniforms.streetDetail={value:detail};
    s.vertexShader='attribute vec4 streetProfile; flat varying vec4 vProfile; varying vec4 vStreetUV;\n'+
      s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvProfile=streetProfile;vStreetUV=vec4(uv,position.xz);');
    s.fragmentShader=`flat varying vec4 vProfile; varying vec4 vStreetUV;
      uniform sampler2D streetPhoto; uniform sampler2D streetDetail;
      float streetBand(float d,float halfWidth,float aa){return 1.-smoothstep(halfWidth-aa,halfWidth+aa,d);}
      `+s.fragmentShader
      .replace('#include <color_fragment>',`#include <color_fragment>
        float kind=vProfile.x, mode=vProfile.w, halfWidth=vProfile.z;
        bool paving=kind==1.||kind==3.||kind==4.||kind==6.;
        // World coordinates keep asphalt and dirt continuous through shared junctions.
        vec2 metresUV=paving||mode==2.?vStreetUV.xy:vStreetUV.zw;
        vec2 metric=metresUV/vProfile.y;
        vec2 atlas=vec2(mod(kind,4.),1.-floor(kind/4.));
        vec2 grid=vec2(.25,.5), span=grid*(496./512.);
        vec2 uvStreet=(atlas+vec2(8./512.))*grid+fract(metric)*span;
        vec2 dxStreet=dFdx(metric),dyStreet=dFdy(metric);
        float footprint=496.*max(length(dxStreet),length(dyStreet));
        float detailWeight=1.-smoothstep(44.,140.,footprint);
        // At grazing angles enlarge the protected tile edge to the mip footprint.
        // Preserve the stone joint pattern until it truly falls below a pixel.
        vec2 guarded=grid*(clamp(footprint*.42,8.,48.)/512.);
        uvStreet=(atlas*grid)+guarded+fract(metric)*(grid-2.*guarded);
        vec3 broad=textureLod(streetPhoto,(atlas+.5)*grid,8.).rgb;
        vec3 grain=textureGrad(streetPhoto,uvStreet,dxStreet*span,dyStreet*span).rgb;
        vec3 micro=textureGrad(streetDetail,uvStreet,dxStreet*span,dyStreet*span).rgb;
        vec3 bed=mix(broad,grain,detailWeight);
        float lateral=vStreetUV.x,along=vStreetUV.y,ax=abs(lateral);
        float aa=max(.012,fwidth(lateral)*.58);
        float longitudinalAA=max(.015,fwidth(along)*.58);
        float paint=0.,steel=0.,trafficPolish=0.;
        // Low-frequency mineral and wear variation in world metres, not a
        // repeated image seam. Fade it as the camera leaves street scale.
        float broadWear=sin(vStreetUV.z*.39+sin(vStreetUV.w*.17))*sin(vStreetUV.w*.31);
        bed*=1.+.038*broadWear*detailWeight;
        if(kind==0.&&(mode==1.||mode==8.||mode==9.)){
          // Carriageway finish at driving scale. A narrow wheel path has
          // finer exposed aggregate than the unused margins of the asphalt.
          float lane=mode==8.||halfWidth<2.35?0.:halfWidth*.50;
          float tracks=abs(abs(ax-lane)-.76);
          trafficPolish=(1.-smoothstep(.15,.52,tracks))*(1.-smoothstep(.15,.76,aa));
          float gutter=smoothstep(halfWidth-.49,halfWidth-.16,ax);
          float marginWear=.5+.5*sin(along*.19+sin(along*.071));
          bed*=1.-.12*trafficPolish-(.065+.055*marginWear)*gutter;
        }
        if(mode==1.){
          float dash=streetBand(abs(mod(along,8.)-2.),1.9,longitudinalAA);
          paint=streetBand(ax,.062,aa)*dash*(1.-smoothstep(.1,.63,aa));
          bed=mix(bed,vec3(.59,.57,.49),paint*clamp(.69+grain.g*1.3,0.,.94));
        }else if(mode==2.){
          // Gauge varies by line. This visual section represents conventional track.
          float sleeper=streetBand(abs(fract(along/.60)-.5)*.60,.105,longitudinalAA)*
                        streetBand(ax,1.23,aa)*(1.-smoothstep(.15,.42,longitudinalAA));
          bed=mix(mix(vec3(dot(bed,vec3(.3,.57,.13))),bed,.38)*.75,vec3(.145,.13,.103),sleeper*.9);
          steel=streetBand(abs(ax-.78),.038,aa)*(1.-smoothstep(.07,.32,aa));
          bed=mix(bed,vec3(.36,.38,.38),steel);
        }else if(mode==3.){
          // Kerb is only on the carriageway-facing side of mapped sidewalks.
          float edging=streetBand(abs(lateral+halfWidth),.15,aa);
          bed=mix(bed,mix(vec3(.34,.32,.28),grain,.26),edging);
          float joint=streetBand(abs(fract(along/.84)-.5)*.84,.008,longitudinalAA);
          bed*=1.-joint*edging*.26*(1.-smoothstep(.025,.1,longitudinalAA));
        }else if(mode==5.){
          // Pale precast slabs at the cadastral plot line. Keep a little
          // warm aggregate response in shade rather than the blue aerial cast.
          bed=mix(bed,vec3(dot(bed,vec3(.22,.70,.08)))*vec3(1.10,1.035,.92),.63);
        }else if(mode==6.){
          bed*=vec3(1.03,.99,.93)*.83;
        }else if(mode==7.){
          float joint=streetBand(abs(fract(lateral/.96)-.5)*.96,.009,aa);
          bed=mix(vec3(.32,.30,.263),grain,.20)*(1.-joint*.37);
        }else if(mode==4.){
          float nosing=streetBand(abs(fract(along/.33)-.5)*.33,.018,longitudinalAA);
          bed*=1.-.23*nosing*(1.-smoothstep(.06,.16,longitudinalAA));
        }
        diffuseColor.rgb*=bed;
      `)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=mix(mix(.93,clamp(micro.b,.48,1.),detailWeight)-trafficPolish*.09,.35,steel);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec3 pdx=dFdx(-vViewPosition),pdy=dFdy(-vViewPosition);
        vec3 tx=cross(pdy,normal)*dxStreet.x+cross(normal,pdx)*dyStreet.x;
        vec3 ty=cross(pdy,normal)*dxStreet.y+cross(normal,pdx)*dyStreet.y;
        float invT=inversesqrt(max(max(dot(tx,tx),dot(ty,ty)),1.e-10));
        vec2 xy=(micro.rg*2.-1.)*.56*detailWeight*(1.-steel);
        normal=normalize(normal*sqrt(max(1.-dot(xy,xy),.05))+(tx*xy.x+ty*xy.y)*invT);`);
    urbanLighting(s);
    addStreetPhotography(s);
  };
  return mat;
}

function geometry(pos,uv,profiles,idx){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('streetProfile',new T.Float32BufferAttribute(profiles,4));
  g.setIndex(idx);g.computeVertexNormals();return g;
}

export function streetGeometry(data,heightAt,fronts){
  const pos=[],uv=[],profiles=[],idx=[];
  function ribbon(f){
    const points=f.points;if(!points||points.length<2)return;
    const line=[],width=f.width||4,[slot,style]=profile(f),sidewalk=Boolean(f.offset);
    for(let i=0;i+1<points.length;i++){
      const [x,z]=points[i],dx=points[i+1][0]-x,dz=points[i+1][1]-z;
      if(Math.abs(dx)+Math.abs(dz)<.01)continue;
      // Keep urban road and kerb segments on the terrain at pedestrian scale.
      // Rural/rail surfaces retain a coarser mesh; no new routes are invented.
      const fine=f.offset||['footway','pedestrian','residential','living_street','service','steps'].includes(f.kind);
      const length=Math.hypot(dx,dz);
      const aY=f.deck?.[i]??heightAt(x,z),bY=f.deck?.[i+1]??heightAt(x+dx,z+dz);
      const midY=f.deck?(aY+bY)*.5:heightAt(x+dx*.5,z+dz*.5);
      const slope=length>0?Math.abs(bY-aY)/length:0,bend=Math.abs(midY-(aY+bY)*.5);
      const step=fine&&(slope>.09||bend>.18)?2:fine?4:8;
      const n=Math.max(1,Math.ceil(length/step));
      for(let j=0;j<n;j++)line.push([x+dx*j/n,z+dz*j/n,f.deck?T.MathUtils.lerp(f.deck[i],f.deck[i+1],j/n):null]);
    }
    line.push([...points.at(-1),f.deck?.at(-1)]);if(line.length<2)return;
    let length=0;
    const first=pos.length/3;
    // Wide carriageways need a centre sample: a single plane between two
    // edges can cut into crowned or irregular DEM surfaces.
    const columns=sidewalk?3:width>=5?3:2;
    for(let i=0;i<line.length;i++){
      const [x,z,deck]=line[i],a=line[Math.max(0,i-1)],b=line[Math.min(i+1,line.length-1)];
      const lenA=Math.hypot(x-a[0],z-a[1]),lenB=Math.hypot(b[0]-x,b[1]-z);
      const ax=(x-a[0])/(lenA||1),az=(z-a[1])/(lenA||1),bx=(b[0]-x)/(lenB||1),bz=(b[1]-z)/(lenB||1);
      const nx=-az-bz,nz=ax+bx,safe=Math.max(.55*Math.hypot(nx,nz),nx*(-(lenA?az:bz))+nz*(lenA?ax:bx),1e-5);
      length+=lenA;
      for(let k=0;k<columns;k++){
        const sign=sidewalk?Math.sign(f.offset):1;
        const lateral=(sidewalk&&k<2?-.5:k/(columns-1)-.5)*width;
        const offset=(f.offset||0)+sign*lateral,vx=x+nx/safe*offset,vz=z+nz/safe*offset;
        pos.push(vx,(deck??heightAt(vx,vz))+(sidewalk&&k>0?.32:.20),vz);
        uv.push(lateral,length);profiles.push(slot,metres[slot],width/2,style);
      }
      if(i)for(let k=0;k+1<columns;k++){
        const a=first+(i-1)*columns+k,b=a+columns;
        if(sidewalk&&f.offset<0)idx.push(a,b,a+1,b,b+1,a+1);else idx.push(a,a+1,b,b,a+1,b+1);
      }
    }
  }
  for(const road of data.roads)if(!road.tunnel){
    ribbon(road);
    for(const [tag,sign] of [['left',-1],['right',1]])if(road.sidewalk===tag||road.sidewalk==='both')
      ribbon({...road,kind:'footway',width:1.2,offset:sign*(road.width/2+.6)});
  }
  for(const rail of data.rail||[])ribbon({...rail,kind:'rail',width:3.1});
  appendStreetFronts(fronts,heightAt,pos,uv,profiles,idx);
  return geometry(pos,uv,profiles,idx);
}

export function streetAreas(areas,heightAt){
  const pos=[],uv=[],profiles=[],idx=[];
  for(const area of areas){
    // The orthophoto provides the actual tree cover, planting and plot boundaries.
    if(!['parking','square'].includes(area.kind)||!area.rings?.length)continue;
    const rings=area.rings.map(r=>r.map(p=>new T.Vector2(...p)));
    const faces=T.ShapeUtils.triangulateShape(rings[0],rings.slice(1)),points=rings.flat();
    const slot=area.kind==='parking'?0:3;
    const vertex=(v)=>{pos.push(v.x,heightAt(v.x,v.y)+.10,v.y);uv.push(v.x,v.y);profiles.push(slot,metres[slot],0,0);idx.push(idx.length);};
    function triangle(a,b,c,depth){
      const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);
      if(depth>=10||Math.max(ab,bc,ca)<900){vertex(a);vertex(c);vertex(b);return;}
      if(bc>ab&&bc>=ca){triangle(b,c,a,depth);return;}
      if(ca>ab){triangle(c,a,b,depth);return;}
      const mid=a.clone().lerp(b,.5);
      triangle(a,mid,c,depth+1);triangle(mid,b,c,depth+1);
    }
    for(const [a,b,c] of faces)triangle(points[a],points[b],points[c],0);
  }
  return geometry(pos,uv,profiles,idx);
}
