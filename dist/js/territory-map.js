export function terrainMap({world,network,zones,places,image,onPoint}){
  const canvas=document.getElementById('sim-map'),box=document.getElementById('sim-map-box');
  const ctx=canvas.getContext('2d'),base=document.createElement('canvas');let transform,municipal=false,dirty=true,last;
  function extent(){return municipal?world.bounds:[1700,-2650,11700,5500];}
  function background(){
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    const w=Math.max(1,Math.round(r.width*Math.min(2,devicePixelRatio))),h=Math.max(1,Math.round(r.height*Math.min(2,devicePixelRatio)));
    if(!dirty&&w===base.width&&h===base.height)return;
    base.width=canvas.width=w;base.height=canvas.height=h;
    const c=base.getContext('2d'),[l,t,k,b]=extent(),s=Math.min(w/(k-l),h/(b-t)),cx=(l+k)/2,cz=(t+b)/2;
    transform={s,x:v=>(v-cx)*s+w/2,z:v=>(v-cz)*s+h/2,cx,cz};
    const {x,z}=transform;c.fillStyle='#344e4b';c.fillRect(0,0,w,h);
    const [ll,tt,rr,bb]=world.bounds;
    c.drawImage(image,x(ll),z(tt),(rr-ll)*s,(bb-tt)*s);c.fillStyle='rgba(23,42,39,.25)';c.fillRect(0,0,w,h);
    function line(p,color,width,close=false){
      if(!p.length)return;c.beginPath();c.moveTo(x(p[0][0]),z(p[0][1]));
      for(let i=1;i<p.length;i++)c.lineTo(x(p[i][0]),z(p[i][1]));if(close)c.closePath();c.strokeStyle=color;c.lineWidth=width;c.stroke();
    }
    for(const poly of world.water){
      c.beginPath();
      for(const ring of [poly.outer,...(poly.holes||[])]){c.moveTo(x(ring[0][0]),z(ring[0][1]));for(const p of ring.slice(1))c.lineTo(x(p[0]),z(p[1]));c.closePath();}
      c.fillStyle='#426e74';c.fill('evenodd');
    }
    world.municipality.forEach(p=>line(p.outer,'rgba(253,229,163,.8)',1.4,true));
    network.major.forEach(r=>line(r.points,'rgba(246,235,202,.48)',.8));
    line(network.route,'#f1c16f',2);
    const big=box.classList.contains('expanded')||document.body.classList.contains('map-only');
    if(big){c.fillStyle='#fae0a0';for(const p of places){c.beginPath();c.arc(x(p.x),z(p.z),2.5,0,2*Math.PI);c.fill();}}
    for(const p of zones){
      c.fillStyle='#e6d2a5';c.beginPath();c.arc(x(p.x),z(p.z),3,0,2*Math.PI);c.fill();
      c.font='600 '+(big?17:13)+'px Manrope, sans-serif';c.lineWidth=3;c.strokeStyle='#263b36';
      const labelX=Math.max(2,Math.min(w-c.measureText(p.short).width-3,x(p.x)+5));
      c.strokeText(p.short,labelX,z(p.z)-4);c.fillText(p.short,labelX,z(p.z)-4);
    }
    dirty=false;
  }
  function draw(p,target,direction){
    last=[p,target,direction];
    background();if(!transform)return;ctx.drawImage(base,0,0);
    const {x,z}=transform;
    if(target&&Math.hypot(target.x-p.x,target.z-p.z)>80){
      ctx.strokeStyle='#fff6';ctx.beginPath();ctx.moveTo(x(p.x),z(p.z));ctx.lineTo(x(target.x),z(target.z));ctx.stroke();
      ctx.fillStyle='#f7d5a7';ctx.fillRect(x(target.x)-2,z(target.z)-2,4,4);
    }
    ctx.save();ctx.translate(Math.max(7,Math.min(canvas.width-7,x(p.x))),Math.max(7,Math.min(canvas.height-7,z(p.z))));ctx.rotate(Math.atan2(direction.x,-direction.z));
    ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fillStyle='#fff8d3';ctx.fill();ctx.lineWidth=1.3;ctx.strokeStyle='#253634';ctx.stroke();ctx.restore();
    document.getElementById('sim-grid').textContent=Math.round(730000+p.x)+' E';
  }
  canvas.onclick=e=>{
    if(!transform)return;
    const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*canvas.width/r.width,mz=(e.clientY-r.top)*canvas.height/r.height;
    const {cx,cz,s}=transform,xx=(mx-canvas.width/2)/s+cx,zz=(mz-canvas.height/2)/s+cz;
    const candidates=places.map(p=>[p,Math.hypot(p.x-xx,p.z-zz)]).sort((a,b)=>a[1]-b[1]);
    onPoint(xx,zz,candidates[0]?.[1]<Math.min(150,6/s)?candidates[0][0]:null);
  };
  function redraw(){dirty=true;if(last)requestAnimationFrame(()=>draw(...last));}
  document.getElementById('sim-expand').onclick=e=>{const b=box.classList.toggle('expanded');e.currentTarget.setAttribute('aria-expanded',b);redraw();};
  document.getElementById('sim-extent').onclick=e=>{municipal=!municipal;e.currentTarget.textContent=municipal?'Ver corredor':'Ver municipio';redraw();};
  return {draw,close(){box.classList.remove('expanded');document.getElementById('sim-expand').setAttribute('aria-expanded','false');dirty=true;}};
}
