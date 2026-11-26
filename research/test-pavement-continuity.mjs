// Inspect the actual exported Three.js pavement, including adaptive T-junctions.
// Export with research/validation-v47/export-urban-geometry.mjs, then run:
// node research/test-pavement-continuity.mjs --geometry /path/scene.json.gz [--json /path/report.json]
// No browser, production writes or synthetic replacement geometry are involved.
import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';

const argument = name => {const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1];};
const geometryFile = argument('--geometry');
if (!geometryFile) throw Error('--geometry requires an exported Three.js .json.gz path');
const data = JSON.parse(gunzipSync(fs.readFileSync(geometryFile)));
const xyTolerance = .000025, heightTolerance = .001, cellSize = 1;
const components = new Map();
function decode(value) {
  if (!value) return null;
  const bytes = Buffer.from(value.data, 'base64');
  return new globalThis[value.type](bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}
function transformed(values, i, m) {
  const x = values[3 * i], y = values[3 * i + 1], z = values[3 * i + 2];
  return {x: m[0] * x + m[4] * y + m[8] * z + m[12],
    y: m[1] * x + m[5] * y + m[9] * z + m[13],
    z: m[2] * x + m[6] * y + m[10] * z + m[14]};
}
for (const mesh of data.meshes) {
  if (mesh.material.kind !== 'paving' || !/^(santa-maria-(cavallers|sagrario|cervantes)|plaza-.+)$/.test(mesh.component || '')) continue;
  const positions = decode(mesh.positions), index = decode(mesh.indices);
  const count = index?.length ?? positions.length / 3;
  for (const component of [mesh.component, 'all-public-pavement']) {
  let part = components.get(component);
  if (!part) {part = {vertices: [], xy: new Map(), edges: new Map(), triangles: 0}; components.set(component, part);}
  function vertex(p) {
    const key = Math.round(p.x / xyTolerance) + ',' + Math.round(p.z / xyTolerance);
    let v = part.xy.get(key);
    if (!v) {v = {...p, low: p.y, high: p.y, count: 0, id: part.vertices.length}; part.xy.set(key, v); part.vertices.push(v);}
    v.low = Math.min(v.low, p.y); v.high = Math.max(v.high, p.y); v.count++;
    return v;
  }
  for (let i = 0; i < count; i += 3) {
    const p = [0, 1, 2].map(j => transformed(positions, index ? index[i + j] : i + j, mesh.matrix));
    const determinant = (p[1].x - p[0].x) * (p[2].z - p[0].z) - (p[1].z - p[0].z) * (p[2].x - p[0].x);
    if (Math.abs(determinant) < 1e-9) continue;
    part.triangles++;
    const vertices = p.map(vertex);
    for (let j = 0; j < 3; j++) {
      const a = vertices[j], b = vertices[(j + 1) % 3];
      if (a.id === b.id) continue;
      const key = Math.min(a.id, b.id) + ',' + Math.max(a.id, b.id);
      if (!part.edges.has(key)) part.edges.set(key, {a, b});
    }
  }
  }
}

const results = [];
for (const [component, part] of components) {
  const grid = new Map();
  for (const v of part.vertices) {
    const key = Math.floor(v.x / cellSize) + ',' + Math.floor(v.z / cellSize);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(v);
  }
  const unequalVertices = part.vertices.filter(v => v.high - v.low > heightTolerance)
    .map(v => ({x: v.x, z: v.z, minY: v.low, maxY: v.high, spreadM: v.high - v.low, incidentVertices: v.count}));
  unequalVertices.sort((a, b) => b.spreadM - a.spreadM);
  let junctions = 0, maxJunctionGap = 0;
  const unequalJunctions = [];
  for (const {a, b} of part.edges.values()) {
    const dx = b.x - a.x, dz = b.z - a.z, squaredLength = dx * dx + dz * dz, length = Math.sqrt(squaredLength);
    if (length < 4 * xyTolerance) continue;
    const loX = Math.floor((Math.min(a.x, b.x) - xyTolerance) / cellSize), hiX = Math.floor((Math.max(a.x, b.x) + xyTolerance) / cellSize);
    const loZ = Math.floor((Math.min(a.z, b.z) - xyTolerance) / cellSize), hiZ = Math.floor((Math.max(a.z, b.z) + xyTolerance) / cellSize);
    for (let cx = loX; cx <= hiX; cx++) for (let cz = loZ; cz <= hiZ; cz++) {
      for (const v of grid.get(cx + ',' + cz) || []) {
        if (v === a || v === b) continue;
        const ux = v.x - a.x, uz = v.z - a.z;
        const t = (ux * dx + uz * dz) / squaredLength;
        if (t * length < 2 * xyTolerance || (1 - t) * length < 2 * xyTolerance) continue;
        if (Math.abs(ux * dz - uz * dx) / length > xyTolerance) continue;
        junctions++;
        const edgeY = a.y + t * (b.y - a.y);
        const gap = Math.max(Math.abs(v.low - edgeY), Math.abs(v.high - edgeY));
        maxJunctionGap = Math.max(maxJunctionGap, gap);
        if (gap > heightTolerance) unequalJunctions.push({x: v.x, z: v.z, vertexY: [v.low, v.high], edgeY, gapM: gap,
          edge: [[a.x, a.y, a.z], [b.x, b.y, b.z]]});
      }
    }
  }
  unequalJunctions.sort((a, b) => b.gapM - a.gapM);
  results.push({component, triangles: part.triangles, uniqueXYVertices: part.vertices.length, edges: part.edges.size,
    unequalHeightVertices: unequalVertices.length, maximumSharedVertexGapM: unequalVertices[0]?.spreadM || 0,
    checkedTJunctions: junctions, unequalTJunctions: unequalJunctions.length, maximumTJunctionGapM: maxJunctionGap,
    worstSharedVertices: unequalVertices.slice(0, 8), worstTJunctions: unequalJunctions.slice(0, 8)});
}
const pass = components.has('santa-maria-cavallers') && components.has('plaza-pavimento') &&
  results.every(r => !r.unequalHeightVertices && !r.unequalTJunctions);
const report = {pass, geometryFile, tolerances: {xyM: xyTolerance, heightM: heightTolerance}, results,
  notes: [
    'One millimetre is a mesh-continuity tolerance, not a survey-accuracy claim.',
    'Coincident X/Z vertices must have the same height. A vertex inside a longer neighboring edge must match that edge interpolation.',
    'T-junctions on a continuous plane are accepted. Displaced T-junctions and per-triangle height offsets fail.',
    'Santa María and Plaza Mayor public pavement components are checked independently and together, so cross-ownership seams are included.',
    'Intentional stone stair risers and private portico floors are excluded.'
  ]};
const jsonFile = argument('--json');
if (jsonFile) {fs.mkdirSync(path.dirname(path.resolve(jsonFile)), {recursive: true}); fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2) + '\n');}
console.log(JSON.stringify({pass, results: results.map(({worstSharedVertices, worstTJunctions, ...summary}) => summary)}, null, 2));
if (!pass) process.exitCode = 1;
