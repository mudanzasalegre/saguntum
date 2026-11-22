import fs from 'node:fs';
import * as THREE from 'three';
import { createGrauContext } from '../../dist/js/grau-context.js';
import { createHeightSampler } from '../../dist/js/terrain.js';

const read = name => JSON.parse(fs.readFileSync('dist/assets/data/' + name + '.json', 'utf8'));
const data = read('grau-context'), source = read('coast-grau').sites[0], cartography = read('coast-cartography');
const project = (lon, lat) => ({ x: (lon + .278) * 111320 * Math.cos(39.679 * Math.PI / 180), z: (39.679 - lat) * 111320 });
const ground = createHeightSampler(read('coast-elevation'));
const checks = [], assert = (value, name, detail) => checks.push({ pass: !!value, name, ...(detail ? { detail } : {}) });
const area = p => Math.abs(p.reduce((v, a, i) => { const c = p[(i + 1) % p.length]; return v + a.x * c.z - c.x * a.z; }, 0) / 2);
const pointIn = (p, poly) => { let yes = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) yes = !yes; } return yes; };
const length = points => points.slice(1).reduce((v, p, i) => { const a = project(...points[i]), b = project(...p); return v + Math.hypot(a.x - b.x, a.z - b.z); }, 0);
const originals = source.structures.filter(s => !s.id.startsWith('6910216YJ3961S') && !s.id.startsWith('6910203YJ3961S'));
assert(originals.length === 51 && data.buildings.length === 57, '51 cadastral parts and 6 OSM ancillary envelopes');
assert(originals.every(p => { const q = data.buildings.find(r => r.id === p.id); return q && JSON.stringify(q.coordinates) === JSON.stringify(p.polygon) && JSON.stringify(q.holes) === JSON.stringify(p.holes || []); }), 'Every cadastral footprint and hole is byte-equivalent to source coordinates');
assert(source.ancillaryBuildings.every(p => JSON.stringify(data.buildings.find(q => q.sourceId === p.id)?.coordinates) === JSON.stringify(p.polygon)), 'Every ancillary OSM footprint is retained');
assert(data.buildings.every(p => !p.id.startsWith('6910216YJ3961S') && !p.id.startsWith('6910203YJ3961S')), 'Fortín core parcels are not duplicated');
assert(data.roadReplacements.every(r => !read('pantalan-context').roadReplacements.some(p => p.sourceId === r.sourceId)), 'Road replacement IDs are disjoint from V31 pantalán context');
const roadPartitions = data.roadReplacements.map(r => { const original = cartography.roads.find(p => p.id === r.sourceId), owned = data.roads.filter(p => p.sourceId === r.sourceId), total = owned.reduce((s, p) => s + length(p.coordinates), 0) + r.segments.reduce((s, p) => s + length(p), 0), originalLength = length(original.coordinates); return { sourceId: r.sourceId, originalLength, partitionLength: total, errorM: Math.abs(originalLength - total) }; });
assert(roadPartitions.every(r => r.errorM < .0001), 'All original road centerlines partition into owned and retained lengths without loss', roadPartitions);

const model = createGrauContext({ contextData: data, project, heightAt: ground });
let nonfinite = 0, zeroNormals = 0, degenerate = 0, roofArea = 0, surfaceError = 0;
model.group.traverse(o => {
 if (!o.isMesh) return;
 for (const a of Object.values(o.geometry.attributes)) for (const v of a.array) if (!Number.isFinite(v)) nonfinite++;
 const p = o.geometry.attributes.position, n = o.geometry.attributes.normal;
 for (let i = 0; i < n.count; i++) if (Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) < .8) zeroNormals++;
 for (let i = 0; i < p.count; i += 3) {
  const a = new THREE.Vector3().fromBufferAttribute(p, i), b = new THREE.Vector3().fromBufferAttribute(p, i + 1), c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
  if (b.clone().sub(a).cross(c.clone().sub(a)).lengthSq() < 1e-14) degenerate++;
  if (o.userData.component === 'buildings' && ['roof', 'paving', 'sheet', 'lime'].includes(o.userData.materialKind)) roofArea += Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) / 2;
 }
 if (o.userData.component === 'surfaces') { const offset = o.userData.materialKind === 'asphalt' ? .058 : o.userData.materialKind === 'gravel' ? .039 : .065; for (let i = 0; i < p.count; i++) surfaceError = Math.max(surfaceError, Math.abs(p.getY(i) - ground(p.getX(i), p.getZ(i)) - offset)); }
});
assert(nonfinite === 0 && zeroNormals === 0 && degenerate === 0, 'Geometry has finite attributes, nonzero normals and no degenerate triangles', { nonfinite, zeroNormals, degenerate });
const expectedRoofArea = data.buildings.filter(p => !['open-ground', 'open-remains'].includes(p.roofType) && p.floors !== 0).reduce((sum, p) => sum + area(p.coordinates.map(q => project(...q))) - (p.holes || []).reduce((v, h) => v + area(h.map(q => project(...q))), 0), 0);
assert(Math.abs(roofArea - expectedRoofArea) < .15, 'Projected roof area exactly covers the source footprints and leaves open parcels unroofed', { expectedRoofArea, renderedRoofArea: roofArea, errorM2: roofArea - expectedRoofArea });
assert(surfaceError < .005, 'All surface vertices sit on the supplied terrain sampler', { worstErrorM: surfaceError });
assert(model.patches.length === 0, 'No context flattening patch exists');
assert(model.vegetationExclusions.length === model.exclusions.length + 1, 'PNOA bare-backshore mask excludes generic trees without modifying the water or terrain');
const blockedTrees = data.trees.filter(t => data.buildings.some(b => !['open-ground', 'open-remains'].includes(b.roofType) && pointIn(project(...t.coordinate), b.coordinates.map(q => project(...q)))));
assert(blockedTrees.length === 0, 'Individually mapped trees avoid enclosed building footprints', blockedTrees);
assert(model.qa.facadeOpenings.filter(o => o.buildingId === '6910905YJ3961S_part2' && o.type === 'school-window').length === 6, 'Six dated photographic upper windows distinguish the former school');
assert(model.qa.buildings.find(b => b.id === '6809504YJ3961S_part1')?.roofType === 'chapel-flat', 'Chapel is flat-roofed, matching the photograph and PNOA');

// Instanced coastal scrub belongs to the environment, which is kept byte-identical.
// Check the integration mask with a transformed parent and different instance colours.
const target = new THREE.Group(), parent = new THREE.Group(); parent.position.set(100, 0, -50); parent.add(target);
const geometry = new THREE.BoxGeometry(), material = new THREE.MeshBasicMaterial(), scrub = new THREE.InstancedMesh(geometry, material, 3), matrix = new THREE.Matrix4(), outside = project(-.2414, 39.6349), inside = project(-.2395, 39.63385);
for (const [i, q] of [inside, outside, inside].entries()) { scrub.setMatrixAt(i, matrix.makeTranslation(q.x - 100, 1, q.z + 50)); scrub.setColorAt(i, new THREE.Color(['#ff0000', '#00ff00', '#0000ff'][i])); }
target.add(scrub); const masked = model.applyCoastalVegetationMask(target), keptColor = new THREE.Color(); scrub.getColorAt(0, keptColor); scrub.getMatrixAt(0, matrix);
assert(masked.removed === 2 && masked.retained === 1 && scrub.count === 1 && keptColor.getHex() === 0x00ff00 && Math.abs(matrix.elements[12] + 100 - outside.x) < .001 && !!scrub.boundingBox && !!scrub.boundingSphere, 'Coastal-vegetation mask compacts world-positioned matrices, colours, counts and bounds');
assert(model.applyCoastalVegetationMask(target).removed === 0 && model.stats.maskedCoastalVegetation === 2, 'Coastal-vegetation masking is idempotent and reports its own count');
geometry.dispose(); material.dispose();

const originalGeometry = [...model.resources.geometries], previousFloor = model.qa.buildings[0].floor;
let reboundDisposed = 0; for (const g of originalGeometry) g.addEventListener('dispose', () => reboundDisposed++);
model.bindGround((x, z) => ground(x, z) + 1.75 + .003 * (x - 3200));
assert(reboundDisposed === originalGeometry.length && model.resources.geometries.every(g => !originalGeometry.includes(g)), 'Final terrain rebinding disposes and replaces every prior geometry');
assert(model.qa.buildings[0].floor > previousFloor + 1.5 && model.stats.bindCount === 1, 'Architecture is rebound together with roads and vegetation');
const other = createGrauContext({ contextData: data, project, heightAt: ground });
assert(model.resources.materials.every(m => !other.resources.materials.includes(m)) && model.resources.textures.every(t => !other.resources.textures.includes(t)), 'Instances own separate materials and textures');
let disposalCount = 0; const count = Object.values(model.resources).reduce((n, a) => n + a.length, 0); for (const items of Object.values(model.resources)) for (const item of items) item.addEventListener('dispose', () => disposalCount++); model.dispose(); model.dispose();
assert(disposalCount === count, 'dispose is idempotent and releases all currently owned resources', { count, disposalCount });
other.dispose();

const report = { pass: checks.every(c => c.pass), checks, stats: model.stats, evidence: 'Exact Three.js geometry and source-data checks; not a browser/WebGL render. V31 water source hashes are checked by the integrated coast validation.' };
fs.writeFileSync('research/validation-v32/grau-context-qa.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: report.pass, checks: checks.length, failures: checks.filter(c => !c.pass), stats: report.stats }, null, 2));
if (!report.pass) process.exitCode = 1;
