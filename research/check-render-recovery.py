"""Run the published entry points in WebKit or Chrome, including a lost WebGL context."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base', required=True)
parser.add_argument('--engine', choices=['webkit', 'chrome'], required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
base = args.base.rstrip('/') + '/'
errors = []
report = {}
stop = '#glorieta/glorieta-romeu'
plan = '?vista=plano'
marker = 'saguntum-render-start-v1'

with sync_playwright() as p:
    browser = p.webkit.launch() if args.engine == 'webkit' else p.chromium.launch(channel='chrome')
    device = {k: v for k, v in p.devices['iPhone 13'].items() if k != 'default_browser_type'}
    ctx = browser.new_context(**device)
    # Observe allocations by the application without creating a context in the plan.
    ctx.add_init_script("""{
      window.qaGL = [];
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type,...opts){
        const result = get.call(this,type,...opts);
        if(type.includes('webgl') && result && !qaGL.includes(result)) qaGL.push(result);
        return result;
      };
    }""")
    page = ctx.new_page()
    page.set_default_timeout(120000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
    page.on('response', lambda r: errors.append(f'{r.status} {r.url}') if r.url.startswith(base) and r.status>=400 else None)
    def go(url):
        page.goto(base + url, wait_until='domcontentloaded')
    def visit(mode):
        page.wait_for_function("m=>document.querySelector('#glorieta-panel .castle-stop-title')?.textContent"
                               " && document.body.classList.contains('map-mode')===(m==='2d')"
                               " && (m==='2d'||window.atlasStatus?.ready)", arg=mode)
        assert page.evaluate('qaGL.length') == (0 if mode == '2d' else 1)
        assert page.title() == 'SAGUNTUM · Sagunto y Puerto de Sagunto'
        assert page.evaluate('location.hash') == stop
    def lose_context():
        assert page.evaluate("!!qaGL[0].getExtension('WEBGL_lose_context')")
        page.evaluate("qaGL[0].getExtension('WEBGL_lose_context').loseContext()")
        page.wait_for_function("new URL(location.href).searchParams.get('vista')==='plano'")
    def sim(mode):
        page.wait_for_function("m=>window.territoryStatus?.ready && (m==='2d'?"
                               "territoryStatus.mode==='mapa 2D':!!territoryStatus.camera)", arg=mode)
        assert page.evaluate('qaGL.length') == (0 if mode == '2d' else 1)

    go(stop)
    visit('3d')
    report['navegador'] = args.engine + ' ' + browser.version
    report['pantalla'] = device['viewport']
    report['visita3D'] = page.locator('#glorieta-panel .castle-stop-title').text_content()
    lose_context()
    visit('2d')
    report['perdidaWebGLVisita'] = True
    page.get_by_role('button', name='Reintentar vista 3D').first.click()
    visit('3d')
    assert 'vista=plano' not in page.url
    report['reintentoMismaParada'] = True
    # Simulate a process terminating before its first stable frames, in the same tab.
    go('assets/data/glorieta-catalog.json')
    page.evaluate("k=>sessionStorage.setItem(k,JSON.stringify({route:location.pathname.split('assets/')[0]+'#glorieta',time:Date.now()}))", marker)
    go(stop)
    visit('2d')
    assert plan in page.url
    report['recuperacionArranqueInterrumpido'] = True

    go('#simulador')
    sim('3d')
    page.wait_for_function("territoryStatus.terrain==='photo' && territoryStatus.lighting==='solar'")
    page.evaluate("location.hash='#simulador/glorieta/glorieta-romeu'")
    page.wait_for_function("territoryStatus.heritage?.loaded.includes('glorieta') && territoryStatus.range<45")
    assert page.locator('#sim-visit').get_attribute('href') == stop
    assert page.evaluate("territoryStatus.terrain==='natural' && territoryStatus.lighting==='golden'")
    lose_context()
    sim('2d')
    assert page.locator('#sim-visit').get_attribute('href') == stop
    page.locator('#sim-visit').click()
    visit('2d')
    page.locator('#sim-return').click()
    sim('2d')
    assert page.locator('#sim-visit').get_attribute('href') == stop
    page.locator('#sim-retry').click()
    sim('3d')
    page.wait_for_function("territoryStatus.heritage?.loaded.includes('glorieta') && territoryStatus.range<45")
    report['simuladorMapaVisitaRegreso3D'] = True
    report['erroresJSShaderHTTP'] = errors
    ctx.close()
    browser.close()
args.out.parent.mkdir(parents=True, exist_ok=True)
args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert not errors, errors
print(json.dumps(report, ensure_ascii=False))
