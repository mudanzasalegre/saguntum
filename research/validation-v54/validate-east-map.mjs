// Render the shipped canvas map in the supported viewport sizes. This checks
// real marker placement/hit testing without claiming a browser or GPU session.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {root,data,buildCastleScene} from './castle-scene.mjs';
import {drawCastleMap} from '../../dist/js/castle-map.js';
import {EAST_EXTERIOR_FEATURES} from '../../dist/js/castle-east-exterior-layout.js';
const {createHeightSampler}=await import('../../dist/js/terrain.js');

const {createCanvas,GlobalFonts}=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json')('@napi-rs/canvas');
GlobalFonts.registerFromPath(path.join(root,'dist/assets/fonts/manrope.ttf'),'Manrope');
GlobalFonts.registerFromPath(path.join(root,'dist/assets/fonts/manrope-semibold.ttf'),'Manrope');
const guide=data('castle-visit'),geo=data('cartography'),heightAt=createHeightSampler(data('elevation'));
const atlas=await buildCastleScene();
const outputDirectory=path.resolve(process.env.SAGUNTUM_CASTLE_QA_DIRECTORY||path.join(root,'research/validation-v54'));
fs.mkdirSync(outputDirectory,{recursive:true});
const scenarios=[
 {name:'mini-full',width:540,height:280,selected:null,large:false},
 {name:'mini-east',width:540,height:280,selected:'almenara-aljibes',large:false},
 {name:'wide-full',width:1180,height:638,selected:null,large:true},
 {name:'wide-east',width:1180,height:638,selected:'almenara-baluarte',large:true},
 {name:'mobile-full',width:342,height:300,selected:null,large:true},
 {name:'mobile-east',width:342,height:300,selected:'almenara-dependencias',large:true},
 {name:'mobile-east-periods',width:342,height:300,selected:'almenara-bateria',large:true,readingMode:'periods'},
 {name:'mini-east-fallback',width:540,height:280,selected:'almenara-aljibes',large:false,fallback:true},
 {name:'mobile-east-fallback',width:342,height:300,selected:'almenara-dependencias',large:true,fallback:true}
];
const results=[],panels=[];
for(const spec of scenarios){
 const canvas=createCanvas(spec.width,spec.height),attributes={};canvas.setAttribute=(key,value)=>{attributes[key]=value;};
 const plan=drawCastleMap(canvas,geo,guide,{...spec,heightAt,modelGeometry:spec.fallback?null:atlas.visit.plan,regionGeometry:atlas.visit.regions});
 assert(plan,'Shipped map returns a plan: '+spec.name);
 assert.equal(plan.mapScope,spec.selected?'east':'castle');
 if(!spec.selected)assert.equal(plan.targets.length,22,'All 22 stop numbers appear in full map');
 else assert(plan.targets.some(t=>t.id===spec.selected),'Eastern selected marker remains visible');
 assert(plan.featuresDrawn>=15,'The mapped eastern structures appear: '+spec.name);
 if(process.env.SAGUNTUM_CASTLE_PRESERVED_STOPS==='22'){
  for(const feature of EAST_EXTERIOR_FEATURES)assert(plan.featureIds.includes(feature.id),'The exterior source feature is present: '+spec.name+'/'+feature.id);
  assert.equal(plan.openingsDrawn,2,'Both mapped exterior gaps are drawn as openings');
  assert(!plan.featureIds.includes('north-round-projection'),'The v54 detached tower symbol is replaced');
 }
 let minSeparation=Infinity;
 for(const target of plan.targets){
  assert.equal(plan.hitTarget(target.x,target.y),target.id,'Marker centre chooses its own stop: '+spec.name+'/'+target.id);
  assert.equal(target.index,guide.stops.findIndex(stop=>stop.id===target.id)+1,'Retain itinerary number in local zoom');
  assert(target.x>=0&&target.x<=spec.width&&target.y>=0&&target.y<=spec.height,'Marker is inside map');
  for(const other of plan.targets)if(other!==target)minSeparation=Math.min(minSeparation,Math.hypot(target.x-other.x,target.y-other.y));
 }
 assert(minSeparation>=(spec.large?25.9:13.9),'Marker discs do not overlap: '+spec.name+' ('+minSeparation+')');
 const file='map-'+spec.name+'.png';fs.writeFileSync(path.join(outputDirectory,file),canvas.toBuffer('image/png'));
 results.push({...spec,targets:plan.targets.length,minSeparationPx:minSeparation,featuresDrawn:plan.featuresDrawn,featureIds:plan.featureIds,openingsDrawn:plan.openingsDrawn,mapScope:plan.mapScope,scaleMetres:plan.scaleMetres,aria:attributes['aria-label'],image:file});
 panels.push({spec,canvas});
}
const reset=createCanvas(540,280);
const full1=drawCastleMap(reset,geo,guide,{heightAt}),east=drawCastleMap(reset,geo,guide,{heightAt,selected:'almenara-aljibes'}),full2=drawCastleMap(reset,geo,guide,{heightAt,selected:'foro'});
assert.deepEqual(full1.bounds,full2.bounds,'Selecting a western stop restores the original full map extent');
assert(east.bounds.maxX-east.bounds.minX<full1.bounds.maxX-full1.bounds.minX,'The eastern map provides a closer plan');
const report={pass:true,method:'Actual drawCastleMap with NAPI canvas, the real model plan/regions and native hitTarget functions; 22 guide stops; two additional fallback cases without a model',scenarios:results,fullEastFullReset:true,limitations:['This is a canvas integration check; no browser event or GPU rendering is asserted.']};
fs.writeFileSync(path.join(outputDirectory,'east-map-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
