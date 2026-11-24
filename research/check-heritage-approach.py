"""Measure the original heritage model and its real surroundings on an unselected approach."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright


def run(browser, base, mode, place, backend):
    context=browser.new_context(viewport={'width':920,'height':600},device_scale_factor=1)
    page=context.new_page()
    page.set_default_timeout(60000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)[:450]))
    page.on('console',lambda m:errors.append(m.text[:450]) if m.type=='error' else None)
    page.route('**/__approach_setup',lambda route:route.fulfill(content_type='text/html',body='<title>Preparación de cámara</title>'))
    try:
        page.goto(base+'/__approach_setup')
        # Restore only a starting camera through the ordinary handoff schema.
        # No selected place, destination, stop, warm data or preconstructed mesh.
        anchor=page.evaluate("""async ([mode,place,engine])=>{
          const {project}=await import('./js/territory-coordinates.js');
          const {loadHeritageCatalog}=await import('./js/territory-heritage-catalog.js');
          const {places}=await loadHeritageCatalog(project),p=places.find(p=>p.id===place);
          const ground=place==='glorieta'?50:4;
          const target=[p.x,ground,p.z];
          const eye=mode==='fly'?[p.x,ground+42,p.z+525]:[p.x,ground+430,p.z+350];
          const camera={mode,target,eye,yaw:0,pitch:0,fov:50,visitPose:false,targetLift:0};
          localStorage.setItem('saguntum-renderer-v4',engine);
          localStorage.setItem('saguntum-controls-v1',JSON.stringify({prefs:{flight:'city'}}));
          sessionStorage.setItem('saguntum-territorial-visit',JSON.stringify({
            camera,quality:'1',lightPreference:'day',terrain:'photo',flags:{labels:false}
          }));
          return [p.x,p.z];
        }""",[mode,place,backend])
        page.add_init_script("""document.addEventListener('DOMContentLoaded',async()=>{
          const T=await import('./assets/vendor/three.module.js');
          const add=T.Scene.prototype.add;
          T.Scene.prototype.add=function(...items){
            for(const obj of items)if(obj.name==='Patrimonio del atlas')window.qaHeritageRoot=obj;
            return add.apply(this,items);
          };
        },{once:true});""")
        page.goto(base+'/#simulador',wait_until='domcontentloaded')
        page.wait_for_function("()=>window.territoryStatus?.camera && window.qaHeritageRoot")
        page.evaluate("""([place,anchor])=>{
          const q=window.qaApproach={first:{},peakModels:0,peakWarm:0,gaps:0,frames:0};
          const start=performance.now();
          function sample(){
            const s=territoryStatus,h=s.heritage,n=s.navigation;
            const low=qaHeritageRoot.children.find(obj=>obj.name==='Silueta territorial · '+place);
            const has=h?.loaded.includes(place),native=h?.levels?.[place]==='patrimonial';
            const context=h?.contexts?.find(c=>c.id===place),a=s.approach;
            const point={ms:Math.round(performance.now()-start),eyeToAnchorM:Math.round(Math.hypot(n.eye[0]-anchor[0],n.eye[2]-anchor[1])),
              orbitRangeM:n.mode==='orbit'?Math.round(Math.hypot(...n.eye.map((v,i)=>v-n.target[i]))):null};
            function first(key,extra={}){if(!q.first[key])q.first[key]={...point,...extra};}
            first('initial',{mode:n.mode,silhouette:low?low.visible:null,requested:s.selected||null});
            if(s.aerial?.parts>0)first('cadastralSkyline',{parts:s.aerial.parts});
            if(a?.id===place){
              first('approach',{distanceM:a.distanceM,projectedM:a.projectedM,level:a.level});
              if(a.level==='patrimonial')first('nativeForecast',{distanceM:a.distanceM,projectedM:a.projectedM,rangeM:a.rangeM,projectedRangeM:a.projectedRangeM});
              if(a.buildings&&a.streets)first('citySectorsReady');
            }
            if(has)first('urbanModel');
            if(context)first('atlasSurroundings',{context});
            if(native)first('nativeModel',{lastPreparation:h.lastPreparation?.id===place?h.lastPreparation:null});
            if(low&&!low.visible&&!has)q.gaps++;
            q.peakModels=Math.max(q.peakModels,h?.loaded.length||0);q.peakWarm=Math.max(q.peakWarm,h?.warming||0);
            q.frames++;
            if(!q.done)requestAnimationFrame(sample);
          }
          sample();
        }""",[place,anchor])
        if mode=='fly':
            page.locator('#sim-world canvas').focus()
            page.keyboard.down('w')
            try:
                page.wait_for_function("p=>territoryStatus.navigation.eye[2]<p[1]+55",arg=anchor,timeout=85000)
            finally:
                page.keyboard.up('w')
        else:
            page.mouse.move(480,320)
            for _ in range(40):
                page.mouse.wheel(0,-80)
                page.wait_for_timeout(150)
                if page.evaluate("territoryStatus.range<75"):break
        page.wait_for_function("()=>qaApproach.first.nativeModel && qaApproach.first.atlasSurroundings",timeout=60000)
        data=page.evaluate("""()=>{const q=qaApproach;q.done=true;return {
          ...q,backend:territoryStatus.graphics.active,selected:territoryStatus.selected||null,
          activeStop:territoryStatus.stop||null,failures:territoryStatus.heritage.failures
        }}""")
        data['errors']=errors
        assert data['selected'] is None and data['activeStop'] is None and data['backend']==backend,data
        if place=='horno':
            assert data['first']['initial']['silhouette'] is True,data
        else:
            assert 'cadastralSkyline' in data['first'],data
        assert not data['gaps'] and not data['failures'] and not errors,data
        assert data['peakModels']<=2 and data['peakWarm']<=2,data
        assert 'approach' in data['first'] and 'citySectorsReady' in data['first'],data
        return data
    except Exception:
        print('Estado en el fallo',page.evaluate("()=>({sample:window.qaApproach,route:location.hash,status:window.territoryStatus?.heritage,camera:window.territoryStatus?.navigation,approach:window.territoryStatus?.approach})"),errors,flush=True)
        raise
    finally:
        context.close()


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--base',required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--engine',choices=('webgl2','webgpu'),default='webgl2')
    p.add_argument('--cases',choices=('orbit','fly'),nargs='+',default=['orbit','fly'])
    args=p.parse_args()
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome')
        try:
            report={'browser':browser.version,'base':args.base,'quality':'Media','cases':{}}
            for mode in args.cases:
                place='glorieta' if mode=='orbit' else 'horno'
                report['cases'][mode]={'place':place,**run(browser,args.base.rstrip('/'),mode,place,args.engine)}
                print(mode,report['cases'][mode]['first'],flush=True)
        finally:
            browser.close()
    args.out.parent.mkdir(exist_ok=True,parents=True)
    args.out.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
