"""Small, bundled V6 summaries and territorial reference map."""
import json,math
from pathlib import Path
BASE=Path(__file__).resolve().parents[1];OUT=BASE/'dist/assets/data'
read=lambda n:json.loads((OUT/(n+'.json')).read_text())
# Small legacy monument footprint payload for the Palancia context.
historic=read('cartography')
(OUT/'historic-context.json').write_text(json.dumps({**{k:historic[k] for k in ['castlePolygon','theatrePolygon','castleWalls']},'source':'Subset of the historic atlas cartography for geographic context in Palancia'},ensure_ascii=False,separators=(',',':')))
summary={}
for region,prefix in [('sagunto',''),('puerto','port-'),('coast','coast-'),('marjal','marjal-'),('almarda','almarda-'),('palancia','palancia-')]:
 d=read(prefix+'cartography');e=read(prefix+'elevation');bp=d.get('buildingFootprintProvenance',{});hp=d.get('surfaceHeightProvenance',{})
 summary[region]={'mappedParts':len(d['buildings']),'catastroParts':bp.get('derived_parts',0),'heightEstimates':hp.get('estimated_buildings',0),'roofSamples':sum('roofColor' in b for b in d['buildings']),'elevationWidth':e['width'],'elevationHeight':e['height'],'bounds':e['bounds'],'sourceDate':bp.get('sourceDate'),'note':'Parts are not distinct buildings. Regional extents overlap; do not sum as a municipality inventory.'}
(OUT/'atlas-data-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
# Merge only coast vertices within each documented segment; the industrial pier
# comes from the corrected coastal dataset, not the old OSM shoreline along it.
coast=[]
for name,lo,hi in [('marjal-water',39.60,39.633),('coast-water',39.633,39.660),('palancia-water',39.660,39.697),('almarda-water',39.697,39.76)]:
 for c in read(name)['coastline']:
  if lo<=c[1]<hi:coast.append(c)
# Retain source segment order (south to north). Each segment is already ordered.
unique=[]
for c in coast:
 if not unique or c!=unique[-1]:unique.append(c)
base=read('regional');roads={r['id']:r for r in base['roads']};areas={r['id']:r for r in base.get('urbanAreas',[])};water=[]
for key in ['marjal','almarda','palancia']:
 d=read(key+'-cartography')
 for r in d['roads']:
  if r['kind'] in ['motorway','trunk','primary','secondary','tertiary']:roads[r['id']]={k:r[k] for k in ['id','kind','coordinates']}
 for r in d['landcover']:
  if r['kind'] in ['residential','industrial','commercial','wetland']:areas[r['id']]={k:r[k] for k in ['id','kind','coordinates']}
 for r in read(key+'-water')['surfaces']:
  if r['kind']!='sea' and r['areaM2']>300:water.append({'coordinates':r['outer'],'kind':'pond'})
pal=read('landscape-palancia')['sites'][0]['survey']
# Dry corridor, explicitly distinct from open water in the map renderer.
water += [{'coordinates':pal[k],'kind':'dry-channel'} for k in ['mainAxis','southAxis']]
territory={'geographicBounds':{'west':-.303,'east':-.16,'south':39.607,'north':39.752},'coastline':unique,'roads':list(roads.values()),'urbanAreas':list(areas.values()),'water':water}
(OUT/'landscape-territory.json').write_text(json.dumps(territory,ensure_ascii=False,separators=(',',':')))
print(json.dumps(summary,ensure_ascii=False,indent=2))
