"""Audit exported geometry and distances. No network access is needed."""
import argparse
from collections import Counter
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from pyproj import Geod, Transformer
import shapely
from shapely.geometry import LineString, Point, Polygon, box

ROOT = Path(__file__).resolve().parents[2]
GEOD = Geod(ellps='GRS80')
CONTROLS = {
    'Castillo': [-.2786,39.67615],
    'Teatro Romano': [-.278,39.67689],
    'Plaza Mayor': [-.27863,39.67943],
    'Gerencia': [-.22322,39.65894],
    'Alto Horno n.º 2': [-.2203074,39.6542918],
    'Pantalán, tramo marítimo': [-.1998082965,39.6492990775],
    'Fortín del Grau Vell': [-.239697918,39.635329816],
    'Palancia, tramo urbano': [-.277,39.6831],
    'Palancia, restinga': [-.20679,39.66739]
}


def load(p):
    return json.loads(p.read_text(encoding='utf8'))


def grid(path, meta):
    a = np.fromfile(path/meta['heights'], dtype='<i2')
    assert a.size == meta['width']*meta['height']
    a = a.reshape(meta['height'], meta['width'])*meta['unit']
    with Image.open(path/meta['texture']) as im:
        # The deployed basemaps are thumbnails of the full ortho acquisitions.
        # Check the actual export recipe; near-camera photography streams separately.
        side={'landscape/territory.jpg':1792,'landscape/core.jpg':2048}.get(meta['texture'])
        if side:
            assert max(im.size)==side
            xmin,zmin,xmax,zmax=meta['bounds']
            assert abs(im.width/im.height-(xmax-xmin)/(zmax-zmin))<.015
        else:
            assert min(im.size)>=2000
        im.verify()
    return a


def sample(arr, meta, x, z):
    xmin,zmin,xmax,zmax = meta['bounds']
    gx = np.clip((x-xmin)/(xmax-xmin)*(arr.shape[1]-1),0,arr.shape[1]-1)
    gz = np.clip((z-zmin)/(zmax-zmin)*(arr.shape[0]-1),0,arr.shape[0]-1)
    i = np.minimum(np.floor(gx).astype(int),arr.shape[1]-2)
    j = np.minimum(np.floor(gz).astype(int),arr.shape[0]-2)
    u, v = gx-i, gz-j
    return (1-v)*((1-u)*arr[j,i]+u*arr[j,i+1])+v*((1-u)*arr[j+1,i]+u*arr[j+1,i+1])


def check(path):
    world = load(path/'world.json')
    assert world['crs']=='EPSG:25830' and world['origin']==[730000,4395000]
    forward = Transformer.from_crs(4326,25830,always_xy=True)
    reverse = Transformer.from_crs(25830,4326,always_xy=True)
    water = shapely.union_all([Polygon(p['outer'],p['holes']) for p in world['water']])
    shore = shapely.union_all([LineString(line) for line in world['shorelines']])
    assert water.is_valid
    boundary = shapely.union_all([Polygon(p['outer'],p['holes']) for p in world['municipality']])
    assert abs(boundary.area/1e6-world['municipalityAreaKm2']) < .01
    t = world['terrain']
    d = t['detail']
    ground = grid(path,t)
    core = grid(path,d)
    x,z = np.meshgrid(np.linspace(d['bounds'][0],d['bounds'][2],d['width']),
                      np.linspace(d['bounds'][1],d['bounds'][3],d['height']))
    edge=np.zeros(core.shape,dtype=bool)
    edge[[0,-1],:] = True
    edge[:,[0,-1]] = True
    seam = float(np.abs(core[edge]-sample(ground,t,x[edge],z[edge])).max())
    assert seam <= .051
    controls = {}
    for label,(lon,lat) in CONTROLS.items():
        e,n = forward.transform(lon,lat)
        lon2,lat2 = reverse.transform(e,n)
        assert max(abs(lon-lon2),abs(lat-lat2))<1e-7
        x,z=e-world['origin'][0],world['origin'][1]-n
        eye=Point(x,z)
        assert box(*t['bounds']).contains(eye) and box(*d['bounds']).contains(eye)
        elevation=float(sample(core,d,x,z))
        if label in ('Castillo','Teatro Romano'):
            assert elevation > 40
        offshore = label == 'Pantalán, tramo marítimo'
        if label != 'Palancia, restinga':
            assert water.covers(eye)==offshore, label
        else:
            assert shore.distance(eye)<200
        controls[label] = dict(lon=lon,lat=lat,x=round(x,2),z=round(z,2),elevation=round(elevation,1))
    measured=[]
    pairs=[('Teatro Romano','Castillo'),('Plaza Mayor','Gerencia'),('Gerencia','Alto Horno n.º 2'),
           ('Alto Horno n.º 2','Fortín del Grau Vell'),('Alto Horno n.º 2','Pantalán, tramo marítimo'),
           ('Palancia, restinga','Fortín del Grau Vell')]
    for first,last in pairs:
        p,q=controls[first],controls[last]
        utm=math.hypot(p['x']-q['x'],p['z']-q['z'])
        _,_,distance=GEOD.inv(p['lon'],p['lat'],q['lon'],q['lat'])
        assert abs(utm-distance)/distance < .0008
        measured.append(dict(start=first,end=last,utmMetres=round(utm,1),geodesicMetres=round(distance,1)))
    ids = {}
    geoms = []
    holes = 0
    methods=Counter()
    for sector in world['sectors']:
        item=load(path/sector['url'])
        assert len(item['buildings'])==sector['count']
        envelope=box(*sector['geometryBounds']).buffer(.002)
        for b in item['buildings']:
            assert b['id'] not in ids, b['id']
            ids[b['id']]=sector['id']
            geom=Polygon(b['rings'][0],b['rings'][1:])
            assert geom.is_valid and geom.area>=.99 and envelope.covers(geom), b['id']
            assert math.isfinite(b['height']) and b['height'] > 0
            geoms.append(geom)
            holes+=len(geom.interiors)
            methods[b['heightSource']]+=1
    assert holes==world['counts']['courtyards']
    assert methods==world['heightMethods']
    tree=shapely.STRtree(geoms)
    arr=np.asarray(geoms)
    i,j=tree.query(arr,predicate='intersects')
    other=i<j
    i,j=i[other],j[other]
    overlaps=shapely.relate_pattern(arr[i],arr[j],'T********')
    areas=shapely.area(shapely.intersection(arr[i[overlaps]],arr[j[overlaps]]))
    largest=float(areas.max(initial=0))
    # New intersections are retained at high precision; ignore floating point dust.
    assert largest < .0001, largest
    overview=load(path/world['overview'])['buildings']
    assert all(ids[b['id']]==b['sector'] for b in overview)
    return dict(count=len(geoms),sectors=len(world['sectors']),overview=len(overview),courtyards=holes,
                intersectionPairs=int(other.sum()),overlapsAfterQuantization=len(areas),overlapsAboveTolerance=int((areas>.0001).sum()),maxOverlapM2=round(largest,9),
                heightMethods=methods,maxTerrainSeamM=round(seam,3),controls=controls,distances=measured,
                municipalAreaKm2=world['municipalityAreaKm2'],waterAreaKm2=round(water.area/1e6,3))


if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dir',type=Path,default=ROOT/'dist/assets/territory')
    ap.add_argument('--report',type=Path)
    args=ap.parse_args()
    result=json.dumps(check(args.dir),ensure_ascii=False,indent=2)
    print(result)
    if args.report:
        args.report.write_text(result+'\n',encoding='utf8')
