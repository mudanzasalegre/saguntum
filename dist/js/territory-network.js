import * as T from 'three';
import {SectorStream} from './territory-stream.js';
import {resource,networkBase} from './territory-ground.js';
import {streetMaterial,streetGeometry,streetAreas} from './territory-street-surfaces.js';
import {loadStreetFronts} from './territory-street-fronts.js';
import {streetActors,streetFurniture} from './territory-props.js';
import {MetricGrid} from './urban-surface.js';
import {indexBounds,nearCell,segmentFraction} from './territory-collision.js';
import {carsOverlap,drivingSpeed,nearestOnPaths,routePose,touchesCar,turnChoices} from './territory-traffic.js';

const propSize={bench:[.84,.25,.90],bicycle_parking:[.38,.05,.79],bollard:[.09,.09,.87],
  street_lamp:[.085,.085,5],lamp:[.085,.085,5],tree:[.17,.17,3],
  stop:[.05,.05,2.4],give_way:[.05,.05,2.4],traffic_signals:[.07,.07,2.55]};

export function createNetwork({scene,index,heightAt,heritage}){
  const root=new T.Group(),streets=new T.Group(),green=new T.Group(),life=new T.Group();
  root.add(streets,green,life);scene.add(root);
  const surface=streetMaterial(),propsReady=streetFurniture(),dummy=new T.Object3D();
  heritage?.maskRoadMaterial(surface);
  dummy.rotation.order='YXZ';
  let props=null,night=0;
  propsReady.then(result=>{props=result;props.setNight(night);}).catch(error=>console.warn('Mobiliario',error));
  const sectors=new MetricGrid(index.tileSize||1000);
  for(const sector of index.tiles)indexBounds(sectors,sector,sector.bounds);

  const stream=new SectorStream(index.tiles,async sector=>{
    const [data,prepared,fronts]=await Promise.all([resource(networkBase+sector.url),propsReady.catch(()=>null),loadStreetFronts(sector)]);
    const rg=new T.Group(),vg=new T.Group(),solids=new MetricGrid(12),decks=new MetricGrid(16),publicWays=new MetricGrid(48);
    const draw=(geometry,parent)=>{
      if(!geometry.index.count){geometry.dispose();return;}
      const mesh=new T.Mesh(geometry,surface);mesh.receiveShadow=true;parent.add(mesh);
    };
    draw(streetGeometry(data,heightAt,fronts),rg);draw(streetAreas(data.areas||[],heightAt),vg);
    for(const road of data.roads){
      if(!road.deck&&!road.foot)continue;
      for(let i=1;i<road.points.length;i++){
        const a=road.points[i-1],b=road.points[i],bounds=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];
        const segment={a,b,road,i};
        if(road.foot)indexBounds(publicWays,segment,bounds);
        if(road.deck)indexBounds(decks,segment,bounds,road.width*.5);
      }
    }
    const refresh=prepared?.build(vg,data.objects||[],data.roads,data.areas||[],heightAt,heritage,(o,y,yaw,scale)=>{
      const size=propSize[o.kind];if(!size)return;
      const halfX=size[0]*scale,halfZ=size[1]*scale,reach=Math.hypot(halfX,halfZ);
      indexBounds(solids,{...o,y,halfX,halfZ,height:size[2]*scale,c:Math.cos(yaw),s:Math.sin(yaw)},[o.x-reach,o.z-reach,o.x+reach,o.z+reach]);
    });
    streets.add(rg);green.add(vg);return {rg,vg,roads:data.roads,refresh,decks,publicWays,solids};
  },tile=>{
    for(const g of [tile.rg,tile.vg]){g.removeFromParent();g.traverse(m=>{if(m.isInstancedMesh)m.dispose();else if(m.geometry)m.geometry.dispose();});}
  },2);

  function nearbyTiles(x,z,r,visit){
    // Objects and bridge decks can project a few metres beyond their source tile.
    const visited=new Set();
    return nearCell(sectors,x,z,r+21,sector=>{
      if(visited.has(sector.id))return false;visited.add(sector.id);
      const tile=stream.live.get(sector.id);return tile&&visit(tile);
    });
  }
  function bridgeHeight(x,z,pedestrianOnly=false){
    let deck=null;
    nearbyTiles(x,z,0,tile=>{
      for(const {a,b,road,i} of tile.decks.at(x,z)){
        if(pedestrianOnly&&!road.foot)continue;
        const f=segmentFraction(x,z,...a,...b);
        if(Math.hypot(x-a[0]-(b[0]-a[0])*f,z-a[1]-(b[1]-a[1])*f)>road.width*.5)continue;
        const y=road.deck[i-1]+(road.deck[i]-road.deck[i-1])*f;
        if(deck===null||y>deck)deck=y;
      }
    });
    return deck;
  }
  const maxCars=30,maxPeople=34;
  const actors=streetActors(life,maxCars,maxPeople),{cars,walkers,stride}=actors;
  let seed=1973;
  function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  let previous='',edges=[],exits=new Map(),vehicles=[],people=[],anchor=[Infinity,Infinity],observer=[0,0],viewer=null;
  const reservations=new Map();
  const distance=pose=>Math.hypot(pose.x-observer[0],pose.z-observer[1]);

  function release(actor){
    if(reservations.get(actor.node)===actor)reservations.delete(actor.node);
    actor.node=null;
  }
  function graph(x,z){
    const key=Array.from(stream.live.keys()).join('|');
    if(key===previous&&Math.hypot(x-anchor[0],z-anchor[1])<190)return;
    previous=key;anchor=[x,z];edges=[];exits=new Map();
    const directed=new Map();
    for(const t of stream.live.values())for(const road of t.roads){
      if((!road.car&&!road.foot)||road.points.length<2)continue;
      if(!road.points.some(p=>Math.hypot(x-p[0],z-p[1])<720))continue;
      for(const direction of [1,-1]){
        const path=direction===1?road.points:[...road.points].reverse(),dist=[0];
        for(let i=1;i<path.length;i++)dist.push(dist[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
        if(dist.at(-1)<2)continue;
        const start=direction===1?road.a:road.b,end=direction===1?road.b:road.a;
        const deck=direction===1?road.deck:road.deck?.slice().reverse(),id=road.id+'/'+direction;
        const edge={id,road,path,dist,deck,start,end,len:dist.at(-1),car:road.car&&(!road.oneway||direction===road.oneway),foot:road.foot};
        edges.push(edge);directed.set(id,edge);
        if(!exits.has(start))exits.set(start,[]);exits.get(start).push(edge);
      }
    }
    for(const list of [vehicles,people])for(let i=list.length-1;i>=0;i--){
      const actor=list[i],edge=directed.get(actor.e.id);
      if(!edge||distance(actor.pose)>630){release(actor);list.splice(i,1);}
      else {actor.e=edge;actor.turn=null;}
    }
  }

  function populate(list,car,limit){
    while(list.length>limit){release(list.pop());}
    if(list.length===limit)return;
    const viable=edges.filter(e=>(car?e.car:e.foot)&&e.len>(car?10:4));
    for(let tries=0;tries<limit*5&&list.length<Math.min(limit,viable.length);tries++){
      const e=viable[Math.floor(rand()*viable.length)],s=rand()*e.len,pose=routePose(e,s,car,heightAt),d=distance(pose);
      if(d<32||d>490)continue;
      if(car&&vehicles.some(a=>carsOverlap(a.pose,pose,2.2)))continue;
      const factor=car?.72+rand()*.24:1+rand()*.5;
      list.push({e,s,pose,factor,speed:car?drivingSpeed(e.road,factor):factor,turn:null,node:null});
    }
  }
  function advance(actor,car,dt){
    let edge=actor.e;
    const remaining=edge.len-actor.s;
    if(car&&actor.node&&actor.node!==edge.end&&actor.s>5)release(actor);
    if(remaining<12&&!actor.turn){
      const options=turnChoices(edge,exits,index.turns||{},car);
      if(options.length)actor.turn=options[Math.floor(rand()*options.length)];
    }
    let target=car?drivingSpeed(edge.road,actor.factor):actor.factor;
    if(car&&remaining<12&&actor.turn)target=Math.min(target,4.4);
    if(car){
      for(const leader of vehicles){
        if(leader!==actor&&leader.e===edge&&leader.s>actor.s)target=Math.min(target,Math.max(0,(leader.s-actor.s-4.9)/1.2));
      }
      if(actor.turn&&remaining<9&&actor.node!==edge.end){
        if(reservations.has(edge.end))target=Math.min(target,Math.max(0,remaining-5.8));
        else {release(actor);actor.node=edge.end;reservations.set(edge.end,actor);}
      }
    }
    actor.speed+=Math.max(-5*dt,Math.min(2.2*dt,target-actor.speed));
    let next=actor.s+Math.max(0,actor.speed*dt);
    if(next>=edge.len){
      if(!actor.turn)return distance(actor.pose)<42;
      next=Math.min(actor.turn.len,next-edge.len);edge=actor.turn;
    }
    const pose=routePose(edge,next,car,heightAt);
    if(car&&(vehicles.some(other=>other!==actor&&carsOverlap(pose,other.pose))||
        viewer&&touchesCar(pose,viewer.x,viewer.z,.6,viewer.y-1.68))){
      actor.speed=0;return true;
    }
    if(edge!==actor.e)actor.turn=null;
    Object.assign(actor,{e:edge,s:next,pose});return distance(pose)<630;
  }
  function step(list,car,dt){
    const object=car?cars:walkers;let count=0;
    for(let i=list.length-1;i>=0;i--){
      const actor=list[i];
      if(!advance(actor,car,dt)){release(actor);list.splice(i,1);continue;}
      const p=actor.pose;
      if(!car)stride.setX(count,actor.s*4.15+i);
      dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.pitch,Math.atan2(p.dx,p.dz),0);
      dummy.updateMatrix();object.setMatrixAt(count++,dummy.matrix);
    }
    object.count=count;object.instanceMatrix.needsUpdate=true;if(!car)stride.needsUpdate=true;
  }

  return {streets,green,stream,get traffic(){return {cars:cars.count,people:walkers.count};},
    update(x,z,alt,budget,flags){
      observer=[x,z];
      stream.update(x,z,alt>1800?0:[620,1000,1400][budget],alt>1800?0:[6,12,20][budget]);graph(x,z);
      streets.visible=flags.streets;green.visible=flags.land;
      const key=(heritage?.group.visible?'on/':'off/')+(heritage?.stats.loaded||[]).join(',');
      for(const tile of stream.live.values())tile.refresh?.(x,z,budget,key);
      populate(vehicles,true,flags.cars?[9,18,maxCars][budget]:0);
      populate(people,false,flags.people?[8,20,maxPeople][budget]:0);
    },
    animate(delta,flags,eye=null){
      viewer=eye;
      if(flags.cars)step(vehicles,true,delta);else{cars.count=0;vehicles.length=0;reservations.clear();}
      if(flags.people)step(people,false,delta);else{walkers.count=0;people.length=0;}
    },
    setNight(n){night=n;props?.setNight(n);actors.setNight(n);},
    bridgeHeight,
    walkingHeight(x,z){return Math.max(heightAt(x,z),bridgeHeight(x,z)??-Infinity)+.2;},
    safeToWalk(x,z,radius=.32,feetY){
      if(vehicles.some(a=>touchesCar(a.pose,x,z,radius,feetY)))return false;
      return !green.visible||!nearbyTiles(x,z,radius,tile=>nearCell(tile.solids,x,z,radius,o=>{
        if(feetY>=o.y+o.height||feetY+1.7<o.y)return false;
        const dx=x-o.x,dz=z-o.z;
        const localX=Math.max(0,Math.abs(dx*o.c-dz*o.s)-o.halfX),localZ=Math.max(0,Math.abs(dx*o.s+dz*o.c)-o.halfZ);
        if(localX*localX+localZ*localZ>radius*radius)return false;
        return !heritage?.isReplaced('',o.x,o.z)&&!(o.kind==='tree'?heritage?.ownsVegetation(o.x,o.z):heritage?.ownsFurniture(o.x,o.z));
      }));
    },
    nearestPublic(x,z,allowed){
      const paths=new Set();
      nearbyTiles(x,z,85,tile=>nearCell(tile.publicWays,x,z,85,s=>{paths.add(s);return false;}));
      return nearestOnPaths(x,z,paths,allowed);
    }
  };
}
