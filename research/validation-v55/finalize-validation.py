"""Assemble the final QA/render provenance without changing production files."""
from pathlib import Path
import json,hashlib,datetime,sys
root=Path(__file__).resolve().parents[2]
folder=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda name:json.loads((folder/name).read_text())
names=['castle-simulator-qa.json','castle-v55-qa.json','castle-cameras-qa.json','exterior-paths-qa.json','exterior-qa.json','perimeter-contact-qa.json','east-map-qa.json','catalogue-qa.json']
reports={name:read(name)for name in names}
current=read('renders/render-inspection.json')
initial=read('renders/render-inspection-initial.json')
fresh={item['file']:item for item in current['images']}
images=[]
for item in initial['images']:
    latest=fresh.get(item['file'])
    record=latest or item
    path=folder/'renders'/record['file']
    if sha(path)!=record['sha256']:raise RuntimeError('Changed render: '+record['file'])
    images.append({'file':'renders/'+record['file'],'sha256':record['sha256'],'camera':record['camera'],
        'sourceSnapshot':'final'if latest else 'approved-interior-before-buried-contact-fixes',
        'provenance':'render-inspection.json'if latest else 'render-inspection-initial.json'})
changes=[]
for name,report in reports.items():
    hashes=report.get('sourceHashes',report.get('inputs',{}).get('castleSourceHashes',{}))
    for file,digest in hashes.items():
        if sha(root/file)!=digest:changes.append({'report':name,'file':file})
for file,digest in current['sourceHashes'].items():
    if sha(root/file)!=digest:changes.append({'report':'render-inspection.json','file':file})
files=sorted(set(current['sourceHashes'])|{'dist/js/territory-street-surfaces.js','dist/js/territory-heritage-worker.js','dist/js/territory-heritage-worker-source.js','dist/assets/territory/visit-stops.json','dist/assets/territory/visit-cameras.json','dist/assets/territory/atlas-frames.json'})
sourceHashes={file:sha(root/file)for file in files}
result={'pass':all(report.get('pass')for report in reports.values())and not changes,
    'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceHashes':sourceHashes,
    'reports':{name:{'pass':report.get('pass'),'sha256':sha(folder/name)}for name,report in reports.items()},
    'staleSourceHashes':changes,'visualReview':{'method':'CPU Cycles rendering of actual Three.js buffers and textures; no replacement geometry',
        'notWebGL':True,'freshExteriorImages':list(fresh),'retainedInteriors':'Approved by the primary agent before changes limited to buried foundations, bunker entry and generic exterior paths. Their original camera and source hashes are retained.',
        'ui':'The primary agent records browser/interface checks separately; these images do not include application controls.'},
    'images':images,'geometrySnapshot':{'file':current['sourceInput'],'sha256':sha(Path(current['sourceInput']))}}
(folder/'validation-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'reports':len(reports),'freshExteriorImages':len(fresh),'retainedImages':len(images)-len(fresh),'staleSourceHashes':changes},ensure_ascii=False,indent=2))
if not result['pass']:raise SystemExit(1)
