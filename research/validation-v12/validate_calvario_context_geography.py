"""Check source geometry, retained owners and exterior pavement ownership."""
from pathlib import Path
import hashlib,json,math
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'dist/assets/data'
read=lambda n:json.loads((D/(n+'.json')).read_text())
context,cartography=read('calvario-context'),read('cartography')
scale=111320*math.cos(math.radians(39.679));project=lambda p:((p[0]+.278)*scale,(39.679-p[1])*111320)
poly=lambda b:Polygon([project(p)for p in b['coordinates']],[[project(p)for p in r]for r in b.get('holes',[])]).buffer(0)
by_id={str(b['id']):b for b in cartography['buildings']};roads={str(r['id']):r for r in cartography['roads']}
checks=[]
def check(p,label,detail=None):checks.append({'pass':bool(p),'label':label,'detail':detail})
rows=context['buildings'];ids={str(b['id'])for b in rows};parents={b['parentId']for b in rows}
check(len(rows)==156 and len(parents)==60,'156 source parts and60 complete cadastral parcels')
check(len(ids)==len(rows),'No duplicate context building parts')
keys=['coordinates','holes','parentId','height','levels','surfaceHeightEstimate','surfaceHeightP95','roofColor','roofShape']
check(all(all(b.get(k)==by_id[str(b['id'])].get(k)for k in keys)for b in rows),'Hulls, patios, source heights and roof colours preserved exactly')
check(ids=={str(b['id'])for b in cartography['buildings']if b.get('parentId')in parents},'Every selected cadastral parent keeps all its parts')
check(sum(len(b.get('holes',[]))for b in rows)==3,'Three source courtyard holes retained')
check(all((b.get('height')or b.get('surfaceHeightEstimate')or b.get('levels')or 0)>0 for b in rows),'Every selected height has an attributed measurement estimate or storey count')
selected=unary_union([poly(b)for b in rows]);protected=unary_union([poly(b)for b in context['protectedFootprints']]);overlap=selected.intersection(protected).area
check(overlap<.001,'No area overlap with earlier detail or monument footprints',overlap)
for owner in['santa-maria','plaza-mayor','juderia']:
 old=read(owner+'-context');check(not(ids&set(map(str,old['excludedBuildingIds']))),'Preserves every '+owner+' source owner')
check(ids.issubset(set(context['excludedBuildingIds'])),'All new source parts are excluded from the generic city')
check(set(context['excludedBuildingIds'])-ids==set(context['selectionStats']['OSMDuplicates']),'Only recorded duplicate OSM buildings are additionally excluded')
for road in context['roads']:
 source=LineString([project(p)for p in roads[road['sourceId']]['coordinates']]);line=LineString([project(p)for p in road['coordinates']])
 check(line.difference(source.buffer(.002)).length<.001,'Road '+road['id']+' remains on its source centreline')
check(all(next(r for r in context['roads']if r['sourceId']==id)['replacesWholeSource']for id in context['excludedRoadIds']),'Only completely replaced source streets are excluded globally')
mesh=context['pavementMesh'];tris=[]
for group in mesh['groups']:
 a=group['indices'];tris.extend(Polygon([mesh['vertices'][i]for i in a[n:n+3]])for n in range(0,len(a),3))
pavement=unary_union(tris);district=poly({'coordinates':context['districtOutline']})
check(pavement.intersection(district).area<.001,'External pavement does not invade the core enclosure')
check(mesh['coverage']['pass'],'Pavement union covers its target without doubled faces or courtyard filling',mesh['coverage'])
check(mesh['terrainGrid']['spacingM']==2.5,'External pavement matches the existing terrain grid')
result={'pass':all(c['pass']for c in checks),'checks':checks,'counts':context['selectionStats'],'protectedOverlapM2':overlap,
 'inputHashes':{n:hashlib.sha256((D/(n+'.json')).read_bytes()).hexdigest()for n in['calvario-context','cartography','landmarks','santa-maria-context','plaza-mayor-context','juderia-context']}}
(ROOT/'research/validation-v12/calvario-context-geography-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'checks':len(checks),'failures':[c for c in checks if not c['pass']]},ensure_ascii=False))
raise SystemExit(0 if result['pass']else 1)
