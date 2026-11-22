// Geographic plan of the two pier visits. Current gaps are never filled with a
// walkway. The optional longitudinal strip is an explanatory, exaggerated profile.
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const fallbackPalette={background:'#e9ede5',surface:'#faf9f2',text:'#243e40',muted:'#607674',accent:'#9b653d',accentInk:'#fff9ef',road:'#c9c7ba',building:'#c6bda8',water:'#7eafb6'};
const colors={paving:'#c6b29d',promenade:'#c6b29d',pergola:'#ad936d',wood:'#a7845e',cycle:'#be8069',landscape:'#a7b48c',planting:'#a7b48c',hopper:'#b76a3e',machine:'#b76a3e',conveyor:'#9f7963',deck:'#b6b8ad',platform:'#b6b8ad',support:'#8c9994',pile:'#8c9994',riprap:'#bab5a3',rocks:'#bab5a3',activity:'#c1b8a6',cycleway:'#be8069',machinery:'#b76a3e',historicDeck:'#b6b8ad',timber:'#a7845e',ramp:'#d0c9b9',play:'#bdad85',footbridge:'#9a9d95',access:'#d0c9b9',stairs:'#d0c9b9'};
const ringOf=item=>item.coordinates||item.polygon||item.outline||[];

export function drawPantalanMap(canvas,geo,data,{selected=null,large=false,insets={},showLabels=true,palette={},readingMode='materials',presentationMode='current',modelGeometry=null,water=null,sectionOpen=false}={}){
 if(!canvas||!data)return null;
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p={...fallbackPalette,...palette},plan=modelGeometry||data.plan||{},sea=data.id==='pantalan-maritimo';
 if(!ctx||!w||!h)return null;
 const axis=plan.axis||data.axis||{origin:[-.2108985578746818,39.65445390087127],unit:[.8560044716501247,.5169684173283615]},origin=project(...axis.origin),unit=axis.unit||[.8560044716501247,.5169684173283615];
 const local=coordinate=>{const point=project(...coordinate),dx=point.x-origin.x,dz=point.z-origin.z;return{s:dx*unit[0]+dz*unit[1],c:-dx*unit[1]+dz*unit[0]};};
 const stops=(data.stops||[]).map((stop,index)=>({...stop,index:index+1,coordinate:(plan.stops?.find?.(s=>s.id===stop.id)?.coordinate||plan.stops?.find?.(s=>s.id===stop.id)?.coordinates)||stop.coordinate||stop.coordinates})).filter(s=>Array.isArray(s.coordinate)&&s.coordinate.length===2);
 const mode=presentationMode==='historical'?'historical':'current',allComponents=plan.components||plan.features||[];
 const components=allComponents.filter(item=>!item.mode||item.mode==='both'||item.mode===mode||item.modes?.includes(mode));
 const area={x:(insets.left||0)+(large?22:9),y:(insets.top||0)+(large&&showLabels?38:10),w:Math.max(1,w-(insets.left||0)-(insets.right||0)-(large?44:18)),h:Math.max(1,h-(insets.top||0)-(insets.bottom||0)-(large?58:20))};
 const profileShown=large&&area.w>520&&area.h>250,profileHeight=profileShown?100:0,plant={...area,h:area.h-profileHeight};
 const vertical=plant.h>plant.w*1.22,range=sea?[435,1700]:[-195,510],middle=(range[0]+range[1])/2;
 const along=range[1]-range[0],baseCross=sea?170:210,cross=Math.max(baseCross,along*(vertical?plant.w/plant.h:plant.h/plant.w));
 const scale=Math.min((vertical?plant.h:plant.w)/along,(vertical?plant.w:plant.h)/cross)*.88,center={x:plant.x+plant.w/2,y:plant.y+plant.h/2};
 const mapLocal=(s,c)=>vertical?{x:center.x-c*scale,y:center.y+(s-middle)*scale}:{x:center.x+(s-middle)*scale,y:center.y+c*scale};
 const map=coordinate=>{const q=local(coordinate);return mapLocal(q.s,q.c);};
 const line=(points,color,width=1,dash=[])=>{if(points.length<2)return;ctx.beginPath();points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
 const polygon=(coordinates,fill,stroke=null,width=1,holes=[])=>{if(coordinates.length<3)return;ctx.beginPath();for(const ring of[coordinates,...holes]){ring.forEach((c,i)=>{const q=map(c);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();}if(fill){ctx.fillStyle=fill;ctx.fill('evenodd');}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
 const visible=coordinates=>coordinates.some(c=>{const q=local(c);return q.s>range[0]-150&&q.s<range[1]+150&&Math.abs(q.c)<cross;});
 ctx.clearRect(0,0,w,h);ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.rect(plant.x,plant.y,plant.w,plant.h);ctx.clip();
 // Exact shoreline polygons are shared with the 3D sea, including harbour land.
 const waterPolygons=water?.polygons||plan.waterPolygons||[];
 if(waterPolygons.length){for(const poly of waterPolygons)polygon(poly.outer,p.water||fallbackPalette.water,null,1,poly.holes||[]);}else if(sea){ctx.fillStyle=p.water||fallbackPalette.water;ctx.fillRect(plant.x,plant.y,plant.w,plant.h);}
 for(const cover of geo?.landcover||[]){const ring=ringOf(cover);if(ring.length<3||!visible(ring))continue;const kind=cover.kind||cover.type;polygon(ring,/beach|sand/.test(kind)?'#d3c8ad':/grass|scrub|wood|park|forest/.test(kind)?'#a6b38f':null);}
 for(const building of geo?.buildings||[]){const ring=ringOf(building);if(ring.length<3||!visible(ring))continue;polygon(ring,p.building||'#b9b2a2',p.background,.7,building.holes||[]);}
 for(const road of geo?.roads||[]){if(!road.coordinates?.length||!visible(road.coordinates))continue;line(road.coordinates.map(map),p.road||'#bcbcaf',Math.max(.8,Math.min(6,scale*(road.kind==='footway'||road.kind==='path'?2.1:5))));}
 const layers=Object.fromEntries((data.readingLegend||[]).map(item=>[item.id,item.color]));
 for(const item of components){const ring=ringOf(item);if(!ring.length)continue;const color=readingMode==='periods'?(layers[item.readingLayer||item.regionId]||colors[item.kind]||p.accent):(colors[item.kind]||item.color||'#b7b6a7');
  if(item.line||item.type==='LineString'||ring.length===2)line(ring.map(map),color,Math.max(1.5,Math.min(7,(item.width||2)*scale)));
  else polygon(ring,color,p.text,large?.65:.45,item.holes||[]);
 }
 // If a survey component is too thin at regional scale its outline stays legible.
 const supports=(plan.supports||[]).filter(s=>mode==='historical'||s.current!==false);
 for(const support of supports){const coordinate=support.coordinate||support.coordinates;if(!Array.isArray(coordinate)||!Number.isFinite(coordinate[0]))continue;const q=map(coordinate);ctx.beginPath();ctx.arc(q.x,q.y,large?2.8:1.5,0,Math.PI*2);ctx.fillStyle=p.text;ctx.fill();}
 if(water?.coastline)line(water.coastline.map(map),p.muted,large?.8:.5);
 ctx.restore();
 const targets=[],placed=[],radius=large?12:7.5,gap=large?29:18;
 const clamp=q=>({x:Math.max(plant.x+radius+2,Math.min(plant.x+plant.w-radius-2,q.x)),y:Math.max(plant.y+radius+2,Math.min(plant.y+plant.h-radius-2,q.y))});
 const free=q=>placed.every(old=>Math.hypot(q.x-old.x,q.y-old.y)>=gap);
 for(const stop of [...stops].sort((a,b)=>(b.id===selected)-(a.id===selected))){const real=map(stop.coordinate);let draw=clamp(real);
  if(!free(draw)){let best=null,distance=Infinity;for(let n=0;n<850;n++){const r=gap*.5+Math.sqrt(n)*gap*.39,q=clamp({x:real.x+Math.cos(n*2.399963)*r,y:real.y+Math.sin(n*2.399963)*r});if(free(q)){const d=Math.hypot(q.x-real.x,q.y-real.y);if(d<distance){distance=d;best=q;}if(n>95&&best)break;}}if(best)draw=best;}
  placed.push(draw);targets.push({...draw,real,id:stop.id,index:stop.index,r:large?19:12,coordinate:stop.coordinate,readingLayer:stop.readingLayer,available:!stop.mode||stop.mode===mode});
 }
 for(const target of targets)if(Math.hypot(target.x-target.real.x,target.y-target.real.y)>3){line([target.real,target],p.muted,large?1:.7);ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(target.real.x,target.real.y,large?2:1.3,0,Math.PI*2);ctx.fill();}
 for(const target of [...targets].sort((a,b)=>(a.id===selected)-(b.id===selected))){const active=target.id===selected,fill=readingMode==='periods'?(layers[target.readingLayer]||p.accent):active?p.accent:p.surface;
  if(active){ctx.beginPath();ctx.arc(target.x,target.y,radius+4,0,Math.PI*2);ctx.strokeStyle=p.accent;ctx.lineWidth=1.6;ctx.stroke();}
  ctx.beginPath();ctx.arc(target.x,target.y,radius,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=target.available?p.text:p.muted;ctx.lineWidth=1;ctx.setLineDash(target.available?[]:[2,2]);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=active&&readingMode!=='periods'?p.accentInk:p.text;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 '+(large?12:9)+'px Manrope,sans-serif';ctx.fillText(String(target.index),target.x,target.y+.5);
 }
 // The compass follows the rotated map; it never falsely implies north is up.
 const nq=map([axis.origin[0],axis.origin[1]+.0001]),oq=map(axis.origin),nd={x:nq.x-oq.x,y:nq.y-oq.y},nl=Math.hypot(nd.x,nd.y),nc={x:plant.x+plant.w-22,y:plant.y+21};nd.x/=nl;nd.y/=nl;
 line([{x:nc.x-nd.x*8,y:nc.y-nd.y*8},{x:nc.x+nd.x*10,y:nc.y+nd.y*10}],p.text,1.5);ctx.beginPath();ctx.moveTo(nc.x+nd.x*10,nc.y+nd.y*10);ctx.lineTo(nc.x+nd.x*4-nd.y*3,nc.y+nd.y*4+nd.x*3);ctx.lineTo(nc.x+nd.x*4+nd.y*3,nc.y+nd.y*4-nd.x*3);ctx.closePath();ctx.fillStyle=p.text;ctx.fill();ctx.font=(large?11:9)+'px Manrope,sans-serif';ctx.textAlign='center';ctx.fillText('N',nc.x+nd.x*18,nc.y+nd.y*18);
 const scaleMetres=sea?100:50,bar=scaleMetres*scale,sx=plant.x+10,sy=plant.y+plant.h-10;line([{x:sx,y:sy},{x:sx+bar,y:sy}],p.text,1.5);for(const x of[sx,sx+bar])line([{x,y:sy-3},{x,y:sy+3}],p.text,1);ctx.textAlign='left';ctx.textBaseline='bottom';ctx.font=(large?11:9)+'px Manrope,sans-serif';ctx.fillStyle=p.text;ctx.fillText(scaleMetres+' m',sx,sy-6);
 const phaseLabel=mode==='historical'?'Hacia 1984–1987 · interpretación':'Estado actual documentado';
 if(large&&showLabels){ctx.font='600 '+(area.w>500?13:11)+'px Manrope,sans-serif';ctx.fillStyle=p.text;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(sea?'PANTALÁN MARÍTIMO':'PASEO TERRESTRE Y MIRADOR',area.x,area.y-25);}
 if(profileShown){
  const px=area.x+12,py=plant.y+plant.h+26,pw=area.w-24,ph=48,smin=sea?480:-125,smax=sea?1652:467.29,tx=s=>px+(s-smin)/(smax-smin)*pw,ty=y=>py+ph-y*3;
  ctx.fillStyle=p.surface;ctx.fillRect(area.x,plant.y+plant.h+6,area.w,profileHeight-6);ctx.fillStyle=p.water||fallbackPalette.water;ctx.fillRect(px,ty(0),pw,9);
  const span=(a,b,y)=>line([{x:tx(a),y:ty(y)},{x:tx(b),y:ty(y)}],p.text,3);
  if(sea){if(mode==='historical'){span(480,1592,5.78);span(1592,1652,5.8);}else span(1320,1592,5.78);for(const sup of supports){const coordinate=sup.coordinate||sup.coordinates;if(!coordinate)continue;const s=Number.isFinite(sup.s)?sup.s:local(coordinate).s;if(s<smin||s>smax)continue;line([{x:tx(s-2),y:ty(-2)},{x:tx(s),y:ty(sup.elevation??4.15)},{x:tx(s+2),y:ty(-2)}],p.muted,1.1);}ctx.textAlign='center';ctx.fillStyle=p.text;ctx.font='10px Manrope,sans-serif';ctx.fillText(mode==='current'?'Tableros retirados':'Tablero y transporte del mineral',tx(900),py+4);ctx.fillText('Plataforma',tx(1456),py+4);}
  else if(mode==='current'){line([[-125,1.8],[-30,5.6],[367.29,5.6],[467.29,8.8]].map(([s,y])=>({x:tx(s),y:ty(y)})),p.accent,3);ctx.font='10px Manrope,sans-serif';ctx.fillStyle=p.text;for(const[s,y,label]of[[-100,2.8,'Acceso'],[130,5.6,'+5,60 m'],[430,8.8,'+8,80 m']]){ctx.textAlign='center';ctx.fillText(label,tx(s),ty(y)-8);}}
  else{span(0,467.29,5.78);ctx.textAlign='center';ctx.fillStyle=p.text;ctx.font='10px Manrope,sans-serif';ctx.fillText('Tablero y cinta hacia el mar',tx(220),py+4);}
  ctx.font='10px Manrope,sans-serif';ctx.fillStyle=p.muted;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('Perfil explicativo · altura exagerada · cotas aproximadas',px,py+ph+14);
 }
 const floorLabel=phaseLabel+(sectionOpen?' · agua retirada':'');
 return{targets,totalStops:stops.length,visibleStops:targets.length,components:components.length,profileShown,vertical,scaleMetres,scaleLabel:scaleMetres+' m',floorLabel,presentationMode:mode,sectionOpen,outlineSource:data.id+'-plan',hitTarget(x,y){let id=null,distance=Infinity;for(const target of targets){const d=Math.hypot(x-target.x,y-target.y);if(d<target.r&&d<distance){id=target.id;distance=d;}}return id;}};
}
