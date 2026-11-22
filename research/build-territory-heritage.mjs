// npm install --no-save --package-lock=false esbuild@0.25.12
// node research/build-territory-heritage.mjs
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {build}=require('esbuild');
const root=fileURLToPath(new URL('../',import.meta.url));
await build({
 absWorkingDir:root,entryPoints:['dist/js/territory-heritage-worker-source.js'],
 outfile:'dist/js/territory-heritage-worker.js',bundle:true,format:'esm',target:'es2020',minify:true,
 banner:{js:'// Reproducible worker build · research/build-territory-heritage.mjs'},
 plugins:[{name:'shared-three',setup(builder){
  builder.onResolve({filter:/^three$/},()=>({path:'../assets/vendor/three.core.js',external:true}));
  builder.onResolve({filter:/^three\/addons\/utils\/BufferGeometryUtils\.js$/},()=>({path:fileURLToPath(new URL('../dist/assets/vendor/BufferGeometryUtils.js',import.meta.url))}));
 }}]
});
