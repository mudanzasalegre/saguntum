"""Index the original Atlas stops for territorial navigation. Coordinates are [longitude, latitude]."""
import json
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / 'dist/assets'
DATA = ASSETS / 'data'

def read(name):
    return json.loads((DATA / (name + '.json')).read_bytes())

def entry(regions, stops):
    return {'regions': [{'id': r['id'], 'name': r['name']} for r in regions],
            'stops': [{k: s[k] for k in ('id','title','coordinate','regionId','intro','period','mode','recommendedMode') if s.get(k)} for s in stops]}

def build():
    visits = {}
    aliases = {'barrio':'barrio-obrero', 'grau':'grau-vell'}
    for path in sorted(DATA.glob('*-visit.json')):
        key = path.stem.removesuffix('-visit')
        doc = read(path.stem)
        visits[aliases.get(key,key)] = entry(doc['regions'], doc['stops'])
    diana = [s for s in visits['berenguer']['stops'] if s['id'].startswith('diana-')]
    visits['diana'] = entry([r for r in visits['berenguer']['regions'] if any(s['regionId']==r['id'] for s in diana)], diana)
    for file in ('landscape-marjal','landscape-dunes','landscape-palancia','coast-archaeology'):
        for site in read(file)['sites']:
            stops = [dict(s, title=s['label'], intro=s.get('note')) for s in site['observationPoints']]
            visits[site['id']] = entry([], stops)
    for site in visits.values():
        assert site['stops'] and len(site['stops'])==len({s['id'] for s in site['stops']})
        assert all(-1 < s['coordinate'][0] < 0 and 39 < s['coordinate'][1] < 40 for s in site['stops'])
    (ASSETS/'territory/visit-stops.json').write_bytes(json.dumps(visits,ensure_ascii=False,separators=(',',':')).encode())
    print(len(visits),'lugares y',sum(len(v['stops']) for v in visits.values()),'paradas o puntos de observación.')

if __name__ == '__main__':
    build()
