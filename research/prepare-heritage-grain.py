"""Combina microrelieve de cuatro escaneos CC0, sin reimprimir sus juntas sobre los modelos."""
from hashlib import md5
from pathlib import Path
import tempfile
import numpy as np
import requests
from PIL import Image, ImageFilter

cache = Path(tempfile.gettempdir())/'saguntum-polyhaven-architecture'
cache.mkdir(exist_ok=True)
atlas = Image.new('RGB',(1024,1024))
for i,asset in enumerate(['sandstone_blocks_05','concrete_floor_02','rusty_metal_02','brick_wall_12']):
    manifest = {k.lower():v for k,v in requests.get('https://api.polyhaven.com/files/'+asset,timeout=30).json().items()}
    channels = []
    for kind in ['nor_gl','rough']:
        item = manifest[kind]['1k']['jpg']
        src = cache/item['url'].split('/')[-1]
        if not src.exists() or md5(src.read_bytes()).hexdigest()!=item['md5']:
            response=requests.get(item['url'],timeout=75)
            response.raise_for_status()
            if md5(response.content).hexdigest()!=item['md5']: raise ValueError(asset)
            src.write_bytes(response.content)
        photo = Image.open(src).convert('RGB')
        # Subtract low frequencies: keep pores, pits and grain, remove block joints.
        high = np.asarray(photo,dtype=float)-np.asarray(photo.filter(ImageFilter.GaussianBlur(7)),dtype=float)
        channels.extend([high[:,:,0],high[:,:,1]] if kind=='nor_gl' else [high[:,:,0]])
    packed = Image.fromarray(np.uint8(np.clip(128+np.stack(channels,axis=-1)*1.55,0,255)))
    tile = np.pad(np.asarray(packed.resize((504,504),Image.Resampling.LANCZOS)),((4,4),(4,4),(0,0)),mode='wrap')
    atlas.paste(Image.fromarray(tile),((i%2)*512,(i//2)*512))
out=Path(__file__).resolve().parent.parent/'dist/assets/materials/heritage/grain.webp'
out.parent.mkdir(parents=True,exist_ok=True)
atlas.save(out,quality=97,method=6)
