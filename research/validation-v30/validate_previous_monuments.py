"""Ensure the Sanatorio iteration preserves the previously published atlas content."""
from pathlib import Path
import hashlib,json,re,subprocess

root=Path(__file__).resolve().parents[2]
base='002c16138572afb230fb5754a58efe2946c0b5ee'
def before(path):return subprocess.check_output(['git','show',base+':'+path],cwd=root)
def current(path):return (root/path).read_bytes()
def digest(data):return hashlib.sha256(data).hexdigest()
checks=[]
def check(ok,label,detail=None):checks.append({'pass':bool(ok),'label':label,**({'detail':detail}if not ok else{})})
allowed={'dist/js/app.js','dist/js/port.js','dist/js/port-workers.js','dist/index.html','dist/style.css','dist/assets/data/port-workers.json'}
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'dist'],cwd=root,text=True).splitlines()
changed=[]
for path in paths:
    if path in allowed:continue
    if not (root/path).is_file() or digest(before(path))!=digest(current(path)):changed.append(path)
check(not changed,'All previously published assets outside the six integration files remain byte-identical',changed)
old=json.loads(before('dist/assets/data/port-workers.json'));new=json.loads(current('dist/assets/data/port-workers.json'))
old_sites={s['id']:s for s in old['sites']};new_sites={s['id']:s for s in new['sites']}
check(old_sites.keys()==new_sites.keys(),'The workers group preserves all existing place IDs')
for key in old_sites:
    if key!='sanatorio':check(old_sites[key]==new_sites[key],key+' cadastral and documentary record is unchanged')
old_barrio=old_sites['sanatorio'];new_barrio=new_sites['sanatorio']
metadata={'modelNote','evidence','description','historicalNote','updatedAt','stateAsOf','sources'}
geometry_changes=[k for k in old_barrio if k not in metadata and old_barrio[k]!=new_barrio.get(k)]
check(not geometry_changes,'Sanatorio keeps its previous registered cadastral geometry, references and paths',geometry_changes)
app=current('dist/js/app.js').decode();old_app=before('dist/js/app.js').decode()
def requests(s):
    match=re.search(r'const loaded=await Promise\.all\(\[(.*?)\]\.map',s,re.S)
    return re.findall(r"'([^']+)'",match.group(1))
a,b=requests(old_app),requests(app)
check(b[:len(a)]==a and b[len(a):]==['sanatorio-visit','sanatorio-plan','sanatorio-context'],'The original request order is unchanged and only the three Sanatorio datasets are appended')
html=current('dist/index.html').decode()
check('<title>SAGUNTUM · Sagunto y Puerto de Sagunto</title>' in html,'Global SAGUNTUM title remains intact')
check('href="#atlas"' in html,'Atlas home link remains intact')
for scope in ['barrio-obrero','economato','begona','casino','gerencia','museo-industrial','talleres','horno','necropolis','circo','domus','portic']:
    check(f'id="{scope}-panel"' in html,scope+' guided panel remains available')
result={'pass':all(c['pass']for c in checks),'baselineCommit':base,'preservedAssets':len(paths)-len(allowed),'checks':checks,'failures':[c for c in checks if not c['pass']]}
(root/'research/validation-v30/previous-monuments-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['pass','preservedAssets','failures']},ensure_ascii=False))
raise SystemExit(0 if result['pass']else 1)
