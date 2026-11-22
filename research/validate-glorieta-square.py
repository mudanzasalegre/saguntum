"""Control independiente del componente, con el Three.js y MDT de producción en Chromium."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--base',required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
html="""<!doctype html><meta charset=utf-8><style>*{margin:0}</style><script type=importmap>{"imports":{"three":"./assets/vendor/three.module.js","three/addons/utils/BufferGeometryUtils.js":"./assets/vendor/BufferGeometryUtils.js"}}</script>"""
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome')
    page=browser.new_page(viewport={'width':1100,'height':800})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/glorieta-qa',lambda route:route.fulfill(body=html,content_type='text/html'))
    page.goto(args.base.rstrip('/')+'/glorieta-qa')
    stats=page.evaluate("""async()=>{
      const T=await import('three'),{createGlorietaSquare}=await import('./js/glorieta-square.js'),{createHeightSampler}=await import('./js/terrain.js');
      const load=async name=>await (await fetch('./assets/data/'+name+'.json')).json();
      const layout=await load('glorieta-layout'), heightAt=createHeightSampler(await load('elevation'));
      const source=createGlorietaSquare({layout,heightAt}),scene=new T.Scene(),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
      scene.background=new T.Color('#c6d5d6');renderer.setSize(1100,800);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
      renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;document.body.append(renderer.domElement);
      const h=new T.HemisphereLight('#dbdbcf','#8a7c63',1.8),sun=new T.DirectionalLight('#ffe1af',3.8);
      sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{near:4,far:600,top:122,right:122,bottom:-122,left:-122});
      const v=new T.Vector3(),box=new T.Box3().setFromObject(source.group);box.getCenter(v);sun.position.copy(v).add(new T.Vector3(-165,185,30));sun.target.position.copy(v);scene.add(h,sun,sun.target,source.group);
      const cam=new T.PerspectiveCamera(38,1100/800,.1,700);function point(c){
        const x=(c[0]+.278)*111320*Math.cos(39.679*Math.PI/180),z=(39.679-c[1])*111320;return new T.Vector3(x,heightAt(x,z),z);}
      window.qaDraw=(id,night=false,active=true)=>{
        const tar=point(layout.anchors[id]);const offset={general:[60,175,106],fuente:[5,6.2,11],pergola:[12,7,9],juegos:[2,6,13],palmeras:[13,7,18],cafeteria:[-1,5,22]}[id];
        cam.position.copy(tar).add(new T.Vector3(...offset));cam.lookAt(tar.clone().add(new T.Vector3(0,id==='general'?0:1,0)));
        source.setNight(night);source.setWater(active);source.update(1.35);sun.intensity=night?.13:3.8;h.intensity=night?.42:1.8;
        renderer.render(scene,cam);return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,error:renderer.getContext().getError()};
      };return {bounds:box.getSize(new T.Vector3()).toArray(),trees:layout.trees.length};}""")
    report={'fixture':'Componente aislado con el MDT del Atlas; WebGL real','stats':stats,'frames':{}}
    for name in ['general','fuente','juegos','pergola','palmeras','cafeteria']:
        report['frames'][name]=page.evaluate('id=>qaDraw(id)',name)
        page.screenshot(path=args.out/(name+'.jpg'),quality=85)
    report['frames']['sin-chorros']=page.evaluate("qaDraw('fuente',false,false)")
    report['frames']['nocturna']=page.evaluate("qaDraw('cafeteria',true)")
    page.screenshot(path=args.out/'noche.jpg',quality=82)
    assert not errors and all(x['error']==0 for x in report['frames'].values())
    assert report['frames']['sin-chorros']['triangles']<report['frames']['fuente']['triangles']
    (args.out/'componentes.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    browser.close();print(report)
