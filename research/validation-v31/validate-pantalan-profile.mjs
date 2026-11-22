import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {drawPantalanMap} from '../../dist/js/pantalan-map.js';
const{createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=name=>JSON.parse(fs.readFileSync('dist/assets/data/'+name+'.json'));
const maritime=read('pantalan-maritimo-visit'),plan=read('pantalan-maritimo-plan'),paseo=read('pantalan-paseo-visit'),paseoPlan=read('pantalan-paseo-plan');
function trace(elevation){
 const canvas=createCanvas(1200,650),native=canvas.getContext('2d'),commands=[];
 const ctx=new Proxy(native,{get(target,key){const value=Reflect.get(target,key);if(typeof value!=='function')return value;return(...args)=>{if(key==='lineTo'||key==='moveTo')commands.push({key,x:args[0],y:args[1]});return value.apply(target,args);};},set(target,key,value){Reflect.set(target,key,value);return true;}});
 const oneSupport={...plan.supports.find(s=>s.current!==false),elevation};
 const result=drawPantalanMap({width:1200,height:650,getContext:()=>ctx},{},{...maritime,plan:{...plan,supports:[oneSupport]}},{large:true,presentationMode:'current'});
 assert(result.profileShown);return commands;
}
const baseline=trace(4.15),raised=trace(8.15);assert.equal(baseline.length,raised.length);
const differences=baseline.map((a,i)=>({a,b:raised[i]})).filter(({a,b})=>Math.abs(a.y-b.y)>.000001||Math.abs(a.x-b.x)>.000001);
assert.equal(differences.length,1,'Only the longitudinal support cap point should move with its documented elevation');assert.equal(differences[0].a.key,'lineTo');assert(Math.abs(differences[0].a.x-differences[0].b.x)<.000001);assert(Math.abs(differences[0].a.y-differences[0].b.y-12)<.000001,'4m elevation change is drawn at the documented3px/m explanatory vertical scale');
for(const[id,elevation]of[['pantalan-paseo-juegos',8.2],['pantalan-paseo-escollera',4.4]]){const stop=paseo.stops.find(s=>s.id===id),focus=paseoPlan.stops.find(s=>s.id===id);assert(stop&&focus);assert.equal(stop.elevation,elevation);assert.equal(stop.localTarget[1],elevation);assert.equal(focus.elevation,elevation);assert.equal(focus.localTarget[1],elevation);}
const inputs=['dist/js/pantalan-map.js','dist/assets/data/pantalan-paseo-visit.json','dist/assets/data/pantalan-paseo-plan.json','dist/assets/data/pantalan-maritimo-visit.json','dist/assets/data/pantalan-maritimo-plan.json'];
const report={pass:true,checks:3,profile:{capElevationSource:'support.elevation',testMetres:[4.15,8.15],observedVerticalPixels:12,exaggerationPixelsPerMetre:3},guideElevations:{juegos:8.2,escollera:4.4},method:'Real Canvas map renderer command trace and guide/plan elevation consistency. Not browser layout.',sourceHashes:Object.fromEntries(inputs.map(path=>[path,createHash('sha256').update(fs.readFileSync(path)).digest('hex')]))};
fs.writeFileSync('research/validation-v31/pantalan-profile-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,checks:3}));
