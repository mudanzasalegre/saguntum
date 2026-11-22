import fs from 'node:fs';
import * as THREE from 'three';
import {createSangre} from '../../dist/js/sangre.js';
import {drawSangreMap} from '../../dist/js/sangre-map.js';
import {createHeightSampler} from '../../dist/js/terrain.js';
const {createCanvas}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas/index.js');
globalThis.document={createElement:()=>createCanvas(256,256)};
const read=n=>JSON.parse(fs.readFileSync('dist/assets/data/'+n+'.json'));
const data=read('cartography'),record=read('landmarks').sites.find(s=>s.id==='sangre'),visitData=read('sangre-visit'),contextData=read('sangre-context'),heightAt=createHeightSampler(read('elevation'));
const model=createSangre({record,heightAt,visitData,contextData}),visit=model.visit;
model.group.updateMatrixWorld(true);
const all=[];model.group.traverse(o=>{if(o.isMesh)all.push(o);});
const checks=[],errors=[],check=(pass,label,details)=>{checks.push({pass:!!pass,label});if(!pass)errors.push({label,details});};
check(all.every(m=>Object.values(m.geometry.attributes).every(a=>Array.from(a.array).every(Number.isFinite))),'all geometry attributes are finite');
check(all.every(m=>m.geometry.attributes.position.count%3===0),'geometry consists of complete triangles');
check(contextData.coreBuildings.every(p=>model.excludedBuildingIds.includes(p.id)),'all nine replaced cadastral parts are excluded by exact identifier');
check(visitData.stops.every(s=>visit.focuses[s.id])&&Object.keys(visit.focuses).length===16,'all sixteen documentary stops resolve to model focuses');
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const ray=new THREE.Raycaster(),hit=(from,dir,far,meshes=all)=>{ray.set(new THREE.Vector3(...from),new THREE.Vector3(...dir).normalize());ray.far=far;return ray.intersectObjects(meshes,false).find(h=>visible(h.object));};
const portal=visit.qa.portal,n=[Math.sin(portal.frameYaw),0,Math.cos(portal.frameYaw)],t=[Math.cos(portal.frameYaw),0,-Math.sin(portal.frameYaw)];
const structural=all.filter(m=>['fachada','portada'].includes(m.userData.component)&&!['wood','metal','glass','bronze','shadow'].includes(m.userData.materialKind));
const openingRays=[];
for(const u of[-1,0,1])for(const dy of[-1.5,-.7,.2]){const p=portal.center,from=[p[0]+t[0]*u-n[0],p[1]+dy,p[2]+t[2]*u-n[2]],h=hit(from,n,2,structural);openingRays.push({u,dy,clear:!h,hit:h?.object.name});}
check(openingRays.every(q=>q.clear),'entrance portal has a real structural aperture',openingRays.filter(q=>!q.clear));
const chapelMeshes=all.filter(m=>['capillas','arcos-capillas'].includes(m.userData.component)),chapelRays=[];
for(const [i,ch]of visit.qa.chapels.entries())for(const dy of[-.9,0,.8]){const p=ch.opening,normal=ch.normal,from=[p[0]-normal[0]*.75,p[1]+dy,p[2]-normal[2]*.75],h=hit(from,normal,1.5,chapelMeshes);chapelRays.push({chapel:i,y:dy,clear:!h,hit:h?.object.name});}
check(chapelRays.every(q=>q.clear),'all four chapel arches are genuine voids',chapelRays.filter(q=>!q.clear));
check(visit.qa.entranceSteps.length===7&&visit.qa.presbyterySteps.length===7,'two documented stairs each have seven physical steps');
check(visit.qa.entranceSteps.every((s,i)=>i===0||Math.abs(s.top-visit.qa.entranceSteps[i-1].top-.18)<1e-8),'entrance stairs rise continuously to the threshold');
check(Math.abs(visit.qa.presbyterySteps.at(-1).y-visit.qa.presbyteryY)<1e-8,'presbytery stair reaches the raised marble floor');
const stairChecks=[],sf=visit.qa.frame;
for(const step of visit.qa.presbyterySteps){const u=1.72,v=step.z,x=sf.x+u*Math.cos(sf.yaw)+v*Math.sin(sf.yaw),z=sf.z-u*Math.sin(sf.yaw)+v*Math.cos(sf.yaw),h=hit([x,visit.qa.presbyteryY+1,z],[0,-1,0],4,all.filter(m=>['presbiterio','gradas'].includes(m.userData.component)));stairChecks.push({step:step.index,expected:step.y,visibleY:h?.point.y,clear:!!h&&Math.abs(h.point.y-step.y)<.01});}
check(stairChecks.every(s=>s.clear),'raised presbytery platform leaves all seven stair treads visible',stairChecks);
const localV=(x,z)=>(x-sf.x)*Math.sin(sf.yaw)+(z-sf.z)*Math.cos(sf.yaw),frontV=localV(portal.center[0],portal.center[2]),roofFront={};
for(const kind of['lime','tiles']){const values=[];for(const m of all.filter(m=>m.userData.component==='tejado-nave'&&m.userData.materialKind===kind)){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)values.push(localV(p.getX(i),p.getZ(i)));}roofFront[kind]=Math.min(...values);}
check(roofFront.lime>frontV+.22&&roofFront.tiles>frontV+.22,'nave roof gable and tile courses stay behind the baroque façade instead of drawing a false pediment',roofFront);
const snapshots=all.map(m=>({m,geometry:m.geometry,material:m.material,map:m.material.map,bump:m.material.bumpMap,color:m.material.color.clone(),visible:m.visible}));
visit.setReadingMode('periods');visit.selectFocus('sangre-portada');check(all.filter(m=>m.userData.component==='portada').every(m=>m.material.emissiveIntensity>0),'portal meshes participate in thematic highlighting');visit.setReadingMode('materials');visit.selectFocus(null);
check(snapshots.every(s=>s.geometry===s.m.geometry&&s.material===s.m.material&&s.map===s.m.material.map&&s.bump===s.m.material.bumpMap&&s.color.equals(s.m.material.color)),'material mode restores original colours, maps and geometry');
const closed=visit.qa.floorRays.map(p=>hit(p,[0,-1,0],30));visit.setSection(true);model.group.updateMatrixWorld(true);const open=visit.qa.floorRays.map(p=>hit(p,[0,-1,0],30));
check(closed.every(h=>h&&h.point.y>visit.qa.baseY+10),'closed shell hides nave and crossing floors below real roof geometry',closed.map(h=>h&&({component:h.object.userData.component,y:h.point.y})));
check(open.every(h=>h&&Math.abs(h.point.y-(visit.qa.baseY+.06))<.06),'architectural section exposes nave and crossing floor without altering terrain data',open.map(h=>h&&({component:h.object.userData.component,y:h.point.y})));
visit.selectFocus('sangre-cupula');check(all.some(m=>m.userData.component==='cupula-interior'&&visible(m))&&all.filter(m=>m.userData.component==='cupula-azul').every(m=>!visible(m)),'dome interior view retains the restored intrados while removing the external shell');visit.setSection(false);visit.selectFocus(null);
check(snapshots.every(s=>s.m.visible===s.visible),'closing the architectural section restores original mesh visibility');
check(Object.values(visit.focuses).filter(f=>f.requiresSection||f.interiorView).every(f=>f.fitBounds===false&&f.closeScale===false&&f.fov>=56),'interior cameras use explicit positions and FOV without automatic mobile offset scaling');
const dome=visit.qa.dome,artVertices=all.filter(m=>['clave-2024','cartelas-2024'].includes(m.userData.component)).flatMap(m=>{const a=m.geometry.attributes.position,values=[];for(let i=0;i<a.count;i++){const r=Math.hypot(a.getX(i)-dome.center.x,a.getZ(i)-dome.center.z),surface=dome.springY-.05+5.35*Math.sqrt(Math.max(0,1-(r/dome.radius)**2));values.push(a.getY(i)-surface);}return values;});
check(artVertices.length>0&&Math.max(...artVertices)<.001,'all cartouches and central-key vertices stay below the curved intrados and cannot pierce the blue shell',{maximumAboveIntradosM:Math.max(...artVertices)});
visit.selectFocus('sangre-cupula');visit.setSection(false);
const domeFocus=visit.focuses['sangre-cupula'],domeCamera=domeFocus.target.clone().add(new THREE.Vector3(...domeFocus.closeOffset)),rosetteRays=[];
for(let j=0;j<8;j++)for(const offset of[-.34,0,.34]){const a=j*Math.PI/4-sf.yaw,r=2.65+offset,target=new THREE.Vector3(dome.center.x+Math.cos(a)*r,dome.springY-.05+5.35*Math.sqrt(1-(r/dome.radius)**2)-.15,dome.center.z+Math.sin(a)*r),direction=target.clone().sub(domeCamera),h=hit(domeCamera.toArray(),direction.toArray(),direction.length()+.2);rosetteRays.push({cartouche:j+1,offset,visible:h?.object.userData.component==='cartelas-2024'&&h?.object.userData.materialKind==='gold',hit:h?.object.name});}
check(rosetteRays.every(r=>r.visible),'all twenty-four gilded cartouche rosettes are visible from the interior dome camera',rosetteRays.filter(r=>!r.visible));
visit.selectFocus(null);
const plan=read('sangre-plan'),mapResults=[];
for(const[w,h,large]of[[1340,850,true],[390,420,true],[320,220,false]]){const canvas=createCanvas(w,h),result=drawSangreMap(canvas,data,visitData,{large,heightAt,modelGeometry:plan,readingMode:'periods',selected:'sangre-cupula'});check(result?.targets.length===16,'sixteen map stops at '+w+'×'+h);check(result?.targets.every(t=>result.hitTarget(t.x,t.y)===t.id),'distinct map targets at '+w+'×'+h);mapResults.push({w,h,targets:result?.targets.length,components:result?.components});if(w===1340)fs.writeFileSync('research/validation-v15/sangre-model-plan.png',canvas.toBuffer('image/png'));}
check(drawSangreMap(createCanvas(400,300),data,visitData,{modelGeometry:{outline:[[NaN,0],null,['bad',2]]}})===null,'malformed map geometry fails closed');
const result={pass:errors.length===0,stats:visit.stats,checks,errors,portal:openingRays,chapels:chapelRays,presbyteryStairs:stairChecks,roofFront,rosetteRays,section:{closed:closed.map(h=>h&&({component:h.object.userData.component,y:h.point.y})),open:open.map(h=>h&&({component:h.object.userData.component,y:h.point.y}))},maps:mapResults,limitations:['The architectural model is a documented interpretation, not a metric survey.','This isolated geometry check supplements the integrated city/camera and visual checks.']};
fs.writeFileSync('research/validation-v15/sangre-model-qa.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,checks:checks.length,errors,stats:visit.stats},null,2));if(errors.length)process.exitCode=1;
