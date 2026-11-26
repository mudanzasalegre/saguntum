// Focused checks for V51: final terrain and architecture are tested together.
// Deliberately follows the walker's feet rather than casting at a fixed datum.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,THREE,buildCastleScene} from './castle-scene.mjs';

const {castle,visit,terrain,terrainMesh,groundBinding}=await buildCastleScene();
const checks=[],errors=[],warnings=[];
function check(pass,label,detail){checks.push({pass:!!pass,label,...(detail===undefined?{}:{detail})});if(!pass)errors.push(label);}
const finiteArray=a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);
const baselineCommit='f765f4a96948d6c045813b5f94adab39e2782f07';
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const baselineJson=file=>JSON.parse(execFileSync('git',['show',baselineCommit+':'+file],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const withoutCastle=value=>Object.fromEntries(Object.entries(value).filter(([id])=>id!=='castle'));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const previousGuide=baselineJson('dist/assets/data/castle-visit.json'),guide=readJson('dist/assets/data/castle-visit.json');
check(equal(guide.stops.map(s=>s.id),previousGuide.stops.map(s=>s.id)),'The 18 existing castle stop identifiers and order are preserved');
const unchanged=[];
for(const file of['dist/assets/territory/visit-stops.json','dist/assets/territory/visit-cameras.json','dist/assets/territory/atlas-frames.json']){
 const old=withoutCastle(baselineJson(file)),current=withoutCastle(readJson(file)),pass=equal(old,current);
 check(pass,'All other 31 destinations are unchanged in '+file);unchanged.push({file,pass,count:Object.keys(current).length});
}
const ray=new THREE.Raycaster();
const meshes=[];castle.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
const world=[castle,terrainMesh];
const vector=a=>new THREE.Vector3(...a);
const first=(objects,origin,direction,far=100)=>{
 ray.set(origin,direction);ray.near=0;ray.far=far;
 return ray.intersectObjects(objects,true).find(hit=>hit.object.isMesh);
};
const heightAt=(x,z,expected)=>{
 // Start just above the expected foot level so a roof cannot become the floor.
 // meshHeightAt evaluates the exact rendered terrain triangles without a
 // costly full-town ray for every foot sample. Raised stone still uses rays.
 const hit=first([castle],new THREE.Vector3(x,expected+.65,z),new THREE.Vector3(0,-1,0),2);
 const ground=terrain.meshHeightAt(x,z),validGround=ground<=expected+.65&&ground>=expected-1.35;
 if(hit&&(!validGround||hit.point.y>=ground))return{height:hit.point.y,mesh:hit.object.name};
 return validGround?{height:ground,mesh:terrainMesh.name}:null;
};
function inPolygon(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
 const a=p[i],b=p[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
}return inside;}
function edgeDistance(x,z,polygon){let d=Infinity;for(let i=0;i<polygon.length;i++){
 const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;
 const t=l?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l)):0;
 d=Math.min(d,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
}return d;}

const gate=visit.qa.almenara;
check(!!gate,'Almenara publishes the local threshold and facade contract');
const gateReport={samples:[],segments:[],oculi:[],rearSlits:[]};
if(gate){
 const line=gate.walkCenterline,validLine=Array.isArray(line)&&line.length>=2&&line.every(finiteArray);
 check(validLine,'Gate walking centreline has finite floor coordinates');
 check(Number.isFinite(gate.walkWidth)&&gate.walkWidth>=.8,'Gate has a usable authored walking width');
 check(finiteArray(gate.frontCenter)&&Number.isFinite(gate.facadeThickness)&&gate.facadeThickness>0,'Gate facade has an explicit origin and physical thickness');
 if(validLine&&Number.isFinite(gate.walkWidth)){
  // Preserve real terrain triangles around the gate; discard only distant
  // town triangles that cannot intersect this bounded walking corridor.
  const bounds={minX:Math.min(...line.map(p=>p[0]))-gate.walkWidth-2,maxX:Math.max(...line.map(p=>p[0]))+gate.walkWidth+2,
   minZ:Math.min(...line.map(p=>p[2]))-gate.walkWidth-2,maxZ:Math.max(...line.map(p=>p[2]))+gate.walkWidth+2};
  const tp=terrainMesh.geometry.attributes.position,ti=terrainMesh.geometry.index,count=ti?.count??tp.count,positions=[];
  for(let i=0;i<count;i+=3){
   const p=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(tp,ti?ti.getX(i+j):i+j).applyMatrix4(terrainMesh.matrixWorld));
   if(Math.max(...p.map(v=>v.x))<bounds.minX||Math.min(...p.map(v=>v.x))>bounds.maxX||Math.max(...p.map(v=>v.z))<bounds.minZ||Math.min(...p.map(v=>v.z))>bounds.maxZ)continue;
   for(const v of p)positions.push(...v.toArray());
  }
  const localGeometry=new THREE.BufferGeometry();localGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));localGeometry.computeVertexNormals();
  const localTerrain=new THREE.Mesh(localGeometry,terrainMesh.material);localTerrain.name=terrainMesh.name+' · exact gate subset';localTerrain.updateMatrixWorld(true);world[1]=localTerrain;
  gateReport.terrainTriangles=positions.length/9;
  // Three body-centre tracks cover the declared width with a 0.30 m radius.
  const lateral=Math.max(0,gate.walkWidth/2-.30),lanes=[-lateral,0,lateral];
  let supports=0,headClear=0,bodyClear=0,maxGroundError=0,maxFootJump=0,totalSamples=0,missing=0;
  for(let k=0;k<line.length-1;k++){
   const a=vector(line[k]),b=vector(line[k+1]),delta=b.clone().sub(a),length=Math.hypot(delta.x,delta.z);
   if(length<.05)continue;
   const tangent=new THREE.Vector3(delta.x/length,0,delta.z/length),side=new THREE.Vector3(-tangent.z,0,tangent.x);
   const count=Math.max(1,Math.ceil(length/.25));
   for(const u of lanes){let previous=null;
    for(let j=0;j<=count;j++){
     const p=a.clone().lerp(b,j/count).addScaledVector(side,u),floor=heightAt(p.x,p.z,p.y);totalSamples++;
     if(!floor){missing++;gateReport.samples.push({segment:k,u,t:j/count,missing:true});continue;}
     const error=Math.abs(floor.height-p.y);maxGroundError=Math.max(maxGroundError,error);if(error<=.20)supports++;
     const eye=new THREE.Vector3(p.x,floor.height+.035,p.z),head=first(world,eye,new THREE.Vector3(0,1,0),1.82);
     if(!head)headClear++;
     if(previous){
      const jump=Math.abs(floor.height-previous.floor);maxFootJump=Math.max(maxFootJump,jump);
      for(const h of[.35,1.0,1.7]){
       const from=new THREE.Vector3(previous.x,previous.floor+h,previous.z),to=new THREE.Vector3(p.x,floor.height+h,p.z),d=to.clone().sub(from);
       const hit=first(world,from,d.clone().normalize(),d.length()+.005);
       gateReport.segments.push({segment:k,u,height:h,clear:!hit,...(hit?{hit:hit.object.name,point:hit.point.toArray()}: {})});
       if(!hit)bodyClear++;
      }
     }
     gateReport.samples.push({segment:k,u,t:j/count,x:p.x,z:p.z,expected:p.y,actual:floor.height,floorMesh:floor.mesh,headClear:!head,...(head?{headHit:head.object.name}: {})});
     previous={x:p.x,z:p.z,floor:floor.height};
    }
   }
  }
  Object.assign(gateReport,{sampleCount:totalSamples,supports,missing,headClear,bodyClear,maxGroundError,maxFootJump});
  check(!missing&&supports===totalSamples,'Actual gate floor supports the complete authored walking corridor',{samples:totalSamples,missing,maxGroundError});
  check(headClear===totalSamples,'Terrain and architecture together leave 1.8 m headroom throughout the gate',{clear:headClear,total:totalSamples});
  check(gateReport.segments.every(s=>s.clear),'Body rays travel through the gate above its actual sloping floor',{clear:bodyClear,total:gateReport.segments.length});
  check(maxFootJump<=.245,'Gate floor has no accidental vertical jump above one stair riser',{maxFootJump,sampleStep:.25});
 }
 const oculi=gate.oculi;
 check(Array.isArray(oculi)&&oculi.length===2,'Both facade oculi have documented geometric probes');
 if(Array.isArray(oculi))for(const [index,o]of oculi.entries()){
  const valid=finiteArray(o.center)&&finiteArray(o.axis)&&o.radius>0&&o.wallThickness>0;
  check(valid,'Oculus '+(index+1)+' has a finite aperture and wall thickness');if(!valid)continue;
  const center=vector(o.center),axis=vector(o.axis).normalize(),side=new THREE.Vector3(axis.z,0,-axis.x);
  const localDepth=o.wallThickness+.8;
  const hole=first([castle],center.clone().addScaledVector(axis,localDepth),axis.clone().negate(),localDepth*2);
  // Measure the screen immediately beside the opening from just outside its
  // two faces. A ray launched beyond the entire chamber also measures the
  // separate rear stair/parapet, which is not the oculus-bearing facade.
  // Front-sided intersections from both directions still reject a solid deep
  // slab: a ray starting inside that slab cannot find the local back face.
  const probe=center.clone().addScaledVector(side,o.radius+.18),reach=o.wallThickness/2+.2;
  const near=first([castle],probe.clone().addScaledVector(axis,reach),axis.clone().negate(),reach*2);
  const far=first([castle],probe.clone().addScaledVector(axis,-reach),axis,reach*2);
  const thickness=near&&far?Math.abs(near.point.clone().sub(far.point).dot(axis)):Infinity;
  const frontDepth=near?.point.clone().sub(probe).dot(axis),backDepth=far?.point.clone().sub(probe).dot(axis);
  gateReport.oculi.push({index,open:!hole,measuredThickness:thickness,expectedThickness:o.wallThickness,probeReach:reach,frontDepth,backDepth,frontHit:near?.object.name,backHit:far?.object.name});
  check(!hole,'Oculus '+(index+1)+' is physically open through the facade');
  check(Number.isFinite(thickness)&&thickness>=o.wallThickness-.10&&thickness<=o.wallThickness+.55&&frontDepth>=o.wallThickness/2-.1&&backDepth<=-o.wallThickness/2+.1,'Oculus '+(index+1)+' belongs to the thin facade rather than a solid passage-depth slab',{thickness,expected:o.wallThickness,frontDepth,backDepth});
 }
 const slits=gate.rearSlits||[];
 check(slits.length===3,'The eastern facade has the three documented narrow openings');
 for(const [index,slit]of slits.entries()){
  const valid=finiteArray(slit.center)&&finiteArray(slit.axis)&&slit.width>0&&slit.height>0&&slit.wallThickness>0;
  check(valid,'Rear slit '+(index+1)+' has a finite geometric probe');if(!valid)continue;
  const center=vector(slit.center),axis=vector(slit.axis).normalize(),side=new THREE.Vector3(axis.z,0,-axis.x),reach=slit.wallThickness+.35;
  let clear=0,total=0;
  for(const u of[-.2,0,.2])for(const v of[-.25,0,.25]){
   const point=center.clone().addScaledVector(side,u*slit.width).add(new THREE.Vector3(0,v*slit.height,0));
   const hit=first([castle],point.addScaledVector(axis,reach),axis.clone().negate(),2*reach);total++;if(!hit)clear++;
  }
  gateReport.rearSlits.push({index,clear,total});
  check(clear===total,'Rear slit '+(index+1)+' remains physically open',{clear,total});
 }
}

const forum=visit.qa.forum,forumReport={surfaces:[],foundations:[]};
check(!!forum,'Forum publishes separate surface and foundation components');
if(forum){
 const surfaces=forum.surfaces||[],foundationComponents=forum.foundationComponents||[];
 check(surfaces.length>0&&surfaces.every(s=>s.component&&s.polygon?.length>=3),'Forum surfaces have independent footprints and component names');
 for(const surface of surfaces){
  const selected=meshes.filter(m=>m.userData.component===surface.component&&(!surface.materialKind||m.userData.materialKind===surface.materialKind)),p=surface.polygon;
  if(!p?.length){continue;}
  let triangles=0,buried=0,minClearance=Infinity,nonFinite=0;
  for(const mesh of selected){
   const positions=mesh.geometry.attributes.position,index=mesh.geometry.index,n=index?.count??positions.count;
   for(let i=0;i<n;i+=3){
    const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(positions,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
    const normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));if(normal.y<=0)continue;
    const center=v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1/3);if(!inPolygon(center.x,center.z,p))continue;
    triangles++;if(!center.toArray().every(Number.isFinite)){nonFinite++;continue;}
    const clearance=center.y-terrain.meshHeightAt(center.x,center.z);minClearance=Math.min(minClearance,clearance);if(clearance<-.035)buried++;
   }
  }
  // A declared sub-area may be supported by larger triangles of the parent
  // landing, whose centroids fall outside the small sub-area. Verify actual
  // interior rays instead of requiring a duplicate coplanar cap just to add
  // centroids inside the sub-area.
  let sharedSupport=null;
  if(surface.sharedSurface){
   sharedSupport={surface:surface.sharedSurface,samples:0,missing:0,buried:0,maxHeightError:0};
   const minX=Math.min(...p.map(v=>v.x)),maxX=Math.max(...p.map(v=>v.x)),minZ=Math.min(...p.map(v=>v.z)),maxZ=Math.max(...p.map(v=>v.z));
   const shortest=Math.min(...p.map((a,i)=>Math.hypot(a.x-p[(i+1)%p.length].x,a.z-p[(i+1)%p.length].z)).filter(v=>v>.02));
   const step=Math.min(.3,shortest/3),inset=Math.min(.08,shortest/6);
   for(let x=minX+step/2;x<maxX;x+=step)for(let z=minZ+step/2;z<maxZ;z+=step){
    if(!inPolygon(x,z,p)||edgeDistance(x,z,p)<inset)continue;
    sharedSupport.samples++;
    const expected=surface.height??terrain.meshHeightAt(x,z)+(surface.offset??.125);
    const hit=first(selected,new THREE.Vector3(x,expected+.08,z),new THREE.Vector3(0,-1,0),.20);
    if(!hit){sharedSupport.missing++;continue;}
    sharedSupport.maxHeightError=Math.max(sharedSupport.maxHeightError,Math.abs(hit.point.y-expected));
    if(hit.point.y<terrain.meshHeightAt(x,z)-.035)sharedSupport.buried++;
   }
  }
  const sharedValid=sharedSupport&&sharedSupport.samples>=4&&!sharedSupport.missing&&!sharedSupport.buried&&sharedSupport.maxHeightError<.03;
  const report={id:surface.id,component:surface.component,triangles,buried,minClearance,nonFinite,...(sharedSupport?{sharedSupport}:{})};
  check((sharedSupport?sharedValid:triangles>0)&&!nonFinite&&!buried,'Forum '+surface.id+' has visible supported surface faces',report);
  if(surface.walkable){
   const bounds={minX:Math.min(...p.map(v=>v.x)),maxX:Math.max(...p.map(v=>v.x)),minZ:Math.min(...p.map(v=>v.z)),maxZ:Math.max(...p.map(v=>v.z))};
   const shortEdge=Math.min(...p.map((a,i)=>Math.hypot(a.x-p[(i+1)%p.length].x,a.z-p[(i+1)%p.length].z)).filter(length=>length>.02));
   const spacing=Math.min(.7,Math.max(.16,shortEdge/3)),inset=Math.min(.6,shortEdge*.18),probeStep=Math.min(.25,shortEdge/4);
   let pairs=0,unexpectedJumps=0,maximumJump=0;const discontinuities=[];
   for(let x=bounds.minX+spacing/2;x<bounds.maxX;x+=spacing)for(let z=bounds.minZ+spacing/2;z<bounds.maxZ;z+=spacing){
    if(!inPolygon(x,z,p)||edgeDistance(x,z,p)<inset)continue;
    // Deliberate ruins/columns standing on a terrace are obstacles, not floor
    // defects. Probe the declared surface's real top faces just around its
    // authored level, separately from the whole-corridor gate collision test.
    const expected=surface.height??terrain.meshHeightAt(x,z)+(surface.offset??.125);
    const sample=(sx,sz,sy)=>{const hit=first(selected,new THREE.Vector3(sx,sy+.08,sz),new THREE.Vector3(0,-1,0),.20);return hit?hit.point.y:null;};
    const a=sample(x,z,expected);if(a===null)continue;
    for(const [dx,dz]of[[probeStep,0],[0,probeStep]]){
     if(!inPolygon(x+dx,z+dz,p)||edgeDistance(x+dx,z+dz,p)<inset*.65)continue;
     const reference=surface.height??terrain.meshHeightAt(x+dx,z+dz)+(surface.offset??.125),b=sample(x+dx,z+dz,reference);if(b===null)continue;
     const jump=Math.abs(b-a);pairs++;maximumJump=Math.max(maximumJump,jump);
     if(jump>(surface.maxInteriorStep??.16)){unexpectedJumps++;if(discontinuities.length<30)discontinuities.push({x,z,dx,dz,a,b,jump});}
    }
   }
   Object.assign(report,{continuityPairs:pairs,unexpectedJumps,maximumJump,discontinuities});
   check(pairs>0&&!unexpectedJumps,'Forum '+surface.id+' has no accidental steps inside its walking surface',{pairs,unexpectedJumps,maximumJump});
  }
  forumReport.surfaces.push(report);
 }
 check(foundationComponents.length>0,'Surviving forum foundations are explicitly identified for terrain checks');
 const supportMeshes=meshes.filter(m=>['forum-earth','forum-gravel','paving','path','worn-ashlar'].includes(m.userData.materialKind)||m.userData.publicWalkingSurface);
 for(const component of foundationComponents){
  const selected=meshes.filter(m=>m.userData.component===component&&!['forum-earth','forum-gravel'].includes(m.userData.materialKind));
  const probes=visit.qa.wallBases.filter(p=>p.component===component),failures=[];
  let buried=0,floating=0,missing=0;
  for(const p of probes){
   const d=Math.min(.13,(p.thickness||.68)*.17),hits=[];
   // Check actual stone beside the centre joint in multi-course foundations.
   for(const [dx,dz]of[[0,0],[d,0],[-d,0],[0,d],[0,-d]]){
    const hit=first(selected,new THREE.Vector3(p.x+dx,p.top+.5,p.z+dz),new THREE.Vector3(0,-1,0),p.top-p.bottom+1);
    if(hit)hits.push(hit);
   }
   const ground=terrain.meshHeightAt(p.x,p.z),top=hits.length?Math.max(...hits.map(h=>h.point.y)):null;
   if(top===null){missing++;if(failures.length<20)failures.push({...p,issue:'missing'});continue;}
   if(top<ground-.04){buried++;if(failures.length<20)failures.push({...p,actualTop:top,ground,issue:'buried'});}
   if(p.bottom>ground+.20){
    // Curia walls stand on the raised gravel landing. Probe that actual
    // surface, excluding the wall itself so a floating first course cannot
    // count as its own support.
    const support=first(supportMeshes,new THREE.Vector3(p.x,p.bottom+.35,p.z),new THREE.Vector3(0,-1,0),p.bottom-ground+.45);
    if(!support||p.bottom-support.point.y>.20){floating++;if(failures.length<20)failures.push({...p,ground,support:support?.point.y,issue:'floating'});}
   }
  }
  const report={component,probes:probes.length,buried,floating,missing,failures};forumReport.foundations.push(report);
  check(probes.length>0&&!buried&&!floating&&!missing,'Forum '+component+' foundations meet the final terrain',report);
 }
}

const sourceFiles=fs.readdirSync(path.join(root,'dist/js')).filter(f=>/^castle.*\.js$/.test(f)).map(f=>'dist/js/'+f);
sourceFiles.push('dist/js/monuments.js','dist/js/territory-heritage-models.js','dist/js/territory-heritage-relief.js');
const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const report={pass:errors.length===0,method:'Actual Three.js architecture and final Atlas terrain; independently ray-tested foot corridor, facade depth, visible archaeology and surface continuity',baselineCommit,unchanged,groundBinding,sourceHashes,checks,errors,warnings,gate:gateReport,forum:forumReport,
 limitations:['These checks validate the model geometry, not public access to the monument.','Authored dimensions and floor levels retain their documented or interpretive status.','No browser rendering or GPU timing is measured.']};
const out=path.join(root,'research/validation-v51/forum-almenara-qa.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,checks:checks.length,errors,gate:{samples:gateReport.sampleCount,maxGroundError:gateReport.maxGroundError,maxFootJump:gateReport.maxFootJump},forum:forumReport,out},null,2));
if(errors.length)process.exitCode=1;
