"""Source-ground alignment audit; this is not an in-browser WebGL screenshot."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/validation-v23'
data=json.loads((ROOT/'dist/assets/data/talleres-context.json').read_text())
ref=Image.open(OUT/'talleres-context-orthophoto-reference.jpg').convert('RGBA')
layer=Image.new('RGBA',ref.size);d=ImageDraw.Draw(layer)
pixel=lambda q:((q[0]+.22060)/.0046*1800,(39.65785-q[1])/.00305*1600)
colors={'talleres-road':(72,111,137,110),'talleres-forecourt':(213,187,126,100),'talleres-yard':(184,172,143,85),'talleres-gravel':(162,130,82,75),'talleres-island':(111,161,128,115),'talleres-sidewalk':(230,211,168,125)}
for row in data['surfaces']:
    mask=Image.new('L',ref.size,0);md=ImageDraw.Draw(mask);md.polygon([pixel(q) for q in row['coordinates']],fill=255)
    for ring in row.get('holes',[]):md.polygon([pixel(q) for q in ring],fill=0)
    fill=Image.new('RGBA',ref.size,colors[row['component']]);layer.alpha_composite(Image.composite(fill,Image.new('RGBA',ref.size),mask))
d=ImageDraw.Draw(layer)
for row in data['buildings']:
    d.line([pixel(q) for q in row['coordinates']],fill=(228,124,62,235),width=3)
    for ring in row.get('holes',[]):d.line([pixel(q) for q in ring],fill=(228,124,62,235),width=2)
d.line([pixel(q) for q in data['coreExclusion']['coordinates']],fill=(49,195,207,255),width=4)
d.line([pixel(q) for q in data['districtOutline']],fill=(255,255,255,235),width=3)
for row in data['trees']:
    x,y=pixel(row['coordinate']);d.ellipse((x-6,y-6,x+6,y+6),fill=(93,154,61,245),outline=(255,255,245,230),width=2)
for row in data['crossings']:d.line([pixel(q) for q in row['coordinates']],fill=(255,246,217,240),width=4)
image=Image.alpha_composite(ref,layer).convert('RGB')
canvas=Image.new('RGB',(1800,1760),'#eef0e9');canvas.paste(image,(0,110));draw=ImageDraw.Draw(canvas)
try:
    large=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19)
except OSError:large=small=ImageFont.load_default()
draw.text((36,20),'TALLERES GENERALES · trazabilidad del entorno',fill='#22382c',font=large)
draw.text((36,66),'PNOA + ejes OSM + huellas Catastro. Cian: nave. Naranja: 31 partes residenciales. Verde: 49 árboles observados.',fill='#465648',font=small)
draw.text((36,1721),'195 m de alcance gráfico · exclusión del Alto Horno · superficies ajustadas a la malla regional de 5 m · 20/11/2026',fill='#465648',font=small)
canvas.save(OUT/'talleres-context-source-plan.png')
