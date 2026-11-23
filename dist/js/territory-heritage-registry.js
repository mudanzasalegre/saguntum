import * as T from 'three';
import {atlasProject,documentData,registerFrame} from './territory-heritage-catalog.js';

export function preloadAtlasVisit(record){
 return import(new URL(record.scene.module,import.meta.url).href);
}

// The author supplies one scene for both views. Geographic positions are
// mapped into its drawing frame. All matrices act on metres, with Y up.
export async function instantiateAtlasVisit(record,{project,heightAt,renderer,needed=()=>true}){
 const descriptor=record.scene;
 const resources=Object.entries(descriptor.resources||{});
 const [module,...documents]=await Promise.all([preloadAtlasVisit(record),...resources.map(([,name])=>documentData(name,false))]);
 if(!needed())return null;
 const factory=module[descriptor.factory||'createVisit'];
 if(typeof factory!=='function')throw Error('La visita carece de constructor · '+record.id);
 const [lon,lat]=record.coordinate,anchor=project(lon,lat);
 const frame=registerFrame({lon,lat,...anchor},project);
 const drawing=new T.Matrix4().set(frame.a,0,frame.b,frame.tx,0,1,0,0,frame.c,0,frame.d,frame.tz,0,0,0,1);
 const group=new T.Group(),localToAtlas=new T.Object3D();
 const anchored=descriptor.frame!=='atlas',p=atlasProject(lon,lat);
 const offset=descriptor.offset||[0,0,0],scale=descriptor.scale??1;
 if(!Number.isFinite(scale)||scale<=0)throw Error('Escala de visita incorrecta · '+record.id);
 localToAtlas.scale.setScalar(scale);
 localToAtlas.rotation.y=T.MathUtils.degToRad(descriptor.yawDegrees||0);
 localToAtlas.position.set((anchored?p.x:0)+offset[0],(anchored?heightAt(anchor.x,anchor.z):0)+offset[1],(anchored?p.z:0)+offset[2]);
 localToAtlas.updateMatrix();
 group.matrixAutoUpdate=false;group.matrix.multiplyMatrices(drawing,localToAtlas.matrix);
 const inverse=group.matrix.clone().invert(),sample=new T.Vector3();
 const projectLocal=(longitude,latitude)=>{
  const {x,z}=project(longitude,latitude);sample.set(x,0,z).applyMatrix4(inverse);
  return {x:sample.x,z:sample.z};
 };
 const heightLocal=(x,z)=>{
  sample.set(x,0,z).applyMatrix4(group.matrix);
  return (heightAt(sample.x,sample.z)-localToAtlas.position.y)/scale;
 };
 const made=await factory({record,guide:record.guide,resources:Object.fromEntries(resources.map(([key],i)=>[key,documents[i]])),
  project:projectLocal,heightAt:heightLocal,renderer});
 const site=made?.isObject3D?{group:made}:made;
 if(!site?.group?.isObject3D)throw Error('La visita debe devolver un grupo Three.js · '+record.id);
 group.add(site.group);group.name='Atlas · '+record.name;group.updateMatrixWorld(true);
 return {group,site};
}

export function registerAtlasEntries(records,catalog,byId,tour){
 for(const record of records){
  if(byId[record.id])throw Error('Identificador de visita duplicado · '+record.id);
  const entry={short:record.name,title:record.name,category:'Patrimonio',era:'',description:'',facts:[],features:[],
   radius:30,angle:[45,35,-55],number:catalog.length+1,...record,
   sources:(record.sources||[]).map(s=>typeof s==='string'?s:s.url),
   observationPoints:(record.guide?.stops||[]).map(s=>({...s,label:s.label||s.title,note:s.note||s.intro}))};
  catalog.push(entry);byId[entry.id]=entry;tour.push(entry.id);
 }
}

export function atlasRegisteredScenes(){
 const active=new Map();
 let records=[];
 return {
  register(entries,catalog,byId,tour){
   registerAtlasEntries(entries,catalog,byId,tour);records=entries;
  },
  ids(){return records.map(r=>r.id);},
  city(options,region){
   const local=records.filter(record=>record.region===region||region==='sagunto'&&!record.region);
   if(!local.length)return options;
   const {project}=options,excludeBuildingIds=new Set(options.excludeBuildingIds),exclusions=[...options.exclusions||[]];
   for(const record of local){
    for(const id of record.buildingIds||[])excludeBuildingIds.add(id);
    for(const polygon of record.footprints||[record.footprint].filter(Boolean)){
     // Preserve buildings inside courtyards in the Atlas' simple ring mask.
     if(!polygon.holes?.length)exclusions.push((polygon.coordinates||polygon).map(ll=>project(...ll)));
    }
   }
   return {...options,excludeBuildingIds,exclusions};
  },
  async build(region,options,attach,points){
   for(const record of records){
    if((record.region||'sagunto')!==region)continue;
    const entry=await instantiateAtlasVisit(record,options);
    active.set(record.id,{...entry,region});attach(entry.group);
    const p=options.project(...record.coordinate);
    points[record.id]=new T.Vector3(p.x,options.heightAt(p.x,p.z),p.z);
   }
  },
  visibility(region,visible){
   for(const entry of active.values())entry.group.visible=visible&&entry.region===region;
  },
  select(id,stop){
   const item=active.get(id),record=records.find(r=>r.id===id);
   const s=record?.guide?.stops?.find(s=>s.id===stop);
   item?.site.setHistorical?.(s?.mode==='historical');item?.site.setSection?.(!!s?.requiresSection||s?.mode==='cut');
   item?.site.selectFocus?.(stop||null);
  },
  dispose(region){
   for(const [id,item] of active)if(item.region===region){item.site.dispose?.();active.delete(id);}
  }
 };
}
