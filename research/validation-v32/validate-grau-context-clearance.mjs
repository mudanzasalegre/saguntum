// Rebuild the context against the exact terrain mesh exported by production QA.
// Probe interiors, not just vertices: triangles crossing a terrain-grid diagonal
// previously bled through by as much as 11cm near the fortín approach.
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { createGrauContext } from '../../dist/js/grau-context.js';
import { createHeightSampler } from '../../dist/js/terrain.js';

const path = process.argv[2] || 'research/validation-v32/grau-poblado-current-geometry.json.gz';
const scene = JSON.parse(zlib.gunzipSync(fs.readFileSync(path)));
const terrain = scene.meshes.find(m => m.name === 'Costa · terreno IGN');
const decode = d => { if (!d) return null; const raw = Buffer.from(d.data, 'base64'), bytes = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength), Type = { Float32Array, Uint32Array, Uint16Array }[d.type]; return new Type(bytes); };
const p = decode(terrain.positions), indices = decode(terrain.indices) || Array.from({ length: p.length / 3 }, (_, i) => i), grid = new Map(), size = 5;
for (let k = 0; k < indices.length; k += 3) { const tri = Array.from(indices.slice(k, k + 3), i => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]), xs = tri.map(p => p[0]), zs = tri.map(p => p[2]); for (let x = Math.floor(Math.min(...xs) / size); x <= Math.floor(Math.max(...xs) / size); x++) for (let z = Math.floor(Math.min(...zs) / size); z <= Math.floor(Math.max(...zs) / size); z++) { const key = x + ',' + z; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(tri); } }
function exactHeight(x, z) { for (const [a, b, c] of grid.get(Math.floor(x / size) + ',' + Math.floor(z / size)) || []) { const den = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]); if (Math.abs(den) < 1e-10) continue; const u = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / den, v = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / den, w = 1 - u - v; if (Math.min(u, v, w) >= -1e-7) return a[1] * u + b[1] * v + c[1] * w; } return null; }
const data = JSON.parse(fs.readFileSync('dist/assets/data/grau-context.json')), fallback = createHeightSampler(JSON.parse(fs.readFileSync('dist/assets/data/coast-elevation.json')));
const model = createGrauContext({ contextData: data, heightAt: (x, z) => exactHeight(x, z) ?? fallback(x, z) });
const weights = [[1/3,1/3,1/3],[.5,.5,0],[.5,0,.5],[0,.5,.5],[.25,.25,.5],[.25,.5,.25],[.5,.25,.25],[.75,.125,.125],[.125,.75,.125],[.125,.125,.75]];
let samples = 0, minimumClearanceM = Infinity; const penetrations = [];
model.surfaces.traverse(o => { if (!o.isMesh) return; const pos = o.geometry.attributes.position; for (let i = 0; i < pos.count; i += 3) for (const w of weights) { const x = w.reduce((v, q, j) => v + pos.getX(i + j) * q, 0), y = w.reduce((v, q, j) => v + pos.getY(i + j) * q, 0), z = w.reduce((v, q, j) => v + pos.getZ(i + j) * q, 0), h = exactHeight(x, z); if (h === null) continue; samples++; const clearance = y - h; minimumClearanceM = Math.min(minimumClearanceM, clearance); if (clearance < .002 && penetrations.length < 20) penetrations.push({ triangle: i / 3, x, z, clearance, material: o.userData.materialKind }); } });
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const result = { pass: penetrations.length === 0 && samples > 1000, samples, minimumClearanceM, penetrations, terrainExport: path, terrainExportSha256: hash(path), contextSourceSha256: hash('dist/js/grau-context.js'), contextDataSha256: hash('dist/assets/data/grau-context.json'), stats: model.stats, method: 'Rebuilt context against exported exact production terrain, with ten barycentric probes per surface triangle.' };
fs.writeFileSync('research/validation-v32/grau-context-clearance-qa.json', JSON.stringify(result, null, 2) + '\n'); model.dispose();
console.log(JSON.stringify(result, null, 2)); if (!result.pass) process.exitCode = 1;
