"""Add the photographed pavement between Begoña's NE wall and 9 d'Octubre.

Run after prepare_begona_context.py and the Alameda ownership transfer. This is
an additive, idempotent refinement: it never changes the applied transfer mask,
museum data, church parcel, roads, tree inventory or mapped urban buildings.
The narrow strip was previously visible as orthophoto terrain. Its extent is
clipped by the cadastral wall, the actual temple footprint and retained paving;
its plain stone finish is an interpretation, not a surveyed material record.
"""
from pathlib import Path
import sys,json,copy,hashlib,subprocess
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_begona_context as C
from shapely.geometry import Polygon,Point
from shapely.ops import unary_union
import shapely

ID='begona-ne-sidewalk-infill'

def main():
 path=C.DATA/'begona-context.json';data=json.loads(path.read_text());before=copy.deepcopy(data)
 neighbours={n:C.read(n+'-context') for n in ['horno','talleres','museo-industrial','gerencia','casino']}
 immutable_hashes={n:hashlib.sha256((C.DATA/(n+'-context.json')).read_bytes()).hexdigest() for n in neighbours}
 transfer_path=C.OUT/'begona-alameda-ownership-transfer-qa.json'
 transfer_hash=hashlib.sha256(transfer_path.read_bytes()).hexdigest()
 original=[r for r in data['surfaces'] if not r['id'].startswith(ID)]
 existing=unary_union([C.polygon(r) for r in original])
 retained=unary_union([C.polygon(r) for d in neighbours.values() for r in d['surfaces']])
 church=C.polygon(data['churchParcelFootprint'])
 temple=next(r for r in C.read('port-garden')['sites'] if r['id']=='begona')
 architecture=unary_union([C.polygon(r) for r in data['architectureExclusions']]).buffer(.12)
 # The long northeastern cadastral wall, oriented from the rear to the front.
 # Its outward normal points into the photographed sidewalk beside the road.
 a,b=C.project([-.2213397,39.6588004]),C.project([-.220968,39.6585985])
 dx,dz=b[0]-a[0],b[1]-a[1];length=(dx*dx+dz*dz)**.5;nx,nz=dz/length,-dx/length
 raw=Polygon([a,b,(b[0]+nx*4,b[1]+nz*4),(a[0]+nx*4,a[1]+nz*4)])
 strip=raw.difference(architecture).difference(retained).difference(existing).buffer(0)
 records=[C.record(ID+'-'+str(i),p,component='begona-paving',regionId='alameda',sourceId='bg-pnoa',interpretive=True,
                  sourceNote='PNOA shows a paved roadside foot beside the NE church wall. Extent is bounded by cadastral wall and retained street paving; the neutral stone finish is interpreted.')
          for i,p in enumerate(C.polygons(strip)) if p.area>.01]
 data['surfaces']=original+records
 groups={}
 for row in data['surfaces']:groups.setdefault(row['component'],[]).append(C.polygon(row))
 regions=[(k,unary_union(v)) for k,v in groups.items()]
 vertices,indices,triangles,paving=C.G.triangulate_regions(regions)
 data['pavementMesh']['vertices']=vertices
 data['pavementMesh']['groups']=[{'component':k,'indices':v} for k,v in indices.items()]
 for field in ['genericStreetExclusions','vegetationExclusions']:
  masks=[r for r in data[field] if not r['id'].startswith(ID)]
  for i,p in enumerate(C.polygons(strip.buffer(.08))):masks.append(C.record(ID+'-mask-'+str(i),p))
  data[field]=masks
 data['provenance']['roadsideRefinement']={'id':ID,'sourceId':'bg-pnoa','retrieved':'2026-11-21','flightDate':'Not verified',
   'wallEndpoints':[[-.2213397,39.6588004],[-.220968,39.6585985]],'wallLengthM':round(length,3),'addedPavingAreaM2':round(strip.area,3),
   'interpretation':'Paved margin observed in PNOA; extent uses cadastral wall and existing road boundary. Neutral stone finish is approximate.',
   'ownership':'Previously unmodeled terrain only. No museum ground, building, road or transfer-mask ownership changes.'}
 data['stats'].update({'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles)})
 checks=[]
 def check(label,ok,detail=None):checks.append({'label':label,'pass':bool(ok),**({'detail':detail}if detail is not None else {})})
 check('New paving excludes all architecture and entrance steps',paving.intersection(architecture).area<.002)
 check('Paving does not overlap any retained context ground',paving.intersection(retained).area<.01)
 prior_ids={str(i) for d in neighbours.values() for i in d.get('excludedBuildingIds',[])}
 check('New building ids do not duplicate any previous context owner',not set(data['excludedBuildingIds']).intersection(prior_ids))
 check('New paving triangles exactly cover source regions',abs(sum(t.area for t in triangles)-paving.area)<.02)
 check('No new triangle overlaps another',sum(t.area for t in triangles)-unary_union(triangles).area<.02)
 check('Five guide context stops present',len(data['focusSpecs'])==5)
 old_reserve=Polygon([C.project(p) for p in [[-.220982,39.658609],[-.220749,39.658498],[-.220720,39.658367],[-.220937,39.658211],[-.221145,39.658323],[-.221157,39.658411]]])
 check('Legacy plaza completely remains represented',old_reserve.difference(paving.union(retained).union(architecture)).area<.01)
 museum_before=json.loads(subprocess.check_output(['git','show','HEAD:dist/assets/data/museo-industrial-context.json'],cwd=C.ROOT))
 original_museum=unary_union([C.polygon(r) for r in museum_before['surfaces']]);handoff=C.polygon(data['ownershipTransfer'])
 check('Every transferred museum ground surface is covered by new paving or actual architecture',original_museum.intersection(handoff).difference(paving.union(architecture)).area<.01)
 withheld=set(data['withheldBuildingIds'])
 check('No withheld demolished/open-ground parcel appears as a building obstacle',not {str(r['id']) for r in data['architectureExclusions']}.intersection(withheld))
 check('All mapped tree centers avoid architecture',all(not architecture.intersects(Point(C.project(t['coordinate']))) for t in data['trees']))
 check('Existing Begoña paving is unchanged outside the added roadside strip',existing.difference(paving).area<.002 and paving.difference(existing.union(strip)).area<.002)
 check('Roadside strip stays inside the photographed cadastral roadside corridor',strip.difference(raw).area<.001)
 check('Roadside strip has no overlap with retained streets or church parcel',strip.intersection(retained.union(church)).area<.001)
 immutable=['churchParcelFootprint','withheldBuildingIds','buildings','roads','trees','shrubs','benches','lamps','paths','curbLines','crossings','pavingJoints','parkingRows','fences','gates','memorial','playEquipment','foundationPatches','excludedBuildingIds','excludedRoadIds','collisionPolygons','architectureExclusions','sharedContext','focusSpecs','ownershipTransfer']
 check('All existing buildings, roads, furniture, trees and ownership transfer remain unchanged',all(data[k]==before[k] for k in immutable))
 check('Earlier context files and applied transfer evidence remain byte-identical',all(hashlib.sha256((C.DATA/(n+'-context.json')).read_bytes()).hexdigest()==h for n,h in immutable_hashes.items()) and hashlib.sha256(transfer_path.read_bytes()).hexdigest()==transfer_hash)
 report={'pass':all(r['pass'] for r in checks),'checks':checks,'stats':data['stats'],'museoGroundTransferAreaM2':json.loads(transfer_path.read_text())['actuallyTransferredM2'],
         'roadsideRefinement':data['provenance']['roadsideRefinement'],'retainedContextSHA256':immutable_hashes,'appliedTransferReportSHA256':transfer_hash}
 if not report['pass']:
  print(json.dumps(report,indent=2));raise SystemExit(1)
 path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
 (C.OUT/'begona-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 (C.OUT/'begona-sidewalk-refinement-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'pass':report['pass'],'checks':len(checks),'addedPavingAreaM2':round(strip.area,3),'stats':data['stats']},indent=2))

if __name__=='__main__':main()
