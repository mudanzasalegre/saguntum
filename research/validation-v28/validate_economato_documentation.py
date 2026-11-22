"""Documentary consistency and final scene registration for the Economato visit."""
from pathlib import Path
import json, math
ROOT=Path(__file__).resolve().parents[2]
read=lambda n:json.loads((ROOT/'dist/assets/data'/f'{n}.json').read_text())
visit,plan=read('economato-visit'),read('economato-plan')
checks=[]
def check(ok,label,detail=None):checks.append({'pass':bool(ok),'label':label,**({'detail':detail}if not ok else{})})
stops=visit.get('stops',[]);ids=[s['id'] for s in stops];source_ids={s['id'] for s in visit.get('sources',[])};regions={r['id']:r for r in visit.get('regions',[])};layers={l['id'] for l in visit.get('readingLegend',[])}
expected={'economato-'+n for n in ['conjunto','fachada','portico-norte','portico-sur','nave-central','nave-norte','nave-sur','galeria','planta-alta','cubiertas','carpinterias','almacenes','patio','cooperativa','seccion','acceso','entorno','arbolado','frente-urbano','ciudad-factoria']}
check(len(ids)==20 and set(ids)==expected,'Twenty unique stops cover the agreed Economato and surroundings route')
check(len(source_ids)==len(visit['sources']) and all(s.get('url','').startswith(('https://','http://'))for s in visit['sources']),'Every source has a unique ID and a public URL')
references=[]
def scan(value):
 if isinstance(value,dict):
  for k,v in value.items():
   if k in ('sourceIds','coordinateSourceIds'):references.extend(v)
   else:scan(v)
 elif isinstance(value,list):
  for item in value:scan(item)
scan(visit)
check(bool(references)and all(s in source_ids for s in references),'All documentary and coordinate source references resolve',[s for s in references if s not in source_ids])
check(all(s.get('facts')and all(f.get('text')and f.get('sourceIds')and f.get('confidence')in ('documented','interpretive','disputed')for f in s['facts'])for s in stops),'Every stop has source-backed facts with explicit confidence')
check(all(s.get('regionId')in regions and s.get('readingLayer')in layers for s in stops),'All stops resolve to a region and material-reading layer')
listed=[s for r in regions.values()for s in r.get('stopIds',[])]
check(len(listed)==20 and set(listed)==set(ids),'Regions cover all twenty stops exactly once')
check(all(s.get('modelNote')and s.get('lookFor')and s.get('intro')for s in stops),'Each viewpoint states what to inspect and its interpretive limit')
check(visit.get('modelRegistration',{}).get('provisionalCoordinates')is False and visit.get('modelRegistration',{}).get('status')=='registered','Published stop coordinates are registered from the implemented scene')
registered={s['id']:s for s in plan.get('stops',[])}
check(set(registered)==set(ids),'Fallback map and guide share every physical focus')
def coordinate_agrees(s):
 a=s.get('coordinate');b=registered.get(s['id'],{}).get('coordinates')
 return isinstance(a,list)and isinstance(b,list)and len(a)==len(b)==2 and all(math.isfinite(v)for v in a+b)and all(abs(x-y)<1e-7 for x,y in zip(a,b))
check(all(coordinate_agrees(s)for s in stops),'Guide and plan focus coordinates agree within 1e-7 degree')
check(all(-.224<s['coordinate'][0]<-.217 and 39.655<s['coordinate'][1]<39.661 for s in stops),'All stop positions stay within the Economato district')
interiors=[s for s in stops if s.get('interiorView')]
check(len(interiors)==6 and all(s.get('floor')in (0,1)and s.get('buildingId')=='economato-edificio'for s in interiors),'Six interior viewpoints identify their floor in the Economato')
check(all(s.get('floor')is None for s in stops if not s.get('interiorView')and s['id']!='economato-seccion'),'Exterior viewpoints do not select an interior map floor')
check(next(s for s in stops if s['id']=='economato-planta-alta').get('floor')==1 and next(s for s in stops if s['id']=='economato-seccion').get('floor')==1,'Upper-floor and roof-section views select the first floor')
check(bool(visit.get('sectionInstructions'))and bool(visit.get('sectionNote'))and next(s for s in stops if s['id']=='economato-seccion').get('requiresSection'),'The architectural section is documented and available')
check(all(e.get('date')and e.get('text')and e.get('stopId')in expected and e.get('sourceIds')for e in visit.get('timeline',[])),'Timeline events link to a documented stop and evidence')
check(all(s.get('requiresSection')==registered[s['id']].get('requiresSection')and s.get('floor')==registered[s['id']].get('floor')and s.get('buildingId')==registered[s['id']].get('buildingId')for s in stops),'Section, building and floor metadata agree in guide and plan')
check('2027' in json.dumps(visit,ensure_ascii=False) and '1954' in json.dumps(visit,ensure_ascii=False),'Guide distinguishes the historic reform from the rehabilitation horizon')
result={'pass':all(c['pass']for c in checks),'checks':checks,'counts':{'stops':len(stops),'interiorViews':len(interiors),'facts':sum(len(s.get('facts',[]))for s in stops),'sources':len(source_ids),'regions':len(regions),'timelineEvents':len(visit.get('timeline',[]))},'limitations':['This checks source registration and metadata consistency, not an independent architectural survey.']}
(ROOT/'research/validation-v28/economato-documentary-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'checks':len(checks),'counts':result['counts'],'failures':[c for c in checks if not c['pass']]},ensure_ascii=False,indent=2))
raise SystemExit(0 if result['pass']else 1)
