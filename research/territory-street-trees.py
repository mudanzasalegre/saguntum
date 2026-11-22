"""Bake eight views of an actual CC0 tree into a compact directional atlas.

The source model is cached outside the repository. Requires numpy, numba, Pillow
and requests. Only the baked atlas and its source record ship to the browser.
"""
import json
from hashlib import md5
from io import BytesIO
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from numba import njit
from PIL import Image
import requests

ASSET = "tree_small_02"
CACHE = Path.home() / ".cache/saguntum/street-materials"
OUT = Path(__file__).resolve().parents[1] / "dist/assets/materials/streets"
SIZE = 512
HEADERS = {"User-Agent": "SAGUNTUM Atlas vivo offline material preparation (github.com/mudanzasalegre/saguntum)"}


def read(record):
    path = CACHE / record["md5"]
    if not path.exists():
        response = requests.get(record["url"], headers=HEADERS, timeout=150)
        response.raise_for_status()
        if md5(response.content).hexdigest() != record["md5"]:
            raise ValueError(record["url"])
        path.write_bytes(response.content)
    return path.read_bytes()


@njit(cache=True)
def raster(points, normals, uv, triangles, tex, alpha, buffer, pixel):
    size=pixel.shape[0]
    for tri in triangles:
        a, b, c = tri
        x0, y0, z0 = points[a]
        x1, y1, z1 = points[b]
        x2, y2, z2 = points[c]
        den = (y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
        if abs(den) < 1e-8:
            continue
        for y in range(max(0, int(np.ceil(min(y0,y1,y2)))), min(size, int(np.floor(max(y0,y1,y2)))+1)):
            for x in range(max(0, int(np.ceil(min(x0,x1,x2)))), min(size,int(np.floor(max(x0,x1,x2)))+1)):
                u=((y1-y2)*(x-x2)+(x2-x1)*(y-y2))/den
                v=((y2-y0)*(x-x2)+(x0-x2)*(y-y2))/den
                w=1-u-v
                if u<0 or v<0 or w<0:
                    continue
                depth=u*z0+v*z1+w*z2
                if depth<buffer[y,x]:
                    continue
                tu=int(((u*uv[a,0]+v*uv[b,0]+w*uv[c,0])%1)*tex.shape[1])
                tv=int(((u*uv[a,1]+v*uv[b,1]+w*uv[c,1])%1)*tex.shape[0])
                if alpha[tv,tu]<96:
                    continue
                buffer[y,x]=depth
                # Diffuse sky, stronger at exposed tips than below the crown.
                # Keep broad directional illumination for the runtime sun.
                ny=(u*normals[a,1]+v*normals[b,1]+w*normals[c,1])
                light=.83+.18*max(0.,ny)+.14*(1.-y/size)
                for ch in range(3):
                    pixel[y,x,ch]=min(255.,tex[tv,tu,ch]*light)
                pixel[y,x,3]=255


def close_tree(primitives):
    # Keep structural wood in true 3D. Weld nearby source vertices and remap
    # their triangles, rejecting degeneracies after welding.
    xyz,normal,uv,tri,tex,alpha=primitives[2]
    _,index,inv=np.unique(np.floor(xyz/.065).astype(int),axis=0,return_inverse=True,return_index=True)
    count=np.bincount(inv)
    xyz=np.stack([np.bincount(inv,weights=xyz[:,i])/count for i in range(3)],axis=1)
    c=tex[((uv[:,1]%1)*tex.shape[0]).astype(int),((uv[:,0]%1)*tex.shape[1]).astype(int)]
    rgb=np.stack([np.bincount(inv,weights=c[:,i])/count for i in range(3)],axis=1).astype('uint8')
    tri=inv[tri];tri=tri[(tri[:,0]!=tri[:,1])&(tri[:,1]!=tri[:,2])&(tri[:,2]!=tri[:,0])]
    # Nodes with no surviving faces may be discarded after material sampling.
    used,tri=np.unique(tri,return_inverse=True)
    model={"wood":{"position":np.rint(xyz[used]*1000).astype(int).ravel().tolist(),"color":rgb[used].ravel().tolist(),
                   "index":tri.ravel().tolist()},"clusters":[]}
    cells={}
    for xyz,normal,uv,tri,tex,alpha in primitives[:2]:
        centers=(xyz[tri[:,0]]+xyz[tri[:,1]]+xyz[tri[:,2]])/3
        bins=np.floor(centers/.89).astype(np.int16)
        code=bins[:,0]*512+bins[:,1]*16+bins[:,2]
        order=np.argsort(code);cut=np.where(np.diff(code[order]))[0]+1
        for sel in np.split(order,cut):
            f=tri[sel]
            idx,f=np.unique(f,return_inverse=True)
            cells.setdefault(int(code[sel[0]]),[]).append((xyz[idx],normal[idx],uv[idx],f.reshape(-1,3),tex,alpha))
    size=128;cols=16;rows=int(np.ceil(len(cells)*3/cols))
    model["grid"]=[cols,rows]
    atlas=Image.new("RGBA",(cols*size,rows*size))
    for cell,parts in sorted(cells.items()):
        corners=np.concatenate([p[0] for p in parts]);low=corners.min(axis=0);high=corners.max(axis=0)
        center=(low+high)/2;span=max(high-low)*1.055
        start=len(model["clusters"])*3
        model["clusters"].append([round(float(v),3) for v in [*center,span]])
        for axis in range(3):
            pixel=np.zeros((size,size,4),np.uint8);depth=np.full((size,size),-1e6)
            for xyz,normal,uv,tri,tex,alpha in parts:
                x,y,z=(xyz-center).T
                u,v,d=[(x,y,z),(-z,y,x),(x,-z,y)][axis]
                points=np.stack((size*.5+u*size/span,size*.5-v*size/span,d),axis=1)
                raster(points,normal,uv,tri,tex,alpha,depth,pixel)
            k=start+axis
            atlas.paste(Image.fromarray(pixel),(k%cols*size,k//cols*size))
    atlas.save(OUT/"tree-crown.webp",quality=93,method=6)
    (OUT/"tree-shape.json").write_text(json.dumps(model,separators=(",",":")),"utf-8")


def bake():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    files=requests.get("https://api.polyhaven.com/files/"+ASSET, headers=HEADERS, timeout=30).json()
    record=files["gltf"]["1k"]["gltf"]
    gltf=json.loads(read(record))
    data=read(record["include"][gltf["buffers"][0]["uri"]])
    def accessor(index):
        item=gltf["accessors"][index]
        view=gltf["bufferViews"][item["bufferView"]]
        dtype={5126:"<f4",5125:"<u4",5123:"<u2"}[item["componentType"]]
        width={"VEC3":3,"VEC2":2,"SCALAR":1}[item["type"]]
        stride=view.get("byteStride",np.dtype(dtype).itemsize*width)
        return np.ndarray((item["count"],width),dtype=dtype,buffer=data,
                          offset=view.get("byteOffset",0)+item.get("byteOffset",0),strides=(stride,np.dtype(dtype).itemsize)).copy()
    primitives=[]
    sources={key:record[key] for key in ["url","md5"]}
    sources["binary"]=record["include"][gltf["buffers"][0]["uri"]]
    alpha_source=files["leaves_alpha"]["1k"]["jpg"]
    for part in gltf["meshes"][0]["primitives"]:
        mat=gltf["materials"][part["material"]]
        photo=mat["pbrMetallicRoughness"]["baseColorTexture"]
        image=gltf["images"][gltf["textures"][photo["index"]]["source"]]
        colorfile=record["include"][image["uri"]]
        tex=np.array(Image.open(BytesIO(read(colorfile))).convert("RGB"))
        alpha=(np.array(Image.open(BytesIO(read(alpha_source))).convert("L")) if mat.get("alphaMode") else np.full(tex.shape[:2],255,np.uint8))
        attrib=part["attributes"];uv=accessor(attrib["TEXCOORD_"+str(photo.get("texCoord",0))])
        transform=photo.get("extensions",{}).get("KHR_texture_transform",{})
        uv=uv*np.asarray(transform.get("scale",[1,1]))+np.asarray(transform.get("offset",[0,0]))
        primitives.append((accessor(attrib["POSITION"]),accessor(attrib["NORMAL"]),uv,accessor(part["indices"]).reshape(-1,3),tex,alpha))
        sources[mat["name"]]=colorfile
    sources["alpha"]=alpha_source
    atlas=Image.new("RGBA",(SIZE*4,SIZE*6))
    def direction(i):
        angle=i%8*np.pi/4
        elevation=(i//8)*np.pi/5
        # A 6.30 m square centered on the root rather than the bounding box:
        # at different rotations the tree does not slide across its footprint.
        pixel=np.zeros((SIZE,SIZE,4),np.uint8);depth=np.full((SIZE,SIZE),-1e6)
        for xyz,normal,uv,tri,tex,alpha in primitives:
            x,y,z=xyz.T
            radial=z*np.cos(angle)+x*np.sin(angle)
            projected=(y-2.27)*np.cos(elevation)-radial*np.sin(elevation)
            depthAxis=radial*np.cos(elevation)+(y-2.27)*np.sin(elevation)
            points=np.stack(((x*np.cos(angle)-z*np.sin(angle))*SIZE/6.30+SIZE*.5,
                             SIZE*.5-projected*SIZE/6.30,depthAxis),axis=1)
            raster(points,normal,uv,tri,tex,alpha,depth,pixel)
        return i,Image.fromarray(pixel)
    # Prime numba before parallel views; avoid re-compiling the same signature.
    i,img=direction(0);atlas.paste(img,(0,0))
    with ThreadPoolExecutor(max_workers=2) as pool:
        for i,img in pool.map(direction,range(1,24)):
            atlas.paste(img,(i%4*SIZE,i//4*SIZE))
    atlas.resize((4*320,6*320),Image.Resampling.LANCZOS).save(OUT/"tree-views.webp",quality=90,method=5)
    close_tree(primitives)
    meta=requests.get("https://api.polyhaven.com/info/"+ASSET, headers=HEADERS,timeout=30).json()
    (OUT/"tree-credits.json").write_text(json.dumps({"id":ASSET,"source":"https://polyhaven.com/a/"+ASSET,
        "license":"CC0 1.0","licenseSource":"https://polyhaven.com/license","authors":meta["authors"],"originals":sources,
        "use":"Arquetipo de copa para arbolado de especie no inventariada; las ubicaciones provienen de OpenStreetMap."},
        ensure_ascii=False,indent=2)+"\n","utf-8")


if __name__=="__main__":
    bake()
