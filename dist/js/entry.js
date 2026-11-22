import {startRenderSession,wantsPlan,retry3D} from './render-session.js';
startRenderSession();
// Each reading of the atlas owns the single WebGL context of its document.
// A full transition also releases GPU resources on memory-constrained Safari.
const simulatorRoute = () => /^#simulador(?:\/|$)/.test(location.hash);
const simulator = simulatorRoute();
const back = document.getElementById('sim-return');
const inVisit = () => {
  try { return !!sessionStorage.getItem('saguntum-territorial-visit') && !['', '#atlas'].includes(location.hash); }
  catch { return false; }
};
if (!simulator) back.hidden = !inVisit();
window.addEventListener('hashchange', event => {
  if (simulatorRoute() !== simulator) {
    event.stopImmediatePropagation();
    location.reload();
  } else if (!simulator) back.hidden = !inVisit();
}, true);
if (simulator) {
  document.documentElement.classList.add('territorial');
  import('./territory.js').then(module => module.openSimulator()).catch(error => {
    console.error(error);
    const status = document.getElementById('sim-status') || document.getElementById('loading-status');
    status.textContent = 'No se pudo abrir el territorio. Comprueba la conexión.';
    const link = document.createElement('a');
    link.href = '#atlas'; link.textContent = ' Volver al Atlas';
    status.append(link);
  });
} else {
  const fallback=document.getElementById('fallback');
  const retry=document.createElement('button');
  retry.id='retry-atlas-3d';retry.type='button';retry.className='text-button';retry.textContent='Reintentar vista 3D';retry.onclick=retry3D;fallback.append(retry);
  if(wantsPlan()){
    fallback.querySelector('h2').textContent='Visita en plano';
    fallback.querySelector('p').textContent='Puedes recorrer las paradas y consultar su historia en el plano.';
  }
  import('./app.js').catch(()=>{
    document.getElementById('loading').classList.add('loaded');fallback.hidden=false;
    fallback.querySelector('h2').textContent='No se pudo abrir el Atlas';
    fallback.querySelector('p').textContent='Comprueba la conexión y vuelve a cargar la visita.';
  });
}
