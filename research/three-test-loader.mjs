import * as nodeModule from 'node:module';

// Use exactly the Three.js build shipped by this static application. Tests do
// not need an npm install and must not silently exercise a different version.
const vendor = new URL('../dist/assets/vendor/', import.meta.url);
const modules = new Map([
  ['three', 'three.module.js'],
  ['three/webgpu', 'three.webgpu.js'],
  ['three/tsl', 'three.tsl.js'],
  ['three/addons/controls/OrbitControls.js', 'OrbitControls.js'],
  ['three/addons/utils/BufferGeometryUtils.js', 'BufferGeometryUtils.js']
]);

// Register before dynamically importing application modules that use Three.js.
export function registerThreeTestLoader() {
  if (typeof nodeModule.registerHooks !== 'function') {
    throw new Error('These tests require Node.js 24 or a runtime with node:module.registerHooks.');
  }
  return nodeModule.registerHooks({
    resolve(specifier, context, nextResolve) {
      const file = modules.get(specifier);
      return file
        ? {url: new URL(file, vendor).href, shortCircuit: true}
        : nextResolve(specifier, context);
    }
  });
}
