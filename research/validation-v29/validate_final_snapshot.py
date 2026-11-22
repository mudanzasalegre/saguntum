"""Require final QA to describe the exact source and meshes being published."""
from pathlib import Path
from datetime import datetime,timezone
import gzip,hashlib,json

root=Path(__file__).resolve().parents[2]
folder=Path(__file__).resolve().parent
checks=[]
def check(ok,label,detail=None):checks.append({'pass':bool(ok),'label':label,**({'detail':detail}if not ok else{})})
def digest(data):return hashlib.sha256(data).hexdigest()
def read(name):return json.loads((folder/name).read_text())

for name in ['barrio-model-qa.json','barrio-ground-edge-probe.json','barrio-context-model-qa.json','barrio-editorial-audit.json','barrio-map-qa.json','integrated-scene-qa.json','visit-controller-results.json','static-assets-qa.json','previous-monuments-qa.json','render-batch-results.json','visual-review.json']:
    report=read(name)
    check(report.get('pass',report.get('passed',False)),name+' reports success',report.get('errors',report.get('failures')))

for name,key in [('integrated-scene-qa.json','inputHashes'),('barrio-map-qa.json','inputHashes'),('static-assets-qa.json','hashes')]:
    report=read(name)
    for relative,expected in report[key].items():
        check(digest((root/relative).read_bytes())==expected,name+' uses current '+relative)
check(read('barrio-ground-edge-probe.json')['sourceHash']==digest((root/'dist/js/barrio.js').read_bytes()),'Physical garden and gate checks use the final architectural model')

scenes=['barrio-conjunto','barrio-hileras','barrio-sala','barrio-cocina','barrio-planta-alta','barrio-calles','barrio-seccion']
for scene in scenes:
    record=read(scene+'-render-input.json')
    check(record['geometrySha256']==digest(gzip.decompress((folder/(scene+'-geometry.json.gz')).read_bytes())),scene+' render uses current exact geometry export')
    check(record['renderScriptSha256']==digest((folder/'render_barrio.py').read_bytes()),scene+' render uses the final renderer')
    check((folder/(scene+'.png')).is_file(),scene+' inspection image is available')

limits=read('browser-limitations.json')
check(limits['browserQA']=='unverified' and limits['webglQA']=='unverified','Browser and GPU limitations remain explicit')
report={'pass':all(c['pass']for c in checks),'generatedAtUTC':datetime.now(timezone.utc).isoformat(),'checks':checks,'failures':[c for c in checks if not c['pass']]}
(folder/'final-snapshot-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':report['pass'],'checks':len(checks),'failures':report['failures']},ensure_ascii=False))
raise SystemExit(0 if report['pass']else 1)
