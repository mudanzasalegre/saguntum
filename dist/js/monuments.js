import * as THREE from 'three';
import {createCastle,castleRoadIds,castleBuildingIds} from './castle.js';
import {createTheatre,theatreRoadIds,theatreBuildingIds} from './theatre.js';
export {createCastle} from './castle.js';
export {createTheatre,theatreRoadIds,theatreBuildingIds} from './theatre.js';

// Each monument owns its materials, textures and architectural reading. Theatre
// terrain accommodation is available before the terrain mesh is constructed;
// the Castle keeps its deferred build over the final rendered ground.
export function createMonuments({heightAt,project,data={},deferCastle=false,castleVisit=data.castleVisit,theatreVisit=data.theatreVisit}){
 const group=new THREE.Group();group.name='monumentos-de-sagunto';
 const theatre=createTheatre({heightAt,project,data,visitData:theatreVisit});group.add(theatre);
 const layout=theatre.userData.layout,center=layout.worldCenter,base=layout.base;
 let castle=null;
 const cp=project(-.2785,39.6764),fp=project(-.2764992,39.6758828);
 const points={theatre:theatre.userData.visit.focuses['teatro-conjunto'].target.clone(),castle:new THREE.Vector3(cp.x,heightAt(cp.x,cp.z)+9,cp.z),forum:new THREE.Vector3(fp.x,heightAt(fp.x,fp.z)+2,fp.z)};
 function buildCastle(finalHeightAt=heightAt){
  if(castle)return castle;
  castle=createCastle({heightAt:finalHeightAt,project,data,visitData:castleVisit});group.add(castle);
  const visit=castle.userData.visit;points.castle.copy(visit.focuses.conjunto.target);points.forum.copy(visit.focuses.foro.target);return castle;
 }
 if(!deferCastle)buildCastle();
 const surfaceHeight=(x,z,raw)=>theatre.userData.surfaceHeight(x,z,raw);
 return {group,theatre,get castle(){return castle;},buildCastle,castleRoadIds,castleBuildingIds,theatreRoadIds,theatreBuildingIds,points,surfaceHeight,theatreBase:base,theatreCenter:{x:center.x,z:center.z},setVisible(which,visible){if(which==='theatre')theatre.visible=visible;if(which==='castle'&&castle)castle.visible=visible;}};
}
