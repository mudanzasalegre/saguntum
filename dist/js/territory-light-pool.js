import {Group,SpotLight,MathUtils} from 'three';

// Only mapped luminaires from the visible furniture batches can enter the pool.
// Keep its identities/layout constant while moving: no new light shader variant
// for each street, and no per-lamp shadow maps over the municipality.
export function selectStreetLights(sources,{x,z,range=0,budget=2,night=0,enabled=true,compact=false,retained=new Set(),blocked=()=>false}){
  if(!enabled||night<=.025||range>125||!Number.isFinite(x)||!Number.isFinite(z))return [];
  const limit=(compact?[1,2,2]:[1,2,4])[Math.max(0,Math.min(2,budget|0))];
  const candidates=[],seen=new Set();
  for(const source of sources){
    if(![source.x,source.y,source.z].every(Number.isFinite))continue;
    const key=source.key||`${source.x.toFixed(2)}/${source.z.toFixed(2)}`;
    if(seen.has(key))continue;
    seen.add(key);
    const distance=Math.hypot(source.x-x,source.z-z);
    if(distance>=76||blocked(source.baseX??source.x,source.baseZ??source.z))continue;
    const weight=(1-MathUtils.smoothstep(distance,32,76))*(1-MathUtils.smoothstep(range,65,125));
    if(weight<=.001)continue;
    candidates.push({...source,key,distance,weight,priority:distance*(retained.has(key)?.78:1)});
  }
  return candidates.sort((a,b)=>a.priority-b.priority||a.key.localeCompare(b.key)).slice(0,limit);
}

export function territoryStreetLights(scene,{compact=false}={}){
  const group=new Group();group.name='Luz de las farolas próximas';
  const slots=Array.from({length:compact?2:4},()=>{
    const light=new SpotLight('#ffe3b5',0,23,.94,.58,2);
    light.castShadow=false;group.add(light,light.target);
    return {light,key:null,target:0};
  });
  scene.add(group);
  const stats={allocated:slots.length,active:0,mapped:0,shadows:0};
  let disposed=false;
  return {
    stats,
    update(sources,options){
      if(disposed)return;
      const retained=new Set(slots.map(slot=>slot.key).filter(Boolean));
      const chosen=selectStreetLights(sources,{...options,compact,retained});
      const desired=new Map(chosen.map(row=>[row.key,row]));
      // First retain assigned lamps, then fill vacancies. Do not exchange two
      // light identities whenever their distance ordering changes.
      for(const slot of slots)if(!desired.has(slot.key)){slot.key=null;slot.target=0;}
      for(const row of chosen){
        let slot=slots.find(s=>s.key===row.key);
        if(!slot){slot=slots.find(s=>s.key===null);slot.light.intensity=0;slot.key=row.key;}
        slot.light.position.set(row.x,row.y,row.z);
        slot.light.target.position.set(row.x,row.ground??row.y-5.125,row.z);
        slot.target=260*Math.max(0,Math.min(1,options.night))*row.weight;
      }
      stats.mapped=chosen.length;
    },
    animate(dt){
      if(disposed)return;
      const blend=1-Math.exp(-Math.max(0,Math.min(.1,dt))*10);
      stats.active=0;
      for(const slot of slots){
        slot.light.intensity=MathUtils.lerp(slot.light.intensity,slot.target,blend);
        if(slot.light.intensity<.01)slot.light.intensity=0;
        if(slot.light.intensity>.1)stats.active++;
      }
    },
    dispose(){
      if(disposed)return;disposed=true;group.removeFromParent();
      for(const {light} of slots)light.dispose();
      stats.active=stats.mapped=0;
    }
  };
}
