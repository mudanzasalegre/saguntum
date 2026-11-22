"""Source-ground alignment audit; this is not an in-browser WebGL screenshot."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/validation-v25'
data=json.loads((ROOT/'dist/assets/data/gerencia-context.json').read_text())
ref=Image.open(OUT/'gerencia-context-orthophoto-reference.jpg').convert('RGBA')
layer=Image.new('RGBA',ref.size);d=ImageDraw.Draw(layer)
pixel=lambda q:((q[0]+.2255)/.0048*1800,(39.66025-q[1])/.0025*1215)
colors={'gerencia-road':(72,111,137,110),'gerencia-path':(237,205,135,130),'gerencia-sidewalk':(230,211,168,125),'gerencia-open-ground':(153,133,95,55),'gerencia-east-garden':(111,161,128,65),'gerencia-garden':(128,141,102,60)}
for row in data['surfaces']:
    mask=Image.new('L',ref.size,0);md=ImageDraw.Draw(mask);md.polygon([pixel(q) for q in row['coordinates']],fill=255)
    for ring in row.get('holes',[]):md.polygon([pixel(q) for q in ring],fill=0)
    fill=Image.new('RGBA',ref.size,colors[row['component']]);layer.alpha_composite(Image.composite(fill,Image.new('RGBA',ref.size),mask))
d=ImageDraw.Draw(layer)
for row in data['buildings']:
    d.line([pixel(q) for q in row['coordinates']],fill=(228,124,62,235),width=3)
    for ring in row.get('holes',[]):d.line([pixel(q) for q in ring],fill=(228,124,62,235),width=2)
d.line([pixel(q) for q in data['precinctOutline']],fill=(49,195,207,255),width=4)
for row in data['paths']:d.line([pixel(q) for q in row['coordinates']],fill=(246,224,177,230),width=3)
for i,(key,row) in enumerate(data['focusSpecs'].items()):
 x,y=pixel(row['targetCoordinates']);d.ellipse((x-13,y-13,x+13,y+13),fill=(66,62,107,245),outline=(255,255,255,255),width=2);d.text((x-4,y-7),str(i+1),fill='white')
d.line([pixel(q) for q in data['districtOutline']],fill=(255,255,255,235),width=3)
for row in data['trees']:
    x,y=pixel(row['coordinate']);d.ellipse((x-6,y-6,x+6,y+6),fill=(93,154,61,245),outline=(255,255,245,230),width=2)
for row in data['crossings']:d.line([pixel(q) for q in row['coordinates']],fill=(255,246,217,240),width=4)
image=Image.alpha_composite(ref,layer).convert('RGB')
canvas=Image.new('RGB',(1800,1375),'#eef0e9');canvas.paste(image,(0,110));draw=ImageDraw.Draw(canvas)
try:
    large=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19)
except OSError:large=small=ImageFont.load_default()
draw.text((36,20),'GERENCIA Y CIUDAD JARDÍN · trazabilidad del entorno',fill='#22382c',font=large)
draw.text((36,66),'PNOA + OSM + Catastro. Cian: recinto. Naranja: 143 partes vecinas. Verde: 105 árboles. Puntos: siete vistas del jardín.',fill='#465648',font=small)
draw.text((36,1336),'Recinto y franja vecina de 42 m · propietarios previos conservados · jardín oriental y oeste sin equiparar su rehabilitación · 21/11/2026',fill='#465648',font=small)
canvas.save(OUT/'gerencia-context-source-plan.png')
