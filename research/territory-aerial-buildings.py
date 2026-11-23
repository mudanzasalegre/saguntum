"""Build the lightweight municipal skyline from existing normalized footprints.
Requires shapely. Coordinates use half-metres relative to the 500 m source sector.
The original IDs remain available for heritage replacement.
"""
from collections import defaultdict
from pathlib import Path
import argparse
import gzip
import json
from shapely.geometry import Polygon
from shapely import get_parts, set_precision

root=Path(__file__).resolve().parents[1]/'dist/assets/territory'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sector',action='append',help='Rebuild this normalized 500 m sector. Include adjoining sectors when a shared property changes.')
parser.add_argument('--out',type=Path,default=root/'aerial-buildings')
args=parser.parse_args()
out=args.out
out.mkdir(parents=True,exist_ok=True)
sectors=set(args.sector or [])
if sectors:
    known={t['id'] for t in json.loads((root/'world.json').read_bytes())['sectors']}
    if sectors-known: parser.error('Unknown building sectors: '+', '.join(sorted(sectors-known)))
    for name in ('skyline','sagunto','puerto','municipio'):
        if not (out/(name+'.bin')).exists(): parser.error('Incremental output needs the four existing aerial packages.')
previous={b['id'] for b in json.loads((root/'overview.json').read_bytes())['buildings']}
groups=defaultdict(list)
for path in sorted((root/'b').glob('*.json')):
    sector=path.stem
    for b in json.loads(path.read_bytes())['buildings']:
        rings=b['rings']
        geom=Polygon(rings[0],rings[1:])
        if geom.is_empty or geom.area<3:
            continue
        groups[b['id'].split('_part')[0]].append((geom.area,b,geom,sector))

packages=defaultdict(lambda:defaultdict(list))
parts=0
repairs=0
photographed=0
for members in groups.values():
    largest=max(members,key=lambda pair:pair[0])[1]['id']
    for area,b,geom,sector in members:
        if sectors and sector not in sectors:
            continue
        if b['id'] not in previous and (area<14 or area<75 and b['id']!=largest):
            continue
        simple=geom.simplify(.65,preserve_topology=True)
        sx,sz=[int(v)*500 for v in sector.split('_')]
        loops=[]
        for i,loop in enumerate([simple.exterior,*simple.interiors]):
            xy=[(round((x-sx)*2),round((z-sz)*2)) for x,z in list(loop.coords)[:-1]]
            distinct=[p for i,p in enumerate(xy) if p!=xy[i-1]]
            if len(set(distinct))<3:
                if i==0: break
                continue
            loops.append([v for p in distinct for v in p])
        if not loops: continue
        points=[list(zip(r[::2],r[1::2])) for r in loops]
        reduced=Polygon(points[0],points[1:])
        if not reduced.is_valid:
            # Sub-metre necks can collapse after snapping. Keep the principal
            # polygon of this generalized silhouette; street level uses the original.
            clean=set_precision(reduced.buffer(0),1)
            valid=[poly for poly in get_parts(clean) if poly.geom_type=='Polygon' and poly.area>0]
            if not valid: continue
            largest_polygon=max(valid,key=lambda p:p.area)
            loops=[[int(v) for xy in list(r.coords)[:-1] for v in xy]
                   for r in [largest_polygon.exterior,*largest_polygon.interiors]]
            repairs+=1
        if b['id'] in previous: package='skyline'
        elif 1800<sx<5600 and -2500<sz<1000: package='sagunto'
        elif 6200<sx<11100 and -800<sz<4200: package='puerto'
        else: package='municipio'
        color=b.get('roofColor')
        photographed+=bool(color)
        use=b.get('usage','residential')
        packages[package][sector].append([b['id'].removeprefix('cat-') if b['id'].startswith('cat-') else ':'+b['id'],
             round(b['height']*10),int(color[1:],16) if color else -1,
             1 if use=='industrial' else 2 if use=='agriculture' else 0,loops])
        parts+=1
for name in (('municipio','puerto','sagunto','skyline') if sectors else sorted(packages)):
    collection=packages[name]
    if sectors:
        path=out/(name+'.bin')
        baseline=json.loads(gzip.decompress(path.read_bytes()))
        updated={k:collection.get(k,v) for k,v in baseline.items() if k not in sectors or k in collection}
        updated.update(collection)
        if updated==baseline: continue
        collection=updated
    data=gzip.compress(json.dumps(collection,separators=(',',':')).encode(),compresslevel=9,mtime=0)
    path=out/(name+'.bin')
    pending=path.with_suffix('.tmp')
    pending.write_bytes(data)
    pending.replace(path)
    print(name,sum(map(len,collection.values())),len(data))
print('Cadastral / OSM parts',parts,'with roof colour',photographed,'sub-metre repairs',repairs)
