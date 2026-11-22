"""Interacción táctil en los viewports de teléfono y tableta en Chromium."""
import argparse,json,math
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--base',default='http://127.0.0.1:8317/')
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome')
    for width,height in [(390,844),(820,1180)]:
        g=browser.new_page(viewport={'width':width,'height':height},has_touch=True,is_mobile=True)
        g.goto(args.base+'#simulador',wait_until='domcontentloaded')
        g.wait_for_function('window.territoryStatus?.frameMs')
        assert g.locator('.sim-marker.zone:visible').count()==3
        g.locator('[data-mode=fly]').tap()
        g.wait_for_function("territoryStatus.mode==='fly'")
        before=g.evaluate('territoryStatus.camera.eye')
        pad=g.locator('#sim-stick').bounding_box()
        x=pad['x']+.5*pad['width'];y=pad['y']+.15*pad['height']
        c=g.context.new_cdp_session(g)
        c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        g.wait_for_timeout(1050)
        c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        g.wait_for_timeout(1050)
        after=g.evaluate('territoryStatus.camera.eye')
        assert math.dist(before,after)>2
        results.append({'viewport':[width,height],'anchorsVisible':3,'touchFlightMetres':round(math.dist(before,after),1)})
        g.close()
    browser.close()
args.out.write_text(json.dumps(results,indent=2),encoding='utf8')
print(results)
