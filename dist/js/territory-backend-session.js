// Graphics preference is per browser. A failed device is quarantined for this tab.
const preferenceKey='saguntum-renderer-v4',failureKey='saguntum-renderer-failure-v4';
export function requestedBackend(){
  try{const pref=localStorage.getItem(preferenceKey);return ['webgpu','webgl2'].includes(pref)?pref:'auto';}
  catch{return 'auto';}
}
export function fallbackReason(){
  try{return sessionStorage.getItem(failureKey)||'';}catch{return '';}
}
export function rememberFailure(reason){
  try{sessionStorage.setItem(failureKey,String(reason).slice(0,320));}catch{}
}
export function chooseBackend(value){
  if(!['auto','webgpu','webgl2'].includes(value))return;
  try{localStorage.setItem(preferenceKey,value);sessionStorage.removeItem(failureKey);}catch{}
}
export function recoverWebGL(reason){
  rememberFailure(reason);
  const url=new URL(location.href);
  url.searchParams.set('recuperar','webgl2');
  location.replace(url);
}
export function recoveryChoice(){
  const url=new URL(location.href);
  const forced=url.searchParams.get('recuperar')==='webgl2';
  if(forced&&fallbackReason()){url.searchParams.delete('recuperar');history.replaceState(history.state,'',url);}
  return forced||!!fallbackReason();
}
