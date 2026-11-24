"""Exercise release of native draw records while a shared atlas texture stays resident."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--base',required=True)
p.add_argument('--out',type=Path)
p.add_argument('--bundle',type=Path,help='Optional Three r180 bundle to compare against the working tree')
args=p.parse_args()
root=Path(__file__).resolve().parents[1]
imports=(root/'dist/graphics-lab.html').read_text(encoding='utf8').split('<script type="importmap">')[1].split('</script>')[0]

with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome')
    page=browser.new_page()
    cdp=page.context.new_cdp_session(page)
    errors=[]
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.on('pageerror',lambda e:errors.append(str(e)))
    if args.bundle:
        page.route('**/assets/vendor/three.webgpu.js',lambda route:route.fulfill(
            path=args.bundle,content_type='text/javascript'))
    page.route('**/__qa_native_retention',lambda route:route.fulfill(content_type='text/html',body='<script type="importmap">'+imports+'</script>'))
    page.goto(args.base.rstrip('/')+'/__qa_native_retention')
    page.evaluate("""async()=>{
      const G=await import('three/webgpu'),{nativeMaterials}=await import('./js/territory-native-materials.js');
      const renderer=new G.WebGPURenderer({antialias:false});renderer.setSize(32,32);await renderer.init();
      if(!renderer.backend.isWebGPUBackend)throw Error('Se requiere WebGPU nativo');
      const adapter=nativeMaterials(renderer),scene=new G.Scene(),cam=new G.OrthographicCamera(-1,1,1,-1,.1,10);cam.position.z=2;
      const map=new G.DataTexture(new Uint8Array([121,92,68,255]),1,1);map.needsUpdate=true;
      const shared=new G.MeshBasicMaterial({map});
      let observed=[];
      const create=renderer._objects.createRenderObject.bind(renderer._objects);
      renderer._objects.createRenderObject=(...args)=>{
        const draw=create(...args);if(draw.object.userData.section)observed.push(new WeakRef(draw));return draw;
      };
      async function batch(sharedSource){
        const mesh=[];
        for(let i=0;i<16;i++){
          const source=sharedSource?shared:new G.MeshBasicMaterial({map});
          const object=new G.InstancedMesh(new G.PlaneGeometry(.2,.2),source,2);
          object.userData.section=true;object.frustumCulled=false;
          object.setMatrixAt(0,new G.Matrix4().makeTranslation((i%4)*.4-.6,Math.floor(i/4)*.4-.6,0));
          scene.add(object);mesh.push(object);
        }
        adapter.draw(scene,()=>renderer.render(scene,cam));
        for(const o of mesh){
          scene.remove(o);o.dispose();o.geometry.dispose();if(!sharedSource)o.material.dispose();
        }
        adapter.draw(scene,()=>renderer.render(scene,cam));await renderer.backend.device.queue.onSubmittedWorkDone();
      }
      function read(){
        observed=observed.filter(ref=>ref.deref());
        return {drawRecords:observed.length,textureDisposalListeners:map._listeners?.dispose?.length||0,
          pipelines:renderer._nodes.nodeBuilderCache.size,geometryCount:renderer.info.memory.geometries,
          textureCount:renderer.info.memory.textures,materialVariants:adapter.stats.variants};
      }
      window.retention={batch,read};
    }""")
    results={}
    for name,shared in [('materialReleased',False),('materialShared',True)]:
        points=[]
        for _ in range(3):
            page.evaluate('v=>retention.batch(v)',shared)
            cdp.send('HeapProfiler.collectGarbage')
            point=page.evaluate('retention.read()')
            point['heapAfterGCMiB']=round(cdp.send('Runtime.getHeapUsage')['usedSize']/1048576,2)
            points.append(point)
        results[name]=points
    results['errors']=errors
    print(json.dumps(results),flush=True)
    if args.out:
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(json.dumps(results,indent=2)+'\n',encoding='utf8')
    browser.close()
    assert not errors,errors
    for name in ('materialReleased','materialShared'):
        checkpoints=results[name]
        assert checkpoints[-1]['textureDisposalListeners']<=checkpoints[0]['textureDisposalListeners']+2,checkpoints
        assert checkpoints[-1]['drawRecords']<=2 and checkpoints[-1]['pipelines']<=checkpoints[0]['pipelines']+2,checkpoints
