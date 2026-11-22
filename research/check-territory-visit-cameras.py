"""Verify camera registration and settled WebGL views through real simulator URLs."""
import argparse
import io
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
CAMERAS = ROOT / 'dist/assets/territory/visit-cameras.json'
CATALOG = ROOT / 'dist/assets/territory/visit-stops.json'
DEST = ROOT / 'research/validation-v38-cameras'
SIZES = {'wide': (1440, 900), 'portrait': (390, 844)}

# The numeric comparison uses PROJ's EPSG definitions independently of the
# equirectangular-to-UTM registration applied by the actual Three.js models.
projector = Transformer.from_crs('EPSG:4326','EPSG:25830',always_xy=True)
def exact_xz(vector):
    lon = vector[0] / (111320 * math.cos(math.radians(39.679))) - .278
    lat = 39.679 - vector[2] / 111320
    e, n = projector.transform(lon, lat)
    return e - 730000, 4395000 - n

POSES = """async size=>{
  const [{stopCamera},{loadHeritageCatalog},{project},{makeSampler,loadElevation}] = await Promise.all(
    ['territory-visit-frames','territory-heritage-catalog','territory-coordinates','territory-ground']
      .map(n=>import('./js/'+n+'.js')));
  const get=n=>fetch('./assets/territory/'+n+'.json').then(r=>r.json());
  const [world,catalog,frames,guides]=await Promise.all([get('world'),loadHeritageCatalog(project),get('visit-cameras'),get('visit-stops')]);
  const heightAt=makeSampler(await loadElevation(world.terrain)),result={};
  for(const place of catalog.places){
    result[place.id]={};
    for(const stop of guides[place.id].stops){
      const pose=stopCamera(stop,place,{heightAt,project,aspect:size[0]/size[1],frame:frames[place.id][stop.id]});
      result[place.id][stop.id]={target:pose.target.toArray(),eye:pose.eye.toArray(),fov:pose.fov,ground:heightAt(pose.target.x,pose.target.z)};
    }
  }
  return result;
}"""

def check_transforms(poses, cameras, size):
    errors = {}
    def record(key, value, pid, sid):
        assert math.isfinite(value), (pid,sid,key)
        if key not in errors or errors[key]['value'] < value:
            errors[key] = {'value': value, 'place': pid, 'stop': sid}
    for pid, stops in poses.items():
        for sid, pose in stops.items():
            native = cameras[pid][sid]
            for prop, original in [('eye',native[size]['eye']), ('target',native['target'])]:
                eye = pose[prop]
                record(prop+'HorizontalM', math.dist([eye[0],eye[2]],exact_xz(original)),pid,sid)
                record(prop+'GroundOffsetM',abs(eye[1]-pose['ground']-original[1]+native['ground']),pid,sid)
            record('apertureDegrees',abs(pose['fov']-native[size]['fov']),pid,sid)
    assert max(errors[key]['value'] for key in ['eyeGroundOffsetM','targetGroundOffsetM','apertureDegrees'])<1e-8, errors
    assert max(errors[key]['value'] for key in ['eyeHorizontalM','targetHorizontalM'])<5, errors
    return errors

def render_routes(page, poses, stops, refs, size, illustrated):
    errors = []
    pictures = []
    for pid, sid in refs:
        desired=poses[pid][sid]
        page.evaluate("link=>location.hash=link", '#simulador/'+pid+'/'+sid)
        page.wait_for_function("id=>territoryStatus.stop===id && document.getElementById('sim-stop').value===id",arg=sid)
        settled = """expected=>{
          const current=territoryStatus.camera;
          const diff=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
          return current?.visitPose && ['target','eye'].every(k=>diff(expected[k],current[k])<.025)
            && Math.abs(current.fov-expected.fov)<.001 && territoryStatus.drawCalls>0;
        }"""
        try:
            page.wait_for_function(settled,arg=desired,timeout=25000)
            # Adjacent stops can share a camera. The UI and the model still need
            # to reach the requested stop rather than an earlier camera twin.
            page.wait_for_function("id=>territoryStatus.heritage?.visit?.stop===id",arg=sid,timeout=10000)
        except Exception as exc:
            state = page.evaluate('''()=>({camera:territoryStatus.camera,visit:territoryStatus.heritage?.visit,
                drawCalls:territoryStatus.drawCalls,mode:territoryStatus.mode,error:territoryStatus.error})''')
            errors.append(dict(place=pid,stop=sid,state=state,expected=desired))
            print('Fallo de encuadre', size, pid, sid, state, str(exc).splitlines()[0], flush=True)
            continue
        if pid==illustrated and size=='wide':
            # Record the actual scene canvas without navigation panels over the
            # subject. Only CSS visibility changes for this screenshot.
            blob=page.locator('#sim-world canvas').screenshot(
                style='body>*:not(#sim-world){visibility:hidden!important} #sim-world, #sim-world canvas{visibility:visible!important}',
                type='jpeg',quality=80)
            thumb=Image.open(io.BytesIO(blob)).convert('RGB')
            thumb.thumbnail((320,200))
            title=next(s['title'] for s in stops[pid]['stops'] if s['id']==sid)
            pictures.append((title,thumb))
        print('WebGL',size,pid,sid,flush=True)
    return errors, pictures

def contact_sheet(pictures, dest):
    if not pictures:
        return
    columns = 3 if len(pictures)<=6 else 4
    out=Image.new('RGB',(320*columns,224*math.ceil(len(pictures)/columns)),'#192020')
    pen=ImageDraw.Draw(out)
    try:
        font=ImageFont.truetype('arial.ttf',13)
    except OSError:
        font=ImageFont.load_default()
    for i,(title,im) in enumerate(pictures):
        x,y=i%columns*320,i//columns*224
        out.paste(im,(x,y))
        pen.text((x+5,y+203),f'{i+1:02d}  {title}',font=font,fill='white')
    out.save(dest,quality=83,optimize=True)

def run(args):
    cams=json.loads(CAMERAS.read_bytes())
    stops=json.loads(CATALOG.read_bytes())
    assert cams.keys()==stops.keys()
    assert all(set(cams[p])=={s['id'] for s in guide['stops']} for p,guide in stops.items())
    illustrated = 'puerto-antiguo' if args.coast else 'glorieta'
    refs=[(illustrated,s['id']) for s in stops[illustrated]['stops']]
    if not args.coast:
        refs.extend([('plaza-mayor','plaza-soportales'),('begona','begona-coro'),
            ('dunas-almarda','casablanca'),('marjal-moros','ceacv'),('rio-palancia','a-pie'),
            ('puerto-antiguo','almacen'),('pantalan-maritimo','pantalan-maritimo-pasarela')])
    report={'places':len(cams),'stops':sum(map(len,cams.values())),'viewports':{}}
    args.out.mkdir(exist_ok=True,parents=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome')
        for size,(w,h) in SIZES.items():
            context=browser.new_context(viewport={'width':w,'height':h},reduced_motion='reduce')
            page=context.new_page()
            page.goto(args.base.rstrip('/')+'/#simulador/'+'/'.join(refs[0]),wait_until='domcontentloaded')
            page.wait_for_function('window.territoryStatus?.ready && territoryStatus.camera',timeout=160000)
            env=page.evaluate("""()=>{const gl=document.querySelector('#sim-world canvas').getContext('webgl2');
                const info=gl.getExtension('WEBGL_debug_renderer_info');
                return {version:gl.getParameter(gl.VERSION),renderer:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
            }""")
            poses=page.evaluate(POSES,[w,h])
            sample=refs
            errors,pictures=render_routes(page,poses,stops,sample,size,illustrated)
            report['viewports'][size]={'width':w,'height':h,'webgl':env,'registrationMaxima':check_transforms(poses,cams,size),
                  'urlVisits':[pid+'/'+sid for pid,sid in sample],'failed':errors}
            if pictures:contact_sheet(pictures,args.out/(illustrated+'-webgl.jpg'))
            dest=args.out/('coast-checks.json' if args.coast else 'checks.json')
            dest.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
            context.close()
        browser.close()
    assert not any(result['failed'] for result in report['viewports'].values())

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--base',required=True)
    parser.add_argument('--out',type=Path,default=DEST)
    parser.add_argument('--coast',action='store_true',help='Verificar las seis observaciones del puerto antiguo')
    run(parser.parse_args())
