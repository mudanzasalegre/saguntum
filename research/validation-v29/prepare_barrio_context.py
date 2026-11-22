"""V29: public setting of the Barrio Obrero, from retained source geometry.

The seven residential blocks and every heritage cadastral part belong to the
Barrio model. This context owns only streets/public space outside them. It does
not reinstate the lost original plaza or the removed Avenida front gardens.
Photo pixels refer to the checked-in, georeferenced PNOA evidence image. The
retrieval date is not an acquisition date or a present-day condition survey.
"""
from pathlib import Path
import importlib.util
import hashlib
import json
import math
import sys
try:
    import shapely
    assert hasattr(shapely, 'constrained_delaunay_triangles')
except (ImportError, AssertionError):
    sys.path.insert(0, '/workspace/scratch/36862867499f/begona-context-deps')
    for key in list(sys.modules):
        if key == 'shapely' or key.startswith('shapely.'):
            del sys.modules[key]
    import shapely
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
OUT = ROOT / 'research/validation-v29'
spec = importlib.util.spec_from_file_location('gerencia_ground_helpers', ROOT / 'research/validation-v25/prepare_gerencia_context.py')
G = importlib.util.module_from_spec(spec)
spec.loader.exec_module(G)
project, geo, polygon, polygons, lines, record, line_record = G.project, G.geo, G.polygon, G.polygons, G.lines, G.record, G.line_record
read = lambda name: json.loads((DATA / (name + '.json')).read_text())
PHOTO_BOUNDS = {'west': -.22745, 'east': -.22225, 'south': 39.6603, 'north': 39.663}
PHOTO_SIZE = [2600, 1800]
PHOTO_URL = 'https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.6603%2C-0.22745%2C39.663%2C-0.22225&width=2600&height=1800&format=image%2Fjpeg'
def photo(p):
    return project((PHOTO_BOUNDS['west'] + p[0] / PHOTO_SIZE[0] * (PHOTO_BOUNDS['east'] - PHOTO_BOUNDS['west']), PHOTO_BOUNDS['north'] - p[1] / PHOTO_SIZE[1] * (PHOTO_BOUNDS['north'] - PHOTO_BOUNDS['south'])))
def traced(points):
    return Polygon([photo(p) for p in points]).buffer(0)
def photo_line(points):
    return LineString([photo(p) for p in points])
def no_hole_records(id, shape, **kwargs):
    result = []
    for poly in polygons(shape):
        parts = list(shapely.constrained_delaunay_triangles(poly).geoms) if poly.interiors else [poly]
        for p in parts:
            result.append(record(id + '-' + str(len(result)), p, **kwargs))
    return result

def build():
    cart = read('port-cartography')
    barrio = next(s for s in read('port-workers')['sites'] if s['id'] == 'barrio-obrero')
    prior_names = ['horno', 'talleres', 'museo-industrial', 'gerencia', 'casino', 'begona', 'economato']
    prior = {name: read(name + '-context') for name in prior_names}
    source_hashes = {name + '-context.json': hashlib.sha256((DATA / (name + '-context.json')).read_bytes()).hexdigest() for name in prior_names}
    all_buildings = [(r, polygon(r)) for r in cart['buildings']]
    blocks = unary_union([Polygon([project(q) for q in block]) for block in barrio['blocks']]).buffer(0)
    boundary = Polygon([project(q) for q in barrio['footprint']]).buffer(0)
    core_ids = {r['id'] for r in barrio['parts']}
    core = [r for r, p in all_buildings if r['id'] in core_ids]
    core_shape = unary_union([p for r, p in all_buildings if r['id'] in core_ids])
    # Two contemporary public parking/sidewalk pockets cross the historical
    # block envelope. Their recorded, approved polygons exclude domestic parts.
    approved_heads = json.loads((OUT/'barrio-public-heads-approved.json').read_text())
    head_rows = approved_heads['candidates']
    public_heads = unary_union([polygon(r) for r in head_rows])
    public_head_parking = unary_union([polygon(p) for r in head_rows for p in r['parking']])
    domestic = unary_union([polygon(r) for r in read('barrio-plan')['components'] if r.get('kind') in ['garden','courtyard'] and r.get('buildingId')])
    assert public_heads.intersection(core_shape.union(domestic)).area < 1e-7
    private_mask = blocks.difference(public_heads).union(core_shape).union(domestic)
    park = traced([(1200, 373), (1339, 465), (1350, 488), (1274, 617), (1252, 631), (1107, 536), (1093, 512), (1097, 484), (1181, 390)])
    selection = boundary.buffer(34).union(park.buffer(12)).buffer(0)
    previous_surfaces = unary_union([polygon(r) for d in prior.values() for r in d.get('surfaces', [])])
    previous_ids = {str(i) for d in prior.values() for i in d.get('excludedBuildingIds', [])}
    withheld_ids = {str(i) for d in prior.values() for i in d.get('withheldBuildingIds', [])}
    withheld_ids.update(str(r['id']) for d in prior.values() for r in d.get('withheldBuildingParts', []))
    heritage = [s for name in ['port-industrial', 'port-garden', 'port-workers'] for s in read(name)['sites']]
    protected_parents = {str(p) for s in heritage for p in s.get('catastroBuildingIds', [])}
    protected_osm = {str(p) for s in heritage for p in s.get('osmBuildingIds', [])}
    other_heritage = unary_union([Polygon([project(q) for q in s['footprint']]).buffer(1.8) for s in heritage if s['id'] != 'barrio-obrero' and s.get('footprint')])
    local_parts = [(r, p) for r, p in all_buildings if p.intersects(selection.buffer(8)) and str(r['id']) not in withheld_ids]
    architecture = unary_union([p for _, p in local_parts])
    new_buildings = []
    for r, p in local_parts:
        if r['id'] in core_ids or str(r['id']) in previous_ids or str(r['id']) in withheld_ids or str(r.get('parentId')) in protected_parents or str(r['id']) in protected_osm or p.intersects(blocks):
            continue
        if not selection.covers(p.centroid) or p.area < 5:
            continue
        height = float(r.get('surfaceHeightEstimate') or max(3.1, int(r.get('levels') or 1) * 3))
        new_buildings.append(dict(r, contextComponent='barrio-frente-urbano', displayHeightM=height, renderingType='urban', roofForm='source-plan', facadeColor=['#d3c7b4', '#c9bdaa', '#e0d7c9', '#c4bcaf', '#cbbda5'][len(new_buildings) % 5], facadeMeasured=False))
    new_ids = {str(r['id']) for r in new_buildings}
    shared_buildings = [r for r, p in local_parts if str(r['id']) not in new_ids]

    # Existing OSM axes are immutable; only local display widths are interpreted.
    # The catalogue section 3.1 establishes the 4.40 m historical inner carriageway.
    widths = {'157373152': 4.4, '157373154': 4.4, '157373164': 7.0, '157375211': 6.1,
              '155074848': 5.6, '157295289': 10.2, '157369645': 6.0, '157369662': 6.0,
              '157369671': 7.3, '157375212': 5.8, '157375216': 5.8, '157375217': 6.0,
              '157375221': 5.7, '157375225': 5.4}
    roads, road_shapes, sidewalk_shapes, replaced = [], [], [], []
    for r in cart['roads']:
        if str(r['id']) not in widths:
            continue
        axis = LineString([project(q) for q in r['coordinates']])
        width = widths[str(r['id'])]
        local_axis = axis.intersection(selection)
        if local_axis.is_empty:
            continue
        whole = selection.covers(axis) and not axis.intersects(previous_surfaces) and not axis.intersects(other_heritage)
        if whole:
            replaced.append(str(r['id']))
        for j, part in enumerate(lines(local_axis)):
            roads.append(dict(r, id=str(r['id']) + '-barrio-' + str(j), sourceId=str(r['id']), sourceCoordinates=r['coordinates'], coordinates=[geo(q) for q in part.coords], displayWidthM=width, widthInterpretive=True, replacesWholeSource=whole, paintCenterLine=False, contextComponent='barrio-calles'))
            shape = part.buffer(width / 2, cap_style='flat', join_style='round')
            road_shapes.append(shape)
            sidewalk_shapes.append(shape.buffer(1.3 if str(r['id']) in ['157373152', '157373154'] else 2.05))
    head_beds = unary_union([Point(photo(p)).buffer(1.10) for p in [(963,777),(1042,824),(909,891)]]).intersection(public_heads)
    road_union = unary_union(road_shapes).union(public_head_parking).difference(park.buffer(.08)).difference(head_beds)
    sidewalk_union = unary_union(sidewalk_shapes).union(park).union(public_heads)
    # The public park north of Luis Cendoya is Plaza de la Independencia, not
    # the vanished historic square between blocks C and D.
    park_beds = unary_union([Point(photo(p)).buffer(r) for p, r in [((1197, 405), 1.05), ((1158, 447), 1.0), ((1128, 499), 1.05), ((1210, 488), 1.35), ((1240, 526), 1.1), ((1312, 487), 1.05), ((1286, 547), 1.0), ((1239, 590), 1.0), ((1183, 553), 1.0)]])
    domain = selection.difference(private_mask.buffer(.05)).difference(architecture.buffer(.04)).difference(previous_surfaces.buffer(.04)).difference(other_heritage)
    regions = [('barrio-road', road_union), ('barrio-tree-bed', park_beds.intersection(park).union(head_beds)), ('barrio-plaza', park), ('barrio-sidewalk', sidewalk_union)]
    used = Polygon()
    disjoint = []
    for key, shape in regions:
        s = shape.intersection(domain).difference(used).buffer(0)
        disjoint.append((key, s))
        used = used.union(s)
    region_shapes = dict(disjoint)
    public_paving = region_shapes['barrio-sidewalk'].union(region_shapes['barrio-plaza']).union(region_shapes['barrio-tree-bed'])

    # Crown centres are manually read from the source photo; heights, crown
    # forms and species are not asserted as a municipal tree inventory.
    tree_pixels = [(1197,405), (1158,447), (1128,499), (1210,488), (1240,526), (1312,487), (1286,547), (1239,590), (1183,553),
        (407,779),(452,814),(504,851),(542,877),(594,910),(643,944),(705,990),(849,1105),(900,1137),(948,1170),(997,1204),(1043,1232),(1097,1267),(1147,1303),(1194,1336),(1238,1364),(1329,1432),(1369,1459),(1413,1493),(1461,1523),
        (740,526),(918,380),(936,392),(952,407),(970,418),(987,426),(963,777),(1042,824),(909,891),(876,937),(1230,891),(1172,1136),(1392,1370),(1366,1434),(1550,1500),(1639,1368),(1815,1507)]
    previous_trees = [Point(project(r['coordinate'])) for d in prior.values() for r in d.get('trees', [])]
    trees = []
    for i, pix in enumerate(tree_pixels):
        p = Point(photo(pix))
        if not public_paving.buffer(.75).covers(p) or private_mask.buffer(.02).intersects(p) or architecture.buffer(.9).intersects(p) or any(p.distance(q) < 3.2 for q in previous_trees):
            continue
        is_park = park.covers(p)
        trees.append({'id': 'barrio-tree-' + str(i), 'coordinate': geo(p.coords[0]), 'sourcePixel': list(pix), 'kind': 'broadleaf', 'heightM': 7.0 + (i % 4) * .65 if is_park else 4.6 + (i % 3) * .35, 'crownRadiusM': 3.5 + (i % 3) * .3 if is_park else 1.5 + (i % 3) * .18, 'sourceId': 'bo-pnoa-context', 'positionFromPhoto': True, 'dimensionsInterpretive': True, 'speciesVerified': False})
    curbs = []
    # Only actual road-to-footway edges receive raised kerbs; never raise a
    # perimeter around arbitrary clipping borders or across the seven blocks.
    kerb_domain = public_paving.buffer(.08).intersection(domain)
    for k, line in enumerate(lines(region_shapes['barrio-road'].boundary.intersection(kerb_domain).difference(selection.boundary.buffer(.4)))):
        if line.length > .65:
            curbs.append(line_record('barrio-kerb-' + str(k), line, heightM=.11, widthM=.14, sourceId='bo-pnoa-context', interpretive=True))
    crossing_pixels = [([(1110,606),(1141,627)],'cendoya-casas'), ([(994,748),(1025,771)],'llombart-casas'), ([(882,918),(913,941)],'libertad-casas'), ([(749,1075),(796,1108)],'avenida-casas'), ([(1607,946),(1641,972)],'cendoya-fornas'), ([(1528,1068),(1563,1092)],'llombart-fornas'), ([(1439,1222),(1470,1245)],'libertad-fornas'), ([(1312,1372),(1355,1403)],'avenida-fornas'), ([(403,584),(436,608)],'libertad-palleter'), ([(1326,493),(1361,518)],'independencia')]
    crossings = [line_record('barrio-crossing-' + key, photo_line(pts), sourceId='bo-pnoa-context', sourcePixels=pts, interpretive=True) for pts, key in crossing_pixels if photo_line(pts).intersects(region_shapes['barrio-road'])]
    # A small, explicitly interpreted furnishing layer follows the visible
    # public park. It never implies access to private gardens/courtyards.
    benches, lamps = [], []
    for i, pix in enumerate([(1154,529),(1220,593),(1288,493),(1194,431)]):
        p = Point(photo(pix))
        if public_paving.covers(p) and not park_beds.buffer(.7).intersects(p):
            benches.append({'id':'barrio-bench-' + str(i),'coordinate':geo(p.coords[0]),'yaw':-.59,'sourceId':'bo-pnoa-context','interpretive':True})
    for i, pix in enumerate([(1130,531),(1246,608),(1321,485),(1197,390)]):
        p = Point(photo(pix))
        if public_paving.covers(p):
            lamps.append({'id':'barrio-lamp-' + str(i),'coordinate':geo(p.coords[0]),'heightM':4.3,'sourceId':'bo-pnoa-context','interpretive':True,'heritageStyle':False})
    # Pedestrian tree pits on avenue pavements. These are shallow contemporary
    # planting recesses; no recreated historical front-yard walls are added.
    tree_pits = []
    for row in trees:
        p = Point(project(row['coordinate']))
        if not park.covers(p):
            tree_pits.append(record(row['id']+'-pit', p.buffer(.48, quad_segs=4).intersection(public_paving), component='barrio-tree-pit', regionId='entorno', sourceId='bo-pnoa-context', interpretive=True))
    pit_shape = unary_union([polygon(r) for r in tree_pits])
    disjoint = [(key, shape.difference(pit_shape)) for key, shape in disjoint] + [('barrio-tree-pit', pit_shape)]
    vertices, groups, triangles, pavement = G.triangulate_regions(disjoint)
    surfaces = [record(key + '-' + str(i), p, component=key, regionId='entorno', sourceId='bo-pnoa-context', interpretive=True) for key, shape in disjoint for i, p in enumerate(polygons(shape))]
    parking_rows = [line_record('barrio-parking-C', photo_line([(989,796),(924,893)]),sourceId='bo-pnoa-context',interpretive=True),line_record('barrio-parking-D',photo_line([(1038,840),(984,923)]),sourceId='bo-pnoa-context',interpretive=True)]
    focus_specs = {
      'barrio-accesos': {'label':'Acceso desde 9 d’Octubre','targetCoordinates':geo(photo((842,1072))),'targetHeight':1.4,'far':[-33,25,45],'near':[-14,9,24],'radius':62,'fov':55,'regionId':'entorno'},
      'barrio-calles': {'label':'Las calles de las Casas de Compañía','targetCoordinates':geo(photo((1006,781))),'targetHeight':1.6,'far':[30,37,53],'near':[11,8,22],'radius':77,'fov':55,'regionId':'entorno'},
      'barrio-arbolado': {'label':'Arbolado y plaza de la Independencia','targetCoordinates':geo(photo((1215,502))),'targetHeight':2.5,'far':[-34,35,46],'near':[-21,24,29],'radius':56,'fov':54,'regionId':'entorno'},
      'barrio-frente-urbano': {'label':'La fachada a la avenida','targetCoordinates':geo(photo((1119,1240))),'targetHeight':3.2,'far':[-38,31,48],'near':[-17,11,27],'radius':74,'fov':56,'regionId':'entorno'},
      'barrio-ciudad-factoria': {'label':'Barrio y ciudad factoría','targetCoordinates':barrio['coordinate'],'targetHeight':3.5,'far':[150,150,170],'near':[78,73,94],'radius':185,'fov':54,'regionId':'memoria'}
    }
    masks = no_hole_records('barrio-public-mask', pavement.buffer(.055).difference(private_mask.buffer(.01)), sourceId='bo-pnoa-context')
    vegetation_masks = no_hole_records('barrio-vegetation-mask', pavement.buffer(.35).difference(private_mask), sourceId='bo-pnoa-context')
    collision = [record('barrio-context-building-'+str(i), p, sourceId=r['id']) for i,(r,p) in enumerate(local_parts) if str(r['id']) in new_ids]
    stats = {'buildingParts':len(new_buildings),'cadastralParcels':len({r.get('parentId') for r in new_buildings}),'reusedBuildingParts':len(shared_buildings),'privateBlocksPreserved':7,'coreCadastralPartsPreserved':len(core),'roads':len(roads),'pavingAreaM2':round(pavement.area,2),'pavingTriangles':len(triangles),'trees':len(trees),'benches':len(benches),'lamps':len(lamps),'crossings':len(crossings),'curbLines':len(curbs),'ownershipTransfers':0,'publicBlockEnvelopeExceptions':len(head_rows),'approvedPublicPocketAreaM2':round(public_heads.area,2)}
    data = {'schemaVersion':1,'id':'barrio-context','coordinate':barrio['coordinate'],'yaw':barrio.get('yaw',-.59),'researchDate':'2026-11-21',
      'districtOutline':[geo(q) for q in selection.exterior.coords], 'precinctOutline':barrio['footprint'],
      'selectionNote':'Public streets adjoining the seven Barrio blocks, the mapped north park and complete nearby cadastral building parts. The current footprint and later replacements are retained; no historical square or removed Avenida gardens are rebuilt.',
      'surfaces':surfaces,'paths':[],'trees':trees,'shrubs':[],'benches':benches,'lamps':lamps,'curbLines':curbs,'crossings':crossings,'pavingJoints':[],'parkingRows':parking_rows,'fences':[],'gates':[],'treePits':tree_pits,'buildings':new_buildings,'roads':roads,
      'foundationPatches':[], 'excludedBuildingIds':sorted(new_ids), 'excludedRoadIds':sorted(replaced), 'genericStreetExclusions':masks,'vegetationExclusions':vegetation_masks,'collisionPolygons':collision,
      'architectureExclusions':[record('barrio-private-'+str(i),p,owner='barrio-model') for i,p in enumerate(polygons(private_mask))],
      'withheldBuildingIds':sorted(withheld_ids), 'sharedContext':{'buildings':shared_buildings,'architectureEnvelopes':[dict(r,displayHeightM=float(r.get('surfaceHeightEstimate') or max(3.1,int(r.get('levels') or 1)*3))) for r,p in local_parts], 'note':'Listed only for camera and tree clearance; rendered by their existing owners.'},
      'focusSpecs':focus_specs, 'ownershipTransfers':[], 'blockEnvelopeExceptions':head_rows, 'blockEnvelopeExceptionNote':'Two approved current public parking/sidewalk pockets C/D, documented in PNOA. No domestic or earlier context geometry is transferred; every garden, corral and cadastral part is excluded.',
      'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','terrainGridM':5,'terrainGridOrigin':[0,0],'terrainDiagonal':'x=z','surfaceLiftM':.041,'vertices':vertices,'groups':[{'component':k,'indices':v} for k,v in groups.items()]},
      'sources':[
        {'id':'bo-pnoa-context','title':'IGN · PNOA Máxima Actualidad · entorno del Barrio Obrero','url':PHOTO_URL,'retrieved':'2026-11-21','acquisitionDate':None,'note':'Source orthophoto retained for verification; retrieval is not flight date. Positions digitised visually; furniture and vegetation dimensions interpreted.'},
        {'id':'bo-catalogo','title':'Ayuntamiento de Sagunto · Catálogo del patrimonio del Puerto · Barrio Obrero, pp77–96','url':'https://aytosagunto.es/media/u1ip2u2f/03-97_catalogo_proteccion_patrimonio_puerto_sagunto_2-de-9_opt.pdf','note':'p79 original public space; p81 transformations; p82 street sections. Historical sections inform proportions, not an assertion of unchanged paving.'},
        {'id':'bo-catastro','title':'Dirección General del Catastro · INSPIRE Buildings · Sagunto','url':'https://www.catastro.hacienda.gob.es/webinspire/index.html','sourceFile':'port-cartography.json','note':'Retained complete source footprints and courtyard holes. Facade rhythm and trim are interpreted; roof estimates retain existing IGN attribution.'},
        {'id':'bo-osm','title':'OpenStreetMap contributors · road axes and street names','url':'https://www.openstreetmap.org/#map=18/39.66170/-0.22541','license':'ODbL','sourceFile':'port-cartography.json','note':'Existing source coordinates preserved; display widths from photo and catalogue are approximate.'}
      ],
      'currentState':{'status':'cartographic visual reconstruction','basis':'Retained Catastro/OSM data and PNOA; no field survey','historicalSquareRebuilt':False,'removedAvenidaFrontGardensRebuilt':False,'privateBlocksRenderedHere':False,'treeSpeciesVerified':False,'furnitureMeasured':False,'publicHeadPocketsAdded':2},
      'provenance':{'sourceHashes':source_hashes,'photoBounds':PHOTO_BOUNDS,'photoSize':PHOTO_SIZE,'referencePhoto':'research/validation-v29/barrio-context-orthophoto-reference.jpg','sourceCadastralPartsUnchanged':True,'previousContextsModified':False,'approvedPublicHeadSource':'research/validation-v29/barrio-public-heads-approved.json','approvedPublicHeadHash':hashlib.sha256((OUT/'barrio-public-heads-approved.json').read_bytes()).hexdigest()},'stats':stats}
    (DATA/'barrio-context.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    triangle_union=unary_union(triangles)
    checks={'previousGroundOverlapM2':pavement.intersection(previous_surfaces).area,'privateBlockGroundOverlapM2':pavement.intersection(private_mask).area,'architectureGroundOverlapM2':pavement.intersection(architecture).area,'triangulationGapM2':pavement.difference(triangle_union).area,'triangulationExcessM2':triangle_union.difference(pavement).area,'triangleOverlapM2':sum(t.area for t in triangles)-triangle_union.area,'duplicateBuildingIds':sorted(new_ids&previous_ids),'heritageBuildingIdsStolen':sorted(new_ids&core_ids),'sourceGeometryPreserved':all(any(r['id']==s['id'] and r['coordinates']==s['coordinates'] and r.get('holes',[])==s.get('holes',[]) for s in cart['buildings']) for r in new_buildings),'treeTrunksInsidePrivateBlocks':sum(private_mask.intersects(Point(project(r['coordinate']))) for r in trees),'treeTrunksInsideArchitecture':sum(architecture.intersects(Point(project(r['coordinate']))) for r in trees),'previousFilesUnmodified':all(hashlib.sha256((DATA/n).read_bytes()).hexdigest()==h for n,h in source_hashes.items()),'focusCount':len(focus_specs),'actualDomesticGroundOverlapM2':pavement.intersection(domestic).area,'nominalBlockOverlapM2':pavement.intersection(blocks).area,'approvedPublicPocketOverlapM2':pavement.intersection(blocks).intersection(public_heads).area,'unapprovedBlockGroundOverlapM2':pavement.intersection(blocks).difference(public_heads).area}
    assert all(checks[k]<1e-5 for k in ['previousGroundOverlapM2','privateBlockGroundOverlapM2','architectureGroundOverlapM2','actualDomesticGroundOverlapM2','unapprovedBlockGroundOverlapM2','triangulationGapM2','triangulationExcessM2'])
    assert abs(checks['triangleOverlapM2'])<1e-5 and not checks['duplicateBuildingIds'] and not checks['heritageBuildingIdsStolen']
    assert checks['sourceGeometryPreserved'] and checks['previousFilesUnmodified'] and not checks['treeTrunksInsidePrivateBlocks'] and not checks['treeTrunksInsideArchitecture']
    (OUT/'barrio-context-geometry-validation.json').write_text(json.dumps({'stats':stats,'checks':checks,'focusSpecs':focus_specs},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'stats':stats,'checks':checks},ensure_ascii=False,indent=2))
    return data

if __name__=='__main__':
    build()
