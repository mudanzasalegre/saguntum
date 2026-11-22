"""Draw the source and ownership plan for the museum surroundings."""
import json,math
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'
context=json.loads((DATA/'museo-context.json').read_text())
scale=111320*math.cos(math.radians(39.679))
project=lambda p:((p[0]+.278)*scale,(39.679-p[1])*111320)
polygon=lambda row:Polygon([project(p)for p in row['coordinates']],[[project(p)for p in ring]for ring in row.get('holes',[])])
fig,ax=plt.subplots(figsize=(11,10),dpi=160)
fig.patch.set_facecolor('#f5f3ec');ax.set_facecolor('#f5f3ec')
for row in context['protectedFootprints']:
 p=polygon(row);x,z=p.exterior.xy
 ax.fill(x,z,color='#c5bdcf',alpha=.85,zorder=1);ax.plot(x,z,color='#94849f',lw=.45,zorder=2)
for row in context['buildings']:
 p=polygon(row);x,z=p.exterior.xy
 ax.fill(x,z,color='#aac4c3',alpha=.85,zorder=2);ax.plot(x,z,color='#638d91',lw=.6,zorder=3)
mesh=context['pavementMesh']
for group in mesh['groups']:
 ids=group['indices'];surface=unary_union([Polygon([mesh['vertices'][k]for k in ids[j:j+3]])for j in range(0,len(ids),3)])
 for p in surface.geoms if hasattr(surface,'geoms')else[surface]:
  x,z=p.exterior.xy;ax.fill(x,z,color='#ddb96d'if group['component']=='museo-plaza'else'#d5d4c9',zorder=3)
for row in context['coreBuildings']:
 p=polygon(row);x,z=p.exterior.xy
 ax.fill(x,z,color='#c8825b',alpha=.95,zorder=4);ax.plot(x,z,color='#8f4c35',lw=1,zorder=5)
 pos=p.representative_point();ax.text(pos.x,pos.y,row['id'].split('_part')[1].split('-')[0],fontsize=8,ha='center',va='center',color='white',zorder=7)
for row in context['sharedContext']['roads']:
 pts=[project(p)for p in row['coordinates']];ax.plot(*zip(*pts),color='#8b72a3',lw=1,ls=':',zorder=4)
for row in context['roads']:
 pts=[project(p)for p in row['coordinates']];ax.plot(*zip(*pts),color='#507f85',lw=.8,ls='--',zorder=4)
arc=polygon(context['sharedContext']['protectedArc']);x,z=arc.exterior.xy
ax.fill(x,z,color='#8b5373',zorder=8);ax.plot(x,z,color='#5f344b',lw=1,zorder=9)
for item in context['furniture']:
 x,z=project(item['coordinate']);ax.scatter([x],[z],c='#5c723f',s=16,zorder=9)
plaza=polygon(context['publicSpaceAreas'][0]);x,z=plaza.exterior.xy
ax.plot(x,z,color='#a88548',ls='--',lw=.8,zorder=9)
annotations=[('Museo · parcela 3558701',(10,56),(35,72)),
 ('Arco compartido con la Judería',project(context['sharedContext']['protectedArc']['coordinate']),(-46,37)),
 ('Replaza en pendiente',(-2,54),(-34,71)),
 ('Dolors',(28,54),(45,48)),('Cubertorer',(31,26),(41,12)),
 ('Castell',(-1,79),(-31,93)),('En Jou',(3,20),(-15,5))]
for label,point,label_at in annotations:
 ax.annotate(label,xy=point,xytext=label_at,fontsize=8.4,color='#33484a',
  arrowprops=dict(arrowstyle='-',color='#687575',lw=.7),zorder=12,
  bbox=dict(boxstyle='round,pad=.25',facecolor='#f5f3ec',edgecolor='none',alpha=.94))
ax.set_xlim(-54,80);ax.set_ylim(112,-8);ax.set_aspect('equal');ax.grid(alpha=.13)
ax.set_xlabel('x del atlas (m)');ax.set_ylabel('z del atlas (m)')
ax.set_title('Casa del Mestre Penya · registro del museo, replaza y barrio',fontsize=13,pad=14)
ax.legend(handles=[Patch(color='#c8825b',label='Museo: 2 partes catastrales (3558701)'),
 Patch(color='#aac4c3',label='44 partes vecinas nuevas, sin mover plantas'),
 Patch(color='#c5bdcf',label='Contexto anterior reutilizado en su posición'),
 Patch(color='#ddb96d',label='Pavimento libre añadido a la replaza'),
 Patch(color='#8b5373',label='Arco existente: propietario Judería')],loc='lower right',fontsize=8,framealpha=.97)
ax.annotate('N',xy=(72,-2),xytext=(72,8),ha='center',arrowprops=dict(arrowstyle='->',color='#33484a'),color='#33484a')
fig.text(.5,.017,'Catastro INSPIRE · OpenStreetMap · Proyecto de conservación 2025 · Borde de replaza inferido, no perímetro patrimonial.',ha='center',fontsize=8.5,color='#606a64')
fig.tight_layout(rect=(0,.03,1,1))
fig.savefig(ROOT/'research/validation-v17/museo-context-source-plan.png')
