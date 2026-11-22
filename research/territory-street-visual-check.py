"""Capture the real simulator at Plaça Cronista Chabret with Chromium/WebGL2."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument("--base",default="http://127.0.0.1:8433/")
parser.add_argument("--out",type=Path,required=True)
parser.add_argument("--software",action="store_true")
args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True)

views=[
    ("cronista",{"mode":"orbit","eye":[3372,60,-879],"target":[3390,48,-901],"yaw":0,"pitch":0}),
    ("arbolado",{"mode":"fly","eye":[3377.3,51,-890],"target":[3390,48,-901],"yaw":-1.12,"pitch":-.075}),
]
with sync_playwright() as playwright:
    flags=["--enable-unsafe-swiftshader","--use-angle=swiftshader"] if args.software else []
    browser=playwright.chromium.launch(channel="chrome",args=flags)
    report={}
    for name,camera in views:
        page=browser.new_page(viewport={"width":940,"height":620})
        failures=[]
        page.on("pageerror",lambda error:failures.append(str(error)))
        page.on("console",lambda msg:failures.append(msg.text) if msg.type=="error" or msg.type=="warning" and msg.text.startswith("Sector ") else None)
        page.on("response",lambda response:failures.append(str(response.status)+" "+response.url) if response.status>=400 else None)
        state=json.dumps({"camera":camera,"hour":16,"quality":"1"})
        page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(state)+")")
        page.goto(args.base+"#simulador",wait_until="domcontentloaded")
        page.wait_for_function("window.territoryStatus?.networkSectors>=4 && territoryStatus.traffic?.cars>0 && territoryStatus.traffic.people>0",timeout=150000)
        page.wait_for_function("['pavements.webp','pavements-detail.webp','tree-crown.webp','tree-views.webp','tree-shape.json'].every(n=>performance.getEntriesByType('resource').some(e=>e.name.endsWith(n)&&e.responseEnd>0))",timeout=100000)
        page.wait_for_timeout(1400)
        page.screenshot(path=str(args.out/(name+".jpg")),quality=90,timeout=90000)
        stats=page.evaluate("(({traffic,mode,camera,networkSectors,drawCalls,triangles,frameMs})=>({traffic,mode,camera,networkSectors,drawCalls,triangles,frameMs}))(territoryStatus)")
        report[name]={"status":stats,"errors":failures}
        print(name,json.dumps(report[name],ensure_ascii=True),flush=True)
        page.close()
    browser.close()
(args.out/"checks.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),"utf-8")
assert all(not r["errors"] for r in report.values())
