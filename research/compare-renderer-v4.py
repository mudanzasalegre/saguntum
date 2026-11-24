"""Build a comparison sheet from actual browser captures, grouped by authored stop."""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent / 'render-v4'
COLUMNS = [('atlas', 'Atlas original'), ('previo', 'Simulador V41'),
           ('webgl2', 'V4 · WebGL 2'), ('webgpu', 'V4 · WebGPU')]
ROWS = [('panorama', 'Panorámica territorial'), ('castillo', 'Castillo · foro'),
        ('teatro', 'Teatro Romano · orchestra'), ('glorieta', 'Glorieta · José Romeu'),
        ('jardines', 'Glorieta · jardines'), ('calle', 'Carrer Major'),
        ('horno', 'Alto Horno · acceso'), ('gerencia', 'Gerencia · oficinas'),
        ('barrio', 'Barrio Obrero · hileras'), ('interior', 'Casino · salón'),
        ('excavacion', 'Vía del Pòrtic · acceso'), ('seccion', 'Circo · estratos'),
        ('pantalan', 'Pantalán · pérgolas'), ('maritimo', 'Pantalán · trípodes'),
        ('grau', 'Grau Vell · acceso')]
reports = {key: json.loads((ROOT / key / 'vistas.json').read_text(encoding='utf8')) for key, _ in COLUMNS}
sheet = Image.new('RGB', (1320, len(ROWS)*234+56), '#142b2e')
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default(size=19)
for i, (_, name) in enumerate(COLUMNS):
    draw.text((12+i*330, 16), name, font=font, fill='#faf5e8')
results = {}
for j, (name, title) in enumerate(ROWS):
    y = j*234+55
    draw.text((12, y), title, font=font, fill='#dfbd81')
    current = {}
    for i, (key, _) in enumerate(COLUMNS):
        data = reports[key][name]
        assert not data['errors'], (key, name, data['errors'])
        with Image.open(ROOT/key/(name+'.jpg')) as source:
            img = source.convert('RGB')
            sheet.paste(ImageOps.contain(img, (319, 192)), (10+i*330, y+29))
            if key in ('webgpu', 'webgl2'):
                current[key] = np.asarray(img).astype(np.int16)
    gl, gpu = [reports[k][name] for k in ('webgl2', 'webgpu')]
    assert gpu['graphics']['active'] == 'webgpu' and gl['graphics']['active'] == 'webgl2'
    diff = np.abs(current['webgl2']-current['webgpu'])
    results[name] = dict(eyeDeltaM=round(math.dist(gl['camera']['eye'],gpu['camera']['eye']),5),
                         targetDeltaM=round(math.dist(gl['camera']['target'],gpu['camera']['target']),5),
                         fovDeltaDeg=round(abs(gl['camera']['fov']-gpu['camera']['fov']),5),
                         tiers=[gl['quality'],gpu['quality']], meanRGB=round(float(diff.mean()),3),
                         p95RGB=float(np.percentile(diff,95)))
    if results[name]['eyeDeltaM']>.1 or results[name]['targetDeltaM']>.1 or results[name]['fovDeltaDeg']>.05:
        raise ValueError('El encuadre ha cambiado en '+name)
# The linear-space fog regression measured >17 in this same daytime panorama.
# Allow texture loading, JPEG variation and the moving water around the coast.
if results['panorama']['meanRGB']>9:
    raise ValueError('Revisar la bruma y la exposición de la panorámica')
sheet.save(ROOT/'comparacion.jpg', quality=88, optimize=True)
(ROOT/'diferencias.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
