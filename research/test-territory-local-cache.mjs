// Integration of the actual streaming controller with deterministic substitutes
// for the worker and Three.js geometry API. No browser/GPU required.
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../dist/js/'+name,import.meta.url),'utf8');
const p=read('territory-stream-policy.js'),l=read('territory-local-detail.js'),s=read('territory-stream.js');
const checks=await (async()=>{
const p1=new Function(p.replace(/^export /gm,"")+"\nreturn {boundsDistance,closeFabricBudget,selectSectors};")();
const lp=new Function(...Object.keys(p1),l.replace(/^import .*;\n/gm,"").replace(/^export /gm,"")+"\nreturn {facadeChunks,planChunks,detailLimits,detailBytes};")(...Object.values(p1));
let checks=0,clock=0;
const assert=(condition,message)=>{if(!condition)throw Error(message);checks++};
class Group{constructor(){this.children=[]}add(m){this.children.push(m)}remove(m){this.children=this.children.filter(x=>x!==m)}}
class BufferGeometry{constructor(){this.attributes={};this.disposed=false}setAttribute(n,v){this.attributes[n]=v}setIndex(v){this.index=v;this.drawRange={count:v.array.length}}computeVertexNormals(){}computeBoundingSphere(){}setDrawRange(start,count){this.drawRange={start,count}}dispose(){this.disposed=true}}
class BufferAttribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material}}
class URL{constructor(a,b){this.href=String(a)}}
let worker;
class Worker{constructor(){worker=this;this.sent=[]}postMessage(m){this.sent.push(m)}take(key){const i=this.sent.findIndex(m=>m.key===key);if(i<0)throw Error("Missing worker request "+key);return this.sent.splice(i,1)[0]}reply(key,result){this.onmessage({data:{key,result}})}}
const rows=[{id:"a",bounds:[0,0,8,8],x:4,z:4},{id:"b",bounds:[80,0,88,8],x:84,z:4}].map(r=>({...r,sector:"0_0",outerEdges:[true,true],eaves:6,floor:0,storey:3,rings:[]}));
function data(ids,extra=false){
 const rr=rows.filter(r=>ids.includes(r.id)).map((r,i)=>({...r,start:i*3,end:i*3+3}));
 const n=rr.length*3;
 return {rows:rr,position:new Float32Array(extra?3000000:n*3),color:new Float32Array(n*3),uv:new Float32Array(n*2),archMetric:new Float32Array(n*4),archData:new Int16Array(n*4),index:Uint32Array.from({length:n},(_,i)=>i),openings:n};
}
let heritageBlocked=false;
const imports={T:{Group,BufferGeometry,BufferAttribute,Mesh},MetricGrid:class{},footprintGrid:()=>({}),indexBounds:()=>{},nearCell:()=>false,touchesFootprint:()=>false,territoryBase:"",nearFacades:()=>()=>{},architecturalMaterial:()=>"local",skylineMaterial:()=>"far",selectSectors:p1.selectSectors,...lp,matchMedia:()=>({matches:false}),navigator:{deviceMemory:8},Worker,URL,document:{baseURI:"https://example.invalid"},performance:{now:()=>clock},DecompressionStream:undefined};
const source=s.replace(/^import\s[^;]*;\s*$/gm,"").replace(/^export\s+(?=(?:const|class|function)\b)/gm,"").replace(/import\.meta\.url/g,'"file:///module.js"');
const make=new Function(...Object.keys(imports),source+"\nreturn createBuildings;")(...Object.values(imports));
const b=make({scene:new Group(),world:{overview:"overview.json",sectors:[{id:"0_0",bounds:[0,-100,200,100],url:"0_0.json"}]},grids:{},heritage:{isReplaced:id=>heritageBlocked&&id==="a"}});
const tick=(x,alt=10,budget=0)=>{clock+=180;b.update(x,4,alt,budget,null,{x,z:4,dx:1,dz:0})};
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve()};
worker.take("overview");worker.reply("overview",data(["a","b"]));await b.ready;
const far=b.group.children[0];
assert(far.geometry.drawRange.count===6,"overview visible");
tick(4);await flush();worker.take("0_0");worker.reply("0_0",data(["a","b"]));await flush();
const medium=b.group.children[1];
assert(!medium.visible&&far.geometry.drawRange.count===6,"medium waits for masks");
tick(4);assert(medium.visible&&far.geometry.drawRange.count===0,"atomic medium substitution");
let req=worker.take("close-elevations");assert(req.selected[0][1][0]==="a","near chunk requested");
worker.reply("close-elevations",data(["a"]));await flush();
assert(b.group.children.length===2&&medium.geometry.drawRange.count===6&&b.fabricStats.stagedBytes>0,"fine data staged before publication");
tick(4);assert(b.fabricStats.chunks===1&&medium.geometry.drawRange.count===3,"fine replaces only its row");
const first=b.group.children[2];
tick(84);assert(!first.visible&&medium.geometry.drawRange.count===6,"old detail hidden, medium restored");
req=worker.take("close-elevations");assert(req.selected[0][1][0]==="b","next locality");
worker.reply("close-elevations",data(["b"]));await flush();tick(84);
assert(b.fabricStats.cached===2&&b.fabricStats.chunks===1,"two cached, one active");
tick(4);assert(first.visible&&b.fabricStats.hits===1&&b.fabricStats.builds===2,"return reuses geometry");
heritageBlocked=true;b.changed();tick(4);
assert(first.geometry.drawRange.count===0&&medium.geometry.drawRange.count===3,"heritage suppresses generic duplicate");
heritageBlocked=false;b.changed();tick(4);
assert(first.geometry.drawRange.count===3,"heritage mask reversible");
tick(4,3000);assert(b.fabricStats.cached===0&&b.fabricStats.bytes===0,"cache drained outside sector");
assert(first.geometry.disposed&&medium.geometry.disposed&&far.geometry.drawRange.count===6,"resources released, skyline restored");
tick(4);await flush();worker.take("0_0");worker.reply("0_0",data(["a","b"]));await flush();tick(4);worker.take("close-elevations");worker.reply("close-elevations",data(["a"],true));await flush();tick(4);
assert(b.fabricStats.refused===1&&b.fabricStats.bytes===0,"oversized chunk refused");
return checks;
})();
console.log('OK: '+checks+' mocked streaming integration checks');
