"""Source-alignment and precise ownership review, not a runtime screenshot."""
from pathlib import Path
import sys,json
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_economato_context as C
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.path import Path as PlotPath
from matplotlib.patches import PathPatch
from PIL import Image

pixel=lambda p:((C.geo(p)[0]+.2255)/.0048*1800,(39.66025-C.geo(p)[1])/.0025*1215)
def draw(ax,shape,color,alpha=.4,lw=.7):
    for p in C.polygons(shape):
        points=[];codes=[]
        for ring in [p.exterior,*p.interiors]:
            ps=[pixel(q) for q in ring.coords]
            points+=ps;codes += [PlotPath.MOVETO]+[PlotPath.LINETO]*(len(ps)-2)+[PlotPath.CLOSEPOLY]
        ax.add_patch(PathPatch(PlotPath(points,codes),facecolor=color,alpha=alpha,edgecolor='#333333',lw=lw))

data=C.read('economato-context')
fig,axes=plt.subplots(1,2,figsize=(17,10))
photo=Image.open(C.ROOT/C.PHOTO_PATH)
for ax in axes:
    ax.imshow(photo);ax.set_xlim(1160,1710);ax.set_ylim(900,480);ax.grid(alpha=.2)
    ax.set_xlabel('PNOA source pixel x');ax.set_ylabel('PNOA source pixel y')
precinct=Polygon([C.project(q) for q in data['precinctOutline']])
colors={'economato-apron':'#eee4d2','economato-sidewalk':'#e1cfab','economato-garden':'#b8b26d','economato-open-ground':'#aa9370'}
for row in data['surfaces']:draw(axes[0],C.polygon(row),colors[row['component']],.57)
for row in data['architectureExclusions']:
    p=C.polygon(row)
    if p.distance(precinct)>8:continue
    for shape in C.polygons(p):
        x,y=zip(*[pixel(q) for q in shape.exterior.coords]);axes[0].plot(x,y,lw=.8,c='#be3327')
for row in data['trees']:
    x,y=pixel(C.project(row['coordinate']));axes[0].scatter([x],[y],s=40,c='#2ec96d',edgecolors='black');axes[0].text(x+4,y-3,row['id'].split('-')[-1],fontsize=8,color='white')
for row in data['buildings']:draw(axes[0],C.polygon(row),'#37c6dd',.45)
for n in C.NAMES:
    d=json.loads((C.OUT/'gerencia-context-economato-transfer-candidate.json').read_text()) if n=='gerencia' else C.read(n+'-context')
    for row in d['surfaces']:
        p=C.polygon(row).intersection(precinct.buffer(8))
        draw(axes[1],p,'#809ba6' if n!='gerencia' else '#a9a4a0',.50)
for row in data['surfaces']:draw(axes[1],C.polygon(row),'#3cc59b',.65)
for row in data['ownershipTransfers']:draw(axes[1],C.polygon(row),'#e3b43c',.7)
correction=C.polygon(data['frontBoundaryCorrection'])
old=C.read('gerencia-context')
for row in old['fences']:
    p=LineString([C.project(q) for q in row['coordinates']]).intersection(correction)
    for part in C.lines(p):
        x,y=zip(*[pixel(q) for q in part.coords]);axes[1].plot(x,y,c='#dc3347',lw=3)
axes[0].set_title('New ground, mapped extra rear trees and exact infill building parts')
axes[1].set_title('Green new coverage · gold Gerencia transfer · blue/grey retained owners\nRed: only the disproved continuous front fence is removed')
fig.tight_layout();fig.savefig(C.OUT/'economato-context-source-alignment.png',dpi=150);plt.close(fig)
print('Source alignment review saved.')
