"""Two separate hillside settings, derived from the atlas cartography.

The cemetery and hypogea are not joined by an invented excavation or terrace.
Existing castle, theatre and neighbourhood geometry retains its owner. Paths,
retaining walls and land-cover outlines keep their source coordinates; widths,
wall heights and individual plants are explicitly interpretive.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import importlib.util
import json
import math
import random
import re
import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
OUT = ROOT / 'research/validation-v21'
spec = importlib.util.spec_from_file_location('terrain_triangulation', ROOT/'research/validation-v20/prepare_circo_context.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
project, geo = helpers.project, helpers.geo
polygon, polygons, lines = helpers.polygon, helpers.polygons, helpers.lines
shape_record, triangulate_regions = helpers.shape_record, helpers.triangulate_regions
read = lambda name: json.loads((DATA/(name+'.json')).read_text())


def road_width(road):
    try:
        return max(.7, min(18, float(road['width'])))
    except (KeyError, TypeError, ValueError):
        return {'service':4.1, 'track':2.2, 'path':1.25, 'footway':1.6, 'steps':1.4}.get(road.get('kind'), 2)


def build_context():
    cartography = read('cartography')
    record = next(r for r in read('archaeology-necropolis')['sites'] if r['id']=='necropolis')
    anchors = {'cementerio':record['coordinate'], 'hipogeos':record['secondaryLocations'][0]['coordinate']}
    centers = {k:Point(project(v)) for k,v in anchors.items()}
    selections = {k:point.buffer(42 if k=='cementerio' else 35, quad_segs=12) for k,point in centers.items()}
    selection = unary_union(list(selections.values()))
    cem = Polygon([project(p) for p in record['footprint']])
    hx,hz = centers['hipogeos'].coords[0]
    # The rock model owns this eastern chamber envelope and the terrain apron.
    # The source Senda dels Lladres crosses the western apron and stays visible.
    hyp = box(hx+1,hz-6,hx+10,hz+6)
    cores = {'cementerio':cem,'hipogeos':hyp}
    core = unary_union(list(cores.values()))
    castle = Polygon([project(p) for p in cartography['castlePolygon']]).buffer(0)
    theatre = Polygon([project(p) for p in cartography['theatrePolygon']]).buffer(0)
    castle_text = (ROOT/'dist/js/castle.js').read_text()
    castle_roads = json.loads(re.search(r'const MAPPED_ROADS=(\[.*?\]);',castle_text)[1])
    castle_buildings = json.loads(re.search(r'const MAPPED_BUILDINGS=(\[.*?\]);',castle_text)[1])
    theatre_road_ids = {'733413579','733413580','733413581',*[str(733418145+i) for i in range(23)],'1499124508'}
    theatre_building_ids = {'203140142','cat-3556901YJ3935N_part1-0','cat-3556901YJ3935N_part2-0'}
    protected_road_ids = set(str(r['id']) for r in castle_roads)|theatre_road_ids
    protected_building_ids = set(str(r['id']) for r in castle_buildings)|theatre_building_ids
    owners = {name:read(name+'-context') for name in ['santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre','salvador','museo','portic','domus','circo']}
    for old in owners.values():
        protected_road_ids.update(str(v) for v in old.get('excludedRoadIds', []))
        protected_building_ids.update(str(v) for v in old.get('excludedBuildingIds', []))
    source_buildings = [(b,polygon(b)) for b in cartography['buildings']]
    nearby_buildings = [(b,p) for b,p in source_buildings if p.intersects(selection.buffer(8))]
    obstacles = unary_union([castle,theatre,core,*[p for b,p in nearby_buildings]])
    retained_paving = unary_union([helpers.source_paving(c) for c in owners.values()])
    # No ordinary domestic parcel lies in either local focus: all nearby
    # architecture is already a separately modelled castle/theatre component.
    assert all(str(b['id']) in protected_building_ids or p.intersection(castle.union(theatre)).area>p.area*.9
               for b,p in nearby_buildings), 'Unexpected unowned building requires explicit review.'
    roads,shared_roads,replaced = [],[],[]
    for road in cartography['roads']:
        if road.get('area')=='yes' or len(road['coordinates'])<2:
            continue
        axis = LineString([project(p) for p in road['coordinates']])
        if not axis.intersects(selection):
            continue
        if str(road['id']) in protected_road_ids:
            shared_roads.append({'id':str(road['id']),'coordinates':road['coordinates'],
                'name':road.get('name'),'owner':'castle' if str(road['id']) in {str(r['id']) for r in castle_roads} else 'theatre-or-retained-context',
                'relationship':'Existing owner retained; no second surface.'})
            continue
        parts = []
        for scope,area in selections.items():
            for line in lines(axis.intersection(area).difference(obstacles).difference(retained_paving)):
                parts.append((scope,line))
        if not parts:
            continue
        whole = axis.difference(unary_union([p for _,p in parts])).length<.02
        if whole:
            replaced.append(str(road['id']))
        for i,(scope,line) in enumerate(parts):
            roads.append(dict(road,id=str(road['id'])+'-fragment-'+str(i),sourceId=str(road['id']),
                coordinates=[geo(p) for p in line.coords],sourceCoordinates=road['coordinates'],scope=scope,
                contextComponent='necro-acceso' if scope=='cementerio' else 'necro-contexto',
                replacesWholeSource=whole,displayWidthM=road_width(road),displayWidthInterpretive=not bool(road.get('width'))))
    # Mapped retaining alignments outrank an inferred carriageway width.
    # Cut the display ribbon at the wall, rather than erasing a source wall
    # because an unsurveyed road-width buffer happens to reach it.
    mapped_walls = []
    for wall in cartography.get('retainingWalls', []):
        if str(wall['id']) not in {'733246631','1419279910'}:
            continue
        source = LineString([project(p) for p in wall['coordinates']])
        for scope,area in selections.items():
            for line in lines(source.intersection(area).difference(obstacles.buffer(.3))):
                mapped_walls.append((wall,scope,line))
    wall_footprints = unary_union([line.buffer(.26,cap_style='flat') for _,_,line in mapped_walls])
    regions = []
    for scope in selections:
        for kind in ['path','road']:
            strips = [LineString([project(p) for p in road['coordinates']]).buffer(road_width(road)/2,quad_segs=4)
                for road in roads if road['scope']==scope and ('road' if road.get('kind')=='service' else 'path')==kind]
            shape = unary_union(strips).intersection(selections[scope]).difference(obstacles).difference(retained_paving).difference(wall_footprints)
            # One owner per point, including crossing edges and footpath/road joins.
            shape = shape.difference(unary_union([p for _,p in regions]))
            regions.append(('necro-'+scope+'-'+kind,shape))
    vertices,groups,triangles,boundary,paving = triangulate_regions(regions)
    actual = unary_union(triangles)
    walls = []
    for index,(wall,scope,line) in enumerate(mapped_walls):
        walls.append(dict(wall,id=str(wall['id'])+'-'+scope+'-'+str(index),sourceId=str(wall['id']),
            sourceCoordinates=wall['coordinates'],coordinates=[geo(p) for p in line.coords],scope=scope,
            heightAboveGradeM=.62,widthM=.42,heightInterpretive=True))
    landcover = []
    for row in cartography['landcover']:
        if row.get('kind') not in ['wood','scrub','park']:
            continue
        source = polygon(row)
        for scope,area in selections.items():
            shape = source.intersection(area).difference(obstacles.buffer(1.25)).difference(paving.buffer(.8))
            for i,p in enumerate(polygons(shape)):
                landcover.append(shape_record(str(row['id'])+'-'+scope+'-'+str(i),p,sourceId=str(row['id']),kind=row['kind'],scope=scope,interpretive=False,derived=True))
    rng = random.Random(21013)
    planting = unary_union([polygon(r) for r in landcover])
    trees = []
    # Photo-observed cypress screen beyond the northern cemetery boundary.
    north = LineString([project(p) for p in [record['footprint'][0],record['footprint'][-1],record['footprint'][-2]]])
    for i in range(7):
        t=(i+.45)/7*north.length
        p=north.interpolate(t);a=north.interpolate(max(0,t-.1));b=north.interpolate(min(north.length,t+.1));dx,dz=b.x-a.x,b.y-a.y;length=math.hypot(dx,dz)
        candidate=Point(p.x+dz/length*1.55,p.y-dx/length*1.55)
        if core.buffer(.7).intersects(candidate) or paving.buffer(.7).intersects(candidate):
            continue
        trees.append({'id':'necro-cypress-'+str(i),'coordinate':geo(candidate.coords[0]),'scope':'cementerio','kind':'cypress',
            'heightM':6.8+rng.random()*1.2,'crownRadiusM':.62+rng.random()*.16,'interpretive':True,'sourceId':'necro-red-juderias'})
    for scope,area in selections.items():
        woodland = unary_union([polygon(r) for r in landcover if r['scope']==scope and r['kind']=='wood']).difference(core.buffer(4)).difference(paving.buffer(1.6)).difference(wall_footprints.buffer(1.2))
        ax,az,bx,bz=area.bounds
        count=0
        for attempt in range(1200):
            p=Point(rng.uniform(ax,bx),rng.uniform(az,bz));radius=1.8+rng.random()*.7
            if not woodland.contains(p.buffer(radius)) or any(Point(project(t['coordinate'])).distance(p)<radius+t['crownRadiusM']+1.3 for t in trees):
                continue
            trees.append({'id':'necro-pine-'+scope+'-'+str(count),'coordinate':geo(p.coords[0]),'scope':scope,'kind':'pine',
                'heightM':5.8+rng.random()*2.7,'crownRadiusM':radius,'interpretive':True,'sourceId':'necro-osm-landcover'})
            count+=1
            if count >= (10 if scope=='cementerio' else 5):
                break
    details = []
    for scope,area in selections.items():
        bare = area.difference(obstacles.buffer(.6)).difference(paving.buffer(.45)).difference(wall_footprints.buffer(.3))
        ax,az,bx,bz=area.bounds
        for kind,count in [('shrub',55),('rock',35)]:
            added=0
            for attempt in range(1000):
                p=Point(rng.uniform(ax,bx),rng.uniform(az,bz));radius=.18+rng.random()*(.43 if kind=='shrub' else .36)
                if not bare.contains(p.buffer(radius)) or (kind=='shrub' and not planting.contains(p)):
                    continue
                if any(Point(project(t['coordinate'])).distance(p)<.55 for t in trees):
                    continue
                details.append({'id':'necro-'+kind+'-'+scope+'-'+str(added),'coordinate':geo(p.coords[0]),'scope':scope,'kind':kind,
                    'radiusM':radius,'heightM':radius*(.8+rng.random()*.6),'yawRadians':rng.random()*math.tau,
                    'interpretive':True,'sourceId':'necro-upv-photo' if scope=='hipogeos' else 'necro-red-juderias'})
                added+=1
                if added>=count:
                    break
    cx,cz=centers['cementerio'].coords[0]
    focus_specs = {
        'necro-acceso':{'label':'El camino de llegada al cementerio','scope':'cementerio','targetCoordinates':geo((cx-17.5,cz+1)),
            'targetHeight':.7,'far':[-14,10,-10],'near':[-8,7,-7],'radius':12,'fov':58},
        'necro-ladera':{'label':'El cementerio en la ladera del castillo','scope':'cementerio','targetCoordinates':anchors['cementerio'],
            'targetHeight':1.1,'far':[-28,35,-38],'near':[-20,27,-26],'radius':28,'fov':55},
        'necro-contexto':{'label':'La senda, los hipogeos y el teatro','scope':'hipogeos','targetCoordinates':anchors['hipogeos'],
            'targetHeight':.8,'far':[-5,25,-26],'near':[-5,15,-11],'radius':23,'fov':58},
    }
    generic_masks = []
    for p in polygons(paving.buffer(-.005)):
        pieces=list(shapely.constrained_delaunay_triangles(p).geoms) if p.interiors else [p]
        for piece in pieces:
            if piece.area>.005:
                generic_masks.append(shape_record('necro-path-mask-'+str(len(generic_masks)),piece,scope='generic-surfaces'))
    surfaces = [shape_record(component+'-'+str(i),p,scope='cementerio' if 'cementerio' in component else 'hipogeos',
        kind='path' if component.endswith('-path') else 'road',contextComponent=component,derived=True,sourceId='OSM mapped path axes')
        for component,shape in regions for i,p in enumerate(polygons(shape))]
    shared_buildings = [{'id':str(b['id']),'coordinates':b['coordinates'],'holes':b.get('holes',[]),
        'owner':'castle' if str(b['id']) in {str(r['id']) for r in castle_buildings} else 'theatre',
        'scope':min(centers,key=lambda name:p.distance(centers[name])),
        'renderedElsewhere':True} for b,p in nearby_buildings]
    context = {'schemaVersion':1,'id':'necropolis-context','coordinate':anchors['cementerio'],'researchDate':'2026-11-20',
        'districtOutline':[geo(p) for p in selections['cementerio'].exterior.coords],
        'districtOutlines':[{ 'id':scope,'coordinates':[geo(p) for p in area.exterior.coords]} for scope,area in selections.items()],
        'selectionNote':'Two local graphic selections, 42 m and 35 m; no connecting surface or surveyed protected boundary.',
        'coreOutlines':{scope:[geo(p) for p in area.exterior.coords] for scope,area in cores.items()},
        'sectors':[{'id':scope,'label':'Cementerio medieval' if scope=='cementerio' else 'Hipogeos y senda',
            'coordinate':anchors[scope],'outline':[geo(p) for p in area.exterior.coords]} for scope,area in selections.items()],
        'buildings':[],'coreBuildings':[],'excludedBuildingIds':[],'excludedRoadIds':replaced,
        'roads':roads,'surfaces':surfaces,'retainingWalls':walls,'landcover':landcover,'trees':trees,'details':details,
        'genericStreetExclusions':generic_masks,
        'vegetationExclusions':[shape_record('necro-vegetation-'+scope,area,scope=scope) for scope,area in selections.items()],
        'sharedContext':{'buildings':shared_buildings,'roads':shared_roads,'policy':'Castle/theatre and all previous detailed contexts retain their geometry.'},
        'focusCoordinates':{id:s['targetCoordinates'] for id,s in focus_specs.items()},'focusSpecs':focus_specs,
        'pavementMesh':{'coordinateSystem':'Atlas world x/z metres.','surfaceLiftM':.035,
            'terrainGrid':{'spacingM':2.5,'originXZ':[0,0],'diagonal':'x=z within each cell'},
            'vertices':vertices,'groups':[{'component':name,'scope':'cementerio' if 'cementerio' in name else 'hipogeos','indices':ix} for name,ix in groups.items()],
            'boundaryEdges':boundary},
        'pavingNote':'Ejes de caminos y calle del Castillo conservados; anchuras interpretadas. Superficies sobre la ladera, sin terraza horizontal inventada.',
        'vegetationNote':'Cipreses reconocibles en fotografías; pinos y matorral coherentes con los polígonos OSM. Posiciones, alturas y densidad de ejemplares interpretadas.',
        'retainingWallNote':'Alineaciones OSM conservadas. Cotas, espesor, aparejo y remate son aproximaciones visuales; no se fechan como construcciones funerarias.',
        'preservationNote':'No se añaden casas: las construcciones próximas son el teatro y los accesos del castillo, ya modelados. Se conserva el paso de la Senda dels Lladres sobre el apron occidental del hipogeo.',
        'sources':[
            {'id':'necro-osm-context','title':'OpenStreetMap · senderos, calle del Castillo y contenciones','url':'https://www.openstreetmap.org/way/203325144','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'necro-osm-landcover','title':'OpenStreetMap · arbolado y matorral de la ladera','url':'https://www.openstreetmap.org/way/733331823'},
            {'id':'necro-red-juderias','title':'Red de Juderías · guía oficial de Sagunto, pp.30–31','url':'https://caminosdesefarad.com/wp-content/uploads/2023/05/Sagunto-web.pdf'},
            {'id':'necro-upv-photo','title':'UPV · Visita al casco histórico artístico de la ciudad antigua de Sagunto, p.65','url':'https://riunet.upv.es/server/api/core/bitstreams/0605b555-9fb5-410d-9fe7-096d2c8677e4/content'},
            {'id':'necro-femecv','title':'FEMECV · SL-CV42, recorrido por la ladera del castillo','url':'https://senders.femecv.com/es/sendero/ver/sl-cv-42'},
            {'id':'necro-ign','title':'IGN MDT05 · relieve ya incorporado al atlas','url':'https://www.ign.es/web/ign/portal/ane-area-ane'}],
        'inputHashes':{name:hashlib.sha256((DATA/(name+'.json')).read_bytes()).hexdigest() for name in ['cartography','elevation','archaeology-necropolis',*[name+'-context' for name in owners]]}}
    qa={'pass':False,'sectorSeparationM':centers['cementerio'].distance(centers['hipogeos']),
        'sourceCemeteryAreaM2':cem.area,'chamberEnvelopeAreaM2':hyp.area,'surfaceAreaM2':paving.area,
        'vertices':len(vertices),'triangles':len(triangles),'pathFragments':len(roads),'retainedRoads':len(shared_roads),
        'retainedBuildings':len(shared_buildings),'newBuildingParts':0,'retainingWallFragments':len(walls),
        'trees':len(trees),'cypresses':sum(t['kind']=='cypress' for t in trees),'smallLandscapeDetails':len(details),
        'uncoveredAreaM2':paving.difference(actual).area,'excessAreaM2':actual.difference(paving).area,
        'triangleOverlapM2':sum(p.area for p in triangles)-actual.area,
        'sourceBuildingOverlapM2':actual.intersection(unary_union([p for b,p in nearby_buildings])).area,
        'previousPavingOverlapM2':actual.intersection(retained_paving).area,
        'coreOverlapM2':actual.intersection(core).area,'castleTheatreOverlapM2':actual.intersection(castle.union(theatre)).area,
        'mappedWallOverlapM2':actual.intersection(wall_footprints).area,
        'sectorSelectionOverlapM2':selections['cementerio'].intersection(selections['hipogeos']).area,
        'plantCoreOverlapCount':sum(core.buffer(.03).contains(Point(project(p['coordinate']))) for p in trees+details),
        'plantPathOverlapCount':sum(paving.buffer(.05).contains(Point(project(p['coordinate']))) for p in trees+details),
        'sourceFootprintsUnmodified':True,
        'limitations':[context['pavingNote'],context['vegetationNote'],context['retainingWallNote']]}
    qa['pass']=all(abs(qa[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','triangleOverlapM2','sourceBuildingOverlapM2','previousPavingOverlapM2','coreOverlapM2','castleTheatreOverlapM2','sectorSelectionOverlapM2','mappedWallOverlapM2']) and not qa['plantCoreOverlapCount'] and not qa['plantPathOverlapCount']
    assert qa['pass'],qa
    context['stats']={k:v for k,v in qa.items() if k not in ['pass','limitations']}
    context['stats']['pavementTriangles']=qa['triangles']
    OUT.mkdir(exist_ok=True)
    (OUT/'necropolis-context-geography-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
    (DATA/'necropolis-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(qa,ensure_ascii=False,indent=2))
    return context


if __name__=='__main__':
    build_context()
