"""Render the exact exported V31 meshes with two CPU jobs; water is a placeholder."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import gzip
import hashlib
import json
import subprocess
import sys

folder = Path(__file__).resolve().parent
root = folder.parents[1]
scenes = [
    'pantalan-paseo-conjunto-current', 'pantalan-paseo-pergolas-current',
    'pantalan-paseo-tolva-current', 'pantalan-paseo-mirador-current',
    'pantalan-maritimo-tripodes-current', 'pantalan-maritimo-pilotes-current',
    'pantalan-maritimo-conjunto-historical', 'pantalan-maritimo-cargador-historical',
]
if len(sys.argv) > 1:
    scenes = sys.argv[1:]
full = {'pantalan-paseo-conjunto-current', 'pantalan-paseo-mirador-current',
        'pantalan-maritimo-conjunto-historical'}

def render(name):
    geometry = gzip.decompress((folder/(name+'-geometry.json.gz')).read_bytes())
    source = json.loads(geometry)
    payload = {key: value for key, value in source.items() if key != 'inputHashes'}
    payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    record_path = folder/(name+'-render-input.json')
    previous = json.loads(record_path.read_text()) if record_path.exists() else {}
    image = folder/(name+'.png')
    script_hash = hashlib.sha256((folder/'render_pantalan.py').read_bytes()).hexdigest()
    reuse = (previous.get('scenePayloadSha256') == payload_hash
             and previous.get('renderScriptSha256') == script_hash
             and previous.get('samples') == 32
             and previous.get('dimensions') == ([1440, 1080] if name in full else [960, 720])
             and image.exists()
             and previous.get('imageSha256') == hashlib.sha256(image.read_bytes()).hexdigest())
    record = {
        'scene': name,
        'geometrySha256': hashlib.sha256(geometry).hexdigest(),
        'scenePayloadSha256': payload_hash,
        'inputHashes': source['inputHashes'],
        'renderScriptSha256': script_hash,
        'samples': 32,
        'dimensions': [1440, 1080] if name in full else [960, 720],
        'recordedAtUTC': datetime.now(timezone.utc).isoformat(),
        'method': 'Exact-mesh CPU inspection, not a browser screenshot. Lighting is approximate. Water uses a flat inspection material; actual GLSL is validated separately.',
    }
    if reuse:
        record.update({'reusedExactScene': True, 'previousSourceHashes': previous['inputHashes'],
                       'reuseReason': 'All exported geometry, camera, material and texture references are byte-equivalent after canonicalization; only source provenance changed.',
                       'imageSha256': previous['imageSha256']})
        record_path.write_text(json.dumps(record, indent=2)+'\n')
        result = {'scene': name, 'exitCode': 0, 'imageExists': True,
                  'imageSha256': previous['imageSha256'], 'reusedExactScene': True}
        print(json.dumps(result), flush=True)
        return result
    record_path.write_text(json.dumps(record, indent=2)+'\n')
    command = ['blender', '-b', '-t', '4', '--python', str(folder/'render_pantalan.py'),
               '--', '--scene', name, '--samples', '32']
    if name not in full:
        command.append('--draft')
    with (folder/(name+'-render.log')).open('w') as log:
        result = subprocess.run(command, cwd=root, stdout=log, stderr=subprocess.STDOUT)
    record['imageSha256'] = hashlib.sha256(image.read_bytes()).hexdigest() if image.exists() else None
    record_path.write_text(json.dumps(record, indent=2)+'\n')
    record = {'scene': name, 'exitCode': result.returncode, 'imageExists': image.exists(),
              'imageSha256': hashlib.sha256(image.read_bytes()).hexdigest() if image.exists() else None}
    print(json.dumps(record), flush=True)
    return record

with ThreadPoolExecutor(max_workers=2) as executor:
    results = [task.result() for task in as_completed([executor.submit(render, name) for name in scenes])]
report = {'generatedAtUTC': datetime.now(timezone.utc).isoformat(),
          'pass': all(r['exitCode'] == 0 and r['imageExists'] for r in results),
          'results': results, 'visualReviewPending': True}
(folder/'render-batch-results.json').write_text(json.dumps(report, indent=2)+'\n')
if not report['pass']:
    raise SystemExit(1)
