"""Bake sky-view factors and a municipal shadow proxy from the existing IGN products.

Run after research/territory-building-fabric.py. Red stores the top of an observed roof
(whole metres above sea level + 8; zero outside a roof), green and blue the fraction of
the cosine-weighted sky hemisphere blocked at street and roof elevation.
"""
import json
from pathlib import Path
import tempfile
import argparse

import numpy as np
import rasterio
from PIL import Image
from scipy.ndimage import map_coordinates, maximum_filter

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'dist/assets/territory'

def prepare(source):
    with rasterio.open(source) as s:
        a=s.read(1).astype('float32')
        left,top=s.transform.c-730000,4395000-s.transform.f
        width,depth=s.width*s.transform.a,-s.height*s.transform.e
    a=np.where((a>0)&(a<95),a,0.)
    # Primary sample at 5 m, preserving the strongest half-covered roof.
    rows,cols=a.shape[0]//2,a.shape[1]//2
    a=a[:rows*2,:cols*2].reshape(rows,2,cols,2)
    sorted_cells=np.sort(a.transpose(0,2,1,3).reshape(rows,cols,4),axis=-1)
    roof=sorted_cells[:,:,2]
    spacing=width/(cols*2+1)*2
    dem=json.loads((BASE/'world.json').read_bytes())['terrain']['detail']
    g=np.fromfile(BASE/dem['heights'],dtype='<i2').reshape(dem['height'],dem['width']).astype('float32')*dem['unit']
    xx=left+(np.arange(cols)+.5)*spacing
    zz=top+(np.arange(rows)+.5)*spacing
    l,t,r,b=dem['bounds']
    u,v=np.meshgrid((xx-l)/(r-l)*(g.shape[1]-1),(zz-t)/(b-t)*(g.shape[0]-1))
    ground=map_coordinates(g,[v,u],order=1,mode='nearest')
    surface=ground+roof
    sky=np.zeros((2,rows,cols),'float32')
    for i in range(16):
        angle=i*np.pi/8
        h=np.zeros_like(sky)
        for d in (1,2,3,5,8,12):
            dx,dz=round(np.cos(angle)*d),round(np.sin(angle)*d)
            sample=np.roll(surface,(-dz,-dx),axis=(0,1))
            if dz>0: sample[-dz:]=ground[-dz:]
            elif dz<0: sample[:-dz]=ground[:-dz]
            if dx>0: sample[:,-dx:]=ground[:,-dx:]
            elif dx<0: sample[:,:-dx]=ground[:,:-dx]
            distance=np.hypot(dx,dz)*spacing
            h[0]=np.maximum(h[0],(sample-ground-1.)/distance)
            h[1]=np.maximum(h[1],(sample-surface-1.)/distance)
        # Integrate cos(theta) over the hemisphere hidden by the horizon.
        sky+=h*h/(1+h*h)/16
    urban=maximum_filter(roof>1.3,size=25)
    channels=np.stack([np.where(roof>1.3,np.rint(surface+8),0),np.rint(sky[0]*31)*8*urban,np.rint(sky[1]*31)*8*urban],axis=2)
    image=Image.fromarray(channels.clip(0,255).astype('uint8'))
    out=BASE/'landscape'
    image.save(out/'urban-sky.webp',lossless=True,method=6)
    image.resize((cols//2,rows//2),Image.Resampling.BOX).save(out/'urban-sky-compact.webp',lossless=True,method=6)
    print([left,top,cols*spacing,rows*spacing],image.size,(out/'urban-sky.webp').stat().st_size,
          (out/'urban-sky-compact.webp').stat().st_size, 'storage bytes')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--surface',type=Path,default=Path(tempfile.gettempdir())/'saguntum-fabric-v35/mdsn-core.tif')
    prepare(parser.parse_args().surface)
