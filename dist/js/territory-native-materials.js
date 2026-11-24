import {BufferAttribute,InstancedBufferAttribute,Material,MathUtils} from 'three';
import {urbanNodeMaterial} from './territory-node-urban.js';
import {groundNodeMaterial} from './territory-node-ground.js';

// The Atlas keeps its original material references for sections, animation and disposal.
// Only the draw pass sees the node variants, including its reflection and shadow passes.
export function nativeMaterials(renderer){
  const cache=new WeakMap(),live=new Set(),stats={variants:0,prepared:0,unsupported:null};
  const layouts=new WeakSet();
  function alignGeometry(geometry){
    if(!geometry||layouts.has(geometry))return;
    // WebGPU has no normalized RGB8/SNORM8x3 vertex format. These are
    // static skyline and packed Atlas attributes. Keep the component values.
    for(const [name,attr] of Object.entries(geometry.attributes)){
      const bytes=attr.array.BYTES_PER_ELEMENT;
      if(bytes>=4||(attr.itemSize*bytes)%4===0)continue;
      const values=new Float32Array(attr.count*attr.itemSize);
      for(let i=0;i<attr.count;i++)for(let j=0;j<attr.itemSize;j++)values[i*attr.itemSize+j]=attr.getComponent(i,j);
      const aligned=attr.isInstancedBufferAttribute?new InstancedBufferAttribute(values,attr.itemSize,false,attr.meshPerAttribute):new BufferAttribute(values,attr.itemSize);
      aligned.setUsage(attr.usage);geometry.setAttribute(name,aligned);
    }
    layouts.add(geometry);
  }
  function remove(entry){
    if(!live.delete(entry))return;
    entry.source.removeEventListener('dispose',entry.clear);
    for(const node of entry.variants.values())if(node!==entry.source)node.dispose();
    stats.variants-=entry.variants.size;entry.variants.clear();cache.delete(entry.source);
  }
  function material(source,object){
    if(!source||source.isNodeMaterial)return source;
    let entry=cache.get(source);
    if(entry&&entry.version!==source.version){remove(entry);entry=null;}
    if(!entry){
      entry={source,version:source.version,variants:new Map(),clear:null};
      entry.clear=()=>remove(entry);source.addEventListener('dispose',entry.clear);
      live.add(entry);cache.set(source,entry);
    }
    const attrs=object.geometry?.attributes;
    const key=(attrs?.archMetric?1:0)|(attrs?.instanceMatrix||object.isInstancedMesh?2:0)|(attrs?.uv?4:0);
    if(entry.variants.has(key))return entry.variants.get(key);
    const urban=urbanNodeMaterial(source,object,renderer);
    const node=groundNodeMaterial(source,object,urban,renderer)||urban;
    if(!node&&(source.isShaderMaterial||source.onBeforeCompile!==Material.prototype.onBeforeCompile)){
      stats.unsupported=source.name||object.name||source.type;
      throw Error('Material pendiente de adaptación · '+stats.unsupported);
    }
    if(node&&node!==source){
      if(node._listeners===source._listeners)delete node._listeners;
      if(node.uuid===source.uuid)node.uuid=MathUtils.generateUUID();
    }
    const result=node||source;
    entry.variants.set(key,result);stats.variants++;stats.prepared++;
    return result;
  }
  function adapted(source,object){
    const node=material(source,object);
    if(node&&node!==source){
      node.visible=source.visible;node.opacity=source.opacity;
    }
    return node;
  }
  function draw(scene,render){
    const changed=[],empty=[];
    try{
      scene.traverseVisible(object=>{
        const source=object.material;
        if(!source)return;
        if(object.isInstancedMesh&&object.count===0&&!object.children.length){
          empty.push(object);object.visible=false;return;
        }
        alignGeometry(object.geometry);
        let result;
        if(Array.isArray(source)){
          const nodes=source.map(m=>adapted(m,object));
          if(nodes.every((m,i)=>m===source[i]))return;
          result=nodes;
        }else result=adapted(source,object);
        if(result!==source){changed.push(object,source);object.material=result;}
      });
      return render();
    }finally{
      for(let i=0;i<changed.length;i+=2)changed[i].material=changed[i+1];
      for(const object of empty)object.visible=true;
    }
  }
  return {draw,stats,dispose(){for(const entry of live)remove(entry);}};
}
