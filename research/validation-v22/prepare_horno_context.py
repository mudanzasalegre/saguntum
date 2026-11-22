"""Alto Horno nº 2: mapped streets, rehabilitated reception and immediate setting.

Source footprints and OSM axes stay unchanged. The forecourt, enclosure, rail
alignment and plants are traced from a georeferenced PNOA image; their minor
construction details and all unlabelled heights remain visual interpretations.
The industrial monument owns its furnace, foundations and skip. Talleres,
Museo and the rest of the atlas retain their existing owners.
"""
from pathlib import Path
import hashlib
import json
import math
import shapely
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT/'dist/assets/data'
OUT = ROOT/'research/validation-v22'
SCALE = 111320*math.cos(math.radians(39.679))
COORDINATE = [-0.2203074, 39.6542918]
project = lambda p: ((p[0]+.278)*SCALE, (39.679-p[1])*111320)
geo = lambda p: [round(-.278+p[0]/SCALE, 9), round(39.679-p[1]/111320, 9)]
CX,CZ = project(COORDINATE)
read = lambda name: json.loads((DATA/(name+'.json')).read_text())
PHOTO_BOUNDS = {'west':-.22105,'east':-.21930,'south':39.65365,'north':39.65500}
PHOTO_URL = 'https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.3.0&request=GetMap&layers=OI.OrthoimageCoverage&styles=&crs=EPSG%3A4326&bbox=39.65365%2C-0.22105%2C39.65500%2C-0.21930&width=1400&height=1400&format=image%2Fjpeg'
# Pixel points are stored rather than hidden in a drawing. PNOA is a reference
# mosaic; elevated parts can be displaced by perspective. Trace ground edges.
def photo(p):
    x,y=p
    return project((PHOTO_BOUNDS['west']+x/1400*(PHOTO_BOUNDS['east']-PHOTO_BOUNDS['west']),
                    PHOTO_BOUNDS['north']-y/1400*(PHOTO_BOUNDS['north']-PHOTO_BOUNDS['south'])))

def polygons(shape):
    if shape.geom_type=='Polygon' and shape.area>1e-8:
        yield shape
    elif hasattr(shape,'geoms'):
        for item in shape.geoms:
            yield from polygons(item)

def lines(shape):
    if shape.geom_type=='LineString' and shape.length>.02:
        yield shape
    elif hasattr(shape,'geoms'):
        for item in shape.geoms:
            yield from lines(item)

def polygon(row):
    return Polygon([project(p) for p in row['coordinates']],[[project(p) for p in ring] for ring in row.get('holes',[])]).buffer(0)

def record(id,shape,**extra):
    return {'id':id,'coordinates':[geo(p) for p in shape.exterior.coords],
            'holes':[[geo(p) for p in ring.coords] for ring in shape.interiors],**extra}

def line_record(id,shape,**extra):
    return {'id':id,'coordinates':[geo(p) for p in shape.coords],**extra}

def triangulate_regions(regions):
    """Clip each paving face to the actual 5 m Puerto terrain triangles.

    Puerto's core axes start at 4100/1450, both multiples of five; its terrain
    cells use the x=z diagonal. All these surroundings lie within that core.
    """
    paving=unary_union([shape for _,shape in regions]);vertices=[];lookup={};groups={};triangles=[]
    def vertex(p):
        key=tuple(round(v,6) for v in p)
        if key not in lookup:
            lookup[key]=len(vertices);vertices.append(list(key))
        return lookup[key]
    minx,minz,maxx,maxz=paving.bounds
    for ix in range(math.floor(minx/5),math.ceil(maxx/5)):
        for iz in range(math.floor(minz/5),math.ceil(maxz/5)):
            x,z=ix*5,iz*5
            if not paving.intersects(box(x,z,x+5,z+5)):
                continue
            for cell in [Polygon([(x,z),(x,z+5),(x+5,z+5)]),Polygon([(x,z),(x+5,z+5),(x+5,z)])]:
                for component,shape in regions:
                    for piece in polygons(shape.intersection(cell)):
                        for tri in shapely.constrained_delaunay_triangles(piece).geoms:
                            if tri.area<1e-8:
                                continue
                            ids=[vertex(p) for p in list(tri.exterior.coords)[:3]]
                            if len(set(ids))==3:
                                groups.setdefault(component,[]).extend(ids);triangles.append(Polygon([vertices[i] for i in ids]))
    return vertices,groups,triangles,paving


def build():
    cartography=read('port-cartography')
    source=next(s for s in read('port-industrial')['sites'] if s['id']=='horno')
    center=Point(CX,CZ);selection=center.buffer(160,quad_segs=24).intersection(box(4100,1450,5500,2900))
    all_buildings=[(r,polygon(r)) for r in cartography['buildings']]
    core_parts=[dict(r) for r,p in all_buildings if r.get('parentId')=='8532501YJ3983S' or str(r['id'])=='733110249']
    core_ids={str(r['id']) for r in core_parts}
    main_coords=source['pavilionFootprint'][:4]
    main=Polygon([project(p) for p in main_coords])
    corridor_source=next(r for r in core_parts if r['id']=='cat-8532501YJ3983S_part2-0')
    corridor=polygon(corridor_source)
    pavilion=Polygon([project(p) for p in source['pavilionFootprint']]).union(corridor)
    chosen_parents={'8432308YJ3983S','8535807YJ3983S'}
    buildings=[];height_reviews=[]
    for r,p in all_buildings:
        if r.get('parentId') not in chosen_parents:
            continue
        # The long western shed has no usable MDSnE height. One storey remains
        # one storey; its visual eaves are explicitly not an official measure.
        h=float(r.get('surfaceHeightEstimate') or 4.6)
        buildings.append(dict(r,contextComponent='horno-entorno',displayHeightM=h,
            renderingType='low-industrial',roofForm='shallow-pitched' if r['parentId']=='8432308YJ3983S' else 'flat'))
        height_reviews.append({'id':str(r['id']),'displayHeightM':h,
            'method':'Existing IGN MDSnE2.5 estimate' if r.get('surfaceHeightEstimate') else 'Visual one-storey industrial fallback',
            'interpretive':True,'measuredFacade':False})
    owned_ids=core_ids|{str(r['id']) for r in buildings}
    all_footprints=unary_union([p for r,p in all_buildings if str(r['id']) not in core_ids])
    own_footprints=unary_union([polygon(r) for r in buildings])
    # Ground edges of the island and the lower industrial yard, digitized from
    # PNOA. The narrow northern median is deliberately clipped, not invented
    # as a complete new boulevard or protected cadastral boundary.
    island_pixels=[(785,0),(849,0),(823,154),(809,265),(810,348),(821,412),(852,479),(887,543),(914,612),(928,683),(925,751),(900,818),(854,878),(793,922),(720,951),(645,963),(565,952),(495,924),(443,879),(410,822),(389,759),(384,694),(392,629),(413,570),(446,521),(493,485),(549,456),(607,432),(661,416),(708,394),(743,362),(760,321),(770,260),(778,158)]
    island=Polygon([photo(p) for p in island_pixels]).buffer(0).intersection(selection)
    yard_pixels=[(648,435),(598,445),(542,466),(492,495),(451,536),(425,581),(409,630),(406,692),(413,753),(437,810),(479,854),(530,888),(583,909),(635,913),(681,894),(713,863),(732,827),(741,782),(737,747),(719,718),(696,691),(670,675),(644,654),(624,589),(611,520),(602,477),(648,466)]
    yard=Polygon([photo(p) for p in yard_pixels]).buffer(0)
    foundation=center.buffer(15.35,quad_segs=48)
    # The context never re-renders the furnace's own foundation. A small
    # underlap beneath its edge prevents a seam after floating-point rounding.
    lower_yard=yard.difference(foundation).difference(main)
    upper_apron=island.difference(yard).difference(pavilion)
    roads=[];replaced=[];road_shapes=[]
    for row in cartography['roads']:
        if len(row['coordinates'])<2 or row.get('area')=='yes' or row.get('bridge')=='yes' or row.get('tunnel')=='yes':
            continue
        axis=LineString([project(p) for p in row['coordinates']])
        if not axis.intersects(selection):
            continue
        name=row.get('name','').lower()
        width=10.0 if 'ojos' in name else 9.0 if str(row['id']) in {'156439652','397917845','397917848'} else 5.8 if 'hornos' in name else 7.0 if row.get('kind')=='service' else 4.5
        original_width=row.get('width')
        if original_width:
            try:width=float(original_width)
            except ValueError:pass
        fragments=list(lines(axis.intersection(selection)))
        whole=selection.covers(axis)
        if whole:replaced.append(str(row['id']))
        for j,part in enumerate(fragments):
            roads.append(dict(row,id=str(row['id'])+'-fragment-'+str(j),sourceId=str(row['id']),
                sourceCoordinates=row['coordinates'],coordinates=[geo(p) for p in part.coords],
                displayWidthM=width,widthInterpretive=not bool(original_width),replacesWholeSource=whole,
                contextComponent='horno-entorno'))
            road_shapes.append(part.buffer(width/2,cap_style='flat',join_style='round'))
    road_area=unary_union(road_shapes).intersection(selection).difference(island).difference(all_footprints.buffer(.12))
    outer_walk=unary_union(road_shapes).buffer(2.1).difference(unary_union(road_shapes)).intersection(selection).difference(island).difference(all_footprints.buffer(.15))
    # Preserve vacant industrial land and all neighbouring owners. The new
    # surfaces only cover existing circulation strips, not the whole selection.
    regions=[('horno-road',road_area),('horno-sidewalk',outer_walk),('horno-forecourt',upper_apron),('horno-yard',lower_yard)]
    previous=Polygon();disjoint=[]
    for key,shape in regions:
        shape=shape.difference(previous);disjoint.append((key,shape));previous=previous.union(shape)
    vertices,groups,triangles,paving=triangulate_regions(disjoint)
    surfaces=[record(key+'-'+str(i),p,component=key,sourceId='horno-pnoa' if key in ['horno-forecourt','horno-yard'] else 'horno-osm',interpretive=True)
              for key,shape in disjoint for i,p in enumerate(polygons(shape))]
    # The line follows the visible recovered-sleeper retaining lip. Keep its
    # eastern end open at the skip and the visitor connection.
    retaining_pixels=yard_pixels[:18]
    retaining=LineString([photo(p) for p in retaining_pixels])
    # The fence continues beside the ramp, but is interrupted before the skip
    # footprint and at the visitor access. Neither opening is filled by bars.
    fence_segments=[LineString([photo(p) for p in yard_pixels[:15]]),
                    LineString([photo(p) for p in yard_pixels[17:22]])]
    # PNOA rail trace on the forecourt, around the outside of the lower yard.
    # The north end is not closed across the entrance pavilion.
    rail_pixels=[(658,423),(606,437),(547,460),(496,489),(454,529),(426,573),(408,623),(400,683),(405,746),(426,805),(465,854),(517,891),(573,915),(634,924),(696,909),(752,887),(804,850),(848,806),(882,751),(899,694),(897,637),(882,584),(857,534),(823,485),(789,443)]
    rail=LineString([photo(p) for p in rail_pixels])
    curbs=[line_record('horno-island-kerb',LineString(island.exterior.coords),sourceId='horno-pnoa',heightM=.14,widthM=.16,interpretive=True)]
    # Sparse, photo-observed planting. No random trees fill the industrial lots.
    plant_rows=[((827,99),'palm',5.8,1.65),((811,210),'palm',5.5,1.6),((792,310),'palm',5.1,1.55),
                ((857,563),'broadleaf',5.0,2.1),((873,588),'broadleaf',4.7,1.9),
                ((994,1074),'broadleaf',4.2,2.0),((193,1357),'broadleaf',5.1,2.7),
                ((494,1220),'broadleaf',5.0,2.6),((511,1280),'broadleaf',5.4,2.7),
                ((477,1328),'broadleaf',5.5,2.9),((464,1390),'broadleaf',5.2,2.7),
                ((635,1145),'broadleaf',3.7,1.5),((719,1248),'broadleaf',3.6,1.5)]
    trees=[]
    for i,(pix,kind,h,r) in enumerate(plant_rows):
        p=Point(photo(pix))
        if not selection.covers(p) or all_footprints.intersects(p):continue
        trees.append({'id':'horno-photo-tree-'+str(i),'coordinate':geo(p.coords[0]),'kind':kind,'heightM':h,'crownRadiusM':r,
            'sourceId':'horno-pnoa','sourcePixel':list(pix),'positionFromPhoto':True,'dimensionsInterpretive':True})
    # The ring's visible slender lamps and inset drainage supply human scale;
    # their dimensions are a visual interpretation, not a lighting survey.
    lamps=[]
    for i,pix in enumerate([(293,362),(292,755),(502,1023),(961,831),(941,508),(809,145)]):
        p=Point(photo(pix))
        if selection.covers(p):lamps.append({'id':'horno-lamp-'+str(i),'coordinate':geo(p.coords[0]),'heightM':5.1,'sourceId':'horno-pnoa','interpretive':True})
    fence_rows=[line_record('horno-fence-'+str(i),line,sourceId='horno-authors',heightM=1.36,postSpacingM=.20,interpretiveDimensions=True)
                for i,line in enumerate(fence_segments)]
    masks=[]
    # Triangulate only polygons with holes; simple pieces remain one mask.
    mask_shape=paving.union(pavilion).union(own_footprints)
    for poly in polygons(mask_shape):
        parts=list(shapely.constrained_delaunay_triangles(poly).geoms) if poly.interiors else [poly]
        for p in parts:
            if p.area>.005:masks.append(record('horno-context-mask-'+str(len(masks)),p))
    protected=[]
    for dataset in ['port-industrial','port-garden','port-workers']:
        for site in read(dataset)['sites']:
            if site['id']=='horno':continue
            protected.append({'id':site['id'],'owner':'existing-port-model','coordinate':site['coordinate'],
                'osmBuildingIds':site.get('osmBuildingIds',[]),'renderedElsewhere':True})
    shared_buildings=[{'id':str(r['id']),'coordinates':r['coordinates'],'holes':r.get('holes',[]),'owner':'port-city',
        'renderedElsewhere':True} for r,p in all_buildings if str(r['id']) not in owned_ids and p.intersects(selection)]
    context={
        'schemaVersion':1,'id':'horno-context','coordinate':COORDINATE,'researchDate':'2026-11-20',
        'districtOutline':[geo(p) for p in selection.exterior.coords],
        'selectionNote':'160 m graphic selection around the furnace, cropped at the southern edge of the regional 5 m display mesh; whole selected industrial building parts retained. Not the statutory protection boundary.',
        'buildings':buildings,'heightReview':height_reviews,'coreBuildingParts':core_parts,
        'excludedBuildingIds':sorted(owned_ids),'excludedRoadIds':sorted(replaced),
        'pavilion':{'id':'horno-recepcion','coordinates':source['pavilionFootprint'],
            'mainCoordinates':main_coords,'corridorCoordinates':corridor_source['coordinates'],
            'sourceIds':['osm/733110249','cat-8532501YJ3983S_part2-0','cat-8532501YJ3983S_part3-0'],
            'mainFloorNorthM':4.4,'mainFloorSouthM':2.2,'mainRoofNorthM':8.6,'mainRoofSouthM':4.7,
            'corridorFloorNorthM':1.2,'corridorFloorSouthM':5.7,'corridorHeadroomM':2.4,
            'portalWorldOffset':[3.83,-1.15],'portalFloorM':5.7,
            'dimensionsInterpretive':True,'facade':'Grey precast-panel cladding and visible steel ribs; open covered ramp ends; inclined auditorium volume.',
            'note':'Mapped envelope and directional inclinations follow the authors’ plan and 2011 photographs, cross-checked with PNOA. Minor panel, bolt, support and roof heights are interpreted; no undocumented exhibition is invented.'},
        'foundationExclusion':record('horno-core-foundation',foundation,owner='horno-model'),
        'lowerYard':record('horno-lower-yard',yard),
        'foundationPatches':[dict(record('horno-yard-grade',yard.difference(main)),heightOffsetM=-.06,marginM=.8)],
        'roads':roads,'surfaces':surfaces,'curbLines':curbs,
        'retainingWalls':[line_record('horno-recovered-sleepers',retaining,sourceId='horno-authors',widthM=.42,heightM=1.05,dimensionsInterpretive=True)],
        'fences':fence_rows,'railAlignments':[line_record('horno-perimeter-track',rail,gaugeM=1.668,sourceId='horno-boe',traceSourceId='horno-pnoa',interpretiveDimensions=True)],
        'trees':trees,'lamps':lamps,
        'displayArtifacts':[{'id':'horno-industrial-pieces','coordinate':geo(photo((751,673))),'sourceId':'horno-boe','positionSourceId':'horno-pnoa','interpretiveShape':True}],
        'genericStreetExclusions':masks,'vegetationExclusions':[record('horno-controlled-planting',selection)],
        'collisionPolygons':[record('horno-reception-volume',main)],
        'sharedContext':{'buildings':shared_buildings,'heritage':protected,'policy':'Talleres, Museo Industrial, Gerencia, Casino, Begoña, Economato and other monuments retain their original owners. Unselected industrial building parts remain in the regional city model.'},
        'focusSpecs':{'horno-entorno':{'label':'El horno y la ciudad industrial','targetCoordinates':geo((CX+2,CZ-6)),
            'targetHeight':13,'far':[76,59,-70],'near':[43,30,-44],'radius':55,'fov':56}},
        'pavementMesh':{'coordinateSystem':'Global atlas x/z metres','surfaceLiftM':.035,
            'terrainGrid':{'spacingM':5,'originXZ':[0,0],'diagonal':'x=z within each cell','coreBounds':{'minX':4100,'maxX':5500,'minZ':1450,'maxZ':2900}},
            'vertices':vertices,'groups':[{'component':key,'indices':ids} for key,ids in groups.items()]},
        'pavingNote':'Rotonda y calles sobre sus ejes OSM, con anchuras visuales contrastadas con PNOA; plaza y recinto excavado trazados de la ortofoto. Bordillos y juntas no son mediciones topográficas.',
        'vegetationNote':'Posiciones aproximadas de palmeras y árboles observadas en PNOA. Especie, copa, altura y mobiliario menor son interpretaciones; los solares conservan su carácter abierto.',
        'readingColor':'#8d9b8b',
        'sources':[
            {'id':'horno-boe','title':'BOE · Declaración BIC, anexo I §3.4 y §4.2','url':'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-9526'},
            {'id':'horno-authors','title':'La Casa de la Arquitectura · proyecto de restauración, planos y fotografías de obra acabada (COACV; fotografías Mariela Apollonio, c.2011)','url':'https://lacasadelaarquitectura.es/recurso/restauracion-del-alto-horno-numero-2/309b8639-4a25-47c3-8bb1-0a6c1b5f182e'},
            {'id':'horno-memoria','title':'Memoria de rehabilitación · proyecto modificado, octubre de 2008, p.10','url':'https://www.contrastapips.com/IHACM/IBP/Port/Memoria%20rehab%20AHn2.pdf'},
            {'id':'horno-pnoa','title':'IGN/CNIG · PNOA Máxima Actualidad, ground-edge reference','url':PHOTO_URL,'license':'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf','retrieved':'2026-11-20','flightDate':'Not verified; retrieval date is not the date of capture'},
            {'id':'horno-osm','title':'OpenStreetMap · roads and reception footprint','url':'https://www.openstreetmap.org/way/733110249','license':'https://www.openstreetmap.org/copyright','retrieved':'2026-11-19'},
            {'id':'horno-catastro','title':'Dirección General del Catastro · INSPIRE Buildings, Sagunto','url':'https://www.catastro.hacienda.gob.es/webinspire/','metadataDate':'2026-08-21','retrieved':'2026-11-19'},
            {'id':'horno-ign-ground','title':'IGN/CNIG · MDT05, existing Puerto terrain','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmdt','sourceGridSpacingM':5},
            {'id':'horno-ign-heights','title':'IGN/CNIG · MDSnE2.5, existing roof-height estimates','url':'https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado','caution':'Not a measured or current facade elevation.'}
        ],
        'provenance':{'sourceHashes':{name:hashlib.sha256((DATA/name).read_bytes()).hexdigest() for name in ['port-cartography.json','port-industrial.json','port-elevation.json']},
            'referencePhoto':{'path':'research/validation-v22/horno-context-orthophoto-reference.jpg','geographicBounds':PHOTO_BOUNDS,'width':1400,'height':1400,
            'sha256':hashlib.sha256((OUT/'horno-context-orthophoto-reference.jpg').read_bytes()).hexdigest()},
            'digitizedPixels':{'island':island_pixels,'yard':yard_pixels,'rail':rail_pixels},
            'method':'Source geometry unchanged; source footprints replace their generic duplicates; 5 m terrain-aligned paving; georeferenced photo trace for public-space ground edges.'},
        'stats':{'buildingParts':len(buildings),'parentParcels':len(chosen_parents),'sourceCoreParts':len(core_parts),'roadFragments':len(roads),
            'pavingAreaM2':round(paving.area,2),'pavingVertices':len(vertices),'pavingTriangles':len(triangles),
            'trees':len(trees),'streetLamps':len(lamps),'railLengthM':round(rail.length,2),'fenceLengthM':round(sum(l.length for l in fence_segments),2),
            'protectedHeritageOwners':len(protected)}
    }
    (DATA/'horno-context.json').write_text(json.dumps(context,ensure_ascii=False,separators=(',',':'))+'\n')
    actual=unary_union(triangles)
    buildings_unchanged=all(next(r for r,p in all_buildings if str(r['id'])==str(b['id']))['coordinates']==b['coordinates'] for b in buildings)
    triangle_overlap=sum(t.area for t in triangles)-actual.area
    report={'pass':True,'checks':[
        {'pass':buildings_unchanged,'label':'Original mapped coordinates of all five industrial building parts preserved'},
        {'pass':len(core_ids)==5,'label':'All four cadastral furnace/reception parts plus OSM reception replace their generic duplicates'},
        {'pass':actual.symmetric_difference(paving).area<.001,'label':'Terrain-aligned triangles cover every selected surface once','differenceAreaM2':actual.symmetric_difference(paving).area},
        {'pass':abs(triangle_overlap)<.001,'label':'No overlapping paving triangles','overlapAreaM2':triangle_overlap},
        {'pass':paving.intersection(all_footprints).area<.001,'label':'Circulation strips do not enter neighbouring mapped buildings','intersectionAreaM2':paving.intersection(all_footprints).area},
        {'pass':not any(str(s.get('id')) in owned_ids for s in protected),'label':'Other industrial monuments retain their owners'},
        {'pass':all(4100-1e-6<=v[0]<=5500+1e-6 and 1450-1e-6<=v[1]<=2900+1e-6 for v in vertices),'label':'All paving is inside the 5 m Puerto core mesh'},
    ],'stats':context['stats'],'sourceHashes':context['provenance']['sourceHashes']}
    report['pass']=all(c['pass'] for c in report['checks'])
    (OUT/'horno-context-source-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if not report['pass']:raise SystemExit(1)

if __name__=='__main__':build()
