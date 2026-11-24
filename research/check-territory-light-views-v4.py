"""Compare the actual photometry and pixels of three Atlas stops in the simulator."""
import argparse
import io
import json
import math
from pathlib import Path
from urllib.parse import urlparse

import numpy as np
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright


VIEWS=[
    ('Casino · salón','casino/casino-salon','golden'),
    ('Glorieta · noche','glorieta/glorieta-romeu','night'),
    ('Pantalán · trípodes','pantalan-maritimo/pantalan-maritimo-tripodes','day'),
]
OBSERVE="""(()=>{
  window.qaLights={};window.__THREE_DEVTOOLS__=new EventTarget();
  __THREE_DEVTOOLS__.addEventListener('observe',e=>{
    const r=e.detail;if(!r.isWebGLRenderer&&!r.isWebGPURenderer)return;
    const draw=r.render;let nesting=0;
    r.render=function(scene,camera){
      if(nesting===0&&scene.fog&&camera.isPerspectiveCamera){
        Object.assign(qaLights,{r,scene,camera});
      }
      nesting++;
      try{return draw.apply(r,arguments);}finally{nesting--;}
    };
  });
})()"""
READ="""()=>{
  const {r,scene,camera}=qaLights,active=[];let pointSlots=0;
  scene.traverseVisible(o=>{
    if(!o.isPointLight||!camera.layers.test(o.layers))return;
    pointSlots++;if(!o.intensity)return;
    active.push({position:o.matrixWorld.elements.slice(12,15).map(v=>+v.toFixed(5)),rgb:o.color.toArray(),
      intensity:o.intensity,distance:o.distance,decay:o.decay});
  });
  active.sort((a,b)=>a.position[0]-b.position[0]||a.position[2]-b.position[2]);
  const sun=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);
  return {active,pointSlots,effectiveShadow:(r.shadowMap.enabled?sun.shadow.intensity:0),
    eye:territoryStatus.navigation.eye,look:territoryStatus.navigation.target,backend:territoryStatus.graphics.active,
    reused:territoryStatus.graphics?.streamPrograms?.reused??null};
}"""


def capture(browser,args,engine,reference):
    page=browser.new_page(viewport={'width':1000,'height':640},device_scale_factor=1,reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    state={'quality':'2','jets':False,'lightPreference':'golden','solarDate':'2026-06-21',
           'flags':{'cars':False,'people':False,'labels':False}}
    page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(engine)+");"+
                         "sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+");")
    page.add_init_script(OBSERVE)
    if reference:
        modules={name:(args.light_reference/name).read_bytes() for name in ('territory-atmosphere.js','territory-heritage.js')}
        for name in ('territory-atmosphere.js','territory-heritage.js'):
            page.route('**/js/'+name,lambda r:r.fulfill(body=modules[urlparse(r.request.url).path.rsplit('/',1)[-1]],content_type='text/javascript'))
    data={}
    for index,(label,route,light) in enumerate(VIEWS):
        if index==0:
            page.goto(args.base.rstrip('/')+'/#simulador/'+route,wait_until='domcontentloaded')
        else:
            page.evaluate("r=>location.hash='simulador/'+r",route)
        page.wait_for_function("id=>window.territoryStatus?.heritage?.visit?.stop===id && !territoryStatus.pending && !!qaLights.camera",
                               arg=route.split('/')[-1],timeout=75000)
        control='#sim-sun-preset' if light=='night' else '#sim-light'
        page.locator(control).evaluate("(e,v)=>{e.value=v;e.dispatchEvent(new Event('change'));}",light)
        if light=='night':
            page.wait_for_function("territoryStatus.heritage.lights>0 && territoryStatus.hour===23",timeout=18000)
        page.wait_for_timeout(2700)
        page.evaluate("delete qaLights.stable")
        page.wait_for_function("""()=>{
          const n=territoryStatus.navigation,p=[...n.eye,...n.target],t=performance.now(),old=qaLights.stable;
          if(!old||Math.hypot(...p.map((x,i)=>x-old.p[i]))>.005){qaLights.stable={p,t,frames:0};return false;}
          return ++old.frames>=8 && t-old.t>=350;
        }""",timeout=25000)
        img=Image.open(io.BytesIO(page.screenshot(style="body > :not(#sim-world){visibility:hidden!important}"))).convert('RGB')
        info=page.evaluate(READ)
        assert info['backend']==engine and not errors, (info,errors)
        data[label]=(img,info)
    page.close()
    return data


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--base',required=True);p.add_argument('--light-reference',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True);p.add_argument('--engines',nargs='+',default=['webgl2','webgpu'])
    args=p.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome')
        for engine in args.engines:
            a=capture(browser,args,engine,True);b=capture(browser,args,engine,False)
            rows={};sheet=Image.new('RGB',(1500,3*505),'#202724');pen=ImageDraw.Draw(sheet)
            for i,(label,_,_) in enumerate(VIEWS):
                before,old=a[label];after,new=b[label]
                diff=np.abs(np.asarray(before,dtype=float)-np.asarray(after,dtype=float))
                rows[label]={'reference':old,'current':new,'meanRGB':round(float(diff.mean()),3),
                             'p95RGB':float(np.quantile(diff,.95)),'maxRGB':int(diff.max()),
                             'changedPixels':int(np.count_nonzero(np.any(diff,axis=2))),
                             'eyeDistanceM':round(math.dist(old['eye'],new['eye']),4)}
                for j,(img,title) in enumerate([(before,'Referencia'),(after,'Luces estables')]):
                    sheet.paste(img.resize((750,480),Image.Resampling.LANCZOS),(j*750,i*505+25))
                    pen.text((j*750+8,i*505+6),f'{engine} / {label} / {title}',fill='white')
            sheet.save(args.out/('luces-visitas-'+engine+'.jpg'),quality=88)
            (args.out/('luces-visitas-'+engine+'.json')).write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
            print(engine,[(label,r['meanRGB'],r['eyeDistanceM'],len(r['current']['active'])) for label,r in rows.items()],flush=True)
            for label,r in rows.items():
                assert r['reference']['active']==r['current']['active'],(label,r)
                assert r['reference']['effectiveShadow']==r['current']['effectiveShadow'] and r['eyeDistanceM']<.1,(label,r)
        browser.close()
