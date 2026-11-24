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


def run(pw,base,engine,target,out,raw):
    browser=pw.chromium.launch(channel='chrome')
    page=browser.new_page(viewport={'width':1000,'height':640},device_scale_factor=1)
    page.set_default_timeout(70000)
    page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(engine)+")")
    cdp=page.context.new_cdp_session(page)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
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
      const gaps=[],tasks=[],seen=new Map();let last=performance.now(),start=0;
      function tick(now){if(now>last)gaps.push([last,now]);last=now;
        const s=territoryStatus,h=s.heritage?.lastPreparation;
        if(h&&!seen.has(h.id))seen.set(h.id,{at:now,id:h.id,ms:h.ms});
        requestAnimationFrame(tick);
      }
      new PerformanceObserver(list=>{for(const e of list.getEntries())tasks.push([e.startTime,e.startTime+e.duration]);})
        .observe({type:'longtask',buffered:false});
      requestAnimationFrame(tick);
      window.coldRoute={mark(){start=performance.now();},read(){return {start,end:performance.now(),gaps,tasks,
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
    args=parser.parse_args()
    with sync_playwright() as pw:
        run(pw,args.base,args.engine,args.to,args.out,args.raw)
