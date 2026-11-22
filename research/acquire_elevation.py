import urllib.request, urllib.parse, math, pathlib, concurrent.futures,json,io
from PIL import Image
import numpy as np
BASE=pathlib.Path('/workspace/sites/saguntum-atlas')
DIR=BASE/'research/terrain_tiles';DIR.mkdir(exist_ok=True)
OUT=BASE/'dist/assets/data'
origin=[-.278,39.679]
bounds={'minX':-950,'maxX':1100,'minZ':-850,'maxZ':1100}
def unproject(x,z):return [origin[0]+x/(111320*math.cos(math.radians(origin[1]))),origin[1]-z/111320]
west,south=unproject(bounds['minX'],bounds['maxZ']);east,north=unproject(bounds['maxX'],bounds['minZ'])
def tile(lon,lat,z):return [(lon+180)/360*2**z,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z]
z=15
x0,y0=map(math.floor,tile(west,north,z));x1,y1=map(math.floor,tile(east,south,z))
urls=[(x,y,f'https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png') for x in range(x0,x1+1) for y in range(y0,y1+1)]
def fetch(t):
 x,y,u=t;p=DIR/f'{z}-{x}-{y}.png'
 if not p.exists():p.write_bytes(urllib.request.urlopen(u,timeout=45).read())
 a=np.asarray(Image.open(p).convert('RGB'),dtype=np.float64)
 h=-10000+(a[:,:,0]*65536+a[:,:,1]*256+a[:,:,2])*.1
 print('tile',x,y,h.shape,round(float(h.min()),1),round(float(h.max()),1),flush=True)
 return (x,y,h)
tiles={}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as e:
 for x,y,h in e.map(fetch,urls):tiles[(x,y)]=h
size=next(iter(tiles.values())).shape[0]
mosaic=np.zeros(((y1-y0+1)*size,(x1-x0+1)*size))
for (x,y),a in tiles.items():mosaic[(y-y0)*size:(y-y0+1)*size,(x-x0)*size:(x-x0+1)*size]=a
def sample(lon,lat):
 tx,ty=tile(lon,lat,z);px=(tx-x0)*size;py=(ty-y0)*size
 ix,iy=int(px),int(py);fx=px-ix;fy=py-iy
 return (mosaic[iy,ix]*(1-fx)+mosaic[iy,ix+1]*fx)*(1-fy)+(mosaic[iy+1,ix]*(1-fx)+mosaic[iy+1,ix+1]*fx)*fy
w=h=257
data=[round(sample(*unproject(bounds['minX']+(bounds['maxX']-bounds['minX'])*i/(w-1),bounds['minZ']+(bounds['maxZ']-bounds['minZ'])*j/(h-1))),1) for j in range(h) for i in range(w)]
out={'origin':origin,'bounds':bounds,'geographicBounds':{'west':west,'south':south,'east':east,'north':north},'width':w,'height':h,'elevations':data,'units':'metres','source':'IGN / CNIG · Modelo Digital de Elevaciones de España','source_url':'https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png','source_zoom':15,'source_tileSize':size,'encoding':'Mapbox Terrain RGB','sampling':'bilinear raster sampling; row 0 north (minZ), column 0 west (minX)','attribution':'© Instituto Geográfico Nacional / CNIG','retrieved':'2026-11-19','license_url':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'}
(OUT/'elevation.json').write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False))
print('ELEVATION READY',min(data),max(data),'theatre',sample(-.278,39.67689),'castle',sample(-.279,39.6761),flush=True)
params={'service':'WMS','version':'1.3.0','request':'GetMap','layers':'OI.OrthoimageCoverage','styles':'','crs':'EPSG:4326','bbox':f'{south},{west},{north},{east}','width':2048,'height':1948,'format':'image/jpeg'}
u='https://www.ign.es/wms-inspire/pnoa-ma?'+urllib.parse.urlencode(params)
try:
 d=urllib.request.urlopen(u,timeout=60).read();im=Image.open(io.BytesIO(d));im.save(OUT/'orthophoto.jpg',quality=90)
 (OUT/'orthophoto.json').write_text(json.dumps({'source':'PNOA Máxima Actualidad · IGN/CNIG','source_url':u,'attribution':'© PNOA · Instituto Geográfico Nacional','geographicBounds':out['geographicBounds'],'bounds':bounds,'width':2048,'height':1948,'retrieved':'2026-11-19','note':'Date of capture varies by source mosaic; this is retrieval date, not capture date.'},ensure_ascii=False,indent=2))
 print('ORTHOPHOTO READY',im.size,len(d),flush=True)
except Exception as e:print('ORTHOPHOTO ERROR',repr(e),flush=True)
