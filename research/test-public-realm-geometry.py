import json,gzip,base64,math,pathlib,argparse,warnings
warnings.filterwarnings("ignore",category=DeprecationWarning)
import numpy as np
from collections import defaultdict
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Audit shared public paving against actual church geometry and its stair/perimeter walls.')
parser.add_argument('--geometry',type=pathlib.Path,required=True)
parser.add_argument('--out',type=pathlib.Path,required=True)
args=parser.parse_args();SRC=args.geometry
data=json.load(gzip.open(SRC,'rt'))
record=next(s for s in json.load(open(ROOT/'dist/assets/data/landmarks.json'))['sites'] if s['id']=='santa-maria')
context=json.load(open(ROOT/'dist/assets/data/santa-maria-context.json'))
sc=111320*math.cos(39.679*math.pi/180);cx=(record['coordinate'][0]+.278)*sc;cz=(39.679-record['coordinate'][1])*111320
co=math.cos(1.173);si=math.sin(1.173)
def arr(d):return np.frombuffer(base64.b64decode(d['data']),dtype={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[d['type']])
def loc(p):
 x=(p[0]+.278)*sc-cx;z=(39.679-p[1])*111320-cz
 return np.array([x*co-z*si,x*si+z*co])
def mesh(i):
 m=data['meshes'][i];p=arr(m['positions']).reshape(-1,3).astype('f8');mat=np.array(m['matrix']).reshape(4,4).T;p=p@mat[:3,:3].T+mat[:3,3]
 x=p[:,0]-cx;z=p[:,2]-cz;p[:,0]=x*co-z*si;p[:,2]=x*si+z*co
 if m['indices']:p=p[arr(m['indices'])]
 return p.reshape(-1,3,3)
def area(p):return sum(np.cross(p[(i+1)%len(p)]-a,p[(i+2)%len(p)]-a) for i,a in enumerate(p))/len(p)/2 if len(p)==3 else sum(a[0]*p[(i+1)%len(p)][1]-a[1]*p[(i+1)%len(p)][0] for i,a in enumerate(p))/2
def clip(poly,outline):
 if area(outline)<0:outline=outline[::-1]
 for k,a in enumerate(outline):
  b=outline[(k+1)%len(outline)];out=[]
  if len(poly)<3:return []
  for i,p in enumerate(poly):
   q=poly[(i+1)%len(poly)];dp=np.cross(b-a,p-a);dq=np.cross(b-a,q-a)
   if dp>=-1e-8:out.append(p)
   if (dp>=0)!=(dq>=0):out.append(p+(q-p)*dp/(dp-dq))
  poly=out
 return poly
floorId=next(i for i,m in enumerate(data['meshes']) if m.get('churchFabric') and m.get('component')=='pavimento' and m['material']['kind']=='paving')
thresholdY=float(mesh(floorId)[:,:,1].max())
# Door reveals can also contain a horizontal sill at the church floor level.
# Include them, not only components explicitly named floor/threshold.
coreIds=[i for i,m in enumerate(data['meshes']) if m.get('churchFabric') and m['material']['kind'] in ['stone','paving','trim']]
southId=next(i for i,m in enumerate(data['meshes']) if m.get('component')=='santa-maria-atrio-sur' and m['material']['kind']=='stone')
westId=next(i for i,m in enumerate(data['meshes']) if m['name'].startswith('Plaça dels Tarongers') and m['material']['kind']=='stone')
pavingId=next(i for i,m in enumerate(data['meshes']) if m['name'].startswith('Plaça dels Tarongers') and m['material']['kind']=='paving')
floors=[]
for i in coreIds:
 ts=mesh(i)
 for t in ts[(np.ptp(ts[:,:,1],axis=1)<1e-5)&(np.abs(ts[:,0,1]-thresholdY)<2e-5)]:
  # Up-facing floor/sill surfaces compete with the public pavement. The
  # downward face of a pedestal resting on the floor is buried by that solid.
  normalY=np.cross(t[1]-t[0],t[2]-t[0])[1]
  if normalY>1e-6 and abs(area(t[:,[0,2]]))>1e-6:floors.append((i,t))
overlaps=[]
for index in [southId,westId]:
 total=defaultdict(float);bounds=[]
 for n,t in enumerate(mesh(index)):
  if np.ptp(t[:,1])>1e-5 or abs(area(t[:,[0,2]]))<1e-6:continue
  for other,q in floors:
   if abs(t[0,1]-q[0,1])>2e-5:continue
   if np.any(t[:,[0,2]].max(0)<q[:,[0,2]].min(0)) or np.any(q[:,[0,2]].max(0)<t[:,[0,2]].min(0)):continue
   p=clip(list(t[:,[0,2]]),q[:,[0,2]])
   if len(p)>2 and abs(area(p))>1e-6:
    a=abs(area(p));total[other]+=a;bounds.extend(p)
 if bounds:overlaps.append({'mesh':data['meshes'][index]['name'],'areaByCoreComponent':{data['meshes'][i]['component']:v for i,v in total.items()},'bounds':[np.min(bounds,axis=0).tolist(),np.max(bounds,axis=0).tolist()]})

paving=mesh(pavingId)
def make_grid(triangles):
 result=defaultdict(list)
 for i,t in enumerate(triangles):
  x0,z0=np.floor(t[:,[0,2]].min(0)*2).astype('i4');x1,z1=np.floor(t[:,[0,2]].max(0)*2).astype('i4')
  for x in range(x0,x1+1):
   for z in range(z0,z1+1):result[(x,z)].append(i)
 return result
grid=make_grid(paving)
def at(x,z,triangles=paving,index=grid):
 hits=[]
 for i in index[(math.floor(x*2),math.floor(z*2))]:
  a,b,c=triangles[i];u=b[[0,2]]-a[[0,2]];v=c[[0,2]]-a[[0,2]];w=np.array([x,z])-a[[0,2]];d=np.cross(u,v)
  if abs(d)<1e-12:continue
  s=np.cross(w,v)/d;t=np.cross(u,w)/d
  if s>=-1e-6 and t>=-1e-6 and s+t<=1+1e-6:hits.append(float(a[1]+s*(b[1]-a[1])+t*(c[1]-a[1])))
 return sorted(set(round(y,6) for y in hits))
plaza=np.array([loc(p) for p in context['surfaces'][0]['coordinates'][:-1]])
connector=np.array([[11.72,-31.65],[14.18,-31.65],[14.18,-28.88],[11.72,-28.88]])
def distance(p,a,b):
 d=b-a;u=np.dot(p-a,d)/np.dot(d,d);return np.linalg.norm(p-(a+d*np.clip(u,0,1)))
outline=[(a,p[(i+1)%len(p)]) for p in [plaza,connector] for i,a in enumerate(p)]
stone=mesh(westId);bad=[];perimeters=0
for i in range(0,len(stone)-1,2):
 t,u=stone[i],stone[i+1]
 if np.linalg.norm(t[0]-u[0])>1e-5 or np.linalg.norm(t[2]-u[1])>1e-5:continue
 a,c=t[2],u[2]
 if np.linalg.norm(a[[0,2]]-c[[0,2]])<1e-5:continue
 if not any(distance(a[[0,2]],p,q)<2e-5 and distance(c[[0,2]],p,q)<2e-5 for p,q in outline):continue
 # These are sidewall upper edges, whose other two vertices are below them.
 if t[0,1]>u[2,1]-.1 or t[1,1]>t[2,1]-.1:continue
 perimeters+=1
 d=c[[0,2]]-a[[0,2]];normal=np.array([-d[1],d[0]])/np.linalg.norm(d)
 for f in [.13,.37,.63,.87]:
  p=a*(1-f)+c*f;levels=[]
  for side in [-1,1]:levels+=at(*(p[[0,2]]+normal*.001*side))
  if not levels:continue
  nearest=min(levels,key=lambda y:abs(y-p[1]));delta=p[1]-nearest
  if abs(delta)>.005:bad.append({'triangle':i,'local':[float(p[0]),float(p[2])],'wallTop':float(p[1]),'paving':nearest,'delta':float(delta),'edge':[a.tolist(),c.tolist()]})
planes=[]
for i,t in enumerate(stone):
 if np.ptp(t[:,0])>2e-5 or abs(area(t[:,[2,1]]))<1e-7:continue
 x=float(t[:,0].mean())
 plane=next((p for p in planes if abs(p['x']-x)<2e-5),None)
 if plane is None:plane={'x':x,'triangles':[]};planes.append(plane)
 plane['triangles'].append((i,t[:,[2,1]]))
duplicateArea=0.;duplicates=[];riserGaps=[];riserSamples=0;riserPlanes=[]
def inside2(point,t):
 a,b,c=t;u=b-a;v=c-a;w=point-a;d=np.cross(u,v)
 if abs(d)<1e-12:return False
 s=np.cross(w,v)/d;r=np.cross(u,w)/d
 return s>=-1e-5 and r>=-1e-5 and s+r<=1+1e-5
for plane in planes:
 triangles=plane['triangles'];overlap=0.
 for j,(ix,t) in enumerate(triangles):
  for iy,q in triangles[j+1:]:
   if np.any(t.max(0)<q.min(0)) or np.any(q.max(0)<t.min(0)):continue
   p=clip(list(t),q)
   if len(p)>2:overlap+=abs(area(p))
 if overlap>.00001:duplicates.append({'localX':plane['x'],'coplanarAreaM2':overlap})
 duplicateArea+=overlap
 x=plane['x'];checked=0;gapsBefore=len(riserGaps)
 # Intentional steps are discontinuous height fields. Probe between actual
 # riser vertices as well as a bounded coarse sweep, across the whole source
 # square and its connector. A vertical face is required only where the two
 # adjoining pavement surfaces exist and have distinct elevations.
 zmin=min(plaza[:,1].min(),connector[:,1].min());zmax=max(plaza[:,1].max(),connector[:,1].max())
 divisions=sorted(set([round(float(v),5) for i,t in triangles for v in t[:,0] if zmin<=v<=zmax]+[round(float(v),5) for v in np.arange(zmin,zmax+.25,.25)]+[float(zmin),float(zmax)]))
 for z in [(a+b)/2 for a,b in zip(divisions,divisions[1:]) if b-a>2e-5]:
  left=at(x-.001,z);right=at(x+.001,z)
  if len(left)!=1 or len(right)!=1 or abs(left[0]-right[0])<.01:continue
  riserSamples+=1;checked+=1
  y=(left[0]+right[0])/2
  if not any(inside2(np.array([z,y]),t) for i,t in triangles):riserGaps.append({'local':[x,float(z)],'lower':min(left[0],right[0]),'upper':max(left[0],right[0])})
 if checked:riserPlanes.append({'localX':x,'samples':checked,'gaps':len(riserGaps)-gapsBefore})
connectorSamples=0;connectorMissing=[]
for x in np.arange(11.733,14.17,.123):
 for z in np.arange(-31.638,-28.89,.117):
  connectorSamples+=1
  if not at(x,z):connectorMissing.append([float(x),float(z)])
streetIds=[i for i,m in enumerate(data['meshes']) if m['name'].startswith('Pavimento y bordes') and m.get('component') in ['santa-maria-cavallers','santa-maria-sagrario'] and m['material']['kind']=='paving']
street=np.concatenate([mesh(i) for i in streetIds]);streetGrid=make_grid(street)
sharedSamples=0;shared=[]
for x in np.arange(8.013,16,.173):
 for z in np.arange(-35.017,-27.6,.163):
  own=at(x,z)
  if not own:continue
  sharedSamples+=1
  other=at(x,z,street,streetGrid)
  if other:shared.append({'local':[float(x),float(z)],'public':own,'street':other})
overlapArea=sum(sum(o['areaByCoreComponent'].values()) for o in overlaps)
# The two buffers store their common edges in different local/world Float32
# frames. Residual strips a few micrometres wide are recorded, not mistaken for
# a second floor. The tolerance is 1 square centimetre across the whole model.
areaTolerance=.0001
out={'source':str(SRC),'coplanarCoreOverlaps':overlaps,'coplanarCoreAreaM2':overlapArea,'areaToleranceM2':areaTolerance,'perimeterQuads':perimeters,'perimeterMismatches':len(bad),'largestMismatches':sorted(bad,key=lambda v:abs(v['delta']),reverse=True)[:12],'coplanarRiserAreaM2':duplicateArea,'coplanarRisers':duplicates,'riserSamples':riserSamples,'riserPlanes':riserPlanes,'riserGapSamples':len(riserGaps),'riserGaps':riserGaps[:12],'connectorTopSamples':connectorSamples,'connectorTopMissing':connectorMissing,'streetOwnershipSamples':sharedSamples,'duplicatePublicStreetSamples':shared}
out['pass']=bool(overlapArea<areaTolerance and perimeters>0 and not bad and duplicateArea<areaTolerance and riserSamples>0 and not riserGaps and not connectorMissing and sharedSamples>0 and not shared)
args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(out,indent=2))
print(json.dumps({k:out[k] for k in ['pass','coplanarCoreAreaM2','perimeterQuads','perimeterMismatches','coplanarRiserAreaM2','riserSamples','riserGapSamples','connectorTopSamples','streetOwnershipSamples']}|{'riserPlanes':len(riserPlanes),'missingTop':len(connectorMissing),'streetDuplicates':len(shared),'report':str(args.out)},indent=2))
if not out['pass']:raise SystemExit(1)
