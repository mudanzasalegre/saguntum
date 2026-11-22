// Verify geographic/elevation interaction, theme legibility and marker hit targets.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {drawTalleresMap} from '../../dist/js/talleres-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visit=read('talleres-visit');visit.plan=read('talleres-plan');const geo=read('port-cartography'),checks=[],out='research/validation-v23/';
const cases=[{name:'talleres-planta-recinto',w:1200,h:650,large:true},{name:'talleres-planta-mobile',w:370,h:315,large:true},{name:'talleres-minimap',w:360,h:210,large:false},{name:'talleres-fallback-mobile',w:507,h:1097,large:true,insets:{left:21,right:21,top:161,bottom:564},showLabels:false}];
for(const c of cases)for(const theme of ['dark','light'])for(const readingMode of ['materials','periods'])for(const selected of [null,'talleres-interior','talleres-cerchas','talleres-entorno']){
 const canvas=createCanvas(c.w,c.h),result=drawTalleresMap(canvas,geo,visit,{...c,palette:getMapPalette(theme),readingMode,selected,sectionOpen:selected==='talleres-interior'});
 assert.equal(result.targets.length,20);assert(result.naves===4);assert.equal(new Set(result.targets.map(t=>t.id)).size,20);
 for(const t of result.targets){assert(Number.isFinite(t.x+t.y+t.elevation));assert(t.x>=0&&t.x<=c.w&&t.y>=0&&t.y<=c.h);assert.equal(result.hitTarget(t.x,t.y),t.id,'Wrong hit target '+c.name+'/'+t.id);}
 const intersections=[];for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++){const a=result.targets[i],b=result.targets[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(c.large?23:13))intersections.push([a.id,b.id]);}
 assert.equal(intersections.length,0,'Markers overlap: '+c.name+' '+JSON.stringify(intersections));
 checks.push({name:c.name,theme,readingMode,selected,sectionShown:result.sectionShown,targets:result.targets.length,naves:result.naves});
 if(!selected&&readingMode==='materials')fs.writeFileSync(out+c.name+(theme==='light'?'-light':'')+'.png',canvas.toBuffer('image/png'));
 if(c.name==='talleres-planta-recinto'&&selected==='talleres-interior'&&theme==='dark'&&readingMode==='periods')fs.writeFileSync(out+'talleres-planta-section.png',canvas.toBuffer('image/png'));
}
const report={pass:true,cases:checks.length,checks};fs.writeFileSync(out+'talleres-map-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,cases:checks.length}));
