// Almenara: photographed surviving fabric, not a reconstruction of one period.
// Dimensions are visual estimates anchored to the existing mapped intersection.
export const ALMENARA_SPEC={
 id:'puerta-almenara',regionId:'almenara',coordinate:[-.2762665022,39.676214945],
 yaw:-1.30500565,width:3.15,height:5.2,depth:6.4,top:8.9,frontWidth:9.6,
 facadeThickness:.78,floorRise:.55,cutFront:3,cutBack:10.4,
 period:'unknown',type:'almenara-chamber'
};

const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const noise=n=>{const v=Math.sin(n*127.13+43.7)*43758.5453;return v-Math.floor(v);};

/**
 * Surviving Almenara gate, as a thin west screen and a separate vaulted body.
 * Visual evidence: BIVALDI JH 4/388 (undated Crumiere postcard); SERANCO 2019
 * p43; Ricsol's front/reverse photographs sagunto-19/20; municipal works 2017.
 * FORTMED 2020 fig10 documents the WOODEN LEAVES, not a metric stone elevation.
 * The two trefoils, lower segmental exit, three vertical slits, battered piers,
 * rear stair and mixed masonry are observed. Every metric height/thickness,
 * the floor gradient and exact locations of small repairs remain estimates.
 * g.floorAt takes local (u,v) and returns a finished WORLD elevation.
 */
export function buildAlmenara({THREE,batch,keyFor,g,heightAt,qa,stats,detail='full'}){
 const c=Math.cos(g.yaw),s=Math.sin(g.yaw),half=g.frontWidth/2,r=g.width/2;
 const thick=g.facadeThickness||.78,depth=g.depth,rearRise=g.floorRise??.55;
 const tr=(u,y,v)=>[g.x+u*c+v*s,g.base+y,g.z-u*s+v*c];
 const floor=(u,v)=>typeof g.floorAt==='function'?g.floorAt(u,v):g.base+rearRise*clamp(-v/depth,0,1);
 const floorLocal=(u,v)=>floor(u,v)-g.base;
 const matrix=new THREE.Matrix4().compose(new THREE.Vector3(g.x,g.base,g.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),g.yaw),new THREE.Vector3(1,1,1));
 const key=kind=>keyFor(g.regionId,g.id,g.period,kind);
 const stone=key('gate-stone'),brick=key('gate-brick'),ashlar=key('ashlar'),plaster=key('plaster'),wood=key('wood'),metal=key('metal');
 const raw=(k,points,tint=1)=>batch.raw(k,points,tint);
 const quad=(out,a,b,c,d)=>out.push(...tr(...a),...tr(...b),...tr(...c),...tr(...a),...tr(...c),...tr(...d));
 const box=(k,u,y,v,w,h,d,tint=1)=>{const p=tr(u,y,v);batch.box(k,p[0],p[1],p[2],w,h,d,g.yaw,tint);};
 const extrude=(shape,v,d,k,tint=1)=>{
  const geom=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1,curveSegments:24});
  geom.translate(0,0,v);batch.geometry(k,geom,matrix,tint);geom.dispose();
 };
 const polygon=(points)=>{const p=new THREE.Shape();points.forEach((v,i)=>i?p.lineTo(...v):p.moveTo(...v));p.closePath();return p;};
 const holeRect=(x0,y0,x1,y1)=>{const p=new THREE.Path();p.moveTo(x0,y0);p.lineTo(x0,y1);p.lineTo(x1,y1);p.lineTo(x1,y0);p.closePath();return p;};
 const rise=2.15,spring=g.height-rise,R=(rise*rise+r*r)/(2*r),q=R-r,peakAngle=Math.acos(q/R);
 const pointed=[];
 for(let i=0;i<=28;i++){const a=peakAngle*i/28;pointed.push([q-R*Math.cos(a),spring+R*Math.sin(a)]);}
 for(let i=27;i>=0;i--){const a=peakAngle*i/28;pointed.push([-q+R*Math.cos(a),spring+R*Math.sin(a)]);}
 // Crown copied as a broken silhouette, without speculative regular merlons.
 const crown=[[-half,g.top-1.05],[-3.75,g.top-.94],[-3.1,g.top-.65],[-2.7,g.top-.69],[-2.25,g.top-.39],[-1.7,g.top-.34],[-1.15,g.top-.29],[-.79,g.top-.05],[-.43,g.top+.1],[.02,g.top+.11],[.15,g.top-.07],[.62,g.top-.14],[.96,g.top-.34],[1.5,g.top-.43],[2.04,g.top-.55],[2.53,g.top-.66],[3.5,g.top-.66],[half,g.top-.57]];
 const outline=polygon([[-half,-3],[-r,-3],[-r,spring],...pointed,[r,-3],[half,-3],...crown.slice().reverse()]);
 // Union of three circular lobes: an actual trefoil aperture, not a dark decal.
 function trefoil(cx,cy,reverse=false){
  const p=new THREE.Path(),d=.21,rr=.265,n=96;
  for(let i=0;i<=n;i++){
   const a=(reverse?-1:1)*i*TAU/n;
   let rad=0;
   for(let j=0;j<3;j++){const delta=a-(Math.PI/2+j*TAU/3),b=d*Math.cos(delta);rad=Math.max(rad,b+Math.sqrt(Math.max(0,rr*rr-d*d*Math.sin(delta)**2)));}
   const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;i?p.lineTo(x,y):p.moveTo(x,y);
  }
  p.closePath();return p;
 }
 const oculi=[{x:-2.15,y:6.40},{x:2.15,y:6.57}];
 for(const o of oculi)outline.holes.push(trefoil(o.x,o.y,true));
 extrude(outline,-thick,thick,stone,.99);
 for(const o of oculi){
  const frame=new THREE.Shape();frame.absarc(o.x,o.y,.60,0,TAU,false);frame.holes.push(trefoil(o.x,o.y,true));
  extrude(frame,.006,.105,ashlar,.92);
 }
 // Photographs show horizontal brick repairs threaded through the upper
 // mixed masonry, especially beside the oculi. Small embedded brick faces keep
 // that scale readable without painting across either aperture or arch ring.
 // Their precise patch boundaries are a restrained visual interpretation.
 if(detail!=='context'){
  const fabricAt=(x,y)=>{
   if(Math.abs(x)>half-.12)return false;
   let top=g.top-1;
   for(let i=0;i<crown.length-1;i++)if(x>=crown[i][0]&&x<=crown[i+1][0]){
    const t=(x-crown[i][0])/(crown[i+1][0]-crown[i][0]);top=crown[i][1]+t*(crown[i+1][1]-crown[i][1]);break;
   }
   if(y>top-.10)return false;
   if(oculi.some(o=>Math.hypot(x-o.x,y-o.y)<.72))return false;
   if(Math.abs(x)<r+.43){
    const xx=Math.min(r,Math.abs(x)),arch=spring+Math.sqrt(Math.max(0,R*R-(xx+q)*(xx+q)));
    if(y<arch+.43)return false;
   }
   return true;
  };
  for(let row=0;row<37;row++){
   const y=3.12+row*.145;
   for(let col=0;col<31;col++){
    const x=-half+.22+col*.30+(row%2)*.15;
    const patch=(Math.sin(x*1.7+y*.83)+Math.sin(x*.67-y*1.8))*.13;
    if(noise(row*157+col*37)>.41+patch)continue;
    const w=.264+noise(row*67+col)*.020,h=.069+noise(col*19+row)*.013;
    if([-1,1].some(a=>[-1,1].some(b=>!fabricAt(x+a*w/2,y+b*h/2))))continue;
    box(brick,x,y,.006,w,h,.026,.77+noise(row*29+col*13)*.22);
   }
  }
 }
 // Thin, individually laid voussoirs on the outer pointed arch. The ring is
 // kept out of the opening and uses brick rather than the roof tile material.
 for(const side of[-1,1])for(let i=0;i<28;i++){
  const a=peakAngle*(i+.025)/28,b=peakAngle*(i+.975)/28,t=.32+noise(i*19+side)*.07;
  const at=(rr,angle)=>[side<0?q-rr*Math.cos(angle):-q+rr*Math.cos(angle),spring+rr*Math.sin(angle)];
  extrude(polygon([at(R,a),at(R,b),at(R+t,b),at(R+t,a)]),.012,.118,brick,.84+noise(i*23+side)*.19);
 }
 extrude(polygon([[0,g.height],[-.12,g.height+.36],[.12,g.height+.36]]),.012,.118,brick,.94);
 // Imposts and repaired jambs are deliberately unequal, as in the photographs.
 for(const side of[-1,1]){
  const iw=side<0?.29:.42;
  box(ashlar,side*(r+iw/2),spring-.035,.13,iw+.14,.17,.31,.91);
  for(let i=0;i<6;i++)box(i%3===1?stone:ashlar,side*(r+iw/2),.25+i*.47,-.025,iw,.44,.24,.89+noise(i*33+side)*.13);
 }
 // Battered bases on the west face. Their inner arris stays clear of the arch.
 function battered(side){
  const outer=side*(half+.16),inner=side*(r+.025),h=2.6+(side<0?.04:.24),p=[];
  const a=[inner,-1,.92],b=[outer,-1,.92],d=[inner,h,.01],e=[side*half,h,.01];
  if(side>0){quad(p,a,b,e,d);quad(p,b,[outer,-1,-thick],[side*half,h,-thick],e);}
  else{quad(p,b,a,d,e);quad(p,[outer,-1,-thick],b,e,[side*half,h,-thick]);}
  if(side>0){quad(p,[inner,-1,-thick],a,d,[inner,h,-thick]);quad(p,d,e,[side*half,h,-thick],[inner,h,-thick]);}
  else{quad(p,a,[inner,-1,-thick],[inner,h,-thick],d);quad(p,e,d,[inner,h,-thick],[side*half,h,-thick]);}
  raw(stone,p,side<0?.83:.87);
 }
 battered(-1);battered(1);
 // Lower body: a chamber with a real vault, not the facade extruded six metres.
 // The visible terrace closes the chamber above the extrados. It must sit
 // above the pointed vault crown, while remaining below both oculi; otherwise
 // the orange vault appears as an exposed triangular roof from the east.
 // This relative level, like the stair dimensions, is a photographic estimate.
 const bodyTop=g.height+.46,bodyRear=-depth+.66;
 for(const side of[-1,1]){
  const outer=side<0?half:half-.26,w=outer-r;
  box(stone,side*(r+w/2),(bodyTop-1)/2,(-thick-depth)/2,w,bodyTop+1,depth-thick,.91+(side>0?.04:0));
 }
 // Intrados and extrados are lofted only across the chamber. Their inner shape
 // gently lowers toward the separate, segmental exit; the passage remains open.
 const vault=[];
 const vaultSections=[[-thick,0],[-2.25,-.08],[-4.3,-.13],[bodyRear,-.18]];
 const profile=(i,v,dy,outer=false)=>{
  const a=pointed[i],y=a[1]+dy+(outer?.39:0);
  return[a[0]*(outer?1.13:1),y,v];
 };
 for(let k=0;k<vaultSections.length-1;k++){
  const [va,ya]=vaultSections[k],[vb,yb]=vaultSections[k+1];
  for(let i=0;i<pointed.length-1;i++){
   quad(vault,profile(i+1,va,ya),profile(i,va,ya),profile(i,vb,yb),profile(i+1,vb,yb));
   quad(vault,profile(i,va,ya,true),profile(i+1,va,ya,true),profile(i+1,vb,yb,true),profile(i,vb,yb,true));
  }
 }
 // Close the thickness at the rear of the vault only; no transverse box cuts it.
 for(let i=0;i<pointed.length-1;i++)quad(vault,profile(i+1,bodyRear,-.18),profile(i,bodyRear,-.18),profile(i,bodyRear,-.18,true),profile(i+1,bodyRear,-.18,true));
 raw(brick,vault,.94);
 // A continuous, thin masonry cap joins both side walls and the rear screen.
 // It does not enter the vaulted void or close the three high eastern slits.
 box(stone,0,bodyTop-.025,(bodyRear-thick)/2,2*r,.05,-bodyRear-thick,.95);
 // A few surviving plaster islands articulate the interior without concealing
 // all the brick vault or turning the whole gate into uniform yellow render.
 if(detail!=='context'){
  for(const side of[-1,1]){
   const p=[],u=side*(r-.013),a=[u,.47,-1.15],b=[u,.63,-3.4],cc=[u,2.7,-3.72],d=[u,2.94,-1.32];
   side<0?quad(p,a,b,cc,d):quad(p,b,a,d,cc);raw(plaster,p,.91);
  }
 }
 // The lower eastern exit has a flattened arch and three small true slits.
 const rearCenter=-.12,rearWidth=2.72,rr=rearWidth/2,rearFloor=floorLocal(rearCenter,-depth);
 const rearHeight=3.25,segRise=.57,segSpring=rearFloor+rearHeight-segRise;
 const segRadius=(rr*rr+segRise*segRise)/(2*segRise),segCy=segSpring+segRise-segRadius;
 const segPoints=[];
 for(let i=0;i<=36;i++){const x=-rr+2*rr*i/36;segPoints.push([rearCenter+x,segCy+Math.sqrt(segRadius*segRadius-x*x)]);}
 const rearShape=polygon([[-half,-3],[rearCenter-rr,-3],[rearCenter-rr,segSpring],...segPoints,[rearCenter+rr,-3],[half-.26,-3],[half-.26,bodyTop],[-half,bodyTop]]);
 const slitWidth=.14,slitHeight=.4,slitBottom=4.08,slits=[rearCenter-.66,rearCenter+.02,rearCenter+.69];
 for(const x of slits)rearShape.holes.push(holeRect(x-slitWidth/2,slitBottom,x+slitWidth/2,slitBottom+slitHeight));
 extrude(rearShape,-depth,.66,stone,.95);
 // Repaired brick ring, including the visible curved soffit of the lower arch.
 const rearRing=polygon([...segPoints,...segPoints.slice().reverse().map(([x,y])=>[x+(x-rearCenter)*.12,y+.29])]);
 extrude(rearRing,-depth-.028,.75,brick,.9);
 // Ashlar jambs on the lower exit have different widths, without closing it.
 for(const side of[-1,1]){
  const jw=side<0?.33:.44,xc=rearCenter+side*(rr+jw/2);
  for(let i=0;i<6;i++)box(ashlar,xc,rearFloor+.23+i*.43,-depth+.31,jw,.405,.76,.86+noise(i*14+side)*.12);
  box(ashlar,xc,segSpring-.035,-depth+.31,jw+.1,.13,.82,.94);
 }
 // Upper side returns and the lateral stair are visible from the eastern side;
 // there is air behind both trefoil windows, not a second nine-metre wall.
 for(const side of[-1,1])box(stone,side*(half-.27),6.65,-1.64,.54,3.05,1.72,.96);
 const stairU=3.75,stairW=1.05,stairStart=-4.15,stepD=.29;
 for(let i=0;i<7;i++){
  const h=.22*(i+1),v=stairStart+i*stepD;
  box(stone,stairU,bodyTop+h/2,v,stairW,h,stepD+.012,.91);
  box(ashlar,stairU,bodyTop+h+.025,v,stairW+.015,.05,stepD+.025,.92);
 }
 // The parapet belongs to this short stair/landing, not a symmetrical battlement.
 box(stone,2.94,bodyTop+.46,-3.62,.48,.92,1.48,.95);
 // Folded historic timber leaves retain panels, rails and studs. Their open
 // orientation is a visitor-view choice; no claim of exact hinge survey is made.
 for(const side of[-1,1]){
  const u=rearCenter+side*(rr-.065),v0=-depth+.46,leafLength=1.31,planks=8;
  for(let i=0;i<planks;i++){
   const bottom=rearFloor+.07+noise(i*7+side)*.045,h=2.55-noise(i*17+side)*.055;
   box(wood,u,bottom+h/2,v0+leafLength*(i+.5)/planks,.105,h,leafLength/planks-.009,.83+noise(i*11+side)*.17);
  }
  for(const y of[rearFloor+.43,rearFloor+1.36,rearFloor+2.39]){
   box(wood,u-side*.07,y,v0+leafLength/2,.055,.12,leafLength+.04,.87);
   for(let j=0;j<6;j++)box(metal,u-side*.107,y,v0+leafLength*(j+.5)/6,.028,.042,.042,.81);
  }
  for(const y of[rearFloor+.5,rearFloor+2.3])box(metal,u-side*.087,y,v0+.06,.07,.21,.075,.85);
 }
 // Continuous walkable infill over the coarse terrain mesh. Its elevation is
 // supplied by the same finished-ground sampler as the pedestrian QA points.
 // castle.js uses this component to clip the duplicate mapped path only here.
 const floorVertices=[],floorFront=.25,floorBack=-depth-.5;
 const alongN=Math.ceil((floorFront-floorBack)/.42),acrossN=Math.ceil(g.width/.42);
 const floorBounds={x0:Infinity,x1:-Infinity,z0:Infinity,z1:-Infinity};
 const floorPoint=(t,v)=>{
  const u=rearCenter*clamp(-v/depth,0,1)+t*g.width;
  const p=[u,floorLocal(u,v),v],world=tr(...p);
  floorBounds.x0=Math.min(floorBounds.x0,world[0]);floorBounds.x1=Math.max(floorBounds.x1,world[0]);
  floorBounds.z0=Math.min(floorBounds.z0,world[2]);floorBounds.z1=Math.max(floorBounds.z1,world[2]);
  return p;
 };
 for(let j=0;j<alongN;j++)for(let i=0;i<acrossN;i++){
  const va=floorBack+(floorFront-floorBack)*j/alongN,vb=floorBack+(floorFront-floorBack)*(j+1)/alongN,ua=i/acrossN-.5,ub=(i+1)/acrossN-.5;
  quad(floorVertices,floorPoint(ua,va),floorPoint(ua,vb),floorPoint(ub,vb),floorPoint(ub,va));
 }
 raw(keyFor(g.regionId,'almenara-suelo','unknown','path'),floorVertices,.96);
 qa.surfaces.push({component:'almenara-suelo',box:floorBounds,sampled:true,publicWalkingSurface:true,source:'interpolated-finished-gate-floor',localRange:{v0:floorBack,v1:floorFront,width:g.width}});
 // Thin stone thresholds follow the finished ground supplied by castle.js.
 for(const v of[.12,-depth+.12,-depth-.31]){
  const out=[],w=v>0?g.width-.12:rearWidth-.1,x=v>0?0:rearCenter,d=.17;
  const a=[x-w/2,floorLocal(x-w/2,v-d/2)+.018,v-d/2],b=[x+w/2,floorLocal(x+w/2,v-d/2)+.018,v-d/2],cc=[x+w/2,floorLocal(x+w/2,v+d/2)+.018,v+d/2],dd=[x-w/2,floorLocal(x-w/2,v+d/2)+.018,v+d/2];
  quad(out,dd,cc,b,a);raw(ashlar,out,.89);
 }
 const axis=[s,0,c],frontCenter=tr(0,4.2,-thick/2),frontFloorPoint=[g.x,floor(0,0),g.z];
 const walkCenterline=[3,1,0,-thick,-2,-3.5,-5,-depth,-7.3,-8.8,-10.4].map(v=>{
  const u=rearCenter*clamp(-v/depth,0,1),p=tr(u,0,v);return[p[0],floor(u,v),p[2]];
 });
 const oculiQA=oculi.map(o=>({center:tr(o.x,o.y,-thick/2),axis,radius:.475,throatRadius:.23,wallThickness:thick,shape:'trefoil'}));
 const rearSlits=slits.map(x=>({center:tr(x,slitBottom+slitHeight/2,-depth+.33),axis,width:slitWidth,height:slitHeight,wallThickness:.66}));
 const modelQA={id:g.id,x:g.x,z:g.z,yaw:g.yaw,base:g.base,width:g.width,height:g.height,depth,passageDepth:depth,frontCenter,frontFloorPoint,facadeThickness:thick,walkCenterline,walkWidth:2.25,oculi:oculiQA,rearSlits,rearExit:{center:tr(rearCenter,rearFloor,-depth),width:rearWidth,height:rearHeight,shape:'segmental'},documented:['pointed-west-arch','two-trefoil-oculi','lower-segmental-east-arch','three-upper-slits','folded-timber-leaves','battered-piers','lateral-rear-stair'],metricStatus:'visual-estimates-not-a-metric-survey',sourceKeys:['bivaldi-jh4-388','seranco-2019','foto-ricsol-2022','fortmed-2020','almenara-restoration-2017']};
 qa.almenara=modelQA;
 qa.portals.push({...g,...modelQA,openingBottom:floor(0,0),openingCrown:g.base+g.height,facadeSource:'seranco-2019; bivaldi-jh4-388; ricsol-front-and-reverse'});
 qa.features.push({...modelQA,id:'almenara-distinct-front-and-rear'});
 stats.gates.push({id:g.id,coordinates:g.coordinate,width:g.width,height:g.height,depth,facadeThickness:thick,opening:true,form:'thin pointed facade, two trefoil oculi, vaulted chamber, lower segmental rear exit, three upper slits, folded studded leaves',planConfidence:'OSM wall/path intersection',elevationConfidence:'observed photographic form; interpreted dimensions',restorationContext:'2017 consolidation, current surviving composite fabric'});
 return modelQA;
}
