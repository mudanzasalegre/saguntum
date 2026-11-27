"""Prepare disjoint park surfaces from the traced, explicitly approximate plan.

The public paths, planting and archaeological display are different surfaces;
the real concave parcel is never replaced by a rectangular excavation.
Run with PYTHONPATH pointing at Shapely when it is not installed globally.
"""
import json
import sys
from pathlib import Path
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union
from shapely import constrained_delaunay_triangles

ROOT = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist/assets/data/forum-plaza-context.json'
data = json.loads(source.read_text())
layout = data.get('layout', data)
features = {row['id']: row for row in layout['features']}
core = Polygon(layout['sourceBoundary']['local']).buffer(0)

def poly(name):
    return Polygon(features[name]['local']).buffer(0).intersection(core)

def path(points, width):
    return LineString(points).buffer(width / 2, cap_style=2, join_style=2).intersection(core)

def rows(shape):
    if shape.is_empty:
        return []
    if shape.geom_type == 'Polygon':
        return [shape]
    return [p for p in shape.geoms if p.geom_type == 'Polygon' and p.area > .015]

east = features['east-ramp']['local']
west = [[-.7, 7.8], [2.3, 13.1]]
north = [[20.6, 5.8], [20.7, 13.1]]
south = [[29.7, 31.8], [29.4, 41.5]]
routes = [
    dict(id='rampa-ordonez', points=east, width=2.3, start=0, end=-2.43, stairs=False),
    dict(id='escalera-remei', points=west, width=2.1, start=0, end=-2.43, stairs=True),
    dict(id='escalera-horts', points=north, width=2.1, start=0, end=-2.43, stairs=True),
    dict(id='escalera-sur', points=south, width=2.8, start=-2.43, end=0, stairs=True),
]
route_shapes = [path(row['points'], row['width']) for row in routes]
route_union = unary_union(route_shapes)
archaeology = poly('archaeology-bed').union(box(1.2, 13.7, 13.4, 18.6)).intersection(core)
upper = core.intersection(box(-10, -1, 45, 11.25)).difference(route_union)
south_landing = core.intersection(box(27.5, 41.25, 45, 45)).difference(route_union)
play = poly('playground').intersection(upper)
garden_specs = [
    ('jardin-noroeste', poly('northwest-green').intersection(upper).difference(path([[-1, 5.9], [18.5, 5.9]], 1.75)), -.12),
    ('jardin-norte', poly('north-central-green').intersection(upper), -.15),
    ('jardin-sureste', poly('southeast-green').difference(south_landing).difference(route_union), -.35),
    ('jardin-central', Polygon([[30.4,12.0],[36.6,12.5],[38.1,20.8],[34.9,22.5],[34.8,17.8],[30.4,15.3]]).difference(route_union), -1.15),
]
garden_specs = [(name, shape.difference(archaeology).difference(play), level) for name, shape, level in garden_specs]
gardens = unary_union([q[1] for q in garden_specs])
lower = core.difference(unary_union([upper, south_landing, route_union, gardens, archaeology]))
upper_paving = upper.difference(unary_union([gardens, play]))

surfaces = []
def add(name, shape, level, material, walk=False, component='accesos', period='parque'):
    for i, p in enumerate(rows(shape)):
        surfaces.append(dict(id=name + ('-' + str(i) if i else ''), component=component, period=period,
          level=level, material=material, publicWalkingSurface=walk,
          outline=[[round(x, 6), round(y, 6)] for x, y in list(p.exterior.coords)[:-1]],
          holes=[[[round(x, 6), round(y, 6)] for x, y in list(r.coords)[:-1]] for r in p.interiors],
          triangles=[[[round(x, 6), round(y, 6)] for x, y in list(t.exterior.coords)[:3]]
                     for t in constrained_delaunay_triangles(p).geoms]))

add('restos-expuestos', archaeology.difference(Point(27.45,21.03).buffer(1.07, quad_segs=24)), -2.5, 'gravel', False, 'recinto', 'romana')
add('paseo-inferior', lower, -2.43, 'pinkConcrete', True)
add('plataforma-superior', upper_paving, 0, 'paving', True)
add('acceso-sur', south_landing, 0, 'paving', True)
add('juegos', play, -.005, 'rubber', True, 'jardin')
for name, shape, level in garden_specs:
    add(name, shape, level, 'plantSoil', False, 'jardin')

result = dict(origin=layout['registration']['origin'], yaw=layout['registration']['yawRadians'],
    core=layout['sourceBoundary']['local'], surfaces=surfaces, routes=routes,
    provenance='Manual PNOA / municipal photographs registration, not an excavation survey. Relative floor −2.50 m published by Ayuntamiento de Sagunto (2015).')
target = ROOT / 'dist/js/forum-plaza-surfaces.js'
target.write_text('// V52 · Disjoint display surfaces; prepared by research/validation-v52/prepare_forum_surfaces.py.\n'
    + 'export const FORUM_PLAZA_SURFACES = ' + json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ';\n')
areas = [Polygon(row['outline'], row['holes']).buffer(0) for row in surfaces]
overlap = sum(a.intersection(b).area for i, a in enumerate(areas) for b in areas[i+1:])
coverage = unary_union(areas + route_shapes + [Point(27.45,21.03).buffer(1.07, quad_segs=24)])
qa = dict(coreAreaM2=core.area, surfaceCount=len(surfaces), routeCount=len(routes),
    surfaceOverlapM2=overlap, uncoveredM2=core.difference(coverage).area, outsideM2=coverage.difference(core).area,
    levels='Relative display levels; published archaeological depth, estimated ramp/stair profiles')
(ROOT/'research/validation-v52/forum-surface-qa.json').write_text(json.dumps(qa, indent=2) + '\n')
print(json.dumps(qa))
