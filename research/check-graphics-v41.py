"""Exercise the production WebGL canvas. Compare the same cameras with the v40 server."""
import argparse
import importlib.util
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("atlas_compare", HERE / "compare-atlas-territory.py")
parity = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parity)
parser = argparse.ArgumentParser()
parser.add_argument("--base", required=True)
parser.add_argument("--out", type=Path, required=True)
parser.add_argument("--version", choices=["v40", "v41"], required=True)
parser.add_argument("--only", nargs="+", choices=["calle", "costa", "horno", "perfiles", "vuelo", "copas"])
args = parser.parse_args()
base = args.base.rstrip("/") + "/"
args.out.mkdir(parents=True, exist_ok=True)
cases = args.only or ["calle", "costa", "horno"] + (["perfiles","vuelo","copas"] if args.version == "v41" else [])


def capture(browser, name):
    # Camera and solar hour have been used in this same UTM grid since revision 34.
    source = "carrer-major" if name == "calle" else "costa"
    previous = json.loads((HERE / "validation-visual/v34" / (source + ".json")).read_bytes())
    state = dict(camera={**previous["camera"], "fov":38}, quality="2", hour=previous["hour"],
                 lightPreference="solar" if name == "calle" else "day", solarDate="2026-03-20",
                 flags=dict(labels=False, cars=False, people=False))
    page, errors = parity.page_with_errors(browser, state)
    page.goto(base+"#simulador", wait_until="domcontentloaded")
    page.wait_for_function("window.territoryStatus?.frameMs && parityQA.camera",timeout=120000)
    page.wait_for_function("territoryStatus.aerial.complete && !territoryStatus.pending && !territoryStatus.heritage.loading", timeout=120000)
    if name == "calle":
        page.wait_for_function("territoryStatus.fabric.openings>0 && territoryStatus.photo.cells.length>0", timeout=120000)
    else:
        page.wait_for_function("territoryStatus.heritage.loaded.includes('pantalan')", timeout=120000)
    metrics = page.evaluate("""async () => {
        const frameTimes=[], gl=parityQA.renderer.getContext();
        let previous;
        await new Promise(done=>requestAnimationFrame(function frame(now) {
            if(previous!==undefined)frameTimes.push(now-previous);
            previous=now;
            if(frameTimes.length<120)requestAnimationFrame(frame);else done();
        }));
        frameTimes.sort((a,b)=>a-b);
        const s=territoryStatus, sea=parityQA.scene.getObjectByName('Mediterráneo · superficie costera');
        const surface=sea.material.uniforms, sky=parityQA.scene.children.find(o=>o.isDirectionalLight&&o.castShadow);
        return {browser:navigator.userAgent,gpu:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL),
          p50Ms:+frameTimes[59].toFixed(2),p95Ms:+frameTimes[113].toFixed(2),frames:frameTimes.length,
          ...Object.fromEntries(['camera','range','frameMs','drawCalls','triangles','textures','geometries','heapMiB','loadMs','quality','pixelRatio','sectors','networkSectors','fabric','canopy','lighting','hour','graphics','solarDate'].map(k=>[k,s[k]])),
          water:{shader:sea.material.isShaderMaterial,geometry:sea.geometry.attributes.position.count,
            reflection:surface.mirrorSampler.value.image.width,normal:surface.normalSampler.value.image.width,
            shore:surface.shoreSampler.value.image.width,sunStrength:surface.sunStrength.value},
          shadow:{on:parityQA.renderer.shadowMap.enabled,size:sky.shadow.mapSize.x},glError:gl.getError()};
    }""")
    assert metrics["glError"] == 0 and not errors, errors
    assert metrics["water"]["shader"] and metrics["water"]["reflection"] >= 384
    parity.screenshot(page, args.out/(name+".jpg"))
    parity.save(args.out/(name+".json"), {**metrics, "errors": errors})
    print(name, metrics["gpu"], metrics["p50Ms"], metrics["p95Ms"], flush=True)
    page.close()


def profiles(browser):
    source=json.loads((HERE/"validation-visual/v34/costa.json").read_bytes())["camera"]
    page=browser.new_page(viewport={"width":1000,"height":660}, device_scale_factor=1)
    page.add_init_script(parity.HOOK)
    state=dict(camera={**source,"fov":38}, quality="2", hour=12, lightPreference="solar")
    page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+");")
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("console",lambda m:errors.append(m.text) if m.type=="error" else None)
    page.goto(base+"#simulador",wait_until="domcontentloaded")
    page.wait_for_function("window.territoryStatus?.graphics?.shadowSize && parityQA.camera",timeout=90000)
    page.locator("#sim-settings-open").click()
    page.locator("#sim-date").fill("2026-06-21")
    page.locator("#sim-sun-preset").select_option("noon")
    sun="""()=>{const s=parityQA.scene.getObjectByName('Mediterráneo · superficie costera');
      const u=s.material.uniforms,lamps=parityQA.scene.children.filter(o=>o.isDirectionalLight&&o.castShadow);
      return {waveTime:u.time.value,reflection:u.mirrorSampler.value.image.width,normal:u.normalSampler.value.image.width,
        shore:u.shoreSampler.value.image.width,direction:u.sunDirection.value.toArray(),strength:u.sunStrength.value,
        shadow:lamps[0].shadow.mapSize.x,enabled:parityQA.renderer.shadowMap.enabled};}"""
    measurements={}
    for profile in ["0","1","2","3"]:
        if profile=="3" and page.locator("#sim-quality option[value='3']").is_disabled():continue
        page.locator("#sim-quality").select_option(profile)
        page.wait_for_function("n=>territoryStatus.quality===n",arg=int(profile))
        m=page.evaluate(sun)
        assert m["enabled"] and m["shadow"]==[512,1536,2048,4096][int(profile)],m
        measurements[profile]=m
    assert measurements["0"]["waveTime"]<measurements["2"]["waveTime"]
    page.locator("#sim-date").fill("2026-12-21")
    page.wait_for_function("territoryStatus.solarDate==='2026-12-21'")
    winter=page.evaluate(sun)
    assert measurements["2"]["direction"][1]-winter["direction"][1]>.4
    for preset in ["sunrise","sunset","night"]:
        page.locator("#sim-sun-preset").select_option(preset)
        page.wait_for_timeout(300)
        measurements[preset]=dict(**page.evaluate(sun),hour=page.evaluate("territoryStatus.hour"))
    assert measurements["sunrise"]["direction"][0]>.65 and measurements["sunset"]["direction"][0]<-.65
    assert not measurements["night"]["enabled"] and measurements["night"]["strength"]==0
    assert not errors,errors
    parity.save(args.out/"perfiles.json",dict(graphics=page.evaluate("territoryStatus.graphics"),profiles=measurements,winter=winter,errors=errors))
    print("perfiles",list(measurements),flush=True)
    page.close()


def flight(browser):
    camera=dict(mode="fly",eye=[4800,460,0],target=[5200,440,160],yaw=-1.95,pitch=-.02,fov=65)
    config=dict(camera=camera,quality="auto",lightPreference="solar",hour=12,solarDate="2026-06-21")
    page,errors=parity.page_with_errors(browser,config)
    page.goto(base+"#simulador",wait_until="domcontentloaded")
    page.wait_for_function("window.territoryStatus?.aerial?.complete&&parityQA.camera",timeout=90000)
    page.locator("#sim-world canvas").focus()
    page.keyboard.down("ShiftLeft")
    page.keyboard.down("KeyW")
    try:
        result=page.evaluate("""async () => {
          const times=[], eye=parityQA.camera.position.clone(), peak={}, profiles=new Set(), sampled=new Set();
          let prev,seconds=0;
          await new Promise(done=>requestAnimationFrame(function frame(now){
            if(prev!==undefined){const dt=now-prev;times.push(dt);seconds+=dt/1000;}
            prev=now;
            const s=territoryStatus, profile=s.graphics;
            profiles.add(profile.profile);sampled.add(s.sectors+'/'+s.networkSectors);
            for(const k of ['heapMiB','pending','textures','triangles','drawCalls'])peak[k]=Math.max(peak[k]||0,s[k]||0);
            if(seconds<8)requestAnimationFrame(frame);else done();
          }));
          times.sort((a,b)=>a-b);
          const end=parityQA.camera.position;
          return {frames:times.length,seconds,travelMetres:eye.distanceTo(end),sectors:[...sampled],profiles:[...profiles],
            p50Ms:times[Math.floor(.5*times.length)],p95Ms:times[Math.floor(.95*times.length)],peak,
            renderer:territoryStatus.graphics.backend};
        }""")
    finally:
        page.keyboard.up("KeyW")
        page.keyboard.up("ShiftLeft")
    assert result["travelMetres"]>150 and not errors,(result,errors)
    parity.save(args.out/"vuelo.json",dict(**result,errors=errors))
    print("vuelo",round(result["travelMetres"]),round(result["p95Ms"],1),flush=True)
    page.close()


def crown_shader(browser):
    # Isolate the close tree LOD and its directional depth pass from streaming.
    page=browser.new_page()
    page.route("**/comprobar-copas",lambda route:route.fulfill(content_type="text/html",body=
        '<script type="importmap">{"imports":{"three":"./assets/vendor/three.module.js"}}</script>'))
    errors=[]
    page.on("console",lambda m: errors.append(m.text) if m.type=="error" else None)
    page.goto(base+"comprobar-copas")
    result=page.evaluate("""async () => {
      const T=await import('three'),{streetTrees}=await import('./js/territory-street-trees.js');
      const tree=await streetTrees();await new Promise((resolve,reject)=>{
        const start=performance.now();function ready(){
          if(tree.material.crown.map.image?.naturalWidth)resolve();
          else if(performance.now()-start>8000)reject(Error('Textura de copa'));else setTimeout(ready,20);
        }ready();
      });
      const r=new T.WebGLRenderer({preserveDrawingBuffer:true});r.setSize(360,260);r.shadowMap.enabled=true;
      const gl=r.getContext(),scene=new T.Scene(),cam=new T.PerspectiveCamera(36,360/260,.1,40);
      cam.position.set(4,3.6,5.4);cam.lookAt(0,2.2,0);scene.background=new T.Color('#a5bfd1');
      const sun=new T.DirectionalLight(0xffedd3,2);sun.position.set(1,4,1);sun.castShadow=true;scene.add(sun,new T.HemisphereLight());
      const mat=new T.Matrix4();
      for(const k of ['trunk','crown']){
        const m=new T.InstancedMesh(tree.geometry[k],tree.material[k],1);m.setMatrixAt(0,mat);
        m.castShadow=true;m.receiveShadow=true;if(k==='crown')m.customDepthMaterial=tree.crownDepth;scene.add(m);
      }
      const draw=(t,strength)=>{
        tree.wind.value.set(t,strength);r.render(scene,cam);
        const pix=new Uint8Array(360*260*4);gl.readPixels(0,0,360,260,gl.RGBA,gl.UNSIGNED_BYTE,pix);return pix;
      };
      const diff=(a,b)=>a.reduce((n,c,i)=>n+(i%4===0&&Math.abs(c-b[i])>2),0);
      const stillA=draw(0,0),stillB=draw(3,0),movingA=draw(1,1),movingB=draw(4,1);
      const report={stillChanged:diff(stillA,stillB),movingChanged:diff(movingA,movingB),
        glError:gl.getError(),calls:r.info.render.calls,triangles:r.info.render.triangles};
      r.dispose();return report;
    }""")
    assert result["stillChanged"]==0 and result["movingChanged"]>20 and not result["glError"] and not errors,(result,errors)
    parity.save(args.out/"copas.json",dict(**result,errors=errors))
    print("copas",result["movingChanged"],flush=True)
    page.close()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome",args=["--enable-unsafe-swiftshader","--use-angle=swiftshader"] if cases==["copas"] else [])
    for case in cases:
        if case=="perfiles":
            profiles(browser)
            continue
        if case=="vuelo":
            flight(browser)
            continue
        if case=="copas":
            crown_shader(browser)
            continue
        if case != "horno":
            capture(browser, case)
            continue
        atlas = args.out / "atlas"
        atlas.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="saguntum-graphics-") as cache:
            cache = Path(cache)
            place = ("horno", "horno-acceso", "Alto Horno")
            reference = parity.reference(browser, base, *place, atlas, cache)
            same = parity.simulator(browser, base, args.version, *place, args.out, cache)
            controls = same["registration"]
            assert controls["visibleControlPoints"] >= 12 and controls["medianReprojectionPx"] < 2, controls
            parity.save(args.out/"horno.json", dict(atlas=reference, simulator=same))
            print("horno", controls["visibleControlPoints"], controls["medianReprojectionPx"], flush=True)
    browser.close()
