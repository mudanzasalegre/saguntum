"""Apply the bounded V29 Barrio Obrero integration to the V28 source."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]

def replace(text, old, new, count=1):
    assert text.count(old) == count, (old[:120], text.count(old), count)
    return text.replace(old, new)

p = ROOT / 'dist/js/app.js'
s = p.read_text()
assert "./barrio-map.js" not in s, 'V29 integration already applied'
s = replace(s, "import {drawEconomatoMap} from './economato-map.js';", "import {drawEconomatoMap} from './economato-map.js';\nimport {drawBarrioMap} from './barrio-map.js';")
s = replace(s, 'economatoData=null,economatoContextData=null;', 'economatoData=null,economatoContextData=null,barrioData=null,barrioContextData=null;')
s = replace(s, "'begona','economato'].map(id=>", "'begona','economato','barrio-obrero'].map(id=>")
s = replace(s, "'casino','begona','economato'];", "'casino','begona','economato','barrio-obrero'];")
s = replace(s, 'const economatoVisit=()=>portHeritage?.sites?.economato?.visit;', "const economatoVisit=()=>portHeritage?.sites?.economato?.visit;\nconst barrioVisit=()=>portHeritage?.sites?.['barrio-obrero']?.visit;")
s = replace(s, 'economato:economatoData})[id];', "economato:economatoData,'barrio-obrero':barrioData})[id];")
branch = " if(id==='barrio-obrero'){const state=visitStates[id];return{id,data:barrioData,guide:state.guide,stopId:state.stopId,readingMode:state.readingMode,sectionOpen:state.sectionOpen,model:barrioVisit(),drawMap:drawBarrioMap,label:'BARRIO OBRERO',subtitle:'Las casas, los patios y la vida del barrio',mapTitle:'BARRIO OBRERO · CASAS Y CALLES',mapHeading:'La vida entre las casas.',mapAria:'Abrir plano del Barrio Obrero y sus viviendas de referencia',scale:50,overviewId:'barrio-conjunto'};}\n"
s = replace(s, " if(id==='economato'){", branch + " if(id==='economato'){")
mini = "if(v.id==='barrio-obrero'&&plan){$('minimap').setAttribute('aria-label','Plano del Barrio Obrero: '+plan.floorLabel);$('map-place-count').textContent=plan.floorLabel+' · '+plan.targets.length+' paradas';}"
s = replace(s, "if(v.id==='economato'&&plan){", mini + "if(v.id==='economato'&&plan){")
s = replace(s, "'begona','economato'].includes(monumentId)", "'begona','economato','barrio-obrero'].includes(monumentId)")
s = replace(s, "(monumentId==='economato'?'Plano del Economato: '", "(monumentId==='barrio-obrero'?'Plano del Barrio Obrero: ':monumentId==='economato'?'Plano del Economato: '")
s = replace(s, 'portHeritage?.economatoContext])', 'portHeritage?.economatoContext,portHeritage?.barrioContext])')
method = '<h3>Barrio Obrero · manzanas y viviendas tipo</h3><p>Las siete manzanas del catálogo municipal se contrastan con las huellas actuales de Catastro y la ortofotografía. Las plantas y secciones históricas permiten estudiar una vivienda baja y un extremo de dos alturas. Sus interiores representan tipologías documentadas: los usos propuestos de las habitaciones, el mobiliario y las alturas sin cota son interpretativos. Los planos distinguen las casas de referencia del conjunto del barrio. Las sustituciones, ampliaciones y cambios de los espacios delanteros forman parte de su evolución urbana.</p>'
s = replace(s, '<h3>Patrimonio industrial · lugares 14–22</h3>', method + '<h3>Patrimonio industrial · lugares 14–22</h3>')
help_text = 'El Barrio Obrero incorpora veinte paradas por sus siete manzanas, viviendas y calles. El plano se acerca a la casa y planta de cada parada interior. Desde la vista general, «Abrir sección» lleva a la vivienda baja de referencia; las cubiertas de los ejemplos históricos pueden abrirse para estudiar su distribución. '
s = replace(s, 'Cambia Sagunto / Puerto / Costa / Paisajes para explorar cada ámbito.', help_text + 'Cambia Sagunto / Puerto / Costa / Paisajes para explorar cada ámbito.')
s = replace(s, 'economatoContext:economatoContextData});', 'economatoContext:economatoContextData,barrioVisit:barrioData,barrioContext:barrioContextData});')
status = "barrioObrero:{selected:visitStates['barrio-obrero'].stopId,readingMode:visitStates['barrio-obrero'].readingMode,sectionOpen:visitStates['barrio-obrero'].sectionOpen,visit:visitStates['barrio-obrero'].guide?.getState(),geometry:barrioVisit()?.stats,context:portHeritage?.barrioContext?.stats},"
s = replace(s, 'window.atlasStatus={ready,theme:getTheme(),economato:', 'window.atlasStatus={ready,theme:getTheme(),' + status + 'economato:')
s = replace(s, "'economato-visit','economato-plan','economato-context'].map", "'economato-visit','economato-plan','economato-context','barrio-visit','barrio-plan','barrio-context'].map")
s = replace(s, 'economatoContextData=loaded[77];', 'economatoContextData=loaded[77];barrioData=loaded[78];barrioData.plan=loaded[79];barrioContextData=loaded[80];barrioData.sectionOnOverview=true;barrioData.relatedVisits=[{id:\'economato\',label:\'Conocer el antiguo Economato\'},{id:\'gerencia\',label:\'Recorrer la ciudad jardín\'},{id:\'sanatorio\',label:\'Conocer el antiguo Sanatorio\'}];')
card = " Object.assign(byId['barrio-obrero'],{era:'LAS CASAS DE LA COMPAÑÍA · 1917–1921',title:'Barrio<br><em>Obrero.</em>',description:barrioData.subtitle||barrioData.introduction,facts:[['Siete manzanas','La trama de las viviendas'],[String(barrioData.stops.length)+' paradas','Casas, interiores y entorno']],features:['Hileras, jardines y corrales','Dos tipologías de vivienda documentadas','Calles y transformaciones del barrio'],sources:barrioData.sources.map(source=>source.url)});\n"
s = replace(s, ' for(const id of Object.keys(visitStates)){const state=visitStates[id],data=visitDataFor(id);', card + ' for(const id of Object.keys(visitStates)){const state=visitStates[id],data=visitDataFor(id);')
s = replace(s, "onSection:open=>{if(!ready||!regionsBuilt.has(regionOf(byId[id])))return;", "onSection:open=>{if(!ready||!regionsBuilt.has(regionOf(byId[id])))return;if(id==='barrio-obrero'&&open&&!state.stopId){selectVisitStop(id,'barrio-seccion');return;}")
p.write_text(s)

p = ROOT / 'dist/js/port.js'; s = p.read_text()
s = replace(s, "import {createEconomatoContext} from './economato-context.js';", "import {createEconomatoContext} from './economato-context.js';\nimport {createBarrioContext} from './barrio-context.js';")
s = replace(s, ' const contexts={\n', " const contexts={\n  'barrio-obrero':createBarrioContext({contextData:options.barrioContext||{},visitData:options.barrioVisit||{},project:options.project,heightAt:options.heightAt}),\n")
s = replace(s, 'economato:options.economatoVisit};', "economato:options.economatoVisit,'barrio-obrero':options.barrioVisit};")
s = replace(s, 'economatoContext:contexts.economato,stats,', "economatoContext:contexts.economato,barrioContext:contexts['barrio-obrero'],stats,")
p.write_text(s)

p = ROOT / 'dist/js/port-workers.js'; s = p.read_text()
s = replace(s, "import {createEconomato} from './economato.js';", "import {createEconomato} from './economato.js';\nimport {createBarrio} from './barrio.js';")
start = s.index('function buildBarrio('); end = s.index('function buildSanatorio(', start)
s = s[:start] + s[end:]
s = replace(s, 'records,economatoContext,economatoVisit}', 'records,economatoContext,economatoVisit,barrioContext,barrioVisit}')
s = replace(s, "factories={'barrio-obrero':buildBarrio,sanatorio:buildSanatorio}", 'factories={sanatorio:buildSanatorio}')
s = replace(s, "if(record.id!=='economato'&&!factories[record.id])continue;", "if(!['economato','barrio-obrero'].includes(record.id)&&!factories[record.id])continue;")
s = replace(s, 'visitData:economatoVisit}):factories[record.id]', "visitData:economatoVisit}):record.id==='barrio-obrero'?createBarrio({record,project,heightAt,contextData:barrioContext,visitData:barrioVisit}):factories[record.id]")
p.write_text(s)

p = ROOT / 'dist/index.html'; s = p.read_text()
panel = '<section class="castle-panel barrio-obrero-panel" id="barrio-obrero-panel" hidden aria-label="Visita al Barrio Obrero, sus viviendas, patios y calles"></section>'
s = replace(s, '<section class="industrial-panel" id="industrial-panel"', panel + '<section class="industrial-panel" id="industrial-panel"')
p.write_text(s)

p = ROOT / 'dist/style.css'; s = p.read_text(); assert s.count('.economato-mode') == 60
s = s.replace('.economato-mode', '.economato-mode,.barrio-obrero-mode'); p.write_text(s)
p = ROOT / 'package.json'; package = json.loads(p.read_text()); package['version'] = '29.0.0'; p.write_text(json.dumps(package, indent=2)+'\n')
p = ROOT / '.gitignore'; s = p.read_text(); s += '\n# V29 reproducible CPU export intermediates\nresearch/validation-v29/*-geometry.json.gz\nresearch/validation-v29/*-render.log\n'; p.write_text(s)

p = ROOT / 'dist/assets/data/port-workers.json'; data = json.loads(p.read_text()); barrio = next(s for s in data['sites'] if s['id']=='barrio-obrero')
barrio['modelNote'] = 'Se detallan 95 referencias catastrales y 287 partes de edificación dentro del ámbito seleccionado, incluidas las transformaciones contemporáneas; no equivalen a95casas originales. Las plantas y secciones municipales orientan dos tipos históricos de vivienda de referencia. Alturas sin cota, usos de habitaciones, mobiliario, carpinterías y vegetación privada son aproximaciones; no describen el interior privado actual de una vivienda. Las fechas catastrales no son una datación histórica definitiva.'
barrio['modelNote'] = barrio['modelNote'].replace('a95casas','a 95 casas')
for evidence in barrio['evidence']:
    if evidence.get('label')=='Escala de la vivienda':
        evidence['detail']='El catálogo documenta plantas bajas y extremos de dos pisos, jardines y patios. Sus plantas y secciones orientan los tipos de referencia; las alturas de representación no se presentan como cotas medidas.'
barrio['stateAsOf']='2026-11-21'
p.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
print('V29 integration applied; Barrio model, context, guide and plan remain independent inputs.')
