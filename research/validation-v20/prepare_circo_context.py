"""Reproduce the current surroundings of the Roman Circus gate, offline.

Requires Shapely 2.1+. Source polygons, holes and cadastral attributes remain
unchanged. Derived surfaces and small urban details are explicitly interpretive.
The archaeological model owns the irregular excavation and its retaining walls;
this context owns the surrounding streets, plaza, neighbours and mask apron.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union, substring

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
OUT = ROOT / 'research/validation-v20'
SCALE = 111320 * math.cos(math.radians(39.679))
COORDINATE = [-0.275518, 39.681049]
YAW = -0.307
project = lambda p: ((p[0]+.278)*SCALE, (39.679-p[1])*111320)
geo = lambda p: [round(-.278+p[0]/SCALE, 9), round(39.679-p[1]/111320, 9)]
AX, AZ = project(COORDINATE)
world = lambda p: (AX+p[0]*math.cos(YAW)+p[1]*math.sin(YAW), AZ-p[0]*math.sin(YAW)+p[1]*math.cos(YAW))
read = lambda n: json.loads((DATA/(n+'.json')).read_text())


def polygon(row):
    return Polygon([project(p) for p in row['coordinates']],
                   [[project(p) for p in ring] for ring in row.get('holes', [])]).buffer(0)


def polygons(shape):
    if shape.geom_type == 'Polygon' and shape.area > 1e-9:
        yield shape
    elif hasattr(shape, 'geoms'):
        for part in shape.geoms:
            yield from polygons(part)


def lines(shape):
    if shape.geom_type == 'LineString' and shape.length > .04:
        yield shape
    elif hasattr(shape, 'geoms'):
        for part in shape.geoms:
            yield from lines(part)


def width(road):
    try:
        return max(.7, min(18, float(road['width'])))
    except (KeyError, TypeError, ValueError):
        name = road.get('name', '').lower()
        if 'huertos' in name:
            return 5.4
        if 'remedio' in name or 'remei' in name:
            return 5.5
        return {'living_street':3.4, 'pedestrian':3.1, 'footway':1.6,
                'path':1.4, 'steps':1.4}.get(road.get('kind'), 4.5)


def source_paving(context):
    mesh = context.get('pavementMesh')
    if mesh:
        return unary_union([Polygon([mesh['vertices'][k] for k in group['indices'][i:i+3]])
            for group in mesh['groups'] for i in range(0, len(group['indices']), 3)])
    return unary_union([polygon(s) for s in context.get('surfaces', [])] +
        [LineString([project(p) for p in r['coordinates']]).buffer(width(r)/2, cap_style='flat')
         for r in context.get('roads', []) if r.get('area') != 'yes'])


def shape_record(id, shape, **extra):
    return {'id':id, 'coordinates':[geo(p) for p in shape.exterior.coords],
            'holes':[[geo(p) for p in ring.coords] for ring in shape.interiors], **extra}


def triangulate_regions(regions):
    """Every face remains inside one triangle of the existing 2.5 m terrain."""
    paving = unary_union([region for _, region in regions])
    vertices, lookup, groups, triangles = [], {}, {}, []
    def vertex(p):
        key = tuple(round(v, 6) for v in p)
        if key not in lookup:
            lookup[key] = len(vertices)
            vertices.append(list(key))
        return lookup[key]
    ax, az, bx, bz = paving.bounds
    for ix in range(math.floor(ax/2.5), math.ceil(bx/2.5)):
        for iz in range(math.floor(az/2.5), math.ceil(bz/2.5)):
            x, z = ix*2.5, iz*2.5
            if not paving.intersects(box(x,z,x+2.5,z+2.5)):
                continue
            cells = [Polygon([(x,z),(x,z+2.5),(x+2.5,z+2.5)]),
                     Polygon([(x,z),(x+2.5,z+2.5),(x+2.5,z)])]
            for cell in cells:
                for component, region in regions:
                    for piece in polygons(region.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area < 1e-9:
                                continue
                            ids = [vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids)) == 3:
                                groups.setdefault(component, []).extend(ids)
                                triangles.append(Polygon([vertices[i] for i in ids]))
    boundary = []
    for p in polygons(paving):
        for ring in [p.exterior, *p.interiors]:
            for a,b in zip(ring.coords, list(ring.coords)[1:]):
                dx,dz = b[0]-a[0], b[1]-a[1]
                ts = {0.,1.}
                for origin,delta in [(a[0],dx),(a[1],dz),(a[1]-a[0],dz-dx)]:
                    if abs(delta) < 1e-10:
                        continue
                    lo,hi = sorted([origin,origin+delta])
                    for k in range(math.floor(lo/2.5)+1, math.ceil(hi/2.5)):
                        t = (k*2.5-origin)/delta
                        if 1e-8 < t < 1-1e-8:
                            ts.add(t)
                ids = [vertex((a[0]+dx*t,a[1]+dz*t)) for t in sorted(ts)]
                boundary.extend([u,v] for u,v in zip(ids,ids[1:]) if u != v)
    return vertices,groups,triangles,boundary,paving


def build_context():
    cartography = read('cartography')
    site = next(s for s in read('archaeology-public')['sites'] if s['id']=='circo')
    core_coordinates = site['polygon']
    core = Polygon([project(p) for p in core_coordinates])
    mask_local = [(-8.68,-4.78),(7.72,-4.78),(7.72,4.12),(-8.68,4.12)]
    mask = Polygon([world(p) for p in mask_local])
    apron = mask.difference(core)
    selection = core.buffer(42, quad_segs=12)
    plaza_source = next(r for r in cartography['landcover'] if str(r['id'])=='566703073')
    plaza = polygon(plaza_source)
    owner_names = ['santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre','salvador','museo','portic','domus']
    owners = {name:read(name+'-context') for name in owner_names}
    protected_ids = {str(k) for old in owners.values() for k in old.get('excludedBuildingIds', [])}
    protected,shared_buildings,shared_roads,shared_paving = [],[],[],[]
    retained_by_owner = {owner:source_paving(old) for owner,old in owners.items()}
    for owner,old in owners.items():
        for b in old.get('buildings', [])+old.get('coreBuildings', [])+old.get('associatedBuildings', []):
            for i,part in enumerate([b,*b.get('secondaryFootprints', [])]):
                if len(part.get('coordinates', [])) < 3 or not polygon(part).intersects(selection.buffer(8)):
                    continue
                protected.append({'id':str(b['id'])+'-component-'+str(i), 'sourceId':str(b['id']),
                    'coordinates':part['coordinates'], 'holes':part.get('holes', []), 'owner':owner})
                shared_buildings.append({'sourceId':str(b['id']), 'owner':owner, 'parentId':b.get('parentId'),
                    'relationship':'Rendered once by its existing context; retained in place.'})
        for road in old.get('roads', []):
            if len(road['coordinates']) < 2 or not LineString([project(p) for p in road['coordinates']]).intersects(selection):
                continue
            shared_roads.append({'id':str(road['id']), 'sourceId':str(road.get('sourceId',road['id'])),
                'owner':owner, 'name':road.get('name'), 'coordinates':road['coordinates']})
        area = retained_by_owner[owner].intersection(selection).area
        if area > .001:
            shared_paving.append({'owner':owner,'areaWithinSelectionM2':round(area,3),
                'sourceHash':hashlib.sha256((DATA/(owner+'-context.json')).read_bytes()).hexdigest()})
    protected_union = unary_union([polygon(b) for b in protected])
    retained = unary_union(list(retained_by_owner.values()))
    parents = defaultdict(list)
    for b in cartography['buildings']:
        if b.get('parentId'):
            parents[b['parentId']].append(b)
    buildings,chosen,rejected = [],[],[]
    for parent,parts in parents.items():
        shape = unary_union([polygon(b) for b in parts])
        if not (selection.covers(shape.centroid) or shape.intersection(selection).area > shape.area*.5):
            continue
        if any(str(b['id']) in protected_ids for b in parts) or shape.intersection(protected_union).area > .25:
            rejected.append({'parentId':parent,'reason':'Previously owned geometry is retained.'})
            continue
        if shape.intersection(core).area > .01:
            rejected.append({'parentId':parent,'reason':'Overlaps the mapped open archaeological core.'})
            continue
        chosen.append(parent)
        buildings.extend(dict(b,contextComponent='circo-medianera' if parent=='3761904YJ3936B' else 'circo-entorno') for b in parts)
    chosen_shape = unary_union([polygon(b) for b in buildings])
    duplicates = []
    for b in cartography['buildings']:
        if b.get('parentId') or str(b['id']) in protected_ids:
            continue
        p = polygon(b)
        if p.area and p.intersection(chosen_shape).area/p.area > .7:
            duplicates.append(str(b['id']))
    old_road_ids = {str(v) for old in owners.values() for v in old.get('excludedRoadIds', [])}
    roads,full = [],[]
    for road in cartography['roads']:
        if str(road['id']) in old_road_ids or road.get('area')=='yes' or len(road['coordinates'])<2:
            continue
        axis = LineString([project(p) for p in road['coordinates']])
        if not axis.intersects(selection):
            continue
        parts = list(lines(axis.intersection(selection).difference(core).difference(retained)))
        if not parts:
            continue
        whole = axis.difference(unary_union(parts)).length < .02
        if whole:
            full.append(str(road['id']))
        for i,line in enumerate(parts):
            roads.append(dict(road,id=str(road['id'])+('' if whole else '-fragment-'+str(i)),
                sourceId=str(road['id']), sourceCoordinates=road['coordinates'],
                coordinates=[geo(p) for p in line.coords], contextComponent='circo-entorno',
                replacesWholeSource=whole, displayCarriagewayWidthM=width(road),
                displayWidthInterpretive=not bool(road.get('width'))))
    # Photo-observed trees, individually placed within the source plaza; no
    # invented lawn fills an area photographed as a paved public space.
    trees = [{'id':'circo-tree-'+str(i+1),'coordinate':geo(world((x,z))),
        'heightM':h,'crownRadiusM':r,'interpretive':True,'sourceId':'circo-context-photo'}
        for i,(x,z,h,r) in enumerate([(-5.3,-8.6,8.3,2.05),(-.1,-10.8,9.2,2.35),
            (4.0,-14.0,8.6,2.15),(-5.1,-16.1,9.7,2.3),(.1,-18.2,8.8,2.1)])]
    tree_pits = unary_union([Point(project(t['coordinate'])).buffer(.7,quad_segs=4) for t in trees]).intersection(plaza)
    source_obstacles = unary_union([polygon(b) for b in cartography['buildings'] if b.get('parentId')])
    courtyards = unary_union([Polygon(ring) for p in polygons(source_obstacles) for ring in p.interiors])
    obstacles = unary_union([source_obstacles,protected_union,courtyards,retained,core])
    carriageways,footways = [],[]
    for road in roads:
        axis = LineString([project(p) for p in road['coordinates']])
        is_car = road.get('kind') not in ['footway','path','steps','pedestrian']
        strip = axis.buffer(width(road)/2,cap_style='round',join_style='mitre',mitre_limit=2,quad_segs=4)
        (carriageways if is_car else footways).append(strip)
        if is_car:
            footways.append(axis.buffer(width(road)/2+1.65,cap_style='round',join_style='mitre',mitre_limit=2,quad_segs=4))
    asphalt = unary_union(carriageways).intersection(selection).difference(obstacles).difference(plaza).difference(apron)
    # The exact OSM plaza/archaeological edge and a buffered street axis are
    # separate datasets. Bridge their public frontage explicitly; a fixed-width
    # sidewalk buffer alone left a 1–2 m strip of orthophoto exposed beside the
    # plaza. Keep source edges, and stop at the road axis before subtracting the
    # carriageway, buildings, core, retained surfaces and original plaza below.
    remedio = next(r for r in cartography['roads'] if str(r['id'])=='162675200')
    remedio_axis = LineString([project(p) for p in remedio['coordinates']])
    public_edge = [project(plaza_source['coordinates'][3]),project(core_coordinates[5]),
                   project(core_coordinates[4]),world((7.72,4.12))]
    street_edge = substring(remedio_axis,remedio_axis.project(Point(public_edge[-1])),
                            remedio_axis.project(Point(public_edge[0])))
    frontage = Polygon([*public_edge,*street_edge.coords]).buffer(0)
    sidewalks = unary_union([*footways,frontage]).intersection(selection).difference(obstacles).difference(asphalt).difference(plaza).difference(apron)
    plaza_paving = plaza.difference(obstacles).difference(tree_pits).difference(apron)
    apron_paving = apron.difference(source_obstacles).difference(courtyards).difference(retained)
    planting = tree_pits.difference(obstacles)
    regions = [('circo-asfalto',asphalt),('circo-aceras',sidewalks),('circo-plaza',plaza_paving),
               ('circo-parterres',planting),('circo-apron',apron_paving)]
    vertices,groups,triangles,boundary,paving = triangulate_regions(regions)
    actual = unary_union(triangles)
    height_review = []
    for b in buildings:
        h,n = b.get('surfaceHeightEstimate'),b.get('levels')
        if not b.get('height') and h and n and ((n>=2 and h<n*1.75) or (n==1 and h>8)):
            height_review.append({'id':b['id'],'surfaceHeightEstimate':h,'cadastralLevels':n,
                'displayHeightM':n*3,'method':'Cadastral floor count × 3 m',
                'reason':'Surface estimate conflicts with mapped floors, often a nearby high roof. Source values retained; display height is interpretive.'})
    curbs = []
    interfaces = asphalt.boundary.intersection(sidewalks.buffer(.015))
    for i,line in enumerate(lines(interfaces)):
        if line.length > .5:
            curbs.append({'id':'circo-curb-'+str(i),'coordinates':[geo(p) for p in line.coords],
                'sourceId':'OSM street axes; inferred carriageway widths','interpretive':True})
    for i,p in enumerate(polygons(planting)):
        curbs.append({'id':'circo-tree-pit-curb-'+str(i),'coordinates':[geo(q) for q in p.exterior.coords],
            'sourceId':'Photo-observed planting; inferred tree pit','interpretive':True})
    public_surfaces = [shape_record(component+'-'+str(i),p,kind='public-square' if component in ['circo-plaza','circo-apron'] else 'public-surface',
        derived=True,contextComponent=component,sourceId='566703073' if component=='circo-plaza' else 'Source street axes and mapped excavation')
        for component,region in regions for i,p in enumerate(polygons(region))]
    generic_masks = []
    for part in polygons(paving.buffer(-.01).simplify(.00005,preserve_topology=True)):
        pieces=list(polygons(shapely.constrained_delaunay_triangles(part))) if part.interiors else [part]
        for piece in pieces:
            if piece.area>.01:
                generic_masks.append(shape_record('circo-street-mask-'+str(len(generic_masks)),piece,
                    scope='Only generic streets and vegetation; existing detailed contexts remain.'))
    # This non-rendered strip suppresses invented openings on the photograph-
    # documented blank western party wall. It is not a building footprint.
    facade_occlusion = Polygon([world(p) for p in [(-9.75,-13.7),(-7.6,-13.7),(-7.6,2.9),(-9.75,2.9)]])
    def focus(id,label,target_local,eye_local,radius):
        target,eye = world(target_local),world(eye_local)
        offset=[round(eye[0]-target[0],5),.45,round(eye[1]-target[1],5)]
        return id,{'label':label,'radius':radius,'targetCoordinates':geo(target),'targetHeight':1.7,
            'far':offset,'near':offset,'farEyeHeightM':2.15,'nearEyeHeightM':2.15,'fov':62,'minDistance':1.3,
            'sourceConfidence':'Street viewpoint checked against cadastral footprints; elevation is illustrative.'}
    focus_specs = dict([focus('circo-acceso','Acceso a la puerta y plaza arbolada',(4.5,-4.4),(12.2,1.7),18),
        focus('circo-entorno','Huertos, Remedio y la ciudad actual',(-1.5,7.9),(17.0,8.8),30)])
    context = {'schemaVersion':1,'id':'circo-context','coordinate':COORDINATE,'researchDate':'2026-11-20',
        'districtOutline':[geo(p) for p in selection.exterior.coords],
        'districtOutlineSource':'42 m graphic selection around OSM203085829; not a surveyed protection boundary.',
        'selectionRadiusM':42,'provenanceTextCodes':cartography.get('provenanceTextCodes',{}),
        'registration':{'coordinate':COORDINATE,'yawRadians':YAW,'baseDepthM':2.25,
            'baseDepthNote':'Approximate visual depth below the current surface, not a measured elevation. The published +47.30 m backfill relates to a specific protected trench.',
            'gateCenterLocalXZ':[-4.25,1.3],'gatePlacementNote':'Photographic registration within the OSM excavation, not an architectural survey.',
            'currentMask':{'centerLocalXZ':[-.48,-.33],'widthM':16.4,'depthM':8.9},
            'coordinateSystem':'World atlas x/z metres; monument local frame has yaw -0.307 radians.'},
        'coreOutline':core_coordinates,'coreBuildings':[],'associatedBuildings':[],
        'surfaceApron':{'coordinates':[geo(p) for p in mask.exterior.coords],'holes':[core_coordinates],
            'areaM2':round(apron.area,4),'owner':'circo-context','interpretive':True,
            'note':'Surface-height fill between the rectangular terrain cut and exact irregular OSM excavation; no extra archaeological trench.'},
        'buildings':buildings,'roads':roads,'surfaces':public_surfaces,
        'excludedBuildingIds':sorted({str(b['id']) for b in buildings}|set(duplicates)),
        'coreExcludedBuildingIds':[],'excludedRoadIds':sorted(set(full)),
        'protectedFootprints':protected,'ownershipTransfers':{},'heightReview':height_review,
        'sharedContext':{'policy':'Previous contexts retain all geometry; no parcel, street or surface ownership is transferred.',
            'buildings':shared_buildings,'roads':shared_roads,'paving':shared_paving},
        'focusCoordinates':{id:spec['targetCoordinates'] for id,spec in focus_specs.items()},'focusSpecs':focus_specs,
        'readingColor':'#8d9b8b','readingLayer':'contemporanea',
        'publicSpaceAreas':[shape_record('circo-plaza-norte',plaza,kind='public-square',sourceId='566703073',derived=False)],
        'publicFrontageAreas':[shape_record('circo-remedio-frontage',frontage,kind='public-footway',
            sourceId='566703073 / 203085829 / 162675200',derived=True,
            note='Public frontage between source plaza/excavation edge and Remedio axis; carriageway and obstacles subtracted in pavementMesh.')],
        'plantingAreas':[shape_record('circo-tree-pit-'+str(i),p,sourceId='circo-context-photo',interpretive=True) for i,p in enumerate(polygons(planting))],
        'vegetationExclusions':[shape_record('circo-owned-plaza',plaza,sourceId='566703073')],
        'facadeOcclusion':[shape_record('circo-blank-party-wall',facade_occlusion,sourceId='circo-context-photo',
            use='Rendering-only occlusion of invented facade openings. Not a cartographic building or exclusion.')],
        'trees':trees,'benches':[],'curbLines':curbs,
        'bollards':[{'id':'circo-bollard-'+str(i),'coordinate':geo(world(p)),'heightM':.85,'interpretive':True}
            for i,p in enumerate([(9.1,3.5),(9.6,-.6),(10.5,-6.0),(-1.0,4.5),(-4.8,4.55)])],
        'trafficMirror':{'coordinate':geo(world((8.1,4.1))),'poleHeightM':2.8,'radiusM':.34,'yawRadians':YAW+.72,'interpretive':True,'sourceId':'circo-context-photo'},
        'genericStreetExclusions':generic_masks,
        'pavementMesh':{'coordinateSystem':'Atlas x/z metres; origin [-0.278,39.679].',
            'terrainGrid':{'spacingM':2.5,'originXZ':[0,0],'diagonal':'x=z within each cell'},
            'method':'OSM street strips and source park polygon; building/core/private-court/retained-paving subtraction; constrained terrain-cell triangulation.',
            'vertices':vertices,'groups':[{'component':k,'indices':v,'sourceIds':sorted({r['sourceId'] for r in roads})} for k,v in groups.items()],
            'boundaryEdges':boundary},
        'facadeNote':'Huellas, patios y plantas del Catastro conservados; fachadas, huecos y cubiertas domésticas interpretativos. La medianera occidental ciega se reconoce en la fotografía pública.',
        'roofNote':'Prioridad de alturas explícitas, MDS normalizado y plantas catastrales. Conflictos de altura señalados sin modificar registros de origen.',
        'pavingNote':'Calles Huertos y Remedio según ejes OSM; anchos de calzada, aceras y alcorques aproximados. Plaza norte según OSM566703073, conectada con la acera de Remedio mediante la franja pública entre ambos trazados. Todas las superficies siguen el relieve; solo se excluye el recinto irregular actual.',
        'furnitureNote':'Arbolado, bolardos y espejo vial presentes en fotografías públicas; número, posición y dimensiones interpretativos. No es un inventario urbano actualizado.',
        'preservationNote':'Se conservan íntegros los diez contextos anteriores. El contexto del circo se oculta por intersección únicamente al explorar la hipótesis histórica, y se restaura al volver a Actual.',
        'sources':[
            {'id':'circo-context-arse','title':'López, Sañudo y Verdasco · Intervención arqueológica previa a la puesta en valor · ARSE51(2017), pp.103–123',
             'url':'https://centroarqueologicosaguntino.es/wp-content/uploads/2018/11/8.-La-intervenci%C3%B3n-aequeol%C3%B3gica-previa-para-la-puesta-en-valor-de-los-restos-arqueol%C3%B3gicos-de-la-puerta-del-circo-romano-de-Sagunto.pdf'},
            {'id':'circo-context-photo','title':'Rutas Jaume I · Puerta del Circo Romano · fotografías públicas del recinto y las calles',
             'url':'https://www.rutasjaumei.com/es/que-ver-en-sagunto/223/sagunto-puerta-del-circo-romano.php','note':'Referenced visually; source photographs are not redistributed.'},
            {'id':'circo-context-osm-core','title':'OpenStreetMap · recinto de la Puerta del Circo Romano','url':'https://www.openstreetmap.org/way/203085829','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'circo-context-osm-plaza','title':'OpenStreetMap · plaza arbolada al norte del recinto','url':'https://www.openstreetmap.org/way/566703073','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'circo-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado; no información catastral oficial'},
            {'id':'circo-context-mdt','title':'IGN MDT05 y MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY4.0'},
            {'id':'circo-context-pnoa','title':'PNOA · ortofotografía del atlas y tonos de cubiertas','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY4.0'}],
        'selectionStats':{'contextParts':len(buildings),'contextParcels':len(chosen),'mappedCourtyards':sum(len(b.get('holes',[])) for b in buildings),
            'roads':len(roads),'fullyReplacedRoads':len(full),'OSMDuplicates':duplicates,'retainedOwners':owner_names,
            'reusedBuildingParts':len(shared_buildings),'reusedRoadFragments':len(shared_roads),'rejectedParcels':rejected,'heightConflicts':len(height_review)},
        'inputHashes':{name:hashlib.sha256((DATA/(name+'.json')).read_bytes()).hexdigest()
            for name in ['cartography','archaeology-public',*[owner+'-context' for owner in owner_names]]}}
    cameras=[]
    for id,spec in focus_specs.items():
        target=project(spec['targetCoordinates'])
        eye=(target[0]+spec['far'][0],target[1]+spec['far'][2])
        segment=LineString([target,eye])
        cameras.append({'id':id,'eyeCoordinates':geo(eye),'targetCoordinates':spec['targetCoordinates'],
            'eyeInsideBuilding':source_obstacles.contains(Point(eye)),
            'rayBuildingIntersectionM':segment.intersection(source_obstacles).length,
            'eyeInsideCore':core.contains(Point(eye))})
    qa={'pass':False,'sourceCoreAreaM2':core.area,'sourcePlazaAreaM2':plaza.area,
        'apronAreaM2':apron.area,'renderedApronAreaM2':apron_paving.area,
        'pavingAreaM2':paving.area,'vertices':len(vertices),'triangles':len(triangles),'boundaryEdges':len(boundary),
        'uncoveredAreaM2':paving.difference(actual).area,'excessAreaM2':actual.difference(paving).area,
        'buildingOverlapM2':actual.intersection(source_obstacles).area,'privateCourtOverlapM2':actual.intersection(courtyards).area,
        'previousPavingOverlapM2':actual.intersection(retained).area,'coreOverlapM2':actual.intersection(core).area,
        'publicFrontageUncoveredM2':frontage.difference(obstacles).intersection(selection).difference(actual).area,
        'triangleOverlapM2':sum(p.area for p in triangles)-actual.area,
        'contextCoreBuildingOverlapM2':chosen_shape.intersection(core).area,
        'previousBuildingOverlapM2':chosen_shape.intersection(protected_union).area,
        'allSourceFootprintsRetained':all(any(b['id']==s['id'] and b['coordinates']==s['coordinates'] and b.get('holes',[])==s.get('holes',[]) for s in cartography['buildings']) for b in buildings),
        'treesInsideSourcePlaza':all(plaza.contains(Point(project(t['coordinate'])).buffer(.25)) for t in trees),
        'treeTrunksOverlapBuildings':any(source_obstacles.intersects(Point(project(t['coordinate'])).buffer(.25)) for t in trees),
        'viewpoints':cameras,'stats':context['selectionStats'],
        'limits':['Street widths, domestic details, tree positions and viewpoints are interpretive.','Archaeological vertical depth is illustrative, not a measured altitude.']}
    qa['pass']=all(abs(qa[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','buildingOverlapM2','privateCourtOverlapM2',
        'previousPavingOverlapM2','coreOverlapM2','triangleOverlapM2','contextCoreBuildingOverlapM2','previousBuildingOverlapM2','publicFrontageUncoveredM2'])
    qa['pass'] &= qa['allSourceFootprintsRetained'] and qa['treesInsideSourcePlaza'] and not qa['treeTrunksOverlapBuildings']
    qa['pass'] &= all(not c['eyeInsideBuilding'] and not c['eyeInsideCore'] and c['rayBuildingIntersectionM']<.001 for c in cameras)
    context['pavementMesh']['coverage']={k:v for k,v in qa.items() if k not in ['stats','viewpoints','limits']}
    OUT.mkdir(exist_ok=True)
    (OUT/'circo-context-geography-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
    assert qa['pass'],qa
    (DATA/'circo-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'pass':qa['pass'],**context['selectionStats'],'pavingAreaM2':round(paving.area,2),'triangles':len(triangles),'viewpoints':cameras},ensure_ascii=False,indent=2))
    return context


if __name__=='__main__':
    build_context()
