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
} else import('./app.js');
