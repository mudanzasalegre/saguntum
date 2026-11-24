"""Repeat the same public simulator controls in independent accelerated Chrome sessions."""
import argparse
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright


METER = """() => {
  const frames={}, samples=[], movement={};
  let stage='', last=0, previousSample=0;
  const origin=performance.now();
  function read(){
    const s=territoryStatus,n=s.navigation,f=s.fabric||{},p=s.photo||{};
    return {s:+((performance.now()-origin)/1000).toFixed(1),stage,
      eye:n.eye.map(v=>+v.toFixed(2)),mode:n.mode,yaw:+n.yaw.toFixed(3),
      geometries:s.geometries,textures:s.textures,heapMiB:s.heapMiB,triangles:s.triangles,drawCalls:s.drawCalls,
      buildingSectors:s.sectors,roadSectors:s.networkSectors,pending:s.pending,quality:s.quality,light:s.lighting,hour:s.hour,
      heritage:s.heritage?.loaded??[],heritageWarming:s.heritage?.warming??0,heritageWarmed:s.heritage?.warmed?.length??0,
      photoCells:p.cells?.length,photoSheets:p.sheetCount,facadeCount:f.cached,facadeBytes:f.bytes,
      facadeBudget:f.byteLimit,stagedFacadeBytes:f.stagedBytes,facadeEvictions:f.evictions,facadeBuilds:f.builds,
      contactBytes:s.graphics.contactStats?.estimatedTargetBytes??0,materialVariants:s.graphics.materials?.variants??null,
      reusedPrograms:s.graphics.streamPrograms?.reused??null,
      gpuRenderMS:s.graphics.gpu?.lastMs??null};
  }
  function tick(now){
    if(stage&&last){
      frames[stage].push(now-last);
      const n=territoryStatus.navigation,m=movement[stage];
      m.topSpeed=Math.max(m.topSpeed,n.speed);
      if(n.mode==='walk'&&n.walk&&!n.walk.grounded)m.airborne=true;
      const [x,y,z]=n.eye;
      m.travel+=Math.hypot(x-m.x,y-m.y,z-m.z);Object.assign(m,{x,y,z});
      m.maxY=Math.max(m.maxY,y);m.minY=Math.min(m.minY,y);
      if(now-previousSample>=1000){samples.push(read());previousSample=now;}
    }
    last=now;requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  window.routeMeasure={frames,samples,movement,read,start(name){
    stage=name;last=0;
    if(name){frames[name]=[];const [x,y,z]=territoryStatus.navigation.eye;
      movement[name]={topSpeed:0,airborne:false,x,y,z,travel:0,minY:y,maxY:y};}
  }};
}"""


def summary(values):
    if not values:
        return {'frames': 0}
    ordered=sorted(values)
    q=lambda p: round(ordered[math.ceil(len(ordered)*p)-1],2)
    return {'frames':len(values),'seconds':round(sum(values)/1000,2),'p50ms':q(.50),
            'p95ms':q(.95),'p99ms':q(.99),'maxMs':round(max(values),2),
            'over50ms':sum(x>50.1 for x in values),'over100ms':sum(x>100.1 for x in values),
            'over250ms':sum(x>250.1 for x in values)}


def save_report(path,data):
    pending=path.with_suffix(path.suffix+'.tmp')
    pending.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    pending.replace(path)


def territorial_flight(browser,base,engine):
    # Same camera as the v41 test above the actual Sagunto–Puerto corridor.
    camera={'mode':'fly','eye':[4800,460,0],'target':[5200,440,160],'yaw':-1.95,'pitch':-.02,'fov':65}
    state={'camera':camera,'quality':'2','lightPreference':'solar','hour':12,'solarDate':'2026-06-21'}
    page=browser.new_page(viewport={'width':1000,'height':640},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)[:450]))
    page.on('console',lambda m:errors.append(m.text[:450]) if m.type=='error' else None)
    page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(engine)+");"+
        "sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+")")
    page.goto(base.rstrip('/')+'/#simulador',wait_until='domcontentloaded')
    page.wait_for_function("window.territoryStatus?.aerial?.complete && territoryStatus.navigation.mode==='fly'",timeout=75000)
    assert page.evaluate('territoryStatus.graphics.active')==engine
    page.locator('#sim-flight').evaluate("el=>{el.value='territory';el.dispatchEvent(new Event('input'));}")
    page.locator('#sim-world canvas').focus()
    page.evaluate(METER)
    page.evaluate("routeMeasure.start('territorio')")
    page.keyboard.down('w');page.keyboard.down('ShiftLeft')
    try:page.wait_for_timeout(11500)
    finally:page.keyboard.up('ShiftLeft');page.keyboard.up('w')
    page.evaluate("routeMeasure.start('')")
    result=page.evaluate("""()=>({final:territoryStatus.navigation.eye,movement:routeMeasure.movement.territorio,
                              frames:routeMeasure.frames.territorio,samples:routeMeasure.samples})""")
    result['rAF']=summary(result.pop('frames'))
    result.update(initial=camera['eye'],distanceM=round(math.dist(camera['eye'],result['final']),1),errors=errors)
    assert result['distanceM']>2000 and result['movement']['topSpeed']>400 and not errors, result
    page.close()
    return result


def run(browser,base,engine,cycles,partial_path):
    page=browser.new_page(viewport={'width':1000,'height':640},device_scale_factor=1)
    page.set_default_timeout(35000)
    page.add_init_script("localStorage.setItem('saguntum-renderer-v4',"+json.dumps(engine)+")")
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)[:450]))
    page.on('console',lambda m:errors.append(m.text[:450]) if m.type=='error' else None)
    cdp=page.context.new_cdp_session(page)
    report={'engine':engine,'cycles':cycles,'checkpoints':[],'stops':[],'zonePositions':[]}
    began=time.monotonic()
    page.goto(base.rstrip('/')+'/#simulador',wait_until='domcontentloaded')
    def wait(js,arg=None):
        page.wait_for_function(js,arg=arg,timeout=75000)
    def settled_pose():
        page.evaluate("delete window.benchmarkStableCamera")
        wait("""()=>{
          const c=territoryStatus.navigation,now=performance.now(),p=[...c.eye,...c.target];
          const old=window.benchmarkStableCamera;
          if(!old||Math.hypot(...p.map((v,i)=>v-old.point[i]))>.005){
            window.benchmarkStableCamera={point:p,frames:0,since:now};return false;
          }
          return ++old.frames>=8 && now-old.since>=350;
        }""")
        return page.evaluate('territoryStatus.navigation')
    def stage(name):
        page.evaluate("name=>routeMeasure.start(name)",name)
    pause=page.wait_for_timeout
    def mode(name):
        page.locator('[data-mode="'+name+'"]').click()
        wait("m=>territoryStatus.navigation.mode===m",name)
    def zone(name):
        page.locator('#sim-search-open').click()
        page.locator('#sim-results').get_by_role('button',name=name,exact=True).first.click()
        report['zonePositions'].append({'zone':name,'eye':page.evaluate("territoryStatus.navigation.eye")})
    def stop(route):
        page.evaluate("r=>{location.hash='simulador/'+r}",route)
        wait("id=>territoryStatus.heritage?.visit?.stop===id&&!territoryStatus.heritage.loading",route.split('/')[-1])
        report['stops'].append(route)
    def control(name,value,event='change'):
        page.locator('#sim-'+name).evaluate("(el,[v,type])=>{el.value=v;el.dispatchEvent(new Event(type,{bubbles:true}));}",[value,event])
    def hold(key,duration,modifier=None):
        canvas=page.locator('#sim-world canvas')
        canvas.focus()
        if modifier:page.keyboard.down(modifier)
        try:
            page.keyboard.down(key)
            try:pause(duration)
            finally:page.keyboard.up(key)
        finally:
            if modifier:page.keyboard.up(modifier)
    def rotate():
        # Pick a visible part of the canvas outside all HUD controls.
        xy=page.evaluate("""()=>{for(const x of [.61,.51,.71,.41])for(const y of [.41,.55,.63]){
          const p=[Math.floor(innerWidth*x),Math.floor(innerHeight*y)];
          if(document.elementFromPoint(...p)?.matches('#sim-world canvas'))return p;}}""")
        page.mouse.click(*xy)
        wait("!!document.pointerLockElement")
        initial=page.evaluate("territoryStatus.navigation.yaw")
        for dx,dy in [(115,3),(-190,-8),(120,6)]:
            page.mouse.move(xy[0]+dx,xy[1]+dy,steps=4)
            pause(100)
        changed=page.evaluate("initial=>Math.abs(territoryStatus.navigation.yaw-initial)",initial)
        page.evaluate("document.exitPointerLock()")
        return changed
    def checkpoint(index):
        wait("territoryStatus.navigation.mode==='orbit' && territoryStatus.range>3000 && !territoryStatus.pending && territoryStatus.aerial?.complete")
        if index:
            origin=report['checkpoints'][0]['eye']
            wait("p=>Math.hypot(...territoryStatus.navigation.eye.map((v,i)=>v-p[i]))<.1",origin)
        pause(2000)
        # Exclude this collection and its first following frame from timings.
        stage('')
        cdp.send('HeapProfiler.collectGarbage')
        pause(300)
        point=page.evaluate("routeMeasure.read()")
        point['usedHeapAfterGCMiB']=round(cdp.send('Runtime.getHeapUsage')['usedSize']/1048576,1)
        point['cycle']=index
        report['checkpoints'].append(point)
        save_report(partial_path,report)

    wait("window.territoryStatus?.ready && !!territoryStatus.camera")
    assert page.evaluate('territoryStatus.graphics.active')==engine
    report['graphics']=page.evaluate("""()=>{const s=territoryStatus.graphics;
      let gpu=s.adapter;if(!gpu){const gl=document.querySelector('#sim-world canvas').getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');gpu=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;}
      return {engine:s.active,adapter:gpu,three:s.three,browser:navigator.userAgent,limits:s.limits};}""")
    control('quality','2');control('date','2026-06-21');control('sun-preset','noon');control('flight','auto','input')
    page.evaluate(METER)
    checkpoint(0)
    for cycle in range(1,cycles+1):
        prefix=str(cycle)+'/'
        stage(prefix+'pie')
        mode('walk')
        wait("!territoryStatus.navigation.landing && territoryStatus.navigation.walk?.grounded")
        hold('w',2100)
        stage(prefix+'carrera-y-giro')
        hold('w',1800,'ShiftLeft')
        yaw=rotate()
        stage(prefix+'salto')
        page.locator('#sim-world canvas').focus();page.keyboard.press('Space')
        wait("!territoryStatus.navigation.walk.grounded")
        wait("territoryStatus.navigation.walk.grounded");pause(900)
        stage(prefix+'vuelo')
        mode('fly')
        hold('Space',1400);hold('w',3500);hold('s',2100)
        # Both directions cross the same three documented zones in the same order.
        stage(prefix+'zonas')
        for name in ['Sagunto histórico','Puerto de Sagunto','Grau Vell','Puerto de Sagunto','Sagunto histórico']:
            zone(name);pause(1600)
        stage(prefix+'patrimonio-dia')
        stop('horno/horno-acceso');pause(1500)
        stage(prefix+'patrimonio-noche')
        control('quality','1');control('sun-preset','night')
        stop('grau-vell/grau-acceso');pause(1800)
        stage(prefix+'regreso')
        control('quality','2');control('sun-preset','noon')
        page.locator('#sim-home').click()
        checkpoint(cycle)
        report['checkpoints'][-1]['walkTurnRadians']=round(yaw,3)
        print(engine,'circuito',cycle,'/',cycles,flush=True)
    all_frames=page.evaluate("routeMeasure.frames")
    movement=page.evaluate("routeMeasure.movement")
    report['rAF']=summary([v for stage_frames in all_frames.values() for v in stage_frames])
    report['stages']={k:{**summary(v),'cameraTravelM':round(movement[k]['travel'],1),'peakSpeedMS':round(movement[k]['topSpeed'],2),
                         'airborne':movement[k]['airborne'],'verticalRangeM':round(movement[k]['maxY']-movement[k]['minY'],2)}
                      for k,v in all_frames.items()}
    report['samples']=page.evaluate("routeMeasure.samples")
    report['circuitSecondsIncludingWarmup']=round(time.monotonic()-began,2)
    measured=[s for s in report['samples'] if s.get('facadeBudget')]
    report['budgets']={'largestFacadeBytes':max(s['facadeBytes'] for s in measured),
        'largestStagedFacadeBytes':max(s['stagedFacadeBytes'] for s in measured),
        'largestFacadeCount':max(s['facadeCount'] for s in measured),
        'maxHeritageResident':max(len(s['heritage']) for s in measured),
        'maxConcurrentHeritagePreloads':max(s['heritageWarming'] for s in measured),
        'maxPhotoSheets':max(s['photoSheets'] for s in measured),
        'samplesAboveActiveByteLimit':sum(s['facadeBytes']>s['facadeBudget'] for s in measured),
        'samplesAbove48Chunks':sum(s['facadeCount']>48 for s in measured)}
    warm=report['checkpoints'][1:]
    stable={}
    for key,absolute,fraction in [('geometries',48,.05),('textures',8,.10),('usedHeapAfterGCMiB',20,.10)]:
        vals=[s[key] for s in warm]
        limit=round(max(absolute,abs(vals[0])*fraction),2)
        stable[key]={'warm':vals,'lastMinusFirst':round(vals[-1]-vals[0],2),'growthTolerance':limit,
                     'withinGrowthTolerance':vals[-1]-vals[0]<=limit}
    report['retentionAtPanorama']=stable
    report['errors']=errors
    save_report(partial_path,report)
    # Opening the Atlas crosses a document boundary. Check it after the timed
    # same-context circuits so fresh contexts do not hide resource retention.
    stop('grau-vell/grau-acceso')
    pre_click=settled_pose()
    page.locator('#sim-visit').click()
    wait("window.atlasStatus?.ready && document.querySelector('#loading').classList.contains('loaded')")
    atlas_hash=page.evaluate('location.hash')
    saved_camera=page.evaluate("JSON.parse(sessionStorage.getItem('saguntum-territorial-visit')).camera")
    page.locator('#sim-return').click()
    wait("window.territoryStatus?.ready && territoryStatus.heritage?.visit?.stop==='grau-acceso'")
    final=settled_pose()
    report['atlasReturn']={'visited':atlas_hash,'route':page.evaluate('location.hash'),
        'savedEye':saved_camera['eye'],'returnedEye':final['eye'],
        'preClickDeltaM':round(math.dist(pre_click['eye'],saved_camera['eye']),3),
        'cameraErrorM':round(math.dist(saved_camera['eye'],final['eye']),3),'engine':page.evaluate('territoryStatus.graphics.active')}
    report['durationSeconds']=round(time.monotonic()-began,2)
    report['errors']=errors
    save_report(partial_path,report)
    page.close()
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',required=True)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--cycles',type=int,default=3)
    parser.add_argument('--engines',nargs='+',choices=['webgl2','webgpu'],default=['webgl2','webgpu'])
    parser.add_argument('--flight-only',action='store_true',help='Añade el vuelo territorial a un expediente de circuitos ya escrito.')
    args=parser.parse_args()
    if args.cycles<2:parser.error('Se requieren al menos dos ciclos de calentamiento y retorno.')
    partial=set(args.engines)!={'webgl2','webgpu'}
    if args.flight_only or (partial and args.out.exists()):
        result=json.loads(args.out.read_bytes())
    else:
        result={'dateUTC':datetime.now(timezone.utc).isoformat(),'viewport':[1000,640],'devicePixelRatio':1,'engines':{}}
    args.out.parent.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(channel='chrome')
        result.setdefault('chrome',browser.version)
        validated={}
        partials={}
        for engine in ([] if args.flight_only else args.engines):
            captured=datetime.now(timezone.utc).isoformat()
            partials[engine]=args.out.with_name(args.out.stem+'-'+engine+'.partial.json')
            data=run(browser,args.base,engine,args.cycles,partials[engine])
            data['dateUTC']=captured
            assert data['atlasReturn']['engine']==engine and data['atlasReturn']['cameraErrorM']<1 and not data['errors'], data['atlasReturn']
            assert data['budgets']['samplesAbove48Chunks']==0 and data['budgets']['samplesAboveActiveByteLimit']==0, data['budgets']
            validated[engine]=data
        for engine in args.engines:
            flight=territorial_flight(browser,args.base,engine)
            data=result['engines'][engine] if args.flight_only else validated[engine]
            data['territorialFlight']=flight
            result['engines'][engine]=data
            save_report(args.out,result)
            if engine in partials:partials[engine].unlink(missing_ok=True)
            print(engine,'vuelo territorial',flight['distanceM'],'m',flush=True)
        browser.close()
