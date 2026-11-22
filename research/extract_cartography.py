import xml.etree.ElementTree as ET
import json,math,pathlib
BASE=pathlib.Path('/workspace/sites/saguntum-atlas')
root=ET.parse(BASE/'research/sagunto.osm').getroot()
nodes={e.get('id'):[float(e.get('lon')),float(e.get('lat'))] for e in root.findall('node')}
ways={e.get('id'):e for e in root.findall('way')}
def tags(e):return {t.get('k'):t.get('v') for t in e.findall('tag')}
def coords(e):return [nodes[t.get('ref')] for t in e.findall('nd') if t.get('ref') in nodes]
def project(c):return [(c[0]+.278)*111320*math.cos(math.radians(39.679)),(39.679-c[1])*111320]
def in_bounds(cs):
 return any(-950<=project(c)[0]<=1100 and -850<=project(c)[1]<=1100 for c in cs)
castle=next(e for e in root.findall('relation') if e.get('id')=='16216725')
segments=[[t.get('ref') for t in ways[m.get('ref')].findall('nd')] for m in castle.findall('member') if m.get('role')=='outer']
joined=segments.pop(0)
while segments:
 for i,s in enumerate(segments):
  if s[0]==joined[-1]: joined+=s[1:];segments.pop(i);break
  if s[-1]==joined[-1]:joined+=list(reversed(s))[1:];segments.pop(i);break
  if s[-1]==joined[0]:joined=s[:-1]+joined;segments.pop(i);break
  if s[0]==joined[0]:joined=list(reversed(s))[:-1]+joined;segments.pop(i);break
 else: raise ValueError('Castle perimeter does not connect')
out={'origin':[-.278,39.679],'projection':'local equirectangular; x east metres, z south metres','bounds':{'minX':-950,'maxX':1100,'minZ':-850,'maxZ':1100},'attribution':'© OpenStreetMap contributors','license':'ODbL 1.0','source':'https://api.openstreetmap.org/api/0.6/map?bbox=-0.286,39.670,-0.266,39.687','retrieved':'2026-11-19','castlePolygon':[nodes[n] for n in joined],'theatrePolygon':coords(ways['1199467403']),'castleWalls':[],'buildings':[],'roads':[],'landcover':[],'places':[]}
def num(s):
 try:return float(s)
 except:return None
for id,e in ways.items():
 t=tags(e);c=coords(e)
 if len(c)<2 or not in_bounds(c):continue
 name=t.get('name:es',t.get('name',''))
 feature={'id':id,'coordinates':c}
 if name:feature['name']=name
 # Internal castle walls and low archaeological walls, excluding precise perimeter already supplied.
 px=[project(p) for p in c];centre=[sum(p[k] for p in px)/len(px) for k in (0,1)]
 if -.2845<sum(p[0] for p in c)/len(c)<-.2747 and 39.6751<sum(p[1] for p in c)/len(c)<39.6774:
  if t.get('barrier') in ['wall','city_wall'] or t.get('ruins')=='building_wall':
   feature['kind']=t.get('barrier','ruin');feature['height']=num(t.get('height'));feature['historic']=t.get('historic');out['castleWalls'].append(feature.copy())
 if t.get('building') and id!='1199467403' and not t.get('historic') in ['ruins','city_gate','optical_telegraph']:
  feature['kind']=t['building'];feature['height']=num(t.get('height'));feature['levels']=num(t.get('building:levels'));out['buildings'].append(feature.copy())
 if t.get('highway'):
  feature['kind']=t['highway'];feature['surface']=t.get('surface');out['roads'].append(feature.copy())
 if t.get('natural') or t.get('landuse') or t.get('waterway') or t.get('leisure') in ['park','garden']:
  feature['kind']=t.get('natural',t.get('landuse',t.get('waterway',t.get('leisure'))));out['landcover'].append(feature.copy())
for id,e in [(e.get('id'),e) for e in root.findall('node')]:
 t=tags(e)
 if t.get('place')=='square' and t.get('historic'):
  out['places'].append({'id':id,'coordinate':nodes[id],'name':t.get('name:es',t.get('name'))})
out['places'] += [{'id':'theatre','coordinate':[-.27800,39.67689],'name':'Teatro Romano','position_note':'Approximate orchestra centre inferred from mapped footprint'}, {'id':'castle','coordinate':[-.2786,39.67615],'name':'Castillo de Sagunto','position_note':'Representative focus point within mapped perimeter'}]
(BASE/'dist/assets/data/cartography.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print({k:len(v) for k,v in out.items() if isinstance(v,list)})
print('castle bounds',min(c[0] for c in out['castlePolygon']),max(c[0] for c in out['castlePolygon']),min(c[1] for c in out['castlePolygon']),max(c[1] for c in out['castlePolygon']))
