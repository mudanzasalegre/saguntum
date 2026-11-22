"""Captura el mismo encuadre en dos versiones del renderizador WebGL de SAGUNTUM."""
import argparse
import json
import math
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base', required=True)
parser.add_argument('--out', type=Path, required=True)
parser.add_argument('--only', nargs='*')
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)

def flying(eye, target):
    dx, dy, dz = [b-a for a, b in zip(eye, target)]
    return dict(mode='fly', eye=eye, target=target, yaw=math.atan2(-dx,-dz),
                pitch=math.atan2(dy,math.hypot(dx,dz)))

previous = json.loads((Path(__file__).parent/'validation-territory/rtx3090/resultados.json').read_bytes())['snapshots']
views = {
    'carrer-major': (flying([3668,-100,-674],[3618,-99,-687]), 14.5, None),
    'puerto': (previous['peaton']['camera'], 15, None),
    'alto-horno': (flying([8525,23,1978],[8483,31,1918]), 15.5, 'horno'),
    'grau-vell': (previous['fortin']['camera'], 16, 'grau-vell'),
    'costa': (flying([10335,13,2473],[10262,8,2418]), 9, 'pantalan'),
    'mar-abierto': (flying([10335,14,2473],[10455,9,2498]), 7.5, 'pantalan'),
    'anochecer': (previous['peaton']['camera'], 18.5, None),
    'panorama': (previous['panorama']['camera'], 16, None),
}
# Use the local ground elevation for the low camera in Carrer Major.
root = Path(__file__).resolve().parent.parent/'dist/assets/territory'
grid = json.loads((root/'world.json').read_bytes())['terrain']['detail']
from struct import unpack_from
data = (root/grid['heights']).read_bytes()
def ground(x,z):
    l,t,r,b = grid['bounds']
    u = (x-l)*(grid['width']-1)/(r-l)
    v = (z-t)*(grid['height']-1)/(b-t)
    i,j = math.floor(u), math.floor(v)
    u,v = u-i,v-j
    def value(dx,dz): return unpack_from('<h', data,2*((j+dz)*grid['width']+i+dx))[0]*grid['unit']
    a,b,c,d = (value(*pt) for pt in [(0,0),(1,0),(0,1),(1,1)])
    return a+(b-a)*u+(c-a)*v if u+v<=1 else d+(c-d)*(1-u)+(b-d)*(1-v)
views['carrer-major'] = (flying([3668,ground(3668,-674)+3,-674],[3618,ground(3618,-687)+4,-687]),14.5,None)
views['casco-aereo'] = (flying([3390,ground(3390,-730)+95,-730],[3430,ground(3430,-626),-626]),15,None)

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    for name,(camera,hour,heritage) in views.items():
        if args.only and name not in args.only: continue
        page = browser.new_page(viewport={'width':1360,'height':816}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.on('console',lambda msg: errors.append(msg.text) if msg.type=='error' else None)
        page.on('response', lambda r: errors.append(f'{r.status} {r.url}') if r.status>=400 else None)
        state = dict(camera=camera, quality='2', hour=hour, flags={'labels':False})
        page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+")")
        page.goto(args.base.rstrip('/')+'/#simulador',wait_until='domcontentloaded',timeout=90000)
        page.wait_for_function("window.territoryStatus?.frameMs", timeout=90000)
        if heritage:
            page.wait_for_function("id=>territoryStatus.heritage.loaded.includes(id)",arg=heritage,timeout=120000)
        page.wait_for_timeout(2800)
        page.wait_for_function("!territoryStatus.pending && !territoryStatus.heritage.loading",timeout=90000)
        if name=='panorama':
            page.wait_for_function("!territoryStatus.aerial || territoryStatus.aerial.complete",timeout=90000)
        if name in ('casco-aereo','grau-vell','carrer-major','puerto'):
            page.wait_for_function("!territoryStatus.photo || territoryStatus.photo.cells.length>0",timeout=90000)
        page.locator('#sim-world canvas').screenshot(path=str(args.out/(name+'.jpg')),quality=92)
        state = page.evaluate("""() => {const g=document.querySelector('#sim-world canvas').getContext('webgl2');return {...territoryStatus,
          gpu:g.getParameter(g.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)}}""")
        state['errors'] = errors
        (args.out/(name+'.json')).write_text(json.dumps(state,indent=2,ensure_ascii=False),encoding='utf8')
        print(name,state['frameMs'],state['drawCalls'],errors,flush=True)
        page.close()
        if errors: raise RuntimeError(errors)
    browser.close()
