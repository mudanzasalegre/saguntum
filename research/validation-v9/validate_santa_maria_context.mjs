// Focused source, terrain, disposal and native Canvas checks for the V9 context.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {createSantaMariaContext} from '../../dist/js/santa-maria-context.js';
import {createSantaMaria} from '../../dist/js/santa-maria.js';
import {drawSantaMariaMap} from '../../dist/js/santa-maria-map.js';
import {createHeightSampler,buildTerrainGeometry} from '../../dist/js/terrain.js';
import {createUrbanSurface} from '../../dist/js/urban-surface.js';
import {createCivicHeritage} from '../../dist/js/heritage-civic.js';
import {getMapPalette} from '../../dist/js/theme.js';
const require=createRequire(import.meta.url),{createCanvas,GlobalFonts}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(256,256)};
GlobalFonts.registerFromPath('dist/assets/fonts/manrope.ttf','Manrope');GlobalFonts.registerFromPath('dist/assets/fonts/manrope-semibold.ttf','Manrope');
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json')),data=read('cartography'),elevation=read('elevation'),landmarks=Object.fromEntries(read('landmarks').sites.map(s=>[s.id,s])),contextData=read('santa-maria-context'),visitData=read('santa-maria-visit'),heightAt=createHeightSampler(elevation),project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const church=createSantaMaria({record:landmarks['santa-maria'],project,heightAt,visitData}),context=createSantaMariaContext({data,landmarks,project,heightAt,contextData,churchFrame:church.frame}),civic=createCivicHeritage({data,landmarks,project,heightAt});
const patches=[...church.patches,...context.patches,...civic.patches],urban=createUrbanSurface({data:{...data,roads:data.roads.filter(r=>!context.excludedRoadIds.has(String(r.id)))},project,heightAt,patches,exclusions:[...context.exclusions,...civic.exclusions]}),terrain=buildTerrainGeometry(elevation,urban.groundHeight,patches);
context.bindGround(terrain.meshHeightAt);church.group.userData.visit.bindGround(terrain.meshHeightAt);
const checks=[],failures=[],check=(value,label,detail)=>{checks.push({pass:!!value,label});if(!value)failures.push({label,detail});};
const plan={...church.group.userData.visit.plan,components:[...church.group.userData.visit.plan.components,...context.plan.components]};
check(context.stats.buildingParts===44&&context.stats.parentParcels===16,'44 source building parts in 16 immediate parcels');
check(contextData.buildings.every(b=>JSON.stringify(b.coordinates)===JSON.stringify(data.buildings.find(s=>s.id===b.id)?.coordinates)),'source coordinates are copied unchanged');
check(contextData.buildings.every(b=>JSON.stringify(b.holes)===JSON.stringify(data.buildings.find(s=>s.id===b.id)?.holes)),'source courtyard rings are copied unchanged');
check(context.stats.sourceHeight+context.stats.ignHeight+context.stats.storeyHeight===44&&context.stats.fallbackHeight===0,'every context height retains an attributed source or storey derivation',context.stats);
check(context.qa.northStair.pretil==='solid masonry'&&context.stats.inscriptionPanels===2,'documented solid pretil and two exterior blocks are represented');
check(context.qa.stairSurfaces.every(s=>s.y-terrain.meshHeightAt(s.x,s.z)>.04),'every northern stair tread clears final rendered terrain',context.qa.stairSurfaces.filter(s=>s.y-terrain.meshHeightAt(s.x,s.z)<=.04));
let finite=true,meshes=0,triangles=0,pavingSamples=0,buriedPaving=0,minClearance=Infinity;const buriedDetails=[];
context.group.updateMatrixWorld(true);
context.group.traverse(o=>{
 if(!o.isMesh)return;meshes++;triangles+=o.geometry.attributes.position.count/3;
 for(const a of Object.values(o.geometry.attributes))for(const n of a.array)if(!Number.isFinite(n))finite=false;
 if(o.userData.materialKind!=='paving')return;
 const p=o.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,clearance=y-terrain.meshHeightAt(x,z);pavingSamples++;minClearance=Math.min(minClearance,clearance);if(clearance<-.08){buriedPaving++;buriedDetails.push({mesh:o.name,x,z,y,clearance});}}
});
check(finite,'all context geometry attributes are finite');check(buriedPaving===0,'street and forecourt pavement remains above final terrain',{pavingSamples,buriedPaving,minClearance,buriedDetails});
const expectedContextIds=['santa-maria-escalinata','santa-maria-cavallers','santa-maria-sagrario','santa-maria-plaza-mayor','santa-maria-berenguer'];check(expectedContextIds.every(id=>context.focuses[id]?.target?.isVector3),'all five context visit focuses resolve');
const second=createSantaMariaContext({data,landmarks,project,heightAt,contextData,churchFrame:church.frame}),firstMaterials=new Set(context.ownedResources.materials),firstTextures=new Set(context.ownedResources.textures);
check(second.ownedResources.materials.every(m=>!firstMaterials.has(m))&&second.ownedResources.textures.every(t=>!firstTextures.has(t)),'independent context instances share no disposable materials or textures');
const original=context.ownedResources.materials.map(m=>({m,c:m.color.clone(),map:m.map,vertexColors:m.vertexColors}));context.selectFocus('santa-maria-escalinata');context.setReadingMode('periods');context.selectFocus(null);context.setReadingMode('materials');check(original.every(({m,c,map,vertexColors})=>m.color.equals(c)&&m.map===map&&m.vertexColors===vertexColors),'period and focus selection restore material state');second.dispose();check(second.ownedResources.materials.length===0&&context.ownedResources.materials.length>0,'disposing one instance leaves the other intact');

const scenarios=[],surfaces=[{id:'desktop-minimap',width:460,height:240,large:false,selected:null},{id:'desktop-plan',width:1100,height:700,large:true,selected:'santa-maria-escalinata'},{id:'mobile-plan',width:300,height:320,large:true,selected:'santa-maria-sagrario'}];
const malformed=[{id:'bad-point',coordinates:[-.279,39.679]},{id:'bad-nan',coordinates:[[NaN,0],[0,0],[1,1]]}];
const luminance=hex=>{const c=hex.slice(1).match(/.{2}/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const surface of surfaces)for(const theme of['dark','light']){
 const canvas=createCanvas(surface.width,surface.height),ctx=canvas.getContext('2d'),texts=[],fills=[];let arc=null;
 const proxy=new Proxy(ctx,{get(t,k){const value=Reflect.get(t,k,t);if(typeof value!=='function')return value;return(...args)=>{if(k==='beginPath')arc=null;if(k==='arc')arc={x:args[0],y:args[1],r:args[2]};if(k==='fill'&&arc)fills.push({...arc,color:t.fillStyle});if(k==='fillText')texts.push({text:String(args[0]),x:args[1],y:args[2],color:t.fillStyle});return value.apply(t,args);};},set(t,k,v){return Reflect.set(t,k,v,t);}});canvas.getContext=()=>proxy;
 const palette=getMapPalette(theme),result=drawSantaMariaMap(canvas,data,visitData,{...surface,heightAt:terrain.meshHeightAt,palette,readingMode:'periods',modelGeometry:{...plan,components:[...plan.components,...malformed]}}),scenario=surface.id+'/'+theme;
 check(!!result,scenario+' returns a map');if(!result)continue;
 check(result.targets.length===visitData.stops.length&&new Set(result.targets.map(t=>t.id)).size===visitData.stops.length,scenario+' has every unique stop');
 check(result.components===plan.components.length&&result.outlineSource==='santa-maria-plan',scenario+' uses the real church/context geometry and ignores malformed components');
 let minimumDistance=Infinity,minimumContrast=Infinity;
 for(let i=0;i<result.targets.length;i++)for(let j=i+1;j<result.targets.length;j++)minimumDistance=Math.min(minimumDistance,Math.hypot(result.targets[i].x-result.targets[j].x,result.targets[i].y-result.targets[j].y));
 check(minimumDistance>=(surface.large?32:17)-.0001,scenario+' stop markers are separated',minimumDistance);
 for(const target of result.targets){check(result.hitTarget(target.x,target.y)===target.id,scenario+' hit centre '+target.id);check([target.x,target.y,target.real.x,target.real.y].every(Number.isFinite),scenario+' finite target '+target.id);const label=texts.find(t=>t.text===String(target.index)),fill=fills.findLast(f=>Math.abs(f.x-target.x)<.0001&&Math.abs(f.y-target.y)<.0001&&f.r===(surface.large?13:7));if(label&&fill)minimumContrast=Math.min(minimumContrast,contrast(label.color,fill.color));}
 check(minimumContrast>=4.5,scenario+' all marker text meets 4.5:1 contrast',minimumContrast);
 if(surface.selected){const target=result.targets.find(t=>t.id===surface.selected);check(target&&Math.hypot(target.x-target.real.x,target.y-target.real.y)<.001,scenario+' selected marker preserves source position');}
 check(!texts.some(t=>t.text.includes('TEATRO')),scenario+' contains no theatre label');
 scenarios.push({id:scenario,targets:result.targets.length,components:result.components,minimumDistance,minimumContrast,shadeCells:result.shadeCells});
 fs.writeFileSync('research/validation-v9/santa-maria-map-'+surface.id+'-'+theme+'.png',canvas.toBuffer('image/png'));
}
const result={pass:failures.length===0,stats:context.stats,geometry:{meshes,triangles,pavingSamples,buriedPaving,minClearance},scenarioCount:scenarios.length,scenarios,checks,failures,limitations:context.qa.limitations};
fs.writeFileSync('research/validation-v9/santa-maria-context-qa.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:result.pass,stats:result.stats,geometry:result.geometry,scenarios:result.scenarioCount,checks:checks.length,failures},null,2));
if(failures.length)process.exitCode=1;
