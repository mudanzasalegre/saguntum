"""Derive the Berenguer surroundings without duplicating previous scene owners.

The palace, annex and Diana forecourt belong to berenguer.js. This selection
adds only source-backed domestic parcels and external streets. Previous source
datasets remain immutable; ownership transfers are explicit for integration.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
OUT = ROOT / 'research/validation-v14'
SCALE = 111320 * math.cos(math.radians(39.679))
read = lambda n: json.loads((DATA / (n + '.json')).read_text())
project = lambda ll: ((ll[0] + .278) * SCALE, (39.679 - ll[1]) * 111320)
geographic = lambda p: [round(-.278 + p[0] / SCALE, 9), round(39.679 - p[1] / 111320, 9)]


def polygon(row):
    return Polygon([project(p) for p in row['coordinates']],
                   [[project(p) for p in ring] for ring in row.get('holes', [])]).buffer(0)


def polygons(shape):
    if shape.geom_type == 'Polygon' and shape.area > 1e-9:
        yield shape
    elif hasattr(shape, 'geoms'):
        for part in shape.geoms:
            yield from polygons(part)


def width(road):
    try:
        return max(.7, min(18, float(road['width'])))
    except (KeyError, TypeError, ValueError):
        return {'living_street': 3.4, 'pedestrian': 3.1,
                'footway': 1.6, 'path': 1.4, 'steps': 1.4}.get(road.get('kind'), 4.5)


def retained_paving(contexts):
    surfaces = []
    for old in contexts.values():
        mesh = old.get('pavementMesh')
        if mesh:
            for group in mesh['groups']:
                ids = group['indices']
                surfaces.extend(Polygon([mesh['vertices'][i] for i in ids[j:j+3]])
                                for j in range(0, len(ids), 3))
        else:
            surfaces.extend(polygon(s) for s in old.get('surfaces', []))
            for road in old.get('roads', []):
                if road.get('area') != 'yes':
                    surfaces.append(LineString([project(p) for p in road['coordinates']])
                                    .buffer(width(road)/2, cap_style='flat'))
    return unary_union(surfaces)


def build_context():
    cartography, landmarks = read('cartography'), read('landmarks')
    sites = {s['id']: s for s in landmarks['sites']}
    site = sites['berenguer']
    owners = {n: read(n+'-context') for n in ['santa-maria', 'plaza-mayor', 'juderia', 'calvario']}
    core_parents = {'3558201YJ3935G', '3558202YJ3935G'}
    core = [dict(b) for b in cartography['buildings'] if b.get('parentId') in core_parents]
    associated = [dict(b) for b in cartography['buildings'] if b.get('parentId') == '3558249YJ3935G']
    core_ids = {str(b['id']) for b in core}
    core_shape = unary_union([polygon(b) for b in core] + [polygon({'coordinates': site['footprint']})])
    # This conservative limit is replaced by the model's final measured-to-map
    # forecourt outline when supplied. It is a render-ownership boundary only.
    plaza_coordinates = [[-.278919,39.678654],[-.278758,39.678616],
                         [-.278742,39.6785668],[-.2789173,39.6786198]]
    plan_file = DATA/'berenguer-plan.json'
    if plan_file.exists():
        plan = json.loads(plan_file.read_text())
        plaza_coordinates = plan.get('contextOwnership', {}).get('dianaForecourt', plaza_coordinates)
    forecourt = polygon({'coordinates': plaza_coordinates})
    internal_road_ids = {str(n) for n in range(1419209842,1419209847)}
    internal_roads = [dict(r) for r in cartography['roads'] if str(r['id']) in internal_road_ids]
    reserved = unary_union([core_shape, forecourt] + [
        LineString([project(p) for p in r['coordinates']]).buffer(width(r)/2+.12)
        for r in internal_roads])
    selection = core_shape.buffer(38)
    protected, protected_ids, transfers = [], set(), {}
    for owner, old in owners.items():
        protected_ids.update(map(str, old['excludedBuildingIds']))
        retired = sorted(core_ids.intersection(map(str, old['excludedBuildingIds'])))
        transfers[owner] = {'retiredBuildingPartIds': retired, 'retiredRoadIds': [],
                            'replacementOwner': 'berenguer-core',
                            'reason': 'Exact palace/annex source parts now rendered by the detailed monument.'}
        for b in old['buildings'] + old.get('coreBuildings', []):
            for i, part in enumerate([b, *b.get('secondaryFootprints', [])]):
                protected.append({'id': str(b['id']) + '-component-' + str(i),
                                  'coordinates': part['coordinates'], 'holes': part.get('holes', []),
                                  'owner': owner, 'sourceId': str(b['id'])})
    for s in landmarks['sites']:
        if len(s.get('footprint', [])) >= 3:
            protected.append({'id': s['id'], 'coordinates': s['footprint'], 'owner': 'existing-monument'})
    # Only neighbouring footprints can intersect this bounded selection or
    # its street widths. Keep far-away owners out of the startup payload.
    protected = [row for row in protected if polygon(row).intersects(selection.buffer(8))]
    protected_union = unary_union([polygon(p) for p in protected])
    parents = defaultdict(list)
    for row in cartography['buildings']:
        if row.get('parentId'):
            parents[row['parentId']].append(row)
    buildings, chosen, rejected = [], [], []
    for parent, parts in parents.items():
        shape = unary_union([polygon(p) for p in parts])
        if shape.is_empty or not (selection.covers(shape.centroid) or
                                  shape.intersection(selection).area > shape.area * .5):
            continue
        if parent in core_parents or shape.intersection(reserved).area > .25:
            rejected.append({'parentId': parent, 'reason': 'Detailed palace, annex or reserved court/access'})
            continue
        if any(str(b['id']) in protected_ids for b in parts) or shape.intersection(protected_union).area > .25:
            rejected.append({'parentId': parent, 'reason': 'Retained detailed scene owner'})
            continue
        chosen.append(parent)
        for part in parts:
            row = dict(part)
            row['contextComponent'] = 'berenguer-entorno'
            buildings.append(row)
    chosen_shape = unary_union([polygon(p) for p in buildings])
    duplicates = []
    for row in cartography['buildings']:
        if row.get('parentId') or str(row['id']) in protected_ids:
            continue
        shape = polygon(row)
        if shape.area and shape.intersection(chosen_shape).area/shape.area > .7:
            duplicates.append(str(row['id']))
    protected_pavement = retained_paving(owners)
    roads, fully_replaced = [], []
    road_ids = {'87552058','87552085','163560095','733056583','1419209841','1365045247'}
    old_road_ids = {str(v) for old in owners.values() for v in old.get('excludedRoadIds', [])}
    for road in cartography['roads']:
        if str(road['id']) not in road_ids or str(road['id']) in old_road_ids:
            continue
        axis = LineString([project(p) for p in road['coordinates']])
        clip = axis.intersection(selection).difference(reserved).difference(protected_pavement)
        whole = axis.difference(clip).length < .02
        if whole:
            fully_replaced.append(str(road['id']))
        for i, line in enumerate(clip.geoms if hasattr(clip, 'geoms') else [clip]):
            if line.geom_type != 'LineString' or line.length < .8:
                continue
            row = dict(road)
            row.update({'id': str(road['id']) + ('' if whole else '-fragment-' + str(i)),
                        'sourceId': str(road['id']), 'sourceCoordinates': road['coordinates'],
                        'coordinates': [geographic(p) for p in line.coords],
                        'contextComponent': 'berenguer-entorno', 'replacesWholeSource': whole})
            roads.append(row)
    context = {
        'schemaVersion': 1, 'id': 'berenguer-context', 'coordinate': site['coordinate'],
        'researchDate': '2026-11-19', 'districtOutline': [geographic(p) for p in selection.exterior.coords],
        'districtOutlineSource': 'Render selection: 38 m around the mapped palace and western annex, not a historic district boundary.',
        'selectionRadiusM': 38, 'provenanceTextCodes': cartography.get('provenanceTextCodes', {}),
        'coreBuildings': core, 'associatedBuildings': associated, 'buildings': buildings,
        'roads': roads, 'surfaces': [], 'internalRoads': internal_roads,
        'coreOwnership': {'sourceBuildingPartIds': sorted(core_ids), 'OSMBuildingId': '733321157',
                          'internalRoadIds': sorted(internal_road_ids),
                          'dianaForecourt': plaza_coordinates,
                          'annexParcelIdentification': 'Inferred from the municipal western-adjacency description and mapped parcel geometry; not an independent cadastral address certification.',
                          'annexState': 'Partial demolition, stabilization and archaeology documented in August 2025; June 2026 administrative record is not evidence of completed phase 2.'},
        'ownershipTransfers': transfers,
        'excludedBuildingIds': sorted({str(b['id']) for b in buildings} | set(duplicates)),
        'coreExcludedBuildingIds': sorted(core_ids | {'733321157'}),
        'excludedRoadIds': sorted(fully_replaced), 'protectedFootprints': protected,
        'focusCoordinates': {}, 'focusSpecs': {}, 'readingColor': '#80aa85',
        'facadeNote': 'Huellas, partes y patios catastrales conservados. Huecos, carpinterías, balcones y revocos de las viviendas colindantes son interpretativos; no son un levantamiento de fachadas.',
        'roofNote': 'Alturas estimadas del IGN MDS normalizado y plantas de Catastro. Colores de cubierta derivados de PNOA sin fecha de vuelo comprobada. Faldones y cumbreras interpretativos, sin cerrar patios cartografiados.',
        'pavingNote': 'Calles exteriores OSM recortadas contra edificios, patios, plazas y pavimentos ya detallados. Anchuras sin etiqueta estimadas; casa, anexo y plaza de Diana corresponden al modelo principal.',
        'preservationNote': 'Conserva Santa María, Plaça Major, Judería y Calvario; traspasa únicamente las tres partes identificadas de casa/anexo desde sus propietarios anteriores. No aplana el MDT para las viviendas exteriores.',
        'sources': [
            {'id':'berenguer-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado; no información catastral oficial'},
            {'id':'berenguer-context-osm','title':'OpenStreetMap · Casa dels Berenguer y calles próximas','url':'https://www.openstreetmap.org/way/733321157','license':'© OpenStreetMap contributors · ODbL 1.0'},
            {'id':'berenguer-context-mdt','title':'IGN MDT y MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY 4.0'},
            {'id':'berenguer-context-pnoa','title':'PNOA Máxima Actualidad','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY 4.0'},
            {'id':'berenguer-context-diana','title':'SKRQ · Urbanización y mejora del entorno del Templo de Diana','url':'https://skrq.es/es/diana.html'},
            {'id':'berenguer-context-anexo','title':'Ayuntamiento · Fin de la primera fase del anexo','url':'https://aytosagunto.es/es/actualidad/2025-08-04-concluye-la-primera-fase-de-las-obras-en-el-inmueble-anexo-a-la-casa-dels-berenguer/','date':'2025-08-04'}
        ],
        'selectionStats': {'contextParts':len(buildings),'contextParcels':len(chosen),
                           'mappedCourtyards':sum(len(b.get('holes',[])) for b in buildings),
                           'roads':len(roads),'fullyReplacedRoads':len(fully_replaced),
                           'OSMDuplicates':duplicates,'retainedOwners':list(owners),'rejectedParcels':rejected},
        'inputHashes': {n:hashlib.sha256((DATA/(n+'.json')).read_bytes()).hexdigest()
                       for n in ['cartography','landmarks',*[name+'-context' for name in owners]]}
    }
    prepare_pavement(context, cartography, reserved, protected_pavement)
    (DATA/'berenguer-context.json').write_text(json.dumps(context, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(context['selectionStats'], ensure_ascii=False))
    return context


def prepare_pavement(context, cartography, reserved, retained):
    candidates = unary_union([LineString([project(p) for p in r['coordinates']])
                             .buffer(width(r)/2, cap_style='round', join_style='mitre',
                                     mitre_limit=2, quad_segs=4) for r in context['roads']])
    obstacles = unary_union([polygon(b) for b in cartography['buildings'] if b.get('parentId')]
                            + [polygon(b) for b in context['protectedFootprints']])
    courtyards = unary_union([Polygon(ring) for p in polygons(obstacles) for ring in p.interiors])
    protected = unary_union([reserved, retained])
    paving = candidates.difference(obstacles).difference(protected).difference(courtyards)
    vertices, lookup, indices, emitted = [], {}, [], []
    def vertex(p):
        key = (round(p[0],6),round(p[1],6))
        if key not in lookup:
            lookup[key] = len(vertices)
            vertices.append(list(key))
        return lookup[key]
    if not paving.is_empty:
        ax, az, bx, bz = paving.bounds
        for ix in range(math.floor(ax/2.5),math.ceil(bx/2.5)):
            for iz in range(math.floor(az/2.5),math.ceil(bz/2.5)):
                x,z=ix*2.5,iz*2.5
                if not paving.intersects(box(x,z,x+2.5,z+2.5)):
                    continue
                for cell in [Polygon([(x,z),(x,z+2.5),(x+2.5,z+2.5)]),
                             Polygon([(x,z),(x+2.5,z+2.5),(x+2.5,z)])]:
                    for piece in polygons(paving.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area < 1e-9:
                                continue
                            ids = [vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids)) == 3:
                                indices += ids
                                emitted.append(Polygon([vertices[i] for i in ids]))
    boundary=[]
    for poly in polygons(paving):
        for ring in [poly.exterior,*poly.interiors]:
            points=list(ring.coords)
            for a,b in zip(points,points[1:]):
                dx,dz=b[0]-a[0],b[1]-a[1];ts={0.,1.}
                for origin,delta in [(a[0],dx),(a[1],dz),(a[1]-a[0],dz-dx)]:
                    if abs(delta)<1e-10:
                        continue
                    lo,hi=sorted([origin,origin+delta])
                    for k in range(math.floor(lo/2.5)+1,math.ceil(hi/2.5)):
                        t=(k*2.5-origin)/delta
                        if 1e-8<t<1-1e-8:ts.add(t)
                ids=[vertex((a[0]+dx*t,a[1]+dz*t)) for t in sorted(ts)]
                boundary += [[u,v] for u,v in zip(ids,ids[1:]) if u!=v]
    actual=unary_union(emitted)
    report={'method':'Source street buffers joined, clipped to cadastral walls, private courts and retained owners; triangulated on the exact 2.5 m terrain mesh.',
            'areaM2':paving.area,'triangles':len(emitted),'vertices':len(vertices),
            'uncoveredAreaM2':paving.difference(actual).area,'excessAreaM2':actual.difference(paving).area,
            'buildingOverlapM2':actual.intersection(obstacles).area,
            'privateCourtyardOverlapM2':actual.intersection(courtyards).area,
            'protectedPavingOverlapM2':actual.intersection(protected).area,
            'triangleOverlapM2':sum(p.area for p in emitted)-actual.area,
            'boundaryEdges':len(boundary)}
    report['pass']=all(abs(report[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','buildingOverlapM2',
        'privateCourtyardOverlapM2','protectedPavingOverlapM2','triangleOverlapM2'])
    assert report['pass'],report
    context['pavementMesh']={'coordinateSystem':'Atlas x/z metres; origin [-0.278,39.679].',
        'terrainGrid':{'spacingM':2.5,'originXZ':[0,0],'diagonal':'x=z within each cell'},
        'method':report['method'],'vertices':vertices,
        'groups':[{'component':'berenguer-entorno','indices':indices,
                   'sourceIds':sorted({r['sourceId'] for r in context['roads']})}],
        'boundaryEdges':boundary,'coverage':report}
    context['pavingNote']+=' Superficie continua ajustada a los triángulos finales del relieve, con holgura gráfica de 10,5 cm y bordes cerrados.'
    OUT.mkdir(exist_ok=True)
    (OUT/'berenguer-context-pavement-qa.json').write_text(json.dumps(report,indent=2)+'\n')


if __name__=='__main__':
    build_context()
