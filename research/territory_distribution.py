"""Prepare the static distribution without altering model or picture quality."""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'dist/assets/territory'
ORIGINALS = ROOT / 'research/territory/originales'

def original_photo(name):
    fresh = PUBLIC / name
    return fresh if fresh.exists() else ORIGINALS / name

def prepare_distribution():
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    manifest = PUBLIC / 'world.json'
    world = json.loads(manifest.read_bytes())
    for grid, name, photo in [(world['terrain'], 'ortho.jpg', 'territory'),
                              (world['terrain']['detail'], 'ortho-core.jpg', 'core')]:
        name_in_viewer = f'landscape/{photo}.jpg'
        assert (PUBLIC / name_in_viewer).is_file()
        grid['texture'] = name_in_viewer
        new_original = PUBLIC / name
        if new_original.exists():
            saved = ORIGINALS / name
            shutil.copyfile(new_original, saved)
            assert saved.read_bytes() == new_original.read_bytes()
            new_original.unlink()
    manifest.write_bytes(json.dumps(world, ensure_ascii=False, separators=(',', ':')).encode())
    # Keep every source string and numeric token verbatim, including survey precision.
    pattern = re.compile(r'"(?:\\.|[^"\\])*"|\s+')
    for name in ['barrio-plan','portic-context','juderia-context','sanatorio-plan','calvario-context','circo-context']:
        path = ROOT / f'dist/assets/data/{name}.json'
        text = path.read_text(encoding='utf-8')
        compact = pattern.sub(lambda m: m[0] if m[0].startswith('"') else '', text)
        assert json.loads(text) == json.loads(compact)
        path.write_bytes(compact.encode('utf-8'))

if __name__ == '__main__':
    prepare_distribution()
