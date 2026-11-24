"""Check a registered archaeological cut and streamed pavement masks by GPU readback.

Serves no assets. The supplied base must already serve the production dist directory.
The coloured inspection plane isolates discarded fragments from the city surrounding them.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright


def check(base):
    markup = (Path(__file__).resolve().parents[1] / 'dist/graphics-lab.html').read_text(encoding='utf-8')
    imports = markup.split('<script type="importmap">')[1].split('</script>')[0]
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome')
        page = browser.new_page()
        page.set_default_timeout(60000)
        messages = []
        page.on('console', lambda m: messages.append(m.text) if m.type == 'error' else None)
        page.route('**/__qa_ground', lambda route: route.fulfill(
            content_type='text/html', body=f'<script type="importmap">{imports}</script>'))
        page.goto(base.rstrip('/') + '/__qa_ground')
        result = page.evaluate("""async () => {
          const G=await import('three/webgpu'),{project}=await import('./js/territory-coordinates.js');
          const {sectionWindow}=await import('./js/territory-heritage-section.js');
          const {atlasRoadMasks}=await import('./js/territory-heritage-roadmask.js');
          const {territorialCut}=await import('./js/territory-heritage-relief.js');
          const {groundNodeMaterial}=await import('./js/territory-node-ground.js');
          const {dressHeritageSurfaces}=await import('./js/territory-heritage-surface.js');
          const {groundEffectsOf}=await import('./js/territory-ground-effects.js');
          const {registration}=await (await fetch('./assets/data/circo-context.json')).json();
          const {widthM:width,depthM:depth,centerLocalXZ:[lx,lz]}=registration.currentMask;
          const anchor=project(...registration.coordinate),yaw=registration.yawRadians;
          const x=anchor.x+lx*Math.cos(yaw)+lz*Math.sin(yaw),z=anchor.z-lx*Math.sin(yaw)+lz*Math.cos(yaw);
          const cut=territorialCut({center:{x,z},width,depth,yaw},{world:(x,z)=>({x,z})});
          const renderer=new G.WebGPURenderer({antialias:false,alpha:false});
          renderer.setSize(64,64);await renderer.init();
          if(!renderer.backend.isWebGPUBackend)throw Error('WebGPU nativo no disponible');
          const device=renderer.backend.device;
          device.pushErrorScope('validation');
          const scene=new G.Scene();scene.background=new G.Color(0x000000);
          const geometry=new G.PlaneGeometry(38,38).rotateX(-Math.PI/2).translate(x,0,z);
          const source=new G.MeshBasicMaterial({color:0xffffff}),masks=atlasRoadMasks(),section=sectionWindow();
          masks.apply(source);section.material(source);
          const mesh=new G.Mesh(geometry,source);mesh.material=groundNodeMaterial(source,mesh,null,renderer);
          scene.add(mesh);
          const camera=new G.OrthographicCamera(-19,19,19,-19,.1,100);
          camera.position.set(x,40,z);camera.up.set(0,0,-1);camera.lookAt(x,0,z);
          const target=new G.RenderTarget(64,64,{type:G.UnsignedByteType});
          const measure=async()=>{
            renderer.setRenderTarget(target);renderer.render(scene,camera);
            const data=await renderer.readRenderTargetPixelsAsync(target,0,0,64,64);
            const lit=(u,v)=>data[(64*v+u)*4]>50;
            let dark=0;for(let i=0;i<4096;i++)if(data[4*i]<20)dark++;
            return {lateral:lit(10,32),centro:lit(32,32),oscuros:dark};
          };
          const initial=await measure();section.set(cut);const opened=await measure();
          section.set(null);
          const row=(l,t)=>({width:10,height:10,metres:1,left:l,top:t,heights:new Int16Array(100).fill(2)});
          masks.update([{pavement:row(x-4,z-4)}]);const paving=await measure();
          masks.update([{pavement:row(x-4,z-4)},{pavement:row(x-16,z-4)}]);const twoSlots=await measure();
          masks.update([]);const closed=await measure();
          // Use the normal production material registration for a stone and
          // a downward-wound roof sample, including a native PCF shadow pass.
          const pieces=new G.Group();scene.add(pieces);
          const roof=new G.Mesh(new G.PlaneGeometry(6,6).rotateX(Math.PI/2),
            new G.MeshStandardMaterial({color:'#b99b76',side:G.DoubleSide,name:'Roof'}));
          roof.position.set(x+7,4,z);roof.receiveShadow=roof.castShadow=true;pieces.add(roof);
          const stone=new G.Mesh(new G.BoxGeometry(4,4,4),new G.MeshStandardMaterial({color:'#c8a78c',name:'Stone'}));
          stone.position.set(x-6,2,z);stone.receiveShadow=stone.castShadow=true;pieces.add(stone);
          const blend={value:1};dressHeritageSurfaces(pieces,blend);
          const grain=groundEffectsOf(stone.material).grain.uniforms;
          for(let i=0;i<100&&!grain.grainReady.value;i++)await new Promise(r=>setTimeout(r,35));
          const original=[stone.material,roof.material];
          for(const obj of [stone,roof])obj.material=groundNodeMaterial(obj.material,obj,null,renderer);
          const sun=new G.DirectionalLight(0xffffff,1.7);
          sun.position.set(x+14,18,z+10);sun.target.position.set(x,0,z);
          Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:.5,far:80});
          sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.085;sun.shadow.mapSize.set(256,256);
          sun.castShadow=true;mesh.castShadow=true;scene.add(sun,sun.target);
          renderer.shadowMap.type=G.PCFShadowMap;renderer.shadowMap.enabled=true;
          await measure();section.set(cut);await measure();
          const heritageShading={grainLoaded:grain.grainReady.value===1,grainNode:!!stone.material.normalNode,
            roofNode:!!roof.material.receivedShadowPositionNode,shadowPass:!!sun.shadow.map};
          const gpuError=await device.popErrorScope();
          for(const m of original)m.dispose();
          for(const obj of [stone,roof]){obj.material.dispose();obj.geometry.dispose();}
          sun.shadow.dispose();
          masks.dispose();target.dispose();geometry.dispose();source.dispose();mesh.material.dispose();renderer.dispose();
          return {motor:'WebGPU',lugar:'Puerta del circo',width,depth,yaw,initial,opened,paving,twoSlots,closed,heritageShading,
            gpuError:gpuError?.message||null};
        }""")
        assert not messages and not result['gpuError'], (messages, result)
        assert result['initial']['centro'] and result['closed']['centro'], result
        assert result['opened']['lateral'] and not result['opened']['centro'], result
        assert abs(result['opened']['oscuros'] - result['width']*result['depth']*(64/38)**2) < 14, result
        assert not result['paving']['centro'] and result['paving']['lateral'], result
        assert not result['twoSlots']['lateral'] and not result['twoSlots']['centro'], result
        assert all(result['heritageShading'].values()),result
        # Render the actual terrain and its streaming photography at the same
        # registration, with identical camera/light and three different readings.
        shots={}
        for engine in ('webgl2','webgpu'):
            page.reload()
            shots[engine]=page.evaluate("""async engine=>{
              const T=await import('three'),G=await import('three/webgpu'),gpu=engine==='webgpu';
              const {project}=await import('./js/territory-coordinates.js');
              const {loadElevation,buildGround,makeSampler}=await import('./js/territory-ground.js');
              const {setTerrainAppearance,surfacePhotoMetrics}=await import('./js/territory-surface-photo.js');
              const {atlasRoadMasks}=await import('./js/territory-heritage-roadmask.js');
              const {groundNodeMaterial}=await import('./js/territory-node-ground.js');
              const renderer=gpu?new G.WebGPURenderer():new T.WebGLRenderer({antialias:false});
              renderer.setSize(128,128);
              if(gpu)await renderer.init();
              const device=gpu?renderer.backend.device:null;device?.pushErrorScope('validation');
              const world=await (await fetch('./assets/territory/world.json')).json();
              const grids=await loadElevation(world.terrain),height=makeSampler(grids),scene=new T.Scene();
              const ground=await buildGround(scene,grids,height,renderer),masks=atlasRoadMasks();
              ground.setHeritage({relief:[],maskRoadMaterial:masks.apply});
              const anchor=project(-.275518,39.681049),{x,z}=anchor,y=height(x,z);
              const camera=new T.OrthographicCamera(-45,45,45,-45,.1,4000);
              camera.position.set(x,y+130,z);camera.up.set(0,0,-1);camera.lookAt(x,y,z);
              scene.add(new T.AmbientLight(0xffffff,2.5));
              const target=gpu?new G.RenderTarget(128,128,{type:T.UnsignedByteType}):new T.WebGLRenderTarget(128,128);
              renderer.setRenderTarget(target);
              const materials=new WeakMap();
              async function image(){
                if(gpu)scene.traverse(o=>{if(o.material&&!o.material.isNodeMaterial){
                  const src=o.material;
                  if(!materials.has(src))materials.set(src,groundNodeMaterial(src,o,null,renderer)||renderer.library.fromMaterial(src));
                  o.material=materials.get(src);
                }});
                renderer.render(scene,camera);
                let rgba;
                if(gpu)rgba=await renderer.readRenderTargetPixelsAsync(target,0,0,128,128);
                else {rgba=new Uint8Array(128*128*4);renderer.readRenderTargetPixels(target,0,0,128,128,rgba);}
                const rgb=[];
                for(let j=0;j<128;j+=4)for(let i=0;i<128;i+=4){
                  const offset=((gpu?j:127-j)*128+i)*4;rgb.push(...rgba.slice(offset,offset+3));
                }
                return rgb;
              }
              const delay=ms=>new Promise(done=>setTimeout(done,ms));
              function receivedRegional(){return ground.photography.uRegionalCells.value.some(c=>c.x>-90000);}
              setTerrainAppearance(false);
              const overview=await image();
              for(let i=0;i<180;i++){ground.update(x,z,90);if(i>8&&surfacePhotoMetrics().cells.length>=3&&receivedRegional())break;await delay(90);}
              const actual=await image(),metrics=surfacePhotoMetrics();
              setTerrainAppearance(true);
              for(let i=0;i<180;i++){ground.update(x,z,90);if(i>6&&receivedRegional())break;await delay(60);}
              const natural=await image(),error=await device?.popErrorScope();
              renderer.setRenderTarget(null);target.dispose();masks.dispose();renderer.dispose();
              return {overview,actual,natural,metrics,error:error?.message||null};
            }""",engine)
            assert not shots[engine]['error'] and shots[engine]['metrics']['cells'], (engine,shots[engine]['error'],messages)
        import numpy as np
        correlations={}
        for view in ('overview','actual','natural'):
            a,b=(np.array(shots[e][view],dtype=float) for e in shots)
            correlations[view]=dict(correlation=round(float(np.corrcoef(a,b)[0,1]),5),
                                    meanAbsDifference255=round(float(np.abs(a-b).mean()),3))
        result.update(terrain=correlations,metresPerPixel=shots['webgpu']['metrics']['sampleMetres'],console=messages)
        assert not messages and all(v['correlation']>.95 and v['meanAbsDifference255']<7 for v in correlations.values()),result
        return result


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--base',required=True)
    p.add_argument('--out',type=Path)
    args=p.parse_args()
    body=json.dumps(check(args.base),ensure_ascii=False,indent=2)
    print(body)
    if args.out:
        args.out.parent.mkdir(exist_ok=True,parents=True)
        args.out.write_text(body+'\n',encoding='utf-8')
