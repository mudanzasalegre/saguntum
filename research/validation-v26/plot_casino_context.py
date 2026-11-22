"""Render the registered PNOA / context ownership comparison for review."""
from pathlib import Path
import json,sys
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MPolygon,Patch
from matplotlib.path import Path as MPath
from matplotlib.patches import PathPatch
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
import prepare_casino_context as C

d=C.read('casino-context'); g=C.read('gerencia-context'); img=Image.open(C.ROOT/'research/validation-v25/gerencia-context-orthophoto-reference.jpg')
def pix(q):return ((q[0]+.2255)/.0048*1800,(39.66025-q[1])/.0025*1215)
def patch(ax,r,color,alpha=1,edge=None,lw=.4):
    allrings=[r['coordinates']]+r.get('holes',[]);verts=[];codes=[]
    for ring in allrings:
        p=[pix(q) for q in ring]
        if p[0]!=p[-1]:p.append(p[0])
        verts+=p;codes+=[MPath.MOVETO]+[MPath.LINETO]*(len(p)-2)+[MPath.CLOSEPOLY]
    pp=PathPatch(MPath(verts,codes),facecolor=color,alpha=alpha,edgecolor=edge or color,lw=lw);ax.add_patch(pp)
fig,axes=plt.subplots(1,2,figsize=(17,10),facecolor='#f6f2e9');fig.suptitle('Casino Recreativo y Cultural · jardín y contexto',fontsize=21,y=.97,color='#223b33')
axes[0].imshow(img);axes[1].set_facecolor('#eee9dd')
colors={'casino-lawn':'#8da27a','casino-dancefloor':'#e2d1af','casino-peripheral-planting':'#afaa8b','casino-garden-gravel':'#cbbb9e'}
for ax in axes:
    for r in g['surfaces']:patch(ax,r,'#d8dccb',.12 if ax==axes[0] else .75)
    for r in d['sharedContext']['buildings']:patch(ax,r,'#8f8b7e',.22 if ax==axes[0] else .9,'#6e7369',.6)
    for r in d['architectureExclusions']:patch(ax,r,'#b49b7a',.10 if ax==axes[0] else .88,'#69543d',.9)
    for r in d['surfaces']:patch(ax,r,colors[r['component']],.13 if ax==axes[0] else 1,'#fff9e9',.35)
    patch(ax,d['stage'],'#98aba8',.25 if ax==axes[0] else 1,'#294b50',1.2)
    for r in d['islands']:patch(ax,r,'none',1,'#ad823f',1.3)
    for p in d['paths']:
        q=[pix(r) for r in p['coordinates']];ax.plot([r[0] for r in q],[r[1] for r in q],color='#785e36',lw=1,alpha=.65)
    for t in d['trees']:
        x,y=pix(t['coordinate']);r=t['crownRadiusM']/C.G.SCALE/(.0048/1800)
        ax.add_patch(plt.Circle((x,y),r,fc='#6a8250',ec='#3f5936',alpha=.3 if ax==axes[0] else .6,lw=.8));ax.plot(x,y,'.',color='#263d2e',ms=4)
    for w in d['walls']:
        q=[pix(r) for r in w['coordinates']];ax.plot([r[0] for r in q],[r[1] for r in q],color='#8e5c48',lw=2)
    for b in d['benches']:
        x,y=pix(b['coordinate']);ax.plot(x,y,'s',color='#3d6e8b',ms=4)
    q=[pix(r) for r in d['ownershipTransfer']['coordinates']];ax.plot([r[0] for r in q],[r[1] for r in q],color='#7f3d67',lw=1.1,ls='--')
    ax.set_xlim(965,1385);ax.set_ylim(745,340);ax.set_aspect('equal');ax.set_xticks([]);ax.set_yticks([]);[spine.set_edgecolor('#b6b5a6') for spine in ax.spines.values()]
axes[0].set_title('Registro sobre la ortofoto PNOA · misma escala',fontsize=12,pad=12)
axes[1].set_title('Geometría de producción y propiedad del contexto',fontsize=12,pad=12)
for key,label,offset in [('casino-pista','Pista descubierta',(-35,-1)),('casino-escenario','Pérgola sur',(-46,35)),('casino-taquilla','Taquilla a la calle',(45,-25)),('casino-arbolado','Islas y palmeras',(51,-20))]:
    x,y=pix(d['focusSpecs'][key]['targetCoordinates']);axes[1].annotate(label,(x,y),(x+offset[0],y+offset[1]),fontsize=9,color='#263d34',ha='center',arrowprops={'arrowstyle':'-','color':'#5e6c5b','lw':.7},bbox={'facecolor':'#f8f4e9','edgecolor':'none','alpha':.9,'pad':3})
legend=[Patch(fc='#b49b7a',label='Edificio / terraza · módulo Casino'),Patch(fc='#8da27a',label='Islas plantadas'),Patch(fc='#e2d1af',label='Pista de baile'),Patch(fc='#cbbb9e',label='Jardín y accesos del Casino'),Patch(fc='#d8dccb',label='Suelo existente · Gerencia'),Patch(fc='#8f8b7e',label='Edificios vecinos · se conservan')]
fig.legend(handles=legend,ncol=3,loc='lower center',fontsize=10,bbox_to_anchor=(.5,.08),frameon=False)
fig.text(.5,.035,'Trazado interpretativo de la imagen y fotografías institucionales históricas. No es un levantamiento topográfico ni un estado final de las obras de 2026.\nFuentes: IGN/CNIG PNOA · Catastro · Casino Recreativo y Cultural · Universitat de València.',ha='center',fontsize=9,color='#5b6359')
fig.subplots_adjust(left=.025,right=.975,top=.9,bottom=.18,wspace=.06)
fig.savefig(C.OUT/'casino-context-source-alignment.png',dpi=160)
