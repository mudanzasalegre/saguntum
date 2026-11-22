const metres=111320,longitude=metres*Math.cos(39.679*Math.PI/180);
export function drawGlorietaMap(canvas,cartography,visit,{selected,large=false,palette={},readingMode}={}){
 const {layout,buildings}=visit.plan,historic=canvas.dataset.epoch?canvas.dataset.epoch==='old':readingMode==='periods';
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const toXY=([lon,lat])=>[(lon+.278)*longitude,(39.679-lat)*metres];
 const area=layout.perimeter.map(toXY),xs=area.map(p=>p[0]),ys=area.map(p=>p[1]);
 const l=Math.min(...xs)-22,r=Math.max(...xs)+22,t=Math.min(...ys)-18,b=Math.max(...ys)+24;
 const scale=Math.min(w/(r-l),h/(b-t))*.94;
 const screen=(x,y)=>[w/2+(x-(l+r)/2)*scale,h/2+(y-(t+b)/2)*scale];
 const point=ll=>screen(...toXY(ll));
 function path(ring,fill,stroke){
  if(!ring?.length)return;
  ctx.beginPath();ring.forEach((p,i)=>{const [x,y]=point(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
  if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
 }
 ctx.fillStyle=palette.surface||'#222d2c';ctx.fillRect(0,0,w,h);ctx.lineWidth=1;
 for(const road of buildings.roads||[]){
  ctx.beginPath();
  for(const loop of [road.outer,...road.holes]){loop.forEach(([x,z],i)=>{const [u,v]=screen(x,z);if(i)ctx.lineTo(u,v);else ctx.moveTo(u,v);});ctx.closePath();}
  ctx.fillStyle='#686c67';ctx.fill('evenodd');
 }
 for(const ring of buildings.protectedFootprints.map(f=>f.coordinates))path(ring,'#8e887a','#615f58');
 path(layout.perimeter,'#d5c8ac','#988767');
 if(historic){for(const f of layout.history.features)path(f.ring,f.kind==='garden'?'#84a98c':'#b2a084','#486c53');}
 else{
  for(const f of layout.beds)path(f.ring,'#819366','#5f745c');
  for(const f of layout.play)path(f.ring,'#ba9074','#866c56');
  for(const f of layout.pavilions)path(f.ring,'#ad9278','#715b4c');
  path(layout.fountain.ring,'#78aaba','#43717b');path(layout.pergola.ring,'#aa997d','#736751');
  for(const tree of layout.trees){const [x,y]=point(tree.point);ctx.fillStyle='#516e5488';ctx.beginPath();ctx.arc(x,y,Math.max(1,tree.radius*scale),0,2*Math.PI);ctx.fill();}
 }
 const targets=[],radius=large?10:5;
 for(const [i,s] of visit.stops.entries()){
  let [x,y]=point(s.coordinate),ax=x,ay=y;
  for(let k=0;k<72&&targets.some(q=>Math.hypot(q.x-x,q.y-y)<2*radius+2);k++){
   const a=k*2.4,rr=(2*radius+2)*Math.sqrt(1+k/4);x=Math.max(radius,Math.min(w-radius,ax+Math.cos(a)*rr));y=Math.max(radius,Math.min(h-radius,ay+Math.sin(a)*rr));
  }
  ctx.strokeStyle='#6a6659';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(x,y);ctx.stroke();targets.push({id:s.id,x,y,r:radius+3,index:i+1});
 }
 for(const q of targets){ctx.beginPath();ctx.arc(q.x,q.y,radius,0,2*Math.PI);ctx.fillStyle=q.id===selected?'#8b502d':'#faf4df';ctx.fill();ctx.strokeStyle='#685c47';ctx.stroke();ctx.fillStyle=q.id===selected?'white':'#322f29';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 '+(large?10:7)+'px sans-serif';ctx.fillText(q.index,q.x,q.y);}
 ctx.fillStyle=palette.text||'#dcd8c7';ctx.font='11px sans-serif';ctx.textAlign='right';ctx.fillText('N ↑',w-10,12);
 const bar=20*scale;ctx.fillRect(w-bar-12,h-10,bar,2);ctx.fillText('20 m',w-12,h-19);
 return {targets,hitTarget(x,y){return targets.filter(q=>Math.hypot(x-q.x,y-q.y)<=q.r).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0]?.id;}};
}
