"""Candidatos a copa en el MDSnV del IGN corroborados con color PNOA. EPSG:25830."""
import hashlib
import json
import tempfile
from pathlib import Path
from urllib.parse import urlencode
import numpy as np
import requests
import tifffile
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from shapely.geometry import box, Polygon

assets=Path(__file__).resolve().parents[1]/'dist/assets'
out=assets/'territory/canopy'
out.mkdir(exist_ok=True)
cache=Path(tempfile.gettempdir())/'saguntum-vegetacion-v35'
cache.mkdir(exist_ok=True)
world=json.loads((assets/'territory/world.json').read_bytes())
municipality=[Polygon(p['outer'],p['holes']) for p in world['municipality']]
roads=[];exclusions=[];mapped=[]
def item(items,points,data):
    if len(points):
        x,z=zip(*points);items.append(((min(x),min(z),max(x),max(z)),data))
for p in (assets/'territory/b').glob('*.json'):
    for b in json.loads(p.read_bytes())['buildings']:item(exclusions,b['rings'][0],b['rings'])
for p in (assets/'network').glob('*.json'):
    if p.name=='index.json':continue
    d=json.loads(p.read_bytes())
    for r in d['roads']+d['rail']:
        if r.get('points'):item(roads,r['points'],(r['points'],r.get('width',3.0)))
    for o in d['objects']:
        if o['kind']=='tree':item(mapped,[(o['x'],o['z'])],(o['x'],o['z']))
for p in world['water']:item(exclusions,p['outer'],[p['outer']]+p['holes'])
def overlaps(a,b):return a[0]<=b[2] and a[1]<=b[3] and a[2]>=b[0] and a[3]>=b[1]
photos=[]
for g in [world['terrain']['detail'],world['terrain']]:
    photos.append((g['bounds'],np.asarray(Image.open(assets/'territory'/g['texture']).convert('RGB'))))
service='https://wcs-mds.idee.es/mds'
manifest={'source':service,'coverage':'mdsn_v025','unit':'m','license':'https://www.ign.es/web/ign/portal/politica-datos','blocks':[],'tiles':[]}
packed={}
for z0 in range(-4000,5001,3000):
    for x0 in range(-3000,12001,3000):
        extent=(x0,z0,x0+3000,z0+3000)
        if not any(geom.intersects(box(*extent)) for geom in municipality):continue
        key=f'{x0//1000}_{z0//1000}';path=cache/(key+'.tif')
        url=service+'?'+urlencode([('service','WCS'),('version','2.0.1'),('request','GetCoverage'),('coverageId','mdsn_v025'),
              ('subset',f'x({730000+x0-20},{730000+x0+3020})'),('subset',f'y({4395000-z0-3020},{4395000-z0+20})'),('format','image/tiff')])
        if not path.is_file():
            resp=requests.get(url,timeout=100);resp.raise_for_status()
            if resp.content[:2] not in (b'II',b'MM'):raise ValueError(resp.text[:200])
            path.write_bytes(resp.content)
        with tifffile.TiffFile(path) as f:
            page=f.pages[0];h=page.asarray()
            sx,sz=page.tags['ModelPixelScaleTag'].value[:2]
            tie=page.tags['ModelTiepointTag'].value
            left,top=tie[3]-730000,4395000-tie[4]
        assert 2.4<sx<2.6 and 2.4<sz<2.6 and abs(left-x0+20)<4 and abs(top-z0+20)<4
        allowed=Image.new('L',(h.shape[1],h.shape[0]));draw=ImageDraw.Draw(allowed)
        def pix(p):return [((x-left)/sx,(z-top)/sz) for x,z in p]
        for p in world['municipality']:
            draw.polygon(pix(p['outer']),fill=255)
            for hole in p['holes']:draw.polygon(pix(hole),fill=0)
        wide=(x0-20,z0-20,x0+3020,z0+3020)
        for bounds,rings in exclusions:
            if overlaps(wide,bounds):draw.polygon(pix(rings[0]),fill=0)
        for bounds,(line,width) in roads:
            if overlaps(wide,bounds):draw.line(pix(line),fill=0,width=max(2,round((width+1.5)/sx)))
        for bounds,(x,z) in mapped:
            if overlaps(wide,bounds):draw.ellipse(pix([(x-5,z-5),(x+5,z+5)]),fill=0)
        # Local peaks identify canopy groups; flat crowns contribute once per connected plateau.
        canopy=np.where((h>=2)&(h<=39),h,0)
        smooth=ndi.gaussian_filter(canopy.astype('float32'),.65)
        peaks=(smooth>=2.3)&(smooth==ndi.maximum_filter(smooth,size=3))&(np.asarray(allowed)>0)
        labs,count=ndi.label(peaks)
        centers=ndi.maximum_position(smooth,labs,np.arange(1,count+1)) if count else []
        hits=0
        for row,col in centers:
            x=left+(col+.5)*sx;z=top+(row+.5)*sz
            if not (x0<=x<x0+3000 and z0<=z<z0+3000):continue
            for (l,t,r,b),img in photos:
                if not (l<=x<r and t<=z<b):continue
                px=min(img.shape[1]-1,int((x-l)/(r-l)*img.shape[1]))
                py=min(img.shape[0]-1,int((z-t)/(b-t)*img.shape[0]))
                red,green,blue=map(int,img[py,px]);break
            else:continue
            if green<red*.96 or green<=blue*1.05 or green<19:continue
            height=int(h[row,col])
            if height<3:continue
            window=canopy[max(0,row-3):row+4,max(0,col-3):col+4]
            radius=min(7.8,max(1.35,min(.66*height,np.sqrt((window>=height*.64).sum()*sx*sz/np.pi))))
            tx,tz=int(x//500),int(z//500)
            # 0.25 m horizontal units; last byte records measured local green brightness.
            packed.setdefault((tx,tz),[]).append((round((x-tx*500)*4),round((z-tz*500)*4),height,round(radius*10),green))
            hits+=1
        manifest['blocks'].append(dict(extent=extent,source=url,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),crowns=hits))
        print(key,hits,flush=True)
dtype=np.dtype([('x','<u2'),('z','<u2'),('height','u1'),('radius','u1'),('green','u1')])
for (tx,tz),rows in sorted(packed.items()):
    manifest['tiles'].append([tx,tz,len(rows)])
# One binary request. Tiles are independently culled and only near meshes are allocated.
with (out/'crowns.bin').open('wb') as f:
    for tx,tz,count in manifest['tiles']:f.write(np.asarray(packed[(tx,tz)],dtype=dtype).tobytes())
manifest['count']=sum(t[2] for t in manifest['tiles'])
(out/'index.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(manifest['count'],'candidatos',flush=True)
