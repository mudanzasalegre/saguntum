"""Retain OSM attributes needed for street-scale architecture; no invented tags."""
from pathlib import Path
import xml.etree.ElementTree as ET
import json, math
BASE=Path(__file__).resolve().parents[1]
root=ET.parse(BASE/'research/sagunto.osm').getroot()
ways={e.get('id'):e for e in root.findall('way')}
nodes={e.get('id'):[float(e.get('lon')),float(e.get('lat'))] for e in root.findall('node')}
def tags(e):return {t.get('k'):t.get('v') for t in e.findall('tag')}
def coords(e):return [nodes[t.get('ref')] for t in e.findall('nd') if t.get('ref') in nodes]
def num(v):
    try:return float(v)
    except:return None
def bounded(cs):
    return any(-.2891<c[0]<-.2651 and 39.6691<c[1]<39.6867 for c in cs)
path=BASE/'dist/assets/data/cartography.json';data=json.loads(path.read_text())
bkeys={'roof:shape':'roofShape','roof:height':'roofHeight','roof:levels':'roofLevels','roof:material':'roofMaterial','roof:colour':'roofColor','roof:direction':'roofDirection','building:material':'material','building:colour':'color','building:part':'part','min_height':'minHeight'}
rkeys={'width':'width','lanes':'lanes','incline':'incline','step_count':'stepCount','sidewalk':'sidewalk','sidewalk:both:surface':'sidewalkSurface','bridge':'bridge','tunnel':'tunnel','area':'area','lit':'lit','handrail':'handrail','layer':'layer'}
for feature in data['buildings']:
    t=tags(ways[feature['id']])
    for key,dest in bkeys.items():
        if key in t:feature[dest]=t[key]
for feature in data['roads']:
    t=tags(ways[feature['id']])
    for key,dest in rkeys.items():
        if key in t:feature[dest]=t[key]
data['retainingWalls']=[];data['squares']=[]
for id,e in ways.items():
    t=tags(e);c=coords(e)
    if not bounded(c):continue
    if t.get('barrier')=='retaining_wall':data['retainingWalls'].append({'id':id,'coordinates':c,'height':num(t.get('height')),'material':t.get('material'),'source':'OSM mapped alignment; untagged heights need visual estimation'})
    if t.get('area')=='yes' and t.get('highway') in ('pedestrian','living_street'):
        data['squares'].append({'id':id,'coordinates':c,'name':t.get('name'),'surface':t.get('surface'),'kind':t['highway']})
data['detail_enrichment']={'retrieved':'2026-11-19','notes':'OSM width, roof and street metadata retained where supplied; missing values remain estimates in the renderer. Retaining-wall lines and pedestrian areas added from the same downloaded extract.'}
path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('enriched',len(data['buildings']),'buildings;',len(data['roads']),'ways;',len(data['retainingWalls']),'retaining walls;',len(data['squares']),'pedestrian areas')
print('road tags', {key:sum(key in r for r in data['roads']) for key in rkeys.values()})
print('building tags',{key:sum(key in r for r in data['buildings']) for key in bkeys.values()})
