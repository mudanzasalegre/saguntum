import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {drawGrauMap} from '../../dist/js/grau-map.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
import {getMapPalette} from '../../dist/js/theme.js';
const {createCanvas,GlobalFonts}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
GlobalFonts.registerFromPath('dist/assets/fonts/manrope.ttf','Manrope');GlobalFonts.registerFromPath('dist/assets/fonts/manrope-semibold.ttf','Manrope');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const visit=read('grau-visit'),plan=read('grau-plan'),cartography=read('coast-cartography'),water=read('coast-water'),heightAt=createHeightSampler(read('coast-elevation'));visit.plan=plan;
const folder='research/validation-v32/',outputs=[];
const profiles=[{name:'overview-dark',width:1100,height:800,selected:null,theme:'dark',large:true},{name:'overview-light',width:1100,height:800,selected:null,theme:'light',large:true},{name:'reading',width:1100,height:800,selected:'grau-conjunto',theme:'dark',large:true,readingMode:'periods'},{name:'tower',width:900,height:700,selected:'grau-sala-torre',theme:'dark',large:true},{name:'warehouse',width:1100,height:700,selected:'grau-memoria-portuaria',theme:'light',large:true},{name:'minimap',width:238,height:138,selected:null,theme:'dark',large:false}];
for(const spec of profiles){const canvas=createCanvas(spec.width,spec.height),result=drawGrauMap(canvas,cartography,visit,{...spec,palette:getMapPalette(spec.theme),water,heightAt});assert(result);assert.equal(result.totalStops,20);for(const t of result.targets)assert.equal(result.hitTarget(t.x,t.y),t.id);assert(result.scaleMetres>0);const file=folder+'grau-map-'+spec.name+'.png';fs.writeFileSync(file,canvas.toBuffer('image/png'));outputs.push({file,width:spec.width,height:spec.height,targets:result.targets.length,floor:result.floor,buildingId:result.buildingId,openings:result.visibleOpenings,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}
const inputs=['dist/js/grau-map.js','dist/assets/data/grau-visit.json','dist/assets/data/grau-plan.json','dist/assets/data/coast-cartography.json','dist/assets/data/coast-water.json','dist/assets/data/coast-elevation.json','dist/js/theme.js'];
fs.writeFileSync(folder+'grau-map-results.json',JSON.stringify({pass:true,method:'Production Canvas maps, exact pixel output and hit-target verification; not browser layout.',outputs,inputHashes:Object.fromEntries(inputs.map(f=>[f,createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))},null,2)+'\n');console.log(JSON.stringify({pass:true,outputs},null,2));
