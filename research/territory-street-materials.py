"""Build the street material atlas. Python 3, Pillow, NumPy, requests."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import md5
from io import BytesIO
import json
from pathlib import Path
import requests
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/assets/materials/streets"
CACHE = Path.home() / ".cache/saguntum/street-materials"
SURFACES = ["asphalt_04", "precast_stone_paving", "gravel_road", "concrete_pavement_02",
            "cobblestone_pavement", "gravel_floor", "weathered_planks", "gravelly_sand"]
CELL = 512
BORDER = 8
CORE = CELL - 2 * BORDER
HEADERS = {"User-Agent": "SAGUNTUM Atlas vivo offline material preparation (github.com/mudanzasalegre/saguntum)"}


def get_bytes(url):
    response = requests.get(url, headers=HEADERS, timeout=60)
    response.raise_for_status()
    return response.content


def original(detail):
    path = CACHE / detail["md5"]
    if not path.is_file():
        content = get_bytes(detail["url"])
        if md5(content).hexdigest() != detail["md5"]:
            raise ValueError("Unexpected checksum for " + detail["url"])
        path.write_bytes(content)
    return Image.open(BytesIO(path.read_bytes()))


def material(asset):
    meta = json.loads(get_bytes("https://api.polyhaven.com/info/" + asset))
    files = json.loads(get_bytes("https://api.polyhaven.com/files/" + asset))
    files = {key.lower(): value for key, value in files.items()}
    maps = {}
    originals = {}
    for typ in ("diffuse", "nor_gl", "rough"):
        detail = files[typ]["1k"]["jpg"]
        maps[typ] = np.array(original(detail).convert("RGB").resize((CORE, CORE), Image.Resampling.LANCZOS))
        originals[typ] = {"url": detail["url"], "md5": detail["md5"]}
    # Keep normals in two channels and roughness in the third. Wrapped gutters
    # permit trilinear filtering up to the 8-texel footprint used by the shader.
    packed = np.dstack((maps["nor_gl"][:, :, :2], maps["rough"][:, :, 0]))
    wrap = lambda data: Image.fromarray(np.pad(data, ((BORDER, BORDER), (BORDER, BORDER), (0, 0)), mode="wrap"))
    credit = {"id": asset, "source": "https://polyhaven.com/a/" + asset,
              "authors": meta.get("authors", {}), "tileMetres": [round(x/1000, 3) for x in meta["dimensions"][:2]], "originals": originals}
    return wrap(maps["diffuse"]), wrap(packed), credit


if __name__ == "__main__":
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    diffuse = Image.new("RGB", (CELL * 4, CELL * 2))
    detail = Image.new("RGB", diffuse.size)
    provenance = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        for i, (color, surface, credit) in enumerate(pool.map(material, SURFACES)):
            point = (i % 4 * CELL, i // 4 * CELL)
            diffuse.paste(color, point)
            detail.paste(surface, point)
            provenance.append(credit)
    diffuse.save(OUT / "pavements.webp", quality=91, method=6)
    detail.save(OUT / "pavements-detail.webp", quality=92, method=6)
    (OUT / "credits.json").write_text(json.dumps({
        "license": "CC0 1.0", "licenseSource": "https://polyhaven.com/license",
        "use": "Materiales visuales representativos seleccionados por las etiquetas de superficie de OpenStreetMap. La fotografía de textura no documenta una calle concreta de Sagunto.",
        "surfaces": provenance}, ensure_ascii=False, indent=2) + "\n", "utf-8")
