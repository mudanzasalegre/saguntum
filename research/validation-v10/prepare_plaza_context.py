"""Derive Plaça Major context without replacing the retained Santa María layer."""
from pathlib import Path
import json,math
from shapely.geometry import Polygon,LineString,box
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2]; DATA=ROOT/'dist/assets/data'
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
carto,landmarks,sm=read('cartography'),read('landmarks'),read('santa-maria-context')
t=(ROOT/'dist/js/heritage-civic-data.js').read_text();civic=json.loads(t[t.index('=')+1:].strip().rstrip(';'))
scale=111320*math.cos(math.radians(39.679))
project=lambda c:((c[0]+.278)*scale,(39.679-c[1])*111320)
geographic=lambda p:[round(-.278+p[0]/scale,9),round(39.679-p[1]/111320,9)]
poly=lambda b:Polygon([project(c)for c in b['coordinates']],[[project(c)for c in h]for h in b.get('holes',[])]).buffer(0)
core_source=list(civic['plaza'])
for parent,number in [('3459611YJ3935H',17),('3459612YJ3935G',16)]:
 parts=[b for b in carto['buildings']if b.get('parentId')==parent]
 shape=unary_union([poly(b)for b in parts]);pieces=list(shape.geoms)if hasattr(shape,'geoms')else[shape]
 # The easternmost narrow component faces the square. The detached rear body
 # is preserved separately instead of closing the mapped gap with a hull.
 pieces.sort(key=lambda q:q.centroid.x,reverse=True);front=pieces[0]
 core_source.append({'id':'core-'+parent,'coordinates':[geographic(v)for v in front.exterior.coords],'holes':[[geographic(v)for v in ring.coords]for ring in front.interiors],
   'secondaryFootprints':[{'coordinates':[geographic(v)for v in q.exterior.coords],'holes':[[geographic(v)for v in ring.coords]for ring in q.interiors]}for q in pieces[1:]],
   'kind':'yes','parentId':parent,'address':'Plaça Major '+str(number),'levels':max(b.get('levels')or 0 for b in parts),
   'surfaceHeightEstimate':max((b.get('surfaceHeightEstimate')or 0)for b in parts),
   'source':'Catastro INSPIRE Buildings; union of source parts, keeping disjoint components and holes.',
   'catalogueReference':{'source':'Municipal PEP catalogue, volume I','pdfPage':133 if number==17 else 134,'addressNumber':number,'block':'34596','parcel':'11'if number==17 else'12'}})
core_shape=lambda b:unary_union([poly(b),*[poly(q)for q in b.get('secondaryFootprints',[])]])
core_union=unary_union([core_shape(b)for b in core_source])
protected=[{'id':b['id'],'coordinates':b['coordinates'],'holes':b.get('holes',[]),'owner':'santa-maria'}for b in sm['buildings']]
protected += [{'id':s['id'],'coordinates':s['footprint'],'owner':'existing-monument'}for s in landmarks['sites']if s.get('footprint') and s['id']!='plaza-mayor']
protected += [{'id':b['id'],'coordinates':b['coordinates'],'owner':'juderia'}for b in civic['juderia']]
protected_union=unary_union([poly(b)for b in protected])
cat=[(b,poly(b))for b in carto['buildings']if b.get('parentId')]
coreBuildings=[];core_ids=set();matched=[]
for b in core_source:
 shape=core_shape(b);parts=[]
 for source,q in cat:
  if b.get('parentId') and source.get('parentId')!=b['parentId']:continue
  overlap=q.intersection(shape).area
  if overlap>.45:
   row=dict(source);row['overlapWithCoreM2']=round(overlap,3);parts.append(row);core_ids.add(str(source['id']))
 row=dict(b);row['cadastralParts']=parts;row['cadastralParentIds']=sorted({p['parentId']for p in parts});row['roofColor']=max(parts,key=lambda p:p['overlapWithCoreM2']).get('roofColor','#b8a58e') if parts else '#b8a58e';row['coreSide']='west' if b['id'].startswith('core-') or int(b['id'])<844866520 else 'east';coreBuildings.append(row)
 matched.append({'osmId':b['id'],'partCount':len(parts),'parents':row['cadastralParentIds'],'areaM2':round(shape.area,3)})
selection=core_union.buffer(24)
buildings=[]
for b,q in cat:
 if q.distance(core_union)>=24 or str(b['id']) in core_ids or q.intersection(core_union).area>1 or q.intersection(protected_union).area>.25:continue
 row=dict(b);c=q.centroid
 row['contextComponent']='plaza-caserio-norte' if c.y<-68 else 'plaza-caserio-este' if c.x>-38 else 'plaza-caserio-oeste'
 buildings.append(row)
selected_union=unary_union([poly(b)for b in buildings]);new_ids={str(b['id'])for b in buildings}
duplicates=[]
for b in carto['buildings']:
 if str(b['id']).startswith('cat-'):continue
 q=poly(b)
 if q.area and q.intersection(unary_union([core_union,selected_union])).area/q.area>.7:duplicates.append(str(b['id']))
core_ids.update(str(b['id'])for b in coreBuildings)
# The main square is the northern part of a larger OSM pedestrian area which
# also covers approaches to Carrer del Castell. The cut is explicitly derived.
source_square=next(r for r in carto['squares']if str(r['id'])=='733042234')
main=poly(source_square).intersection(box(-1000,-1000,1000,project([0,39.679225])[1]))
plazaOutline=[geographic(v)for v in main.exterior.coords]
protected_surfaces=[]
for s in sm.get('surfaces',[]):protected_surfaces.append(poly(s))
defaults={'residential':4.5,'living_street':3.4,'pedestrian':3.1,'footway':1.6,'steps':1.4}
for r in sm.get('roads',[]):
 if r.get('area')=='yes':continue
 protected_surfaces.append(LineString([project(c)for c in r['coordinates']]).buffer(defaults.get(r.get('kind'),2)/2,cap_style=2))
protected_paving=unary_union(protected_surfaces)
# Original mapped surfaces are clipped only against existing monument/context
# surfaces, never moved to invent a square edge or enlarge a passage.
surfaces=[]
for source_id,component in [('733042234','plaza-pavimento'),('733042235','plaza-peixateria')]:
 src=next(r for r in carto['squares']if str(r['id'])==source_id);shape=poly(src).difference(protected_paving).difference(protected_union)
 for i,q in enumerate(shape.geoms if hasattr(shape,'geoms')else[shape]):
  if q.area<.15:continue
  surfaces.append({'id':component+'-'+str(i),'component':component,'coordinates':[geographic(v)for v in q.exterior.coords],'holes':[[geographic(v)for v in ring.coords]for ring in q.interiors],'sourceId':source_id,'derived':True,'derivation':'Source OSM area minus retained Santa María pavement and monument footprints.'})
road_specs={'22922647':'plaza-pavimento','441656289':'plaza-pavimento','1365045248':'plaza-pavimento','1365045250':'plaza-carrer-major','1365045249':'plaza-carrer-major','1365045251':'plaza-peixateria','1365045255':'plaza-vila','163609168':'plaza-carrer-castell','1365045239':'plaza-carrer-castell','1365045227':'plaza-carrer-major'}
roads=[];replace_ids=set(['733042234','733042235'])
for r in carto['roads']:
 if str(r['id'])not in road_specs:continue
 line=LineString([project(c)for c in r['coordinates']]);clipped=line.intersection(selection.buffer(7))
 if clipped.is_empty:continue
 fully=line.difference(selection.buffer(7)).length<.02
 if fully:replace_ids.add(str(r['id']))
 for i,g in enumerate(clipped.geoms if hasattr(clipped,'geoms')else[clipped]):
  if g.geom_type!='LineString' or g.length<.2:continue
  row=dict(r);row['sourceId']=str(r['id']);row['id']=str(r['id'])+(('-fragment-'+str(i))if not fully else '');row['coordinates']=[geographic(v)for v in g.coords];row['contextComponent']=road_specs[str(r['id'])];row['replacesWholeSource']=fully;roads.append(row)
context={
 'schemaVersion':1,'id':'plaza-mayor-context','coordinate':[-.27863,39.67943],'researchDate':'2026-11-19',
 'plazaOutline':plazaOutline,'plazaOutlineSource':{'sourceWay':'733042234','method':'Northern part of mapped pedestrian area, cut at its southern street connection; not an independent cadastral plaza survey.'},
 'coreBuildings':coreBuildings,'buildings':buildings,'roads':roads,'surfaces':surfaces,
 'excludedBuildingIds':sorted(new_ids|core_ids|set(duplicates)),
 'coreExcludedBuildingIds':sorted(core_ids),
 'excludedRoadIds':sorted(replace_ids),'protectedFootprints':protected,
 'focusCoordinates':{'plaza-peixateria':[-.278248,39.679745],'plaza-cavallers':[-.278833,39.679231],'plaza-carrer-major':[-.278385,39.679610],'plaza-carrer-castell':[-.278451,39.679174]},
 'facadeNote':'Las huellas y subdivisiones proceden de cartografía. Las ventanas, balcones, revocos y puertas del caserío de contexto son interpretaciones visuales genéricas; las fachadas principales se estudian por separado.',
 'roofNote':'Las alturas proceden del IGN MDSnE o del número de plantas catastrales. El color de cubierta procede de muestras PNOA; la forma exacta de cada faldón y cumbrera es aproximada.',
 'pavingNote':'Los pavimentos siguen el MDT final de la escena. Las áreas OSM se recortan contra el contexto retenido de Santa María; anchos sin etiqueta y despieces de pavimento son aproximados.',
 'preservationNote':'Se conservan los edificios y accesos de Santa María V9; los nuevos volúmenes no invaden sus huellas ni las de los demás monumentos.',
 'sources':[
  {'id':'plaza-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado, no información catastral oficial'},
  {'id':'plaza-context-osm','title':'OpenStreetMap · área peatonal y calles de la Plaça Major','url':'https://www.openstreetmap.org/way/733042234','license':'© OpenStreetMap contributors · ODbL 1.0'},
  {'id':'plaza-context-mds','title':'IGN MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY 4.0'},
  {'id':'plaza-context-pnoa','title':'PNOA Máxima Actualidad','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY 4.0'}],
 'selectionStats':{'coreBuildings':len(coreBuildings),'coreCadastralParts':len(core_ids)-len(coreBuildings),'contextParts':len(buildings),'contextParcels':len({b['parentId']for b in buildings}),'OSMDuplicates':duplicates,'protectedFootprints':len(protected),'coreMatches':matched}
}
(DATA/'plaza-mayor-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in context['selectionStats'].items()if k!='coreMatches'},ensure_ascii=False));print('roads',len(roads),'surfaces',len(surfaces),'overlap preserved',selected_union.intersection(protected_union).area,'overlap core',selected_union.intersection(core_union).area)
