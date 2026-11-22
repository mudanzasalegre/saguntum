import fs from 'node:fs';
import * as THREE from 'three';
import {createBerenguer} from '../../dist/js/berenguer.js';
import {drawBerenguerMap} from '../../dist/js/berenguer-map.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json')),data=read('cartography'),visitData=read('berenguer-visit'),contextData=read('berenguer-context'),record=read('landmarks').sites.find(s=>s.id==='berenguer'),heightAt=createHeightSampler(read('elevation'));
const model=createBerenguer({heightAt,record,visitData,contextData}),visit=model.visit,scene=new THREE.Group();scene.add(model.group,model.dianaSite.group);scene.updateMatrixWorld(true);
const checks=[],errors=[],check=(ok,label,details)=>{checks.push({pass:!!ok,label});if(!ok)errors.push({label,details});},all=[];scene.traverse(o=>{if(o.isMesh)all.push(o);});
const finite=all.every(m=>Object.values(m.geometry.attributes).every(a=>Array.from(a.array).every(Number.isFinite)));
check(finite,'all attributes are finite, including generated block faces, roof tiles and true apertures');
check(all.every(m=>m.geometry.attributes.position.count%3===0),'all geometries have complete triangles');
check(model.group.parent===scene&&model.dianaSite.group.parent===scene&&!model.group.children.includes(model.dianaSite.group),'Diana and house remain separate roots without duplicated parenting');
check(contextData.coreBuildings.every(p=>model.excludedBuildingIds.includes(p.id)),'all six replaced cadastral parts are excluded by exact identifiers');
check(visitData.stops.every(s=>visit.focuses[s.id])&&Object.keys(visit.focuses).length===18,'eighteen documentary stops resolve to physical model focuses');
const expected=new Map(visitData.stops.map(s=>[s.id,s.coordinate||s.coordinates]));
check(Object.values(visit.focuses).every(f=>!expected.get(f.id)||Math.hypot(f.coordinates[0]-expected.get(f.id)[0],f.coordinates[1]-expected.get(f.id)[1])<1e-7),'model/documentary coordinates remain synchronized');
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const ray=new THREE.Raycaster(),hit=(from,dir,far,meshes)=>{ray.set(new THREE.Vector3(...from),new THREE.Vector3(...dir).normalize());ray.far=far;return ray.intersectObjects(meshes,false).find(h=>visible(h.object));};
const openingResults=[],arc=visit.qa.arcade,normal=[Math.sin(arc.frame.yaw),0,Math.cos(arc.frame.yaw)],tangent=[Math.cos(arc.frame.yaw),0,-Math.sin(arc.frame.yaw)];
const arcMeshes=all.filter(m=>['arcadas','columna'].includes(m.userData.component));
for(const [i,p]of arc.openings.entries())for(const u of[-1,0,1])for(const dy of[-.5,0,.5]){const from=[p[0]+tangent[0]*u-normal[0],p[1]+dy,p[2]+tangent[2]*u-normal[2]],h=hit(from,normal,2,arcMeshes);openingResults.push({id:'arcade-'+i,u,dy,clear:!h,hit:h?.object.name});}
check(openingResults.every(r=>r.clear),'both segmental arcades remain genuinely open at nine rays each',openingResults.filter(r=>!r.clear));
const port=visit.qa.portal,pnormal=[Math.sin(port.frameYaw),0,Math.cos(port.frameYaw)],ptan=[Math.cos(port.frameYaw),0,-Math.sin(port.frameYaw)],structural=all.filter(m=>['portada','fachada'].includes(m.userData.component)&&!['wood','metal','glass','shadow'].includes(m.userData.materialKind));
const portals=[];for(const u of[-.6,0,.6])for(const dy of[-1.1,-.4,.1]){const p=port.center,from=[p[0]+ptan[0]*u-pnormal[0],p[1]+dy,p[2]+ptan[2]*u-pnormal[2]],h=hit(from,pnormal,2,structural);portals.push({u,dy,clear:!h,hit:h?.object.name});}
check(portals.every(r=>r.clear),'portal has an actual arched void behind its recessed timber leaves',portals.filter(r=>!r.clear));
const walls=[],line=visit.qa.dianaLine.map(([lon,lat])=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320})),dianaMeshes=all.filter(m=>m.parent===model.dianaSite.remains&&m.userData.component.startsWith('diana-'));
for(let i=0;i<line.length-1;i++){const a=line[i],b=line[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;for(let t=.03;t<.98;t+=.065)for(const yy of[62.5,63.15,63.8,64.5,65.25]){const h=hit([a.x+dx*t+nx,yy,a.z+dz*t+nz],[-nx,0,-nz],2.2,dianaMeshes);walls.push({segment:i,t,y:yy,solid:!!h});}}
check(walls.every(r=>r.solid),'continuous backing closes joints across all ancient wall sections',walls.filter(r=>!r.solid));
const snapshots=all.map(m=>({m,geometry:m.geometry,material:m.material,map:m.material.map,bump:m.material.bumpMap,color:m.material.color.clone(),visible:m.visible}));
visit.setReadingMode('periods');visit.selectFocus('diana-aparejo');check(all.filter(m=>m.userData.component==='diana-antiguo').every(m=>m.material.emissiveIntensity>0),'wall mesh arrays participate in shared highlighting');visit.setReadingMode('materials');visit.selectFocus(null);
check(snapshots.every(s=>s.m.geometry===s.geometry&&s.m.material===s.material&&s.m.material.map===s.map&&s.m.material.bumpMap===s.bump&&s.m.material.color.equals(s.color)),'thematic reading restores every original material and geometry');
const closed=visit.qa.cavity.rayOrigins.map(p=>hit(p,[0,-1,0],20,all));visit.setSection(true);scene.updateMatrixWorld(true);const open=visit.qa.cavity.rayOrigins.map(p=>hit(p,[0,-1,0],20,all));
check(closed.every(h=>h&&h.point.y>visit.qa.cavity.vaultTopY+.10),'closed house conceals the underground chamber with real upper geometry',closed.map(h=>h&&({mesh:h.object.name,y:h.point.y})));
check(open.every(h=>h&&Math.abs(h.point.y-visit.qa.cavity.floorY)<.04),'section rays reach the dry chamber floor through the removed half vault',open.map(h=>h&&({mesh:h.object.name,y:h.point.y})));
check(model.dianaSite.remains.visible&&!model.dianaSite.reconstruction.visible,'house section does not toggle archaeological reading mode');visit.setSection(false);
check(snapshots.every(s=>s.m.visible===s.visible),'closing the section restores all original mesh visibility');
const joins=visit.qa.stairs,stairDifferences=[Math.abs(joins[0].b.y-63.58),Math.abs(joins[1].a.y-63.58),Math.abs(joins[1].b.y-65.2)];check(stairDifferences.every(d=>d<1e-6),'two stair flights meet their landing and upper courtyard exactly',stairDifferences);
const mapResults=[];for(const[w,h,large]of[[1340,850,true],[390,420,true],[320,220,false]]){const canvas=createCanvas(w,h),result=drawBerenguerMap(canvas,data,visitData,{large,heightAt,modelGeometry:visit.plan,readingMode:'periods',selected:'berenguer-aljibe'});check(result&&result.targets.length===18,'map has18 selectable targets at '+w+'×'+h);const hits=result?.targets.every(t=>result.hitTarget(t.x,t.y)===t.id);check(hits,'map hit targets remain distinct at '+w+'×'+h);mapResults.push({w,h,targets:result?.targets.length,scale:result?.scaleMetres});if(large&&w>1000)fs.writeFileSync('research/validation-v14/berenguer-model-plan.png',canvas.toBuffer('image/png'));}
const malformed=drawBerenguerMap(createCanvas(400,300),data,visitData,{modelGeometry:{outline:[[NaN,0],['bad',4],null]}});check(malformed===null,'malformed cartographic outline fails closed rather than emitting nonfinite canvas calls');
const result={pass:errors.length===0,stats:visit.stats,checks,errors,openings:openingResults,portal:portals,wallSamples:walls.length,section:{closed:closed.map(h=>h&&({component:h.object.userData.component,y:h.point.y})),open:open.map(h=>h&&({component:h.object.userData.component,y:h.point.y}))},maps:mapResults,limitations:['Geometry is a documented interpretation, not a measured interior survey.','These checks do not substitute integrated context/camera checks or browser WebGL validation.']};fs.writeFileSync('research/validation-v14/berenguer-model-qa.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,checks:checks.length,errors,stats:visit.stats},null,2));if(errors.length)process.exitCode=1;
