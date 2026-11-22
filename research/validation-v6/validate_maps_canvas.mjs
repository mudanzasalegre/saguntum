// Run from the repository: node --experimental-loader ./research/validate_loader.mjs research/validation-v6/validate_maps_canvas.mjs
// Requires @napi-rs/canvas (provided by the managed runtime). No image exports.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let canvasModule;
try{canvasModule=require('@napi-rs/canvas');}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;canvasModule=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');}
const {createCanvas,GlobalFonts}=canvasModule;
import {drawHistoricMap} from '../../dist/js/historic-map.js';import {drawRegionalMap}from '../../dist/js/map.js';import {createHeightSampler}from '../../dist/js/terrain.js';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=root+'research/validation-v6/',read=n=>JSON.parse(fs.readFileSync(root+'dist/assets/data/'+n+'.json'));
GlobalFonts.registerFromPath(root+'dist/assets/fonts/manrope.ttf','Manrope');GlobalFonts.registerFromPath(root+'dist/assets/fonts/manrope-semibold.ttf','Manrope');
const checks=[],errors=[];function check(value,label){checks.push({pass:!!value,label});if(!value)errors.push(label);}
for(const[region,file]of[['marjal','landscape-marjal'],['almarda','landscape-dunes'],['palancia','landscape-palancia']]){
 const data=read(region+'-cartography'),sites=read(file).sites,heightAt=createHeightSampler(read(region+'-elevation')),water=read(region+'-water');
 for(const[w,h,large]of[[1400,900,true],[1100,860,true],[1000,680,true],[540,280,false]]){
  const canvas=createCanvas(w,h),r=drawHistoricMap(canvas,data,sites,{region,large,heightAt,water,selected:sites[0].id,selectedFocus:sites[0].observationPoints[0].id});
  const targets=r.targets.filter(t=>!t.rect);for(const t of targets){const hit=r.hitTarget(t.x,t.y);check(hit?.id===t.id&&hit?.focusId===t.focusId,region+' '+w+' marker '+t.focusId);}
  for(const t of r.targets.filter(t=>t.rect)){const hit=r.hitTarget(t.rect.x+t.rect.w/2,t.rect.y+t.rect.h/2);check(hit?.id===t.id&&hit?.focusId===t.focusId,region+' '+w+' legend '+t.focusId);}
  check(r.shadeCells<23000,region+' '+w+' shade bounded '+r.shadeCells);
  check(targets.length===1+sites[0].observationPoints.length,region+' '+w+' all observation markers');
  
 }
}
const legacyCanvas=createCanvas(1000,680),nec=read('archaeology-necropolis').sites;const legacy=drawHistoricMap(legacyCanvas,read('cartography'),nec,{large:true,selected:'necropolis',selectedFocus:'hipogeos',heightAt:createHeightSampler(read('elevation'))});
const hyp=legacy.targets.find(t=>t.focusId==='hipogeos');check(hyp&&legacy.hitTarget(hyp.x,hyp.y).focusId==='hipogeos','Hypogea secondary id retained');
const regional={...read('regional'),...read('landscape-territory')};
for(const[w,h,large]of[[1200,700,true],[1100,1000,true],[540,280,false]]){
 const canvas=createCanvas(w,h);canvas.getBoundingClientRect=()=>({left:0,top:0,width:w,height:h});const r=drawRegionalMap(canvas,regional,{large,focus:'almarda'});
 for(const hit of r.targets){const p=r.project(...hit.coordinate),answer=r.hitTest(p[0]*w/r.width,p[1]*h/r.height);check(answer?.id===hit.id,'regional '+w+' marker '+hit.id);}
 for(const rect of r.labelRects){const answer=r.hitTest((rect.x+rect.w/2)*w/r.width,(rect.y+rect.h/2)*h/r.height);check(answer?.id===rect.hit.id,'regional '+w+' label '+rect.hit.id);}
 let collisions=0;for(let i=0;i<r.labelRects.length;i++)for(let j=i+1;j<r.labelRects.length;j++){const a=r.labelRects[i],b=r.labelRects[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)collisions++;}check(collisions===0,'regional '+w+' no label overlap '+collisions);
 check(r.targets.length===6,'regional '+w+' six regions');
}
console.log(JSON.stringify({checks:checks.length,errors},null,2));fs.writeFileSync(out+'maps-canvas.json',JSON.stringify({pass:errors.length===0,checksCount:checks.length,checks,errors},null,2));if(errors.length)process.exitCode=1;
