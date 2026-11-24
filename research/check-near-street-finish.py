"""Capture the surveyed Carrer Major street frame using the production simulator route."""
import argparse
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright


def capture(browser,base,engine,state,path,modules=None):
    context=browser.new_context(viewport={'width':1200,'height':760},device_scale_factor=1)
    def module_handler(content):
        def fulfill(route):
            route.fulfill(body=content,content_type='text/javascript')
        return fulfill
    for module,body in (modules or {}).items():
        context.route('**/js/'+module,module_handler(body))
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text[:1000]) if m.type=='error' else None)
    page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(engine)+");"+
                         "sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+");")
    page.goto(base.rstrip('/')+'/#simulador',wait_until='domcontentloaded')
    page.wait_for_function("""()=>{const s=window.territoryStatus;return s?.aerial?.complete&&!s.pending&&
        s.fabric?.openings>0&&s.photo?.cells?.length>0&&!s.heritage.loading;}""",timeout=120000)
    page.wait_for_function("async()=> (await import('./js/territory-building-material.js')).architectureScans().uArchReady.value===1")
    page.wait_for_timeout(1200)
    metrics=page.evaluate("""()=>({engine:territoryStatus.graphics.active,pose:territoryStatus.camera,
        openings:territoryStatus.fabric.openings,photoCells:territoryStatus.photo.cells.length})""")
    page.screenshot(path=path,style="body > :not(#sim-world){visibility:hidden!important}")
    context.close()
    assert not errors and metrics['engine']==engine,(metrics,errors)
    return metrics


def metrics(a,b):
    x,y=[np.array(Image.open(p).convert('RGB'),dtype=float) for p in (a,b)]
    delta=np.abs(x-y)
    return {'width':x.shape[1],'height':x.shape[0],'meanAbsoluteRGB255':round(float(delta.mean()),3),
            'changedPixelsOver12':int((delta.max(axis=2)>12).sum()),
            'rgbCorrelation':round(float(np.corrcoef(x.ravel(),y.ravel())[0,1]),5)}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',required=True);parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--reference',required=True,help='Prior Git revision containing the four renderer material files')
    args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    root=Path(__file__).resolve().parents[1]
    names=['territory-building-material.js','territory-node-urban-architecture.js','territory-node-urban-street.js','territory-street-surfaces.js']
    modules={n:subprocess.check_output(['git','show',args.reference+':dist/js/'+n],cwd=root) for n in names}
    previous=json.loads((root/'research/validation-visual/v34/carrer-major.json').read_bytes())
    state=dict(camera={**previous['camera'],'fov':38},quality='2',hour=previous['hour'],
               lightPreference='solar',solarDate='2026-03-20',flags=dict(labels=False,cars=False,people=False))
    result={'camera':'Carrer Major','reference':args.reference}
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome')
        for key,engine,overrides in [('antes','webgl2',modules),('webgl2','webgl2',None),('webgpu','webgpu',None)]:
            result[key]=capture(browser,args.base,engine,state,args.out/(key+'.png'),overrides)
            print(key,result[key]['openings'],flush=True)
        browser.close()
    result['beforeAfter']=metrics(args.out/'antes.png',args.out/'webgl2.png')
    result['backendComparison']=metrics(args.out/'webgl2.png',args.out/'webgpu.png')
    (args.out/'calle.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    assert result['antes']['pose']['eye']==result['webgl2']['pose']['eye']==result['webgpu']['pose']['eye']
    assert result['beforeAfter']['changedPixelsOver12']>100 and result['backendComparison']['rgbCorrelation']>.88,result
