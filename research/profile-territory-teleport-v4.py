"""Profile a cold, real simulator teleport with V8 samples aligned to the longest frames."""
import argparse
import json
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright


def cpu_totals(profile):
    nodes={n['id']:n for n in profile['nodes']}
    parent={child:n['id'] for n in profile['nodes'] for child in n.get('children',[])}
    classes={}
    totals=defaultdict(float)
    for leaf,elapsed in zip(profile['samples'],profile['timeDeltas']):
        if leaf not in classes:
            frames=set()
            node=leaf
            while node in nodes:
                frames.add(nodes[node]['callFrame']['functionName'])
                node=parent.get(node)
            if '(idle)' in frames:category='idle'
            elif '(garbage collector)' in frames:category='garbageCollector'
            elif 'getProgramInfoLog' in frames:category='webGLProgramInfoLog'
            elif 'build' in frames and 'getForRender' in frames:category='nativeRenderNodeBuild'
            elif 'fromScene' in frames:category='sceneProbe'
            elif 'updatePacked' in frames:category='packedMaskUpdate'
            else:category='other'
            classes[leaf]=category
        totals[classes[leaf]]+=elapsed/1000
    return {k:round(v,1) for k,v in totals.items()}


def stacks_for_span(profile, nav_start, start_ms, stop_ms):
    nodes={n['id']:n for n in profile['nodes']}
    parent={child:n['id'] for n in profile['nodes'] for child in n.get('children',[])}
    exclusive,inclusive,stacks=defaultdict(float),defaultdict(float),defaultdict(float)
    at=(profile['startTime']-nav_start*1e6)/1000
    for node,elapsed in zip(profile['samples'],profile['timeDeltas']):
        end=at+elapsed/1000
        weight=max(0,min(stop_ms,end)-max(start_ms,at))
        at=end
        if weight<=0:
            continue
        labels=[]
        while node in nodes:
            frame=nodes[node]['callFrame']
            path=urlparse(frame.get('url','')).path.rsplit('/',1)[-1]
            fn=frame['functionName'] or '(anonymous)'
            label=(path+':'+str(frame['lineNumber']+1)+' '+fn) if path else fn
            if label!='(root)':
                labels.append(label)
            node=parent.get(node)
        if not labels:
            continue
        exclusive[labels[0]]+=weight
        for label in set(labels):
            inclusive[label]+=weight
        stacks[' ← '.join(labels[:8])]+=weight
    def top(values,size):
        return [dict(ms=round(v,1),frame=k) for k,v in sorted(values.items(),key=lambda i:-i[1])[:size]]
    return dict(exclusive=top(exclusive,8),inclusive=top(inclusive,7),stacks=top(stacks,7))


def run(pw,base,engine,target,out,raw,study,light_reference=None):
    browser=pw.chromium.launch(channel='chrome')
    page=browser.new_page(viewport={'width':1000,'height':640},device_scale_factor=1)
    page.set_default_timeout(70000)
    page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(engine)+")")
    cdp=page.context.new_cdp_session(page)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    if light_reference:
        reference={name:(light_reference/name).read_bytes() for name in ('territory-atmosphere.js','territory-heritage.js')}
        for module in ('territory-atmosphere.js','territory-heritage.js'):
            page.route('**/js/'+module,lambda r:r.fulfill(body=reference[urlparse(r.request.url).path.rsplit('/',1)[-1]],content_type='text/javascript'))
    if engine=='webgl2':
        page.add_init_script("""(()=>{
          window.coldProgramLinks=0;
          const original=WebGL2RenderingContext.prototype.linkProgram;
          WebGL2RenderingContext.prototype.linkProgram=function(program){
            window.coldProgramLinks++;return original.call(this,program);
          };
        })()""")
    if study:
        prototype=study=='warm'
        root=Path(__file__).resolve().parents[1]
        world=(root/'dist/js/territory.js').read_text(encoding='utf8')
        entry='else render(scene,camera,contact,tier);'
        assert world.count(entry)==1
        world=world.replace(entry,"""else {
          renderer.territoryProgramLighting=heritage.stats.loaded.join(',')+'/'+heritage.stats.lights;
          const presented=render(scene,camera,contact,tier);
          if(presented!==false)window.coldPresented?.(performance.now());
        }""")
        page.route('**/js/territory.js',lambda r:r.fulfill(body=world,content_type='text/javascript'))
        if prototype:
            contact=(root/'dist/js/territory-contact.js').read_text(encoding='utf8')
            entry='export function contactRenderer(renderer) {'
            contact="import {warmupGate} from './territory-webgl-warmup.js';\n"+contact.replace(entry,entry+
                "\n const gate=warmupGate(renderer); window.coldWarmStats=gate.stats;")
            for old,new in [('renderer.render(scene,camera);return;',
                'if(!gate.ready(scene,camera))return false;renderer.render(scene,camera);return;'),
                ('renderer.setRenderTarget(target);renderer.render(scene,camera);',
                'renderer.setRenderTarget(target);if(!gate.ready(scene,camera))return false;renderer.render(scene,camera);')]:
                assert contact.count(old)==1
                contact=contact.replace(old,new)
            page.route('**/js/territory-contact.js',lambda r:r.fulfill(body=contact,content_type='text/javascript'))
            page.route('**/js/territory-webgl-warmup.js',lambda r:r.fulfill(
                path=root/'research/prototypes/territory-webgl-warmup.js',content_type='text/javascript'))
    page.goto(base.rstrip('/')+'/#simulador',wait_until='domcontentloaded')
    page.wait_for_function("window.territoryStatus?.aerial?.complete && !territoryStatus.pending")
    assert page.evaluate('territoryStatus.graphics.active')==engine
    for key,value in [('quality','2'),('date','2026-06-21'),('sun-preset','noon')]:
        page.locator('#sim-'+key).evaluate("(el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}",value)
    page.locator('[data-mode="walk"]').click()
    page.wait_for_function("!territoryStatus.navigation.landing && territoryStatus.navigation.walk?.grounded")
    page.locator('[data-mode="fly"]').click()
    page.locator('#sim-world canvas').focus()
    page.keyboard.down('Space')
    try:
        page.wait_for_timeout(1400)
    finally:
        page.keyboard.up('Space')
    def open_picker():
        page.locator('#sim-search-open').click()
    def place(name):
        return page.locator('#sim-results').get_by_role('button',name=name,exact=True).first
    open_picker()
    place('Sagunto histórico').click()
    page.wait_for_function("territoryStatus.heritage.loaded.includes('museo') && !territoryStatus.pending")
    open_picker()
    dest=place(target)
    page.evaluate("""()=>{
      const gaps=[],tasks=[],presented=[],seen=new Map();let last=performance.now(),display=last,start=0,links=0,reused=0;
      window.coldPresented=now=>{presented.push([display,now]);display=now;};
      function tick(now){if(now>last)gaps.push([last,now]);last=now;
        const s=territoryStatus,h=s.heritage?.lastPreparation;
        if(h&&!seen.has(h.id))seen.set(h.id,{at:now,id:h.id,ms:h.ms});
        requestAnimationFrame(tick);
      }
      new PerformanceObserver(list=>{for(const e of list.getEntries())tasks.push([e.startTime,e.startTime+e.duration]);})
        .observe({type:'longtask',buffered:false});
      requestAnimationFrame(tick);
      window.coldRoute={mark(){start=performance.now();links=window.coldProgramLinks||0;reused=territoryStatus.graphics.streamPrograms?.reused||0;},read(){return {start,end:performance.now(),gaps,tasks,presented,gate:window.coldWarmStats,
        initialProgramLinks:links,programLinks:(window.coldProgramLinks||0)-links,
        streamedPrograms:{initiallyReused:reused,atEnd:territoryStatus.graphics.streamPrograms?.reused??null},
        preparations:[...seen.values()],loaded:territoryStatus.heritage.loaded,
        engine:territoryStatus.graphics.active,pending:territoryStatus.pending};}};
    }""")
    cdp.send('Performance.enable')
    metrics={m['name']:m['value'] for m in cdp.send('Performance.getMetrics')['metrics']}
    nav_start=metrics['NavigationStart']
    cdp.send('Profiler.enable')
    cdp.send('Profiler.setSamplingInterval',{'interval':1000})
    cdp.send('Profiler.start')
    dest.evaluate("el=>{window.coldRoute.mark();el.click();}")
    anchor='horno' if target=='Puerto de Sagunto' else 'grau-vell'
    page.wait_for_function("id=>territoryStatus.heritage.loaded.includes(id)",arg=anchor)
    page.wait_for_timeout(3500)
    p=cdp.send('Profiler.stop')['profile']
    data=page.evaluate('coldRoute.read()')
    if raw:
        raw.mkdir(parents=True,exist_ok=True)
        (raw/(engine+'.cpuprofile')).write_text(json.dumps(p),encoding='utf8')
    def spans(rows):
        valid=[(max(lo,data['start']),min(hi,data['end'])) for lo,hi in rows if hi>=data['start'] and lo<data['end']]
        return [dict(afterMs=round(lo-data['start'],1),durationMs=round(hi-lo,1),
                     **stacks_for_span(p,nav_start,lo,hi))
                for lo,hi in sorted(valid,key=lambda t:t[0]-t[1])[:4] if hi-lo>=30]
    report=dict(engine=engine,chrome=browser.version,fromPlace='Sagunto histórico',toPlace=target,
                viewport=[1000,640],samplingIntervalUs=1000,errors=errors,loaded=data['loaded'],
                elapsedMs=round(data['end']-data['start'],1),profileSampledMs=cpu_totals(p),maxFrames=spans(data['gaps']),
                longTasks=spans(data['tasks']),preparations=[dict(id=e['id'],ms=e['ms'],afterMs=round(e['at']-data['start'],1))
                    for e in data['preparations'] if e['at']>=data['start']])
    out.mkdir(parents=True,exist_ok=True)
    report['streamedPrograms']=data['streamedPrograms']
    if engine=='webgl2':
        report['initialProgramLinks']=data['initialProgramLinks']
        report['programLinksDuringTeleport']=data['programLinks']
    if study:
        gaps=[hi-max(data['start'],lo) for lo,hi in data['presented'] if data['start']<hi<=data['end']]
        report['presentedFrames']=len(gaps)
        report['maxPresentedGapMs']=round(max(gaps),1)
        report['holdInProgressAtEnd']=bool(data.get('gate') and data['gate'].get('waiting'))
        report['gate']=data.get('gate')
        page.evaluate("location.hash='#simulador/horno/horno-acceso'")
        page.wait_for_function("territoryStatus.heritage?.visit?.stop==='horno-acceso' && !territoryStatus.pending")
        page.wait_for_timeout(2300)
        report['pose']=page.evaluate('territoryStatus.camera')
        page.screenshot(path=out/'horno.png',style="body > :not(#sim-world){visibility:hidden!important}")
    (out/(engine+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(engine,[(x['durationMs'],x['exclusive'][0]) for x in report['maxFrames']],flush=True)
    browser.close()
    assert not errors and data['engine']==engine and report['maxFrames'],(data,errors)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',required=True)
    parser.add_argument('--engine',choices=['webgl2','webgpu'],required=True)
    parser.add_argument('--to',choices=['Puerto de Sagunto','Grau Vell'],default='Puerto de Sagunto')
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--raw',type=Path)
    parser.add_argument('--study',choices=['control','warm'])
    parser.add_argument('--light-reference',type=Path,help='Directorio con las versiones de referencia de los dos módulos de luces para una comparación A/B.')
    args=parser.parse_args()
    with sync_playwright() as pw:
        run(pw,args.base,args.engine,args.to,args.out,args.raw,args.study,args.light_reference)
