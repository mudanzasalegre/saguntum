import {createJuderiaContext} from './juderia-context.js';

// The ordinary houses share the source-preserving renderer used by the
// neighbouring quarter. Selection, paving, boundaries and resource ownership
// are independent. The Calvario enclosure belongs exclusively to calvario.js.
export function createCalvarioContext(options={}){
 const context=createJuderiaContext(options);
 const normalize=()=>{
  context.group.name='Calvario · caserío y accesos exteriores';
  context.group.userData.id='calvario-context';
  context.group.userData.stats.preservedJuderia=true;
  context.group.traverse(object=>{
   if(object.userData.component==='juderia-pavimento')object.userData.component='calvario-pavimento-exterior';
   if(!object.isMesh)return;
   delete object.userData.juderiaContext;
   object.userData.calvarioContext=true;
  });
 };
 const bindGround=context.bindGround;
 context.bindGround=ground=>{bindGround(ground);normalize();return context;};
 normalize();
 return context;
}
