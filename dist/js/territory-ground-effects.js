// Connections to the original live material uniforms. A mesh exported by a
// heritage worker must never attempt to serialize these textures or callbacks.
const descriptions=new WeakMap();

export function describeGroundEffect(material,effects){
  descriptions.set(material,Object.assign({},descriptions.get(material),effects));
}

export const groundEffectsOf=material=>descriptions.get(material);
