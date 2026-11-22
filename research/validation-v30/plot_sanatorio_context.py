"""Reproduce the georeferenced context overlay, not a browser screenshot."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
data=json.loads((ROOT/'dist/assets/data/sanatorio-context.json').read_text())
b=data['provenance']['photoBounds'];w,h=data['provenance']['photoSize']
pixel=lambda p:((p[0]-b['west'])/(b['east']-b['west'])*w,(b['north']-p[1])/(b['north']-b['south'])*h)
base=Image.open(OUT/'sanatorio-context-orthophoto-reference.jpg').convert('RGBA')
overlay=Image.new('RGBA',base.size);d=ImageDraw.Draw(overlay)
colors={'sanatorio-road':(35,55,70,160),'sanatorio-sidewalk':(245,210,120,150),'sanatorio-park-path':(225,143,110,165),'sanatorio-park-green':(90,130,70,110),'sanatorio-park-earth':(190,165,110,140),'sanatorio-island-green':(70,150,70,145),'sanatorio-tree-bed':(110,100,80,200)}
for row in data['surfaces']:
 d.polygon([pixel(p) for p in row['coordinates']],fill=colors[row['component']],outline=(255,255,255,110))
 for hole in row['holes']:d.polygon([pixel(p) for p in hole],fill=(0,0,0,0))
for row in data['buildings']:d.line([pixel(p) for p in row['coordinates']],fill=(160,100,250,210),width=2)
for row in data['trees']:
 x,y=pixel(row['coordinate']);r=row['crownRadiusM']*4.97
 d.ellipse((x-r,y-r,x+r,y+r),fill=(20,145,70,160),outline=(0,75,0,255),width=2)
 d.text((x,y),row['id'].split('-')[-1],fill='white')
for key,row in data['focusSpecs'].items():
 x,y=pixel(row['targetCoordinates']);d.ellipse((x-8,y-8,x+8,y+8),fill=(230,40,160,255));d.text((x+9,y),key,fill=(230,40,160,255))
d.line([pixel(p) for p in data['precinctOutline']+[data['precinctOutline'][0]]],fill=(255,220,0,255),width=4)
Image.alpha_composite(base,overlay).convert('RGB').save(OUT/'sanatorio-context-source-overlay.jpg',quality=94)
print('Context overlay rebuilt.')
