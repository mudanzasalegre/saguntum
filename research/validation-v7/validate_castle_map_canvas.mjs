// Run from the repository:
// node --experimental-loader ./research/validate_loader.mjs research/validation-v7/validate_castle_map_canvas.mjs
// Uses the managed @napi-rs/canvas runtime. Does not modify application data or code.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {drawCastleMap} from '../../dist/js/castle-map.js';
import {getMapPalette} from '../../dist/js/theme.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const require = createRequire(import.meta.url);
let canvasModule;
try { canvasModule = require('@napi-rs/canvas'); }
catch (error) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  canvasModule = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/@napi-rs/canvas');
}
const {createCanvas, GlobalFonts} = canvasModule;
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = root + 'research/validation-v7/';
const read = name => JSON.parse(fs.readFileSync(root + 'dist/assets/data/' + name + '.json', 'utf8'));
GlobalFonts.registerFromPath(root + 'dist/assets/fonts/manrope.ttf', 'Manrope');
GlobalFonts.registerFromPath(root + 'dist/assets/fonts/manrope-semibold.ttf', 'Manrope');
const cartography = read('cartography'), visit = read('castle-visit');
const heightAt = createHeightSampler(read('elevation'));
const pointRegions = [{id:'armas', coordinates:[-.275,39.676], period:'unknown'}];
const surfaces = [
  {id:'minimap',width:460,height:230,large:false,insets:{},showLabels:true},
  {id:'modal',width:1200,height:650,large:true,insets:{},showLabels:true},
  {id:'desktop-fallback',width:1363,height:936,large:true,insets:{left:424,right:80,top:108,bottom:80},showLabels:false},
  {id:'mobile-fallback',width:390,height:844,large:true,insets:{left:16,right:16,top:124,bottom:434},showLabels:false}
];
const selections = [null,'foro','templo','conjunto'];
const expectedIds = new Set(visit.stops.map(s => s.id));
const checks = [], failures = [], scenarios = [];
const check = (value, scenario, label, detail) => {
  const entry = {pass:!!value,scenario,label};
  if (detail !== undefined) entry.detail = detail;
  checks.push(entry); if (!value) failures.push(entry);
};
function recordingCanvas(width,height) {
  const canvas = createCanvas(width,height), context = canvas.getContext('2d');
  const texts = [], invalid = [];
  const numericMethods = new Set(['moveTo','lineTo','arc','rect','fillRect','clearRect']);
  const proxy = new Proxy(context, {
    get(target,key) {
      const value = Reflect.get(target,key,target);
      if (typeof value !== 'function') return value;
      if (key === 'fillText') return (...args) => {
        texts.push({text:String(args[0]),x:args[1],y:args[2],fillStyle:target.fillStyle});
        if (!Number.isFinite(args[1]) || !Number.isFinite(args[2])) invalid.push({method:key,args});
        return value.apply(target,args);
      };
      if (numericMethods.has(key)) return (...args) => {
        if (args.some(a => typeof a === 'number' && !Number.isFinite(a))) invalid.push({method:key,args});
        return value.apply(target,args);
      };
      return value.bind(target);
    },
    set(target,key,value) { return Reflect.set(target,key,value,target); }
  });
  canvas.getContext = kind => kind === '2d' ? proxy : null;
  return {canvas,texts,invalid};
}
const start = Date.now();
for (const surface of surfaces) for (const theme of ['dark','light']) for (const readingMode of ['materials','periods']) for (const selected of selections) {
  const key = [surface.id,theme,readingMode,selected || 'none'].join('/');
  const palette = getMapPalette(theme), {canvas,texts,invalid} = recordingCanvas(surface.width,surface.height);
  let result;
  try {
    result = drawCastleMap(canvas,cartography,visit,{...surface,heightAt,palette,readingMode,selected,regionGeometry:pointRegions});
  } catch (error) {
    check(false,key,'render completes with point-only regionGeometry',{message:error.message,stack:error.stack});
    scenarios.push({id:key,pass:false,error:error.message}); continue;
  }
  check(!!result,key,'renderer returns a result');
  if (!result) continue;
  const targets = result.targets || [], ids = targets.map(t => t.id);
  check(targets.length === 18,key,'all 18 markers are present',targets.length);
  check(new Set(ids).size === 18 && ids.every(id => expectedIds.has(id)),key,'marker IDs are unique and correspond to all stops');
  check(invalid.length === 0,key,'Canvas drawing coordinates are finite',invalid);
  check(Object.values(result.bounds).every(Number.isFinite),key,'world bounds are finite');
  check(result.bounds.minX < result.bounds.maxX && result.bounds.minZ < result.bounds.maxZ,key,'world bounds have positive extent');
  check(Number.isFinite(result.shadeCells) && result.shadeCells > 0 && result.shadeCells < 50000,key,'terrain shading is present and bounded',result.shadeCells);
  const numericLabels = texts.filter(t => /^\d+$/.test(t.text));
  check(numericLabels.length === 18,key,'all 18 numbered labels were painted',numericLabels.length);
  const collisionPairs = [], separation = surface.large ? 32 : 17;
  let minimumDistance = Infinity;
  for (let i=0;i<targets.length;i++) for (let j=i+1;j<targets.length;j++) {
    const a = targets[i], b = targets[j], distance = Math.hypot(a.x-b.x,a.y-b.y);
    minimumDistance = Math.min(minimumDistance,distance);
    if (distance + 1e-7 < separation) collisionPairs.push({a:a.id,b:b.id,distance});
  }
  check(collisionPairs.length === 0,key,'marker centres preserve required separation',{required:separation,minimum:minimumDistance,collisions:collisionPairs});
  const insets = {left:0,right:0,top:0,bottom:0,...surface.insets};
  for (const target of targets) {
    check([target.x,target.y,target.r,target.real?.x,target.real?.y].every(Number.isFinite),key,target.id+' coordinates are finite');
    check(result.hitTarget(target.x,target.y) === target.id,key,target.id+' centre resolves to the exact ID');
    check(target.x >= insets.left && target.x <= surface.width-insets.right && target.y >= insets.top && target.y <= surface.height-insets.bottom,key,target.id+' centre stays inside the usable frame');
    const label = numericLabels.find(t => t.text === String(target.index));
    const stop = visit.stops.find(s => s.id === target.id);
    const periodKey = ({iberian:'ancient',roman:'ancient',andalusi:'medieval',medieval:'medieval',modern:'modern'}[stop.period] || 'unknown');
    const expectedColour = selected === target.id ? palette.accentInk : readingMode === 'periods' ? palette[periodKey] : palette.text;
    check(label && String(label.fillStyle).toLowerCase() === expectedColour.toLowerCase(),key,target.id+' label uses the correct theme and period colour',{actual:label?.fillStyle,expected:expectedColour});
  }
  if (selected) {
    const selectedTarget = targets.find(t => t.id === selected);
    check(selectedTarget && Math.hypot(selectedTarget.x-selectedTarget.real.x,selectedTarget.y-selectedTarget.real.y) < 1e-8,key,'selected stop remains at its actual projected position');
  }
  check(result.hitTarget(-1000,-1000) === null,key,'a distant point is not a hit');
  const ownFailures = failures.filter(f => f.scenario === key);
  scenarios.push({id:key,pass:ownFailures.length===0,markers:targets.length,minimumCentreDistance:minimumDistance,shadeCells:result.shadeCells,failures:ownFailures.map(f=>f.label)});
}
const report = {generatedAt:new Date().toISOString(),renderer:'@napi-rs/canvas',applicationModule:'dist/js/castle-map.js',pass:failures.length===0,scenarioCount:scenarios.length,checksCount:checks.length,elapsedMs:Date.now()-start,pointGeometry:pointRegions,surfaces,selections,scenarios,failures,checks};
fs.writeFileSync(output+'castle-map-canvas-results.json',JSON.stringify(report,null,2)+'\n');
const summary = ['# Castle map Canvas QA','','Status: **'+(report.pass?'PASS':'FAIL')+'**. '+report.scenarioCount+' scenarios; '+report.checksCount+' checks.','',
  'The matrix includes four target sizes, both map palettes, materials/periods modes and four selected states. Every render receives a point-only regionGeometry entry to exercise the polygon guard.','',
  '| Surface | Size | Insets (left / right / top / bottom) |','|---|---|---|',
  ...surfaces.map(s=>'| '+s.id+' | '+s.width+' × '+s.height+' | '+['left','right','top','bottom'].map(k=>s.insets[k]||0).join(' / ')+' |'),'',
  'Checks cover finite drawing and target coordinates, 18 unique markers, marker-centre separation, exact hitTarget IDs at each centre, frame containment, period/theme label colours, unchanged selected anchors and bounded terrain shading.','',
  'This is a native Canvas rendering check, not a browser layout, WebGL or pointer-event integration test. Application and model code were not modified.',''];
if(failures.length)summary.push('## Failures','',...failures.map(f=>'- '+f.scenario+': '+f.label+' — '+JSON.stringify(f.detail)), '');
fs.writeFileSync(output+'castle-map-canvas-summary.md',summary.join('\n'));
console.log(JSON.stringify({pass:report.pass,scenarioCount:report.scenarioCount,checksCount:report.checksCount,elapsedMs:report.elapsedMs,failures},null,2));
if(failures.length)process.exitCode=1;
