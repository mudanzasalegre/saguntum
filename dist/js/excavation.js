import * as THREE from 'three';
import {excavationOutline,excavationTriangles,triangleCut,insideTriangleCut} from './polygon-excavation.js';

// A local excavation is a window through the present-day scene. The source
// geometry is never changed; temporary material clones carry the clipping planes.
export function rectangleFrame(cut) {
  const c=Math.cos(cut.yaw||0),s=Math.sin(cut.yaw||0);
  return {u:new THREE.Vector3(c,0,-s),v:new THREE.Vector3(s,0,c),center:new THREE.Vector3(cut.center.x,0,cut.center.z)};
}
export function excavationPlanes(cut) {
  const {u,v,center}=rectangleFrame(cut);
  return [[u,cut.width/2],[v,cut.depth/2]].flatMap(([axis,half])=>[
    new THREE.Plane(axis.clone(),-axis.dot(center)-half),
    new THREE.Plane(axis.clone().negate(),axis.dot(center)-half)
  ]);
}
export function insideExcavation(cut,x,z,margin=0) {
  if(cut.outline)return excavationTriangles(cut).some(t=>{const packed=triangleCut(t);return packed&&insideTriangleCut(packed,x,z);});
  const {u,v,center}=rectangleFrame(cut),p=new THREE.Vector3(x,0,z).sub(center);
  return Math.abs(p.dot(u))<=cut.width/2+margin&&Math.abs(p.dot(v))<=cut.depth/2+margin;
}
// Exact, one-time subtraction for an already open archaeological pit. This
// keeps the circus excavation open even when another catalogue place is active.
export function openPermanentExcavations(roots,windows){
  const statistics={windows:windows.length,meshes:0,removedTriangles:0,addedTriangles:0},seen=new Set();
  for(const root of roots)root?.updateWorldMatrix(true,true);
  const pieces=windows.flatMap(window=>window.outline?excavationTriangles(window).map(outline=>({...window,outline})):[window]);
  for(const window of pieces){const points=window.outline?excavationOutline(window).map(p=>new THREE.Vector3(p.x,0,p.z)):corners(window);
    const center=new THREE.Vector3();for(const p of points)center.add(p);center.multiplyScalar(1/points.length);
    const planes=window.outline?points.map((p,i)=>{const q=points[(i+1)%points.length],normal=new THREE.Vector3(q.z-p.z,0,p.x-q.x).normalize(),plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,p);if(plane.distanceToPoint(center)>0)plane.negate();return plane;}):excavationPlanes(window);
    const bounds=new THREE.Box3().setFromPoints(points);bounds.min.y=-100;bounds.max.y=1000;
    seen.clear();for(const root of roots)root?.traverse(mesh=>{
      if(!mesh.isMesh||mesh.isInstancedMesh||seen.has(mesh))return;seen.add(mesh);
      if(!new THREE.Box3().setFromObject(mesh).intersectsBox(bounds))return;
      const source=mesh.geometry,p=source.attributes.position,attributes=Object.entries(source.attributes),index=source.index,triangleCount=(index?.count||p.count)/3;
      let arrays=null,nextIndex=p.count,changed=0;const indices=[],world=new THREE.Vector3();
      const getVertex=i=>{world.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);return {index:i,world:world.clone(),values:Object.fromEntries(attributes.map(([name,a])=>[name,Array.from(a.array.subarray(i*a.itemSize,(i+1)*a.itemSize))]))};};
      const blend=(a,b,t)=>({index:null,world:a.world.clone().lerp(b.world,t),values:Object.fromEntries(attributes.map(([name])=>[name,a.values[name].map((value,i)=>THREE.MathUtils.lerp(value,b.values[name][i],t))]))});
      const split=(poly,plane)=>{const positive=[],negative=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],da=plane.distanceToPoint(a.world),db=plane.distanceToPoint(b.world);(da>=0?positive:negative).push(a);if((da>=0)!==(db>=0)){const q=blend(a,b,da/(da-db));positive.push(q);negative.push(q);}}return {positive,negative};};
      const append=vertex=>{if(vertex.index!==null)return vertex.index;if(!arrays)arrays=Object.fromEntries(attributes.map(([name,a])=>[name,Array.from(a.array)]));vertex.index=nextIndex++;for(const[name]of attributes)arrays[name].push(...vertex.values[name]);return vertex.index;};
      for(let t=0;t<triangleCount;t++){
        const ids=[0,1,2].map(j=>index?index.getX(t*3+j):t*3+j),vs=ids.map(i=>new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));
        if(planes.some(plane=>vs.every(v=>plane.distanceToPoint(v)>=-1e-7))){indices.push(...ids);continue;}
        changed++;let poly=ids.map(getVertex);for(const plane of planes){if(poly.length<3)break;const {positive,negative}=split(poly,plane);for(let j=1;j<positive.length-1;j++){const a=positive[0],b=positive[j],c=positive[j+1];if(b.world.clone().sub(a.world).cross(c.world.clone().sub(a.world)).lengthSq()>1e-12){indices.push(append(a),append(b),append(c));statistics.addedTriangles++;}}poly=negative;}
      }
      if(changed){const geometry=source.clone();if(arrays)for(const[name,a]of attributes)geometry.setAttribute(name,new THREE.Float32BufferAttribute(arrays[name],a.itemSize,a.normalized));geometry.setIndex(indices);geometry.computeBoundingSphere();geometry.userData={...source.userData,openArchaeologicalPit:true};mesh.geometry=geometry;statistics.meshes++;statistics.removedTriangles+=changed;source.dispose();}
    });
  }return statistics;
}
function corners(cut) {
  const {u,v,center}=rectangleFrame(cut);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>center.clone().addScaledVector(u,a*cut.width/2).addScaledVector(v,b*cut.depth/2));
}
function soilMesh(cut,heightAt,{slab=false}={}) {
  const pts=corners(cut),positions=[],colors=[];
  const shades=['#625344','#85705a','#ab8e68','#c3aa80'].map(c=>new THREE.Color(c));
  const tri=(a,b,c,color)=>{for(const p of [a,b,c]){positions.push(p.x,p.y,p.z);colors.push(color.r,color.g,color.b);}};
  // Expository soil bands, not a claimed measured stratigraphic section.
  for(let edge=0;edge<4;edge++){
    const a=pts[edge],b=pts[(edge+1)%4],n=Math.ceil(a.distanceTo(b)/1.5);
    for(let j=0;j<n;j++){
      const p=a.clone().lerp(b,j/n),q=a.clone().lerp(b,(j+1)/n);
      const hp=Math.max(cut.floorY+.05,heightAt(p.x,p.z)),hq=Math.max(cut.floorY+.05,heightAt(q.x,q.z));
      for(let band=0;band<4;band++){
        const low=band/4,high=(band+1)/4;
        const pl=p.clone().setY(THREE.MathUtils.lerp(cut.floorY,hp,low)),ph=p.clone().setY(THREE.MathUtils.lerp(cut.floorY,hp,high));
        const ql=q.clone().setY(THREE.MathUtils.lerp(cut.floorY,hq,low)),qh=q.clone().setY(THREE.MathUtils.lerp(cut.floorY,hq,high));
        tri(pl,ql,qh,shades[band]);tri(pl,qh,ph,shades[band]);
      }
    }
  }
  const base=pts.map(p=>p.clone().setY(cut.floorY-.035));
  tri(base[0],base[2],base[1],shades[0]);tri(base[0],base[3],base[2],shades[0]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide,transparent:slab});
  const mesh=new THREE.Mesh(geometry,material);mesh.name=slab?'Bloque de suelo desplazado':'Sección expositiva del terreno';mesh.receiveShadow=true;mesh.castShadow=slab;mesh.userData.expositorySoil=true;return mesh;
}

export function createExcavationController({scene,renderer,sites,contextRoots,terrainMeshes,heightAt}) {
  const group=new THREE.Group();group.name='Ventana arqueológica';scene.add(group);
  const lift=new THREE.Group();lift.name='Suelo y contexto levantados';group.add(lift);
  let selected=null,focusId=null,mode='current',opening=1,hypotheses=true,roofOpen=true,coverShown=true;
  let restorations=[],temporaryMaterials=[],liftPlanes=[],baseLiftPlanes=[],pit=null,slab=null,cut=null,activeCutObjects=[];
  const baseObjects=new WeakMap();
  renderer.localClippingEnabled=true;
  const currentSite=()=>sites[selected];
  const currentFocus=()=>{const s=currentSite();return s?.focuses?.find(f=>f.id===focusId)||s;};
  const dirty=()=>{renderer.shadowMap.needsUpdate=true;};
  function restoreCutObjects(){for(const entry of activeCutObjects){const state=baseObjects.get(entry.object);if(!state)continue;entry.object.position.y=state.y;entry.object.visible=state.visible;for(const [material,opacity,transparent,depthWrite] of state.materials){material.opacity=opacity;material.transparent=transparent;material.depthWrite=depthWrite;material.needsUpdate=true;}}activeCutObjects=[];}
  function clearWindow(){
    restoreCutObjects();for(const [mesh,material] of restorations)mesh.material=material;restorations=[];
    for(const material of temporaryMaterials)material.dispose();temporaryMaterials=[];
    for(const child of lift.children)if(child.isInstancedMesh)child.dispose();lift.clear();lift.position.set(0,0,0);liftPlanes=[];baseLiftPlanes=[];
    if(pit){group.remove(pit);pit.geometry.dispose();pit.material.dispose();pit=null;}
    if(slab){slab.geometry.dispose();slab.material.dispose();slab=null;}
    cut=null;
  }
  function clipContext(window,withCover,clipTerrain=true){
    cut=window;const planes=excavationPlanes(window),reverse=planes.map(p=>p.clone().negate());baseLiftPlanes=reverse.map(p=>p.clone());liftPlanes=reverse;
    const siteContext=window.includeSiteContext?currentSite()?.group?.userData.context?.group:null;
    const allRoots=[...(window.clipContext===false?[]:contextRoots),...(siteContext?[siteContext]:[]),...(clipTerrain?terrainMeshes:[])],meshes=new Set(),originalMaterials=new Map(),coverMaterials=new Map();
    const clipBounds=new THREE.Box3().setFromPoints(corners(window));clipBounds.min.y=-100;clipBounds.max.y=1000;
    scene.updateMatrixWorld(true);
    const convert=(material,cover)=>{
      const cache=cover?coverMaterials:originalMaterials;if(cache.has(material))return cache.get(material);
      const clone=material.clone();clone.clippingPlanes=cover?liftPlanes:planes;clone.clipIntersection=!cover;clone.clipShadows=true;
      if(cover){clone.transparent=true;clone.depthWrite=false;clone.userData.originalOpacity=material.opacity;clone.userData.originalDepthWrite=material.depthWrite;}
      temporaryMaterials.push(clone);cache.set(material,clone);return clone;
    };
    for(const root of allRoots)root?.traverse(mesh=>{if(!mesh.isMesh||meshes.has(mesh))return;meshes.add(mesh);
      if(!new THREE.Box3().setFromObject(mesh).intersectsBox(clipBounds))return;
      const original=mesh.material;restorations.push([mesh,original]);mesh.material=Array.isArray(original)?original.map(m=>convert(m,false)):convert(original,false);
      if(withCover){const copy=mesh.clone(false);copy.material=Array.isArray(original)?original.map(m=>convert(m,true)):convert(original,true);copy.matrix.copy(mesh.matrixWorld);copy.matrixAutoUpdate=false;copy.castShadow=false;copy.receiveShadow=true;copy.userData.source=mesh;copy.renderOrder=2;lift.add(copy);}
    });
    if(clipTerrain&&Number.isFinite(window.floorY)){pit=soilMesh(window,heightAt);group.add(pit);if(withCover){slab=soilMesh(window,heightAt,{slab:true});slab.castShadow=false;lift.add(slab);}}
  }
  function updateVisibility(){
    for(const site of Object.values(sites)){
      const historic=site.id===selected&&mode==='historical';
      if(site.remains)site.remains.visible=!historic||!!site.focuses;
      if(site.reconstruction)site.reconstruction.visible=historic;
      if(site.hypotheses)site.hypotheses.visible=historic&&hypotheses;
      for(const focus of site.focuses||[]){const active=focus.id===focusId;
        if(focus.remains)focus.remains.visible=!historic||!active;
        if(focus.reconstruction)focus.reconstruction.visible=historic&&active;
        if(focus.hypotheses)focus.hypotheses.visible=historic&&active&&hypotheses;
      }
      site.setPresentation?.({selected:site.id===selected,focusId:site.id===selected?focusId:null,mode:site.id===selected?mode:'current',opening,coverShown,roofOpen,hypotheses});
    }
    const s=currentSite(),f=currentFocus();for(const roof of (f?.roofs||s?.roofs||[])){const obj=roof.object||roof;obj.visible=!roofOpen;}
    lift.visible=mode==='cut'&&coverShown;
    for(const copy of lift.children){if(!copy.userData.source)continue;let visible=true;for(let o=copy.userData.source;o;o=o.parent)visible=visible&&o.visible;copy.visible=visible;}
  }
  function moveCovers(t){
    for(const entry of activeCutObjects){const state=baseObjects.get(entry.object);if(!state)continue;entry.object.position.y=state.y+(entry.rise||3.5)*t;for(const [material,opacity,transparent,depthWrite] of state.materials){material.opacity=opacity*(1-(entry.fade??.55)*t);material.transparent=t>0||transparent;material.depthWrite=t<.05?depthWrite:false;material.needsUpdate=true;}}
  }
  function applyOpening(value){
    opening=THREE.MathUtils.clamp(value,0,1);
    if(mode!=='cut'||!cut)return;
    const t=opening*opening*(3-2*opening),view=currentFocus()?.views||currentSite()?.views;
    const offset=view?.offset||[1,1,1],away=new THREE.Vector3(-offset[0],0,-offset[2]).normalize(),side=new THREE.Vector3(-away.z,0,away.x);
    const displacement=away.multiplyScalar(Math.max(cut.width,cut.depth)*.95*t).addScaledVector(side,Math.min(cut.width,cut.depth)*.35*t);displacement.y=(14+Math.max(cut.width,cut.depth)*.12)*t;
    lift.position.copy(displacement);
    for(let i=0;i<liftPlanes.length;i++){liftPlanes[i].copy(baseLiftPlanes[i]);liftPlanes[i].constant-=liftPlanes[i].normal.dot(displacement);}
    for(const material of temporaryMaterials)if(material.userData.originalOpacity!==undefined){material.opacity=material.userData.originalOpacity*(1-.85*t);material.depthWrite=t<.03?material.userData.originalDepthWrite:false;}
    if(slab){slab.material.opacity=1-.82*t;slab.material.depthWrite=t<.05;}
    moveCovers(t);
    currentSite()?.setPresentation?.({selected:true,focusId,mode,opening,coverShown,roofOpen,hypotheses});
    dirty();
  }
  function rebuild(){
    clearWindow();updateVisibility();const site=currentSite(),focus=currentFocus();if(!site)return dirty();
    const window=mode==='cut'?(focus.cut||site.cut):mode==='historical'?(focus.historicalMask||focus.cut||site.historicalMask||site.cut):(focus.currentMask||site.currentMask);
    if(window)clipContext(window,mode==='cut',window.clipTerrain!==false);
    updateVisibility();
    if(mode==='cut'||mode==='historical'){
      activeCutObjects=focus.cutObjects||site.cutObjects||[];
      for(const entry of activeCutObjects){if(!baseObjects.has(entry.object)){const materials=new Set();entry.object.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});baseObjects.set(entry.object,{y:entry.object.position.y,visible:entry.object.visible,materials:[...materials].map(m=>[m,m.opacity,m.transparent,m.depthWrite])});}}
      if(mode==='cut')applyOpening(opening);else moveCovers(roofOpen?1:0);
    }
    dirty();
  }
  function select(id,{focus:nextFocus,mode:nextMode}={}) {
    selected=sites[id]?id:null;const site=currentSite();focusId=nextFocus||site?.focuses?.[0]?.id||null;
    const focused=currentFocus();mode=nextMode||(focused?.cut?'cut':'current');if(mode==='cut'&&!focused?.cut&&!site?.cut)mode='current';opening=1;roofOpen=true;rebuild();
  }
  function setMode(next){const s=currentSite(),f=currentFocus();if(!s)return;if(next==='cut'&&!f.cut&&!s.cut)return;mode=next;rebuild();}
  function setFocus(id){const site=currentSite();if(!site?.focuses?.some(f=>f.id===id))return;focusId=id;rebuild();}
  function bounds(){const site=currentSite(),focus=currentFocus();if(!site)return null;const box=new THREE.Box3();
    const objects=mode==='historical'?[focus.reconstruction||site.reconstruction,...(hypotheses?[focus.hypotheses||site.hypotheses]:[])]:[focus.remains||site.remains];
    const covers=new Set((focus.cutObjects||site.cutObjects||[]).map(c=>c.object));
    for(const object of objects)if(object){object.updateMatrixWorld(true);object.traverseVisible(o=>{let include=true;for(let parent=o;parent;parent=parent.parent)if(!parent.visible||covers.has(parent))include=false;if(o.isMesh&&include){o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});}
    const window=mode==='historical'?(focus.historicalMask||focus.cut||site.historicalMask):(focus.cut||site.cut||focus.currentMask||site.currentMask);
    if(window){for(const p of corners(window)){box.expandByPoint(p.clone().setY(heightAt(p.x,p.z)));if(Number.isFinite(window.floorY))box.expandByPoint(p.clone().setY(window.floorY));}}
    if(mode==='current'&&['portic','domus'].includes(selected)){const y=heightAt(focus.point.x,focus.point.z);box.min.y=y;box.max.y=y+18;}
    return box.isEmpty()?null:box;
  }
  function groundAt(x,z,fallback){const site=currentSite();return cut&&insideExcavation(cut,x,z)&&Number.isFinite(cut.floorY)&&(!site?.containsSubsurface||site.containsSubsurface(x,z))?cut.floorY:fallback;}
  updateVisibility();return {group,select,setMode,setFocus,setOpening:applyOpening,setCoverShown(value){coverShown=!!value;updateVisibility();dirty();},setHypotheses(value){hypotheses=!!value;updateVisibility();dirty();},setRoofOpen(value){roofOpen=!!value;updateVisibility();if(mode==='historical')moveCovers(roofOpen?1:0);dirty();},updateContext(change){clearWindow();change();rebuild();},syncVisibility(){updateVisibility();dirty();},bounds,groundAt,get state(){return{selected,focusId,mode,opening,hypotheses,roofOpen,coverShown,cut,site:currentSite(),focus:currentFocus()};},dispose(){clearWindow();scene.remove(group);}};
}
