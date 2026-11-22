import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {project,gridSampler,insideRing} from '../dist/js/territory-coordinates.js';

const read=async file=>JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));
const world=await read('../dist/assets/territory/world.json');
const audit=await read('territory/validation.json');
const near=(a,b,epsilon,message)=>assert.ok(Math.abs(a-b)<epsilon,message+' '+a+' / '+b);
const maxError=[];
for(const [name,c] of Object.entries(audit.controls)){
  const point=project(c.lon,c.lat);
  const d=Math.hypot(point.x-c.x,point.z-c.z);near(d,0,.03,name);maxError.push(d);
}
for(const pair of audit.distances){
  const a=audit.controls[pair.start],b=audit.controls[pair.end],p=project(a.lon,a.lat),q=project(b.lon,b.lat);
  near(Math.hypot(p.x-q.x,p.z-q.z),pair.utmMetres,.12,pair.start+' / '+pair.end);
}
for(const grid of [world.terrain,world.terrain.detail]){
  const bytes=await readFile(new URL('../dist/assets/territory/'+grid.heights,import.meta.url));
  const samples=new Int16Array(bytes.buffer,bytes.byteOffset,bytes.length/2),height=gridSampler(grid,samples);
  assert.equal(samples.length,grid.width*grid.height);
  const [l,t,r,b]=grid.bounds;
  near(height(l,t),samples[0]*grid.unit,.001,'Esquina noroeste');
  near(height(r,b),samples.at(-1)*grid.unit,.001,'Esquina sureste');
}
assert.ok(!world.water.some(p=>insideRing(audit.controls['Palancia, tramo urbano'].x,audit.controls['Palancia, tramo urbano'].z,p.outer)));
console.log('9 anclajes y 6 distancias verificados. Error máximo frente a los controles UTM redondeados:',Math.max(...maxError).toFixed(3),'m.');
