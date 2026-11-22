"""Exercise the real simulator, collect photographic LOD bounds and WebGL renders."""
import argparse
import json
from pathlib import Path

import numpy as np
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base',default='http://127.0.0.1:8433/')
parser.add_argument('--out',type=Path,required=True)
parser.add_argument('--mobile',action='store_true')
args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True)
assets=Path(__file__).resolve().parents[1]/'dist/assets/territory'
meta=json.loads((assets/'world.json').read_text(encoding='utf8'))['terrain']['detail']
heights=np.fromfile(assets/meta['heights'],dtype='<i2').reshape(meta['height'],meta['width'])
def height(x,z):
    l,t,r,b=meta['bounds']
    return heights[round((z-t)/(b-t)*(meta['height']-1)), round((x-l)/(r-l)*(meta['width']-1))]*meta['unit']

views={
    'sagunto':([3390,-730],[3430,-626],95),
    'campos':([5655,-596],[5602,-526],48),
    'grau-vell':([6892,4074],[6968,4060],66),
    'cauce':([6581,-824],[6602,-816],11),
    'playa':([9357,1498],[9366,1509],4)}
results={}
with sync_playwright() as driver:
    browser=driver.chromium.launch(channel='chrome')
    for name,(at,eye,alt) in views.items():
        context=browser.new_context(viewport={'width':390,'height':780} if args.mobile else {'width':1040,'height':680},
                    has_touch=args.mobile,is_mobile=args.mobile)
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.on('console',lambda m: errors.append(m.text[:1500]) if m.type=='error' else None)
        page.on('response',lambda r: errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
        state=dict(flags={'labels':False},quality='1' if args.mobile else '2',hour=14,camera=dict(mode='orbit',
                       eye=[eye[0],height(*eye)+alt,eye[1]],target=[at[0],height(*at),at[1]],yaw=0,pitch=0))
        encoded=json.dumps(json.dumps(state))
        page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+encoded+");")
        page.goto(args.base+'#simulador',wait_until='domcontentloaded',timeout=60000)
        page.wait_for_function('window.territoryStatus?.frameMs',timeout=120000)
        page.evaluate("""async () => {
          const module=await import('./js/territory-surface-photo.js');
          window.inspectPhoto=module.surfacePhotoMetrics;
        }""")
        try:
            page.wait_for_function('inspectPhoto().requestedCells>=3 && inspectPhoto().requestedCells===inspectPhoto().cells.length && inspectPhoto().grains && territoryStatus.pending===0',timeout=70000)
        except Exception:
            print(name,'readiness',page.evaluate('[inspectPhoto(),territoryStatus]'),'errors',errors,flush=True)
            raise
        data=page.evaluate("""() => ({photo:inspectPhoto(),mode:territoryStatus.mode,
          frameMs:territoryStatus.frameMs,triangles:territoryStatus.triangles,
          calls:territoryStatus.drawCalls, range:territoryStatus.range,
          requests:performance.getEntriesByType('resource').filter(r=>r.name.includes('/surface-photo/')).map(r=>r.name.split('/').pop())})""")
        data['errors']=errors
        assert not errors,errors
        assert data['mode']=='orbit' and data['triangles']>10000
        assert data['photo']['sheetCount']<=4
        assert data['photo']['sampleMetres']==(.5 if args.mobile else .25)
        if args.mobile and name=='sagunto': assert any('.half.webp' in url for url in data['requests'])
        page.locator('#sim-world canvas').screenshot(path=str(args.out/(name+'.jpg')),quality=87,timeout=60000)
        results[name]=data
        print(name,data,flush=True)
        context.close()
    context=browser.new_context(viewport={'width':800,'height':620})
    page=context.new_page()
    page.goto(args.base+'#simulador',wait_until='domcontentloaded')
    page.wait_for_function('window.territoryStatus?.frameMs',timeout=120000)
    overview=page.evaluate("""() => performance.getEntriesByType('resource')
       .filter(r=>r.name.includes('/surface-photo/') && !r.name.endsWith('index.json')).length""")
    assert overview==0
    # A missing near sheet must fall back to the original regional photograph.
    page.route('**/surface-photo/*.webp',lambda route: route.fulfill(status=404,body='QA'))
    page.locator('#sim-search-open').click()
    page.locator('#sim-query').fill('Teatro Romano')
    page.locator('#sim-results button').first.click()
    page.wait_for_function("""() => performance.getEntriesByType('resource')
        .some(r=>r.name.endsWith('/assets/data/orthophoto.jpg')) && territoryStatus.range<160""",timeout=65000)
    assert page.evaluate("territoryStatus.mode==='orbit'")
    page.locator('#sim-home').click()
    page.wait_for_function('territoryStatus.range>4500 && territoryStatus.photo?.sampleMetres===null',timeout=55000)
    page.unroute('**/surface-photo/*.webp')
    page.locator('#sim-search-open').click()
    page.locator('#sim-query').fill('Teatro Romano')
    page.locator('#sim-results button').first.click()
    page.wait_for_function('territoryStatus.photo?.cells.length>=3 && territoryStatus.photo.grains',timeout=60000)
    results['degradacion']={'panoramaSolicitudesDePlacas':overview,'placaRegionalRecuperada':True,
                            'atlasGPULiberadoYRecuperado':True}
    context.close()
    browser.close()
(args.out/'checks.json').write_text(json.dumps(results,indent=2),encoding='utf8')
