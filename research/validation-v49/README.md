# Teatro Romano · revisión documentada del modelo y su entorno

Revisión del 26 de noviembre de 2026 para SAGUNTUM · Atlas vivo. Se mantiene la portada territorial, las 32 visitas y los enlaces de las 16 paradas del teatro. El modelo compartido se utiliza en el Atlas, en su contexto del Palancia y en el Simulador.

## Qué se revisa

La geometría distingue el revestimiento claro de las gradas, los flancos de fábrica rugosa, los pasos del graderío y el remate superior interrumpido. El cuerpo escénico incorpora tres exedras bajas, dos pilares, galerías, suelos continuos y una cubierta clara con estructura inferior. El zócalo posterior tiene 14 aberturas físicas y una pasarela metálica; el antiquarium cuenta con cuatro grupos de fragmentos genéricos. La relación con la ladera conserva el terreno IGN e incorpora accesos y contenciones cartografiados, afloramientos superficiales y copas situadas a partir de la ortofoto.

Los documentos históricos y la intervención contemporánea se estudian por separado. La guía enlaza la postal de Roisin hacia 1920, la fotografía de 1969, las plantas anteriores a la rehabilitación y las imágenes de 2014 y 2015. La bibliografía completa, las decisiones y los límites se recogen en [Investigación](../theatre-history.md) y [Memoria del modelo](../theatre-model.md).

## Comprobaciones reproducibles

| Evidencia | Qué comprueba |
| --- | --- |
| [Geometría](theatre-geometry.json) | 146 comprobaciones correctas. Construcción efectiva sobre el terreno final; 180 rayos de huecos libres, superficies superiores sin enterramientos, suelos continuos, rellanos sin caras duplicadas, 16 muestras de coronación sin huecos ni solapes, líneas de visión, corte y restauración de materiales. |
| [Guía e índice](theatre-guide-qa.json) | 286 comprobaciones correctas. Identificadores estables, 57 hechos, 17 hitos, 22 fuentes y 242 referencias resueltas; coordenadas y flags de cámara; conservación de las otras 31 visitas del índice territorial. |
| [Cámaras](theatre-cameras-qa.json) | 36 poses calculadas mediante el `preset()` real de la aplicación: 16 paradas, vista general y exterior, en escritorio y retrato. Encuadre dentro del espacio libre del panel y registro mediante el adaptador real del Simulador. |
| [Simulador](theatre-simulator-qa.json) | Constructor `buildHeritageModel('theatre')` real, igualdad de los buffers arquitectónicos, registro geográfico, terreno recortado, máscaras de pavimento y vegetación y barreras de colisión. |
| [Entorno](theatre-environs-qa.json) | Conservación de las trazas OSM, separación de la arquitectura, 21 copas interpretadas, muros y accesos; apoyo en el terreno sin acumular desplazamientos al repetirlo. |
| [Vegetación vecina](theatre-vegetation-qa.json) | Retirada de sólo dos pinos procedurales solapados con las copas PNOA del teatro; conservación exacta de los demás árboles, los siete cipreses y los 180 detalles del contexto vecino. |

Desde la raíz del repositorio:

```sh
node research/validation-v49/validate-theatre.mjs
python research/prepare-territory-visits.py
node research/validation-v49/validate-theatre-guide.mjs
node research/validation-v49/validate-theatre-environs.mjs
node research/validation-v49/export-theatre-cameras.mjs
node research/validation-v49/export-theatre-cameras.mjs --check
node research/validation-v49/validate-theatre-simulator.mjs
node research/build-territory-heritage.mjs
```

La construcción del worker requiere `esbuild@0.25.12`, como indica su script. Las pruebas de geometría cargan la copia de Three.js incluida en la aplicación. El constructor local reproduce las entradas del teatro, los parches patrimoniales cercanos, las calles y el terreno final; omite la Glorieta distante. Los archivos de encuadres reemplazan únicamente el valor del teatro y preservan los demás monumentos.

## Inspección visual de las mallas

Estas imágenes son **renders CPU de inspección**, no capturas WebGL ni fotografías. Se exportan las posiciones, normales, matrices, instancias, UV, colores y texturas procedurales reales de la aplicación. Blender utiliza su propia iluminación y sombreado. Las cámaras de inspección sirven para revisar el modelo; los encuadres de la visita se verifican por separado en el informe de cámaras.

[render-inspection.json](render-inspection.json) conserva la huella de los archivos de origen, las cámaras y la huella de cada imagen para identificar exactamente qué geometría se inspeccionó.

| Vista | Imagen |
| --- | --- |
| Conjunto y ladera | [teatro-conjunto.jpg](teatro-conjunto.jpg) |
| Escena y exedras | [teatro-escena.jpg](teatro-escena.jpg) |
| Cávea desde la orchestra | [teatro-cavea.jpg](teatro-cavea.jpg) |
| Cuerpo escénico desde el exterior | [teatro-exterior.jpg](teatro-exterior.jpg) |
| Remate superior | [teatro-corona.jpg](teatro-corona.jpg) |
| Corte didáctico del escenario | [teatro-corte.jpg](teatro-corte.jpg) |

Para reproducirlas, con Blender y `@napi-rs/canvas` disponibles:

```sh
node research/validation-v49/export-theatre-geometry.mjs --out /tmp/saguntum-theatre.json.gz
blender -b -t 8 --python research/validation-v49/render_theatre.py -- --input /tmp/saguntum-theatre.json.gz
```

El renderizador permite `--only` con nombres de imágenes separados por comas y `--output` para dirigir la salida a otra carpeta. La exportación pesada y sus texturas temporales no forman parte de la aplicación publicada.

## Interfaz y publicación

En la vista previa gestionada se comprobaron la entrada al Teatro Romano, la ocultación y reapertura de la información, las fuentes, el inicio y avance del recorrido, el plano de las 16 paradas y el enlace al Simulador conservando el vomitorio seleccionado. La numeración global sigue situando el Teatro Romano en la visita 14.

El navegador de comprobación comunica `GL_RENDERER = Disabled`. La interfaz y el plano se comprueban en su alternativa 2D; los resultados de geometría, cámaras y renders CPU son evidencia separada. No se atribuye a esta revisión una validación de fluidez, FPS o render GPU en ese navegador.

La versión, el despliegue y el árbol `dist/` publicado se registran en [SITES_SYNC.md](../../docs/SITES_SYNC.md). La comprobación posterior de la URL pública se guarda en [production-qa.json](production-qa.json).

## Alcance de la fidelidad

La referencia principal del estado rehabilitado es el [archivo de los autores en La Casa de la Arquitectura](https://lacasadelaarquitectura.es/recurso/restauracion-y-rehabilitacion-del-teatro-romano/3a26830f-f701-4c15-9cc6-c75f14d29933), contrastado con la [investigación arqueológica de 1993](https://revistas.um.es/car/article/download/68181/65651/283861), el [levantamiento anterior de Antonio Almagro](https://www.academiacolecciones.com/arquitectura/inventario.php?id=AA-013_03), las fotografías fechadas y las fuentes cartográficas.

El resultado sigue siendo una interpretación arquitectónica. Las dimensiones menores, irregularidades de fábrica, fragmentos, vegetación y parte de los niveles de circulación son aproximados. Las cotas del proyecto son relativas a su orchestra, no altitudes geográficas. Las imágenes sin fecha de toma no acreditan el estado exacto de noviembre de 2026. El corte es didáctico y no representa una reconstrucción completa del teatro romano original.
