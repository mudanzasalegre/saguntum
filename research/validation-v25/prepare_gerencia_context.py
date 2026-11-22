"""Reproducible mapped setting of the Gerencia y ciudad jardín.

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
OUT=ROOT/'research/validation-v25'
SCALE=111320*math.cos(math.radians(39.679))
COORDINATE=[-.22322,39.65894]
project=lambda p:((p[0]+.278)*SCALE,(39.679-p[1])*111320)
geo=lambda p:[round(-.278+p[0]/SCALE,9),round(39.679-p[1]/111320,9)]
CX,CZ=project(COORDINATE)
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
PHOTO_BOUNDS={'west':-.2255,'east':-.2207,'south':39.65775,'north':39.66025}
PHOTO_SIZE=[1800,1215]
PHOTO_URL='https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.65775%2C-0.2255%2C39.66025%2C-0.2207&width=1800&height=1215&format=image%2Fjpeg'
def photo(p):
    x,y=p
    return project((PHOTO_BOUNDS['west']+x/1800*(PHOTO_BOUNDS['east']-PHOTO_BOUNDS['west']),PHOTO_BOUNDS['north']-y/1215*(PHOTO_BOUNDS['north']-PHOTO_BOUNDS['south'])))
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
    cart=read('port-cartography'); garden=next(s for s in read('port-garden')['sites'] if s['id']=='gerencia')
    prior={n:read(n+'-context') for n in ['horno','talleres','museo-industrial']}
    boundary=Polygon([project(q) for q in garden['footprint']]).buffer(0)
    frame=traced([(0,0),(1800,0),(1800,1215),(0,1215)])
    selection=boundary.buffer(42).intersection(frame)
    previous_surfaces=unary_union([polygon(r) for d in prior.values() for r in d['surfaces']]).buffer(.12)
    previous_vegetation=unary_union([Point(project(r['coordinate'])).buffer(r.get('crownRadiusM',3)) for d in prior.values() for r in d.get('trees',[])])
    previous_ids={str(i) for d in prior.values() for i in d.get('excludedBuildingIds',[])}
    all_buildings=[(r,polygon(r)) for r in cart['buildings']]
    heritage=[s for n in ['port-industrial','port-garden','port-workers'] for s in read(n)['sites']]
    protected_parents={p for s in heritage for p in s.get('catastroBuildingIds',[])}
    protected_osm={str(p) for s in heritage for p in s.get('osmBuildingIds',[])}
    protected=[{'id':s['id'],'owner':'gerencia-model' if s['id']=='gerencia' else 'existing-port-model','coordinate':s['coordinate'],'catastroBuildingIds':s.get('catastroBuildingIds',[]),'osmBuildingIds':s.get('osmBuildingIds',[]),'renderedElsewhere':True} for s in heritage]
    core=[r for r,p in all_buildings if r.get('parentId') in garden['catastroBuildingIds']]
    core_shape=unary_union([Polygon([project(q) for q in s['footprint']]) for s in garden['structures']])
    # Casino and Begoña retain their existing architecture and local furnishing.
    # The Casino garden rectangle is derived from the existing model frame.
    casino=next(s for s in heritage if s['id']=='casino')
    cp=[project(q) for q in casino['footprint']][:-1];cx=sum(q[0] for q in cp)/len(cp);cz=sum(q[1] for q in cp)/len(cp);yaw=-.59;cc=math.cos(yaw);ss=math.sin(yaw)
    local=[((x-cx)*cc-(z-cz)*ss,(x-cx)*ss+(z-cz)*cc) for x,z in cp];w=max(p[0] for p in local)-min(p[0] for p in local);d=max(p[1] for p in local)-min(p[1] for p in local);ox=(min(p[0] for p in local)+max(p[0] for p in local))/2;oz=(min(p[1] for p in local)+max(p[1] for p in local))/2;cx+=ox*cc+oz*ss;cz+=-ox*ss+oz*cc
    casino_garden=Polygon([(cx+x*cc+z*ss,cz-x*ss+z*cc) for x,z in [(w/2+1,-10),(w/2+25,-10),(w/2+25,18),(w/2+1,18)]]).buffer(.5)
    external_protected=unary_union([Polygon([project(q) for q in s['footprint']]).buffer(1.8) for s in heritage if s['id'] not in ['gerencia','casino'] and s.get('footprint')]+[Polygon([project(q) for q in casino['footprint']]).buffer(4),casino_garden])
    buildings=[];height_reviews=[]
    for r,p in all_buildings:
        if not p.intersects(selection) or boundary.intersects(p) or r.get('parentId') in protected_parents or str(r['id']) in protected_osm or str(r['id']) in previous_ids:continue
        # Only complete nearby parcel parts are upgraded; outer neighbourhood
        # remains with the generic city. Keep cadastral holes and coordinates.
        if p.centroid.distance(boundary)>38 or p.area<8:continue
        h=float(r.get('surfaceHeightEstimate') or max(3,int(r.get('levels') or 1)*3))
        buildings.append(dict(r,contextComponent='gerencia-limites',displayHeightM=h,renderingType='urban',roofForm='source-plan',facadeColor=['#d2c2ac','#c9b799','#d5c5b5','#c3b6a7'][len(buildings)%4]))
        height_reviews.append({'id':str(r['id']),'displayHeightM':h,'method':'Existing IGN MDSnE2.5 roof estimate' if r.get('surfaceHeightEstimate') else 'Attributed storeys; interpreted','measuredFacade':False})
    owned_ids={str(r['id']) for r in buildings}|{str(r['id']) for r in core}
    all_shape=unary_union([p for r,p in all_buildings if p.intersects(selection.buffer(10)) and str(r['id']) not in {str(v['id']) for d in prior.values() for v in d.get('withheldBuildingParts',[])}])
    paths=[];path_shapes=[]
    for i,row in enumerate(garden['paths']):
        if i==2:continue # parallel digitisation of the same principal walk
        line=LineString([project(q) for q in row['coordinates']]);width=float(row['width'])
        for j,part in enumerate(lines(line.intersection(boundary).difference(external_protected).difference(all_shape.buffer(.55)).difference(previous_surfaces))):
            paths.append(line_record('gerencia-path-'+str(i)+'-'+str(j),part,widthM=width,sourceId='ge-osm' if i==0 else 'ge-pnoa',regionId='jardines',source=row['source'],interpretive=i!=0))
            path_shapes.append(part.buffer(width/2,cap_style='round',join_style='round'))
    # Narrow garden links visible in the aerial reference, joining the retained
    # historic islands. Geometry records a visual reading, not the 2023 as-built survey.
    traces={
      'villa-links':[[[795,482],[822,459],[858,415],[882,394]],[[771,571],[823,537],[861,497],[926,484],[948,447]],[[813,618],[864,659],[918,690],[950,650]],[[1022,756],[1058,721],[1118,756],[1165,814]],[[1130,930],[1179,859],[1253,904],[1308,951]],[[1385,1016],[1450,980],[1492,931]]],
      'western-open':[(194,721),(251,680),(326,651),(427,690),(537,779),(590,856),(576,912),(408,877),(231,835)],
      'northern-open':[(405,374),(514,280),(606,198),(629,239),(616,318),(553,393),(536,470),(470,491)],
      'eastern-recovered':[(842,395),(953,385),(1022,356),(1081,376),(1207,633),(1373,725),(1505,826),(1517,960),(1455,1092),(1303,1060),(1161,1027),(1058,927),(945,833),(822,645)],
    }
    for i,row in enumerate(traces['villa-links']):
        axis=LineString([photo(p) for p in row]);width=2.0
        for j,part in enumerate(lines(axis.intersection(boundary).difference(external_protected).difference(all_shape.buffer(.5)).difference(previous_surfaces))):
            paths.append(line_record('gerencia-garden-link-'+str(i)+'-'+str(j),part,widthM=width,sourceId='ge-pnoa',regionId='jardines',interpretive=True));path_shapes.append(part.buffer(width/2,cap_style='round'))
    path_union=unary_union(path_shapes)
    roads=[];road_shapes=[];replaced=[]
    for r in cart['roads']:
        if r.get('tunnel')=='yes' or r.get('bridge')=='yes' or r.get('area')=='yes':continue
        axis=LineString([project(q) for q in r['coordinates']]);kind=r.get('kind');ext=axis.intersection(selection).difference(boundary.buffer(.5)).difference(previous_surfaces).difference(external_protected)
        width=2 if kind in {'path','footway','cycleway','pedestrian'} else 7.3 if kind in {'secondary','tertiary'} else 6.2
        if r.get('width'):
            try:width=float(r['width'])
            except ValueError:pass
        whole=selection.covers(axis) and not axis.intersects(previous_surfaces) and not axis.intersects(external_protected)
        if whole:replaced.append(str(r['id']))
        for i,line in enumerate(lines(ext)):
            roads.append(dict(r,id=str(r['id'])+'-gerencia-'+str(i),sourceId=str(r['id']),sourceCoordinates=r['coordinates'],coordinates=[geo(q) for q in line.coords],displayWidthM=width,widthInterpretive=not bool(r.get('width')),replacesWholeSource=whole,paintCenterLine=kind in {'residential','secondary','tertiary','unclassified'},contextComponent='gerencia-limites'))
            road_shapes.append(line.buffer(width/2,cap_style='flat',join_style='round'))
    road_union=unary_union(road_shapes)
    garden_area=boundary.difference(all_shape.buffer(.42)).difference(external_protected).difference(previous_surfaces)
    east=traced(traces['eastern-recovered']);west=traced(traces['western-open']);north=traced(traces['northern-open'])
    regions=[('gerencia-road',road_union),('gerencia-path',path_union),('gerencia-sidewalk',road_union.buffer(1.55).difference(road_union)),('gerencia-open-ground',west.union(north).intersection(garden_area)),('gerencia-east-garden',east.intersection(garden_area)),('gerencia-garden',garden_area)]
    disjoint=[];prev=Polygon()
    for component,shape in regions:
        shape=shape.intersection(selection).difference(prev).difference(all_shape.buffer(.26)).difference(external_protected).difference(previous_surfaces)
        disjoint.append((component,shape));prev=prev.union(shape)
    vertices,groups,triangles,paving=triangulate_regions(disjoint)
    surfaces=[record(k+'-'+str(i),p,component=k,regionId='jardines' if 'garden' in k or 'ground' in k or 'path' in k else 'conjunto',sourceId='ge-pnoa',interpretive=True) for k,s in disjoint for i,p in enumerate(polygons(s))]
    # Crowns digitised from the retained reference; broadleaf / pine / palm are
    # visual forms. Botanical species and heights are intentionally not asserted.
    tree_pixels=[(523,169),(493,268),(438,354),(403,426),(364,493),(322,560),(300,648),(301,700),(414,756),(428,642),(537,445),(596,428),(640,430),(720,465),(771,498),(749,536),(827,520),(845,568),(849,649),(909,752),(966,794),(1003,802),(969,848),(1065,730),(1007,490),(980,426),(927,395),(859,340),(801,308),(758,290),(710,303),(602,346),(1270,753),(1229,707),(1284,822),(1345,932),(1302,1009),(1138,1042),(1070,1031),(920,1000),(813,968),(725,903),(528,858),(477,814),(459,705),(1178,884),(543,121),(560,81),(544,221),(507,325),(447,335),(416,408),(359,463),(348,527),(310,590),(260,656),(202,700),(186,741),(154,792),(208,844),(257,864),(269,718),(342,701),(492,795),(553,809),(575,878),(631,918),(672,938),(776,924),(861,937),(919,971),(979,997),(1118,1028),(1164,1055),(1208,1053),(1257,1067),(1412,1042),(1460,1037),(1445,984),(1470,959),(1451,908),(1395,860),(1347,798),(1297,730),(1174,695),(1120,721),(1028,799),(959,747),(910,805),(889,761),(926,831),(871,680),(833,695),(787,704),(723,700),(676,657),(615,621),(547,570),(522,608),(684,279),(654,251),(711,282),(745,313),(790,339),(834,367),(878,393),(926,418),(1008,369),(1048,373),(1034,413),(995,466),(937,507),(902,536),(873,582),(831,538),(796,507),(731,551),(669,462),(619,470),(579,444),(561,415)]
    palms={(813,968),(1302,1009),(1138,1042),(1270,753),(1229,707),(1178,884),(1065,730),(849,649),(1007,490),(758,290),(619,470),(615,621),(575,878),(1174,695)}
    trees=[];accepted=[]
    for i,pix in enumerate(tree_pixels):
        point=Point(photo(pix));r=2.7 if pix in palms else 4.1+(i%5)*.23
        if not garden_area.covers(point) or all_shape.buffer(1.25).intersects(point) or path_union.buffer(.4).intersects(point) or previous_vegetation.intersects(point) or any(point.distance(q)<2.5 for q in accepted):continue
        kind='palm' if pix in palms else 'pine' if i%4==0 or pix[0]<570 else 'broadleaf';h=8+(i%5)*.7 if kind=='pine' else 9.4+(i%4)*.6 if kind=='palm' else 6.5+(i%6)*.6
        trees.append({'id':'gerencia-tree-'+str(i),'coordinate':geo(point.coords[0]),'sourcePixel':list(pix),'kind':kind,'heightM':h,'crownRadiusM':r,'sourceId':'ge-pnoa','positionFromPhoto':True,'dimensionsInterpretive':True,'speciesVerified':False});accepted.append(point)
    # Low planting clusters are restrained beneath the documented eastern
    # canopy. They do not create a fully restored manicured western garden.
    shrubs=[]
    for i,pix in enumerate([(856,484),(878,476),(895,466),(864,430),(836,448),(795,520),(822,561),(859,605),(1101,808),(1147,872),(1210,928),(1262,1000),(1324,1043)]):
        p=Point(photo(pix))
        if garden_area.covers(p) and not path_union.buffer(.3).intersects(p) and not all_shape.buffer(.5).intersects(p):shrubs.append({'id':'gerencia-shrub-'+str(i),'coordinate':geo(p.coords[0]),'radiusM':1.1+(i%3)*.25,'sourceId':'ge-pnoa','interpretive':True})
    lamps=[];benches=[]
    for i,row in enumerate(paths):
        if 'path-0-' not in row['id']:continue
        line=LineString([project(q) for q in row['coordinates']])
        for dist in range(14,int(line.length)-10,23):
            p=line.interpolate(dist);q=line.interpolate(min(line.length,dist+.1));dx=q.x-p.x;dz=q.y-p.y;l=math.hypot(dx,dz);nx=-dz/l;nz=dx/l
            for sign in [-1,1]:
                v=Point(p.x+sign*3.0*nx,p.y+sign*3.0*nz)
                if garden_area.covers(v) and not all_shape.buffer(.8).intersects(v):
                    lamps.append({'id':'gerencia-lamp-'+str(len(lamps)),'coordinate':geo(v.coords[0]),'heightM':4.0,'sourceId':'ge-2023','interpretive':True,'heritageStyle':False})
                    if sign>0 and dist%46<24:benches.append({'id':'gerencia-bench-'+str(len(benches)),'coordinate':geo(v.coords[0]),'yaw':-math.atan2(dz,dx),'sourceId':'ge-pnoa','interpretive':True})
    entrance=LineString([photo((1060,325)),photo((1088,311))]);gate={'coordinate':geo(photo((1074,318))),'yaw':math.atan2(*(lambda a,b:(b[0]-a[0],b[1]-a[1]))(photo((1065,335)),photo((1085,305)))),'clearWidthM':4.3,'heightM':3.2,'sourceId':'ge-pnoa','interpretive':True}
    fences=[]
    for i,line in enumerate(lines(LineString(boundary.exterior.coords).difference(entrance.buffer(4)).difference(external_protected).difference(previous_surfaces))):fences.append(line_record('gerencia-boundary-'+str(i),line,heightM=1.5,sourceId='ge-osm',interpretive=True))
    masks=[]
    controlled=paving.buffer(.1).difference(all_shape.buffer(.3))
    for poly in polygons(controlled):
        parts=list(shapely.constrained_delaunay_triangles(poly).geoms) if poly.interiors else [poly]
        for p in parts:
            if p.area>.005:masks.append(record('gerencia-mask-'+str(len(masks)),p))
    shared=[dict(r,owner='existing-port-model' if r.get('parentId') in protected_parents or str(r['id']) in protected_osm else 'previous-context' if str(r['id']) in previous_ids else 'port-city',renderedElsewhere=True) for r,p in all_buildings if str(r['id']) not in {str(r['id']) for r in buildings} and p.intersects(selection)]
    def focus(label,pix,far_pix,near_pix,heights,region='jardines',radius=50):
        a=photo(pix);f=photo(far_pix);n=photo(near_pix)
        return {'label':label,'targetCoordinates':geo(a),'targetHeight':heights[0],'far':[f[0]-a[0],heights[1]-heights[0],f[1]-a[1]],'near':[n[0]-a[0],heights[2]-heights[0],n[1]-a[1]],'radius':radius,'fov':52,'regionId':region}
    focus_specs={
      'gerencia-acceso':focus('El acceso al recinto',(1074,320),(1135,242),(1097,290),(1.6,15,3),'conjunto',45),
      'gerencia-paseo':focus('El paseo central',(850,640),(1000,450),(902,555),(1.7,24,3.5)),
      'gerencia-jardin-oriental':focus('El jardín oriental recuperado',(1285,837),(1410,758),(1350,804),(2,27,5.5),'jardines',85),
      'gerencia-arbolado':focus('La estructura del arbolado',(910,795),(1000,866),(975,841),(6,32,14),'jardines',75),
      'gerencia-jardin-occidental':focus('El espacio occidental',(399,759),(250,828),(455,812),(1.4,28,3.5),'jardines',80),
      'gerencia-limites':focus('El límite con la ciudad',(253,603),(160,555),(212,601),(2,20,4),'conjunto',80),
      'gerencia-memoria':focus('La memoria de la ciudad jardín',(743,811),(1005,1043),(795,889),(3,68,12),'memoria',170)
    }
    context={'schemaVersion':1,'id':'gerencia-context','coordinate':COORDINATE,'yaw':0,'researchDate':'2026-11-21','districtOutline':[geo(q) for q in selection.exterior.coords],'precinctOutline':garden['footprint'],'selectionNote':'Mapped historic precinct and 42 m adjoining strip; actual previous surfaces remain owned by their context modules. Not a legal boundary.',
      'buildings':buildings,'heightReview':height_reviews,'coreBuildingParts':core,'excludedBuildingIds':sorted(owned_ids),'excludedRoadIds':sorted(replaced),'foundationPatches':[],
      'roads':roads,'paths':paths,'surfaces':surfaces,'curbLines':[],'crossings':[],'pavingJoints':[],'parkingRows':[],'fences':fences,'gates':[gate],'trees':trees,'shrubs':shrubs,'lamps':lamps,'benches':benches,'genericStreetExclusions':masks,'vegetationExclusions':masks,
      'collisionPolygons':[record('gerencia-neighbour-'+str(i),p) for i,p in enumerate(polygons(unary_union([polygon(r) for r in buildings])))],
      'sharedContext':{'buildings':shared,'heritage':protected,'previousSurfaceOwners':list(prior),'casinoGarden':record('casino-garden-owner',casino_garden),'policy':'Gerencia architecture is owned by gerencia.js; Casino, Begoña and all earlier context meshes retain ownership. Historic garden and paths belong here.'},'focusSpecs':focus_specs,
      'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','surfaceLiftM':.035,'terrainGrid':{'spacingM':5,'originXZ':[0,0],'diagonal':'x=z within each cell','coreBounds':{'minX':4100,'maxX':5500,'minZ':1450,'maxZ':2900}},'vertices':vertices,'groups':[{'component':k,'indices':ix} for k,ix in groups.items()]},
      'pavingNote':'Existing OSM principal walk, PNOA traced secondary routes and public streets; visual garden islands interpreted from orthophoto. Eastern opening in 2023 is documented; western areas are not depicted as comprehensively restored.',
      'vegetationNote':'Crowns digitised from orthophoto. Pine, palm and broadleaf are visual forms; exact species, crown extents and heights are not surveyed. No generic planting on paths or inside buildings.',
      'sources':[{'id':'ge-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad','url':PHOTO_URL,'retrieved':'2026-11-19','flightDate':'Not verified','license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'},{'id':'ge-osm','title':'OpenStreetMap · recinto y ejes viarios','url':'https://www.openstreetmap.org/way/1458486121','license':'https://www.openstreetmap.org/copyright'},{'id':'ge-catastro','title':'Catastro · INSPIRE edificios','url':'https://www.catastro.hacienda.gob.es/webinspire/','metadataDate':'2026-08-21'},{'id':'ge-2023','title':'Ayuntamiento · apertura del jardín oriental, 16-12-2023','url':'https://aytosagunto.es/es/actualidad/el-ayuntamiento-abre-al-publico-la-zona-este-de-los-jardines-de-la-gerencia/'},{'id':'ge-2026','title':'Ayuntamiento · contrato paisajístico de marzo de 2026','url':'https://aytosagunto.es/es/actualidad/2026-03-03-adjudicado-el-contrato-para-la-restauracion-paisajistica-en-el-entorno-de-la-gerencia-de-puerto-de-sagunto/','caution':'Award does not establish completed works.'}],
      'provenance':{'sourceHashes':{n:hashlib.sha256((DATA/n).read_bytes()).hexdigest() for n in ['port-cartography.json','port-garden.json','port-elevation.json','horno-context.json','talleres-context.json','museo-industrial-context.json']},'referencePhoto':{'path':'research/validation-v25/gerencia-context-orthophoto-reference.jpg','geographicBounds':PHOTO_BOUNDS,'width':1800,'height':1215,'sha256':hashlib.sha256((OUT/'gerencia-context-orthophoto-reference.jpg').read_bytes()).hexdigest()},'digitizedPixels':traces},
      'stats':{'buildingParts':len(buildings),'parentParcels':len({r['parentId'] for r in buildings if r.get('parentId')}),'osmBuildingFootprints':sum(1 for r in buildings if not r.get('parentId')),'sourceCoreParts':len(core),'roadFragments':len(roads),'gardenPathFragments':len(paths),'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'trees':len(trees),'shrubs':len(shrubs),'lamps':len(lamps),'benches':len(benches),'gates':1,'boundarySegments':len(fences)}}
    (DATA/'gerencia-context.json').write_text(json.dumps(context,ensure_ascii=False,separators=(',',':'))+'\n')
    checks=[]
    def check(label,ok):checks.append({'label':label,'pass':bool(ok)})
    check('No owned context building overlaps the Gerencia precinct',all(not polygon(r).intersects(boundary) for r in buildings))
    check('No duplicate building ID with earlier three contexts',not ({str(r['id']) for r in buildings}&previous_ids))
    check('All heritage parcels remain with original models',not ({r.get('parentId') for r in buildings}&protected_parents))
    check('No paving overlaps previous context surfaces',paving.intersection(previous_surfaces).area<.01)
    check('No paving crosses architecture or Casino garden',paving.intersection(all_shape.buffer(.2).union(external_protected)).area<.01)
    check('Surface areas equal triangulated area',abs(sum(t.area for t in triangles)-paving.area)<.05)
    check('No two terrain paving triangles overlap materially',sum(t.area for t in triangles)-unary_union(triangles).area<.1)
    check('All seven context focuses present',len(focus_specs)==7)
    check('All tree centres outside buildings and paths',all(not all_shape.buffer(1.2).intersects(Point(project(t['coordinate']))) and not path_union.buffer(.35).intersects(Point(project(t['coordinate']))) for t in trees))
    check('Prior Casino furnishing area remains excluded',paving.intersection(casino_garden).area<.01)
    report={'pass':all(c['pass'] for c in checks),'checks':checks,'stats':context['stats'],'sourceHashes':context['provenance']['sourceHashes'],'limits':['Pixel tracing is not a botanical inventory or topographic survey.','2026 landscape procurement is not represented as completed works.']}
    (OUT/'gerencia-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'pass':report['pass'],'checks':len(checks),'stats':context['stats']},indent=2))
    if not report['pass']:raise SystemExit(1)

if __name__=='__main__':build()

