import {createExcavationController} from './excavation.js';
import {territorialCut} from './territory-heritage-relief.js';

// A worker snapshot contains the visible geometry of a place. A stop also
// needs the original author's visibility, material, roof and section controls.
export function bindHeritageVisit({model,sites,options,frame,heightAt,renderer}){
 const permanent=model.relief;
 let excavation=null,previous=null;
 const archaeological=new Set(['portic','domus','circo','necropolis']);

 function phase(enabled){
  model.setHistorical(enabled);
 }
 function applyCut(window){
  model.relief=permanent;
  if(!window||window.clipTerrain===false)return;
  const cut=territorialCut(window,frame);
  if(permanent.cuts.some(row=>row.every((v,i)=>Math.abs(v-cut[i])<1e-6)))return;
  model.relief={...permanent,cuts:[cut,...permanent.cuts]};
 }
 function marineWindow(site){
  const p=site.marine.footprint;
  const xs=p.map(v=>v.x),zs=p.map(v=>v.z);
  const l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...zs),b=Math.max(...zs);
  return territorialCut({center:{x:(l+r)/2,z:(t+b)/2},width:r-l,depth:b-t},frame);
 }
 function close(){
  if(!previous)return;
  const {site,visit}=previous;
  visit?.selectFocus?.(null);
  visit?.setSection?.(false);
  if(site.roof)site.roof.visible=true;
  if(excavation)excavation.select(null);
  phase(false);
  applyCut(null);
  previous=null;
 }
 function controller(place,site,visit){
  if(!excavation){
   const source=place==='berenguer'?{id:place,cut:visit.sectionMask,point:site.point,views:site.views}:site;
   // Render the Atlas soil section in its own metric drawing frame. Its cut
   // is also projected into the terrain/road shaders by the territorial view.
   excavation=createExcavationController({scene:model.group,renderer,sites:{[place]:source},contextRoots:[],terrainMeshes:[],heightAt});
  }
  return excavation;
 }
 model.setVisitStop=(place,stop,presentation={})=>{
  const site=sites[place];
  if(!site||!stop){close();return null;}
  if(previous&&previous.site!==site)close();
  const visit=site.visit||site.group.userData.visit;
  const focus=visit?.focuses?.[stop]||site.focuses?.[stop];
  const guide=place==='pantalan-paseo'?options.pantalanPaseoVisit:place==='pantalan-maritimo'?options.pantalanMaritimoVisit:
              options.visitData||options.grauVisit||options.guide;
  const entry=guide?.stops?.find(row=>row.id===stop);
  const selectedPhase=place.startsWith('pantalan-')?(entry?.mode||'current'):
   presentation.mode||focus?.recommendedMode||entry?.recommendedMode||entry?.mode||
    (focus?.modes?.length===1?focus.modes[0]:'current');
  const mode=['historical','cut'].includes(selectedPhase)?selectedPhase:'current';
  const section=!!(presentation.requiresSection||focus?.requiresSection||mode==='cut'||selectedPhase==='section');
  const interior=!!(presentation.interiorView||focus?.interiorView);
  const archFocus=presentation.archFocus||focus?.archFocus||entry?.archFocus;
  const inspection=place==='puerto-antiguo'&&(['marina','gola','derrumbe'].includes(stop)||presentation.inspection===true);
  visit?.selectFocus?.(stop);
  phase(mode==='historical');
  let cut=null;
  if(archaeological.has(place)||(place==='berenguer'&&visit.sectionMask&&section)){
   const ctl=controller(place,site,visit);
   ctl.select(place,{mode:place==='berenguer'?'cut':mode,focus:archFocus});
   if(place==='berenguer')ctl.setCoverShown(false);
   if(stop==='domus-compluvium'||place==='necropolis'&&mode==='historical')ctl.setRoofOpen(false);
   cut=ctl.state.cut;
  }else if(excavation)excavation.select(null);
  if(!archaeological.has(place))visit?.setSection?.(section);
  if(place==='puerto-antiguo')site.roof.visible=!(presentation.roofOpen||stop===site.roofFocus);
  applyCut(cut);
  previous={site,visit};
  return {place,stop,mode,section,interior,archFocus:archFocus||null,inspection,
   waterCut:inspection?marineWindow(site):null,
   contextCut:cut?.clipContext===true?territorialCut(cut,frame):null};
 };
 model.disposeVisit=()=>{excavation?.dispose();};
}
