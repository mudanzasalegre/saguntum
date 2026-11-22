import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {project,terrainSampler} from '../dist/js/territory-coordinates.js';

const assets=new URL('../dist/assets/',import.meta.url);
const bytes=path=>readFile(new URL(path,assets));
const json=async path=>JSON.parse(await bytes(path));
const {terrain}=await json('territory/world.json');
async function raster(g){
  const b=await bytes('territory/'+g.heights);
  return {...g,data:new Int16Array(b.buffer,b.byteOffset,b.length/2)};
}
const grids={base:await raster(terrain),detail:await raster(terrain.detail)};
const scale=111320*Math.cos(39.679*Math.PI/180);
for(const meta of await json('territory/atlas-relief/index.json')){
  const b=gunzipSync(await bytes('territory/'+meta.file));
  const data=new Int16Array(b.buffer,b.byteOffset,b.length/2);
  assert.equal(data.length,meta.width*meta.height);
  for(let j=0;j<meta.height;j++)for(let i=1;i<meta.width;i++)data[j*meta.width+i]+=data[j*meta.width+i-1];
  const sample=terrainSampler({...grids,regional:[{...meta,data}]});
  const source=await json(meta.source.replace(/^assets\//,'')),box=source.bounds,errors=[];
  for(let v=1;v<10;v++)for(let u=1;u<10;u++){
    const i=Math.round(u*(source.width-1)/10),j=Math.round(v*(source.height-1)/10);
    const x=box.minX+i*(box.maxX-box.minX)/(source.width-1);
    const z=box.minZ+j*(box.maxZ-box.minZ)/(source.height-1);
    const point=project(-.278+x/scale,39.679-z/111320);
    errors.push(Math.abs(source.elevations[j*source.width+i]-sample(point.x,point.z)));
  }
  errors.sort((a,b)=>a-b);
  const p95=errors[Math.floor(.95*errors.length)];
  assert.ok(p95<1.1,meta.region+' / '+p95);
  console.log(meta.region,errors.length,'puntos. Error P95 de remuestreo',p95.toFixed(3),'m.');
}
