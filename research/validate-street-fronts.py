"""Validate the two principal urban sectors independently against the source parcel polygons."""
import argparse
import gzip
import importlib.util
import json
import tempfile
from pathlib import Path

import numpy as np
from shapely import STRtree, box, union_all, make_valid
from shapely.geometry import Polygon

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('fronts',ROOT/'research/territory-street-fronts.py')
fronts=importlib.util.module_from_spec(spec)
spec.loader.exec_module(fronts)

def check(source):
    parcels=fronts.parcels(source)
    areas,roads,_=fronts.network()
    folder=ROOT/'dist/assets/territory/street-fronts'
    manifest=json.loads((folder/'index.json').read_bytes())
    report={}
    for key in manifest['tiles']:
        walk,margin,kerbs=json.loads(gzip.decompress((folder/(key+'.bin')).read_bytes()))
        # Quantisation and clipping at the edge of every single tile.
        coords=[coord for polys in [walk,margin] for rings in polys for ring in rings for coord in ring]
        coords.extend(coord for ring in kerbs for coord in ring)
        assert all(0<=coord<=10000 for coord in coords),key
        if key not in ('8_0','3_-1','7_0','7_1'): continue
        ox,oz=(int(v)*1000 for v in key.split('_'))
        extent=box(ox-1,oz-1,ox+1001,oz+1001)
        geometries=[]
        for polys in (walk,margin):
            lines=[]
            for p in polys:
                rings=[np.asarray(r).reshape(-1,2)*.1+[ox,oz] for r in p]
                lines.extend(fronts.polygonal(make_valid(Polygon(rings[0],rings[1:]))))
            geometries.append(union_all(lines,grid_size=.02))
        surface=union_all(geometries,grid_size=.02)
        excluded=union_all([fronts.clipped(tree,extent) for tree in (parcels,roads,areas)])
        # A 0.25 m perimeter tolerance accommodates 0.14 m simplification and 0.1 m quantisation.
        breach=surface.intersection(excluded.buffer(-.25)).area
        intersection=geometries[0].intersection(geometries[1]).area
        report[key]=dict(squareMetres=round(surface.area,1),outsideToleranceM2=round(breach,2),
                         overlapBetweenBandsM2=round(intersection,2),overlapPct=round(intersection*100/surface.area,4))
        assert breach<surface.area*.001 and intersection<surface.area*.002,(key,report[key])
    print(json.dumps(report,indent=2))
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=Path(tempfile.gettempdir())/'saguntum-cp-46222.zip')
    parser.add_argument('--out',type=Path)
    args=parser.parse_args()
    report=check(args.source)
    if args.out:args.out.write_text(json.dumps(report,indent=2),encoding='utf8')
