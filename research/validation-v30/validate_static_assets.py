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
check(len(initial_names)==84,'84 initial data requests are declared',initial_names)
check(initial_names[72:75]==['begona-visit','begona-plan','begona-context'],'Begoña retains its three original request slots',initial_names[-3:])
for name in ['begona.js','begona-context.js','begona-map.js']:check((DIST/'js'/name).is_file(),'Begoña implementation module exists: '+name)
check(initial_names[75:78]==['economato-visit','economato-plan','economato-context'],'Economato occupies three appended request slots')
for name in ['economato.js','economato-context.js','economato-map.js']:check((DIST/'js'/name).is_file(),'Economato implementation module exists: '+name)
check(initial_names[78:81]==['barrio-visit','barrio-plan','barrio-context'],'Barrio occupies three appended request slots')
for name in ['barrio.js','barrio-context.js','barrio-map.js']:check((DIST/'js'/name).is_file(),'Barrio implementation module exists: '+name)
check(initial_names[81:84]==['sanatorio-visit','sanatorio-plan','sanatorio-context'],'Sanatorio occupies three appended request slots')
for name in ['sanatorio.js','sanatorio-context.js','sanatorio-map.js']:check((DIST/'js'/name).is_file(),'Sanatorio implementation module exists: '+name)
deferred=['cartography','elevation','port-cartography','port-elevation','coast-cartography','coast-elevation','coast-water']+[region+'-'+name for region in['marjal','almarda','palancia']for name in['cartography','elevation','water']]
for name in initial_names+deferred:check((DIST/'assets/data'/f'{name}.json').is_file(),'runtime data request: '+name)

visit=json_data.get('gerencia-visit',{});plan=json_data.get('gerencia-plan',{})
stops=visit.get('stops',[]);plan_stops=plan.get('stops',[]);stop_ids=[s['id']for s in stops];plan_ids=[s['id']for s in plan_stops]
check(len(stop_ids)==len(set(stop_ids)) and len(stop_ids)>=10,'Unique Gerencia stop IDs cover the documented visit')
check(set(stop_ids)==set(plan_ids),'serialized gerencia plan and historical visit share all stop IDs')
by_id={s['id']:s for s in plan_stops}
# Visit coordinates are published to eight decimals; the model retains full
# precision. A 1e-7 degree tolerance is below 1.2 cm at this latitude and checks
# the same physical focus without treating decimal serialization as a move.
def same_coordinate(a,b):
    return isinstance(a,list) and isinstance(b,list) and len(a)==len(b)==2 and all(abs(x-y)<=1e-7 for x,y in zip(a,b))
check(all(same_coordinate(s.get('coordinate',s.get('coordinates')),by_id.get(s['id'],{}).get('coordinates')) for s in stops),'historical visit coordinates agree with serialized model plan within 1e-7 degree')
source_ids={s['id']for s in visit.get('sources',[])};region_ids={r['id']for r in visit.get('regions',[])}
check(all(s.get('regionId')in region_ids for s in stops),'all gerencia stops belong to a declared historical region')
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
check(bool(visit.get('sectionInstructions')),'gerencia visit documents its implemented section')
casino=json_data.get('casino-visit',{});casino_plan=json_data.get('casino-plan',{})
casino_stops=casino.get('stops',[]);casino_plan_stops=casino_plan.get('stops',[])
casino_ids=[s['id']for s in casino_stops];casino_plan_ids=[s['id']for s in casino_plan_stops]
casino_sources={s['id']for s in casino.get('sources',[])}
casino_regions={r['id']for r in casino.get('regions',[])}
check(len(casino_ids)==len(set(casino_ids))==20,'Casino has twenty unique documented stops')
check(sum(len(s.get('facts',[]))for s in casino_stops)==40,'Casino has forty source-backed facts')
check(set(casino_ids)==set(casino_plan_ids),'serialized Casino plan and historical visit share all stop IDs')
casino_by_id={s['id']:s for s in casino_plan_stops}
check(all(same_coordinate(s.get('coordinate',s.get('coordinates')),casino_by_id.get(s['id'],{}).get('coordinates'))for s in casino_stops),'Casino guide and plan coordinates agree within 1e-7 degree')
check(all(s.get('regionId')in casino_regions for s in casino_stops),'Casino stops belong to declared historical regions')
check(casino.get('modelRegistration',{}).get('provisionalCoordinates')is False,'Casino focus registration is final')
check(len([s for s in casino_stops if s.get('interiorView')])==7,'Casino has seven documented interior viewpoints')
check(all(s.get('floor')in(0,1)if s.get('interiorView')else s.get('floor')is None for s in casino_stops),'Casino interior floors are explicit and exterior floors are null')
casino_references=[]
def casino_walk(value):
    if isinstance(value,dict):
        for key,item in value.items():
            if key in('sourceIds','coordinateSourceIds'):casino_references.extend(item)
            else:casino_walk(item)
    elif isinstance(value,list):
        for item in value:casino_walk(item)
casino_walk(casino)
check(all(id in casino_sources for id in casino_references),'Casino historical and coordinate citations resolve',[id for id in casino_references if id not in casino_sources])
check(bool(casino.get('sectionInstructions')),'Casino visit explains its implemented section')
check('obras en curso'in casino.get('visitNote','')and'Casino Playa'in casino.get('visitNote',''),'Casino guide distinguishes virtual interiors from the documented works and temporary venue')
for id in['castle-panel','theatre-panel','santa-maria-panel','plaza-mayor-panel','juderia-panel','calvario-panel','berenguer-panel','diana-panel','sangre-panel','salvador-panel','museo-panel','portic-panel','domus-panel','circo-panel','necropolis-panel','horno-panel','talleres-panel','museo-industrial-panel','gerencia-panel','casino-panel','begona-panel','economato-panel','barrio-obrero-panel','sanatorio-panel']:check(id in counts,'separate guided-visit panel exists: '+id)

result={'pass':all(c['pass']for c in checks),'stage':'preflight'if temporary else'final','counts':{'distributionFiles':len(files),'javascriptFiles':len(js),'localImports':len(imports),'jsonFiles':len(json_files),'initialRequests':len(initial_names),'deferredRequests':len(deferred),'htmlIds':len(document.ids),'localHTMLAndCSSAssets':len(assets),'gerenciaStops':len(stops),'gerenciaSources':len(source_ids),'casinoStops':len(casino_stops),'casinoSources':len(casino_sources)},'checks':checks,'failures':[c for c in checks if not c['pass']],'imports':imports,'hashes':{short(p):digest(p)for p in files if p.suffix in('.js','.json','.html','.css')}}
report_name='static-assets-preflight.json'if temporary else'static-assets-qa.json'
(ROOT/'research/validation-v30'/report_name).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':result['pass'],'stage':result['stage'],'counts':result['counts'],'checks':len(checks),'failures':result['failures']},ensure_ascii=False,indent=2))
raise SystemExit(0 if result['pass']else 1)
