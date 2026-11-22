"""Digitalización en la ortofoto PNOA y lectura comparada de plantas de López Herranz.
La ventana de consulta, resolución y las observaciones en píxeles permiten repetir la conversión.
"""
from pathlib import Path
from math import hypot
import json,base64
from PIL import Image

root=Path(__file__).resolve().parents[1]
def ll(p):
    x,y=p
    return [round(-.27908+x*.00165/710,8),round(39.68179-y*.0018/1000,8)]
def coords(p):return [ll(q) for q in p]
def area(id,p):
    return dict(id=id,ring=coords(p),center=ll([sum(q[i] for q in p)/len(p) for i in (0,1)]))
def band(id,center,length,width):
    x,y=center
    return area(id,[(x+u*.296+v*.955,y-u*.955+v*.296) for u,v in [(-length/2,-width/2),(length/2,-width/2),(length/2,width/2),(-length/2,width/2)]])
pnoa='https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&version=1.1.1&request=GetMap&layers=OI.OrthoimageCoverage&srs=EPSG:4326&bbox=-0.27908,39.67999,-0.27743,39.68179&width=710&height=1000&format=image/jpeg&styles='
upv='https://riunet.upv.es/handle/10251/62044'
rim=[(115,799),(116,780),(101,652),(104,525),(111,470),(186,264),(220,191),(236,177),(335,131),(378,112),(410,116),(587,171),(592,180),(560,284),(415,738),(374,863),(363,871),(341,872),(135,812)]
beds=[area('romeu',[(122,593),(158,578),(188,586),(195,578),(265,600),(247,662),(144,635)]),
      band('oeste-1',(154,655),24,48),band('oeste-2',(162,687),25,45),band('oeste-3',(157,723),22,37),
      band('levante-1',(353,639),30,68),band('levante-2',(380,579),30,62),band('levante-3',(432,424),29,56),
      band('levante-4',(450,368),28,46),band('jardin-correos',(286,343),57,20)]
fountain=area('fuente',[(299,733),(307,701),(376,721),(367,753)])
pergola=area('pergola',[(189,779),(216,786),(251,675),(222,665)])
play=[area('juegos-oeste',[(142,465),(172,381),(312,422),(286,506)]),
      area('juegos-este',[(358,539),(378,470),(441,488),(420,556)])]
pavilions=[area('correos',[(157,346),(179,269),(269,293),(247,372)]),area('turismo',[(273,225),(284,181),(341,197),(328,241)]),
           area('cafeteria',[(174,529),(182,493),(293,525),(286,553)])]
trees=[]
def plant(kind,rows):
    for x,y,h,r in rows:trees.append(dict(point=ll([x,y]),kind=kind,height=h,radius=r))
plant('palmera',[(475,389,8,3.1),(488,359,8.5,3.2),(497,326,9,3.2),(508,290,8.5,3.4),(519,266,6,2.3),(529,244,5.6,2.5),(535,224,5.2,2.4),(461,431,8.3,3.1),(450,461,7.5,2.9),(439,495,8.6,3.0),(429,529,8.0,3.0),(420,559,8.1,2.9),(409,594,7.7,3),(397,627,7.5,3),(385,664,6.8,3)])
plant('conifera',[(431,171,12,4),(453,186,13,4.2),(479,194,12,4),(387,164,13,4),(378,145,12,4),(401,156,14,4.6),(377,606,11,3.2),(386,585,10.5,3.3),(443,357,10,3.2)])
plant('sombra',[(147,801,7,3.4),(170,811,8,3.6),(195,820,8,3.9),(225,827,8,3.9),(251,838,7,3.4),
(151,735,8,4.0),(165,705,9,4.5),(161,671,10,4.8),(173,638,10,4.2),(149,614,10,5.0),(194,614,10,4.7),
(160,458,9,3.2),(166,430,9,3.8),(176,409,8,4.0),(197,395,8,3.1),(265,445,8,4.1),(289,443,8,3.4),
(297,341,8,3.0),(220,250,7.1,3.2),(234,211,8.4,3.8),(342,577,7.5,3.3),(357,573,7.7,3.7),(397,580,7.6,3.5),
(320,632,8,3.1),(338,641,7,3.6),(341,675,7,3.3),(365,684,8,3.5),(388,684,8,3.0),
(361,453,6,2.8),(386,460,7,3.2),(406,464,7,3.4),(387,407,7,3.3),(412,413,8,3.3),(378,354,7,3.2),(406,360,7,3.2)])
anchors={k:ll(v) for k,v in {'general':(327,473),'acceso-sur':(340,858),'acceso-norte':(395,132),'eje':(327,515),'romeu':(242,627),'fuente':(337,727),'jardines':(353,639),'pergola':(219,730),'juegos':(236,441),'juegos-este':(394,510),'palmeras':(465,425),'estancia':(347,588),'conciertos':(395,245),'cafeteria':(228,522),'correos':(213,320),'turismo':(307,209)}.items()}
# Independent registration of the earlier plan in fig. p.88, east frontage at top.
def historic(x,y):return ll([591-(x-146)*.305-(y-320)*.855,179+(x-146)*.923-(y-320)*.268])
older=[('Jardín de borde y plantaciones','garden',[(149,332),(210,320),(450,325),(463,339),(451,375),(396,378),(352,394),(317,389),(243,361),(177,378),(176,542),(235,537),(245,569),(151,570)]),
 ('Zona de juegos','play',[(491,412),(604,412),(612,557),(495,555)]),
 ('Ámbito del monumento','garden',[(347,402),(467,402),(468,560),(350,554)]),
 ('Jardín occidental a distinto nivel','garden',[(476,591),(499,587),(511,660),(589,671),(612,605),(651,610),(654,686),(626,722),(545,740),(463,731)]),
 ('Espacio para conciertos','stage',[(774,491),(853,489),(874,535),(873,597),(839,617),(785,585)]),
 ('Jardín contiguo al paseo oriental','garden',[(659,402),(745,401),(745,461),(660,461)])]
history=dict(period='1986–2009',source=upv,page=88,precision='Restitución aproximada de ámbitos y recorridos en planta; la posición de los bordes es orientativa.',features=[dict(label=l,kind=k,ring=[historic(x,y) for x,y in row]) for l,k,row in older])
# Benches are registered to their group; dimensions and individual endpoints estimated from figs. 87/99/100.
benches=[(360,648),(371,606),(388,563),(345,516),(418,469),(436,418),(450,377),(379,649),(393,609),(411,554),(452,477),(443,430),(457,382),(213,716),(222,687),(207,742),(177,681),(188,648),(388,607),(381,401),(397,351)]
lamps=[(282,806),(291,737),(329,648),(356,552),(383,456),(408,367),(431,290),(341,820),(362,757),(387,680),(408,611),(430,541),(452,470),(476,392),(491,335),(518,248),(536,190)]
layout=dict(crs='EPSG:4326',orthophoto=pnoa,perimeter=coords(rim),beds=beds,fountain=fountain,pergola=pergola,play=play,pavilions=pavilions,trees=trees,anchors=anchors,history=history,benches=coords(benches),lamps=coords(lamps))
# Connect the surveyed interior to the existing street mesh. Clip the strip at the
# existing Atlas road width rather than drawing a blanket over the carriageway.
from shapely.geometry import Polygon,LineString
from shapely.ops import transform,unary_union
from pyproj import Transformer
fwd=Transformer.from_crs(4326,25830,always_xy=True).transform
inv=Transformer.from_crs(25830,4326,always_xy=True).transform
rim_utm=transform(fwd,Polygon(layout['perimeter']))
carto=json.loads((root/'dist/assets/data/cartography.json').read_bytes())
roads=[]
for road in carto['roads']:
    line=transform(fwd,LineString(road['coordinates']))
    if line.distance(rim_utm)>15 or road['kind'] in ['pedestrian','footway','steps','path']:continue
    width=float(road.get('width') or {'residential':4.5,'unclassified':4.5,'tertiary':5.8,'service':3.2}.get(road['kind'],5.5))
    roads.append(line.buffer(width/2+.08))
collar=rim_utm.buffer(3.4,join_style=2).difference(rim_utm).difference(unary_union(roads))
if collar.geom_type=='Polygon':pieces=[collar]
else:pieces=collar.geoms
def georing(r):return [[round(v,8) for v in inv(x,y)] for x,y in list(r.coords)[:-1]]
layout['aprons']=[{'ring':georing(p.exterior),'holes':[georing(r) for r in p.interiors]} for p in pieces if p.area>2.0]
# Small branch photograph from the existing CC0 crown atlas shared with the simulator.
# Store 96x96 RGBA as 256 RGB palette entries plus alpha in the otherwise-unused
# transparent palette slot, so the synchronous worker and Atlas share one material.
sheet=Image.open(root/'dist/assets/materials/streets/tree-crown.webp').convert('RGBA')
tuft=sheet.crop((12*128,3*128,13*128,4*128)).resize((96,96),Image.Resampling.LANCZOS)
indexed=tuft.convert('RGB').quantize(colors=255)
values=bytes(255 if a<80 else i for i,a in zip(indexed.tobytes(),tuft.getchannel('A').tobytes()))
layout['leafSample']={'width':96,'height':96,'rgb':base64.b64encode(bytes(indexed.getpalette())).decode(),
                      'pixels':base64.b64encode(values).decode(),'reference':'assets/materials/streets/tree-credits.json'}
out= root/'dist/assets/data/glorieta-layout.json'
out.write_text(json.dumps(layout,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
print(len(trees),'árboles',len(rim),'vértices de borde',anchors['romeu'])


# Optional visual evidence: requesting the official WMS is only necessary to refresh
# the reference photograph. Geometry compilation above works offline.
if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--reference',action='store_true')
    if parser.parse_args().reference:
        import requests,hashlib
        from io import BytesIO
        from PIL import ImageDraw
        response=requests.get(pnoa,timeout=45);response.raise_for_status()
        im=Image.open(BytesIO(response.content)).convert('RGB')
        photo=root/'research/glorieta/pnoa-referencia.jpg'
        photo.parent.mkdir(parents=True,exist_ok=True)
        draw=ImageDraw.Draw(im)
        draw.line(rim+[rim[0]],fill='#ebd468',width=2)
        for text,q in [('Romeu',(242,627)),('Fuente',(337,727)),('Pergola',(217,723)),('Correos',(213,320))]:
            draw.ellipse((q[0]-3,q[1]-3,q[0]+3,q[1]+3),fill='#ffdc72')
            draw.text((q[0]+6,q[1]-4),text,fill='white',stroke_width=1,stroke_fill='black')
        im.save(photo,quality=88)
        print('SHA-256 de la respuesta WMS:',hashlib.sha256(response.content).hexdigest())
