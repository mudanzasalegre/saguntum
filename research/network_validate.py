"""Validate the exported street graph, clipping, routing and dry Palancia."""
from collections import Counter
import json
import math
from pathlib import Path
import sys
from pyproj import Geod, Transformer
from shapely import STRtree
from shapely.geometry import LineString, Point, Polygon

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'dist/assets/network'
index = json.loads((FOLDER/'index.json').read_text('utf-8'))
edges, nodes, counts, vertices = {}, {}, Counter(), Counter()
objects, dry_axes = [], []
def check(ok, message):
    if not ok:
        raise ValueError(message)

for tile in index['tiles']:
    data = json.loads((FOLDER/tile['url']).read_text('utf-8'))
    x0,z0,x1,z1 = tile['bounds']
    def inside(p):
        return x0-.06<=p[0]<=x1+.06 and z0-.06<=p[1]<=z1+.06
    for r in data['roads']:
        rid = r['id']
        check(rid not in edges, 'duplicate road edge '+rid)
        p = r['points']
        check(len(p)>1 and all(inside(q) for q in p), 'sector clipping '+rid)
        check(r['oneway'] in (-1,0,1),'invalid direction '+rid)
        for n,pt in ((r['a'],p[0]),(r['b'],p[-1])):
            check(nodes.setdefault(n,pt)==pt,'seam at '+n)
            vertices[n]+=1
        if 'deck' in r:
            check(r['bridge'] and len(p)==len(r['deck']) and all(math.isfinite(h) for h in r['deck']),'deck mismatch '+rid)
        if r['car']:
            check(r['kind'] not in {'steps','footway','cycleway','pedestrian','path','track'} and not r.get('tunnel'),'vehicle access '+rid)
        if r['foot']:
            check(r['kind'] in {'steps','footway','pedestrian','living_street','path'} and not r.get('tunnel'),'pedestrian access '+rid)
        edges[rid]=r
        counts[r['kind']]+=1
    objects.extend(data['objects'])
    dry_axes.extend(LineString(w['points']) for w in data['waterways'] if w['kind']=='riverbed')
    for bucket in ['rail','waterways']:
        for feat in data[bucket]:
            check(all(inside(p) for p in feat['points']),bucket+' outside sector')
    for feat in data['areas']:
        check(all(inside(p) for ring in feat['rings'] for p in ring), 'area outside sector')

route = index['route']
rebuilt = []
for rid in index['routeEdges']:
    r = edges[rid]
    origin = route[0] if not rebuilt else rebuilt[-1]
    pts = r['points'] if r['points'][0]==origin else r['points'][::-1]
    check(pts[0]==origin,'disconnected itinerary at '+rid)
    rebuilt.extend(pts if not rebuilt else pts[1:])
check(rebuilt==route,'route does not match listed edges')
check(abs(LineString(route).length-index['routeLengthM'])<1,'route length')

transform = Transformer.from_crs(4326,25830,always_xy=True)
def local(point):
    e,n = transform.transform(*point)
    return (e-index['origin'][0],index['origin'][1]-n)
anchors = {'Plaza Mayor':(-.27863,39.67943),'Alto Horno':(-.2203074,39.6542918),'Fortín':(-.239697918,39.635329816)}
line = LineString(route)
distances = {k:round(line.distance(Point(local(p))),1) for k,p in anchors.items()}
check(max(distances.values()) < 150, 'itinerary misses anchor')
hydro = STRtree(dry_axes)
mouth = local((-.206,39.6674))
check(min(g.distance(Point(mouth)) for g in dry_axes)<200,'Palancia misses the delta')
check(min(g.distance(Point(local(anchors['Fortín']))) for g in dry_axes)>3800,'artificial connection to Grau Vell')
geod = Geod(ellps='GRS80')
errors = []
for a in anchors.values():
    for b in anchors.values():
        if a!=b:
            ground = geod.inv(*a,*b)[2]
            errors.append(abs(math.dist(local(a),local(b))-ground)/ground)
check(max(errors)<.001, 'relative distance residual')

world = json.loads((ROOT/'dist/assets/territory/world.json').read_text('utf-8'))
footprints=[]
for s in world['sectors']:
    bs=json.loads((ROOT/'dist/assets/territory'/s['url']).read_text('utf-8'))['buildings']
    footprints.extend(Polygon(b['rings'][0],b['rings'][1:]) for b in bs)
solids=STRtree(footprints)
for o in objects:
    check(not len(solids.query(Point(o['x'],o['z']),predicate='intersects')),'mapped furniture inside a cadastral solid')
for r in edges.values():
    if r['car'] or r['foot']:
        path = LineString(r['points']).buffer(min(2,r['width']*.41) if r['car'] else .22,cap_style='flat')
        check(not len(solids.query(path,predicate='intersects')),'agent corridor overlaps cadastral footprint '+r['id'])
for turn,rules in index['turns'].items():
    check(turn in nodes,'restriction on missing node')
check(len(edges)==index['counts']['roads'],'edge count')
check(len(objects)==index['counts']['objects'],'furniture count')
report = dict(sectors=len(index['tiles']),edges=len(edges),junctions=sum(v>2 for v in vertices.values()),
              routeMeters=index['routeLengthM'],anchorDistancesMeters=distances,
              maxProjectionRelativeError=round(max(errors),7),simpleRestrictionNodes=len(index['turns']),
              bridges=sum(r['bridge'] for r in edges.values()),footprintConflictsRemainingInActivity=0,
              duplicateEdges=0,osmTimestamp=index['sourceDate'])
if hasattr(sys.stdout,'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
