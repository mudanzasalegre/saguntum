import * as T from 'three';
import {addLandscapeGrade} from './territory-surface-photo.js';

// The edge of the navigable municipal terrain is an internal boundary of this
// larger, measured MDT25 landscape. Never extrude the sea floor into the sky.
export async function addHorizon(group,manifest,extent,heightAt,small){
  const path='./assets/territory/landscape/';
  const [binary,map]=await Promise.all([
    fetch(path+'horizon.i16').then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}),
    new T.TextureLoader().loadAsync(path+(small?'horizon-mobile.jpg':'horizon.jpg'))
  ]);
  const samples=new Int16Array(binary),[width,rows]=manifest.horizonSize;
  const [left,top,right,bottom]=manifest.horizonBounds,step=manifest.horizonStep;
  if(samples.length!==width*rows){map.dispose();throw Error('Dimensiones de horizonte MDT25');}
  const [l,t,r,b]=extent;
  const pos=new Float32Array(samples.length*3),uv=new Float32Array(samples.length*2),indices=[];
  for(let j=0;j<rows;j++)for(let i=0;i<width;i++){
    const n=i+j*width,x=left+i*step,z=top+j*step;
    // At the inner edge the original elevations, including sea mask, take precedence.
    const seam=((x===l||x===r)&&z>=t&&z<=b)||((z===t||z===b)&&x>=l&&x<=r);
    pos[3*n]=x;pos[3*n+1]=seam?heightAt(x,z):samples[n]<1?-4:samples[n];pos[3*n+2]=z;
    uv[2*n]=(x-left)/(right-left);uv[2*n+1]=1-(z-top)/(bottom-top);
    if(i>=width-1||j>=rows-1||x>=l&&x<r&&z>=t&&z<b)continue;
    // The official DEM marks the Mediterranean as zero or nodata.
    const n1=n+1,n2=n+width,n3=n2+1;
    if(Math.max(samples[n],samples[n2],samples[n1])>0)indices.push(n,n2,n1);
    if(Math.max(samples[n2],samples[n3],samples[n1])>0)indices.push(n1,n2,n3);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
  map.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshLambertMaterial({map});
  material.onBeforeCompile=addLandscapeGrade;
  const terrain=new T.Mesh(geo,material);terrain.name='Relieve de fondo · MDT25 / PNOA';
  group.add(terrain);
}
