"""Record the exact exported geometry used by one CPU inspection render."""
import argparse
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('scene')
parser.add_argument('--samples', type=int, required=True)
parser.add_argument('--draft', action='store_true')
args = parser.parse_args()
folder = Path(__file__).resolve().parent
source = folder / (args.scene + '-geometry.json.gz')
record = {
    'scene': args.scene,
    'geometrySha256': hashlib.sha256(gzip.decompress(source.read_bytes())).hexdigest(),
    'renderScriptSha256': hashlib.sha256((folder / 'render_casino.py').read_bytes()).hexdigest(),
    'samples': args.samples,
    'dimensions': [960, 720] if args.draft else [1440, 1080],
    'recordedAtUTC': datetime.now(timezone.utc).isoformat(),
    'method': 'Exact-mesh CPU inspection; illumination approximates the application; not a browser screenshot.'
}
(folder / (args.scene + '-render-input.json')).write_text(json.dumps(record, indent=2) + '\n')
