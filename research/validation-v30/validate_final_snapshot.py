"""Require final V30 QA to describe the exact source and meshes being published."""
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
    return json.loads((folder / name).read_text())

reports = [
    'sanatorio-model-qa.json', 'sanatorio-context-model-qa.json',
    'sanatorio-editorial-audit.json', 'sanatorio-map-qa.json',
    'integrated-scene-qa.json', 'visit-controller-results.json',
    'static-assets-qa.json', 'previous-monuments-qa.json',
    'render-batch-results.json', 'visual-review.json',
]
for name in reports:
    report = read(name)
    check(report.get('pass', report.get('passed', False)), name + ' reports success',
          report.get('errors', report.get('failures')))

for name, key in [('integrated-scene-qa.json', 'inputHashes'),
                  ('sanatorio-map-qa.json', 'inputHashes'),
                  ('static-assets-qa.json', 'hashes')]:
    for relative, expected in read(name)[key].items():
        check(digest((root / relative).read_bytes()) == expected,
              name + ' uses current ' + relative)

check(read('sanatorio-model-qa.json')['sourceHash'] == digest(
    (root / 'dist/js/sanatorio.js').read_bytes()),
    'Architectural, interior and garden checks use the final model')

visit = json.loads((root / 'dist/assets/data/sanatorio-visit.json').read_text())
check(visit['modelRegistration']['status'] == 'registered'
      and visit['modelRegistration']['provisionalCoordinates'] is False,
      'The published Sanatorio guide uses the final registered focuses')
check(read('sanatorio-editorial-audit.json').get('publicationReady') is True,
      'Editorial audit accepts final geometry registration')

scenes = ['sanatorio-conjunto', 'sanatorio-fachada', 'sanatorio-jardin-occidental',
          'sanatorio-chalets', 'sanatorio-vestibulo', 'sanatorio-capilla',
          'sanatorio-escalera', 'sanatorio-seccion']
visual = read('visual-review.json')
for scene in scenes:
    record = read(scene + '-render-input.json')
    check(record['geometrySha256'] == digest(gzip.decompress(
        (folder / (scene + '-geometry.json.gz')).read_bytes())),
        scene + ' render uses current exact geometry export')
    check(record['renderScriptSha256'] == digest((folder / 'render_sanatorio.py').read_bytes()),
          scene + ' render uses the final renderer')
    check((folder / (scene + '.png')).is_file(), scene + ' inspection image is available')
    check(digest((folder / (scene + '.png')).read_bytes()) == visual['imageHashes'].get(scene + '.png'),
          scene + ' visual review describes the current image')

limits = read('browser-limitations.json')
check(limits['browserQA'] == 'unverified' and limits['webglQA'] == 'unverified',
      'Browser and GPU limitations remain explicit')
report = {'pass': all(c['pass'] for c in checks),
          'generatedAtUTC': datetime.now(timezone.utc).isoformat(),
          'checks': checks, 'failures': [c for c in checks if not c['pass']]}
(folder / 'final-snapshot-qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'pass': report['pass'], 'checks': len(checks),
                  'failures': report['failures']}, ensure_ascii=False))
raise SystemExit(0 if report['pass'] else 1)
