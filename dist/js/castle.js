import * as THREE from 'three';
import {createCastleTexture,CASTLE_TEXTURE_METRES} from './castle-materials.js';
import {ALMENARA_SPEC,buildAlmenara} from './castle-almenara.js';
import {buildForum,FORUM_REPLACED_WALL_IDS} from './castle-forum.js';
import {createCastleGround} from './castle-ground.js';

// Present-day castle fabric. Plans: OSM / PNOA; structure identification: municipal
// Plan Director (2000), Aranegui and FORTMED (2020). Heights are visual estimates.
// Compact mapped subsets preserve the same castle in the Palancia context.
const MAPPED_ROADS=[{"id":"82897957","coordinates":[[-0.27716,39.6757934],[-0.2773102,39.6758347],[-0.2776428,39.675878],[-0.2780077,39.6759468],[-0.2780262,39.6759438]],"kind":"path","surface":"unpaved"},{"id":"82897961","coordinates":[[-0.2767898,39.6757541],[-0.2768972,39.6757479],[-0.2769481,39.6758615],[-0.27716,39.6758347]],"kind":"path","surface":"paved"},{"id":"82897967","coordinates":[[-0.277222,39.6759601],[-0.27716,39.6759503],[-0.27716,39.6758347],[-0.27716,39.6757934],[-0.2770902,39.6756448],[-0.2770213,39.6755288],[-0.2767255,39.6755683],[-0.2767898,39.6757541],[-0.2767125,39.6757594],[-0.2767152,39.6757712],[-0.2766879,39.6758264],[-0.2763833,39.675873],[-0.276409,39.6760844],[-0.2763875,39.6760989],[-0.2763204,39.6761402],[-0.2762767,39.6762128]],"kind":"path","surface":"unpaved"},{"id":"82898197","coordinates":[[-0.2801052,39.6756886],[-0.2801869,39.6757056],[-0.28073,39.6758058],[-0.2813049,39.6759971],[-0.2817394,39.6760302],[-0.2817689,39.6760467],[-0.2818172,39.6760611],[-0.2817314,39.6760838],[-0.2814865,39.6761138],[-0.2813797,39.6761269],[-0.2813263,39.6761334],[-0.2812352,39.6761333]],"kind":"path","surface":"unpaved","incline":"up"},{"id":"180732342","coordinates":[[-0.2761072,39.6762588],[-0.2760466,39.676152],[-0.2760123,39.6759944],[-0.2758613,39.6759716],[-0.2757727,39.6759892],[-0.2756922,39.6760016],[-0.2755098,39.6760955],[-0.2753583,39.6761802],[-0.2752538,39.676281],[-0.2751505,39.6764461],[-0.2750997,39.6765512],[-0.2751017,39.676662],[-0.2753692,39.6767052],[-0.2756687,39.6767173],[-0.2757619,39.6766915],[-0.2759405,39.6765958],[-0.2762502,39.6764297],[-0.2761935,39.6762303]],"kind":"path","surface":"unpaved"},{"id":"180732348","coordinates":[[-0.2829223,39.6768136],[-0.2831476,39.6767795],[-0.28322,39.6767919],[-0.2834077,39.676763],[-0.2834587,39.6767816],[-0.2835955,39.6769086],[-0.2836438,39.6770417],[-0.2835875,39.6770748],[-0.2834801,39.6771088],[-0.2833863,39.6770995],[-0.2833179,39.6770789],[-0.2832817,39.6770438],[-0.2831878,39.6770025],[-0.2831207,39.6769158],[-0.2829223,39.6768136],[-0.2827399,39.6767197],[-0.2823255,39.6765958],[-0.2824033,39.676473],[-0.2822222,39.6764028],[-0.2821981,39.6764781],[-0.2821203,39.6765411],[-0.2820573,39.6765798],[-0.2820023,39.6765968],[-0.2819379,39.6765968],[-0.2818708,39.6765793],[-0.2818199,39.6765442],[-0.2818159,39.676473],[-0.2817394,39.6764472],[-0.2815936,39.6764322],[-0.2812779,39.6763997],[-0.2811949,39.6763625],[-0.2810957,39.6762882],[-0.2810581,39.6762077],[-0.2810995,39.676162],[-0.2811198,39.6761396],[-0.2812352,39.6761333]],"kind":"path","surface":"unpaved"},{"id":"733215256","coordinates":[[-0.2761783,39.6762352],[-0.2761072,39.6762588],[-0.2758453,39.6763669],[-0.2756898,39.6764401],[-0.2755162,39.6765318],[-0.2753987,39.6765897],[-0.2752538,39.6766],[-0.2751519,39.6766228],[-0.2751017,39.676662],[-0.2749082,39.6767495]],"kind":"path","surface":"unpaved"},{"id":"733215257","coordinates":[[-0.2762767,39.6762128],[-0.2761935,39.6762303],[-0.2761783,39.6762352]],"kind":"path","surface":"paved","tunnel":"yes","layer":"-1"},{"id":"733219596","coordinates":[[-0.2780077,39.6759468],[-0.2780036,39.6758194],[-0.278015,39.6758183]],"kind":"steps","surface":null},{"id":"733222858","coordinates":[[-0.2815936,39.6764322],[-0.2817037,39.6763695],[-0.2818606,39.6763334],[-0.2819143,39.6763427],[-0.28198,39.6764542],[-0.2819781,39.6764901],[-0.281976,39.6765305]],"kind":"path","surface":"unpaved"},{"id":"733222859","coordinates":[[-0.2819781,39.6764901],[-0.2820404,39.6764294],[-0.2820538,39.6763582],[-0.282043,39.6762921],[-0.281976,39.6762787],[-0.2819116,39.6763138],[-0.2818606,39.6763334]],"kind":"path","surface":"unpaved"},{"id":"733224021","coordinates":[[-0.2791916,39.6764399],[-0.2791437,39.6764449],[-0.2791434,39.6763967],[-0.2791762,39.6763445],[-0.2791847,39.676331],[-0.2792016,39.6763041],[-0.2792348,39.6762513],[-0.2794118,39.6760986],[-0.2797015,39.675983],[-0.2799616,39.6758735],[-0.2798517,39.6758157],[-0.279739,39.675793],[-0.2797219,39.6757099]],"kind":"path","surface":"unpaved","incline":"up"},{"id":"733225506","coordinates":[[-0.2770213,39.6755288],[-0.2769931,39.6754937],[-0.2769616,39.6755015],[-0.2769395,39.6754865],[-0.2769688,39.6754748],[-0.2769661,39.6754438],[-0.276895,39.6754448]],"kind":"steps","surface":null},{"id":"733408112","coordinates":[[-0.28073,39.6758058],[-0.2806462,39.6758179],[-0.2807474,39.6758734],[-0.280966,39.6759884],[-0.2814865,39.6761138]],"kind":"path","surface":"unpaved"},{"id":"733408113","coordinates":[[-0.2812969,39.675803],[-0.2811128,39.6757844],[-0.2808365,39.6757091],[-0.2804803,39.6756034],[-0.2802798,39.6756407],[-0.2802169,39.6756533],[-0.2801052,39.6756886]],"kind":"path","surface":"unpaved"},{"id":"1204891830","coordinates":[[-0.2780262,39.6759438],[-0.2785011,39.6759172],[-0.2791444,39.6757826],[-0.2797219,39.6757099],[-0.2797778,39.6757025],[-0.2799366,39.6756958],[-0.2801052,39.6756886]],"kind":"path","surface":"unpaved"},{"id":"1204891831","coordinates":[[-0.2791434,39.6763967],[-0.2791261,39.6763879],[-0.2791104,39.6763799]],"kind":"path","surface":null},{"id":"1204891832","coordinates":[[-0.2788346,39.676343],[-0.2791847,39.676331]],"kind":"path","surface":null},{"id":"1204891833","coordinates":[[-0.2791444,39.6757826],[-0.2790687,39.6755699]],"kind":"path","surface":"unpaved"},{"id":"1419350907","coordinates":[[-0.2764478,39.6762914],[-0.2764431,39.6762722]],"kind":"steps","surface":null}];
const MAPPED_BUILDINGS=[{"id":"cat-3555856YJ3935N_part1-0","coordinates":[[-0.2769996,39.6755704],[-0.2770291,39.6756934],[-0.2768965,39.6757128],[-0.2769009,39.6757284],[-0.2768657,39.6757323],[-0.2768691,39.6757422],[-0.2768126,39.6757485],[-0.2767861,39.6756471],[-0.2767665,39.6756097],[-0.276765,39.6755901],[-0.2769321,39.6755658],[-0.2769996,39.6755704]],"kind":"yes","height":null,"levels":1,"roofColor":"#b1a796","surfaceHeightEstimate":5.0},{"id":"82897960","coordinates":[[-0.2769106,39.6757356],[-0.2769782,39.6757232],[-0.2769703,39.6756992],[-0.2770245,39.6756901],[-0.2770634,39.6758119],[-0.2769535,39.6758305],[-0.2769106,39.6757356]],"kind":"yes","height":null,"levels":null,"surfaceHeightEstimate":6.0,"roofColor":"#a6a091"},{"id":"180732338","coordinates":[[-0.2787769,39.6756389],[-0.2790687,39.6755699],[-0.2792342,39.6755308],[-0.2792406,39.6755293],[-0.2792183,39.6754852],[-0.2787338,39.6755786],[-0.2787769,39.6756389]],"name":"Arxiu Epigrafic","kind":"yes","height":null,"levels":null,"surfaceHeightEstimate":6.0,"roofColor":"#a49a8c"},{"id":"733215254","coordinates":[[-0.2781942,39.6757759],[-0.278015,39.6758183],[-0.278,39.6757684],[-0.2780567,39.6757563],[-0.2780464,39.6757275],[-0.2780304,39.6756832],[-0.2779987,39.6755949],[-0.2780537,39.6755903],[-0.2780695,39.6756269],[-0.2781315,39.6755974],[-0.2781942,39.6757759]],"kind":"yes","height":null,"levels":null,"roofColor":"#b7afa1"},{"id":"733215260","coordinates":[[-0.275971,39.6760301],[-0.2759857,39.6760631],[-0.2758248,39.6761117],[-0.2757846,39.6760342],[-0.2759321,39.6760002],[-0.2759453,39.6760367],[-0.275971,39.6760301]],"kind":"ruins","height":null,"levels":null,"roofColor":"#b6ada2"},{"id":"733215261","coordinates":[[-0.2752977,39.6763646],[-0.2752387,39.6763264],[-0.2752749,39.6762933],[-0.2753299,39.6763357],[-0.2752977,39.6763646]],"kind":"ruins","height":null,"levels":null,"roofColor":"#afa799"},{"id":"733215262","coordinates":[[-0.2754467,39.6763742],[-0.2753993,39.6764042],[-0.275352,39.67636],[-0.2753837,39.6763398],[-0.2754021,39.6763571],[-0.2754178,39.6763471],[-0.2754467,39.6763742]],"kind":"ruins","height":null,"levels":null,"roofColor":"#b0a79a"},{"id":"733215263","coordinates":[[-0.275655,39.6765208],[-0.2756286,39.6764879],[-0.2756555,39.6764752],[-0.2756819,39.6765081],[-0.275655,39.6765208]],"kind":"ruins","height":null,"levels":null,"roofColor":"#b9af9f"},{"id":"733219600","coordinates":[[-0.2807981,39.6759544],[-0.2807849,39.676006],[-0.2807434,39.6759997],[-0.2807567,39.6759481],[-0.2807981,39.6759544]],"kind":"yes","height":null,"levels":null,"roofColor":"#aaa494"},{"id":"1199456167","coordinates":[[-0.2790931,39.6764521],[-0.279086,39.6764103],[-0.2791142,39.6764062],[-0.2791104,39.6763799],[-0.2791065,39.6763525],[-0.2788376,39.6763654],[-0.2788346,39.676343],[-0.2788319,39.6763228],[-0.2785244,39.6763796],[-0.2785533,39.6764663],[-0.2786418,39.6764658],[-0.2788245,39.6764307],[-0.2788815,39.6764733],[-0.2790931,39.6764521]],"kind":"yes","height":null,"levels":null,"surfaceHeightEstimate":5.0,"roofColor":"#c5afa2"}];

export const castleRoadIds=new Set(MAPPED_ROADS.map(r=>r.id));
export const castleBuildingIds=new Set(MAPPED_BUILDINGS.map(b=>b.id));

const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noise=n=>{const v=Math.sin(n*127.13+43.7)*43758.5453;return v-Math.floor(v);};
const COLORS={stone:'#c7b99e',ashlar:'#dfd4bd',rubble:'#b6aa90',tapial:'#c3b08a',brick:'#bd9276',mortar:'#8e8470',paving:'#bdb39d',path:'#c7b998',roof:'#a99d87',tile:'#b88769',metal:'#575e55',glass:'#424b45',wood:'#807157',
 'gate-stone':'#c5b9a3','gate-brick':'#be9576',plaster:'#c9b58b','forum-earth':'#b7a78f','forum-gravel':'#c0b39c','forum-stone':'#d2cbbb','worn-ashlar':'#ded9cd'};
const PERIOD_COLORS={ancient:'#e1c18b',medieval:'#8ad3ca',modern:'#f0b192',unknown:'#c0cbc9'};
const ROMAN_WALL_IDS=new Set(['733215272','733215273','733215274','733215275','733215276','733215277','733215278','733215279','733215280','733215281','733215282','733215283','733215284','733215285','733215286','1199456162','1199456163','1419350908','1419350909','1419350910','1419350911','1419350912','1419350913','1419350914']);
// Precinct limits are a visitor-oriented segmentation of the mapped footprint,
// not seven newly surveyed archaeological polygons. All have mixed fabric.
const REGION_DEFS=[
 {id:'armas',label:'Plaza de Armas',coordinates:[-.2764992,39.6758828]},
 {id:'almenara',label:'Plaza de Almenara',coordinates:[-.2758659,39.6764949]},
 {id:'conejera',label:'Plaza de la Conejera',coordinates:[-.2765862,39.676737]},
 {id:'san-fernando',label:'Plaza de San Fernando',coordinates:[-.2798156,39.6756028]},
 {id:'estudiantes',label:'Plaza de Estudiantes',coordinates:[-.2803067,39.6760944]},
 {id:'ciudadela',label:'Plaza de la Ciudadela',coordinates:[-.2818811,39.6763446]},
 {id:'dos-mayo',label:'Plaza del Dos de Mayo',coordinates:[-.2831876,39.6768604]}
];
const DEFAULT_STOPS=[
 ['conjunto','Los siete recintos','all',[-.27916,39.67613],100],
 ['acceso','Entrada al castillo','armas',[-.277222,39.6759601],17],
 ['foro','El foro de Saguntum','armas',[-.27658,39.676],47],
 ['templo','El templo del foro','armas',[-.27670,39.67637],17],
 ['curia','La curia','armas',[-.27643,39.67636],18],
 ['basilica','La basílica','armas',[-.27695,39.67594],28],
 ['cisterna-foro','La gran cisterna del foro','armas',[-.27660,39.67561],36],
 ['cisterna-norte','La cisterna del flanco norte','armas',[-.27670,39.67643],20],
 ['inscripcion','El pavimento y su inscripción','armas',[-.27658,39.676],16],
 ['puerta-almenara','Puerta de Almenara','almenara',[-.2762665022,39.676214945],15],
 ['almenara','Plaza de Almenara','almenara',[-.2758659,39.6764949],80],
 ['conejera','Plaza de la Conejera','conejera',[-.2765862,39.676737],65],
 ['puerta-san-fernando','Puerta de San Fernando','san-fernando',[-.2780262,39.6759438],18],
 ['san-fernando','Plaza de San Fernando','san-fernando',[-.2798156,39.6756028],115],
 ['antiquarium','Antiquarium epigráfico','san-fernando',[-.278987,39.675568],31],
 ['estudiantes','Plaza de Estudiantes','estudiantes',[-.2803067,39.6760944],116],
 ['ciudadela','Plaza de la Ciudadela','ciudadela',[-.2818811,39.6763446],65],
 ['dos-mayo','Plaza del Dos de Mayo','dos-mayo',[-.2831876,39.6768604],70]
];
function inside(x,z,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)c=!c;}return c;}
function distanceToSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/l,0,1):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);}
function distanceToOutline(p,poly){let d=Infinity;for(let i=0;i<poly.length;i++)d=Math.min(d,distanceToSegment(p,poly[i],poly[(i+1)%poly.length]));return d;}
function regionAt(x,z){
 if(x< -370)return'dos-mayo';
 if(x< -280&&z<340)return'ciudadela';
 if(x<0){const split=x< -150?351+(x+280)*.08:362-(x+150)*.135;return z>split?'san-fernando':'estudiantes';}
 if(x<85)return'armas';
 if(z<304&&x<154+(304-z)*.92)return'conejera';
 if(x>149+(z-310)*.24)return'almenara';
 return'armas';
}
function quad(out,a,b,c,d){out.push(...a,...b,...c,...a,...c,...d);}
class CastleBatch{
 constructor(){this.parts=new Map();this.boxGeo=new THREE.BoxGeometry(1,1,1).toNonIndexed();}
 geometry(key,geometry,matrix=new THREE.Matrix4(),tint=1){
  const g=geometry.index?geometry.toNonIndexed():geometry;if(!g.attributes.normal)g.computeVertexNormals();
  let out=this.parts.get(key);if(!out){out={p:[],n:[],c:[],uv:[]};this.parts.set(key,out);}
  const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),normal=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(matrix);
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(matrix);normal.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();
   out.p.push(v.x,v.y,v.z);out.n.push(normal.x,normal.y,normal.z);out.c.push(tint,tint,tint);
   const ax=Math.abs(normal.x),ay=Math.abs(normal.y),az=Math.abs(normal.z),scale=CASTLE_TEXTURE_METRES[key.split('|')[3]]||[5,4];
   out.uv.push((ay>ax&&ay>az?v.x:ax>az?v.z:v.x)/scale[0],(ay>ax&&ay>az?v.z:v.y)/scale[1]);
  }
  if(g!==geometry)g.dispose();
 }
 raw(key,positions,tint=1){if(!positions.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();this.geometry(key,g,new THREE.Matrix4(),tint);g.dispose();}
 box(key,x,y,z,w,h,d,yaw=0,tint=1){if(w<=0||h<=0||d<=0)return;const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(w,h,d));this.geometry(key,this.boxGeo,m,tint);}
 cylinder(key,x,y,z,rt,rb,h,tint=1,segments=14){const g=new THREE.CylinderGeometry(rt,rb,h,segments);this.geometry(key,g,new THREE.Matrix4().makeTranslation(x,y,z),tint);g.dispose();}
 finish(group){
  const textures=new Map(),materials=[];
  for(const key of this.parts.keys()){const kind=key.split('|')[3];if(CASTLE_TEXTURE_METRES[kind]&&!textures.has(kind))textures.set(kind,createCastleTexture(kind));}
  for(const[key,part]of this.parts){
   const[regionId,component,period,kind]=key.split('|'),g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute(part.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(part.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(part.uv,2));g.computeBoundingSphere();g.computeBoundingBox();
   const material=new THREE.MeshStandardMaterial({color:COLORS[kind]||COLORS.stone,roughness:kind==='metal'?.63:kind==='glass'?.4:.96,metalness:kind==='metal'?.18:0,vertexColors:true,map:textures.get(kind)||null});
   material.name='Castillo · '+component+' · '+kind;materials.push(material);
   const mesh=new THREE.Mesh(g,material);mesh.name='Castillo · '+component+' · '+kind;mesh.castShadow=true;mesh.receiveShadow=true;
   mesh.userData={castleFabric:true,regionId,component,period,materialKind:kind,sourceConfidence:period==='unknown'?'cartographic-plan-undated-fabric':'identified-structure-approximate-elevation',baseColor:material.color.clone(),baseMap:material.map};group.add(mesh);
  }
  this.boxGeo.dispose();return{materials,textures:[...textures.values()]};
 }
}
const keyFor=(region,component,period='unknown',kind='stone')=>[region,component,period,kind].join('|');

/** Present fabric; visit views and reading controls are owned by this instance. */
export function createCastle({project,heightAt,data={},visitData=data.castleVisit,detail='full'}={}){
 if(typeof project!=='function'||typeof heightAt!=='function')throw new TypeError('El castillo necesita proyección y consulta de la malla del terreno.');
 const outline=data.castlePolygon;
 if(!Array.isArray(outline)||outline.length<3)throw new Error('Falta la planta cartográfica del Castillo de Sagunto.');
 const world=outline.map(c=>project(...c)),group=new THREE.Group(),batch=new CastleBatch();group.name='castillo-sagunto';
 const stats={perimeterSource:'OpenStreetMap, polygon in cartography.json',elevationSource:'Supplied rendered terrain sampler; architectural heights are visual estimates',perimeterVertices:outline.length,perimeterLengthM:0,wallWayCount:0,wallLengthM:0,duplicateSegmentsSkipped:0,outsideSegmentsSkipped:0,gates:[],routeSegments:0,routeLengthM:0,mappedBuildings:0,romanWallWays:0,periods:['ancient','medieval','modern','unknown'],interpretiveDimensions:true,undergroundReconstruction:false,sourceKeys:['plan-director-2000','cisterna-norte-1984','fortmed-2020','civera-cisternas-2007','osm-castillo','templo-aranegui-1991','seranco-2019','foto-ricsol-2022','ipce-telegrafia','foro-terrazas-1998','aranegui-2004','bivaldi-jh4-388','almenara-restoration-2017'],detail};
 const qa={surfaces:[],wallBases:[],portals:[],routes:[],floorSamples:[],buildings:[],crowns:[],features:[]};
 const gateSpecs=[
  {id:'acceso',regionId:'armas',coordinate:[-.277222,39.6759601],yaw:-1.61694156,width:3.3,height:4.65,depth:3.7,top:6.8,period:'unknown',type:'segmental'},
  ALMENARA_SPEC,
  {id:'puerta-san-fernando',regionId:'san-fernando',coordinate:[-.2780262,39.6759438],yaw:-1.58285553,width:3.05,height:4.35,depth:3.5,top:7.3,period:'unknown',type:'round'}
 ];
 const localGround=createCastleGround({project,heightAt});
 const gates=gateSpecs.map(g=>{const p=project(...g.coordinate),gate={...g,...p,base:heightAt(p.x,p.z)+.14,cutWidth:g.frontWidth||g.width+1.9};
  if(g.id==='puerta-almenara'){
   gate.base=localGround.almenara.frontLevel+.105;
   gate.floorAt=(u,v)=>{const p=localGround.almenara.world(u,v);return Math.max(localGround.almenara.profile(v),heightAt(p.x,p.z))+.105;};
  }
  return gate;
 });
 const clippedByGate=(x,z,padding=0,skipAlmenara=false)=>gates.some(g=>{if(skipAlmenara&&g.id==='puerta-almenara')return false;const dx=x-g.x,dz=z-g.z,c=Math.cos(g.yaw),s=Math.sin(g.yaw),u=dx*c-dz*s,v=dx*s+dz*c;return Math.abs(u)<g.cutWidth*.5+padding&&(g.id==='puerta-almenara'?v>=-g.cutBack-padding&&v<=g.cutFront+padding:Math.abs(v)<g.depth*.5+1.7+padding);});
 const almenaraGate=gates.find(g=>g.id==='puerta-almenara');
 function wallOutsideAlmenara(a,b,ta,tb){
  const g=almenaraGate,c=Math.cos(g.yaw),s=Math.sin(g.yaw),ax=a.x-g.x,az=a.z-g.z,dx=b.x-a.x,dz=b.z-a.z;
  let enter=ta,exit=tb;
  for(const [origin,delta,min,max]of[[ax*c-az*s,dx*c-dz*s,-g.cutWidth/2+.18,g.cutWidth/2-.18],[ax*s+az*c,dx*s+dz*c,-g.cutBack,g.cutFront]]){
   if(Math.abs(delta)<1e-9){if(origin<min||origin>max)return[[ta,tb]];continue;}
   const t0=(min-origin)/delta,t1=(max-origin)/delta;enter=Math.max(enter,Math.min(t0,t1));exit=Math.min(exit,Math.max(t0,t1));
   if(enter>=exit)return[[ta,tb]];
  }
  return [[ta,enter],[exit,tb]].filter(([a,b])=>b-a>1e-8);
 }
 // Clip only the mapped path faces hidden by the authored gate floor. Keeping
 // the outside pieces avoids both coincident surfaces and gaps at the jambs.
 const gateFloor=(()=>{const a=localGround.almenara,w=ALMENARA_SPEC.width/2-.012;
  return [a.world(-w,.25),a.world(w,.25),a.world(w-.12,-ALMENARA_SPEC.depth-.5),a.world(-w-.12,-ALMENARA_SPEC.depth-.5)];})();
 const gateFloorBounds={x0:Math.min(...gateFloor.map(p=>p.x)),x1:Math.max(...gateFloor.map(p=>p.x)),z0:Math.min(...gateFloor.map(p=>p.z)),z1:Math.max(...gateFloor.map(p=>p.z))};
 function outsideGateFloor(polygon){
  if(polygon.every(p=>p.x<gateFloorBounds.x0)||polygon.every(p=>p.x>gateFloorBounds.x1)||polygon.every(p=>p.z<gateFloorBounds.z0)||polygon.every(p=>p.z>gateFloorBounds.z1))return[polygon];
  const area=gateFloor.reduce((a,p,i)=>{const q=gateFloor[(i+1)%gateFloor.length];return a+p.x*q.z-q.x*p.z;},0),sign=Math.sign(area);
  const outside=[];let remaining=polygon;
  for(let i=0;i<gateFloor.length&&remaining.length>=3;i++){
   const a=gateFloor[i],b=gateFloor[(i+1)%gateFloor.length],value=p=>sign*((b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x)),inner=[],outer=[];
   for(let j=0;j<remaining.length;j++){
    const p=remaining[j],q=remaining[(j+1)%remaining.length],vp=value(p),vq=value(q);
    (vp>=0?inner:outer).push(p);
    if((vp>=0)!==(vq>=0)){const t=vp/(vp-vq),cross={x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t};inner.push(cross);outer.push(cross);}
   }
   if(outer.length>=3)outside.push(outer);remaining=inner;
  }
  return outside;
 }
 function wall(line,{height=4.2,thickness=1.8,period='unknown',component='lienzos',seed=1,perimeter=false,regionId=null,gateCuts=true,coursed=false,fabric=null,crown=null,arcStart=0,broken=false,topCap=null}={}){
  for(let k=0;k<line.length-1;k++){
   const a=line[k],b=line[k+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.07)continue;
   const nx=-dz/length,nz=dx/length,n=Math.max(1,Math.ceil(length/1.8)),yaw=-Math.atan2(dz,dx);
   for(let j=0;j<n;j++)for(const [ta,tb]of(gateCuts?wallOutsideAlmenara(a,b,j/n,(j+1)/n):[[j/n,(j+1)/n]])){
    const pa={x:a.x+dx*ta,z:a.z+dz*ta},pb={x:a.x+dx*tb,z:a.z+dz*tb},cx=(pa.x+pb.x)/2,cz=(pa.z+pb.z)/2,segmentLength=length*(tb-ta);
    if(gateCuts&&clippedByGate(cx,cz,.4,true))continue;
    const region=regionId||regionAt(cx,cz),baseKind=fabric||(height<1.5?'rubble':'stone'),nearAlmenara=Math.hypot(cx-almenaraGate.x,cz-almenaraGate.z)<22;
    const kind=baseKind==='stone'&&nearAlmenara?'gate-stone':baseKind,key=keyFor(region,component,period,kind);
    const at=p=>{const l=heightAt(p.x+nx*thickness*.6,p.z+nz*thickness*.6),r=heightAt(p.x-nx*thickness*.6,p.z-nz*thickness*.6),center=heightAt(p.x,p.z);return{base:Math.min(l,r,center)-.35,top:Math.max(l,r,center)+height};};
    const ha=at(pa),hb=at(pb),v=[];
    const weather=height<.3?.02:broken?Math.min(1.12,height*.32):Math.min(.32,height*.08);
    ha.top+=(noise(seed+k*71+j)-.5)*weather;hb.top+=(noise(seed+k*71+j+1)-.5)*weather;
    if(topCap){ha.top=Math.max(ha.base+.45,topCap(pa,ha.top));hb.top=Math.max(hb.base+.45,topCap(pb,hb.top));}
    const p=(a,h,side,top)=>[a.x+nx*side*thickness*(top?.5:.57),top?h.top:h.base,a.z+nz*side*thickness*(top?.5:.57)];
    quad(v,p(pa,ha,1,false),p(pb,hb,1,false),p(pb,hb,1,true),p(pa,ha,1,true));
    quad(v,p(pb,hb,-1,false),p(pa,ha,-1,false),p(pa,ha,-1,true),p(pb,hb,-1,true));
    quad(v,p(pa,ha,-1,true),p(pa,ha,1,true),p(pb,hb,1,true),p(pb,hb,-1,true));
    quad(v,p(pa,ha,-1,false),p(pa,ha,1,false),p(pa,ha,1,true),p(pa,ha,-1,true));
    quad(v,p(pb,hb,1,false),p(pb,hb,-1,false),p(pb,hb,-1,true),p(pb,hb,1,true));
    batch.raw(key,v,.91+noise(seed+j+k*17)*.16);
    if(coursed&&j%2===0&&height>2.5){
     const base=Math.max(heightAt(cx+nx*thickness*.51,cz+nz*thickness*.51),heightAt(cx-nx*thickness*.51,cz-nz*thickness*.51));
     for(let y=base+.8;y<Math.min(ha.top,hb.top)-.4;y+=.95)for(const side of[-1,1])batch.box(keyFor(region,component,period,'mortar'),cx+nx*side*thickness*.507,y,cz+nz*side*thickness*.507,segmentLength*.94,.025,.025,yaw,.83);
    }
    if(height>1.5&&j%4===0&&noise(seed+j+k)>.52)batch.box(keyFor(region,component,period,'ashlar'),cx,(ha.top+hb.top)/2+.08,cz,Math.min(1.3,segmentLength*.9),.16,thickness*.77,yaw,.90+noise(seed+j)*.09);
    // The documented crenellated runs have a narrow outer parapet and a
    // walk behind it. Other curtains deliberately retain a broken plain crown.
    if(crown){
     const inward=inside(cx+nx*3,cz+nz*3,world)?1:-1,outward=-inward,shift=outward*(thickness/2-.35);
     const y=(ha.top+hb.top)/2;
     batch.box(keyFor(region,'adarves',period,'ashlar'),cx+nx*inward*.25,y+.045,cz+nz*inward*.25,segmentLength+.025,.09,Math.max(.5,thickness-.75),yaw,.91);
     const pp=[],pr=(point,h,side,upper)=>[point.x+nx*(shift+side*.34),h.top+(upper?.49:.01),point.z+nz*(shift+side*.34)];
     quad(pp,pr(pa,ha,1,false),pr(pb,hb,1,false),pr(pb,hb,1,true),pr(pa,ha,1,true));
     quad(pp,pr(pb,hb,-1,false),pr(pa,ha,-1,false),pr(pa,ha,-1,true),pr(pb,hb,-1,true));
     quad(pp,pr(pa,ha,-1,true),pr(pa,ha,1,true),pr(pb,hb,1,true),pr(pb,hb,-1,true));
     batch.raw(keyFor(region,'parapetos',period,kind),pp,.96);
     const step=crown.spacing||1.85,start=arcStart+length*ta,end=arcStart+length*tb;
     for(let along=Math.ceil(start/step)*step;along<end;along+=step){
      const local=(along-arcStart)/length,t=clamp((along-start)/(end-start),0,1),mx=a.x+dx*local+nx*shift,mz=a.z+dz*local+nz*shift,mb=ha.top+(hb.top-ha.top)*t+.47,mh=crown.height||.87,mw=crown.width||.82;
      if(clippedByGate(mx,mz,1)||noise(Math.round(along)*19)<(crown.loss||.10))continue;
      const kk=keyFor(region,'merlones',period,kind),slit=crown.slits&&noise(Math.round(along)*11)>.16;
      if(slit){
       const opening=.12,side=(mw-opening)/2;
       for(const sign of[-1,1])batch.box(kk,mx+Math.cos(yaw)*sign*(opening+side)/2,mb+mh/2,mz-Math.sin(yaw)*sign*(opening+side)/2,side,mh,.68,yaw,.98);
       batch.box(kk,mx,mb+.115,mz,opening,.23,.68,yaw,.97);
       batch.box(kk,mx,mb+mh-.13,mz,opening,.26,.68,yaw,.97);
      }else batch.box(kk,mx,mb+mh/2,mz,mw,mh,.68,yaw,.94+noise(along)*.08);
      batch.box(keyFor(region,'merlones',period,'ashlar'),mx,mb+mh+.025,mz,mw+.05,.05,.73,yaw,.91);
      qa.crowns.push({x:mx,z:mz,bottom:mb,top:mb+mh,regionId:region,slit,yaw,slitCenter:mb+(.23+mh-.26)/2,source:'foto-ricsol-2022',elevation:'visual-estimate'});
     }
    }
    qa.wallBases.push({x:cx,z:cz,bottom:Math.min(ha.base,hb.base),top:Math.max(ha.top,hb.top),component,kind,thickness});
    stats.wallLengthM+=segmentLength;if(perimeter)stats.perimeterLengthM+=segmentLength;
   }
  }
 }
 // Present silhouettes follow different surviving defensive runs. Heights and
 // crenel dimensions are estimated from dated photographs, not a restitution of
 // the nineteenth-century military drawings. The OSM footprint stays unchanged.
 let perimeterArc=0;
 for(let i=0;i<world.length-1;i++){
  const a=world[i],b=world[i+1],cx=(a.x+b.x)/2,cz=(a.z+b.z)/2,r=regionAt(cx,cz),length=Math.hypot(b.x-a.x,b.z-a.z);
  if(length<.07)continue;
  const nx=-(b.z-a.z)/length,nz=(b.x-a.x)/length,inward=inside(cx+nx*3,cz+nz*3,world)?1:-1,northFace=-inward*nz<-.34,southFace=-inward*nz>.34;
  let height=4.3,thickness=2.25,fabric='stone',crown=null,broken=true;
  if(r==='dos-mayo'){height=northFace?4.25:4.85;thickness=2.9;if(northFace)crown={height:.91,spacing:1.92,width:.84,slits:true,loss:.04};}
  else if(r==='ciudadela'){height=northFace?4.55:5.35;thickness=2.75;fabric=southFace?'tapial':'stone';}
  else if(r==='estudiantes'){height=northFace?3.75:4.1;thickness=2.2;if(northFace&&cx< -75)crown={height:.84,spacing:1.80,width:.78,slits:true,loss:.12};}
  else if(r==='san-fernando'){height=southFace?4.8:3.55;thickness=2.3;if(southFace&&cx< -125&&cx> -275)crown={height:.75,spacing:1.85,width:.80,slits:false,loss:.19};else if(cx< -200)fabric='tapial';}
  else if(r==='conejera'){height=4.45;thickness=2.45;}
  else if(r==='almenara'){height=cx>220?3.1:4.7;thickness=2.05;}
  else{height=cz>370?5.75:4.35;thickness=2.45;}
  wall([a,b],{height,thickness,fabric,crown,arcStart:perimeterArc,broken:!crown,seed:400+i*13,perimeter:true,component:'muralla-exterior',coursed:false});
  perimeterArc+=length;
 }
 // Both photographed faces show the gateway rising above its immediate
 // curtain walls. The generic 7.2 m rampart previously overtopped the frontis.
 // Only the two mapped walls adjoining this gate receive a local height cap;
 // their original profile returns smoothly 12–28 m along either flank. These
 // relative 2.9/4.1 m heights are visual estimates, not surveyed elevations.
 const almenaraWallTop=(p,original)=>{
  const g=almenaraGate,dx=p.x-g.x,dz=p.z-g.z,u=dx*Math.cos(g.yaw)-dz*Math.sin(g.yaw);
  const t=clamp((Math.abs(u)-12)/16,0,1),weight=1-t*t*(3-2*t);
  const cap=g.base+(u<0?2.9:4.1)+Math.sin(u*.63)*.10;
  return original+(Math.min(original,cap)-original)*weight;
 };
 const allWays=data.castleWalls||[];
 for(const source of allWays){
  if(FORUM_REPLACED_WALL_IDS.has(String(source.id)))continue;
  const coords=source.coordinates||source.geometry?.coordinates;if(!coords?.length)continue;
  let accepted=false;const points=coords.map(c=>project(...c));
  const roman=ROMAN_WALL_IDS.has(source.id),tabernae=source.name==='Tavernae';
  const idNum=Number(source.id),basilica=roman&&idNum>=733215275&&idNum<=733215286||source.id==='1199456162'||source.id==='1199456163';
  // Unknown wall ways share batches by precinct: their mapped shape is kept,
  // without a separate draw call for every undated survey line.
  const component=roman?(tabernae?'tabernae':basilica?'basilica':'curia'):'lienzos-interiores';
  const explicit=source.height!==null&&source.height!==undefined&&Number.isFinite(Number(source.height));
  // Height 0 is an archaeological trace, never a fallback defensive rampart.
  const h=explicit?(Number(source.height)===0?.16:clamp(Number(source.height),.12,11)):roman?.85:source.id==='733215258'?7.2:['82898193','733219599','733219606'].includes(source.id)?4.8:3.3;
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1],mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
   if(distanceToOutline(mid,world)<.5&&distanceToOutline(a,world)<.7&&distanceToOutline(b,world)<.7){stats.duplicateSegmentsSkipped++;continue;}
   if(!inside(mid.x,mid.z,world)){stats.outsideSegmentsSkipped++;continue;}
   wall([a,b],{height:h,thickness:roman?.68:h<.5?.8:source.id==='733215258'?2.7:1.55,period:roman?'ancient':'unknown',regionId:roman?'armas':null,component,seed:(idNum%1737)+i*11,broken:!roman&&h>1.5,coursed:false,fabric:roman?'forum-stone':null,topCap:['733215258','733215259'].includes(String(source.id))?almenaraWallTop:null});accepted=true;
  }
  if(accepted){stats.wallWayCount++;if(roman)stats.romanWallWays++;}
 }
 function drapedTriangle(a,b,c,positions,offset,cell,component,depth=0){
  const ab={x:(a.x+b.x)/2,z:(a.z+b.z)/2},ac={x:(a.x+c.x)/2,z:(a.z+c.z)/2},bc={x:(b.x+c.x)/2,z:(b.z+c.z)/2};
  const ya=heightAt(a.x,a.z)+offset,yb=heightAt(b.x,b.z)+offset,yc=heightAt(c.x,c.z)+offset;
  const minClearance=Math.min((ya+yb)/2-heightAt(ab.x,ab.z),(ya+yc)/2-heightAt(ac.x,ac.z),(yb+yc)/2-heightAt(bc.x,bc.z),(ya+yb+yc)/3-heightAt((a.x+b.x+c.x)/3,(a.z+b.z+c.z)/3));
  const d=Math.max(Math.hypot(a.x-b.x,a.z-b.z),Math.hypot(a.x-c.x,a.z-c.z),Math.hypot(b.x-c.x,b.z-c.z));
  // Splitting on the sampler's slope changes avoids a short path triangle
  // interpolating below a ridge even though all of its corners are clear.
  if(depth<8&&(d>cell||minClearance<.035)){
   drapedTriangle(a,ab,ac,positions,offset,cell,component,depth+1);drapedTriangle(ab,b,bc,positions,offset,cell,component,depth+1);drapedTriangle(ac,bc,c,positions,offset,cell,component,depth+1);drapedTriangle(ab,bc,ac,positions,offset,cell,component,depth+1);return;
  }
  const signed=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x),order=signed>0?[a,c,b]:[a,b,c];
  for(const p of order){const y=heightAt(p.x,p.z)+offset;positions.push(p.x,y,p.z);if(qa.floorSamples.length<20000)qa.floorSamples.push({x:p.x,y,z:p.z,offset,component});}
 }
 function conformingPolygon(poly,{regionId,component,period='unknown',kind='paving',offset=.10,cell=1.3}={}){
  const px=poly.map(p=>p.x),pz=poly.map(p=>p.z),x0=Math.min(...px),x1=Math.max(...px),z0=Math.min(...pz),z1=Math.max(...pz),key=keyFor(regionId,component,period,kind);
  const boundary=poly.map(p=>new THREE.Vector2(p.x,p.z)),triangles=THREE.ShapeUtils.triangulateShape(boundary,[]);
  // Subdivide each triangle, sampling the *rendered* mesh at every vertex.
  const positions=[];
  for(const t of triangles)drapedTriangle(poly[t[0]],poly[t[1]],poly[t[2]],positions,offset,cell,component);
  batch.raw(key,positions,.97);qa.surfaces.push({component,offset,box:{x0,x1,z0,z1},sampled:true});
 }
 // Mapped pedestrian tracks are independent of the circuit's camera jumps.
 const roads=MAPPED_ROADS.map(r=>(data.roads||[]).find(s=>s.id===r.id)||r);
 for(const road of roads){
  const line=road.coordinates.map(c=>project(...c)),width=road.id==='733215257'?2.4:road.kind==='steps'?1.25:road.surface==='paved'?2.5:2.05;
  for(let k=0;k<line.length-1;k++){
   const a=line[k],b=line[k+1],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);if(l<.1)continue;const nx=-dz/l,nz=dx/l,n=Math.ceil(l/1.1);
   for(let i=0;i<n;i++){
    const t=i/n,u=(i+1)/n,ax=a.x+dx*t,az=a.z+dz*t,bx=a.x+dx*u,bz=a.z+dz*u,cx=(ax+bx)/2,cz=(az+bz)/2;
    const polygon=[{x:ax+nx*width/2,z:az+nz*width/2},{x:bx+nx*width/2,z:bz+nz*width/2},{x:bx-nx*width/2,z:bz-nz*width/2},{x:ax-nx*width/2,z:az-nz*width/2}],p=[];
    for(const piece of outsideGateFloor(polygon))for(let j=1;j<piece.length-1;j++)drapedTriangle(piece[0],piece[j],piece[j+1],p,.095,1.4,'caminos');
    batch.raw(keyFor(regionAt(cx,cz),'caminos','modern','path'),p,.92+noise(i+k*13)*.09);
    qa.routes.push({roadId:road.id,x:cx,z:cz,height:heightAt(cx,cz)+.095,width});stats.routeSegments++;stats.routeLengthM+=l/n;
    if(road.kind==='steps'&&detail==='full'){
     const rise=Math.abs(heightAt(bx,bz)-heightAt(ax,az));if(rise>.14)batch.box(keyFor(regionAt(cx,cz),'escalones','modern','ashlar'),cx,Math.max(heightAt(ax,az),heightAt(bx,bz))+.10,cz,width,.16,.22,-Math.atan2(dz,dx)+Math.PI/2,.94);
    }
   }
  }
 }
 // A portal has a genuine opening through the curtain; no black blocking cube.
 function portal(g){
  if(g.id==='puerta-almenara')return buildAlmenara({THREE,batch,keyFor,g,heightAt,qa,stats,detail});
  const key=keyFor(g.regionId,g.id,g.period,'stone'),ashlar=keyFor(g.regionId,g.id,g.period,'ashlar'),c=Math.cos(g.yaw),s=Math.sin(g.yaw),r=g.width/2,thick=.73,spring=g.height-r,outer=r+thick;
  const tr=(x,y,z)=>[g.x+x*c+z*s,g.base+y,g.z-x*s+z*c];
  const box=(key,x,y,z,w,h,d,tint=1)=>{const p=tr(x,y,z);batch.box(key,p[0],p[1],p[2],w,h,d,g.yaw,tint);};
  for(const sign of[-1,1]){
   box(key,sign*(r+thick*.5),spring*.5,0,thick,spring,g.depth,.96);
   for(let y=.3;y<spring;y+=.48)box(ashlar,sign*(r+thick*.52),y,-g.depth/2-.035,thick*.96,.43,.16,.93+noise(y*19)*.07);
   box(ashlar,sign*(r+.21),spring-.09,-g.depth/2-.10,.48,.21,.4,.95);
  }
  const steps=19;
  for(let i=0;i<steps;i++){
   const a=i*Math.PI/steps,b=(i+1)*Math.PI/steps,p=[],gap=.007;
   const pt=(radius,angle,z)=>tr(Math.cos(angle)*radius,spring+Math.sin(angle)*radius,z);
   const a0=pt(r,a+gap,-g.depth/2),b0=pt(r,b-gap,-g.depth/2),a1=pt(outer,a+gap,-g.depth/2),b1=pt(outer,b-gap,-g.depth/2),a2=pt(r,a+gap,g.depth/2),b2=pt(r,b-gap,g.depth/2),a3=pt(outer,a+gap,g.depth/2),b3=pt(outer,b-gap,g.depth/2);
   quad(p,a0,b0,b1,a1);quad(p,b2,a2,a3,b3);quad(p,a2,b2,b0,a0);quad(p,a1,b1,b3,a3);quad(p,a0,a1,a3,a2);quad(p,b1,b0,b2,b3);batch.raw(ashlar,p,.9+noise(i*17)*.12);
   // Spandrel follows the voussoir top instead of bridging the empty arch.
   const x1=Math.cos(a)*outer,x2=Math.cos(b)*outer,y1=spring+Math.sin(a)*outer,y2=spring+Math.sin(b)*outer,v=[];
   quad(v,tr(x1,y1,-g.depth/2),tr(x2,y2,-g.depth/2),tr(x2,g.top,-g.depth/2),tr(x1,g.top,-g.depth/2));
   quad(v,tr(x2,y2,g.depth/2),tr(x1,y1,g.depth/2),tr(x1,g.top,g.depth/2),tr(x2,g.top,g.depth/2));batch.raw(key,v,.96);
  }
  box(key,0,g.top-.35,0,outer*2,.7,g.depth,.96);
  for(const sign of[-1,1])box(key,sign*(outer+.45),g.top*.5,0,.9,g.top,g.depth,.93);
  box(ashlar,0,g.top+.12,0,(outer+.45)*2,.24,g.depth+.22,.91);
  if(g.id==='puerta-almenara'){
   // Surviving tall screen and the narrow upper loophole are schematic elevations.
   for(const sign of[-1,1])box(ashlar,sign*.42,g.height+1.65,-g.depth/2-.07,.12,.72,.12,.9);
   box(keyFor(g.regionId,g.id,g.period,'wood'),0,g.height+1.65,-g.depth/2-.035,.62,.59,.035,.76);
  }
  qa.portals.push({...g,openingBottom:g.base,openingCrown:g.base+g.height});stats.gates.push({id:g.id,coordinates:g.coordinate,width:g.width,height:g.height,depth:g.depth,opening:true,planConfidence:'OSM path / wall intersection',elevationConfidence:'interpretive'});
 }
 gates.forEach(portal);
 // Identified surviving forum: north temple, NE curia, W basilica, E tabernae.
 const from=(coordinates)=>coordinates.map(c=>project(...c));
 buildForum({THREE,batch,keyFor,project,heightAt,qa,stats,detail,conformingPolygon,wall,forumLevel:localGround.level});
 // South forum cistern: its long covered footprint remains under the terrace.
 // Dimensions come from Civera 2007; position is aligned to the municipal forum
 // plan and PNOA, with metres of uncertainty. No below-ground spaces are exposed.
 const cisternCenter=project(-.27660,39.67561),cisternYaw=-.15,cc=Math.cos(cisternYaw),cs=Math.sin(cisternYaw),cisternLocal=(x,z)=>({x:cisternCenter.x+x*cc+z*cs,z:cisternCenter.z-x*cs+z*cc});
 const cisternCorners=[cisternLocal(-32.8,-2.07),cisternLocal(32.8,-2.07),cisternLocal(32.8,2.07),cisternLocal(-32.8,2.07)];
 // Only the unoccupied terrace ends are traced; present-day museum roofs above
 // the western part keep priority over this interpretive archaeological footprint.
 const occupied=MAPPED_BUILDINGS.filter(b=>['82897960','cat-3555856YJ3935N_part1-0'].includes(b.id)).map(b=>from(b.coordinates));
 for(let side of[-1,1])for(let x=-32.8;x<32.8;x+=1.5){const a=cisternLocal(x,side*2.07),b=cisternLocal(Math.min(x+1.42,32.8),side*2.07),m={x:(a.x+b.x)/2,z:(a.z+b.z)/2};if(occupied.some(p=>inside(m.x,m.z,p)))continue;wall([a,b],{height:.19,thickness:.33,period:'ancient',component:'cisterna-foro',seed:901,regionId:'armas',gateCuts:false});}
 qa.cistern={id:'cisterna-foro',length:65.6,width:4.14,documentedVaultHeight:3.45,documentedCentralPiers:21,coordinateConfidence:'approximate-plan-alignment',undergroundVisible:false,corners:cisternCorners};
 // No footprint is invented for the northern cistern: its focus is a documented
 // sector, not a claim of a georeferenced excavation position.
 function roofPolygon(poly,height,key,tint=1){
  const shape=poly.map(p=>new THREE.Vector2(p.x,p.z)),triangles=THREE.ShapeUtils.triangulateShape(shape,[]),p=[];
  for(const t of triangles){const a=poly[t[0]],b=poly[t[1]],c=poly[t[2]],signed=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);for(const q of signed>0?[a,c,b]:[a,b,c])p.push(q.x,height,q.z);}
  batch.raw(key,p,tint);
 }

 // IPCE, Inventario de la telegrafía óptica (2012), L2_32: 5.7 x 5.7 m.
 // Current roofless survivor, not the original complete telegraph installation.
 // N/S openings and blind E/W faces follow the inventory. Heights are estimated
 // from present photographs; the southern plinth follows the actual mesh.
 function telegraphTower(){
  const coordinate=[-.281978,39.676237],p=project(...coordinate),half=2.85,thick=.56,bodyHeight=5.8;
  const corners=[[-half,-half],[half,-half],[half,half],[-half,half]].map(([x,z])=>({x:p.x+x,z:p.z+z}));
  const base=Math.max(...corners.map(q=>heightAt(q.x,q.z)))+.08,key=keyFor('ciudadela','telegrafo','modern','stone'),brick=keyFor('ciudadela','telegrafo','modern','brick');
  const box=(kind,x,y,z,w,h,d)=>batch.box(kind,p.x+x,base+y,p.z+z,w,h,d,0,.97);
  for(let i=0;i<4;i++){
   const a=corners[i],b=corners[(i+1)%4],positions=[],bottomA=heightAt(a.x,a.z)-.23,bottomB=heightAt(b.x,b.z)-.23;
   quad(positions,[b.x,bottomB,b.z],[a.x,bottomA,a.z],[a.x,base+.05,a.z],[b.x,base+.05,b.z]);batch.raw(key,positions,.93);
  }
  for(const side of[-1,1]){
   // East and west faces are solid. The narrow cap is irregular, not crenellated.
   box(key,side*(half-thick/2),bodyHeight/2,0,thick,bodyHeight,5.7);
   const z=side*(half-thick/2),opening=1.02,leg=(5.7-opening)/2;
   for(const sign of[-1,1])box(key,sign*(opening+leg)/2,bodyHeight/2,z,leg,bodyHeight,thick);
   box(key,0,.075,z,opening,.15,thick);
   box(key,0,(2.24+3.68)/2,z,opening,3.68-2.24,thick);
   // The upper opening is a small square, rather than an invented balcony.
   const upper=.62;
   for(const sign of[-1,1])box(key,sign*(upper+(opening-upper)/2)/2,(3.68+4.40)/2,z,(opening-upper)/2,4.40-3.68,thick);
   box(key,0,(4.40+bodyHeight)/2,z,opening,bodyHeight-4.40,thick);
   for(const [y,w,h]of[[.15,1.02,2.09],[3.68,.62,.72]]){
    for(const sign of[-1,1])box(brick,sign*(w/2+.11),y+h/2,side*(half+.015),.22,h+.22,.07);
    box(brick,0,y+h+.105,side*(half+.018),w+.44,.21,.08);
    box(brick,0,y-.045,side*(half+.025),w+.40,.10,.11);
   }
  }
  // Brick quoins and the band between floors are the tower's identifying fabric.
  for(const x of[-1,1])for(const z of[-1,1])for(let row=0;row<22;row++){
   const y=.13+row*.255,w=row%2?.42:.62;
   box(brick,x*(half-.20),y,z*(half+.008),w,.225,.055);
   box(brick,x*(half+.008),y,z*(half-.20),.055,.225,w);
  }
  for(const side of[-1,1]){
   box(brick,0,2.70,side*(half+.045),5.78,.17,.13);
   box(brick,side*(half+.045),2.70,0,.13,.17,5.78);
   // Surviving rough cap: the missing roof and upper loss remain visible.
   for(let i=0;i<9;i++){
    const d=-2.52+i*.63,h=.06+noise(i+side*37)*.18;
    box(key,d,bodyHeight+h/2,side*(half-thick/2),.64,h,thick);
    box(key,side*(half-thick/2),bodyHeight+h/2,d,thick,h,.64);
   }
  }
  // A dark interior floor makes the real apertures read as depth at close range.
  batch.box(keyFor('ciudadela','telegrafo','modern','rubble'),p.x,base+.045,p.z,4.55,.08,4.55,0,.72);
  if(detail==='full')for(const dx of[-1.8,1.8])batch.cylinder(keyFor('ciudadela','telegrafo','modern','metal'),p.x+dx,base+bodyHeight+.75,p.z-1.75,.021,.021,1.5,.76,6);
  qa.features.push({id:'telegrafo',coordinate,width:5.7,depth:5.7,base,bodyHeight,roof:false,openings:['north-door','south-door','north-window','south-window'],blindFaces:['east','west'],orientation:'approximately-cardinal',source:'ipce-telegrafia',heightConfidence:'photographic-estimate'});
 }
 telegraphTower();
 function pitchedRoof(poly,top,{regionId,component,period,rise=1.15,kind='tile'}={}){
  let longest=0,axis={x:1,z:0};
  for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],l=Math.hypot(b.x-a.x,b.z-a.z);if(l>longest){longest=l;axis={x:(b.x-a.x)/l,z:(b.z-a.z)/l};}}
  const clockwise=poly.reduce((sum,p,i)=>sum+p.x*poly[(i+1)%poly.length].z-poly[(i+1)%poly.length].x*p.z,0)>0;
  const normal={x:-axis.z,z:axis.x},values=poly.map(p=>p.x*normal.x+p.z*normal.z),v0=Math.min(...values),v1=Math.max(...values),ridge=(v0+v1)/2,span=(v1-v0)/2;
  const v=p=>p.x*normal.x+p.z*normal.z-ridge,roofY=p=>top+rise*Math.max(0,1-Math.abs(v(p))/span);
  function clip(sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],va=v(a)*sign,vb=v(b)*sign;if(va>=-.00001)out.push(a);if(va*vb<0){const t=va/(va-vb);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return out;}
  for(const sign of[-1,1]){
   const piece=clip(sign);if(piece.length<3)continue;
   const tris=THREE.ShapeUtils.triangulateShape(piece.map(p=>new THREE.Vector2(p.x,p.z)),[]),positions=[];
   for(const tri of tris){const a=piece[tri[0]],b=piece[tri[1]],c=piece[tri[2]],signed=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);for(const q of signed>0?[a,c,b]:[a,b,c])positions.push(q.x,roofY(q),q.z);}
   batch.raw(keyFor(regionId,component,period,kind),positions,.98);
  }
  // Close gables and short irregular returns along the surveyed perimeter.
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],line=[a];if(v(a)*v(b)<0){const t=v(a)/(v(a)-v(b));line.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}line.push(b);
   for(let j=0;j<line.length-1;j++){const a=line[j],b=line[j+1],positions=[];if(clockwise)quad(positions,[b.x,top,b.z],[a.x,top,a.z],[a.x,roofY(a),a.z],[b.x,roofY(b),b.z]);else quad(positions,[a.x,top,a.z],[b.x,top,b.z],[b.x,roofY(b),b.z],[a.x,roofY(a),a.z]);batch.raw(keyFor(regionId,component,period,'stone'),positions,.93);}
  }
  return {type:'pitched',ridgeHeight:top+rise,axis,source:'foto-ricsol-2022',elevation:'visual-estimate'};
 }
 const buildings=MAPPED_BUILDINGS.map(b=>(data.buildings||[]).find(s=>s.id===b.id)||b);
 for(const building of buildings){
  let poly=from(building.coordinates);if(poly.length>2&&Math.hypot(poly[0].x-poly.at(-1).x,poly[0].z-poly.at(-1).z)<.02)poly=poly.slice(0,-1);
  const center={x:poly.reduce((s,p)=>s+p.x,0)/poly.length,z:poly.reduce((s,p)=>s+p.z,0)/poly.length},regionId=regionAt(center.x,center.z),ruin=building.kind==='ruins',component=building.id==='180732338'?'antiquarium':'edificio-'+building.id;
  if(ruin){wall([...poly,poly[0]],{height:building.id==='733215260'?2.2:1.1,thickness:.8,component,regionId,gateCuts:false,seed:Number(building.id)%217});stats.mappedBuildings++;continue;}
  const period=['180732338','1199456167','82897960','cat-3555856YJ3935N_part1-0'].includes(building.id)?'modern':'unknown',h=({'180732338':3.35,'82897960':4.0,'cat-3555856YJ3935N_part1-0':3.7,'1199456167':4.1})[building.id]||clamp(building.surfaceHeightEstimate||building.height||5,3,8),base=Math.max(...poly.map(p=>heightAt(p.x,p.z)))+.08,top=base+h;
  const key=keyFor(regionId,component,period,'stone'),clockwise=poly.reduce((s,p,i)=>s+p.x*poly[(i+1)%poly.length].z-poly[(i+1)%poly.length].x*p.z,0)>0;
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],l=Math.hypot(b.x-a.x,b.z-a.z);if(l<.05)continue;
   const positions=[],bottomA=Math.min(base,heightAt(a.x,a.z)-.2),bottomB=Math.min(base,heightAt(b.x,b.z)-.2);
   if(clockwise)quad(positions,[b.x,bottomB,b.z],[a.x,bottomA,a.z],[a.x,top,a.z],[b.x,top,b.z]);else quad(positions,[a.x,bottomA,a.z],[b.x,bottomB,b.z],[b.x,top,b.z],[a.x,top,a.z]);batch.raw(key,positions,.94+noise(i*19)*.09);
   // A roof edge and modest recesses describe the mapped present building;
   // opening counts and elevations remain explicitly interpretive.
   const yaw=-Math.atan2(b.z-a.z,b.x-a.x),nx=-(b.z-a.z)/l,nz=(b.x-a.x)/l;
   batch.box(keyFor(regionId,component,period,'ashlar'),(a.x+b.x)/2,top-.20,(a.z+b.z)/2,l,.2,.38,yaw,.94);
   if(l>7&&h>4&&detail==='full')for(let j=1;j<Math.floor(l/4.7);j++){
    const t=j/Math.floor(l/4.7),x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
    for(const side of[-1,1]){
     batch.box(keyFor(regionId,component,period,'glass'),x+nx*.025*side,base+h*.54,z+nz*.025*side,1.05,1.6,.055,yaw,.9);
     batch.box(keyFor(regionId,component,period,'ashlar'),x+nx*.06*side,base+h*.54-.87,z+nz*.06*side,1.2,.12,.18,yaw,.9);
    }
   }
  }
  const pitched=['180732338','82897960','cat-3555856YJ3935N_part1-0'].includes(building.id);
  const roof=pitched?pitchedRoof(poly,top,{regionId,component,period,rise:building.id==='180732338'?1.12:1.55}):{type:'flat',ridgeHeight:top,source:'mapped-current-footprint'};
  if(!pitched){
   roofPolygon(poly,top,keyFor(regionId,component,period,'roof'),.95);
   for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],l=Math.hypot(b.x-a.x,b.z-a.z);batch.box(keyFor(regionId,component,period,'ashlar'),(a.x+b.x)/2,top+.10,(a.z+b.z)/2,l,.20,.21,-Math.atan2(b.z-a.z,b.x-a.x),.94);}
  }
  qa.buildings.push({id:building.id,component,base,top:roof.ridgeHeight,eaveHeight:top,terrainMaximum:Math.max(...poly.map(p=>heightAt(p.x,p.z))),period,roof,polygon:poly});stats.mappedBuildings++;
 }
 const resources=batch.finish(group);
 for(const mesh of group.children)if(mesh.isMesh){const d=mesh.userData;
  d.publicWalkingSurface=d.component==='almenara-suelo'&&d.materialKind==='path'||d.component==='foro'&&d.materialKind==='forum-earth';
 }
 group.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(group),regions=REGION_DEFS.map(region=>{
  const box=new THREE.Box3();for(const child of group.children)if(child.userData.regionId===region.id)box.union(child.geometry.boundingBox);
  const p=project(...region.coordinates);return{id:region.id,label:region.label,coordinate:region.coordinates,period:'unknown',planConfidence:'visitor segmentation of current mapped structures; no newly surveyed polygon',bounds:box,center:new THREE.Vector3(p.x,heightAt(p.x,p.z),p.z)};
 });
 const focuses={},sourceStops=new Map((visitData?.stops||[]).map(stop=>[stop.id,stop]));
 const componentFor={acceso:['acceso'],'puerta-almenara':['puerta-almenara','almenara-suelo'],'puerta-san-fernando':['puerta-san-fernando'],foro:['foro','templo','curia','basilica','tabernae'],templo:['templo'],curia:['curia'],basilica:['basilica'],'cisterna-foro':['cisterna-foro'],'cisterna-norte':['templo'],inscripcion:['foro'],antiquarium:['antiquarium']};
 for(const[id,label,regionId,coordinates,radius]of DEFAULT_STOPS){
  const source=sourceStops.get(id),coord=source?.coordinate||source?.coordinates||coordinates,p=project(...coord),target=new THREE.Vector3(p.x,heightAt(p.x,p.z)+2.2,p.z);
  let focusBounds=new THREE.Box3();
  if(id==='conjunto')focusBounds.copy(bounds);
  else if(REGION_DEFS.some(r=>r.id===id))focusBounds.copy(regions.find(r=>r.id===id).bounds);
  else for(const child of group.children)if(componentFor[id]?.includes(child.userData.component))focusBounds.union(child.geometry.boundingBox);
  if(focusBounds.isEmpty()||['cisterna-norte','inscripcion'].includes(id))focusBounds.setFromCenterAndSize(target,new THREE.Vector3(radius*2,10,radius*2));
  // A documented point stays the target; the overview instead centers all fabric.
  if(id==='conjunto')focusBounds.getCenter(target);
  if(id==='puerta-almenara')target.y=almenaraGate.base+4.2;
  const size=focusBounds.getSize(new THREE.Vector3()),distance=id==='conjunto'?1250:Math.max(radius*2.05,Math.max(size.x,size.z)*1.85,42);
  const direction=id==='puerta-almenara'||id==='puerta-san-fernando'?new THREE.Vector3(-.78,.62,.25):id==='basilica'?new THREE.Vector3(-.49,.88,.58):new THREE.Vector3(.23,.82,.70);
  direction.normalize();const offset=direction.clone().multiplyScalar(distance).toArray(),closeOffset=direction.clone().multiplyScalar(Math.max(20,distance*.57)).toArray();
  if(id==='acceso'){offset.splice(0,3,-36,30,-30);closeOffset.splice(0,3,-18,15,-20);}
  if(id==='foro'){offset.splice(0,3,-50,62,-60);closeOffset.splice(0,3,-26,26,-34);}
  if(id==='puerta-almenara'){offset.splice(0,3,-24,7.5,8);closeOffset.splice(0,3,-15,1.4,4.5);}
  if(id==='puerta-san-fernando'){offset.splice(0,3,34,24,11);closeOffset.splice(0,3,19,11,7);}
  // Clamp both camera heights to the supplied mesh for every preset.
  for(const v of[offset,closeOffset])v[1]=Math.max(v[1],heightAt(target.x+v[0],target.z+v[2])+4-target.y);
  focuses[id]={id,label:source?.title||source?.label||label,regionId,coordinates:coord,target,offset,closeOffset,bounds:focusBounds,sourceConfidence:source?.coordinateConfidence||'approximate documented sector',components:componentFor[id]||[],kind:REGION_DEFS.some(r=>r.id===id)?'precinct':id==='conjunto'?'overview':'feature'};
 }
 // Subtle ground ring marks the selected *visit point*; it does not pretend to
 // outline an excavation for which no georeferenced plan exists.
 const markerGeometry=new THREE.BufferGeometry(),markerMaterial=new THREE.LineBasicMaterial({color:'#91d5ca',transparent:true,opacity:.95,depthTest:true}),marker=new THREE.Line(markerGeometry,markerMaterial);marker.name='Parada seleccionada del castillo';marker.visible=false;marker.renderOrder=3;marker.userData.selectionHelper=true;group.add(marker);
 let selected=null,readingMode='materials';
 function applyMaterials(){
  const focus=selected?focuses[selected]:null;
  for(const mesh of group.children){if(!mesh.isMesh||!mesh.userData.castleFabric)continue;const d=mesh.userData,m=mesh.material;
   const nextMap=readingMode==='periods'?null:d.baseMap;if(m.map!==nextMap){m.map=nextMap;m.needsUpdate=true;}
   m.color.copy(d.baseColor);
   if(readingMode==='periods')m.color.set(PERIOD_COLORS[d.period]||PERIOD_COLORS.unknown);
   const match=focus&&(focus.kind==='overview'||focus.kind==='precinct'&&d.regionId===focus.regionId||focus.components.includes(d.component));
   m.emissive.set(match?'#3e776b':'#000000');m.emissiveIntensity=match?.16:0;
  }
 }
 function selectFocus(id){
  selected=id&&focuses[id]?id:null;applyMaterials();marker.visible=!!selected&&selected!=='conjunto';
  if(marker.visible){const f=focuses[selected],p=f.target,r=f.kind==='precinct'?8.2:3.8,positions=[];for(let i=0;i<=80;i++){const a=i*TAU/80,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;positions.push(x,heightAt(x,z)+.23,z);}markerGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));markerGeometry.computeBoundingSphere();}
  return selected?focuses[selected]:null;
 }
 function setReadingMode(mode){readingMode=mode==='periods'?'periods':'materials';applyMaterials();return readingMode;}
 stats.triangles=0;stats.meshes=0;group.traverse(o=>{if(o.isMesh){stats.meshes++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 group.userData={id:'castle',label:'Castillo de Sagunto',interpretation:true,cartographicOutline:true,visit:{focuses,regions,bounds,stats,selectFocus,setReadingMode,getState:()=>({selected,readingMode}),qa},ownedResources:{materials:resources.materials,textures:resources.textures},metadata:{plan:'Mapped present-day footprint and walls',fabric:'Surviving temple foundations distinguished from restitutions; three curia steps and fragment groups; thin Almenara facade with chamber, rear arch and physical openings; mixed masonry curtains and current precincts',elevations:'Approximate from photographs; footprints mapped; telegraph width 5.7 m from IPCE inventory; no complete historical reconstruction',cisternaNorte:'Sector focus only; no invented footprint',selection:'Camera itinerary; not a walking accessibility route'}};
 return group;
}
