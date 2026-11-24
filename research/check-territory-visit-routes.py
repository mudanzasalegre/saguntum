"""Exercise the actual Sites entry point, URL, picker, map and Atlas return path."""
import argparse
import json
import math
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'dist/assets/territory/visit-stops.json').read_bytes())
EXAMPLES = {
    'casino': 'casino-salon', 'theatre': 'teatro-orchestra', 'puerto-antiguo': 'marina',
    'rio-palancia': 'delta', 'diana': 'diana-aparejo', 'glorieta': 'glorieta-romeu',
    'necropolis': 'necro-camara', 'sanatorio': 'sanatorio-seccion',
}


def exercise(page, base, out, full,backend=None):
    errors = []
    def record_error(message):
        if message not in errors:
            errors.append(message)
            print(message[:3500],flush=True)
    page.on('pageerror', lambda error: record_error(str(error)))
    page.on('console', lambda message: record_error(message.text) if message.type == 'error' else None)
    page.on('response', lambda resp: errors.append(f'{resp.status} {resp.url}') if resp.status >= 400 else None)
    page.set_default_timeout(100000)
    if backend:
        page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(backend)+");")
    page.add_init_script("""{
      const draw=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(label,x,y,...more){
        if(typeof label==='number'){
          (window.visitMapLabels??={})[label]=[x/this.canvas.width,y/this.canvas.height];
        }
        return draw.call(this,label,x,y,...more);
      };
    }""")
    page.goto(base+'/?vista=plano#simulador', wait_until='domcontentloaded')
    page.wait_for_function("window.territoryStatus?.mode==='mapa 2D'")
    count = page.evaluate("""async ([guides,touch])=>{
      let n=0;
      for(const [place,guide] of Object.entries(guides)){
        location.hash='#simulador/'+place;
        await new Promise(resolve=>window.addEventListener('hashchange',resolve,{once:true}));
        const picker=document.getElementById('sim-stop');
        if(picker.options.length!==guide.stops.length+1)throw Error(place+' · catálogo');
        for(const stop of guide.stops){
          // WebKit limits history writes per document to 100 in 30 seconds.
          if(touch)await new Promise(resolve=>setTimeout(resolve,360));
          picker.value=stop.id;picker.dispatchEvent(new Event('change'));
          const dest='#'+place+'/'+stop.id;
          if(territoryStatus.stop!==stop.id||document.getElementById('sim-visit').hash!==dest||
             location.hash!=='#simulador/'+dest.slice(1))throw Error(dest);
          n++;
        }
      }
      return n;
    }""", [CATALOG, page.evaluate("matchMedia('(pointer:coarse)').matches")])
    assert count == sum(len(v['stops']) for v in CATALOG.values())
    result = dict(rutasPlano=count, lugares={}, errores=errors)
    # Start the GPU reading in a clean document. Each route then uses the same renderer.
    page.goto(base+'/#simulador', wait_until='domcontentloaded')
    page.wait_for_function("window.territoryStatus?.ready && !!territoryStatus.camera")
    for place, guide in CATALOG.items():
        if not full and place not in EXAMPLES:
            continue
        stop = EXAMPLES.get(place, guide['stops'][min(2,len(guide['stops'])-1)]['id'])
        page.evaluate("link=>location.hash=link", '#simulador/'+place+'/'+stop)
        page.wait_for_function("""([place,stop])=>{
          const lost=sessionStorage.getItem('saguntum-renderer-failure-v4');if(lost)throw Error(lost);
          const s=window.territoryStatus, v=s?.heritage?.visit;
          return v?.place===place&&v.stop===stop&&s.camera?.visitPose&&s.drawCalls>0&&s.stop===stop;
        }""", arg=[place,stop])
        result['lugares'][place] = page.evaluate("""async backend=>{
          await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
          const s=territoryStatus, v=s.heritage.visit;
          if(backend&&s.graphics.active!==backend)throw Error('Motor activo: '+s.graphics.active);
          if(Object.keys(s.heritage.failures).length)throw Error(JSON.stringify(s.heritage.failures));
          return {parada:v.stop,fase:v.mode,seccion:v.section,interior:v.interior,inspeccion:v.inspection,motor:s.graphics?.active};
        }""",backend)
        print(place, stop, flush=True)
    # Search a stop by name, move with the arrows, then use browser history.
    page.locator('#sim-search-open').click()
    page.locator('#sim-query').fill('casino-salon')
    page.locator('#sim-results button').click()
    page.wait_for_function("territoryStatus.heritage?.visit?.stop==='casino-salon'")
    page.locator('#sim-next').click()
    assert page.locator('#sim-stop').input_value() == 'casino-biblioteca'
    page.go_back(wait_until='commit')
    page.wait_for_function("territoryStatus.stop==='casino-salon'")
    page.locator('#sim-expand').click()
    assert page.locator('#sim-expand').get_attribute('aria-expanded') == 'true'
    page.wait_for_function("!!window.visitMapLabels?.[9]")
    u,v = page.evaluate("visitMapLabels[9]")
    canvas = page.locator('#sim-map')
    box = canvas.bounding_box()
    canvas.click(position={'x':u*box['width'],'y':v*box['height']})
    page.wait_for_function("territoryStatus.stop==='casino-biblioteca'")
    page.locator('#sim-prev').click()
    # Changing the heritage layer restores the active building and section.
    page.locator('#sim-settings-open').click()
    layer = page.locator('[data-flag="heritage"]')
    layer.uncheck()
    page.wait_for_function("!territoryStatus.heritage?.visit")
    layer.check()
    page.locator('#sim-settings [data-close]').click()
    page.wait_for_function("territoryStatus.heritage?.visit?.stop==='casino-salon' && !territoryStatus.pending")
    # Wait for the camera to settle before using a *visible* entry in each direction.
    page.wait_for_timeout(2000)
    if out.suffix!='.json':
        page.screenshot(path=out/'casino.jpg',type='jpeg',quality=85)
    page.locator('#sim-visit').click()
    page.wait_for_function("window.atlasStatus?.ready && location.hash==='#casino/casino-salon'")
    # The public status is throttled and can still report the penultimate
    # tween frame. Compare against the pose actually captured by the entry.
    eye=page.evaluate("JSON.parse(sessionStorage.getItem('saguntum-territorial-visit')).camera.eye")
    assert page.locator('.simulator-entry').get_attribute('href') == '#simulador/casino/casino-salon'
    page.locator('#sim-return').click()
    page.wait_for_function("window.territoryStatus?.heritage?.visit?.stop==='casino-salon'")
    drift = math.dist(eye, page.evaluate('territoryStatus.camera.eye'))
    assert drift < .5, drift
    result['regresoCamaraMetros'] = round(drift, 4)
    # Landscape observation points use their own native Atlas navigation.
    page.evaluate("location.hash='#simulador/rio-palancia/delta'")
    page.wait_for_function("territoryStatus.heritage?.visit?.stop==='delta'")
    page.locator('#sim-visit').click()
    page.wait_for_function("window.atlasStatus?.ready && document.querySelector('[data-landscape-focus=delta]')?.getAttribute('aria-pressed')==='true'")
    page.locator('[data-landscape-focus=puentes]').click()
    assert page.locator('.simulator-entry').get_attribute('href') == '#simulador/rio-palancia/puentes'
    page.locator('.simulator-entry').click()
    page.wait_for_function("window.territoryStatus?.heritage?.visit?.stop==='puentes'")
    result['buscadorHistorialCapasMapaPaisaje'] = True
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base',required=True)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--engine',choices=['chrome','webkit','webgl2','webgpu'],default='chrome')
    parser.add_argument('--quick',action='store_true')
    args = parser.parse_args()
    file=args.out if args.out.suffix=='.json' else args.out/'rutas.json'
    file.parent.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        mobile = args.engine == 'webkit'
        device = {k:v for k,v in pw.devices['iPhone 13'].items() if k!='default_browser_type'}
        browser = pw.webkit.launch() if mobile else pw.chromium.launch(channel='chrome')
        page = browser.new_page(**(device if mobile else {'viewport':{'width':1280,'height':800}}))
        result = exercise(page,args.base.rstrip('/'),args.out,not args.quick,
                          args.engine if args.engine in ('webgl2','webgpu') else None)
        result.update(motor=args.engine,version=browser.version,origen=args.base)
        file.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
        assert not result['errores'], result['errores']
        browser.close()
