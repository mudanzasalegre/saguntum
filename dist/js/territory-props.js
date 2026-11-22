import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

import {streetTrees} from './territory-street-trees.js';
import {insideRing} from './territory-coordinates.js';

const V=(x,y,z)=>new T.Vector3(x,y,z);
const up=V(0,1,0), white=new T.Color();

// Build each prototype once. Components become vertex-coloured triangles in
// one mesh, so a bench with twenty slats and rails still costs one instance.
function model(){
  const parts=[];
  function add(geo,color,x=0,y=0,z=0,paint=0,limb=0,emission=0){
    geo.translate(x,y,z);
    if(geo.index){const flat=geo.toNonIndexed();geo.dispose();geo=flat;}
    const count=geo.attributes.position.count,cols=new Float32Array(count*3),params=new Float32Array(count*3);
    white.set(color);
    for(let i=0;i<count;i++){white.toArray(cols,i*3);params.set([paint,limb,emission],i*3);}
    geo.setAttribute('color',new T.BufferAttribute(cols,3));geo.setAttribute('part',new T.BufferAttribute(params,3));
    geo.deleteAttribute('uv');parts.push(geo);
  }
  function beam(a,b,r1,r2,color,paint=0,limb=0){
    const p=V(...a),q=V(...b),d=q.clone().sub(p);
    const g=new T.CylinderGeometry(r2,r1,d.length(),7);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,d.normalize()));
    p.lerp(q,.5);add(g,color,p.x,p.y,p.z,paint,limb);
  }
  function box(x,y,z,w,h,l,color,paint=0,limb=0,emission=0){add(new T.BoxGeometry(w,h,l),color,x,y,z,paint,limb,emission);}
  function ellipse(x,y,z,w,h,l,color,paint=0,limb=0){
    add(new T.SphereGeometry(1,9,6).scale(w,h,l),color,x,y,z,paint,limb);
  }
  function faces(coords,color,paint=0,emission=0){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(coords.flat(),3));g.computeVertexNormals();add(g,color,0,0,0,paint,0,emission);
  }
  return {add,box,beam,ellipse,faces,finish(){
    const merged=mergeGeometries(parts);for(const p of parts)p.dispose();return merged;
  }};
}

function carGeometry(){
  const m=model(),rim='#aeb2b0', rubber='#232627',glass='#486069';
  const stations=[[-1.93,.69,.43,.76],[-1.70,.845,.32,.91],[-.73,.89,.29,.93],[.66,.89,.29,.90],[1.56,.835,.32,.78],[1.92,.69,.39,.70]];
  // Taper the bonnet and both bumpers. The shoulders catch daylight as the
  // vehicle turns, and all windows sit inside the painted pillars.
  const rings=stations.map(([z,w,lower,upper])=>[[-w*.88,lower,z],[-w,lower+.12,z],[-w,upper-.09,z],[-w*.90,upper,z],
    [w*.90,upper,z],[w,upper-.09,z],[w,lower+.12,z],[w*.88,lower,z]]);
  for(let i=1;i<rings.length;i++)for(let j=0;j<8;j++){
    const k=(j+1)%8,a=rings[i-1],b=rings[i];
    m.faces([a[j],b[j],a[k],a[k],b[j],b[k]],j===7?'#3c3d3f':'#ffffff',j===7?0:1);
  }
  for(const i of [0,rings.length-1]){
    const r=rings[i];for(let j=1;j<r.length-1;j++)m.faces(i?[r[0],r[j],r[j+1]]:[r[0],r[j+1],r[j]],'#ffffff',1);
  }
  const side=(sign,pts,color,paint=0)=>{
    const [a,b,c,d]=pts.map(([x,y,z])=>[x*sign,y,z]);
    m.faces(sign>0?[a,b,c,c,b,d]:[a,c,b,c,d,b],color,paint);
  };
  for(const sign of [-1,1]){
    side(sign,[[.78,.88,-1.42],[.64,1.42,-1.15],[.78,.88,.94],[.62,1.41,.22]],'#eeeeeb',1);
    side(sign,[[.79,.945,-1.32],[.647,1.344,-1.102],[.79,.945,-.42],[.651,1.35,-.45]],glass);
    side(sign,[[.79,.945,-.34],[.65,1.35,-.36],[.79,.945,.79],[.642,1.34,.20]],glass);
    m.box(sign*.894,.80,-.52,.025,.035,.145,'#c4c5be');
    m.box(sign*.894,.77,.44,.025,.035,.145,'#c4c5be');
    m.box(sign*.91,1.015,.54,.16,.095,.14,'#353f43');
    for(const z of [-1.22,1.19]){
      const wheel=new T.CylinderGeometry(.293,.293,.15,14).rotateZ(Math.PI/2);
      m.add(wheel,rubber,sign*.826,.30,z);
      m.add(new T.CylinderGeometry(.174,.174,.018,12).rotateZ(Math.PI/2),rim,sign*.906,.30,z);
      m.add(new T.CylinderGeometry(.069,.069,.021,8).rotateZ(Math.PI/2),'#656b6c',sign*.917,.30,z);
    }
    m.box(sign*.516,.639,1.928,.31,.10,.026,'#dbe4d7',0,0,.65);
    m.box(sign*.548,.693,-1.936,.26,.114,.026,'#ae4338',0,0,.25);
  }
  m.faces([[-.62,1.406,.23],[.62,1.406,.23],[-.775,.90,.92],[-.775,.90,.92],[.62,1.406,.23],[.775,.90,.92]],glass);
  m.faces([[-.64,1.393,-1.15],[-.775,.915,-1.415],[.64,1.393,-1.15],[.64,1.393,-1.15],[-.775,.915,-1.415],[.775,.915,-1.415]],glass);
  m.box(0,1.421,-.45,1.27,.05,1.37,'#f3f2ee',1);
  m.box(0,.47,1.936,.62,.095,.018,'#30383d');m.box(0,.545,-1.94,.36,.075,.018,'#e1e0cd');
  return m.finish();
}

function pedestrianGeometry(){
  const m=model(),skin='#b58a72';
  m.ellipse(0,1.13,0,.206,.31,.135,'#e1dfd3',1);
  m.ellipse(0,.895,-.015,.171,.136,.128,'#48515b');
  m.beam([0,1.385,0],[0,1.49,0],.064,.061,skin);
  m.ellipse(0,1.594,.009,.099,.139,.103,skin);
  m.ellipse(0,1.656,-.011,.103,.085,.104,'#4a4038');
  for(const s of [-1,1]){
    m.beam([s*.088,.878,0],[s*.092,.484,.024],.088,.058,'#525b68',0,s);
    m.beam([s*.092,.484,.024],[s*.091,.111,-.015],.058,.043,'#48515a',0,s);
    m.ellipse(s*.091,.077,.043,.058,.052,.118,'#403f3b',0,s);
    m.beam([s*.165,1.306,0],[s*.233,1.088,-.015],.072,.051,'#e3e1d5',1,-2*s);
    m.beam([s*.233,1.089,-.015],[s*.221,.919,.069],.049,.031,skin,0,-2*s);
    m.ellipse(s*.221,.891,.071,.033,.048,.033,skin,0,-2*s);
  }
  return m.finish();
}

function modelMaterial(dynamic=false){
  const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.78,side:T.DoubleSide});
  const night={value:0};m.userData.night=night;
  m.onBeforeCompile=s=>{
    s.uniforms.propNight=night;
    s.vertexShader='attribute vec3 part;varying float vPropGlow;\n'+(dynamic?'attribute float stride;\n':'')+s.vertexShader
      .replace('#include <color_vertex>',`#include <color_vertex>
         #ifdef USE_INSTANCING_COLOR
           vColor.xyz=color*mix(vec3(1.),instanceColor.xyz,part.x);
         #endif
         vPropGlow=part.z;`)
      .replace('#include <begin_vertex>',dynamic?`#include <begin_vertex>
        float joint=abs(part.y)>1.5?1.31:.88;
        float angle=sign(part.y)*sin(stride)*(abs(part.y)>1.5?.29:.39);
        if(abs(part.y)>.5){
          vec2 leg=transformed.yz-vec2(joint,0.);
          transformed.yz=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*leg+vec2(joint,0.);
        }`:'#include <begin_vertex>');
    s.fragmentShader='varying float vPropGlow;uniform float propNight;\n'+s.fragmentShader
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=diffuseColor.rgb*vPropGlow*propNight*2.4;');
  };
  m.customProgramCacheKey=()=>dynamic?'street-animated-person':'street-static-parts';
  return m;
}

export function streetActors(parent,maxCars,maxPeople){
  const make=(g,m,n)=>{const inst=new T.InstancedMesh(g,m,n);inst.count=0;inst.frustumCulled=false;inst.castShadow=true;parent.add(inst);return inst;};
  const carMat=modelMaterial(),walkMat=modelMaterial(true);
  const cars=make(carGeometry(),carMat,maxCars),walkers=make(pedestrianGeometry(),walkMat,maxPeople);
  const stride=new T.InstancedBufferAttribute(new Float32Array(maxPeople),1);
  walkers.geometry.setAttribute('stride',stride);
  const assign=(mesh,colors,n)=>{for(let i=0;i<n;i++)mesh.setColorAt(i,new T.Color(colors[i%colors.length]));};
  assign(cars,['#a45649','#e0e2dc','#375867','#6a736f','#b6bbbd','#444853','#bdad91'],maxCars);
  assign(walkers,['#728a9e','#bd7b62','#919e72','#ded5bd','#54626e','#a2aaa4'],maxPeople);
  return {cars,walkers,stride,setNight(n){carMat.userData.night.value=n;}};
}

function structures(){
  const prototypes={},metal='#536065',timber='#92734f';
  let m=model();
  for(const x of [-.61,.61]){
    m.box(x,.245,.006,.08,.436,.39,metal);
    m.beam([x,.42,-.16],[x,.85,-.24],.031,.03,metal);
  }
  for(let z=-.18;z<=.19;z+=.09)m.box(0,.472,z,1.68,.054,.075,timber);
  for(let i=0;i<3;i++)m.box(0,.61+i*.09,-.218,1.68,.074,.045,timber);
  prototypes.bench=m.finish();
  m=model();m.beam([0,0,0],[0,5.08,0],.081,.043,metal);m.beam([0,4.96,0],[.60,5.18,0],.047,.027,metal);
  m.ellipse(.66,5.17,0,.258,.073,.108,metal);m.box(.66,5.125,0,.34,.027,.137,'#f8ddac',0,0,1);
  prototypes.street_lamp=m.finish();prototypes.lamp=prototypes.street_lamp;
  m=model();m.beam([0,0,0],[0,.85,0],.087,.074,metal);m.add(new T.CylinderGeometry(.078,.080,.044,9),'#a4b0a8',0,.725,0);
  prototypes.bollard=m.finish();
  m=model();m.beam([-.34,0,0],[-.34,.74,0],.033,.033,metal);
  m.beam([-.34,.74,0],[.34,.74,0],.033,.033,metal);m.beam([.34,.74,0],[.34,0,0],.033,.033,metal);
  prototypes.bicycle_parking=m.finish();
  for(const name of ['stop','give_way','traffic_signals']){
    m=model();m.beam([0,0,0],[0,2.14,0],.042,.036,metal);
    if(name==='traffic_signals'){
      m.box(0,2.34,0,.263,.70,.178,'#373e3d');
      for(let i=0;i<3;i++)m.add(new T.CylinderGeometry(.065,.065,.022,10).rotateX(Math.PI/2),['#355341','#916d36','#a94735'][i],0,2.14+i*.192,.098,0,0,i===2?.5:0);
    }else{
      const stop=name==='stop',n=stop?8:3,angle=stop?Math.PI/8:0;
      for(const [r,z,c] of [[.33,.005,stop?'#e5e2d5':'#aa4238'],[.296,.02,stop?'#aa4238':'#eee8d6']]){
        m.add(new T.CylinderGeometry(r,r,.012,n,1,false,angle).rotateX(Math.PI/2),c,0,2.18,z);
      }
      if(stop){
        const letters=[[[1,1],[0,1],[0,.52],[1,.48],[1,0],[0,0]],
          [[0,1],[1,1],[.5,1],[.5,0]],[[0,0],[0,1],[1,1],[1,0],[0,0]],[[0,0],[0,1],[1,1],[1,.49],[0,.49]]];
        letters.forEach((line,i)=>{
          for(let j=1;j<line.length;j++){
            const point=([x,y])=>[-.217+i*.112+x*.078,2.106+y*.148,.03];
            m.beam(point(line[j-1]),point(line[j]),.009,.009,'#f1ecda');
          }
        });
      }
    }
    prototypes[name]=m.finish();
  }
  m=model();m.box(0,.007,0,1,.014,1,'#dcdcd2');prototypes.crossing=m.finish();
  return prototypes;
}

export async function streetFurniture(){
  const prototypes=structures(),tree=await streetTrees(),solid=modelMaterial(),dummy=new T.Object3D();
  Object.assign(prototypes,tree.geometry);
  // Contact darkening makes the root legible even when shadow maps are disabled.
  // A small planting well is only shown on a tree inside a mapped paved square.
  const floor=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  const contact=new T.MeshBasicMaterial({color:'#252b20',transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3});
  contact.onBeforeCompile=s=>{
    s.vertexShader='varying vec2 vContact;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvContact=uv*2.-1.;');
    s.fragmentShader='varying vec2 vContact;\n'+s.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\nfloat r=length(vContact);diffuseColor.a*=1.-smoothstep(.03,.98,r);');
  };
  const pit=new T.MeshStandardMaterial({roughness:1,color:'#645843',polygonOffset:true,polygonOffsetFactor:-3});
  pit.onBeforeCompile=s=>{
    s.vertexShader='varying vec2 vPit;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPit=uv;');
    s.fragmentShader='varying vec2 vPit;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float r=length(vPit-.5)*2.;
      if(r>.98)discard;
      float fleck=fract(sin(dot(floor(vPit*185.),vec2(12.77,35.89)))*43758.54);
      float rim=smoothstep(.88,.9,r);diffuseColor.rgb=mix(diffuseColor.rgb*(.80+.37*fleck),vec3(.116,.122,.115),rim);`);
  };
  prototypes.treeContact=prototypes.treePit=floor;
  const projected=new Set(['crossing','treeContact','treePit']);
  function build(group,objects,roads,areas,heightAt,heritage){
    const pooled=new Map();
    const add=(kind,x,y,z,yaw,sx=1,sy=sx,sz=sx)=>{
      if(!pooled.has(kind))pooled.set(kind,[]);
      const slopeX=projected.has(kind)?(heightAt(x+.5,z)-heightAt(x-.5,z)):0;
      const slopeZ=projected.has(kind)?(heightAt(x,z+.5)-heightAt(x,z-.5)):0;
      pooled.get(kind).push({x,y,z,yaw,sx,sy,sz,pitch:-Math.atan(slopeX*Math.sin(yaw)+slopeZ*Math.cos(yaw)),
        roll:Math.atan(slopeX*Math.cos(yaw)-slopeZ*Math.sin(yaw))});
    };
    const direction=(o)=>{
      if(Number.isFinite(o.heading))return o.heading;
      let yaw=0,distance=12;
      for(const road of roads)for(let i=1;i<road.points.length;i++){
        const [x,z]=road.points[i-1],[bx,bz]=road.points[i],dx=bx-x,dz=bz-z;
        const t=T.MathUtils.clamp(((o.x-x)*dx+(o.z-z)*dz)/(dx*dx+dz*dz||1),0,1);
        const d=Math.hypot(o.x-x-t*dx,o.z-z-t*dz);if(d>=distance)continue;
        distance=d;yaw=Math.atan2(dx,dz);
      }
      return yaw;
    };
    for(const o of objects){
      const y=heightAt(o.x,o.z);
      if(o.kind==='tree'){
        const noise=Math.abs(Math.sin(o.x*.13+o.z*1.71)),scale=1.14+noise*.48;
        for(const k of ['trunk','crown','treeView'])add(k,o.x,y,o.z,noise*14.19,scale,scale*(.91+noise*.14),scale);
        const square=areas.some(a=>a.kind==='square'&&a.rings.length&&insideRing(o.x,o.z,a.rings[0])&&!a.rings.slice(1).some(r=>insideRing(o.x,o.z,r)));
        add('treeContact',o.x,y+(square?.140:.055),o.z,noise*6,scale*2.2,1,scale*1.80);
        if(square)add('treePit',o.x,y+.146,o.z,0,.99,1,.99);
      }else if(o.kind==='crossing'&&Number.isFinite(o.heading)){
        const w=Math.min(14,o.width||5),n=Math.max(2,Math.floor((w-.3)/.90));
        for(let i=0;i<n;i++){
          const s=(i-(n-1)/2)*.90,x=o.x+s*Math.cos(o.heading),z=o.z-s*Math.sin(o.heading);
          add('crossing',x,heightAt(x,z)+.234,z,o.heading,.45,1,2.45);
        }
      }else if(prototypes[o.kind]){
        const yaw=direction(o)+(o.kind==='bench'?Math.PI/2:0);
        add(o.kind,o.x,y,o.z,yaw);
      }
    }
    const batches=[];
    for(const [kind,items] of pooled){
      const material=tree.material[kind]||(kind==='treeContact'?contact:kind==='treePit'?pit:solid);
      const mesh=new T.InstancedMesh(prototypes[kind],material,items.length);
      mesh.castShadow=!projected.has(kind)&&kind!=='treeView';mesh.receiveShadow=true;group.add(mesh);
      let previous='';
      const apply=(x,z,budget,heritageKey)=>{
        const isTree=Boolean(tree.material[kind])||kind==='treeContact'||kind==='treePit';
        const key=heritageKey+(isTree?'/'+Math.round(x/12)+'/'+Math.round(z/12)+'/'+budget:'');
        if(key===previous)return;previous=key;
        const radius=[38,58,85][budget];
        let i=0;
        for(const row of items){
          if(isTree){
            const near=Math.hypot(row.x-x,row.z-z)<radius;
            if((kind==='treeView')===near)continue;
          }
          if(heritage?.isReplaced('',row.x,row.z))continue;
          dummy.position.set(row.x,row.y,row.z);dummy.rotation.set(row.pitch,row.yaw,row.roll,'YXZ');dummy.scale.set(row.sx,row.sy,row.sz);
          dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix);
        }
        mesh.count=i;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
      };
      mesh.count=0;batches.push(apply);
    }
    return (x,z,budget,heritageKey)=>batches.forEach(apply=>apply(x,z,budget,heritageKey));
  }
  return {build,setNight(n){solid.userData.night.value=n;}};
}
