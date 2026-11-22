"""Apply the bounded V30 Sanatorio integration to the verified V29 source."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
changes = {}

def replace(text, old, new, count=1):
    assert text.count(old) == count, (old[:120], text.count(old), count)
    return text.replace(old, new)

p = ROOT / 'dist/js/app.js'
s = p.read_text()
assert './sanatorio-map.js' not in s, 'V30 integration already applied'
s = replace(s, "import {drawBarrioMap} from './barrio-map.js';", "import {drawBarrioMap} from './barrio-map.js';\nimport {drawSanatorioMap} from './sanatorio-map.js';")
s = replace(s, 'barrioData=null,barrioContextData=null;', 'barrioData=null,barrioContextData=null,sanatorioData=null,sanatorioContextData=null;')
s = replace(s, "'economato','barrio-obrero'].map(id=>", "'economato','barrio-obrero','sanatorio'].map(id=>")
s = replace(s, "'economato','barrio-obrero'];", "'economato','barrio-obrero','sanatorio'];")
s = replace(s, "const barrioVisit=()=>portHeritage?.sites?.['barrio-obrero']?.visit;", "const barrioVisit=()=>portHeritage?.sites?.['barrio-obrero']?.visit;\nconst sanatorioVisit=()=>portHeritage?.sites?.sanatorio?.visit;")
s = replace(s, "'barrio-obrero':barrioData})[id];", "'barrio-obrero':barrioData,sanatorio:sanatorioData})[id];")
branch = " if(id==='sanatorio'){const state=visitStates[id];return{id,data:sanatorioData,guide:state.guide,stopId:state.stopId,readingMode:state.readingMode,sectionOpen:state.sectionOpen,model:sanatorioVisit(),drawMap:drawSanatorioMap,label:'ANTIGUO SANATORIO',subtitle:'El edificio, sus jardines y la memoria de los cuidados',mapTitle:'ANTIGUO SANATORIO · EDIFICIO Y JARDINES',mapHeading:'La salud entre jardines.',mapAria:'Abrir plano del Antiguo Sanatorio, sus jardines y la planta baja histórica',scale:50,overviewId:'sanatorio-conjunto'};}\n"
s = replace(s, " if(id==='barrio-obrero'){", branch + " if(id==='barrio-obrero'){")
mini = "if(v.id==='sanatorio'&&plan){$('minimap').setAttribute('aria-label','Plano del Antiguo Sanatorio: '+plan.floorLabel);$('map-place-count').textContent=plan.floorLabel+' · '+plan.targets.length+' paradas';}"
s = replace(s, "if(v.id==='barrio-obrero'&&plan){", mini + "if(v.id==='barrio-obrero'&&plan){")
s = replace(s, "'economato','barrio-obrero'].includes(monumentId)", "'economato','barrio-obrero','sanatorio'].includes(monumentId)")
s = replace(s, "(monumentId==='barrio-obrero'?'Plano del Barrio Obrero: '", "(monumentId==='sanatorio'?'Plano del Antiguo Sanatorio: ':monumentId==='barrio-obrero'?'Plano del Barrio Obrero: '")
s = replace(s, 'portHeritage?.barrioContext])', 'portHeritage?.barrioContext,portHeritage?.sanatorioContext])')
s = replace(s, " if(portHeritage?.sites?.['barrio-obrero']?.vegetation)portHeritage.sites['barrio-obrero'].vegetation.visible=visible('vegetation');", " for(const id of ['barrio-obrero','sanatorio'])if(portHeritage?.sites?.[id]?.vegetation)portHeritage.sites[id].vegetation.visible=visible('vegetation');")
method = '<h3>Antiguo Sanatorio · edificio, jardines y planta histórica</h3><p>Las huellas de Catastro, la ortofotografía y las fotografías de archivo orientan el edificio en T, sus accesos, pabellones, chalets y jardines. Un plano histórico permite interpretar el fragmento central de la planta baja, con vestíbulo, escalera, capilla y sacristía. Esa lectura histórica se identifica dentro del Centro Cívico actual, cuyo interior ha sido remodelado. Las cotas sin levantamiento, materiales, mobiliario y distribución de la vegetación son aproximaciones documentadas; los elementos desaparecidos no se incorporan a la imagen exterior actual.</p>'
s = replace(s, '<h3>Patrimonio industrial · lugares 14–22</h3>', method + '<h3>Patrimonio industrial · lugares 14–22</h3>')
help_text = 'El Antiguo Sanatorio incorpora una visita al edificio, sus pabellones y jardines. La sección abre el fragmento central documentado de la planta baja histórica, con plano y paradas interiores. '
s = replace(s, 'Cambia Sagunto / Puerto / Costa / Paisajes para explorar cada ámbito.', help_text + 'Cambia Sagunto / Puerto / Costa / Paisajes para explorar cada ámbito.')
s = replace(s, 'barrioContext:barrioContextData});', 'barrioContext:barrioContextData,sanatorioVisit:sanatorioData,sanatorioContext:sanatorioContextData});')
status = "sanatorio:{selected:visitStates.sanatorio.stopId,readingMode:visitStates.sanatorio.readingMode,sectionOpen:visitStates.sanatorio.sectionOpen,visit:visitStates.sanatorio.guide?.getState(),geometry:sanatorioVisit()?.stats,context:portHeritage?.sanatorioContext?.stats},"
s = replace(s, 'window.atlasStatus={ready,theme:getTheme(),barrioObrero:', 'window.atlasStatus={ready,theme:getTheme(),' + status + 'barrioObrero:')
s = replace(s, "'barrio-visit','barrio-plan','barrio-context'].map", "'barrio-visit','barrio-plan','barrio-context','sanatorio-visit','sanatorio-plan','sanatorio-context'].map")
s = replace(s, 'barrioContextData=loaded[80];', "barrioContextData=loaded[80];sanatorioData=loaded[81];sanatorioData.plan=loaded[82];sanatorioContextData=loaded[83];sanatorioData.sectionOnOverview=true;sanatorioData.relatedVisits=[{id:'barrio-obrero',label:'Recorrer el Barrio Obrero'},{id:'gerencia',label:'Explorar la ciudad jardín'},{id:'museo-industrial',label:'Conocer el Museo Industrial'}];")
card = " Object.assign(byId.sanatorio,{era:'LA SALUD EN LA CIUDAD FACTORÍA · 1949',title:'La salud<br><em>entre jardines.</em>',description:sanatorioData.subtitle||sanatorioData.introduction,facts:[['1949','Entrada en servicio'],[String(sanatorioData.stops.length)+' paradas','Edificio, jardines y entorno']],features:['Fachada, pórtico y accesos del edificio en T','Planta baja histórica documentada','Pabellones, chalets y jardines'],sources:sanatorioData.sources.map(source=>source.url)});\n"
s = replace(s, ' for(const id of Object.keys(visitStates)){const state=visitStates[id],data=visitDataFor(id);', card + ' for(const id of Object.keys(visitStates)){const state=visitStates[id],data=visitDataFor(id);')
s = replace(s, "if(id==='barrio-obrero'&&open&&(!state.stopId||state.stopId==='barrio-conjunto'))", "if(id==='sanatorio'&&open&&(!state.stopId||state.stopId==='sanatorio-conjunto')){selectVisitStop(id,'sanatorio-seccion');return;}if(id==='barrio-obrero'&&open&&(!state.stopId||state.stopId==='barrio-conjunto'))")
changes[p] = s

p = ROOT / 'dist/js/port.js'; s = p.read_text()
s = replace(s, "import {createBarrioContext} from './barrio-context.js';", "import {createBarrioContext} from './barrio-context.js';\nimport {createSanatorioContext} from './sanatorio-context.js';")
s = replace(s, ' const contexts={\n', " const contexts={\n  sanatorio:createSanatorioContext({contextData:options.sanatorioContext||{},visitData:options.sanatorioVisit||{},project:options.project,heightAt:options.heightAt}),\n")
s = replace(s, "'barrio-obrero':options.barrioVisit};", "'barrio-obrero':options.barrioVisit,sanatorio:options.sanatorioVisit};")
s = replace(s, "barrioContext:contexts['barrio-obrero'],stats,", "barrioContext:contexts['barrio-obrero'],sanatorioContext:contexts.sanatorio,stats,")
changes[p] = s

changes[ROOT / 'dist/js/port-workers.js'] = """import * as THREE from 'three';
import {createEconomato} from './economato.js';
import {createBarrio} from './barrio.js';
import {createSanatorio} from './sanatorio.js';

// Each company-town ensemble owns its architecture and documented visit.
// All factories use the same metric frame and final-ground binding contract.
export function createPortWorkers({heightAt,project,records,economatoContext,economatoVisit,barrioContext,barrioVisit,sanatorioContext,sanatorioVisit}){
 const all=Array.isArray(records)?records:records.sites||Object.values(records),group=new THREE.Group();
 group.name='La vida cotidiana en la ciudad factoría';
 const sites={},factories={
  economato:{create:createEconomato,context:economatoContext,visit:economatoVisit},
  'barrio-obrero':{create:createBarrio,context:barrioContext,visit:barrioVisit},
  sanatorio:{create:createSanatorio,context:sanatorioContext,visit:sanatorioVisit}
 };
 for(const record of all){
  const factory=factories[record.id];if(!factory)continue;
  const site=factory.create({record,project,heightAt,contextData:factory.context,visitData:factory.visit});
  sites[record.id]=site;group.add(site.group);
 }
 return {group,sites,stats:{places:Object.keys(sites).length,parts:Object.values(sites).reduce((n,s)=>n+s.stats.parts,0),triangles:Object.values(sites).reduce((n,s)=>n+s.stats.triangles,0)}};
}
"""

p = ROOT / 'dist/index.html'; s = p.read_text()
panel = '<section class="castle-panel sanatorio-panel" id="sanatorio-panel" hidden aria-label="Visita al Antiguo Sanatorio, sus jardines y su planta baja histórica"></section>'
s = replace(s, '<section class="industrial-panel" id="industrial-panel"', panel + '<section class="industrial-panel" id="industrial-panel"')
changes[p] = s

p = ROOT / 'dist/style.css'; s = p.read_text(); assert s.count('.barrio-obrero-mode') == 60
changes[p] = s.replace('.barrio-obrero-mode', '.barrio-obrero-mode,.sanatorio-mode')
p = ROOT / 'package.json'; package = json.loads(p.read_text()); package['version'] = '30.0.0'; changes[p] = json.dumps(package, indent=2)+'\n'
p = ROOT / '.gitignore'; s = p.read_text(); changes[p] = s + '\n# V30 reproducible CPU export intermediates\nresearch/validation-v30/*-geometry.json.gz\nresearch/validation-v30/*-render.log\n'

p = ROOT / 'dist/assets/data/port-workers.json'; data = json.loads(p.read_text()); sanatorio = next(s for s in data['sites'] if s['id']=='sanatorio')
sanatorio['modelNote'] = 'Se conservan las catorce partes catastrales del conjunto. Fotografías, ortofotografía y documentación patrimonial orientan la arquitectura y los jardines. El fragmento central de la planta baja histórica se interpreta a partir de un plano de archivo: vestíbulo, escalera, capilla y sacristía. No describe la distribución administrativa del Centro Cívico actual. Las alturas no acotadas, materiales, mobiliario, detalles menores y posiciones de la vegetación son aproximaciones.'
sanatorio['evidence'].append({'level':'historical','label':'Planta baja histórica','detail':'Fragmento del plano publicado por CONTRAST/APIPS con vestíbulo, escalera, capilla de ábside curvo y sacristía. La sección se identifica como una lectura histórica del edificio.'})
for label,url in [('CONTRAST/APIPS · arquitectura, jardín y plano histórico','https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana.htm'),('Fundació Port de Sagunt · archivo fotográfico del Sanatorio','https://www.fundacioportdesagunt.com/mediateca-cast/')]:
 if not any(x.get('url')==url for x in sanatorio['sources']):sanatorio['sources'].append({'label':label,'url':url})
sanatorio['stateAsOf']='2026-11-21'
changes[p] = json.dumps(data, ensure_ascii=False, indent=2)+'\n'

for path,text in changes.items():path.write_text(text)
print('V30 integrated: architecture, context, guide and registered plan remain independent inputs.')
