// Rebuild only the Santa María fallback/minimap plan from the shipped ensemble.
import fs from 'node:fs';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
const [{createSacredHeritage},{createHeightSampler}]=await Promise.all([
 import('../../dist/js/heritage-sacred.js'),import('../../dist/js/terrain.js')
]);
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx}),querySelector:()=>({checked:true})};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('cartography'),heightAt=createHeightSampler(read('elevation')),landmarks=Object.fromEntries(read('landmarks').sites.map(s=>[s.id,s]));
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const sacred=createSacredHeritage({data,heightAt,landmarks,project,santaMariaVisit:read('santa-maria-visit'),santaMariaContext:read('santa-maria-context'),plazaContext:read('plaza-mayor-context')});
const visit=sacred.sites['santa-maria'].userData.visit;
fs.writeFileSync('dist/assets/data/santa-maria-plan.json',JSON.stringify({schemaVersion:1,...visit.plan},null,2)+'\n');
console.log(JSON.stringify({components:visit.plan.components.length,stops:visit.stats.stops,interiorViews:visit.stats.interiorViews,publicRealm:visit.qa.context.publicRealm}));
