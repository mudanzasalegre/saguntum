import * as T from 'three';

const base=new URL('../assets/materials/streets/',import.meta.url);
function cutout(name){
  const map=new T.TextureLoader().load(new URL(name,base).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.94,alphaTest:.26,alphaToCoverage:true,side:T.DoubleSide});
}

let shared;
export function streetTrees(){
  return shared??=buildTrees().catch(error=>{shared=null;throw error;});
}
async function buildTrees(){
  const response=await fetch(new URL('tree-shape.json',base));
  if(!response.ok)throw Error('Arbolado '+response.status);
  const {wood,clusters,grid}=await response.json();
  const trunk=new T.BufferGeometry(),colors=[],c=new T.Color();
  for(let i=0;i<wood.color.length;i+=3){
    c.setRGB(wood.color[i]/255,wood.color[i+1]/255,wood.color[i+2]/255,T.SRGBColorSpace);
    colors.push(c.r,c.g,c.b);
  }
  trunk.setAttribute('position',new T.Float32BufferAttribute(wood.position.map(v=>v*.001),3));
  trunk.setAttribute('color',new T.Float32BufferAttribute(colors,3));trunk.setIndex(wood.index);trunk.computeVertexNormals();
  const woodMat=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});
  const crown=new T.BufferGeometry(),pos=[],uv=[],normals=[],axes=[],indices=[];
  for(let cluster=0;cluster<clusters.length;cluster++){
    const [cx,cy,cz,size]=clusters[cluster];
    for(let axis=0;axis<3;axis++){
      const start=pos.length/3,slot=cluster*3+axis;
      for(const [u,v] of [[0,0],[1,0],[0,1],[1,1]]){
        const a=(u-.5)*size,b=(v-.5)*size;
        const point=axis===0?[cx+a,cy+b,cz]:axis===1?[cx,cy+b,cz-a]:[cx+a,cy,cz-b];
        pos.push(...point);const n=new T.Vector3(point[0]-.09,(point[1]-2.41)*.85+.41,point[2]-.60).normalize();
        normals.push(n.x,n.y,n.z);axes.push(axis===0?0:axis===1?1:0,axis===2?1:0,axis===0?1:0);
        uv.push((slot%grid[0]+u)/grid[0],1-(Math.floor(slot/grid[0])+1-v)/grid[1]);
      }
      indices.push(start,start+1,start+2,start+2,start+1,start+3);
    }
  }
  for(const [name,list,width] of [['position',pos,3],['normal',normals,3],['uv',uv,2],['leafAxis',axes,3]])
    crown.setAttribute(name,new T.Float32BufferAttribute(list,width));
  crown.setIndex(indices);
  const leaves=cutout('tree-crown.webp');
  leaves.onBeforeCompile=s=>{
    s.vertexShader='attribute vec3 leafAxis;varying float vValidProjection;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 worldTree=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;
      vec3 eyeTree=normalize(cameraPosition-worldTree);
      mat3 orient=mat3(modelMatrix*instanceMatrix);
      vec3 direction=abs(vec3(dot(eyeTree,normalize(orient[0])),dot(eyeTree,normalize(orient[1])),dot(eyeTree,normalize(orient[2]))));
      vValidProjection=dot(direction,leafAxis)-max(max(direction.x,direction.y),direction.z)*.85;`);
    s.fragmentShader='varying float vValidProjection;\n'+s.fragmentShader
      .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n if(vValidProjection<0.)discard;')
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n if(!gl_FrontFacing)normal=-normal;');
  };
  const view=new T.PlaneGeometry(6.30,6.30),far=cutout('tree-views.webp');
  // Use the photographed model's azimuth and elevation closest to the live
  // camera. The trunk centre stays fixed during every change of view.
  far.onBeforeCompile=s=>{
    s.vertexShader='varying vec2 crownUV;varying vec3 treeRight,treeUp,treeEye;\n'+s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      crownUV=uv;
      mat4 treeWorld=modelMatrix*instanceMatrix;
      vec3 eyeTree=normalize(cameraPosition-(treeWorld*vec4(0.,2.27,0.,1.)).xyz);
      float dx=dot(eyeTree,normalize(treeWorld[0].xyz)),dy=dot(eyeTree,normalize(treeWorld[1].xyz)),dz=dot(eyeTree,normalize(treeWorld[2].xyz));
      float azimuth=atan(dx,dz),angle=asin(clamp(dy,-1.,1.));
      float azView=mod(floor(azimuth*(4./3.14159265)+.5)+8.,8.);
      float elView=clamp(floor(angle*(5./3.14159265)+.5),0.,2.);
      float slot=elView*8.+azView;
      vMapUv=(vec2(mod(slot,4.),5.-floor(slot/4.))+uv)/vec2(4.,6.);
    `).replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 right=vec3(cos(azimuth),0.,-sin(azimuth));
      vec3 vertical=vec3(-sin(azimuth)*sin(angle),cos(angle),-cos(azimuth)*sin(angle));
      treeRight=normalize(mat3(treeWorld)*right);
      treeUp=normalize(mat3(treeWorld)*vertical);
      treeEye=eyeTree;
      transformed=vec3(0.,2.27,0.)+position.x*right+position.y*vertical;`);
    s.fragmentShader='varying vec2 crownUV;varying vec3 treeRight,treeUp,treeEye;\n'+s.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
      // A photographed crown has volume even when its distant LOD is a billboard.
      vec2 disk=clamp((crownUV-vec2(.5,.55))*2.25,vec2(-1.),vec2(1.));
      float outward=sqrt(max(0.,1.-dot(disk,disk)));
      vec3 crownNormal=normalize(treeRight*disk.x+treeUp*disk.y+treeEye*outward+vec3(0.,1.65,0.));
      normal=normalize(mat3(viewMatrix)*crownNormal);`);
  };
  return {geometry:{trunk,crown,treeView:view},material:{trunk:woodMat,crown:leaves,treeView:far}};
}
