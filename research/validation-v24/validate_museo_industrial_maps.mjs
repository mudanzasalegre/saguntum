// Real Canvas plans and click targets across viewports, themes and museum levels.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {drawMuseoIndustrialMap} from '../../dist/js/museo-industrial-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visit=read('museo-industrial-visit');visit.plan=read('museo-industrial-plan');const geo=read('port-cartography'),checks=[],out='research/validation-v24/';
const cases=[{name:'museo-industrial-plano',w:1200,h:650,large:true},{name:'museo-industrial-plano-mobile',w:370,h:315,large:true},{name:'museo-industrial-minimap',w:360,h:210,large:false},{name:'museo-industrial-fallback-mobile',w:507,h:1097,large:true,insets:{left:21,right:21,top:161,bottom:564},showLabels:false}];
const selections=[null,'museo-industrial-nave-central','museo-industrial-planta-primera','museo-industrial-planta-segunda','museo-industrial-seccion','museo-industrial-entorno'];
for(const c of cases)for(const theme of ['dark','light'])for(const readingMode of ['materials','periods'])for(const selected of selections){
 const canvas=createCanvas(c.w,c.h),sectionOpen=selected==='museo-industrial-seccion',result=drawMuseoIndustrialMap(canvas,geo,visit,{...c,palette:getMapPalette(theme),readingMode,selected,sectionOpen});
 assert(result);assert.equal(result.totalStops,20);assert.equal(new Set(result.targets.map(t=>t.id)).size,result.targets.length);
 if(!selected)assert.equal(result.targets.length,20,'Overview retains every stop');
 if(selected)assert(result.targets.some(t=>t.id===selected),'Selected level retains its stop');
 const planStop=visit.plan.stops.find(s=>s.id===selected);
 if(Number.isInteger(planStop?.floor)&&planStop.floor>=0){assert.equal(result.floor,planStop.floor);assert(result.targets.every(t=>visit.plan.stops.find(s=>s.id===t.id).floor===result.floor));}
 for(const t of result.targets){assert(Number.isFinite(t.x+t.y+t.elevation));assert(t.x>=0&&t.x<=c.w&&t.y>=0&&t.y<=c.h);assert.equal(result.hitTarget(t.x,t.y),t.id,'Wrong hit target '+c.name+'/'+t.id);}
 const intersections=[];for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++){const a=result.targets[i],b=result.targets[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(c.large?23:13))intersections.push([a.id,b.id]);}
 assert.equal(intersections.length,0,'Markers overlap: '+c.name+' '+JSON.stringify(intersections));
 checks.push({name:c.name,theme,readingMode,selected,sectionShown:result.sectionShown,targets:result.targets.length,floor:result.floor,floorLabel:result.floorLabel});
 if(!selected&&readingMode==='materials')fs.writeFileSync(out+c.name+(theme==='light'?'-light':'')+'.png',canvas.toBuffer('image/png'));
 if(c.name==='museo-industrial-plano'&&selected&&theme==='dark'&&readingMode==='periods')fs.writeFileSync(out+selected+'-plan.png',canvas.toBuffer('image/png'));
}
const report={pass:true,cases:checks.length,checks,limits:['Canvas system fonts may differ from loaded browser fonts.','These checks cover floor registration and interaction geometry, not browser layout or GPU rendering.']};fs.writeFileSync(out+'museo-industrial-map-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,cases:checks.length}));
