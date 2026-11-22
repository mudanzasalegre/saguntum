"""Build sectorized public-realm geometry from a cached Geofabrik Valencia PBF.

Python 3.12, osmium, shapely >=2, pyproj, networkx. All outputs use EPSG:25830
minus the atlas origin. Raw extracts stay outside the served directory.
"""
import argparse
from array import array
from collections import Counter, defaultdict
import hashlib
import json
import math
import sys
from pathlib import Path
import tempfile
from urllib.request import Request, urlopen
import osmium
import networkx as nx
from pyproj import Transformer
from shapely import make_valid, prepare, STRtree
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import polygonize, unary_union

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/network'
TILE = 1000
ORIGIN = (730000, 4395000)
FORWARD = Transformer.from_crs(4326, 25830, always_xy=True)
INVERSE = Transformer.from_crs(25830, 4326, always_xy=True)
REGION = 'valencia-261121.osm.pbf'
DOWNLOAD = 'https://download.geofabrik.de/europe/spain/valencia/' + REGION
MD5 = 'aad09514c34dd038af5fa3cd862abec2'
MUNICIPAL = 348833
WIDTHS = {'motorway':9,'trunk':8,'primary':7,'secondary':6.6,'tertiary':6.2,
          'unclassified':5,'residential':5.5,'living_street':4,'service':3.8,
          'pedestrian':4,'cycleway':2.4,'footway':1.65,'steps':1.7,'path':1.35,
          'track':3.2,'bridleway':2}
MAIN = {'motorway','trunk','primary','secondary','tertiary'}
FOOT = {'pedestrian','footway','path','steps','living_street'}
BLOCKED = {'private','no','customers','delivery','destination','permit','agricultural','forestry'}
TAGS = {'highway','railway','waterway','water','natural','landuse','leisure','amenity','place',
        'access','access:conditional','vehicle','vehicle:conditional','motor_vehicle','motorcar',
        'motor_vehicle:conditional','motorcar:conditional','foot','foot:conditional','barrier',
        'oneway','oneway:motor_vehicle','junction','width','lanes','name','bridge','tunnel',
        'layer','service','footway','path','sidewalk','cycleway','cycleway:right','cycleway:left',
        'area','lit','crossing','surface','intermittent','seasonal','indoor','maxspeed',
        'parking','harbour','military','height','man_made'}


def project(lon, lat):
    e, n = FORWARD.transform(lon, lat)
    return (round(e - ORIGIN[0], 2), round(ORIGIN[1] - n, 2))


def digest(path, algorithm):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, algorithm).hexdigest()


def acquire(cache):
    path = cache / REGION
    if not path.is_file():
        part = path.with_suffix('.download')
        # Verify each range because some HTTP caches serve partial content.
        with part.open('wb') as dst:
            size, start = None, 0
            while size is None or start < size:
                last = start + 4 * 1024 * 1024 - 1
                req = Request(DOWNLOAD + f'?range={start}', headers={'Range': f'bytes={start}-{last}'})
                with urlopen(req, timeout=90) as response:
                    body = response.read()
                    if response.status == 200 and start == 0:
                        dst.write(body)
                        break
                    head = response.headers['Content-Range']
                    size = int(head.split('/')[1])
                    end = min(last, size - 1)
                    if head != f'bytes {start}-{end}/{size}' or len(body) != end-start+1:
                        raise ValueError('Incomplete PBF range')
                    dst.write(body)
                    start += len(body)
        if digest(part, 'md5') != MD5:
            raise ValueError('Unexpected Geofabrik snapshot checksum')
        part.replace(path)
    if digest(path, 'md5') != MD5:
        raise ValueError('Cached snapshot differs from the pinned source')
    return path


def relation_areas(parts, ways, nodes):
    groups = defaultdict(list)
    for typ, ref, role in parts:
        if typ != 'w' or ref not in ways:
            continue
        points = compact(nodes[n] for n in ways[ref][0])
        if len(points) >= 2:
            groups[role == 'inner'].append(LineString(points))
    # Node touching member ways first. Connected inner boundaries may share
    # individual vertices even though the resulting park polygon is valid.
    exterior = unary_union(list(polygonize(unary_union(groups[False]))))
    if groups[True]:
        exterior = exterior.difference(unary_union(list(polygonize(unary_union(groups[True])))))
    return exterior


def source_rows(pbf, cache):
    path = cache / (digest(pbf,'sha256')[:16] + '-geometry-v4.json')
    if path.exists():
        d = json.loads(path.read_text('utf-8'))
        return ({int(k):v for k,v in d[0].items()}, {int(k):v for k,v in d[1].items()}, *d[2:])
    rels, city_parts = [], None
    for rel in osmium.FileProcessor(pbf, osmium.osm.RELATION):
        t = rel.tags
        if rel.id == MUNICIPAL:
            city_parts = [(m.type,m.ref,m.role) for m in rel.members if m.type=='w']
        if t.get('type') == 'restriction' or (t.get('type') == 'multipolygon' and area_kind(t)):
            rels.append((rel.id,dict(t),[(m.type,m.ref,m.role) for m in rel.members]))
    if not city_parts:
        raise ValueError('Municipal boundary missing')
    city_ids = {ref for typ,ref,role in city_parts}
    nodes, ways, objects = {}, {}, []
    # Small bounding box includes even the western detached municipal territory.
    region = (-.48,39.57,-.10,39.85)
    def nearby(loc):
        return region[0] < loc.lon < region[2] and region[1] < loc.lat < region[3]
    proc = osmium.FileProcessor(pbf).with_locations().with_filter(
        osmium.filter.EntityFilter(osmium.osm.NODE | osmium.osm.WAY))
    # EmptyTagFilter would discard untagged relation members, so include them
    # explicitly through the way pass.
    for entity in proc:
        if entity.is_node():
            if not len(entity.tags) or not nearby(entity.location):
                continue
            t = entity.tags
            kind = (t.get('highway') if t.get('highway') in {'street_lamp','crossing','traffic_signals','stop','give_way'}
                    else t.get('amenity') if t.get('amenity') in {'bench','bicycle_parking'}
                    else 'tree' if t.get('natural') == 'tree'
                    else 'bollard' if t.get('barrier')=='bollard' else None)
            if kind:
                x,z = project(entity.location.lon, entity.location.lat)
                objects.append(dict(id=entity.id,kind=kind,x=x,z=z))
        else:
            refs = entity.nodes
            if len(refs) < 2 or not refs[0].location.valid():
                continue
            if entity.id not in city_ids and not nearby(refs[0].location) and not nearby(refs[-1].location):
                continue
            if any(not r.location.valid() for r in refs):
                continue
            ids = []
            for r in refs:
                if r.ref not in nodes:
                    nodes[r.ref] = project(r.lon, r.lat)
                ids.append(r.ref)
            ways[entity.id] = [ids, {k:v for k,v in dict(entity.tags).items() if k in TAGS}]
    local_rels = [r for r in rels if any(m[0]=='w' and m[1] in ways for m in r[2])]
    path.write_text(json.dumps([nodes, ways, objects, local_rels, city_parts],separators=(',',':')), 'utf-8')
    return nodes, ways, objects, local_rels, city_parts


def area_kind(t):
    if t.get('area')=='yes' and t.get('highway')=='pedestrian' or t.get('place')=='square':
        return 'square'
    if t.get('amenity')=='parking':
        return 'parking'
    if t.get('water')=='river' and t.get('intermittent')=='yes' or t.get('natural') in {'shingle','riverbed'}:
        return 'riverbed'
    if t.get('natural')=='water' and t.get('water') in {'basin','pond','lake','reservoir'}:
        return 'basin'
    for k in ('leisure','landuse','natural'):
        kind = t.get(k)
        if kind in {'park','garden','grass','orchard','farmland','forest','scrub','wetland','beach','industrial','basin'}:
            return kind
        if kind in {'meadow','grassland','recreation_ground','village_green'}:
            return 'grass'
        if kind=='wood':
            return 'forest'
    return None


def tile_key(x,z):
    return (math.floor(x/TILE), math.floor(z/TILE))


def cell(key):
    x,z = key
    return box(x*TILE,z*TILE,(x+1)*TILE,(z+1)*TILE)


def members(geom, typ):
    if geom.is_empty:
        return
    if geom.geom_type == typ:
        yield geom
    elif hasattr(geom,'geoms'):
        for g in geom.geoms:
            yield from members(g,typ)


def compact(coords):
    points = []
    for x,z in coords:
        p = [round(x,1),round(z,1)]
        if not points or points[-1] != p:
            points.append(p)
    return points


def intersecting_cells(bounds):
    x0,z0 = tile_key(*bounds[:2])
    x1,z1 = tile_key(*bounds[2:])
    return ((x,z) for x in range(x0,x1+1) for z in range(z0,z1+1))


def width_for(kind,t):
    try:
        return round(max(.5,min(38,float(t.get('width','').replace(' m','')))),1),True
    except ValueError:
        default = WIDTHS.get(kind.removesuffix('_link'), 3.5)
        if kind.endswith('_link'):
            default = 4
        return default,False


def road_tags(t):
    kind = t.get('highway')
    base = kind.removesuffix('_link')
    if base not in WIDTHS or t.get('area')=='yes' or t.get('indoor')=='yes':
        return None
    width, measured = width_for(kind,t)
    car_access = next((t[k] for k in ('motorcar','motor_vehicle','vehicle','access') if k in t),'yes')
    foot_access = t.get('foot',t.get('access','yes'))
    restricted = any(t.get(k) for k in ('access:conditional','vehicle:conditional','motor_vehicle:conditional','motorcar:conditional'))
    car = (base in MAIN | {'unclassified','residential','living_street'}
           and car_access not in BLOCKED and not restricted)
    foot = kind in FOOT and foot_access not in BLOCKED and not t.get('foot:conditional') and not t.get('access:conditional')
    tunnel = t.get('tunnel','no') != 'no'
    direct = t.get('oneway:motor_vehicle', t.get('oneway', 'yes' if t.get('junction')=='roundabout' or base=='motorway' else 'no'))
    direction = -1 if direct in {'-1','reverse'} else int(direct in {'1','yes','true'})
    result = dict(kind=kind,width=width,car=car and not tunnel,foot=foot and not tunnel,oneway=direction,
                  bridge=t.get('bridge','no')!='no')
    for k in ('sidewalk','cycleway','surface','name','maxspeed','layer','lit'):
        if k in t:
            result[k] = t[k]
    if t.get('footway'):
        result['subtype'] = t['footway']
    if t.get('cycleway:left') or t.get('cycleway:right'):
        result['cycleway'] = t.get('cycleway:right',t.get('cycleway:left'))
    if measured:
        result['widthTagged'] = True
    if tunnel:
        result['tunnel'] = True
    return result


def split_road(refs, nodes, shared, way_id, mask):
    """Preserve OSM vertices at junctions; virtual nodes never join flyovers."""
    pending = []
    active_key, active_a, active_b = None, None, None
    for n0,n1 in zip(refs,refs[1:]):
        p,q = nodes[n0], nodes[n1]
        dx,dz = q[0]-p[0],q[1]-p[1]
        if not dx and not dz:
            continue
        breaks = {0.,1.}
        for lo,delta in ((p[0],dx),(p[1],dz)):
            if delta:
                end = lo+delta
                for i in range(math.floor(min(lo,end)/TILE)+1,math.ceil(max(lo,end)/TILE)):
                    breaks.add(round((i*TILE-lo)/delta,12))
        segment = LineString([p,q])
        if not mask.covers(segment):
            for part in members(segment.intersection(mask),'LineString'):
                for coord in (part.coords[0],part.coords[-1]):
                    frac = segment.project(Point(coord),normalized=True)
                    breaks.add(round(frac,12))
        br = sorted(breaks)
        def at(v):
            if v==0:
                return p
            if v==1:
                return q
            return (p[0]+dx*v,p[1]+dz*v)
        def node(v,xy):
            return str(n0 if v==0 else n1) if v in (0,1) else f'{way_id}/{n0}/{n1}/{xy[0]:.2f}/{xy[1]:.2f}'
        for u,v in zip(br,br[1:]):
            xy, yz = at(u), at(v)
            mid = at((u+v)/2)
            if not mask.covers(Point(mid)):
                if pending:
                    yield active_key,active_a,active_b,pending
                    pending = []
                continue
            key, a, b = tile_key(*mid),node(u,xy),node(v,yz)
            if pending and (key!=active_key or a!=active_b or u==0 and shared[n0]>1):
                yield active_key,active_a,active_b,pending
                pending = []
            if not pending:
                active_key,active_a,pending = key,a,[xy]
            active_b = b
            pending.append(yz)
    if pending:
        yield active_key,active_a,active_b,pending


def write_json(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')


def load_land():
    """Read derived Catastro solids and the very same terrain grids as the client."""
    folder = ROOT/'dist/assets/territory'
    world = json.loads((folder/'world.json').read_text('utf-8'))
    footprints = []
    for s in world['sectors']:
        data = json.loads((folder/s['url']).read_text('utf-8'))
        footprints.extend(Polygon(b['rings'][0],b['rings'][1:]) for b in data['buildings'])
    def sampler(g):
        data = array('h')
        with (folder/g['heights']).open('rb') as f:
            data.fromfile(f,g['width']*g['height'])
        if sys.byteorder!='little':
            data.byteswap()
        x0,z0,x1,z1 = g['bounds']
        w,h = g['width'],g['height']
        def at(x,z):
            u = min(w-1,max(0,(x-x0)*(w-1)/(x1-x0)))
            v = min(h-1,max(0,(z-z0)*(h-1)/(z1-z0)))
            i,j = min(w-2,int(u)),min(h-2,int(v))
            u,v = u-i,v-j
            k = j*w+i
            a,b,c,d = data[k],data[k+1],data[k+w],data[k+w+1]
            elevation = a+(b-a)*u+(c-a)*v if u+v<=1 else d+(c-d)*(1-u)+(b-d)*(1-v)
            return elevation*g['unit']
        return at
    base,core = world['terrain'],world['terrain']['detail']
    base_at,core_at = sampler(base),sampler(core)
    x0,z0,x1,z1 = core['bounds']
    def height_at(x,z):
        blend = min(1,max(0,min(x-x0,z-z0,x1-x,z1-z)/50))
        return base_at(x,z)*(1-blend)+core_at(x,z)*blend
    return STRtree(footprints), height_at


def build(pbf,cache,source_url):
    nodes,ways,objects,rels,city_parts = source_rows(pbf,cache)
    boundary = relation_areas(city_parts,ways,nodes)
    if not 129e6 < boundary.area < 140e6:
        raise ValueError(f'Unexpected municipal area {boundary.area}')
    # Retain the documented northern Palancia branch across the boundary at Canet.
    landscape = json.loads((ROOT/'dist/assets/data/landscape-palancia.json').read_text('utf-8'))['sites'][0]['survey']
    axes = [LineString([project(*p) for p in landscape[k]]) for k in ('mainAxis','southAxis')]
    mask = boundary.buffer(20).union(unary_union(axes).buffer(105))
    prepare(mask)
    tiles = defaultdict(lambda:dict(roads=[],rail=[],waterways=[],areas=[],objects=[]))
    major = []
    counts, excluded = Counter(), set()
    solids,height_at = load_land()
    restricted = []
    for refs,t in ways.values():
        if len(refs)<4 or refs[0]!=refs[-1]:
            continue
        if ((t.get('access') in BLOCKED and any(k in t for k in ('landuse','amenity','leisure','harbour')))
            or t.get('amenity') in {'school','kindergarten','prison'}
            or t.get('landuse')=='military'):
            restricted.append(make_valid(Polygon([nodes[n] for n in refs])))
    restricted_tree = STRtree(restricted)
    def add_line(name,geom,attrs):
        if not mask.intersects(geom):
            return
        geom = geom.intersection(mask)
        if geom.is_empty:
            return
        for key in intersecting_cells(geom.bounds):
            for part in members(geom.intersection(cell(key)),'LineString'):
                pts = compact(part.coords)
                if len(pts)>1 and tile_key(*part.interpolate(.5,normalized=True).coords[0])==key:
                    tiles[key][name].append(dict(attrs,points=pts))
                    counts[name]+=1
    def add_area(id_,kind,geom):
        if geom.is_empty or not mask.intersects(geom):
            return
        geom = make_valid(geom).intersection(mask)
        if geom.is_empty:
            return
        for key in intersecting_cells(geom.bounds):
            for part in members(geom.intersection(cell(key)),'Polygon'):
                if part.area < .5:
                    continue
                clean = part.simplify(.35,preserve_topology=True)
                rings = [compact(r.coords) for r in [clean.exterior,*clean.interiors]]
                if len(rings[0])>=4:
                    tiles[key]['areas'].append(dict(id=id_,kind=kind,rings=[r for r in rings if len(r)>=4]))
                    counts['areas']+=1
    turns = defaultdict(list)
    for id_,tags,parts in rels:
        if tags.get('type')=='restriction':
            if 'restriction:conditional' in tags or not tags.get('restriction'):
                continue
            roles = {role: ref for typ,ref,role in parts if (role=='via')==(typ=='n')}
            if roles.keys() >= {'via','from','to'} and roles['via'] in nodes:
                turns[str(roles['via'])].append(dict(from_=roles['from'],to=roles['to'],only=tags['restriction'].startswith('only_')))
        else:
            kind = area_kind(tags)
            geom = relation_areas(parts,ways,nodes)
            if not geom.is_empty:
                add_area(f'r{id_}',kind,geom)
                excluded.update(ref for typ,ref,role in parts if typ=='w' and ref in ways and area_kind(ways[ref][1])==kind)
    for k,axis in enumerate(axes):
        add_line('waterways',axis,dict(kind='riverbed',name='Río Palancia',id=f'palancia-{k}'))
    for lake in landscape['waterPolygons']:
        geom = Polygon([project(*p) for p in lake['outer']],[[project(*p) for p in h] for h in lake.get('holes',[])])
        add_area(lake['id'],'water',geom)
    roads = {}
    shared = Counter()
    for key,(refs,t) in ways.items():
        tags = road_tags(t) if t.get('highway') else None
        if tags:
            coords = [nodes[n] for n in refs]
            if mask.intersects(LineString(coords)):
                roads[key] = (refs,tags)
                shared.update(set(refs))
        kind = area_kind(t)
        if kind and key not in excluded and refs[0]==refs[-1] and len(refs)>3:
            add_area(f'w{key}',kind,Polygon([nodes[n] for n in refs]))
        if t.get('railway') in {'rail','narrow_gauge'} and t.get('tunnel','no')=='no':
            add_line('rail', LineString([nodes[n] for n in refs]),dict(id=key,kind=t['railway'],bridge=t.get('bridge','no')!='no'))
        if t.get('waterway') in {'stream','ditch','drain','canal'} and not t.get('tunnel') and not t.get('covered'):
            add_line('waterways',LineString([nodes[n] for n in refs]),dict(id=key,kind=t['waterway'],name=t.get('name','')))
    crossings = {o['id']:o for o in objects if o['kind']=='crossing'}
    for refs,tags in roads.values():
        if not tags['car']:
            continue
        for i,n in enumerate(refs):
            if n in crossings:
                p,q = nodes[refs[max(0,i-1)]],nodes[refs[min(len(refs)-1,i+1)]]
                if p!=q:
                    crossings[n]['heading'] = round(math.atan2(q[0]-p[0],q[1]-p[1]),4)
                    crossings[n]['width'] = tags['width']
    for o in objects:
        point = Point(o['x'],o['z'])
        if not mask.covers(point):
            continue
        if len(solids.query(point,predicate='intersects')):
            counts['furnitureInsideOmitted']+=1
            continue
        tiles[tile_key(o['x'],o['z'])]['objects'].append(o)
        counts['objects']+=1
    walk_graph = nx.Graph()
    edge_points = {}
    for way_id,(refs,attrs) in roads.items():
        geom = LineString([nodes[n] for n in refs])
        if attrs['kind'] in MAIN:
            for piece in members(geom.intersection(mask),'LineString'):
                simp = piece.simplify(10)
                if simp.length>10:
                    major.append(dict(kind=attrs['kind'],points=compact(simp.coords)))
        for ix,(key,a,b,coords) in enumerate(split_road(refs,nodes,shared,way_id,mask)):
            points = compact(coords)
            if len(points)<2 or a==b and len(points)<3:
                continue
            edge_id = f'{way_id}:{ix}'
            edge = dict(id=edge_id,osm=way_id,a=a,b=b,points=points,**attrs)
            line = LineString(points)
            if edge['bridge']:
                # Orthometric heights of the end abutments. Deck profile between
                # these points is an estimate, shared by road and animated agents.
                h0,h1 = height_at(*geom.coords[0]), height_at(*geom.coords[-1])
                edge['deck'] = [round(h0+(h1-h0)*geom.project(Point(p),normalized=True)+.2,2) for p in points]
            private = bool(len(restricted_tree.query(line,predicate='intersects')))
            physical = bool(len(solids.query(line.buffer(min(2,edge['width']*.41) if edge['car'] else .22,
                                                        cap_style='flat'),predicate='intersects')))
            if (private or physical) and (edge['car'] or edge['foot']):
                counts['restrictedEdges' if private else 'footprintConflictEdges']+=1
                edge['car'],edge['foot'] = False,False
            tiles[key]['roads'].append(edge)
            counts['roads']+=1
            counts['carEdges']+=edge['car']
            counts['footEdges']+=edge['foot']
            # Public paths, public streets or tracks with no private restriction.
            t = ways[way_id][1]
            walkable = (attrs['foot'] or (attrs['kind'] in {'residential','unclassified','tertiary','secondary','primary','track','service','cycleway'}
                        and t.get('foot',t.get('access','yes')) not in BLOCKED
                        and t.get('service') not in {'driveway','parking_aisle','drive-through'}
                        and not any(k in t for k in ('foot:conditional','access:conditional'))))
            if walkable and not attrs.get('tunnel') and not private and not len(solids.query(line,predicate='crosses')):
                weight = LineString(points).length
                if not attrs['foot']:
                    weight *= 1.5 if attrs['kind'] in MAIN else 1.1
                if weight < walk_graph.get_edge_data(a,b,default={}).get('weight',math.inf):
                    walk_graph.add_edge(a,b,weight=weight,id=edge_id)
                    edge_points[edge_id] = (a,points)
    component = max(nx.connected_components(walk_graph),key=len)
    endpoints = {}
    for a,b,d in walk_graph.edges(data=True):
        first,pts = edge_points[d['id']]
        endpoints[first] = pts[0]
        endpoints[b if a==first else a] = pts[-1]
    targets = [(-.27863,39.67943),(-.2203074,39.6542918),(-.239697918,39.635329816)]
    stops = [min(component,key=lambda n:math.dist(endpoints[n],project(*ll))) for ll in targets]
    route, route_edges = [], []
    for u,v in zip(stops,stops[1:]):
        sequence = nx.shortest_path(walk_graph,u,v,weight='weight')
        for a,b in zip(sequence,sequence[1:]):
            edge_id = walk_graph[a][b]['id']
            first,pts = edge_points[edge_id]
            pts = pts if first==a else pts[::-1]
            if route and route[-1]!=pts[0]:
                raise ValueError('Discontinuous route at '+a)
            route.extend(pts[1:] if route else pts)
            route_edges.append(edge_id)
    if any(math.dist(endpoints[n],project(*ll))>220 for n,ll in zip(stops,targets)):
        raise ValueError('A route endpoint is too far from its mapped site')
    OUT.mkdir(parents=True,exist_ok=True)
    descriptors = []
    for key,data in sorted(tiles.items()):
        id_ = f'{key[0]}_{key[1]}'
        name = id_+'.json'
        write_json(OUT/name,data)
        descriptors.append(dict(id=id_,bounds=list(cell(key).bounds),url=name))
    allowed = {e['a'] for d in tiles.values() for e in d['roads']} | {e['b'] for d in tiles.values() for e in d['roads']}
    valid_turns = {k:[{'from':t['from_'],'to':t['to'],'only':t['only']} for t in vs] for k,vs in turns.items() if k in allowed}
    header = osmium.io.Reader(str(pbf)).header()
    index = dict(schema=1,projection='EPSG:25830',origin=ORIGIN,tileSize=TILE,tiles=descriptors,major=major,
                 route=route,routeEdges=route_edges,turns=valid_turns,counts=counts,routeLengthM=round(LineString(route).length),
                 attribution='© OpenStreetMap contributors',license='ODbL 1.0',licenseUrl='https://www.openstreetmap.org/copyright',
                 source=source_url,sourceSha256=digest(pbf,'sha256'),sourceDate=header.get('osmosis_replication_timestamp'),
                 credits=dict(streets='© OpenStreetMap contributors · ODbL 1.0',
                              conditionalWater='Contorno interpretado en PNOA del Atlas v32 · © IGN · CC BY 4.0',
                              obstacles='Comprobación con huellas de la Dirección General del Catastro',
                              bridgeElevations='Perfil estimado entre estribos del MDT de IGN/CNIG · CC BY 4.0'),
                 precision='Posición de OSM. Las anchuras con widthTagged proceden de etiquetas. Las demás y los tableros son aproximaciones visuales.',
                 municipalRelation=MUNICIPAL,municipalAreaKm2=round(boundary.area/1e6,2))
    write_json(OUT/'index.json',index)
    print(len(tiles),'sectors',dict(counts),'route',index['routeLengthM'],'m',flush=True)


if __name__=='__main__':
    args=argparse.ArgumentParser(description=__doc__)
    args.add_argument('--cache',type=Path,default=Path(tempfile.gettempdir())/'saguntum-network-v33')
    args.add_argument('--pbf',type=Path,help='Use a locally archived Geofabrik Valencia extract')
    args.add_argument('--source-url',help='Original URL for an alternative dated extract')
    opt=args.parse_args()
    opt.cache.mkdir(parents=True,exist_ok=True)
    pbf=opt.pbf or acquire(opt.cache)
    url=opt.source_url or (DOWNLOAD if pbf.name==REGION else pbf.name)
    build(pbf,opt.cache,url)
