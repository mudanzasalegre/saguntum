"""Measure each selectable stop with the original Atlas camera and model in WebGL."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'dist/assets/territory/visit-cameras.json'

# Observe scene state only in the calibration browser. The hosted app has no
# inspection endpoint. Each selection follows the Atlas' own presentation handler.
PROBE = """
window.atlasVisitCalibration={
  catalog:()=>catalog.map(c=>({id:c.id,region:regionOf(c)})),
  entries(){
    const guide=guidedVisit(selected);
    if(guide)return guide.data.stops.map(s=>s.id);
    if(byId[selected].landscape)return byId[selected].observationPoints.map(s=>s.id);
    return Object.keys(coastHeritage.sites[selected].focuses);
  },
  async measure(ids){
    const output={};
    for(const id of ids){
      if(guidedVisit(selected)){
        // The two pier visits share one visibility switch. Direct links start
        // in the present, then apply a phase when the stop specifies one.
        if(pantalanIds.has(selected))applyPantalanMode(selected,'current');
        selectVisitStop(selected,id);
        if(guidedVisit(selected).stopId!==id)throw Error('Parada no seleccionada: '+selected+'/'+id);
      }else if(byId[selected].landscape){
        selectLandscapeFocus(id);
        if(landscapeFocus!==id)throw Error('Observación no seleccionada: '+id);
      }else{
        const part=coastHeritage.sites[selected].focuses[id];
        changeCoastMode(part.modes?.[0]||'current');
        const button=document.querySelector('[data-coast-focus="'+id+'"]');
        if(!button)throw Error('Encuadre costero no disponible: '+id);
        button.click();
      }
      await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
      const target=controls.target,terrain=activeRegion==='sagunto'?rawHeight:activeRegion==='puerto'?portHeight:
        activeRegion==='coast'?coastHeight:landscapes[activeRegion].height;
      const data={target:target.toArray(),eye:camera.position.toArray(),fov:camera.fov,ground:terrain(target.x,target.z)};
      const visit=guidedVisit(selected),state=excavation?.state.selected===selected?excavation.state:null;
      const mode=coastModes[selected]||state?.mode||'current';
      const part=visit?.model?.getFocus?.(id,mode)||visit?.model?.focuses?.[id];
      const presentation={};
      if(mode!=='current')presentation.mode=mode;
      if(visit?.sectionOpen||part?.requiresSection)presentation.requiresSection=true;
      if(part?.interiorView)presentation.interiorView=true;
      if(state?.focusId)presentation.archFocus=state.focusId;
      if(state?.roofOpen||roofOpen)presentation.roofOpen=true;
      if(marineInspection)presentation.inspection=true;
      if(Object.keys(presentation).length)data.presentation=presentation;
      if(![...data.target,...data.eye,data.fov,data.ground].every(Number.isFinite))throw Error('Cámara no finita: '+id);
      output[id]=data;
    }
    return output;
  }
};
"""

def rounded(values):
    return [round(v, 4) for v in values]

def capture(args):
    frames = {} if not args.places or not args.out.exists() else json.loads(args.out.read_bytes())
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='chrome', args=['--disable-ipc-flooding-protection'])
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
        def instrument(route):
            response = route.fetch()
            route.fulfill(response=response, body=response.text() + PROBE)
        context.route('**/js/app.js*', instrument)
        page = context.new_page()
        def open_visit(place):
            page.goto(args.base.rstrip('/') + '/#' + place, wait_until='domcontentloaded')
            page.wait_for_function("id=>window.atlasStatus?.ready && atlasStatus.selected===id && "
                                   "atlasStatus.loadedRegions.includes(atlasStatus.activeRegion)", arg=place, timeout=180000)
        open_visit('glorieta')
        places = page.evaluate('atlasVisitCalibration.catalog()')
        remaining = [p for p in places if not args.places or p['id'] in args.places]
        assert not args.places or set(args.places) == {p['id'] for p in remaining}
        # Closing each region releases its renderer, textures and buffers before
        # the next large region is constructed. Identical stops share one model.
        region = 'glorieta'
        for p in sorted(remaining, key=lambda p: (p['id']!='glorieta', p['region'], p['id'])):
            group = 'glorieta' if p['id']=='glorieta' else p['region']
            if group != region:
                page.close()
                page = context.new_page()
                region = group
            open_visit(p['id'])
            stops = page.evaluate('atlasVisitCalibration.entries()')
            result = {}
            assert stops and len(stops)==len(set(stops)), (p, stops)
            for size, width, height in [('wide',1440,900),('portrait',390,844)]:
                page.set_viewport_size({'width':width,'height':height})
                rows = page.evaluate('ids=>atlasVisitCalibration.measure(ids)', stops)
                for stop, data in rows.items():
                    target = rounded(data['target'])
                    ground = round(data['ground'], 4)
                    record = result.setdefault(stop, {'target':target,'ground':ground})
                    assert record['target']==target and record['ground']==ground, (p,stop,data,record)
                    record[size] = {'eye':rounded(data['eye']), 'fov':round(data['fov'], 4)}
                    if size=='portrait':
                        assert record.get('presentation')==data.get('presentation'), (p,stop,'presentation')
                    elif 'presentation' in data:
                        record['presentation'] = data['presentation']
            frames[p['id']] = result
            # Incremental output allows resuming a large calibration by place.
            args.out.parent.mkdir(parents=True, exist_ok=True)
            args.out.write_text(json.dumps(frames,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
            print(p['id'],len(stops),'encuadres por dispositivo',flush=True)
        browser.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base',required=True)
    parser.add_argument('--out',type=Path,default=DEST)
    parser.add_argument('--places',nargs='+')
    capture(parser.parse_args())
