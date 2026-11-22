"""Reviewable Alameda-only ground transfer from Museo Industrial to Begoña.

Default writes a candidate and evidence. --apply writes the same candidate into
production. Mapped buildings, road records, terrain patches, collision polygons,
visit focuses and every piece of ground outside the mask remain unchanged.
"""
from pathlib import Path
import sys,json,copy,hashlib,argparse
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_begona_context as C
from shapely.geometry import Point,LineString
from shapely.ops import unary_union
import shapely

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');args=parser.parse_args()
 path=C.DATA/'museo-industrial-context.json';original=json.loads(path.read_text());updated=copy.deepcopy(original);begona=C.read('begona-context');handoff=C.polygon(begona['ownershipTransfer']);surfaces=[]
 for r in original['surfaces']:
  shape=C.polygon(r)
  if shape.intersection(handoff).area<1e-9:surfaces.append(copy.deepcopy(r));continue
  for i,p in enumerate(C.polygons(shape.difference(handoff))):
   extra={k:v for k,v in r.items() if k not in ['id','coordinates','holes']};surfaces.append(C.record(r['id']+('' if i==0 else '-begona-split-'+str(i)),p,**extra))
 updated['surfaces']=surfaces;regions={}
 for r in surfaces:regions.setdefault(r['component'],[]).append(C.polygon(r))
 vertices,groups,triangles,paving=C.G.triangulate_regions([(k,unary_union(v)) for k,v in regions.items()]);updated['pavementMesh']['vertices']=vertices;updated['pavementMesh']['groups']=[{'component':k,'indices':v} for k,v in groups.items()]
 changed={};removed={}
 for field in ['curbLines','crossings','pavingJoints','parkingRows','fences','railAlignments']:
  rows=[];count=0
  for r in original.get(field,[]):
   line=LineString([C.project(q) for q in r['coordinates']]);mask=handoff.buffer(.025)
   if not line.intersects(mask):rows.append(copy.deepcopy(r));continue
   count+=1
   for i,p in enumerate(C.lines(line.difference(mask))):rows.append(C.line_record(r['id']+('' if i==0 else '-begona-split-'+str(i)),p,**{k:v for k,v in r.items() if k not in ['id','coordinates']}))
  updated[field]=rows;changed[field]=count
 for field in ['trees','lamps']:
  keep=[r for r in original.get(field,[]) if not handoff.buffer(.025).covers(Point(C.project(r['coordinate'])))];updated[field]=copy.deepcopy(keep);removed[field]=[r['id'] for r in original.get(field,[]) if r not in keep]
 masks=[]
 for p in C.polygons(paving.buffer(.10)):
  for q in list(shapely.constrained_delaunay_triangles(p).geoms) if p.interiors else [p]:
   if q.area>.005:masks.append(C.record('museo-industrial-mask-'+str(len(masks)),q))
 updated['genericStreetExclusions']=masks;updated['vegetationExclusions']=copy.deepcopy(masks)
 updated['sharedContext']['begonaOwnershipV27']={'owner':'begona-context','source':'begona-context.json ownershipTransfer','note':'Alameda ground and local furniture transfer. All mapped buildings, road records, museum forecourt and external ground remain with their established owners.'}
 updated['stats'].update({'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'trees':len(updated['trees']),'streetLamps':len(updated['lamps']),'crossings':len(updated['crossings'])})
 checks=[]
 def check(label,ok):checks.append({'label':label,'pass':bool(ok)})
 for f in ['buildings','roads','excludedBuildingIds','excludedRoadIds','collisionPolygons','foundationPatches','heightReview','coreBuildingParts','withheldBuildingParts','coreExclusion','focusSpecs','districtOutline']:check(f+' preserved exactly',updated.get(f)==original.get(f))
 check('Retained museum paving outside Alameda transfer',paving.intersection(handoff).area<.005)
 check('No original ground outside transfer lost',unary_union([C.polygon(r) for r in original['surfaces']]).difference(handoff).symmetric_difference(paving).area<.03)
 check('All remaining museum tree and lamp centers outside transfer',all(not handoff.covers(Point(C.project(r['coordinate']))) for f in ['trees','lamps'] for r in updated[f]))
 check('Museum and Begoña paving disjoint',paving.intersection(unary_union([C.polygon(r) for r in begona['surfaces']])).area<.005)
 check('All transferred original ground is covered by Begoña paving or actual architecture',unary_union([C.polygon(r) for r in original['surfaces']]).intersection(handoff).difference(unary_union([C.polygon(r) for r in begona['surfaces']]+[C.polygon(r).buffer(.121) for r in begona['architectureExclusions']])).area<.01)
 check('Re-triangulated area preserves holes',abs(sum(t.area for t in triangles)-paving.area)<.03)
 report={'pass':all(c['pass'] for c in checks),'checks':checks,'apply':args.apply,'affectedLines':changed,'removedPointFeatures':removed,'transferAreaM2':round(handoff.area,2),'actuallyTransferredM2':round(unary_union([C.polygon(r) for r in original['surfaces']]).intersection(handoff).area,2),'beforeStats':original['stats'],'newStats':updated['stats'],'beforeSHA256':hashlib.sha256(path.read_bytes()).hexdigest()}
 candidate=C.OUT/'museo-industrial-context-begona-transfer-candidate.json';encoded=json.dumps(updated,ensure_ascii=False,separators=(',',':'))+'\n';candidate.write_text(encoded);(C.OUT/'begona-alameda-ownership-transfer-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 if not report['pass']:print(json.dumps(report,indent=2));raise SystemExit(1)
 if args.apply:path.write_text(encoded)
 print(json.dumps({'pass':report['pass'],'apply':args.apply,'checks':len(checks),'affectedLines':changed,'removedPointFeatures':removed,'actualTransferAreaM2':report['actuallyTransferredM2'],'newStats':updated['stats'],'candidate':str(candidate)},indent=2))
if __name__=='__main__':main()
