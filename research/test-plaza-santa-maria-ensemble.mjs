// Integration regression: both monuments survive one territorial heritage slot.
// Exercises the real native/worker builder, source claims, paving and visit state.
// node research/test-plaza-santa-maria-ensemble.mjs [--json /absolute/report.json]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {registerThreeTestLoader} from './three-test-loader.mjs';

registerThreeTestLoader();
const root = fileURLToPath(new URL('../', import.meta.url));
const asset = name => path.join(root, 'dist/assets', name);
const read = name => JSON.parse(fs.readFileSync(asset(name), 'utf8'));
const priorFetch = globalThis.fetch;
globalThis.fetch = async input => {
  const url = input instanceof URL ? input : new URL(input);
  if (url.protocol !== 'file:') throw Error('This QA only reads checked-out assets: ' + url);
  const filename = fileURLToPath(url);
  if (!filename.startsWith(path.join(root, 'dist/assets') + path.sep)) throw Error('Asset outside checkout: ' + filename);
  return new Response(fs.readFileSync(filename), {headers: {'Content-Type': 'application/json'}});
};
const ctx = new Proxy({}, {get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => (o[k] = v, true)});
globalThis.document = {createElement: () => ({width: 256, height: 256, getContext: () => ctx}), querySelector: () => ({checked: true})};

const [THREE, models, catalogue, coordinates, visitModule, pavementModule] = await Promise.all([
  import('three'), import('../dist/js/territory-heritage-models.js'),
  import('../dist/js/territory-heritage-catalog.js'), import('../dist/js/territory-coordinates.js'),
  import('../dist/js/territory-heritage-visit.js'), import('../dist/js/territory-heritage-paving.js')
]);
const checks = [], failures = [];
const check = (pass, label, detail) => {
  checks.push({pass: !!pass, label, ...(detail === undefined ? {} : {detail})});
  if (!pass) failures.push(label);
};
const meshes = group => {const rows = []; group.traverse(o => {if (o.isMesh) rows.push(o);}); return rows;};
const visible = object => {for (let o = object; o; o = o.parent) if (!o.visible) return false; return true;};
function raster(meta, compressed = false) {
  let bytes = fs.readFileSync(asset('territory/' + (meta.file || meta.heights)));
  if (compressed) bytes = gunzipSync(bytes);
  const data = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  if (compressed) for (let j = 0; j < meta.height; j++) for (let i = 1; i < meta.width; i++) data[j * meta.width + i] += data[j * meta.width + i - 1];
  return {...meta, data};
}
const terrainMeta = read('territory/world.json').terrain;
const saguntoMeta = read('territory/atlas-relief/index.json').find(g => g.region === 'sagunto');
const heightAt = coordinates.terrainSampler({base: raster(terrainMeta), detail: raster(terrainMeta.detail), regional: [raster(saguntoMeta, true)]});
const inventory = await catalogue.loadHeritageCatalog(coordinates.project);
const guides = Object.fromEntries(['plaza-mayor', 'santa-maria'].map(id => [id, read('data/' + id + '-visit.json')]));
const plazaSource = read('data/plaza-mayor-context.json');
const churchSource = read('data/santa-maria-context.json');
const replacements = (plazaSource.replacedSantaMariaBuildingIds || []).map(String);
check(models.modelId('santa-maria') === 'plaza-mayor' && models.modelId('plaza-mayor') === 'plaza-mayor', 'Both destination IDs resolve to the same territorial slot');
check(['plaza-mayor', 'santa-maria'].every(id => inventory.places.some(p => p.id === id)), 'The catalog retains two independently addressable visits');
check(replacements.length > 0, 'Detailed southern porticoes declare their replaced Santa María context parts', replacements);

let binding;
const options = {...inventory, heightAt, project: coordinates.project, needed: () => true};
const started = performance.now();
const model = await models.buildHeritageModel(models.modelId('santa-maria'), {
  ...options,
  bindVisit(value) {binding = value; visitModule.bindHeritageVisit(value);}
});
check(!!model && !!binding, 'Selecting Santa María builds the shared native ensemble');
if (!model || !binding) throw Error('Shared model did not finish');
const {sites, frame} = binding;
const plaza = sites['plaza-mayor'], church = sites['santa-maria'];
check(!!plaza && !!church && plaza.group !== church.group, 'The shared slot contains two separate authored monument groups');
const plazaVisit = plaza.group.userData.visit, churchVisit = church.group.userData.visit;
const placeTags = [];
model.group.traverse(o => {if (o.userData.territoryPlace) placeTags.push(o.userData.territoryPlace);});
check(placeTags.length === 2 && new Set(placeTags).size === 2 && placeTags.includes('plaza-mayor') && placeTags.includes('santa-maria'), 'Each monument has exactly one territorial identity in the scene', placeTags);

const stopResults = [];
for (const [place, guide] of Object.entries(guides)) {
  const visit = sites[place].group.userData.visit;
  for (const entry of guide.stops) {
    const state = model.setVisitStop(place, entry.id);
    const current = visit.getState();
    stopResults.push({place, stop: entry.id, resolves: !!visit.focuses[entry.id], selected: current.selected, section: state?.section, expectedSection: !!entry.requiresSection});
  }
}
check(stopResults.every(s => s.resolves && s.selected === s.stop && s.section === s.expectedSection), 'All editorial stops keep their own selection and sectional behavior', stopResults);

model.setVisitStop(null, null);
const plazaMeshes = meshes(plaza.group), churchMeshes = meshes(church.group);
const plazaVisibility = new Map(plazaMeshes.map(o => [o, o.visible]));
const churchVisibility = new Map(churchMeshes.map(o => [o, o.visible]));
const opened = model.setVisitStop('santa-maria', 'santa-maria-naves');
check(opened?.section && churchMeshes.some(o => !o.visible && churchVisibility.get(o)), 'Santa María still opens its authored nave section');
check(plazaMeshes.every(o => o.visible === plazaVisibility.get(o) && visible(o)), 'Opening Santa María leaves every Plaza Mayor mesh visible');
model.setVisitStop('plaza-mayor', 'plaza-soportales');
check(!churchVisit.getState().sectionOpen && churchMeshes.every(o => o.visible === churchVisibility.get(o)), 'Switching to Plaza Mayor closes the church section completely');
check(plazaVisit.getState().selected === 'plaza-soportales' && churchVisit.getState().selected === null, 'Switching monuments clears the previous selection without losing the new stop');
model.setVisitStop(null, null);
check(plazaVisit.getState().selected === null && churchVisit.getState().selected === null, 'Closing a visit restores both independent selection states');

const plazaColors = new Map(plazaMeshes.map(o => [o, o.material.color?.clone()]));
churchVisit.setReadingMode('periods');
check(plazaMeshes.every(o => !plazaColors.get(o) || o.material.color.equals(plazaColors.get(o))), 'Church material readings leave Plaza Mayor materials unchanged');
churchVisit.setReadingMode('materials');

const churchContextQA = churchVisit.qa.context, plazaContextQA = plazaVisit.qa.context;
const renderedContextIds = [...churchContextQA.buildings, ...plazaContextQA.buildings].map(b => String(b.id));
check(new Set(renderedContextIds).size === renderedContextIds.length, 'Context buildings are rendered once across the combined scene', {parts: renderedContextIds.length});
check(replacements.every(id => !renderedContextIds.includes(id) && churchContextQA.replacedBuildingIds.includes(id)), 'Replaced generic parts are omitted from actual contextual geometry', {replacements, omitted: churchContextQA.replacedBuildingIds});
const allClaimIds = new Set(model.claims.flatMap(claim => [...claim.ids]));
check(replacements.every(id => allClaimIds.has(models.normalizeBuildingId(id))), 'Replacement claims still hide the corresponding territorial generic buildings');
const plazaRings = plaza.exclusions.map(polygon => models.maskRing(polygon.map(p => frame.world(p.x, p.z))));
const coverage = replacements.map(id => {
  const old = churchSource.buildings.find(b => String(b.id) === id);
  const shape = old?.coordinates.map(ll => {const p = coordinates.project(...ll); return [p.x, p.z];});
  return {id, sourceExists: !!old, covered: !!shape && plazaRings.some(ring => models.overlapsRegisteredFootprint([shape], ring))};
});
check(coverage.every(r => r.sourceExists && r.covered), 'Every removed generic footprint is occupied by the detailed Plaza Mayor model', coverage);
for (const place of ['plaza-mayor', 'santa-maria']) {
  // Plaza Mayor's label is in public open space, not a building to suppress.
  // Check the actual authored footprints and source IDs instead of that label.
  const site = sites[place];
  const footprints = site.exclusions || [site.exclusion];
  const mapped = footprints.filter(Boolean).map(polygon => polygon.map(p => {const q = frame.world(p.x, p.z); return [q.x, q.z];}));
  const covered = mapped.every(polygon => model.claims.some(claim => claim.rings.some(ring => models.overlapsRegisteredFootprint([polygon], ring))));
  const idsCovered = (inventory.records[place].osmIds || []).every(id => allClaimIds.has(models.normalizeBuildingId(id)));
  check(mapped.length > 0 && covered && idsCovered, place + ': authored footprints and source IDs are represented in the combined replacement claims', {footprints: mapped.length, idsCovered});
}

// Test the visible paths through the new galleries against the WHOLE ensemble,
// so an old context wall or a neighboring model cannot silently close them.
const ray = new THREE.Raycaster(), openings = [];
model.group.updateMatrixWorld(true);
for (const opening of plazaVisit.qa.openings.filter(o => /^soportal-(7-8|9)-/.test(o.id) || o.id === 'soportales-cierre-sur-paso')) {
  const origin = frame.world(opening.origin[0], opening.origin[2]);
  const d = opening.direction;
  const direction = new THREE.Vector3(frame.a * d[0] + frame.b * d[2], d[1], frame.c * d[0] + frame.d * d[2]);
  const scale = direction.length(); direction.normalize();
  ray.set(new THREE.Vector3(origin.x, opening.origin[1], origin.z), direction);
  ray.far = opening.distance * scale;
  const hit = ray.intersectObject(model.group, true).find(h => h.object.isMesh && visible(h.object) && !['glass', 'wood', 'darkWood', 'metal', 'plate'].includes(h.object.userData.materialKind));
  openings.push({id: opening.id, clear: !hit, obstruction: hit ? {name: hit.object.name, component: hit.object.userData.component, point: hit.point.toArray()} : null});
}
check(openings.length >= 5 && openings.every(row => row.clear), 'The new 7–8 and 9 porticoes and their connecting passage remain open in the assembled scene', openings);

check(model.relief?.delta?.length > 0 && [...model.relief.delta].every(Number.isFinite), 'The paired monument has one finite in-memory relief raster', {bounds: model.relief.bounds, width: model.relief.width, height: model.relief.height});
check(model.pavement?.coverage > 0 && model.walkBarriers?.length > 0, 'The shared scene retains paving and pedestrian wall geometry', {pavingCells: model.pavement?.coverage, wallValues: model.walkBarriers?.length});
const pavingRows = plazaVisit.qa.floorSamples.map(row => {
  const [x, y, z] = row.point, p = frame.world(x, z);
  const actual = pavementModule.heightOnPavement(model.pavement, p.x, p.z);
  return {building: row.building, expected: y, actual, error: actual === null ? null : Math.abs(actual - y)};
});
check(pavingRows.every(row => row.error !== null && row.error < .3), 'Portico floors from both old and new frontages remain in the walking surface', pavingRows);

// These points were measured by raycasting the exact v47 CPU camera: the first
// six exposed bare orthophoto in the public return between Cavallers and Sagrari.
// Ground slopes alone cannot detect absent or overlapping pavement polygons.
const streetMeshes = meshes(model.contextGroup).filter(o => o.userData.materialKind === 'paving');
const publicReturn = [[8.103, 17.656], [7.264, 16.467], [15.339, 19.134], [22.514, 18.074],
  [25.921, 17.031], [28.191, 18.035], [20.852, 14.989], [30.311, 14.907]].map(([x, z]) => {
  const p = church.frame.toWorld(x, z), world = frame.world(p.x, p.z), ground = binding.heightAt(p.x, p.z);
  ray.set(new THREE.Vector3(world.x, ground + 2, world.z), new THREE.Vector3(0, -1, 0));
  ray.far = 4;
  const hits = ray.intersectObjects(streetMeshes, false).filter(h => visible(h.object));
  const heights = hits.map(h => h.point.y), highest = heights[0];
  return {local: [x, z], ground, paved: hits.length > 0, highest: highest ?? null,
    clearance: highest === undefined ? null : highest - ground,
    layeredSpread: heights.length ? Math.max(...heights) - Math.min(...heights) : null,
    components: [...new Set(hits.map(h => h.object.userData.component))]};
});
check(publicReturn.every(p => p.paved && p.clearance >= .025 && p.clearance < .4), 'The full Cavallers–Sagrari return has exposed paving above the final ground', publicReturn);
check(publicReturn.every(p => p.layeredSpread !== null && p.layeredSpread < .015), 'The street return has one shared surface without overlapping pavement levels', publicReturn);

// Omitting bindVisit takes the same construction path used before worker packing.
const workerModel = await models.buildHeritageModel('plaza-mayor', options);
const workerTags = [];
workerModel.group.traverse(o => {if (o.userData.territoryPlace) workerTags.push(o.userData.territoryPlace);});
check(workerTags.length === 2 && workerTags.includes('plaza-mayor') && workerTags.includes('santa-maria'), 'The worker construction also contains both monuments', workerTags);
const workerMeshes = meshes(workerModel.group), nativeMeshes = meshes(model.group);
check(workerMeshes.length === nativeMeshes.length, 'Worker and interactive construction contain the same mesh count', {worker: workerMeshes.length, native: nativeMeshes.length});
check(workerModel.relief.delta.length === model.relief.delta.length && workerModel.relief.delta.every((v, i) => v === model.relief.delta[i]), 'Worker and interactive construction grade the same ground');
check(workerModel.pavement.heights.length === model.pavement.heights.length && workerModel.pavement.heights.every((v, i) => v === model.pavement.heights[i]), 'Worker and interactive construction retain identical pedestrian paving');
const finite = nativeMeshes.every(mesh => {
  const values = mesh.geometry.attributes.position.array;
  for (const value of values) if (!Number.isFinite(value)) return false;
  return true;
});
check(finite, 'All assembled geometry is finite');

const report = {pass: !failures.length, checks, failures, buildAndCheckMs: performance.now() - started,
  counts: {visits: 2, stops: stopResults.length, meshes: nativeMeshes.length, contextParts: renderedContextIds.length, replacedParts: replacements.length},
  limitations: ['CPU checks exercise real Three.js geometry and runtime construction. Browser GPU rendering and visual composition are checked separately.', 'Worker QA uses the worker construction path before serialization; the bundled worker must also be rebuilt.']};
const jsonIndex = process.argv.indexOf('--json');
if (jsonIndex !== -1) {
  const filename = process.argv[jsonIndex + 1];
  if (!filename) throw Error('--json requires an output path');
  fs.mkdirSync(path.dirname(path.resolve(filename)), {recursive: true});
  fs.writeFileSync(filename, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({pass: report.pass, checks: checks.length, failures, counts: report.counts, buildAndCheckMs: report.buildAndCheckMs}, null, 2));
model.disposeVisit?.(); models.releaseModel(model.group); models.releaseModel(workerModel.group);
globalThis.fetch = priorFetch;
if (failures.length) process.exitCode = 1;
