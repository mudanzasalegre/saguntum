"""Derive the Grau Vell context from retained cadastral/OSM geometry.

No download is performed here. PNOA observations are explicitly interpretive;
the observation date is not the flight date. Uses only the Python stdlib.
"""
import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'dist/assets/data'
record = json.loads((DATA/'coast-grau.json').read_text())['sites'][0]
cartography = json.loads((DATA/'coast-cartography.json').read_text())
generic = {str(b['id']): b for b in cartography['buildings']}
CORE = ('6910216YJ3961S', '6910203YJ3961S')
PX_BOUNDS = [-.24165, 39.63345, -.2390, 39.63610]
PX_SIZE = [2200, 2700]
SX = 111320*math.cos(math.radians(39.679))
SZ = 111320

def world(p): return [(p[0]+.278)*SX, (39.679-p[1])*SZ]
def lonlat(p): return [round(p[0]/SX-.278, 10), round(39.679-p[1]/SZ, 10)]
def pixel(x, y): return [round(PX_BOUNDS[0]+x/PX_SIZE[0]*(PX_BOUNDS[2]-PX_BOUNDS[0]),10),round(PX_BOUNDS[3]-y/PX_SIZE[1]*(PX_BOUNDS[3]-PX_BOUNDS[1]),10)]
def area(p): return sum(p[i][0]*p[(i+1)%len(p)][1]-p[(i+1)%len(p)][0]*p[i][1] for i in range(len(p)))/2
def open_ring(p): return p[:-1] if p[0] == p[-1] else p
def mix(a,b,t):
    a=[int(a[i:i+2],16) for i in [1,3,5]];b=[int(b[i:i+2],16) for i in [1,3,5]]
    return '#'+''.join(f'{round(x*(1-t)+y*t):02x}' for x,y in zip(a,b))

# Roof profiles visible in the 2200 × 2700 PNOA reference. These override only
# display assumptions, never cadastral outlines, ownership or an asserted use.
roof_observations = {
 '6809503YJ3961S_part1': 'terrace',
 '6809504YJ3961S_part1': 'chapel-flat',
 '6810705YJ3961S_part1': 'light-sheet',
 '6910101YJ3961S_part1': 'open-ground',
 '6910205YJ3961S_part1': 'shallow-shed',
 '6910208YJ3961S_part1': 'open-ground',
 '6910208YJ3961S_part3': 'terrace',
 '6910209YJ3961S_part1': 'terrace',
 '6910209YJ3961S_part2': 'terrace',
 '6910209YJ3961S_part3': 'terrace',
}
buildings=[]
for s in record['structures']:
    if s['id'].startswith(CORE): continue
    base=generic.get('cat-'+s['id']+'-0', {})
    roof=roof_observations.get(s['id'],s['roofType'])
    h=5.7 if s['floors']>1 else 3.15
    if s['role']=='chapel': h=4.9
    if s['role']=='south-warehouse': h=5.6
    if roof=='open-remains': h=1.85
    if roof=='open-ground': h=0
    if s['floors']==0: h=0
    roof_color=base.get('roofColor') or '#b4aa94'
    if roof=='gable': roof_color=mix(roof_color,'#b87554',.42)
    if roof in ['terrace','chapel-flat']: roof_color=mix(roof_color,'#c8c6b9',.5)
    if roof=='light-sheet': roof_color='#cfcec3'
    p={
      'id':s['id'],'sourceId':s['id'],'genericIds':[k for k in generic if k.startswith('cat-'+s['id']+'-')],
      'role':s['role'],'coordinate':s['coordinate'],'coordinates':copy.deepcopy(s['polygon']),
      'holes':copy.deepcopy(s.get('holes',[])),'floors':s['floors'],
      'mappedAreaM2':s['mappedAreaM2'],'displayHeightM':h,'heightInterpretive':True,
      'roofType':roof,'previousRoofType':s['roofType'],'roofColor':roof_color,
      'facadeColor':'#e3e0d3' if s['role']!='chapel' else '#eeeade',
      'footprintStatus':'Catastro INSPIRE original polygon retained verbatim',
      'source':'catastro','surfaceHeightEstimateM':base.get('surfaceHeightEstimate'),
      'roofObservation':'PNOA visual interpretation' if s['id'] in roof_observations else 'Retained V31 roof interpretation; PNOA contrast',
      'elevationNote':'Facade openings, cornice height and roof slopes interpreted; no interior or present use inferred.'
    }
    if s['role']=='chapel':
      p.update(frontEdgeIndex=7,facadeMode='chapel',facadeSource='commons-chapel-2016')
    elif s['role']=='old-school' and s['floors']>1:
      p.update(facadeMode='old-school',facadeSource='commons-school-2016')
    else:p['facadeMode']='traditional'
    buildings.append(p)

ancillary_roof_observations={'1418642923':'terrace','1418647085':'light-sheet','1418648569':'terrace','1418648570':'terrace'}
for s in record['ancillaryBuildings']:
    p=open_ring(s['polygon']);c=[sum(q[i] for q in p)/len(p) for i in [0,1]]
    roof=ancillary_roof_observations.get(s['id'],'gable')
    buildings.append({'id':'osm-'+s['id'],'sourceId':s['id'],'genericIds':[s['id']],
      'role':'ancillary','coordinate':c,'coordinates':copy.deepcopy(s['polygon']),
      'holes':[],'floors':1,'displayHeightM':2.65,'heightInterpretive':True,
      'roofType':roof,'roofColor':'#ac8167' if roof=='gable' else '#c3c1b4','facadeColor':'#ddd8c9',
      'facadeMode':'ancillary','source':'osm','footprintStatus':'OSM original polygon retained verbatim',
      'roofObservation':'PNOA visual interpretation; unmeasured elevation',
      'elevationNote':'Minor mapped envelope; no residential use or interior inferred.'})

roads_by_id={str(r['id']):r for r in cartography['roads']}
road_replacements=[]; roads=[]

def split_lat(coords, lat, keep_below):
    result={'owned':[],'retained':[]}
    active=None
    def push(kind,a,b):
        nonlocal active
        if a==b:return
        if active==kind and result[kind] and result[kind][-1][-1]==a:result[kind][-1].append(b)
        else:result[kind].append([a,b])
        active=kind
    for a,b in zip(coords,coords[1:]):
        ia=a[1]<=lat if keep_below else a[1]>=lat
        ib=b[1]<=lat if keep_below else b[1]>=lat
        if ia==ib:push('owned' if ia else 'retained',a,b)
        else:
            t=(lat-a[1])/(b[1]-a[1]);q=[round(a[0]+(b[0]-a[0])*t,10),lat]
            push('owned' if ia else 'retained',a,q);push('owned' if ib else 'retained',q,b)
    return result

for id,width,material in [('399621371',8.2,'asphalt'),('290568977',5.0,'gravel'),('78613678',5.8,'asphalt')]:
    original=roads_by_id[id]
    if id=='399621371':segments=split_lat(original['coordinates'],39.63615,True)
    elif id=='78613678':segments=split_lat(original['coordinates'],39.63345,False)
    else:segments={'owned':[original['coordinates']],'retained':[]}
    road_replacements.append({'sourceId':id,'segments':segments['retained']})
    for i,coords in enumerate(segments['owned']):
        roads.append({'id':f'grau-{id}-{i}','sourceId':id,'name':original.get('name') or 'Acceso litoral',
          'coordinates':copy.deepcopy(coords),'widthM':width,'material':material,
          'startWidthM':4.5 if id=='78613678' else width,
          'endWidthM':4.5 if id=='399621371' else 8.2 if id=='78613678' else width,
          'nodeWidthsM':[4.5 if q[1]>39.63514 else width for q in coords] if id=='399621371' else None,
          'centerlineSource':'OSM original nodes plus exact boundary intersection',
          'widthInterpretive':True,'widthNote':'Visual estimate against PNOA; not a surveyed carriageway dimension.'})

# A surveyed/cartographic public square, kept separate from private courtyards.
surfaces=[{'id':'grau-chapel-square','name':'Plaza de la ermita',
 'coordinates':copy.deepcopy(record['footprints']['chapelSquare']),'holes':[],
 'material':'paving','color':'#c2bcac','heightOffsetM':.065,'source':'Retained OSM square footprint, PNOA appearance'}]

# These crowns were digitised individually from visible crowns, not scattered.
# Fortín's eight courtyard/north-court trees remain exclusively in coast-grau.js.
tree_pixels=[(502,2206,2.6,5.2),(567,2221,2.5,4.8),(596,2260,2.0,4.4),
 (549,2303,2.2,4.7),(895,1817,1.7,3.8),(1084,1802,1.6,3.8),
 (777,1415,2.1,4.7),(820,1388,1.6,4.0),(877,1463,1.6,4.1)]
trees=[{'id':f'grau-pnoa-crown-{i+1}','coordinate':pixel(x,y),'pixel':[x,y],
 'crownRadiusM':r,'heightM':h,'source':'pnoa-crown','heightInterpretive':True,'species':'unspecified broadleaf'}
 for i,(x,y,r,h) in enumerate(tree_pixels)]
shrub_pixels=[(703,2145),(725,2136),(751,2148),(774,2167),(705,2176),(732,2187),(759,2197)]
trees += [{'id':f'grau-pnoa-square-shrub-{i+1}','coordinate':pixel(x,y),'pixel':[x,y],
 'crownRadiusM':.52,'heightM':1.15,'source':'pnoa-crown','heightInterpretive':True,'species':'unspecified shrub'}
 for i,(x,y) in enumerate(shrub_pixels)]

data={
 'id':'grau-vell-context','version':'v32','title':'Grau Vell · poblado, ermita y caminos',
 'buildings':buildings,'roads':roads,'surfaces':surfaces,'trees':trees,
 'vegetationExclusionPolygons':[[pixel(x,y) for x,y in [(300,2700),(320,2510),(570,2320),(820,2100),(1130,1780),(1410,1450),(1680,1090),(1900,650),(2150,180),(2200,60),(2200,2700),(300,2700)]]],
 'vegetationExclusionNote':'PNOA-observed bare backshore strip: suppress generic procedural trees only; no shoreline, water or terrain changes.',
 'excludedBuildingIds':sorted({x for b in buildings for x in b['genericIds']}),
 'excludedRoadIds':[], 'roadReplacements':road_replacements,
 'coreExclusionPolygons':[copy.deepcopy(record['footprints'][k]) for k in ['courtyard','northCourt','moat']]
   +[copy.deepcopy(s['polygon']) for s in record['structures'] if s['id'].startswith(CORE)],
 'focuses':{
  'poblado':{'label':'Poblado marinero','coordinate':[-.24034,39.63471],'targetHeightM':2.3,'offset':[39,34,47]},
  'ermita':{'label':'Ermita y espadaña','coordinate':[-.240855325,39.63403695],'targetHeightM':3.3,'offset':[18,12,-24]},
  'plaza':{'label':'Plaza y frente de la ermita','coordinate':[-.24075,39.63415],'targetHeightM':.7,'offset':[18,23,16]}
 },
 'stats':{'cadastralParts':51,'osmAncillaryParts':6,'sourceBuildingParts':57,
  'observedRoofOverrides':len(roof_observations),'ancillaryRoofObservations':len(ancillary_roof_observations),'mappedTreeCrowns':len(trees),'waterChanged':False},
 'sources':[
  {'id':'catastro','title':'Catastro INSPIRE · partes originales del poblado','url':'https://www.catastro.hacienda.gob.es/webinspire/index.html','retrieved':'2026-08-21'},
  {'id':'osm','title':'OpenStreetMap · Grau Vell','url':'https://www.openstreetmap.org/way/399621371','retrieved':'2026-11-19'},
  {'id':'pnoa','title':'IGN/CNIG · PNOA máxima actualidad','url':'https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG:4326&bbox=39.63345,-0.24165,39.63610,-0.2390&width=2200&height=2700&format=image/jpeg','retrieved':'2026-11-21','flightDate':None,'bounds':PX_BOUNDS,'size':PX_SIZE},
  {'id':'boe-2010','title':'BOE-A-2010-14557 · entorno y tipología del Grau Vell','url':'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2010-14557'},
  {'id':'commons-chapel-2016','title':'Berta26 · Iglesia del Grau Vell, 25-05-2016','url':'https://commons.wikimedia.org/wiki/File:Isglesia_del_Grau_Vell.jpg','license':'CC BY-SA 4.0','use':'Reference only; no image republished'},
  {'id':'commons-school-2016','title':'Berta26 · Colegi del Grau Vell, 25-05-2016','url':'https://commons.wikimedia.org/wiki/File:Colegi_del_Grau_Vell.jpg','license':'CC BY-SA 4.0','use':'Reference only; no image republished'}],
 'notes':[
  'Every footprint and source ID is preserved. Roofs, heights, openings and species remain explicit visual interpretations.',
  'Two mapped parts visible as open ground in PNOA are left unroofed; this does not establish a demolition date or legal use.',
  'No reconstruction of private interiors. The documented chapel front and former-school front are based on dated photographs.',
  'Public square and road surfaces follow final terrain; no large flattening patches or shoreline changes.',
  'Water, pantalán, wetland and coastline geometry remain V31. No trees are scattered algorithmically.'
 ]
}
(DATA/'grau-context.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps(data['stats'],ensure_ascii=False))
print('road partitions',[(p['sourceId'],len(p['segments'])) for p in road_replacements])
