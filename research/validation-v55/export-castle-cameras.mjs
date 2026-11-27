// Keep the exact preset/adaptor and byte-preserving exporter shared with v54.
import {fileURLToPath} from 'node:url';
process.env.SAGUNTUM_CASTLE_QA_DIRECTORY=fileURLToPath(new URL('./',import.meta.url));
process.env.SAGUNTUM_CASTLE_PRESERVED_STOPS='22';
await import('../validation-v54/export-castle-cameras.mjs');
