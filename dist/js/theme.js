/** SAGUNTUM identity: UI and map colours. Scene materials keep their archaeological meaning. */
const STORAGE_KEY = 'saguntum-appearance-v1';
const THEMES = Object.freeze({
  dark: Object.freeze({
    name: 'Atlas oscuro', chrome: '#102c34',
    map: Object.freeze({ background: '#15333b', surface: '#18363d', accent: '#e1c18b', accentInk: '#162f35', border: '#6c8b92', water: '#174d5c', vegetation: '#467365', terrainLow: '#29474a', terrainHigh: '#87927a', road: '#c0c5ad', land: '#203f43', sea: '#174d5c', river: '#28696d', shore: '#79b7b5', roads: '#8ba4a1', roadMain: '#c0c5ad', urban: '#3d5655', industry: '#465b5a', building: '#556862', buildingLine: '#71877d', gold: '#e1c18b', white: '#f4f1e9', text: '#f4f1e9', muted: '#c0cbc9', labelHalo: '#15333b', grid: '#a5b8b5', active: '#e1c18b', activeText: '#162f35', marker: '#a8d0cc', markerText: '#15333b', ancient: '#e1c18b', medieval: '#8ad3ca', modern: '#f0b192', unknown: '#c0cbc9' })
  }),
  light: Object.freeze({
    name: 'Lectura clara', chrome: '#f7f9f6',
    map: Object.freeze({ background: '#e6eeea', surface: '#fcfcf8', accent: '#805026', accentInk: '#ffffff', border: '#7d9294', water: '#a8ced3', vegetation: '#a4bda1', terrainLow: '#dce5d9', terrainHigh: '#afba9c', road: '#566d60', land: '#e2e9dd', sea: '#a8ced3', river: '#7fb7b7', shore: '#347c82', roads: '#8b9b89', roadMain: '#566d60', urban: '#c5cebf', industry: '#bac8c5', building: '#b2bcaa', buildingLine: '#7d907e', gold: '#805026', white: '#18363d', text: '#18363d', muted: '#4f686c', labelHalo: '#f7f9f6', grid: '#788c83', active: '#805026', activeText: '#ffffff', marker: '#276a70', markerText: '#ffffff', ancient: '#805026', medieval: '#216c70', modern: '#974d34', unknown: '#4f686c' })
  })
});
let currentTheme = 'dark';
let cleanup = null;
const valid = value => Object.prototype.hasOwnProperty.call(THEMES, value);
function storedTheme() {
  try { const value = localStorage.getItem(STORAGE_KEY); return valid(value) ? value : 'dark'; }
  catch { return 'dark'; }
}
/** Returns the selected stable ID, dark or light. Safe to call before initTheme. */
export function getTheme() { return currentTheme; }
/** Fresh immutable palette shared by map renderers; never recolours the 3D scene. */
export function getMapPalette(theme = currentTheme) { return THEMES[valid(theme) ? theme : 'dark'].map; }
export function initTheme({ onChange = () => {} } = {}) {
  cleanup?.();
  const select = document.getElementById('appearance-select');
  const meta = document.querySelector('meta[name="theme-color"]');
  function apply(id, { persist = true, notify = true } = {}) {
    if (!valid(id)) return false;
    const changed = currentTheme !== id;
    currentTheme = id;
    document.documentElement.dataset.theme = id;
    if (select) select.value = id;
    if (meta) meta.setAttribute('content', THEMES[id].chrome);
    if (persist) { try { localStorage.setItem(STORAGE_KEY, id); } catch { /* Private mode can refuse storage; the session still works. */ } }
    if (notify && changed) onChange(id, getMapPalette(id));
    return true;
  }
  const change = event => apply(event.target.value);
  const storage = event => { if (event.key === STORAGE_KEY) apply(valid(event.newValue) ? event.newValue : 'dark', { persist: false }); };
  select?.addEventListener('change', change);
  window.addEventListener('storage', storage);
  apply(storedTheme(), { persist: false, notify: false });
  cleanup = () => { select?.removeEventListener('change', change); window.removeEventListener('storage', storage); cleanup = null; };
  return { get current() { return currentTheme; }, set: apply, dispose: () => cleanup?.() };
}
