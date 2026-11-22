import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Metres of the Atlas frame, positive z south. The paving runs ~17° east of north.
const east=new T.Vector3(.955,0,.296).normalize(),north=new T.Vector3(.296,0,-.955).normalize();
const up=new T.Vector3(0,1,0),tau=Math.PI*2;
const projectDefault=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const rand=i=>{const q=Math.sin(i*21.28+.7)*43759.3;return q-Math.floor(q);};
function stoneAtlas(){
  const n=256,raw=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const row=Math.floor(y/16),column=Math.floor((x+row%2*16)/32),joint=y%16===0||(x+row%2*16)%32===0;
    const tone=joint?136:201+18*rand((column%8)*13+row)+21*rand(x+y*n);
    const i=(y*n+x)*4;raw.set([tone,tone*.992,tone*.973,255],i);
  }
  const tex=new T.DataTexture(raw,n,n,T.RGBAFormat);
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;
  tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
  tex.name='Glorieta · adoquín';tex.needsUpdate=true;return tex;
}
function fountainMap(){
  const size=128,rgb=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x*tau/size,v=y*tau/size;
    const phase=16*v+1.9*Math.sin(2*u+2*v)+1.25*Math.cos(u-4*v)+.62*Math.cos(5*u+4*v);
    const ridges=Math.pow(Math.max(0,.5+.5*Math.sin(phase)),5);
    const sky=.55+.16*Math.sin(2*v+Math.cos(u))+.13*Math.sin(u-4*v)+.10*Math.cos(3*u-v);
    const i=(y*size+x)*4,reflect=sky*28+ridges*(6+7*sky);
    rgb.set([Math.round(69+reflect),Math.round(80+reflect),Math.round(86+reflect),255],i);
  }
  const map=new T.DataTexture(rgb,size,size,T.RGBAFormat);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(2,1);
  map.magFilter=T.LinearFilter;map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.needsUpdate=true;return map;
}
function foliageCluster(seed){
  const geo=new T.IcosahedronGeometry(1,2),p=geo.attributes.position,colors=[];
  const sx=rand(seed)*3,sz=rand(seed+19)*5;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=(Math.sin(7*x+2*y+sx)*Math.cos(6*z+sz)+Math.sin(9*y+sz)*.5)*.085;
    p.setXYZ(i,x*(1+n),y*(1+n),z*(1+n));
    const v=.72+.15*Math.sin(y*8+z*7+sx)+.13*y;colors.push(v,v,v);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;
}
function leafTuft(seed){
  const positions=[],normals=[],uv=[],indices=[];
  for(let i=0;i<24;i++){
    const a=(i+seed)*2.4,y=1-2*((i+.5)/24),r=Math.sqrt(1-y*y);
    const n=new T.Vector3(r*Math.cos(a),y,r*Math.sin(a)),c=n.clone().multiplyScalar(.79);
    const h=new T.Vector3(-Math.sin(a),.14*Math.sin(i),Math.cos(a)).normalize();
    const v=n.clone().cross(h).normalize(),size=.64+rand(seed+i)*.16;
    const idx=positions.length/3;
    for(const [u,b] of [[0,0],[1,0],[1,1],[0,1]]){
      const q=c.clone().addScaledVector(h,(u-.5)*size*2).addScaledVector(v,(b-.5)*size*2);
      positions.push(q.x,q.y,q.z);const smooth=q.clone().normalize();normals.push(smooth.x,smooth.y,smooth.z);uv.push(u,b);
    }
    indices.push(idx,idx+1,idx+2,idx,idx+2,idx+3);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
}
function leafPhoto(sample){
  const rgb=atob(sample.rgb),pix=atob(sample.pixels),raw=new Uint8Array(pix.length*4);
  for(let i=0;i<pix.length;i++){
    const n=pix.charCodeAt(i);for(let k=0;k<3;k++)raw[i*4+k]=rgb.charCodeAt(n*3+k)||0;raw[i*4+3]=n===255?0:255;
  }
  const tex=new T.DataTexture(raw,sample.width,sample.height,T.RGBAFormat);
  tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
  tex.colorSpace=T.SRGBColorSpace;tex.name='Glorieta · hojas observadas CC0';tex.needsUpdate=true;return tex;
}
function palmFrond(){
  // Folded rachis and paired narrow leaflets form a pinnate crown at pedestrian height.
  const vertices=[],colors=[];
  const at=t=>[0,.29*Math.sin(Math.PI*t)-.21*t*t,t];
  function tri(a,b,c,value){vertices.push(...a,...b,...c);for(const v of [value*.86,value,value*.96])colors.push(v,v,v);}
  for(let i=0;i<26;i++){
    const t=i/26,q=(i+1)/26,a=at(t),b=at(q);
    tri([-.008,a[1],t],[.008,a[1],t],b,1);
    for(const s of [-1,1]){
      const w=(.03+.13*Math.sin(Math.PI*(t*.87+.06)))*(1-t*.46),tip=[s*w,a[1]-.035-.06*t,t+.11];
      tri(a,[s*w*.37,a[1]+.014,t+.037],tip,.88);tri(a,tip,[0,b[1],q],1);
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;
}
export function createGlorietaSquare({layout,heightAt,project=projectDefault}){
  const group=new T.Group();group.name='Glorieta · plaza contemporánea';
  const vegetation=new T.Group();vegetation.name='Glorieta · arbolado';group.add(vegetation);
  const furniture=new T.Group();furniture.name='Glorieta · estancia y pabellones';group.add(furniture);
  const water=new T.Group();water.name='Glorieta · surtidores';group.add(water);
  const deck=new T.Group();deck.name='Pavimentos de la Glorieta';group.add(deck);
  const at=c=>{const p=project(...c);return new T.Vector3(p.x,heightAt(p.x,p.z)+.15,p.z);};
  const move=(p,e,n,y=0)=>p.clone().addScaledVector(east,e).addScaledVector(north,n).addScaledVector(up,y);
  const stone=stoneAtlas(),palette={pavement:[0xc8c6c0,.9],earth:[0x776442,1],turf:[0x7b9154,1],edge:[0x928d83,.86],
    darkStone:[0x555859,.65],metal:[0x465154,.55,.43],stainless:[0x9caaa8,.38,.65],wood:[0xa27c4e,.82],
    trunk:[0x786c56,.97],green:[0x688448,.99],palm:[0x60804f,.9],conifer:[0x4f7156,1],
    ivory:[0xe2d8c5,.83],clay:[0xa97868,.9],glass:[0x70918f,.24,.23],rubber:[0x8299a5,.98],red:[0xa86755,.96],
    amber:[0xbf9860,.85],light:[0xf0e2b3,.4],water:[0xd8edeb,.16,.20],wet:[0x999c9b,.34,.12],apron:[0xb3b0a9,.94],foam:[0xe2efec,.3],spray:[0xe4f1ec,.23,.06]};
  const mats={};
  for(const [id,[color,roughness,metalness=0]] of Object.entries(palette))
    mats[id]=new T.MeshStandardMaterial({color,roughness,metalness,name:'Glorieta · '+id});
  for(const id of ['wet','apron'])mats[id].map=stone;
  const rippled=fountainMap();mats.water.map=rippled;mats.water.bumpMap=rippled;mats.water.bumpScale=.008;
  mats.foam.transparent=true;mats.foam.opacity=.65;mats.foam.depthWrite=false;
  mats.pavement.map=stone;mats.pavement.bumpMap=stone;mats.pavement.bumpScale=.025;
  for(const k of ['green','palm','conifer'])mats[k].vertexColors=true;
  mats.palm.side=T.DoubleSide;mats.spray.transparent=true;mats.spray.opacity=.53;mats.spray.depthWrite=false;
  const unitBox=new T.BoxGeometry(),unitPole=new T.CylinderGeometry(.5,.5,1,10),unitFrond=palmFrond();
  const crown=[0,1,2].map(foliageCluster),tufts=[0,1,2].map(leafTuft);
  const leaf=leafPhoto(layout.leafSample);
  mats.leaves=new T.MeshStandardMaterial({name:'Glorieta · copa de sombra',map:leaf,color:0xd7dfaf,alphaTest:.30,side:T.DoubleSide,roughness:.94});
  mats.needles=mats.leaves.clone();mats.needles.name='Glorieta · copa perenne';mats.needles.color.setHex(0x96b59f);
  const batches=new Map(),matrix=new T.Matrix4(),quat=new T.Quaternion(),scale=new T.Vector3();
  const axisAngle=Math.atan2(-east.z,east.x),qYaw=y=>new T.Quaternion().setFromAxisAngle(up,y);
  function batch(parent,g,m,pos,rotation,size){
    const key=parent.id+'/'+g.id+'/'+m;
    if(!batches.has(key))batches.set(key,{parent,g,m,items:[]});
    batches.get(key).items.push(matrix.compose(pos,rotation,size).clone());
  }
  function box(p,w,h,d,mat,y=0,parent=furniture,yaw=axisAngle){
    batch(parent,unitBox,mat,p.clone().addScaledVector(up,y+h/2),qYaw(yaw),scale.set(w,h,d));
  }
  function rod(a,b,r,mat,parent=furniture){
    const delta=b.clone().sub(a);batch(parent,unitPole,mat,a.clone().lerp(b,.5),
      quat.setFromUnitVectors(up,delta.clone().normalize()),scale.set(r*2,delta.length(),r*2));
  }
  function strip(a,b,h,w,mat,y=0){
    const d=b.clone().sub(a),length=Math.hypot(d.x,d.z);box(a.clone().lerp(b,.5),length,h,w,mat,y,furniture,Math.atan2(-d.z,d.x));
  }
  function axes(record){
    const points=record.ring.map(at),p=at(record.center);
    return {p,width:Math.max(...points.map(q=>q.dot(east)))-Math.min(...points.map(q=>q.dot(east))),
      length:Math.max(...points.map(q=>q.dot(north)))-Math.min(...points.map(q=>q.dot(north)))};
  }
  function patch(ring,id,mat,lift,maxSide=6,voids=[]){
    const v=ring.map(at),points=v.map(p=>new T.Vector2(p.x,p.z));
    const holes=voids.map(r=>r.map(c=>{const q=at(c);return new T.Vector2(q.x,q.z);}));
    const faces=T.ShapeUtils.triangulateShape(points,holes),vertices=points.concat(...holes),positions=[],uv=[];
    function append(a,b,c){
      // Subdivide in plan before sampling the actual relief, including the long boundary triangles.
      const edges=[[a,b,c],[b,c,a],[c,a,b]].sort((i,j)=>j[0].distanceToSquared(j[1])-i[0].distanceToSquared(i[1]));
      const [l,r,s]=edges[0];if(l.distanceToSquared(r)>maxSide*maxSide){
        const mid=l.clone().lerp(r,.5);append(l,mid,s);append(mid,r,s);return;
      }
      if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0)[b,c]=[c,b];
      for(const p of [a,b,c]){positions.push(p.x,heightAt(p.x,p.y)+.15+lift,p.y);uv.push((p.x*east.x+p.y*east.z)/3.84,(p.x*north.x+p.y*north.z)/3.84);}
    }
    for(const [a,b,c] of faces)append(vertices[a],vertices[b],vertices[c]);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
    const mesh=new T.Mesh(g,mats[mat]);mesh.name='Glorieta · '+id;mesh.receiveShadow=true;mesh.userData.materialKind=mat==='pavement'?'paving':mat==='turf'?'garden':'paving-inset';deck.add(mesh);
  }
  patch(layout.perimeter,'pavimento de granito','pavement',0,6,
    [...layout.beds,...layout.play,layout.fountain,...layout.pavilions.filter(r=>r.id!=='correos')].map(r=>r.ring));
  for(const [i,edge] of layout.aprons.entries())patch(edge.ring,'acera de enlace '+i,'apron',-.025,2,edge.holes);
  for(const rec of layout.beds){patch(rec.ring,rec.id,'turf',.16,3);const ring=rec.ring.map(at);
    ring.forEach((p,i)=>strip(p,ring[(i+1)%ring.length],.18,.15,'edge'));}
  function bench(p,back=true){
    for(const x of [-.77,.77]){box(move(p,x,0),.13,.43,.49,'metal');if(back)box(move(p,x,-.22),.065,.48,.07,'metal',.39);}
    for(let j=0;j<5;j++)box(move(p,0,(j-2)*.102),2.04,.055,.085,'wood',.43);
    if(back)for(let j=0;j<3;j++)box(move(p,0,-.235),2.04,.103,.048,'wood',.59+j*.127);
  }
  layout.benches.forEach((c,i)=>bench(at(c),i<16));
  for(const c of layout.lamps){const p=at(c),arm=move(p,.89,0,5.8);
    rod(p,move(p,0,0,5.78),.064,'metal');rod(move(p,0,0,5.76),arm,.045,'metal');box(arm,.77,.095,.23,'metal');
    box(move(arm,.02,0,-.025),.55,.024,.18,'light');}
  for(const i of [0,3,5,9,15]){const p=move(at(layout.benches[i]),1.45,0);rod(p,move(p,0,0,.75),.18,'metal');rod(move(p,0,0,.71),move(p,0,0,.77),.195,'stainless');}
  const arbor=axes(layout.pergola);
  for(const x of [-1,1])for(let i=0;i<6;i++){const q=move(arbor.p,x*(arbor.width/2-.10),(i/5-.5)*(arbor.length-.3));q.y=heightAt(q.x,q.z)+.15;
    rod(q,move(q,0,0,3.05),.055,'metal');}
  for(const x of [-1,1])box(move(arbor.p,x*arbor.width/2,0),.095,.18,arbor.length,'metal',3.04);
  for(let n=-arbor.length/2;n<arbor.length/2;n+=.205)box(move(arbor.p,0,n),arbor.width+.24,.116,.104,'wood',3.21);
  const jets=[];
  for(const rec of layout.pavilions){
    const {p,width:w,length:d}=axes(rec),cafe=rec.id==='cafeteria',h=cafe?3.05:3.48;
    const a=rec.ring.map(at),min=Math.min(...a.map(v=>v.y));p.y=min;
    box(p,w-.36,h,d-.36,cafe?'glass':'ivory');box(p,w+.02,.22,d+.03,'edge',h);
    box(p,w-.28,.075,d-.26,rec.id==='turismo'?'clay':'ivory',h+.22);
    for(let z=-d/2+.75;z<d/2-.45;z+=1.5){const f=move(p,w*.5-.14,z);
      box(f,.12,2.16,1.25,'glass',.45);box(f,.17,.075,1.4,'stainless',.40);
      if(cafe)for(let i=0;i<12;i++)box(f,.16,.03,1.26,'metal',.50+i*.178);}
    for(const z of [-1,1]){
      const face=z*(d/2-.12);
      for(let x=-w/2+.6;x<w/2-.7;x+=1.45){
        const q=move(p,x,face);box(q,1.30,cafe?2.35:1.6,.10,'glass',cafe?.20:.78);
        box(move(q,-.65,0),.065,cafe?2.5:1.72,.155,'metal',cafe?.10:.72);
        box(q,1.36,.075,.17,'metal',2.29);
        if(cafe)box(q,1.36,.085,.16,'stainless',.84);
      }
      if(cafe)box(move(p,.1,face),1.72,.12,.45,'edge',2.65);
    }
    for(const x of [-1,1])for(const z of [-1,1])box(move(p,x*(w*.5-.18),z*(d*.5-.17)),.23,h,.24,'edge');
  }
  // Contemporary shallow fountain, measured rim in the orthophoto; water level is horizontal.
  const fountain=axes(layout.fountain),w=fountain.width,d=fountain.length,fp=fountain.p;
  fp.y=Math.max(...layout.fountain.ring.map(c=>at(c).y));
  // Thin wet stone margin next to the coping, with the same module and joints as the square.
  const outer=layout.fountain.ring.map((c,i)=>c.map((value,k)=>layout.fountain.center[k]+(value-layout.fountain.center[k])*(1.10+.012*Math.sin(i))));
  patch(outer,'piedra húmeda','wet',.021,.75,[layout.fountain.ring]);
  box(fp,w,.27,d,'darkStone');box(fp,w-.26,.055,d-.25,'water',.28);
  for(const e of [-1,1])box(move(fp,e*(w/2-.085),0),.17,.13,d,'darkStone',.26);
  for(const n of [-1,1])box(move(fp,0,n*(d/2-.085)),w,.13,.17,'darkStone',.26);
  const jetParts=[],ripple=new T.TorusGeometry(1,.022,4,30);
  const rippleRotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
  mats.ripple=new T.MeshStandardMaterial({color:0xb8d0c7,roughness:.22,transparent:true,opacity:.42});
  for(let row=0;row<2;row++)for(let i=0;i<7;i++){
    const home=move(fp,(i/6-.5)*(w-.95),(row-.5)*d*.43,.35);
    rod(move(home,0,0,-.067),move(home,0,0,.018),.065,'stainless');
    for(const r of [.14,.23,.36])batch(water,ripple,'ripple',move(home,0,-.24,-.006),rippleRotation,scale.set(r,r*.86,.24));
    for(let j=0;j<12;j++){
      const a=tau*j/12,r=.07+.17*rand(j+i+row),center=move(home,Math.cos(a)*r,-.24+Math.sin(a)*r,.027);
      batch(water,crown[0],'foam',center,qYaw(a),scale.set(.03+.045*rand(j+.3),.017,.045));
    }
    const ph=rand(i+9*row)*tau,curve=[];
    const peak=1.18+.22*Math.sin(i),strands=[];
    for(let j=0;j<=9;j++){const t=j/9;curve.push(new T.Vector3(.055*t,.015+peak*t,.06*t));}
    // The laminar stem breaks up toward its apex. Fine filaments fall around it,
    // thickening at the top and dispersing into a wider splash at the water line.
    for(let q=0;q<13;q++){
      const a=ph+q*2.4,r=.16+.24*rand(i*311+q),ceiling=peak*(.76+.33*rand(i+q*4));
      const pts=[];
      for(let j=0;j<=10;j++){
        const t=j/10,drift=r*t*t,swirl=.012*Math.sin(t*11+a);
        pts.push(new T.Vector3(drift*Math.cos(a)+swirl,.02+ceiling*4*t*(1-t),drift*Math.sin(a)));
      }
      strands.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts),12,.010+.007*rand(q*4+i),4,false));
    }
    strands.push(new T.TubeGeometry(new T.CatmullRomCurve3(curve),12,.035,6,false));
    const pipe=mergeGeometries(strands);strands.forEach(g=>g.dispose());
    jetParts.push({pipe,home,ph});
  }
  // Three animated batches keep all hydraulic outlets resident without one draw call per spout.
  for(let k=0;k<3;k++){const g=new T.Group();g.name='Glorieta · chorros '+k;
    const pieces=jetParts.filter((_,i)=>i%3===k).map(({pipe,home})=>pipe.translate(home.x,0,home.z));
    const merged=mergeGeometries(pieces);pieces.forEach(x=>x.dispose());
    const m=new T.Mesh(merged,mats.spray);m.position.y=fp.y+.35;m.name=g.name;g.add(m);water.add(g);jets.push(m);}
  for(const [index,play] of layout.play.entries()){
    const {p,width:w,length:d}=axes(play);
    patch(play.ring,play.id,'rubber',.045,3);
    for(const x of [-1,1]){const center=move(p,x*w*.47,0);
      for(let n=-d*.48;n<=d*.48;n+=.36)box(move(center,0,n),.10,.67,.10,'wood');
      box(center,.08,.085,d*.97,'wood',.38);}
    const a=move(p,-w*.18,d*.17),base=move(p,w*.24,-d*.18);
    for(const x of [-.76,.76])for(const z of [-.78,.78])box(move(a,x,z),.124,2.65,.124,'wood');
    box(a,1.64,.14,1.65,'amber',1.12);box(a,1.88,.13,1.86,'red',2.70);
    const lip=move(a,0,-.85,1.23),toe=move(a,0,-3.38,.17);
    for(let j=0;j<18;j++){const t=j/17,q=lip.clone().lerp(toe,t);box(q,.65,.06,.20,'stainless');}
    for(const x of [-.55,.55])rod(move(a,x,.90,1.20),move(a,x,2.14,.04),.055,'wood');
    for(let j=0;j<5;j++)rod(move(a,-.55,1.0+j*.21,1.03-j*.19),move(a,.55,1.0+j*.21,1.03-j*.19),.047,'metal');
    for(const x of [-1.25,1.25]){rod(move(base,x,-.72),move(base,x,0,2.1),.07,'wood');rod(move(base,x,.72),move(base,x,0,2.1),.07,'wood');}
    rod(move(base,-1.34,0,2.12),move(base,1.34,0,2.12),.075,'metal');
    for(const x of [-.23,.23])rod(move(base,x,0,2.10),move(base,x,0,.47),.016,'metal');box(base,.58,.075,.32,'red',.44);
  }
  for(const [i,t] of layout.trees.entries()){
    const p=at(t.point),h=t.height,r=t.radius,spin=rand(i+3)*tau;
    const trunkH=h*(t.kind==='palmera'?.84:t.kind==='conifera'?.95:.60);
    rod(p,move(p,0,0,trunkH),t.kind==='palmera'?.23:.17+rand(i)*.10,'trunk',vegetation);
    if(t.kind==='palmera'){
      for(let j=0;j<23;j++){const a=spin+j*2.40,tilt=j%3*.14-.23;
        const orientation=new T.Quaternion().setFromEuler(new T.Euler(tilt,a,0,'YXZ'));
        const length=r*(.86+.26*rand(j+i));batch(vegetation,unitFrond,'palm',move(p,0,0,trunkH),orientation,scale.set(length,length,length));}
      for(let v=.52;v<trunkH;v+=.53)rod(move(p,0,0,v),move(p,0,0,v+.035),.239,'trunk',vegetation);
    }else{
      for(let j=0;j<13;j++){const a=j*2.4+spin,l=j/13,con=t.kind==='conifera';
        const ring=(con?1-l:Math.sin(Math.PI*l))*r*.52,q=move(p,Math.sin(a)*ring,Math.cos(a)*ring,h*(.49+.42*l));
        const s=r*(con?.75*(1-l)+.12:.57+.18*rand(j+i));batch(vegetation,crown[(i+j)%3],con?'conifer':'green',q,qYaw(a),scale.set(s*.56,s*(con?.42:.55),s*.53));
        batch(vegetation,tufts[(i+j)%3],con?'needles':'leaves',q,qYaw(a),scale.set(s*1.04,s*(con?.70:.96),s));
        if(j%3===0&&!con)rod(move(p,0,0,h*.33),q,.085,'trunk',vegetation);}
    }
  }
  for(const rec of batches.values()){
    const m=new T.InstancedMesh(rec.g,mats[rec.m],rec.items.length);
    rec.items.forEach((v,i)=>m.setMatrixAt(i,v));m.name='Glorieta · '+rec.m;m.castShadow=!['water','ripple'].includes(rec.m);m.receiveShadow=true;rec.parent.add(m);
  }
  let enabled=true;
  function setWater(on){enabled=!!on;water.visible=enabled;}
  function update(seconds){if(!enabled)return;rippled.offset.set((seconds*.018)%1,(seconds*.008)%1);
    jets.forEach((m,i)=>m.scale.y=.94+.14*Math.sin(seconds*2.1+i*2.08));}
  function setNight(on){mats.light.emissive.setHex(on?0xffd698:0x000000);mats.light.emissiveIntensity=on?2.4:0;
    mats.glass.emissive.setHex(on?0xb39459:0x000000);mats.glass.emissiveIntensity=on?.42:0;}
  return {group,vegetation,water,setWater,update,setNight};
}
