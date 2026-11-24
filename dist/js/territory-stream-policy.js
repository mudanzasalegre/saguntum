// Pure streaming policy, shared by the building, road and heritage queues.
// Coordinates, radii and velocity are in metres (UTM local drawing frame).
export const boundsDistance=(x,z,[l,t,r,b])=>Math.hypot(Math.max(l-x,0,x-r),Math.max(t-z,0,z-b));
const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
export function movementLead(x,z,dx,dz,seconds,mode,budget){
  if(mode==='orbit'||!Number.isFinite(seconds)||seconds<.004||seconds>.25)return null;
  const speed=Math.hypot(dx,dz)/seconds;
  // A teleport, restored camera or suspended frame is not a travel forecast.
  if(!Number.isFinite(speed)||speed<.35||Math.hypot(dx,dz)>100)return null;
  const horizon=mode==='walk'?5:4.5,cap=mode==='walk'?22:[260,400,560][budget];
  const length=Math.min(cap,speed*horizon);
  return {x:x+dx/seconds/speed*length,z:z+dz/seconds/speed*length,length};
}
export function selectSectors(index,x,z,radius,max,live,hint){
  if(!(radius>0&&max>0))return [];
  const current=new Set(live.keys());
  const scored=[];
  for(const s of index){
    const bounds=s.geometryBounds||s.bounds,d=boundsDistance(x,z,bounds);
    const ahead=hint?boundsDistance(hint.x,hint.z,bounds):Infinity;
    const retained=current.has(s.id),resident=d<=radius*(retained?1.17:1);
    // Always admit the occupied sector, then a forward corridor. The lead
    // point can never displace the nearest quarter of the visible radius.
    if(!resident&&ahead>radius*.7)continue;
    const priority=d<=radius*.32?d*.55:Math.min(d,ahead+radius*.42);
    scored.push({s,d,priority:priority*(retained?.83:1)});
  }
  return scored.sort((a,b)=>a.priority-b.priority||a.d-b.d||String(a.s.id).localeCompare(String(b.s.id))).slice(0,max).map(o=>[o.s,o.d]);
}
export function heritageWindow({distance,ahead,range,reach,close,loaded,native,selected,stop,quality,mobile}){
  const retain=loaded?1.25:1,detailScale=mobile?1.05:[1.08,1.25,1.55][quality];
  const buildReach=reach*detailScale;
  const warm=range<Math.max(950,reach*2.8)&&Math.min(distance,ahead+80)<reach*(mobile?2:2.8);
  const active=stop||selected&&distance<reach*1.65&&range<Math.max(1600,reach*5);
  const visible=active||distance<=buildReach*retain&&range<=buildReach*(loaded?1.38:1.14)||
    (ahead<buildReach*.63&&distance<buildReach*1.65&&range<buildReach*.95);
  // Use the original, interactive source constructor before reaching the door.
  const nativeReach=close*(mobile?1.25:[1.25,1.55,1.85][quality])*(native?1.28:1);
  const full=active||distance<nativeReach&&range<nativeReach*1.35||
    ahead<nativeReach*.7&&distance<nativeReach*1.55&&range<nativeReach;
  const score=stop?-1e9:Math.min(distance,ahead+buildReach*.42)/(loaded?1.3:1)-(selected?reach:0);
  return {warm,visible,full,score};
}
export function closeFabricBudget(budget,range){
  const near=range<70;
  return {reach:near?[26,49,82][budget]:[22,39,63][budget],count:near?[34,64,112][budget]:[30,54,88][budget],work:[850,1600,3100][budget]};
}
