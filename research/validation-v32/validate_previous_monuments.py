"""V32: preserve the published V31 atlas outside the Grau Vell integration.

Byte preservation and registry regression, including the user's explicit water
and Pantalán preservation requirement. Controller behaviour is tested separately.
"""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess
root=Path(__file__).resolve().parents[2]
base='ec5f6599e3a52d791580743c75e5242db6a8b0e9'
checks=[]
def check(ok,label,detail=None):
 checks.append({'pass':bool(ok),'label':label,**({'detail':detail}if not ok and detail is not None else{})})
def digest(data):return hashlib.sha256(data).hexdigest()
def current(path):return (root/path).read_bytes()
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'dist'],cwd=root,text=True).splitlines()
# Read immutable baseline blobs in one process, avoiding one git invocation per file.
query=''.join(base+':'+p+'\n'for p in paths).encode()
raw=subprocess.check_output(['git','cat-file','--batch'],input=query,cwd=root)
old_files={};cursor=0
for path in paths:
 end=raw.index(b'\n',cursor);header=raw[cursor:end].split();assert header[1]==b'blob',(path,header)
 size=int(header[2]);cursor=end+1;old_files[path]=raw[cursor:cursor+size];cursor+=size+1
assert cursor==len(raw)
def before(path):return old_files[path]
allowed={
 'dist/js/app.js':'Grau Vell guided visit, camera and section integration.',
 'dist/js/coast.js':'Grau Vell model and local context integration.',
 'dist/js/coast-grau.js':'Requested fortín architecture and retained surrounding buildings.',
 'dist/index.html':'Grau Vell panel inside the existing complete atlas.',
 'dist/style.css':'Grau Vell map and guide selectors.',
 'dist/assets/data/coast-grau.json':'Grau Vell evidence or explanatory metadata, if updated.'
}
preserved=[];changed=[];changed_allowed=[];hashes={}
for path in paths:
 exists=(root/path).is_file();old_hash=digest(before(path));new_hash=digest(current(path))if exists else None
 same=old_hash==new_hash;hashes[path]={'baseline':old_hash,'current':new_hash,'unchanged':same}
 if path in allowed:
  if not same:changed_allowed.append(path)
 elif same:preserved.append(path)
 else:changed.append(path)
check(not changed,'All V31 distribution assets outside the six declared Grau Vell integrations remain byte-identical',changed)
# Protect every existing coastal/water asset explicitly, in addition to the
# general byte gate. Shared app routing is covered by controller regressions.
water_paths=[p for p in paths if 'water'in Path(p).name or Path(p).name=='coast-environment.js']
pantalan_paths=[p for p in paths if Path(p).name.startswith('pantalan')or Path(p).name in('coast-pier.js','coast-pier.json')]
check(bool(water_paths)and all(hashes[p]['unchanged']for p in water_paths),'All existing water data, geometry, shaders and coastal environment files are unchanged',[p for p in water_paths if not hashes[p]['unchanged']])
check(bool(pantalan_paths)and all(hashes[p]['unchanged']for p in pantalan_paths),'All Pantalán model, context, maps, guides and data files are unchanged',[p for p in pantalan_paths if not hashes[p]['unchanged']])
old=json.loads(before('dist/assets/data/coast-grau.json'));new=json.loads(current('dist/assets/data/coast-grau.json'))
check([s['id']for s in old['sites']]==[s['id']for s in new['sites']],'Existing Grau Vell place identity and order remain intact')
metadata={'sources','evidence','stateAsOf','features','modelNote','currentState','facts','description','look','history','title'}
for previous,target in zip(old['sites'],new['sites']):
 changed_fields=[key for key in previous if previous[key]!=target.get(key)]
 check(set(changed_fields)<=metadata,previous['id']+' retains its mapped anchor, footprints and existing spatial provenance',changed_fields)

app=current('dist/js/app.js').decode();old_app=before('dist/js/app.js').decode()
def requests(s):
 m=re.search(r'const loaded=await Promise\.all\(\[(.*?)\]\.map',s,re.S)
 return re.findall(r"'([^']+)'",m.group(1))if m else[]
a,b=requests(old_app),requests(app)
check(len(a)==89 and len(b)==92,'Initial data requests grow from89 in V31 to92 in V32')
check(b[:len(a)]==a and b[len(a):]==['grau-visit','grau-plan','grau-context'],'The89 existing request slots remain unchanged; three Grau Vell datasets are appended')
def guides(s):
 m=re.search(r'const guidedIds=\[(.*?)\];',s,re.S)
 return re.findall(r"'([^']+)'",m.group(1))if m else[]
ga,gb=guides(old_app),guides(app)
check(len(ga)==26 and len(gb)==27,'Detailed visits grow from26 to27')
check(gb[:len(ga)]==ga and gb[len(ga):]==['grau-vell'],'All previous detailed visit IDs and their order remain intact')
old_catalog=before('dist/js/catalog.js').decode();catalog=current('dist/js/catalog.js').decode()
check(old_catalog==catalog,'The original historic-centre catalog is byte-identical')
def place_ids(catalog,content,loader):
 ids=set(re.findall(r"\{id:'([^']+)'",catalog))
 for name in loader:
  data=json.loads(content('dist/assets/data/'+name+'.json'))
  ids.update(s['id']for s in data.get('sites',[]))
 return ids
old_places=place_ids(old_catalog,before,a);new_places=place_ids(catalog,current,b)
check(len(old_places)==len(new_places)==31 and old_places==new_places,'All31 existing atlas place IDs are preserved')
html=current('dist/index.html').decode();old_html=before('dist/index.html').decode()
class Document(HTMLParser):
 def __init__(self):super().__init__();self.ids=[]
 def handle_starttag(self,tag,attrs):
  value=dict(attrs).get('id')
  if value:self.ids.append(value)
old_doc=Document();old_doc.feed(old_html);new_doc=Document();new_doc.feed(html)
check(set(old_doc.ids)<=set(new_doc.ids),'Every pre-existing HTML ID is retained',sorted(set(old_doc.ids)-set(new_doc.ids)))
check('<title>SAGUNTUM · Sagunto y Puerto de Sagunto</title>'in html,'The complete-atlas title remains intact')
check('href="#atlas"'in html and'ATLAS VIVO'in html,'SAGUNTUM branding and general home remain intact')
check('31 lugares · 6 ámbitos'in html,'The welcome screen retains the full atlas count')
check("if(!value||value==='atlas')return{name:'atlas',stopId:null};"in app,'Empty and #atlas routes resolve to the complete atlas')
for id in ga:check(f'id="{id}-panel"'in html,id+' guided panel remains available')
existing_data=[p for p in paths if p.startswith('dist/assets/data/')and p.endswith('.json')and p!='dist/assets/data/coast-grau.json']
check(all(hashes[p]['unchanged']for p in existing_data),'Every pre-existing JSON dataset outside Grau Vell remains byte-identical')
result={'pass':all(c['pass']for c in checks),'baselineCommit':base,'preservedAssets':len(preserved),'unchangedDataFiles':len(existing_data),'allowedIntegrationFiles':allowed,'changedAllowedFiles':changed_allowed,'atlasPlaceIds':sorted(new_places),'guidedVisitIds':gb,'waterHashes':{p:hashes[p]for p in water_paths},'pantalanHashes':{p:hashes[p]for p in pantalan_paths},'checks':checks,'failures':[c for c in checks if not c['pass']],'limitations':['Source and registry preservation are tested here; controller interaction tests cover shared routing. No browser, GPU or visual equivalence claim is made by this report.']}
(root/'research/validation-v32/previous-monuments-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:result[k]for k in['pass','baselineCommit','preservedAssets','unchangedDataFiles','failures']},ensure_ascii=False))
raise SystemExit(0 if result['pass']else 1)
