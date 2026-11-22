"""Photo-grounded Casino garden, with explicit ownership of the V25 surround.

Positions are traced in the retained PNOA image, not a measured condition survey.
The institutional photographs document historic garden appearance; October 2026
municipal reporting establishes ongoing rehabilitation, not completed works.
This script writes Casino data only. The separate transfer script is root-owned
at application time and clips the previous Gerencia context without rebuilding it.
"""
from pathlib import Path
import sys, json, math, hashlib, importlib.util
try:
    import shapely
except ImportError:
    sys.path.insert(0, '/workspace/scratch/36862867499f/circo-context-research/deps')
    import shapely
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union
from shapely import affinity

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'; OUT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('gerencia_context_source',ROOT/'research/validation-v25/prepare_gerencia_context.py')
G=importlib.util.module_from_spec(spec);spec.loader.exec_module(G)
project,geo,photo,polygons,lines,polygon,record,line_record,traced=G.project,G.geo,G.photo,G.polygons,G.lines,G.polygon,G.record,G.line_record,G.traced
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
COORDINATE=[-.22260667,39.65925]
YAW=-.5914002348580363
CX,CZ=project(COORDINATE); CX-=.11394856798006041; CZ-=.22876259994472958; CC,SS=math.cos(YAW),math.sin(YAW)
local=lambda x,z:(CX+x*CC+z*SS,CZ-x*SS+z*CC)
def localpoly(coords):return Polygon([local(x,z) for x,z in coords]).buffer(0)
def localrect(x1,z1,x2,z2):return localpoly([(x1,z1),(x2,z1),(x2,z2),(x1,z2)])
def pixel_geo(p):return geo(photo(p))
def pixel_of(p):
    q=geo(p);return [(q[0]+.2255)/.0048*1800,(39.66025-q[1])/.0025*1215]
def ellipse(pix,rx,rz):
    c=photo(pix)
    ring=[(c[0]+CC*rx*math.cos(i*math.tau/64)+SS*rz*math.sin(i*math.tau/64),c[1]-SS*rx*math.cos(i*math.tau/64)+CC*rz*math.sin(i*math.tau/64)) for i in range(64)]
    return Polygon(ring)

def architecture():
    casino=next(s for s in read('port-garden')['sites'] if s['id']=='casino')
    building=Polygon([project(p) for p in casino['footprint']]).buffer(0)
    rows=[('casino-terrace-north',localrect(-13.25,-17.2,18.5,-12.5)),('casino-terrace-east',localrect(17.35,-14.7,21,14)),('casino-terrace-connector',localrect(14.4,-12.5,17.35,-3.15))]
    arc=[(18.5,-14.7)]+[(18.5+4.88*math.cos(-math.pi/2+i*math.pi/2/40),-14.7+4.88*math.sin(-math.pi/2+i*math.pi/2/40)) for i in range(41)]
    rows.append(('casino-concentric-stair',localpoly(arc)))
    terraces=unary_union([p for _,p in rows]); shape=unary_union([building,terraces])
    return casino,building,rows,terraces,shape

def build():
    casino,building,terrace_rows,terraces,architecture_shape=architecture()
    gerencia=read('gerencia-context'); precinct=Polygon([project(p) for p in gerencia['precinctOutline']]).buffer(0)
    previous={n:read(n+'-context') for n in ['horno','talleres','museo-industrial']}
    # The north edge follows the existing mapped precinct wall. Other edges
    # describe the photograph-visible garden, including the south stage.
    garden_trace=[(1188,430),(1322,518),(1216,683),(1094,600)]
    garden=traced(garden_trace).intersection(precinct).buffer(0)
    old_reserve=polygon(gerencia['sharedContext']['casinoGarden'])
    handoff=garden.union(old_reserve).buffer(0)
    old_owner_surfaces=unary_union([polygon(r) for r in gerencia['surfaces']])
    other_surfaces=unary_union([polygon(r) for d in previous.values() for r in d['surfaces']])
    cart=read('port-cartography')
    nearby=[r for r in cart['buildings'] if polygon(r).distance(garden)<12]
    # Use actual cadastral component polygons, never the coarse heritage bounds.
    # Casino architecture is represented separately including the raised terrace.
    neighbouring=[r for r in nearby if r.get('parentId') not in casino.get('catastroBuildingIds',[]) or polygon(r).distance(building)>1]
    architecture_rows=[dict(r,owner='existing-context',renderedElsewhere=True) for r in neighbouring]
    obstacles=unary_union([architecture_shape]+[polygon(r) for r in architecture_rows]).buffer(.10)
    domain=handoff.union(building.buffer(4.0)).intersection(precinct).difference(other_surfaces.buffer(.02)).difference(old_owner_surfaces.difference(handoff).buffer(.018)).difference(obstacles)
    # The source arrangement is historically documented: rectangular and oval
    # planting islands, uncovered dance floor and a light stage at the south.
    stage=traced([(1141,611),(1168,628),(1152,650),(1126,633)]).difference(obstacles)
    dance=traced([(1155,566),(1230,613),(1192,648),(1126,607)]).difference(stage.buffer(.08)).intersection(domain)
    island_shapes=[('casino-island-rectangle',traced([(1180,513),(1222,539),(1205,564),(1163,538)])),('casino-island-oval',ellipse((1212,573),5.3,2.8)),('casino-island-front',ellipse((1263,500),2.4,2.0))]
    islands=[]
    for name,shape in island_shapes:
        for i,p in enumerate(polygons(shape.intersection(domain).difference(dance.buffer(.2)).difference(stage.buffer(.2)))):
            if p.area>1:islands.append(record(name+('-'+str(i) if i else ''),p,component='casino-jardin',regionId='jardines',sourceId='ca-gallery',interpretive=True))
    island_union=unary_union([polygon(r) for r in islands])
    peripheral=traced([(1266,541),(1304,555),(1230,674),(1200,654),(1224,618)]).intersection(domain).difference(stage).difference(dance).difference(island_union)
    # Material regions are disjoint. Paving retains every planting opening and
    # conforms to the actual atlas's 5 m terrain triangles.
    regions=[('casino-lawn',island_union),('casino-dancefloor',dance),('casino-peripheral-planting',peripheral),('casino-garden-gravel',domain)]
    disjoint=[]; used=Polygon()
    for component,shape in regions:
        shape=shape.intersection(domain).difference(used).difference(stage)
        disjoint.append((component,shape));used=used.union(shape)
    surfaces=[record(k+'-'+str(i),p,component=k,regionId='jardines',sourceId='ca-pnoa',interpretive=True) for k,s in disjoint for i,p in enumerate(polygons(s))]
    vertices,groups,triangles,paving=G.triangulate_regions(disjoint)
    # A few visible routes are useful map features; their complete buffered
    # width is clipped against the architecture, not only their centreline.
    axes=[[(1187,476),(1172,499),(1157,524)],[(1162,551),(1149,568),(1131,597)],[(1239,538),(1255,548),(1251,584),(1227,621)],[(1187,653),(1207,638),(1224,608)]]
    paths=[]
    for i,row in enumerate(axes):
        p=LineString([photo(q) for q in row]).intersection(domain.buffer(-.9)).difference(island_union.buffer(1)).difference(stage.buffer(1))
        for j,line in enumerate(lines(p)):paths.append(line_record(f'casino-access-{i}-{j}',line,widthM=1.6,component='casino-jardin',sourceId='ca-pnoa',interpretive=True))
    trees=[]
    tree_pixels=[((1185,522),'palm',6.1,2.35),((1215,539),'palm',9.4,3.05),((1228,559),'palm',7.6,2.8),((1200,560),'palm',3.6,1.7),((1228,581),'palm',3.7,1.6),((1263,500),'palm',8.4,2.65),((1262,578),'palm',7.8,2.8),((1235,650),'palm',8.7,2.8),((1285,593),'broadleaf',7.1,3.2),((1272,621),'broadleaf',6.3,2.7),((1199,467),'columnar',5.9,.9),((1224,484),'columnar',6.4,1.0),((1249,501),'columnar',6.2,.9),((1273,519),'columnar',6.6,1.1),((1243,631),'columnar',5.8,.85)]
    prior_trees=[r for d in previous.values() for r in d.get('trees',[])]+[r for r in gerencia.get('trees',[]) if not handoff.buffer(.05).covers(Point(project(r['coordinate'])))]
    camera_reserves=[Point(local(33.9,-8)).buffer(2.2),Point(local(28.1,-26.7)).buffer(2.0)]
    for i,(pix,kind,height,radius) in enumerate(tree_pixels):
        p=Point(photo(pix));clearance=p.distance(obstacles)
        if not domain.covers(p) or clearance<.65 or any(p.distance(Point(project(q['coordinate'])))<2.0 for q in prior_trees):continue
        if any(p.intersects(q) for q in camera_reserves):continue
        trees.append({'id':f'casino-tree-{i}','coordinate':geo(p.coords[0]),'sourcePixel':list(pix),'kind':kind,'heightM':height,'crownRadiusM':radius,'sourceId':'ca-pnoa','positionFromPhoto':True,'dimensionsInterpretive':True,'speciesVerified':False})
    benches=[]
    for i,pix in enumerate([(1241,606),(1228,624),(1184,650),(1130,595),(1253,547),(1197,490)]):
        p=Point(photo(pix))
        if domain.buffer(-.8).covers(p) and p.distance(obstacles)>1.2 and not stage.buffer(1).intersects(p):benches.append({'id':f'casino-bench-{i}','coordinate':geo(p.coords[0]),'yaw':YAW+(math.pi/2 if i%2 else 0),'lengthM':1.9,'sourceId':'ca-gallery','interpretive':True})
    # Existing precinct boundary and the garden frontage coincide here. The
    # ownership transfer removes only this short segment from Gerencia's fence.
    frontage=LineString(precinct.exterior.coords).intersection(handoff.buffer(.001))
    front_parts=sorted(lines(frontage),key=lambda p:p.length,reverse=True)
    walls=[];ticket=None
    if front_parts:
        front=front_parts[0]; mid=front.interpolate(front.length*.55); ticket={'id':'casino-ticket-window','coordinate':geo(mid.coords[0]),'widthM':.85,'sillM':.92,'openingHeightM':.70,'sourceId':'ca-uv','positionInterpretive':True}
        for i,line in enumerate(front_parts):walls.append(line_record('casino-street-wall-'+str(i),line,heightM=1.9,thicknessM=.24,component='casino-taquilla',sourceId='ca-pnoa',interpretive=True))
    # The quieter garden's low rear limit is traced beside the pergola; it is
    # not extended around the modern Economato or shared Gerencia buildings.
    rear=LineString([photo(p) for p in [(1097,608),(1135,644),(1187,674),(1210,679)]]).intersection(domain.buffer(.12))
    for i,line in enumerate(lines(rear)):walls.append(line_record('casino-low-garden-wall-'+str(i),line,heightM=.65,thicknessM=.20,component='casino-jardin',sourceId='ca-pnoa',interpretive=True))
    stage_center=stage.centroid
    stage_record=record('casino-stage',stage,component='casino-escenario',regionId='jardines',sourceId='ca-gallery',interpretive=True,heightM=.62,roofHeightM=3.8)
    stage_coords=list(stage.exterior.coords)
    outline=unary_union([handoff,architecture_shape,building.buffer(4).intersection(precinct)]).convex_hull
    def focus(label,pix,eye_far,eye_near,heights,region='jardines',radius=38):
        a,f,n=map(photo,[pix,eye_far,eye_near]);return {'label':label,'targetCoordinates':geo(a),'targetHeight':heights[0],'far':[f[0]-a[0],heights[1]-heights[0],f[1]-a[1]],'near':[n[0]-a[0],heights[2]-heights[0],n[1]-a[1]],'radius':radius,'fov':54,'regionId':region}
    focus_specs={
      'casino-jardin':focus('Las islas del jardín',(1205,559),(1288,641),(1233,613),(1.1,21,5.5)),
      'casino-pista':focus('La pista de baile descubierta',(1182,606),(1244,663),(1222,634),(.3,18,4.3)),
      'casino-escenario':focus('La pérgola y el escenario sur',(1146,632),(1219,575),(1186,602),(1.8,13,5.0)),
      'casino-arbolado':focus('Palmeras y arbolado del recinto',(1218,546),(1305,627),(1268,596),(5.0,23,13)),
      'casino-taquilla':focus('La taquilla en el muro a la calle',pixel_of(ticket and project(ticket['coordinate']) or photo((1235,478))),(1277,437),(1254,463),(1.3,13,3.0),'memoria'),
      'casino-entorno':focus('El Casino y la ciudad factoría',(1180,555),(1377,717),(1317,655),(3.0,43,22),'memoria',85),
      'casino-memoria':focus('Jardín, celebraciones y memoria social',(1181,569),(1340,461),(1281,508),(2.4,33,15),'memoria',65)
    }
    masks=[]
    for p in polygons(domain.union(stage).buffer(.08)):
        pieces=list(shapely.constrained_delaunay_triangles(p).geoms) if p.interiors else [p]
        for q in pieces:
            if q.area>.005:masks.append(record('casino-context-mask-'+str(len(masks)),q))
    # Full architecture envelopes retain source canopy centres, and constrain
    # complete crown extent. Non-architectural camera reserves are separate.
    protected=[record('casino-built-envelope-'+str(i),p,owner='casino-model',renderedElsewhere=True) for i,p in enumerate(polygons(architecture_shape))]+architecture_rows
    context={'schemaVersion':1,'id':'casino-context','coordinate':COORDINATE,'yaw':YAW,'researchDate':'2026-11-21','districtOutline':[geo(q) for q in outline.exterior.coords],'gardenOutline':[geo(q) for q in garden.exterior.coords],
      'selectionNote':'Historic formal garden traced against PNOA and the existing mapped precinct edge; nearby buildings, roads and Gerencia landscape retain their established owners. Not a measured boundary or current works survey.',
      'surfaces':surfaces,'islands':islands,'stage':stage_record,'paths':paths,'trees':trees,'shrubs':[],'benches':benches,'walls':walls,'ticketWindow':ticket,'cameraReserves':[record('casino-camera-reserve-'+str(i),p) for i,p in enumerate(camera_reserves)],
      'buildings':[],'roads':[],'foundationPatches':[],'excludedBuildingIds':[],'excludedRoadIds':[],'genericStreetExclusions':masks,'vegetationExclusions':masks,'collisionPolygons':[],
      'architectureExclusions':[record('casino-building',building)]+[record(i,p) for i,p in terrace_rows],
      'sharedContext':{'buildings':architecture_rows,'architectureEnvelopes':protected,'owners':['gerencia-context','gerencia-model','economato-model','horno-context','talleres-context','museo-industrial-context'],'policy':'Only the Casino garden ground transfers from Gerencia. Existing mapped surroundings remain single-owner geometry.'},
      'focusSpecs':focus_specs,'ownershipTransfer':record('casino-garden-transfer',handoff,previousOwner='gerencia-context',newOwner='casino-context'),
      'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','surfaceLiftM':.041,'terrainGrid':{'spacingM':5,'originXZ':[0,0],'diagonal':'x=z within each cell'},'vertices':vertices,'groups':[{'component':k,'indices':v} for k,v in groups.items()]},
      'currentState':{'asOf':'2026-10-06','note':'Municipal reporting documents rehabilitation in progress. Historic garden features are an interpretive reconstruction; completion or reopening is not asserted.'},
      'sources':[{'id':'ca-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad','url':G.PHOTO_URL,'flightDate':'Not verified','license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'},{'id':'ca-gallery','title':'Casino Recreativo y Cultural · galería institucional de instalaciones','url':'https://www.casinopuertosagunto.com/portfolio/instalaciones/','date':'Undated historical photographs'},{'id':'ca-uv','title':'Universitat de València · conjunto histórico de la Gerencia, apartado Casino','url':'https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html'},{'id':'ca-2026','title':'Ayuntamiento · obras de rehabilitación, 6-10-2026','url':'https://aytosagunto.es/es/actualidad/2026-10-06-avanzan-las-obras-de-rehabilitacion-del-casino-de-la-gerencia/'}],
      'provenance':{'sourceHashes':{n:hashlib.sha256((DATA/n).read_bytes()).hexdigest() for n in ['port-garden.json','port-cartography.json','port-elevation.json']},'photo':{'path':'research/validation-v25/gerencia-context-orthophoto-reference.jpg','bounds':G.PHOTO_BOUNDS,'size':G.PHOTO_SIZE},'gardenTracePixels':garden_trace,'treeDimensions':'Interpretive; visual palm, columnar and broadleaf classes, no asserted botanical inventory.','furniturePositions':'Approximate, supported by historic institutional photographs.'},
      'stats':{'ownedBuildings':0,'duplicatedBuildings':0,'ownedRoads':0,'pavingAreaM2':round(paving.area,2),'gardenTransferAreaM2':round(handoff.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'islands':len(islands),'trees':len(trees),'benches':len(benches),'paths':len(paths),'stageAreaM2':round(stage.area,2),'contextFocuses':len(focus_specs)}}
    (DATA/'casino-context.json').write_text(json.dumps(context,ensure_ascii=False,separators=(',',':'))+'\n')
    checks=[]
    def check(name,value):checks.append({'label':name,'pass':bool(value)})
    check('Seven context focuses',len(focus_specs)==7)
    check('Paving excludes building and terraces',paving.intersection(obstacles).area<.002)
    check('All Casino paths have their full width outside architecture',all(LineString([project(q) for q in p['coordinates']]).buffer(p['widthM']/2).intersection(obstacles).area<.002 for p in paths))
    check('No new surface overlaps retained Gerencia surface',paving.intersection(old_owner_surfaces.difference(handoff)).area<.002)
    check('No new surface overlaps earlier three industrial contexts',paving.intersection(other_surfaces).area<.002)
    check('Paving triangle area equals actual polygons including holes',abs(sum(t.area for t in triangles)-paving.area)<.01)
    check('No overlapping paving triangles',sum(t.area for t in triangles)-unary_union(triangles).area<.01)
    check('All source tree positions outside architecture',all(not obstacles.intersects(Point(project(t['coordinate']))) for t in trees))
    check('No surrounding building or road rebuilt',not context['buildings'] and not context['roads'])
    report={'pass':all(c['pass'] for c in checks),'checks':checks,'stats':context['stats']}
    (OUT/'casino-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if not report['pass']:raise SystemExit(1)

if __name__=='__main__':build()
