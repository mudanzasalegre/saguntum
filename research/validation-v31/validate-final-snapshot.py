"""Check that V31 evidence describes the exact source and images being published."""
from pathlib import Path
from datetime import datetime, timezone
import gzip
import hashlib
import json

root = Path(__file__).resolve().parents[2]
folder = Path(__file__).resolve().parent
checks = []

def check(ok, label, detail=None):
    checks.append({'pass': bool(ok), 'label': label, **({'detail': detail} if not ok else {})})

def digest(data):
    return hashlib.sha256(data).hexdigest()

def read(name):
    return json.loads((folder/name).read_text())

reports = [
    'pantalan-model-results.json', 'pantalan-context-results.json',
    'integrated-coast-qa.json', 'pantalan-map-qa.json',
    'pantalan-controller-results.json', 'legacy-visit-controller-results.json',
    'pantalan-layer-results.json', 'pantalan-profile-results.json',
    'water-checks.json', 'water-shader-diagnostic.json',
    'static-assets-qa.json', 'previous-monuments-qa.json',
    'render-batch-results.json', 'visual-review.json',
]
for name in reports:
    report = read(name)
    check(report.get('pass', report.get('passed', False)), name+' reports success',
          report.get('errors', report.get('failures')))

for name, key in [
    ('integrated-coast-qa.json', 'inputHashes'),
    ('pantalan-map-qa.json', 'inputHashes'),
    ('pantalan-controller-results.json', 'sourceHashes'),
    ('pantalan-layer-results.json', 'sourceHashes'),
    ('pantalan-profile-results.json', 'sourceHashes'),
    ('water-shader-input.json', 'sourceHashes'),
    ('static-assets-qa.json', 'hashes'),
]:
    for relative, expected in read(name)[key].items():
        check(digest((root/relative).read_bytes()) == expected,
              name+' uses current '+relative)

for report, module in [('pantalan-model-results.json', 'coast-pier.js'),
                       ('pantalan-context-results.json', 'pantalan-context.js')]:
    check(read(report)['sourceSHA256'] == digest((root/'dist/js'/module).read_bytes()),
          report+' uses the final model')

for name in ['pantalan-paseo', 'pantalan-maritimo']:
    guide = json.loads((root/'dist/assets/data'/(name+'-visit.json')).read_text())
    check(guide['modelRegistration']['status'] == 'registered' and
          guide['modelRegistration']['provisionalCoordinates'] is False,
          name+' guide uses registered final focuses')

scenes = [
    'pantalan-paseo-conjunto-current', 'pantalan-paseo-pergolas-current',
    'pantalan-paseo-tolva-current', 'pantalan-paseo-mirador-current',
    'pantalan-maritimo-tripodes-current', 'pantalan-maritimo-pilotes-current',
    'pantalan-maritimo-conjunto-historical', 'pantalan-maritimo-cargador-historical',
]
visual = read('visual-review.json')
for name in scenes:
    record = read(name+'-render-input.json')
    check(record['geometrySha256'] == digest(gzip.decompress(
        (folder/(name+'-geometry.json.gz')).read_bytes())),
        name+' render uses current exact geometry export')
    check(record['renderScriptSha256'] == digest((folder/'render_pantalan.py').read_bytes()),
          name+' render uses the final inspection renderer')
    for relative, expected in record['inputHashes'].items():
        check(digest((root/relative).read_bytes()) == expected,
              name+' render uses current '+relative)
    check(digest((folder/(name+'.png')).read_bytes()) == visual['imageHashes'].get(name+'.png'),
          name+' visual review describes the current image')

check(digest((folder/'water-shader-diagnostic.png').read_bytes()) ==
      visual['imageHashes'].get('water-shader-diagnostic.png'),
      'Water visual review describes the final actual GLSL diagnostic')
limits = read('browser-limitations.json')
check(limits['browserQA'] == 'unverified' and limits['webglQA'] == 'unverified',
      'Browser integration and GPU limitations remain explicit')
report = {'pass': all(c['pass'] for c in checks),
          'generatedAtUTC': datetime.now(timezone.utc).isoformat(),
          'checks': checks, 'failures': [c for c in checks if not c['pass']]}
(folder/'final-snapshot-qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'pass': report['pass'], 'checks': len(checks),
                  'failures': report['failures']}, ensure_ascii=False))
raise SystemExit(0 if report['pass'] else 1)
