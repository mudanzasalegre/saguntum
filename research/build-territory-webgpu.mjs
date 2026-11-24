// Supply build/three.webgpu.js from three@0.180.0, or use the recorded pilot blob.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {transform} from 'esbuild';

const sourceBlob='81b64e4760cf020bd28d6b7bf286c57c725ec68d';
const source=process.argv[2]?await readFile(process.argv[2]):execFileSync('git',['cat-file','blob',sourceBlob],{maxBuffer:4*1024*1024});
const digest=createHash('sha1').update('blob '+source.length+'\0').update(source).digest('hex');
if(digest!==sourceBlob)throw Error('Se requiere el módulo oficial de Three.js r180.');
// A regional mask can be disposed between two objects sharing a pipeline.
// r180 clones its old binding. Refresh from the live TSL slot before uploading.
const original='if ( binding.isSampledTexture ) {\n\n\t\t\t\tthis.textures.updateTexture( binding.texture );';
const code=source.toString('utf8');
if(code.split(original).length!==2)throw Error('No se reconoce Bindings._init.');
const refresh='if ( ( binding.isSampler || binding.isSampledTexture ) && ! binding.texture && binding.textureNode?.value?.isTexture ) binding.texture = binding.textureNode.value;';
const {code:output}=await transform(code.replace(original,refresh+'\n'+original),{format:'esm',minifyWhitespace:true,legalComments:'inline'});
await writeFile(new URL('../dist/assets/vendor/three.webgpu.js',import.meta.url),output);
