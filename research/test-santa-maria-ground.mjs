// Regression for the artificial earth bank between Santa María and Cavallers.
// Uses the shipped Three.js models and both real elevation pipelines; no browser.
// node research/test-santa-maria-ground.mjs [--json /absolute/report.json]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {registerThreeTestLoader} from './three-test-loader.mjs';

registerThreeTestLoader();
const root = fileURLToPath(new URL('../', import.meta.url));
const asset = name => path.join(root, 'dist/assets', name);
const read = name => JSON.parse(fs.readFileSync(asset(name), 'utf8'));
const [THREE, terrain, churchModule, contextModule, urbanModule, reliefModule, coords, catalogue] =
  await Promise.all([
    import('three'), import('../dist/js/terrain.js'), import('../dist/js/santa-maria.js'),
    import('../dist/js/santa-maria-context.js'), import('../dist/js/urban-surface.js'),
    import('../dist/js/territory-heritage-relief.js'), import('../dist/js/territory-coordinates.js'),
    import('../dist/js/territory-heritage-catalog.js')
  ]);

// Canvas textures do not affect metric geometry. Match the repository's CPU QA.
const canvasContext = new Proxy({}, {get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => (o[k] = v, true)});
globalThis.document = {
  createElement: () => ({width: 256, height: 256, getContext: () => canvasContext}),
  querySelector: () => ({checked: true})
};

const elevation = read('data/elevation.json');
const data = read('data/cartography.json');
const landmarks = Object.fromEntries(read('data/landmarks.json').sites.map(s => [s.id, s]));
const record = landmarks['santa-maria'];
const visitData = read('data/santa-maria-visit.json');
const contextData = read('data/santa-maria-context.json');
const sourceFootprints = JSON.stringify([record.footprint, contextData.buildings.map(b => [b.id, b.coordinates, b.holes])]);
const checks = [], failures = [];
const check = (pass, label, detail) => {
  checks.push({pass: !!pass, label, ...(detail === undefined ? {} : {detail})});
  if (!pass) failures.push(label);
};
const round = n => Math.round(n * 1e6) / 1e6;
const publicPoint = p => ({x: round(p.x), z: round(p.z)});
const hasPoint = (p, ring) => urbanModule.pointInPolygon(p.x, p.z, ring);

function build(sample) {
  const church = churchModule.createSantaMaria({record, project: catalogue.atlasProject, heightAt: sample, visitData});
  const context = contextModule.createSantaMariaContext({
    data, landmarks, project: catalogue.atlasProject, heightAt: sample,
    churchFrame: church.frame, contextData
  });
  const patches = [...context.patches, ...church.patches];
  const surface = order => urbanModule.createUrbanSurface({data: {}, heightAt: sample, patches: order}).groundHeight;
  return {church, context, patches, sample, forward: surface(patches), reverse: surface([...patches].reverse())};
}

function pointsFor(model) {
  const points = [];
  const stair = model.context.qa.northStair.footprint;
  for (let z = -29.5; z <= 16; z += .25) {
    for (let x = 19.25; x <= 28.5; x += .25) {
      const p = model.church.frame.toWorld(x, z);
      // Exclude actual solid masonry and the stairs, not their adjacent street.
      if (hasPoint(p, model.church.patch.polygon) || urbanModule.polygonDistance(p.x, p.z, stair) < .5) continue;
      points.push({x, z, p});
    }
  }
  return points;
}

function measure(model, sample, points) {
  let highest = {delta: -Infinity}, steepest = {slope: 0};
  for (const {x, z, p} of points) {
    const y = sample(p.x, p.z), raw = model.sample(p.x, p.z), delta = y - raw;
    if (delta > highest.delta) highest = {delta, local: [x, z], world: publicPoint(p), y, raw};
    for (const [dx, dz] of [[.25, 0], [0, .25]]) {
      const q = model.church.frame.toWorld(x + dx, z + dz);
      if (hasPoint(q, model.church.patch.polygon) || urbanModule.polygonDistance(q.x, q.z, model.context.qa.northStair.footprint) < .5) continue;
      const slope = Math.abs(sample(q.x, q.z) - y) / .25;
      if (slope > steepest.slope) steepest = {slope, local: [x, z], world: publicPoint(p)};
    }
  }
  return {samples: points.length, highestAboveMDT: highest, steepest};
}

function floorChecks(model, label) {
  const {church} = model, visit = church.group.userData.visit, floors = [];
  church.group.traverse(o => {if (o.isMesh && o.userData.component === 'pavimento') floors.push(o);});
  church.group.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(), results = [];
  for (const section of [false, true]) {
    visit.setSection(section);
    for (const point of visit.qa.floorSamples) {
      ray.set(new THREE.Vector3(point[0], point[1] + .5, point[2]), new THREE.Vector3(0, -1, 0));
      ray.far = 1;
      const hit = ray.intersectObjects(floors, false).find(h => h.object.visible);
      results.push({section, point, hitY: hit?.point.y ?? null, error: hit ? Math.abs(hit.point.y - point[1]) : null});
    }
  }
  visit.setSection(false);
  check(results.every(r => r.error !== null && r.error < .015), label + ': church floor stays continuous in normal and sectional views', results);
  return results;
}

function pavementChecks(model, label, finalGround) {
  model.context.bindGround(finalGround);
  model.context.group.updateMatrixWorld(true);
  const pavements = [];
  model.context.group.traverse(o => {
    if (o.isMesh && o.userData.component === 'santa-maria-cavallers' && o.userData.materialKind === 'paving') pavements.push(o);
  });
  const ray = new THREE.Raycaster(), rows = [];
  for (const patch of model.context.patches.filter(p => p.id?.startsWith('santa-maria-cavallers-'))) {
    const p = patch.polygon.reduce((s, q) => ({x: s.x + q.x / patch.polygon.length, z: s.z + q.z / patch.polygon.length}), {x: 0, z: 0});
    const expected = model.sample(p.x, p.z) + .13;
    ray.set(new THREE.Vector3(p.x, expected + 2, p.z), new THREE.Vector3(0, -1, 0));
    ray.far = 3;
    const hit = ray.intersectObjects(pavements, false)[0];
    rows.push({id: patch.id, world: publicPoint(p), expected, actual: hit?.point.y ?? null, error: hit ? Math.abs(hit.point.y - expected) : null});
  }
  check(rows.length > 8 && rows.every(r => r.error !== null && r.error < .16), label + ': finished Cavallers paving follows the documented ground on both flanks', rows);
  return rows;
}

function stairChecks(model, label, finalGround) {
  const rows = [];
  for (const tread of model.context.qa.stairSurfaces) {
    const local = model.church.frame.toLocal(tread.x, tread.z);
    for (const offset of [-1.5, 0, 1.5]) {
      const p = model.church.frame.toWorld(local.x + offset, local.z);
      const ground = finalGround(p.x, p.z);
      rows.push({flight: tread.flight, local: [local.x + offset, local.z], tread: tread.y, ground, clearance: tread.y - ground});
    }
  }
  const worst = rows.reduce((a, b) => a.clearance < b.clearance ? a : b);
  check(rows.length > 0 && rows.every(row => row.clearance >= -.015), label + ': terrain does not pierce the north stair treads across their full width', {samples: rows.length, minimumClearanceM: worst.clearance, worst});
  return rows;
}

const atlasRaw = terrain.createHeightSampler(elevation);
const atlas = build(atlasRaw), atlasPoints = pointsFor(atlas);
// Include the overlapping strip under the wall: this is where the old order
// dependence raised the north apron by more than four metres.
const overlapPoints = [];
for (let z = -29; z <= 15; z += .25) for (let x = 18.75; x <= 27; x += .25) overlapPoints.push(atlas.church.frame.toWorld(x, z));
const maxOrderDifference = Math.max(...overlapPoints.map(p => Math.abs(atlas.forward(p.x, p.z) - atlas.reverse(p.x, p.z))));
check(maxOrderDifference < 1e-8, 'Atlas: reversing foundation and street patches gives identical heights', {samples: overlapPoints.length, maximumDifferenceM: maxOrderDifference});
const atlasAnalytical = measure(atlas, atlas.forward, atlasPoints);
check(atlasAnalytical.highestAboveMDT.delta < .15, 'Atlas: no artificial bank rises above MDT outside the church and stairs', atlasAnalytical);
const mesh = terrain.buildTerrainGeometry(elevation, atlas.forward, atlas.patches);
const atlasTriangulated = measure(atlas, mesh.meshHeightAt, atlasPoints);
check(atlasTriangulated.highestAboveMDT.delta < .2, 'Atlas rendered terrain: no raised bank after foundation vertex accommodation', atlasTriangulated.highestAboveMDT);
check(atlasTriangulated.steepest.slope < 1.5, 'Atlas rendered terrain: street outside stairs has no abrupt multi-metre cliff', atlasTriangulated.steepest);
const atlasPaving = pavementChecks(atlas, 'Atlas', mesh.meshHeightAt);
const atlasStairs = stairChecks(atlas, 'Atlas', mesh.meshHeightAt);
floorChecks(atlas, 'Atlas');

// Load the exact compressed/reprojected MDT used by the territorial renderer.
function raster(meta, compressed = false) {
  let bytes = fs.readFileSync(asset('territory/' + (meta.file || meta.heights)));
  if (compressed) bytes = gunzipSync(bytes);
  const values = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  if (compressed) for (let j = 0; j < meta.height; j++) for (let i = 1; i < meta.width; i++) values[j * meta.width + i] += values[j * meta.width + i - 1];
  return {...meta, data: values};
}
const territoryMeta = read('territory/world.json').terrain;
const regionalMeta = read('territory/atlas-relief/index.json').find(g => g.region === 'sagunto');
const territorialRaw = coords.terrainSampler({base: raster(territoryMeta), detail: raster(territoryMeta.detail), regional: [raster(regionalMeta, true)]});
const projected = coords.project(...record.coordinate);
const place = {...projected, lon: record.coordinate[0], lat: record.coordinate[1]};
const frame = catalogue.registerFrame(place, coords.project);
const nativeRaw = (x, z) => {const p = frame.world(x, z); return territorialRaw(p.x, p.z);};
const native = build(nativeRaw), nativePoints = pointsFor(native);
const relief = reliefModule.heritageRelief('santa-maria', {church: native.church, context: native.context}, frame, place, territorialRaw, nativeRaw);
const reversedRelief = reliefModule.heritageRelief('santa-maria', {context: native.context, church: native.church}, frame, place, territorialRaw, nativeRaw);
const maxReliefOrderDifference = Math.max(...relief.delta.map((v, i) => Math.abs(v - reversedRelief.delta[i])));
check(maxReliefOrderDifference < 1e-8, 'Territorial relief: reversed site/context construction produces identical raster', {samples: relief.delta.length, maximumDifferenceM: maxReliefOrderDifference});
const adjusted = (x, z) => {const p = frame.world(x, z); return territorialRaw(p.x, p.z) + reliefModule.reliefDelta(relief, p.x, p.z);};
const nativeGraded = measure(native, adjusted, nativePoints);
check(nativeGraded.highestAboveMDT.delta < .15, 'Territorial relief: no artificial north-wall bank after interpolation', nativeGraded.highestAboveMDT);
check(nativeGraded.steepest.slope < 1.5, 'Territorial relief: street outside stairs has no abrupt multi-metre cliff', nativeGraded.steepest);
const nativePaving = pavementChecks(native, 'Territorial', adjusted);
const nativeStairs = stairChecks(native, 'Territorial', adjusted);
floorChecks(native, 'Territorial');
const rawParity = Math.max(...atlasPoints.map(({p}) => Math.abs(atlasRaw(p.x, p.z) - nativeRaw(p.x, p.z))));
check(rawParity < .3 && Math.abs(atlas.church.frame.base - native.church.frame.base) < .3, 'Both renderers retain the same church registration and ground within reprojection tolerance', {maximumRawDifferenceM: rawParity, atlasFloorM: atlas.church.frame.base, territorialFloorM: native.church.frame.base});
check(JSON.stringify([record.footprint, contextData.buildings.map(b => [b.id, b.coordinates, b.holes])]) === sourceFootprints, 'Church and neighboring cadastral footprints remain unchanged');

const report = {
  pass: !failures.length, checks, failures,
  atlas: {raw: measure(atlas, atlasRaw, atlasPoints), analytical: atlasAnalytical, triangulated: atlasTriangulated, paving: atlasPaving, stairs: atlasStairs},
  territorial: {graded: nativeGraded, paving: nativePaving, stairs: nativeStairs, maxOrderDifferenceM: maxReliefOrderDifference},
  notes: [
    'Metric checks use the actual authored geometry, source MDT and runtime samplers, without generated imagery.',
    'Street slope checks exclude solid church fabric and the stair footprint plus half a metre; structural stair risers are intentional.',
    'This isolates Santa María foundation grading; the combined Plaza Mayor scene is checked separately by visual renders.',
    'MDT reprojection and triangle grids differ between renderers; a 0.3 m local tolerance is not a claim of survey accuracy.'
  ]
};
const jsonIndex = process.argv.indexOf('--json');
if (jsonIndex !== -1) {
  const filename = process.argv[jsonIndex + 1];
  if (!filename) throw new Error('--json requires an output path');
  fs.mkdirSync(path.dirname(path.resolve(filename)), {recursive: true});
  fs.writeFileSync(filename, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({pass: report.pass, checks: checks.length, failures, maxOrderDifferenceM: maxOrderDifference,
  atlasMaximumBankM: atlasTriangulated.highestAboveMDT.delta, atlasMaximumStreetSlope: atlasTriangulated.steepest.slope,
  territorialMaximumBankM: nativeGraded.highestAboveMDT.delta, territorialMaximumStreetSlope: nativeGraded.steepest.slope,
  rawReprojectionMaximumM: rawParity}, null, 2));
if (failures.length) process.exitCode = 1;
