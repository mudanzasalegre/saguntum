// Real Canvas plans and click targets across viewports, themes and Barrio floors and garden.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const inputHashes=Object.fromEntries(['dist/js/barrio-map.js','dist/assets/data/barrio-plan.json','dist/assets/data/barrio-visit.json'].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
import assert from 'node:assert/strict';
import {drawBarrioMap} from '../../dist/js/barrio-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visit=read('barrio-visit');visit.plan=read('barrio-plan');const geo=read('port-cartography'),checks=[],out='research/validation-v29/';
const cases=[{name:'barrio-plano',w:1200,h:650,large:true},{name:'barrio-plano-mobile',w:370,h:315,large:true},{name:'barrio-minimap',w:360,h:210,large:false},{name:'barrio-fallback-mobile',w:507,h:1097,large:true,insets:{left:21,right:21,top:161,bottom:564},showLabels:false}];
const selections=[null,'barrio-sala','barrio-planta-alta','barrio-vivienda-esquina','barrio-seccion','barrio-calles'];
for(const c of cases)for(const theme of ['dark','light'])for(const readingMode of ['materials','periods'])for(const selected of selections){
 const canvas=createCanvas(c.w,c.h),sectionOpen=selected==='barrio-seccion',result=drawBarrioMap(canvas,geo,visit,{...c,palette:getMapPalette(theme),readingMode,selected,sectionOpen});
 assert(result);assert.equal(result.totalStops,20);assert.equal(new Set(result.targets.map(t=>t.id)).size,result.targets.length);
 if(!selected)assert.equal(result.targets.length,20,'Overview retains every stop');
 if(selected)assert(result.targets.some(t=>t.id===selected),'Selected level retains its stop');
 const planStop=visit.plan.stops.find(s=>s.id===selected);
 if(Number.isInteger(planStop?.floor)&&planStop.floor>=0){assert.equal(result.floor,planStop.floor);assert.equal(result.buildingId,planStop.buildingId);assert(result.interior);assert(result.visibleOpenings.length>0,'Interior circulation must expose registered openings');assert(result.targets.every(t=>visit.plan.stops.find(s=>s.id===t.id).floor===result.floor&&visit.plan.stops.find(s=>s.id===t.id).buildingId===result.buildingId));}
 for(const t of result.targets){assert(Number.isFinite(t.x+t.y+t.elevation));assert(t.x>=0&&t.x<=c.w&&t.y>=0&&t.y<=c.h);assert.equal(result.hitTarget(t.x,t.y),t.id,'Wrong hit target '+c.name+'/'+t.id);}
 const intersections=[];for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++){const a=result.targets[i],b=result.targets[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(c.large?23:13))intersections.push([a.id,b.id]);}
 assert.equal(intersections.length,0,'Markers overlap: '+c.name+' '+JSON.stringify(intersections));
 checks.push({name:c.name,theme,readingMode,selected,sectionShown:result.sectionShown,targets:result.targets.length,floor:result.floor,floorLabel:result.floorLabel});
 if(!selected&&readingMode==='materials')fs.writeFileSync(out+c.name+(theme==='light'?'-light':'')+'.png',canvas.toBuffer('image/png'));
 if(c.name==='barrio-plano'&&selected&&theme==='dark'&&readingMode==='periods')fs.writeFileSync(out+selected+'-plan.png',canvas.toBuffer('image/png'));
}
// Switching from a section to the upper floor must keep the selected-floor plan legible.
// The section affects 3D visibility; it must not erase the upper level from its own map.
for(const c of cases.slice(0,2)){
 const closed=createCanvas(c.w,c.h),opened=createCanvas(c.w,c.h),options={...c,selected:'barrio-planta-alta',showLabels:false};
 const a=drawBarrioMap(closed,geo,visit,{...options,sectionOpen:false}),b=drawBarrioMap(opened,geo,visit,{...options,sectionOpen:true});
 assert.equal(a.floor,1);assert.equal(b.floor,1);assert.deepEqual(opened.getContext('2d').getImageData(0,0,c.w,c.h).data,closed.getContext('2d').getImageData(0,0,c.w,c.h).data,'The open 3D section erased part of the upper floor plan');
 checks.push({name:c.name,selected:'barrio-planta-alta',sectionOpen:true,matchedClosedFloorPlan:true,targets:b.targets.length,floor:b.floor});
}
const report={pass:true,cases:checks.length,inputHashes,checks,limits:['Canvas system fonts may differ from loaded browser fonts.','These checks cover floor registration and interaction geometry, not browser layout or GPU rendering.']};fs.writeFileSync(out+'barrio-map-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,cases:checks.length}));
