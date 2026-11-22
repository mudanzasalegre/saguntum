"""Reproduce the context/source overlay. This is not a production screenshot."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
data = json.loads((ROOT/'dist/assets/data/barrio-context.json').read_text())
pixel = lambda p: ((p[0] + .22745) / .0052 * 2600, (39.663 - p[1]) / .0027 * 1800)
base = Image.open(OUT/'barrio-context-orthophoto-reference.jpg').convert('RGBA')
overlay = Image.new('RGBA', base.size)
draw = ImageDraw.Draw(overlay)
colors = {'barrio-road':(45,60,78,165), 'barrio-sidewalk':(245,203,103,155),
          'barrio-plaza':(225,141,110,155), 'barrio-tree-bed':(65,150,70,180),
          'barrio-tree-pit':(89,110,60,180)}
for row in data['surfaces']:
    draw.polygon([pixel(p) for p in row['coordinates']], fill=colors[row['component']], outline=(255,255,255,120))
    for hole in row['holes']:
        draw.polygon([pixel(p) for p in hole], fill=(0,0,0,0))
for row in data['buildings']:
    draw.line([pixel(p) for p in row['coordinates']], fill=(160,100,250,200), width=2)
for row in data['trees']:
    x,y = pixel(row['coordinate'])
    radius = row['crownRadiusM'] * 5.83
    draw.ellipse((x-radius,y-radius,x+radius,y+radius), fill=(20,150,70,170), outline=(0,80,0,255), width=2)
    draw.text((x,y), row['id'].split('-')[-1], fill='white')
Image.alpha_composite(base,overlay).convert('RGB').save(OUT/'barrio-context-source-overlay.jpg', quality=94)
print('Rebuilt source overlay.')
