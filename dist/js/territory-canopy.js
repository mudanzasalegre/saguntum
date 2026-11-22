import * as T from 'three';
import {streetTrees} from './territory-street-trees.js';
import {resource,territoryBase} from './territory-ground.js';

// Measured canopy maxima, organized in metric tiles. A record denotes the
// crown of a vegetation group and may include several adjacent orchard trees.
export function createCanopy(scene,heightAt,heritage){
  const group=new T.Group();group.name='Copas · MDSnV / PNOA';scene.add(group);
  const stats={source:0,visible:0,near:0,ready:false};
  const tiles=[],dummy=new T.Object3D(),color=new T.Color();
  let trees,dirty=0,lastStamp=-1,lastX=Infinity,lastZ=Infinity,lastRange=-1,lastBudget=-1;
  function batch(kind,capacity){
    const m=new T.InstancedMesh(trees.geometry[kind],trees.material[kind],capacity);
    m.count=0;m.receiveShadow=true;m.castShadow=kind!=='treeView';m.instanceMatrix.setUsage(T.DynamicDrawUsage);
    group.add(m);return m;
  }
  const ready=Promise.all([streetTrees(),resource(territoryBase+'canopy/index.json'),resource(territoryBase+'canopy/crowns.bin','arrayBuffer'),
    resource(territoryBase+'landscape/canopy-chroma.bin','arrayBuffer').catch(()=>null)]).then(([prototype,index,bytes,chroma])=>{
    if(bytes.byteLength!==index.count*7)throw Error('Tamaño del inventario de copas');
    trees=prototype;
    const tones=chroma?.byteLength===index.count*2?new Uint8Array(chroma):null;
    const input=new DataView(bytes),groups=new Map();let offset=0;
    // Four 500 m source tiles share one draw call. Instance positions stay metric.
    for(const [tx,tz,count] of index.tiles){
      const gx=Math.floor(tx/2),gz=Math.floor(tz/2),key=gx+','+gz;
      if(!groups.has(key))groups.set(key,{x:gx*1000+500,z:gz*1000+500,rows:[],max:0,low:Infinity,high:-Infinity});
      const t=groups.get(key);
      for(let i=0;i<count;i++,offset+=7){
        const x=tx*500+input.getUint16(offset,true)*.25,z=tz*500+input.getUint16(offset+2,true)*.25;
        const height=input.getUint8(offset+4),radius=input.getUint8(offset+5)*.1;
        const green=input.getUint8(offset+6),y=heightAt(x,z);
        const colourIndex=offset/7*2;
        const red=tones?.[colourIndex]??125,blue=tones?.[colourIndex+1]??123;
        t.rows.push({x,z,y,height,radius,red:.99+(red-125)/242,blue:.92+(blue-123)/210,shade:.70+Math.min(1,green/150)*.34,
          angle:((Math.round(x*4)*31+Math.round(z*4)*73)%360)*Math.PI/180});
        t.low=Math.min(t.low,y);t.high=Math.max(t.high,y+height);t.max=Math.max(t.max,height);
      }
    }
    for(const t of groups.values()){
      t.sphere=new T.Sphere(new T.Vector3(t.x,(t.low+t.high)*.5,t.z),Math.hypot(726,(t.high-t.low)*.5));
      tiles.push(t);
    }
    stats.source=index.count;stats.ready=true;
  }).catch(error=>console.warn('Vegetación LiDAR',error));
  const capacity=60;let trunk,crown;
  function put(mesh,n,r){
    dummy.position.set(r.x,r.y,r.z);dummy.rotation.set(0,r.angle,0);
    // The source tree measures 4.55 m vertically; scale the crown width independently.
    dummy.scale.set(r.radius/2.55,r.height/4.55,r.radius/2.55);dummy.updateMatrix();
    mesh.setMatrixAt(n,dummy.matrix);color.setRGB(r.shade*r.red,r.shade,r.shade*r.blue);mesh.setColorAt(n,color);
  }
  function finish(mesh,n){
    mesh.count=n;mesh.visible=n>0;mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  }
  return {stats,ready,changed(){dirty++;},update(p,range,budget,show){
    group.visible=show;if(!show||!stats.ready)return;
    if(lastStamp===dirty&&lastBudget===budget&&Math.abs(range-lastRange)<Math.max(8,range*.12)&&Math.hypot(p.x-lastX,p.z-lastZ)<(range<100?12:95))return;
    lastStamp=dirty;lastBudget=budget;lastX=p.x;lastZ=p.z;lastRange=range;
    const nearRadius=[25,40,55][budget],near=[],farRadius=range>1800?Math.min(19000,range*2.3+1200):[1600,2800,3700][budget]+range;
    let total=0;
    // Fill near geometry from nearest measured crowns first. Far silhouettes retain the rest.
    if(range<130)for(const t of tiles){
      if(Math.abs(t.x-p.x)>500+nearRadius||Math.abs(t.z-p.z)>500+nearRadius)continue;
      for(const r of t.rows){
        const d=Math.hypot(r.x-p.x,r.z-p.z);
        if(d<nearRadius&&!heritage.ownsVegetation(r.x,r.z)&&!heritage.isReplaced('',r.x,r.z)&&heritage.walkSurface(r.x,r.z)===null)near.push([d,r]);
      }
    }
    near.sort((a,b)=>a[0]-b[0]);const closest=new Set(near.slice(0,[15,35,capacity][budget]).map(a=>a[1]));
    if(closest.size&&!trunk){
      trunk=batch('trunk',capacity);crown=batch('crown',capacity);
      trunk.frustumCulled=crown.frustumCulled=false;
    }
    for(const t of tiles){
      const distance=Math.hypot(p.x-t.x,p.z-t.z);
      if(distance-708>farRadius){if(t.mesh)t.mesh.visible=false;continue;}
      const minHeight=Math.min(11,Math.max(2,(range*.45+distance)*[.0018,.0011,.0008][budget]));
      if(t.max<minHeight){if(t.mesh)t.mesh.visible=false;continue;}
      const masked=distance<1805;
      const threshold=Math.floor(minHeight);
      const nearTile=closest.size>0&&distance<770;
      if(t.mesh&&t.threshold===threshold&&t.mask===(masked?dirty:-1)&&!nearTile&&!t.hadNear){
        t.mesh.visible=t.mesh.count>0;total+=t.mesh.count;continue;
      }
      let n=0;
      for(const r of t.rows){
        if(r.height<threshold||closest.has(r))continue;
        if(masked&&(heritage.ownsVegetation(r.x,r.z)||heritage.isReplaced('',r.x,r.z)||heritage.walkSurface(r.x,r.z)!==null))continue;
        if(!t.mesh){t.mesh=batch('treeView',t.rows.length);t.mesh.boundingSphere=t.sphere;}
        put(t.mesh,n++,r);
      }
      t.threshold=threshold;t.mask=masked?dirty:-1;t.hadNear=nearTile;
      if(t.mesh)finish(t.mesh,n);total+=n;
    }
    if(trunk){
      let n=0;for(const r of closest){put(trunk,n,r);put(crown,n++,r);}
      finish(trunk,n);finish(crown,n);
    }
    stats.near=closest.size;stats.visible=total+closest.size;
  }};
}
