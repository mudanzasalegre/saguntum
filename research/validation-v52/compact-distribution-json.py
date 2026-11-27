"""Remove JSON whitespace without changing strings, numeric literals or order.

Run after regenerating Forum resources and before packaging the static Site.
The report records equivalence with the files used for the CPU renders.
"""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
FILES = [
    'dist/assets/data/forum-plaza-context.json',
    'dist/assets/data/forum-plaza-plan.json',
    'dist/assets/data/forum-plaza-visit.json',
    'dist/assets/data/circo-context.json',
]

def sha(data):
    return hashlib.sha256(data).hexdigest()

records = []
for name in FILES:
    path = ROOT / name
    original = path.read_bytes()
    compact = bytearray()
    quoted = escaped = False
    for char in original:
        if quoted:
            compact.append(char)
            if escaped:
                escaped = False
            elif char == 92:
                escaped = True
            elif char == 34:
                quoted = False
        elif char == 34:
            quoted = True
            compact.append(char)
        elif char not in (9, 10, 13, 32):
            compact.append(char)
    assert not quoted
    compact = bytes(compact) + b'\n'
    before, after = json.loads(original), json.loads(compact)
    assert before == after, name
    canonical = json.dumps(before, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
    records.append({
        'path': name,
        'beforeBytes': len(original), 'afterBytes': len(compact),
        'beforeSha256': sha(original), 'afterSha256': sha(compact),
        'canonicalJsonSha256': sha(canonical), 'parsedValuesEqual': True,
    })
    path.write_bytes(compact)

report_path = ROOT / 'research/validation-v52/distribution-json-equivalence.json'
saved = sum(r['beforeBytes'] - r['afterBytes'] for r in records)
if saved or not report_path.exists():
    report_path.write_text(json.dumps({
        'method': 'Whitespace removal outside JSON strings only; original key order, string contents and numeric literals preserved.',
        'purpose': 'Fit the Sites 256 MiB expanded TAR limit without changing geometry, cartography or visits.',
        'savedBytes': saved, 'files': records,
    }, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'savedBytes': saved, 'files': len(records)}))
