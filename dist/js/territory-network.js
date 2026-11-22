import * as T from 'three';
import {SectorStream} from './territory-stream.js';
import {resource,networkBase} from './territory-ground.js';

const paved={motorway:'#656c69',trunk:'#68706b',primary:'#747771',secondary:'#787a74',tertiary:'#86857d',residential:'#96948b',
  cycleway:'#9a8271',footway:'#b3a99a',path:'#b1a189',track:'#aa977c',pedestrian:'#b7afa3',rail:'#605e57',riverbed:'#cabca5'};
function ribbons(features,heightAt) {
  const pos=[],color=[],uv=[],ind=[],tint=new T.Color();
  for(const f of features){
    const pts=f.points;if(!pts||pts.length<2)continue;
    const line=[],width=f.width||4;
    for(let i=0;i+1<pts.length;i++){
      const a=pts[i],b=pts[i+1],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/12));
      for(let j=0;j<n;j++)line.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,
        f.deck?f.deck[i]+(f.deck[i+1]-f.deck[i])*j/n:null]);
    }
    line.push([...pts.at(-1),f.deck?.at(-1)]);const start=pos.length/3;tint.set(paved[f.kind]||'#95948a');
    let chainage=0;
    for(let i=0;i<line.length;i++){
      const p=line[i],prev=line[Math.max(0,i-1)],next=line[Math.min(i+1,line.length-1)];
      const dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz)||1;
      if(i)chainage+=Math.hypot(p[0]-prev[0],p[1]-prev[1]);
      for(const side of [-.5,.5]){
        const offset=width*side+(f.offset||0),x=p[0]-dz/len*offset,z=p[1]+dx/len*offset;
        pos.push(x,(p[2]??heightAt(x,z))+(f.offset?.28:.20),z);color.push(tint.r,tint.g,tint.b);
        const marked=f.car&&!f.oneway&&width>=6&&['primary','secondary','tertiary','trunk'].includes(f.kind);
        uv.push(marked?width*side:100,chainage);
      }
      if(i){const a=start+(i-1)*2;ind.push(a,a+1,a+2,a+2,a+1,a+3);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(color,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;
}
function areasGeometry(areas,heightAt) {
  const palette={park:'#758564',garden:'#829574',grass:'#8e9b72',forest:'#536e53',wood:'#577557',parking:'#aaa797',square:'#beb3a1',riverbed:'#c2b49e'};
  const pos=[],col=[],idx=[];
  for(const a of areas){
    if(!palette[a.kind]||!a.rings?.length)continue;
    const rr=a.rings.map(r=>r.map(p=>new T.Vector2(...p))),base=pos.length/3;
    const faces=T.ShapeUtils.triangulateShape(rr[0],rr.slice(1)),c=new T.Color(palette[a.kind]);
    for(const v of rr.flat()){pos.push(v.x,heightAt(v.x,v.y)+.10,v.y);col.push(c.r,c.g,c.b);}
    for(const [i,j,k] of faces)idx.push(base+k,base+j,base+i);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));
  g.setIndex(idx);g.computeVertexNormals();return g;
}
export function createNetwork({scene,index,heightAt}){
  const root=new T.Group(),streets=new T.Group(),green=new T.Group(),life=new T.Group();
  root.add(streets,green,life);scene.add(root);
  const surface=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const land=surface.clone();land.transparent=true;land.opacity=.45;land.depthWrite=false;
  surface.defines={USE_UV:''};
  surface.onBeforeCompile=s=>{
    s.vertexShader='varying vec2 vLane;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLane=uv;');
    s.fragmentShader='varying vec2 vLane;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float stripe=(1.0-smoothstep(.06,.13,abs(vLane.x)))*step(.50,fract(vLane.y/8.0));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.71,.69,.60),stripe*.74);
    `);
  };
  const staticGeometry={
    trunk:new T.CylinderGeometry(.18,.27,2.5,5),tree:new T.IcosahedronGeometry(2.2,1),
    lamp:new T.CylinderGeometry(.06,.105,5,5),light:new T.SphereGeometry(.27,6,4),
    bench:new T.BoxGeometry(1.6,.34,.5),crossing:new T.BoxGeometry(.42,.025,2.8),sign:new T.BoxGeometry(.36,1.3,.07)
  };
  const staticColor={trunk:'#705e4c',tree:'#647e55',lamp:'#525d59',light:'#eee3c3',bench:'#746653',crossing:'#dedacb',sign:'#8b9791'};
  const mats=Object.fromEntries(Object.keys(staticGeometry).map(k=>[k,new T.MeshStandardMaterial({color:staticColor[k],roughness:1})]));
  const dummy=new T.Object3D();
  const stream=new SectorStream(index.tiles,async s=>{
    const data=await resource(networkBase+s.url);
    const rg=new T.Group(),vg=new T.Group(),decor={};
    const draw=(g,m,parent)=>{if(!g.index.count){g.dispose();return;}const mesh=new T.Mesh(g,m);mesh.receiveShadow=true;parent.add(mesh);};
    const sidewalks=[];
    for(const r of data.roads)for(const [tag,side] of [['left',-1],['right',1]]){
      if(r.sidewalk===tag||r.sidewalk==='both')sidewalks.push({...r,car:false,kind:'footway',width:1.2,offset:side*(r.width/2+.6)});
    }
    draw(ribbons([...data.roads.filter(r=>!r.tunnel),...sidewalks,...(data.rail||[]).map(a=>({...a,kind:'rail',width:1.45})),
      ...(data.waterways||[]).filter(a=>a.kind==='riverbed').map(a=>({...a,width:a.width||9}))],heightAt),surface,rg);
    draw(areasGeometry(data.areas||[],heightAt),land,vg);
    const add=(kind,x,y,z,scale=1,yaw=0)=>{(decor[kind]??=[]).push([x,y,z,scale,yaw]);};
    for(const o of data.objects||[]){
      const y=heightAt(o.x,o.z),type=o.kind;
      if(type==='tree'){const scale=.85+Math.abs(Math.sin(o.x+o.z))*.37;add('trunk',o.x,y+1.2,o.z);add('tree',o.x,y+3.4*scale,o.z,scale);}
      else if(['lamp','street_lamp'].includes(type)){add('lamp',o.x,y+2.5,o.z);add('light',o.x,y+5,o.z);}
      else if(type==='bench')add('bench',o.x,y+.46,o.z);
      else if(['traffic_sign','sign','stop','give_way','traffic_signals'].includes(type))add('sign',o.x,y+.8,o.z);
      else if(type==='crossing'&&Number.isFinite(o.heading)){
        for(let j=-1;j<=1;j++)add('crossing',o.x+j*.85*Math.sin(o.heading),y+.25,o.z+j*.85*Math.cos(o.heading),1,o.heading+Math.PI/2);
      }
    }
    for(const [kind,instances] of Object.entries(decor)){
      const m=new T.InstancedMesh(staticGeometry[kind],mats[kind],instances.length);
      for(let i=0;i<instances.length;i++){const [x,y,z,scale,yaw]=instances[i];dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.setScalar(scale);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}
      m.computeBoundingSphere();vg.add(m);
    }
    streets.add(rg);green.add(vg);return {rg,vg,roads:data.roads};
  },t=>{
    for(const g of [t.rg,t.vg]){g.removeFromParent();g.traverse(m=>{if(m.isInstancedMesh)m.dispose();else if(m.geometry)m.geometry.dispose();});}
  },2);
  const maxCars=30,maxPeople=34;
  function instances(geom,color,count){
    const m=new T.InstancedMesh(geom,new T.MeshStandardMaterial({color}),count);m.count=0;m.frustumCulled=false;life.add(m);return m;
  }
  const cars=instances(new T.BoxGeometry(1.62,.85,3.8),'#ffffff',maxCars);
  const tops=instances(new T.BoxGeometry(1.38,.57,1.95),'#849294',maxCars);
  const walkers=instances(new T.CapsuleGeometry(.22,.85,2,5),'#c7af9b',maxPeople);
  let seed=1973;
  function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const paint=['#a46f60','#c7c1ab','#5e7072','#7d8781','#c6cbca'].map(c=>new T.Color(c));
  for(let i=0;i<maxCars;i++)cars.setColorAt(i,paint[i%paint.length]);
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
      dummy.position.set(x,y+(type==='car'?.58:.75),z);dummy.rotation.set(0,Math.atan2(dx,dz),0);dummy.scale.setScalar(1);
      dummy.updateMatrix();object.setMatrixAt(count,dummy.matrix);
      if(type==='car'){dummy.position.y+=.66;dummy.updateMatrix();tops.setMatrixAt(count,dummy.matrix);}
      count++;
    }
    object.count=count;object.instanceMatrix.needsUpdate=true;
    if(type==='car'){tops.count=count;tops.instanceMatrix.needsUpdate=true;}
  }
  return {streets,green,stream,get traffic(){return {cars:cars.count,people:walkers.count};},update(x,z,alt,budget,flags){
    stream.update(x,z,alt>1800?0:[620,1000,1400][budget],alt>1800?0:[6,12,20][budget]);graph(x,z);
    streets.visible=flags.streets;green.visible=flags.land;
    if(flags.cars)populate(vehicles,'car',[9,18,maxCars][budget]);
    if(flags.people)populate(people,'foot',[8,20,maxPeople][budget]);
  },animate(delta,flags){step(vehicles,'car',delta,flags.cars?maxCars:0);step(people,'foot',delta,flags.people?maxPeople:0);},
  setNight(n){mats.light.emissive.setRGB(n,n*.71,n*.4);mats.light.emissiveIntensity=2.4;},
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
