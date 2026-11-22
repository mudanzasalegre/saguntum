import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
args=argparse.ArgumentParser();args.add_argument('--base',required=True);args.add_argument('--out',required=True);args.add_argument('--routes',action='store_true');args.add_argument('--webkit',action='store_true');args.add_argument('--tablet',action='store_true');args.add_argument('--capture',type=Path);args.add_argument('--transfer',action='store_true');args=args.parse_args()
with sync_playwright() as pw:
 b=pw.webkit.launch() if args.webkit else pw.chromium.launch(channel='chrome',args=['--enable-precise-memory-info'])
 page=b.new_page(viewport={'width':834 if args.tablet else 390,'height':1194 if args.tablet else 844},device_scale_factor=2 if args.tablet else 3,is_mobile=True,has_touch=True,reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:print(m.type,m.text[:420],flush=True) if m.type=='error' else None)
 # Observe the real renderer's counters without replacing any application logic.
 def instrument(route):
  r=route.fetch();route.fulfill(response=r,body=r.text()+"\nwindow.plazaMemory=()=>({residentGeometry:renderer.info.memory.geometries,textures:renderer.info.memory.textures,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:camera.position.toArray()});")
 page.route('**/js/app.js',instrument);page.goto(args.base.rstrip('/')+'/#glorieta',wait_until='domcontentloaded')
 page.wait_for_function("window.atlasStatus?.ready && atlasStatus.loadedRegions.includes('sagunto')",timeout=120000)
 page.wait_for_timeout(2500)
 state=page.evaluate("""()=>{const files=performance.getEntriesByType('resource'),assets=files.filter(f=>f.name.includes('/assets/'));return {...plazaMemory(),decodedAssetBytes:assets.reduce((s,a)=>s+a.decodedBodySize,0),assetRequests:assets.length,jsHeap:performance.memory?.usedJSHeapSize??null,dataRequests:assets.map(a=>a.name.split('/').pop()),catalog:atlasStatus.places}}""")
 if args.capture:
  args.capture.mkdir(exist_ok=True,parents=True);page.screenshot(path=str(args.capture/'panoramica.jpg'),quality=84)
 if args.routes:
  visits=json.loads(Path('dist/assets/data/glorieta-visit.json').read_bytes())['stops']
  for v in visits:
   page.evaluate("id=>location.hash='#glorieta/'+id",v['id']);page.wait_for_function("name=>document.querySelector('#glorieta-panel .castle-stop-title')?.textContent===name",arg=v['title'])
   if args.capture:
    page.wait_for_timeout(200);page.screenshot(path=str(args.capture/(v['id']+'.jpg')),quality=78)
  state['stops']=len(visits)
 if args.transfer:
  page.evaluate("location.hash='#horno/horno-acceso'");page.wait_for_function("window.atlasStatus?.selected==='horno' && atlasStatus.loadedRegions.includes('puerto')");assert page.url.endswith('/horno-acceso')
  page.evaluate("location.hash='#glorieta/glorieta-fuentes'");page.wait_for_function("window.atlasStatus?.selected==='glorieta' && atlasStatus.loadedRegions.includes('sagunto')");assert page.url.endswith('/glorieta-fuentes')
  state['cambioVisita']=True
 state['pageErrors']=errors;Path(args.out).write_text(json.dumps(state,indent=2),encoding='utf8');print({k:v for k,v in state.items() if k!='dataRequests'},flush=True);assert not errors;b.close()
