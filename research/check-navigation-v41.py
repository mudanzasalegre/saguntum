"""Public simulator controls, camera return, touch and deterministic locomotion checks."""
import argparse
import json
import math
from pathlib import Path
from playwright.sync_api import sync_playwright


def run(base, out, mobile, tablet=False):
    result = {}
    errors = []
    with sync_playwright() as pw:
        browser = pw.webkit.launch() if mobile and not tablet else pw.chromium.launch(channel='chrome')
        device = {k:v for k,v in pw.devices['iPad (gen 7)' if tablet else 'iPhone 13'].items() if k!='default_browser_type'}
        page = browser.new_page(**(device if mobile else {'viewport':{'width':1360,'height':820}}))
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_default_timeout(120000)
        page.goto(base.rstrip('/')+'/#simulador', wait_until='domcontentloaded')
        page.wait_for_function("window.territoryStatus?.ready && !!territoryStatus.camera")
        result['motor']=page.evaluate('territoryStatus.graphics?.backend||"WebGL 2"')
        # Isolate the movement integrator from streaming to measure it at known slopes and walls.
        result['fisica']=page.evaluate("""async()=>{
          const T=await import('three'),{locomotion}=await import('./js/territory-locomotion.js');
          const camera=new T.PerspectiveCamera(),keys=new Set(),pad={x:0,z:0};
          const floor=(x,z)=>Math.max(0,(x-.5)*1.5)+(z< -3? .16:0);
          const body=locomotion({camera,heightAt:floor,walkingHeight:floor,safe:(x,z,r)=>z>=-10+r,
            nearest:(x,z)=>[x,z],bounds:[-100,-100,100,100],spawn:{x:0,z:0}});
          const input={held:k=>keys.has(k),prefs:{pace:1,bob:false,clearance:1.7},flightSpeed:()=>12};
          const step=()=>body.tick(1/60,'walk',input,pad,0),frames=n=>{for(let i=0;i<n;i++)step()};
          body.requestLanding(0,0);step();keys.add('forward');frames(60);const walk=body.speed;
          keys.add('run');frames(60);const run=body.speed,stair=body.snapshot().feet;
          keys.clear();frames(60);const ground=body.snapshot().feet;
          body.jump();let top=ground;for(let i=0;i<60;i++){step();if(i===17)body.jump();top=Math.max(top,body.snapshot().feet);}
          keys.add('forward');frames(540);const wall=camera.position.z;
          keys.clear();keys.add('down');frames(60);
          const crouched=camera.position.y-body.snapshot().feet;
          keys.clear();keys.add('right');frames(240);
          return {paseoMS:walk,carreraMS:run,escalon:stair,alturaSalto:top-ground,
            paredZ:wall,alturaAgachado:crouched,pendienteMaxX:camera.position.x,apoyado:body.snapshot().grounded};
        }""")
        physics=result['fisica']
        assert 1.3<physics['paseoMS']<1.4 and 2.9<physics['carreraMS']<3.1,physics
        assert .5<physics['alturaSalto']<.8 and 0.15<physics['escalon']<.17 and physics['apoyado'],physics
        assert -9.69<physics['paredZ']<-9.55 and physics['alturaAgachado']<1.12,physics
        assert .45<physics['pendienteMaxX']<.95,physics
        page.locator('[data-mode=walk]').click()
        page.wait_for_function("territoryStatus.navigation.mode==='walk' && !territoryStatus.navigation.landing")
        snap=lambda:page.evaluate("territoryStatus.navigation")
        origin=snap()
        assert origin['walk']['grounded']
        if mobile:
            pad=page.locator('#sim-stick').bounding_box()
            assert page.locator('#sim-walk-actions').is_visible() and pad['width']>=44
            assert page.evaluate("['#sim-world canvas','#sim-stick'].every(s=>getComputedStyle(document.querySelector(s)).touchAction==='none')")
            if tablet:
                session=page.context.new_cdp_session(page)
                stick=dict(id=1,x=pad['x']+pad['width']/2,y=pad['y']+pad['height']*.20)
                look=dict(id=2,x=530,y=340)
                assert page.evaluate("document.elementFromPoint(530,340).matches('#sim-world canvas')")
                page.locator('[data-motion=run]').tap()
                session.send('Input.dispatchTouchEvent',dict(type='touchStart',touchPoints=[stick,look]))
                look['x']+=41
                session.send('Input.dispatchTouchEvent',dict(type='touchMove',touchPoints=[stick,look]))
                page.wait_for_function("p=>Math.abs(territoryStatus.navigation.yaw-p.yaw)>.02 && Math.hypot(territoryStatus.navigation.eye[0]-p.eye[0],territoryStatus.navigation.eye[2]-p.eye[2])>.2",arg=origin,timeout=12000)
                session.send('Input.dispatchTouchEvent',dict(type='touchEnd',touchPoints=[]))
                page.locator('[data-motion=run]').tap()
                result['movimientoYMiradaTactiles']=True
            page.locator('[data-motion=up]').tap()
        else:
            page.locator('#sim-world canvas').click(position={'x':700,'y':330})
            page.wait_for_function("!!document.pointerLockElement")
            page.mouse.move(760,360)
            page.wait_for_function("y=>Math.abs(territoryStatus.navigation.yaw-y)>.01",arg=origin['yaw'])
            page.keyboard.press('Space')
        page.wait_for_function("!territoryStatus.navigation.walk.grounded",timeout=2500)
        page.wait_for_function("territoryStatus.navigation.walk.grounded")
        if not mobile:
            page.keyboard.down('w')
            page.wait_for_timeout(500)
            page.keyboard.up('w')
            page.wait_for_timeout(500)
            page.keyboard.press('m')
            assert page.locator('#sim-map-box').evaluate("e=>e.classList.contains('expanded')")
            page.keyboard.press('m')
        page.wait_for_function("territoryStatus.nearby && !document.querySelector('#sim-nearby').hidden")
        place=page.evaluate('territoryStatus.nearby')
        pose=snap()
        if mobile:page.locator('#sim-nearby').tap()
        else:page.keyboard.press('e')
        page.wait_for_function("window.atlasStatus?.ready && document.querySelector('#loading').classList.contains('loaded')")
        assert page.url.split('#')[-1]==place,page.url
        page.locator('#sim-return').click()
        page.wait_for_function("window.territoryStatus?.navigation?.mode==='walk' && territoryStatus.ready")
        returned=snap()
        result['idaYVuelta']={'lugar':place,'desviacionM':math.dist(pose['eye'],returned['eye']),'rumboRad':abs(pose['yaw']-returned['yaw'])}
        assert result['idaYVuelta']['desviacionM']<.5 and result['idaYVuelta']['rumboRad']<.01,result
        page.locator('[data-mode=fly]').click()
        if mobile:
            assert page.locator('#sim-altitude').is_visible()
        else:
            p=snap()
            page.keyboard.down('Space')
            page.wait_for_timeout(850)
            page.keyboard.up('Space')
            assert snap()['eye'][1]>p['eye'][1]+1
            page.locator('#sim-settings-open').click()
            page.locator('#sim-navigation summary').first.click()
            page.locator('#sim-flight').select_option('territory')
            page.locator('#sim-navigation details summary').click()
            page.get_by_role('button',name='Cambiar tecla para Avanzar',exact=True).click()
            page.keyboard.press('i')
            page.locator('#sim-sun-preset').select_option('night')
            page.locator('#sim-settings [data-close]').click()
            page.locator('#sim-world canvas').focus()
            start=snap()['eye']
            page.keyboard.down('i')
            page.wait_for_function("p=>Math.hypot(...territoryStatus.navigation.eye.map((v,i)=>v-p[i]))>12",arg=start)
            page.keyboard.up('i')
            result['vueloReasignado']=True
            locations=[]
            for zone in ['Puerto de Sagunto','Grau Vell']:
                page.locator('#sim-search-open').click()
                page.locator('#sim-results').get_by_role('button',name=zone,exact=True).first.click()
                page.wait_for_function("territoryStatus.navigation.mode==='fly'")
                locations.append({'zona':zone,'posicion':snap()['eye']})
            assert math.dist(locations[0]['posicion'],locations[1]['posicion'])>2000
            result['vueloEntreZonas']=locations
        page.locator('#sim-home').click()
        page.wait_for_function("territoryStatus.mode==='orbit' && territoryStatus.range>3000")
        result.update(errores=errors,version=browser.version,origen=base,perfil='tableta táctil Chromium' if tablet else 'móvil WebKit' if mobile else 'escritorio Chrome')
        assert not errors,errors
        out.parent.mkdir(parents=True,exist_ok=True)
        out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        print(json.dumps(result,ensure_ascii=True),flush=True)
        browser.close()


if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--base',required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--mobile',action='store_true')
    p.add_argument('--tablet',action='store_true')
    args=p.parse_args();run(args.base,args.out,args.mobile or args.tablet,args.tablet)
