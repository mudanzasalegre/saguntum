const SESSION_KEY = 'saguntum-visit-panel-hidden-v1';

// The notebook stays mounted: changing its visibility must not change the
// selected stop, reading tab, architectural section or scroll position.
export function createEditorialVisibility({onChange = () => {}} = {}) {
  const panel = document.getElementById('editorial');
  const hide = document.getElementById('editorial-hide');
  const show = document.getElementById('editorial-show');
  const body = document.body;
  if (!panel || !hide || !show) return null;
  let preference = false, state = '', disposed = false;
  try { preference = sessionStorage.getItem(SESSION_KEY) === '1'; } catch {}
  const active = () => body.classList.contains('detail-mode');
  const collapsed = () => active() && preference;
  function sync() {
    if (disposed) return;
    const hidden = collapsed();
    const blocked = body.classList.contains('catalog-mode') || body.classList.contains('tour-mode');
    const next = [active(), hidden, blocked].join(':');
    if (body.classList.contains('editorial-collapsed') !== hidden) body.classList.toggle('editorial-collapsed', hidden);
    panel.inert = hidden || blocked;
    if (panel.inert) panel.setAttribute('aria-hidden', 'true');
    else panel.removeAttribute('aria-hidden');
    hide.hidden = !active();
    show.hidden = !hidden || blocked;
    hide.setAttribute('aria-expanded', String(!hidden));
    show.setAttribute('aria-expanded', String(!hidden));
    if (next !== state) { state = next; onChange(); }
  }
  function setCollapsed(value, {focus = true} = {}) {
    if (!active() || disposed) return;
    preference = !!value;
    try { sessionStorage.setItem(SESSION_KEY, preference ? '1' : '0'); } catch {}
    // Move focus before hiding its previous owner. preventScroll preserves the
    // reader's position even when returning to the sticky notebook controls.
    if (preference) {
      show.hidden = false;
      if (focus) show.focus({preventScroll: true});
    } else {
      panel.inert = false;
      panel.removeAttribute('aria-hidden');
      body.classList.remove('editorial-collapsed');
    }
    sync();
    if (!preference && focus) {
      // A visibility transition may still leave the just-opened notebook
      // unfocusable until style/layout has advanced to the next frame.
      requestAnimationFrame(() => {
        if (!disposed && active() && !collapsed()) hide.focus({preventScroll: true});
      });
    }
  }
  const conceal = () => setCollapsed(true);
  const reveal = () => setCollapsed(false);
  hide.addEventListener('click', conceal);
  show.addEventListener('click', reveal);
  const observer = new MutationObserver(sync);
  observer.observe(body, {attributes: true, attributeFilter: ['class']});
  body.classList.add('editorial-controls-ready');
  sync();
  return {
    get collapsed() { return collapsed(); },
    setCollapsed, sync,
    dispose() { disposed = true; observer.disconnect(); hide.removeEventListener('click', conceal); show.removeEventListener('click', reveal); }
  };
}

// Only the usable projection rectangle changes; camera position, target, zoom
// and the selected stop are left untouched when the reader folds the notebook.
export function editorialSceneFrame(w, h, {collapsed = false, place = null} = {}) {
  const phone = w <= 700, short = !phone && h <= 540;
  let left, right, top, bottom;
  if (collapsed) {
    left = phone ? 16 : short ? 20 : 24;
    right = w - (phone || short ? 64 : 80);
    top = phone ? 184 : short ? 78 : 108;
    bottom = h - (phone ? 80 : short ? 62 : 80);
  } else if (place === 'glorieta' && w > 700 && w <= 1000 && h > w) {
    left = 20; right = w - 64; top = 102; bottom = h * .54;
  } else {
    left = phone ? 16 : short ? 372 : 424;
    right = w - (phone ? 16 : short ? 64 : 80);
    top = phone ? 124 : short ? 78 : 108;
    bottom = phone ? h * .5 - 12 : h - (short ? 62 : 80);
  }
  return {left, right, top, bottom, width: Math.max(80, right - left), height: Math.max(80, bottom - top),
    offsetX: w / 2 - (left + right) / 2, offsetY: h / 2 - (top + bottom) / 2};
}
