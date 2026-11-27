import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,data,canvasRuntime} from './circo-scene.mjs';
import {project} from '../../dist/js/territory-coordinates.js';
import {visitMap} from '../../dist/js/territory-visit-map.js';
const previousFetch=globalThis.fetch,previousImage=globalThis.Image;
globalThis.fetch=async input=>{
 const url=String(input);
 if(url.endsWith('circo-plan.json'))return new Response(JSON.stringify(data('circo-plan')));
 assert(url.endsWith('landscape/index.json'));return new Response(JSON.stringify({pnoaBlocks:[]}));
};
globalThis.Image=class{};
try{
 const guide=data('circo-visit'),record=data('archaeology-public').sites.find(s=>s.id==='circo');
 const place={...record,...project(...record.coordinate),guide:{stops:guide.stops.map((s,i)=>({...s,number:i+1,...project(...s.coordinate)}))}};
 const map=visitMap(()=>{}),canvas=canvasRuntime().createCanvas(660,460),context=canvas.getContext('2d'),checks=[];
 for(const id of ['circo-conjunto','circo-historica','circo-puerta']){
  const stop=place.guide.stops.find(s=>s.id===id);map.set(place,stop);await new Promise(resolve=>setTimeout(resolve,0));
  const [l,t,r,b]=map.bounds,w=canvas.width,h=canvas.height,scale=Math.min(w/(r-l),h/(b-t)),cx=(l+r)/2,cz=(t+b)/2;
  const transform={x:x=>(x-cx)*scale+w/2,z:z=>(z-cz)*scale+h/2};
  context.fillStyle='#344e4b';context.fillRect(0,0,w,h);map.background(context,transform,true,1);
  const reachable=new Set();for(let y=0;y<h;y+=4)for(let x=0;x<w;x+=4){const hit=map.hit(x,y);if(hit)reachable.add(hit.id);}
  assert.equal(reachable.size,id==='circo-historica'?7:14);
  assert(reachable.has('circo-puerta'),'The preserved gate is clickable in every presentation');
  if(id==='circo-historica')assert(r-l>200);else assert(r-l<100);
  fs.writeFileSync(path.join(root,'research/validation-v53/simulator-map-'+id+'.png'),canvas.toBuffer('image/png'));
  checks.push({stop:id,reachable:reachable.size,widthM:r-l,heightM:b-t});
 }
 console.log(JSON.stringify({simulatorMaps:checks,gateAnchorPreserved:true},null,2));
}finally{globalThis.fetch=previousFetch;if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;}
