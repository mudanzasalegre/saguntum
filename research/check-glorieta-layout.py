"""Controles geométricos del recinto y de los muebles a partir de los datos de entrega."""
from pathlib import Path
import json,itertools
from math import cos,radians
from shapely.geometry import Polygon,Point
from pyproj import Transformer
assets=Path(__file__).resolve().parents[1]/'dist/assets/data'
j=json.loads((assets/'glorieta-layout.json').read_bytes())
dem=json.loads((assets/'elevation.json').read_bytes())
t=Transformer.from_crs(4326,25830,always_xy=True)
def ring(x):return Polygon([t.transform(*q) for q in x])
def pt(q):return Point(t.transform(*q))
def height(p):
    x,z=(p[0]+.278)*111320*cos(radians(39.679)),(39.679-p[1])*111320
    a=dem['bounds'];w,h=dem['width'],dem['height'];v=dem['elevations']
    i=(x-a['minX'])*(w-1)/(a['maxX']-a['minX']);k=(z-a['minZ'])*(h-1)/(a['maxZ']-a['minZ'])
    ix,iz=int(i),int(k);u,vv=i-ix,k-iz
    return sum(v[(iz+b)*w+ix+a]*(u if a else 1-u)*(vv if b else 1-vv) for a in [0,1] for b in [0,1])
perimeter=ring(j['perimeter']); assert perimeter.is_valid
areas=[*j['beds'],*j['play'],*j['pavilions'],j['fountain'],j['pergola']]
for a in areas: assert ring(a['ring']).is_valid and perimeter.contains(pt(a['center'])),a['id']
for a,b in itertools.combinations(areas,2):
    overlap=ring(a['ring']).intersection(ring(b['ring'])).area
    assert overlap<.1,(a['id'],b['id'],overlap)
obstacles=[j['fountain'],*j['pavilions']]
for c in [t['point'] for t in j['trees']]+j['lamps']+j['benches']:
    for a in obstacles:assert not ring(a['ring']).buffer(.15).contains(pt(c)),a['id']
for tree in j['trees']:
    assert pt(j['anchors']['romeu']).distance(pt(tree['point']))>2.2
values=[height(c) for c in j['perimeter']]
print('Perímetro',round(perimeter.area,1),'m². Cotas MDT en los vértices',round(min(values),2),round(max(values),2),'m.')
print(len(areas),'elementos poligonales válidos;',len(j['trees']),'troncos,',len(j['benches']),'bancos y',len(j['lamps']),'luminarias fuera de los pabellones y la fuente.')
