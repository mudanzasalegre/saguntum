"""Constrain existing IGN canopy radii to clear space in the shipped cadastral and street layers."""
import hashlib
import json
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import LineString, Polygon

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "dist/assets/territory"
CANOPY = DATA / "canopy"


def distances(points, obstacles):
    pairs, metres = shapely.STRtree(obstacles).query_nearest(points, return_distance=True, all_matches=False)
    result = np.empty(len(points))
    result[pairs[0]] = metres
    return result


def prepare():
    index = json.loads((CANOPY / "index.json").read_bytes())
    raw = (CANOPY / "crowns.bin").read_bytes()
    rows = np.frombuffer(raw, dtype=[("x","<u2"), ("z","<u2"), ("height","u1"), ("radius","u1"), ("green","u1")])
    assert len(rows) == index["count"] == sum(t[2] for t in index["tiles"])
    x, z = rows["x"]*.25, rows["z"]*.25
    offset = 0
    for tx, tz, n in index["tiles"]:
        x[offset:offset+n] += tx*500
        z[offset:offset+n] += tz*500
        offset += n
    points = shapely.points(x, z)
    buildings, streets = [], []
    for path in sorted((DATA/"b").glob("*.json")):
        for feature in json.loads(path.read_bytes())["buildings"]:
            rings = feature["rings"]
            buildings.append(Polygon(rings[0], rings[1:]))
    for path in sorted((ROOT/"dist/assets/network").glob("*_*.json")):
        for road in json.loads(path.read_bytes())["roads"]:
            if road.get("tunnel") or road.get("bridge") or not road.get("car"):
                continue
            line = LineString(road["points"])
            streets.append(line.buffer((road.get("width") or 5)*.5, quad_segs=2))
    walls, pavement = distances(points, buildings), distances(points, streets)
    # Leave room for the irregular silhouette around the nominal crown radius.
    clearance = np.maximum(0, np.minimum(walls,pavement)-.12)/1.26
    decimetres = np.minimum(np.floor(clearance*10), rows["radius"]).astype("u1")
    decimetres[decimetres<7] = 0
    (CANOPY/"clearance.bin").write_bytes(decimetres.tobytes())
    assert np.all(decimetres*.1 <= clearance+1.e-8)
    counts = dict(measured=len(rows), hidden=int(np.sum(decimetres==0)),
                  narrowed=int(np.sum((decimetres>0)&(decimetres<rows["radius"]))),
                  footprints=len(buildings), carriageways=len(streets),
                  sourceSha256=hashlib.sha256(raw).hexdigest(),
                  clearanceSha256=hashlib.sha256(decimetres.tobytes()).hexdigest())
    print(json.dumps(counts, indent=2))


if __name__ == "__main__":
    prepare()
