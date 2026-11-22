import {createSantaMariaContext} from './santa-maria-context.js';
import {createPlazaMayorContext} from './plaza-mayor-context.js';
import {createJuderiaContext} from './juderia-context.js';
import {createCalvarioContext} from './calvario-context.js';
import {createBerenguerContext,withoutBerenguerClaims} from './berenguer-context.js';
import {createSangreContext} from './sangre-context.js';
import {createSalvadorContext} from './salvador-context.js';
import {createMuseoContext} from './museo-context.js';
import {createPorticContext} from './portic-context.js';
import {createDomusContext} from './domus-context.js';
import {createCircoContext} from './circo-context.js';
import {createNecropolisContext} from './necropolis-context.js';
import {createHornoContext} from './horno-context.js';
import {createTalleresContext} from './talleres-context.js';
import {createMuseoIndustrialContext} from './museo-industrial-context.js';
import {createGerenciaContext} from './gerencia-context.js';
import {createCasinoContext} from './casino-context.js';
import {createBegonaContext} from './begona-context.js';
import {createEconomatoContext} from './economato-context.js';
import {createBarrioContext} from './barrio-context.js';
import {createSanatorioContext} from './sanatorio-context.js';
import {createGrauContext} from './grau-context.js';
import {createPantalanContext} from './pantalan-context.js';
import {documentData} from './territory-heritage-catalog.js';

const factories={
 'santa-maria':createSantaMariaContext,'plaza-mayor':createPlazaMayorContext,
 juderia:createJuderiaContext,calvario:createCalvarioContext,berenguer:createBerenguerContext,
 sangre:createSangreContext,salvador:createSalvadorContext,museo:createMuseoContext,
 portic:createPorticContext,domus:createDomusContext,circo:createCircoContext,necropolis:createNecropolisContext,
 horno:createHornoContext,talleres:createTalleresContext,'museo-industrial':createMuseoIndustrialContext,
 gerencia:createGerenciaContext,casino:createCasinoContext,begona:createBegonaContext,economato:createEconomatoContext,
 'barrio-obrero':createBarrioContext,sanatorio:createSanatorioContext,'grau-vell':createGrauContext,pantalan:createPantalanContext
};
const transferred=new Set(['santa-maria','plaza-mayor','juderia']);
export const hasAtlasContext=id=>Object.hasOwn(factories,id);
export async function settleSourceClaims(id,options){
 if(transferred.has(id)){
  options.contextData=withoutBerenguerClaims(options.contextData,await documentData('berenguer-context'));
 }
}
export function originalSurroundings(id,options,sites){
 const data=options.grauContextData||options.contextData;
 const context=factories[id]({...options,contextData:data,churchFrame:sites[id]?.frame,landmarks:options.records});
 return {context,data};
}
