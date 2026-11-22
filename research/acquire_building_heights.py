"""Add LiDAR-derived normalized roof-height estimates without replacing OSM tags.

Run with /usr/bin/python3 (GDAL and numpy are part of the managed image).
Source: IGN WCS MDSnE2.5, first PNOA-LiDAR coverage. This provides approximate
roof heights relative to ground; it is not a current facade or eaves survey.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode
import json, math, sys
import numpy as np
from osgeo import gdal, osr
gdal.UseExceptions();osr.UseExceptions()
BASE=Path(__file__).resolve().parents[1]
OUT=BASE/'dist/assets/data';CACHE=BASE/'research/terrain_tiles'
prefix=(sys.argv[sys.argv.index('--region')+1]+'-') if '--region' in sys.argv else 'coast-' if '--coast' in sys.argv else 'port-' if '--port' in sys.argv else ''
src=osr.SpatialReference();src.ImportFromEPSG(4326);src.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
dst=osr.SpatialReference();dst.ImportFromEPSG(25830);dst.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
transform=osr.CoordinateTransformation(src,dst)
e=json.loads((OUT/f'{prefix}elevation.json').read_text());b=e['geographicBounds']
corners=[transform.TransformPoint(x,y) for x in (b['west'],b['east']) for y in (b['south'],b['north'])]
xmin=min(p[0] for p in corners)-15;xmax=max(p[0] for p in corners)+15
ymin=min(p[1] for p in corners)-15;ymax=max(p[1] for p in corners)+15
params=[('service','WCS'),('version','2.0.1'),('request','GetCoverage'),('coverageId','mdsn_e025'),('subset',f'x({xmin:.3f},{xmax:.3f})'),('subset',f'y({ymin:.3f},{ymax:.3f})'),('format','image/tiff')]
url='https://wcs-mds.idee.es/mds?'+urlencode(params)
path=CACHE/('mdsn_e025_puerto.tif' if prefix=='port-' else f'mdsn_e025_{prefix[:-1]}.tif' if prefix else 'mdsn_e025_sagunto.tif')
if not path.exists():
    raw=urlopen(url,timeout=55).read()
    if raw[:1]==b'<':raise RuntimeError(raw[:2000].decode())
    path.write_bytes(raw)
ds=gdal.Open(str(path));a=ds.GetRasterBand(1).ReadAsArray();gt=ds.GetGeoTransform()
assert gt[2]==gt[4]==0 and gt[1]>0 and gt[5]<0,gt
valid=a[(a>=0)&(a<150)]
assert valid.size>100 and valid.max()>5,'Coverage has no plausible building heights'
print('Raster',a.shape,'height range',float(valid.min()),float(valid.max()),'transform',gt,flush=True)
def sample_polygon(coords):
    if len(coords)<3:return None
    p=np.asarray([transform.TransformPoint(*c)[:2] for c in coords])
    x0=max(0,int(math.floor((p[:,0].min()-gt[0])/gt[1])));x1=min(a.shape[1],int(math.ceil((p[:,0].max()-gt[0])/gt[1]))+1)
    y0=max(0,int(math.floor((p[:,1].max()-gt[3])/gt[5])));y1=min(a.shape[0],int(math.ceil((p[:,1].min()-gt[3])/gt[5]))+1)
    if x0>=x1 or y0>=y1:return None
    xx,yy=np.meshgrid(gt[0]+(np.arange(x0,x1)+.5)*gt[1],gt[3]+(np.arange(y0,y1)+.5)*gt[5])
    mask=np.zeros(xx.shape,dtype=bool)
    j=len(p)-1
    for i in range(len(p)):
        xi,yi=p[i];xj,yj=p[j]
        if yi!=yj:mask^=((yi>yy)!=(yj>yy))&(xx<(xj-xi)*(yy-yi)/(yj-yi)+xi)
        j=i
    values=a[y0:y1,x0:x1][mask];count=values.size
    values=values[(values>1.5)&(values<70)]
    if values.size<3 or values.size/max(1,count)<.45:return None
    return {'surfaceHeightEstimate':round(float(np.percentile(values,60)),1),'surfaceHeightP95':round(float(np.percentile(values,95)),1),'surfaceHeightSamples':int(values.size),'surfaceHeightCoverage':round(values.size/count,2),'surfaceHeightSource':'IGN MDSnE2.5 · first PNOA-LiDAR coverage; 60th percentile of positive raster samples inside mapped footprint'}
cp=OUT/f'{prefix}cartography.json';cartography=json.loads(cp.read_text());n=0
for item in cartography['buildings']:
    result=sample_polygon(item['coordinates'])
    if result:item.update(result);n+=1
cartography['surfaceHeightProvenance']={'source':'IGN / CNIG · MDSnE2.5, normalized building surface model','source_url':url,'coverage_id':'mdsn_e025','source_grid_spacing_m':2.5,'service_pixel_spacing_m':gt[1],'retrieved':'2026-11-19','source_period':'First PNOA-LiDAR coverage; individual flight date not verified','documentation_url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license_url':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf','method':'60th percentile of positive height-above-ground raster cells centered inside each mapped footprint; require at least3 valid samples and45% positive coverage. OSM height/levels untouched. Small/unmatched buildings retain renderer fallback.','estimated_buildings':n,'caution':'Raster-derived roof-height estimates; not measured facade/eaves heights and not verified current as-built condition.'}
cp.write_text(json.dumps(cartography,ensure_ascii=False,separators=(',',':')))
if not prefix:
    lp=OUT/'landmarks.json';landmarks=json.loads(lp.read_text())
    for s in landmarks['sites']:
        result=sample_polygon(s['footprint'])
        if result:s['surfaceHeightReference']=result
        if s.get('towerFootprint'):s['towerSurfaceHeightReference']=sample_polygon(s['towerFootprint'])
    lp.write_text(json.dumps(landmarks,ensure_ascii=False,indent=2))
(OUT/f'{prefix}building-height-provenance.json').write_text(json.dumps(cartography['surfaceHeightProvenance'],ensure_ascii=False,indent=2))
print('Building heights:',n,'of',len(cartography['buildings']),flush=True)
if not prefix:print('Landmarks:',[(s['id'],s.get('surfaceHeightReference'),s.get('towerSurfaceHeightReference')) for s in landmarks['sites']],flush=True)
