"""Derive source-registered Jewish quarter context while preserving V9/V10 owners."""
from pathlib import Path
import json,math
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2]; DATA=ROOT/'dist/assets/data'
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
carto,landmarks,sm,plaza=map(read,['cartography','landmarks','santa-maria-context','plaza-mayor-context'])
sites={s['id']:s for s in landmarks['sites']};scale=111320*math.cos(math.radians(39.679))
project=lambda c:((c[0]+.278)*scale,(39.679-c[1])*111320)
geographic=lambda p:[round(-.278+p[0]/scale,9),round(39.679-p[1]/111320,9)]
poly=lambda b:Polygon([project(c)for c in b['coordinates']],[[project(c)for c in h]for h in b.get('holes',[])]).buffer(0)
core_parents=['3557906YJ3935H','3557907YJ3935H','3557908YJ3935H','3558805YJ3935H','3558806YJ3935H','3558808YJ3935H','3558809YJ3935H','3558810YJ3935H','3558230YJ3935H','3558229YJ3935H','3558228YJ3935H','3558227YJ3935H']
core=[];core_ids=set()
for parent in core_parents:
 parts=[b for b in carto['buildings']if b.get('parentId')==parent];shape=unary_union([poly(b)for b in parts]);pieces=list(shape.geoms)if hasattr(shape,'geoms')else[shape];pieces.sort(key=lambda q:q.area,reverse=True);main=pieces[0]
 row={'id':'core-'+parent,'parentId':parent,'coordinates':[geographic(v)for v in main.exterior.coords],'holes':[[geographic(v)for v in h.coords]for h in main.interiors],'secondaryFootprints':[{'coordinates':[geographic(v)for v in q.exterior.coords],'holes':[[geographic(v)for v in h.coords]for h in q.interiors]}for q in pieces[1:]],'cadastralParts':parts,'cadastralParentIds':[parent],'levels':max(b.get('levels')or 0 for b in parts),'surfaceHeightEstimate':max(b.get('surfaceHeightEstimate')or 0 for b in parts),'roofColor':max(parts,key=lambda b:poly(b).area).get('roofColor','#b4a08c'),'source':'Catastro INSPIRE Buildings; union of source parts preserving separate components and courtyard holes. Per-part elevations remain available.','addressNote':'No modern house number is inferred from the cadastral parcel identifier.'};core.append(row);core_ids.update(str(b['id'])for b in parts)
core_shape=unary_union([poly(p)for b in core for p in[b,*b.get('secondaryFootprints',[])]])
protected=[]
for owner,ctx in [('santa-maria',sm),('plaza-mayor',plaza)]:
 for b in ctx['buildings']:protected.append({'id':b['id'],'coordinates':b['coordinates'],'holes':b.get('holes',[]),'owner':owner})
 for b in ctx.get('coreBuildings',[]):
  for i,p in enumerate([b,*b.get('secondaryFootprints',[])]):protected.append({'id':str(b['id'])+'-'+str(i),'coordinates':p['coordinates'],'holes':p.get('holes',[]),'owner':owner})
for site in landmarks['sites']:
 if site['id']=='juderia' or not site.get('footprint'):continue
 protected.append({'id':site['id'],'coordinates':site['footprint'],'owner':'existing-monument'})
for name in ['castlePolygon','theatrePolygon']:
 protected.append({'id':name,'coordinates':carto[name],'owner':'existing-monument'})
protected_union=unary_union([poly(b)for b in protected])
outline=sites['juderia']['districtBoundary'];district=Polygon([project(c)for c in outline]).buffer(0);selection=district.buffer(14)
cat=[(b,poly(b))for b in carto['buildings']if b.get('parentId')];buildings=[];boundaryRejected=[];protectedLargeRejected=[]
for b,q in cat:
 if not selection.intersects(q)or str(b['id'])in core_ids or q.intersection(core_shape).area>.45:continue
 if q.intersection(protected_union).area>.25:
  if q.area>1000:protectedLargeRejected.append({'id':b['id'],'areaM2':round(q.area,3),'reason':'Overlaps retained monument footprint; not a neighbourhood house.'})
  continue
 if not(selection.covers(q.centroid)or q.intersection(selection).area/q.area>.5):
  boundaryRejected.append({'id':b['id'],'areaM2':round(q.area,3),'fractionInside':round(q.intersection(selection).area/q.area,5),'reason':'Centre and majority of footprint lie outside the detail area.'});continue
 row=dict(b);c=q.centroid
 row['contextComponent']='juderia-caserio-norte'if c.y<64 else'juderia-caserio-sur'if c.y>145 else'juderia-caserio-este'if c.x>-25 else'juderia-caserio-oeste';buildings.append(row)
selected_union=unary_union([poly(b)for b in buildings]);all_own=unary_union([selected_union,core_shape]);duplicates=[]
for b in carto['buildings']:
 if str(b['id']).startswith('cat-'):continue
 q=poly(b)
 if q.area and q.intersection(all_own).area/q.area>.7:duplicates.append(str(b['id']))
# Retain existing owners of street surfaces. Source centre lines are clipped
# only at the new detail area's boundary or where an older detail owns paving.
def road_width(r):
 try:return float(r.get('width'))
 except:return {'residential':4.5,'living_street':3.4,'pedestrian':3.1,'footway':1.6,'steps':1.4}.get(r.get('kind'),2)
protected_paving=[]
for owner,ctx in [('santa-maria',sm),('plaza-mayor',plaza)]:
 for s in ctx.get('surfaces',[]):protected_paving.append(poly(s))
 for r in ctx.get('roads',[]):
  if r.get('area')!='yes':protected_paving.append(LineString([project(c)for c in r['coordinates']]).buffer(road_width(r)/2,cap_style=2))
protected_paving_union=unary_union(protected_paving)
# Only public neighbourhood routes. Private footpaths and lifts inside Casa
# dels Berenguer are not reconstructed or advertised as a public itinerary.
road_components={
 '41669706':'juderia-memoria','87552052':'juderia-refugio','87552079':'juderia-memoria',
 '163560095':'juderia-teatro','163560097':'juderia-pavimento','163560098':'juderia-segovia',
 '163560105':'juderia-rams','163560106':'juderia-sinagoga','163560122':'juderia-sang-vella',
 '163560123':'juderia-antigons','163560125':'juderia-rams','163560134':'juderia-teatro',
 '1303700988':'juderia-sinagoga','1365045228':'juderia-museo','1365045230':'juderia-museo',
 '1365045239':'juderia-museo','1365045240':'juderia-sinagoga','1365045242':'juderia-sang-vella',
 '1365045243':'juderia-segovia','1365045244':'juderia-rams','1393080436':'juderia-portalet',
 '1393080437':'juderia-portalet','1393080438':'juderia-refugio','1393080439':'juderia-refugio',
 '87554148':'juderia-berenguer','733056583':'juderia-berenguer','733056575':'juderia-pavimento','733056576':'juderia-pavimento'}
roads=[];replace_ids=set()
for r in carto['roads']:
 if str(r['id'])not in road_components:continue
 line=LineString([project(c)for c in r['coordinates']]);clip=line.intersection(selection).difference(protected_paving_union)
 if clip.is_empty:continue
 fully=line.difference(clip).length<.02
 if fully:replace_ids.add(str(r['id']))
 for i,g in enumerate(clip.geoms if hasattr(clip,'geoms')else[clip]):
  if g.geom_type!='LineString'or g.length<.15:continue
  row=dict(r);row.update({'id':str(r['id'])+(('-fragment-'+str(i))if not fully else''),'sourceId':str(r['id']),'coordinates':[geographic(v)for v in g.coords],'contextComponent':road_components[str(r['id'])],'replacesWholeSource':fully});roads.append(row)
surfaces=[]
for source_id in ['1357547434']:
 src=next(r for r in carto['squares']if str(r['id'])==source_id);shape=poly(src).intersection(selection).difference(protected_paving_union).difference(protected_union).difference(all_own)
 for i,q in enumerate(shape.geoms if hasattr(shape,'geoms')else[shape]):
  if q.geom_type!='Polygon'or q.area<.15:continue
  surfaces.append({'id':'juderia-pere-cartagena-space-'+str(i),'component':'juderia-pavimento','coordinates':[geographic(v)for v in q.exterior.coords],'holes':[[geographic(v)for v in h.coords]for h in q.interiors],'sourceId':source_id,'derived':True,'derivation':'OSM pedestrian area on Pere Cartagena minus existing building owners; not identified as the historic Placeta de la Jueria.'});replace_ids.add(source_id)
focusCoordinates={'juderia-segovia':[-.2783494,39.6780384],'juderia-rams':[-.2786209,39.67812815],'juderia-antigons':[-.2781053,39.6777525],'juderia-sinagoga':[-.27864,39.678440],'juderia-berenguer':[-.279010,39.678790],'juderia-micve':[-.2789003,39.6786271],'juderia-museo':[-.278008,39.678512],'juderia-teatro':[-.2791353,39.6781373],'juderia-memoria':[-.2779602,39.6782016]}
focusSpecs={
 'juderia-segovia':{'label':'Carrer de Segovia','far':[-9,30,24],'near':[-2,13,10],'radius':7},
 'juderia-rams':{'label':'Carrer dels Rams','far':[25,26,10],'near':[12,10,5],'radius':8},
 'juderia-antigons':{'label':'Carrer dels Antigons','far':[18,29,-20],'near':[7,13,-8],'radius':7},
 'juderia-sinagoga':{'label':'La sinagoga en la memoria del barrio','far':[21,26,-7],'near':[11,12,-3],'radius':8},
 'juderia-berenguer':{'label':'Casa dels Berenguer y la aljama','far':[17,29,-24],'near':[7,15,-12],'radius':10},
 'juderia-micve':{'label':'La lectura del posible baño ritual','far':[22,31,-16],'near':[13,18,-8],'radius':7},
 'juderia-museo':{'label':'El museo y la memoria material','far':[-23,29,8],'near':[-12,14,4],'radius':10},
 'juderia-teatro':{'label':'El borde de la judería hacia el teatro','far':[-19,29,-7],'near':[-9,14,-3],'radius':8},
 'juderia-memoria':{'label':'La memoria judía en la ciudad actual','far':[18,27,-16],'near':[8,14,-7],'radius':8}}
context={'schemaVersion':1,'id':'juderia-context','coordinate':[-.27861,39.67823],'researchDate':'2026-11-19','districtOutline':outline,'districtOutlineSource':{'source':'OSM district outline retained in the atlas landmark record','interpretation':'Mapped present-day neighbourhood extent, not a survey of the medieval enclosure.'},'coreBuildings':core,'buildings':buildings,'roads':roads,'surfaces':surfaces,'excludedBuildingIds':sorted({str(b['id'])for b in buildings}|core_ids|set(duplicates)|{str(b['id'])for b in core}),'coreExcludedBuildingIds':sorted(core_ids|{str(b['id'])for b in core}),'excludedRoadIds':sorted(replace_ids),'protectedFootprints':protected,'focusCoordinates':focusCoordinates,'focusSpecs':focusSpecs,'facadeNote':'Las huellas, patios y subdivisiones proceden de Catastro. Los huecos, revocos, puertas y balcones del caserío de contexto son una interpretación visual; no un levantamiento de cada vivienda.','roofNote':'Alturas IGN MDSnE o plantas catastrales, colores derivados de PNOA. Faldones y cumbreras interpretativos; los patios y las separaciones cartográficas se conservan.','pavingNote':'Ejes viarios OSM, recortados donde ya existe pavimento de Santa María o Plaça Major. Pavimentación adaptada a la malla final; anchuras sin etiqueta y despiece aproximados.','preservationNote':'Se conservan los 44 cuerpos de Santa María, 94 de Plaça Major y sus núcleos. Casa dels Berenguer, Museo, Sangre y otros monumentos siguen en sus modelos existentes.','sources':[
 {'id':'juderia-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado, no información catastral oficial'},
 {'id':'juderia-context-osm','title':'OpenStreetMap · Portalet de la Sang y calles de la judería','url':'https://www.openstreetmap.org/way/733421700','license':'© OpenStreetMap contributors · ODbL 1.0'},
 {'id':'juderia-context-mds','title':'IGN MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY 4.0'},
 {'id':'juderia-context-pnoa','title':'PNOA Máxima Actualidad','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY 4.0'}],
 'selectionStats':{'coreParcels':len(core),'coreCadastralParts':len(core_ids),'contextParts':len(buildings),'contextParcels':len({b['parentId']for b in buildings}),'OSMDuplicates':duplicates,'protectedFootprints':len(protected),'mappedCourtyards':sum(len(b.get('holes',[]))for b in buildings),'surfaces':len(surfaces),'roads':len(roads),'boundaryRejected':boundaryRejected,'protectedLargeRejected':protectedLargeRejected}}
(DATA/'juderia-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(context['selectionStats'],ensure_ascii=False));print('overlap protected',selected_union.intersection(protected_union).area,'overlap core',selected_union.intersection(core_shape).area)

# Derived continuous paving is rebuilt whenever the source selection changes.
from prepare_juderia_pavement import prepare as prepare_pavement
prepare_pavement(DATA)
