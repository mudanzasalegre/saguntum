// Stops are in the same UTM metre grid as the camera and the PNOA tiles.
import {project} from './territory-coordinates.js';
import {isHistoricalCircoStop,requestedVisitMode} from './visit-presentation.js';
const photoSize=1024;
export function visitMap(redraw){
  let place=null,current=null,windowBounds=null,targets=[];
  const cache=new Map(),pending=new Set();
  let blocks=null;
 let circusPlan=null,circusRequest=null;
 const wholeCircus=()=>place?.id==='circo'&&requestedVisitMode(place,current)==='historical';
 function visibleStops(){
  const stops=place?.guide?.stops||[];
  return place?.id==='circo'?stops.filter(s=>wholeCircus()?isHistoricalCircoStop(s)||s.id==='circo-puerta':!isHistoricalCircoStop(s)):stops;
 }
 function updateBounds(){
  const pts=visibleStops(),coordinates=place.id==='circo'?(wholeCircus()?circusPlan?.historicalOutline||circusPlan?.circusOutline:circusPlan?.archaeologyOutline||circusPlan?.outline):null;
  const outline=(coordinates||[]).map(c=>project(...c));
  const xs=[place.x,...pts.map(s=>s.x),...outline.map(p=>p.x)],zs=[place.z,...pts.map(s=>s.z),...outline.map(p=>p.z)];
  const l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...zs),b=Math.max(...zs);
  const margin=place.id==='circo'?Math.max(8,.08*Math.max(r-l,b-t)):Math.max(18,.15*Math.max(r-l,b-t));
  windowBounds=[l-margin,t-margin,r+margin,b+margin];
 }
  function requestPhoto(key){
    if(cache.has(key)||pending.has(key)||!blocks)return;
    const [x,z]=key.split('_').map(Number);
    if(!blocks.has(Math.floor(x/4)+'_'+Math.floor(z/4)))return;
    pending.add(key);
    const im=new Image();
    im.onload=()=>{pending.delete(key);cache.set(key,im);if(cache.size>9)cache.delete(cache.keys().next().value);redraw();};
    im.onerror=()=>{pending.delete(key);cache.set(key,null);};
    im.src='./assets/territory/landscape/p'+key+'.webp';
  }
  let manifest;
  function set(p,stop){
    const changed=p!==place;
    place=p;current=stop;targets=[];
    if(!changed&&p?.id!=='circo')return;
    if(!p){windowBounds=null;return;}
    updateBounds();
    if(p.id==='circo'&&!circusPlan&&!circusRequest)circusRequest=fetch(new URL('../assets/data/circo-plan.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Plano del circo no disponible');return r.json();}).then(plan=>{
      circusPlan=plan;if(place?.id==='circo'){updateBounds();redraw();}
    }).catch(()=>{circusRequest=null;});
    if(!manifest)manifest=fetch('./assets/territory/landscape/index.json').then(r=>r.json()).then(d=>{
      blocks=new Set(d.pnoaBlocks.map(b=>b.join('_')));redraw();
    }).catch(()=>{manifest=null;});
  }
  function background(c,{x,z},large,dpr){
    if(!windowBounds||!place)return;
    const [l,t,r,b]=windowBounds;
    // For the long river walk the regional base already has enough resolution.
    if(Math.max(r-l,b-t)<2600){
      for(let i=Math.floor(l/photoSize);i<=Math.floor(r/photoSize);i++)for(let j=Math.floor(t/photoSize);j<=Math.floor(b/photoSize);j++){
        const key=i+'_'+j,im=cache.get(key);
        if(im)c.drawImage(im,x(i*photoSize),z(j*photoSize),x((i+1)*photoSize)-x(i*photoSize),z((j+1)*photoSize)-z(j*photoSize));
        else requestPhoto(key);
      }
    }
    c.fillStyle='rgba(24,42,38,.23)';c.fillRect(0,0,c.canvas.width,c.canvas.height);
    targets=[];
    if(place.id==='circo'&&circusPlan){
      const historical=wholeCircus(),shape=historical?circusPlan.historicalOutline||circusPlan.circusOutline:circusPlan.archaeologyOutline||circusPlan.outline;
      const path=coordinates=>{if(!coordinates?.length)return false;c.beginPath();coordinates.forEach((ll,i)=>{const p=project(...ll);i?c.lineTo(x(p.x),z(p.z)):c.moveTo(x(p.x),z(p.z));});c.closePath();return true;};
      if(path(shape)){c.fillStyle=historical?'#ad936e':'#b7a082';c.fill();}
      for(const part of circusPlan.components||[]){
        if(historical?['contemporary','contemporanea'].includes(part.period)||part.kind==='context-building':part.scope==='circus')continue;
        if(!path(part.coordinates))continue;
        const gate=part.id==='puerta';c.strokeStyle=gate?'#fff0b9':part.period==='interpretacion'?'#655648':'#6e5b42';
        c.lineWidth=(gate?2.4:1)*dpr;c.setLineDash(part.interpretive?[4*dpr,3*dpr]:[]);
        if(part.closed){c.fillStyle=gate?'#a78250':'rgba(91,68,40,.16)';c.fill();}c.stroke();c.setLineDash([]);
      }
      if(path(circusPlan.outline)){c.strokeStyle='#fff3cb';c.lineWidth=1.5*dpr;c.stroke();}
      if(large){c.font='600 '+Math.round(12*dpr)+'px sans-serif';c.fillStyle='#fff7df';c.strokeStyle='#2c4039';c.lineWidth=3*dpr;const label=historical?'CIRCO COMPLETO · 6 PARADAS Y PUERTA 3':'PUERTA ACTUAL · 14 PARADAS';c.strokeText(label,9*dpr,18*dpr);c.fillText(label,9*dpr,18*dpr);}
    }
    const stops=visibleStops(),radius=(large?10:3)*dpr;
    for(const s of stops){
      const ax=x(s.x),ay=z(s.z);
      let u=ax,v=ay;
      if(large){
        for(let n=0;n<86&&targets.some(q=>Math.hypot(u-q.x,v-q.y)<radius*2.2);n++){
          const a=n*2.4,d=radius*1.5*Math.sqrt(1+n*.25);
          u=Math.max(radius,Math.min(c.canvas.width-radius,ax+Math.cos(a)*d));
          v=Math.max(radius,Math.min(c.canvas.height-radius,ay+Math.sin(a)*d));
        }
        c.strokeStyle='#34463c';c.lineWidth=dpr;c.beginPath();c.moveTo(ax,ay);c.lineTo(u,v);c.stroke();
      }
      targets.push({x:u,y:v,s,r:radius+(large?3:1)*dpr});
    }
    // Keep the active stop readable when two periods refer to the same coordinate.
    for(const q of [...targets].sort((a,b)=>(a.s===current)-(b.s===current))){
      const active=q.s===current;
      c.beginPath();c.arc(q.x,q.y,radius*(active?1.12:1),0,2*Math.PI);c.fillStyle=active?'#714126':'#fff2cc';c.fill();
      c.lineWidth=dpr;c.strokeStyle=active?'#fff3d8':'#534e3e';c.stroke();
      if(large){c.font='600 '+Math.round(11*dpr)+'px sans-serif';c.fillStyle=active?'#fff':'#352f22';c.textAlign='center';c.textBaseline='middle';c.fillText(q.s.number,q.x,q.y);}
    }
    c.textBaseline='alphabetic';c.textAlign='left';
  }
  return {set,background,get bounds(){return windowBounds;},hit(x,y){
    return targets.filter(q=>Math.hypot(q.x-x,q.y-y)<=q.r).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]?.s;
  }};
}
