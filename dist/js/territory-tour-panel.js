import {atlasArea} from './atlas-order.js';

const routes=[['all','Todo el territorio'],['sagunto','Sagunto'],['puerto','Puerto de Sagunto'],['resto','Costa y paisajes']];
const setText=(element,value)=>{if(element.textContent!==value)element.textContent=value;};

// UI only: the navigation controller owns time, camera movement and pause state.
export function guidedTourPanel({places,nav,makeStops,onOpen=()=>{},onBegin=()=>{},onClose=()=>{},onDestination=()=>{}}){
  const $=id=>document.getElementById('sim-tour'+(id?'-'+id:''));
  const panel=$('panel'),button=$(''),select=$('route'),byId=new Map(places.map(p=>[p.id,p]));
  let state=null,itinerary=[],destination=null;
  const routePlaces=()=>places.filter(p=>select.value==='all'||atlasArea(p).id===select.value);
  for(const [id,label] of routes){
    const count=places.filter(p=>id==='all'||atlasArea(p).id===id).length;
    if(count)select.append(new Option(label+' · '+count+' lugares',id));
  }
  function setup(){
    const list=routePlaces();
    $('setup').hidden=false;$('progress').hidden=true;$('up-next').hidden=true;$('explore').hidden=true;
    $('prev').disabled=$('next').disabled=true;
    setText($('title'),'Del casco histórico al mar');
    setText($('counter'),select.value==='all'?'Sagunto → Puerto → Costa y paisajes':routes.find(r=>r[0]===select.value)?.[1]||'');
    setText($('summary'),list.length+' lugares · 14 s para contemplar cada parada. Acercamientos suaves y fundidos entre zonas.');
    setText($('stage'),'Empieza por '+(list[0]?.name||'el primer lugar')+'.');
    setText($('play'),'Iniciar recorrido');$('play').disabled=!list.length;
  }
  function show(){
    onOpen();panel.hidden=false;document.body.classList.add('sim-tour-open');button.setAttribute('aria-expanded','true');
    if(!nav.touring){state=null;destination=null;setup();}
    $('play').focus({preventScroll:true});
  }
  function hide(){
    const wasOpen=!panel.hidden;panel.hidden=true;document.body.classList.remove('sim-tour-open');button.setAttribute('aria-expanded','false');
    if(wasOpen)onClose();
  }
  function close(reason='closed',focus=true){
    nav.stopTour(reason);hide();
    if(focus)button.focus({preventScroll:true});
  }
  function start(index=0){
    itinerary=makeStops(routePlaces());
    if(!itinerary.length){setText($('stage'),'No hay vistas disponibles para esta ruta.');return;}
    destination=null;onOpen();onBegin();
    if(!nav.startTour(itinerary,{index,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches})){
      state=null;setup();setText($('stage'),'No se pudo iniciar esta ruta. Elige otra zona o vuelve a intentarlo.');
    }
  }
  function update(active,next){
    state=next;
    button.setAttribute('aria-pressed',String(active));
    setText(button,active?(next.paused?'Recorrido en pausa':'Recorrido en marcha'):'Recorrido territorial');
    if(!active&&next.stage!=='complete'){hide();return;}
    const place=byId.get(next.id),area=place?atlasArea(place).label:'';
    if(active&&place&&destination!==place.id){destination=place.id;onDestination(place);}
    $('setup').hidden=active;$('progress').hidden=!active;
    $('explore').hidden=!place||!['holding','complete'].includes(next.stage);$('play').disabled=false;
    $('prev').disabled=next.index<=0;$('next').disabled=next.index>=next.count-1;
    setText($('counter'),'Lugar '+(next.index+1)+' de '+next.count+(area?' · '+area:''));
    setText($('title'),place?String(place.number).padStart(2,'0')+' · '+place.name:next.name||'Recorrido territorial');
    const phase=next.stage==='transition'?'Acercándonos al lugar':next.stage==='transfer'?'Traslado a '+(place?.name||next.name):next.stage==='preparing'?'Preparando la vista':next.stage==='complete'?'Recorrido terminado. Puedes quedarte a explorar.':'Tiempo para contemplar el lugar';
    setText($('stage'),next.paused?'Recorrido en pausa. Continúa cuando quieras.':phase);
    setText($('play'),next.stage==='complete'?'Volver a empezar':next.paused?'Reanudar':'Pausar');
    $('progress').value=Number.isFinite(next.progress)?next.progress:0;
    $('progress').setAttribute('aria-label',['transition','transfer'].includes(next.stage)?'Avance del traslado':next.stage==='preparing'?'Preparación de la vista':'Tiempo en esta parada');
    const upcoming=itinerary[next.index+1];$('up-next').hidden=!upcoming;
    if(upcoming)setText($('up-next'),'Después: '+upcoming.name);
    if(next.stage==='complete'){
      setText($('summary'),next.count+' lugares recorridos. Elige otra ruta o vuelve a empezar.');
    }
  }
  button.onclick=()=>{if(panel.hidden)show();else close();};
  $('close').onclick=()=>close();$('explore').onclick=()=>close('explore');
  select.onchange=()=>{state=null;itinerary=[];destination=null;setup();};
  $('play').onclick=()=>{
    if(!nav.touring){start();return;}
    if(state?.paused){onOpen();nav.resumeTour();}else nav.pauseTour();
  };
  $('prev').onclick=()=>{if(nav.touring){onOpen();nav.stepTour(-1);}else start(Math.max(0,(state?.index||0)-1));};
  $('next').onclick=()=>{if(nav.touring){onOpen();nav.stepTour(1);}};
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
  setup();
  return {update,close,show,get open(){return !panel.hidden;}};
}
