"""Comprueba cámaras y monta una lámina a partir de capturas reales de Chromium."""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parent/'validation-visual'
expected={'carrer-major','puerto','alto-horno','grau-vell','costa','mar-abierto','anochecer','panorama','casco-aereo'}
for path in (root/'v34').glob('*.json'):
    before,after=[json.loads((root/version/path.name).read_bytes()) for version in ['v33','v34']]
    assert before['hour']==after['hour'] and before['mode']==after['mode']
    for key in ['eye','target']:
        assert math.dist(before['camera'][key],after['camera'][key])<.001,(path.name,key)
    for key in ['yaw','pitch']:
        assert abs(before['camera'][key]-after['camera'][key])<1e-6,(path.name,key)
    assert not before['errors'] and not after['errors']
    assert after['aerial']['complete'] and not after['aerial']['failures']
    expected.remove(path.stem)
assert not expected,expected

rows=[('carrer-major','Carrer Major'),('casco-aereo','Cubiertas del casco histórico'),
      ('grau-vell','Fortín y poblado del Grau Vell'),('mar-abierto','Pantalán hacia el Mediterráneo')]
size=(690,414)
def font(size):
    for name in ['segoeui.ttf','DejaVuSans.ttf']:
        try: return ImageFont.truetype(name,size)
        except OSError: pass
    return ImageFont.load_default()
canvas=Image.new('RGB',(1428,72+len(rows)*468),(238,237,230))
draw=ImageDraw.Draw(canvas)
for i,label in enumerate(['VERSIÓN 33','VERSIÓN 34']):
    draw.text((16+i*706,21),label,font=font(25),fill='#213b3b')
for i,(name,label) in enumerate(rows):
    y=68+i*468
    draw.text((16,y),label,font=font(22),fill='#29433f')
    for j,version in enumerate(['v33','v34']):
        img=Image.open(root/version/(name+'.jpg'))
        assert img.size==(1360,816)
        canvas.paste(img.resize(size,Image.Resampling.LANCZOS),(16+j*706,y+37))
canvas.save(root/'comparativa.jpg',quality=91,optimize=True)
