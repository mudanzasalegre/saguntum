// Experimental. Injected into a local test page by the cold-route profiler.
import {Frustum,Group,Matrix4,Vector3} from 'three';

export function warmupGate(renderer){
  const ext=renderer.extensions.get('KHR_parallel_shader_compile');
  const gl=renderer.getContext(),frustum=new Frustum(),matrix=new Matrix4(),eye=new Vector3();
  const batch=new Group(),anchors=[],wait=new Set(),drawn=new Set();
  const stats={batches:0,linked:0,held:0,waiting:false,compileMs:0,largestSubmissionMs:0,largestHoldMs:0,timedOut:0};
  // Draw using the real scene/lighting. The compile traversal names only the
  // visible source meshes, without cloning/reparenting them or drawing pixels.
  batch.traverse=visit=>anchors.forEach(visit);
  batch.traverseVisible=()=>{};
  let lastKey='',activeUntil=0,started=0,hasView=false;
  function submit(scene,camera){
    const start=performance.now();
    const before=new Set(renderer.info.programs);
    scene.updateMatrixWorld();camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    drawn.clear();anchors.length=0;
    scene.traverseVisible(object=>{
      if(!object.material||!object.layers.test(camera.layers)||(object.isInstancedMesh&&!object.count))return;
      if(object.frustumCulled&&(object.isMesh||object.isLine||object.isPoints)&&!frustum.intersectsObject(object))return;
      const a=object.geometry?.attributes||{};
      const layout=[object.type,!!object.isInstancedMesh,!!object.instanceColor,!!object.isSkinnedMesh,
        !!a.tangent,a.color?.itemSize,object.geometry?.morphAttributes?.position?.length||0].join('/');
      const materials=Array.isArray(object.material)?object.material:[object.material];
      let needed=false;
      for(const material of materials){
        if(!material.visible)continue;
        const signature=material.id+'/'+layout;
        if(!drawn.has(signature)){drawn.add(signature);needed=true;}
      }
      if(needed)anchors.push(object);
    });
    renderer.compile(batch,camera,scene);
    for(const program of renderer.info.programs){
      if(!before.has(program)&&!program.isReady()){wait.add(program);stats.linked++;}
    }
    if(wait.size)gl.flush();
    const dt=performance.now()-start;stats.compileMs+=dt;stats.largestSubmissionMs=Math.max(stats.largestSubmissionMs,dt);
    stats.batches++;anchors.length=0;drawn.clear();
  }
  function ready(scene,camera){
    if(!ext)return true;
    const now=performance.now();
    if(hasView&&eye.distanceToSquared(camera.position)>400*400){activeUntil=now+16000;lastKey='';}
    eye.copy(camera.position);hasView=true;
    if(now>=activeUntil&&!wait.size)return true;
    const target=renderer.getRenderTarget();
    const key=[renderer.territoryProgramLighting,renderer.shadowMap.enabled,
      target?.texture.colorSpace||renderer.outputColorSpace,!!target,renderer.toneMapping,!!scene.environment].join(':');
    if(key!==lastKey){
      submit(scene,camera);lastKey=key;
    }
    for(const program of wait)if(!program.program||program.isReady())wait.delete(program);
    if(wait.size){
      if(!started)started=now;
      if(now-started<8000){stats.held++;stats.waiting=true;return false;}
      stats.timedOut++;wait.clear();
    }
    if(started){stats.largestHoldMs=Math.max(stats.largestHoldMs,now-started);started=0;}
    stats.waiting=false;return true;
  }
  return {ready,stats};
}
