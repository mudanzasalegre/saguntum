import * as T from 'three';
import {SectorStream} from './territory-stream.js';
import {resource,networkBase} from './territory-ground.js';

import {streetMaterial,streetGeometry,streetAreas} from './territory-street-surfaces.js';
import {streetActors,streetFurniture} from './territory-props.js';

export function createNetwork({scene,index,heightAt,heritage}){
  const root=new T.Group(),streets=new T.Group(),green=new T.Group(),life=new T.Group();
  root.add(streets,green,life);scene.add(root);
  const surface=streetMaterial(),propsReady=streetFurniture(),dummy=new T.Object3D();
  dummy.rotation.order='YXZ';
  let props=null,night=0;
  propsReady.then(result=>{props=result;props.setNight(night);}).catch(error=>console.warn('Mobiliario',error));
  const stream=new SectorStream(index.tiles,async sector=>{
    const [data,prepared]=await Promise.all([resource(networkBase+sector.url),propsReady.catch(()=>null)]);
    const rg=new T.Group(),vg=new T.Group();
    const draw=(geometry,parent)=>{
      if(!geometry.index.count){geometry.dispose();return;}
      const mesh=new T.Mesh(geometry,surface);mesh.receiveShadow=true;parent.add(mesh);
    };
    draw(streetGeometry(data,heightAt),rg);
    draw(streetAreas(data.areas||[],heightAt),vg);
    const refresh=prepared?.build(vg,data.objects||[],data.roads,data.areas||[],heightAt,heritage);
    streets.add(rg);green.add(vg);return {rg,vg,roads:data.roads,refresh};
  },tile=>{
    for(const g of [tile.rg,tile.vg]){g.removeFromParent();g.traverse(m=>{if(m.isInstancedMesh)m.dispose();else if(m.geometry)m.geometry.dispose();});}
  },2);
  const maxCars=30,maxPeople=34;
  const actors=streetActors(life,maxCars,maxPeople),{cars,walkers,stride}=actors;
  let seed=1973;
  function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  let previous='',edges=[],exits=new Map(),vehicles=[],people=[],anchor=[0,0];
  function graph(x,z){
    const key=Array.from(stream.live.keys()).join('|');
    if(key===previous&&Math.hypot(x-anchor[0],z-anchor[1])<250)return;
    previous=key;anchor=[x,z];edges=[];exits=new Map();
    for(const t of stream.live.values())for(const road of t.roads){
      const points=road.points;
      if((!road.car&&!road.foot)||points.length<2)continue;
      if(!points.some(p=>Math.hypot(x-p[0],z-p[1])<720))continue;
      const dirs=road.oneway===-1?[-1,1]:[1,-1];
      for(const direction of dirs){
        const path=direction===1?points:[...points].reverse(),dist=[0];
        for(let i=1;i<path.length;i++)dist.push(dist[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
        if(dist.at(-1)<2)continue;
        const start=direction===1?road.a:road.b,end=direction===1?road.b:road.a;
        const deck=direction===1?road.deck:road.deck?.slice().reverse();
        const e={road,path,dist,deck,start,end,len:dist.at(-1),car:road.car&&(!road.oneway||direction===road.oneway),foot:road.foot};
        edges.push(e);if(!exits.has(start))exits.set(start,[]);exits.get(start).push(e);
      }
    }
    const loaded=new Set(edges.map(e=>e.road.id));
    vehicles=vehicles.filter(a=>loaded.has(a.e.road.id));people=people.filter(a=>loaded.has(a.e.road.id));
  }
  function populate(list,type,limit){
    const viable=edges.filter(e=>e[type]&&e.len>(type==='car'?10:4));
    if(!viable.length)return;
    while(list.length<Math.min(limit,viable.length)){
      const e=viable[Math.floor(rand()*viable.length)];list.push({e,s:rand()*e.len,speed:type==='car'?5+rand()*4:1+rand()*.5});
    }
  }
  function step(list,type,delta,max){
    const object=type==='car'?cars:walkers;let count=0;
    for(let n=list.length-1;n>=0;n--){
      const a=list[n];let e=a.e;
      a.s+=delta*a.speed*(type==='car'&&e.len-a.s<12?.52:1);
      if(a.s>=e.len){
        const restrictions=type==='car'?(index.turns[e.end]||[]).filter(r=>r.from===e.road.osm):[];
        const choices=(exits.get(e.end)||[]).filter(next=>next[type]&&next.road.id!==e.road.id
          &&!restrictions.some(r=>r.only ? r.to!==next.road.osm : r.to===next.road.osm));
        if(!choices.length){list.splice(n,1);continue;}
        a.s=0;e=a.e=choices[Math.floor(rand()*choices.length)];
      }
      if(count>=max)continue;
      let i=1;while(i<e.dist.length-1&&e.dist[i]<a.s)i++;
      const p=e.path[i-1],q=e.path[i],len=e.dist[i]-e.dist[i-1]||1,f=(a.s-e.dist[i-1])/len;
      const dx=(q[0]-p[0])/len,dz=(q[1]-p[1])/len;
      const side=type==='car'&&!e.road.oneway?Math.min(1.45,(e.road.width||5)*.21):0;
      const x=p[0]+dx*len*f-dz*side,z=p[1]+dz*len*f+dx*side,y=(e.deck?e.deck[i-1]+(e.deck[i]-e.deck[i-1])*f:heightAt(x,z))+.20;
      let pitch=0;
      if(type==='car'){
        const rise=e.deck?e.deck[i]-e.deck[i-1]:heightAt(q[0],q[1])-heightAt(p[0],p[1]);
        pitch=-Math.atan2(rise,len);
      }else stride.setX(count,a.s*4.15+n);
      dummy.position.set(x,y,z);dummy.rotation.set(pitch,Math.atan2(dx,dz),0);dummy.scale.setScalar(1);
      dummy.updateMatrix();object.setMatrixAt(count,dummy.matrix);
      count++;
    }
    object.count=count;object.instanceMatrix.needsUpdate=true;
    if(type==='foot')stride.needsUpdate=true;
  }
  return {streets,green,stream,get traffic(){return {cars:cars.count,people:walkers.count};},update(x,z,alt,budget,flags){
    stream.update(x,z,alt>1800?0:[620,1000,1400][budget],alt>1800?0:[6,12,20][budget]);graph(x,z);
    streets.visible=flags.streets;green.visible=flags.land;
    const key=(heritage?.group.visible?'on/':'off/')+(heritage?.stats.loaded||[]).join(',');
    for(const tile of stream.live.values())tile.refresh?.(x,z,budget,key);
    if(flags.cars)populate(vehicles,'car',[9,18,maxCars][budget]);
    if(flags.people)populate(people,'foot',[8,20,maxPeople][budget]);
  },animate(delta,flags){step(vehicles,'car',delta,flags.cars?maxCars:0);step(people,'foot',delta,flags.people?maxPeople:0);},
  setNight(n){night=n;props?.setNight(n);actors.setNight(n);},
  walkingHeight(x,z){
    let ground=heightAt(x,z);
    for(const tile of stream.live.values())for(const road of tile.roads){
      if(!road.deck)continue;
      for(let i=1;i<road.points.length;i++){
        const p=road.points[i-1],q=road.points[i],dx=q[0]-p[0],dz=q[1]-p[1];
        const t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz||1)));
        if(Math.hypot(x-p[0]-dx*t,z-p[1]-dz*t)<=road.width*.5)
          ground=Math.max(ground,road.deck[i-1]+(road.deck[i]-road.deck[i-1])*t);
      }
    }
    return ground+.2;
  },
  nearestPublic(x,z){
    let best=null,dist=Infinity;
    for(const e of edges)if(e.foot)for(let i=1;i<e.path.length;i++){
      const p=e.path[i-1],q=e.path[i],dx=q[0]-p[0],dz=q[1]-p[1],f=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz||1)));
      const xx=p[0]+f*dx,zz=p[1]+f*dz,dd=Math.hypot(x-xx,z-zz);
      if(dd<dist){dist=dd;best=[xx,zz];}
    }
    return best;
  }};
}
