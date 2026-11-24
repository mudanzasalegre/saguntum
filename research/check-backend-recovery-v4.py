"""Exercise renderer selection and recovery through the full simulator in Chrome.

Capability rejections, an invalid WGSL probe and an unmigrated future
material are injected fixtures. Device/context losses use the actual APIs.
"""
import argparse
import json
import math
from pathlib import Path

from playwright.sync_api import sync_playwright


GLORIETA = 'glorieta/glorieta-romeu'
GERENCIA = 'gerencia/gerencia-oficinas'
CASINO = 'casino/casino-salon'
HORNO = 'horno/horno-acceso'
MAX_WAIT = 50000
HOOKS = """(() => {
  if (!/^https?:/.test(location.protocol)) return;
  const read=k=>JSON.parse(sessionStorage.getItem(k)||'null');
  const put=(k,v)=>sessionStorage.setItem(k,JSON.stringify(v));
  const interrupted=read('qa-unflushed-start');
  if(interrupted){put('saguntum-render-start-v1',interrupted);sessionStorage.removeItem('qa-unflushed-start');}
  const opt=read('qa-fault') || {};
  const documents=read('qa-documents')||[];
  const documentNumber=documents.length;
  documents.push(location.pathname+location.search+location.hash);put('qa-documents',documents);
  window.qa={device:null,contexts:[],events:[]};
  const event=(type)=>{
    const ev=read('qa-graphics')||[];
    ev.push([documentNumber,type]);put('qa-graphics',ev);qa.events.push(type);
  };
  const report=console.error;
  console.error=function(...args){
    const errors=args.filter(x=>x instanceof Error).map(x=>String(x.stack||x).slice(0,1700));
    if(errors.length)put('qa-render-errors',[...(read('qa-render-errors')||[]),...errors].slice(-3));
    return report.apply(console,args);
  };
  if(!localStorage.getItem('saguntum-renderer-v4') && START_ENGINE)
    localStorage.setItem('saguntum-renderer-v4',START_ENGINE);
  if(opt.adapter==='absent')Object.defineProperty(navigator,'gpu',{value:undefined});
  if(navigator.gpu){
    const get=GPU.prototype.requestAdapter;
    GPU.prototype.requestAdapter=function(...args){
      event('requestAdapter');
      if(opt.adapter==='null')return Promise.resolve(null);
      if(opt.adapter==='reject')return Promise.reject(Error('QA: adaptador rechazado'));
      if(opt.adapter==='pending')return new Promise(()=>{});
      return get.apply(this,args);
    };
    const open=GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice=async function(...args){
      event('requestDevice');
      if(opt.device==='reject')throw Error('QA: inicialización rechazada');
      const device=await open.apply(this,args);qa.device=device;event('device');
      device.lost.then(info=>event('device.lost:'+info.reason));return device;
    };
    if(opt.shader==='invalid'){
      const compile=GPUDevice.prototype.createShaderModule;
      GPUDevice.prototype.createShaderModule=function(desc){
        GPUDevice.prototype.createShaderModule=compile;event('WGSL:inválido');
        return compile.call(this,{...desc,code:'QA_invalid_probe : ;'});
      };
    }
    if(opt.device==='lose-in-probe'){
      const compile=GPUDevice.prototype.createShaderModule;
      GPUDevice.prototype.createShaderModule=function(desc){
        GPUDevice.prototype.createShaderModule=compile;
        const module=compile.call(this,desc);event('destroy:sonda');this.destroy();return module;
      };
    }
  }
  const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
    const t=type.toLowerCase();
    if(t.includes('webgl') && opt.webgl==='absent'){event('webgl2:denegado');return null;}
    const ctx=get.call(this,type,...args);
    if(ctx && (t.includes('webgl')||t==='webgpu') && !qa.contexts.includes(ctx)){
      event(type);qa.contexts.push(ctx);
    }
    return ctx;
  };
})();"""
SNAPSHOT = """() => {
 const s=window.territoryStatus||{},get=id=>document.querySelector('#sim-'+id);
 return {engine:s.graphics?.active || (s.mode==='mapa 2D'?'2d':null),
   selected:s.selected,stop:s.stop,visit:get('visit')?.getAttribute('href'),hash:location.hash,
   mode:s.mode,requested:localStorage.getItem('saguntum-renderer-v4') || 'auto',
   reason:s.graphics?.fallbackReason||sessionStorage.getItem('saguntum-renderer-failure-v4')||null,
   ui:get('engine-info')?.textContent,diagnostic:get('gpu-result')?.textContent,
   navigation:s.navigation&&{eye:s.navigation.eye,target:s.navigation.target,mode:s.navigation.mode,
     yaw:s.navigation.yaw,pitch:s.navigation.pitch,fov:s.navigation.fov},
   saved:JSON.parse(sessionStorage.getItem('saguntum-territorial-visit')||'null'),
   state:{light:get('light')?.value,terrain:get('terrain')?.value,date:s.solarDate,hour:s.hour,
     quality:get('quality')?.value,jets:get('jets')?.checked,labels:document.querySelector('[data-flag="labels"]')?.checked,
     minimap:!get('map-box')?.hidden},
   documents:JSON.parse(sessionStorage.getItem('qa-documents')||'[]'),
   events:JSON.parse(sessionStorage.getItem('qa-graphics')||'[]'),
   renderErrors:JSON.parse(sessionStorage.getItem('qa-render-errors')||'[]')};
}"""


class Session:
    def __init__(self, browser, base, stop, engine=None, fault=None):
        self.base=base
        self.context=browser.new_context(viewport={'width':860,'height':560},device_scale_factor=1)
        self.context.add_init_script(HOOKS.replace('START_ENGINE',json.dumps(engine)))
        self.page=self.context.new_page()
        self.page.set_default_timeout(10000)
        self.errors=[]
        self.page.on('pageerror',lambda err:self.errors.append(str(err)[:500]))
        # Set up faults on an inert same-origin page. Count only real simulator boots.
        self.page.route('**/__qa_recovery',lambda route:route.fulfill(content_type='text/html',body='<title>QA</title>'))
        self.page.goto(base+'__qa_recovery')
        self.page.evaluate("f=>{sessionStorage.removeItem('qa-documents');sessionStorage.removeItem('qa-graphics');sessionStorage.setItem('qa-fault',JSON.stringify(f));}",fault or {})
        self.go(stop)

    def go(self,stop):
        self.page.goto(self.base+'#simulador/'+stop,wait_until='domcontentloaded')

    def fault(self,value=None):
        self.page.evaluate("v=>sessionStorage.setItem('qa-fault',JSON.stringify(v))",value or {})

    def snapshot(self):
        return self.page.evaluate(SNAPSHOT)

    def ready(self,engine,stop):
        self.page.wait_for_function("""([engine,stop])=>{
          const s=window.territoryStatus,diag=document.querySelector('#sim-engine-info');
          if(!s?.ready||s.stop!==stop.split('/')[1]||!diag)return false;
          if(engine==='2d')return s.mode==='mapa 2D';
          const failed=engine==='webgpu'&&s.graphics?.active==='webgl2'&&s.graphics?.fallbackReason;
          return failed||s.graphics?.active===engine && !!s.camera && s.heritage?.loaded?.includes(stop.split('/')[0]);
        }""",arg=[engine,stop],timeout=MAX_WAIT)
        data=self.snapshot()
        assert data['engine']==engine and data['visit']=='#'+stop, (engine,stop,data['engine'],data['reason'],data['visit'])
        assert 'Plano 2D' in data['ui'] if engine=='2d' else ('WebGPU' if engine=='webgpu' else 'WebGL 2') in data['ui']
        return data

    def settings(self):
        if not self.page.locator('#sim-settings').is_visible():
            self.page.locator('#sim-settings-open').click()

    def select_engine(self,engine):
        self.settings()
        self.page.locator('#sim-engine').select_option(engine)

    def retry_gpu(self):
        self.settings()
        box=self.page.locator('details',has=self.page.locator('#sim-engine-retry'))
        if not box.evaluate('x=>x.open'):box.locator('summary').click()
        self.page.locator('#sim-engine-retry').click()

    def configure(self):
        self.settings()
        # Dispatch on the real controls. Applying the session fixture in one UI
        # turn avoids compiling unused intermediate solar dates and times.
        self.page.evaluate("""()=>{
          const set=(id,value,event='change')=>{
            const el=document.querySelector('#sim-'+id);el.value=value;
            el.dispatchEvent(new Event(event,{bubbles:true}));
          };
          set('quality','0');set('date','2025-06-21');set('time','14.25','input');
          set('light','day');set('terrain','photo');
          for(const selector of ['#sim-jets','[data-flag="labels"]']){
            const el=document.querySelector(selector);if(el.checked)el.click();
          }
        }""")
        self.page.locator('#sim-settings [data-close]').click()
        # The actual orbit controller changes the eye while keeping the selected stop.
        self.page.mouse.move(448,269);self.page.mouse.wheel(0,-240)
        self.page.wait_for_timeout(900)


def state_diff(before,after):
    assert before['state']==after['state'],(before['state'],after['state'])
    assert before['hash']==after['hash'] and before['visit']==after['visit']
    a,b=before['navigation'],after['navigation']
    errors={k:round(math.dist(a[k],b[k]),5) for k in ('eye','target')}
    errors.update({k:round(abs(a[k]-b[k]),5) for k in ('fov','yaw','pitch')})
    assert a['mode']==b['mode'] and max(errors.values())<.16,errors
    return {'cameraDelta':errors,'visit':before['visit'],'state':after['state']}


def boot_count(s,count):
    snap=s.snapshot()
    assert len(snap['documents'])==count,snap['documents']
    for i in range(count):
        events=[v for n,v in snap['events'] if n==i]
        assert events.count('device')<=1 and events.count('webgl2')<=1,events
    return {'documents':snap['documents'],'graphicsEvents':snap['events']}


def automatic(s,stop):
    s.page.wait_for_function("()=>window.territoryStatus?.camera && territoryStatus.graphics.requested==='auto'",timeout=MAX_WAIT)
    engine=s.snapshot()['engine']
    assert engine in ('webgpu','webgl2'),engine
    return s.ready(engine,stop)


def selector(s):
    start=automatic(s,GLORIETA)
    assert s.page.locator('#sim-engine').input_value()=='auto'
    first_gl=0
    if start['engine']=='webgpu':
        s.select_engine('webgl2')
        start=s.ready('webgl2',GLORIETA)
        first_gl=1
    s.configure();a=s.snapshot()
    assert math.dist(start['navigation']['eye'],a['navigation']['eye'])>.1,'camera must actually move'
    s.select_engine('webgpu')
    b=s.ready('webgpu',GLORIETA)
    one=state_diff(a,b)
    assert b['requested']=='webgpu' and s.page.locator('#sim-engine').input_value()=='webgpu'
    assert b['events'].count([first_gl+1,'device'])==1
    # Visit another point without reloading, then exercise explicit GL and Auto.
    s.page.evaluate("s=>{location.hash='#simulador/'+s}",GERENCIA)
    s.ready('webgpu',GERENCIA);s.configure()
    s.page.locator('[data-mode="fly"]').click()
    c=s.snapshot()
    assert c['navigation']['mode']=='fly'
    s.select_engine('webgl2')
    d=s.ready('webgl2',GERENCIA);two=state_diff(c,d)
    assert d['requested']=='webgl2' and [first_gl+2,'requestAdapter'] not in d['events']
    s.select_engine('auto');e=automatic(s,GERENCIA)
    assert e['requested']=='auto'
    return {'glorieta':one,'gerencia':two,'modoGerencia':c['navigation']['mode'],'automático':e['ui'],**boot_count(s,first_gl+4)}


def device_loss(s):
    s.ready('webgpu',GLORIETA);s.configure();before=s.snapshot()
    s.page.evaluate("()=>{if(!qa.device)throw Error('Missing live GPUDevice');qa.device.destroy()}")
    after=s.ready('webgl2',GLORIETA)
    assert after['reason'] and [0,'device.lost:destroyed'] in after['events'],after
    state=state_diff(before,after)
    # A failed WebGPU session stays on WebGL across ordinary reloads.
    # Preserve the observed state before deliberately reloading without a UI save.
    s.page.reload(wait_until='domcontentloaded');cold=s.ready('webgl2',GLORIETA)
    assert [2,'requestAdapter'] not in cold['events'] and cold['reason']==after['reason']
    # A new tab shares the selected backend but owns a separate session/quarantine.
    sibling=s.context.new_page()
    try:
        sibling.goto(s.base+'#simulador/'+HORNO,wait_until='domcontentloaded')
        sibling.wait_for_function("()=>window.territoryStatus?.camera && territoryStatus.stop==='horno-acceso'",timeout=MAX_WAIT)
        fresh=sibling.evaluate(SNAPSHOT)
        assert fresh['requested']=='webgpu' and fresh['engine']=='webgpu' and not fresh['reason'],fresh
        assert s.snapshot()['engine']=='webgl2'
    finally:
        sibling.close()
    s.retry_gpu();restored=s.ready('webgpu',GLORIETA)
    assert not restored['reason']
    return {'fault':'GPUDevice.destroy()','fallbackReason':after['reason'],'restoration':state,
            'newTab':{'requested':fresh['requested'],'active':fresh['engine'],'stop':fresh['stop']},**boot_count(s,4)}


def init_failure(s,expected):
    a=s.ready('webgl2',HORNO)
    assert expected.lower() in a['reason'].lower() and a['requested']=='webgpu',a
    assert s.page.locator('#sim-engine').input_value()=='webgpu'
    return {'fallbackReason':a['reason'],'place':a['visit'],**boot_count(s,1)}


def probe_failure(s):
    a=s.ready('webgl2',HORNO)
    assert a['reason'] and [0,'WGSL:inválido'] in a['events'] and [0,'webgl2'] in a['events'],a
    assert [0,'device.lost:destroyed'] in a['events'],a['events']
    return {'fault':'Fuente WGSL inválida en la sonda de producción','fallbackReason':a['reason'],
            **boot_count(s,1)}


def early_loss(s):
    s.page.wait_for_function("""()=>{const t=window.territoryStatus;return t?.ready&&
        (t.mode==='mapa 2D'||!!t.camera)}""",timeout=MAX_WAIT)
    outcome=s.snapshot()
    assert outcome['engine']=='webgl2',('La pérdida durante la sonda debe intentar WebGL 2',outcome['engine'],outcome['documents'])
    assert outcome['reason'] and [0,'destroy:sonda'] in outcome['events']
    return {'fault':'GPUDevice.destroy() durante la primera compilación','place':outcome['visit'],
            'fallbackReason':outcome['reason'],**boot_count(s,len(outcome['documents']))}


def interrupted_start(s):
    # WebKit can lose its content process without executing pagehide. Carry the
    # exact live in-flight marker across a normal test reload to model that state.
    page=s.page
    page.wait_for_function("window.qa?.events.includes('requestAdapter')")
    marker=page.evaluate("JSON.parse(sessionStorage.getItem('saguntum-render-start-v1'))")
    assert marker.get('backend')=='webgpu',marker
    s.fault()
    page.evaluate("m=>sessionStorage.setItem('qa-unflushed-start',JSON.stringify(m))",marker)
    page.reload(wait_until='domcontentloaded')
    recovered=s.ready('webgl2',HORNO)
    assert [1,'requestAdapter'] not in recovered['events'] and 'interrump' in recovered['reason']
    return {'fault':'Interrupción simulada durante requestAdapter, conservando el marcador real de arranque',
            'place':recovered['visit'],'fallbackReason':recovered['reason'],**boot_count(s,2)}


def add_unsupported(s):
    # Insert one future, unmigrated GLSL material into the real territorial scene.
    # Both the render manager and its recovery are unchanged production modules.
    s.page.evaluate("""async()=>{
      const T=await import('three'), original=T.Scene.prototype.traverseVisible;
      const material=new T.ShaderMaterial();material.name='QA GLSL sin equivalencia TSL';
      const sample=new T.Mesh(new T.BoxGeometry(),material);
      T.Scene.prototype.traverseVisible=function(fn){
        if(this.children.some(child=>child.isDirectionalLight)){
          T.Scene.prototype.traverseVisible=original;this.add(sample);
        }
        return original.call(this,fn);
      };
    }""")


def bad_shader(s):
    s.ready('webgpu',CASINO);s.configure();before=s.snapshot()
    add_unsupported(s);after=s.ready('webgl2',CASINO)
    assert 'QA GLSL' in after['reason'],after['reason']
    return {'fault':'ShaderMaterial de prueba sin variante TSL','fallbackReason':after['reason'],
            'restoration':state_diff(before,after),**boot_count(s,2)}


def map_and_retry(s):
    s.ready('webgpu',GLORIETA);s.configure();before=s.snapshot()
    s.fault({'webgl':'absent'})
    s.page.evaluate("()=>qa.device.destroy()")
    plan=s.ready('2d',GLORIETA)
    assert s.page.locator('#sim-map').is_visible() and s.page.locator('#sim-retry').is_visible()
    assert [1,'webgl2:denegado'] in plan['events'] and [1,'device'] not in plan['events']
    assert math.dist(plan['saved']['camera']['eye'],before['navigation']['eye'])<.16
    s.fault({'device':'reject'});s.page.locator('#sim-retry').click();gl=s.ready('webgl2',GLORIETA)
    restored=state_diff(before,gl)
    s.fault();s.retry_gpu();native=s.ready('webgpu',GLORIETA)
    assert not native['reason']
    return {'fallbackReason':plan['reason'],'mapStop':plan['visit'],'restoration':restored,**boot_count(s,4)}


def gl_loss(s):
    s.ready('webgl2',HORNO);s.configure();before=s.snapshot()
    s.page.evaluate("""()=>qa.contexts.find(c=>c instanceof WebGL2RenderingContext)
                         .getExtension('WEBGL_lose_context').loseContext()""")
    plan=s.ready('2d',HORNO)
    assert '?vista=plano' in s.page.url and not any(n==1 for n,_ in plan['events'])
    s.page.locator('#sim-retry').click();restored=s.ready('webgl2',HORNO)
    return {'fault':'WEBGL_lose_context','mapStop':plan['visit'],'restoration':state_diff(before,restored),
            **boot_count(s,3)}


def only_gpu_returns(s):
    first=s.ready('2d',HORNO)
    assert s.page.locator('#sim-retry').is_visible()
    s.fault({'webgl':'absent'})
    s.page.locator('#sim-retry').click()
    s.page.wait_for_function("""()=>JSON.parse(sessionStorage.getItem('qa-documents')).length===2
      && window.territoryStatus?.ready""",timeout=MAX_WAIT)
    trial=s.snapshot()
    assert [1,'requestAdapter'] in trial['events'],('El reintento en plano omitió el motor elegido',trial['events'])
    restored=s.ready('webgpu',HORNO)
    return {'initialReason':first['reason'],'mapStop':first['visit'],'restored':restored['ui'],**boot_count(s,2)}


CASES={
  'selector':(GLORIETA,None,{},selector),
  'dispositivoPerdido':(GLORIETA,'webgpu',{},device_loss),
  'apiAusente':(HORNO,'webgpu',{'adapter':'absent'},lambda s:init_failure(s,'soporte')),
  'sinAdaptador':(HORNO,'webgpu',{'adapter':'null'},lambda s:init_failure(s,'adaptador')),
  'adaptadorRechazado':(HORNO,'webgpu',{'adapter':'reject'},lambda s:init_failure(s,'adaptador rechazado')),
  'dispositivoRechazado':(HORNO,'webgpu',{'device':'reject'},lambda s:init_failure(s,'inicialización rechazada')),
  'compilaciónRechazada':(HORNO,'webgpu',{'shader':'invalid'},probe_failure),
  'pérdidaDuranteSonda':(HORNO,'webgpu',{'device':'lose-in-probe'},early_loss),
  'arranqueInterrumpido':(HORNO,'webgpu',{'adapter':'pending'},interrupted_start),
  'materialIncompatible':(CASINO,'webgpu',{},bad_shader),
  'mapaYReintento':(GLORIETA,'webgpu',{},map_and_retry),
  'contextoWebGLPerdido':(HORNO,'webgl2',{},gl_loss),
  'reintentoSoloWebGPU':(HORNO,'webgpu',{'adapter':'null','webgl':'absent'},only_gpu_returns),
}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',required=True)
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--cases',nargs='+',choices=CASES,default=list(CASES))
    args=parser.parse_args()
    args.out.parent.mkdir(parents=True,exist_ok=True)
    results={}
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome')
        for name in args.cases:
            stop,engine,fault,check=CASES[name]
            session=Session(browser,args.base.rstrip('/')+'/',stop,engine,fault)
            try:
                print(name,flush=True)
                results[name]={'ok':True,**check(session)}
                assert not session.errors,session.errors
            except Exception as exc:
                try:
                    data=session.snapshot()
                except Exception:
                    data={}
                results[name]={'ok':False,'error':str(exc)[:1600],'diagnostic':data,'pageerrors':session.errors}
                print(name,'FAILED',str(exc)[:220],flush=True)
            finally:
                session.context.close()
                args.out.write_text(json.dumps({'browser':browser.version,'cases':results},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        browser.close()
    raise SystemExit(int(any(not r['ok'] for r in results.values())))
