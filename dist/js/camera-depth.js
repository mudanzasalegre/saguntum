// Ordinary perspective depth has very little precision far from a 12 cm near
// plane. At 350 m a 24-bit buffer then resolves only about 6 cm, which is wider
// than window reveals and the relief of the roof tiles. Share this continuous
// policy between Atlas and the two territorial backends; no shader extension
// or renderer-specific depth convention is required.
export function cameraNearPlane({range=0,clearance=Infinity,interior=false,pedestrian=false}={}){
 const minimum=.12;
 if(interior||pedestrian)return minimum;
 const distance=Number.isFinite(range)?Math.max(0,range):0;
 // Preserve the existing near plane throughout close observations. At city
 // scale improve precision gradually, so orbit/zoom never cross a depth band.
 const distanceLimit=minimum+Math.max(0,distance-32)*.008;
 // A low orbit may have a distant pivot while its foreground is a doorway or
 // a street. Keep those views close-capable even when the target is far away.
 const heightLimit=clearance===Infinity?4:Number.isFinite(clearance)?minimum+Math.max(0,clearance-8)*.1:minimum;
 return Math.max(minimum,Math.min(4,distanceLimit,heightLimit));
}
