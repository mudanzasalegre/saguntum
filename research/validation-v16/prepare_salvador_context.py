"""Prepare source-registered surroundings for the Iglesia del Salvador.

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
OUT = ROOT / 'research/validation-v16'
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


def grid_mesh(shape):
    vertices,lookup,indices=[],{},[]
    def vertex(p):
        key=tuple(round(v,6)for v in p)
        if key not in lookup: lookup[key]=len(vertices);vertices.append(list(key))
        return lookup[key]
    ax,az,bx,bz=shape.bounds
    for ix in range(math.floor(ax/2.5),math.ceil(bx/2.5)):
        for iz in range(math.floor(az/2.5),math.ceil(bz/2.5)):
            x,z=ix*2.5,iz*2.5
            if not shape.intersects(box(x,z,x+2.5,z+2.5)):continue
            for cell in [Polygon([(x,z),(x,z+2.5),(x+2.5,z+2.5)]),Polygon([(x,z),(x+2.5,z+2.5),(x+2.5,z)])]:
                for piece in polygons(shape.intersection(cell)):
                    for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                        if tri.area>1e-9: indices += [vertex(p)for p in list(tri.exterior.coords)[:3]]
    return {'vertices':vertices,'indices':indices,'spacingM':2.5,'areaM2':shape.area}


def build_context():
    cartography, landmarks = read('cartography'), read('landmarks')
    site = next(row for row in landmarks['sites'] if row['id'] == 'salvador')
    owners = {n: read(n+'-context') for n in ['santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre']}
    core_parent = '4056919YJ3945E'
    core = [dict(b) for b in cartography['buildings'] if b.get('parentId') == core_parent]
    core_ids = {str(b['id']) for b in core}
    core_shape = unary_union([polygon(b) for b in core])
    # The mapped church is retained in its existing frame. Only the modest
    # threshold, not the public seven-step access, belongs to its core model.
    anchor = project(site['coordinate']); yaw = 1.44
    transform = lambda u,v: (anchor[0]+u*math.cos(yaw)+v*math.sin(yaw),anchor[1]-u*math.sin(yaw)+v*math.cos(yaw))
    threshold = Polygon([transform(u,v) for u,v in [(.45,-16.65),(3.35,-16.65),(3.35,-15.8),(.45,-15.8)]])
    reserved = unary_union([core_shape, threshold])
    selection = core_shape.buffer(45)
    protected, protected_ids, transfers = [], set(), {}
    for owner, old in owners.items():
        protected_ids.update(map(str,old.get('excludedBuildingIds',[])))
        retired = sorted(core_ids.intersection(map(str,old.get('excludedBuildingIds',[]))))
        transfers[owner] = {'retiredBuildingPartIds':retired,'retiredRoadIds':[], 'replacementOwner':'salvador-core',
            'reason':'Only exact core source parts may transfer; previous monuments, streets and paving remain unchanged.'}
        for b in old.get('buildings',[]) + old.get('coreBuildings',[]):
            for i, part in enumerate([b,*b.get('secondaryFootprints',[])]):
                protected.append({'id':str(b['id'])+'-component-'+str(i),'coordinates':part['coordinates'],
                    'holes':part.get('holes',[]),'owner':owner,'sourceId':str(b['id'])})
    for monument in landmarks['sites']:
        if len(monument.get('footprint',[])) >= 3:
            protected.append({'id':monument['id'],'coordinates':monument['footprint'],'owner':'existing-monument'})
    protected = [b for b in protected if polygon(b).intersects(selection.buffer(8))]
    # The core itself is reserved independently. Slight OSM/cadastral edge
    # differences must not incorrectly transfer neighboring cadastral parcels.
    protected_union = unary_union([polygon(b) for b in protected if b['id'] != 'salvador'])
    parents = defaultdict(list)
    for b in cartography['buildings']:
        if b.get('parentId'): parents[b['parentId']].append(b)
    buildings, chosen, rejected = [], [], []
    for parent, parts in parents.items():
        shape = unary_union([polygon(b) for b in parts])
        if shape.is_empty or not (selection.covers(shape.centroid) or shape.intersection(selection).area > shape.area*.5): continue
        if parent == core_parent or shape.intersection(reserved).area > max(.5,shape.area*.01):
            rejected.append({'parentId':parent,'reason':'Detailed church or threshold ownership'}); continue
        if any(str(b['id']) in protected_ids for b in parts) or shape.intersection(protected_union).area > .25:
            rejected.append({'parentId':parent,'reason':'Retained detailed context owner'}); continue
        chosen.append(parent)
        for part in parts:
            row=dict(part); row['contextComponent']='salvador-entorno'; buildings.append(row)
    chosen_shape=unary_union([polygon(b) for b in buildings])
    duplicates,residuals=[],[]
    for b in cartography['buildings']:
        if b.get('parentId') or str(b['id']) in protected_ids or str(b['id']) == '77444950': continue
        shape=polygon(b); overlap=shape.intersection(chosen_shape).area/shape.area if shape.area else 0
        if overlap > .7: duplicates.append(str(b['id']))
        elif overlap > .2:
            remaining=shape.difference(chosen_shape).difference(reserved).difference(protected_union)
            parts=[p for p in polygons(remaining) if p.area>2]
            if not parts: continue
            duplicates.append(str(b['id']))
            parent=max(chosen,key=lambda name:shape.intersection(unary_union([polygon(p)for p in parents[name]])).area)
            for i,part in enumerate(parts):
                row=dict(b);row.update({'id':str(b['id'])+'-residual-'+str(i),'sourceId':str(b['id']),'parentId':parent,
                    'coordinates':[geographic(p)for p in part.exterior.coords],
                    'holes':[[geographic(p)for p in ring.coords]for ring in part.interiors],
                    'contextComponent':'salvador-entorno','derivedClip':True})
                buildings.append(row);residuals.append({'id':row['id'],'sourceId':str(b['id']),'parentId':parent,
                    'sourceCoordinates':b['coordinates'],'areaM2':part.area,
                    'method':'OSM residual after cadastral coverage and existing owners; registration fragments below2m² omitted.'})
    retained=retained_paving(owners)
    roads,fully_replaced=[],[]
    old_road_ids={str(v) for old in owners.values() for v in old.get('excludedRoadIds',[])}
    for road in cartography['roads']:
        if str(road['id']) in old_road_ids or road.get('area')=='yes': continue
        axis=LineString([project(p) for p in road['coordinates']])
        if not axis.intersects(selection): continue
        clip=axis.intersection(selection).difference(reserved).difference(retained)
        lines=[line for line in (clip.geoms if hasattr(clip,'geoms') else[clip]) if line.geom_type=='LineString' and line.length>.2]
        if not lines: continue
        whole=axis.difference(unary_union(lines)).length<.02
        if whole: fully_replaced.append(str(road['id']))
        for i,line in enumerate(lines):
            row=dict(road);row.update({'id':str(road['id'])+(''if whole else'-fragment-'+str(i)),
                'sourceId':str(road['id']),'sourceCoordinates':road['coordinates'],
                'coordinates':[geographic(p)for p in line.coords],'contextComponent':'salvador-entorno','replacesWholeSource':whole})
            roads.append(row)
    mapped_plaza=next(s for s in cartography['squares'] if str(s['id'])=='733188295')
    plaza=polygon(mapped_plaza)
    # This separate northwest triangle is the named Plaça del Salvador.
    # Its outer walking edge follows the Daroqui/Valencia/OSM pedestrian axes;
    # the planted interior has its own mapped OSM park boundary.
    north_plaza=Polygon([project(p) for p in [[-.2728864,39.677231],[-.2727443,39.6771886],
        [-.2726505,39.677163],[-.2725191,39.6771155],[-.2726279,39.6770009],[-.2727265,39.6769362],[-.272796,39.6769097]]])
    garden=next(g for g in cartography['landcover'] if str(g['id'])=='77445077')
    garden_shape=polygon(garden)
    height_review=[]
    for b in buildings:
        h,levels=b.get('surfaceHeightEstimate'),b.get('levels')
        if not b.get('height') and h and levels and levels>=2 and h<levels*1.75:
            height_review.append({'id':b['id'],'surfaceHeightEstimate':h,'cadastralLevels':levels,
                'displayHeightM':levels*3,'method':'Cadastral floor count × 3m',
                'reason':'Surface estimate below1.75m per mapped floor; original source retained, displayed height interpretive.'})
    context={'schemaVersion':1,'id':'salvador-context','coordinate':site['coordinate'],'researchDate':'2026-11-20',
        'districtOutline':[geographic(p)for p in selection.exterior.coords],
        'districtOutlineSource':'Graphic selection45m around the cadastral church; not the legal BIC protection boundary.',
        'selectionRadiusM':45,'provenanceTextCodes':cartography.get('provenanceTextCodes',{}),
        'coreBuildings':core,'associatedBuildings':[],'buildings':buildings,'roads':roads,'surfaces':[],
        'gardens':[dict(garden,contextComponent='salvador-entorno')],'gardenMesh':grid_mesh(garden_shape),
        'coreOwnership':{'sourceBuildingPartIds':sorted(core_ids),'OSMBuildingIds':['77444950'],
            'thresholdOutline':[geographic(p)for p in threshold.exterior.coords],
            'plazaOutline':mapped_plaza['coordinates'],'northPlazaOutline':[geographic(p)for p in north_plaza.exterior.coords],
            'plazaSourceId':'733188295','gardenSourceId':'77445077',
            'plazaDistinction':'Mapped southwest pedestrian platform and separate northwest garden triangle are distinct. The 1991–1992 north-side demolition statement is not assigned to either outline without further evidence.'},
        'ownershipTransfers':transfers,'heightReview':height_review,'sourceResiduals':residuals,
        'excludedBuildingIds':sorted({str(b['id'])for b in buildings}|set(duplicates)),
        'coreExcludedBuildingIds':sorted(core_ids|{'77444950'}),'excludedRoadIds':sorted(set(fully_replaced)|{'733188295'}),
        'protectedFootprints':protected,
        'focusCoordinates':{'salvador-plaza':geographic((453,256)),'salvador-entorno':geographic((451,214))},
        'focusSpecs':{
            'salvador-plaza':{'label':'La plataforma junto al templo','radius':17,'targetCoordinates':geographic((453,254)),
                'targetHeight':6,'far':[-14,23,6],'near':[-13,.8,8],'fov':60,'minDistance':3},
            'salvador-entorno':{'label':'La plaza ajardinada y el Raval','radius':24,'targetCoordinates':geographic((458,235)),
                'targetHeight':6,'far':[-32,27,-36],'near':[-16,5,-19],'fov':54,'minDistance':4}},
        'readingColor':'#83a799',
        'facadeNote':'Huellas, patios y partes de Catastro preservados. Fachadas domésticas, huecos, carpinterías, balcones y remates interpretativos; la documentación visual orienta su carácter sin medir cada vivienda.',
        'roofNote':'Alturas del IGN MDSn o plantas catastrales; aleros y cubiertas menores interpretados. Los conflictos graves se registran y usan plantas×3m conservando las cifras fuente.',
        'pavingNote':'La plataforma oeste/sur utiliza el área peatonal OSM733188295. El triángulo noroeste se infiere de sus ejes urbanos y se distingue del jardín OSM77445077. Ninguno se identifica automáticamente con la plaza mencionada por el expediente histórico.',
        'vegetationNote':'Jardín registrado por OSM y visible en PNOA y fotografías GVA. Especies, ejemplares, tamaños y posiciones interiores son una composición interpretativa, no un inventario botánico.',
        'stairNote':'Ejes OSM y, cuando existen, etiquetas stepCount conservados. Anchuras, alturas de contrahuella y barandillas se ajustan al relieve de visualización, no certifican accesibilidad física.',
        'preservationNote':'Se preservan íntegros los seis contextos detallados anteriores. Sólo se retiran las superficies genéricas dentro de los nuevos pavimentos; las vías parciales mantienen sus continuaciones exteriores.',
        'sources':[
            {'id':'salvador-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado; no información catastral oficial'},
            {'id':'salvador-context-osm','title':'OpenStreetMap · plataforma peatonal del Salvador','url':'https://www.openstreetmap.org/way/733188295','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'salvador-context-park','title':'OpenStreetMap · jardín de la Plaça del Salvador','url':'https://www.openstreetmap.org/way/77445077','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'salvador-context-mdt','title':'IGN MDT05 y MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY4.0'},
            {'id':'salvador-context-pnoa','title':'PNOA Máxima Actualidad','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY4.0'},
            {'id':'salvador-context-gva','title':'Turisme Comunitat Valenciana · Iglesia Parroquial de El Salvador','url':'https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/iglesia-parroquial-de-el-salvador-5'}],
        'selectionStats':{'contextParts':len(buildings),'cadastralParts':len(buildings)-len(residuals),'OSMResidualParts':len(residuals),
            'contextParcels':len(chosen),'mappedCourtyards':sum(len(b.get('holes',[]))for b in buildings),
            'roads':len(roads),'fullyReplacedRoads':len(fully_replaced),'OSMDuplicates':duplicates,
            'retainedOwners':list(owners),'rejectedParcels':rejected,'heightConflicts':len(height_review)},
        'inputHashes':{n:hashlib.sha256((DATA/(n+'.json')).read_bytes()).hexdigest()for n in ['cartography','landmarks',*[name+'-context'for name in owners]]}}
    context['publicSpaceAreas']=[dict(mapped_plaza,contextComponent='salvador-plaza'),
        {'id':'north-plaza-inferred','coordinates':[geographic(p)for p in north_plaza.exterior.coords],
         'contextComponent':'salvador-entorno','derived':True}]
    context['stairways']=[dict(r)for r in roads if r['kind']=='steps']
    stair_shapes=[LineString([project(p)for p in r['coordinates']]).buffer(width(r)/2,cap_style='flat')for r in context['stairways']]
    context['stairFootprints']=[{'id':r['id'],'coordinates':[geographic(p)for p in s.exterior.coords]} for r,s in zip(context['stairways'],stair_shapes)]
    context['plantedPositions']=[{'coordinate':geographic((x,z)),'type':kind,'heightM':h,'sourceConfidence':'Interpretive placement inside mapped garden'}
        for x,z,kind,h in [(449,205,'broadleaf',7),(455,208,'palm',6),(450,215,'broadleaf',6.5),
                           (446,221,'cypress',8),(454,217,'cypress',7),(446,210,'broadleaf',5.8)]]
    for tree in context['plantedPositions']:
        assert garden_shape.buffer(-.4).covers(__import__('shapely').geometry.Point(project(tree['coordinate']))),tree
    prepare_pavement(context,cartography,reserved,retained,plaza,north_plaza,garden_shape,unary_union(stair_shapes))
    (DATA/'salvador-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(context['selectionStats'],ensure_ascii=False));return context


def prepare_pavement(context, cartography, reserved, retained, plaza, north_plaza, garden, stairs):
    candidates = unary_union([LineString([project(p) for p in r['coordinates']])
                             .buffer(width(r)/2, cap_style='round', join_style='mitre',
                                     mitre_limit=2, quad_segs=4) for r in context['roads'] if r['kind']!='steps'] + [plaza,north_plaza])
    obstacles = unary_union([polygon(b) for b in cartography['buildings'] if b.get('parentId')]
                            + [polygon(b) for b in context['buildings']]
                            + [polygon(b) for b in context['protectedFootprints']])
    courtyards = unary_union([Polygon(ring) for p in polygons(obstacles) for ring in p.interiors])
    protected = unary_union([reserved, retained])
    paving = candidates.difference(obstacles).difference(protected).difference(courtyards).difference(garden).difference(stairs)
    plaza_paving = paving.intersection(plaza)
    street_paving = paving.difference(plaza)
    context['surfaces'] = [{'id':'salvador-plaza-'+str(i),'coordinates':[geographic(p) for p in part.exterior.coords],
         'holes':[[geographic(p) for p in ring.coords] for ring in part.interiors],
         'kind':'public-square','derived':True,'sourceId':'Public void inferred from mapped footprints and street axes'}
         for i,part in enumerate(polygons(plaza_paving))]
    # Partial source ways must keep their exterior continuations and terrain
    # grading. Suppress only their generic render inside our detailed paving;
    # otherwise generic curbs protrude through the new plaza as pale slivers.
    # A 1 cm inward guard keeps masks off adjacent cadastral walls. Masks have
    # no holes because the generic city exclusion contract uses simple rings.
    masks = []
    candidates = [('salvador-plaza', plaza_paving),('salvador-north-plaza',paving.intersection(north_plaza))] + [
        (str(r['sourceId']), LineString([project(p) for p in r['coordinates']])
         .buffer(width(r)/2, cap_style='round', join_style='mitre',
                 mitre_limit=2, quad_segs=4).intersection(paving))
        for r in context['roads'] if not r['replacesWholeSource'] and r['kind']!='steps']
    for source_id, shape in candidates:
        for part in polygons(shape.buffer(-.01).simplify(.00005, preserve_topology=True)):
            pieces = list(polygons(shapely.constrained_delaunay_triangles(part))) if part.interiors else [part]
            for piece in pieces:
                if piece.area < .01:
                    continue
                masks.append({'sourceId':source_id,
                              'coordinates':[geographic(p) for p in piece.exterior.coords],
                              'scope':'Generic render only; source street axes, relief and exterior continuations remain.'})
    for stair in context.get('stairFootprints',[]):
        masks.append({'sourceId':stair['id'],'coordinates':stair['coordinates'],'scope':'Only the modeled stair footprint; source axis and external continuation remain.'})
    context['genericStreetExclusions'] = masks
    vertices, lookup, indices, emitted = [], {}, [], []
    group_indices = {'salvador-plaza':[],'salvador-entorno':[]}
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
                    # The mapped platform is tagged concrete:plates, whereas
                    # nearby streets use paving stones. Split at the source
                    # boundary as well as the terrain cell, never by a triangle
                    # centroid that would produce a saw-toothed material seam.
                    for component, region in [('salvador-plaza',plaza_paving),('salvador-entorno',street_paving)]:
                        for piece in polygons(region.intersection(cell)):
                            for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                                if tri.area < 1e-9:
                                    continue
                                ids = [vertex(p) for p in list(tri.exterior.coords)[:3]]
                                if len(set(ids)) == 3:
                                    indices += ids
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
            'protectedPavingOverlapM2':actual.intersection(protected).area,'gardenOverlapM2':actual.intersection(garden).area,'stairOverlapM2':actual.intersection(stairs).area,
            'triangleOverlapM2':sum(p.area for p in emitted)-actual.area,
            'boundaryEdges':len(boundary)}
    report['pass']=all(abs(report[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','buildingOverlapM2',
        'privateCourtyardOverlapM2','protectedPavingOverlapM2','triangleOverlapM2','gardenOverlapM2','stairOverlapM2'])
    assert report['pass'],report
    context['pavementMesh']={'coordinateSystem':'Atlas x/z metres; origin [-0.278,39.679].',
        'terrainGrid':{'spacingM':2.5,'originXZ':[0,0],'diagonal':'x=z within each cell'},
        'method':report['method'],'vertices':vertices,
        'groups':[{'component':key,'indices':values,
                   'sourceIds':sorted({r['sourceId'] for r in context['roads']})} for key,values in group_indices.items() if values],
        'boundaryEdges':boundary,'coverage':report}
    context['pavingNote']+=' Superficie continua ajustada a los triángulos finales del relieve, con holgura gráfica de 10,5 cm y bordes cerrados.'
    OUT.mkdir(exist_ok=True)
    (OUT/'salvador-context-pavement-qa.json').write_text(json.dumps(report,indent=2)+'\n')


if __name__=='__main__':
    build_context()
