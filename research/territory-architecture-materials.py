"""Build the architectural PBR atlases from Poly Haven CC0 scans and original joinery drawings.
Run: python research/territory-architecture-materials.py (requires Pillow, numpy, requests).
The runtime only loads the local WebP atlases. Source photographs are cached outside the repository.
"""
from concurrent.futures import ThreadPoolExecutor
from hashlib import md5
from pathlib import Path
import tempfile
import numpy as np
import requests
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/materials/architecture'
CACHE = Path(tempfile.gettempdir()) / 'saguntum-polyhaven-architecture'
OUT.mkdir(exist_ok=True, parents=True)
CACHE.mkdir(exist_ok=True)
SOURCES = ['white_plaster_02', 'brick_wall_12', 'corrugated_iron_02', 'sandstone_blocks_05',
           'concrete_floor_02', 'clay_roof_tiles_03', 'corrugated_iron', 'plastered_stone_wall']


def scanned(item):
    index, name = item
    response = requests.get('https://api.polyhaven.com/files/' + name, timeout=40)
    response.raise_for_status()
    manifest = {k.lower(): v for k, v in response.json().items()}
    maps = []
    for kind in ['diffuse', 'nor_gl', 'rough']:
        entry = manifest[kind]['1k']['jpg']
        path = CACHE / entry['url'].split('/')[-1]
        if not path.exists() or md5(path.read_bytes()).hexdigest() != entry['md5']:
            result = requests.get(entry['url'], timeout=80)
            result.raise_for_status()
            assert md5(result.content).hexdigest() == entry['md5']
            path.write_bytes(result.content)
        maps.append(np.asarray(Image.open(path).convert('RGB').resize((504, 504), Image.Resampling.LANCZOS)))
    # Keep hue variation and original contrast; neutralize the mean so PNOA / finish tints remain useful.
    albedo = maps[0].astype(float)
    albedo = np.clip(albedo / np.maximum(15, np.mean(albedo, axis=(0, 1))) * 174, 0, 255).astype('uint8')
    normals = np.dstack((maps[1][:, :, :2], maps[2][:, :, 0]))
    # Rows begin at the bottom in WebGL. Four-pixel wrap guards preserve bilinear edges.
    return index, [Image.fromarray(np.pad(buf, ((4, 4), (4, 4), (0, 0)), mode='wrap'))
                   for buf in [albedo, normals]]


def bay(style, variant):
    # A 3 m storey viewed face-on. All glass gets an independent optical material mask.
    img = Image.new('RGBA', (256, 256))
    mask = Image.new('L', img.size)
    d = ImageDraw.Draw(img)
    glass_mask = ImageDraw.Draw(mask)
    alternate = variant >= 4
    variant %= 4
    upper = variant < 2
    balcony = variant == 0
    old, flats, brick, shed, rural, shops = [style == i for i in range(6)]
    if shed:
        bounds = (35, 52, 218, 242) if variant == 2 else (14, 48, 242, 105)
    elif upper:
        bounds = (74 if old or rural else 57, 40 if old else 49, 182 if old or rural else 199,
                  225 if balcony else 181)
    elif variant == 2:
        bounds = (79 if old or rural else 64, 47, 177 if old or rural else 192, 251)
    else:
        bounds = (30, 54, 226, 240) if shops or flats or brick else (72, 56, 184, 177)
    l,t,r,b = bounds
    def rect(box, color):
        d.rectangle(box, fill=color)
    # Ambient occlusion cast by the brow, jambs and sill on the plaster.
    shade = Image.new('RGBA', img.size)
    shadow = ImageDraw.Draw(shade)
    shadow.rectangle((l-4,t-3,r+7,b+7), fill=(49,38,32,100))
    img.alpha_composite(shade.filter(ImageFilter.GaussianBlur(3.4)))
    trim = '#d7c8ae' if old or rural else '#c6c1b2' if flats else '#aaa59c'
    jamb = '#787164' if old else '#6b716e'
    frame = '#60584a' if old or rural else '#526161' if shed else '#c7cecb'
    rect((l-5,t-5,r+5,b+3), trim)
    rect((l-1,t-1,r+1,b+1),jamb)
    rect((l+1,t+2,r-1,b-1),'#382f27' if old else '#384341')
    if old and upper:
        rect((l-9,t-8,r+9,t-5),'#e0d4be')
        rect((l-7,t-4,r+7,t-2),'#9c8e79')
    # Timber entrance, upper fanlight and double-leaf recessed panels.
    if variant == 2 and (old or rural):
        rect((l+5,t+4,r-5,b), '#4c5142' if alternate else '#48382b')
        rect((l+9,t+9,r-9,t+31), '#526868')
        for xx in [l+11,(l+r)//2-1,r-12]:
            rect((xx,t+9,xx+2,t+31), '#292e2a')
        for xx in [l+10,(l+r)//2+3]:
            width = (r-l)//2-13
            for y0,y1 in [(t+39,b-72),(b-61,b-12)]:
                rect((xx,y0,xx+width,y1),'#765640')
                rect((xx+2,y0+2,xx+width-2,y1-2),'#342d25')
                rect((xx+4,y0+5,xx+width-4,y1-4),'#545b4b' if alternate else '#5b4231')
                for grain in range(xx+5,xx+width-4,3):
                    d.line((grain,y0+7,grain,y1-7),fill='#525946' if alternate else '#5c4635')
        rect(((l+r)//2+6,b-88,(l+r)//2+9,b-78),'#ad9270')
        glass_mask.rectangle((l+9,t+9,r-9,t+31),fill=160)
    elif variant == 2 and shed or alternate and variant == 3 and (flats or brick):
        rect((l+4,t+4,r-4,b),'#71807e')
        for y in range(t+8,b-3,7):
            rect((l+5,y,r-5,y+1),'#536461')
            rect((l+6,y+2,r-5,y+2),'#95a09a')
        rect((l+8,b-7,r-8,b-4),'#33433e')
    else:
        il,it,ir,ib = l+6,t+6,r-6,b-4
        glass = Image.new('RGB',(ir-il+1,ib-it+1))
        gd = ImageDraw.Draw(glass)
        # Reflections of a bright sky above diffuse interior depth and a lower, warm streetscape.
        for y in range(glass.height):
            q = y/max(1,glass.height-1)
            c = [int((1-q)*a+q*f) for a,f in zip((114,147,157),(49,65,63))]
            gd.line((0,y,glass.width,y),fill=tuple(c))
        w,h = glass.size
        gd.polygon([(0,int(.57*h)),(int(.16*w),int(.52*h)),(int(.34*w),int(.57*h)),
                    (int(.34*w),int(.66*h)),(int(.69*w),int(.66*h)),(int(.69*w),int(.59*h)),
                    (w,int(.56*h)),(w,h),(0,h)], fill='#596761')
        # Low contrast reflected light from an opposite elevation and a partly drawn curtain.
        gd.rectangle((int(w*.68),0,int(w*.85),h),fill='#6b8386')
        gd.line((int(w*.85),0,int(w*.85),h),fill='#72898c')
        if alternate:
            for j in range(max(4,w//4)):
                v=int(107+17*np.cos(j*.82))
                gd.line((j,1,max(0,j-4),h-2),fill=(v+10,v+7,v))
        img.paste(glass,(il,it))
        glass_mask.rectangle((il,it,ir,ib),fill=240)
        if old or rural:
            for xx in [il+2,ir-14]:
                for j in range(11):
                    yy = ib-int(h*.12*j/11)
                    d.line((xx+j,it+4,xx+j,yy),fill=(135+j*3,133+j*3,114+j*3))
                    glass_mask.line((xx+j,it+4,xx+j,yy),fill=30)
        splits = 5 if shed else 3 if shops and not upper else 2
        for j in range(1,splits):
            xx = round(il+(ir-il)*j/splits)
            rect((xx-2,it,xx+2,ib),frame)
            glass_mask.rectangle((xx-2,it,xx+2,ib),fill=0)
        if old or rural or shed or not upper:
            yy = it+int(h*(.27 if old or rural else .2))
            rect((il,yy-1,ir,yy+2),frame)
            glass_mask.rectangle((il,yy-1,ir,yy+2),fill=0)
        # Roller shutters and the outer cassette used in Mediterranean housing.
        if (brick or flats or shops or rural) and upper:
            end = it+((int(h*.64) if alternate else 13) if balcony else
                      (int(h*.44) if alternate else 35 if flats else 23))
            rect((il,it,ir,end), '#c0b9a5')
            for y in range(it+2,end,3):
                d.line((il,y,ir,y),fill='#8e8e7f')
            rect((il,end,ir,end+2),'#777a70')
            glass_mask.rectangle((il,it,ir,end+2),fill=0)
        if not upper and variant==3 and not (old or rural or shed):
            rect((il,ib-17,ir,ib),'#686d63')
            glass_mask.rectangle((il,ib-17,ir,ib),fill=0)
        if not upper and variant==2:
            rect(((l+r)//2+9,(it+ib)//2,(l+r)//2+11,(it+ib)//2+12),'#d7d8c8')
    if alternate and (old or rural) and (upper or variant==3):
        # Open or closed wooden louvres. Paint fills only the timber, preserving glass elsewhere.
        closed=balcony
        leaf=(r-l)//2-3
        for x0,x1 in ([(l+3,l+3+leaf),(r-3-leaf,r-3)] if closed else
                      [(l-leaf-7,l-8),(r+8,r+leaf+7)]):
            rect((x0,t+1,x1,b-1),'#637563')
            rect((x0+3,t+4,x1-3,b-5),'#44594e')
            for xx in range(t+9,b-6,4):
                rect((x0+5,xx,x1-5,xx+1),'#788777')
                rect((x0+5,xx+2,x1-5,xx+2),'#526b5c')
            if closed: glass_mask.rectangle((x0,t,x1,b),fill=0)
    if not upper and variant==2 and not shed:
        rect((r+10,b-93,r+16,b-81),'#656a61')
        d.point((r+13,b-84),fill='#d4cfb8')
    if not upper and variant==2:
        rect((l-4,b-3,r+4,b+1),'#a3a397')
    elif upper or old or rural or shed:
        rect((l-7,b+2,r+7,b+5),'#d6d1bf')
        rect((l-5,b+6,r+5,b+7),'#999687')
    return img,mask


def main():
    atlases = [Image.new('RGB',(2048,1024)) for _ in range(2)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for i, cells in pool.map(scanned,enumerate(SOURCES)):
            for atlas, cell in zip(atlases,cells):
                atlas.paste(cell,((i%4)*512,(1-i//4)*512))
    openings=Image.new('RGBA',(1536,2048))
    optical=Image.new('L',openings.size)
    for style in range(6):
        for variant in range(8):
            color,mask=bay(style,variant)
            pos=(style*256,(7-variant)*256)
            openings.paste(color,pos)
            optical.paste(mask,pos)
    optical=optical.resize((768,1024),Image.Resampling.LANCZOS)
    for name,source,options in [('surfaces',atlases[0],{'quality':85}),('microrelief',atlases[1],{'quality':88}),
                                ('joinery',openings,{'quality':94,'exact':True}),('glazing',optical,{'lossless':True})]:
        source.save(OUT/(name+'.webp'),method=6,**options)
        low=source.resize((source.width//2,source.height//2),Image.Resampling.LANCZOS)
        low.save(OUT/(name+'-compact.webp'),method=6,**options)


if __name__=='__main__':
    main()
