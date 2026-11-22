import {createJuderiaContext} from './juderia-context.js';

// Transfer only explicitly listed source parts. Retained source datasets are
// immutable, and their paving, focus coordinates and terrain patches stay put.
export function withoutBerenguerClaims(contextData={},berenguerContextData={}){
 const owner=String(contextData.id||'').replace(/-context$/,'');
 const claims=berenguerContextData.ownershipTransfers?.[owner];
 if(!claims)return contextData;
 const buildings=new Set((claims.retiredBuildingPartIds||[]).map(String));
 const roads=new Set((claims.retiredRoadIds||[]).map(String));
 if(!buildings.size&&!roads.size)return contextData;
 const retained={...contextData,retiredSourceClaims:{owner:'berenguer-core',buildingPartIds:[...buildings],roadIds:[...roads]}};
 for(const key of['buildings','coreBuildings'])if(contextData[key])retained[key]=contextData[key].filter(row=>!buildings.has(String(row.id)));
 for(const key of['excludedBuildingIds','coreExcludedBuildingIds'])if(contextData[key])retained[key]=contextData[key].filter(id=>!buildings.has(String(id)));
 if(roads.size){
  if(contextData.roads)retained.roads=contextData.roads.filter(row=>!roads.has(String(row.id)));
  if(contextData.excludedRoadIds)retained.excludedRoadIds=contextData.excludedRoadIds.filter(id=>!roads.has(String(id)));
 }
 return retained;
}

// Source-preserving surroundings share the established cadastral renderer.
// Palace, annex and Diana court have independent ownership in berenguer.js.
export function createBerenguerContext(options={}){
 const context=createJuderiaContext(options);
 const contextColor=options.visitData?.readingLegend?.find(layer=>layer.id==='context')?.color||options.contextData?.readingColor||'#80aa85';
 let mode='materials';
 const style=()=>context.group.traverse(object=>{
  if(!object.isMesh)return;
  const data=object.userData,material=object.material;
  delete data.juderiaContext;data.berenguerContext=true;data.period='context';
  data.baseBumpMap=data.baseMap;
  const map=mode==='periods'?null:data.baseBumpMap;
  if(material.bumpMap!==map){material.bumpMap=map;material.needsUpdate=true;}
  material.bumpScale=data.materialKind==='tile'?.025:data.materialKind==='stone'?.02:.01;
  if(mode==='periods')material.color.set(contextColor);
 });
 const normalize=()=>{
  context.group.name='Casa dels Berenguer · calles y caserío colindantes';
  context.group.userData.id='berenguer-context';
  Object.assign(context.stats,{preservedSantaMaria:true,preservedPlazaMayor:true,preservedJuderia:true,preservedCalvario:true});
  context.group.traverse(object=>{
   if(object.userData.component==='juderia-pavimento')object.userData.component='berenguer-entorno';
  });
  style();
 };
 const bind=context.bindGround,read=context.setReadingMode,select=context.selectFocus;
 context.bindGround=ground=>{bind(ground);normalize();return context;};
 context.setReadingMode=value=>{mode=read(value);style();return mode;};
 context.selectFocus=id=>{const selected=select(id);style();return selected;};
 normalize();return context;
}
