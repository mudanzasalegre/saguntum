# Verificación V20 · Puerta del Circo Romano

La revisión usa la escena regional de producción, la geometría y las texturas de la aplicación. Las comprobaciones automáticas se complementan con una inspección de imágenes y de la interfaz. No constituyen un levantamiento arqueológico ni una medición de rendimiento WebGL.

## Resultado de cierre

- Escena integrada: **1.010 comprobaciones**, **156 cámaras**, sin errores. Incluye el encuadre general actual corregido y el rechazo de oclusiones por edificios del contexto propio.
- Recursos y enlaces: **414 comprobaciones**, sin fallos.
- Controladores de las catorce visitas: **37 comprobaciones**, sin fallos.
- Documentación y selección del plano: **23 comprobaciones**, sin fallos.
- Geografía: huellas y patios conservados, pavimento conectado, sin invasión del recinto arqueológico ni solapes con contextos anteriores.

Se revisan seis imágenes de geometría: conjunto, puerta, interior, tribuna, corte y trazado histórico. El plano y la navegación documental se comprueban además en la interfaz real.

## Evidencia y geografía

- `circo-documentation-qa.json`: referencias de cada hecho, regiones, cronología, coincidencia de coordenadas entre cuaderno/plano/modelo y las dos escalas del mapa. Incluye selección de polígonos anidados, además de los marcadores.
- `circo-context-geography-qa.json`: conservación de huellas, patios, plaza y recinto; ausencia de solapes con edificios o excavación; continuidad de pavimento y registro de puntos de observación.
- `circo-geometry-metadata.json`: dimensiones usadas, colocación aproximada, focos y límites documentales del modelo.

La plaza procede del polígono OSM; los edificios, de las huellas y partes catastrales del atlas. Un complemento de acera une el borde público de la plaza y el recinto con Remedio. Se comprobó específicamente porque la primera inspección dejaba ver una franja de ortofotografía entre ambas superficies.

## Escena y cámaras

`../validate_sagunto_v20.mjs` ejecuta el constructor regional y los encuadres reales de `app.js`, sustituyendo únicamente la carga de texturas para poder trabajar fuera del navegador. Comprueba recuperación tras fallo de carga, propiedad de recursos, una única instancia de cada conjunto, geometría finita, restauración de materiales y transiciones arqueológicas.

La matriz incluye las veinte paradas, los modos Corte e Histórica del conjunto y cuatro observaciones de Domus/Pòrtic. Cada caso se comprueba en escritorio, teléfono vertical y teléfono horizontal, tanto general como cercano. Los rayos utilizan terreno, edificios y recortes activos, y comprueban también el espacio inmediato de las observaciones interiores.

La inspección corrigió las cámaras de umbral, interior, muros y graderío. La vista histórica general se hizo más cenital para reducir la ocultación de la cavea por los edificios exteriores que siguen presentes. Una última comprobación detectó que la cámara general actual se alejaba detrás de una fachada en móvil y horizontal. Se elevó su dirección de observación, conservando las cámaras cercana y de corte. La validación distingue ahora expresamente el contexto urbano propio del objetivo arqueológico; una fachada del mismo conjunto no cuenta como un impacto válido sobre los restos.

## Interfaz

`visit-controller-results.json` comprueba los catorce cuadernos, progreso independiente, navegación, fuentes, cronología y ausencia de un control de sección duplicado. `static-assets-qa.json` comprueba sintaxis, imports locales, recursos, IDs, datos y enlaces de las paradas.

En Chrome se comprobó la portada general de 31 lugares/6 ámbitos, acceso al Circo desde el catálogo, inicio de recorrido, paso al plano ampliado, selección de la parada histórica, cambio de escala de 14 a 7 marcadores, Cronología, Fuentes y regreso a Domus. `circo-plan-ui.jpg` es una captura real de esa interfaz.

El navegador de pruebas informa que WebGL no está disponible. La interfaz documental sí se ha comprobado allí; no se afirma una prueba visual GPU ni una tasa de fotogramas.

## Imágenes de geometría

`render_circo.py` usa Blender/Cycles CPU para inspeccionar las mallas, normales, UV, colores, materiales y texturas exportadas de Three.js. La iluminación es una aproximación para revisión visual. Las imágenes no son capturas de la aplicación ni imágenes generadas por IA.

Las escenas de revisión son conjunto, puerta, interior, tribuna, corte y vista histórica. Los archivos de geometría comprimida y los logs son cachés reproducibles excluidas del repositorio; las imágenes, metadatos y resultados se conservan junto al código.

## Reproducción

```sh
python research/validation-v20/prepare_circo_context.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v20/build-circo-plan.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v20/validate_circo_documentation.mjs
node research/validation-v20/validate_visit_controllers.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v20.mjs --export
blender -b -t 4 --python research/validation-v20/render_circo.py -- --scene circo-puerta --full --samples 64
python research/validation-v20/validate_static_assets.py
```

El mapa comparte coordenadas con los focos. La profundidad de excavación, las cotas de las estructuras y los alzados perdidos siguen siendo aproximados. La coronación no se completa; el cierre occidental, las filas de madera y las metas se presentan como hipótesis opcionales.
