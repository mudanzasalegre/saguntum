"""Render a fixed set of Begoña inspection views, two CPU processes at a time."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import json
import subprocess
import sys

folder = Path(__file__).resolve().parent
root = folder.parents[1]
scenes = ['begona-conjunto', 'begona-fachada', 'begona-nave', 'begona-presbiterio', 'begona-coro', 'begona-alameda', 'begona-seccion']
if len(sys.argv) > 1:
    scenes = sys.argv[1:]
full = {'begona-conjunto', 'begona-fachada', 'begona-seccion'}

def render(scene):
    args = [scene, '--samples', '32']
    if scene not in full:
        args.append('--draft')
    subprocess.run([sys.executable, str(folder/'record_render_input.py'), *args], cwd=root, check=True)
    cmd = ['blender', '-b', '-t', '4', '--python', str(folder/'render_begona.py'), '--', '--scene', scene, '--samples', '32']
    if scene not in full:
        cmd.append('--draft')
    with (folder/(scene+'-render.log')).open('w') as log:
        result = subprocess.run(cmd, cwd=root, stdout=log, stderr=subprocess.STDOUT)
    record = {'scene':scene, 'exitCode':result.returncode, 'imageExists':(folder/(scene+'.png')).exists()}
    print(json.dumps(record), flush=True)
    return record

with ThreadPoolExecutor(max_workers=2) as executor:
    results = [f.result() for f in as_completed([executor.submit(render, scene) for scene in scenes])]
report = {'generatedAtUTC':datetime.now(timezone.utc).isoformat(), 'pass':all(r['exitCode']==0 and r['imageExists'] for r in results), 'results':results, 'visualReviewPending':True}
(folder/'render-batch-results.json').write_text(json.dumps(report, indent=2)+'\n')
if not report['pass']:
    raise SystemExit(1)
