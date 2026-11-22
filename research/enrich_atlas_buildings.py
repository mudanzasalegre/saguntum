"""Complete region building volumes using transformed Catastro INSPIRE parts.

Reads official province Atom feeds, keeps parent geometry and courtyard holes,
and adds parent fallbacks only where no above-ground parts exist. Original GML
is a local cache. Published shapes are a derived atlas product, not official
cadastral cartography. Roof colours are approximate PNOA samples, not facades.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlparse,quote
import xml.etree.ElementTree as ET
import json,math,sys,zipfile,io
import numpy as np
from PIL import Image
from osgeo import ogr,osr
ogr.UseExceptions();osr.UseExceptions()
BASE=Path(__file__).resolve().parents[1];OUT=BASE/'dist/assets/data';CACHE=BASE/'research/terrain_tiles'
MUNICIPALITIES={'46222':('46','Sagunto/Sagunt'),'46084':('46','Canet d’en Berenguer'),'46207':('46','Puçol'),'12011':('12','Almenara')}
src=osr.SpatialReference();src.ImportFromEPSG(25830);src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
dst=osr.SpatialReference();dst.ImportFromEPSG(4326);dst.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
toWgs=osr.CoordinateTransformation(src,dst);toUtm=osr.CoordinateTransformation(dst,src)
factor=111320*math.cos(math.radians(39.679))
def project(c):return ((c[0]+.278)*factor,(39.679-c[1])*111320)
def unproject(x,z):return (-.278+x/factor,39.679-z/111320)
def keys(env,size=40):
 for x in range(math.floor(env[0]/size),math.floor(env[1]/size)+1):
  for y in range(math.floor(env[2]/size),math.floor(env[3]/size)+1):yield(x,y)
def sources():
 result={}
 for code,(province,name) in MUNICIPALITIES.items():
  folder=CACHE/('catastro-sagunto' if code=='46222' else f'catastro-{code}');folder.mkdir(exist_ok=True)
  feed=CACHE/f'catastro-feed-{province}.xml'
  if not feed.exists():feed.write_bytes(urlopen(f'https://www.catastro.hacienda.gob.es/INSPIRE/buildings/{province}/ES.SDGC.bu.atom_{province}.xml',timeout=55).read())
  tree=ET.parse(feed);entries=[e for e in tree.getroot() if e.tag.endswith('entry')]
  chosen=next(e for e in entries if any(code in (x.text or '') for x in e if x.tag.endswith('title')))
  url=quote(next(x.get('href') for x in chosen if x.tag.endswith('link') and x.get('href','').lower().endswith('.zip')).replace('http://','https://'),safe=':/%')
  if not (folder/f'A.ES.SDGC.BU.{code}.buildingpart.gml').exists():
   raw=urlopen(url,timeout=55).read();z=zipfile.ZipFile(io.BytesIO(raw))
   for item in z.infolist():
    if Path(item.filename).name==item.filename: (folder/item.filename).write_bytes(z.read(item))
  metadata=folder/f'A.ES.SDGC.BU.MD.{code}.xml';date=None
  if metadata.exists():
   mt=ET.parse(metadata)
   for el in mt.getroot().iter():
    if el.tag.endswith('dateStamp'):
     date=next((x.text for x in el.iter() if x.text and x.text.strip()),None);break
  result[code]={'folder':folder,'url':url,'metadataDate':date,'name':name}
 return result
def enrich(prefix,allSources):
 p=OUT/f'{prefix}cartography.json';data=json.loads(p.read_text());b=data['bounds'];corners=[toUtm.TransformPoint(*unproject(x,z))[:2] for x in (b['minX'],b['maxX']) for z in (b['minZ'],b['maxZ'])];box=(min(x for x,y in corners),min(y for x,y in corners),max(x for x,y in corners),max(y for x,y in corners))
 parentData={};parentGrid={};usedParents=set();records=[];provenance=[]
 def addGeometry(geometry,id,levels,code,parent):
  geometry=geometry.SimplifyPreserveTopology(.18)
  if geometry.GetArea()<4:return
  geometry.Transform(toWgs)
  polys=[geometry] if geometry.GetGeometryName()=='POLYGON' else [geometry.GetGeometryRef(i) for i in range(geometry.GetGeometryCount())]
  for n,poly in enumerate(polys):
   if poly.GetGeometryName()!='POLYGON':continue
   coords=[list(x[:2]) for x in poly.GetGeometryRef(0).GetPoints()];world=[project(c) for c in coords]
   if not any(b['minX']<=x<=b['maxX'] and b['minZ']<=z<=b['maxZ'] for x,z in world):continue
   holes=[[[round(x,7),round(y,7)] for x,y,*rest in poly.GetGeometryRef(i).GetPoints()] for i in range(1,poly.GetGeometryCount())]
   records.append(dict(id=f'cat-{id}-{n}',parentId=parent,municipality=code,coordinates=[[round(x,7),round(y,7)] for x,y in coords],holes=holes,kind='yes',height=None,levels=levels,roofShape=None,source='Atlas volume derived from DGC INSPIRE building geometry',sourceDate=allSources[code]['metadataDate']))
 for code,source in allSources.items():
  folder=source['folder'];ds=ogr.Open(str(folder/f'A.ES.SDGC.BU.{code}.building.gml'));layer=ds.GetLayer(0);layer.SetSpatialFilterRect(*box);count=0
  for f in layer:
   g=f.GetGeometryRef().Clone();id=f.GetField('localId');parentData[(code,id)]=(g,f.GetField('numberOfFloorsAboveGround') if f.GetFieldIndex('numberOfFloorsAboveGround')>=0 else None)
   count+=1
  if not count:continue
  provenance.append({'municipality':source['name'],'code':code,'source_url':source['url'],'metadata_date':source['metadataDate']})
  ds=ogr.Open(str(folder/f'A.ES.SDGC.BU.{code}.buildingpart.gml'));layer=ds.GetLayer(0);layer.SetSpatialFilterRect(*box)
  for f in layer:
   levels=f.GetField('numberOfFloorsAboveGround')
   if not levels or levels<1:continue
   id=f.GetField('localId');parent=id.split('_part')[0];g=f.GetGeometryRef().Clone();usedParents.add((code,parent));addGeometry(g,id,levels,code,parent)
 for (code,id),(g,levels) in parentData.items():
  if (code,id) not in usedParents:addGeometry(g.Clone(),id+'_parent',levels if levels and levels>0 else None,code,id)
 # Index only rendered-derived parents, so an empty/underground parent never
 # suppresses the sole useful OSM footprint.
 renderedParents={(r['municipality'],r['parentId']) for r in records}
 for key,(g,levels) in parentData.items():
  if key in renderedParents:
   for cell in keys(g.GetEnvelope()):parentGrid.setdefault(cell,[]).append(g)
 remaining=[]
 for old in data['buildings']:
  if str(old['id']).startswith('cat-'):continue
  cs=old['coordinates'];lon=sum(c[0] for c in cs)/len(cs);lat=sum(c[1] for c in cs)/len(cs);x,y,_=toUtm.TransformPoint(lon,lat);point=ogr.Geometry(ogr.wkbPoint);point.AddPoint_2D(x,y)
  if not any(g.Intersects(point) for g in parentGrid.get((math.floor(x/40),math.floor(y/40)),[])):remaining.append(old)
 previous={str(v['id']):v for v in data['buildings']}
 for r in records:
  old=previous.get(r['id'],{})
  for key,value in old.items():
   if key.startswith('surfaceHeight'):r[key]=value
 data['buildings']=records+remaining
 # Derive a subdued roof palette from PNOA pixels inside each footprint. A
 # sample is not a classification of roof slope or present construction state.
 imagePath=OUT/f'{prefix}orthophoto.jpg';metaPath=OUT/f'{prefix}orthophoto.json';coloured=0
 if imagePath.exists() and metaPath.exists():
  image=np.asarray(Image.open(imagePath).convert('RGB'));height,width=image.shape[:2];meta=json.loads(metaPath.read_text());pb=meta.get('bounds',b)
  for r in data['buildings']:
   q=np.asarray([project(c) for c in r['coordinates']]);x0=max(0,math.floor((q[:,0].min()-pb['minX'])/(pb['maxX']-pb['minX'])*width));x1=min(width,math.ceil((q[:,0].max()-pb['minX'])/(pb['maxX']-pb['minX'])*width));y0=max(0,math.floor((q[:,1].min()-pb['minZ'])/(pb['maxZ']-pb['minZ'])*height));y1=min(height,math.ceil((q[:,1].max()-pb['minZ'])/(pb['maxZ']-pb['minZ'])*height))
   if x1<=x0 or y1<=y0:continue
   xx,yy=np.meshgrid(pb['minX']+(np.arange(x0,x1)+.5)/width*(pb['maxX']-pb['minX']),pb['minZ']+(np.arange(y0,y1)+.5)/height*(pb['maxZ']-pb['minZ']));mask=np.zeros(xx.shape,dtype=bool);j=len(q)-1
   for i in range(len(q)):
    if q[i,1]!=q[j,1]:mask^=((q[i,1]>yy)!=(q[j,1]>yy))&(xx<(q[j,0]-q[i,0])*(yy-q[i,1])/(q[j,1]-q[i,1])+q[i,0])
    j=i
   values=image[y0:y1,x0:x1][mask].astype(float)
   if len(values)<3:continue
   luma=values.mean(axis=1);values=values[(luma>45)&(luma<245)&~((values[:,1]>values[:,0]*1.18)&(values[:,1]>values[:,2]*1.08))]
   if len(values)<3:continue
   rgb=np.median(values,axis=0);rgb=np.clip(rgb*.75+np.array([184,177,160])*.25,60,225).round().astype(int)
   r['roofColor']='#'+''.join(f'{v:02x}' for v in rgb);r['roofColorSource']='PNOA footprint median, visually moderated; flight date unverified';coloured+=1
 data['buildingFootprintProvenance']={'source':'Dirección General del Catastro · INSPIRE Buildings','sources':provenance,'source_url':'https://www.catastro.hacienda.gob.es/webinspire/','retrieved':'2026-11-19','license_url':'https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf','derived_parts':len(records),'additional_osm_buildings':len(remaining),'parent_fallbacks':sum('_parent-' in r['id'] for r in records),'roof_color_samples':coloured,'method':'Above-ground building parts; parent fallbacks when no usable part exists; topology-preserving simplification 0.18 m; preserved courtyard holes; WGS84 coordinates; non-overlapping OSM complement. Elevation uses source heights, normalized surface estimates, floor counts or a marked visual fallback.','note':'Derived atlas product, not official cadastral information or a current facade survey.'}
 p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));(OUT/f'{prefix}building-footprints.json').write_text(json.dumps(data['buildingFootprintProvenance'],ensure_ascii=False,indent=2))
 print(prefix or 'sagunto','parts',len(records),'OSM',len(remaining),'roof colours',coloured,flush=True)
if __name__=='__main__':
 allSources=sources()
 for key in sys.argv[1:] or ['sagunto','port','coast','marjal','almarda','palancia']:enrich('' if key=='sagunto' else key+'-',allSources)
