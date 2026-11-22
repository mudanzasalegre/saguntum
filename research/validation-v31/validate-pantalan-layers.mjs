// Exercise the production layer controller on the same group hierarchy used by
// coast.js. Geometry/rendering is tested by the scene/export validation.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as THREE from '../../dist/assets/vendor/three.module.js';
const app=fs.readFileSync('dist/js/app.js','utf8'),coast=fs.readFileSync('dist/js/coast.js','utf8'),pier=fs.readFileSync('dist/js/coast-pier.js','utf8'),contextSource=fs.readFileSync('dist/js/pantalan-context.js','utf8');
const start=app.indexOf('function applyRegionVisibility(){'),end=app.indexOf('\n}',start)+2,controller=app.slice(start,end);
assert(controller&&end>start);assert.match(coast,/group\.add\(pantalanContext\.group\)/);assert.match(pier,/tag\('vegetacion','entorno'\)/);
const group=name=>{const g=new THREE.Group();g.name=name;return g;};
const component=(parent,name)=>{const g=group(name);g.userData.component=name;parent.add(g);return g;};
const scene=group('scene'),roots=[];
const city=name=>{const parent=group(name),result={group:parent};for(const key of['buildings','roads','vegetation'])result[key]=component(parent,key);scene.add(parent);return result;};
const coastRoot=group('coast'),sites={};scene.add(coastRoot);
for(const id of ['pantalan-paseo','pantalan-maritimo','grau-vell','puerto-antiguo']){const root=group(id),currentGroup=group('current'),historicalGroup=group('historical');root.add(currentGroup,historicalGroup);coastRoot.add(root);const fabric=component(currentGroup,'fabric'),historicFabric=component(historicalGroup,'fabric'),palms=component(currentGroup,'vegetacion');historicalGroup.visible=false;sites[id]={group:root,currentGroup,historicalGroup,fabric,historicFabric,palms};}
const ctxGroup=group('coastal-context'),pantalanContext={group:ctxGroup};for(const key of['buildings','surfaces','details','vegetation'])pantalanContext[key]=component(ctxGroup,key);coastRoot.add(ctxGroup);
const waterGroup=group('coast-environment'),surface=component(waterGroup,'water'),shoreVegetation=component(waterGroup,'vegetation');scene.add(waterGroup);
const land={terrain:{group:group('marjal-terrain')},city:city('marjal-city'),heritage:{group:group('marjal-heritage'),sites:{marjal:{currentGroup:group('marjal-site'),vegetation:group('marjal-vegetation')}}},context:{group:group('marjal-context')},environment:{group:group('marjal-water'),invalidate(){}}};
for(const g of[land.terrain.group,land.heritage.group,land.context.group,land.environment.group])scene.add(g);land.heritage.group.add(land.heritage.sites.marjal.currentGroup);land.heritage.sites.marjal.currentGroup.add(land.heritage.sites.marjal.vegetation);
const layer={monuments:true,city:true,vegetation:true},coastalModes={};let invalidations=0;
const ctx={activeRegion:'coast',document:{querySelector(selector){const key=selector.match(/data-layer="([^"]+)"/)[1];return{checked:layer[key]};}},archaeologicalVisitIds:new Set(['portic','domus','circo','necropolis']),renderer:{shadowMap:{needsUpdate:false}},landscapes:{marjal:land},coastHeritage:{group:coastRoot,sites,pantalanContext},coastEnvironment:{group:waterGroup,vegetation:shoreVegetation,invalidate(){invalidations++;}},city:city('sagunto-city'),portCity:city('port-city'),coastCity:city('coastal-city'),monuments:{group:group('sagunto-monuments')},sacred:{group:group('sagunto-sacred')},civic:{group:group('sagunto-civic')},archaeology:{group:group('sagunto-archaeology')},excavation:{group:group('sagunto-excavation')},portHeritage:{group:group('port-monuments')},terrain:{group:group('sagunto-terrain')},portTerrain:{group:group('port-terrain')},coastTerrain:{group:group('coast-terrain')}};
for(const key of ['monuments','sacred','civic','archaeology','excavation','portHeritage','terrain','portTerrain','coastTerrain'])scene.add(ctx[key].group);
vm.createContext(ctx);vm.runInContext(controller,ctx);
const modeStart=coast.indexOf(' function setMode(')+1,modeEnd=coast.indexOf('\n }',modeStart)+3,nativeMode=new Function('sites','modes',`return (${coast.slice(modeStart,modeEnd)});`)(sites,coastalModes);
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const checks=[];
const check=(label,fn)=>{try{fn();checks.push({pass:true,label});}catch(error){checks.push({pass:false,label,error:error.stack||String(error)});}};
for(const phase of['current','historical'])for(const monuments of[true,false])for(const cityLayer of[true,false])for(const vegetation of[true,false]){
 const label=`coast ${phase} · monuments=${monuments} city=${cityLayer} vegetation=${vegetation}`;
 check(label,()=>{
  Object.assign(layer,{monuments,city:cityLayer,vegetation});ctx.activeRegion='coast';nativeMode('pantalan-paseo',phase);ctx.applyRegionVisibility();
  assert(visible(coastRoot),'Coast ownership root stays active for the region');
  for(const s of Object.values(sites))assert.equal(visible(s.group),monuments);
  for(const id of['pantalan-paseo','pantalan-maritimo']){const s=sites[id];assert.equal(visible(s.fabric),monuments&&phase==='current');assert.equal(visible(s.historicFabric),monuments&&phase==='historical');assert.equal(s.palms.visible,vegetation);assert.equal(visible(s.palms),monuments&&vegetation&&phase==='current');}
  for(const key of['buildings','surfaces','details'])assert.equal(visible(pantalanContext[key]),cityLayer,`Context ${key} follows city independently of monuments`);
  assert.equal(visible(pantalanContext.vegetation),vegetation);assert.equal(visible(ctx.coastCity.buildings),cityLayer);assert.equal(visible(ctx.coastCity.roads),cityLayer);assert.equal(visible(ctx.coastCity.vegetation),vegetation);assert.equal(visible(shoreVegetation),vegetation);assert(visible(surface));assert(visible(ctx.coastTerrain.group));
  assert(!visible(ctx.portHeritage.group)&&!visible(ctx.monuments.group)&&!visible(land.heritage.group));
 });
}
check('Inspection stays hidden when any display layer changes; normal water resumes independently',()=>{
 surface.visible=false;for(const key of['monuments','city','vegetation']){layer[key]=!layer[key];ctx.applyRegionVisibility();assert(!visible(surface));}surface.visible=true;ctx.applyRegionVisibility();assert(visible(surface));
});
for(const region of['sagunto','puerto','marjal'])check(`Switching to ${region} hides every coastal owner including its context and water`,()=>{
 Object.assign(layer,{monuments:true,city:true,vegetation:true});ctx.activeRegion=region;ctx.applyRegionVisibility();
 for(const g of[coastRoot,ctxGroup,waterGroup,ctx.coastCity.group,ctx.coastTerrain.group])assert(!visible(g));
 if(region==='puerto')assert(visible(ctx.portHeritage.group)&&visible(ctx.portCity.group)&&visible(ctx.portTerrain.group));
 if(region==='sagunto')assert(visible(ctx.monuments.group)&&visible(ctx.city.group)&&visible(ctx.terrain.group));
 if(region==='marjal')assert(visible(land.heritage.group)&&visible(land.city.group)&&visible(land.environment.group));
});
check('Re-entering the coast preserves historic/current choices and separate city/vegetation layers',()=>{
 ctx.activeRegion='coast';Object.assign(layer,{monuments:false,city:true,vegetation:false});nativeMode('pantalan-paseo','historical');ctx.applyRegionVisibility();
 assert(!visible(sites['pantalan-paseo'].group)&&visible(pantalanContext.buildings)&&visible(pantalanContext.surfaces)&&visible(pantalanContext.details));assert(!visible(pantalanContext.vegetation));
 layer.monuments=true;ctx.applyRegionVisibility();for(const id of['pantalan-paseo','pantalan-maritimo'])assert(!visible(sites[id].fabric)&&visible(sites[id].historicFabric));assert(invalidations>0&&ctx.renderer.shadowMap.needsUpdate);
});
const snapshots={'dist/js/app.js':app,'dist/js/coast.js':coast,'dist/js/coast-pier.js':pier,'dist/js/pantalan-context.js':contextSource};
const report={pass:checks.every(c=>c.pass),checksCount:checks.length,method:'Exact applyRegionVisibility and coast setMode functions on matching Three Object3D ownership groups; effective ancestor visibility checked; no GPU/browser assertion.',generatedAt:new Date().toISOString(),checks,sourceHashes:Object.fromEntries(Object.entries(snapshots).map(([path,text])=>[path,crypto.createHash('sha256').update(text).digest('hex')]))};
fs.writeFileSync('research/validation-v31/pantalan-layer-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:checks.length,failures:checks.filter(c=>!c.pass)},null,2));if(!report.pass)process.exitCode=1;
