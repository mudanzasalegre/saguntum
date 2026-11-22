"""Puerto industrial district: reproducible OSM extraction and IGN relief.

Coordinates share the atlas origin with historic Sagunto. No vertical exaggeration.
The display crop is editorial; source geometry remains geographic.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode
import xml.etree.ElementTree as ET
import json, math, concurrent.futures, io
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parents[1]
OUT = BASE/'dist/assets/data'
CACHE = BASE/'research/terrain_tiles'
ORIGIN = [-.278, 39.679]
BOUNDS = dict(minX=3500, maxX=7200, minZ=450, maxZ=4050)
SHAPE = dict(cx=5350, cz=2250, rx=1700, rz=1700)
SOURCES = {
 'coast.osm': 'https://api.openstreetmap.org/api/0.6/map?bbox=-0.222,39.640,-0.193,39.689',
 'corridor.osm': 'https://api.openstreetmap.org/api/0.6/map?bbox=-0.267,39.665,-0.221,39.681',
 'puerto-west.osm': 'https://api.openstreetmap.org/api/0.6/map?bbox=-0.238,39.649,-0.220,39.666',
}
def project(c): return [(c[0]-ORIGIN[0])*111320*math.cos(math.radians(ORIGIN[1])), (ORIGIN[1]-c[1])*111320]
def unproject(x,z): return [ORIGIN[0]+x/(111320*math.cos(math.radians(ORIGIN[1]))),ORIGIN[1]-z/111320]
def inside(c):
 x,z=project(c);return BOUNDS['minX']<=x<=BOUNDS['maxX'] and BOUNDS['minZ']<=z<=BOUNDS['maxZ']
def tags(e):return {t.get('k'):t.get('v') for t in e.findall('tag')}
nodes={};node_tags={};ways={}
for filename,url in SOURCES.items():
 path=BASE/'research'/filename
 if not path.exists(): path.write_bytes(urlopen(url,timeout=50).read())
 root=ET.parse(path).getroot()
 for e in root.findall('node'):
  nodes[e.get('id')]=[float(e.get('lon')),float(e.get('lat'))];node_tags[e.get('id')]=tags(e)
 for e in root.findall('way'):ways[e.get('id')]=e
def coords(e):return [nodes[n.get('ref')] for n in e.findall('nd') if n.get('ref') in nodes]
def num(v):
 try:return float(v)
 except:return None
def road_parts(cs):
 # Keep only contiguous nearby vertices, plus one vertex on each end. This
 # bounds preprocessing of long OSM roads without changing in-crop alignment.
 marked=[inside(c) for c in cs];keep=[v or (i>0 and marked[i-1]) or (i+1<len(cs) and marked[i+1]) for i,v in enumerate(marked)]
 parts=[];part=[]
 for c,k in zip(cs,keep):
  if k:part.append(c)
  elif part:
   if len(part)>1:parts.append(part)
   part=[]
 if len(part)>1:parts.append(part)
 return parts
out=dict(origin=ORIGIN,projection='local equirectangular; x east metres, z south metres',bounds=BOUNDS,terrainShape=SHAPE,title='Puerto de Sagunto · ciudad factoría',attribution='© OpenStreetMap contributors',license='ODbL 1.0',license_url='https://www.openstreetmap.org/copyright',sources=list(SOURCES.values()),retrieved='2026-11-19',castlePolygon=[],theatrePolygon=[],buildings=[],roads=[],landcover=[],trees=[],railways=[],coastlines=[],places=[])
for id,e in ways.items():
 t=tags(e);cs=coords(e)
 if len(cs)<2 or not any(inside(c) for c in cs):continue
 f=dict(id=id,coordinates=cs);name=t.get('name:es',t.get('name'))
 if name:f['name']=name
 if t.get('building') and t['building']!='no':
  out['buildings'].append(dict(f,kind=t['building'],height=num(t.get('height')),levels=num(t.get('building:levels')),roofShape=t.get('roof:shape'),roofHeight=num(t.get('roof:height'))))
 if t.get('highway'):
  for i,p in enumerate(road_parts(cs)):
   out['roads'].append(dict(f,id=id if i==0 else f'{id}:{i}',osmId=id,coordinates=p,kind=t['highway'],surface=t.get('surface'),width=t.get('width'),bridge=t.get('bridge'),tunnel=t.get('tunnel')))
 if t.get('natural') or t.get('landuse') or t.get('waterway') or t.get('leisure') in ['park','garden']:
  out['landcover'].append(dict(f,kind=t.get('natural',t.get('landuse',t.get('waterway',t.get('leisure'))))))
 if t.get('natural')=='coastline':out['coastlines'].append(f)
 if t.get('railway') in ['rail','disused','abandoned']:out['railways'].append(dict(f,kind=t['railway']))
for id,t in node_tags.items():
 if not inside(nodes[id]):continue
 if t.get('natural')=='tree':out['trees'].append(dict(id=id,coordinate=nodes[id],height=num(t.get('height')),leafType=t.get('leaf_type')))
out['notes']='Industrial-city display crop; mapped footprints are not an exhaustive cadastral survey. Heritage roof outlines absent from OSM are documented separately in the individual site records. Building elevations are estimated, not current architectural surveys.'
(OUT/'port-cartography.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print('Cartography', {k:len(v) for k,v in out.items() if isinstance(v,list)},flush=True)

west,south=unproject(BOUNDS['minX'],BOUNDS['maxZ']);east,north=unproject(BOUNDS['maxX'],BOUNDS['minZ'])
gb=dict(west=west,east=east,south=south,north=north)
zoom=15
def tile(lon,lat):return [(lon+180)/360*2**zoom,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**zoom]
x0,y0=map(math.floor,tile(west,north));x1,y1=map(math.floor,tile(east,south))
def download_tile(pair):
 x,y=pair;p=CACHE/f'{zoom}-{x}-{y}.png'
 if not p.exists():p.write_bytes(urlopen(f'https://xyz-mdt.idee.es/1.0.0/raster-dem/{zoom}/{x}/{y}.png',timeout=50).read())
 rgb=np.asarray(Image.open(p).convert('RGB'),dtype=np.float64)
 return x,y,-10000+(rgb[:,:,0]*65536+rgb[:,:,1]*256+rgb[:,:,2])*.1
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 tiles={(x,y):a for x,y,a in pool.map(download_tile,[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)])}
size=next(iter(tiles.values())).shape[0];mosaic=np.zeros(((y1-y0+1)*size,(x1-x0+1)*size))
for (x,y),a in tiles.items():mosaic[(y-y0)*size:(y-y0+1)*size,(x-x0)*size:(x-x0+1)*size]=a
w=741;h=721
xx,zz=np.meshgrid(np.linspace(BOUNDS['minX'],BOUNDS['maxX'],w),np.linspace(BOUNDS['minZ'],BOUNDS['maxZ'],h))
lon=ORIGIN[0]+xx/(111320*math.cos(math.radians(ORIGIN[1])));lat=ORIGIN[1]-zz/111320
px=((lon+180)/360*2**zoom-x0)*size;py=((1-np.arcsinh(np.tan(np.radians(lat)))/math.pi)/2*2**zoom-y0)*size
ix=np.floor(px).astype(int);iy=np.floor(py).astype(int);fx=px-ix;fy=py-iy
grid=(mosaic[iy,ix]*(1-fx)+mosaic[iy,ix+1]*fx)*(1-fy)+(mosaic[iy+1,ix]*(1-fx)+mosaic[iy+1,ix+1]*fx)*fy
elev=dict(origin=ORIGIN,bounds=BOUNDS,geographicBounds=gb,terrainShape=SHAPE,width=w,height=h,elevations=np.round(grid,1).ravel().tolist(),units='metres',source='IGN / CNIG · Modelo Digital de Elevaciones de España',source_url='https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png',source_product='PNOA-LiDAR MDT05',source_grid_spacing_m=5,source_zoom=zoom,source_tileSize=size,sample_spacing_m=dict(x=5,z=5),encoding='Mapbox Terrain RGB',sampling_note='Bilinear interpolation at 5 m application intervals. Source bare-earth MDT05 excludes buildings and trees; individual kerbs or steps are not surveyed by this mesh.',attribution='© Instituto Geográfico Nacional / CNIG',retrieved='2026-11-19',license_url='https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf')
(OUT/'port-elevation.json').write_text(json.dumps(elev,ensure_ascii=False,separators=(',',':')))
print('Elevation',w,h,'range',float(grid.min()),float(grid.max()),flush=True)
params=dict(service='WMS',version='1.3.0',request='GetMap',layers='OI.OrthoimageCoverage',styles='',crs='EPSG:4326',bbox=f'{south},{west},{north},{east}',width=4096,height=3985,format='image/jpeg')
url='https://www.ign.es/wms-inspire/pnoa-ma?'+urlencode(params)
im=Image.open(io.BytesIO(urlopen(url,timeout=55).read()));im.load();im.save(OUT/'port-orthophoto.jpg',quality=91,optimize=True)
(OUT/'port-orthophoto.json').write_text(json.dumps(dict(source='PNOA Máxima Actualidad · IGN/CNIG',source_url=url,attribution='© PNOA · Instituto Geográfico Nacional',geographicBounds=gb,bounds=BOUNDS,width=im.width,height=im.height,retrieved='2026-11-19',note='Retrieval date, not flight date. Mosaic capture dates and current construction state are not inferred from the service name.'),ensure_ascii=False,indent=2))
print('Orthophoto',im.size,flush=True)
