// Real Canvas plans and click targets across viewports, themes and office levels and precinct.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {drawGerenciaMap} from '../../dist/js/gerencia-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visit=read('gerencia-visit');visit.plan=read('gerencia-plan');const geo=read('port-cartography'),checks=[],out='research/validation-v25/';
const cases=[{name:'gerencia-plano',w:1200,h:650,large:true},{name:'gerencia-plano-mobile',w:370,h:315,large:true},{name:'gerencia-minimap',w:360,h:210,large:false},{name:'gerencia-fallback-mobile',w:507,h:1097,large:true,insets:{left:21,right:21,top:161,bottom:564},showLabels:false}];
const selections=[null,'gerencia-oficinas','gerencia-vestibulo','gerencia-salas','gerencia-seccion','gerencia-paseo'];
for(const c of cases)for(const theme of ['dark','light'])for(const readingMode of ['materials','periods'])for(const selected of selections){
 const canvas=createCanvas(c.w,c.h),sectionOpen=selected==='gerencia-seccion',result=drawGerenciaMap(canvas,geo,visit,{...c,palette:getMapPalette(theme),readingMode,selected,sectionOpen});
 assert(result);assert.equal(result.totalStops,20);assert.equal(new Set(result.targets.map(t=>t.id)).size,result.targets.length);
 if(!selected)assert.equal(result.targets.length,20,'Overview retains every stop');
 if(selected)assert(result.targets.some(t=>t.id===selected),'Selected level retains its stop');
 const planStop=visit.plan.stops.find(s=>s.id===selected);
 if(Number.isInteger(planStop?.floor)&&planStop.floor>=0){assert.equal(result.floor,planStop.floor);assert.equal(result.buildingId,planStop.buildingId);assert(result.interior);assert(result.targets.every(t=>visit.plan.stops.find(s=>s.id===t.id).floor===result.floor));}
 for(const t of result.targets){assert(Number.isFinite(t.x+t.y+t.elevation));assert(t.x>=0&&t.x<=c.w&&t.y>=0&&t.y<=c.h);assert.equal(result.hitTarget(t.x,t.y),t.id,'Wrong hit target '+c.name+'/'+t.id);}
 const intersections=[];for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++){const a=result.targets[i],b=result.targets[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(c.large?23:13))intersections.push([a.id,b.id]);}
 assert.equal(intersections.length,0,'Markers overlap: '+c.name+' '+JSON.stringify(intersections));
 checks.push({name:c.name,theme,readingMode,selected,sectionShown:result.sectionShown,targets:result.targets.length,floor:result.floor,floorLabel:result.floorLabel});
 if(!selected&&readingMode==='materials')fs.writeFileSync(out+c.name+(theme==='light'?'-light':'')+'.png',canvas.toBuffer('image/png'));
 if(c.name==='gerencia-plano'&&selected&&theme==='dark'&&readingMode==='periods')fs.writeFileSync(out+selected+'-plan.png',canvas.toBuffer('image/png'));
}
const report={pass:true,cases:checks.length,checks,limits:['Canvas system fonts may differ from loaded browser fonts.','These checks cover floor registration and interaction geometry, not browser layout or GPU rendering.']};fs.writeFileSync(out+'gerencia-map-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,cases:checks.length}));
