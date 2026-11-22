"""Derive a coastal display mask from OSM, correcting the elevated historic pier.

The port coastline way includes the deck perimeter as if it were solid land.
Remove that obsolete spur from the water boundary; the actual decks and supports
are represented independently in Three.js. This is not hydrographic bathymetry.
"""
from pathlib import Path
import json, math
from osgeo import ogr
ogr.UseExceptions()
def polygon(coords):
    ring=ogr.Geometry(ogr.wkbLinearRing)
    for x,y in coords:ring.AddPoint_2D(x,y)
    ring.CloseRings();result=ogr.Geometry(ogr.wkbPolygon);result.AddGeometry(ring);return result
def ring_coords(r):return [(r.GetX(i),r.GetY(i)) for i in range(r.GetPointCount())]

BASE=Path(__file__).resolve().parents[1];OUT=BASE/'dist/assets/data'
cart=json.loads((OUT/'coast-cartography.json').read_text())
regional=json.loads((OUT/'regional.json').read_text())
factor=111320*math.cos(math.radians(39.679))
def project(c):return[(c[0]+.278)*factor,(39.679-c[1])*111320]
def unproject(c):return[round(-.278+c[0]/factor,7),round(39.679-c[1]/111320,7)]
ways={c['id']:c['coordinates'] for c in regional['coastlines']}
original=ways['4787626']
start=original.index([-.2060287,39.6521423]);end=original.index([-.2060152,39.652225])
corrected=original[:start+1]+original[end:]
ways['4787626']=corrected
coast=[]
for key in ['4787623','4787626','4787594','160266761','158772875','158772864']:
    c=ways[key];coast.extend(c[1:] if coast and coast[-1]==c[0] else c)
sea=polygon([project(p) for p in coast]+[project([-.17,coast[-1][1]]),project([-.17,coast[0][1]])]).Buffer(0)
s=cart['terrainShape'];crop=polygon([(s['cx']+s['rx']*math.cos(i*math.tau/1024),s['cz']+s['rz']*math.sin(i*math.tau/1024)) for i in range(1024)])
sea=sea.Intersection(crop)
geoms=[sea.GetGeometryRef(i) for i in range(sea.GetGeometryCount())] if sea.GetGeometryName()=='MULTIPOLYGON' else [sea]
polygons=[{'outer':[unproject(c) for c in ring_coords(g.GetGeometryRef(0))],'holes':[[unproject(c) for c in ring_coords(g.GetGeometryRef(i))] for i in range(1,g.GetGeometryCount())]} for g in geoms]
result={'title':'Mar Mediterráneo · máscara cartográfica del atlas','retrieved':'2026-11-19','waterLevelM':.08,'source':'© OpenStreetMap contributors · ODbL','sourceUrl':'https://www.openstreetmap.org/copyright','coastline':coast,'polygons':polygons,'corrections':[{'osmWay':'4787626','description':'The perimeter of the elevated historical pier is removed from the coastline mask between the two mapped abutment points. The corresponding decks and supports are independent architectural geometry, with water beneath them.','from':original[start],'to':original[end],'evidence':['https://www.valenciaport.com/wp-content/uploads/SOSTENIBILIDAD-2025.pdf','https://www.valenciaport.com/maqueta-tiflologica-del-nuevo-paseo-maritimo-del-puerto-de-sagunto/']}],'excludedWaterWays':['1418515037'],'seabedNote':'Water-region terrain is lowered for display to expose underwater structures. This is an expository background, not measured bathymetry. The original IGN elevation raster is preserved.'}
(OUT/'coast-water.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
print('Sea polygons',len(polygons),'area m2',round(sea.GetArea()),'removed pier boundary points',end-start-1)
