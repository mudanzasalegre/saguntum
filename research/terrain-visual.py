"""Prepare bounded PNOA photo sheets and surface masks for the territory renderer.

Run from any directory: python research/terrain-visual.py [--cache PATH]
Requires requests, Pillow, numpy, scipy, rasterio and shapely 2.
"""
import argparse
import hashlib
import io
import json
import re
import tempfile
from datetime import date
from pathlib import Path

import numpy as np
import requests
from PIL import Image
from rasterio.features import rasterize
from rasterio.transform import Affine
from scipy import ndimage
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
OUT = ASSETS / 'territory/surface-photo'
WMS = 'https://www.ign.es/wms-inspire/pnoa-ma'
ORIGIN = (730000, 4395000)
BLOCK = 1024
SHEET = 512
MASK = 256
# Coordinates are kilometre-sized cells in the v33 metric frame. The dense
# historic/port cores, Fortín and the industrial heritage use native sampling.
NATIVE = {(2,-1),(3,-1),(3,-2),(7,1),(8,1),(8,0),(9,1),(6,3),(6,4),(10,2),(5,5),(10,-5)}
OTHER = {(2,-2),(2,0),(3,0),(4,-2),(4,-1),(4,0),(5,-1),(5,0),(6,-1),(6,0),(6,1),
         (7,-1),(7,0),(7,2),(8,-1),(8,2),(9,0),(9,2),(7,3)}
SAMPLES = {'Sagunto':(3457,-438),'Puerto':(8218,1410),'Corredor':(5770,644),
           'Grau Vell':(6884,4075),'Pantalán':(10260,2418),
           'Marjal dels Moros':(5280,5282),'Almardà':(10514,-4223)}
# Alpha is a surface class. RGB in the auxiliary plate is the sampled ground
# around a cadastral footprint; interiors/rings remain voids in the mask.
CLASS = {'orchard':224,'farmland':224,'forest':218,'scrub':218,'grass':218,'garden':218,
         'park':218,'beach':176,'riverbed':160,'wetland':200}
BUILDING = 112

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def source_indexes():
    polygons, codes = [], []
    for path in sorted((ASSETS / 'network').glob('*.json')):
        for area in read(path).get('areas', []):
            if area['kind'] in CLASS:
                rings = area['rings']
                if rings and len(rings[0]) >= 3:
                    polygons.append(Polygon(rings[0], [r for r in rings[1:] if len(r)>=3]))
                    codes.append(CLASS[area['kind']])
    for path in sorted((ASSETS / 'territory/b').glob('*.json')):
        for building in read(path)['buildings']:
            rings = building['rings']
            if rings and len(rings[0]) >= 3:
                polygons.append(Polygon(rings[0], [r for r in rings[1:] if len(r)>=3]))
                codes.append(BUILDING)
    return STRtree(polygons), polygons, codes

def get_cached(session, params, cache, suffix):
    url = requests.Request('GET', WMS, params=params).prepare().url
    key = hashlib.sha256(url.encode()).hexdigest()[:24]
    path = cache / (key + suffix)
    if not path.exists():
        response = session.get(url, timeout=(15,120))
        response.raise_for_status()
        if suffix == '.jpg':
            with Image.open(io.BytesIO(response.content)) as image:
                image.verify()
        elif 'RESOLUCION' not in response.text:
            raise ValueError('Missing WMS mosaic metadata: ' + response.text[:180])
        tmp = path.with_suffix('.part')
        tmp.write_bytes(response.content)
        tmp.replace(path)
    return path, url

def parameters(x,z,width):
    e, n = ORIGIN[0]+x, ORIGIN[1]-z
    return dict(SERVICE='WMS',VERSION='1.3.0',REQUEST='GetMap',LAYERS='OI.OrthoimageCoverage',
                STYLES='',CRS='EPSG:25830',BBOX=f'{e},{n-BLOCK},{e+BLOCK},{n}',WIDTH=width,
                HEIGHT=width,FORMAT='image/jpeg')

def surface_mask(photo,x,z,index):
    # Build the two-metre auxiliary samples for the entire source block before
    # slicing it into four sheets. This preserves context on sheet interiors.
    tree, shapes, codes = index
    ids = sorted(tree.query(box(x,z,x+BLOCK,z+BLOCK)))
    side = MASK*2
    affine = Affine(BLOCK/side,0,x,0,BLOCK/side,z)
    values = [(shapes[i],codes[i]) for i in ids if not shapes[i].is_empty]
    semantic = (rasterize(values,out_shape=(side,side),fill=255,transform=affine,dtype='uint8')
                if values else np.full((side,side),255,dtype='uint8'))
    low = np.asarray(photo.resize((side,side),Image.Resampling.BOX))
    roof = semantic == BUILDING
    if roof.any() and not roof.all():
        # A one-pixel safety margin prevents narrow roof edges bleeding onto
        # the ground. This never alters the RGB pixels used by the roof shader.
        margin = ndimage.binary_dilation(roof,iterations=1)
        if not margin.all():
            iy,ix = ndimage.distance_transform_edt(margin,return_distances=False,return_indices=True)
            fill = np.where(roof[:,:,None],low[iy,ix],low)
        else:
            fill = low
    else:
        fill = low
    return Image.fromarray(np.dstack((fill,semantic)).astype('uint8'),'RGBA')

def scanned_height(cache,session):
    scans = [
        ('dry_ground_01','Rob Tuytel',4.0,'19f4ceadb51e1e08bcc82690309fb779','f928726e24cf06765877ae77b9a04b4a'),
        ('damp_beach_sand','Dimitrios Savva',2.0,'3d588be29daf9a55b39bb2bd6643ac6b','7914af7bb383c00889e0838edd85f1a0'),
        ('gravel_floor','Matterfield, Jenelle van Heerden',2.25,'5e616ed00b443bc3741d4aa219bc9319','4f055e1545dcf41f347600fbb01d9ac2')]
    channels={'disp':[],'diff':[]}
    sources=[]
    for asset,author,extent,bump,albedo in scans:
        inputs={}
        for kind,checksum in [('disp',bump),('diff',albedo)]:
            url=f'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{asset}/{asset}_{kind}_1k.jpg'
            path=cache/(asset+('' if kind=='disp' else '-diff')+'.jpg')
            if not path.exists():
                response=session.get(url,timeout=60)
                response.raise_for_status()
                path.write_bytes(response.content)
            if hashlib.md5(path.read_bytes()).hexdigest()!=checksum:
                raise ValueError(f'Unexpected source for {asset} {kind}')
            with Image.open(path) as image:
                values=np.asarray(image.convert('L').resize((512,512),Image.Resampling.LANCZOS),dtype='float32')
            lo,hi=np.quantile(values,[.01,.99])
            channels[kind].append(Image.fromarray(np.uint8(np.clip((values-lo)*255/(hi-lo),0,255))))
            inputs[kind]=dict(url=url,md5=checksum)
        sources.append(dict(name=asset,author=author,extentMetres=extent,inputs=inputs,
                   page='https://polyhaven.com/a/'+asset))
    Image.merge('RGB',channels['disp']).save(OUT/'grains.png',optimize=True)
    Image.merge('RGB',channels['diff']).save(OUT/'grain-tone.png',optimize=True)
    return sources

def mobile_photos(registry):
    for key,spacing in registry['sheets'].items():
        if spacing>=.5:
            continue
        with Image.open(OUT/(key+'.webp')) as full:
            half=full.resize((1024,1024),Image.Resampling.LANCZOS)
            half.save(OUT/(key+'.half.webp'),'WEBP',quality=69,method=3)
    registry['mobileNativeSuffix']='.half.webp'
    (OUT/'index.json').write_text(json.dumps(registry,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')

def produce(cache):
    cache.mkdir(parents=True,exist_ok=True)
    OUT.mkdir(parents=True,exist_ok=True)
    session = requests.Session()
    session.headers['User-Agent'] = 'SAGUNTUM cartographic preparation / local cached requests'
    index = source_indexes()
    marine=read(ASSETS/'territory/world.json')['water']
    offshore=unary_union([Polygon(p['outer'],p['holes']) for p in marine]).buffer(-35)
    registry = dict(crs='EPSG:25830',origin=ORIGIN,sheetMetres=SHEET,
                    credit='Ortofoto PNOA Máxima Actualidad © IGN, CC BY 4.0 scne.es',
                    source=WMS,licence='https://www.ign.es/web/ign/portal/politica-datos',
                    microreliefLicence='https://polyhaven.com/license',
                    microrelief=scanned_height(cache,session),controlSamples={},blocks=[],sheets={})
    for name,(x,z) in SAMPLES.items():
        p=parameters(x-512,z-512,1024)
        p.update(REQUEST='GetFeatureInfo',LAYERS='OI.MosaicElement',QUERY_LAYERS='OI.MosaicElement',
                 I=512,J=512,INFO_FORMAT='text/plain')
        path,url=get_cached(session,p,cache,'.txt')
        row=dict(re.findall(r"(FECHA|RESOLUCION) = '([^']+)'",path.read_text()))
        registry['controlSamples'][name]=dict(local=[x,z],query=url,
                    capture=row['FECHA'],nativeMetres=float(row['RESOLUCION']))
    for bx,bz in sorted(NATIVE | OTHER):
        x,z=bx*BLOCK,bz*BLOCK
        spacing=.25 if (bx,bz) in NATIVE else .5
        width=int(BLOCK/spacing)
        path,url=get_cached(session,parameters(x,z,width),cache,'.jpg')
        with Image.open(path) as original:
            if original.size != (width,width):
                raise ValueError(f'Wrong WMS dimensions {original.size}')
            photo=original.convert('RGB')
        mask=surface_mask(photo,x,z,index)
        if offshore.intersects(box(x,z,x+BLOCK,z+BLOCK)):
            ocean=offshore.intersection(box(x,z,x+BLOCK,z+BLOCK))
            cut=rasterize([(ocean,255)],out_shape=(width,width),transform=Affine(spacing,0,x,0,spacing,z),dtype='uint8')
            photo.paste((42,85,93),(0,0,width,width),Image.fromarray(cut,'L'))
        for dz in range(2):
            for dx in range(2):
                key=f'{bx*2+dx}_{bz*2+dz}'
                left,top=x+dx*SHEET,z+dz*SHEET
                if offshore.covers(box(left,top,left+SHEET,top+SHEET)):
                    for suffix in ('.webp','-land.webp'):
                        (OUT/(key+suffix)).unlink(missing_ok=True)
                    continue
                def quadrant(image):
                    n=image.width//2
                    return image.crop((dx*n,dz*n,(dx+1)*n,(dz+1)*n))
                quadrant(photo).save(OUT/(key+'.webp'),'WEBP',quality=71,method=3)
                quadrant(mask).save(OUT/(key+'-land.webp'),'WEBP',quality=73,method=3,exact=True)
                registry['sheets'][key]=spacing
        registry['blocks'].append(dict(localBounds=[x,z,x+BLOCK,z+BLOCK],spacingMetres=spacing,
              acquisition=date.fromtimestamp(path.stat().st_mtime).isoformat(),url=url,
              sourceSha256=hashlib.sha256(path.read_bytes()).hexdigest()))
        print(f'{bx},{bz} {spacing} m/px',flush=True)
    mobile_photos(registry)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--cache',type=Path,default=Path(tempfile.gettempdir())/'saguntum-pnoa-surface-v1')
    produce(parser.parse_args().cache)
