"""Compare the r180 WebGPU render-record lifecycle before and after sector eviction.

The baseline is the last project bundle before the disposal fix. Both bundles
run the same small scene on the native GPU. Metrics count actual render-object
allocation/disposal without adding a retaining set of objects to the test.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASELINE = 'e19da57'

SCENE = """async () => {
  const G=await import('three/webgpu'),{vec3}=await import('three/tsl');
  const renderer=new G.WebGPURenderer({antialias:false});
  renderer.setSize(32,32);await renderer.init();
  if(!renderer.backend.isWebGPUBackend)throw Error('Se necesita un dispositivo WebGPU nativo');
  const device=renderer.backend.device;device.pushErrorScope('validation');
  const scene=new G.Scene(),camera=new G.OrthographicCamera(-2,2,2,-2,.1,20);
  scene.background=new G.Color(0);camera.position.z=4;
  const target=new G.RenderTarget(32,32,{type:G.UnsignedByteType});
  renderer.setRenderTarget(target);
  const material=new G.MeshBasicNodeMaterial({toneMapped:false});
  material.colorNode=vec3(.8,.12,.03);
  let created=0,disposed=0;
  const pool=renderer._objects,allocate=pool.createRenderObject;
  pool.createRenderObject=function(...args){
    const record=allocate.apply(this,args);
    if(!record.object.userData.testSector)return record;
    created++;
    const release=record.onDispose;
    record.onDispose=()=>{disposed++;return release();};
    return record;
  };
  const listeners=resource=>resource._listeners?.dispose?.length||0;
  const snap=()=>({created,disposed,live:created-disposed,materialListeners:listeners(material)});
  const resources=geo=>({registered:renderer._geometries.has({geometry:geo}),
    positionBuffer:renderer._attributes.has(geo.attributes.position),
    indexBuffer:renderer._attributes.has(geo.index),geometryCounter:renderer.info.memory.geometries});
  const draw=()=>renderer.render(scene,camera);
  const geometry=()=>new G.PlaneGeometry(2,2);
  function place(geo,instanced=false){
    const mesh=instanced?new G.InstancedMesh(geo,material,1):new G.Mesh(geo,material);
    if(instanced){mesh.setMatrixAt(0,new G.Matrix4());mesh.instanceMatrix.needsUpdate=true;}
    mesh.userData.testSector=true;scene.add(mesh);return mesh;
  }
  async function pixel(){
    draw();
    const rgba=await renderer.readRenderTargetPixelsAsync(target,16,16,1,1);
    return Array.from(rgba.slice(0,4));
  }
  const initial=snap(),checkpoints=[],shared=geometry();
  for(let i=1;i<=24;i++){
    const unique=geometry(),ground=place(unique),batch=place(shared,true);
    draw();scene.remove(ground,batch);unique.dispose();batch.dispose();
    if(i%8===0)checkpoints.push({tiles:i,...snap()});
  }
  const old=geometry(),moving=place(old);draw();
  const before=snap(),oldBefore=listeners(old),replacement=geometry();
  moving.geometry=replacement;draw();
  const oldAfterSwap=listeners(old),bothBeforeRelease={old:resources(old),replacement:resources(replacement)};
  old.dispose();
  const bothAfterRelease={old:resources(old),replacement:resources(replacement)};
  const afterOld=snap(),oldAfterRelease=listeners(old),pixelAfterSwap=await pixel();
  const beforeReplacement=snap();
  replacement.dispose();const afterReplacement=snap(),firstRelease=resources(replacement);
  const pixelReusedGeometry=await pixel(),afterGeometryReuse=snap(),secondAllocation=resources(replacement);
  scene.remove(moving);replacement.dispose();
  const secondRelease=resources(replacement);
  const batch=place(shared,true);const firstInstance=await pixel(),beforeInstanced=snap();
  scene.remove(batch);batch.dispose();const afterInstanceRelease=snap();
  scene.add(batch);const pixelReusedInstance=await pixel(),afterInstanceReuse=snap();
  scene.remove(batch);batch.dispose();
  const final=snap();shared.dispose();material.dispose();
  const released=snap(),error=await device.popErrorScope();
  renderer.setRenderTarget(null);target.dispose();renderer.dispose();
  return {backend:'WebGPU',initial,checkpoints,
    swap:{oldBefore,oldAfterSwap,oldAfterRelease,before,afterOld,bothBeforeRelease,bothAfterRelease,pixelAfterSwap},
    reuseGeometry:{before:beforeReplacement,evicted:afterReplacement,drawn:afterGeometryReuse,pixel:pixelReusedGeometry,
      firstRelease,secondAllocation,secondRelease},
    reuseInstance:{firstPixel:firstInstance,before:beforeInstanced,evicted:afterInstanceRelease,
      drawn:afterInstanceReuse,pixel:pixelReusedInstance},final,released,validation:error?.message||null};
}"""


def inspect(browser, base, baseline, imports):
    context = browser.new_context()
    try:
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)[:500]))
        page.on('console', lambda line: errors.append(line.text[:500]) if line.type == 'error' else None)
        page.route('**/__qa_render_records', lambda route: route.fulfill(
            content_type='text/html', body=f'<script type="importmap">{imports}</script>'))
        if baseline is not None:
            page.route('**/assets/vendor/three.webgpu.js', lambda route: route.fulfill(
                content_type='application/javascript', body=baseline))
        page.goto(base.rstrip('/') + '/__qa_render_records')
        data = page.evaluate(SCENE)
        data['consoleErrors'] = errors
        return data
    finally:
        context.close()


def verify(before, after):
    # Each evicted tile owns one geometry and one InstancedMesh with shared geometry.
    assert [p['live'] for p in before['checkpoints']] == [16,32,48], before
    assert [p['materialListeners'] for p in before['checkpoints']] == [16,32,48], before
    assert all(p['live']==p['materialListeners']==0 for p in after['checkpoints']), after
    swap = after['swap']
    assert swap['oldBefore'] == swap['oldAfterSwap'] + 1 and swap['oldAfterRelease'] == 0, swap
    assert swap['before'] == swap['afterOld'], swap
    for field in ('registered','positionBuffer','indexBuffer'):
        assert all(row[field] for row in swap['bothBeforeRelease'].values()), swap
        assert not swap['bothAfterRelease']['old'][field] and swap['bothAfterRelease']['replacement'][field], swap
        geom=after['reuseGeometry']
        assert not geom['firstRelease'][field] and geom['secondAllocation'][field] and not geom['secondRelease'][field], geom
    assert geom['secondAllocation']['geometryCounter'] == geom['firstRelease']['geometryCounter']+1, geom
    assert geom['secondRelease']['geometryCounter'] == geom['firstRelease']['geometryCounter'], geom
    for family in ('reuseGeometry','reuseInstance'):
        r = after[family]
        assert r['evicted']['live'] == 0 and r['drawn']['live'] == 1, r
        assert r['drawn']['created'] == r['before']['created'] + 1, r
    for color in (swap['pixelAfterSwap'], after['reuseGeometry']['pixel'], after['reuseInstance']['pixel']):
        assert color[0]>=150 and color[1]<color[0]*.55 and color[3]==255, color
    assert after['final']['live'] == after['final']['materialListeners'] == 0, after
    assert before['released']['live'] == after['released']['live'] == 0
    assert not after['validation'] and not after['consoleErrors'],after


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',required=True)
    parser.add_argument('--out',type=Path,required=True)
    args = parser.parse_args()
    baseline = subprocess.check_output(['git','show',BASELINE+':dist/assets/vendor/three.webgpu.js'],cwd=ROOT)
    html = (ROOT / 'dist/index.html').read_text(encoding='utf8')
    imports = re.search(r'<script type="importmap">(.+?)</script>',html,re.S).group(1)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome')
        try:
            before = inspect(browser,args.base,baseline,imports)
            after = inspect(browser,args.base,None,imports)
            result = {'browser':browser.version,'baseline':BASELINE,'before':before,'after':after}
        finally:
            browser.close()
    args.out.parent.mkdir(parents=True,exist_ok=True)
    try:
        verify(before,after)
        result['passed'] = True
    except AssertionError:
        result['passed'] = False
        raise
    finally:
        args.out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print('WebGPU render records before/after',before['final']['live'],after['final']['live'],flush=True)
