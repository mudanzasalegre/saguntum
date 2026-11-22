"""Mide el renderizador real después de cargar cada vista, con Chromium instalado."""
import argparse, json, statistics
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base',default='http://127.0.0.1:8317/')
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True)
views={}
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome')
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.set_default_timeout(90000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(args.base+'#simulador',wait_until='domcontentloaded')
    page.wait_for_function('window.territoryStatus?.frameMs')
    gpu=page.evaluate("""() => {const gl=document.querySelector('#sim-world canvas').getContext('webgl2');return gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)}""")
    for key,query,model in [('panorama',None,None),('casco','Santa María','santa-maria'),('industria','Alto Horno','horno'),('calle',None,None),('fortin','Fortín','grau-vell'),('costa','Pantalán marítimo','pantalan')]:
        if query:
            page.locator('#sim-search-open').click();page.locator('#sim-query').fill(query);page.locator('#sim-results button').first.click()
            page.wait_for_function('(id)=>territoryStatus.heritage.loaded.includes(id)&&!territoryStatus.pending',arg=model,timeout=90000)
        if key=='calle':
            page.locator('[data-mode=walk]').click();page.wait_for_function("territoryStatus.mode==='walk'")
        page.wait_for_timeout(3500)
        frames=page.evaluate("""async () => {
          const times=[];let last=performance.now();
          await new Promise(resolve=>{function f(now){times.push(now-last);last=now;if(times.length<120)requestAnimationFrame(f);else resolve()} requestAnimationFrame(f)});
          return times.slice(1).sort((a,b)=>a-b);
        }""")
        s=page.evaluate('window.territoryStatus')
        views[key]={'p50Ms':round(statistics.median(frames),2),'p95Ms':round(frames[int(.95*len(frames))],2),**{k:s.get(k) for k in ('triangles','drawCalls','sectors','networkSectors','geometries','textures','heapMiB','quality','loadMs')}}
        page.screenshot(path=str(args.out/(key+'.jpg')),quality=85)
        print(key,views[key],flush=True)
    report={'gpu':gpu,'browser':browser.version,'viewport':[1440,900],'sampleFrames':119,'views':views,'errors':errors}
    (args.out/'mediciones.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    assert not errors,errors
    browser.close()
