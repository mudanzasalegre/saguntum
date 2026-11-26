// CPU construction of the shipped theatre and its final Atlas ground.
// This facade permits CanvasTexture construction; it does not emulate WebGL.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {registerThreeTestLoader} from '../three-test-loader.mjs';
registerThreeTestLoader();
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const data=name=>JSON.parse(fs.readFileSync(path.join(root,'dist/assets/data',name+'.json'),'utf8'));
export const THREE=await import('three');
export const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});

export async function buildTheatreScene({context=false,rasterTextures=false}={}){
 const gradient={addColorStop(){}};
 const ctx=new Proxy({measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},
  {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const previous=globalThis.document;
 const canvas=rasterTextures?createRequire((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||path.join(root,'node_modules'))+'/package.json')('@napi-rs/canvas'):null;
 globalThis.document={createElement:()=>canvas?canvas.createCanvas(512,512):({width:512,height:512,getContext:()=>ctx}),querySelector:()=>({checked:true})};
 try{
  const [{createMonuments,theatreRoadIds,theatreBuildingIds},{createHeightSampler,buildTerrainGeometry},
   {createSacredHeritage},{createCivicHeritage},{createUrbanSurface},{createCity},{createArchaeology}]=await Promise.all([
   import('../../dist/js/monuments.js'),import('../../dist/js/terrain.js'),import('../../dist/js/heritage-sacred.js'),
   import('../../dist/js/heritage-civic.js'),import('../../dist/js/urban-surface.js'),import('../../dist/js/city.js'),
   import('../../dist/js/archaeology.js')]);
  const geo=data('cartography'),elevation=data('elevation'),guide=data('theatre-visit'),landmarkData=data('landmarks');
  const landmarks=Object.fromEntries(landmarkData.sites.map(site=>[site.id,site]));
  const heightAt=createHeightSampler(elevation),started=performance.now();
  const monuments=createMonuments({heightAt,project,data:geo,castleVisit:data('castle-visit'),theatreVisit:guide,deferCastle:true});
  const theatre=monuments.theatre,visit=theatre.userData.visit;
  const buildMs=performance.now()-started;
  const sacred=createSacredHeritage({heightAt,project,landmarks,data:geo,santaMariaVisit:data('santa-maria-visit'),
   santaMariaContext:data('santa-maria-context'),plazaContext:data('plaza-mayor-context'),
   calvarioVisit:data('calvario-visit'),calvarioContext:data('calvario-context'),berenguerContext:data('berenguer-context'),
   sangreVisit:data('sangre-visit'),sangreContext:data('sangre-context'),salvadorVisit:data('salvador-visit'),salvadorContext:data('salvador-context')});
  const civic=createCivicHeritage({heightAt,project,landmarks,data:geo,plazaVisit:data('plaza-mayor-visit'),plazaContext:data('plaza-mayor-context'),
   juderiaVisit:data('juderia-visit'),juderiaContext:data('juderia-context'),berenguerVisit:data('berenguer-visit'),
   berenguerContext:data('berenguer-context'),museoVisit:data('museo-visit'),museoContext:data('museo-context')});
  const records=Object.fromEntries(['archaeology-public','archaeology-domestic','archaeology-necropolis'].flatMap(name=>data(name).sites).map(site=>[site.id,site]));
  const archaeology=createArchaeology({heightAt,project,records,data:geo,dianaSite:civic.dianaSite,
   porticVisit:data('portic-visit'),porticContext:data('portic-context'),domusVisit:data('domus-visit'),domusContext:data('domus-context'),
   circoVisit:data('circo-visit'),circoContext:data('circo-context'),necropolisVisit:data('necropolis-visit'),necropolisContext:data('necropolis-context')});
  const patches=[...sacred.patches,...civic.patches,...archaeology.patches];
  const exclusions=[...sacred.exclusions,...civic.exclusions,...archaeology.exclusions];
  const roads=new Set(['733321149','733321150','1419281599',...theatreRoadIds,...monuments.castleRoadIds,
   ...sacred.excludedRoadIds,...civic.excludedRoadIds,...archaeology.excludedRoadIds].map(String));
  const urban=createUrbanSurface({data:{...geo,roads:geo.roads.filter(road=>!roads.has(String(road.osmId||road.id)))},project,
   heightAt:(x,z)=>monuments.surfaceHeight(x,z,heightAt(x,z)),patches,exclusions,
   openPassageIds:new Set([...(landmarks.juderia.osmIds||[]).map(id=>id.split('/')[1]),...(landmarks.juderia.secondaryGates||[]).map(gate=>String(gate.id))]),
   collisionPolygons:landmarkData.sites.filter(site=>site.id!=='juderia'&&site.footprint.length>=3).map(site=>site.footprint.map(coordinate=>project(...coordinate)))});
  const terrain=buildTerrainGeometry(elevation,urban.groundHeight,patches);
  const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));
  terrainMesh.name='Terreno IGN / PNOA';terrainMesh.userData.orthophoto=true;
  const scene=new THREE.Group();scene.add(terrainMesh,monuments.group);
  const before=Object.fromEntries(Object.entries(visit.focuses).map(([id,f])=>[id,{target:f.target.toArray(),offset:[...f.offset],closeOffset:[...f.closeOffset]}]));
  visit.bindGround(terrain.meshHeightAt);
  let city;
  if(context){
   monuments.buildCastle(terrain.meshHeightAt);scene.add(sacred.group,civic.group,archaeology.group);
   const excluded=new Set(landmarkData.sites.flatMap(site=>site.osmIds||[]).filter(id=>id.startsWith('way/')).map(id=>id.split('/')[1]));
   for(const id of [...theatreBuildingIds,...monuments.castleBuildingIds,...sacred.excludedBuildingIds,...civic.excludedBuildingIds,...archaeology.excludedBuildingIds])excluded.add(String(id));
   const centre=theatre.userData.layout.worldCenter;
   city=createCity({data:geo,project,heightAt:urban.groundHeight,urban,terrainHeightAt:terrain.meshHeightAt,
    inBounds:(x,z)=>Math.hypot(x-centre.x,z-centre.z)<220,excludeBuildingIds:excluded,exclusions,
    vegetationExclusions:[...(archaeology.vegetationExclusions||[]),...(theatre.userData.vegetationExclusions||[])]});
   scene.add(city.group);
  }
  scene.updateMatrixWorld(true);
  const groundBinding={assembly:'Theatre + sacred/civic/archaeological patches + urban ground + final terrain mesh + bindGround',
   scope:'Same local theatre inputs as buildRegion(sagunto); distant Glorieta omitted from CPU context',
   changes:Object.entries(visit.focuses).map(([id,f])=>({id,targetShiftM:f.target.distanceTo(new THREE.Vector3(...before[id].target)),
    eyeOffsetShiftM:new THREE.Vector3(...f.offset).distanceTo(new THREE.Vector3(...before[id].offset)),
    closeOffsetShiftM:new THREE.Vector3(...f.closeOffset).distanceTo(new THREE.Vector3(...before[id].closeOffset))}))};
  return {THREE,scene,theatre,visit,guide,geo,elevation,heightAt,terrain,terrainMesh,urban,monuments,city,landmarks,buildMs,groundBinding};
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
}
