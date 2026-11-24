// Shared textures and live controls belong to their original scene factories.
// The other renderer can sample them without downloading a second copy.
const records=new WeakMap();
export function registerUrbanMaterial(source,kind,parameters={}){
  records.set(source,{kind,...parameters});
  return source;
}
export const urbanMaterialRecord=source=>records.get(source);
