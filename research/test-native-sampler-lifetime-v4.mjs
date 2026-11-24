// Exercise the private sampler from the distributed Three build without a GPU.
// The test-only export stays in memory and leaves the public bundle untouched.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const folder=new URL('../dist/assets/vendor/',import.meta.url);
const core=new URL('three.core.js',folder);
const source=await readFile(new URL('three.webgpu.js',folder),'utf8');
const moduleSource=source.replace(/(["'])\.\/three\.core\.js\1/g,JSON.stringify(core.href));
const data=Buffer.from(moduleSource+'\nexport {Sampler as TestSampler};').toString('base64');
const {TestSampler,Texture}=await import('data:text/javascript;base64,'+data);

const previous=new Texture(),next=new Texture();
const original=new TestSampler('Atlas',previous);
const clone=original.clone();
assert.equal(previous._listeners.dispose.length,1);
original.texture=next;
previous.dispose();
assert.equal(clone.texture,null);
assert.equal(original.texture,next);

// Restoring a disposed texture begins a fresh lifetime. A later disposal of
// the other texture must not invalidate either binding in that new lifetime.
clone.texture=previous;
original.texture=previous;
next.dispose();
assert.equal(previous._listeners.dispose.length,1);
assert.equal(original.texture,previous);
assert.equal(clone.texture,previous);
previous.dispose();
assert.equal(original.texture,null);
assert.equal(clone.texture,null);
console.log('Samplers r180: clonación, liberación y reutilización correctas.');
