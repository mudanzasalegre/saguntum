import * as THREE from 'three';

// The cadastral/OSM polygons are authoritative plan geometry. Elevations and
// roof profiles remain an interpretation of PNOA and dated street photographs.
// This factory owns no sea, coastline, wetland or terrain-flattening geometry.
const UP = new THREE.Vector3(0, 1, 0), IDENTITY = new THREE.Matrix4();
const projectDefault = (lon, lat) => ({ x: (lon + .278) * 111320 * Math.cos(39.679 * Math.PI / 180), z: (39.679 - lat) * 111320 });
const noise = n => { const v = Math.sin(n * 127.17 + 43.13) * 43758.5453; return v - Math.floor(v); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
const area = p => p.reduce((v, a, i) => { const b = p[(i + 1) % p.length]; return v + a.x * b.z - b.x * a.z; }, 0) / 2;
const quad = (a, b, c, d) => [...a, ...b, ...c, ...a, ...c, ...d];
function ring(coords, project) { const p = coords.map(q => project(...q)); if (p.length > 1 && Math.hypot(p[0].x - p.at(-1).x, p[0].z - p.at(-1).z) < .001) p.pop(); return p; }
function contains(p, poly) { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) yes = !yes; } return yes; }
const bounds = p => ({ minX: Math.min(...p.map(q => q.x)), maxX: Math.max(...p.map(q => q.x)), minZ: Math.min(...p.map(q => q.z)), maxZ: Math.max(...p.map(q => q.z)) });
const overlaps = (a, b) => a.minX <= b.maxX && a.maxX >= b.minX && a.minZ <= b.maxZ && a.maxZ >= b.minZ;
function nearest(p, line) { let best = { distance: Infinity }; for (let i = 1; i < line.length; i++) { const a = line[i - 1], b = line[i], dx = b.x - a.x, dz = b.z - a.z, t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1), q = lerp(a, b, t), distance = Math.hypot(p.x - q.x, p.z - q.z); if (distance < best.distance) best = { distance, point: q }; } return best; }
function triangles(outer, holes = []) { const p = [outer, ...holes].flat(), ids = THREE.ShapeUtils.triangulateShape(outer.map(v => new THREE.Vector2(v.x, v.z)), holes.map(h => h.map(v => new THREE.Vector2(v.x, v.z)))); return ids.map(t => t.map(i => p[i])); }
function split(poly, a, b, sign) { const inside = [], outside = [], distance = p => ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) * sign; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], dp = distance(p), dq = distance(q), pi = dp >= -1e-8, qi = dq >= -1e-8; (pi ? inside : outside).push(p); if (pi !== qi) { const v = lerp(p, q, dp / (dp - dq)); inside.push(v); outside.push(v); } } return { inside, outside }; }
function outsideTriangle(poly, clip) { let rest = poly; const result = [], sign = area(clip) >= 0 ? 1 : -1; for (let i = 0; i < clip.length && rest.length >= 3; i++) { const s = split(rest, clip[i], clip[(i + 1) % clip.length], sign); if (s.outside.length >= 3 && Math.abs(area(s.outside)) > 1e-7) result.push(s.outside); rest = s.inside; } return result; }

function makeTexture(kind) {
 const size = 128, pixels = new Uint8Array(size * size * 4);
 for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  let v = 234 + (noise(x + y * 173) - .5) * 14;
  if (kind === 'asphalt') v = 220 + (noise(x + y * 131) - .5) * 38;
  if (kind === 'gravel') v = 223 + (noise(x + y * 157) - .5) * 48;
  if (kind === 'roof') { const row = Math.floor(y / 32), column = (x + (row % 2) * 8) % 16; v = 214 + Math.sin(column / 16 * Math.PI) * 31 + (noise(Math.floor(x / 16) + row * 41) - .5) * 13; if (y % 32 < 2) v -= 30; }
  if (kind === 'paving' || kind === 'brick') { const h = kind === 'brick' ? 12 : 32, row = Math.floor(y / h), w = kind === 'brick' ? 32 : 64; v = (y % h < 1 || (x + row % 2 * w / 2) % w < 1) ? 185 : 229 + (noise(Math.floor(x / w) + row * 33) - .5) * 15; }
  if (kind === 'sheet') v = 229 + Math.sin(x * .78) * 10;
  const i = (y * size + x) * 4; pixels[i] = pixels[i + 1] = pixels[i + 2] = clamp(v, 0, 255); pixels[i + 3] = 255;
 }
 const t = new THREE.DataTexture(pixels, size, size); t.name = 'Grau Vell · ' + kind; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
}

class Batch {
 constructor(resources, groups, materials) { this.resources = resources; this.groups = groups; this.materials = materials; this.parts = new Map(); this.cube = new THREE.BoxGeometry(); }
 add(dest, kind, g, color, matrix = IDENTITY, uvMapper = null) {
  const key = dest + '|' + kind; let out = this.parts.get(key); if (!out) { out = { p: [], n: [], u: [], c: [] }; this.parts.set(key, out); }
  const geometry = g.index ? g.toNonIndexed() : g; if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const pos = geometry.attributes.position, normals = geometry.attributes.normal, nm = new THREE.Matrix3().getNormalMatrix(matrix), v = new THREE.Vector3(), n = new THREE.Vector3(), rgb = new THREE.Color(color);
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(matrix); n.fromBufferAttribute(normals, i).applyMatrix3(nm).normalize(); out.p.push(v.x, v.y, v.z); out.n.push(n.x, n.y, n.z); const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z), scale = kind === 'brick' ? 1.25 : 2.4, uv = uvMapper ? uvMapper(v) : [(ay >= ax && ay >= az ? v.x : ax >= az ? v.z : v.x) / scale, (ay >= ax && ay >= az ? v.z : v.y) / scale]; out.u.push(...uv); out.c.push(rgb.r, rgb.g, rgb.b); }
  if (geometry !== g) geometry.dispose();
 }
 raw(dest, kind, pts, color, uvMapper = null) { const clean = []; for (let i = 0; i < pts.length; i += 9) { const a = new THREE.Vector3(...pts.slice(i, i + 3)), b = new THREE.Vector3(...pts.slice(i + 3, i + 6)), c = new THREE.Vector3(...pts.slice(i + 6, i + 9)); if (b.sub(a).cross(c.sub(a)).lengthSq() > 1e-12) clean.push(...pts.slice(i, i + 9)); } if (!clean.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(clean, 3)); g.computeVertexNormals(); this.add(dest, kind, g, color, IDENTITY, uvMapper); g.dispose(); }
 box(dest, kind, p, w, h, d, yaw, color) { if (Math.min(w, h, d) <= .0001) return; this.add(dest, kind, this.cube, color, new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromAxisAngle(UP, yaw), new THREE.Vector3(w, h, d))); }
 beam(dest, kind, a, b, w, h, color) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), delta = B.clone().sub(A), l = delta.length(); if (l < .0001) return; this.add(dest, kind, this.cube, color, new THREE.Matrix4().compose(A.add(B).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(UP, delta.normalize()), new THREE.Vector3(w, l, h))); }
 cylinder(dest, kind, p, rt, rb, h, color, n = 9) { const g = new THREE.CylinderGeometry(rt, rb, h, n); this.add(dest, kind, g, color, new THREE.Matrix4().makeTranslation(...p)); g.dispose(); }
 finish() { for (const [key, data] of this.parts) { const [dest, kind] = key.split('|'), g = new THREE.BufferGeometry(); for (const [name, a, n] of [['position', data.p, 3], ['normal', data.n, 3], ['uv', data.u, 2], ['color', data.c, 3]]) g.setAttribute(name, new THREE.Float32BufferAttribute(a, n)); g.computeBoundingBox(); g.computeBoundingSphere(); const mesh = new THREE.Mesh(g, this.materials[kind]); mesh.name = 'Grau Vell · contexto · ' + dest + ' · ' + kind; mesh.castShadow = dest !== 'surfaces'; mesh.receiveShadow = true; mesh.userData = { grauContext: true, component: dest, materialKind: kind, terrainConforming: dest === 'surfaces' }; this.groups[dest].add(mesh); this.resources.geometries.push(g); } this.cube.dispose(); }
}

export function createGrauContext({ contextData = {}, project = projectDefault, heightAt = () => 0 } = {}) {
 const group = new THREE.Group(), buildings = new THREE.Group(), surfaces = new THREE.Group(), details = new THREE.Group(), vegetation = new THREE.Group();
 group.name = 'Grau Vell · poblado y entorno'; buildings.name = 'Grau Vell · casas, ermita y colegio'; surfaces.name = 'Grau Vell · Llevant, plaza y acceso litoral'; details.name = 'Grau Vell · fachadas y cubiertas'; vegetation.name = 'Grau Vell · copas observadas'; group.add(buildings, surfaces, details, vegetation);
 const groups = { buildings, surfaces, details, vegetation }, resources = { geometries: [], materials: [], textures: [] }, materials = {};
 for (const kind of ['lime', 'roof', 'sheet', 'paving', 'asphalt', 'gravel', 'brick', 'wood', 'iron', 'glass', 'leaf']) { const textured = ['lime', 'roof', 'sheet', 'paving', 'asphalt', 'gravel', 'brick'].includes(kind), map = textured ? makeTexture(kind) : null; if (map) resources.textures.push(map); const m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, map, bumpMap: map, bumpScale: kind === 'roof' ? .026 : kind === 'gravel' ? .019 : .007, roughness: kind === 'glass' ? .36 : kind === 'iron' ? .64 : .94, metalness: kind === 'iron' ? .48 : 0, side: THREE.DoubleSide }); m.name = 'Grau Vell · contexto · ' + kind; materials[kind] = m; resources.materials.push(m); }
 group.userData.ownedResources = resources;
 const footprints = (contextData.buildings || []).map(record => ({ record, outer: ring(record.coordinates, project), holes: (record.holes || []).map(h => ring(h, project)) }));
 const exclusions = footprints.map(p => p.outer), core = (contextData.coreExclusionPolygons || []).map(p => ring(p, project));
 const excludedBuildingIds = new Set(contextData.excludedBuildingIds || []), excludedRoadIds = new Set(contextData.excludedRoadIds || []), roadReplacements = contextData.roadReplacements || [];
 const roadLines = (contextData.roads || []).map(r => ({ record: r, points: r.coordinates.map(q => project(...q)) }));
 const stats = { ...contextData.stats, modelVersion: 'v32', bindCount: 0 }, qa = { buildings: [], facadeOpenings: [], surfaceSamples: [], trees: [], maskedPieces: 0 };
 let ground = heightAt, disposed = false; const gh = (x, z) => { const v = ground(x, z); return Number.isFinite(v) ? v : 0; };

 function build() {
  for (const g of resources.geometries) g.dispose(); resources.geometries.length = 0; for (const g of Object.values(groups)) g.clear(); qa.buildings = []; qa.facadeOpenings = []; qa.surfaceSamples = []; qa.trees = []; qa.maskedPieces = 0;
  const b = new Batch(resources, groups, materials), allPolygons = [...exclusions, ...core];
  const flat = (dest, kind, outer, holes, height, color, uv = null) => { for (const t of triangles(outer, holes)) b.raw(dest, kind, t.flatMap(p => [p.x, typeof height === 'function' ? height(p) : height, p.z]), color, uv); };
  const faceFor = (p, i) => { const a = p[i], c = p[(i + 1) % p.length], length = Math.hypot(c.x - a.x, c.z - a.z), tx = (c.x - a.x) / length, tz = (c.z - a.z) / length, sign = area(p) >= 0 ? 1 : -1, nx = tz * sign, nz = -tx * sign; return { a, c, length, tx, tz, nx, nz, yaw: -Math.atan2(tz, tx), at: (s, y, depth = 0) => [a.x + tx * s + nx * depth, y, a.z + tz * s + nz * depth] }; };
  const boxOnFace = (f, s, y, depth, w, h, d, kind, color) => b.box('details', kind, f.at(s, y, depth), w, h, d, f.yaw, color);
  const shared = (p, f) => { const q = { x: (f.a.x + f.c.x) / 2 + f.nx * .55, z: (f.a.z + f.c.z) / 2 + f.nz * .55 }; return allPolygons.some(other => other !== p && contains(q, other)); };

  for (const { record: r, outer: p, holes } of footprints) {
   if (p.length < 3) continue;
   const heights = p.map(q => gh(q.x, q.z)).sort((a, c) => a - c), floor = heights[Math.floor(heights.length / 2)] + .05, type = r.roofType, height = r.displayHeightM ?? 3.15;
   if (type === 'open-ground' || r.floors === 0) { qa.buildings.push({ id: r.id, coordinates: r.coordinates, holes: r.holes, floor, top: floor, openGround: true, footprintUnchanged: true }); continue; }
   const top = Math.max(floor + height, heights.at(-1) + (type === 'open-remains' ? .8 : 2.1));
   const faces = p.map((_, i) => { const f = faceFor(p, i), mid = { x: (f.a.x + f.c.x) / 2, z: (f.a.z + f.c.z) / 2 }, near = roadLines.map(v => nearest(mid, v.points)).sort((a, c) => a.distance - c.distance)[0] || { distance: Infinity }, facing = near.point ? (near.point.x - mid.x) * f.nx + (near.point.z - mid.z) * f.nz : 0; return { ...f, i, shared: shared(p, f), score: facing >= -.4 && f.length > 2.5 ? near.distance : Infinity }; });
   const front = Number.isInteger(r.frontEdgeIndex) ? faces[r.frontEdgeIndex] : faces.filter(f => !f.shared).sort((a, c) => a.score - c.score)[0] || faces.slice().sort((a, c) => c.length - a.length)[0];
   for (const f of faces) {
    const openings = [], isFront = f.i === front.i && !f.shared, facade = r.facadeColor || '#e3dfd0';
    if (isFront && type !== 'open-remains' && r.facadeMode !== 'ancillary') {
     if (r.facadeMode === 'chapel') openings.push({ s: f.length / 2, bottom: floor, w: 1.8, h: 2.95, type: 'door' });
     else if (r.facadeMode === 'old-school') {
      const left = f.length * .13; openings.push({ s: left, bottom: floor, w: 1.4, h: 4.6, type: 'school-door' });
      for (let i = 0; i < 6; i++) openings.push({ s: f.length * .28 + (f.length * .64) * i / 5, bottom: floor + 3.65, w: .48, h: 1.42, type: 'school-window' });
      for (const t of [.49, .77]) openings.push({ s: f.length * t, bottom: floor + 1.55, w: .43, h: .36, type: 'window' });
     } else if (f.length > 3.3) {
      const count = clamp(Math.floor(f.length / 3.7), 1, 4);
      for (let i = 0; i < count; i++) { const s = f.length * (i + .5) / count; openings.push({ s, bottom: floor + (i === 0 ? 0 : 1.03), w: i === 0 ? 1.03 : .73, h: i === 0 ? 2.22 : 1.25, type: i === 0 ? 'door' : 'window' }); if (r.floors > 1) openings.push({ s, bottom: floor + 3.66, w: .76, h: 1.25, type: 'window' }); }
     }
    }
    const cuts = [0, f.length]; for (const o of openings) cuts.push(clamp(o.s - o.w / 2, 0, f.length), clamp(o.s + o.w / 2, 0, f.length)); cuts.sort((a, c) => a - c);
    const southSchool = r.facadeMode === 'old-school' && !isFront && f.length < front.length * .8 && (f.a.z + f.c.z) / 2 > (front.a.z + front.c.z) / 2;
    const wallKind = southSchool ? 'brick' : 'lime', wallColor = southSchool ? '#ae6748' : type === 'open-remains' ? '#b5ab91' : facade;
    const wallSection = (lo, hi, bottom, upper) => { if (upper <= bottom + .002 || hi - lo < .002) return; const A = f.at(lo, bottom), C = f.at(hi, bottom), D = f.at(hi, upper), E = f.at(lo, upper); b.raw('buildings', wallKind, area(p) >= 0 ? quad(A, E, D, C) : quad(A, C, D, E), wallColor); };
    for (let i = 1; i < cuts.length; i++) { const lo = cuts[i - 1], hi = cuts[i], mid = (lo + hi) / 2, gaps = openings.filter(o => mid > o.s - o.w / 2 && mid < o.s + o.w / 2).sort((a, c) => a.bottom - c.bottom), groundA = gh(...[f.at(lo, 0)[0], f.at(lo, 0)[2]]) - .15, groundC = gh(...[f.at(hi, 0)[0], f.at(hi, 0)[2]]) - .15, base = Math.max(groundA, groundC); let at = base; for (const o of gaps) { wallSection(lo, hi, at, o.bottom); at = Math.max(at, o.bottom + o.h); } wallSection(lo, hi, at, top); b.raw('buildings', wallKind, quad(f.at(lo, groundA), f.at(lo, base + .005), f.at(hi, base + .005), f.at(hi, groundC)), wallColor); }
    if (!f.shared) {
     b.beam('details', 'lime', f.at(0, top - .06, .025), f.at(f.length, top - .06, .025), .12, .13, '#ece7d8');
     if (type !== 'open-remains') b.beam('details', 'lime', f.at(0, floor + .20, .04), f.at(f.length, floor + .20, .04), .36, .09, '#c9c5b6');
    }
    for (const o of openings) {
     const color = o.type.includes('door') ? '#554b38' : o.type === 'school-window' ? '#526d62' : '#50615b';
     boxOnFace(f, o.s, o.bottom + o.h / 2, -.10, o.w, o.h, .055, o.type.includes('door') ? 'wood' : 'glass', color);
     // Lime reveals make the openings actual recesses instead of printed rectangles.
     for (const sign of [-1, 1]) boxOnFace(f, o.s + sign * (o.w / 2 + .065), o.bottom + o.h / 2, -.015, .13, o.h + .12, .24, 'lime', '#efeadd');
     boxOnFace(f, o.s, o.bottom + o.h + .065, .025, o.w + .26, .13, .24, 'lime', '#efeadd');
     if (!o.type.includes('door')) { boxOnFace(f, o.s, o.bottom - .04, .07, o.w + .27, .11, .30, 'lime', '#d7d2c4'); boxOnFace(f, o.s, o.bottom + o.h / 2, -.054, .035, o.h, .04, 'wood', '#aaa28b'); }
     else { boxOnFace(f, o.s, o.bottom + o.h / 2, -.06, .034, o.h, .04, 'wood', '#8b775a'); for (let y = .35; y < o.h; y += .58) boxOnFace(f, o.s, o.bottom + y, -.05, o.w - .10, .035, .025, 'wood', '#76634b'); }
     qa.facadeOpenings.push({ buildingId: r.id, edgeIndex: f.i, width: o.w, height: o.h, type: o.type, source: r.facadeSource || 'typological-interpretation' });
    }
    if (r.facadeMode === 'old-school' && isFront) {
     for (const y of [floor + 2.48, floor + 3.10]) b.beam('details', 'lime', f.at(0, y, .05), f.at(f.length, y, .05), .10, .13, '#ece8d9');
     boxOnFace(f, f.length / 2, floor + .07, .55, f.length, .14, 1.1, 'lime', '#c6c2b2');
    }
   }

   if (type === 'open-remains') { qa.buildings.push({ id: r.id, coordinates: r.coordinates, holes: r.holes, floor, top, openRemains: true, footprintUnchanged: true }); continue; }
   const origin = { x: (front.a.x + front.c.x) / 2, z: (front.a.z + front.c.z) / 2 }, tangent = { x: front.tx, z: front.tz }, normal = { x: -front.tz, z: front.tx }, local = q => ({ s: (q.x - origin.x) * tangent.x + (q.z - origin.z) * tangent.z, c: (q.x - origin.x) * normal.x + (q.z - origin.z) * normal.z }), locals = p.map(local), minC = Math.min(...locals.map(q => q.c)), maxC = Math.max(...locals.map(q => q.c)), centerC = (minC + maxC) / 2, depth = maxC - minC;
   const planar = ['terrace', 'chapel-flat'].includes(type), shed = ['light-sheet', 'shallow-shed'].includes(type), rise = planar ? 0 : shed ? .30 : clamp(depth * .16, .45, 1.35), roofHeight = q => { const c = local(q).c; return top + (planar ? .07 : shed ? rise * (c - minC) / (depth || 1) : rise * Math.max(0, 1 - Math.abs(c - centerC) / (depth / 2 || 1))); }, roofKind = type === 'chapel-flat' ? 'lime' : planar ? 'paving' : type === 'light-sheet' ? 'sheet' : 'roof';
   const ridgeA = { x: origin.x + normal.x * centerC, z: origin.z + normal.z * centerC }, ridgeB = { x: ridgeA.x + tangent.x, z: ridgeA.z + tangent.z }, uv = v => { const q = local(v); return [q.s / 2.0, q.c / 1.36]; };
   for (const t of triangles(p, holes)) { const halves = planar || shed ? [t] : (() => { const s = split(t, ridgeA, ridgeB, 1); return [s.inside, s.outside]; })(); for (const part of halves) for (let i = 1; i < part.length - 1; i++) b.raw('buildings', roofKind, [part[0], part[i], part[i + 1]].flatMap(q => [q.x, roofHeight(q) + .03, q.z]), r.roofColor || '#b38a6b', uv); }
   for (const outline of [p, ...holes]) for (let i = 0; i < outline.length; i++) { const a = outline[i], c = outline[(i + 1) % outline.length], points = [a], la = local(a).c - centerC, lc = local(c).c - centerC; if (!planar && !shed && la * lc < 0) points.push(lerp(a, c, la / (la - lc))); points.push(c); for (let j = 1; j < points.length; j++) { const A = points[j - 1], C = points[j]; b.raw('buildings', 'lime', quad([A.x, top, A.z], [A.x, roofHeight(A), A.z], [C.x, roofHeight(C), C.z], [C.x, top, C.z]), r.facadeColor || '#e3dfd0'); } if (planar) b.beam('details', 'lime', [a.x, top + .19, a.z], [c.x, top + .19, c.z], .17, .24, '#e7e3d6'); }
   if (!planar && !shed) { const cuts = []; for (const outline of [p, ...holes]) for (let i = 0; i < outline.length; i++) { const a = outline[i], c = outline[(i + 1) % outline.length], A = local(a), C = local(c); if ((A.c - centerC) * (C.c - centerC) < 0) cuts.push(A.s + (C.s - A.s) * (centerC - A.c) / (C.c - A.c)); } cuts.sort((a, c) => a - c); for (let i = 1; i < cuts.length; i++) { const mid = (cuts[i - 1] + cuts[i]) / 2, probe = { x: ridgeA.x + tangent.x * mid, z: ridgeA.z + tangent.z * mid }; if (!contains(probe, p) || holes.some(h => contains(probe, h))) continue; for (let s = cuts[i - 1]; s < cuts[i] - .06; s += .37) { const end = Math.min(cuts[i], s + .39); b.beam('details', 'roof', [ridgeA.x + tangent.x * s, top + rise + .10, ridgeA.z + tangent.z * s], [ridgeA.x + tangent.x * end, top + rise + .10, ridgeA.z + tangent.z * end], .20, .14, '#bc8d68'); } } }

   if (r.facadeMode === 'chapel') {
    const f = front, center = f.length / 2, white = '#eeeadd';
    boxOnFace(f, center, top + .24, .02, f.length, .48, .27, 'lime', white);
    boxOnFace(f, center, top + .72, .02, f.length * .58, .68, .29, 'lime', white);
    boxOnFace(f, center, top + 1.08, .03, f.length * .60, .12, .37, 'lime', '#f1eddf');
    const bottom = top + .82, spring = bottom + .97, inner = .34, outer = .59;
    for (const sign of [-1, 1]) boxOnFace(f, center + sign * (inner + outer) / 2, bottom + .5, .02, outer - inner, 1.00, .30, 'lime', white);
    for (let i = 0; i < 18; i++) { const a = i * Math.PI / 18, c = (i + 1) * Math.PI / 18, p2 = (radius, angle, z) => f.at(center + Math.cos(angle) * radius, spring + Math.sin(angle) * radius, z); b.raw('details', 'lime', quad(p2(inner, a, .18), p2(outer, a, .18), p2(outer, c, .18), p2(inner, c, .18)), white); b.raw('details', 'lime', quad(p2(inner, a, -.13), p2(inner, c, -.13), p2(outer, c, -.13), p2(outer, a, -.13)), white); b.raw('details', 'lime', quad(p2(inner, a, -.13), p2(inner, a, .18), p2(inner, c, .18), p2(inner, c, -.13)), white); }
    b.raw('details', 'lime', [f.at(center - .59, spring + .44, .19), f.at(center + .59, spring + .44, .19), f.at(center, spring + .82, .19)].flat(), white);
    boxOnFace(f, center, spring + .96, .02, .027, .35, .03, 'iron', '#5c655a'); boxOnFace(f, center, spring + 1.02, .02, .19, .025, .03, 'iron', '#5c655a');
    boxOnFace(f, center, bottom + .68, .02, .66, .07, .08, 'iron', '#525747'); b.cylinder('details', 'iron', f.at(center, bottom + .45, .02), .09, .15, .27, '#5b5e47', 12);
    boxOnFace(f, center, floor + 3.70, .18, .07, .75, .06, 'iron', '#4b5149'); boxOnFace(f, center, floor + 3.89, .18, .45, .07, .06, 'iron', '#4b5149');
    // Framed tile panel is acknowledged without fabricating its religious image.
    boxOnFace(f, center - f.length * .29, floor + 2.80, .12, .78, 1.22, .035, 'iron', '#6a6d61'); boxOnFace(f, center - f.length * .29, floor + 2.80, .145, .69, 1.12, .018, 'lime', '#d2d8cf');
   }
   qa.buildings.push({ id: r.id, coordinates: r.coordinates, holes: r.holes, floor, top: top + rise, roofType: type, frontEdge: front.i, footprintUnchanged: true });
  }

  // Surface masks are derived from exact triangles, also for concave parcels.
  const masks = [...footprints.flatMap(p => triangles(p.outer, p.holes)), ...core.flatMap(p => triangles(p))].map(p => ({ polygon: p, bounds: bounds(p) }));
  const masked = poly => { let pieces = [poly]; for (const mask of masks) pieces = pieces.flatMap(p => overlaps(bounds(p), mask.bounds) ? outsideTriangle(p, mask.polygon) : [p]); return pieces; };
  const terrainTriangle = (a, c, d, offset, kind, color, depth = 0) => {
   const points = [a, c, d], heights = points.map(p => gh(p.x, p.z));
   const sides = [[a, c, d], [c, d, a], [d, a, c]].map(q => ({ q, l: Math.hypot(q[0].x - q[1].x, q[0].z - q[1].z) })).sort((a, c) => c.l - a.l);
   // The final terrain is piecewise planar. A street triangle can cross a mesh
   // diagonal even when all its vertices agree with the exact sampler. Test its
   // interior and edge midpoints before accepting it, avoiding terrain bleed.
   let deviation = 0;
   for (const weights of [[1/3,1/3,1/3],[.5,.5,0],[.5,0,.5],[0,.5,.5]]) { const x = points.reduce((s,p,i) => s + p.x * weights[i], 0), z = points.reduce((s,p,i) => s + p.z * weights[i], 0), linear = heights.reduce((s,h,i) => s + h * weights[i], 0); deviation = Math.max(deviation, Math.abs(gh(x,z) - linear)); }
   if ((sides[0].l > 2.2 || deviation > .012 && sides[0].l > .12) && depth < 25) { const [p, q, r] = sides[0].q, mid = lerp(p, q, .5); terrainTriangle(p, mid, r, offset, kind, color, depth + 1); terrainTriangle(mid, q, r, offset, kind, color, depth + 1); return; }
   if (heights.some(y => y < -.12)) return;
   b.raw('surfaces', kind, points.flatMap((p,i) => [p.x, heights[i] + offset, p.z]), color); qa.surfaceSamples.push({ x: (a.x + c.x + d.x) / 3, z: (a.z + c.z + d.z) / 3, offset, kind, interpolationErrorM: deviation });
  };
  const surface = (outer, holes, offset, kind, color) => { for (const t of triangles(outer, holes)) { const pieces = masked(t); qa.maskedPieces += pieces.length; for (const p of pieces) for (let i = 1; i < p.length - 1; i++) terrainTriangle(p[0], p[i], p[i + 1], offset, kind, color); } };
  for (const { record: r, points: p } of roadLines) {
   if (p.length < 2) continue;
   const offsets = p.map((q, i) => { const half = (i === 0 ? r.startWidthM ?? r.widthM ?? 6 : i === p.length - 1 ? r.endWidthM ?? r.widthM ?? 6 : r.nodeWidthsM?.[i] ?? r.widthM ?? 6) / 2, before = p[Math.max(0, i - 1)], after = p[Math.min(p.length - 1, i + 1)], dx = after.x - before.x, dz = after.z - before.z, length = Math.hypot(dx, dz) || 1; return { x: -dz / length * half, z: dx / length * half }; });
   const outline = [...p.map((q, i) => ({ x: q.x + offsets[i].x, z: q.z + offsets[i].z })), ...p.map((q, i) => ({ x: q.x - offsets[i].x, z: q.z - offsets[i].z })).reverse()];
   surface(outline, [], r.material === 'asphalt' ? .058 : .039, r.material || 'asphalt', r.material === 'gravel' ? '#a9a28c' : '#8d9188');
  }
  for (const r of contextData.surfaces || []) surface(ring(r.coordinates, project), (r.holes || []).map(h => ring(h, project)), r.heightOffsetM ?? .065, r.material || 'paving', r.color || '#c3bdab');

  for (const [index, r] of (contextData.trees || []).entries()) {
   const p = project(...r.coordinate), y = gh(p.x, p.z), h = r.heightM || 4.5, radius = r.crownRadiusM || 1.6; if (y < -.12 || core.some(poly => contains(p, poly))) continue;
   if (h > 2) { b.cylinder('vegetation', 'wood', [p.x, y + h * .30, p.z], .07, .14, h * .6, '#887658'); for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + .4; b.beam('vegetation', 'wood', [p.x, y + h * .43, p.z], [p.x + Math.cos(a) * radius * .44, y + h * .66, p.z + Math.sin(a) * radius * .44], .065, .065, '#887658'); } }
   for (let i = 0; i < (h > 2 ? 5 : 3); i++) { const angle = i * Math.PI * 2 / 5, g = new THREE.IcosahedronGeometry(radius * .75, 1), matrix = new THREE.Matrix4().compose(new THREE.Vector3(p.x + Math.cos(angle) * radius * .38, y + h * .72 + (noise(index * 13 + i) - .5) * radius * .20, p.z + Math.sin(angle) * radius * .38), new THREE.Quaternion(), new THREE.Vector3(1, .82, 1)); b.add('vegetation', 'leaf', g, i % 2 ? '#7b8b61' : '#71825a', matrix); g.dispose(); }
   qa.trees.push({ id: r.id, x: p.x, z: p.z, base: y, source: r.source });
  }
  b.finish(); let trianglesCount = 0, meshes = 0; group.traverse(o => { if (o.isMesh) { meshes++; trianglesCount += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3; } });
  Object.assign(stats, { renderedBuildings: qa.buildings.filter(p => !p.openGround).length, openGroundParts: qa.buildings.filter(p => p.openGround).length, facadeOpenings: qa.facadeOpenings.length, renderedTrees: qa.trees.length, meshes, triangles: trianglesCount, terrainConforming: true, footprintPreserved: true, flattenedTerrain: false, waterChanged: false });
 }
 const bindGround = sampler => { if (disposed || typeof sampler !== 'function') return; ground = sampler; stats.bindCount++; build(); };
 const dispose = () => { if (disposed) return; disposed = true; for (const items of Object.values(resources)) for (const item of items) item.dispose(); };
 build();
 const bareBackshore = (contextData.vegetationExclusionPolygons || []).map(p => ring(p, project)), vegetationExclusions = [...exclusions, ...bareBackshore];
 // Applied by the coast integration only to environment.vegetation. The V31
 // environment source, water mesh, shoreline and reflection shader are intact.
 const applyCoastalVegetationMask = target => {
  let removed = 0, retained = 0, meshes = 0;
  if (disposed || !target) return { removed, retained, meshes };
  target.updateWorldMatrix(true, true);
  target.traverse(o => {
   if (!o.isInstancedMesh) return;
   meshes++; const matrix = new THREE.Matrix4(), point = new THREE.Vector3(), color = new THREE.Color(); let next = 0;
   for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, matrix); point.setFromMatrixPosition(matrix).applyMatrix4(o.matrixWorld); if (bareBackshore.some(p => contains({ x: point.x, z: point.z }, p))) { removed++; continue; } if (next !== i) { o.setMatrixAt(next, matrix); if (o.instanceColor) { o.getColorAt(i, color); o.setColorAt(next, color); } } next++; }
   o.count = next; retained += next; o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true; o.computeBoundingBox?.(); o.computeBoundingSphere?.();
  });
  stats.maskedCoastalVegetation = (stats.maskedCoastalVegetation || 0) + removed;
  return { removed, retained, meshes };
 };
 return { group, buildings, architecture: buildings, surfaces, details, vegetation, exclusions, excludedBuildingIds, excludedRoadIds, roadReplacements, vegetationExclusions, patches: [], resources, stats, qa, bindGround, dispose, applyCoastalVegetationMask };
}
