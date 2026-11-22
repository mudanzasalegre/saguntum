// Focused camera QA against the existing exact-mesh CPU export. No production
// geometry or integrated export is generated or modified by this check.
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import * as THREE from 'three';
const source='research/validation-v28/economato-entorno-geometry.json.gz';
const raw=zlib.gunzipSync(fs.readFileSync(source)),data=JSON.parse(raw);
const context=JSON.parse(fs.readFileSync('dist/assets/data/economato-context.json'));
const spec=context.focusSpecs['economato-entorno'];
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const p=project(...spec.targetCoordinates),target=new THREE.Vector3(p.x,5+spec.targetHeight,p.z);
const decode=d=>{const b=Buffer.from(d.data,'base64'),a=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),C={Float32Array,Uint32Array,Uint16Array,Uint8Array}[d.type];return new C(a);};
const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
for(const d of data.meshes){
    if(d.material.opacity===0)continue;
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(decode(d.positions),3));
    if(d.indices)g.setIndex(new THREE.BufferAttribute(decode(d.indices),1));
    const m=new THREE.Mesh(g,material);m.name=d.name;m.matrixAutoUpdate=false;m.matrix.fromArray(d.matrix);group.add(m);
}
group.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),checks=[],cameras=[];
const check=(label,pass,detail={})=>checks.push({label,pass:!!pass,...detail});
for(const[name,offset]of[['full',spec.far],['near',spec.near]]){
    const position=target.clone().add(new THREE.Vector3(...offset)),delta=target.clone().sub(position);
    ray.set(position,delta.clone().normalize());ray.near=.03;ray.far=delta.length()-.2;
    const hits=ray.intersectObject(group,true);
    check(name+' centre ray reaches the avenue without an intervening roof, tree or building',hits.length===0,{hits:hits.slice(0,3).map(h=>({name:h.object.name,distanceToTarget:h.point.distanceTo(target)}))});
    ray.set(position,new THREE.Vector3(0,-1,0));ray.near=0;ray.far=100;
    const below=ray.intersectObject(group,true)[0];
    check(name+' camera remains safely above all geometry directly below it',!!below&&below.distance>2,{verticalClearanceM:below?.distance,nearestBelow:below?.object.name});
    cameras.push({name,position:position.toArray(),target:target.toArray(),fov:spec.fov});
}
const direction=new THREE.Vector3(...spec.far).normalize(),nearDirection=new THREE.Vector3(...spec.near).normalize();
check('Near view follows the same observation corridor',direction.dot(nearDirection)>.99,{angularDifferenceDegrees:THREE.MathUtils.radToDeg(direction.angleTo(nearDirection))});
check('Field of view matches the approved 51 degree drafts',spec.fov===51);
const drafts=JSON.parse(fs.readFileSync('research/validation-v28/economato-avenue-camera-draft-specs.json')).candidates;
const fullDraft=drafts.find(c=>c.name==='avenida-desde-gerencia-recentrada');
const nearDraft=drafts.find(c=>c.name==='avenida-desde-gerencia-near-recentrada');
for(const[a,b]of[[cameras[0],fullDraft],[cameras[1],nearDraft]])check(a.name+' production camera reproduces its reviewed CPU draft',new THREE.Vector3(...a.position).distanceTo(new THREE.Vector3(...b.position))<.001&&target.distanceTo(new THREE.Vector3(...b.target))<.001);
const result={pass:checks.every(c=>c.pass),checks,cameras,sourceGeometrySHA256:crypto.createHash('sha256').update(raw).digest('hex'),sourceExport:source,sourceMeshCount:data.meshes.length,scope:'Camera-only review against the existing exact-mesh export. Parent performs the final integrated export and production validation.'};
fs.writeFileSync('research/validation-v28/economato-avenue-camera-qa.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));group.traverse(o=>o.geometry?.dispose());material.dispose();if(!result.pass)process.exitCode=1;
