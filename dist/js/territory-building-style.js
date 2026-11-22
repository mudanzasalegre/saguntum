// Facade families describe a possible finish; no survey of individual elevations is available.
const finishes=[
  ['#dfc8a7','#ebe0c9','#ceb28c','#d2a285','#e6d1b4','#cfb9a4'],
  ['#e1d3bb','#e6dacc','#c9c5b7','#cdc5af','#ddd4bc','#d7ba9e'],
  ['#b78368','#b89578','#b07963','#c59c79','#ae8c77','#b97f65'],
  ['#babeb8','#aeb4b2','#cacbc2','#a9ada5','#b3b9b7','#b8b3a2'],
  ['#e1d3b4','#d2bfa1','#dac9ad','#ddc6a6','#d3c1a3','#d9d1bd'],
  ['#c8c5b7','#d7cdbb','#d7cdc2','#bcbeb7','#cbc6b7','#d5c8ba']
];
export function buildingStyle(b,x,z,height){
  let seed=5381;
  for(const ch of String(b.id).split('_part')[0])seed=(Math.imul(seed,33)^ch.charCodeAt(0))>>>0;
  const index=seed%6,industrial=b.usage==='industrial',rural=b.usage==='agriculture';
  const center=((x-3420)/930)**2+((z+590)/760)**2<1;
  let family;
  if(industrial||rural&&height>6)family=3;
  else if(rural||b.usage==='detached')family=4;
  else if(['retail','office','publicServices'].includes(b.usage))family=5;
  else if(center&&height<16)family=0;
  else if(height>=9&&(seed>>>8)%4===0)family=2;
  else family=1;
  const storey=family===3?height:b.levels&&height/b.levels>=2.5&&height/b.levels<=4.3?height/b.levels:3.05;
  return {family,seed:seed%997,finish:finishes[family][index],surface:[0,0,1,2,7,0][family],storey,
    spacing:[3.0,3.45,3.5,8.2,3.4,3.8][family]};
}
export const baysOn=(length,spacing)=>Math.max(1,Math.round(length/spacing));
export const balconyBay=(bay,storey,edgeSeed)=>(bay+storey+edgeSeed)%3===0;
export function edgeSeed(seed,index){return (seed+index*13)%997;}
