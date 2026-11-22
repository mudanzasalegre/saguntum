"""Check guide evidence, agreed stop contract and (optionally) final registration."""
from pathlib import Path
import argparse
import hashlib
import json
import math

parser = argparse.ArgumentParser()
parser.add_argument('--require-registration', action='store_true')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / 'dist/assets/data/barrio-visit.json'
guide = json.loads(PATH.read_text())
checks = []


def check(ok, label, detail=None):
    checks.append(dict(passed=bool(ok), label=label, **({'detail': detail} if not ok else {})))


stops = guide.get('stops', [])
ids = [item['id'] for item in stops]
expected = {'barrio-' + key for key in [
    'conjunto', 'trazado', 'hileras', 'vivienda-baja', 'vivienda-esquina',
    'jardin', 'sala', 'cocina', 'dormitorios', 'corral', 'planta-alta',
    'cubiertas', 'carpinterias', 'transformaciones', 'seccion', 'accesos',
    'calles', 'arbolado', 'frente-urbano', 'ciudad-factoria'
]}
by_id = {item['id']: item for item in stops}
sources = guide.get('sources', [])
source_ids = {item['id'] for item in sources}
layers = {item['id'] for item in guide.get('readingLegend', [])}
regions = {item['id']: item for item in guide.get('regions', [])}
facts = [fact for item in stops for fact in item.get('facts', [])]

check(len(ids) == 20 and len(set(ids)) == 20 and set(ids) == expected,
      'Twenty unique stops match the shared model/context contract')
check(len(facts) == 40, 'Forty concise facts are present')
check(guide.get('id') == 'barrio-obrero', 'Catalog identity remains barrio-obrero')
check(layers == {'edificio', 'espacios', 'construccion', 'memoria', 'entorno'} and set(regions) == layers,
      'Five reading layers and regions agree')
check(len(source_ids) == len(sources) and all(item.get('url', '').startswith('https://') for item in sources),
      'Sources have unique identifiers and public HTTPS references')
check(all(item.get('locator') and item.get('author') and item.get('accessed') for item in sources),
      'Sources have locators, attribution and access date')

references = []


def inspect(value, path='guide'):
    if isinstance(value, dict):
        for key, child in value.items():
            if key in ('sourceIds', 'coordinateSourceIds'):
                references.extend((path + '.' + key, source_id) for source_id in child)
            inspect(child, path + '.' + key)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            inspect(child, f'{path}[{index}]')


inspect(guide)
unknown = [(path, id) for path, id in references if id not in source_ids]
check(not unknown, 'Every documentary and coordinate source reference resolves', unknown)
check(all(item.get('sourceIds') and item.get('confidence') in {'documented', 'interpretive', 'disputed'} for item in facts),
      'Every fact has evidence and an explicit confidence level')
check(all(item.get('readingLayer') == item.get('regionId') in layers for item in stops),
      'Each stop belongs to its declared reading layer')
check(all(set(region['stopIds']) == {item['id'] for item in stops if item['regionId'] == region_id}
          for region_id, region in regions.items()),
      'Region membership matches the stop list')
check(all(item.get('stopId') in by_id for item in guide.get('timeline', [])),
      'Timeline links target existing stops')
check([item.get('order') for item in stops] == list(range(1, 21)),
      'Reading sequence is complete and stable')

for key in ('sala', 'cocina', 'dormitorios'):
    item = by_id['barrio-' + key]
    check(item.get('buildingId') == 'barrio-casa-baja' and item.get('floor') == 0 and item.get('interiorView') is True,
          f'{key}: low-house ground-floor association is explicit')
item = by_id['barrio-planta-alta']
check(item.get('buildingId') == 'barrio-casa-alta' and item.get('floor') == 1 and item.get('interiorView') is True,
      'Upper dwelling belongs to the second house and first floor')
item = by_id['barrio-seccion']
check(item.get('buildingId') == 'barrio-casa-baja' and item.get('floor') == 0 and item.get('requiresSection') is True,
      'Section is attached to the representative low house')
check(all(by_id['barrio-' + key]['confidence'] == 'interpretive' for key in ('sala', 'cocina', 'dormitorios', 'planta-alta', 'seccion')),
      'Interior uses and digital section are explicitly interpretive')
check('privado actual' in guide.get('sectionNote', '').lower(),
      'Section explanation distinguishes historical types from current private interiors')
check('plaza de la Independencia' in by_id['barrio-trazado']['modelNote'],
      'Historic square is not conflated with Plaza de la Independencia')
check('efímeras' in by_id['barrio-calles']['modelNote'],
      'Street-painting tradition is not presented as a permanent invented mural')
check(all(item.get('coordinateConfidence') == 'approximate' for item in stops),
      'Observation coordinates retain approximate precision')

registration = guide.get('modelRegistration', {})
registered = registration.get('status') == 'registered' and registration.get('provisionalCoordinates') is False
if args.require_registration or registered:
    check(registered, 'Final model registration is complete')
    def finite_numbers(values, length):
        return isinstance(values, list) and len(values) == length and all(isinstance(n, (float, int)) and math.isfinite(n) for n in values)
    check(all(finite_numbers(item.get('coordinate'), 2) and item.get('coordinate') == item.get('coordinates') for item in stops),
          'Registered coordinates are finite and aliases agree')
    check(all(finite_numbers(item.get('localTarget'), 3) for item in stops),
          'Every registered focus has a finite local scene target')
    check(len({tuple(item['coordinate']) for item in stops}) > 10,
          'Final focuses are distinct rather than a shared provisional origin')
    check(all('provisional' not in item.get('coordinateMethod', '').lower() for item in stops),
          'Final coordinate descriptions do not retain provisional text')

report = dict(
    iteration='V29', guide='dist/assets/data/barrio-visit.json',
    sha256=hashlib.sha256(PATH.read_bytes()).hexdigest(),
    passed=all(item['passed'] for item in checks), checks=checks,
    counts=dict(stops=len(stops), facts=len(facts), sources=len(sources), timelineEvents=len(guide.get('timeline', [])), layers=len(layers)),
    registration=registration,
    publicationReady=registered and all(item['passed'] for item in checks),
    note='Documentary checks do not replace the model, map and visual integration reviews.'
)
destination = ROOT / 'research/validation-v29/barrio-editorial-audit.json'
destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ('passed', 'counts', 'publicationReady')}, ensure_ascii=False))
if not report['passed']:
    raise SystemExit(1)
