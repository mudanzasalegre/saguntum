"""Prepare Mestre Penya surroundings without transferring previous ownership.

The two cadastral parts of 3558701 are the museum. The technical drawings
published in 2025 locate the domestic wing inside that parcel; 3558702 is a
neighbour, not an invented museum annex. Requires Shapely 2.1+ offline only.
"""
from pathlib import Path
from collections import defaultdict
import hashlib
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'dist/assets/data'
OUT = ROOT / 'research/validation-v17'
SCALE = 111320 * math.cos(math.radians(39.679))
read = lambda n: json.loads((DATA / (n + '.json')).read_text())
project = lambda p: ((p[0] + .278) * SCALE, (39.679 - p[1]) * 111320)
geo = lambda p: [round(-.278 + p[0]/SCALE, 9), round(39.679-p[1]/111320, 9)]


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
        return {'living_street':3.4, 'pedestrian':3.1, 'footway':1.6,
                'path':1.4, 'steps':1.4}.get(road.get('kind'), 4.5)


def source_paving(context):
    mesh = context.get('pavementMesh')
    if mesh:
        return unary_union([Polygon([mesh['vertices'][k] for k in group['indices'][i:i+3]])
            for group in mesh['groups'] for i in range(0,len(group['indices']),3)])
    return unary_union([polygon(s) for s in context.get('surfaces',[])] +
        [LineString([project(p) for p in r['coordinates']]).buffer(width(r)/2,cap_style='flat')
         for r in context.get('roads',[]) if r.get('area')!='yes'])


def prepare_paving(context, cartography, reserved, retained, plaza):
    road_shapes = [LineString([project(p) for p in r['coordinates']]).buffer(
        width(r)/2, cap_style='round', join_style='mitre', mitre_limit=2, quad_segs=4)
        for r in context['roads']]
    candidates = unary_union(road_shapes+[plaza])
    # Preserve private courts, the existing passage beneath the Judería arc,
    # and every previously detailed surface. New work fills only free gaps.
    obstacles = unary_union([polygon(b) for b in cartography['buildings'] if b.get('parentId')]
        + [polygon(b) for b in context['protectedFootprints']])
    courtyards = unary_union([Polygon(ring) for p in polygons(obstacles) for ring in p.interiors])
    paving = candidates.difference(obstacles).difference(reserved).difference(retained).difference(courtyards)
    plaza_paving = paving.intersection(plaza)
    regions = [('museo-plaza',plaza_paving), ('museo-entorno',paving.difference(plaza))]
    vertices, lookup, groups, triangles = [], {}, {}, []
    def vertex(p):
        key = tuple(round(v,6) for v in p)
        if key not in lookup:
            lookup[key]=len(vertices);vertices.append(list(key))
        return lookup[key]
    if not paving.is_empty:
        ax,az,bx,bz=paving.bounds
        for ix in range(math.floor(ax/2.5),math.ceil(bx/2.5)):
            for iz in range(math.floor(az/2.5),math.ceil(bz/2.5)):
                x,z=ix*2.5,iz*2.5
                if not paving.intersects(box(x,z,x+2.5,z+2.5)):continue
                cells=[Polygon([(x,z),(x,z+2.5),(x+2.5,z+2.5)]),
                       Polygon([(x,z),(x+2.5,z+2.5),(x+2.5,z)])]
                for cell in cells:
                    for component,region in regions:
                        for piece in polygons(region.intersection(cell)):
                            for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                                if tri.area<1e-9:continue
                                ids=[vertex(p) for p in list(tri.exterior.coords)[:3]]
                                if len(set(ids))==3:
                                    groups.setdefault(component,[]).extend(ids)
                                    triangles.append(Polygon([vertices[i] for i in ids]))
    boundary=[]
    for p in polygons(paving):
        for ring in [p.exterior,*p.interiors]:
            points=list(ring.coords)
            for a,b in zip(points,points[1:]):
                dx,dz=b[0]-a[0],b[1]-a[1];ts={0.,1.}
                for origin,delta in [(a[0],dx),(a[1],dz),(a[1]-a[0],dz-dx)]:
                    if abs(delta)<1e-10:continue
                    lo,hi=sorted([origin,origin+delta])
                    for k in range(math.floor(lo/2.5)+1,math.ceil(hi/2.5)):
                        t=(k*2.5-origin)/delta
                        if 1e-8<t<1-1e-8:ts.add(t)
                ids=[vertex((a[0]+dx*t,a[1]+dz*t))for t in sorted(ts)]
                boundary.extend([u,v] for u,v in zip(ids,ids[1:])if u!=v)
    actual=unary_union(triangles)
    qa={'areaM2':paving.area,'plazaNewAreaM2':plaza_paving.area,
        'plazaExistingPavingM2':plaza.intersection(retained).area,
        'vertices':len(vertices),'triangles':len(triangles),'boundaryEdges':len(boundary),
        'uncoveredAreaM2':paving.difference(actual).area,
        'excessAreaM2':actual.difference(paving).area,
        'buildingOverlapM2':actual.intersection(obstacles).area,
        'privateCourtOverlapM2':actual.intersection(courtyards).area,
        'previousPavingOverlapM2':actual.intersection(retained).area,
        'coreOverlapM2':actual.intersection(reserved).area,
        'triangleOverlapM2':sum(p.area for p in triangles)-actual.area}
    qa['pass']=all(abs(qa[k])<.001 for k in ['uncoveredAreaM2','excessAreaM2','buildingOverlapM2',
        'privateCourtOverlapM2','previousPavingOverlapM2','coreOverlapM2','triangleOverlapM2'])
    assert qa['pass'],qa
    context['pavementMesh']={'coordinateSystem':'Atlas x/z metres; origin [-0.278,39.679].',
        'terrainGrid':{'spacingM':2.5,'originXZ':[0,0],'diagonal':'x=z within each cell'},
        'method':'Source street strips and inferred public void; retained paving subtracted; exact 2.5m terrain-cell triangulation.',
        'vertices':vertices,'groups':[{'component':k,'indices':v,
            'sourceIds':sorted({r['sourceId'] for r in context['roads']})}for k,v in groups.items()],
        'boundaryEdges':boundary,'coverage':qa}
    context['surfaces']=[{'id':'museo-plaza-fragment-'+str(i),'kind':'public-square',
        'coordinates':[geo(p)for p in shape.exterior.coords],
        'holes':[[geo(p)for p in ring.coords]for ring in shape.interiors],
        'derived':True,'sourceId':'Public void inferred from street axes and cadastral walls'}
        for i,shape in enumerate(polygons(plaza_paving))]
    masks=[]
    for part in polygons(paving.buffer(-.01).simplify(.00005,preserve_topology=True)):
        pieces=list(polygons(shapely.constrained_delaunay_triangles(part)))if part.interiors else[part]
        for piece in pieces:
            if piece.area>.01:masks.append({'coordinates':[geo(p)for p in piece.exterior.coords],
                'scope':'Only generic street rendering; source axes, retained detailed streets and terrain remain.'})
    context['genericStreetExclusions']=masks
    (OUT/'museo-context-pavement-qa.json').write_text(json.dumps(qa,indent=2)+'\n')


def build_context():
    cartography,landmarks=read('cartography'),read('landmarks')
    site=next(s for s in landmarks['sites']if s['id']=='museo')
    owner_names=['santa-maria','plaza-mayor','juderia','calvario','berenguer','sangre','salvador']
    owners={name:read(name+'-context')for name in owner_names}
    core=[dict(b)for b in cartography['buildings']if b.get('parentId')=='3558701YJ3935H']
    core_ids={str(b['id'])for b in core};core_shape=unary_union([polygon(b)for b in core])
    selection=core_shape.buffer(45)
    protected_ids={str(k)for old in owners.values()for k in old.get('excludedBuildingIds',[])}
    protected,shared_buildings,shared_roads,shared_paving=[],[],[],[]
    for owner,old in owners.items():
        for b in old.get('buildings',[])+old.get('coreBuildings',[])+old.get('associatedBuildings',[]):
            for i,part in enumerate([b,*b.get('secondaryFootprints',[])]):
                if len(part.get('coordinates',[]))<3:continue
                if not polygon(part).intersects(selection.buffer(8)):continue
                row={'id':str(b['id'])+'-component-'+str(i),'sourceId':str(b['id']),
                     'coordinates':part['coordinates'],'holes':part.get('holes',[]),'owner':owner}
                protected.append(row)
                shared_buildings.append({'sourceId':str(b['id']),'owner':owner,
                    'parentId':b.get('parentId'),'surfaceHeightEstimate':b.get('surfaceHeightEstimate'),
                    'levels':b.get('levels'),'relationship':'Rendered once by the existing visit; visually reused by the museum.'})
        for road in old.get('roads',[]):
            if len(road['coordinates'])<2:continue
            if not LineString([project(p)for p in road['coordinates']]).intersects(selection):continue
            shared_roads.append({'id':str(road['id']),'sourceId':str(road.get('sourceId',road['id'])),
                'owner':owner,'name':road.get('name'),'coordinates':road['coordinates'],
                'relationship':'Existing detailed street and its continuation remain unchanged.'})
        pavement=source_paving(old)
        area=pavement.intersection(selection).area
        if area>.001:shared_paving.append({'owner':owner,'areaWithinSelectionM2':round(area,3),
            'sourceHash':hashlib.sha256((DATA/(owner+'-context.json')).read_bytes()).hexdigest()})
    arc=next(b for b in cartography['buildings']if str(b['id'])=='1303697035')
    protected.append({'id':'juderia-museum-arc','sourceId':'1303697035','owner':'juderia',
        'coordinates':arc['coordinates'],'holes':arc.get('holes',[]),'passage':True})
    protected_ids.add('1303697035')
    protected_union=unary_union([polygon(b)for b in protected])
    parents=defaultdict(list)
    for b in cartography['buildings']:
        if b.get('parentId'):parents[b['parentId']].append(b)
    buildings,chosen,rejected=[],[],[]
    for parent,parts in parents.items():
        shape=unary_union([polygon(b)for b in parts])
        if not(selection.covers(shape.centroid)or shape.intersection(selection).area>shape.area*.5):continue
        if parent=='3558701YJ3935H':continue
        if any(str(b['id'])in protected_ids for b in parts)or shape.intersection(protected_union).area>.25:
            rejected.append({'parentId':parent,'reason':'Preserved previous ownership, including partially owned parcels.'});continue
        if shape.intersection(core_shape).area>.01:continue
        chosen.append(parent)
        buildings.extend(dict(b,contextComponent='museo-entorno')for b in parts)
    chosen_shape=unary_union([polygon(b)for b in buildings]);duplicates=[]
    for b in cartography['buildings']:
        if b.get('parentId')or str(b['id'])in protected_ids:continue
        p=polygon(b)
        if p.area and p.intersection(chosen_shape).area/p.area>.7:duplicates.append(str(b['id']))
    retained=unary_union([source_paving(old)for old in owners.values()])
    old_road_ids={str(v)for old in owners.values()for v in old.get('excludedRoadIds',[])}
    roads,full=[],[]
    for road in cartography['roads']:
        if str(road['id'])in old_road_ids or road.get('area')=='yes':continue
        axis=LineString([project(p)for p in road['coordinates']])
        if not axis.intersects(selection):continue
        clip=axis.intersection(selection).difference(core_shape).difference(retained)
        lines=[p for p in (clip.geoms if hasattr(clip,'geoms')else[clip])if p.geom_type=='LineString'and p.length>.2]
        if not lines:continue
        whole=axis.difference(unary_union(lines)).length<.02
        if whole:full.append(str(road['id']))
        for i,line in enumerate(lines):
            roads.append(dict(road,id=str(road['id'])+(''if whole else'-fragment-'+str(i)),
                sourceId=str(road['id']),sourceCoordinates=road['coordinates'],
                coordinates=[geo(p)for p in line.coords],contextComponent='museo-entorno',replacesWholeSource=whole))
    # The source has no plaza polygon here. This small, sloping junction follows
    # the registered west facade and public street void, not a ceremonial square.
    plaza=Polygon([(-11.1,42.4),(-1.0,38.3),(4.0,38.3),(4.4,41.3),(1.68,43.18),
                   (.89,63.13),(-3.9,63.5),(-7.4,49.0),(-11.1,42.4)])
    height_review=[]
    for b in buildings:
        h,n=b.get('surfaceHeightEstimate'),b.get('levels')
        if not b.get('height')and h and n and n>=2 and h<n*1.75:
            height_review.append({'id':b['id'],'surfaceHeightEstimate':h,'cadastralLevels':n,
                'displayHeightM':n*3,'method':'Cadastral floor count × 3m',
                'reason':'Surface estimate below1.75m per mapped floor; original values retained, render height interpretive.'})
    context={'schemaVersion':1,'id':'museo-context','coordinate':site['coordinate'],'researchDate':'2026-11-20',
        'districtOutline':[geo(p)for p in selection.exterior.coords],
        'districtOutlineSource':'Graphic45m selection around the mapped museum; not a heritage protection boundary.',
        'selectionRadiusM':45,'provenanceTextCodes':cartography.get('provenanceTextCodes',{}),
        'coreBuildings':core,'associatedBuildings':[],'buildings':buildings,'roads':roads,'surfaces':[],
        'excludedBuildingIds':sorted({str(b['id'])for b in buildings}|set(duplicates)),
        'coreExcludedBuildingIds':sorted(core_ids|{'203064640'}),'excludedRoadIds':sorted(set(full)),
        'protectedFootprints':protected,'ownershipTransfers':{},'heightReview':height_review,
        'sharedContext':{'policy':'Reuse previous detailed geometry in place. No buildings, streets, paving or arc transfer to the museum.',
            'buildings':shared_buildings,'roads':shared_roads,'paving':shared_paving,
            'protectedArc':{'owner':'juderia','sourceId':'1303697035','coordinate':[-.2781812925,39.6785557926],
                'visitComponent':'juderia-museo','coordinates':arc['coordinates'],
                'distinction':'Arc opposite the museum, distinct from Portalet de la Sang (OSM733421700). No1321dating assigned.',
                'relationship':'The museum references the existing Judería arch and passage; it creates no second arch.'}},
        'coreOwnership':{'sourceBuildingPartIds':sorted(core_ids),'OSMBuildingIds':['203064640'],
            'parcel':'3558701YJ3935H','areaM2':round(core_shape.area,3),
            'registrationNote':'Both museum construction units fit parcel3558701 in the2025technical drawings. Parcel3558702 is retained as a neighbouring building, not a museum annex.',
            'plazaOutline':[geo(p)for p in plaza.exterior.coords],'plazaOutlineDerived':True},
        'focusCoordinates':{'museo-plaza':geo((-2,52)),'museo-arco':[-.2781812925,39.6785557926],
            'museo-juderia':geo((-30,53)),'museo-entorno':geo((15,46))},
        'focusSpecs':{
            'museo-plaza':{'label':'La replaza y la fachada del museo','radius':15,'targetCoordinates':geo((1,53)),
                'targetHeight':5,'far':[-18,17,7],'near':[-6,1.1,3],'nearEyeHeightM':2.15,'fov':58,'minDistance':2.2},
            'museo-arco':{'label':'El arco ante el museo','radius':8,'targetCoordinates':[-.2781812925,39.6785557926],
                'targetHeight':2.5,'far':[8.192,1,-5.736],'near':[6,0,-1.2],'nearEyeHeightM':2.15,'fov':57,'minDistance':1.6},
            'museo-juderia':{'label':'Sang Vella y el barrio judío','radius':22,'targetCoordinates':geo((-28,52)),
                'targetHeight':3.3,'far':[10,25,8],'near':[9,.5,-1.8],'nearEyeHeightM':2.15,'fov':58,'minDistance':1.5},
            'museo-entorno':{'label':'Castell, Dolors y Cubertorer','radius':32,'targetCoordinates':geo((15,46)),
                'targetHeight':3.2,'far':[-12,22,-6],'near':[-12,4,-6],'nearEyeHeightM':2.15,'fov':60,'minDistance':3}},
        'readingColor':'#83948a','readingLayer':'barrio',
        'facadeNote':'Las plantas de Catastro, patios y número de plantas se conservan. Los huecos, carpinterías, balcones, canales y cubiertas domésticas son interpretativos, no un levantamiento de cada vivienda.',
        'roofNote':'Alturas explícitas, IGN MDS normalizado y plantas catastrales en ese orden. Los conflictos bajos se explicitan; no se modifican los registros originales. Detalles de azoteas interpretativos.',
        'pavingNote':'Replaza inferida entre las calles Castell, Dolors y Cubertorer y la fachada catastral; no consta un perímetro OSM de plaza. Superficie en pendiente ajustada a cada triángulo del relieve final, sin explanación. Los pavimentos de Judería y Sangre se reutilizan y no se superponen.',
        'furnitureNote':'La fotografía exterior publicada por los arquitectos muestra jardineras cilíndricas y arbolillos junto al frente. Posiciones y dimensiones interpretativas; no es un inventario urbano actualizado.',
        'preservationNote':'Siete contextos anteriores preservados íntegramente, incluido el paso del arco ante el museo. Se añaden únicamente parcelas sin dueño anterior y fragmentos públicos libres.',
        'publicSpaceAreas':[{'id':'museo-replaza-inferred','coordinates':[geo(p)for p in plaza.exterior.coords],
            'derived':True,'sourceId':'Registered cadastral facade and OSM street axes','contextComponent':'museo-plaza'}],
        'furniture':[{'id':'front-planter-'+str(i+1),'coordinate':geo((x,z)),
            'kind':'cylindrical-planter','heightM':.5,'radiusM':.4,'treeHeightM':1.9,
            'source':'museo-context-restoration','interpretive':True}
            for i,(x,z)in enumerate([(-1.2,45.5),(-1.5,49),(-1.8,58.6),(-2,62.1)])],
        'sources':[
            {'id':'museo-context-restoration','title':'Vía Arquitectura · Casa del Mestre Peña · memoria de los arquitectos y fotografías de la rehabilitación','url':'https://via-arquitectura.net/arav07/096-arav07.htm'},
            {'id':'museo-context-project2025','title':'Fernando Cos-Gayón López · Proyecto de conservación del Museo Histórico de Sagunto · 1 agosto 2025, pp. 4 y 9–11','url':'https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=ihKowu21j5t8CwPcm4L4FDXBIGteKJw%2BbX4Xx1Uy701YxEe7nC3Lu31H68efJ5SUYcvrbM14rcAdZdZL6CYnAnwSmtNeOCNrKZWURXQUmMGB0nvVKRzfe4rpHcnlPhSZ&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D','date':'2025-08-01','note':'Inspección del 14 julio 2025; expediente publicado en 2026. Sustenta el encaje, no acredita obras de 2026 terminadas.'},
            {'id':'museo-context-catastro','title':'Catastro INSPIRE Buildings · Sagunto/Sagunt','url':'https://www.catastro.hacienda.gob.es/webinspire/','date':'2026-08-21','license':'Producto derivado; no información catastral oficial'},
            {'id':'museo-context-osm','title':'OpenStreetMap · arco frente al Museo Arqueológico','url':'https://www.openstreetmap.org/way/1303697035','license':'© OpenStreetMap contributors · ODbL1.0'},
            {'id':'museo-context-mdt','title':'IGN MDT05 y MDS normalizado','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','license':'IGN/CNIG · CC BY4.0'},
            {'id':'museo-context-pnoa','title':'PNOA · tonos de las cubiertas','url':'https://www.ign.es/wms-inspire/pnoa-ma','license':'IGN/CNIG · CC BY4.0'}],
        'selectionStats':{'contextParts':len(buildings),'contextParcels':len(chosen),'mappedCourtyards':sum(len(b.get('holes',[]))for b in buildings),
            'roads':len(roads),'fullyReplacedRoads':len(full),'OSMDuplicates':duplicates,'retainedOwners':owner_names,
            'reusedBuildingParts':len(shared_buildings),'reusedRoadFragments':len(shared_roads),
            'rejectedParcels':rejected,'heightConflicts':len(height_review)},
        'inputHashes':{name:hashlib.sha256((DATA/(name+'.json')).read_bytes()).hexdigest()
            for name in ['cartography','landmarks',*[owner+'-context'for owner in owner_names]]}}
    OUT.mkdir(exist_ok=True)
    prepare_paving(context,cartography,core_shape,retained,plaza)
    for furniture in context['furniture']:
        point=Point(project(furniture['coordinate']))
        assert not core_shape.intersects(point.buffer(furniture['radiusM']))
        assert not protected_union.intersects(point.buffer(furniture['radiusM']))
    (DATA/'museo-context.json').write_text(json.dumps(context,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in context['selectionStats'].items()if k!='rejectedParcels'},ensure_ascii=False))
    return context


if __name__=='__main__':
    build_context()
