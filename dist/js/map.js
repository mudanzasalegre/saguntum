/** Offline overview drawn exclusively from the bundled OpenStreetMap geometry.
 * The canvas owns its pixel dimensions; styling may display it at half size.
 * Returns projection/hit testing helpers without installing event handlers.
 */
export function drawRegionalMap(canvas, data, { large = false, focus = 'hill', palette: colors = {} } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !data) return null;
  const pixelWidth = canvas.width || (large ? 1200 : 540);
  const pixelHeight = canvas.height || (large ? 700 : 280);
  const W = large ? 600 : 270;
  const ratio = pixelWidth / W;
  const H = pixelHeight / ratio;
  const pad = large ? 30 : 12;
  const b = { west: -.303, east: -.160, south: 39.607, north: 39.752 };
  const midLat = (b.north + b.south) / 2;
  const lonFactor = Math.cos(midLat * Math.PI / 180);
  const geographicWidth = (b.east - b.west) * lonFactor;
  const geographicHeight = b.north - b.south;
  const unit = Math.min((W - pad * 2) / geographicWidth, (H - pad * 2) / geographicHeight);
  const cx = (b.west + b.east) / 2;
  const cy = (b.north + b.south) / 2;
  const project = (lon, lat) => [W / 2 + (lon - cx) * lonFactor * unit, H / 2 - (lat - cy) * unit];
  const palette = {
    background: '#15333b', land: '#203f43', sea: '#174d5c', roads: '#8ba4a1', roadMain: '#c0c5ad',
    urban: '#3d5655', industry: '#465b5a', river: '#28696d', shore: '#79b7b5', buildingLine: '#71877d',
    terrainHigh: '#87927a', accent: '#e1c18b', text: '#f4f1e9', muted: '#c0cbc9',
    labelHalo: '#15333b', grid: '#a5b8b5', marker: '#a8d0cc', ...colors
  };
  const alpha = (color, opacity) => `${color.slice(0, 7)}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  ctx.save();
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = palette.land;
  ctx.fillRect(0, 0, W, H);

  // Paths extending beyond the requested bounding box are safely clipped.
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  function path(coordinates, close = false) {
    if (!coordinates?.length) return false;
    ctx.beginPath();
    for (let i = 0; i < coordinates.length; i++) {
      const p = project(coordinates[i][0], coordinates[i][1]);
      if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    if (close) ctx.closePath();
    return true;
  }

  // The source coastline is continuous south → north. Close it at the actual
  // viewport edge, so fit-to-bounds margins stay ocean to the east.
  const coast = data.coastline?.length ? data.coastline : data.coastlines?.[0]?.coordinates;
  if (coast?.length) {
    path(coast);
    const first = project(...coast[0]), last = project(...coast[coast.length - 1]);
    ctx.lineTo(last[0], -100); ctx.lineTo(W + 100, -100); ctx.lineTo(W + 100, H + 100); ctx.lineTo(first[0], H + 100); ctx.closePath();
    ctx.fillStyle = palette.sea; ctx.fill();
    path(coast); ctx.strokeStyle = palette.shore; ctx.globalAlpha = .6;
    ctx.lineWidth = large ? 1.1 : .7; ctx.stroke(); ctx.globalAlpha = 1;
  } else if (data.seaPolygon) {
    path(data.seaPolygon, true); ctx.fillStyle = palette.sea; ctx.fill();
  }

  // Mapped urban footprints give each nucleus its actual shape.
  for (const area of data.urbanAreas || []) {
    if (!path(area.coordinates, true)) continue;
    ctx.fillStyle = area.kind === 'industrial' ? palette.industry : palette.urban;
    ctx.fill();
    ctx.strokeStyle = palette.buildingLine; ctx.lineWidth = .4; ctx.globalAlpha = .4; ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const water of data.water || []) {
    const channel=water.kind==='river'||water.kind==='dry-channel';
    if (!path(water.coordinates, !channel)) continue;
    if (channel) {
      // This is the mapped bed, not a claim of perennial flow.
      ctx.strokeStyle = palette.terrainHigh; ctx.lineWidth = large ? 2.0 : 1.1; ctx.globalAlpha = .65; ctx.stroke();
    } else { ctx.fillStyle = palette.river; ctx.globalAlpha = .85; ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  const weights = { motorway: 1.15, trunk: 1.05, primary: 1, secondary: .75, tertiary: .5 };
  for (const road of data.roads || []) {
    if (!path(road.coordinates)) continue;
    ctx.lineWidth = (weights[road.kind] || .45) * (large ? 1.15 : .78);
    ctx.strokeStyle = road.kind === 'motorway' || road.kind === 'trunk' ? palette.roadMain : palette.roads;
    ctx.globalAlpha = road.kind === 'tertiary' ? .28 : .48;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.muted; ctx.lineWidth = large ? .7 : .4; ctx.setLineDash([2, 3]); ctx.globalAlpha = .33;
  for (const line of data.railways || []) if (path(line.coordinates)) ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;

  // Geographic reference grid, deliberately quiet beneath the labels.
  ctx.lineWidth = .45; ctx.strokeStyle = palette.grid; ctx.globalAlpha = .055;
  for (let lon = Math.ceil(b.west / .02) * .02; lon < b.east; lon += .02) {
    const x = project(lon, cy)[0]; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let lat = Math.ceil(b.south / .02) * .02; lat < b.north; lat += .02) {
    const y = project(cx, lat)[1]; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(0, 0, W, H);
  shade.addColorStop(0, alpha(palette.background, .08)); shade.addColorStop(.5, alpha(palette.background, 0)); shade.addColorStop(1, alpha(palette.background, .16));
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);

  const hits = [
    { id: 'hill', coordinate: [-.2786, 39.67615], label: 'Sagunto · Castillo y Teatro Romano', title: 'SAGUNTO', subtitle: 'Castillo · Teatro Romano', compact: 'Sagunto' },
    { id: 'port', coordinate: [-.2208575, 39.6631732], label: 'Puerto de Sagunto', title: 'PUERTO DE SAGUNTO', subtitle: 'Patrimonio industrial', compact: 'Puerto de', compactSub: 'Sagunto' },
    { id: 'coast', coordinate: [-.239697918, 39.635329816], label: 'Grau Vell y costa', title: 'GRAU VELL Y COSTA', subtitle: 'Pantalán · antiguo puerto', compact: 'Grau Vell', compactSub: 'y costa' },
    { id: 'marjal', coordinate: [-.2588, 39.6249], label: 'Marjal dels Moros', title: 'MARJAL DELS MOROS', subtitle: 'Lagunas y observatorios', compact: 'Marjal dels', compactSub: 'Moros' },
    { id: 'almarda', coordinate: [-.19442, 39.709], label: 'Dunas de Almardà y Almenara', title: 'DUNAS DE ALMARDÀ', subtitle: 'Corinto · Almenara', compact: 'Almardà', compactSub: 'y Almenara' },
    { id: 'palancia', coordinate: [-.245, 39.678], label: 'Palancia · conexión territorial', title: 'RÍO PALANCIA', subtitle: 'Corredor fluvial', compact: 'Palancia' }
  ];
  const focusId = focus === 'puerto' ? 'port' : focus === 'sagunto' ? 'hill' : focus;
  const activeHit = hits.find(hit => hit.id === focusId) || hits[0], active = project(...activeHit.coordinate);
  const labelRects = [];
  ctx.strokeStyle = palette.accent; ctx.fillStyle = alpha(palette.accent, .07); ctx.lineWidth = large ? 1.2 : .85;
  ctx.beginPath(); ctx.ellipse(active[0], active[1], large ? 22 : 10, large ? 17 : 8, -.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.setLineDash([2, 3]); ctx.globalAlpha = .35;
  ctx.beginPath(); ctx.ellipse(active[0], active[1], large ? 28 : 14, large ? 23 : 11, -.15, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  function marker(p, radius, color) {
    ctx.beginPath(); ctx.arc(p[0], p[1], radius + 1.8, 0, Math.PI * 2); ctx.fillStyle = palette.labelHalo; ctx.fill();
    ctx.beginPath(); ctx.arc(p[0], p[1], radius, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }
  function label(text, x, y, size, { color = palette.text, align = 'left', weight = 500, halo = true, italic = false } = {}) {
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px Manrope, system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (halo) { ctx.lineJoin = 'round'; ctx.strokeStyle = alpha(palette.labelHalo, .92); ctx.lineWidth = 3.5; ctx.strokeText(text, x, y); }
    ctx.fillStyle = color; ctx.fillText(text, x, y); return ctx.measureText(text).width;
  }
  const compactPositions = {
    hill: [22, H * .51, 'left'], palancia: [22, H * .30, 'left'], marjal: [22, H * .68, 'left'],
    almarda: [W - 91, H * .25, 'left'], port: [W - 91, H * .53, 'left'], coast: [W - 91, H * .79, 'left']
  };
  const offsets = { hill: [-24, -19, 'right'], palancia: [-5, -31, 'center'], port: [44, 4, 'left'], coast: [35, 6, 'left'], marjal: [-38, 9, 'right'], almarda: [32, -18, 'left'] };
  for (const hit of hits) {
    const p = project(...hit.coordinate), selected = hit.id === activeHit.id, position = large ? [p[0] + offsets[hit.id][0], p[1] + offsets[hit.id][1], offsets[hit.id][2]] : compactPositions[hit.id];
    const [x, y, align] = position, title = large ? hit.title : hit.compact, subtitle = large ? hit.subtitle : hit.compactSub, size = large ? (hit.id === 'hill' ? 14 : 12) : 10.5;
    marker(p, large ? 3.7 : 2.5, selected ? palette.accent : palette.marker);
    const endX = x + (align === 'right' ? 5 : align === 'left' ? -6 : 0), endY = y + (align === 'center' ? 9 : 0);
    ctx.strokeStyle = selected ? alpha(palette.accent, .67) : alpha(palette.muted, .44); ctx.lineWidth = large ? .8 : .65;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo((p[0] + endX) / 2, endY); ctx.lineTo(endX, endY); ctx.stroke();
    const tw = label(title, x, y, size, { align, color: selected ? palette.accent : palette.text, weight: 600 });
    const sw = subtitle ? label(subtitle, x, y + (large ? 15 : 11), large ? 10.5 : 9.3, { align, color: palette.muted, weight: 400 }) : 0;
    const width = Math.max(tw, sw), left = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x;
    labelRects.push({ hit, x: left - 4, y: y - size / 2 - 3, w: width + 8, h: size + (subtitle ? (large ? 15 : 11) : 0) + 6 });
  }
  // The two original hill monuments and the offshore pier remain recognizable.
  marker(project(-.27915, 39.67598), large ? 2.3 : 1.4, palette.accent);
  marker(project(-.27800, 39.67689), large ? 2.0 : 1.2, palette.text);
  marker(project(-.2062109, 39.6523078), large ? 2.8 : 1.8, focusId === 'coast' ? palette.accent : palette.marker);
  if (large) { const p = project(-.2209621, 39.6804554); label('Canet d’en Berenguer', p[0] + 16, p[1] - 2, 9.3, { color: palette.muted, weight: 400 }); }
  // Sea label fits in the seaward margin created by the geographic aspect ratio.
  const seaX = W - (large ? 22 : 11);
  ctx.save(); ctx.translate(seaX, H * .5); ctx.rotate(-Math.PI / 2);
  label(large ? 'MAR MEDITERRÁNEO' : 'MEDITERRÁNEO', 0, 0, large ? 11 : 8.5, { color: palette.text, align: 'center', halo: false, weight: 500 });
  ctx.restore();

  // North reference and physical scale reflect this projection.
  const northX = large ? 26 : 15, northY = large ? 30 : 18;
  label('N', northX, northY - 7, large ? 10 : 8, { color: palette.muted, align: 'center', halo: false });
  ctx.strokeStyle = palette.muted; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.moveTo(northX, northY + 1); ctx.lineTo(northX, northY + (large ? 17 : 11)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(northX - 2.5, northY + 5); ctx.lineTo(northX, northY + 1); ctx.lineTo(northX + 2.5, northY + 5); ctx.stroke();
  const distance = large ? 1000 : 2000;
  const scaleLength = distance / 111320 * unit;
  const scaleX = large ? 24 : 13, scaleY = H - (large ? 22 : 12);
  ctx.strokeStyle = palette.muted; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(scaleX, scaleY - 3); ctx.lineTo(scaleX, scaleY); ctx.lineTo(scaleX + scaleLength, scaleY); ctx.lineTo(scaleX + scaleLength, scaleY - 3); ctx.stroke();
  label(`${distance / 1000} km`, scaleX + scaleLength / 2, scaleY - (large ? 10 : 8), large ? 9 : 7.5, { color: palette.muted, align: 'center', halo: false });
  ctx.restore();

  return {
    width: W, height: H, project, targets: hits, labelRects, bounds: b,
    hitTest(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const px = (clientX - rect.left) / (rect.width || W) * W;
      const py = (clientY - rect.top) / (rect.height || H) * H;
      const labelHit = labelRects.find(r => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
      if (labelHit) return labelHit.hit;
      let winner = null, nearest = large ? 25 : 14;
      for (const hit of hits) {
        const p = project(...hit.coordinate), d = Math.hypot(px - p[0], py - p[1]);
        if (d < nearest) { nearest = d; winner = hit; }
      }
      return winner;
    }
  };
}
