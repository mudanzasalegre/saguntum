"""Join INSPIRE Building.dateOfConstruction to the existing fabric sectors in place.

Use the same cached, unmodified municipal ZIP as research/territory/prepare.py.
The result is reproducible without network access or additional runtime requests.
"""
import argparse
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path
import re
import tempfile
from xml.etree import ElementTree as ET
from zipfile import ZipFile


def construction_years(archive):
    years = {}
    with ZipFile(archive) as source, source.open('A.ES.SDGC.BU.46222.building.gml') as gml:
        for _, elem in ET.iterparse(gml, events=('end',)):
            if not elem.tag.endswith('}Building'):
                continue
            key = elem.findtext('.//{*}localId')
            date = elem.findtext('.//{*}dateOfConstruction/{*}DateOfEvent/{*}beginning') or ''
            year = re.match(r'^(\d{4})-', date)
            if key and year and 1000 <= int(year[1]) <= 2099:
                years[key] = int(year[1])
            elem.clear()
    return years


def attach(archive, fabric):
    years = construction_years(archive)
    matched, parents = Counter(), set()
    total = 0
    for tile in sorted(fabric.glob('*.bin')):
        data = json.loads(gzip.decompress(tile.read_bytes()))
        for records in data.values():
            for record in records:
                total += 1
                key = record[0].removeprefix('cat-').partition('_part')[0]
                if key in years:
                    year = years[key]
                    if len(record) > 4:
                        record[4] = year
                    else:
                        record.append(year)
                    parents.add(key)
                    matched[year] += 1
                elif len(record) > 4:
                    record[4] = None
        raw = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()
        tile.write_bytes(gzip.compress(raw, compresslevel=9, mtime=0))
    print(f'{sum(matched.values())}/{total} parts; {len(parents)} parent buildings; {min(matched)}–{max(matched)}.')
    manifest_path = fabric/'manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    manifest['constructionEpoch'] = {
        'field': 'INSPIRE Building.dateOfConstruction.DateOfEvent.beginning (year)',
        'source': 'Dirección General del Catastro, Buildings 46222 Sagunto/Sagunt',
        'url': 'https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip',
        'license': 'https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf',
        'sourceSha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
        'matchedParts': sum(matched.values()), 'parents': len(parents), 'totalParts': total,
        'limitations': 'Año declarado del edificio padre. La fachada actual y las reformas carecen de inventario individual.'
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf8')
    print({label: sum(n for y, n in matched.items() if lo <= y < hi)
           for label, lo, hi in [('before 1940',1000,1940),('1940–1979',1940,1980),('1980 onwards',1980,2100)]})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, default=Path(tempfile.gettempdir())/'saguntum-territory-cache/cadastral.zip')
    parser.add_argument('--fabric', type=Path, default=Path(__file__).resolve().parents[1]/'dist/assets/territory/building-fabric')
    args = parser.parse_args()
    attach(args.archive, args.fabric)
