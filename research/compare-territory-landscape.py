"""Capture paired WebGL frames with identical local camera positions (Chrome / Playwright)."""
import argparse
import base64
import json
import math
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT=Path(__file__).resolve().parent/"validation-v37-landscape"
OUT.mkdir(exist_ok=True)
CASES={
    "panorama":None,
    "cultivos":{"mode":"orbit","eye":[5600,195,350],"target":[4960,24,40],"fov":42},
    "sierra":{"mode":"orbit","eye":[3530,205,-450],"target":[1730,145,-630],"fov":40}
}
HOOK="""() => {
 const Q=window.sceneQA={};const hook=window.__THREE_DEVTOOLS__=new EventTarget();
 hook.addEventListener('observe', e=>{
  const r=e.detail;if(!r.isWebGLRenderer)return;
  const draw=r.render.bind(r);let nesting=0;
  r.render=function(s,c){
   const main=!nesting&&c.isPerspectiveCamera&&r.domElement.isConnected&&s.children.length>6;
   if(main){Q.camera=c;Q.scene=s;Q.renderer=r;}
   nesting++;try{return draw(s,c)}finally{
    nesting--;
    if(!nesting && !r.getRenderTarget() && Q.snap){Q.snap(r.domElement.toDataURL('image/jpeg',.91));Q.snap=null;}
   }
  }
 });
}"""
def render(browser,base,label,case,state,mobile):
    viewport={"width":390,"height":844} if mobile else {"width":1056,"height":620}
    page=browser.new_page(viewport=viewport,device_scale_factor=2 if mobile else 1,
        is_mobile=mobile,has_touch=mobile,reduced_motion="reduce")
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("console",lambda m: errors.append(m.text[:2400]) if m.type=="error" else None)
    page.on("response",lambda r:errors.append(f"{r.status} {r.url}") if r.status>=400 else None)
    page.add_init_script("("+HOOK+")()")
    payload=json.dumps({"camera":state,"quality":"0" if mobile else "2"})
    page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(payload)+")")
    if case=="costa":
        payload=json.dumps({"camera":state,"quality":"0" if mobile else "2","hour":9,"lightPreference":"solar","terrain":"photo"})
        page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(payload)+")")
    page.goto(f"http://127.0.0.1:{base}/#simulador",wait_until="domcontentloaded")
    try:
        page.wait_for_function("window.territoryStatus?.frameMs && window.sceneQA.camera",timeout=180000)
        page.wait_for_function("!territoryStatus.pending && territoryStatus.canopy.ready",timeout=120000)
        page.wait_for_timeout(5500)
        if label=="despues" and case=="sierra":
            page.wait_for_function("!territoryStatus.heritage.loading && territoryStatus.heritage.loaded.length",timeout=65000)
        frame=page.evaluate("()=>new Promise(resolve=>sceneQA.snap=resolve)")
        suffix="-movil" if mobile else ""
        path=OUT/f"{case}-{label}{suffix}.jpg";path.write_bytes(base64.b64decode(frame.split(',')[1]))
        status=page.evaluate("""()=>{const s=territoryStatus,r=sceneQA.renderer,c=sceneQA.camera,gl=r.getContext();return {gpu:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL),
          lighting:s.lighting,eye:c.position.toArray(),terrain:s.terrain,triangles:s.triangles,textures:s.textures,calls:s.drawCalls,
          loadMs:s.loadMs,frameMs:s.frameMs,p95Ms:s.frameP95Ms,quality:s.quality,range:s.range,detailRange:s.detailRange,heritage:s.heritage.loaded,resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/landscape/')).map(e=>e.name.split('/').pop())}}""")
        status["errors"]=errors;print(case,label,status,flush=True)
        assert not errors,errors
        return status
    finally:
        page.close()
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("version",nargs="*",default=["antes","despues"])
    parser.add_argument("--mobile",action="store_true")
    parser.add_argument("--cases",nargs="+",default=list(CASES))
    args=parser.parse_args()
    CASES["costa"]={"mode":"fly","eye":[10335,13,2473],"target":[10262,8,2418],"yaw":math.atan2(73,55),"pitch":math.atan2(-5,math.hypot(73,55)),"fov":38}
    with sync_playwright() as p:
        browser=p.chromium.launch(channel="chrome")
        for label in args.version:
            suffix="-movil" if args.mobile else ""
            path=OUT/f"{label}{suffix}.json"
            results=json.loads(path.read_text(encoding="utf8")) if path.exists() else {}
            for case in args.cases:
                results[case]=render(browser,8470 if label=="antes" else 8471,label,case,CASES[case],args.mobile)
            path.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf8")
        browser.close()
