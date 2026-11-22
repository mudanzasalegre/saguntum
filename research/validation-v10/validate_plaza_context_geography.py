"""Source topology / ownership checks for the V10 plaza context selection."""
from pathlib import Path
import hashlib,json,math
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'
read=lambda name:json.loads((DATA/(name+'.json')).read_text())
source,context,church=read('cartography'),read('plaza-mayor-context'),read('santa-maria-context')
scale=111320*math.cos(math.radians(39.679))
project=lambda c:((c[0]+.278)*scale,(39.679-c[1])*111320)
poly=lambda b:Polygon([project(c)for c in b['coordinates']],[[project(c)for c in r]for r in b.get('holes',[])]).buffer(0)
by_id={str(b['id']):b for b in source['buildings']}
checks=[]
def check(value,label,detail=None):
    checks.append({'pass':bool(value),'label':label,**({'detail':detail}if detail is not None else{})})

selected=context['buildings']
check(len(selected)==94 and len({b['parentId']for b in selected})==36,'94 source parts, 36 neighbouring parcels')
check(all(b['coordinates']==by_id[str(b['id'])]['coordinates'] and b.get('holes',[])==by_id[str(b['id'])].get('holes',[])for b in selected),'all source outlines and courtyard rings are unchanged')
check(len({b['id']for b in selected})==len(selected),'context source IDs are unique')
check(not {b['id']for b in selected}&{b['id']for b in church['buildings']},'no Santa Maria source part is replaced')
check(len(church['buildings'])==44 and len({b['parentId']for b in church['buildings']})==16,'Santa Maria retains 44 parts in 16 parcels')
protected=unary_union([poly(b)for b in context['protectedFootprints']])
core=unary_union([poly(p)for b in context['coreBuildings']for p in[b,*b.get('secondaryFootprints',[])]])
overlaps=[{'id':b['id'],'protectedM2':poly(b).intersection(protected).area,'coreM2':poly(b).intersection(core).area}for b in selected]
check(max(x['protectedM2']for x in overlaps)<.25,'no new part substantially overlaps retained monuments or Santa Maria',max(x['protectedM2']for x in overlaps))
check(max(x['coreM2']for x in overlaps)<1,'only sub-metre source boundary discrepancies occur against the core',max(x['coreM2']for x in overlaps))
check(not {b['id']for b in selected}&{p['id']for b in context['coreBuildings']for p in b['cadastralParts']},'core source parts are not rendered again as context')
check(all(str(b['id'])in context['excludedBuildingIds']for b in selected),'every selected part suppresses its generic city duplicate')
check(all(len(poly(b).interiors)==len(b.get('holes',[]))for b in selected),'all mapped courtyard openings remain in topology')
portal=next(b for b in context['coreBuildings']if b.get('parentId')=='3459611YJ3935H')
check(portal['address']=='Plaça Major 17' and len(portal['cadastralParts'])==5,'Almudin is assigned to documented parcel 17 with all five source parts')
front=poly(portal);rear=unary_union([poly(p)for p in portal['secondaryFootprints']])
check(front.distance(rear)>1.2 and front.intersection(rear).area==0,'Almudin detached rear body and mapped gap are retained',{'gapM':front.distance(rear),'frontM2':front.area,'rearM2':rear.area})
check(len(context['coreBuildings'])==13,'core includes the two missing addresses 16 and 17')
check(all(str(r['sourceId'])not in context['excludedRoadIds'] for r in context['roads']if not r['replacesWholeSource']),'partial approach roads retain the generic continuation outside the detail area')
check(all(str(r['sourceId'])in context['excludedRoadIds'] for r in context['roads']if r['replacesWholeSource']),'fully replaced approach roads suppress duplicate ribbons')
check(all(poly(s).intersection(protected).area < .01 for s in context['surfaces']),'public surfaces do not intrude into protected building footprints')
result={'pass':all(c['pass']for c in checks),'checks':checks,'stats':context['selectionStats'],'sourceBoundaryOverlapM2':{'protectedTotal':sum(x['protectedM2']for x in overlaps),'coreTotal':sum(x['coreM2']for x in overlaps)},'sourceHashes':{n:hashlib.sha256((DATA/(n+'.json')).read_bytes()).hexdigest()for n in['cartography','plaza-mayor-context','santa-maria-context']},'limitations':['Sub-metre discrepancies where OSM and cadastral boundaries meet are retained and measured; no complete parcel is moved or removed to disguise them.']}
(ROOT/'research/validation-v10/plaza-context-geography-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'checks':len(checks),'failures':[c for c in checks if not c['pass']],'overlap':result['sourceBoundaryOverlapM2']},ensure_ascii=False,indent=2))
raise SystemExit(0 if result['pass'] else 1)
