import {Group,PointLight} from 'three';

// Three's program key contains the number of lights. WebGPU's light graph
// also retains their identities. Use the same two point lights for the common
// case (the Horno has two) and expand in bands for larger authored interiors.
export function heritageLights(scene){
  const group=new Group(),slots=[];
  group.name='Iluminación patrimonial';
  scene.add(group);
  function select(near){
    const size=near.length>4?8:near.length>2?4:2;
    while(slots.length<size){
      const slot=new PointLight(0xffffff,0,1,2);
      slots.push(slot);group.add(slot);
    }
    for(let i=0;i<slots.length;i++){
      const slot=slots[i],source=near[i]?.light;
      slot.visible=i<size;
      slot.intensity=source?.intensity??0;
      if(!source)continue;
      slot.color.copy(source.color);slot.distance=source.distance;slot.decay=source.decay;
      slot.position.setFromMatrixPosition(source.matrixWorld);
    }
  }
  select([]);
  return {select,dispose(){group.removeFromParent();for(const slot of slots)slot.dispose();}};
}
