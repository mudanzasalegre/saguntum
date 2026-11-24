"""Verify the deployed HTML, shared resources and the two live simulator renderers."""
import argparse
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', required=True)
parser.add_argument('--out', required=True, type=Path)
args = parser.parse_args()
base = args.base.rstrip('/')+'/'
root = Path(__file__).resolve().parents[1]/'dist'
files = ['js/render-session.js','simulator.html','js/territory.js','js/territory-graphics.js',
         'js/territory-node-fog.js','js/territory-node-ground.js','js/territory-node-environment.js',
         'js/territory-node-urban.js','js/territory-webgpu-device.js','js/territory-heritage-worker.js',
         'assets/vendor/three.webgpu.js','assets/territory/visit-stops.json']
files.extend(['assets/vendor/three.module.js','js/territory-atmosphere.js','js/territory-stream-policy.js',
              'js/territory-stream.js','js/territory-building-worker.js','js/territory-heritage-models.js',
              'js/territory-heritage-contexts.js','js/territory-heritage.js','js/territory-street-surfaces.js',
              'js/territory-building-material.js','js/territory-node-urban-architecture.js','js/territory-node-urban-street.js'])
result = {'url': base, 'assets': {}, 'visits': []}
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome')
    context = browser.new_context(viewport={'width':1024,'height':720})
    result['browser'] = browser.version
    page = context.new_page()
    errors = []
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('console',lambda m: errors.append(m.text[:400]) if m.type=='error' else None)
    page.goto(base+'#atlas',wait_until='domcontentloaded')
    page.wait_for_function("window.atlasStatus?.ready && document.querySelector('#loading')?.classList.contains('loaded')",timeout=120000)
    result['title'] = page.title()
    assert 'SAGUNTUM' in result['title'] and 'Puerto de Sagunto' in result['title'], result['title']
    # The public gateway appends its own script to HTML. Check the application
    # import map directly, and compare the separate static resources bytewise.
    imports=page.locator('script[type=importmap]').evaluate("e=>JSON.parse(e.textContent).imports")
    assert imports['three/webgpu'].endswith('/three.webgpu.js') and imports['three/tsl'].endswith('/three.tsl.js')
    for name in files:
        actual=page.evaluate("""async name=>{
          const response=await fetch(name,{cache:'reload'});
          if(!response.ok)throw Error(name+' '+response.status);
          const source=(await response.text()).replaceAll('\\r\\n','\\n');
          const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));
          return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
        }""",name)
        expected=hashlib.sha256((root/name).read_bytes().replace(b'\r\n',b'\n')).hexdigest()
        assert actual==expected,(name,actual,expected)
        result['assets'][name]=actual
    for engine,route in [('webgl2','glorieta/glorieta-romeu'),('webgpu','pantalan-maritimo/pantalan-maritimo-tripodes')]:
        page.evaluate("engine=>localStorage.setItem('saguntum-renderer-v4',engine)",engine)
        # Force a new document even when only the hash changes.
        page.goto('about:blank')
        page.goto(base+'#simulador/'+route,wait_until='domcontentloaded')
        page.wait_for_function("s=>window.territoryStatus?.heritage?.visit?.stop===s && territoryStatus.camera",arg=route.split('/')[1],timeout=150000)
        page.wait_for_timeout(1400)
        view=page.evaluate("""()=>{const s=territoryStatus;
          return {place:s.selected,stop:s.stop,engine:s.graphics.active,calls:s.drawCalls,
          triangles:s.triangles,places:s.places,hardware:s.graphics.adapter||null};}""")
        assert view['engine']==engine and view['places']==32 and view['triangles']>0,view
        result['visits'].append(view)
    result['errors']=errors
    assert not errors,errors
    browser.close()
args.out.parent.mkdir(parents=True,exist_ok=True)
args.out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
print(json.dumps(result['visits'],ensure_ascii=False))
