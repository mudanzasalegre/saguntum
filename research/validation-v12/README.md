# V12 · Verificación del Calvario y la ermita de la Soledad

Revisión del 19 de noviembre de 2026. La edición añade una sexta visita detallada y conserva los 31 lugares del atlas. El Calvario tiene 18 paradas en cinco ámbitos, 54 notas históricas, doce hitos y dieciocho referencias documentales y cartográficas.

## Resultados

| Ámbito | Resultado | Evidencia |
| --- | --- | --- |
| Núcleo del Calvario y terreno ensamblado | 494 comprobaciones correctas | `calvario-model-qa.json` |
| Caserío, pavimento exterior y plano Canvas | 282 comprobaciones correctas | `calvario-context-qa.json` |
| Conservación de la cartografía del entorno | 26 comprobaciones correctas | `calvario-context-geography-qa.json` |
| Controlador común de las seis visitas | 34 comprobaciones correctas | `visit-controller-results.json` |
| Constructor regional real, cámaras y recursos | 2.651 comprobaciones correctas | `sagunto-regression.json` |
| Distribución estática, módulos y referencias | 296 comprobaciones correctas | `static-assets-qa.json` |
| Interfaz en navegador | Trece comprobaciones de flujo completadas | `browser-qa.json` |

Los recuentos son aserciones dentro de cada comprobación reproducible. Los informes incluyen el detalle y, cuando corresponde, los hashes de sus entradas. Las comprobaciones del controlador utilizan un adaptador DOM mínimo; las capturas y la navegación real del navegador se documentan por separado.

## Geometría, terreno y continuidad

El núcleo verifica los 18 focos en **108 encuadres**: vista general y próxima, en escritorio, móvil vertical y móvil horizontal. La regresión utiliza el `preset` y el constructor regional de la aplicación y añade la vista sin parada seleccionada: **114 encuadres del Calvario**, sin obstrucción del entorno ni del relieve y con los focos dentro del área libre de paneles. Conserva también las visitas anteriores, los cortes arqueológicos y la recuperación de una carga regional fallida.

Se revisaron **31.784 muestras de caras y aristas del pavimento**, además de sus vértices. El pavimento queda por encima del terreno final y sus cantos cierran el espesor hasta penetrar en la ladera: **2.022 bordes y 8.062 muestras**, sin huecos de apoyo. Este cierre conserva todas las posiciones de la superficie superior. Los once paños de fachada y perímetro se comprobaron con **344 muestras**, separadas como máximo 25 cm; todos penetran en el terreno. Se verifican asimismo los ocho peldaños de la portada y el encuentro con el umbral.

Sólo se excluyen del trazado genérico las tres vías efectivamente reemplazadas por la subida y sus escaleras. Los otros cinco ejes permanecen completos, incluida la conexión hacia el Castillo. Los ocho muros cartografiados conservan sus trazas. Las once representaciones de casalicios y los veinte cipreses son una composición interpretativa, no un inventario topográfico de cada pieza.

El contexto conserva **156 partes de 60 parcelas**, tres patios y diez tramos exteriores. Las alturas proceden de 71 estimaciones IGN y 85 derivaciones de plantas catastrales. Las dos correcciones visuales de cubierta alcanzan 0,470 m en el ensayo aislado del contexto y aproximadamente **0,510 m en el terreno ensamblado** con vías, superficies y cimentaciones del atlas. Son terrenos de prueba distintos; no se atribuye la diferencia a un único parche. Las huellas originales y las calles no se desplazan ni se aplanan para corregir esas cubiertas.

El informe regional conserva observaciones de visibilidad en el modo actual de yacimientos anteriores. Esas observaciones no se presentan como nuevas vistas revisadas del Calvario ni como un rediseño de los yacimientos en esta edición.

## Plano, lectura y adaptación

La leyenda usa exactamente las cinco categorías y colores del modelo: camino, ermita, cerámica, conservación y paisaje. Cada parada tiene una `readingLayer` independiente de su `period` histórico. Las viviendas y calles de contexto permanecen neutras. El marcador seleccionado conserva el color de su capa y se distingue mediante un aro adicional.

Se comprobaron seis planos Canvas: minimapa, plano ampliado y móvil, en ambos temas. Los dieciocho marcadores se pueden seleccionar; sus números mantienen un contraste mínimo de **5,10:1**. El plano ampliado representa curvas de nivel cada cinco metros.

La prueba de navegador verificó inicio, avance y retroceso, enlaces de parada, cronología, bibliografía, diálogo de una fuente con localizador, selección desde el Canvas y desde la lista, navegación por teclado y progreso independiente. Los accesos a Judería, Teatro, Castillo, Plaça Major y Santa María siguen funcionando. El atlas general conserva quince lugares de Sagunto y 31 entradas en total.

Los formatos **390 × 844** y **844 × 390** se probaron en un iframe de dimensiones conocidas. Un desbordamiento producido por la animación oculta de carga se corrigió limitándola a su contenedor; los anchos finales del documento coinciden con ambos tamaños. El título de la parada recibe el foco y permanece visible. El archivo temporal de prueba se retiró de `dist` antes de validar el paquete.

Capturas: `calvario-desktop.jpg`, `calvario-map-light.jpg`, `calvario-mobile-portrait.jpg`, `calvario-mobile-landscape.jpg` y `calvario-mobile-map.jpg`.

## Revisión visual y límites

Los renders `calvario-conjunto.png`, `calvario-ermita.png` y `calvario-camino.png` proceden de las mallas Three.js exportadas con posiciones, normales, UV, colores y mapas Canvas. Se generan con Blender/Cycles por CPU, a 128 muestras. No se añaden edificios de presentación ni arquitectura ausente de la aplicación. El acta `calvario-visual-review.json` identifica el export y las imágenes revisadas.

La comparación con la referencia de restauración de 2012 llevó a representar la puerta como hojas grises rectangulares bajo el arco blanco, reducir los paneles dentro de las hornacinas y aclarar la escalinata. Se ajustaron el sombreado de los cipreses y los encuentros de fachada y pavimento con la ladera.

**El navegador gestionado declara `GL_RENDERER=Disabled`.** Las capturas acreditan la interfaz y la alternativa de plano e historia. Los renders CPU y las pruebas de mallas acreditan la geometría inspeccionada, pero no certifican fluidez, rendimiento GPU ni igualdad exacta de iluminación entre Cycles y WebGL. La obra es una maqueta interpretativa sobre cartografía real; no se presenta como fotogrametría, interior medido ni navegación peatonal libre.

## Reproducción

Desde la raíz del repositorio, con las dependencias del entorno disponibles:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v12/validate_calvario_model.mjs --export
node --experimental-loader ./research/validate_loader.mjs research/validation-v12/validate_calvario_context.mjs
python research/validation-v12/validate_calvario_context_geography.py
node research/validation-v12/validate_visit_controller.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v12.mjs
python research/validation-v12/validate_static_assets.py
blender -b --python research/validation-v12/render_calvario.py
```

La validación del núcleo deriva de nuevo el plano desde el modelo. Los scripts Canvas utilizan `@napi-rs/canvas` en `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. El render requiere el export generado por `--export`; los recursos de trabajo no forman parte del paquete estático publicado.
