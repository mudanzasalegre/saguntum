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
function replaceOnce(text,from,to){
  if(text.split(from).length!==2)throw Error('No se reconoce el bloque r180: '+from.slice(0,60));
  return text.replace(from,to);
}
let patched=replaceOnce(code,original,refresh+'\n'+original);
// A material can outlive thousands of streamed geometries. Its dispose listener
// otherwise retains each RenderObject, its bindings, builder and geometry.
patched=replaceOnce(patched,
  'this.onGeometryDispose = () => {\n\n\t\t\t// clear geometry cache attributes\n\n\t\t\tthis.attributes = null;\n\t\t\tthis.attributesId = null;\n\n\t\t};',
  'this.onGeometryDispose = () => this.dispose();\n\t\tif ( object.isInstancedMesh ) object.addEventListener( "dispose", this.onMaterialDispose );');
patched=replaceOnce(patched,
  'setGeometry( geometry ) {\n\n\t\tthis.geometry = geometry;',
  'setGeometry( geometry ) {\n\t\tthis.geometry.removeEventListener( "dispose", this.onGeometryDispose );\n\t\tgeometry.addEventListener( "dispose", this.onGeometryDispose );\n\t\tthis.geometry = geometry;');
patched=replaceOnce(patched,
  "this.material.removeEventListener( 'dispose', this.onMaterialDispose );",
  "if ( this.disposed ) return;\n\t\tthis.disposed = true;\n\t\tif ( this.object.isInstancedMesh ) this.object.removeEventListener( 'dispose', this.onMaterialDispose );\n\t\tthis.material.removeEventListener( 'dispose', this.onMaterialDispose );");
// Native bind groups clone samplers for every draw record. Registering a
// closure per clone on a persistent atlas texture keeps all those clones
// alive after their material, geometry and bind group have been released.
// Bindings can instead share one handle per live texture. Disposing it clears
// the texture for every binding without the texture retaining any binding.
const samplerLifetime=`const samplerTextureHandles = new WeakMap();
function releaseSamplerTexture( event ) {
  const texture = event.target;
  samplerTextureHandles.get( texture ).texture = null;
  samplerTextureHandles.delete( texture );
  texture.removeEventListener( 'dispose', releaseSamplerTexture );
}
function samplerHandle( texture ) {
  let handle = samplerTextureHandles.get( texture );
  if ( ! handle ) {
    handle = { texture };
    samplerTextureHandles.set( texture, handle );
    texture.addEventListener( 'dispose', releaseSamplerTexture );
  }
  return handle;
}
`;
patched=replaceOnce(patched,'class Sampler extends Binding {',samplerLifetime+'class Sampler extends Binding {');
const setter=patched.indexOf('set texture( value ) {',patched.indexOf('class Sampler extends Binding {'));
const updateComment=patched.indexOf('\n\t/**\n\t * Updates the binding.',setter);
if(setter<0||updateComment<0)throw Error('No se reconocen los accesos a la textura de Sampler.');
patched=replaceOnce(patched,patched.slice(setter,updateComment),`set texture( value ) {
    if ( this.texture === value ) return;
    this._textureHandle = value ? samplerHandle( value ) : null;
    this.generation = null;
    this.version = 0;
  }
  get texture() {
    const handle = this._textureHandle;
    if ( handle && ! handle.texture ) {
      this._textureHandle = null;
      this.generation = null;
      this.version = 0;
    }
    return handle ? handle.texture : null;
  }
`);
patched=replaceOnce(patched,
  'clonedSampler._texture = null;\n\t\tclonedSampler.texture = this.texture;',
  '// Object.assign already copied the shared lifetime handle.');
const {code:output}=await transform(patched,{format:'esm',minifyWhitespace:true,legalComments:'inline'});
await writeFile(new URL('../dist/assets/vendor/three.webgpu.js',import.meta.url),output);
