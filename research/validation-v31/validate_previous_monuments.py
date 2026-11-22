"""V31: preserve the published V30 atlas outside explicit coastal integrations.

This is a byte-level and registry regression gate. Shared controller behaviour
is covered separately by the interaction regressions; no browser claim is made.
"""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess

root=Path(__file__).resolve().parents[2]
base='8f1f5325e46876ec4688331017e3b466412418cb'
def before(path):return subprocess.check_output(['git','show',base+':'+path],cwd=root)
def current(path):return (root/path).read_bytes()
def digest(data):return hashlib.sha256(data).hexdigest()
checks=[]
def check(ok,label,detail=None):checks.append({'pass':bool(ok),'label':label,**({'detail':detail}if not ok and detail is not None else{})})

allowed={
 'dist/js/app.js':'Two coastal visits and their region, light and inspection integration.',
 'dist/js/coast.js':'Coastal model, context and retained road segments.',
 'dist/js/coast-pier.js':'Requested terrestrial and maritime Pantalán geometry.',
 'dist/js/coast-environment.js':'Requested coastal water, light and inspection rendering.',
 'dist/js/city.js':'Additional coastal detail area alongside existing detail regions.',
 'dist/js/castle-panel.js':'Shared guide presentation-mode and related-visit controls.',
 'dist/index.html':'Two additional guide panels; existing brand and home preserved.',
 'dist/style.css':'Coastal guide and shared presentation controls.',
 'dist/assets/data/coast-pier.json':'V31 coastal metadata and mapped promenade kiosk.',
}
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'dist'],cwd=root,text=True).splitlines()
preserved=[];changed=[];changed_allowed=[]
for path in paths:
    same=(root/path).is_file() and digest(before(path))==digest(current(path))
    if path in allowed:
        if not same:changed_allowed.append(path)
    elif same:preserved.append(path)
    else:changed.append(path)
check(not changed,'All V30 distribution assets outside the nine declared coastal/shared integrations remain byte-identical',changed)

old=json.loads(before('dist/assets/data/coast-pier.json'));new=json.loads(current('dist/assets/data/coast-pier.json'))
check([s['id']for s in old['sites']]==[s['id']for s in new['sites']],'The two coastal place IDs and order are unchanged')
for key in ['title','historicalDate','axis','preservedSupports','sideSupports','sources']:
    check(old[key]==new[key],'Registered coastal '+key+' is unchanged')
old_sites={s['id']:s for s in old['sites']};new_sites={s['id']:s for s in new['sites']}
for id,previous in old_sites.items():
    target=new_sites[id]
    changes=[key for key in previous if previous[key]!=target.get(key)]
    permitted={'stateAsOf','features','modelNote','osmBuildingIds'}
    check(set(changes)<=permitted,id+' preserves registered location, dimensions, historical content and sources',changes)
    check(previous['coordinate']==target['coordinate'],id+' original atlas coordinate is unchanged')
check(new_sites['pantalan-paseo'].get('promenadeKiosk',{}).get('osmId') in ('1430889843',1430889843) or new_sites['pantalan-paseo'].get('promenadeKiosk',{}).get('id') in ('1430889843',1430889843),'The added promenade envelope identifies its mapped kiosk')

app=current('dist/js/app.js').decode();old_app=before('dist/js/app.js').decode()
def requests(s):
    m=re.search(r'const loaded=await Promise\.all\(\[(.*?)\]\.map',s,re.S)
    return re.findall(r"'([^']+)'",m.group(1))if m else[]
a,b=requests(old_app),requests(app)
check(len(a)==84 and len(b)==89,'V30 has84 initial requests and V31 has89')
check(b[:len(a)]==a and b[len(a):]==['pantalan-paseo-visit','pantalan-paseo-plan','pantalan-maritimo-visit','pantalan-maritimo-plan','pantalan-context'],'The84 existing dataset slots remain unchanged; exactly five coastal datasets are appended')
def guides(s):
    m=re.search(r'const guidedIds=\[(.*?)\];',s,re.S)
    return re.findall(r"'([^']+)'",m.group(1))if m else[]
ga,gb=guides(old_app),guides(app)
check(len(ga)==24 and len(gb)==26,'Detailed visits grow from24 to26')
check(gb[:len(ga)]==ga and gb[len(ga):]==['pantalan-paseo','pantalan-maritimo'],'All previous detailed visit IDs and order are preserved')

old_catalog=before('dist/js/catalog.js').decode();catalog=current('dist/js/catalog.js').decode()
check(old_catalog==catalog,'The original historic-centre catalog is byte-identical')
def place_ids(catalog,content,loader):
    ids=set(re.findall(r"\{id:'([^']+)'",catalog))
    for name in loader:
        data=json.loads(content('dist/assets/data/'+name+'.json'))
        ids.update(s['id']for s in data.get('sites',[]))
    return ids
old_places=place_ids(old_catalog,before,a);new_places=place_ids(catalog,current,b)
check(len(old_places)==len(new_places)==31 and old_places==new_places,'All31 atlas place IDs are preserved')

html=current('dist/index.html').decode();old_html=before('dist/index.html').decode()
class Document(HTMLParser):
    def __init__(self):super().__init__();self.ids=[]
    def handle_starttag(self,tag,attrs):
        value=dict(attrs).get('id')
        if value:self.ids.append(value)
old_doc=Document();old_doc.feed(old_html);new_doc=Document();new_doc.feed(html)
check(set(old_doc.ids)<=set(new_doc.ids),'Every pre-existing HTML ID is retained',sorted(set(old_doc.ids)-set(new_doc.ids)))
check('<title>SAGUNTUM · Sagunto y Puerto de Sagunto</title>'in html,'The global SAGUNTUM title is intact')
check('href="#atlas"'in html and 'ATLAS VIVO'in html,'The brand and home link are intact')
check('31 lugares · 6 ámbitos'in html,'The welcome screen retains the complete atlas count')
check("if(!value||value==='atlas')return{name:'atlas',stopId:null};"in app,'Empty and general home hashes resolve to the atlas')
for id in ga:check(f'id="{id}-panel"'in html,id+' guided panel remains available')

existing_data=[p for p in paths if p.startswith('dist/assets/data/') and p.endswith('.json') and p!='dist/assets/data/coast-pier.json']
check(all(digest(before(p))==digest(current(p))for p in existing_data),'Every original non-Pantalán JSON dataset remains byte-identical')
result={'pass':all(c['pass']for c in checks),'baselineCommit':base,'preservedAssets':len(preserved),
 'unchangedDataFiles':len(existing_data),'allowedIntegrationFiles':allowed,'changedAllowedFiles':changed_allowed,
 'atlasPlaceIds':sorted(new_places),'guidedVisitIds':gb,'checks':checks,
 'failures':[c for c in checks if not c['pass']],
 'limitations':['Shared controller semantics are validated separately; this report verifies source preservation, identity, request order and registry integrity.']}
(root/'research/validation-v31/previous-monuments-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:result[k]for k in['pass','baselineCommit','preservedAssets','unchangedDataFiles','failures']},ensure_ascii=False))
raise SystemExit(0 if result['pass']else 1)
