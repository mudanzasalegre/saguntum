"""Reproducible current streets and neighbouring cadastral fabric of Plaza del Fórum.

Shapely >= 2.1; calls the already-reviewed terrain-aligned triangulation helper.
The archaeological model owns the complete OSM park, its ramps, planting and
historic walls. This module owns only the exterior public surfaces and additional
neighbouring buildings. Earlier owners remain except for the previous Circo
sidewalk overshoot into the newly registered park (documented below).
"""
from pathlib import Path
from collections import defaultdict
import importlib.util
import hashlib
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'
OUT=ROOT/'research/validation-v52'
SOURCES=OUT/'forum-plaza-layout-source.json'
spec=importlib.util.spec_from_file_location('circo_context_helpers',ROOT/'research/validation-v20/prepare_circo_context.py')
H=importlib.util.module_from_spec(spec);spec.loader.exec_module(H)
project,geo,polygon,polygons,lines,shape_record,triangulate_regions=(getattr(H,n) for n in ['project','geo','polygon','polygons','lines','shape_record','triangulate_regions'])
read=H.read
ORIGIN=[-.2753495,39.6808973];YAW=-.2825634446
AX,AZ=project(ORIGIN)
def world(p):
 return AX+p[0]*math.cos(YAW)+p[1]*math.sin(YAW),AZ-p[0]*math.sin(YAW)+p[1]*math.cos(YAW)
def local(p):
 dx,dz=p[0]-AX,p[1]-AZ
 return [round(math.cos(YAW)*dx-math.sin(YAW)*dz,4),round(math.sin(YAW)*dx+math.cos(YAW)*dz,4)]
def width(road):
 if road.get('width'):
  try:return min(18,max(.7,float(road['width'])))
  except (ValueError,TypeError):pass
 name=road.get('name','').lower()
 if any(x in name for x in ['horts','huertos']):return 5.4
 if any(x in name for x in ['ordóñez','ordonez']):return 4.7
 if any(x in name for x in ['remedio','remei']):return 4.8
 return H.width(road)
def write(path,obj):
 path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')

def circo_boundary_correction(core,facade_occlusions):
 """Remove only previously drawn sidewalks inside the newly documented park.

 Existing archaeology, buildings, roads, vegetation, focuses, exclusions and all
 other model records remain unchanged. Repeated executions are idempotent.
 """
 path=DATA/'circo-context.json';ctx=read('circo-context');before=hashlib.sha256(path.read_bytes()).hexdigest()
 mesh=ctx['pavementMesh'];vertices=mesh['vertices'];groups=[]
 original=H.source_paving(ctx);overlap=original.intersection(core)
 correction=ctx.get('forumBoundaryCorrection',mesh.get('forumBoundaryCorrection',{}))
 if overlap.area>.0001:
  for g in mesh['groups']:
   shape=unary_union([Polygon([vertices[k] for k in g['indices'][i:i+3]]) for i in range(0,len(g['indices']),3)])
   groups.append((g['component'],shape.difference(core)))
  v,g,t,b,p=triangulate_regions(groups)
  actual=unary_union(t)
  sources={q['component']:q.get('sourceIds',[]) for q in mesh['groups']}
  ctx['pavementMesh']={**mesh,'vertices':v,'groups':[{'component':k,'indices':ids,'sourceIds':sources.get(k,[])} for k,ids in g.items()],'boundaryEdges':b}
  coverage=ctx['pavementMesh'].get('coverage',{})
  coverage.update({'pavingAreaM2':p.area,'vertices':len(v),'triangles':len(t),'boundaryEdges':len(b),
   'uncoveredAreaM2':p.difference(actual).area,'excessAreaM2':actual.difference(p).area,
   'newForumCoreOverlapM2':actual.intersection(core).area,'forumCoreRemovedM2':overlap.area})
  ctx['pavementMesh']['coverage']=coverage
  clipped=[]
  for s in ctx.get('surfaces',[]):
   pieces=list(polygons(polygon(s).difference(core)))
   if len(pieces)==1 and polygon(s).symmetric_difference(pieces[0]).area<.00001:clipped.append(s);continue
   for i,piece in enumerate(pieces):clipped.append({**s,**shape_record(s['id']+('-forumclip-'+str(i) if len(pieces)>1 else ''),piece),'forumBoundaryClipped':True})
  ctx['surfaces']=clipped
  correction={'sourceId':'osm-way-660194745','recordedDate':'2026-11-27','removedAreaM2':round(overlap.area,6),
   'geometryBeforeSHA256':before,'scope':'Only previous sidewalk/paving surfaces inside Plaza del Fórum; Circus archaeology, buildings, roads, trees and visit focuses preserved.',
   'removedPolygons':[shape_record('circo-forum-sidewalk-overlap-'+str(i),p) for i,p in enumerate(polygons(overlap))]}
  ctx['pavementMesh']['forumBoundaryCorrection']=correction
 ctx.pop('forumBoundaryCorrection',None)
 if correction:ctx['pavementMesh']['forumBoundaryCorrection']=correction
 occlusion={r['id']:r for r in ctx.get('facadeOcclusion',[])}
 for f in facade_occlusions:occlusion[f['id']]=f
 ctx['facadeOcclusion']=list(occlusion.values())
 changed=ctx!=read('circo-context')
 if changed:path.write_text(json.dumps(ctx,ensure_ascii=False,separators=(',',':'))+'\n')
 write(OUT/'forum-previous-overlap.json',{'correction':correction,'remainingOverlapM2':H.source_paving(ctx).intersection(core).area,
  'facadeOcclusionIds':[r['id'] for r in facade_occlusions],'afterSHA256':hashlib.sha256(path.read_bytes()).hexdigest()})
 return ctx

def build_context():
 cart=read('cartography');source=next(r for r in cart['landcover'] if str(r['id'])=='660194745');core=polygon(source)
 layout=json.loads(SOURCES.read_text());layout['sourceBoundary']['coordinates']=source['coordinates'];layout['sourceBoundary']['local']=[local(project(p)) for p in source['coordinates'][:-1]]
 selection=core.buffer(26,quad_segs=12)
 # Non-rendered occupancy on the park side of the genuine cadastral walls;
 # prevents the shared domestic renderer from inventing windows in blank party
 # walls. The specialist park module separately supplies their observed details.
 medianera_ids={'3760713YJ3936B','3760714YJ3936B','3760716YJ3936B'}
 occlusion_polys=[]
 for b in cart['buildings']:
  if b.get('parentId') in medianera_ids:
   edge=polygon(b).boundary.intersection(core.buffer(.45))
   if edge.length>.1:occlusion_polys.append(edge.buffer(.95,cap_style='square').intersection(core.buffer(.15)))
 occlusions=[shape_record('forum-blank-party-wall-'+str(i),p,sourceId='forum-municipal-2018',
  use='Rendering-only occupancy suppresses invented windows on park-facing party walls; no physical structure, exclusion or cadastral modification.') for i,p in enumerate(polygons(unary_union(occlusion_polys)))]
 circo_boundary_correction(core,occlusions)
 owners_list=['santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre','salvador','museo','portic','domus','circo']
 owners={n:read(n+'-context') for n in owners_list}
 protected_ids={str(k) for v in owners.values() for k in v.get('excludedBuildingIds',[])}
 protected=[];shared_buildings=[];shared_roads=[];shared_paving=[]
 owner_paving={n:H.source_paving(v) for n,v in owners.items()}
 for n,old in owners.items():
  for b in old.get('buildings',[])+old.get('coreBuildings',[])+old.get('associatedBuildings',[]):
   for i,part in enumerate([b,*b.get('secondaryFootprints',[])]):
    if len(part.get('coordinates',[]))<3 or not polygon(part).intersects(selection.buffer(8)):continue
    protected.append({'id':str(b['id'])+'-component-'+str(i),'sourceId':str(b['id']),'coordinates':part['coordinates'],'holes':part.get('holes',[]),'owner':n})
    shared_buildings.append({'sourceId':str(b['id']),'owner':n,'parentId':b.get('parentId'),'relationship':'Rendered once by its established owner; retained in place.'})
  for r in old.get('roads',[]):
   if len(r.get('coordinates',[]))>=2 and LineString([project(p) for p in r['coordinates']]).intersects(selection):shared_roads.append({'id':str(r['id']),'sourceId':str(r.get('sourceId',r['id'])),'owner':n,'name':r.get('name'),'coordinates':r['coordinates']})
  area=owner_paving[n].intersection(selection).area
  if area>.001:shared_paving.append({'owner':n,'areaWithinSelectionM2':round(area,3),'sourceHash':hashlib.sha256((DATA/(n+'-context.json')).read_bytes()).hexdigest()})
 protected_union=unary_union([polygon(b) for b in protected]);retained=unary_union(list(owner_paving.values()))
 parents=defaultdict(list)
 for b in cart['buildings']:
  if b.get('parentId'):parents[b['parentId']].append(b)
 buildings=[];chosen=[];rejected=[]
 for parent,parts in parents.items():
  shape=unary_union([polygon(b) for b in parts])
  if not (selection.covers(shape.centroid) or shape.intersection(selection).area>shape.area*.5):continue
  if any(str(b['id']) in protected_ids for b in parts) or shape.intersection(protected_union).area>.25:
   rejected.append({'parentId':parent,'reason':'Earlier owner retained.'});continue
  overlap=shape.intersection(core).area
  if overlap>.6:
   rejected.append({'parentId':parent,'reason':'Mapped building materially overlaps the open park.','overlapM2':round(overlap,4)});continue
  chosen.append(parent);buildings.extend(dict(b,contextComponent='forum-plaza-medianera' if parent in medianera_ids else 'forum-plaza-entorno') for b in parts)
 chosen_shape=unary_union([polygon(b) for b in buildings])
 duplicates=[]
 for b in cart['buildings']:
  if b.get('parentId') or str(b['id']) in protected_ids:continue
  p=polygon(b)
  if p.area and p.intersection(chosen_shape).area/p.area>.7:duplicates.append(str(b['id']))
 old_road_ids={str(k) for old in owners.values() for k in old.get('excludedRoadIds',[])}
 roads=[];full=[]
 for r in cart['roads']:
  if str(r['id']) in old_road_ids or r.get('area')=='yes' or len(r.get('coordinates',[]))<2:continue
  axis=LineString([project(p) for p in r['coordinates']])
  if not axis.intersects(selection):continue
  parts=list(lines(axis.intersection(selection).difference(core).difference(retained)))
  if not parts:continue
  whole=axis.difference(unary_union(parts)).length<.02
  if whole:full.append(str(r['id']))
  for i,line in enumerate(parts):roads.append(dict(r,id=str(r['id'])+('' if whole else '-fragment-'+str(i)),sourceId=str(r['id']),sourceCoordinates=r['coordinates'],coordinates=[geo(p) for p in line.coords],contextComponent='forum-plaza-entorno',replacesWholeSource=whole,displayCarriagewayWidthM=width(r),displayWidthInterpretive=not bool(r.get('width'))))
 source_obstacles=unary_union([polygon(b) for b in cart['buildings'] if b.get('parentId')]);courts=unary_union([Polygon(r) for p in polygons(source_obstacles) for r in p.interiors])
 obstacles=unary_union([source_obstacles,courts,protected_union,retained,core])
 car=[];foot=[]
 for r in roads:
  axis=LineString([project(p) for p in r['coordinates']]);is_car=r.get('kind') not in ['footway','path','steps','pedestrian']
  strip=axis.buffer(width(r)/2,cap_style='round',join_style='mitre',mitre_limit=2,quad_segs=4)
  (car if is_car else foot).append(strip)
  if is_car:foot.append(axis.buffer(width(r)/2+1.65,cap_style='round',join_style='mitre',mitre_limit=2,quad_segs=4))
 asphalt=unary_union(car).intersection(selection).difference(obstacles)
 frontage=core.buffer(3.0,join_style='mitre').difference(core).difference(source_obstacles).difference(courts)
 sidewalks=unary_union([*foot,frontage]).intersection(selection).difference(obstacles).difference(asphalt)
 regions=[('forum-plaza-asfalto',asphalt),('forum-plaza-aceras',sidewalks)]
 vertices,groups,triangles,boundary,paving=triangulate_regions(regions);actual=unary_union(triangles)
 surfaces=[shape_record(k+'-'+str(i),p,kind='public-surface',derived=True,contextComponent=k,sourceId='OSM road axes / forum-park-boundary') for k,shape in regions for i,p in enumerate(polygons(shape))]
 masks=[]
 for p in polygons(paving.buffer(-.01).simplify(.00005,preserve_topology=True)):
  for piece in (polygons(shapely.constrained_delaunay_triangles(p)) if p.interiors else [p]):
   if piece.area>.01:masks.append(shape_record('forum-street-mask-'+str(len(masks)),piece,scope='Only generic streets and vegetation; previous detailed owners preserved.'))
 reviews=[]
 for b in buildings:
  h,n=b.get('surfaceHeightEstimate'),b.get('levels')
  if not b.get('height') and h and n and ((n>=2 and h<n*1.75) or (n==1 and h>8)):reviews.append({'id':b['id'],'surfaceHeightEstimate':h,'cadastralLevels':n,'displayHeightM':n*3,'method':'Cadastral floor count ×3m','reason':'Surface estimate conflicts with mapped floors; original input retained, display value approximate.'})
 curbs=[]
 for i,line in enumerate(lines(asphalt.boundary.intersection(sidewalks.buffer(.015)))):
  if line.length>.5:curbs.append({'id':'forum-curb-'+str(i),'coordinates':[geo(p) for p in line.coords],'interpretive':True,'sourceId':'OSM street axes / approximate carriageway widths'})
 focuses={}
 for id,label,target,eye in [('forum-plaza-calleshorts','Huertos y la ciudad baja',(20,-3),(36,-3)),('forum-plaza-calleordonez','Ordóñez y el borde del parque',(46,16),(46,33))]:
  t,e=world(target),world(eye);offset=[round(e[0]-t[0],5),.5,round(e[1]-t[1],5)]
  focuses[id]={'label':label,'targetCoordinates':geo(t),'targetHeight':1.6,'radius':24,'far':offset,'near':offset,'farEyeHeightM':2.1,'nearEyeHeightM':2.1,'fov':62,'minDistance':1.3}
 center=geo(core.centroid.coords[0])
 ctx={'schemaVersion':1,'id':'forum-plaza-context','coordinate':center,'researchDate':'2026-11-27',
  'registration':{**layout['registration'],'coordinate':ORIGIN,'baseDepthM':2.5},'layout':layout,
  'coreOutline':source['coordinates'],'districtOutline':[geo(p) for p in selection.exterior.coords],
  'districtOutlineSource':'26m graphical selection around OSM660194745, not archaeological/protection boundary.','selectionRadiusM':26,
  'coreBuildings':[],'associatedBuildings':[],'buildings':buildings,'roads':roads,'surfaces':surfaces,
  'excludedBuildingIds':sorted({str(b['id']) for b in buildings}|set(duplicates)),'coreExcludedBuildingIds':[],'excludedRoadIds':sorted(set(full)),
  'protectedFootprints':protected,'ownershipTransfers':{},'heightReview':reviews,
  'sharedContext':{'policy':'All previous owners retained. Only Circo sidewalk overshoot into the new park is removed; the Circus archaeological core and geometry are unchanged.','buildings':shared_buildings,'roads':shared_roads,'paving':shared_paving},
  'focusCoordinates':{id:s['targetCoordinates'] for id,s in focuses.items()},'focusSpecs':focuses,'readingColor':'#8d9b8b','readingLayer':'ciudad',
  'publicSpaceAreas':[],'vegetationExclusions':[shape_record('forum-core-owned-by-model',core,sourceId='660194745')],
  'facadeOcclusion':occlusions,'curbLines':curbs,'trees':[],'benches':[],'genericStreetExclusions':masks,
  'pavementMesh':{'coordinateSystem':'Atlas world x/z metres; origin[-0.278,39.679].','terrainGrid':{'spacingM':2.5,'originXZ':[0,0],'diagonal':'x=z within each cell'},
   'method':'OSM street strips and park frontage minus cadastral buildings, private courtyards, earlier owned paving and full new park; constrained terrain-cell triangulation.',
   'vertices':vertices,'groups':[{'component':k,'indices':ids,'sourceIds':sorted({r['sourceId'] for r in roads})} for k,ids in groups.items()],'boundaryEdges':boundary},
  'facadeNote':'Huellas, patios y plantas catastrales conservados. Fachadas domésticas y cubiertas aproximadas; los muros ciegos que miran al parque no reciben ventanas automáticas.',
  'roofNote':'Altura explícita, MDS normalizado IGN y plantas catastrales; conflictos registrados sin reescribir la fuente.',
  'pavingNote':'Calles Huertos, Ordóñez y Remedio según ejes OSM. Anchos y bordillos aproximados. Superficies exteriores continuas, adaptadas al relieve, sin rellenar el parque excavado.',
  'furnitureNote':'El modelo del parque posee jardines, juegos, bancos, muros históricos y rampas; este módulo sólo dibuja entorno exterior.',
  'preservationNote':'Se mantienen todos los contextos anteriores. El pequeño exceso de acera previo del Circo se retira de la nueva huella del parque, sin modificar su recinto arqueológico.',
  'sources':[
   {'id':'forum-osm','title':'OpenStreetMap · Plaça del Fòrum y calles próximas','url':'https://www.openstreetmap.org/way/660194745','license':'©OpenStreetMap contributors · ODbL1.0'},
   {'id':'forum-municipal-2018','title':'Ayuntamiento de Sagunto · Acabadas las obras del parque arqueológico de la calle Huertos ·2018-09-13','url':'https://aytosagunto.es/es/actualidad/acabadas-las-obras-del-parque-arqueologico-de-la-calle-huertos/','note':'Photographs used as visual references; not redistributed.'},
   {'id':'forum-municipal-2016','title':'Ayuntamiento de Sagunto · Obras del parque arqueológico ·2016-01-27','url':'https://aytosagunto.es/es/actualidad/las-obras-del-futuro-parque-arqueologico-de-la-calle-huertos-estaran-finalizadas-este-verano/'},
   {'id':'forum-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado; no información catastral oficial'},
   {'id':'forum-mdt','title':'IGN MDT05 y MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY4.0'},
   {'id':'forum-pnoa','title':'PNOA · Ortofotografía más reciente servida por IGN','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY4.0','retrievalDate':'2026-11-27','note':'Acquisition date not exposed by GetMap; retrieval date is not flight date.'}],
  'selectionStats':{'contextParts':len(buildings),'contextParcels':len(chosen),'mappedCourtyards':sum(len(b.get('holes',[])) for b in buildings),'roads':len(roads),'fullyReplacedRoads':len(full),'OSMDuplicates':duplicates,'retainedOwners':owners_list,'reusedBuildingParts':len(shared_buildings),'reusedRoadFragments':len(shared_roads),'rejectedParcels':rejected,'heightConflicts':len(reviews)},
  'inputHashes':{n:hashlib.sha256((DATA/(n+'.json')).read_bytes()).hexdigest() for n in ['cartography',*[v+'-context' for v in owners_list]]}}
 qa={'pass':False,'sourceParkAreaM2':core.area,'publishedInterventionAreaM2':1608.44,'areaNote':'OSM park polygon and published entire project area are distinct source scopes.',
  'pavingAreaM2':paving.area,'vertices':len(vertices),'triangles':len(triangles),'uncoveredAreaM2':paving.difference(actual).area,'excessAreaM2':actual.difference(paving).area,
  'buildingOverlapM2':actual.intersection(source_obstacles).area,'privateCourtOverlapM2':actual.intersection(courts).area,'previousPavingOverlapM2':actual.intersection(retained).area,
  'parkOverlapM2':actual.intersection(core).area,'triangleOverlapM2':sum(p.area for p in triangles)-actual.area,'previousBuildingOverlapM2':chosen_shape.intersection(protected_union).area,
  'mappedBuildingParkBoundaryMismatchM2':chosen_shape.intersection(core).area,
  'footprintsRetained':all(any(b['id']==s['id'] and b['coordinates']==s['coordinates'] and b.get('holes',[])==s.get('holes',[]) for s in cart['buildings']) for b in buildings),
  'stats':ctx['selectionStats'],'limits':['Map/cadastral edge mismatch below0.6m² perselectedparcel preserved rather than rewriting source.','Heights, facade detail and street widths partly interpretive.']}
 qa['pass']=all(abs(qa[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','buildingOverlapM2','privateCourtOverlapM2','previousPavingOverlapM2','parkOverlapM2','triangleOverlapM2','previousBuildingOverlapM2']) and qa['footprintsRetained']
 ctx['pavementMesh']['coverage']={k:v for k,v in qa.items() if k not in ['stats','limits']}
 write(OUT/'forum-context-geography-qa.json',qa)
 assert qa['pass'],qa
 write(DATA/'forum-plaza-context.json',ctx)
 print(json.dumps({'pass':qa['pass'],'buildingParts':len(buildings),'parcels':len(chosen),'retainedParts':len(shared_buildings),'newRoads':len(roads),'pavingAreaM2':paving.area,'triangles':len(triangles),'parkOverlapM2':qa['parkOverlapM2']},indent=2))
 return ctx
if __name__=='__main__':build_context()
