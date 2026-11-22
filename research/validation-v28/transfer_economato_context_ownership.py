"""Reviewable Economato handoff; default writes candidates, never old contexts.

--apply is reserved for the integrating parent after reviewing the candidates.
It accepts only the recorded baseline hashes, or the exact already-applied
candidate. No old preparation script is rerun and no old surface is un-clipped.
"""
from pathlib import Path
import sys,json,hashlib,copy,argparse
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_economato_context as C
import shapely
from shapely.geometry import LineString,Polygon
from shapely.ops import unary_union

sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
EXPECTED_CONTEXT='dac00377102d6300607cb5db0fcef89ad4d192f4e4c1698958689c02f2a5aca4'
EXPECTED_PLAN='53689a370453ba4265141a5a1a4ba8be07d371e7fdf308f5c02f2663fc09110a'
ALLOWED_SURFACES={'gerencia-sidewalk-5','gerencia-east-garden-3','gerencia-garden-2','gerencia-garden-3'}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');args=parser.parse_args()
    context_path=C.DATA/'gerencia-context.json';plan_path=C.DATA/'gerencia-plan.json'
    candidate_path=C.OUT/'gerencia-context-economato-transfer-candidate.json'
    plan_candidate_path=C.OUT/'gerencia-plan-economato-transfer-candidate.json'
    report_path=C.OUT/'economato-gerencia-ownership-transfer-qa.json'
    if sha(context_path)!=EXPECTED_CONTEXT:
        if candidate_path.exists() and sha(context_path)==sha(candidate_path) and plan_candidate_path.exists() and sha(plan_path)==sha(plan_candidate_path):
            print(json.dumps({'pass':True,'alreadyApplied':True}));return
        raise SystemExit('Gerencia context baseline changed; inspect the change before regenerating a candidate.')
    if sha(plan_path)!=EXPECTED_PLAN:
        raise SystemExit('Gerencia fallback-plan baseline changed; inspect the change before regenerating a candidate.')
    before_other={n:sha(C.DATA/(n+'-context.json')) for n in C.NAMES if n!='gerencia'}
    original=json.loads(context_path.read_text());plan_original=json.loads(plan_path.read_text())
    new=C.read('economato-context');handoff=unary_union([C.polygon(r) for r in new['ownershipTransfers']])
    new_ground=unary_union([C.polygon(r) for r in new['surfaces']])
    correction=C.polygon(new['frontBoundaryCorrection'])
    updated=copy.deepcopy(original);plan=copy.deepcopy(plan_original)
    changed_surfaces={};surfaces=[]
    for row in original['surfaces']:
        shape=C.polygon(row)
        if shape.intersection(handoff).area<1e-8:
            surfaces.append(copy.deepcopy(row));continue
        if row['id'] not in ALLOWED_SURFACES:raise SystemExit('Unexpected Gerencia surface in handoff: '+row['id'])
        pieces=[]
        for i,p in enumerate(C.polygons(shape.difference(handoff))):
            extras={k:v for k,v in row.items() if k not in ['id','coordinates','holes']}
            item=C.record(row['id']+('' if i==0 else '-economato-split-'+str(i)),p,**extras)
            pieces.append(item);surfaces.append(item)
        changed_surfaces[row['id']]=pieces
    updated['surfaces']=surfaces
    regions={}
    for row in surfaces:regions.setdefault(row['component'],[]).append(C.polygon(row))
    vertices,groups,triangles,paving=C.G.triangulate_regions([(k,unary_union(v)) for k,v in regions.items()])
    updated['pavementMesh']['vertices']=vertices
    updated['pavementMesh']['groups']=[{'component':k,'indices':v} for k,v in groups.items()]
    # Only the disproved continuous front segment is removed. The side and rear
    # boundary, and both existing ends of this same line, stay exact.
    fences=[];fence_changes=[]
    for row in original['fences']:
        line=LineString([C.project(p) for p in row['coordinates']])
        if line.intersection(correction).length<1e-8:
            fences.append(copy.deepcopy(row));continue
        if row['id']!='gerencia-boundary-1':raise SystemExit('Unexpected boundary intersects the front correction')
        pieces=[]
        for i,p in enumerate(C.lines(line.difference(correction))):
            extras={k:v for k,v in row.items() if k not in ['id','coordinates']}
            item=C.line_record(row['id']+('' if i==0 else '-economato-split-'+str(i)),p,**extras)
            pieces.append(item);fences.append(item)
        fence_changes.append({'id':row['id'],'removedLengthM':line.intersection(correction).length,'retainedLengthM':sum(LineString([C.project(p) for p in r['coordinates']]).length for r in pieces),'retainedIds':[r['id'] for r in pieces]})
    updated['fences']=fences
    # Preserve every untouched exclusion record byte-for-byte at JSON value
    # level. Split only intersecting polygons; holes get simple triangles for
    # the runtime's polygon-only exclusion consumer.
    mask_changes={}
    for field in ['genericStreetExclusions','vegetationExclusions']:
        rows=[];changed=0
        for row in original[field]:
            shape=C.polygon(row)
            if shape.intersection(handoff).area<1e-8:
                rows.append(copy.deepcopy(row));continue
            changed+=1;pieces=[]
            for p in C.polygons(shape.difference(handoff)):
                pieces.extend(shapely.constrained_delaunay_triangles(p).geoms if p.interiors else [p])
            extras={k:v for k,v in row.items() if k not in ['id','coordinates','holes']}
            for i,p in enumerate(pieces):
                if p.area>1e-8:rows.append(C.record(row['id']+('' if i==0 else '-economato-split-'+str(i)),p,**extras))
        updated[field]=rows;mask_changes[field]=changed
    updated['sharedContext']['economatoOwnershipV28']={'owner':'economato-context','source':'economato-context.json ownershipTransfers','surfaceIds':sorted(changed_surfaces),'note':'Immediate exterior ground only. All old buildings, source roads, garden paths, trees and furniture are preserved; the disproved continuous fence segment directly before the Economato is removed.'}
    updated['stats'].update({'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),'boundarySegments':len(fences)})
    components=[]
    for row in plan_original['components']:
        if row['id'] not in changed_surfaces:components.append(copy.deepcopy(row));continue
        for replacement in changed_surfaces[row['id']]:
            item=copy.deepcopy(row);item.update({k:replacement[k] for k in ['id','coordinates','holes']});components.append(item)
    plan['components']=components
    checks=[]
    def check(label,ok):checks.append({'label':label,'pass':bool(ok)})
    protected=['buildings','roads','paths','trees','shrubs','benches','lamps','gates','excludedBuildingIds','excludedRoadIds','collisionPolygons','foundationPatches','heightReview','coreBuildingParts','focusSpecs','districtOutline','precinctOutline','withheldBuildingParts']
    for field in protected:check(field+' preserved exactly',updated.get(field)==original.get(field))
    check('Only four reviewed surface IDs change',set(changed_surfaces)==ALLOWED_SURFACES)
    check('Every other context file remains at its current baseline',all(before_other[n]==sha(C.DATA/(n+'-context.json')) for n in before_other))
    check('Retained Gerencia ground is disjoint from Economato ground',paving.intersection(new_ground).area<.005)
    previous=unary_union([C.polygon(r) for r in original['surfaces']])
    check('No old ground outside the exact handoff is removed',previous.difference(handoff).symmetric_difference(paving).area<.02)
    check('All transferred ground is completely replaced',previous.intersection(handoff).difference(new_ground).area<.005)
    obstacles=unary_union([C.polygon(r) for r in new['architectureExclusions']])
    check('New Economato ground does not intersect building footprints or porch stairs',new_ground.intersection(obstacles).area<.005)
    check('All original surface holes survive triangulation',abs(sum(t.area for t in triangles)-paving.area)<.03)
    check('Only the front fence is changed and both ends survive',len(fence_changes)==1 and len(fence_changes[0]['retainedIds'])==2 and abs(fence_changes[0]['removedLengthM']-54.6)<.01)
    check('Casino handoff metadata stays exact',updated['sharedContext'].get('casinoOwnershipV26')==original['sharedContext'].get('casinoOwnershipV26') and updated['sharedContext'].get('casinoGarden')==original['sharedContext'].get('casinoGarden'))
    check('Fallback plan only changes reviewed ground components',[r for r in plan['components'] if r['id'].split('-economato-split-')[0] not in ALLOWED_SURFACES]==[r for r in plan_original['components'] if r['id'] not in ALLOWED_SURFACES])
    for field in plan_original:
        if field!='components':check('Fallback plan '+field+' preserved exactly',plan[field]==plan_original[field])
    for field in ['genericStreetExclusions','vegetationExclusions']:
        old_shape=unary_union([C.polygon(r) for r in original[field]])
        new_shape=unary_union([C.polygon(r) for r in updated[field]])
        check(field+' retains every external exclusion including old Casino clipping',old_shape.difference(handoff).symmetric_difference(new_shape).area<.03)
    encoded=json.dumps(updated,ensure_ascii=False,separators=(',',':'))+'\n'
    plan_encoded=json.dumps(plan,ensure_ascii=False,separators=(',',':'))+'\n'
    candidate_path.write_text(encoded);plan_candidate_path.write_text(plan_encoded)
    report={'pass':all(r['pass'] for r in checks),'apply':args.apply,'checks':checks,'beforeSHA256':{'gerencia-context.json':sha(context_path),'gerencia-plan.json':sha(plan_path)},'candidateSHA256':{'gerencia-context.json':sha(candidate_path),'gerencia-plan.json':sha(plan_candidate_path)},'transferAreaM2':round(handoff.area,2),'changedSurfaceIds':sorted(changed_surfaces),'replacementPlanComponentIds':{k:[r['id'] for r in v] for k,v in changed_surfaces.items()},'fenceCorrections':fence_changes,'changedExclusionRecords':mask_changes,'newStats':updated['stats'],'retainedContextHashes':before_other}
    report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    if not report['pass']:
        print(json.dumps(report,indent=2));raise SystemExit(1)
    if args.apply:
        context_path.write_text(encoded);plan_path.write_text(plan_encoded)
    print(json.dumps({k:report[k] for k in ['pass','apply','beforeSHA256','candidateSHA256','transferAreaM2','changedSurfaceIds','fenceCorrections','changedExclusionRecords']},indent=2))

if __name__=='__main__':main()
