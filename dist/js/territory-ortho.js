import * as T from 'three';
import {project} from './territory-coordinates.js';
import {addSurfaceGround,openSurfacePhotography} from './territory-surface-photo.js';

// Reuse a small moving crop of the original high-resolution PNOA plates.
// Only one crop is resident on the GPU, including in overlapping atlas regions.
export async function closeOrthophoto(material,renderer){
  const data='./assets/data/',prefixes=['','port-','coast-','marjal-','almarda-','palancia-'];
  const fine=openSurfacePhotography(renderer);
  const sheets=await Promise.all(prefixes.map(async prefix=>{
    const response=await fetch(data+prefix+'orthophoto.json');
    if(!response.ok)return null;
    const {geographicBounds:b,width,height}=await response.json();
    const nw=project(b.west,b.north),ne=project(b.east,b.north),sw=project(b.west,b.south);
    const ax=ne.x-nw.x,az=ne.z-nw.z,bx=sw.x-nw.x,bz=sw.z-nw.z,det=ax*bz-az*bx;
    const ux=bz/det,uz=-bx/det,vx=-az/det,vz=ax/det;
    return {prefix,width,height,spacing:Math.hypot(ax,az)/width,
      u:new T.Vector3(ux,uz,-nw.x*ux-nw.z*uz),v:new T.Vector3(vx,vz,-nw.x*vx-nw.z*vz)};
  }).map(promise=>promise.catch(()=>null)));
  const updateFine=await fine;
  const ordered=sheets.filter(Boolean).sort((a,b)=>a.spacing-b.spacing);
  const size=matchMedia('(pointer:coarse)').matches?1024:1536;
  let canvas,ctx;
  const closeTexture={value:null};
  const enabled={value:0},u={value:new T.Vector3()},v={value:new T.Vector3()};
  const previous=material.onBeforeCompile;
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    Object.assign(shader.uniforms,{uClose:closeTexture,uCloseU:u,uCloseV:v,uCloseEnabled:enabled});
    shader.fragmentShader='uniform sampler2D uClose; uniform vec3 uCloseU,uCloseV; uniform float uCloseEnabled;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      if(uCloseEnabled>0.5){
        vec3 p=vec3(vTerritory,1.);vec2 cuv=vec2(dot(p,uCloseU),dot(p,uCloseV));
        float edge=min(min(cuv.x,cuv.y),min(1.-cuv.x,1.-cuv.y));
        if(edge>0.)diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(uClose,vec2(cuv.x,1.-cuv.y)).rgb,smoothstep(0.,.045,edge));
      }
      #include <color_fragment>`);
    addSurfaceGround(shader);
  };
  let active=null,image=null,ticket=0,left=Infinity,top=Infinity;
  return function update(x,z,range){
    const local=updateFine(x,z,range);
    const q=new T.Vector3(x,z,1);
    const sheet=!local&&range<820&&ordered.find(s=>{const a=q.dot(s.u),b=q.dot(s.v);return a>=0&&a<=1&&b>=0&&b<=1;});
    if(!sheet){
      enabled.value=0;
      if(active){ticket++;image=null;active=null;}
      if(closeTexture.value){closeTexture.value.dispose();closeTexture.value=null;canvas.width=canvas.height=1;canvas=ctx=null;}
      return;
    }
    if(sheet!==active){
      active=sheet;const request=++ticket;enabled.value=0;image=null;left=top=Infinity;
      const source=new Image();source.onload=()=>{if(request===ticket)image=source;};source.onerror=()=>{if(request===ticket)active=null;};
      source.src=data+sheet.prefix+'orthophoto.jpg';
    }
    if(!image)return;
    if(!closeTexture.value){
      canvas=document.createElement('canvas');canvas.width=canvas.height=size;ctx=canvas.getContext('2d',{alpha:false});
      closeTexture.value=new T.CanvasTexture(canvas);closeTexture.value.colorSpace=T.SRGBColorSpace;
      closeTexture.value.anisotropy=Math.min(6,renderer.capabilities.getMaxAnisotropy());
    }
    const px=q.dot(sheet.u)*sheet.width,pz=q.dot(sheet.v)*sheet.height;
    const l=Math.round(Math.max(0,Math.min(sheet.width-size,px-size/2))),t=Math.round(Math.max(0,Math.min(sheet.height-size,pz-size/2)));
    if(Math.abs(l-left)>size*.17||Math.abs(t-top)>size*.17){
      left=l;top=t;ctx.drawImage(image,l,t,size,size,0,0,size,size);closeTexture.value.needsUpdate=true;
      u.value.copy(sheet.u).multiplyScalar(sheet.width/size);u.value.z-=l/size;
      v.value.copy(sheet.v).multiplyScalar(sheet.height/size);v.value.z-=t/size;
    }
    enabled.value=1;
  };
}
