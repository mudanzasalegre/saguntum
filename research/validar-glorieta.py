"""Validación WebGL de la visita y del viaje de ida y vuelta desde el simulador."""
import argparse,json,statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--base',default='http://127.0.0.1:8461/')
parser.add_argument('--out',type=Path,default=Path('research/glorieta-validacion'))
parser.add_argument('--quick',action='store_true')
a=parser.parse_args();a.out.mkdir(exist_ok=True,parents=True)
base=a.base.rstrip('/')+'/'
stops=json.loads(Path('dist/assets/data/glorieta-visit.json').read_bytes())['stops']
report={'base':base,'vistas':{},'errores':[]};errors=report['errores']
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome')
 for mobile in ([False] if a.quick else [False,True]):
  context=browser.new_context(viewport=dict(width=390 if mobile else 1440,height=844 if mobile else 930),is_mobile=mobile,has_touch=mobile,reduced_motion='reduce')
  page=context.new_page();page.set_default_timeout(65000)
  page.on('pageerror',lambda e:(print(str(e),flush=True),errors.append(str(e))))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.goto(base+'#glorieta',wait_until='domcontentloaded');page.wait_for_function('window.atlasStatus?.ready && atlasStatus.loadedRegions.includes("sagunto")',timeout=150000)
  panel=page.locator('#glorieta-panel');assert panel.is_visible()
  assert 'SAGUNTUM · Sagunto y Puerto de Sagunto'==page.title()
  sampled=[]
  for s in (stops[4:5] if a.quick else stops):
   page.evaluate('id=>location.hash="#glorieta/"+id',s['id'])
   page.wait_for_function('title=>document.querySelector("#glorieta-panel .castle-stop-title")?.textContent===title',arg=s['title'])
   sampled.append(s['id'])
   if not mobile and not a.quick and s['id'].split('-')[-1] in ['conjunto','romeu','fuentes','jardines','biblioteca','ayuntamiento','entrada','lira','mercado','pergola','calles','reloj']:
    page.wait_for_timeout(1500);page.screenshot(path=str(a.out/(s['id']+'.jpg')),quality=80)
  report['vistas']['movil' if mobile else 'escritorio']=sampled
  if not a.quick:
   page.locator('#map-open').evaluate('e=>e.click()');pl=page.locator('#glorieta-plan');pl.wait_for()
   e=page.locator('select[aria-label="Configuración de la plaza"]')
   pre=pl.evaluate('c=>c.toDataURL()');e.select_option('old');assert pre!=pl.evaluate('c=>c.toDataURL()')
   page.locator('[data-visit-plan-stop=glorieta-fuentes]').click()
   page.wait_for_function('location.hash.endsWith("/glorieta-fuentes")')
   for id in ['water','night']:
    b=page.locator('#glorieta-'+id);v=b.get_attribute('aria-pressed');b.evaluate('b=>b.click()');assert b.get_attribute('aria-pressed')!=v
   if not mobile:
    page.wait_for_timeout(1300);page.screenshot(path=str(a.out/'noche.jpg'),quality=81)
    frames=page.evaluate("""async()=>{const a=[];let p=0;await new Promise(r=>{function f(t){if(p)a.push(t-p);p=t;if(a.length<100)requestAnimationFrame(f);else r()}requestAnimationFrame(f)});return a}""")
    report['msFotograma']={'mediana':round(statistics.median(frames),1),'p95':round(sorted(frames)[94],1)}
   panel.locator('[data-castle-tab="timeline"]').click();assert panel.locator('.castle-timeline-item').count()>=10
  context.close()
 page=browser.new_page()
 page.on('pageerror',lambda e:(print(str(e),flush=True),errors.append(str(e))))
 page.goto(base+'#simulador/glorieta/glorieta-romeu',wait_until='domcontentloaded')
 page.wait_for_function("window.territoryStatus?.heritage?.loaded.includes('glorieta') && territoryStatus.range<45",timeout=150000)
 assert page.locator('#sim-visit').get_attribute('href')=='#glorieta/glorieta-romeu'
 before=page.evaluate('territoryStatus.camera.eye')
 page.locator('#sim-visit').click();page.wait_for_function('window.atlasStatus?.ready && atlasStatus.selected==="glorieta"',timeout=150000)
 page.locator('#sim-return').click();page.wait_for_function("window.territoryStatus?.selected==='glorieta' && territoryStatus.heritage?.loaded.includes('glorieta')",timeout=150000)
 after=page.evaluate('territoryStatus.camera.eye')
 import math
 report['retornoMetros']=round(math.dist(before,after),3);assert report['retornoMetros']<1
 browser.close()
(a.out/'resultados.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
assert not errors,errors
print(report,flush=True)
