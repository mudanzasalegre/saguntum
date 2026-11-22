"""Derive the Glorieta visit sector from the Atlas' existing local source products.
Run from the checkout root with Python 3 and Pillow. No network access is needed.
"""
import json
import math
from pathlib import Path

from PIL import Image

DATA = Path(__file__).resolve().parents[1] / "dist/assets/data"


def read(name):
    return json.loads((DATA / (name + ".json")).read_bytes())


def write(name, data):
    (DATA / (name + ".json")).write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )


def project(coordinate):
    lon, lat = coordinate
    return (lon + 0.278) * 111320 * math.cos(math.radians(39.679)), (39.679 - lat) * 111320


def main():
    dem = read("elevation")
    cartography = read("cartography")
    plaza = read("glorieta-buildings")
    lon, lat = read("glorieta-layout")["anchors"]["general"]
    cx, cz = project((lon, lat))
    b, w, h = dem["bounds"], dem["width"], dem["height"]
    dx, dz = (b["maxX"] - b["minX"]) / (w-1), (b["maxZ"] - b["minZ"]) / (h-1)
    ix, iz = round((cx-b["minX"]) / dx), round((cz-b["minZ"]) / dz)
    ix0, ix1, iz0, iz1 = ix-160, ix+160, iz-160, iz+160
    bounds = dict(minX=b["minX"]+ix0*dx, maxX=b["minX"]+ix1*dx,
                  minZ=b["minZ"]+iz0*dz, maxZ=b["minZ"]+iz1*dz)
    elevations = [v for row in range(iz0, iz1+1)
                  for v in dem["elevations"][row*w+ix0:row*w+ix1+1]]
    sw = [lon+(bounds["minX"]-cx)/(111320*math.cos(math.radians(39.679))),
          lat-(bounds["maxZ"]-cz)/111320]
    ne = [lon+(bounds["maxX"]-cx)/(111320*math.cos(math.radians(39.679))),
          lat-(bounds["minZ"]-cz)/111320]
    # Preserve all source samples in this window, including at each boundary.
    dem.update(bounds=bounds,width=ix1-ix0+1,height=iz1-iz0+1,elevations=elevations,
               geographicBounds={"west":sw[0],"south":sw[1],"east":ne[0],"north":ne[1]})
    write("glorieta-sector-elevation", dem)
    with Image.open(DATA/"orthophoto.jpg") as source:
        # Pillow's fractional transform keeps the same UV convention as createTerrain.
        original = (ix0*source.width/(w-1),iz0*source.height/(h-1),
                    ix1*source.width/(w-1),iz1*source.height/(h-1))
        source.resize((round(original[2]-original[0]),round(original[3]-original[1])),
                      Image.Resampling.LANCZOS, box=original).save(
                          DATA/"glorieta-sector.jpg",quality=91,subsampling=0,optimize=True)
    protected = {str(id) for id in plaza["excludedBuildingIds"]}
    protected_roads = {str(id) for id in plaza["excludedRoadIds"]}

    def inside(p):
        x, z = project(p)
        return ((x-cx)/305)**2 + ((z-cz)/290)**2 <= 1

    for layer in ("buildings","roads","landcover","squares","retainingWalls"):
        cartography[layer] = [f for f in cartography[layer]
                              if any(inside(p) for p in f["coordinates"])
                              and not (layer=="buildings" and str(f["id"]) in protected)
                              and not (layer=="roads" and str(f.get("osmId",f["id"])) in protected_roads)]
    cartography["places"] = [p for p in cartography["places"] if inside(p["coordinate"])]
    cartography.update(bounds=bounds, castleWalls=[],title="Entorno de la Glorieta")
    write("glorieta-sector-cartography",cartography)
    print(len(cartography["buildings"]), "building parts;",len(cartography["roads"]),"roads;",len(elevations),"terrain samples")


if __name__ == "__main__":
    main()
