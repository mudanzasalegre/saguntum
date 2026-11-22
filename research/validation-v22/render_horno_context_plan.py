"""Geographic registration audit, not an architectural survey drawing."""
from pathlib import Path
import json, math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as Patch
from matplotlib.lines import Line2D
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'
OUT=ROOT/'research/validation-v22'
d=json.loads((DATA/'horno-context.json').read_text())
S=111320*math.cos(math.radians(39.679));p=lambda c:((c[0]+.278)*S,(39.679-c[1])*111320)
cx,cz=p(d['coordinate']);local=lambda c:tuple(a-b for a,b in zip(p(c),(cx,cz)))
fig,axes=plt.subplots(1,2,figsize=(14,7.4),constrained_layout=True)
fig.patch.set_facecolor('#f3f0e8')
for ax in axes:
 ax.set_facecolor('#ece8dd');ax.set_aspect('equal');ax.set_xlabel('Metros al este del eje');ax.set_ylabel('Metros al sur del eje');ax.set_xlim(-78,92);ax.set_ylim(82,-82);ax.grid(color='#8c8c7d',alpha=.15,linewidth=.5)
b=d['provenance']['referencePhoto']['geographicBounds'];west,north=local((b['west'],b['north']));east,south=local((b['east'],b['south']))
axes[0].imshow(Image.open(OUT/'horno-context-orthophoto-reference.jpg'),extent=[west,east,south,north],alpha=.91)
axes[0].set_title('Registro sobre PNOA\nHuella cartográfica y trazas del suelo',loc='left',fontsize=12,color='#273c37')
axes[1].set_title('Propiedad y continuidad del contexto\nPavimentos, recepción y recinto excavado',loc='left',fontsize=12,color='#273c37')
colors={'horno-road':'#929992','horno-sidewalk':'#d0c9b5','horno-forecourt':'#c4bca4','horno-yard':'#aa9c82'}
for row in d['surfaces']:
 points=[local(c) for c in row['coordinates']]
 axes[1].add_patch(Patch(points,facecolor=colors[row['component']],edgecolor='#f4f0e6',linewidth=.3))
 for hole in row.get('holes',[]):axes[1].add_patch(Patch([local(c) for c in hole],facecolor='#ece8dd',edgecolor='none'))
for ax in axes:
 for row in d['coreBuildingParts']:
  if row['id'] in ['733110249','cat-8532501YJ3983S_part2-0']:
   ax.add_patch(Patch([local(c) for c in row['coordinates']],facecolor='#9eb5b1' if ax is axes[1] else 'none',edgecolor='#305b60',linewidth=1.05,alpha=.9))
 for row in d['buildings']:
  ax.add_patch(Patch([local(c) for c in row['coordinates']],facecolor='#b6b2a1' if ax is axes[1] else 'none',edgecolor='#575d55',linewidth=1))
 for row in d['fences']:
  pts=[local(c) for c in row['coordinates']];ax.plot(*zip(*pts),color='#6b4937',linewidth=1.8)
 for row in d['railAlignments']:
  pts=[local(c) for c in row['coordinates']];ax.plot(*zip(*pts),color='#566256',linewidth=.85,linestyle='--')
 for row in d['trees']:
  x,z=local(row['coordinate']);ax.add_patch(plt.Circle((x,z),row['crownRadiusM'],facecolor='#74875b',edgecolor='#445c48',linewidth=.5,alpha=.9))
 ax.scatter([0],[0],s=30,c='#ca8255',edgecolors='#fff4d9',zorder=10)
 ax.annotate('Eje del horno',(0,0),xytext=(-49,17),fontsize=8,color='#223a36',arrowprops={'arrowstyle':'-','color':'#223a36','lw':.7},bbox={'facecolor':'#f5f1e5','alpha':.85,'edgecolor':'none','pad':2})
 ax.plot([55,75],[66,66],color='#273c37',linewidth=2);ax.text(65,71,'20 m',ha='center',fontsize=8,color='#273c37')
 ax.annotate('N',xy=(79,-67),xytext=(79,-49),ha='center',fontsize=10,color='#273c37',arrowprops={'arrowstyle':'-|>','lw':1.2,'color':'#273c37'})
axes[1].annotate('Recepción inclinada\ny rampa cubierta',(9,-21),xytext=(40,-51),fontsize=8,color='#305b60',arrowprops={'arrowstyle':'-','color':'#305b60','lw':.7})
axes[1].annotate('Paso abierto\npara plano inclinado',(19,12),xytext=(39,39),fontsize=8,color='#6b4937',arrowprops={'arrowstyle':'-','color':'#6b4937','lw':.7})
handles=[Line2D([0],[0],color='#305b60',lw=2,label='Recepción / rampa (OSM + Catastro)'),Line2D([0],[0],color='#6b4937',lw=2,label='Valla y contención (traza PNOA)'),Line2D([0],[0],color='#566256',lw=1,ls='--',label='Vía perimetral (BOE + PNOA)')]
axes[1].legend(handles=handles,loc='lower left',fontsize=7,framealpha=.9)
fig.suptitle('SAGUNTUM · Alto Horno nº 2 · Registro del entorno',ha='left',x=.02,fontsize=17,color='#213b35')
fig.text(.02,-.015,'IGN/CNIG · PNOA consultado el 20-11-2026 (fecha de vuelo no verificada). Ejes OSM y huellas Catastro. Trazas, alturas y detalles menores interpretados.\nPlano de validación del atlas; no sustituye un levantamiento topográfico ni la delimitación legal del BIC.',fontsize=8,color='#56665d')
fig.savefig(OUT/'horno-context-source-plan.png',dpi=160,bbox_inches='tight',facecolor=fig.get_facecolor())
print(OUT/'horno-context-source-plan.png')
