"""Source-ground alignment audit; this is not an in-browser WebGL screenshot."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'research/validation-v24'
data=json.loads((ROOT/'dist/assets/data/museo-industrial-context.json').read_text())
ref=Image.open(OUT/'museo-industrial-context-orthophoto-reference.jpg').convert('RGBA')
layer=Image.new('RGBA',ref.size);d=ImageDraw.Draw(layer)
pixel=lambda q:((q[0]+.2238)/.0045*1800,(39.6590-q[1])/.00295*1500)
colors={'museo-industrial-road':(72,111,137,110),'museo-industrial-forecourt':(213,187,126,100),'museo-industrial-yard':(184,172,143,85),'museo-industrial-gravel':(162,130,82,75),'museo-industrial-island':(111,161,128,115),'museo-industrial-sidewalk':(230,211,168,125)}
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
canvas=Image.new('RGB',(1800,1660),'#eef0e9');canvas.paste(image,(0,110));draw=ImageDraw.Draw(canvas)
try:
    large=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19)
except OSError:large=small=ImageFont.load_default()
draw.text((36,20),'MUSEO INDUSTRIAL · trazabilidad del entorno',fill='#22382c',font=large)
draw.text((36,66),'PNOA + ejes OSM + huellas Catastro. Cian: nave. Naranja: 69 partes vecinas. Verde: 30 árboles observados.',fill='#465648',font=small)
draw.text((36,1621),'165 m de alcance gráfico · propietarios patrimoniales preservados · superficies ajustadas a la malla regional de 5 m · 20/11/2026',fill='#465648',font=small)
canvas.save(OUT/'museo-industrial-context-source-plan.png')
