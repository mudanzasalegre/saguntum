// Export the same southern Three.js meshes for an isolated geometry inspection.
// node research/validation-plaza-sur/render_southern_porticoes.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
const THREE=await import('three'),{createPlazaMayor}=await import('../../dist/js/plaza-mayor.js');
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json','utf8'));
const context=read('plaza-mayor-context');context.coreBuildings=context.coreBuildings.filter(r=>r.coreSide==='south');
const model=createPlazaMayor({project:(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}),heightAt:()=>0,contextData:context,visitData:read('plaza-mayor-visit')});
model.group.updateMatrixWorld(true);const meshes=[],typed=a=>a?{type:a.constructor.name,data:Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64')}:null;
model.group.traverse(o=>{if(!o.isMesh)return;const m=o.material;meshes.push({name:o.name,positions:typed(o.geometry.attributes.position.array),indices:typed(o.geometry.index?.array),uv:typed(o.geometry.attributes.uv?.array),colors:typed(o.geometry.attributes.color?.array),matrix:o.matrixWorld.toArray(),material:{color:m.color.toArray(),roughness:m.roughness??1,metalness:m.metalness??0,opacity:m.opacity??1,kind:o.userData.materialKind||null,orthophoto:false},component:o.userData.component||null});});
const fronts=model.group.userData.visit.qa.facades,cx=fronts.reduce((s,f)=>s+f.front.midpoint[0],0)/2,cz=fronts.reduce((s,f)=>s+f.front.midpoint[1],0)/2,nx=fronts.reduce((s,f)=>s+f.front.normal[0],0)/2,nz=fronts.reduce((s,f)=>s+f.front.normal[1],0)/2;
const cameras=[{name:'frentes-sur',position:[cx+nx*34,12,cz+nz*34],target:[cx,4.7,cz]},{name:'soportales-sur',position:[cx+nx*17,3.3,cz+nz*17],target:[cx,1.8,cz-2*nz]}];
const result={meshes,cameras,sectionRemoved:[]};fs.mkdirSync('/tmp/saguntum-plaza-ref',{recursive:true});fs.writeFileSync('/tmp/saguntum-plaza-ref/southern-geometry.json.gz',zlib.gzipSync(JSON.stringify(result)));
console.log(JSON.stringify({meshes:meshes.length,cameras}));
