"""Join the external street buffers on the terrain's exact 2.5 m triangles."""
from pathlib import Path
from collections import defaultdict
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
SCALE = 111320 * math.cos(math.radians(39.679))


def project(ll):
    return ((ll[0] + .278) * SCALE, (39.679 - ll[1]) * 111320)


def polygon(row):
    return Polygon([project(p) for p in row['coordinates']],
                   [[project(p) for p in r] for r in row.get('holes', [])]).buffer(0)


def width(road):
    try:
        return max(.7, min(18, float(road['width'])))
    except (KeyError, TypeError, ValueError):
        return {'living_street': 3.4, 'pedestrian': 3.1, 'footway': 1.6,
                'path': 1.4, 'steps': 1.4}.get(road.get('kind'), 4.5)


def polygons(shape):
    if shape.geom_type == 'Polygon' and shape.area > 1e-9:
        yield shape
    elif hasattr(shape, 'geoms'):
        for part in shape.geoms:
            yield from polygons(part)


def prepare(data_dir=DATA):
    read = lambda n: json.loads((data_dir / (n + '.json')).read_text())
    context, cartography = read('calvario-context'), read('cartography')
    district = polygon({'coordinates': context['districtOutline']})
    old_contexts = [read(n + '-context') for n in ['santa-maria', 'plaza-mayor', 'juderia']]
    sources, by_component = defaultdict(set), defaultdict(list)
    for road in context['roads']:
        component = road['contextComponent']
        shape = LineString([project(p) for p in road['coordinates']]).buffer(width(road)/2,
                cap_style='round', join_style='mitre', mitre_limit=2, quad_segs=4)
        by_component[component].append(shape)
        sources[component].add(road.get('sourceId', road['id']))
    candidates = unary_union([p for shapes in by_component.values() for p in shapes])
    obstacles = unary_union([polygon(b) for b in cartography['buildings'] if b.get('parentId')]
                            + [polygon(b) for b in context['protectedFootprints']])
    private_courtyards = unary_union([Polygon(r) for p in polygons(obstacles) for r in p.interiors])
    protected = [district]
    for old in old_contexts:
        if old.get('pavementMesh'):
            mesh = old['pavementMesh']
            for group in mesh['groups']:
                ids = group['indices']
                protected.extend(Polygon([mesh['vertices'][i] for i in ids[n:n+3]])
                                 for n in range(0, len(ids), 3))
        else:
            protected.extend(polygon(s) for s in old.get('surfaces', []))
            for road in old.get('roads', []):
                if road.get('area') != 'yes':
                    protected.append(LineString([project(p) for p in road['coordinates']])
                                     .buffer(width(road)/2, cap_style='flat'))
    protected = unary_union(protected)
    paving = candidates.difference(obstacles).difference(protected).difference(private_courtyards)
    x0, z0, x1, z1 = paving.bounds
    assert -360 < x0 < x1 < 620 and -180 < z0 < z1 < 550
    vertices, index, emitted, groups = [], {}, [], []

    def vertex(p):
        key = (round(p[0], 6), round(p[1], 6))
        if key not in index:
            index[key] = len(vertices)
            vertices.append(list(key))
        return index[key]

    assigned = Polygon()
    for component, shapes in by_component.items():
        shape = unary_union(shapes).intersection(paving).difference(assigned)
        assigned = unary_union([assigned, shape])
        if shape.is_empty:
            continue
        indices = []
        ax, az, bx, bz = shape.bounds
        for ix in range(math.floor(ax/2.5), math.ceil(bx/2.5)):
            for iz in range(math.floor(az/2.5), math.ceil(bz/2.5)):
                x, z = ix*2.5, iz*2.5
                if not shape.intersects(box(x, z, x+2.5, z+2.5)):
                    continue
                for cell in [Polygon([(x,z), (x,z+2.5), (x+2.5,z+2.5)]),
                             Polygon([(x,z), (x+2.5,z+2.5), (x+2.5,z)])]:
                    for piece in polygons(shape.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area < 1e-9:
                                continue
                            ids = [vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids)) == 3:
                                indices += ids
                                emitted.append(Polygon([vertices[i] for i in ids]))
        groups.append({'component': component, 'indices': indices, 'sourceIds': sorted(sources[component])})

    boundary_edges = []
    for p in polygons(paving):
        for ring in [p.exterior, *p.interiors]:
            pts = list(ring.coords)
            for a, b in zip(pts, pts[1:]):
                dx, dz = b[0]-a[0], b[1]-a[1]
                ts = {0., 1.}
                for origin, delta in [(a[0],dx), (a[1],dz), (a[1]-a[0],dz-dx)]:
                    if abs(delta) < 1e-10:
                        continue
                    lo, hi = sorted([origin, origin+delta])
                    for k in range(math.floor(lo/2.5)+1, math.ceil(hi/2.5)):
                        t = (k*2.5-origin)/delta
                        if 1e-8 < t < 1-1e-8:
                            ts.add(t)
                ids = [vertex((a[0]+dx*t, a[1]+dz*t)) for t in sorted(ts)]
                boundary_edges += [[u,v] for u,v in zip(ids,ids[1:]) if u != v]
    actual = unary_union(emitted)
    report = {'method': 'Whole-polyline buffers, polygon union, cadastral and retained-owner clipping, exact 2.5 m terrain triangle intersections.',
              'areaM2': paving.area, 'triangles': len(emitted), 'vertices': len(vertices),
              'uncoveredAreaM2': paving.difference(actual).area, 'excessAreaM2': actual.difference(paving).area,
              'buildingOverlapM2': actual.intersection(obstacles).area,
              'privateCourtyardOverlapM2': actual.intersection(private_courtyards).area,
              'protectedPavingOverlapM2': actual.intersection(protected).area,
              'triangleOverlapM2': sum(p.area for p in emitted)-actual.area,
              'boundaryEdges': len(boundary_edges)}
    report['pass'] = all(abs(report[k]) < .001 for k in ['uncoveredAreaM2','excessAreaM2',
        'buildingOverlapM2','privateCourtyardOverlapM2','protectedPavingOverlapM2','triangleOverlapM2'])
    assert report['pass'], report
    context['pavementMesh'] = {'coordinateSystem': 'Atlas x/z metres; origin [-0.278,39.679].',
        'terrainGrid': {'spacingM': 2.5, 'originXZ': [0,0], 'diagonal': 'x=z within each cell'},
        'method': report['method'], 'vertices': vertices, 'groups': groups, 'boundaryEdges': boundary_edges,
        'coverage': report}
    context['pavingNote'] += ' Superficie continua sobre los mismos triángulos del terreno, con holgura gráfica de 10,5 cm; sin relleno de patios ni invasión del recinto.'
    (data_dir/'calvario-context.json').write_text(json.dumps(context, ensure_ascii=False, indent=2)+'\n')
    (ROOT/'research/validation-v12/calvario-pavement-coverage-qa.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))


if __name__ == '__main__':
    prepare()
