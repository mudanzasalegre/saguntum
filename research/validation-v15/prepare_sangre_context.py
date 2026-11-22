"""Prepare source-registered surroundings for the Ermita de la Sangre.

Requires Shapely2.1+. This is offline geometry preparation only; no Python
packages are required by the published website.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
OUT = ROOT / 'research/validation-v15'
SCALE = 111320 * math.cos(math.radians(39.679))
read = lambda n: json.loads((DATA / (n + '.json')).read_text())
project = lambda ll: ((ll[0] + .278) * SCALE, (39.679 - ll[1]) * 111320)
geographic = lambda p: [round(-.278 + p[0] / SCALE, 9), round(39.679 - p[1] / 111320, 9)]


def polygon(row):
    return Polygon([project(p) for p in row['coordinates']],
                   [[project(p) for p in ring] for ring in row.get('holes', [])]).buffer(0)


def polygons(shape):
    if shape.geom_type == 'Polygon' and shape.area > 1e-9:
        yield shape
    elif hasattr(shape, 'geoms'):
        for part in shape.geoms:
            yield from polygons(part)


def width(road):
    try:
        return max(.7, min(18, float(road['width'])))
    except (KeyError, TypeError, ValueError):
        return {'living_street': 3.4, 'pedestrian': 3.1,
                'footway': 1.6, 'path': 1.4, 'steps': 1.4}.get(road.get('kind'), 4.5)


def retained_paving(contexts):
    surfaces = []
    for old in contexts.values():
        mesh = old.get('pavementMesh')
        if mesh:
            for group in mesh['groups']:
                ids = group['indices']
                surfaces.extend(Polygon([mesh['vertices'][i] for i in ids[j:j+3]])
                                for j in range(0, len(ids), 3))
        else:
            surfaces.extend(polygon(s) for s in old.get('surfaces', []))
            for road in old.get('roads', []):
                if road.get('area') != 'yes':
                    surfaces.append(LineString([project(p) for p in road['coordinates']])
                                    .buffer(width(road)/2, cap_style='flat'))
    return unary_union(surfaces)


def build_context():
    cartography, landmarks = read('cartography'), read('landmarks')
    site = next(row for row in landmarks['sites'] if row['id'] == 'sangre')
    owners = {n: read(n+'-context') for n in ['santa-maria','plaza-mayor','juderia','calvario','berenguer']}
    core_parent = '3657314YJ3935H'
    core = [dict(b) for b in cartography['buildings'] if b.get('parentId') == core_parent]
    core_ids = {str(b['id']) for b in core}
    core_shape = unary_union([polygon(b) for b in core] + [polygon({'coordinates':site['footprint']})])
    stair = Polygon([[47.85814,88.64305],[50.39835,81.48013],[52.97134,82.3926],[50.43114,89.55552]])
    plan_file = DATA/'sangre-plan.json'
    if plan_file.exists():
        plan = json.loads(plan_file.read_text())
        ownership = plan.get('contextOwnership', {})
        supplied = ownership.get('stairEnvelope') or ownership.get('stairOutline')
        if supplied:
            stair = polygon({'coordinates': supplied})
    reserved = unary_union([core_shape, stair])
    selection = core_shape.buffer(38)
    protected, protected_ids, transfers = [], set(), {}
    for owner, old in owners.items():
        protected_ids.update(map(str,old.get('excludedBuildingIds',[])))
        retired = sorted(core_ids.intersection(map(str,old.get('excludedBuildingIds',[]))))
        transfers[owner] = {'retiredBuildingPartIds':retired,'retiredRoadIds':[],
                            'replacementOwner':'sangre-core',
                            'reason':'Only exact source parts of the ermita complex would transfer; prior context is otherwise retained.'}
        for b in old.get('buildings',[]) + old.get('coreBuildings',[]):
            for i, part in enumerate([b,*b.get('secondaryFootprints',[])]):
                protected.append({'id':str(b['id'])+'-component-'+str(i),
                                  'coordinates':part['coordinates'],'holes':part.get('holes',[]),
                                  'owner':owner,'sourceId':str(b['id'])})
    for monument in landmarks['sites']:
        if len(monument.get('footprint',[])) >= 3:
            protected.append({'id':monument['id'],'coordinates':monument['footprint'],
                              'owner':'existing-monument'})
    protected = [b for b in protected if polygon(b).intersects(selection.buffer(8))]
    protected_union = unary_union([polygon(b) for b in protected])
    parents = defaultdict(list)
    for b in cartography['buildings']:
        if b.get('parentId'):
            parents[b['parentId']].append(b)
    buildings, chosen, rejected = [], [], []
    for parent, parts in parents.items():
        shape = unary_union([polygon(b) for b in parts])
        if shape.is_empty or not (selection.covers(shape.centroid) or shape.intersection(selection).area > shape.area*.5):
            continue
        if parent == core_parent or shape.intersection(reserved).area > .25:
            rejected.append({'parentId':parent,'reason':'Detailed ermita, annex or stair ownership'})
            continue
        if any(str(b['id']) in protected_ids for b in parts) or shape.intersection(protected_union).area > .25:
            rejected.append({'parentId':parent,'reason':'Retained detailed context owner'})
            continue
        chosen.append(parent)
        for part in parts:
            row = dict(part)
            row['contextComponent'] = 'sangre-entorno'
            buildings.append(row)
    chosen_shape = unary_union([polygon(b) for b in buildings])
    duplicates, residuals = [], []
    for b in cartography['buildings']:
        if b.get('parentId') or str(b['id']) in protected_ids:
            continue
        shape = polygon(b)
        overlap = shape.intersection(chosen_shape).area/shape.area if shape.area else 0
        if overlap > .7:
            duplicates.append(str(b['id']))
        elif overlap > .2:
            # A few OSM footprints supply portions absent from the selected
            # cadastral parts. Preserve their substantial residual instead of
            # allowing generic-city exclusion to leave a false courtyard.
            remaining = shape.difference(chosen_shape).difference(reserved).difference(protected_union)
            parts = [p for p in polygons(remaining) if p.area > 2]
            if not parts:
                continue
            duplicates.append(str(b['id']))
            parent = max(chosen,key=lambda name:shape.intersection(unary_union([polygon(p) for p in parents[name]])).area)
            for i,part in enumerate(parts):
                row = dict(b)
                row.update({'id':str(b['id'])+'-residual-'+str(i),'sourceId':str(b['id']),
                            'parentId':parent,'coordinates':[geographic(p) for p in part.exterior.coords],
                            'holes':[[geographic(p) for p in ring.coords] for ring in part.interiors],
                            'contextComponent':'sangre-entorno','derivedClip':True})
                buildings.append(row)
                residuals.append({'id':row['id'],'sourceId':str(b['id']),'parentId':parent,
                                  'sourceCoordinates':b['coordinates'],'areaM2':part.area,
                                  'method':'OSM footprint minus retained cadastral parts and other scene owners; fragments below 2 m² omitted as registration slivers.'})
    retained = retained_paving(owners)
    roads, fully_replaced = [], []
    road_ids = {'87552079','733344350','82322793','82322798','1365045230','1365045231',
                '1419209828','163609152','163560107','163560111','163609166','1083564813','1357547433'}
    old_road_ids = {str(v) for old in owners.values() for v in old.get('excludedRoadIds',[])}
    for road in cartography['roads']:
        if str(road['id']) not in road_ids or str(road['id']) in old_road_ids:
            continue
        axis = LineString([project(p) for p in road['coordinates']])
        clip = axis.intersection(selection).difference(reserved).difference(retained)
        whole = axis.difference(clip).length < .02
        if whole:
            fully_replaced.append(str(road['id']))
        for i,line in enumerate(clip.geoms if hasattr(clip,'geoms') else [clip]):
            if line.geom_type != 'LineString' or line.length < .8:
                continue
            row = dict(road)
            row.update({'id':str(road['id'])+('' if whole else '-fragment-'+str(i)),
                        'sourceId':str(road['id']),'sourceCoordinates':road['coordinates'],
                        'coordinates':[geographic(p) for p in line.coords],
                        'contextComponent':'sangre-entorno','replacesWholeSource':whole})
            roads.append(row)
    # Graphic outline inferred from the public void between mapped buildings
    # and street axes. It is not an independently surveyed municipal plaza.
    plaza = Polygon([[39.8,79.6],[53.5,77.5],[56,78.9],[50,94],
                     [45,92.1],[41.4,90.2],[39.6,87]])
    height_review = []
    for b in buildings:
        h,levels = b.get('surfaceHeightEstimate'),b.get('levels')
        if not b.get('height') and h and levels and levels >= 2 and h < levels*1.75:
            height_review.append({'id':b['id'],'surfaceHeightEstimate':h,'cadastralLevels':levels,
                'displayHeightM':levels*3,'method':'Cadastral floor count × 3 m',
                'reason':'Surface estimate below 1.75 m per mapped floor; source data remain unchanged and the displayed height is interpretive.'})
    context = {
        'schemaVersion':1,'id':'sangre-context','coordinate':site['coordinate'],'researchDate':'2026-11-20',
        'districtOutline':[geographic(p) for p in selection.exterior.coords],
        'districtOutlineSource':'Render selection 38 m around the mapped ermita and its annexes, not a historic district boundary.',
        'selectionRadiusM':38,'provenanceTextCodes':cartography.get('provenanceTextCodes',{}),
        'coreBuildings':core,'associatedBuildings':[],'buildings':buildings,'roads':roads,'surfaces':[],
        'coreOwnership':{'sourceBuildingPartIds':sorted(core_ids),'OSMBuildingIds':['203084352','1303709333'],
                         'stairOutline':[geographic(p) for p in stair.exterior.coords],
                         'plazaOutline':[geographic(p) for p in plaza.exterior.coords],
                         'annexParcelIdentification':'Same cadastral parcel as the church. Parts7/8 lie south of the church footprint; detailed room use remains interpretive.'},
        'ownershipTransfers':transfers,'heightReview':height_review,'sourceResiduals':residuals,
        'excludedBuildingIds':sorted({str(b['id']) for b in buildings}|set(duplicates)),
        'coreExcludedBuildingIds':sorted(core_ids|{'203084352','1303709333'}),
        'excludedRoadIds':sorted(fully_replaced),'protectedFootprints':protected,
        'focusCoordinates':{'sangre-plaza':geographic((46.3,85)),'sangre-entorno':geographic((56.8,61.5))},
        'focusSpecs':{
            'sangre-plaza':{'label':'La plaza ante la ermita','radius':9,'targetHeight':7.2,'far':[-17,18,-10],'near':[-20,-.7,-3.5],'fov':46,'minDistance':3},
            'sangre-entorno':{'label':'La ermita y las calles del barrio','radius':18,'targetHeight':2.6,'far':[-17,25,-20],'near':[-12,6,-3],'minDistance':5}},
        'readingColor':'#83a799',
        'facadeNote':'Plantas y partes de Catastro conservadas. Volúmenes menores, huecos, balcones, carpinterías y revocos interpretados: la fotografía municipal orienta la gama blanca y ocre, pero no constituye un levantamiento de cada fachada.',
        'roofNote':'Estimaciones del IGN MDS normalizado y plantas de Catastro; cubiertas y aleros interpretativos. Las discrepancias extremas entre MDSn y número de plantas se identifican en heightReview y se muestran mediante plantas × 3 m, sin alterar las alturas originales.',
        'pavingNote':'Calles OSM y vacío frontal inferido entre edificios, recortados contra huellas y escalera. Pavimento gris cálido de lectura urbana; patrón y piezas no medidos. La topografía sigue el MDT y la malla final, sin convertir la plazoleta en una plataforma horizontal.',
        'preservationNote':'Conserva los edificios y pavimentos de Santa María, Plaça Major, Judería, Calvario y Berenguer. Las calles sólo se sustituyen por completo cuando toda su línea está contenida; los fragmentos mantienen la continuidad exterior.',
        'sources':[
            {'id':'sangre-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado; no información catastral oficial'},
            {'id':'sangre-context-osm','title':'OpenStreetMap · Ermita y calle Nueva Sangre','url':'https://www.openstreetmap.org/way/87552079','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'sangre-context-mdt','title':'IGN MDT05 y MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY4.0'},
            {'id':'sangre-context-pnoa','title':'PNOA Máxima Actualidad','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY4.0'},
            {'id':'sangre-context-photo','title':'Ayuntamiento de Sagunto · Fachada y plaza antes de la mejora de iluminación','url':'https://aytosagunto.es/es/actualidad/comienzan-las-obras-de-mejora-de-la-iluminacion-de-la-fachada-de-la-ermita-de-la-sangre/','date':'2020-08-18','imageReference':'https://aytosagunto.es/media/p2kpwthh/81-ermita-sangre_c.jpg'},
            {'id':'sangre-context-municipal','title':'Ayuntamiento · Proyecto Xiuxiueig, Ermita de la Puríssima Sang','url':'https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/ermita-de-la-purissima-sang/'}],
        'selectionStats':{'contextParts':len(buildings),'cadastralParts':len(buildings)-len(residuals),'OSMResidualParts':len(residuals),'contextParcels':len(chosen),'mappedCourtyards':sum(len(b.get('holes',[]))for b in buildings),
                          'roads':len(roads),'fullyReplacedRoads':len(fully_replaced),'OSMDuplicates':duplicates,
                          'retainedOwners':list(owners),'rejectedParcels':rejected,'heightConflicts':len(height_review)},
        'inputHashes':{n:hashlib.sha256((DATA/(n+'.json')).read_bytes()).hexdigest()for n in ['cartography','landmarks',*[name+'-context'for name in owners]]}}
    prepare_pavement(context,cartography,reserved,retained,plaza)
    (DATA/'sangre-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(context['selectionStats'],ensure_ascii=False))
    return context




def prepare_pavement(context, cartography, reserved, retained, plaza):
    candidates = unary_union([LineString([project(p) for p in r['coordinates']])
                             .buffer(width(r)/2, cap_style='round', join_style='mitre',
                                     mitre_limit=2, quad_segs=4) for r in context['roads']] + [plaza])
    obstacles = unary_union([polygon(b) for b in cartography['buildings'] if b.get('parentId')]
                            + [polygon(b) for b in context['buildings']]
                            + [polygon(b) for b in context['protectedFootprints']])
    courtyards = unary_union([Polygon(ring) for p in polygons(obstacles) for ring in p.interiors])
    protected = unary_union([reserved, retained])
    paving = candidates.difference(obstacles).difference(protected).difference(courtyards)
    plaza_paving = paving.intersection(plaza)
    street_paving = paving.difference(plaza)
    context['surfaces'] = [{'id':'sangre-plaza-'+str(i),'coordinates':[geographic(p) for p in part.exterior.coords],
         'holes':[[geographic(p) for p in ring.coords] for ring in part.interiors],
         'kind':'public-square','derived':True,'sourceId':'Public void inferred from mapped footprints and street axes'}
         for i,part in enumerate(polygons(plaza_paving))]
    # Partial source ways must keep their exterior continuations and terrain
    # grading. Suppress only their generic render inside our detailed paving;
    # otherwise generic curbs protrude through the new plaza as pale slivers.
    # A 1 cm inward guard keeps masks off adjacent cadastral walls. Masks have
    # no holes because the generic city exclusion contract uses simple rings.
    masks = []
    candidates = [('sangre-plaza', plaza_paving)] + [
        (str(r['sourceId']), LineString([project(p) for p in r['coordinates']])
         .buffer(width(r)/2, cap_style='round', join_style='mitre',
                 mitre_limit=2, quad_segs=4).intersection(paving))
        for r in context['roads'] if not r['replacesWholeSource']]
    for source_id, shape in candidates:
        for part in polygons(shape.buffer(-.01).simplify(.00005, preserve_topology=True)):
            pieces = list(polygons(shapely.constrained_delaunay_triangles(part))) if part.interiors else [part]
            for piece in pieces:
                if piece.area < .01:
                    continue
                masks.append({'sourceId':source_id,
                              'coordinates':[geographic(p) for p in piece.exterior.coords],
                              'scope':'Generic render only; source street axes, relief and exterior continuations remain.'})
    context['genericStreetExclusions'] = masks
    vertices, lookup, indices, emitted = [], {}, [], []
    group_indices = {'sangre-plaza':[],'sangre-entorno':[]}
    def vertex(p):
        key = (round(p[0],6),round(p[1],6))
        if key not in lookup:
            lookup[key] = len(vertices)
            vertices.append(list(key))
        return lookup[key]
    if not paving.is_empty:
        ax, az, bx, bz = paving.bounds
        for ix in range(math.floor(ax/2.5),math.ceil(bx/2.5)):
            for iz in range(math.floor(az/2.5),math.ceil(bz/2.5)):
                x,z=ix*2.5,iz*2.5
                if not paving.intersects(box(x,z,x+2.5,z+2.5)):
                    continue
                for cell in [Polygon([(x,z),(x,z+2.5),(x+2.5,z+2.5)]),
                             Polygon([(x,z),(x+2.5,z+2.5),(x+2.5,z)])]:
                    for piece in polygons(paving.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area < 1e-9:
                                continue
                            ids = [vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids)) == 3:
                                indices += ids
                                # Shared plaza/street material keeps the urban surface continuous.
                                component = 'sangre-plaza' if plaza.covers(tri.representative_point()) else 'sangre-entorno'
                                group_indices[component] += ids
                                emitted.append(Polygon([vertices[i] for i in ids]))
    boundary=[]
    for poly in polygons(paving):
        for ring in [poly.exterior,*poly.interiors]:
            points=list(ring.coords)
            for a,b in zip(points,points[1:]):
                dx,dz=b[0]-a[0],b[1]-a[1];ts={0.,1.}
                for origin,delta in [(a[0],dx),(a[1],dz),(a[1]-a[0],dz-dx)]:
                    if abs(delta)<1e-10:
                        continue
                    lo,hi=sorted([origin,origin+delta])
                    for k in range(math.floor(lo/2.5)+1,math.ceil(hi/2.5)):
                        t=(k*2.5-origin)/delta
                        if 1e-8<t<1-1e-8:ts.add(t)
                ids=[vertex((a[0]+dx*t,a[1]+dz*t)) for t in sorted(ts)]
                boundary += [[u,v] for u,v in zip(ids,ids[1:]) if u!=v]
    actual=unary_union(emitted)
    report={'method':'Source street buffers joined, clipped to cadastral walls, private courts and retained owners; triangulated on the exact 2.5 m terrain mesh.',
            'areaM2':paving.area,'plazaAreaM2':plaza_paving.area,'streetAreaM2':street_paving.area,'triangles':len(emitted),'vertices':len(vertices),
            'uncoveredAreaM2':paving.difference(actual).area,'excessAreaM2':actual.difference(paving).area,
            'buildingOverlapM2':actual.intersection(obstacles).area,
            'privateCourtyardOverlapM2':actual.intersection(courtyards).area,
            'protectedPavingOverlapM2':actual.intersection(protected).area,
            'triangleOverlapM2':sum(p.area for p in emitted)-actual.area,
            'boundaryEdges':len(boundary)}
    report['pass']=all(abs(report[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','buildingOverlapM2',
        'privateCourtyardOverlapM2','protectedPavingOverlapM2','triangleOverlapM2'])
    assert report['pass'],report
    context['pavementMesh']={'coordinateSystem':'Atlas x/z metres; origin [-0.278,39.679].',
        'terrainGrid':{'spacingM':2.5,'originXZ':[0,0],'diagonal':'x=z within each cell'},
        'method':report['method'],'vertices':vertices,
        'groups':[{'component':key,'indices':values,
                   'sourceIds':sorted({r['sourceId'] for r in context['roads']})} for key,values in group_indices.items() if values],
        'boundaryEdges':boundary,'coverage':report}
    context['pavingNote']+=' Superficie continua ajustada a los triángulos finales del relieve, con holgura gráfica de 10,5 cm y bordes cerrados.'
    OUT.mkdir(exist_ok=True)
    (OUT/'sangre-context-pavement-qa.json').write_text(json.dumps(report,indent=2)+'\n')


if __name__=='__main__':
    build_context()
