// Surviving military buildings in Almenara. Plan: OSM + PNOA; sections:
// Ricsol 24/28/29 and Mike1979 Russia, Plaça Almenara 01/02 (2014).
// Openings and relative heights are photographic estimates, not a survey.
// The two mapped strips are NOT solid, flat-topped podiums.
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const clamp=v=>Math.max(0,Math.min(1,v));
const rand=n=>{const x=Math.sin(n*127.13+17.3)*43758.5453;return x-Math.floor(x);};

export function batteryLongitudinalPosition(f,p){
 const a=f.id==='battery-n'?lerp(f.polygon[0],f.polygon[1],.5):lerp(f.polygon[0],f.polygon[1],.5),
  b=f.id==='battery-n'?lerp(f.polygon[3],f.polygon[2],.5):lerp(f.polygon[2],f.polygon[3],.5),
  dx=b.x-a.x,dz=b.z-a.z;
 return clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz));
}
export function batteryCrown(f,p,ground){
 const floor=ground.east.plane(f.center.x,f.center.z);
 if(f.id==='battery-n')return floor+(batteryLongitudinalPosition(f,p)<.49?3.50:2.55);
 if(f.id==='battery-e')return floor+3.15+.16*Math.sin(batteryLongitudinalPosition(f,p)*Math.PI);
 return f.deck+.47;
}

export function buildEastBarracks({THREE,batch,key,platforms,ground,heightAt,section,flatFloor,inset,masks,record,detail}){
 record.barracks=[];record.openings=[];
 function panel(a,b,{id,floor,top,thickness=.6,openings=[],kind='east-render',broken=false,tint=.96}){
  const length=distance(a,b),holes=openings.map(o=>({...o,lo:Math.max(0,o.at-o.width/2),hi:Math.min(length,o.at+o.width/2)})).sort((a,b)=>a.lo-b.lo);
  const at=u=>lerp(a,b,u/length),height=p=>typeof top==='function'?top(p):top,
   nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length,
   foundation=p=>Math.min(floor-.18,heightAt(p.x+nx*(thickness*.55+.15),p.z+nz*(thickness*.55+.15))-.24,heightAt(p.x-nx*(thickness*.55+.15),p.z-nz*(thickness*.55+.15))-.24);
  let cursor=0;
  for(const hole of holes){
   if(hole.lo>cursor)section(at(cursor),at(hole.lo),{id,bottom:foundation,top,thickness,kind,broken,tint,seed:Math.round(hole.at*19)});
   if(hole.sill>.03)section(at(hole.lo),at(hole.hi),{id,bottom:foundation,top:floor+hole.sill,thickness,kind,tint});
   else section(at(hole.lo),at(hole.hi),{id,bottom:foundation,top:floor-.025,thickness,kind:'east-masonry',tint});
   if(hole.head<Math.min(height(at(hole.lo)),height(at(hole.hi)))-floor-.08)
    section(at(hole.lo),at(hole.hi),{id,bottom:floor+hole.head,top,thickness,kind,broken,tint});
   const p=at((hole.lo+hole.hi)/2),yaw=-Math.atan2(b.z-a.z,b.x-a.x);
   if(hole.head>0&&hole.head<height(p)-floor-.08)
    batch.box(key(id,'brick'),p.x,floor+hole.head+.065,p.z,hole.width+.24,.13,thickness+.055,yaw,.82);
   record.openings.push({building:id,kind:hole.sill>.03?'window':'door',center:[p.x,floor+(hole.head+hole.sill)/2,p.z],width:hole.width,height:hole.head-hole.sill,physical:true,photographicEstimate:true});
   cursor=hole.hi;
  }
  if(cursor<length)section(at(cursor),b,{id,bottom:foundation,top,thickness,kind,broken,tint,seed:342});
 }
 function sockets(a,b,y,id,count){
  if(detail!=='full')return;
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l,yaw=-Math.atan2(dz,dx);
  for(let i=0;i<count;i++){
   const p=lerp(a,b,(i+.5)/count),yy=(typeof y==='function'?y(p):y)+.025*Math.sin(i*2.7);
   // Shallow putlog recesses with a worn masonry rim, not blind painted doors.
   batch.box(key(id,'mortar'),p.x+nx*.32,yy,p.z+nz*.32,.14+rand(i)*.05,.16,.055,yaw,.48);
   batch.box(key(id,'brick'),p.x+nx*.34,yy+.10,p.z+nz*.34,.23,.045,.07,yaw,.83);
  }
 }
 function stair(a,b,floor,landing,width,id,steps){
  const l=distance(a,b),yaw=-Math.atan2(b.z-a.z,b.x-a.x);
  for(let i=0;i<steps;i++){
   const p=lerp(a,b,(i+.5)/steps),h=floor+(landing-floor)*(i+1)/steps,base=Math.min(floor-.08,heightAt(p.x,p.z)-.12);
   batch.box(key('east-stairs','worn-ashlar'),p.x,(h+base)/2,p.z,l/steps+.025,h-base,width,yaw,.91+rand(i+21)*.05);
  }
  record.stairs.push({platform:id,from:[a.x,floor,a.z],to:[b.x,landing,b.z],steps,width,estimated:true,orientation:'longitudinal'});
 }
 for(const f of platforms.filter(p=>p.id==='battery-n'||p.id==='battery-e')){
  const poly=f.polygon,plaza=ground.east.plane(f.center.x,f.center.z),floor=plaza-(f.id==='battery-n'?.65:.80);
  flatFloor(poly,floor,f.id+'-floor','east-earth',.96);
  if(f.id==='battery-n'){
   const outerW=poly[1],outerE=poly[2],innerW=poly[0],innerE=poly[3],length=distance(outerW,outerE),
    width=(distance(outerW,innerW)+distance(outerE,innerE))/2,
    tAdarve=Math.min(.40,1.25/width),backW=lerp(outerW,innerW,tAdarve),backE=lerp(outerE,innerE,tAdarve),
    high=ground.east.plane(f.center.x,f.center.z)+3.0,low=high-.95;
   const room=inset([backW,backE,innerE,innerW],.32);
   masks.push({id:f.id+'-rooms',outline:room,polygon:room,center:f.center,width:length,depth:width,floorY:floor,permanent:true,clipContext:false});
   const tread=p=>batteryLongitudinalPosition(f,p)<.49?high:low;
   // Narrow wall walk, stepped in two sections; the rest is an open interior.
   for(const [u,v,y]of [[.18,.49,high],[.49,1,low]]){
    const p=[lerp(outerW,outerE,u),lerp(outerW,outerE,v),lerp(backW,backE,v),lerp(backW,backE,u)];
    flatFloor(p,y+.025,f.id+'-adarve','east-earth',.93);
   }
   panel(backW,backE,{id:f.id,floor,top:tread,openings:[{at:length*.33,width:.85,sill:0,head:1.83},{at:length*.78,width:.92,sill:0,head:1.72}],thickness:.64});
   // Surviving outer face of roofless rooms: lower and interrupted, not a roof.
   panel(innerW,innerE,{id:f.id,floor,top:p=>floor+(batteryLongitudinalPosition(f,p)<.49?1.37:1.12),
    openings:[{at:distance(innerW,innerE)*.25,width:1.12,sill:0,head:3},{at:distance(innerW,innerE)*.66,width:1.0,sill:0,head:3}],thickness:.48,kind:'east-masonry',broken:true});
   for(const t of [0,.36,.65,1]){
    const a=lerp(backW,backE,t),b=lerp(innerW,innerE,t),len=distance(a,b);
    panel(a,b,{id:f.id,floor,top:p=>floor+1.34+(1-distance(a,p)/len)*.55,thickness:.45,kind:'east-masonry',broken:true,
     openings:t>0&&t<1?[{at:len*.63,width:.72,sill:0,head:2.2}]:[]});
   }
   const stairW=lerp(outerW,innerW,tAdarve*.52),stairE=lerp(lerp(outerW,outerE,.18),lerp(innerW,innerE,.18),tAdarve*.52);
   stair(stairW,stairE,plaza+.08,high,1.08,f.id,16);
   // Solid side cheek follows the stair slope rather than cutting across it.
   section(backW,lerp(backW,backE,.18),{id:f.id,bottom:plaza-.10,top:p=>plaza+(high-plaza)*clamp(distance(backW,p)/(length*.18))+.23,thickness:.24,kind:'east-render'});
   sockets(backW,backE,p=>tread(p)-.63,f.id,20);
   record.barracks.push({id:f.id,polygon:poly,floorY:floor,roof:false,wallWalkWidthsM:[1.25],wallWalkLevels:[high,low],openCourtyard:true,source:'Ricsol 24/28; Commons Plaça Almenara 01, 2014; mapped footprint',heightConfidence:'relative photographic estimate'});
  }else{
   // Eastern pavilion: high eastern back wall, open western facade with
   // surviving piers, rectangular northern end window and no restored roof.
   const outerS=poly[0],innerS=poly[1],innerN=poly[2],outerN=poly[3],length=distance(innerS,innerN),
    frontTop=p=>floor+2.55+.12*Math.sin(batteryLongitudinalPosition(f,p)*7),
    doorTs=[.13,.30,.49,.68,.85];
   const room=inset(poly,.45);
   masks.push({id:f.id+'-rooms',outline:room,polygon:room,center:f.center,width:length,depth:distance(innerS,outerS),floorY:floor,permanent:true,clipContext:false});
   panel(innerS,innerN,{id:f.id,floor,top:frontTop,thickness:.63,
    openings:doorTs.map((t,i)=>({at:length*t,width:i===2?1.07:.85,sill:0,head:1.93+(i%2)*.10})),broken:true,tint:.90});
   panel(innerN,outerN,{id:f.id,floor,top:floor+2.95,thickness:.70,
    openings:[{at:distance(innerN,outerN)*.53,width:1.07,sill:.94,head:2.25}],tint:.93});
   panel(outerS,innerS,{id:f.id,floor,top:floor+2.75,thickness:.65,
    openings:[{at:distance(outerS,innerS)*.45,width:.95,sill:0,head:2.04}],broken:true,tint:.9});
   // Back wall is the mapped curtain built by castle-east.js. Its inner face
   // retains beam sockets and a narrow horizontal masonry bearing scar.
   const backS=lerp(outerS,innerS,.13),backN=lerp(outerN,innerN,.13);
   sockets(backS,backN,floor+2.30,f.id,24);
   if(detail==='full')for(let i=0;i<9;i++){
    const a=lerp(innerS,innerN,(i+.45)/9),b=lerp(a,lerp(outerS,outerN,(i+.45)/9),.12);
    section(a,b,{id:f.id,bottom:floor+1.65,top:floor+2.48,thickness:.36,kind:'east-masonry',broken:true,seed:33+i});
   }
   record.barracks.push({id:f.id,polygon:poly,floorY:floor,roof:false,openCourtyard:true,source:'Ricsol 28, north-end window and western openings; Commons Plaça Almenara 02 used cautiously for surface character',heightConfidence:'relative photographic estimate'});
  }
  record.platforms.push({id:f.id,polygon:poly,deck:floor,roof:false,solidPodium:false,heightConfidence:'photographic-relative-estimate'});
 }
 return record.barracks;
}
