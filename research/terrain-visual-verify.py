"""Validate image bounds, WMS control windows and Atlas anchors after preparation."""
import argparse
import hashlib
import json
import math
import tempfile
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image
from pyproj import Transformer
from shapely.geometry import Point,Polygon
from shapely.ops import unary_union

parser=argparse.ArgumentParser()
parser.add_argument('--cache',type=Path,default=Path(tempfile.gettempdir())/'saguntum-pnoa-surface-v1')
parser.add_argument('--out',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]/'dist/assets'
assets=root/'territory/surface-photo'
def read(path): return json.loads(path.read_text(encoding='utf8'))
def place(x,z):
    ix,iz=math.floor(x/512),math.floor(z/512)
    return f'{ix}_{iz}',ix*512,iz*512

catalog=read(assets/'index.json')
assert catalog['crs']=='EPSG:25830' and catalog['origin']==[730000,4395000]
for key,spacing in catalog['sheets'].items():
    pixels=round(512/spacing)
    with Image.open(assets/(key+'.webp')) as image: assert image.size==(pixels,pixels)
    with Image.open(assets/(key+'-land.webp')) as image: assert image.size==(256,256)
    if spacing==.25:
        with Image.open(assets/(key+catalog['mobileNativeSuffix'])) as image: assert image.size==(1024,1024)

world=read(root/'territory/world.json')
ocean=unary_union([Polygon(w['outer'],w['holes']) for w in world['water']]).buffer(-35)
project=Transformer.from_crs(4326,25830,always_xy=True)
dataset=root/'data'
names='landmarks archaeology-public archaeology-domestic archaeology-necropolis port-industrial port-garden port-workers coast-pier coast-grau coast-archaeology landscape-marjal landscape-dunes landscape-palancia'.split()
places={s['id']:s['coordinate'] for n in names for s in read(dataset/(n+'.json'))['sites']}
places['theatre']=read(dataset/'theatre-plan.json')['center']
places['castle']=next(stop['coordinate'] for stop in read(dataset/'castle-visit.json')['stops'] if stop['id']=='conjunto')
anchors={}
for name,coordinate in places.items():
    east,north=project.transform(*coordinate)
    x,z=east-730000,4395000-north
    k,_,_=place(x,z)
    if k in catalog['sheets']:
        anchors[name]=catalog['sheets'][k]
    else:
        assert ocean.covers(Point(x,z)),name
        anchors[name]='mar del simulador'
assert len(anchors)==31

comparison={}
for sample,data in catalog['controlSamples'].items():
    x,z=data['local']
    k,l,t=place(x,z)
    if k not in catalog['sheets']: continue
    b=next(row for row in catalog['blocks'] if row['localBounds'][0]<=x<row['localBounds'][2] and row['localBounds'][1]<=z<row['localBounds'][3])
    cached=args.cache/(hashlib.sha256(b['url'].encode()).hexdigest()[:24]+'.jpg')
    assert hashlib.sha256(cached.read_bytes()).hexdigest()==b['sourceSha256']
    # Compare the same 7 x 7 m window against the WMS source, ignoring normal
    # WebP JPEG-to-WebP differences in high frequency edges.
    def patch(path,left,top):
        size=b['spacingMetres']
        cx=round((x-left)/size);cy=round((z-top)/size);half=round(3.5/size)
        with Image.open(path) as image:
            return np.asarray(image.convert('RGB').crop((cx-half,cy-half,cx+half,cy+half)),dtype=float)
    original=patch(cached,*b['localBounds'][:2])
    prepared=patch(assets/(k+'.webp'),l,t)
    mae=round(float(np.mean(np.abs(original-prepared))),2)
    assert mae<12,(sample,mae)
    comparison[sample]=mae

report=dict(tiles=dict(Counter(catalog['sheets'].values())),sourceBlocks=len(catalog['blocks']),
           anchors=anchors,localWindowMeanAbsoluteErrorRGB=comparison,
           bytes=sum(p.stat().st_size for p in assets.iterdir()))
print(json.dumps(report,ensure_ascii=False,indent=2))
if args.out:
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
