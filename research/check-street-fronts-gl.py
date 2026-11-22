"""Check genuine WebGL2 shader sampler counts and day/night in the streamed Puerto street."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',required=True);parser.add_argument('--out',required=True,type=Path)
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
camera=dict(mode='fly',eye=[8025,10.7,856],target=[8000,9.4,910],yaw=2.7080111696380316,pitch=.03359723850399539)
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome')
    page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    state=dict(camera=camera,hour=14.5,quality='0',flags={'labels':False})
    page.add_init_script("sessionStorage.setItem('saguntum-territorial-visit',"+json.dumps(json.dumps(state))+")")
    page.add_init_script("""window.streetPrograms=[];const orig=WebGL2RenderingContext.prototype.linkProgram;
      WebGL2RenderingContext.prototype.linkProgram=function(program){
        orig.call(this,program);window.streetPrograms.push([this,program]);
      };""")
    page.goto(args.base+'/#simulador')
    page.wait_for_function('window.territoryStatus?.fabric?.openings>0&&!territoryStatus.pending',timeout=90000)
    page.wait_for_timeout(3500)
    result=page.evaluate("""() => {
      const active=streetPrograms.filter(([gl,p])=>gl.isProgram(p)&&gl.getProgramParameter(p,gl.LINK_STATUS));
      const shaders=active.map(([gl,p])=>Array.from({length:gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS)},(_,i)=>gl.getActiveUniform(p,i))
        .filter(u=>[gl.SAMPLER_2D,gl.SAMPLER_CUBE,gl.SAMPLER_2D_SHADOW].includes(u.type)));
      const programs=shaders.filter(s=>s.some(u=>u.name==='uUrbanField'));
      const count=s=>s.reduce((n,u)=>n+u.size,0);
      const resources=performance.getEntriesByType('resource').map(r=>r.name);
      const [gl]=active[0],ext=gl.getExtension('WEBGL_debug_renderer_info');
      return {municipalPrograms:programs.length,samplers:programs.map(count),maxFragmentSamplers:gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
        compactFieldLoaded:resources.some(s=>s.includes('/urban-sky-compact.webp')),parcelSectors:resources.filter(s=>s.includes('/street-fronts/')&&s.endsWith('.bin')).length,
        memory:territoryStatus.memory||null,urbanPrograms:programs.map(s=>s.map(u=>u.name)),day:territoryStatus.hour};
    }""")
    page.locator('#sim-time').evaluate("(el)=>{el.value=22;el.dispatchEvent(new Event('input',{bubbles:true}));}")
    page.wait_for_function('territoryStatus.hour===22 && territoryStatus.lighting==="solar"')
    page.wait_for_timeout(800)
    page.screenshot(path=str(args.out/'barcelona-noche.jpg'),quality=88)
    result.update(night=page.evaluate('territoryStatus.hour'),errors=errors)
    assert result['municipalPrograms']>=3 and max(result['samplers'])<=16 and result['compactFieldLoaded'] and result['parcelSectors']>0 and not errors,result
    (args.out/'webgl-movil.json').write_text(json.dumps(result,indent=2),encoding='utf8')
    print(result['samplers'],result['parcelSectors'],result['gpu'],errors)
    browser.close()
