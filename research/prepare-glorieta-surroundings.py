"""Select the first blocks and approaches from the Atlas' own Glorieta sector."""
import json
import math
from pathlib import Path

from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union


assets = Path(__file__).resolve().parents[1] / "dist/assets"
source = assets / "data"
read = lambda p: json.loads(p.read_text(encoding="utf-8"))
sx = 111320 * math.cos(math.radians(39.679))


def metric(point):
    return ((point[0] + .278) * sx, (39.679 - point[1]) * 111320)


def geographic(point):
    return [round(point[0] / sx - .278, 8), round(39.679 - point[1] / 111320, 8)]


def polygon(row):
    return Polygon([metric(p) for p in row["coordinates"]],
                   [[metric(p) for p in hole] for hole in row.get("holes", [])]).buffer(0)


def lines(geometry):
    if geometry.geom_type == "LineString":
        yield geometry
    elif hasattr(geometry, "geoms"):
        for part in geometry.geoms:
            yield from lines(part)


def remnants(shape):
    if shape.geom_type == "Polygon":
        if shape.area >= .5 and not shape.buffer(-.14).is_empty:
            yield {"coordinates": [geographic(p) for p in shape.exterior.coords],
                   "holes": [[geographic(p) for p in ring.coords] for ring in shape.interiors]}
    elif hasattr(shape, "geoms"):
        for part in shape.geoms:
            yield from remnants(part)


sector = read(source / "glorieta-sector-cartography.json")
front = read(source / "glorieta-buildings.json")
plaza = polygon({"coordinates": read(source / "glorieta-layout.json")["perimeter"]})
belt = plaza.buffer(58)
protected = [plaza, *(polygon(p) for p in front["protectedFootprints"])]
for path in source.glob("*-context.json"):
    data = read(path)
    for row in data.get("buildings", []):
        for item in [row, *row.get("secondaryFootprints", [])]:
            if item.get("coordinates"):
                shape = polygon(item)
                if shape.intersects(belt):
                    protected.append(shape)
protected = unary_union(protected)
blocks = []
for row in sector["buildings"]:
    shape = polygon(row)
    if not belt.contains(shape) or shape.area < 4 or shape.intersection(protected).area > .015:
        continue
    # Preserve the fields read by createCity, including measured height provenance.
    blocks.append({k: row[k] for k in ["id", "coordinates", "holes", "kind", "height", "levels",
                                        "roofColor", "roofShape", "surfaceHeightEstimate"] if row.get(k) is not None})

cadastral = unary_union([polygon(b) for b in blocks if str(b["id"]).startswith("cat-")])
aliases = [b["id"] for b in blocks if not str(b["id"]).startswith("cat-")
           and polygon(b).intersection(cadastral).area > .7 * polygon(b).area]
blocks = [b for b in blocks if b["id"] not in aliases]
fitted = [polygon(b) for b in blocks]
for i, shape in enumerate(fitted):
    # Rounded source coordinates occasionally cross a party wall by a few
    # centimetres. Flag a shared interior wider than the map's 10 cm tolerance.
    if any(not shape.intersection(other).buffer(-.05).is_empty for other in fitted[:i]):
        raise ValueError("Dos huellas del entorno ocupan la misma planta")

# Preserve each authored street frontage. Remove only the occupied portion
# of a second, generic building shell from the other cartographic source.
authored = unary_union([polygon(b) for b in front["buildings"] if b["id"] in front["frontages"]])
corrections = {}
for building in front["buildings"]:
    if building["id"] in front["frontages"] or not str(building["id"]).startswith("cat-"):
        continue
    shape = polygon(building)
    if shape.intersection(authored).area > 1:
        pieces = list(remnants(shape.difference(authored)))
        if any(polygon(piece).intersection(authored).area > .05 for piece in pieces):
            raise ValueError("Una parte genérica invade una fachada de la visita")
        corrections[building["id"]] = pieces

paving = unary_union([Polygon(p["outer"],p.get("holes",[])).buffer(0)
                      for p in front["roads"] + front["pavements"]])
street_defaults = dict(trunk=9, primary=8, secondary=7, tertiary=5.8, residential=4.5,
                       unclassified=4.5, living_street=3.4, service=3.2, pedestrian=3.1,
                       track=2.4, cycleway=1.9, footway=1.6, path=1.4, steps=1.4)
roads = []
occupied = paving.union(protected)
for road in sector["roads"]:
    try:
        width = float(road.get("width"))
    except (TypeError, ValueError):
        width = street_defaults.get(road["kind"], 2)
    line = LineString([metric(p) for p in road["coordinates"]])
    mask = occupied.buffer(width / 2 + .25)
    for part in lines(line.intersection(belt).difference(mask)):
        if part.length > 2.5:
            roads.append({**road, "coordinates": [geographic(p) for p in part.coords]})
result = {"title": sector["title"], "buildings": blocks, "roads": roads,
          "buildingFootprintProvenance": sector["buildingFootprintProvenance"],
          "aliases": aliases, "frontageCorrections": corrections,
          "source": "glorieta-sector-cartography.json", "attribution": sector["attribution"]}
target = assets / "territory/glorieta-surroundings.json"
target.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(blocks), "partes de edificios,", len(roads), "tramos de calle,", target.stat().st_size, "bytes")
