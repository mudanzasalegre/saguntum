"""V30: exterior public setting of the Antiguo Sanatorio.

Catastro parts and OSM axes are retained. Public ground is clipped against the
complete model-owned precinct and every existing contextual owner. PNOA pixels
support public paths, planting, crossings and roundabout islands; heights and
small furnishing remain interpreted. No acquisition date is inferred from the
date on which the orthophoto service was read.
"""
from pathlib import Path
import hashlib, importlib.util, json, math, sys
try:
    import shapely
    assert hasattr(shapely, 'constrained_delaunay_triangles')
except (ImportError, AssertionError):
    sys.path.insert(0, '/workspace/scratch/36862867499f/begona-context-deps')
    for key in list(sys.modules):
        if key == 'shapely' or key.startswith('shapely.'):
            del sys.modules[key]
    import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT/'dist/assets/data'
OUT = ROOT/'research/validation-v30'
spec = importlib.util.spec_from_file_location('gerencia_ground_helpers', ROOT/'research/validation-v25/prepare_gerencia_context.py')
G = importlib.util.module_from_spec(spec)
spec.loader.exec_module(G)
project, geo, polygon, polygons, lines, record, line_record = G.project, G.geo, G.polygon, G.polygons, G.lines, G.record, G.line_record
read = lambda name: json.loads((DATA/(name+'.json')).read_text())
PHOTO_BOUNDS = {'west':-.2316,'east':-.2255,'south':39.6619,'north':39.6660}
PHOTO_SIZE = [2600,2100]
PHOTO_URL = 'https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.6619%2C-0.2316%2C39.6660%2C-0.2255&width=2600&height=2100&format=image%2Fjpeg'
def photo(p):
    return project((PHOTO_BOUNDS['west']+p[0]/PHOTO_SIZE[0]*(PHOTO_BOUNDS['east']-PHOTO_BOUNDS['west']), PHOTO_BOUNDS['north']-p[1]/PHOTO_SIZE[1]*(PHOTO_BOUNDS['north']-PHOTO_BOUNDS['south'])))
def traced(p):return Polygon([photo(q) for q in p]).buffer(0)
def photo_line(p):return LineString([photo(q) for q in p])
def ellipse(cx,cy,rx,ry):return traced([(cx+rx*math.cos(i*math.tau/80),cy+ry*math.sin(i*math.tau/80)) for i in range(80)])
def no_hole_records(id, shape, **kwargs):
    result=[]
    for p in polygons(shape):
        parts=list(shapely.constrained_delaunay_triangles(p).geoms) if p.interiors else [p]
        for q in parts:result.append(record(id+'-'+str(len(result)),q,**kwargs))
    return result

def triangulate_regions(regions):
    """Match the actual Puerto grid, including its western 12.5 m band.

    Sanatorio's adjacent park extends west of x=4100, beyond the 5 m core.
    Cutting only a uniform 5 m grid there would cross the terrain diagonals.
    """
    def axis(low,high,core_low,core_high):
        a=[low];v=low
        while v<high:
            v=min(high,v+(5 if core_low<=v<core_high else 12.5));a.append(v)
        return a
    xs=axis(3650,7050,4100,5500);zs=axis(550,3950,1450,2900)
    paving=unary_union([p for _,p in regions]);vertices=[];lookup={};groups={};triangles=[]
    def vertex(p):
        key=tuple(round(v,8) for v in p)
        if key not in lookup:lookup[key]=len(vertices);vertices.append(list(key))
        return lookup[key]
    minx,minz,maxx,maxz=paving.bounds
    for x0,x1 in zip(xs,xs[1:]):
        if x1<minx or x0>maxx:continue
        for z0,z1 in zip(zs,zs[1:]):
            if z1<minz or z0>maxz or not paving.intersects(box(x0,z0,x1,z1)):continue
            for cell in [Polygon([(x0,z0),(x0,z1),(x1,z1)]),Polygon([(x0,z0),(x1,z1),(x1,z0)])]:
                for component,shape in regions:
                    for piece in polygons(shape.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area<1e-8:continue
                            ids=[vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids))==3:
                                groups.setdefault(component,[]).extend(ids);triangles.append(Polygon([vertices[i] for i in ids]))
    return vertices,groups,triangles,paving

def build():
    OUT.mkdir(exist_ok=True)
    cart=read('port-cartography')
    site=next(s for s in read('port-workers')['sites'] if s['id']=='sanatorio')
    boundary=Polygon([project(q) for q in site['footprint']]).buffer(0)
    # OSM's Triángulo Umbral polygon includes both the former hospital precinct
    # and its adjoining public park. Only its exterior portion is owned here.
    park_source=next(r for r in cart['landcover'] if str(r['id'])=='157295303')
    park=polygon(park_source)
    selection=boundary.buffer(48).union(park.buffer(22)).buffer(0)
    prior_names=['horno','talleres','museo-industrial','gerencia','casino','begona','economato','barrio']
    prior={name:read(name+'-context') for name in prior_names}
    source_hashes={name+'-context.json':hashlib.sha256((DATA/(name+'-context.json')).read_bytes()).hexdigest() for name in prior_names}
    source_hashes.update({name+'.json':hashlib.sha256((DATA/(name+'.json')).read_bytes()).hexdigest() for name in ['port-cartography','port-elevation']})
    previous_surfaces=unary_union([polygon(r) for d in prior.values() for r in d.get('surfaces',[])])
    previous_ids={str(i) for d in prior.values() for i in d.get('excludedBuildingIds',[])}
    withheld_ids={str(i) for d in prior.values() for i in d.get('withheldBuildingIds',[])}
    withheld_ids.update(str(r['id']) for d in prior.values() for r in d.get('withheldBuildingParts',[]))
    heritage=[s for name in ['port-industrial','port-garden','port-workers'] for s in read(name)['sites']]
    protected_parents={str(i) for s in heritage for i in s.get('catastroBuildingIds',[])}
    protected_osm={str(i) for s in heritage for i in s.get('osmBuildingIds',[])}
    other_heritage=unary_union([Polygon([project(q) for q in s['footprint']]).buffer(1.2) for s in heritage if s['id']!='sanatorio' and s.get('footprint')])
    all_buildings=[(r,polygon(r)) for r in cart['buildings']]
    core_ids={r['id'] for r in site['parts']}
    core=[r for r,p in all_buildings if r['id'] in core_ids]
    local_parts=[(r,p) for r,p in all_buildings if p.intersects(selection.buffer(10)) and str(r['id']) not in withheld_ids]
    architecture=unary_union([p for r,p in local_parts])
    buildings=[]
    for r,p in local_parts:
        if r['id'] in core_ids or str(r['id']) in previous_ids or str(r.get('parentId')) in protected_parents or str(r['id']) in protected_osm or p.intersects(boundary):continue
        if not selection.covers(p.centroid) or p.area<5:continue
        h=float(r.get('surfaceHeightEstimate') or max(3.1,int(r.get('levels') or 1)*3))
        buildings.append(dict(r,contextComponent='sanatorio-frente-urbano',displayHeightM=h,renderingType='urban',roofForm='source-plan',facadeColor=['#d1c6b7','#c9bbaa','#ddd3c4','#c7c0b3','#cbbfa9'][len(buildings)%5],facadeMeasured=False))
    new_ids={str(r['id']) for r in buildings}
    shared=[r for r,p in local_parts if str(r['id']) not in new_ids]

    # Source geometry is preserved, while display widths follow the visible
    # contemporary carriageways and footways in the retained orthophoto.
    widths={'39303169':9.8,'85310670':10.3,'449334983':10.4,'157105363':10.4,
            '157295302':18.0,'157106805':6.8,'1434708649':7.2,'157105341':8.4,
            '1394533029':8.4,'157373152':6.4,'157373154':6.4,'157373164':6.4,'157373157':6.4}
    roads,paths,road_shapes,path_shapes,sidewalk_shapes,replaced=[],[],[],[],[],[]
    active_domain=selection.difference(boundary.buffer(.025)).difference(other_heritage).difference(previous_surfaces)
    for r in cart['roads']:
        if r.get('tunnel')=='yes' or r.get('bridge')=='yes' or r.get('area')=='yes':continue
        axis=LineString([project(q) for q in r['coordinates']])
        if not axis.intersects(selection):continue
        kind=r.get('kind');pedestrian=kind in {'path','footway','cycleway','pedestrian','steps'}
        width=widths.get(str(r['id']),2.7 if pedestrian else 8.0 if kind=='tertiary' else 6.2)
        ext=axis.intersection(active_domain)
        whole=selection.covers(axis) and not axis.intersects(boundary.buffer(.05)) and not axis.intersects(previous_surfaces) and not axis.intersects(other_heritage)
        if whole:replaced.append(str(r['id']))
        for i,line in enumerate(lines(ext)):
            if line.length<.25:continue
            row=dict(r,id=str(r['id'])+'-sanatorio-'+str(i),sourceId=str(r['id']),sourceCoordinates=r['coordinates'],coordinates=[geo(q) for q in line.coords],displayWidthM=width,widthM=width,widthInterpretive=True,replacesWholeSource=whole,paintCenterLine=not pedestrian and str(r['id']) in ['39303169','85310670','449334983','157105363'],contextComponent='sanatorio-fleming' if pedestrian else 'sanatorio-hispanidad')
            shape=line.buffer(width/2,cap_style='round',join_style='round')
            if pedestrian:paths.append(row);path_shapes.append(shape)
            else:roads.append(row);road_shapes.append(shape);sidewalk_shapes.append(shape.buffer(2.2))
    # Public paved links and the circular open area west of Doctor Fleming are
    # visible in PNOA. Their surfaces are traced, not a reconstruction of an
    # unverified historical use or a new supposed monument.
    park_links=[([(534,456),(325,718),(301,784),(875,1141),(1458,1644)],4.7),
                ([(172,718),(301,784)],4.4), ([(534,456),(674,652),(780,832),(780,947),(735,1045)],4.4),
                ([(301,784),(683,1006),(877,1136)],4.7), ([(877,1136),(1060,1244),(1458,1644)],4.4)]
    for i,(pixels,width) in enumerate(park_links):
        axis=photo_line(pixels)
        for j,line in enumerate(lines(axis.intersection(active_domain))):
            paths.append(line_record('sanatorio-pnoa-park-link-'+str(i)+'-'+str(j),line,widthM=width,displayWidthM=width,sourceId='sa-pnoa-context',sourcePixels=pixels,contextComponent='sanatorio-fleming',interpretive=True))
            path_shapes.append(line.buffer(width/2,cap_style='round',join_style='round'))
    circular_public=ellipse(396,748,67,66)
    path_shapes.append(circular_public)
    roundabouts=[{'id':'ramon-sota','c':(422,173),'inner':(132,118),'outer':(202,183)},
                 {'id':'hispanidad-azzati','c':(1916,831),'inner':(39,43),'outer':(79,85)},
                 {'id':'azzati-octubre','c':(1557,1755),'inner':(34,36),'outer':(72,76)},
                 {'id':'maestrat-octubre','c':(65,813),'inner':(31,35),'outer':(72,78)}]
    islands=[]
    for r in roundabouts:
        inner=ellipse(*r['c'],*r['inner']);outer=ellipse(*r['c'],*r['outer']);islands.append(inner);road_shapes.append(outer.difference(inner));sidewalk_shapes.append(outer.buffer(2.3))
    island_union=unary_union(islands)
    road_union=unary_union(road_shapes).difference(island_union)
    path_union=unary_union(path_shapes).difference(road_union).difference(island_union)
    public_park=park.difference(boundary.buffer(.025)).difference(architecture.buffer(.05))
    park_earth=traced([(413,577),(497,550),(580,592),(668,726),(733,843),(735,962),(686,1010),(326,797),(317,721)])
    domain=selection.difference(boundary.buffer(.025)).difference(architecture.buffer(.04)).difference(previous_surfaces.buffer(.04)).difference(other_heritage)
    avenue_tree_pixels=[(676,574),(713,623),(748,671),(781,716),(814,765),(848,811),(879,858),(913,904),(944,953),(980,999),(1009,1046),(1044,1093),(1078,1139),(1111,1187),(1145,1234),(1177,1280),(1210,1325),(1247,1373),(1279,1418),(1311,1467),(1344,1513),(1376,1558),(1409,1605),(1443,1651),(641,424),(653,365)]
    avenue_pits=unary_union([Point(photo(p)).buffer(.48,quad_segs=6) for p in avenue_tree_pixels]).intersection(path_union).intersection(domain)
    regions=[('sanatorio-road',road_union),('sanatorio-tree-bed',avenue_pits),('sanatorio-park-path',path_union),('sanatorio-island-green',island_union),('sanatorio-park-earth',park_earth.intersection(public_park)),('sanatorio-park-green',public_park),('sanatorio-sidewalk',unary_union(sidewalk_shapes))]
    used=Polygon();disjoint=[]
    for key,shape in regions:
        s=shape.intersection(domain).difference(used).buffer(0)
        disjoint.append((key,s));used=used.union(s)
    region_shapes=dict(disjoint)
    tree_domain=region_shapes['sanatorio-park-green'].union(region_shapes['sanatorio-park-earth']).union(region_shapes['sanatorio-island-green']).union(region_shapes['sanatorio-tree-bed'])
    # Positions are photo-observed crown/trunk centres. Morphology and dimensions
    # are interpreted; botanical identities are not asserted for exterior trees.
    tree_pixels=[(413,429),(424,469),(473,489),(361,522),(407,586),(451,634),(504,585),(552,633),(588,677),(562,741),(523,771),(485,792),(445,809),(399,824),(354,819),(386,868),(454,910),(493,928),(531,956),(570,981),(614,1006),(646,1031),(686,1055),(651,977),(682,928),(689,850),(650,816),(617,782),(608,722),(628,712),(674,768),(721,812),
        (178,752),(185,841),(242,883),(281,918),(334,961),(397,994),(459,1031),(508,1055),(565,1092),(617,1126),(659,1152),(705,1185),(754,1207),(804,1241),(854,1269),(906,1300),(952,1326),(1004,1360),(1057,1390),(1103,1420),(1151,1444),(1193,1477),(1238,1508),(1280,1530),(1326,1556),(1370,1582),
        (506,402),(550,438),(584,477),(617,519),(648,564),(681,613),(714,658),(748,704),(783,753),(817,800),(850,847),(884,893),(919,942),(952,989),(986,1035),(1020,1081),(1054,1127),(1088,1174),(1121,1222),(1156,1270),(1191,1316),(1223,1362),(1259,1410),(1294,1457),(1326,1503),(1361,1551),(1395,1595),
        (881,1197),(805,1136),(758,1090),(742,1161),(787,1190),(829,1207),(906,1235),(954,1277),(993,1310),(1041,1341),(1093,1377),(1133,1420),(1179,1460),(1218,1489),(1295,1540),
        (1110,120),(1053,140),(997,159),(981,212),(948,255),(997,273),(1048,244),
        (1904,545),(1935,577),(1885,622),(1930,645),(1950,537)]+avenue_tree_pixels
    palms={(413,429),(424,469),(881,1197),(1103,1420),(1218,1489),(1395,1595)}
    previous_trees=[Point(project(r['coordinate'])) for d in prior.values() for r in d.get('trees',[])]
    trees=[];accepted=[]
    for i,pix in enumerate(tree_pixels):
        p=Point(photo(pix))
        if not tree_domain.buffer(.35).covers(p) or boundary.buffer(.2).intersects(p) or architecture.buffer(1.1).intersects(p) or any(p.distance(q)<2.5 for q in accepted+previous_trees):continue
        is_avenue=pix in avenue_tree_pixels
        kind='palm' if pix in palms else 'pine' if pix in [(641,424),(653,365)] or not is_avenue and pix[1]>880 and pix[0]<pix[1]-.9*300 else 'broadleaf'
        h=9.2+(i%4)*.5 if kind=='palm' else 7.5+(i%5)*.5 if kind=='pine' else 3.7+(i%3)*.2 if is_avenue else 5.0+(i%4)*.55
        radius=2.55 if kind=='palm' else 3.1+(i%4)*.22 if kind=='pine' else 1.05+(i%3)*.12 if is_avenue else 2.2+(i%4)*.19
        trees.append({'id':'sanatorio-context-tree-'+str(i),'coordinate':geo(p.coords[0]),'sourcePixel':list(pix),'kind':kind,'heightM':h,'crownRadiusM':radius,'sourceId':'sa-pnoa-context','positionFromPhoto':True,'dimensionsInterpretive':True,'speciesVerified':False});accepted.append(p)
    curbs=[]
    public_paving=region_shapes['sanatorio-sidewalk'].union(region_shapes['sanatorio-park-path'])
    kerb_domain=public_paving.union(tree_domain).buffer(.08).intersection(domain)
    for i,line in enumerate(lines(region_shapes['sanatorio-road'].boundary.intersection(kerb_domain).difference(selection.boundary.buffer(.4)))):
        if line.length>.65:curbs.append(line_record('sanatorio-kerb-'+str(i),line,heightM=.11,widthM=.15,sourceId='sa-pnoa-context',interpretive=True))
    crossing_pixels=[([(1222,538),(1262,561)],'hispanidad-centro'), ([(1135,434),(1175,456)],'hispanidad-diagonal'), ([(1751,759),(1790,782)],'hispanidad-azzati'), ([(1812,968),(1855,980)],'azzati-norte'), ([(1761,1143),(1805,1154)],'azzati-cendoya'), ([(1708,1381),(1746,1393)],'azzati-llombart'), ([(1649,1630),(1690,1642)],'azzati-sur'), ([(1397,1723),(1427,1687)],'octubre-fleming'), ([(1052,1500),(1081,1462)],'octubre-lope'), ([(696,1272),(725,1235)],'octubre-alfambra'), ([(458,1153),(489,1116)],'octubre-plana'), ([(128,886),(160,851)],'octubre-maestrat'), ([(113,690),(153,711)],'maestrat-parque')]
    crossings=[line_record('sanatorio-crossing-'+name,photo_line(pix),sourceId='sa-pnoa-context',sourcePixels=pix,interpretive=True) for pix,name in crossing_pixels if photo_line(pix).intersects(region_shapes['sanatorio-road'])]
    # A restrained set of benches follows visible public walking areas. This is
    # small-scale interpretive furnishing, not an inventory of municipal assets.
    benches=[];lamps=[]
    for i,pix in enumerate([(449,669),(425,805),(543,897),(709,989),(786,1062),(893,1155),(1040,1321),(1303,1552)]):
        p=Point(photo(pix))
        if public_paving.buffer(.5).covers(p) and not boundary.buffer(1).intersects(p) and not architecture.buffer(1).intersects(p):
            benches.append({'id':'sanatorio-context-bench-'+str(i),'coordinate':geo(p.coords[0]),'yaw':-.59,'sourceId':'sa-pnoa-context','interpretive':True})
    for i,pix in enumerate([(592,469),(715,637),(838,805),(956,978),(1078,1150),(1199,1321),(1320,1495),(1437,1657)]):
        p=Point(photo(pix))
        if public_paving.buffer(.4).covers(p) and not boundary.buffer(.3).intersects(p):lamps.append({'id':'sanatorio-context-lamp-'+str(i),'coordinate':geo(p.coords[0]),'heightM':4.8,'sourceId':'sa-pnoa-context','interpretive':True,'heritageStyle':False})
    vertices,groups,triangles,pavement=triangulate_regions(disjoint)
    surfaces=[record(key+'-'+str(i),p,component=key,regionId='entorno',sourceId='sa-pnoa-context',interpretive=True) for key,shape in disjoint for i,p in enumerate(polygons(shape))]
    focus_specs={
      'sanatorio-accesos-urbanos':{'label':'Accesos desde la ciudad','targetCoordinates':geo(photo((1081,1032))),'targetHeight':1.4,'far':[-36,30,40],'near':[-18,12,19],'radius':64,'fov':54,'regionId':'entorno'},
      'sanatorio-hispanidad':{'label':'La avenida de la Hispanidad','targetCoordinates':geo(photo((1289,557))),'targetHeight':2.6,'far':[-38,34,-44],'near':[-20,17,-23],'radius':94,'fov':54,'regionId':'entorno'},
      'sanatorio-fleming':{'label':'Doctor Fleming y el parque contiguo','targetCoordinates':geo(photo((784,981))),'targetHeight':2.5,'far':[-58,52,44],'near':[-27,28,23],'radius':100,'fov':54,'regionId':'entorno'},
      'sanatorio-frente-urbano':{'label':'El frente de Periodista Azzati','targetCoordinates':geo(photo((1805,1213))),'targetHeight':6.0,'far':[-55,43,32],'near':[-26,24,17],'radius':90,'fov':55,'regionId':'entorno'},
      'sanatorio-ciudad-factoria':{'label':'Del sanatorio a la ciudad actual','targetCoordinates':site['coordinate'],'targetHeight':12.0,'far':[-195,218,238],'near':[-114,126,141],'radius':238,'fov':54,'regionId':'memoria'}
    }
    masks=no_hole_records('sanatorio-public-mask',pavement.buffer(.055).difference(boundary.buffer(.012)),sourceId='sa-pnoa-context')
    vegetation_masks=no_hole_records('sanatorio-vegetation-mask',pavement.buffer(.4).difference(boundary),sourceId='sa-pnoa-context')
    collision=[record('sanatorio-context-building-'+str(i),p,sourceId=r['id']) for i,(r,p) in enumerate(local_parts) if str(r['id']) in new_ids]
    stats={'buildingParts':len(buildings),'cadastralParcels':len({r.get('parentId') for r in buildings}),'reusedBuildingParts':len(shared),'coreCadastralPartsPreserved':len(core),'roads':len(roads),'paths':len(paths),'pavingAreaM2':round(pavement.area,2),'pavingTriangles':len(triangles),'trees':len(trees),'benches':len(benches),'lamps':len(lamps),'crossings':len(crossings),'curbLines':len(curbs),'ownershipTransfers':0,'historicalPrecinctAreaM2':round(boundary.area,2)}
    data={'schemaVersion':1,'id':'sanatorio-context','coordinate':site['coordinate'],'yaw':49*math.pi/180,'researchDate':'2026-11-21','districtOutline':[geo(q) for q in selection.exterior.coords],'precinctOutline':site['footprint'],
      'selectionNote':'Contemporary public setting around the complete former Sanatorio precinct: Avenida de la Hispanidad, Periodista Azzati, the pedestrian Avenida Doctor Fleming, the adjoining western public park and complete neighbouring cadastral parts. No historical orange groves are reconstructed.',
      'surfaces':surfaces,'paths':paths,'trees':trees,'shrubs':[],'benches':benches,'lamps':lamps,'curbLines':curbs,'crossings':crossings,'pavingJoints':[],'parkingRows':[],'fences':[],'gates':[],'treePits':[],'buildings':buildings,'roads':roads,
      'foundationPatches':[],'excludedBuildingIds':sorted(new_ids),'excludedRoadIds':sorted(set(replaced)),'genericStreetExclusions':masks,'vegetationExclusions':vegetation_masks,'collisionPolygons':collision,'architectureExclusions':[record('sanatorio-model-owned-precinct',boundary,owner='sanatorio-model')],
      'withheldBuildingIds':sorted(withheld_ids),'sharedContext':{'buildings':shared,'architectureEnvelopes':[dict(r,displayHeightM=float(r.get('surfaceHeightEstimate') or max(3.1,int(r.get('levels') or 1)*3))) for r,p in local_parts],'note':'Listed for camera/tree clearance; rendered by their existing owners.'},'focusSpecs':focus_specs,'ownershipTransfers':[],
      'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','terrainGridM':None,'coreSpacingM':5,'outerSpacingM':12.5,'terrainGridOrigin':[3650,550],'coreBounds':{'minX':4100,'maxX':5500,'minZ':1450,'maxZ':2900},'terrainDiagonal':'x=z','surfaceLiftM':.041,'vertices':vertices,'groups':[{'component':k,'indices':v} for k,v in groups.items()]},
      'sources':[{'id':'sa-pnoa-context','title':'IGN · PNOA Máxima Actualidad · Sanatorio y entorno','url':PHOTO_URL,'retrieved':'2026-11-21','acquisitionDate':None,'note':'Retained georeferenced orthophoto; retrieval date is not flight date. Positions photo-read; dimensions and furnishing interpreted.'},
        {'id':'sa-catastro-context','title':'Dirección General del Catastro · INSPIRE Buildings · Sagunto','url':'https://www.catastro.hacienda.gob.es/webinspire/index.html','sourceFile':'port-cartography.json','note':'Complete source footprints and courtyard holes. Height estimates retain IGN provenance; facade details interpreted.'},
        {'id':'sa-osm-context','title':'OpenStreetMap contributors · Sanatorio and Triángulo Umbral setting','url':'https://www.openstreetmap.org/#map=18/39.66429/-0.22875','license':'ODbL','sourceFile':'port-cartography.json','note':'Source road axes and names preserved. Display widths and supplemental photo-traced public paths are approximate.'},
        {'id':'sa-contrast-context','title':'CONTRAST / APIPS · Antiguo Sanatorio de AHV','url':'https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_sana.htm','note':'Documents historical peripheral siting among orange groves and present absorption into the city. Those historical fields are not part of this contemporary setting.'}],
      'currentState':{'status':'cartographic visual reconstruction','basis':'Retained Catastro/OSM and PNOA orthophoto; no field survey','historicalOrangeGrovesRebuilt':False,'historicalPrecinctRenderedHere':False,'treeSpeciesVerified':False,'furnitureMeasured':False},
      'provenance':{'sourceHashes':source_hashes,'photoBounds':PHOTO_BOUNDS,'photoSize':PHOTO_SIZE,'referencePhoto':'research/validation-v30/sanatorio-context-orthophoto-reference.jpg','sourceCadastralPartsUnchanged':True,'previousContextsModified':False},'stats':stats}
    (DATA/'sanatorio-context.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    union=unary_union(triangles)
    checks={'previousGroundOverlapM2':pavement.intersection(previous_surfaces).area,'precinctGroundOverlapM2':pavement.intersection(boundary).area,'architectureGroundOverlapM2':pavement.intersection(architecture).area,'triangulationGapM2':pavement.difference(union).area,'triangulationExcessM2':union.difference(pavement).area,'triangleOverlapM2':sum(p.area for p in triangles)-union.area,'duplicateBuildingIds':sorted(new_ids&previous_ids),'heritageBuildingIdsStolen':sorted(new_ids&core_ids),'sourceGeometryPreserved':all(any(r['id']==s['id'] and r['coordinates']==s['coordinates'] and r.get('holes',[])==s.get('holes',[]) for s in cart['buildings']) for r in buildings),'treeTrunksInsidePrecinct':sum(boundary.intersects(Point(project(r['coordinate']))) for r in trees),'treeTrunksInsideArchitecture':sum(architecture.intersects(Point(project(r['coordinate']))) for r in trees),'previousFilesUnmodified':all(hashlib.sha256((DATA/n).read_bytes()).hexdigest()==h for n,h in source_hashes.items()),'focusCount':len(focus_specs),'corePartsPreserved':len(core)}
    assert all(checks[k]<1e-5 for k in ['previousGroundOverlapM2','precinctGroundOverlapM2','architectureGroundOverlapM2','triangulationGapM2','triangulationExcessM2'])
    assert abs(checks['triangleOverlapM2'])<1e-5 and not checks['duplicateBuildingIds'] and not checks['heritageBuildingIdsStolen']
    assert checks['sourceGeometryPreserved'] and checks['previousFilesUnmodified'] and not checks['treeTrunksInsidePrecinct'] and not checks['treeTrunksInsideArchitecture']
    (OUT/'sanatorio-context-geometry-validation.json').write_text(json.dumps({'stats':stats,'checks':checks,'focusSpecs':focus_specs},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'stats':stats,'checks':checks},ensure_ascii=False,indent=2))
    return data

if __name__=='__main__':build()
