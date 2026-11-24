"""Render the published simulator entry and capture the same authored stops on each backend."""
import argparse
import json
import statistics
from pathlib import Path
from playwright.sync_api import sync_playwright

CASES={
    'panorama':'','castillo':'castle/foro','teatro':'theatre/teatro-orchestra',
    'glorieta':'glorieta/glorieta-romeu','horno':'horno/horno-acceso','gerencia':'gerencia/gerencia-oficinas',
    'barrio':'barrio-obrero/barrio-hileras','interior':'casino/casino-salon','excavacion':'portic/portic-acceso',
    'pantalan':'pantalan-paseo/pantalan-paseo-pergolas','maritimo':'pantalan-maritimo/pantalan-maritimo-tripodes',
    'grau':'grau-vell/grau-acceso','calle':'plaza-mayor/plaza-carrer-major',
    'jardines':'glorieta/glorieta-jardines','seccion':'circo/circo-estratos'
}
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',required=True)
parser.add_argument('--engine',choices=['atlas','previo','webgl2','webgpu'],required=True)
parser.add_argument('--out',type=Path,required=True)
parser.add_argument('--cases',nargs='+',choices=CASES,default=list(CASES))
args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True)
atlas=args.engine=='atlas'
summary=args.out/'vistas.json'
report=json.loads(summary.read_text(encoding='utf8')) if summary.exists() and set(args.cases)!=set(CASES) else {}
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome')
    for case in args.cases:
        place=CASES[case]
        page=browser.new_page(viewport={'width':1000,'height':640},device_scale_factor=1)
        errors=[]
        def error(value):
            msg=str(value)[:650]
            if msg not in errors:
                errors.append(msg)
                if len(errors)<=2:print(case,msg,flush=True)
        page.on('pageerror',error)
        page.on('console',lambda m:error(m.text) if m.type=='error' else None)
        engine=args.engine
        if engine in ('webgl2','webgpu'):
            page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(engine)+")")
        target=('#'+(place or 'atlas')) if atlas else ('#simulador'+('/'+place if place else ''))
        page.goto(args.base.rstrip('/')+'/'+target,wait_until='domcontentloaded')
        try:
            if atlas:
                page.wait_for_function("window.atlasStatus?.ready && document.querySelector('#loading')?.classList.contains('loaded')",timeout=90000)
            else:
                page.wait_for_function("window.territoryStatus?.camera || window.territoryStatus?.mode==='mapa 2D'",timeout=60000)
                active=page.evaluate("territoryStatus.graphics?.active||territoryStatus.graphics?.backend")
                if engine!='previo' and active!=engine:raise RuntimeError(page.evaluate("JSON.stringify(territoryStatus.graphics)"))
                page.wait_for_function("""([stop,gpu])=>{
                    const s=window.territoryStatus;
                    if(gpu&&sessionStorage.getItem('saguntum-renderer-failure-v4'))return true;
                    return stop?s?.heritage?.visit?.stop===stop&&!s.pending&&!s.heritage.loading:s?.aerial?.complete;
                }""",arg=[place.split('/')[-1] if place else None,engine=='webgpu'],timeout=60000)
            page.wait_for_timeout(1800)
            if engine=='webgpu':
                reason=page.evaluate("sessionStorage.getItem('saguntum-renderer-failure-v4')")
                if reason:raise RuntimeError(reason)
            timings=page.evaluate("""async()=>{const ms=[];let last;await new Promise(done=>requestAnimationFrame(function step(now){if(last)ms.push(now-last);last=now;if(ms.length===60)done();else requestAnimationFrame(step);}));return ms;}""")
            data=page.evaluate("window.territoryStatus?(({camera,graphics,triangles,drawCalls,sectors,geometries,textures,quality,range,heritage})=>({camera,graphics,triangles,drawCalls,sectors,geometries,textures,quality,range,levels:heritage?.levels,visit:heritage?.visit}))(territoryStatus):({selected:window.atlasStatus?.selected})")
            if engine=='webgpu' and data.get('graphics',{}).get('active')!='webgpu':
                raise RuntimeError(page.evaluate("sessionStorage.getItem('saguntum-renderer-failure-v4')"))
            if not atlas:
                page.screenshot(path=args.out/(case+'.jpg'),type='jpeg',quality=88,style="body > :not(#sim-world){visibility:hidden!important}")
            else:
                page.locator('#world canvas').screenshot(path=args.out/(case+'.jpg'),type='jpeg',quality=88,style="body *:not(canvas):not(:has(#world)):not(#world){visibility:hidden!important} #world canvas{visibility:visible!important}")
            data.update(p50ms=round(statistics.median(timings),1),p95ms=round(sorted(timings)[56],1),errors=errors)
            print(engine,case,data.get('drawCalls'),data['p50ms'],flush=True)
            if errors:raise RuntimeError(errors[:3])
            report[case]=data
        except Exception as exc:
            print('FAILED',case,str(exc)[:900],flush=True)
            print(page.evaluate("({url:location.href,status:document.querySelector('#sim-status')?.textContent,reason:document.querySelector('#sim-gpu-result')?.textContent})"),flush=True)
            raise
        finally:
            page.close()
            (args.out/'vistas.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    browser.close()
