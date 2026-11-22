"""Create continuous, footprint-clipped paving on the atlas terrain triangulation.

Widths without an OSM tag remain schematic. This fixes topology; it does not
claim a surveyed curb or substitute a flat surface for the source terrain.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import math

import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
SCALE = 111320 * math.cos(math.radians(39.679))
DEFAULT_WIDTHS = {'trunk': 9, 'primary': 8, 'secondary': 7, 'tertiary': 5.8,
                  'residential': 4.5, 'unclassified': 4.5, 'living_street': 3.4,
                  'service': 3.2, 'pedestrian': 3.1, 'track': 2.4,
                  'cycleway': 1.9, 'footway': 1.6, 'path': 1.4, 'steps': 1.4}


def project(ll):
    return ((ll[0] + .278) * SCALE, (39.679 - ll[1]) * 111320)


def polygon(row):
    return Polygon([project(p) for p in row['coordinates']],
                   [[project(p) for p in h] for h in row.get('holes', [])]).buffer(0)


def width(road):
    try:
        w = float(road.get('width'))
        if w > 0:
            return min(18, max(.7, w))
    except (TypeError, ValueError):
        pass
    return DEFAULT_WIDTHS.get(road.get('kind'), 2)


def polygons(shape):
    if shape.geom_type == 'Polygon':
        if shape.area > 1e-9:
            yield shape
    elif hasattr(shape, 'geoms'):
        for p in shape.geoms:
            yield from polygons(p)


def prepare(data_dir=DATA):
    read = lambda name: json.loads((data_dir / (name + '.json')).read_text())
    context, cartography = read('juderia-context'), read('cartography')
    old_contexts = [read('santa-maria-context'), read('plaza-mayor-context')]
    by_component = defaultdict(list)
    component_sources = defaultdict(set)
    for road in context['roads']:
        if road.get('area') == 'yes':
            continue
        axis = LineString([project(p) for p in road['coordinates']])
        # One polygon per complete polyline, with proper joins at each bend.
        # Round caps connect source fragments and crossroads before the union.
        p = axis.buffer(width(road) / 2, quad_segs=4, cap_style='round',
                        join_style='mitre', mitre_limit=2)
        component = road.get('contextComponent', 'juderia-pavimento')
        by_component[component].append(p)
        component_sources[component].add(str(road.get('sourceId', road['id'])))
    for area in context['surfaces']:
        component = area.get('component', 'juderia-pavimento')
        by_component[component].append(polygon(area))
        component_sources[component].add(str(area.get('sourceId', area['id'])))

    candidates = unary_union([p for shapes in by_component.values() for p in shapes])
    # Prefer cadastral boundaries over duplicate OSM house envelopes. Include
    # retained monument owners so no new paving is introduced into their floors.
    buildings = [polygon(b) for b in cartography['buildings'] if b.get('parentId')]
    buildings += [polygon(b) for b in context['protectedFootprints']]
    obstacle_envelope = candidates.buffer(1.2)
    obstacles = unary_union([p for p in buildings if p.intersects(obstacle_envelope)])
    # In the photographed first lane of Sang Vella, the untagged 3.1 m default
    # leaves a narrow strip of aerial-photo ground between paving and facades.
    # Close only that documented lane's small facade-side gaps. This is a
    # bounded display-width inference, not a new surveyed road width. Keep
    # all other source buffers, courtyards and building footprints unchanged.
    lane = next(r for r in context['roads'] if r.get('sourceId') == '1365045242')
    lane_axis = LineString([project(p) for p in lane['coordinates']])
    lane_nominal = lane_axis.buffer(width(lane) / 2, quad_segs=4, cap_style='round',
                                   join_style='mitre', mitre_limit=2)
    gap_limit = 1.2
    lane_limit = lane_axis.buffer(width(lane) / 2 + gap_limit, cap_style='flat',
                                 join_style='mitre', mitre_limit=2)
    private_courtyards = unary_union([Polygon(r) for p in buildings for r in p.interiors])
    facade_band = obstacles.buffer(gap_limit, join_style='mitre').difference(obstacles)
    possible_infill = lane_limit.intersection(facade_band).difference(private_courtyards)
    free_lane = lane_nominal.difference(obstacles)
    joined = unary_union([free_lane, possible_infill])
    connected_infill = unary_union([p for p in polygons(joined) if p.intersects(free_lane)])
    infill = connected_infill.difference(free_lane).difference(candidates)
    by_component[lane['contextComponent']].append(infill)
    candidates = unary_union([candidates, infill])
    protected_paving = []
    for old in old_contexts:
        protected_paving.extend(polygon(s) for s in old.get('surfaces', []))
        for road in old.get('roads', []):
            if road.get('area') != 'yes':
                protected_paving.append(LineString([project(p) for p in road['coordinates']])
                                         .buffer(width(road) / 2, cap_style='flat'))
    protected = unary_union(protected_paving)
    paving = candidates.difference(obstacles).difference(protected)
    # A facade-side infill can encircle a tiny free sliver where two road
    # buffers meet. Close only small holes in this lane with no building,
    # courtyard or retained paving inside; never fill mapped urban courtyards.
    small_lane_holes = []
    for p in polygons(paving):
        for ring in p.interiors:
            hole = Polygon(ring)
            if (1e-6 < hole.area < .25 and lane_limit.covers(hole)
                    and hole.intersection(obstacles).area < 1e-8
                    and hole.intersection(private_courtyards).area < 1e-8
                    and hole.intersection(protected).area < 1e-8):
                small_lane_holes.append(hole)
    if small_lane_holes:
        by_component[lane['contextComponent']].extend(small_lane_holes)
        paving = unary_union([paving, *small_lane_holes])

    # All these streets lie inside the regular historic-centre grid in
    # terrain.js: 2.5 m spacing, x/z origin congruent to 0, diagonal x=z in
    # each cell. Intersect with BOTH triangles, not only with their square.
    # Then ground(x,z) is affine on every emitted face, including edge splits.
    min_x, min_z, max_x, max_z = paving.bounds
    assert min_x > -360 and max_x < 620 and min_z > -180 and max_z < 550
    vertices, vertex_index = [], {}

    def vertex(p):
        key = (round(p[0], 6), round(p[1], 6))
        if key not in vertex_index:
            vertex_index[key] = len(vertices)
            vertices.append(list(key))
        return vertex_index[key]

    mesh_groups, all_emitted, assigned = [], [], Polygon()
    for component, shapes in by_component.items():
        shape = unary_union(shapes).intersection(paving).difference(assigned)
        assigned = unary_union([assigned, shape])
        if shape.is_empty:
            continue
        indices = []
        x0, z0, x1, z1 = shape.bounds
        for ix in range(math.floor(x0 / 2.5), math.ceil(x1 / 2.5)):
            for iz in range(math.floor(z0 / 2.5), math.ceil(z1 / 2.5)):
                x, z = ix * 2.5, iz * 2.5
                square = box(x, z, x + 2.5, z + 2.5)
                if not shape.intersects(square):
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
                                all_emitted.append(Polygon([vertices[i] for i in ids]))
        mesh_groups.append({'component': component, 'indices': indices,
                            'sourceIds': sorted(component_sources[component])})

    # No interior per-segment skirts. Only the outer boundary gets a thin edge.
    # Split it where it meets the exact terrain grid so it follows the same slope.
    boundary_edges = []
    for p in polygons(paving):
        for ring in [p.exterior, *p.interiors]:
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
                boundary_edges.extend([u, v] for u, v in zip(ids, ids[1:]) if u != v)

    actual = unary_union(all_emitted)
    known_gaps = [{'id': 'sang-vella-visible-wedge', 'point': [-19.1944701, 89.0549997]},
                  {'id': 'portalet-visible-wedge', 'point': [-.5937627, 91.7990675]},
                  {'id': 'sang-vella-facade-margin-a', 'point': [-21.49068, 88.57841]},
                  {'id': 'sang-vella-facade-margin-b', 'point': [-20.60465, 89.17919]},
                  {'id': 'sang-vella-segovia-free-sliver', 'point': [-22.417127, 87.550322]}]
    for sample in known_gaps:
        sample['covered'] = actual.covers(Point(sample['point']))
    report = {
        'method': 'Whole-polyline buffers with miter joins, union, exact cadastral clipping, non-overlapping component ownership, intersection with terrain triangles.',
        'areaM2': paving.area,
        'triangleAreaM2': sum(p.area for p in all_emitted),
        'uncoveredAreaM2': paving.difference(actual).area,
        'excessAreaM2': actual.difference(paving).area,
        'buildingOverlapM2': actual.intersection(obstacles).area,
        'protectedPavingOverlapM2': actual.intersection(protected).area,
        'triangleOverlapM2': sum(p.area for p in all_emitted) - actual.area,
        'vertices': len(vertices), 'triangles': len(all_emitted),
        'boundaryEdges': len(boundary_edges), 'knownVisibleGaps': known_gaps,
        'visualFacadeInfill': {'sourceId': '1365045242', 'axisLengthM': lane_axis.length,
                              'maximumGapM': gap_limit, 'areaM2': infill.intersection(paving).area,
                              'smallFreeHolesClosed': len(small_lane_holes),
                              'smallFreeHoleAreaM2': sum(h.area for h in small_lane_holes),
                              'courtyardOverlapM2': infill.intersection(private_courtyards).area,
                              'interpretation': 'Local closure of untagged width gaps to adjoining cadastral facades; not a measured curb. Other street widths remain unchanged.'},
        'inputHashes': {name: hashlib.sha256((data_dir / name).read_bytes()).hexdigest()
                        for name in ['cartography.json', 'santa-maria-context.json', 'plaza-mayor-context.json']}
    }
    report['pass'] = (report['uncoveredAreaM2'] < .001 and report['excessAreaM2'] < .001
                      and report['buildingOverlapM2'] < .001
                      and report['protectedPavingOverlapM2'] < .001
                      and abs(report['triangleOverlapM2']) < .001
                      and report['visualFacadeInfill']['courtyardOverlapM2'] < .001
                      and all(p['covered'] for p in known_gaps))
    assert report['pass'], report
    context['pavementMesh'] = {
        'coordinateSystem': 'Atlas x/z metres; origin [-0.278,39.679], EPSG:4326 local equirectangular projection.',
        'terrainGrid': {'spacingM': 2.5, 'originXZ': [0, 0], 'diagonal': 'x=z within each cell'},
        'method': report['method'], 'vertices': vertices, 'groups': mesh_groups,
        'boundaryEdges': boundary_edges, 'coverage': {k: v for k, v in report.items() if k != 'inputHashes'}
    }
    context['pavingNote'] = ('Ejes viarios OSM unidos en sus giros y cruces, recortados contra huellas catastrales '
                             'y pavimentos anteriores. Las caras siguen los triángulos de la malla final del terreno '
                             'con una capa de 10,5 cm; anchuras sin etiqueta y despiece aproximados. '
                             'En el primer callejón de Sang Vella se cierran márgenes estrechos hasta fachadas catastrales, '
                             'sin invadir patios; este ajuste local de anchura es interpretativo.')
    (data_dir / 'juderia-context.json').write_text(json.dumps(context, ensure_ascii=False, indent=2) + '\n')
    report['contextHash'] = hashlib.sha256((data_dir / 'juderia-context.json').read_bytes()).hexdigest()
    (ROOT / 'research/validation-v11/juderia-pavement-coverage-qa.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    prepare()
