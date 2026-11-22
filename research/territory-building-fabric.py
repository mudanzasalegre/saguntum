"""Derive street-facing elevations, shared walls and evidenced roof slopes from the Atlas sources.
Python 3, NumPy, Shapely 2, rasterio, requests. Repeated runs use the local WCS cache.
"""
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlencode
import gzip
import hashlib
import json
import math
import tempfile
import numpy as np
import requests
import rasterio
import shapely
from shapely.geometry import Polygon, LineString

root=Path(__file__).resolve().parents[1]
data=root/'dist/assets/territory'
out=data/'building-fabric'
out.mkdir(exist_ok=True)
cache=Path(tempfile.gettempdir())/'saguntum-fabric-v35'
cache.mkdir(exist_ok=True)
query=[('service','WCS'),('version','2.0.1'),('request','GetCoverage'),('coverageId','mdsn_e025'),('subset','x(731750,741500)'),('subset','y(4390250,4396750)'),('format','image/tiff')]
url='https://wcs-mds.idee.es/mds?'+urlencode(query)
path=cache/'mdsn-core.tif'
if not path.exists():
    res=requests.get(url,timeout=160)
    res.raise_for_status()
    if res.content[:2] not in [b'II',b'MM']: raise ValueError('IGN WCS did not return TIFF')
    path.write_bytes(res.content)
with rasterio.open(path) as raster:
    raw=raster.read(1).astype('float32')
    step=raster.transform.a
    stepZ=-raster.transform.e
    left=raster.transform.c-730000
    top=4395000-raster.transform.f
assert max(abs(step-2.5),abs(stepZ-2.5))<.01
world=json.loads((data/'world.json').read_bytes())
dem=world['terrain']['detail']
h=np.fromfile(data/dem['heights'],dtype='<i2').reshape(dem['height'],dem['width'])*dem['unit']

def ground(x,z):
    l,t,r,b=dem['bounds']
    col=np.clip((x-l)*(dem['width']-1)/(r-l),0,dem['width']-1.00001)
    row=np.clip((z-t)*(dem['height']-1)/(b-t),0,dem['height']-1.00001)
    i,j=col.astype(int),row.astype(int)
    u,v=col-i,row-j
    a,b,c,d=h[j,i],h[j,i+1],h[j+1,i],h[j+1,i+1]
    return np.where(u+v<=1,a+(b-a)*u+(c-a)*v,d+(c-d)*(1-u)+(b-d)*(1-v))

def fit_roof(poly,b):
    """Require interior samples on both slopes, plausible gradients and improvement over flat."""
    if poly.area<104 or b['height']<3.6:return
    x0,z0,x1,z1=poly.bounds
    i0=max(0,math.ceil((x0-left)/step-.5));i1=min(raw.shape[1],math.ceil((x1-left)/step-.5))
    j0=max(0,math.ceil((z0-top)/stepZ-.5));j1=min(raw.shape[0],math.ceil((z1-top)/stepZ-.5))
    if i0>=i1 or j0>=j1:return
    jj,ii=np.mgrid[j0:j1,i0:i1]
    x=(ii+.5)*step+left;z=(jj+.5)*stepZ+top
    v=raw[j0:j1,i0:i1]
    interior=shapely.contains_xy(poly.buffer(-1.0),x,z)
    valid=interior & np.isfinite(v) & (v>1.6) & (v<100)
    if np.count_nonzero(valid)<16 or valid.sum()<interior.sum()*.78:return
    x,z,v=x[valid],z[valid],v[valid]
    if abs(np.median(v)-b['height'])>max(3,b['height']*.25):return
    y=v+ground(x,z)
    xy=np.column_stack((x-(x0+x1)*.5,z-(z0+z1)*.5))
    q=np.array(poly.exterior.coords[:-1])-[(x0+x1)*.5,(z0+z1)*.5]
    vec=np.roll(q,-1,axis=0)-q
    axis=vec[np.argmax((vec*vec).sum(1))]
    angle=math.atan2(axis[1],axis[0])
    # Equal-density coverage, cap the number of samples for the largest warehouses.
    if y.size>650:
        sample=np.linspace(0,y.size-1,650,dtype=int)
        xy,y=xy[sample],y[sample]
    center=np.median(y); y=y-center
    baseline=np.median(abs(y))
    if baseline<.38:return
    best=None
    for rotation in [0,math.pi/2]:
        nx,nz=math.cos(angle+rotation),math.sin(angle+rotation)
        t=xy@[nx,nz]
        r=q@[nx,nz]
        limits=(min(r),max(r))
        for ridge in [None,.33,.45,.5,.55,.67]:
            c=0 if ridge is None else limits[0]+ridge*(limits[1]-limits[0])
            if ridge is not None and min(sum(t<c),sum(t>c))<5:continue
            a=t if ridge is None else -abs(t-c)
            # Initial fit, then exclude extreme samples at parapets, equipment or mixed boundary pixels.
            slope,offset=np.polyfit(a,y,1)
            keep=abs(y-(a*slope+offset))<1.0
            if keep.sum()<max(14,.76*len(y)):continue
            slope,offset=np.polyfit(a[keep],y[keep],1)
            err=np.median(abs(y-(a*slope+offset)))
            if ridge is not None and slope<.07:continue
            if not .07<=abs(slope)<=.65 or err>min(.46,baseline*.47):continue
            height=abs(slope)*(max(r)-min(r) if ridge is None else max(c-min(r),max(r)-c))
            if not .85<height<min(8,b['height']*.48):continue
            score=err+(.035 if ridge is not None else 0)
            if best is None or score<best[0]:
                best=(score,[round(nx,4),round(nz,4),None if ridge is None else round(c,2),round(slope,3)],len(y),round(err,2))
    return best

bs=[]; by_sector={}; polygons=[]
for p in sorted((data/'b').glob('*.json')):
    items=json.loads(p.read_bytes())['buildings'];by_sector[p.stem]=[]
    for b in items:
        by_sector[p.stem].append(len(bs));bs.append(b);polygons.append(Polygon(b['rings'][0],b['rings'][1:]))
tree=shapely.STRtree(polygons)
roads=[];widths=[]
for f in sorted((root/'dist/assets/network').glob('*.json')):
    if f.name=='index.json':continue
    for road in json.loads(f.read_bytes())['roads']:
        # The simulator's traffic/access flags do not decide whether a street
        # physically exists. Carrer Major, for example, restricts movement but
        # its cadastral facades still face its mapped axis.
        if road['kind'] in ['trunk','motorway','motorway_link','trunk_link','construction','proposed'] or road.get('bridge'):continue
        for a,c in zip(road['points'],road['points'][1:]):
            if math.dist(a,c)>.1:roads.append([a,c]);widths.append(road['width']*.5)
roadtree=shapely.STRtree([LineString(r) for r in roads]);roadlines=np.array(roads);half=np.array(widths)
states={};entrances={};roofStats=Counter();stats=Counter();residuals=[]
for sector,ids in by_sector.items():
    xs=[];zs=[];nxs=[];nzs=[];owners=[];edges=[]
    for oid in ids:
        b=bs[oid];ring=np.array(b['rings'][0])
        if np.array_equal(ring[0],ring[-1]):ring=ring[:-1]
        sign=1 if shapely.is_ccw(polygons[oid].exterior) else -1
        for i,(a,c) in enumerate(zip(ring,np.roll(ring,-1,axis=0))):
            dx,dz=c-a;length=math.hypot(dx,dz);n=max(1,math.ceil(length/2.0))
            t=(np.arange(n)+.5)/n
            xs.extend(a[0]+dx*t);zs.extend(a[1]+dz*t);owners.extend([oid]*n);edges.extend([i]*n)
            nxs.extend([dz*sign/max(length,.001)]*n);nzs.extend([-dx*sign/max(length,.001)]*n)
    x,z,nx,nz,owner,edge=map(np.array,(xs,zs,nxs,nzs,owners,edges))
    # Check against the global footprint index across tile boundaries. A small gap between
    # digitised property parts is not a public facade. Never test against the building itself.
    occ=np.zeros(len(x),dtype=bool)
    for delta in [.16,.62]:
        q=shapely.points(x+nx*delta,z+nz*delta)
        loc,other=tree.query(q,predicate='within')
        occ[loc[owner[loc]!=other]]=True
    ri=roadtree.nearest(shapely.points(x,z));a=roadlines[ri,0];d=roadlines[ri,1]-a
    t=np.clip(((np.column_stack((x,z))-a)*d).sum(axis=1)/(d*d).sum(axis=1),0,1)
    vx,vz=(a+d*t[:,None]-np.column_stack((x,z))).T
    dist=np.hypot(vx,vz);outwards=vx*nx+vz*nz
    faced=(outwards>dist*.39) & (dist-half[ri]<14)
    # Reject apparent frontages that have another building between the facade and road.
    loc,other=tree.query(shapely.points(x+vx*.53,z+vz*.53),predicate='within')
    faced[loc[owner[loc]!=other]]=False
    labels=np.where(occ,'s',np.where(faced,'f','c'))
    starts=np.flatnonzero(np.r_[True,(owner[1:]!=owner[:-1])|(edge[1:]!=edge[:-1])])
    for lo,hi in zip(starts,np.r_[starts[1:],len(x)]):
        oid=owner[lo];b=bs[oid];idx=int(edge[lo])
        chars=''.join(labels[lo:hi]);stats.update(chars)
        states.setdefault(oid,[]).append(chars[0] if len(set(chars))==1 else chars)
        if 'f' in chars and b['height']>2.65:
            mask=labels[lo:hi]=='f'
            score=mask.sum()/max(2,np.median(dist[lo:hi][mask]))**.7
            parent=b['id'].split('_part')[0]
            if parent not in entrances or score>entrances[parent][0]:
                pos=int(np.flatnonzero(mask)[mask.sum()//2])
                entrances[parent]=(score,oid,idx,(pos+.5)/len(chars))
by_owner={v[1]:[v[2],round(v[3],3)] for v in entrances.values()}
groups=defaultdict(dict)
for sector,ids in by_sector.items():
    sx,sz=map(int,sector.split('_'));region=f'{sx//8}_{sz//8}'
    rows=[]
    for oid in ids:
        b=bs[oid];roof=fit_roof(polygons[oid],b)
        if roof:
            profile=roof[1];roofStats['single' if profile[2] is None else 'ridge']+=1
            residuals.append(roof[3])
        else: profile=None
        rows.append([b['id'],'/'.join(states[oid]),by_owner.get(oid),profile])
    groups[region][sector]=rows
for region,contents in groups.items():
    packed=json.dumps(contents,separators=(',',':')).encode()
    (out/(region+'.bin')).write_bytes(gzip.compress(packed,compresslevel=8,mtime=0))
manifest={'buildings':len(bs),'entrances':len(entrances),'sampleStates':dict(stats),'accepted':dict(roofStats),
          'medianResidualM':round(float(np.median(residuals)),3),'resolutionM':step,'source':url,
          'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'license':'© IGN / CNIG, CC BY 4.0','partsBySector':{k:len(v) for k,v in by_sector.items()}}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print({k:v for k,v in manifest.items() if k!='partsBySector'})
