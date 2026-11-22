"""Prepare municipal street margins from open INSPIRE parcel boundaries and the Atlas OSM network.

Only the street-facing gap of built-up blocks is eligible. Parcels, mapped roads,
parks, squares, parking, paths and gardens are excluded before triangulation.
Widths and finishes of the two bands are interpretations, not a kerb survey.
"""
import argparse
import gzip
import hashlib
import json
import tempfile
import zipfile
from pathlib import Path
from urllib.request import urlretrieve

import numpy as np
from lxml import etree
from shapely import STRtree, box, coverage_simplify, make_valid, set_precision, union_all
from shapely.geometry import LineString, Polygon

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.CP.46222.zip'
GML = '{http://www.opengis.net/gml/3.2}'
CP = '{http://inspire.ec.europa.eu/schemas/cp/4.0}'
CITY_ROADS = {'residential','living_street','unclassified','tertiary','secondary','primary'}
OUT = ROOT/'dist/assets/territory/street-fronts'

def polygonal(g):
    if g.geom_type == 'Polygon':
        yield g
    elif hasattr(g, 'geoms'):
        for child in g.geoms:
            yield from polygonal(child)

def linear(g):
    if g.geom_type == 'LineString':
        yield g
    elif hasattr(g, 'geoms'):
        for child in g.geoms:
            yield from linear(child)

def parcels(source):
    polygons = []
    with zipfile.ZipFile(source) as archive:
        name = next(n for n in archive.namelist() if n.endswith('cadastralparcel.gml'))
        with archive.open(name) as stream:
            for _, record in etree.iterparse(stream, events=('end',), tag=CP+'CadastralParcel'):
                for patch in record.iter(GML+'PolygonPatch'):
                    rings = []
                    for coords in patch.iter(GML+'posList'):
                        ring = np.fromstring(coords.text, sep=' ').reshape(-1,2)
                        ring[:,0] -= 730000
                        ring[:,1] = 4395000-ring[:,1]
                        rings.append(ring)
                    if rings:
                        polygons.extend(polygonal(make_valid(Polygon(rings[0], rings[1:]))))
                record.clear()
                parent = record.getparent()
                while parent.getprevious() is not None:
                    del parent.getparent()[0]
    return STRtree(polygons)

def network():
    land, carriage, corridors = [], [], []
    for path in (ROOT/'dist/assets/network').glob('*_*.json'):
        data = json.loads(path.read_bytes())
        for area in data['areas']:
            rings = area.get('rings')
            if rings:
                land.extend(polygonal(make_valid(Polygon(rings[0], rings[1:]))))
        for f in data['roads']:
            if f.get('bridge') or f.get('tunnel') or not f.get('points'):
                continue
            line = LineString(f['points'])
            half = (f.get('width') or 4)/2
            # Square joins reproduce the renderer's road strips. Tags for
            # separate sidewalks protect the existing mapped 1.2 metre band.
            for sign, side in [(1,'right'),(-1,'left')]:
                width = half + (1.2 if f.get('sidewalk') in (side,'both') else 0)
                carriage.append(line.buffer(sign*width,single_sided=True,join_style='mitre'))
            if f.get('name') and f['kind'] in CITY_ROADS:
                corridors.append(line.buffer(half+9,quad_segs=2))
        for f in data.get('rail',[]):
            if f.get('points'):
                land.append(LineString(f['points']).buffer(2))
    return STRtree(land),STRtree(carriage),STRtree(corridors)

def clipped(tree, extent):
    hits = tree.query(extent, predicate='intersects')
    return union_all([p for i in hits for p in polygonal(tree.geometries[i].intersection(extent))],grid_size=.04)

def prepare(source):
    OUT.mkdir(parents=True,exist_ok=True)
    cp = parcels(source)
    plots = []
    for path in (ROOT/'dist/assets/territory/b').glob('*.json'):
        for f in json.loads(path.read_bytes())['buildings']:
            if f.get('usage') not in ('agriculture','industrial'):
                rings=f['rings']
                plots.extend(polygonal(make_valid(Polygon(rings[0],rings[1:]))))
    buildings = STRtree(plots)
    areas, roads, corridors = network()
    index = json.loads((ROOT/'dist/assets/network/index.json').read_bytes())
    manifest = {'source': URL, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                'sourceDate':'2026-08-21','projection':'EPSG:25830','tiles':[],
                'metre': .1,'licence':'DGC INSPIRE, datos abiertos; red y zonas OSM, ODbL 1.0.',
                'precision':'Límites de parcela y vías cartográficos; partición y material del margen estimados.'}
    stats = dict(areaPaved=0.,areaShoulder=0.,kerbMetres=0.,bytes=0)
    for tile in index['tiles']:
        x,z,r,b = tile['bounds']
        frame = box(x,z,r,b)
        extent = box(x-16,z-16,r+16,b+16)
        # Isolated rural compounds are outside the scope of urban pavement inference.
        if len(buildings.query(extent))<60 or not len(corridors.query(extent)):
            continue
        urban=clipped(buildings,extent)
        if urban.is_empty:
            continue
        parcel=clipped(cp,extent)
        street=clipped(corridors,extent)
        roadway=clipped(roads,extent)
        landscape=clipped(areas,extent)
        # Both the parcel and a building must abut the corridor. Do not
        # extrapolate a footway across fields or the inside of garden plots.
        candidate=union_all(list(polygonal(street.intersection(urban.buffer(8.5,quad_segs=2)))))
        available=candidate.difference(
            union_all([parcel,landscape,roadway],grid_size=.04))
        if available.is_empty: continue
        available=union_all(list(polygonal(available)))
        walk=available.intersection(parcel.buffer(2.15,quad_segs=2,join_style='mitre'),grid_size=.04)
        walk=union_all(list(polygonal(walk)))
        if walk.is_empty: continue
        margin=union_all(list(polygonal(available.difference(walk,grid_size=.04))))
        # Only street-facing lines receive a kerb, never the sector split.
        kerbs=walk.boundary.intersection(union_all([roadway,margin]).buffer(.07,quad_segs=1))
        data=[[],[],[]]
        def pack(coords,closed=False):
            p=np.rint((np.asarray(coords)-[x,z])*10).astype(np.int32)
            if closed: p=p[:-1]
            p=p[np.r_[True,np.any(np.diff(p,axis=0),axis=1)]]
            return p.ravel().tolist()
        # Shared edges must survive simplification and decimetre encoding
        # identically on the two sides of a kerb.
        bands=[set_precision(union_all(list(polygonal(shape.intersection(frame)))),.1)
               for shape in (walk,margin)]
        bands[1]=bands[1].difference(bands[0],grid_size=.1)
        bands=[union_all(list(polygonal(shape)),grid_size=.1) for shape in bands]
        active=[i for i,b in enumerate(bands) if not b.is_empty]
        for slot,shape in zip(active,coverage_simplify([bands[i] for i in active],.15)):
            for p in polygonal(shape):
                if p.area<1.8 or p.length*.23>p.area: continue
                shell=pack(p.exterior.coords,True)
                if len(shell)<6: continue
                data[slot].append([shell]+[q for ring in p.interiors if len(q:=pack(ring.coords,True))>=6])
                stats['areaPaved' if slot==0 else 'areaShoulder']+=p.area
        for line in linear(kerbs.intersection(frame).simplify(.14)):
            if line.length>=1.6:
                points=pack(line.coords)
                if len(points)>=4:
                    data[2].append(points)
                    stats['kerbMetres']+=line.length
        if data[0] or data[1]:
            name=tile['id']
            payload=gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=9,mtime=0)
            (OUT/(name+'.bin')).write_bytes(payload)
            manifest['tiles'].append(name); stats['bytes']+=len(payload)
    manifest['counts']={key:round(value) for key,value in stats.items()}
    (OUT/'index.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
    print(len(manifest['tiles']),manifest['counts'],flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=Path(tempfile.gettempdir())/'saguntum-cp-46222.zip')
    args=parser.parse_args()
    if not args.source.exists(): urlretrieve(URL,args.source)
    prepare(args.source)
