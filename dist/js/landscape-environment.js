import * as THREE from 'three';
import {Water} from '../assets/vendor/Water.js';

// Only supplied open-water polygons become water. Neither river centerlines nor
// protected wetland boundaries imply a flooded surface.
const CELL = 160, RAY_BAND = 48;
let reflectionInProgress = false;

function projectedRing(coordinates, project) {
  if (!Array.isArray(coordinates) || coordinates.length < 3) return null;
  const ring = [];
  for (const coordinate of coordinates) {
    if (!Array.isArray(coordinate) || !coordinate.every(Number.isFinite)) return null;
    const p = project(...coordinate);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) return null;
    if (!ring.length || Math.hypot(p.x-ring.at(-1).x, p.z-ring.at(-1).z) > .0001) ring.push({x:p.x,z:p.z});
  }
  if (ring.length > 2 && Math.hypot(ring[0].x-ring.at(-1).x,ring[0].z-ring.at(-1).z) < .0001) ring.pop();
  return ring.length >= 3 ? ring : null;
}
function area(ring) {
  let sum=0;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++)sum+=ring[j].x*ring[i].z-ring[i].x*ring[j].z;
  return Math.abs(sum)*.5;
}
function ringTest(ring) {
  const bands=new Map();
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[j],b=ring[i];
    if(a.z===b.z)continue;
    for(let k=Math.floor(Math.min(a.z,b.z)/RAY_BAND);k<=Math.floor(Math.max(a.z,b.z)/RAY_BAND);k++) {
      if(!bands.has(k))bands.set(k,[]);
      bands.get(k).push([a,b]);
    }
  }
  return(x,z)=>{
    let inside=false;
    for(const [a,b] of bands.get(Math.floor(z/RAY_BAND))||[])
      if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
    return inside;
  };
}

export function createLandscapeWaterMask(data, project) {
  const surfaces=[],cells=new Map();let skippedSurfaces=0;
  for(const source of data.surfaces||[]) {
    if(source.intermittent===true||source.intermittent==='yes'||source.dry===true){skippedSurfaces++;continue;}
    const outer=projectedRing(source.outer,project),holes=(source.holes||[]).map(h=>projectedRing(h,project));
    if(!outer||holes.some(h=>!h)||!Number.isFinite(source.levelM)){skippedSurfaces++;continue;}
    const areaM2=area(outer)-holes.reduce((sum,h)=>sum+area(h),0);
    if(areaM2<.01){skippedSurfaces++;continue;}
    const bounds={minX:Math.min(...outer.map(p=>p.x)),maxX:Math.max(...outer.map(p=>p.x)),minZ:Math.min(...outer.map(p=>p.z)),maxZ:Math.max(...outer.map(p=>p.z))};
    const insideOuter=ringTest(outer),insideHoles=holes.map(ringTest);
    const surface={...source,outer,holes,areaM2,...bounds,depthM:Number.isFinite(source.depthM)?Math.max(0,source.depthM):.65};
    surface.contains=(x,z)=>x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ&&insideOuter(x,z)&&!insideHoles.some(inside=>inside(x,z));
    surfaces.push(surface);
  }
  // Prefer the smaller local basin if source polygons overlap a broad sea area.
  const ordered=[...surfaces].sort((a,b)=>a.areaM2-b.areaM2);
  for(const surface of ordered)for(let x=Math.floor(surface.minX/CELL);x<=Math.floor(surface.maxX/CELL);x++)for(let z=Math.floor(surface.minZ/CELL);z<=Math.floor(surface.maxZ/CELL);z++) {
    const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(surface);
  }
  const surfaceAt=(x,z)=>{
    if(!Number.isFinite(x)||!Number.isFinite(z))return null;
    return(cells.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]).find(s=>s.contains(x,z))||null;
  };
  return{
    surfaces,surfaceAt,isWater:(x,z)=>surfaceAt(x,z)!==null,
    groundHeight:(heightAt)=>(x,z)=>{
      const original=heightAt(x,z),surface=surfaceAt(x,z);
      return surface?Math.min(original,surface.levelM-surface.depthM):original;
    },
    stats:{surfaces:surfaces.length,skippedSurfaces,levelNote:data.levelNote||'Individual display levels; not live measurements.',bathymetry:data.seabedNote||'Display-only depressions under opaque water; original elevation data retained.'}
  };
}

export function createLandscapeWaterGeometry(surfaces) {
  const shapes=surfaces.map(surface=>{
    const shape=new THREE.Shape(surface.outer.map(p=>new THREE.Vector2(p.x,-p.z)));
    for(const hole of surface.holes)shape.holes.push(new THREE.Path(hole.map(p=>new THREE.Vector2(p.x,-p.z))));
    return shape;
  });
  const geometry=new THREE.ShapeGeometry(shapes);
  // World-scale UVs keep ripples consistent between large and small ponds.
  const position=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/18,position.getY(i)/18);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}
function waveNormals(size,strength) {
  const bytes=new Uint8Array(size*size*4),n=new THREE.Vector3();
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const u=x/size*Math.PI*2,v=y/size*Math.PI*2;
    const dx=strength*(.65*Math.cos(7*u+3*v)+.27*Math.cos(17*u-5*v)+.12*Math.cos(31*u+19*v));
    const dy=strength*(.56*Math.cos(3*u+9*v)+.23*Math.cos(11*u-21*v)+.10*Math.cos(29*u+23*v));
    n.set(-dx,-dy,1).normalize();const i=(y*size+x)*4;
    bytes[i]=Math.round((n.x*.5+.5)*255);bytes[i+1]=Math.round((n.y*.5+.5)*255);bytes[i+2]=Math.round((n.z*.5+.5)*255);bytes[i+3]=255;
  }
  const texture=new THREE.DataTexture(bytes,size,size,THREE.RGBAFormat);
  texture.name='Ondulación procedural del paisaje';texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

export function createLandscapeEnvironment({data,project,mask,mobile=false,reduced=false}) {
  mask=mask||createLandscapeWaterMask(data,project);
  const group=new THREE.Group();group.name='Agua del paisaje · '+(data.region||'territorio');
  const seaNormals=waveNormals(mobile?128:256,.34),inlandNormals=waveNormals(128,.15);
  const planar=[],ordinary=[],targets=new Set(),meshes=[];let disposed=false,clock=0;
  const bySeaLevel=new Map(),inland=[];
  for(const surface of mask.surfaces) {
    if(surface.kind==='sea'){
      const key=surface.levelM;if(!bySeaLevel.has(key))bySeaLevel.set(key,[]);bySeaLevel.get(key).push(surface);
    }else inland.push(surface);
  }
  const seaGroups=[...bySeaLevel.values()].sort((a,b)=>b.reduce((sum,s)=>sum+s.areaM2,0)-a.reduce((sum,s)=>sum+s.areaM2,0));
  const largestInland=[...inland].sort((a,b)=>b.areaM2-a.areaM2)[0];
  const batches=[...seaGroups.map((surfaces,i)=>({surfaces,reflect:i===0,sea:true})),...inland.map(surface=>({surfaces:[surface],reflect:surface===largestInland,sea:false}))];
  const sunDirection=new THREE.Vector3(-1,.7,.1).normalize();
  for(const batch of batches) {
    const surface=batch.surfaces[0],geometry=createLandscapeWaterGeometry(batch.surfaces),name=batch.sea?'Mediterráneo':surface.label||surface.name||'Lámina cartografiada';let mesh;
    if(batch.reflect) {
      const resolution=mobile?256:512;
      mesh=new Water(geometry,{textureWidth:resolution,textureHeight:resolution,waterNormals:batch.sea?seaNormals:inlandNormals,sunDirection:sunDirection.clone(),sunColor:0xffdfa4,waterColor:batch.sea?0x2c656e:0x506857,distortionScale:batch.sea?1.7:.45,alpha:1,fog:true,clipBias:.001});
      mesh.material.uniforms.size.value=batch.sea?1.7:1.05;
      const nativeRender=mesh.onBeforeRender,state={mesh,sea:batch.sea,force:true,last:-Infinity,camera:new THREE.Matrix4(),projection:new THREE.Matrix4(),resolution};
      planar.push(state);
      mesh.onBeforeRender=function(renderer,scene,camera) {
        if(disposed||reflectionInProgress)return;
        mesh.material.uniforms.eye.value.setFromMatrixPosition(camera.matrixWorld);
        const now=performance.now(),changed=!state.camera.equals(camera.matrixWorld)||!state.projection.equals(camera.projectionMatrix),interval=mobile?(batch.sea?135:210):(batch.sea?66:100);
        if(!state.force&&(now-state.last<interval||(reduced&&!changed)))return;
        const hidden=[],visible=mesh.visible,previousTarget=renderer.getRenderTarget(),previousXR=renderer.xr.enabled,previousShadow=renderer.shadowMap.autoUpdate,originalSetTarget=renderer.setRenderTarget;
        // Water's native pass calls renderer.render. Hide every other Water,
        // including water owned by another landscape, to prevent nested mirrors.
        scene.traverse(object=>{if(object!==mesh&&object.isWater&&object.visible){hidden.push(object);object.visible=false;}});
        reflectionInProgress=true;let completed=false;
        renderer.setRenderTarget=function(target,...rest){
          if(target?.texture===mesh.material.uniforms.mirrorSampler.value)targets.add(target);
          return originalSetTarget.call(this,target,...rest);
        };
        try{
          nativeRender.call(mesh,renderer,scene,camera);completed=true;
          state.force=false;state.last=now;state.camera.copy(camera.matrixWorld);state.projection.copy(camera.projectionMatrix);
        }finally{
          renderer.setRenderTarget=originalSetTarget;renderer.xr.enabled=previousXR;renderer.shadowMap.autoUpdate=previousShadow;
          originalSetTarget.call(renderer,previousTarget);mesh.visible=visible;
          for(const object of hidden)object.visible=true;
          reflectionInProgress=false;if(!completed)state.force=true;
        }
      };
    }else{
      const options={color:batch.sea?0x356a72:0x526c60,roughness:mobile?.27:.18,metalness:0,normalMap:inlandNormals,normalScale:new THREE.Vector2(.30,.30),side:THREE.DoubleSide};
      const material=mobile?new THREE.MeshStandardMaterial(options):new THREE.MeshPhysicalMaterial({...options,clearcoat:.85,clearcoatRoughness:.13,ior:1.333});
      mesh=new THREE.Mesh(geometry,material);ordinary.push({mesh,sea:batch.sea});
    }
    mesh.name=name+(batch.reflect?' · reflejo planar':' · agua a cota propia');
    mesh.rotation.x=-Math.PI/2;mesh.position.y=surface.levelM;mesh.receiveShadow=true;
    mesh.userData={water:true,landscapeWater:true,surfaceIds:batch.surfaces.map(s=>s.id),levelM:surface.levelM,depthM:surface.depthM,bathymetry:'Interpretative depression for display only; not a hydrographic survey.'};
    group.add(mesh);meshes.push(mesh);
  }
  const stats={
    surfaces:mask.surfaces.length,seaSurfaces:mask.surfaces.filter(s=>s.kind==='sea').length,inlandSurfaces:inland.length,
    meshes:meshes.length,triangles:meshes.reduce((sum,m)=>sum+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),
    planarReflections:planar.length,reflectionResolution:planar.map(s=>s.resolution),
    reflectionSurfaceIds:planar.map(s=>s.mesh.userData.surfaceIds),levelsM:[...new Set(mask.surfaces.map(s=>s.levelM))].sort((a,b)=>a-b),
    reducedMotion:reduced,levelNote:data.levelNote||'Individual water levels are display approximations, not live observations.',
    bathymetry:data.seabedNote||'Only supplied water polygons depress the visible terrain; original elevation raster is unchanged.',
    excludedKinds:data.excludedKinds||[],normalTextures:'Procedural, tiled normal maps; no downloaded image assets.'
  };
  return{
    group,stats,mask,waters:meshes,
    update(delta){
      if(disposed||reduced)return;const dt=Math.max(0,Math.min(.1,Number.isFinite(delta)?delta:0));clock+=dt;
      for(const state of planar)state.mesh.material.uniforms.time.value=clock*(state.sea?.26:.11);
      inlandNormals.offset.set(clock*.0017,clock*.0009);
    },
    invalidate(){for(const state of planar)state.force=true;},
    setLight(mode){
      const day=mode==='day';
      for(const state of planar){const uniforms=state.mesh.material.uniforms;uniforms.sunColor.value.set(day?'#fff5df':'#ffdfa4');uniforms.sunDirection.value.set(...(day?[-650,1600,-700]:[-1000,700,100])).normalize();uniforms.waterColor.value.set(state.sea?(day?'#286b79':'#315e63'):(day?'#4a7162':'#566750'));state.force=true;}
      for(const state of ordinary)state.mesh.material.color.set(state.sea?(day?'#356d79':'#3b6267'):(day?'#4c7367':'#5a6b59'));
    },
    dispose(){
      if(disposed)return;disposed=true;group.visible=false;
      const targetTextures=new Set();for(const target of targets){targetTextures.add(target.texture);target.dispose();}
      for(const state of planar){state.mesh.onBeforeRender=()=>{};const texture=state.mesh.material.uniforms.mirrorSampler.value;if(!targetTextures.has(texture))texture.dispose();}
      for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}
      seaNormals.dispose();inlandNormals.dispose();
    }
  };
}
