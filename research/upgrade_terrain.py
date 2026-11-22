"""Resample the original IGN Terrain-RGB tiles with less application downsampling.

The official XYZ service is derived from MDT05 (5 m source mesh). A 2 m
application sampling interval is interpolation, not a new 2 m survey.
Also downloads the same PNOA extent at 4096 px to improve close viewing.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode
import json, math, io
import numpy as np
from PIL import Image

BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'dist/assets/data'
old=json.loads((OUT/'elevation.json').read_text())
b=old['bounds'];origin=old['origin'];zoom=old['source_zoom'];size=old['source_tileSize']
tiles={}
for path in (BASE/'research/terrain_tiles').glob(f'{zoom}-*.png'):
    _,x,y=map(int,path.stem.split('-'))
    rgb=np.asarray(Image.open(path).convert('RGB'),dtype=np.float64)
    tiles[x,y]=-10000+(rgb[:,:,0]*65536+rgb[:,:,1]*256+rgb[:,:,2])*.1
x0=min(x for x,y in tiles);x1=max(x for x,y in tiles)
y0=min(y for x,y in tiles);y1=max(y for x,y in tiles)
mosaic=np.zeros(((y1-y0+1)*size,(x1-x0+1)*size))
for (x,y),a in tiles.items():mosaic[(y-y0)*size:(y-y0+1)*size,(x-x0)*size:(x-x0+1)*size]=a
w=h=1025
xx,zz=np.meshgrid(np.linspace(b['minX'],b['maxX'],w),np.linspace(b['minZ'],b['maxZ'],h))
lon=origin[0]+xx/(111320*math.cos(math.radians(origin[1])))
lat=origin[1]-zz/111320
px=((lon+180)/360*2**zoom-x0)*size
py=((1-np.arcsinh(np.tan(np.radians(lat)))/math.pi)/2*2**zoom-y0)*size
ix=np.floor(px).astype(int);iy=np.floor(py).astype(int);fx=px-ix;fy=py-iy
grid=(mosaic[iy,ix]*(1-fx)+mosaic[iy,ix+1]*fx)*(1-fy)+(mosaic[iy+1,ix]*(1-fx)+mosaic[iy+1,ix+1]*fx)*fy
old.update(width=w,height=h,elevations=np.round(grid,1).ravel().tolist(),
    source_product='PNOA-LiDAR MDT05',source_grid_spacing_m=5,
    sample_spacing_m={'x':(b['maxX']-b['minX'])/(w-1),'z':(b['maxZ']-b['minZ'])/(h-1)},
    sampling_note='2 m application sampling is bilinear interpolation of the official Terrain-RGB tiles derived from MDT05. It is not 2 m survey accuracy. Bare-earth elevation excludes buildings, trees and individual steps.',
    documentation_url='https://blog-idee.blogspot.com/2024/03/nuevo-servicio-xyz-del-modelo-digital.html')
(OUT/'elevation.json').write_text(json.dumps(old,ensure_ascii=False,separators=(',',':')))
print('Elevation',w,h,'range',float(grid.min()),float(grid.max()),'bytes',(OUT/'elevation.json').stat().st_size,flush=True)
ortho=json.loads((OUT/'orthophoto.json').read_text());geo=ortho['geographicBounds']
params={'service':'WMS','version':'1.3.0','request':'GetMap','layers':'OI.OrthoimageCoverage','styles':'','crs':'EPSG:4326','bbox':f"{geo['south']},{geo['west']},{geo['north']},{geo['east']}",'width':4096,'height':3896,'format':'image/jpeg'}
url='https://www.ign.es/wms-inspire/pnoa-ma?'+urlencode(params)
try:
    data=urlopen(url,timeout=55).read();img=Image.open(io.BytesIO(data));img.load()
    assert img.size==(4096,3896),img.size
    img.save(OUT/'orthophoto.jpg',quality=91,optimize=True)
    ortho.update(source_url=url,width=4096,height=3896,application_pixel_spacing_m={'x':2050/4096,'z':1950/3896})
    ortho['note']='Retrieval date, not photograph date. 0.5 m application pixels do not establish the native resolution or capture date of every photograph in the mosaic.'
    (OUT/'orthophoto.json').write_text(json.dumps(ortho,ensure_ascii=False,indent=2))
    print('Orthophoto',img.size,'bytes',(OUT/'orthophoto.jpg').stat().st_size,flush=True)
except Exception as exc:
    print('Orthophoto unchanged:',repr(exc),flush=True)
