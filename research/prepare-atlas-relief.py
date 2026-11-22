"""Reproyecta los seis MDT del Atlas al marco métrico del simulador, sin consultar servicios."""
from pathlib import Path
import gzip
import json
import math
import numpy as np
from pyproj import Transformer
from scipy.ndimage import map_coordinates

assets=Path(__file__).resolve().parents[1]/'dist/assets'
out=assets/'territory/atlas-relief'
out.mkdir(exist_ok=True)
to_utm=Transformer.from_crs(4326,25830,always_xy=True)
to_geo=Transformer.from_crs(25830,4326,always_xy=True)
scale=111320*math.cos(math.radians(39.679))
regions=[]
for name,prefix,step in [('sagunto','',2),('puerto','port-',5),('grau','coast-',5),
                         ('marjal','marjal-',5),('almarda','almarda-',5),('palancia','palancia-',5)]:
    src=prefix+'elevation.json'
    doc=json.loads((assets/'data'/src).read_bytes())
    b=doc['bounds']
    e,n=to_utm.transform([-.278+x/scale for x in [b['minX'],b['minX'],b['maxX'],b['maxX']]],
                         [39.679-z/111320 for z in [b['minZ'],b['maxZ'],b['minZ'],b['maxZ']]])
    # Rectangular storage encloses the rotated source. Unsupported edge samples carry a sentinel.
    xs=np.arange(math.floor((min(e)-730000)/step)*step,math.ceil((max(e)-730000)/step)*step+1,step)
    zs=np.arange(math.floor((4395000-max(n))/step)*step,math.ceil((4395000-min(n))/step)*step+1,step)
    field=np.asarray(doc['elevations'],dtype=np.float32).reshape(doc['height'],doc['width'])
    raster=np.empty((len(zs),len(xs)),dtype='<i2')
    for start in range(0,len(zs),100):
        x,z=np.meshgrid(xs,zs[start:start+100])
        lon,lat=to_geo.transform(730000+x,4395000-z)
        col=((lon+.278)*scale-b['minX'])*(doc['width']-1)/(b['maxX']-b['minX'])
        row=((39.679-lat)*111320-b['minZ'])*(doc['height']-1)/(b['maxZ']-b['minZ'])
        sampled=map_coordinates(field,[row,col],order=1,mode='constant',cval=-3276.8)
        raster[start:start+len(z)]=np.rint(sampled*10).astype('<i2')
    # Horizontal differencing is lossless, and makes DEFLATE effective on smooth terrain.
    diff=raster.copy()
    diff[:,1:]=np.diff(raster,axis=1)
    encoded=gzip.compress(diff.tobytes(),compresslevel=9,mtime=0)
    (out/(name+'.gz')).write_bytes(encoded)
    corners=[[e[i]-730000,4395000-n[i]] for i in [0,2,3,1]]
    edges=[]
    for a,b in zip(corners,corners[1:]+corners[:1]):
        dx,dz=b[0]-a[0],b[1]-a[1]
        length=math.hypot(dx,dz)
        nx,nz=-dz/length,dx/length
        edges.append([round(nx,9),round(nz,9),round(-(nx*a[0]+nz*a[1]),4)])
    regions.append(dict(region=name,source='assets/data/'+src,file='atlas-relief/'+name+'.gz',edges=edges,
                        width=len(xs),height=len(zs),bounds=list(map(int,[xs[0],zs[0],xs[-1],zs[-1]])),
                        spacing=step,unit=.1,bytes=len(encoded)))
(out/'index.json').write_text(json.dumps(regions,indent=2)+'\n',encoding='utf8')
print([(r['region'],r['bytes']) for r in regions],flush=True)
