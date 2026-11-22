"""Prepara las fachadas de la Glorieta desde las capas originales del Atlas y Direcciones INSPIRE."""
import json, math, tempfile, zipfile
from pathlib import Path
import requests
from lxml import etree
from pyproj import Transformer
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union

root=Path(__file__).resolve().parents[1]/'dist/assets/data'
atlas=json.loads((root/'cartography.json').read_bytes())
layout=json.loads((root/'glorieta-layout.json').read_bytes())
sx=111320*math.cos(math.radians(39.679))
def local(p): return ((p[0]+.278)*sx,(39.679-p[1])*111320)
def geo(p): return [round(-.278+p[0]/sx,8),round(39.679-p[1]/111320,8)]
def poly(b): return Polygon([local(p) for p in b['coordinates']],[[local(p) for p in r] for r in b.get('holes',[])]).buffer(0)
plaza=Polygon([local(p) for p in layout['perimeter']]).buffer(0)
look=plaza.buffer(28)
special={'3559301YJ3935H':'ayuntamiento','3560501YJ3936B':'auditorio','3661101YJ3936B':'mercado','3460905YJ3936A':'biblioteca','3460907YJ3936A':'cazadores','3460904YJ3936A':'bancaja'}
allparts=[];parents=set(); interior=[]
for b in atlas['buildings']:
 x,z=local(b['coordinates'][0])
 if not -290<x<120 or not -430<z<60:continue
 p=poly(b)
 if p.is_empty:continue
 if b['id']=='cat-3460812YJ3936A_part6-0':continue  # Retained by the original Plaça Major context.
 if plaza.covers(p.representative_point()):interior.append(b['id']);continue
 parent=b.get('parentId',b['id'])
 allparts.append((b,p,parent))
 if p.intersects(look) or parent in special:parents.add(parent)
records=[]; outlines={}; frontages={}
for ref in sorted(parents):
 items=[(b,p) for b,p,parent in allparts if parent==ref]
 hull=unary_union([p.buffer(.06) for b,p in items]).buffer(-.06).simplify(.22)
 polygons=[hull] if hull.geom_type=='Polygon' else list(hull.geoms)
 name=special.get(ref,'caserio')
 parts=[]
 for b,p in items:
  b={k:b[k] for k in ['id','parentId','coordinates','holes','levels','height','roofColor','surfaceHeightEstimate','surfaceHeightSamples'] if k in b}
  b['role']=name
  parts.append(b)
 records+=parts
 if name!='caserio':
  pp=max(polygons,key=lambda p:p.area);outlines[name]=[[round(x,3),round(z,3)] for x,z in list(pp.exterior.coords)[:-1]]
 # Public and exposed faces; retain edges of the parent outline, not the party walls of its parts.
 for pg in polygons:
  ring=list(pg.exterior.coords)
  for a,b in zip(ring,ring[1:]):
   line=LineString([a,b]);L=line.length
   if L<2.7:continue
   mid=line.interpolate(.5,normalized=True);dx=(b[0]-a[0])/L;dz=(b[1]-a[1])/L;nx,nz=-dz,dx
   if pg.contains(Point(mid.x+nx*.25,mid.y+nz*.25)):nx,nz=-nx,-nz
   if any(o.contains(Point(mid.x+nx*.85,mid.y+nz*.85)) for _,o,other in allparts if other!=ref):continue
   samples=[(o.distance(mid),rec) for rec,o in items]
   part=min(samples,key=lambda row:row[0])[1]
   frontages.setdefault(ref,[]).append({'a':[round(v,3) for v in a],'b':[round(v,3) for v in b],'n':[round(nx,6),round(nz,6)],'part':part['id']})
ad='https://www.catastro.hacienda.gob.es/INSPIRE/Addresses/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.AD.46222.zip'
cache=Path(tempfile.gettempdir())/'glorieta-doc/ad.zip';cache.parent.mkdir(exist_ok=True)
if not cache.exists():
 response=requests.get(ad,timeout=45);response.raise_for_status();cache.write_bytes(response.content)
tree=etree.fromstring(zipfile.ZipFile(cache).read('A.ES.SDGC.AD.46222.gml'));ns=tree.nsmap;tr=Transformer.from_crs(25830,4326,always_xy=True)
portals=[]
for el in tree.findall('gml:featureMember/AD:Address',ns):
 code=el.find('.//base:localId',ns).text.split('.')
 if code[-1] in parents and code[2] in ('50','183','86'):
  ll=tr.transform(*map(float,el.find('.//gml:pos',ns).text.split()))
  portals.append({'ref':code[-1],'number':code[3],'coordinate':[round(v,8) for v in ll]})
refs={v:k for k,v in special.items()}
anchors={'ayuntamiento':[-41.6,-129.6],'mercado':[28.8,-244.1],'biblioteca':[-81.5,-181.1],'auditorio':[7.3,-179.6],'cazadores':[-83.1,-158],'bancaja':[-81,-194]}
data=dict(coordinate=geo(plaza.centroid.coords[0]),buildings=records,frontages=frontages,outlines=outlines,refs=refs,
 excludedBuildingIds=list(dict.fromkeys([b['id'] for b in records]+interior)),protectedFootprints=[{'id':b['id'],'coordinates':b['coordinates'],'holes':b.get('holes',[])} for b in records],
 portals=portals,focusCoordinates={k:geo(p) for k,p in anchors.items()},sources={'building':'Catastro INSPIRE / cartography.json','addresses':ad,'heights':'MDSnE IGN y plantas catastrales','documentation':'López Herranz 2015, p. 90; referencias en research/glorieta-arquitectura.md'})
# Draw short source ways in full, leaving longer streets under the Atlas road layer.
near=plaza.buffer(54)
lines=[]; ids=[]; streetNames={}
for r in atlas['roads']:
 if r.get('area')=='yes' or len(r['coordinates'])<2:continue
 path=LineString([local(c) for c in r['coordinates']])
 if not near.contains(path) or not path.intersects(plaza.buffer(22)):continue
 key=str(r['id']);ids.append(key);streetNames[key]=r.get('name') or r.get('kind')
 if not plaza.covers(path):
  width={'residential':5.3,'pedestrian':3.7,'service':3.5,'footway':1.6,'path':1.4}.get(r.get('kind'),4)
  lines.append(path.buffer(width/2,cap_style='flat',join_style='round'))
footprints=unary_union([p for _,p,_ in allparts])
def surfaceRings(geom):
 polygons=[geom] if geom.geom_type=='Polygon' else [g for g in getattr(geom,'geoms',[]) if g.geom_type=='Polygon']
 return [{'outer':[[round(x,3),round(z,3)] for x,z in g.exterior.coords],'holes':[[[round(x,3),round(z,3)] for x,z in r.coords] for r in g.interiors]} for g in polygons if g.area>.3]
road=unary_union(lines)
exclude=plaza.union(footprints)
# Close the actual public frontage to the kerb where the carriageway runs alongside.
# Rays longer than five metres can reach a garden or cross a private setback.
strips=[]
for ref,faces in frontages.items():
 for face in faces:
  a,b=face['a'],face['b'];nx,nz=face['n'];length=math.dist(a,b)
  count=max(1,math.ceil(length/1.25));previous=None
  for i in range(count+1):
   f=i/count;x=a[0]+(b[0]-a[0])*f;z=a[1]+(b[1]-a[1])*f
   ray=LineString([(x,z),(x+nx*5,z+nz*5)])
   hits=road.intersection(ray);current=None
   if not hits.is_empty:
    dist=Point(x,z).distance(hits);current=[(x,z),(x+nx*dist,z+nz*dist)]
   if previous and current:
    strip=Polygon([*previous,*current[::-1]]).buffer(0)
    if not strip.is_empty:strips.append(strip)
   previous=current
sidewalk=road.buffer(1.1).union(unary_union(strips)).difference(road.union(exclude))
data.update(excludedRoadIds=ids,streetNames=streetNames,roads=surfaceRings(road.difference(exclude)),pavements=surfaceRings(sidewalk))
# A roof-colour plate in the Atlas' local grid, warped from the verified PNOA sheets.
import base64
import numpy as np
from PIL import Image
photos=root.parent/'territory/surface-photo'
register=json.loads((photos/'index.json').read_bytes())
left,top,right,bottom=unary_union([p for _,p,ref in allparts if ref in parents]).bounds
left,top,right,bottom=math.floor(left-1),math.floor(top-1),math.ceil(right+1),math.ceil(bottom+1)
w,h=round((right-left)*2),round((bottom-top)*2)
xx,zz=np.meshgrid(left+(np.arange(w)+.5)*(right-left)/w,top+(np.arange(h)+.5)*(bottom-top)/h)
e,n=Transformer.from_crs(4326,25830,always_xy=True).transform(-.278+xx/sx,39.679-zz/111320)
east,south=e-730000,4395000-n
ix,iz=np.floor(east/512).astype(int),np.floor(south/512).astype(int)
rgb=np.full((h,w,3),177,dtype=np.uint8);sources=[]
for tx,tz in sorted(set(zip(ix.flatten(),iz.flatten()))):
 key=f'{tx}_{tz}';source=photos/(key+'.webp')
 if not source.exists():continue
 im=np.asarray(Image.open(source).convert('RGB'));m=(ix==tx)&(iz==tz)
 cy=np.minimum(im.shape[0]-1,((south[m]/512-tz)*im.shape[0]).astype(int))
 cx=np.minimum(im.shape[1]-1,((east[m]/512-tx)*im.shape[1]).astype(int))
 rgb[m]=im[cy,cx];sources.append(key)
plate=Image.fromarray(rgb).quantize(colors=192,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
data['roofPhoto']={'bounds':[left,top,right,bottom],'width':w,'height':h,'sources':sources,
                   'palette':plate.getpalette()[:576],'index':base64.b64encode(plate.tobytes()).decode('ascii')}
(root/'glorieta-buildings.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
print(len(records),'partes',len(parents),'parcelas',len(interior),'exclusiones de plaza')
