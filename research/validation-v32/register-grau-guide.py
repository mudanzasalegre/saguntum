"""Register factual guide stops against the actual exported V32 model focuses.

Only camera/position metadata comes from the model. Narrative evidence remains
in the independently researched guide. Run again after any focus adjustment.
"""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'dist/assets/data/grau-visit.json'
guide=json.loads(p.read_text())
focuses=json.loads((root/'research/validation-v32/grau-focus-registration.json').read_text())
assert set(focuses)=={s['id']for s in guide['stops']}
fields=['coordinate','coordinates','elevation','localTarget','floor','buildingId','interiorView','requiresSection','regionId','readingLayer','sourceConfidence']
for stop in guide['stops']:
 f=focuses[stop['id']]
 for key in fields:stop[key]=f[key]
 stop['coordinateConfidence']='approximate'
 stop['coordinateMethod']='Foco registrado con la geometría tridimensional y la cartografía del conjunto. La posición de observación, las cotas no levantadas y el montaje museográfico son interpretativos.'
 stop['mapScope']='entorno'if stop['id']in('grau-poblado','grau-ermita')else'recinto'
for region in guide['regions']:
 points=[focuses[s]['coordinates']for s in region['stopIds']]
 region['coordinate']=[sum(p[d]for p in points)/len(points)for d in range(2)]
guide['sectionOnOverview']=True
guide['modelRegistration']={
 'status':'registered','precision':'approximate','provisionalCoordinates':False,
 'note':'Veinte focos registrados sobre el modelo V32 y la cartografía contemporánea. El registro de la cámara no convierte una posición interpretada en una medida de campo.',
 'coordinates':'Las coordenadas, cotas locales, niveles y condiciones de sección coinciden con el plano del modelo.',
 'interiorViews':sum(s['interiorView']for s in guide['stops'])
}
# The three museum viewpoints are interior reading stations; their factual
# themes are documented but their arrangement is deliberately approximate.
by={s['id']:s for s in guide['stops']}
by['grau-marjal'].update({
 'intro':'Desde el interior del almacén, descubre la relación del Grau Vell con el humedal.',
 'narrative':'Esta estación enlaza el relato del museo con el paisaje exterior. Al volver a la vista general puedes relacionar las casas, los suelos abiertos y la costa que acompañan al fortín.',
 'lookFor':'El punto de interpretación del paisaje dentro de la nave y su relación con el espacio del almacén.',
 'modelNote':'El tema está documentado; la estación y su posición son interpretativas. La vegetación exterior no es un inventario botánico ni una simulación de la hidrología del humedal.'
})
by['grau-restauracion'].update({
 'intro':'Descubre cómo la restauración convirtió el conjunto en un espacio cultural.',
 'narrative':'Desde el almacén, relaciona las fábricas históricas con la estructura de madera recuperada. Vuelve al patio para comparar esos materiales con la escalera y los accesos contemporáneos.',
 'lookFor':'La piedra y la madera del almacén alrededor de la estación de interpretación.',
 'modelNote':'La restauración es uno de los temas oficiales del centro. Esta estación y su posición son interpretativas; las fotografías de 2020 no documentan el montaje expositivo final de 2026.'
})
by['grau-lagar']['intro']='Desde el patio, descubre la memoria de la elaboración de vino.'
by['grau-lagar']['narrative']='El centro incluye una lectura del lagar y de la producción de vino. Esta parada exterior incorpora esa memoria al recorrido digital y la relaciona con los ámbitos de servicio del conjunto.'
p.write_text(json.dumps(guide,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'registered':len(guide['stops']),'interiorViews':guide['modelRegistration']['interiorViews'],'sectionOnOverview':guide['sectionOnOverview']},ensure_ascii=False))
