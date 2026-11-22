import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {drawPantalanMap} from '../../dist/js/pantalan-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json')),out='research/validation-v31/',geo=read('coast-cartography'),water=read('coast-water');
const files=['dist/js/pantalan-map.js',...['pantalan-paseo','pantalan-maritimo'].flatMap(id=>['visit','plan'].map(s=>'dist/assets/data/'+id+'-'+s+'.json'))];
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),inputHashes=Object.fromEntries(files.map(f=>[f,hash(f)])),checks=[];
const cases=[{name:'plano',w:1200,h:650,large:true},{name:'plano-mobile',w:370,h:315,large:true},{name:'minimap',w:360,h:210,large:false},{name:'fallback-mobile',w:507,h:1097,large:true,insets:{left:21,right:21,top:161,bottom:564},showLabels:false}];
for(const id of ['pantalan-paseo','pantalan-maritimo']){
 const visit=read(id+'-visit');visit.plan=read(id+'-plan');
 for(const c of cases)for(const theme of ['dark','light'])for(const readingMode of ['materials','periods'])for(const presentationMode of ['current','historical'])for(const selected of [null,...visit.stops.map(s=>s.id)]){
  const canvas=createCanvas(c.w,c.h),result=drawPantalanMap(canvas,geo,visit,{...c,water,palette:getMapPalette(theme),readingMode,presentationMode,selected});
  assert.equal(result.totalStops,10);assert.equal(result.targets.length,10);assert.equal(new Set(result.targets.map(t=>t.id)).size,10);assert.equal(result.presentationMode,presentationMode);
  for(const t of result.targets){assert(Number.isFinite(t.x+t.y));assert(t.x>=0&&t.x<=c.w&&t.y>=0&&t.y<=c.h);assert.equal(result.hitTarget(t.x,t.y),t.id);}
  for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++)assert(Math.hypot(result.targets[i].x-result.targets[j].x,result.targets[i].y-result.targets[j].y)>=(c.large?24:15),'Overlapping targets');
  if(id==='pantalan-maritimo'&&presentationMode==='current')assert(result.components<visit.plan.components.length,'Current map must omit historic decks and machines');
  checks.push({id,case:c.name,theme,readingMode,presentationMode,selected,targets:result.targets.length,components:result.components,profileShown:result.profileShown});
  if(!selected&&readingMode==='materials')fs.writeFileSync(out+id+'-'+c.name+'-'+presentationMode+'-'+theme+'.png',canvas.toBuffer('image/png'));
 }
}
assert(files.every(f=>hash(f)===inputHashes[f]),'Inputs changed during checks');
const report={pass:true,cases:checks.length,inputHashes,checks,limits:['Real Canvas drawings and hit targets; no browser font/layout/GPU claim.']};fs.writeFileSync(out+'pantalan-map-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,cases:checks.length}));
