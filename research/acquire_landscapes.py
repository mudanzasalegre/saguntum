"""V6: reproducible geographic crops for the three explorable landscapes.

Source rasters are retained without invented dunes, river flow or terrain relief.
The application adds explicitly interpretive detail on top of these data.
Run with /usr/bin/python3; GDAL/NumPy/Pillow are provided by the environment.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode
import xml.etree.ElementTree as ET
import math,json,sys,io,concurrent.futures,shutil
import numpy as np
from PIL import Image

BASE=Path(__file__).resolve().parents[1];OUT=BASE/'dist/assets/data';CACHE=BASE/'research/terrain_tiles'
ORIGIN=[-.278,39.679];FACTOR=111320*math.cos(math.radians(ORIGIN[1]))
REGIONS={
 'marjal':{'title':'Marjal dels Moros','shape':dict(cx=1480,cz=6200,rx=2180,rz=1900),'core':dict(minX=800,maxX=2450,minZ=5150,maxZ=7000),'coreStep':5,'outerStep':15,'sourceCache':'/workspace/scratch/02fd1ac67942/marjal-sources/marjal.osm','sourceBbox':'-0.282,39.607,-0.237,39.639'},
 'almarda':{'title':'Almardà–Almenara · playa y dunas','shape':dict(cx=7500,cz=-5100,rx=2700,rz=3600),'core':dict(minX=6200,maxX=9000,minZ=-7500,maxZ=-2300),'coreStep':7.5,'outerStep':20,'sourceCache':'/workspace/scratch/02fd1ac67942/dunes-research/coast-north.osm','sourceBbox':'-0.218,39.697,-0.169,39.752'},
 'palancia':{'title':'Palancia · del casco histórico al Mediterráneo','shape':dict(cx=2500,cz=250,rx=4600,rz=2300),'core':dict(minX=-900,maxX=6400,minZ=-950,maxZ=1650),'coreStep':7.5,'outerStep':20,'sourceBbox':'-0.303,39.656,-0.194,39.698'}
}
def project(c):return [(c[0]-ORIGIN[0])*FACTOR,(ORIGIN[1]-c[1])*111320]
def unproject(x,z):return [ORIGIN[0]+x/FACTOR,ORIGIN[1]-z/111320]
def number(v):
 try:return float(str(v).replace(' m',''))
 except (ValueError,TypeError):return None
def tags(e):return {t.get('k'):t.get('v') for t in e.findall('tag')}
def join_rings(parts):
 pending=[p[:] for p in parts if len(p)>1];rings=[]
 while pending:
  line=pending.pop()
  while line[0]!=line[-1]:
   match=False
   for i,p in enumerate(pending):
    if line[-1]==p[0]:line+=p[1:]
    elif line[-1]==p[-1]:line+=p[-2::-1]
    elif line[0]==p[-1]:line=p[:-1]+line
    elif line[0]==p[0]:line=p[:0:-1]+line
    else:continue
    pending.pop(i);match=True;break
   if not match:break
  if len(line)>=4 and line[0]==line[-1]:rings.append(line)
 return rings
def acquire(key):
 config=REGIONS[key];s=config['shape'];b=dict(minX=s['cx']-s['rx'],maxX=s['cx']+s['rx'],minZ=s['cz']-s['rz'],maxZ=s['cz']+s['rz'])
 def inside(c):
  x,z=project(c);return b['minX']<=x<=b['maxX'] and b['minZ']<=z<=b['maxZ']
 def intersects(cs):
  world=[project(c) for c in cs];return bool(world) and min(x for x,z in world)<=b['maxX'] and max(x for x,z in world)>=b['minX'] and min(z for x,z in world)<=b['maxZ'] and max(z for x,z in world)>=b['minZ']
 source='https://api.openstreetmap.org/api/0.6/map?bbox='+config['sourceBbox'];path=CACHE/f'landscape-{key}.osm';sources=[];paths=[]
 if key=='palancia':
  west,south,east,north=map(float,config['sourceBbox'].split(','))
  for row in range(2):
   for col in range(4):
    box=[west+(east-west)*col/4,south+(north-south)*row/2,west+(east-west)*(col+1)/4,south+(north-south)*(row+1)/2];url='https://api.openstreetmap.org/api/0.6/map?bbox='+','.join(f'{v:.7f}' for v in box);part=CACHE/f'landscape-{key}-expanded-{row}-{col}.osm'
    if not part.exists():part.write_bytes(urlopen(url,timeout=55).read())
    paths.append(part);sources.append(url)
 else:
  if not path.exists():
   cp=Path(config.get('sourceCache','/nonexistent'))
   if cp.exists():shutil.copyfile(cp,path)
   else:path.write_bytes(urlopen(source,timeout=55).read())
  paths.append(path);sources.append(source)
 files=paths+list((BASE/'research').glob('*.osm'))
 nodes={};nodeTags={};ways={};relations={}
 for file in files:
  root=ET.parse(file).getroot()
  for e in root.findall('node'):nodes[e.get('id')]=[float(e.get('lon')),float(e.get('lat'))];nodeTags[e.get('id')]=tags(e)
  for e in root.findall('way'):ways[e.get('id')]=e
  for e in root.findall('relation'):relations[e.get('id')]=e
 def coords(e):return [nodes[n.get('ref')] for n in e.findall('nd') if n.get('ref') in nodes]
 out=dict(origin=ORIGIN,projection='Local equirectangular: x east, z south, metres; common origin for all atlas regions.',title=config['title'],bounds=b,terrainShape=s,meshOptions={k:config[k] for k in ['core','coreStep','outerStep']},source=sources[0],sources=sources,retrieved='2026-11-19',license='ODbL 1.0',attribution='© OpenStreetMap contributors',license_url='https://www.openstreetmap.org/copyright',castlePolygon=[],theatrePolygon=[],buildings=[],roads=[],landcover=[],waterways=[],trees=[],railways=[],coastlines=[],places=[])
 members=set()
 for id,e in relations.items():
  t=tags(e)
  if t.get('type')!='multipolygon' or not any(k in t for k in ['natural','landuse','waterway','leisure']):continue
  ms=[m for m in e.findall('member') if m.get('type')=='way' and m.get('ref') in ways]
  outer=join_rings([coords(ways[m.get('ref')]) for m in ms if m.get('role')!='inner']);holes=join_rings([coords(ways[m.get('ref')]) for m in ms if m.get('role')=='inner'])
  for i,ring in enumerate(outer):
   if not intersects(ring):continue
   # Hole assignment is conservative by envelope; nesting is verified in water derivation.
   xs=[p[0] for p in ring];ys=[p[1] for p in ring]
   inners=[h for h in holes if min(xs)<=h[0][0]<=max(xs) and min(ys)<=h[0][1]<=max(ys)]
   out['landcover'].append(dict(id=f'relation/{id}:{i}',osmId=id,coordinates=ring,holes=inners,kind=t.get('natural',t.get('landuse',t.get('waterway',t.get('leisure')))),name=t.get('name'),tags=t))
   members.update(m.get('ref') for m in ms)
 for id,e in ways.items():
  t=tags(e);cs=coords(e)
  if len(cs)<2 or not intersects(cs):continue
  f=dict(id=id,coordinates=cs);name=t.get('name:es',t.get('name'))
  if name:f['name']=name
  if t.get('building') and t['building']!='no':out['buildings'].append(dict(f,kind=t['building'],height=number(t.get('height')),levels=number(t.get('building:levels')),roofShape=t.get('roof:shape'),roofHeight=number(t.get('roof:height')),tags=t))
  if t.get('highway'):out['roads'].append(dict(f,osmId=id,kind=t['highway'],surface=t.get('surface'),width=t.get('width'),bridge=t.get('bridge'),tunnel=t.get('tunnel'),layer=t.get('layer'),access=t.get('access'),foot=t.get('foot'),tags=t))
  if id not in members and any(k in t for k in ['natural','landuse','waterway','leisure']):out['landcover'].append(dict(f,kind=t.get('natural',t.get('landuse',t.get('waterway',t.get('leisure')))),tags=t))
  if t.get('waterway'):out['waterways'].append(dict(f,kind=t['waterway'],intermittent=t.get('intermittent'),seasonal=t.get('seasonal'),tags=t))
  if t.get('natural')=='coastline':out['coastlines'].append(f)
  if t.get('railway') in ['rail','disused','abandoned']:out['railways'].append(dict(f,kind=t['railway'],bridge=t.get('bridge'),layer=t.get('layer')))
 for id,t in nodeTags.items():
  if not inside(nodes[id]):continue
  if t.get('natural')=='tree':out['trees'].append(dict(id=id,coordinate=nodes[id],height=number(t.get('height')),leafType=t.get('leaf_type')))
  if t.get('tourism') or t.get('amenity') in ['shelter','bench','drinking_water'] or t.get('man_made') in ['tower','observation_tower']:out['places'].append(dict(id=id,coordinate=nodes[id],tags=t))
 (OUT/f'{key}-cartography.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
 print(key,'cartography',{k:len(v) for k,v in out.items() if isinstance(v,list)},flush=True)
 west,south=unproject(b['minX'],b['maxZ']);east,north=unproject(b['maxX'],b['minZ']);gb=dict(west=west,south=south,east=east,north=north);zoom=15
 def tile(lon,lat):return [(lon+180)/360*2**zoom,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**zoom]
 x0,y0=map(math.floor,tile(west,north));x1,y1=map(math.floor,tile(east,south))
 def download(pair):
  x,y=pair;p=CACHE/f'{zoom}-{x}-{y}.png'
  if not p.exists():p.write_bytes(urlopen(f'https://xyz-mdt.idee.es/1.0.0/raster-dem/{zoom}/{x}/{y}.png',timeout=50).read())
  rgb=np.asarray(Image.open(p).convert('RGB'),dtype=np.float64);return x,y,-10000+(rgb[:,:,0]*65536+rgb[:,:,1]*256+rgb[:,:,2])*.1
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:tiles={(x,y):a for x,y,a in pool.map(download,[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)])}
 size=next(iter(tiles.values())).shape[0];mosaic=np.zeros(((y1-y0+1)*size,(x1-x0+1)*size))
 for (x,y),a in tiles.items():mosaic[(y-y0)*size:(y-y0+1)*size,(x-x0)*size:(x-x0+1)*size]=a
 step=5;w=round((b['maxX']-b['minX'])/step)+1;h=round((b['maxZ']-b['minZ'])/step)+1
 xx,zz=np.meshgrid(np.linspace(b['minX'],b['maxX'],w),np.linspace(b['minZ'],b['maxZ'],h));lon=ORIGIN[0]+xx/FACTOR;lat=ORIGIN[1]-zz/111320
 px=((lon+180)/360*2**zoom-x0)*size;py=((1-np.arcsinh(np.tan(np.radians(lat)))/math.pi)/2*2**zoom-y0)*size
 ix=np.minimum(np.floor(px).astype(int),mosaic.shape[1]-2);iy=np.minimum(np.floor(py).astype(int),mosaic.shape[0]-2);fx=px-ix;fy=py-iy
 grid=(mosaic[iy,ix]*(1-fx)+mosaic[iy,ix+1]*fx)*(1-fy)+(mosaic[iy+1,ix]*(1-fx)+mosaic[iy+1,ix+1]*fx)*fy
 elev=dict(origin=ORIGIN,bounds=b,geographicBounds=gb,terrainShape=s,width=w,height=h,elevations=np.round(grid,1).ravel().tolist(),units='metres',source='IGN / CNIG · Modelo Digital de Elevaciones de España',source_url='https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png',source_product='PNOA-LiDAR MDT05',source_grid_spacing_m=5,source_zoom=zoom,source_tileSize=size,sample_spacing_m=dict(x=5,z=5),encoding='Mapbox Terrain RGB',sampling_note='Bilinear application samples at 5 m. Bare-earth terrain, not building elevations or a new survey of beach regeneration. Water surfaces have lower elevation reliability.',attribution='Obra derivada de MDT05 · © IGN/CNIG · CC BY 4.0',retrieved='2026-11-19',license_url='https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf')
 (OUT/f'{key}-elevation.json').write_text(json.dumps(elev,ensure_ascii=False,separators=(',',':')))
 print(key,'elevation',w,h,'range',round(float(grid.min()),2),round(float(grid.max()),2),flush=True)
 width=4096 if s['rx']>=s['rz'] else round(4096*s['rx']/s['rz']);height=4096 if s['rz']>=s['rx'] else round(4096*s['rz']/s['rx'])
 params=dict(service='WMS',version='1.3.0',request='GetMap',layers='OI.OrthoimageCoverage',styles='',crs='EPSG:4326',bbox=f'{south},{west},{north},{east}',width=width,height=height,format='image/jpeg');url='https://www.ign.es/wms-inspire/pnoa-ma?'+urlencode(params)
 pp=OUT/f'{key}-orthophoto.jpg'
 oldMeta=OUT/f'{key}-orthophoto.json'
 if not pp.exists() or not oldMeta.exists() or json.loads(oldMeta.read_text()).get('bounds')!=b:
  im=Image.open(io.BytesIO(urlopen(url,timeout=55).read()));im.load();im.save(pp,quality=91,optimize=True)
 (OUT/f'{key}-orthophoto.json').write_text(json.dumps(dict(source='PNOA Máxima Actualidad · IGN/CNIG',source_url=url,attribution='© PNOA · Instituto Geográfico Nacional',bounds=b,geographicBounds=gb,width=width,height=height,retrieved='2026-11-19',note='Download date is not flight date. Current beach/river morphology and seasonal water are not inferred from the service name.'),ensure_ascii=False,indent=2))
 print(key,'orthophoto',width,height,flush=True)
 return {k:config[k] for k in ['title','shape','core','coreStep','outerStep']}|{'bounds':b,'geographicBounds':gb,'id':key}

if __name__=='__main__':
 keys=sys.argv[1:] or list(REGIONS);metadata={}
 existing=OUT/'landscape-regions.json'
 if existing.exists():metadata=json.loads(existing.read_text())
 for key in keys:
  metadata[key]=acquire(key);existing.write_text(json.dumps(metadata,ensure_ascii=False,indent=2))
