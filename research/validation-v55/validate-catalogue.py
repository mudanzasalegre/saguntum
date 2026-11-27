"""Keep the 22-stop Castle itinerary and every other monument unchanged."""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2]
baseline=json.loads((Path(__file__).parent/'catalogue-baseline.json').read_text())
guide=json.loads((root/'dist/assets/data/castle-visit.json').read_text())
checks=[]
def check(ok,label,detail=None):
    checks.append({'pass':bool(ok),'label':label,**({'detail':detail}if detail is not None else{})})
check([s['id']for s in guide['stops']]==baseline['castleStopIds'],'All 22 Castle stop IDs and their order are preserved')
check([s['id']for s in guide['regions']]==baseline['castleRegionIds'],'All seven Castle regions retain their IDs and order')
check(len(guide['stops'])==22 and len({s['id']for s in guide['stops']})==22,'Exactly 22 unique Castle stops')
for spec in baseline['files']:
    data=json.loads((root/spec['file']).read_text())
    other={k:v for k,v in data.items()if k!='castle'}
    digest=hashlib.sha256(json.dumps(other,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    check(len(other)==32 and digest==spec['otherMonumentsSha256'],'Every other monument is unchanged: '+spec['file'],{'otherMonuments':len(other),'sha256':digest})
    if spec['file'].endswith('visit-stops.json'):
        check([s['id']for s in data['castle']['stops']]==baseline['castleStopIds'],'Simulator Castle stop IDs/order match the guide')
        check([s['title']for s in data['castle']['stops']]==[s['title']for s in guide['stops']],'Simulator Castle titles match the updated guide')
    if spec['file'].endswith('visit-cameras.json'):
        check(list(data['castle'])==baseline['castleStopIds'],'The camera index retains all 22 Castle stops in itinerary order')
report={'pass':all(c['pass']for c in checks),'method':'v54 catalogue baseline vs v55 guide/territory indexes; exact semantic hashes outside Castle','places':33,'castleStops':22,'castleRegions':7,'checks':checks}
(Path(__file__).parent/'catalogue-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
if not report['pass']:raise SystemExit(1)
