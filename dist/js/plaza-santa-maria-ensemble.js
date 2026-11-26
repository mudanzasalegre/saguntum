import * as THREE from 'three';
import {createPlazaMayor} from './plaza-mayor.js';
import {createPlazaMayorContext} from './plaza-mayor-context.js';
import {createSantaMaria} from './santa-maria.js';
import {createSantaMariaContext} from './santa-maria-context.js';

// The square's short side and the north church entrance share the same street.
// Load them as one local ensemble, including on a phone with one heritage slot.
// Each monument keeps its own stops, section controls, materials and identity.
export function createPlazaSantaMaria(options){
 const {heightAt,project,records,data,visitData,contextData,santaMariaVisit,santaMariaContext}=options;
 const plaza=createPlazaMayor({...options,record:records['plaza-mayor']});
 const church=createSantaMaria({heightAt,project,record:records['santa-maria'],visitData:santaMariaVisit});
 const plazaContext=createPlazaMayorContext({heightAt,project,landmarks:records,data,contextData});
 const churchContext=createSantaMariaContext({heightAt,project,landmarks:records,data,
  churchFrame:church.frame,contextData:santaMariaContext,
  replacedContextBuildingIds:contextData.replacedSantaMariaBuildingIds||[]});
 const sites={'plaza-mayor':plaza,'santa-maria':church};
 const group=new THREE.Group();group.name='Plaça Major y Santa María · conjunto urbano';
 group.add(plaza.group,church.group);
 const contextGroup=new THREE.Group();contextGroup.name='Calles y caserío del conjunto';
 contextGroup.add(plazaContext.group,churchContext.group);
 for(const [site,context]of [[plaza,plazaContext],[church,churchContext]]){
  const visit=site.group.userData.visit;
  Object.assign(visit.focuses,context.focuses);
  visit.plan.components.push(...context.plan.components);
  visit.plan.contextOutline=context.plan.outline;
  visit.qa.context=context.qa;visit.stats.context=context.stats;
  const select=visit.selectFocus,reading=visit.setReadingMode,ground=visit.bindGround;
  visit.selectFocus=id=>{const result=select(id);context.selectFocus(id);return result;};
  visit.setReadingMode=mode=>{const result=reading(mode);context.setReadingMode(mode);return result;};
  visit.bindGround=height=>{Object.assign(visit.focuses,context.focuses);return ground?.(height);};
 }
 const contexts=[plazaContext,churchContext];
 const context={group:contextGroup,
  patches:contexts.flatMap(c=>c.patches),exclusions:contexts.flatMap(c=>c.exclusions),
  excludedBuildingIds:new Set(contexts.flatMap(c=>[...c.excludedBuildingIds])),
  excludedRoadIds:new Set(contexts.flatMap(c=>[...c.excludedRoadIds])),
  bindGround(height){for(const c of contexts)c.bindGround(height);}
 };
 const replaced=new Set(contextData.replacedSantaMariaBuildingIds||[]);
 const contextSource={
  buildings:[...(contextData.buildings||[]),...(santaMariaContext.buildings||[]).filter(b=>!replaced.has(String(b.id)))],
  roads:[...(contextData.roads||[]),...(santaMariaContext.roads||[])]
 };
 options.visitDataByPlace={'plaza-mayor':visitData,'santa-maria':santaMariaVisit};
 return {group,sites,surroundings:{context,data:contextSource}};
}
