"""Reproducible mapped setting of the Nave de Talleres Generales.

PNOA ground edges are recorded as pixels in the accompanying georeferenced
reference. Catastro building parts and OSM street axes remain unchanged. This
is a display reconstruction, not a topographic or present-day condition survey.
Requires Shapely >= 2.1. The source images are evidence, not runtime textures.
"""
from pathlib import Path
import hashlib
import json
import math
import statistics
import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'
OUT=ROOT/'research/validation-v23'
SCALE=111320*math.cos(math.radians(39.679))
COORDINATE=[-.2182925,39.65632195]
project=lambda p:((p[0]+.278)*SCALE,(39.679-p[1])*111320)
geo=lambda p:[round(-.278+p[0]/SCALE,9),round(39.679-p[1]/111320,9)]
CX,CZ=project(COORDINATE)
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
PHOTO_BOUNDS={'west':-.22060,'east':-.21600,'south':39.65480,'north':39.65785}
PHOTO_SIZE=[1800,1600]
PHOTO_URL='https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.65480%2C-0.22060%2C39.65785%2C-0.21600&width=1800&height=1600&format=image%2Fjpeg'
def photo(p):
    x,y=p
    return project((PHOTO_BOUNDS['west']+x/1800*(PHOTO_BOUNDS['east']-PHOTO_BOUNDS['west']),PHOTO_BOUNDS['north']-y/1600*(PHOTO_BOUNDS['north']-PHOTO_BOUNDS['south'])))
def polygons(s):
    if s.geom_type=='Polygon' and s.area>1e-8:yield s
    elif hasattr(s,'geoms'):
        for g in s.geoms:yield from polygons(g)
def lines(s):
    if s.geom_type=='LineString' and s.length>.02:yield s
    elif hasattr(s,'geoms'):
        for g in s.geoms:yield from lines(g)
def polygon(r):return Polygon([project(p) for p in r['coordinates']],[[project(p) for p in ring] for ring in r.get('holes',[])]).buffer(0)
def record(id,p,**kw):return {'id':id,'coordinates':[geo(q) for q in p.exterior.coords],'holes':[[geo(q) for q in ring.coords] for ring in p.interiors],**kw}
def line_record(id,p,**kw):return {'id':id,'coordinates':[geo(q) for q in p.coords],**kw}
def traced(p):return Polygon([photo(q) for q in p]).buffer(0)
def ellipse(cx,cy,rx,ry):return [(cx+rx*math.cos(i*math.tau/64),cy+ry*math.sin(i*math.tau/64)) for i in range(64)]

def triangulate_regions(regions):
    """Intersect each paving face with the actual 5 m regional mesh triangles."""
    paving=unary_union([p for _,p in regions]);vertices=[];lookup={};groups={};triangles=[]
    def vertex(p):
        key=tuple(round(v,8) for v in p)
        if key not in lookup:lookup[key]=len(vertices);vertices.append(list(key))
        return lookup[key]
    minx,minz,maxx,maxz=paving.bounds
    for ix in range(math.floor(minx/5),math.ceil(maxx/5)):
        for iz in range(math.floor(minz/5),math.ceil(maxz/5)):
            x,z=ix*5,iz*5
            if not paving.intersects(box(x,z,x+5,z+5)):continue
            cells=[Polygon([(x,z),(x,z+5),(x+5,z+5)]),Polygon([(x,z),(x+5,z+5),(x+5,z)])]
            for cell in cells:
                for component,shape in regions:
                    for piece in polygons(shape.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area<1e-8:continue
                            ids=[vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids))==3:
                                groups.setdefault(component,[]).extend(ids);triangles.append(Polygon([vertices[i] for i in ids]))
    return vertices,groups,triangles,paving

def build():
    cartography=read('port-cartography');horno=read('horno-context')
    source=next(s for s in read('port-industrial')['sites'] if s['id']=='talleres')
    photo_frame=traced([(0,0),(1800,0),(1800,1600),(0,1600)])
    horno_district=Polygon([project(q) for q in horno['districtOutline']]).buffer(.7)
    selection=Point(CX,CZ).buffer(195,quad_segs=32).intersection(photo_frame).difference(horno_district)
    all_buildings=[(r,polygon(r)) for r in cartography['buildings']]
    core=[r for r,p in all_buildings if r.get('parentId')=='8437307YJ3983S' or str(r['id'])=='154001633']
    core_ids={str(r['id']) for r in core}|{'154001633'}
    core_shape=unary_union([polygon(r) for r in core]+[Polygon([project(q) for q in source['footprint']])])
    # These are the actual four residential parcels on the northern side of
    # Juan Torres Casado. Other houses remain in the regional city owner.
    chosen={'8736201YJ3983N','8836301YJ3983N','8836601YJ3983N','8836602YJ3983N'}
    buildings=[];height_reviews=[]
    for r,p in all_buildings:
        if r.get('parentId') not in chosen:continue
        same=[b for b,g in all_buildings if b.get('parentId')==r.get('parentId') and b.get('surfaceHeightEstimate')]
        parent_h=statistics.median(b['surfaceHeightEstimate'] for b in same) if same else 10
        estimated=r.get('surfaceHeightEstimate')
        # Small rooftop/courtyard parts often have too few raster pixels; do
        # not turn a connected roof piece into a one-storey isolated garage.
        h=float(estimated or (parent_h if int(r.get('levels') or 1)==1 and p.area<100 else max(3,int(r.get('levels') or 3)*3)))
        method='Existing IGN MDSnE2.5 roof estimate' if estimated else 'Median of neighbouring parts of the same cadastral parent' if int(r.get('levels') or 1)==1 and p.area<100 else 'Attributed source storeys × 3 m visual estimate'
        buildings.append(dict(r,contextComponent='talleres-entorno',displayHeightM=h,renderingType='residential',roofForm='source-plan',facadeColor='#d0ba9c'))
        height_reviews.append({'id':str(r['id']),'displayHeightM':h,'method':method,'measuredFacade':False,'interpretive':True})
    own_footprints=unary_union([polygon(r) for r in buildings])
    all_footprints=unary_union([p for r,p in all_buildings if p.distance(Point(CX,CZ))<350])
    owned_ids=core_ids|{str(r['id']) for r in buildings}

    # Trace the visible ground, not the roof displacement in the ortho mosaic.
    plot_pixels=[(575,486),(657,465),(735,473),(1238,782),(1289,842),(1544,940),(1577,1010),(1512,1065),(1425,1100),(1179,1141),(1010,1180),(891,1222),(795,1325),(650,1570),(270,1570),(302,1339),(344,1061),(387,805),(432,634),(486,547)]
    forecourt_pixels=[(1221,795),(1330,849),(1295,935),(1224,1041),(1160,1164),(972,1209),(1042,1106)]
    northwest_pixels=[(482,554),(572,491),(722,475),(559,832),(436,855),(423,798),(445,673)]
    vacant_pixels=[(849,324),(986,344),(1208,392),(1489,440),(1712,485),(1763,540),(1780,588),(1757,680),(1730,744),(1696,795),(1640,823),(1567,794),(1477,768),(1420,681),(1324,663),(1256,657),(1140,603),(998,519),(891,449),(851,400)]
    median_pixels=[(452,265),(474,337),(478,407),(452,452),(398,505),(364,566),(342,629),(317,733),(279,1019),(227,1321),(195,1500),(242,1513),(290,1211),(327,967),(361,747),(408,590),(457,511),(502,456),(515,403),(510,335)]
    large_island_pixels=[(617,141),(676,147),(724,160),(765,187),(788,223),(796,265),(793,307),(777,350),(748,383),(711,404),(668,414),(626,408),(585,391),(552,361),(533,323),(524,281),(530,237),(549,194),(578,161)]
    small_island_pixels=ellipse(1391,770,63,66)
    southeast_island_pixels=ellipse(1733,1011,57,60)
    islands=[traced(large_island_pixels),traced(small_island_pixels),traced(southeast_island_pixels)]
    island_union=unary_union(islands)
    plot=traced(plot_pixels).difference(core_shape.buffer(.05))
    forecourt=traced(forecourt_pixels).difference(core_shape.buffer(.05))
    northwest=traced(northwest_pixels).difference(core_shape.buffer(.05))
    vacant=traced(vacant_pixels);median=traced(median_pixels)
    roads=[];replaced=[];road_shapes=[]
    roundabout_ids={'254622263','708060328','733702860','733702861','1299195523','77660811','156439658'}
    for r in cartography['roads']:
        if len(r['coordinates'])<2 or r.get('area')=='yes' or r.get('bridge')=='yes' or r.get('tunnel')=='yes':continue
        axis=LineString([project(q) for q in r['coordinates']])
        if not axis.intersects(selection):continue
        kind=r.get('kind');width=2.3 if kind in {'footway','cycleway','pedestrian'} else 7.4 if str(r['id']) in roundabout_ids else 6.8 if kind=='tertiary' else 5.8 if kind in {'residential','service'} else 6.1
        if r.get('width'):
            try:width=float(r['width'])
            except ValueError:pass
        whole=selection.covers(axis)
        if whole:replaced.append(str(r['id']))
        for i,part in enumerate(lines(axis.intersection(selection))):
            roads.append(dict(r,id=str(r['id'])+'-talleres-'+str(i),sourceId=str(r['id']),sourceCoordinates=r['coordinates'],coordinates=[geo(q) for q in part.coords],displayWidthM=width,widthInterpretive=not bool(r.get('width')),replacesWholeSource=whole,paintCenterLine=kind in {'residential','service','tertiary'} and str(r['id']) not in roundabout_ids,contextComponent='talleres-entorno'))
            road_shapes.append(part.buffer(width/2,cap_style='flat',join_style='round'))
    road_union=unary_union(road_shapes)
    road_area=road_union.difference(island_union).intersection(selection).difference(all_footprints.buffer(.2)).difference(core_shape.buffer(.15))
    outer_walk=road_union.buffer(1.6).difference(road_union).difference(island_union).intersection(selection).difference(all_footprints.buffer(.2)).difference(core_shape.buffer(.15))
    previous=Polygon();disjoint=[]
    regions=[('talleres-road',road_area),('talleres-forecourt',forecourt),('talleres-yard',plot.difference(northwest)),('talleres-gravel',northwest.union(vacant).union(median).union(islands[0]).union(islands[2])),('talleres-island',islands[1]),('talleres-sidewalk',outer_walk)]
    for key,shape in regions:
        shape=shape.intersection(selection).difference(previous).difference(all_footprints.buffer(.15)).difference(core_shape.buffer(.1));disjoint.append((key,shape));previous=previous.union(shape)
    vertices,groups,triangles,paving=triangulate_regions(disjoint)
    surfaces=[record(key+'-'+str(i),p,component=key,sourceId='talleres-pnoa' if key not in ['talleres-road','talleres-sidewalk'] else 'talleres-osm',interpretive=True) for key,shape in disjoint for i,p in enumerate(polygons(shape))]
    curbs=[]
    for label,shape in [('principal',traced(plot_pixels)),('rotonda-noroeste',islands[0]),('rotonda-interior',islands[1]),('rotonda-este',islands[2]),('solar-noreste',vacant)]:
        for i,line in enumerate(lines(LineString(shape.exterior.coords).intersection(selection))):curbs.append(line_record('talleres-bordillo-'+label+'-'+str(i),line,sourceId='talleres-pnoa',heightM=.13,widthM=.16,interpretive=True))

    # Photo-observed positions only. Crown, species and height are visual,
    # simplified interpretations, not a vegetation inventory.
    plant_rows=[((441,736),'palm',5.2,2.0),((449,695),'palm',5.8,2.2),((465,650),'palm',5.6,2.1),((483,615),'palm',5.3,1.9),((530,558),'palm',5.1,1.9),((558,537),'palm',5.0,1.8),((593,511),'palm',5.3,2.0),((629,494),'palm',5.0,1.7),((678,479),'palm',4.9,1.9),((558,769),'broadleaf',5.0,2.8),((584,728),'broadleaf',5.6,3.0),((418,800),'broadleaf',4.5,2.4),((408,601),'broadleaf',5.7,3.4),((352,674),'broadleaf',4.0,1.8),((335,893),'broadleaf',4.6,2.5),((365,826),'broadleaf',4.3,2.0),((430,382),'broadleaf',5.2,3.0),((444,354),'broadleaf',5.8,3.2),((473,324),'broadleaf',5.5,3.0),((413,338),'broadleaf',4.9,2.6),((611,156),'broadleaf',5.3,3.1),((643,170),'broadleaf',5.2,2.9),((676,178),'broadleaf',5.5,2.8),((710,181),'broadleaf',5.4,2.9),((742,180),'broadleaf',5.3,2.8),((877,207),'broadleaf',5.2,2.6),((906,210),'broadleaf',5.8,2.7),((939,214),'broadleaf',5.7,2.6),((970,223),'broadleaf',5.4,2.6),((1007,226),'broadleaf',5.5,2.6),((1038,232),'broadleaf',5.7,2.7),((1075,238),'broadleaf',5.8,2.8),((1111,245),'broadleaf',5.8,2.9),((1145,261),'broadleaf',6.1,3.4),((1214,278),'broadleaf',5.7,2.8),((1129,208),'broadleaf',4.6,2.1),((1081,187),'broadleaf',4.5,2.0),((1056,163),'broadleaf',4.2,1.8),((977,115),'broadleaf',4.7,2.0),((934,98),'broadleaf',4.5,2.1),((908,112),'broadleaf',4.7,2.0),((892,146),'broadleaf',4.4,2.0),((926,43),'broadleaf',5.4,2.6),((1001,313),'broadleaf',4.3,1.7),((1186,348),'broadleaf',4.2,1.6),((1350,388),'broadleaf',4.1,1.7),((1445,415),'broadleaf',4.4,1.8),((1591,442),'broadleaf',4.4,1.9),((1706,438),'broadleaf',4.1,1.8),((1627,584),'broadleaf',3.0,1.5),((1730,983),'broadleaf',4.4,2.3),((1720,1038),'broadleaf',4.3,2.2),((1761,1018),'broadleaf',4.0,2.0)]
    trees=[]
    for i,(pix,kind,h,r) in enumerate(plant_rows):
        p=Point(photo(pix))
        if not selection.covers(p) or all_footprints.intersects(p) or core_shape.intersects(p) or road_area.buffer(.35).intersects(p):continue
        trees.append({'id':'talleres-arbol-'+str(i),'coordinate':geo(p.coords[0]),'sourcePixel':list(pix),'kind':kind,'heightM':h,'crownRadiusM':r,'sourceId':'talleres-pnoa','positionFromPhoto':True,'dimensionsInterpretive':True})
    lamps=[]
    for i,pix in enumerate([(915,534),(1076,630),(1238,716),(1605,779),(1310,410),(991,358),(825,313),(408,686),(365,1024),(1000,1206)]):
        p=Point(photo(pix))
        if selection.covers(p):lamps.append({'id':'talleres-farola-'+str(i),'coordinate':geo(p.coords[0]),'heightM':5.3,'sourcePixel':list(pix),'sourceId':'talleres-pnoa','dimensionsInterpretive':True})
    crossings=[]
    for i,(a,b) in enumerate([((553,448),(589,478)),((790,369),(825,350)),((816,274),(853,281)),((1236,696),(1267,660)),((1493,850),(1510,814)),((1570,1120),(1603,1147)),((222,1450),(266,1465))]):
        l=LineString([photo(a),photo(b)])
        if selection.covers(l):crossings.append(line_record('talleres-paso-'+str(i),l,sourceId='talleres-pnoa',dimensionsInterpretive=True))
    joints=[]
    for i,pix in enumerate([[(1331,873),(1288,888),(1259,916),(1210,992),(1171,1052),(1134,1112)],[(1340,896),(1307,908),(1277,935),(1231,1006),(1192,1068),(1161,1119)],[(1352,923),(1329,930),(1301,954),(1255,1027),(1214,1090)]]):
        l=LineString([photo(q) for q in pix])
        for j,line in enumerate(lines(l.intersection(forecourt).intersection(selection))):joints.append(line_record('talleres-junta-plaza-'+str(i)+'-'+str(j),line,sourceId='talleres-pnoa',interpretive=True))

    # Suppress generic street furniture and speculative planting across the
    # controlled open setting, while preserving all unowned mapped buildings.
    unowned=unary_union([p for r,p in all_buildings if str(r['id']) not in owned_ids and p.intersects(selection.buffer(2))])
    mask_shape=selection.difference(unowned.buffer(.35))
    masks=[]
    for poly in polygons(mask_shape):
        parts=list(shapely.constrained_delaunay_triangles(poly).geoms) if poly.interiors else [poly]
        for p in parts:
            if p.area>.005:masks.append(record('talleres-mask-'+str(len(masks)),p))
    protected=[]
    for dataset in ['port-industrial','port-garden','port-workers']:
        for s in read(dataset)['sites']:
            if s['id']=='talleres':continue
            protected.append({'id':s['id'],'owner':'existing-port-model','coordinate':s['coordinate'],'osmBuildingIds':s.get('osmBuildingIds',[]),'renderedElsewhere':True})
    shared=[{'id':str(r['id']),'coordinates':r['coordinates'],'holes':r.get('holes',[]),'owner':'port-city','renderedElsewhere':True} for r,p in all_buildings if str(r['id']) not in owned_ids and p.intersects(selection)]
    context={'schemaVersion':1,'id':'talleres-context','coordinate':COORDINATE,'yaw':math.pi/3,'researchDate':'2026-11-20',
        'districtOutline':[geo(q) for q in selection.exterior.coords],
        'selectionNote':'195 m display selection cropped to the orthophoto and excluding the complete Alto Horno context with a 0.7 m guard. It is not a legal protection boundary.',
        'buildings':buildings,'heightReview':height_reviews,'coreBuildingParts':core,
        'excludedBuildingIds':sorted(owned_ids),'excludedRoadIds':sorted(replaced),
        'coreExclusion':record('talleres-building-owner',core_shape,owner='talleres-model'),
        'foundationPatches':[],'roads':roads,'surfaces':surfaces,'curbLines':curbs,'crossings':crossings,'pavingJoints':joints,
        'fences':[],'railAlignments':[],'trees':trees,'lamps':lamps,
        'genericStreetExclusions':masks,'vegetationExclusions':[record('talleres-planting-control',selection)],
        'collisionPolygons':[record('talleres-neighbour-'+str(i),p) for i,p in enumerate(polygons(own_footprints))],
        'sharedContext':{'buildings':shared,'heritage':protected,'excludedHornoDistrict':horno['districtOutline'],'policy':'The main nave and annexes belong to talleres.js; Alto Horno, Museo Industrial and other monuments retain their owners. No railway is reconstructed outside the nave without a verified trace.'},
        'focusSpecs':{'talleres-entorno':{'label':'La nave y la ciudad industrial','targetCoordinates':geo((CX+2,CZ-5)),'targetHeight':12,'far':[160,125,125],'near':[118,74,90],'radius':190,'fov':56}},
        'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','surfaceLiftM':.035,'terrainGrid':{'spacingM':5,'originXZ':[0,0],'diagonal':'x=z within each cell','coreBounds':{'minX':4100,'maxX':5500,'minZ':1450,'maxZ':2900}},'vertices':vertices,'groups':[{'component':key,'indices':ix} for key,ix in groups.items()]},
        'pavingNote':'Ejes OSM y anchuras visuales contrastadas con PNOA. Explanadas, rotondas, solares, bordillos y juntas son aproximaciones trazadas sobre la ortofoto; no mediciones topográficas.',
        'vegetationNote':'Posiciones visibles en PNOA; especies, copas y dimensiones interpretadas. Se conserva el vacío industrial.',
        'sources':[
            {'id':'talleres-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad, referencia georreferenciada','url':PHOTO_URL,'retrieved':'2026-11-20','flightDate':'Not verified; retrieval is not the capture date','license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'},
            {'id':'talleres-osm','title':'OpenStreetMap · trazado viario del Puerto','url':'https://www.openstreetmap.org/way/154001633','retrieved':'2026-11-19','license':'https://www.openstreetmap.org/copyright'},
            {'id':'talleres-catastro','title':'Dirección General del Catastro · INSPIRE Buildings, Sagunto','url':'https://www.catastro.hacienda.gob.es/webinspire/','metadataDate':'2026-08-21','retrieved':'2026-11-19'},
            {'id':'talleres-ign-ground','title':'IGN/CNIG · MDT05, terreno regional existente','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmdt','sourceGridSpacingM':5},
            {'id':'talleres-ign-heights','title':'IGN/CNIG · MDSnE2.5, alturas normalizadas existentes','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','caution':'Raster roof estimates, not current measured elevations.'},
            {'id':'talleres-boe','title':'BOE · Decreto 26/2024, anexos de historia y entorno industrial','url':'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-9526'}],
        'provenance':{'sourceHashes':{name:hashlib.sha256((DATA/name).read_bytes()).hexdigest() for name in ['port-cartography.json','port-industrial.json','port-elevation.json','horno-context.json']},
            'referencePhoto':{'path':'research/validation-v23/talleres-context-orthophoto-reference.jpg','geographicBounds':PHOTO_BOUNDS,'width':1800,'height':1600,'sha256':hashlib.sha256((OUT/'talleres-context-orthophoto-reference.jpg').read_bytes()).hexdigest()},
            'digitizedPixels':{'centralPlot':plot_pixels,'forecourt':forecourt_pixels,'northwest':northwest_pixels,'vacantNortheast':vacant_pixels,'westernMedian':median_pixels,'largeIsland':large_island_pixels,'smallIsland':small_island_pixels,'southeastIsland':southeast_island_pixels},
            'method':'Unchanged Catastro footprints and OSM axes. PNOA ground tracing, 5 m terrain-aligned paving, no duplicated furnace context or inferred external rail yard.'},
        'stats':{'buildingParts':len(buildings),'parentParcels':len(chosen),'sourceCoreParts':len(core),'roadFragments':len(roads),'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'trees':len(trees),'streetLamps':len(lamps),'crossings':len(crossings),'railLengthM':0,'protectedHeritageOwners':len(protected)}}
    (DATA/'talleres-context.json').write_text(json.dumps(context,ensure_ascii=False,separators=(',',':'))+'\n')
    actual=unary_union(triangles)
    checks=[
        {'pass':all(next(r for r,p in all_buildings if str(r['id'])==str(b['id']))['coordinates']==b['coordinates'] for b in buildings),'label':'All 31 nearby cadastral parts retain their original coordinates and courtyard rings'},
        {'pass':len(core)==13,'label':'All 13 cadastral nave parts are assigned to the detailed building owner'},
        {'pass':actual.symmetric_difference(paving).area<.001,'label':'Terrain triangles cover the paving exactly once','differenceAreaM2':actual.symmetric_difference(paving).area},
        {'pass':abs(sum(t.area for t in triangles)-actual.area)<.001,'label':'Paving triangles do not overlap'},
        {'pass':paving.intersection(all_footprints).area<.001 and paving.intersection(core_shape).area<.001,'label':'No paved surface crosses the nave or neighbouring buildings'},
        {'pass':paving.intersection(horno_district).area<.001,'label':'The entire Alto Horno context keeps its separate ownership'},
        {'pass':not set(horno['excludedBuildingIds'])&owned_ids,'label':'No detailed building ID is claimed by both Horno and Talleres'},
        {'pass':all(4100<=v[0]<=5500 and 1450<=v[1]<=2900 for v in vertices),'label':'All paving lies on the 5 m Puerto core mesh'},
        {'pass':all(not core_shape.intersects(Point(project(r['coordinate']))) for r in trees),'label':'Photo-guided planting remains outside the building'},
        {'pass':all(paving.intersection(polygon(b)).area<.001 for b in shared),'label':'Other regional building owners remain uncovered'},
    ]
    report={'pass':all(c['pass'] for c in checks),'checks':checks,'stats':context['stats'],'sourceHashes':context['provenance']['sourceHashes']}
    (OUT/'talleres-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if not report['pass']:raise SystemExit(1)
if __name__=='__main__':build()
