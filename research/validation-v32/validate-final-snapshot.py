"""Bind V32 QA, exact-mesh inspection and preservation evidence to the final source."""
from pathlib import Path
from datetime import datetime, timezone
import gzip
import hashlib
import json
root=Path(__file__).resolve().parents[2]
folder=Path(__file__).resolve().parent
checks=[]
def check(ok,label,detail=None):
    checks.append({'pass':bool(ok),'label':label,**({'detail':detail} if not ok else {})})
def digest(data):return hashlib.sha256(data).hexdigest()
def read(name):return json.loads((folder/name).read_text())
reports=['grau-model-qa.json','grau-context-qa.json','grau-context-clearance-qa.json','grau-interior-camera-qa.json','integrated-coast-qa.json','grau-map-results.json','grau-controller-results.json','pantalan-controller-results.json','legacy-visit-controller-results.json','static-assets-qa.json','previous-monuments-qa.json','render-batch-results.json','visual-review.json']
for name in reports:
    r=read(name);check(r.get('pass',False),name+' passed',r.get('errors',r.get('failures')))
for name,key in [('integrated-coast-qa.json','inputHashes'),('grau-map-results.json','inputHashes'),('grau-controller-results.json','sourceHashes'),('pantalan-controller-results.json','sourceHashes'),('legacy-visit-controller-results.json','sourceHashes'),('static-assets-qa.json','hashes')]:
    for path,expected in read(name)[key].items():
        check(digest((root/path).read_bytes())==expected,name+' uses final '+path)
clearance=read('grau-context-clearance-qa.json')
for field,path in [('contextSourceSha256','dist/js/grau-context.js'),('contextDataSha256','dist/assets/data/grau-context.json')]:
    check(clearance[field]==digest((root/path).read_bytes()),'Ground clearance uses final '+path)
check(len(clearance['penetrations'])==0 and clearance['minimumClearanceM']>0,'Final roads clear the exact rendered terrain')
terrain_export=Path(clearance['terrainExport']);terrain_export=terrain_export if terrain_export.is_absolute() else root/terrain_export
# The clearance probe stores the compressed export hash.
check(terrain_export.exists(),'Ground clearance terrain export exists')
if terrain_export.exists():
    candidates=[digest(terrain_export.read_bytes()),digest(gzip.decompress(terrain_export.read_bytes()))]
    check(clearance['terrainExportSha256'] in candidates,'Ground clearance describes final terrain export')
guide=json.loads((root/'dist/assets/data/grau-visit.json').read_text())
check(guide['modelRegistration']['status']=='registered' and not guide['modelRegistration']['provisionalCoordinates'],'All Grau stops use final registered geometry')
visual=read('visual-review.json')
for record_path in sorted(folder.glob('*-render-input.json')):
    r=json.loads(record_path.read_text());name=r['scene'];image=folder/(name+'.png')
    check(r['geometrySha256']==digest(gzip.decompress((folder/(name+'-geometry.json.gz')).read_bytes())),name+' uses final exported geometry')
    check(r['renderScriptSha256']==digest((folder/'render_grau.py').read_bytes()),name+' uses the final CPU inspection renderer')
    for path,expected in r['inputHashes'].items():check(digest((root/path).read_bytes())==expected,name+' provenance matches '+path)
    check(image.exists() and digest(image.read_bytes())==r['imageSha256'],name+' image matches render evidence')
    check(digest(image.read_bytes())==visual['imageHashes'].get(image.name),name+' was visually reviewed at this exact image hash')
for r in read('grau-map-results.json')['outputs']:
    check(digest((root/r['file']).read_bytes())==r['sha256'],'Canvas output matches '+r['file'])
limits=read('browser-limitations.json')
check(limits['browserQA']=='unverified' and limits['webglQA']=='unverified','Browser/GPU limitations remain explicit')
report={'pass':all(c['pass'] for c in checks),'generatedAtUTC':datetime.now(timezone.utc).isoformat(),'checksCount':len(checks),'checks':checks,'failures':[c for c in checks if not c['pass']]}
(folder/'final-snapshot-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['pass','checksCount','failures']},ensure_ascii=False))
raise SystemExit(0 if report['pass'] else 1)
