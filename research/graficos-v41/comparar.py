"""Comprueba el encuadre y monta tres pares de imágenes tomadas del canvas WebGL."""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).parent
for name in ["calle","costa"]:
    old, new = [json.loads((root/version/(name+".json")).read_bytes()) for version in ("v40","v41")]
    for field in ("eye","target","yaw","pitch","fov"):
        assert np.allclose(old["camera"][field],new["camera"][field],atol=.001), (name,field)
    assert old["hour"] == new["hour"] and old["lighting"] == new["lighting"]
    for field in ("geometry","reflection","normal","shore"):
        assert old["water"][field] == new["water"][field], field

def font(size):
    for name in ("segoeui.ttf","DejaVuSans.ttf"):
        try:return ImageFont.truetype(name,size)
        except OSError:pass
    return ImageFont.load_default()

for name,title,left,right,labels in (
    ("fachadas","Carrer Major", "v40/calle.jpg","v41/calle.jpg",("Versión 40","Simulador actualizado")),
    ("mediterraneo","Pantalán marítimo y Mediterráneo", "v40/costa.jpg","v41/costa.jpg",("Versión 40","Simulador actualizado")),
    ("alto-horno","Alto Horno n.º 2 · Acceso", "v41/atlas/horno-acceso.jpg","v41/horno-acceso.jpg",("Visita del Atlas","Simulador actualizado")),
):
    sheet=Image.new("RGB",(1624,586),"#f5f1e9")
    draw=ImageDraw.Draw(sheet)
    draw.text((12,7),title,font=font(25),fill="#253c39")
    for idx,(path,label) in enumerate(zip((left,right),labels)):
        source=Image.open(root/path).convert("RGB")
        assert source.size==(1200,760)
        x=12+idx*806
        draw.text((x,44),label,font=font(18),fill="#335953")
        sheet.paste(source.resize((794,503),Image.Resampling.LANCZOS),(x,74))
    sheet.save(root/(name+".jpg"),quality=91,optimize=True)
