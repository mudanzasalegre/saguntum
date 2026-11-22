"""Comprueba el flujo real mediante Chromium. Ejecutar contra el servidor local."""
import argparse
import json
import math
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base',default='http://127.0.0.1:8317/')
parser.add_argument('--out',type=Path,required=True)
parser.add_argument('--mobile',action='store_true')
parser.add_argument('--software',action='store_true')
parser.add_argument('--fallback',action='store_true')
args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True)
results,errors=[],[]
def check(label,value):
    assert value,label
    results.append(label)
    print(label,flush=True)
with sync_playwright() as p:
    flags=['--enable-unsafe-swiftshader','--use-angle=swiftshader'] if args.software else []
    if args.fallback:flags+=['--disable-webgl']
    browser=p.chromium.launch(channel='chrome',args=flags)
    page=browser.new_page(viewport={'width':390,'height':844} if args.mobile else {'width':1240,'height':780},has_touch=args.mobile,is_mobile=args.mobile)
    page.set_default_timeout(60000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text[:700]) if m.type=='error' and not args.fallback else None)
    page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
    snapshots={}
    def wait(expr):page.wait_for_function(expr,timeout=120000)
    def shot(label):
        path=args.out/(label+'.jpg')
        page.screenshot(path=str(path),quality=85,timeout=90000)
        s=page.evaluate('window.territoryStatus')
        if s:snapshots[label]=s
    def status():return page.evaluate('window.territoryStatus')
    def wait_atlas_frame(place,model,exterior=False):
        data=page.evaluate("async()=>await (await fetch('./assets/territory/atlas-frames.json')).json()")[place]
        view=(data['exterior'] if exterior else data)['portrait' if args.mobile else 'wide']
        expected=math.dist(view['eye'],view['target'])
        page.wait_for_function("""([place,model,expected])=>territoryStatus.selected===place &&
            territoryStatus.heritage?.loaded.includes(model) &&
            Math.abs(territoryStatus.range-expected)<Math.max(2,expected*.02)""",arg=[place,model,expected],timeout=120000)
    def choose(query,label=None):
        page.locator('#sim-search-open').click()
        page.locator('#sim-query').fill(query)
        selector=page.locator('#sim-results button')
        if label:selector=selector.get_by_text(label,exact=True)
        selector.first.click()
    try:
        if args.fallback:
            page.goto(args.base+'#simulador');wait('window.territoryStatus?.ready')
            check('Alternativa 2D',status()['mode']=='mapa 2D')
            choose('Teatro Romano');check('Visita accesible desde el mapa',page.locator('#sim-visit').get_attribute('href')=='#theatre')
            shot('mapa-2d')
        else:
            page.goto(args.base);wait('window.atlasStatus?.ready')
            check('Portada global',page.title()=='SAGUNTUM · Sagunto y Puerto de Sagunto' and page.url.endswith('#atlas'))
            page.locator('.simulator-entry').click()
            wait('window.territoryStatus?.frameMs')
            check('Panorámica territorial',status()['places']==31 and status()['range']>4500)
            shot('panorama')
            choose('Alto Horno')
            wait_atlas_frame('horno','horno');wait('territoryStatus.sectors>2')
            shot('alto-horno')
            check('Escena industrial y edificios cargados',not status()['heritage']['failures'])
            page.locator('#sim-settings-open').click();page.locator('#sim-time').fill('22');page.locator('[data-flag="cars"]').uncheck()
            wait("territoryStatus.hour===22 && territoryStatus.traffic?.cars===0")
            page.locator('#sim-settings [data-close]').click();shot('noche')
            page.locator('#sim-visit').click();wait("window.atlasStatus?.ready && location.hash.startsWith('#horno')")
            check('Visita patrimonial del Alto Horno',page.locator('#horno-panel').is_visible())
            page.locator('#sim-return').click()
            wait("window.territoryStatus?.selected==='horno' && territoryStatus.frameMs")
            check('Restauración de hora y posición',status()['hour']==22 and abs(status()['range']-snapshots['noche']['range'])<3)
            page.locator('#sim-settings-open').click();page.locator('#sim-time').fill('12');page.locator('#sim-settings [data-close]').click()
            page.locator('#sim-clear').click();page.locator('[data-mode=walk]').click()
            wait("territoryStatus.camera?.mode==='walk' && territoryStatus.networkSectors>0 && !territoryStatus.pending")
            page.keyboard.down('w');page.wait_for_timeout(600);page.keyboard.up('w');shot('peaton')
            page.locator('[data-mode=fly]').click();wait("territoryStatus.camera?.mode==='fly'")
            before=status()['camera']['eye'];page.keyboard.down('e')
            try: page.wait_for_function('y=>territoryStatus.camera.eye[1]>y+.1',arg=before[1],timeout=15000)
            finally: page.keyboard.up('e')
            check('Ascenso en vuelo libre',status()['camera']['eye'][1]>before[1]+.1)
            page.locator('#sim-home').click();page.locator('#sim-tour').click();wait('territoryStatus.touring===true')
            page.locator('#sim-tour').click();wait('territoryStatus.touring===false')
            check('Inicio y parada del itinerario',True)
            choose('Fortín');wait_atlas_frame('grau-vell','grau-vell')
            shot('fortin')
            choose('Pantalán marítimo')
            wait_atlas_frame('pantalan-maritimo','pantalan')
            page.locator('#sim-frame').click()
            wait_atlas_frame('pantalan-maritimo','pantalan',True)
            check('Encuadre de los trípodes del pantalán',page.locator('#sim-visit').get_attribute('href')=='#pantalan-maritimo/pantalan-maritimo-tripodes')
            page.locator('#sim-history').click()
            check('Cambio de época local',page.locator('#sim-era').is_visible())
            shot('pantalan')
            page.locator('#sim-home').click();page.locator('#sim-expand').click()
            page.locator('#sim-extent').click();check('Mapa municipal',page.locator('#sim-map-box').get_attribute('class').endswith('expanded'))
            page.locator('#sim-map').click(position={'x':65,'y':85})
            page.locator('.sim-atlas').click();wait("window.atlasStatus?.ready && location.hash==='#atlas'")
            check('Regreso al Atlas',True)
        check('Sin errores de carga o JavaScript',not errors)
    finally:
        (args.out/'resultados.json').write_text(json.dumps({'checks':results,'snapshots':snapshots,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
        browser.close()
