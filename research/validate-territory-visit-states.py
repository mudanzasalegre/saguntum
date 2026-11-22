"""Render native territorial stops from a running dist server in Chromium WebGL."""
import argparse
import json
from playwright.sync_api import sync_playwright


def run(base, ids):
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=True,
                                     args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        page = browser.new_page()
        page.set_default_timeout(120000)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda e: errors.append(e.text) if e.type == "error" else None)
        page.route("**/__native-visits", lambda route: route.fulfill(
            content_type="text/html",
            body='<script type="importmap">{"imports":{"three":"/assets/vendor/three.module.js",'
                 '"three/addons/utils/BufferGeometryUtils.js":"/assets/vendor/BufferGeometryUtils.js"}}</script>'))
        page.goto(base + "/__native-visits")
        places = page.evaluate("""async () => {
          const T=window.T=await import('three');
          const {loadElevation,makeSampler,buildGround}=await import('/js/territory-ground.js');
          const {project}=await import('/js/territory-coordinates.js');
          window.geo=project;
          window.models=await import('/js/territory-heritage-models.js');
          window.controls=await import('/js/territory-heritage-visit.js');
          window.frames=await import('/js/territory-visit-frames.js');
          const load=async name=>(await fetch('/assets/territory/'+name+'.json')).json();
          const meta=await load('world');
          window.inventory=await(await import('/js/territory-heritage-catalog.js')).loadHeritageCatalog(project);
          const grids=await loadElevation(meta.terrain);
          window.height=makeSampler(grids);
          window.stops=await load('visit-stops');window.cameras=await load('visit-cameras');
          window.gl=new T.WebGLRenderer();gl.setSize(144,90);gl.debug.onShaderError=()=>{throw Error('GLSL');};
          window.scene=new T.Scene();scene.add(new T.HemisphereLight());
          const {createTerritorySea}=await import('/js/territory-sea.js');
          window.sea=createTerritorySea({polygons:meta.water,shorelines:meta.shorelines,project,heightAt:height,mobile:true});
          scene.add(sea.group);
          window.terrain=await buildGround(scene,grids,sea.mask.groundHeight(height),gl);
          return Object.keys(stops);
        }""")
        count = 0
        for place in ids or places:
            result = page.evaluate("""async place=>{
             const model=await models.buildHeritageModel(models.modelId(place),{...inventory,heightAt:height,
               project:geo,renderer:gl,bindVisit:controls.bindHeritageVisit,needed:()=>true});
             const info=inventory.places.find(p=>p.id===place);
             scene.add(model.group);
             // Some authored landscape stops face the sea with the vegetation
             // and lookout behind the camera. Their view includes real terrain.
             const landscape=!!inventory.records[place].landscape;
             terrain.group.visible=landscape;sea.group.visible=landscape;
             const camera=new T.PerspectiveCamera(38,1.6,.12,30000);
             const phases={},visible=new Set();let sections=0,interiors=0,inspection=0,nearInstances=0;
             const centres=[];
             if(landscape){
              model.group.updateWorldMatrix(true,true);
              model.group.traverse(o=>{
               if(!o.userData.territoryInstances)return;
               for(let i=0;i<o.count;i++)centres.push(new T.Vector3().fromArray(o.instanceMatrix.array,i*16+12).applyMatrix4(o.matrixWorld));
              });
             }
             for(const stop of stops[place].stops){
               const frame=cameras[place][stop.id];
               const state=model.setVisitStop(place,stop.id,frame.presentation);
               if(state.stop!==stop.id)throw Error(place+'/'+stop.id);
               const shot=frames.stopCamera(stop,info,{project:geo,heightAt:height,aspect:1.6,frame});
               camera.position.copy(shot.eye);camera.lookAt(shot.target);camera.fov=shot.fov;camera.updateProjectionMatrix();
               if(landscape){
                terrain.update(shot.target.x,shot.target.z,Math.abs(shot.eye.y));
                const {x,z}=shot.target,dx=Math.round(x/40)*40,dz=Math.round(z/40)*40;
                const expected=centres.filter(v=>(v.x-dx)**2+(v.z-dz)**2<200**2).length;
                const density=model.setDensity(60,0,x,z);
                if(density.nearby!==expected||density.instances<expected)throw Error(place+'/'+stop.id+' vegetación próxima');
                nearInstances=Math.max(nearInstances,expected);
               }
               gl.render(scene,camera);
               const error=gl.getContext().getError();
               if(error||!gl.info.render.calls)throw Error(place+'/'+stop.id+' · WebGL '+error+' / '+gl.info.render.calls);
               phases[state.mode]=(phases[state.mode]||0)+1;sections+=+state.section;interiors+=+state.interior;
               inspection+=+!!state.waterCut;
               let hash=0;model.group.traverseVisible(o=>{if(o.isMesh)hash=(Math.imul(hash,31)+o.id)|0;});
               visible.add(hash);
             }
             model.setVisitStop(null,null);
             model.disposeVisit();models.releaseModel(model.group);gl.renderLists.dispose();
             return {place,stops:stops[place].stops.length,phases,sections,interiors,inspection,visibleSets:visible.size,
                ...(landscape?{peakNativeNearInstances:nearInstances}:{})};
            }""", place)
            count += result["stops"]
            print(json.dumps(result, ensure_ascii=True), flush=True)
        browser.close()
        if errors:
            raise RuntimeError(errors)
        print("Paradas renderizadas:", count)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("base")
    parser.add_argument("places", nargs="*")
    args = parser.parse_args()
    run(args.base.rstrip("/"), args.places)
