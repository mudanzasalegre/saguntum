"""Derive a single public paving envelope around the church from source limits.

Authoring dependency: Shapely. Production uses only the resulting JSON rings.
This does not change the source MDT, roads or cadastral footprints.
"""
import json
import math
from pathlib import Path

from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

root = Path(__file__).resolve().parents[1]
data_root = root / 'dist/assets/data'
read = lambda name: json.loads((data_root / f'{name}.json').read_text())
context = read('santa-maria-context')
plaza = read('plaza-mayor-context')
cartography = read('cartography')
landmarks = read('landmarks')
anchor = context['coordinate']
yaw = 1.173
c, s = math.cos(yaw), math.sin(yaw)
lon_scale = 111320 * math.cos(math.radians(39.679))


def local(coordinate):
    x = (coordinate[0] - anchor[0]) * lon_scale
    z = (anchor[1] - coordinate[1]) * 111320
    return x * c - z * s, x * s + z * c


def coordinate(point):
    x, z = point
    return [round(anchor[0] + (x * c + z * s) / lon_scale, 10),
            round(anchor[1] - (-x * s + z * c) / 111320, 10)]


def polygon(record, holes=False):
    outline = record.get('coordinates', record.get('footprint', []))
    if len(outline) < 3:
        return Polygon()
    p = Polygon([local(q) for q in outline],
                [[local(q) for q in h] for h in record.get('holes', [])] if holes else [])
    return p if p.is_valid else p.buffer(0)


roads = [r for r in context['roads'] if str(r['id']) in {'87554148', '1365045257', '1204891837'}]
lines = [LineString([local(q) for q in road['coordinates']]) for road in roads]
# The broad search is limited to the north flank and the Sagrari return shown
# in the review. The rest of Sagrari keeps the previous 3.4 m centre-line width.
# These search buffers are not surveyed widths; mapped boundaries clip them.
search_parts = []
for road, line in zip(roads, lines):
    if str(road['id']) == '87554148':
        search_parts.append(line.buffer(1.7, cap_style='flat', join_style='mitre'))
        search_parts.append(line.buffer(8, cap_style='flat', join_style='mitre').intersection(box(4, -80, 70, 60)))
    else:
        search_parts.append(line.buffer(8 if str(road['id']) == '1365045257' else .8, cap_style='flat', join_style='mitre'))
search_envelope = unary_union(search_parts)
blockers = [polygon(b) for b in cartography['buildings']]
blockers += [polygon(s) for s in landmarks['sites'] if s['id'] in {'santa-maria', 'berenguer', 'diana'}]
blockers += [box(19.58, -8.23, 23.79, 10.58)]
obstacles = unary_union([p for p in blockers if not p.is_empty and p.intersects(search_envelope)])
owned_surfaces = unary_union([polygon(p, holes=True) for p in [*plaza['surfaces'], *context['surfaces']]])
envelope = search_envelope.difference(obstacles).difference(owned_surfaces)
polygons = list(envelope.geoms) if hasattr(envelope, 'geoms') else [envelope]
roads_near = unary_union(lines).buffer(.25)
# Ignore disconnected slivers on the far side of closed parcels.
envelope = unary_union([p for p in polygons if p.area > .2 and p.intersects(roads_near)])
cavallers = box(18, -80, 55, 15)
sectors = [('cavallers', envelope.intersection(cavallers)),
           ('sagrario', envelope.difference(cavallers))]
surfaces = []
for component, geometry in sectors:
    parts = list(geometry.geoms) if hasattr(geometry, 'geoms') else [geometry]
    for i, part in enumerate(sorted((p for p in parts if p.area > .02), key=lambda p: (-p.area, p.centroid.x))):
        surfaces.append({
            'id': f'santa-maria-pavimento-{component}-{i}',
            'component': f'santa-maria-{component}',
            'coordinates': [coordinate(q) for q in part.exterior.coords],
            'holes': [[coordinate(q) for q in ring.coords] for ring in part.interiors],
            'sourceIds': ['1365045257', '87554148', '1204891837'],
            'derived': True,
            'derivation': 'Continuous paving around OSM street axes, clipped to cadastral/church/stair boundaries and the existing Plaza Mayor, Pescadería and Cervantes paving. The search envelope is not a surveyed road width.',
            'areaM2': round(part.area, 3)
        })

context['corridorSurfaces'] = surfaces
context['corridorRoadIds'] = [str(r['id']) for r in roads]
context['streetNote'] = ('Cavallers y Sagrari se leen como calles pavimentadas continuas entre las huellas del templo, la escalinata y las parcelas vecinas. '
                         'La cobertura se recorta en el encuentro con las plazas Mayor, Pescadería y Cervantes. La rasante sigue el terreno de presentación derivado del MDT; anchuras de encuentro y acabado son interpretativos, no un levantamiento de urbanización.')
(data_root / 'santa-maria-context.json').write_text(json.dumps(context, ensure_ascii=False, indent=2) + '\n')

probe_points = [(22.51, 18.07), (25.92, 17.03), (28.19, 18.04),
                (15.34, 19.13), (8.10, 17.66), (7.26, 16.47)]
from shapely.geometry import Point
report = {'surfaceCount': len(surfaces), 'areaM2': round(envelope.area, 3),
          'overlapWithPlazaM2': envelope.intersection(owned_surfaces).area,
          'overlapWithBuildingsM2': envelope.intersection(obstacles).area,
          'darkStripProbes': [{'local': p, 'covered': envelope.covers(Point(p))} for p in probe_points]}
(root / 'research/validation-v47/santa-maria-corridor-polygon-qa.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
