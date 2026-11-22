"""Validate the documentary references and the final spatial registration."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json

out=Path(__file__).resolve().parent
root=out.parents[1]
data=root/'dist/assets/data'
v=json.loads((data/'casino-visit.json').read_text())
p=json.loads((data/'casino-plan.json').read_text())
refs=json.loads((out/'downloaded-references.json').read_text())
sources={s['id'] for s in v['sources']}
regions={s['id'] for s in v['regions']}
facts=[f for s in v['stops'] for f in s['facts']]
registered={s['id']:s for s in p['stops']}
interiors=[s for s in v['stops'] if s.get('interiorView')]
referenced=[]
for row in [*v['stops'],*facts,*v['timeline']]:
    referenced.extend(row.get('sourceIds',[]))
    referenced.extend(row.get('coordinateSourceIds',[]))
terrace=next(s for s in v['stops'] if s['id']=='casino-terraza')
text=json.dumps(terrace,ensure_ascii=False)
checks={
 'unique20Stops':len(v['stops'])==len({s['id'] for s in v['stops']})==20,
 'facts40':len(facts)==40,
 'sources17':len(v['sources'])==len(sources)==17,
 'regions5':len(v['regions'])==len(regions)==5,
 'allCitationsResolve':all(r in sources for r in referenced) and all(f.get('sourceIds') for f in facts),
 'timeline10':len(v['timeline'])==10,
 'regionCoverage':{s['regionId'] for s in v['stops']}==regions,
 'explicitInteriorFloors':all(s.get('floor') in [0,1] and s.get('buildingId')=='casino-main' for s in interiors),
 'interiorViews7':len(interiors)==7,
 'terraceDiscrepancyExplicit':all(t in text for t in ['1968','1969','CONTRAST']),
 'referencesOutsideDist':all((out/r['file']).exists() and not (root/'dist'/r['file']).exists() for r in refs if 'error' not in r),
 'registrationFinal':v.get('modelRegistration',{}).get('status')=='registered' and v['modelRegistration'].get('provisionalCoordinates') is False,
 'guidePlanCoordinatesAgree':len(registered)==len(v['stops']) and all(s['id'] in registered and max(abs(a-b) for a,b in zip(s['coordinate'],registered[s['id']]['coordinates']))<1e-7 for s in v['stops']),
 'visibleStatusInIntroduction':'interpreta espacios históricos' in v['introduction'] and 'octubre de 2026' in v['introduction']
}
report={
 'date':datetime.now(timezone.utc).date().isoformat(),'generatedAt':datetime.now(timezone.utc).isoformat(),
 'pass':all(checks.values()),'checks':checks,
 'counts':{'stops':len(v['stops']),'facts':len(facts),'sources':len(sources),'regions':len(regions),'timeline':len(v['timeline']),'downloadedReferenceImages':sum('error' not in r for r in refs),'failedImageDownloads':sum('error' in r for r in refs)},
 'failedDownloads':[r for r in refs if 'error' in r],
 'registrationAtTimeOfValidation':v['modelRegistration'],
 'inputHashes':{n:hashlib.sha256((data/n).read_bytes()).hexdigest() for n in ['casino-visit.json','casino-plan.json']},
 'limitation':'Reference identifiers and documentary data are checked here; source interpretation was reviewed separately. Geometry, cameras and browser behavior have separate checks.'
}
(out/'casino-documentary-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':report['pass'],'checks':len(checks),'failed':[k for k,v in checks.items() if not v],'counts':report['counts']},ensure_ascii=False))
if not report['pass']:raise SystemExit(1)
