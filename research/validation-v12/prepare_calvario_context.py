"""Derive the Calvario surroundings from the atlas's attributed source geometry.

The enclosure and its procession route belong to calvario.js. This file owns
only surrounding cadastral houses and the external streets, preserving every
earlier detailed monument and neighbourhood owner.
"""
from pathlib import Path
from collections import defaultdict
import json
import math
import hashlib
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
SCALE = 111320 * math.cos(math.radians(39.679))
read = lambda n: json.loads((DATA / (n + '.json')).read_text())
project = lambda ll: ((ll[0] + .278) * SCALE, (39.679 - ll[1]) * 111320)
geographic = lambda xz: [round(-.278 + xz[0] / SCALE, 9), round(39.679 - xz[1] / 111320, 9)]


def polygon(row):
    return Polygon([project(p) for p in row['coordinates']],
                   [[project(p) for p in r] for r in row.get('holes', [])]).buffer(0)


def width(road):
    try:
        return max(.7, min(18, float(road['width'])))
    except (KeyError, TypeError, ValueError):
        return {'living_street': 3.4, 'pedestrian': 3.1, 'footway': 1.6,
                'path': 1.4, 'steps': 1.4}.get(road.get('kind'), 4.5)


cartography, landmarks = read('cartography'), read('landmarks')
sites = {s['id']: s for s in landmarks['sites']}
site = sites['calvario']
old_contexts = {n: read(n + '-context') for n in ['santa-maria', 'plaza-mayor', 'juderia']}
district = polygon({'coordinates': site['districtBoundary']})
selection = district.buffer(30)

protected = []
protected_ids = set()
for owner, old in old_contexts.items():
    protected_ids.update(map(str, old['excludedBuildingIds']))
    for b in old['buildings'] + old.get('coreBuildings', []):
        for i, part in enumerate([b, *b.get('secondaryFootprints', [])]):
            protected.append({'id': str(b['id']) + '-component-' + str(i),
                              'coordinates': part['coordinates'], 'holes': part.get('holes', []),
                              'owner': owner})
for monument in landmarks['sites']:
    if len(monument.get('footprint', [])) < 3:
        continue
    protected.append({'id': monument['id'], 'coordinates': monument['footprint'],
                      'owner': 'existing-monument'})
for name in ['castlePolygon', 'theatrePolygon']:
    protected.append({'id': name, 'coordinates': cartography[name], 'owner': 'existing-monument'})
protected_union = unary_union([polygon(p) for p in protected])

# Select complete cadastral parents, not a house fragment solely because one
# corner touches the buffer. Parts belonging to a retained detailed owner are
# always protected. The chapel parcel is protected by its actual footprint.
by_parent = defaultdict(list)
for row in cartography['buildings']:
    if row.get('parentId'):
        by_parent[row['parentId']].append(row)
selected_parents, rejected = [], []
buildings = []
for parent, parts in by_parent.items():
    shape = unary_union([polygon(p) for p in parts])
    if shape.is_empty or not selection.intersects(shape):
        continue
    if not (selection.covers(shape.centroid) or shape.intersection(selection).area > shape.area * .5):
        continue
    if any(str(p['id']) in protected_ids for p in parts) or shape.intersection(protected_union).area > .25:
        rejected.append({'parentId': parent, 'reason': 'Retained monument or earlier detailed owner'})
        continue
    if shape.area > 1500 or shape.intersection(district).area > shape.area * .5:
        rejected.append({'parentId': parent, 'reason': 'Not an external domestic parcel'})
        continue
    selected_parents.append(parent)
    for part in parts:
        row = dict(part)
        centre = polygon(row).centroid
        row['contextComponent'] = ('calvario-caserio-norte' if centre.y < 45 else
                                   'calvario-caserio-oeste' if centre.x < -245 else
                                   'calvario-caserio-este' if centre.x > -180 else
                                   'calvario-caserio-sur')
        buildings.append(row)
selected_shape = unary_union([polygon(p) for p in buildings])
duplicates = []
for row in cartography['buildings']:
    if row.get('parentId') or str(row['id']) in protected_ids:
        continue
    shape = polygon(row)
    if shape.area > 0 and shape.intersection(selected_shape).area / shape.area > .7:
        duplicates.append(str(row['id']))

protected_paving = []
old_road_ids = set()
for old in old_contexts.values():
    old_road_ids.update(map(str, old.get('excludedRoadIds', [])))
    protected_paving += [polygon(s) for s in old.get('surfaces', [])]
    for road in old.get('roads', []):
        if road.get('area') != 'yes':
            protected_paving.append(LineString([project(p) for p in road['coordinates']]).buffer(width(road)/2, cap_style='flat'))
protected_paving_union = unary_union(protected_paving)
# Only mapped external public streets. No invented shortcut or station route.
road_ids = {'87552055', '87552080', '87552083', '87552084', '87555762',
            '163560100', '163560121', '163560124', '163560126', '1365045245'}
roads, replaced = [], []
for road in cartography['roads']:
    if str(road['id']) not in road_ids or str(road['id']) in old_road_ids:
        continue
    axis = LineString([project(p) for p in road['coordinates']])
    clip = axis.intersection(selection).difference(district).difference(protected_paving_union)
    whole = axis.difference(clip).length < .02
    if whole:
        replaced.append(str(road['id']))
    pieces = clip.geoms if hasattr(clip, 'geoms') else [clip]
    for i, line in enumerate(pieces):
        if line.geom_type != 'LineString' or line.length < 1:
            continue
        row = dict(road)
        row.update({'id': str(road['id']) + ('' if whole else '-fragment-' + str(i)),
                    'sourceId': str(road['id']), 'coordinates': [geographic(p) for p in line.coords],
                    'contextComponent': 'calvario-accesos-exteriores', 'replacesWholeSource': whole})
        roads.append(row)

context = {
    'schemaVersion': 1, 'id': 'calvario-context', 'coordinate': site['coordinate'],
    'researchDate': '2026-11-19', 'districtOutline': site['districtBoundary'],
    'provenanceTextCodes': cartography.get('provenanceTextCodes', {}),
    'districtOutlineSource': 'Existing OSM Calvario enclosure from the attributed landmark record.',
    'selectionRadiusM': 30, 'coreBuildings': [], 'buildings': buildings,
    'roads': roads, 'surfaces': [],
    'excludedBuildingIds': sorted({str(b['id']) for b in buildings} | set(duplicates)),
    'excludedRoadIds': sorted(replaced), 'protectedFootprints': protected,
    'focusCoordinates': {}, 'focusSpecs': {},
    'facadeNote': 'Huellas, partes y patios catastrales conservados. Los revocos, huecos, carpinterías y balcones de las viviendas de contexto son interpretativos; no son un levantamiento de fachadas.',
    'roofNote': 'Alturas estimadas a partir de IGN MDS normalizado o plantas catastrales. Colores de cubierta derivados de PNOA, con fecha de vuelo sin verificar. El renderizador aplica un mínimo visual de 2,5 m a cinco cuerpos cuya fuente indica 2 m. Faldones y cumbreras interpretativos, sin cerrar los patios cartografiados.',
    'pavingNote': 'Calles exteriores procedentes de OSM, recortadas al ámbito del Calvario y contra propietarios anteriores. Anchuras no etiquetadas interpretativas. El recinto y su zigzag pertenecen al modelo del Calvario.',
    'preservationNote': 'Conserva los modelos de Santa María, Plaça Major, judería, Teatro y Castillo; no aplana cimentaciones domésticas ni altera el MDT.',
    'sources': [
        {'id': 'calvario-context-catastro', 'title': 'Catastro INSPIRE Buildings · Sagunto/Sagunt', 'url': 'https://www.catastro.hacienda.gob.es/webinspire/', 'date': '2026-08-21', 'license': 'Producto derivado, no información catastral oficial'},
        {'id': 'calvario-context-osm', 'title': 'OpenStreetMap · Calvario de Sagunto y calles próximas', 'url': 'https://www.openstreetmap.org/way/733104780', 'license': '© OpenStreetMap contributors · ODbL 1.0'},
        {'id': 'calvario-context-mdt', 'title': 'IGN MDT y MDS normalizado', 'url': 'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado', 'license': 'IGN/CNIG · CC BY 4.0'},
        {'id': 'calvario-context-pnoa', 'title': 'PNOA Máxima Actualidad', 'url': 'https://www.ign.es/wms-inspire/pnoa-ma', 'license': 'IGN/CNIG · CC BY 4.0'}
    ],
    'selectionStats': {'contextParts': len(buildings), 'contextParcels': len(selected_parents),
                       'mappedCourtyards': sum(len(b.get('holes', [])) for b in buildings),
                       'roads': len(roads), 'fullyReplacedRoads': len(replaced),
                       'OSMDuplicates': duplicates, 'protectedFootprints': len(protected),
                       'retainedOwners': list(old_contexts), 'rejectedParcels': rejected},
    'inputHashes': {n: hashlib.sha256((DATA / (n + '.json')).read_bytes()).hexdigest()
                    for n in ['cartography', 'landmarks', 'santa-maria-context', 'plaza-mayor-context', 'juderia-context']}
}
(DATA / 'calvario-context.json').write_text(json.dumps(context, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(context['selectionStats'], ensure_ascii=False))
from prepare_calvario_pavement import prepare
prepare(DATA)
