"""Build the landscape used by the territorial renderer. Python 3, requests, tifffile, Pillow, NumPy.
Municipal foreground is left intact. The horizon grid is only a visual backdrop.
"""
import hashlib
import json
import tempfile
import struct
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

import numpy as np
import requests
import tifffile
from PIL import Image
from territory_distribution import original_photo, prepare_distribution

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "dist/assets"
OUT = ASSETS / "territory/landscape"
CACHE = Path(tempfile.gettempdir()) / "saguntum-horizonte37"
CRS = "EPSG:25830"
ORIGIN = (730000, 4395000)
EXTENT = (-26000, -34500, 18000, 23500)
BLOCKS = [(0,-1),(1,-1),(2,-1),(0,0),(1,0),(2,0),(0,1),(1,1)]
WMS = "https://www.ign.es/wms-inspire/pnoa-ma?"
WCS = "https://servicios.idee.es/wcs-inspire/mdt?"
RECORDS = {}

def acquire(name, service, params):
    path = CACHE / name
    url = service + urlencode(params, doseq=True)
    if not path.exists():
        response = requests.get(url, timeout=125)
        response.raise_for_status()
        if response.content[:1] in (b"<",b"{"):
            raise ValueError(response.text[:500])
        path.write_bytes(response.content)
    RECORDS[name] = dict(url=url, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        retrieved=datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).date().isoformat())
    return path

def ortho(x0,z0,x1,z1,width,height):
    return dict(service="WMS",version="1.3.0",request="GetMap",layers="OI.OrthoimageCoverage",styles="",
        crs=CRS,bbox=f"{ORIGIN[0]+x0},{ORIGIN[1]-z1},{ORIGIN[0]+x1},{ORIGIN[1]-z0}",width=width,height=height,format="image/jpeg")

def block_photo(pair):
    bx,bz = pair
    key = f"a{bx}_{bz}.jpg"
    # Request at most a 2 km sheet when a 4 km response is unavailable.
    if pair in {(0,-1),(2,-1),(0,0)}:
        img = Image.open(acquire(key, WMS, ortho(bx*4096,bz*4096,(bx+1)*4096,(bz+1)*4096,4096,4096)))
    else:
        img = Image.new("RGB",(4096,4096))
        for iz in range(2):
            for ix in range(2):
                x,z=bx*4096+ix*2048,bz*4096+iz*2048
                part = acquire(f"b{bx}_{bz}_{ix}_{iz}.jpg", WMS, ortho(x,z,x+2048,z+2048,2048,2048))
                img.paste(Image.open(part),(ix*2048,iz*2048))
    for code,side,stride,quality in [("p",4,1024,77),("m",2,2048,73)]:
        for iz in range(side):
            for ix in range(side):
                tile=img.crop((ix*stride,iz*stride,(ix+1)*stride,(iz+1)*stride))
                if stride>1024:
                    tile=tile.resize((1024,1024),Image.Resampling.LANCZOS)
                tile.save(OUT/f"{code}{bx*side+ix}_{bz*side+iz}.webp",quality=quality,method=3)

    print("PNOA",bx,bz,flush=True)

def validate_tiles():
    controls={"Sagunto":[3457,-438],"Puerto":[8218,1410],"Grau Vell":[6884,4075],
              "Pantalán":[10260,2418],"Corredor":[5770,644],"Marjal":[5280,5282]}
    measurements={}
    for name,(x,z) in controls.items():
        bx,bz=x//4096,z//4096
        if (bx,bz) in {(0,-1),(2,-1),(0,0)}:
            source=CACHE/f"a{bx}_{bz}.jpg"
            side=4096
        else:
            source=CACHE/f"b{bx}_{bz}_{(x%4096)//2048}_{(z%4096)//2048}.jpg"
            side=2048
        camera=OUT/f"p{x//1024}_{z//1024}.webp"
        def patch(file,x,z):
            return np.asarray(Image.open(file).crop((x-16,z-16,x+16,z+16)),dtype=float)
        expected=patch(source,x%side,z%side)
        observed=patch(camera,x%1024,z%1024)
        error=float(np.abs(expected-observed).mean())
        measurements[name]=dict(utm=[ORIGIN[0]+x,ORIGIN[1]-z],source=source.name,tile=camera.name,
            patchPixels=32,meanAbsoluteChannelError=round(error,3))
        if error>9:raise ValueError(f"{name}: error de registro RGB {error}")
    destination=ROOT/"research/validation-v37-landscape"
    destination.mkdir(parents=True,exist_ok=True)
    (destination/"cartografia.json").write_text(json.dumps(measurements,ensure_ascii=False,indent=2),encoding="utf8")

def main():
    OUT.mkdir(exist_ok=True,parents=True)
    CACHE.mkdir(exist_ok=True)
    background=acquire("horizonte.jpg",WMS,ortho(*EXTENT,2200,2900))
    Image.open(background).resize((1100,1450),Image.Resampling.LANCZOS).save(OUT/"horizon.jpg",quality=84)
    Image.open(background).resize((660,870),Image.Resampling.LANCZOS).save(OUT/"horizon-mobile.jpg",quality=84)
    dem=acquire("mdt.tif",WCS,dict(service="WCS",version="2.0.1",request="GetCoverage",coverageId="Elevacion25830_25",
        subset=["x(703975,748025)","y(4371475,4429525)"],format="image/tiff"))
    with tifffile.TiffFile(dem) as tif:
        page=tif.pages[0]
        grid=page.asarray().astype(float)
        step=page.tags[33550].value[0]
        e,n=page.tags[33922].value[3:5]
    # For a PixelIsArea raster, the first sample is half a pixel from the corner.
    xs=np.arange(EXTENT[0],EXTENT[2]+1,250)+ORIGIN[0]
    ns=ORIGIN[1]-np.arange(EXTENT[1],EXTENT[3]+1,250)
    ix=(xs-e)/step-.5
    iy=(n-ns)/step-.5
    grid[~np.isfinite(grid)|(grid < -15)|(grid>1600)]=-10
    x0=np.floor(ix).astype(int); y0=np.floor(iy).astype(int)
    def row(ys):
        return grid[np.ix_(ys,x0)]*(1-(ix-x0))+grid[np.ix_(ys,x0+1)]*(ix-x0)
    heights=row(y0)*(1-(iy-y0)[:,None])+row(y0+1)*(iy-y0)[:,None]
    heights.round().astype("<i2").tofile(OUT/"horizon.i16")
    # Full-coverage colour at two device budgets. Higher source detail streams around the camera.
    for name,source in [("territory","ortho.jpg"),("core","ortho-core.jpg")]:
        with Image.open(original_photo(source)) as img:
            for suffix,maxsize in [("",2048 if name=="core" else 1792),("-mobile",1280 if name=="core" else 1024)]:
                copy=img.copy();copy.thumbnail((maxsize,maxsize),Image.Resampling.LANCZOS)
                copy.save(OUT/(name+suffix+".jpg"),quality=87,optimize=True)
    # Each Atlas plate retains its published registration. Tiles decode independently.
    legacy={}
    for sheet in sorted((ASSETS/"data").glob("*orthophoto.jpg")):
        img=Image.open(sheet)
        prefix=sheet.name.removesuffix("orthophoto.jpg")
        legacy[prefix]=list(img.size)
        for z in range(0,img.height,1024):
            for x in range(0,img.width,1024):
                img.crop((x,z,min(img.width,x+1024),min(img.height,z+1024))).save(
                    OUT/f"atlas-{prefix}{x//1024}_{z//1024}.webp",quality=85,method=3)
    with ThreadPoolExecutor(2) as pool:
        list(pool.map(block_photo,BLOCKS))
    sources=ASSETS/"territory/canopy"
    idx=json.loads((sources/"index.json").read_text(encoding="utf8"))
    records=list(struct.iter_unpack("<HHBBB",(sources/"crowns.bin").read_bytes()))
    # Measure chromaticity over a small disk centred on each LiDAR crown. Filtering
    # by green excess and percentile reduces contamination by roads and deep shade.
    # The countrywide base supplies colour outside the downloaded one-metre blocks.
    coarse=Image.open(original_photo("ortho.jpg")).convert("RGB")
    coarse_grid=np.asarray(coarse)
    lookups={}
    colours=[]
    for tx,tz,count in idx["tiles"]:
        for dx,dz,height,radius,green in records[len(colours):len(colours)+count]:
            x=tx*500+dx*.25;z=tz*500+dz*.25
            cx,cz=int(x//1024),int(z//1024)
            key=(cx,cz)
            if key not in lookups:
                path=OUT/f"p{cx}_{cz}.webp"
                lookups[key]=np.asarray(Image.open(path).resize((512,512),Image.Resampling.BOX)) if path.exists() else None
            photo=lookups[key]
            if photo is not None:
                px,pz=int(x%1024/2),int(z%1024/2)
                rad=min(4,max(1,round(radius*.1/3)))
                sample=photo[max(0,pz-rad):pz+rad+1,max(0,px-rad):px+rad+1].reshape(-1,3)
            else:
                px=int(np.clip((x+5500)*coarse.width/19500,0,coarse.width-1))
                pz=int(np.clip((z+14500)*coarse.height/22000,0,coarse.height-1))
                sample=coarse_grid[pz:pz+1,px:px+1].reshape(-1,3)
            sample=sample.astype(float)+1
            strength=(2*sample[:,1]-sample[:,0]-sample[:,2])/sample.mean(axis=1)
            order=np.argsort(strength)
            r,g,b=np.median(sample[order[len(order)//2:]],axis=0)
            # Store red/green and blue/green as bounded colour corrections to the
            # photographic tree material. The original optical luminance still applies.
            colours.append([int(np.clip((r/g-.79)*180+125,72,195)),int(np.clip((b/g-.67)*180+123,60,190))])
    np.asarray(colours,dtype=np.uint8).tofile(OUT/"canopy-chroma.bin")
    validate_tiles()
    manifest=dict(crs=CRS,origin=ORIGIN,horizonBounds=EXTENT,horizonStep=250,horizonSize=[len(xs),len(ns)],
        atlasSheets=legacy,pnoaBlocks=BLOCKS,sourceResolutionM=1,mediumSampleM=2,sourcePixelSizeMDT=25,canopyChromaCount=len(colours),
        credits="Ortofotografía PNOA máxima actualidad y MDT25 © Instituto Geográfico Nacional de España, CC BY 4.0.",
        license="https://www.ign.es/web/ign/portal/politica-datos",records=dict(sorted(RECORDS.items())))
    (OUT/"index.json").write_text(json.dumps(manifest,indent=2),encoding="utf8")
    prepare_distribution()
if __name__=="__main__":
    main()
