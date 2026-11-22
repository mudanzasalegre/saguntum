"""Cartographic inspection, not a render of the live browser."""
import json, math
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[2]
C=json.loads((ROOT/'dist/assets/data/portic-context.json').read_text())
scale=111320*math.cos(math.radians(39.679))
project=lambda p:((p[0]+.278)*scale,(39.679-p[1])*111320)
polygon=lambda r:Polygon([project(p)for p in r['coordinates']],[[project(p)for p in h]for h in r.get('holes',[])])
fig,ax=plt.subplots(figsize=(12,12),dpi=150)
fig.patch.set_facecolor('#f5f3ed');ax.set_facecolor('#f5f3ed')
for b in C['buildings']:
 p=polygon(b);ax.fill(*p.exterior.xy,color='#bccacb',ec='#6d898c',lw=.45)
 for h in p.interiors:ax.fill(*h.xy,color='#f5f3ed',ec='#6d898c',lw=.4)
colors={'portic-asfalto':'#848b8e','portic-aceras':'#e0ddd1','portic-plaza':'#decb9d','portic-parterres':'#a5b184'}
mesh=C['pavementMesh']
for g in mesh['groups']:
 surface=unary_union([Polygon([mesh['vertices'][k]for k in g['indices'][i:i+3]])for i in range(0,len(g['indices']),3)])
 for p in surface.geoms if hasattr(surface,'geoms')else[surface]:
  ax.fill(*p.exterior.xy,color=colors[g['component']],lw=0,zorder=3)
for p in C['coreOutlines']:
 shape=polygon(p);ax.fill(*shape.exterior.xy,color='#c58d6f',ec='#975a3c',lw=1,zorder=4)
 m=shape.representative_point();ax.text(m.x,m.y,p['parentId'][:7]+'\nBloque actual',fontsize=8,ha='center',va='center',color='white',zorder=5)
for t in C['trees']:
 x,z=project(t['coordinate']);ax.add_patch(plt.Circle((x,z),t['crownRadiusM'],color='#527348',alpha=.85,zorder=6))
for t in C['benches']:
 x,z=project(t['coordinate']);ax.scatter([x],[z],marker='s',s=12,color='#826949',zorder=7)
for k,p in C['focusCoordinates'].items():
 x,z=project(p);ax.scatter([x],[z],s=40,c='#213f4a',edgecolors='white',zorder=8)
 ax.annotate(k.replace('portic-',''),(x,z),(x+6,z+7),fontsize=9,zorder=9,color='#173e47',arrowprops=dict(arrowstyle='-',lw=.7,color='#173e47'))
ax.annotate('Calle de los Huertos',(479,-111),(511,-137),fontsize=9,arrowprops=dict(arrowstyle='-',lw=.7),zorder=9)
ax.annotate('Calle Alorco',(481,-69),(516,-48),fontsize=9,arrowprops=dict(arrowstyle='-',lw=.7),zorder=9)
ax.annotate('Plaça Antiga Moreria',(416,-116),(362,-179),fontsize=10,arrowprops=dict(arrowstyle='-',lw=.8),zorder=9)
ax.set_xlim(345,565);ax.set_ylim(48,-200);ax.set_aspect('equal');ax.grid(alpha=.1)
ax.set_xlabel('x del atlas (m)');ax.set_ylabel('z del atlas (m)')
ax.set_title('Vía del Pòrtic · plaza, dos bloques anfitriones y trama urbana',fontsize=13,pad=12)
ax.legend(handles=[Patch(color='#c58d6f',label='27 partes de los dos edificios sobre el yacimiento: modelo Pòrtic'),
 Patch(color='#bccacb',label='152 partes de 44 parcelas vecinas: contexto'),
 Patch(color='#decb9d',label='Plaza interpretada sobre PNOA'),Patch(color='#a5b184',label='Jardines y copas aproximados'),
 Patch(color='#848b8e',label='Calzadas sobre ejes OSM')],loc='lower left',fontsize=8,framealpha=.98)
ax.annotate('N',xy=(552,-189),xytext=(552,-175),ha='center',arrowprops=dict(arrowstyle='->',color='#264c4c'),color='#264c4c')
fig.text(.5,.018,'Catastro INSPIRE · OpenStreetMap · IGN/PNOA · Las huellas actuales no delimitan por sí solas la excavación subterránea.',ha='center',fontsize=8)
fig.tight_layout(rect=(0,.03,1,1));fig.savefig(ROOT/'research/validation-v18/portic-context-source-plan.png')
