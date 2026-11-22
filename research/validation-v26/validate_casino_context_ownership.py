"""Read-only V26 ground coverage and ownership check against the V25 commit."""
import json,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_casino_context as C
from shapely.ops import unary_union

baseline=json.loads(subprocess.check_output(['git','show','b069969cf43f93184d006b8ffd00b281067ac059:dist/assets/data/gerencia-context.json'],cwd=C.ROOT))
new=C.read('casino-context');gerencia=C.read('gerencia-context')
old=C.polygon(baseline['sharedContext']['casinoGarden'])
owned_ground=unary_union([C.polygon(r) for r in new['surfaces']])
stage=C.polygon(new['stage'])
owned=owned_ground.union(stage)
architecture=unary_union([C.polygon(r) for r in new['architectureExclusions']]+[C.polygon(r) for r in new['sharedContext']['buildings']])
retained=unary_union([C.polygon(r) for r in gerencia['surfaces']])
transfer=C.polygon(new['ownershipTransfer'])
uncovered=old.difference(owned.union(architecture.buffer(.101)).union(retained))
checks=[]
def check(label,value):checks.append({'label':label,'pass':bool(value)})
check('Every former Casino reserve area is covered, apart from intentional 10cm facade seams',uncovered.area<.02)
check('Transferred ground has only one terrain-surface owner',owned_ground.intersection(retained).area<.01)
check('Current Gerencia ground outside transfer equals V25',unary_union([C.polygon(r) for r in baseline['surfaces']]).difference(transfer).symmetric_difference(retained).area<.02)
for name in ['buildings','roads','trees','shrubs','benches','lamps','gates','excludedBuildingIds','excludedRoadIds','collisionPolygons','foundationPatches']:
    check('Gerencia '+name+' retained exactly',baseline.get(name)==gerencia.get(name))
report={'pass':all(c['pass'] for c in checks),'checks':checks,'oldReservedAreaM2':old.area,'uncoveredAreaAfterIntentional10cmArchitectureClearanceM2':uncovered.area,'strictUncoveredBeforeEdgeClearanceM2':old.difference(owned.union(architecture).union(retained)).area,'overlappingOwnedGroundM2':owned_ground.intersection(retained).area,'raisedStageAboveRetainedGerenciaGroundM2':stage.intersection(retained).area,'note':'The 10cm facade clearance is a deliberate seam above continuous regional terrain; no accidental landscape hole remains.'}
(C.OUT/'casino-context-old-reserve-coverage-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if not report['pass']:raise SystemExit(1)
