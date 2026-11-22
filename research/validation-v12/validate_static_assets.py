"""Buildless distribution gate: syntax, local imports/assets, data, IDs and visit links.

Run after removing temporary browser QA entrypoints. This does not mutate dist.
"""
from pathlib import Path
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor
import collections,hashlib,json,re,subprocess

ROOT=Path(__file__).resolve().parents[2]
DIST=ROOT/'dist'
checks=[]
def check(value,label,detail=None):
    checks.append({'pass':bool(value),'label':label,**({'detail':detail}if not value and detail is not None else{})})
def short(path):return str(path.relative_to(ROOT))
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def local_path(value,relative_to):
    if not value or re.match(r'^(?:[a-z]+:|//|#)',value,re.I):return None
    return (DIST/value.lstrip('/') if value.startswith('/') else relative_to/value).resolve()

files=[ROOT/p for p in subprocess.check_output(['rg','--files','dist'],cwd=ROOT,text=True).splitlines()]
temporary=[p for p in files if p.name.startswith('__qa')]
check(not temporary,'temporary QA pages are absent from the distribution',[short(p)for p in temporary])
js=[p for p in files if p.suffix=='.js']
def syntax(path):
    result=subprocess.run(['node','--check',str(path)],text=True,capture_output=True)
    return path,result.returncode==0,result.stderr.strip()
with ThreadPoolExecutor(max_workers=8)as pool:
    for path,ok,error in pool.map(syntax,js):check(ok,'JavaScript syntax: '+short(path),error)

html=(DIST/'index.html').read_text()
import_map=json.loads(re.search(r'<script\s+type="importmap"[^>]*>(.*?)</script>',html,re.S).group(1))['imports']
imports=[]
for source in js:
    text=re.sub(r'/\*[\s\S]*?\*/','',source.read_text())
    text=re.sub(r'^\s*//.*$','',text,flags=re.M)
    specs=re.findall(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']''',text)
    for spec in specs:
        if spec.startswith(('.', '/')):target=local_path(spec.split('?')[0],source.parent)
        elif spec in import_map:target=local_path(import_map[spec],DIST)
        elif re.match(r'^https?://',spec):continue
        else:target=None
        imports.append({'source':short(source),'specifier':spec,'target':short(target)if target and target.is_relative_to(ROOT)else None})
        check(target is not None and target.is_file(),'module dependency: '+short(source)+' → '+spec,imports[-1])
for spec,url in import_map.items():
    path=local_path(url,DIST);check(path and path.is_file(),'import-map target: '+spec,url)

class Document(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.assets=[];self.references=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        for key in('src','href'):
            if a.get(key):self.assets.append(a[key])
        for key in('aria-controls','aria-labelledby','for'):
            if a.get(key):self.references.extend(a[key].split())
document=Document();document.feed(html)
counts=collections.Counter(document.ids)
check(all(n==1 for n in counts.values()),'initial HTML IDs are unique',{id:n for id,n in counts.items()if n>1})
check(all(id in counts for id in document.references),'initial HTML accessibility targets exist',[id for id in document.references if id not in counts])
assets=[]
for value in document.assets:
    path=local_path(value.split('?')[0],DIST)
    if path:assets.append(path);check(path.is_file(),'HTML local asset: '+value)
def css_urls(text):
    # Consume quoted data URIs as a whole: an SVG's internal url(%23filter)
    # is not a separate filesystem reference in the surrounding stylesheet.
    cursor=0
    while match:=re.search(r'url\(\s*',text[cursor:],re.I):
        start=cursor+match.end();quote=text[start:start+1]
        if quote in("'",'"'):
            begin=start+1;end=begin
            while end<len(text):
                if text[end]==quote and text[end-1]!='\\':break
                end+=1
            value=text[begin:end];cursor=text.find(')',end)+1
        else:
            end=text.find(')',start)
            if end<0:break
            value=text[start:end].strip();cursor=end+1
        if cursor<=start:break
        yield value
for source in[p for p in files if p.suffix=='.css']:
    for value in css_urls(source.read_text()):
        path=local_path(value.split('?')[0],source.parent)
        if path:assets.append(path);check(path.is_file(),'CSS local asset: '+value)

json_files=[p for p in files if p.suffix=='.json']
json_data={}
for path in json_files:
    try:json_data[path.stem]=json.loads(path.read_text());check(True,'JSON parses: '+short(path))
    except Exception as exc:check(False,'JSON parses: '+short(path),str(exc))

app=(DIST/'js/app.js').read_text()
initial=re.search(r'const loaded=await Promise\.all\(\[(.*?)\]\.map',app,re.S)
initial_names=re.findall(r"'([^']+)'",initial.group(1))if initial else[]
check(len(initial_names)==33,'33 initial data requests are declared',initial_names)
deferred=['cartography','elevation','port-cartography','port-elevation','coast-cartography','coast-elevation','coast-water']+[region+'-'+name for region in['marjal','almarda','palancia']for name in['cartography','elevation','water']]
for name in initial_names+deferred:check((DIST/'assets/data'/f'{name}.json').is_file(),'runtime data request: '+name)

visit=json_data.get('calvario-visit',{});plan=json_data.get('calvario-plan',{})
stops=visit.get('stops',[]);plan_stops=plan.get('stops',[]);stop_ids=[s['id']for s in stops];plan_ids=[s['id']for s in plan_stops]
check(len(stop_ids)==len(set(stop_ids))==18,'18 unique calvario stop IDs')
check(set(stop_ids)==set(plan_ids),'serialized calvario plan and historical visit share all stop IDs')
by_id={s['id']:s for s in plan_stops}
# Visit coordinates are published to eight decimals; the model retains full
# precision. A 1e-7 degree tolerance is below 1.2 cm at this latitude and checks
# the same physical focus without treating decimal serialization as a move.
def same_coordinate(a,b):
    return isinstance(a,list) and isinstance(b,list) and len(a)==len(b)==2 and all(abs(x-y)<=1e-7 for x,y in zip(a,b))
check(all(same_coordinate(s.get('coordinate'),by_id.get(s['id'],{}).get('coordinates')) for s in stops),'historical visit coordinates agree with serialized model plan within 1e-7 degree')
source_ids={s['id']for s in visit.get('sources',[])};region_ids={r['id']for r in visit.get('regions',[])}
check(all(s.get('regionId')in region_ids for s in stops),'all calvario stops belong to a declared historical region')
reference_ids=[]
def walk(value):
    if isinstance(value,dict):
        for key,item in value.items():
            if key in('sourceIds','coordinateSourceIds'):reference_ids.extend(item)
            else:walk(item)
    elif isinstance(value,list):
        for item in value:walk(item)
walk(visit)
check(all(id in source_ids for id in reference_ids),'all historical and coordinate citations resolve',[id for id in reference_ids if id not in source_ids])
check('sectionInstructions'not in visit,'calvario visit does not advertise an unimplemented section')
for id in['castle-panel','theatre-panel','santa-maria-panel','plaza-mayor-panel','juderia-panel','calvario-panel']:check(id in counts,'separate guided-visit panel exists: '+id)

result={'pass':all(c['pass']for c in checks),'stage':'preflight'if temporary else'final','counts':{'distributionFiles':len(files),'javascriptFiles':len(js),'localImports':len(imports),'jsonFiles':len(json_files),'initialRequests':len(initial_names),'deferredRequests':len(deferred),'htmlIds':len(document.ids),'localHTMLAndCSSAssets':len(assets),'calvarioStops':len(stops),'calvarioSources':len(source_ids)},'checks':checks,'failures':[c for c in checks if not c['pass']],'imports':imports,'hashes':{short(p):digest(p)for p in files if p.suffix in('.js','.json','.html','.css')}}
report_name='static-assets-preflight.json'if temporary else'static-assets-qa.json'
(ROOT/'research/validation-v12'/report_name).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'stage':result['stage'],'counts':result['counts'],'checks':len(checks),'failures':result['failures']},ensure_ascii=False,indent=2))
raise SystemExit(0 if result['pass']else 1)
