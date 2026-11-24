// Sparse, asynchronous GPU timing of the production render pass. This is
// separate from wall-clock frame intervals and excludes CPU work and any
// rendering performed before begin(). Never wait for a query synchronously.
export function createGpuTimer(renderer,{every=45,maxPending=2}={}){
 let gl,ext;
 try{gl=renderer.getContext();ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');}catch{}
 const stats={available:!!ext,scope:'render (including reflections/postprocess)',samples:0,lastMs:null,p50Ms:null,p95Ms:null,discarded:0};
 let pending=[],current=null,frame=0,disabled=!ext,history=[];
 function erase(q){try{gl.deleteQuery(q);}catch{}}
 function drain(){
  if(disabled)return;
  try{
   if(gl.getParameter(ext.GPU_DISJOINT_EXT)){
    for(const q of pending)erase(q);stats.discarded+=pending.length;pending=[];history=[];
    stats.samples=0;stats.lastMs=stats.p50Ms=stats.p95Ms=null;return;
   }
   while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){
    const q=pending.shift(),ms=Number(gl.getQueryParameter(q,gl.QUERY_RESULT))/1e6;erase(q);
    if(!Number.isFinite(ms)||ms<0)continue;
    history.push(ms);if(history.length>20)history.shift();
    const sorted=[...history].sort((a,b)=>a-b);
    stats.samples=history.length;stats.lastMs=ms;stats.p50Ms=sorted[Math.floor(sorted.length*.5)];stats.p95Ms=sorted[Math.floor(sorted.length*.95)];
   }
  }catch{disable();}
 }
 function disable(){
  if(current){try{gl.endQuery(ext.TIME_ELAPSED_EXT);}catch{}erase(current);current=null;}
  for(const q of pending)erase(q);pending=[];disabled=true;stats.available=false;
 }
 return {stats,begin(){
  if(disabled)return;
  drain();if(disabled||++frame%every||pending.length>=maxPending||current)return;
  try{
   if(gl.getQuery(ext.TIME_ELAPSED_EXT,gl.CURRENT_QUERY))return;
   const q=gl.createQuery();if(!q)return;
   current=q;gl.beginQuery(ext.TIME_ELAPSED_EXT,q);
  }catch{disable();}
 },end(){
  if(!current)return;
  try{gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(current);current=null;}catch{disable();}
 },dispose:disable};
}
