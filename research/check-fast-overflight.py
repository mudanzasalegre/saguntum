"""Repeat the WebGPU corridor flight with and without speculative monuments at high speed."""
import argparse
import json
from pathlib import Path
import runpy
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
benchmark=runpy.run_path(str(root/'research/check-navigation-benchmark-v4.py'))

class FlightBrowser:
    def __init__(self,browser,module):
        self.browser=browser
        self.module=module

    def new_page(self,**options):
        page=self.browser.new_page(**options)
        page.route('**/js/territory.js',lambda route:route.fulfill(body=self.module,content_type='text/javascript'))
        return page

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
source=(root/'dist/js/territory.js').read_text(encoding='utf8')
reference=source.replace('overflying?null:lead','lead')
assert source!=reference
result=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome')
    for limit in [False, True, True, False]:
        mode=FlightBrowser(browser,source if limit else reference)
        flight=benchmark['territorial_flight'](mode,args.base,'webgpu')
        assert not flight['errors']
        result.append(dict(limit=limit,**flight))
    browser.close()
args.out.parent.mkdir(parents=True,exist_ok=True)
args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
