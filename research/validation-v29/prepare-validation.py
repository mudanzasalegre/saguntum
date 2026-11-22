"""Prepare V29 gates from the verified V28 workflows; never reuse their results."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[2]
old = root/'research/validation-v28'
out = root/'research/validation-v29'
if (root/'dist/assets/data/barrio-plan.json').exists():
    raise SystemExit('One-time preparation only: V29 is already registered. Use the existing validation scripts directly.')

# Register exact observation targets and preserve the multi-building/floor plan.
s = (old/'build-economato-plan.mjs').read_text().replace('Economato','Barrio').replace('economato','barrio').replace('validation-v28','validation-v29')
s = s.replace("s.id==='barrio'", "s.id==='barrio-obrero'")
s = s.replace("naves:plan.naves?.length", "buildings:plan.buildings?.length,floors:plan.floors?.length,blocks:plan.blocks?.length")
(out/'build-barrio-plan.mjs').write_text(s)

# Production integration and exact geometry export. Keep the previous Economato
# inputs and context as a regression dependency of the actual buildRegion body.
base = (root/'research/validate_port_v28.mjs').read_text()
tracked = base[base.index('const tracked='):base.index('\nconst hash=')]
s = base.replace('V28','V29').replace('validation-v28','validation-v29').replace('Economato','Barrio Obrero').replace('ECONOMATO','BARRIO').replace('economato','barrio')
s = s.replace("selected='barrio'", "selected='barrio-obrero'")
s = s.replace("guidedIds=['barrio']", "guidedIds=['barrio-obrero']").replace("name==='barrio'", "name==='barrio-obrero'")
s = s.replace(".sites?.barrio?.", ".sites?.['barrio-obrero']?.").replace(".sites.barrio", ".sites['barrio-obrero']")
s = s.replace("preset('barrio',near)", "preset('barrio-obrero',near)").replace("id!=='barrio'", "id!=='barrio-obrero'")
load = "const economatoData=read('economato-visit'),economatoContextData=read('economato-context');economatoData.plan=read('economato-plan');\n"
s = s.replace("const barrioData=", load+"const barrioData=")
s = s[:s.index('const tracked=')]+tracked.replace('];',",'dist/js/barrio.js','dist/js/barrio-context.js','dist/js/barrio-map.js','dist/assets/data/barrio-visit.json','dist/assets/data/barrio-plan.json','dist/assets/data/barrio-context.json'];")+s[s.index('\nconst hash='):]
s = s.replace('portHeritage.begonaContext,portHeritage.barrioContext','portHeritage.begonaContext,portHeritage.economatoContext,portHeritage.barrioContext')
s = s.replace("&&portHeritage.sites.begona.visit,", "&&portHeritage.sites.begona.visit&&portHeritage.sites.economato.visit,")
s = s.replace('all seven detailed contexts','all eight detailed contexts').replace('all eight vegetation groups','all nine vegetation groups')
s = s.replace("'barrio-acceso','barrio-entorno'", "'barrio-accesos','barrio-calles'")
s = s.replace("['barrio-conjunto','barrio-fachada','barrio-nave-central','barrio-galeria','barrio-planta-alta','barrio-entorno','barrio-seccion']", "['barrio-conjunto','barrio-hileras','barrio-sala','barrio-cocina','barrio-planta-alta','barrio-calles','barrio-seccion']")
s = s.replace("renderRadius=id==='barrio-conjunto'||id==='barrio-seccion'?220:160", "renderRadius=id==='barrio-conjunto'?320:id==='barrio-seccion'?100:f.interiorView?45:180")
(root/'research/validate_port_v29.mjs').write_text(s)

# Responsive Canvas plans, level filters and hit targets.
s = (old/'validate_economato_maps.mjs').read_text().replace('Economato','Barrio').replace('economato','barrio').replace('validation-v28','validation-v29')
s = s.replace("'barrio-nave-central'", "'barrio-sala'").replace("'barrio-galeria'", "'barrio-vivienda-esquina'").replace("'barrio-entorno'", "'barrio-calles'")
s = s.replace(".floor===result.floor));", ".floor===result.floor&&visit.plan.stops.find(s=>s.id===t.id).buildingId===result.buildingId));")
(out/'validate_barrio_maps.mjs').write_text(s)

# Asset gate retains preceding monument assertions and checks the appended data.
s = (old/'validate_static_assets.py').read_text().replace('validation-v28','validation-v29')
s = s.replace("len(initial_names)==78,'78 initial", "len(initial_names)==81,'81 initial")
s = s.replace("initial_names[-3:]==['economato-visit'", "initial_names[75:78]==['economato-visit'")
s = s.replace("deferred=['cartography'", "check(initial_names[-3:]==['barrio-visit','barrio-plan','barrio-context'],'Barrio occupies three appended request slots')\nfor name in ['barrio.js','barrio-context.js','barrio-map.js']:check((DIST/'js'/name).is_file(),'Barrio implementation module exists: '+name)\ndeferred=['cartography'")
s = s.replace("'economato-panel']", "'economato-panel','barrio-obrero-panel']")
(out/'validate_static_assets.py').write_text(s)

# Exercise the real shared visitor controller with the appended neighbourhood.
s = (old/'validate_visit_controllers.mjs').read_text().replace('validation-v28','validation-v29')
s = s.replace('Object.keys(fixtures).length,22','Object.keys(fixtures).length,23')
s = s.replace('const fixtures=Object.fromEntries', "datasets['barrio-obrero']={...read('barrio'),sectionOnOverview:true};labels['barrio-obrero']='BARRIO OBRERO';\nstorage.set('saguntum.barrio-obrero.visited.v1',JSON.stringify(['barrio-sala','economato-nave-central','removed-barrio-stop']));\nconst fixtures=Object.fromEntries")
marker = 'for(const [id,data] of Object.entries(datasets))check(id+'  # before the complete route pass
tests = r'''
check('Barrio retains independent progress, two houses, floors, sources and fallback',()=>{
 const f=fixtures['barrio-obrero'],data=datasets['barrio-obrero'];
 const before=Object.fromEntries(Object.entries(fixtures).filter(([id])=>id!=='barrio-obrero').map(([id,v])=>[id,v.guide.getState()]));
 assert.deepEqual(f.guide.getState().visited,['barrio-sala']);assert.equal(f.guide.getState().selected,null);
 assert.match(f.el.innerHTML,/data-visit-section/);
 click(f.el,{},['data-visit-section']);assert(f.guide.getState().sectionOpen);assert(f.el.innerHTML.includes(data.sectionNote));
 click(f.el,{},['data-visit-section']);assert(!f.guide.getState().sectionOpen);
 for(const id of ['barrio-sala','barrio-cocina','barrio-planta-alta','barrio-seccion','barrio-calles']){
  click(f.el,{castleStop:id});assert.equal(f.guide.getState().selected,id);
 }
 click(f.el,{castleReading:'periods'});for(const layer of data.readingLegend)assert(f.el.innerHTML.includes(layer.label));
 click(f.el,{castleSource:data.sources[0].id});assert.equal(f.source.id,data.sources[0].id);assert.match(f.guide.sourceContent(data.sources[0]),/BARRIO OBRERO/);
 key(f.el,'ArrowRight');assert.equal(f.guide.getState().tab,'timeline');key(f.el,'End');assert.equal(f.guide.getState().tab,'sources');key(f.el,'Home');
 click(f.el,{},['data-castle-map']);assert.equal(f.maps,1);
 f.setReady(false);assert.match(f.el.innerHTML,/data-visit-section aria-pressed="false" disabled/);assert.match(f.el.innerHTML,/requieren WebGL/);
 click(f.el,{castleStop:'barrio-carpinterias'});assert.equal(f.guide.getState().selected,'barrio-carpinterias');f.setReady(true);
 for(const[id,state]of Object.entries(before))assert.deepEqual(fixtures[id].guide.getState(),state);
 assert(!JSON.parse(storage.get('saguntum.barrio-obrero.visited.v1')).includes('economato-nave-central'));
});
check('Production section callback frames the representative house from overview and retains an interior selection',()=>{
 const app=fs.readFileSync(root+'dist/js/app.js','utf8');
 const shared=app.slice(app.indexOf('...(data.sectionInstructions&&!archaeologicalVisitIds.has(id)?{onSection:'));
 const source=shared.match(/onSection:(open=>\{if\(!ready\|\|!regionsBuilt\.has[\s\S]*?updateStatus\(\);\})/);
 assert(source,'Actual section callback must be extractable');
 const id='barrio-obrero',state={stopId:null,sectionOpen:false},calls=[];
 let ready=true;const regionsBuilt=new Set(['puerto']),byId={[id]:{region:'puerto'}},regionOf=c=>c.region;
 const selectVisitStop=(place,stop)=>{calls.push([place,stop]);state.stopId=stop;state.sectionOpen=stop==='barrio-seccion';};
 const guidedVisit=()=>({model:{focuses:{'barrio-seccion':{requiresSection:true},'barrio-sala':{requiresSection:false}}}});
 const castlePanel=()=>{},refreshMap=()=>{},renderer={shadowMap:{}},updateStatus=()=>{};
 const handler=eval('('+source[1]+')');
 handler(true);assert.deepEqual(calls.pop(),[id,'barrio-seccion']);assert(state.sectionOpen);
 handler(false);assert.deepEqual(calls.pop(),[id,null]);assert(!state.sectionOpen);
 state.stopId='barrio-sala';handler(true);assert(state.sectionOpen);assert.equal(state.stopId,'barrio-sala');assert.equal(calls.length,0);
 handler(false);assert(!state.sectionOpen);assert.equal(state.stopId,'barrio-sala');
 ready=false;handler(true);assert(!state.sectionOpen);
});
'''
s = s.replace(marker,tests+'\n'+marker)
s = s.replace('data:{visits:Object.keys(datasets).length,', "data:{visits:Object.keys(datasets).length,barrioStops:datasets['barrio-obrero'].stops.length,barrioSources:datasets['barrio-obrero'].sources.length,")
(out/'validate_visit_controllers.mjs').write_text(s)

for source,target in [('render-economato-scenes.py','render-barrio-scenes.py'),('render_economato.py','render_barrio.py'),('record_render_input.py','record_render_input.py')]:
    s=(old/source).read_text().replace('V28','V29').replace('validation-v28','validation-v29').replace('Economato','Barrio Obrero').replace('ECONOMATO','BARRIO').replace('economato','barrio')
    s=s.replace('barrio-fachada','barrio-hileras').replace('barrio-nave-central','barrio-sala').replace('barrio-galeria','barrio-cocina').replace('barrio-entorno','barrio-calles')
    (out/target).write_text(s)

# The dimensions on municipal sheet 82 are documentary, not inferred heights.
path=root/'dist/assets/data/port-workers.json'
data=json.loads(path.read_text())
barrio=next(site for site in data['sites'] if site['id']=='barrio-obrero')
barrio['modelNote']='Se detallan 95 referencias catastrales y 287 partes edificadas en siete manzanas. Las plantas y secciones municipales orientan dos tipos de vivienda de referencia: casa baja y extremo de dos plantas. La sección S1 documenta aleros de 3,70 y 7,30 m; se aplican a esos tipos, sin atribuirlos a todas las transformaciones actuales. Las alturas sin cota, los usos de las habitaciones y los detalles interiores son aproximaciones interpretativas.'
for evidence in barrio.get('evidence',[]):
    if evidence.get('label')=='Escala de la vivienda':
        evidence['detail']='La sección S1 del catálogo municipal (lámina 82) documenta aleros de 3,70 y 7,30 m, jardín delantero de 3,50 m y calle de 7 m. La sección S2 indica 7 m en el tipo V. Son cotas de los tipos históricos; las transformaciones posteriores y las dimensiones no acotadas se representan de forma interpretativa.'
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('V29 validation scripts prepared; municipal dimension evidence corrected.')
