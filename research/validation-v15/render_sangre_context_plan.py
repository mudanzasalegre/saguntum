"""Reproducible source-ownership plan. Requires Matplotlib and Shapely."""
import json, math
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from shapely.geometry import Polygon
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'dist/assets/data'
context=json.loads((DATA/'sangre-context.json').read_text())
scale=111320*math.cos(math.radians(39.679))
project=lambda p:((p[0]+.278)*scale,(39.679-p[1])*111320)
polygon=lambda row:Polygon([project(p) for p in row['coordinates']],[[project(p) for p in ring]for ring in row.get('holes',[])])
fig,ax=plt.subplots(figsize=(11,10),dpi=160)
fig.patch.set_facecolor('#f5f4f0');ax.set_facecolor('#f5f4f0')
for row in context['protectedFootprints']:
 if row['owner']=='existing-monument':continue
 p=polygon(row);x,z=p.exterior.xy;ax.fill(x,z,color='#b7afca',alpha=.8);ax.plot(x,z,color='#847492',lw=.5)
for row in context['buildings']:
 p=polygon(row);x,z=p.exterior.xy;ax.fill(x,z,color='#7fa8ad' if row.get('derivedClip') else '#dedbd0');ax.plot(x,z,color='#8d8778',lw=.55)
mesh=context['pavementMesh']
for group in mesh['groups']:
 ids=group['indices'];triangles=[Polygon([mesh['vertices'][k]for k in ids[j:j+3]])for j in range(0,len(ids),3)];s=unary_union(triangles)
 for p in s.geoms if hasattr(s,'geoms') else[s]:
  x,z=p.exterior.xy;ax.fill(x,z,color='#d5b879'if group['component']=='sangre-plaza'else'#c9cfcc',zorder=3)
for row in context['coreBuildings']:
 p=polygon(row);x,z=p.exterior.xy;ax.fill(x,z,color='#d59672',alpha=.7,zorder=4);ax.plot(x,z,color='#8f4c35',lw=1,zorder=5);pos=p.representative_point();ax.text(pos.x,pos.y,row['id'].split('_part')[1].split('-')[0],fontsize=8,ha='center',va='center',color='#633626',zorder=7)
for row in context['roads']:
 points=[project(p) for p in row['coordinates']];ax.plot([p[0]for p in points],[p[1]for p in points],color='#6f979c',lw=.7,ls='--',zorder=4)
stairs=Polygon([project(p)for p in context['coreOwnership']['stairOutline']]);x,z=stairs.exterior.xy;ax.fill(x,z,color='#a56158',alpha=.9,zorder=6)
for name,point in context['focusCoordinates'].items():
 x,z=project(point);ax.scatter([x],[z],c='#213f46',s=44,zorder=8);ax.text(x+1.2,z-1.0,'Plaza'if name=='sangre-plaza'else'Sang Nova / Dolores',fontsize=9,color='#213f46',zorder=8,clip_on=True)
ax.set_xlim(10,116);ax.set_ylim(142,34);ax.set_aspect('equal');ax.grid(alpha=.16);ax.set_xlabel('x del atlas (m)');ax.set_ylabel('z del atlas (m)')
ax.set_title('Ermita de la Sangre · registro cartográfico y propiedad de la escena',fontsize=13,pad=14)
ax.legend(handles=[Patch(color='#d59672',label='Núcleo: nueve partes catastrales'),Patch(color='#a56158',label='Escalera: modelo principal'),Patch(color='#d5b879',label='Plaza inferida entre huellas'),Patch(color='#dedbd0',label='Contexto catastral conservado'),Patch(color='#7fa8ad',label='Residual de huella OSM'),Patch(color='#b7afca',label='Propietarios anteriores conservados')],loc='lower left',fontsize=8,framealpha=.95)
ax.annotate('N',xy=(109,38),xytext=(109,46),ha='center',arrowprops=dict(arrowstyle='->',color='#213f46'),color='#213f46')
fig.text(.5,.016,'Catastro INSPIRE · OpenStreetMap · Límites de plaza y selección gráficos; no son un levantamiento métrico.',ha='center',fontsize=9,color='#5c625c')
fig.tight_layout(rect=(0,.025,1,1));fig.savefig(ROOT/'research/validation-v15/sangre-context-source-plan.png')
