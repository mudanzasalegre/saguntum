// Real Canvas plans and click targets across viewports, themes and Sanatorio historical fragment and gardens.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const inputHashes=Object.fromEntries(['dist/js/sanatorio-map.js','dist/assets/data/sanatorio-plan.json','dist/assets/data/sanatorio-visit.json'].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
import assert from 'node:assert/strict';
import {drawSanatorioMap} from '../../dist/js/sanatorio-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visit=read('sanatorio-visit');visit.plan=read('sanatorio-plan');const geo=read('port-cartography'),checks=[],out='research/validation-v30/';
const cases=[{name:'sanatorio-plano',w:1200,h:650,large:true},{name:'sanatorio-plano-mobile',w:370,h:315,large:true},{name:'sanatorio-minimap',w:360,h:210,large:false},{name:'sanatorio-fallback-mobile',w:507,h:1097,large:true,insets:{left:21,right:21,top:161,bottom:564},showLabels:false}];
const selections=[null,'sanatorio-vestibulo','sanatorio-capilla','sanatorio-escalera','sanatorio-seccion','sanatorio-terraza','sanatorio-hispanidad'];
for(const c of cases)for(const theme of ['dark','light'])for(const readingMode of ['materials','periods'])for(const selected of selections){
 const canvas=createCanvas(c.w,c.h),sectionOpen=selected==='sanatorio-seccion',result=drawSanatorioMap(canvas,geo,visit,{...c,palette:getMapPalette(theme),readingMode,selected,sectionOpen});
 assert(result);assert.equal(result.totalStops,21);assert.equal(new Set(result.targets.map(t=>t.id)).size,result.targets.length);
 if(!selected)assert.equal(result.targets.length,21,'Overview retains every stop');
 if(selected)assert(result.targets.some(t=>t.id===selected),'Selected level retains its stop');
 const planStop=visit.plan.stops.find(s=>s.id===selected);
 if(Number.isInteger(planStop?.floor)&&planStop.floor>=0&&(planStop.interiorView||planStop.requiresSection)){assert.equal(result.floor,planStop.floor);assert.equal(result.buildingId,planStop.buildingId);assert(result.interior);assert(result.visibleOpenings.length>0,'Interior circulation must expose registered openings');assert(result.targets.every(t=>visit.plan.stops.find(s=>s.id===t.id).floor===result.floor&&visit.plan.stops.find(s=>s.id===t.id).buildingId===result.buildingId));}
 for(const t of result.targets){assert(Number.isFinite(t.x+t.y+t.elevation));assert(t.x>=0&&t.x<=c.w&&t.y>=0&&t.y<=c.h);assert.equal(result.hitTarget(t.x,t.y),t.id,'Wrong hit target '+c.name+'/'+t.id);}
 const intersections=[];for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++){const a=result.targets[i],b=result.targets[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(c.large?23:13))intersections.push([a.id,b.id]);}
 assert.equal(intersections.length,0,'Markers overlap: '+c.name+' '+JSON.stringify(intersections));
 checks.push({name:c.name,theme,readingMode,selected,sectionShown:result.sectionShown,targets:result.targets.length,floor:result.floor,floorLabel:result.floorLabel});
 if(!selected&&readingMode==='materials')fs.writeFileSync(out+c.name+(theme==='light'?'-light':'')+'.png',canvas.toBuffer('image/png'));
 if(c.name==='sanatorio-plano'&&selected&&theme==='dark'&&readingMode==='periods')fs.writeFileSync(out+selected+'-plan.png',canvas.toBuffer('image/png'));
}
// Both open and closed section controls keep the historical plan readable.
for(const c of cases.slice(0,2)){
 const closed=createCanvas(c.w,c.h),opened=createCanvas(c.w,c.h),options={...c,selected:'sanatorio-capilla',showLabels:false};
 const a=drawSanatorioMap(closed,geo,visit,{...options,sectionOpen:false}),b=drawSanatorioMap(opened,geo,visit,{...options,sectionOpen:true});
 assert.equal(a.floor,0);assert.equal(b.floor,0);assert(a.interior&&b.interior);assert.deepEqual(a.targets.map(t=>t.id),b.targets.map(t=>t.id));
 assert(b.visibleOpenings.length>0);assert(b.floorLabel.includes('histórica'));
 checks.push({name:c.name,selected:'sanatorio-capilla',sectionOpen:true,retainedHistoricalFragment:true,targets:b.targets.length,floor:b.floor});
}
const report={pass:true,cases:checks.length,inputHashes,checks,limits:['Canvas system fonts may differ from loaded browser fonts.','These checks cover floor registration and interaction geometry, not browser layout or GPU rendering.']};fs.writeFileSync(out+'sanatorio-map-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,cases:checks.length}));
