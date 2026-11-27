import fs from 'node:fs';
import {buildEastRock} from '../../dist/js/castle-east-rock.js';
const project=(lon,lat)=>({x:(lon+.278)*111320*Math.cos(39.679*Math.PI/180),z:(39.679-lat)*111320});
const results=[];
for(const detail of ['full','light']){
 const pieces=[],qa={};
 // Non-flat sampler exposes floating/invalid-vertex errors; no terrain mutation.
 const heightAt=(x,z)=>110+.08*z+Math.sin(x/14)*2;
 const batch={raw:(key,positions,tint)=>pieces.push({key,positions,tint})};
 const report=buildEastRock({batch,keyFor:(...xs)=>xs.join('|'),project,heightAt,detail,qa});
 if(pieces.some(p=>p.positions.some(n=>!Number.isFinite(n))||p.positions.length%9))throw new Error('Invalid triangles');
 const ids=new Set(pieces.map(p=>p.key.split('|')[1]));
 if(ids.size!==5)throw new Error('Unexpected feature count');
 if(pieces.some(p=>p.key.split('|')[0]!=='almenara'||p.key.split('|')[2]!=='unknown'))throw new Error('Invalid material grouping');
 const positions=pieces.flatMap(p=>p.positions);
 let reliefMax=-Infinity,reliefMin=Infinity;
 for(let i=0;i<positions.length;i+=3){const h=positions[i+1]-heightAt(positions[i],positions[i+2]);reliefMax=Math.max(reliefMax,h);reliefMin=Math.min(reliefMin,h);}
 if(reliefMax>1.20||reliefMin<-.16)throw new Error('Unexpected ground-relative relief');
 if(report.terrainModified||report.polygonSolidFill||report.largeTrees)throw new Error('Unsupported intervention');
 const summary={detail,rockFragments:report.rockFragments,beddingLedges:report.beddingLedges,scrubTufts:report.scrubTufts,grassTufts:report.grassTufts,triangles:report.triangles,drawGroups:new Set(pieces.map(p=>p.key)).size,reliefMin,reliefMax,features:report.features,rejectedProtected:report.rejectedProtected,rejectedOverlap:report.rejectedOverlap,rejectedBoundary:report.rejectedBoundary};
 fs.writeFileSync(new URL(`./east-layout-rock-${detail}.json`,import.meta.url),JSON.stringify({summary,footprints:report.footprints},null,2));
 results.push(summary);
}
fs.writeFileSync(new URL('./east-layout-rock-summary.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
