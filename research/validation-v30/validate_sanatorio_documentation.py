"""Validate source references, historical interpretation and scene contracts."""
from pathlib import Path
import argparse
import hashlib
import json
import math

parser = argparse.ArgumentParser()
parser.add_argument('--require-registration', action='store_true')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / 'dist/assets/data/sanatorio-visit.json'
guide = json.loads(PATH.read_text())
checks = []


def check(ok, label, detail=None):
    checks.append(dict(passed=bool(ok), label=label, **({'detail': detail} if not ok else {})))


expected = {'sanatorio-' + key for key in [
    'conjunto', 'fachada', 'portico', 'accesos', 'vestibulo', 'capilla',
    'sacristia', 'escalera', 'terraza', 'cubiertas', 'jardin-occidental',
    'fuente', 'jardin-oriental', 'pabellones', 'chalets', 'accesos-urbanos',
    'hispanidad', 'fleming', 'frente-urbano', 'ciudad-factoria', 'seccion',
]}
stops = guide.get('stops', [])
ids = [item['id'] for item in stops]
by_id = {item['id']: item for item in stops}
sources = guide.get('sources', [])
source_ids = {item['id'] for item in sources}
facts = [fact for stop in stops for fact in stop.get('facts', [])]
layers = {item['id'] for item in guide.get('readingLegend', [])}
regions = {item['id']: item for item in guide.get('regions', [])}

check(len(ids) == len(set(ids)) == 21 and set(ids) == expected,
      'Twenty-one unique stops match the architecture/context contract')
check(len(facts) == 42 and all(len(item.get('facts', [])) == 2 for item in stops),
      'Every stop carries two source-backed facts')
check(guide.get('id') == 'sanatorio', 'Guide identity matches the existing Sanatorio record')
check(layers == {'edificio', 'espacios', 'construccion', 'memoria', 'entorno'} and set(regions) == layers,
      'Five reading layers and regions agree')
check(len(source_ids) == len(sources) and all(s.get('url', '').startswith('https://') for s in sources),
      'Documentary sources have unique identifiers and public HTTPS references')
check(all(s.get('locator') and s.get('author') and s.get('accessed') for s in sources),
      'Sources include attribution, locator and access date')

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
check(not unknown, 'Every fact, coordinate and timeline source reference resolves', unknown)
check(all(f.get('sourceIds') and f.get('confidence') in {'documented', 'interpretive', 'disputed'} for f in facts),
      'Every factual statement has a confidence level and explicit sources')
check(all(item.get('readingLayer') == item.get('regionId') in layers for item in stops),
      'Stop layer metadata is internally consistent')
check(all(set(region['stopIds']) == {item['id'] for item in stops if item['regionId'] == region_id}
          for region_id, region in regions.items()),
      'Region membership follows actual stop assignments')
check(all(item.get('stopId') in by_id for item in guide.get('timeline', [])),
      'All timeline links target available stops')
check([item.get('order') for item in stops] == list(range(1, 22)),
      'Reading order is complete and stable')

for key in ('vestibulo', 'capilla', 'sacristia', 'escalera'):
    item = by_id.get('sanatorio-' + key, {})
    check(item.get('buildingId') == 'sanatorio-principal' and item.get('floor') == 0
          and item.get('interiorView') is True and item.get('requiresSection') is False
          and item.get('mapScope') == 'interior' and item.get('confidence') == 'interpretive',
          f'{key}: historical interior is attached to the central ground-floor fragment')
section = by_id.get('sanatorio-seccion', {})
check(section.get('buildingId') == 'sanatorio-principal' and section.get('floor') == 0
      and section.get('requiresSection') is True and section.get('interiorView') is False
      and section.get('readingLayer') == 'construccion',
      'Section opens an aerial historical ground-floor reading, not a room interior')
check(guide.get('sectionOnOverview') is False,
      'Overview preserves the closed current exterior until the section is selected')
check('distribución actual' in guide.get('sectionNote', '') and 'sin escala legible' in guide.get('sectionNote', ''),
      'The section explicitly distinguishes the historical fragment from current interiors and measured surveys')
check('conserva cerradas las alas' in section.get('modelNote', '').lower(),
      'The section is limited to the central body')
check('no se ha localizado' in by_id.get('sanatorio-escalera', {}).get('modelNote', '').lower(),
      'Stair heights and detailed construction are not falsely treated as measured evidence')
check('no equivale' in by_id.get('sanatorio-pabellones', {}).get('modelNote', '').lower(),
      'Auxiliary construction counts are distinguished from cadastral parts')
check('2022' in by_id.get('sanatorio-jardin-oriental', {}).get('modelNote', '')
      and '2026' in by_id.get('sanatorio-jardin-oriental', {}).get('modelNote', ''),
      'The botanical source is dated instead of treated as a current tree census')
check('no se convierte' in by_id.get('sanatorio-ciudad-factoria', {}).get('modelNote', '').lower(),
      'The archive destination announcement is not presented as a verified opening')
check('s-consulta2025' in by_id.get('sanatorio-ciudad-factoria', {}).get('sourceIds', [])
      and any(item.get('date') == '30 de octubre de 2025' and 'redacción' in item.get('text', '')
              for item in guide.get('timeline', [])),
      'CMSM consultation is documented separately from the still-planned Sanatorio archive adaptation')
check(all(item.get('coordinateConfidence') == 'approximate' for item in stops),
      'Observation positions retain an honest approximate precision')

registration = guide.get('modelRegistration', {})
registered = registration.get('status') == 'registered' and registration.get('provisionalCoordinates') is False
if args.require_registration or registered:
    check(registered, 'Final model registration is complete')

    def finite_numbers(values, length):
        return (isinstance(values, list) and len(values) == length
                and all(isinstance(n, (float, int)) and math.isfinite(n) for n in values))

    check(all(finite_numbers(item.get('coordinate'), 2) and item.get('coordinate') == item.get('coordinates') for item in stops),
          'Registered coordinates are finite and coordinate aliases agree')
    check(all(finite_numbers(item.get('localTarget'), 3) for item in stops),
          'Every registered stop has a finite three-dimensional scene target')
    check(len({tuple(item['coordinate']) for item in stops}) > 12,
          'Registered focuses are distinct rather than a repeated provisional origin')
    check(all('provisional' not in item.get('coordinateMethod', '').lower() for item in stops),
          'Registration removes provisional coordinate descriptions')

report = dict(
    iteration='V30', guide='dist/assets/data/sanatorio-visit.json',
    sha256=hashlib.sha256(PATH.read_bytes()).hexdigest(),
    passed=all(item['passed'] for item in checks), checks=checks,
    counts=dict(stops=len(stops), facts=len(facts), sources=len(sources),
                timelineEvents=len(guide.get('timeline', [])), layers=len(layers)),
    registration=registration, publicationReady=registered and all(item['passed'] for item in checks),
    note='Documentary coherence does not replace geometry, interaction, map and visual integration reviews.',
)
destination = ROOT / 'research/validation-v30/sanatorio-editorial-audit.json'
destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ('passed', 'counts', 'publicationReady')}, ensure_ascii=False))
if not report['passed']:
    raise SystemExit(1)
