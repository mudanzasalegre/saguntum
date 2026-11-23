const defaults={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',run:'ShiftLeft',up:'Space',down:'KeyC',interact:'KeyE',light:'KeyF',map:'KeyM',view:'KeyV',reset:'KeyR'};
const labels={forward:'Avanzar',back:'Retroceder',left:'Izquierda',right:'Derecha',run:'Correr / acelerar',up:'Saltar / ascender',down:'Agacharse / descender',interact:'Explorar lugar',light:'Linterna',map:'Mapa',view:'Cambiar vista',reset:'Punto seguro'};
const initial={sensitivity:1,fov:68,pace:1,smoothing:0,invert:false,bob:false,flight:'auto',clearance:1.7,cinema:false};
const rates={auto:1,precision:4,city:30,territory:180};
const keyName=code=>({Space:'Espacio',ShiftLeft:'Mayús izq.',ControlLeft:'Ctrl izq.'}[code]||code.replace(/^Key|^Digit/,''));

export function simulatorInput(element,{mode,command,look,settingsChanged}){
  const storage='saguntum-controls-v1',keys=new Set(),touch=new Set(),prefs={...initial},bindings={...defaults};
  try{
    const saved=JSON.parse(localStorage.getItem(storage))||{};
    for(const key of Object.keys(initial))if(typeof saved.prefs?.[key]===typeof initial[key])prefs[key]=saved.prefs[key];
    for(const key of Object.keys(defaults))if(typeof saved.bindings?.[key]==='string')bindings[key]=saved.bindings[key];
  }catch{}
  const $=id=>document.getElementById('sim-'+id);
  for(const key of ['pace','sensitivity','smoothing','fov','clearance']){
    const control=$(key);
    prefs[key]=Math.max(Number(control.min),Math.min(Number(control.max),prefs[key]));
  }
  if(!Object.hasOwn(rates,prefs.flight))prefs.flight='auto';
  function save(){try{localStorage.setItem(storage,JSON.stringify({prefs,bindings}));}catch{}}
  for(const key of Object.keys(initial)){
    const control=$(key),isBool=typeof initial[key]==='boolean';
    function show(){if(isBool)control.checked=prefs[key];else control.value=prefs[key];if(control.nextElementSibling?.tagName==='OUTPUT')control.nextElementSibling.value=prefs[key];}
    show();
    control.oninput=()=>{prefs[key]=isBool?control.checked:typeof initial[key]==='number'?Number(control.value):control.value;show();save();settingsChanged();};
  }
  let waiting=null,lookId=null,lastX=0,lastY=0;
  const buttons={};
  function renderKeys(){for(const [action,button] of Object.entries(buttons))button.textContent=action===waiting?'Pulsa una tecla':keyName(bindings[action]);}
  for(const [action,label] of Object.entries(labels)){
    const line=document.createElement('label'),btn=document.createElement('button');
    btn.type='button';btn.setAttribute('aria-label','Cambiar tecla para '+label);line.append(label,btn);$('key-list').append(line);buttons[action]=btn;
    btn.onclick=()=>{waiting=action;renderKeys();};
  }
  renderKeys();
  $('reset-keys').onclick=()=>{Object.assign(bindings,defaults);waiting=null;renderKeys();save();};
  const sprint=document.querySelector('[data-motion="run"]');
  function reset(){keys.clear();touch.clear();lookId=null;sprint.setAttribute('aria-pressed','false');}
  function release(){if(document.pointerLockElement===element)document.exitPointerLock();reset();}
  const aliases={ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right',ControlLeft:'down',ControlRight:'down',ShiftRight:'run'};
  function actionFor(code){
    const exact=Object.keys(bindings).find(k=>bindings[k]===code);
    const alias=aliases[code];
    return exact||(alias&&bindings[alias]===defaults[alias]?alias:null);
  }
  function menuOpen(){return !$('settings').hidden||!$('places').hidden||$('map-box').classList.contains('expanded');}
  window.addEventListener('keydown',e=>{
    if(waiting&&!$('settings').hidden){
      e.preventDefault();
      if(e.code!=='Escape'&&/^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight|Arrow(Up|Down|Left|Right)|ControlLeft|ControlRight)$/.test(e.code)){
        const other=Object.keys(bindings).find(k=>bindings[k]===e.code);
        if(other)bindings[other]=bindings[waiting];
        bindings[waiting]=e.code;save();
      }
      waiting=null;renderKeys();return;
    }
    waiting=null;
    if(e.code==='Escape'){release();command('escape');return;}
    if(e.ctrlKey&&e.code!=='ControlLeft'&&e.code!=='ControlRight'&&!keys.has('down')||e.metaKey||e.altKey||e.target.matches?.('input,select,textarea,[contenteditable=true]'))return;
    const action=actionFor(e.code);if(!action||menuOpen()&&action!=='map')return;
    if(mode()==='orbit'&&!['map','view'].includes(action))return;
    if(e.code==='Space'&&e.target.closest?.('button,a,summary'))return;
    e.preventDefault();
    if(e.repeat)return;
    keys.add(action);command(action);
  });
  window.addEventListener('keyup',e=>keys.delete(actionFor(e.code)));
  window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
  document.addEventListener('pointerlockchange',()=>{reset();document.body.classList.toggle('sim-locked',document.pointerLockElement===element);});
  element.addEventListener('pointerdown',e=>{
    if(mode()==='orbit'||lookId!==null||menuOpen()||e.button!==0)return;
    element.focus({preventScroll:true});lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;
    element.setPointerCapture(e.pointerId);
    if(e.pointerType==='mouse'&&document.pointerLockElement!==element){
      try{element.requestPointerLock?.()?.catch?.(()=>{});}catch{}
    }
  });
  element.addEventListener('pointermove',e=>{
    if(mode()==='orbit'||menuOpen()||document.pointerLockElement===element||lookId!==e.pointerId)return;
    look(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;
  });
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement===element&&mode()!=='orbit'&&!menuOpen())look(e.movementX,e.movementY);});
  element.addEventListener('lostpointercapture',()=>{lookId=null;});
  let multiplier=1;
  element.addEventListener('wheel',e=>{if(mode()!=='fly'||menuOpen())return;e.preventDefault();
    multiplier=Math.max(.125,Math.min(8,multiplier*Math.exp(-Math.sign(e.deltaY)*.20)));
  },{passive:false});
  for(const button of document.querySelectorAll('[data-motion]')){
    const action=button.dataset.motion;
    if(action==='run'){
      button.setAttribute('aria-pressed','false');
      button.onclick=()=>{if(touch.has(action))touch.delete(action);else touch.add(action);button.setAttribute('aria-pressed',String(touch.has(action)));};
      continue;
    }
    button.onpointerdown=e=>{button.setPointerCapture(e.pointerId);touch.add(action);command(action);};
    button.onlostpointercapture=()=>touch.delete(action);
  }
  return {prefs,release,reset,held:action=>keys.has(action)||touch.has(action),key:action=>keyName(bindings[action]),
    flightSpeed:height=>(prefs.flight==='auto'?Math.max(5,Math.min(700,6+height*.42)):rates[prefs.flight])*multiplier};
}
