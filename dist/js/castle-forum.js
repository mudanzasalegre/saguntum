// Surviving forum fabric, not a restitution of the Augustan buildings.
// Planimetric anchors: mapped OSM remains and the municipal Plan Director (2000,
// sheet 80). Local archaeological form: Aranegui 1991, figs 6 and 7, pp 71–72.
// Fig 6 records incomplete remains; fig 7 restores their missing symmetry.
// Elevations and the positions of movable lapidary pieces remain estimates.

export const FORUM_SURFACE_DEFS = [
  {id:'foro',component:'foro',walkable:true,kind:'forum-earth',coordinates:[
    [-.276737,39.676246],[-.276350,39.676304],[-.276270,39.675924],[-.276657,39.675867]
  ]},
  {id:'basilica',component:'basilica',walkable:false,kind:'forum-earth',coordinates:[
    [-.277097,39.676040],[-.276806,39.676061],[-.276746,39.675777],[-.277039,39.675735]
  ]},
  {id:'templo',component:'templo',walkable:false,kind:'forum-earth',coordinates:[
    [-.276957,39.676271],[-.276789,39.676294],[-.276856,39.676463],[-.276788,39.676464],
    [-.276567,39.676485],[-.2765399,39.6762779],[-.276737,39.676246]
  ]},
  {id:'curia',component:'curia',walkable:false,kind:'forum-gravel',coordinates:[
    [-.276567,39.676485],[-.276253,39.676478],[-.2762671,39.6763178],[-.2765399,39.6762779]
  ]},
  {id:'tabernae',component:'tabernae',walkable:false,kind:'forum-earth',coordinates:[
    [-.276350,39.676304],[-.2762671,39.6763178],[-.2762002,39.6759035],[-.276270,39.675924]
  ]}
];

// Rebuilt here with the same cartographic alignment and a raised curia landing.
export const FORUM_REPLACED_WALL_IDS = new Set(['733215272','733215273','733215274']);

const TAU=Math.PI*2;
const variation=n=>{const v=Math.sin(n*63.17+17.9)*43758.5453;return v-Math.floor(v);};
const CURIA_WALLS=[
  [[-.2764849,39.6764302],[-.276469,39.6763428],[-.2764655,39.6763241],[-.2765458,39.6763175]],
  [[-.276469,39.6763428],[-.2764106,39.676346],[-.2764067,39.6763311],[-.2762814,39.6763513]]
];

/** Build conserved foundations, excavation finishes and identifiable fragments.
 * Relative grades are supplied by the common castle ground model. The optional
 * level is its local forum datum, not a measured archaeological altitude.
 */
export function buildForum({THREE,batch,keyFor,project,heightAt,qa,stats,detail='full',conformingPolygon,forumLevel}={}){
  const from=coordinates=>coordinates.map(c=>project(...c));
  const center=project(-.27655,39.67603);
  const datum=Number.isFinite(forumLevel)?forumLevel:heightAt(center.x,center.z);
  const full=detail==='full';
  const key=(component,kind='forum-stone',period='ancient')=>keyFor('armas',component,period,kind);
  const addQuad=(p,a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
  qa.forum={
    datum,datumConfidence:'visual-relative-levels-anchored-to-local-ground',
    surfaces:[],foundationComponents:['templo','curia','basilica','tabernae'],
    fragments:[],stairs:[],walls:[],
    sources:['plan-director-2000','templo-aranegui-1991','foro-terrazas-1998','aranegui-2004','foto-ricsol-2022'],
    ancientPlazaDimensions:[54,36],fullAncientPlazaReinstated:false,
    coordinateConfidence:'approximate-alignment-of-documented-remains-to-mapped-footprints'
  };

  // Separate contiguous finishes replace the aerial-photo shadows at ground
  // level. They use the actual rendered sampler, including excavation grades.
  for(const def of FORUM_SURFACE_DEFS){
    const polygon=from(def.coordinates);
    conformingPolygon(polygon,{regionId:'armas',component:def.component,period:'unknown',kind:def.kind,offset:.125,cell:.85});
    qa.forum.surfaces.push({id:def.id,component:def.component,polygon,walkable:def.walkable,offset:.125,materialKind:def.kind});
  }
  // The narrow western margin connects the central surface to the exposed
  // basilica foundations. Its perimeter shares the existing cartographic edges.
  const westMargin=from([[-.276737,39.676246],[-.276657,39.675867],[-.276746,39.675777],[-.276806,39.676061],[-.276957,39.676271]]);
  conformingPolygon(westMargin,{regionId:'armas',component:'foro',period:'unknown',kind:'forum-gravel',offset:.125,cell:.85});
  qa.forum.surfaces.push({id:'margen-occidental',component:'foro',polygon:westMargin,walkable:false,offset:.125,materialKind:'forum-gravel'});
  // Finish only the interior wedge between the north-west curtain and the
  // basilica edge. This is deliberately not a new ground-grading footprint.
  // It hides the aerial photograph's baked shadows without changing the slope.
  const northWestFinish=from([
    [-.276980,39.676278],[-.276943,39.676056],[-.276806,39.676061],[-.276957,39.676271]
  ]);
  conformingPolygon(northWestFinish,{regionId:'armas',component:'foro',period:'unknown',kind:'forum-gravel',offset:.145,cell:.75});
  qa.forum.surfaces.push({id:'pie-muro-noroeste-basilica',component:'foro',polygon:northWestFinish,walkable:false,offset:.145,materialKind:'forum-gravel',gradeChanged:false});

  // Worn individual blocks. The small bevels and chips affect silhouettes rather
  // than repeating a masonry bitmap over an already modelled stone block.
  function block(component,x,bottom,z,w,h,d,yaw=0,seed=1,kind='worn-ashlar'){
    if(h<=0||w<=0||d<=0)return;
    const b=Math.min(w,d)*.085;
    const outline=[[-w/2+b,-d/2],[w/2-b,-d/2],[w/2,-d/2+b],[w/2,d/2-b],[w/2-b,d/2],[-w/2+b,d/2],[-w/2,d/2-b],[-w/2,-d/2+b]];
    const c=Math.cos(yaw),s=Math.sin(yaw),lower=[],upper=[],positions=[];
    for(let i=0;i<outline.length;i++){
      const[u,v]=outline[i],edge=(variation(seed+i*11)-.5)*Math.min(.055,h*.13);
      lower.push([x+u*c+v*s,bottom,z-u*s+v*c]);
      upper.push([x+u*c+v*s,bottom+h+edge,z-u*s+v*c]);
    }
    for(let i=0;i<outline.length;i++){
      const j=(i+1)%outline.length;
      addQuad(positions,lower[j],lower[i],upper[i],upper[j]);
    }
    for(let i=1;i<outline.length-1;i++){
      positions.push(...upper[0],...upper[i+1],...upper[i]);
      positions.push(...lower[0],...lower[i],...lower[i+1]);
    }
    batch.raw(key(component,kind),positions,.91+variation(seed*7)*.10);
  }

  // A low, incomplete foundation is represented with exposed courses of stones.
  // Changes in thickness and surviving height are architectural interpretation;
  // the mapped plan itself is not scattered or randomly expanded.
  function foundation(line,{component,thickness=.85,height=.8,seed=10,base=null}={}){
    for(let j=0;j<line.length-1;j++){
      const a=line[j],b=line[j+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
      if(len<.05)continue;
      const yaw=-Math.atan2(dz,dx),unit=full?.86:1.42,n=Math.max(1,Math.ceil(len/unit));
      for(let i=0;i<n;i++){
        const t=(i+.5)/n,x=a.x+dx*t,z=a.z+dz*t;
        const floor=(base===null?heightAt(x,z)+.10:base)-.10;
        const top=height*(.79+variation(seed+j*73+i*7)*.25);
        const rows=full?Math.max(1,Math.round(top/.29)):1;
        const across=full&&thickness>1.15?2:1;
        for(let row=0;row<rows;row++)for(let k=0;k<across;k++){
          const u=(k-(across-1)/2)*thickness/across,xx=x+Math.sin(yaw)*u,zz=z+Math.cos(yaw)*u;
          block(component,xx,floor+top*row/rows,zz,len/n-.022,top/rows-.015,thickness/across-.025,yaw,seed+j*137+i*13+row*31+k*19,'forum-stone');
        }
        qa.wallBases.push({x,z,bottom:floor,top:floor+top,component,kind:'forum-stone',thickness});
        qa.forum.walls.push({component,x,z,bottom:floor,top:floor+top,thickness});
      }
    }
  }

  // Temple: fig 6 is the survey of the surviving western and central rooms,
  // fig 7 is a proposed symmetrical three-cella reconstruction. Only the former
  // controls the rendered footprint. In particular there is no complete eastern
  // cella and no full four-step monumental stair invented in front of the ruin.
  const templeOrigin=project(-.276777,39.676439);
  const temple=(x,z)=>({x:templeOrigin.x+x,z:templeOrigin.z+z});
  const templeLine=points=>points.map(([x,z])=>temple(x,z));
  const templeWalls=[
    {id:'oeste',points:[[.85,.85],[.85,13.9]],w:1.70,h:.73},
    {id:'cabecera',points:[[.85,.85],[8.45,.85]],w:1.70,h:.66},
    {id:'division-conservada',points:[[4.20,1.6],[4.20,6.45]],w:1.20,h:.57},
    {id:'cierre-cellae',points:[[1.4,6.80],[7.95,6.80]],w:1.20,h:.63},
    {id:'este-fragmentario',points:[[7.8,2.2],[7.68,4.35],[8.12,6.9]],w:1.40,h:.43},
    {id:'cierre-pronaos',points:[[1.6,10.95],[7.65,10.95]],w:1.70,h:.56},
    {id:'anta-este-fragmentaria',points:[[7.90,10.95],[7.75,12.65]],w:1.30,h:.41}
  ];
  templeWalls.forEach((w,i)=>foundation(templeLine(w.points),{component:'templo',thickness:w.w,height:w.h,seed:201+i*71}));
  // The broken eastern edge is represented by only the small cluster visible
  // in the survey. It is not closed into the missing reconstructed third room.
  const templeFragments=[[8.38,5.10,.78,.27,.60],[8.56,7.42,.66,.29,.76],[8.28,8.25,.81,.23,.61],[8.53,10.18,.57,.20,.54]];
  for(const[x,z,w,h,d]of templeFragments){const p=temple(x,z);block('templo',p.x,heightAt(p.x,p.z)+.09,p.z,w,h,d,.13,Math.round(x*z*9),'forum-stone');}
  qa.forum.temple={
    preservedCompartments:2,thirdCellaRestored:false,pronaos:true,completeEasternWall:false,
    measuredRestitutionEnvelope:{width:11.90,length:14.28},
    documentedPerimeterThickness:1.70,documentedInternalThickness:[1.20,1.40],
    source:'Aranegui 1991, fig 6 (survey) distinguished from fig 7 (metrological restitution)',
    walls:templeWalls.map(w=>({id:w.id,thickness:w.w,height:w.h})),elevationConfidence:'estimated-surviving-heights'
  };
  qa.features.push({id:'templo-restos',count:2,source:'templo-aranegui-1991',condition:'two-preserved-compartments-broken-east-edge',reconstructedCellaCount:3,reconstructedThirdCellaDrawn:false});

  // Curia: a raised portico/sala is reached by three stone steps. The surviving
  // bases are moulded Attic bases without a square plinth, with short fluted
  // shafts. No complete five-column ancient facade is restored here.
  const curiaOrigin=project(-.2764478,39.6762914),curiaYaw=.187;
  const c=Math.cos(curiaYaw),s=Math.sin(curiaYaw);
  const local=(u,v)=>({x:curiaOrigin.x+u*c+v*s,z:curiaOrigin.z-u*s+v*c});
  const curiaPlatformCenterline=from([
    [-.2765399,39.6762779],[-.2762671,39.6763178],[-.2762814,39.6763513],
    [-.276301,39.676452],[-.2764849,39.6764302],[-.276548,39.676329]
  ]);
  // Mapped walls are centre-lines. The raised support must reach beneath their
  // full thickness; ending it at the line leaves the outward half unsupported.
  // Offset the platform edge, not the excavation/ground-grading polygon.
  const platformArea=curiaPlatformCenterline.reduce((v,a,i)=>{const b=curiaPlatformCenterline[(i+1)%curiaPlatformCenterline.length];return v+a.x*b.z-b.x*a.z;},0);
  const outward=(a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),side=platformArea>0?1:-1;return{x:side*dz/len,z:-side*dx/len};};
  const curiaPlatform=curiaPlatformCenterline.map((p,i,poly)=>{
    const before=outward(poly[(i+poly.length-1)%poly.length],p),after=outward(p,poly[(i+1)%poly.length]);
    const length=Math.hypot(before.x+after.x,before.z+after.z),mx=(before.x+after.x)/length,mz=(before.z+after.z)/length;
    const distance=.67/Math.max(.4,mx*after.x+mz*after.z);
    return{x:p.x+mx*distance,z:p.z+mz*distance};
  });
  const floor=datum+.125,landing=floor+.60;
  const platformShape=curiaPlatform.map(p=>new THREE.Vector2(p.x,p.z));
  const platformTriangles=THREE.ShapeUtils.triangulateShape(platformShape,[]),platformTop=[];
  for(const t of platformTriangles){
    const a=curiaPlatform[t[0]],b=curiaPlatform[t[1]],d=curiaPlatform[t[2]],cross=(b.x-a.x)*(d.z-a.z)-(b.z-a.z)*(d.x-a.x);
    for(const p of cross>0?[a,d,b]:[a,b,d])platformTop.push(p.x,landing,p.z);
  }
  batch.raw(key('curia','forum-gravel','unknown'),platformTop,.99);
  // Close exposed platform edges down into the sampled ground. The actual
  // access gap is left for the steps instead of a hidden blocking box.
  for(let j=0;j<curiaPlatform.length;j++){
    const a=curiaPlatform[j],b=curiaPlatform[(j+1)%curiaPlatform.length],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),n=Math.ceil(len/.85),yaw=-Math.atan2(dz,dx);
    for(let i=0;i<n;i++){
      const t=(i+.5)/n,x=a.x+dx*t,z=a.z+dz*t,u=(x-curiaOrigin.x)*c-(z-curiaOrigin.z)*s;
      if(j===0&&Math.abs(u)<1.85)continue;
      const bottom=Math.min(heightAt(x,z)+.06,landing-.08);
      block('curia',x,bottom,z,len/n-.014,landing-bottom,.55,yaw,401+j*53+i,'forum-stone');
    }
  }
  qa.forum.surfaces.push({id:'curia-rellano',component:'curia',polygon:curiaPlatform,walkable:false,height:landing,materialKind:'forum-gravel'});
  CURIA_WALLS.forEach((coords,i)=>foundation(from(coords),{component:'curia',thickness:i?.83:.95,height:i?.67:.91,seed:471+i*61,base:landing}));
  // Low front edging follows the mapped line on either side of the entrance.
  foundation([local(-8.9,0),local(-2.05,0)],{component:'curia',thickness:.62,height:.31,seed:533,base:landing});
  foundation([local(2.05,0),local(15.8,0)],{component:'curia',thickness:.62,height:.29,seed:561,base:landing});

  const stairWidth=3.55,tread=.50,stairFront=1.80;
  for(let i=0;i<3;i++){
    const v=stairFront-i*tread,p=local(0,v),top=floor+(i+1)*.20,bottom=Math.min(heightAt(p.x,p.z)+.055,top-.13);
    // Two/three worn slabs per tread provide joints while retaining a continuous
    // walking surface; narrow stone joints are smaller than an avatar footprint.
    const slabs=full?3:1;
    for(let k=0;k<slabs;k++){
      const q=local((k-(slabs-1)/2)*stairWidth/slabs,v);
      block('curia',q.x,bottom,q.z,stairWidth/slabs-.013,top-bottom,tread+.025,curiaYaw,620+i*23+k,'worn-ashlar');
    }
    const polygon=[local(-stairWidth/2,v-tread/2),local(stairWidth/2,v-tread/2),local(stairWidth/2,v+tread/2),local(-stairWidth/2,v+tread/2)];
    qa.forum.stairs.push({id:'curia-'+(i+1),polygon,height:top,rise:.20});
    qa.forum.surfaces.push({id:'curia-peldano-'+(i+1),component:'curia',polygon,walkable:true,height:top,maxInteriorStep:.245,materialKind:'worn-ashlar'});
  }
  // The expanded platform already reaches beneath the top tread. Its surface
  // is the landing: a second exactly coplanar stone face here caused a black
  // seam in the inspection render and depth fighting in the browser.
  const join=[local(-1.78,.04),local(1.78,.04),local(1.78,.58),local(-1.78,.58)];
  qa.forum.surfaces.push({id:'curia-desembarco',component:'curia',polygon:join,walkable:true,height:landing,materialKind:'forum-gravel',sharedSurface:'curia-rellano'});

  function shaft(component,p,y,radius,height,{fluted=false,seed=1}={}){
    const sectors=full?(fluted?80:28):16,positions=[],top=[];
    const rAt=a=>radius*(fluted?1-.065*(.5+.5*Math.cos(a*20)):1);
    for(let i=0;i<=sectors;i++){
      const a=i*TAU/sectors,r=rAt(a),lift=(variation(seed+i%sectors)-.5)*.055;
      top.push([p.x+Math.cos(a)*r*.97,y+height+lift,p.z+Math.sin(a)*r*.97]);
    }
    for(let i=0;i<sectors;i++){
      const a=i*TAU/sectors,b=(i+1)*TAU/sectors,a0=[p.x+Math.cos(a)*rAt(a),y,p.z+Math.sin(a)*rAt(a)],b0=[p.x+Math.cos(b)*rAt(b),y,p.z+Math.sin(b)*rAt(b)];
      addQuad(positions,b0,a0,top[i],top[i+1]);
      positions.push(p.x,y+height-.035,p.z,...top[i+1],...top[i]);
      positions.push(p.x,y,p.z,...a0,...b0);
    }
    batch.raw(key(component,'worn-ashlar'),positions,.94);
  }
  for(const spec of [{u:-2.42,v:-.45,h:.44},{u:2.42,v:-.45,h:.66}]){
    const p=local(spec.u,spec.v),profile=[[.37,0],[.43,.055],[.44,.105],[.38,.15],[.32,.19],[.34,.235],[.35,.275],[.29,.31]];
    const geo=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),full?32:16);
    batch.geometry(key('curia','worn-ashlar'),geo,new THREE.Matrix4().makeTranslation(p.x,landing,p.z),.96);geo.dispose();
    shaft('curia',p,landing+.30,.285,spec.h,{fluted:true,seed:Math.round(spec.u*81)});
    qa.forum.fragments.push({id:'curia-basa-'+(spec.u<0?'oeste':'este'),type:'attic-base-with-fluted-shaft',x:p.x,z:p.z,bottom:landing,top:landing+.30+spec.h,plinth:false,placement:'photographic-plan-alignment-estimate'});
  }
  // Four low, detached shaft fragments are visible along the fenced apron in
  // the photograph of the present excavation. They are not an entire colonnade.
  const apronStumps=[{u:3.6,v:4.45,h:.58,r:.28},{u:5.8,v:4.62,h:.47,r:.30},{u:7.8,v:4.36,h:.66,r:.29},{u:10.0,v:4.51,h:.50,r:.30}];
  for(let i=0;i<apronStumps.length;i++){
    const f=apronStumps[i],p=local(f.u,f.v),bottom=heightAt(p.x,p.z)+.12;
    shaft('curia',p,bottom,f.r,f.h,{seed:710+i*17});
    qa.forum.fragments.push({id:'fuste-apron-'+(i+1),type:'detached-short-shaft',x:p.x,z:p.z,bottom,top:bottom+f.h,placement:'documented-cluster-approximate-position'});
  }

  // The displayed monumental-inscription blocks stand against the curia-side
  // remains, as photographed, rather than being printed as a fictitious complete
  // text across the middle of the plaza. Fine letter traces are not invented.
  const epigraphicBlocks=[{u:-8.5,w:1.12,h:.72},{u:-7.20,w:1.35,h:.76},{u:-5.72,w:1.42,h:.69},{u:-4.05,w:1.66,h:.80}];
  for(let i=0;i<epigraphicBlocks.length;i++){
    const f=epigraphicBlocks[i],p=local(f.u,1.30),bottom=heightAt(p.x,p.z)+.11;
    block('curia',p.x,bottom,p.z,f.w,f.h,.48,curiaYaw,801+i*37,'worn-ashlar');
    qa.forum.fragments.push({id:'bloque-inscripcion-'+(i+1),type:'displayed-inscription-block-shape',x:p.x,z:p.z,bottom,top:bottom+f.h,letteringRecreated:false,originalRomanPositionClaimed:false,placement:'photographic-cluster-estimate'});
  }

  // A few specifically grouped fragments at the western excavation edge keep
  // the otherwise open forecourt clear. No random field of decorative rubble.
  const lapidary=[
    {coordinate:[-.276727,39.676147],w:2.10,h:.46,d:.72,yaw:.18},
    {coordinate:[-.276729,39.676130],w:.92,h:.34,d:.78,yaw:-.11},
    {coordinate:[-.276742,39.676121],w:1.22,h:.40,d:.64,yaw:.20},
    {coordinate:[-.276739,39.676098],w:.67,h:.26,d:.61,yaw:.08}
  ];
  for(let i=0;i<lapidary.length;i++){
    const f=lapidary[i],p=project(...f.coordinate),bottom=heightAt(p.x,p.z)+.10;
    block('foro',p.x,bottom,p.z,f.w,f.h,f.d,f.yaw,917+i*41,'worn-ashlar');
    qa.forum.fragments.push({id:'lapidario-occidental-'+(i+1),type:'architectural-fragment',x:p.x,z:p.z,bottom,top:bottom+f.h,placement:'photographic-group-approximate-position'});
  }
  qa.forum.curia={stepCount:3,stepRise:.20,landingHeight:landing,atticBases:2,detachedApronShafts:4,fullAncientPorticoRestored:false,source:'Aranegui 2004; Ricsol photographs 34/36; excavation photographs 2013 and 2017',elevationConfidence:'relative-height-photographic-estimate'};
  stats.forum={surfaceCount:qa.forum.surfaces.length,fragmentCount:qa.forum.fragments.length,preservedTempleCompartments:2,curiaSteps:3,fullAncientReconstruction:false};
  return qa.forum;
}

