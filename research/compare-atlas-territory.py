"""Captura la visita real y los simuladores en cámaras y ópticas registradas.

Windows, Python 3, Pillow, NumPy y Playwright con Chrome. Ver README junto a las capturas.
No modifica la aplicación. El inspector Three observa el render real e iguala únicamente la cámara en el ensayo.
"""
import argparse
import base64
import io
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
OUT=HERE/'validation-atlas-parity'
SIZE=(1200,760)
CASES={
    'plaza-soportales':('plaza-mayor','plaza-soportales','Plaça Major · Los soportales','Plaça Major'),
    'plaza-mercado':('plaza-mayor','plaza-mercado','Plaça Major · Mercado y fachadas','Plaça Major'),
    'horno-acceso':('horno','horno-acceso','Alto Horno n.º 2 · Acceso','Alto Horno'),
    'gerencia-oficinas':('gerencia','gerencia-oficinas','La Gerencia · Oficinas','Gerencia'),
    'grau-acceso':('grau-vell','grau-acceso','Grau Vell · Acceso al Fortín','Fortín y centro'),
    'grau-conjunto':('grau-vell','grau-conjunto','Grau Vell · Conjunto y costa','Fortín y centro')
}
CONTEXT_ROOTS={
    'plaza-mayor':'Plaça Major · trama urbana y accesos',
    'horno':'Alto Horno nº 2 · recepción y entorno industrial',
    'gerencia':'Gerencia · ciudad jardín y entorno urbano',
    'grau-vell':'Grau Vell · poblado y entorno'
}
HOOK="""(() => {
 const Q=window.parityQA={};
 const hook=window.__THREE_DEVTOOLS__=new EventTarget();
 hook.addEventListener('observe',e=>{
   const r=e.detail;if(!r.isWebGLRenderer)return;
   Q.renderer=r;
   const draw=r.render.bind(r);let nesting=0;
   r.render=function(s,c){
     const main=!nesting && c.isPerspectiveCamera && r.domElement.isConnected && s.children.length>6;
     if(main){Q.camera=c; Q.scene=s}
     nesting++;
     try{return draw(s,c)}finally{
       nesting--;
       if(!nesting && !r.getRenderTarget() && Q.snap && r.domElement.isConnected){
         Q.snap(r.domElement.toDataURL('image/png'));Q.snap=null;
       }
     }
   };
 });
})();"""
CAMERA="""() => {
 const c=parityQA.camera,d=c.getWorldDirection(c.position.clone());
 return {eye:c.position.toArray(),direction:d.toArray(),up:c.up.toArray(),
   fov:c.fov,aspect:c.aspect,zoom:c.zoom,view:c.view?{...c.view}:null,
   projection:c.projectionMatrix.toArray(),width:parityQA.renderer.domElement.width,height:parityQA.renderer.domElement.height};
}"""
# Samples come directly from mesh vertex positions after Three's world transforms.
# Their world positions let us register the local elevation and verify the image framing.
SAMPLES="""([prefix,cx,cz])=>{
 const Q=parityQA, out=[],eye=Q.camera.position,frustum=Q.camera;
 Q.scene.traverseVisible(o=>{
   const pos=o.geometry?.attributes?.position;
   if(!o.isMesh||o.isInstancedMesh||!pos?.count||!o.name)return;
   const indexes=[0,Math.floor(pos.count/2),Math.floor(pos.count*.83)];
   const points=indexes.map(i=>eye.clone().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld));
   const radius=Math.min(...points.map(v=>Math.hypot(v.x-cx,v.z-cz)));
   if(radius>205)return;
   const onScreen=points.some(v=>{const p=v.clone().project(frustum);return Math.abs(p.x)<1 && Math.abs(p.y)<1 && p.z>0&&p.z<1});
   const parents=[];for(let node=o.parent;node;node=node.parent)if(node.name)parents.push(node.name);
   out.push({n:o.name,parents,k:pos.count,core:o.name.startsWith(prefix),onScreen,
      p:points.map(v=>v.toArray().map(x=>+x.toFixed(4))),
      screen:points.map(v=>{const p=v.clone().project(frustum);return [+(p.x*600+600).toFixed(3),+(380-p.y*380).toFixed(3)]})});
 });
 return out;
}"""
REGISTER="""async id=>{
 const geo=await import('./js/territory-coordinates.js');
 const reg=await import('./js/territory-heritage-catalog.js');
 const {places}=await reg.loadHeritageCatalog(geo.project),place=places.find(p=>p.id===id);
 const {a,b,c,d,tx,tz}=reg.registerFrame(place,geo.project),atlas=reg.atlasProject(place.lon,place.lat);
 return {a,b,c,d,tx,tz,atlas:[atlas.x,atlas.z],territory:[place.x,place.z]};
}"""
def save(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

def mapping(reg,point):
    x,y,z=point
    return np.array([reg['a']*x+reg['b']*z+reg['tx'],y,reg['c']*x+reg['d']*z+reg['tz']])

def corresponding(atlas,sim,reg):
    index={}
    for row in sim:index.setdefault((row['n'],row['k']),[]).append(row)
    pairs=[]
    for a in atlas:
        local=np.array([mapping(reg,p) for p in a['p']])
        candidates=[]
        for b in index.get((a['n'],a['k']),[]):
            delta=np.array(b['p'])-local
            err=np.max(np.linalg.norm(delta[:,[0,2]],axis=1))
            if err<.3:candidates.append((err,b,delta))
        if candidates:
            _,b,delta=min(candidates,key=lambda c:c[0])
            pairs.append((a,b,delta))
    return pairs

def page_with_errors(browser,state=None):
    page=browser.new_page(viewport={'width':SIZE[0],'height':SIZE[1]},device_scale_factor=1,reduced_motion='reduce')
    page.add_init_script(HOOK)
    if state:page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+");")
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
    return page,errors

def screenshot(page,path):
    raw=page.evaluate("() => new Promise(resolve=>parityQA.snap=resolve)")
    img=Image.open(io.BytesIO(base64.b64decode(raw.split(',')[1]))).convert('RGB')
    assert img.size==SIZE and np.std(img)>8
    img.save(path,quality=93,optimize=True)

def reference(browser,base,id,stop,prefix,folder,cache):
    page,errors=page_with_errors(browser)
    page.goto(base+'#'+id+'/'+stop,wait_until='domcontentloaded',timeout=120000)
    page.wait_for_function("id=>window.atlasStatus?.selected===id && atlasStatus.ready && window.parityQA?.camera",arg=id,timeout=180000)
    page.wait_for_timeout(2200)
    reg=page.evaluate(REGISTER,id)
    cam=page.evaluate(CAMERA)
    anchors=page.evaluate(SAMPLES,[prefix,*reg['atlas']])
    assert any(s['core'] for s in anchors),(id,[s['n'] for s in anchors[:6]])
    status=page.evaluate("""()=>({region:atlasStatus.activeRegion,selected:atlasStatus.selected,
        light:document.querySelector('[data-light].selected')?.dataset.light,hash:location.hash})""")
    screenshot(page,folder/(stop+'.jpg'))
    assert not errors,errors
    save(cache/(stop+'.json'),dict(cam=cam,reg=reg,samples=anchors))
    page.close()
    return dict(status=status,camera=cam,samples=len(anchors),namedCore=sum(s['core'] for s in anchors))

def simulator(browser,base,label,id,stop,prefix,folder,cache):
    a=json.loads((cache/(stop+'.json')).read_bytes())
    reg,cam,atlas=a['reg'],a['cam'],a['samples']
    start=mapping(reg,cam['eye'])
    direction=mapping(reg,cam['direction'])-mapping(reg,[0,0,0])
    direction=direction/np.linalg.norm(direction)
    target=start+direction*20
    state=dict(selected=id,camera=dict(mode='fly',eye=start.tolist(),target=target.tolist(),
               yaw=math.atan2(-direction[0],-direction[2]),pitch=math.asin(direction[1])),quality='2')
    if label=='v34':state['hour']=16
    else:state.update(lighting='golden',terrain='natural')
    page,errors=page_with_errors(browser,state)
    page.goto(base+'#simulador',wait_until='domcontentloaded',timeout=90000)
    page.wait_for_function("id=>window.territoryStatus?.heritage?.loaded?.includes(id) && parityQA.camera",arg=id,timeout=150000)
    page.wait_for_timeout(2200)
    page.wait_for_function("!territoryStatus.pending && !territoryStatus.heritage.loading",timeout=120000)
    samples=page.evaluate(SAMPLES,[prefix,*reg['territory']])
    pairs=corresponding(atlas,samples,reg)
    core=[(at,b,d) for at,b,d in pairs if at['core']]
    assert len(core)>2, (id,len(core))
    # Use the median vertical change at source mesh controls to account for
    # the different ground datasets in the Atlas and territorial editions.
    dy=float(np.median([d[:,1] for _,_,d in core]))
    desired=start.copy(); desired[1]+=dy
    measured=page.evaluate(CAMERA)
    # Correct this test camera to the original visit lens and principal point.
    # The normal application still renders all meshes, shadows, water and its final pass.
    page.evaluate("""({source,p})=>{
      const c=parityQA.camera;c.position.fromArray(p);c.fov=source.fov;c.zoom=source.zoom;
      const v=source.view;
      if(v?.enabled)c.setViewOffset(v.fullWidth,v.fullHeight,v.offsetX,v.offsetY,v.width,v.height);
      else c.clearViewOffset();
      c.updateProjectionMatrix();c.updateMatrixWorld();
    }""",dict(source=cam,p=desired.tolist()))
    page.wait_for_timeout(800)
    actual=page.evaluate(CAMERA)
    if np.linalg.norm(np.array(actual['eye'])-desired)>.12:
        raise RuntimeError(f"{stop}: el suelo desplaza la cámara de ensayo {actual['eye']} vs {desired}")
    assert np.linalg.norm(np.array(actual['direction'])-direction)<.001,(id,actual,direction)
    assert all(abs(actual['projection'][i]-cam['projection'][i])<1e-7 for i in [0,5,8,9]),(id,cam,actual)
    samples=page.evaluate(SAMPLES,[prefix,*reg['territory']]);pairs=corresponding(atlas,samples,reg)
    visible=[(ar,b,d) for ar,b,d in pairs if ar['core'] and ar['onScreen'] and b['onScreen']]
    screen_errors=[]
    for ar,br,_ in visible:
        for pt,bt in zip(ar['screen'],br['screen']):
            if 0<=pt[0]<=SIZE[0] and 0<=pt[1]<=SIZE[1]:
                screen_errors.append(float(np.linalg.norm(np.array(pt)-bt)))
    screenshot(page,folder/(stop+'.jpg'))
    status=page.evaluate("""()=>({lighting:territoryStatus.lighting??'solar',terrain:document.querySelector('#sim-terrain')?.value??'photography',hour:territoryStatus.hour,
      loaded:territoryStatus.heritage.loaded,stats:territoryStatus.heritage,drawCalls:territoryStatus.drawCalls,triangles:territoryStatus.triangles,frameMs:territoryStatus.frameMs})""")
    if label=='v35':assert (status['lighting'],status['terrain'])==('golden','natural'),status
    page.close();assert not errors,errors
    own_context=lambda batch: CONTEXT_ROOTS[id] in batch.get('parents',[])
    territory_names={row['n'] for row in samples}
    return dict(status=status,errors=errors,optics={'actual':actual,'productionBeforeLensMatch':measured},
        registration={'horizontalFrame':reg,'medianGroundOffsetMetres':round(dy,4),'eyeErrorMetres':round(float(np.linalg.norm(np.array(actual['eye'])-desired)),4),
           'architectureSampledBatches':sum(x['core'] for x in atlas),'architectureMatchedBatches':sum(x['core'] for x,_,_ in pairs),
           'siteContextSampledBatches':sum(own_context(x) for x in atlas),'siteContextMatchedBatches':sum(own_context(x) for x,_,_ in pairs),
           'siteContextPresentByName':sum(own_context(x) and x['n'] in territory_names for x in atlas),
           'otherAtlasBatchesMatched':sum(not x['core'] for x,_,_ in pairs),'otherAtlasBatchesSampled':sum(not x['core'] for x in atlas),
           'visibleControlPoints':len(screen_errors),'medianReprojectionPx':round(float(np.median(screen_errors)),3) if screen_errors else None,
           'p95ReprojectionPx':round(float(np.percentile(screen_errors,95)),3) if screen_errors else None})

def native(browser,base,label,id,stop,folder):
    p=browser.new_page(viewport={'width':SIZE[0],'height':SIZE[1]},device_scale_factor=1,reduced_motion='reduce')
    p.goto(base+('#'+id+'/'+stop if label=='atlas' else '#simulador'),wait_until='domcontentloaded',timeout=120000)
    if label=='atlas':p.wait_for_function("window.atlasStatus?.ready",timeout=180000)
    else:
        p.wait_for_function("window.territoryStatus?.ready",timeout=120000)
        p.locator('#sim-search-open').click();p.locator('#sim-query').fill('Fortín')
        p.locator('#sim-results button').first.click()
        p.wait_for_function("territoryStatus?.heritage?.loaded.includes('grau-vell')",timeout=120000)
    p.wait_for_timeout(3000);p.screenshot(path=str(folder/'uso-normal.jpg'),quality=91);p.close()

def comparison():
    """Build a labelled contact sheet and a low-frequency colour comparison."""
    def font(size):
        for family in ('segoeui.ttf','DejaVuSans.ttf'):
            try:return ImageFont.truetype(family,size)
            except OSError:pass
        return ImageFont.load_default()
    def lab_grid(image):
        rgb=np.asarray(image.resize((150,95),Image.Resampling.BOX),dtype=float)/255
        linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
        # CIE Lab, D65, sRGB primaries. Downsampling reduces sensitivity to a few pixels of registration error.
        xyz=linear @ np.array([[.4124564,.2126729,.0193339],[.3575761,.7151522,.1191920],[.1804375,.0721750,.9503041]])
        t=xyz/np.array([.95047,1,1.08883])
        f=np.where(t>(6/29)**3,np.cbrt(t),t/(3*(6/29)**2)+4/29)
        return np.stack([116*f[:,:,1]-16,500*(f[:,:,0]-f[:,:,1]),200*(f[:,:,1]-f[:,:,2])],axis=-1)
    sheet=Image.new('RGB',(1594,70+len(CASES)*390),'#eeeae0')
    draw=ImageDraw.Draw(sheet)
    for i,title in enumerate(['Visita del Atlas','Simulador · v34','Simulador · v35']):
        draw.text((18+i*526,18),title,fill='#193b39',font=font(26))
    checks={}
    for j,(stop,(_,_,name,_)) in enumerate(CASES.items()):
        y=66+j*390
        draw.text((18,y),name,fill='#21433f',font=font(23))
        images=[Image.open(OUT/label/(stop+'.jpg')).convert('RGB') for label in ['atlas','v34','v35']]
        for i,image in enumerate(images):
            sheet.paste(image.resize((510,323),Image.Resampling.LANCZOS),(18+i*526,y+36))
        a=lab_grid(images[0])
        checks[stop]={}
        for label,image in zip(['v34','v35'],images[1:]):
            err=np.linalg.norm(a-lab_grid(image),axis=2)
            checks[stop][label]={'medianDeltaE76':round(float(np.median(err)),2),
                                 'meanDeltaE76':round(float(np.mean(err)),2)}
    save(OUT/'color.json',checks)
    sheet.save(OUT/'comparacion.jpg',quality=93,optimize=True)

def atlas_regression(browser,base,cache):
    import tempfile
    results={}
    with tempfile.TemporaryDirectory(prefix='saguntum-compare-atlas-') as temp:
        folder=Path(temp)
        for stop in ('plaza-soportales','horno-acceso','grau-acceso'):
            id,_,_,prefix=CASES[stop]
            newer=reference(browser,base,id,stop,prefix,folder,folder)
            original=json.loads((cache/(stop+'.json')).read_bytes())['cam']
            assert np.allclose(original['eye'],newer['camera']['eye'])
            assert np.allclose(original['projection'],newer['camera']['projection'])
            def channels(path):return np.asarray(Image.open(path).convert('RGB'),dtype=np.float32)
            delta=np.abs(channels(OUT/'atlas'/(stop+'.jpg'))-channels(folder/(stop+'.jpg')))
            results[stop]=dict(meanAbsoluteRGB255=round(float(delta.mean()),3),
                percentagePixelsMaxDifferenceOver8=round(float((delta.max(axis=2)>8).mean()*100),2))
    save(OUT/'regresion-atlas.json',results)

def main():
    import tempfile
    parser=argparse.ArgumentParser();parser.add_argument('--base')
    parser.add_argument('--stage',required=True,choices=['atlas','v34','v35','comparar','regresion'])
    parser.add_argument('--only',nargs='*');parser.add_argument('--native',action='store_true')
    parser.add_argument('--cache',type=Path,default=Path(tempfile.gettempdir())/'saguntum-parity-v35')
    args=parser.parse_args()
    if args.stage=='comparar':comparison();return
    if not args.base:parser.error('--base es necesario para capturar una versión')
    base=args.base.rstrip('/')+'/';label=args.stage;cache=args.cache
    cache.mkdir(parents=True,exist_ok=True)
    if label=='regresion':
        with sync_playwright() as q:
            browser=q.chromium.launch(channel='chrome')
            atlas_regression(browser,base,cache);browser.close()
        return
    folder=OUT/label;folder.mkdir(exist_ok=True,parents=True)
    outfile=folder/'controles.json';report=json.loads(outfile.read_bytes()) if outfile.exists() else {}
    with sync_playwright() as q:
        browser=q.chromium.launch(channel='chrome')
        for stop,(id,_,name,prefix) in CASES.items():
            if args.only and stop not in args.only: continue
            report[stop]=reference(browser,base,id,stop,prefix,folder,cache) if label=='atlas' else simulator(browser,base,label,id,stop,prefix,folder,cache)
            save(outfile,report)
            print(label,stop,report[stop].get('registration',{}).get('medianReprojectionPx'),flush=True)
        if args.native:native(browser,base,label,'grau-vell','grau-conjunto',folder)
        browser.close()
if __name__=='__main__':main()
