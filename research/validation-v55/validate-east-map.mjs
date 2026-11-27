// Shared real canvas checks, with v55's nine exterior features and two gaps.
import {fileURLToPath} from 'node:url';
process.env.SAGUNTUM_CASTLE_QA_DIRECTORY=fileURLToPath(new URL('./',import.meta.url));
process.env.SAGUNTUM_CASTLE_PRESERVED_STOPS='22';
await import('../validation-v54/validate-east-map.mjs');
