"""Browser regression. The extra visit is injected only into this browser context."""
import json
import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

dist = Path(__file__).resolve().parents[1] / 'dist'
coordinate = [-0.267, 39.676]
fixture = {
    'id': 'visita-de-prueba', 'name': 'Visita de registro', 'region': 'sagunto', 'coordinate': coordinate,
    'footprint': [[coordinate[0]+x, coordinate[1]+y] for x,y in [(-.0002,-.0002),(.0002,-.0002),(.0002,.0002),(-.0002,.0002)]],
    'buildingIds': ['cat-prueba'], 'scene': {'module':'./prueba-registro.js','scale':2,'yawDegrees':90},
    'guide': {'regions': [], 'stops': [{'id':'interior','title':'Interior de prueba','coordinate':coordinate,'requiresSection':True}]},
}
module = """
import * as T from 'three';
window.registryModuleLoaded=true;
export function createVisit({record,project,heightAt}){
 const wall=new T.Mesh(new T.BoxGeometry(2,3,1),new T.MeshStandardMaterial({color:0x84b2a1}));
 wall.name='Muro de prueba';wall.position.set(1,1.5,0);
 const anchor=project(...record.coordinate);
 if(Math.hypot(anchor.x,anchor.z)>1e-5||Math.abs(heightAt(0,0))>1e-5)throw Error('Origen no registrado');
 window.constructed=(window.constructed||0)+1;
 return {group:wall,setSection(open){window.section=open;},selectFocus(id){window.focusId=id;},dispose(){window.released=(window.released||0)+1;}};
}
"""

class QuietFiles(SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

server = ThreadingHTTPServer(('127.0.0.1',0),partial(QuietFiles,directory=str(dist)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base = os.environ.get('SAGUNTUM_TEST_BASE','http://127.0.0.1:'+str(server.server_port)).rstrip('/')
registry = json.loads((dist/'assets/data/atlas-visits.json').read_text(encoding='utf8'))
registry['visits'].extend(['ficha-prueba','ficha-incompleta','ficha-prueba'])
try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(channel='chrome')
        context=browser.new_context()
        context.route('**/assets/data/atlas-visits.json', lambda r:r.fulfill(json=registry))
        context.route('**/assets/data/ficha-prueba.json', lambda r:r.fulfill(json=fixture))
        context.route('**/assets/data/ficha-incompleta.json', lambda r:r.fulfill(json={'id':'ficha-incompleta'}))
        context.route('**/js/prueba-registro.js', lambda r:r.fulfill(content_type='text/javascript',body=module))
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('console',lambda message:print(message.text[:500],flush=True) if message.type=='error' else None)
        page.goto(base+'/?vista=plano#simulador/visita-de-prueba/interior',wait_until='domcontentloaded')
        page.wait_for_function("window.territoryStatus?.selected==='visita-de-prueba' && territoryStatus.stop==='interior'")
        assert page.evaluate("territoryStatus.places===33 && territoryStatus.registryIssues.length===2")
        assert page.locator('#sim-visit').get_attribute('href')=='#visita-de-prueba/interior'
        page.locator('#sim-visit').click()
        page.wait_for_function("location.hash==='#visita-de-prueba/interior' && window.atlasStatus?.selected==='visita-de-prueba'")
        assert page.locator('#landscape-focuses button[aria-pressed=true]').inner_text().endswith('Interior de prueba')
        page.locator('#sim-return').click()
        page.wait_for_function("window.territoryStatus?.selected==='visita-de-prueba' && territoryStatus.stop==='interior'")
        print('Atlas ↔ simulador · nueva ficha y parada en ambas rutas', flush=True)
        page.goto(base+'/#simulador/visita-de-prueba/interior',wait_until='domcontentloaded')
        page.wait_for_function("window.territoryStatus?.heritage?.visit?.stop==='interior' && territoryStatus.camera",timeout=180000)
        page.locator('#sim-visit').click()
        page.wait_for_function("window.atlasStatus?.ready && atlasStatus.selected==='visita-de-prueba' && window.focusId==='interior' && window.section",timeout=180000)
        saved=page.evaluate("JSON.parse(sessionStorage.getItem('saguntum-territorial-visit'))")
        assert page.evaluate("window.constructed") == 1
        page.locator('#sim-return').click()
        page.wait_for_function("window.territoryStatus?.heritage?.visit?.stop==='interior' && territoryStatus.camera",timeout=180000)
        restored=page.evaluate("territoryStatus")
        assert restored['camera']['mode']==saved['camera']['mode'] and restored['hour']==saved['hour']
        for key in ['eye','target']:
            assert max(abs(x-y) for x,y in zip(saved['camera'][key],restored['camera'][key]))<.1,(key,saved['camera'],restored['camera'])
        print('3D · constructor original, sección y encuadre restaurado a menos de 10 cm',flush=True)
        page.route('**/inspection.html',lambda r:r.fulfill(content_type='text/html',body='''<!doctype html><script type="importmap">{"imports":{"three":"/assets/vendor/three.module.js","three/addons/utils/BufferGeometryUtils.js":"/assets/vendor/BufferGeometryUtils.js"}}</script>'''))
        page.goto(base+'/inspection.html')
        results=page.evaluate("""async () => {
          const T=await import('three'),{project}=await import('/js/territory-coordinates.js');
          const {createHeritage}=await import('/js/territory-heritage.js');
          const {maskRing,overlapsRegisteredFootprint}=await import('/js/territory-heritage-models.js');
          const ring=(l,t,r,b)=>[[l,t],[r,t],[r,b],[l,b]];
          const geometry=coordinates=>maskRing(coordinates.map(([x,z])=>({x,z})));
          const parcel=geometry(ring(0,0,20,20));parcel.holes=[geometry(ring(4,4,16,16))];
          const cases=[[ring(5,5,15,15),false],[ring(20,2,22,5),false],[ring(-10,2,1,8),true],[ring(0,0,20,20),true]];
          if(cases.some(([p,result])=>overlapsRegisteredFootprint([p],parcel)!==result))throw Error('Intersección incorrecta');
          const errors=[],scene=new T.Scene(),grid={bounds:[-9000,-9000,18000,18000],width:2,height:2,unit:1,data:new Float32Array(4).fill(12)};
          const heritage=await createHeritage({scene,project,heightAt:()=>12,grids:{base:grid},mobile:true,onError:e=>errors.push(String(e))});
          const p=heritage.places.find(v=>v.id==='visita-de-prueba'),horno=heritage.places.find(v=>v.id==='horno');
          const pause=ms=>new Promise(r=>setTimeout(r,ms));
          async function wait(ok){for(let i=0;i<1000&&!ok();i++){await pause(100);if(errors.length)throw Error(errors.join());}if(!ok())throw Error(JSON.stringify(heritage.stats));}
          heritage.update(p.x+185,p.z,60);
          await wait(()=>window.registryModuleLoaded);
          if(window.constructed||heritage.isReplaced('prueba',p.x,p.z))throw Error('La precarga retiró el edificio antes de tiempo');
          heritage.update(p.x,p.z,2);
          await wait(()=>heritage.stats.levels?.[p.id]==='patrimonial');
          if(!heritage.isReplaced('prueba',0,0)||!heritage.isReplaced('otro',p.x,p.z))throw Error('La huella o el ID no sustituyen la edificación');
          const mesh=scene.getObjectByName('Muro de prueba'),world=mesh.getWorldPosition(new T.Vector3()),scale=mesh.getWorldScale(new T.Vector3());
          if(Math.abs(world.y-15)>.01||Math.abs(world.z-p.z+2)>.12||Math.abs(scale.y-2)>.001)throw Error('Escala, cota u orientación alteradas');
          const gl=new T.WebGLRenderer(),camera=new T.PerspectiveCamera(45,1,.1,200);
          camera.position.set(p.x+12,24,p.z+16);camera.lookAt(world);gl.render(scene,camera);
          if(!gl.info.render.triangles||gl.getContext().getError())throw Error('Dibujo de la escena');
          heritage.setVisitStop(p.id,'interior',p);
          if(!window.section||window.focusId!=='interior')throw Error('El constructor perdió sus controles');
          heritage.setVisitStop(null,null);
          // An explicitly selected destination now prioritises its original model.
          // Approach from outside the native radius without selecting the destination.
          heritage.update(horno.x-225,horno.z,180);
          await wait(()=>heritage.stats.levels.horno==='urbano');
          if(window.released!==1||heritage.isReplaced('prueba',0,0))throw Error('La descarga retuvo la huella');
          heritage.update(horno.x,horno.z,12);
          await wait(()=>heritage.stats.levels.horno==='patrimonial');
          const root=scene.getObjectByName('Atlas · '+horno.name),lights=[];
          root.traverseVisible(n=>{if(n.isPointLight)lights.push(n.intensity);});
          if(!lights.includes(8)||!lights.includes(10))throw Error('Faltan las lámparas originales del horno');
          heritage.update(horno.x+110,horno.z,20);
          if(heritage.stats.levels.horno!=='patrimonial')throw Error('Oscilación en el límite del nivel');
          heritage.update(-9000,-9000,1300);
          if(heritage.stats.loaded.length)throw Error('Persisten escenas alejadas');
          heritage.dispose();gl.dispose();
          return {destinos:heritage.places.length,nuevo:p.id,construcciones:window.constructed,liberaciones:window.released,lucesHorno:lights,casosHuella:cases.length};
        }""")
        assert not errors, errors
        print(json.dumps(results,ensure_ascii=False))
        browser.close()
finally:
    server.shutdown()
    server.server_close()
