"""Begoña and the Alameda: PNOA-traced surfaces, mapped parcels, explicit owners.

The retained orthophoto controls ground layout. Heights, small furnishings and
canopy sizes are visual interpretations. Municipality's 2025 memorial update is
represented schematically, with its location approximate within documented SE
sector. No proposed 2026 sculpture is treated as installed.
"""
from pathlib import Path
import sys,json,math,hashlib,importlib.util
try:import shapely
except ImportError:
 sys.path.insert(0,'/workspace/scratch/36862867499f/begona-context-deps');import shapely
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2];DATA=ROOT/'dist/assets/data';OUT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('g',ROOT/'research/validation-v25/prepare_gerencia_context.py');G=importlib.util.module_from_spec(spec);spec.loader.exec_module(G)
project,geo,polygons,lines,polygon,record,line_record=G.project,G.geo,G.polygons,G.lines,G.polygon,G.record,G.line_record
read=lambda n:json.loads((DATA/(n+'.json')).read_text())
PHOTO_BOUNDS={'west':-.22225,'east':-.21850,'south':39.65710,'north':39.65950};PHOTO_SIZE=[1800,1488]
PHOTO_URL='https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.65710%2C-0.22225%2C39.65950%2C-0.21850&width=1800&height=1488&format=image%2Fjpeg'
def photo(p):return project((PHOTO_BOUNDS['west']+p[0]/1800*.00375,PHOTO_BOUNDS['north']-p[1]/1488*.0024))
def traced(ps):return Polygon([photo(p) for p in ps]).buffer(0)
def pixel(p):q=geo(p);return [(q[0]+.22225)/.00375*1800,(39.65950-q[1])/.0024*1488]
COORDINATE=[-.221225,39.658587]
A,B=project([-.2211553,39.6584108]),project([-.2209798,39.6586052]);CX,CZ=(A[0]+B[0])/2,(A[1]+B[1])/2;YAW=-math.atan2(B[1]-A[1],B[0]-A[0]);CC,SS=math.cos(YAW),math.sin(YAW)
local=lambda x,z:(CX+x*CC+z*SS,CZ-x*SS+z*CC)
def build():
 cart=read('port-cartography');site=next(s for s in read('port-garden')['sites'] if s['id']=='begona')
 prior={n:read(n+'-context') for n in ['horno','talleres','museo-industrial','gerencia','casino']}
 church=next(r for r in cart['buildings'] if r.get('parentId')=='8338803YJ3983N');church_shape=polygon(church).union(Polygon([project(q) for q in site['footprint']])).buffer(0)
 steps=Polygon([local(x,z) for x,z in [(-3,0),(3,0),(3,2.8),(-3,2.8)]]).buffer(.16)
 # Exact outer walk and curb edges visible in the retained image, stopping at
 # existing street owners. The original local forecourt is included explicitly.
 precinct_trace=[(612,553),(1363,1017),(1328,1098),(1255,1144),(445,1015),(415,978),(475,736),(512,684)]
 old_reserve=Polygon([project(p) for p in [[-.220982,39.658609],[-.220749,39.658498],[-.220720,39.658367],[-.220937,39.658211],[-.221145,39.658323],[-.221157,39.658411]]])
 precinct=traced(precinct_trace).union(old_reserve).buffer(0)
 prior_shapes={n:unary_union([polygon(r) for r in d['surfaces']]) for n,d in prior.items()}
 # Alameda ground is reassigned only from the adjacent museum's general context.
 # Earlier street edges and Gerencia garden keep their owners outside this mask.
 other=unary_union([p for n,p in prior_shapes.items() if n!='museo-industrial'])
 handoff=precinct.difference(other.buffer(.018)).difference(church_shape.buffer(.1)).difference(steps)
 withheld={str(r['id']) for d in prior.values() for r in d.get('withheldBuildingParts',[])}
 architecture_rows=[r for r in cart['buildings'] if str(r['id']) not in withheld and polygon(r).distance(precinct)<45]
 obstacles=unary_union([polygon(r) for r in architecture_rows]+[church_shape,steps]).buffer(.12)
 domain=handoff.difference(obstacles)
 # Row trees and small planted beds are read from PNOA; no botanical identity.
 tree_pixels=[(690,601),(736,620),(782,652),(818,682),(850,714),(877,731),(929,757),(981,794),(1026,825),(1085,861),(1170,927),(1234,966),(1300,1014),(1228,1126),(635,691),(661,724),(708,758),(750,778),(780,807),(810,825),(866,860),(901,885),(958,914),(1007,951),(1042,979),(1115,1038),(1177,1080),(565,744),(521,785),(496,823),(479,863),(446,913),(460,980),(491,998),(530,1004),(570,1015),(716,918),(612,779),(558,823),(650,869)]
 palm_pixels={(750,778),(780,807),(565,744),(521,785),(635,691),(612,779)}
 previous_trees=[r for n,d in prior.items() for r in d.get('trees',[]) if n!='museo-industrial' or not handoff.covers(Point(project(r['coordinate'])))]
 trees=[]
 for i,pix in enumerate(tree_pixels):
  q=Point(photo(pix))
  if not domain.covers(q) or q.distance(obstacles)<.9 or any(q.distance(Point(project(r['coordinate'])))<2 for r in previous_trees):continue
  kind='palm' if pix in palm_pixels else 'broadleaf';trees.append({'id':f'begona-tree-{i}','coordinate':geo(q.coords[0]),'sourcePixel':list(pix),'kind':kind,'heightM':8.5+(i%4)*.55 if kind=='palm' else 5.7+(i%5)*.45,'crownRadiusM':2.8 if kind=='palm' else 2.8+(i%4)*.25,'sourceId':'bg-pnoa','positionFromPhoto':True,'dimensionsInterpretive':True,'speciesVerified':False})
 # The square tree pits and circular beds remain holes in paving, with an earth
 # surface of their own. Their widths are interpreted from orthophoto pixels.
 bed_polys=[]
 for t in trees:
  p=Point(project(t['coordinate']));radius=1.15 if t['kind']=='palm' else 1.35
  shape=p.buffer(radius,quad_segs=16) if t['sourcePixel'][0]<650 else box(p.x-radius,p.y-radius,p.x+radius,p.y+radius)
  bed_polys.append(shape.intersection(domain))
 green_shapes=[traced([(479,734),(520,760),(488,819),(461,879),(434,917),(418,963),(428,900),(446,821)]),traced([(618,741),(711,789),(688,813),(603,764)]),traced([(754,806),(1006,950),(994,972),(737,823)]),traced([(1115,1036),(1236,1105),(1209,1135),(1106,1061)])]
 beds=unary_union(bed_polys+green_shapes).intersection(domain)
 play=traced([(590,791),(671,838),(612,926),(526,876)]).intersection(domain)
 play_green=traced([(590,791),(671,838),(638,883),(558,836)]).intersection(play)
 play_blue=play.difference(play_green)
 open_ground=traced([(703,847),(1212,1122),(581,1032)]).intersection(domain)
 main_walk=LineString([photo(q) for q in [(562,690),(1279,1125)]]).buffer(2.7,cap_style='flat')
 transverse=LineString([photo(q) for q in [(709,821),(554,1045)]]).buffer(2.15,cap_style='flat')
 # Forecourt remains grey stone and the broad main promenade uses a quiet grid.
 regions=[('begona-planted',beds),('begona-play-green',play_green),('begona-play-blue',play_blue),('begona-promenade',main_walk.union(transverse)),('begona-open-ground',open_ground),('begona-paving',domain)]
 disjoint=[];used=Polygon()
 for k,shape in regions:
  shape=shape.intersection(domain).difference(used);disjoint.append((k,shape));used=used.union(shape)
 surfaces=[record(k+'-'+str(i),p,component=k,regionId='alameda',sourceId='bg-pnoa',interpretive=True) for k,s in disjoint for i,p in enumerate(polygons(s))]
 vertices,groups,triangles,paving=G.triangulate_regions(disjoint)
 paths=[]
 for i,row in enumerate([[(562,690),(1279,1125)],[(709,821),(554,1045)],[(522,710),(443,972)]]):
  for j,line in enumerate(lines(LineString([photo(q) for q in row]).intersection(domain.buffer(-.7)))):paths.append(line_record(f'begona-walk-{i}-{j}',line,widthM=1.2,sourceId='bg-pnoa',interpretive=True))
 # Existing detailed neighbours remain their owner's exact geometry. The more
 # easterly cadastral urban front is upgraded from generic city to this context.
 owned_ids={str(i) for d in prior.values() for i in d.get('excludedBuildingIds',[])}
 heritage=[s for n in ['port-garden','port-industrial','port-workers'] for s in read(n)['sites']]
 protected={p for s in heritage for p in s.get('catastroBuildingIds',[])}
 front_band=LineString([photo(q) for q in [(702,555),(1285,910)]]).buffer(34)
 buildings=[];shared=[]
 for r in architecture_rows:
  shp=polygon(r)
  if r.get('parentId') in protected or str(r['id']) in owned_ids or not shp.intersects(front_band) or shp.area<7:
   shared.append(dict(r,owner='existing-context',renderedElsewhere=True));continue
  h=float(r.get('surfaceHeightEstimate') or max(3,int(r.get('levels') or 1)*3.1))
  buildings.append(dict(r,displayHeightM=h,contextComponent='begona-frente-urbano',facadeColor=['#cfbda6','#cbb79d','#d8cbb7','#c4b9a8','#d4c6b5'][len(buildings)%5],renderingType='urban',roofForm='source-plan'))
 benches=[];lamps=[]
 for i,pix in enumerate([(598,759),(657,777),(719,814),(794,850),(849,886),(930,926),(1020,988),(1121,1056),(1210,1104),(512,925),(557,962)]):
  p=Point(photo(pix))
  if domain.buffer(-.5).covers(p) and p.distance(obstacles)>1:benches.append({'id':f'begona-bench-{i}','coordinate':geo(p.coords[0]),'yaw':-.58,'sourceId':'bg-pnoa','interpretive':True})
 for i,pix in enumerate([(589,686),(694,765),(812,841),(930,915),(1053,995),(1171,1071),(481,934)]):
  p=Point(photo(pix))
  if domain.buffer(-.5).covers(p) and p.distance(obstacles)>1:lamps.append({'id':f'begona-lamp-{i}','coordinate':geo(p.coords[0]),'heightM':4.7,'heritageStyle':False,'sourceId':'bg-pnoa','interpretive':True})
 # Map polygon/surface material grid is represented by narrow joints which are
 # clipped to the promenade, avoiding buildings and planting openings.
 promenade=next(s for k,s in disjoint if k=='begona-promenade');paving_joints=[]
 ax=LineString([photo(q) for q in [(562,690),(1279,1125)]]);a,b=ax.coords[0],ax.coords[-1];dx,dz=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dz);nx,nz=-dz/length,dx/length
 for i in range(1,int(length/3)):
  p=ax.interpolate(i*3);joint=LineString([(p.x-nx*2.7,p.y-nz*2.7),(p.x+nx*2.7,p.y+nz*2.7)])
  for j,line in enumerate(lines(joint.intersection(promenade))):paving_joints.append(line_record(f'begona-joint-{i}-{j}',line))
 def focus(label,pix,far,near,heights,layer='alameda',radius=65):
  p,f,n=map(photo,[pix,far,near]);return {'label':label,'targetCoordinates':geo(p),'targetHeight':heights[0],'far':[f[0]-p[0],heights[1]-heights[0],f[1]-p[1]],'near':[n[0]-p[0],heights[2]-heights[0],n[1]-p[1]],'radius':radius,'fov':54,'regionId':layer}
 focuses={'begona-atrio':focus('La plaza ante el templo',(570,690),(900,860),(730,780),(1.2,30,10)),'begona-alameda':focus('El paseo de la Alameda',(924,905),(1390,1250),(1176,1075),(1.3,52,18),radius=120),'begona-arbolado':focus('Palmeras y alineaciones de sombra',(745,787),(952,998),(860,916),(3.0,26,13)),'begona-frente-urbano':focus('La calle y sus viviendas',(1002,735),(1174,1062),(1090,943),(6,42,22)),'begona-ciudad-factoria':focus('Servicios y vida de la ciudad factoría',(601,710),(1165,1098),(892,968),(4,62,29),'anexos',145)}
 masks=[]
 for p in polygons(domain.buffer(.08)):
  pieces=list(shapely.constrained_delaunay_triangles(p).geoms) if p.interiors else [p]
  for q in pieces:
   if q.area>.005:masks.append(record('begona-mask-'+str(len(masks)),q))
 collision=[record('begona-building-'+str(i),polygon(r)) for i,r in enumerate(buildings)]
 protect_rows=[record('begona-built-envelope',church_shape),record('begona-entrance-steps',steps)]+architecture_rows
 # Retain documented memorial as a restrained, explicitly located approximate
 # landmark at the south-east edge; no engraved personal names are fabricated.
 memorial={'id':'begona-workers-memorial','coordinate':geo(photo((1210,1101))),'yaw':-.58,'widthM':5.6,'heightM':4.5,'sourceId':'bg-memorial2025','positionInterpretive':True,'dimensionsInterpretive':True,'detailInterpretive':True,'locationNote':'Within documented south-east Alameda sector; not a surveyed coordinate.'}
 data={'schemaVersion':1,'id':'begona-context','coordinate':COORDINATE,'yaw':YAW,'researchDate':'2026-11-21','districtOutline':[geo(q) for q in precinct.union(front_band).convex_hull.exterior.coords],'precinctOutline':[geo(q) for q in precinct.exterior.coords],'selectionNote':'Photo-traced Alameda with cadastral urban front. Heights, furniture and exact memorial position are interpreted. Ground snapshot is not a current-condition survey.','churchParcelFootprint':church,'withheldBuildingIds':sorted(withheld),'surfaces':surfaces,'paths':paths,'trees':trees,'shrubs':[],'benches':benches,'lamps':lamps,'curbLines':[],'crossings':[],'pavingJoints':paving_joints,'parkingRows':[],'fences':[],'gates':[],'memorial':memorial,'playEquipment':[{'id':'begona-play-swings','coordinate':geo(photo((556,875))),'yaw':-.58,'sourceId':'bg-pnoa','interpretive':True}],'buildings':buildings,'roads':[],'foundationPatches':[],'excludedBuildingIds':[str(r['id']) for r in buildings],'excludedRoadIds':[],'genericStreetExclusions':masks,'vegetationExclusions':masks,'collisionPolygons':collision,'architectureExclusions':protect_rows,'sharedContext':{'buildings':shared,'architectureEnvelopes':protect_rows,'owners':['gerencia-context','casino-context','museo-industrial-context','talleres-context','horno-context','economato-model','begona-model'],'policy':'Only Alameda ground transfers from Museo Industrial; all earlier buildings and external road geometry retain ownership.'},'focusSpecs':focuses,'ownershipTransfer':record('begona-alameda-transfer',handoff,previousOwner='museo-industrial-context',newOwner='begona-context'),'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','surfaceLiftM':.041,'terrainGrid':{'spacingM':5,'originXZ':[0,0],'diagonal':'x=z within each cell'},'vertices':vertices,'groups':[{'component':k,'indices':v} for k,v in groups.items()]},'sources':[{'id':'bg-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad','url':PHOTO_URL,'flightDate':'Not verified','license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'},{'id':'bg-catastro','title':'Dirección General del Catastro · INSPIRE BU 46222','url':'https://www.catastro.hacienda.gob.es/webinspire/index.html','metadataDate':'2026-08-21'},{'id':'bg-memorial2025','title':'Ayuntamiento · nuevas placas del monumento de la Alameda, 18 julio 2025','url':'https://aytosagunto.es/es/actualidad/2025-07-18-el-consistorio-incorpora-nuevas-placas-en-el-monumento-a-las-personas-fallecidas-en-la-fabrica/'},{'id':'bg-rutas2023','title':'FCV Patrimonio Industrial · Rutas por la memoria obrera (2023), La Alameda, p52','url':'https://www.relatsiberoamerica.com/documentos/Beneyto/2023Beneytocoord.Rutas2.pdf'},{'id':'bg-proposals2026','title':'Ayuntamiento · esculturas propuestas, 13 marzo 2026','url':'https://aytosagunto.es/es/actualidad/2026-03-13-sale-a-licitacion-la-construccion-de-dos-esculturas-que-evocan-la-formacion-profesional-de-la-antigua-fabrica-siderurgica/'}],'provenance':{'sourceHashes':{n:hashlib.sha256((DATA/n).read_bytes()).hexdigest() for n in ['port-cartography.json','port-elevation.json']},'photo':{'path':'research/validation-v27/begona-context-orthophoto-reference.jpg','bounds':PHOTO_BOUNDS,'size':PHOTO_SIZE,'sha256':hashlib.sha256((OUT/'begona-context-orthophoto-reference.jpg').read_bytes()).hexdigest()},'precinctTracePixels':precinct_trace,'omissions':'No reconstruction of demolished 1911 school. Proposed December2026 sculptures are not modeled as present. Boat and locomotive have unverified placement beyond this Alameda precinct and are not duplicated here.','treeDimensions':'Visual palm/broadleaf classes; not a botanical inventory.','furniturePositions':'Approximate reading of orthophoto, not measured current inventory.'},'stats':{'ownedBuildings':len(buildings),'parentParcels':len(set(r['parentId'] for r in buildings)),'reusedBuildingParts':len(shared),'ownedRoads':0,'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'trees':len(trees),'benches':len(benches),'lamps':len(lamps),'paths':len(paths),'contextFocuses':len(focuses),'memorials':1}}
 (DATA/'begona-context.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
 checks=[]
 def check(label,ok):checks.append({'label':label,'pass':bool(ok)})
 check('New paving excludes all architecture and entrance steps',paving.intersection(obstacles).area<.002)
 check('Paving does not overlap four retained prior context domains',paving.intersection(other).area<.002)
 check('New building ids do not duplicate any previous context owner',not set(data['excludedBuildingIds']).intersection(owned_ids))
 check('New paving triangles exactly cover source regions',abs(sum(t.area for t in triangles)-paving.area)<.02)
 check('No new triangle overlaps another',sum(t.area for t in triangles)-unary_union(triangles).area<.02)
 check('Five guide context stops present',len(focuses)==5)
 check('Legacy plaza completely remains represented',old_reserve.difference(paving.union(other).union(obstacles)).area<.01)
 check('Every transferred museum ground surface is covered by new paving or actual architecture',prior_shapes['museo-industrial'].intersection(handoff).difference(paving.union(obstacles)).area<.01)
 check('No withheld demolished/open-ground parcel appears as a building obstacle',not set(str(r['id']) for r in architecture_rows).intersection(withheld))
 check('All mapped tree centers avoid architecture',all(not obstacles.intersects(Point(project(t['coordinate']))) for t in trees))
 report={'pass':all(r['pass'] for r in checks),'checks':checks,'stats':data['stats'],'museoGroundTransferAreaM2':round(prior_shapes['museo-industrial'].intersection(handoff).area,2)}
 (OUT/'begona-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,indent=2))
 if not report['pass']:raise SystemExit(1)
if __name__=='__main__':build()
