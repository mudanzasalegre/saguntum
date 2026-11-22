import * as T from 'three';

function correction(p,x,z){
 const [l,t,r,b]=p.bounds;
 if(x<l||x>r||z<t||z>b)return 0;
 const u=(x-l)*(p.width-1)/(r-l),v=(z-t)*(p.height-1)/(b-t);
 const i=Math.min(p.width-2,Math.floor(u)),j=Math.min(p.height-2,Math.floor(v)),k=j*p.width+i;
 const dx=u-i,dz=v-j,a=p.delta[k],c=p.delta[k+1],d=p.delta[k+p.width],e=p.delta[k+p.width+1];
 return dx+dz<=1?a+(c-a)*dx+(d-a)*dz:e+(c-e)*(1-dz)+(d-e)*(1-dx);
}
function joinRectangles(rows){
 if(rows.length<2)return rows;
 const [a,b]=rows;
 if(a[2]<b[0]||b[2]<a[0]||a[3]<b[1]||b[3]<a[1])return rows;
 return [[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])]];
}

export function conservationGround({group,material,heightAt,bounds}){
 const original=material.onBeforeCompile,overlay=material.clone();
 const cuts=Array.from({length:4},()=>new T.Vector4()),cross=Array.from({length:4},()=>new T.Vector2());
 const rectangles=Array.from({length:2},()=>new T.Vector4(1,1,-1,-1)),nCuts={value:0};
 function hook(target,coarse){
  target.customProgramCacheKey=()=>coarse?'territory-ground-with-cut':'territory-ground-graded';
  target.onBeforeCompile=function(shader,renderer){
   original.call(this,shader,renderer);
   Object.assign(shader.uniforms,{uSiteRects:{value:rectangles},uExc:{value:cuts},uExcCross:{value:cross},uExcCount:nCuts});
   shader.vertexShader='varying vec2 vSiteMetric;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSiteMetric=position.xz;');
   shader.fragmentShader='varying vec2 vSiteMetric; uniform vec4 uSiteRects[2],uExc[4]; uniform vec2 uExcCross[4]; uniform int uExcCount;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    ${coarse?'for(int j=0;j<2;j++){vec4 r=uSiteRects[j]; if(all(greaterThanEqual(vSiteMetric,r.xy))&&all(lessThanEqual(vSiteMetric,r.zw)))discard;}':''}
    for(int i=0;i<4;i++){if(i>=uExcCount)break;vec2 d=vSiteMetric-uExc[i].xy;if(abs(dot(d,uExc[i].zw))<=1.&&abs(dot(d,uExcCross[i]))<=1.)discard;}`);
  };
 }
 hook(material,true);hook(overlay,false);
 let source=null,active=[],meshes=[],cutsNow=[];
 function grade(x,z){
  let delta=0;
  for(const r of active)if(r.bounds){const d=correction(r,x,z);if(Math.abs(d)>Math.abs(delta))delta=d;}
  return heightAt(x,z)+delta;
 }
 function tile([l,t,r,b]){
  const w=Math.min(193,Math.ceil((r-l)/1.25)+1),h=Math.min(193,Math.ceil((b-t)/1.25)+1);
  const pos=new Float32Array(w*h*3),uv=new Float32Array(w*h*2),index=[];
  const [left,top,right,bottom]=bounds;
  for(let row=0;row<h;row++)for(let col=0;col<w;col++){
   const x=l+col*(r-l)/(w-1),z=t+row*(b-t)/(h-1),i=row*w+col;
   pos[3*i]=x;pos[3*i+1]=grade(x,z);pos[3*i+2]=z;
   uv[2*i]=(x-left)/(right-left);uv[2*i+1]=1-(z-top)/(bottom-top);
   if(row<h-1&&col<w-1)index.push(i,i+w,i+1,i+1,i+w,i+w+1);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));
  g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,overlay);mesh.receiveShadow=true;group.add(mesh);return mesh;
 }
 function update(){
  const next=source?.relief||[];
  if(next.length===active.length&&next.every((p,i)=>p===active[i]))return;
  active=next;
  for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose();}
  const regions=joinRectangles(next.filter(p=>p.bounds).map(p=>p.bounds)),holes=next.flatMap(p=>p.cuts);
  meshes=regions.map(tile);
  rectangles.forEach((v,i)=>regions[i]?v.fromArray(regions[i]):v.set(1,1,-1,-1));
  holes.forEach((q,i)=>{cuts[i].set(q[0],q[1],q[2],q[3]);cross[i].set(q[4],q[5]);});
  nCuts.value=holes.length;cutsNow=holes;
 }
 return {setSource(value){source=value;update();},update,grade,
  canStand(x,z){return !cutsNow.some(([cx,cz,a,b,c,d])=>Math.abs((x-cx)*a+(z-cz)*b)<=1&&Math.abs((x-cx)*c+(z-cz)*d)<=1);}
 };
}
