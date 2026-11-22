"""Water surfaces from mapped polygons, with seasonal and survey limits.

Palancia riverbank polygons describe a channel, not permanent open water.
Only explicit pools and the documented PNOA delta patch are filled there.
Water elevations are DEM-derived display estimates, never live measurements.
"""
from pathlib import Path
import math,json,sys
import numpy as np
from osgeo import ogr
ogr.UseExceptions();BASE=Path(__file__).resolve().parents[1];OUT=BASE/'dist/assets/data';F=111320*math.cos(math.radians(39.679))
def project(c):return [(c[0]+.278)*F,(39.679-c[1])*111320]
def unproject(c):return [round(-.278+c[0]/F,7),round(39.679-c[1]/111320,7)]
def polygon(outer,holes=[]):
 p=ogr.Geometry(ogr.wkbPolygon)
 for coords in [outer]+holes:
  r=ogr.Geometry(ogr.wkbLinearRing)
  for x,z in coords:r.AddPoint_2D(x,z)
  r.CloseRings();p.AddGeometry(r)
 return p.Buffer(0)
def shapes(geometry):
 if geometry.IsEmpty():return []
 if geometry.GetGeometryName()=='POLYGON':return[geometry]
 if geometry.GetGeometryName() in ['MULTIPOLYGON','GEOMETRYCOLLECTION']:return[g for i in range(geometry.GetGeometryCount()) for g in shapes(geometry.GetGeometryRef(i))]
 return[]
def rings(g):return[[unproject(v[:2]) for v in g.GetGeometryRef(i).GetPoints()] for i in range(g.GetGeometryCount())]
def join(lines):
 pending=[x[:] for x in lines];out=[]
 while pending:
  line=pending.pop()
  while True:
   matched=False
   for i,p in enumerate(pending):
    if line[-1]==p[0]:line+=p[1:]
    elif line[-1]==p[-1]:line+=p[-2::-1]
    elif line[0]==p[-1]:line=p[:-1]+line
    elif line[0]==p[0]:line=p[:0:-1]+line
    else:continue
    pending.pop(i);matched=True;break
   if not matched:break
  if line[0][1]>line[-1][1]:line.reverse()
  out.append(line)
 return sorted(out,key=lambda x:x[0][1])
def build(key):
 cart=json.loads((OUT/f'{key}-cartography.json').read_text());dem=json.loads((OUT/f'{key}-elevation.json').read_text());s=cart['terrainShape'];b=dem['bounds'];a=np.asarray(dem['elevations']).reshape(dem['height'],dem['width'])
 def height(c):
  x,z=project(c);ix=np.clip(round((x-b['minX'])/(b['maxX']-b['minX'])*(dem['width']-1)),0,dem['width']-1);iz=np.clip(round((z-b['minZ'])/(b['maxZ']-b['minZ'])*(dem['height']-1)),0,dem['height']-1);return float(a[iz,ix])
 crop=polygon([[s['cx']+s['rx']*math.cos(t*math.tau/1024),s['cz']+s['rz']*math.sin(t*math.tau/1024)] for t in range(1024)])
 chains=join([w['coordinates'] for w in cart['coastlines']]);coast=[]
 for chain in chains:coast.extend(chain[1:] if coast and coast[-1]==chain[0] else chain)
 surfaces=[]
 if coast:
  edge=s['cx']+s['rx']+10000;cs=[project(c) for c in coast];sea=polygon(cs+[[edge,cs[-1][1]],[edge,cs[0][1]]]).Intersection(crop)
  for i,g in enumerate(shapes(sea)):
   rs=rings(g);surfaces.append(dict(id=f'ocean-{i}',kind='sea',outer=rs[0],holes=rs[1:],levelM=.08,depthM=2.5,areaM2=round(g.GetArea()),basis='OSM coastline clipped to the atlas crop; shoreline may predate 2026 beach works.'))
 candidates=[]
 for p in cart['landcover']:
  t=p.get('tags',{});cs=p['coordinates']
  if p['kind']!='water' or len(cs)<4 or cs[0]!=cs[-1] or t.get('water') in ['moat','wastewater','river'] or t.get('intermittent')=='yes':continue
  candidates.append(dict(id='osm-'+p['id'],outer=cs,holes=p.get('holes',[]),label=p.get('name'),kind=t.get('water','pond'),basis='Open water polygon mapped in OSM. Surface and level are not live hydrological observations.'))
 recordPath=OUT/({'marjal':'landscape-marjal','almarda':'landscape-dunes','palancia':'landscape-palancia'}[key]+'.json')
 if recordPath.exists():
  records=json.loads(recordPath.read_text())
  for site in records.get('sites',[]):candidates+=site.get('survey',{}).get('waterPolygons',[])
 for p in candidates:
  g=polygon([project(c) for c in p['outer']],[[project(c) for c in h] for h in p.get('holes',[])]).Intersection(crop)
  for i,g in enumerate(shapes(g)):
   if g.GetArea()<12:continue
   rs=rings(g);samples=[height(c) for c in rs[0]];level=p.get('levelM',round(max(.12,float(np.percentile(samples,25))-.12),2))
   surfaces.append(dict(p,id=p['id']+f'-{i}',kind=p.get('kind','lagoon'),outer=rs[0],holes=rs[1:],levelM=level,depthM=.65,areaM2=round(g.GetArea())))
 result=dict(region=key,source='OSM polygons and explicitly attributed PNOA traces',retrieved='2026-11-19',coastline=coast,surfaces=surfaces,polygons=[{'outer':p['outer'],'holes':p['holes']} for p in surfaces],waterLevelM=.08,levelNote='Lagoon/pool levels estimated from the lower quartile of DEM boundary samples; sea display datum 0.08 m. Water extent is a cartographic reading, not current or constant inundation.',seabedNote='Display-only depression below opaque water; no measured bathymetry. Original IGN raster retained unchanged.',excludedKinds=['moat','wastewater','river','intermittent=yes'])
 (OUT/f'{key}-water.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')));print(key,[(p['id'],p['areaM2'],p['levelM']) for p in surfaces],flush=True)
if __name__=='__main__':
 for key in sys.argv[1:] or ['marjal','almarda','palancia']:build(key)
