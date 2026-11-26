import assert from 'node:assert/strict';
import {test} from 'node:test';
import {guidedTourPanel} from '../dist/js/territory-tour-panel.js';

// The controller only needs element properties/events. A small fake keeps these
// interaction tests independent of GPU availability and of a browser runtime.
function fixture({startSucceeds=true}={}){
  const nodes=new Map(),classes=new Set(),calls=[];
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,{hidden:id==='panel',textContent:'',value:'',disabled:false,attributes:{},
      append(option){if(!this.value)this.value=option.value;},
      setAttribute(name,value){this.attributes[name]=String(value);},
      focus(){calls.push(['focus',id]);},addEventListener(name,fn){this[name]=fn;}});
    return nodes.get(id);
  };
  globalThis.document={getElementById:id=>node(id.replace(/^sim-tour-?/,'')),body:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}}};
  globalThis.Option=class {constructor(label,value){this.text=label;this.value=value;}};
  globalThis.matchMedia=()=>({matches:false});
  const places=[{id:'santa-maria',name:'Santa María',region:'sagunto',number:1},
    {id:'horno',name:'Alto Horno',region:'puerto',number:17},
    {id:'dunas-almarda',name:'Dunas de Almardà',region:'almarda',number:31}];
  const nav={touring:false,startTour(stops,options){calls.push(['start',stops,options]);this.touring=startSucceeds;return startSucceeds;},
    pauseTour(){calls.push(['pause']);},resumeTour(){calls.push(['resume']);},stepTour(delta){calls.push(['step',delta]);},stopTour(reason){calls.push(['stop',reason]);this.touring=false;}};
  const panel=guidedTourPanel({places,nav,makeStops:p=>p,onOpen:()=>calls.push(['open']),onBegin:()=>calls.push(['begin']),onClose:()=>calls.push(['close']),onDestination:p=>calls.push(['destination',p.id])});
  const state=changes=>({active:true,paused:false,stage:'holding',index:0,id:'santa-maria',name:'Santa María',region:'sagunto',count:3,progress:.3,...changes});
  return {node,calls,nav,panel,state};
}

test('route choice starts its own itinerary and a rejected start remains recoverable',()=>{
  const r=fixture({startSucceeds:false});r.panel.show();
  r.node('route').value='puerto';r.node('route').onchange();r.node('play').onclick();
  const call=r.calls.find(c=>c[0]==='start');
  assert.deepEqual(call[1].map(p=>p.id),['horno']);
  assert.equal(r.node('setup').hidden,false);
  assert.equal(r.node('play').disabled,false);
  assert.match(r.node('stage').textContent,/No se pudo iniciar/);
});

test('exploration becomes available after arrival, not during movement or loading',()=>{
  const r=fixture();r.panel.show();r.nav.touring=true;
  for(const stage of ['transition','transfer','preparing']){
    r.panel.update(true,r.state({stage}));
    assert.equal(r.node('explore').hidden,true);
  }
  r.panel.update(true,r.state({stage:'holding'}));
  assert.equal(r.node('explore').hidden,false);
  assert.equal(r.calls.filter(c=>c[0]==='destination').length,1,'Los fotogramas del fundido no recargan el destino');
  assert.match(r.node('title').textContent,/01 · Santa María/);
});

test('resume and manual steps close inspection overlays before moving again',()=>{
  const r=fixture();r.panel.show();r.nav.touring=true;
  r.panel.update(true,r.state({paused:true,index:1,id:'horno'}));
  r.calls.length=0;r.node('play').onclick();
  assert.deepEqual(r.calls,[['open'],['resume']]);
  r.calls.length=0;r.node('prev').onclick();
  assert.deepEqual(r.calls,[['open'],['step',-1]]);
  r.calls.length=0;r.node('next').onclick();
  assert.deepEqual(r.calls,[['open'],['step',1]]);
});

test('completion offers an explicit restart and exploration; close stops the tour',()=>{
  const r=fixture();r.panel.show();
  r.panel.update(false,r.state({active:false,stage:'complete',index:2,id:'dunas-almarda'}));
  assert.equal(r.node('panel').hidden,false);
  assert.equal(r.node('setup').hidden,false);
  assert.equal(r.node('explore').hidden,false);
  assert.equal(r.node('play').textContent,'Volver a empezar');
  assert.equal(r.node('next').disabled,true);
  r.node('explore').onclick();
  assert.equal(r.node('panel').hidden,true);
  assert(r.calls.some(c=>c[0]==='stop'&&c[1]==='explore'));
  assert.equal(r.node('').attributes['aria-expanded'],'false');
});
