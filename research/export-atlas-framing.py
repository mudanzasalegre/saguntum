"""Lee los encuadres de entrada del Atlas original con Chrome y Playwright."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--base',required=True)
parser.add_argument('--out',type=Path,default=root/'dist/assets/territory/atlas-frames.json')
args=parser.parse_args()
# This inspection hook is added to a browser response for this export only.
probe="""
window.readAtlasOpening=()=>{
  const d=preset(selected,false), h=activeRegion==='sagunto'?rawHeight:
    activeRegion==='puerto'?portHeight:activeRegion==='coast'?coastHeight:landscapes[activeRegion].height;
  return {eye:d.position.toArray(),target:d.target.toArray(),fov:d.fov||38,
    ground:h(d.target.x,d.target.z)};
};
window.atlasStopForExport=()=>guidedVisit(selected)?.stopId;"""
frames={}
# Exterior, current-state stops whose original composition can also be visited in the territory.
chosen={'castle':'acceso','theatre':'teatro-orchestra','plaza-mayor':'plaza-soportales',
        'horno':'horno-acceso','gerencia':'gerencia-oficinas','barrio-obrero':'barrio-hileras',
        'santa-maria':'santa-maria-cavallers','museo':'museo-fachada','sangre':'sangre-escalinata'}
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome')
    page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
    def instrument(route):
        source=route.fetch()
        route.fulfill(response=source,body=source.text()+probe)
    page.route('**/js/app.js*',instrument)
    page.goto(args.base+'/#atlas',wait_until='domcontentloaded')
    page.wait_for_function('window.atlasStatus?.ready && window.readAtlasOpening',timeout=150000)
    ids=page.evaluate("""async()=>{const {loadHeritageCatalog}=await import('./js/territory-heritage-catalog.js');
      const {project}=await import('./js/territory-coordinates.js');
      return (await loadHeritageCatalog(project)).places.map(p=>p.id)}""")
    for size,width,height in [('wide',1440,900),('portrait',390,844)]:
        page.set_viewport_size({'width':width,'height':height})
        for id in ids:
            prefix={'barrio-obrero':'barrio','grau-vell':'grau'}.get(id,id)
            source=root/'dist/assets/data'/(prefix+'-visit.json')
            stop=None
            if source.is_file():
                stops=json.loads(source.read_bytes())['stops']
                stop=next(s for s in stops if s['id']==chosen.get(id,stops[1]['id']))
            for exterior in ([False,True] if stop else [False]):
                route=id+'/'+stop['id'] if exterior else id
                page.evaluate('route=>location.hash=route',route)
                page.wait_for_function("id=>window.atlasStatus?.ready && atlasStatus.selected===id && atlasStatus.loadedRegions.includes(atlasStatus.activeRegion)",arg=id,timeout=120000)
                if exterior:page.wait_for_function("id=>window.atlasStopForExport()===id",arg=stop['id'],timeout=30000)
                page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                v=page.evaluate('readAtlasOpening()')
                for key in ('eye','target'): v[key]=[round(value,3) for value in v[key]]
                v['ground']=round(v['ground'],3)
                dest=frames.setdefault(id,{})
                if exterior:dest=dest.setdefault('exterior',{'stop':stop['id'],'label':stop.get('label') or stop['title']})
                dest[size]=v
                print(size,route,flush=True)
    browser.close()
args.out.write_text(json.dumps(frames,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
