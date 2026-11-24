"""Compile the two environmental passes in a browser over the shipped shoreline.

This isolates optical errors before running the assembled simulator. The renders
contain the geographic water polygon and sky only. Metrics refer to this test.
"""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
TEST = """async (native) => {
  const G = await import(native?'three/webgpu':'three');
  const env = native?await import('./js/territory-node-environment.js'):null;
  const {createTerritorySea} = await import('./js/territory-sea.js');
  const {createAtmosphere} = await import('./js/territory-atmosphere.js');
  const {project} = await import('./js/territory-coordinates.js');
  const {contactRenderer} = env || await import('./js/territory-contact.js');
  const world=await (await fetch('./assets/territory/world.json')).json();
  const r=native?new G.WebGPURenderer({antialias:false}):new G.WebGLRenderer({antialias:false});
  let device=null,adapter=null;
  if(native){
    await r.init();
    if(!r.backend.isWebGPUBackend)throw Error('El navegador seleccionó WebGL');
    device=r.backend.device;
    const info=device.adapterInfo;
    adapter=info?{vendor:info.vendor,architecture:info.architecture,description:info.description}:null;
    device.pushErrorScope('validation');
    device.addEventListener('uncapturederror',e=>console.error(e.error.message));
  }else{
    const gl=r.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info');
    adapter=info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):null;
  }
  r.setSize(500,320);r.toneMapping=G.ACESFilmicToneMapping;
  document.body.append(r.domElement);
  const sea=createTerritorySea({polygons:world.water,bounds:world.bounds,shorelines:world.shorelines,
    project,heightAt:()=>0,mobile:true,reduced:true,nativeEnvironment:env});
  const scene=new G.Scene();scene.add(sea.group);
  const camera=new G.PerspectiveCamera(43,500/320,.15,60000);
  const sample=new G.Vector3(10360,0,2473);
  camera.position.set(sample.x+70,28,sample.z+50);camera.lookAt(sample);
  const atmosphere=createAtmosphere(scene,r,sea,{night:{value:0},shadowRevision:0},{setNight(){},shadowRevision:0},{a:1,b:0,c:0,d:1},env);
  const render=contactRenderer(r),shots={};
  async function draw(label,contact=false,range=65){
    // Both implementations time-slice the planar reflection and environment
    // probe. Give the freshly decoded cloud texture a turn in both passes.
    await new Promise(resolve=>setTimeout(resolve,260));
    for(let i=0;i<4;i++){
      atmosphere.update(camera,sample,range,2);sea.update(1/60,2);render(scene,camera,contact,2);
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
    if(device)await device.queue.onSubmittedWorkDone();
    // Capture right after submission. Default framebuffer presentation may
    // clear its contents at the next rAF in WebGL.
    render(scene,camera,contact,2);
    shots[label]=r.domElement.toDataURL();
  }
  atmosphere.setHour(12,'2026-06-21');await draw('solar');
  await draw('contact',true);const contactState={...render.stats};
  sea.setInspection([sample.x,sample.z,.025,0,0,.025]);await draw('cut');sea.setInspection(null);
  atmosphere.setHour(0,'2026-06-21');await draw('night');
  atmosphere.atlas('golden');await draw('atlas');
  // A calibration plate only writes to the sunlight shadow pass. This isolates
  // shadows received by the real water geometry from visible caster pixels.
  atmosphere.setHour(12,'2026-06-21');
  const plateGeometry=new G.BoxGeometry(25,2,20);
  const plateMaterial=new G.MeshStandardMaterial({colorWrite:false,depthWrite:false});
  const plate=new G.Mesh(plateGeometry,plateMaterial);
  plate.position.copy(sample);plate.position.y=4;scene.add(plate);
  await draw('sin-oclusor');
  plate.castShadow=true;
  const sun=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);
  sun.shadow.needsUpdate=true;r.shadowMap.needsUpdate=true;
  await draw('sombra');
  plate.removeFromParent();plateGeometry.dispose();plateMaterial.dispose();
  // An L-shaped calibration corner checks that the depth pass actually
  // darkens a contact edge, even with the main shadow map held constant.
  const corner=new G.Group();corner.position.copy(sample);
  const grey=new G.MeshStandardMaterial({color:0xddd6c6,roughness:.85});
  const pavement=new G.Mesh(new G.BoxGeometry(40,1,36),grey);
  pavement.position.y=.64;pavement.receiveShadow=true;
  const wall=new G.Mesh(new G.BoxGeometry(28,8,.8),grey);
  wall.position.set(0,5.14,-4);
  corner.add(pavement,wall);scene.add(corner);
  await draw('esquina');await draw('esquina-contacto',true);
  // Compile a separate material outside the shadow budget, then draw the
  // previously cached near material. Both must keep valid lighting bindings.
  const remoteMaterial=new G.MeshStandardMaterial({color:0x92887b});
  wall.material=remoteMaterial;await draw('sin-sombras',false,12000);
  const distantShadow=atmosphere.shadowSize;
  wall.material=grey;await draw('sombras-recuperadas');const nearShadow=atmosphere.shadowSize;
  remoteMaterial.dispose();
  corner.removeFromParent();pavement.geometry.dispose();wall.geometry.dispose();grey.dispose();
  const error=device?await device.popErrorScope():null;
  const stats=sea.stats;
  const triangles=(sea.water.geometry.index?.count??sea.water.geometry.attributes.position.count)/3;
  render.dispose();atmosphere.dispose();sea.dispose();r.dispose();
  return {shots,adapter,triangles,contact:contactState,shadowRange:[distantShadow,nearShadow],error:error?.message,stats};
}"""


def run(base, out):
    import base64
    import io
    import numpy as np
    from PIL import Image
    html=(ROOT/'dist/graphics-lab.html').read_text(encoding='utf8')
    imports=re.search(r'<script type="importmap">.*?</script>',html,re.S).group()
    out.mkdir(parents=True,exist_ok=True)
    report={}
    observed={}
    with sync_playwright() as w:
        browser=w.chromium.launch(channel='chrome')
        for name,native in [('webgl2',False),('webgpu',True)]:
            page=browser.new_page()
            errors=[]
            page.on('console',lambda m: errors.append(m.text) if m.type=='error' else None)
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.route('**/qa-environment-v4',lambda r:r.fulfill(body='<!doctype html>'+imports+'<body></body>',content_type='text/html'))
            page.goto(base.rstrip('/')+'/qa-environment-v4')
            result=page.evaluate(TEST,native)
            pictures={}
            for key,url in result.pop('shots').items():
                image=Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGB')
                if key in ('solar','atlas'):
                    image.save(out/(name+'-'+key+'.jpg'),quality=91)
                pictures[key]=np.array(image,dtype=float)
            result['cutDifference']=round(float(abs(pictures['solar']-pictures['cut']).mean()),3)
            result['nightDifference']=round(float(abs(pictures['solar']-pictures['night']).mean()),3)
            result['shadowPixels']=int(np.sum((pictures['sin-oclusor']-pictures['sombra']).mean(axis=2)>3))
            # Focus on the interior of the pavement and wall rather than the
            # ocean, frame border, or the distant antialiased horizon.
            diff=(pictures['esquina']-pictures['esquina-contacto'])[120:220,150:350].mean(axis=2)
            result['contactPixels']=int(np.sum(diff>3))
            observed[name]=pictures
            result['errors']=errors
            print(name, {k:v for k,v in result.items() if k!='stats'},flush=True)
            report[name]=result
            page.close()
        browser.close()
    comparisons={}
    for key in ('solar','night','atlas','cut','contact'):
        difference=abs(observed['webgpu'][key]-observed['webgl2'][key])
        comparisons[key]=dict(meanRGB=round(float(difference.mean()),3),p95RGB=round(float(np.quantile(difference,.95)),3))
    print('RGB (0–255)',comparisons,flush=True)
    (out/'environment.json').write_text(json.dumps(dict(backends=report,difference=comparisons),indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    for r in report.values():
        assert r['contact']['active'] and not r['contact']['failed'] and r['triangles']>600
        assert not r.get('error') and not r['errors'] and r['cutDifference']>1 and r['nightDifference']>15
        assert r['shadowPixels']>30
        assert r['contactPixels']>30
        assert r['shadowRange']==[0,2048]
    for result in comparisons.values():
        assert result['meanRGB']<3.5 and result['p95RGB']<10


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--base',required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    run(args.base,args.out)
