"""Read the published simulator's WebGL state and capture a few repeatable fabric comparisons."""
import argparse
import json
import math
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base',required=True);parser.add_argument('--out',type=Path,required=True)
parser.add_argument('--new',action='store_true');parser.add_argument('--mobile',action='store_true')
opts=parser.parse_args();opts.out.mkdir(exist_ok=True,parents=True)
root=Path(__file__).resolve().parents[1]

def look(eye,target):
    dx,dy,dz=[b-a for a,b in zip(eye,target)]
    return dict(mode='fly',eye=eye,target=target,yaw=math.atan2(-dx,-dz),pitch=math.atan2(dy,math.hypot(dx,dz)))

major=json.loads((root/'research/validation-visual/v34/carrer-major.json').read_bytes())['camera']
views={'major':major,'barcelona':look([8025,7.4,856],[8000,9.4,910]),
       'naves':look([7752,64,1580],[7627,9,1496])}
report={}
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome')
    for name,camera in views.items():
        if opts.mobile and name!='barcelona':continue
        page=browser.new_page(viewport={'width':390,'height':844} if opts.mobile else {'width':1360,'height':816},
            device_scale_factor=2 if opts.mobile else 1,is_mobile=opts.mobile,has_touch=opts.mobile)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
        page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
        state=dict(camera=camera,hour=14.5,quality='0' if opts.mobile else '2',flags={'labels':False})
        page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+")")
        page.goto(opts.base.rstrip('/')+'/#simulador',wait_until='domcontentloaded',timeout=80000)
        page.wait_for_function("window.territoryStatus?.frameMs && territoryStatus.sectors>0",timeout=90000)
        if opts.new and name!='naves':
            page.wait_for_function('territoryStatus.fabric?.openings>0',timeout=60000)
        page.wait_for_timeout(4500)
        page.wait_for_function("!territoryStatus.pending && !territoryStatus.heritage.loading",timeout=90000)
        frames=page.evaluate("""async () => {const a=[];let prev;await new Promise(done=>{function tick(t){if(prev)a.push(t-prev);prev=t;if(a.length<90)requestAnimationFrame(tick);else done()}requestAnimationFrame(tick)});return a.sort((a,b)=>a-b)}""")
        status=page.evaluate('territoryStatus')
        report[name]={k:status.get(k) for k in ['camera','range','fabric','quality','drawCalls','triangles','sectors','heritage']}
        report[name].update(p50=round(frames[45],2),p95=round(frames[85],2),errors=errors)
        page.screenshot(path=str(opts.out/(name+'.jpg')),quality=90)
        page.close()
        print(name,report[name]['fabric'],report[name]['p50'],report[name]['p95'],errors,flush=True)
        assert not errors
    browser.close()
(opts.out/'checks.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8')
