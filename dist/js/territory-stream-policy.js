// Pure streaming policy, shared by the building, road and heritage queues.
// Coordinates, radii and velocity are in metres (UTM local drawing frame).
export const boundsDistance=(x,z,[l,t,r,b])=>Math.hypot(Math.max(l-x,0,x-r),Math.max(t-z,0,z-b));
const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
export function movementLead(x,z,dx,dz,seconds,mode,budget,range=Infinity,rangeDelta=0,mobile=false){
  // Sample the displacement of the streaming focus. Orbiting around a fixed
  // point does not imply travel to the opposite side of the city.
  const distance=Math.hypot(dx,dz),speed=distance/seconds;
  if(!Number.isFinite(speed)||seconds<.004||seconds>1||distance>Math.max(100,seconds*240))return null;
  const closing=mode!=='walk'&&Number.isFinite(range)?Math.max(0,-rangeDelta/seconds):0;
  if(speed<.35&&closing<3)return null;
  const horizon=mode==='walk'?5:mode==='orbit'?2.4:4.5;
  const cap=mode==='walk'?22:Math.min(mobile?220:560,[260,400,560][budget]);
  const length=speed<.35?0:Math.min(cap,speed*horizon),factor=distance?length/distance:0;
  const result={x:x+dx*factor,z:z+dz*factor,length};
  if(Number.isFinite(range))result.range=Math.max(range*.38,range-Math.min(cap,closing*horizon));
  return result;
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
    // Reserve the actual cell containing the approaching site, while keeping
    // the occupied cell first. geometryBounds can extend into a neighbouring tile.
    const cell=s.bounds||bounds;
    const target=hint?.site&&boundsDistance(hint.site.x,hint.site.z,cell)===0;
    if(!resident&&ahead>radius*.7&&!target)continue;
    const occupied=boundsDistance(x,z,cell)===0;
    const priority=occupied?-2:target?-1:d<=radius*.32?d*.55:Math.min(d,ahead+radius*.38);
    scored.push({s,d,priority:priority*(retained?.83:1)});
  }
  return scored.sort((a,b)=>a.priority-b.priority||a.d-b.d||String(a.s.id).localeCompare(String(b.s.id))).slice(0,max).map(o=>[o.s,o.d]);
}
export function heritageWindow({distance,ahead,range,predictedRange=range,reach,close,loaded,native,selected,stop,quality,mobile}){
  const retain=loaded?1.25:1,detailScale=mobile?1.05:[1.08,1.25,1.55][quality];
  const buildReach=reach*detailScale;
  const warm=range<Math.max(950,reach*2.8)&&Math.min(distance,ahead+80)<reach*(mobile?2:2.8);
  const active=stop||selected&&distance<reach*1.65&&range<Math.max(1600,reach*5);
  const visible=active||distance<=buildReach*retain&&range<=buildReach*(loaded?1.38:1.14);
  // Use the original, interactive source constructor before reaching the door.
  const nativeReach=close*(mobile?1.25:[1.25,1.55,1.85][quality])*(native?1.28:1);
  const full=active||distance<nativeReach&&range<nativeReach*1.35;
  const approaching=Number.isFinite(ahead)&&(ahead+2<distance||predictedRange+5<range);
  const margin=mobile?160:[185,280,400][quality];
  const prepareUrban=approaching&&ahead<buildReach&&distance<buildReach+margin&&
    predictedRange<buildReach*1.1&&range<buildReach*1.85;
  const prepareFull=approaching&&ahead<nativeReach&&distance<nativeReach+margin&&
    predictedRange<nativeReach*1.24&&range<nativeReach*2.15;
  const score=stop?-1e9:Math.min(distance,ahead+buildReach*.42)/(loaded?1.3:1)-(selected?reach:0);
  return {warm,visible,full,prepareUrban,prepareFull,score};
}
export function closeFabricBudget(budget,range){
  const near=range<70;
  return {reach:near?[26,49,82][budget]:[22,39,63][budget],count:near?[34,64,112][budget]:[30,54,88][budget],work:[850,1600,3100][budget]};
}
