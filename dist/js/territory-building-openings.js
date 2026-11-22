import {openingBounds,balconyBay} from './territory-building-style.js';

// Construct the masonry between openings, all four reveals and the joinery at
// the back of the recess. The plane of the cadastral frontage stays in place.
export function recessedBay({bay,family,portal,seed,left,right,groundLeft,groundRight,floor,storey,topLeft,topRight,quad}){
  const grade=(groundLeft+groundRight)*.5;
  const sillBase=floor+storey, usable=sillBase-grade;
  const minTop=Math.min(topLeft,topRight);
  if(usable<1.6||Math.max(groundLeft,groundRight)-minTop>-.9)return false;
  let lastL=groundLeft-1.2,lastR=groundRight-1.2,count=0;
  const strip=(yl,yr,l,r)=>quad([[left,yl],[right,yr],[right,r],[left,l]],false);
  const levels=Math.ceil((minTop-floor)/storey);
  if(levels>32)return false;
  for(let level=0;level<levels;level++){
    const balcony=balconyBay(bay,level,seed);
    const variant=level===0?(portal?2:3):(balcony?0:1);
    const [u,v,sill,head]=openingBounds(family,variant);
    const base=level===0?grade:floor+level*storey,span=level===0?usable:storey;
    const x0=left+(right-left)*u,x1=left+(right-left)*v,y0=base+span*sill,y1=base+span*head;
    if(y1>minTop-.08||y0<Math.max(lastL,lastR)+.012)continue;
    const depth=family===3?.19:portal&&level===0?.27:.17;
    strip(lastL,lastR,y0,y0);
    quad([[left,y0],[x0,y0],[x0,y1],[left,y1]],false);
    quad([[x1,y0],[right,y0],[right,y1],[x1,y1]],false);
    quad([[x0,y0,depth],[x1,y0,depth],[x1,y1,depth],[x0,y1,depth]],false);
    quad([[x0,y0],[x0,y0,depth],[x0,y1,depth],[x0,y1]],true);
    quad([[x1,y0,depth],[x1,y0],[x1,y1],[x1,y1,depth]],true);
    quad([[x0,y1],[x0,y1,depth],[x1,y1,depth],[x1,y1]],true);
    quad([[x0,y0],[x1,y0],[x1,y0,depth],[x0,y0,depth]],true);
    lastL=y1;lastR=y1;count++;
  }
  if(count===0)return false;
  strip(lastL,lastR,topLeft,topRight);
  return count;
}
