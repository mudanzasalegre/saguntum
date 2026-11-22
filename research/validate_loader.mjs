export async function resolve(specifier,context,nextResolve){
 if(specifier==='three')return {url:new URL('../dist/assets/vendor/three.module.js',import.meta.url).href,shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return {url:new URL('../dist/assets/vendor/'+specifier.split('/').pop(),import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}
