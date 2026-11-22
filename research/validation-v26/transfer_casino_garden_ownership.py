"""Reviewable, idempotent ground ownership transfer from Gerencia to Casino.

Default writes a candidate and QA report in validation-v26. Only --apply writes
dist/assets/data/gerencia-context.json. Architecture, road records, collisions,
ground patches and every non-intersecting feature retain their exact values.
"""
from pathlib import Path
import sys,json,copy,hashlib,argparse
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_casino_context as C
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
import shapely

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');args=parser.parse_args()
    path=C.DATA/'gerencia-context.json';original=json.loads(path.read_text());updated=copy.deepcopy(original)
    casino=C.read('casino-context');handoff=C.polygon(casino['ownershipTransfer'])
    surfaces=[]
    for r in original['surfaces']:
        shape=C.polygon(r)
        if shape.intersection(handoff).area<1e-9:surfaces.append(copy.deepcopy(r));continue
        for i,p in enumerate(C.polygons(shape.difference(handoff))):
            extras={k:v for k,v in r.items() if k not in ['id','coordinates','holes']}
            surfaces.append(C.record(r['id']+('' if i==0 else '-casino-split-'+str(i)),p,**extras))
    updated['surfaces']=surfaces
    regions={}
    for r in surfaces:regions.setdefault(r['component'],[]).append(C.polygon(r))
    regions=[(k,unary_union(v)) for k,v in regions.items()]
    vertices,groups,triangles,paving=C.G.triangulate_regions(regions)
    updated['pavementMesh']['vertices']=vertices;updated['pavementMesh']['groups']=[{'component':k,'indices':v} for k,v in groups.items()]
    removed={};changed={}
    for field in ['paths','fences','curbLines','pavingJoints','crossings','parkingRows']:
        rows=[];count=0
        for r in original.get(field,[]):
            line=LineString([C.project(q) for q in r['coordinates']]);padding=(r.get('widthM',0)/2+.025) if field=='paths' else .025
            mask=handoff.buffer(padding)
            if not line.intersects(mask):rows.append(copy.deepcopy(r));continue
            count+=1
            for i,p in enumerate(C.lines(line.difference(mask))):
                extras={k:v for k,v in r.items() if k not in ['id','coordinates']}
                rows.append(C.line_record(r['id']+('' if i==0 else '-casino-split-'+str(i)),p,**extras))
        updated[field]=rows;changed[field]=count
    for field in ['trees','shrubs','benches','lamps','gates']:
        rows=original.get(field,[]);keep=[r for r in rows if not handoff.buffer(.025).covers(Point(C.project(r['coordinate'])))];updated[field]=copy.deepcopy(keep);removed[field]=[r.get('id') for r in rows if r not in keep]
    masks=[]
    # Keep the same surface-based generic street / vegetation exclusions. Holes
    # are triangulated so the consumer's simple-polygon API never fills them.
    for p in C.polygons(paving.buffer(.10)):
        pieces=list(shapely.constrained_delaunay_triangles(p).geoms) if p.interiors else [p]
        for q in pieces:
            if q.area>.005:masks.append(C.record('gerencia-mask-'+str(len(masks)),q))
    updated['genericStreetExclusions']=masks;updated['vegetationExclusions']=copy.deepcopy(masks)
    updated['sharedContext']['casinoGarden']=copy.deepcopy(casino['ownershipTransfer'])
    updated['sharedContext']['casinoOwnershipV26']={'owner':'casino-context','source':'casino-context.json ownershipTransfer','note':'Ground and furnishing in the photo-traced Casino garden transfer; surrounding buildings, all source roads and previous industrial contexts remain unchanged.'}
    updated['stats'].update({'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'gardenPathFragments':len(updated['paths']),'trees':len(updated['trees']),'shrubs':len(updated['shrubs']),'benches':len(updated['benches']),'lamps':len(updated['lamps']),'boundarySegments':len(updated['fences'])})
    checks=[]
    def check(label,ok):checks.append({'label':label,'pass':bool(ok)})
    protected_fields=['buildings','roads','excludedBuildingIds','excludedRoadIds','collisionPolygons','foundationPatches','heightReview','coreBuildingParts','focusSpecs','districtOutline']
    for field in protected_fields:check(field+' preserved exactly',updated.get(field)==original.get(field))
    check('New Gerencia paving outside Casino handoff',paving.intersection(handoff).area<.005)
    check('All retained Gerencia points outside handoff',all(not handoff.covers(Point(C.project(r['coordinate']))) for field in ['trees','shrubs','benches','lamps','gates'] for r in updated.get(field,[])))
    check('Polygon holes preserved in triangulated area',abs(sum(t.area for t in triangles)-paving.area)<.05)
    check('New Gerencia paving and Casino paving are disjoint',paving.intersection(unary_union([C.polygon(r) for r in casino['surfaces']])).area<.005)
    check('No original external ground removed',unary_union([C.polygon(r) for r in original['surfaces']]).difference(handoff).symmetric_difference(paving).area<.02)
    report={'pass':all(v['pass'] for v in checks),'checks':checks,'apply':args.apply,'affectedLines':changed,'removedPointFeatures':removed,'transferAreaM2':round(handoff.area,2),'newStats':updated['stats'],'beforeSHA256':hashlib.sha256(path.read_bytes()).hexdigest()}
    encoded=json.dumps(updated,ensure_ascii=False,separators=(',',':'))+'\n'
    candidate=C.OUT/'gerencia-context-casino-transfer-candidate.json';candidate.write_text(encoded)
    (C.OUT/'casino-garden-ownership-transfer-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    if not report['pass']:print(json.dumps(report,indent=2));raise SystemExit(1)
    if args.apply:path.write_text(encoded)
    print(json.dumps({'pass':report['pass'],'apply':args.apply,'checks':len(checks),'affectedLines':changed,'removedPointFeatures':removed,'newStats':updated['stats'],'candidate':str(candidate)},indent=2))

if __name__=='__main__':main()
