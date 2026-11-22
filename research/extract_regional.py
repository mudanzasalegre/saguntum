import xml.etree.ElementTree as ET, pathlib, json
BASE=pathlib.Path('/workspace/sites/saguntum-atlas')
nodes={};ways={};nodeTags={}
for file in ['sagunto.osm','corridor.osm','coast.osm']:
 r=ET.parse(BASE/'research'/file).getroot()
 for e in r.findall('node'):
  nodes[e.get('id')]=[float(e.get('lon')),float(e.get('lat'))]
  nodeTags[e.get('id')]={t.get('k'):t.get('v') for t in e.findall('tag')}
 for e in r.findall('way'):ways[e.get('id')]=e
def tags(e):return {t.get('k'):t.get('v') for t in e.findall('tag')}
def coords(e):return [nodes[n.get('ref')] for n in e.findall('nd') if n.get('ref') in nodes]
out={'origin':[-.278,39.679],'geographicBounds':{'west':-.292,'east':-.188,'south':39.637,'north':39.696},'attribution':'© OpenStreetMap contributors','license':'ODbL 1.0','license_url':'https://opendatacommons.org/licenses/odbl/1-0/','retrieved':'2026-11-19','coastlines':[],'roads':[],'water':[],'urbanAreas':[],'railways':[],'places':[]}
for id,e in ways.items():
 t=tags(e);c=coords(e)
 if len(c)<2:continue
 f={'id':id,'coordinates':c}
 if t.get('name'):f['name']=t.get('name:es',t['name'])
 if t.get('natural')=='coastline':out['coastlines'].append(f)
 if t.get('waterway')=='river' or t.get('natural')=='water' and len(c)>30:
  f=f.copy();f['kind']='river' if t.get('waterway')=='river' else 'water';out['water'].append(f)
 if t.get('highway') in ['motorway','trunk','primary','secondary','tertiary']:
  f=f.copy();f['kind']=t['highway'];out['roads'].append(f)
 if t.get('railway')=='rail':out['railways'].append(f.copy())
 if t.get('landuse') in ['residential','industrial','commercial','retail'] and len(c)>8:
  f=f.copy();f['kind']=t['landuse'];out['urbanAreas'].append(f)
for id,t in nodeTags.items():
 if t.get('place') in ['town','city','village','suburb']:
  out['places'].append({'id':id,'name':t.get('name:es',t.get('name')),'coordinate':nodes[id]})
out['sources']=['https://api.openstreetmap.org/api/0.6/map?bbox=-0.286,39.670,-0.266,39.687','https://api.openstreetmap.org/api/0.6/map?bbox=-0.267,39.665,-0.221,39.681','https://api.openstreetmap.org/api/0.6/map?bbox=-0.222,39.640,-0.193,39.689']
# Coast runs consistently south to north; complete ways retained and should be clipped in rendering.
remaining=[c['coordinates'][:] for c in out['coastlines']]
coast=remaining.pop(0)
while remaining:
 for i,c in enumerate(remaining):
  if c[0]==coast[-1]:coast+=c[1:];remaining.pop(i);break
  if c[-1]==coast[0]:coast=c[:-1]+coast;remaining.pop(i);break
 else:break
out['coastline']=coast
if len(coast)>2:
 east=out['geographicBounds']['east']
 out['seaPolygon']=coast+[[east,coast[-1][1]],[east,coast[0][1]],coast[0]]
out['notes']='Real OSM linework; heights and individual regional buildings are not provided. Coastline polygon closes at east map edge. Some long ways extend beyond the map bounds; clip when rendering.'
(BASE/'dist/assets/data/regional.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print({k:len(v) for k,v in out.items() if isinstance(v,list)})
print('places',out['places'])
