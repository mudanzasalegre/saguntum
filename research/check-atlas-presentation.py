"""Comprueba el recorrido público con la cámara de los soportales y la vuelta desde la visita."""
import argparse
import json
import math
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base', required=True)
parser.add_argument('--out', required=True, type=Path)
args = parser.parse_args()
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page(viewport={'width': 1360, 'height': 850})
    page.set_default_timeout(120000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(args.base.rstrip('/')+'/#simulador/plaza-mayor/plaza-soportales', wait_until='domcontentloaded')
    page.wait_for_function("""window.territoryStatus?.heritage?.loaded.includes('plaza-mayor')
      && territoryStatus.range<60 && territoryStatus.canopy?.ready && !territoryStatus.pending""")
    assert page.locator('#sim-visit').get_attribute('href') == '#plaza-mayor/plaza-soportales'
    status = page.evaluate('territoryStatus')
    assert status['lighting'] == 'golden' and status['terrain'] == 'natural'
    assert status['localTerrain'] == 6 and status['canopy']['source'] > 58000
    page.locator('#sim-settings-open').click()
    page.locator('#sim-light').select_option('day')
    page.locator('#sim-terrain').select_option('photo')
    page.wait_for_function("territoryStatus.lighting==='day' && territoryStatus.terrain==='photo'")
    page.locator('#sim-settings [data-close]').click()
    page.locator('#sim-visit').click()
    page.wait_for_function("window.atlasStatus?.ready && location.hash==='#plaza-mayor/plaza-soportales'")
    page.locator('#sim-return').click()
    page.wait_for_function("window.territoryStatus?.selected==='plaza-mayor' && territoryStatus.range<60")
    restored = page.evaluate('territoryStatus')
    assert restored['lighting'] == 'day' and restored['terrain'] == 'photo'
    assert math.dist(restored['camera']['eye'], status['camera']['eye']) < .5
    assert page.locator('#sim-visit').get_attribute('href') == '#plaza-mayor/plaza-soportales'
    page.locator('#sim-frame').click()
    page.wait_for_function("document.querySelector('#sim-visit').hash==='#plaza-mayor'")
    page.evaluate("location.hash='#simulador/gerencia/gerencia-oficinas'")
    page.wait_for_function("territoryStatus.heritage.loaded.includes('gerencia') && territoryStatus.selected==='gerencia'")
    assert page.locator('#sim-visit').get_attribute('href') == '#gerencia/gerencia-oficinas'
    assert not errors, errors
    report = dict(browser=browser.version,source=args.base,relieves=status['localTerrain'],copas=status['canopy']['source'],
                  retornoMetros=round(math.dist(restored['camera']['eye'], status['camera']['eye']),3),
                  perfiles=['golden','day'],terreno=['natural','photo'],enlaces=['plaza-soportales','gerencia-oficinas'],errores=errors)
    args.out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n', encoding='utf8')
    print(json.dumps(report,ensure_ascii=False), flush=True)
    browser.close()
