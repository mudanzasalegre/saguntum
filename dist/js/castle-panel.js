// Data-driven, source-backed visitor notebook. All navigation remains virtual.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : '#'; } catch { return '#'; } };
const certainty = value => ({documented:'Documentado',verified:'Documentado',cartographic:'Cartografía',approximate:'Localización aproximada',interpretive:'Interpretación',disputed:'En discusión',mixed:'Varias épocas'}[value] || value || 'Documentado');

export const visitPeriodLabel = value => ({iberian:'Época ibérica',andalusi:'Época andalusí',roman:'Época romana',medieval:'Edad Media',modern:'Edad Moderna y siglo XIX',contemporary:'Época contemporánea',mixed:'Varias épocas',interpretation:'Lectura interpretativa',ancient:'Antigüedad',unknown:'Cronología no determinada'}[value] || value || 'Varias épocas');

export const castlePeriodLabel = visitPeriodLabel;

export function createCastleVisit(options) {
  return createMonumentVisit({...options, monumentId:'castle', monumentLabel:'CASTILLO DE SAGUNTO'});
}

export function createMonumentVisit({element, data, monumentId='castle', monumentLabel='CASTILLO DE SAGUNTO', onSelect, onNear, onMap, onReading, onSource, onSection, onPresentation}) {
  const scope = /^[a-z][a-z0-9-]*$/.test(monumentId) ? monumentId : 'castle';
  const isCastle = scope === 'castle', storageKey = 'saguntum.' + scope + '.visited.v1';
  const regionsLabel = data.regionsLabel || (isCastle ? 'recintos' : 'ámbitos');
  const overviewLabel = data.overviewButtonLabel || (isCastle ? 'Recintos' : 'Ámbitos');
  const mapLabel = data.mapButtonLabel || (isCastle ? 'Plano del castillo' : 'Plano del teatro');
  const readingLabel = data.readingModeLabel || (isCastle ? 'Leer las épocas' : 'Leer las capas');
  const readingNote = data.readingModeNote || (isCastle ? 'Lectura de estructuras identificadas; los lienzos de cronología mixta conservan un color propio.' : 'Lectura de los componentes identificados: restos antiguos, restituciones contemporáneas y partes de atribución mixta.');
  const timelineNote = data.timelineIntroduction || (isCastle ? 'Las épocas explican las transformaciones del cerro. La maqueta interpreta el conjunto conservado.' : 'La cronología relaciona el teatro romano, sus transformaciones y las intervenciones contemporáneas. La maqueta interpreta el conjunto conservado.');
  const tabId = id => scope + '-tab-' + id, contentId = scope + '-tab-content';
  const stops = data.stops || [], regions = data.regions || [], sources = new Map((data.sources || []).map(s => [s.id, s]));
  let tab = 'visit', active = false, selected = null, ready = false, readingMode = 'materials', near = false, sectionOpen = false, complete = false, presentationMode = 'current';
  const presentationModes = (data.presentationModes || []).filter(mode => ['current','historical'].includes(mode.id));
  const visited = new Set(), validIds = new Set(stops.map(s => s.id));
  try { for (const id of JSON.parse(localStorage.getItem(storageKey) || '[]')) if (validIds.has(id)) visited.add(id); } catch {}
  const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify([...visited])); } catch {} };
  const sourceLink = id => {
    const source = sources.get(id); if (!source) return '';
    return '<a class="castle-source" href="' + esc(safeUrl(source.url)) + '" target="_blank" rel="noopener noreferrer"><strong>' + esc(source.title) + '</strong><span>' + esc([source.author, source.year, source.locator].filter(Boolean).join(' · ')) + '</span></a>';
  };
  const sourceIds = item => [...new Set([...(item.sourceIds || []), ...(item.facts || []).flatMap(f => f.sourceIds || [])])];
  function sourceButtons(ids = []) {
    return ids.filter(id => sources.has(id)).map((id, i) => '<button class="castle-cite" data-castle-source="' + esc(id) + '" aria-label="Consultar fuente: ' + esc(sources.get(id).title) + '">Fuente' + (ids.length > 1 ? ' ' + (i + 1) : '') + '</button>').join('');
  }
  function stopButton(stop, i) {
    return '<button class="castle-stop-button" data-castle-stop="' + esc(stop.id) + '" aria-pressed="' + (stop.id === selected) + '"><span class="castle-stop-number">' + (i + 1) + '</span><span>' + esc(stop.title) + '</span>' + (visited.has(stop.id) ? '<span class="castle-visited" aria-label="Visitada">✓</span>' : '') + '</button>';
  }
  function circusComparison() {
    if (scope !== 'circo') return '';
    const historical = presentationMode === 'historical';
    return '<aside class="castle-look"><h3>' + (historical ? 'La puerta conserva el vínculo con la ciudad.' : 'Esta puerta pertenecía a un circo completo.') + '</h3><p>' +
      (historical ? 'Estás viendo la planta histórica con sus seis paradas. Puedes regresar al recinto conservado y a sus catorce paradas en cualquier momento.' : 'Amplía la visita a la arena, la spina, las gradas y las salidas. La vista histórica retira temporalmente la ciudad que ocupa su huella y distingue las restituciones de los restos conservados.') +
      '</p><button class="primary-button" data-castle-stop="' + (historical ? 'circo-conjunto' : 'circo-historica') + '">' + (historical ? 'Volver a la puerta actual' : 'Ver el circo completo') + '</button></aside>';
  }
  function overview() {
    const general = stops.filter(s => !regions.some(r => r.id === s.regionId));
    return '<div class="castle-overview"><div class="castle-visit-actions"><button class="primary-button" data-castle-start>Iniciar visita</button><button class="secondary-button" data-castle-map>' + esc(mapLabel) + '</button></div><p>' + esc(data.introduction) + '</p><div class="castle-stats"><div><strong>' + regions.length + '</strong><span>' + esc(regionsLabel) + '</span></div><div><strong>' + stops.length + '</strong><span>paradas</span></div><div><strong>' + visited.size + '/' + stops.length + '</strong><span>exploradas</span></div></div>' +
      (complete ? '<p class="castle-complete" role="status">Has llegado al final de la visita. Puedes volver a cualquier parada o consultar la cronología.</p>' : '') +
      '<p class="castle-route-note">Elige una parada o avanza a tu ritmo. Los saltos de cámara forman una visita virtual.</p></div>' +
      (general.length ? '<div class="castle-stop-list">' + general.map(s => stopButton(s, stops.indexOf(s))).join('') + '</div>' : '') +
      '<div class="castle-recinto-list">' + regions.map(region => {
        const list = stops.filter(s => s.regionId === region.id);
        return '<details class="castle-recinto-card"><summary><span>' + esc(region.name) + '</span><small>' + list.length + (list.length === 1 ? ' parada' : ' paradas') + '</small></summary><p>' + esc(region.summary) + '</p><div class="castle-stop-list">' + list.map(s => stopButton(s, stops.indexOf(s))).join('') + '</div></details>';
      }).join('') + '</div>';
  }
  function current() {
    const stop = stops.find(s => s.id === selected); if (!stop) return overview();
    const index = stops.indexOf(stop), region = regions.find(r => r.id === stop.regionId);
    const facts = stop.facts || [], cited = sourceIds(stop);
    return '<article class="castle-current"><div class="castle-progress"><span>Parada ' + (index + 1) + ' de ' + stops.length + '</span><span>' + visited.size + (visited.size === 1 ? ' explorada' : ' exploradas') + '</span></div><div class="castle-visit-actions"><button class="secondary-button" data-castle-prev' + (index === 0 ? ' disabled' : '') + '>Anterior</button><button class="text-button" data-castle-overview>' + esc(overviewLabel) + '</button><button class="primary-button small" data-castle-next>' + (index === stops.length - 1 ? 'Terminar' : 'Siguiente') + '</button></div>' +
      '<p class="castle-stop-kicker">' + esc([region?.name, visitPeriodLabel(stop.period)].filter(Boolean).join(' · ')) + '</p><h2 class="castle-stop-title" tabindex="-1">' + esc(stop.title) + '</h2><p class="castle-stop-intro">' + esc(stop.intro) + '</p>' +
      '<div class="castle-visit-actions"><button class="secondary-button" data-castle-near aria-pressed="' + near + '"' + (!ready ? ' disabled title="La vista tridimensional requiere WebGL"' : '') + '>' + (near ? 'Ver el conjunto' : 'Acercar al detalle') + '</button><button class="text-button" data-castle-map>Situar en el plano</button></div>' +
      '<div class="castle-facts">' + facts.map(f => '<section class="castle-fact">' + (f.title ? '<h3>' + esc(f.title) + '</h3>' : '') + '<p>' + esc(f.text) + '</p><div class="castle-fact-meta"><span class="castle-evidence-badge">' + esc(certainty(f.confidence)) + '</span>' + sourceButtons(f.sourceIds) + '</div></section>').join('') + '</div>' +
      (stop.diagram ? '<figure class="visit-diagram"><img alt="'+esc(stop.diagram.alt)+'" src="'+esc(stop.diagram.src)+'"></figure>' : '') +
      (stop.lookFor ? '<aside class="castle-look"><h3>Fíjate en</h3><p>' + esc(stop.lookFor) + '</p></aside>' : '') +
      (stop.modelNote ? '<details class="castle-model-note"><summary>Cómo se representa en la maqueta</summary><p>' + esc(stop.modelNote) + '</p></details>' : '') +
      '<details class="castle-sources"><summary>Fuentes de esta parada · ' + cited.length + '</summary>' + cited.map(sourceLink).join('') + '</details>' +
      '<div class="castle-visit-actions castle-next-bottom"><button class="primary-button" data-castle-next>' + (index === stops.length - 1 ? 'Terminar visita' : 'Continuar la visita') + '</button></div></article>';
  }
  function chronology() {
    return '<section><p class="castle-route-note">' + esc(timelineNote) + '</p><ol class="castle-timeline">' + (data.timeline || []).map(item => '<li class="castle-timeline-item"><time>' + esc(item.date) + '</time><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p><div class="castle-fact-meta">' + sourceButtons(item.sourceIds) + '</div>' + (item.stopId && validIds.has(item.stopId) ? '<button class="text-button" data-castle-stop="' + esc(item.stopId) + '">Explorar este lugar</button>' : '') + '</li>').join('') + '</ol></section>';
  }
  function documents() {
    return '<section class="castle-sources"><h2 class="castle-stop-title">Leer las evidencias.</h2><p>Documentación del conjunto, estudios de su arquitectura y fuentes históricas utilizadas en la visita.</p><div class="castle-methodology">' + (data.methodology || []).map(text => '<p>' + esc(typeof text === 'string' ? text : text.text) + '</p>').join('') + '</div>' + [...sources.keys()].map(sourceLink).join('') + '</section>';
  }
  function render() {
    element.hidden = !active; if (!active) return;
    const oldScroll = element.parentElement?.parentElement?.scrollTop || 0;
    element.innerHTML = (presentationModes.length && typeof onPresentation === 'function' ? '<div class="visit-presentation"><div class="coast-modes" role="group" aria-label="' + esc(data.presentationAriaLabel || 'Época del pantalán') + '">' + presentationModes.map(mode => '<button data-visit-presentation="' + esc(mode.id) + '" aria-pressed="' + (mode.id === presentationMode) + '">' + esc(mode.label) + '</button>').join('') + '</div><p class="castle-route-note" role="status">' + esc(presentationModes.find(mode => mode.id === presentationMode)?.note || '') + '</p></div>' : '') +
      '<div class="castle-tabs" role="tablist" aria-label="' + esc(data.visitAriaLabel || 'Explorar ' + monumentLabel.toLocaleLowerCase('es')) + '">' + [['visit','Recorrido'],['timeline','Cronología'],['sources','Fuentes']].map(([id, label]) => '<button class="castle-tab" role="tab" id="' + tabId(id) + '" aria-controls="' + contentId + '" aria-selected="' + (tab === id) + '" tabindex="' + (tab === id ? 0 : -1) + '" data-castle-tab="' + id + '">' + label + '</button>').join('') + '</div>' +
      '<div class="castle-reading-modes" role="group" aria-label="Lectura de la maqueta"><button data-castle-reading="materials" aria-pressed="' + (readingMode === 'materials') + '">' + esc(data.materialsModeLabel || 'Piedra y materiales') + '</button><button data-castle-reading="periods" aria-pressed="' + (readingMode === 'periods') + '">' + esc(readingLabel) + '</button></div>' +
      (!isCastle && tab === 'visit' && (selected || data.sectionOnOverview) && typeof onSection === 'function' ? '<div class="castle-section-control"><button class="secondary-button" data-visit-section aria-pressed="' + sectionOpen + '"' + (!ready ? ' disabled title="El desmontaje requiere WebGL"' : '') + '>' + esc(sectionOpen ? (data.sectionCloseLabel || 'Cerrar sección') : (data.sectionOpenLabel || 'Abrir sección')) + '</button><p class="castle-route-note">' + esc(data.sectionInstructions || 'Retira la cubierta y el tablado actuales para leer el subsuelo escénico.') + '</p>' + (sectionOpen ? '<p class="castle-route-note" role="status">' + esc(data.sectionNote || 'El subsuelo se muestra mediante un esquema basado en los elementos documentados. Su conservación no permite una restitución literal completa.') + '</p>' : '') + '</div>' : '') +
      (readingMode === 'periods' ? '<div class="castle-legend">' + (data.readingLegend || []).map(item => '<span data-period="' + esc(item.id) + '"' + (!isCastle && /^#[0-9a-f]{6}$/i.test(item.color || '') ? ' style="--period-color:' + item.color + '"' : '') + (item.note ? ' title="' + esc(item.note) + '"' : '') + '>' + esc(item.label) + '</span>').join('') + '<p>' + esc(readingNote) + '</p></div>' : '') +
      '<div id="' + contentId + '" role="tabpanel" aria-labelledby="' + tabId(tab) + '">' + (tab === 'timeline' ? chronology() : tab === 'sources' ? documents() : circusComparison() + (selected ? current() : overview())) + '</div>' +
      (!ready ? '<p class="castle-route-note castle-map-only">Estás explorando la documentación y el plano. Las vistas de la maqueta requieren WebGL.</p>' : '') +
      ((data.relatedVisits || []).length ? '<nav class="related-visits" aria-label="Lugares del conjunto">' + data.relatedVisits.filter(item => /^[a-z][a-z0-9-]*$/.test(item.id)).map(item => '<a href="#' + esc(item.id) + '">' + esc(item.label) + '</a>').join('') + '</nav>' : '');
    if (element.parentElement?.parentElement) element.parentElement.parentElement.scrollTop = oldScroll;
  }
  function revealContent() {
    const scroller = element.closest('#editorial'), anchor = element.querySelector('#' + contentId), tabs = element.querySelector('.castle-tabs');
    if (!scroller || !anchor) return;
    scroller.scrollTop = Math.max(0, scroller.scrollTop + anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top - (tabs?.getBoundingClientRect().height || 44) - 16);
  }
  function choose(id) { if (validIds.has(id)) { tab = 'visit'; complete = false; onSelect(id); } }
  element.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || button.disabled || !element.contains(button)) return;
    if (button.dataset.castleTab) { tab = button.dataset.castleTab; render(); revealContent(); element.querySelector('#' + tabId(tab))?.focus(); }
    else if (button.dataset.castleStop) choose(button.dataset.castleStop);
    else if (button.hasAttribute('data-castle-start')) choose(stops[0]?.id);
    else if (button.hasAttribute('data-castle-overview')) { tab = 'visit'; onSelect(null); }
    else if (button.hasAttribute('data-castle-prev')) choose(stops[Math.max(0, stops.findIndex(s => s.id === selected) - 1)]?.id);
    else if (button.hasAttribute('data-castle-next')) { const index = stops.findIndex(s => s.id === selected); if (index >= stops.length - 1) { complete = true; onSelect(null); } else choose(stops[index + 1]?.id); }
    else if (button.hasAttribute('data-castle-map')) onMap();
    else if (button.hasAttribute('data-castle-near')) onNear();
    else if (button.dataset.castleReading) onReading(button.dataset.castleReading);
    else if (button.dataset.visitPresentation && typeof onPresentation === 'function') onPresentation(button.dataset.visitPresentation);
    else if (button.hasAttribute('data-visit-section') && typeof onSection === 'function') onSection(!sectionOpen);
    else if (button.dataset.castleSource) onSource(sources.get(button.dataset.castleSource));
  });
  element.addEventListener('keydown', event => {
    if (!event.target.matches('[role="tab"]') || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); const ids = ['visit','timeline','sources'], index = ids.indexOf(tab);
    tab = event.key === 'Home' ? ids[0] : event.key === 'End' ? ids[2] : ids[(index + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
    render(); revealContent(); element.querySelector('#' + tabId(tab))?.focus();
  });
  return {
    setState(next) {
      const changed = selected !== next.stopId;
      active = !!next.active; selected = validIds.has(next.stopId) ? next.stopId : null; ready = !!next.ready; readingMode = next.readingMode || 'materials'; near = !!next.near; sectionOpen = !!next.sectionOpen; presentationMode = next.presentationMode === 'historical' ? 'historical' : 'current';
      if (selected) { visited.add(selected); persist(); }
      if (changed) tab = 'visit';
      render();
      if (selected && changed) requestAnimationFrame(revealContent);
    },
    start() { choose(stops[0]?.id); },
    showSources() { tab = 'sources'; render(); revealContent(); },
    getState() { return {tab, selected, visited: [...visited], total: stops.length, active, complete, sectionOpen, presentationMode}; },
    sourceContent(source) {
      if (!source) return '';
      return '<p class="eyebrow">' + esc(isCastle ? 'CUADERNO DEL CASTILLO' : 'CUADERNO · ' + monumentLabel) + '</p><h2>' + esc(source.title) + '</h2><p>' + esc([source.author, source.year].filter(Boolean).join(' · ')) + '</p>' +
        (source.locator ? '<p><strong>Referencia:</strong> ' + esc(source.locator) + '</p>' : '') +
        (source.note ? '<p>' + esc(source.note) + '</p>' : '') +
        '<a class="primary-button" href="' + esc(safeUrl(source.url)) + '" target="_blank" rel="noopener noreferrer">Abrir la fuente original</a>';
    }
  };
}
