import {createJuderiaContext} from './juderia-context.js';

// Transfer only explicitly listed source parts. Retained source datasets are
// immutable, and their paving, focus coordinates and terrain patches stay put.
export function withoutSangreClaims(contextData={},sangreContextData={}){
 const owner=String(contextData.id||'').replace(/-context$/,'');
 const claims=sangreContextData.ownershipTransfers?.[owner];
 if(!claims)return contextData;
 const buildings=new Set((claims.retiredBuildingPartIds||[]).map(String));
 const roads=new Set((claims.retiredRoadIds||[]).map(String));
 if(!buildings.size&&!roads.size)return contextData;
 const retained={...contextData,retiredSourceClaims:{owner:'sangre-core',buildingPartIds:[...buildings],roadIds:[...roads]}};
 for(const key of['buildings','coreBuildings'])if(contextData[key])retained[key]=contextData[key].filter(row=>!buildings.has(String(row.id)));
 for(const key of['excludedBuildingIds','coreExcludedBuildingIds'])if(contextData[key])retained[key]=contextData[key].filter(id=>!buildings.has(String(id)));
 if(roads.size){
  if(contextData.roads)retained.roads=contextData.roads.filter(row=>!roads.has(String(row.id)));
  if(contextData.excludedRoadIds)retained.excludedRoadIds=contextData.excludedRoadIds.filter(id=>!roads.has(String(id)));
 }
 return retained;
}

// Source-preserving surroundings share the established cadastral renderer.
// Ermita and stair have independent ownership in sangre.js.
export function createSangreContext(options={}){
 const originalData=options.contextData||{};
 const heightReview=originalData.heightReview||[],reviewById=new Map(heightReview.map(row=>[String(row.id),row]));
 // Keep the saved source rows untouched. A gross mismatch between an old MDSn
 // estimate and the mapped floor count uses an explicitly recorded floor proxy.
 const renderData={...originalData,buildings:(originalData.buildings||[]).map(row=>{
  const review=reviewById.get(String(row.id));return review?{...row,height:review.displayHeightM}:row;
 })};
 const context=createJuderiaContext({...options,contextData:renderData});
 const project=options.project||((lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320}));
 // Keep source ways and their terrain grading, while suppressing the generic
 // pavement/curb segments where this scene already owns the walking surface.
 for(const mask of originalData.genericStreetExclusions||[])context.exclusions.push(mask.coordinates.map(p=>project(...p)));
 const contextColor=options.visitData?.readingLegend?.find(layer=>layer.id==='context')?.color||options.contextData?.readingColor||'#80aa85';
 let mode='materials';
 const style=()=>context.group.traverse(object=>{
  if(!object.isMesh)return;
  const data=object.userData,material=object.material;
  delete data.juderiaContext;data.sangreContext=true;data.period='context';
  data.baseBumpMap=data.baseMap;
  const map=mode==='periods'?null:data.baseBumpMap;
  if(material.bumpMap!==map){material.bumpMap=map;material.needsUpdate=true;}
  material.bumpScale=data.materialKind==='tile'?.025:data.materialKind==='stone'?.02:.01;
  if(mode==='periods')material.color.set(contextColor);
 });
 const normalize=()=>{
  context.group.name='Ermita de la Sangre · plaza, calles y caserío';
  context.group.userData.id='sangre-context';
  Object.assign(context.stats,{preservedSantaMaria:true,preservedPlazaMayor:true,preservedJuderia:true,preservedCalvario:true,preservedBerenguer:true});
  const reviewed=context.qa.buildings.filter(row=>reviewById.has(String(row.id)));
  for(const row of reviewed){row.method='storeys';row.heightReview=reviewById.get(String(row.id));}
  context.stats.sourceHeight=context.qa.buildings.filter(row=>row.method==='height').length;
  context.stats.ignHeight=context.qa.buildings.filter(row=>row.method==='IGN').length;
  context.stats.storeyHeight=context.qa.buildings.filter(row=>row.method==='storeys').length;
  context.stats.fallbackHeight=context.qa.buildings.filter(row=>row.method==='estimate').length;
  context.stats.heightConflictsReviewed=reviewed.length;
  context.qa.heightReview=heightReview;
  for(const focus of Object.values(context.focuses)){focus.closeScale=false;const fov=originalData.focusSpecs?.[focus.id]?.fov;if(fov)focus.fov=fov;focus.sourceConfidence='Mapped street focus; plaza outline inferred from the public void between cadastral footprints.';}

  context.group.traverse(object=>{
   if(object.userData.component==='juderia-pavimento')object.userData.component='sangre-entorno';
  });
  style();
 };
 const bind=context.bindGround,read=context.setReadingMode,select=context.selectFocus;
 context.bindGround=ground=>{bind(ground);normalize();return context;};
 context.setReadingMode=value=>{mode=read(value);style();return mode;};
 context.selectFocus=id=>{const selected=select(id);style();return selected;};
 normalize();return context;
}
