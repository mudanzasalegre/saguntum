"""Run against a served dist/ tree: python research/test-territory-street-runtime.py http://localhost:8471"""
import json
import os
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8471").rstrip("/")
chrome = os.environ.get("CHROME_PATH")
if not chrome and os.name == "nt":
    chrome = str(Path(os.environ["ProgramFiles"]) / "Google/Chrome/Application/chrome.exe")

with sync_playwright() as api:
    browser = api.chromium.launch(headless=True, executable_path=chrome)
    page = browser.new_page()
    page.route("**/__street_test", lambda route: route.fulfill(
        content_type="text/html", body="""<!doctype html><script type="importmap">
        {"imports":{"three":"/assets/vendor/three.module.js","three/addons/utils/BufferGeometryUtils.js":"/assets/vendor/BufferGeometryUtils.js"}}
        </script>"""))
    page.goto(base + "/__street_test")
    result = page.evaluate("""async () => {
      const {createNetwork}=await import('/js/territory-network.js');
      const {createHeritageCollision}=await import('/js/territory-collision-heritage.js');
      const {heightOnPavement}=await import('/js/territory-heritage-paving.js');
      const {loadHeritageCatalog,registerFrame,atlasProject}=await import('/js/territory-heritage-catalog.js');
      const {heritageWorker}=await import('/js/territory-heritage-loader.js');
      const {releaseModel}=await import('/js/territory-heritage-models.js');
      const {carsOverlap}=await import('/js/territory-traffic.js');
      const {loadElevation,makeSampler}=await import('/js/territory-ground.js');
      const {project}=await import('/js/territory-coordinates.js'),T=await import('three');
      const [world,index]=await Promise.all(['/assets/territory/world.json','/assets/network/index.json'].map(url=>fetch(url).then(r=>r.json())));
      const grids=await loadElevation(world.terrain),heightAt=makeSampler(grids),scene=new T.Scene();
      const network=createNetwork({scene,index,heightAt});
      const {x,z}=project(-.2782,39.6803),flags={streets:true,land:true,cars:true,people:true};
      const update=()=>network.update(x,z,4,1,flags);
      for(let turn=0;turn<170;turn++){
        update();
        if(network.stream.live.size>=6)break;
        await new Promise(r=>setTimeout(r,100));
      }
      if(!network.stream.live.size)throw Error('No local street sectors');
      const carMesh=scene.children[0].children[2].children[0];
      const matrix=new T.Matrix4(),poses=[];
      let observations=0,moved=0;
      for(let frame=0;frame<300;frame++){
        if(frame%12===0)update();
        network.animate(.05,flags);
        poses.length=0;
        for(let i=0;i<carMesh.count;i++){
          carMesh.getMatrixAt(i,matrix);
          const m=matrix.elements,norm=Math.hypot(m[8],m[10]);
          const p={x:m[12],y:m[13],z:m[14],dx:m[8]/norm,dz:m[10]/norm};
          if(poses.some(a=>carsOverlap(a,p,.10)))throw Error('Overlapping live vehicles');
          if(network.safeToWalk(p.x,p.z,.32,p.y))throw Error('Missing vehicle obstacle');
          poses.push(p);observations++;
        }
        if(frame===2)window.first=poses.map(p=>[p.x,p.z]);
        if(frame===32)moved=poses.filter((p,i)=>window.first[i]&&Math.hypot(p.x-window.first[i][0],p.z-window.first[i][1])>.5).length;
      }
      if(!observations||!moved)throw Error('No moving vehicles in sample');
      const pedestrian=network.nearestPublic(x,z);
      if(!pedestrian||Math.hypot(pedestrian[0]-x,pedestrian[1]-z)>85)throw Error('Local public path missing');
      let prop;
      for(const tile of network.stream.live.values()){
        for(const bucket of tile.solids.cells.values())if(bucket.length){prop=bucket[0];break;}
        if(prop)break;
      }
      if(!prop||network.safeToWalk(prop.x,prop.z,.32,prop.y))throw Error('Street furniture collision failed');
      const before=network.traffic;
      network.animate(.05,{...flags,cars:false,people:false});
      if(network.traffic.cars||network.traffic.people)throw Error('Traffic switches failed');
      const loader=heritageWorker(grids),heritage=[];
      for(const id of ['castle','horno','pantalan']){
        const start=performance.now(),model=await loader.load(id),lines=model.walkBarriers;
        if(!lines?.length)throw Error(id+' did not transfer pedestrian cross-sections');
        const collision=createHeritageCollision({walkBarriers:[lines]});
        const i=Math.floor(lines.length/12)*6,at=[(lines[i]+lines[i+3])*.5,(lines[i+1]+lines[i+4])*.5,(lines[i+2]+lines[i+5])*.5];
        if(collision.safeToWalk(at[0],at[1],.32,at[2]-.55))throw Error(id+' wall did not block');
        const gates=id==='castle'?[[-.2762665022,39.676214945],[-.2780262,39.6759438]].map(ll=>{
          const p=project(...ll);return collision.safeToWalk(p.x,p.z,.32,heightAt(p.x,p.z));
        }):[];
        if(gates.includes(false))throw Error('Castle gate passage was blocked');
        const heights=[];
        if(id==='pantalan'){
          const catalog=await loadHeritageCatalog(project),place=catalog.places.find(p=>p.id==='pantalan-paseo');
          const frame=registerFrame(place,project),axis=catalog.records['pantalan-maritimo'].survey.axis;
          const origin=atlasProject(...axis.origin),[dx,dz]=axis.unit;
          for(const [station,expected] of [[-100,2.8],[160,5.6],[462,8.63],[575,null]]){
            const lateral=-1-(station+125)*2.1/592.29;
            const p=frame.world(origin.x+dx*station-dz*lateral,origin.z+dz*station+dx*lateral);
            const y=heightOnPavement(model.publicDeck,p.x,p.z);
            if(expected===null?y!==null:y===null||Math.abs(y-expected)>.11)throw Error('Pier surface '+station+' '+y);
            if(y!==null&&!collision.safeToWalk(p.x,p.z,.32,y))throw Error('Pier walking lane blocked at '+station);
            heights.push(y);
          }
        }
        heritage.push({id,gatePassable:gates,publicDeckM:heights,segments:lines.length/6,bytes:lines.byteLength,loadMs:Math.round(performance.now()-start)});
        releaseModel(model.group);
      }
      loader.dispose();
      return {networkSectors:network.stream.live.size,traffic:before,observations,moved,prop:prop.kind,heritage};
    }""")
    print(json.dumps(result, indent=2))
    browser.close()
