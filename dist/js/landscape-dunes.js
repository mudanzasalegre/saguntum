import * as THREE from 'three';

// Almardà–Corinto–Malvarrosa and Casablanca (Almenara). The coastal vegetation
// envelopes are interpreted from PNOA, not a botanical survey. No dune ridge is
// added to the IGN terrain and no present-day shoreline is inferred from it.
const TAU = Math.PI * 2;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const UP = new THREE.Vector3(0, 1, 0);
function random(seed = 28047) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function inside(p, x, z) { let yes = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i].z > z) !== (p[j].z > z) && x < (p[j].x - p[i].x) * (z - p[i].z) / (p[j].z - p[i].z) + p[i].x) yes = !yes; return yes; }
function box(p, margin = 0) { return { minX: Math.min(...p.map(v => v.x)) - margin, maxX: Math.max(...p.map(v => v.x)) + margin, minZ: Math.min(...p.map(v => v.z)) - margin, maxZ: Math.max(...p.map(v => v.z)) + margin }; }
function segmentDistance(x, z, a, b) { const dx = b.x - a.x, dz = b.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1); return Math.hypot(x - a.x - dx * t, z - a.z - dz * t); }
function spatialIndex(items, size = 40) {
  const grid = new Map();
  for (const item of items) for (let x = Math.floor(item.box.minX / size); x <= Math.floor(item.box.maxX / size); x++) for (let z = Math.floor(item.box.minZ / size); z <= Math.floor(item.box.maxZ / size); z++) {
    const key = `${x},${z}`; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(item);
  }
  return (x, z) => grid.get(`${Math.floor(x / size)},${Math.floor(z / size)}`) || [];
}

// Small procedural templates remain inspectable in CPU QA and do not require
// image assets or a browser canvas. All dimensions below are metres.
class Template {
  constructor() { this.p = []; this.c = []; }
  tri(a, b, c, color) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = ab[1] * ac[2] - ab[2] * ac[1], ny = ab[2] * ac[0] - ab[0] * ac[2], nz = ab[0] * ac[1] - ab[1] * ac[0];
    if (nx * nx + ny * ny + nz * nz < 1e-18) return; // A tapered leaf ends in one vertex.
    this.p.push(...a, ...b, ...c); const v = new THREE.Color(color); for (let i = 0; i < 3; i++) this.c.push(v.r, v.g, v.b);
  }
  geo(g, m, color) {
    const n = g.index ? g.toNonIndexed() : g, p = n.attributes.position, v = new THREE.Vector3(), c = new THREE.Color(color);
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m); this.p.push(v.x, v.y, v.z); this.c.push(c.r, c.g, c.b); }
    if (n !== g) n.dispose();
  }
  finish() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere(); return g; }
}
function blade(b, { angle, height, width, spread, bend, base = [0, 0, 0], color = '#788269', tip = '#c2b88b', folded = false }) {
  const dx = Math.cos(angle), dz = Math.sin(angle), sideX = -dz, sideZ = dx;
  const row = (t, side) => {
    const radius = spread * t + bend * t * t, w = width * (1 - t) * (.45 + .55 * Math.sin(Math.PI * t));
    return [base[0] + dx * radius + sideX * w * side, base[1] + height * (t - .19 * t * t) + (side === 0 && folded ? width * (1 - t) * .36 : 0), base[2] + dz * radius + sideZ * w * side];
  };
  for (let i = 0; i < 3; i++) {
    const t = i / 3, u = (i + 1) / 3, c = new THREE.Color(color).lerp(new THREE.Color(tip), t * .75);
    if (folded) for (const side of [-1, 1]) { b.tri(row(t, side), row(u, side), row(u, 0), c); b.tri(row(t, side), row(u, 0), row(t, 0), c); }
    else { b.tri(row(t, -1), row(u, -1), row(u, 1), c); b.tri(row(t, -1), row(u, 1), row(t, 1), c); }
  }
}
function plantTemplate(kind) {
  const b = new Template(), rnd = random(kind === 'barron' ? 19 : kind === 'grama' ? 57 : kind === 'roseta' ? 93 : 127);
  if (kind === 'barron' || kind === 'grama') {
    const large = kind === 'barron', count = large ? 12 : 8;
    for (let i = 0; i < count; i++) { const angle = i * 2.39996 + rnd() * .45; blade(b, { angle, height: (large ? .64 : .34) + rnd() * (large ? .44 : .32), width: large ? .025 : .020, spread: .08 + rnd() * .20, bend: .08 + rnd() * .25, base: [(rnd() - .5) * .16, 0, (rnd() - .5) * .16], color: large ? '#7b8364' : '#879775', tip: large ? '#c3b88b' : '#c3bf8b', folded: large }); }
  } else if (kind === 'roseta') {
    // A low fleshy/strap-leaf growth form, not a claim of specimen identity.
    for (let i = 0; i < 9; i++) blade(b, { angle: i * TAU / 9, height: .10 + rnd() * .15, width: .045, spread: .27 + rnd() * .10, bend: .04, color: '#7b8d72', tip: '#a6ad8c', folded: true });
  } else {
    // Branches and distinct leaves give small coastal cushions a soft, porous
    // outline; solid faceted spheres would read as stones at pedestrian height.
    for (let i = 0; i < 5; i++) {
      const a = i * 2.39996, r = .13 + rnd() * .20, h = .21 + rnd() * .17;
      const end = new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r), stem = new THREE.CylinderGeometry(.006, .011, end.length(), 4, 1, true);
      b.geo(stem, new THREE.Matrix4().compose(end.clone().multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(UP, end.clone().normalize()), new THREE.Vector3(1, 1, 1)), '#8f977c'); stem.dispose();
      for (let j = 0; j < 8; j++) {
        const root = end.clone().multiplyScalar(.27 + j * .09), angle = a + (j % 2 ? 1 : -1) * (1.0 + rnd() * .6), length = .10 + rnd() * .085, width = .022 + rnd() * .022;
        const tip = root.clone().add(new THREE.Vector3(Math.cos(angle) * length, .035 + rnd() * .045, Math.sin(angle) * length));
        const middle = root.clone().lerp(tip, .53), side = new THREE.Vector3(-Math.sin(angle) * width, 0, Math.cos(angle) * width), left = middle.clone().add(side), right = middle.clone().sub(side), vein = middle.clone().add(new THREE.Vector3(0, .014, 0));
        const color = j % 3 ? '#a0ad91' : '#8e9d82';
        b.tri(root.toArray(), left.toArray(), vein.toArray(), color); b.tri(vein.toArray(), left.toArray(), tip.toArray(), color); b.tri(root.toArray(), vein.toArray(), right.toArray(), color); b.tri(vein.toArray(), tip.toArray(), right.toArray(), color);
      }
    }
  }
  return b.finish();
}
function material(color, options = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .94, ...options }); }
function instances(geometry, mat, points, name, group, shadows = true) {
  if (!points.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, mat, points.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), color = new THREE.Color();
  mesh.name = name;
  points.forEach((p, i) => { if (p.matrix) m.copy(p.matrix); else m.compose(new THREE.Vector3(p.x, p.y, p.z), q.setFromAxisAngle(UP, p.r || 0), new THREE.Vector3(p.sx ?? p.s ?? 1, p.sy ?? p.h ?? p.s ?? 1, p.sz ?? p.s ?? 1)); mesh.setMatrixAt(i, m); if (p.color) color.set(p.color); else color.setRGB(p.tint ?? 1, p.tint ?? 1, p.tint ?? 1); mesh.setColorAt(i, color); });
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = shadows; mesh.receiveShadow = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere(); group.add(mesh); return mesh;
}
function terrainFrame(x, z, dx, dz, heightAt, height, sx, sy, sz) {
  const tangent = new THREE.Vector3(dx, (heightAt(x + dx * .5, z + dz * .5) - heightAt(x - dx * .5, z - dz * .5)), dz).normalize();
  const right = new THREE.Vector3(dz, heightAt(x + dz * .5, z - dx * .5) - heightAt(x - dz * .5, z + dx * .5), -dx).normalize();
  const up = new THREE.Vector3().crossVectors(tangent, right).normalize(); right.crossVectors(up, tangent).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, tangent));
  return new THREE.Matrix4().compose(new THREE.Vector3(x, height, z), q, new THREE.Vector3(sx, sy, sz));
}

export function createDunesLandscape({ heightAt, project, records, data = {} }) {
  const record = records['dunas-almarda'], survey = record.survey;
  // Integration supplies terrain.meshHeightAt after building the common terrain.
  // Plants, gravel and carpentry therefore share the visible surface query.
  const displayHeightAt = heightAt;
  const group = new THREE.Group(), currentGroup = new THREE.Group(), vegetation = new THREE.Group(), details = new THREE.Group();
  group.name = 'Dunas de Almardà · continuidad con Almenara'; currentGroup.name = 'Paisaje litoral contemporáneo'; vegetation.name = 'Vegetación baja de dunas'; details.name = 'Accesos de madera y gravas'; group.add(currentGroup); currentGroup.add(vegetation, details);
  const rnd = random(), masks = survey.vegetationMasks.map(m => ({ ...m, p: m.polygon.map(c => project(...c)), holes: m.holes.map(h => h.map(c => project(...c))) }));
  const buildingQuery = spatialIndex((data.buildings || []).filter(b => b.coordinates?.length > 2).map(b => { const p = b.coordinates.map(c => project(...c)); return { p, box: box(p, 2.2) }; }));
  const roadSegments = [];
  for (const road of data.roads || []) { const p = (road.coordinates || []).map(c => project(...c)), margin = Math.max(1.3, Math.min(12, Number(road.width) || (['path', 'footway', 'pedestrian'].includes(road.kind) ? 2.2 : 5))) / 2 + .8; for (let i = 1; i < p.length; i++) roadSegments.push({ a: p[i - 1], b: p[i], margin, box: box([p[i - 1], p[i]], margin) }); }
  // Include the four detailed accesses even if a caller supplies reduced OSM data.
  for (const walk of survey.boardwalks) { const p = walk.coordinates.map(c => project(...c)); for (let i = 1; i < p.length; i++) roadSegments.push({ a: p[i - 1], b: p[i], margin: walk.widthM / 2 + .55, box: box([p[i - 1], p[i]], walk.widthM / 2 + .55) }); }
  const roadQuery = spatialIndex(roadSegments), shape = data.terrainShape;
  const rejected = { roads: 0, buildings: 0, mask: 0, terrain: 0 };
  const clear = (x, z, mask) => {
    if (!inside(mask.p, x, z) || mask.holes.some(h => inside(h, x, z))) { rejected.mask++; return false; }
    if (shape && ((x - shape.cx) / (shape.rx - 5)) ** 2 + ((z - shape.cz) / (shape.rz - 5)) ** 2 >= 1) { rejected.terrain++; return false; }
    if (roadQuery(x, z).some(r => segmentDistance(x, z, r.a, r.b) < r.margin)) { rejected.roads++; return false; }
    if (buildingQuery(x, z).some(b => inside(b.p, x, z) || b.p.some((a, i) => segmentDistance(x, z, a, b.p[(i + 1) % b.p.length]) < 2.2))) { rejected.buildings++; return false; }
    return true;
  };
  const points = { barron: [], grama: [], mata: [], roseta: [] }, sampleAudit = [], near = project(-.19618, 39.70625), stonePoints = [];
  for (const mask of masks) for (const [ix, iz, coverage] of mask.cells) {
    const step = mask.cellSizeM, cx = ix * step + step / 2, cz = iz * step + step / 2;
    const nearAccess = Math.hypot(cx - near.x, cz - near.z) < 90, count = Math.floor(coverage / 255 * (nearAccess ? 4.1 : 2.55) + rnd());
    for (let i = 0; i < count; i++) {
      const x = cx + (rnd() - .5) * step * .88, z = cz + (rnd() - .5) * step * .88;
      if (!clear(x, z, mask)) continue;
      const ground = displayHeightAt(x, z); if (!Number.isFinite(ground) || ground < -.25 || ground > 8.5) { rejected.terrain++; continue; }
      const choice = rnd(), type = choice < .36 ? 'barron' : choice < .67 ? 'grama' : choice < .92 ? 'mata' : 'roseta';
      const size = .78 + rnd() * .72;
      points[type].push({ x, y: ground - .075, z, r: rnd() * TAU, s: size * (type === 'mata' ? 1.25 : 1), h: .72 + rnd() * .54, tint: .84 + rnd() * .24 });
      sampleAudit.push({ x, z, ground, mask: mask.id, type });
      if (nearAccess && rnd() < .85) for (let j = 0; j < 3; j++) { const xx = x + (rnd() - .5) * 1.6, zz = z + (rnd() - .5) * 1.6; if (clear(xx, zz, mask)) stonePoints.push({ x: xx, y: displayHeightAt(xx, zz) + .015, z: zz, r: rnd() * TAU, sx: .06 + rnd() * .11, sy: .025 + rnd() * .055, sz: .05 + rnd() * .09, color: ['#b1a695', '#76736a', '#cac0ac', '#929187'][Math.floor(rnd() * 4)] }); }
    }
  }
  for (const [type, list] of Object.entries(points)) instances(plantTemplate(type), material('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), list, ({ barron: 'Barrón · hojas plegadas', grama: 'Grama de mar · claros de arena', mata: 'Matas bajas gris verdosas', roseta: 'Rosetas de duna fija' })[type], vegetation, false);
  instances(new THREE.IcosahedronGeometry(1, 0), material('#ffffff'), stonePoints, 'Cantos de playa · distribución interpretativa', details, false);

  const slats = [], bearers = [], screws = [], washers = [], fittings = [], pads = [], walks = [];
  for (const walk of survey.boardwalks) {
    const p = walk.coordinates.map(c => project(...c)); let length = 0;
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], len = Math.hypot(b.x - a.x, b.z - a.z); if (len < .02) continue; length += len;
      const dx = (b.x - a.x) / len, dz = (b.z - a.z) / len, n = Math.ceil(len / .18), pitch = len / n;
      for (let j = 0; j < n; j++) {
        const t = (j + .5) / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = heightAt(x, z) + .095;
        const matrix = terrainFrame(x, z, dx, dz, heightAt, y, walk.widthM, .09, pitch * .92); slats.push({ matrix, tint: .82 + rnd() * .23 });
        // Small, dark fasteners on every fourth plank keep the close view legible.
        if (j % 4 === 0) for (const side of [-1, 1]) { const nail = new THREE.Vector3(side * .39, .55, 0).applyMatrix4(matrix); screws.push({ x: nail.x, y: nail.y + .003, z: nail.z, sx: .012, sy: .008, sz: .012, tint: .82 }); }
      }
      // Short supports extend into the ground to tolerate the display mesh's
      // triangulation. They do not turn a surface access into an elevated bridge.
      const bn = Math.ceil(len / 1.4);
      for (let j = 0; j < bn; j++) for (const side of [-1, 1]) { const t = (j + .5) / bn, x = a.x + (b.x - a.x) * t + dz * side * walk.widthM * .31, z = a.z + (b.z - a.z) * t - dx * side * walk.widthM * .31; bearers.push({ matrix: terrainFrame(x, z, dx, dz, heightAt, heightAt(x, z) - .12, .085, .40, len / bn + .025), tint: .9 + rnd() * .1 }); }
    }
    walks.push({ id: walk.id, lengthM: length, widthM: walk.widthM, coordinates: p });
  }
  for (const item of survey.footwashers) {
    const p = project(...item.coordinate), y = heightAt(p.x, p.z);
    pads.push({ x: p.x, y: y + .025, z: p.z, sx: .68, sy: .10, sz: .68, tint: .95 });
    washers.push({ x: p.x, y: y + .48, z: p.z, sx: .105, sy: .88, sz: .105, tint: .9 });
    for (const h of [.38, .63]) { fittings.push({ x: p.x + .087, y: y + h, z: p.z, sx: .10, sy: .025, sz: .035, tint: .9 }); fittings.push({ x: p.x + .027, y: y + h + .055, z: p.z, sx: .018, sy: .06, sz: .034, tint: .95 }); }
  }
  const cube = new THREE.BoxGeometry(1, 1, 1);
  instances(cube, material('#a28e6d'), slats, 'Pasarelas cartografiadas · tablones', details);
  instances(cube, material('#71604a'), bearers, 'Pasarelas · apoyos cortos', details);
  instances(new THREE.CylinderGeometry(1, 1, 1, 5), material('#4f5754', { roughness: .66, metalness: .4 }), screws, 'Pasarelas · tornillería', details, false);
  instances(cube, material('#a3aaa7', { roughness: .48, metalness: .52 }), washers, 'Lavapiés cartografiados · dos puntos', details);
  instances(cube, material('#9da3a2', { roughness: .4, metalness: .65 }), fittings, 'Lavapiés · grifería aproximada', details);
  instances(cube, material('#bcb7a5'), pads, 'Lavapiés · apoyo', details);

  const p = project(...record.coordinate), point = new THREE.Vector3(p.x, heightAt(p.x, p.z) + 1.2, p.z), focuses = {};
  for (const focus of survey.focalPoints) {
    const c = project(...focus.coordinate), cam = project(...focus.cameraCoordinate), target = project(...focus.targetCoordinate);
    const low = focus.id === 'pasarela' || focus.id === 'barron' || focus.id === 'microrreserva' || focus.id === 'casablanca';
    focuses[focus.id] = { label: focus.label, note: focus.note, point: new THREE.Vector3(c.x, heightAt(c.x, c.z) + .65, c.z), offset: focus.offset,
      ...(low ? { position: new THREE.Vector3(cam.x, heightAt(cam.x, cam.z) + focus.cameraHeight, cam.z), target: new THREE.Vector3(target.x, heightAt(target.x, target.z) + focus.targetHeight, target.z) } : {}),
      bounds: new THREE.Box3(new THREE.Vector3(c.x - 70, Math.min(0, heightAt(c.x, c.z)), c.z - 70), new THREE.Vector3(c.x + 70, heightAt(c.x, c.z) + 12, c.z + 70)) };
  }
  group.updateMatrixWorld(true);
  let triangles = 0, meshes = 0; group.traverse(o => { if (o.isMesh) { meshes++; triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
  const stats = { meshes, triangles, plantClumps: Object.fromEntries(Object.entries(points).map(([k, v]) => [k, v.length])), vegetationCells: masks.reduce((n, m) => n + m.cells.length, 0), duneMasks: masks.length, boardwalks: walks.length, boardwalkLengthM: Math.round(walks.reduce((n, w) => n + w.lengthM, 0) * 10) / 10, slats: slats.length, mappedFootwashers: washers.length, pebbleInstances: stonePoints.length, rejected, interpretation: 'Low plants, individual pebbles and construction details are visual interpretation. No invented dune elevation, specimen inventory or post-2026 shoreline survey.' };
  const site = { id: record.id, group, currentGroup, vegetation, point, views: { offset: [1050, 1400, 1750], closeOffset: [200, 170, 260] }, focuses, patches: [], exclusions: [], vegetationExclusions: masks.map(m => m.p), excludedRoadIds: survey.boardwalks.map(w => w.id), waterPolygons: survey.waterPolygons || [], stats, walks,
    // Compact audit data: one entry per displayed clump, used for spatial QA.
    vegetationSamples: sampleAudit, reservePolygon: survey.reserve.polygon.map(c => project(...c)) };
  group.userData = { siteId: record.id, evidence: 'PNOA envelopes + IGN MDT05 + OSM accesses + primary ecological documentation', noVerticalExaggeration: true };
  return { group, sites: { [record.id]: site } };
}
