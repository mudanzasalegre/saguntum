"""Prepare SAGUNTUM's municipal elevation, orthoimagery, shoreline and buildings.

Run in an isolated Python 3.12 environment (see README). The PBF can be shared
with the OSM network preparation. Raw files are cached outside the repository.
Geometry uses EPSG:25830 with x=easting-730000, z=4395000-northing.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import shutil
import tempfile
from urllib.parse import urlencode
import zipfile

from lxml import etree
import numpy as np
from PIL import Image
from pyproj import Transformer
import rasterio
import requests
import shapely
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import polygonize, unary_union

ROOT = Path(__file__).resolve().parents[2]
EXISTING = ROOT / 'dist/assets/data'
ORIGIN = (730000, 4395000)
WORLD = (-5500, -14500, 14000, 7500)
CORE = (1000, -2600, 11000, 5800)
PROJ = Transformer.from_crs(4326, 25830, always_xy=True)
DGC = 'https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip'
IGN_LICENSE = 'https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf'
WCS = 'https://servicios.idee.es/wcs-inspire/mdt'
WMS = 'https://www.ign.es/wms-inspire/pnoa-ma'
ICV = 'https://terramapas.icv.gva.es/0105_Delimitaciones'
ICV_CATALOG = 'https://dadesobertes.gva.es/es/dataset/delimitacion-territorial-municipios-de-la-comunitat-valenciana'
PBF_SOURCE = 'https://download.geofabrik.de/europe/spain/valencia/valencia-261121.osm.pbf'
STEP = 500


def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf8')


def download(cache, name, url, params=None):
    path = cache / name
    if not path.exists():
        result = requests.get(url, params=params, timeout=(15, 150))
        result.raise_for_status()
        data = result.content
        if len(data) < 2000 or b'ExceptionReport' in data[:1000]:
            raise ValueError(f'{name}: unexpected server response')
        partial = path.with_suffix(path.suffix + '.part')
        partial.write_bytes(data)
        partial.replace(path)
    return path


def digest(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def utm_bounds(b):
    return ORIGIN[0] + b[0], ORIGIN[1] - b[3], ORIGIN[0] + b[2], ORIGIN[1] - b[1]


def local(points):
    a = np.asarray(points, dtype=float)
    return np.column_stack((a[:, 0] - ORIGIN[0], ORIGIN[1] - a[:, 1]))


def from_lonlat(points):
    x, y = PROJ.transform(*np.asarray(points).T)
    return local(np.column_stack((x, y)))


def poly_parts(g):
    if g.geom_type == 'Polygon':
        yield g
    elif g.geom_type in ('MultiPolygon', 'GeometryCollection'):
        for item in g.geoms:
            yield from poly_parts(item)


def line_parts(g):
    if g.geom_type == 'LineString' and not g.is_empty:
        yield g
    elif g.geom_type in ('MultiLineString', 'GeometryCollection'):
        for item in g.geoms:
            yield from line_parts(item)


def rings(poly, decimals=1):
    # Three.Shape and the simulator collision routine close these rings implicitly.
    return [np.asarray(r.coords[:-1]).round(decimals).tolist() for r in [poly.exterior, *poly.interiors]]


def ring_object(p):
    outer, *holes = rings(p)
    return dict(outer=outer, holes=holes)


def gml_polygon(patch):
    coordinates = []
    for pos in patch.findall('./*/{*}LinearRing/{*}posList'):
        if pos.get('srsDimension', '2') != '2':
            raise ValueError('Unexpected GML coordinate dimension')
        coordinates.append(local(np.fromstring(pos.text, sep=' ').reshape(-1, 2)))
    return Polygon(coordinates[0], coordinates[1:])


def municipal(cache):
    params = dict(service='WFS', version='1.1.0', request='GetFeature', typename='ICV.Municipios',
                  bbox='732000,4394000,732010,4394010,EPSG:25830', srsName='EPSG:25830')
    path = download(cache, 'municipal-icv.gml', ICV, params)
    doc = etree.parse(path)
    assert doc.findtext('.//{*}cod_ine_mun') == '46220'
    polys = [gml_polygon(p) for p in doc.findall('.//{*}Polygon')]
    boundary = unary_union(polys)
    assert 133e6 < boundary.area < 135e6 and box(*WORLD).covers(boundary)
    return boundary


def sample_grid(grid, gx, gz):
    ix = np.clip(np.floor(gx).astype(int), 0, grid.shape[1]-2)
    iz = np.clip(np.floor(gz).astype(int), 0, grid.shape[0]-2)
    dx, dz = np.clip(gx-ix, 0, 1), np.clip(gz-iz, 0, 1)
    return ((1-dz)*((1-dx)*grid[iz, ix]+dx*grid[iz, ix+1])
            + dz*((1-dx)*grid[iz+1, ix]+dx*grid[iz+1, ix+1]))


def raster(cache, out, b, spacing, native, parent=None):
    x0, z0, x1, z1 = b
    x, z = np.meshgrid(np.arange(x0, x1+1, spacing), np.arange(z0, z1+1, spacing))
    assert x[-1, -1] == x1 and z[-1, -1] == z1
    w, s, e, n = utm_bounds(b)
    margin = 10 if parent is not None else 30
    params = [('service', 'WCS'), ('version', '2.0.1'), ('request', 'GetCoverage'),
              ('coverageId', f'Elevacion25830_{native}'), ('subset', f'x({w-margin},{e+margin})'),
              ('subset', f'y({s-margin},{n+margin})'), ('format', 'image/tiff')]
    dem = download(cache, f'mdt{native}.tif', WCS, params)
    with rasterio.open(dem) as dataset:
        assert dataset.crs.to_epsg() == 25830
        tx = dataset.transform
        arr = dataset.read(1).astype('float32')
        if not (-10 <= np.nanmin(arr) <= 1 and 100 < np.nanmax(arr) < 1200):
            raise ValueError('Unexpected DEM elevation range')
        heights = sample_grid(arr, (ORIGIN[0]+x-tx.c)/tx.a-.5, (ORIGIN[1]-z-tx.f)/tx.e-.5)
    suffix = '-core' if parent is not None else ''
    if parent is not None:
        # Seam with the coarser mesh; both samplers yield the same perimeter.
        weight = np.minimum.reduce([x-x0, x1-x, z-z0, z1-z])/100
        weight = np.clip(weight, 0, 1)
        coarse = sample_grid(parent, (x-WORLD[0])/25, (z-WORLD[1])/25)
        heights = weight*heights + (1-weight)*coarse
    hfile = f'heights{suffix}.bin'
    np.round(heights * 10).astype('<i2').tofile(out / hfile)
    width, height = (4096, 3441) if parent is not None else (3666, 4096)
    image_params = dict(service='WMS', version='1.3.0', request='GetMap', layers='OI.OrthoimageCoverage',
                        styles='', crs='EPSG:25830', bbox=f'{w},{s},{e},{n}', width=width, height=height,
                        format='image/jpeg')
    image = download(cache, 'core.jpg' if parent is not None else 'world.jpg', WMS, image_params)
    with Image.open(image) as check:
        assert check.size == (width, height)
        check.verify()
    texture = f'ortho{suffix}.jpg'
    shutil.copyfile(image, out / texture)
    if parent is None:
        with Image.open(image) as miniature:
            miniature.thumbnail((800, 800))
            miniature.save(out/'map.jpg', quality=83)
    return dict(width=heights.shape[1], height=heights.shape[0], bounds=b, heights=hfile, unit=.1,
                texture=texture, spacing=spacing, sourceSpacing=native, elevationSource=WCS+'?'+urlencode(params),
                textureSource=WMS+'?'+urlencode(image_params)), np.round(heights*10)/10


def osm_coasts(pbf, cache):
    # Read node locations only for coastline ways. This avoids a region-wide node index.
    import osmium
    checksum = digest(pbf)
    cached = cache / ('coast-'+checksum[:16]+'.json')
    if cached.exists():
        return json.loads(cached.read_text())
    coast = {}
    for way in osmium.FileProcessor(str(pbf), osmium.osm.WAY).with_filter(osmium.filter.KeyFilter('natural')):
        if way.tags.get('natural') == 'coastline':
            coast[way.id] = [n.ref for n in way.nodes]
    needed = {node for ns in coast.values() for node in ns}
    coords = {}
    for node in osmium.FileProcessor(str(pbf), osmium.osm.NODE).with_filter(osmium.filter.IdFilter(needed)):
        coords[node.id] = [node.location.lon, node.location.lat]
    crop = box(*WORLD)
    found = {}
    for key, refs in coast.items():
        if not all(n in coords for n in refs):
            continue
        points = [coords[n] for n in refs]
        if len(points) > 1 and LineString(from_lonlat(points)).intersects(crop):
            found[str(key)] = points
    dump(cached, found)
    return found


def water(pbf, cache):
    source = osm_coasts(pbf, cache)
    old = json.loads((EXISTING/'coast-water.json').read_text(encoding='utf8'))['corrections'][0]
    # Only remove the elevated pier deck's indentation when both v32 abutments still match.
    coords = source.get(old['osmWay'], [])
    if old['from'] in coords and old['to'] in coords:
        i, j = sorted([coords.index(old['from']), coords.index(old['to'])])
        if j > i+1:
            source[old['osmWay']] = coords[:i+1] + coords[j:]
    frame = box(*WORLD)
    lines = []
    for v in source.values():
        lines.extend(line_parts(LineString(from_lonlat(v)).intersection(frame)))
    divided = list(polygonize(unary_union([frame.boundary, *lines])))
    # The southeast corner is Mediterranean open water. Connected bays are part
    # of the same polygon; land and enclosed harbour islands become holes.
    sea = next(p for p in divided if p.covers(Point(WORLD[2]-50, WORLD[3]-50)))
    assert 15e6 < sea.area < 200e6
    for coord in [(-.278,39.677),(-.239697918,39.635329816),(-.2203074,39.6542918)]:
        if sea.covers(Point(from_lonlat([coord])[0])):
            raise ValueError('Coastline has an open gap across land')
    shore = [np.array(line.coords).round(1).tolist() for line in lines]
    return [ring_object(sea)], shore


def gml_features(archive, suffix, tag):
    with archive.open('A.ES.SDGC.BU.46222.'+suffix+'.gml') as stream:
        for _, item in etree.iterparse(stream, events=('end',), tag='{*}'+tag):
            ref = item.findtext('.//{*}localId')
            geom = [gml_polygon(p) for p in item.findall('.//{*}PolygonPatch')]
            if item.find('.//{*}Surface').get('srsName') != 'urn:ogc:def:crs:EPSG::25830':
                raise ValueError('Wrong cadastral CRS')
            yield ref, item, geom
            parent = item.getparent()
            parent.clear()
            while parent.getprevious() is not None:
                del parent.getparent()[0]


def old_attributes():
    lidar, osm = {}, {}
    for filename in sorted(EXISTING.glob('*cartography.json')):
        source = json.loads(filename.read_text(encoding='utf8'))
        for b in source.get('buildings', []):
            key = str(b['id'])
            if key.startswith('cat-'):
                if key not in lidar or (b.get('surfaceHeightSamples') or 0) > lidar[key][2]:
                    lidar[key] = (b.get('surfaceHeightEstimate'), b.get('roofColor'), b.get('surfaceHeightSamples') or 0)
            elif b.get('coordinates') and len(b['coordinates']) >= 4:
                osm[key] = b
    return lidar, osm


def dgc_records(cache, municipal_geometry, stats):
    archive_path = download(cache, 'cadastral.zip', DGC)
    lidar, osm = old_attributes()
    output = []
    with zipfile.ZipFile(archive_path) as z:
        parents = {}
        for ref, f, patches in gml_features(z, 'building', 'Building'):
            use = (f.findtext('{*}currentUse') or 'unknown').split('_')[-1]
            parents[ref] = (use, patches)
        covered = set()
        def append(ref, parent, patches, levels):
            use = parents.get(parent, ('unknown', None))[0]
            for number, patch in enumerate(patches):
                source_id = f'cat-{ref}-{number}'
                lidar_h, color, _ = lidar.get(source_id, (None, None, 0))
                if lidar_h and 1.5 < lidar_h < 100:
                    h, method = lidar_h, 'lidar'
                elif levels:
                    h, method = levels * (4.0 if use in ('industrial', 'agriculture') else 3.05), 'floors'
                else:
                    h, method = (5.0 if use in ('industrial', 'agriculture') else 3.6), 'visual'
                record = dict(id=source_id, height=round(h,1), heightSource=method, usage=use)
                if levels:
                    record['levels'] = levels
                if color:
                    record['roofColor'] = color
                output.append((patch, record))
        for ref, f, parts in gml_features(z, 'buildingpart', 'BuildingPart'):
            levels = int(f.findtext('{*}numberOfFloorsAboveGround') or 0)
            if levels > 0:
                parent = ref.split('_part')[0]
                covered.add(parent)
                append(ref, parent, parts, levels)
        for parent, (_, parts) in parents.items():
            if parent not in covered:
                append(parent+'_parent', parent, parts, None)
        stamp = etree.fromstring(z.read('A.ES.SDGC.BU.MD.46222.xml')).findtext('.//{*}dateStamp/{*}Date')
        stats.update(cadastralParents=len(parents), sourceDate=stamp)
    # Complement with v32 OSM geometries only if the feature lies in Sagunt and
    # its entire footprint is effectively disjoint from the municipal cadastre.
    cadastral = [shapely.make_valid(p) if not p.is_valid else p for p, _ in output]
    tree = shapely.STRtree(cadastral)
    for key, v in osm.items():
        g = Polygon(from_lonlat(v['coordinates']), [from_lonlat(h) for h in v.get('holes', [])])
        if g.is_empty or not g.is_valid or not municipal_geometry.covers(g.representative_point()):
            continue
        idx = tree.query(g, predicate='intersects')
        if len(idx) and sum(cadastral[i].intersection(g).area for i in idx) > 0.1:
            continue
        measured, levels, estimate = v.get('height'), v.get('levels'), v.get('surfaceHeightEstimate')
        h = measured or estimate or (3.05*levels if levels else 3.6)
        if not math.isfinite(h) or h <= 0:
            continue
        record = dict(id='osm-'+key, height=round(h,1), usage=v.get('kind') or 'unknown',
                      heightSource='osm' if measured else 'lidar' if estimate else 'floors' if levels else 'visual')
        if levels:
            record['levels'] = levels
        if v.get('roofColor'):
            record['roofColor'] = v['roofColor']
        output.append((g, record))
    return output


def building_tiles(cache, out, boundary):
    stats = Counter()
    items = []
    for original, record in dgc_records(cache, boundary, stats):
        if not original.is_valid:
            stats['invalidRepaired'] += 1
            original = shapely.make_valid(original)
        for i, p in enumerate(poly_parts(shapely.set_precision(original, .1))):
            if p.area >= 1:
                items.append((shapely.set_precision(p, 0), dict(record, id=record['id']+(f'-{i}' if i else ''))))
    # Work in one metric grid before assigning any sectors. Taller parts win where
    # planar footprints of different recorded volumes overlap.
    items.sort(key=lambda g:(-g[1]['height'], g[1]['id']))
    geometries = [g for g, _ in items]
    tree = shapely.STRtree(geometries)
    accepted = [None]*len(items)
    sectors, far, methods = defaultdict(list), [], Counter()
    envelopes = {}
    for i, (poly, record) in enumerate(items):
        candidates = [j for j in tree.query(poly, predicate='intersects') if j < i and accepted[j] is not None]
        conflicts = [accepted[j] for j in candidates if poly.relate_pattern(accepted[j], 'T********')]
        if conflicts:
            stats['overlaysResolved'] += 1
            poly = shapely.set_precision(poly.difference(unary_union(conflicts)), .000001)
        if poly.is_empty:
            stats['coveredParts'] += 1
            continue
        accepted[i] = poly
        for j, part in enumerate(poly_parts(poly)):
            if part.area < 1:
                continue
            c = part.representative_point()
            ix, iz = math.floor(c.x/STEP), math.floor(c.y/STEP)
            key = f'{ix}_{iz}'
            if j:
                record = dict(record, id=record['id']+'-'+str(j))
            records = sectors[key]
            records.append(dict(record, rings=rings(part, 6)))
            box0 = envelopes.get(key, part.bounds)
            bounds = part.bounds
            envelopes[key] = [min(box0[0],bounds[0]),min(box0[1],bounds[1]),max(box0[2],bounds[2]),max(box0[3],bounds[3])]
            methods[record['heightSource']] += 1
            stats['courtyards'] += len(part.interiors)
            if part.area >= 600 or (record['height'] >= 15 and part.area >= 100):
                simp = part.simplify(.8, preserve_topology=True)
                far.append(dict(id=record['id'], sector=key, rings=rings(simp), height=record['height'], usage=record['usage']))
    index = []
    for key, records in sorted(sectors.items()):
        ix, iz = map(int, key.split('_'))
        x0, z0 = ix*STEP, iz*STEP
        url = f'b/{key}.json'
        dump(out/url, dict(buildings=records))
        index.append(dict(id=key, x=x0+STEP/2, z=z0+STEP/2, bounds=[x0,z0,x0+STEP,z0+STEP],
                          geometryBounds=np.round(envelopes[key],7).tolist(), count=len(records), url=url))
    dump(out/'overview.json', dict(buildings=far))
    stats.update(buildingGeometries=sum(methods.values()), distantBuildings=len(far))
    return index, dict(stats), dict(methods)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--cache', type=Path, default=Path(tempfile.gettempdir())/'saguntum-territory-cache')
    p.add_argument('--out', type=Path, default=ROOT/'dist/assets/territory')
    p.add_argument('--pbf', type=Path, required=True, help='Geofabrik Comunitat Valenciana extract used for the network')
    p.add_argument('--pbf-url', default=PBF_SOURCE)
    a = p.parse_args()
    a.cache.mkdir(exist_ok=True, parents=True)
    a.out.mkdir(exist_ok=True, parents=True)
    boundary = municipal(a.cache)
    terrain, coarse = raster(a.cache, a.out, WORLD, 25, 25)
    terrain['detail'], _ = raster(a.cache, a.out, CORE, 10, 5, coarse)
    print('Terrain and orthophotos ready.', flush=True)
    ocean, shore = water(a.pbf, a.cache)
    print('Shoreline ready.', flush=True)
    sectors, counts, methods = building_tiles(a.cache, a.out, boundary)
    sources = [
        dict(name='DirecciÃ³n General del Catastro Â· INSPIRE Buildings', url=DGC, date=counts['sourceDate'],
             license='https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf'),
        dict(name='Â© Instituto GeogrÃ¡fico Nacional Â· IGN/CNIG Â· MDT25 y MDT05', url=WCS, license=IGN_LICENSE),
        dict(name='Â© PNOA Â· IGN/CNIG Â· Ortoimagen de mÃ¡xima actualidad', url=WMS, license=IGN_LICENSE),
        dict(name='Â© Institut CartogrÃ fic ValenciÃ  Â· Municipis, INE 46220', url=ICV_CATALOG, license='CC BY'),
        dict(name='Â© OpenStreetMap contributors Â· extracto Geofabrik', url=a.pbf_url,
             sha256=digest(a.pbf), license='https://www.openstreetmap.org/copyright')
    ]
    sources.append(dict(name='Â© IGN/CNIG Â· MDSnE2.5 Â· estimaciones de altura de la v32',
                        url='https://wcs-mds.idee.es/mds', license=IGN_LICENSE, date='2026-11-19'))
    inputs = {name:dict(sha256=digest(a.cache/name),cachedDate=datetime.fromtimestamp((a.cache/name).stat().st_mtime,timezone.utc).date().isoformat())
              for name in ('municipal-icv.gml','cadastral.zip','mdt25.tif','mdt5.tif','world.jpg','core.jpg')}
    result = dict(crs='EPSG:25830', origin=ORIGIN, bounds=WORLD, sectorSize=STEP, terrain=terrain, water=ocean,
                  shorelines=shore, municipality=[ring_object(p) for p in poly_parts(boundary.simplify(1))],
                  municipalityAreaKm2=round(boundary.area/1e6,3), sectors=sectors, overview='overview.json',
                  map='map.jpg', counts=counts, heightMethods=methods, sources=sources, inputs=inputs)
    dump(a.out/'world.json', result)
    print(len(sectors),'sectors',counts,methods,flush=True)


if __name__ == '__main__':
    main()
