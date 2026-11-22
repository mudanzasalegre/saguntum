"""Reproducible mapped setting of the Nave de Efectos y Repuestos.

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
OUT=ROOT/'research/validation-v24'
SCALE=111320*math.cos(math.radians(39.679))
COORDINATE=[-.2216385,39.65754705]
project=lambda p:((p[0]+.278)*SCALE,(39.679-p[1])*111320)
geo=lambda p:[round(-.278+p[0]/SCALE,9),round(39.679-p[1]/111320,9)]
CX,CZ=project(COORDINATE)
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
PHOTO_BOUNDS={'west':-.2238,'east':-.2193,'south':39.65605,'north':39.6590}
PHOTO_SIZE=[1800,1500]
PHOTO_URL='https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.65605%2C-0.2238%2C39.6590%2C-0.2193&width=1800&height=1500&format=image%2Fjpeg'
def photo(p):
    x,y=p
    return project((PHOTO_BOUNDS['west']+x/1800*(PHOTO_BOUNDS['east']-PHOTO_BOUNDS['west']),PHOTO_BOUNDS['north']-y/1500*(PHOTO_BOUNDS['north']-PHOTO_BOUNDS['south'])))
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
    cartography=read('port-cartography');prior={n:read(n+'-context') for n in ['horno','talleres']}
    source=next(s for s in read('port-industrial')['sites'] if s['id']=='museo-industrial')
    photo_frame=traced([(0,0),(1800,0),(1800,1500),(0,1500)])
    previous_district=unary_union([Polygon([project(q) for q in d['districtOutline']]).buffer(.7) for d in prior.values()])
    selection=Point(CX,CZ).buffer(165,quad_segs=32).intersection(photo_frame).difference(previous_district)
    all_buildings=[(r,polygon(r)) for r in cartography['buildings']]
    core=[r for r,p in all_buildings if r.get('parentId')=='8335601YJ3983S']
    core_ids={str(r['id']) for r in core}
    core_shape=unary_union([polygon(r) for r in core]+[Polygon([project(q) for q in source['footprint']])])
    protected=[];protected_parents=set();protected_ids=set()
    for dataset in ['port-industrial','port-garden','port-workers']:
        for s in read(dataset)['sites']:
            if s['id']=='museo-industrial':continue
            protected_parents.update(s.get('catastroBuildingIds',[]));protected_ids.update(s.get('osmBuildingIds',[]))
            protected.append({'id':s['id'],'owner':'existing-port-model','coordinate':s['coordinate'],'osmBuildingIds':s.get('osmBuildingIds',[]),'catastroBuildingIds':s.get('catastroBuildingIds',[]),'renderedElsewhere':True})
    previous_ids=set(i for d in prior.values() for i in d['excludedBuildingIds'])
    chosen={'8335602YJ3983S','8335603YJ3983S','8335606YJ3983N','8335607YJ3983S','8335608YJ3983S','8535812YJ3983S','8338802YJ3983N','8537601YJ3983H','8537602YJ3983H','8537603YJ3983H','8537604YJ3983H','8537605YJ3983H','8537606YJ3983H','8537607YJ3983H','8537608YJ3983H','8537622YJ3983F','8537623YJ3983H','8537619YJ3983F','8537620YJ3983F'}
    chosen-=protected_parents
    withheld=[dict(r,reason='Two cadastral volumes conflict with visibly open ground in the PNOA reference; source retained, extrusion withheld; capture date unverified.') for r,p in all_buildings if r.get('parentId')=='8338802YJ3983N']
    withheld_ids={str(r['id']) for r in withheld}
    chosen.discard('8338802YJ3983N')
    buildings=[];height_reviews=[]
    for r,p in all_buildings:
        if r.get('parentId') not in chosen or str(r['id']) in previous_ids:continue
        h=float(r.get('surfaceHeightEstimate') or max(3,int(r.get('levels') or 1)*3))
        if p.area<50 and not r.get('surfaceHeightEstimate'):
            others=[b.get('surfaceHeightEstimate') for b,q in all_buildings if b.get('parentId')==r.get('parentId') and b.get('surfaceHeightEstimate')]
            if others:h=statistics.median(others)
        kind='commercial' if r.get('parentId')=='8535812YJ3983S' else 'civic' if r.get('parentId','').startswith('8335') else 'urban'
        buildings.append(dict(r,contextComponent='museo-industrial-entorno',displayHeightM=h,renderingType=kind,roofForm='source-plan',facadeColor={'civic':'#d3c8b1','commercial':'#c3a68b','urban':'#cbb79e'}[kind]))
        height_reviews.append({'id':str(r['id']),'displayHeightM':h,'method':'Existing IGN MDSnE2.5 roof estimate' if r.get('surfaceHeightEstimate') else 'Attributed storeys or same-parcel neighbouring height, interpreted','measuredFacade':False,'interpretive':True})
    own_footprints=unary_union([polygon(r) for r in buildings]);owned_ids=core_ids|withheld_ids|{str(r['id']) for r in buildings}
    all_footprints=unary_union([p for r,p in all_buildings if p.distance(Point(CX,CZ))<400 and str(r['id']) not in withheld_ids]);protected_shape=unary_union([p for r,p in all_buildings if r.get('parentId') in protected_parents or str(r['id']) in protected_ids])
    # Public surfaces digitised on the reference mosaic, clipped to cartographic
    # architecture. These are current display edges, not cadastral boundaries.
    traces={
      'museumForecourt':[(709,592),(1090,663),(1060,747),(1014,898),(972,901),(705,740),(685,687)],
      'eastParking':[(1138,714),(1496,769),(1596,831),(1634,928),(1621,1040),(1549,1154),(1466,1200),(1021,1237),(1044,1062),(1075,873)],
      'northPlaza':[(1115,397),(1199,432),(1437,573),(1533,602),(1456,665),(1108,608),(1065,560)],
      'westGarden':[(0,498),(186,538),(385,573),(672,617),(705,631),(683,734),(480,786),(260,866),(0,926)],
      'easternGarden':[(1551,748),(1738,785),(1775,866),(1749,1005),(1655,1262),(1602,1325),(1565,1203),(1667,1003),(1681,914),(1637,836)]}
    shapes={k:traced(v) for k,v in traces.items()}
    roads=[];replaced=[];road_shapes=[]
    for r in cartography['roads']:
        if r.get('tunnel')=='yes' or r.get('bridge')=='yes' or r.get('area')=='yes':continue
        axis=LineString([project(q) for q in r['coordinates']]);kind=r.get('kind')
        if not axis.intersects(selection):continue
        width=2.0 if kind in {'footway','cycleway','path','pedestrian'} else 7.3 if kind in {'secondary','tertiary'} else 6.2 if kind in {'residential','service','unclassified'} else 7
        if r.get('width'):
            try:width=float(r['width'])
            except ValueError:pass
        whole=selection.covers(axis)
        if whole:replaced.append(str(r['id']))
        for i,part in enumerate(lines(axis.intersection(selection))):
            roads.append(dict(r,id=str(r['id'])+'-museo-industrial-'+str(i),sourceId=str(r['id']),sourceCoordinates=r['coordinates'],coordinates=[geo(q) for q in part.coords],displayWidthM=width,widthInterpretive=not bool(r.get('width')),replacesWholeSource=whole,paintCenterLine=kind in {'residential','service','tertiary','secondary'},contextComponent='museo-industrial-entorno'))
            road_shapes.append(part.buffer(width/2,cap_style='flat',join_style='round'))
    road_union=unary_union(road_shapes)
    road_area=road_union.union(shapes['eastParking']).intersection(selection).difference(all_footprints.buffer(.25)).difference(core_shape.buffer(.15)).difference(protected_shape.buffer(1))
    outer_walk=road_union.buffer(1.7).difference(road_union).intersection(selection).difference(all_footprints.buffer(.25))
    prev=Polygon();disjoint=[]
    regions=[('museo-industrial-road',road_area),('museo-industrial-forecourt',shapes['museumForecourt']),('museo-industrial-yard',shapes['northPlaza']),('museo-industrial-gravel',shapes['westGarden'].union(shapes['easternGarden'])),('museo-industrial-sidewalk',outer_walk)]
    for key,shape in regions:
        shape=shape.intersection(selection).difference(prev).difference(all_footprints.buffer(.18)).difference(core_shape.buffer(.12)).difference(protected_shape.buffer(1));disjoint.append((key,shape));prev=prev.union(shape)
    vertices,groups,triangles,paving=triangulate_regions(disjoint)
    surfaces=[record(key+'-'+str(i),p,component=key,sourceId='mi-pnoa' if key not in ['museo-industrial-road','museo-industrial-sidewalk'] else 'mi-osm',interpretive=True) for key,shape in disjoint for i,p in enumerate(polygons(shape))]
    curbs=[]
    for label in ['museumForecourt','eastParking','northPlaza','easternGarden']:
        for i,line in enumerate(lines(LineString(shapes[label].exterior.coords).intersection(selection).difference(all_footprints.buffer(.3)))):curbs.append(line_record('museo-industrial-bordillo-'+label+'-'+str(i),line,sourceId='mi-pnoa',heightM=.13,widthM=.16,interpretive=True))
    # Only crowns visibly present south of the avenue or in the public plaza;
    # no invented forest in the Gerencia and no generic cars in the approaches.
    plant_rows=[((155,584),6,3.5),((278,600),6,3.0),((392,619),5.5,3.4),((501,632),5.7,3.3),((610,643),4.9,2.7),((668,650),5.1,2.5),((482,694),5,3.3),((422,682),6,4),((360,690),6.5,4.7),((297,699),6.7,4.4),((223,699),6.0,4.2),((153,687),4.8,3),((67,682),5.8,3.5),((71,751),5.6,3),((49,836),5.0,2.9),((180,834),6,4),((274,810),5.7,3.2),((390,722),6.5,4),((1142,692),5.1,2.3),((1196,706),4.9,2.2),((1254,714),4.8,2.0),((1310,726),5,2.4),((1382,735),5,2.5),((1430,749),4.7,2.3),((1517,762),6,3.2),((1582,792),5.2,2.6),((1712,851),5,2.8),((1724,920),5.5,3.0),((1673,1011),5.7,3.3),((1637,1090),5.3,2.8),((1602,1150),5.3,3),((1546,1217),5.2,2.8),((1218,489),6.1,3.7),((1353,476),5.8,3.3),((1445,542),5.7,3.1),((1519,576),5.4,3.2),((1597,602),5.2,3.1),((1435,625),5.0,3.0),((1485,655),5.2,3.0),((1075,575),5.2,2.8),((1024,578),5.4,3.0),((978,561),5.3,3.0)]
    trees=[]
    for i,(pix,h,r) in enumerate(plant_rows):
        p=Point(photo(pix))
        if not selection.covers(p) or all_footprints.buffer(.5).intersects(p) or road_union.buffer(.25).intersects(p):continue
        trees.append({'id':'museo-industrial-arbol-'+str(i),'coordinate':geo(p.coords[0]),'sourcePixel':list(pix),'kind':'broadleaf','heightM':h,'crownRadiusM':r,'sourceId':'mi-pnoa','positionFromPhoto':True,'dimensionsInterpretive':True})
    lamps=[]
    for i,pix in enumerate([(778,596),(922,620),(1054,651),(1092,798),(1080,1027),(1164,667),(1380,704),(1570,742),(1507,1157),(591,584),(375,539)]):
        p=Point(photo(pix))
        if selection.covers(p) and not all_footprints.intersects(p):lamps.append({'id':'museo-industrial-farola-'+str(i),'coordinate':geo(p.coords[0]),'heightM':5.3,'sourcePixel':list(pix),'sourceId':'mi-pnoa','dimensionsInterpretive':True})
    crossings=[]
    for i,(a,b) in enumerate([((833,563),(824,599)),((1081,605),(1068,648)),((1092,666),(1129,676)),((1472,739),(1483,699)),((1646,488),(1665,459)),((1009,1117),(1040,1121))]):
        l=LineString([photo(a),photo(b)])
        if selection.covers(l):crossings.append(line_record('museo-industrial-paso-'+str(i),l,sourceId='mi-pnoa',dimensionsInterpretive=True))
    # Parking bay lines are traced as observed rows, with interpreted spacing.
    parking=[]
    for i,(a,b) in enumerate([((1360,828),(1550,864)),((1419,977),(1590,997)),((1102,1155),(1475,1191)),((1280,1136),(1296,1026))]):
        l=LineString([photo(a),photo(b)])
        for j,line in enumerate(lines(l.intersection(selection).difference(all_footprints.buffer(.3)))):parking.append(line_record('museo-industrial-aparcamiento-'+str(i)+'-'+str(j),line,sourceId='mi-pnoa',interpretive=True))
    controlled=unary_union([paving.buffer(.5),shapes['museumForecourt'],shapes['westGarden'],shapes['easternGarden'],shapes['northPlaza']]).intersection(selection).difference(protected_shape.buffer(1))
    unowned=unary_union([p for r,p in all_buildings if str(r['id']) not in owned_ids and p.intersects(selection.buffer(2))])
    mask_shape=controlled.difference(unowned.buffer(.35));masks=[]
    for poly in polygons(mask_shape):
        parts=list(shapely.constrained_delaunay_triangles(poly).geoms) if poly.interiors else [poly]
        for p in parts:
            if p.area>.005:masks.append(record('museo-industrial-mask-'+str(len(masks)),p))
    shared=[{'id':str(r['id']),'coordinates':r['coordinates'],'holes':r.get('holes',[]),'owner':'existing-port-model' if r.get('parentId') in protected_parents or str(r['id']) in protected_ids else 'port-city','renderedElsewhere':True} for r,p in all_buildings if str(r['id']) not in owned_ids and p.intersects(selection)]
    outlines=list(polygons(selection));outline=max(outlines,key=lambda p:p.area)
    context={'schemaVersion':1,'id':'museo-industrial-context','coordinate':COORDINATE,'yaw':1.0446,'researchDate':'2026-11-20','districtOutline':[geo(q) for q in outline.exterior.coords],
      'selectionNote':'165 m display selection cropped to PNOA and excluding existing Talleres/Alto Horno districts with 0.7 m guard; not a legal boundary.',
      'buildings':buildings,'heightReview':height_reviews,'coreBuildingParts':core,'withheldBuildingParts':withheld,'excludedBuildingIds':sorted(owned_ids),'excludedRoadIds':sorted(replaced),'coreExclusion':record('museo-industrial-building-owner',core_shape,owner='museo-industrial-model'),'foundationPatches':[],
      'roads':roads,'surfaces':surfaces,'curbLines':curbs,'crossings':crossings,'pavingJoints':[],'parkingRows':parking,'fences':[],'railAlignments':[],'trees':trees,'lamps':lamps,'genericStreetExclusions':masks,'vegetationExclusions':masks,'collisionPolygons':[record('museo-industrial-neighbour-'+str(i),p) for i,p in enumerate(polygons(own_footprints))],
      'sharedContext':{'buildings':shared,'heritage':protected,'previousDistricts':{n:d['districtOutline'] for n,d in prior.items()},'policy':'Museum main nave and annex remain with museo-industrial.js. Gerencia, Casino, Begoña, Economato, Alto Horno and Talleres keep existing owners. External railways are not inferred from the historic warehouse use.'},
      'focusSpecs':{'museo-industrial-entorno':{'label':'La nave y la ciudad industrial','targetCoordinates':COORDINATE,'targetHeight':8,'far':[114,108,99],'near':[80,66,68],'radius':150,'fov':55}},
      'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','surfaceLiftM':.035,'terrainGrid':{'spacingM':5,'originXZ':[0,0],'diagonal':'x=z within each cell','coreBounds':{'minX':4100,'maxX':5500,'minZ':1450,'maxZ':2900}},'vertices':vertices,'groups':[{'component':key,'indices':ix} for key,ix in groups.items()]},
      'pavingNote':'Ejes OSM, explanada del museo, plaza y aparcamiento trazados sobre PNOA. Anchuras y detalles menores interpretados. La fecha de consulta no acredita la fecha de vuelo ni el estado exacto en noviembre de2026.',
      'vegetationNote':'Posiciones de copas visibles en PNOA. Especies y tamaños aproximados; no se duplica el jardín de Gerencia.',
      'sources':[{'id':'mi-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad','url':PHOTO_URL,'retrieved':'2026-11-20','flightDate':'Not verified; retrieval is not capture date','license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'},{'id':'mi-osm','title':'OpenStreetMap · ejes de la red viaria','url':'https://www.openstreetmap.org/#map=18/39.65755/-0.22164','retrieved':'2026-11-19','license':'https://www.openstreetmap.org/copyright'},{'id':'mi-catastro','title':'Dirección General del Catastro · INSPIRE Buildings, Sagunto','url':'https://www.catastro.hacienda.gob.es/webinspire/','metadataDate':'2026-08-21','retrieved':'2026-11-19'},{'id':'mi-ign-ground','title':'IGN/CNIG · MDT05, terreno regional','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmdt','sourceGridSpacingM':5},{'id':'mi-ign-heights','title':'IGN/CNIG · MDSnE2.5, alturas normalizadas','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','caution':'Raster roof estimates, not measured elevations.'}],
      'provenance':{'sourceHashes':{name:hashlib.sha256((DATA/name).read_bytes()).hexdigest() for name in ['port-cartography.json','port-industrial.json','port-elevation.json','horno-context.json','talleres-context.json']},'referencePhoto':{'path':'research/validation-v24/museo-industrial-context-orthophoto-reference.jpg','geographicBounds':PHOTO_BOUNDS,'width':1800,'height':1500,'sha256':hashlib.sha256((OUT/'museo-industrial-context-orthophoto-reference.jpg').read_bytes()).hexdigest()},'digitizedPixels':traces,'method':'Unchanged Catastro footprint parts and OSM axes; PNOA public ground tracing; 5m terrain-cell triangulation; preserved historic owners.'},
      'stats':{'buildingParts':len(buildings),'parentParcels':len({r['parentId'] for r in buildings}),'sourceCoreParts':len(core),'withheldCadastralParts':len(withheld),'roadFragments':len(roads),'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'trees':len(trees),'streetLamps':len(lamps),'crossings':len(crossings),'railLengthM':0,'protectedHeritageOwners':len(protected)}}
    (DATA/'museo-industrial-context.json').write_text(json.dumps(context,ensure_ascii=False,separators=(',',':'))+'\n')
    actual=unary_union(triangles)
    checks=[{'pass':all(next(r for r,p in all_buildings if str(r['id'])==str(b['id']))['coordinates']==b['coordinates'] for b in buildings),'label':'Every detailed neighbouring part preserves its Catastro coordinates'},
      {'pass':len(core)==2,'label':'Both museum cadastral parts are assigned to the museum owner'},
      {'pass':len(withheld)==2 and not any(str(r['id']) in withheld_ids for r in buildings),'label':'Two PNOA-conflicting cadastral parts are retained in evidence but not extruded over open ground'},
      {'pass':actual.symmetric_difference(paving).area<.001,'label':'Terrain triangles cover paving once','differenceAreaM2':actual.symmetric_difference(paving).area},
      {'pass':abs(sum(t.area for t in triangles)-actual.area)<.001,'label':'Paving triangles do not overlap'},
      {'pass':paving.intersection(all_footprints).area<.001,'label':'Public paving does not cross buildings'},
      {'pass':paving.intersection(previous_district).area<.001,'label':'Earlier Horno and Talleres districts remain disjoint'},
      {'pass':not previous_ids&owned_ids,'label':'No building ID is claimed by two detailed contexts'},
      {'pass':not chosen&protected_parents,'label':'Protected heritage parcels retain their existing owners'},
      {'pass':all(4100<=v[0]<=5500 and 1450<=v[1]<=2900 for v in vertices),'label':'All paving lies on the5m Puerto core mesh'},
      {'pass':all(not core_shape.intersects(Point(project(r['coordinate']))) for r in trees),'label':'Observed tree positions remain outside museum'},
      {'pass':all(paving.intersection(polygon(b)).area<.001 for b in shared),'label':'Shared regional buildings remain uncovered'}]
    report={'pass':all(c['pass'] for c in checks),'checks':checks,'stats':context['stats'],'sourceHashes':context['provenance']['sourceHashes']};(OUT/'museo-industrial-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
    if not report['pass']:raise SystemExit(1)
if __name__=='__main__':build()
