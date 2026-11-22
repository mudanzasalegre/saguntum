"""Measure obstruction of diffuse skylight from the IGN normalized building surface.

Run after territory-building-fabric.py and territory-building-years.py. Reads the
same cached MDSnE and local DTM. Output is one base-32 character per exterior edge.
"""
import argparse
import gzip
import json
from pathlib import Path
import tempfile

import numpy as np
import rasterio


def prepare(data, raster):
    alphabet='0123456789abcdefghijklmnopqrstuv'
    terrain=json.loads((data/'world.json').read_bytes())['terrain']['detail']
    dem=np.fromfile(data/terrain['heights'],dtype='<i2').reshape(terrain['height'],terrain['width'])*terrain['unit']
    l,t,r,b=terrain['bounds']
    with rasterio.open(raster) as src:
        surface=src.read(1)
        dx,dz=src.transform.a,-src.transform.e
        ox,oz=src.transform.c-730000,4395000-src.transform.f
    def ground(x,z):
        u=np.clip(np.rint((x-l)*(dem.shape[1]-1)/(r-l)).astype(int),0,dem.shape[1]-1)
        v=np.clip(np.rint((z-t)*(dem.shape[0]-1)/(b-t)).astype(int),0,dem.shape[0]-1)
        return dem[v,u]
    def exposure(a,b,h):
        edge=b-a
        width=np.maximum(.001,np.hypot(edge[:,0],edge[:,1]))
        x,z=((a+b)*.5).T
        tx,tz=edge[:,0]/width,edge[:,1]/width
        nx,nz=tz,-tx
        base=ground(x,z)
        scores=np.zeros((len(a),2))
        for yaw in [-.7854,0.,.7854]:
            vx,vz=nx*np.cos(yaw)+tx*np.sin(yaw),nz*np.cos(yaw)+tz*np.sin(yaw)
            horizon=np.zeros_like(scores)
            for offset in [4.,7.,11.,16.,24.,34.]:
                xx,zz=x+offset*vx,z+offset*vz
                col=np.floor((xx-ox)/dx).astype(int)
                row=np.floor((zz-oz)/dz).astype(int)
                valid=(col>=0)&(col<surface.shape[1])&(row>=0)&(row<surface.shape[0])
                height=np.zeros(len(a))
                heights=surface[row[valid],col[valid]]
                height[valid]=np.where((heights>=0)&(heights<100),heights,0)
                relief=ground(xx,zz)+height-base
                angles=np.column_stack((relief-1.7,relief-h)) / offset
                horizon=np.maximum(horizon,np.arctan(angles))
            scores+=np.sin(horizon)/3
        low=np.rint(7*scores[:,0]).astype(int)
        high=np.rint(3*np.clip(scores[:,1]/np.maximum(.001,scores[:,0]),0,1)).astype(int)
        covered=(x>=ox)&(x<ox+dx*surface.shape[1])&(z>=oz)&(z<oz+dz*surface.shape[0])
        return np.where(covered&(low>0),low+8*high,0)
    folder=data/'building-fabric'
    samples=buildings=0
    for p in sorted(folder.glob('*.bin')):
        sectors=json.loads(gzip.decompress(p.read_bytes()))
        for sector,records in sectors.items():
            parcels=json.loads((data/'b'/(sector+'.json')).read_bytes())['buildings']
            starts,ends,heights,spans=[],[],[],[]
            for geometry,record in zip(parcels,records,strict=True):
                assert record[0]==geometry['id']
                loop=np.array(geometry['rings'][0])
                if np.array_equal(loop[0],loop[-1]): loop=loop[:-1]
                # Normals point to the street in both winding conventions.
                q=np.roll(loop,-1,axis=0)
                area=(loop[:,0]*q[:,1]-loop[:,1]*q[:,0]).sum()
                start,end=(loop,q) if area>=0 else (q,loop)
                spans.append((len(starts),len(loop)))
                starts.extend(start); ends.extend(end); heights.extend([geometry.get('height') or 5.8]*len(loop))
            if not starts: continue
            packed=exposure(np.asarray(starts),np.asarray(ends),np.asarray(heights))
            for rec,(i,n) in zip(records,spans):
                del rec[5:]
                values=packed[i:i+n]
                if any(values):
                    if len(rec)<5: rec.append(None)
                    rec.append(''.join(alphabet[v] for v in values))
                    buildings+=1; samples+=np.count_nonzero(values)
        p.write_bytes(gzip.compress(json.dumps(sectors,separators=(',',':')).encode(),compresslevel=9,mtime=0))
    manifest=folder/'manifest.json'
    info=json.loads(manifest.read_bytes())
    info['facadeSky']={'source':'IGN MDSnE 2.5 m, MDT territorial; misma extracción que las cubiertas',
                        'method':'Frente de fachada, tres azimuts, seis distancias de 4 a 34 m; fracción de cielo obstruida al pie y al alero.',
                        'parts':buildings,'obstructedEdges':int(samples)}
    manifest.write_text(json.dumps(info,indent=2),encoding='utf8')
    print(info['facadeSky'])


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--surface',type=Path,default=Path(tempfile.gettempdir())/'saguntum-fabric-v35/mdsn-core.tif')
    parser.add_argument('--data',type=Path,default=Path(__file__).resolve().parents[1]/'dist/assets/territory')
    args=parser.parse_args()
    prepare(args.data,args.surface)
