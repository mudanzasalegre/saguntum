"""Registered current surroundings of Via del Portic; never transfer old owners.

Source cadastral parts remain unaltered. Public-space contours and tree positions
are read approximately from the atlas PNOA mosaic, not from a street survey.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import importlib.util
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
OUT = ROOT / 'research/validation-v18'
SCALE = 111320 * math.cos(math.radians(39.679))
read = lambda name: json.loads((DATA / (name + '.json')).read_text())
project = lambda p: ((p[0] + .278) * SCALE, (39.679 - p[1]) * 111320)
geo = lambda p: [round(-.278 + p[0] / SCALE, 9), round(39.679 - p[1] / 111320, 9)]
spec = importlib.util.spec_from_file_location('previous_context_geometry', ROOT / 'research/validation-v17/prepare_museo_context.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
polygon, polygons, source_paving = previous.polygon, previous.polygons, previous.source_paving


def mesh_regions(regions):
    vertices, lookup, groups, triangles, boundary = [], {}, [], [], []
    def vertex(p):
        key = tuple(round(v, 6) for v in p)
        if key not in lookup:
            lookup[key] = len(vertices)
            vertices.append(list(key))
        return lookup[key]
    for component, shape in regions:
        indices = []
        if shape.is_empty:
            continue
        ax, az, bx, bz = shape.bounds
        for ix in range(math.floor(ax / 2.5), math.ceil(bx / 2.5)):
            for iz in range(math.floor(az / 2.5), math.ceil(bz / 2.5)):
                x, z = ix * 2.5, iz * 2.5
                if not shape.intersects(box(x, z, x + 2.5, z + 2.5)):
                    continue
                for cell in [Polygon([(x, z), (x, z + 2.5), (x + 2.5, z + 2.5)]),
                             Polygon([(x, z), (x + 2.5, z + 2.5), (x + 2.5, z)])]:
                    for piece in polygons(shape.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area < 1e-9:
                                continue
                            ids = [vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids)) == 3:
                                indices.extend(ids)
                                triangles.append(Polygon([vertices[i] for i in ids]))
        groups.append({'component': component, 'indices': indices})
    combined = unary_union([shape for _, shape in regions])
    for part in polygons(combined):
        for ring in [part.exterior, *part.interiors]:
            points = list(ring.coords)
            for a, b in zip(points, points[1:]):
                dx, dz = b[0] - a[0], b[1] - a[1]
                ts = {0., 1.}
                for origin, delta in [(a[0], dx), (a[1], dz), (a[1] - a[0], dz - dx)]:
                    if abs(delta) < 1e-10:
                        continue
                    lo, hi = sorted([origin, origin + delta])
                    for k in range(math.floor(lo / 2.5) + 1, math.ceil(hi / 2.5)):
                        t = (k * 2.5 - origin) / delta
                        if 1e-8 < t < 1 - 1e-8:
                            ts.add(t)
                ids = [vertex((a[0] + dx * t, a[1] + dz * t)) for t in sorted(ts)]
                boundary.extend([u, v] for u, v in zip(ids, ids[1:]) if u != v)
    actual = unary_union(triangles)
    qa = {'areaM2': combined.area, 'vertices': len(vertices), 'triangles': len(triangles),
          'boundaryEdges': len(boundary), 'uncoveredAreaM2': combined.difference(actual).area,
          'excessAreaM2': actual.difference(combined).area,
          'triangleOverlapM2': sum(p.area for p in triangles) - actual.area,
          'regionAreasM2': {name: round(shape.area, 3) for name, shape in regions}}
    return {'coordinateSystem': 'Atlas x/z metres; origin [-0.278,39.679].',
            'terrainGrid': {'spacingM': 2.5, 'originXZ': [0, 0], 'diagonal': 'x=z within each cell'},
            'method': 'Disjoint road, footway, plaza and planting regions clipped to cadastral footprints and triangulated on the final terrain grid.',
            'vertices': vertices, 'groups': groups, 'boundaryEdges': boundary, 'coverage': qa}, actual


def build_context():
    cartography = read('cartography')
    registration = json.loads((OUT / 'portic-host-registration.json').read_text())
    core = registration['coreBuildings']
    core_parents = {'4059201YJ3945N', '4059202YJ3945N'}
    core_shape = unary_union([polygon(b) for b in core])
    # Visual estimate of the existing public park outline, registered to PNOA.
    plaza = Polygon([(424, -153), (466, -114), (437, -71), (408, -19),
                     (377.5, -37.5), (391.5, -78), (407.5, -119)])
    selection = unary_union([core_shape.buffer(40), plaza.buffer(18)])
    owners_names = ['santa-maria', 'plaza-mayor', 'juderia', 'calvario', 'berenguer', 'sangre', 'salvador', 'museo']
    owners = {name: read(name + '-context') for name in owners_names}
    old_ids = {str(v) for old in owners.values() for v in old.get('excludedBuildingIds', [])}
    protected, shared_buildings, shared_roads = [], [], []
    for owner, old in owners.items():
        for b in old.get('buildings', []) + old.get('coreBuildings', []) + old.get('associatedBuildings', []):
            for i, part in enumerate([b, *b.get('secondaryFootprints', [])]):
                if len(part.get('coordinates', [])) < 3 or not polygon(part).intersects(selection):
                    continue
                protected.append({'id': str(b['id']) + '-component-' + str(i), 'sourceId': str(b['id']),
                                  'coordinates': part['coordinates'], 'holes': part.get('holes', []), 'owner': owner})
                shared_buildings.append({'sourceId': str(b['id']), 'owner': owner, 'parentId': b.get('parentId')})
        for r in old.get('roads', []):
            if LineString([project(p) for p in r['coordinates']]).intersects(selection):
                shared_roads.append({'id': str(r['id']), 'sourceId': str(r.get('sourceId', r['id'])),
                                     'coordinates': r['coordinates'], 'owner': owner, 'name': r.get('name')})
    protected_shape = unary_union([polygon(b) for b in protected])
    retained = unary_union([source_paving(old) for old in owners.values()])
    parents = defaultdict(list)
    for b in cartography['buildings']:
        if b.get('parentId'):
            parents[b['parentId']].append(b)
    buildings, chosen, rejected = [], [], []
    for parent, parts in parents.items():
        if parent in core_parents:
            continue
        shape = unary_union([polygon(b) for b in parts])
        if not (selection.covers(shape.centroid) or shape.intersection(selection).area > shape.area * .5):
            continue
        if any(str(b['id']) in old_ids for b in parts) or shape.intersection(protected_shape).area > .25:
            rejected.append({'parentId': parent, 'reason': 'Previous detailed visit retains ownership.'})
            continue
        chosen.append(parent)
        buildings.extend(dict(b, contextComponent='portic-entorno') for b in parts)
    chosen_shape = unary_union([polygon(b) for b in buildings])
    duplicates = []
    for b in cartography['buildings']:
        if b.get('parentId') or str(b['id']) in old_ids:
            continue
        p = polygon(b)
        if p.area and p.intersection(chosen_shape).area / p.area > .7:
            duplicates.append(str(b['id']))
    old_roads = {str(v) for old in owners.values() for v in old.get('excludedRoadIds', [])}
    roads, full = [], []
    for r in cartography['roads']:
        if str(r['id']) in old_roads or r.get('area') == 'yes':
            continue
        axis = LineString([project(p) for p in r['coordinates']])
        if not axis.intersects(selection):
            continue
        clip = axis.intersection(selection).difference(core_shape).difference(retained)
        lines = [p for p in (clip.geoms if hasattr(clip, 'geoms') else [clip]) if p.geom_type == 'LineString' and p.length > .2]
        if not lines:
            continue
        whole = axis.difference(unary_union(lines)).length < .02
        if whole:
            full.append(str(r['id']))
        for i, line in enumerate(lines):
            roads.append(dict(r, id=str(r['id']) + ('' if whole else '-fragment-' + str(i)), sourceId=str(r['id']),
                              sourceCoordinates=r['coordinates'], coordinates=[geo(p) for p in line.coords],
                              contextComponent='portic-entorno', replacesWholeSource=whole))
    obstacles = unary_union([polygon(b) for b in cartography['buildings'] if b.get('parentId')]
                            + [polygon(b) for b in protected])
    courtyards = unary_union([Polygon(ring) for p in polygons(obstacles) for ring in p.interiors])
    forbidden = unary_union([obstacles, retained, courtyards, core_shape])
    road_axes = [LineString([project(p) for p in r['coordinates']]) for r in roads]
    asphalt = unary_union([axis.buffer(2.65, cap_style='round', join_style='mitre', quad_segs=4) for axis in road_axes]).difference(forbidden)
    footways = unary_union([axis.buffer(4.2, cap_style='round', join_style='mitre', quad_segs=4) for axis in road_axes]).difference(forbidden).difference(asphalt)
    plaza = plaza.difference(forbidden).difference(asphalt)
    # A rounded northern enclosure and the long garden islands are visible in
    # the reference mosaic. Their borders remain approximate, not survey lines.
    ring = Point(434, -121).buffer(17, quad_segs=20).difference(Point(434, -121).buffer(12, quad_segs=20))
    ring = ring.difference(Polygon([(433, -123), (462, -108), (455, -98), (423, -115)]))
    planting = unary_union([ring,
        Polygon([(407, -117), (413, -113), (416, -106), (411, -100), (400, -102)]),
        Polygon([(426, -104), (438, -111), (444, -104), (438, -93), (428, -86), (423, -90)]),
        Polygon([(403, -98), (413, -96), (411, -86), (399, -82), (395, -88)]),
        Polygon([(421, -86), (432, -90), (435, -79), (428, -68), (420, -72)]),
        Polygon([(385, -64), (391, -63), (397, -59), (409, -57), (414, -59), (414, -53), (401, -52), (387, -57)]),
        Polygon([(388, -42), (411, -32), (406, -24), (383, -34)])
    ]).intersection(plaza).buffer(0)
    plaza_paving = plaza.difference(planting)
    footways = footways.difference(plaza)
    regions = [('portic-asfalto', asphalt), ('portic-aceras', footways),
               ('portic-plaza', plaza_paving), ('portic-parterres', planting)]
    pavement, actual = mesh_regions(regions)
    qa = pavement['coverage']
    qa.update({'buildingOverlapM2': actual.intersection(obstacles).area,
               'privateCourtOverlapM2': actual.intersection(courtyards).area,
               'previousPavingOverlapM2': actual.intersection(retained).area,
               'coreOverlapM2': actual.intersection(core_shape).area})
    qa['pass'] = all(abs(qa[k]) < .001 for k in ['uncoveredAreaM2', 'excessAreaM2', 'triangleOverlapM2',
                 'buildingOverlapM2', 'privateCourtOverlapM2', 'previousPavingOverlapM2', 'coreOverlapM2'])
    assert qa['pass'], qa
    masks = []
    for part in polygons(actual.buffer(-.01).simplify(.00005, preserve_topology=True)):
        pieces = list(polygons(shapely.constrained_delaunay_triangles(part))) if part.interiors else [part]
        for piece in pieces:
            if piece.area > .01:
                masks.append({'coordinates': [geo(p) for p in piece.exterior.coords],
                              'scope': 'Only generic streets and vegetation; no terrain flattening or previous detailed surfaces.'})
    tree_positions = [(419,-137),(428,-138),(438,-136),(446,-131),(450,-123),(448,-114),
                      (415,-128),(411,-118),(408,-110),(404,-102),(399,-94),(406,-88),
                      (435,-106),(437,-98),(430,-92),(427,-81),(429,-73),(422,-75),
                      (390,-62),(398,-57),(408,-55),(388,-37),(396,-33),(404,-30),
                      (414,-105),(424,-108)]
    trees = []
    for i, p in enumerate(tree_positions):
        if forbidden.distance(Point(p)) < 1 or not plaza.buffer(1).covers(Point(p)):
            continue
        trees.append({'id': 'portic-tree-' + str(i+1), 'coordinate': geo(p), 'heightM': 5.2 + (i % 5) * .48,
                      'crownRadiusM': 2.2 + (i % 4) * .22, 'sourceId': 'portic-context-pnoa',
                      'interpretive': True, 'note': 'Approximate canopy position and generic tree shape, not a botanical inventory.'})
    benches = []
    for i, (x,z,yaw) in enumerate([(421,-122,.35),(431,-132,.2),(444,-123,-.8),(417,-96,.5),
                                  (418,-84,.5),(402,-72,.5),(396,-64,.3),(405,-48,.5)]):
        if plaza_paving.covers(Point(x,z).buffer(1.1)):
            benches.append({'id':'portic-bench-'+str(i+1),'coordinate':geo((x,z)), 'yawRadians':yaw,
                            'sourceId':'portic-context-pnoa','interpretive':True})
    reviews = []
    for b in buildings:
        h,n = b.get('surfaceHeightEstimate'),b.get('levels')
        if not b.get('height') and h and n and ((n >= 2 and h < n * 1.75) or (n == 1 and h >= 9)):
            reviews.append({'id':b['id'],'surfaceHeightEstimate':h,'cadastralLevels':n,'displayHeightM':n*3,
                            'method':'Cadastral storey count × 3m','reason':'IGN sample conflicts with the cadastral floor count: low multistorey estimate or high sample over a one-storey courtyard/infill part. Original evidence is preserved.'})
    context = {'schemaVersion':1,'id':'portic-context','coordinate':[-.27257375,39.67970795],
        'researchDate':'2026-11-20','districtOutline':[geo(p) for p in selection.exterior.coords],
        'districtOutlineSource':'Graphic neighbourhood selection around the two host blocks and the plaza, not a protection boundary.',
        'provenanceTextCodes':cartography.get('provenanceTextCodes',{}),
        'coreBuildings':core,'coreOutlines':registration['coreOutlines'],'associatedBuildings':[],
        'buildings':buildings,'roads':roads,'surfaces':[{'id':'portic-plaza-paving-'+str(i),
           'kind':'public-square','coordinates':[geo(p)for p in s.exterior.coords],
           'holes':[[geo(p)for p in h.coords]for h in s.interiors], 'derived':True,'sourceId':'portic-context-pnoa'}
           for i,s in enumerate(polygons(plaza_paving))],
        'excludedBuildingIds':sorted({str(b['id'])for b in buildings}|set(duplicates)),
        'coreExcludedBuildingIds':sorted({str(b['id'])for b in core}|{'203064254'}),
        'excludedRoadIds':sorted(set(full)),'protectedFootprints':protected,'ownershipTransfers':{},
        'heightReview':reviews,'sharedContext':{'policy':'Every previous detailed visit keeps its existing geometry and source ownership.',
            'buildings':shared_buildings,'roads':shared_roads},
        'coreOwnership':{'owner':'portic-model','parents':sorted(core_parents),'sourceBuildingPartIds':[str(b['id'])for b in core],
            'registrationNote':'Cadastral host envelopes are modern above-ground building geometry, not the precise full underground excavation perimeter.',
            'hostParts':len(core),'hostAreaM2':core_shape.area},
        'focusCoordinates':{'portic-plaza':geo((417,-105)),'portic-acceso':[-.2728361,39.6796023],
                            'portic-entorno':[-.2722026,39.6798814]},
        'focusSpecs':{
            'portic-plaza':{'label':'La plaza de la Antigua Morería','radius':38,'targetCoordinates':geo((419,-100)),
                'targetHeight':2,'far':[-17,58,50],'near':[-9,.2,15],'nearEyeHeightM':2.15,'fov':58,'minDistance':2.2},
            'portic-acceso':{'label':'El acceso desde la plaza','radius':16,'targetCoordinates':geo((438.25,-67.048)),
                'targetHeight':1.7,'far':[-19,13,7],'near':[-9,0,1],'nearEyeHeightM':2.15,'fov':60,'minDistance':1.6},
            'portic-entorno':{'label':'Huertos y Alorco, junto al yacimiento','radius':35,'targetCoordinates':[-.2722026,39.6798814],
                'targetHeight':2,'far':[17,45,-28],'near':[5.8,0,-9.8],'nearEyeHeightM':2.15,'fov':60,'minDistance':2}},
        'readingColor':'#8d9b8b','readingLayer':'contemporary',
        'facadeNote':'Huellas y patios catastrales conservados. Huecos, balcones y detalles de las fachadas vecinas son interpretativos.',
        'roofNote':'Alturas IGN normalizadas o plantas catastrales; la complejidad de los bloques no se convierte en una única altura uniforme.',
        'pavingNote':'Plaza y parterres interpretados sobre la ortofoto PNOA; calzadas sobre ejes OSM. Todos siguen la pendiente final sin explanación. Anchuras y bordillos aproximados.',
        'furnitureNote':'Copas de árboles localizadas aproximadamente en PNOA. Bancos y formas vegetales interpretativos. La presencia del parque con sombra está corroborada por el Ayuntamiento en junio2026.',
        'preservationNote':'Ocho contextos anteriores permanecen intactos. El modelo arqueológico posee ambos bloques modernos, mientras este módulo sólo dibuja vecinos y espacio público.',
        'publicSpaceAreas':[{'id':'portic-plaza-inferred-'+str(i),'coordinates':[geo(p)for p in part.exterior.coords],
             'holes':[[geo(p)for p in h.coords]for h in part.interiors],
             'derived':True,'sourceId':'portic-context-pnoa','contextComponent':'portic-plaza'} for i,part in enumerate(polygons(plaza))],
        'plantingAreas':[{'id':'portic-planting-'+str(i),'coordinates':[geo(p)for p in s.exterior.coords],
             'holes':[[geo(p)for p in h.coords]for h in s.interiors], 'interpretive':True,'sourceId':'portic-context-pnoa'}
             for i,s in enumerate(polygons(planting))],
        'trees':trees,'benches':benches,'pavementMesh':pavement,'genericStreetExclusions':masks,
        'sources':[
            {'id':'portic-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado, no información catastral oficial'},
            {'id':'portic-context-osm','title':'OpenStreetMap · Plaça Antiga Moreria, Alorco y Huertos','url':'https://www.openstreetmap.org/way/733188292','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'portic-context-mdt','title':'IGN MDT05 y MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY4.0'},
            {'id':'portic-context-pnoa','title':'PNOA Máxima Actualidad · plaza y volúmenes existentes','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY4.0','note':'Retrieval date19November2026 is not photograph date; positions and garden borders are interpreted.'},
            {'id':'portic-context-ayto2022','title':'Ayuntamiento · mejoras de accesibilidad e identificación de los dos edificios sobre los restos','url':'https://aytosagunto.es/es/actualidad/sagunto-inaugura-las-mejoras-de-accesibilidad-en-la-via-del-portic/','date':'2022-11-04'},
            {'id':'portic-context-shade2026','title':'Ayuntamiento · plaza Antigua Morería entre los parques con sombra','url':'https://aytosagunto.es/es/actualidad/2026-06-12-el-ayuntamiento-de-sagunto-habilita-mas-de-30-refugios-climaticos-para-combatir-las-altas-temperaturas/','date':'2026-06-12'}],
        'selectionStats':{'contextParts':len(buildings),'contextParcels':len(chosen),'mappedCourtyards':sum(len(b.get('holes',[]))for b in buildings),
            'hostParts':len(core),'hostParcels':len(core_parents),'roads':len(roads),'fullyReplacedRoads':len(full),
            'OSMDuplicates':duplicates,'retainedOwners':owners_names,'reusedBuildingParts':len(shared_buildings),
            'reusedRoadFragments':len(shared_roads),'rejectedParcels':rejected,'heightConflicts':len(reviews)},
        'inputHashes':{name:hashlib.sha256((DATA/(name+'.json')).read_bytes()).hexdigest()
                       for name in ['cartography','orthophoto',*[owner+'-context'for owner in owners_names]]}}
    # The renderer's existing excavation shader accepts a rotated rectangle.
    # Restore its non-building corners with a separate mesh so the plaza does
    # not acquire a rectangular pit. The archaeological model owns this mesh.
    rect = registration['coreOutlines'][0]['minimumRectangleXZ']
    origin = ((rect[0][0]+rect[2][0])/2, (rect[0][1]+rect[2][1])/2)
    yaw = math.atan2(rect[1][0]-rect[0][0], rect[1][1]-rect[0][1])
    c,s = math.cos(yaw), math.sin(yaw)
    local = lambda p: ((p[0]-origin[0])*c-(p[1]-origin[1])*s,
                       (p[0]-origin[0])*s+(p[1]-origin[1])*c)
    world = lambda p: (origin[0]+p[0]*c+p[1]*s, origin[1]-p[0]*s+p[1]*c)
    outline_polys = [Polygon(row['worldOutline']) for row in registration['coreOutlines']]
    all_points = [local(p) for row in registration['coreOutlines'] for p in row['worldOutline']]
    ax,az = min(p[0]for p in all_points)-.7, min(p[1]for p in all_points)-.7
    bx,bz = max(p[0]for p in all_points)+.7, max(p[1]for p in all_points)+.7
    cut_rectangle = Polygon([world(p)for p in [(ax,az),(bx,az),(bx,bz),(ax,bz)]])
    apron = cut_rectangle.difference(unary_union(outline_polys))
    apron_mesh, apron_actual = mesh_regions([('portic-surface-apron',apron)])
    apron_qa = apron_mesh['coverage']
    apron_qa['hostInteriorOverlapM2'] = apron_actual.intersection(unary_union(outline_polys)).area
    apron_qa['pass'] = all(abs(apron_qa[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','triangleOverlapM2','hostInteriorOverlapM2'])
    assert apron_qa['pass'],apron_qa
    context['surfaceApron'] = {'owner':'portic-model','purpose':'Restore terrain outside the real modern host envelopes when the rectangular excavation shader is active.',
        'coordinateSystem':apron_mesh['coordinateSystem'],'terrainGrid':apron_mesh['terrainGrid'],
        'vertices':apron_mesh['vertices'],'indices':apron_mesh['groups'][0]['indices'],
        'boundaryEdges':apron_mesh['boundaryEdges'],'coverage':apron_qa,
        'cut':{'center':dict(zip(['x','z'],world(((ax+bx)/2,(az+bz)/2)))),'width':bx-ax,'depth':bz-az,'yaw':yaw},
        'note':'Exact geometric complement of a graphic cut rectangle; not an archaeological boundary or a terrain survey.'}
    (DATA/'portic-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
    (OUT/'portic-context-pavement-qa.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n')
    (OUT/'portic-surface-apron-qa.json').write_text(json.dumps(apron_qa,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'selection':context['selectionStats'],'paving':qa,'trees':len(trees),'benches':len(benches)},ensure_ascii=False,indent=2))
    return context


if __name__ == '__main__':
    build_context()
