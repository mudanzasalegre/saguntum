"""Check WebGL program lifetime and framebuffer colour when streamed materials leave."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page()
    page.goto(args.base.rstrip('/')+'/assets/data/atlas-visits.json')
    report = page.evaluate("""async()=>{
      const T=await import('/assets/vendor/three.module.js');
      const record={};
      for(const limit of [0,2]){
        const r=new T.WebGLRenderer(); r.setSize(8,8); r.streamPrograms={limit,reused:0};
        const camera=new T.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;
        const scene=new T.Scene(),results=[];
        for(const [variant,color] of [[0,0xff0000],[0,0x00ff00],[1,0xffffff],[2,0xffffff],[3,0xffffff]]){
          const material=new T.MeshBasicMaterial({color});
          material.defines={STREAM_TEST:variant};
          const mesh=new T.Mesh(new T.PlaneGeometry(2,2),material);scene.add(mesh);
          r.render(scene,camera);
          const rgba=new Uint8Array(4),gl=r.getContext();
          gl.readPixels(4,4,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
          scene.remove(mesh);mesh.geometry.dispose();material.dispose();
          results.push({pixel:[...rgba],programs:r.info.programs.length});
        }
        const reused=r.streamPrograms.reused;
        r.dispose(); const remaining=r.info.programs.length; r.forceContextLoss();
        record[limit]={results,reused,remaining};
      }
      return record;
    }""")
    for limit in [0,2]:
        run=report[str(limit)]
        assert run['results'][0]['pixel']==[255,0,0,255] and run['results'][1]['pixel']==[0,255,0,255]
        assert max(row['programs'] for row in run['results'])==limit
        assert run['remaining']==0 and run['reused']==int(limit>0)
    browser.close()
args.out.parent.mkdir(parents=True,exist_ok=True)
args.out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
