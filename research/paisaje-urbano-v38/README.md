# Calles, cubiertas y luz en el simulador

Dos cámaras guardadas del Puerto de Sagunto muestran el cambio desde la versión 37 de Sites. La primera mira por el carrer de Barcelona. La segunda se sitúa a 202 m sobre el terreno y permite ver las alineaciones de varias manzanas. Los pares son recortes de la misma región de capturas WebGL del simulador, a las 14:30 solares. Los archivos completos y los estados de cámara se conservan en las carpetas de cada versión. [Calle](barcelona-comparacion.jpg) · [Manzanas](manzanas-comparacion.jpg) · [Versión 37](v37/checks.json) · [Revisión 38](v38/checks.json)

## Procedencia y precisión

| Elemento | Base geográfica y criterio |
| --- | --- |
| Alineación junto a las manzanas | La capa CP municipal contiene 29.757 parcelas en EPSG:25830, con fecha de fuente 21 de agosto de 2026. Se cruzan los espacios exteriores a las parcelas con las huellas de los edificios y los corredores de calles con nombre. Las coordenadas resultantes se guardan a decímetros. El proceso sólo redistribuye los polígonos derivados de los márgenes. [Descarga municipal](https://www.catastro.hacienda.gob.es/INSPIRE/CadastralParcels/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.CP.46222.zip) · [Licencia de la Dirección General del Catastro](https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf) |
| Aceras y calzada | La red del proyecto aporta calles, aceras etiquetadas, plazas, aparcamientos, ferrocarriles y jardines. Esas geometrías tienen prioridad. Se estiman los materiales y el reparto del margen en las manzanas edificadas. El modelo visual no certifica la anchura de paso, la titularidad del suelo o la presencia de plazas de aparcamiento. [Red utilizada y fecha del extracto](../../dist/assets/network/index.json) · [© colaboradores de OpenStreetMap, ODbL](https://www.openstreetmap.org/copyright) |
| Color y relieve de las calles | La ortofoto PNOA existente aporta el tono local del firme con una muestra de unos 3 m. El agregado, las juntas y el desgaste de rodadura son acabados representativos sobre la geometría del viario. Algunos huecos conservan la fotografía original, incluido un pequeño tramo del cruce en primer plano. [Índice de ortofotos](../../dist/assets/territory/surface-photo/index.json) |
| Luz sobre suelo y cubiertas | Del MDSnE de edificios del IGN a 2,5 m y del MDT se obtiene el horizonte en 16 direcciones hasta unos 60 m. Se calcula por separado el cielo obstruido a ras de calle y a la altura de cubierta. El campo se utiliza en aproximadamente 9,75 × 6,5 km. La malla de lectura tiene unos 5 m en escritorio y 10 m en el perfil compacto. |
| Sombras y cristales | Las sombras próximas proceden del renderizador. Fuera de su cobertura, las alturas medidas permiten aproximar la obstrucción solar a cinco distancias. Las ventanas próximas usan el mismo campo para aproximar la silueta de la manzana de enfrente. El dibujo concreto de escaparates, ventanas y persianas mantiene carácter interpretativo. [Producto MDSnE, huella de descarga y licencia CC BY 4.0 de IGN/CNIG](../../dist/assets/territory/building-fabric/manifest.json) |

## Comprobaciones

La preparación produjo 44 sectores con 252.086 m² de acera estimada y 204.357 m² de margen. Son superficies del modelo. La validación revisó que todas las coordenadas de los 44 sectores estuvieran dentro de sus bordes. En cuatro sectores densos de Sagunto y el Puerto se volvió a cruzar la geometría decodificada con las parcelas y el viario de origen. Con 25 cm de tolerancia, la mayor invasión acumulada fue de 0,01 m² por sector. El mayor solape residual entre las dos bandas, medido tras cuantizar sus vértices, fue del 0,0016 %. [Control geométrico por sector](parcelario.json)

En Chrome para Windows con una GeForce RTX 3090 se midieron 90 intervalos entre fotogramas después de estabilizar la carga. En las tres vistas la mediana fue de 16,7 ms y el percentil 95 de 16,8 ms en ambas versiones. El perfil táctil emula una pantalla de 390 × 844 y densidad 2 en el mismo equipo. La medición en un iPhone o iPad físico queda pendiente.

| Vista | Llamadas v37 → v38 | Triángulos v37 → v38 |
| --- | --- | --- |
| Carrer de Barcelona, alta | 253 → 253 | 1.172.210 → 1.275.818 |
| Manzanas, alta | 150 → 150 | 1.224.342 → 1.334.146 |
| Carrer de Barcelona, táctil ligera | 109 → 109 | 861.771 → 963.711 |

Las nuevas superficies comparten las llamadas de dibujo del viario. Los 44 sectores comprimidos suman 333.697 bytes. El campo de iluminación ocupa 368.494 bytes en escritorio y 174.098 en compacto y el navegador descarga una sola variante. Los programas WebGL que usan el campo necesitaron un máximo de 14 unidades de textura en un contexto con límite de 16. Se comprobaron la descarga de cuatro sectores en el perfil táctil y el cambio de luz de 14:30 a 22:00 sin errores de consola o de compilación. [Registro WebGL](mobile/webgl-movil.json) · [Vista nocturna](mobile/barcelona-noche.jpg) · [Control táctil v37](mobile-v37/checks.json) · [Control táctil v38](mobile/checks.json)

## Reproducción

Con Python, NumPy, SciPy, Shapely 2.1 o superior, lxml, Rasterio y Pillow, ejecutar desde la raíz. La adquisición catastral se conserva en la caché temporal y admite un ZIP existente mediante `--source`. El segundo proceso reutiliza la descarga MDSnE preparada por `research/territory-building-fabric.py` y admite una ruta explícita mediante `--surface`.

```sh
python research/territory-street-fronts.py
python research/territory-urban-sky.py
python research/validate-street-fronts.py --out research/paisaje-urbano-v38/parcelario.json
```

Con el directorio `dist` servido por HTTP y Chrome y Playwright instalados, se pueden repetir las capturas y el control de las unidades de textura.

```sh
python research/territory-building-fabric-gl.py --base http://localhost:8471 --out research/paisaje-urbano-v38/v38 --new --views barcelona manzanas
python research/territory-building-fabric-gl.py --base http://localhost:8471 --out research/paisaje-urbano-v38/mobile --mobile --new --views barcelona
python research/check-street-fronts-gl.py --base http://localhost:8471 --out research/paisaje-urbano-v38/mobile
```
