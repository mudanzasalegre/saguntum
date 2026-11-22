/* WebKit may terminate the web-content process before dispatching a WebGL event.
 * A tab-scoped marker distinguishes an interrupted startup from a clean navigation.
 * The URL also lets someone open an affected visit directly without allocating a GPU. */
const key='saguntum-render-start-v1';
let armed=false,firstFrame=null;
const route=()=>location.pathname+'#'+(location.hash.slice(1).split('/')[0]||'atlas');
export const wantsPlan=()=>new URL(location.href).searchParams.get('vista')==='plano';
function forget(){
  armed=false;firstFrame=null;
  try{sessionStorage.removeItem(key);}catch{}
}
function urlFor(plan){
  const url=new URL(location.href);
  if(plan)url.searchParams.set('vista','plano');else url.searchParams.delete('vista');
  return url;
}
export function startRenderSession(){
  if(wantsPlan()){forget();return;}
  try{
    const previous=JSON.parse(sessionStorage.getItem(key)||'null'),now=Date.now();
    if(previous?.route===route()&&now>=previous.time&&now-previous.time<240000){
      forget();history.replaceState(history.state,'',urlFor(true));return;
    }
    sessionStorage.setItem(key,JSON.stringify({route:route(),time:now}));
    armed=true;
  }catch{}
  window.addEventListener('pagehide',forget,{once:true});
}
export function markRendered(){
  if(!armed)return;
  const now=performance.now();
  if(firstFrame===null)firstFrame=now;
  // A first canvas paint can still precede shadow/texture upload and compilation.
  if(now-firstFrame>10000)forget();
}
export function goToPlan(){
  if(wantsPlan())return;
  forget();location.replace(urlFor(true).href);
}
export function retry3D(){
  forget();
  if(wantsPlan())location.replace(urlFor(false).href);else location.reload();
}
