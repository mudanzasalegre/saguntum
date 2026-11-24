"""Compile urban material contracts and draw them on an actual WebGPU device."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', required=True)
parser.add_argument('--out', type=Path)
args = parser.parse_args()
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome')
    page = browser.new_page(viewport=dict(width=800, height=660))
    errors = []
    warnings = []
    page.on('console', lambda m: errors.append(m.text[:1600]) if m.type == 'error' else None)
    page.on('console', lambda m: warnings.append(m.text[:300]) if m.type == 'warning' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    path = args.base.rstrip('/') + '/urban-nodes-test'
    imports = dict(three='./assets/vendor/three.module.js',
                   **{'three/webgpu':'./assets/vendor/three.webgpu.js','three/tsl':'./assets/vendor/three.tsl.js',
                      'three/addons/utils/BufferGeometryUtils.js':'./assets/vendor/BufferGeometryUtils.js'})
    page.route(path, lambda route: route.fulfill(content_type='text/html',
        body='<script type="importmap">'+json.dumps(dict(imports=imports))+'</script>'))
    page.goto(path)
    result = page.evaluate("""async()=>{
      const T=await import('three'),G=await import('three/webgpu'),{urbanNodeMaterial}=await import('./js/territory-node-urban.js'),
        {streetTrees}=await import('./js/territory-street-trees.js'),{urbanMaterialRecord}=await import('./js/territory-urban-material-record.js'),
        {streetActors,streetFurniture}=await import('./js/territory-props.js'),{nearFacades}=await import('./js/territory-facades.js'),
        {architecturalMaterial,skylineMaterial,architectureScans}=await import('./js/territory-building-material.js'),
        {streetMaterial,streetGeometry}=await import('./js/territory-street-surfaces.js');
      const renderer=new G.WebGPURenderer({antialias:false});await renderer.init();
      if(!renderer.backend.isWebGPUBackend)throw Error('WebGPU native backend unavailable');
      renderer.setSize(500,420);document.body.append(renderer.domElement);
      const device=renderer.backend.device,scene=new G.Scene(),cam=new G.PerspectiveCamera(50,500/420,.1,200);
      const uncaptured=[];device.addEventListener('uncapturederror',e=>uncaptured.push(e.error.message));
      device.pushErrorScope('validation');
      scene.background=new G.Color(0x45768e);scene.add(new G.HemisphereLight(0xfff4da,0x82909c,2));
      const sun=new G.DirectionalLight(0xffeece,2);sun.position.set(6,10,9);scene.add(sun);
      const kinds=[],checks=[];
      function put(name,geo,source,instanced=false){
        const mesh=instanced?new G.InstancedMesh(geo,source,1):new G.Mesh(geo,source);
        if(instanced)mesh.setMatrixAt(0,new G.Matrix4());
        if(['facade-details','car','pedestrian'].includes(name))mesh.setColorAt(0,new G.Color(0xa6c9a9));
        mesh.material=urbanNodeMaterial(source,mesh,renderer);if(!mesh.material?.isNodeMaterial)throw Error(name);
        scene.add(mesh);mesh.position.x=(kinds.length%4)*2-3;mesh.position.z=Math.floor(kinds.length/4)*-3;
        kinds.push(name);checks.push({mesh,source,node:mesh.material,name});return mesh;
      }
      function add(geo,name,n,values){const floats=Array.from({length:geo.attributes.position.count},()=>values).flat();geo.setAttribute(name,new G.Float32BufferAttribute(floats,n));}
      const geo=new G.PlaneGeometry(9,6),uv=geo.attributes.uv;
      const metric=[];
      for(let i=0;i<uv.count;i++){
        const x=uv.getX(i),y=uv.getY(i);metric.push(9*x,6*y,0,0);uv.setXY(i,x*3,y*2);
      }
      add(geo,'color',3,[.64,.55,.35]);add(geo,'archData',4,[0,0,73,60]);
      geo.setAttribute('archMetric',new G.Float32BufferAttribute(metric,4));
      const night={value:0};
      put('architecture',geo,architecturalMaterial(night,null));
      put('skyline',geo,skylineMaterial(null));
      const street=streetGeometry({roads:[{id:'test',kind:'primary',width:8,car:true,points:[[-2,-3],[2,3]]}],rail:[]},()=>0);
      put('street',street,streetMaterial());
      const details=new G.Group();nearFacades(details);const trim=details.children[0];trim.geometry.attributes.facadeFinish.setX(0,2);
      put('facade-details',trim.geometry,trim.material,true);
      const props=streetActors(new G.Group(),1,1);props.stride.setX(0,.7);props.setNight(.6);
      put('pedestrian',props.walkers.geometry,props.walkers.material,true);
      put('car',props.cars.geometry,props.cars.material,true);
      const trees=await streetTrees();put('crown',trees.geometry.crown,trees.material.crown,true);
      put('tree-view',trees.geometry.treeView,trees.material.treeView,true);
      const plaza=new G.Group(),furniture=await streetFurniture();
      furniture.build(plaza,[{kind:'tree',x:0,z:0}],[],[{kind:'square',rings:[[[-3,-3],[3,-3],[3,3],[-3,3]]]}],()=>0);
      for(const mesh of plaza.children){
        const kind=urbanMaterialRecord(mesh.material)?.kind;
        if(kind==='tree-pit'||kind==='tree-contact')put(kind,mesh.geometry,mesh.material,true);
      }
      const scans=architectureScans();for(let i=0;i<120&&!scans.uArchReady.value;i++)await new Promise(resolve=>setTimeout(resolve,50));
      if(!scans.uArchReady.value)throw Error('Architecture texture download failed');
      cam.position.set(4,4,12);cam.lookAt(0,0,0);renderer.info.autoReset=false;
      const target=new G.RenderTarget(320,256,{type:G.UnsignedByteType});renderer.setRenderTarget(target);
      renderer.render(scene,cam);await device.queue.onSubmittedWorkDone();
      const pixels=await renderer.readRenderTargetPixelsAsync(target,0,0,320,256);
      const shades=new Set(),data=new Uint8Array(pixels.buffer);for(let i=0;i<data.length;i+=4)shades.add(data[i]*65536+data[i+1]*256+data[i+2]);
      const calls=renderer.info.render.drawCalls;
      const gl=new T.WebGLRenderer({antialias:false});gl.setSize(160,128);
      const W=192,H=128,glTarget=new T.WebGLRenderTarget(W,H),gpuTarget=new G.RenderTarget(W,H,{type:G.UnsignedByteType});
      gl.setRenderTarget(glTarget);renderer.setRenderTarget(gpuTarget);
      const reference=new T.OrthographicCamera(-5.25,5.25,3.5,-3.5,.1,100);
      const sky=new G.Scene();sky.background=new G.Color(0x9db2c7);
      const gpuProbe=new G.PMREMGenerator(renderer),glProbe=new T.PMREMGenerator(gl);
      const skyGPU=gpuProbe.fromScene(sky,0,.1,60,{size:32}),skyGL=glProbe.fromScene(sky,0,.1,60,{size:32});
      const results={};
      for(const {mesh,source,node,name} of checks){
        checks.forEach(c=>{c.mesh.visible=c.mesh===mesh;});mesh.position.set(0,0,0);
        reference.up.set(0,1,0);
        const tree=['crown','tree-view'].includes(name),look=tree?2:0;
        reference.zoom=['facade-details','pedestrian','tree-contact','tree-pit'].includes(name)?3.5:1;
        reference.updateProjectionMatrix();
        if(['street','tree-pit','tree-contact'].includes(name)){reference.position.set(0,9,4);reference.lookAt(0,0,0);}
        else{reference.position.set(2,look+1.5,14);reference.lookAt(0,look,0);}
        for(const hour of (name==='architecture'?['day','day-sky','night']:['day'])){
          night.value=hour==='night'?1:0;
          scene.environment=hour==='day-sky'?skyGL.texture:null;mesh.material=source;gl.render(scene,reference);
          const a=new Uint8Array(W*H*4);gl.readRenderTargetPixels(glTarget,0,0,W,H,a);
          scene.environment=hour==='day-sky'?skyGPU.texture:null;mesh.material=node;renderer.render(scene,reference);
          const b=await renderer.readRenderTargetPixelsAsync(gpuTarget,0,0,W,H);
          let n=0,absolute=0,xx=0,yy=0,xy=0,sx=0,sy=0,ma=0,mb=0;
          for(let y=0;y<H;y++)for(let x=0;x<W;x++){
            const i=(y*W+x)*4,j=((H-1-y)*W+x)*4;
            if([0,1,2].every(k=>a[j+k]===a[k]&&b[i+k]===b[k]))continue;
            for(let k=0;k<3;k++){
              const left=a[j+k],right=b[i+k];n++;absolute+=Math.abs(left-right);
              xx+=left*left;yy+=right*right;xy+=left*right;sx+=left;sy+=right;ma=Math.max(ma,left);mb=Math.max(mb,right);
            }
          }
          const delta=absolute/n,corr=(xy-sx*sy/n)/Math.sqrt((xx-sx*sx/n)*(yy-sy*sy/n));
          results[name+'-'+hour]={pixels:n/3,mae:+delta.toFixed(2),correlation:+corr.toFixed(4),maxima:[ma,mb]};
        }
      }
      // Reproduce arrival and release of two independent atlas masks. A
      // newly streamed mesh can clone a cached sampler after its old map was disposed.
      const N=await import('three/tsl'),{boundTexture}=await import('./js/territory-node-photography.js');
      const slots=[{value:null},{value:null}],maps=slots.map(s=>boundTexture(s));
      const atlas=new G.MeshBasicNodeMaterial(),sample=n=>n.sample(N.vec2(.5,.5)).level(0);
      atlas.colorNode=N.vec3(sample(maps[0]).r,sample(maps[1]).g,0);
      function tex(red,green){
        const t=new G.DataTexture(new Uint8Array([red,green,0,255]),1,1,G.RGBAFormat);
        t.minFilter=t.magFilter=G.LinearFilter;t.needsUpdate=true;return t;
      }
      const scene2=new G.Scene(),cam2=new G.OrthographicCamera(-1,1,1,-1,.1,20);cam2.position.z=3;
      const first=new G.Mesh(new G.PlaneGeometry(2,2),atlas);scene2.add(first);
      async function readSlots(){
        renderer.render(scene2,cam2);
        return [...(await renderer.readRenderTargetPixelsAsync(gpuTarget,96,64,1,1)).slice(0,2)];
      }
      const blank=await readSlots();slots[0].value=tex(220,10);slots[1].value=tex(33,75);
      const loaded=await readSlots(),old=slots[0].value;slots[0].value=tex(40,10);old.dispose();
      scene2.remove(first);scene2.add(new G.Mesh(first.geometry,atlas));
      const replaced=await readSlots(),other=slots[1].value;slots[1].value=null;other.dispose();
      const cleared=await readSlots(),slotChanges={blank,loaded,replaced,cleared};
      // View the shadow on the paving without drawing the canopy itself.
      const shadowScene=new G.Scene(),floor=new G.Mesh(new G.PlaneGeometry(12,12).rotateX(-Math.PI/2),new G.MeshStandardMaterial({color:0xffffff}));
      floor.receiveShadow=true;shadowScene.add(floor);
      const caster=checks.find(row=>row.name==='crown'),tree=caster.mesh;
      tree.position.set(0,0,0);tree.visible=true;tree.castShadow=true;tree.customDepthMaterial=trees.crownDepth;
      caster.source.colorWrite=caster.node.colorWrite=false;caster.source.depthWrite=caster.node.depthWrite=false;shadowScene.add(tree);
      const lamp=new G.DirectionalLight(0xffffff,2);lamp.castShadow=true;lamp.position.set(5,8,4);
      lamp.shadow.mapSize.set(256,256);shadowScene.add(lamp,new G.AmbientLight(0xffffff,.4));
      const shadowEye=new G.OrthographicCamera(-4,4,4,-4,.1,50);shadowEye.position.y=12;shadowEye.up.set(0,0,-1);shadowEye.lookAt(0,0,0);
      const leafShadows={};
      for(const gpu of [false,true]){
        const r=gpu?renderer:gl,t=gpu?gpuTarget:glTarget;r.shadowMap.enabled=true;r.shadowMap.type=G.BasicShadowMap;
        tree.material=gpu?caster.node:caster.source;r.setRenderTarget(t);r.render(shadowScene,shadowEye);
        // r180 sets up the native shadow target in the first material build.
        await new Promise(done=>requestAnimationFrame(done));r.render(shadowScene,shadowEye);
        let color;if(gpu)color=await r.readRenderTargetPixelsAsync(t,0,0,W,H);
        else{color=new Uint8Array(W*H*4);r.readRenderTargetPixels(t,0,0,W,H,color);}
        let background=0;for(let i=0;i<color.length;i+=4)background=Math.max(background,color[i]);let dark=0;for(let i=0;i<color.length;i+=4)if(color[i]+30<background)dark++;
        leafShadows[gpu?'webgpu':'webgl2']=dark;
      }
      const validation=await device.popErrorScope();skyGL.dispose();skyGPU.dispose();glProbe.dispose();gpuProbe.dispose();
      glTarget.dispose();gpuTarget.dispose();target.dispose();gl.dispose();renderer.dispose();
      return {adapter:device.adapterInfo?.description||device.adapterInfo?.architecture||null,materials:kinds,calls,
        uniqueColors:shades.size,comparison:results,slotChanges,leafShadows,uncaptured,validation:validation?.message||null};
    }""")
    result['consoleErrors']=errors
    result['warnings']=warnings
    print(json.dumps(result, ensure_ascii=True),flush=True)
    if args.out:
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    browser.close()
    assert not errors and not result['validation'] and not result['uncaptured'] and result['uniqueColors']>80 and result['calls']>=9,result
    assert all(row['pixels']>900 and row['mae']<3 and row['correlation']>.99 for row in result['comparison'].values()),result
    assert result['slotChanges']==dict(blank=[128,128],loaded=[220,75],replaced=[40,75],cleared=[40,128]),result
    assert min(result['leafShadows'].values())>150,result
