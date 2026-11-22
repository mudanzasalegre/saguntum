"""Derive compact Santa María surroundings from the atlas' attributed sources.

Source polygons are copied unchanged. The selection deliberately leaves the
existing detailed Plaza Mayor and Casa dels Berenguer models in charge of their
own footprints. This is a repeatable selection, not a new cadastral survey.
"""
from pathlib import Path
import json, math
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
read = lambda n: json.loads((DATA / (n+'.json')).read_text())
carto, landmarks = read('cartography'), read('landmarks')
project = lambda c: ((c[0]+.278)*111320*math.cos(math.radians(39.679)), (39.679-c[1])*111320)
poly = lambda coordinates, holes=(): Polygon([project(c) for c in coordinates], [[project(c) for c in ring] for ring in holes]).buffer(0)
civic_text = (ROOT/'dist/js/heritage-civic-data.js').read_text()
civic = json.loads(civic_text[civic_text.index('=')+1:].strip().rstrip(';'))
preserved = [{'id':'plaza-mayor-'+str(b['id']), 'coordinates':b['coordinates']} for b in civic['plaza']]
preserved += [{'id':s['id'], 'coordinates':s['footprint']} for s in landmarks['sites'] if s['id'] in ['santa-maria','berenguer','diana'] and s.get('footprint')]
reserved = unary_union([poly(p['coordinates']) for p in preserved])

# Immediate street fronts, grouped around the west forecourt, Cavallers and
# Sagrari. Parts retain source height, storey, courtyard and roof-colour fields.
groups = {
 'santa-maria-cervantes':['3458304YJ3935G','3458305YJ3935G','3458306YJ3935G'],
 'santa-maria-cavallers':['3459232YJ3935G','3459233YJ3935G','3459231YJ3935G','3459619YJ3935G'],
 'santa-maria-sagrario':['3558304YJ3935G','3558301YJ3935G','3558302YJ3935N','3558303YJ3935H','3558208YJ3935G','3558207YJ3935G','3558209YJ3935H','3558248YJ3935G','3558201YJ3935G']
}
parent_group = {parent:group for group, parents in groups.items() for parent in parents}
buildings, rejected = [], []
for building in carto['buildings']:
 if building.get('parentId') not in parent_group:
  continue
 shape = poly(building['coordinates'], building.get('holes',[]))
 overlap = shape.intersection(reserved).area
 if overlap > .45:
  rejected.append({'id':building['id'], 'preservedOverlapM2':round(overlap,3)})
  continue
 row = dict(building)
 row['contextComponent'] = parent_group[building['parentId']]
 buildings.append(row)

selected_union = unary_union([poly(b['coordinates'],b.get('holes',[])) for b in buildings])
selected_ids = {str(b['id']) for b in buildings}
duplicates = []
for building in carto['buildings']:
 if str(building['id']) in selected_ids or str(building['id']).startswith('cat-'):
  continue
 shape = poly(building['coordinates'],building.get('holes',[]))
 if shape.area and shape.intersection(selected_union).area / shape.area > .75:
  duplicates.append(str(building['id']))

road_ids = ['87554148','1365045257','1204891837','733321159','22922651','1419209850','1419209851','1419209852','1419209853']
roads = [r for r in carto['roads'] if str(r['id']) in road_ids]
surface = next(r for r in roads if str(r['id'])=='22922651')
context = {
 'schemaVersion':1,
 'id':'santa-maria-context',
 'title':'Santa María y su entorno inmediato',
 'coordinate':[-.27910948,39.67903398],
 'radiusM':90,
 'sourceGeometryNote':'Plantas y patios copiados sin alterar del Catastro INSPIRE y complemento OSM del atlas; calles y plaza Cervantes de OSM. El radio es un ámbito de lectura, no un límite histórico.',
 'heightNote':'Altura registrada > estimación IGN MDSnE2.5 > plantas catastrales × 3 m > estimación visual explícita. La cota de cubierta se ajusta solo si el terreno de presentación la intersecta. No son alturas de alero medidas.',
 'facadeNote':'Huecos, carpinterías, revocos, cornisas y barandillas domésticas son una lectura volumétrica genérica. No representan una documentación de cada fachada ni una rehabilitación concluida.',
 'roofNote':'Color de cubierta tomado de las muestras PNOA del atlas; pendiente y forma de la envolvente se interpretan conservando la planta y los patios. La fecha de descarga no equivale a la fecha de vuelo.',
 'stairNote':'Dos tramos paralelos a la fachada norte y rellano central; trazado de la vía OSM 733321159 y plano publicado. Pretil macizo de piedra, no balaustres abiertos. El año 1799 se refiere al pretil; dimensiones de peldaños y cotas son una adaptación al MDT de presentación.',
 'inscriptionNote':'Dos bloques romanos superpuestos en el exterior central del pretil, según ARSE 58 (2024). Se muestran sus marcos y tamaños aproximados publicados (1,67 × 0,59 m y 1,23 × 0,63 m), sin inventar letras ni una restitución del texto.',
 'sources':[
  {'id':'sm-context-catastro','title':'Dirección General del Catastro · INSPIRE Buildings, Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip','use':'Plantas, subdivisión de volúmenes, patios y número de plantas; copia de cartography.json.','license':'https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf'},
  {'id':'sm-osm','title':'OpenStreetMap contributors · calles y plaza Cervantes','url':'https://www.openstreetmap.org/way/22922651','use':'Plaza peatonal, calles y doble escalinata mediante el trazado cartográfico del atlas.','license':'ODbL 1.0'},
  {'id':'sm-context-mds','title':'IGN/CNIG · MDSnE2.5 y MDT','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','use':'Alturas de superficie derivadas; no sustituyen un levantamiento de fachadas.'},
  {'id':'sm-context-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad','url':'https://www.ign.es/wms-inspire/pnoa-ma','use':'Color de tejados y comprobación del contexto de cubiertas.','license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'},
  {'id':'sm-lapidas-2024','title':'Forner Palanca y Palomar Abascal, Estudio preliminar sobre las lápidas romanas de la escalera de la iglesia de Santa María de Sagunto, ARSE 58 (2024), pp. 73–88','url':'https://centroarqueologicosaguntino.es/wp-content/uploads/2025/08/Arse_58-74-89.pdf','use':'Fotos actuales del pretil macizo, doble disposición de las lápidas y medidas aproximadas; pp. 74–75 y 79.'}
 ],
 'buildings':buildings,
 'excludedBuildingIds':sorted(selected_ids|set(duplicates)),
 'roads':roads,
 'excludedRoadIds':road_ids,
 'surfaces':[{'id':'santa-maria-cervantes','name':'Plaça de Cervantes','coordinates':surface['coordinates'],'period':'mixed','sourceId':'22922651','source':'sm-osm'}],
 'preservedAreas':preserved,
 'selectionQA':{'parentParcels':len({b['parentId'] for b in buildings}),'parts':len(buildings),'preservedOverlapsRejected':rejected,'duplicateOSMFootprints':duplicates},
 'focusLocals':{
  'santa-maria-escalinata':[23.2,.35],
  'santa-maria-plaza-mayor':[56.55644418096528,20.7941453036412],
  'santa-maria-cavallers':[25.4,-16],
  'santa-maria-sagrario':[1.62,23.6],
  'santa-maria-berenguer':[-29.320772712586866,19.929806418614668]
 }
}
(DATA/'santa-maria-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'parts':len(buildings),'parentParcels':context['selectionQA']['parentParcels'],'excludedBuildingIds':len(context['excludedBuildingIds']),'roads':len(roads),'preservedOverlapsRejected':rejected},ensure_ascii=False))
