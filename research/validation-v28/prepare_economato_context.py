"""Prepare a bounded Economato setting from retained PNOA and Catastro evidence.

Only this version's new context is written. A separate reviewable script proposes
the minimal Gerencia handoff; it does not change a prior context by default.
"""
from pathlib import Path
import sys, json, math, hashlib, importlib.util, subprocess
try:
    import shapely
except ImportError:
    sys.path.insert(0, '/workspace/scratch/36862867499f/begona-context-deps')
    import shapely
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'
OUT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('gerencia_context_helpers',ROOT/'research/validation-v25/prepare_gerencia_context.py')
G=importlib.util.module_from_spec(spec);spec.loader.exec_module(G)
project,geo,polygon,polygons,lines,record,line_record=G.project,G.geo,G.polygon,G.polygons,G.lines,G.record,G.line_record
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
PHOTO_PATH='research/validation-v25/gerencia-context-orthophoto-reference.jpg'
PHOTO_BOUNDS=G.PHOTO_BOUNDS
PHOTO_SIZE=G.PHOTO_SIZE
PHOTO_URL=G.PHOTO_URL
photo=G.photo
traced=G.traced
COORDINATE=[-.2218007,39.6588829]
FRONT_A=[-.2219421,39.6591272]
FRONT_B=[-.2214437,39.6588575]
A,B=project(FRONT_A),project(FRONT_B)
CX,CZ=(A[0]+B[0])/2,(A[1]+B[1])/2
LENGTH=math.hypot(B[0]-A[0],B[1]-A[1]);UX,UZ=(B[0]-A[0])/LENGTH,(B[1]-A[1])/LENGTH
YAW=-math.atan2(UZ,UX)
local=lambda x,z:(CX+x*UX-z*UZ,CZ+x*UZ+z*UX)
rect=lambda x0,z0,x1,z1:Polygon([local(x,z) for x,z in [(x0,z0),(x1,z0),(x1,z1),(x0,z1)]])
NAMES=['horno','talleres','museo-industrial','gerencia','casino','begona']
BASELINE_COMMIT='db144b1307c565d7d61ab8cbddf1641ade0b755c'
BASELINE_GERENCIA_SHA='dac00377102d6300607cb5db0fcef89ad4d192f4e4c1698958689c02f2a5aca4'

def baseline_context_text(name):
    """Reproduce V28 after its parent has applied the precise Gerencia handoff."""
    raw=(DATA/(name+'-context.json')).read_text()
    if name=='gerencia' and hashlib.sha256(raw.encode()).hexdigest()!=BASELINE_GERENCIA_SHA:
        result=subprocess.run(['git','show',BASELINE_COMMIT+':dist/assets/data/gerencia-context.json'],cwd=ROOT,capture_output=True,text=True,check=True)
        raw=result.stdout
        if hashlib.sha256(raw.encode()).hexdigest()!=BASELINE_GERENCIA_SHA:
            raise ValueError('The preserved Gerencia baseline does not match V28 source evidence.')
    return raw

def build():
    cart=read('port-cartography')
    prior_text={n:baseline_context_text(n) for n in NAMES}
    prior={n:json.loads(raw) for n,raw in prior_text.items()}
    shapes={str(r['id']):polygon(r) for r in cart['buildings']}
    site_rows=[r for r in cart['buildings'] if r.get('parentId')=='8338804YJ3983N']
    site=unary_union([shapes[str(r['id'])] for r in site_rows])
    steps=unary_union([rect(-16,-1.8,-8.4,0),rect(5.6,-1.8,14.9,0)])
    # The visible exterior apron, side passages and garden immediately behind
    # the Economato. The rear edge stops at the existing Gerencia walking route.
    # This is an interpretation extent, not a surveyed legal parcel boundary.
    precinct_trace=[(1319,525),(1547,676),(1558,700),(1518,751),(1484,814),(1453,873),(1390,843),(1326,801),(1268,765),(1210,731),(1195,707),(1240,667),(1274,613)]
    precinct=traced(precinct_trace).union(site.buffer(1.6)).buffer(0)
    prior_shapes={n:unary_union([polygon(r) for r in d['surfaces']]) for n,d in prior.items()}
    # Retain every already detailed street, Casino garden, Alameda and museum
    # surface, as well as the Gerencia's coherent paths and road strips.
    retained_gerencia=unary_union([polygon(r) for r in prior['gerencia']['surfaces'] if r['component'] in ['gerencia-road','gerencia-path']])
    retained=unary_union([v for n,v in prior_shapes.items() if n!='gerencia']+[retained_gerencia])
    withheld={str(r['id']) for d in prior.values() for r in d.get('withheldBuildingParts',[])}
    withheld.update(str(i) for d in prior.values() for i in d.get('withheldBuildingIds',[]))
    architecture_rows=[r for r in cart['buildings'] if str(r['id']) not in withheld and shapes[str(r['id'])].distance(precinct)<45]
    architecture=unary_union([shapes[str(r['id'])] for r in architecture_rows]+[steps])
    # 3 cm offset prevents a surface penetrating the actual architecture. No
    # inherited broad building buffer is reused; close strips remain covered.
    obstacles=architecture.buffer(.03)
    domain=precinct.difference(obstacles).difference(retained.buffer(.012)).buffer(0)
    transfer=domain.intersection(prior_shapes['gerencia'])

    # Exact pre-existing trees remain Gerencia/Casino-owned. Only discernible
    # additional crown centres are introduced, behind the main frontage.
    previous_trees=[r for d in prior.values() for r in d.get('trees',[])]
    tree_pixels=[(1288,697),(1325,737),(1381,765),(1431,791),(1470,774),(1483,729),(1308,691),(1398,795),(1443,830)]
    trees=[]
    for i,pix in enumerate(tree_pixels):
        p=Point(photo(pix))
        if not domain.covers(p) or p.distance(architecture)<1.6:continue
        if any(p.distance(Point(project(r['coordinate'])))<3.2 for r in previous_trees):continue
        trees.append({'id':f'economato-tree-{i}','coordinate':geo(p.coords[0]),'sourcePixel':list(pix),'kind':'pine','heightM':7.6+(i%3)*.45,'crownRadiusM':3.1+(i%3)*.30,'sourceId':'ec-pnoa','positionFromPhoto':True,'dimensionsInterpretive':True,'speciesVerified':False})
    # The photo establishes tree cover and the open forecourt; the material
    # beneath dense foliage is deliberately described as interpreted ground.
    front_walk=rect(-28,-7,28,0)
    side_east=traced([(1530,688),(1558,700),(1518,751),(1484,814),(1473,803),(1500,744)])
    side_west=traced([(1298,559),(1313,540),(1270,635),(1232,696),(1210,707),(1240,667)])
    garden=traced([(1244,653),(1510,751),(1484,814),(1453,873),(1268,765),(1195,707)])
    regions=[('economato-apron',front_walk),('economato-sidewalk',side_east.union(side_west)),('economato-garden',garden),('economato-open-ground',domain)]
    disjoint=[];used=Polygon()
    for component,shape in regions:
        shape=shape.intersection(domain).difference(used)
        disjoint.append((component,shape));used=used.union(shape)
    surfaces=[record(f'{component}-{i}',p,component=component,regionId='entorno',sourceId='ec-pnoa',interpretive=True) for component,shape in disjoint for i,p in enumerate(polygons(shape))]
    vertices,groups,triangles,paving=G.triangulate_regions(disjoint)

    prior_ids={str(i) for d in prior.values() for i in d.get('excludedBuildingIds',[])}
    heritage=[s for n in ['port-garden','port-industrial','port-workers'] for s in read(n)['sites']]
    protected={p for s in heritage for p in s.get('catastroBuildingIds',[])}
    front_band=rect(-58,-63,60,-10)
    buildings=[];shared=[]
    for row in architecture_rows:
        shape=shapes[str(row['id'])]
        if row.get('parentId') in protected or str(row['id']) in prior_ids or not shape.intersects(front_band) or shape.distance(site)>40 or shape.area<5:
            shared.append(dict(row,owner='existing-context',renderedElsewhere=True));continue
        height=float(row.get('surfaceHeightEstimate') or max(3.1,int(row.get('levels') or 1)*3.0))
        buildings.append(dict(row,displayHeightM=height,contextComponent='economato-frente-urbano',facadeColor=['#cfbda7','#c9b399','#d4c8b6','#c9c2b0'][len(buildings)%4],roofColor='#ad9e8c',renderingType='urban',roofForm='source-plan'))

    # These short joint lines describe the apron scale; their exact grid is
    # interpretive and clipped before all roofs, porch steps and older owners.
    apron=next(s for k,s in disjoint if k=='economato-apron')
    paving_joints=[]
    for i in range(-8,9):
        axis=LineString([local(i*3,-7),local(i*3,0)])
        for j,line in enumerate(lines(axis.intersection(apron.buffer(-.08)))):
            paving_joints.append(line_record(f'economato-apron-joint-{i}-{j}',line,sourceId='ec-pnoa',interpretive=True))

    def focus(label,target,far,near,heights,radius=75):
        p,f,n=local(*target),local(*far),local(*near)
        return {'label':label,'targetCoordinates':geo(p),'targetHeight':heights[0],'far':[f[0]-p[0],heights[1]-heights[0],f[1]-p[1]],'near':[n[0]-p[0],heights[2]-heights[0],n[1]-p[1]],'radius':radius,'fov':54,'regionId':'entorno'}
    focuses={
        'economato-acceso':focus('Ante los dos pórticos',(0,-2),(-8,-45),(-6,-19),(1.2,27,11),65),
        'economato-entorno':focus('Avenida 9 d’Octubre',(5,-9),(-52,18),(-36,12),(2,55,40),100),
        'economato-arbolado':focus('El jardín posterior',(0,34),(-26,75),(-16,53),(2.6,40,20),90),
        'economato-frente-urbano':focus('Las viviendas frente al Economato',(5,-32),(-12,17),(-12,-1),(6,45,25),90),
        'economato-ciudad-factoria':focus('La avenida de la ciudad factoría',(-13,5),(70,-82),(35,-47),(4,82,42),160),
    }
    focuses['economato-ciudad-factoria']['regionId']='memoria'
    focuses['economato-entorno']['fov']=51
    masks=[]
    for p in polygons(domain.buffer(.045)):
        pieces=list(shapely.constrained_delaunay_triangles(p).geoms) if p.interiors else [p]
        for q in pieces:
            if q.area>.005:masks.append(record('economato-mask-'+str(len(masks)),q))
    collision=[record('economato-context-building-'+str(i),shapes[str(r['id'])]) for i,r in enumerate(buildings)]
    envelope_rows=architecture_rows+[record('economato-porch-steps-'+str(i),s) for i,s in enumerate(polygons(steps))]
    transfer_masks=[record('economato-gerencia-transfer-'+str(i),s,previousOwner='gerencia-context',newOwner='economato-context') for i,s in enumerate(polygons(transfer))]
    # The grounds and perimeter are a visual reading of retained sources. The
    # rehabilitation announcement is a state note, not a finished new landscape.
    data={
        'schemaVersion':1,'id':'economato-context','coordinate':COORDINATE,'yaw':YAW,'researchDate':'2026-11-21',
        'districtOutline':[geo(q) for q in precinct.union(front_band).convex_hull.exterior.coords],
        'precinctOutline':[geo(q) for q in precinct.exterior.coords],
        'selectionNote':'PNOA-traced immediate Economato exterior and exact neighbouring cadastral parts. Not a legal boundary, a botanical inventory or an as-built 2026 worksite survey.',
        'surfaces':surfaces,'paths':[],'trees':trees,'shrubs':[],'benches':[],'lamps':[],'curbLines':[],'crossings':[],'pavingJoints':paving_joints,'parkingRows':[],'fences':[],'gates':[],
        'buildings':buildings,'roads':[],'foundationPatches':[],
        'excludedBuildingIds':[str(r['id']) for r in buildings],'excludedRoadIds':[],
        'genericStreetExclusions':masks,'vegetationExclusions':masks,'collisionPolygons':collision,'architectureExclusions':envelope_rows,'withheldBuildingIds':sorted(withheld),
        'sharedContext':{'buildings':shared,'architectureEnvelopes':envelope_rows,'owners':[n+'-context' for n in NAMES]+['economato-model'],'policy':'All prior buildings, roads, garden paths, furniture and trees remain owned. Only explicit Gerencia ground masks transfer; adjacent Casino, Museum and Begoña surfaces remain exact.'},
        'focusSpecs':focuses,'ownershipTransfers':transfer_masks,
        'frontBoundaryCorrection':record('economato-unobstructed-frontage',rect(-27.3,-6.5,27.3,2),previousOwner='gerencia-context',affectedFeatureId='gerencia-boundary-1',sourceId='ec-uv',note='Primary historic facade photographs show direct pavement access to both porticoes, not a continuous fence. Only the segment directly before the Economato is removed; both existing ends remain.'),
        'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','surfaceLiftM':.041,'terrainGrid':{'spacingM':5,'originXZ':[0,0],'diagonal':'x=z within each cell'},'vertices':vertices,'groups':[{'component':k,'indices':v} for k,v in groups.items()]},
        'sources':[
            {'id':'ec-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad, retained orthophoto','url':PHOTO_URL,'flightDate':'Not verified','license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'},
            {'id':'ec-catastro','title':'Dirección General del Catastro · INSPIRE Buildings 46222','url':'https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip','metadataDate':'2026-08-21'},
            {'id':'ec-uv','title':'Universitat de València · Gerencia, Casino y Economato','url':'https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html'},
            {'id':'ec-apips','title':'APIPS · Cuaderno de Trabajo 01 (2022), p. 34','url':'https://www.apips.es/assets/files/CUADERNO_TP01.pdf'},
            {'id':'ec-works2026','title':'Ayuntamiento · obras del Economato, 20 enero 2026','url':'https://aytosagunto.es/es/actualidad/2026-01-20-progresan-los-trabajos-de-rehabilitacion-del-antiguo-economato-de-ahm-para-convertirlo-en-ceam-y-centro-de-dia/'}
        ],
        'currentState':{'asOf':'2026-01-20','note':'Rehabilitation started December 2025; completion expected 2027. The planned CEAM/day-centre grounds, equipment and room layout are not shown as completed.'},
        'provenance':{
            'sourceHashes':{n:hashlib.sha256((DATA/n).read_bytes()).hexdigest() for n in ['port-cartography.json','port-elevation.json']},
            'baselineContextHashes':{n:hashlib.sha256(raw.encode()).hexdigest() for n,raw in prior_text.items()},
            'photo':{'path':PHOTO_PATH,'bounds':PHOTO_BOUNDS,'size':PHOTO_SIZE,'sha256':hashlib.sha256((ROOT/PHOTO_PATH).read_bytes()).hexdigest()},
            'precinctTracePixels':precinct_trace,'architectureFrame':{'frontA':FRONT_A,'frontB':FRONT_B,'frontLengthM':LENGTH,'stepsLocalXZ':[[-16,-1.8,-8.4,0],[5.6,-1.8,14.9,0]]},
            'treeDimensions':'Additional visible rear crowns only; pine is a visual crown class, not a verified botanical species. Heights and crown extent are interpreted and physically constrained.',
            'furniturePolicy':'No new street furniture; documented existing context furniture retains its owner.',
            'omissions':'No invented future CEAM garden, English courtyard, interior partitions, current construction machinery or new formal landscape. Demolished cadastral parts remain withheld.'
        },
        'stats':{'ownedBuildings':len(buildings),'parentParcels':len(set(r['parentId'] for r in buildings)),'reusedBuildingParts':len(shared),'ownedRoads':0,'pavingAreaM2':round(paving.area,2),'transferredGroundAreaM2':round(transfer.area,2),'newGroundCoverageM2':round(paving.difference(prior_shapes['gerencia']).area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'trees':len(trees),'benches':0,'lamps':0,'paths':0,'contextFocuses':len(focuses)}
    }
    (DATA/'economato-context.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    checks=[]
    def check(label,ok):checks.append({'label':label,'pass':bool(ok)})
    check('No new ground overlaps retained roads, paths or adjacent contexts',paving.intersection(retained).area<.002)
    check('No new ground overlaps any cadastral building or porch steps',paving.intersection(architecture).area<.002)
    check('All close exterior strips are covered by new ground or an explicit retained owner',precinct.difference(paving.union(obstacles).union(retained.buffer(.013))).area<.005)
    check('All transferred previous ground has complete replacement',transfer.difference(paving).area<.001)
    check('Source regions and terrain-grid triangles have identical coverage',abs(sum(t.area for t in triangles)-paving.area)<.02)
    check('Terrain-grid triangles do not overlap',sum(t.area for t in triangles)-unary_union(triangles).area<.02)
    check('No building identity duplicates an existing owner',not set(data['excludedBuildingIds']).intersection(prior_ids))
    check('All building footprints retain exact source coordinates and holes',all(r['coordinates']==next(a['coordinates'] for a in cart['buildings'] if a['id']==r['id']) for r in buildings))
    check('Every new tree centre lies on owned ground outside architecture',all(domain.covers(Point(project(t['coordinate']))) and Point(project(t['coordinate'])).distance(architecture)>1.6 for t in trees))
    check('No new tree duplicates an existing mapped centre within 3.2 metres',all(Point(project(t['coordinate'])).distance(Point(project(old['coordinate'])))>=3.2 for t in trees for old in previous_trees))
    check('Withheld demolished cadastral parts are not turned back into obstacles',not withheld.intersection(str(r['id']) for r in architecture_rows))
    check('Exactly five external focus IDs',len(focuses)==5)
    report={'pass':all(c['pass'] for c in checks),'checks':checks,'stats':data['stats'],'transferSurfaceIds':[r['id'] for r in prior['gerencia']['surfaces'] if polygon(r).intersection(transfer).area>.002],'retainedOwners':NAMES,'retainedGerenciaComponents':['gerencia-road','gerencia-path']}
    (OUT/'economato-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if not report['pass']:raise SystemExit(1)

if __name__=='__main__':build()
