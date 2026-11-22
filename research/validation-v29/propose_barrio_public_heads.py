from pathlib import Path
import sys,json
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_barrio_context as C
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union
from PIL import Image,ImageDraw
D=C.DATA;OUT=C.OUT
plan=C.read('barrio-plan');model=next(s for s in C.read('port-workers')['sites'] if s['id']=='barrio-obrero');context=C.read('barrio-context')
blocks=unary_union([Polygon([C.project(p) for p in r]) for r in model['blocks']]);core=unary_union([Polygon([C.project(p) for p in r['footprint']],[[C.project(p) for p in h] for h in r.get('holes',[])]).buffer(0) for r in model['parts']]);domestic=unary_union([C.polygon(r) for r in plan['components'] if r.get('kind') in ['garden','courtyard'] and r.get('buildingId')]);protected=core.buffer(.20).union(domestic.buffer(.18));previous=unary_union([C.polygon(r) for r in context['surfaces']]);allarch=unary_union([C.polygon(r) for r in C.read('port-cartography')['buildings']])
traces=[('C',[(934,745),(1014,783),(933,906),(856,852)],[(977,770),(1014,783),(933,906),(899,883)]),('D',[(1036,808),(1084,837),(1012,958),(961,926)],[(1036,808),(1061,823),(987,943),(961,926)])]
rows=[]
for letter,outer,asphalt in traces:
 shape=C.traced(outer).difference(protected).difference(allarch.buffer(.08));road=C.traced(asphalt).intersection(shape)
 rows.append({'id':'barrio-public-head-'+letter,'block':letter,'sourcePixels':outer,'parkingSourcePixels':asphalt,'coordinates':C.record('',shape)['coordinates'],'holes':C.record('',shape)['holes'],'areaM2':shape.area,'insideReservedBlockM2':shape.intersection(blocks).area,'newGroundM2':shape.difference(previous).area,'privateGeometryOverlapM2':shape.intersection(protected).area,'parking':[C.record('barrio-public-parking-'+letter+'-'+str(i),p) for i,p in enumerate(C.polygons(road))]})
report={'status':'candidate-not-applied','description':'Two contemporary public parking/pavement pockets beside Casas de Compañía. Cuts of nominal block envelopes only; excludes every current cadastral building, interpreted domestic garden and corral. No previous owner modified.','candidates':rows}
(OUT/'barrio-public-heads-candidate.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
base=Image.open(OUT/'barrio-context-orthophoto-reference.jpg').convert('RGBA');ov=Image.new('RGBA',base.size);dr=ImageDraw.Draw(ov);px=lambda q:((q[0]+.22745)/.0052*2600,(39.663-q[1])/.0027*1800)
for r in rows:
 dr.polygon([px(q) for q in r['coordinates']],fill=(250,205,80,150),outline='yellow',width=3)
 for h in r['holes']:dr.polygon([px(q) for q in h],fill=(0,0,0,0))
 for road in r['parking']:dr.polygon([px(q) for q in road['coordinates']],fill=(50,80,145,170),outline='blue',width=2)
for r in plan['components']:
 if r.get('kind') in ['garden','courtyard'] and r.get('buildingId'):dr.line([px(q) for q in r['coordinates']+[r['coordinates'][0]]],fill=(250,0,255,255),width=2)
Image.alpha_composite(base,ov).crop((820,680,1150,990)).resize((1100,1033)).convert('RGB').save(OUT/'barrio-public-heads-candidate.jpg',quality=94)
print(json.dumps([{k:v for k,v in r.items() if k in ['id','areaM2','insideReservedBlockM2','newGroundM2','privateGeometryOverlapM2']} for r in rows],indent=2))
