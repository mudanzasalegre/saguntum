// Build the new visit with the same local height, archaeological/context
// patches and terrain interpolation used by Atlas buildRegion('sagunto').
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
export function canvasRuntime(){
 return createRequire((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||path.join(root,'node_modules'))+'/package.json')('@napi-rs/canvas');
}

export async function buildForumScene({withCity=false,rasterTextures=false}={}){
 const gradient={addColorStop(){}};
 const ctx=new Proxy({measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},
  {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const previous=globalThis.document,canvas=rasterTextures?canvasRuntime():null;
 globalThis.document={createElement:()=>canvas?canvas.createCanvas(512,512):({width:512,height:512,getContext:()=>ctx}),querySelector:()=>({checked:true})};
 try{
  const [{createMonuments,theatreRoadIds,theatreBuildingIds},{createHeightSampler,buildTerrainGeometry},
   {createSacredHeritage},{createCivicHeritage},{createUrbanSurface},{createCity},{createArchaeology},{openPermanentExcavations}]=await Promise.all([
   import('../../dist/js/monuments.js'),import('../../dist/js/terrain.js'),import('../../dist/js/heritage-sacred.js'),
   import('../../dist/js/heritage-civic.js'),import('../../dist/js/urban-surface.js'),import('../../dist/js/city.js'),
   import('../../dist/js/archaeology.js'),import('../../dist/js/excavation.js')]);
  const geo=data('cartography'),elevation=data('elevation'),guide=data('forum-plaza-visit'),landmarkData=data('landmarks');
  guide.plan=fs.existsSync(path.join(root,'dist/assets/data/forum-plaza-plan.json'))?data('forum-plaza-plan'):{};
  const landmarks=Object.fromEntries(landmarkData.sites.map(site=>[site.id,site]));
  const rawHeight=createHeightSampler(elevation);
  const monuments=createMonuments({heightAt:rawHeight,project,data:geo,castleVisit:data('castle-visit'),theatreVisit:data('theatre-visit'),deferCastle:true});
  const sacred=createSacredHeritage({heightAt:rawHeight,project,landmarks,data:geo,santaMariaVisit:data('santa-maria-visit'),
   santaMariaContext:data('santa-maria-context'),plazaContext:data('plaza-mayor-context'),
   calvarioVisit:data('calvario-visit'),calvarioContext:data('calvario-context'),berenguerContext:data('berenguer-context'),
   sangreVisit:data('sangre-visit'),sangreContext:data('sangre-context'),salvadorVisit:data('salvador-visit'),salvadorContext:data('salvador-context')});
  const civic=createCivicHeritage({heightAt:rawHeight,project,landmarks,data:geo,plazaVisit:data('plaza-mayor-visit'),plazaContext:data('plaza-mayor-context'),
   juderiaVisit:data('juderia-visit'),juderiaContext:data('juderia-context'),berenguerVisit:data('berenguer-visit'),
   berenguerContext:data('berenguer-context'),museoVisit:data('museo-visit'),museoContext:data('museo-context')});
  const records=Object.fromEntries(['archaeology-public','archaeology-domestic','archaeology-necropolis','forum-plaza-catalog'].flatMap(name=>data(name).sites).map(site=>[site.id,site]));
  const archaeology=createArchaeology({heightAt:rawHeight,project,records,data:geo,dianaSite:civic.dianaSite,
   porticVisit:data('portic-visit'),porticContext:data('portic-context'),domusVisit:data('domus-visit'),domusContext:data('domus-context'),
   circoVisit:data('circo-visit'),circoContext:data('circo-context'),necropolisVisit:data('necropolis-visit'),necropolisContext:data('necropolis-context'),
   forumPlazaVisit:guide,forumPlazaContext:data('forum-plaza-context')});
  const site=archaeology.sites['forum-plaza'],patches=[...sacred.patches,...civic.patches,...archaeology.patches];
  const exclusions=[...sacred.exclusions,...civic.exclusions,...archaeology.exclusions];
  const roads=new Set(['733321149','733321150','1419281599',...theatreRoadIds,...monuments.castleRoadIds,
   ...sacred.excludedRoadIds,...civic.excludedRoadIds,...archaeology.excludedRoadIds,...data('glorieta-buildings').excludedRoadIds||[]].map(String));
  const urban=createUrbanSurface({data:{...geo,roads:geo.roads.filter(road=>!roads.has(String(road.osmId||road.id)))},project,
   heightAt:(x,z)=>site.surfaceHeight(x,z,monuments.surfaceHeight(x,z,rawHeight(x,z))),patches,exclusions,
   openPassageIds:new Set([...(landmarks.juderia.osmIds||[]).map(id=>id.split('/')[1]),...(landmarks.juderia.secondaryGates||[]).map(gate=>String(gate.id))]),
   collisionPolygons:landmarkData.sites.filter(other=>other.id!=='juderia'&&other.footprint.length>=3).map(other=>other.footprint.map(coordinate=>project(...coordinate)))});
  const terrain=buildTerrainGeometry(elevation,urban.groundHeight,patches);
  const terrainMesh=new THREE.Mesh(terrain.geometry,new THREE.MeshStandardMaterial({color:'#f2e7ce'}));
  terrainMesh.name='Terreno IGN / PNOA';terrainMesh.userData.orthophoto=true;
  for(const other of Object.values(archaeology.sites))other.visit?.bindGround?.(terrain.meshHeightAt);
  const scene=new THREE.Group();scene.add(terrainMesh,archaeology.group);
  let city=null;
  if(withCity){
   const excluded=new Set([...sacred.excludedBuildingIds,...civic.excludedBuildingIds,...archaeology.excludedBuildingIds,...theatreBuildingIds,...monuments.castleBuildingIds].map(String));
   for(const record of landmarkData.sites)for(const id of record.osmIds||[])if(id.startsWith('way/'))excluded.add(id.split('/')[1]);
   const box=site.visit.bounds;
   city=createCity({data:geo,project,heightAt:urban.groundHeight,urban,terrainHeightAt:terrain.meshHeightAt,
    inBounds:(x,z)=>x>=box.min.x-80&&x<=box.max.x+80&&z>=box.min.z-80&&z<=box.max.z+80,
    excludeBuildingIds:excluded,exclusions,vegetationExclusions:archaeology.vegetationExclusions});
   scene.add(city.group);
  }
  const masks=Object.values(archaeology.sites).flatMap(other=>other.currentMasks||[other.currentMask]).filter(mask=>mask&&mask.permanent!==false);
  const excavation=openPermanentExcavations([terrainMesh,city?.group],masks);
  scene.updateMatrixWorld(true);
  return {scene,site,visit:site.visit,guide,geo,elevation,rawHeight,heightAt:terrain.meshHeightAt,terrain,terrainMesh,urban,archaeology,city,records,excavation,
   groundBinding:'Same sacred, civic and archaeological patches, Forum preparatory street-height cap, urban grading and interpolated terrain as Atlas. Permanent polygon removes the cap; visible park floors/public decks retain their own levels. Distant Glorieta model omitted.'};
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
}
