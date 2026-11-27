// Construct the shipped castle against the same final local ground as the Atlas.
// Canvas is an asset-construction facade only; this does not emulate WebGL.
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

export async function buildCastleScene({context=false,rasterTextures=false}={}){
 const gradient={addColorStop(){}};
 const ctx=new Proxy({measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},
  {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const previous=globalThis.document;
 const canvas=rasterTextures?createRequire((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||path.join(root,'node_modules'))+'/package.json')('@napi-rs/canvas'):null;
 globalThis.document={createElement:()=>canvas?canvas.createCanvas(512,512):({width:512,height:512,getContext:()=>ctx}),querySelector:()=>({checked:true})};
 try{
  const [{createMonuments,theatreRoadIds,theatreBuildingIds},{createHeightSampler,buildTerrainGeometry},
   {createSacredHeritage},{createCivicHeritage},{createUrbanSurface},{createCity},{createArchaeology},{openPermanentExcavations}]=await Promise.all([
   import('../../dist/js/monuments.js'),import('../../dist/js/terrain.js'),import('../../dist/js/heritage-sacred.js'),
   import('../../dist/js/heritage-civic.js'),import('../../dist/js/urban-surface.js'),import('../../dist/js/city.js'),
   import('../../dist/js/archaeology.js'),import('../../dist/js/excavation.js')]);
  const geo=data('cartography'),elevation=data('elevation'),guide=data('castle-visit'),landmarkData=data('landmarks');
  const landmarks=Object.fromEntries(landmarkData.sites.map(site=>[site.id,site]));
  const heightAt=createHeightSampler(elevation);
  const monuments=createMonuments({heightAt,project,data:geo,castleVisit:guide,theatreVisit:data('theatre-visit'),deferCastle:true});
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
  const started=performance.now(),castle=monuments.buildCastle(terrain.meshHeightAt),buildMs=performance.now()-started;
  const easternExcavation=openPermanentExcavations([terrainMesh],castle.userData.currentMasks||[]);
  const visit=castle.userData.visit;
  monuments.theatre.userData.visit.bindGround(terrain.meshHeightAt);
  const scene=new THREE.Group();scene.add(terrainMesh,monuments.group);
  let city;
  if(context){
   scene.add(sacred.group,civic.group,archaeology.group);
   const excluded=new Set(landmarkData.sites.flatMap(site=>site.osmIds||[]).filter(id=>id.startsWith('way/')).map(id=>id.split('/')[1]));
   for(const id of [...theatreBuildingIds,...monuments.castleBuildingIds,...sacred.excludedBuildingIds,...civic.excludedBuildingIds,...archaeology.excludedBuildingIds])excluded.add(String(id));
   const bounds=visit.bounds;
   city=createCity({data:geo,project,heightAt:urban.groundHeight,urban,terrainHeightAt:terrain.meshHeightAt,
    inBounds:(x,z)=>x>=bounds.min.x-80&&x<=bounds.max.x+120&&z>=bounds.min.z-200&&z<=bounds.max.z+100,
    excludeBuildingIds:excluded,exclusions,
    vegetationExclusions:[...(archaeology.vegetationExclusions||[]),...(monuments.theatre.userData.vegetationExclusions||[]),...(castle.userData.vegetationExclusions||[])]});
   scene.add(city.group);
  }
  scene.updateMatrixWorld(true);
  const groundBinding={assembly:'Castle forum terrace + sacred/civic/archaeological patches + urban ground + final terrain mesh + deferred castle construction',
   forum:{level:castle.userData.ground.level,margin:castle.userData.ground.margin,method:castle.userData.ground.method},
   scope:'Same local castle inputs as buildRegion(sagunto); distant Glorieta omitted from CPU context'};
  return {THREE,scene,castle,visit,guide,geo,elevation,heightAt,terrain,terrainMesh,urban,monuments,city,landmarks,buildMs,groundBinding,easternExcavation};
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
}
