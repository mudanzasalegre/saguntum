import assert from 'node:assert/strict';
import {createGpuTimer} from '../dist/js/territory-gpu-timer.js';
const ext={GPU_DISJOINT_EXT:1,TIME_ELAPSED_EXT:2};
let serial=0,active=null,disjoint=false,ready=false,deleted=[],reads=0;
const gl={CURRENT_QUERY:3,QUERY_RESULT_AVAILABLE:4,QUERY_RESULT:5,getExtension:()=>ext,getParameter:()=>disjoint,
 getQuery:()=>active,createQuery:()=>++serial,beginQuery:(_,q)=>{active=q;},endQuery:()=>{active=null;},
 getQueryParameter:(_,p)=>{if(p===4)return ready;reads++;return 5500000;},deleteQuery:q=>deleted.push(q)};
const t=createGpuTimer({getContext:()=>gl},{every:1,maxPending:2});
t.begin();t.end();t.begin();t.end();t.begin();t.end();
assert.equal(serial,2);assert.equal(reads,0);
ready=true;t.begin();assert.equal(t.stats.samples,2);assert.equal(t.stats.lastMs,5.5);assert.equal(reads,2);t.end();
disjoint=true;t.begin();t.end();assert.equal(t.stats.samples,0);assert.equal(t.stats.discarded,1);assert.equal(t.stats.p50Ms,null);
t.dispose();assert.equal(t.stats.available,false);
assert.ok(deleted.length>=3);
const missing=createGpuTimer({getContext:()=>({getExtension:()=>null})});assert.equal(missing.stats.available,false);missing.begin();missing.end();
console.log('OK: non-blocking GPU query lifecycle');
