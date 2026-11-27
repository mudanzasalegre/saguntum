import {EAST_PLAN_FEATURES, EAST_ROUTE_DEFS} from './castle-east-layout.js';

// Present limestone and sparse low vegetation. The areas/linear traces come
// from the current orthophoto registration. Individual stones, bedding and
// plant positions are interpretive; they do not constitute a geological survey.
const TAU = Math.PI * 2;
const noise = n => { const v = Math.sin(n * 127.13 + 43.7) * 43758.5453; return v - Math.floor(v); };
const hash = text => [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 104729, 17);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function segmentDistance(p, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, d = dx * dx + dz * dz;
  const t = d ? clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / d, 0, 1) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}

function inside(p, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if (((a.z > p.z) !== (b.z > p.z)) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) result = !result;
  }
  return result;
}

function edgeDistance(p, polygon) {
  let d = Infinity;
  for (let i = 0; i < polygon.length; i++) d = Math.min(d, segmentDistance(p, polygon[i], polygon[(i + 1) % polygon.length]));
  return d;
}

function triangle(out, a, b, c) { out.push(...a, ...b, ...c); }
function quad(out, a, b, c, d) { triangle(out, a, b, c); triangle(out, a, c, d); }

/** Fragmentary bedding follows the supplied terrain, never changes its sampler.
 * All vegetation remains below 0.55 m. No polygon receives a solid rock fill.
 */
export function buildEastRock({THREE, batch, keyFor, project, heightAt, detail = 'full', qa = {}, features = EAST_PLAN_FEATURES} = {}) {
  if (!batch?.raw || typeof keyFor !== 'function' || typeof project !== 'function' || typeof heightAt !== 'function') {
    throw new TypeError('El afloramiento oriental necesita batch, proyección y cota del terreno.');
  }
  const full = detail === 'full';
  const from = coordinates => coordinates.map(c => project(...c));
  const key = (id, kind) => keyFor('almenara', id, 'unknown', kind);
  const routeLines = EAST_ROUTE_DEFS.map(r => ({line: from(r.coordinates), margin: r.widthM / 2 + .65}));
  const protectedPolygons = [...(features.platforms || []), ...(features.ruins || [])].map(f => ({id: f.id, polygon: from(f.coordinates), margin: .75}));
  const protectedLines = (features.traces || []).filter(f => f.kind !== 'exposed-rock-and-low-remains').map(f => ({line: from(f.coordinates), margin: (f.widthM || .6) / 2 + .4}));
  const occupied = [];
  const report = {
    rockFragments: 0, beddingLedges: 0, scrubTufts: 0, grassTufts: 0, triangles: 0,
    candidates: 0, rejectedProtected: 0, rejectedOverlap: 0, rejectedBoundary: 0,
    maxRockReliefM: 0, maxVegetationHeightM: 0, detail,
    terrainModified: false, polygonSolidFill: false, largeTrees: false,
    individualPlacement: 'deterministic-interpretive-distribution-inside-orthophoto-areas',
    heightConfidence: 'visual-parameters-relative-to-supplied-terrain-not-a-survey',
    features: [], footprints: []
  };

  function protectedAt(p, radius) {
    for (const f of protectedPolygons) if (inside(p, f.polygon) || edgeDistance(p, f.polygon) < radius + f.margin) return true;
    for (const f of [...routeLines, ...protectedLines]) {
      for (let i = 0; i + 1 < f.line.length; i++) if (segmentDistance(p, f.line[i], f.line[i + 1]) < radius + f.margin) return true;
    }
    return false;
  }

  function available(p, radius, polygon, record) {
    report.candidates++; record.candidates++;
    if (polygon && (!inside(p, polygon) || edgeDistance(p, polygon) < radius)) {
      report.rejectedBoundary++; return false;
    }
    if (protectedAt(p, radius)) { report.rejectedProtected++; return false; }
    if (occupied.some(q => distance(p, q) < (radius + q.radius) * .87)) { report.rejectedOverlap++; return false; }
    return true;
  }

  function emit(id, kind, positions, tint) {
    if (!positions.length) return;
    batch.raw(key(id, kind), positions, tint);
    report.triangles += positions.length / 9;
  }

  // An irregular basal ring is sunk into the sampler. Two offset upper rings
  // form shallow fractured bedding ledges instead of rounded free-standing
  // boulders. Their points use local terrain heights so a steep face remains
  // partly buried, including the downhill edge.
  function rock(id, p, length, width, relief, yaw, seed, record) {
    const n = full ? 7 : 5, rings = [], c = Math.cos(yaw), s = Math.sin(yaw);
    const levels = full ? [[1, -.14], [1.025, relief * .24], [.83, relief * .72]] : [[1, -.13], [.86, relief * .72]];
    const angles = Array.from({length: n}, (_, i) => TAU * i / n + (noise(seed + i * 7) - .5) * .22);
    for (let k = 0; k < levels.length; k++) {
      const [scale, y] = levels[k];
      rings.push(angles.map((a, i) => {
        const irregular = .80 + noise(seed + i * 29) * .20;
        const u = Math.cos(a) * length * .5 * irregular * scale + (k ? (noise(seed + k * 11) - .5) * width * .11 : 0);
        const v = Math.sin(a) * width * .5 * irregular * scale;
        const x = p.x + u * c - v * s, z = p.z + u * s + v * c;
        const localY = heightAt(x, z) + y + (k ? (noise(seed + i * 31 + k) - .5) * relief * .12 : 0);
        return [x, localY, z];
      }));
    }
    for (let k = 0; k + 1 < rings.length; k++) {
      const vertices = [];
      for (let i = 0; i < n; i++) quad(vertices, rings[k][i], rings[k + 1][i], rings[k + 1][(i + 1) % n], rings[k][(i + 1) % n]);
      emit(id, 'east-rock', vertices, .86 + k * .06 + noise(seed + k) * .07);
      report.beddingLedges++;
    }
    const vertices = [], top = rings.at(-1), peak = [p.x + length * .05 * c, heightAt(p.x, p.z) + relief, p.z + length * .05 * s];
    for (let i = 0; i < n; i++) triangle(vertices, peak, top[(i + 1) % n], top[i]);
    emit(id, 'east-rock', vertices, .96 + noise(seed + 2) * .08);
    const radius = Math.max(length, width) * .60;
    occupied.push({...p, radius});
    report.footprints.push({id, x: p.x, z: p.z, radius, reliefM: relief, kind: 'rock'});
    report.rockFragments++; record.rockFragments++;
    report.maxRockReliefM = Math.max(report.maxRockReliefM, relief);
  }

  function vegetation(id, p, radius, seed, record, dry = false) {
    const vertices = [], h = dry ? .18 + noise(seed) * .18 : .22 + noise(seed) * .28;
    if (dry) {
      // Narrow opaque double-sided blades avoid flat green billboards and
      // remain legible without transparent materials or separate draw calls.
      const count = full ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const a = TAU * noise(seed + i * 17), r = radius * noise(seed + i * 7) * .5;
        const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
        const y = heightAt(x, z) - .035, w = .025 + noise(seed + i) * .025;
        const left = [x + Math.cos(a) * w, y, z + Math.sin(a) * w], right = [x - Math.cos(a) * w, y, z - Math.sin(a) * w];
        const tip = [x + Math.sin(a) * .055, y + h * (.65 + noise(seed + i * 31) * .35), z + Math.cos(a) * .055];
        triangle(vertices, left, right, tip); triangle(vertices, right, left, tip);
      }
      emit(id, 'dry-grass', vertices, .83 + noise(seed + 3) * .18);
      report.grassTufts++; record.grassTufts++;
    } else {
      // A few angular low lobes suggest Mediterranean scrub, never tree crowns.
      const lobes = full ? 3 : 2;
      for (let k = 0; k < lobes; k++) {
        const a = TAU * k / lobes + noise(seed), ox = Math.cos(a) * radius * .28, oz = Math.sin(a) * radius * .28;
        const x = p.x + ox, z = p.z + oz, y = heightAt(x, z) - .06, rr = radius * (.52 + noise(seed + k * 9) * .18);
        const ring = Array.from({length: 5}, (_, i) => {
          const t = TAU * i / 5;
          return [x + Math.cos(t) * rr, y + h * (.28 + noise(seed + i * 13 + k) * .20), z + Math.sin(t) * rr];
        });
        const tip = [x + rr * .12, y + h * (.85 + noise(seed + k * 23) * .15), z - rr * .10], bottom = [x, y, z];
        for (let i = 0; i < 5; i++) {
          triangle(vertices, tip, ring[(i + 1) % 5], ring[i]);
          triangle(vertices, bottom, ring[i], ring[(i + 1) % 5]);
        }
      }
      emit(id, 'east-scrub', vertices, .78 + noise(seed + 3) * .22);
      report.scrubTufts++; record.scrubTufts++;
    }
    occupied.push({...p, radius});
    report.footprints.push({id, x: p.x, z: p.z, radius, reliefM: h, kind: dry ? 'grass' : 'scrub'});
    report.maxVegetationHeightM = Math.max(report.maxVegetationHeightM, h);
  }

  function recordFor(f) {
    const record = {id: f.id, kind: f.kind, candidates: 0, rockFragments: 0, scrubTufts: 0, grassTufts: 0};
    report.features.push(record); return record;
  }

  // Handle only these two uncertain linear rock/low-remain bands. The six
  // explicitly masonry-like traces belong to the east structure builder.
  for (const f of (features.traces || []).filter(f => f.kind === 'exposed-rock-and-low-remains')) {
    const line = from(f.coordinates), seed = hash(f.id), record = recordFor(f);
    let along = 0, index = 0;
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i], b = line[i + 1], length = distance(a, b), yaw = Math.atan2(b.z - a.z, b.x - a.x);
      for (let d = along; d < length; d += full ? 1.25 : 1.9) {
        const n = seed + index++ * 47;
        if (noise(n) < .32) continue; // Gaps prevent a continuous invented wall.
        const t = d / length, lateral = (noise(n + 1) - .5) * .40;
        const p = {x: lerp(a.x, b.x, t) - Math.sin(yaw) * lateral, z: lerp(a.z, b.z, t) + Math.cos(yaw) * lateral};
        const l = .72 + noise(n + 2) * 1.15, w = .42 + noise(n + 3) * .72, r = Math.max(l, w) * .60;
        if (!available(p, r, null, record)) continue;
        const limits = f.reliefRangeM || [.15, .65], relief = lerp(limits[0], Math.min(.72, limits[1]), noise(n + 4));
        rock(f.id, p, l, w, relief, yaw + (noise(n + 5) - .5) * .22, n, record);
      }
      // Continue spacing through short source segments instead of placing one
      // stone at every digitised bend in the line.
      along = (along - length) % (full ? 1.25 : 1.9);
      if (along < 0) along += full ? 1.25 : 1.9;
    }
  }

  for (const f of (features.rockAreas || [])) {
    const polygon = from(f.coordinates), record = recordFor(f), seed = hash(f.id), slope = f.kind === 'rock-slope';
    const xs = polygon.map(p => p.x), zs = polygon.map(p => p.z), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const spacing = full ? (slope ? 3.0 : 2.3) : (slope ? 4.6 : 3.7);
    let index = 0;
    for (let z = z0; z < z1; z += spacing) for (let x = x0; x < x1; x += spacing) {
      const n = seed + index++ * 59;
      if (noise(n) < (slope ? .18 : .34)) continue;
      const p = {x: x + (.12 + noise(n + 1) * .76) * spacing, z: z + (.12 + noise(n + 2) * .76) * spacing};
      const l = slope ? 1.25 + noise(n + 3) * 2.35 : .75 + noise(n + 3) * 1.55;
      const w = slope ? .65 + noise(n + 4) * 1.25 : .45 + noise(n + 4) * .9;
      const r = Math.max(l, w) * .60;
      if (!available(p, r, polygon, record)) continue;
      const relief = slope ? .25 + noise(n + 5) * .90 : .12 + noise(n + 5) * .48;
      // The orientation follows the visible broad SW–NE fabric, with breaks;
      // it is not represented as a measured dip/strike of geological beds.
      const yaw = -.62 + (noise(n + 6) - .5) * .9;
      rock(f.id, p, l, w, relief, yaw, n, record);
    }
    // Low, sparse scrub sits in remaining pockets. Candidate density is lower
    // than rock density, with explicit setbacks from all visitor surfaces.
    const plantSpacing = full ? (slope ? 5.1 : 6.4) : 8.2;
    for (let z = z0; z < z1; z += plantSpacing) for (let x = x0; x < x1; x += plantSpacing) {
      const n = seed + 500003 + index++ * 37;
      if (noise(n) < .46) continue;
      const p = {x: x + noise(n + 1) * plantSpacing, z: z + noise(n + 2) * plantSpacing};
      const dry = noise(n + 3) > .44, radius = dry ? .18 + noise(n + 4) * .16 : .35 + noise(n + 4) * .34;
      if (!available(p, radius, polygon, record)) continue;
      vegetation(f.id, p, radius, n, record, dry);
    }
  }
  qa.eastRock = report;
  return report;
}
