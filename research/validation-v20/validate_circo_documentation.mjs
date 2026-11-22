// Validate evidence links, registered locations, and both selectable map scales.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {drawCircoMap} from '../../dist/js/circo-map.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('circo-visit'),plan=read('circo-plan'),context=read('circo-context'),geo=read('cartography');data.plan=plan;
const metadata=JSON.parse(fs.readFileSync('research/validation-v20/circo-geometry-metadata.json'));
const expected=['conjunto','acceso','puerta','vano','sillares','umbral','coronacion','interior','muros','tribuna','escaleras','estratos','arena','spina','metae','graderio','historica','carceres','fases','entorno'].map(id=>'circo-'+id);
const sources=new Map(data.sources.map(s=>[s.id,s])),stops=new Map(data.stops.map(s=>[s.id,s])),layers=new Set(data.readingLegend.map(l=>l.id)),confidence=new Set(data.confidenceLegend.map(c=>c.id));
const checks=[],check=(label,run)=>{try{run();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:String(error)});}};
const cite=ids=>{assert(ids?.length);for(const id of ids)assert(sources.has(id),'Unresolved source '+id);};
const close=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a.every((x,i)=>Math.abs(x-b[i])<1e-7);
check('Twenty stable stops and five reading layers form the route',()=>{assert.deepEqual(data.stops.map(s=>s.id),expected);assert.equal(stops.size,20);assert.equal(layers.size,5);assert.equal(data.regions.length,5);});
check('Every factual claim and chronological event resolves to its evidence',()=>{
 for(const s of data.sources){assert(/^https:\/\//.test(s.url));assert(s.title&&s.author&&s.locator&&s.note);}
 for(const s of data.stops){assert(s.title&&s.intro&&s.modelNote&&s.lookFor);cite(s.sourceIds);cite(s.coordinateSourceIds);assert(layers.has(s.readingLayer));assert(confidence.has(s.confidence));for(const f of s.facts){assert(f.text);cite(f.sourceIds);assert(confidence.has(f.confidence));}}
 for(const e of data.timeline){assert(e.date&&e.title&&e.text);assert(stops.has(e.stopId));cite(e.sourceIds);}
});
check('Each stop belongs to exactly one documentary region',()=>{const covered=[];for(const r of data.regions){cite(r.sourceIds);for(const id of r.stopIds){assert.equal(stops.get(id)?.regionId,r.id);covered.push(id);}}assert.equal(covered.length,20);assert.equal(new Set(covered).size,20);});
check('Published plan coordinates match the documentary and registered physical focuses',()=>{
 assert.equal(plan.stops.length,20);
 for(const p of plan.stops){const s=stops.get(p.id),f=metadata.focuses[p.id];assert(s&&f);assert(close(s.coordinate,p.coordinates));assert(close(p.coordinates,f.coordinates));assert.equal(s.mapScope,p.mapScope);assert.equal(s.regionId,p.regionId);assert.equal(s.readingLayer,p.readingLayer);}
 assert.equal(data.modelRegistration.precision,'approximate');assert.match(context.registration.gatePlacementNote,/not an architectural survey/);assert.equal(metadata.stats.survey,false);
 assert(plan.outline.length>=3);assert(plan.circusOutline.length>=8);assert(plan.components.some(c=>c.scope==='circus'));
 assert.equal(plan.stops.filter(s=>s.mapScope==='circus').length,6);
});
check('Interpretive closure and upper architecture retain explicit uncertainty',()=>{
 for(const id of ['circo-coronacion','circo-carceres','circo-graderio']){const s=stops.get(id);assert(['interpretive','disputed'].includes(s.confidence));assert(s.modelNote.length>50);}
 assert(sources.size>=5);assert(data.methodology.some(s=>/aproxim|topogr|interpret/i.test(s)));
});
check('Selectable archaeological areas resolve to declared stops',()=>{const areas=plan.components.filter(c=>c.stopId);assert(areas.length>=5);for(const c of areas){assert(stops.has(c.stopId));assert(c.coordinates.length>=1);}});
const mapResults=[];
for(const size of [[740,470],[390,360],[303,300]])for(const selected of ['circo-conjunto','circo-puerta','circo-tribuna','circo-historica','circo-carceres'])check('Map marker hit targets '+selected+'/'+size.join('x'),()=>{
 const canvas=createCanvas(...size),map=drawCircoMap(canvas,geo,data,{selected,large:true,modelGeometry:plan});assert(map?.targets.length);assert(map.targets.some(t=>t.id===selected));
 for(const t of map.targets){assert(Number.isFinite(t.x+t.y));assert(t.x>=0&&t.x<size[0]&&t.y>=0&&t.y<size[1]);assert.equal(map.hitTarget(t.x,t.y),t.id);}
 const expectedScope=['circo-historica','circo-carceres'].includes(selected)?'circus':'gate';assert.equal(map.mapScope,expectedScope);assert.equal(map.targets.length,expectedScope==='circus'?7:14);
 mapResults.push({selected,size,scope:map.mapScope,stops:map.targets.length,areas:map.rooms.length,scaleMetres:map.scaleMetres});
 if(size[0]===740&&['circo-conjunto','circo-historica'].includes(selected))fs.writeFileSync('research/validation-v20/'+selected+'-plan.png',canvas.toBuffer('image/png'));
 if(size[0]===303&&selected==='circo-historica')fs.writeFileSync('research/validation-v20/circo-mobile-plan.png',canvas.toBuffer('image/png'));
});
for(const selected of ['circo-conjunto','circo-historica'])check('Nested archaeological areas remain selectable '+selected,()=>{
 const canvas=createCanvas(1000,760),map=drawCircoMap(canvas,geo,data,{selected,large:true,modelGeometry:plan});
 const wanted=selected==='circo-historica'?['circo-arena','circo-spina']:['circo-puerta','circo-tribuna'];
 for(const id of wanted){const areas=map.rooms.filter(r=>r.id===id);assert(areas.length);let found=false;
 for(const r of areas){const xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y);for(let x=Math.min(...xs)+1;x<Math.max(...xs)&&!found;x+=2)for(let y=Math.min(...ys)+1;y<Math.max(...ys)&&!found;y+=2){if(map.targets.some(t=>Math.hypot(t.x-x,t.y-y)<t.r))continue;if(map.hitTarget(x,y)===id)found=true;}}
 assert(found,'No accessible polygon hit beyond markers for '+id);
 }
});
const report={pass:checks.every(c=>c.pass),checks:checks.length,results:checks,maps:mapResults,counts:{stops:data.stops.length,facts:data.stops.reduce((n,s)=>n+s.facts.length,0),sources:data.sources.length,timeline:data.timeline.length},limitations:['Plan coordinates and elevations are approximate, not a cadastral boundary or archaeological survey.']};
fs.writeFileSync('research/validation-v20/circo-documentation-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks,counts:report.counts,errors:checks.filter(c=>!c.pass)},null,2));if(!report.pass)process.exitCode=1;
