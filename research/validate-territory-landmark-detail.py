"""Comprueba los encuadres públicos del Horno y del pantalán y sus llamadas WebGL."""
import argparse
import json
import math
from pathlib import Path

from playwright.sync_api import sync_playwright


OBSERVE = """(() => {
 const hook=window.__THREE_DEVTOOLS__=new EventTarget();
 hook.addEventListener('observe',e=>{
  const r=e.detail;if(!r.isWebGLRenderer)return;
  const draw=r.renderBufferDirect.bind(r),render=r.render.bind(r);
  let camera=null,rows=null;
  r.render=function(s,c){
   if(!window.readAtlasDraws||!r.domElement.isConnected||!c.isPerspectiveCamera||camera)return render(s,c);
   camera=c;rows=[];
   try{return render(s,c)}finally{
    camera=null;
    window.readAtlasDraws(rows);
    window.readAtlasDraws=null;rows=null;
   }
  };
  r.renderBufferDirect=function(c,s,g,m,o,group){
   if(rows&&c===camera){
    let node=o;while(node&&!node.name?.startsWith('Atlas · '))node=node.parent;
    if(node||o.isInstancedMesh){
     const available=group?.count??g.drawRange.count;
     const triangles=Math.min(available,g.index?.count??g.attributes.position.count)/3;
     const piece=o.name||o.material?.name||o.parent?.name||o.geometry.type;
     rows.push({model:node?.name||'Territorio',piece,instances:o.isInstancedMesh?o.count:0,triangles:triangles*(o.isInstancedMesh?o.count:1)});
    }
   }
   return draw(c,s,g,m,o,group);
  };
 });
})();"""


def run(browser, base, portrait):
    page = browser.new_page(viewport={'width': 412 if portrait else 1080, 'height': 800 if portrait else 700},
                            has_touch=portrait, device_scale_factor=1)
    page.add_init_script(OBSERVE)
    page.goto(base + '#simulador', wait_until='domcontentloaded', timeout=120000)
    page.wait_for_function('window.territoryStatus?.ready && territoryStatus.mode==="orbit"', timeout=120000)
    axes = 'portrait' if portrait else 'wide'
    frames = page.evaluate("async()=>await (await fetch('./assets/territory/atlas-frames.json')).json()")
    if not portrait:
        page.locator('#sim-settings-open').click()
        page.locator('#sim-quality').select_option('2')
        page.locator('#sim-settings-open').click()
    results=[]
    cases = [('pantalan-paseo','Paseo del Pantalán'),('pantalan-maritimo','Pantalán marítimo')]
    if not portrait:
        cases.insert(0,('horno','Alto Horno'))
    for place, name in cases:
        page.locator('#sim-search-open').click()
        page.locator('#sim-query').fill(name)
        page.locator('#sim-results button').first.click()
        key = 'horno' if place=='horno' else 'pantalan'
        for close in [False, True]:
            frame=frames[place]
            if close:
                page.locator('#sim-frame').click()
                frame=frame['exterior']
            pose=frame[axes]
            expected=math.dist(pose['eye'],pose['target'])
            page.wait_for_function("""([key,expected])=>territoryStatus.heritage?.loaded.includes(key)
                &&Math.abs(territoryStatus.range-expected)<Math.max(2,expected*.025)""",
                arg=[key,expected],timeout=120000)
            snapshot=page.evaluate("""async()=>{
                const draws=await new Promise(resolve=>window.readAtlasDraws=resolve);
                const s=window.territoryStatus,out={};
                for(const r of draws){
                 const g=out[r.model]||=( {calls:0,triangles:0,instanceCalls:0,instances:0,instanceTriangles:0});
                 g.calls++;g.triangles+=r.triangles;
                 if(r.instances){g.instanceCalls++;g.instances+=r.instances;g.instanceTriangles+=r.triangles;}
                }
                return {range:s.range,quality:s.quality,lights:s.heritage.lights,loaded:s.heritage.loaded,rendered:out,
                 expensive:draws.filter(r=>r.instances).sort((a,b)=>b.triangles-a.triangles).slice(0,3)};
            }""")
            assert any(name.split()[0] in title for title in snapshot['rendered']) or key=='pantalan' and any('Pantalán' in title for title in snapshot['rendered'])
            if key=='horno' and close:
                assert snapshot['lights']>=2
            results.append(dict(viewport=axes,id=place,frame='cerca' if close else 'conjunto',**snapshot))
        page.locator('#sim-home').click()
        page.wait_for_function('key=>territoryStatus.range>5500&&!territoryStatus.heritage.loaded.includes(key)',arg=key,timeout=120000)
    page.close()
    return results


if __name__=='__main__':
    args=argparse.ArgumentParser(description=__doc__)
    args.add_argument('--base',default='http://127.0.0.1:8455/')
    args.add_argument('--out',type=Path,default=Path('research/validation-atlas-parity/encuadres-pantalan-horno.json'))
    options=args.parse_args()
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(channel='chrome')
        results=run(browser,options.base,False)+run(browser,options.base,True)
        browser.close()
    options.out.write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
