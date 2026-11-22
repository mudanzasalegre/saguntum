"""Read-only spatial ownership survey, clipped to the Economato neighbourhood."""
from pathlib import Path
import sys, json, math, hashlib
sys.path.insert(0, '/workspace/scratch/36862867499f/begona-context-deps')
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'dist/assets/data'
OUT = Path(__file__).resolve().parent
P = lambda p: ((p[0]+.278)*111320*math.cos(math.radians(39.679)), (39.679-p[1])*111320)
G = lambda p: [p[0]/(111320*math.cos(math.radians(39.679)))-.278, 39.679-p[1]/111320]
pixel = lambda p: ((G(p)[0]+.2255)/.0048*1800, (39.66025-G(p)[1])/.0025*1215)
poly = lambda r: Polygon([P(p) for p in r['coordinates']], [[P(p) for p in h] for h in r.get('holes',[])]).buffer(0)
parts = lambda p: [] if p.is_empty else [p] if p.geom_type == 'Polygon' else [s for s in getattr(p,'geoms',[]) if s.geom_type == 'Polygon' and not s.is_empty]
cart = json.loads((D/'port-cartography.json').read_text())
site_rows = [r for r in cart['buildings'] if r.get('parentId')=='8338804YJ3983N']
site = unary_union([poly(r) for r in site_rows])
scope = site.buffer(40)
names = ['horno','talleres','museo-industrial','gerencia','casino','begona']
old = {n:json.loads((D/(n+'-context.json')).read_text()) for n in names}
fig,axes = plt.subplots(1,2,figsize=(18,9))
image = Image.open(ROOT/'research/validation-v25/gerencia-context-orthophoto-reference.jpg')
colors = {'horno':'#e5a541','talleres':'#a4ac48','museo-industrial':'#208ab4','gerencia':'#d9a145','casino':'#a34bd0','begona':'#3bbe92'}
for ax in axes:
    ax.imshow(image)
    ax.set_xlim(1080,1775); ax.set_ylim(1010,340)
    ax.set_xlabel('PNOA source pixel x'); ax.set_ylabel('PNOA source pixel y')
    ax.grid(alpha=.25)
for n,d in old.items():
    for r in d['surfaces']:
        shape=poly(r).intersection(scope)
        for s in parts(shape):
            x,y=zip(*[pixel(p) for p in s.exterior.coords]); axes[0].fill(x,y,color=colors[n],alpha=.38,linewidth=.6,edgecolor='black')
    for r in d.get('trees',[]):
        p=Point(P(r['coordinate']))
        if p.distance(site)>40:continue
        x,y=pixel(p.coords[0]);axes[1].scatter([x],[y],s=35,c=colors[n],edgecolors='black');axes[1].text(x+4,y+4,r['id'].split('-')[-1],fontsize=6,color='yellow')
ids={str(i):n for n,d in old.items() for i in d.get('excludedBuildingIds',[])}
for r in cart['buildings']:
    shape=poly(r)
    if shape.distance(site)>40:continue
    owner=ids.get(str(r['id']))
    color='#fc4e42' if r.get('parentId')=='8338804YJ3983N' else colors.get(owner,'#29e3ff')
    for s in parts(shape):
        x,y=zip(*[pixel(p) for p in s.exterior.coords])
        for ax in axes:ax.plot(x,y,color=color,lw=1.2)
    if r in site_rows:
        x,y=pixel(shape.centroid.coords[0]);axes[1].text(x,y,r['id'].split('_')[-1],fontsize=8,color='white',bbox={'facecolor':'black','alpha':.6})
axes[0].set_title('Retained context surface owners: Gerencia gold · Casino purple · Museum blue · Begoña green')
axes[1].set_title('Exact cadastral parts and retained tree centres; cyan = still generic')
fig.tight_layout();fig.savefig(OUT/'economato-context-ownership-survey.png',dpi=150);plt.close(fig)
report={'sourceAreaM2':site.area,'sourceParts':[r['id'] for r in site_rows], 'baselines':{n:hashlib.sha256((D/(n+'-context.json')).read_bytes()).hexdigest() for n in names}}
(OUT/'economato-context-ownership-baselines.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
