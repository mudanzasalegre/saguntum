// Source links, two-sector geography, model registration, and selectable map plans.
// This validates canvas hit targets; browser framing and WebGL are separate gates.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {drawNecropolisMap} from '../../dist/js/necropolis-map.js';
const {createCanvas,GlobalFonts}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
GlobalFonts.registerFromPath('dist/assets/fonts/manrope.ttf','Manrope');
GlobalFonts.registerFromPath('dist/assets/fonts/manrope-semibold.ttf','Manrope');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('necropolis-visit'),plan=read('necropolis-plan'),context=read('necropolis-context'),geo=read('cartography');data.plan=plan;
const metadata=JSON.parse(fs.readFileSync('research/validation-v21/necropolis-geometry-metadata.json'));
const expected=['conjunto','acceso','fosas','losas','mamposteria','orientacion','niveles','limites','historica','ladera','hipogeos','entradas','umbral','camara','hornacina','roca','techo','transformaciones','contexto','memoria'].map(id=>'necro-'+id);
const sources=new Map(data.sources.map(s=>[s.id,s])),stops=new Map(data.stops.map(s=>[s.id,s])),layers=new Set(data.readingLegend.map(l=>l.id)),confidence=new Set(data.confidenceLegend.map(c=>c.id));
const checks=[],check=(label,run)=>{try{run();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:String(error)});}};
const cite=ids=>{assert(ids?.length);for(const id of ids)assert(sources.has(id),'Unresolved source '+id);};
const close=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a.every((x,i)=>Math.abs(x-b[i])<1e-7);
const project=([lon,lat])=>[(lon+.278)*111320*Math.cos(39.679*Math.PI/180),(39.679-lat)*111320];
check('Twenty stable stop IDs, five themes and two independent groups of ten',()=>{
 assert.deepEqual(data.stops.map(s=>s.id),expected);assert.equal(stops.size,20);assert.equal(layers.size,5);assert.equal(data.regions.length,5);
 assert.deepEqual([...layers],['funeraria','rupestre','transformaciones','contemporanea','interpretacion']);
 for(const sector of ['cementerio','hipogeos']){const group=data.stops.filter(s=>s.archFocus===sector);assert.equal(group.length,10);assert(group.every(s=>s.mapScope===sector));}
 assert.deepEqual(data.sectorOverviews,{cementerio:'necro-conjunto',hipogeos:'necro-hipogeos'});
 assert.deepEqual(data.historicalStops,{cementerio:'necro-historica',hipogeos:'necro-transformaciones'});
});
check('Every claim, location reference and chronological event resolves to evidence',()=>{
 assert.equal(sources.size,data.sources.length);assert(sources.size>=8);assert(data.timeline.length>=8);
 for(const s of data.sources){assert(/^https:\/\//.test(s.url));assert(s.title&&s.author&&s.locator&&s.note);}
 for(const s of data.stops){assert(s.title&&s.intro&&s.modelNote&&s.lookFor);cite(s.sourceIds);cite(s.coordinateSourceIds);assert(layers.has(s.readingLayer));assert(confidence.has(s.confidence));assert(s.facts.length>=1);for(const f of s.facts){assert(f.text);cite(f.sourceIds);assert(confidence.has(f.confidence));}}
 for(const e of data.timeline){assert(e.date&&e.title&&e.text);assert(stops.has(e.stopId));cite(e.sourceIds);}
});
check('Every stop belongs to exactly one documentary region',()=>{
 const covered=[];for(const r of data.regions){cite(r.sourceIds);for(const id of r.stopIds){assert.equal(stops.get(id)?.regionId,r.id);covered.push(id);}}
 assert.equal(covered.length,20);assert.equal(new Set(covered).size,20);
});
check('Published locations match final model focuses in the correct sector',()=>{
 assert.equal(plan.stops.length,20);assert.equal(new Set(plan.stops.map(s=>s.id)).size,20);
 for(const p of plan.stops){const s=stops.get(p.id),f=metadata.focuses[p.id];assert(s&&f);assert(close(s.coordinate,s.coordinates));assert(close(s.coordinate,p.coordinates));assert(close(p.coordinates,f.coordinates));assert.equal(s.mapScope,p.mapScope);assert.equal(s.archFocus,p.archFocus);assert.equal(s.regionId,p.regionId);assert.equal(s.readingLayer,p.readingLayer);assert(s.coordinate.every(Number.isFinite));assert.equal(s.coordinateConfidence,'approximate');}
 assert.equal(data.modelRegistration.precision,'approximate');assert.equal(data.modelRegistration.provisionalCoordinates,false);
 assert.equal(metadata.qa.cemetery.individualSurvey,false);assert.equal(metadata.qa.hypogea.interiorSurvey,false);assert.equal(metadata.qa.archaeologyElevationSurvey,false);assert.equal(metadata.qa.cemetery.analyticalProfile.measured,false);
});
check('Territorial plan preserves separation and cannot imply a continuous excavation',()=>{
 assert.equal(plan.sectors.length,2);assert.deepEqual(plan.sectors.map(s=>s.id),['cementerio','hipogeos']);
 const [a,b]=plan.sectors.map(s=>{assert(s.outline.length>=3);assert(s.outline.every(p=>p.length===2&&p.every(Number.isFinite)));return project(s.coordinate);});
 const distance=Math.hypot(a[0]-b[0],a[1]-b[1]);assert(distance>180&&distance<210);assert.equal(metadata.qa.continuousExcavation,false);
 for(const sector of plan.sectors){assert.equal(plan.stops.filter(s=>s.mapScope===sector.id).length,10);assert(plan.components.some(c=>c.scope===sector.id));}
 assert(context.sharedContext);assert.match(plan.note,/separad|independ|continua/i);
});
check('Cavity interpretation and modern closure have explicit uncertainty',()=>{
 for(const id of ['necro-historica','necro-camara','necro-hornacina','necro-transformaciones']){const s=stops.get(id);assert(['interpretive','disputed'].includes(s.confidence));assert(s.modelNote.length>50);}
 assert.equal(metadata.qa.hypogea.modernDoor.ancient,false);assert.equal(metadata.qa.hypogea.modernDoor.individualLocationVerified,false);
 assert.match(stops.get('necro-entradas').modelNote,/contemporáneo/);assert(stops.get('necro-transformaciones').period!=='medieval');
 assert(data.methodology.some(s=>/planimetría|topográfic|interpret/i.test(s)));
});
check('Selectable grave and chamber areas resolve to declared local stops',()=>{
 const areas=plan.components.filter(c=>c.stopId);assert(areas.length>=8);
 for(const c of areas){assert(stops.has(c.stopId),'Unknown component stop '+c.stopId);assert(c.coordinates.length>=1);assert.equal(stops.get(c.stopId).mapScope,c.scope,'Component crosses documentary sector '+c.id);}
});
const mapResults=[];
const selections=[null,'necro-conjunto','necro-acceso','necro-fosas','necro-historica','necro-hipogeos','necro-camara','necro-hornacina','necro-contexto'];
for(const size of [[740,470],[390,360],[303,300]])for(const selected of selections)check('Map hit targets '+(selected||'territorio')+'/'+size.join('x'),()=>{
 const canvas=createCanvas(...size),map=drawNecropolisMap(canvas,geo,data,{selected,large:true,modelGeometry:plan});assert(map?.targets.length);
 const expectedScope=selected?stops.get(selected).mapScope:'territorio';assert.equal(map.mapScope,expectedScope);assert.equal(map.targets.length,selected?10:2);
 if(selected)assert(map.targets.some(t=>t.id===selected));else assert.deepEqual(new Set(map.targets.map(t=>t.id)),new Set(Object.values(data.sectorOverviews)));
 for(const t of map.targets){assert(Number.isFinite(t.x+t.y));assert(t.x>=0&&t.x<size[0]&&t.y>=0&&t.y<size[1],'Out-of-canvas target '+t.id);assert.equal(map.hitTarget(t.x,t.y),t.id,'Ambiguous marker '+t.id);if(selected)assert.equal(stops.get(t.id).mapScope,expectedScope);}
 mapResults.push({selected,size,scope:map.mapScope,stops:map.targets.length,areas:map.rooms.length,scaleMetres:map.scaleMetres});
 if(size[0]===740&&[null,'necro-conjunto','necro-hipogeos'].includes(selected))fs.writeFileSync('research/validation-v21/'+(selected||'necro-territorio')+'-plan.png',canvas.toBuffer('image/png'));
 if(size[0]===303&&selected==='necro-camara')fs.writeFileSync('research/validation-v21/necropolis-mobile-plan.png',canvas.toBuffer('image/png'));
});
for(const selected of ['necro-conjunto','necro-hipogeos'])check('Specific nested areas remain selectable inside their enclosing sector '+selected,()=>{
 const canvas=createCanvas(1400,1000),map=drawNecropolisMap(canvas,geo,data,{selected,large:true,modelGeometry:plan});
 const wanted=selected==='necro-conjunto'?['necro-fosas','necro-losas']:['necro-camara','necro-techo'];
 for(const id of wanted){const areas=map.rooms.filter(r=>r.id===id);assert(areas.length,'Missing selectable polygon '+id);let found=false;
 for(const r of areas){const xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y);for(let x=Math.min(...xs)+1;x<Math.max(...xs)&&!found;x+=2)for(let y=Math.min(...ys)+1;y<Math.max(...ys)&&!found;y+=2){if(map.targets.some(t=>Math.hypot(t.x-x,t.y-y)<t.r))continue;if(map.hitTarget(x,y)===id)found=true;}}
 assert(found,'No accessible polygon hit beyond markers for '+id);
 }
});
const report={pass:checks.every(c=>c.pass),checks:checks.length,results:checks,maps:mapResults,counts:{stops:data.stops.length,facts:data.stops.reduce((n,s)=>n+s.facts.length,0),sources:data.sources.length,timeline:data.timeline.length,sectors:plan.sectors.length},limitations:['Both sector anchors and scene elevations are approximate. Grave and chamber arrangement is typological, not an archaeological survey.','Canvas targets are tested here; browser layout, mobile controls and WebGL camera views require separate visual review.']};
fs.writeFileSync('research/validation-v21/necropolis-documentation-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:report.checks,counts:report.counts,errors:checks.filter(c=>!c.pass)},null,2));if(!report.pass)process.exitCode=1;
