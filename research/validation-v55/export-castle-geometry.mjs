// v55 view set; the shared exporter still serializes the actual shipped mesh.
import {fileURLToPath} from 'node:url';
if(process.argv.includes('--cameras'))throw new Error('The v55 wrapper supplies its own inspection camera module');
process.argv.push('--cameras',fileURLToPath(new URL('./inspection-cameras.mjs',import.meta.url)));
await import('../validation-v54/export-castle-geometry.mjs');
