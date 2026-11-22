// node --experimental-loader ./research/validate_loader.mjs research/validation-v8/validate_theatre_map_canvas.mjs
// Native Canvas QA with the real Theatre model plan and all 16 selected states.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {drawTheatreMap} from '../../dist/js/theatre-map.js';
import {createTheatre} from '../../dist/js/theatre.js';
import {getMapPalette} from '../../dist/js/theme.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const require=createRequire(import.meta.url);
let module;try{module=require('@napi-rs/canvas');}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;module=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');}
const {createCanvas,GlobalFonts}=module,root=fileURLToPath(new URL('../../',import.meta.url)),output=root+'research/validation-v8/';
const read=name=>JSON.parse(fs.readFileSync(root+'dist/assets/data/'+name+'.json','utf8'));
GlobalFonts.registerFromPath(root+'dist/assets/fonts/manrope.ttf','Manrope');
GlobalFonts.registerFromPath(root+'dist/assets/fonts/manrope-semibold.ttf','Manrope');
const cartography=read('cartography'),visit=read('theatre-visit'),heightAt=createHeightSampler(read('elevation'));
globalThis.document={createElement:name=>{if(name==='canvas')return createCanvas(1,1);throw new Error('Unexpected DOM element '+name);}};
const model=createTheatre({heightAt,data:cartography,visitData:visit});
const modelGeometry=model.userData.visit.plan;
const guardedGeometry={...modelGeometry,components:[...modelGeometry.components,{id:'invalid-point',coordinates:[-.278,39.677],period:'mixed'},{id:'invalid-nan',coordinates:[[NaN,0],[0,0],[1,1]],period:'mixed'}]};
const surfaces=[
 {id:'minimap',width:460,height:230,large:false,insets:{},showLabels:true},
 {id:'modal',width:1200,height:650,large:true,insets:{},showLabels:true},
 {id:'desktop-fallback',width:1363,height:936,large:true,insets:{left:424,right:80,top:108,bottom:80},showLabels:false},
 {id:'mobile-fallback',width:390,height:844,large:true,insets:{left:16,right:16,top:124,bottom:434},showLabels:false}
];
const selections=[null,...visit.stops.map(s=>s.id)],failures=[],scenarios=[];let checksCount=0;
const check=(value,scenario,label,detail)=>{checksCount++;if(!value)failures.push({scenario,label,detail});};
const periodKey=value=>({roman:'ancient',ancient:'ancient',modern:'modern',contemporary:'modern',mixed:'unknown',interpretation:'interpretation'}[value]||'unknown');
const luminance=hex=>{const rgb=hex.slice(1).match(/.{2}/g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
function recordingCanvas(width,height){
 const canvas=createCanvas(width,height),context=canvas.getContext('2d'),texts=[],fills=[],invalid=[];let shape=null;
 const numeric=new Set(['moveTo','lineTo','arc','rect','fillRect','clearRect']);
 const proxy=new Proxy(context,{get(target,key){
  const value=Reflect.get(target,key,target);if(typeof value!=='function')return value;
  return(...args)=>{
   if(key==='beginPath')shape=null;
   if(key==='arc')shape={x:args[0],y:args[1],radius:args[2]};
   if(key==='fill'&&shape)fills.push({...shape,color:target.fillStyle});
   if(key==='fillText')texts.push({text:String(args[0]),x:args[1],y:args[2],color:target.fillStyle});
   if(numeric.has(key)&&args.some(x=>typeof x==='number'&&!Number.isFinite(x)))invalid.push({key,args});
   return value.apply(target,args);
  };
 },set(target,key,value){return Reflect.set(target,key,value,target);}});
 canvas.getContext=kind=>kind==='2d'?proxy:null;return{canvas,texts,fills,invalid};
}
const start=Date.now();
for(const surface of surfaces)for(const theme of ['dark','light'])for(const readingMode of ['materials','periods'])for(const selected of selections){
 const id=[surface.id,theme,readingMode,selected||'none'].join('/'),palette=getMapPalette(theme),{canvas,texts,fills,invalid}=recordingCanvas(surface.width,surface.height);
 let result;try{result=drawTheatreMap(canvas,cartography,visit,{...surface,selected,heightAt,palette,readingMode,modelGeometry:guardedGeometry});}catch(error){check(false,id,'renderer completes',error.message);continue;}
 check(!!result,id,'renderer returns result');if(!result)continue;
 const targets=result.targets,expected=new Set(visit.stops.map(s=>s.id)),numericLabels=texts.filter(t=>/^\d+$/.test(t.text));
 check(targets.length===16&&new Set(targets.map(t=>t.id)).size===16&&targets.every(t=>expected.has(t.id)),id,'all 16 unique targets are present');
 check(numericLabels.length===16,id,'all numbered labels are painted');check(invalid.length===0,id,'Canvas coordinates are finite',invalid);
 check(result.components===modelGeometry.components.length&&result.components>5,id,'real model plan renders and malformed components are ignored',{actual:result.components,expected:modelGeometry.components.length});
 check(Object.values(result.bounds).every(Number.isFinite)&&result.bounds.minX<result.bounds.maxX&&result.bounds.minZ<result.bounds.maxZ,id,'world bounds are finite and positive');
 check(result.shadeCells>0&&result.shadeCells<50000,id,'terrain shading is bounded',result.shadeCells);
 const frame={left:0,right:0,top:0,bottom:0,...surface.insets},separation=surface.large?32:17;let minimumDistance=Infinity,minimumContrast=Infinity;
 for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++)minimumDistance=Math.min(minimumDistance,Math.hypot(targets[i].x-targets[j].x,targets[i].y-targets[j].y));
 check(minimumDistance+1e-7>=separation,id,'markers do not overlap',{minimumDistance,separation});
 const layerColors={ancient:palette.ancient,modern:palette.modern,unknown:palette.unknown,interpretation:palette.unknown};for(const item of visit.readingLegend)layerColors[periodKey(item.id)]=item.color;
 for(const target of targets){
  check([target.x,target.y,target.r,target.real.x,target.real.y].every(Number.isFinite),id,target.id+' target and anchor are finite');
  check(result.hitTarget(target.x,target.y)===target.id,id,target.id+' centre returns exact ID');
  check(target.x>=frame.left&&target.x<=surface.width-frame.right&&target.y>=frame.top&&target.y<=surface.height-frame.bottom,id,target.id+' marker stays in free viewport');
  const label=numericLabels.find(t=>t.text===String(target.index)),fill=fills.findLast(f=>Math.abs(f.x-target.x)<1e-5&&Math.abs(f.y-target.y)<1e-5&&f.radius===(surface.large?13:7));
  const expectedFill=target.id===selected?palette.accent:readingMode==='periods'?layerColors[periodKey(target.period)]:palette.surface;
  check(fill?.color.toLowerCase()===expectedFill.toLowerCase(),id,target.id+' marker matches supplied semantic layer and theme',{actual:fill?.color,expected:expectedFill});
  const ratio=label&&fill?contrast(label.color,fill.color):0;minimumContrast=Math.min(minimumContrast,ratio);
  check(ratio>=4.5,id,target.id+' label contrast meets 4.5:1',ratio);
 }
 if(selected){const target=targets.find(t=>t.id===selected);check(Math.hypot(target.x-target.real.x,target.y-target.real.y)<1e-8,id,'selected stop retains its geographic anchor');}
 check(result.hitTarget(-500,-500)===null,id,'outside point does not hit a stop');
 const ownFailures=failures.filter(x=>x.scenario===id);scenarios.push({id,pass:ownFailures.length===0,minimumDistance,minimumContrast,shadeCells:result.shadeCells,components:result.components});
 if(selected===null&&readingMode==='periods'&&['modal','mobile-fallback'].includes(surface.id))fs.writeFileSync(output+'theatre-map-'+surface.id+'-'+theme+'.png',canvas.toBuffer('image/png'));
}
const report={generatedAt:new Date().toISOString(),pass:failures.length===0,renderer:'@napi-rs/canvas',scenarioCount:scenarios.length,checksCount,elapsedMs:Date.now()-start,planComponents:modelGeometry.components.length,surfaces,selections,scenarios,failures};
fs.writeFileSync(output+'theatre-map-canvas-results.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(output+'theatre-map-canvas-summary.md',['# Theatre map Canvas QA','','Status: **'+(report.pass?'PASS':'FAIL')+'**. '+report.scenarioCount+' scenarios; '+checksCount+' checks.','',
 'The real model supplies '+modelGeometry.components.length+' geographic component polygons. Four target surfaces, both appearances, materials/layer modes and all 16 selected stops are exercised. Invalid point-only and non-finite components are also supplied to test the input guard.','',
 '| Surface | Size | Insets: left / right / top / bottom |','|---|---|---|',...surfaces.map(s=>'| '+s.id+' | '+s.width+' × '+s.height+' | '+['left','right','top','bottom'].map(k=>s.insets[k]||0).join(' / ')+' |'),'',
 'Checks cover finite coordinates, 16 unique markers, label collision avoidance, exact marker hit targets, frame containment, unchanged geographic anchors for every selected stop, source-controlled layer colours, text contrast of at least 4.5:1 and bounded terrain shading.','',
 'This is native Canvas and controller-level verification. Browser layout, physical clicks and WebGL rendering require their separate browser checks.','',
 ...failures.map(f=>'- '+f.scenario+': '+f.label+' '+JSON.stringify(f.detail)),''].join('\n'));
console.log(JSON.stringify({pass:report.pass,scenarioCount:report.scenarioCount,checksCount,elapsedMs:report.elapsedMs,planComponents:report.planComponents,failureCount:failures.length,failures:failures.slice(0,8)},null,2));
if(failures.length)process.exitCode=1;
