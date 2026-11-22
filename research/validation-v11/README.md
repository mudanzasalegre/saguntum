# Verificación V11 · Judería y Portalet de la Sang

Revisión del 19 de noviembre de 2026. La comprobación distingue la geometría, su integración en el atlas, la interfaz y los renders de inspección. Las pruebas del navegador se realizaron en el modo 2D de compatibilidad porque ese entorno tiene WebGL desactivado.

## Informes reproducibles

| Área | Alcance | Evidencia |
| --- | --- | --- |
| Integración del atlas | Constructor regional real, cámaras, terreno, cortes anteriores, reintento y descarga de recursos | `sagunto-regression.json` |
| Modelo de la judería | Portales, cubiertas, hastiales, materiales, cámaras y umbrales | `juderia-model-qa.json` |
| Contexto urbano | Cuerpos catastrales, pavimentos, cámaras y seis variantes del plano | `juderia-context-qa.json` |
| Geografía y exclusiones | Identidad de parcelas, patios y protección de los monumentos ya modelados | `juderia-context-geography-qa.json` |
| Controlador de las cinco visitas | Navegación, progreso independiente, leyendas, fuentes y secciones | `visit-controller-results.json` |
| Distribución | Sintaxis, imports, JSON, solicitudes iniciales y diferidas, identificadores y fuentes | `static-assets-qa.json` |
| Interfaz | Navegación en escritorio y móvil, plano seleccionable, apariencias y catálogo | `juderia-v11-browser-evidence.json` y capturas JPG |

Los informes guardan las huellas de los archivos usados. La correspondencia de esas huellas con la distribución terminada se comprueba antes del empaquetado. El dossier histórico explica los límites de las fuentes; aprobar una comprobación geométrica no convierte un detalle interpretativo en una medición arqueológica.

Resultados finales: **2.129 comprobaciones de integración**, **619 del modelo**, **314 del contexto**, **20 geográficas**, **29 del controlador** y **281 de distribución**, todas aprobadas. Los hashes de los informes coinciden con los archivos terminados. Las comprobaciones de cada área tienen objetivos distintos y no se suman como si fueran pruebas independientes de rendimiento.

## Visita, cámaras e integración

La visita contiene **16 paradas, 48 notas referenciadas, 16 hitos, 21 fuentes y 5 ámbitos**. Las coordenadas y títulos del plano coinciden con los destinos del modelo. Los puntos sobre vecinos, oficios o edificios discutidos se explican como focos de lectura, sin atribuir viviendas concretas a personas históricas.

La prueba integral ejecuta el constructor regional y el encuadre de `app.js`; sustituye solamente la carga de texturas que necesita navegador. Revisa **102 variantes de cámara de la judería**, combinando conjunto o parada, vista completa o próxima y tres tamaños: 1363 × 936, 390 × 844 y 844 × 390. También conserva las 102 variantes de cada visita del teatro, Santa María y Plaça Major.

Se comprueba que la cámara queda sobre el terreno final, que su destino está en el espacio visible de la interfaz, que la vista completa encuadra sus límites y que los monumentos vecinos, el caserío y la ciudad no ocultan ese destino. Las vistas próximas pueden recortar deliberadamente un conjunto. El modelo principal revisa además sus líneas de visión contra su propia arquitectura; el contexto añade 54 líneas de observación.

Al entrar en la judería sin una parada seleccionada, la aplicación usa el mismo encuadre de barrio que la primera parada. El entorno exterior sigue presente en la escena, pero no obliga a alejar la cámara hasta abarcar todo ese contexto. Los ajustes de cámara no mueven los edificios.

La integración preserva los cortes arqueológicos anteriores, la carga diferida de regiones, la retirada de una escena incompleta tras un fallo de textura y el reintento. También comprueba que materiales, geometrías y texturas se liberan una sola vez al descargar una región, incluso después de la lectura por capas. La interfaz conserva sus **31 lugares y seis ámbitos territoriales**.

## Geometría y continuidad del suelo

El núcleo conserva **12 parcelas y 40 cuerpos**; el contexto añade **344 partes de 146 parcelas y tres patios**. Sus 172 alturas IGN y 172 alturas por plantas catastrales mantienen su procedencia. Se excluyen los volúmenes genéricos que duplicarían la arquitectura detallada. Dos cuerpos de la parcela del teatro, inicialmente capturados por contacto marginal, quedan fuera del caserío mediante protección cartográfica y selección por centro o mayoría de superficie.

Las aperturas de los tres portales se comprueban con rayos. Las 40 cubiertas reciben sondeos verticales y los hastiales reciben rayos horizontales; estas dos comprobaciones responden a riesgos diferentes. La inspección visual detectó también una separación bajo la coronación del portal, que se corrigió y quedó cubierta por sondeos específicos.

El contorno perforado del portal producía además caras coplanares espurias donde el hueco alcanzaba la base. Se sustituyó por un contorno en U abierto por abajo y se adaptó el drenaje a la pendiente final. Nueve sondeos adicionales comprueban que el paso muestra el pavimento continuo. La separación de 10,5 cm sobre la malla del terreno es un margen gráfico de representación, no una medición del pavimento histórico.

La revisión próxima del pavimento encontró dos problemas que no detectaba una simple comparación de alturas:

1. Los parches planos bajo las casas alteraban el terreno de las calles estrechas. Al retirarlos se conservan las huellas y las alturas domésticas; la diferencia máxima del perfil de Sang Vella respecto al MDT baja de 1,361 m a unos 6,7 cm. El diagnóstico conserva ambas configuraciones para poder reproducir la comparación.
2. Las franjas independientes de pavimento dejaban huecos en los cambios de dirección. Se sustituyeron por una unión poligonal de los trazados, recortada contra las fachadas, y se teseló sobre la misma cuadrícula del terreno. La revisión comprueba la cobertura de los puntos que aparecían negros en las imágenes, además de las cotas de caras y aristas.

`diagnose_juderia_streets.mjs` y `juderia-street-diagnosis.json` documentan el perfil. `prepare_juderia_pavement.py` conserva el procedimiento de generación del pavimento. Las huellas de los edificios no se desplazan para corregir el suelo. Los ajustes de anchura y acabados del callejón son interpretativos, apoyados en su relación visible con las fachadas.

## Interfaz y planos

La prueba del navegador verifica **Recorrido, Cronología y Fuentes**, el diálogo de una referencia municipal, la etiqueta **En discusión** de la sinagoga y la ausencia de un corte hipotético en la parada del posible baño ritual. El regreso a las cinco visitas detalladas mantiene sus propios paneles y progresos.

El plano muestra 16 destinos y se comprueba en minimapa, diálogo grande y móvil, con ambas apariencias. Los números desplazados para mantener la legibilidad conservan guías hacia su coordenada. Un clic directo en el marcador 11 de escritorio abre el posible baño ritual; el marcador 15 del plano móvil abre la parada de 1391. Las listas de botones ofrecen los mismos destinos.

En **390 × 844** se comprueba un ancho de documento de 390 px, sin desbordamiento horizontal; el panel ocupa la mitad inferior. En **844 × 390** el documento también conserva su ancho y el avance muestra el título de la nueva parada. La lectura por capas presenta sus cinco categorías. La página temporal de tamaños se retiró antes de validar y empaquetar la distribución.

El verificador estático revisa 51 módulos JavaScript, 95 imports locales, 64 JSON, 30 solicitudes iniciales, 16 diferidas y 110 identificadores HTML únicos. También valida los identificadores de fuentes y paradas.

## Imágenes y límites de verificación

Los JPG son capturas del navegador con la interfaz y la cartografía en modo 2D. El registro de ese navegador informa `GL_VENDOR = Disabled` y `GL_RENDERER = Disabled`. Esta revisión no mide rendimiento GPU ni certifica el aspecto exacto de las sombras WebGL.

Los PNG de conjunto, Portalet y Sang Vella se generan en Blender Cycles CPU a partir de las mallas Three.js exportadas en `juderia-geometry.json.gz`, junto con el terreno, el caserío detallado y los monumentos civiles y religiosos próximos. El caserío lejano y todas las piezas del atlas no se exportan para estas vistas locales. Los materiales procedurales y la iluminación del render de inspección pueden diferir de la aplicación. Son evidencia de geometría y composición, no fotografías ni imágenes generadas para simular un modelo inexistente.

Las plantas y el relieve proceden de cartografía; huecos domésticos, acabados, pendientes de cubierta y dimensiones menores tienen una precisión inferior. La navegación continúa siendo orbital con puntos cercanos de observación. No se acredita una simulación peatonal en primera persona.

## Reproducir

Desde la raíz del repositorio:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v11.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v11/validate_juderia_model.mjs --export
node --experimental-loader ./research/validate_loader.mjs research/validation-v11/validate_juderia_context.mjs
python research/validation-v11/validate_juderia_context_geography.py
node research/validation-v11/validate_visit_controller.mjs
python research/validation-v11/validate_static_assets.py
blender -b --python research/validation-v11/render_juderia.py
```
