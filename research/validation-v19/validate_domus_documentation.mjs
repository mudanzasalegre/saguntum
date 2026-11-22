// Source, geographic and interactive-plan contracts; not a survey certification.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {drawDomusMap} from '../../dist/js/domus-map.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('domus-visit'),plan=read('domus-plan'),context=read('domus-context'),geo=read('cartography');data.plan=plan;
const metadata=JSON.parse(fs.readFileSync('research/validation-v19/domus-geometry-metadata.json'));
const expected=['conjunto','acceso','museo','vestibulo','atrio','impluvium','peces','columnas','compluvium','taberna','cocina','balneum','tablinum','pinturas','umbrales','pavimentos','limites','fases','historica','entorno'].map(id=>'domus-'+id);
const sources=new Map(data.sources.map(s=>[s.id,s])),stops=new Map(data.stops.map(s=>[s.id,s])),layers=new Set(data.readingLegend.map(l=>l.id)),confidence=new Set(data.confidenceLegend.map(c=>c.id));
const checks=[],check=(label,run)=>{try{run();checks.push({label,pass:true});}catch(error){checks.push({label,pass:false,error:String(error)});}};
const cite=ids=>{assert(ids?.length);for(const id of ids)assert(sources.has(id),'Unresolved source '+id);};
const close=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a.every((x,i)=>Math.abs(x-b[i])<1e-7);
check('Twenty stable stops and five reading layers form the route',()=>{assert.deepEqual(data.stops.map(s=>s.id),expected);assert.equal(stops.size,20);assert.equal(layers.size,5);assert.equal(data.regions.length,5);});
check('Every factual claim and chronological event names its evidence',()=>{
 for(const s of data.sources){assert(/^https:\/\//.test(s.url));assert(s.title&&s.author&&s.locator&&s.note);}
 for(const s of data.stops){assert(s.title&&s.intro&&s.modelNote&&s.lookFor);cite(s.sourceIds);cite(s.coordinateSourceIds);assert(layers.has(s.readingLayer));assert(confidence.has(s.confidence));for(const f of s.facts){assert(f.text);cite(f.sourceIds);assert(confidence.has(f.confidence));}}
 for(const e of data.timeline){assert(e.date&&e.title&&e.text);assert(stops.has(e.stopId));cite(e.sourceIds);}
});
check('Each stop belongs to exactly one documentary region',()=>{const covered=[];for(const r of data.regions){cite(r.sourceIds);for(const id of r.stopIds){assert.equal(stops.get(id)?.regionId,r.id);covered.push(id);}}assert.equal(covered.length,20);assert.equal(new Set(covered).size,20);});
check('The published plan and documentary coordinates match the registered model',()=>{
 assert.equal(plan.stops.length,20);
 for(const p of plan.stops){const s=stops.get(p.id),f=metadata.focuses[p.id];assert(s&&f);assert(close(s.coordinate,p.coordinates));assert(close(p.coordinates,f.coordinates));assert.equal(s.floor,p.floor);assert.equal(s.regionId,p.regionId);assert.equal(s.readingLayer,p.readingLayer);}
 assert.equal(stops.get('domus-museo').floor,-1);assert.equal(stops.get('domus-acceso').floor,0);
 for(const key of ['baseY','surfaceY','ceilingY','deckY'])assert(Number.isFinite(data.modelRegistration[key]));
 assert.equal(data.modelRegistration.precision,'approximate');assert.equal(context.registration.archaeologicalSurvey,false);assert.equal(metadata.stats.survey,false);
});
check('Documented dimensions and disputed functions remain explicit',()=>{
 assert.deepEqual(metadata.stats.atrium,[7.31,3.5]);assert.deepEqual(metadata.stats.impluviumOuter,[4.22,2.46]);assert.deepEqual(metadata.stats.impluviumInner,[3.06,1.56]);assert.deepEqual(metadata.stats.kitchen,[3.44,3.7]);assert.deepEqual(metadata.stats.balneum,[1.94,1.36]);assert.deepEqual(metadata.stats.tablinum,[4.26,5.5]);assert.equal(metadata.stats.hypocaust,false);
 assert(JSON.stringify(stops.get('domus-balneum')).includes('disputed'));assert(JSON.stringify(stops.get('domus-tablinum')).includes('disputed'));
 assert.equal(metadata.stats.documentedArchitecturalElements,5);assert(metadata.stats.restitutedSupports>metadata.stats.documentedArchitecturalElements);
});
check('Selectable rooms never point to a missing stop',()=>{const rooms=plan.components.filter(c=>c.kind==='room');assert(rooms.length>=8);for(const r of rooms){assert(stops.has(r.stopId));assert(r.coordinates.length>=3);assert(r.floors.includes(-1));}});
const mapResults=[];
for(const size of [[740,470],[390,360]])for(const selected of ['domus-conjunto','domus-acceso','domus-impluvium','domus-tablinum'])check('Plan marker and room hit targets '+selected+'/'+size.join('x'),()=>{
 const canvas=createCanvas(...size),map=drawDomusMap(canvas,geo,data,{selected,large:true,modelGeometry:plan});assert(map?.targets.length);assert(map.targets.some(t=>t.id===selected));
 for(const t of map.targets){assert(Number.isFinite(t.x+t.y));assert.equal(map.hitTarget(t.x,t.y),t.id);}
 if(map.floor===-1){assert(map.rooms.length>=8);let roomHit=false;for(const r of map.rooms){const minX=Math.min(...r.polygon.map(p=>p.x)),maxX=Math.max(...r.polygon.map(p=>p.x)),minY=Math.min(...r.polygon.map(p=>p.y)),maxY=Math.max(...r.polygon.map(p=>p.y));for(let x=minX+3;x<maxX;x+=6)for(let y=minY+3;y<maxY;y+=6){if(map.targets.some(t=>Math.hypot(t.x-x,t.y-y)<t.r))continue;if(map.hitTarget(x,y)===r.id)roomHit=true;}}assert(roomHit,'No selectable room area beyond markers');}
 mapResults.push({selected,size,floor:map.floor,stops:map.targets.length,rooms:map.rooms.length});
 if(size[0]===740&&['domus-conjunto','domus-impluvium'].includes(selected))fs.writeFileSync('research/validation-v19/'+selected+'-plan.png',canvas.toBuffer('image/png'));
});
const report={pass:checks.every(c=>c.pass),checks:checks.length,results:checks,maps:mapResults,counts:{stops:data.stops.length,facts:data.stops.reduce((n,s)=>n+s.facts.length,0),sources:data.sources.length,timeline:data.timeline.length},limitations:['Plan coordinates and elevations are interpretive, not an archaeological survey.']};
fs.writeFileSync('research/validation-v19/domus-documentation-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks,counts:report.counts,errors:checks.filter(c=>!c.pass)},null,2));if(!report.pass)process.exitCode=1;
