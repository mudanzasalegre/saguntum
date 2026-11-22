"""Derive atlas context volumes from Catastro INSPIRE building parts.

Original GML remains a local source cache. The published derivative combines
simplified plan geometry, attributed floor counts, IGN height estimates and
atlas rendering; it is not official cadastral information.
"""
from pathlib import Path
from osgeo import ogr, osr
import json, math
ogr.UseExceptions();osr.UseExceptions()
BASE=Path(__file__).resolve().parents[1];OUT=BASE/'dist/assets/data'
cache=BASE/'research/terrain_tiles/catastro-sagunto'
cart=json.loads((OUT/'port-cartography.json').read_text());b=cart['bounds']
src=osr.SpatialReference();src.ImportFromEPSG(25830);src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
dst=osr.SpatialReference();dst.ImportFromEPSG(4326);dst.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
transform=osr.CoordinateTransformation(src,dst);reverse=osr.CoordinateTransformation(dst,src)
def project(lon,lat):return ((lon+.278)*111320*math.cos(math.radians(39.679)),(39.679-lat)*111320)
def unproject(x,z):return (-.278+x/(111320*math.cos(math.radians(39.679))),39.679-z/111320)
corner=[reverse.TransformPoint(*unproject(x,z))[:2] for x in (b['minX'],b['maxX']) for z in (b['minZ'],b['maxZ'])]
box=(min(x for x,y in corner),min(y for x,y in corner),max(x for x,y in corner),max(y for x,y in corner))
records=[];parent_geometries={};grid={}
def keys(env):
 for x in range(math.floor(env[0]/40),math.floor(env[1]/40)+1):
  for y in range(math.floor(env[2]/40),math.floor(env[3]/40)+1):yield(x,y)
ds=ogr.Open(str(cache/'A.ES.SDGC.BU.46222.building.gml'));layer=ds.GetLayer(0);layer.SetSpatialFilterRect(*box)
for feature in layer:
 geometry=feature.GetGeometryRef().Clone();id=feature.GetField('localId');parent_geometries[id]=geometry
 for key in keys(geometry.GetEnvelope()):grid.setdefault(key,[]).append(geometry)
ds=ogr.Open(str(cache/'A.ES.SDGC.BU.46222.buildingpart.gml'));layer=ds.GetLayer(0);layer.SetSpatialFilterRect(*box)
for feature in layer:
 floors=feature.GetField('numberOfFloorsAboveGround')
 if floors is None or floors<1:continue
 geometry=feature.GetGeometryRef().SimplifyPreserveTopology(.18)
 if geometry.GetArea()<4:continue
 source_id=feature.GetField('localId');geometry.Transform(transform)
 polygons=[geometry] if geometry.GetGeometryName()=='POLYGON' else [geometry.GetGeometryRef(i) for i in range(geometry.GetGeometryCount())]
 for n,poly in enumerate(polygons):
  ring=poly.GetGeometryRef(0)
  coords=[[round(ring.GetX(i),7),round(ring.GetY(i),7)] for i in range(ring.GetPointCount())]
  world=[project(*c) for c in coords]
  if not any(b['minX']<=x<=b['maxX'] and b['minZ']<=z<=b['maxZ'] for x,z in world):continue
  holes=[]
  for i in range(1,poly.GetGeometryCount()):
   r=poly.GetGeometryRef(i);holes.append([[round(r.GetX(j),7),round(r.GetY(j),7)] for j in range(r.GetPointCount())])
  records.append(dict(id=f'cat-{source_id}-{n}',coordinates=coords,holes=holes,kind='yes',height=None,levels=floors,roofShape='flat',source='Atlas volume derived from DGC INSPIRE BU building part',sourceDate='2026-08-21'))
remaining=[]
for old in cart['buildings']:
 if str(old['id']).startswith('cat-'):continue
 coords=old['coordinates'];lon=sum(p[0] for p in coords)/len(coords);lat=sum(p[1] for p in coords)/len(coords);x,y,_=reverse.TransformPoint(lon,lat)
 point=ogr.Geometry(ogr.wkbPoint);point.AddPoint_2D(x,y)
 if not any(g.Contains(point) for g in grid.get((math.floor(x/40),math.floor(y/40)),[])):remaining.append(old)
cart['buildings']=records+remaining
cart['buildingFootprintProvenance']=dict(source='Dirección General del Catastro · INSPIRE Buildings, Sagunto/Sagunt',source_url='https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip',metadata_date='2026-08-21',retrieved='2026-11-19',license_url='https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf',derived_parts=len(records),additional_osm_buildings=len(remaining),method='Building parts with at least one above-ground floor; topology-preserving simplification at 0.18 m; reprojection to WGS84; 7-decimal coordinate rounding; preserved courtyard rings; merge with non-overlapping OSM context. Rendered heights combine IGN normalized surface estimates and floor counts; exterior details are interpretive.',note='Transformed atlas product; not an official cadastral map or a current architectural survey.')
(OUT/'port-cartography.json').write_text(json.dumps(cart,ensure_ascii=False,separators=(',',':')))
(OUT/'port-building-footprints.json').write_text(json.dumps(cart['buildingFootprintProvenance'],ensure_ascii=False,indent=2))
print('Derived above-ground parts',len(records),'OSM additional',len(remaining),'parents',len(parent_geometries),'holes',sum(bool(r['holes']) for r in records),flush=True)
