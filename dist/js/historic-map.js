const project = (lon, lat) => ({ x: (lon + .278) * 111320 * Math.cos(39.679 * Math.PI / 180), z: (39.679 - lat) * 111320 });
const landscapeRegions = new Set(['marjal', 'almarda', 'palancia']);
const finiteCoordinate = c => Array.isArray(c) && c.length === 2 && c.every(Number.isFinite);

export function drawHistoricMap(canvas, data, sites, { selected = 'overview', selectedFocus = null, large = false, heightAt, region = 'sagunto', water = null, modes = {}, palette: colors = {} } = {}) {
  const ctx = canvas.getContext('2d'); if (!ctx || !data) return null;
  const palette = {
    background: '#15333b', surface: '#18363d', terrainLow: '#29474a', terrainHigh: '#87927a',
    vegetation: '#467365', sea: '#174d5c', river: '#28696d', shore: '#79b7b5',
    building: '#556862', buildingLine: '#71877d', roads: '#8ba4a1', roadMain: '#c0c5ad',
    accent: '#e1c18b', ancient: '#e1c18b', text: '#f4f1e9', muted: '#c0cbc9',
    labelHalo: '#15333b', active: '#e1c18b', activeText: '#162f35', marker: '#a8d0cc', markerText: '#15333b', ...colors
  };
  // The theme supplies six-digit sRGB colours. Keep the height sampler and its
  // bounded grid unchanged; only the colour ramp changes with the appearance.
  const alpha = (color, opacity) => `${color.slice(0, 7)}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  const mix = (a, b, amount) => `#${[1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - amount) + parseInt(b.slice(i, i + 2), 16) * amount).toString(16).padStart(2, '0')).join('')}`;
  const w = canvas.width, h = canvas.height, pad = large ? 44 : 16, landscape = landscapeRegions.has(region);
  const defaults = region === 'coast' ? { minX: 3120, maxX: 7500, minZ: 2580, maxZ: 5080 } : region === 'puerto' ? { minX: 4070, maxX: 5340, minZ: 1540, maxZ: 2930 } : { minX: -470, maxX: 640, minZ: -320, maxZ: 610 };
  const b = { ...(landscape && data.bounds ? data.bounds : defaults) }, locations = [], observations = [];
  for (const site of sites) {
    const secondary = (site.secondaryLocations || []).filter(p => finiteCoordinate(p.coordinate));
    const points = landscape ? (site.observationPoints || []).filter(p => finiteCoordinate(p.coordinate)) : [];
    if (finiteCoordinate(site.coordinate)) locations.push({ site, coordinate: site.coordinate, focusId: null, secondary: false, observation: false, active: site.id === selected && ![...secondary, ...points].some(p => p.id === selectedFocus) });
    // A second geographic area retains its catalogue id (e.g. the hypogea).
    for (const point of secondary) locations.push({ site, coordinate: point.coordinate, focusId: point.id, secondary: true, observation: false, label: point.markerLabel || (point.id === 'hipogeos' && site.number ? `${site.number}h` : 'H'), active: site.id === selected && point.id === selectedFocus });
    for (const point of points) {
      const location = { site, coordinate: point.coordinate, focusId: point.id, secondary: false, observation: true, label: String(observations.length + 1), name: point.label, note: point.note, active: site.id === selected && point.id === selectedFocus };
      observations.push(location); locations.push(location);
    }
  }
  for (const location of locations) { const p = project(...location.coordinate); b.minX = Math.min(b.minX, p.x - 55); b.maxX = Math.max(b.maxX, p.x + 55); b.minZ = Math.min(b.minZ, p.z - 55); b.maxZ = Math.max(b.maxZ, p.z + 55); }
  const scale = Math.min((w - pad * 2) / (b.maxX - b.minX), (h - pad * 2) / (b.maxZ - b.minZ)), mapW = (b.maxX - b.minX) * scale, mapH = (b.maxZ - b.minZ) * scale, ox = (w - mapW) / 2, oy = (h - mapH) / 2;
  const map = p => ({ x: ox + (p.x - b.minX) * scale, y: oy + (p.z - b.minZ) * scale });
  ctx.fillStyle = palette.background; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, mapW, mapH); ctx.clip();
  // Bound shading by canvas resolution, not the number of terrain metres.
  let shadeCells = 0;
  if (heightAt) {
    const terrainRamp = Array.from({ length: 256 }, (_, i) => mix(palette.terrainLow, palette.terrainHigh, i / 255));
    const pixels = Math.max(large ? 3 : 5, Math.sqrt(mapW * mapH / 22000)), step = pixels / scale;
    for (let z = b.minZ; z < b.maxZ; z += step) for (let x = b.minX; x < b.maxX; x += step) {
      const raw = heightAt(x + step / 2, z + step / 2), y = Number.isFinite(raw) ? raw : 0, p = map({ x, z });
      const relief = Math.min(1, Math.max(0, y) / (landscape ? 22 : 190));
      ctx.fillStyle = terrainRamp[Math.round(relief * 255)];
      ctx.fillRect(p.x, p.y, Math.ceil(pixels) + 1, Math.ceil(pixels) + 1); shadeCells++;
    }
  }
  function ring(coords = []) { for (let i = 0; i < coords.length; i++) { const p = map(project(...coords[i])); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); } }
  function path(coords = [], close = false) { if (!coords.length) return false; ctx.beginPath(); ring(coords); if (close) ctx.closePath(); return true; }
  function polygon(coords, holes = []) { if (!coords?.length) return false; ctx.beginPath(); ring(coords); ctx.closePath(); for (const hole of holes) { ring(hole); ctx.closePath(); } return true; }
  if (landscape) {
    const wetland = mix(palette.vegetation, palette.river, .25), scrub = mix(palette.vegetation, palette.terrainHigh, .35), grass = mix(palette.vegetation, palette.terrainHigh, .6), sand = mix(palette.terrainHigh, palette.surface, .55), stone = mix(palette.terrainHigh, palette.muted, .35), garden = mix(palette.vegetation, palette.terrainLow, .2);
    const fills = { wetland, marsh: wetland, reedbed: scrub, scrub, heath: scrub, grassland: grass, grass, meadow: grass, forest: palette.vegetation, wood: palette.vegetation, beach: sand, sand, shingle: stone, bare_rock: stone, farmland: garden, orchard: garden, garden, park: garden };
    for (const cover of data.landcover || []) { const fill = fills[cover.kind]; if (!fill || !polygon(cover.coordinates, cover.holes || [])) continue; ctx.fillStyle = fill; ctx.globalAlpha = ['beach', 'sand', 'shingle'].includes(cover.kind) ? .64 : .53; ctx.fill('evenodd'); }
    ctx.globalAlpha = 1;
    // River/stream axes describe channels, never a perpetual sheet of water.
    for (const line of data.waterways || []) { if (!path(line.coordinates)) continue; ctx.strokeStyle = ['river', 'stream'].includes(line.kind) ? palette.terrainHigh : palette.shore; ctx.globalAlpha = .55; ctx.lineWidth = large ? 1.2 : .65; ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  if (water) {
    const surfaces = water.surfaces?.length ? water.surfaces : water.polygons || [];
    if (landscape && (data.coastlines?.length || water.coastline?.length)) {
      // The 3D sea is clipped to the presentation ellipse. A cartographic map
      // instead carries the open sea to its rectangular frame, using the OSM
      // coastline chain; the ellipse is not a real shoreline.
      const parts = (data.coastlines || []).map(line => [...(line.coordinates || [])]).filter(p => p.length > 1), chains = [];
      while (parts.length) {
        const chain = parts.pop(); let joined = true;
        const same = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 1e-6;
        while (joined) { joined = false; for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; if (same(chain.at(-1), q[0])) chain.push(...q.slice(1)); else if (same(q.at(-1), chain[0])) chain.unshift(...q.slice(0, -1)); else if (same(chain.at(-1), q.at(-1))) chain.push(...q.slice(0, -1).reverse()); else if (same(chain[0], q[0])) chain.unshift(...q.slice(1).reverse()); else continue; parts.splice(i, 1); joined = true; } }
        chains.push(chain);
      }
      const shore = chains.sort((a, b) => b.length - a.length)[0] || water.coastline;
      if (shore?.length > 1) {
        const line = shore[0][1] < shore.at(-1)[1] ? shore : [...shore].reverse(), first = map(project(...line[0])), last = map(project(...line.at(-1)));
        ctx.beginPath(); ctx.moveTo(first.x, oy + mapH); for (const c of line) { const p = map(project(...c)); ctx.lineTo(p.x, p.y); } ctx.lineTo(last.x, oy); ctx.lineTo(ox + mapW, oy); ctx.lineTo(ox + mapW, oy + mapH); ctx.closePath(); ctx.fillStyle = palette.sea; ctx.fill();
      }
    }
    for (const surface of surfaces) { if (!polygon(surface.outer || surface.coordinates, surface.holes || [])) continue; ctx.fillStyle = !landscape || surface.kind === 'sea' ? palette.sea : palette.river; ctx.fill('evenodd'); }
    if (path(water.coastline || [])) { ctx.strokeStyle = palette.shore; ctx.lineWidth = large ? 1.5 : .75; ctx.stroke(); }
  }
  ctx.fillStyle = palette.building; ctx.strokeStyle = palette.buildingLine; ctx.lineWidth = .35;
  for (const building of data.buildings || []) { if (!polygon(building.coordinates, building.holes || [])) continue; ctx.fill('evenodd'); if (large) ctx.stroke(); }
  for (const road of data.roads || []) { if (!path(road.coordinates)) continue; const main = ['primary', 'secondary', 'tertiary', 'residential'].includes(road.kind); ctx.strokeStyle = main ? palette.roadMain : palette.roads; ctx.lineWidth = large ? (main ? 2 : 1) : .65; ctx.globalAlpha = landscape ? (main ? .72 : .51) : 1; ctx.stroke(); }
  ctx.globalAlpha = 1;
  if (region === 'puerto' || region === 'coast') for (const site of sites) for (const footprint of [site.footprint, ...(site.contextFootprints || [])].filter(v => Array.isArray(v) && v.length >= 3)) { path(footprint, true); ctx.fillStyle = modes[site.id] === 'historical' ? alpha(palette.ancient, .55) : alpha(palette.accent, .65); ctx.fill(); ctx.strokeStyle = palette.accent; ctx.lineWidth = large ? 1.3 : .6; ctx.stroke(); }
  if (region === 'coast') { const historical = modes['pantalan-maritimo'] === 'historical'; path([[-.20610277, 39.65222479], [-.19499253, 39.64706068]]); ctx.strokeStyle = historical ? palette.ancient : palette.text; ctx.setLineDash(historical ? [] : [3, 5]); ctx.lineWidth = large ? 3.5 : 1.5; ctx.stroke(); ctx.setLineDash([]); if (large) { ctx.textAlign = 'left'; ctx.font = '13px Manrope,sans-serif'; ctx.fillStyle = palette.text; ctx.fillText(historical ? 'Pantalán · restitución industrial 1984–1987' : 'Pantalán · estructuras conservadas discontinuas', ox + 12, oy + 20); } }
  if (path(data.castlePolygon || [], true)) { ctx.fillStyle = alpha(palette.accent, .32); ctx.fill(); ctx.strokeStyle = palette.accent; ctx.lineWidth = large ? 2.5 : 1.3; ctx.stroke(); }
  if (path(data.theatrePolygon || [], true)) { ctx.fillStyle = palette.ancient; ctx.fill(); }
  ctx.restore();
  const targets = [], placed = [];
  for (const location of locations) {
    const { site, active, secondary, focusId, observation } = location, real = map(project(...location.coordinate)); let p = { ...real };
    const separation = large ? 27 : landscape ? 16 : 0;
    if (separation) for (let n = 0; n < 48 && placed.some(q => Math.hypot(q.x - p.x, q.y - p.y) < separation); n++) { const radius = (large ? 14 : 8) + n * (large ? 1.6 : 1.1); p = { x: Math.max(pad + 6, Math.min(w - pad - 6, real.x + Math.cos(n * 2.39996) * radius)), y: Math.max(pad + 6, Math.min(h - pad - 6, real.y + Math.sin(n * 2.39996) * radius)) }; }
    placed.push(p); const r = large ? (observation ? 10 : 12) : active ? 8 : observation ? 6 : secondary ? 6 : 4;
    if (Math.hypot(real.x - p.x, real.y - p.y) > 3) { ctx.beginPath(); ctx.moveTo(real.x, real.y); ctx.lineTo(p.x, p.y); ctx.strokeStyle = palette.muted; ctx.lineWidth = large ? 1 : .7; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = active ? palette.active : palette.marker; ctx.fill(); ctx.strokeStyle = palette.labelHalo; ctx.lineWidth = 2; ctx.stroke();
    if (large || active || secondary || observation) { ctx.fillStyle = active ? palette.activeText : palette.markerText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 ${large ? (secondary ? 10 : 12) : (secondary || observation ? 8 : 9)}px Manrope,sans-serif`; ctx.fillText(observation ? location.label : secondary ? (large ? location.label : 'H') : (site.number || ({ theatre: 'T', castle: 'C' }[site.id] || '')), p.x, p.y + .5); }
    targets.push({ ...p, id: site.id, focusId, r: large ? 19 : 11, label: location.name || site.name });
  }
  function fitText(text, maxWidth) { let value = String(text || ''); while (value.length > 2 && ctx.measureText(value).width > maxWidth) value = value.slice(0, -2) + '…'; return value; }
  if (observations.length) {
    if (large) {
      const leftSpace = ox - pad, belowSpace = h - (oy + mapH) - pad, side = leftSpace >= 205;
      const columns = side ? 1 : 2, rowHeight = side ? 27 : 22, rows = Math.ceil(observations.length / columns), legendWidth = side ? Math.min(290, leftSpace - 14) : Math.min(w - pad * 2 - 170, 620);
      const lx = pad, ly = side ? pad + 45 : belowSpace >= rows * rowHeight + 28 ? oy + mapH + 19 : Math.max(pad + 24, h - pad - rows * rowHeight - 30);
      ctx.fillStyle = alpha(palette.surface, .93); ctx.fillRect(lx - 8, ly - 24, legendWidth + 16, rows * rowHeight + 39);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '600 11px Manrope,sans-serif'; ctx.fillStyle = palette.muted; ctx.fillText('PUNTOS DE OBSERVACIÓN', lx, ly - 10);
      observations.forEach((location, i) => {
        const col = Math.floor(i / rows), row = i % rows, x = lx + col * (legendWidth / columns), y = ly + 16 + row * rowHeight, columnWidth = legendWidth / columns - 12;
        ctx.fillStyle = location.active ? palette.active : palette.marker; ctx.beginPath(); ctx.arc(x + 8, y, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = location.active ? palette.activeText : palette.markerText; ctx.font = '600 9px Manrope,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(location.label, x + 8, y + .5);
        ctx.textAlign = 'left'; ctx.font = '12px Manrope,sans-serif'; ctx.fillStyle = location.active ? palette.accent : palette.text; ctx.fillText(fitText(location.name, columnWidth - 25), x + 24, y);
        targets.push({ id: location.site.id, focusId: location.focusId, rect: { x: x - 4, y: y - 11, w: columnWidth + 3, h: 22 }, label: location.name });
      });
    } else { const text = `1–${observations.length} · observación`; ctx.font = '9px Manrope,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = alpha(palette.surface, .91); ctx.fillRect(pad - 3, h - pad - 16, ctx.measureText(text).width + 9, 18); ctx.fillStyle = palette.muted; ctx.fillText(text, pad, h - pad - 7); }
  }
  ctx.fillStyle = palette.text; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.font = `${large ? 14 : 11}px Manrope,sans-serif`; ctx.fillText('N', w - pad, pad); ctx.beginPath(); ctx.moveTo(w - pad - 5, pad + 35); ctx.lineTo(w - pad - 5, pad + 20); ctx.strokeStyle = palette.text; ctx.lineWidth = 1.5; ctx.stroke();
  const scaleMeters = landscape ? (region === 'palancia' ? 2000 : 1000) : region === 'coast' ? 500 : region === 'puerto' ? 200 : 100, bar = scaleMeters * scale;
  ctx.strokeStyle = palette.text; ctx.beginPath(); ctx.moveTo(w - pad - bar, h - pad - 9); ctx.lineTo(w - pad, h - pad - 9); ctx.stroke(); ctx.font = `${large ? 12 : 9}px Manrope,sans-serif`; ctx.fillText(scaleMeters >= 1000 ? `${scaleMeters / 1000} km` : `${scaleMeters} m`, w - pad, h - pad - 25);
  function hitTarget(x, y) {
    const legend = targets.find(p => p.rect && x >= p.rect.x && x <= p.rect.x + p.rect.w && y >= p.rect.y && y <= p.rect.y + p.rect.h); if (legend) return { id: legend.id, focusId: legend.focusId };
    let nearest = null, distance = Infinity; for (const point of targets) { if (point.rect) continue; const d = Math.hypot(point.x - x, point.y - y); if (d < point.r && d < distance) { nearest = point; distance = d; } } return nearest ? { id: nearest.id, focusId: nearest.focusId } : null;
  }
  return { hitTarget, hitTest(x, y) { return hitTarget(x, y)?.id || null; }, targets, bounds: b, shadeCells };
}
