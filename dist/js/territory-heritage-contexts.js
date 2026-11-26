import {documentData} from './territory-heritage-catalog.js';

const factories={
 'santa-maria':()=>import('./santa-maria-context.js').then(m=>m.createSantaMariaContext),
 'plaza-mayor':()=>import('./plaza-mayor-context.js').then(m=>m.createPlazaMayorContext),
 'juderia':()=>import('./juderia-context.js').then(m=>m.createJuderiaContext),
 'calvario':()=>import('./calvario-context.js').then(m=>m.createCalvarioContext),
 'berenguer':()=>import('./berenguer-context.js').then(m=>m.createBerenguerContext),
 'sangre':()=>import('./sangre-context.js').then(m=>m.createSangreContext),
 'salvador':()=>import('./salvador-context.js').then(m=>m.createSalvadorContext),
 'museo':()=>import('./museo-context.js').then(m=>m.createMuseoContext),
 'portic':()=>import('./portic-context.js').then(m=>m.createPorticContext),
 'domus':()=>import('./domus-context.js').then(m=>m.createDomusContext),
 'circo':()=>import('./circo-context.js').then(m=>m.createCircoContext),
 'necropolis':()=>import('./necropolis-context.js').then(m=>m.createNecropolisContext),
 'horno':()=>import('./horno-context.js').then(m=>m.createHornoContext),
 'talleres':()=>import('./talleres-context.js').then(m=>m.createTalleresContext),
 'museo-industrial':()=>import('./museo-industrial-context.js').then(m=>m.createMuseoIndustrialContext),
 'gerencia':()=>import('./gerencia-context.js').then(m=>m.createGerenciaContext),
 'casino':()=>import('./casino-context.js').then(m=>m.createCasinoContext),
 'begona':()=>import('./begona-context.js').then(m=>m.createBegonaContext),
 'economato':()=>import('./economato-context.js').then(m=>m.createEconomatoContext),
 'barrio-obrero':()=>import('./barrio-context.js').then(m=>m.createBarrioContext),
 'sanatorio':()=>import('./sanatorio-context.js').then(m=>m.createSanatorioContext),
 'grau-vell':()=>import('./grau-context.js').then(m=>m.createGrauContext),
 'pantalan':()=>import('./pantalan-context.js').then(m=>m.createPantalanContext)
};
const transferred=new Set(['santa-maria','plaza-mayor','juderia']);
export const loadAtlasContext=id=>factories[id]?.()??null;
export async function settleSourceClaims(id,options){
 if(transferred.has(id)){
  const [module,claims]=await Promise.all([import('./berenguer-context.js'),documentData('berenguer-context')]);
  options.contextData=module.withoutBerenguerClaims(options.contextData,claims);
  if(options.santaMariaContext)options.santaMariaContext=module.withoutBerenguerClaims(options.santaMariaContext,claims);
 }
}
export function originalSurroundings(factory,id,options,sites){
 const data=options.grauContextData||options.contextData;
 const context=factory({...options,contextData:data,churchFrame:sites[id]?.frame,landmarks:options.records});
 return {context,data};
}
