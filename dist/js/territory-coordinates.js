// GRS80, ETRS89 / UTM zone 30N (EPSG:25830). Geographic atlas coordinates
// have metre-scale accuracy. X points east and positive Z points south.
export function project(lon, lat) {
  const rad = Math.PI / 180, phi = lat * rad;
  const f = 1 / 298.257222101, e = f * (2 - f), ep = e / (1 - e);
  const sin = Math.sin(phi), cos = Math.cos(phi), tan = Math.tan(phi);
  const n = 6378137 / Math.sqrt(1 - e * sin * sin);
  const a = (lon + 3) * rad * cos, t = tan * tan, c = ep * cos * cos;
  const m = 6378137 * ((1-e/4-3*e**2/64-5*e**3/256)*phi
    -(3*e/8+3*e**2/32+45*e**3/1024)*Math.sin(2*phi)
    +(15*e**2/256+45*e**3/1024)*Math.sin(4*phi)-35*e**3/3072*Math.sin(6*phi));
  const east = 500000 + .9996*n*(a+(1-t+c)*a**3/6+(5-18*t+t*t+72*c-58*ep)*a**5/120);
  const north = .9996*(m+n*tan*(a*a/2+(5-t+9*c+4*c*c)*a**4/24+(61-58*t+t*t+600*c-330*ep)*a**6/720));
  return {x:east-730000,z:4395000-north};
}

export function insideRing(x,z,ring) {
  let inside = false;
  for (let i=0,j=ring.length-1; i<ring.length; j=i++) {
    const a=ring[i], b=ring[j];
    if ((a[1]>z)!==(b[1]>z) && x < (b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}

export function gridSampler({width,height,bounds,unit}, heights) {
  const [left,top,right,bottom]=bounds;
  return (x,z) => {
    const col=Math.max(0,Math.min(width-1,(x-left)*(width-1)/(right-left)));
    const row=Math.max(0,Math.min(height-1,(z-top)*(height-1)/(bottom-top)));
    const i=Math.min(width-2,Math.floor(col)), j=Math.min(height-2,Math.floor(row));
    const u=col-i,v=row-j,at=j*width+i;
    // Match the diagonal of the terrain triangles, including on sector edges.
    const a=heights[at],b=heights[at+1],c=heights[at+width],d=heights[at+width+1];
    return unit*(u+v<=1 ? a+(b-a)*u+(c-a)*v : d+(c-d)*(1-u)+(b-d)*(1-v));
  };
}

// One elevation function for terrain, urban meshes, heritage workers and navigation.
export function terrainSampler(grids){
  const base=gridSampler(grids.base,grids.base.data),detail=grids.detail;
  const core=detail&&gridSampler(detail,detail.data);
  const regional=(grids.regional||[]).map(g=>({...g,sample:gridSampler(g,g.data)}));
  function weight(x,z,b,margin){
    return Math.min(1,Math.max(0,Math.min(x-b[0],z-b[1],b[2]-x,b[3]-z)/margin));
  }
  function coarse(x,z){
    const t=core?weight(x,z,detail.bounds,50):0;
    return t===0?base(x,z):t===1?core(x,z):base(x,z)*(1-t)+core(x,z)*t;
  }
  function sample(x,z,start){
    for(let n=start;n<regional.length;n++){
      const g=regional[n];
      const [l,t,r,b]=g.bounds;
      if(x<=l||z<=t||x>=r||z>=b)continue;
      const i=Math.floor((x-l)/g.spacing),j=Math.floor((z-t)/g.spacing),k=j*g.width+i;
      // A rotated source does not cover all corners of its storage rectangle.
      if(g.data[k]===-32768||g.data[k+1]===-32768||g.data[k+g.width]===-32768||g.data[k+g.width+1]===-32768)continue;
      let margin=35;
      for(const e of g.edges)margin=Math.min(margin,e[0]*x+e[1]*z+e[2]);
      const y=g.sample(x,z),w=Math.max(0,margin/35);
      return w===1?y:w*y+(1-w)*sample(x,z,n+1);
    }
    return coarse(x,z);
  }
  return (x,z)=>sample(x,z,0);
}
