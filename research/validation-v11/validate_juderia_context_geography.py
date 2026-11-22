"""Check source topology and ownership for the V11 quarter/context selection."""
from pathlib import Path
import hashlib,json,math
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2];DATA=ROOT/'dist/assets/data'
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
source,context,church,plaza=map(read,['cartography','juderia-context','santa-maria-context','plaza-mayor-context'])
scale=111320*math.cos(math.radians(39.679));project=lambda c:((c[0]+.278)*scale,(39.679-c[1])*111320)
poly=lambda b:Polygon([project(c)for c in b['coordinates']],[[project(c)for c in r]for r in b.get('holes',[])]).buffer(0)
by_id={str(b['id']):b for b in source['buildings']};roads={str(r['id']):r for r in source['roads']};checks=[]
def check(value,label,detail=None):checks.append({'pass':bool(value),'label':label,**({'detail':detail}if detail is not None else{})})
selected=context['buildings'];coreparts=[p for b in context['coreBuildings']for p in b['cadastralParts']]
check(len(selected)==344 and len({b['parentId']for b in selected})==146,'344 source parts in 146 surrounding parcels')
check(all(b['coordinates']==by_id[str(b['id'])]['coordinates']and b.get('holes',[])==by_id[str(b['id'])].get('holes',[])for b in selected),'all context source outlines and courtyard rings unchanged')
check(len({b['id']for b in selected})==len(selected),'unique context source IDs')
check(all(b==by_id[str(b['id'])]for b in coreparts),'all 40 detailed-core source parts retain their original attributes')
check(len(coreparts)==40 and len(context['coreBuildings'])==12,'12 core parcels retain 40 source parts')
check(all(unary_union([poly(p)for p in b['cadastralParts']]).symmetric_difference(unary_union([poly(p)for p in[b,*b.get('secondaryFootprints',[])]] )).area<.01 for b in context['coreBuildings']),'core union preserves every source component and courtyard without convex filling')
protected=unary_union([poly(b)for b in context['protectedFootprints']]);core=unary_union([poly(p)for b in context['coreBuildings']for p in[b,*b.get('secondaryFootprints',[])]])
overlap=[{'id':b['id'],'protectedM2':poly(b).intersection(protected).area,'coreM2':poly(b).intersection(core).area}for b in selected]
check(max(x['protectedM2']for x in overlap)<.25,'no complete protected building is duplicated; only measured edge discrepancies remain',max(x['protectedM2']for x in overlap))
check(max(x['coreM2']for x in overlap)<.45,'context has no significant overlap with detailed core',max(x['coreM2']for x in overlap))
check(not {b['id']for b in selected}&{b['id']for b in coreparts},'core source parts are not rendered twice')
check(not {b['id']for b in selected}&{b['id']for b in church['buildings']+plaza['buildings']},'no source part from Santa Maria or Plaça Major is replaced')
check(len(church['buildings'])==44 and len({b['parentId']for b in church['buildings']})==16,'Santa Maria retains 44 parts in 16 parcels')
check(len(plaza['buildings'])==94 and len({b['parentId']for b in plaza['buildings']})==36 and len(plaza['coreBuildings'])==13,'Plaça Major retains 94 context parts in 36 parcels and 13 core façades')
check(all(str(b['id'])in context['excludedBuildingIds']for b in selected+coreparts),'all detailed source parts suppress generic city duplicates')
check(sum(len(b.get('holes',[]))for b in selected)==3 and all(len(poly(b).interiors)==len(b.get('holes',[]))for b in selected),'all three mapped context courtyard openings retained')
check(all(LineString([project(c)for c in r['coordinates']]).difference(LineString([project(c)for c in roads[r['sourceId']]['coordinates']]).buffer(.001)).length<.01 for r in context['roads']),'all road fragments lie on their original OSM axes')
check(all(str(r['sourceId'])not in context['excludedRoadIds']for r in context['roads']if not r['replacesWholeSource']),'partial streets retain generic continuation outside detailed area')
check(all(str(r['sourceId'])in context['excludedRoadIds']for r in context['roads']if r['replacesWholeSource']),'fully replaced streets suppress duplicate ribbons')
check(all(poly(s).intersection(protected).area<.01 for s in context['surfaces']),'public paved area avoids protected buildings')
check(all(str(r['sourceId'])not in ['1419209841','1419209842','1419209843','1419209844','1419209845','1419209846']for r in context['roads']),'no private Berenguer footpath or lift becomes an asserted public route')
check(not any(b['id'].startswith('cat-3556901')for b in selected),'retained Roman Theatre cadastral bodies are not reconstructed as neighbourhood houses')
result={'pass':all(c['pass']for c in checks),'checks':checks,'stats':context['selectionStats'],'sourceBoundaryOverlapM2':{'protectedTotal':sum(x['protectedM2']for x in overlap),'coreTotal':sum(x['coreM2']for x in overlap)},'inputHashes':{f'dist/assets/data/{n}.json':hashlib.sha256((DATA/(n+'.json')).read_bytes()).hexdigest()for n in['cartography','juderia-context','plaza-mayor-context','santa-maria-context']},'limitations':['Small disagreements at boundaries between OSM monument envelopes and Catastro parts are retained and quantified; source polygons are not moved to disguise them.']}
(ROOT/'research/validation-v11/juderia-context-geography-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'pass':result['pass'],'checks':len(checks),'failures':[c for c in checks if not c['pass']],'overlap':result['sourceBoundaryOverlapM2']},ensure_ascii=False));raise SystemExit(0 if result['pass']else 1)
